// Simuleringen bak Kjedereaksjonen. Ren TypeScript uten React og uten canvas:
// `opprettVerden` bygger tilstanden, `stegVerden` flytter den ett tidssteg, og
// kanvaset tegner bare det som står her. Verden muteres med vilje - den kjøres
// 60 ganger i sekundet, og en ny kopi per frame ville kostet mer enn den smaker
// på en Chromebook.

import type { DrivkraftId, Kjede, KjedeFeil, LeddResultat } from '../../../types/kjede';
import { djb2Hash, mulberry32, shuffleWith } from '../../../utils/reviewScheduler';
import {
    CHOICE_ROW_Y,
    CLIMB_DUR,
    CRACK_DUR,
    CRACK_HOLD,
    FALL_DUR,
    FEILSPOR_TOP,
    FOG_CATCH_MARGIN,
    FOG_START_LEAD,
    GROUND_TOP,
    LEAP_DUR,
    SETTLE_DUR,
    SLAB_W,
    THINK_TIME_SCALE,
    arcPoint,
    clamp01,
    easeInQuad,
    easeOutBack,
    easeOutCubic,
    edgeX,
    landingX,
    runSpeed,
    segmentX,
} from '../../../utils/kjedeFysikk';
import { beregnEffekter, tilbud, type DrivkraftEffekter } from './drivkrefter';

export type Fase =
    | 'lop'
    | 'tenk'
    | 'sprang'
    | 'landing'
    | 'fall'
    | 'feilspor'
    | 'klatre'
    | 'drivkraft'
    | 'mal'
    | 'tatt';

export type Steintilstand = 'svever' | 'senkes' | 'smuldrer' | 'borte';

export interface Valgstein {
    row: number; // 0 = øverst
    tekst: string;
    riktig: boolean;
    hvorfor?: string;
    tilstand: Steintilstand;
    /** 0-1 gjennom gjeldende animasjon. */
    anim: number;
    /** Y-en steinen tegnes på nå. Settes av animasjonene. */
    y: number;
}

/** Hendelser verden sender opp til React. Kanvaset er stumt for seg selv. */
export type Verdenshendelse =
    | { type: 'valg-vises' }
    | { type: 'riktig'; streak: number }
    | { type: 'feil'; hvorfor: string }
    | { type: 'drivkraft-tilbud'; tilbudte: DrivkraftId[] }
    | { type: 'ferdig'; fullfort: boolean };

export interface KjedeVerden {
    kjede: Kjede;
    seed: number;
    fase: Fase;
    /** Sekunder i gjeldende fase, målt i ekte tid. */
    faseT: number;
    /** Hvilken bakkestein figuren står på. 0 = utgangspunktet. */
    segment: number;
    playerX: number;
    playerY: number;
    fogX: number;
    camY: number;
    streak: number;
    bestStreak: number;
    riktigeForsteForsok: number;
    tid: number;
    valg: Valgstein[] | null;
    markert: number;
    aktivFeil: KjedeFeil | null;
    resultater: LeddResultat[];
    drivkrefter: DrivkraftId[];
    tilbudte: DrivkraftId[] | null;
    effekter: DrivkraftEffekter;
    hendelser: Verdenshendelse[];
    /** Settes når figuren har landet feil, slik at 'fall' vet hvor den faller fra. */
    fallFraY: number;
}

// ---------------------------------------------------------------------------
// Oppsett
// ---------------------------------------------------------------------------

export const opprettVerden = (kjede: Kjede, seed: number): KjedeVerden => ({
    kjede,
    seed,
    fase: 'lop',
    faseT: 0,
    segment: 0,
    playerX: segmentX(0) + 90,
    playerY: GROUND_TOP,
    fogX: segmentX(0) + 90 - FOG_START_LEAD,
    camY: 0,
    streak: 0,
    bestStreak: 0,
    riktigeForsteForsok: 0,
    tid: 0,
    valg: null,
    markert: 1,
    aktivFeil: null,
    resultater: [],
    drivkrefter: [],
    tilbudte: null,
    effekter: beregnEffekter([]),
    hendelser: [],
    fallFraY: GROUND_TOP,
});

/** Leddet eleven er på vei inn i akkurat nå. */
const kommendeLedd = (w: KjedeVerden) => w.kjede.ledd[w.segment];

/**
 * Trekker de to feilalternativene eleven møter denne runden.
 *
 * Ett fra hver lengdebøtte: ett som er minst like langt som fasiten, og ett som
 * er høyst like langt. Dermed er det riktige svaret aldri verken det lengste
 * eller det korteste på skjermen. Uten den regelen var fasiten det lengste
 * alternativet i fem av seks ledd i den første kjeden, og en elev kunne score
 * uten å kunne noe historie. `validate-kjeder.mjs` sikrer at begge bøttene har
 * minst to kandidater, så trekningen faktisk varierer mellom runder.
 */
