// Delte typer for rollespillet «Minnevokteren» (/oving/rpg).
// Ingen React, ingen Phaser, ingen store-import - kun data.

// Kartformen bor hos den som lager kart. Dette er en ren type-import, så den
// forsvinner i kompileringen og drar ingen kode med seg hit.
import type { WorldMap } from './engine/worldgen';

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
    weapon?: VaapenDef;
}

/**
 * Tallene på selve gjenstanden. Formen på angrepet hører til arten
 * (`VAAPEN_KAMP` i data/vaapen.ts) - to nivåer, så et nytt sverd får riktig
 * oppførsel uten at noen må fylle ut fire felt til.
 */
export interface VaapenDef {
    skade: number;
    /** Millisekunder mellom slag. */
    hastighet: number;
    /** Piksler slaget rekker. For skytevåpen: hvor langt pila flyr. */
    rekkevidde: number;
    /** Grader på slagbuen. */
    bue: number;
    art: WeaponArt;
}

export type WeaponArt = 'sverd' | 'oks' | 'stav' | 'spyd' | 'hammer' | 'bue';

// ─── Kamp: skjold, pust, manøvrer ───────────────────────────────────────────
// Kampsystemet bygger på skjoldet, ikke sverdet. Se
// docs/Design documents/minnevokteren-nordvik-blueprint.md §5.

/** Den historiske særmanøveren til et våpen. Ett grep per våpenart. */
export type Manover =
    /** Skjeggøksa kroker motstanderens skjold og river det ned. */
    | 'hak'
    /** Spydet stikker gjennom rekka - lang rekkevidde, smal bue. */
    | 'stikk-gjennom'
    /** Skjoldbulen som knyttneve. Alle har den, ingen velger den først. */
    | 'skjoldstot';

/** Hvor godt våpenet virker i formasjon. Brukes av skjoldborgen i kap. 4. */
export type RekkeVerdi = 'god' | 'brukbar' | 'ubrukelig';

/**
 * Hvordan våpenet leverer angrepet.
 *
 * Formen bor på arten, tallene på gjenstanden. Det er dette som gjør at en bue
 * i 793 og et gevær i 1916 er samme sak: skudd, med andre tall og en annen
 * ladetid. Før lå svingen som den eneste muligheten, rett inn i `slaa()`.
 */
export type Angrepsform =
    | { form: 'sving' }
    | {
          form: 'skudd';
          /** Millisekunder strengen trekkes før skuddet slippes. */
          ladeMs: number;
          /** Piksler i sekundet. Sammen med våpenets rekkevidde gir det levetiden. */
          fart: number;
          /** Teksturen skuddet tegnes med. */
          tekstur: string;
          /** Går skuddet gjennom det det treffer? */
          gjennom: boolean;
      };

/** Verbet et våpen bruker. Regelsettet sier hvilke verb epoken kjenner. */
export type AngrepsformId = Angrepsform['form'];

/** Kampegenskapene til en våpenart. Ligger på arten, ikke på hver gjenstand. */
export interface VaapenKamp {
    /** Pust ett slag koster. */
    pust: number;
    manover: Manover;
    iRekke: RekkeVerdi;
    /** Tungt slag = lengre hitstop og dyrere å blokkere. */
    tungt: boolean;
    angrep: Angrepsform;
}

/**
 * Skjoldet er en forbruksvare, ikke en statoppgradering. Lindetre, tynt, bygget
 * for å ta imot og splintres.
 *
 * Sektoren det dekker står *ikke* her. Den hører til epoken (`VernDef.dekning`):
 * alle rundskjold dekket 120 grader, og en soldat som kaster seg i dekning i
 * 1916 dekker ikke mer bare fordi sekken hans er tyngre.
 */
export interface SkjoldDef {
    id: string;
    navn: string;
    /** Treff det tåler. Går ned ved blokk, ikke ved perfekt parade. */
    helse: number;
    /** Ekstra pust hver blokk koster. */
    tyngde: number;
    flavor: string;
}

