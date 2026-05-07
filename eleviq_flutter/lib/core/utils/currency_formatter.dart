import '../constants/app_constants.dart';

/// Format a number as Indian rupee currency string
String formatCurrency(double amount, {bool compact = false}) {
  if (compact) {
    if (amount >= 10000000) {
      return '$kCurrencySymbol${(amount / 10000000).toStringAsFixed(1)}Cr';
    } else if (amount >= 100000) {
      return '$kCurrencySymbol${(amount / 100000).toStringAsFixed(1)}L';
    } else if (amount >= 1000) {
      return '$kCurrencySymbol${(amount / 1000).toStringAsFixed(1)}K';
    }
  }
  // Indian number format: 1,23,456.78
  final parts = amount.toStringAsFixed(2).split('.');
  final intPart = parts[0];
  final decPart = parts.length > 1 ? '.${parts[1]}' : '';
  
  if (intPart.length <= 3) {
    return '$kCurrencySymbol$intPart$decPart';
  }
  
  final lastThree = intPart.substring(intPart.length - 3);
  final remaining = intPart.substring(0, intPart.length - 3);
  final formatted = remaining.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{2})+$)'),
    (m) => '${m[1]},',
  );
  
  return '$kCurrencySymbol$formatted,$lastThree$decPart';
}

/// Format amount without decimal for display
String formatCurrencyShort(double amount) {
  return formatCurrency(amount, compact: false).replaceAll(RegExp(r'\.00$'), '');
}
