import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sort = searchParams.get('sort') || 'priority_score';
        const order = searchParams.get('order') || 'desc';
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const search = searchParams.get('search') || '';
        const minSubs = searchParams.get('minSubs');
        const maxSubs = searchParams.get('maxSubs');
        const minEngagement = searchParams.get('minEngagement');

        let query = supabase
            .from('creators')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }
        if (minSubs) {
            query = query.gte('subscribers', parseInt(minSubs, 10));
        }
        if (maxSubs) {
            query = query.lte('subscribers', parseInt(maxSubs, 10));
        }
        if (minEngagement) {
            query = query.gte('engagement_rate', parseFloat(minEngagement));
        }

        // Apply sorting
        const ascending = order === 'asc';
        query = query.order(sort, { ascending });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            creators: data || [],
            total: count || 0,
            limit,
            offset,
        });
    } catch (error: any) {
        console.error('Creators list error:', error.message || error);
        return NextResponse.json({
            error: 'Failed to fetch creators',
            detail: error.message || String(error)
        }, { status: 500 });
    }
}
