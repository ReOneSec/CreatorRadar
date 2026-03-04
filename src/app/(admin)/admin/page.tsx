'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Shield, Users, Activity, LayoutDashboard, RefreshCw,
    CheckCircle2, XCircle, Search, Clock, Zap, Database,
    ChevronLeft, ChevronRight, Radar, ExternalLink,
} from 'lucide-react';

interface AdminUser {
    id: string;
    email: string;
    role: string;
    created_at: string;
    has_youtube_key: boolean;
    has_openai_key: boolean;
    search_count: number;
}

interface ActivityLog {
    id: string;
    user_id: string;
    user_email: string;
    action_type: string;
    details: Record<string, unknown>;
    created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
    SEARCH_PERFORMED: '#6366f1',
    PITCH_GENERATED: '#8b5cf6',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
    SEARCH_PERFORMED: <Search size={14} />,
    PITCH_GENERATED: <Zap size={14} />,
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
}

export default function AdminPage() {
    const [tab, setTab] = useState<'activity' | 'users'>('activity');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const PAGE_SIZE = 25;

    const fetchUsers = useCallback(async () => {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        setUsers(data.users || []);
    }, []);

    const fetchLogs = useCallback(async (p = 0) => {
        setLoading(true);
        const res = await fetch(`/api/admin/activity?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`);
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); fetchLogs(0); }, [fetchUsers, fetchLogs]);
    useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

    const stats = {
        totalUsers: users.length,
        usersWithYT: users.filter(u => u.has_youtube_key).length,
        usersWithAI: users.filter(u => u.has_openai_key).length,
        totalSearches: users.reduce((s, u) => s + u.search_count, 0),
    };

    return (
        <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
                        <Radar size={16} />
                        <span>Back to App</span>
                    </Link>
                    <span style={{ color: 'var(--border-glass)' }}>›</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Shield size={18} color="white" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Admin Panel</h1>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Platform management</p>
                        </div>
                    </div>
                </div>
                <button onClick={() => { fetchUsers(); fetchLogs(page); }}
                    className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                {[
                    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={18} />, color: 'indigo' },
                    { label: 'YouTube Keys', value: `${stats.usersWithYT}/${stats.totalUsers}`, icon: <CheckCircle2 size={18} />, color: 'emerald' },
                    { label: 'OpenAI Keys', value: `${stats.usersWithAI}/${stats.totalUsers}`, icon: <Zap size={18} />, color: 'amber' },
                    { label: 'Total Searches', value: stats.totalSearches, icon: <Search size={18} />, color: 'violet' },
                ].map(item => (
                    <div key={item.label} className="glass-card stat-card" style={{ padding: '18px 20px' }}>
                        <div className={`stat-card-icon ${item.color}`}>{item.icon}</div>
                        <div className="stat-card-value" style={{ fontSize: '1.6rem' }}>{item.value}</div>
                        <div className="stat-card-label">{item.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content',
            }}>
                {([['activity', Activity, 'Activity Feed'], ['users', Users, 'Users']] as const).map(([id, Icon, label]) => (
                    <button key={id} onClick={() => setTab(id as 'activity' | 'users')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '8px 18px', border: 'none', cursor: 'pointer', borderRadius: 8,
                            fontSize: 13.5, fontWeight: 600, transition: 'all 0.2s',
                            background: tab === id ? 'rgba(99,102,241,0.3)' : 'transparent',
                            color: tab === id ? 'white' : 'var(--text-muted)',
                        }}>
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* Activity Feed Tab */}
            {tab === 'activity' && (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={16} style={{ color: '#6366f1' }} />
                        <span style={{ fontWeight: 700, color: 'white' }}>Activity Feed</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>{totalLogs} total events</span>
                    </div>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', opacity: 0.5, marginBottom: 8 }} />
                            <div>Loading activity...</div>
                        </div>
                    ) : (
                        <>
                            <table className="data-table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 13 }}>
                                                {log.user_email}
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '3px 10px', borderRadius: 20,
                                                    background: `${ACTION_COLORS[log.action_type] || '#6b7280'}22`,
                                                    color: ACTION_COLORS[log.action_type] || '#9ca3af',
                                                    fontSize: 12, fontWeight: 600,
                                                }}>
                                                    {ACTION_ICONS[log.action_type] || <Database size={14} />}
                                                    {log.action_type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 12.5, maxWidth: 340 }}>
                                                {log.details?.query ? (
                                                    <div>
                                                        {/* Query + stats line */}
                                                        <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>
                                                            <span style={{ color: 'white', fontWeight: 600 }}>&quot;{String(log.details.query)}&quot;</span>
                                                            {' · '}
                                                            <span style={{ color: '#818cf8' }}>{String(log.details.result_count ?? '—')} channels</span>
                                                            {' · '}
                                                            <span style={{
                                                                color: log.details.cache === 'hit' ? '#34d399' : '#60a5fa',
                                                                fontWeight: 600,
                                                            }}>
                                                                {log.details.cache === 'hit' ? '⚡ Cached' : '🌐 Live'}
                                                            </span>
                                                        </div>
                                                        {/* Channel thumbnail strip */}
                                                        {Array.isArray(log.details.top_channels) && log.details.top_channels.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                                {(log.details.top_channels as Array<{ name: string; thumb?: string; subs: number }>).map((ch, i) => (
                                                                    <div key={i} title={`${ch.name} · ${ch.subs?.toLocaleString()} subs`}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 3px',
                                                                            background: 'rgba(255,255,255,0.05)', borderRadius: 20,
                                                                            border: '1px solid rgba(255,255,255,0.08)', maxWidth: 150,
                                                                        }}>
                                                                        {ch.thumb ? (
                                                                            <img src={ch.thumb} alt={ch.name}
                                                                                style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                            />
                                                                        ) : (
                                                                            <div style={{
                                                                                width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.3)',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                fontSize: 10, color: '#818cf8', flexShrink: 0,
                                                                            }}>{ch.name.charAt(0)}</div>
                                                                        )}
                                                                        <span style={{
                                                                            fontSize: 11, color: 'var(--text-secondary)',
                                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                        }}>{ch.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {/* View Full Report link */}
                                                        {Boolean(log.details.query_hash) && (
                                                            <div style={{ marginTop: 6 }}>
                                                                <Link
                                                                    href={`/admin/search?hash=${String(log.details.query_hash)}&q=${encodeURIComponent(String(log.details.query))}`}
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                        fontSize: 11, fontWeight: 600, color: '#818cf8',
                                                                        textDecoration: 'none', padding: '3px 9px', borderRadius: 8,
                                                                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                                                                        transition: 'background 0.15s',
                                                                    }}
                                                                >
                                                                    <ExternalLink size={10} /> View Full Report
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : log.details?.creator_name ? (
                                                    <span style={{ color: 'var(--text-secondary)' }}>
                                                        {String(log.details.creator_name)} · <em>{String(log.details.tone)}</em>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
                                                        {JSON.stringify(log.details).substring(0, 60)}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 12.5 }}>
                                                    <Clock size={12} /> {timeAgo(log.created_at)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No activity yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16, borderTop: '1px solid var(--border-glass)' }}>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        Page {page + 1} of {totalPages}
                                    </span>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={16} style={{ color: '#6366f1' }} />
                        <span style={{ fontWeight: 700, color: 'white' }}>User Management</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>{users.length} users</span>
                    </div>
                    <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>YouTube Key</th>
                                <th>OpenAI Key</th>
                                <th>Searches</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 13 }}>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'active' : 'stale'}`} style={{ fontSize: 11 }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {user.has_youtube_key
                                            ? <CheckCircle2 size={16} style={{ color: '#34d399' }} />
                                            : <XCircle size={16} style={{ color: '#f87171', opacity: 0.5 }} />}
                                    </td>
                                    <td>
                                        {user.has_openai_key
                                            ? <CheckCircle2 size={16} style={{ color: '#34d399' }} />
                                            : <XCircle size={16} style={{ color: '#f87171', opacity: 0.5 }} />}
                                    </td>
                                    <td>
                                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: user.search_count > 0 ? '#818cf8' : 'var(--text-muted)' }}>
                                            {user.search_count}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No users yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
