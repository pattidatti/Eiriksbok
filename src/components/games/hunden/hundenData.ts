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
    seen: Record<string, 1>; // oppdagelser på scenen
    run: RunStats; // denne skolen, til rapportkortet
}

/** Det som skjer på én skole. Nullstilles ved skolebytte og blir rapportkortet. */
export interface RunStats {
    clicks: number;
    crits: number;
    gold: number;
    honest: number;
    tries: number;
    time: number;
    events: number;
}
export const freshRun = (): RunStats => ({ clicks: 0, crits: 0, gold: 0, honest: 0, tries: 0, time: 0, events: 0 });

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
    quizTime: 30, // sekunder til å svare på lynprøven
    quizBase: 5, // lynprøve-belønning = vanlig belønning × (quizBase + rekke)
    quizStreakMax: 5,
    offlineCap: 12 * 3600, // maks offline-tid (sek)
    flowGain: 0.07,
    flowDecay: 0.45,
    flowMax: 2, // flyt: +per klikk, −per sek, maks ekstra multiplikator
    minClickGap: 40, // ms mellom klikk som teller. Stopper autoklikkere og holdt Enter
    msAt: [10, 25, 50, 100, 200], // milepæler per medskyldig
    msMult: 1.5, // hver milepæl: medskyldigen lager så mye mer
    critChance: 0.05, // superunnskyldning: sjanse per klikk
    critMult: 10,
    eventFirst: 60, // sekunder til første tilfeldige hendelse
    eventMin: 80,
    eventMax: 160,
    // Arket slites: kaffe, poter, tape ... (unnskyldninger denne runden)
    wear: [400, 2e4, 6e5, 2e7, 8e8, 3e10, 2e12],
};

export interface Producer {
    n: string;
    p: string;
    d: string;
    c: number;
    r: number;
    s: string;
    ic: string; // figuren som står på skrivebordet
}

export const P: Producer[] = [
    { n: 'Hund', p: 'Hunder', d: 'Spiser leksene. Har aldri gjort noe galt i hele sitt liv.', c: 15, r: 0.1, s: 'HU', ic: '🐕' },
    { n: 'Lillebror', p: 'Lillebrødre', d: 'Får skylda for alt. Er tre år og kan ikke forsvare seg.', c: 100, r: 1, s: 'LB', ic: '👶' },
    { n: 'Magevondt-maskin', p: 'Maskiner', d: 'Lager plutselig vondt i magen. Virker bare mellom 08:15 og 14:30.', c: 1100, r: 8, s: 'MV', ic: '🤢' },
    { n: 'Wifi-sabotør', p: 'Sabotører', d: '«Jeg leverte, men det lastet aldri opp.»', c: 12000, r: 47, s: 'WF', ic: '📡' },
    { n: 'Bestemors bursdag', p: 'Bestemødre', d: 'Bestemor fyller år igjen. Fjerde gang denne måneden.', c: 130000, r: 260, s: 'BM', ic: '🎂' },
    { n: 'Unnskyldningsfabrikk', p: 'Fabrikker', d: 'Lager «jeg glemte boka på skolen» på samlebånd.', c: 1.4e6, r: 1400, s: 'UF', ic: '🏭' },
    { n: 'Lobbyist på Stortinget', p: 'Lobbyister', d: 'Jobber for at retten til å glemme skal stå i Grunnloven.', c: 2e7, r: 7800, s: 'LO', ic: '💼' },
    { n: 'Tidsmaskin', p: 'Tidsmaskiner', d: 'Reiser tilbake og sørger for at leksa aldri ble gitt.', c: 3.3e8, r: 44000, s: 'TM', ic: '⏳' },
    { n: 'Unnskyldningsreligion', p: 'Menigheter', d: 'Tusenvis av tilhengere. Hellig dag: innleveringsfristen.', c: 5.1e9, r: 260000, s: 'UR', ic: '🕯️' },
    { n: 'Parallelt univers', p: 'Universer', d: 'Et univers der læreren glemte å gi lekser. Hentet hit.', c: 7.5e10, r: 1.6e6, s: 'PU', ic: '🌀' },
    { n: 'Diplomat til lærerværelset', p: 'Diplomater', d: 'Forhandler om frister ved kaffemaskinen. Ingen får skyte.', c: 1e12, r: 1e7, s: 'DI', ic: '🕊️' },
    { n: 'Avskaffelse av tirsdag', p: 'Avskaffede tirsdager', d: 'Ingen tirsdag, ingen frist. Kalenderen protesterer.', c: 1.4e13, r: 6.5e7, s: 'TI', ic: '📅' },
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
    ic?: string; // klistremerket som havner på leksearket
    hint?: string; // vises som «???» før oppgraderingen er låst opp
}

