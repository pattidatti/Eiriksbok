// Data for de store systemene i «Hunden spiste leksa»: sjefene, slutten, talenttreet,
// kommunebytte, lovene i kommunestyret, børsen, planetbanen og unnskyldningsverkstedet.
// Ren data. Motorene ligger i hundenBoss.ts, hundenMini.ts og hundenGame.ts.

/* ================= Sjefer ================= */
export interface Boss {
    id: string;
    n: string;
    ic: string;
    hp: number;
    intro: string;
    taunt: string[]; // når den angriper (feil svar)
    hurt: string[]; // når den blir truffet
    rage: string; // ved halv helse
    win: string; // når du vinner
    lose: string; // når du taper
}
// Sjef nr. k vokter overgangen fra område k til k+1. Nr. 8 er den siste sjefen.
export const BOSSES: Boss[] = [
    {
        id: 'b0',
        n: 'Lærer Tønnessen',
        ic: '👩‍🏫',
        hp: 3,
        intro: 'Før du får gå til rektor, skal jeg se om du faktisk kan noe.',
        taunt: ['Feil. Akkurat som jeg trodde.', 'Hunden din vet mer enn deg.', 'Det står i boka. Side 47.'],
        hurt: ['Hm. Det var faktisk riktig.', 'Hvem har lært deg det?', 'Jeg må sette meg ned.'],
        rage: 'Nå tar jeg fram de vanskelige spørsmålene!',
        win: 'Greit. Du får gå til rektor. Men jeg holder øye med deg.',
        lose: 'Kom tilbake når du har lest leksa.',
    },
    {
        id: 'b1',
        n: 'Rektor',
        ic: '🧑‍💼',
        hp: 4,
        intro: 'Så du er eleven med hunden. Sett deg. Vi skal ha en prat.',
        taunt: ['Det skriver jeg i loggen.', 'Foreldrene dine får brev.', 'Feil. Gjensitting.'],
        hurt: ['Det… stemmer faktisk.', 'Jeg må ringe kommunen.', 'Hvordan visste du det?'],
        rage: 'Nok! Nå ringer jeg ordføreren!',
        win: 'Gå. Bare gå. Ta hunden med deg.',
        lose: 'Tilbake til klasserommet med deg.',
    },
    {
        id: 'b2',
        n: 'Ordføreren',
        ic: '🎩',
        hp: 4,
        intro: 'Kommunen har fått 4000 klager på deg. Alle er fra lærere.',
        taunt: ['Forslaget ditt er nedstemt.', 'Kommunen sier nei.', 'Neste sak!'],
        hurt: ['Det kan vi ikke stemme ned.', 'Bra argument. Dessverre.', 'Jeg trenger en pause.'],
        rage: 'Jeg innkaller til ekstraordinært møte!',
        win: 'Kommunen gir seg. Du får reise til Stortinget.',
        lose: 'Saken er utsatt til neste møte.',
    },
    {
        id: 'b3',
        n: 'Stortingspresidenten',
        ic: '🔔',
        hp: 5,
        intro: 'Stortinget er satt. Saken gjelder: Eleven og hunden.',
        taunt: ['Forslaget faller.', 'Ro i salen!', 'Taletiden er ute.'],
        hurt: ['Det er et godt poeng.', 'Salen er enig med eleven.', 'Jeg må slå med klubba.'],
        rage: 'Jeg ber om votering. NÅ!',
        win: 'Stortinget har bestemt: saken sendes til FN.',
        lose: 'Saken er avvist. Prøv igjen neste periode.',
    },
    {
        id: 'b4',
        n: 'Generalsekretæren i FN',
        ic: '🌐',
        hp: 5,
        intro: 'Verden følger med. 193 land venter på svaret ditt.',
        taunt: ['Veto.', 'Sikkerhetsrådet er ikke imponert.', 'Det må oversettes til seks språk. Feil på alle.'],
        hurt: ['Det er en sterk resolusjon.', 'Verden applauderer.', 'Jeg trenger en tolk.'],
        rage: 'Jeg kaller inn hele sikkerhetsrådet!',
        win: 'FN har vedtatt det. Du er nå et problem for hele universet.',
        lose: 'Resolusjonen falt. Prøv igjen.',
    },
    {
        id: 'b5',
        n: 'Universets vaktmester',
        ic: '🧹',
        hp: 6,
        intro: 'Jeg har feid opp etter Big Bang i 13 milliarder år. Du lager rot.',
        taunt: ['Feil. Jeg feier deg ut.', 'Det har jeg sett før. I 1856.', 'Galaksen er stengt.'],
        hurt: ['Æsj. Det var riktig.', 'Det må jeg feie opp.', 'Stjernene blinker for deg.'],
        rage: 'Nå henter jeg den STORE kosten!',
        win: 'Greit. Du får gå videre. Tørk av beina.',
        lose: 'Ut med deg. Jeg har nettopp vasket.',
    },
    {
        id: 'b6',
        n: 'Multiversets inspektør',
        ic: '🕵️',
        hp: 6,
        intro: 'I 4000 universer har du glemt leksa. Jeg har sjekket alle.',
        taunt: ['I dette universet er det feil.', 'Jeg har bevis fra 12 universer.', 'Feil i alle tidslinjer.'],
        hurt: ['I dette universet har du rett.', 'Det skjer bare i ett av tusen universer.', 'Notatblokka mi er full.'],
        rage: 'Jeg henter inspektører fra alle universene!',
        win: 'Saken er henlagt i alle universer.',
        lose: 'Saken er åpnet igjen.',
    },
    {
        id: 'b7',
        n: 'Tiden selv',
        ic: '⌛',
        hp: 7,
        intro: 'Klokka er 08:14. Den har vært 08:14 i en evighet. Fristen er 08:15.',
        taunt: ['Tikk. Takk. Feil.', 'Tida går. For deg.', 'Fristen nærmer seg.'],
        hurt: ['Klokka hakker.', 'Sekundene står stille.', 'Det var… tidløst.'],
        rage: 'Jeg spoler tilbake! Alle spørsmål på nytt!',
        win: 'Klokka er 08:16. Fristen gikk. Ingen merket det.',
        lose: 'Tiden vinner alltid. Nesten alltid.',
    },
    {
        id: 'b8',
        n: 'Den som fant opp lekser',
        ic: '🦹',
        hp: 10,
        intro: 'Så du har kommet helt hit. Jeg fant opp lekser for fire tusen år siden. Du skal ikke få stoppe meg nå.',
        taunt: ['Lekser er for alltid!', 'Du kommer aldri unna.', 'Enda en lekse til deg!', 'Ha! Feil!'],
        hurt: ['Nei… det var riktig!', 'Kappen min revner!', 'Hvordan kan du alt dette?', 'Stopp! Ikke flere riktige svar!'],
        rage: 'Nå viser jeg deg min sanne form!',
        win: '',
        lose: 'Lekser vinner. Denne gangen.',
    },
];
export const BOSS_REWARD = 1.25; // all produksjon × dette for hver sjef du har slått
export const END_AT = 1e30; // når den siste sjefen dukker opp

