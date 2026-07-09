import type { ComparisonContent } from './types';

// Trekker ren tekst ut av sammenligningsinnhold (Tina rich text eller plain).
// Brukes av «Hvem hører dette til?»-oppgaven.
function collect(node: unknown): string {
    if (node == null) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(collect).join(' ');
    if (typeof node === 'object') {
        const record = node as { text?: unknown; children?: unknown };
        if (typeof record.text === 'string') return record.text;
        if (record.children) return collect(record.children);
    }
    return '';
}

export function extractPlainText(content: ComparisonContent | undefined): string {
    if (!content) return '';
    if (content.format === 'plain') return content.value;
    return collect(content.value).replace(/\s+/g, ' ').trim();
}

// Deler tekst i setninger som egner seg som gjettespørsmål
export function toQuizSentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 40 && s.length <= 220);
}
