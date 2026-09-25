// Selvspill-roboter for Løp med lønna. De bruker samme grep som eleven: velg et
// sted på plassen og la kjerra kjøre dit (driveToStation), bare uten å sikte med
// musa. Kjøp, henting og levering skjer av seg selv når kjerra står ved døra -
// akkurat som for eleven.

import {
    STATIONS,
    FOOD_PER,
    HEAT_PER,
    CART_CAP,
    atStation,
    canAfford,
    distTo,
    driveToStation,
    isClosed,
    type G,
    type Good,
    type StationId,
} from './game';

export interface BotMemory {
    shop: StationId | null;
    quota: number;
    boughtAtStart: number;
    homeFirst: boolean;
    lastCashT: number;
}

export const newBotMemory = (): BotMemory => ({
    shop: null,
    quota: 0,
    boughtAtStart: 0,
    homeFirst: false,
    lastCashT: -99,
});

export interface BotStyle {
    /** Tar lønna med hjem før den handler (ignorerer at pengene råtner). */
    hjemFoerst?: boolean;
    /** Kjøper aldri kull. */
    bareMat?: boolean;
}

function deficits(g: G) {
    let food = 100 - g.food;
    let heat = 100 - g.heat;
    for (const it of g.items) {
        if (it.good === 'kull') heat -= HEAT_PER;
        else food -= FOOD_PER;
    }
    return { food: Math.max(0, food), heat: Math.max(0, heat) };
}

function foodShop(g: G): StationId | null {
    const open = (['bakeri', 'marked'] as StationId[]).filter(
        (id) => !isClosed(g, id) && canAfford(g, STATIONS[id].good!)
    );
    if (!open.length) return null;
    return open.sort((a, b) => distTo(g, a) - distTo(g, b))[0];
}

export function botTick(g: G, mem: BotMemory, style: BotStyle = {}) {
    if (g.cashT !== mem.lastCashT) {
        mem.lastCashT = g.cashT;
        mem.homeFirst = !!style.hjemFoerst;
        mem.shop = null;
    }
    if (mem.homeFirst) {
        if (atStation(g, 'hjem')) mem.homeFirst = false;
        else return driveToStation(g, 'hjem');
    }

    // Holder lageret hjemme på å gå tomt, og kjerra har det som trengs: lever først.
    const hasFood = g.items.some((it) => it.good !== 'kull');
    const hasHeat = g.items.some((it) => it.good === 'kull');
    if ((g.food < 22 && hasFood) || (g.heat < 22 && hasHeat)) {
        mem.shop = null;
        return driveToStation(g, 'hjem');
    }

    // Står vi og handler: bli til kvoten er nådd eller pengene/plassen er brukt opp.
    if (mem.shop) {
        const good = STATIONS[mem.shop].good as Good;
        const done =
            g.bought - mem.boughtAtStart >= mem.quota ||
            !canAfford(g, good) ||
            g.items.length >= CART_CAP ||
            isClosed(g, mem.shop);
        if (!done) return driveToStation(g, mem.shop);
        mem.shop = null;
    }

    // Lønna ligger i luka og sedlene i kjerra er nesten verdiløse: hent.
    const cheap = !canAfford(g, 'brod');
    if (g.payReady > 0 && cheap) return driveToStation(g, 'fabrikk');

    const def = deficits(g);
    const room = CART_CAP - g.items.length;
    if (!cheap && room > 0 && def.food + def.heat > 0) {
        const wantHeat =
            !style.bareMat &&
            def.heat > def.food * 0.8 &&
            !isClosed(g, 'kullhandel') &&
            canAfford(g, 'kull');
        const shop = wantHeat
            ? 'kullhandel'
            : (foodShop(g) ?? (!style.bareMat && !isClosed(g, 'kullhandel') ? 'kullhandel' : null));
        if (shop) {
            const heatShop = shop === 'kullhandel';
            const share = heatShop
                ? def.heat / Math.max(1, def.food + def.heat)
                : style.bareMat
                  ? 1
                  : def.food / Math.max(1, def.food + def.heat);
            const need = Math.ceil((heatShop ? def.heat / HEAT_PER : def.food / FOOD_PER) + 0.5);
            mem.quota = Math.max(1, Math.min(need, Math.ceil(room * Math.max(0.4, share) + 0.5)));
            mem.boughtAtStart = g.bought;
            mem.shop = shop;
            return driveToStation(g, shop);
        }
    }
    if (g.items.length > 0) return driveToStation(g, 'hjem');
    return driveToStation(g, 'fabrikk');
}
