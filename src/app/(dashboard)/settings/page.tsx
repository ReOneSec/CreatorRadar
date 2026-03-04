'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Settings, Key, Info, Save, Check, AlertTriangle,
    Plus, Trash2, FileText, Sparkles, ShieldCheck, Activity,
    ExternalLink, BarChart3, Eye, EyeOff, Lock,
} from 'lucide-react';

interface Template {
    id: string;
    name: string;
    subject: string | null;
    body: string;
    platform: string;
    created_at: string;
}

const PLATFORM_ICONS: Record<string, string> = {
    email: '📧', telegram: '✈️', twitter: '🐦',
};

interface KeyState {
    value: string;
    masked: string | null;
    isSaved: boolean;
    showRaw: boolean;
}

export default function SettingsPage() {
    const [ytKey, setYtKey] = useState<KeyState>({ value: '', masked: null, isSaved: false, showRaw: false });
    const [aiKey, setAiKey] = useState<KeyState>({ value: '', masked: null, isSaved: false, showRaw: false });
    const [savingYT, setSavingYT] = useState(false);
    const [savingAI, setSavingAI] = useState(false);
    const [quotaInfo, setQuotaInfo] = useState<{ used: number; remaining: number; resetTime: string; total: number } | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showNewTemplate, setShowNewTemplate] = useState(false);
    const [tplName, setTplName] = useState('');
    const [tplSubject, setTplSubject] = useState('');
    const [tplBody, setTplBody] = useState('');
    const [tplPlatform, setTplPlatform] = useState('email');

    // Load keys from DB on mount
    useEffect(() => {
        fetch('/api/settings/keys').then(r => r.json()).then(data => {
            if (data.youtube_key_masked) setYtKey(prev => ({ ...prev, masked: data.youtube_key_masked }));
            if (data.openai_key_masked) setAiKey(prev => ({ ...prev, masked: data.openai_key_masked }));
        }).catch(console.error);
        fetch('/api/quota').then(r => r.json()).then(setQuotaInfo).catch(console.error);
    }, []);

    const loadTemplates = useCallback(async () => {
        try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadTemplates(); }, [loadTemplates]);

    async function saveYTKey() {
        if (!ytKey.value.trim()) return;
        setSavingYT(true);
        try {
            await fetch('/api/settings/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtube_api_key: ytKey.value.trim() }),
            });
            const masked = ytKey.value.substring(0, 6) + '...' + ytKey.value.substring(ytKey.value.length - 4);
            setYtKey(prev => ({ ...prev, value: '', masked, isSaved: true }));
            setTimeout(() => setYtKey(prev => ({ ...prev, isSaved: false })), 3000);
        } finally { setSavingYT(false); }
    }

    async function saveAIKey() {
        if (!aiKey.value.trim()) return;
        setSavingAI(true);
        try {
            await fetch('/api/settings/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openai_api_key: aiKey.value.trim() }),
            });
            const masked = aiKey.value.substring(0, 5) + '...' + aiKey.value.substring(aiKey.value.length - 4);
            setAiKey(prev => ({ ...prev, value: '', masked, isSaved: true }));
            setTimeout(() => setAiKey(prev => ({ ...prev, isSaved: false })), 3000);
        } finally { setSavingAI(false); }
    }

    async function createTemplate() {
        if (!tplName.trim() || !tplBody.trim()) return;
        await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tplName, subject: tplSubject, body: tplBody, platform: tplPlatform }),
        });
        setTplName(''); setTplSubject(''); setTplBody(''); setTplPlatform('email');
        setShowNewTemplate(false);
        loadTemplates();
    }

    async function deleteTemplate(id: string) {
        await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
        setTemplates(prev => prev.filter(t => t.id !== id));
    }

    const quotaPercent = quotaInfo ? Math.round(((quotaInfo.total - quotaInfo.used) / quotaInfo.total) * 100) : 100;

    function KeyInput({ state, setState, placeholder, onSave, saving, label, color, icon }: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state: KeyState; setState: any; placeholder: string; onSave: () => void;
        saving: boolean; label: string; color: string; icon: React.ReactNode;
    }) {
        return (
            <div className="settings-field">
                <label className="label">{label}</label>
                {state.masked && !state.value ? (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                        }}>
                            <Lock size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                            <code style={{ color: '#34d399', fontSize: 13.5, fontFamily: 'monospace' }}>{state.masked}</code>
                            <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 20 }}>Saved ✓</span>
                        </div>
                        <button className="btn btn-sm btn-secondary" onClick={() => setState((p: KeyState) => ({ ...p, masked: null, value: '' }))}>
                            Update
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type={state.showRaw ? 'text' : 'password'} className="input"
                                placeholder={placeholder} value={state.value}
                                onChange={e => setState((p: KeyState) => ({ ...p, value: e.target.value }))}
                                style={{ paddingRight: 40 }}
                            />
                            <button type="button" onClick={() => setState((p: KeyState) => ({ ...p, showRaw: !p.showRaw }))}
                                style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                }}>
                                {state.showRaw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        <button className={`btn ${state.isSaved ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={onSave} disabled={!state.value.trim() || saving} style={{ minWidth: 94 }}>
                            {state.isSaved ? <><Check size={15} /> Saved!</> : saving ? 'Saving...' : <><Save size={15} /> Save</>}
                        </button>
                    </div>
                )}
                {icon}
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Configure your CreatorRadar workspace</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                {/* YouTube API Key */}
                <div className="glass-card settings-section">
                    <h2 className="settings-section-title">
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Key size={15} style={{ color: '#f87171' }} />
                        </div>
                        YouTube API Configuration
                    </h2>

                    <KeyInput
                        state={ytKey} setState={setYtKey} placeholder="AIza..."
                        onSave={saveYTKey} saving={savingYT} label="YouTube Data API v3 Key"
                        color="#f87171"
                        icon={
                            <p className="settings-field-desc">
                                Get your key from the{' '}
                                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
                                    style={{ color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    Google Cloud Console <ExternalLink size={11} />
                                </a>. Your key is stored securely in the database and never exposed to other users.
                            </p>
                        }
                    />

                    <div className="alert-box warning">
                        <AlertTriangle size={15} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <div className="alert-box-title">Quota Saver Active</div>
                            <p className="alert-box-text">
                                Your search results are shared in a 48-hour anonymous cache. If another user already searched the same query, you won&apos;t use any quota at all.
                            </p>
                        </div>
                    </div>
                </div>

                {/* OpenAI API Key */}
                <div className="glass-card settings-section">
                    <h2 className="settings-section-title">
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={15} style={{ color: '#c084fc' }} />
                        </div>
                        AI Pitch Generator
                    </h2>

                    <KeyInput
                        state={aiKey} setState={setAiKey} placeholder="sk-..."
                        onSave={saveAIKey} saving={savingAI} label="OpenAI API Key"
                        color="#c084fc"
                        icon={
                            <p className="settings-field-desc">
                                Required for AI-powered pitch generation using GPT-4o mini. Without it, pitches use a built-in template. Keys are encrypted at rest.
                            </p>
                        }
                    />
                </div>

                {/* Outreach Templates */}
                <div className="glass-card settings-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 className="settings-section-title" style={{ margin: 0 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={15} style={{ color: '#22d3ee' }} />
                            </div>
                            Outreach Templates
                        </h2>
                        <button className="btn btn-sm btn-primary" onClick={() => setShowNewTemplate(!showNewTemplate)}>
                            <Plus size={13} /> New Template
                        </button>
                    </div>

                    {showNewTemplate && (
                        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
                            <div className="settings-field">
                                <label className="label">Template Name</label>
                                <input type="text" className="input" placeholder="e.g. Crypto Campaign Intro"
                                    value={tplName} onChange={e => setTplName(e.target.value)} autoFocus />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                                <div className="settings-field">
                                    <label className="label">Subject Line</label>
                                    <input type="text" className="input" placeholder="Partnership Opportunity"
                                        value={tplSubject} onChange={e => setTplSubject(e.target.value)} />
                                </div>
                                <div className="settings-field">
                                    <label className="label">Platform</label>
                                    <select className="input" value={tplPlatform} onChange={e => setTplPlatform(e.target.value)}>
                                        <option value="email">📧 Email</option>
                                        <option value="telegram">✈️ Telegram</option>
                                        <option value="twitter">🐦 Twitter</option>
                                    </select>
                                </div>
                            </div>
                            <div className="settings-field">
                                <label className="label">Message Body</label>
                                <textarea className="input" rows={4} placeholder="Hi {name}, I noticed your channel..."
                                    value={tplBody} onChange={e => setTplBody(e.target.value)} style={{ resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => setShowNewTemplate(false)}>Cancel</button>
                                <button className="btn btn-sm btn-primary" onClick={createTemplate}
                                    disabled={!tplName.trim() || !tplBody.trim()}>
                                    <Save size={12} /> Save Template
                                </button>
                            </div>
                        </div>
                    )}

                    {templates.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {templates.map(t => (
                                <div key={t.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', background: 'rgba(255,255,255,0.025)',
                                    border: '1px solid var(--border-glass)', borderRadius: 10,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 18 }}>{PLATFORM_ICONS[t.platform] || '📄'}</span>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{t.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                {t.platform} · {t.subject || 'No subject line'}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-sm btn-danger" onClick={() => deleteTemplate(t.id)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : !showNewTemplate && (
                        <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: 13.5 }}>
                            <FileText size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                            <div>No templates yet. Create one to speed up your outreach!</div>
                        </div>
                    )}
                </div>

                {/* Quota Info */}
                <div className="glass-card settings-section">
                    <h2 className="settings-section-title">
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Activity size={15} style={{ color: '#818cf8' }} />
                        </div>
                        Quota &amp; Usage
                    </h2>
                    {quotaInfo && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Daily API Quota</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                                    {quotaInfo.remaining.toLocaleString()} / {(quotaInfo.total || 10000).toLocaleString()} remaining
                                </span>
                            </div>
                            <div className="quota-bar" style={{ height: 8 }}>
                                <div className={`quota-bar-fill ${quotaPercent <= 20 ? 'danger' : quotaPercent <= 50 ? 'warning' : ''}`}
                                    style={{ width: `${quotaPercent}%` }} />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Resets in {quotaInfo.resetTime}</div>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div className="stat-card" style={{ padding: 16 }}>
                            <div className="stat-card-icon emerald"><BarChart3 size={16} /></div>
                            <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{quotaInfo?.remaining?.toLocaleString() || '10,000'}</div>
                            <div className="stat-card-label">Units Remaining</div>
                        </div>
                        <div className="stat-card" style={{ padding: 16 }}>
                            <div className="stat-card-icon amber"><Activity size={16} /></div>
                            <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{quotaInfo?.used?.toLocaleString() || '0'}</div>
                            <div className="stat-card-label">Units Used Today</div>
                        </div>
                        <div className="stat-card" style={{ padding: 16 }}>
                            <div className="stat-card-icon indigo"><Settings size={16} /></div>
                            <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{quotaInfo?.resetTime || '—'}</div>
                            <div className="stat-card-label">Resets In</div>
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="glass-card settings-section">
                    <h2 className="settings-section-title">
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={15} style={{ color: '#34d399' }} />
                        </div>
                        About CreatorRadar
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 16 }}>
                        <strong style={{ color: 'white' }}>CreatorRadar</strong> — High-performance influencer discovery engine for identifying, scoring, and managing high-ROI YouTube micro-influencers. Built for marketers who need data-driven decisions.
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge active">Next.js 15</span>
                        <span className="badge engagement">Supabase</span>
                        <span className="badge micro">YouTube API v3</span>
                        <span className="badge stale">OpenAI</span>
                        <span className="badge engagement">Tailwind v4</span>
                    </div>
                    <div className="alert-box" style={{ marginTop: 16, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Info size={15} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
                        <p className="alert-box-text" style={{ color: 'var(--text-secondary)' }}>
                            Your API keys are stored securely in our database with row-level security. Only you can read your own keys — not even admins can see the actual key values.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
