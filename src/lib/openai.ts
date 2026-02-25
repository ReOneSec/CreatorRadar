import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

interface CreatorInfo {
    name: string;
    subscribers: number;
    avg_views: number;
    engagement_rate: number;
    country: string | null;
    video_count: number;
}

interface PitchParams {
    creator: CreatorInfo;
    campaignName?: string;
    tone: 'professional' | 'casual' | 'friendly';
    productInfo?: string;
}

/**
 * Generate an outreach pitch using OpenAI, or fallback to a template
 */
export async function generatePitch(params: PitchParams): Promise<{ subject: string; pitch: string }> {
    const { creator, campaignName, tone, productInfo } = params;

    if (!openai) {
        return getTemplatePitch(params);
    }

    const toneGuide = {
        professional: 'formal, business-like, and structured',
        casual: 'relaxed, conversational, and approachable',
        friendly: 'warm, enthusiastic, and genuinely excited',
    };

    const prompt = `Write a short outreach email to a YouTube creator for a brand partnership.

Creator details:
- Name: ${creator.name}
- Subscribers: ${creator.subscribers.toLocaleString()}
- Average views: ${creator.avg_views.toLocaleString()}
- Engagement rate: ${creator.engagement_rate.toFixed(1)}%
- Country: ${creator.country || 'Unknown'}
- Videos: ${creator.video_count}

${campaignName ? `Campaign: ${campaignName}` : ''}
${productInfo ? `Product/Brand info: ${productInfo}` : 'Product info: [Our Brand]'}

Tone: ${toneGuide[tone]}

Rules:
- Keep it under 150 words
- Include a clear value proposition
- Reference their channel stats naturally
- End with a soft call to action
- Return JSON: {"subject": "...", "pitch": "..."}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.8,
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
            const parsed = JSON.parse(content);
            return { subject: parsed.subject, pitch: parsed.pitch };
        }
    } catch (err) {
        console.error('OpenAI error, falling back to template:', err);
    }

    return getTemplatePitch(params);
}

/**
 * Expand a search query with country-specific keywords using OpenAI
 */
export async function expandSearchQuery(query: string, countryName: string): Promise<string[]> {
    if (!openai || !countryName || countryName === 'All Countries') {
        return [`${query} ${countryName}`.trim()];
    }

    const prompt = `Act as a YouTube SEO expert.
Topic: "${query}"
Target Country: "${countryName}"

Generate 3 variations of search terms that would help find popular YouTube creators in this country for this topic.
Include local language terms if applicable (e.g. if country is Japan, include Japanese terms).
Return ONLY a JSON array of strings: ["term1", "term2", "term3"]`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 100,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) return parsed;
            if (parsed.keywords) return parsed.keywords;
            if (parsed.terms) return parsed.terms;
            // Handle common wrapper names
            const firstKey = Object.keys(parsed)[0];
            if (Array.isArray(parsed[firstKey])) return parsed[firstKey];
        }
    } catch (err) {
        console.error('Keyword expansion error:', err);
    }

    return [`${query} ${countryName}`.trim()];
}

function getTemplatePitch(params: PitchParams): { subject: string; pitch: string } {
    const { creator, campaignName, tone } = params;
    const greetings = { professional: 'Dear', casual: 'Hey', friendly: 'Hi' };
    const closings = {
        professional: 'Best regards',
        casual: 'Cheers',
        friendly: 'Looking forward to hearing from you! 😊',
    };

    return {
        subject: `Partnership Opportunity — ${campaignName || 'Brand Collaboration'}`,
        pitch: `${greetings[tone]} ${creator.name},

I came across your YouTube channel and was impressed by your content — with ${creator.subscribers.toLocaleString()} subscribers and a ${creator.engagement_rate.toFixed(1)}% engagement rate, your audience is clearly engaged.

We're working on ${campaignName || 'an exciting campaign'} and think your channel would be a perfect fit. We'd love to discuss a potential collaboration that benefits both your audience and our brand.

Would you be open to a quick chat this week?

${closings[tone]}`,
    };
}
