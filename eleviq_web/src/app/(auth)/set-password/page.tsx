'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailDisplay } from '@/components/ui/email-display';
import { useTheme } from '@/contexts/theme-context';
import { useSnackbar } from '../_components';
import { getUserByEmail, addProviderToUser } from '../_hooks';
import {
    EmailAuthProvider,
    linkWithCredential,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/auth-store';

const passwordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

function SetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { actualTheme } = useTheme();
    const { showSnackbar } = useSnackbar();
    const { user, setUser } = useAuthStore();

    const email = searchParams.get('email') || user?.email || '';
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    const handleSubmit = async (data: PasswordFormData) => {
        if (!auth || !user) {
            setError('Please sign in with Google first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create email credential
            const credential = EmailAuthProvider.credential(email, data.password);

            // Link the credential to current user
            await linkWithCredential(user, credential);

            // Update Firestore user document
            const userDoc = await getUserByEmail(email);
            if (userDoc) {
                await addProviderToUser(userDoc.userId, 'email');
            }

            setSuccess(true);
            showSnackbar('success', 'Password set successfully!');

            // Redirect after a short delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (err: any) {
            console.error('Set password error:', err);
            if (err.code === 'auth/requires-recent-login') {
                setError('Please sign out and sign back in with Google, then try again.');
            } else if (err.code === 'auth/provider-already-linked') {
                setError('You already have a password set for this account.');
            } else {
                setError(err.message || 'Failed to set password');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/dashboard');
    };

    const isDark = actualTheme === 'dark';

    if (success) {
        return (
            <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${isDark ? 'bg-green-900/30' : 'bg-green-100'
                    }`}>
                    <CheckCircle className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h1 className={`text-2xl lg:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Password Set!
                </h1>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    You can now login with both Google and email/password.
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Redirecting to dashboard...
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Title */}
            <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                    }`}>
                    <Lock className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h1 className={`text-2xl lg:text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Set your password
                </h1>
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    Add email/password login to your Google account
                </p>
            </div>

            {/* Email Display */}
            {email && (
                <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                    }`}>
                    <Lock className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{email}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${isDark
                        ? 'bg-red-900/30 border border-red-500/30 text-red-400'
                        : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                    {error}
                </div>
            )}

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* New Password */}
                <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        New Password
                    </label>
                    <div className="relative">
                        <Input
                            {...form.register('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            className="h-12 pr-12"
                            error={form.formState.errors.password?.message}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Input
                            {...form.register('confirmPassword')}
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            className="h-12 pr-12"
                            error={form.formState.errors.confirmPassword?.message}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <Button
                    type="submit"
                    className={`w-full h-12 ${isDark
                            ? 'bg-white hover:bg-gray-200 text-black'
                            : 'bg-black hover:bg-gray-800 text-white'
                        }`}
                    isLoading={isLoading}
                >
                    Set password
                </Button>
            </form>

            {/* Skip option */}
            <button
                onClick={handleSkip}
                className={`w-full mt-4 text-center text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Skip for now →
            </button>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
            <SetPasswordContent />
        </Suspense>
    );
}
