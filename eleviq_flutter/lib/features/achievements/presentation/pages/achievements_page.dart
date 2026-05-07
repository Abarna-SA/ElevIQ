import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../features/expenses/presentation/providers/expense_providers.dart';

class AchievementsPage extends ConsumerStatefulWidget {
  const AchievementsPage({super.key});

  @override
  ConsumerState<AchievementsPage> createState() => _AchievementsPageState();
}

class _AchievementsPageState extends ConsumerState<AchievementsPage> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final expensesAsync = ref.watch(expensesStreamProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Achievements'),
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
      ),
      body: expensesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (expenses) {
          final now = DateTime.now();
          final weekStart = now.subtract(Duration(days: now.weekday - 1));
          final weekEnd = weekStart.add(const Duration(days: 6, hours: 23, minutes: 59, seconds: 59));
          
          final totalExpenses = expenses.length;
          final thisWeekExpenses = expenses.where((e) => e.date.isAfter(weekStart) && e.date.isBefore(weekEnd)).length;
          
          // Streak calc
          final sortedDates = expenses.map((e) => DateTime(e.date.year, e.date.month, e.date.day)).toSet().toList()..sort();
          int streak = 0;
          final today = DateTime(now.year, now.month, now.day);
          for (int i = sortedDates.length - 1; i >= 0; i--) {
            final date = sortedDates[i];
            final diff = today.difference(date).inDays;
            if (diff == streak) {
              streak++;
            } else {
              break;
            }
          }
          final uniqueCategories = expenses.map((e) => e.categoryId).toSet().length;

          final achievements = [
            {'name': 'First Step', 'desc': 'Log your first expense', 'icon': Icons.star, 'color': Colors.amber, 'progress': totalExpenses, 'target': 1, 'pts': 10},
            {'name': 'Getting Started', 'desc': 'Log 10 expenses', 'icon': Icons.electrical_services, 'color': Colors.indigo, 'progress': totalExpenses, 'target': 10, 'pts': 50},
            {'name': 'Expense Master', 'desc': 'Log 50 expenses', 'icon': Icons.emoji_events, 'color': Colors.green, 'progress': totalExpenses, 'target': 50, 'pts': 200},
            {'name': 'Week Warrior', 'desc': '7-day logging streak', 'icon': Icons.local_fire_department, 'color': Colors.red, 'progress': streak, 'target': 7, 'pts': 100},
            {'name': 'Streak Legend', 'desc': '30-day logging streak', 'icon': Icons.workspace_premium, 'color': Colors.pink, 'progress': streak, 'target': 30, 'pts': 500},
            {'name': 'Category Explorer', 'desc': 'Use 5 different categories', 'icon': Icons.track_changes, 'color': Colors.purple, 'progress': uniqueCategories, 'target': 5, 'pts': 75},
            {'name': 'Budget Pro', 'desc': 'Set up spending limits', 'icon': Icons.stars, 'color': Colors.teal, 'progress': 0, 'target': 1, 'pts': 50},
            {'name': 'Receipt Scanner', 'desc': 'Scan 5 receipts', 'icon': Icons.check_circle, 'color': Colors.blue, 'progress': 0, 'target': 5, 'pts': 100},
          ];

          int totalPoints = 0;
          int unlockedCount = 0;
          for (var a in achievements) {
            if ((a['progress'] as int) >= (a['target'] as int)) {
              totalPoints += (a['pts'] as int);
              unlockedCount++;
            }
          }

          final challenges = [
            {'name': 'Weekly Tracker', 'desc': 'Log 7 expenses this week', 'target': 7, 'current': thisWeekExpenses, 'reward': 50, 'ends': '3 days'},
            {'name': 'Category Champion', 'desc': 'Log expenses in 4 categories today', 'target': 4, 'current': 1, 'reward': 30, 'ends': '12 hours'},
            {'name': 'Budget Keeper', 'desc': 'Stay under daily limit for 5 days', 'target': 5, 'current': 2, 'reward': 100, 'ends': '5 days'},
          ];

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Stats
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Colors.orange, Colors.deepOrange]),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.emoji_events, color: Colors.white, size: 20),
                                SizedBox(width: 8),
                                Text('Total Points', style: TextStyle(color: Colors.white70)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('$totalPoints', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 1,
                      child: _buildStatCard(theme, Icons.stars, 'Unlocked', '$unlockedCount/${achievements.length}', Colors.grey),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildStatCard(theme, Icons.local_fire_department, 'Current Streak', '$streak days', Colors.orange)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildStatCard(theme, Icons.trending_up, 'This Week', '$thisWeekExpenses', Colors.blue)),
                  ],
                ),
                const SizedBox(height: 32),

                // Challenges
                const Row(
                  children: [
                    Icon(Icons.calendar_month, color: Colors.blue),
                    SizedBox(width: 8),
                    Text('Weekly Challenges', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  ],
                ),
                const SizedBox(height: 16),
                ...challenges.map((c) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text(c['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold))),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                            child: Text(c['ends'] as String, style: const TextStyle(color: Colors.blue, fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(c['desc'] as String, style: const TextStyle(color: Colors.grey, fontSize: 14)),
                      const SizedBox(height: 12),
                      Stack(
                        children: [
                          Container(height: 8, decoration: BoxDecoration(color: isDark ? Colors.white10 : Colors.grey[200], borderRadius: BorderRadius.circular(4))),
                          FractionallySizedBox(
                            widthFactor: ((c['current'] as int) / (c['target'] as int)).clamp(0.0, 1.0),
                            child: Container(
                              height: 8,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Colors.blue, Colors.purple]),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${c['current']}/${c['target']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          Text('🏆 ${c['reward']} pts', style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                )),

                const SizedBox(height: 32),
                
                // Achievements grid
                const Row(
                  children: [
                    Icon(Icons.star, color: Colors.amber),
                    SizedBox(width: 8),
                    Text('All Achievements', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  ],
                ),
                const SizedBox(height: 16),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.8,
                  ),
                  itemCount: achievements.length,
                  itemBuilder: (context, i) {
                    final a = achievements[i];
                    final prog = a['progress'] as int;
                    final tg = a['target'] as int;
                    final unlocked = prog >= tg;
                    final clr = a['color'] as Color;

                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: unlocked ? theme.colorScheme.surface : (isDark ? Colors.black26 : Colors.grey[50]),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: unlocked ? theme.dividerColor : Colors.transparent),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: unlocked ? clr.withOpacity(0.2) : Colors.grey.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(unlocked ? a['icon'] as IconData : Icons.lock, color: unlocked ? clr : Colors.grey),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(a['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                                    Text('${a['pts']} pts', style: const TextStyle(color: Colors.orange, fontSize: 11)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Expanded(child: Text(a['desc'] as String, style: const TextStyle(color: Colors.grey, fontSize: 12))),
                          Stack(
                            children: [
                              Container(height: 6, decoration: BoxDecoration(color: isDark ? Colors.white10 : Colors.grey[200], borderRadius: BorderRadius.circular(3))),
                              FractionallySizedBox(
                                widthFactor: (prog / tg).clamp(0.0, 1.0),
                                child: Container(height: 6, decoration: BoxDecoration(color: clr, borderRadius: BorderRadius.circular(3))),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Align(
                            alignment: Alignment.centerRight,
                            child: Text('$prog/$tg', style: const TextStyle(color: Colors.grey, fontSize: 10)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard(ThemeData theme, IconData icon, String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color == Colors.grey ? null : color)),
        ],
      ),
    );
  }
}
