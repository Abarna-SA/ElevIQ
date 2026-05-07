import 'package:cloud_firestore/cloud_firestore.dart';

// ═══════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═══════════════════════════════════════════════════

/// Payment method options for expenses
enum PaymentMethod {
  cash,
  card,
  upi,
  netbanking,
  wallet,
  other;

  String get displayName {
    switch (this) {
      case PaymentMethod.cash: return 'Cash';
      case PaymentMethod.card: return 'Card';
      case PaymentMethod.upi: return 'UPI';
      case PaymentMethod.netbanking: return 'Net Banking';
      case PaymentMethod.wallet: return 'Wallet';
      case PaymentMethod.other: return 'Other';
    }
  }

  static PaymentMethod fromString(String value) {
    return PaymentMethod.values.firstWhere(
      (e) => e.name == value,
      orElse: () => PaymentMethod.other,
    );
  }
}

enum FuelType {
  petrol,
  diesel,
  cng;

  String get displayName {
    switch (this) {
      case FuelType.petrol: return 'Petrol';
      case FuelType.diesel: return 'Diesel';
      case FuelType.cng: return 'CNG';
    }
  }

  static FuelType fromString(String value) {
    return FuelType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => FuelType.petrol,
    );
  }
}

enum ItemUnit {
  kg, g, l, ml, pcs, pack, dozen;

  String get displayName {
    switch (this) {
      case ItemUnit.kg: return 'kg';
      case ItemUnit.g: return 'g';
      case ItemUnit.l: return 'L';
      case ItemUnit.ml: return 'ml';
      case ItemUnit.pcs: return 'pcs';
      case ItemUnit.pack: return 'pack';
      case ItemUnit.dozen: return 'dozen';
    }
  }

  static ItemUnit fromString(String value) {
    return ItemUnit.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => ItemUnit.pcs,
    );
  }
}

// ═══════════════════════════════════════════════════
// EXPENSE ITEMS (Multi-item support)
// ═══════════════════════════════════════════════════

class ExpenseItem {
  final String id;
  final String name;
  final double quantity;
  final ItemUnit? unit;
  final double? weight;
  final double unitPrice;
  final double subtotal;
  final String? brand;
  final String? size;
  final String? warranty;
  final bool isAIExtracted;

  const ExpenseItem({
    required this.id,
    required this.name,
    required this.quantity,
    this.unit,
    this.weight,
    required this.unitPrice,
    required this.subtotal,
    this.brand,
    this.size,
    this.warranty,
    this.isAIExtracted = false,
  });

  factory ExpenseItem.fromMap(Map<String, dynamic> data) {
    return ExpenseItem(
      id: data['id'] ?? '',
      name: data['name'] ?? '',
      quantity: (data['quantity'] ?? 1).toDouble(),
      unit: data['unit'] != null ? ItemUnit.fromString(data['unit']) : null,
      weight: data['weight']?.toDouble(),
      unitPrice: (data['unitPrice'] ?? 0).toDouble(),
      subtotal: (data['subtotal'] ?? 0).toDouble(),
      brand: data['brand'],
      size: data['size'],
      warranty: data['warranty'],
      isAIExtracted: data['isAIExtracted'] ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'quantity': quantity,
    'unit': unit?.name,
    'weight': weight,
    'unitPrice': unitPrice,
    'subtotal': subtotal,
    'brand': brand,
    'size': size,
    'warranty': warranty,
    'isAIExtracted': isAIExtracted,
  };
}

// ═══════════════════════════════════════════════════
// CATEGORY-SPECIFIC METADATA
// ═══════════════════════════════════════════════════

class FuelMetadata {
  final FuelType fuelType;
  final double liters;
  final double ratePerLiter;
  final double? odometerReading;
  final String? vehicleId;
  final bool isFullTank;
  final String? stationName;
  final double? distanceSinceLastFill;
  final double? calculatedMileage;

  const FuelMetadata({
    required this.fuelType,
    required this.liters,
    required this.ratePerLiter,
    this.odometerReading,
    this.vehicleId,
    this.isFullTank = false,
    this.stationName,
    this.distanceSinceLastFill,
    this.calculatedMileage,
  });

