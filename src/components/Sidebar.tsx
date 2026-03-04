'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard, Search, Users, Settings, Radar,
    Zap, Clock, Shield, LogOut, ChevronDown, X,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/discover', label: 'Discover', icon: Search },
    { href: '/campaigns', label: 'Campaigns', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
];

interface QuotaStatus {
    used: number; remaining: number; total: number;
    percentage: number; resetTime: string;
}

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [quota, setQuota] = useState<QuotaStatus | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        async function init() {
            const { data } = await supabase.auth.getSession();
            const session = data.session;
            if (session?.user) {
                setUserEmail(session.user.email ?? null);
                // Check admin role
                const { data: profileData } = await supabase
                    .from('profiles').select('role').eq('id', session.user.id).single();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((profileData as any)?.role === 'admin') setIsAdmin(true);
            }
        }
        init();

        async function fetchQuota() {
            try {
                const res = await fetch('/api/quota');
                const data = await res.json();
                setQuota(data);
            } catch (err) { console.error('Failed to fetch quota:', err); }
        }
        fetchQuota();
        const interval = setInterval(fetchQuota, 60000);
        return () => clearInterval(interval);
    }, [supabase]);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        if (onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    const quotaPercent = quota ? ((quota.total - quota.used) / quota.total) * 100 : 100;
    const quotaClass = quotaPercent > 50 ? '' : quotaPercent > 20 ? 'warning' : 'danger';

    return (
        <>
            {/* Overlay backdrop – only visible on mobile when sidebar is open */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}

            <aside className={`sidebar${isOpen ? ' open' : ''}`}>
                <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href="/dashboard" className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <Radar size={20} color="white" />
                        </div>
                        <div className="sidebar-logo-text">
                            <span>Creator</span>Radar
                        </div>
                    </Link>
                    {/* Close button – only relevant on mobile */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="sidebar-close-btn"
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: 4, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', borderRadius: 6,
                            }}
                            aria-label="Close sidebar"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href);
                        return (
                            <Link key={item.href} href={item.href}
                                className={`nav-link ${isActive ? 'active' : ''}`}>
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}

                    {isAdmin && (
                        <Link href="/admin"
                            className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
                            style={{ borderTop: '1px solid var(--border-glass)', marginTop: 8, paddingTop: 16 }}>
                            <Shield size={18} style={{ color: '#f59e0b' }} />
                            <span style={{ color: pathname.startsWith('/admin') ? 'white' : '#f59e0b' }}>Admin Panel</span>
                        </Link>
                    )}
                </nav>

                <div className="sidebar-footer">
                    {/* Quota Gauge */}
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
                            <div className={`quota-bar-fill ${quotaClass}`} style={{ width: `${quotaPercent}%` }} />
                        </div>
                        {quota && (
                            <div className="quota-reset">
                                <Clock size={10} />
                                Resets in {quota.resetTime}
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    {userEmail && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', border: '1px solid var(--border-glass)',
                                    borderRadius: 10, background: showUserMenu ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                                    cursor: 'pointer', transition: 'background 0.2s', marginTop: 8,
                                }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700, color: 'white',
                                }}>
                                    {userEmail.charAt(0).toUpperCase()}
                                </div>
                                <span style={{
                                    flex: 1, fontSize: 12, color: 'var(--text-secondary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    textAlign: 'left',
                                }}>
                                    {userEmail}
                                </span>
                                <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>

                            {showUserMenu && (
                                <div style={{
                                    position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
                                    background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                                    borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                }}>
                                    <button onClick={handleLogout}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '12px 14px', border: 'none', background: 'none',
                                            cursor: 'pointer', color: '#f87171', fontSize: 13, fontWeight: 500,
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                        <LogOut size={15} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
