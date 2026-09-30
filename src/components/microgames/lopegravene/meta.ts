import { inFormation, has, nightPlan, DOCTRINES, WAVES, type G, type Cause, type DoctrineId, type EnemyKind, type TowerKind } from './game';

// Tekst og samling for Løpegravene: ranger, tips ved tap, fiendene og funnene eleven
// samler på tvers av runder. Ren data - ingen React.

export const RANKS: [number, string][] = [
    [0, 'Rekrutt'],
    [4000, 'Musketer'],
    [10000, 'Konstabel'],
    [18000, 'Løytnant'],
    [28000, 'Kaptein'],
    [40000, 'Major'],
    [55000, 'Kommandant på Fredriksten'],
];

export const TIPS: Record<Cause, string> = {
    storm: 'Grøfta gir dekning. Møt dem på den åpne glacisen, eller skyt ovenfra med morter.',
    beleiring: 'Kanon, morter eller mine mot beleiringskanonene - og ta Jordvoller.',
    karl: 'Kongen går fremst. Samle ilden der den siste grøfta slutter.',
};

export const DEATH: Record<Cause, string> = {
    storm: 'Svenskene stormet over glacis og inn over muren.',
    beleiring: 'Beleiringskanonene knuste forsvaret, og stormen tok resten.',
    karl: 'Karl XII sto på muren. Fredriksten er svensk.',
};

export const CELL_NAME: Record<string, string> = {
    glacis: 'Glacis skal være bar - bygg på vollen eller i marka.',
    mur: 'Selve muren - bygg på vollen foran.',
    fjell: 'Fjell - her kan ingen bygge.',
};

export const BUILD_KEYS: TowerKind[] = ['musketer', 'kanon', 'morter', 'mine'];
export const TOWER_HINT: Record<TowerKind, string> = {
    musketer: 'Billig. Flat ild - best på åpen mark.',
    kanon: 'Tung, flat ild. Knuser beleiringskanoner.',
    morter: 'Høy bue rett ned i grøfta. Treg bombe.',
    mine: 'Legges på veien. Sprenger nedenfra.',
};
export const TOWER_LEVELS: Record<TowerKind, [string, string, string, string]> = {
    musketer: ['Skanse av kurver', 'Plattform med palisade', 'Blokkhus', 'Bastion med livkompani'],
    kanon: ['Feltkanon', 'Kanonplattform', 'Steinbatteri med to kanoner', 'Stort batteri med tre kanoner'],
    morter: ['Morter i kurver', 'Morterstilling', 'Rundt batteri med to mortere', 'Bombebatteri med tre mortere'],
    mine: ['Kruttkagge', 'To kagger', 'Minegang med tømmer', 'Minegalleri under veien'],
};

export const ENEMY_ORDER: EnemyKind[] = ['karoliner', 'graver', 'rytter', 'grenader', 'beleiring', 'livgarde', 'karl'];
export const ENEMY_INFO: Record<EnemyKind, string> = {
    karoliner: 'Går i grøfta. Flate kuler biter nesten ikke - bruk morter eller mine, eller møt ham på glacis.',
    graver: 'Kurven foran ham stopper flate kuler. Bomber ovenfra eller miner nedenfra.',
    rytter: 'For rask for morterbomba. Musketerer ved glacis tar ham.',
    grenader: 'Kaster granater på tårnene han går forbi.',
    beleiring: 'Musketkuler preller av. Kanon, morter eller mine - og ordren Jordvoller.',
    livgarde: 'Kongens egne soldater. Går rett bak ham i den siste grøfta.',
    karl: 'Går fremst. Samle ilden der den siste grøfta slutter.',
};

export interface Find {
    id: string;
    title: string;
    text: string;
    hint: string;
    test: (g: G) => boolean;
}

