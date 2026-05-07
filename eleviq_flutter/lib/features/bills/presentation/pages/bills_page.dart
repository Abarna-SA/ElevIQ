import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';

// ── Models ──
class Bill {
  final String id;
  final String name;
  final double amount;
  final DateTime dueDate;
  final bool isPaid;
  final bool autopay;
  final String category;

  Bill({
    required this.id,
    required this.name,
    required this.amount,
    required this.dueDate,
    required this.isPaid,
    this.autopay = false,
    this.category = 'other',
  });

  factory Bill.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Bill(
      id: doc.id,
      name: data['name'] ?? '',
      amount: (data['amount'] ?? 0).toDouble(),
      dueDate: (data['dueDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
      isPaid: data['isPaid'] ?? false,
      autopay: data['autopay'] ?? false,
      category: data['category'] ?? 'other',
    );
  }

  Map<String, dynamic> toMap(String userId) {
    return {
      'userId': userId,
      'name': name,
      'amount': amount,
      'dueDate': Timestamp.fromDate(dueDate),
      'isPaid': isPaid,
      'autopay': autopay,
      'category': category,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }
}

// ── Providers ──
final billsProvider = StreamProvider<List<Bill>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  
  return FirebaseFirestore.instance
      .collection('bills')
      .where('userId', isEqualTo: user.uid)
      .snapshots()
      .map((snapshot) {
    final list = snapshot.docs.map((doc) => Bill.fromFirestore(doc)).toList();
    list.sort((a, b) => a.dueDate.compareTo(b.dueDate));
    return list;
  });
});

// ── UI ──
class BillsPage extends ConsumerStatefulWidget {
  const BillsPage({super.key});

  @override
  ConsumerState<BillsPage> createState() => _BillsPageState();
}

class _BillsPageState extends ConsumerState<BillsPage> {
  final DateTime _currentMonth = DateTime.now();

