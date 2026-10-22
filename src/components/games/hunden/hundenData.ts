import { BOSSES } from './hundenMore';

// Tall og tekster for «Hunden spiste leksa» (`/oving/hunden-spiste-leksa`).
// Ren data uten DOM: balansen justeres her, motoren ligger i hundenGame.ts.

export interface Settings {
    sound: boolean;
    reduce: boolean;
    music: boolean;
    mvol: number; // musikkvolum 0-1
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
    lv: Record<string, number>; // nivåer kjøpt i Ryktebørsen
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
    ach: Record<string, 1>; // merker. Følger med på alle skoler
    cnt: Record<string, number>; // tellere for merkene
    mice: number[]; // hva hver mus har spist så langt
    rTotal: number; // unnskyldninger siden forrige kommunebytte. Ryktet regnes av dette
    boss: Record<string, 1>; // sjefer du har slått (i dette spillet+)
    bossCd: number; // spilletid før du kan utfordre en sjef igjen
    ended: number; // ganger du har slått den siste sjefen
    ng: number; // Hundens hevn: hvor mange ganger du har startet på nytt etter slutten
    bevis: number; // Hundens hevn: lærerens bevis mot deg (0-1)
    kommune: number; // ganger du har byttet kommune
    legende: number; // legendepoeng samlet
    legPts: number; // legendepoeng å bruke
    ks: Record<string, number>; // nivåer kjøpt i kommunekassa
    laws: string[]; // lovene som gjelder (kommunestyret)
    lawT: number[]; // spilletid da hver lovplass kan byttes igjen
    stock: { k: number[]; tr: number[]; own: number[]; avg: number[]; unit: number };
    orbit: number[]; // medskyldige i bane rundt leksa (planetbanen)
    orbitT: number[];
    best: { t: string; sc: number }[]; // de beste unnskyldningene fra verkstedet
    vT: number; // spilletid da verkstedet er klart igjen
    bluffT: number;
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
    eras: [0, 5e3, 5e5, 3e7, 5e10, 1e14, 1e18, 1e22, 1e27], // unnskyldninger (denne runden) for hver æra
    rykteDiv: 1e6, // rykte = floor(kubikkrot(totalt / rykteDiv)). Kubikkrot så ryktet ikke løper fra prisene
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
    msMult: 1.4, // hver milepæl: medskyldigen lager så mye mer
    critChance: 0.04, // superunnskyldning: sjanse per klikk
    critMult: 8,
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
    { n: 'Svart hull for lekser', p: 'Svarte hull', d: 'Sluker alle lekser innen ti lysår. Også de du har gjort.', c: 2e14, r: 4.3e8, s: 'SH', ic: '🕳️' },
    { n: 'Klon av deg', p: 'Kloner', d: 'Klonen tar skylda. Du tar fri. Ingen ser forskjell.', c: 3e15, r: 2.9e9, s: 'KL', ic: '🧍' },
    { n: 'Robotlærer som glemmer', p: 'Robotlærere', d: 'Programmert til å sjekke lekser. Har glemt passordet.', c: 4.5e16, r: 2e10, s: 'RO', ic: '🤖' },
    { n: 'Galaktisk unnskyldningsbyrå', p: 'Byråer', d: 'Saken din er under behandling. Ventetid: 40 000 år.', c: 7e17, r: 1.4e11, s: 'GB', ic: '🛸' },
    { n: 'Glemselens tåke', p: 'Tåker', d: 'Alle som går gjennom den, glemmer fristen. Også læreren.', c: 1e19, r: 1e12, s: 'GT', ic: '🌫️' },
    { n: 'Big Bang 2', p: 'Big Bang', d: 'Starter universet på nytt like før fristen.', c: 1.6e20, r: 7e12, s: 'BB', ic: '💥' },
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
    ['Hendelseshorisont i pennalet', 'Hull i matteboka. Bokstavelig talt', 'Svart hull med eget sugerør'],
    ['Klonen lærer å sukke', 'Kloner av klonen', 'Klonene stifter klasseråd'],
    ['Robot med dårlig minne', 'Robotene har oppdatert seg til å glemme mer', 'Robotene har glemt at de er roboter'],
    ['Skjema i tre eksemplarer', 'Kø-lapp nummer 9 000 000', 'Byrået har sendt saken til et annet byrå'],
    ['Tettere tåke', 'Tåke i hele skolegården', 'Ingen husker hva lekser er'],
    ['Big Bang i lunsjen', 'To Big Bang på rad', 'Big Bang på abonnement'],
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
    am?: number; // all produksjon + så mye per merke
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
    { id: 'g4', n: 'Svart hull i skolesekken', d: 'Alt du ikke vil gjøre, forsvinner.', e: 'All produksjon ×3', c: 5e15, q: (s) => s.era >= 5, gm: 3, ic: '🎒', hint: 'Finnes et sted i universet.' },
    { id: 'h4', n: 'Bibliotekar i alle universer', d: 'Hun vet svaret før du har lest spørsmålet.', e: 'Lynprøver gir tre ganger så mye', c: 1e17, q: (s) => s.honest >= 20, hq: 3, ic: '🧑‍🏫', hint: 'Svar riktig på 20 lynprøver.' },
    { id: 'c8', n: 'Klikk som ekko gjennom universene', d: 'Hvert klikk skjer i tusen universer.', e: 'Klikk gir +4 % av /s', c: 5e18, q: (s) => s.era >= 6, cp: 0.04, ic: '🔊', hint: 'Kommer når du når multiverset.' },
    { id: 'g5', n: 'Unnskyldninger på franchise', d: 'Hvert univers har sin egen filial.', e: 'All produksjon ×3', c: 3e19, q: (s) => s.era >= 6, gm: 3, ic: '🏪', hint: 'Multiverset har butikker overalt.' },
    { id: 'g6', n: 'Evig friminutt', d: 'Tiden står stille akkurat når klokka ringer ut.', e: 'All produksjon ×4', c: 2e23, q: (s) => s.era >= 7, gm: 4, ic: '🛎️', hint: 'Ligger ved tidens ende.' },
    { id: 'c9', n: 'Lærerens egen kaffekopp', d: 'Den som har koppen, bestemmer.', e: 'Klikk ×5', c: 5e27, q: (s) => s.era >= 8, cm: 5, ic: '☕', hint: 'Står på lærerværelset.' },
    { id: 'g7', n: 'Leksefri for alltid', d: 'Lærerværelset har vedtatt det. Det er offisielt.', e: 'All produksjon ×5', c: 1e29, q: (s) => s.era >= 8, gm: 5, ic: '📜', hint: 'Lærerværelset må vedta noe.' },
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
// Hunden vokser: én oppgradering om gangen, hver krever den forrige. Til slutt må eleven velge.
const nAch = (s: State) => Object.keys(s.ach).length;
UP.push(
    { id: 'hv1', n: 'Hundevitamin', d: 'Én tablett om dagen. Hunden har begynt å vokse.', e: 'Hunder ×2. Hunden blir større, og musene finner veien inn', c: 5e4, q: (s) => s.era >= 1 && s.owned[0] >= 15, ic: '💊', hint: 'Ha 15 hunder på rektors kontor. Noe med vitaminer.' },
    { id: 'hv2', n: 'Proteinpulver i hundematen', d: 'Hunden spiser som tre. Kurven er for liten.', e: 'All produksjon ×1,3. Hunden blir enda større', c: 2e7, q: (s) => !!s.upg.hv1 && s.era >= 2, gm: 1.3, ic: '🥤', hint: 'Gi hunden vitaminer først. Så kommunestyret.' },
    { id: 'hv3', n: 'Hunden har spist en ordbok', d: 'Den sier «unnskyld» på fire språk.', e: 'All produksjon ×1,5. Hunden kan snakke', c: 5e9, q: (s) => !!s.upg.hv2 && s.era >= 3, gm: 1.5, ic: '📕', hint: 'Hunden må vokse mer. På Stortinget finnes en ordbok.' },
    { id: 'hv4', n: 'Hunden er høyere enn rektor', d: 'Ingen vet hva den spiser lenger. Bare at det er lekser.', e: 'All produksjon ×2. Rektor krever at noe skjer', c: 1e13, q: (s) => !!s.upg.hv3 && s.era >= 4, gm: 2, ic: '🦴', hint: 'Hunden har spist en ordbok. Neste steg skjer i FN.' },
    // Valget eleven tar når hunden er for stor. Kjøpes ikke, men settes av hendelsen.
    { id: 'hv5a', n: 'Kjempehund', d: 'Du matet den mer. Den kan sees fra verdensrommet.', e: 'All produksjon ×1,5 og flere mus', c: 0, q: () => false, gm: 1.5, ic: '🐘' },
    { id: 'hv5b', n: 'Hunden på slankekur', d: 'Den løper maraton før frokost.', e: 'Gullstjerner kommer 30 % oftere og færre mus', c: 0, q: () => false, ic: '🥗' },
    { id: 'mo1', n: 'Ost på gulvet', d: 'Musene elsker skolen din.', e: 'Mus kommer dobbelt så ofte', c: 2e6, q: (s) => (s.cnt.mice ?? 0) >= 5, ic: '🧀', hint: 'Fang fem mus.' },
    { id: 'mo2', n: 'Feite mus', d: 'Jo mer de spiser, jo mer får du igjen.', e: 'Mus gir tilbake 30 % ekstra i stedet for 10 %', c: 5e8, q: (s) => (s.cnt.mice ?? 0) >= 20, ic: '🐀', hint: 'Fang 20 mus.' },
    // Hundegodbiter: blir bedre jo flere merker du har
    { id: 'm1', n: 'Hundegodbit', d: 'Hunden spiser merkene dine. Det gjør den sterk.', e: 'All produksjon +1 % per merke', c: 1e5, q: (s) => nAch(s) >= 10, am: 0.01, ic: '🍪', hint: 'Samle 10 merker.' },
    { id: 'm2', n: 'Tyggebein av gull', d: 'Laget av smeltede medaljer.', e: 'All produksjon +1 % per merke', c: 1e9, q: (s) => nAch(s) >= 25, am: 0.01, ic: '🦴', hint: 'Samle 25 merker.' },
    { id: 'm3', n: 'Hundekjeks med bacon', d: 'Hunden har aldri vært mer motivert.', e: 'All produksjon +1 % per merke', c: 1e14, q: (s) => nAch(s) >= 45, am: 0.01, ic: '🥓', hint: 'Samle 45 merker.' },
    { id: 'm4', n: 'Halsbånd med diamanter', d: 'Hunden er nå rikere enn rektor.', e: 'All produksjon +1 % per merke', c: 1e19, q: (s) => nAch(s) >= 70, am: 0.01, ic: '💎', hint: 'Samle 70 merker.' },
    { id: 'm5', n: 'Hundens egen sofa', d: 'Den ligger der og ser på deg jobbe.', e: 'All produksjon +1 % per merke', c: 1e25, q: (s) => nAch(s) >= 95, am: 0.01, ic: '🛋️', hint: 'Samle 95 merker.' }
);
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
        u: 'Nye medskyldige venter: svarte hull, kloner og robotlærere.',
    },
    {
        n: 'Multiverset',
        sheet: 'Leksa (versjon 4 817 av uendelig)',
        h: 'ELEVEN HAR NÅ UNNSKYLDNINGER I ALLE UNIVERSER SAMTIDIG',
        sub: 'I ett av dem leverte du faktisk leksa. Ingen tror på det.',
        u: 'Nytt område, nye oppgraderinger og en ny knapp: Bytt univers.',
    },
    {
        n: 'Tidens ende',
        sheet: 'Siste frist (helt sant denne gangen)',
        h: 'TIDEN ER OPPBRUKT. LEKSA ER FORTSATT IKKE LEVERT',
        sub: 'Den siste klokka i universet stoppet 08:14.',
        u: 'Bare ett sted igjen. Det farligste stedet på hele skolen.',
    },
    {
        n: 'Lærerværelset',
        sheet: 'Leksesjekk (avlyst)',
        h: 'ELEV SLIPPER INN PÅ LÆRERVÆRELSET. LÆRERNE HAR OGSÅ GLEMT LEKSA',
        sub: 'Lærer Tønnessen: «Hunden min spiste rettingen.»',
        u: 'Du har nådd målet. Bytt skole og gjør det igjen, enda større.',
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
HEAD.push(
    ['Elev finnes i 4 000 universer. Ingen av dem har gjort leksa', 'Univers nr. 77 innfører leksefri hverdag', 'Kopi av eleven ber om sin egen pult', 'Portal funnet bak tavla', 'Forskere: alle universer har en hund', 'Univers uten tirsdag rapporterer god stemning'],
    ['Siste klokke i universet har stoppet', 'Tiden selv ber om sykemelding', 'Fortiden og framtiden møtes i kantina', 'Timeglasset er tomt. Noen har spist sanden', 'Alle frister er nå i går', 'Evigheten er over. Leksa er ikke levert'],
    ['Elev funnet på lærerværelset. Lærerne later som ingenting', 'Kaffemaskinen lager unnskyldninger', 'Lærerne innrømmer: de har også en hund', 'Rettebunken er spist. Igjen', 'Lærerværelset vedtar leksefri resten av livet', 'Hemmelig avsløring: lærerne gjør heller ikke leksene sine'],
);

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
    ['De svarte hullene har slukt ti skoler', 'Hullene sluker nå hverandre', 'Fysikere gir opp å forklare det', 'Alle lekser i galaksen er borte', 'Hullene har fått sitt eget hull'],
    ['Klonene fyller hele klassen', 'Ingen vet hvem som er den ekte eleven', 'Klonene holder egne foreldremøter', 'Klonene har tatt over alle skolene', 'Klonene har begynt å klone hverandre'],
    ['Robotlærerne har glemt hva de heter', 'Robotene sjekker nå lekser fra 1987', 'Robotene har gitt alle karakter 6', 'Robotene har glemt hvor skolen ligger', 'Robotene har glemt å glemme'],
    ['Byrået har fått sin egen planet', 'Kølappene når til månen', 'Byrået behandler saker fra framtiden', 'Byrået har mistet sin egen søknad', 'Byrået er nå hele galaksen'],
    ['Tåka har lagt seg over alle skoler', 'Ingen husker hva tirsdag var', 'Lærerne har glemt hvorfor de har lekser', 'Hele universet har glemt fristen', 'Tåka har glemt seg selv'],
    ['Universet har startet på nytt for 100. gang', 'Big Bang er nå et helt vanlig smell', 'Universet er lei av å starte på nytt', 'Dinosaurene har sett alt sammen før', 'Tiden går nå bare i ring'],
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
    bigdog: ['VOFF. (Vinduene rister.)', 'Jeg har lest ordboka. «Unnskyld» er et fint ord.', 'Jeg er ikke stor. Rommet er lite.', 'Er det flere lekser? Jeg er sulten.', 'Ikke si det til rektor, men jeg spiste kantina.'],
    mouse: ['Piip!', 'Jeg spiste bare litt.', 'Osten var her da jeg kom.'],
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
    hole: ['Slurp.', 'Jeg har plass til mer.', 'Leksa? Den er inni meg nå.'],
    clone: ['Jeg er deg. Jeg gjorde heller ikke leksa.', 'Hvem av oss er den ekte?', 'Jeg tar skylda. I dag.'],
    robot: ['Bip. Hvor er leksa? Glemt.', 'Feil 404: lekse ikke funnet.', 'Jeg har glemt hva jeg skulle si.'],
    ufo: ['Vi kommer i fred. Og med unnskyldninger.', 'Ta oss med til læreren deres.', 'Bzzzzt. Leksa er stjålet.'],
    mist: ['Hva var det jeg skulle huske?', 'Fristen? Hvilken frist?', 'Mmm ... glemt.'],
    bang: ['BANG!', 'Nå starter alt på nytt. Igjen.', 'Sorry, det var meg.'],
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
    { n: 'Skyld på naboen', ic: '👉', d: 'Gir med en gang det du lager på 40 sekunder.', cd: 60, done: 'Naboen tok skylda. Han vet det ikke ennå.' },
    { n: 'Lov å forbedre deg', ic: '🤞', d: 'Flyten holder seg på topp i 20 sekunder.', cd: 90, done: 'Rektor tror på deg. Flyten står stille på topp.' },
    { n: 'Vedta lov', ic: '⚖️', d: 'All produksjon ×3 i 30 sekunder.', cd: 120, done: 'Loven er vedtatt. Lekser er nå frivillige i 30 sekunder.' },
    { n: 'Hold tale', ic: '🎤', d: 'Talen er så lang at en gullstjerne kommer for å stoppe den.', cd: 150, done: 'Du snakket i to timer. En gullstjerne dukker opp.' },
    { n: 'Legg ned veto', ic: '✋', d: 'Fjerner alle straffer og gir klikk ×5 i 15 sekunder.', cd: 120, done: 'VETO! Alle straffer er opphevet.' },
    { n: 'Spol tiden', ic: '⏩', d: 'Hopper 8 minutter fram. Du får alt du ville laget i mellomtiden.', cd: 180, done: 'Tiden er spolt fram. Ingen merket noe.' },
    { n: 'Bytt univers', ic: '🌀', d: 'Henter en kopi av deg fra et bedre univers: all produksjon ×5 i 25 sekunder.', cd: 150, done: 'Du byttet univers. Her går alt fortere.' },
    { n: 'Stopp klokka', ic: '⏸️', d: 'Alle bonuser varer 30 sekunder lenger, og klikk ×10 i 10 sekunder.', cd: 150, done: 'Klokka står. Bonusene dine varer lenger.' },
    { n: 'Kaffe med lærerne', ic: '☕', d: 'Lærerne blir blide: produksjon ×6 i 30 sekunder, og læreren kommer med en lynprøve.', cd: 180, done: 'Lærerne fikk kaffe. De er nesten hyggelige.' },
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
    ic: string;
    req?: string; // må ha kjøpt denne først
}

