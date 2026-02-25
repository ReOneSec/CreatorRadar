'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Plus, Target, Users, ChevronRight, Trash2, ArrowRight,
    Send, AtSign, Loader2, Download, Sparkles, Copy, Check, RefreshCw,
    ArrowLeft, Zap,
} from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    description: string | null;
    status: string;
    created_at: string;
    stageCounts: Record<string, number>;
}

interface CampaignCreator {
    id: string;
    stage: string;
    creator: {
        id: string;
        name: string;
        profile_pic_url: string | null;
        subscribers: number;
        priority_score: number;
        telegram: string | null;
        twitter: string | null;
        email: string | null;
    };
}

const STAGES = ['new', 'contacted', 'negotiating', 'partnered'] as const;
const STAGE_LABELS: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    negotiating: 'Negotiating',
    partnered: 'Partnered',
};
const STAGE_EMOJIS: Record<string, string> = {
    new: '🆕',
    contacted: '📨',
    negotiating: '🤝',
    partnered: '✅',
};
const STAGE_COLORS: Record<string, string> = {
    new: 'rgba(99,102,241,0.5)',
    contacted: 'rgba(6,182,212,0.5)',
    negotiating: 'rgba(245,158,11,0.5)',
    partnered: 'rgba(16,185,129,0.5)',
};