  void _showAddBillModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _AddBillSheet(),
    );
  }

  Future<void> _togglePaid(String id, bool isPaid) async {
    try {
      await FirebaseFirestore.instance.collection('bills').doc(id).update({'isPaid': !isPaid});
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _deleteBill(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Bill?'),
        content: const Text('Are you sure you want to delete this bill?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await FirebaseFirestore.instance.collection('bills').doc(id).delete();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final billsAsync = ref.watch(billsProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Bill Calendar'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showAddBillModal,
          ),
        ],
      ),
      body: billsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (bills) {
          final now = DateTime.now();
          final today = DateTime(now.year, now.month, now.day);
          
          final upcomingBills = bills.where((b) => !b.isPaid && !b.dueDate.isBefore(today)).toList();
          final overdueBills = bills.where((b) => !b.isPaid && b.dueDate.isBefore(today)).toList();
          final paidThisMonth = bills.where((b) => b.isPaid && b.dueDate.year == now.year && b.dueDate.month == now.month).toList();
          
          final totalDue = upcomingBills.fold<double>(0, (sum, b) => sum + b.amount) + overdueBills.fold<double>(0, (sum, b) => sum + b.amount);
          final totalPaid = paidThisMonth.fold<double>(0, (sum, b) => sum + b.amount);

          return CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // Stats Row
                      Row(
                        children: [
                          Expanded(child: _buildStatCard(theme, 'Total Due', '₹${totalDue.toStringAsFixed(0)}', upcomingBills.length.toString(), Icons.schedule, Colors.blue)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildStatCard(theme, 'Upcoming', upcomingBills.length.toString(), 'Next 30 days', Icons.calendar_today, Colors.orange)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: _buildStatCard(theme, 'Overdue', overdueBills.length.toString(), overdueBills.isNotEmpty ? 'Needs attention!' : 'None', Icons.error_outline, Colors.red)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildStatCard(theme, 'Paid This Month', '₹${totalPaid.toStringAsFixed(0)}', '${paidThisMonth.length} bills', Icons.check_circle_outline, Colors.green)),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // List Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Upcoming Bills', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),

              if (upcomingBills.isEmpty && overdueBills.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        const Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
                        const SizedBox(height: 16),
                        Text('All caught up!', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text('No bills due in the next 30 days', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        // Display Overdue first, then upcoming
                        final allPending = [...overdueBills, ...upcomingBills];
                        return _buildBillItem(theme, allPending[index], today);
                      },
                      childCount: [...overdueBills, ...upcomingBills].length,
                    ),
                  ),
                ),
                
              const SliverToBoxAdapter(child: SizedBox(height: 80)), // FAB spacing
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddBillModal,
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildStatCard(ThemeData theme, String title, String value, String subtitle, IconData icon, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Expanded(child: Text(title, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)), maxLines: 1, overflow: TextOverflow.ellipsis)),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold, color: title == 'Overdue' && value != '0' ? color : null)),
          const SizedBox(height: 4),
          Text(subtitle, style: theme.textTheme.bodySmall?.copyWith(color: title == 'Overdue' && value != '0' ? color : theme.colorScheme.onSurface.withOpacity(0.4))),
        ],
      ),
    );
  }

  Widget _buildBillItem(ThemeData theme, Bill bill, DateTime today) {
    final diff = bill.dueDate.difference(today).inDays;
    
    Color statusBgColor;
    Color statusColor;
    String statusLabel;

    if (diff < 0) {
      statusBgColor = Colors.red.withOpacity(0.1);
      statusColor = Colors.red;
      statusLabel = 'Overdue';
    } else if (diff == 0) {
      statusBgColor = Colors.orange.withOpacity(0.1);
      statusColor = Colors.orange;
      statusLabel = 'Today';
    } else {
      statusBgColor = theme.colorScheme.surfaceContainerHighest;
      statusColor = theme.colorScheme.onSurface.withOpacity(0.7);
      statusLabel = '${diff}d';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _togglePaid(bill.id, bill.isPaid),
            child: Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: bill.isPaid ? Colors.green : Colors.transparent,
                shape: BoxShape.circle,
                border: Border.all(
                  color: bill.isPaid ? Colors.green : theme.dividerColor,
                  width: 2,
                ),
              ),
              child: bill.isPaid ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.receipt_long, color: Colors.blue, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        bill.name,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          decoration: bill.isPaid ? TextDecoration.lineThrough : null,
                          color: bill.isPaid ? theme.colorScheme.onSurface.withOpacity(0.5) : null,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (bill.autopay) ...[
                      const SizedBox(width: 4),
                      const Icon(Icons.bolt, size: 14, color: Colors.blue),
                    ]
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(DateFormat('MMM d').format(bill.dueDate), style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: statusBgColor, borderRadius: BorderRadius.circular(8)),
                      child: Text(statusLabel, style: theme.textTheme.labelSmall?.copyWith(color: statusColor, fontWeight: FontWeight.bold, fontSize: 10)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${bill.amount.toStringAsFixed(0)}',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  decoration: bill.isPaid ? TextDecoration.lineThrough : null,
                  color: bill.isPaid ? theme.colorScheme.onSurface.withOpacity(0.5) : null,
                ),
              ),
              IconButton(
                icon: Icon(Icons.delete_outline, color: theme.colorScheme.onSurface.withOpacity(0.4), size: 18),
                onPressed: () => _deleteBill(bill.id),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                splashRadius: 20,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Minimal sheet for adding Bills
class _AddBillSheet extends ConsumerStatefulWidget {
  const _AddBillSheet();
  @override
  ConsumerState<_AddBillSheet> createState() => _AddBillSheetState();
}

class _AddBillSheetState extends ConsumerState<_AddBillSheet> {
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  DateTime _dueDate = DateTime.now();
  bool _autopay = false;
  bool _isLoading = false;

  Future<void> _submit() async {
    if (_nameController.text.isEmpty || _amountController.text.isEmpty) return;
    
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final amount = double.tryParse(_amountController.text.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
      final bill = Bill(
        id: '',
        name: _nameController.text.trim(),
        amount: amount,
        dueDate: _dueDate,
        isPaid: false,
        autopay: _autopay,
      );

      await FirebaseFirestore.instance.collection('bills').add(bill.toMap(user.uid));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 24, top: 24, left: 24, right: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Add Bill', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nameController,
            decoration: InputDecoration(labelText: 'Bill Name', filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _amountController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: 'Amount ₹', filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: _dueDate,
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (date != null) setState(() => _dueDate = date);
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Due Date', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.7))),
                  Text(DateFormat('MMM d, yyyy').format(_dueDate), style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('Auto-pay enabled'),
            value: _autopay,
            onChanged: (val) => setState(() => _autopay = val),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: (_nameController.text.isNotEmpty && _amountController.text.isNotEmpty) ? _submit : null,
            style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Add Bill', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