export const PERKS: Perk[] = [
    { id: 'auto', n: 'Klassekompis som klikker for deg', d: 'Klikker 4 ganger i sekundet. Ikke spør hvorfor.', c: 20, ic: '🧒' },
    { id: 'star', n: 'Kjendis i gangen', d: 'Gullstjerner dukker opp dobbelt så ofte.', c: 30, ic: '🌟' },
    { id: 'start', n: 'Arvet lillebror', d: 'Start hver skole med 10 hunder og 5 lillebrødre.', c: 50, ic: '👶' },
    { id: 'offline', n: 'Sover i timen', d: 'Mens du er borte, jobber de i opptil 24 timer.', c: 80, ic: '😴' },
    { id: 'disc', n: 'Rektors svoger', d: 'Alle medskyldige koster 10 % mindre.', c: 120, ic: '🤝' },
    { id: 'dyn', n: 'Unnskyldningsdynasti', d: 'All produksjon ×2. For alltid.', c: 250, ic: '👑' },
    { id: 'verb', n: 'Talent for timing', d: 'Knappen i hvert område lades dobbelt så fort.', c: 150, ic: '⏱️' },
    { id: 'autoupg', n: 'Personlig assistent', d: 'Kjøper oppgraderinger for deg så snart du har råd.', c: 50000, ic: '🧑‍💼' },
    { id: 'era1', n: 'Ryktet går foran deg', d: 'Start hver skole rett på rektors kontor.', c: 600, ic: '🚪' },
    { id: 'dyn2', n: 'Unnskyldningsimperium', d: 'All produksjon ×3. For alltid.', c: 1500, ic: '🏰', req: 'dyn' },
    { id: 'era2', n: 'Kjent i kommunen', d: 'Start hver skole i kommunestyret.', c: 3000, ic: '🏛️', req: 'era1' },
    { id: 'era3', n: 'Stortingets yndling', d: 'Start hver skole på Stortinget.', c: 15000, ic: '🎤', req: 'era2' },
    { id: 'dyn3', n: 'Unnskyldningsunivers', d: 'All produksjon ×5. For alltid.', c: 40000, ic: '🌌', req: 'dyn2' },
    { id: 'bokorm', n: 'Bokorm', d: 'Ett av de gale svarene i lynprøver og sjefskamper strykes ut.', c: 400, ic: '🐛' },
    { id: 'svak', n: 'Svakt punkt', d: 'Første riktige svar mot en sjef gjør dobbel skade.', c: 800, ic: '🎯' },
];