  factory FuelMetadata.fromMap(Map<String, dynamic> data) => FuelMetadata(
    fuelType: FuelType.fromString(data['fuelType'] ?? 'petrol'),
    liters: (data['liters'] ?? 0).toDouble(),
    ratePerLiter: (data['ratePerLiter'] ?? 0).toDouble(),
    odometerReading: data['odometerReading']?.toDouble(),
    vehicleId: data['vehicleId'],
    isFullTank: data['isFullTank'] ?? false,
    stationName: data['stationName'],
    distanceSinceLastFill: data['distanceSinceLastFill']?.toDouble(),
    calculatedMileage: data['calculatedMileage']?.toDouble(),
  );

  Map<String, dynamic> toMap() => {
    'fuelType': fuelType.name,
    'liters': liters,
    'ratePerLiter': ratePerLiter,
    'odometerReading': odometerReading,
    'vehicleId': vehicleId,
    'isFullTank': isFullTank,
    'stationName': stationName,
    'distanceSinceLastFill': distanceSinceLastFill,
    'calculatedMileage': calculatedMileage,
  };
}

class FoodMetadata {
  final String? restaurantName;
  final double? tipAmount;
  final double? tipPercent;
  final double? serviceCharge;
  final double? gstAmount;
  final double? gstPercent;

  const FoodMetadata({
    this.restaurantName,
    this.tipAmount,
    this.tipPercent,
    this.serviceCharge,
    this.gstAmount,
    this.gstPercent,
  });

  factory FoodMetadata.fromMap(Map<String, dynamic> data) => FoodMetadata(
    restaurantName: data['restaurantName'],
    tipAmount: data['tipAmount']?.toDouble(),
    tipPercent: data['tipPercent']?.toDouble(),
    serviceCharge: data['serviceCharge']?.toDouble(),
    gstAmount: data['gstAmount']?.toDouble(),
    gstPercent: data['gstPercent']?.toDouble(),
  );

  Map<String, dynamic> toMap() => {
    'restaurantName': restaurantName,
    'tipAmount': tipAmount,
    'tipPercent': tipPercent,
    'serviceCharge': serviceCharge,
    'gstAmount': gstAmount,
    'gstPercent': gstPercent,
  };
}

class HealthcareMetadata {
  final String? prescriptionId;
  final String? doctorName;
  final String? pharmacyName;
  final String? hospitalName;

  const HealthcareMetadata({this.prescriptionId, this.doctorName, this.pharmacyName, this.hospitalName});

  factory HealthcareMetadata.fromMap(Map<String, dynamic> data) => HealthcareMetadata(
    prescriptionId: data['prescriptionId'],
    doctorName: data['doctorName'],
    pharmacyName: data['pharmacyName'],
    hospitalName: data['hospitalName'],
  );

  Map<String, dynamic> toMap() => {
    'prescriptionId': prescriptionId,
    'doctorName': doctorName,
    'pharmacyName': pharmacyName,
    'hospitalName': hospitalName,
  };
}

class UtilityMetadata {
  final String? providerName;
  final double? unitsConsumed;
  final double? ratePerUnit;
  final DateTime? billingPeriodStart;
  final DateTime? billingPeriodEnd;
  final String? meterNumber;

  const UtilityMetadata({
    this.providerName, this.unitsConsumed, this.ratePerUnit,
    this.billingPeriodStart, this.billingPeriodEnd, this.meterNumber,
  });

  factory UtilityMetadata.fromMap(Map<String, dynamic> data) => UtilityMetadata(
    providerName: data['providerName'],
    unitsConsumed: data['unitsConsumed']?.toDouble(),
    ratePerUnit: data['ratePerUnit']?.toDouble(),
    billingPeriodStart: data['billingPeriodStart'] != null
        ? (data['billingPeriodStart'] as Timestamp).toDate() : null,
    billingPeriodEnd: data['billingPeriodEnd'] != null
        ? (data['billingPeriodEnd'] as Timestamp).toDate() : null,
    meterNumber: data['meterNumber'],
  );

  Map<String, dynamic> toMap() => {
    'providerName': providerName,
    'unitsConsumed': unitsConsumed,
    'ratePerUnit': ratePerUnit,
    'billingPeriodStart': billingPeriodStart != null ? Timestamp.fromDate(billingPeriodStart!) : null,
    'billingPeriodEnd': billingPeriodEnd != null ? Timestamp.fromDate(billingPeriodEnd!) : null,
    'meterNumber': meterNumber,
  };
}

class ShoppingMetadata {
  final String? storeName;
  final String? brandName;
  final DateTime? warrantyUntil;
  final int? returnPeriodDays;

  const ShoppingMetadata({this.storeName, this.brandName, this.warrantyUntil, this.returnPeriodDays});

