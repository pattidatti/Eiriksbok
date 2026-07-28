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

/**
 * Kjernetallene.
 *
 * `mana` og `visdom` er borte med besvergelsene (blueprint §15). Uten
 * trolldom har visdom ingenting å gange, og en kraftstolpe i 793 er et
 * grensesnitt som lover noe spillet ikke har. Pusten er ressursen nå, og den
 * bor i regelsettet - ikke her, for den er epokens og ikke personens.
 */
export interface CoreStats {
    /** Maks liv. */
    hp: number;
    /** Ganger våpenets skade. */
    styrke: number;
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

/**
 * Det eleven velger om seg selv, og alt hun velger.
 *
 * `classId` sto her til §16.3 ble bygget. Rollen er kapittelets - hun er
 * Torstein i 793 og Åsa i 872 - og det eneste som er hennes gjennom alle fem,
 * er navnet i hallen og hvordan figuren ser ut. `kjortel` er nummeret på en
 * farge i `KJORTLER`, ikke fargen selv: hexen hører hjemme ett sted, og et
 * lagret spill skal ikke bære en farge vi kanskje justerer.
 */
export interface CharacterDraft {
    name: string;
    kjortel: number;
    appearance: AppearanceChoice;
}

/**
 * Alt sprite-smia trenger for å kle på én figur.
 *
 * Både eleven og de andre i hallen tegnes av `forgeHumanoid`, og begge kles på
 * av `figurLook()` i `data/eleven.ts`. Typen står her, ikke i `spriteforge.ts`,
 * fordi den krysser grensa mellom data, nett og tegning.
 */
export interface FigurLook {
    appearance: AppearanceChoice;
    tunic: string;
    trim: string;
    /** 0 = ingen rustning, 1-3 = stadig tyngre. Styrer plater og hjelm. */
    armorTier: number;
}

/**
 * Retningen en figur ser. Må være den samme unionen som `Dir` i
 * `spriteforge.ts` - den er et alias av denne, så de kan ikke drive fra
 * hverandre.
 */
export type Retning = 'ned' | 'venstre' | 'hoyre' | 'opp';

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

// ─── Kapittel ───────────────────────────────────────────────────────────────
//
// Nordvik er ikke en sone, det er en gård ved en fjord, og eleven spiller den
// fem ganger over 273 år. Kapittelet sier hvem hun er denne gangen, hvilket år
// det er, og hva som har endret seg på kartet siden sist.
//
// Se docs/Design documents/minnevokteren-nordvik-blueprint.md §2 og §4.

export type Stand = 'trell' | 'karl' | 'hauld' | 'jarl';

/**
 * Ett steg i et kapittel.
 *
 * Framdriften er en liste med id-er i kampanjetilstanden, ikke et tall. Et tall
 * kan bare gå én vei og sier ingenting om *hva* eleven gjorde; en liste tåler
 * at hun tar skroget før hun har trent med Ravn, og den tåler at vi legger til
 * et steg midt i uten at hvert lagrede spill i et klasserom hopper et hakk.
 */
export interface StegDef {
    id: string;
    tittel: string;
    /** Én linje i oppdragsloggen. Sier hva hun skal, ikke hvordan. */
    mal: string;
    /** Stegene som må være ferdige før dette dukker opp. */
    krever: string[];
}

export interface KapittelDef {
    id: string;
    nr: number;
    aar: number;
    tittel: string;
    /** Hvem eleven er. Ikke en avatar - en person. */
    rolle: { navn: string; alder: number; stand: Stand; kjonn: 'kvinne' | 'mann' };
    /** Ætten hun hører til. Avgjør hvem hevnerne er, og hvem som skylder henne. */
    aettId: string;
    /** Åpningsteksten. Vises én gang, når kapittelet begynner. */
    opptakt: { tittel: string; tekst: string };
    steg: StegDef[];
    mellomspillEtter: string | null;
    /**
     * Systemene kapittelet faktisk bruker, og som HUD-en derfor viser.
     *
     * Ære og årshjul finnes i hele kampanjen som samfunn, men de er ikke
     * spillbare i hvert kapittel. En ærestolpe i 793 som ingenting kan flytte,
     * er et grensesnitt som lover noe spillet ikke har - og det er nøyaktig
     * feilen mana-stolpen gjorde før besvergelsene ble pensjonert (§15).
     */
    systemer?: { aere?: boolean; aarshjul?: boolean };
}

// ─── Ære, ætt og ting ───────────────────────────────────────────────────────
//
// Blueprint §7.1 og §7.2. Ære er personlig og dør med personen; ætt-æren arves.
// Et drap uten lysing er ikke drap, det er mord, og mord kan ikke bøtes.

export interface AettDef {
    id: string;
    navn: string;
    /** Folk som hører til. Navnene brukes av hevnen og av tinget. */
    medlemmer: string[];
    /** Mannebot per stand, i mark sølv. Se data/aetter.ts for hvorfor tallene. */
    botsatser: Record<Stand, number>;
}

/** Hvordan én ætt ser på eleven akkurat nå. */
export interface AettTilstand {
    /** -100 til 100. Under null vil de deg noe. */
    velvilje: number;
    /** Uoppgjorte drap eleven står ansvarlig for. Hevnerne blir flere per drap. */
    uoppgjort: number;
}

export type Gjerning = 'drap' | 'tyveri' | 'aereskrenkelse';

export interface Sak {
    id: string;
    gjerning: Gjerning;
    gjerningsmann: string;
    offer: string;
    /** Ætten som skal ha boten, og som ellers tar hevn. */
    offersAett: string;
    /** Standen avgjør hvor mye et liv koster. */
    offersStand: Stand;
    /** Lyst innen ett døgn? Ellers er det mord, og mord kan ikke bøtes. */
    lyst: boolean;
    /** Dagen på årshjulet gjerningen skjedde. Fristen måles herfra. */
    skjeddeDag: number;
    vitner: string[];
    /** Lovhjemmelen eleven anførte. Feil hjemmel taper saken selv om hun har rett. */
    anfort: string | null;
    dom: 'ubehandlet' | 'bot' | 'fredlos' | 'frikjent';
}

// ─── Årshjulet ──────────────────────────────────────────────────────────────

export type Aarstid = 'vaar' | 'sommer' | 'host' | 'vinter';

/**
 * Tiden i epoken.
 *
 * Årstiden står ikke her, den regnes ut av dagen (`aarstidFor` i
 * engine/klokke.ts). To felt som beskriver det samme driver fra hverandre
 * første gang noen setter dagen uten å sette årstiden - og da står gården og
 * sår korn i november.
 */
export interface Klokke {
    aar: number;
    /** 1 til og med `AARETS_DAGER`. */
    dag: number;
}

/**
 * Det gården har å leve av.
 *
 * Fire tall, og ikke flere: korn er både mat og såkorn, kjøtt er det som ikke
 * må dyrkes, dyra er både mat og fôrutgift - og åkeren er det som står på rot.
 * Et femte tall gjør bua til et regneark, og det er ikke det nøklene handler om.
 */
export interface Forrad {
    /** Sekker bygg i bingen. */
    korn: number;
    /** Mål tørket og saltet kjøtt. */
    kjott: number;
    /** Kyr og sauer. */
    dyr: number;
    /**
     * Det som står og gror.
     *
     * Eget tall, og det er verdt det: eleven ser avlingen sin vokse fram i det
     * hun sår, i stedet for å få et tall i fanget om høsten. Det er der
     * lærdommen om såkornet sitter - at høsten begynner om våren.
     */
    aaker: number;
}

// ─── Minnetreet ─────────────────────────────────────────────────────────────
//
// Kunnskap er ikke et tall, det er handlingsrom (blueprint §7.4). Eleven kan
// `[Klinkbygging]` fordi hun har bygget et skrog som fløt - ikke fordi hun
// svarte riktig på et flervalgsspørsmål.

export type Forstaaelse = 'ukjent' | 'hort' | 'forstatt';

export interface BegrepDef {
    id: string;
    navn: string;
    /** Kort forklaring, i elevens eget språk. Vises når begrepet løftes. */
    forklaring: string;
    /** Hva som løfter det til `forstatt`. Aldri et quizsvar. */
    forstasVed: string;
    /** Replikken hun kan bruke når hun forstår det. Blueprint §7.4. */
    replikk: string;
}

// ─── Kilder og mellomspill ──────────────────────────────────────────────────
//
// Mellom hvert kapittel forlater eleven året hun spilte, og ser tilbake på det
// hun nettopp gjorde (blueprint §6). Formen er et bord med kilder på: hun
// legger dem ut, leser dem, veier dem. Ingen kamp, ingen tidspress.
//
// Dette er kildekritikken, og den er hardere her enn den ville vært som et
// avsnitt i en artikkel, fordi hun var der.

export type KildeArt =
    | 'brev'
    | 'annal'
    | 'reiseberetning'
    | 'dikt'
    | 'innskrift'
    | 'saga'
    | 'arkeologi';

/**
 * Hvor nær kilden står det den forteller om.
 *
 * `nesten` er den viktigste av de fire: den angelsaksiske krøniken *ser*
 * samtidig ut - den er ført år for år - men boka vi har er skrevet omkring
 * hundre år senere, av eldre notater. Uten det trinnet ville eleven lært at en
 * årbok er en samtidig kilde, og det er ikke sant.
 */
export type Naerhet = 'samtidig' | 'nesten' | 'senere' | 'mye-senere';

export interface KildeDef {
    id: string;
    navn: string;
    art: KildeArt;
    naerhet: Naerhet;
    /** Årstallet slik det står på kortet. Kort - ikke en setning. */
    aar: string;
    opphav: {
        hvem: string;
        /** Hvor kilden ble skrevet. Alkuins hele poeng ligger her. */
        hvor: string;
        for: string;
        hensikt: string;
    };
    /** Det kilden faktisk sier, oversatt. Aldri omskrevet til noe den ikke sier. */
    utdrag: string;
    /** Hvor utdraget er hentet fra, i klartekst, så en lærer kan slå det opp. */
    henvisning: string;
    /**
     * Hva de fire feltene på kortet skal hete for nettopp denne kilden.
     *
     * Sju av åtte kilder er tekster, og for dem står «Skrevet av / Skrevet i /
     * Skrevet til / Vil oppnå». Den åttende er et skrin av barlind og bronse,
     * og et skrin er ikke skrevet av noen. Sto merkene fast, ville bordet
     * påstått at en gjenstand har en forfatter og en hensikt - altså det stikk
     * motsatte av hvorfor arkeologien er verdt å legge ut til slutt.
     */
    merker?: { hvem: string; hvor: string; for: string; hensikt: string };
}

/**
 * Ett spørsmål eleven veier en kilde med.
 *
 * `fasit` står uansett hva hun svarte. Et mellomspill uten tidspress og uten
 * kamp har ingen grunn til å straffe et feil valg - poenget er at hun ser
 * hvorfor, og et bom er ofte den beste veien inn i det.
 */
export interface Veiing {
    id: string;
    sporsmal: string;
    svar: VeiingSvar[];
    /** Det som står etterpå, uansett svar. Selve fagstoffet. */
    fasit: string;
}

export interface VeiingSvar {
    tekst: string;
    riktig: boolean;
    /** Kort svar på nettopp dette valget. Én setning, uten dom. */
    respons: string;
}

export interface MellomspillDef {
    id: string;
    nr: number;
    tittel: string;
    apning: { tittel: string; tekst: string };
    /**
     * Alle kildene lagt ut på én linje, før kortene.
     *
     * Bare Mellomspill V har den, og det er formen bordet i 1066 *er*: fire
     * bord har lagt ut to kilder hver, og til slutt skal de ligge sammen i
     * tidsrekkefølge, med avstanden fra hendelsen til nedskrivingen tegnet som
     * en strek. Hullene i kampanjen blir da ikke noe hun får opplyst - de er
     * det hun ser (blueprint §6).
     */
    tidsrekke?: Tidsrekke;
    /** Kildene på bordet, i den rekkefølgen de legges ut. */
    kort: MellomspillKort[];
    /** Feltet som blir stående tomt. Det sterkeste øyeblikket (blueprint §3). */
    tomtFelt: TomtFelt | null;
    /** Begrepene bordet løfter til `forstatt` når hun er gjennom. */
    begreper: string[];
    slutt: { tittel: string; tekst: string; knapp: string };
}

export interface MellomspillKort {
    kildeId: string;
    /** Knappen som legger kortet på bordet. Hennes handling, ikke spillets. */
    knapp: string;
    veiinger: Veiing[];
}

/**
 * Kilden som ikke finnes.
 *
 * Det finnes ingen norrøn beretning om Lindisfarne - ikke ett kvad, ikke én
 * runestein. Eleven skal ikke få det opplyst; hun skal lete etter den og finne
 * feltet tomt. Derfor er dette et eget trinn med en egen knapp, og ikke en
 * tredje `MellomspillKort` uten utdrag.
 */
export interface TomtFelt {
    /**
     * De to setningene som står rett før hun ser etter.
     *
     * Data og ikke fast tekst i komponenten, av samme grunn som `feltNavn`:
     * bordet i 793 sier «begge er skrevet av dem du gikk løs på», og det er
     * sant der og bare der. Sto den setningen fast, ville bordet i 872 påstått
     * at Snorre og Haraldskvadet var skrevet av noen eleven hadde angrepet.
     */
    oppfordring: string;
    knapp: string;
    /**
     * Det som står igjen på det tomme kortet i raden øverst, etter at hun har
     * sett etter.
     *
     * To felter og ikke en fast tekst, fordi hullet ikke er det samme hver
     * gang: i 793 er det en norrøn kilde som ikke finnes, i 872 er det et
     * årstall ingen kilde gir. Sto «Norrøn kilde / Ingen» hardkodet i
     * komponenten, ville bordet i 872 påstått at det manglet noe annet enn det
     * eleven nettopp lette etter.
     */
    feltNavn: string;
    feltSvar: string;
    tittel: string;
    tekst: string;
    /**
     * Linjene som bare står der hvis flagget er satt.
     *
     * En liste og ikke én linje, fordi det tomme feltet i 1066 er eleven selv:
     * der skal alle fem kapitlene stå oppført med det hun faktisk gjorde, og
     * ingen av dem finnes i noen kilde. Bordene i 793 og 1030 har fortsatt bare
     * én linje hver.
     */
    hvisFlagg?: { flagg: string; tekst: string }[];
    veiing: Veiing;
}

// ─── Tidsrekka (Mellomspill V) ──────────────────────────────────────────────

/**
 * Alle kildene i kampanjen, lagt ut på én linje.
 *
 * Hvert punkt tegnes som en strek fra året det handler om til året det ble
 * skrevet ned. Alkuins strek er et punkt; Snorres er tre og et halvt hundreår
 * lang. Det er den samme opplysningen fire bord har gitt hver for seg, og
 * første gang eleven ser den som en form.
 */
export interface Tidsrekke {
    /** Knappen som legger alt ut. Hennes handling, som kortene. */
    knapp: string;
    tittel: string;
    tekst: string;
    punkter: TidsrekkePunkt[];
    /**
     * Ett spørsmål om helheten. Ikke om ett kort - det er gjort før.
     *
     * Knappen som avslutter det, heter det samme som knappen på det første
     * kortet: bordet navngir alltid neste handling, aldri «Videre». Derfor står
     * det ikke noe eget felt for den her.
     */
    veiing: Veiing;
}

export interface TidsrekkePunkt {
    /** Året kilden ble til. Der streken slutter. */
    aar: number;
    /** Året den forteller om. Der streken begynner. */
    omAar: number;
    /** Årstallet slik det står for eleven: «793», «ca. 1230». */
    merke: string;
    navn: string;
    art: KildeArt;
    /** Én linje om hva den forteller om. Ikke en gjentakelse av kortet. */
    om: string;
    /** Kilden hun alt har lagt ut, hvis den er ett av kortene fra I-IV. */
    kildeId?: string;
}

// ─── Cutscenes ──────────────────────────────────────────────────────────────
//
// Bygget på det motoren alt har: kamera, tweens, spriteforge-figurer, låsen og
// synten. Ingen video, ingen nye filer. Fire regler gjelder (blueprint §8):
// ingen fakta som bare finnes her, alltid hoppbar, maks 40 sekunder, og vis
// handling framfor replikk.

export type Klipp =
    | { art: 'letterbox'; pa: boolean }
    | { art: 'kamera'; til: [number, number]; ms: number }
    | { art: 'folg'; hvem: string | 'spiller' }
    | { art: 'gaa'; hvem: string | 'spiller'; til: [number, number]; ms?: number }
    | { art: 'vend'; hvem: string | 'spiller'; retning: Retning }
    | { art: 'si'; hvem: string; tekst: string; ms?: number }
    | { art: 'tanke'; tekst: string; ms?: number }
    | { art: 'vent'; ms: number }
    | { art: 'toning'; inn: boolean; ms: number; farge?: number }
    | { art: 'ryst'; ms: number; styrke: number }
    | { art: 'lyd'; navn: 'horn' | 'dialog' | 'treSprak' | 'skjold' | 'bossBrol' | 'pil' }
    | { art: 'musikk'; rot: number; modus?: number }
    | { art: 'stille' }
    | { art: 'taake'; tetthet: number; ms: number }
    /**
     * Kameraet stiger. `til` er en andel av skjermens egen zoom - 0.6 er
     * seks tideler så nær - og `null` setter den tilbake.
     */
    | { art: 'stig'; til: number | null; ms: number }
    | { art: 'flytt'; hvem: string | 'spiller'; til: [number, number] }
    | { art: 'sett'; hvem: string; synlig: boolean };

export interface KlippDef {
    id: string;
    /** Sekvensen. Spilles i rekkefølge, og eleven kan hoppe over etter første visning. */
    steg: Klipp[];
}

// ─── Fiender ────────────────────────────────────────────────────────────────

/**
 * Hva slags motstander dette er.
 *
 * `menneske` er den som gjelder fra 793 og utover: fiendene i kampanjen er
 * folk, med navn, ætt og en grunn til å stå der. De abstrakte formene under er
 * den gamle Minnevokteren-rammen, og de pensjoneres med den (blueprint §15).
 */
export type EnemyKind =
    | 'menneske'
    | 'glemsel'
    | 'paastand'
    | 'anakronisme'
    | 'rykte'
    | 'vrangbilde'
    | 'boss';

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
     * Bare for `kind: 'menneske'`: hva han har i hendene.
     *
     * Dette er ikke pynt. Eleven skal kunne lese av silhuetten hva slaget
     * kommer til å bli - spydmannen stikker langt og varsler lenge, øksekaren
     * haker først. Ser de like ut, er telegraferingen bortkastet.
     */
    vaapenArt?: WeaponArt;
    /** Har han skjold? Da dekker han seg, og du må åpne ham før du treffer. */
    harSkjold?: boolean;
    /** Hårfargen, så en flokk ikke ser ut som én mann kopiert opp. */
    haar?: number;
    /**
     * Navn over hodet.
     *
     * Skillet i blueprintens §5.7 går ikke mellom «lov å nyte» og «ikke lov»,
     * men mellom hvem som er inne i ættesystemet. Fremmede har ingen navn over
     * hodet og intet etterspill; folk fra bygda har begge deler, og eleven ser
     * forskjellen *før* hun slår.
     */
    navngitt?: boolean;
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
    /**
     * Årstallet epoken står på i hubbens tidslinjevei - der portalen hennes
     * ligger. Ett tall må velges for et helt århundre, og det er greit: veien
     * skal gi eleven en følelse av avstand i tid, ikke en datering.
     *
     * `null` betyr at epoken ikke hører hjemme på en tidsakse i det hele tatt.
     * Språk, tro, samfunn og musikk er ikke tider, de er måter å se på, og de
     * står i lunden ved siden av veien. Det er sant, og det er verdt å vise.
     */
    aar: number | null;
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

/** Paletten til et sted. Alt terreng, tømmer, tak og løvverk leses herfra. */
export interface Tema {
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
    /** Hvilken vei hun ser når hun står i ro. Ned om ingen sier noe annet. */
    ser?: Retning;
    palette: { tunic: string; trim: string; hair: string };
    /** Det NPC-en sier når du snakker uten aktiv quest. */
    smalltalk: string[];
    /** Faktaopplysninger NPC-en gir - dette er «svarene i verden». */
    kunnskap?: KunnskapsBit[];
    /** Handelsmann? Da åpner samtalen en bod i stedet for et oppdrag. */
    handler?: { varer: string[]; velkomst: string };
    /**
     * Kapittelhandlinger denne personen tilbyr.
     *
     * Dette er ikke oppdrag. Et oppdrag er et spørsmål med et svar i verden; en
     * handling er et sted i kapittelet - Ravn som reiser seg fra stubben, Orm
     * som rekker deg et bord. De ligger på NPC-en og ikke i questmotoren fordi
     * de ikke har noe med spørsmålsbanken å gjøre.
     */
    handlinger?: NpcHandling[];
}

export interface NpcHandling {
    id: string;
    /** Teksten på knappen. Elevens ord, ikke spillets: «Vis meg». */
    knapp: string;
    /** Det han sier når han tilbyr den. */
    ledetekst: string;
    /** Kapittelsteg som må være gjort først. Uten dem vises den ikke. */
    krever?: string[];
    /** Steget den fører til. Er det gjort, tilbys handlingen ikke igjen. */
    gir: string;
    /** Det han sier etterpå, når det alt er gjort. */
    etterpa: string;
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
    /**
     * Begrepet denne opplysningen *nevner*.
     *
     * Den løftes til `hort`, aldri høyere. Å høre et ord er ikke å kunne det,
     * og en NPC som deler ut `forstatt` ville gjort minnetreet til noe eleven
     * kan klikke seg gjennom (blueprint §7.4).
     */
    begrep?: string;
}

export interface LandmarkDef {
    id: string;
    /**
     * `varde` er den ene som ikke leses: eleven legger en stein på den i
     * stedet for å åpne en tekst. Se `Interaksjon`.
     */
    kind: 'runestein' | 'skilt' | 'baal' | 'kiste' | 'varde';
    tile: [number, number];
    title: string;
    /** Teksten eleven leser - inneholder svar på minst ett spørsmål. */
    text: string;
    /** Hvilke spørsmål teksten svarer på. Se KunnskapsBit. */
    stikkord?: string[];
    /**
     * Begrepet teksten gir, og hvor langt den tar det.
     *
     * En runestein kan gi `forstatt` der begrepet nettopp *er* å lese den -
     * `[Nordvegen]` forstås ved å lese steinen ved veien, og det er hele
     * handlingen. Alt annet enn det skal stå på `hort`.
     */
    begrep?: { id: string; niva: Forstaaelse };
    /**
     * Linjer som bare står der hvis eleven gjorde noe tidligere i kampanjen.
     *
     * Dette er det gården husker. Steinen over Torstein sier én ting til den
     * som tok relikvieskrinet med hjem i 793, og en annen til den som lot det
     * ligge - og ingen av delene er en dom. Teksten legges under den faste, med
     * luft, så eleven ser at det er noe som gjelder henne.
     */
    tillegg?: { flagg: string; tekst: string }[];
    /**
     * Noe eleven kan *gjøre* her som ikke er et valg med en følge, men en dør
     * inn til en egen skjerm - bua med forrådet.
     *
     * Skilt fra `valg` med vilje: `valg` setter et flagg og er over, dette
     * åpner noe scenen eier. Ett felt som gjorde begge deler ville før eller
     * siden fått en `if` i seg om hva slags landemerke det var.
     */
    handling?: {
        id: string;
        knapp: string;
        /** Kapittelsteg som må være gjort før knappen finnes. */
        krever?: string[];
    };
    /**
     * Noe eleven kan gjøre her, ikke bare lese.
     *
     * Lindisfarne er hele grunnen til at dette finnes: relikvieskrinet, bøkene,
     * skriptoriet. Hun tar det hun vil, eller lar være, og spillet sier
     * ingenting - verken ros eller straff. Følgen kommer i mellomspillet og i
     * graven hennes i kapittel 5.
     */
    valg?: LandmarkValg;
}

export interface LandmarkValg {
    id: string;
    /** Teksten på knappen. Hennes handling, ikke spillets vurdering av den. */
    knapp: string;
    /** Flagget den setter. Leses av mellomspillet og av senere kapitler. */
    flagg: string;
    /** Det som står der etterpå. Én linje, uten dom. */
    etterpa: string;
    /**
     * Sølv det gir. Bøkene gir null, og det er ikke en forglemmelse: de er
     * verdiløse for henne og uerstattelige for dem, og det er hele poenget.
     */
    solv?: number;
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
/**
 * En dør ut av stedet.
 *
 * Portalene i hubben peker på epoker; portalen i den andre enden peker hjem.
 * Alt annet en portal viser - tittel, tidsspenn, farge, om den er åpen - slås
 * opp i `EPOKER`, så en ny epoke blir synlig i hubben uten at noen skriver den
 * inn to steder.
 */
export interface PortalDef {
    tile: [number, number];
    maal:
        | { art: 'epoke'; epokeId: string }
        | { art: 'sted'; stedId: string; navn: string; undertekst: string };
}

export interface Sted {
    id: string;
    /** Navnet som slås opp når eleven ankommer. */
    tittel: string;
    undertittel: string;
    /**
     * Epoken stedet hører til. Slår opp regelsett og spørsmålsbank i `EPOKER`.
     *
     * `null` for hubben: den ligger utenfor alle epoker. Det er ikke en
     * mangel - det er grunnen til at eleven kan gå dit uten at nivået,
     * sølvet og oppdragene hennes byttes ut med en annen epokes.
     */
    epokeId: string | null;
    /**
     * Kapittelet stedet hører til, om det hører til ett.
     *
     * Nordvik finnes fem ganger - det er samme gård, men ikke samme kart, og
     * ikke samme folk. Uten dette feltet ville porten hjem fra hallen alltid
     * ført tilbake til 793, fordi den slår opp «det første stedet i epoken».
     */
    kapittel?: number;
    /**
     * Navnet i HUD-en, når kapittelets rolle er feil svar.
     *
     * Utelatt betyr «bruk rollen i kapittelet», som er riktig overalt bortsett
     * fra ett sted: epilogen. Nordvik i 1100 hører til kapittel 5, men Orm har
     * ligget ved Stanford bru i trettifire år, og et navneskilt med ham på
     * mens eleven går rundt på gården er den ene setningen epilogen ikke tåler.
     *
     * `null` gir elevens eget navn i stedet, og det er ikke en nødløsning: de
     * fem rollene er over, og den som ser på gården nå, er hun.
     */
    rollenavn?: string | null;
    tema: Tema;
    /** Terrenget. Bygges på nytt hver gang eleven kommer hit. */
    byggKart: () => WorldMap;
    /** Ruta eleven står på ved ankomst. */
    spawn: [number, number];
    npcer: NpcDef[];
    landemerker: LandmarkDef[];
    /** Båter, hester og annet som ligger fortøyd her. */
    farkoster?: FarkostDef[];
    /** Dørene ut. Hubben har mange, Nordvik har én tilbake. */
    portaler?: PortalDef[];
    /**
     * Hvor tykk Glemselen ligger her. 1 er Nordvik. Hubben ligger utenfor
     * tiden, og tåka har mindre å ta av - men den skal ikke være borte, for da
     * ser stedet ut som et annet spill.
     */
    taake?: number;
    /** Bossen som vokter stedet. Ikke alle steder har en. */
    boss?: {
        enemyId: string;
        /** Ett skjold per spørsmål. */
        sporsmal: BankQuestion[];
    };
    /**
     * Hvem som dukker opp av seg selv her.
     *
     * Tom liste betyr at ingen gjør det - og det er ikke det samme som et sted
     * uten fiender: raidet setter ut sine egne, og opplæringen sin ene. Uten
     * dette feltet leste spawningen rett fra hele fiendelista, og da ville en
     * ny motstander i `data/enemies.ts` begynt å vandre rundt på hvert eneste
     * kart i spillet - også på gårdstunet hjemme.
     */
    spawner: string[];
    /** Grunntonen i den generative slåtten. */
    musikkRot: number;
    /** Håndskrevne oppdrag som hører til dette stedet. */
    authored: AuthoredQuest[];
    /**
     * Deles stedet med andre elever?
     *
     * Bare hallen. «Hubben er sammen, epokene er alene» (blueprint §4.1) er en
     * pedagogisk regel før den er en teknisk: de stille øyeblikkene inne i en
     * epoke kollapser med en klassekamerat som spretter rundt i bildet.
     *
     * Flagget står på stedet og ikke i nettlaget med vilje. Da kan ingen
     * komme til å slå på flerspiller for et sted ved å endre en if-setning
     * inne i transporten - det må gjøres her, ved siden av alt annet som sier
     * hva stedet er.
     */
    flerspiller?: boolean;
    /** Benker og steiner det går an å sette seg på. Bare der folk møtes. */
    sitteplasser?: SitteplassDef[];
}

// ─── Samvær ─────────────────────────────────────────────────────────────────

/**
 * Et sted å sette seg. Bålet er verdt å sitte ved uansett (blueprint §3.4), og
 * det er dette elevene faktisk kommer til å bruke rommet til (§4.5).
 *
 * Å sitte er ikke en ny positur. Figuren settes ned på benken i idle-ramma,
 * nøyaktig som hun står stille om bord i færingen - av samme grunn: en
 * `sitte`-positur ville tvunget `KOLONNER`, `START`, `POSITUR_LENGDE` og hele
 * positurlista i `forgeHumanoid` til å endres i samme åndedrag.
 */
export interface SitteplassDef {
    id: string;
    tile: [number, number];
    /** Hvilken vei hun ser når hun sitter - mot bålet, ikke ut i skogen. */
    ser: Retning;
}

// ─── Flerspiller ────────────────────────────────────────────────────────────

/**
 * Det som endrer seg ti ganger i sekundet: hvor en figur står og hva hun gjør.
 *
 * Står her og ikke i `net/`, fordi scenen melder den uten å vite at det finnes
 * et nett. Ville den vært en nett-type, måtte `systems/spiller.ts` importert
 * fra `net/` - og da hadde vi en pil fra spillet mot Firebase som ingen hadde
 * bedt om.
 */
export interface Stilling {
    x: number;
    y: number;
    dir: Retning;
    /** Bare de to som er synlige på avstand. Ingen slag, ingen gard. */
    positur: 'idle' | 'gang';
    sitter: boolean;
}

/**
 * En annen elev i hallen, slik hun kommer inn over nettet.
 *
 * Dette er hele det delte bildet. Det er med vilje kort: posisjon, retning,
 * hvem hun er og hva hun føler. Ingen liv, ingen skade, ingen kamptilstand -
 * det finnes ingen kamp der ute, og en type som later som noe annet ville
 * invitert til å bygge det.
 */
export interface Gjest {
    id: string;
    /** Navnet hun valgte, allerede gjennom navnevakten. */
    navn: string;
    x: number;
    y: number;
    dir: Retning;
    /** Bare de to som er synlige på avstand. Ingen slag, ingen gard. */
    positur: 'idle' | 'gang';
    sitter: boolean;
    /** Følelsen hun sendte, eller null. Alltid fra det faste hjulet. */
    emoji: string | null;
    /** Nummeret på kjortelfargen hennes. Se `KJORTLER` i `data/eleven.ts`. */
    kjortel: number;
    appearance: AppearanceChoice;
    /** Rustningstrinnet, 0-3. Sendt som tall, ikke som gjenstands-id. */
    rustning: number;
    /** Klokkeslettet vi hørte fra henne sist, målt på tjenerens klokke. */
    sist: number;
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
//
// Formen på disken, versjon 4. Den er ikke den samme som kjøretidstilstanden i
// `store/useRpgStore.ts`: der ligger den aktive epoken flatt, så komponentene
// kan lese `s.hp` uten å vite hvilken epoke de står i. Storen pakker mellom de
// to formene i `partialize` og `merge`, og det er de eneste to stedene som
// kjenner begge. Før hadde vi to typer som skulle beskrive det samme, og de
// hadde drevet fra hverandre.

/**
 * Det eleven har lært og gjort i en epoke. Arves mellom kapitler: Orm den
 * yngre i 1066 arver ikke Torsteins sverd fra 793, men han arver at ætten hans
 * gjorde det den gjorde.
 */
export interface EpokeKampanje {
    /** Quest-id → status. */
    quester: Record<string, 'aktiv' | 'ferdig'>;
    /** Hvor mange ganger eleven har bommet på hvert oppdrag. */
    questForsok: Record<string, number>;
    /** Riktige svar totalt. Statistikk nå - den låser ikke opp noe lenger. */
    riktigeSvar: number;
    galeSvar: number;
    /** Landemerker eleven har lest. */
    lest: string[];
    /** Drepte bosser. */
    bosser: string[];
    /**
     * Kapittelstegene hun har gjort. Arves fordi kapittel 2 skal kunne spørre
     * om hun bygget skroget selv i 793.
     */
    steg: string[];
    /** Minnetreet: begrep-id → hvor langt hun har kommet med det. */
    begreper: Record<string, Forstaaelse>;
    /** Cutscenene hun har sett. En sett cutscene kan hoppes over. */
    sette: string[];
    /**
     * Kildene hun har lagt ut på bordet i et mellomspill.
     *
     * Ligger i kampanjen og ikke i kapittelet fordi den er kumulativ: i
     * Mellomspill V ligger alle kildene fra alle kapitlene på bordet samtidig,
     * i tidsrekkefølge, og hullene blir synlige (blueprint §6).
     */
    kilder: string[];
    /**
     * Valg som skal huskes på tvers av steder og kapitler - «brente
     * skriptoriet», «tok guttene». Ett flatt navnerom, med vilje: et valg som
     * bare gjelder inne i ett kapittel er ikke verdt et felt.
     */
    flagg: Record<string, boolean>;
    /**
     * Ættens rykte. Arves, i motsetning til personens egen ære.
     *
     * Dette er den beste grunnen til at kapittel 1 skal spille inn i kapittel
     * 2: Åsa begynner ikke på null, hun begynner på halvparten av det faren
     * hennes etterlot seg (§12.1).
     */
    aettAere: number;
    /** Hva hver ætt mener om eleven, og hva de har til gode. */
    aetter: Record<string, AettTilstand>;
    /** Sakene: reist, ført og dømt. Følger ætten, ikke personen. */
    saker: Sak[];
    /** Fredløs? Da er halve kartet fiendtlig. Det er en tilstand, ikke en slutt. */
    fredlos: boolean;
    /** Tiden. `aar` går aldri bakover, uansett hva et kapittel gjør. */
    klokke: Klokke;
}

/**
 * Det som hører til én person i ett kapittel, og som nullstilles ved
 * kapittelskifte. Nivå og utstyr følger personen, ikke ætten.
 */
/**
 * Det som hører til én person i ett kapittel.
 *
 * `mana` og `spells` er ute (blueprint §12.2). Pusten lagres ikke i det hele
 * tatt - den er alltid full ved innlasting, slik helsa klampes i
 * `onRehydrateStorage`.
 */
export interface EpokeKapittel {
    hp: number;
    xp: number;
    solv: number;
    /** Item-id-er i sekken. */
    sekk: string[];
    utstyr: Record<ItemSlot, string | null>;
    /**
     * Personens egen ære, 0-100.
     *
     * Står her og ikke i kampanjen fordi den dør med personen. Det ætten sitter
     * igjen med, er `aettAere`, og det er et annet og mindre tall.
     */
    aere: number;
    /**
     * Forrådet på gården.
     *
     * Kapitteltilstand: kornet i bingen i 872 er ikke det samme kornet som i
     * 995. Et forråd som fulgte kampanjen ville gjort hver vinter til en
     * konsekvens av forrige kapittels vinter, og da spiller ingen kapittel 3.
     */
    forrad: Forrad;
}

export interface EpokeSave {
    /** Hvilket kapittel `kapittelState` hører til. Ett foreløpig. */
    kapittel: number;
    /** Stedet i epoken eleven sto på sist. */
    sisteSted: string;
    kampanje: EpokeKampanje;
    kapittelState: EpokeKapittel;
}

/**
 * Sporene eleven legger igjen i hubben.
 *
 * Et åpent rom klokka 22 en søndag har én elev i seg (blueprint §3.4). Derfor
 * bærer hubben merker etter dem som var der før - foreløpig etter eleven selv,
 * og etter alle når flerspilleren kommer i R8. Formen er den samme begge
 * veier: et tall per portal, og steinene på varden.
 */
export interface HubSpor {
    /** Hvor mange ganger hun har gått inn i hver epoke. */
    besokt: Record<string, number>;
    /** Steiner lagt på varden. Én per gang hun kommer hjem. */
    steiner: number;
}

export interface SaveState {
    /**
     * Formen på disken.
     *
     * 4 var v4 fra blueprintens §12.2. 5 kom med §16.3: `character.classId` ble
     * `character.kjortel`, og et lagret spill måtte oversettes for at eleven
     * skulle se lik ut dagen etter.
     */
    version: 5;
    /** Følger eleven overalt, i alle epoker. */
    spiller: { character: CharacterDraft | null };
    /**
     * Hubben hører ikke til noen epoke, så sporene hennes ligger her.
     *
     * Feltet kom til etter at v4 var skrevet, og krevde likevel ingen ny
     * versjon: `merge` bygger hele tilstanden og fyller hull med defaults, så
     * en lagring uten `hub` får en tom en. Det var hele poenget med R6.
     */
    hub: HubSpor;
    /** Epoken hun sto i sist. */
    sisteEpoke: string;
    epoker: Record<string, EpokeSave>;
}
