'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Copy, Check, Code, FileText, Table, List } from 'lucide-react';
import { useState } from 'react';

interface MarkdownRendererProps {
    content: string;
}

// Code block with copy button
function CodeBlock({ inline, className, children, ...props }: {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}) {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (inline) {
        return (
            <code className="px-1.5 py-0.5 rounded-md bg-white/10 text-purple-300 font-mono text-sm" {...props}>
                {children}
            </code>
        );
    }

    return (
        <div className="relative group my-4 rounded-xl overflow-hidden bg-[#1e1e1e] border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-white/40" />
                    <span className="text-xs text-white/50 font-medium uppercase tracking-wide">
                        {language || 'code'}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
            {/* Code content */}
            <pre className="p-4 overflow-x-auto">
                <code className={`${className} text-sm font-mono`} {...props}>
                    {children}
                </code>
            </pre>
        </div>
    );
}

// Artifact-style collapsible block (like Claude's artifacts)
function ArtifactBlock({ title, type, children }: {
    title: string;
    type: 'code' | 'document' | 'table' | 'list';
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);

    const icons = {
        code: Code,
        document: FileText,
        table: Table,
        list: List,
    };
    const Icon = icons[type] || FileText;

    return (
        <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#1a1a1a]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-white">{title}</span>
                </div>
                <span className="text-xs text-white/40">{isOpen ? 'Collapse' : 'Expand'}</span>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-white/5">
                    {children}
                </div>
            )}
        </div>
    );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-semibold
            prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
            prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
            prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
            prose-p:text-white/85 prose-p:leading-relaxed prose-p:mb-4
            prose-strong:text-white prose-strong:font-semibold
            prose-em:text-white/90 prose-em:italic
            prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
            prose-ul:my-4 prose-ul:pl-6 prose-ul:space-y-2
            prose-ol:my-4 prose-ol:pl-6 prose-ol:space-y-2
            prose-li:text-white/85 prose-li:marker:text-purple-400
            prose-blockquote:border-l-4 prose-blockquote:border-purple-500/50 
            prose-blockquote:bg-purple-500/10 prose-blockquote:px-4 prose-blockquote:py-2 
            prose-blockquote:rounded-r-lg prose-blockquote:my-4 prose-blockquote:not-italic
            prose-blockquote:text-white/80
            prose-hr:border-white/10 prose-hr:my-6
            prose-table:my-4
            prose-th:bg-white/5 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:text-white/80 prose-th:font-medium prose-th:border prose-th:border-white/10
            prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-white/10 prose-td:text-white/70
            prose-tr:hover:bg-white/5
            prose-img:rounded-xl prose-img:my-4
        ">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                    code: CodeBlock as never,
                    // Enhanced table styling with proper borders
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-[#1a1a1a]">
                            <table className="min-w-full">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-white/5 border-b border-white/10">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="divide-y divide-white/5">
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr className="hover:bg-white/5 transition-colors">
                            {children}
                        </tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                            {children}
                        </td>
                    ),
                    // Lists with nice styling
                    ul: ({ children }) => (
                        <ul className="list-disc list-outside ml-4 space-y-1.5 my-3">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-outside ml-4 space-y-1.5 my-3">
                            {children}
                        </ol>
                    ),
                    // Blockquotes as callouts
                    blockquote: ({ children }) => (
                        <div className="border-l-4 border-purple-500/50 bg-purple-500/10 px-4 py-3 rounded-r-xl my-4">
                            {children}
                        </div>
                    ),
                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

// Export artifact block for use elsewhere
export { ArtifactBlock };
