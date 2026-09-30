// Alle tallene i Radionettet. Balanse endres her, så kjøres simuleringen:
//   npx tsx scripts/sim-microgame.mts --ids radionettet

export type Kind = 'inf' | 'vogn' | 'pv' | 'art' | 'lv' | 'jag' | 'bomb' | 'fsk';
export type EKind = 'einf' | 'evogn' | 'epak' | 'estuka' | 'ejag' | 'ebatt';
/** Hva et skudd treffer: bløtt (folk), panser, kanon (mannskap bak skjold), fly. */
export type Armor = 'soft' | 'armor' | 'gun' | 'air';

export interface UnitStat {
    navn: string;
    pris: number;
    hp: number;
    /** Skuddhold i ruter. */
    range: number;
    /** Egne øyne i ruter. Kamuflerte mål ses bare innenfor camo. */
    sight: number;
    camo: number;
    /** Skade per sekund mot hver type. 0 = kan ikke skyte på den. */
    dps: Record<Armor, number>;
    /** Sprut rundt treffet (artilleri, bomber). */
    splash?: number;
    armor: Armor;
    fly?: boolean;
    /** Fallskjermsoldater: kan hoppe ut hvor som helst på kartet, også utenfor radioringen. */
    hopp?: boolean;
}

// ---- Dine enheter --------------------------------------------------------
export const UNITS: Record<Kind, UnitStat> = {
    inf: { navn: 'Infanteri', pris: 2, hp: 100, range: 2.6, sight: 5.2, camo: 5.2, dps: { soft: 12, armor: 2, gun: 14, air: 0 }, armor: 'soft' },
    vogn: { navn: 'Stridsvogn', pris: 4, hp: 200, range: 4.4, sight: 4.4, camo: 0.9, dps: { soft: 12, armor: 15, gun: 16, air: 0 }, armor: 'armor' },
    pv: { navn: 'Panservern', pris: 3, hp: 55, range: 4.2, sight: 3, camo: 0.9, dps: { soft: 2, armor: 34, gun: 4, air: 0 }, armor: 'gun' },
    art: { navn: 'Artilleri', pris: 4, hp: 45, range: 10, sight: 1.6, camo: 0.8, dps: { soft: 13, armor: 7, gun: 22, air: 0 }, splash: 1.1, armor: 'gun' },
    lv: { navn: 'Luftvern', pris: 3, hp: 55, range: 4.4, sight: 4.4, camo: 0, dps: { soft: 0, armor: 0, gun: 0, air: 26 }, armor: 'gun' },
    jag: { navn: 'Jagerfly', pris: 5, hp: 90, range: 1.6, sight: 3, camo: 0, dps: { soft: 0, armor: 0, gun: 0, air: 30 }, armor: 'air', fly: true },
    bomb: { navn: 'Bombefly', pris: 6, hp: 80, range: 0, sight: 0, camo: 0, dps: { soft: 0, armor: 0, gun: 0, air: 0 }, armor: 'air', fly: true },
    fsk: { navn: 'Fallskjerm', pris: 4, hp: 90, range: 2.6, sight: 5.6, camo: 5.6, dps: { soft: 13, armor: 3, gun: 16, air: 0 }, armor: 'soft', hopp: true },
};

// ---- Fienden -------------------------------------------------------------
export interface EnemyStat {
    navn: string;
    hp: number;
    speed: number;
    range: number;
    dps: Record<Armor, number>;
    armor: Armor;
    /** Hvor mye linja taper når den slipper forbi. */
    brudd: number;
    fly?: boolean;
}

export const ENEMIES: Record<EKind, EnemyStat> = {
    einf: { navn: 'infanteri', hp: 45, speed: 0.6, range: 2.2, dps: { soft: 5, armor: 1, gun: 6, air: 0 }, armor: 'soft', brudd: 1 },
    evogn: { navn: 'stridsvogn', hp: 200, speed: 0.7, range: 3, dps: { soft: 11, armor: 13, gun: 12, air: 0 }, armor: 'armor', brudd: 3 },
    epak: { navn: 'panservern', hp: 50, speed: 0.65, range: 4.2, dps: { soft: 2, armor: 36, gun: 3, air: 0 }, armor: 'gun', brudd: 1 },
    estuka: { navn: 'stupbomber', hp: 45, speed: 3.2, range: 0, dps: { soft: 0, armor: 0, gun: 0, air: 0 }, armor: 'air', brudd: 0, fly: true },
    ejag: { navn: 'jagerfly', hp: 55, speed: 3.6, range: 1.6, dps: { soft: 0, armor: 0, gun: 0, air: 22 }, armor: 'air', brudd: 0, fly: true },
    // Står skjult utenfor veien og kutter radiolinjer til noen i nettet ser det og slår det ut.
    ebatt: { navn: 'artilleribatteri', hp: 90, speed: 0, range: 0, dps: { soft: 0, armor: 0, gun: 0, air: 0 }, armor: 'gun', brudd: 0 },
};

