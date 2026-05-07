import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../features/expenses/presentation/providers/expense_providers.dart';
import '../../../../features/expenses/data/models/expense_model.dart';

// ── Models ──
class SpendingLimit {
  final String id;
  final String categoryId;
  final double amount;
  final String period; // 'daily', 'weekly', 'monthly'
  final int alertThreshold;

  SpendingLimit({
    required this.id,
    required this.categoryId,
    required this.amount,
    required this.period,
    required this.alertThreshold,
  });

  factory SpendingLimit.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return SpendingLimit(
      id: doc.id,
      categoryId: data['categoryId'] ?? 'total',
      amount: (data['amount'] ?? 0).toDouble(),
      period: data['period'] ?? 'monthly',
      alertThreshold: data['alertThreshold'] ?? 80,
    );
  }

  Map<String, dynamic> toMap(String userId) {
    return {
      'userId': userId,
      'categoryId': categoryId,
      'amount': amount,
      'period': period,
      'alertThreshold': alertThreshold,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }
}

// ── Providers ──
final limitsProvider = StreamProvider<List<SpendingLimit>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  
  return FirebaseFirestore.instance
      .collection('limits')
      .where('userId', isEqualTo: user.uid)
      .snapshots()
      .map((snapshot) {
    return snapshot.docs.map((doc) => SpendingLimit.fromFirestore(doc)).toList();
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
  'total': {'name': 'Total Budget', 'icon': Icons.account_balance_wallet, 'color': Colors.amber},
};

// ── UI ──
class LimitsPage extends ConsumerStatefulWidget {
  const LimitsPage({super.key});

  @override
  ConsumerState<LimitsPage> createState() => _LimitsPageState();
}

class _LimitsPageState extends ConsumerState<LimitsPage> {
  void _showAddLimitModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _AddLimitSheet(),
    );
  }

  Future<void> _deleteLimit(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Limit?'),
        content: const Text('Are you sure you want to delete this limit?'),
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
        await FirebaseFirestore.instance.collection('limits').doc(id).delete();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  double _calculateSpending(SpendingLimit limit, List<ExpenseModel> allExpenses) {
    final now = DateTime.now();
    DateTime start;
    DateTime end;

    if (limit.period == 'daily') {
      start = DateTime(now.year, now.month, now.day);
      end = DateTime(now.year, now.month, now.day, 23, 59, 59);
    } else if (limit.period == 'weekly') {
      final weekStart = now.subtract(Duration(days: now.weekday - 1));
      start = DateTime(weekStart.year, weekStart.month, weekStart.day);
      end = start.add(const Duration(days: 6, hours: 23, minutes: 59, seconds: 59));
    } else { // monthly
      start = DateTime(now.year, now.month, 1);
      end = DateTime(now.year, now.month + 1, 0, 23, 59, 59);
    }

    final filtered = allExpenses.where((e) {
      final inRange = e.date.isAfter(start.subtract(const Duration(seconds: 1))) && 
                      e.date.isBefore(end.add(const Duration(seconds: 1)));
      final matchesCategory = limit.categoryId == 'total' || e.categoryId == limit.categoryId;
      return inRange && matchesCategory;
    });

    return filtered.fold(0.0, (sum, e) => sum + e.amount);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final limitsAsync = ref.watch(limitsProvider);
    final expensesAsync = ref.watch(expensesStreamProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Spending Limits'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showAddLimitModal,
          ),
        ],
      ),
      body: limitsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (limits) {
          if (limits.isEmpty) {
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
                      child: const Icon(Icons.security, size: 48, color: Colors.blue),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'No limits set',
                      style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Create spending limits to stay on budget.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
                    ),
                    const SizedBox(height: 32),
                    FilledButton.icon(
                      onPressed: _showAddLimitModal,
                      icon: const Icon(Icons.add),
                      label: const Text('Create your first limit'),
                    ),
                  ],
                ),
              ),
            );
          }

          final allExpenses = expensesAsync.asData?.value ?? [];

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: limits.length,
            itemBuilder: (context, index) {
              final limit = limits[index];
              final spent = _calculateSpending(limit, allExpenses);
              final percentage = (limit.amount > 0 ? (spent / limit.amount) * 100 : 0).clamp(0.0, 100.0);
              final isWarning = percentage >= limit.alertThreshold;
              final isExceeded = percentage >= 100;
              
              final meta = _categoryMeta[limit.categoryId] ?? _categoryMeta['total']!;
              final icon = meta['icon'] as IconData;
              final color = meta['color'] as Color;
              final name = meta['name'] as String;

              String periodLabel = limit.period == 'daily' ? 'Today' : (limit.period == 'weekly' ? 'This Week' : 'This Month');

              Color borderColor = theme.dividerColor;
              Color progressColor = Colors.green;
              if (isExceeded) {
                borderColor = Colors.red.shade300;
                progressColor = Colors.red;
              } else if (isWarning) {
                borderColor = Colors.orange.shade300;
                progressColor = Colors.orange;
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: borderColor),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
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
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(periodLabel, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                              ],
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 20),
                          onPressed: () => _deleteLimit(limit.id),
                          color: Colors.red.withOpacity(0.7),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Spent', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                        Text('${percentage.toStringAsFixed(0)}%', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: percentage / 100,
                        backgroundColor: theme.colorScheme.surfaceContainerHighest,
                        valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                        minHeight: 12,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '₹${spent.toStringAsFixed(0)}',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: isExceeded ? Colors.red : (isWarning ? Colors.orange : theme.colorScheme.onSurface),
                              ),
                            ),
                            Text(
                              'of ₹${limit.amount.toStringAsFixed(0)}',
                              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
                            ),
                          ],
                        ),
                        if (isExceeded)
                          Row(
                            children: [
                              const Icon(Icons.warning_amber, color: Colors.red, size: 16),
                              const SizedBox(width: 4),
                              Text('Exceeded', style: theme.textTheme.bodySmall?.copyWith(color: Colors.red, fontWeight: FontWeight.bold)),
                            ],
                          )
                        else if (isWarning)
                          Row(
                            children: [
                              const Icon(Icons.warning_amber, color: Colors.orange, size: 16),
                              const SizedBox(width: 4),
                              Text('Near limit', style: theme.textTheme.bodySmall?.copyWith(color: Colors.orange, fontWeight: FontWeight.bold)),
                            ],
                          )
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
        onPressed: _showAddLimitModal,
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _AddLimitSheet extends ConsumerStatefulWidget {
  const _AddLimitSheet();
  @override
  ConsumerState<_AddLimitSheet> createState() => _AddLimitSheetState();
}

