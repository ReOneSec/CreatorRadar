import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';
import { generatePitch } from '@/lib/openai';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
        }

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
                .from('campaigns').select('name').eq('id', campaignId).single();
            campaignName = campaign?.name;
        }

        // Fetch user's OpenAI key
        const serviceClient = createSupabaseServiceClient();
        const { data: settings } = await serviceClient
            .from('user_settings')
            .select('openai_api_key')
            .eq('user_id', session.user.id)
            .single();

        const userOpenAIKey = settings?.openai_api_key || undefined;

        const result = await generatePitch({ creator, campaignName, tone, productInfo, apiKey: userOpenAIKey });

        // Log activity
        logActivity(serviceClient, session.user.id, 'PITCH_GENERATED', {
            creator_name: creator.name, tone, has_custom_key: !!userOpenAIKey,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Pitch generation error:', error);
        return NextResponse.json({ error: 'Failed to generate pitch' }, { status: 500 });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logActivity(client: any, userId: string, actionType: string, details: Record<string, unknown>) {
    client.from('activity_logs').insert({ user_id: userId, action_type: actionType, details }).then(() => { });
}
