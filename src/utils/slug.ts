// Normaliserer tema-tags til URL-/mappevennlige slugs.
// Må holdes i synk med normalizeTagSlug i scripts/generate-comparison-manifest.mjs:
// innholdsmappene bruker ASCII (bønn -> bonn, hellige_tekster -> hellige-tekster).

const TAG_ALIASES: Record<string, string> = {
    'frelse-og-mal': 'frelse',
    skapelsesmyte: 'skapelse',
    ritualer: 'ritual',
    fortellinger: 'narrative',
};

export function normalizeTagSlug(tag: string): string {
    const slug = tag
        .trim()
        .toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'o')
        .replace(/å/g, 'a')
        .replace(/[_\s]+/g, '-');
    return TAG_ALIASES[slug] ?? slug;
}
