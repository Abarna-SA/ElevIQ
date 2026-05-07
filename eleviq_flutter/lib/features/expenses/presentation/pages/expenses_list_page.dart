import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart' hide PaymentMethod;
import '../../../../core/utils/currency_formatter.dart';
import '../../../../shared/widgets/loading_skeleton.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../providers/expense_providers.dart';
import '../../data/models/expense_model.dart';

import '../widgets/spending_trend_chart.dart';
import '../widgets/category_donut_chart.dart';
import '../widgets/spending_heatmap.dart';
import '../widgets/add_expense_sheet.dart';

class ExpensesListPage extends ConsumerWidget {
  const ExpensesListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final selectedMonth = ref.watch(selectedMonthProvider);
    final expensesAsync = ref.watch(currentMonthExpensesProvider);
    final filteredExpenses = ref.watch(filteredExpensesProvider);
    final monthlyTotal = ref.watch(monthlyTotalProvider);
    final searchQuery = ref.watch(expenseSearchQueryProvider);
    final categoryFilter = ref.watch(expenseCategoryFilterProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            backgroundColor: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF3F4F6),
            surfaceTintColor: Colors.transparent, // Keeps color rich and clean when scrolling
            elevation: 0,
            scrolledUnderElevation: 4,
            shadowColor: theme.colorScheme.shadow.withValues(alpha: 0.1),
            shape: const ContinuousRectangleBorder(
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(40),
                bottomRight: Radius.circular(40),
              ),
            ),
            title: Text(
              'Expenses', 
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: theme.colorScheme.onSurface,
              ),
            ),
            actions: [
              IconButton(
                onPressed: () => context.push('/expenses/history'),
                icon: const Icon(Icons.history_rounded),
                color: theme.colorScheme.onSurface,
              ),
            ],
          ),

          // Month Selector removed

          // ── Expenses Dashboard Layout ──
          expensesAsync.when(
            loading: () => SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: LoadingSkeleton(height: 120, width: double.infinity),
                  ),
                  childCount: 4,
                ),
              ),
            ),
            error: (err, _) => SliverFillRemaining(
              child: Center(child: Text('Error: $err')),
            ),
            data: (expenses) {
              if (expenses.isEmpty) {
                return SliverFillRemaining(
                  child: EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'No expenses yet',
                    subtitle: 'Tap + to add your first expense',
                    actionLabel: 'Add Expense',
                    onAction: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => const AddExpenseSheet(),
                      );
                    },
                  ),
                );
              }

              return SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100), // Adjusted top padding to 0
                  child: Column(
                    children: [
                      _buildStatsCards(context, expenses, monthlyTotal, theme),
                      const SizedBox(height: 24),
                      _buildChartSection(
                        context: context, 
                        title: 'Spending Trend (Last 30 Days)', 
                        child: SpendingTrendChart(expenses: expenses),
                      ),
                      const SizedBox(height: 24),
                      _buildChartSection(
                        context: context, 
                        title: 'Spending Calendar', 
                        child: SpendingHeatmap(
                          expenses: expenses,
                          selectedMonth: selectedMonth,
                          onPreviousMonth: () {
                             ref.read(selectedMonthProvider.notifier).state = DateTime(selectedMonth.year, selectedMonth.month - 1);
                          },
                          onNextMonth: () {
                             final next = DateTime(selectedMonth.year, selectedMonth.month + 1);
                             if (!next.isAfter(DateTime.now())) {
                               ref.read(selectedMonthProvider.notifier).state = next;
                             }
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                      _buildChartSection(
                        context: context, 
                        title: 'Category Breakdown', 
                        child: CategoryDonutChart(
                          categoryTotals: _calculateCategoryTotals(expenses),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildChartSection({required BuildContext context, required String title, required Widget child}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(24), 
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.03),
            blurRadius: 24, 
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.3),
                  width: 1,
                ),
              ),
            ),
            child: Text(
              title.toUpperCase(),
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCards(BuildContext context, List<ExpenseModel> expenses, double thisMonthTotal, ThemeData theme) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    // Calculate Today's spending
    final todaySpent = expenses
        .where((e) => DateTime(e.date.year, e.date.month, e.date.day) == today)
        .fold(0.0, (sum, e) => sum + e.amount);

    // Calculate Top Category
    final categoryTotals = _calculateCategoryTotals(expenses);
    String topCatId = '';
    double topCatAmount = 0.0;
    
    for (var entry in categoryTotals.entries) {
      if (entry.value > topCatAmount) {
        topCatAmount = entry.value;
        topCatId = entry.key;
      }
    }
    
    final topCat = topCatId.isNotEmpty 
        ? kDefaultCategories.firstWhere((c) => c.id == topCatId, orElse: () => kDefaultCategories.first) 
        : null;

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.25,
      children: [
        _StatCard(
          icon: Icons.calendar_month_rounded,
          backgroundColor: Colors.blue.shade600,
          title: 'This Month',
          value: formatCurrencyShort(thisMonthTotal),
          subtitle: 'Expenses so far', 
          theme: theme,
        ),
        _StatCard(
          icon: Icons.account_balance_wallet_rounded,
          backgroundColor: Colors.amber.shade700,
          title: 'Today',
          value: formatCurrencyShort(todaySpent),
          subtitle: '${expenses.where((e) => DateTime(e.date.year, e.date.month, e.date.day) == today).length} transactions',
          theme: theme,
        ),
        _StatCard(
          icon: Icons.insights_rounded,
          backgroundColor: Colors.deepOrange.shade400,
          title: 'Top Category',
          value: topCatAmount > 0 ? formatCurrencyShort(topCatAmount) : 'N/A',
          subtitle: topCat != null ? '${topCat.icon} ${topCat.name}' : 'No data',
          theme: theme,
        ),
        _StatCard(
          icon: Icons.receipt_long_rounded,
          backgroundColor: theme.colorScheme.tertiary,
          title: 'Total Records',
          value: expenses.length.toString(),
          subtitle: 'Tracked this month',
          theme: theme,
        ),
      ],
    );
  }

  Map<String, double> _calculateCategoryTotals(List<ExpenseModel> expenses) {
    final Map<String, double> totals = {};
    for (var e in expenses) {
      totals[e.categoryId] = (totals[e.categoryId] ?? 0.0) + e.amount;
    }
    return totals;
  }
}

// ─── Stat Card ───────────────────────────────────
class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color backgroundColor;
  final String title;
  final String value;
  final String subtitle;
  final ThemeData theme;

  const _StatCard({
    required this.icon,
    required this.backgroundColor,
    required this.title,
    required this.value,
    required this.subtitle,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: backgroundColor.withOpacity(0.3),
            blurRadius: 16,
            spreadRadius: -2,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2), 
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white, size: 24),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withOpacity(0.8),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.1),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  ),
                ),
                child: Text(
                  value,
                  key: ValueKey<String>(value),
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5, 
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: Colors.white.withOpacity(0.7),
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Month Selector Bar ──────────────────────────
class _MonthSelectorBar extends StatelessWidget {
  final DateTime selectedMonth;
  final double monthlyTotal;
  final bool isLoading;
  final bool isDark;
  final ThemeData theme;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _MonthSelectorBar({
    required this.selectedMonth,
    required this.monthlyTotal,
    required this.isLoading,
    required this.isDark,
    required this.theme,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final isCurrentMonth = selectedMonth.year == DateTime.now().year &&
        selectedMonth.month == DateTime.now().month;
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16), // Completely removed top/bottom margins
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121212) : Colors.white, // Sleeker dark theme color 
        borderRadius: BorderRadius.circular(28), // Pill shape 
        border: Border.all(
          color: isDark ? const Color(0xFF2A2A2A) : theme.colorScheme.outlineVariant.withOpacity(0.3),
        ),
        boxShadow: [
          if (!isDark) BoxShadow(
            color: theme.colorScheme.shadow.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: onPrevious,
            icon: const Icon(Icons.chevron_left),
            iconSize: 20,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (child, animation) => FadeTransition(opacity: animation, child: child),
              child: Column(
                key: ValueKey<String>('${selectedMonth.year}-${selectedMonth.month}'),
                children: [
                  Text(
                    '${months[selectedMonth.month - 1]} ${selectedMonth.year}',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.2, // Premium spacing
                    ),
                  ),
                const SizedBox(height: 4),
                isLoading
                    ? const LoadingSkeleton(width: 80, height: 14)
                      : AnimatedSwitcher(
                          duration: const Duration(milliseconds: 300),
                          child: Text(
                            formatCurrency(monthlyTotal),
                            key: ValueKey<double>(monthlyTotal),
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ),
              ],
            ),
          ),
          ),
          IconButton(
            onPressed: isCurrentMonth ? null : onNext,
            icon: Icon(Icons.chevron_right,
                color: isCurrentMonth ? Theme.of(context).colorScheme.onSurface.withOpacity(0.2) : null),
            iconSize: 20,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }
}

