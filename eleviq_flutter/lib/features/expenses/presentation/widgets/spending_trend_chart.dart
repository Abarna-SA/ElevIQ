import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../data/models/expense_model.dart';
import '../../../../core/utils/currency_formatter.dart';

class SpendingTrendChart extends StatelessWidget {
  final List<ExpenseModel> expenses;
  final int days;
  final double height;

  const SpendingTrendChart({
    super.key,
    required this.expenses,
    this.days = 30,
    this.height = 280,
  });

  @override
  Widget build(BuildContext context) {
    if (expenses.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('No data for trend chart')),
      );
    }

    final theme = Theme.of(context);
    final now = DateTime.now();
    final startDate = now.subtract(Duration(days: days - 1));

    // Group expenses by day for the last `days` days
    final dailyTotals = List.generate(days, (index) {
      final date = startDate.add(Duration(days: index));
      final dateKey = DateFormat('yyyy-MM-dd').format(date);
      
      final dayTotal = expenses
          .where((e) => DateFormat('yyyy-MM-dd').format(e.date) == dateKey)
          .fold(0.0, (sum, e) => sum + e.amount);

      return _DailyData(date, dayTotal);
    });

    double maxY = 0;
    for (final data in dailyTotals) {
      if (data.amount > maxY) maxY = data.amount;
    }
    // Add 20% padding to top
    maxY = maxY > 0 ? maxY * 1.2 : 100;

    return SizedBox(
      height: height,
      child: LineChart(
        LineChartData(
          minX: 0,
          maxX: (days - 1).toDouble(),
          minY: 0,
          maxY: maxY,
          lineBarsData: [
            LineChartBarData(
              spots: dailyTotals
                  .asMap()
                  .entries
                  .map((e) => FlSpot(e.key.toDouble(), e.value.amount))
                  .toList(),
              isCurved: true,
              color: theme.colorScheme.primary,
              barWidth: 5, // Thicker premium feel
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              shadow: Shadow(
                color: theme.colorScheme.primary.withValues(alpha: 0.5),
                blurRadius: 16, // Richer neon glow effect
                offset: const Offset(0, 6),
              ),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    theme.colorScheme.primary.withValues(alpha: 0.4), // More vibrant top
                    theme.colorScheme.primary.withValues(alpha: 0.0),  // Smooth fade
                  ],
                ),
              ),
            ),
          ],
          titlesData: FlTitlesData(
            show: true,
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 32,
                interval: days > 15 ? 7 : 1, // Show every 7 days if looking at 30 days
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index < 0 || index >= dailyTotals.length) return const SizedBox();
                  
                  // Force hide labels that aren't exactly on the interval to prevent min/max overlap
                  if (days > 15 && index % 7 != 0) return const SizedBox();
                  
                  final date = dailyTotals[index].date;
                  return SideTitleWidget(
                    axisSide: meta.axisSide,
                    space: 10,
                    child: Text(
                      DateFormat('MMM d').format(date),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.5),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 44, // Reduced reserved size so graph goes closer to edge
                interval: maxY / 4 > 0 ? maxY / 4 : 1,
                getTitlesWidget: (value, meta) {
                  if (value == 0) return const SizedBox(); // Hide 0 to keep it clean
                  return SideTitleWidget(
                    axisSide: meta.axisSide,
                    space: 0, 
                    child: Container(
                      alignment: Alignment.centerLeft, // Align left so numbers stick to the left edge
                      child: Text(
                        formatCurrencyShort(value), 
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.5),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: maxY / 4 > 0 ? maxY / 4 : 1,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.05),
                strokeWidth: 1,
                dashArray: [5, 5],
              );
            },
          ),
          borderData: FlBorderData(show: false),
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              tooltipBgColor: theme.colorScheme.surfaceContainerHighest,
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((spot) {
                  final index = spot.x.toInt();
                  if (index < 0 || index >= dailyTotals.length) return null;
                  final date = dailyTotals[index].date;
                  return LineTooltipItem(
                    '${DateFormat('MMM d').format(date)}\n',
                    TextStyle(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    children: [
                      TextSpan(
                        text: formatCurrency(spot.y),
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  );
                }).toList();
              },
            ),
            handleBuiltInTouches: true,
          ),
        ),
      ),
    );
  }
}

class _DailyData {
  final DateTime date;
  final double amount;
  _DailyData(this.date, this.amount);
}