function formatNum(n: number) {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
    const [campaignCreators, setCampaignCreators] = useState<CampaignCreator[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [pitchModal, setPitchModal] = useState<{ creatorId: string; creatorName: string } | null>(null);
    const [pitchTone, setPitchTone] = useState<'professional' | 'casual' | 'friendly'>('friendly');
    const [pitchProductInfo, setPitchProductInfo] = useState('');
    const [pitchResult, setPitchResult] = useState<{ subject: string; pitch: string } | null>(null);
    const [pitchLoading, setPitchLoading] = useState(false);
    const [pitchCopied, setPitchCopied] = useState(false);

    const loadCampaigns = useCallback(async () => {
        try {
            const res = await fetch('/api/campaigns');
            const data = await res.json();
            setCampaigns(data.campaigns || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

    async function createCampaign() {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, description: newDesc }),
            });
            setNewName(''); setNewDesc(''); setShowCreate(false); loadCampaigns();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    }

    async function loadDetail(id: string) {
        setSelectedCampaign(id);
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/campaigns/${id}`);
            const data = await res.json();
            setCampaignCreators(data.creators || []);
        } catch (e) { console.error(e); }
        finally { setLoadingDetail(false); }
    }

    async function updateStage(cId: string, creatorId: string, stage: string) {
        await fetch(`/api/campaigns/${cId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updateStage: { creatorId, stage } }),
        });
        setCampaignCreators(p => p.map(cc => cc.creator.id === creatorId ? { ...cc, stage } : cc));
    }

    async function removeCreator(cId: string, creatorId: string) {
        await fetch(`/api/campaigns/${cId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ removeCreator: creatorId }),
        });
        setCampaignCreators(p => p.filter(cc => cc.creator.id !== creatorId));
    }

    async function deleteCampaign(id: string) {
        if (!confirm('Delete this campaign?')) return;
        await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
        setCampaigns(p => p.filter(c => c.id !== id));
        if (selectedCampaign === id) setSelectedCampaign(null);
    }

    async function generatePitch(creatorId: string) {
        setPitchLoading(true);
        setPitchResult(null);
        try {
            const res = await fetch('/api/pitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId, campaignId: selectedCampaign, tone: pitchTone, productInfo: pitchProductInfo || undefined }),
            });
            const data = await res.json();
            setPitchResult(data);
        } catch (e) { console.error(e); }
        finally { setPitchLoading(false); }
    }

    function copyPitch() {
        if (!pitchResult) return;
        navigator.clipboard.writeText(`Subject: ${pitchResult.subject}\n\n${pitchResult.pitch}`);
        setPitchCopied(true);
        setTimeout(() => setPitchCopied(false), 2000);
    }

    // Campaign Detail (Kanban View)
    if (selectedCampaign) {
        const camp = campaigns.find(c => c.id === selectedCampaign);
        const totalCreators = campaignCreators.length;

        return (
            <div className="page-container">
                {/* Back + Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedCampaign(null)}
                        style={{ gap: 6 }}
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <div style={{ width: 1, height: 20, background: 'var(--border-glass)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Campaigns</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/</span>
                    <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{camp?.name}</span>
                </div>

                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <h1 className="page-title" style={{ margin: 0 }}>{camp?.name || 'Campaign'}</h1>
                            <span className={`badge ${camp?.status === 'active' ? 'engagement' : 'stale'}`}>
                                {camp?.status}
                            </span>
                        </div>
                        <p className="page-subtitle">{camp?.description || 'Manage your outreach pipeline'}</p>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => window.open(`/api/export?campaignId=${selectedCampaign}`, '_blank')}
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>

                {/* Summary Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    {STAGES.map(stage => {
                        const count = campaignCreators.filter(cc => cc.stage === stage).length;
                        return (
                            <div key={stage} className="stat-card" style={{ padding: 16 }}>
                                <div style={{ fontSize: 18, marginBottom: 6 }}>{STAGE_EMOJIS[stage]}</div>
                                <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{count}</div>
                                <div className="stat-card-label">{STAGE_LABELS[stage]}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Kanban Board */}
                {loadingDetail ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                        <Loader2 size={28} className="loading-spinner" style={{ color: '#818cf8' }} />
                    </div>
                ) : (
                    <div className="kanban-board">
                        {STAGES.map(stage => {
                            const items = campaignCreators.filter(cc => cc.stage === stage);
                            return (
                                <div key={stage} className={`kanban-column ${stage}`}>
                                    <div className="kanban-column-header">
                                        <span className="kanban-column-title">
                                            {STAGE_EMOJIS[stage]} {STAGE_LABELS[stage]}
                                        </span>
                                        <span className="kanban-column-count">{items.length}</span>
                                    </div>
                                    <div className="kanban-cards">
                                        {items.map(cc => (
                                            <div key={cc.id} className="kanban-card">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                                                    {cc.creator.profile_pic_url ? (
                                                        <img
                                                            src={cc.creator.profile_pic_url}
                                                            alt=""
                                                            style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Users size={14} style={{ color: 'var(--text-muted)' }} />
                                                        </div>
                                                    )}
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <Link
                                                            href={`/creators/${cc.creator.id}`}
                                                            className="kanban-card-name"
                                                            style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        >
                                                            {cc.creator.name}
                                                        </Link>
                                                        <div className="kanban-card-meta">
                                                            {formatNum(cc.creator.subscribers)} subs · <span style={{ color: '#818cf8' }}>#{cc.creator.priority_score}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="kanban-card-actions">
                                                    {stage !== 'partnered' && (
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => updateStage(selectedCampaign, cc.creator.id, STAGES[STAGES.indexOf(stage) + 1])}
                                                            title="Advance Stage"
                                                        >
                                                            <ArrowRight size={11} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => { setPitchModal({ creatorId: cc.creator.id, creatorName: cc.creator.name }); setPitchResult(null); }}
                                                        title="Generate Pitch"
                                                    >
                                                        <Sparkles size={11} />
                                                    </button>
                                                    {cc.creator.telegram && (
                                                        <a href={cc.creator.telegram} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" title="Telegram">
                                                            <Send size={11} />
                                                        </a>
                                                    )}
                                                    {cc.creator.twitter && (
                                                        <a href={cc.creator.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" title="Twitter/X">
                                                            <AtSign size={11} />
                                                        </a>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => removeCreator(selectedCampaign, cc.creator.id)}
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {items.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: 12, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.06)' }}>
                                                No creators yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pitch Modal */}
                {pitchModal && (
                    <div className="modal-overlay" onClick={() => setPitchModal(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                            <h2 className="modal-title">
                                <Sparkles size={18} style={{ color: '#c084fc' }} />
                                Generate Outreach Pitch
                            </h2>
                            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 20 }}>
                                Crafting a pitch for <strong style={{ color: 'white' }}>{pitchModal.creatorName}</strong>
                            </p>

                            <div className="settings-field">
                                <label className="label">Tone</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['professional', 'casual', 'friendly'] as const).map(t => (
                                        <button
                                            key={t}
                                            className={`btn btn-sm ${pitchTone === t ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setPitchTone(t)}
                                        >
                                            {t === 'professional' ? '💼' : t === 'casual' ? '😎' : '😊'} {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="settings-field">
                                <label className="label">Product / Brand Info (optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. DeFi wallet app for Gen Z users"
                                    value={pitchProductInfo}
                                    onChange={e => setPitchProductInfo(e.target.value)}
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginBottom: 16 }}
                                onClick={() => generatePitch(pitchModal.creatorId)}
                                disabled={pitchLoading}
                            >
                                {pitchLoading ? <Loader2 size={15} className="loading-spinner" /> : <Sparkles size={15} />}
                                {pitchLoading ? 'Generating...' : pitchResult ? 'Regenerate Pitch' : 'Generate Pitch'}
                            </button>

                            {pitchResult && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Subject</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'white' }}>{pitchResult.subject}</div>
                                    <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Message</div>
                                    <div style={{ fontSize: 13.5, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#94a3b8' }}>{pitchResult.pitch}</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                        <button className="btn btn-sm btn-secondary" onClick={copyPitch}>
                                            {pitchCopied ? <Check size={12} /> : <Copy size={12} />}
                                            {pitchCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                        <button className="btn btn-sm btn-secondary" onClick={() => generatePitch(pitchModal.creatorId)} disabled={pitchLoading}>
                                            <RefreshCw size={12} /> Regenerate
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                <button className="btn btn-secondary" onClick={() => setPitchModal(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )
                }
            </div >
        );
    }

    // Campaigns List View
    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Campaigns</h1>
                    <p className="page-subtitle">Manage your influencer outreach pipelines</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    <Plus size={15} /> New Campaign
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card">
                            <div className="skeleton" style={{ width: '55%', height: 20, marginBottom: 12 }} />
                            <div className="skeleton" style={{ width: '35%', height: 13, marginBottom: 20 }} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : campaigns.length > 0 ? (
                <div className="campaign-grid">
                    {campaigns.map(c => (
                        <div
                            key={c.id}
                            className="glass-card campaign-card"
                            onClick={() => loadDetail(c.id)}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'white', letterSpacing: '-0.02em' }}>
                                        {c.name}
                                    </h3>
                                    {c.description && (
                                        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                                            {c.description}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginLeft: 10, flexShrink: 0 }}>
                                    <span className={`badge ${c.status === 'active' ? 'engagement' : 'stale'}`}>{c.status}</span>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: '4px 5px', color: '#f87171' }}
                                        onClick={e => { e.stopPropagation(); deleteCampaign(c.id); }}
                                        title="Delete campaign"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Stage Pills */}
                            <div className="campaign-stage-pills">
                                {STAGES.map(s => (
                                    <div key={s} className="campaign-stage-pill">
                                        <div className="campaign-stage-pill-value">{c.stageCounts?.[s] || 0}</div>
                                        <div className="campaign-stage-pill-label">{s}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Target size={12} />
                                    {c.stageCounts?.total || 0} creators total
                                </span>
                                <span style={{ fontSize: 12, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    View Pipeline <ChevronRight size={13} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Target size={30} />
                    </div>
                    <div className="empty-state-title">No Campaigns Yet</div>
                    <div className="empty-state-desc">
                        Create a campaign and add creators from{' '}
                        <Link href="/discover" style={{ color: '#818cf8' }}>Discover</Link>.
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}>
                        <Plus size={15} /> Create Campaign
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">
                            <Plus size={18} /> Create New Campaign
                        </h2>
                        <div className="settings-field">
                            <label className="label">Campaign Name</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. MyPal Launch Q1"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="settings-field">
                            <label className="label">Description (optional)</label>
                            <textarea
                                className="input"
                                placeholder="Campaign goals, target audience, notes..."
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={createCampaign}
                                disabled={!newName.trim() || creating}
                            >
                                {creating ? <Loader2 size={14} className="loading-spinner" /> : <Plus size={14} />}
                                Create Campaign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
