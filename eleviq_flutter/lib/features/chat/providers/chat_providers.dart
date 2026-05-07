import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/chat_service.dart';
import '../data/models.dart';

final chatServiceProvider = Provider((ref) => ChatService());

final conversationsProvider = StreamProvider<List<Conversation>>((ref) {
  final service = ref.watch(chatServiceProvider);
  return service.subscribeToConversations();
});

final currentConversationIdProvider = StateProvider<String?>((ref) => null);

final messagesProvider = StreamProvider.family<List<ChatMessage>, String>((ref, conversationId) {
  final service = ref.watch(chatServiceProvider);
  return service.subscribeToMessages(conversationId);
});
