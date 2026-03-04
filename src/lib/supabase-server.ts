import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client (for Server Components, API routes, Server Actions).
 * Uses the anon key + user's cookie session.
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // In Server Components, setAll is a no-op (fine for read-only usage)
                    }
                },
            },
        }
    );
}

/**
 * Server-side Supabase client with the SERVICE ROLE key.
 * Bypasses RLS — use only in trusted server code (API routes).
 * NEVER expose this key to the client.
 */
export function createSupabaseServiceClient() {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}
