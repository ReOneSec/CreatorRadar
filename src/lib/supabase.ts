import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Creator {
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
    email: string | null;
    country: string | null;
    custom_url: string | null;
    last_fetched_at: string;
    created_at: string;
    updated_at: string;
}

export interface Campaign {
    id: string;
    name: string;
    description: string | null;
    status: 'active' | 'paused' | 'completed';
    created_at: string;
    updated_at: string;
}

export interface CampaignCreator {
    id: string;
    campaign_id: string;
    creator_id: string;
    stage: 'new' | 'contacted' | 'negotiating' | 'partnered';
    notes: string | null;
    created_at: string;
    updated_at: string;
    creator?: Creator;
}

export interface Search {
    id: string;
    query: string;
    filters: Record<string, unknown>;
    result_count: number;
    quota_cost: number;
    created_at: string;
}

export interface QuotaUsage {
    id: string;
    date: string;
    units_used: number;
    operation: string;
    details: string | null;
    created_at: string;
}