/** Nivåer i Ryktebørsen: kan kjøpes mange ganger, og blir dyrere for hvert nivå. */
export interface RankPerk {
    id: string;
    n: string;
    d: string;
    max: number;
    c0: number; // pris for første nivå
    g: number; // prisen ganges med dette per nivå
    ic: string;
}
export const RANKS: RankPerk[] = [
    { id: 'lp', n: 'Skolens legende', d: 'All produksjon +25 % per nivå.', max: 30, c0: 20, g: 1.6, ic: '🏆' },
    { id: 'lc', n: 'Klikkefinger av stål', d: 'Klikk +50 % per nivå.', max: 20, c0: 20, g: 1.55, ic: '👆' },
    { id: 'ld', n: 'Rabattkort hos svogeren', d: 'Medskyldige koster 3 % mindre per nivå.', max: 10, c0: 40, g: 1.8, ic: '🏷️' },
    { id: 'lm', n: 'Milepælmester', d: 'Hver milepæl gir 10 prosentpoeng mer per nivå.', max: 6, c0: 60, g: 2.2, ic: '🎯' },
    { id: 'lg', n: 'Stjernestøv', d: 'Gullstjerner kommer 10 % oftere per nivå.', max: 10, c0: 30, g: 1.7, ic: '✨' },
    { id: 'lb', n: 'Lang inspirasjon', d: 'Gullstjernene virker 15 % lenger per nivå.', max: 10, c0: 30, g: 1.7, ic: '⏳' },
    { id: 'lx', n: 'Superhjerne', d: 'Superunnskyldninger kommer 1 prosentpoeng oftere per nivå.', max: 6, c0: 50, g: 2, ic: '🧠' },
    { id: 'lq', n: 'Lesehestens rykte', d: 'Lynprøver gir 50 % mer per nivå.', max: 15, c0: 30, g: 1.65, ic: '📚' },
    { id: 'lt', n: 'Tenkepause', d: 'Lynprøven gir 3 sekunder ekstra per nivå.', max: 5, c0: 20, g: 1.9, ic: '🤔' },
    { id: 'le', n: 'Alltid noe på gang', d: 'Hendelser kommer 15 % oftere per nivå.', max: 6, c0: 40, g: 1.9, ic: '🎲' },
    { id: 'lh', n: 'Hjertestyrke', d: 'Ett liv mer i sjefskamper per nivå.', max: 2, c0: 150, g: 4, ic: '❤️' },
    { id: 'lk', n: 'Kunnskap er makt', d: 'All produksjon +10 % per sjef du har slått, per nivå.', max: 5, c0: 200, g: 2.2, ic: '🧠' },
    { id: 'ls', n: 'Sparegris', d: 'Start hver skole med unnskyldninger på bok. Ti ganger mer per nivå.', max: 12, c0: 30, g: 1.85, ic: '🐷' },
];
export const rankCost = (r: RankPerk, lv: number) => Math.ceil(r.c0 * Math.pow(r.g, lv));

