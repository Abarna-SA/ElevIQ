import 'package:flutter/material.dart';

/// Category model for expense categories
class CategoryModel {
  final String id;
  final String name;
  final String icon;
  final Color color;
  final bool isDefault;

  const CategoryModel({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    this.isDefault = true,
  });

  /// Default expense categories
  static List<CategoryModel> get defaultCategories => [
        const CategoryModel(
          id: 'food',
          name: 'Food & Dining',
          icon: '🍽️',
          color: Color(0xFFFF6B6B),
        ),
        const CategoryModel(
          id: 'transport',
          name: 'Transportation',
          icon: '🚗',
          color: Color(0xFF4ECDC4),
        ),
        const CategoryModel(
          id: 'education',
          name: 'Education',
          icon: '📚',
          color: Color(0xFF45B7D1),
        ),
        const CategoryModel(
          id: 'entertainment',
          name: 'Entertainment',
          icon: '🎬',
          color: Color(0xFFF9CA24),
        ),
        const CategoryModel(
          id: 'healthcare',
          name: 'Healthcare',
          icon: '⚕️',
          color: Color(0xFFF38181),
        ),
        const CategoryModel(
          id: 'shopping',
          name: 'Shopping',
          icon: '🛍️',
          color: Color(0xFFAA96DA),
        ),
        const CategoryModel(
          id: 'utilities',
          name: 'Utilities',
          icon: '💡',
          color: Color(0xFF95E1D3),
        ),
        const CategoryModel(
          id: 'rent',
          name: 'Rent/Housing',
          icon: '🏠',
          color: Color(0xFFFDCB6E),
        ),
        const CategoryModel(
          id: 'others',
          name: 'Others',
          icon: '📦',
          color: Color(0xFFA8E6CF),
        ),
      ];

  /// Find category by ID
  static CategoryModel? findById(String id) {
    try {
      return defaultCategories.firstWhere((c) => c.id == id);
    } catch (_) {
      return null;
    }
  }
}
