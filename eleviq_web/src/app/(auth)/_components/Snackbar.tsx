'use client';

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X, Loader2 } from 'lucide-react';

// Snackbar types
type SnackbarType = 'success' | 'error' | 'info' | 'loading';

interface SnackbarMessage {
    id: string;
    type: SnackbarType;
    message: string;
    duration?: number;
}

interface SnackbarContextType {
    showSnackbar: (type: SnackbarType, message: string, duration?: number) => void;
    hideSnackbar: (id: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export function useSnackbar() {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
}

// Snackbar Provider
export function SnackbarProvider({ children }: { children: ReactNode }) {
    const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

    const showSnackbar = useCallback((type: SnackbarType, message: string, duration = 4000) => {
        const id = Date.now().toString();
        setSnackbars((prev) => [...prev, { id, type, message, duration }]);

        if (type !== 'loading' && duration > 0) {
            setTimeout(() => {
                setSnackbars((prev) => prev.filter((s) => s.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const hideSnackbar = useCallback((id: string) => {
        setSnackbars((prev) => prev.filter((s) => s.id !== id));
    }, []);

    return (
        <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
            {children}
            {/* Snackbar Container - Top Right */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {snackbars.map((snackbar) => (
                    <SnackbarItem
                        key={snackbar.id}
                        snackbar={snackbar}
                        onClose={() => hideSnackbar(snackbar.id)}
                    />
                ))}
            </div>
        </SnackbarContext.Provider>
    );
}

// Individual Snackbar Item
function SnackbarItem({
    snackbar,
    onClose
}: {
    snackbar: SnackbarMessage;
    onClose: () => void;
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const getStyles = () => {
        switch (snackbar.type) {
            case 'success':
                return {
                    bg: 'bg-green-600',
                    icon: <CheckCircle className="w-5 h-5" />,
                };
            case 'error':
                return {
                    bg: 'bg-red-600',
                    icon: <AlertCircle className="w-5 h-5" />,
                };
            case 'info':
                return {
                    bg: 'bg-blue-600',
                    icon: <Info className="w-5 h-5" />,
                };
            case 'loading':
                return {
                    bg: 'bg-gray-800',
                    icon: <Loader2 className="w-5 h-5 animate-spin" />,
                };
        }
    };

    const styles = getStyles();

    return (
        <div
            className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl
                text-white font-medium text-sm min-w-[280px] max-w-[400px]
                transform transition-all duration-300 ease-out
                ${styles.bg}
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            {styles.icon}
            <span className="flex-1">{snackbar.message}</span>
            {snackbar.type !== 'loading' && (
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

export default SnackbarProvider;