  factory ShoppingMetadata.fromMap(Map<String, dynamic> data) => ShoppingMetadata(
    storeName: data['storeName'],
    brandName: data['brandName'],
    warrantyUntil: data['warrantyUntil'] != null
        ? (data['warrantyUntil'] as Timestamp).toDate() : null,
    returnPeriodDays: data['returnPeriodDays'],
  );

  Map<String, dynamic> toMap() => {
    'storeName': storeName,
    'brandName': brandName,
    'warrantyUntil': warrantyUntil != null ? Timestamp.fromDate(warrantyUntil!) : null,
    'returnPeriodDays': returnPeriodDays,
  };
}

class TransportMetadata {
  final String? fromLocation;
  final String? toLocation;
  final double? distanceKm;
  final String? vehicleType;
  final String? rideId;

  const TransportMetadata({
    this.fromLocation, this.toLocation, this.distanceKm, this.vehicleType, this.rideId,
  });

  factory TransportMetadata.fromMap(Map<String, dynamic> data) => TransportMetadata(
    fromLocation: data['fromLocation'],
    toLocation: data['toLocation'],
    distanceKm: data['distanceKm']?.toDouble(),
    vehicleType: data['vehicleType'],
    rideId: data['rideId'],
  );

  Map<String, dynamic> toMap() => {
    'fromLocation': fromLocation,
    'toLocation': toLocation,
    'distanceKm': distanceKm,
    'vehicleType': vehicleType,
    'rideId': rideId,
  };
}

/// Union type for category-specific metadata
class ExpenseMetadata {
  final String type;
  final dynamic data;

  const ExpenseMetadata({required this.type, required this.data});

  factory ExpenseMetadata.fromMap(Map<String, dynamic> map) {
    final type = map['type'] as String? ?? 'generic';
    final rawData = map['data'] as Map<String, dynamic>? ?? {};
    dynamic parsedData;

    switch (type) {
      case 'fuel': parsedData = FuelMetadata.fromMap(rawData);
      case 'food': parsedData = FoodMetadata.fromMap(rawData);
      case 'healthcare': parsedData = HealthcareMetadata.fromMap(rawData);
      case 'utility': parsedData = UtilityMetadata.fromMap(rawData);
      case 'shopping': parsedData = ShoppingMetadata.fromMap(rawData);
      case 'transport': parsedData = TransportMetadata.fromMap(rawData);
      default: parsedData = rawData;
    }

    return ExpenseMetadata(type: type, data: parsedData);
  }

  Map<String, dynamic> toMap() {
    Map<String, dynamic> dataMap;
    if (data is FuelMetadata) {
      dataMap = (data as FuelMetadata).toMap();
    } else if (data is FoodMetadata) {
      dataMap = (data as FoodMetadata).toMap();
    } else if (data is HealthcareMetadata) {
      dataMap = (data as HealthcareMetadata).toMap();
    } else if (data is UtilityMetadata) {
      dataMap = (data as UtilityMetadata).toMap();
    } else if (data is ShoppingMetadata) {
      dataMap = (data as ShoppingMetadata).toMap();
    } else if (data is TransportMetadata) {
      dataMap = (data as TransportMetadata).toMap();
    } else {
      dataMap = data is Map<String, dynamic> ? data : {};
    }
    return {'type': type, 'data': dataMap};
  }
}

// ═══════════════════════════════════════════════════
// ENHANCED EXPENSE (Main Model)
// ═══════════════════════════════════════════════════

class ExpenseModel {
  final String id;
  final String userId;
  final String categoryId;
  final String category;

  // Basic info
  final String vendor;
  final String description;
  final DateTime date;
  final PaymentMethod paymentMethod;

  // Multi-item support
  final List<ExpenseItem> items;

  // Totals
  final double subtotal;
  final double? discount;
  final double? taxAmount;
  final double? taxPercent;
  final double amount;

  // Category-specific metadata
  final ExpenseMetadata? metadata;

  // Attachments
  final List<String>? attachments;
  final String? receiptImageUrl;

  // Additional info
  final String? notes;
  final List<String>? tags;
  final String? location;

  // AI extraction
  final bool isAIExtracted;
  final double? aiConfidence;

  // Timestamps
  final DateTime createdAt;
  final DateTime updatedAt;

