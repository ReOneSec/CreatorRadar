'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Radar } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-content">
                {/* Mobile top bar – hidden on desktop via CSS */}
                <div className="mobile-topbar">
                    <button
                        className="hamburger-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={20} color="var(--text-secondary)" />
                    </button>
                    <Link href="/dashboard" className="mobile-topbar-logo">
                        <div className="mobile-topbar-logo-icon">
                            <Radar size={16} color="white" />
                        </div>
                        <div className="mobile-topbar-logo-text">
                            <span>Creator</span>Radar
                        </div>
                    </Link>
                </div>
                {children}
            </div>
        </div>
    );
}
