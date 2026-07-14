
// Relativ tid på norsk for aktivitetslogger («Min læring»): "nettopp",
// "for 3 minutter siden", "for 2 timer siden", osv.
export const formatRelativeTimeNo = (at: number, now: number = Date.now()): string => {
    const diffSeconds = Math.max(0, Math.round((now - at) / 1000));

    if (diffSeconds < 60) return 'nettopp';

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) {
        return diffMinutes === 1 ? 'for 1 minutt siden' : `for ${diffMinutes} minutter siden`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return diffHours === 1 ? 'for 1 time siden' : `for ${diffHours} timer siden`;
    }

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) {
        return diffDays === 1 ? 'for 1 dag siden' : `for ${diffDays} dager siden`;
    }

    const diffWeeks = Math.round(diffDays / 7);
    if (diffWeeks < 5) {
        return diffWeeks === 1 ? 'for 1 uke siden' : `for ${diffWeeks} uker siden`;
    }

    const diffMonths = Math.round(diffDays / 30);
    if (diffMonths < 12) {
        return diffMonths === 1 ? 'for 1 måned siden' : `for ${diffMonths} måneder siden`;
    }

    const diffYears = Math.round(diffDays / 365);
    return diffYears === 1 ? 'for 1 år siden' : `for ${diffYears} år siden`;
};

// Helper to parse year strings like "1918–1939", "1885", "550 fvt", "-500-476", "August 1945", "6. juni 1944"
export const parseYearRange = (yearStr: string): { start: number, end: number } => {
    if (!yearStr) return { start: 0, end: 0 };

    // Basic cleaning, but keep some context for regex
    const cleanStr = yearStr.replace(/ca\.?/i, '').trim();
    const isBC = cleanStr.toLowerCase().includes('fvt');
    const multiplier = isBC ? -1 : 1;

    // Remove BC/AD suffixes for easier numeric extraction
    const numStr = cleanStr.replace(/fvt\.?|evt\.?/i, '');

    // 1. Check for ranges first (dashes)
    const parts = numStr.split(/[–-]/);
    if (parts.length >= 2) {
        const extractYear = (s: string) => {
            // Find numbers with 3-4 digits first (years), otherwise any number
            const matches = s.match(/\d{3,4}/) || s.match(/\d+/g);
            return matches ? parseInt(matches[matches.length - 1]) : NaN;
        };

        const start = extractYear(parts[0]);
        const end = extractYear(parts[parts.length - 1]);

        if (!isNaN(start)) {
            return {
                start: start * multiplier,
                end: (isNaN(end) ? start : end) * multiplier
            };
        }
    }

    // 2. Single year or descriptive date
    // Try to find a 3-4 digit year first (avoids day/month numbers)
    // If no 3-4 digit year, take the last number found
    const matches = numStr.match(/\d{3,4}/) || numStr.match(/\d+/g);
    if (matches) {
        const year = parseInt(matches[matches.length - 1]);
        return { start: year * multiplier, end: year * multiplier };
    }

    return { start: 0, end: 0 };
};
