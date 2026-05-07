import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../features/expenses/presentation/providers/expense_providers.dart';
import '../../../../features/expenses/data/models/expense_model.dart';
import 'package:intl/intl.dart';

// ── Models ──
class Participant {
  String name;
  String email;
  double amount;
  bool isPaid;

  Participant({
    required this.name,
    required this.email,
    required this.amount,
    required this.isPaid,
  });

  factory Participant.fromMap(Map<String, dynamic> data) {
    return Participant(
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      amount: (data['amount'] ?? 0).toDouble(),
      isPaid: data['isPaid'] ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'email': email,
      'amount': amount,
      'isPaid': isPaid,
    };
  }
}

class SplitExpense {
  final String id;
  final String expenseId;
  final String description;
  final double totalAmount;
  final List<Participant> participants;
  final DateTime createdAt;

  SplitExpense({
    required this.id,
    required this.expenseId,
    required this.description,
    required this.totalAmount,
    required this.participants,
    required this.createdAt,
  });

  factory SplitExpense.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return SplitExpense(
      id: doc.id,
      expenseId: data['expenseId'] ?? '',
      description: data['description'] ?? '',
      totalAmount: (data['totalAmount'] ?? 0).toDouble(),
      participants: (data['participants'] as List<dynamic>?)
              ?.map((p) => Participant.fromMap(p as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap(String userId) {
    return {
      'userId': userId,
      'expenseId': expenseId,
      'description': description,
      'totalAmount': totalAmount,
      'participants': participants.map((p) => p.toMap()).toList(),
      'createdAt': FieldValue.serverTimestamp(),
    };
  }
}

// ── Providers ──
final splitsProvider = StreamProvider<List<SplitExpense>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  
  return FirebaseFirestore.instance
      .collection('splits')
      .where('userId', isEqualTo: user.uid)
      .snapshots()
      .map((snapshot) {
    final list = snapshot.docs.map((doc) => SplitExpense.fromFirestore(doc)).toList();
    list.sort((a, b) => b.createdAt.compareTo(a.createdAt)); // Descending order
    return list;
  });
});

// ── UI ──
class SplitPage extends ConsumerStatefulWidget {
  const SplitPage({super.key});