/** Tittelen din etter hvor mye rykte du har samlet. */
export const RYKTE_TITLES: [number, string][] = [
    [0, 'Ukjent elev'],
    [50, 'Kjent i gangen'],
    [250, 'Skolens snakkis'],
    [1000, 'Lokal legende'],
    [4000, 'Rikskjendis'],
    [15000, 'Verdensberømt'],
    [50000, 'Unnskyldningenes gud'],
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
        v: 2,
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
        lv: {},
        resets: 0,
        school: 0,
        hints: {},
        set: { sound: true, reduce, music: true, mvol: 0.5 },
        last: Date.now(),
        buy: 1,
        played: 0,
        goldClicks: 0,
        honest: 0,
        honestTries: 0,
        honestStreak: 0,
        seen: {},
        run: freshRun(),
        ach: {},
        cnt: {},
        mice: [],
        rTotal: 0,
        boss: {},
        bossCd: 0,
        ended: 0,
        ng: 0,
        bevis: 0,
        kommune: 0,
        legende: 0,
        legPts: 0,
        ks: {},
        laws: [],
        lawT: [0, 0, 0],
        stock: freshStock(),
        orbit: [-1, -1, -1],
        orbitT: [0, 0, 0],
        best: [],
        vT: 0,
        bluffT: 0,
    };
}
export const freshStock = () => ({ k: [40, 25, 60, 35, 20], tr: [0, 0, 0, 0, 0], own: [0, 0, 0, 0, 0], avg: [0, 0, 0, 0, 0], unit: 0 });

