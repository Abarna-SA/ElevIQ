import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../core/constants/app_constants.dart';

// Reminder Model
class BillReminder {
  final String id;
  final String name;
  final double amount;
  final String categoryId;
  final DateTime dueDate;
  final bool isPaid;
  final String? notes;

  BillReminder({
    required this.id,
    required this.name,
    required this.amount,
    required this.categoryId,
    required this.dueDate,
    required this.isPaid,
    this.notes,
  });

  factory BillReminder.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return BillReminder(
      id: doc.id,
      name: data['name'] ?? '',
      amount: (data['amount'] ?? 0).toDouble(),
      categoryId: data['categoryId'] ?? '',
      dueDate: (data['dueDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
      isPaid: data['isPaid'] ?? false,
      notes: data['notes'],
    );
  }

  Map<String, dynamic> toMap(String userId) {
    return {
      'userId': userId,
      'name': name,
      'amount': amount,
      'categoryId': categoryId,
      'dueDate': Timestamp.fromDate(dueDate),
      'isPaid': isPaid,
      'notes': notes,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }
}

// Service & Providers
final remindersProvider = StreamProvider<List<BillReminder>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);

  return FirebaseFirestore.instance
      .collection('reminders')
      .where('userId', isEqualTo: user.uid)
      .snapshots()
      .map((snapshot) {
    final list = snapshot.docs.map((doc) => BillReminder.fromFirestore(doc)).toList();
    list.sort((a, b) => a.dueDate.compareTo(b.dueDate));
    return list;
  });
});

class RemindersPage extends ConsumerStatefulWidget {
  const RemindersPage({super.key});

  @override
  ConsumerState<RemindersPage> createState() => _RemindersPageState();
}

class _RemindersPageState extends ConsumerState<RemindersPage> {
  String _filter = 'all'; // all, upcoming, overdue, paid

  Future<void> _togglePaid(String id, bool currentStatus) async {
    try {
      await FirebaseFirestore.instance
          .collection('reminders')
          .doc(id)
          .update({'isPaid': !currentStatus});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e')),
        );
      }
    }
  }

  Future<void> _deleteReminder(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Reminder?'),
        content: const Text('Are you sure you want to delete this bill reminder?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await FirebaseFirestore.instance.collection('reminders').doc(id).delete();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete: $e')),
          );
        }
      }
    }
  }

  void _showAddModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _AddReminderSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final remindersAsync = ref.watch(remindersProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Bill Reminders'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showAddModal,
          ),
        ],
      ),
      body: remindersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
        data: (reminders) {
          final now = DateTime.now();
          final today = DateTime(now.year, now.month, now.day);
          
          final upcomingCount = reminders.where((r) => !r.isPaid && !r.dueDate.isBefore(today)).length;
          final overdueCount = reminders.where((r) => !r.isPaid && r.dueDate.isBefore(today)).length;
          final totalDue = reminders.where((r) => !r.isPaid).fold<double>(0, (sum, r) => sum + r.amount);

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
                          Expanded(child: _buildStatCard(theme, 'Total Bills', '${reminders.length}', Icons.notifications, Colors.blue)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildStatCard(theme, 'Upcoming', '$upcomingCount', Icons.schedule, Colors.orange)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: _buildStatCard(theme, 'Overdue', '$overdueCount', Icons.error_outline, Colors.red)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildStatCard(theme, 'Total Due', '₹${totalDue.toStringAsFixed(0)}', Icons.check_circle_outline, Colors.green)),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Filters
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _buildFilterChip(theme, 'All', 'all'),
                            _buildFilterChip(theme, 'Upcoming', 'upcoming'),
                            _buildFilterChip(theme, 'Overdue', 'overdue'),
                            _buildFilterChip(theme, 'Paid', 'paid'),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),

              // List
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: _buildList(theme, reminders, today),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 80)),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddModal,
        icon: const Icon(Icons.add),
        label: const Text('Add Reminder'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
    );
  }

  Widget _buildStatCard(ThemeData theme, String title, String value, IconData icon, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  title,
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(ThemeData theme, String label, String value) {
    final isSelected = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => setState(() => _filter = value),
        backgroundColor: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
        selectedColor: theme.colorScheme.primary,
        labelStyle: TextStyle(
          color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        showCheckmark: false,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  Widget _buildList(ThemeData theme, List<BillReminder> reminders, DateTime today) {
    var filteredList = reminders;

    switch (_filter) {
      case 'upcoming':
        filteredList = reminders.where((r) => !r.isPaid && !r.dueDate.isBefore(today)).toList();
        break;
      case 'overdue':
        filteredList = reminders.where((r) => !r.isPaid && r.dueDate.isBefore(today)).toList();
        break;
      case 'paid':
        filteredList = reminders.where((r) => r.isPaid).toList();
        break;
    }

    if (filteredList.isEmpty) {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 64),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.notifications_none, size: 48, color: Colors.orange),
              ),
              const SizedBox(height: 16),
              Text(
                'No reminders',
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Add bill reminders to stay on top of payments',
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
              ),
            ],
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final item = filteredList[index];
          final category = getCategoryById(item.categoryId) ?? kDefaultCategories.first;
          
          Color statusBgColor;
          Color statusColor;
          String statusLabel;

          if (item.isPaid) {
            statusBgColor = Colors.green.withOpacity(0.1);
            statusColor = Colors.green;
            statusLabel = 'Paid';
          } else {
            final diff = item.dueDate.difference(today).inDays;
            if (diff < 0) {
              statusBgColor = Colors.red.withOpacity(0.1);
              statusColor = Colors.red;
              statusLabel = 'Overdue';
            } else if (diff == 0) {
              statusBgColor = Colors.orange.withOpacity(0.1);
              statusColor = Colors.orange;
              statusLabel = 'Due today';
            } else if (diff == 1) {
              statusBgColor = Colors.yellow.withOpacity(0.2);
              statusColor = Colors.amber.shade700;
              statusLabel = 'Due tomorrow';
            } else if (diff <= 7) {
              statusBgColor = Colors.blue.withOpacity(0.1);
              statusColor = Colors.blue;
              statusLabel = '$diff days left';
            } else {
              statusBgColor = theme.colorScheme.surfaceContainerHighest;
              statusColor = theme.colorScheme.onSurface.withOpacity(0.7);
              statusLabel = DateFormat('MMM d').format(item.dueDate);
            }
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
              children: [
                GestureDetector(
                  onTap: () => _togglePaid(item.id, item.isPaid),
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: item.isPaid ? Colors.green : Colors.transparent,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: item.isPaid ? Colors.green : theme.dividerColor,
                        width: 2,
                      ),
                    ),
                    child: item.isPaid ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                  ),
                ),
                const SizedBox(width: 16),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: category.color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(category.icon, style: const TextStyle(fontSize: 20)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          decoration: item.isPaid ? TextDecoration.lineThrough : null,
                          color: item.isPaid ? theme.colorScheme.onSurface.withOpacity(0.5) : theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: statusBgColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              statusLabel,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: statusColor,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
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
                      '₹${item.amount.toStringAsFixed(0)}',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        decoration: item.isPaid ? TextDecoration.lineThrough : null,
                        color: item.isPaid ? theme.colorScheme.onSurface.withOpacity(0.5) : theme.colorScheme.onSurface,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.delete_outline, color: theme.colorScheme.onSurface.withOpacity(0.4)),
                      onPressed: () => _deleteReminder(item.id),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      splashRadius: 20,
                    ),
                  ],
                ),
              ],
            ),
          );
        },
        childCount: filteredList.length,
      ),
    );
  }
}

