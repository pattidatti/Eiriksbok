// Tall og tekster for «Hunden spiste leksa» (`/oving/hunden-spiste-leksa`).
// Ren data uten DOM: balansen justeres her, motoren ligger i hundenGame.ts.

export interface Settings {
    sound: boolean;
    reduce: boolean;
}

export interface State {
    v: number;
    bank: number;
    runTotal: number;
    allTotal: number;
    clicks: number;
    owned: number[];
    upg: Record<string, 1>;
    era: number;
    maxEra: number;
    rev: number;
    rykte: number;
    ryktePts: number;
    perks: Record<string, 1>;
    resets: number;
    school: number;
    hints: Record<string, 1>;
    set: Settings;
    last: number;
    buy: number | 'max';
    played: number;
    goldClicks: number;
    // Lynprøven: læreren ber deg bevise at du faktisk gjorde leksa
    honest: number;
    honestTries: number;
    honestStreak: number;
}

/* ================= BALANSE - juster tallene her ================= */
export const BAL = {
    costGrowth: 1.15, // prisøkning per kjøpt medskyldig
    eras: [0, 5e3, 5e5, 3e7, 5e10, 1e14], // unnskyldninger (denne runden) for hver æra
    rykteDiv: 1e7, // rykte = floor(sqrt(totalt / rykteDiv))
    ryktePct: 0.05, // +5 % produksjon per rykte
    goldFirst: 35,
    goldMin: 70,
    goldMax: 150, // sekunder mellom gullstjerner
    teachMin: 75,
    teachMax: 150,
    teachTime: 6, // lærerbesøk: sekunder til å velge
    quizTime: 15, // sekunder til å svare på lynprøven
    quizBase: 5, // lynprøve-belønning = vanlig belønning × (quizBase + rekke)
    quizStreakMax: 5,
    offlineCap: 12 * 3600, // maks offline-tid (sek)
    flowGain: 0.07,
    flowDecay: 0.45,
    flowMax: 2, // flyt: +per klikk, −per sek, maks ekstra multiplikator
    minClickGap: 40, // ms mellom klikk som teller. Stopper autoklikkere og holdt Enter
};

export interface Producer {
    n: string;
    p: string;
    d: string;
    c: number;
    r: number;
    s: string;
}

export const P: Producer[] = [
    { n: 'Hund', p: 'Hunder', d: 'Spiser leksene. Har aldri gjort noe galt i hele sitt liv.', c: 15, r: 0.1, s: 'HU' },
    { n: 'Lillebror', p: 'Lillebrødre', d: 'Får skylda for alt. Er tre år og kan ikke forsvare seg.', c: 100, r: 1, s: 'LB' },
    { n: 'Magevondt-maskin', p: 'Maskiner', d: 'Lager plutselig vondt i magen. Virker bare mellom 08:15 og 14:30.', c: 1100, r: 8, s: 'MV' },
    { n: 'Wifi-sabotør', p: 'Sabotører', d: '«Jeg leverte, men det lastet aldri opp.»', c: 12000, r: 47, s: 'WF' },
    { n: 'Bestemors bursdag', p: 'Bestemødre', d: 'Bestemor fyller år igjen. Fjerde gang denne måneden.', c: 130000, r: 260, s: 'BM' },
    { n: 'Unnskyldningsfabrikk', p: 'Fabrikker', d: 'Lager «jeg glemte boka på skolen» på samlebånd.', c: 1.4e6, r: 1400, s: 'UF' },
    { n: 'Lobbyist på Stortinget', p: 'Lobbyister', d: 'Jobber for at retten til å glemme skal stå i Grunnloven.', c: 2e7, r: 7800, s: 'LO' },
    { n: 'Tidsmaskin', p: 'Tidsmaskiner', d: 'Reiser tilbake og sørger for at leksa aldri ble gitt.', c: 3.3e8, r: 44000, s: 'TM' },
    { n: 'Unnskyldningsreligion', p: 'Menigheter', d: 'Tusenvis av tilhengere. Hellig dag: innleveringsfristen.', c: 5.1e9, r: 260000, s: 'UR' },
    { n: 'Parallelt univers', p: 'Universer', d: 'Et univers der læreren glemte å gi lekser. Hentet hit.', c: 7.5e10, r: 1.6e6, s: 'PU' },
    { n: 'Diplomat til lærerværelset', p: 'Diplomater', d: 'Forhandler om frister ved kaffemaskinen. Ingen får skyte.', c: 1e12, r: 1e7, s: 'DI' },
    { n: 'Avskaffelse av tirsdag', p: 'Avskaffede tirsdager', d: 'Ingen tirsdag, ingen frist. Kalenderen protesterer.', c: 1.4e13, r: 6.5e7, s: 'TI' },
];

