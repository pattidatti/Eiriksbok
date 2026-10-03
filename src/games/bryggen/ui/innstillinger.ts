// Innstillingene eleven velger i pausemenyen, husket i nettleseren (`bryggen-innstillinger`).
//
// De gamle nøklene (`bryggen-kvalitet` fra Grafikk-knappen og `bryggen-lyd` fra Lyd-knappen) leses
// første gang og flyttes over, så valget ikke går tapt. `?kvalitet=`, `?skygger=0` og `?post=0` i
// adressen overstyrer for én økt (måling) og lagres ikke.
import type { GrayboxGame, Quality } from '../graboks/game';
import type { BussVolum } from '../motor/lyd';

export interface Innstillinger {
    grafikk: Quality;
    skygger: boolean;
    /** Etterbehandlingen (lysstråler, glød, SSAO). Bare på full grafikk. */
    post: boolean;
    lyd: { paa: boolean; volum: number; busser: BussVolum };
    /** Musefølsomhet og piltastfart, 1 = standard (0,3-3). */
    folsomhet: number;
    inverterY: boolean;
    /** FPS-boksen i hjørnet (målinger). */
    visYtelse: boolean;
}

export const STANDARD: Innstillinger = {
    grafikk: 'full',
    skygger: true,
    post: true,
    lyd: { paa: true, volum: 0.8, busser: { ute: 1, inne: 1, hendelse: 1 } },
    folsomhet: 1,
    inverterY: false,
    visYtelse: true,
};

const NOKKEL = 'bryggen-innstillinger';
const GAMMEL_KVALITET = 'bryggen-kvalitet';
const GAMMEL_LYD = 'bryggen-lyd';

const tall = (v: unknown, std: number, min = 0, max = 1) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : std);
const sant = (v: unknown, std: boolean) => (typeof v === 'boolean' ? v : std);

/** Leser innstillingene. Ødelagte eller manglende verdier blir standard, én og én. */
export function lesInnstillinger(): Innstillinger {
    const s: Innstillinger = structuredClone(STANDARD);
    try {
        const raa = localStorage.getItem(NOKKEL);
        if (raa) {
            const v = JSON.parse(raa) as Partial<Innstillinger> & { lyd?: Partial<Innstillinger['lyd']> & { busser?: Partial<BussVolum> } };
            s.grafikk = v.grafikk === 'lav' ? 'lav' : 'full';
            s.skygger = sant(v.skygger, s.skygger);
            s.post = sant(v.post, s.post);
            s.lyd.paa = sant(v.lyd?.paa, s.lyd.paa);
            s.lyd.volum = tall(v.lyd?.volum, s.lyd.volum);
            for (const b of ['ute', 'inne', 'hendelse'] as const) s.lyd.busser[b] = tall(v.lyd?.busser?.[b], 1);
            s.folsomhet = tall(v.folsomhet, 1, 0.3, 3);
            s.inverterY = sant(v.inverterY, false);
            s.visYtelse = sant(v.visYtelse, true);
            return s;
        }
        // Flytt over de gamle valgene.
        if (localStorage.getItem(GAMMEL_KVALITET) === 'lav') s.grafikk = 'lav';
        const lyd = JSON.parse(localStorage.getItem(GAMMEL_LYD) ?? 'null') as { paa?: unknown; volum?: unknown } | null;
        if (lyd) {
            s.lyd.paa = sant(lyd.paa, true);
            s.lyd.volum = tall(lyd.volum, 0.8);
        }
        lagreInnstillinger(s);
        localStorage.removeItem(GAMMEL_KVALITET);
        localStorage.removeItem(GAMMEL_LYD);
    } catch {
        // Lagring blokkert eller ødelagt: standard.
    }
    return s;
}

export function lagreInnstillinger(s: Innstillinger): void {
    try {
        localStorage.setItem(NOKKEL, JSON.stringify(s));
    } catch {
        // Lagring blokkert: valget gjelder bare denne økta.
    }
}

/** Overstyringer fra adressen (for måling), som ikke lagres. */
export function fraAdressen(s: Innstillinger, params: URLSearchParams): Innstillinger {
    const q = params.get('kvalitet');
    return { ...s, grafikk: q === 'lav' || q === 'full' ? q : s.grafikk };
}

/** Sender innstillingene til spillet. Trygt å kalle ofte: spillet hopper over det som ikke endret seg. */
export function brukInnstillinger(game: GrayboxGame, s: Innstillinger): void {
    void game.setQuality(s.grafikk, s.skygger);
    game.postPaa = s.post;
    game.settLyd(s.lyd.paa, s.lyd.volum, s.lyd.busser);
    game.input.folsomhet = s.folsomhet;
    game.input.inverterY = s.inverterY;
}
