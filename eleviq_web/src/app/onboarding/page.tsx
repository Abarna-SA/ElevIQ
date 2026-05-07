'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import OnboardingFlow from './_components/OnboardingFlow';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/signin');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return <OnboardingFlow />;
}
