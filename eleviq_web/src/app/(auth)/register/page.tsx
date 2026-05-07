'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SocialButton } from '@/components/ui/social-button';
import { Divider } from '@/components/ui/divider';
import { EmailDisplay } from '@/components/ui/email-display';
import { AuthService } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/contexts/theme-context';
import { useSnackbar } from '../_components';
import {
    checkProviderConflict,
    createUserDocument,
    getUserByEmail,
    updateLastLogin
} from '../_hooks';

// Step 1: Email only
const emailSchema = z.object({
    email: z.string().email('Please enter a valid email'),
});

// Step 2: Name and Password
const detailsSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type DetailsFormData = z.infer<typeof detailsSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { actualTheme } = useTheme();
    const { showSnackbar } = useSnackbar();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setUser } = useAuthStore();

    // Step 1 form
    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
    });

    // Step 2 form
    const detailsForm = useForm<DetailsFormData>({
        resolver: zodResolver(detailsSchema),
    });

    const handleEmailSubmit = async (data: EmailFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            // Check for provider conflicts
            const conflict = await checkProviderConflict(data.email, 'email');

            if (conflict.type === 'google_exists') {
                // User signed up with Google, redirect to set password
                showSnackbar('info', conflict.message);
                setTimeout(() => {
                    router.push(`/set-password?email=${encodeURIComponent(data.email)}`);
                }, 1500);
                return;
            }

            if (conflict.type === 'email_exists') {
                // User already has email account, redirect to login
                showSnackbar('info', 'Account already exists. Please login.');
                setTimeout(() => {
                    router.push(`/login?email=${encodeURIComponent(data.email)}`);
                }, 1500);
                return;
            }

            // No conflict - proceed to step 2
            setEmail(data.email);
            setStep(2);
        } catch (err) {
            console.error('Email check error:', err);
            // If Firestore check fails, still allow to proceed
            setEmail(data.email);
            setStep(2);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDetailsSubmit = async (data: DetailsFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            // Create Firebase Auth user
            const credential = await AuthService.signUpWithEmail(
                email,
                data.password,
                data.name
            );

            // Create Firestore user document
            await createUserDocument(
                credential.user.uid,
                email,
                data.name,
                'email'
            );

            setUser(credential.user);
            showSnackbar('success', 'Account created successfully!');

            setTimeout(() => {
                router.push('/onboarding');
            }, 1000);
        } catch (err: any) {
            setError(AuthService.getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const credential = await AuthService.signInWithGoogle();
            const userEmail = credential.user.email!;

            // Check if user already exists
            const existingUser = await getUserByEmail(userEmail);

            if (existingUser) {
                // User already exists
                if (existingUser.primaryProvider === 'email') {
                    // Email user trying Google - just let them in (linking happens automatically)
                    showSnackbar('success', 'Already signed up! Redirecting...');
                    setUser(credential.user);
                    await updateLastLogin(existingUser.userId);
                    setTimeout(() => router.push('/dashboard'), 1000);
                } else {
                    // Google user returning
                    showSnackbar('success', 'Welcome back!');
                    setUser(credential.user);
                    await updateLastLogin(existingUser.userId);
                    setTimeout(() => router.push('/dashboard'), 1000);
                }
            } else {
                // New user - create document
                await createUserDocument(
                    credential.user.uid,
                    userEmail,
                    credential.user.displayName || 'User',
                    'google',
                    credential.user.photoURL || undefined
                );

                setUser(credential.user);
                showSnackbar('success', 'Account created successfully!');
                setTimeout(() => router.push('/onboarding'), 1000);
            }
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(AuthService.getErrorMessage(err));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeEmail = () => {
        setStep(1);
        setError(null);
        detailsForm.reset();
    };

    const isDark = actualTheme === 'dark';

    return (
        <div>
            {/* Title */}
            <h1 className={`text-2xl lg:text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {step === 1 ? 'Create a ELEVIQ account' : 'Complete your account'}
            </h1>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {step === 1
                    ? 'One last step before getting started.'
                    : 'Enter your details to continue.'}
            </p>

            {/* Error Message */}
            {error && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${isDark
                        ? 'bg-red-900/30 border border-red-500/30 text-red-400'
                        : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                    {error}
                </div>
            )}

            {step === 1 ? (
                // Step 1: Email Entry
                <>
                    <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Email address
                            </label>
                            <Input
                                {...emailForm.register('email')}
                                type="email"
                                placeholder="Enter your email"
                                className="h-12"
                                error={emailForm.formState.errors.email?.message}
                            />
                        </div>

                        <Button
                            type="submit"
                            className={`w-full h-12 ${isDark
                                    ? 'bg-white hover:bg-gray-200 text-black'
                                    : 'bg-black hover:bg-gray-800 text-white'
                                }`}
                            isLoading={isLoading}
                        >
                            Continue with email
                        </Button>
                    </form>

                    <Divider />

                    {/* Social Buttons - Full width with text */}
                    <div className="space-y-3">
                        <SocialButton
                            provider="google"
                            variant="full"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            Sign up with Google
                        </SocialButton>
                    </div>

                    {/* Login link */}
                    <p className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Already have a ELEVIQ account?{' '}
                        <Link
                            href="/login"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Log in →
                        </Link>
                    </p>
                </>
            ) : (
                // Step 2: Name and Password
                <>
                    <EmailDisplay email={email} onChangeEmail={handleChangeEmail} />

                    <form
                        onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)}
                        className="mt-6 space-y-4"
                    >
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Full name
                            </label>
                            <Input
                                {...detailsForm.register('name')}
                                type="text"
                                placeholder="Enter your full name"
                                className="h-12"
                                error={detailsForm.formState.errors.name?.message}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    {...detailsForm.register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a password"
                                    className="h-12 pr-12"
                                    error={detailsForm.formState.errors.password?.message}
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

                        <Button
                            type="submit"
                            className={`w-full h-12 ${isDark
                                    ? 'bg-white hover:bg-gray-200 text-black'
                                    : 'bg-black hover:bg-gray-800 text-white'
                                }`}
                            isLoading={isLoading}
                        >
                            Create account
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}
