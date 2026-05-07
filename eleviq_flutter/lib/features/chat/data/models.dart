import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String role;
  final String content;
  final DateTime createdAt;
  final List<MessageFile>? files;
  final List<String>? artifactIds;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
    this.files,
    this.artifactIds,
  });

  factory ChatMessage.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    final filesList = data['files'] as List<dynamic>?;
    final artifactIdsList = data['artifactIds'] as List<dynamic>?;
    
    return ChatMessage(
      id: doc.id,
      role: data['role'] ?? 'user',
      content: data['content'] ?? '',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      files: filesList?.map((e) => MessageFile.fromMap(e as Map<String, dynamic>)).toList(),
      artifactIds: artifactIdsList?.map((e) => e.toString()).toList(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'role': role,
      'content': content,
      'createdAt': FieldValue.serverTimestamp(),
      if (files != null && files!.isNotEmpty) 'files': files!.map((e) => e.toMap()).toList(),
      if (artifactIds != null && artifactIds!.isNotEmpty) 'artifactIds': artifactIds,
    };
  }
}

class MessageFile {
  final String name;
  final String type;

  MessageFile({required this.name, required this.type});

  factory MessageFile.fromMap(Map<String, dynamic> map) {
    return MessageFile(
      name: map['name'] ?? '',
      type: map['type'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'type': type,
    };
  }
}

class Conversation {
  final String id;
  final String userId;
  final String title;
  final DateTime updatedAt;

  Conversation({
    required this.id,
    required this.userId,
    required this.title,
    required this.updatedAt,
  });

  factory Conversation.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Conversation(
      id: doc.id,
      userId: data['userId'] ?? '',
      title: data['title'] ?? 'New Chat',
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}

class GeneratedArtifact {
  final String id;
  final String name;
  final String type;
  final String content;
  final String? language;

  GeneratedArtifact({
    required this.id,
    required this.name,
    required this.type,
    required this.content,
    this.language,
  });

  factory GeneratedArtifact.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return GeneratedArtifact(
      id: doc.id,
      name: data['name'] ?? 'Unknown Artifact',
      type: data['type'] ?? 'text',
      content: data['content'] ?? '',
      language: data['language'],
    );
  }
}
