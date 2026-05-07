import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// ─── Auth Pages ──────────────────────────────────
import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/register_page.dart';
import '../features/auth/presentation/pages/onboarding_page.dart';
import '../features/auth/presentation/providers/auth_provider.dart';

// ─── Main Pages ──────────────────────────────────
import '../features/dashboard/presentation/pages/dashboard_page.dart';
import '../features/expenses/presentation/pages/expenses_list_page.dart';
import '../features/expenses/presentation/widgets/add_expense_sheet.dart';
import '../features/expenses/presentation/pages/expenses_history_page.dart';
import '../features/insights/presentation/pages/insights_page.dart';
import '../features/reminders/presentation/pages/reminders_page.dart';
import '../features/networth/presentation/pages/networth_page.dart';
import '../features/goals/presentation/pages/goals_page.dart';
import '../features/bills/presentation/pages/bills_page.dart';
import '../features/limits/presentation/pages/limits_page.dart';
import '../features/recurring/presentation/pages/recurring_page.dart';
import '../features/split/presentation/pages/split_page.dart';
import '../features/family/presentation/pages/family_page.dart';
import '../features/compare/presentation/pages/compare_page.dart';
import '../features/scan/presentation/pages/scan_page.dart';
import '../features/calculator/presentation/pages/calculator_page.dart';
import '../features/currency/presentation/pages/currency_page.dart';
import '../features/export/presentation/pages/export_page.dart';
import '../features/profile/presentation/pages/profile_page.dart';
import '../features/settings/presentation/pages/settings_page.dart';
import '../features/achievements/presentation/pages/achievements_page.dart';
import '../features/chat/presentation/pages/chat_page.dart';
import '../features/menu/presentation/pages/menu_page.dart';

// ─── Placeholder for features in development ─────

// Navigator keys
final rootNavigatorKey = GlobalKey<NavigatorState>();
final shellNavigatorKey = GlobalKey<NavigatorState>();

// ─── Bottom Nav Index Provider ───────────────────
final bottomNavIndexProvider = StateProvider<int>((ref) => 0);

// ─── Route paths to bottom nav index mapping ─────
int _getNavIndex(String location) {
  if (location.startsWith('/dashboard')) return 0;
  if (location.startsWith('/expenses')) return 1;
  if (location.startsWith('/chat')) return 2;
  if (location.startsWith('/analytics')) return 3;
  return 4; // More tab for everything else
}

