import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'models.dart';

class ChatService {
  final _firestore = FirebaseFirestore.instance;
  final _auth = FirebaseAuth.instance;

  Stream<List<Conversation>> subscribeToConversations() {
    final user = _auth.currentUser;
    if (user == null) return Stream.value([]);

    return _firestore
        .collection('conversations')
        .where('userId', isEqualTo: user.uid)
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Conversation.fromFirestore(doc))
            .toList());
  }

  Stream<List<ChatMessage>> subscribeToMessages(String conversationId) {
    return _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ChatMessage.fromFirestore(doc))
            .toList());
  }

  Future<String> createConversation(String title) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    final docRef = await _firestore.collection('conversations').add({
      'userId': user.uid,
      'title': title,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    return docRef.id;
  }

  Future<void> addMessage(String conversationId, ChatMessage message) async {
    final batch = _firestore.batch();
    
    // Add the message
    final messageRef = _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .doc();
        
    batch.set(messageRef, message.toMap());

    // Update conversation timestamp
    final convRef = _firestore.collection('conversations').doc(conversationId);
    batch.update(convRef, {
      'updatedAt': FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }

  Future<List<GeneratedArtifact>> getArtifactsByIds(List<String> ids) async {
    if (ids.isEmpty) return [];
    
    final user = _auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    List<GeneratedArtifact> results = [];
    
    // Firestore 'whereIn' supports max 10 elements
    for (var i = 0; i < ids.length; i += 10) {
      final end = (i + 10 < ids.length) ? i + 10 : ids.length;
      final chunk = ids.sublist(i, end);
      
      final querySnapshot = await _firestore
          .collection('artifacts')
          .where('id', whereIn: chunk)
          .get();
          
      for (var doc in querySnapshot.docs) {
        results.add(GeneratedArtifact.fromFirestore(doc));
      }
    }
    
    return results;
  }
}