/* ================= Slutten ================= */
export const ENDING: { ic: string; t: string }[] = [
    { ic: '🦹', t: 'Den som fant opp lekser faller på kne. Kappen glir av.' },
    { ic: '😮', t: 'Under kappen står det noen du kjenner.' },
    { ic: '🐕', t: 'Det er HUNDEN.' },
    { ic: '🐕', t: '«Jeg fant opp lekser for fire tusen år siden», sier hunden. «Jeg var sulten.»' },
    { ic: '📚', t: '«Hver lekse i verden ble laget for at en hund skulle spise den. Du har bare hjulpet meg.»' },
    { ic: '🦴', t: 'Hunden logrer. Så spiser den den aller siste leksa i universet.' },
    { ic: '🌅', t: 'Det blir aldri lekser igjen. Elevene jubler. Lærerne går på kafé.' },
    { ic: '🐕', t: 'Hunden ser på deg. Den har fortsatt det siste ordet: «Voff.»' },
];

/* ================= Hundens hevn (nytt spill+) ================= */
export const HEVN_MULT = 3; // all produksjon × dette for hver runde med hevn
export const HEVN_HEAD = [
    'Hunden er lærer nå. Den gir lekser i å apportere',
    'Lærer Tønnessen samler bevis mot deg. Hun har en mappe',
    'Rektor har kjøpt katt. Ingen vet hvorfor',
    'Hunden gir deg anmerkning for å ha gjort leksa',
    'Bevisene hoper seg opp. Læreren smiler for første gang på ti år',
];