// Minimal add reminder sheet logic
class _AddReminderSheet extends ConsumerStatefulWidget {
  const _AddReminderSheet();

  @override
  ConsumerState<_AddReminderSheet> createState() => _AddReminderSheetState();
}

class _AddReminderSheetState extends ConsumerState<_AddReminderSheet> {
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();
  String _selectedCategoryId = '';
  DateTime _dueDate = DateTime.now();
  bool _isLoading = false;

  Future<void> _submit() async {
    if (_nameController.text.isEmpty || _amountController.text.isEmpty || _selectedCategoryId.isEmpty) return;

    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final amountStr = _amountController.text.replaceAll(RegExp(r'[^0-9.]'), '');
      final amount = double.tryParse(amountStr) ?? 0.0;

      final reminder = BillReminder(
        id: '', // Generated by Firestore
        name: _nameController.text.trim(),
        amount: amount,
        categoryId: _selectedCategoryId,
        dueDate: _dueDate,
        isPaid: false,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );

      await FirebaseFirestore.instance.collection('reminders').add(reminder.toMap(user.uid));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add reminder: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        top: 24,
        left: 24,
        right: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Add Bill Reminder',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              )
            ],
          ),
          const SizedBox(height: 24),

          // Name
          TextField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: 'Bill Name',
              hintText: 'Electricity, Rent, Internet...',
              filled: true,
              fillColor: theme.colorScheme.surfaceContainerHighest,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),

          // Amount
          TextField(
            controller: _amountController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: 'Amount ₹',
              hintText: '0',
              filled: true,
              fillColor: theme.colorScheme.surfaceContainerHighest,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),

          // Category Dropdown
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedCategoryId.isEmpty ? null : _selectedCategoryId,
                hint: const Text('Select Category'),
                isExpanded: true,
                items: kDefaultCategories.map((c) {
                  return DropdownMenuItem(
                    value: c.id,
                    child: Text('${c.icon} ${c.name}'),
                  );
                }).toList(),
                onChanged: (val) {
                  setState(() => _selectedCategoryId = val ?? '');
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Date Picker
          InkWell(
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: _dueDate,
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
              );
              if (date != null) {
                setState(() => _dueDate = date);
              }
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Due Date', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.7))),
                  Row(
                    children: [
                      Text(DateFormat('MMM d, yyyy').format(_dueDate), style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      const Icon(Icons.calendar_today, size: 16),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Notes
          TextField(
            controller: _notesController,
            decoration: InputDecoration(
              labelText: 'Notes (Optional)',
              hintText: 'Account number, reference...',
              filled: true,
              fillColor: theme.colorScheme.surfaceContainerHighest,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 24),

          FilledButton(
            onPressed: (_nameController.text.isNotEmpty && _amountController.text.isNotEmpty && _selectedCategoryId.isNotEmpty)
                ? _submit : null,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Add Reminder', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
