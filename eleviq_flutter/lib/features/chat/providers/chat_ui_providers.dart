import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:typed_data';
import '../data/models.dart';

// Sidebar state
final sidebarOpenProvider = StateProvider<bool>((ref) => false);

// Artifacts Panel state
final artifactsPanelOpenProvider = StateProvider<bool>((ref) => false);
final activeArtifactIdProvider = StateProvider<String?>((ref) => null);

// Attachments state
class Attachment {
  final String name;
  final String path;
  final String type;
  final Uint8List? bytes;

  Attachment({required this.name, required this.path, required this.type, this.bytes});
}

final attachmentsProvider = StateProvider<List<Attachment>>((ref) => []);

// GeneratedArtifact is now defined in models.dart

class ArtifactsNotifier extends StateNotifier<List<GeneratedArtifact>> {
  ArtifactsNotifier() : super([]);

  void syncArtifacts(List<GeneratedArtifact> newArtifacts) {
    if (newArtifacts.isEmpty) return;
    
    final existingIds = state.map((a) => a.id).toSet();
    final uniqueNew = newArtifacts.where((a) => !existingIds.contains(a.id)).toList();
    
    if (uniqueNew.isNotEmpty) {
      state = [...state, ...uniqueNew];
    }
  }

  String addArtifact(
      GeneratedArtifact artifact,
      {bool openPanel = true,
      required StateController<bool> panelState,
      required StateController<String?> activeArtifactState}) {
    state = [...state, artifact];
    if (openPanel) {
      panelState.state = true;
      activeArtifactState.state = artifact.id;
    }
    return artifact.id;
  }
}

final artifactsListProvider =
    StateNotifierProvider<ArtifactsNotifier, List<GeneratedArtifact>>((ref) {
  return ArtifactsNotifier();
});

// A provider to hold the generating artifact preview code
class GeneratingArtifact {
  final String name;
  final String type;
  final bool isGenerating;
  final String? previewCode;

  GeneratingArtifact({
    required this.name,
    required this.type,
    required this.isGenerating,
    this.previewCode,
  });

  GeneratingArtifact copyWith({String? previewCode}) {
    return GeneratingArtifact(
      name: name,
      type: type,
      isGenerating: isGenerating,
      previewCode: previewCode ?? this.previewCode,
    );
  }
}

final generatingArtifactProvider =
    StateProvider<GeneratingArtifact?>((ref) => null);
