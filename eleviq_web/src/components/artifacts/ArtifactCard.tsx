'use client';

import { FileSpreadsheet, FileText, Code, Image, ExternalLink } from 'lucide-react';
import { useArtifactsStore, Artifact } from '@/store/artifacts-store';
import { useTheme } from '@/contexts/theme-context';

interface ArtifactCardProps {
    artifactId: string;
}

export default function ArtifactCard({ artifactId }: ArtifactCardProps) {
    const { artifacts, openArtifact } = useArtifactsStore();
    const { actualTheme } = useTheme();

    const artifact = artifacts.find(a => a.id === artifactId);

    if (!artifact) {
        return null;
    }

    const getIcon = () => {
        switch (artifact.type) {
            case 'csv': return FileSpreadsheet;
            case 'pdf': return FileText;
            case 'code':
            case 'html': return Code;
            case 'image': return Image;
            default: return FileText;
        }
    };

    const getTypeLabel = () => {
        switch (artifact.type) {
            case 'csv': return 'CSV';
            case 'pdf': return 'PDF';
            case 'code': return artifact.language?.toUpperCase() || 'CODE';
            case 'html': return 'HTML';
            case 'image': return 'IMAGE';
            default: return 'FILE';
        }
    };

    const Icon = getIcon();

    return (
        <button
            onClick={() => openArtifact(artifactId)}
            className={`group flex items-center gap-3 px-4 py-3 border rounded-xl transition-all cursor-pointer text-left w-full ${actualTheme === 'dark'
                ? 'bg-[#1a1a1a] hover:bg-[#252525] border-white/10 hover:border-purple-500/50'
                : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-purple-400 shadow-sm'
                }`}
        >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-purple-400" />
            </div>

            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${actualTheme === 'dark' ? 'text-white/90' : 'text-gray-900'
                    }`}>
                    {artifact.name}
                </p>
                <p className={`text-xs ${actualTheme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                    {getTypeLabel()}
                </p>
            </div>

            <ExternalLink className={`w-4 h-4 group-hover:text-purple-400 transition-colors ${actualTheme === 'dark' ? 'text-white/30' : 'text-gray-300'
                }`} />
        </button>
    );
}
