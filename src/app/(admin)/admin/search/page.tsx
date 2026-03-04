'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Users, Eye, Globe, ExternalLink, BarChart3,
    TrendingUp, RefreshCw, AlertCircle, Youtube, Send,
    Twitter, Instagram, Mail,
} from 'lucide-react';

interface Creator {
    youtube_id: string;
    name: string;
    description: string;
    profile_pic_url: string;
    subscribers: number;
    avg_views: number;
    video_count: number;
    engagement_rate: number;
    priority_score: number;
    upload_frequency: string;
    country: string;
    custom_url: string;
    telegram: string | null;
    twitter: string | null;
    instagram: string | null;
    email: string | null;
    total_views: number;
}

interface ReportData {
    results: Creator[];
    fetched_at: string;
    hit_count: number;
    total: number;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: `${color}18`, color, border: `1px solid ${color}40`,
        }}>
            <TrendingUp size={11} /> {score}
        </span>
    );
}

function SearchReportContent() {
    const searchParams = useSearchParams();
    const hash = searchParams.get('hash');
    const query = searchParams.get('q') || '';

    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'priority_score' | 'subscribers' | 'avg_views' | 'engagement_rate'>('priority_score');

    useEffect(() => {
        if (!hash) { setError('No report hash provided'); setLoading(false); return; }
        fetch(`/api/admin/search-report?hash=${hash}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(d.error);
                else setData(d);
            })
            .catch(() => setError('Failed to load report'))
            .finally(() => setLoading(false));
    }, [hash]);

    const filtered = (data?.results || [])
        .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.country?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', opacity: 0.4 }} />
            <span>Loading report...</span>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
            <AlertCircle size={32} style={{ color: '#f87171' }} />
            <span style={{ color: '#f87171', fontWeight: 600 }}>{error}</span>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>This may happen if the search was performed more than 48 hours ago (cache expired).</p>
        </div>
    );

    return (
        <div>
            {/* Summary bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Total Channels', value: data?.total ?? 0, icon: <Users size={16} />, color: 'indigo' },
                    { label: 'Cache Hits', value: data?.hit_count ?? 0, icon: <BarChart3 size={16} />, color: 'emerald' },
                    { label: 'Avg Subscribers', value: formatNumber(Math.round((filtered.reduce((s, c) => s + c.subscribers, 0)) / Math.max(filtered.length, 1))), icon: <TrendingUp size={16} />, color: 'amber' },
                    { label: 'With Contact', value: filtered.filter(c => c.email || c.telegram || c.twitter).length, icon: <Mail size={16} />, color: 'violet' },
                ].map(item => (
                    <div key={item.label} className="glass-card stat-card" style={{ padding: '14px 18px' }}>
                        <div className={`stat-card-icon ${item.color}`}>{item.icon}</div>
                        <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{item.value}</div>
                        <div className="stat-card-label">{item.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="text" className="input" placeholder="Filter by name or country..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 200, maxWidth: 340, padding: '8px 14px', fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Sort by:</span>
                    {(['priority_score', 'subscribers', 'avg_views', 'engagement_rate'] as const).map(key => (
                        <button key={key} onClick={() => setSortBy(key)}
                            className={`btn btn-sm ${sortBy === key ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: 11, padding: '4px 10px' }}>
                            {key === 'priority_score' ? 'Score' : key === 'avg_views' ? 'Avg Views' : key === 'engagement_rate' ? 'Engagement' : 'Subs'}
                        </button>
                    ))}
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>{filtered.length} channels</span>
            </div>

            {/* Channel Rows */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                        <tr>
                            <th style={{ width: 300 }}>Channel</th>
                            <th>Score</th>
                            <th>Subscribers</th>
                            <th>Avg Views</th>
                            <th>Engagement</th>
                            <th>Country</th>
                            <th>Contact</th>
                            <th>Visit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(creator => (
                            <tr key={creator.youtube_id}>
                                {/* Channel info */}
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {creator.profile_pic_url ? (
                                            <img src={creator.profile_pic_url} alt={creator.name}
                                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.08)' }}
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                {creator.name.charAt(0)}
                                            </div>
                                        )}
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                                                {creator.name}
                                            </div>
                                            {creator.description && (
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, marginTop: 2 }}>
                                                    {creator.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td><ScoreBadge score={Math.round(creator.priority_score)} /></td>
                                <td style={{ fontWeight: 600, color: '#818cf8' }}>{formatNumber(creator.subscribers)}</td>
                                <td style={{ color: 'var(--text-primary)' }}>{formatNumber(creator.avg_views)}</td>
                                <td>
                                    <span style={{ color: creator.engagement_rate > 5 ? '#34d399' : creator.engagement_rate > 2 ? '#fbbf24' : 'var(--text-muted)' }}>
                                        {creator.engagement_rate?.toFixed(1)}%
                                    </span>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{creator.country || '—'}</td>
                                {/* Contact links */}
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {creator.telegram && (
                                            <a href={creator.telegram} target="_blank" rel="noopener noreferrer" title="Telegram"
                                                style={{ color: '#60a5fa', display: 'flex' }}><Send size={14} /></a>
                                        )}
                                        {creator.twitter && (
                                            <a href={creator.twitter} target="_blank" rel="noopener noreferrer" title="Twitter"
                                                style={{ color: '#38bdf8', display: 'flex' }}><Twitter size={14} /></a>
                                        )}
                                        {creator.instagram && (
                                            <a href={creator.instagram} target="_blank" rel="noopener noreferrer" title="Instagram"
                                                style={{ color: '#f472b6', display: 'flex' }}><Instagram size={14} /></a>
                                        )}
                                        {creator.email && (
                                            <a href={`mailto:${creator.email}`} title="Email"
                                                style={{ color: '#34d399', display: 'flex' }}><Mail size={14} /></a>
                                        )}
                                        {!creator.telegram && !creator.twitter && !creator.instagram && !creator.email && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                                        )}
                                    </div>
                                </td>
                                {/* YouTube link */}
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <a href={`https://youtube.com/channel/${creator.youtube_id}`}
                                            target="_blank" rel="noopener noreferrer"
                                            title="Open YouTube channel"
                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                            <Youtube size={12} /> YouTube
                                        </a>
                                        {creator.custom_url && (
                                            <a href={`https://youtube.com/${creator.custom_url}`}
                                                target="_blank" rel="noopener noreferrer"
                                                title="Open custom URL"
                                                style={{ color: 'var(--text-muted)', display: 'flex' }}>
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <Globe size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                                <div>No channels match your filter</div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function SearchReportPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div>}>
            <SearchReportPageInner />
        </Suspense>
    );
}

function SearchReportPageInner() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || 'Search';

    return (
        <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)' }}>
                    <ArrowLeft size={14} /> Back to Admin
                </Link>
                <span style={{ color: 'var(--border-glass)' }}>›</span>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                        Search Report: <span style={{ color: '#818cf8' }}>&quot;{query}&quot;</span>
                    </h1>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Full channel details for this search session</p>
                </div>
            </div>

            <SearchReportContent />
        </div>
    );
}
