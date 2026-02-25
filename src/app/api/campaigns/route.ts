import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch all campaign_creators in one query
        const { data: allLinks } = await supabase
            .from('campaign_creators')
            .select('campaign_id, stage');

        // Group counts by campaign
        const countsMap: Record<string, Record<string, number>> = {};
        for (const link of allLinks || []) {
            if (!countsMap[link.campaign_id]) {
                countsMap[link.campaign_id] = { new: 0, contacted: 0, negotiating: 0, partnered: 0, total: 0 };
            }
            countsMap[link.campaign_id][link.stage] = (countsMap[link.campaign_id][link.stage] || 0) + 1;
            countsMap[link.campaign_id].total += 1;
        }

        const campaigns = (data || []).map((campaign) => ({
            ...campaign,
            stageCounts: countsMap[campaign.id] || { new: 0, contacted: 0, negotiating: 0, partnered: 0, total: 0 },
        }));

        return NextResponse.json({ campaigns });
    } catch (error: any) {
        console.error('Campaigns list error:', error.message || error);
        return NextResponse.json({
            error: 'Failed to fetch campaigns',
            detail: error.message || String(error)
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('campaigns')
            .insert({ name, description: description || null })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ campaign: data }, { status: 201 });
    } catch (error) {
        console.error('Campaign creation error:', error);
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }
}
