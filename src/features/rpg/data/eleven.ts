// Eleven selv: hvordan hun ser ut, hvor sterk hun er, og hva et nivå koster.
//
// Fila het `classes.ts` og hadde tre klasser i seg - skald, runemester og
// vokter, med hvert sitt liv, sin styrke og sin startgave. Blueprintens §16.3
// tar dem ut: rollen er gitt av kapittelet («Torstein Ormsson, sytten
// vintrer»), og det eleven skal velge er hvordan hun ser ut. En kampanje der
// hvem du er avgjøres av året, tåler ikke at eleven i tillegg har valgt å være
// en runemester med 78 liv.
//
// Det som ble igjen av klassene, er fargene. De tre første kjortlene *er* de
// gamle palettene, i samme rekkefølge, og det er ikke tilfeldig: en elev med et
// lagret spill skal se nøyaktig ut som hun gjorde i går (`migrate`, v4 → v5).

import type { AppearanceChoice, FigurLook } from '../types';

// ─── Kjortelen ──────────────────────────────────────────────────────────────

export interface KjortelDef {
    /** Navnet eleven ser. Det sier hva kjortelen er farget med. */
    navn: string;
    tunic: string;
    trim: string;
}

/**
 * Fargene en kjortel kunne ha.
 *
 * Alle seks lot seg lage med det de hadde: krapp gir rødt, vaid gir blått,
 * reseda gir gult og grønt, bark og nøtteskall gir brunt, og den billigste
 * kjortelen av alle er ufarget ull. De tre første er palettene de gamle
 * klassene hadde, og de står først med vilje - se toppen av fila.
 */
export const KJORTLER: KjortelDef[] = [
    { navn: 'Krapprød', tunic: '#8b2f4a', trim: '#e8c96a' },
    { navn: 'Vaidblå', tunic: '#2f4b8b', trim: '#7fd4ff' },
    { navn: 'Resedagrønn', tunic: '#3c6b4a', trim: '#cfd8c0' },
    { navn: 'Barkbrun', tunic: '#6b4b2f', trim: '#d8c49a' },
    { navn: 'Safflorgul', tunic: '#a8862f', trim: '#f0e0b0' },
    { navn: 'Ufarget ull', tunic: '#b9b0a0', trim: '#7a7266' },
];

/** Kjortelen med dette nummeret, eller den første. Aldri et unntak. */
export function kjortelFor(n: number | null | undefined): KjortelDef {
    return KJORTLER[n ?? 0] ?? KJORTLER[0];
}

/**
 * De tre gamle klassene, oversatt til kjortelnummer.
 *
 * To steder trenger den, og begge er utenfra: lagrede spill fra før §16.3
 * (`migrate`, v4 → v5) og klassekamerater som sitter i hallen med en fane som
 * ble åpnet før oppdateringen (`net/hubRom.ts`). Tabellen kan ikke skrives som
 * en løkke over `KJORTLER` - rekkefølgen er tilfeldig for alle andre enn disse
 * tre, og det er nettopp den som må stå fast.
 */
export const KJORTEL_FOR_KLASSE: Record<string, number> = {
    skald: 0,
    runemester: 1,
    vokter: 2,
};

/**
 * Våpenet alle begynner med.
 *
 * Ett for alle nå. Det er øvingssverdet hun møter Ravn med i 793, og det er
 * riktig for hver av de fem: ingen av dem er født med et våpen. Klassene hadde
 * hver sin startgave, og en av dem var en bjørkestav - et trylleredskap uten
 * trolldom igjen, siden besvergelsene gikk ut (§15).
 */
export const STARTVAAPEN = 'ovingssverd';

// ─── Utseende ───────────────────────────────────────────────────────────────
// Alt tegnes prosedyralt (se engine/spriteforge.ts), så «grafikken» er bare
// disse fargene og formvalgene. Det gjør karakterskaping gratis.

export const SKIN_TONES = ['#f2c9a0', '#e0a878', '#c1804f', '#8d5524', '#5c3317', '#f7dcc0'];

