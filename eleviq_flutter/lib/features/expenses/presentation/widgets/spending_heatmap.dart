import 'package:flutter/material.dart';
import '../../data/models/expense_model.dart';
import 'package:intl/intl.dart';
import '../../../../core/utils/currency_formatter.dart';

class SpendingHeatmap extends StatelessWidget {
  final List<ExpenseModel> expenses;
  final DateTime selectedMonth;
  final VoidCallback? onPreviousMonth;
  final VoidCallback? onNextMonth;

  const SpendingHeatmap({
    super.key,
    required this.expenses,
    required this.selectedMonth,
    this.onPreviousMonth,
    this.onNextMonth,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Process expenses for the selected month
    final expenseMap = <String, double>{};
    double maxAmount = 0.0;
    double monthTotal = 0.0;
    int daysWithSpending = 0;

    for (var e in expenses) {
      if (e.date.year == selectedMonth.year && e.date.month == selectedMonth.month) {
        final key = DateFormat('yyyy-MM-dd').format(e.date);
        expenseMap[key] = (expenseMap[key] ?? 0) + e.amount;
        monthTotal += e.amount;
      }
    }

    for (final amount in expenseMap.values) {
      if (amount > maxAmount) maxAmount = amount;
      if (amount > 0) daysWithSpending++;
    }
    if (maxAmount == 0) maxAmount = 1;

    // Calendar logic
    final firstDayOfMonth = DateTime(selectedMonth.year, selectedMonth.month, 1);
    final daysInMonth = DateUtils.getDaysInMonth(selectedMonth.year, selectedMonth.month);
    
    // In Dart, weekday is 1=Monday...7=Sunday. We want Sunday=0.
    final firstDayOffset = firstDayOfMonth.weekday == 7 ? 0 : firstDayOfMonth.weekday;
    
    Color getHeatColor(double amount) {
      if (amount == 0) return isDark ? const Color(0xFF1F2937) : const Color(0xFFF3F4F6); // gray-800 : gray-100
      final ratio = amount / maxAmount;
      if (ratio < 0.2) return isDark ? const Color(0xFF14532D).withValues(alpha: 0.5) : const Color(0xFFBBF7D0); // green
      if (ratio < 0.4) return isDark ? const Color(0xFF713F12).withValues(alpha: 0.5) : const Color(0xFFFEF08A); // yellow
      if (ratio < 0.6) return isDark ? const Color(0xFF7C2D12).withValues(alpha: 0.5) : const Color(0xFFFED7AA); // orange
      if (ratio < 0.8) return isDark ? const Color(0xFF991B1B).withValues(alpha: 0.6) : const Color(0xFFFCA5A5); // red-300 / red-800
      return isDark ? const Color(0xFFDC2626) : const Color(0xFFEF4444); // red-500 : red-600
    }

    Color getTextColor(double amount) {
      if (amount == 0) return isDark ? const Color(0xFF4B5563) : const Color(0xFF9CA3AF);
      return isDark ? Colors.white : const Color(0xFF111827);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Navigation Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: Icon(Icons.chevron_left, size: 20, color: isDark ? Colors.grey[400] : Colors.grey[600]),
              onPressed: onPreviousMonth,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
            Text(
              DateFormat('MMMM yyyy').format(selectedMonth),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
            IconButton(
              icon: Icon(Icons.chevron_right, size: 20, color: isDark ? Colors.grey[400] : Colors.grey[600]),
              onPressed: onNextMonth,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Weekday Headers
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) {
            return Expanded(
              child: Center(
                child: Text(
                  day,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey[400] : Colors.grey[500],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),

        // Grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            crossAxisSpacing: 6,
            mainAxisSpacing: 6,
          ),
          itemCount: firstDayOffset + daysInMonth,
          itemBuilder: (context, index) {
            if (index < firstDayOffset) {
              return const SizedBox(); // Empty cell
            }
            
            final day = index - firstDayOffset + 1;
            final date = DateTime(selectedMonth.year, selectedMonth.month, day);
            final key = DateFormat('yyyy-MM-dd').format(date);
            final amount = expenseMap[key] ?? 0.0;
            
            return Tooltip(
              message: amount > 0 ? formatCurrency(amount) : 'No spending',
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                decoration: BoxDecoration(
                  color: getHeatColor(amount),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '$day',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: amount > 0 ? FontWeight.w500 : FontWeight.normal,
                      color: getTextColor(amount),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
        
        const SizedBox(height: 24),
        
        // Legend and Days spent
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Text('Less', style: TextStyle(fontSize: 12, color: isDark ? Colors.grey[400] : Colors.grey[500])),
                const SizedBox(width: 8),
                Container(width: 14, height: 14, decoration: BoxDecoration(color: getHeatColor(0), borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 4),
                Container(width: 14, height: 14, decoration: BoxDecoration(color: getHeatColor(maxAmount * 0.1), borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 4),
                Container(width: 14, height: 14, decoration: BoxDecoration(color: getHeatColor(maxAmount * 0.3), borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 4),
                Container(width: 14, height: 14, decoration: BoxDecoration(color: getHeatColor(maxAmount * 0.5), borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 4),
                Container(width: 14, height: 14, decoration: BoxDecoration(color: getHeatColor(maxAmount * 0.9), borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 8),
                Text('More', style: TextStyle(fontSize: 12, color: isDark ? Colors.grey[400] : Colors.grey[500])),
              ],
            ),
            Text(
              '$daysWithSpending days spent',
              style: TextStyle(fontSize: 12, color: isDark ? Colors.grey[400] : Colors.grey[500]),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        Divider(color: isDark ? Colors.grey[800] : Colors.grey[200]),
        const SizedBox(height: 8),

        // Monthly Total
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'This month',
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
            Text(
              formatCurrency(monthTotal),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
