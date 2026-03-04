import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');

    if (!hash) return NextResponse.json({ error: 'hash parameter required' }, { status: 400 });

    const { data: cacheEntry } = await serviceClient
        .from('search_cache')
        .select('results, fetched_at, hit_count')
        .eq('query_hash', hash)
        .single();

    if (!cacheEntry) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    return NextResponse.json({
        results: cacheEntry.results,
        fetched_at: cacheEntry.fetched_at,
        hit_count: cacheEntry.hit_count,
        total: (cacheEntry.results as unknown[]).length,
    });
}
