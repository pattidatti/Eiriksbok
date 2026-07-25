// Varig statistikk for Kjedereaksjonen (localStorage, samme mønster som
// loypeStats.ts) + registrering i «Min læring» ved fullført kjede.
//
// Uten dette hadde spillet ingenting å komme tilbake til: du løp kjeden, og så
// var det som om du aldri hadde vært der.

import type { DrivkraftId, KjedeResultat } from '../../../types/kjede';

const STATS_KEY = 'kjede_stats_v1';

export interface KjedeRekord {
    /** Antall ganger kjeden er fullført. */
    fullfort: number;
    forsok: number;
    besteRiktige: number;
    besteStreak: number;
    /** Har eleven noen gang klart kjeden uten en eneste omvei? */
    ubrutt: boolean;
    sistSpilt: number;
}

export interface KjedeStats {
    kjeder: Record<string, KjedeRekord>;
    /** Drivkrefter eleven har brukt minst én gang - en liten samling. */
    drivkrefter: DrivkraftId[];
}

const TOM_REKORD: KjedeRekord = {
    fullfort: 0,
    forsok: 0,
    besteRiktige: 0,
    besteStreak: 0,
    ubrutt: false,
    sistSpilt: 0,
};

const les = (): KjedeStats => {
    if (typeof window === 'undefined') return { kjeder: {}, drivkrefter: [] };
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return { kjeder: {}, drivkrefter: [] };
        const data = JSON.parse(raw) as Partial<KjedeStats>;
        return { kjeder: data.kjeder ?? {}, drivkrefter: data.drivkrefter ?? [] };
    } catch {
        return { kjeder: {}, drivkrefter: [] };
    }
};

const skriv = (stats: KjedeStats) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
        /* kvote eller deaktivert - ignorer stille */
    }
};

export const hentStats = (): KjedeStats => les();

export const hentRekord = (kjedeId: string): KjedeRekord =>
    ({ ...TOM_REKORD, ...les().kjeder[kjedeId] });

/** Hva som ble slått denne runden. Driver «Ny rekord!»-linjene på broen. */
export interface Rekordbrudd {
    forsteFullforing: boolean;
    nyBesteRiktige: boolean;
    nyBesteStreak: boolean;
    forsteUbrutte: boolean;
}

export const registrerRunde = (
    resultat: KjedeResultat,
    antallLedd: number
): Rekordbrudd => {
    const stats = les();
    const for_ = { ...TOM_REKORD, ...stats.kjeder[resultat.kjedeId] };
    const ubruttNaa = resultat.fullfort && resultat.riktigeForsteForsok === antallLedd;

    const brudd: Rekordbrudd = {
        forsteFullforing: resultat.fullfort && for_.fullfort === 0,
        nyBesteRiktige: resultat.riktigeForsteForsok > for_.besteRiktige && for_.forsok > 0,
        nyBesteStreak: resultat.bestStreak > for_.besteStreak && for_.forsok > 0,
        forsteUbrutte: ubruttNaa && !for_.ubrutt,
    };

    stats.kjeder[resultat.kjedeId] = {
        fullfort: for_.fullfort + (resultat.fullfort ? 1 : 0),
        forsok: for_.forsok + 1,
        besteRiktige: Math.max(for_.besteRiktige, resultat.riktigeForsteForsok),
        besteStreak: Math.max(for_.besteStreak, resultat.bestStreak),
        ubrutt: for_.ubrutt || ubruttNaa,
        sistSpilt: Date.now(),
    };
    for (const d of resultat.drivkrefter) {
        if (!stats.drivkrefter.includes(d)) stats.drivkrefter.push(d);
    }
    skriv(stats);
    return brudd;
};