export const FINDS: Find[] = [
    {
        id: 'lyskule',
        title: 'Lyskula',
        text: 'Forsvarerne skjøt opp brennende lyskuler over grøftene, så de kunne se svenskene i mørket.',
        hint: 'Hold ut den første natta.',
        test: (g) => g.wave >= 2 || g.ended === 'vunnet',
    },
    {
        id: 'beleiring',
        title: 'Et knust kanonhjul',
        text: 'Beleiringskanonene veide flere tonn og ble dratt fram av hester og mannskap.',
        hint: 'Knus en beleiringskanon.',
        test: (g) => g.finds.has('beleiring'),
    },
    {
        id: 'brev',
        title: 'Tordenskjolds brev',
        text: 'I 1716 senket Tordenskjold den svenske forsyningsflåten i Dynekilen, og Karl XII måtte ut av Norge den gangen.',
        hint: 'Ta ordren Tordenskjold.',
        test: (g) => has(g, 'tordenskjold'),
    },
    {
        id: 'kjede',
        title: 'Kruttmesterens lunte',
        text: 'En kontramine var en gang gravd under fiendens grøft og fylt med krutt.',
        hint: 'Spreng tre miner i én kjede.',
        test: (g) => g.chainMax >= 3,
    },
    {
        id: 'pelotong',
        title: 'Trommestikka',
        text: 'Pelotongild: lagene skjøt etter tur etter trommeslag, så det aldri ble stille.',
        hint: 'Ta ordren Pelotong og still tre lag side om side.',
        test: (g) => has(g, 'pelotong') && g.towers.some((t) => t.kind === 'musketer' && !t.fallen && inFormation(g, t)),
    },
    {
        id: 'fane',
        title: 'Livgardens fane',
        text: 'Livgarden var kongens egne soldater og gikk alltid nærmest ham.',
        hint: 'Fell åtte fra livgarden.',
        test: (g) => (g.killsBy.livgarde ?? 0) >= 8,
    },
    {
        id: 'hatt',
        title: 'Karl XIIs hatt',
        text: 'Klærne kongen hadde på seg den kvelden ved Fredriksten, kan du fortsatt se i Livrustkammaren i Stockholm.',
        hint: 'Fell kongen.',
        test: (g) => g.finds.has('karl'),
    },
    {
        id: 'jul',
        title: 'Juleklokka i Halden',
        text: 'Etter at kongen falt, dro den svenske hæren hjem over grensa. Beleiringen var over før jul.',
        hint: 'Hold ut til natt 12 i endeløs beleiring.',
        test: (g) => g.endless && g.wave >= 12,
    },
];

// ---------------------------------------------------------------------------
// Oppfangede brev fra svensk side: ett før hver natt. De forklarer hvorfor bølgen ser
// ut som den gjør - og hvorfor stormaktstiden var i ferd med å ta slutt.
// ---------------------------------------------------------------------------

export const LETTERS: string[] = [
    '',
    // Natt 1
    'Etter tapet ved Poltava i 1709 har Sverige mistet mye land. Kongen vil ta Norge for å få noe å bytte med.',
    // Natt 2: gravere
    'Vi har ikke råd til en lang beleiring. Graverne skal grave en ny løpegrav mot muren i natt.',
    // Natt 3: dragoner
    'Krigskassa er tom etter snart tjue år med krig. Dragonene rir fort fram for å rekke muren før maten tar slutt.',
    // Natt 4: beleiringskanon
    'De tunge kanonene er slept hele veien fra Sverige. Det tok uker. Nå skal de skyte tårnene i stykker.',
    // Natt 5: grenaderer og ny grøft
    'Mange soldater er bondegutter som ble tvunget med. Grenaderene skal kaste granater mot tårnene. Graverne graver igjen.',
    // Natt 6
    'Sverige er i krig med Russland, Danmark-Norge, Sachsen, Preussen og Hannover på en gang. Det er for mange fiender for ett land.',
    // Natt 7
    'Det er kaldt, og det er nesten ikke mat igjen. Kongen vil storme før soldatene rømmer hjem.',
    // Natt 8: stormkolonner
    'Alle som kan bære et gevær, skal i grøfta i natt. Det finnes ingen flere å sende.',
    // Natt 9: kongen
    'Kongen vil selv se hvor langt graverne er kommet. I kveld går han inn i den fremste løpegraven.',
];

/** Hva hver doktrine betyr for natt n: med tall fra planen, så linja er ny hver natt. */
function doctrinePart(d: DoctrineId, n: number, plan: Map<EnemyKind, number>): string {
    const c = (k: EnemyKind) => plan.get(k) ?? 0;
    if (d === 'dragonraid') return n >= 2 ? `${c('rytter')} dragoner rir først.` : 'Dragonene er ikke kommet ennå.';
    if (d === 'sappørkrig') return `${c('graver')} gravere i skanskurv.`;
    if (d === 'artilleri')
        return c('beleiring') > 0
            ? `${c('beleiring')} beleiringskanon${c('beleiring') > 1 ? 'er' : ''} mot tårnene.`
            : 'Kanonene slepes fortsatt fram.';
    if (d === 'grenaderstorm') return n >= 3 ? `${c('grenader')} grenaderer med granater.` : 'Grenaderene venter.';
    return `${c('karoliner')} karolinere, raskere enn vanlig.`;
}

