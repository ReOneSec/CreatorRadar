import { supabase } from './supabase';

const MAX_DAILY_QUOTA = 10000;

/**
 * Track API quota usage by logging to the database
 */
export async function trackQuotaUsage(
    units: number,
    operation: string,
    details?: string
): Promise<void> {
    await supabase.from('quota_usage').insert({
        units_used: units,
        operation,
        details: details || null,
    });
}

/**
 * Get today's quota usage and remaining units
 */
export async function getQuotaStatus(): Promise<{
    used: number;
    remaining: number;
    total: number;
    percentage: number;
    resetTime: string;
}> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('quota_usage')
        .select('units_used')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

    if (error) {
        console.error('Error fetching quota:', error);
        return { used: 0, remaining: MAX_DAILY_QUOTA, total: MAX_DAILY_QUOTA, percentage: 0, resetTime: '' };
    }

    const used = (data || []).reduce((sum, row) => sum + row.units_used, 0);
    const remaining = Math.max(MAX_DAILY_QUOTA - used, 0);

    // YouTube quota resets at midnight Pacific Time
    const now = new Date();
    const pst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const resetDate = new Date(pst);
    resetDate.setDate(resetDate.getDate() + 1);
    resetDate.setHours(0, 0, 0, 0);
    const msUntilReset = resetDate.getTime() - pst.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minsUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

    return {
        used,
        remaining,
        total: MAX_DAILY_QUOTA,
        percentage: Math.round((used / MAX_DAILY_QUOTA) * 100),
        resetTime: `${hoursUntilReset}h ${minsUntilReset}m`,
    };
}

/**
 * Check if we have enough quota for an operation
 */
export async function hasQuotaBudget(requiredUnits: number): Promise<boolean> {
    const status = await getQuotaStatus();
    return status.remaining >= requiredUnits;
}
