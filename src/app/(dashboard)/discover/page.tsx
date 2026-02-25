'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Search,
    SlidersHorizontal,
    Users,
    Eye,
    TrendingUp,
    Star,
    MessageCircle,
    AtSign,
    Mail,
    Send,
    Plus,
    ExternalLink,
    Loader2,
    Download,
    Facebook,
    MessageSquare,
    Globe,
    Youtube,
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

export default function DiscoverPage() {
    const [query, setQuery] = useState('');
    const [minSubs, setMinSubs] = useState('');
    const [maxSubs, setMaxSubs] = useState('');
    const [minViews, setMinViews] = useState('');
    const [results, setResults] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [searchSteps, setSearchSteps] = useState<Array<{ step: string; message: string; done: boolean }>>([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [countrySearch, setCountrySearch] = useState('');

    const countries = [
        { name: 'All Countries', code: '' },
        { name: 'India', code: 'IN' },
        { name: 'Pakistan', code: 'PK' },
        { name: 'Bangladesh', code: 'BD' },
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
        { name: 'United Arab Emirates', code: 'AE' },
        { name: 'Saudi Arabia', code: 'SA' },
        { name: 'Uzbekistan', code: 'UZ' },
        { name: 'Kazakhstan', code: 'KZ' },
        { name: 'Israel', code: 'IL' },
        { name: 'Taiwan', code: 'TW' },
        { name: 'Hong Kong', code: 'HK' },
        { name: 'China', code: 'CN' },
        { name: 'United States', code: 'US' },
        { name: 'United Kingdom', code: 'GB' },
        { name: 'Canada', code: 'CA' },
    ];

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );

    // Campaign modal state
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
    const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [newCampaignName, setNewCampaignName] = useState('');

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(true);
        setResults([]);
        setSearchSteps([]);

        const params = new URLSearchParams({ query: query.trim() });
        if (minSubs) params.set('minSubs', minSubs);
        if (maxSubs) params.set('maxSubs', maxSubs);
        if (minViews) params.set('minViews', minViews);
        if (selectedCountry) params.set('country', selectedCountry);

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

                // Update steps
                setSearchSteps(prev => {
                    const existing = prev.find(s => s.step === data.step);
                    if (existing) {
                        return prev.map(s => s.step === data.step ? { ...s, message: data.message } : s);
                    }
                    // Mark previous steps as done
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
            prev.includes(creatorId)
                ? prev.filter((id) => id !== creatorId)
                : [...prev, creatorId]
        );
    }

    async function openCampaignModal() {
        try {
            const res = await fetch('/api/campaigns');
            const data = await res.json();
            setCampaigns(data.campaigns || []);
        } catch (err) {
            console.error(err);
        }
        setShowCampaignModal(true);
    }

    async function addToCampaign() {
        let campaignId = selectedCampaign;

        // Create new campaign if needed
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

        // Add selected creators
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

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) {
            const rounded = Math.floor((num / 1000) * 10) / 10;
            return `${rounded}K`;
        }
        return num.toLocaleString();
    };

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

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Discovery Engine</h1>
                <p className="page-subtitle">Search YouTube for high-ROI micro-influencers</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <Search size={18} className="input-icon" />
                        <input
                            type="text"
                            className="input search-input-lg input-with-icon"
                            placeholder="Search creators... e.g. 'Crypto Review India', 'Tech Unboxing'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
                        {loading ? <Loader2 size={16} className="loading-spinner" /> : <Search size={16} />}
                        {loading ? 'Searching...' : 'Search YouTube'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={loadFromDatabase}
                        disabled={loading}
                    >
                        Load from DB
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => setShowFilters(!showFilters)}
                        title="Toggle Filters"
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>
            </form>

            <div className="discover-layout">
                {/* Filter Sidebar */}
                {showFilters && (
                    <div className="discover-filters">
                        <div className="glass-card">
                            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                                <SlidersHorizontal size={14} style={{ display: 'inline', marginRight: 8 }} />
                                Filters
                            </h3>

                            <div className="filter-section">
                                <div className="filter-section-title">Subscriber Range</div>
                                <div className="range-inputs">
                                    <div>
                                        <label className="label">Min</label>
                                        <input
                                            type="number"
                                            className="input"
                                            placeholder="0"
                                            value={minSubs}
                                            onChange={(e) => setMinSubs(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Max</label>
                                        <input
                                            type="number"
                                            className="input"
                                            placeholder="∞"
                                            value={maxSubs}
                                            onChange={(e) => setMaxSubs(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="filter-section">
                                <div className="filter-section-title">Country</div>
                                <div className="country-filter-container" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <Search size={14} className="input-icon" />
                                        <input
                                            type="text"
                                            className="input input-sm input-with-icon"
                                            placeholder="Search country..."
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="select input input-sm"
                                        value={selectedCountry}
                                        onChange={(e) => {
                                            const code = e.target.value;
                                            setSelectedCountry(code);
                                            const country = countries.find(c => c.code === code);
                                            if (country && country.code) {
                                                setCountrySearch(country.name);
                                            } else {
                                                setCountrySearch('');
                                            }
                                        }}
                                        style={{
                                            height: filteredCountries.length > 1 ? '120px' : '40px',
                                            cursor: 'pointer'
                                        }}
                                        size={filteredCountries.length > 1 ? 4 : 1}
                                    >
                                        {filteredCountries.map((c) => (
                                            <option key={c.code} value={c.code} style={{ padding: '4px 8px' }}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedCreators.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={openCampaignModal}
                                    >
                                        <Plus size={14} />
                                        Add {selectedCreators.length} to Campaign
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="discover-results">
                    {error && (
                        <div className="glass-card" style={{ textAlign: 'center', padding: 40, marginBottom: 16 }}>
                            <p style={{ color: 'var(--accent-amber)', fontSize: 14 }}>{error}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="glass-card" style={{ padding: 32 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {searchSteps.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: s.done ? 'var(--accent-emerald)' : 'var(--accent-indigo)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, color: 'white', flexShrink: 0,
                                        }}>
                                            {s.done ? '✓' : <Loader2 size={12} className="loading-spinner" />}
                                        </div>
                                        <span style={{ fontSize: 14, color: s.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                            {s.message}
                                        </span>
                                    </div>
                                ))}
                                {searchSteps.length === 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Loader2 size={20} className="loading-spinner" style={{ color: 'var(--accent-indigo)' }} />
                                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Starting search pipeline...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                    {results.length} creators found
                                </span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {selectedCreators.length > 0 && (
                                        <span style={{ fontSize: 13, color: 'var(--accent-indigo)' }}>
                                            {selectedCreators.length} selected
                                        </span>
                                    )}
                                    <button className="btn btn-sm btn-secondary" onClick={() => window.open('/api/export', '_blank')}>
                                        <Download size={12} /> Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="creator-results-grid">
                                {results.map((creator, index) => (
                                    <div
                                        key={creator.youtube_id || index}
                                        className="creator-card"
                                        style={{
                                            borderColor: selectedCreators.includes(creator.id || creator.youtube_id)
                                                ? 'var(--accent-indigo)'
                                                : undefined,
                                        }}
                                    >
                                        {/* Selection checkbox */}
                                        {creator.id && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    cursor: 'pointer',
                                                    zIndex: 2,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCreatorSelection(creator.id!);
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: 6,
                                                        border: `2px solid ${selectedCreators.includes(creator.id)
                                                            ? 'var(--accent-indigo)'
                                                            : 'var(--border-glass)'
                                                            }`,
                                                        background: selectedCreators.includes(creator.id)
                                                            ? 'var(--accent-indigo)'
                                                            : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 12,
                                                        color: 'white',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    {selectedCreators.includes(creator.id) && '✓'}
                                                </div>
                                            </div>
                                        )}

                                        {/* Card Header */}
                                        <div className="creator-card-header">
                                            {creator.profile_pic_url ? (
                                                <img
                                                    src={creator.profile_pic_url}
                                                    alt={creator.name}
                                                    className="creator-avatar"
                                                />
                                            ) : (
                                                <div
                                                    className="creator-avatar"
                                                    style={{
                                                        background: 'var(--bg-glass)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Users size={24} style={{ color: 'var(--text-muted)' }} />
                                                </div>
                                            )}
                                            <div className="creator-info">
                                                <div className="creator-name">{creator.name}</div>
                                                <div className="creator-handle" style={{ color: 'var(--accent-indigo)', fontWeight: 500 }}>
                                                    {creator.country ? `📍 ${creator.country}` : 'Global Channel'}
                                                </div>
                                            </div>
                                            <div className={`creator-score ${getScoreClass(creator.priority_score)}`}>
                                                {creator.priority_score}
                                            </div>
                                        </div>

                                        {/* Badges */}
                                        <div className="creator-badges">
                                            {getBadges(creator).map((badge, i) => (
                                                <span key={i} className={`badge ${badge.className}`}>
                                                    {badge.text}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Stats */}
                                        <div className="creator-stats">
                                            <div className="creator-stat">
                                                <div className="creator-stat-value" style={{ color: 'var(--text-primary)' }}>
                                                    {formatNumber(creator.subscribers)}
                                                </div>
                                                <div className="creator-stat-label">Subscribers</div>
                                            </div>
                                            <div className="creator-stat">
                                                <div className="creator-stat-value">
                                                    {formatNumber(creator.avg_views)}
                                                </div>
                                                <div className="creator-stat-label">Avg Views</div>
                                            </div>
                                            <div className="creator-stat">
                                                <div className="creator-stat-value">
                                                    {creator.video_count}
                                                </div>
                                                <div className="creator-stat-label">Videos</div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="creator-actions">
                                            {creator.id && (
                                                <Link
                                                    href={`/creators/${creator.id}`}
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Eye size={12} />
                                                    Profile
                                                </Link>
                                            )}
                                            {creator.telegram && (
                                                <a
                                                    href={creator.telegram}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Send size={12} />
                                                    TG
                                                </a>
                                            )}
                                            {creator.twitter && (
                                                <a
                                                    href={creator.twitter}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <AtSign size={12} />
                                                    X
                                                </a>
                                            )}
                                            {creator.email && (
                                                <a
                                                    href={`mailto:${creator.email}`}
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Mail size={12} />
                                                </a>
                                            )}
                                            {creator.facebook && (
                                                <a
                                                    href={creator.facebook}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Facebook"
                                                >
                                                    <Facebook size={12} />
                                                </a>
                                            )}
                                            {creator.whatsapp && (
                                                <a
                                                    href={creator.whatsapp}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="WhatsApp"
                                                >
                                                    <MessageSquare size={12} />
                                                </a>
                                            )}
                                            {creator.website && (
                                                <a
                                                    href={creator.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Website"
                                                >
                                                    <Globe size={12} />
                                                </a>
                                            )}
                                            <a
                                                href={creator.custom_url ? `https://www.youtube.com/${creator.custom_url.startsWith('@') ? creator.custom_url : '@' + creator.custom_url}` : `https://www.youtube.com/channel/${creator.youtube_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-secondary"
                                                onClick={(e) => e.stopPropagation()}
                                                title="YouTube Channel"
                                            >
                                                <Youtube size={12} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!loading && !searched && results.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Search size={48} />
                            </div>
                            <div className="empty-state-title">Start Discovering Creators</div>
                            <div className="empty-state-desc">
                                Enter a keyword and apply filters to scout YouTube creators. Results are enriched with social handles and scored automatically.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="modal-overlay" onClick={() => setShowCampaignModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Add to Campaign</h2>

                        {campaigns.length > 0 && (
                            <div className="settings-field">
                                <label className="label">Existing Campaign</label>
                                <select
                                    className="select input"
                                    value={selectedCampaign}
                                    onChange={(e) => {
                                        setSelectedCampaign(e.target.value);
                                        setNewCampaignName('');
                                    }}
                                >
                                    <option value="">Select a campaign...</option>
                                    {campaigns.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="settings-field">
                            <label className="label">
                                {campaigns.length > 0 ? 'Or Create New Campaign' : 'Campaign Name'}
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. MyPal Launch Q1"
                                value={newCampaignName}
                                onChange={(e) => {
                                    setNewCampaignName(e.target.value);
                                    setSelectedCampaign('');
                                }}
                            />
                        </div>

                        <div className="flex gap-2" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCampaignModal(false)}
                            >
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
