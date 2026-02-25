import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generatePitch } from '@/lib/openai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { creatorId, campaignId, tone = 'friendly', productInfo } = body;

        if (!creatorId) {
            return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
        }

        // Fetch creator data
        const { data: creator, error: creatorErr } = await supabase
            .from('creators')
            .select('name, subscribers, avg_views, engagement_rate, country, video_count')
            .eq('id', creatorId)
            .single();

        if (creatorErr || !creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        // Fetch campaign name if provided
        let campaignName: string | undefined;
        if (campaignId) {
            const { data: campaign } = await supabase
                .from('campaigns')
                .select('name')
                .eq('id', campaignId)
                .single();
            campaignName = campaign?.name;
        }

        const result = await generatePitch({
            creator,
            campaignName,
            tone,
            productInfo,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Pitch generation error:', error);
        return NextResponse.json({ error: 'Failed to generate pitch' }, { status: 500 });
    }
}
