import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class FirebaseService {
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;
    
    try {
      await Firebase.initializeApp();
      _initialized = true;
      if (kDebugMode) {
        print('✅ Firebase initialized successfully');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Firebase initialization error: $e');
      }
      // Continue without Firebase for now - allows app to run without config
      if (kDebugMode) {
        print('⚠️ Running without Firebase - add google-services.json to enable');
      }
    }
  }

  static bool get isInitialized => _initialized;
}
