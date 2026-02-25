import { NextResponse } from 'next/server';
import { getQuotaStatus } from '@/lib/quota';

export async function GET() {
    try {
        const status = await getQuotaStatus();
        return NextResponse.json(status);
    } catch (error: any) {
        console.error('Quota status error:', error.message || error);
        return NextResponse.json(
            { used: 0, remaining: 10000, total: 10000, percentage: 0, resetTime: 'Unknown', error: error.message },
            { status: 500 }
        );
    }
}
