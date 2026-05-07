import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart' hide PaymentMethod;
import '../../../../core/utils/currency_formatter.dart';
import '../../../../shared/widgets/loading_skeleton.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../providers/expense_providers.dart';
import '../../data/models/expense_model.dart';

class ExpensesHistoryPage extends ConsumerWidget {
  const ExpensesHistoryPage({super.key});

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
            expandedHeight: 64,
            floating: true,
            pinned: true,
            backgroundColor: Theme.of(context).colorScheme.surface,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => context.pop(),
            ),
            title: const Text('Expense Logs', style: TextStyle(fontWeight: FontWeight.w800)),
            actions: [
              IconButton(
                onPressed: () => _showFilterSheet(context, ref, isDark),
                icon: Badge(
                  isLabelVisible: categoryFilter != null,
                  child: const Icon(Icons.tune),
                ),
              ),
            ],
          ),

          // ── Month Selector + Summary ──
          SliverToBoxAdapter(
            child: _MonthSelectorBar(
              selectedMonth: selectedMonth,
              monthlyTotal: monthlyTotal,
              isLoading: expensesAsync.isLoading,
              isDark: isDark,
              theme: theme,
              onPrevious: () {
                ref.read(selectedMonthProvider.notifier).state = DateTime(selectedMonth.year, selectedMonth.month - 1);
              },
              onNext: () {
                final next = DateTime(selectedMonth.year, selectedMonth.month + 1);
                if (!next.isAfter(DateTime.now())) {
                  ref.read(selectedMonthProvider.notifier).state = next;
                }
              },
            ),
          ),

          // ── Search Bar ──
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: TextField(
                onChanged: (value) => ref.read(expenseSearchQueryProvider.notifier).state = value,
                decoration: InputDecoration(
                  hintText: 'Search expenses...',
                  hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
                  prefixIcon: Icon(Icons.search, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
                  suffixIcon: searchQuery.isNotEmpty
                      ? IconButton(
                          onPressed: () => ref.read(expenseSearchQueryProvider.notifier).state = '',
                          icon: const Icon(Icons.close, size: 20),
                        )
                      : null,
                  filled: true,
                  fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),

          // ── Category Chips ──
          SliverToBoxAdapter(
            child: SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
                children: [
                  _FilterChip(
                    label: 'All',
                    isSelected: categoryFilter == null,
                    onTap: () => ref.read(expenseCategoryFilterProvider.notifier).state = null,
                    isDark: isDark,
                  ),
                  ...kDefaultCategories.map((cat) => _FilterChip(
                    label: '${cat.icon} ${cat.name}',
                    isSelected: categoryFilter == cat.id,
                    onTap: () => ref.read(expenseCategoryFilterProvider.notifier).state =
                        categoryFilter == cat.id ? null : cat.id,
                    isDark: isDark,
                    color: cat.color,
                  )),
                ],
              ),
            ),
          ),

          // ── Expense List ──
          expensesAsync.when(
            loading: () => SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: ListItemSkeleton(),
                  ),
                  childCount: 6,
                ),
              ),
            ),
            error: (err, _) => SliverFillRemaining(
              child: Center(child: Text('Error: $err')),
            ),
            data: (_) {
              if (filteredExpenses.isEmpty) {
                return SliverFillRemaining(
                  child: EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: searchQuery.isNotEmpty ? 'No results' : 'No expenses yet',
                    subtitle: searchQuery.isNotEmpty
                        ? 'Try a different search term'
                        : 'Tap + to add your first expense',
                    actionLabel: searchQuery.isEmpty ? 'Add Expense' : null,
                    onAction: searchQuery.isEmpty ? () => context.push('/expenses/add') : null,
                  ),
                );
              }

              // Group by date
              final grouped = _groupByDate(filteredExpenses);
              final dateKeys = grouped.keys.toList();

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final dateKey = dateKeys[index];
                      final dayExpenses = grouped[dateKey]!;
                      final dayTotal = dayExpenses.fold(0.0, (sum, e) => sum + e.amount);

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Date header
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  dateKey,
                                  style: theme.textTheme.labelMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                                  ),
                                ),
                                Text(
                                  formatCurrencyShort(dayTotal),
                                  style: theme.textTheme.labelMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Expenses for this date
                          ...dayExpenses.map((expense) => _ExpenseCard(
                            expense: expense,
                            isDark: isDark,
                            theme: theme,
                            onTap: () {
                              // Navigate to expense detail/edit
                            },
                          )),
                        ],
                      );
                    },
                    childCount: dateKeys.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Map<String, List<ExpenseModel>> _groupByDate(List<ExpenseModel> expenses) {
    final Map<String, List<ExpenseModel>> grouped = {};
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    for (final expense in expenses) {
      final date = DateTime(expense.date.year, expense.date.month, expense.date.day);
      String key;

      if (date == today) {
        key = 'Today';
      } else if (date == yesterday) {
        key = 'Yesterday';
      } else {
        key = '${_monthName(date.month)} ${date.day}';
      }

      (grouped[key] ??= []).add(expense);
    }
    return grouped;
  }

  String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }

  void _showFilterSheet(BuildContext context, WidgetRef ref, bool isDark) {
    final paymentFilter = ref.read(expensePaymentFilterProvider);
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Filter by Payment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildPaymentChip(context, ref, null, 'All', paymentFilter, isDark),
                ...PaymentMethod.values.map((pm) =>
                  _buildPaymentChip(context, ref, pm, pm.displayName, paymentFilter, isDark),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentChip(BuildContext context, WidgetRef ref, PaymentMethod? method, String label, PaymentMethod? current, bool isDark) {
    final isSelected = method == current;
    return GestureDetector(
      onTap: () {
        ref.read(expensePaymentFilterProvider.notifier).state = method;
        Navigator.pop(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).colorScheme.primary.withOpacity(0.15)
              : Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(10),
          border: isSelected
              ? Border.all(color: Theme.of(context).colorScheme.primary, width: 1.5)
              : Border.all(color: Colors.transparent, width: 1.5),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Theme.of(context).colorScheme.primary : null,
          ),
        ),
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
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121212) : Colors.white, // Sleeker dark theme color 
        borderRadius: BorderRadius.circular(28), // Pill shape 
        border: Border.all(
          color: isDark ? const Color(0xFF2A2A2A) : theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
        boxShadow: [
          if (!isDark) BoxShadow(
            color: theme.colorScheme.shadow.withValues(alpha: 0.04),
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
                color: isCurrentMonth ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2) : null),
            iconSize: 20,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }
}

// ─── Filter Chip ─────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final bool isDark;
  final Color? color;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
    required this.isDark,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected
                ? (color ?? Theme.of(context).colorScheme.primary).withOpacity(0.15)
                : Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(20),
            border: isSelected
                ? Border.all(color: color ?? Theme.of(context).colorScheme.primary, width: 1.5)
                : Border.all(color: Colors.transparent, width: 1.5),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? (color ?? Theme.of(context).colorScheme.primary) : null,
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Expense Card ────────────────────────────────
class _ExpenseCard extends StatelessWidget {
  final ExpenseModel expense;
  final bool isDark;
  final ThemeData theme;
  final VoidCallback? onTap;

  const _ExpenseCard({
    required this.expense,
    required this.isDark,
    required this.theme,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cat = getCategoryById(expense.categoryId);
    final catColor = cat?.color ?? Colors.grey;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Category icon
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: catColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(cat?.icon ?? '📦', style: const TextStyle(fontSize: 22)),
                  ),
                ),
                const SizedBox(width: 14),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        expense.description.isNotEmpty ? expense.description : expense.category,
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: Theme.of(context).colorScheme.onSurface),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          if (expense.vendor.isNotEmpty) ...[
                            Text(
                              expense.vendor,
                              style: TextStyle(
                                  fontSize: 12,
                                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
                            ),
                            Text(' • ',
                                style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4))),
                          ],
                          Text(
                            expense.paymentMethod.displayName,
                            style: TextStyle(
                                fontSize: 12,
                                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
                          ),
                          if (expense.items.isNotEmpty) ...[
                            Text(' • ',
                                style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4))),
                            Text(
                              '${expense.items.length} items',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),

                // Amount
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      formatCurrencyShort(expense.amount),
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: catColor,
                      ),
                    ),
                    if (expense.isAIExtracted)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'AI',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF8B5CF6)),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