export const UP: Upgrade[] = [
    { id: 'c1', n: 'Blyant med viskelær', d: 'Visker ut alle bevis.', e: 'Klikk ×2', c: 100, q: (s) => s.clicks >= 15, cm: 2, ic: '✏️', hint: 'Klikk på leksa noen ganger til.' },
    { id: 'c2', n: 'Kurs i å finne på ting', d: 'Lærer deg å lyve om andre enn deg selv.', e: 'Klikk ×2', c: 600, q: (s) => s.clicks >= 60, cm: 2, ic: '📚', hint: 'Klikk mye. Noen holder kurs for sånne som deg.' },
    { id: 'gs', n: 'Gullstjernemagnet', d: 'Læreren deler ut stjerner som aldri før.', e: 'Gullstjerner kommer dobbelt så ofte', c: 2e5, q: (s) => s.goldClicks >= 1, gf: 2, ic: '🧲', hint: 'Fang en gullstjerne.' },
    { id: 'c3', n: 'Løgnerens penn', d: 'Skriver ting som aldri har skjedd.', e: 'Klikk gir +1 % av det du lager per sekund', c: 12000, q: (s) => s.owned.some((x) => x >= 10), cp: 0.01, ic: '🖋️', hint: 'Eie ti av samme medskyldig.' },
    { id: 'c4', n: 'Teater på onsdager', d: '«Ja, og så spiste hunden den.»', e: 'Klikk ×2 og +1 % av /s', c: 150000, q: (s) => s.clicks >= 400, cm: 2, cp: 0.01, ic: '🎭', hint: 'Teaterlæreren teller klikkene dine. Hun vil se 400.' },
    { id: 'g1', n: 'Felles unnskyldningsdokument', d: 'Hele klassen skriver i det. Ingen leser det.', e: 'All produksjon ×1,5', c: 5e5, q: (s) => s.era >= 1, gm: 1.5, ic: '📄', hint: 'Kommer når rektor kaller deg inn.' },
    { id: 'gd', n: 'Langfriminutt', d: 'Friminuttet varer til det er over.', e: 'Gullstjerner virker dobbelt så lenge', c: 8e6, q: (s) => s.goldClicks >= 3, gdur: 2, ic: '🔔', hint: 'Fang tre gullstjerner.' },
    { id: 'h1', n: 'Lesehest', d: 'Du leste faktisk kapitlet. Læreren er i sjokk.', e: 'Lynprøver gir dobbelt så mye', c: 1e6, q: (s) => s.honest >= 2, hq: 2, ic: '📖', hint: 'Bevis to ganger at du faktisk gjorde leksa.' },
    { id: 'c5', n: 'Doktorgrad i bortforklaring', d: 'Tittel: «Det var ikke meg (2026)».', e: 'Klikk gir +2 % av /s', c: 2e7, q: (s) => s.era >= 2, cp: 0.02, ic: '🎓', hint: 'Kommunen deler ut fine titler.' },
    { id: 'h2', n: 'Lånekort på biblioteket', d: 'Du vet hvor svarene står.', e: '+10 sekunder på lynprøver', c: 4e7, q: (s) => s.honest >= 5, ht: 10, ic: '📇', hint: 'Biblioteket liker elever som svarer riktig fem ganger.' },
    { id: 'g2', n: 'Unnskyldning på abonnement', d: '49 kr i måneden. Første lekse er gratis.', e: 'All produksjon ×2', c: 5e8, q: (s) => s.era >= 2, gm: 2, ic: '💳', hint: 'Noe med abonnement. Finnes i kommunestyret.' },
    { id: 'h3', n: 'Skriveboka er full', d: 'Hver side er brukt. Ekte notater.', e: 'Lynprøver gir dobbelt så mye', c: 2e9, q: (s) => s.honest >= 10, hq: 2, ic: '📓', hint: 'Svar riktig på ti lynprøver.' },
    { id: 'c6', n: 'Tunge av sølv', d: 'Snakker seg ut av alt, også fysikkens lover.', e: 'Klikk ×3', c: 3e9, q: (s) => s.era >= 3, cm: 3, ic: '👅', hint: 'Stortinget har en talerstol.' },
    { id: 'c7', n: 'Penn som skriver gjennom tiden', d: 'Unnskyldningen er levert før leksa ble gitt.', e: 'Klikk gir +3 % av /s', c: 5e11, q: (s) => s.era >= 4, cp: 0.03, ic: '🌠', hint: 'FN har en penn som ingen andre har.' },
    { id: 'g3', n: 'FN-veto mot lekser', d: 'Fem land stemte mot. Alle hadde glemt leksa.', e: 'All produksjon ×2', c: 5e12, q: (s) => s.era >= 4, gm: 2, ic: '🌐', hint: 'Et veto venter i FN.' },
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
    ['Tiden selv melder seg syk', 'Sola glemte å stå opp. Skylder på skyene', 'Galakser utsetter kollisjon til etter helgen', 'Universets lærer: «Jeg er ikke sint, bare skuffet»', 'Svart hull spiste leksa. Hunden er lettet', 'Big Bang avlyst på grunn av dårlig vær', 'Melkeveien ber om utsatt frist på grunn av sykdom', 'Romvesener ber om å få låne unnskyldningene dine'],
];
// Flere overskrifter per område, lagt til etter første versjon
const HEAD_MORE = [
    ['Matteboka funnet i hundens matskål', 'Elev i 10B rekker opp hånda: «Kan jeg gå på do i 45 minutter?»', 'Vaktmester: «Jeg har aldri sett så mange hunder i en gang»', 'Garderoben stengt: full av unnskyldninger', 'Lærer fant leksa. Den var blank'],
    ['Rektor har kjøpt eget hundebur til kontoret', 'Skolebussen kom for sent. Den hadde også en unnskyldning', 'Inspektøren tar seg fri: «Hunden spiste timeplanen»', 'Skolens hjemmeside nede. Wifi-sabotøren nekter for alt'],
    ['Kommunen bygger ny hundepark ved skolen', 'Ordføreren ber om utsatt frist på budsjettet', 'Ny vei bygget. Den går rundt leksene', 'Kommunelegen: magevondt sprer seg raskere enn vanlig'],
    ['Statsministeren ble spurt om leksa. Svarte «neste spørsmål»', 'Lobbyister melder om rekordår', 'Kongen: «Jeg hadde også en hund en gang»', 'Ny lov: Bestemødre kan bare ha bursdag to ganger i måneden'],
    ['FN innfører internasjonal hundedag hver dag', 'Fredsforhandlinger utsatt. Alle glemte notatene sine', 'Sikkerhetsrådet spiser lunsj. Hunden var der først', 'Verdensbanken låner ut unnskyldninger til lav rente'],
    [],
];
HEAD_MORE.forEach((l, i) => HEAD[i].push(...l));

