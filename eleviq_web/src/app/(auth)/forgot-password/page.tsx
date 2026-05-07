'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailDisplay } from '@/components/ui/email-display';
import { AuthService } from '@/lib/firebase/auth';

const emailSchema = z.object({
    email: z.string().email('Please enter a valid email'),
});

type EmailFormData = z.infer<typeof emailSchema>;

function ForgotPasswordContent() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const form = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            email: '',
        },
    });

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
            form.setValue('email', emailParam);
        }
    }, [searchParams, form]);

    const handleSubmit = async (data: EmailFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await AuthService.sendPasswordResetEmail(data.email);
            setEmail(data.email);
            setEmailSent(true);
        } catch (err: any) {
            setError(AuthService.getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendWithEmail = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await AuthService.sendPasswordResetEmail(email);
            setEmailSent(true);
        } catch (err: any) {
            setError(AuthService.getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeEmail = () => {
        setEmail('');
        setEmailSent(false);
        setError(null);
    };

    if (emailSent) {
        return (
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Check your email
                </h1>
                <p className="text-gray-500 mb-6">
                    We&apos;ve sent password reset instructions to{' '}
                    <span className="font-medium text-gray-700">{email}</span>
                </p>

                <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                >
                    ← Back to login
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                Forgot your password?
            </h1>
            <p className="text-gray-500 mb-6">
                {email
                    ? `We'll email instructions to ${email} on how to reset it`
                    : "Enter your email and we'll send you reset instructions"}
            </p>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {email ? (
                <>
                    <EmailDisplay email={email} onChangeEmail={handleChangeEmail} />
                    <Button
                        onClick={handleSendWithEmail}
                        className="w-full h-12 mt-6 bg-black hover:bg-gray-800 text-white"
                        isLoading={isLoading}
                    >
                        Email password reset
                    </Button>
                </>
            ) : (
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <Input
                            {...form.register('email')}
                            type="email"
                            placeholder="Enter your email"
                            className="h-12"
                            error={form.formState.errors.email?.message}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-black hover:bg-gray-800 text-white"
                        isLoading={isLoading}
                    >
                        Email password reset
                    </Button>
                </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                >
                    Log in
                </Link>
            </p>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
