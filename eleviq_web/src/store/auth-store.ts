import { create } from 'zustand';
import { User, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';

export type UserType = 'student' | 'professional' | null;

interface AuthState {
    user: User | null;
    userType: UserType;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    setUser: (user: User | null) => void;
    setUserType: (type: UserType) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    reset: () => void;
}

// ⚠️ We MUST NOT USE PERSIST here for security, authentication 
// relies strictly on Firebase SDK and our HttpOnly cookies.
export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    userType: null, // Note: userType should ideally move to Firestore `users` collection too, not state
    isLoading: true,
    isAuthenticated: false,
    error: null,
    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        }),
    setUserType: (userType) => set({ userType }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    reset: () =>
        set({
            user: null,
            userType: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
        }),
}));

// Initialize auth state listener only on client side
if (typeof window !== 'undefined' && auth) {
    onAuthStateChanged(auth, (user) => {
        useAuthStore.getState().setUser(user);
    });

    // Listen for token changes to sync with our HttpOnly cookie session
    onIdTokenChanged(auth, async (user) => {
        if (user) {
            const idToken = await user.getIdToken();
            // Exchange for HttpOnly session cookie
            await fetch('/api/v1/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
        } else {
            // User signed out, destroy HttpOnly session cookie
            await fetch('/api/v1/auth/session', { method: 'DELETE' });
        }
    });
} else if (typeof window !== 'undefined') {
    useAuthStore.getState().setLoading(false);
}
