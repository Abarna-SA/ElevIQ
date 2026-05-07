import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart' hide PaymentMethod;
import '../../data/models/expense_model.dart';
import '../../data/expense_service.dart';

class AddExpensePage extends ConsumerStatefulWidget {
  final ExpenseModel? expense; // For editing

  const AddExpensePage({super.key, this.expense});

  @override
  ConsumerState<AddExpensePage> createState() => _AddExpensePageState();
}

class _AddExpensePageState extends ConsumerState<AddExpensePage> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _vendorController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedCategoryId = 'food';
  PaymentMethod _selectedPayment = PaymentMethod.upi;
  DateTime _selectedDate = DateTime.now();
  bool _isSubmitting = false;

  // Fuel metadata fields
  final _litersController = TextEditingController();
  final _ratePerLiterController = TextEditingController();
  final _odometerController = TextEditingController();
  FuelType _selectedFuelType = FuelType.petrol;
  bool _isFullTank = false;

  // Food metadata fields
  final _tipController = TextEditingController();
  final _gstController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.expense != null) {
      _populateFromExpense(widget.expense!);
    }
  }

  void _populateFromExpense(ExpenseModel expense) {
    _amountController.text = expense.amount.toString();
    _descriptionController.text = expense.description;
    _vendorController.text = expense.vendor;
    _notesController.text = expense.notes ?? '';
    _selectedCategoryId = expense.categoryId;
    _selectedPayment = expense.paymentMethod;
    _selectedDate = expense.date;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    _vendorController.dispose();
    _notesController.dispose();
    _litersController.dispose();
    _ratePerLiterController.dispose();
    _odometerController.dispose();
    _tipController.dispose();
    _gstController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isEditing = widget.expense != null;
    final selectedCat = getCategoryById(_selectedCategoryId);

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Expense' : 'Add Expense'),
        centerTitle: true,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.close),
        ),
        actions: [
          TextButton(
            onPressed: _isSubmitting ? null : _submitExpense,
            child: _isSubmitting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(isEditing ? 'Save' : 'Add', style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Amount Field (Hero) ──
            _buildAmountField(theme, isDark),
            const SizedBox(height: 24),

            // ── Category Selector ──
            _buildSectionTitle('Category'),
            const SizedBox(height: 10),
            _buildCategoryGrid(isDark),
            const SizedBox(height: 24),

            // ── Description ──
            _buildTextField(
              controller: _descriptionController,
              label: 'Description',
              hint: 'What did you spend on?',
              icon: Icons.description_outlined,
              isDark: isDark,
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            // ── Vendor ──
            _buildTextField(
              controller: _vendorController,
              label: 'Store/Vendor',
              hint: selectedCat?.formType == 'fuel' ? 'Station name' :
                    selectedCat?.formType == 'food' ? 'Restaurant name' : 'Store name',
              icon: Icons.store_outlined,
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            // ── Date ──
            _buildDateSelector(theme, isDark),
            const SizedBox(height: 16),

            // ── Payment Method ──
            _buildSectionTitle('Payment Method'),
            const SizedBox(height: 10),
            _buildPaymentSelector(isDark),
            const SizedBox(height: 24),

            // ── Category-Specific Fields ──
            if (selectedCat?.formType == 'fuel') ..._buildFuelFields(isDark),
            if (selectedCat?.formType == 'food') ..._buildFoodFields(isDark),

            // ── Notes ──
            _buildTextField(
              controller: _notesController,
              label: 'Notes (optional)',
              hint: 'Any additional details...',
              icon: Icons.note_outlined,
              isDark: isDark,
              maxLines: 3,
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  /// ── Amount Field ──
  Widget _buildAmountField(ThemeData theme, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Column(
        children: [
          Text('Amount', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6), fontSize: 14)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('₹', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w300, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5))),
              const SizedBox(width: 4),
              IntrinsicWidth(
                child: TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w800),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    hintText: '0',
                    contentPadding: EdgeInsets.zero,
                    isDense: true,
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Enter amount';
                    if (double.tryParse(v) == null || double.parse(v) <= 0) return 'Invalid';
                    return null;
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// ── Category Grid ──
  Widget _buildCategoryGrid(bool isDark) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: kDefaultCategories.map((cat) {
        final isSelected = _selectedCategoryId == cat.id;
        return GestureDetector(
          onTap: () => setState(() => _selectedCategoryId = cat.id),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected
                  ? cat.color.withOpacity(0.15)
                  : Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
              border: isSelected ? Border.all(color: cat.color, width: 2) : Border.all(color: Colors.transparent, width: 2),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(cat.icon, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 6),
                Text(
                  cat.name,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? cat.color : null,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  /// ── Payment Selector ──
  Widget _buildPaymentSelector(bool isDark) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: PaymentMethod.values.map((pm) {
        final isSelected = _selectedPayment == pm;
        return GestureDetector(
          onTap: () => setState(() => _selectedPayment = pm),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected
                  ? Theme.of(context).colorScheme.primary.withOpacity(0.15)
                  : Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
              border: isSelected
                  ? Border.all(color: Theme.of(context).colorScheme.primary, width: 2)
                  : Border.all(color: Colors.transparent, width: 2),
            ),
            child: Text(
              pm.displayName,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Theme.of(context).colorScheme.primary : null,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  /// ── Date Selector ──
  Widget _buildDateSelector(ThemeData theme, bool isDark) {
    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: _selectedDate,
          firstDate: DateTime(2020),
          lastDate: DateTime.now(),
        );
        if (picked != null) setState(() => _selectedDate = picked);
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Icon(Icons.calendar_today_outlined, size: 20, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Date', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5))),
                const SizedBox(height: 2),
                Text(
                  _formatDate(_selectedDate),
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface),
                ),
              ],
            ),
            const Spacer(),
            Icon(Icons.chevron_right, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3)),
          ],
        ),
      ),
    );
  }

  /// ── Text Field Builder ──
  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    required bool isDark,
    String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
        filled: true,
        fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
      ),
    );
  }

  /// ── Fuel Fields ──
  List<Widget> _buildFuelFields(bool isDark) {
    return [
      _buildSectionTitle('Fuel Details'),
      const SizedBox(height: 10),
      // Fuel type
      Wrap(
        spacing: 8,
        children: FuelType.values.map((ft) {
          final isSelected = _selectedFuelType == ft;
          return GestureDetector(
            onTap: () => setState(() => _selectedFuelType = ft),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFF59E0B).withOpacity(0.15) : Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
                border: isSelected ? Border.all(color: const Color(0xFFF59E0B), width: 2) : Border.all(color: Colors.transparent, width: 2),
              ),
              child: Text(ft.displayName, style: TextStyle(
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? const Color(0xFFF59E0B) : null,
              )),
            ),
          );
        }).toList(),
      ),
      const SizedBox(height: 12),
      Row(
        children: [
          Expanded(
            child: _buildTextField(
              controller: _litersController,
              label: 'Liters',
              hint: '0.0',
              icon: Icons.local_gas_station_outlined,
              isDark: isDark,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildTextField(
              controller: _ratePerLiterController,
              label: '₹/Liter',
              hint: '0.0',
              icon: Icons.attach_money_outlined,
              isDark: isDark,
            ),
          ),
        ],
      ),
      const SizedBox(height: 12),
      _buildTextField(
        controller: _odometerController,
        label: 'Odometer (optional)',
        hint: 'Current reading',
        icon: Icons.speed_outlined,
        isDark: isDark,
      ),
      Row(
        children: [
          Checkbox(
            value: _isFullTank,
            onChanged: (v) => setState(() => _isFullTank = v ?? false),
          ),
          const Text('Full tank fill'),
        ],
      ),
      const SizedBox(height: 16),
    ];
  }

  /// ── Food Fields ──
  List<Widget> _buildFoodFields(bool isDark) {
    return [
      _buildSectionTitle('Dining Details'),
      const SizedBox(height: 10),
      Row(
        children: [
          Expanded(
            child: _buildTextField(
              controller: _tipController,
              label: 'Tip',
              hint: '₹0',
              icon: Icons.volunteer_activism_outlined,
              isDark: isDark,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildTextField(
              controller: _gstController,
              label: 'GST',
              hint: '₹0',
              icon: Icons.receipt_outlined,
              isDark: isDark,
            ),
          ),
        ],
      ),
      const SizedBox(height: 16),
    ];
  }

  /// ── Section Title ──
  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
    );
  }

  /// ── Submit ──
  Future<void> _submitExpense() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final amount = double.parse(_amountController.text);
      final cat = getCategoryById(_selectedCategoryId);
      final service = ExpenseService();

      // Build metadata
      ExpenseMetadata? metadata;
      if (cat?.formType == 'fuel') {
        final liters = double.tryParse(_litersController.text) ?? 0;
        final rate = double.tryParse(_ratePerLiterController.text) ?? 0;
        metadata = ExpenseMetadata(
          type: 'fuel',
          data: FuelMetadata(
            fuelType: _selectedFuelType,
            liters: liters,
            ratePerLiter: rate,
            odometerReading: double.tryParse(_odometerController.text),
            isFullTank: _isFullTank,
            stationName: _vendorController.text.isNotEmpty ? _vendorController.text : null,
          ),
        );
      } else if (cat?.formType == 'food') {
        final tip = double.tryParse(_tipController.text);
        final gst = double.tryParse(_gstController.text);
        if (tip != null || gst != null) {
          metadata = ExpenseMetadata(
            type: 'food',
            data: FoodMetadata(
              restaurantName: _vendorController.text.isNotEmpty ? _vendorController.text : null,
              tipAmount: tip,
              gstAmount: gst,
            ),
          );
        }
      }

      await service.addExpense(
        amount: amount,
        category: cat?.name ?? 'Others',
        categoryId: _selectedCategoryId,
        description: _descriptionController.text,
        date: _selectedDate,
        paymentMethod: _selectedPayment,
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
        location: null,
        tags: null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Expense added! 🎉'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        context.pop();
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

  String _formatDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateDay = DateTime(date.year, date.month, date.day);

    if (dateDay == today) return 'Today';
    if (dateDay == today.subtract(const Duration(days: 1))) return 'Yesterday';
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
