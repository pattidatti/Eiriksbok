// Én artikkel kan høre til flere temaer: bønn-artiklene ligger både under
// «Bønn» og «Dagligliv», og overgangsriter-artiklene både under «Døden» og
// «Overgangsriter». Krysslenkene må velge ett tema, og skal velge det som
// gir eleven mest.

import type { ManifestTopic } from '../comparison/types';

/**
 * Temaet en artikkel hører hjemme i: først det temaet som heter det samme som
 * artikkelen, ellers det som dekker flest religioner.
 */
export function bestTopicForLink(
    topics: ManifestTopic[] | undefined,
    link: string
): ManifestTopic | null {
    const matches = (topics ?? []).filter((t) => t.entries.some((e) => e.link === link));
    if (matches.length === 0) return null;
    const ownSlug = link.split('/').pop();
    return (
        matches.find((t) => t.slug === ownSlug) ??
        [...matches].sort((a, b) => b.count - a.count)[0]
    );
}
