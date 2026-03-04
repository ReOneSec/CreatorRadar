import { NextRequest } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';
import { searchChannels, searchChannelsByVideos, getChannelDetails } from '@/lib/youtube';
import { extractSocialLinks } from '@/lib/enrichment';
import { calculatePriorityScore, estimateUploadFrequency } from '@/lib/scoring';
import { hasQuotaBudget } from '@/lib/quota';
import { expandSearchQuery } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';

import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

function generateQueryHash(params: Record<string, unknown>): string {
    const normalized = JSON.stringify(params, Object.keys(params).sort());
    return createHash('sha256').update(normalized).digest('hex').substring(0, 32);
}

// Max parallel combinations before we warn the user to protect the 10k daily quota.
// Each combination = 2 search calls × 100 units + 1 channels.list batch ≈ 201 units.
// 5 combos = ~1,005 units — safe ceiling per search.
const MAX_COMBINATIONS = 5;

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const query = searchParams.get('query') || '';
    const minSubs = searchParams.get('minSubs');
    const maxSubs = searchParams.get('maxSubs');
    const minViews = searchParams.get('minViews');

    // Multi-select: comma-separated ISO codes
    const rawRegions = searchParams.get('regions') || '';
    const rawLanguages = searchParams.get('languages') || '';

    const regions = rawRegions.split(',').map(s => s.trim()).filter(Boolean);
    const languages = rawLanguages.split(',').map(s => s.trim()).filter(Boolean);

    // Fallback to legacy single-value params for backwards compatibility
    const legacyCountry = searchParams.get('country') || '';
    if (regions.length === 0 && legacyCountry) regions.push(legacyCountry);

    const cacheParams = { query, minSubs, maxSubs, minViews, regions, languages, type: 'stream' };
    const queryHash = generateQueryHash(cacheParams);

    const encoder = new TextEncoder();

    const countryMap: Record<string, string> = {
        'IN': 'India', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'ID': 'Indonesia',
        'VN': 'Vietnam', 'TH': 'Thailand', 'PH': 'Philippines', 'JP': 'Japan',
        'KR': 'South Korea', 'SG': 'Singapore', 'MY': 'Malaysia', 'LK': 'Sri Lanka',
        'NP': 'Nepal', 'TR': 'Turkey', 'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia',
        'UZ': 'Uzbekistan', 'KZ': 'Kazakhstan', 'IL': 'Israel', 'TW': 'Taiwan',
        'HK': 'Hong Kong', 'CN': 'China', 'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada',
    };

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // ── Basic Validation ────────────────────────────────────────────
                if (!query) {
                    send({ step: 'error', message: 'Query is required' });
                    controller.close();
                    return;
                }

                // ── Auth: Get user session & API key ─────────────────────────
                const supabaseServer = await createSupabaseServerClient();
                const { data: sessionData } = await supabaseServer.auth.getSession();
                const session = sessionData.session;

                if (!session) {
                    send({ step: 'error', message: 'Unauthorized. Please log in.' });
                    controller.close();
                    return;
                }

                const serviceClient = createSupabaseServiceClient();
                const { data: userSettings } = await serviceClient
                    .from('user_settings')
                    .select('youtube_api_key, openai_api_key')
                    .eq('user_id', session.user.id)
                    .single();

                const userYTKey = userSettings?.youtube_api_key || process.env.YOUTUBE_API_KEY;
                const userAIKey = userSettings?.openai_api_key || undefined;

                if (!userYTKey) {
                    send({ step: 'error', message: 'YouTube API key not configured. Please visit Settings to add your key.' });
                    controller.close();
                    return;
                }

                // Use anon supabase for DB writes (creators/searches tables are public)
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                // ── Build (language × region) combination matrix ─────────────
                // Each axis can be empty, meaning "no filter" for that dimension.
                const effectiveRegions = regions.length > 0 ? regions : [undefined as unknown as string];
                const effectiveLanguages = languages.length > 0 ? languages : [undefined as unknown as string];

                type Combo = { region: string | undefined; language: string | undefined };
                const combinations: Combo[] = [];
                for (const region of effectiveRegions) {
                    for (const language of effectiveLanguages) {
                        combinations.push({ region, language });
                    }
                }

                // ── Quota guard — reject before any API call ─────────────────
                if (combinations.length > MAX_COMBINATIONS) {
                    send({
                        step: 'error',
                        message: `⚠️ Too many filter combinations (${combinations.length}). ` +
                            `Please select at most ${MAX_COMBINATIONS} language × region pairs ` +
                            `to avoid exhausting your 10,000-unit daily quota.`,
                    });
                    controller.close();
                    return;
                }

                // Each combination fires 2 × 100-unit searches; also budget for channel detail batches.
                const estimatedUnits = combinations.length * 201 + 5;
                send({ step: 'quota', message: 'Checking API quota...' });
                const hasBudget = await hasQuotaBudget(estimatedUnits);
                if (!hasBudget) {
                    send({ step: 'error', message: 'Daily API quota exceeded. Resets at midnight PT.' });
                    controller.close();
                    return;
                }

                // ── Step 1: Expand query with AI (uses first region name for context) ──
                let searchTerms = [query];
                const primaryCountryName = countryMap[regions[0]] || '';

                if (primaryCountryName) {
                    send({ step: 'searching', message: `Expanding query for ${primaryCountryName} using AI...` });
                    searchTerms = await expandSearchQuery(query, primaryCountryName, userAIKey);
                    // Build advanced q format: MainKeyword (SubKey1 | SubKey2 | ...)
                    // If AI returned multiple terms, the first is the "main" and rest are sub-keys.
                    if (searchTerms.length > 1) {
                        const [main, ...subs] = searchTerms;
                        const advancedQuery = `${main} (${subs.join(' | ')})`;
                        searchTerms = [advancedQuery, ...searchTerms]; // try advanced first, then individual terms as fallback
                    }
                    send({ step: 'searching', message: `Scouting with: ${searchTerms.slice(0, 2).join(', ')}` });
                } else {
                    send({ step: 'searching', message: `Searching YouTube for "${query}"...` });
                }

                // ── Step 2: Parallel fetch — Promise.all() over all combinations ──
                const comboLabel = combinations
                    .map(c => [c.language, c.region].filter(Boolean).join('/') || 'global')
                    .join(', ');

                send({
                    step: 'searching',
                    message: `Firing ${combinations.length} parallel request${combinations.length > 1 ? 's' : ''} (${comboLabel})...`,
                });

                // For each combination, search every search term (channel + video search)
                const parallelTasks = combinations.flatMap(({ region, language }) =>
                    searchTerms.map(async (term) => {
                        const [chResults, vidResults] = await Promise.all([
                            searchChannels(term, 50, region, language, userYTKey),
                            searchChannelsByVideos(term, 50, region, language, userYTKey),
                        ]);
                        return [...chResults, ...vidResults];
                    })
                );

                const nestedResults = await Promise.all(parallelTasks);

                // ── Step 3: Global de-duplication ───────────────────────────────
                const seenIds = new Set<string>();
                const allResults = [];
                for (const batch of nestedResults) {
                    for (const r of batch) {
                        if (r.channelId && !seenIds.has(r.channelId)) {
                            seenIds.add(r.channelId);
                            allResults.push(r);
                        }
                    }
                }

                send({
                    step: 'searching',
                    message: `Discovered ${allResults.length} unique creators across all filters. Refining...`,
                });

                if (allResults.length === 0) {
                    await supabase.from('searches').insert({
                        query,
                        filters: { minSubs, maxSubs, minViews, regions, languages },
                        result_count: 0,
                        quota_cost: estimatedUnits,
                    });
                    send({ step: 'done', creators: [], message: 'No channels found.' });
                    controller.close();
                    return;
                }

                // Limit pool to 200 for detail-fetch performance
                const pool = allResults.slice(0, 200);

                // ── Step 4: Batch fetch channel statistics (1 unit per 50) ────
                send({ step: 'fetching', message: `Verifying stats for ${pool.length} candidates...` });
                const channelIds = pool.map(r => r.channelId).filter(Boolean);
                const channelDetails = await getChannelDetails(channelIds, userYTKey);
                send({ step: 'fetching', message: `Analyzed ${channelDetails.length} channels` });

                // ── Step 5: JS-side subscriber filter + scoring ──────────────
                send({ step: 'enriching', message: 'Applying subscriber filters and computing ROI scores...' });

                const minSubsNum = minSubs ? parseInt(minSubs, 10) : null;
                const maxSubsNum = maxSubs ? parseInt(maxSubs, 10) : null;
                const minViewsNum = minViews ? parseInt(minViews, 10) : null;

                const creators = [];
                for (const channel of channelDetails) {
                    // Hidden subscriber counts default to 0
                    const subs = channel.subscriberCount ?? 0;

                    // Apply subscriber range filter in JavaScript
                    if (minSubsNum !== null && subs < minSubsNum) continue;
                    if (maxSubsNum !== null && subs > maxSubsNum) continue;

                    const avgViews = channel.viewCount > 0 && channel.videoCount > 0
                        ? Math.round(channel.viewCount / channel.videoCount) : 0;

                    if (minViewsNum !== null && avgViews < minViewsNum) continue;

                    // Lenient country filter: only skip if country is set AND wrong
                    if (
                        regions.length > 0 &&
                        channel.country &&
                        !regions.includes(channel.country)
                    ) continue;

                    const socials = extractSocialLinks(channel.description);
                    const uploadFreq = estimateUploadFrequency(channel.videoCount, channel.publishedAt);
                    const scores = calculatePriorityScore(avgViews, subs, null, uploadFreq);

                    creators.push({
                        youtube_id: channel.id,
                        name: channel.title,
                        description: channel.description,
                        profile_pic_url: channel.thumbnailUrl,
                        subscribers: subs,
                        total_views: channel.viewCount,
                        avg_views: avgViews,
                        video_count: channel.videoCount,
                        engagement_rate: subs > 0
                            ? Math.round((avgViews / subs) * 10000) / 100 : 0,
                        priority_score: scores.totalScore,
                        upload_frequency: uploadFreq,
                        telegram: socials.telegram,
                        twitter: socials.twitter,
                        instagram: socials.instagram,
                        facebook: socials.facebook,
                        whatsapp: socials.whatsapp,
                        website: socials.website,
                        email: socials.email,
                        country: channel.country || (regions.length === 1 ? countryMap[regions[0]] || '' : ''),
                        custom_url: channel.customUrl,
                        last_fetched_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                }

                send({ step: 'enriching', message: `Found ${creators.length} creators matching your criteria` });

                // ── Step 6: Persist to database ──────────────────────────────
                try {
                    send({ step: 'saving', message: `Saving ${creators.length} creators to database...` });
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

                    await supabase.from('searches').insert({
                        query,
                        filters: { minSubs, maxSubs, minViews, regions, languages },
                        result_count: creators.length,
                        quota_cost: estimatedUnits,
                    });
                } catch (dbErr) {
                    console.error('Database save error:', dbErr);
                    send({ step: 'saving', message: '⚠️ Database unreachable. Results shown but not saved.' });
                }

                // ── Step 7: Sort by Priority Score and return ────────────────
                creators.sort((a, b) => b.priority_score - a.priority_score);

                // Log activity asynchronously
                const topChannels = creators.slice(0, 5).map((c) => ({ name: c.name, thumb: c.profile_pic_url, subs: c.subscribers }));

                // Save to search_cache for Admin Reports
                const cachePayload = { query_hash: queryHash, results: creators, fetched_at: new Date().toISOString(), hit_count: 0 };
                serviceClient.from('search_cache').upsert(cachePayload, { onConflict: 'query_hash' }).then(() => { });

                serviceClient.from('activity_logs').insert({
                    user_id: session.user.id,
                    action_type: 'SEARCH_PERFORMED',
                    details: { query, result_count: creators.length, cache: 'miss', source: 'stream', top_channels: topChannels, query_hash: queryHash },
                }).then(() => { });

                send({ step: 'done', creators, message: `Found ${creators.length} creators` });

            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Search failed';
                send({ step: 'error', message: msg });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
