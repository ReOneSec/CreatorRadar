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
  BarChart3
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [creatorsRes, campaignsRes, quotaRes, searchesRes] = await Promise.all([
          fetch('/api/creators?limit=5&sort=priority_score&order=desc'),
          fetch('/api/campaigns'),
          fetch('/api/quota'),
          fetch('/api/creators?limit=1'), // Using count from creators endpoint
        ]);

        const creators = await creatorsRes.json();
        const campaigns = await campaignsRes.json();
        const quota = await quotaRes.json();
        const allCreators = await searchesRes.json();

        // Fetch recent searches directly from supabase via a simple endpoint
        let recentSearches: DashboardData['recentSearches'] = [];
        try {
          const searchResp = await fetch('/api/creators?limit=0');
          const searchData = await searchResp.json();
          // We'll populate from actual searches
          void searchData;
        } catch {
          // ignore
        }

        setData({
          totalCreators: allCreators.total || 0,
          activeCampaigns: (campaigns.campaigns || []).filter(
            (c: { status: string }) => c.status === 'active'
          ).length,
          quotaUsed: quota.used || 0,
          quotaTotal: quota.total || 10000,
          recentSearches,
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Loading your scouting overview...</p>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 40, height: 40, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: 80, height: 28, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 120, height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your influencer scouting mission control</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon indigo">
            <Users size={20} />
          </div>
          <div className="stat-card-value">{formatNumber(data?.totalCreators || 0)}</div>
          <div className="stat-card-label">Total Creators Found</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon purple">
            <Target size={20} />
          </div>
          <div className="stat-card-value">{data?.activeCampaigns || 0}</div>
          <div className="stat-card-label">Active Campaigns</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon cyan">
            <BarChart3 size={20} />
          </div>
          <div className="stat-card-value">
            {data ? Math.round(((data.quotaTotal - data.quotaUsed) / data.quotaTotal) * 100) : 100}%
          </div>
          <div className="stat-card-label">Quota Remaining</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon emerald">
            <Zap size={20} />
          </div>
          <div className="stat-card-value">{formatNumber(data?.quotaUsed || 0)}</div>
          <div className="stat-card-label">API Units Used Today</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title !mb-0">Quick Actions</h2>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/discover" className="btn btn-primary !justify-start">
              <Search size={16} />
              <span className="flex-1 text-left">Start New Search</span>
              <ArrowRight size={14} className="opacity-50" />
            </Link>
            <Link href="/campaigns" className="btn btn-secondary !justify-start">
              <Target size={16} />
              <span className="flex-1 text-left">View Campaigns</span>
              <ArrowRight size={14} className="opacity-50" />
            </Link>
            <Link href="/settings" className="btn btn-secondary !justify-start">
              <Zap size={16} />
              <span className="flex-1 text-left">Configure API Keys</span>
              <ArrowRight size={14} className="opacity-50" />
            </Link>
          </div>
        </div>

        {/* Recent Searches */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title !mb-0">Recent Searches</h2>
            <Clock size={16} className="text-slate-500" />
          </div>
          {(data?.recentSearches?.length || 0) > 0 ? (
            <div className="flex flex-col gap-4">
              {data!.recentSearches.map((search) => (
                <div key={search.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-semibold text-white">{search.query}</div>
                    <div className="text-[11px] text-slate-500">
                      {search.result_count} creators found
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(search.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={32} className="opacity-20 mb-3" />
              <div className="text-sm font-bold text-white/40">No searches yet</div>
              <p className="text-xs text-slate-600 mt-1">
                Head to <Link href="/discover" className="text-indigo-400 hover:underline">Discover</Link> to start scouting
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Creators */}
      <div className="glass-card mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title !mb-0">Top Creators</h2>
          <Link href="/discover" className="btn btn-sm btn-secondary">
            <TrendingUp size={14} />
            View All
          </Link>
        </div>
        {(data?.topCreators?.length || 0) > 0 ? (
          <div className="overflow-x-auto selection:bg-indigo-500/20">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Subscribers</th>
                  <th>Engagement</th>
                  <th>Priority Score</th>
                </tr>
              </thead>
              <tbody>
                {data!.topCreators.map((creator) => (
                  <tr key={creator.id}>
                    <td>
                      <Link
                        href={`/creators/${creator.id}`}
                        className="flex items-center gap-3 transition-transform hover:translate-x-1"
                      >
                        {creator.profile_pic_url ? (
                          <img
                            src={creator.profile_pic_url}
                            alt={creator.name}
                            className="w-9 h-9 rounded-lg object-cover ring-2 ring-white/5"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                            <Users size={16} className="text-slate-500" />
                          </div>
                        )}
                        <span className="font-bold text-slate-200">
                          {creator.name}
                        </span>
                      </Link>
                    </td>
                    <td className="font-medium">{formatNumber(creator.subscribers)}</td>
                    <td className="font-medium">{creator.engagement_rate.toFixed(1)}%</td>
                    <td>
                      <span
                        className={`badge ${creator.priority_score >= 70 ? 'engagement' :
                          creator.priority_score >= 40 ? 'active' : 'stale'
                          }`}
                      >
                        {creator.priority_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={32} className="opacity-20 mb-3" />
            <div className="text-sm font-bold text-white/40">No creators found yet</div>
            <p className="text-xs text-slate-600 mt-1">
              Use the <Link href="/discover" className="text-indigo-400 hover:underline">Discovery Engine</Link> to scout your first creators
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