/* ================= Kommunebytte ================= */
export const KOMMUNE_AT = 500; // rykte du må ha samlet før du kan bytte kommune
export const legendeFor = (rykte: number) => Math.floor(Math.sqrt(rykte / 100));
export const KOMMUNER = ['Gloppen', 'Hamarøy', 'Lindesnes', 'Bø', 'Vågå', 'Røros', 'Lofoten', 'Tynset', 'Flekkefjord', 'Os', 'Alta', 'Rauma'];
export interface KShop {
    id: string;
    n: string;
    d: string;
    ic: string;
    max: number;
    c: (lv: number) => number;
}
export const KSHOP: KShop[] = [
    { id: 'kp', n: 'Kommunal stolthet', d: 'All produksjon ×2 per nivå.', ic: '🏔️', max: 10, c: (lv) => 1 + lv },
    { id: 'kr', n: 'Ryktebyrå', d: 'Du får 25 % mer rykte når du bytter skole, per nivå.', ic: '📣', max: 10, c: (lv) => 1 + lv },
    { id: 'kf', n: 'Gammel vane', d: 'Du beholder de varige fordelene når du bytter kommune.', ic: '🎒', max: 1, c: () => 4 },
    { id: 'ke', n: 'Kjent i hele landet', d: 'Start hver skole ett område lenger fram (etter Stortinget), per nivå.', ic: '🚄', max: 3, c: (lv) => 3 + lv * 3 },
    { id: 'kb', n: 'Sjefsknuser', d: 'Sjefene har ett liv mindre per nivå.', ic: '🥊', max: 2, c: (lv) => 4 + lv * 4 },
    { id: 'km', n: 'Minispillmester', d: 'Minispillene gir dobbelt så mye.', ic: '🎲', max: 1, c: () => 3 },
    { id: 'kg', n: 'Gylden kommune', d: 'Gullstjernene gir dobbelt så mye.', ic: '🌟', max: 1, c: () => 4 },
    { id: 'kh', n: 'Ekstra hjerte', d: 'Ett liv mer i sjefskamper.', ic: '❤️', max: 1, c: () => 5 },
];

