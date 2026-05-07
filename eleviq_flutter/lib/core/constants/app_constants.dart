import 'package:flutter/material.dart';

/// ─── Currency ────────────────────────────────────
const String kCurrencySymbol = '₹';
const String kCurrencyCode = 'INR';
const String kLocale = 'en_IN';

/// ─── App Info ────────────────────────────────────
const String kAppName = 'ELEVIQ';
const String kAppTagline = 'GenAI-Powered Personal Finance Assistant';

/// ─── Firestore Collections ──────────────────────
const String kExpensesCollection = 'expenses';
const String kGoalsCollection = 'goals';
const String kBillsCollection = 'bills';
const String kAssetsCollection = 'assets';
const String kLiabilitiesCollection = 'liabilities';
const String kRecurringCollection = 'recurring';
const String kRemindersCollection = 'reminders';

/// ─── Expense Categories ─────────────────────────
class ExpenseCategory {
  final String id;
  final String name;
  final String icon;
  final Color color;
  final String formType;

  const ExpenseCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    this.formType = 'generic',
  });
}

const List<ExpenseCategory> kDefaultCategories = [
  ExpenseCategory(id: 'grocery', name: 'Grocery', icon: '🛒', color: Color(0xFF22C55E), formType: 'grocery'),
  ExpenseCategory(id: 'food', name: 'Food & Dining', icon: '🍽️', color: Color(0xFFFF6B6B), formType: 'food'),
  ExpenseCategory(id: 'fuel', name: 'Fuel', icon: '⛽', color: Color(0xFFF59E0B), formType: 'fuel'),
  ExpenseCategory(id: 'transport', name: 'Transportation', icon: '🚗', color: Color(0xFF4ECDC4), formType: 'transport'),
  ExpenseCategory(id: 'education', name: 'Education', icon: '📚', color: Color(0xFF45B7D1)),
  ExpenseCategory(id: 'entertainment', name: 'Entertainment', icon: '🎬', color: Color(0xFFF9CA24)),
  ExpenseCategory(id: 'healthcare', name: 'Healthcare', icon: '💊', color: Color(0xFFF38181), formType: 'healthcare'),
  ExpenseCategory(id: 'shopping', name: 'Shopping', icon: '🛍️', color: Color(0xFFAA96DA), formType: 'shopping'),
  ExpenseCategory(id: 'utilities', name: 'Utilities', icon: '💡', color: Color(0xFF95E1D3), formType: 'utility'),
  ExpenseCategory(id: 'rent', name: 'Rent/Housing', icon: '🏠', color: Color(0xFFFDCB6E)),
  ExpenseCategory(id: 'others', name: 'Others', icon: '📦', color: Color(0xFFA8E6CF)),
];

/// Find category by ID
ExpenseCategory? getCategoryById(String id) {
  try {
    return kDefaultCategories.firstWhere((c) => c.id == id);
  } catch (_) {
    return null;
  }
}

/// ─── Payment Methods ────────────────────────────
enum PaymentMethod { cash, card, upi, netbanking, wallet, other }

const Map<PaymentMethod, String> kPaymentMethodLabels = {
  PaymentMethod.cash: 'Cash',
  PaymentMethod.card: 'Card',
  PaymentMethod.upi: 'UPI',
  PaymentMethod.netbanking: 'Net Banking',
  PaymentMethod.wallet: 'Wallet',
  PaymentMethod.other: 'Other',
};

/// ─── Navigation Sections (matches web sidebar) ──
class NavSection {
  final String name;
  final IconData icon;
  final List<NavItem> items;

  const NavSection({
    required this.name,
    required this.icon,
    required this.items,
  });
}

class NavItem {
  final String route;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final Color? accentColor;

  const NavItem({
    required this.route,
    required this.icon,
    required this.selectedIcon,
    required this.label,
    this.accentColor,
  });
}

final List<NavSection> kNavSections = [
  const NavSection(
    name: 'Home',
    icon: Icons.home_outlined,
    items: [
      NavItem(route: '/dashboard', icon: Icons.dashboard_outlined, selectedIcon: Icons.dashboard, label: 'Dashboard'),
      NavItem(route: '/expenses', icon: Icons.receipt_long_outlined, selectedIcon: Icons.receipt_long, label: 'Expenses'),
      NavItem(route: '/analytics', icon: Icons.bar_chart_outlined, selectedIcon: Icons.bar_chart, label: 'Analytics'),
      NavItem(route: '/networth', icon: Icons.account_balance_outlined, selectedIcon: Icons.account_balance, label: 'Net Worth'),
    ],
  ),
  const NavSection(
    name: 'Tools',
    icon: Icons.build_outlined,
    items: [
      NavItem(route: '/chat', icon: Icons.auto_awesome_outlined, selectedIcon: Icons.auto_awesome, label: 'AI Assistant', accentColor: Color(0xFF7C3AED)),
      NavItem(route: '/scan', icon: Icons.document_scanner_outlined, selectedIcon: Icons.document_scanner, label: 'Scan Receipt'),
      NavItem(route: '/calculator', icon: Icons.calculate_outlined, selectedIcon: Icons.calculate, label: 'Calculator'),
      NavItem(route: '/bills', icon: Icons.calendar_month_outlined, selectedIcon: Icons.calendar_month, label: 'Bill Calendar'),
      NavItem(route: '/currency', icon: Icons.currency_exchange_outlined, selectedIcon: Icons.currency_exchange, label: 'Currency'),
      NavItem(route: '/export', icon: Icons.file_download_outlined, selectedIcon: Icons.file_download, label: 'Export Data'),
    ],
  ),
  const NavSection(
    name: 'Plan',
    icon: Icons.trending_up_outlined,
    items: [
      NavItem(route: '/goals', icon: Icons.flag_outlined, selectedIcon: Icons.flag, label: 'Goals'),
      NavItem(route: '/limits', icon: Icons.shield_outlined, selectedIcon: Icons.shield, label: 'Spending Limits'),
      NavItem(route: '/recurring', icon: Icons.replay_outlined, selectedIcon: Icons.replay, label: 'Recurring'),
      NavItem(route: '/reminders', icon: Icons.notifications_outlined, selectedIcon: Icons.notifications, label: 'Reminders'),
      NavItem(route: '/insights', icon: Icons.lightbulb_outlined, selectedIcon: Icons.lightbulb, label: 'Insights'),
    ],
  ),
  const NavSection(
    name: 'People',
    icon: Icons.people_outlined,
    items: [
      NavItem(route: '/split', icon: Icons.call_split_outlined, selectedIcon: Icons.call_split, label: 'Split Expenses'),
      NavItem(route: '/family', icon: Icons.favorite_outline, selectedIcon: Icons.favorite, label: 'Family Budget'),
      NavItem(route: '/compare', icon: Icons.compare_arrows_outlined, selectedIcon: Icons.compare_arrows, label: 'Compare'),
    ],
  ),
];
