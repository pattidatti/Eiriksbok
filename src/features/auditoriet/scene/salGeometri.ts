// Målene til salen, delt av rommet, publikum, foreleseren og eleven som går rundt.
// Én kilde, så et sete aldri står ett sted og kan klikkes et annet.
//
// Koordinater: +z mot bakveggen (der eleven kommer inn), -z mot lerretet.
// +x er til høyre sett fra salen. 1 enhet = 1 meter.

export const HALV_BREDDE = 10;
export const FRONTVEGG_Z = -9;
export const TAKHOYDE = 8.5;

export const SCENE_HOYDE = 0.4;
/** Forkanten av podiet. Eleven kan ikke gå opp på det. */
export const SCENE_KANT_Z = -3.6;

export const RADER = 8;
export const RAD_DYBDE = 1.15;
export const RAD_STIGNING = 0.45;
/** Starten (fremkanten) av første rads gulv. */
export const RAD_START_Z = -2.4;
export const BAKVEGG_Z = RAD_START_Z + RADER * RAD_DYBDE + 3.4;
export const TOPP_HOYDE = RADER * RAD_STIGNING;

/** Lerretet på frontveggen. */
export const LERRET = { x: 1.2, y: 4.3, z: FRONTVEGG_Z + 0.08, bredde: 8.4, hoyde: 8.4 * (9 / 16) };

/** Der foreleseren står ved kateteret, og der hun står når hun peker på lerretet. */
export const FORELESER_HJEM: [number, number] = [-3.3, -5.2];
export const FORELESER_PEKEPLASS: [number, number] = [-2.8, -7.3];
export const KATETER: [number, number] = [-5.0, -5.0];
/** Foreleseren er tegnet litt større enn livet, så hun syns fra bakerste rad. */
export const FORELESER_SKALA = 1.22;

/** Øyehøyde stående og sittende, over gulvet der eleven er. */
export const OYE_STAENDE = 1.62;
export const OYE_SITTENDE = 1.32;

/** Midten av bakerste rad i z, for rad r (0 = fremst). */
export function radZ(r: number) {
    return RAD_START_Z + r * RAD_DYBDE + RAD_DYBDE * 0.62;
}

export function radGulv(r: number) {
    return r * RAD_STIGNING;
}

/** Gulvhøyden der eleven står. Trinnene glattes av kameraet, ikke her. */
export function gulvVed(z: number) {
    if (z < RAD_START_Z) return 0;
    const r = Math.floor((z - RAD_START_Z) / RAD_DYBDE);
    return Math.min(RADER - 1, r) * RAD_STIGNING + (r >= RADER ? RAD_STIGNING : 0);
}

/** x-posisjonene til setene i én rad: to blokker med midtgang. */
export const SETE_X = [-7.5, -6.3, -5.1, -3.9, -2.7, 2.7, 3.9, 5.1, 6.3, 7.5];
export const MIDTGANG = 1.6;

export interface Sete {
    id: number;
    rad: number;
    x: number;
    z: number;
    gulv: number;
}

export const SETER: Sete[] = Array.from({ length: RADER }, (_, rad) =>
    SETE_X.map((x, i) => ({
        id: rad * SETE_X.length + i,
        rad,
        x,
        z: radZ(rad),
        gulv: radGulv(rad),
    }))
).flat();

/**
 * Hvilke seter publikum sitter i. Fast frø, så salen ser lik ut hver gang, men aldri
 * så full at det er vanskelig å finne plass. De beste plassene (rad 2-4, nær
 * midtgangen) holdes delvis ledige med vilje.
 */
export const OPPTATT: Set<number> = (() => {
    let s = 20261008;
    const tilfeldig = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
    const opptatt = new Set<number>();
    for (const sete of SETER) {
        const godPlass = sete.rad >= 2 && sete.rad <= 4 && Math.abs(sete.x) < 4.5;
        const sjanse = godPlass ? 0.35 : 0.55;
        if (tilfeldig() < sjanse) opptatt.add(sete.id);
    }
    return opptatt;
})();

/** Startposisjonen: inne i døra, øverst bak i salen. */
export const START_POS: [number, number] = [0, BAKVEGG_Z - 1.2];

/**
 * Plassen «Finn en plass» går til: det ledige setet nærmest midt i rad 3, helst
 * uten noen rett foran, så eleven ser foreleseren og ikke et bakhode.
 */
export function bestLedigSete(): Sete {
    const kost = (s: Sete) => {
        const foran = s.rad > 0 && OPPTATT.has(s.id - SETE_X.length);
        return Math.abs(s.rad - 3) * 2 + Math.abs(s.x) / 2 + (foran ? 6 : 0);
    };
    return SETER.filter((s) => !OPPTATT.has(s.id)).sort((a, b) => kost(a) - kost(b))[0];
}