const trekkFeil = (ledd: Kjede['ledd'][number], rng: () => number): KjedeFeil[] => {
    const fasitLengde = ledd.tekst.length;
    const lengre = shuffleWith(
        ledd.feil.filter((f) => f.tekst.length >= fasitLengde),
        rng
    );
    const kortere = shuffleWith(
        ledd.feil.filter((f) => f.tekst.length <= fasitLengde),
        rng
    );
    const valgt: KjedeFeil[] = [];
    if (lengre[0]) valgt.push(lengre[0]);
    // Et alternativ med nøyaktig samme lengde ligger i begge bøttene
    const kort = kortere.find((f) => f !== valgt[0]);
    if (kort) valgt.push(kort);
    // Skulle en kjede slippe gjennom med tom bøtte, fyll opp i stedet for å
    // tegne færre steiner enn spillet forventer
    if (valgt.length < 2) {
        for (const f of shuffleWith(ledd.feil, rng)) {
            if (valgt.length >= 2) break;
            if (!valgt.includes(f)) valgt.push(f);
        }
    }
    return valgt;
};

const byggValg = (w: KjedeVerden): Valgstein[] => {
    const ledd = kommendeLedd(w);
    const rng = mulberry32(djb2Hash(`${w.seed}:${w.kjede.id}:${w.segment}`));
    const kandidater: Omit<Valgstein, 'row' | 'tilstand' | 'anim' | 'y'>[] = [
        { tekst: ledd.tekst, riktig: true },
        ...trekkFeil(ledd, rng).map((f) => ({
            tekst: f.tekst,
            riktig: false,
            hvorfor: f.hvorfor,
        })),
    ];
    const stokket = shuffleWith(kandidater, rng);
    const steiner = stokket.map((k, row) => ({
        ...k,
        row,
        tilstand: 'svever' as Steintilstand,
        anim: 0,
        y: CHOICE_ROW_Y[row],
    }));

    // Religion: én gal påstand smuldrer bort før eleven rekker å lese den ferdig
    if (w.effekter.fjernEttGaltSvar) {
        const gale = steiner.filter((s) => !s.riktig);
        const offer = gale[Math.floor(rng() * gale.length)];
        if (offer) {
            offer.tilstand = 'smuldrer';
            offer.anim = 0;
        }
    }
    return steiner;
};

/** Midtveis i kjeden får eleven velge drivkraft. */
const drivkraftpunkt = (kjede: Kjede) => Math.ceil(kjede.ledd.length / 2);

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export const kanVelge = (w: KjedeVerden): boolean => w.fase === 'tenk' && w.valg !== null;

export const flyttMarkering = (w: KjedeVerden, retning: -1 | 1) => {
    if (!kanVelge(w) || !w.valg) return;
    const gyldige = w.valg.filter((s) => s.tilstand !== 'smuldrer' && s.tilstand !== 'borte');
    if (gyldige.length === 0) return;
    let neste = w.markert;
    for (let i = 0; i < w.valg.length; i++) {
        neste = (neste + retning + w.valg.length) % w.valg.length;
        const stein = w.valg[neste];
        if (stein.tilstand !== 'smuldrer' && stein.tilstand !== 'borte') break;
    }
    w.markert = neste;
};

export const velg = (w: KjedeVerden, row: number) => {
    if (!kanVelge(w) || !w.valg) return;
    const stein = w.valg[row];
    if (!stein || stein.tilstand === 'smuldrer' || stein.tilstand === 'borte') return;

    w.markert = row;
    const ledd = kommendeLedd(w);
    const resultat: LeddResultat = {
        index: w.segment,
        tekst: ledd.tekst,
        link: ledd.link,
        riktig: stein.riktig,
    };

    if (stein.riktig) {
        w.riktigeForsteForsok += 1;
        w.streak += 1;
        w.bestStreak = Math.max(w.bestStreak, w.streak);
        w.aktivFeil = null;
        w.hendelser.push({ type: 'riktig', streak: w.streak });
    } else {
        const feil = ledd.feil.find((f) => f.tekst === stein.tekst);
        w.aktivFeil = feil ?? { tekst: stein.tekst, hvorfor: '' };
        resultat.valgtFeil = w.aktivFeil;
        w.streak = 0;
        // Hele straffen for å ta feil, betalt med én gang og uavhengig av hvor
        // lenge eleven blir liggende i feilsporet og lese
        w.fogX += w.effekter.overtrampByks;
        w.hendelser.push({ type: 'feil', hvorfor: w.aktivFeil.hvorfor });
    }
    w.resultater.push(resultat);

    // De to andre steinene faller bort mens figuren er i lufta
    for (const s of w.valg) {
        if (s.row !== row && s.tilstand === 'svever') {
            s.tilstand = 'smuldrer';
            s.anim = 0;
        }
    }
    w.fase = 'sprang';
    w.faseT = 0;
};