const PU = [
    ['Sultnere hund', 'Hund med magesekk av stål', 'Hundepensjonat'],
    ['Lillebror lærer å snakke', 'Tvillinglillebror', 'Lillebror med eget PR-byrå'],
    ['Turbo-magevondt', 'Magevondt i skuddår', 'Evig mandag'],
    ['Mikrobølgeovn ved ruteren', 'Hamster i fiberkabelen', 'Solstorm (bestilt)'],
    ['Bestemor nr. 7', 'Bestemor-kloning', 'Bestemorkonferansen'],
    ['Samlebånd', 'Fagforening for unnskyldninger', 'Skiftarbeid på julaften'],
    ['Dyrere dress', 'Lunsj med statsråden', 'Eget parti på Stortinget'],
    ['Leksa er fra fremtiden', 'Bestefarparadokset', 'Evig sommerferie'],
    ['Hellig skrift: «Glemte boka»', 'Pilegrimsferd til kantina', 'Profet i 9C'],
    ['Univers der lekser er ulovlig', 'Portal i gymgarderoben', 'Universer på franchise'],
    ['Ambassade ved kaffemaskinen', 'Fredsavtalen fra pauserommet', 'Fritatt for prøver'],
    ['Onsdag også', 'Ukedager er bare noe vi har funnet på', 'Tiden selv gir opp'],
];
const TIER_COST = [10, 50, 500, 5000];
const TIER_REQ = [1, 10, 25, 50];

export interface Upgrade {
    id: string;
    n: string;
    d: string;
    e: string;
    c: number;
    q: (s: State) => boolean;
    cm?: number; // klikk ×
    cp?: number; // klikk + andel av /s
    gm?: number; // all produksjon ×
    gf?: number; // gullstjerner oftere
    gdur?: number; // gullstjerner varer lenger
    hq?: number; // lynprøve-belønning ×
    ht?: number; // ekstra sekunder på lynprøven
    pi?: number; // dobler én medskyldig
}

export const UP: Upgrade[] = [
    { id: 'c1', n: 'Blyant med viskelær', d: 'Visker ut alle bevis.', e: 'Klikk ×2', c: 100, q: (s) => s.clicks >= 15, cm: 2 },
    { id: 'c2', n: 'Kurs i å finne på ting', d: 'Lærer deg å lyve om andre enn deg selv.', e: 'Klikk ×2', c: 600, q: (s) => s.clicks >= 60, cm: 2 },
    { id: 'gs', n: 'Gullstjernemagnet', d: 'Læreren deler ut stjerner som aldri før.', e: 'Gullstjerner kommer dobbelt så ofte', c: 2e5, q: (s) => s.goldClicks >= 1, gf: 2 },
    { id: 'c3', n: 'Løgnerens penn', d: 'Skriver ting som aldri har skjedd.', e: 'Klikk gir +1 % av det du lager per sekund', c: 12000, q: (s) => s.owned.some((x) => x >= 10), cp: 0.01 },
    { id: 'c4', n: 'Teater på onsdager', d: '«Ja, og så spiste hunden den.»', e: 'Klikk ×2 og +1 % av /s', c: 150000, q: (s) => s.clicks >= 400, cm: 2, cp: 0.01 },
    { id: 'g1', n: 'Felles unnskyldningsdokument', d: 'Hele klassen skriver i det. Ingen leser det.', e: 'All produksjon ×1,5', c: 5e5, q: (s) => s.era >= 1, gm: 1.5 },
    { id: 'gd', n: 'Langfriminutt', d: 'Friminuttet varer til det er over.', e: 'Gullstjerner virker dobbelt så lenge', c: 8e6, q: (s) => s.goldClicks >= 3, gdur: 2 },
    { id: 'h1', n: 'Lesehest', d: 'Du leste faktisk kapitlet. Læreren er i sjokk.', e: 'Lynprøver gir dobbelt så mye', c: 1e6, q: (s) => s.honest >= 2, hq: 2 },
    { id: 'c5', n: 'Doktorgrad i bortforklaring', d: 'Tittel: «Det var ikke meg (2026)».', e: 'Klikk gir +2 % av /s', c: 2e7, q: (s) => s.era >= 2, cp: 0.02 },
    { id: 'h2', n: 'Lånekort på biblioteket', d: 'Du vet hvor svarene står.', e: '+5 sekunder på lynprøver', c: 4e7, q: (s) => s.honest >= 5, ht: 5 },
    { id: 'g2', n: 'Unnskyldning på abonnement', d: '49 kr i måneden. Første lekse er gratis.', e: 'All produksjon ×2', c: 5e8, q: (s) => s.era >= 2, gm: 2 },
    { id: 'h3', n: 'Skriveboka er full', d: 'Hver side er brukt. Ekte notater.', e: 'Lynprøver gir dobbelt så mye', c: 2e9, q: (s) => s.honest >= 10, hq: 2 },
    { id: 'c6', n: 'Tunge av sølv', d: 'Snakker seg ut av alt, også fysikkens lover.', e: 'Klikk ×3', c: 3e9, q: (s) => s.era >= 3, cm: 3 },
    { id: 'c7', n: 'Penn som skriver gjennom tiden', d: 'Unnskyldningen er levert før leksa ble gitt.', e: 'Klikk gir +3 % av /s', c: 5e11, q: (s) => s.era >= 4, cp: 0.03 },
    { id: 'g3', n: 'FN-veto mot lekser', d: 'Fem land stemte mot. Alle hadde glemt leksa.', e: 'All produksjon ×2', c: 5e12, q: (s) => s.era >= 4, gm: 2 },
];
P.forEach((p, i) => {
    for (let t = 0; t < 4; t++) {
        UP.push({
            id: `p${i}_${t}`,
            n: t < 3 ? PU[i][t] : `Masseproduksjon: ${p.n.toLowerCase()}`,
            d: p.d,
            e: `${p.p} lager dobbelt så mye`,
            c: p.c * TIER_COST[t],
            q: (s) => s.owned[i] >= TIER_REQ[t],
            pi: i,
        });
    }
});
export const UPI: Record<string, Upgrade> = Object.fromEntries(UP.map((u) => [u.id, u]));