// ─── Router Provider ─────────────────────────────
final routerProvider = Provider<GoRouter>((ref) {
  final isAuthenticated = ref.watch(isAuthenticatedProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/login',
    redirect: (context, state) {
      final isLoggingIn = state.matchedLocation == '/login';
      final isRegistering = state.matchedLocation == '/register';
      final isOnboarding = state.matchedLocation == '/onboarding';

      if (!isAuthenticated) {
        if (isLoggingIn || isRegistering || isOnboarding) return null;
        return '/login';
      }

      if (isLoggingIn || isRegistering) return '/dashboard';
      return null;
    },
    routes: [
      // ── Auth Routes (no bottom nav) ──
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),

      // ── Main App Shell (with bottom nav) ──
      ShellRoute(
        navigatorKey: shellNavigatorKey,
        builder: (context, state, child) {
          return _AppShellWrapper(location: state.matchedLocation, child: child);
        },
        routes: [
          // ─── Tab 0: Home/Dashboard ──────────────
          GoRoute(
            path: '/dashboard',
            name: 'dashboard',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state, const DashboardPage(),
            ),
          ),

          // ─── Tab 1: Expenses ────────────────────
          GoRoute(
            path: '/expenses',
            name: 'expenses',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state, const ExpensesListPage(),
            ),
          ),

          // ─── Tab 2: AI Chat ─────────────────────
          GoRoute(
            path: '/chat',
            name: 'chat',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const ChatPage(),
            ),
          ),

          // ─── Tab 3: Analytics (mapped to Insights Page for now) ───────────────────
          GoRoute(
            path: '/analytics',
            name: 'analytics',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const InsightsPage(),
            ),
          ),

          // ─── Tab 4: More (Menu Hub) ─────────────
          GoRoute(
            path: '/menu',
            name: 'menu',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state, const MenuPage(),
            ),
          ),

          // ─── Additional Feature Routes ──────────
          // Net Worth
          GoRoute(
            path: '/networth',
            name: 'networth',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const NetWorthPage(),
            ),
          ),

          // Goals
          GoRoute(
            path: '/goals',
            name: 'goals',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const GoalsPage(),
            ),
          ),

          // Bills
          GoRoute(
            path: '/bills',
            name: 'bills',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const BillsPage(),
            ),
          ),

          // Spending Limits
          GoRoute(
            path: '/limits',
            name: 'limits',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const LimitsPage(),
            ),
          ),

          // Recurring
          GoRoute(
            path: '/recurring',
            name: 'recurring',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const RecurringPage(),
            ),
          ),

          // Reminders
          GoRoute(
            path: '/reminders',
            name: 'reminders',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const RemindersPage(),
            ),
          ),

          // Insights
          GoRoute(
            path: '/insights',
            name: 'insights',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const InsightsPage(),
            ),
          ),

          // Split Expenses
          GoRoute(
            path: '/split',
            name: 'split',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const SplitPage(),
            ),
          ),

          // Family Wallets
          GoRoute(
            path: '/family',
            name: 'family',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const FamilyPage(),
            ),
          ),

          // Compare
          GoRoute(
            path: '/compare',
            name: 'compare',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const ComparePage(),
            ),
          ),

          // Scan Receipt
          GoRoute(
            path: '/scan',
            name: 'scan',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const ScanPage(),
            ),
          ),

          // Calculator
          GoRoute(
            path: '/calculator',
            name: 'calculator',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const CalculatorPage(),
            ),
          ),

          // Currency
          GoRoute(
            path: '/currency',
            name: 'currency',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const CurrencyPage(),
            ),
          ),

          // Export
          GoRoute(
            path: '/export',
            name: 'export',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const ExportPage(),
            ),
          ),

          // Profile
          GoRoute(
            path: '/profile',
            name: 'profile',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const ProfilePage(),
            ),
          ),

          // Settings
          GoRoute(
            path: '/settings',
            name: 'settings',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const SettingsPage(),
            ),
          ),

          // Achievements
          GoRoute(
            path: '/achievements',
            name: 'achievements',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state,
              const AchievementsPage(),
            ),
          ),
        ],
      ),

      // ── Full-screen routes (no bottom nav) ──
      GoRoute(
        path: '/expenses/history',
        name: 'expenses-history',
        builder: (context, state) => const ExpensesHistoryPage(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Page not found: ${state.matchedLocation}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/dashboard'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});

/// Fade transition for tab switching
CustomTransitionPage _fadeTransitionPage(GoRouterState state, Widget child) {
  return CustomTransitionPage(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(opacity: animation, child: child);
    },
    transitionDuration: const Duration(milliseconds: 200),
  );
}

/// App Shell wrapper that integrates with GoRouter's ShellRoute
class _AppShellWrapper extends ConsumerWidget {
  final Widget child;
  final String location;

  const _AppShellWrapper({required this.child, required this.location});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = _getNavIndex(location);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: theme.dividerColor,
              width: 0.5,
            ),
          ),
        ),
        child: NavigationBar(
          selectedIndex: currentIndex > 4 ? 4 : currentIndex,
          onDestinationSelected: (index) {
            switch (index) {
              case 0:
                context.go('/dashboard');
              case 1:
                context.go('/expenses');
              case 2:
                context.go('/chat');
              case 3:
                context.go('/analytics');
              case 4:
                context.go('/menu');
            }
          },
          backgroundColor: theme.colorScheme.surface,
          indicatorColor: theme.colorScheme.primary.withOpacity(0.12),
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          height: 68,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          animationDuration: const Duration(milliseconds: 300),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long),
              label: 'Expenses',
            ),
            NavigationDestination(
              icon: Icon(Icons.auto_awesome_outlined),
              selectedIcon: Icon(Icons.auto_awesome),
              label: 'Chat',
            ),
            NavigationDestination(
              icon: Icon(Icons.pie_chart_outline),
              selectedIcon: Icon(Icons.pie_chart),
              label: 'Analytics',
            ),
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view),
              label: 'More',
            ),
          ],
        ),
      ),
      floatingActionButton: (currentIndex == 0 || currentIndex == 1)
          ? FloatingActionButton(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => const AddExpenseSheet(),
                );
              },
              elevation: 4,
              backgroundColor: theme.colorScheme.secondary,
              foregroundColor: theme.colorScheme.onSecondary,
              child: const Icon(Icons.add, size: 28),
            )
          : null,
    );
  }
}
