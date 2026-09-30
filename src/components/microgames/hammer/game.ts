// HAMMER OG AMBOLT - Aleksanders slag, 338-326 fvt.
//
// Spillreglene (ren TS, ingen React - samme kode i nettleseren og i simuleringen).
//
// Auto-battler i sju slag. Hver runde har to faser:
//   1. Planlegging: kjøp enheter fra en seedet butikk (5 kort, omrulling for gull), plasser
//      dem i fremre eller bakre rekke eller på flankene. Tre like smelter sammen. Gull du
//      sparer, gir renter. Fiendehæren står allerede på andre siden av sletta.
//   2. Slaget: hærene kjemper av seg selv. Hærføreren har én evne eleven utløser.
//
// Fagkjernen er historisk taktikk (stein-saks-papir med geometri):
//   - Sarissaen (piker) stopper ryttere, vogner og elefanter som kommer forfra.
//   - Ryttere knuser bueskyttere og slyngekastere.
//   - Skyttere slår treg, tung infanteri på avstand.
//   - Lett infanteri åpner rekkene for ljåvogner og stikker elefanter.
//   - Hammer og ambolt: en enhet som slåss forfra og blir truffet fra siden, tar nesten
//     dobbel skade.
//   - En blandet hær av mange folk (hellenisme) slår en ensartet.
//
// Koordinater: x er bredden (-9..9), z går fra spilleren (negativ) mot fienden (positiv).
// Rutenett: 5 kolonner (0 og 4 er flankene) x 2 rekker per side.

export const COLS = 5;
export const COL_X = [-5.4, -2.7, 0, 2.7, 5.4];
/** z for fremre og bakre rekke på spillerens side. Fienden speiles. */
export const ROW_Z = [-3.5, -7];
export const BENCH = 5;
export const SHOP_SIZE = 5;
export const LIVES = 3;
export const BATTLES = 8;
export const REROLL = 1;
export const PLAN_SECONDS = 35;
export const FIRST_PLAN = 50;
export const REWARD_SECONDS = 10;
export const BATTLE_MAX = 45;
/** Tempoet i slaget: all skade ganges med dette. */
export const PACE = 0.72;
/** Et nederlag er knusende (koster to moral) når så stor del av fiendehæren står igjen. */
export const CRUSH = 0.35;
export const MARCH = 1.2;
export const STAR_MULT = 1.8;
export const RADIUS = 1.1;

export type Folk = 'makedonere' | 'grekere' | 'thrakere' | 'persere' | 'steppefolk' | 'indere';
export type Klasse = 'tung' | 'lett' | 'kav' | 'skytter' | 'vogn' | 'elefant';
export type Kind =
    | 'falanks'
    | 'hypaspist'
    | 'hetairoi'
    | 'hoplitt'
    | 'kreter'
    | 'tessaler'
    | 'agrianer'
    | 'udodelig'
    | 'kardak'
    | 'asp'
    | 'bue'
    | 'slynge'
    | 'vogn'
    | 'baktrer'
    | 'skyter'
    | 'dahe'
    | 'elefant'
    | 'inder'
    | 'indrytter'
    // hærførere
    | 'aleksander'
    | 'parmenion'
    | 'mazaios'
    | 'oxyartes'
    | 'poros'
    // bare på fiendens side
    | 'dareios';

export type LeaderId = 'aleksander' | 'parmenion' | 'mazaios' | 'oxyartes' | 'poros';
export type ItemId = 'bukefalos' | 'gordion' | 'sletta' | 'iliaden' | 'skjoldet' | 'persepolis';
export type Terrain = 'slette' | 'elv' | 'smalt' | 'jevnet' | 'hoyde' | 'steppe';
export type ChallengeId = 'ingen' | 'uten-ryttere' | 'ingen-omrulling' | 'mange-folk';
export type Phase = 'plan' | 'slag' | 'belonning' | 'slutt';
export type Cause = 'piker' | 'skutt' | 'ridd-ned' | 'vogner' | 'omringet' | 'for-fa';

export interface UnitDef {
    name: string;
    folk: Folk;
    klasse: Klasse;
    cost: number;
    hp: number;
    dps: number;
    range: number;
    speed: number;
    /** Støtskade første gang enheten når fienden i fart. */
    charge: number;
    /** Piker/spyd: skade mot ryttere, vogner og elefanter som kommer forfra. */
    pike?: number;
    /** Skyter på avstand når den ikke er i nærkamp (udødelige, agrianere). */
    volley?: number;
    /** Holder avstand til nærkampenheter (hesteskyttere). */
    kite?: boolean;
    hero?: boolean;
    /** Kort forklaring på kortet (ett grep). */
    hint: string;
    /** Lærings-øyeblikket første gang enheten står på slagmarken. */
    lesson: string;
}

export const UNITS: Record<Kind, UnitDef> = {
    falanks: {
        name: 'Falanks',
        folk: 'makedonere',
        klasse: 'tung',
        cost: 3,
        hp: 150,
        dps: 9,
        range: 1.7,
        speed: 1.3,
        charge: 0,
        pike: 3,
        hint: 'Sarissa: stopper ryttere forfra',
        lesson: 'Falanksen: 256 mann i tett firkant med sarissa, et spyd på over fem meter. Forfra kommer ingen hest gjennom. Fra siden er den hjelpeløs.',
    },
    hypaspist: {
        name: 'Hypaspister',
        folk: 'makedonere',
        klasse: 'lett',
        cost: 2,
        hp: 95,
        dps: 10,
        range: 1.2,
        speed: 2.2,
        charge: 0,
        hint: 'Rask. Åpner rekkene for vogner',
        lesson: 'Hypaspistene: Aleksanders lette elitefotfolk. De bandt falanksen sammen med rytterne og løp dit det brant.',
    },
    hetairoi: {
        name: 'Hetairoi',
        folk: 'makedonere',
        klasse: 'kav',
        cost: 4,
        hp: 120,
        dps: 13,
        range: 1.2,
        speed: 5,
        charge: 45,
        hint: 'Tunge ryttere. Knuser skyttere',
        lesson: 'Hetairoi betyr «følgesvennene»: kongens egne ryttere. De red i kile, med Aleksander fremst.',
    },
    hoplitt: {
        name: 'Hoplitter',
        folk: 'grekere',
        klasse: 'tung',
        cost: 2,
        hp: 125,
        dps: 9,
        range: 1.4,
        speed: 1.4,
        charge: 0,
        pike: 2,
        hint: 'Billig skjoldvegg med spyd',
        lesson: 'Hoplittene: greske borgere med rundt skjold og kort spyd. Mange av dem kjempet som leiesoldater - også for Persia.',
    },
    kreter: {
        name: 'Kretiske bueskyttere',
        folk: 'grekere',
        klasse: 'skytter',
        cost: 2,
        hp: 50,
        dps: 8,
        range: 9,
        speed: 1.8,
        charge: 0,
        hint: 'Skyter tung infanteri. Svak mot ryttere',
        lesson: 'Kreta var kjent for de beste bueskytterne i Hellas. Mot treg, tung infanteri er piler dødelige - mot ryttere som kommer i fart, rekker de ikke å skyte mange.',
    },
    tessaler: {
        name: 'Tessalske ryttere',
        folk: 'grekere',
        klasse: 'kav',
        cost: 3,
        hp: 100,
        dps: 10,
        range: 1.2,
        speed: 4.8,
        charge: 30,
        hint: 'Ryttere. Holder venstre flanke',
        lesson: 'Tessalia hadde slettene og hestene. Ved Gaugamela holdt de tessalske rytterne venstre flanke mens Aleksander slo til på høyre.',
    },
    agrianer: {
        name: 'Agrianere',
        folk: 'thrakere',
        klasse: 'lett',
        cost: 2,
        hp: 60,
        dps: 7,
        range: 1.2,
        speed: 2.6,
        charge: 0,
        volley: 7,
        hint: 'Spydkastere. Stikker elefanter og vogner',
        lesson: 'Agrianerne var fjellfolk fra Thrakia med kastespyd. De hoppet til side for ljåvognene og stakk kusken ned.',
    },
    udodelig: {
        name: 'De udødelige',
        folk: 'persere',
        klasse: 'tung',
        cost: 4,
        hp: 150,
        dps: 10,
        range: 1.3,
        speed: 1.5,
        charge: 0,
        pike: 2,
        volley: 4,
        hint: 'Garde med spyd og bue',
        lesson: 'De udødelige: storkongens garde på 10 000. Falt én, tok en ny plassen - derfor navnet. De hadde både spyd og bue.',
    },
    kardak: {
        name: 'Kardaker',
        folk: 'persere',
        klasse: 'lett',
        cost: 2,
        hp: 95,
        dps: 10,
        range: 1.2,
        speed: 2.3,
        charge: 0,
        hint: 'Lett persisk fotfolk',
        lesson: 'Kardakene var persiske lettbevæpnede soldater, trent for å møte hoplittene.',
    },
    asp: {
        name: 'Persiske ryttere',
        folk: 'persere',
        klasse: 'kav',
        cost: 3,
        hp: 105,
        dps: 10,
        range: 1.2,
        speed: 4.6,
        charge: 30,
        hint: 'Satrapenes ryttere. Knuser skyttere',
        lesson: 'Rytterne var Persias stolthet - adelsmenn fra hver satrapi. Ved Granikos sto de langs elvebredden og ventet.',
    },
    bue: {
        name: 'Persiske bueskyttere',
        folk: 'persere',
        klasse: 'skytter',
        cost: 1,
        hp: 40,
        dps: 6,
        range: 9.5,
        speed: 1.6,
        charge: 0,
        hint: 'Billig pilregn',
        lesson: 'Persia vant sine kriger med piler. Tusenvis av bueskyttere bak en vegg av flettede skjold kunne mørklegge sola.',
    },
    slynge: {
        name: 'Slyngekastere',
        folk: 'persere',
        klasse: 'skytter',
        cost: 2,
        hp: 45,
        dps: 7,
        range: 10.5,
        speed: 1.8,
        charge: 0,
        hint: 'Blykuler. Knuser tung infanteri',
        lesson: 'En slynge kastet blykuler lenger enn en bue skjøt. Mot tunge soldater i tette rekker var de fryktet.',
    },
    vogn: {
        name: 'Ljåvogner',
        folk: 'persere',
        klasse: 'vogn',
        cost: 3,
        hp: 110,
        dps: 3,
        range: 1.3,
        speed: 7,
        charge: 90,
        hint: 'Enormt støt. Ubrukelig mot lett infanteri',
        lesson: 'Ljåvognene hadde kniver på hjulene. Dareios lot jevne ut sletta ved Gaugamela for dem. Men Aleksanders lette soldater åpnet rekkene, lot vognene kjøre gjennom, og stakk kuskene.',
    },
    baktrer: {
        name: 'Baktriske ryttere',
        folk: 'steppefolk',
        klasse: 'kav',
        cost: 4,
        hp: 145,
        dps: 12,
        range: 1.2,
        speed: 4.5,
        charge: 40,
        hint: 'Pansrede ryttere fra øst',
        lesson: 'Baktria (dagens Afghanistan) sendte de tyngste rytterne i Persias hær. Ved Gaugamela var de nær ved å knuse Aleksanders høyre fløy.',
    },
    skyter: {
        name: 'Skytiske hesteskyttere',
        folk: 'steppefolk',
        klasse: 'kav',
        cost: 3,
        hp: 105,
        dps: 12,
        range: 7.5,
        speed: 5.5,
        charge: 0,
        kite: true,
        hint: 'Skyter fra hesteryggen og rir unna',
        lesson: 'Skyterne fra steppa skjøt fra hesteryggen og red unna før fotfolket nådde dem. Ved Jaxartes lokket Aleksander dem inn mellom lette tropper og ryttere.',
    },
    dahe: {
        name: 'Daher',
        folk: 'steppefolk',
        klasse: 'kav',
        cost: 2,
        hp: 85,
        dps: 8.5,
        range: 7,
        speed: 5.5,
        charge: 0,
        kite: true,
        hint: 'Billige hesteskyttere',
        lesson: 'Daherne var nomader øst for Det kaspiske hav. Aleksander tok dem inn i hæren, og ved Hydaspes red de først over elva.',
    },
    elefant: {
        name: 'Krigselefant',
        folk: 'indere',
        klasse: 'elefant',
        cost: 5,
        hp: 260,
        dps: 14,
        range: 1.7,
        speed: 1.9,
        charge: 55,
        hint: 'Hester skyr den. Lett infanteri stikker den',
        lesson: 'Hester hadde aldri sett elefanter og nektet å gå mot dem. Ved Hydaspes måtte Aleksanders fotfolk stikke dem i beina. Såret elefant tråkker ned alle - også sine egne.',
    },
    inder: {
        name: 'Indiske langbuer',
        folk: 'indere',
        klasse: 'skytter',
        cost: 2,
        hp: 50,
        dps: 8,
        range: 10,
        speed: 1.6,
        charge: 0,
        hint: 'Menneskehøye buer',
        lesson: 'Indiske bueskyttere hadde buer like høye som seg selv. Ved Hydaspes gjorde regnet bakken så glatt at de ikke fikk støttet buen.',
    },
    indrytter: {
        name: 'Indiske ryttere',
        folk: 'indere',
        klasse: 'kav',
        cost: 2,
        hp: 80,
        dps: 8,
        range: 1.2,
        speed: 4.6,
        charge: 20,
        hint: 'Billige, raske ryttere',
        lesson: 'Poros hadde ryttere, men de var lette. Mot hetairoi holdt de ikke.',
    },
    aleksander: {
        name: 'Aleksander',
        folk: 'makedonere',
        klasse: 'kav',
        cost: 0,
        hp: 240,
        dps: 18,
        range: 1.2,
        speed: 5.2,
        charge: 60,
        hero: true,
        hint: 'Kilen! Venter til ambolten holder',
        lesson: 'Aleksander red selv fremst i kilen. Han ventet til fienden var bundet av falanksen, så slo han til der linja åpnet seg.',
    },
    parmenion: {
        name: 'Parmenion',
        folk: 'makedonere',
        klasse: 'tung',
        cost: 0,
        hp: 220,
        dps: 11,
        range: 1.6,
        speed: 1.4,
        charge: 0,
        pike: 2,
        hero: true,
        hint: 'Hold linjen! Fotfolket tåler alt',
        lesson: 'Parmenion var Filips gamle general. I slagene holdt han venstre fløy - ambolten - mens Aleksander var hammeren.',
    },
    mazaios: {
        name: 'Mazaios',
        folk: 'persere',
        klasse: 'kav',
        cost: 0,
        hp: 230,
        dps: 15,
        range: 1.2,
        speed: 4.6,
        charge: 35,
        hero: true,
        hint: 'Pilregn! Skytterne skyter dobbelt',
        lesson: 'Mazaios ledet perserne mot Aleksander ved Gaugamela. Etterpå ga han Babylon til Aleksander og ble satrap der - en perser i Aleksanders tjeneste.',
    },
    oxyartes: {
        name: 'Oxyartes',
        folk: 'steppefolk',
        klasse: 'kav',
        cost: 0,
        hp: 230,
        dps: 15,
        range: 1.2,
        speed: 5,
        charge: 40,
        hero: true,
        hint: 'Skinnflukt! Rytterne snur og støter igjen',
        lesson: 'Oxyartes var en baktrisk fyrste som kjempet mot Aleksander. Så giftet Aleksander seg med datteren hans, Roxane, og Oxyartes ble hans mann.',
    },
    poros: {
        name: 'Poros',
        folk: 'indere',
        klasse: 'elefant',
        cost: 0,
        hp: 260,
        dps: 14,
        range: 1.7,
        speed: 1.9,
        charge: 60,
        hero: true,
        hint: 'Elefantstorm! Elefantene stormer på nytt',
        lesson: '«Behandle meg som en konge», sa Poros etter Hydaspes. Aleksander lot ham beholde riket sitt og gjorde ham til alliert.',
    },
    dareios: {
        name: 'Dareios 3.',
        folk: 'persere',
        klasse: 'vogn',
        cost: 6,
        hp: 150,
        dps: 4,
        range: 1.3,
        speed: 0,
        charge: 0,
        hero: true,
        hint: 'Storkongen',
        lesson: 'Dareios styrte fra stridsvognen sin midt i hæren. Da Aleksanders kile kom mot ham, snudde han og flyktet - både ved Issos og Gaugamela. Da ga hæren opp.',
    },
};

