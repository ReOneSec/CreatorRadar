'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Search,
    SlidersHorizontal,
    Users,
    Eye,
    Star,
    MessageCircle,
    AtSign,
    Mail,
    Send,
    Plus,
    Loader2,
    Download,
    Facebook,
    MessageSquare,
    Globe,
    Youtube,
    X,
    Database,
    Sparkles,
    Languages,
    MapPin,
} from 'lucide-react';

interface Creator {
    id?: string;
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
    telegram: string | null;
    twitter: string | null;
    instagram: string | null;
    facebook: string | null;
    whatsapp: string | null;
    website: string | null;
    email: string | null;
    country: string | null;
    custom_url: string | null;
}

// ── Filter Config ────────────────────────────────────────────────────────────

const LANGUAGES = [
    { label: 'English', code: 'en' },
    { label: 'Hindi', code: 'hi' },
    { label: 'Bangla', code: 'bn' },
];

const REGIONS = [
    { name: 'India', code: 'IN' },
    { name: 'Bangladesh', code: 'BD' },
    { name: 'USA', code: 'US' },
    { name: 'Pakistan', code: 'PK' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'Vietnam', code: 'VN' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Philippines', code: 'PH' },
    { name: 'Japan', code: 'JP' },
    { name: 'South Korea', code: 'KR' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Sri Lanka', code: 'LK' },
    { name: 'Nepal', code: 'NP' },
    { name: 'Turkey', code: 'TR' },
    { name: 'UAE', code: 'AE' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'UK', code: 'GB' },
    { name: 'Canada', code: 'CA' },
];

const MAX_COMBINATIONS = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor((num / 1000) * 10) / 10}K`;
    return num.toLocaleString();
}

function getScoreClass(score: number): string {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

function getBadges(creator: Creator): Array<{ text: string; className: string }> {
    const badges: Array<{ text: string; className: string }> = [];
    if (creator.engagement_rate >= 5) badges.push({ text: 'High Engagement', className: 'engagement' });
    if (creator.subscribers <= 10000) badges.push({ text: 'Micro-Tier', className: 'micro' });
    if (creator.subscribers > 10000 && creator.subscribers <= 100000)
        badges.push({ text: 'Mid-Tier', className: 'active' });
    if (creator.telegram || creator.twitter) badges.push({ text: 'Has Socials', className: 'active' });
    return badges;
}

// ── Multi-Select Checkbox Component ─────────────────────────────────────────

function MultiCheckbox({
    options,
    selected,
    onChange,
}: {
    options: { label?: string; name?: string; code: string }[];
    selected: string[];
    onChange: (code: string) => void;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {options.map(opt => {
                const label = opt.label ?? opt.name ?? opt.code;
                const isChecked = selected.includes(opt.code);
                return (
                    <label
                        key={opt.code}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            cursor: 'pointer', padding: '4px 6px', borderRadius: 7,
                            background: isChecked ? 'rgba(99,102,241,0.10)' : 'transparent',
                            border: `1px solid ${isChecked ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
                            transition: 'all 0.15s',
                            fontSize: 12.5, color: isChecked ? '#a5b4fc' : 'var(--text-secondary)',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onChange(opt.code)}
                            style={{ accentColor: '#818cf8', width: 13, height: 13, cursor: 'pointer' }}
                        />
                        {label}
                        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.55, fontFamily: 'monospace' }}>
                            {opt.code}
                        </span>
                    </label>
                );
            })}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
    const [query, setQuery] = useState('');
    const [minSubs, setMinSubs] = useState('');
    const [maxSubs, setMaxSubs] = useState('');

    // Multi-select state
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    const [results, setResults] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [searchSteps, setSearchSteps] = useState<Array<{ step: string; message: string; done: boolean }>>([]);

    // Campaign modal
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
    const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [newCampaignName, setNewCampaignName] = useState('');

    // ── Toggle helpers ──────────────────────────────────────────────────────
    function toggleRegion(code: string) {
        setSelectedRegions(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    }

    function toggleLanguage(code: string) {
        setSelectedLanguages(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    }

    function clearFilters() {
        setMinSubs('');
        setMaxSubs('');
        setSelectedRegions([]);
        setSelectedLanguages([]);
    }

    const combinations = Math.max(selectedRegions.length, 1) * Math.max(selectedLanguages.length, 1);
    const tooManyCombinations = combinations > MAX_COMBINATIONS;
    const hasActiveFilters = minSubs || maxSubs || selectedRegions.length > 0 || selectedLanguages.length > 0;

    // ── Search ──────────────────────────────────────────────────────────────
    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;

        // Client-side quota guard
        if (tooManyCombinations) {
            setError(
                `⚠️ Too many filter combinations (${combinations}). ` +
                `Select at most ${MAX_COMBINATIONS} language × region pairs to protect your daily quota.`
            );
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);
        setResults([]);
        setSearchSteps([]);

        const params = new URLSearchParams({ query: query.trim() });
        if (minSubs) params.set('minSubs', minSubs);
        if (maxSubs) params.set('maxSubs', maxSubs);
        if (selectedRegions.length > 0) params.set('regions', selectedRegions.join(','));
        if (selectedLanguages.length > 0) params.set('languages', selectedLanguages.join(','));

        try {
            const eventSource = new EventSource(`/api/search/stream?${params}`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.step === 'error') {
                    setError(data.message);
                    setLoading(false);
                    eventSource.close();
                    return;
                }

                if (data.step === 'done') {
                    setResults(data.creators || []);
                    setSearchSteps(prev => prev.map(s => ({ ...s, done: true })));
                    if (data.creators?.length === 0) {
                        setError('No creators found matching your criteria.');
                    }
                    setLoading(false);
                    eventSource.close();
                    return;
                }

                setSearchSteps(prev => {
                    const existing = prev.find(s => s.step === data.step);
                    if (existing) {
                        return prev.map(s => s.step === data.step ? { ...s, message: data.message } : s);
                    }
                    const updated = prev.map(s => ({ ...s, done: true }));
                    return [...updated, { step: data.step, message: data.message, done: false }];
                });
            };

            eventSource.onerror = () => {
                setError('Connection lost. Please try again.');
                setLoading(false);
                eventSource.close();
            };
        } catch (err) {
            setError('Network error. Please try again.');
            console.error(err);
            setLoading(false);
        }
    }

    async function loadFromDatabase() {
        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const params = new URLSearchParams();
            params.set('limit', '50');
            params.set('sort', 'priority_score');
            params.set('order', 'desc');
            if (minSubs) params.set('minSubs', minSubs);
            if (maxSubs) params.set('maxSubs', maxSubs);
            if (query) params.set('search', query);

            const res = await fetch(`/api/creators?${params}`);
            const data = await res.json();
            setResults(data.creators || []);
            if ((data.creators || []).length === 0) {
                setError('No creators in database yet. Run a YouTube search first!');
            }
        } catch (err) {
            setError('Failed to load from database.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function toggleCreatorSelection(creatorId: string) {
        setSelectedCreators((prev) =>
            prev.includes(creatorId) ? prev.filter((id) => id !== creatorId) : [...prev, creatorId]
        );
    }

    async function openCampaignModal() {
        try {
            const res = await fetch('/api/campaigns');
            const data = await res.json();
            setCampaigns(data.campaigns || []);
        } catch (err) { console.error(err); }
        setShowCampaignModal(true);
    }

    async function addToCampaign() {
        let campaignId = selectedCampaign;
        if (newCampaignName) {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCampaignName }),
            });
            const data = await res.json();
            campaignId = data.campaign.id;
        }
        if (!campaignId) return;
        await fetch(`/api/campaigns/${campaignId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addCreators: selectedCreators }),
        });
        setShowCampaignModal(false);
        setSelectedCreators([]);
        setNewCampaignName('');
        setSelectedCampaign('');
    }

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="page-container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Discovery Engine</h1>
                    <p className="page-subtitle">Search YouTube for high-ROI micro-influencers</p>
                </div>
                {selectedCreators.length > 0 && (
                    <button className="btn btn-primary" onClick={openCampaignModal}>
                        <Plus size={15} />
                        Add {selectedCreators.length} to Campaign
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <Search size={17} className="input-icon" />
                        <input
                            type="text"
                            className="input search-input-lg input-with-icon"
                            placeholder="Search creators... e.g. 'Crypto Review India', 'Tech Unboxing'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !query.trim() || tooManyCombinations}
                        style={{ minWidth: 148 }}
                    >
                        {loading ? <Loader2 size={15} className="loading-spinner" /> : <Search size={15} />}
                        {loading ? 'Searching...' : 'Search YouTube'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={loadFromDatabase}
                        disabled={loading}
                        style={{ minWidth: 130 }}
                    >
                        <Database size={14} />
                        Load from DB
                    </button>
                    <button
                        type="button"
                        className={`btn btn-secondary btn-icon ${showFilters ? 'btn-primary' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        title="Toggle Filters"
                        style={{ background: showFilters ? 'rgba(99,102,241,0.15)' : undefined, borderColor: showFilters ? 'rgba(99,102,241,0.4)' : undefined }}
                    >
                        <SlidersHorizontal size={17} style={{ color: showFilters ? '#818cf8' : undefined }} />
                    </button>
                </div>
            </form>

            {/* Quota combo warning banner */}
            {tooManyCombinations && (
                <div style={{
                    marginBottom: 16, padding: '12px 16px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <Sparkles size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                    <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>
                        <strong>{combinations} combinations</strong> selected. Maximum is {MAX_COMBINATIONS} (language × region) to protect your 10,000-unit daily quota.
                        Please deselect some languages or regions.
                    </p>
                </div>
            )}

            <div className="discover-layout">
                {/* Filter Sidebar */}
                {showFilters && (
                    <div className="discover-filters">
                        <div className="glass-card" style={{ padding: 18 }}>
                            {/* Filter header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 7, color: 'white' }}>
                                    <SlidersHorizontal size={14} style={{ color: '#818cf8' }} />
                                    Filters
                                </h3>
                                {hasActiveFilters && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={clearFilters}
                                        style={{ fontSize: 11 }}
                                    >
                                        <X size={11} /> Clear
                                    </button>
                                )}
                            </div>

                            {/* Combination indicator */}
                            {(selectedRegions.length > 0 || selectedLanguages.length > 0) && (
                                <div style={{
                                    marginBottom: 14, padding: '7px 10px',
                                    background: tooManyCombinations ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)',
                                    border: `1px solid ${tooManyCombinations ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.2)'}`,
                                    borderRadius: 8, fontSize: 11.5,
                                    color: tooManyCombinations ? '#f87171' : '#a5b4fc',
                                }}>
                                    {combinations} API call{combinations !== 1 ? 's' : ''} · {combinations * 201} units
                                    {tooManyCombinations && ' ⚠️ Over limit'}
                                </div>
                            )}

                            {/* Subscriber Range */}
                            <div className="filter-section">
                                <div className="filter-section-title">Subscriber Range</div>
                                <div className="range-inputs">
                                    <div>
                                        <label className="label">Min</label>
                                        <input
                                            type="number"
                                            className="input input-sm"
                                            placeholder="0"
                                            value={minSubs}
                                            onChange={(e) => setMinSubs(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Max</label>
                                        <input
                                            type="number"
                                            className="input input-sm"
                                            placeholder="∞"
                                            value={maxSubs}
                                            onChange={(e) => setMaxSubs(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Subscriber Presets */}
                            <div className="filter-section">
                                <div className="filter-section-title">Quick Filters</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {[
                                        { label: 'Micro (0–10K)', min: '0', max: '10000' },
                                        { label: 'Mid-Tier (10K–100K)', min: '10000', max: '100000' },
                                        { label: 'Macro (100K+)', min: '100000', max: '' },
                                    ].map(preset => (
                                        <button
                                            key={preset.label}
                                            className="btn btn-ghost btn-sm"
                                            style={{
                                                justifyContent: 'flex-start', fontSize: 12,
                                                background: minSubs === preset.min && maxSubs === preset.max ? 'rgba(99,102,241,0.1)' : undefined,
                                                color: minSubs === preset.min && maxSubs === preset.max ? '#818cf8' : undefined,
                                            }}
                                            onClick={() => { setMinSubs(preset.min); setMaxSubs(preset.max); }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language — Multi-Select */}
                            <div className="filter-section">
                                <div className="filter-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Languages size={12} style={{ color: '#818cf8' }} />
                                    Language
                                    {selectedLanguages.length > 0 && (
                                        <span className="badge active" style={{ fontSize: 10, marginLeft: 'auto' }}>
                                            {selectedLanguages.length} selected
                                        </span>
                                    )}
                                </div>
                                <MultiCheckbox
                                    options={LANGUAGES}
                                    selected={selectedLanguages}
                                    onChange={toggleLanguage}
                                />
                            </div>

                            {/* Region (Country) — Multi-Select */}
                            <div className="filter-section">
                                <div className="filter-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <MapPin size={12} style={{ color: '#818cf8' }} />
                                    Region
                                    {selectedRegions.length > 0 && (
                                        <span className="badge active" style={{ fontSize: 10, marginLeft: 'auto' }}>
                                            {selectedRegions.length} selected
                                        </span>
                                    )}
                                </div>
                                <MultiCheckbox
                                    options={REGIONS}
                                    selected={selectedRegions}
                                    onChange={toggleRegion}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="discover-results">
                    {/* Error State */}
                    {error && !loading && (
                        <div style={{
                            marginBottom: 16, padding: '14px 18px',
                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10
                        }}>
                            <Sparkles size={15} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                            <p style={{ color: 'var(--accent-amber)', fontSize: 14, margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {/* Loading / Progress */}
                    {loading && (
                        <div className="glass-card" style={{ padding: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                <Loader2 size={16} className="loading-spinner" style={{ color: '#818cf8' }} />
                                <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                                    Searching YouTube
                                    {combinations > 1 ? ` (${combinations} parallel requests)` : ''}...
                                </span>
                            </div>
                            <div className="loading-steps">
                                {searchSteps.map((s, i) => (
                                    <div key={i} className="loading-step">
                                        <div className={`loading-step-dot ${s.done ? 'done' : 'active'}`}>
                                            {s.done ? '✓' : <Loader2 size={12} className="loading-spinner" />}
                                        </div>
                                        <span style={{ fontSize: 13.5, color: s.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                            {s.message}
                                        </span>
                                    </div>
                                ))}
                                {searchSteps.length === 0 && (
                                    <div className="loading-step">
                                        <div className="loading-step-dot active">
                                            <Loader2 size={12} className="loading-spinner" />
                                        </div>
                                        <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                                            Starting search pipeline...
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results Grid */}
                    {!loading && results.length > 0 && (
                        <>
                            <div className="results-bar">
                                <span className="results-count">
                                    Found <strong>{results.length}</strong> creators
                                    {(selectedRegions.length > 0 || selectedLanguages.length > 0) && (
                                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 8 }}>
                                            · {[
                                                selectedLanguages.length > 0 && selectedLanguages.map(l => LANGUAGES.find(x => x.code === l)?.label ?? l).join(', '),
                                                selectedRegions.length > 0 && selectedRegions.join(', '),
                                            ].filter(Boolean).join(' · ')}
                                        </span>
                                    )}
                                </span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {selectedCreators.length > 0 && (
                                        <span className="badge active">{selectedCreators.length} selected</span>
                                    )}
                                    <button className="btn btn-sm btn-secondary" onClick={() => window.open('/api/export', '_blank')}>
                                        <Download size={12} />
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="creator-results-grid">
                                {results.map((creator, index) => {
                                    const isSelected = selectedCreators.includes(creator.id || creator.youtube_id);
                                    return (
                                        <div
                                            key={creator.youtube_id || index}
                                            className="creator-card"
                                            style={{
                                                borderColor: isSelected ? 'rgba(99,102,241,0.55)' : undefined,
                                                boxShadow: isSelected ? '0 0 0 2px rgba(99,102,241,0.15)' : undefined,
                                            }}
                                        >
                                            {/* Checkbox */}
                                            {creator.id && (
                                                <div
                                                    className="checkbox-container"
                                                    onClick={(e) => { e.stopPropagation(); toggleCreatorSelection(creator.id!); }}
                                                >
                                                    <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                                                        {isSelected && '✓'}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Header */}
                                            <div className="creator-card-header">
                                                {creator.profile_pic_url ? (
                                                    <img src={creator.profile_pic_url} alt={creator.name} className="creator-avatar" />
                                                ) : (
                                                    <div className="creator-avatar" style={{ background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Users size={22} style={{ color: 'var(--text-muted)' }} />
                                                    </div>
                                                )}
                                                <div className="creator-info">
                                                    <div className="creator-name">{creator.name}</div>
                                                    <div className="creator-handle" style={{ color: '#818cf8', fontWeight: 500 }}>
                                                        {creator.country ? `📍 ${creator.country}` : 'Global Channel'}
                                                    </div>
                                                </div>
                                                <div className={`creator-score ${getScoreClass(creator.priority_score)}`}>
                                                    {creator.priority_score}
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            {getBadges(creator).length > 0 && (
                                                <div className="creator-badges">
                                                    {getBadges(creator).map((badge, i) => (
                                                        <span key={i} className={`badge ${badge.className}`}>
                                                            {badge.text}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Stats */}
                                            <div className="creator-stats">
                                                <div className="creator-stat">
                                                    <div className="creator-stat-value">{formatNumber(creator.subscribers)}</div>
                                                    <div className="creator-stat-label">Subscribers</div>
                                                </div>
                                                <div className="creator-stat">
                                                    <div className="creator-stat-value">{formatNumber(creator.avg_views)}</div>
                                                    <div className="creator-stat-label">Avg Views</div>
                                                </div>
                                                <div className="creator-stat">
                                                    <div className="creator-stat-value">{creator.engagement_rate.toFixed(1)}%</div>
                                                    <div className="creator-stat-label">Engagement</div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="creator-actions">
                                                {creator.id && (
                                                    <Link href={`/creators/${creator.id}`} className="btn btn-sm btn-secondary" onClick={(e) => e.stopPropagation()}>
                                                        <Eye size={12} />
                                                        Profile
                                                    </Link>
                                                )}
                                                <a
                                                    href={creator.custom_url
                                                        ? `https://www.youtube.com/${creator.custom_url.startsWith('@') ? creator.custom_url : '@' + creator.custom_url}`
                                                        : `https://www.youtube.com/channel/${creator.youtube_id}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="YouTube Channel"
                                                >
                                                    <Youtube size={12} style={{ color: '#ef4444' }} />
                                                </a>
                                                {creator.telegram && (
                                                    <a href={creator.telegram} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" onClick={(e) => e.stopPropagation()} title="Telegram">
                                                        <Send size={12} style={{ color: '#22d3ee' }} />
                                                    </a>
                                                )}
                                                {creator.twitter && (
                                                    <a href={creator.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" onClick={(e) => e.stopPropagation()} title="Twitter/X">
                                                        <AtSign size={12} />
                                                    </a>
                                                )}
                                                {creator.email && (
                                                    <a href={`mailto:${creator.email}`} className="btn btn-sm btn-secondary" onClick={(e) => e.stopPropagation()} title="Email">
                                                        <Mail size={12} style={{ color: '#34d399' }} />
                                                    </a>
                                                )}
                                                {creator.facebook && (
                                                    <a href={creator.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" onClick={(e) => e.stopPropagation()} title="Facebook">
                                                        <Facebook size={12} style={{ color: '#818cf8' }} />
                                                    </a>
                                                )}
                                                {creator.whatsapp && (
                                                    <a href={creator.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" onClick={(e) => e.stopPropagation()} title="WhatsApp">
                                                        <MessageSquare size={12} style={{ color: '#34d399' }} />
                                                    </a>
                                                )}
                                                {creator.website && (
                                                    <a href={creator.website} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" onClick={(e) => e.stopPropagation()} title="Website">
                                                        <Globe size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Empty / Idle State */}
                    {!loading && !searched && results.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Search size={32} />
                            </div>
                            <div className="empty-state-title">Start Discovering Creators</div>
                            <div className="empty-state-desc">
                                Enter a keyword, select languages &amp; regions, then hit{' '}
                                <strong style={{ color: 'white' }}>Search YouTube</strong>.
                                Parallel requests are fired for each language × region pair.
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setQuery('Crypto India'); }}>
                                    💡 Crypto India
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setQuery('Tech Unboxing'); }}>
                                    📦 Tech Unboxing
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setQuery('Finance Tips'); }}>
                                    💰 Finance Tips
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="modal-overlay" onClick={() => setShowCampaignModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">
                            <Plus size={18} /> Add to Campaign
                        </h2>

                        {campaigns.length > 0 && (
                            <div className="settings-field">
                                <label className="label">Select Existing Campaign</label>
                                <select
                                    className="select input"
                                    value={selectedCampaign}
                                    onChange={(e) => { setSelectedCampaign(e.target.value); setNewCampaignName(''); }}
                                >
                                    <option value="">Choose a campaign...</option>
                                    {campaigns.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="settings-field">
                            <label className="label">{campaigns.length > 0 ? 'Or Create New Campaign' : 'Campaign Name'}</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. MyPal Launch Q1"
                                value={newCampaignName}
                                onChange={(e) => { setNewCampaignName(e.target.value); setSelectedCampaign(''); }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCampaignModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={addToCampaign}
                                disabled={!selectedCampaign && !newCampaignName}
                            >
                                <Star size={14} />
                                Add {selectedCreators.length} Creator{selectedCreators.length > 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
