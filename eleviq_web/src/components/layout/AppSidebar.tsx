'use client';

import IconRail from './IconRail';
import SidebarPanel from './SidebarPanel';

interface AppSidebarProps {
    className?: string;
}

export default function AppSidebar({ className }: AppSidebarProps) {
    return (
        <div className={`flex ${className}`}>
            <IconRail />
            <SidebarPanel />
        </div>
    );
}
