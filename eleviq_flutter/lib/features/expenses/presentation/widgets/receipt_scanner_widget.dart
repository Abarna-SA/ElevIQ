import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'dart:io';

class ReceiptScannerWidget extends StatefulWidget {
  final String category;
  final Function(Map<String, dynamic> data) onScanComplete;
  final Function(String error)? onError;

  const ReceiptScannerWidget({
    super.key,
    required this.category,
    required this.onScanComplete,
    this.onError,
  });

  @override
  State<ReceiptScannerWidget> createState() => _ReceiptScannerWidgetState();
}

class _ReceiptScannerWidgetState extends State<ReceiptScannerWidget> {
  bool _isScanning = false;
  String? _scanResult;
  int _confidence = 0;
  final ImagePicker _picker = ImagePicker();

  Future<void> _handleScan(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image == null) return;

      setState(() {
        _isScanning = true;
        _scanResult = null;
      });

      // Initialize Gemini Model
      const apiKey = String.fromEnvironment('GEMINI_API_KEY', defaultValue: '');
      if (apiKey.isEmpty) {
        throw Exception('GEMINI_API_KEY not found in environment variables. Run with --dart-define=GEMINI_API_KEY=your_key');
      }

      final model = GenerativeModel(
        model: 'gemini-1.5-flash',
        apiKey: apiKey,
      );

      final bytes = await image.readAsBytes();
      final mimeType = _getMimeType(image.path);
      
      final prompt = _getPromptForCategory(widget.category);
      final content = [
        Content.multi([
          DataPart(mimeType, bytes),
          TextPart(prompt + '\n\nIMPORTANT: Return ONLY valid JSON strings, no markdown formatting (like ```json), no explanation. Use Indian Rupee (₹) for all amounts.'),
        ])
      ];

      final response = await model.generateContent(content);
      final responseText = response.text ?? '';

      // Clean Markdown
      final cleanedResponse = responseText
          .replaceAll('```json', '')
          .replaceAll('```', '')
          .trim();

      final extractedData = jsonDecode(cleanedResponse);

      // Simple confidence calculator
      int confidenceScore = 0;
      if (extractedData['vendor'] != null) confidenceScore += 20;
      if (extractedData['date'] != null) confidenceScore += 10;
      if (extractedData['total'] != null) confidenceScore += 30;
      if (extractedData['items'] != null && (extractedData['items'] as List).isNotEmpty) confidenceScore += 30;
      if (extractedData['subtotal'] != null) confidenceScore += 10;

      setState(() {
        _scanResult = 'success';
        _confidence = confidenceScore > 100 ? 100 : confidenceScore;
      });

      widget.onScanComplete(extractedData);
    } catch (e) {
      setState(() {
        _scanResult = 'error';
      });
      widget.onError?.call(e.toString());
    } finally {
      setState(() {
        _isScanning = false;
      });
    }
  }

  String _getMimeType(String path) {
    if (path.toLowerCase().endsWith('.png')) return 'image/png';
    if (path.toLowerCase().endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  String _getCategoryMessage() {
    switch (widget.category.toLowerCase()) {
      case 'grocery': return 'AI will extract items, weights & prices';
      case 'fuel': return 'AI extracts station, liters, rate & vehicle';
      case 'food': return 'AI detects items, tax, tip & service charge';
      case 'healthcare': return 'AI extracts medicines, dosages & pharmacy';
      case 'utilities': return 'AI reads units, billing period & provider';
      case 'shopping': return 'AI detects products, brands & prices';
      case 'transport': return 'AI extracts locations, distance & fare';
      default: return 'AI will extract receipt details';
    }
  }

  String _getPromptForCategory(String categoryCategory) {
     // Reusing the web app's prompts
     switch(categoryCategory.toLowerCase()) {
        case 'grocery':
          return '''You are a receipt scanner for grocery shopping. Analyze this receipt image and extract the following in JSON format:
{
    "vendor": "Store name",
    "date": "YYYY-MM-DD format if visible",
    "items": [
        {
            "name": "Item name",
            "quantity": number,
            "weight": number or null (in kg),
            "unitPrice": number (price per unit/kg),
            "subtotal": number (total price for this item)
        }
    ],
    "subtotal": number (sum before tax/discount),
    "discount": number or null,
    "taxAmount": number or null,
    "taxPercent": number or null (GST %),
    "total": number (final amount paid)
}
Extract ALL items you can see. Be accurate with prices. If weight is in grams, convert to kg.''';
        default:
          return '''You are a receipt scanner. Analyze this receipt/bill image and extract the following in JSON format:
{
    "vendor": "Business/store name",
    "date": "YYYY-MM-DD format if visible",
    "items": [
        {
            "name": "Item/service name",
            "quantity": number,
            "unitPrice": number,
            "subtotal": number
        }
    ],
    "subtotal": number,
    "discount": number or null,
    "taxAmount": number or null,
    "total": number (final amount),
    "category": "grocery|food|fuel|transport|shopping|utilities|healthcare|entertainment|education|others"
}
Extract as much information as possible from the receipt. Also detect the most appropriate category.''';
     }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [Colors.blue.withOpacity(0.2), Colors.indigo.withOpacity(0.2)]
              : [Colors.blue.shade50, Colors.indigo.shade50],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.blue.withOpacity(0.3) : Colors.blue.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.camera_alt, color: isDark ? Colors.blue.shade400 : Colors.blue.shade600, size: 20),
              const SizedBox(width: 8),
              Text(
                'Scan Receipt',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.blue.shade100 : Colors.blue.shade900,
                ),
              ),
              const Spacer(),
              if (_scanResult == 'success')
                Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      '$_confidence% confident',
                      style: const TextStyle(color: Colors.green, fontSize: 12),
                    ),
                  ],
                ),
              if (_scanResult == 'error')
                const Row(
                  children: [
                    Icon(Icons.error, color: Colors.red, size: 16),
                    SizedBox(width: 4),
                    Text('Scan failed', style: TextStyle(color: Colors.red, fontSize: 12)),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isScanning)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Column(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 12),
                  Text('Analyzing receipt with AI...', style: TextStyle(fontSize: 14)),
                ],
              ),
            )
          else
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _handleScan(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: const Text('Take Photo'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      backgroundColor: theme.colorScheme.surface,
                      side: BorderSide(color: theme.dividerColor),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _handleScan(ImageSource.gallery),
                    icon: const Icon(Icons.upload_file),
                    label: const Text('Upload'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      backgroundColor: theme.colorScheme.surface,
                      side: BorderSide(color: theme.dividerColor),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(height: 12),
          Text(
            _getCategoryMessage(),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface.withOpacity(0.5)),
          ),
        ],
      ),
    );
  }
}