class _AddLimitSheetState extends ConsumerState<_AddLimitSheet> {
  final _amountController = TextEditingController();
  String _categoryId = 'total';
  String _period = 'monthly';
  double _alertThreshold = 80;
  bool _isLoading = false;

  Future<void> _submit() async {
    if (_amountController.text.isEmpty) return;
    
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final amount = double.tryParse(_amountController.text.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
      final limit = SpendingLimit(
        id: '',
        categoryId: _categoryId,
        amount: amount,
        period: _period,
        alertThreshold: _alertThreshold.toInt(),
      );

      await FirebaseFirestore.instance.collection('limits').add(limit.toMap(user.uid));
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
                Text('Set Spending Limit', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 24),
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
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(labelText: 'Limit Amount ₹', filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
            ),
            const SizedBox(height: 16),
            Text('Period', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Row(
              children: ['daily', 'weekly', 'monthly'].map((p) {
                final isSelected = _period == p;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: InkWell(
                      onTap: () => setState(() => _period = p),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          p[0].toUpperCase() + p.substring(1),
                          style: TextStyle(
                            color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            Text('Alert Threshold: ${_alertThreshold.toInt()}%', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
            Slider(
              value: _alertThreshold,
              min: 50,
              max: 95,
              divisions: 9,
              label: '${_alertThreshold.toInt()}%',
              onChanged: (val) => setState(() => _alertThreshold = val),
            ),
            Center(child: Text('Get warned when spending reaches this percentage', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.5)))),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: _submit,
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Create Limit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