/* ================= Hunden vokser ================= */
// Linjer til nyhetslinja for hvert steg. 5 = kjempehund, 6 = slankekur.
export const HUND_HEAD: string[][] = [
    [],
    [
        'Hunden har vokst to centimeter siden i går. Veterinæren klør seg i hodet',
        'Hundeeier: «Den er bare stor for alderen»',
        'Mus observert i klasserommet. Rektor ber elevene ikke mate dem',
    ],
    [
        'Hunden får ikke plass i kurven lenger. Sover nå i gymsalen',
        'Proteinpulver utsolgt i hele kommunen',
        'Musene på skolen har startet sin egen fagforening',
    ],
    [
        'Hunden har spist en ordbok og sier nå «unnskyld» på fire språk',
        'Hunden skrev sin første unnskyldning selv. Læreren godtok den',
        'Ekspert: «Hunder skal ikke kunne bøye verb»',
    ],
    [
        'Hunden er høyere enn rektor. Rektor later som ingenting',
        'Hunden får ikke plass i heisen. Heisen er flyttet',
        'Forskere: «Vi vet ikke hva den spiser lenger. Bare at det er lekser»',
    ],
    [
        'Kjempehunden kan sees fra verdensrommet. Den logrer',
        'Kjempehunden satte seg ned. Det ble målt som et lite jordskjelv',
        'Musene bor nå i pelsen til hunden. De betaler husleie',
    ],
    [
        'Hunden har gått ned ti kilo og løper maraton før frokost',
        'Slankekuren virker. Hunden spiser nå bare lettlekser',
        'Hunden har fått sitt eget treningsprogram på TV',
    ],
];

