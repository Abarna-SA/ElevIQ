import {
    House,
    LayoutDashboard,
    Receipt,
    BarChart3,
    Landmark,
    Wrench,
    Sparkles,
    ScanLine,
    Calculator,
    CalendarClock,
    BadgeDollarSign,
    FileDown,
    ChartNoAxesCombined,
    Target,
    ShieldAlert,
    RefreshCcw,
    BellRing,
    Lightbulb,
    UsersRound,
    Split,
    Heart,
    ArrowLeftRight,
    Settings,
    CircleUserRound,
    LucideIcon,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────

export interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

export interface SectionConfig {
    name: string;
    icon: LucideIcon;
    items: NavItem[];
}

export interface BottomItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

// ─── Sections ───────────────────────────────────────────

export const sections: SectionConfig[] = [
    {
        name: 'Home',
        icon: House,
        items: [
            { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/expenses', icon: Receipt, label: 'Expenses' },
            { href: '/analytics', icon: BarChart3, label: 'Analytics' },
            { href: '/networth', icon: Landmark, label: 'Net Worth' },
        ],
    },
    {
        name: 'Tools',
        icon: Wrench,
        items: [
            { href: '/chat', icon: Sparkles, label: 'AI Assistant' },
            { href: '/scan', icon: ScanLine, label: 'Scan Receipt' },
            { href: '/calculator', icon: Calculator, label: 'Calculator' },
            { href: '/bills', icon: CalendarClock, label: 'Bill Calendar' },
            { href: '/currency', icon: BadgeDollarSign, label: 'Currency' },
            { href: '/export', icon: FileDown, label: 'Export Data' },
        ],
    },
    {
        name: 'Plan',
        icon: ChartNoAxesCombined,
        items: [
            { href: '/goals', icon: Target, label: 'Goals' },
            { href: '/limits', icon: ShieldAlert, label: 'Spending Limits' },
            { href: '/recurring', icon: RefreshCcw, label: 'Recurring' },
            { href: '/reminders', icon: BellRing, label: 'Reminders' },
            { href: '/insights', icon: Lightbulb, label: 'Insights' },
        ],
    },
    {
        name: 'People',
        icon: UsersRound,
        items: [
            { href: '/split', icon: Split, label: 'Split Expenses' },
            { href: '/family', icon: Heart, label: 'Family Budget' },
            { href: '/compare', icon: ArrowLeftRight, label: 'Compare' },
        ],
    },
];

// ─── Bottom Items ───────────────────────────────────────

export const bottomItems: BottomItem[] = [
    { href: '/settings', icon: Settings, label: 'Settings' },
    { href: '/profile', icon: CircleUserRound, label: 'Profile' },
];

// ─── Helpers ────────────────────────────────────────────

/** Get all paths belonging to a section */
export function getSectionPaths(section: SectionConfig): string[] {
    return section.items.map((item) => item.href);
}

/** Find which section a path belongs to */
export function findSectionForPath(pathname: string): string | null {
    for (const section of sections) {
        for (const item of section.items) {
            if (pathname === item.href || pathname.startsWith(item.href + '/')) {
                return section.name;
            }
        }
    }
    return null;
}