  @override
  ConsumerState<SplitPage> createState() => _SplitPageState();
}

class _SplitPageState extends ConsumerState<SplitPage> {
  void _showAddSplitModal(List<ExpenseModel> expenses) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddSplitSheet(expenses: expenses),
    );
  }

  Future<void> _deleteSplit(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Split?'),
        content: const Text('Are you sure you want to delete this split?'),
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
        await FirebaseFirestore.instance.collection('splits').doc(id).delete();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  Future<void> _togglePaid(SplitExpense split, int participantIndex) async {
    final updatedParticipants = List<Participant>.from(split.participants);
    updatedParticipants[participantIndex].isPaid = !updatedParticipants[participantIndex].isPaid;

    try {
      await FirebaseFirestore.instance.collection('splits').doc(split.id).update({
        'participants': updatedParticipants.map((p) => p.toMap()).toList(),
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update: $e')));
    }
  }

  void _copyShareText(SplitExpense split) {
    var text = '💰 Split: ${split.description}\nTotal: ₹${split.totalAmount.toStringAsFixed(2)}\n\n';
    for (var p in split.participants) {
      final status = p.isPaid ? '✅' : '⏳';
      text += '• ${p.name}: ₹${p.amount.toStringAsFixed(2)} $status\n';
    }
    text += '\nShared via ElevIQ';

    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied to clipboard!')));
  }

  double _getTotalOwed(List<SplitExpense> splits) {
    return splits.fold(0.0, (sum, split) {
      final unpaid = split.participants.where((p) => !p.isPaid).fold(0.0, (s, p) => s + p.amount);
      return sum + unpaid;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final splitsAsync = ref.watch(splitsProvider);
    final expensesAsync = ref.watch(expensesStreamProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Split Expenses'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => expensesAsync.whenData((expenses) => _showAddSplitModal(expenses)),
          ),
        ],
      ),
      body: splitsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (splits) {
          final totalOwed = _getTotalOwed(splits);
          int unpaidShares = 0;
          for (var split in splits) {
            unpaidShares += split.participants.where((p) => !p.isPaid).length;
          }

          return CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Colors.deepPurpleAccent, Colors.pinkAccent]),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [BoxShadow(color: Colors.deepPurpleAccent.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Total Owed to You', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
                        const SizedBox(height: 8),
                        Text('₹${totalOwed.toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('From $unpaidShares unpaid shares', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
                      ],
                    ),
                  ),
                ),
              ),
              if (splits.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(color: Colors.purple.withOpacity(0.1), shape: BoxShape.circle),
                            child: const Icon(Icons.group, size: 48, color: Colors.purple),
                          ),
                          const SizedBox(height: 24),
                          Text('No splits yet', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text('Split a bill to track who owes what.', textAlign: TextAlign.center, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                          const SizedBox(height: 32),
                          FilledButton.icon(
                            onPressed: () => expensesAsync.whenData((expenses) => _showAddSplitModal(expenses)),
                            icon: const Icon(Icons.add),
                            label: const Text('Split your first bill'),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final split = splits[index];
                      final paidCount = split.participants.where((p) => p.isPaid).length;
                      final totalParticipants = split.participants.length;

                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: theme.dividerColor),
                        ),
                        child: Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(split.description, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Text('${DateFormat('MMM d, yyyy').format(split.createdAt)} • ₹${split.totalAmount.toStringAsFixed(0)}', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.5))),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.share_outlined, size: 20, color: Colors.blue),
                                        onPressed: () => _copyShareText(split),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                                        onPressed: () => _deleteSplit(split.id),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Row(
                                children: [
                                  SizedBox(
                                    height: 32,
                                    child: ListView.builder(
                                      scrollDirection: Axis.horizontal,
                                      shrinkWrap: true,
                                      itemCount: split.participants.length > 4 ? 4 : split.participants.length,
                                      itemBuilder: (ctx, idx) {
                                        if (idx == 3 && split.participants.length > 4) {
                                          return Container(
                                            width: 32,
                                            height: 32,
                                            margin: const EdgeInsets.only(right: 4),
                                            decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, shape: BoxShape.circle),
                                            alignment: Alignment.center,
                                            child: Text('+${split.participants.length - 3}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                          );
                                        }
                                        return Container(
                                          width: 32,
                                          height: 32,
                                          margin: const EdgeInsets.only(right: 4),
                                          decoration: const BoxDecoration(gradient: LinearGradient(colors: [Colors.blue, Colors.purple]), shape: BoxShape.circle),
                                          alignment: Alignment.center,
                                          child: Text(split.participants[idx].name.isNotEmpty ? split.participants[idx].name[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white, fontSize: 14)),
                                        );
                                      },
                                    ),
                                  ),
                                  Text('$paidCount/$totalParticipants paid', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                                ],
                              ),
                            ),
                            const Divider(height: 32),
                            ...split.participants.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final p = entry.value;

                              return InkWell(
                                onTap: () => _togglePaid(split, idx),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: p.isPaid ? Colors.green : Colors.transparent,
                                          border: Border.all(color: p.isPaid ? Colors.green : theme.dividerColor, width: 2),
                                        ),
                                        alignment: Alignment.center,
                                        child: p.isPaid ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              p.name,
                                              style: TextStyle(
                                                fontWeight: FontWeight.w500,
                                                decoration: p.isPaid ? TextDecoration.lineThrough : null,
                                                color: p.isPaid ? theme.colorScheme.onSurface.withOpacity(0.4) : theme.colorScheme.onSurface,
                                              ),
                                            ),
                                            if (p.email.isNotEmpty)
                                              Text(p.email, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.5))),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        '₹${p.amount.toStringAsFixed(0)}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          decoration: p.isPaid ? TextDecoration.lineThrough : null,
                                          color: p.isPaid ? theme.colorScheme.onSurface.withOpacity(0.4) : theme.colorScheme.onSurface,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }),
                            const SizedBox(height: 8),
                          ],
                        ),
                      );
                    },
                    childCount: splits.length,
                  ),
                ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => expensesAsync.whenData((expenses) => _showAddSplitModal(expenses)),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _AddSplitSheet extends ConsumerStatefulWidget {
  final List<ExpenseModel> expenses;
  const _AddSplitSheet({required this.expenses});
  
  @override
  ConsumerState<_AddSplitSheet> createState() => _AddSplitSheetState();
}

class _AddSplitSheetState extends ConsumerState<_AddSplitSheet> {
  String? _selectedExpenseId;
  String _splitType = 'equal'; // 'equal', 'custom'
  final List<Participant> _participants = [Participant(name: '', email: '', amount: 0, isPaid: false)];
  bool _isLoading = false;

