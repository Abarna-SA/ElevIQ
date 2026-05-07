import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/chat_providers.dart';
import '../../providers/chat_ui_providers.dart';
import '../../data/models.dart';
import 'package:uuid/uuid.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:ui' as ui;

class ChatInputArea extends ConsumerStatefulWidget {
  final Function(String, List<Attachment>) onSendMessage;
  
  const ChatInputArea({super.key, required this.onSendMessage});

  @override
  ConsumerState<ChatInputArea> createState() => _ChatInputAreaState();
}

class _ChatInputAreaState extends ConsumerState<ChatInputArea> {
  final _inputController = TextEditingController();
  bool _isLoading = false;
  String _selectedModel = 'gemini-3-flash-preview';

  Future<void> _handleSend() async {
    final text = _inputController.text.trim();
    final attachments = ref.read(attachmentsProvider);

    if ((text.isEmpty && attachments.isEmpty) || _isLoading) return;

    setState(() => _isLoading = true);
    
    // Call the parent callback to handle the complex sending logic
    await widget.onSendMessage(text, attachments);
    
    if (mounted) {
      setState(() => _isLoading = false);
      _inputController.clear();
      ref.read(attachmentsProvider.notifier).state = []; // Clear attachments
    }
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      withData: true,
      type: FileType.custom,
      allowedExtensions: ['jpg', 'png', 'pdf', 'csv', 'txt'],
    );

    if (result != null) {
      final newAttachments = result.files.map((file) {
        return Attachment(
          name: file.name,
          path: file.path ?? '',
          type: file.extension ?? 'unknown',
          bytes: file.bytes,
        );
      }).toList();

      final current = ref.read(attachmentsProvider);
      ref.read(attachmentsProvider.notifier).state = [...current, ...newAttachments];
    }
  }

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final attachments = ref.watch(attachmentsProvider);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 24, top: 4),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: BackdropFilter(
                filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                child: Container(
                  decoration: BoxDecoration(
                    color: isDark 
                        ? Colors.white.withValues(alpha: 0.08)
                        : Colors.white.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                      color: isDark 
                          ? Colors.white.withValues(alpha: 0.15)
                          : theme.dividerColor.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (attachments.isNotEmpty) _buildAttachmentPreview(theme, attachments),
                      
                      // TextField
                      Padding(
                        padding: EdgeInsets.fromLTRB(20, attachments.isNotEmpty ? 4 : 20, 20, 8),
                        child: TextField(
                          controller: _inputController,
                          decoration: InputDecoration(
                            hintText: 'Ask me anything about your finances...',
                            hintStyle: TextStyle(
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                            ),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                          maxLines: 5,
                          minLines: 1,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _handleSend(),
                        ),
                      ),
                      
                      // Bottom Toolbar
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Left side
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.add),
                                  color: theme.colorScheme.onSurfaceVariant,
                                  onPressed: () {},
                                  tooltip: 'More options',
                                ),
                                IconButton(
                                  icon: const Icon(Icons.attach_file),
                                  color: theme.colorScheme.onSurfaceVariant,
                                  onPressed: _pickFiles,
                                  tooltip: 'Add files or photos',
                                ),
                              ],
                            ),
                            // Right side
                            Row(
                              children: [
                                _buildModelSelector(theme),
                                const SizedBox(width: 8),
                                _isLoading
                                    ? Padding(
                                        padding: const EdgeInsets.all(8.0),
                                        child: SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: theme.colorScheme.primary,
                                          ),
                                        ),
                                      )
                                    : IconButton(
                                        style: IconButton.styleFrom(
                                          backgroundColor: Colors.orange.shade500,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                        ),
                                        icon: const Icon(Icons.send, size: 18),
                                        onPressed: _handleSend,
                                      ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'ElevIQ AI can make mistakes. Please verify important financial advice.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentPreview(ThemeData theme, List<Attachment> attachments) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: attachments.asMap().entries.map((entry) {
          final idx = entry.key;
          final file = entry.value;

          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainer,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.dividerColor),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.insert_drive_file, size: 16, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  file.name.length > 15 ? '${file.name.substring(0, 15)}...' : file.name,
                  style: const TextStyle(fontSize: 12),
                ),
                const SizedBox(width: 4),
                InkWell(
                  onTap: () {
                    final newList = List<Attachment>.from(attachments)..removeAt(idx);
                    ref.read(attachmentsProvider.notifier).state = newList;
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: const Padding(
                    padding: EdgeInsets.all(2.0),
                    child: Icon(Icons.close, size: 14),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildModelSelector(ThemeData theme) {
    return PopupMenuButton<String>(
      initialValue: _selectedModel,
      onSelected: (value) => setState(() => _selectedModel = value),
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'gemini-3-flash-preview',
          child: Text('Gemini 3 Flash'),
        ),
        const PopupMenuItem(
          value: 'gemini-3-pro-preview',
          child: Text('Gemini 3 Pro'),
        ),
      ],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _selectedModel.contains('flash') ? 'Flash' : 'Pro',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down, size: 16, color: theme.colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}
