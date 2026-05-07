'use client';

import { useState } from 'react';
import {
    Moon,
    Sun,
    Bell,
    HelpCircle,
    LogOut,
    ChevronRight,
    Info,
    FileText,
    MessageSquare,
    Monitor,
    Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import PageHeader from '@/components/layout/PageHeader';
import { AuthService } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/theme-context';

export default function SettingsPage() {
    const router = useRouter();
    const { user, reset } = useAuthStore();
    const { theme, setTheme, actualTheme } = useTheme();
    const [notifications, setNotifications] = useState(true);

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await AuthService.signOut();
            reset();
            router.push('/login');
        }
    };

    const themeOptions = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ] as const;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader icon={Settings} iconColor="text-gray-400" title="Settings" />
            <div className="p-4 lg:p-8">

                <div className="max-w-2xl space-y-6">
                    {/* User Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                {user?.displayName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.displayName || 'User'}</h2>
                                <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => router.push('/profile')}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Preferences</h3>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {/* Notifications Toggle */}
                            <div className="flex items-center gap-4 p-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Get alerts for budget limits</p>
                                </div>
                                <button
                                    onClick={() => setNotifications(!notifications)}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Theme Selection */}
                            <div className="p-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        {actualTheme === 'dark' ? <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred appearance</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 ml-14">
                                    {themeOptions.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setTheme(option.value)}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${theme === option.value
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-sm">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Support</h3>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            <a href="#" className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">Help Center</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">FAQs and guides</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </a>
                            <a href="mailto:support@eleviq.app" className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">Contact Support</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Get help from our team</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </a>
                            <a href="#" className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">Privacy Policy</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">How we handle your data</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </a>
                        </div>
                    </div>

                    {/* About */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <Info className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">ElevIQ</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your personal AI-powered finance companion. Track expenses, analyze spending patterns,
                            and make smarter financial decisions.
                        </p>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-medium transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
