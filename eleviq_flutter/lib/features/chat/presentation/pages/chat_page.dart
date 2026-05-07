import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models.dart';
import '../../providers/chat_providers.dart';
import '../../providers/chat_ui_providers.dart';
import '../widgets/chat_sidebar.dart';
import '../widgets/chat_input_area.dart';
import '../widgets/artifacts_panel.dart';
import '../widgets/artifact_card.dart';
import '../widgets/markdown_renderer.dart';
import 'package:uuid/uuid.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

String getApiBaseUrl() {
  if (kIsWeb) return 'http://localhost:3000';
  if (Platform.isAndroid) return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({super.key});

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final _scrollController = ScrollController();
  final _uuid = const Uuid();
  String? _streamingMessage;

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _handleSendMessage(String text, List<Attachment> attachments) async {
    final service = ref.read(chatServiceProvider);
    var convId = ref.read(currentConversationIdProvider);

    try {
      if (convId == null) {
        convId = await service.createConversation(
          text.length > 30 ? '${text.substring(0, 30)}...' : text,
        );
        ref.read(currentConversationIdProvider.notifier).state = convId;
      }

      // Add user message
      await service.addMessage(
        convId,
        ChatMessage(
          id: '',
          role: 'user',
          content: text + (attachments.isNotEmpty ? '\n[${attachments.length} attachments added]' : ''),
          createdAt: DateTime.now(),
        ),
      );

      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);

      // Prepare history
      final historyList = <Map<String, String>>[];
      if (convId != null) {
        final msgs = ref.read(messagesProvider(convId)).value ?? [];
        // Take last 10 messages for context
        for (var m in msgs.take(10)) {
          historyList.add({
            'role': m.role,
            'content': m.content,
          });
        }
      }

      // Convert attachments to base64
      final filesData = <Map<String, String>>[];
      for (var file in attachments) {
        if (file.bytes != null) {
          filesData.add({
            'name': file.name,
            'type': _getMimeType(file.type),
            'data': base64Encode(file.bytes!),
          });
        }
      }

      setState(() {
        _streamingMessage = '';
      });

      // Send to Next.js API via Dio
      final dio = Dio();
      final response = await dio.post<ResponseBody>(
        '${getApiBaseUrl()}/api/chat',
        data: {
          'message': text,
          'context': 'Flutter App User',
          'history': historyList,
          'files': filesData,
          'model': 'gemini-3-flash-preview',
        },
        options: Options(responseType: ResponseType.stream),
      );

      final stream = response.data!.stream;
      String fullResponse = '';
      
      await for (final chunk in stream) {
        final textChunk = utf8.decode(chunk);
        fullResponse += textChunk;
        if (mounted) {
          setState(() {
            _streamingMessage = fullResponse;
          });
          _scrollToBottom();
        }
      }

      // Check for code blocks to generate artifacts
      List<String> mockArtifactIds = [];
      final regex = RegExp(r'```(\w+)?\n([\s\S]*?)```');
      final matches = regex.allMatches(fullResponse);
      int blockCount = 1;
      
      for (final match in matches) {
        final language = match.group(1) ?? 'txt';
        final code = match.group(2) ?? '';
        
        final artifactId = _uuid.v4();
        final artifact = GeneratedArtifact(
          id: artifactId,
          name: 'generated_block_$blockCount.$language',
          type: language == 'html' ? 'html' : 'code',
          content: code.trim(),
          language: language,
        );
        ref.read(artifactsListProvider.notifier).addArtifact(
          artifact,
          openPanel: false, // Don't auto open all of them sequentially
          panelState: ref.read(artifactsPanelOpenProvider.notifier),
          activeArtifactState: ref.read(activeArtifactIdProvider.notifier),
        );
        mockArtifactIds.add(artifactId);
        blockCount++;
      }

      await service.addMessage(
        convId!,
        ChatMessage(
          id: '',
          role: 'assistant',
          content: fullResponse,
          createdAt: DateTime.now(),
          artifactIds: mockArtifactIds.isNotEmpty ? mockArtifactIds : null,
        ),
      );

      if (mounted) {
        setState(() {
          _streamingMessage = null;
        });
      }

      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    } catch (e) {
      if (mounted) {
        setState(() {
          _streamingMessage = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  String _getMimeType(String ext) {
    switch (ext.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'pdf':
        return 'application/pdf';
      case 'csv':
        return 'text/csv';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final convId = ref.watch(currentConversationIdProvider);
    final isSidebarOpen = ref.watch(sidebarOpenProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(isSidebarOpen ? Icons.menu_open : Icons.menu),
          onPressed: () {
            ref.read(sidebarOpenProvider.notifier).state = !isSidebarOpen;
          },
        ),
        title: const Text('AI Agent', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
        centerTitle: true,
        backgroundColor: theme.colorScheme.surface,
        scrolledUnderElevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_square, size: 20),
            onPressed: () {
              ref.read(currentConversationIdProvider.notifier).state = null;
            },
            tooltip: 'New Chat',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Stack(
        children: [
          // Base layer
          Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Main Chat Area
              Expanded(
                child: Column(
                  children: [
                    Expanded(
                      child: convId == null
                          ? _buildEmptyState(theme)
                          : _buildMessageList(convId, theme),
                    ),
                    ChatInputArea(onSendMessage: _handleSendMessage),
                  ],
                ),
              ),

              // Right Artifacts Panel
              const ArtifactsPanel(),
            ],
          ),

          // Overlay Backdrop
          if (isSidebarOpen)
            Positioned.fill(
              child: GestureDetector(
                onTap: () {
                  ref.read(sidebarOpenProvider.notifier).state = false;
                },
                child: Container(
                  color: Colors.black.withValues(alpha: 0.3),
                ),
              ),
            ),

          // Overlay Sidebar
          AnimatedPositioned(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut,
            top: 0,
            bottom: 0,
            left: isSidebarOpen ? 0 : -260,
            width: 260,
            child: Material(
              elevation: 4,
              shadowColor: Colors.black.withValues(alpha: 0.5),
              child: const ChatSidebar(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.auto_awesome,
              size: 48,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'How can I help you today?',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Ask me about spending patterns, budgets, or to generate analysis code!',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList(String convId, ThemeData theme) {
    final messagesAsync = ref.watch(messagesProvider(convId));

    return messagesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (messages) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

        return ListView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          itemCount: messages.length + (_streamingMessage != null ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == messages.length && _streamingMessage != null) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Flexible(
                      child: _buildAssistantBubble(
                        ChatMessage(id: 'streaming', role: 'assistant', content: _streamingMessage!, createdAt: DateTime.now()),
                        theme
                      ),
                    ),
                    const SizedBox(width: 48), // Padding
                  ],
                ),
              );
            }

            final msg = messages[index];
            final isUser = msg.role == 'user';

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Row(
                mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Flexible(
                    child: isUser
                        ? _buildUserBubble(msg, theme)
                        : _buildAssistantBubble(msg, theme),
                  ),
                  if (isUser) const SizedBox(width: 48), // Padding so user bubbles don't stretch fully
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildUserBubble(ChatMessage msg, ThemeData theme) {
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFE9D5FF), // Tailwind purple-100
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
          bottomLeft: Radius.circular(16),
          bottomRight: Radius.circular(4), // Smaller radius to match web
        ),
      ),
      child: Text(
        msg.content,
        style: TextStyle(
          color: isDark ? Colors.white : Colors.black87,
          fontSize: 15,
        ),
      ),
    );
  }

  Widget _buildAssistantBubble(ChatMessage msg, ThemeData theme) {
    // Basic parser to look for [[artifact:id]] tokens and swap them with ArtifactCards
    final parts = <Widget>[];
    final regex = RegExp(r'\[\[artifact:(.*?)\]\]');
    final matches = regex.allMatches(msg.content);
    
    int lastEnd = 0;
    for (final match in matches) {
      if (match.start > lastEnd) {
        final textPart = msg.content.substring(lastEnd, match.start).trim();
        if (textPart.isNotEmpty) {
          parts.add(MarkdownRenderer(content: textPart));
        }
      }
      
      final artifactId = match.group(1);
      if (artifactId != null) {
        parts.add(ArtifactCard(artifactId: artifactId.trim()));
      }
      
      lastEnd = match.end;
    }
    
    if (lastEnd < msg.content.length) {
      final textPart = msg.content.substring(lastEnd).trim();
      if (textPart.isNotEmpty) {
        parts.add(Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: MarkdownRenderer(content: textPart),
        ));
      }
    }

    if (parts.isEmpty && msg.content.isNotEmpty) {
      parts.add(MarkdownRenderer(content: msg.content));
    }
    
    // Explicitly add artifactIds array from Firestore if it exists
    if (msg.artifactIds != null && msg.artifactIds!.isNotEmpty) {
      parts.add(Padding(
        padding: const EdgeInsets.only(top: 12.0),
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: msg.artifactIds!.map((id) => ArtifactCard(artifactId: id)).toList(),
        ),
      ));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: parts,
    );
  }
}

