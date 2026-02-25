import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { searchChannels, getChannelDetails, searchChannelsByVideos } from '@/lib/youtube';
import { extractSocialLinks } from '@/lib/enrichment';
import { calculatePriorityScore, estimateUploadFrequency } from '@/lib/scoring';
import { hasQuotaBudget } from '@/lib/quota';
import { expandSearchQuery } from '@/lib/openai';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('query') || '';
    const minSubs = request.nextUrl.searchParams.get('minSubs');
    const maxSubs = request.nextUrl.searchParams.get('maxSubs');
    const minViews = request.nextUrl.searchParams.get('minViews');
    const countryCode = request.nextUrl.searchParams.get('country') || '';

    const countryMap: Record<string, string> = {
        'IN': 'India', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'ID': 'Indonesia',
        'VN': 'Vietnam', 'TH': 'Thailand', 'PH': 'Philippines', 'JP': 'Japan',
        'KR': 'South Korea', 'SG': 'Singapore', 'MY': 'Malaysia', 'LK': 'Sri Lanka',
        'NP': 'Nepal', 'TR': 'Turkey', 'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia',
        'UZ': 'Uzbekistan', 'KZ': 'Kazakhstan', 'IL': 'Israel', 'TW': 'Taiwan',
        'HK': 'Hong Kong', 'CN': 'China', 'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada'
    };
    const countryName = countryMap[countryCode] || '';

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                if (!query) {
                    send({ step: 'error', message: 'Query is required' });
                    controller.close();
                    return;
                }

                if (!process.env.YOUTUBE_API_KEY) {
                    send({ step: 'error', message: 'YouTube API key not configured. Go to Settings to add your key.' });
                    controller.close();
                    return;
                }

                send({ step: 'quota', message: 'Checking API quota...' });
                const hasBudget = await hasQuotaBudget(305); // Increased budget check for multiple calls
                if (!hasBudget) {
                    send({ step: 'error', message: 'Daily API quota exceeded.' });
                    controller.close();
                    return;
                }

                // Step 1: Search
                let searchTerms = [query];
                if (countryName) {
                    send({ step: 'searching', message: `Expanding query for ${countryName} using AI...` });
                    searchTerms = await expandSearchQuery(query, countryName);
                    send({ step: 'searching', message: `Scouting deep with: ${searchTerms.join(', ')}` });
                } else {
                    send({ step: 'searching', message: `Searching YouTube for "${query}"...` });
                }

                // Perform hybrid searches: via Channels and via Videos
                const allResults = [];
                const seenIds = new Set();

                for (const term of searchTerms) {
                    // Search channels directly (50 results)
                    const chResults = await searchChannels(term, 50, countryCode || undefined);
                    for (const r of chResults) {
                        if (!seenIds.has(r.channelId)) {
                            seenIds.add(r.channelId);
                            allResults.push(r);
                        }
                    }

                    // Also search via latest videos (50 results) - finds active influencers
                    const vidResults = await searchChannelsByVideos(term, 50, countryCode || undefined);
                    for (const r of vidResults) {
                        if (!seenIds.has(r.channelId)) {
                            seenIds.add(r.channelId);
                            allResults.push(r);
                        }
                    }

                    // Break early if we have a massive pool
                    if (allResults.length > 200) break;
                }

                if (allResults.length === 0) {
                    await supabase.from('searches').insert({
                        query, filters: { minSubs, maxSubs, minViews, countryCode }, result_count: 0, quota_cost: 100,
                    });
                    send({ step: 'done', creators: [], message: 'No channels found.' });
                    controller.close();
                    return;
                }

                // We limit detail fetching because it's expensive in terms of time, but we want a broad net
                const finalSearchResults = allResults.slice(0, 200);
                send({ step: 'searching', message: `Discovered a pool of ${allResults.length} potential creators. Refining...` });

                // Step 2: Fetch details
                send({ step: 'fetching', message: `Verifying stats and location for top ${finalSearchResults.length} candidates...` });
                const channelIds = finalSearchResults.map(r => r.channelId).filter(Boolean);
                const channelDetails = await getChannelDetails(channelIds);
                send({ step: 'fetching', message: `Analyzed ${channelDetails.length} channels` });

                // Step 3: Enrich & score
                send({ step: 'enriching', message: 'Applying filters and computing ROI scores...' });
                const creators = [];
                for (const channel of channelDetails) {
                    // Filter by subscribers/views
                    if (minSubs && channel.subscriberCount < parseInt(minSubs)) continue;
                    if (maxSubs && channel.subscriberCount > parseInt(maxSubs)) continue;

                    const avgViews = channel.viewCount > 0 && channel.videoCount > 0
                        ? Math.round(channel.viewCount / channel.videoCount) : 0;
                    if (minViews && avgViews < parseInt(minViews)) continue;

                    // Filter by country if specified (be lenient as country is often missing)
                    if (countryCode && channel.country && channel.country !== countryCode) {
                        // If it has a country and it's wrong, skip. 
                        // If it has no country, we trust the search keywords/AI expansion.
                        continue;
                    }

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
                        facebook: socials.facebook,
                        whatsapp: socials.whatsapp,
                        website: socials.website,
                        email: socials.email,
                        country: channel.country || countryName, // Use countryName as fallback if we searched specifically for it
                        custom_url: channel.customUrl,
                        last_fetched_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                }

                send({ step: 'enriching', message: `Found ${creators.length} creators matching your filter criteria` });

                // Step 4: Save to DB
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
                        query, filters: { minSubs, maxSubs, minViews },
                        result_count: creators.length, quota_cost: 101,
                    });
                } catch (dbErr: any) {
                    console.error('Database save error:', dbErr);
                    send({ step: 'saving', message: '⚠️ Database unreachable. Results shown but not saved.' });
                }

                creators.sort((a, b) => b.priority_score - a.priority_score);
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