  ExpenseModel? get _selectedExpense => widget.expenses.cast<ExpenseModel?>().firstWhere((e) => e?.id == _selectedExpenseId, orElse: () => null);

  void _addParticipant() {
    setState(() => _participants.add(Participant(name: '', email: '', amount: 0, isPaid: false)));
    _recalculateSplit();
  }

  void _removeParticipant(int index) {
    setState(() => _participants.removeAt(index));
    _recalculateSplit();
  }

  void _updateParticipantName(int index, String name) {
    setState(() => _participants[index].name = name);
  }

  void _updateParticipantAmount(int index, double amount) {
    setState(() => _participants[index].amount = amount);
  }

  void _recalculateSplit() {
    if (_splitType == 'equal' && _selectedExpense != null) {
      final share = _selectedExpense!.amount / (_participants.length + 1); // +1 assuming user is included automatically
      setState(() {
        for (var p in _participants) {
          p.amount = double.parse(share.toStringAsFixed(2));
        }
      });
    }
  }

  Future<void> _submit() async {
    final expense = _selectedExpense;
    if (expense == null) return;
    
    final validParticipants = _participants.where((p) => p.name.isNotEmpty && p.amount > 0).toList();
    if (validParticipants.isEmpty) return;

    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final split = SplitExpense(
        id: '',
        expenseId: expense.id,
        description: expense.description,
        totalAmount: expense.amount,
        participants: validParticipants,
        createdAt: DateTime.now(),
      );

      await FirebaseFirestore.instance.collection('splits').add(split.toMap(user.uid));
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
    final expense = _selectedExpense;

    return Container(
      decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 24, top: 24, left: 24, right: 24),
      height: MediaQuery.of(context).size.height * 0.9,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Split a Bill', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 24),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Select Expense', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedExpenseId,
                    decoration: InputDecoration(filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
                    items: widget.expenses.take(20).map((e) {
                      return DropdownMenuItem(
                        value: e.id,
                        child: Text('${e.description} - ₹${e.amount.toStringAsFixed(0)} (${DateFormat('MMM d').format(e.date)})', overflow: TextOverflow.ellipsis),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedExpenseId = val;
                        _recalculateSplit();
                      });
                    },
                  ),
                  
                  if (expense != null) ...[
                    const SizedBox(height: 24),
                    Text('Split Type', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _buildSplitTypeButton('equal', 'Equal Split', theme)),
                        const SizedBox(width: 8),
                        Expanded(child: _buildSplitTypeButton('custom', 'Custom Amounts', theme)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Participants', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
                        TextButton(onPressed: _addParticipant, child: const Text('+ Add Person')),
                      ],
                    ),
                    ..._participants.asMap().entries.map((entry) {
                      final i = entry.key;
                      final p = entry.value;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: TextField(
                                onChanged: (val) => _updateParticipantName(i, val),
                                decoration: InputDecoration(hintText: 'Name', filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12), border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (_splitType == 'custom')
                              Expanded(
                                flex: 1,
                                child: TextField(
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  onChanged: (val) => _updateParticipantAmount(i, double.tryParse(val) ?? 0.0),
                                  decoration: InputDecoration(hintText: '₹', filled: true, fillColor: theme.colorScheme.surfaceContainerHighest, contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12), border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)),
                                ),
                              )
                            else
                              Expanded(flex: 1, child: Container(alignment: Alignment.centerRight, child: Text('₹${p.amount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)))),
                            if (_participants.length > 1) ...[
                              const SizedBox(width: 4),
                              IconButton(icon: const Icon(Icons.close, size: 20), color: Colors.red, onPressed: () => _removeParticipant(i)),
                            ] else ...[
                              const SizedBox(width: 44),
                            ]
                          ],
                        ),
                      );
                    }),
                    
                    const SizedBox(height: 12),
                    Text('Your share: ₹${(expense.amount - _participants.fold(0.0, (s, p) => s + p.amount)).toStringAsFixed(2)}', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.5))),
                  ],
                ],
              ),
            ),
          ),
          if (expense != null) ...[
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submit,
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Create Split', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildSplitTypeButton(String key, String label, ThemeData theme) {
    final isSelected = _splitType == key;
    return InkWell(
      onTap: () {
        setState(() {
          _splitType = key;
          _recalculateSplit();
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
