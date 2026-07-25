import type { ItemDef, ItemSlot, Rarity } from '../types';

// Alt utstyr tegnes prosedyralt ut fra `weapon.art` og sjeldenhetsfargen, så
// nye gjenstander koster ingenting i grafikk - bare en rad i denne tabellen.

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
        stats: { mana: 10 },
        weapon: { skade: 5, hastighet: 420, rekkevidde: 38, bue: 80, art: 'stav' },
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
        stats: { visdom: 4, mana: 20 },
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
    },
    {
        id: 'lerbrynje',
        name: 'Lærbrynje',
        slot: 'rustning',
        rarity: 'god',
        flavor: 'Kokt lær. Lett nok til å løpe i.',
        stats: { vern: 4, hp: 15 },
        pris: 90,
    },
    {
        id: 'ringbrynje',
        name: 'Ringbrynje',
        slot: 'rustning',
        rarity: 'sjelden',
        flavor: 'Tusenvis av små ringer, hektet i hverandre for hånd.',
        stats: { vern: 8, hp: 30 },
        pris: 220,
    },
    {
        id: 'glemselskappen',
        name: 'Glemselskappen',
        slot: 'rustning',
        rarity: 'episk',
        flavor: 'Tatt fra fienden. Nå beskytter den mot sin egen art.',
        stats: { vern: 12, hp: 45, visdom: 3 },
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
    },
    {
        id: 'skaldering',
        name: 'Skaldens ring',
        slot: 'amulett',
        rarity: 'god',
        flavor: 'Den som bærer den, finner alltid det neste ordet.',
        stats: { visdom: 3, mana: 15 },
    },
    {
        id: 'bjornetann',
        name: 'Bjørnetann',
        slot: 'amulett',
        rarity: 'sjelden',
        flavor: 'Den som tok den, kom tilbake. Det er hele historien.',
        stats: { styrke: 4, hp: 20 },
    },
    {
        id: 'minnestein',
        name: 'Minnesteinen',
        slot: 'amulett',
        rarity: 'episk',
        flavor: 'Så lenge noen husker deg, er du ikke borte.',
        stats: { visdom: 5, vern: 4, mana: 30, hp: 30 },
    },
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const SLOT_LABEL: Record<ItemSlot, string> = {
    vapen: 'Våpen',
    rustning: 'Rustning',
    amulett: 'Amulett',
};

/** Summerer bonusene fra alt utstyret som er på. */
export function equipmentBonus(utstyr: Record<ItemSlot, string | null>) {
    const sum = { hp: 0, mana: 0, styrke: 0, visdom: 0, vern: 0 };
    for (const id of Object.values(utstyr)) {
        if (!id) continue;
        const item = ITEM_BY_ID[id];
        if (!item) continue;
        for (const [key, value] of Object.entries(item.stats)) {
            sum[key as keyof typeof sum] += value ?? 0;
        }
    }
    return sum;
}
