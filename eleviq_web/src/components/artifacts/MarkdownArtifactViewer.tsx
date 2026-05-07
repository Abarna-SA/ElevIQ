'use client';

import { useState } from 'react';
import { Download, Copy, Check, FileText } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

interface MarkdownArtifactViewerProps {
    content: string;
    name: string;
}

export default function MarkdownArtifactViewer({ content, name }: MarkdownArtifactViewerProps) {
    const [copied, setCopied] = useState(false);
    const { actualTheme } = useTheme();

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Create a clean filename from the artifact name
        const cleanName = name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
        a.download = `${cleanName}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Convert markdown to styled HTML for rendering
    const renderMarkdownToHTML = (md: string): string => {
        let html = md;

        // Escape HTML entities first (but preserve our generated tags after)
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr/>');
        html = html.replace(/^\*\*\*$/gm, '<hr/>');

        // Headers
        html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bold and italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Tables
        html = html.replace(/^(\|.+\|)$/gm, (match) => {
            const cells = match.split('|').filter(c => c.trim() !== '');
            // Check if this is a separator row
            if (cells.every(c => /^[\s-:]+$/.test(c))) {
                return '<!-- table-separator -->';
            }
            const cellTags = cells.map(c => {
                const trimmed = c.trim();
                return `<td>${trimmed}</td>`;
            }).join('');
            return `<tr>${cellTags}</tr>`;
        });

        // Wrap consecutive table rows in table tags
        html = html.replace(/((?:<tr>.*<\/tr>\n?<!-- table-separator -->\n?)?(?:<tr>.*<\/tr>\n?)+)/g, (match) => {
            // Convert first row to th
            let tableContent = match.replace('<!-- table-separator -->', '');
            const rows = tableContent.split('\n').filter(r => r.trim().startsWith('<tr>'));
            if (rows.length > 0) {
                const headerRow = rows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
                const bodyRows = rows.slice(1).join('\n');
                return `<div class="table-wrapper"><table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table></div>`;
            }
            return `<div class="table-wrapper"><table>${tableContent}</table></div>`;
        });

        // Unordered lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

        // Ordered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // Paragraphs - wrap remaining text lines
        html = html.replace(/^(?!<[a-z/!]|<!-- )(.+)$/gm, (match) => {
            if (match.trim() === '') return match;
            return `<p>${match}</p>`;
        });

        // Clean up empty lines
        html = html.replace(/\n{3,}/g, '\n\n');

        return html;
    };

    const isDark = actualTheme === 'dark';

    const styledHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: ${isDark ? 'linear-gradient(135deg, #0a0a0f 0%, #111827 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'};
            color: ${isDark ? '#e2e8f0' : '#1e293b'};
            line-height: 1.7;
            padding: 32px;
            min-height: 100vh;
            font-size: 14px;
        }

        h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 32px 0 16px 0;
            color: ${isDark ? '#ffffff' : '#0f172a'};
            border-bottom: 2px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'};
            padding-bottom: 12px;
        }

        h2 {
            font-size: 22px;
            font-weight: 600;
            margin: 28px 0 14px 0;
            color: ${isDark ? '#a5b4fc' : '#4338ca'};
            display: flex;
            align-items: center;
            gap: 8px;
        }

        h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 22px 0 10px 0;
            color: ${isDark ? '#c4b5fd' : '#6d28d9'};
        }

        h4 {
            font-size: 15px;
            font-weight: 600;
            margin: 16px 0 8px 0;
            color: ${isDark ? '#d1d5db' : '#374151'};
        }

        p {
            margin: 8px 0;
            color: ${isDark ? '#cbd5e1' : '#475569'};
        }

        strong {
            color: ${isDark ? '#f1f5f9' : '#1e293b'};
            font-weight: 600;
        }

        em {
            color: ${isDark ? '#94a3b8' : '#64748b'};
            font-style: italic;
        }

        hr {
            border: none;
            height: 1px;
            background: ${isDark ? 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent)'};
            margin: 28px 0;
        }

        .table-wrapper {
            overflow-x: auto;
            margin: 16px 0;
            border-radius: 12px;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        thead th {
            background: ${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)'};
            color: ${isDark ? '#a5b4fc' : '#4338ca'};
            font-weight: 600;
            text-align: left;
            padding: 12px 16px;
            white-space: nowrap;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        tbody td {
            padding: 10px 16px;
            border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            color: ${isDark ? '#cbd5e1' : '#475569'};
        }

        tbody tr:hover {
            background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
        }

        tbody tr:nth-child(even) {
            background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'};
        }

        ul {
            margin: 8px 0;
            padding-left: 24px;
        }

        li {
            margin: 6px 0;
            color: ${isDark ? '#cbd5e1' : '#475569'};
            line-height: 1.6;
        }

        li::marker {
            color: ${isDark ? '#6366f1' : '#4f46e5'};
        }

        /* Emoji enhancements */
        p:has(> strong:first-child),
        li:has(> strong:first-child) {
            margin: 4px 0;
        }

        /* Footer styling */
        em:last-child {
            display: block;
            text-align: center;
            padding: 16px;
            margin-top: 24px;
            font-size: 12px;
            color: ${isDark ? '#64748b' : '#94a3b8'};
            border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}; }

        /* Animation */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        body > * {
            animation: fadeIn 0.3s ease forwards;
        }
    </style>
</head>
<body>
    ${renderMarkdownToHTML(content)}
</body>
</html>`;

    return (
        <div className={`h-full flex flex-col ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
            {/* Tab bar with actions */}
            <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isDark
                ? 'bg-[#0A0A0A] border-white/5'
                : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        Markdown Report
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {/* Download button */}
                    <button
                        onClick={handleDownload}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark
                            ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/20'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                            }`}
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download .md
                    </button>

                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${isDark
                            ? 'text-white/50 hover:text-white hover:bg-white/10'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Rendered markdown content */}
            <div className="flex-1 overflow-auto">
                <iframe
                    srcDoc={styledHTML}
                    className="w-full h-full border-0"
                    title="Markdown Preview"
                    sandbox="allow-same-origin"
                />
            </div>
        </div>
    );
}
