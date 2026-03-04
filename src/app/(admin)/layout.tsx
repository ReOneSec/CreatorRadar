import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) redirect('/login');

    const serviceClient = createSupabaseServiceClient();
    const { data: profile } = await serviceClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'admin') redirect('/dashboard');

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {children}
        </div>
    );
}