export interface LeaderDef {
    name: string;
    folk: Folk[];
    evne: string;
    text: string;
    unlock: string;
}

export const LEADERS: Record<LeaderId, LeaderDef> = {
    aleksander: {
        name: 'Aleksander',
        folk: ['makedonere', 'grekere', 'thrakere'],
        evne: 'Kilen!',
        text: 'Rir mot storkongen med rytterne. Dobbelt støt hvis fienden er bundet av fotfolket.',
        unlock: 'Fra start',
    },
    parmenion: {
        name: 'Parmenion',
        folk: ['makedonere', 'grekere', 'thrakere'],
        evne: 'Hold linjen!',
        text: 'Fotfolket tar nesten ingen skade i fem sekunder.',
        unlock: 'Fullfør ett felttog',
    },
    mazaios: {
        name: 'Mazaios',
        folk: ['persere', 'grekere'],
        evne: 'Pilregn!',
        text: 'Alle skyttere skyter to og en halv gang så fort i fem sekunder.',
        unlock: 'Vinn ved Gaugamela',
    },
    oxyartes: {
        name: 'Oxyartes',
        folk: ['steppefolk', 'persere'],
        evne: 'Skinnflukt!',
        text: 'Rytterne later som de flykter - så snur de, og hesteskytterne skyter over skulderen.',
        unlock: 'Vinn ved Jaxartes',
    },
    poros: {
        name: 'Poros',
        folk: ['indere', 'persere'],
        evne: 'Elefantstorm!',
        text: 'Elefantene stormer på nytt og leges litt.',
        unlock: 'Vinn ved Hydaspes',
    },
};

export const ITEMS: Record<ItemId, { name: string; text: string; lesson: string }> = {
    bukefalos: {
        name: 'Bukefalos',
        text: 'Hærføreren: +60 % liv og dobbel evne',
        lesson: 'Bukefalos var Aleksanders hest. Som gutt temmet han den ved å snu den mot sola, så den ikke så sin egen skygge.',
    },
    gordion: {
        name: 'Gordion-knuten',
        text: '+1 plass på slagmarken',
        lesson: 'Den som løste knuten i Gordion, skulle herske over Asia. Aleksander hogg den over med sverdet.',
    },
    sletta: {
        name: 'Den jevnede sletta',
        text: 'Vogner og ryttere: +40 % støt',
        lesson: 'Dareios lot jevne ut sletta ved Gaugamela så ljåvognene skulle få fart.',
    },
    iliaden: {
        name: 'Iliaden under puta',
        text: 'Alle enheter: +12 % skade',
        lesson: 'Aleksander sov med Homers Iliade under puta - en utgave Aristoteles hadde skrevet kommentarer i.',
    },
    skjoldet: {
        name: 'Skjoldet fra Troja',
        text: 'Fremre rekke: +20 % liv',
        lesson: 'I Ilion (Troja) tok Aleksander et gammelt skjold fra templet. Det ble båret foran ham i slagene.',
    },
    persepolis: {
        name: 'Skattkammeret i Persepolis',
        text: '+12 gull nå, og rentetaket øker med 2',
        lesson: 'I Persepolis fant Aleksander storkongens skatt. Det sies at det trengtes tusenvis av muldyr og kameler for å frakte den.',
    },
};

export const CHALLENGES: Record<ChallengeId, { title: string; text: string; mult: number }> = {
    ingen: { title: 'Vanlig felttog', text: '', mult: 1 },
    'uten-ryttere': { title: 'Uten ryttere', text: 'Ingen ryttere i butikken.', mult: 1.5 },
    'ingen-omrulling': { title: 'Ingen omrulling', text: 'Butikken kan ikke rulles om.', mult: 1.3 },
    'mange-folk': { title: 'Mange folk', text: 'Minst tre folk på slagmarken, ellers går du ikke til slag.', mult: 1.4 },
};

export const FOLK_NAME: Record<Folk, string> = {
    makedonere: 'Makedonere',
    grekere: 'Grekere',
    thrakere: 'Thrakere',
    persere: 'Persere',
    steppefolk: 'Steppefolk',
    indere: 'Indere',
};

export const TERRAIN: Record<Terrain, { name: string; text: string }> = {
    slette: { name: 'Slette', text: 'Åpen mark. Ingen fordeler.' },
    elv: { name: 'Elv', text: 'Ingen fart over vannet: alle støt er svake.' },
    smalt: { name: 'Smalt pass', text: 'Fjell og hav: flankene er stengt.' },
    jevnet: { name: 'Jevnet slette', text: 'Ljåvognene får full fart.' },
    hoyde: { name: 'Høyde', text: 'Fiendens skyttere står høyt og når lenger.' },
    steppe: { name: 'Steppe', text: 'Ryttere får ekstra fart.' },
};

interface BattleDef {
    name: string;
    year: string;
    terrain: Terrain;
    pool: Kind[];
    /** Temaet: enhetene slaget handler om. Får en fast del av budsjettet. */
    theme: Kind[];
    budget: number;
    commander?: Kind;
    maxUnits: number;
    /** Fast hær for læringsslagene: [enhet, rekke, kolonne]. */
    fixed?: [Kind, number, number][];
    text: string;
}

export const BATTLE_DEFS: BattleDef[] = [
    {
        name: 'Khaironeia',
        year: '338 fvt',
        terrain: 'slette',
        theme: ['hoplitt'],
        pool: ['hoplitt', 'agrianer'],
        budget: 4,
        fixed: [['agrianer', 0, 1], ['agrianer', 0, 3]],
        maxUnits: 5,
        text: 'Athen, Theben og deres lette hjelpetropper. 18 år gamle Aleksander leder rytterne.',
    },
    {
        name: 'Pelion',
        year: '335 fvt',
        terrain: 'slette',
        theme: ['agrianer', 'kreter'],
        pool: ['hoplitt', 'hoplitt', 'agrianer'],
        budget: 7,
        fixed: [['agrianer', 0, 2], ['kreter', 1, 1], ['kreter', 1, 3]],
        maxUnits: 6,
        text: 'Illyriske fjellfolk med kastespyd og buer.',
    },
    {
        name: 'Granikos',
        year: '334 fvt',
        terrain: 'elv',
        theme: ['asp'],
        pool: ['hoplitt', 'hoplitt', 'bue'],
        budget: 9,
        fixed: [['asp', 0, 0], ['asp', 0, 4], ['hoplitt', 0, 2], ['bue', 1, 2]],
        maxUnits: 6,
        text: 'Persiske ryttere langs elvebredden, greske leiesoldater bak.',
    },
    {
        name: 'Issos',
        year: '333 fvt',
        terrain: 'smalt',
        theme: ['udodelig', 'hoplitt'],
        pool: ['kardak', 'bue', 'asp'],
        budget: 12,
        commander: 'dareios',
        maxUnits: 7,
        text: 'Mellom fjellet og havet. Storkongen er selv med.',
    },
    {
        name: 'Gaugamela',
        year: '331 fvt',
        terrain: 'jevnet',
        theme: ['vogn'],
        pool: ['udodelig', 'baktrer', 'bue', 'kardak', 'elefant'],
        budget: 14,
        commander: 'dareios',
        maxUnits: 9,
        text: 'Verdens største hær. Sletta er jevnet for ljåvognene.',
    },
    {
        name: 'De persiske porter',
        year: '330 fvt',
        terrain: 'hoyde',
        theme: ['bue', 'slynge'],
        pool: ['udodelig', 'udodelig', 'hoplitt', 'kardak'],
        budget: 16,
        maxUnits: 8,
        text: 'Perserne holder passet fra høyden.',
    },
    {
        name: 'Jaxartes',
        year: '329 fvt',
        terrain: 'steppe',
        theme: ['skyter', 'dahe'],
        pool: ['baktrer', 'kardak', 'udodelig'],
        budget: 18,
        maxUnits: 8,
        text: 'Skyterne fra steppa skyter fra hesteryggen.',
    },
    {
        name: 'Hydaspes',
        year: '326 fvt',
        terrain: 'elv',
        theme: ['elefant'],
        pool: ['inder', 'vogn', 'indrytter', 'kardak'],
        budget: 20,
        commander: 'poros',
        maxUnits: 9,
        text: 'Monsunregn, en elv og kong Poros med elefantene.',
    },
];

// ---------------------------------------------------------------------------
// Tilstand
// ---------------------------------------------------------------------------

