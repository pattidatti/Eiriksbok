// Delte typer for rollespillet «Minnevokteren» (/oving/rpg).
// Ingen React, ingen Phaser, ingen store-import - kun data.

// ─── Spørsmålsbanken (generert av scripts/generate-quest-bank.mjs) ───────────

export interface BankQuestion {
    id: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
    subjectId: string;
    topicId: string;
    lessonId: string;
    lessonTitle: string;
    /** Lenke til artikkelen svaret står i. */
    link: string;
}

export interface BankZone {
    id: string;
    title: string;
    era: string;
    questions: BankQuestion[];
}

export interface QuestBank {
    generatedFrom: string;
    zones: BankZone[];
}

// ─── Karakter ───────────────────────────────────────────────────────────────

/** Klassene bestemmer startverdier, første besvergelse og utseende. */
export type ClassId = 'skald' | 'runemester' | 'vokter';

export interface ClassDef {
    id: ClassId;
    name: string;
    tagline: string;
    description: string;
    /** Fagene klassen får bonus i - knytter klassevalg til skolefag. */
    affinity: string[];
    base: CoreStats;
    /** Per nivå. Brøker rundes ned ved bruk. */
    growth: CoreStats;
    startSpell: string;
    startWeapon: string;
    palette: { tunic: string; trim: string };
}

export interface CoreStats {
    /** Maks liv. */
    hp: number;
    /** Maks kraft (mana) til besvergelser. */
    mana: number;
    /** Ganger våpenets skade. */
    styrke: number;
    /** Ganger besvergelsers skade. */
    visdom: number;
    /** Reduserer skade du tar. */
    vern: number;
}

export interface AppearanceChoice {
    /** Indeks inn i APPEARANCE-tabellene. */
    skin: number;
    hair: number;
    hairColor: number;
    /** Ansiktsuttrykk - ren pynt. */
    face: number;
}

export interface CharacterDraft {
    name: string;
    classId: ClassId;
    appearance: AppearanceChoice;
}

// ─── Utstyr og gjenstander ──────────────────────────────────────────────────

export type ItemSlot = 'vapen' | 'rustning' | 'amulett';
export type Rarity = 'vanlig' | 'god' | 'sjelden' | 'episk';

export interface ItemDef {
    id: string;
    name: string;
    slot: ItemSlot;
    rarity: Rarity;
    /** Kort, muntlig forklaring - vises i sekken. */
    flavor: string;
    stats: Partial<CoreStats>;
    /** Hva Bera Kremmer tar for den. Uten pris er den ikke til salgs. */
    pris?: number;
    /** Bare for våpen: form og rekkevidde på slaget. */
    weapon?: {
        skade: number;
        /** Millisekunder mellom slag. */
        hastighet: number;
        /** Piksler slaget rekker. */
        rekkevidde: number;
        /** Grader på slagbuen. */
        bue: number;
        art: WeaponArt;
    };
}

export type WeaponArt = 'sverd' | 'oks' | 'stav' | 'spyd' | 'hammer';

export interface LootDrop {
    itemId: string;
    /** 0-1. */
    sjanse: number;
}

// ─── Besvergelser ───────────────────────────────────────────────────────────

export type SpellKind = 'prosjektil' | 'nova' | 'stråle' | 'skjold' | 'helbred';

export interface SpellDef {
    id: string;
    name: string;
    kind: SpellKind;
    kostnad: number;
    skade: number;
    /** Millisekunder. */
    nedkjoling: number;
    farge: number;
    beskrivelse: string;
    /** Går prosjektilet gjennom fienden i stedet for å stoppe i den? */
    piercing?: boolean;
    /** Kunnskapskravet: låses opp når eleven har svart riktig på så mange spørsmål. */
    krevesRiktige?: number;
}

// ─── Fiender ────────────────────────────────────────────────────────────────

export type EnemyKind = 'glemsel' | 'paastand' | 'anakronisme' | 'rykte' | 'vrangbilde' | 'boss';

export interface EnemyDef {
    id: string;
    kind: EnemyKind;
    name: string;
    hp: number;
    skade: number;
    fart: number;
    /** Piksler - hvor nær spilleren må være før den jager. */
    aggro: number;
    /** Piksler - hvor nær den må være for å slå. */
    rekkevidde: number;
    /** Millisekunder telegrafering før slaget lander. */
    varsel: number;
    farge: number;
    /** XP i spillet (ikke «Min læring»-XP). */
    xp: number;
    loot: LootDrop[];
    /** Skyter prosjektiler i stedet for nærkamp. */
    skytende?: boolean;
    storrelse?: number;
}