/* ================= Merker ================= */
// Hvert merke gir +1 % produksjon, og hundegodbitene i butikken gir enda mer per merke.
// Merkene følger med deg til alle skoler.
export interface AchCtx {
    pps: number;
    stage: number; // hvor stor hunden er (0-5)
    seenAll: boolean;
    combo: boolean; // to gullstjerne-effekter samtidig
}
export interface Ach {
    id: string;
    n: string;
    d: string;
    ic: string;
    q: (s: State, c: AchCtx) => boolean;
    secret?: boolean; // vises som «???» til det er tatt
}
const cnt = (s: State, k: string) => s.cnt[k] ?? 0;
export const ACH: Ach[] = [];
const TOTAL_ACH: [number, string, string, string][] = [
    [1e3, 'Lærer seg å lyve', '1 000', '🤥'],
    [1e6, 'Millionær i bortforklaringer', '1 million', '📦'],
    [1e9, 'Milliardær i bortforklaringer', '1 milliard', '💰'],
    [1e12, 'Unnskyldningsbanken', '1 billion', '🏦'],
    [1e15, 'Ingen tror deg lenger', '1 billiard', '🎱'],
    [1e18, 'Hele jorda har hørt det', '1 trillion', '🌍'],
    [1e21, 'Løgner i bane rundt sola', '1 trilliard', '🪐'],
    [1e24, 'Galaktisk bortforklarer', '1 kvadrillion', '🌌'],
    [1e27, 'Lekseliardær', '1 lekseliard', '♾️'],
    [1e30, 'Unnskyldillionær', '1 unnskyldillion', '🌊'],
];
TOTAL_ACH.forEach(([n, name, txt, ic], k) =>
    ACH.push({ id: 'tot' + k, n: name, d: `Finn på ${txt} unnskyldninger til sammen.`, ic, q: (s) => s.allTotal >= n })
);
const PPS_ACH: [number, string, string, string][] = [
    [10, 'Hunden jobber', '10', '🐾'],
    [1e3, 'Egen bedrift', '1 000', '🏢'],
    [1e6, 'Industrien er i gang', '1 million', '⚙️'],
    [1e9, 'Samlebånd til månen', '1 milliard', '🚀'],
    [1e12, 'Kan ikke stoppes', '1 billion', '🌋'],
    [1e15, 'Fysikken gir opp', '1 billiard', '🧪'],
    [1e18, 'Universets motor', '1 trillion', '☄️'],
];
PPS_ACH.forEach(([n, name, txt, ic], k) =>
    ACH.push({ id: 'pps' + k, n: name, d: `Lag ${txt} unnskyldninger i sekundet.`, ic, q: (_, c) => c.pps >= n })
);
P.forEach((p, i) => {
    ACH.push({ id: `own${i}a`, n: `25 ${p.p.toLowerCase()}`, d: `Ha 25 ${p.p.toLowerCase()} samtidig.`, ic: p.ic, q: (s) => s.owned[i] >= 25 });
    ACH.push({ id: `own${i}b`, n: `100 ${p.p.toLowerCase()}`, d: `Ha 100 ${p.p.toLowerCase()} samtidig.`, ic: p.ic, q: (s) => s.owned[i] >= 100 });
});
ERAS.forEach((e, k) => {
    if (k > 0) ACH.push({ id: 'era' + k, n: e.n, d: `Kom deg helt til ${e.n.toLowerCase()}.`, ic: '🗺️', q: (s) => s.maxEra >= k });
});
const step = (id: string, ic: string, list: [number, string][], d: (n: number) => string, v: (s: State) => number) =>
    list.forEach(([n, name], k) => ACH.push({ id: id + k, n: name, d: d(n), ic, q: (s) => v(s) >= n }));