// ---- Radio ---------------------------------------------------------------
export const RADIO = {
    /** Hvor langt fra kommandovogna en bakkeenhet kan kobles (ruter). Fly og flyplass: alltid.
     *  Slagene kan ha sin egen ring (`ring` i levels.ts). */
    rekkevidde: 6.5,
    /** Stafett: en bakkeenhet i nettet sender radioen videre så langt (ruter). */
    stafett: 3,
    /** Sekunder fra klikk til linja er oppe. */
    koble: 0.6,
    /** Stupbombe-treff kutter linja til enheten det traff. */
    kuttVedTreff: true,
};

// ---- Kamp ----------------------------------------------------------------
export const COMBAT = {
    /** Fienden stopper for å skyte når et mål er innen skuddhold (infanteri og pak). Vogner kjører sakte videre. */
    vognKjørerMensDenSkyter: 0.45,
    /** Pak graver seg ned (kamuflert) når den ser en vogn innen dette. */
    pakGraverVed: 4.1,
    /** Etter så mange sekunder i en bølge graver ikke panservernet seg ned lenger (ingen evig stillstand). */
    bølgeMaks: 90,
    /** Sekunder panservernet blir liggende nedgravd etter at vogna er borte. */
    pakBlir: 4,
    /** Styrke (hp og skade) med 1, 2 og 3 like på samme rute. Tre = veteran. */
    kopier: [1, 1.6, 2.3],
    /** Tid mellom artilleriets salver (s). */
    artSalve: 2.4,
    /** Kommandovogna. */
    hqHp: 520,
    /** Bombefly: sekunder mellom tokt, sprut og skade per bombe. */
    bombTokt: 11,
    bombSprut: 1.8,
    bombSkade: { soft: 90, armor: 110, gun: 100, air: 0 } as Record<Armor, number>,
    /** Fiendens artilleribatteri: første salve etter så mange sekunder, så hver `battSalve`. */
    battStart: 9,
    battSalve: 14,
    /** Nedslaget som kutter en linje: skade på enheten. */
    kuttSkade: 12,
    /** Nedslag fra batteri og stupbombere treffer også naboene (radius, andel av skaden). */
    sprut: 1.3,
    sprutAndel: 0.4,
    /** Stupbomber: skade på enheten den stuper mot. */
    stukaSkade: 60,
    /** Jagerfly patruljerer i en ring med denne radien. */
    patrulje: 2.4,
    /** I nettet ser jagerne fiendtlige fly så langt unna (ruter). */
    flyØyne: 7,
};

// ---- Sperreild (ordre) -----------------------------------------------------
export const ORDERS = {
    sperreild: { forsinkelse: 2, radius: 1.8, skade: { soft: 120, armor: 90, gun: 120, air: 0 } as Record<Armor, number> },
    /** Antall sperreild per slag. */
    perSlag: 1,
};

// ---- Økonomi ----------------------------------------------------------------
export const ECONOMY = {
    /** Etter hver bølge. */
    perBølge: 12,
    /** Bytte butikken. */
    bytt: 1,
    /** Selg: andel av prisen tilbake. */
    salg: 0.5,
    /** Kort i butikken. */
    kort: 3,
};

// ---- Linja og poeng ---------------------------------------------------------------
export const SCORE = {
    linje: 10,
    /** Poeng per fiende slått ut, etter type. */
    drap: { einf: 10, evogn: 40, epak: 25, estuka: 20, ejag: 20, ebatt: 50 } as Record<EKind, number>,
    /** Bonus per linjepunkt igjen etter et slag. */
    linjeBonus: 30,
    /** Stjerner: linja igjen minst så mye. */
    stjerner: [1, 6, 9],
};

// ---- Ordrekort: ett av tre etter hvert slag, gjelder resten av kampanjen ------------------
export type KortId = 'kanal' | 'sperre' | 'forsyning' | 'speidere' | 'fly';
export const KORT: Record<KortId, { tittel: string; tekst: string }> = {
    kanal: { tittel: 'Ny radiokanal', tekst: 'Kommandovogna får én kanal til.' },
    sperre: { tittel: 'Mer ammunisjon', tekst: 'Én sperreild ekstra i hver bølge.' },
    forsyning: { tittel: 'Forsyninger', tekst: '+4 forsyninger etter hver bølge.' },
    speidere: { tittel: 'Speidere', tekst: 'Infanteriet ser 1,5 ruter lenger, også skjulte kanoner.' },
    fly: { tittel: 'Flystøtte', tekst: 'Jager- og bombefly slår 30 % hardere.' },
};
export const KORT_TALL = { forsyning: 4, speidere: 1.5, fly: 1.3 };

/** Planleggingen: så lenge venter fienden (s). Klokka vises først de siste 15 sekundene. */
export const PLAN_MAX = 45;
