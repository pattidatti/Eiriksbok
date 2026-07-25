import type { AppearanceChoice, ClassDef, ClassId } from '../types';

// De tre veiene inn i spillet. Hver klasse er knyttet til en måte å bruke
// kunnskap på: fortelle (skald), tyde (runemester) og huske (vokter).
export const CLASSES: ClassDef[] = [
    {
        id: 'skald',
        name: 'Skald',
        tagline: 'Ord som våpen',
        description:
            'Du kjemper med fortellinger. Skalden treffer hardt og ofte, og henter kraft av å ha rett.',
        affinity: ['norsk', 'historie'],
        base: { hp: 100, mana: 40, styrke: 7, visdom: 4, vern: 3 },
        growth: { hp: 12, mana: 4, styrke: 2, visdom: 1, vern: 1 },
        startSpell: 'ordskred',
        startWeapon: 'ovingssverd',
        palette: { tunic: '#8b2f4a', trim: '#e8c96a' },
    },
    {
        id: 'runemester',
        name: 'Runemester',
        tagline: 'Tegn som brenner',
        description:
            'Du leser det andre ikke ser. Runemesteren har lite liv, men besvergelser som svir.',
        affinity: ['krle', 'historie'],
        base: { hp: 78, mana: 80, styrke: 4, visdom: 8, vern: 2 },
        growth: { hp: 8, mana: 9, styrke: 1, visdom: 3, vern: 1 },
        startSpell: 'runeglod',
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
        base: { hp: 130, mana: 30, styrke: 6, visdom: 3, vern: 7 },
        growth: { hp: 18, mana: 3, styrke: 2, visdom: 1, vern: 2 },
        startSpell: 'minneskjold',
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

/** XP som kreves for å nå et gitt nivå. Mykt stigende, ingen vegg. */
export function xpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.round(60 * Math.pow(level - 1, 1.55));
}

export function levelFromXp(xp: number): number {
    let level = 1;
    while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level += 1;
    return level;
}

export const MAX_LEVEL = 20;

/** Fulle kjernestats for en klasse på et gitt nivå. */
export function statsAt(classId: ClassId, level: number) {
    const def = CLASS_BY_ID[classId] ?? CLASSES[0];
    const steps = Math.max(0, level - 1);
    return {
        hp: def.base.hp + def.growth.hp * steps,
        mana: def.base.mana + def.growth.mana * steps,
        styrke: def.base.styrke + Math.floor(def.growth.styrke * steps),
        visdom: def.base.visdom + Math.floor(def.growth.visdom * steps),
        vern: def.base.vern + Math.floor(def.growth.vern * steps),
    };
}