/* ================= Talenttreet (Ryktebørsen) ================= */
// Tre greiner. Hver node er enten et nivå (RANKS) eller en varig fordel (PERKS).
// En node kan kjøpes når forelderen har minst ett nivå.
export interface TNode {
    id: string;
    parent?: string;
}
export const TREE: { id: string; n: string; ic: string; d: string; nodes: TNode[] }[] = [
    {
        id: 'hund',
        n: 'Hundeeieren',
        ic: '🐕',
        d: 'Produksjon og en raskere start',
        nodes: [
            { id: 'lp' },
            { id: 'dyn', parent: 'lp' },
            { id: 'dyn2', parent: 'dyn' },
            { id: 'dyn3', parent: 'dyn2' },
            { id: 'autoupg', parent: 'dyn3' },
            { id: 'lm', parent: 'lp' },
            { id: 'disc', parent: 'lp' },
            { id: 'ld', parent: 'disc' },
            { id: 'start', parent: 'lp' },
            { id: 'ls', parent: 'start' },
            { id: 'era1', parent: 'start' },
            { id: 'era2', parent: 'era1' },
            { id: 'era3', parent: 'era2' },
            { id: 'offline', parent: 'start' },
        ],
    },
    {
        id: 'lur',
        n: 'Løgneren',
        ic: '🤥',
        d: 'Klikk, gullstjerner og flaks',
        nodes: [
            { id: 'lc' },
            { id: 'auto', parent: 'lc' },
            { id: 'lx', parent: 'lc' },
            { id: 'star', parent: 'lc' },
            { id: 'lg', parent: 'star' },
            { id: 'lb', parent: 'star' },
            { id: 'verb', parent: 'lc' },
            { id: 'le', parent: 'verb' },
        ],
    },
    {
        id: 'les',
        n: 'Lesehesten',
        ic: '📚',
        d: 'Lynprøver og sjefskamper',
        nodes: [
            { id: 'lq' },
            { id: 'lt', parent: 'lq' },
            { id: 'bokorm', parent: 'lt' },
            { id: 'lh', parent: 'lq' },
            { id: 'svak', parent: 'lh' },
            { id: 'lk', parent: 'lq' },
        ],
    },
];

/* ================= Minispill: kommunestyret ================= */
export interface Law {
    id: string;
    n: string;
    ic: string;
    up: string;
    down: string;
}
export const LAWS: Law[] = [
    { id: 'fre', n: 'Leksefri fredag', ic: '🎉', up: 'Produksjon ×1,5', down: 'Lynprøver gir halvparten' },
    { id: 'kaffe', n: 'Gratis kaffe til lærerne', ic: '☕', up: 'Læreren kommer halvparten så ofte', down: 'Gullstjerner kommer 20 % sjeldnere' },
    { id: 'mobil', n: 'Mobilforbud', ic: '📵', up: 'Klikk ×3', down: 'Produksjon ×0,8' },
    { id: 'bacon', n: 'Skolemat med bacon', ic: '🥓', up: 'Hunder lager ×5', down: 'Alle andre medskyldige ×0,9' },
    { id: 'fri', n: 'Lengre friminutt', ic: '🛝', up: 'Gullstjerner varer 50 % lenger', down: 'Flyten synker dobbelt så fort' },
    { id: 'bib', n: 'Ny bibliotekar', ic: '📖', up: 'Lynprøver gir ×3', down: 'Læreren kommer oftere' },
    { id: 'super', n: 'Superunnskyldningsloven', ic: '💥', up: 'Superunnskyldninger dobbelt så ofte', down: 'Klikk ×0,7' },
    { id: 'mus', n: 'Musene er fredet', ic: '🐭', up: 'Mus gir dobbelt så mye tilbake', down: 'Mus spiser dobbelt så mye' },
];
export const LAW_CD = 120; // sekunder før en plass kan byttes igjen

/* ================= Minispill: børsen på Stortinget ================= */
export const STOCKS: { n: string; ic: string; vol: number }[] = [
    { n: 'Hundemat ASA', ic: '🦴', vol: 0.05 },
    { n: 'Wifi-feil AS', ic: '📡', vol: 0.09 },
    { n: 'Bestemor Holding', ic: '🎂', vol: 0.03 },
    { n: 'Magevondt Pharma', ic: '💊', vol: 0.07 },
    { n: 'Tidsreiser ASA', ic: '⏳', vol: 0.12 },
];
export const STOCK_TICK = 5; // sekunder mellom hver kursendring

/* ================= Minispill: bløff med rektor ================= */
export const BLUFF_ROUNDS = 5;
export const BLUFF_CD = 150;

/* ================= Minispill: planetbanen ================= */
export const ORBIT_PERIODS = [10, 15, 30]; // sekunder per runde. På linje hvert 30. sekund
export const ORBIT_MULT = 3;