// ─── Regelsett: verb-kontrakten til en epoke ────────────────────────────────
//
// Fella er å generalisere «våpen» til noe som dekker alt fra øks til Mauser.
// Vi generaliserer de tre verbene i stedet: innsats, vern og ressurs.
//
//   Verb       | 793            | 1916                | Til hest
//   -----------|----------------|---------------------|------------------
//   Innsats    | hugg           | skyt / lad          | ri ned
//   Vern       | reis skjoldet  | kast deg i dekning  | trekk i tøylene
//   Ressurs    | pust           | nerve               | hestens krefter
//
// Kjerneregelen overlever intakt: står du bak et reist vern når slaget kommer,
// blokkerer du; reiser du vernet i det slaget kommer, parerer du. Å dukke i det
// granaten kommer er nøyaktig samme ferdighet som å reise skjoldet i det øksa
// kommer, og den kontinuiteten får vi gratis så lenge signaturene her ikke har
// ordet «skjold» i seg.
//
// Se docs/Design documents/rpg-hub-og-epoker-blueprint.md §5.

/** Det eleven bruker opp. Pust i 793, nerve i 1916. */
export interface RessursDef {
    id: string;
    /** Ordet HUD-en skriver på stolpen. Verifikasjonsskriptene leser den som aria-label. */
    navn: string;
    /**
     * Taket. Stiger ikke med nivå: pust er menneskelig, og en sytten år gammel
     * gutt puster ikke bedre enn en huskarl.
     */
    maks: number;
    /** Per sekund, når hun har fått stå i fred. */
    gjenvinning: number;
    /**
     * Millisekunder etter siste handling og siste treff før gjenvinningen
     * starter. Denne pausen er grunnen til at eleven må ut av rekkevidde for å
     * puste, og den bevegelsen ut og inn er hele rytmen i kampen.
     */
    pause: number;
    /** Per sekund vernet koster å holde oppe. Ingen gjenvinning samtidig. */
    drenering: number;
    farge: string;
    /** Fargen når den er bunnet ut. Stolpen rister i samme øyeblikk. */
    tomFarge: string;
    bakgrunn: string;
}

/** Det eleven gjemmer seg bak. Skjold i 793, dekning i 1916. */
export interface VernDef {
    art: 'skjold' | 'dekning' | 'toyler';
    /** Ordet HUD-en bruker mens det holder. */
    navn: string;
    /** Ordet når det er brukt opp. */
    brutt: string;
    /** Grader det dekker rundt blikkretningen. Rundskjold 120, ikke 360. */
    dekning: number;
    /** Slites det av å ta imot? En skyttergrav gjør ikke det. */
    slitasje: boolean;
    /**
     * Paradevinduet, målt fra rammen vernet reiser seg. Gavmildt med vilje: er
     * det for stramt, slutter eleven å prøve, og da er hele systemet borte.
     */
    paradeVindu: number;
    /**
     * Hvor lenge vernet må ligge nede før det kan reises igjen. Uten denne kan
     * eleven hamre på tasten og få et evig paradevindu.
     */
    hvile: number;
    /** Farten mens vernet er oppe, som andel av vanlig gange. */
    fart: number;
    /** Rutene i HUD-en: én per treff vernet tåler. */
    farge: { oppe: string; nede: string; tomt: string };
    /** Det eleven får se i det vernet ryker. Epokens ord, ikke motorens. */
    meldinger: { brast: string; varsel: string };
}

export interface BevegelseDef {
    /** Piksler i sekundet. */
    fart: number;
    /** Finnes rullen i denne epoken? */
    rull: boolean;
    rullFart: number;
    rullMs: number;
    rullNedkjoling: number;
    /** Hvor lenge eleven er usårbar etter et treff. */
    usarbarMs: number;
    /** Kan eleven gå om bord i noe? Båt i 793, hest senere, tog aldri. */
    farkost: boolean;
}

/**
 * Verb-kontrakten til en epoke. Vikingtiden er eneste implementasjon nå, og det
 * er med vilje: poenget er ikke å ha to, det er at signaturene tåler den andre
 * når den kommer.
 */
