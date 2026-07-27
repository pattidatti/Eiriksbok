// Året på Nordvik: forrådet, valgene og regnskapet til slutt.
//
// Dette er motoren i kapittel 2 (blueprint §4 og §7.3). Åsa har nøklene, og
// nøklene er ikke pynt - de er hvem som avgjør hvem som spiser i vinter.
//
// **Regelen for hele modellen: ingen terning.** Et dårlig år skal komme av noe
// eleven gjorde, ikke av noe spillet trakk. Derfor er avlingen ikke tilfeldig -
// den henger på *når* hun sådde og *hvor mye* såkorn hun turte å legge i jorda.
// Sår hun tidlig i våren, får kornet en hel vekstsesong. Somler hun til
// våronna er over, rekker det ikke å modne. Det er ikke flaks, det er årstider,
// og det er nøyaktig det årshjulet skal lære bort.
//
// **Det harde valget er ikke kornet, det er hvem hun gir det til.** Harald
// Hårfagres mann kommer og krever. Motstanderne hans kommer og ber. Naboen
// over vika har ingenting og spør. Hun kan ikke mette alle, og hvem hun mater i
// juni avgjør hvem som står ved siden av henne i oktober - og hvem som kommer
// og henter det hun har.
//
// Tallene er avstemt slik at:
//   - god såing (tidlig, mye) gir nok til vinteren med god margin,
//   - dårlig såing (sent, lite) gir en sultevinter selv om hun ikke ga bort noe,
//   - og hun kan aldri mette både Harald, motstanderne og naboen.

import type { Aarstid, Forrad } from '../types';

/** Munner å mette på gården: Åsa, Sigrid, Torgeir, Kåre og to barn. */
export const MUNNER = 6;

/** Sekker korn ett menneske trenger gjennom en vinter. */
export const KORN_PER_MUNN = 4;

/** Sekker korn hvert dyr trenger som fôr gjennom vinteren. */
export const KORN_PER_DYR = 1;

/** Ett mål kjøtt metter like mye som to sekker korn. */
export const KORN_PER_KJOTT = 2;

/** Forrådet slik det står når kapittelet begynner. */
export const START_FORRAD: Forrad = { korn: 22, kjott: 3, dyr: 8, aaker: 0 };

/**
 * Siste dagen i våronna det er noen vits i å så.
 *
 * Ikke en frist spillet varsler om. Den står på tavla i bua - «kornet må i
 * jorda før våronna er omme» - og eleven må ha lest den. Det er samme regel som
 * runesteinen ved tingvollen (§7.2).
 */
export const VAARONN_SISTE_DAG = 15;

/** Hvor mye ett såkorn gir tilbake. Tidlig sådd korn rekker å modne. */
export const AVLING_TIDLIG = 3;
export const AVLING_SENT = 1.5;

/** Det de tre som kommer i sommer ber om. */
export const HARALD_KREVER = 8;
export const MOTSTANDERNE_BER_OM = 8;
export const SAEBO_BER_OM = 6;

/** Velviljen naboætta får av å bli mettet. Den betaler seg to ganger. */
export const SAEBO_TAKK = 45;

// ─── Flaggene året setter ───────────────────────────────────────────────────
//
// Ett flatt navnerom, som resten av kampanjen. Disse leses av kapittel 2 selv,
// av angrepet i høst, og av mellomspillet etterpå.

export const K2_FLAGG = {
    /** Sådde hun før våronna var omme? */
    saadeTidlig: 'k2-saadde-tidlig',
    /** Ga hun korn til Harald Hårfagres mann? */
    matetHarald: 'k2-matet-harald',
    /** Ga hun korn til motstanderne hans? */
    matetMotstanderne: 'k2-matet-motstanderne',
    /** Ga hun korn til naboætta på Sæbø? */
    matetSaebo: 'k2-matet-saebo',
    /** Sendte hun begge kongsmennene tomhendt av gårde? */
    matetIngen: 'k2-matet-ingen',
    /** Sto gården vinteren av uten sult? */
    stodVinteren: 'k2-stod-vinteren',
    /** Sultet de? */
    sultevinter: 'k2-sultevinter',
    /** Kom Sæbø tilbake med korn da det knep? */
    saeboBetalteTilbake: 'k2-saebo-betalte-tilbake',
} as const;

// ─── Regnskapet ─────────────────────────────────────────────────────────────

