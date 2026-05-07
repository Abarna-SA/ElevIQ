import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'models/expense_model.dart';

/// Service for CRUD operations on expenses
class ExpenseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Get the expenses collection reference
  CollectionReference get _expensesCollection =>
      _firestore.collection('expenses');

  /// Get current user ID
  String? get _userId => _auth.currentUser?.uid;

  /// Add a new expense
  Future<String> addExpense({
    required double amount,
    required String category,
    required String categoryId,
    required String description,
    required DateTime date,
    required PaymentMethod paymentMethod,
    String? vendor,
    String? notes,
    String? location,
    List<String>? tags,
  }) async {
    if (_userId == null) throw Exception('User not authenticated');

    final now = DateTime.now();
    final docRef = await _expensesCollection.add({
      'userId': _userId,
      'amount': amount,
      'category': category,
      'categoryId': categoryId,
      'description': description,
      'date': Timestamp.fromDate(date),
      'paymentMethod': paymentMethod.name,
      'vendor': vendor ?? '',
      'notes': notes,
      'location': location,
      'tags': tags,
      'createdAt': Timestamp.fromDate(now),
      'updatedAt': Timestamp.fromDate(now),
    });

    return docRef.id;
  }

  /// Update an existing expense
  Future<void> updateExpense(ExpenseModel expense) async {
    if (_userId == null) throw Exception('User not authenticated');
    if (expense.userId != _userId) throw Exception('Unauthorized');

    await _expensesCollection.doc(expense.id).update({
      'amount': expense.amount,
      'category': expense.category,
      'categoryId': expense.categoryId,
      'description': expense.description,
      'date': Timestamp.fromDate(expense.date),
      'paymentMethod': expense.paymentMethod.name,
      'vendor': expense.vendor,
      'notes': expense.notes,
      'location': expense.location,
      'tags': expense.tags,
      'updatedAt': Timestamp.fromDate(DateTime.now()),
    });
  }

  /// Delete an expense
  Future<void> deleteExpense(String expenseId) async {
    if (_userId == null) throw Exception('User not authenticated');

    final doc = await _expensesCollection.doc(expenseId).get();
    if (!doc.exists) throw Exception('Expense not found');

    final data = doc.data() as Map<String, dynamic>;
    if (data['userId'] != _userId) throw Exception('Unauthorized');

    await _expensesCollection.doc(expenseId).delete();
  }

  /// Get all expenses for current user
  Stream<List<ExpenseModel>> getExpenses() {
    if (_userId == null) return Stream.value([]);

    return _expensesCollection
        .where('userId', isEqualTo: _userId)
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ExpenseModel.fromFirestore(doc))
            .toList());
  }

  /// Get expenses for a specific month
  Stream<List<ExpenseModel>> getMonthlyExpenses(int year, int month) {
    if (_userId == null) return Stream.value([]);

    final startOfMonth = DateTime(year, month, 1);
    final endOfMonth = DateTime(year, month + 1, 0, 23, 59, 59);

    return _expensesCollection
        .where('userId', isEqualTo: _userId)
        .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startOfMonth))
        .where('date', isLessThanOrEqualTo: Timestamp.fromDate(endOfMonth))
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ExpenseModel.fromFirestore(doc))
            .toList());
  }

  /// Get expenses by category
  Stream<List<ExpenseModel>> getExpensesByCategory(String categoryId) {
    if (_userId == null) return Stream.value([]);

    return _expensesCollection
        .where('userId', isEqualTo: _userId)
        .where('categoryId', isEqualTo: categoryId)
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ExpenseModel.fromFirestore(doc))
            .toList());
  }

  /// Get total expenses for current month
  Future<double> getCurrentMonthTotal() async {
    if (_userId == null) return 0;

    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final endOfMonth = DateTime(now.year, now.month + 1, 0, 23, 59, 59);

    final snapshot = await _expensesCollection
        .where('userId', isEqualTo: _userId)
        .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startOfMonth))
        .where('date', isLessThanOrEqualTo: Timestamp.fromDate(endOfMonth))
        .get();

    double total = 0;
    for (var doc in snapshot.docs) {
      final data = doc.data() as Map<String, dynamic>;
      total += (data['amount'] ?? 0).toDouble();
    }

    return total;
  }

  /// Get category-wise totals for current month
  Future<Map<String, double>> getCategoryTotals() async {
    if (_userId == null) return {};

    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final endOfMonth = DateTime(now.year, now.month + 1, 0, 23, 59, 59);

    final snapshot = await _expensesCollection
        .where('userId', isEqualTo: _userId)
        .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startOfMonth))
        .where('date', isLessThanOrEqualTo: Timestamp.fromDate(endOfMonth))
        .get();

    final Map<String, double> totals = {};
    for (var doc in snapshot.docs) {
      final data = doc.data() as Map<String, dynamic>;
      final categoryId = data['categoryId'] as String;
      final amount = (data['amount'] ?? 0).toDouble();
      totals[categoryId] = (totals[categoryId] ?? 0) + amount;
    }

    return totals;
  }
}
