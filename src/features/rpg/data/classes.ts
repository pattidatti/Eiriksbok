import type { AppearanceChoice, ClassDef, ClassId, FigurLook } from '../types';

// De tre veiene inn i spillet. Hver klasse er knyttet til en måte å bruke
// kunnskap på: fortelle (skald), tyde (runemester) og huske (vokter).
export const CLASSES: ClassDef[] = [
    {
        id: 'skald',
        name: 'Skald',
        tagline: 'Ord som våpen',
        description:
            'Du kjemper med fortellinger. Skalden treffer hardt og ofte, og kommer seg unna.',
        affinity: ['norsk', 'historie'],
        base: { hp: 100, styrke: 7, vern: 3 },
        growth: { hp: 12, styrke: 2, vern: 1 },
        startWeapon: 'ovingssverd',
        palette: { tunic: '#8b2f4a', trim: '#e8c96a' },
    },
    {
        id: 'runemester',
        name: 'Runemester',
        tagline: 'Tegn som brenner',
        description:
            'Du leser det andre ikke ser. Runemesteren har lite liv, men slår raskt.',
        affinity: ['krle', 'historie'],
        base: { hp: 78, styrke: 4, vern: 2 },
        growth: { hp: 8, styrke: 1, vern: 1 },
        startWeapon: 'bjorkestav',
        palette: { tunic: '#2f4b8b', trim: '#7fd4ff' },
    },
    {
        id: 'vokter',
        name: 'Vokter',
        tagline: 'Den som ikke glemmer',
        description:
            'Du står imot. Vokteren tåler mest, og blir sterkere for hvert svar du får riktig.',
        affinity: ['samfunnskunnskap', 'historie'],
        base: { hp: 130, styrke: 6, vern: 7 },
        growth: { hp: 18, styrke: 2, vern: 2 },
        startWeapon: 'rustet-oks',
        palette: { tunic: '#3c6b4a', trim: '#cfd8c0' },
    },
];

export const CLASS_BY_ID: Record<ClassId, ClassDef> = Object.fromEntries(
    CLASSES.map((c) => [c.id, c])
) as Record<ClassId, ClassDef>;

// ─── Utseende ───────────────────────────────────────────────────────────────
// Alt tegnes prosedyralt (se engine/spriteforge.ts), så «grafikken» er bare
// disse fargene og formvalgene. Det gjør karakterskaping gratis.

export const SKIN_TONES = ['#f2c9a0', '#e0a878', '#c1804f', '#8d5524', '#5c3317', '#f7dcc0'];

export const HAIR_COLORS = ['#f0d27a', '#a5581f', '#5b3a1a', '#2b2118', '#c9c9c9', '#8b2f2f'];

/** Frisyrene tegnes som forskjellige piksel-masker. */
export const HAIR_STYLES = ['kort', 'flette', 'topplue', 'langt', 'skallet', 'hestehale'] as const;

export const FACES = ['rolig', 'bestemt', 'blid', 'skeptisk'] as const;

export const DEFAULT_APPEARANCE: AppearanceChoice = { skin: 0, hair: 0, hairColor: 0, face: 0 };

// ─── Nivåkurve ──────────────────────────────────────────────────────────────

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

// ─── Slik en figur ser ut ───────────────────────────────────────────────────
//
// Eleven selv og de andre i hallen tegnes av den samme smia, og da må de også
// kles på av den samme funksjonen. Før lå fargevalget som en ternær-kjede inne
// i `Spiller.heltLook()`, ved siden av `palette` her - to sannheter om hvilken
// farge en runemester har på kjortelen. De holdt seg like helt til den dagen
// noen endret den ene.

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
 * Slår aldri opp klassen uten fall: en gjest fra nettet kan sende en klasse-id
 * vi ikke kjenner, og da skal hun tegnes som en skald - ikke krasje hallen.
 */
export function figurLook(
    classId: ClassId | null | undefined,
    appearance: AppearanceChoice | null | undefined,
    armorTier: number
): FigurLook {
    const palette = (classId ? CLASS_BY_ID[classId]?.palette : null) ?? CLASSES[0].palette;
    return {
        appearance: appearance ?? DEFAULT_APPEARANCE,
        tunic: palette.tunic,
        trim: palette.trim,
        armorTier,
    };
}

/** Fulle kjernestats for en klasse på et gitt nivå. */
export function statsAt(classId: ClassId, level: number) {
    const def = CLASS_BY_ID[classId] ?? CLASSES[0];
    const steps = Math.max(0, level - 1);
    return {
        hp: def.base.hp + def.growth.hp * steps,
        styrke: def.base.styrke + Math.floor(def.growth.styrke * steps),
        vern: def.base.vern + Math.floor(def.growth.vern * steps),
    };
}
