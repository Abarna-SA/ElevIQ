import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';

class Currency {
  final String code;
  final String symbol;
  final String name;
  final String flag;

  Currency({
    required this.code,
    required this.symbol,
    required this.name,
    required this.flag,
  });
}

final _currencies = [
  Currency(code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳'),
  Currency(code: 'USD', symbol: '\$', name: 'US Dollar', flag: '🇺🇸'),
  Currency(code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺'),
  Currency(code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧'),
  Currency(code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵'),
  Currency(code: 'AUD', symbol: 'A\$', name: 'Australian Dollar', flag: '🇦🇺'),
  Currency(code: 'CAD', symbol: 'C\$', name: 'Canadian Dollar', flag: '🇨🇦'),
  Currency(code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭'),
  Currency(code: 'SGD', symbol: 'S\$', name: 'Singapore Dollar', flag: '🇸🇬'),
  Currency(code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪'),
];

final _exchangeRates = {
  'INR': 1.0,
  'USD': 83.12,
  'EUR': 89.76,
  'GBP': 104.23,
  'JPY': 0.56,
  'AUD': 54.67,
  'CAD': 62.14,
  'CHF': 93.45,
  'SGD': 61.89,
  'AED': 22.64,
};

class CurrencyPage extends ConsumerStatefulWidget {
  const CurrencyPage({super.key});

  @override
  ConsumerState<CurrencyPage> createState() => _CurrencyPageState();
}

class _CurrencyPageState extends ConsumerState<CurrencyPage> {
  late Currency _baseCurrency;
  late Currency _targetCurrency;
  String _amount = '1000';
  bool _isLoading = false;
  String _savedCurrency = 'INR';

  @override
  void initState() {
    super.initState();
    _baseCurrency = _currencies[0];
    _targetCurrency = _currencies[1];
    _fetchUserCurrency();
  }

  Future<void> _fetchUserCurrency() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    try {
      final doc = await FirebaseFirestore.instance.collection('profiles').doc(user.uid).get();
      if (doc.exists && mounted) {
        final currencyCode = doc.data()?['currency'] as String? ?? 'INR';
        final found = _currencies.firstWhere((c) => c.code == currencyCode, orElse: () => _currencies[0]);
        setState(() {
          _savedCurrency = currencyCode;
          _baseCurrency = found;
        });
      }
    } catch (_) {}
  }

  Future<void> _handleSetDefault(Currency currency) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    
    setState(() => _isLoading = true);
    try {
      await FirebaseFirestore.instance.collection('profiles').doc(user.uid).set(
        {'currency': currency.code},
        SetOptions(merge: true),
      );
      if (mounted) {
        setState(() {
          _savedCurrency = currency.code;
          _baseCurrency = currency;
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Default currency set to ${currency.code}')));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save currency')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleSwap() {
    setState(() {
      final temp = _baseCurrency;
      _baseCurrency = _targetCurrency;
      _targetCurrency = temp;
    });
  }

  double _convertAmount(String from, String to, double value) {
    final fromRate = _exchangeRates[from] ?? 1.0;
    final toRate = _exchangeRates[to] ?? 1.0;
    final inINR = value * fromRate;
    return inINR / toRate;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final parsedAmount = double.tryParse(_amount) ?? 0.0;
    final convertedAmount = _convertAmount(_baseCurrency.code, _targetCurrency.code, parsedAmount);
    final rate = _convertAmount(_baseCurrency.code, _targetCurrency.code, 1.0);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Currency'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Converter Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: theme.dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('From', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: _buildCurrencyDropdown(_baseCurrency, (val) {
                          if (val != null) setState(() => _baseCurrency = val);
                        }, isDark),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 3,
                        child: TextField(
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(
                            prefixText: '${_baseCurrency.symbol} ',
                            filled: true,
                            fillColor: isDark ? Colors.black26 : Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          ),
                          controller: TextEditingController(text: _amount)..selection = TextSelection.collapsed(offset: _amount.length),
                          onChanged: (val) => setState(() => _amount = val),
                          textAlign: TextAlign.right,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),

                  Container(
                    alignment: Alignment.center,
                    margin: const EdgeInsets.symmetric(vertical: 16),
                    child: IconButton(
                      onPressed: _handleSwap,
                      icon: const Icon(Icons.swap_vert, color: Colors.blue),
                      style: IconButton.styleFrom(backgroundColor: Colors.blue.withOpacity(0.1)),
                    ),
                  ),

                  const Text('To', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: _buildCurrencyDropdown(_targetCurrency, (val) {
                          if (val != null) setState(() => _targetCurrency = val);
                        }, isDark),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 3,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.blue.withOpacity(0.3)),
                          ),
                          alignment: Alignment.centerRight,
                          child: Text(
                            '${_targetCurrency.symbol} ${convertedAmount.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 16),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: isDark ? Colors.black12 : Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.sync, color: Colors.grey, size: 16),
                            const SizedBox(width: 8),
                            Text('Exchange Rate', style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey)),
                          ],
                        ),
                        Text('1 ${_baseCurrency.code} = ${rate.toStringAsFixed(4)} ${_targetCurrency.code}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Default Currency
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: theme.dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Your Default Currency', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('All your expenses will be displayed in this currency', style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey)),
                  const SizedBox(height: 16),

                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: _currencies.take(6).map((c) {
                      final isSelected = _savedCurrency == c.code;
                      return InkWell(
                        onTap: () => _isLoading ? null : _handleSetDefault(c),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          width: (MediaQuery.of(context).size.width - 92) / 2, // 2 columns minus padding
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.blue.withOpacity(0.1) : (isDark ? Colors.black12 : Colors.grey[50]),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isSelected ? Colors.blue : theme.dividerColor, width: isSelected ? 2 : 1),
                          ),
                          child: Stack(
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(c.flag, style: const TextStyle(fontSize: 24)),
                                  const SizedBox(height: 8),
                                  Text(c.code, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  Text(c.symbol, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                ],
                              ),
                              if (isSelected)
                                const Positioned(
                                  right: 0,
                                  top: 0,
                                  child: Icon(Icons.check_circle, color: Colors.blue),
                                ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Popular Rates
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: theme.dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Popular Rates (vs INR)', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  
                  ..._currencies.where((c) => c.code != 'INR').take(5).map((c) {
                    final rateValue = _exchangeRates[c.code] ?? 1.0;
                    return Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.black12 : Colors.grey[50],
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Text(c.flag, style: const TextStyle(fontSize: 20)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(c.code, style: const TextStyle(fontWeight: FontWeight.bold)),
                                Text(c.name, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('₹${rateValue.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                              const Row(
                                children: [
                                  Icon(Icons.trending_up, size: 12, color: Colors.green),
                                  SizedBox(width: 4),
                                  Text('+0.12%', style: TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold)),
                                ],
                              )
                            ],
                          )
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Last updated: Just now', style: TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrencyDropdown(Currency selected, ValueChanged<Currency?> onChanged, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.black26 : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<Currency>(
          value: selected,
          isExpanded: true,
          items: _currencies.map((c) {
            return DropdownMenuItem<Currency>(
              value: c,
              child: Text('${c.flag} ${c.code}', style: const TextStyle(fontWeight: FontWeight.bold)),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
