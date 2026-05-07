import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';

// ── Models ──
class Asset {
  final String id;
  final String name;
  final String category;
  final double value;

  Asset({required this.id, required this.name, required this.category, required this.value});

  factory Asset.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Asset(
      id: doc.id,
      name: data['name'] ?? '',
      category: data['category'] ?? 'other',
      value: (data['value'] ?? 0).toDouble(),
    );
  }
}

class Liability {
  final String id;
  final String name;
  final String category;
  final double value;

  Liability({required this.id, required this.name, required this.category, required this.value});

  factory Liability.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Liability(
      id: doc.id,
      name: data['name'] ?? '',
      category: data['category'] ?? 'other',
      value: (data['value'] ?? 0).toDouble(),
    );
  }
}

// ── Providers ──
final assetsProvider = StreamProvider<List<Asset>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  return FirebaseFirestore.instance
      .collection('users')
      .doc(user.uid)
      .collection('assets')
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => Asset.fromFirestore(doc)).toList());
});

final liabilitiesProvider = StreamProvider<List<Liability>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  return FirebaseFirestore.instance
      .collection('users')
      .doc(user.uid)
      .collection('liabilities')
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => Liability.fromFirestore(doc)).toList());
});

// ── UI ──
class NetWorthPage extends ConsumerStatefulWidget {
  const NetWorthPage({super.key});

  @override
  ConsumerState<NetWorthPage> createState() => _NetWorthPageState();
}

class _NetWorthPageState extends ConsumerState<NetWorthPage> {
  String _formatValue(double value) {
    if (value >= 10000000) return '₹${(value / 10000000).toStringAsFixed(2)}Cr';
    if (value >= 100000) return '₹${(value / 100000).toStringAsFixed(2)}L';
    return '₹${value.toStringAsFixed(0)}';
  }

  void _showAddModal(bool isAsset) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddEntrySheet(isAsset: isAsset),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final assetsAsync = ref.watch(assetsProvider);
    final liabilitiesAsync = ref.watch(liabilitiesProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Net Worth'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
      ),
      body: assetsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (assets) {
          return liabilitiesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
            data: (liabilities) {
              final totalAssets = assets.fold<double>(0, (sum, a) => sum + a.value);
              final totalLiabilities = liabilities.fold<double>(0, (sum, l) => sum + l.value);
              final netWorth = totalAssets - totalLiabilities;
              final hasData = assets.isNotEmpty || liabilities.isNotEmpty;

              if (!hasData) {
                return _buildEmptyState(theme, context);
              }

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                   _buildSummaryCards(theme, totalAssets, totalLiabilities, netWorth, assets.length, liabilities.length),
                   const SizedBox(height: 24),
                   
                   // Asset & Liability Lists
                   Text('Assets', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                   const SizedBox(height: 12),
                   ...assets.map((a) => _buildEntryTile(theme, a.name, a.value, true)),
                   const SizedBox(height: 8),
                   TextButton.icon(
                     onPressed: () => _showAddModal(true),
                     icon: const Icon(Icons.add),
                     label: const Text('Add Asset'),
                   ),
                   
                   const SizedBox(height: 24),
                   
                   Text('Liabilities', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                   const SizedBox(height: 12),
                   ...liabilities.map((l) => _buildEntryTile(theme, l.name, l.value, false)),
                   const SizedBox(height: 8),
                   TextButton.icon(
                     onPressed: () => _showAddModal(false),
                     icon: const Icon(Icons.add),
                     label: const Text('Add Liability'),
                     style: TextButton.styleFrom(foregroundColor: Colors.red),
                   ),
                   const SizedBox(height: 40),
                ],
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme, BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.account_balance, size: 48, color: Colors.amber),
            ),
            const SizedBox(height: 24),
            Text(
              'Calculate Your Net Worth',
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Add your assets and liabilities to get a complete picture of your financial health.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                FilledButton.icon(
                  onPressed: () => _showAddModal(true),
                  icon: const Icon(Icons.add),
                  label: const Text('Add Asset'),
                  style: FilledButton.styleFrom(backgroundColor: Colors.green),
                ),
                const SizedBox(width: 16),
                FilledButton.icon(
                  onPressed: () => _showAddModal(false),
                  icon: const Icon(Icons.add),
                  label: const Text('Add Liability'),
                  style: FilledButton.styleFrom(backgroundColor: Colors.red),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCards(ThemeData theme, double assetsValue, double liabilitiesValue, double netWorth, int assetsCount, int liabilitiesCount) {
    return Column(
      children: [
        // Total Assets
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.trending_up, color: Colors.green),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Assets', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                    Text(_formatValue(assetsValue), style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold, color: Colors.green)),
                    Text('$assetsCount items', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.4))),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Total Liabilities
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.trending_down, color: Colors.red),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Liabilities', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                    Text(_formatValue(liabilitiesValue), style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold, color: Colors.red)),
                    Text('$liabilitiesCount items', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.4))),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Net Worth
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: netWorth >= 0 
                  ? [Colors.green.shade500, Colors.green.shade700]
                  : [Colors.red.shade500, Colors.red.shade700],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.savings, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Text('Net Worth', style: TextStyle(color: Colors.white, fontSize: 16)),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                _formatValue(netWorth),
                style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEntryTile(ThemeData theme, String name, double value, bool isAsset) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          Text(
            _formatValue(value),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: isAsset ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }
}

// Minimal sheet for adding Asset/Liability
class _AddEntrySheet extends ConsumerStatefulWidget {
  final bool isAsset;
  const _AddEntrySheet({required this.isAsset});

  @override
  ConsumerState<_AddEntrySheet> createState() => _AddEntrySheetState();
}

class _AddEntrySheetState extends ConsumerState<_AddEntrySheet> {
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  bool _isLoading = false;

  Future<void> _submit() async {
    if (_nameController.text.isEmpty || _amountController.text.isEmpty) return;
    
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final amountStr = _amountController.text.replaceAll(RegExp(r'[^0-9.]'), '');
      final amount = double.tryParse(amountStr) ?? 0.0;
      final collectionName = widget.isAsset ? 'assets' : 'liabilities';

      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection(collectionName)
          .add({
        'name': _nameController.text.trim(),
        'value': amount,
        'category': 'other', // simplified
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = widget.isAsset ? Colors.green : Colors.red;

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
                widget.isAsset ? 'Add Asset' : 'Add Liability',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: 'Name',
              hintText: widget.isAsset ? 'House, Car, Savings...' : 'Mortgage, Loan, Credit Card...',
              filled: true,
              fillColor: theme.colorScheme.surfaceContainerHighest,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _amountController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: 'Current Value ₹',
              filled: true,
              fillColor: theme.colorScheme.surfaceContainerHighest,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: (_nameController.text.isNotEmpty && _amountController.text.isNotEmpty) ? _submit : null,
            style: FilledButton.styleFrom(
              backgroundColor: color,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading 
                ? const CircularProgressIndicator(color: Colors.white) 
                : Text('Add ${widget.isAsset ? 'Asset' : 'Liability'}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
