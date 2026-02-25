import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get campaign details
        const { data: campaign, error: campError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (campError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get all campaign creators with full creator details
        const { data: links, error: linksError } = await supabase
            .from('campaign_creators')
            .select('*, creator:creator_id(*)')
            .eq('campaign_id', id)
            .order('created_at', { ascending: false });

        if (linksError) throw linksError;

        return NextResponse.json({
            campaign,
            creators: links || [],
        });
    } catch (error) {
        console.error('Campaign detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Update campaign details
        if (body.name || body.status || body.description !== undefined) {
            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (body.name) updates.name = body.name;
            if (body.status) updates.status = body.status;
            if (body.description !== undefined) updates.description = body.description;

            await supabase.from('campaigns').update(updates).eq('id', id);
        }

        // Add creators to campaign
        if (body.addCreators && Array.isArray(body.addCreators)) {
            const inserts = body.addCreators.map((creatorId: string) => ({
                campaign_id: id,
                creator_id: creatorId,
                stage: 'new',
            }));

            await supabase
                .from('campaign_creators')
                .upsert(inserts, { onConflict: 'campaign_id,creator_id' });
        }

        // Update creator stage
        if (body.updateStage) {
            const { creatorId, stage } = body.updateStage;
            await supabase
                .from('campaign_creators')
                .update({ stage, updated_at: new Date().toISOString() })
                .eq('campaign_id', id)
                .eq('creator_id', creatorId);
        }

        // Remove creator from campaign
        if (body.removeCreator) {
            await supabase
                .from('campaign_creators')
                .delete()
                .eq('campaign_id', id)
                .eq('creator_id', body.removeCreator);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Campaign update error:', error);
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase.from('campaigns').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Campaign delete error:', error);
        return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }
}
