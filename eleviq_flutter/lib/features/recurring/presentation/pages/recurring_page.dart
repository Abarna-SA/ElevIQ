import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import 'package:intl/intl.dart';

// ── Models ──
class RecurringExpense {
  final String id;
  final String description;
  final double amount;
  final String categoryId;
  final String frequency; // 'daily', 'weekly', 'monthly', 'yearly'
  final DateTime nextDue;
  final bool isActive;

  RecurringExpense({
    required this.id,
    required this.description,
    required this.amount,
    required this.categoryId,
    required this.frequency,
    required this.nextDue,
    required this.isActive,
  });

  factory RecurringExpense.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return RecurringExpense(
      id: doc.id,
      description: data['description'] ?? '',
      amount: (data['amount'] ?? 0).toDouble(),
      categoryId: data['categoryId'] ?? 'other',
      frequency: data['frequency'] ?? 'monthly',
      nextDue: (data['nextDue'] as Timestamp?)?.toDate() ?? DateTime.now(),
      isActive: data['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toMap(String userId) {
    return {
      'userId': userId,
      'description': description,
      'amount': amount,
      'categoryId': categoryId,
      'frequency': frequency,
      'nextDue': Timestamp.fromDate(nextDue),
      'isActive': isActive,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }
}

// ── Providers ──
final recurringProvider = StreamProvider<List<RecurringExpense>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  
  return FirebaseFirestore.instance
      .collection('recurring')
      .where('userId', isEqualTo: user.uid)
      .snapshots()
      .map((snapshot) {
    final list = snapshot.docs.map((doc) => RecurringExpense.fromFirestore(doc)).toList();
    list.sort((a, b) => a.nextDue.compareTo(b.nextDue));
    return list;
  });
});

// ── Category Helper ──
final Map<String, Map<String, dynamic>> _categoryMeta = {
  'food': {'name': 'Food & Dining', 'icon': Icons.restaurant, 'color': Colors.orange},
  'transport': {'name': 'Transportation', 'icon': Icons.directions_car, 'color': Colors.blue},
  'shopping': {'name': 'Shopping', 'icon': Icons.shopping_bag, 'color': Colors.purple},
  'entertainment': {'name': 'Entertainment', 'icon': Icons.movie, 'color': Colors.pink},
  'bills': {'name': 'Bills & Utilities', 'icon': Icons.receipt, 'color': Colors.teal},
  'health': {'name': 'Healthcare', 'icon': Icons.medical_services, 'color': Colors.red},
  'grocery': {'name': 'Groceries', 'icon': Icons.local_grocery_store, 'color': Colors.green},
  'other': {'name': 'Other', 'icon': Icons.category, 'color': Colors.grey},
};

// ── UI ──
class RecurringPage extends ConsumerStatefulWidget {
  const RecurringPage({super.key});

  @override
  ConsumerState<RecurringPage> createState() => _RecurringPageState();
}

class _RecurringPageState extends ConsumerState<RecurringPage> {
  void _showAddRecurringModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _AddRecurringSheet(),
    );
  }

  Future<void> _deleteRecurring(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Expense?'),
        content: const Text('Are you sure you want to delete this recurring expense?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await FirebaseFirestore.instance.collection('recurring').doc(id).delete();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  String _getNextDueLabel(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final targetDate = DateTime(date.year, date.month, date.day);
    final diff = targetDate.difference(today).inDays;

    if (diff == 0) return 'Due today';
    if (diff == 1) return 'Due tomorrow';
    if (diff < 0) return 'Overdue by ${diff.abs()} days';
    if (diff <= 7) return 'Due in $diff days';
    return DateFormat('MMM d, yyyy').format(date);
  }

  String _getFreqLabel(String freq) {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return freq;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final recurringAsync = ref.watch(recurringProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Recurring Expenses'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showAddRecurringModal,
          ),
        ],
      ),
      body: recurringAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (expenses) {
          if (expenses.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.repeat, size: 48, color: Colors.blue),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'No recurring expenses',
                      style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Add monthly bills like rent, subscriptions, and utilities.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
                    ),
                    const SizedBox(height: 32),
                    FilledButton.icon(
                      onPressed: _showAddRecurringModal,
                      icon: const Icon(Icons.add),
                      label: const Text('Add your first recurring expense'),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: expenses.length,
            itemBuilder: (context, index) {
              final item = expenses[index];
              final isOverdue = item.nextDue.isBefore(DateTime.now().subtract(const Duration(days: 1)));
              
              final meta = _categoryMeta[item.categoryId] ?? _categoryMeta['other']!;
              final icon = meta['icon'] as IconData;
              final color = meta['color'] as Color;

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: theme.dividerColor),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: color),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.description, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(_getFreqLabel(item.frequency), style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                              Text(' • ', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.3))),
                              Text(
                                _getNextDueLabel(item.nextDue),
                                style: theme.textTheme.bodySmall?.copyWith(color: isOverdue ? Colors.red : theme.colorScheme.onSurface.withOpacity(0.6)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('₹${item.amount.toStringAsFixed(0)}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 20),
                          onPressed: () => _deleteRecurring(item.id),
                          color: theme.colorScheme.onSurface.withOpacity(0.4),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          splashRadius: 20,
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddRecurringModal,
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _AddRecurringSheet extends ConsumerStatefulWidget {
  const _AddRecurringSheet();
  @override
  ConsumerState<_AddRecurringSheet> createState() => _AddRecurringSheetState();
}

class _AddRecurringSheetState extends ConsumerState<_AddRecurringSheet> {
  final _descController = TextEditingController();
  final _amountController = TextEditingController();
  String _categoryId = 'bills';
  String _frequency = 'monthly';
  DateTime _startDate = DateTime.now();
  bool _isLoading = false;

  Future<void> _submit() async {
    if (_descController.text.isEmpty || _amountController.text.isEmpty) return;
    
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final amount = double.tryParse(_amountController.text.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
      final recurring = RecurringExpense(
        id: '',
        description: _descController.text.trim(),
        amount: amount,
        categoryId: _categoryId,
        frequency: _frequency,
        nextDue: _startDate,
        isActive: true,
      );

      await FirebaseFirestore.instance.collection('recurring').add(recurring.toMap(user.uid));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 24, top: 24, left: 24, right: 24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Add Recurring Expense', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _descController,
              decoration: InputDecoration(labelText: 'Description', filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(labelText: 'Amount ₹', filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _categoryId,
              decoration: InputDecoration(labelText: 'Category', filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
              items: _categoryMeta.entries.map((e) {
                return DropdownMenuItem(
                  value: e.key,
                  child: Row(children: [Icon(e.value['icon'] as IconData, size: 16, color: e.value['color'] as Color), const SizedBox(width: 8), Text(e.value['name'] as String)]),
                );
              }).toList(),
              onChanged: (val) => setState(() => _categoryId = val!),
            ),
            const SizedBox(height: 16),
            Text('Frequency', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Row(
              children: ['daily', 'weekly', 'monthly', 'yearly'].map((f) {
                final isSelected = _frequency == f;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: InkWell(
                      onTap: () => setState(() => _frequency = f),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          f[0].toUpperCase() + f.substring(1),
                          style: TextStyle(
                            color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _startDate,
                  firstDate: DateTime.now().subtract(const Duration(days: 30)),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) setState(() => _startDate = date);
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Start Date', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.7))),
                    Text(DateFormat('MMM d, yyyy').format(_startDate), style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _submit,
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Add Recurring Expense', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
