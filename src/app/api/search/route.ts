import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { searchChannels, getChannelDetails } from '@/lib/youtube';
import { extractSocialLinks } from '@/lib/enrichment';
import { calculatePriorityScore, estimateUploadFrequency } from '@/lib/scoring';
import { hasQuotaBudget } from '@/lib/quota';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, minSubs, maxSubs, minViews } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Check API key
        if (!process.env.YOUTUBE_API_KEY) {
            return NextResponse.json(
                { error: 'YouTube API key not configured. Go to Settings to add your key.' },
                { status: 400 }
            );
        }

        // Check quota budget (search = 100 units + channels.list = ~1 unit)
        const hasBudget = await hasQuotaBudget(102);
        if (!hasBudget) {
            return NextResponse.json(
                { error: 'Daily API quota exceeded. Resets at midnight PT.' },
                { status: 429 }
            );
        }

        // Step 1: Search YouTube for channels
        const searchResults = await searchChannels(query, 25);
        if (searchResults.length === 0) {
            // Log the search
            await supabase.from('searches').insert({
                query,
                filters: { minSubs, maxSubs, minViews },
                result_count: 0,
                quota_cost: 100,
            });
            return NextResponse.json({ creators: [], message: 'No channels found for this query.' });
        }

        // Step 2: Get detailed channel info (batch)
        const channelIds = searchResults.map((r) => r.channelId).filter(Boolean);
        const channelDetails = await getChannelDetails(channelIds);

        // Step 3: Enrich, score, and filter
        const creators = [];
        for (const channel of channelDetails) {
            // Apply filters
            if (minSubs && channel.subscriberCount < minSubs) continue;
            if (maxSubs && channel.subscriberCount > maxSubs) continue;

            const avgViews = channel.viewCount > 0 && channel.videoCount > 0
                ? Math.round(channel.viewCount / channel.videoCount)
                : 0;

            if (minViews && avgViews < minViews) continue;

            // Extract social links
            const socials = extractSocialLinks(channel.description);

            // Calculate scores
            const uploadFreq = estimateUploadFrequency(channel.videoCount, channel.publishedAt);
            const scores = calculatePriorityScore(
                avgViews,
                channel.subscriberCount,
                null,  // We don't have last upload date from channels.list
                uploadFreq
            );

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
                    ? Math.round((avgViews / channel.subscriberCount) * 10000) / 100
                    : 0,
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

        // Step 4: Upsert into database (update if youtube_id exists, insert if new)
        for (const creator of creators) {
            const { data: existing } = await supabase
                .from('creators')
                .select('id, last_fetched_at')
                .eq('youtube_id', creator.youtube_id)
                .single();

            if (existing) {
                // Check stale data (only update if older than 24 hours)
                const lastFetched = new Date(existing.last_fetched_at).getTime();
                const twentyFourHours = 24 * 60 * 60 * 1000;
                if (Date.now() - lastFetched > twentyFourHours) {
                    await supabase
                        .from('creators')
                        .update(creator)
                        .eq('id', existing.id);
                }
            } else {
                await supabase.from('creators').insert(creator);
            }
        }

        // Step 5: Log the search
        await supabase.from('searches').insert({
            query,
            filters: { minSubs, maxSubs, minViews },
            result_count: creators.length,
            quota_cost: 101,
        });

        // Return enriched creators sorted by priority score
        creators.sort((a, b) => b.priority_score - a.priority_score);

        return NextResponse.json({
            creators,
            meta: {
                total: creators.length,
                query,
                quotaCost: 101,
            },
        });
    } catch (error) {
        console.error('Search error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
