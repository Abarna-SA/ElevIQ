import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../features/expenses/presentation/providers/expense_providers.dart';

class InsightsPage extends ConsumerStatefulWidget {
  const InsightsPage({super.key});

  @override
  ConsumerState<InsightsPage> createState() => _InsightsPageState();
}

class _InsightsPageState extends ConsumerState<InsightsPage> {
  bool _isLoading = false;
  Map<String, dynamic>? _insightsData; // Will be properly typed when connected to actual backend

  Future<void> _fetchInsights() async {
    setState(() {
      _isLoading = true;
    });

    // Simulate API call for now until we fully hook up Next.js /api/insights backend connection
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isLoading = false;
      // Mock data matching the web app's structure for UI development
      _insightsData = {
        'insights': [
          {
            'title': 'High Dining Expenses',
            'description': 'You spent 30% more on dining out this month.',
            'icon': 'alert',
            'color': 'yellow',
          },
          {
            'title': 'Good Savings Pattern',
            'description': 'Your grocery spending is well optimized.',
            'icon': 'check',
            'color': 'green',
          }
        ],
        'recommendations': [
          {
            'title': 'Reduce Coffee Shop Visits',
            'description': 'Making coffee at home 3 days a week could save money.',
            'potentialSavings': 1500,
            'priority': 'medium',
          }
        ],
        'forecast': {
          'projectedMonthEnd': 45000,
          'trend': 'down',
          'comparedToLastMonth': -5,
        }
      };
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final expensesAsync = ref.watch(currentMonthExpensesProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Smart Insights'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
        actions: [
          if (_insightsData != null && !_isLoading)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _fetchInsights,
            ),
        ],
      ),
      body: expensesAsync.when(
        data: (expenses) {
          if (expenses.isEmpty) {
            return _buildEmptyState(
              theme,
              Icons.receipt_long,
              'No Data Yet',
              'Add some expenses first to generate insights.',
            );
          }

          if (_isLoading) {
            return _buildLoadingState(theme);
          }

          if (_insightsData == null) {
            return _buildEmptyState(
              theme,
              Icons.auto_awesome,
              'Unlock AI Insights',
              'Generate insights to analyze your spending patterns and get personalized recommendations.',
              action: _fetchInsights,
            );
          }

          return _buildInsightsContent(theme, _insightsData!);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme, IconData icon, String title, String subtitle, {VoidCallback? action}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [theme.colorScheme.primary, theme.colorScheme.tertiary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: theme.colorScheme.onPrimary),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 32),
            if (action != null)
              FilledButton.icon(
                onPressed: action,
                icon: const Icon(Icons.auto_awesome),
                label: const Text('Generate Insights'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 24),
          Text(
            'Analyzing your spending patterns...',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'This may take a few seconds',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightsContent(ThemeData theme, Map<String, dynamic> data) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // AI Forecast Card
        _buildForecastCard(theme, data['forecast']),
        const SizedBox(height: 24),

        // Key Insights
        Text(
          'Key Insights',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ...(data['insights'] as List).map((insight) => _buildInsightCard(theme, insight)),

        const SizedBox(height: 24),

        // Recommendations
        Text(
          'Savings Recommendations',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Column(
            children: (data['recommendations'] as List).asMap().entries.map((entry) {
              final index = entry.key;
              final rec = entry.value;
              return Column(
                children: [
                  if (index > 0) Divider(height: 1, color: theme.dividerColor),
                  _buildRecommendationItem(theme, rec, index + 1),
                ],
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildForecastCard(ThemeData theme, Map<String, dynamic> forecast) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [theme.colorScheme.primary, theme.colorScheme.tertiary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.trending_up, color: theme.colorScheme.onPrimary),
              const SizedBox(width: 8),
              Text(
                'Month-End Forecast',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.onPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
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
                    '₹${forecast['projectedMonthEnd'].toString()}',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: theme.colorScheme.onPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${forecast['comparedToLastMonth']}% vs last month',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onPrimary.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInsightCard(ThemeData theme, Map<String, dynamic> insight) {
    // Basic color mapping logic matching the Next.js `colorMap` array
    Color iconBgColor;
    Color iconColor;
    IconData iconData = Icons.wallet; // Default

    switch (insight['color']) {
      case 'green':
        iconBgColor = Colors.green.withOpacity(0.1);
        iconColor = Colors.green;
        break;
      case 'red':
        iconBgColor = Colors.red.withOpacity(0.1);
        iconColor = Colors.red;
        break;
      case 'yellow':
        iconBgColor = Colors.orange.withOpacity(0.1);
        iconColor = Colors.orange;
        break;
      default:
        iconBgColor = theme.colorScheme.primary.withOpacity(0.1);
        iconColor = theme.colorScheme.primary;
    }

    switch (insight['icon']) {
      case 'alert':
        iconData = Icons.error_outline;
        break;
      case 'check':
        iconData = Icons.check_circle_outline;
        break;
      case 'trending-up':
        iconData = Icons.trending_up;
        break;
      case 'trending-down':
        iconData = Icons.trending_down;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(iconData, color: iconColor),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  insight['title'],
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  insight['description'],
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationItem(ThemeData theme, Map<String, dynamic> rec, int index) {
    Color priorityColor;
    switch (rec['priority']) {
      case 'high':
        priorityColor = Colors.red;
        break;
      case 'medium':
        priorityColor = Colors.orange;
        break;
      default:
        priorityColor = Colors.grey;
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: priorityColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                index.toString(),
                style: TextStyle(
                  color: priorityColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  rec['title'],
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  rec['description'],
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${rec['potentialSavings']}',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: Colors.green,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '/mo',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.5),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