  ExpenseModel({
    required this.id,
    required this.userId,
    required this.categoryId,
    required this.category,
    this.vendor = '',
    required this.description,
    required this.date,
    required this.paymentMethod,
    this.items = const [],
    this.subtotal = 0,
    this.discount,
    this.taxAmount,
    this.taxPercent,
    required this.amount,
    this.metadata,
    this.attachments,
    this.receiptImageUrl,
    this.notes,
    this.tags,
    this.location,
    this.isAIExtracted = false,
    this.aiConfidence,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Create from Firestore document
  factory ExpenseModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ExpenseModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      categoryId: data['categoryId'] ?? '',
      category: data['category'] ?? '',
      vendor: data['vendor'] ?? '',
      description: data['description'] ?? '',
      date: data['date'] is Timestamp
          ? (data['date'] as Timestamp).toDate()
          : DateTime.now(),
      paymentMethod: PaymentMethod.fromString(data['paymentMethod'] ?? 'cash'),
      items: data['items'] != null
          ? (data['items'] as List).map((e) => ExpenseItem.fromMap(e as Map<String, dynamic>)).toList()
          : [],
      subtotal: (data['subtotal'] ?? data['amount'] ?? 0).toDouble(),
      discount: data['discount']?.toDouble(),
      taxAmount: data['taxAmount']?.toDouble(),
      taxPercent: data['taxPercent']?.toDouble(),
      amount: (data['amount'] ?? 0).toDouble(),
      metadata: data['metadata'] != null
          ? ExpenseMetadata.fromMap(data['metadata'] as Map<String, dynamic>)
          : null,
      attachments: data['attachments'] != null ? List<String>.from(data['attachments']) : null,
      receiptImageUrl: data['receiptImageUrl'],
      notes: data['notes'],
      tags: data['tags'] != null ? List<String>.from(data['tags']) : null,
      location: data['location'],
      isAIExtracted: data['isAIExtracted'] ?? false,
      aiConfidence: data['aiConfidence']?.toDouble(),
      createdAt: data['createdAt'] is Timestamp
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      updatedAt: data['updatedAt'] is Timestamp
          ? (data['updatedAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  /// Convert to Firestore document
  Map<String, dynamic> toFirestore() => {
    'userId': userId,
    'categoryId': categoryId,
    'category': category,
    'vendor': vendor,
    'description': description,
    'date': Timestamp.fromDate(date),
    'paymentMethod': paymentMethod.name,
    'items': items.map((e) => e.toMap()).toList(),
    'subtotal': subtotal,
    'discount': discount,
    'taxAmount': taxAmount,
    'taxPercent': taxPercent,
    'amount': amount,
    'metadata': metadata?.toMap(),
    'attachments': attachments,
    'receiptImageUrl': receiptImageUrl,
    'notes': notes,
    'tags': tags,
    'location': location,
    'isAIExtracted': isAIExtracted,
    'aiConfidence': aiConfidence,
    'createdAt': Timestamp.fromDate(createdAt),
    'updatedAt': Timestamp.fromDate(updatedAt),
  };

  /// Create a copy with updated fields
  ExpenseModel copyWith({
    String? id,
    String? userId,
    String? categoryId,
    String? category,
    String? vendor,
    String? description,
    DateTime? date,
    PaymentMethod? paymentMethod,
    List<ExpenseItem>? items,
    double? subtotal,
    double? discount,
    double? taxAmount,
    double? taxPercent,
    double? amount,
    ExpenseMetadata? metadata,
    List<String>? attachments,
    String? receiptImageUrl,
    String? notes,
    List<String>? tags,
    String? location,
    bool? isAIExtracted,
    double? aiConfidence,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ExpenseModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      categoryId: categoryId ?? this.categoryId,
      category: category ?? this.category,
      vendor: vendor ?? this.vendor,
      description: description ?? this.description,
      date: date ?? this.date,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      items: items ?? this.items,
      subtotal: subtotal ?? this.subtotal,
      discount: discount ?? this.discount,
      taxAmount: taxAmount ?? this.taxAmount,
      taxPercent: taxPercent ?? this.taxPercent,
      amount: amount ?? this.amount,
      metadata: metadata ?? this.metadata,
      attachments: attachments ?? this.attachments,
      receiptImageUrl: receiptImageUrl ?? this.receiptImageUrl,
      notes: notes ?? this.notes,
      tags: tags ?? this.tags,
      location: location ?? this.location,
      isAIExtracted: isAIExtracted ?? this.isAIExtracted,
      aiConfidence: aiConfidence ?? this.aiConfidence,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