export interface Era {
    n: string;
    sheet: string;
    h?: string;
    sub?: string;
    u?: string;
}

export const ERAS: Era[] = [
    { n: 'Klasserom 10B', sheet: 'Lekse: Sidemål s. 47' },
    {
        n: 'Rektors kontor',
        sheet: 'Innkalling til rektor',
        h: 'ELEV I 10B HAR 5 000 UNNSKYLDNINGER. REKTOR KALLER INN TIL KRISEMØTE',
        sub: 'Rektor sier det er «ganske imponerende, egentlig».',
        u: 'Nytt: FLYT. Klikk raskt, så blir hvert klikk verdt opptil tre ganger så mye.',
    },
    {
        n: 'Kommunestyret',
        sheet: 'Kommunen spør om lekser',
        h: '«HUNDEN» ER NÅ STØRSTE ARBEIDSGIVER I KOMMUNEN',
        sub: 'Ordføreren vil ikke svare. Ordførerens hund spiste svaret.',
        u: 'Nytt: LÆREREN KOMMER. Velg en unnskyldning, eller bevis at du faktisk gjorde leksa.',
    },
    {
        n: 'Stortinget',
        sheet: 'Stortingsmelding nr. 47 (2026–2027)',
        h: 'STORTINGET SPLITTET: SKAL LEKSER FORBYS ELLER BARE UTSETTES?',
        sub: 'Saken er utsatt. Grunnen: «hunden».',
        u: 'Nytt: BYTT SKOLE. Start på nytt, men ryktet følger med og gir varig bonus.',
    },
    {
        n: 'FNs sikkerhetsråd',
        sheet: 'FN-vedtak 47/B: Leksefri jord',
        h: 'UNNSKYLDNINGER ER NÅ DET VERDEN SELGER MEST AV',
        sub: 'Norge bytter oljefondet mot et unnskyldningsfond.',
        u: 'Nye oppgraderinger er låst opp.',
    },
    {
        n: 'Universet',
        sheet: 'Universets hjemmelekse (frist: aldri)',
        h: 'UNIVERSET UTSETTER SEG SELV. TIDEN: «JEG HAR HATT EN TØFF UKE»',
        sub: 'Big Bang flyttes til neste semester.',
        u: 'Du har nådd slutten av tiden. Leksa er fortsatt ikke levert.',
    },
];

export const SCHOOLS = [
    'Tåkeheia ungdomsskole',
    'Regnvik skole',
    'Paraplydalen ungdomsskole',
    'Søleberget skole',
    'Tirsdagsvik skole',
    'Glemmestad ungdomsskole',
    'Sidemålsund skole',
    'Duskregn ungdomsskole',
];