/** Milepæler: overskriften når du eier 10, 25, 50, 100 og 200 av en medskyldig. */
export const MS_HEAD: string[][] = [
    ['Hundene stifter fagforening', 'Hundene krever egen matpause', 'Hundene har tatt over gymsalen', 'Hundene har fått egen kommune', 'Hundene snakker nå flytende norsk'],
    ['Lillebrødrene danner bande', 'Lillebrødrene lærer å sukke tungt', 'Lillebrødrene har egen advokat', 'Lillebrødrene har stemmerett', 'Lillebrødrene styrer barnehagene'],
    ['Magevondt-maskinene går på skift', 'Magevondt registrert som sport', 'Magevondt på resept', 'Magevondt er nå nasjonalrett', 'Maskinene har fått magevondt selv'],
    ['Ingen i byen har internett lenger', 'Sabotørene har eget kontor i ruteren', 'Mobilnettet går på sabotørenes nåde', 'Satellittene har gitt opp', 'Wifi er nå bare et rykte'],
    ['Bestemødrene fyller kantina', 'Bursdagskaker bestilt til hele året', 'Bestemødrene stifter parti', 'Bestemødrene har eget tv-program', 'Bestemødre utgjør nå halve befolkningen'],
    ['Fabrikkene går natt og dag', 'Unnskyldninger blir eksportvare', 'Fabrikkene lager nå unnskyldninger for fabrikkene', 'Unnskyldningsindustrien er størst i Norden', 'Fabrikkene har fått sin egen unnskyldning'],
    ['Lobbyistene fyller vandrehallen', 'Lobbyistene har egen stol i salen', 'Lobbyistene lobber for flere lobbyister', 'Stortinget flytter inn hos lobbyistene', 'Lobbyistene har sin egen lobbyist'],
    ['Tidsmaskinene står i kø', 'Ingen vet lenger hvilken dag det er', 'Mandag har skjedd tre ganger denne uka', 'Fortiden ber om fred', 'Tiden har fått tidsmaskin selv'],
    ['Menighetene fyller fotballbanen', 'Ny høytid: «Fristen som forsvant»', 'Pilegrimer går til kantina', 'Profeten i 9C har fått følgere i hele verden', 'Alle helligdager er nå innleveringsdager'],
    ['Universene står i kø ved portalen', 'Ett univers har bare fredager', 'Universene bytter lekser seg imellom', 'Universene har startet et eget FN', 'Det finnes ikke flere universer igjen å hente'],
    ['Diplomatene har tatt over lærerværelset', 'Kaffemaskinen er nå nøytralt område', 'Fredsavtalen gir alle en ekstra uke', 'Diplomatene forhandler med seg selv', 'Lærerværelset har eget flagg'],
    ['Tirsdag finnes bare i museet', 'Onsdag skjelver', 'Kalenderen har bare helger igjen', 'Uka er nå tre dager lang', 'Tiden selv har gått på ferie'],
];

