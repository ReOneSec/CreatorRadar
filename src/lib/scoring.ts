/**
 * Priority Scoring Algorithm
 *
 * Score (0–100) = Engagement (60%) + Recency (30%) + Consistency (10%)
 *
 * - Engagement: avg_views / subscribers (capped at 100%, then scaled)
 * - Recency: Days since last upload (0 days = 100, 30+ days = 0)
 * - Consistency: Uploads per month (4+/month = 100)
 */

export interface ScoreBreakdown {
    engagementScore: number;   // 0-100
    recencyScore: number;      // 0-100
    consistencyScore: number;  // 0-100
    totalScore: number;        // 0-100
}

/**
 * Calculate engagement score based on avg views vs subscriber count
 */
function calculateEngagementScore(avgViews: number, subscribers: number): number {
    if (subscribers <= 0) return 0;
    const ratio = avgViews / subscribers;
    // 10%+ engagement = perfect score; scale linearly
    const score = Math.min(ratio / 0.10, 1) * 100;
    return Math.round(Math.min(score, 100));
}

/**
 * Calculate recency score based on days since last upload
 */
function calculateRecencyScore(lastUploadAt: string | null): number {
    if (!lastUploadAt) return 0;
    const daysSinceUpload = (Date.now() - new Date(lastUploadAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpload <= 3) return 100;
    if (daysSinceUpload >= 60) return 0;
    // Linear decay from 100 to 0 over 3–60 days
    return Math.round(100 * (1 - (daysSinceUpload - 3) / 57));
}

/**
 * Calculate consistency score based on upload frequency (videos per month)
 */
function calculateConsistencyScore(uploadFrequency: number): number {
    // 4+ uploads/month = 100
    const score = Math.min(uploadFrequency / 4, 1) * 100;
    return Math.round(Math.min(score, 100));
}

/**
 * Calculate the overall priority score with weighted components
 */
export function calculatePriorityScore(
    avgViews: number,
    subscribers: number,
    lastUploadAt: string | null,
    uploadFrequency: number
): ScoreBreakdown {
    const engagementScore = calculateEngagementScore(avgViews, subscribers);
    const recencyScore = calculateRecencyScore(lastUploadAt);
    const consistencyScore = calculateConsistencyScore(uploadFrequency);

    const totalScore = Math.round(
        engagementScore * 0.6 +
        recencyScore * 0.3 +
        consistencyScore * 0.1
    );

    return {
        engagementScore,
        recencyScore,
        consistencyScore,
        totalScore: Math.min(totalScore, 100),
    };
}

/**
 * Estimate upload frequency (videos per month) based on video count and channel age
 */
export function estimateUploadFrequency(videoCount: number, channelCreatedAt: string): number {
    const monthsActive = Math.max(
        (Date.now() - new Date(channelCreatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30),
        1
    );
    return Math.round((videoCount / monthsActive) * 10) / 10;
}
