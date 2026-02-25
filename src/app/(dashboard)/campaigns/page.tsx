'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Plus, Target, Users, ChevronRight, Trash2, ArrowRight,
    Send, AtSign, Loader2, Download, Sparkles, Copy, Check, RefreshCw,
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
    new: '🆕 New', contacted: '📨 Contacted',
    negotiating: '🤝 Negotiating', partnered: '✅ Partnered',
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

    // Pitch modal state
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
        setSelectedCampaign(id); setLoadingDetail(true);
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
                body: JSON.stringify({
                    creatorId,
                    campaignId: selectedCampaign,
                    tone: pitchTone,
                    productInfo: pitchProductInfo || undefined,
                }),
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

    if (selectedCampaign) {
        const camp = campaigns.find(c => c.id === selectedCampaign);
        return (
            <div className="page-container">
                <button className="btn btn-ghost" onClick={() => setSelectedCampaign(null)} style={{ marginBottom: 16 }}>
                    ← Back to Campaigns
                </button>
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-title">{camp?.name || 'Campaign'}</h1>
                        <p className="page-subtitle">{camp?.description || 'Manage your outreach pipeline'}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => window.open(`/api/export?campaignId=${selectedCampaign}`, '_blank')}>
                        <Download size={14} /> Export CSV
                    </button>
                </div>
                {loadingDetail ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-indigo)' }} />
                    </div>
                ) : (
                    <div className="kanban-board">
                        {STAGES.map(stage => {
                            const items = campaignCreators.filter(cc => cc.stage === stage);
                            return (
                                <div key={stage} className={`kanban-column ${stage}`}>
                                    <div className="kanban-column-header">
                                        <span className="kanban-column-title">{STAGE_LABELS[stage]}</span>
                                        <span className="kanban-column-count">{items.length}</span>
                                    </div>
                                    <div className="kanban-cards">
                                        {items.map(cc => (
                                            <div key={cc.id} className="kanban-card">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                    {cc.creator.profile_pic_url ? (
                                                        <img src={cc.creator.profile_pic_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Users size={14} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <Link href={`/creators/${cc.creator.id}`} className="kanban-card-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                                                            {cc.creator.name}
                                                        </Link>
                                                        <div className="kanban-card-meta">{formatNum(cc.creator.subscribers)} subs · Score: {cc.creator.priority_score}</div>
                                                    </div>
                                                </div>
                                                <div className="kanban-card-actions">
                                                    {stage !== 'partnered' && (
                                                        <button className="btn btn-sm btn-success" onClick={() => updateStage(selectedCampaign, cc.creator.id, STAGES[STAGES.indexOf(stage) + 1])} title="Advance">
                                                            <ArrowRight size={10} />
                                                        </button>
                                                    )}
                                                    <button className="btn btn-sm btn-secondary" onClick={() => { setPitchModal({ creatorId: cc.creator.id, creatorName: cc.creator.name }); setPitchResult(null); }} title="Generate Pitch"><Sparkles size={10} /></button>
                                                    {cc.creator.telegram && <a href={cc.creator.telegram} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary"><Send size={10} /></a>}
                                                    {cc.creator.twitter && <a href={cc.creator.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary"><AtSign size={10} /></a>}
                                                    <button className="btn btn-sm btn-danger" onClick={() => removeCreator(selectedCampaign, cc.creator.id)}><Trash2 size={10} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {items.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No creators</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Campaigns</h1>
                    <p className="page-subtitle">Manage your influencer outreach pipelines</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />New Campaign</button>
            </div>

            {loading ?
                <div className="stats-grid">{[1, 2, 3].map(i => <div key={i} className="glass-card"><div className="skeleton" style={{ width: '60%', height: 20, marginBottom: 12 }} /><div className="skeleton" style={{ width: '40%', height: 14 }} /></div>)}</div>
                : campaigns.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
                        {campaigns.map(c => (
                            <div key={c.id} className="glass-card" style={{ cursor: 'pointer' }} onClick={() => loadDetail(c.id)}>
                                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</h3>
                                    <div className="flex gap-2">
                                        <span className={`badge ${c.status === 'active' ? 'engagement' : 'stale'}`}>{c.status}</span>
                                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); deleteCampaign(c.id); }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {c.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>{c.description}</p>}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                    {STAGES.map(s => <div key={s} className="creator-stat"><div className="creator-stat-value">{c.stageCounts?.[s] || 0}</div><div className="creator-stat-label">{s}</div></div>)}
                                </div>
                                <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><Target size={12} style={{ display: 'inline', marginRight: 4 }} />{c.stageCounts?.total || 0} creators</span>
                                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><Target size={48} /></div>
                        <div className="empty-state-title">No Campaigns Yet</div>
                        <div className="empty-state-desc">Create a campaign and add creators from <Link href="/discover" style={{ color: 'var(--accent-indigo)' }}>Discover</Link>.</div>
                    </div>
                )}

            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Create New Campaign</h2>
                        <div className="settings-field"><label className="label">Campaign Name</label><input type="text" className="input" placeholder="e.g. MyPal Launch Q1" value={newName} onChange={e => setNewName(e.target.value)} autoFocus /></div>
                        <div className="settings-field"><label className="label">Description</label><textarea className="input" placeholder="Campaign notes..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} /></div>
                        <div className="flex gap-2" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createCampaign} disabled={!newName.trim() || creating}>{creating ? <Loader2 size={14} /> : <Plus size={14} />}Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pitch Modal */}
            {pitchModal && (
                <div className="modal-overlay" onClick={() => setPitchModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <h2 className="modal-title"><Sparkles size={16} style={{ display: 'inline', marginRight: 8 }} />Generate Outreach Pitch</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>For <strong>{pitchModal.creatorName}</strong></p>

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
                            <label className="label">Product/Brand Info (optional)</label>
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
                            {pitchLoading ? <Loader2 size={14} className="loading-spinner" /> : <Sparkles size={14} />}
                            {pitchLoading ? 'Generating...' : pitchResult ? 'Regenerate' : 'Generate Pitch'}
                        </button>

                        {pitchResult && (
                            <div style={{ background: 'var(--bg-glass)', borderRadius: 12, padding: 16 }}>
                                <div style={{ fontSize: 12, color: 'var(--accent-indigo)', fontWeight: 600, marginBottom: 4 }}>Subject</div>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{pitchResult.subject}</div>
                                <div style={{ fontSize: 12, color: 'var(--accent-indigo)', fontWeight: 600, marginBottom: 4 }}>Message</div>
                                <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{pitchResult.pitch}</div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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

                        <div className="flex gap-2" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setPitchModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
