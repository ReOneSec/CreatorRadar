import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const campaignId = request.nextUrl.searchParams.get('campaignId');

        let creators;

        if (campaignId) {
            // Export creators from a specific campaign
            const { data, error } = await supabase
                .from('campaign_creators')
                .select('stage, creator:creators(*)')
                .eq('campaign_id', campaignId);

            if (error) throw error;

            creators = (data || []).map((row: Record<string, unknown>) => ({
                ...(row.creator as Record<string, unknown>),
                stage: row.stage,
            }));
        } else {
            // Export all creators
            const { data, error } = await supabase
                .from('creators')
                .select('*')
                .order('priority_score', { ascending: false });

            if (error) throw error;
            creators = data || [];
        }

        // Build CSV
        const headers = [
            'Name', 'YouTube URL', 'Subscribers', 'Avg Views', 'Total Views',
            'Engagement Rate', 'Priority Score', 'Videos', 'Country',
            'Telegram', 'Twitter', 'Instagram', 'Email',
            ...(campaignId ? ['Stage'] : []),
        ];

        const escape = (val: unknown) => {
            const str = String(val ?? '');
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"` : str;
        };

        const rows = creators.map((c: Record<string, unknown>) => [
            escape(c.name),
            `https://youtube.com/channel/${c.youtube_id}`,
            c.subscribers,
            c.avg_views,
            c.total_views,
            c.engagement_rate,
            c.priority_score,
            c.video_count,
            escape(c.country),
            escape(c.telegram),
            escape(c.twitter),
            escape(c.instagram),
            escape(c.email),
            ...(campaignId ? [escape(c.stage)] : []),
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const filename = campaignId ? `campaign-export-${Date.now()}.csv` : `creators-export-${Date.now()}.csv`;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