export interface Regelsett {
    id: string;
    navn: string;
    ressurs: RessursDef;
    vern: VernDef;
    bevegelse: BevegelseDef;
    /** Verbene epoken kjenner. Et våpen med en annen form svinges i stedet. */
    angrepsformer: AngrepsformId[];
}

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
    /**
     * Særslaget. Uten dette er hvert slag et vanlig slag som garden kan ta.
     *
     * Det er med vilje ikke hvert slag: et monster som alltid slår ublokkerbart
     * fjerner skjoldet fra spillet, og et som alltid haker gjør skjoldet til
     * forbruksmateriell. Ett av n gir eleven noe å lese - og telegraferingen
     * skifter farge, så det går an å lese det.
     */
    sarslag?: {
        /** Hvert n-te slag er et særslag. */
        hvert: number;
        /** Går gjennom garden. Svaret er å rulle, ikke å blokkere. */
        ublokkerbart?: boolean;
        /** Haker skjoldet ned: blokkeres det, ryker hele skjoldet. Paraden er trygg. */
        hak?: boolean;
    };
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

/**
 * En epoke er en innholdsmodul: eget regelsett, egne steder, én portal i
 * hubben. Den er ikke et kart - det er stedene inni den som er kart.
 */
export interface EpokeDef {
    id: string;
    title: string;
    era: string;
    /** Kort tekst på verdenskartet. */
    pitch: string;
    /** Nivået som låser opp epoken. */
    krevesNiva: number;
    /** Klar til å spilles? Vikingtiden er ferdig, resten kommer. */
    spillbar: boolean;
    /**
     * Verb-kontrakten. Bare den ferdige epoken har en - de andre er tittel og
     * palett, og et regelsett ingen har designet ville vært et løfte vi ikke
     * kan holde.
     */
    regelsett?: Regelsett;
    /**
     * Sonen i spørsmålsbanken epoken henter fagstoff fra
     * (`scripts/generate-quest-bank.mjs`). Egen id fordi de to listene eies av
     * hver sin fil og ikke skal låses til hverandre.
     */
    bankSone: string;
    /**
     * Fargetema. Alt terreng og alt tømmer hentes herfra - ingen hardkodede
     * farger i tileforge. Det er dette som gjør at en ny epoke får sin egen
     * identitet uten at noen må tegne ny grafikk: trærne i Mesopotamia skal
     * ikke være fjordgrønne, og husene i Dampbyen ikke vikingbrune.
     */
    tema: Tema;
}

/**
 * Lyset over et sted. Dette er ikke palett, men *gradering*: hvordan hele
 * bildet farges etter at alt annet er tegnet (se `engine/verdenfx.ts`).
 *
 * Skillet er verdt å holde på. Paletten sier hva gresset er laget av; lysbildet
 * sier hva slags dag det er. En rå vikingmorgen og en tørr romersk ettermiddag
 * kan dele hver eneste flisfarge og likevel se ut som to verdener.
 */
export interface Lysbilde {
    /** Fargen skyggene trekkes mot. Kald i nord, varm i sør. */
    skygge: string;
    /** Fargen høylysene trekkes mot. */
    hoylys: string;
    kontrast: number;
    metning: number;
    /** Hvor mye bildet mørkner mot kantene. 0 = ingenting. */
    vignett: number;
    /** Hvor mye sollyset varierer når det driver over landskapet. */
    sol: number;
    /**
     * Grunnlyset. Over 1 løfter hele bildet.
     *
     * Den finnes fordi resten av graderingen mørkner: kontrast rundt 0,5,
     * vignett i kanten og et skydekke som driver over. Uten et løft her ender
     * en klar formiddag opp som skumring.
     */
    eksponering: number;
}

