/**
 * Enrichment Engine: Extract social media handles from channel descriptions
 * using regex pattern matching.
 */

export interface SocialLinks {
    telegram: string | null;
    twitter: string | null;
    instagram: string | null;
    email: string | null;
    facebook: string | null;
    whatsapp: string | null;
    website: string | null;
}

/**
 * Extract Telegram links/handles from text
 */
function extractTelegram(text: string): string | null {
    const patterns = [
        /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i,
        /(?:telegram|tg)\s*[:\-@]\s*@?([a-zA-Z0-9_]+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return `https://t.me/${match[1]}`;
    }
    return null;
}

/**
 * Extract Twitter/X links/handles from text
 */
function extractTwitter(text: string): string | null {
    const patterns = [
        /(?:https?:\/\/)?(?:(?:www\.)?twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i,
        /(?:twitter|x)\s*[:\-@]\s*@?([a-zA-Z0-9_]+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && !['intent', 'share', 'home', 'search'].includes(match[1].toLowerCase())) {
            return `https://x.com/${match[1]}`;
        }
    }
    return null;
}

/**
 * Extract Instagram links/handles from text
 */
function extractInstagram(text: string): string | null {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/i,
        /(?:instagram|ig|insta)\s*[:\-@]\s*@?([a-zA-Z0-9_.]+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && !['p', 'explore', 'reel', 'stories'].includes(match[1].toLowerCase())) {
            return `https://instagram.com/${match[1]}`;
        }
    }
    return null;
}

/**
 * Extract Facebook links
 */
function extractFacebook(text: string): string | null {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/(?:pages\/[a-zA-Z0-9-]+\/)?([a-zA-Z0-9.]+)/i,
        /facebook\s*[:\-]\s*([a-zA-Z0-9.]+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && !['sharer', 'home', 'pages'].includes(match[1].toLowerCase())) {
            return `https://facebook.com/${match[1]}`;
        }
    }
    return null;
}

/**
 * Extract WhatsApp links
 */
function extractWhatsApp(text: string): string | null {
    const patterns = [
        /(?:https?:\/\/)?wa\.me\/([0-9]+)/i,
        /whatsapp\s*[:\-]\s*\+?([0-9\s\-]{8,})/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const num = match[1].replace(/\s/g, '').replace(/-/g, '');
            return `https://wa.me/${num}`;
        }
    }
    return null;
}

/**
 * Extract email addresses from text
 */
function extractEmail(text: string): string | null {
    const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(pattern);
    return match ? match[0] : null;
}

/**
 * Extract a generic website link (that isn't a known social media site)
 */
function extractWebsite(text: string): string | null {
    const pattern = /(https?:\/\/(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s\n\r]*)/gi;
    const matches = text.match(pattern);

    if (!matches) return null;

    const socialDomains = ['youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'instagram.com', 't.me', 'facebook.com', 'fb.com', 'wa.me', 'tiktok.com', 'linkedin.com', 'discord.gg', 'discord.com', 'patreon.com', 'google.com'];

    for (const link of matches) {
        const url = link.toLowerCase();
        if (!socialDomains.some(domain => url.includes(domain))) {
            return link;
        }
    }
    return null;
}

/**
 * Extract all social links from a channel description
 */
export function extractSocialLinks(description: string): SocialLinks {
    return {
        telegram: extractTelegram(description),
        twitter: extractTwitter(description),
        instagram: extractInstagram(description),
        email: extractEmail(description),
        facebook: extractFacebook(description),
        whatsapp: extractWhatsApp(description),
        website: extractWebsite(description),
    };
}
