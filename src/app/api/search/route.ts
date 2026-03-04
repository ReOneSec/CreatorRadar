import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';
import { searchChannels, getChannelDetails } from '@/lib/youtube';
import { extractSocialLinks } from '@/lib/enrichment';
import { calculatePriorityScore, estimateUploadFrequency } from '@/lib/scoring';
import { hasQuotaBudget } from '@/lib/quota';
import { createHash } from 'crypto';

const CACHE_TTL_HOURS = 48;

function generateQueryHash(params: Record<string, unknown>): string {
    const normalized = JSON.stringify(params, Object.keys(params).sort());
    return createHash('sha256').update(normalized).digest('hex').substring(0, 32);
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
        }

        const body = await request.json();
        const { query, minSubs, maxSubs, minViews, regionCode, relevanceLanguage } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Fetch user's YouTube API key from user_settings
        const serviceClient = createSupabaseServiceClient();
        const { data: settings } = await serviceClient
            .from('user_settings')
            .select('youtube_api_key')
            .eq('user_id', session.user.id)
            .single();

        const userApiKey = settings?.youtube_api_key || process.env.YOUTUBE_API_KEY;

        if (!userApiKey) {
            return NextResponse.json({
                error: 'YouTube API key not configured. Please visit Settings to add your key.',
                redirect: '/settings',
            }, { status: 400 });
        }

        // Generate deterministic cache key
        const cacheParams = { query, minSubs, maxSubs, minViews, regionCode, relevanceLanguage };
        const queryHash = generateQueryHash(cacheParams);

        // Check search cache (48-hour TTL)
        const { data: cachedResult } = await serviceClient
            .from('search_cache')
            .select('results, fetched_at, hit_count')
            .eq('query_hash', queryHash)
            .single();

        if (cachedResult) {
            const fetchedAt = new Date(cachedResult.fetched_at).getTime();
            const ageHours = (Date.now() - fetchedAt) / (1000 * 60 * 60);

            if (ageHours < CACHE_TTL_HOURS) {
                // Cache HIT — return immediately, increment counter asynchronously
                serviceClient
                    .from('search_cache')
                    .update({ hit_count: (cachedResult.hit_count || 0) + 1 })
                    .eq('query_hash', queryHash)
                    .then(() => { /* fire and forget */ });

                // Log activity
                const topCached = (cachedResult.results as Array<{ name: string; profile_pic_url?: string; subscribers: number }>)
                    .slice(0, 5).map(c => ({ name: c.name, thumb: c.profile_pic_url, subs: c.subscribers }));
                logActivity(serviceClient, session.user.id, 'SEARCH_PERFORMED', {
                    query, cache: 'hit', result_count: cachedResult.results.length, top_channels: topCached, query_hash: queryHash,
                });

                return NextResponse.json({
                    creators: cachedResult.results,
                    meta: { total: cachedResult.results.length, query, quotaCost: 0, cached: true },
                });
            }
        }

        // Cache MISS — call YouTube API
        const hasBudget = await hasQuotaBudget(102);
        if (!hasBudget) {
            return NextResponse.json(
                { error: 'Daily API quota exceeded. Resets at midnight PT.' },
                { status: 429 }
            );
        }

        const searchResults = await searchChannels(query, 25, regionCode, relevanceLanguage, userApiKey);
        if (searchResults.length === 0) {
            await supabase.from('searches').insert({
                query, filters: { minSubs, maxSubs, minViews }, result_count: 0, quota_cost: 100,
            });
            return NextResponse.json({ creators: [], message: 'No channels found for this query.' });
        }

        const channelIds = searchResults.map(r => r.channelId).filter(Boolean);
        const channelDetails = await getChannelDetails(channelIds, userApiKey);

        const creators = [];
        for (const channel of channelDetails) {
            if (minSubs && channel.subscriberCount < minSubs) continue;
            if (maxSubs && channel.subscriberCount > maxSubs) continue;

            const avgViews = channel.viewCount > 0 && channel.videoCount > 0
                ? Math.round(channel.viewCount / channel.videoCount) : 0;
            if (minViews && avgViews < minViews) continue;

            const socials = extractSocialLinks(channel.description);
            const uploadFreq = estimateUploadFrequency(channel.videoCount, channel.publishedAt);
            const scores = calculatePriorityScore(avgViews, channel.subscriberCount, null, uploadFreq);

            creators.push({
                youtube_id: channel.id,
                name: channel.title,
                description: channel.description,
                profile_pic_url: channel.thumbnailUrl,
                subscribers: channel.subscriberCount,
                total_views: channel.viewCount,
                avg_views: avgViews,
                video_count: channel.videoCount,
                engagement_rate: channel.subscriberCount > 0
                    ? Math.round((avgViews / channel.subscriberCount) * 10000) / 100 : 0,
                priority_score: scores.totalScore,
                upload_frequency: uploadFreq,
                telegram: socials.telegram,
                twitter: socials.twitter,
                instagram: socials.instagram,
                email: socials.email,
                country: channel.country,
                custom_url: channel.customUrl,
                last_fetched_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }

        // Upsert into creators table
        for (const creator of creators) {
            const { data: existing } = await supabase
                .from('creators')
                .select('id, last_fetched_at')
                .eq('youtube_id', creator.youtube_id)
                .single();

            if (existing) {
                const lastFetched = new Date(existing.last_fetched_at).getTime();
                if (Date.now() - lastFetched > 24 * 60 * 60 * 1000) {
                    await supabase.from('creators').update(creator).eq('id', existing.id);
                }
            } else {
                await supabase.from('creators').insert(creator);
            }
        }

        // Log search in old searches table
        await supabase.from('searches').insert({
            query, filters: { minSubs, maxSubs, minViews },
            result_count: creators.length, quota_cost: 101,
        });

        creators.sort((a, b) => b.priority_score - a.priority_score);

        // Async: save to search_cache + log activity
        const cachePayload = { query_hash: queryHash, results: creators, fetched_at: new Date().toISOString(), hit_count: 0 };
        serviceClient.from('search_cache').upsert(cachePayload, { onConflict: 'query_hash' }).then(() => { });

        const topChannels = creators.slice(0, 5).map((c) => ({ name: c.name, thumb: c.profile_pic_url, subs: c.subscribers }));
        logActivity(serviceClient, session.user.id, 'SEARCH_PERFORMED', {
            query, cache: 'miss', result_count: creators.length, top_channels: topChannels, query_hash: queryHash,
        });

        return NextResponse.json({
            creators,
            meta: { total: creators.length, query, quotaCost: 101, cached: false },
        });
    } catch (error) {
        console.error('Search error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Fire-and-forget activity log using service client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logActivity(client: any, userId: string, actionType: string, details: Record<string, unknown>) {
    client.from('activity_logs').insert({ user_id: userId, action_type: actionType, details }).then(() => { });
}
