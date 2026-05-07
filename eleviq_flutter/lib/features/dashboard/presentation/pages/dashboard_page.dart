import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../features/expenses/data/expense_service.dart';
import '../../../../shared/widgets/loading_skeleton.dart';
import '../../../../shared/widgets/search_overlay.dart';
import '../../../../features/expenses/presentation/widgets/add_expense_sheet.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  final ExpenseService _expenseService = ExpenseService();
  double _monthlyTotal = 0;
  Map<String, double> _categoryTotals = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final total = await _expenseService.getCurrentMonthTotal();
      final categories = await _expenseService.getCategoryTotals();
      if (mounted) {
        setState(() {
          _monthlyTotal = total;
          _categoryTotals = categories;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: CustomScrollView(
        slivers: [
          // ── Gradient Hero Header ──
          SliverToBoxAdapter(child: _buildHeroHeader(user, isDark, theme)),

          // ── Content ──
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Quick Actions
                _buildQuickActions(theme, isDark),
                const SizedBox(height: 20),

                // Spending Summary Card
                _buildSpendingCard(theme, isDark),
                const SizedBox(height: 20),

                // Top Categories
                if (_categoryTotals.isNotEmpty) ...[
                  _buildSectionTitle('Top Categories', 'View all →', () {}),
                  const SizedBox(height: 12),
                  ..._buildTopCategories(theme, isDark),
                ],

                const SizedBox(height: 20),

                // Goals mini widget
                _buildMiniWidget(
                  theme,
                  isDark,
                  icon: Icons.flag_outlined,
                  iconColor: const Color(0xFFEC4899),
                  title: 'Goals',
                  subtitle: 'Set savings targets',
                  trailing: 'Start →',
                  onTap: () => context.go('/goals'),
                ),
                const SizedBox(height: 12),

                // Bills mini widget
                _buildMiniWidget(
                  theme,
                  isDark,
                  icon: Icons.calendar_month_outlined,
                  iconColor: const Color(0xFF3B82F6),
                  title: 'Upcoming Bills',
                  subtitle: 'Track your due dates',
                  trailing: 'View →',
                  onTap: () => context.go('/bills'),
                ),
                const SizedBox(height: 12),

                // AI Chat CTA
                _buildAIChatCTA(theme, isDark),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  /// ── Hero Greeting Header ──
  Widget _buildHeroHeader(User? user, bool isDark, ThemeData theme) {
    final hour = DateTime.now().hour;
    final firstName = user?.displayName?.split(' ').first ?? 'there';

    String greeting;
    String emoji;

    if (hour < 12) {
      greeting = 'Good morning';
      emoji = '☀️';
    } else if (hour < 17) {
      greeting = 'Good afternoon';
      emoji = '🌤️';
    } else {
      greeting = 'Good evening';
      emoji = '🌙';
    }

    final gradientColors = isDark 
        ? [const Color(0xFF0F172A), const Color(0xFF020617)] // Slate 900 to 950
        : [const Color(0xFF1E293B), const Color(0xFF0F172A)]; // Slate 800 to 900

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: Logo + notifications
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    kAppName,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.notifications_outlined, color: Colors.white70),
                      ),
                      GestureDetector(
                        onTap: () => context.go('/profile'),
                        child: CircleAvatar(
                          radius: 18,
                          backgroundColor: Colors.white24,
                          backgroundImage: user?.photoURL != null
                              ? NetworkImage(user!.photoURL!)
                              : null,
                          child: user?.photoURL == null
                              ? Text(
                                  (user?.displayName ?? 'U')[0].toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                )
                              : null,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Greeting
              Text(
                '$emoji $greeting, $firstName!',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _monthlyTotal == 0
                    ? 'Start tracking your expenses today! 🚀'
                    : 'Here\'s your financial overview',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 14,
                ),
              ),

              const SizedBox(height: 20),
              
              // Search Bar Trigger
              GestureDetector(
                onTap: () {
                  showGeneralDialog(
                    context: context,
                    pageBuilder: (context, anim1, anim2) => const SearchOverlay(),
                    transitionBuilder: (context, anim1, anim2, child) {
                      return SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0, 1),
                          end: Offset.zero,
                        ).animate(CurvedAnimation(parent: anim1, curve: Curves.easeOutCubic)),
                        child: child,
                      );
                    },
                    transitionDuration: const Duration(milliseconds: 300),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: Colors.white.withOpacity(0.6), size: 20),
                      const SizedBox(width: 12),
                      Text(
                        'Search pages, actions, settings...',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Glass stats bar
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (_isLoading)
                      const LoadingSkeleton(width: 120, height: 16)
                    else if (_monthlyTotal > 0)
                      Text(
                        '${formatCurrencyShort(_monthlyTotal)} this month',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      )
                    else
                      const Text(
                        'No expenses yet',
                        style: TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                    Row(
                      children: [
                        Icon(Icons.calendar_today, size: 14, color: Colors.white.withOpacity(0.6)),
                        const SizedBox(width: 6),
                        Text(
                          _formatDate(DateTime.now()),
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.6),
                            fontSize: 12,
                          ),
                        ),
                      ],
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

  Widget _buildQuickActions(ThemeData theme, bool isDark) {
    final actions = [
      _QuickAction(
        icon: Icons.add_circle_outline,
        label: 'Add\nExpense',
        color: isDark ? Colors.white : Colors.black,
        onTap: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => const AddExpenseSheet(),
          );
        },
      ),
      _QuickAction(
        icon: Icons.document_scanner_outlined,
        label: 'Scan\nReceipt',
        color: isDark ? Colors.white : Colors.black,
        onTap: () => context.go('/scan'),
      ),
      _QuickAction(
        icon: Icons.auto_awesome_outlined,
        label: 'AI\nChat',
        color: const Color(0xFF8B5CF6),
        onTap: () => context.go('/chat'),
      ),
      _QuickAction(
        icon: Icons.flag_outlined,
        label: 'Set\nGoal',
        color: isDark ? Colors.white : Colors.black,
        onTap: () => context.go('/goals'),
      ),
    ];

    return Row(
      children: actions.map((action) {
        return Expanded(
          child: GestureDetector(
            onTap: action.onTap,
            child: Card(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
                child: Column(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: action.color.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(action.icon, color: action.color, size: 22),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      action.label,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  /// ── Spending Summary Card ──
  Widget _buildSpendingCard(ThemeData theme, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.03),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "This Month's Spending",
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? Colors.white54 : Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    _isLoading
                        ? const LoadingSkeleton(width: 150, height: 36)
                        : Text(
                            formatCurrency(_monthlyTotal),
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                              letterSpacing: -1,
                            ),
                          ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (_monthlyTotal > 0 ? const Color(0xFFEF4444) : const Color(0xFF10B981)).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    _monthlyTotal > 0 ? Icons.trending_down : Icons.trending_up,
                    color: _monthlyTotal > 0 ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                    size: 28,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                _buildStatChip(theme, isDark, 'Categories', '\${_categoryTotals.length}', Icons.category_outlined),
                const SizedBox(width: 12),
                _buildStatChip(theme, isDark, 'Avg/Day', _monthlyTotal > 0
                    ? formatCurrency(_monthlyTotal / DateTime.now().day, compact: true)
                    : '₹0', Icons.analytics_outlined),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatChip(ThemeData theme, bool isDark, String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isDark ? Colors.white54 : Colors.grey[400]),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: theme.textTheme.labelSmall?.copyWith(
                    color: isDark ? Colors.white54 : Colors.grey[500],
                  )),
                  const SizedBox(height: 2),
                  Text(value, style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// ── Top Categories List ──
  List<Widget> _buildTopCategories(ThemeData theme, bool isDark) {
    final sorted = _categoryTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return sorted.take(4).map((entry) {
      final cat = getCategoryById(entry.key);
      final percent = _monthlyTotal > 0 ? (entry.value / _monthlyTotal) * 100 : 0.0;

      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: (cat?.color ?? Colors.grey).withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(cat?.icon ?? '📦', style: const TextStyle(fontSize: 22)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(cat?.name ?? 'Other', style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(formatCurrencyShort(entry.value), style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: percent / 100,
                      backgroundColor: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation(cat?.color ?? Colors.grey),
                      minHeight: 6,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  /// ── Mini Feature Widget ──
  Widget _buildMiniWidget(
    ThemeData theme,
    bool isDark, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String trailing,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.02),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
        ),
      ),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
             gradient: LinearGradient(
              colors: [
                iconColor.withValues(alpha: 0.2),
                iconColor.withValues(alpha: 0.05),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: iconColor, size: 24),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
        subtitle: Text(subtitle, style: TextStyle(fontSize: 13, color: isDark ? Colors.white54 : Colors.grey[500])),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(trailing, style: TextStyle(
            color: iconColor,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          )),
        ),
      ),
    );
  }

  /// ── AI Chat CTA ──
  Widget _buildAIChatCTA(ThemeData theme, bool isDark) {
    return GestureDetector(
      onTap: () => context.go('/chat'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'AI Financial Advisor',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Get personalized spending insights',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: Colors.white.withOpacity(0.6), size: 18),
          ],
        ),
      ),
    );
  }

  /// ── Section Title ──
  Widget _buildSectionTitle(String title, String action, VoidCallback onTap) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        TextButton(onPressed: onTap, child: Text(action)),
      ],
    );
  }

  String _formatDate(DateTime date) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${days[date.weekday - 1]}, ${months[date.month - 1]} ${date.day}';
  }
}

class _QuickAction {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
}