export interface Vinterregnskap {
    /** Sekker korn vinteren krever, alt medregnet. */
    behov: number;
    /** Det kjøttet dekker, regnet om i korn. */
    fraKjott: number;
    /** Korn hun faktisk har. */
    har: number;
    /** Positivt er til overs, negativt er sult. */
    margin: number;
}

/**
 * Hva vinteren koster, og hva hun har.
 *
 * Ren funksjon, og den brukes to steder: i bua, der eleven skal kunne se
 * regnestykket *før* hun bestemmer seg, og i oppgjøret når vinteren kommer. To
 * regnestykker for det samme er den sikreste måten å gjøre et spill urettferdig
 * på - eleven planlegger etter det ene og dømmes etter det andre.
 */
export function vinterregnskap(forrad: Forrad): Vinterregnskap {
    const behov = MUNNER * KORN_PER_MUNN + forrad.dyr * KORN_PER_DYR;
    const fraKjott = forrad.kjott * KORN_PER_KJOTT;
    return {
        behov,
        fraKjott,
        har: forrad.korn,
        margin: forrad.korn + fraKjott - behov,
    };
}

/** Avlingen såkornet gir. Tidlig sådd korn rekker å modne; sent sådd gjør ikke. */
export function avling(saakorn: number, tidlig: boolean): number {
    return Math.round(saakorn * (tidlig ? AVLING_TIDLIG : AVLING_SENT));
}

// ─── Valgene, årstid for årstid ─────────────────────────────────────────────

export interface AarsvalgAlternativ {
    id: string;
    knapp: string;
    /** Hva det koster, sagt rett ut. Eleven skal aldri gjette prisen. */
    pris: string;
    /** Én linje om hva det betyr. Ingen dom, ingen anbefaling. */
    folge: string;
}

export interface Aarsvalg {
    id: string;
    aarstid: Aarstid;
    tittel: string;
    tekst: string;
    alternativer: AarsvalgAlternativ[];
}

export const AARSVALG: Aarsvalg[] = [
    {
        id: 'saaingen',
        aarstid: 'vaar',
        tittel: 'Såkornet',
        tekst:
            'Kornet i bingene er både mat og såkorn. Alt du legger i jorda, spiser dere ikke i sommer - og alt dere spiser i sommer, vokser ikke til høsten.\n\nÅkeren tar imot så mye du vil gi den.',
        alternativer: [
            {
                id: 'lite',
                knapp: 'Så fire sekker',
                pris: '-4 sekker korn nå',
                folge: 'Trygt i sommer. Lite å høste.',
            },
            {
                id: 'middels',
                knapp: 'Så åtte sekker',
                pris: '-8 sekker korn nå',
                folge: 'Halve bingen i jorda.',
            },
            {
                id: 'mye',
                knapp: 'Så tolv sekker',
                pris: '-12 sekker korn nå',
                folge: 'Nesten alt du har. Det er slik en åker blir stor.',
            },
        ],
    },
    {
        id: 'slakten',
        aarstid: 'host',
        tittel: 'Slakten',
        tekst:
            'Dyra kan ikke fø seg selv gjennom vinteren. Hvert dyr som lever til våren, spiser fôr du ellers kunne gitt et menneske.\n\nDe du slakter nå, blir kjøtt. De du sparer, blir kalver og lam neste vår - men den våren er det en annen som styrer gården.',
        alternativer: [
            {
                id: 'ingen',
                knapp: 'Slakt ingen',
                pris: 'Alle dyra spiser fôr i vinter',
                folge: 'Full buskap til våren.',
            },
            {
                id: 'to',
                knapp: 'Slakt to dyr',
                pris: '-2 dyr, +2 mål kjøtt',
                folge: 'Slik gjør de fleste.',
            },
            {
                id: 'fire',
                knapp: 'Slakt fire dyr',
                pris: '-4 dyr, +4 mål kjøtt',
                folge: 'Trygg vinter. Tynn vår.',
            },
        ],
    },
];

export const AARSVALG_BY_ID: Record<string, Aarsvalg> = Object.fromEntries(
    AARSVALG.map((v) => [v.id, v])
);

/** Såkornet hvert alternativ legger i jorda. */
export const SAAKORN: Record<string, number> = { lite: 4, middels: 8, mye: 12 };

/** Dyr hvert slaktevalg tar. */
export const SLAKT: Record<string, number> = { ingen: 0, to: 2, fire: 4 };

/** Dagene en handling koster. Årshjulet skal merkes, ikke bare vises. */
export const DAGSVERK = {
    saaingen: 10,
    innhostingen: 12,
    slakten: 4,
} as const;