/** Været over et sted: skydekke, tåke, vind og det som lever i lufta. */
export interface Vaerlag {
    /**
     * Hvor mørkt det blir under en sky. 0 = skyfri himmel.
     *
     * Selve skydekket tegnes ikke som bilder, men regnes ut i
     * etterbehandlingen (`engine/verdenfx.ts`). Se kommentaren øverst i den
     * fila for hvorfor.
     */
    skyggedybde: number;
    /** Hvor fort skyene driver, i verdenspiksler i sekundet. */
    skyfart: number;
    /** Fargen skyggen trekker bildet mot. Kald grå-blå på en nordisk dag. */
    skyfarge: string;
    /** Hvor tett tåka ligger. 0 = klar sikt. Tegnes i samme pass som skyene. */
    taake: number;
    /** Fargen på tåka. */
    taakefarge: string;
    /** Vindstyrken. Styrer både hvor fort skyene driver og hvor mye trær svaier. */
    vind: number;
    /** Fnugg og pollen i lufta. 0 = klar luft. */
    fnugg: number;
    /** Får fugler krysse himmelen? */
    fugler: boolean;
}

/** Paletten til et sted. Alt terreng, tømmer, tak og løvverk leses herfra. */
export interface Tema {
    /** Graderingen. Utelates den, brukes `STANDARD_LYS`. */
    lys?: Lysbilde;
    /** Været. Utelates det, brukes `STANDARD_VAER`. */
    vaer?: Vaerlag;
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

// ─── Sted ───────────────────────────────────────────────────────────────────

/**
 * Ett kart. Alt scenen trenger for å bygge en verden ligger her, og ingenting
 * av det ligger i scenen selv.
 *
 * Før dette het scenen bokstavelig talt «nordvik» og leste NORDVIK_-dataene
 * direkte. Da fantes det ingen måte å bytte kart på - og kapittel 1 er nettopp
 * det: Torstein seiler fra Nordvik til Lindisfarne.
 */
export interface Sted {
    id: string;
    /** Navnet som slås opp når eleven ankommer. */
    tittel: string;
    undertittel: string;
    /** Epoken stedet hører til. Slår opp regelsett og spørsmålsbank i `EPOKER`. */
    epokeId: string;
    tema: Tema;
    /** Terrenget. Bygges på nytt hver gang eleven kommer hit. */
    byggKart: () => WorldMap;
    /** Ruta eleven står på ved ankomst. */
    spawn: [number, number];
    npcer: NpcDef[];
    landemerker: LandmarkDef[];
    /** Båter, hester og annet som ligger fortøyd her. */
    farkoster?: FarkostDef[];
    /** Bossen som vokter stedet. Ikke alle steder har en. */
    boss?: {
        enemyId: string;
        /** Ett skjold per spørsmål. */
        sporsmal: BankQuestion[];
    };
    /** Grunntonen i den generative slåtten. */
    musikkRot: number;
    /** Håndskrevne oppdrag som hører til dette stedet. */
    authored: AuthoredQuest[];
}

// ─── Farkost ────────────────────────────────────────────────────────────────

/**
 * Noe eleven kan gå om bord i. Båten i fjorden nå; hesten og VOC-skipet senere.
 *
 * Modellen er minimal med vilje: besittelse og styring, ingen fysikk. Figuren
 * står stille om bord, og det er farkosten som beveger seg - da slipper vi en
 * `ritt`-positur, og med den en omskriving av hele rammetabellen i
 * `spriteforge.ts`. Se blueprintens §7.
 */
export interface FarkostDef {
    id: string;
    navn: string;
    art: 'baat';
    /** Ruta den ligger fortøyd på. */
    tile: [number, number];
    /**
     * Hvor mange som får plass. Én brukes nå, men tallet står i typen fra dag
     * én: skal flere elever seile sammen i hubben senere, er det ikke en ny
     * modell, bare et større tall.
     */
    seter: number;
    /** Piksler i sekundet i full fart. */
    fart: number;
    /**
     * Millisekunder farkosten bruker på å komme i gang og på å legge seg. Et
     * fartøy snur ikke som et menneske, og det er hele forskjellen på å gå og
     * å ro.
     */
    treghet: number;
}

/** Et håndskrevet oppdrag: spørsmålet pluss innpakningen rundt det. */
export interface AuthoredQuest {
    title: string;
    intro: string;
    hint: string;
    giverId: string;
    question: BankQuestion;
    belonning: { xp: number; solv: number; itemId?: string };
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
