import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../features/expenses/presentation/providers/expense_providers.dart';
import '../../../../features/expenses/data/models/expense_model.dart';
import 'package:intl/intl.dart';
import 'dart:math';

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

class ComparePage extends ConsumerStatefulWidget {
  const ComparePage({super.key});

  @override
  ConsumerState<ComparePage> createState() => _ComparePageState();
}

class _ComparePageState extends ConsumerState<ComparePage> {
  late DateTime _month1;
  late DateTime _month2;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _month1 = DateTime(now.year, now.month);
    _month2 = DateTime(now.year, now.month - 1);
  }

  Future<void> _pickMonth(bool isMonth1) async {
    final initialDate = isMonth1 ? _month1 : _month2;
    // Basic date picker limited to picking the month
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDatePickerMode: DatePickerMode.year,
    );
    if (picked != null) {
      setState(() {
        if (isMonth1) {
          _month1 = DateTime(picked.year, picked.month);
        } else {
          _month2 = DateTime(picked.year, picked.month);
        }
      });
    }
  }

  Map<String, dynamic> _getMonthData(DateTime month, List<ExpenseModel> allExpenses) {
    final start = DateTime(month.year, month.month, 1);
    final end = DateTime(month.year, month.month + 1, 0, 23, 59, 59);

    final monthExpenses = allExpenses.where((e) => e.date.isAfter(start.subtract(const Duration(seconds: 1))) && e.date.isBefore(end.add(const Duration(seconds: 1)))).toList();
    
    final total = monthExpenses.fold(0.0, (sum, e) => sum + e.amount);
    
    final Map<String, double> byCategory = {};
    for (var e in monthExpenses) {
      byCategory[e.categoryId] = (byCategory[e.categoryId] ?? 0) + e.amount;
    }

    return {
      'total': total,
      'byCategory': byCategory,
      'count': monthExpenses.length,
    };
  }

  int _getChange(double v1, double v2) {
    if (v2 == 0) return v1 > 0 ? 100 : 0;
    return (((v1 - v2) / v2) * 100).round();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final expensesAsync = ref.watch(expensesStreamProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Compare'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
      ),
      body: expensesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (allExpenses) {
          final data1 = _getMonthData(_month1, allExpenses);
          final data2 = _getMonthData(_month2, allExpenses);

          final total1 = data1['total'] as double;
          final total2 = data2['total'] as double;
          final count1 = data1['count'] as int;
          final count2 = data2['count'] as int;
          final byCat1 = data1['byCategory'] as Map<String, double>;
          final byCat2 = data2['byCategory'] as Map<String, double>;

          final totalChange = _getChange(total1, total2);

          final Set<String> allCatIds = {...byCat1.keys, ...byCat2.keys};
          final catList = allCatIds.toList()..sort((a, b) => (byCat1[b] ?? 0).compareTo(byCat1[a] ?? 0)); // Sort by month1 spending

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Month Selectors
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: theme.dividerColor),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => _pickMonth(true),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_month, size: 20, color: Colors.grey),
                              const SizedBox(width: 8),
                              Expanded(child: Text(DateFormat('MMMM yyyy').format(_month1), style: const TextStyle(fontWeight: FontWeight.bold))),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16),
                      child: Text('vs', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                    ),
                    Expanded(
                      child: InkWell(
                        onTap: () => _pickMonth(false),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_month, size: 20, color: Colors.grey),
                              const SizedBox(width: 8),
                              Expanded(child: Text(DateFormat('MMMM yyyy').format(_month2), style: const TextStyle(fontWeight: FontWeight.bold))),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Summary Cards
              Row(
                children: [
                  Expanded(child: _buildSummaryCard(theme, DateFormat('MMMM yyyy').format(_month1), total1, count1)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildSummaryCard(theme, DateFormat('MMMM yyyy').format(_month2), total2, count2)),
                ],
              ),
              const SizedBox(height: 16),

              // Change Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: totalChange > 0 ? Colors.red.withOpacity(0.05) : (totalChange < 0 ? Colors.green.withOpacity(0.05) : theme.colorScheme.surfaceContainerHighest),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: totalChange > 0 ? Colors.red.withOpacity(0.2) : (totalChange < 0 ? Colors.green.withOpacity(0.2) : theme.dividerColor)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Change', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(totalChange > 0 ? Icons.arrow_upward : (totalChange < 0 ? Icons.arrow_downward : Icons.remove), color: totalChange > 0 ? Colors.red : (totalChange < 0 ? Colors.green : Colors.grey)),
                        const SizedBox(width: 8),
                        Text(
                          '${totalChange > 0 ? '+' : ''}$totalChange%',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: totalChange > 0 ? Colors.red : (totalChange < 0 ? Colors.green : Colors.grey),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      totalChange > 0 ? 'Increase' : (totalChange < 0 ? 'Decrease' : 'No change'),
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // By Category
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: theme.dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text('By Category', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    ),
                    const Divider(height: 1),
                    if (catList.isEmpty)
                      Padding(
                        padding: const EdgeInsets.all(32),
                        child: Center(child: Text('No expenses in selected months', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.5)))),
                      )
                    else
                      ...catList.map((catId) {
                        final meta = _categoryMeta[catId] ?? _categoryMeta['other']!;
                        final icon = meta['icon'] as IconData;
                        final color = meta['color'] as Color;
                        final name = meta['name'] as String;

                        final amount1 = byCat1[catId] ?? 0.0;
                        final amount2 = byCat2[catId] ?? 0.0;
                        final change = _getChange(amount1, amount2);
                        final maxAmount = max(1.0, max(amount1, amount2));

                        return Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                                    child: Icon(icon, color: color, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.bold))),
                                  Row(
                                    children: [
                                      Icon(change > 0 ? Icons.arrow_upward : (change < 0 ? Icons.arrow_downward : Icons.remove), size: 14, color: change > 0 ? Colors.red : (change < 0 ? Colors.green : Colors.grey)),
                                      const SizedBox(width: 4),
                                      Text('${change > 0 ? '+' : ''}$change%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: change > 0 ? Colors.red : (change < 0 ? Colors.green : Colors.grey))),
                                    ],
                                  )
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  SizedBox(width: 40, child: Text(DateFormat('MMM').format(_month1), style: const TextStyle(fontSize: 12, color: Colors.grey))),
                                  Expanded(
                                    child: Stack(
                                      children: [
                                        Container(height: 8, decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(4))),
                                        FractionallySizedBox(
                                          widthFactor: amount1 / maxAmount,
                                          child: Container(height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(width: 64, child: Text('₹${amount1.toStringAsFixed(0)}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  SizedBox(width: 40, child: Text(DateFormat('MMM').format(_month2), style: const TextStyle(fontSize: 12, color: Colors.grey))),
                                  Expanded(
                                    child: Stack(
                                      children: [
                                        Container(height: 8, decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(4))),
                                        FractionallySizedBox(
                                          widthFactor: amount2 / maxAmount,
                                          child: Container(height: 8, decoration: BoxDecoration(color: color.withOpacity(0.4), borderRadius: BorderRadius.circular(4))),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(width: 64, child: Text('₹${amount2.toStringAsFixed(0)}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 12, color: Colors.grey))),
                                ],
                              ),
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSummaryCard(ThemeData theme, String title, double total, int count) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: theme.dividerColor)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
          const SizedBox(height: 8),
          Text('₹${total.toStringAsFixed(0)}', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('$count transactions', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.5))),
        ],
      ),
    );
  }
}
