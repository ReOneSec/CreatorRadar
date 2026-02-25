'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Settings, Key, Info, Save, Check, AlertTriangle,
    Plus, Trash2, FileText, Sparkles, ShieldCheck, Activity,
    ExternalLink, BarChart3,
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
    email: '📧',
    telegram: '✈️',
    twitter: '🐦',
};

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [savedYT, setSavedYT] = useState(false);
    const [savedAI, setSavedAI] = useState(false);
    const [quotaInfo, setQuotaInfo] = useState<{ used: number; remaining: number; resetTime: string; total: number } | null>(null);

    const [templates, setTemplates] = useState<Template[]>([]);
    const [showNewTemplate, setShowNewTemplate] = useState(false);
    const [tplName, setTplName] = useState('');
    const [tplSubject, setTplSubject] = useState('');
    const [tplBody, setTplBody] = useState('');
    const [tplPlatform, setTplPlatform] = useState('email');

    useEffect(() => {
        const storedKey = localStorage.getItem('youtube_api_key');
        if (storedKey) setApiKey(storedKey);
        const storedAI = localStorage.getItem('openai_api_key');
        if (storedAI) setOpenaiKey(storedAI);
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

    function saveYTKey() {
        localStorage.setItem('youtube_api_key', apiKey);
        setSavedYT(true);
        setTimeout(() => setSavedYT(false), 3000);
    }

    function saveAIKey() {
        localStorage.setItem('openai_api_key', openaiKey);
        setSavedAI(true);
        setTimeout(() => setSavedAI(false), 3000);
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

    const quotaPercent = quotaInfo
        ? Math.round(((quotaInfo.total - quotaInfo.used) / quotaInfo.total) * 100)
        : 100;

    return (
        <div className="page-container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Configure your CreatorRadar system</p>
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

                    <div className="settings-field">
                        <label className="label">YouTube Data API v3 Key</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                type="password"
                                className="input"
                                placeholder="AIza..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" onClick={saveYTKey} style={{ minWidth: 94 }}>
                                {savedYT ? <Check size={15} /> : <Save size={15} />}
                                {savedYT ? 'Saved!' : 'Save'}
                            </button>
                        </div>
                        <p className="settings-field-desc">
                            Get your key from the{' '}
                            <a
                                href="https://console.cloud.google.com/apis/credentials"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                            >
                                Google Cloud Console <ExternalLink size={11} />
                            </a>
                        </p>
                    </div>

                    <div className="alert-box warning">
                        <AlertTriangle size={15} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <div className="alert-box-title">Important</div>
                            <p className="alert-box-text">
                                Also set <code>YOUTUBE_API_KEY</code> in your <code>.env.local</code> file for server-side API calls. The key saved here is only used for client-side features.
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

                    <div className="settings-field">
                        <label className="label">OpenAI API Key</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                type="password"
                                className="input"
                                placeholder="sk-..."
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" onClick={saveAIKey} style={{ minWidth: 94 }}>
                                {savedAI ? <Check size={15} /> : <Save size={15} />}
                                {savedAI ? 'Saved!' : 'Save'}
                            </button>
                        </div>
                        <p className="settings-field-desc">
                            Also set <code>OPENAI_API_KEY</code> in <code>.env.local</code> for server-side pitch generation. Without it, pitches use a built-in template.
                        </p>
                    </div>
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
                        <div style={{
                            background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-glass)',
                            borderRadius: 12, padding: 18, marginBottom: 16,
                        }}>
                            <div className="settings-field">
                                <label className="label">Template Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Crypto Campaign Intro"
                                    value={tplName}
                                    onChange={e => setTplName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                                <div className="settings-field">
                                    <label className="label">Subject Line</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Partnership Opportunity"
                                        value={tplSubject}
                                        onChange={e => setTplSubject(e.target.value)}
                                    />
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
                                <textarea
                                    className="input"
                                    rows={4}
                                    placeholder="Hi {name}, I noticed your channel..."
                                    value={tplBody}
                                    onChange={e => setTplBody(e.target.value)}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => setShowNewTemplate(false)}>Cancel</button>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={createTemplate}
                                    disabled={!tplName.trim() || !tplBody.trim()}
                                >
                                    <Save size={12} /> Save Template
                                </button>
                            </div>
                        </div>
                    )}

                    {templates.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 16px', background: 'rgba(255,255,255,0.025)',
                                        border: '1px solid var(--border-glass)', borderRadius: 10,
                                        transition: 'border-color 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 18 }}>{PLATFORM_ICONS[t.platform] || '📄'}</span>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{t.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                {t.platform} · {t.subject || 'No subject line'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => deleteTemplate(t.id)}
                                    >
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

                {/* Quota Information */}
                <div className="glass-card settings-section">
                    <h2 className="settings-section-title">
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Activity size={15} style={{ color: '#818cf8' }} />
                        </div>
                        Quota & Usage
                    </h2>

                    {/* Quota Bar */}
                    {quotaInfo && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    Daily API Quota
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                                    {quotaInfo.remaining.toLocaleString()} / {(quotaInfo.total || 10000).toLocaleString()} remaining
                                </span>
                            </div>
                            <div className="quota-bar" style={{ height: 8 }}>
                                <div
                                    className={`quota-bar-fill ${quotaPercent <= 20 ? 'danger' : quotaPercent <= 50 ? 'warning' : ''}`}
                                    style={{ width: `${quotaPercent}%` }}
                                />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                                Resets in {quotaInfo.resetTime}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
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

                    {/* Cost Breakdown */}
                    <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'white', marginBottom: 12 }}>API Cost Breakdown</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Operation</th>
                                <th>Cost</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Channel Search</td>
                                <td><span className="badge stale">100 units</span></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>Per search query</td>
                            </tr>
                            <tr>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Channel Details</td>
                                <td><span className="badge engagement">1 unit</span></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>Up to 50 channels/batch</td>
                            </tr>
                            <tr>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Video Search</td>
                                <td><span className="badge stale">100 units</span></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>Per channel</td>
                            </tr>
                            <tr>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Video Details</td>
                                <td><span className="badge engagement">1 unit</span></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>Batch stats</td>
                            </tr>
                        </tbody>
                    </table>
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
                </div>
            </div>
        </div>
    );
}
