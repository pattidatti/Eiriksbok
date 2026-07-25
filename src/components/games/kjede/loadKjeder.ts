// Henter kjedene fra `public/content/kjeder/`. `kjede-oversikt.json` genereres av
// `scripts/validate-kjeder.mjs` som del av `npm run scan:content`.

import type { Kjede, KjedeIndexEntry } from '../../../types/kjede';

export const hentKjedeIndeks = async (): Promise<KjedeIndexEntry[]> => {
    const res = await fetch('/content/kjeder/kjede-oversikt.json');
    if (!res.ok) throw new Error('Fant ikke kjede-indeksen');
    const data = (await res.json()) as { kjeder: KjedeIndexEntry[] };
    return data.kjeder ?? [];
};

export const hentKjede = async (id: string): Promise<Kjede> => {
    const res = await fetch(`/content/kjeder/${id}.json`);
    if (!res.ok) throw new Error(`Fant ikke kjeden «${id}»`);
    return (await res.json()) as Kjede;
};
