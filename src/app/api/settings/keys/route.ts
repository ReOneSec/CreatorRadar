import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';

function maskKey(key: string | null | undefined): string | null {
    if (!key || key.length < 8) return null;
    return key.substring(0, 6) + '...' + key.substring(key.length - 4);
}

// GET: Return masked key indicators for the authenticated user
export async function GET() {
    const supabase = await createSupabaseServerClient();
    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data.session;

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createSupabaseServiceClient();
    const { data: settings } = await serviceClient
        .from('user_settings')
        .select('youtube_api_key, openai_api_key')
        .eq('user_id', session.user.id)
        .single();

    const s = settings as { youtube_api_key?: string | null; openai_api_key?: string | null } | null;
    return NextResponse.json({
        youtube_key_masked: maskKey(s?.youtube_api_key),
        openai_key_masked: maskKey(s?.openai_api_key),
        has_youtube_key: !!s?.youtube_api_key,
        has_openai_key: !!s?.openai_api_key,
    });
}

// POST: Save/update API keys for the authenticated user
export async function POST(request: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data.session;

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { youtube_api_key, openai_api_key } = body;

    if (!youtube_api_key && !openai_api_key) {
        return NextResponse.json({ error: 'At least one key is required' }, { status: 400 });
    }

    const serviceClient = createSupabaseServiceClient();

    const { data: existing } = await serviceClient
        .from('user_settings')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

    const payload: Record<string, unknown> = {
        user_id: session.user.id,
        updated_at: new Date().toISOString(),
    };
    if (youtube_api_key !== undefined) payload.youtube_api_key = youtube_api_key || null;
    if (openai_api_key !== undefined) payload.openai_api_key = openai_api_key || null;

    if (existing) {
        await serviceClient.from('user_settings').update(payload).eq('user_id', session.user.id);
    } else {
        await serviceClient.from('user_settings').insert(payload);
    }

    return NextResponse.json({ success: true });
}