/**
 * Eleven kan hoppe ut av feilsporet selv, men ikke før forklaringen har rukket å
 * bli lest. Uten denne terskelen ble omveien gratis, og da forsvant grunnen til
 * å svare riktig.
 */
export const MIN_FEILSPOR_LESETID = 1.5;

export const hoppOverFeilspor = (w: KjedeVerden) => {
    if (w.fase === 'feilspor' && w.faseT > MIN_FEILSPOR_LESETID) {
        w.faseT = w.effekter.feilsporTid;
    }
};

export const velgDrivkraft = (w: KjedeVerden, id: DrivkraftId) => {
    if (w.fase !== 'drivkraft') return;
    w.drivkrefter.push(id);
    w.effekter = beregnEffekter(w.drivkrefter);
    w.tilbudte = null;
    w.fase = 'lop';
    w.faseT = 0;
};

// ---------------------------------------------------------------------------
// Tidssteg
// ---------------------------------------------------------------------------

const gaaTilNesteSegment = (w: KjedeVerden) => {
    w.segment += 1;
    w.valg = null;
    w.aktivFeil = null;
    w.playerY = GROUND_TOP;

    if (w.segment === drivkraftpunkt(w.kjede) && w.drivkrefter.length === 0) {
        const rng = mulberry32(djb2Hash(`${w.seed}:drivkraft`));
        w.tilbudte = tilbud(rng, w.drivkrefter);
        w.fase = 'drivkraft';
        w.faseT = 0;
        w.hendelser.push({ type: 'drivkraft-tilbud', tilbudte: w.tilbudte });
        return;
    }
    w.fase = 'lop';
    w.faseT = 0;
};

const animerSteiner = (w: KjedeVerden, dt: number) => {
    if (!w.valg) return;
    for (const s of w.valg) {
        if (s.tilstand === 'smuldrer') {
            s.anim = clamp01(s.anim + dt / CRACK_DUR);
            // To trinn: steinen slår sprekker og henger et øyeblikk, så gir den
            // etter og faller. Uten pausen ser det ut som den bare forsvinner.
            const fall = clamp01((s.anim - CRACK_HOLD) / (1 - CRACK_HOLD));
            s.y = CHOICE_ROW_Y[s.row] + easeInQuad(fall) * 620;
            if (s.anim >= 1) s.tilstand = 'borte';
        } else if (s.tilstand === 'senkes') {
            s.anim = clamp01(s.anim + dt / SETTLE_DUR);
            const fra = CHOICE_ROW_Y[s.row];
            s.y = fra + (GROUND_TOP - fra) * easeOutBack(s.anim);
        }
    }
};