/** Planen for natt n: begge doktrinene, i samme rekkefølge som undertittelen i HUD-en. */
export function planLine(g: G, n: number): string {
    const plan = new Map(nightPlan(g, n));
    const [a, b] = g.doctrines;
    return `Planen: ${DOCTRINES[a].title} + ${DOCTRINES[b].title}. ${doctrinePart(a, n, plan)} ${doctrinePart(b, n, plan)}`;
}

export function letterFor(g: G): { title: string; text: string; notes: string[] } | null {
    const n = g.phase === 'bygg' ? g.wave + 1 : g.wave;
    if (g.endless || n < 1 || n > WAVES) return null;
    return { title: n === WAVES ? '11. desember 1718' : `Før natt ${n}`, text: LETTERS[n], notes: [planLine(g, n)] };
}

/** «Fordi»-linja på slutt-skjermen: hvorfor stormaktstiden tok slutt. */
export const FORDI =
    'Fordi: Sverige hadde vært i krig i atten år og hadde flere fiender enn landet klarte. Etter Poltava i 1709 var hæren og pengene brukt opp. Med freden i Nystad i 1721 var stormaktstiden over.';

/** Et konkret tips ut fra det som faktisk skjedde i runden (ikke en generell fasit). */
export function roundTip(g: G, cause: Cause): string {
    const sum = (keys: string[]) => keys.reduce((s, k) => s + (g.dmgBy[k] ?? 0), 0);
    const flatCover = sum(['musket-grøft', 'kanon-grøft', 'kartesk-grøft']);
    const total = Object.values(g.dmgBy).reduce((s, v) => s + v, 0) || 1;
    const bombs = sum(['bombe-grøft', 'bombe-åpen', 'mine-grøft', 'mine-åpen']);
    const lead = (Object.entries(g.leakBy) as [EnemyKind, number][]).sort((a, b) => b[1] - a[1])[0];
    if (cause === 'karl') return 'Karl XII nådde muren. Samle morterne og minene der den siste grøfta slutter.';
    if (cause === 'beleiring' || g.towersLost >= 3)
        return `Beleiringskanonene knuste ${g.towersLost} tårn. Kanon, morter eller mine mot dem - og ta ordren Jordvoller.`;
    if (bombs < total * 0.1)
        return 'Du brukte nesten ikke morter eller mine. Flate kuler gikk over hodene i grøfta - prøv morter.';
    if (flatCover > total * 0.35)
        return `${Math.round((flatCover / total) * 100)} % av skaden din kom fra flate kuler mot folk i grøfta, der de biter lite. Prøv morter eller mine.`;
    if (lead && lead[0] === 'rytter') return 'Dragonene slapp forbi. De er for raske for morteren - still musketerer ved glacis.';
    if (lead && lead[0] === 'graver') return 'Graverne i skanskurv slapp forbi. Bare bomber ovenfra eller miner biter på kurven.';
    if (lead && lead[0] === 'grenader') return 'Grenaderene sprengte tårnene. Mortere litt bak glacis når dem før de når tårnene.';
    return TIPS[cause];
}

// ---------------------------------------------------------------------------
// Tonen «grusom»: absurde replikker i verden. Humoren går mot det absurde, aldri
// mot lidelse.
// ---------------------------------------------------------------------------

export const QUIPS = {
    graver: ['Frossen jord. Igjen.', 'Hvem valgte desember?', 'Spaden er av tre!', 'Kongen graver aldri selv.', 'Nå er det is her også.'],
    hatless: ['Hatten! Marsjer videre.', 'Ingen hatt? Ingen retrett.', 'Kaldt i hodet nå.', 'Hatten får vente.'],
    glacis: ['Oppover? I snø?', 'Hvem la bakken sånn?', 'Ingen grøft her!'],
    batteri: ['Slept fra Sverige for dette?', 'Tre uker med tau...'],
    karoliner: [
        'Er det ertesuppe i kveld også?',
        'Kongen sa Christiania var rett rundt hjørnet.',
        'Hvem tok med all denne snøen?',
        'Jeg har mistet den andre votten.',
        'Står muren der fortsatt? Frekt.',
        'Noen har spist rasjonen min. Igjen.',
        'Bare marsjer. Kongen ser på.',
        'Sa noen «kort krig» i 1700?',
    ],
    grav: ['Gi meg en spade, ikke en kule.', 'Hold hodet lavt og hatten høyt.', 'Her nede er det ingen vind, i det minste.'],
    sjef: ['Kongen er her! Rett på hattene!', 'Ikke tråkk kongen på tærne!', 'Kongen spiser visst aldri. Vi har merket det.'],
    karl: 'Hatten havnet i Livrustkammaren',
};