export interface Card {
    kind?: Kind;
    item?: ItemId;
    cost: number;
    sold?: boolean;
    /** Speiderens kort: svarer på temaet i neste slag. */
    scout?: boolean;
    /** Klassen er ny i butikken i dette slaget. */
    nytt?: boolean;
}

/** En enhet eleven eier (på brettet eller benken). */
export interface Unit {
    uid: number;
    kind: Kind;
    star: number;
}

/** Plass: brettet (rad 0 = fremre, 1 = bakre; kol 0-4) eller benken. */
export type Loc = { at: 'board'; row: number; col: number } | { at: 'bench'; i: number };

/** En enhet i slaget. */
export interface Squad {
    id: number;
    side: 0 | 1;
    kind: Kind;
    star: number;
    uid: number;
    x: number;
    z: number;
    hx: number;
    hz: number;
    hp: number;
    max: number;
    dps: number;
    range: number;
    speed: number;
    charge: number;
    charged: boolean;
    moving: number;
    target: number;
    retarget: number;
    engaged: number;
    dead: boolean;
    fled: boolean;
    row: number;
    col: number;
    /** 0-1 retning (enhetsvektor) enheten ser. */
    fx: number;
    fz: number;
    buffT: number;
    buffKind: '' | 'kile' | 'hold' | 'pil' | 'flukt' | 'storm';
    panic: number;
    rampage: boolean;
    /** Vogn som kjører gjennom rekkene etter et støt (sekunder igjen). */
    pass: number;
    hitT: number;
    kills: number;
}

export type GameEvent =
    | { type: 'kjop'; kind: Kind }
    | { type: 'smelt'; kind: Kind; star: number; loc: Loc }
    | { type: 'slag-start' }
    | { type: 'stot'; x: number; z: number; big: boolean; bounce: boolean; side: 0 | 1 }
    | { type: 'dod'; id: number; x: number; z: number; dx: number; dz: number; side: 0 | 1; kind: Kind }
    | { type: 'skudd'; from: number; to: number; kind: Kind }
    | { type: 'evne'; leader: LeaderId; x: number; z: number }
    | { type: 'kile-treff'; x: number; z: number }
    | { type: 'storkonge-flykter'; x: number; z: number }
    | { type: 'elefant-raser'; x: number; z: number }
    | { type: 'parthisk'; id: number; x: number; z: number }
    | { type: 'slag-slutt'; won: boolean }
    | { type: 'gjenstand'; item: ItemId };

export interface Sfx {
    buy: () => void;
    sell: () => void;
    merge: () => void;
    reroll: () => void;
    drum: () => void;
    clash: () => void;
    arrow: () => void;
    charge: () => void;
    die: () => void;
    horn: () => void;
    win: () => void;
    lose: () => void;
    coin: () => void;
}

export interface IO {
    sfx: Sfx;
    banner: (t: string, color?: string) => void;
    lesson: (key: string, t: string) => void;
    float: (t: string, x: number, z: number, color?: string, big?: boolean) => void;
    event: (e: GameEvent) => void;
    lose: (c: Cause) => void;
    win: () => void;
}

export interface RewardOption {
    kind?: Kind;
    item?: ItemId;
    gold?: number;
}

export interface BattleStats {
    won: boolean;
    time: number;
    survivors: number;
    overkill: number;
    points: number;
    taken: Record<Cause, number>;
    crushed?: boolean;
}

export interface G {
    seed: number;
    rng: () => number;
    leader: LeaderId;
    challenge: ChallengeId;
    phase: Phase;
    phaseT: number;
    t: number;
    round: number; // 0-basert slagnummer
    lives: number;
    gold: number;
    interestCap: number;
    shop: Card[];
    board: (Unit | null)[][]; // [rad][kol]
    bench: (Unit | null)[];
    items: ItemId[];
    pool: Set<Folk>;
    uid: number;
    enemy: Unit[][]; // [rad][kol], samme rutenett som brettet, speilet
    enemyCommander: Kind | null;
    squads: Squad[];
    battleT: number;
    abilityUsed: boolean;
    abilityReady: boolean;
    reward: RewardOption[] | null;
    last: BattleStats | null;
    history: BattleStats[];
    score: number;
    valg: number;
    kills: number;
    seen: Set<Kind>;
    finds: Set<ItemId>;
    unlocked: Set<LeaderId>;
    ended: '' | 'vunnet' | 'tapt';
    /** Forhåndsslag (robotenes lesing): slaget spilles, men ingenting annet endres. */
    preview?: boolean;
    cause: Cause;
    shake: number;
    hitstop: number;
    slowmo: number;
    /** Øker når brettet eller benken endres (visningen tegner på nytt). */
    boardV: number;
    taken: Record<Cause, number>;
    interestLast: number;
}

// ---------------------------------------------------------------------------
// Hjelpere
// ---------------------------------------------------------------------------

