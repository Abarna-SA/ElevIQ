import 'package:flutter/material.dart';

class CalculatorCategory {
  final String id;
  final String name;
  final IconData icon;
  final Color color;

  CalculatorCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
  });
}

class CalculatorItem {
  final String id;
  final String name;
  final String description;
  final IconData icon;
  final String categoryId;
  final bool isPopular;

  CalculatorItem({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.categoryId,
    this.isPopular = false,
  });
}

final _categories = [
  CalculatorCategory(id: 'loans', name: 'Loans', icon: Icons.home, color: Colors.blue),
  CalculatorCategory(id: 'investments', name: 'Investments', icon: Icons.trending_up, color: Colors.green),
  CalculatorCategory(id: 'interest', name: 'Interest', icon: Icons.savings, color: Colors.purple),
  CalculatorCategory(id: 'tax', name: 'Tax', icon: Icons.receipt_long, color: Colors.orange),
  CalculatorCategory(id: 'retirement', name: 'Retirement', icon: Icons.local_fire_department, color: Colors.red),
];

final _calculators = [
  // Loans
  CalculatorItem(id: 'emi', name: 'EMI Calculator', description: 'Calculate loan EMI & amortization schedule', icon: Icons.home, categoryId: 'loans', isPopular: true),
  CalculatorItem(id: 'home-eligibility', name: 'Home Loan Eligibility', description: 'Check your maximum loan eligibility', icon: Icons.apartment, categoryId: 'loans'),
  CalculatorItem(id: 'compare-loans', name: 'Loan Comparison', description: 'Compare multiple loan offers side by side', icon: Icons.balance, categoryId: 'loans'),
  CalculatorItem(id: 'prepayment', name: 'Prepayment Calculator', description: 'See how prepayments save you interest', icon: Icons.credit_card, categoryId: 'loans'),
  
  // Investments
  CalculatorItem(id: 'sip', name: 'SIP Calculator', description: 'Plan your systematic investment plan', icon: Icons.trending_up, categoryId: 'investments', isPopular: true),
  CalculatorItem(id: 'lumpsum', name: 'Lumpsum Calculator', description: 'Calculate one-time investment returns', icon: Icons.account_balance_wallet, categoryId: 'investments'),
  CalculatorItem(id: 'goal', name: 'Goal Planner', description: 'Map investments to your financial goals', icon: Icons.track_changes, categoryId: 'investments'),
  CalculatorItem(id: 'fire', name: 'FIRE Calculator', description: 'Financial independence retire early planning', icon: Icons.local_fire_department, categoryId: 'investments', isPopular: true),

  // Interest
  CalculatorItem(id: 'compound', name: 'Compound Interest', description: 'Visualize the power of compounding', icon: Icons.savings, categoryId: 'interest'),
  CalculatorItem(id: 'fd', name: 'FD Calculator', description: 'Fixed deposit maturity & returns', icon: Icons.apartment, categoryId: 'interest'),
  CalculatorItem(id: 'rd', name: 'RD Calculator', description: 'Recurring deposit growth projection', icon: Icons.account_balance_wallet, categoryId: 'interest'),

  // Tax
  CalculatorItem(id: 'income-tax', name: 'Income Tax', description: 'Compare Old vs New regime (FY 2024-25)', icon: Icons.description, categoryId: 'tax', isPopular: true),
  CalculatorItem(id: 'hra', name: 'HRA Exemption', description: 'Calculate your HRA tax benefit', icon: Icons.home, categoryId: 'tax'),

  // Retirement
  CalculatorItem(id: 'retirement', name: 'Retirement Corpus', description: 'Plan your retirement savings goal', icon: Icons.local_fire_department, categoryId: 'retirement'),
  CalculatorItem(id: 'pension', name: 'Pension Calculator', description: 'Estimate monthly pension income', icon: Icons.savings, categoryId: 'retirement'),
];

class CalculatorPage extends StatefulWidget {
  const CalculatorPage({super.key});

  @override
  State<CalculatorPage> createState() => _CalculatorPageState();
}

class _CalculatorPageState extends State<CalculatorPage> {
  String? _activeCategoryId;

  void _openCalculator(CalculatorItem calc) {
    // In a real implementation this would push a new screen or open a bottom sheet
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(calc.icon, color: _getCategoryColor(calc.categoryId)),
            const SizedBox(width: 8),
            Expanded(child: Text(calc.name)),
          ],
        ),
        content: Text('The ${calc.name} is currently under development. Stay tuned for AI-powered financial insights!'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Color _getCategoryColor(String id) {
    return _categories.firstWhere((c) => c.id == id, orElse: () => _categories.first).color;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final filteredCalculators = _activeCategoryId == null
        ? _calculators
        : _calculators.where((c) => c.categoryId == _activeCategoryId).toList();

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Financial Calculators'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(40),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('${_calculators.length} tools to plan your finances', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // AI Banner
          Container(
            padding: const EdgeInsets.all(24),
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Colors.purple, Colors.blue]),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.purple.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
                  child: const Icon(Icons.auto_awesome, color: Colors.white),
                ),
                const SizedBox(height: 16),
                const Text('AI-Powered Financial Suite', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Every calculator includes real-time AI insights — personalized tips, warnings, and optimization suggestions based on your inputs.', style: TextStyle(color: Colors.white.withOpacity(0.8), height: 1.5)),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.black.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                  child: Text('${_calculators.length} calculators with AI insights', style: const TextStyle(color: Colors.white, fontSize: 12)),
                )
              ],
            ),
          ),

          // Category Chips
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildCategoryChip('All', null, _activeCategoryId == null, isDark),
                const SizedBox(width: 8),
                ..._categories.map((c) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _buildCategoryChip(c.name, c.id, _activeCategoryId == c.id, isDark, color: c.color),
                )),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Grid of Calculators
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.85,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: filteredCalculators.length,
            itemBuilder: (context, index) {
              final calc = filteredCalculators[index];
              final catColor = _getCategoryColor(calc.categoryId);

              return InkWell(
                onTap: () => _openCalculator(calc),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: catColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                            child: Icon(calc.icon, color: catColor, size: 20),
                          ),
                          if (calc.isPopular)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: Colors.amber.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                              child: const Text('Popular', style: TextStyle(color: Colors.amber, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(calc.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 8),
                      Expanded(
                        child: Text(calc.description, style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface.withOpacity(0.6), height: 1.4), maxLines: 3, overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String label, String? id, bool isSelected, bool isDark, {Color? color}) {
    return GestureDetector(
      onTap: () {
        setState(() => _activeCategoryId = id);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? (color ?? Colors.blue) : (isDark ? Colors.grey[800] : Colors.grey[200]),
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : (isDark ? Colors.grey[400] : Colors.grey[700]),
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
