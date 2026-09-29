import type { DelUtseende, Gjenstand, ItemDef, ItemSlot, Rarity } from '../types';

// Alt utstyr tegnes prosedyralt ut fra `weapon.art`, `utseende` og
// sjeldenhetsfargen, så nye gjenstander koster ingenting i grafikk - bare en
// rad i denne tabellen.

export const RARITY_COLOR: Record<Rarity, string> = {
    vanlig: '#cbd5e1',
    god: '#6ee7a8',
    sjelden: '#7fb8ff',
    episk: '#d79bff',
};

export const RARITY_LABEL: Record<Rarity, string> = {
    vanlig: 'Vanlig',
    god: 'God',
    sjelden: 'Sjelden',
    episk: 'Episk',
};

export const ITEMS: ItemDef[] = [
    // ── Våpen ───────────────────────────────────────────────────────────────
    {
        id: 'ovingssverd',
        name: 'Øvingssverd',
        slot: 'vapen',
        rarity: 'vanlig',
        flavor: 'Sløvt, men det treffer. Alle må begynne et sted.',
        stats: {},
        weapon: { skade: 8, hastighet: 380, rekkevidde: 34, bue: 100, art: 'sverd' },
    },
    {
        id: 'rustet-oks',
        name: 'Rusten øks',
        slot: 'vapen',
        rarity: 'vanlig',
        flavor: 'Tung og treg. Men treffer den, så merkes det.',
        stats: {},
        weapon: { skade: 13, hastighet: 620, rekkevidde: 30, bue: 120, art: 'oks' },
    },
    {
        id: 'bjorkestav',
        name: 'Bjørkestav',
        slot: 'vapen',
        rarity: 'vanlig',
        flavor: 'Mer til å peke med enn å slå med. Men den bærer kraft.',
        stats: { styrke: 1 },
        weapon: { skade: 5, hastighet: 420, rekkevidde: 38, bue: 80, art: 'stav' },
    },
    {
        id: 'jaktbue',
        name: 'Jaktbue',
        slot: 'vapen',
        rarity: 'vanlig',
        flavor: 'Laget for elg, ikke for menn. Den vet ikke forskjellen.',
        stats: {},
        // `rekkevidde` er hvor langt pila flyr, ikke hvor langt hun når med
        // armen. Sammen med farten i angrepsformen gir den levetiden.
        weapon: { skade: 9, hastighet: 520, rekkevidde: 300, bue: 0, art: 'bue' },
        pris: 110,
    },
    {
        id: 'sagasverd',
        name: 'Sagasverdet',
        slot: 'vapen',
        rarity: 'god',
        flavor: 'Bladet er ripet med navn på folk ingen husker lenger.',
        stats: { styrke: 2 },
        weapon: { skade: 14, hastighet: 340, rekkevidde: 38, bue: 110, art: 'sverd' },
    },
    {
        id: 'tingspyd',
        name: 'Tingspyd',
        slot: 'vapen',
        rarity: 'god',
        flavor: 'Båret av en som pleide å ta ordet på tinget.',
        stats: {},
        pris: 120,
        weapon: { skade: 12, hastighet: 400, rekkevidde: 54, bue: 55, art: 'spyd' },
    },
    {
        id: 'runestav',
        name: 'Runestaven',
        slot: 'vapen',
        rarity: 'sjelden',
        flavor: 'Tegnene langs skaftet lyser når du sier noe sant.',
        stats: { styrke: 3 },
        pris: 200,
        weapon: { skade: 8, hastighet: 380, rekkevidde: 42, bue: 90, art: 'stav' },
    },
    {
        id: 'minnehammer',
        name: 'Minnehammeren',
        slot: 'vapen',
        rarity: 'episk',
        flavor: 'Den slår ikke ned. Den slår fast.',
        stats: { styrke: 5, vern: 2 },
        weapon: { skade: 30, hastighet: 620, rekkevidde: 36, bue: 150, art: 'hammer' },
    },

    // ── Rustning ────────────────────────────────────────────────────────────
    {
        id: 'vadmelskjortel',
        name: 'Vadmelskjortel',
        slot: 'rustning',
        rarity: 'vanlig',
        flavor: 'Ull. Varm. Stopper regn, ikke sverd.',
        stats: { vern: 1 },
        pris: 30,
        utseende: { farge: '#7a6a52' },
    },
    {
        id: 'lerbrynje',
        name: 'Lærbrynje',
        slot: 'rustning',
        rarity: 'god',
        flavor: 'Kokt lær. Lett nok til å løpe i.',
        stats: { vern: 4, hp: 15 },
        pris: 90,
        utseende: { farge: '#8a6440' },
    },
    {
        id: 'ringbrynje',
        name: 'Ringbrynje',
        slot: 'rustning',
        rarity: 'sjelden',
        flavor: 'Tusenvis av små ringer, hektet i hverandre for hånd.',
        stats: { vern: 8, hp: 30 },
        pris: 220,
        utseende: { farge: '#9aa3ae', form: 'ringer' },
    },
    {
        id: 'glemselskappen',
        name: 'Glemselskappen',
        slot: 'rustning',
        rarity: 'episk',
        flavor: 'Tatt fra fienden. Nå beskytter den mot sin egen art.',
        stats: { vern: 12, hp: 45 },
        utseende: { farge: '#5b4a78', form: 'plater' },
    },

    // ── Amuletter ───────────────────────────────────────────────────────────
    {
        id: 'kvernstein',
        name: 'Liten kvernstein',
        slot: 'amulett',
        rarity: 'vanlig',
        flavor: 'Hull i midten, snor gjennom. Bestemor sa den hjalp.',
        stats: { hp: 10 },
        pris: 45,
        utseende: { farge: '#9a9488' },
    },
    {
        id: 'skaldering',
        name: 'Skaldens ring',
        slot: 'amulett',
        rarity: 'god',
        flavor: 'Den som bærer den, finner alltid det neste ordet.',
        stats: { styrke: 2 },
        pris: 110,
        utseende: { farge: '#e0b84a' },
    },
    {
        id: 'bjornetann',
        name: 'Bjørnetann',
        slot: 'amulett',
        rarity: 'sjelden',
        flavor: 'Den som tok den, kom tilbake. Det er hele historien.',
        stats: { styrke: 4, hp: 20 },
        utseende: { farge: '#efe6cf' },
    },
    {
        id: 'minnestein',
        name: 'Minnesteinen',
        slot: 'amulett',
        rarity: 'episk',
        flavor: 'Så lenge noen husker deg, er du ikke borte.',
        stats: { styrke: 4, vern: 4, hp: 30 },
        utseende: { farge: '#8fd3ff' },
    },

    // ── Hode ────────────────────────────────────────────────────────────────
    {
        id: 'ullhette',
        name: 'Ullhette',
        slot: 'hode',
        rarity: 'vanlig',
        flavor: 'Holder ørene varme. Ikke mye mer.',
        stats: { vern: 1 },
        pris: 25,
        utseende: { farge: '#6b5a44', form: 'hette' },
    },
    {
        id: 'larlue',
        name: 'Lærlue',
        slot: 'hode',
        rarity: 'god',
        flavor: 'Kokt lær, formet over et trehode mens det var vått.',
        stats: { vern: 2, hp: 5 },
        pris: 70,
        utseende: { farge: '#8a6440', form: 'lue' },
    },
    {
        id: 'jernhjelm',
        name: 'Jernhjelm',
        slot: 'hode',
        rarity: 'sjelden',
        flavor: 'Fire jernplater naglet sammen til en kuppel. Dyr å lage, så få hadde en.',
        stats: { vern: 4, hp: 10 },
        pris: 180,
        utseende: { farge: '#b8bec8', form: 'hjelm' },
    },
    {
        id: 'gjermundbu',
        name: 'Gjermundbu-hjelmen',
        slot: 'hode',
        rarity: 'episk',
        flavor: 'Den eneste hele vikinghjelmen som er funnet i Norge. Den har brilleskjerm over øynene, og ingen horn.',
        stats: { vern: 6, styrke: 2, hp: 15 },
        utseende: { farge: '#aeb4bc', form: 'brillehjelm' },
    },

    // ── Kappe ───────────────────────────────────────────────────────────────
    {
        id: 'vadmelskappe',
        name: 'Vadmelskappe',
        slot: 'kappe',
        rarity: 'vanlig',
        flavor: 'Grovt ullstoff. Du sover i den også.',
        stats: { hp: 5 },
        pris: 30,
        utseende: { farge: '#5a6a52' },
    },
    {
        id: 'ringnalkappe',
        name: 'Kappe med ringnål',
        slot: 'kappe',
        rarity: 'god',
        flavor: 'Nålen på skulderen holder kappa fast, så sverdarmen er fri.',
        stats: { vern: 1, hp: 10 },
        pris: 80,
        utseende: { farge: '#7a3a2e' },
    },
    {
        id: 'bjornepels',
        name: 'Bjørnepels',
        slot: 'kappe',
        rarity: 'sjelden',
        flavor: 'Tung og varm. Folk går til side når du kommer.',
        stats: { vern: 2, hp: 20, styrke: 1 },
        pris: 190,
        utseende: { farge: '#4a3626', form: 'pels' },
    },
    {
        id: 'hovdingkappe',
        name: 'Høvdingens kappe',
        slot: 'kappe',
        rarity: 'episk',
        flavor: 'Blått var den dyreste fargen. Den som bar blått, ville at alle skulle se det.',
        stats: { styrke: 2, vern: 2, hp: 25 },
        utseende: { farge: '#3a4a8a' },
    },

    // ── Hender ──────────────────────────────────────────────────────────────
    {
        id: 'ullvotter',
        name: 'Ullvotter',
        slot: 'hender',
        rarity: 'vanlig',
        flavor: 'Strikket av bestemor. Ett hull på tommelen.',
        stats: { hp: 3 },
        pris: 15,
        utseende: { farge: '#8a7a5a' },
    },
    {
        id: 'larhansker',
        name: 'Lærhansker',
        slot: 'hender',
        rarity: 'god',
        flavor: 'Godt grep om skaftet, også når det regner.',
        stats: { styrke: 1, vern: 1 },
        pris: 55,
        utseende: { farge: '#6a4a2e' },
    },
    {
        id: 'smedhansker',
        name: 'Smedens hansker',
        slot: 'hender',
        rarity: 'sjelden',
        flavor: 'Svidd i fingertuppene. De har holdt i glødende jern.',
        stats: { styrke: 2, vern: 2 },
        pris: 140,
        utseende: { farge: '#3e3a36' },
    },

    // ── Belte ───────────────────────────────────────────────────────────────
    {
        id: 'tausnor',
        name: 'Tausnor',
        slot: 'belte',
        rarity: 'vanlig',
        flavor: 'Det holder buksa oppe. Det er alt man kan be om.',
        stats: { hp: 2 },
        pris: 10,
        utseende: { farge: '#a08a5a' },
    },
    {
        id: 'bronsebelte',
        name: 'Belte med bronsespenne',
        slot: 'belte',
        rarity: 'god',
        flavor: 'Kniven henger på venstre side, pungen på høyre.',
        stats: { styrke: 1, hp: 5 },
        pris: 60,
        utseende: { farge: '#5a3a22', form: 'bronse' },
    },
    {
        id: 'solvbelte',
        name: 'Sølvbeslått belte',
        slot: 'belte',
        rarity: 'sjelden',
        flavor: 'Hvert beslag er et stykke sølv du ikke har brukt ennå.',
        stats: { styrke: 2, hp: 10 },
        pris: 150,
        utseende: { farge: '#4a3020', form: 'solv' },
    },

    // ── Bein ────────────────────────────────────────────────────────────────
    {
        id: 'vadmelsbukse',
        name: 'Vadmelsbukse',
        slot: 'bein',
        rarity: 'vanlig',
        flavor: 'Vid over lårene, smal nede. Slik gikk alle.',
        stats: { vern: 1 },
        pris: 20,
        utseende: { farge: '#5c4a36' },
    },
    {
        id: 'viklebukse',
        name: 'Bukse med vikler',
        slot: 'bein',
        rarity: 'god',
        flavor: 'Ullbånd viklet rundt leggen holder buksa inntil og kulda ute.',
        stats: { vern: 2, hp: 5 },
        pris: 65,
        utseende: { farge: '#4f5a3a', form: 'vikler' },
    },
    {
        id: 'jernskinner',
        name: 'Jernskinner',
        slot: 'bein',
        rarity: 'sjelden',
        flavor: 'Jernplater spent over leggen. Et hugg lavt treffer metall, ikke bein.',
        stats: { vern: 4, hp: 10 },
        pris: 170,
        utseende: { farge: '#9aa3ae', form: 'skinner' },
    },

    // ── Føtter ──────────────────────────────────────────────────────────────
    {
        id: 'larsko',
        name: 'Lærsko',
        slot: 'fotter',
        rarity: 'vanlig',
        flavor: 'Ett stykke lær, sydd sammen over foten.',
        stats: { hp: 2 },
        pris: 15,
        utseende: { farge: '#3a2a1a' },
    },
    {
        id: 'larstovler',
        name: 'Høye lærstøvler',
        slot: 'fotter',
        rarity: 'god',
        flavor: 'Gode på myra. Du kommer tørr hjem.',
        stats: { vern: 1, hp: 5 },
        pris: 55,
        utseende: { farge: '#5a3a22' },
    },
    {
        id: 'pelsstovler',
        name: 'Pelsstøvler',
        slot: 'fotter',
        rarity: 'sjelden',
        flavor: 'Med pelsen inn. Laget for vinteren nord i landet.',
        stats: { vern: 2, hp: 12 },
        pris: 130,
        utseende: { farge: '#7a6448' },
    },

    // ── Skjold ──────────────────────────────────────────────────────────────
    // Tallene i kampen (hvor mange slag det tåler) står i `SKJOLD` i
    // data/vaapen.ts. Her står bare gjenstanden eleven bærer.
    {
        id: 'treningsskjold',
        name: 'Treningsskjold',
        slot: 'skjold',
        rarity: 'vanlig',
        flavor: 'Tyngre enn det trenger å være. Det er meningen.',
        stats: {},
        pris: 10,
        skjold: 'treningsskjold',
    },
    {
        id: 'rundskjold',
        name: 'Rundskjold av lindetre',
        slot: 'skjold',
        rarity: 'god',
        flavor: 'Lindetre er lett og sprekker pent. Det siste er en fordel.',
        stats: { vern: 1 },
        pris: 60,
        skjold: 'rundskjold',
    },
    {
        id: 'jernskodd-rundskjold',
        name: 'Jernskodd rundskjold',
        slot: 'skjold',
        rarity: 'sjelden',
        flavor: 'Jernkant hele veien rundt. Du kjenner den i armen etter tre slag.',
        stats: { vern: 2 },
        pris: 150,
        skjold: 'jernskodd-rundskjold',
    },

    // ── Forbruksvarer ───────────────────────────────────────────────────────
    // Ingen plass på figuren: de brukes opp. Legg dem på hurtigbaren (1-4).
    {
        id: 'flatbrod',
        name: 'Flatbrød',
        rarity: 'vanlig',
        flavor: 'Tynt og tørt. Det holder seg hele vinteren.',
        stats: {},
        pris: 5,
        forbruk: { hp: 15, verb: 'Spis' },
    },
    {
        id: 'torrfisk',
        name: 'Tørrfisk',
        rarity: 'vanlig',
        flavor: 'Torsk som har hengt i vinden i månedsvis. Hard som tre.',
        stats: {},
        pris: 8,
        forbruk: { hp: 25, verb: 'Spis' },
    },
    {
        id: 'skyr',
        name: 'Skyr',
        rarity: 'god',
        flavor: 'Surmelk som er silt til den blir tykk. Vikingene spiste det til nesten alt.',
        stats: {},
        pris: 15,
        forbruk: { hp: 40, verb: 'Spis' },
    },
    {
        id: 'ryllik',
        name: 'Ryllik',
        rarity: 'god',
        flavor: 'En plante vikingene la på sår. Den får blodet til å stanse.',
        stats: {},
        pris: 25,
        forbruk: { hp: 60, verb: 'Bruk' },
    },
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** Rekkefølgen plassene står i, venstre kolonne først, som på figuren i WoW. */
export const SLOTS: ItemSlot[] = [
    'hode',
    'amulett',
    'kappe',
    'rustning',
    'hender',
    'belte',
    'bein',
    'fotter',
    'vapen',
    'skjold',
];

export const SLOT_LABEL: Record<ItemSlot, string> = {
    hode: 'Hode',
    amulett: 'Hals',
    kappe: 'Kappe',
    rustning: 'Bryst',
    hender: 'Hender',
    belte: 'Belte',
    bein: 'Bein',
    fotter: 'Føtter',
    vapen: 'Våpen',
    skjold: 'Skjold',
};

export const TOM_UTSTYR: Record<ItemSlot, Gjenstand | null> = {
    hode: null,
    amulett: null,
    kappe: null,
    rustning: null,
    hender: null,
    belte: null,
    bein: null,
    fotter: null,
    vapen: null,
    skjold: null,
};

/** Ruter i sekken. Fire rader à fem: nok til å velge, for lite til å hamstre. */
export const SEKK_PLASSER = 20;

/** Hurtigbaren har fire plasser, tast 1-4. */
export const HURTIG_PLASSER = 4;

/** Så mange av en forbruksvare får plass i én rute. */
export const STABEL_MAKS = 20;

/** Kan den tas på? Forbruksvarer har ingen plass på figuren. */
export function kanTasPa(item: ItemDef | undefined): item is ItemDef & { slot: ItemSlot } {
    return Boolean(item?.slot && !item.forbruk);
}

// ─── Holdbarhet ─────────────────────────────────────────────────────────────
//
// Utstyr slites i kamp. Våpenet mister et poeng for hvert treff det gir, og
// rustningen for hvert slag den tar. På null gir delen ingenting før en
// kremmer har reparert den. Smykker og skjold slites ikke her: skjoldet har
// sin egen slitasje inne i kampen, og den friskes opp ved hvile.

const HOLDBARHET_GRUNN: Partial<Record<ItemSlot, number>> = {
    vapen: 80,
    rustning: 60,
    hode: 45,
    kappe: 40,
    hender: 35,
    belte: 35,
    bein: 45,
    fotter: 35,
};

const SJELDEN_FAKTOR: Record<Rarity, number> = {
    vanlig: 1,
    god: 1.25,
    sjelden: 1.5,
    episk: 2,
};

/** Hvor mye den tåler når den er hel. `null` for ting som ikke slites. */
export function maksHoldbarhet(item: ItemDef | undefined): number | null {
    if (!item?.slot || item.forbruk) return null;
    const grunn = HOLDBARHET_GRUNN[item.slot];
    if (!grunn) return null;
    return Math.round(grunn * SJELDEN_FAKTOR[item.rarity]);
}

/** Holdbarheten som er igjen. Hel når feltet mangler. */
export function holdbarhetIgjen(g: Gjenstand): number | null {
    const maks = maksHoldbarhet(ITEM_BY_ID[g.id]);
    if (maks === null) return null;
    return Math.max(0, Math.min(maks, g.holdbarhet ?? maks));
}

/** Ødelagt: holdbarheten er brukt opp, og delen gir ingenting. */
export function erOdelagt(g: Gjenstand | null | undefined): boolean {
    return Boolean(g && holdbarhetIgjen(g) === 0);
}

// ─── Penger ─────────────────────────────────────────────────────────────────

const VERDI_UTEN_PRIS: Record<Rarity, number> = {
    vanlig: 20,
    god: 60,
    sjelden: 150,
    episk: 400,
};

/** Hva den er verdt. Varer uten pris er det likevel noen som vil kjøpe. */
export function verdi(item: ItemDef): number {
    return item.pris ?? VERDI_UTEN_PRIS[item.rarity];
}

/** Hva kremmeren gir for én. En firedel, som hos de fleste kremmere i WoW. */
export function salgspris(item: ItemDef): number {
    return Math.max(1, Math.round(verdi(item) * 0.25));
}

/** Hva det koster å gjøre én del hel igjen. */
export function reparasjonspris(g: Gjenstand): number {
    const item = ITEM_BY_ID[g.id];
    const maks = maksHoldbarhet(item);
    const igjen = holdbarhetIgjen(g);
    if (!item || maks === null || igjen === null || igjen >= maks) return 0;
    return Math.max(1, Math.ceil(((maks - igjen) / maks) * verdi(item) * 0.3));
}

// ─── Utstyret som helhet ────────────────────────────────────────────────────

/** Summerer bonusene fra alt utstyret som er på. Ødelagte deler teller ikke. */
export function equipmentBonus(utstyr: Record<ItemSlot, Gjenstand | null>) {
    const sum = { hp: 0, styrke: 0, vern: 0 };
    for (const g of Object.values(utstyr)) {
        if (!g || erOdelagt(g)) continue;
        const item = ITEM_BY_ID[g.id];
        if (!item) continue;
        for (const [key, value] of Object.entries(item.stats)) {
            sum[key as keyof typeof sum] += value ?? 0;
        }
    }
    return sum;
}

/** Slik figuren ser ut, del for del. Det smia trenger og ikke mer. */
export function utseendeFra(
    utstyr: Record<ItemSlot, Gjenstand | null>
): Partial<Record<ItemSlot, DelUtseende>> {
    const deler: Partial<Record<ItemSlot, DelUtseende>> = {};
    for (const slot of SLOTS) {
        const u = utstyr[slot] ? ITEM_BY_ID[utstyr[slot]!.id]?.utseende : undefined;
        if (u) deler[slot] = u;
    }
    return deler;
}

// ─── Lagrede spill ──────────────────────────────────────────────────────────
//
// Sekken var en liste med id-er fram til utstyrssystemet kom, og utstyret var
// én id per plass. Det står fortsatt slik på disken hos hver elev som har
// spilt, og i `andreEpoker` for epoker hun ikke har vært i siden. Derfor tar
// disse to imot begge former, og det er det eneste stedet som trenger å kjenne
// den gamle.

function tilGjenstand(r: unknown): Gjenstand | null {
    if (typeof r === 'string') return { id: r };
    if (r && typeof r === 'object' && typeof (r as Gjenstand).id === 'string') {
        const g = r as Gjenstand;
        const ut: Gjenstand = { id: g.id };
        if (typeof g.antall === 'number' && g.antall > 1) ut.antall = g.antall;
        if (typeof g.holdbarhet === 'number') ut.holdbarhet = g.holdbarhet;
        return ut;
    }
    return null;
}

/** En sekk i hvilken som helst form, gjort om til ruter. Ingenting kastes. */
export function normaliserSekk(r: unknown): (Gjenstand | null)[] {
    const liste = Array.isArray(r) ? r : [];
    // Den gamle formen hadde ingen tomme ruter, bare en liste. Den legges inn
    // forfra. Den nye har null for tomme ruter og beholder plassene sine.
    const ruter = liste.map(tilGjenstand);
    while (ruter.length < SEKK_PLASSER) ruter.push(null);
    return ruter;
}

export function normaliserUtstyr(r: unknown): Record<ItemSlot, Gjenstand | null> {
    const ut = { ...TOM_UTSTYR };
    if (!r || typeof r !== 'object') return ut;
    for (const slot of SLOTS) ut[slot] = tilGjenstand((r as Record<string, unknown>)[slot]);
    return ut;
}

export function normaliserHurtigbar(r: unknown): (string | null)[] {
    const liste = Array.isArray(r) ? r : [];
    return Array.from({ length: HURTIG_PLASSER }, (_, i) =>
        typeof liste[i] === 'string' ? (liste[i] as string) : null
    );
}
