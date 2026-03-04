import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';

interface ActivityLog {
    id: string;
    user_id: string;
    action_type: string;
    details: Record<string, unknown>;
    created_at: string;
}

interface Profile {
    id: string;
    email: string;
}

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logsResult = await serviceClient
        .from('activity_logs')
        .select('id, user_id, action_type, details, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const logs = (logsResult.data || []) as ActivityLog[];
    const count = logsResult.count;

    const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
    const profilesResult = userIds.length > 0
        ? await serviceClient.from('profiles').select('id, email').in('id', userIds)
        : { data: [] as Profile[] };

    const emailMap = new Map((profilesResult.data || []).map((p: Profile) => [p.id, p.email]));

    const enrichedLogs = logs.map((log: ActivityLog) => ({
        ...log,
        user_email: emailMap.get(log.user_id) || 'Unknown',
    }));

    return NextResponse.json({ logs: enrichedLogs, total: count || 0 });
}