export const EXCUSES = [
    'Hunden spiste den',
    'Wifi var nede',
    'Lillebror tegnet på den',
    'Den lastet ikke opp',
    'Bestemor hadde bursdag',
    'Jeg trodde fristen var i går',
    'Boka ligger på skolen',
    'Printeren hater meg',
    'Jeg leverte i et annet univers',
    'Kalenderen min er på engelsk',
    'Den ligger i skyen. Den ekte skyen.',
    'Mamma kastet den i papirgjenvinningen',
    'Katten satt på den',
    'Jeg skrev med usynlig blekk',
    'Jeg glemte at jeg husket',
    'Jeg har jobbet med den siden august',
    'Jeg ventet på inspirasjon',
    'Det er kunst. Tom side.',
    'Tirsdag ble avlyst',
    'Jeg ble forsinket av en due',
    'Jeg trodde sidemål var valgfritt',
    'Det var fullmåne',
    'Det regnet. I Bergen.',
    'En måke stjal den',
    'Jeg ble bortført (kort)',
    'Strømmen gikk. I hodet mitt.',
    'Jeg byttet navn',
    'Leksa er fortsatt i oppvaskmaskinen',
];

export const HEAD = [
    ['Forskere: hunder spiser nå 40 % flere lekser enn i fjor', 'Lillebror (3) nekter for alt', 'Ruter funnet i mikrobølgeovn på gutterommet', 'Elev sier arket «fordampet i varmen»', 'Lokal hund ansatt som rådgiver', 'Kantina åpner unnskyldningsbuffet'],
    ['Rektor åpner eget kontor for unnskyldninger', 'Bestemor (88) feirer bursdag for 31. gang i år', 'Foreldremøte avlyst: «hunden spiste innkallingen»', 'Skolens printer er gått konkurs'],
    ['Kommunen innfører unnskyldningsskatt', 'Dyrleger melder om rekordmange mette hunder', 'Magevondt regnes nå som fornybar energi', 'Ordfører: «Jeg har også glemt leksa mi»'],
    ['Stortinget vedtar lov om rett til å glemme', 'Statsbudsjettet utsatt: «det lastet ikke opp»', 'Opposisjonen krever at lekser leveres «snart»', 'NRK: Tirsdag kan være i fare'],
    ['FN: unnskyldninger er nå egne penger', 'Sikkerhetsrådet stemmer over hunden', 'Månen leverer ikke sin del av gruppeprosjektet', 'Mars ber om utsettelse'],
    ['Tiden selv melder seg syk', 'Sola glemte å stå opp. Skylder på skyene', 'Galakser utsetter kollisjon til etter helgen', 'Universets lærer: «Jeg er ikke sint, bare skuffet»'],
];

export interface Perk {
    id: string;
    n: string;
    d: string;
    c: number;
}

export const PERKS: Perk[] = [
    { id: 'auto', n: 'Klassekompis som klikker for deg', d: 'Klikker 4 ganger i sekundet. Ikke spør hvorfor.', c: 2 },
    { id: 'star', n: 'Kjendis i gangen', d: 'Gullstjerner dukker opp dobbelt så ofte.', c: 3 },
    { id: 'start', n: 'Arvet lillebror', d: 'Start hver skole med 10 hunder og 5 lillebrødre.', c: 5 },
    { id: 'offline', n: 'Sover i timen', d: 'Mens du er borte, jobber de i opptil 24 timer.', c: 8 },
    { id: 'disc', n: 'Rektors svoger', d: 'Alle medskyldige koster 10 % mindre.', c: 12 },
    { id: 'dyn', n: 'Unnskyldningsdynasti', d: 'All produksjon ×2. For alltid.', c: 25 },
];

export const TSAY = [
    'Hvor er leksa di?',
    'Hvorfor er arket helt tomt?',
    'Igjen? Forklar deg.',
    'Jeg venter på en forklaring.',
    'Er dette leksa? Det er en serviett.',
];

export function freshState(reduce: boolean): State {
    return {
        v: 1,
        bank: 0,
        runTotal: 0,
        allTotal: 0,
        clicks: 0,
        owned: P.map(() => 0),
        upg: {},
        era: 0,
        maxEra: 0,
        rev: 0,
        rykte: 0,
        ryktePts: 0,
        perks: {},
        resets: 0,
        school: 0,
        hints: {},
        set: { sound: true, reduce },
        last: Date.now(),
        buy: 1,
        played: 0,
        goldClicks: 0,
        honest: 0,
        honestTries: 0,
        honestStreak: 0,
    };
}
