import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:math';

class ExtractedData {
  final String merchant;
  final DateTime date;
  final double totalAmount;
  final List<Map<String, dynamic>> items;
  final String category;
  final String paymentMethod;
  final int confidence;

  ExtractedData({
    required this.merchant,
    required this.date,
    required this.totalAmount,
    required this.items,
    required this.category,
    required this.paymentMethod,
    required this.confidence,
  });
}

class ScanPage extends ConsumerStatefulWidget {
  const ScanPage({super.key});

  @override
  ConsumerState<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends ConsumerState<ScanPage> {
  bool _isScanning = false;
  ExtractedData? _extractedData;
  String? _error;

  Future<void> _simulateScan() async {
    setState(() {
      _isScanning = true;
      _error = null;
      _extractedData = null;
    });

    // Simulate network delay for AI scanning
    await Future.delayed(const Duration(seconds: 3));

    if (!mounted) return;

    // 10% chance to fail for realism
    if (Random().nextDouble() < 0.1) {
      setState(() {
        _isScanning = false;
        _error = 'Failed to analyze receipt. Please try again with a clearer photo.';
      });
      return;
    }

    setState(() {
      _isScanning = false;
      _extractedData = ExtractedData(
        merchant: 'Grocery Store ${Random().nextInt(100)}',
        date: DateTime.now().subtract(Duration(days: Random().nextInt(5))),
        totalAmount: 450.0 + Random().nextInt(500),
        items: [
          {'name': 'Milk 1L', 'price': 60.0},
          {'name': 'Bread', 'price': 40.0},
          {'name': 'Eggs 1Dozen', 'price': 80.0},
          {'name': 'Apples 1kg', 'price': 150.0},
          {'name': 'Vegetables', 'price': 120.0},
        ],
        category: 'grocery',
        paymentMethod: 'card',
        confidence: 85 + Random().nextInt(14),
      );
    });
  }

  void _reset() {
    setState(() {
      _isScanning = false;
      _extractedData = null;
      _error = null;
    });
  }

  void _handleAddExpense() {
    if (_extractedData == null) return;
    
    // In a real app, pass the extracted data to AddExpensePage.
    // Ensure AddExpensePage accepts parameters or read from a state provider.
    // For now we'll route to placeholder add expense path `/expenses/add` if it existed, or we let the UI handle it.
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Expense details sent to Add screen!')));
    context.pop(); // Returns to previous screen assuming they add from there.
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Scan Receipt'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            if (_extractedData == null && !_isScanning) ...[
              GestureDetector(
                onTap: _simulateScan,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(48),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: theme.colorScheme.primary.withOpacity(0.5), width: 2, style: BorderStyle.solid),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Colors.blue, Colors.purple]),
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
                        ),
                        child: const Icon(Icons.document_scanner, size: 48, color: Colors.white),
                      ),
                      const SizedBox(height: 24),
                      Text('Tap to Scan Receipt', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text('Use AI to automatically extract merchant, amount, and category.', textAlign: TextAlign.center, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
                      const SizedBox(height: 32),
                      FilledButton.icon(
                        onPressed: _simulateScan,
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('Simulate Camera / Upload'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(24)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('📸 Tips for better scanning', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Text('• Ensure good lighting and clear focus\n• Capture the entire receipt including date and total\n• Flatten the receipt before taking a photo\n• Avoid shadows and glare', style: TextStyle(color: Colors.blue.shade700, height: 1.5)),
                  ],
                ),
              ),
            ],

            if (_isScanning) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(48),
                decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(24), border: Border.all(color: theme.dividerColor)),
                child: Column(
                  children: [
                    const SizedBox(
                      width: 64,
                      height: 64,
                      child: CircularProgressIndicator(strokeWidth: 4),
                    ),
                    const SizedBox(height: 32),
                    Text('Analyzing receipt with AI...', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('Extracting merchant, amount & category', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.5))),
                  ],
                ),
              ),
            ],

            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.red.withOpacity(0.3))),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red),
                    const SizedBox(width: 12),
                    Expanded(child: Text(_error!, style: const TextStyle(color: Colors.red))),
                    TextButton(onPressed: _simulateScan, child: const Text('Retry', style: TextStyle(color: Colors.red))),
                  ],
                ),
              )
            ],

            if (_extractedData != null) ...[
              Container(
                decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(24), border: Border.all(color: theme.dividerColor)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(colors: [Colors.green, Colors.teal]),
                        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, color: Colors.white, size: 32),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Successfully Extracted!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                              Text('Confidence: ${_extractedData!.confidence}%', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
                            ],
                          )
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          _buildDataRow('Merchant', _extractedData!.merchant, true),
                          const Divider(height: 24),
                          _buildDataRow('Amount', '₹${_extractedData!.totalAmount.toStringAsFixed(0)}', true, isAmount: true),
                          const Divider(height: 24),
                          _buildDataRow('Date', '${_extractedData!.date.day}/${_extractedData!.date.month}/${_extractedData!.date.year}', false),
                          const Divider(height: 24),
                          _buildDataRow('Category', _extractedData!.category, false),
                          
                          if (_extractedData!.items.isNotEmpty) ...[
                            const SizedBox(height: 32),
                            const Align(alignment: Alignment.centerLeft, child: Text('Items Detected', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
                            const SizedBox(height: 12),
                            ..._extractedData!.items.take(5).map((item) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(child: Text(item['name'], style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.8)))),
                                    Text('₹${(item['price'] as double).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              );
                            }),
                            if (_extractedData!.items.length > 5)
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Align(alignment: Alignment.centerLeft, child: Text('+ ${_extractedData!.items.length - 5} more items', style: const TextStyle(color: Colors.grey, fontSize: 12))),
                                ),
                          ]
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _reset,
                              icon: const Icon(Icons.refresh),
                              label: const Text('Scan Another'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: FilledButton.icon(
                              onPressed: _handleAddExpense,
                              icon: const Icon(Icons.arrow_forward),
                              label: const Text('Add Expense'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDataRow(String label, String value, bool isBold, {bool isAmount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey)),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            fontSize: isAmount ? 24 : 16,
            color: isAmount ? Colors.green : null,
          ),
        ),
      ],
    );
  }
}