// ─── Quester ────────────────────────────────────────────────────────────────

export type QuestSource = 'bank' | 'authored';

/**
 * En quest er alltid et spørsmål. Svaret finnes i verden: enten hos en NPC,
 * på en runestein, eller i artikkelen questen peker til. Eleven kan alltid
 * finne det - vi gir aldri et spørsmål uten en kilde.
 */
export interface QuestDef {
    id: string;
    title: string;
    /** Hva NPC-en sier når du får oppdraget. */
    intro: string;
    /** Hvor svaret er å finne, sagt i klartekst. */
    hint: string;
    question: BankQuestion;
    source: QuestSource;
    /** NPC-en som gir questen. */
    giverId: string;
    /** Hvor svaret står. Brukes av hintet og av kompasset i HUD-en. */
    kilde: Kilde | null;
    belonning: {
        xp: number;
        solv: number;
        itemId?: string;
        spellId?: string;
    };
}

// ─── Verden ─────────────────────────────────────────────────────────────────

export interface ZoneDef {
    id: string;
    title: string;
    era: string;
    /** Kort tekst på verdenskartet. */
    pitch: string;
    /** Nivået som låser opp sonen. */
    krevesNiva: number;
    /** Klar til å spilles? Sone 1 er ferdig, resten kommer. */
    spillbar: boolean;
    /**
     * Fargetema. Alt terreng og alt tømmer hentes herfra - ingen hardkodede
     * farger i tileforge. Det er dette som gjør at en ny sone får sin egen
     * identitet uten at noen må tegne ny grafikk: trærne i Mesopotamia skal
     * ikke være fjordgrønne, og husene i Dampbyen ikke vikingbrune.
     */
    tema: ZoneTema;
}

export interface ZoneTema {
    gress: string;
    stein: string;
    vann: string;
    /** Lyset i lufta. Legges som en svak tone over hele scenen. */
    himmel: string;
    sand: string;
    /** Tråkket jord - stier og plasser. */
    jord: string;
    /** Dyrket mark. */
    aker: string;
    /** Bygningstømmer, kaier, gjerder. */
    tommer: string;
    /** Taket på husene. */
    tak: string;
    /** Løvverket i trær og busker. */
    lov: string;
}

export interface NpcDef {
    id: string;
    name: string;
    role: string;
    /** Rutenettkoordinat i sonen. */
    tile: [number, number];
    palette: { tunic: string; trim: string; hair: string };
    /** Det NPC-en sier når du snakker uten aktiv quest. */
    smalltalk: string[];
    /** Faktaopplysninger NPC-en gir - dette er «svarene i verden». */
    kunnskap?: KunnskapsBit[];
    /** Handelsmann? Da åpner samtalen en bod i stedet for et oppdrag. */
    handler?: { varer: string[]; velkomst: string };
}

/**
 * Én ting en NPC eller et landemerke faktisk vet.
 *
 * `stikkord` er det som binder verden til spørsmålsbanken: et spørsmål regnes
 * som besvart her hvis ett av stikkordene finnes i spørsmålet eller i fasiten.
 * Det er dette som gjør at løftet «svaret finnes et sted på kartet» holder for
 * alle oppdrag, ikke bare de håndskrevne tre.
 */
export interface KunnskapsBit {
    tekst: string;
    stikkord: string[];
}

export interface LandmarkDef {
    id: string;
    kind: 'runestein' | 'skilt' | 'baal' | 'kiste';
    tile: [number, number];
    title: string;
    /** Teksten eleven leser - inneholder svar på minst ett spørsmål. */
    text: string;
    /** Hvilke spørsmål teksten svarer på. Se KunnskapsBit. */
    stikkord?: string[];
}

/** Hvor svaret på et spørsmål faktisk står i verden. */
export interface Kilde {
    type: 'npc' | 'landemerke';
    id: string;
    navn: string;
}

// ─── Lagret spill ───────────────────────────────────────────────────────────

export interface SaveState {
    version: number;
    character: CharacterDraft | null;
    niva: number;
    xp: number;
    hp: number;
    mana: number;
    solv: number;
    /** Item-id-er i sekken. */
    sekk: string[];
    utstyr: Record<ItemSlot, string | null>;
    spells: string[];
    /** Quest-id → status. */
    quester: Record<string, 'aktiv' | 'ferdig'>;
    /** Riktige svar totalt - låser opp besvergelser. */
    riktigeSvar: number;
    galeSvar: number;
    /** Landemerker eleven har lest. */
    lest: string[];
    /** Drepte bosser. */
    bosser: string[];
    sisteSone: string;
}