export function dailySeed(d = new Date()) {
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function mulberry(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const pick = <T,>(rng: () => number, xs: T[]): T => xs[Math.floor(rng() * xs.length)];

export const battleDef = (g: G) => BATTLE_DEFS[Math.min(g.round, BATTLES - 1)];
export const terrain = (g: G) => battleDef(g).terrain;

/** Kolonnen er stengt (smalt pass). */
export function colClosed(g: G, col: number) {
    return terrain(g) === 'smalt' && (col === 0 || col === 4);
}

/**
 * Opptrappingen - spillet er sin egen tutorial. Hvert slag åpner én ny klasse i butikken,
 * med få kort og få plasser i starten, og fienden i de tre første slagene er satt opp for
 * å vise nettopp den regelen eleven lærer.
 */
export interface Step {
    klasser: Klasse[];
    kort: number;
    plasser: number;
    omrulling: boolean;
    /** Det nye i dette slaget (lærings-øyeblikket når slaget åpner). */
    nytt?: { tittel: string; tekst: string };
}

const K1: Klasse[] = ['tung', 'kav'];
const K2: Klasse[] = [...K1, 'skytter'];
const K3: Klasse[] = [...K2, 'lett'];
const K4: Klasse[] = [...K3, 'vogn', 'elefant'];

export const LADDER: Step[] = [
    {
        klasser: K1,
        kort: 2,
        plasser: 2,
        omrulling: false,
        nytt: {
            tittel: 'Ambolt og hammer',
            tekst: 'Sett fotfolket foran - det er ambolten som holder fienden fast. Rytterne på flanken er hammeren som slår inn fra siden.',
        },
    },
    {
        klasser: K2,
        kort: 3,
        plasser: 3,
        omrulling: true,
        nytt: {
            tittel: 'Ryttere mot skyttere',
            tekst: 'Illyrerne har skyttere bak en tynn linje. Skyttere dør fort når ryttere når dem - send rytterne dit. Nytt i butikken: skyttere.',
        },
    },
    {
        klasser: K3,
        kort: 3,
        plasser: 4,
        omrulling: true,
        nytt: {
            tittel: 'Piker mot ryttere',
            tekst: 'Perserne kommer med ryttere. Piker og spyd forfra stopper hester - still dem opp rett foran rytterne. Nytt i butikken: lett infanteri.',
        },
    },
    {
        klasser: K4,
        kort: 4,
        plasser: 5,
        omrulling: true,
        nytt: {
            tittel: 'En vegg av fotfolk',
            tekst: 'Ved Issos står tungt fotfolk skulder ved skulder. Skyttere bak din egen linje river veggen før den når fram. Nytt i butikken: vogner og elefanter.',
        },
    },
    {
        klasser: K4,
        kort: 5,
        plasser: 6,
        omrulling: true,
        nytt: {
            tittel: 'Fienden leser deg',
            tekst: 'Fra nå bygger fienden motsvar mot det du har mest av. En blandet hær er vanskeligere å slå.',
        },
    },
    { klasser: K4, kort: 5, plasser: 7, omrulling: true },
    { klasser: K4, kort: 5, plasser: 8, omrulling: true },
    { klasser: K4, kort: 5, plasser: 8, omrulling: true },
];

export const step = (g: G) => LADDER[Math.min(g.round, LADDER.length - 1)];

export function boardCap(g: G) {
    return step(g).plasser + (g.items.includes('gordion') ? 1 : 0);
}

export function boardUnits(g: G): { u: Unit; row: number; col: number }[] {
    const out: { u: Unit; row: number; col: number }[] = [];
    for (let r = 0; r < 2; r++)
        for (let c = 0; c < COLS; c++) {
            const u = g.board[r][c];
            if (u) out.push({ u, row: r, col: c });
        }
    return out;
}

/** Antall enheter på brettet som teller mot taket (hærføreren teller ikke). */
export function boardCount(g: G) {
    return boardUnits(g).filter((b) => !UNITS[b.u.kind].hero).length;
}

export function unitAt(g: G, loc: Loc): Unit | null {
    return loc.at === 'board' ? g.board[loc.row]?.[loc.col] ?? null : g.bench[loc.i] ?? null;
}

function setAt(g: G, loc: Loc, u: Unit | null) {
    if (loc.at === 'board') g.board[loc.row][loc.col] = u;
    else g.bench[loc.i] = u;
}

export function sellValue(u: Unit) {
    return UNITS[u.kind].cost * Math.pow(3, u.star - 1);
}

export function interest(g: G) {
    return Math.min(g.interestCap, Math.floor(g.gold / 5));
}

// ---------------------------------------------------------------------------
// Samspill (synergier)
// ---------------------------------------------------------------------------

export interface Synergy {
    id: string;
    name: string;
    text: string;
    count: number;
    need: number[];
    level: number; // 0 = ikke aktiv
}

export const SYN_DEF: { id: string; name: string; need: number[]; text: string[] }[] = [
    { id: 'makedonere', name: 'Makedonere', need: [2, 4], text: ['+15 % liv', '+30 % liv, +15 % skade'] },
    { id: 'grekere', name: 'Grekere', need: [2, 4], text: ['+1 gull per runde', '+2 gull, +25 % skade'] },
    { id: 'persere', name: 'Persere', need: [2, 4], text: ['Skyttere +35 %, persere +10 % liv', 'Skyttere +70 %, persere +25 % liv'] },
    { id: 'steppefolk', name: 'Steppefolk', need: [2, 3], text: ['+20 % liv, fart og støt', '+35 % skade'] },
    { id: 'indere', name: 'Indere', need: [2, 3], text: ['Elefanter +25 % liv', 'Elefanter tråkker ikke egne, +20 % skade'] },
    { id: 'thrakere', name: 'Thrakere', need: [2], text: ['Kastespyd +50 %'] },
    { id: 'sarissaskog', name: 'Sarissaskog', need: [2], text: ['To piker side om side i fremre rekke: +30 % skade, +20 % liv'] },
    { id: 'kile', name: 'Kile', need: [2], text: ['To ryttere på samme flanke: støtet x1,6'] },
    { id: 'pilsverm', name: 'Pilsverm', need: [3], text: ['Tre skyttere i bakre rekke: +35 % fart'] },
    { id: 'hellenisme', name: 'Hellenisme', need: [3, 4, 5], text: ['3 folk: +10 %', '4 folk: +20 %', '5 folk: +30 %'] },
];

type Grid = (Unit | null)[][];

function gridSynergies(grid: Grid): Synergy[] {
    const units: { u: Unit; row: number; col: number }[] = [];
    for (let r = 0; r < 2; r++)
        for (let c = 0; c < COLS; c++) {
            const u = grid[r][c];
            if (u) units.push({ u, row: r, col: c });
        }
    const folkCount: Record<string, number> = {};
    for (const { u } of units) {
        const f = UNITS[u.kind].folk;
        folkCount[f] = (folkCount[f] ?? 0) + 1;
    }
    // Sarissaskog: to piker (falanks eller hoplitt/udødelig/parmenion) ved siden av hverandre i fremre rekke.
    let skog = 0;
    for (let c = 0; c < COLS - 1; c++) {
        const a = grid[0][c];
        const b = grid[0][c + 1];
        if (a && b && UNITS[a.kind].pike && UNITS[b.kind].pike) skog = Math.max(skog, 2);
    }
    let kile = 0;
    for (const c of [0, 4]) {
        let n = 0;
        for (let r = 0; r < 2; r++) {
            const u = grid[r][c];
            if (u && UNITS[u.kind].klasse === 'kav') n++;
        }
        kile = Math.max(kile, n);
    }
    let sverm = 0;
    for (let c = 0; c < COLS; c++) {
        const u = grid[1][c];
        if (u && UNITS[u.kind].klasse === 'skytter') sverm++;
    }
    const folks = Object.keys(folkCount).length;
    const counts: Record<string, number> = {
        ...folkCount,
        sarissaskog: skog,
        kile,
        pilsverm: sverm,
        hellenisme: folks,
    };
    return SYN_DEF.map((d, i) => {
        const count = counts[d.id] ?? 0;
        let level = 0;
        d.need.forEach((n, k) => {
            if (count >= n) level = k + 1;
        });
        return {
            id: d.id,
            name: d.name,
            text: level ? d.text[level - 1] : d.text[0],
            count,
            need: SYN_DEF[i].need,
            level,
        };
    });
}

export function synergies(g: G): Synergy[] {
    return gridSynergies(g.board);
}

const lvl = (s: Synergy[], id: string) => s.find((x) => x.id === id)?.level ?? 0;

// ---------------------------------------------------------------------------
// Nytt spill, butikk, fiende
// ---------------------------------------------------------------------------

export function newGame(
    seed: number,
    leader: LeaderId = 'aleksander',
    challenge: ChallengeId = 'ingen',
    unlocked: LeaderId[] = ['aleksander']
): G {
    const rng = mulberry(seed);
    const g: G = {
        seed,
        rng,
        leader,
        challenge,
        phase: 'plan',
        phaseT: FIRST_PLAN,
        t: 0,
        round: 0,
        lives: LIVES,
        gold: 9,
        interestCap: 3,
        shop: [],
        board: [Array(COLS).fill(null), Array(COLS).fill(null)],
        bench: Array(BENCH).fill(null),
        items: [],
        pool: new Set(LEADERS[leader].folk),
        uid: 1,
        enemy: [],
        enemyCommander: null,
        squads: [],
        battleT: 0,
        abilityUsed: false,
        abilityReady: false,
        reward: null,
        last: null,
        history: [],
        score: 0,
        valg: 0,
        kills: 0,
        seen: new Set(),
        finds: new Set(),
        unlocked: new Set(unlocked),
        ended: '',
        cause: 'omringet',
        shake: 0,
        hitstop: 0,
        slowmo: 0,
        boardV: 0,
        taken: blankTaken(),
        interestLast: 0,
    };
    // Hærføreren står på venstre flanke (rytter) eller midt i fremre rekke (fotfolk/elefant).
    const hero: Unit = { uid: g.uid++, kind: leader, star: 1 };
    const k = UNITS[leader].klasse;
    if (k === 'kav') g.board[1][4] = hero;
    else g.board[0][2] = hero;
    rollShop(g);
    makeEnemy(g);
    g.valg += 2;
    return g;
}

function blankTaken(): Record<Cause, number> {
    return { piker: 0, skutt: 0, 'ridd-ned': 0, vogner: 0, omringet: 0, 'for-fa': 0 };
}

function shopPool(g: G): Kind[] {
    const out: Kind[] = [];
    for (const [k, d] of Object.entries(UNITS) as [Kind, UnitDef][]) {
        if (d.hero || !g.pool.has(d.folk)) continue;
        if (g.challenge === 'uten-ryttere' && d.klasse === 'kav') continue;
        if (!step(g).klasser.includes(d.klasse)) continue;
        out.push(k);
    }
    return out;
}

/** Sjansen for et kort med pris c i runde r: billig tidlig, dyrt senere. */
function costWeight(c: number, r: number) {
    const W = [
        [1, 1, 0.6, 0.25, 0.08],
        [1, 1, 0.8, 0.4, 0.15],
        [0.8, 1, 1, 0.6, 0.25],
        [0.6, 1, 1, 0.8, 0.4],
        [0.5, 0.9, 1, 1, 0.5],
        [0.4, 0.8, 1, 1, 0.6],
        [0.4, 0.8, 1, 1, 0.7],
    ];
    return W[Math.min(r, W.length - 1)][Math.max(0, Math.min(4, c - 1))];
}

export function rollShop(g: G) {
    const pool = shopPool(g);
    const shop: Card[] = [];
    for (let i = 0; i < step(g).kort; i++) {
        // Sjeldne ting: en historisk gjenstand, eller en enhet fra et folk du ikke har ennå.
        const r = g.rng();
        if (g.round >= 2 && r < 0.07) {
            const left = (Object.keys(ITEMS) as ItemId[]).filter((k) => !g.items.includes(k));
            if (left.length) {
                shop.push({ item: pick(g.rng, left), cost: 3 });
                continue;
            }
        }
        if (g.round >= 4 && r > 0.955) {
            const exotic = (Object.keys(UNITS) as Kind[]).filter(
                (k) => !UNITS[k].hero && !g.pool.has(UNITS[k].folk) && !(g.challenge === 'uten-ryttere' && UNITS[k].klasse === 'kav')
            );
            if (exotic.length) {
                const k = pick(g.rng, exotic);
                shop.push({ kind: k, cost: UNITS[k].cost + 1 });
                continue;
            }
        }
        const home = LEADERS[g.leader].folk[0];
        const wt = (k: Kind) => costWeight(UNITS[k].cost, g.round) * (UNITS[k].folk === home ? 2.2 : 1);
        let total = 0;
        for (const k of pool) total += wt(k);
        let x = g.rng() * total;
        let chosen = pool[0];
        for (const k of pool) {
            x -= wt(k);
            if (x <= 0) {
                chosen = k;
                break;
            }
        }
        shop.push({ kind: chosen, cost: UNITS[chosen].cost });
    }
    // Nytt-merket: klassen åpnet i dette slaget.
    const prev = g.round > 0 ? LADDER[Math.min(g.round - 1, LADDER.length - 1)].klasser : [];
    for (const c of shop) if (c.kind && !prev.includes(UNITS[c.kind].klasse)) c.nytt = true;
    // Speiderens kort: ett kort som svarer på temaet i neste slag, hvis butikken har et.
    const answers = themeAnswer(g).filter((k) => pool.includes(k));
    if (answers.length) {
        const k = pick(g.rng, answers);
        shop[0] = { kind: k, cost: UNITS[k].cost, scout: true, nytt: !prev.includes(UNITS[k].klasse) };
    }
    g.shop = shop;
}

/** Klassene som slår temaet i neste slag (det speideren anbefaler). */
export function themeAnswer(g: G): Kind[] {
    const def = battleDef(g);
    const kl = UNITS[def.theme[0]];
    let want: (d: UnitDef) => boolean;
    if (kl.klasse === 'vogn' || kl.klasse === 'elefant') want = (d) => d.klasse === 'lett';
    else if (kl.kite) want = (d) => d.klasse === 'lett' || d.klasse === 'skytter';
    else if (kl.klasse === 'skytter' && def.terrain === 'hoyde') want = (d) => d.klasse === 'lett';
    else if (kl.klasse === 'skytter' || kl.klasse === 'lett') want = (d) => d.klasse === 'kav' && !d.kite;
    else if (kl.klasse === 'kav') want = (d) => !!d.pike;
    else want = (d) => d.klasse === 'skytter';
    return (Object.keys(UNITS) as Kind[]).filter((k) => !UNITS[k].hero && want(UNITS[k]));
}

/** Summen av pris x stjerner for spillerens enheter per klasse. */
export function classWeights(grid: Grid): Record<Klasse, number> {
    const w: Record<Klasse, number> = { tung: 0, lett: 0, kav: 0, skytter: 0, vogn: 0, elefant: 0 };
    for (const row of grid)
        for (const u of row) {
            if (!u) continue;
            const d = UNITS[u.kind];
            // Hesteskyttere leses som skyttere: svaret på dem er ryttere, ikke elefanter.
            w[d.kite ? 'skytter' : d.klasse] += Math.max(2, d.cost) * Math.pow(STAR_MULT, u.star - 1);
        }
    return w;
}

/** Hva fienden kjøper for å slå det spilleren har mest av (fra slag 4). */
const COUNTER: Record<Klasse, Kind[]> = {
    kav: ['hoplitt', 'udodelig', 'elefant'],
    vogn: ['kardak', 'agrianer'],
    elefant: ['kardak', 'agrianer'],
    tung: ['slynge', 'bue', 'inder'],
    skytter: ['baktrer', 'asp', 'indrytter'],
    lett: ['baktrer', 'udodelig'],
};

/**
 * Balansen (avgjort i simuleringen, scripts/sim-microgame.mts):
 *   theme   - del av fiendens budsjett som går til slagets tema (vogner, elefanter ...)
 *   counter - del som går til motsvar mot det spilleren har mest av (fra Granikos)
 *   sharp   - forsterker motsvarene: riktig svar betyr mer enn rå pris
 *   wealth  - fienden er så rik som spilleren (enheter + gull) x (wealth + wealthGrow x runde)
 */
export const TUNE = { theme: 0.45, counter: 0.3, lane: 0, sharp: 2, wealth: 0.6, wealthGrow: 0.07 };
const THEME_SHARE_OF = () => TUNE.theme;

/** Hva spilleren eier: enheter (pris x 3^(stjerner-1)) pluss gull. */
export function playerWealth(g: G) {
    let v = g.gold;
    for (const row of g.board) for (const u of row) if (u && !UNITS[u.kind].hero) v += sellValue(u);
    for (const u of g.bench) if (u) v += sellValue(u);
    return v;
}

export function makeEnemy(g: G) {
    const THEME_SHARE = THEME_SHARE_OF();
    const def0 = battleDef(g);
    if (def0.fixed) {
        // Læringsslag: en fast hær som viser akkurat den regelen eleven skal lære nå.
        const grid: Unit[][] = [Array(COLS).fill(null), Array(COLS).fill(null)];
        for (const [k, r, c] of def0.fixed) grid[r][c] = { uid: 0, kind: k, star: 1 };
        g.enemy = grid;
        g.enemyCommander = def0.commander ?? null;
        return;
    }
    const COUNTER_SHARE = TUNE.counter;
    const def = battleDef(g);
    const rng = g.rng;
    // Fienden er like rik som deg (enheter + gull), med et lite tillegg per slag. Å bare
    // kjøpe mer gjør deg ikke sterkere enn fienden - det gjør motsvar og samspill.
    // De to første slagene er innlæring: fast, snill fiende.
    const wealth = TUNE.wealth > 0 && g.round >= 3 ? playerWealth(g) * (TUNE.wealth + TUNE.wealthGrow * g.round) : 0;
    let budget = Math.max(def.budget, Math.round(wealth));
    const full = budget;
    const picks: Kind[] = [];
    const spend = (share: number, from: Kind[]) => {
        let cb = Math.round(full * share);
        let guard = 0;
        while (cb > 0 && guard++ < 30) {
            const k = pick(rng, from);
            picks.push(k);
            cb -= UNITS[k].cost;
            budget -= UNITS[k].cost;
        }
    };
    // Temaet først: det slaget er kjent for (vognene ved Gaugamela, elefantene ved Hydaspes).
    spend(THEME_SHARE, def.theme);
    // Fra slag 5 leser fienden deg også: en del av budsjettet går til motsvar mot det du
    // har mest av.
    if (g.round >= 4) {
        const w = classWeights(g.board);
        const top = (Object.keys(w) as Klasse[]).sort((a, b) => w[b] - w[a])[0];
        if (w[top] > 0) spend(COUNTER_SHARE, COUNTER[top]);
    }
    let guard = 0;
    while (budget > 0 && guard++ < 50) {
        const k = pick(rng, def.pool);
        if (UNITS[k].cost > budget + 1) continue;
        picks.push(k);
        budget -= UNITS[k].cost;
    }
    // For mange enheter: slå like sammen til stjerner (samme verdi, færre ruter).
    const units: Unit[] = picks.map((k) => ({ uid: 0, kind: k, star: 1 }));
    const cap = def.maxUnits;
    let merged = true;
    while (units.length > cap && merged) {
        merged = false;
        const by: Record<string, number[]> = {};
        units.forEach((u, i) => {
            if (u.star >= 2) return; // fienden får høyst to stjerner
            const key = u.kind + u.star;
            (by[key] ??= []).push(i);
        });
        for (const idx of Object.values(by)) {
            if (idx.length >= 3) {
                const keep = units[idx[0]];
                keep.star += 1;
                units.splice(idx[2], 1);
                units.splice(idx[1], 1);
                merged = true;
                break;
            }
        }
    }
    while (units.length > cap) units.sort((a, b) => UNITS[a.kind].cost - UNITS[b.kind].cost).shift();
    const grid: Unit[][] = [Array(COLS).fill(null), Array(COLS).fill(null)];
    const closed = (c: number) => def.terrain === 'smalt' && (c === 0 || c === 4);
    const place = (u: Unit, prefs: [number, number][]) => {
        for (const [r, c] of prefs)
            if (!grid[r][c] && !closed(c)) {
                grid[r][c] = u;
                return true;
            }
        for (let r = 0; r < 2; r++)
            for (let c = 0; c < COLS; c++)
                if (!grid[r][c] && !closed(c)) {
                    grid[r][c] = u;
                    return true;
                }
        return false;
    };
    const FRONT: [number, number][] = [
        [0, 2],
        [0, 1],
        [0, 3],
        [0, 0],
        [0, 4],
    ];
    const BACK: [number, number][] = [
        [1, 2],
        [1, 1],
        [1, 3],
        [1, 0],
        [1, 4],
    ];
    const FLANK: [number, number][] = [
        [0, 0],
        [0, 4],
        [1, 0],
        [1, 4],
    ];
    const order: Klasse[] = ['tung', 'elefant', 'vogn', 'lett', 'kav', 'skytter'];
    units.sort((a, b) => order.indexOf(UNITS[a.kind].klasse) - order.indexOf(UNITS[b.kind].klasse));
    g.enemyCommander = def.commander ?? null;
    for (const u of units) {
        const k = UNITS[u.kind].klasse;
        const prefs = k === 'skytter' ? BACK : k === 'kav' ? [...FLANK, ...BACK] : FRONT;
        place(u, prefs);
    }
    g.enemy = grid;
}

// ---------------------------------------------------------------------------
// Planlegging: kjøp, flytt, selg, rull om
// ---------------------------------------------------------------------------

function firstFree(g: G): Loc | null {
    for (let i = 0; i < BENCH; i++) if (!g.bench[i]) return { at: 'bench', i };
    return null;
}

/** Tre like (samme type og stjerne) blir én med en stjerne til. */
function tryMerge(g: G, io: IO | null): boolean {
    const locs: { loc: Loc; u: Unit }[] = [];
    for (let r = 0; r < 2; r++)
        for (let c = 0; c < COLS; c++) {
            const u = g.board[r][c];
            if (u) locs.push({ loc: { at: 'board', row: r, col: c }, u });
        }
    for (let i = 0; i < g.bench.length; i++) {
        const u = g.bench[i];
        if (u) locs.push({ loc: { at: 'bench', i }, u });
    }
    const by: Record<string, { loc: Loc; u: Unit }[]> = {};
    for (const x of locs) {
        if (UNITS[x.u.kind].hero || x.u.star >= 3) continue;
        (by[x.u.kind + ':' + x.u.star] ??= []).push(x);
    }
    for (const group of Object.values(by)) {
        if (group.length < 3) continue;
        const three = group.slice(0, 3);
        const keep = three.find((x) => x.loc.at === 'board') ?? three[0];
        for (const x of three) if (x !== keep) setAt(g, x.loc, null);
        keep.u.star += 1;
        g.valg += 1;
        g.boardV++;
        if (io) {
            io.sfx.merge();
            io.event({ type: 'smelt', kind: keep.u.kind, star: keep.u.star, loc: keep.loc });
        }
        tryMerge(g, io);
        return true;
    }
    return false;
}

/** Kjøp kort i. Enheten går til `to` (brett eller benk) eller første ledige benkplass. */
export function buy(g: G, i: number, io: IO | null, to?: Loc): boolean {
    if (g.phase !== 'plan') return false;
    const card = g.shop[i];
    if (!card || card.sold || g.gold < card.cost) return false;
    if (card.item) {
        g.gold -= card.cost;
        card.sold = true;
        addItem(g, card.item, io);
        return true;
    }
    const kind = card.kind!;
    let dest: Loc | null = null;
    if (to && !unitAt(g, to) && canPlace(g, to, kind, true)) dest = to;
    // Slippes kortet på en rute der det står noen, tar det nye kortet plassen og den
    // gamle går til benken (hærføreren flyttes ikke).
    const occ = to && to.at === 'board' ? unitAt(g, to) : null;
    const benchFree = firstFree(g);
    if (!dest && occ && !UNITS[occ.kind].hero && benchFree && !colClosed(g, (to as { col: number }).col) && g.gold >= card.cost) {
        setAt(g, benchFree, occ);
        setAt(g, to!, null);
        dest = to!;
    }
    if (!dest) dest = firstFree(g);
    const u: Unit = { uid: g.uid++, kind, star: 1 };
    if (!dest) {
        // Full benk: kjøpet er bare lov om det gir en sammensmelting.
        const same = [...boardUnits(g).map((b) => b.u), ...g.bench].filter(
            (x) => x && x.kind === kind && x.star === 1
        );
        if (same.length < 2) return false;
        g.gold -= card.cost;
        card.sold = true;
        // Midlertidig sjette benkplass, så smelter de tre sammen.
        g.bench.push(u);
        tryMerge(g, io);
        g.bench = g.bench.slice(0, BENCH);
        g.boardV++;
        return true;
    }
    g.gold -= card.cost;
    card.sold = true;
    setAt(g, dest, u);
    g.boardV++;
    if (io) {
        io.sfx.buy();
        io.event({ type: 'kjop', kind });
    }
    tryMerge(g, io);
    return true;
}

export function canPlace(g: G, to: Loc, kind: Kind, fromOutside: boolean): boolean {
    if (to.at === 'bench') return !UNITS[kind].hero;
    if (to.row < 0 || to.row > 1 || to.col < 0 || to.col >= COLS) return false;
    if (colClosed(g, to.col)) return false;
    if (UNITS[kind].hero) return true;
    return !fromOutside || boardCount(g) < boardCap(g);
}

/** Flytt (eller bytt) mellom to plasser. */
export function move(g: G, from: Loc, to: Loc): boolean {
    if (g.phase !== 'plan') return false;
    const a = unitAt(g, from);
    if (!a) return false;
    const b = unitAt(g, to);
    if (from.at === to.at && JSON.stringify(from) === JSON.stringify(to)) return false;
    const intoBoard = to.at === 'board' && from.at === 'bench';
    if (to.at === 'board' && colClosed(g, to.col)) return false;
    if (to.at === 'bench' && UNITS[a.kind].hero) return false;
    if (b && from.at === 'board' && UNITS[b.kind].hero && from.at !== to.at) return false;
    if (b && from.at === 'bench' && UNITS[b.kind].hero) return false;
    if (intoBoard && !b && !UNITS[a.kind].hero && boardCount(g) >= boardCap(g)) return false;
    setAt(g, to, a);
    setAt(g, from, b);
    g.boardV++;
    return true;
}

export function sell(g: G, from: Loc, io: IO | null): boolean {
    if (g.phase !== 'plan') return false;
    const u = unitAt(g, from);
    if (!u || UNITS[u.kind].hero) return false;
    g.gold += sellValue(u);
    setAt(g, from, null);
    g.boardV++;
    io?.sfx.sell();
    return true;
}

export function reroll(g: G, io: IO | null): boolean {
    if (g.phase !== 'plan' || g.gold < REROLL || g.challenge === 'ingen-omrulling' || !step(g).omrulling) return false;
    g.gold -= REROLL;
    rollShop(g);
    g.valg += 1;
    io?.sfx.reroll();
    return true;
}

function addItem(g: G, item: ItemId, io: IO | null) {
    if (g.items.includes(item)) return;
    g.items.push(item);
    g.finds.add(item);
    g.valg += 1;
    if (item === 'persepolis') {
        g.gold += 12;
        g.interestCap += 2;
    }
    g.boardV++;
    if (io) {
        io.sfx.coin();
        io.event({ type: 'gjenstand', item });
        io.lesson('item-' + item, ITEMS[item].lesson);
    }
}

/** Kan hæren gå til slag nå? (Utfordringen «Mange folk» krever tre folk.) */
export function canFight(g: G): boolean {
    if (g.challenge !== 'mange-folk') return true;
    const folks = new Set(boardUnits(g).map((b) => UNITS[b.u.kind].folk));
    return folks.size >= 3;
}

// ---------------------------------------------------------------------------
// Slaget
// ---------------------------------------------------------------------------

function mkSquad(g: G, u: Unit, side: 0 | 1, row: number, col: number, syn: Synergy[], id: number): Squad {
    const d = UNITS[u.kind];
    const sm = Math.pow(STAR_MULT, u.star - 1);
    let hpM = 1;
    let dmM = 1;
    let spM = 1;
    let chM = 1;
    const mk = lvl(syn, 'makedonere');
    if (d.folk === 'makedonere' && mk) {
        hpM *= mk >= 2 ? 1.3 : 1.15;
        if (mk >= 2) dmM *= 1.15;
    }
    const gr = lvl(syn, 'grekere');
    if (d.folk === 'grekere' && gr >= 2) dmM *= 1.25;
    const pe = lvl(syn, 'persere');
    if (pe) {
        if (d.klasse === 'skytter') dmM *= pe >= 2 ? 1.7 : 1.35;
        if (d.folk === 'persere') hpM *= pe >= 2 ? 1.25 : 1.1;
    }
    const st = lvl(syn, 'steppefolk');
    if (d.folk === 'steppefolk' && st) {
        hpM *= 1.2;
        spM *= 1.2;
        chM *= 1.3;
        if (st >= 2) dmM *= 1.35;
    }
    const ind = lvl(syn, 'indere');
    if (d.folk === 'indere' && ind) {
        if (d.klasse === 'elefant') hpM *= 1.15;
        if (ind >= 2) dmM *= 1.2;
    }
    if (d.folk === 'thrakere' && lvl(syn, 'thrakere')) dmM *= 1.5;
    if (d.pike && row === 0 && lvl(syn, 'sarissaskog')) {
        // Bare pikene som faktisk står side om side.
        const grid = side === 0 ? g.board : g.enemy;
        const l = grid[0][col - 1];
        const r = grid[0][col + 1];
        if ((l && UNITS[l.kind].pike) || (r && UNITS[r.kind].pike)) {
            dmM *= 1.3;
            hpM *= 1.2;
        }
    }
    if (d.klasse === 'kav' && (col === 0 || col === 4) && lvl(syn, 'kile')) chM *= 1.6;
    if (d.klasse === 'skytter' && row === 1 && lvl(syn, 'pilsverm')) dmM *= 1.35;
    const he = lvl(syn, 'hellenisme');
    if (he) {
        hpM *= 1 + 0.1 * he;
        dmM *= 1 + 0.1 * he;
    }
    if (side === 0) {
        if (g.items.includes('iliaden')) dmM *= 1.12;
        if (g.items.includes('skjoldet') && row === 0) hpM *= 1.2;
        if (g.items.includes('sletta') && (d.klasse === 'vogn' || d.klasse === 'kav')) chM *= 1.4;
        if (g.items.includes('bukefalos') && d.hero) hpM *= 1.6;
    }
    const t = terrain(g);
    if (t === 'steppe' && d.klasse === 'kav') spM *= 1.25;
    // Oppover mot høyden går hestene sakte.
    if (t === 'hoyde' && side === 0 && d.klasse === 'kav') spM *= 0.55;
    if (t === 'jevnet' && d.klasse === 'vogn') {
        spM *= 1.3;
        chM *= 1.4;
    }
    let range = d.range;
    if (t === 'hoyde' && side === 1 && d.klasse === 'skytter') {
        range += 2;
        dmM *= 1.3;
    }
    if (ind && d.klasse === 'skytter' && d.folk === 'indere') range += 1;
    const dir = side === 0 ? 1 : -1;
    const x = COL_X[col];
    const z = ROW_Z[row] * (side === 0 ? 1 : -1);
    const hp = d.hp * sm * hpM;
    return {
        id,
        side,
        kind: u.kind,
        star: u.star,
        uid: u.uid,
        x,
        z,
        hx: x,
        hz: z,
        hp,
        max: hp,
        // Slagene skal vare lenge nok til at kilen har et øyeblikk å treffe.
        dps: d.dps * sm * dmM * PACE,
        range,
        speed: d.speed * spM,
        charge: d.charge * sm * chM * PACE,
        charged: d.charge <= 0,
        moving: 0,
        target: -1,
        retarget: 0,
        engaged: -1,
        dead: false,
        fled: false,
        row,
        col,
        fx: 0,
        fz: dir,
        buffT: 0,
        buffKind: '',
        panic: 0,
        rampage: false,
        pass: 0,
        hitT: 0,
        kills: 0,
    };
}

export function startBattle(g: G, io: IO | null): boolean {
    if (g.phase !== 'plan' || !canFight(g)) return false;
    const syn0 = gridSynergies(g.board);
    const syn1 = gridSynergies(g.enemy);
    const squads: Squad[] = [];
    let id = 0;
    for (let r = 0; r < 2; r++)
        for (let c = 0; c < COLS; c++) {
            const u = g.board[r][c];
            if (u) squads.push(mkSquad(g, u, 0, r, c, syn0, id++));
        }
    for (let r = 0; r < 2; r++)
        for (let c = 0; c < COLS; c++) {
            const u = g.enemy[r]?.[c];
            if (u) squads.push(mkSquad(g, u, 1, r, c, syn1, id++));
        }
    if (g.enemyCommander) {
        const cmd: Unit = { uid: 0, kind: g.enemyCommander, star: 1 };
        const s = mkSquad(g, cmd, 1, 1, 2, syn1, id++);
        s.z = 10;
        s.hz = 10;
        squads.push(s);
    }
    g.squads = squads;
    g.phase = 'slag';
    g.battleT = 0;
    g.abilityUsed = false;
    g.abilityReady = false;
    g.taken = blankTaken();
    for (const s of squads) g.seen.add(s.kind);
    if (io) {
        io.sfx.horn();
        io.event({ type: 'slag-start' });
        const fresh = squads.filter((s) => !UNITS[s.kind].hero || s.kind === 'dareios');
        for (const s of fresh) io.lesson('u-' + s.kind, UNITS[s.kind].lesson);
    }
    return true;
}

const alive = (s: Squad) => !s.dead && !s.fled;

/** Hvilken klasse-regel som gjelder når a treffer d (for skade og tapsårsak). */
let terrainOf: Terrain = 'slette';

function counterMult(a: Squad, d: Squad): { m: number; cause: Cause } {
    const A = UNITS[a.kind];
    const D = UNITS[d.kind];
    let m = 1;
    let cause: Cause = 'omringet';
    const ranged = a.engaged < 0 && (A.klasse === 'skytter' || A.kite || !!A.volley);
    if (A.klasse === 'kav' && D.klasse === 'skytter') {
        m = a.side === 0 && terrainOf === 'hoyde' ? 1.5 : 3;
        cause = 'ridd-ned';
    } else if (A.klasse === 'kav' && D.kite) {
        m = 1;
        cause = 'ridd-ned';
    } else if (A.klasse === 'kav' && D.klasse === 'lett') m = 1.2;
    else if (A.klasse === 'kav' && D.klasse === 'elefant') m = 0.4;
    if (ranged) {
        cause = 'skutt';
        if (D.klasse === 'tung') m = a.kind === 'slynge' ? 2.4 : 2;
        else if (D.kite) m = A.klasse === 'lett' ? 2 : 1.5;
        else if (D.klasse === 'kav' && !D.kite) m = 0.6;
        else if (D.klasse === 'elefant') m = a.kind === 'agrianer' ? 2.5 : 0.7;
        else if (D.klasse === 'vogn') m = a.kind === 'agrianer' ? 2.5 : 1;
        else if (D.klasse === 'lett') m = 0.55; // spredte rekker er vanskelige å treffe
        else m = 1;
    }
    if (A.klasse === 'lett' && (D.klasse === 'vogn' || D.klasse === 'elefant')) m = Math.max(m, 3);
    if (A.klasse === 'lett' && (D.klasse === 'skytter' || D.kite)) m = Math.max(m, 2);
    if (A.klasse === 'elefant' && D.klasse === 'kav') m = 2.2;
    if (A.klasse === 'elefant' && D.klasse === 'tung') m = 1.3;
    if (A.klasse === 'tung' && D.klasse === 'lett') m = 1.2;
    // Elefanten er et levende tårn: bare lett infanteri (og piker forfra) biter.
    if (D.klasse === 'elefant' && A.klasse !== 'lett' && !A.kite) m = Math.min(m, 0.5);
    // Steppens hesteskyttere skyter kusker og elefantførere på avstand.
    if (A.kite && ranged && (D.klasse === 'vogn' || D.klasse === 'elefant')) m = Math.max(m, 1.5);
    // Hesteskyttere rir unna: ryttere tar dem ikke igjen.
    if (D.kite && A.klasse === 'kav' && !A.kite) m = Math.min(m, 0.6);
    if (A.klasse === 'vogn') cause = 'vogner';
    if (A.klasse === 'elefant') cause = 'vogner';
    // Piker mot ryttere, vogner og elefanter forfra.
    if (A.pike && (D.klasse === 'kav' || D.klasse === 'vogn' || D.klasse === 'elefant') && frontal(a, d)) {
        m = Math.max(m, D.klasse === 'kav' ? A.pike : Math.min(A.pike, 1.5));
        cause = 'piker';
    }
    // Skarphet: forsterker både fordeler og ulemper.
    if (TUNE.sharp !== 1 && m !== 1) m = Math.pow(m, TUNE.sharp);
    return { m, cause };
}

/** Står a foran d (sett fra d sin retning)? */
function frontal(d: Squad, a: Squad) {
    const dx = a.x - d.x;
    const dz = a.z - d.z;
    const len = Math.hypot(dx, dz) || 1;
    return (dx * d.fx + dz * d.fz) / len > 0.35;
}

function damage(g: G, a: Squad, d: Squad, amount: number, io: IO | null, cause: Cause) {
    if (!alive(d)) return;
    let m = amount;
    if (d.panic > 0) m *= 1.4;
    if (d.buffKind === 'hold' && d.buffT > 0) m *= 0.35;
    d.hp -= m;
    d.hitT = 0.15;
    if (d.side === 0) g.taken[cause] += m;
    if (d.hp <= 0) {
        d.hp = 0;
        d.dead = true;
        a.kills++;
        if (d.side === 1) g.kills++;
        const dx = d.x - a.x;
        const dz = d.z - a.z;
        const len = Math.hypot(dx, dz) || 1;
        if (io) {
            io.sfx.die();
            io.event({ type: 'dod', id: d.id, x: d.x, z: d.z, dx: dx / len, dz: dz / len, side: d.side, kind: d.kind });
        }
        if (d.kind === 'dareios' || (d.kind === 'poros' && d.side === 1)) panicAll(g, 1, d, io);
    } else if (d.kind === 'dareios' && d.hp < d.max * 0.6 && !d.fled) {
        // Storkongen snur vognen og flykter - og hæren med ham.
        d.fled = true;
        panicAll(g, 1, d, io);
    }
    // Såret elefant raser og tråkker ned alle rundt seg.
    if (UNITS[d.kind].klasse === 'elefant' && !d.rampage && d.hp < d.max * 0.3 && !d.dead) {
        const ind = lvl(gridSynergies(d.side === 0 ? g.board : g.enemy), 'indere');
        if (ind < 2) {
            d.rampage = true;
            io?.event({ type: 'elefant-raser', x: d.x, z: d.z });
        }
    }
}

function panicAll(g: G, side: 0 | 1, from: Squad, io: IO | null) {
    for (const s of g.squads) if (s.side === side && alive(s)) s.panic = 6;
    g.slowmo = 1.2;
    g.shake = 0.8;
    if (io) {
        io.event({ type: 'storkonge-flykter', x: from.x, z: from.z });
        io.banner(from.kind === 'dareios' ? 'STORKONGEN FLYKTER!' : 'POROS ER SLÅTT!', '#d9a441');
        io.sfx.horn();
    }
}

function chooseTarget(g: G, s: Squad): number {
    const D = UNITS[s.kind];
    let best = -1;
    let bestScore = Infinity;
    for (const o of g.squads) {
        if (o.side === s.side || !alive(o)) continue;
        if (o.kind === 'dareios' && s.buffKind !== 'kile') {
            // Storkongen står bak hæren; man når ham når linja er brutt.
        }
        const O = UNITS[o.kind];
        let d = Math.hypot(o.x - s.x, o.z - s.z);
        // Hesteskyttere skyter på det nærmeste, helst tregt fotfolk - de rir ikke inn.
        if (D.kite && O.klasse === 'tung') d -= 3;
        if (D.klasse === 'kav' && !D.kite) {
            if (O.klasse === 'skytter') d -= 7;
            else if (O.kite) d -= 3;
            else if (O.klasse === 'lett') d -= 1.5;
            if (O.pike) d += 3; // ryttere prøver å unngå pikene
            if (O.klasse === 'elefant') d += 5;
        }
        if (D.klasse === 'lett' && (O.klasse === 'vogn' || O.klasse === 'elefant')) d -= 5;
        if (D.klasse === 'elefant' && O.klasse === 'kav') d -= 3;
        // Ljåvogna kjører rett fram langs sin egen kolonne.
        if (D.klasse === 'vogn') d += Math.abs(o.x - s.x) * 2.5;
        if (s.buffKind === 'kile' && s.buffT > 0) {
            if (o.kind === 'dareios' || o.kind === 'poros') d -= 20;
            if (o.engaged >= 0) d -= 6;
        }
        if (o.kind === 'dareios') d += 4;
        // Hver kolonne slåss mest mot kolonnen rett overfor (fotfolk og skyttere).
        // Ryttere og elefanter velger fritt - det er dem som svinger inn fra flanken.
        if (D.klasse !== 'kav' && D.klasse !== 'elefant') d += Math.abs(o.x - s.hx) * TUNE.lane;
        if (d < bestScore) {
            bestScore = d;
            best = o.id;
        }
    }
    return best;
}

function nearestEnemy(g: G, s: Squad, meleeOnly = false): { o: Squad; d: number } | null {
    let best: Squad | null = null;
    let bd = Infinity;
    for (const o of g.squads) {
        if (o.side === s.side || !alive(o)) continue;
        if (meleeOnly) {
            const O = UNITS[o.kind];
            if (O.klasse === 'skytter' || O.kite) continue;
        }
        const d = Math.hypot(o.x - s.x, o.z - s.z);
        if (d < bd) {
            bd = d;
            best = o;
        }
    }
    return best ? { o: best, d: bd } : null;
}

export function fireAbility(g: G, io: IO | null): boolean {
    if (g.phase !== 'slag' || g.abilityUsed || g.battleT < MARCH) return false;
    g.abilityUsed = true;
    g.valg += 1;
    const hero = g.squads.find((s) => s.side === 0 && UNITS[s.kind].hero && alive(s));
    const boost = g.items.includes('bukefalos') ? 2 : 1;
    const mine = g.squads.filter((s) => s.side === 0 && alive(s));
    switch (g.leader) {
        case 'aleksander': {
            // I De persiske porter førte Aleksander rytterne rundt fjellstien og kom
            // bakfra: på høyden dukker kilen opp bak fiendens linjer.
            // Bare mens perserne er bundet av fotfolket i passet - ellers ser de dem komme.
            const bound = g.squads.filter((o) => o.side === 1 && alive(o) && o.engaged >= 0).length;
            const path = terrain(g) === 'hoyde' && bound >= 2;
            let k = 0;
            for (const s of mine) {
                if (UNITS[s.kind].klasse !== 'kav') continue;
                if (!path && hero && s !== hero && Math.hypot(s.x - hero.x, s.z - hero.z) > 7) continue;
                s.buffKind = 'kile';
                s.buffT = 4 * boost;
                s.charged = false;
                s.moving = 1;
                s.engaged = -1;
                s.retarget = 0;
                if (path) {
                    s.x = -6 + (k++ % 5) * 3;
                    s.z = 12.5;
                    s.fz = -1;
                }
            }
            if (path) io?.banner('FJELLSTIEN!', '#d9a441');
            break;
        }
        case 'parmenion':
            for (const s of mine)
                if (UNITS[s.kind].klasse === 'tung' || UNITS[s.kind].klasse === 'lett') {
                    s.buffKind = 'hold';
                    s.buffT = 5 * boost;
                }
            break;
        case 'mazaios':
            for (const s of mine)
                if (UNITS[s.kind].klasse === 'skytter' || UNITS[s.kind].kite || UNITS[s.kind].volley) {
                    s.buffKind = 'pil';
                    s.buffT = 5 * boost;
                }
            break;
        case 'oxyartes':
            for (const s of mine)
                if (UNITS[s.kind].klasse === 'kav') {
                    s.buffKind = 'flukt';
                    s.buffT = 1.4;
                    s.engaged = -1;
                }
            break;
        case 'poros':
            for (const s of mine)
                if (UNITS[s.kind].klasse === 'elefant') {
                    s.buffKind = 'storm';
                    s.buffT = 3 * boost;
                    s.charged = false;
                    s.moving = 1;
                    s.hp = Math.min(s.max, s.hp + s.max * 0.25);
                    s.rampage = false;
                }
            break;
    }
    if (io) {
        io.sfx.charge();
        io.event({ type: 'evne', leader: g.leader, x: hero?.x ?? 0, z: hero?.z ?? 0 });
        io.banner(LEADERS[g.leader].evne.toUpperCase(), '#a4402a');
    }
    return true;
}

function stepBattle(g: G, dt: number, io: IO | null) {
    g.battleT += dt;
    terrainOf = terrain(g);
    if (g.battleT < MARCH) return;
    if (!g.abilityReady) {
        g.abilityReady = true;
        g.valg += 1;
    }
    const S = g.squads;
    for (const s of S) {
        if (!alive(s)) continue;
        if (s.hitT > 0) s.hitT -= dt;
        if (s.panic > 0) s.panic -= dt;
        const D0 = UNITS[s.kind];
        if (s.buffT > 0) {
            s.buffT -= dt;
            if (s.buffT <= 0) {
                if (s.buffKind === 'flukt') {
                    // Skinnflukten er over: snu! Rytterne støter igjen, og hesteskytterne
                    // skyter over skulderen (det parthiske skuddet).
                    if (D0.kite) {
                        s.buffKind = 'pil';
                        s.buffT = 4;
                        io?.event({ type: 'parthisk', id: s.id, x: s.x, z: s.z });
                    } else {
                        s.charged = false;
                        s.moving = 1;
                        s.buffKind = 'kile';
                        s.buffT = 3;
                    }
                } else s.buffKind = '';
            }
        }
        const D = UNITS[s.kind];
        if (s.kind === 'dareios') continue;
        // Fiendens hærfører (Poros) venter bak til halve hæren hans er borte.
        if (s.side === 1 && D.hero) {
            const mine = S.filter((o) => o.side === 1 && o !== s);
            if (mine.filter(alive).length > mine.length / 2) continue;
        }
        // Ljåvogna kjører gjennom rekkene etter støtet, snur og kommer igjen.
        if (s.pass > 0) {
            s.pass -= dt;
            s.x += s.fx * s.speed * dt;
            s.z += s.fz * s.speed * dt;
            if (Math.abs(s.z) > 12 || Math.abs(s.x) > 7.8) {
                s.fx = -s.fx;
                s.fz = -s.fz;
            }
            if (s.pass <= 0) {
                s.charged = false;
                s.moving = 1;
                s.retarget = 0;
            }
            continue;
        }
        s.retarget -= dt;
        let t = s.target >= 0 ? S[s.target] : null;
        if (!t || !alive(t) || s.retarget <= 0) {
            s.target = chooseTarget(g, s);
            s.retarget = 0.35;
            t = s.target >= 0 ? S[s.target] : null;
        }
        // Bundet: den som kommer inntil fiendens fotfolk, slipper ikke forbi - linja holder.
        // Hesteskyttere rir unna, og kilen bryter gjennom.
        if (!D.kite && D.klasse !== 'skytter' && !(s.buffKind === 'kile' && s.buffT > 0) && t) {
            let pin: Squad | null = null;
            let pd = RADIUS * 2 + 0.6;
            for (const o of S) {
                if (o.side === s.side || !alive(o) || o === t || o.kind === 'dareios') continue;
                const O = UNITS[o.kind];
                if (O.klasse === 'skytter' || O.kite) continue;
                const d = Math.hypot(o.x - s.x, o.z - s.z);
                if (d < pd) {
                    pd = d;
                    pin = o;
                }
            }
            if (pin && Math.hypot(t.x - s.x, t.z - s.z) > RADIUS * 2 + 0.6) {
                t = pin;
                s.target = pin.id;
            }
        }
        if (s.rampage) {
            // Raser: angriper nærmeste, uansett side.
            let near: Squad | null = null;
            let nd = Infinity;
            for (const o of S) {
                if (o === s || !alive(o)) continue;
                const d = Math.hypot(o.x - s.x, o.z - s.z);
                if (d < nd) {
                    nd = d;
                    near = o;
                }
            }
            t = near;
        }
        if (!t) continue;
        const dx = t.x - s.x;
        const dz = t.z - s.z;
        const dist = Math.hypot(dx, dz) || 0.001;
        const ux = dx / dist;
        const uz = dz / dist;
        let speed = s.speed;
        if (s.buffKind === 'kile' && s.buffT > 0) speed *= 1.5;
        if (s.buffKind === 'storm' && s.buffT > 0) speed *= 1.5;
        if (s.panic > 0) speed *= 0.6;
        const reach = s.range + RADIUS * 2 - 0.4;
        const shooter = D.klasse === 'skytter' || !!D.kite;
        let rate = 1;
        if (s.buffKind === 'pil' && s.buffT > 0) rate = 2.5;
        if (s.panic > 0) rate *= 0.6;

        if (s.buffKind === 'flukt' && s.buffT > 0) {
            // Skinnflukt: rir bakover.
            s.x -= s.fx * speed * dt;
            s.z -= s.fz * speed * dt;
            s.engaged = -1;
            continue;
        }

        if (D.kite) {
            const m = nearestEnemy(g, s, true);
            if (m && m.d < 3.6) {
                const ax = s.x - m.o.x;
                const az = s.z - m.o.z;
                const al = Math.hypot(ax, az) || 1;
                // Rir unna i full fart, litt på skrå så de ikke havner i et hjørne.
                const sx = (ax / al) * 0.8 + (s.x < 0 ? 0.5 : -0.5) * 0.6;
                const sz = (az / al) * 0.8;
                const sl = Math.hypot(sx, sz) || 1;
                s.x += (sx / sl) * speed * 1.05 * dt;
                s.z += (sz / sl) * speed * 1.05 * dt;
            }
        }

        if (shooter && dist <= s.range + RADIUS) {
            s.fx = ux;
            s.fz = uz;
            s.engaged = -1;
            const cm = counterMult(s, t);
            damage(g, s, t, s.dps * cm.m * dt * rate, io, cm.cause);
            if (io && g.rng() < dt * 1.5) io.event({ type: 'skudd', from: s.id, to: t.id, kind: s.kind });
            s.moving = 0;
            continue;
        }
        if (dist <= reach) {
            // Nærkamp.
            s.fx = ux;
            s.fz = uz;
            s.engaged = t.id;
            if (!s.charged && s.charge > 0) {
                s.charged = true;
                if (s.moving > 0.25) impact(g, s, t, io);
            }
            const cm = counterMult(s, t);
            let m = cm.m;
            let cause = cm.cause;
            // Hammer og ambolt: målet slåss med en annen og treffes fra siden.
            if (t.engaged >= 0 && t.engaged !== s.id && !frontal(t, s)) {
                m *= 1.8;
                cause = 'omringet';
            }
            damage(g, s, t, s.dps * m * dt * rate, io, cause);
            s.moving = 0;
        } else {
            // Kastespyd / pil på vei inn.
            if (D.volley && dist <= 7 + RADIUS) {
                const cm = counterMult(s, t);
                damage(g, s, t, D.volley * Math.pow(STAR_MULT, s.star - 1) * cm.m * dt * rate, io, 'skutt');
                if (io && g.rng() < dt) io.event({ type: 'skudd', from: s.id, to: t.id, kind: s.kind });
            }
            s.engaged = -1;
            // Ryttere rir rundt spydene: mot et mål med piker som ser mot dem, går veien
            // via siden av målet (flanken) før de slår inn.
            let mx = ux;
            let mz = uz;
            if (D.klasse === 'kav' && !D.kite && UNITS[t.kind].pike && frontal(t, s) && dist > 3) {
                const side = s.x >= t.x ? 1 : -1;
                const wx = t.x + side * 3.4 - t.fx * 2.2;
                const wz = t.z - t.fz * 2.2;
                const wl = Math.hypot(wx - s.x, wz - s.z) || 1;
                mx = (wx - s.x) / wl;
                mz = (wz - s.z) / wl;
            }
            s.x += mx * speed * dt;
            s.z += mz * speed * dt;
            s.fx = mx;
            s.fz = mz;
            s.moving += dt;
        }
    }
    // Hold avstand: enhetene dytter hverandre (det gir frontlinja).
    for (let i = 0; i < S.length; i++) {
        const a = S[i];
        if (!alive(a) || a.kind === 'dareios') continue;
        for (let j = i + 1; j < S.length; j++) {
            const b = S[j];
            if (!alive(b)) continue;
            const dx = b.x - a.x;
            const dz = b.z - a.z;
            const d2 = dx * dx + dz * dz;
            const min = RADIUS * 1.9;
            if (d2 >= min * min || d2 < 1e-6) continue;
            const d = Math.sqrt(d2);
            const push = (min - d) * 0.5;
            const ux = dx / d;
            const uz = dz / d;
            const wa = b.kind === 'dareios' ? 1 : 0.5;
            const wb = b.kind === 'dareios' ? 0 : 0.5;
            a.x -= ux * push * wa * 2;
            a.z -= uz * push * wa * 2;
            b.x += ux * push * wb * 2;
            b.z += uz * push * wb * 2;
        }
        a.x = Math.max(-8, Math.min(8, a.x));
        a.z = Math.max(-13, Math.min(13, a.z));
    }
    // Hvem vant?
    const own = S.filter((s) => s.side === 0 && alive(s));
    const foe = S.filter((s) => s.side === 1 && alive(s) && s.kind !== 'dareios');
    if (!foe.length || !own.length || g.battleT >= BATTLE_MAX) {
        let won = own.length > 0 && foe.length === 0;
        if (own.length && foe.length) {
            const hpOf = (xs: Squad[]) => xs.reduce((a, s) => a + s.hp / s.max, 0);
            won = hpOf(own) > hpOf(foe) * 1.05;
        }
        endBattle(g, won, io);
    }
}

function impact(g: G, s: Squad, t: Squad, io: IO | null) {
    const T = UNITS[t.kind];
    let amount = s.charge;
    const ter = terrain(g);
    if (ter === 'elv') amount *= 0.4;
    const cm = counterMult(s, t);
    const pikeFront = !!T.pike && frontal(t, s);
    const bounce = pikeFront && UNITS[s.kind].klasse === 'kav';
    // Oppover mot høyden får ryttere ingen fart.
    if (ter === 'hoyde' && s.side === 0 && UNITS[s.kind].klasse === 'kav') amount *= 0.3;
    let kileHit = false;
    if (bounce) {
        // Løp rett på pikene: støtet går i rytteren selv.
        damage(g, t, s, amount * 0.9 * T.pike!, io, 'piker');
        amount *= 0.25;
    } else if (UNITS[s.kind].klasse === 'vogn' && T.klasse === 'lett') {
        // Lett infanteri åpner rekkene: vogna treffer ingen, og kusken blir stukket.
        amount *= 0.1;
        s.hp -= s.max * 0.5;
    } else {
        if (UNITS[s.kind].klasse === 'vogn') {
            s.pass = 1.3;
            // Hester og ljåer blir slitne: hvert nytt støt er svakere.
            s.charge *= 0.55;
        }
        amount *= Math.max(1, cm.m * 0.8);
        if (t.engaged >= 0 && !frontal(t, s)) {
            amount *= 1.6;
        }
        if (s.buffKind === 'kile' && s.buffT > 0 && t.engaged >= 0) {
            amount *= 2;
            kileHit = true;
        }
    }
    damage(g, s, t, amount, io, UNITS[s.kind].klasse === 'kav' ? 'ridd-ned' : 'vogner');
    // Nabofiender rundt målet får en del av støtet (bølgen).
    if (!bounce)
        for (const o of g.squads) {
            if (o === t || o.side === s.side || !alive(o)) continue;
            if (Math.hypot(o.x - t.x, o.z - t.z) < 2.6) damage(g, s, o, amount * 0.3, io, 'vogner');
        }
    const big = amount > 50 || kileHit;
    if (big) {
        g.hitstop = kileHit ? 0.18 : 0.08;
        g.shake = Math.max(g.shake, kileHit ? 1 : 0.5);
    }
    if (kileHit) g.slowmo = 1.4;
    if (io) {
        io.sfx.clash();
        io.event({ type: 'stot', x: t.x, z: t.z, big, bounce, side: s.side });
        if (kileHit) io.event({ type: 'kile-treff', x: t.x, z: t.z });
    }
}

function endBattle(g: G, won: boolean, io: IO | null) {
    if (g.preview) {
        g.phase = 'slutt';
        g.last = { won, time: g.battleT, survivors: 0, overkill: 0, points: 0, taken: g.taken };
        return;
    }
    const own = g.squads.filter((s) => s.side === 0 && alive(s));
    const foe = g.squads.filter((s) => s.side === 1);
    const survivors = own.reduce((a, s) => a + Math.max(1, UNITS[s.kind].cost) * s.star, 0);
    const overkill = foe.reduce((a, s) => a + (s.max - s.hp), 0);
    let points = 0;
    const n = g.round + 1;
    if (won) {
        points = 150 * n + survivors * 25 + Math.round(overkill * 0.4) + Math.max(0, Math.round((BATTLE_MAX - g.battleT) * 6));
    } else points = Math.round(overkill * 0.15);
    g.score += points;
    const stats: BattleStats = { won, time: g.battleT, survivors, overkill, points, taken: { ...g.taken } };
    g.last = stats;
    g.history.push(stats);
    if (io) {
        io.event({ type: 'slag-slutt', won });
        io.float(`+${points}`, 0, 0, won ? '#d9a441' : '#efe3c8', true);
        if (won) io.sfx.win();
        else io.sfx.lose();
    }
    if (!won) {
        // Et knusende nederlag (halve fiendehæren står igjen) koster to moral.
        const foeLeft = foe.filter((s) => alive(s) && s.kind !== 'dareios');
        const crushed = foe.length > 0 && foeLeft.length / foe.length >= CRUSH;
        stats.crushed = crushed;
        g.lives -= crushed ? 2 : 1;
        const own0 = g.squads.filter((s) => s.side === 0).length;
        const top = (Object.keys(g.taken) as Cause[]).sort((a, b) => g.taken[b] - g.taken[a])[0];
        g.cause = own0 <= Math.max(2, g.round) ? 'for-fa' : top;
    }
    if (won) {
        const def = battleDef(g);
        if (def.name === 'Gaugamela') g.unlocked.add('mazaios');
        if (def.name === 'Jaxartes') g.unlocked.add('oxyartes');
        if (def.name === 'Hydaspes') g.unlocked.add('poros');
    }
    if (g.lives <= 0) {
        g.phase = 'slutt';
        g.ended = 'tapt';
        io?.lose(g.cause);
        return;
    }
    if (g.round >= BATTLES - 1) {
        g.phase = 'slutt';
        g.ended = 'vunnet';
        g.unlocked.add('parmenion');
        g.score += g.lives * 400;
        io?.win();
        return;
    }
    if (won) {
        // Belønning: ta inn en enhet fra den slåtte hæren (hellenisme), en gjenstand eller gull.
        const kinds = [...new Set(g.enemy.flat().filter(Boolean).map((u) => u!.kind))].filter(
            (k) => !(g.challenge === 'uten-ryttere' && UNITS[k].klasse === 'kav')
        );
        const opts: RewardOption[] = [];
        for (let i = 0; i < 2 && kinds.length; i++) {
            const k = kinds.splice(Math.floor(g.rng() * kinds.length), 1)[0];
            opts.push({ kind: k });
        }
        const left = (Object.keys(ITEMS) as ItemId[]).filter((k) => !g.items.includes(k));
        if (left.length && g.rng() < 0.35) opts.push({ item: pick(g.rng, left) });
        else opts.push({ gold: 4 });
        g.reward = opts;
        g.phase = 'belonning';
        g.phaseT = REWARD_SECONDS;
        g.valg += 1;
    } else nextRound(g, io);
}

export function pickReward(g: G, i: number, io: IO | null): boolean {
    if (g.phase !== 'belonning' || !g.reward) return false;
    const o = g.reward[i];
    if (!o) return false;
    if (o.kind) {
        const free = firstFree(g);
        const u: Unit = { uid: g.uid++, kind: o.kind, star: 1 };
        if (free) setAt(g, free, u);
        const folk = UNITS[o.kind].folk;
        if (!g.pool.has(folk)) {
            g.pool.add(folk);
            io?.banner(`${FOLK_NAME[folk].toUpperCase()} I HÆREN`, '#d9a441');
        }
        tryMerge(g, io);
    } else if (o.item) addItem(g, o.item, io);
    else if (o.gold) {
        g.gold += o.gold;
        io?.sfx.coin();
    }
    g.reward = null;
    nextRound(g, io);
    return true;
}

function nextRound(g: G, io: IO | null) {
    g.round += 1;
    g.phase = 'plan';
    g.phaseT = PLAN_SECONDS;
    g.squads = [];
    const inc = interest(g);
    g.interestLast = inc;
    let bonus = 0;
    const gr = lvl(synergies(g), 'grekere');
    if (gr) bonus = gr >= 2 ? 2 : 1;
    g.gold += 5 + inc + bonus;
    g.score += inc * 15;
    // Stengte flanker: enheter som står der, flyttes til benken.
    if (terrain(g) === 'smalt')
        for (const c of [0, 4])
            for (let r = 0; r < 2; r++) {
                const u = g.board[r][c];
                if (!u) continue;
                g.board[r][c] = null;
                // Finn en åpen rute på brettet, ellers benken.
                let placed = false;
                for (let rr = 0; rr < 2 && !placed; rr++)
                    for (let cc = 1; cc < 4 && !placed; cc++)
                        if (!g.board[rr][cc]) {
                            g.board[rr][cc] = u;
                            placed = true;
                        }
                if (!placed) {
                    const f = firstFree(g);
                    if (f) setAt(g, f, u);
                    else g.gold += sellValue(u);
                }
            }
    rollShop(g);
    makeEnemy(g);
    g.boardV++;
    g.valg += 2;
    if (io) {
        const def = battleDef(g);
        io.sfx.drum();
        io.banner(`${def.name.toUpperCase()} ${def.year}`, '#efe3c8');
        if (inc) io.float(`+${inc} renter`, 0, -8, '#d9a441');
    }
}

// ---------------------------------------------------------------------------
// Løkka
// ---------------------------------------------------------------------------

export function update(g: G, dt: number, io: IO | null) {
    if (g.ended) return;
    g.t += dt;
    if (g.phase === 'plan') {
        g.phaseT -= dt;
        if (g.phaseT <= 0) {
            if (!startBattle(g, io)) {
                // «Mange folk» uten tre folk: slaget tas likevel, uten bonus.
                g.challenge = 'ingen';
                startBattle(g, io);
            }
        }
    } else if (g.phase === 'belonning') {
        g.phaseT -= dt;
        if (g.phaseT <= 0 && g.reward) pickReward(g, g.reward.length - 1, io);
    } else if (g.phase === 'slag') {
        if (g.hitstop > 0) {
            g.hitstop -= dt;
            return;
        }
        stepBattle(g, dt, io);
    }
}

/** Effekter som går i sanntid (rist, sakte film), uavhengig av spillets tid. */
export function stepFx(g: G, dt: number) {
    g.shake = Math.max(0, g.shake - dt * 2.5);
    g.slowmo = Math.max(0, g.slowmo - dt);
}

export function progress(g: G) {
    const done = g.history.length;
    return Math.min(1, done / BATTLES);
}

export function pressure(g: G) {
    const r = g.round / (BATTLES - 1);
    if (g.phase === 'slag') {
        const foe = g.squads.filter((s) => s.side === 1);
        const left = foe.length ? foe.filter(alive).length / foe.length : 0;
        return Math.min(1, 0.3 + 0.45 * r + 0.25 * left);
    }
    return Math.min(1, 0.1 + 0.6 * r);
}

export function finalScore(g: G) {
    return Math.round(g.score * CHALLENGES[g.challenge].mult);
}

export const CAUSE_TEXT: Record<Cause, string> = {
    piker: 'Rytterne løp rett på pikene',
    skutt: 'De tunge ble skutt ned før de nådde fram',
    'ridd-ned': 'Skytterne ble ridd ned',
    vogner: 'Vogner og elefanter brøt gjennom',
    omringet: 'Hæren ble omringet fra flanken',
    'for-fa': 'For få soldater på slagmarken',
};

export const CAUSE_TIP: Record<Cause, string> = {
    piker: 'Ryttere forfra mot piker er selvmord. Send dem rundt flanken - eller mot skytterne.',
    skutt: 'Tunge infanterister er trege mål. Ryttere knuser skytterne, og egne skyttere svarer.',
    'ridd-ned': 'Bueskyttere trenger en vegg foran seg. Sett piker eller spyd i fremre rekke.',
    vogner: 'Lett infanteri åpner rekkene for vognene og stikker elefantene.',
    omringet: 'Ambolten må holde. Fyll midten i fremre rekke og dekk flankene.',
    'for-fa': 'Du sparte for lenge. Renter er fint, men en tom slagmark taper.',
};

/**
 * Forhåndsslag: spiller slaget med `board` mot fiendehæren som står på sletta, uten å
 * endre spillet. Svarer med en margin: >0 betyr seier (egen gjenværende styrke), <0 tap.
 * Det er robotenes «lesing» - samme informasjon som eleven ser.
 */
export function previewBattle(g: G, board: (Unit | null)[][], dt = 0.1): number {
    const tg: G = {
        ...g,
        board,
        bench: [],
        squads: [],
        history: [],
        taken: blankTaken(),
        phase: 'plan',
        challenge: 'ingen',
        rng: mulberry(7),
        preview: true,
        seen: new Set(),
        last: null,
        hitstop: 0,
        slowmo: 0,
        shake: 0,
        ended: '',
    };
    startBattle(tg, null);
    let t = 0;
    while (tg.phase === 'slag' && t < BATTLE_MAX + 1) {
        stepBattle(tg, dt, null);
        t += dt;
    }
    const own = tg.squads.filter((s) => s.side === 0);
    const foe = tg.squads.filter((s) => s.side === 1 && s.kind !== 'dareios');
    const frac = (xs: Squad[]) => xs.reduce((a, s) => a + (alive(s) ? s.hp / s.max : 0) * (1 + UNITS[s.kind].cost), 0) / Math.max(1, xs.reduce((a, s) => a + 1 + UNITS[s.kind].cost, 0));
    return tg.last?.won ? 0.2 + frac(own) : -0.2 - frac(foe);
}

/**
 * Hint til eleven: hvordan går enhet `a` mot `b`? >0 = slår, <0 = taper, og en kort grunn.
 * Samme regler som i slaget, bare grovt.
 */
export function matchupHint(a: Kind, b: Kind): { score: number; text: string } {
    const A = UNITS[a];
    const B = UNITS[b];
    if (A.pike && B.klasse === 'kav' && !B.kite) return { score: 2, text: 'Piker stopper ryttere' };
    if (A.klasse === 'lett' && B.klasse === 'vogn') return { score: 3, text: 'Åpner rekkene for vogna' };
    if (A.klasse === 'lett' && B.klasse === 'elefant') return { score: 3, text: 'Stikker elefanten' };
    if (A.klasse === 'lett' && (B.klasse === 'skytter' || B.kite)) return { score: 2, text: 'Spredt: pilene bommer' };
    if (A.klasse === 'kav' && !A.kite && B.klasse === 'skytter') return { score: 2, text: 'Rir ned skytterne' };
    if ((A.klasse === 'skytter' || A.kite) && B.klasse === 'tung') return { score: 2, text: 'Skyter treg infanteri' };
    if (A.klasse === 'elefant' && B.klasse === 'kav') return { score: 2, text: 'Hestene skyr elefanten' };
    if (B.pike && A.klasse === 'kav') return { score: -2, text: 'Rir rett på pikene' };
    if (B.klasse === 'elefant' && A.klasse !== 'lett') return { score: -2, text: 'Elefanten tråkker' };
    if (B.klasse === 'vogn' && A.klasse !== 'lett') return { score: -2, text: 'Ljåvogna meier' };
    if (B.kite && A.klasse === 'kav') return { score: -1, text: 'Tar dem ikke igjen' };
    if (B.klasse === 'kav' && A.klasse === 'skytter') return { score: -2, text: 'Blir ridd ned' };
    if (B.klasse === 'skytter' && A.klasse === 'tung') return { score: -1, text: 'Blir skutt ned' };
    return { score: 0, text: 'Jevnt' };
}
