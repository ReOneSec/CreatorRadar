'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    Eye,
    TrendingUp,
    Video,
    Send,
    AtSign,
    Mail,
    Globe,
    ExternalLink,
    BarChart3,
    Instagram,
    Facebook,
    MessageSquare,
    Star,
    Activity,
    Clock,
} from 'lucide-react';

interface CreatorDetail {
    id: string;
    youtube_id: string;
    name: string;
    description: string | null;
    profile_pic_url: string | null;
    subscribers: number;
    total_views: number;
    avg_views: number;
    video_count: number;
    engagement_rate: number;
    priority_score: number;
    last_upload_at: string | null;
    upload_frequency: number;
    telegram: string | null;
    twitter: string | null;
    instagram: string | null;
    facebook: string | null;
    whatsapp: string | null;
    website: string | null;
    email: string | null;
    country: string | null;
    custom_url: string | null;
    created_at: string;
}

export default function CreatorProfilePage() {
    const params = useParams();
    const id = params.id as string;
    const [creator, setCreator] = useState<CreatorDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Array<{ stage: string; campaigns: { name: string } }>>([]);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/creators/${id}`);
                const data = await res.json();
                setCreator(data.creator);
                setCampaigns(data.campaigns || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (id) load();
    }, [id]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Calculate score breakdown
    const getScoreBreakdown = (c: CreatorDetail) => {
        const engagementScore = Math.min(Math.round((c.engagement_rate / 10) * 100), 100);
        const recencyScore = c.last_upload_at
            ? Math.max(0, 100 - Math.round((Date.now() - new Date(c.last_upload_at).getTime()) / (1000 * 60 * 60 * 24 * 0.57)))
            : 50;
        const consistencyScore = Math.min(Math.round((c.upload_frequency / 4) * 100), 100);
        return { engagementScore, recencyScore, consistencyScore };
    };

    if (loading) {
        return (
            <div className="page-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="skeleton" style={{ width: 140, height: 20 }} />
                    <div className="glass-card" style={{ display: 'flex', gap: 24 }}>
                        <div className="skeleton" style={{ width: 140, height: 140, borderRadius: 20 }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: 300, height: 32, marginBottom: 8 }} />
                            <div className="skeleton" style={{ width: 200, height: 16, marginBottom: 12 }} />
                            <div className="skeleton" style={{ width: '80%', height: 40 }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!creator) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state-title">Creator Not Found</div>
                    <div className="empty-state-desc">This creator may have been removed.</div>
                    <Link href="/discover" className="btn btn-primary" style={{ marginTop: 16 }}>
                        <ArrowLeft size={14} /> Back to Discovery
                    </Link>
                </div>
            </div>
        );
    }

    const scores = getScoreBreakdown(creator);

    return (
        <div className="page-container">
            {/* Back Button */}
            <Link
                href="/discover"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: 13,
                    marginBottom: 20,
                    transition: 'color 0.2s',
                    fontWeight: 500
                }}
            >
                <ArrowLeft size={14} />
                Back to Discovery
            </Link>

            {/* Profile Header Card */}
            <div className="glass-card" style={{ marginBottom: 24, padding: 32, display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                {/* Avatar */}
                {creator.profile_pic_url ? (
                    <img
                        src={creator.profile_pic_url}
                        alt={creator.name}
                        style={{
                            width: 140,
                            height: 140,
                            borderRadius: 20,
                            objectFit: 'contain',
                            background: 'white',
                            border: '1px solid var(--border-glass)',
                            flexShrink: 0
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: 140,
                            height: 140,
                            borderRadius: 20,
                            background: 'var(--bg-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-glass)',
                            flexShrink: 0
                        }}
                    >
                        <Users size={48} style={{ color: 'var(--text-muted)' }} />
                    </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                        {creator.name}
                    </h1>

                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {creator.country && <span>📍 {creator.country} · </span>}
                        {creator.custom_url && <span>@{creator.custom_url.replace('@', '')} · </span>}
                        <span>Scouted {new Date(creator.created_at).toLocaleDateString()}</span>
                    </p>

                    {creator.description && (
                        <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 20px 0', maxWidth: 700 }}>
                            {creator.description.length > 350
                                ? `${creator.description.slice(0, 350)}...`
                                : creator.description}
                        </p>
                    )}

                    {/* Social Links Layout matched to mockup */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <a
                            href={creator.custom_url ? `https://www.youtube.com/${creator.custom_url.startsWith('@') ? creator.custom_url : '@' + creator.custom_url}` : `https://www.youtube.com/channel/${creator.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-link"
                        >
                            <ExternalLink size={14} /> YouTube Channel
                        </a>
                        {creator.telegram && (
                            <a href={creator.telegram} target="_blank" rel="noopener noreferrer" className="social-link">
                                <Send size={14} /> Telegram
                            </a>
                        )}
                        {creator.email && (
                            <a href={`mailto:${creator.email}`} className="social-link">
                                <Mail size={14} /> {creator.email}
                            </a>
                        )}
                        {creator.twitter && (
                            <a href={creator.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                                <AtSign size={14} /> Twitter
                            </a>
                        )}
                        {creator.instagram && (
                            <a href={creator.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                                <Instagram size={14} /> Instagram
                            </a>
                        )}
                        {creator.facebook && (
                            <a href={creator.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                                <Facebook size={14} /> Facebook
                            </a>
                        )}
                        {creator.whatsapp && (
                            <a href={creator.whatsapp} target="_blank" rel="noopener noreferrer" className="social-link">
                                <MessageSquare size={14} /> WhatsApp
                            </a>
                        )}
                        {creator.website && (
                            <a href={creator.website} target="_blank" rel="noopener noreferrer" className="social-link">
                                <Globe size={14} /> Website
                            </a>
                        )}
                    </div>
                </div>

                {/* Score Circular Badge matched to mockup */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 16 }}>
                    <div
                        className={`creator-score ${creator.priority_score >= 70 ? 'high' : creator.priority_score >= 40 ? 'medium' : 'low'}`}
                        style={{ width: 64, height: 64, fontSize: 20 }}
                    >
                        {creator.priority_score}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Priority</div>
                </div>
            </div>

            {/* Stats Grid matching mockup */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card" style={{ padding: 24 }}>
                    <div className="stat-card-icon indigo" style={{ marginBottom: 16 }}><Users size={20} /></div>
                    <div className="stat-card-value" style={{ fontSize: '1.75rem', marginBottom: 6 }}>{formatNumber(creator.subscribers)}</div>
                    <div className="stat-card-label" style={{ fontSize: 12.5 }}>Subscribers</div>
                </div>
                <div className="stat-card" style={{ padding: 24 }}>
                    <div className="stat-card-icon cyan" style={{ marginBottom: 16 }}><Eye size={20} /></div>
                    <div className="stat-card-value" style={{ fontSize: '1.75rem', marginBottom: 6 }}>{formatNumber(creator.total_views)}</div>
                    <div className="stat-card-label" style={{ fontSize: 12.5 }}>Total Views</div>
                </div>
                <div className="stat-card" style={{ padding: 24 }}>
                    <div className="stat-card-icon purple" style={{ marginBottom: 16 }}><TrendingUp size={20} /></div>
                    <div className="stat-card-value" style={{ fontSize: '1.75rem', marginBottom: 6 }}>{formatNumber(creator.avg_views)}</div>
                    <div className="stat-card-label" style={{ fontSize: 12.5 }}>Avg Views</div>
                </div>
                <div className="stat-card" style={{ padding: 24 }}>
                    <div className="stat-card-icon emerald" style={{ marginBottom: 16 }}><Video size={20} /></div>
                    <div className="stat-card-value" style={{ fontSize: '1.75rem', marginBottom: 6 }}>{formatNumber(creator.video_count)}</div>
                    <div className="stat-card-label" style={{ fontSize: 12.5 }}>Videos</div>
                </div>
            </div>

            {/* Score Breakdown & Details matching mockup */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>

                {/* Score Breakdown Panel */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <h3 className="section-title" style={{ marginBottom: 24 }}>
                        <Star size={18} style={{ display: 'inline', color: 'white' }} />
                        Priority Score Breakdown
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'white', width: 100 }}>Engagement</span>
                            <div className="score-bar-track" style={{ flex: 1 }}>
                                <div className="score-bar-fill" style={{ width: `${scores.engagementScore}%`, background: 'var(--accent-cyan)' }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white', width: 28, textAlign: 'right' }}>{scores.engagementScore}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'white', width: 100 }}>Recency</span>
                            <div className="score-bar-track" style={{ flex: 1 }}>
                                <div className="score-bar-fill" style={{ width: `${scores.recencyScore}%`, background: 'var(--accent-emerald)' }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white', width: 28, textAlign: 'right' }}>{scores.recencyScore}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'white', width: 100 }}>Consistency</span>
                            <div className="score-bar-track" style={{ flex: 1 }}>
                                <div className="score-bar-fill" style={{ width: `${scores.consistencyScore}%`, background: 'var(--accent-amber)' }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white', width: 28, textAlign: 'right' }}>{scores.consistencyScore}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 32, padding: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, fontSize: 12.5, color: '#94a3b8', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Scoring Formula:</strong>
                        Engagement (60%) + Recency (30%) + Consistency (10%)
                    </div>
                </div>

                {/* Channel Details Panel */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <h3 className="section-title" style={{ marginBottom: 24 }}>
                        <Activity size={18} style={{ display: 'inline', color: 'white' }} />
                        Channel Details
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="stat-card-icon amber" style={{ width: 44, height: 44, margin: 0, borderRadius: 12 }}>
                                <BarChart3 size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 2 }}>{creator.engagement_rate.toFixed(2)}%</div>
                                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Engagement Rate</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="stat-card-icon cyan" style={{ width: 44, height: 44, margin: 0, borderRadius: 12 }}>
                                <Clock size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 2 }}>
                                    {creator.upload_frequency.toFixed(1)} / month
                                </div>
                                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Upload Frequency</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="stat-card-icon purple" style={{ width: 44, height: 44, margin: 0, borderRadius: 12 }}>
                                <Globe size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 2 }}>{creator.country || 'Unknown'}</div>
                                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Country</div>
                            </div>
                        </div>

                        {campaigns.length > 0 && (
                            <div style={{ marginTop: 8, padding: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Added to Campaigns
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {campaigns.map((c, i) => (
                                        <div key={i} className="badge active">
                                            {(c.campaigns as unknown as { name: string })?.name} ({c.stage})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
