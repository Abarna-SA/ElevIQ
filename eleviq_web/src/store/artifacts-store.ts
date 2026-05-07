import { create } from 'zustand';

export interface Artifact {
    id: string;
    name: string;
    type: 'csv' | 'pdf' | 'code' | 'image' | 'html' | 'markdown';
    content: string; // base64 data or raw content
    mimeType?: string;
    language?: string; // for code: 'html', 'react', 'javascript', 'css'
    createdAt: Date;
}

interface ArtifactsState {
    artifacts: Artifact[];
    activeArtifactId: string | null;
    isPanelOpen: boolean;

    // Actions
    addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>, openPanel?: boolean) => string;
    syncArtifacts: (artifacts: Artifact[]) => void;
    removeArtifact: (id: string) => void;
    setActiveArtifact: (id: string | null) => void;
    openArtifact: (id: string) => void; // Set active AND open panel
    togglePanel: () => void;
    openPanel: () => void;
    closePanel: () => void;
    clearArtifacts: () => void;
}

export const useArtifactsStore = create<ArtifactsState>((set, get) => ({
    artifacts: [],
    activeArtifactId: null,
    isPanelOpen: false,

    syncArtifacts: (newArtifacts) => {
        set((state) => {
            const existingIds = new Set(state.artifacts.map(a => a.id));
            const uniqueNew = newArtifacts.filter(a => !existingIds.has(a.id));
            if (uniqueNew.length === 0) return state;
            return {
                artifacts: [...state.artifacts, ...uniqueNew]
            };
        });
    },

    addArtifact: (artifact, openPanel = false) => {
        const id = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newArtifact: Artifact = {
            ...artifact,
            id,
            createdAt: new Date(),
        };

        set((state) => ({
            artifacts: [...state.artifacts, newArtifact],
            activeArtifactId: openPanel ? id : state.activeArtifactId,
            isPanelOpen: openPanel ? true : state.isPanelOpen,
        }));

        return id;
    },

    removeArtifact: (id) => {
        set((state) => {
            const newArtifacts = state.artifacts.filter((a) => a.id !== id);
            const newActiveId = state.activeArtifactId === id
                ? (newArtifacts.length > 0 ? newArtifacts[0].id : null)
                : state.activeArtifactId;

            return {
                artifacts: newArtifacts,
                activeArtifactId: newActiveId,
                isPanelOpen: newArtifacts.length > 0 && state.isPanelOpen,
            };
        });
    },

    setActiveArtifact: (id) => {
        set({ activeArtifactId: id });
    },

    openArtifact: (id) => {
        set({ activeArtifactId: id, isPanelOpen: true });
    },

    togglePanel: () => {
        set((state) => ({ isPanelOpen: !state.isPanelOpen }));
    },

    openPanel: () => {
        set({ isPanelOpen: true });
    },

    closePanel: () => {
        set({ isPanelOpen: false });
    },

    clearArtifacts: () => {
        set({ artifacts: [], activeArtifactId: null, isPanelOpen: false });
    },
}));
