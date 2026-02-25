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
                    <div className="skeleton" style={{ width: 200, height: 20 }} />
                    <div style={{ display: 'flex', gap: 24 }}>
                        <div className="skeleton" style={{ width: 96, height: 96, borderRadius: 20 }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: 300, height: 28, marginBottom: 8 }} />
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
                    marginBottom: 24,
                    transition: 'color 0.2s',
                }}
            >
                <ArrowLeft size={16} />
                Back to Discovery
            </Link>

            {/* Profile Header */}
            <div className="glass-card" style={{ marginBottom: 24 }}>
                <div className="profile-header">
                    {creator.profile_pic_url ? (
                        <img src={creator.profile_pic_url} alt={creator.name} className="profile-avatar" />
                    ) : (
                        <div
                            className="profile-avatar"
                            style={{
                                background: 'var(--bg-glass)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Users size={40} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    )}
                    <div className="profile-info">
                        <h1 className="profile-name">{creator.name}</h1>
                        <p className="profile-handle">
                            {creator.country && `📍 ${creator.country} · `}
                            {creator.custom_url && `@${creator.custom_url} · `}
                            Scouted {new Date(creator.created_at).toLocaleDateString()}
                        </p>
                        {creator.description && (
                            <p className="profile-description">
                                {creator.description.length > 300
                                    ? `${creator.description.slice(0, 300)}...`
                                    : creator.description}
                            </p>
                        )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div
                            className={`creator-score ${creator.priority_score >= 70 ? 'high' : creator.priority_score >= 40 ? 'medium' : 'low'
                                }`}
                            style={{ width: 64, height: 64, fontSize: 20 }}
                        >
                            {creator.priority_score}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Priority</div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="social-links" style={{ marginTop: 4 }}>
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
                    {creator.twitter && (
                        <a href={creator.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                            <AtSign size={14} /> Twitter / X
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
                    {creator.email && (
                        <a href={`mailto:${creator.email}`} className="social-link">
                            <Mail size={14} /> {creator.email}
                        </a>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="profile-stats-grid">
                <div className="stat-card">
                    <div className="stat-card-icon indigo"><Users size={20} /></div>
                    <div className="stat-card-value">{formatNumber(creator.subscribers)}</div>
                    <div className="stat-card-label">Subscribers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon cyan"><Eye size={20} /></div>
                    <div className="stat-card-value">{formatNumber(creator.total_views)}</div>
                    <div className="stat-card-label">Total Views</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon purple"><TrendingUp size={20} /></div>
                    <div className="stat-card-value">{formatNumber(creator.avg_views)}</div>
                    <div className="stat-card-label">Avg Views</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon emerald"><Video size={20} /></div>
                    <div className="stat-card-value">{formatNumber(creator.video_count)}</div>
                    <div className="stat-card-label">Videos</div>
                </div>
            </div>

            {/* Score Breakdown & Details */}
            <div className="profile-score-section">
                <div className="glass-card">
                    <h3 className="section-title">
                        <Star size={16} style={{ display: 'inline', marginRight: 8 }} />
                        Priority Score Breakdown
                    </h3>
                    <div className="score-breakdown">
                        <div className="score-bar-item">
                            <span className="score-bar-label">Engagement</span>
                            <div className="score-bar-track">
                                <div
                                    className="score-bar-fill engagement"
                                    style={{ width: `${scores.engagementScore}%` }}
                                />
                            </div>
                            <span className="score-bar-value">{scores.engagementScore}</span>
                        </div>
                        <div className="score-bar-item">
                            <span className="score-bar-label">Recency</span>
                            <div className="score-bar-track">
                                <div
                                    className="score-bar-fill recency"
                                    style={{ width: `${scores.recencyScore}%` }}
                                />
                            </div>
                            <span className="score-bar-value">{scores.recencyScore}</span>
                        </div>
                        <div className="score-bar-item">
                            <span className="score-bar-label">Consistency</span>
                            <div className="score-bar-track">
                                <div
                                    className="score-bar-fill consistency"
                                    style={{ width: `${scores.consistencyScore}%` }}
                                />
                            </div>
                            <span className="score-bar-value">{scores.consistencyScore}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-glass)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>Scoring Formula:</strong><br />
                        Engagement (60%) + Recency (30%) + Consistency (10%)
                    </div>
                </div>

                <div className="glass-card">
                    <h3 className="section-title">
                        <Activity size={16} style={{ display: 'inline', marginRight: 8 }} />
                        Channel Details
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="stat-card-icon amber" style={{ width: 36, height: 36 }}>
                                <BarChart3 size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{creator.engagement_rate.toFixed(2)}%</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Engagement Rate</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="stat-card-icon cyan" style={{ width: 36, height: 36 }}>
                                <Clock size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>
                                    {creator.upload_frequency.toFixed(1)} / month
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upload Frequency</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="stat-card-icon indigo" style={{ width: 36, height: 36 }}>
                                <Globe size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{creator.country || 'Unknown'}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Country</div>
                            </div>
                        </div>

                        {campaigns.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Added to Campaigns
                                </div>
                                {campaigns.map((c, i) => (
                                    <div key={i} className="badge active" style={{ marginRight: 6, marginBottom: 6 }}>
                                        {(c.campaigns as unknown as { name: string })?.name} ({c.stage})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