/** Superunnskyldning: et kritisk klikk. */
export const CRIT_EXCUSES = [
    'En ørn tok leksa. Jeg har bilde.',
    'Leksa ble valgt til president i et annet land',
    'Jeg gjorde den, men den gikk i dvale',
    'Den ble stjålet av en ninja. En liten en.',
    'Hunden spiste den og leverte den selv',
    'Den er i Bermudatriangelet nå',
    'En vulkan hadde utbrudd. På pulten min.',
    'Leksa rømte. Jeg har varslet politiet.',
    'Jeg byttet den mot en geit',
    'Romvesener tok den med til planeten sin',
    'Den ble til is. Så smeltet den.',
    'Jeg lånte den bort til en dinosaur',
];

/** Det figurene sier når du klikker på dem i rommet. */
export const POKE: Record<string, string[]> = {
    dog: ['Voff. Jeg spiste ikke leksa. Jeg spiste matteboka.', 'Mer papir, takk.', 'Jeg har aldri sett den leksa før.', 'Sidemål smaker best.'],
    baby: ['Det var ikke meg!', 'Jeg er tre år. Jeg vet ingenting.', 'Bæsj.', 'Jeg tegnet bare litt på den.'],
    gas: ['Blubb.', 'Det gjør vondt nå. Akkurat nå.', 'Ring hjem. Si det er magen.'],
    dish: ['Lastet ikke opp. Prøv igjen aldri.', 'Signalet er borte. Som planlagt.', 'Bzzzt.'],
    granny: ['Jeg fyller år i dag igjen, vennen.', 'Har du spist?', 'Kaken er i ovnen. Leksa også.'],
    factory: ['Unnskyldning nummer 4 000 000 er klar.', 'Vi kjører skift hele natta.', 'Kvalitetskontroll: godkjent.'],
    lobby: ['Jeg har en avtale med statsråden.', 'Lekser bør være frivillige. Mener jeg.', 'Kan jeg spandere en lunsj?'],
    portal: ['Leksa er levert i 1987.', 'Pass deg for dinosaurene.', 'Tidsreiser tar tid.'],
    candle: ['Fristen er hellig. Derfor rører vi den ikke.', 'Ommm ... glemte boka ... ommm.', 'Velsignet være hunden.'],
    rift: ['I mitt univers finnes ikke lekser.', 'Hei fra den andre siden.', 'Jeg er deg, bare uten lekser.'],
    dove: ['Fred være med leksa.', 'Kaffen er nøytral grunn.', 'Kurr.'],
    calendar: ['Tirsdag? Aldri hørt om.', 'Det er fredag. Det er alltid fredag.', 'Fristen er strøket.'],
    stampede: ['STORMLØP!', 'Vi skal ingen steder!'],
    dino: ['RAAAWR. Leksa var god.', 'Jeg kom fra fortiden for denne?'],
    mirror: ['Jeg er deg fra et univers uten lekser.', 'Hei, meg!'],
    pilgrim: ['Jeg går til kantina. Det er en lang reise.', 'Velsignet være fristen.'],
    teacher: ['Jeg ser deg.', 'Hvor er leksa?', 'Ikke prøv deg.'],
};