export const HAIR_COLORS = ['#f0d27a', '#a5581f', '#5b3a1a', '#2b2118', '#c9c9c9', '#8b2f2f'];

/** Frisyrene tegnes som forskjellige piksel-masker. */
export const HAIR_STYLES = ['kort', 'flette', 'topplue', 'langt', 'skallet', 'hestehale'] as const;

export const FACES = ['rolig', 'bestemt', 'blid', 'skeptisk'] as const;

export const DEFAULT_APPEARANCE: AppearanceChoice = { skin: 0, hair: 0, hairColor: 0, face: 0 };

// ─── Nivåkurve og kjernetall ────────────────────────────────────────────────

/**
 * XP som kreves for å nå et gitt nivå.
 *
 * Kurven er lagt slik at alt innholdet i Nordvik - 20 oppdrag, 6 landemerker og
 * bossen, til sammen rundt 1000 XP - fører eleven helt til toppnivået for
 * sonen. Før krevde nivå 20 nesten 5800 XP, altså flere hundre monsterdrap
 * etter at alt det håndlagde innholdet var brukt opp. Et tak som bare kan nås
 * ved å slite er ikke et mål, det er en straff.
 */
export function xpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.round(22 * Math.pow(level - 1, 1.55));
}

export function levelFromXp(xp: number): number {
    let level = 1;
    while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level += 1;
    return level;
}

/** Toppnivået for Nordvik. Nye soner løfter dette taket. */
export const MAX_LEVEL = 12;

/**
 * Det alle begynner med, og det hvert nivå legger på.
 *
 * Ett sett for alle. Tallene ligger midt mellom de tre klassene som var her -
 * ikke som et kompromiss, men fordi §5.8 sier hva kampen faktisk styres av:
 * pusten, paradevinduet og telegraferingen. Livet er bare hvor mange feil hun
 * tåler mens hun lærer de tre.
 */
export const BASIS = { hp: 110, styrke: 6, vern: 4 } as const;
export const VEKST = { hp: 14, styrke: 2, vern: 1 } as const;

/** Fulle kjernestats på et gitt nivå. */
export function statsAt(level: number) {
    const steps = Math.max(0, level - 1);
    return {
        hp: BASIS.hp + VEKST.hp * steps,
        styrke: BASIS.styrke + Math.floor(VEKST.styrke * steps),
        vern: BASIS.vern + Math.floor(VEKST.vern * steps),
    };
}

// ─── Slik en figur ser ut ───────────────────────────────────────────────────
//
// Eleven selv og de andre i hallen tegnes av den samme smia, og da må de også
// kles på av den samme funksjonen. Før lå fargevalget som en ternær-kjede inne
// i `Spiller.heltLook()`, ved siden av palettene her - to sannheter om hvilken
// farge en kjortel har. De holdt seg like helt til den dagen noen endret den ene.

/**
 * Hvor tung rustningen ser ut: 0 er ingen, 3 er tyngst.
 *
 * Ukjent id gir tyngste trinn med vilje. Får eleven en rustning vi ikke har
 * tegnet, skal hun se rustet ut - ikke naken.
 */
export function rustningTier(rustningId: string | null | undefined): number {
    if (!rustningId) return 0;
    if (rustningId === 'vadmelskjortel') return 1;
    if (rustningId === 'lerbrynje') return 2;
    return 3;
}

/**
 * Alt `forgeHumanoid` trenger for å tegne én person.
 *
 * Slår aldri opp kjortelen uten fall: en gjest fra nettet kan sende et nummer
 * vi ikke kjenner, og da skal hun tegnes i den første fargen - ikke krasje
 * hallen.
 */
export function figurLook(
    kjortel: number | null | undefined,
    appearance: AppearanceChoice | null | undefined,
    armorTier: number
): FigurLook {
    const valgt = kjortelFor(kjortel);
    return {
        appearance: appearance ?? DEFAULT_APPEARANCE,
        tunic: valgt.tunic,
        trim: valgt.trim,
        armorTier,
    };
}
