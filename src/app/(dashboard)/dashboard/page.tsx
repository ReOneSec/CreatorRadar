'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Target,
  Zap,
  TrendingUp,
  Search,
  ArrowRight,
  Clock,
  BarChart3,
  Radar,
} from 'lucide-react';

interface DashboardData {
  totalCreators: number;
  activeCampaigns: number;
  quotaUsed: number;
  quotaTotal: number;
  recentSearches: Array<{
    id: string;
    query: string;
    result_count: number;
    created_at: string;
  }>;
  topCreators: Array<{
    id: string;
    name: string;
    profile_pic_url: string | null;
    priority_score: number;
    subscribers: number;
    engagement_rate: number;
  }>;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

function DashboardSkeleton() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="skeleton" style={{ width: 160, height: 32, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 260, height: 16 }} />
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 14 }} />
            <div className="skeleton" style={{ width: 70, height: 30, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: 120, height: 13 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1, 2].map((i) => (
          <div key={i} className="glass-card">
            <div className="skeleton" style={{ width: 120, height: 18, marginBottom: 20 }} />
            <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 10, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 10, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 10 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [creatorsRes, campaignsRes, quotaRes, allRes] = await Promise.all([
          fetch('/api/creators?limit=5&sort=priority_score&order=desc'),
          fetch('/api/campaigns'),
          fetch('/api/quota'),
          fetch('/api/creators?limit=1'),
        ]);

        const creators = await creatorsRes.json();
        const campaigns = await campaignsRes.json();
        const quota = await quotaRes.json();
        const allCreators = await allRes.json();

        setData({
          totalCreators: allCreators.total || 0,
          activeCampaigns: (campaigns.campaigns || []).filter(
            (c: { status: string }) => c.status === 'active'
          ).length,
          quotaUsed: quota.used || 0,
          quotaTotal: quota.total || 10000,
          recentSearches: [],
          topCreators: (creators.creators || []).slice(0, 5),
        });
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const quotaPercent = data
    ? Math.round(((data.quotaTotal - data.quotaUsed) / data.quotaTotal) * 100)
    : 100;

  const stats = [
    {
      label: 'Total Creators Found',
      value: formatNumber(data?.totalCreators || 0),
      icon: <Users size={20} />,
      color: 'indigo',
    },
    {
      label: 'Active Campaigns',
      value: String(data?.activeCampaigns || 0),
      icon: <Target size={20} />,
      color: 'purple',
    },
    {
      label: 'Quota Remaining',
      value: `${quotaPercent}%`,
      icon: <BarChart3 size={20} />,
      color: 'cyan',
    },
    {
      label: 'API Units Used Today',
      value: formatNumber(data?.quotaUsed || 0),
      icon: <Zap size={20} />,
      color: 'emerald',
    },
  ] as const;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99,102,241,0.35)'
            }}>
              <Radar size={16} color="white" />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Dashboard</h1>
          </div>
          <p className="page-subtitle">Your influencer scouting mission control</p>
        </div>
        <Link href="/discover" className="btn btn-primary">
          <Search size={15} />
          Discover Creators
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Quick Actions */}
        <div className="glass-card">
          <h2 className="section-title">
            <Zap size={16} style={{ color: '#818cf8' }} />
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/discover" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <Search size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>Start New Search</span>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
            </Link>
            <Link href="/campaigns" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Target size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>View Campaigns</span>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
            </Link>
            <Link href="/settings" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Zap size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>Configure API Keys</span>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
            </Link>
          </div>
        </div>

        {/* Recent Searches */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              <Clock size={16} style={{ color: '#818cf8' }} />
              Recent Searches
            </h2>
          </div>
          {(data?.recentSearches?.length || 0) > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data!.recentSearches.map((search) => (
                <div
                  key={search.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 13px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{search.query}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {search.result_count} creators found
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(search.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon" style={{ width: 52, height: 52, marginBottom: 12 }}>
                <Search size={24} />
              </div>
              <div className="empty-state-title" style={{ fontSize: 14 }}>No searches yet</div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                Head to{' '}
                <Link href="/discover" style={{ color: '#818cf8' }}>
                  Discover
                </Link>{' '}
                to start scouting
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Creators */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            <TrendingUp size={16} style={{ color: '#818cf8' }} />
            Top Creators
          </h2>
          <Link href="/discover" className="btn btn-sm btn-secondary">
            <TrendingUp size={13} />
            View All
          </Link>
        </div>

        {(data?.topCreators?.length || 0) > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Subscribers</th>
                  <th>Engagement</th>
                  <th>Priority Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data!.topCreators.map((creator) => (
                  <tr key={creator.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        {creator.profile_pic_url ? (
                          <img
                            src={creator.profile_pic_url}
                            alt={creator.name}
                            style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.06)' }}
                          />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Users size={16} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#e2e8f0' }}>
                          {creator.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatNumber(creator.subscribers)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {creator.engagement_rate.toFixed(1)}%
                    </td>
                    <td>
                      <span
                        className={`badge ${creator.priority_score >= 70 ? 'engagement' :
                          creator.priority_score >= 40 ? 'active' : 'stale'
                          }`}
                      >
                        {creator.priority_score}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/creators/${creator.id}`}
                        className="btn btn-sm btn-ghost"
                      >
                        View
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 24px' }}>
            <div className="empty-state-icon">
              <Users size={28} />
            </div>
            <div className="empty-state-title">No creators found yet</div>
            <p className="empty-state-desc">
              Use the{' '}
              <Link href="/discover" style={{ color: '#818cf8' }}>
                Discovery Engine
              </Link>{' '}
              to scout your first creators
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