/* ================= Unnskyldningsverkstedet ================= */
export interface VCard {
    t: string;
    tag: string; // kortene passer sammen når de har samme tag
    r?: number; // sjeldenhet: 1 vanlig, 2 sjelden, 3 legendarisk
    need?: number; // medskyldig du må eie for å få kortet
}
export const V_SLOTS = ['Hvem', 'Gjorde hva', 'Med hva', 'Fordi'];
export const VCARDS: VCard[][] = [
    [
        { t: 'Hunden', tag: 'dyr' },
        { t: 'Katten', tag: 'dyr' },
        { t: 'Lillebror', tag: 'familie', need: 1 },
        { t: 'Bestemor', tag: 'familie', need: 4 },
        { t: 'Wifi-en', tag: 'teknikk', need: 3 },
        { t: 'Skrivaren', tag: 'teknikk' },
        { t: 'Vaktmesteren', tag: 'skole' },
        { t: 'Rektor', tag: 'skole' },
        { t: 'En tidsreisende', tag: 'rom', need: 7, r: 2 },
        { t: 'Klonen min', tag: 'rom', need: 13, r: 2 },
        { t: 'Et svart hull', tag: 'rom', need: 12, r: 3 },
        { t: 'Stortinget', tag: 'skole', need: 6, r: 2 },
    ],
    [
        { t: 'spiste', tag: 'dyr' },
        { t: 'gravde ned', tag: 'dyr' },
        { t: 'tegnet på', tag: 'familie' },
        { t: 'pakket inn', tag: 'familie' },
        { t: 'slettet', tag: 'teknikk' },
        { t: 'lastet aldri opp', tag: 'teknikk' },
        { t: 'konfiskerte', tag: 'skole' },
        { t: 'vedtok å forby', tag: 'skole', r: 2 },
        { t: 'sendte til år 3000', tag: 'rom', r: 2 },
        { t: 'slukte', tag: 'rom', r: 3 },
    ],
    [
        { t: 'leksa', tag: 'dyr' },
        { t: 'matteboka', tag: 'skole' },
        { t: 'sidemålsstilen', tag: 'skole' },
        { t: 'kladdeboka', tag: 'familie' },
        { t: 'hele ranselen', tag: 'familie' },
        { t: 'minnepinnen', tag: 'teknikk' },
        { t: 'iPaden', tag: 'teknikk' },
        { t: 'alle tirsdager', tag: 'rom', r: 2 },
        { t: 'selve tiden', tag: 'rom', r: 3 },
    ],
    [
        { t: 'den var sulten', tag: 'dyr' },
        { t: 'den trodde det var en pinne', tag: 'dyr' },
        { t: 'han er tre år', tag: 'familie' },
        { t: 'det var bursdag igjen', tag: 'familie' },
        { t: 'oppdateringen feilet', tag: 'teknikk' },
        { t: 'passordet var «passord»', tag: 'teknikk' },
        { t: 'det var tirsdag', tag: 'skole' },
        { t: 'det var brannøvelse', tag: 'skole' },
        { t: 'tiden gikk baklengs', tag: 'rom', r: 2 },
        { t: 'universet startet på nytt', tag: 'rom', r: 3 },
    ],
];
// Kombinasjoner med egne navn
export const V_COMBOS: { n: string; parts: string[]; mult: number }[] = [
    { n: 'Klassikeren', parts: ['Hunden', 'spiste', 'leksa', 'den var sulten'], mult: 12 },
    { n: 'Lillebror-loven', parts: ['Lillebror', 'tegnet på', '', 'han er tre år'], mult: 6 },
    { n: 'Teknisk svikt', parts: ['Wifi-en', 'lastet aldri opp', '', 'oppdateringen feilet'], mult: 6 },
    { n: 'Den kosmiske', parts: ['Et svart hull', 'slukte', 'selve tiden', 'universet startet på nytt'], mult: 25 },
];
export const V_CD = 90; // sekunder mellom hver unnskyldning
export const V_TAGS: Record<string, string> = { dyr: 'Dyr', familie: 'Familie', teknikk: 'Teknikk', skole: 'Skole', rom: 'Verdensrommet' };
