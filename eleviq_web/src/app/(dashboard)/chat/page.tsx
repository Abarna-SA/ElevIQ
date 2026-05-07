'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Send,
    Bot,
    User,
    Sparkles,
    TrendingUp,
    PiggyBank,
    Target,
    Loader2,
    Plus,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Settings,
    MoreHorizontal,
    Paperclip,
    Image,
    FolderPlus,
    Globe,
    Wand2,
    Blocks,
    ChevronDown,
    Check,
    X,
    FileText,
    Upload,
    Square,
    Coffee,
} from 'lucide-react';
import { useExpenseStore } from '@/store/expense-store';
import { useAuthStore } from '@/store/auth-store';
import { getCategoryById } from '@/types/expense';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';
import { useSidebarStore } from '@/store/sidebar-store';
import { useArtifactsStore, Artifact } from '@/store/artifacts-store';
import ArtifactsPanel from '@/components/artifacts/ArtifactsPanel';
import ArtifactCard from '@/components/artifacts/ArtifactCard';
import { extractCodeBlocks, getArtifactType } from '@/lib/code-extractor';
import { useTheme } from '@/contexts/theme-context';

import {
    Conversation,
    ChatMessage as Message,
    subscribeToConversations,
    subscribeToMessages,
    createConversation,
    addMessage,
    getArtifactsByIds,
    saveArtifact,
} from '@/lib/firebase/chat';

interface MessageFile {
    name: string;
    type: string;
    preview?: string;
}

const suggestedPrompts = [
    { icon: TrendingUp, text: 'Analyze my spending patterns' },
    { icon: PiggyBank, text: 'How can I save more money?' },
    { icon: Target, text: 'Help me create a budget' },
];

// No more mock conversations

