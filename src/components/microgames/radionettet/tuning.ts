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

// ---- Ordrene i bølgen: aktive evner med nedkjøling ------------------------------
// Eleven gjør noe selv mens kampen går: styrer kompaniet, lar snikskytteren ta ett mål,
// kaller inn sperreild og rakettfly. Ordrene kjøpes med forsyninger (også midt i bølgen) og
// gjelder resten av kampanjen; nivå 2 og 3 lades fortere og slår hardere.
// `fra` = slag og bølge ordren kommer i butikken. `pris` = kjøp, nivå 2, nivå 3.
export type EvneId = 'kompani' | 'snik' | 'sperre' | 'rakett';
export const EVNE_ORDEN: EvneId[] = ['kompani', 'snik', 'sperre', 'rakett'];
export const EVNER: Record<EvneId, { navn: string; tast: string; cd: number; fra: [number, number]; pris: [number, number, number]; hint: string }> = {
    /** Cd for kompaniet = sekunder før et nytt kompani kommer fram når det er slått ut. */
    kompani: { navn: 'Kompaniet', tast: '1', cd: 16, fra: [0, 0], pris: [4, 9, 14], hint: 'Klikk det, så dit det skal' },
    snik: { navn: 'Snikskytter', tast: '2', cd: 12, fra: [0, 2], pris: [5, 9, 14], hint: 'Klikk en fiende du ser' },
    sperre: { navn: 'Sperreild', tast: '3', cd: 32, fra: [1, 2], pris: [8, 12, 16], hint: 'Klikk der nettet ser fienden' },
    rakett: { navn: 'Rakettfly', tast: '4', cd: 38, fra: [3, 1], pris: [9, 13, 17], hint: 'Klikk fienden nettet ser' },
};
/** Nivå 1-3: nedkjølingen ganges med `cd`, skaden med `kraft`. Kompaniet: nivå = tropper, hp og skade ganges med `kompani`. */
export const NIVÅ = { cd: [1, 0.75, 0.55], kraft: [1, 1.3, 1.6], kompani: [1, 1.2, 1.4] };

/** Kompaniet: en tropp infanteri eleven flytter selv (klikk det, klikk dit det skal).
 *  Har egen radio: det kompaniet ser, ser nettet - uten å bruke en kanal. Utenfor nettet leder det
 *  likevel ilden: ordrene treffer det kompaniet ser (det gjør fallskjermjegerne også). */
export const KOMPANI = { hp: 130, fart: 1.5, range: 2.6, sight: 5.4, dps: { soft: 15, armor: 3, gun: 17, air: 0 } as Record<Armor, number> };

export const ORDERS = {
    /** Sperreild: ordre, så innskyting, så en salve med `granater` nedslag over `varighet` sekunder. */
    sperreild: { forsinkelse: 2.6, radius: 1.9, granater: 14, varighet: 1.6, sprut: 0.95, skade: { soft: 36, armor: 26, gun: 36, air: 0 } as Record<Armor, number> },
    /** Kortet «Mer ammunisjon»: sperreilden lades så mye fortere. */
    sperreKort: 0.6,
    /** Snikskytteren: sekunder han sikter, og skaden (dreper en infanterigruppe, mannskapet ved en kanon). */
    snik: { sikt: 0.85, skade: { soft: 60, armor: 22, gun: 70, air: 0 } as Record<Armor, number> },
    /** Rakettfly (Typhoon): flyr inn fra vest, stuper og skyter `raketter` langs en linje. */
    rakett: { raketter: 8, lengde: 3.2, sprut: 0.8, fart: 7, skade: { soft: 40, armor: 70, gun: 55, air: 0 } as Record<Armor, number> },
};

// ---- Økonomi ----------------------------------------------------------------
export const ECONOMY = {
    /** Fast lønn etter hver bølge. 0: forsyningene kommer fra fiendene eleven slår ut (`bytte`). */
    perBølge: 0,
    /** Bytte butikken. */
    bytt: 1,
    /** Selg: andel av prisen tilbake. */
    salg: 0.5,
    /** Kort i butikken. */
    kort: 3,
    /** Forsyninger fienden slipper når den slås ut (erobret utstyr). */
    bytte: { einf: 1, evogn: 1, epak: 1, estuka: 1, ejag: 1, ebatt: 3 } as Record<EKind, number>,
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
    sperre: { tittel: 'Mer ammunisjon', tekst: 'Sperreilden lades nesten dobbelt så fort.' },
    forsyning: { tittel: 'Forsyninger', tekst: '+4 forsyninger etter hver bølge.' },
    speidere: { tittel: 'Speidere', tekst: 'Infanteriet ser 1,5 ruter lenger, også skjulte kanoner.' },
    fly: { tittel: 'Flystøtte', tekst: 'Jager- og bombefly slår 30 % hardere.' },
};
export const KORT_TALL = { forsyning: 4, speidere: 1.5, fly: 1.3 };

/** Planleggingen: så lenge venter fienden (s). Klokka vises først de siste 15 sekundene. */
export const PLAN_MAX = 45;
