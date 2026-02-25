'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, Key, Info, Save, Check, AlertTriangle, Plus, Trash2, FileText, Sparkles } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    subject: string | null;
    body: string;
    platform: string;
    created_at: string;
}

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [savedYT, setSavedYT] = useState(false);
    const [savedAI, setSavedAI] = useState(false);
    const [quotaInfo, setQuotaInfo] = useState<{ used: number; remaining: number; resetTime: string } | null>(null);

    // Templates
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
        setSavedYT(true); setTimeout(() => setSavedYT(false), 3000);
    }

    function saveAIKey() {
        localStorage.setItem('openai_api_key', openaiKey);
        setSavedAI(true); setTimeout(() => setSavedAI(false), 3000);
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

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Configure your CreatorRadar system</p>
            </div>

            {/* YouTube API Key */}
            <div className="glass-card settings-section">
                <h2 className="settings-section-title">
                    <Key size={18} style={{ display: 'inline', marginRight: 8 }} />
                    YouTube API Configuration
                </h2>
                <div className="settings-field">
                    <label className="label">YouTube Data API v3 Key</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <input type="password" className="input" placeholder="Enter your YouTube API key..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn btn-primary" onClick={saveYTKey}>
                            {savedYT ? <Check size={14} /> : <Save size={14} />}
                            {savedYT ? 'Saved!' : 'Save'}
                        </button>
                    </div>
                    <p className="settings-field-desc">
                        Get your key from the{' '}
                        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-indigo)' }}>Google Cloud Console</a>.
                    </p>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 12, marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-amber)' }}>Important</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Set <code style={{ padding: '2px 6px', background: 'var(--bg-card)', borderRadius: 4, fontSize: 12 }}>YOUTUBE_API_KEY</code> in your <code style={{ padding: '2px 6px', background: 'var(--bg-card)', borderRadius: 4, fontSize: 12 }}>.env.local</code> file for server-side API calls.
                    </p>
                </div>
            </div>

            {/* OpenAI API Key */}
            <div className="glass-card settings-section">
                <h2 className="settings-section-title">
                    <Sparkles size={18} style={{ display: 'inline', marginRight: 8 }} />
                    AI Pitch Generator
                </h2>
                <div className="settings-field">
                    <label className="label">OpenAI API Key</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <input type="password" className="input" placeholder="sk-..." value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn btn-primary" onClick={saveAIKey}>
                            {savedAI ? <Check size={14} /> : <Save size={14} />}
                            {savedAI ? 'Saved!' : 'Save'}
                        </button>
                    </div>
                    <p className="settings-field-desc">
                        Set <code style={{ padding: '2px 6px', background: 'var(--bg-card)', borderRadius: 4, fontSize: 12 }}>OPENAI_API_KEY</code> in <code style={{ padding: '2px 6px', background: 'var(--bg-card)', borderRadius: 4, fontSize: 12 }}>.env.local</code>. Without it, pitches use a built-in template.
                    </p>
                </div>
            </div>

            {/* Outreach Templates */}
            <div className="glass-card settings-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 className="settings-section-title" style={{ margin: 0 }}>
                        <FileText size={18} style={{ display: 'inline', marginRight: 8 }} />
                        Outreach Templates
                    </h2>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowNewTemplate(true)}>
                        <Plus size={14} /> New Template
                    </button>
                </div>

                {showNewTemplate && (
                    <div style={{ background: 'var(--bg-glass)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                        <div className="settings-field">
                            <label className="label">Template Name</label>
                            <input type="text" className="input" placeholder="e.g. Crypto Campaign Intro" value={tplName} onChange={e => setTplName(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div className="settings-field" style={{ flex: 1 }}>
                                <label className="label">Subject Line</label>
                                <input type="text" className="input" placeholder="Partnership Opportunity" value={tplSubject} onChange={e => setTplSubject(e.target.value)} />
                            </div>
                            <div className="settings-field" style={{ width: 140 }}>
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
                            <textarea className="input" rows={4} placeholder="Hi {name}, I noticed your channel..." value={tplBody} onChange={e => setTplBody(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowNewTemplate(false)}>Cancel</button>
                            <button className="btn btn-sm btn-primary" onClick={createTemplate} disabled={!tplName.trim() || !tplBody.trim()}>
                                <Save size={12} /> Save Template
                            </button>
                        </div>
                    </div>
                )}

                {templates.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {templates.map(t => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 8 }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {t.platform === 'email' ? '📧' : t.platform === 'telegram' ? '✈️' : '🐦'} {t.platform} · {t.subject || 'No subject'}
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteTemplate(t.id)}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                        No templates yet. Create one to speed up your outreach!
                    </p>
                )}
            </div>

            {/* Quota Info */}
            <div className="glass-card settings-section">
                <h2 className="settings-section-title">
                    <Info size={18} style={{ display: 'inline', marginRight: 8 }} />
                    Quota Information
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div className="stat-card">
                        <div className="stat-card-icon emerald"><Settings size={18} /></div>
                        <div className="stat-card-value">{quotaInfo?.remaining?.toLocaleString() || '10,000'}</div>
                        <div className="stat-card-label">Units Remaining</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon amber"><Settings size={18} /></div>
                        <div className="stat-card-value">{quotaInfo?.used?.toLocaleString() || '0'}</div>
                        <div className="stat-card-label">Units Used Today</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon indigo"><Settings size={18} /></div>
                        <div className="stat-card-value">{quotaInfo?.resetTime || '—'}</div>
                        <div className="stat-card-label">Resets In</div>
                    </div>
                </div>
                <div style={{ marginTop: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Cost Breakdown</h3>
                    <table className="data-table">
                        <thead><tr><th>Operation</th><th>Cost</th><th>Notes</th></tr></thead>
                        <tbody>
                            <tr><td>Channel Search</td><td><span className="badge stale">100 units</span></td><td>Per search query</td></tr>
                            <tr><td>Channel Details</td><td><span className="badge engagement">1 unit</span></td><td>Up to 50 channels</td></tr>
                            <tr><td>Video Search</td><td><span className="badge stale">100 units</span></td><td>Per channel</td></tr>
                            <tr><td>Video Details</td><td><span className="badge engagement">1 unit</span></td><td>Batch stats</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* About */}
            <div className="glass-card settings-section">
                <h2 className="settings-section-title">About CreatorRadar</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    <strong>CreatorRadar</strong> — High-performance influencer discovery engine for identifying, scoring,
                    and managing high-ROI YouTube micro-influencers.
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span className="badge active">Next.js 14</span>
                    <span className="badge engagement">Supabase</span>
                    <span className="badge micro">YouTube API v3</span>
                    <span className="badge stale">OpenAI</span>
                </div>
            </div>
        </div>
    );
}