/** Hvert område har sitt eget verb: en knapp med nedkjøling. */
export interface Verb {
    n: string; // knappetekst
    ic: string;
    d: string; // forklaring
    cd: number; // sekunder før den kan brukes igjen
    done: string; // toast når den brukes
}
export const VERBS: Verb[] = [
    { n: 'Skyld på naboen', ic: '👉', d: 'Gir med en gang det du lager på 45 sekunder.', cd: 60, done: 'Naboen tok skylda. Han vet det ikke ennå.' },
    { n: 'Lov å forbedre deg', ic: '🤞', d: 'Flyten holder seg på topp i 20 sekunder.', cd: 90, done: 'Rektor tror på deg. Flyten står stille på topp.' },
    { n: 'Vedta lov', ic: '⚖️', d: 'All produksjon ×3 i 30 sekunder.', cd: 120, done: 'Loven er vedtatt. Lekser er nå frivillige i 30 sekunder.' },
    { n: 'Hold tale', ic: '🎤', d: 'Talen er så lang at en gullstjerne kommer for å stoppe den.', cd: 150, done: 'Du snakket i to timer. En gullstjerne dukker opp.' },
    { n: 'Legg ned veto', ic: '✋', d: 'Fjerner alle straffer og gir klikk ×5 i 15 sekunder.', cd: 120, done: 'VETO! Alle straffer er opphevet.' },
    { n: 'Spol tiden', ic: '⏩', d: 'Hopper 10 minutter fram. Du får alt du ville laget i mellomtiden.', cd: 180, done: 'Tiden er spolt fram. Ingen merket noe.' },
];

/** Lærerens kommentar på rapportkortet. */
export const REPORT_SAY = [
    'Svært kreativ. Dessverre.',
    'Har et spesielt forhold til dyr.',
    'Hunden har gjort store framskritt. Eleven også, litt.',
    'Bør bruke fantasien på leksene.',
    'Har aldri levert noe, men har alltid en god grunn.',
    'Lillebror bør få egen karakter.',
    'Kommer langt i livet. Spørsmålet er hvor.',
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
        seen: {},
        run: freshRun(),
    };
}
