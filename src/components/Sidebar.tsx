'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Search,
    Users,
    Settings,
    Radar,
    Zap,
    Clock,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/discover', label: 'Discover', icon: Search },
    { href: '/campaigns', label: 'Campaigns', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
];

interface QuotaStatus {
    used: number;
    remaining: number;
    total: number;
    percentage: number;
    resetTime: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const [quota, setQuota] = useState<QuotaStatus | null>(null);

    useEffect(() => {
        async function fetchQuota() {
            try {
                const res = await fetch('/api/quota');
                const data = await res.json();
                setQuota(data);
            } catch (err) {
                console.error('Failed to fetch quota:', err);
            }
        }
        fetchQuota();
        const interval = setInterval(fetchQuota, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    const quotaPercent = quota ? ((quota.total - quota.used) / quota.total) * 100 : 100;
    const quotaClass = quotaPercent > 50 ? '' : quotaPercent > 20 ? 'warning' : 'danger';

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link href="/dashboard" className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Radar size={20} color="white" />
                    </div>
                    <div className="sidebar-logo-text">
                        <span>Creator</span>Radar
                    </div>
                </Link>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={18} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="quota-gauge">
                    <div className="quota-gauge-header">
                        <span className="quota-gauge-label">
                            <Zap size={10} style={{ display: 'inline', marginRight: 4 }} />
                            API Quota
                        </span>
                        <span className="quota-gauge-value">
                            {quota ? `${quota.remaining.toLocaleString()} / ${quota.total.toLocaleString()}` : '— / 10,000'}
                        </span>
                    </div>
                    <div className="quota-bar">
                        <div
                            className={`quota-bar-fill ${quotaClass}`}
                            style={{ width: `${quotaPercent}%` }}
                        />
                    </div>
                    {quota && (
                        <div className="quota-reset">
                            <Clock size={10} />
                            Resets in {quota.resetTime}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
