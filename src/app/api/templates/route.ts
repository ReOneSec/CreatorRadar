import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('outreach_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Templates query error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ templates: data || [] });
    } catch (e: any) {
        console.error('Templates system error:', e.message || e);
        return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, subject, body: templateBody, platform = 'email' } = body;

        if (!name || !templateBody) {
            return NextResponse.json({ error: 'Name and body are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('outreach_templates')
            .insert({ name, subject: subject || null, body: templateBody, platform })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ template: data }, { status: 201 });
    } catch (error) {
        console.error('Template creation error:', error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        const { error } = await supabase.from('outreach_templates').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Template deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
