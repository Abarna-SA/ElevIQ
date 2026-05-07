'use client';

import { useState } from 'react';
import { Code, Eye, Copy, Check, Play } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

interface CodePreviewProps {
    content: string;
    language: string;
    name: string;
}

export default function CodePreview({ content, language, name }: CodePreviewProps) {
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');
    const [copied, setCopied] = useState(false);
    const { actualTheme } = useTheme();

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Check if we can preview this code
    const canPreview = language === 'html' || language === 'jsx' || language === 'react';

    // Inject wrapper styles to ensure proper display
    const wrapperStyles = `
        <style>
            html, body {
                margin: 0;
                padding: 0;
                min-height: 100vh;
                background: #0f0f0f;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            body {
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding: 24px;
            }
            body > * {
                max-width: 100%;
            }
            /* Override any existing body styles from content */
            table {
                border-collapse: collapse;
                width: 100%;
                max-width: 800px;
            }
        </style>
    `;

    // Generate preview HTML
    const getPreviewHTML = () => {
        if (language === 'html') {
            // Check if content already has DOCTYPE/html structure
            if (content.includes('<!DOCTYPE') || content.includes('<html')) {
                // Inject our wrapper styles into existing HTML
                return content.replace('</head>', wrapperStyles + '</head>');
            }
            // Wrap bare HTML in proper document structure
            return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${wrapperStyles}
</head>
<body>
    ${content}
</body>
</html>`;
        }

        // For React/JSX, wrap in a basic HTML template
        if (language === 'jsx' || language === 'react') {
            return `
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${content}
        
        // Try to render the first exported component
        try {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            // Look for common component names
            if (typeof App !== 'undefined') root.render(<App />);
            else if (typeof Component !== 'undefined') root.render(<Component />);
        } catch (e) {
            document.getElementById('root').innerHTML = '<p style="color:red">Error: ' + e.message + '</p>';
        }
    </script>
</body>
</html>`;
        }

        return `<pre style="color:#fff; padding:16px; font-family:monospace;">${content}</pre>`;
    };

    return (
        <div className={`h-full flex flex-col ${actualTheme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
            {/* Tab bar */}
            <div className={`flex items-center justify-between px-4 py-2 border-b ${actualTheme === 'dark'
                    ? 'bg-[#252525] border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                <div className="flex gap-1">
                    {canPreview && (
                        <>
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'preview'
                                        ? actualTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                                        : actualTheme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                            <button
                                onClick={() => setActiveTab('code')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'code'
                                        ? actualTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                                        : actualTheme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <Code className="w-4 h-4" />
                                Code
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${actualTheme === 'dark'
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

            {/* Content area */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'preview' && canPreview ? (
                    <iframe
                        srcDoc={getPreviewHTML()}
                        className="w-full h-full border-0 bg-white"
                        title="Preview"
                        sandbox="allow-scripts"
                    />
                ) : (
                    <pre className={`p-4 text-sm font-mono overflow-auto h-full m-0 ${actualTheme === 'dark' ? 'text-white/90' : 'text-gray-800 bg-gray-50'
                        }`}>
                        <code>{content}</code>
                    </pre>
                )}
            </div>
        </div>
    );
}
