'use client';

import { X, FileSpreadsheet, FileText, Code, Image, RefreshCw, Copy, Check, ChevronDown } from 'lucide-react';
import { useArtifactsStore, Artifact } from '@/store/artifacts-store';
import CSVViewer from './CSVViewer';
import PDFViewer from './PDFViewer';
import CodePreview from './CodePreview';
import MarkdownArtifactViewer from './MarkdownArtifactViewer';
import { useState } from 'react';
import { useTheme } from '@/contexts/theme-context';

interface ArtifactsPanelProps {
    compact?: boolean;
}

export default function ArtifactsPanel({ compact = false }: ArtifactsPanelProps) {
    const { artifacts, activeArtifactId, isPanelOpen, setActiveArtifact, removeArtifact, closePanel } = useArtifactsStore();
    const [copied, setCopied] = useState(false);
    const { actualTheme } = useTheme();

    if (!isPanelOpen || artifacts.length === 0) {
        return null;
    }

    const activeArtifact = artifacts.find(a => a.id === activeArtifactId);

    const getIcon = (type: Artifact['type']) => {
        switch (type) {
            case 'csv': return FileSpreadsheet;
            case 'pdf': return FileText;
            case 'markdown': return FileText;
            case 'code':
            case 'html': return Code;
            case 'image': return Image;
            default: return FileText;
        }
    };

    const handleCopy = async () => {
        if (!activeArtifact) return;

        let content = activeArtifact.content;
        // For base64 content, we can't really copy it meaningfully
        if (activeArtifact.type === 'csv' || activeArtifact.type === 'code' || activeArtifact.type === 'html' || activeArtifact.type === 'markdown') {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const renderViewer = () => {
        if (!activeArtifact) return null;

        switch (activeArtifact.type) {
            case 'csv':
                return <CSVViewer content={activeArtifact.content} name={activeArtifact.name} />;
            case 'pdf':
                return <PDFViewer content={activeArtifact.content} name={activeArtifact.name} />;
            case 'markdown':
                return <MarkdownArtifactViewer content={activeArtifact.content} name={activeArtifact.name} />;
            case 'code':
            case 'html':
                return (
                    <CodePreview
                        content={activeArtifact.content}
                        language={activeArtifact.language || 'html'}
                        name={activeArtifact.name}
                    />
                );
            case 'image':
                return (
                    <div className="h-full flex items-center justify-center p-4">
                        <img
                            src={`data:${activeArtifact.mimeType};base64,${activeArtifact.content}`}
                            alt={activeArtifact.name}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>
                );
            default:
                return (
                    <div className={`h-full flex items-center justify-center ${actualTheme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                        Unsupported file type
                    </div>
                );
        }
    };

    return (
        <div className={`h-full flex flex-col ${compact ? '' : 'border-l'} ${actualTheme === 'dark'
            ? 'bg-[#0f0f0f] border-white/10'
            : 'bg-gray-50 border-gray-200'
            }`}>
            {/* Header with tabs - hidden in compact mode */}
            {!compact && (
                <div className={`flex items-center justify-between px-4 py-2 border-b ${actualTheme === 'dark'
                    ? 'bg-[#0A0A0A] border-white/5'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                        {/* Artifact type icon with dropdown if multiple */}
                        <div className="flex items-center gap-2">
                            {activeArtifact && (() => {
                                const Icon = getIcon(activeArtifact.type);
                                return <Icon className="w-4 h-4 text-purple-400" />;
                            })()}

                            {artifacts.length > 1 ? (
                                <div className="relative group">
                                    <button className={`flex items-center gap-1 text-sm font-medium transition-colors ${actualTheme === 'dark'
                                        ? 'text-white hover:text-white/80'
                                        : 'text-gray-900 hover:text-gray-600'
                                        }`}>
                                        {activeArtifact?.name}
                                        <ChevronDown className={`w-3 h-3 ${actualTheme === 'dark' ? 'text-white/50' : 'text-gray-400'}`} />
                                    </button>
                                    {/* Dropdown */}
                                    <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[200px] border ${actualTheme === 'dark'
                                        ? 'bg-[#252525] border-white/10'
                                        : 'bg-white border-gray-200'
                                        }`}>
                                        {artifacts.map((artifact) => {
                                            const Icon = getIcon(artifact.type);
                                            return (
                                                <button
                                                    key={artifact.id}
                                                    onClick={() => setActiveArtifact(artifact.id)}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${artifact.id === activeArtifactId
                                                        ? actualTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                                                        : actualTheme === 'dark' ? 'text-white/70 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4 text-purple-400" />
                                                    <span className="truncate">{artifact.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <span className={`text-sm font-medium truncate ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {activeArtifact?.name}
                                </span>
                            )}

                            {/* Type badge */}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${actualTheme === 'dark'
                                ? 'bg-white/10 text-white/50'
                                : 'bg-gray-100 text-gray-500'
                                }`}>
                                {activeArtifact?.type}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                        {/* Copy button (for text-based artifacts) */}
                        {activeArtifact && (activeArtifact.type === 'csv' || activeArtifact.type === 'code' || activeArtifact.type === 'html' || activeArtifact.type === 'markdown') && (
                            <button
                                onClick={handleCopy}
                                className={`p-1.5 rounded-lg transition-colors ${actualTheme === 'dark'
                                    ? 'text-white/50 hover:text-white hover:bg-white/10'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Copy content"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        )}

                        {/* Close button */}
                        <button
                            onClick={closePanel}
                            className={`p-1.5 rounded-lg transition-colors ${actualTheme === 'dark'
                                ? 'text-white/50 hover:text-white hover:bg-white/10'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                            title="Close panel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Content viewer */}
            <div className="flex-1 overflow-hidden">
                {renderViewer()}
            </div>
        </div>
    );
}