export const stegVerden = (w: KjedeVerden, dtRaw: number) => {
    // Ta høyde for faneskift og trege frames - aldri simuler mer enn 50 ms
    const dt = Math.min(dtRaw, 0.05);
    if (w.fase === 'mal' || w.fase === 'tatt' || w.fase === 'drivkraft') return;

    w.tid += dt;
    w.faseT += dt;

    // Tenkeøyeblikket sakker ned hele verden, også Glemselen. Å tenke skal
    // koste lite. Det som koster, er å ta feil.
    const skala = w.fase === 'tenk' ? THINK_TIME_SCALE : 1;
    const vdt = dt * skala;

    // Glemselen står stille mens eleven tenker og mens hun leser forklaringen i
    // feilsporet. Å tenke og å lese skal aldri koste terreng - straffen for et
    // feilsvar er bykset i `velg()`, og det er like stort uansett hvor lenge
    // eleven blir liggende nede og lese. Se FOG_SURGE i kjedeFysikk.ts.
    const taakenGaar = w.fase !== 'tenk' && w.fase !== 'feilspor';
    if (taakenGaar) w.fogX += w.effekter.tåkefart * vdt;
    animerSteiner(w, vdt);

    switch (w.fase) {
        case 'lop': {
            w.playerX += runSpeed(w.streak) * vdt;
            w.playerY = GROUND_TOP;
            const sisteSegment = w.segment >= w.kjede.ledd.length;
            if (sisteSegment) {
                if (w.playerX >= segmentX(w.segment) + SLAB_W * 0.6) {
                    w.fase = 'mal';
                    w.hendelser.push({ type: 'ferdig', fullfort: true });
                }
            } else if (w.playerX >= edgeX(w.segment)) {
                w.playerX = edgeX(w.segment);
                w.valg = byggValg(w);
                const forsteGyldige = w.valg.findIndex((s) => s.tilstand === 'svever');
                w.markert = w.valg[1]?.tilstand === 'svever' ? 1 : Math.max(0, forsteGyldige);
                w.fase = 'tenk';
                w.faseT = 0;
                w.hendelser.push({ type: 'valg-vises' });
            }
            break;
        }

        case 'tenk': {
            if (w.faseT >= w.effekter.tenketid) velg(w, w.markert);
            break;
        }

        case 'sprang': {
            const t = clamp01(w.faseT / LEAP_DUR);
            const stein = w.valg?.[w.markert];
            const maalY = stein ? CHOICE_ROW_Y[stein.row] : GROUND_TOP;
            const p = arcPoint(
                easeOutCubic(t) * 0.35 + t * 0.65,
                edgeX(w.segment),
                GROUND_TOP,
                landingX(w.segment + 1),
                maalY,
                120
            );
            w.playerX = p.x;
            w.playerY = p.y;
            if (t >= 1) {
                const riktig = stein?.riktig ?? false;
                w.fallFraY = maalY;
                if (riktig && stein) {
                    stein.tilstand = 'senkes';
                    stein.anim = 0;
                    w.fase = 'landing';
                } else {
                    if (stein) {
                        stein.tilstand = 'smuldrer';
                        stein.anim = 0;
                    }
                    // Fasiten legger seg på plass mens eleven er nede i feilsporet
                    const fasit = w.valg?.find((s) => s.riktig);
                    if (fasit) {
                        fasit.tilstand = 'senkes';
                        fasit.anim = 0;
                    }
                    w.fase = 'fall';
                }
                w.faseT = 0;
            }
            break;
        }

        case 'landing': {
            const stein = w.valg?.find((s) => s.tilstand === 'senkes');
            w.playerY = stein ? stein.y : GROUND_TOP;
            w.playerX = landingX(w.segment + 1);
            if (w.faseT >= SETTLE_DUR) gaaTilNesteSegment(w);
            break;
        }

        case 'fall': {
            const t = clamp01(w.faseT / FALL_DUR);
            w.playerX = landingX(w.segment + 1) - 40 * t;
            w.playerY = w.fallFraY + (FEILSPOR_TOP - w.fallFraY) * easeInQuad(t);
            w.camY = 210 * easeOutCubic(t);
            if (t >= 1) {
                w.fase = 'feilspor';
                w.faseT = 0;
            }
            break;
        }

        case 'feilspor': {
            w.playerY = FEILSPOR_TOP;
            w.camY = 210;
            if (w.faseT >= w.effekter.feilsporTid) {
                w.fase = 'klatre';
                w.faseT = 0;
            }
            break;
        }

        case 'klatre': {
            const t = clamp01(w.faseT / CLIMB_DUR);
            const p = arcPoint(
                easeOutCubic(t),
                landingX(w.segment + 1) - 40,
                FEILSPOR_TOP,
                landingX(w.segment + 1),
                GROUND_TOP,
                90
            );
            w.playerX = p.x;
            w.playerY = p.y;
            w.camY = 210 * (1 - easeOutCubic(t));
            if (t >= 1) {
                w.camY = 0;
                gaaTilNesteSegment(w);
            }
            break;
        }
    }

    // Glemselen tar deg igjen. Bare mens figuren står på beina: bykset fra et
    // feilsvar kan ellers avslutte runden i selve trykkøyeblikket, og eleven
    // ville sett endeskjermen uten å ha sett steinen svikte under seg. Å bli
    // tatt skal alltid skje mens hun løper, der det leser som at tåka innhentet
    // henne.
    const kanTas = w.fase === 'lop' || w.fase === 'landing';
    if (kanTas && w.fogX > w.playerX - FOG_CATCH_MARGIN) {
        w.fase = 'tatt';
        w.hendelser.push({ type: 'ferdig', fullfort: false });
    }
};

/** Y-en den riktige steinen for dette leddet ligger på akkurat nå. */
export const fasitTekst = (w: KjedeVerden): string | null =>
    w.valg?.find((s) => s.riktig)?.tekst ?? null;

/** Teksten som står hugget i bakkestein nummer `i`. */
export const bakkeTekst = (kjede: Kjede, i: number): string =>
    i === 0 ? kjede.start : (kjede.ledd[i - 1]?.tekst ?? '');
