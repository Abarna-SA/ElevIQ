import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart' hide PaymentMethod;
import '../../data/models/expense_model.dart';
import '../../data/expense_service.dart';
import 'receipt_scanner_widget.dart';

class AddExpenseSheet extends ConsumerStatefulWidget {
  const AddExpenseSheet({super.key});

  @override
  ConsumerState<AddExpenseSheet> createState() => _AddExpenseSheetState();
}

class _AddExpenseSheetState extends ConsumerState<AddExpenseSheet> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0; // 0: Category, 1: Details, 2: Review

  // Form Field Controllers
  final _amountController = TextEditingController();
  final _vendorController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedCategoryId = '';
  PaymentMethod _selectedPayment = PaymentMethod.upi;
  DateTime _selectedDate = DateTime.now();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _amountController.dispose();
    _vendorController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _handleOCRData(Map<String, dynamic> data) {
    if (data['vendor'] != null) {
      _vendorController.text = data['vendor'].toString();
    }
    if (data['total'] != null) {
      _amountController.text = data['total'].toString();
    }
    if (data['date'] != null) {
      try {
        _selectedDate = DateTime.parse(data['date'].toString());
      } catch (_) {}
    }
    // Handle items if needed in notes
    if (data['items'] != null && (data['items'] as List).isNotEmpty) {
      final items = (data['items'] as List).map((e) => "\${e['quantity']}x \${e['name']} - ₹\${e['subtotal']}").join('\\n');
      _notesController.text = "Items:\\n\$items\\n\\n\${_notesController.text}";
    }
    setState(() {});
  }

  Future<void> _submitExpense() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSubmitting = true);
    
    try {
      final amount = double.parse(_amountController.text);
      final cat = getCategoryById(_selectedCategoryId);
      final service = ExpenseService();
      
      await service.addExpense(
        amount: amount,
        category: cat?.name ?? 'Others',
        categoryId: _selectedCategoryId,
        description: cat?.name ?? 'Expense', // default description
        date: _selectedDate,
        paymentMethod: _selectedPayment,
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
        vendor: _vendorController.text.isNotEmpty ? _vendorController.text : null,
        location: null,
        tags: null,
      );
      
      if (mounted) {
        context.pop(); // Close sheet
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Expense added! 🎉'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Widget _buildStepIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: List.generate(3, (index) {
          final isActive = index <= _currentStep;
          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              height: 4,
              decoration: BoxDecoration(
                color: isActive ? Colors.blue : Theme.of(context).disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCategoryStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Text('Select an expense category', style: TextStyle(color: Colors.grey)),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(24),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.9,
            ),
            itemCount: kDefaultCategories.length,
            itemBuilder: (context, index) {
              final cat = kDefaultCategories[index];
              final isSelected = _selectedCategoryId == cat.id;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedCategoryId = cat.id;
                    _currentStep = 1; // Move to next step automatically
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: isSelected ? cat.color.withValues(alpha: 0.15) : Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: isSelected ? Border.all(color: cat.color, width: 2) : Border.all(color: Theme.of(context).dividerColor, width: 1),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(cat.icon, style: const TextStyle(fontSize: 28)),
                      const SizedBox(height: 8),
                      Text(
                        cat.name,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? cat.color : null,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsStep() {
    final cat = getCategoryById(_selectedCategoryId);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          ReceiptScannerWidget(
            category: cat?.formType ?? 'generic',
            onScanComplete: _handleOCRData,
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _vendorController,
            decoration: const InputDecoration(
              labelText: 'Vendor / Store',
              hintText: 'e.g., BigBazaar, D-Mart',
            ),
          ),
          const SizedBox(height: 16),
          // Total Amount Field Custom
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.dividerColor),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total Amount', style: TextStyle(fontWeight: FontWeight.w500, color: theme.colorScheme.onSurface.withOpacity(0.7))),
                Row(
                  children: [
                    Text('₹', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.5))),
                    const SizedBox(width: 4),
                    SizedBox(
                      width: 100,
                      child: TextFormField(
                        controller: _amountController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        textAlign: TextAlign.right,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        decoration: const InputDecoration(
                          hintText: '0',
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Required';
                          if (double.tryParse(v) == null) return 'Invalid';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Date & Payment
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now(),
                    );
                    if (picked != null) setState(() => _selectedDate = picked);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: theme.dividerColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Date', style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface.withOpacity(0.5))),
                        const SizedBox(height: 4),
                        Text('\${_selectedDate.day}/\${_selectedDate.month}/\${_selectedDate.year}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Text('Payment', style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface.withOpacity(0.5))),
                      ),
                      DropdownButtonHideUnderline(
                        child: DropdownButton<PaymentMethod>(
                          value: _selectedPayment,
                          isExpanded: true,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          items: PaymentMethod.values.map((pm) {
                            return DropdownMenuItem(value: pm, child: Text(pm.displayName, style: const TextStyle(fontWeight: FontWeight.w600)));
                          }).toList(),
                          onChanged: (pm) => setState(() => _selectedPayment = pm!),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _notesController,
            maxLines: 2,
            decoration: const InputDecoration(
              labelText: 'Notes (Optional)',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewStep() {
    final cat = getCategoryById(_selectedCategoryId);
    final theme = Theme.of(context);
    
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Text(cat?.icon ?? '', style: const TextStyle(fontSize: 32)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _vendorController.text.isNotEmpty ? _vendorController.text : (cat?.name ?? 'Expense'),
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '\${_selectedDate.day}/\${_selectedDate.month}/\${_selectedDate.year}',
                          style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.5)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Divider(),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Amount', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(
                    '₹\${_amountController.text}',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            const Text('Payment Method: ', style: TextStyle(color: Colors.grey)),
            Text(_selectedPayment.displayName, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
        if (_notesController.text.isNotEmpty) ...[
          const SizedBox(height: 8),
          const Text('Notes:', style: TextStyle(color: Colors.grey)),
          Text(_notesController.text),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cat = getCategoryById(_selectedCategoryId);
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.only(left: 8, right: 8, top: 12, bottom: 4),
            child: Row(
              children: [
                if (_currentStep > 0)
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => setState(() => _currentStep--),
                  )
                else
                  const SizedBox(width: 48),
                Expanded(
                  child: Text(
                    _currentStep == 0 ? 'Add Expense' 
                    : _currentStep == 1 ? '\${cat?.icon} \${cat?.name}' 
                    : 'Review & Save',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => context.pop(),
                ),
              ],
            ),
          ),
          
          _buildStepIndicator(),
          
          Expanded(
            child: _currentStep == 0 ? _buildCategoryStep() 
                 : _currentStep == 1 ? _buildDetailsStep() 
                 : _buildReviewStep(),
          ),
          
          // Footer
          if (_currentStep > 0)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _currentStep--),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(_currentStep == 1 ? 'Back' : 'Edit'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        if (_currentStep == 1) {
                          if (_formKey.currentState!.validate()) {
                            setState(() => _currentStep++);
                          }
                        } else {
                          _submitExpense();
                        }
                      },
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isSubmitting 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(_currentStep == 1 ? 'Continue' : 'Save Expense'),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
