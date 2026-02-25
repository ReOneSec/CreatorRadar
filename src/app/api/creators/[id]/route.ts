import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabase
            .from('creators')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        // Also fetch campaigns this creator belongs to
        const { data: campaignLinks } = await supabase
            .from('campaign_creators')
            .select('*, campaigns:campaign_id(id, name, status)')
            .eq('creator_id', id);

        return NextResponse.json({
            creator: data,
            campaigns: campaignLinks || [],
        });
    } catch (error) {
        console.error('Creator detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch creator' }, { status: 500 });
    }
}
