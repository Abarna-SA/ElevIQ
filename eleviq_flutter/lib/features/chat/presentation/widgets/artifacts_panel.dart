import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/chat_ui_providers.dart';
import '../../data/models.dart';

class ArtifactsPanel extends ConsumerWidget {
  final bool compact;

  const ArtifactsPanel({super.key, this.compact = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isOpen = ref.watch(artifactsPanelOpenProvider);
    final activeId = ref.watch(activeArtifactIdProvider);
    final artifacts = ref.watch(artifactsListProvider);

    if (!isOpen) return const SizedBox.shrink();

    final activeArtifact = artifacts.cast<GeneratedArtifact?>().firstWhere(
          (a) => a?.id == activeId,
          orElse: () => null,
        );

    return Container(
      width: compact ? double.infinity : 400,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(
          left: BorderSide(
            color: compact ? Colors.transparent : theme.dividerColor,
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          _buildHeader(context, ref, theme, activeArtifact),
          Expanded(
            child: activeArtifact == null
                ? Center(
                    child: Text(
                    'No artifact selected',
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                  ))
                : _buildArtifactContent(context, theme, activeArtifact),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, ThemeData theme,
      GeneratedArtifact? artifact) {
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: theme.dividerColor, width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(Icons.code,
                  size: 20, color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(width: 8),
              Text(
                artifact?.name ?? 'Artifacts',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          Row(
            children: [
              IconButton(
                onPressed: () {}, // Handle copy
                icon: const Icon(Icons.copy, size: 18),
                tooltip: 'Copy',
              ),
              IconButton(
                onPressed: () {
                  ref.read(artifactsPanelOpenProvider.notifier).state = false;
                },
                icon: const Icon(Icons.close, size: 20),
                tooltip: 'Close',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildArtifactContent(
      BuildContext context, ThemeData theme, GeneratedArtifact artifact) {
    // For now, simple text or code display
    return Container(
      width: double.infinity,
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: SelectableText(
          artifact.content,
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: 13,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}