const nf = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
step('clk', '👆', [[100, 'Fingeren varmes opp'], [1000, 'Klikkemaskin'], [10000, 'Senebetennelse'], [50000, 'Fingeren har fått eget liv']], (n) => `Klikk ${nf(n)} ganger på leksa.`, (s) => s.clicks);
step('crit', '💥', [[1, 'Superunnskyldning'], [25, 'Superhjerne i arbeid'], [100, 'Geni på helt feil område']], (n) => (n === 1 ? 'Lag en superunnskyldning.' : `Lag ${n} superunnskyldninger.`), (s) => cnt(s, 'crits'));
step('gold', '⭐', [[1, 'Fanget en stjerne'], [10, 'Stjernesamler'], [50, 'Stjernetyv'], [150, 'Melkeveien er tom']], (n) => (n === 1 ? 'Fang en gullstjerne.' : `Fang ${n} gullstjerner.`), (s) => s.goldClicks);
step('hon', '📖', [[1, 'Gjorde faktisk leksa'], [10, 'Lesehest'], [50, 'Professor i 10B']], (n) => (n === 1 ? 'Svar riktig på en lynprøve.' : `Svar riktig på ${n} lynprøver.`), (s) => s.honest);
step('streak', '🔥', [[5, 'Fem på rad']], () => 'Svar riktig på fem lynprøver på rad.', (s) => s.honestStreak);
step('lie', '🤞', [[25, 'Løgnhals'], [100, 'Notorisk']], (n) => `Lur læreren med en unnskyldning ${n} ganger.`, (s) => cnt(s, 'lies'));
step('res', '🏫', [[1, 'Ny skole, nye muligheter'], [5, 'Skoleturist'], [15, 'Kjent på alle skoler'], [40, 'Har gått på alle skolene i landet']], (n) => (n === 1 ? 'Bytt skole.' : `Bytt skole ${n} ganger.`), (s) => s.resets);
step('ryk', '🏅', [[100, 'Snakk om byen'], [1000, 'Alle vet hvem du er'], [10000, 'Legenden om hunden']], (n) => `Samle ${nf(n)} rykte.`, (s) => s.rykte);
step('mus', '🐭', [[1, 'Musefanger'], [25, 'Skadedyrkontroll'], [100, 'Rottefangeren']], (n) => (n === 1 ? 'Fang en mus.' : `Fang ${n} mus.`), (s) => cnt(s, 'mice'));
step('ev', '🎲', [[10, 'Alltid noe på gang'], [50, 'Dramatisk skoleår']], (n) => `Vær med på ${n} hendelser.`, (s) => cnt(s, 'events'));
step('poke', '💬', [[10, 'Sosial'], [100, 'Alles venn']], (n) => `Klikk på figurene i rommet ${n} ganger.`, (s) => cnt(s, 'pokes'));
step('verb', '🔘', [[10, 'Vet hvor knappen er'], [100, 'Knappetrykker']], (n) => `Bruk knappen i et område ${n} ganger.`, (s) => cnt(s, 'verbs'));
step('upg', '🛒', [[25, 'Godt utstyrt'], [75, 'Alt i butikken']], (n) => `Ha ${n} oppgraderinger på samme skole.`, (s) => Object.keys(s.upg).length);
step('time', '⏰', [[3600, 'En hel skoletime'], [6 * 3600, 'En hel skoledag']], (n) => `Spill i ${n / 3600 === 1 ? 'en time' : n / 3600 + ' timer'} til sammen.`, (s) => s.played);
ACH.push(
    { id: 'seen10', n: 'Nysgjerrig', d: 'Gjør 10 oppdagelser i rommet.', ic: '🔍', q: (s) => Object.keys(s.seen).length >= 10 },
    { id: 'seenAll', n: 'Har sett alt', d: 'Gjør alle oppdagelsene i rommet.', ic: '🔭', q: (_, c) => c.seenAll },
    { id: 'dog1', n: 'Hunden vokser', d: 'Gi hunden vitaminer.', ic: '💊', q: (_, c) => c.stage >= 1 },
    { id: 'dog4', n: 'Høyere enn rektor', d: 'La hunden vokse seg høyere enn rektor.', ic: '🦴', q: (_, c) => c.stage >= 4 },
    { id: 'dogA', n: 'Kjempehund', d: 'Mat hunden enda mer når den er for stor.', ic: '🐘', q: (s) => !!s.upg.hv5a, secret: true },
    { id: 'dogB', n: 'Sprek som en hund', d: 'Sett hunden på slankekur.', ic: '🥗', q: (s) => !!s.upg.hv5b, secret: true },
    { id: 'tag', n: 'Hvor er jeg?', d: 'Klikk på navnet på rommet ti ganger.', ic: '🧭', q: (s) => cnt(s, 'tag') >= 10, secret: true },
    { id: 'grade', n: 'Klager på karakteren', d: 'Klikk på karakteren på arket ti ganger.', ic: '📝', q: (s) => cnt(s, 'grade') >= 10, secret: true },
    { id: 'export', n: 'Sikkerhetskopi', d: 'Lag en lagringskode.', ic: '💾', q: (s) => cnt(s, 'export') >= 1, secret: true },
    { id: 'hand', n: 'Ren håndkraft', d: 'Klikk 300 ganger på én skole uten å kjøpe en eneste medskyldig.', ic: '✋', q: (s) => s.run.clicks >= 300 && s.owned.every((x) => x === 0), secret: true },
    { id: 'fast', n: 'Lynrask', d: 'Svar riktig på en lynprøve på under tre sekunder.', ic: '⚡', q: (s) => cnt(s, 'fast') >= 1, secret: true },
    { id: 'combo', n: 'Dobbel flaks', d: 'Ha to gullstjerne-effekter på en gang.', ic: '🍀', q: (_, c) => c.combo, secret: true },
    { id: 'stingy', n: 'Gjerrig', d: 'Si nei til sultne hunder fem ganger.', ic: '🙅', q: (s) => cnt(s, 'stingy') >= 5, secret: true },
    { id: 'night', n: 'Nattugle', d: 'Spill etter klokka elleve om kvelden.', ic: '🦉', q: () => { const h = new Date().getHours(); return h >= 23 || h < 5; }, secret: true },
    { id: 'fatmouse', n: 'Mett mus', d: 'Fang en mus som har spist i mer enn fem minutter.', ic: '🧀', q: (s) => cnt(s, 'fatmouse') >= 1, secret: true }
);
BOSSES.forEach((b) =>
    ACH.push({ id: 'boss_' + b.id, n: b.id === 'b8' ? 'Slutten' : `Slo ${b.n.toLowerCase()}`, d: b.id === 'b8' ? 'Slå den som fant opp lekser.' : `Vinn sjefskampen mot ${b.n.toLowerCase()}.`, ic: b.ic, q: (s) => !!s.boss[b.id] || (b.id === 'b8' && s.ended > 0), secret: b.id === 'b8' })
);
ACH.push(
    { id: 'ng1', n: 'Hundens hevn', d: 'Start Hundens hevn.', ic: '🐕', q: (s) => s.ng >= 1, secret: true },
    { id: 'ng3', n: 'Hevnen er søt', d: 'Start Hundens hevn tre ganger.', ic: '🍬', q: (s) => s.ng >= 3, secret: true },
    { id: 'kom1', n: 'Flyttelass', d: 'Bytt kommune.', ic: '🚚', q: (s) => s.kommune >= 1 },
    { id: 'kom5', n: 'Kjent i hele landet', d: 'Bytt kommune fem ganger.', ic: '🗺️', q: (s) => s.kommune >= 5 },
    { id: 'verk1', n: 'Snekker', d: 'Lever en unnskyldning fra verkstedet.', ic: '🛠️', q: (s) => cnt(s, 'verk') >= 1 },
    { id: 'verk25', n: 'Unnskyldningsmester', d: 'Lever 25 unnskyldninger fra verkstedet.', ic: '🏗️', q: (s) => cnt(s, 'verk') >= 25 },
    { id: 'verk40', n: 'Mesterverk', d: 'Lag en unnskyldning verdt minst 40 poeng.', ic: '🖼️', q: (s) => cnt(s, 'verk40') >= 1 },
    { id: 'klassiker', n: 'Klassikeren', d: 'Lag den mest kjente unnskyldningen av dem alle.', ic: '📜', q: (s) => cnt(s, 'klassiker') >= 1, secret: true },
    { id: 'kosmisk', n: 'Den kosmiske', d: 'Lag den største unnskyldningen i universet.', ic: '🌌', q: (s) => cnt(s, 'kosmisk') >= 1, secret: true },
    { id: 'bluff5', n: 'Pokerfjes', d: 'Vinn alle rundene mot rektor.', ic: '🃏', q: (s) => cnt(s, 'bluff5') >= 1 },
    { id: 'lov', n: 'Lovgiver', d: 'Vedta en lov i kommunestyret.', ic: '⚖️', q: (s) => cnt(s, 'laws') >= 1 },
    { id: 'bors10', n: 'Børshai', d: 'Selg aksjer med gevinst ti ganger.', ic: '🦈', q: (s) => cnt(s, 'borsWin') >= 10 },
    { id: 'align10', n: 'Astronom', d: 'Fang planetene på linje ti ganger.', ic: '🔭', q: (s) => cnt(s, 'align') >= 10 }
);
