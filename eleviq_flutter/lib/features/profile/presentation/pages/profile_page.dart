import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';

class UserProfile {
  final String displayName;
  final String email;
  final double monthlyIncome;
  final int savingsGoal;
  final String currency;

  UserProfile({
    required this.displayName,
    required this.email,
    required this.monthlyIncome,
    required this.savingsGoal,
    required this.currency,
  });

  UserProfile copyWith({
    String? displayName,
    String? email,
    double? monthlyIncome,
    int? savingsGoal,
    String? currency,
  }) {
    return UserProfile(
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      monthlyIncome: monthlyIncome ?? this.monthlyIncome,
      savingsGoal: savingsGoal ?? this.savingsGoal,
      currency: currency ?? this.currency,
    );
  }
}

final _currencies = [
  {'code': 'INR', 'symbol': '₹', 'name': 'Indian Rupee'},
  {'code': 'USD', 'symbol': '\$', 'name': 'US Dollar'},
  {'code': 'EUR', 'symbol': '€', 'name': 'Euro'},
  {'code': 'GBP', 'symbol': '£', 'name': 'British Pound'},
];

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  UserProfile? _profile;
  bool _isLoading = true;
  bool _isSaving = false;
  bool _saved = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final docSnap = await FirebaseFirestore.instance.collection('profiles').doc(user.uid).get();
      if (docSnap.exists) {
        final data = docSnap.data()!;
        setState(() {
          _profile = UserProfile(
            displayName: data['displayName'] as String? ?? user.displayName ?? '',
            email: data['email'] as String? ?? user.email ?? '',
            monthlyIncome: (data['monthlyIncome'] as num?)?.toDouble() ?? 0.0,
            savingsGoal: (data['savingsGoal'] as num?)?.toInt() ?? 20,
            currency: data['currency'] as String? ?? 'INR',
          );
        });
      } else {
        setState(() {
          _profile = UserProfile(
            displayName: user.displayName ?? '',
            email: user.email ?? '',
            monthlyIncome: 0.0,
            savingsGoal: 20,
            currency: 'INR',
          );
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSave() async {
    if (_profile == null) return;
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isSaving = true);
    try {
      await FirebaseFirestore.instance.collection('profiles').doc(user.uid).set({
        'displayName': _profile!.displayName,
        'email': _profile!.email,
        'monthlyIncome': _profile!.monthlyIncome,
        'savingsGoal': _profile!.savingsGoal,
        'currency': _profile!.currency,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      if (mounted) {
        setState(() => _saved = true);
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => _saved = false);
        });
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save profile')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: theme.colorScheme.surface,
        appBar: AppBar(title: const Text('Profile'), backgroundColor: theme.colorScheme.surface),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_profile == null) {
      return Scaffold(
        backgroundColor: theme.colorScheme.surface,
        appBar: AppBar(title: const Text('Profile'), backgroundColor: theme.colorScheme.surface),
        body: const Center(child: Text('Failed to load profile')),
      );
    }

    final selectedCurrency = _currencies.firstWhere((c) => c['code'] == _profile!.currency, orElse: () => _currencies[0]);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)]), // blue-600 to blue-700
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.3), width: 4),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _profile!.displayName.isNotEmpty ? _profile!.displayName[0].toUpperCase() : 'U',
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_profile!.displayName.isNotEmpty ? _profile!.displayName : 'User', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                          Text(_profile!.email, style: TextStyle(color: Colors.blue[100])),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Form
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('PERSONAL INFORMATION', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[600], letterSpacing: 1)),
                    const SizedBox(height: 16),
                    TextFormField(
                      initialValue: _profile!.displayName,
                      decoration: InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: const Icon(Icons.person),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: isDark ? Colors.black26 : Colors.grey[50],
                      ),
                      onChanged: (val) => setState(() => _profile = _profile!.copyWith(displayName: val)),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      initialValue: _profile!.email,
                      enabled: false,
                      decoration: InputDecoration(
                        labelText: 'Email',
                        prefixIcon: const Icon(Icons.email),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: isDark ? Colors.black12 : Colors.grey[100],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    Text('FINANCIAL SETTINGS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[600], letterSpacing: 1)),
                    const SizedBox(height: 16),
                    
                    TextFormField(
                      initialValue: _profile!.monthlyIncome > 0 ? _profile!.monthlyIncome.toStringAsFixed(0) : '',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Monthly Income',
                        prefixText: '${selectedCurrency['symbol']} ',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: isDark ? Colors.black26 : Colors.grey[50],
                      ),
                      onChanged: (val) => setState(() => _profile = _profile!.copyWith(monthlyIncome: double.tryParse(val) ?? 0.0)),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      initialValue: _profile!.savingsGoal.toString(),
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Savings Goal (% of income)',
                        prefixIcon: const Icon(Icons.track_changes),
                        suffixText: '%',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: isDark ? Colors.black26 : Colors.grey[50],
                      ),
                      onChanged: (val) => setState(() => _profile = _profile!.copyWith(savingsGoal: int.tryParse(val) ?? 20)),
                    ),

                    const SizedBox(height: 24),
                    const Text('Currency', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: _currencies.map((c) {
                        final isSelected = _profile!.currency == c['code'];
                        return InkWell(
                          onTap: () => setState(() => _profile = _profile!.copyWith(currency: c['code'] as String)),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            width: (MediaQuery.of(context).size.width - 92) / 2, // 2 cols minus padding
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: isSelected ? Colors.blue.withOpacity(0.1) : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: isSelected ? Colors.blue : theme.dividerColor, width: isSelected ? 2 : 1),
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('${c['symbol']}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isSelected ? Colors.blue : null)),
                                const SizedBox(width: 8),
                                Text('${c['code']}', style: TextStyle(fontWeight: FontWeight.bold, color: isSelected ? Colors.blue : null)),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    if (_profile!.monthlyIncome > 0) ...[
                      const SizedBox(height: 32),
                      Text('MONTHLY BUDGET PREVIEW', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[600], letterSpacing: 1)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey[50],
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            Column(
                              children: [
                                Text('${selectedCurrency['symbol']}${_profile!.monthlyIncome.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                const Text('Total Income', style: TextStyle(color: Colors.grey, fontSize: 10)),
                              ],
                            ),
                            Column(
                              children: [
                                Text('${selectedCurrency['symbol']}${((_profile!.monthlyIncome * _profile!.savingsGoal) / 100).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green)),
                                const Text('Target Savings', style: TextStyle(color: Colors.grey, fontSize: 10)),
                              ],
                            ),
                            Column(
                              children: [
                                Text('${selectedCurrency['symbol']}${(_profile!.monthlyIncome - (_profile!.monthlyIncome * _profile!.savingsGoal) / 100).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blue)),
                                const Text('Available to Spend', style: TextStyle(color: Colors.grey, fontSize: 10)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                    FilledButton.icon(
                      onPressed: _isSaving ? null : _handleSave,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        backgroundColor: _saved ? Colors.green : Colors.blue,
                        minimumSize: const Size(double.infinity, 50),
                      ),
                      icon: _saved
                          ? const Icon(Icons.check)
                          : (_isSaving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.save)),
                      label: Text(_saved ? 'Saved!' : (_isSaving ? 'Saving...' : 'Save Changes')),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
