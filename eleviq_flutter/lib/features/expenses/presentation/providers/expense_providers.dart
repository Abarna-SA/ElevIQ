import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/expense_service.dart';
import '../../data/models/expense_model.dart';

/// ─── Expense Service Provider ───────────────────
final expenseServiceProvider = Provider<ExpenseService>((ref) => ExpenseService());

/// ─── All Expenses Stream ────────────────────────
final expensesStreamProvider = StreamProvider<List<ExpenseModel>>((ref) {
  final service = ref.watch(expenseServiceProvider);
  return service.getExpenses();
});

/// ─── Monthly Expenses Stream ────────────────────
final monthlyExpensesProvider = StreamProvider.family<List<ExpenseModel>, DateTime>((ref, monthDate) {
  final service = ref.watch(expenseServiceProvider);
  return service.getMonthlyExpenses(monthDate.year, monthDate.month);
});

/// ─── Selected Month Provider ────────────────────
final selectedMonthProvider = StateProvider<DateTime>((ref) => DateTime.now());

/// ─── Current Month Expenses ─────────────────────
final currentMonthExpensesProvider = StreamProvider<List<ExpenseModel>>((ref) {
  final service = ref.watch(expenseServiceProvider);
  final month = ref.watch(selectedMonthProvider);
  return service.getMonthlyExpenses(month.year, month.month);
});

/// ─── Monthly Total (derived) ────────────────────
final monthlyTotalProvider = Provider<double>((ref) {
  final expenses = ref.watch(currentMonthExpensesProvider);
  return expenses.when(
    data: (list) => list.fold(0.0, (sum, e) => sum + e.amount),
    loading: () => 0.0,
    error: (_, __) => 0.0,
  );
});

/// ─── Category Totals (derived) ──────────────────
final categoryTotalsProvider = Provider<Map<String, double>>((ref) {
  final expenses = ref.watch(currentMonthExpensesProvider);
  return expenses.when(
    data: (list) {
      final Map<String, double> totals = {};
      for (final e in list) {
        totals[e.categoryId] = (totals[e.categoryId] ?? 0) + e.amount;
      }
      return totals;
    },
    loading: () => {},
    error: (_, __) => {},
  );
});

/// ─── Search Query Provider ──────────────────────
final expenseSearchQueryProvider = StateProvider<String>((ref) => '');

/// ─── Category Filter Provider ───────────────────
final expenseCategoryFilterProvider = StateProvider<String?>((ref) => null);

/// ─── Payment Method Filter Provider ─────────────
final expensePaymentFilterProvider = StateProvider<PaymentMethod?>((ref) => null);

/// ─── Filtered Expenses (derived) ────────────────
final filteredExpensesProvider = Provider<List<ExpenseModel>>((ref) {
  final expenses = ref.watch(currentMonthExpensesProvider);
  final query = ref.watch(expenseSearchQueryProvider).toLowerCase();
  final categoryFilter = ref.watch(expenseCategoryFilterProvider);
  final paymentFilter = ref.watch(expensePaymentFilterProvider);

  return expenses.when(
    data: (list) {
      var filtered = list;

      // Search filter
      if (query.isNotEmpty) {
        filtered = filtered.where((e) {
          return e.description.toLowerCase().contains(query) ||
              e.vendor.toLowerCase().contains(query) ||
              e.category.toLowerCase().contains(query) ||
              e.notes?.toLowerCase().contains(query) == true;
        }).toList();
      }

      // Category filter
      if (categoryFilter != null) {
        filtered = filtered.where((e) => e.categoryId == categoryFilter).toList();
      }

      // Payment method filter
      if (paymentFilter != null) {
        filtered = filtered.where((e) => e.paymentMethod == paymentFilter).toList();
      }

      return filtered;
    },
    loading: () => [],
    error: (_, __) => [],
  );
});

/// ─── Expense Count ──────────────────────────────
final expenseCountProvider = Provider<int>((ref) {
  final expenses = ref.watch(currentMonthExpensesProvider);
  return expenses.when(
    data: (list) => list.length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});

/// ─── Daily Average ──────────────────────────────
final dailyAverageProvider = Provider<double>((ref) {
  final total = ref.watch(monthlyTotalProvider);
  final day = DateTime.now().day;
  return day > 0 ? total / day : 0;
});
