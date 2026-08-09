import type { ContentBlock } from '../types';

export const cleanMarkdown = (text: string): string => {
    if (!text) return '';
    let cleaned = text;
    cleaned = cleaned.replace(/#{1,6}\s?/g, ''); // Headers
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Bold
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2'); // Italic
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
    return cleaned;
};

/** Extra cleaning for TTS: numbers, abbreviations, special characters */
export const cleanForTTS = (text: string): string => {
    let cleaned = cleanMarkdown(text);
    // Replace common abbreviations
    cleaned = cleaned.replace(/\bf\.eks\.\b/gi, 'for eksempel');
    cleaned = cleaned.replace(/\bca\.\b/gi, 'cirka');
    cleaned = cleaned.replace(/\bbl\.a\.\b/gi, 'blant annet');
    cleaned = cleaned.replace(/\bnr\.\b/gi, 'nummer');
    cleaned = cleaned.replace(/\bkr\.\b/gi, 'kroner');
    cleaned = cleaned.replace(/\bmrd\.\b/gi, 'milliarder');
    cleaned = cleaned.replace(/\bmill\.\b/gi, 'millioner');
    cleaned = cleaned.replace(/\bfr\.\b/gi, 'fra');
    cleaned = cleaned.replace(/\bm\.m\.\b/gi, 'med mer');
    cleaned = cleaned.replace(/\bosv\.\b/gi, 'og så videre');
    // Strip HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    // Collapse multiple spaces / newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
};

export const cleanTextForSpeech = (blocks: ContentBlock[]): string => {
    return blocks
        .flatMap((b) => (b.type === 'text' && b.content ? [cleanForTTS(b.content)] : []))
        .join('. ');
};
