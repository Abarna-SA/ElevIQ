'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/theme-context';
import { SnackbarProvider } from './_components';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { actualTheme } = useTheme();

    return (
        <SnackbarProvider>
            <div className={`min-h-screen flex flex-col ${actualTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white lg:bg-gray-50'}`}>
                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-16">
                    <div className="w-full max-w-[440px]">
                        {/* Logo */}
                        <div className="mb-8 lg:mb-10 lg:text-center">
                            <Link href="/" className="inline-flex items-center gap-2">
                                <img
                                    src={actualTheme === 'dark' ? '/ElevIQ_White.png' : '/ElevIQ_Gold.png'}
                                    alt="ElevIQ"
                                    className="h-10 lg:h-14 w-auto"
                                />
                            </Link>
                        </div>

                        {/* Card wrapper */}
                        <div className={`lg:rounded-2xl lg:p-8 ${actualTheme === 'dark'
                            ? 'lg:bg-[#171717] lg:border lg:border-white/5'
                            : 'lg:bg-white lg:shadow-2xl'
                            }`}>
                            {children}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-4 px-4 text-center">
                    <div className={`flex items-center justify-center gap-4 text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        <span className="lg:hidden">
                            Help{' '}
                            <span className="mx-2">·</span>
                            Privacy{' '}
                            <span className="mx-2">·</span>
                            Terms
                        </span>
                        <span className="hidden lg:block">Need Help?</span>
                    </div>
                    <p className={`mt-2 text-xs ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                        By continuing, you agree to the{' '}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                            Terms
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </footer>
            </div>
        </SnackbarProvider>
    );
}
