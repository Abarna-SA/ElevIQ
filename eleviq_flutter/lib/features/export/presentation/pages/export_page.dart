import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../features/expenses/presentation/providers/expense_providers.dart';
import '../../../../features/expenses/data/models/expense_model.dart';

enum DateRange {
  thisMonth,
  lastMonth,
  last3Months,
  thisYear,
  all,
}

enum ExportFormat {
  pdf,
  csv,
}

class ExportPage extends ConsumerStatefulWidget {
  const ExportPage({super.key});

  @override
  ConsumerState<ExportPage> createState() => _ExportPageState();
}

class _ExportPageState extends ConsumerState<ExportPage> {
  DateRange _selectedRange = DateRange.thisMonth;
  ExportFormat _selectedFormat = ExportFormat.pdf;
  bool _isExporting = false;

  String _getRangeLabel(DateRange range) {
    switch (range) {
      case DateRange.thisMonth: return 'This Month';
      case DateRange.lastMonth: return 'Last Month';
      case DateRange.last3Months: return 'Last 3 Months';
      case DateRange.thisYear: return 'This Year';
      case DateRange.all: return 'All Time';
    }
  }

  List<ExpenseModel> _getFilteredExpenses(List<ExpenseModel> expenses) {
    final now = DateTime.now();
    DateTime? startDate;
    DateTime endDate = now;

    switch (_selectedRange) {
      case DateRange.thisMonth:
        startDate = DateTime(now.year, now.month, 1);
        endDate = DateTime(now.year, now.month + 1, 0, 23, 59, 59);
        break;
      case DateRange.lastMonth:
        startDate = DateTime(now.year, now.month - 1, 1);
        endDate = DateTime(now.year, now.month, 0, 23, 59, 59);
        break;
      case DateRange.last3Months:
        startDate = DateTime(now.year, now.month - 3, 1);
        break;
      case DateRange.thisYear:
        startDate = DateTime(now.year, 1, 1);
        break;
      case DateRange.all:
        startDate = null;
        break;
    }

    return expenses.where((e) {
      if (startDate == null) return true;
      return e.date.isAfter(startDate.subtract(const Duration(seconds: 1))) && e.date.isBefore(endDate.add(const Duration(seconds: 1)));
    }).toList();
  }

  Future<void> _handleExport(List<ExpenseModel> filtered) async {
    if (filtered.isEmpty) return;

    setState(() => _isExporting = true);

    // Simulate export delay
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;
    
    setState(() => _isExporting = false);
    
    final formatName = _selectedFormat == ExportFormat.pdf ? 'PDF Report' : 'CSV Data';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$formatName for ${_getRangeLabel(_selectedRange)} exported successfully! (\${filtered.length} transactions)'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final expensesAsync = ref.watch(expensesStreamProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Export Data'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
      ),
      body: expensesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (expenses) {
          final filtered = _getFilteredExpenses(expenses);
          final totalAmount = filtered.fold(0.0, (sum, e) => sum + e.amount);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Date Range
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Select Date Range', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: DateRange.values.map((range) {
                          final isSelected = _selectedRange == range;
                          return InkWell(
                            onTap: () => setState(() => _selectedRange = range),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.blue : (isDark ? Colors.black26 : Colors.grey[100]),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _getRangeLabel(range),
                                style: TextStyle(
                                  color: isSelected ? Colors.white : (isDark ? Colors.grey[300] : Colors.grey[800]),
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Format
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Select Format', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _buildFormatCard(
                              title: 'PDF Report',
                              subtitle: 'With charts & summary',
                              icon: Icons.picture_as_pdf,
                              color: Colors.red,
                              isSelected: _selectedFormat == ExportFormat.pdf,
                              onTap: () => setState(() => _selectedFormat = ExportFormat.pdf),
                              isDark: isDark,
                              theme: theme,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildFormatCard(
                              title: 'CSV Data',
                              subtitle: 'For Excel/Sheets',
                              icon: Icons.table_chart,
                              color: Colors.green,
                              isSelected: _selectedFormat == ExportFormat.csv,
                              onTap: () => setState(() => _selectedFormat = ExportFormat.csv),
                              isDark: isDark,
                              theme: theme,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Preview
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Export Preview', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(color: isDark ? Colors.black12 : Colors.grey[50], borderRadius: BorderRadius.circular(16)),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Transactions', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text('${filtered.length}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(color: isDark ? Colors.black12 : Colors.grey[50], borderRadius: BorderRadius.circular(16)),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Total Amount', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text('₹${totalAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (filtered.isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 24),
                          child: Text('No expenses in selected date range', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Button
                FilledButton.icon(
                  onPressed: _isExporting || filtered.isEmpty ? null : () => _handleExport(filtered),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.all(20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    backgroundColor: Colors.blue,
                  ),
                  icon: _isExporting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.download),
                  label: Text(_isExporting ? 'Generating...' : 'Download ${_selectedFormat.name.toUpperCase()}'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildFormatCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
    required ThemeData theme,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : (isDark ? Colors.black26 : Colors.white),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? color : theme.dividerColor, width: isSelected ? 2 : 1),
        ),
        child: Column(
          children: [
            Icon(icon, size: 32, color: isSelected ? color : Colors.grey),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
