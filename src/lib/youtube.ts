import { trackQuotaUsage } from './quota';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(apiKey?: string): string {
    return apiKey || process.env.YOUTUBE_API_KEY || '';
}

export interface YouTubeSearchResult {
    channelId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
}

export interface YouTubeChannelDetails {
    id: string;
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnailUrl: string;
    country: string;
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
}

export interface YouTubeVideo {
    id: string;
    title: string;
    publishedAt: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
}

/**
 * Search YouTube for channels matching a keyword query.
 * Cost: 100 units per call.
 */
export async function searchChannels(
    query: string,
    maxResults: number = 50,
    regionCode?: string,
    relevanceLanguage?: string,
    apiKey?: string
): Promise<YouTubeSearchResult[]> {
    const key = getApiKey(apiKey);
    if (!key) throw new Error('YouTube API key not configured');

    const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'channel',
        maxResults: String(Math.min(maxResults, 50)),
        key,
    });

    if (regionCode) params.set('regionCode', regionCode);
    if (relevanceLanguage) params.set('relevanceLanguage', relevanceLanguage);

    const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(`YouTube Search API error: ${err.error?.message || res.statusText}`);
    }

    await trackQuotaUsage(100, 'search', `Query: ${query}`);

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.items || []).map((item: any) => ({
        channelId: item.snippet.channelId || item.id?.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    }));
}

/**
 * Find channels by searching for videos on a topic.
 * This is often more effective for finding active creators.
 * Cost: 100 units per call.
 */
export async function searchChannelsByVideos(
    query: string,
    maxResults: number = 50,
    regionCode?: string,
    relevanceLanguage?: string,
    apiKey?: string
): Promise<YouTubeSearchResult[]> {
    const key = getApiKey(apiKey);
    if (!key) throw new Error('YouTube API key not configured');

    const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: String(Math.min(maxResults, 50)),
        key,
        order: 'relevance'
    });

    if (regionCode) params.set('regionCode', regionCode);
    if (relevanceLanguage) params.set('relevanceLanguage', relevanceLanguage);

    const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(`YouTube Video Search error: ${err.error?.message || res.statusText}`);
    }

    await trackQuotaUsage(100, 'search.videos', `Query: ${query}`);

    const data = await res.json();
    const seenChannels = new Set<string>();
    const results: YouTubeSearchResult[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (data.items || []) as any[]) {
        const channelId = item.snippet.channelId;
        if (channelId && !seenChannels.has(channelId)) {
            seenChannels.add(channelId);
            results.push({
                channelId,
                title: item.snippet.channelTitle,
                description: item.snippet.description,
                thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            });
        }
    }

    return results;
}

/**
 * Get detailed channel info for up to 50 channel IDs at once.
 * Cost: 1 unit per call (batch of up to 50).
 */
export async function getChannelDetails(
    channelIds: string[],
    apiKey?: string
): Promise<YouTubeChannelDetails[]> {
    const key = getApiKey(apiKey);
    if (!key) throw new Error('YouTube API key not configured');

    const results: YouTubeChannelDetails[] = [];

    // Process in batches of 50
    for (let i = 0; i < channelIds.length; i += 50) {
        const batch = channelIds.slice(i, i + 50);
        const params = new URLSearchParams({
            part: 'snippet,statistics,brandingSettings',
            id: batch.join(','),
            key,
        });

        const res = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`YouTube Channels API error: ${err.error?.message || res.statusText}`);
        }

        await trackQuotaUsage(1, 'channels.list', `Batch of ${batch.length} channels`);

        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of (data.items || []) as any[]) {
            results.push({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description || '',
                customUrl: item.snippet.customUrl || '',
                publishedAt: item.snippet.publishedAt,
                thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                country: item.snippet.country || item.brandingSettings?.channel?.country || '',
                subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
                viewCount: parseInt(item.statistics.viewCount || '0', 10),
                videoCount: parseInt(item.statistics.videoCount || '0', 10),
            });
        }
    }

    return results;
}

/**
 * Get recent videos for a channel.
 * Cost: 100 units for search + 1 unit for video details.
 */
export async function getRecentVideos(
    channelId: string,
    maxResults: number = 10,
    apiKey?: string
): Promise<YouTubeVideo[]> {
    const key = getApiKey(apiKey);
    if (!key) throw new Error('YouTube API key not configured');

    // Step 1: Search for recent videos from this channel
    const searchParams = new URLSearchParams({
        part: 'snippet',
        channelId,
        order: 'date',
        type: 'video',
        maxResults: String(Math.min(maxResults, 50)),
        key,
    });

    const searchRes = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);
    if (!searchRes.ok) {
        const err = await searchRes.json();
        throw new Error(`YouTube Search API error: ${err.error?.message || searchRes.statusText}`);
    }

    await trackQuotaUsage(100, 'search.videos', `Channel: ${channelId}`);

    const searchData = await searchRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoIds = (searchData.items || []).map((item: any) => item.id.videoId).filter(Boolean);

    if (videoIds.length === 0) return [];

    // Step 2: Get video statistics
    const statsParams = new URLSearchParams({
        part: 'statistics,snippet',
        id: videoIds.join(','),
        key,
    });

    const statsRes = await fetch(`${YOUTUBE_API_BASE}/videos?${statsParams}`);
    if (!statsRes.ok) {
        const err = await statsRes.json();
        throw new Error(`YouTube Videos API error: ${err.error?.message || statsRes.statusText}`);
    }

    await trackQuotaUsage(1, 'videos.list', `${videoIds.length} videos`);

    const statsData = await statsRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (statsData.items || []).map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        viewCount: parseInt(item.statistics.viewCount || '0', 10),
        likeCount: parseInt(item.statistics.likeCount || '0', 10),
        commentCount: parseInt(item.statistics.commentCount || '0', 10),
    }));
}
