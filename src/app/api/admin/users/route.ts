import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';

interface ProfileRow {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

interface SettingsRow {
    user_id: string;
    youtube_api_key: string | null;
    openai_api_key: string | null;
}

interface ActivityRow {
    user_id: string;
}

export async function GET() {
    const supabase = await createSupabaseServerClient();
    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data.session;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createSupabaseServiceClient();
    const profileResult = await serviceClient
        .from('profiles').select('role').eq('id', session.user.id).single();
    if ((profileResult.data as { role?: string } | null)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: profiles } = await serviceClient
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });

    const { data: allSettings } = await serviceClient
        .from('user_settings')
        .select('user_id, youtube_api_key, openai_api_key');

    const { data: searchCounts } = await serviceClient
        .from('activity_logs')
        .select('user_id')
        .eq('action_type', 'SEARCH_PERFORMED');

    const settingsMap = new Map(
        ((allSettings || []) as SettingsRow[]).map(s => [s.user_id, s])
    );
    const countMap = new Map<string, number>();
    for (const row of (searchCounts || []) as ActivityRow[]) {
        countMap.set(row.user_id, (countMap.get(row.user_id) || 0) + 1);
    }

    const users = ((profiles || []) as ProfileRow[]).map(p => ({
        id: p.id,
        email: p.email,
        role: p.role,
        created_at: p.created_at,
        has_youtube_key: !!settingsMap.get(p.id)?.youtube_api_key,
        has_openai_key: !!settingsMap.get(p.id)?.openai_api_key,
        search_count: countMap.get(p.id) || 0,
    }));

    return NextResponse.json({ users });
}
