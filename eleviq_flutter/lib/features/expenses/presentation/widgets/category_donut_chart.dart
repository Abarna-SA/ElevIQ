import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/utils/currency_formatter.dart';

class CategoryDonutChart extends StatelessWidget {
  final Map<String, double> categoryTotals;
  final double height;

  const CategoryDonutChart({
    super.key,
    required this.categoryTotals,
    this.height = 280,
  });

  @override
  Widget build(BuildContext context) {
    if (categoryTotals.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('No data for categories')),
      );
    }

    final theme = Theme.of(context);
    
    // Sort logic
    final sortedEntries = categoryTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
      
    final totalAmount = sortedEntries.fold(0.0, (sum, entry) => sum + entry.value);

    // Limit to top 5, group rest as "Other"
    final topEntries = sortedEntries.take(5).toList();
    final otherTotal = sortedEntries.skip(5).fold(0.0, (sum, e) => sum + e.value);
    
    // Using defaultCategories list from the app constants or model
    _CategoryColorResolver resolver = _CategoryColorResolver();

    List<PieChartSectionData> sections = [];
    int index = 0;
    
    for (final entry in topEntries) {
      final percentage = (entry.value / totalAmount) * 100;
      final catInfo = resolver.getInfo(entry.key);
      
      sections.add(
        PieChartSectionData(
          color: catInfo.color,
          value: entry.value,
          title: '${percentage.toStringAsFixed(0)}%',
          radius: 40,
          titleStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.white, // Ensure readable
          ),
          badgeWidget: _Badge(
            catInfo.icon,
            size: 30,
            borderColor: catInfo.color,
          ),
          badgePositionPercentageOffset: .98,
        ),
      );
      index++;
    }
    
    if (otherTotal > 0) {
      final percentage = (otherTotal / totalAmount) * 100;
      sections.add(
        PieChartSectionData(
          color: Colors.grey,
          value: otherTotal,
          title: '${percentage.toStringAsFixed(0)}%',
          radius: 40,
          titleStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      );
    }

    return SizedBox(
      height: height,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Center Text
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface.withValues(alpha: 0.95),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.shadow.withValues(alpha: 0.03),
                  blurRadius: 24,
                  spreadRadius: 8,
                ),
              ],
              border: Border.all(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.03),
                width: 1.5,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Total',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  formatCurrencyShort(totalAmount),
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),
          
          PieChart(
            PieChartData(
              pieTouchData: PieTouchData(
                touchCallback: (FlTouchEvent event, pieTouchResponse) {},
              ),
              borderData: FlBorderData(show: false),
              sectionsSpace: 2,
              centerSpaceRadius: 60,
              sections: sections,
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String icon;
  final double size;
  final Color borderColor;

  const _Badge(
    this.icon, {
    required this.size,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: PieChart.defaultDuration,
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        shape: BoxShape.circle,
        border: Border.all(
          color: borderColor,
          width: 3.0,
        ),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: borderColor.withValues(alpha: 0.4), // Colored glow behind badge
            offset: const Offset(0, 4),
            blurRadius: 12,
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08), // Soft deep shadow
            offset: const Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      padding: EdgeInsets.all(size * .15),
      child: Center(
        child: Text(
          icon,
          style: TextStyle(fontSize: size * 0.5),
        ),
      ),
    );
  }
}

class _CategoryColorResolver {
  _CategoryInfo getInfo(String categoryId) {
    // Attempt to map categoryId to colors/icons similar to web
    try {
      final cat = kDefaultCategories.firstWhere((c) => c.id == categoryId);
      return _CategoryInfo(cat.name, cat.icon, cat.color);
    } catch (_) {
      return _CategoryInfo('Unknown', '❓', Colors.grey);
    }
  }
}

class _CategoryInfo {
  final String name;
  final String icon;
  final Color color;
  _CategoryInfo(this.name, this.icon, this.color);
}
