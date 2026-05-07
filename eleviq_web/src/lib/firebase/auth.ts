'use client';

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    updateProfile,
    UserCredential,
    browserPopupRedirectResolver,
} from 'firebase/auth';
import { auth } from './config';

// Configure Google provider with custom parameters
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export class AuthService {
    /**
     * Sign up with email and password
     */
    static async signUpWithEmail(
        email: string,
        password: string,
        displayName?: string
    ): Promise<UserCredential> {
        if (!auth) {
            throw new Error('Firebase Auth is not initialized');
        }

        try {
            const credential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            if (displayName && credential.user) {
                await updateProfile(credential.user, { displayName });
            }

            console.log('✅ User signed up:', credential.user.email);
            return credential;
        } catch (error: any) {
            console.error('❌ Sign up error:', error.message);
            throw error;
        }
    }

    /**
     * Sign in with email and password
     */
    static async signInWithEmail(
        email: string,
        password: string
    ): Promise<UserCredential> {
        if (!auth) {
            throw new Error('Firebase Auth is not initialized');
        }

        try {
            const credential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            console.log('✅ User signed in:', credential.user.email);
            return credential;
        } catch (error: any) {
            console.error('❌ Sign in error:', error.message);
            throw error;
        }
    }

    /**
     * Sign in with Google
     */
    static async signInWithGoogle(): Promise<UserCredential> {
        if (!auth) {
            throw new Error('Firebase Auth is not initialized');
        }

        try {
            // Use browserPopupRedirectResolver for better cross-origin support
            const credential = await signInWithPopup(
                auth,
                googleProvider,
                browserPopupRedirectResolver
            );
            console.log('✅ Google sign in:', credential.user.email);
            return credential;
        } catch (error: any) {
            console.error('❌ Google sign in error:', error.message);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    static async sendPasswordResetEmail(email: string): Promise<void> {
        if (!auth) {
            throw new Error('Firebase Auth is not initialized');
        }

        try {
            await firebaseSendPasswordResetEmail(auth, email);
            console.log('✅ Password reset email sent to:', email);
        } catch (error: any) {
            console.error('❌ Password reset error:', error.message);
            throw error;
        }
    }

    /**
     * Sign out
     */
    static async signOut(): Promise<void> {
        if (!auth) {
            throw new Error('Firebase Auth is not initialized');
        }

        try {
            await signOut(auth);
            console.log('✅ User signed out');
        } catch (error: any) {
            console.error('❌ Sign out error:', error.message);
            throw error;
        }
    }

    /**
     * Get friendly error message
     */
    static getErrorMessage(error: any): string {
        const errorString = error?.message || error?.toString() || '';

        if (errorString.includes('not initialized')) {
            return 'Firebase is not configured. Please add your Firebase credentials.';
        }

        const code = error?.code || '';

        switch (code) {
            case 'auth/email-already-in-use':
                return 'An account already exists with this email';
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/invalid-credential':
                return 'Invalid email or password';
            case 'auth/weak-password':
                return 'Password is too weak';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later';
            case 'auth/popup-closed-by-user':
                return 'Sign in was cancelled';
            case 'auth/popup-blocked':
                return 'Pop-up was blocked. Please allow pop-ups for this site';
            case 'auth/operation-not-allowed':
                return 'This sign-in method is not enabled';
            default:
                return error?.message || 'An error occurred. Please try again';
        }
    }
}