export default function ChatPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { expenses, monthlyTotal, categoryTotals } = useExpenseStore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default
    const { collapseSidebar, expandSidebar } = useSidebarStore();
    const { isPanelOpen, addArtifact, closePanel, syncArtifacts } = useArtifactsStore();
    const { actualTheme } = useTheme();
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [attachMenuOpen, setAttachMenuOpen] = useState(false);
    const [modelMenuOpen, setModelMenuOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [streamingMessage, setStreamingMessage] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [showSlowMessage, setShowSlowMessage] = useState(false);
    const [generatingArtifact, setGeneratingArtifact] = useState<{
        name: string;
        type: string;
        isGenerating: boolean;
        previewCode?: string;
    } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const slowMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachMenuRef = useRef<HTMLDivElement>(null);

    const aiModels = [
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fast & intelligent' },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Most capable' },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Firestore Integrations
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToConversations((data) => {
            setConversations(data);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!activeConversation) {
            setMessages([]);
            return;
        }
        const unsubscribe = subscribeToMessages(activeConversation, async (data) => {
            setMessages(data);
            
            // Extract all artifact IDs from messages
            const allArtifactIds = new Set<string>();
            data.forEach(msg => {
                msg.artifactIds?.forEach(id => allArtifactIds.add(id));
            });
            
            if (allArtifactIds.size > 0) {
                // Fetch missing artifacts
                const toFetch = Array.from(allArtifactIds);
                getArtifactsByIds(toFetch).then((dbArtifacts) => {
                    const mappedArtifacts: Artifact[] = dbArtifacts.map(dbA => ({
                        id: dbA.id,
                        name: dbA.name,
                        type: dbA.type as any,
                        content: dbA.content,
                        mimeType: dbA.mimeType,
                        language: dbA.language,
                        createdAt: dbA.createdAt,
                    }));
                    syncArtifacts(mappedArtifacts);
                }).catch(err => console.error("Error fetching artifacts:", err));
            }
        });
        return () => unsubscribe();
    }, [activeConversation, syncArtifacts]);

    const buildContext = () => {
        const topCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id, amount]) => {
                const cat = getCategoryById(id);
                return `${cat?.name || 'Other'}: ₹${amount.toLocaleString()}`;
            })
            .join(', ');

        return `
User: ${user?.displayName || 'User'}
Monthly Spending: ₹${monthlyTotal.toLocaleString()}
Total Transactions: ${expenses.length}
Top Categories: ${topCategories || 'No data yet'}
Recent Expenses: ${expenses.slice(0, 5).map(e => `${e.description}: ₹${e.amount}`).join(', ') || 'None'}
    `.trim();
    };

    const sendMessage = async (content: string) => {
        if ((!content.trim() && attachedFiles.length === 0) || isLoading) return;

        // Convert files to base64 for API and create artifacts
        const createdArtifactIds: string[] = [];

        const fileDataPromises = attachedFiles.map(async (file) => {
            return new Promise<{ name: string; type: string; data: string }>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = (reader.result as string).split(',')[1];

                    // Create artifact for this file (don't open panel)
                    let artifactType: 'csv' | 'pdf' | 'image' | 'code' | 'html' = 'pdf';
                    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        artifactType = 'csv';
                    } else if (file.type === 'application/pdf') {
                        artifactType = 'pdf';
                    } else if (file.type.startsWith('image/')) {
                        artifactType = 'image';
                    }

                    // Create artifact without opening panel
                    const artifactContent = artifactType === 'csv' ? atob(base64) : base64;
                    const newArtifactPayload = {
                        name: file.name,
                        type: artifactType,
                        content: artifactContent,
                        mimeType: file.type,
                    };
                    const artifactId = addArtifact(newArtifactPayload, false); // false = don't open panel

                    // Fire and forget save to Firestore
                    saveArtifact({
                        id: artifactId,
                        ...newArtifactPayload,
                        createdAt: new Date(),
                    }).catch(err => console.error("Failed to save artifact:", err));

                    createdArtifactIds.push(artifactId);

                    resolve({
                        name: file.name,
                        type: file.type,
                        data: base64,
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        const fileData = await Promise.all(fileDataPromises);

        // Create file previews for display in chat
        const messageFiles: MessageFile[] = attachedFiles.map(f => ({
            name: f.name,
            type: f.type,
            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
        }));

        let currentConvId = activeConversation;
        if (!currentConvId) {
            currentConvId = await createConversation(
                content.trim().slice(0, 30) || 'New Analysis',
            );
            setActiveConversation(currentConvId);
        }

        const userMessageContent = content.trim() || 'Please analyze the attached file(s).';

        // Save user message to Firestore
        await addMessage(currentConvId, {
            role: 'user',
            content: userMessageContent,
            files: messageFiles.length > 0 ? messageFiles.map(f => ({ name: f.name, type: f.type })) : undefined,
        });

        const pendingArtifactIds = [...createdArtifactIds];

        // Wait to artificially update UI: user message will stream from Firestore subscription naturally,
        // but for immediate feedback we can depend on snapshot.

        setInput('');
        setAttachedFiles([]); // Clear files after sending
        setIsLoading(true);
        setShowSlowMessage(false);

        // Show generating artifact card if files are attached
        if (fileData.length > 0) {
            const fileName = attachedFiles[0]?.name || 'File Analysis';
            const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
            setGeneratingArtifact({
                name: `${baseName} Analysis`,
                type: 'markdown',
                isGenerating: true,
            });
        }

        // Create AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Start slow message timer (show after 10 seconds)
        slowMessageTimerRef.current = setTimeout(() => {
            setShowSlowMessage(true);
        }, 10000);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    message: content || 'Please analyze the attached file(s).',
                    context: buildContext(),
                    model: selectedModel,
                    files: fileData,
                    history: messages.slice(-10).map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) throw new Error('Failed to get response');

            // Process streaming response
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let fullContent = '';
            let codeBlockContent = '';
            let insideCodeBlock = false;
            let codeBlockLanguage = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (controller.signal.aborted) {
                    reader.cancel();
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;

                // Check for code block start
                const codeBlockStartMatch = fullContent.match(/```(\w+)?\n/);
                if (codeBlockStartMatch && !insideCodeBlock) {
                    insideCodeBlock = true;
                    codeBlockLanguage = codeBlockStartMatch[1] || 'html';
                    const startIndex = fullContent.indexOf(codeBlockStartMatch[0]) + codeBlockStartMatch[0].length;
                    codeBlockContent = fullContent.slice(startIndex);

                    // Remove closing ``` if present
                    const endIndex = codeBlockContent.indexOf('```');
                    if (endIndex !== -1) {
                        codeBlockContent = codeBlockContent.slice(0, endIndex);
                        insideCodeBlock = false;
                    }

                    // Update the generating artifact with actual code
                    setGeneratingArtifact(prev => prev ? {
                        ...prev,
                        previewCode: codeBlockContent,
                    } : null);
                } else if (insideCodeBlock) {
                    // Extract code block content
                    const startMatch = fullContent.match(/```(\w+)?\n/);
                    if (startMatch) {
                        const startIndex = fullContent.indexOf(startMatch[0]) + startMatch[0].length;
                        codeBlockContent = fullContent.slice(startIndex);

                        // Check for closing
                        const endIndex = codeBlockContent.indexOf('```');
                        if (endIndex !== -1) {
                            codeBlockContent = codeBlockContent.slice(0, endIndex);
                            insideCodeBlock = false;
                        }

                        // Update the generating artifact with actual code
                        setGeneratingArtifact(prev => prev ? {
                            ...prev,
                            previewCode: codeBlockContent,
                        } : null);
                    }
                }

                // Update streaming message (non-code parts)
                let displayContent = fullContent;
                // Remove code blocks from display for cleaner view
                displayContent = displayContent.replace(/```[\s\S]*?```/g, '').replace(/```[\s\S]*/g, '').trim();
                setStreamingMessage(displayContent);
            }

            const rawContent = fullContent || 'I apologize, but I encountered an error. Please try again.';

            // Extract code blocks and create artifacts for them
            const { codeBlocks, processedContent } = extractCodeBlocks(rawContent);
            const codeArtifactIds: string[] = [];

            // Create artifacts for each code block
            for (let i = 0; i < codeBlocks.length; i++) {
                const block = codeBlocks[i];
                const blockType = getArtifactType(block.language);
                const artifactPayload = {
                    name: block.name,
                    type: blockType,
                    content: block.code,
                    language: block.language,
                };
                
                const artifactId = addArtifact(artifactPayload, true); // true = auto-open panel to show preview
                
                // Save to Firestore
                saveArtifact({
                    id: artifactId,
                    ...artifactPayload,
                    createdAt: new Date(),
                }).catch(err => console.error("Failed to save AI code artifact:", err));

                codeArtifactIds.push(artifactId);
            }

            // Combine file artifacts with code artifacts
            const allArtifactIds = [...pendingArtifactIds, ...codeArtifactIds];

            // Clean up the processed content (remove [ARTIFACT_X] placeholders)
            const cleanContent = processedContent.replace(/\[ARTIFACT_\d+\]/g, '').trim();

            // Only save AI message if not aborted
            if (!controller.signal.aborted && currentConvId) {
                await addMessage(currentConvId, {
                    role: 'assistant',
                    content: cleanContent,
                    artifactIds: allArtifactIds.length > 0 ? allArtifactIds : undefined,
                });

                setStreamingMessage('');

                // Send notification if tab is hidden (background processing)
                if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('ElevIQ Analysis Complete!', {
                        body: 'Your analysis is ready to view.',
                        icon: '/favicon.ico',
                    });
                }
            }
        } catch (error) {
            // Handle abort error gracefully
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Request was cancelled');
                setStreamingMessage('');
                // Optionally add a cancelled message
                if (currentConvId) {
                    await addMessage(currentConvId, {
                        role: 'assistant',
                        content: 'Generation stopped.',
                    });
                }
            } else {
                console.error('Chat error:', error);
                setStreamingMessage('');
                const errorMessage = 'Sorry, I encountered an error. Please check your API configuration and try again.';
                if (currentConvId) {
                    await addMessage(currentConvId, {
                        role: 'assistant',
                        content: errorMessage,
                    });
                }
            }
        } finally {
            // Clear timers and refs
            if (slowMessageTimerRef.current) {
                clearTimeout(slowMessageTimerRef.current);
                slowMessageTimerRef.current = null;
            }
            abortControllerRef.current = null;
            setShowSlowMessage(false);
            setGeneratingArtifact(null);
            setIsLoading(false);
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const startNewChat = () => {
        setMessages([]);
        setActiveConversation(null);
    };

    return (
        <div className={`h-full flex overflow-hidden ${actualTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
            {/* Conversation Sidebar — overlay on mobile, side-by-side on desktop */}
            <AnimatePresence mode="wait">
                {sidebarOpen && (
                    <>
                        {/* Mobile backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => {
                                setSidebarOpen(false);
                                expandSidebar();
                            }}
                        />

                        <motion.aside
                            initial={{ x: -220, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -220, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={`
                                w-[220px] h-full flex flex-col overflow-hidden border-r flex-shrink-0
                                fixed lg:relative z-50 lg:z-auto
                                ${actualTheme === 'dark'
                                    ? 'bg-[#111111] border-white/5'
                                    : 'bg-gray-50 border-gray-200'
                                }
                            `}
                        >
                            {/* Header — AI icon + "New chat" with underline */}
                            <div className={`h-14 px-4 flex items-center justify-between border-b flex-shrink-0 ${actualTheme === 'dark' ? 'border-white/5' : 'border-gray-200'
                                }`}>
                                <button
                                    onClick={startNewChat}
                                    className={`flex items-center gap-2.5 text-[13px] font-medium transition-colors ${actualTheme === 'dark'
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>New chat</span>
                                </button>
                                {/* Close button on mobile */}
                                <button
                                    onClick={() => {
                                        setSidebarOpen(false);
                                        expandSidebar();
                                    }}
                                    className={`lg:hidden p-1.5 rounded-lg transition-colors ${actualTheme === 'dark'
                                        ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Conversations List */}
                            <nav className="flex-1 overflow-y-auto px-2.5 py-2">
                                {/* Section Label */}
                                <p className={`px-3 py-1.5 mb-1 text-[11px] font-semibold uppercase tracking-wider ${actualTheme === 'dark' ? 'text-white/30' : 'text-gray-400'
                                    }`}>Recent</p>

                                <ul className="space-y-0.5">
                                    {conversations.map((conv) => {
                                        const active = activeConversation === conv.id;
                                        return (
                                            <li key={conv.id}>
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => {
                                                        setActiveConversation(conv.id);
                                                        // Auto-close on mobile after selecting
                                                        if (window.innerWidth < 1024) {
                                                            setSidebarOpen(false);
                                                            expandSidebar();
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setActiveConversation(conv.id);
                                                            if (window.innerWidth < 1024) {
                                                                setSidebarOpen(false);
                                                                expandSidebar();
                                                            }
                                                        }
                                                    }}
                                                    className={`
                                                        relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-left
                                                        transition-all duration-150 ease-out group cursor-pointer
                                                        ${active
                                                            ? actualTheme === 'dark'
                                                                ? 'bg-blue-500/10 text-blue-400'
                                                                : 'bg-blue-50 text-blue-600'
                                                            : actualTheme === 'dark'
                                                                ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                                        }
                                                    `}
                                                >
                                                    {/* Active indicator bar */}
                                                    {active && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-blue-500 rounded-r-full" />
                                                    )}
                                                    <MessageSquare className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={active ? 2 : 1.75} />
                                                    <span className="truncate flex-1">{conv.title}</span>
                                                    {/* More button on hover */}
                                                    <button
                                                        type="button"
                                                        aria-label="More options"
                                                        className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0 ${actualTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                                            }`}
                                                        onClick={(e) => { e.stopPropagation(); }}
                                                    >
                                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area - Split Screen Container */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat Panel */}
                <div className={`flex flex-col overflow-hidden transition-all duration-300 w-full ${isPanelOpen ? 'lg:w-1/2' : ''
                    }`}>
                    {/* Scrollable area with sticky header inside */}
                    <div className="flex-1 overflow-y-auto pb-36 lg:pb-0">
                        {/* Header - Sticky at top */}
                        <header className={`sticky top-0 z-10 h-14 flex items-center px-4 border-b backdrop-blur-xl ${actualTheme === 'dark'
                            ? 'border-white/5 bg-[#171717]/90'
                            : 'border-gray-200 bg-white/90'
                            }`}>
                            <button
                                onClick={() => {
                                    const newState = !sidebarOpen;
                                    setSidebarOpen(newState);
                                    if (newState) {
                                        collapseSidebar(); // Close main sidebar when opening chat sidebar
                                    } else {
                                        expandSidebar(); // Open main sidebar when closing chat sidebar
                                    }
                                }}
                                className={`p-2 -ml-2 mr-2 rounded-lg transition-colors ${actualTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                                    }`}
                            >
                                {sidebarOpen
                                    ? <ChevronLeft className={`w-5 h-5 ${actualTheme === 'dark' ? 'text-white/60' : 'text-gray-500'}`} />
                                    : <ChevronRight className={`w-5 h-5 ${actualTheme === 'dark' ? 'text-white/60' : 'text-gray-500'}`} />}
                            </button>

                            <div className={`flex items-center gap-2 text-sm ${actualTheme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span>/</span>
                                <span className={actualTheme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                    {activeConversation
                                        ? conversations.find(c => c.id === activeConversation)?.title || 'Conversation'
                                        : 'New conversation'}
                                </span>
                            </div>

                            {/* Close button — mobile only, navigates to dashboard */}
                            <button
                                onClick={() => router.push('/dashboard')}
                                className={`lg:hidden ml-auto p-2 rounded-lg transition-colors ${actualTheme === 'dark'
                                    ? 'text-white/50 hover:text-white hover:bg-white/10'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        {/* Messages content */}
                        <div className="max-w-3xl mx-auto px-4 py-8">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-6">
                                        <Sparkles className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        How can I help you today?
                                    </h2>
                                    <p className="text-white/50 max-w-md mb-8">
                                        I&apos;m your AI financial advisor. Ask me about spending analysis, budgets, savings tips, and more.
                                    </p>

                                    {/* Suggested Prompts */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
                                        {suggestedPrompts.map((prompt, idx) => {
                                            const Icon = prompt.icon;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => sendMessage(prompt.text)}
                                                    className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left group ${actualTheme === 'dark'
                                                        ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                                                        : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm'
                                                        }`}
                                                >
                                                    <Icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                                    <span className={`text-sm ${actualTheme === 'dark'
                                                        ? 'text-white/80 group-hover:text-white'
                                                        : 'text-gray-600 group-hover:text-gray-900'
                                                        }`}>{prompt.text}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages.map((message) => (
                                        <div key={message.id} className="group">
                                            {message.role === 'user' ? (
                                                // User message - Right aligned, clean bubble
                                                <div className="flex justify-end">
                                                    <div className="max-w-[80%] space-y-2">
                                                        {/* Show attached files if any */}
                                                        {message.files && message.files.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 justify-end">
                                                                {message.files.map((file, idx) => {
                                                                    const isImage = file.type.startsWith('image/');
                                                                    const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-xl"
                                                                        >
                                                                            {isImage ? (
                                                                                <div className="w-10 h-10 rounded-lg overflow-hidden">
                                                                                    <img
                                                                                        src={file.preview}
                                                                                        alt={file.name}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                                                                    <FileText className="w-5 h-5 text-white/60" />
                                                                                </div>
                                                                            )}
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm text-white/90 truncate max-w-[100px]">{file.name}</span>
                                                                                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/60 rounded w-fit">
                                                                                    {extension}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        {/* User message content */}
                                                        <div className={`rounded-2xl rounded-br-md px-4 py-3 ${actualTheme === 'dark'
                                                            ? 'bg-[#3a3a3a]'
                                                            : 'bg-purple-100'
                                                            }`}>
                                                            <p className={`whitespace-pre-wrap ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                                                                }`}>{message.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // AI message - Left aligned, clean, no icons
                                                <div className="flex justify-start">
                                                    <div className="max-w-[90%] space-y-3">
                                                        {/* AI message text content first */}
                                                        <MarkdownRenderer content={message.content} />
                                                        {/* Show artifact cards BELOW the text */}
                                                        {message.artifactIds && message.artifactIds.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                {message.artifactIds.map((artifactId) => (
                                                                    <ArtifactCard key={artifactId} artifactId={artifactId} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {/* Show streaming message or loading indicator */}
                                    {(isLoading || streamingMessage) && (
                                        <div className="flex justify-start">
                                            <div className="max-w-[90%] space-y-3">
                                                {streamingMessage ? (
                                                    <MarkdownRenderer content={streamingMessage} />
                                                ) : (
                                                    <div className="flex items-center gap-2 text-white/50 py-3">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span className="text-sm">Thinking...</span>
                                                    </div>
                                                )}

                                                {/* Claude-like generating artifact card */}
                                                {generatingArtifact && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`w-[320px] rounded-xl border overflow-hidden ${actualTheme === 'dark'
                                                            ? 'bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border-purple-500/30'
                                                            : 'bg-gradient-to-br from-white to-gray-50 border-purple-300 shadow-lg'
                                                            }`}
                                                    >
                                                        {/* Header */}
                                                        <div className={`flex items-center justify-between px-4 py-3 border-b ${actualTheme === 'dark'
                                                            ? 'border-white/10 bg-white/5'
                                                            : 'border-gray-200 bg-gray-50'
                                                            }`}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                                    <FileText className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                                        {generatingArtifact.name}
                                                                    </p>
                                                                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                                                                        Markdown Report
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                                        </div>

                                                        {/* Code preview area - shows actual streaming code */}
                                                        <div className={`px-4 py-3 h-[180px] overflow-hidden relative font-mono text-xs ${actualTheme === 'dark' ? 'bg-[#0d0d0d]' : 'bg-gray-900'}`}>
                                                            {generatingArtifact.previewCode ? (
                                                                <pre className="text-green-400 overflow-hidden whitespace-pre-wrap break-all leading-relaxed">
                                                                    {generatingArtifact.previewCode.slice(-800)}
                                                                    <motion.span
                                                                        animate={{ opacity: [1, 0] }}
                                                                        transition={{ duration: 0.5, repeat: Infinity }}
                                                                        className="inline-block w-2 h-4 bg-green-400 ml-0.5"
                                                                    />
                                                                </pre>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {[...Array(6)].map((_, i) => (
                                                                        <motion.div
                                                                            key={i}
                                                                            initial={{ width: '0%', opacity: 0 }}
                                                                            animate={{
                                                                                width: `${40 + Math.random() * 55}%`,
                                                                                opacity: 1
                                                                            }}
                                                                            transition={{
                                                                                delay: i * 0.15,
                                                                                duration: 0.5,
                                                                                repeat: Infinity,
                                                                                repeatDelay: 2
                                                                            }}
                                                                            className="h-2 rounded bg-gradient-to-r from-green-500/30 to-emerald-500/20"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Gradient fade at bottom */}
                                                            <div className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t ${actualTheme === 'dark' ? 'from-[#0d0d0d]' : 'from-gray-900'} to-transparent`} />
                                                        </div>

                                                        {/* Footer */}
                                                        <div className={`px-4 py-2 flex items-center gap-2 border-t ${actualTheme === 'dark'
                                                            ? 'border-white/10 bg-purple-500/10'
                                                            : 'border-gray-200 bg-purple-50'
                                                            }`}>
                                                            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                                                            <span className={`text-xs ${actualTheme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                                                                Creating your analysis...
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Area - Floating at bottom */}
                    <div className={`
                        fixed bottom-0 left-0 right-0 z-[55] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]
                        lg:relative lg:flex-shrink-0 lg:p-4 lg:pt-2 lg:pb-4 lg:z-auto
                    `}>
                        <div className="max-w-3xl mx-auto">
                            <form onSubmit={handleSubmit} className="relative">
                                <div
                                    className={`relative rounded-2xl lg:rounded-[28px] transition-all duration-200 ${actualTheme === 'dark'
                                        ? 'bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] shadow-[0_-4px_30px_rgba(0,0,0,0.3)]'
                                        : 'bg-white/70 backdrop-blur-xl border border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
                                        } ${isDragging ? actualTheme === 'dark'
                                            ? 'ring-2 ring-purple-500 bg-purple-500/10'
                                            : 'ring-2 ring-purple-500 bg-purple-50'
                                            : ''}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsDragging(true);
                                    }}
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Only set to false if we're leaving the main container
                                        if (e.currentTarget === e.target) {
                                            setIsDragging(false);
                                        }
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsDragging(false);

                                        const droppedFiles = Array.from(e.dataTransfer.files);
                                        const maxFiles = 4;
                                        const maxSizeBytes = 10 * 1024 * 1024; // 10MB

                                        // Check total file count
                                        if (attachedFiles.length + droppedFiles.length > maxFiles) {
                                            alert(`Maximum ${maxFiles} files allowed. You already have ${attachedFiles.length} file(s).`);
                                            return;
                                        }

                                        // Check file sizes
                                        const oversizedFiles = droppedFiles.filter(f => f.size > maxSizeBytes);
                                        if (oversizedFiles.length > 0) {
                                            alert(`Some files exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
                                            return;
                                        }

                                        // Add files to state
                                        setAttachedFiles(prev => [...prev, ...droppedFiles]);
                                    }}
                                >
                                    {/* Drag overlay indicator */}
                                    {isDragging && (
                                        <div className={`absolute inset-0 rounded-[28px] flex items-center justify-center z-10 pointer-events-none ${actualTheme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100/80'}`}>
                                            <div className={`flex flex-col items-center gap-2 ${actualTheme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                                                <Upload className="w-8 h-8" />
                                                <span className="text-sm font-medium">Drop files here</span>
                                            </div>
                                        </div>
                                    )}
                                    {/* Attached Files Preview - Claude Style */}
                                    {attachedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 px-4 pt-4 pb-0">
                                            {attachedFiles.map((file, idx) => {
                                                const isImage = file.type.startsWith('image/');
                                                const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`group relative flex items-center gap-2 px-3 py-2 border rounded-xl transition-colors ${actualTheme === 'dark'
                                                            ? 'bg-[#2a2a2a] border-white/10 hover:border-white/20'
                                                            : 'bg-gray-100 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {isImage ? (
                                                            // Image thumbnail preview
                                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={file.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            // File icon placeholder for non-images
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${actualTheme === 'dark' ? 'bg-white/5' : 'bg-gray-200'
                                                                }`}>
                                                                <FileText className={`w-5 h-5 ${actualTheme === 'dark' ? 'text-white/60' : 'text-gray-500'}`} />
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col min-w-0 max-w-[120px]">
                                                            <span className={`text-sm truncate ${actualTheme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>{file.name}</span>
                                                            <span className={`inline-flex w-fit px-1.5 py-0.5 text-[10px] font-medium rounded ${actualTheme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-500'
                                                                }`}>
                                                                {extension}
                                                            </span>
                                                        </div>

                                                        {/* Remove button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                            className={`absolute -top-1.5 -right-1.5 w-5 h-5 border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:border-red-500 transition-all ${actualTheme === 'dark' ? 'bg-[#2a2a2a] border-white/20' : 'bg-white border-gray-300'
                                                                }`}
                                                        >
                                                            <X className={`w-3 h-3 ${actualTheme === 'dark' ? 'text-white' : 'text-gray-500'}`} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Textarea */}
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask me anything about your finances..."
                                        rows={1}
                                        className={`w-full px-5 pt-5 pb-16 !bg-transparent focus:outline-none resize-none max-h-48 text-base ${actualTheme === 'dark'
                                            ? 'text-white placeholder:text-white/50'
                                            : 'text-gray-900 placeholder:text-gray-400'
                                            }`}
                                        disabled={isLoading}
                                    />

                                    {/* Bottom toolbar */}
                                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5">
                                        {/* Left side - attachment buttons */}
                                        <div className="flex items-center gap-1">
                                            {/* + Button with popup menu */}
                                            <div className="relative" ref={attachMenuRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                                                    className={`p-2 rounded-lg transition-colors ${actualTheme === 'dark'
                                                        ? 'text-white/60 hover:text-white hover:bg-white/10'
                                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>

                                                {/* Attachment Menu Popup */}
                                                <AnimatePresence>
                                                    {attachMenuOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                            className={`absolute bottom-full left-0 mb-2 w-56 rounded-xl shadow-2xl overflow-hidden z-50 border ${actualTheme === 'dark'
                                                                ? 'bg-[#2a2a2a] border-white/10'
                                                                : 'bg-white border-gray-200'
                                                                }`}
                                                        >
                                                            <div className="py-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        fileInputRef.current?.click();
                                                                        setAttachMenuOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${actualTheme === 'dark'
                                                                        ? 'text-white/80 hover:bg-white/5'
                                                                        : 'text-gray-700 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <Paperclip className={`w-4 h-4 ${actualTheme === 'dark' ? 'text-white/60' : 'text-gray-400'}`} />
                                                                    <span className="text-sm">Add files or photos</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${actualTheme === 'dark'
                                                                        ? 'text-white/80 hover:bg-white/5'
                                                                        : 'text-gray-700 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <FolderPlus className={`w-4 h-4 ${actualTheme === 'dark' ? 'text-white/60' : 'text-gray-400'}`} />
                                                                        <span className="text-sm">Add to project</span>
                                                                    </div>
                                                                    <ChevronRight className={`w-4 h-4 ${actualTheme === 'dark' ? 'text-white/40' : 'text-gray-300'}`} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setWebSearchEnabled(!webSearchEnabled);
                                                                        setAttachMenuOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${actualTheme === 'dark'
                                                                        ? 'text-white/80 hover:bg-white/5'
                                                                        : 'text-gray-700 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Globe className="w-4 h-4 text-blue-400" />
                                                                        <span className="text-sm text-blue-400">Web search</span>
                                                                    </div>
                                                                    {webSearchEnabled && <Check className="w-4 h-4 text-blue-400" />}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${actualTheme === 'dark'
                                                                        ? 'text-white/80 hover:bg-white/5'
                                                                        : 'text-gray-700 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Wand2 className={`w-4 h-4 ${actualTheme === 'dark' ? 'text-white/60' : 'text-gray-400'}`} />
                                                                        <span className="text-sm">Use style</span>
                                                                    </div>
                                                                    <ChevronRight className={`w-4 h-4 ${actualTheme === 'dark' ? 'text-white/40' : 'text-gray-300'}`} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${actualTheme === 'dark'
                                                                        ? 'text-white/80 hover:bg-white/5'
                                                                        : 'text-gray-700 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Blocks className={`w-4 h-4 ${actualTheme === 'dark' ? 'text-white/60' : 'text-gray-400'}`} />
                                                                        <span className="text-sm">Connectors</span>
                                                                    </div>
                                                                    <ChevronRight className={`w-4 h-4 ${actualTheme === 'dark' ? 'text-white/40' : 'text-gray-300'}`} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* File/Image button */}
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`p-2 rounded-lg transition-colors ${actualTheme === 'dark'
                                                    ? 'text-white/60 hover:text-white hover:bg-white/10'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <Paperclip className="w-5 h-5" />
                                            </button>

                                            {/* Hidden file input */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files) {
                                                        const newFiles = Array.from(e.target.files);
                                                        const maxFiles = 4;
                                                        const maxSizeBytes = 10 * 1024 * 1024; // 10MB

                                                        // Check total file count
                                                        if (attachedFiles.length + newFiles.length > maxFiles) {
                                                            alert(`Maximum ${maxFiles} files allowed. You already have ${attachedFiles.length} file(s).`);
                                                            e.target.value = '';
                                                            return;
                                                        }

                                                        // Check file sizes
                                                        const oversizedFiles = newFiles.filter(f => f.size > maxSizeBytes);
                                                        if (oversizedFiles.length > 0) {
                                                            alert(`Some files exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
                                                            e.target.value = '';
                                                            return;
                                                        }

                                                        // Add files to state (artifacts are created when sending)
                                                        setAttachedFiles(prev => [...prev, ...newFiles]);
                                                        e.target.value = ''; // Reset input
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Right side - model selector & send */}
                                        <div className="flex items-center gap-2">
                                            {/* Model Selector */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setModelMenuOpen(!modelMenuOpen)}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${actualTheme === 'dark'
                                                        ? 'text-white/60 hover:text-white hover:bg-white/10'
                                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <span>{aiModels.find(m => m.id === selectedModel)?.name || 'Gemini'}</span>
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>

                                                {/* Model Menu Popup */}
                                                <AnimatePresence>
                                                    {modelMenuOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                            className={`absolute bottom-full right-0 mb-2 w-52 rounded-xl shadow-2xl overflow-hidden z-50 border ${actualTheme === 'dark'
                                                                ? 'bg-[#2a2a2a] border-white/10'
                                                                : 'bg-white border-gray-200'
                                                                }`}
                                                        >
                                                            <div className="py-1">
                                                                {aiModels.map((model) => (
                                                                    <button
                                                                        key={model.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedModel(model.id);
                                                                            setModelMenuOpen(false);
                                                                        }}
                                                                        className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${actualTheme === 'dark'
                                                                            ? `hover:bg-white/5 ${selectedModel === model.id ? 'text-white' : 'text-white/70'}`
                                                                            : `hover:bg-gray-50 ${selectedModel === model.id ? 'text-gray-900' : 'text-gray-600'}`
                                                                            }`}
                                                                    >
                                                                        <div>
                                                                            <p className="text-sm font-medium text-left">{model.name}</p>
                                                                            <p className={`text-xs text-left ${actualTheme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>{model.description}</p>
                                                                        </div>
                                                                        {selectedModel === model.id && <Check className="w-4 h-4 text-purple-500" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Send/Stop button */}
                                            {isLoading ? (
                                                <button
                                                    type="button"
                                                    onClick={handleStop}
                                                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                                    title="Stop generation"
                                                >
                                                    <Square className="w-4 h-4 text-white fill-white" />
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    disabled={(!input.trim() && attachedFiles.length === 0)}
                                                    className={`p-2 bg-orange-500 hover:bg-orange-600 disabled:cursor-not-allowed rounded-lg transition-colors ${actualTheme === 'dark'
                                                        ? 'disabled:bg-white/10'
                                                        : 'disabled:bg-gray-200'
                                                        }`}
                                                >
                                                    <Send className={`w-4 h-4 ${(input.trim() || attachedFiles.length > 0) ? 'text-white' : actualTheme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Slow processing message */}
                            {isLoading && showSlowMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-center justify-center gap-2 mt-3 text-sm ${actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}
                                >
                                    <Coffee className="w-4 h-4" />
                                    <span>Taking longer than usual... Sit back and relax! ☕</span>
                                </motion.div>
                            )}

                            <p className={`text-center text-xs mt-3 ${actualTheme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                                ElevIQ AI can make mistakes. Please verify important financial advice.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Artifacts Panel - Desktop: Right Side */}
                {isPanelOpen && (
                    <div className="hidden lg:block w-1/2 border-l border-white/10">
                        <ArtifactsPanel />
                    </div>
                )}
            </div>

            {/* Artifacts Panel - Mobile: Full-screen bottom sheet */}
            {isPanelOpen && (
                <div className="lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] animate-fade-in"
                        onClick={closePanel}
                    />
                    {/* Sheet */}
                    <div className="fixed bottom-0 left-0 right-0 z-[81] animate-slide-up">
                        <div className={`rounded-t-2xl overflow-hidden flex flex-col h-[92vh] ${actualTheme === 'dark'
                            ? 'bg-[#0f0f0f]'
                            : 'bg-white'
                            }`}>
                            {/* Drag handle + close */}
                            <div className="flex items-center justify-between px-4 pt-3 pb-1">
                                <div className="w-8" />
                                <div className={`w-10 h-1 rounded-full ${actualTheme === 'dark' ? 'bg-white/20' : 'bg-gray-300'}`} />
                                <button
                                    onClick={closePanel}
                                    className={`p-1.5 rounded-lg transition-colors ${actualTheme === 'dark'
                                        ? 'text-white/50 hover:text-white hover:bg-white/10'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Panel content */}
                            <div className="flex-1 overflow-hidden">
                                <ArtifactsPanel compact />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
