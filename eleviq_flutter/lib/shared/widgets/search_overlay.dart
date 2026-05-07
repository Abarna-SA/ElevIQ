import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';


class CommandItem {
  final String id;
  final String label;
  final IconData icon;
  final String category;
  final String? href;
  final VoidCallback? action;
  final String? shortcut;
  final List<String> keywords;

  CommandItem({
    required this.id,
    required this.label,
    required this.icon,
    required this.category,
    this.href,
    this.action,
    this.shortcut,
    this.keywords = const [],
  });
}

class SearchOverlay extends StatefulWidget {
  const SearchOverlay({super.key});

  @override
  State<SearchOverlay> createState() => _SearchOverlayState();
}

class _SearchOverlayState extends State<SearchOverlay> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  String _query = '';

  List<String> _recentPaths = [];
  static const _recentKey = 'eleviq-recent-pages';

  @override
  void initState() {
    super.initState();
    _loadRecents();
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadRecents() async {
    final prefs = await SharedPreferences.getInstance();
    final recentsJson = prefs.getString(_recentKey);
    if (recentsJson != null) {
      try {
        final List<dynamic> decoded = jsonDecode(recentsJson);
        setState(() {
          _recentPaths = decoded.cast<String>();
        });
      } catch (e) {
        // ignore error
      }
    }
  }

  Future<void> _addRecent(String href) async {
    final prefs = await SharedPreferences.getInstance();
    _recentPaths.remove(href);
    _recentPaths.insert(0, href);
    if (_recentPaths.length > 5) {
      _recentPaths = _recentPaths.sublist(0, 5);
    }
    await prefs.setString(_recentKey, jsonEncode(_recentPaths));
  }

  void _executeItem(CommandItem item) {
    if (item.href != null) {
      _addRecent(item.href!);
      context.pop(); // close modal
      context.push(item.href!);
    } else if (item.action != null) {
      context.pop(); // close modal before action
      item.action!();
    }
  }

  List<CommandItem> get _pageItems => [
        CommandItem(
            id: 'home',
            label: 'Dashboard',
            icon: Icons.home_outlined,
            category: 'pages',
            href: '/dashboard',
            keywords: ['home']),
        CommandItem(
            id: 'expenses',
            label: 'Expenses',
            icon: Icons.receipt_long_outlined,
            category: 'pages',
            href: '/expenses'),
        CommandItem(
            id: 'chat',
            label: 'AI Chat Advisor',
            icon: Icons.auto_awesome_outlined,
            category: 'pages',
            href: '/chat',
            keywords: ['ai', 'advisor']),
        CommandItem(
            id: 'analytics',
            label: 'Analytics / Insights',
            icon: Icons.pie_chart_outline,
            category: 'pages',
            href: '/analytics',
            keywords: ['charts']),
        CommandItem(
            id: 'goals',
            label: 'Goals',
            icon: Icons.flag_outlined,
            category: 'pages',
            href: '/goals'),
        CommandItem(
            id: 'bills',
            label: 'Upcoming Bills',
            icon: Icons.calendar_today_outlined,
            category: 'pages',
            href: '/bills',
            keywords: ['subscriptions']),
        CommandItem(
            id: 'limits',
            label: 'Spending Limits',
            icon: Icons.money_off_csred_outlined,
            category: 'pages',
            href: '/limits',
            keywords: ['budgets']),
        CommandItem(
            id: 'scan',
            label: 'Scan Receipt',
            icon: Icons.document_scanner_outlined,
            category: 'pages',
            href: '/scan',
            keywords: ['camera', 'ocr']),
        CommandItem(
            id: 'calculator',
            label: 'Calculator',
            icon: Icons.calculate_outlined,
            category: 'pages',
            href: '/calculator',
            keywords: ['math']),
        CommandItem(
            id: 'menu',
            label: 'Menu More',
            icon: Icons.grid_view_outlined,
            category: 'pages',
            href: '/menu',
            keywords: ['navigation', 'settings']),
        CommandItem(
            id: 'profile',
            label: 'Profile',
            icon: Icons.person_outline,
            category: 'pages',
            href: '/profile',
            keywords: ['user', 'account']),
        CommandItem(
            id: 'settings',
            label: 'Settings',
            icon: Icons.settings_outlined,
            category: 'pages',
            href: '/settings',
            keywords: ['preferences']),
      ];

  List<CommandItem> get _actionItems => [
        CommandItem(
            id: 'act-add',
            label: 'Add New Expense',
            icon: Icons.add_circle_outline,
            category: 'actions',
            href: '/expenses/add'),
        CommandItem(
            id: 'act-theme',
            label: 'Toggle Dark/Light Theme',
            icon: Icons.brightness_6_outlined,
            category: 'actions',
            action: () {
              // NOTE: For full theme switching, it should use Riverpod, but keeping placeholder here
              // as theme switching is usually global.
            }),
        CommandItem(
            id: 'act-signout',
            label: 'Sign Out',
            icon: Icons.logout,
            category: 'actions',
            action: () async {
              await FirebaseAuth.instance.signOut();
              if (mounted) context.go('/login');
            }),
      ];

  List<CommandItem> get _recentItems {
    final List<CommandItem> recents = [];
    for (final path in _recentPaths) {
      final match = _pageItems.where((p) => p.href == path).firstOrNull;
      if (match != null) {
        recents.add(CommandItem(
          id: 'recent-${match.id}',
          label: match.label,
          icon: match.icon,
          category: 'recent',
          href: match.href,
          action: match.action,
        ));
      }
    }
    return recents;
  }

  List<CommandItem> get _allItems =>
      [..._recentItems, ..._pageItems, ..._actionItems];

  List<CommandItem> get _filteredItems {
    if (_query.trim().isEmpty) return _allItems;
    final q = _query.toLowerCase();
    return _allItems.where((item) {
      return item.label.toLowerCase().contains(q) ||
          (item.href?.toLowerCase().contains(q) ?? false) ||
          item.keywords.any((kw) => kw.contains(q));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final filtered = _filteredItems;

    // Group by category
    final Map<String, List<CommandItem>> grouped = {};
    for (var item in filtered) {
      grouped.putIfAbsent(item.category, () => []).add(item);
    }

    final categoryOrder = ['recent', 'pages', 'actions'];
    final categoryLabels = {
      'recent': 'Recent',
      'pages': 'Pages',
      'actions': 'Actions',
    };

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            children: [              // Search Input
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  border: Border(
                      bottom: BorderSide(
                    color: isDark ? Colors.white12 : Colors.grey[200]!,
                  )),
                ),
                child: Row(
                  children: [
                    Icon(Icons.search,
                        color: isDark ? Colors.grey[400] : Colors.grey[500]),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        focusNode: _focusNode,
                        onChanged: (val) => setState(() => _query = val),
                        style: theme.textTheme.bodyMedium,
                        decoration: InputDecoration(
                          hintText: 'Search pages, actions, settings...',
                          hintStyle: TextStyle(
                            color: isDark ? Colors.grey[500] : Colors.grey[400],
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          errorBorder: InputBorder.none,
                          disabledBorder: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    if (_query.isNotEmpty)
                      GestureDetector(
                        onTap: () {
                          _searchController.clear();
                          setState(() => _query = '');
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white10 : Colors.grey[100],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Icon(Icons.close,
                              size: 16,
                              color:
                                  isDark ? Colors.grey[400] : Colors.grey[500]),
                        ),
                      )
                    else
                      // 'x' icon to close completely as requested
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white10 : Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.close,
                              size: 20,
                              color:
                                  isDark ? Colors.grey[400] : Colors.grey[500]),
                        ),
                      ),
                  ],
                ),
              ),

              // Results list
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Text(
                          'No results found for "$_query"',
                          style: TextStyle(
                              color:
                                  isDark ? Colors.grey[500] : Colors.grey[400]),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: categoryOrder.length,
                        itemBuilder: (context, index) {
                          final cat = categoryOrder[index];
                          final items = grouped[cat];
                          if (items == null || items.isEmpty) {
                            return const SizedBox.shrink();
                          }

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 8),
                                child: Text(
                                  categoryLabels[cat]!.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? Colors.grey[500]
                                        : Colors.grey[400],
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ),
                              ...items.map((item) => InkWell(
                                    onTap: () => _executeItem(item),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 12),
                                      child: Row(
                                        children: [
                                          Icon(item.icon,
                                              size: 20,
                                              color: isDark
                                                  ? Colors.grey[400]
                                                  : Colors.grey[600]),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Text(
                                              item.label,
                                              style: theme.textTheme.bodyMedium
                                                  ?.copyWith(
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                          if (item.shortcut != null)
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 6,
                                                      vertical: 2),
                                              decoration: BoxDecoration(
                                                color: isDark
                                                    ? Colors.white10
                                                    : Colors.grey[200],
                                                borderRadius:
                                                    BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                item.shortcut!,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontFamily: 'monospace',
                                                  color: isDark
                                                      ? Colors.grey[400]
                                                      : Colors.grey[500],
                                                ),
                                              ),
                                            )
                                          else if (item.href != null)
                                            Text(
                                              item.href!,
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontFamily: 'monospace',
                                                color: isDark
                                                    ? Colors.grey[600]
                                                    : Colors.grey[300],
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  )),
                            ],
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
