import { EVNER, EVNE_ORDEN, KOMPANI, ORDERS, ENEMIES, NIVÅ, type EvneId, type Armor } from './tuning';
import { MAP_D, MAP_W } from './levels';
import { slagDef, har, reachable, unitsCanLink, type G, type IO, type Unit, type Enemy } from './game';
import { area, hit, alive, observed } from './combat';

// Ordrene i bølgen: det eleven gjør selv mens kampen går. Kompaniet (en tropp som går dit
// eleven klikker), snikskytteren (ett mål), sperreild (et område) og rakettfly (en linje).
// Alle har nedkjøling og er klare når bølgen starter. Eleven kjøper dem med forsyninger
// (`buyEvne`, også midt i bølgen), og nivå 2-3 lades fortere og slår hardere.
// Tallene står i tuning.ts (`EVNER`, `NIVÅ`, `ORDERS`).

/** Et nedslag: x, z og når det slår ned (sekunder etter ordren). */
type Shot = [number, number, number];

export interface Barrage {
    x: number;
    z: number;
    /** Sekunder siden ordren. */
    t: number;
    shells: Shot[];
    next: number;
}

export interface Snipe {
    id: number;
    t: number;
    /** Der skuddet kommer fra (enheten nærmest målet, eller kommandovogna). */
    x: number;
    z: number;
}

export interface Orders {
    /** Sekunder igjen til evnen er klar. Kompaniet: til et nytt kompani kommer fram. */
    cd: Record<EvneId, number>;
    /** Evnen eleven sikter med nå (neste klikk på kartet). */
    armed: EvneId | null;
    sperre: Barrage | null;
    strike: Barrage | null;
    snipe: Snipe | null;
    /** Kompaniet er slått ut og venter på å komme fram igjen. */
    down: boolean;
}

export const resetOrders = (): Orders => ({ cd: { kompani: 0, snik: 0, sperre: 0, rakett: 0 }, armed: null, sperre: null, strike: null, snipe: null, down: false });

/** Rakettflyet: starter så langt vest for målet, og rakettene bruker så lang tid (s). */
export const STRIKE_FROM = 12;
export const ROCKET_T = 0.3;
/** Flyet skyter når det er så langt fra midten av linja. */
const FIRE_AT = 2.6;

/** Finnes ordren i butikken ennå (slag og bølge i `EVNER.fra`)? */
export function offered(g: G, id: EvneId) {
    const [s, w] = EVNER[id].fra;
    return g.slag > s || (g.slag === s && g.wave >= w);
}

/** Har eleven kjøpt ordren? */
export const owned = (g: G, id: EvneId) => g.evne[id] > 0;

/** Ordrene i butikken nå, i tasterekkefølge (kjøpt eller ikke). */
export function evner(g: G) {
    return EVNE_ORDEN.filter((id) => offered(g, id));
}

/** Prisen på neste kjøp (nivå 1, 2 eller 3), eller null når ordren er på toppen. */
export function priceOf(g: G, id: EvneId) {
    return EVNER[id].pris[g.evne[id]] ?? null;
}

/** Kjøp ordren eller neste nivå. Går i planleggingen og midt i bølgen. */
export function buyEvne(g: G, id: EvneId, io?: IO) {
    const pris = priceOf(g, id);
    if (pris === null || !offered(g, id) || pris > g.forsyninger) return false;
    if (g.phase !== 'plan' && g.phase !== 'wave') return false;
    g.forsyninger -= pris;
    g.evne[id] += 1;
    g.valg += 1;
    // Et sterkere kompani: flere tropper i det som står ute (og fullt helset).
    const u = squadOf(g);
    if (id === 'kompani' && u) squadLevel(g, u);
    if (id === 'kompani' && g.phase === 'wave' && !u) {
        g.ord.cd.kompani = 0;
        g.ord.down = false;
        spawnSquad(g);
    }
    // Neste nivå lades fortere: det som står igjen av nedkjølingen krymper også.
    if (g.evne[id] > 1) g.ord.cd[id] *= NIVÅ.cd[g.evne[id] - 1] / NIVÅ.cd[g.evne[id] - 2];
    io?.sfx('kjøp');
    const [hx, hz] = slagDef(g).hq;
    io?.event(`kjøpt:${id}:${g.evne[id]}`, hx, hz);
    return true;
}

export function cdOf(g: G, id: EvneId) {
    const lv = Math.max(1, g.evne[id]);
    return EVNER[id].cd * NIVÅ.cd[lv - 1] * (id === 'sperre' && har(g, 'sperre') ? ORDERS.sperreKort : 1);
}

/** Skaden til ordren på nivået eleven har kjøpt. */
function kraft(g: G, id: EvneId, dmg: Record<Armor, number>, a: Armor) {
    return dmg[a] * NIVÅ.kraft[Math.max(1, g.evne[id]) - 1];
}
const scaled = (g: G, id: EvneId, dmg: Record<Armor, number>) =>
    ({ soft: kraft(g, id, dmg, 'soft'), armor: kraft(g, id, dmg, 'armor'), gun: kraft(g, id, dmg, 'gun'), air: kraft(g, id, dmg, 'air') });

/** Kompaniet på nivå n er n tropper (`NIVÅ.kompani` ganger hp og skade). */
function squadLevel(g: G, u: Unit) {
    u.copies = Math.max(1, g.evne.kompani);
    u.maxHp = KOMPANI.hp * NIVÅ.kompani[u.copies - 1];
    u.hp = u.maxHp;
}

export const squadOf = (g: G) => g.units.find((u) => u.squad && !u.dead);

/** Holder evnen på (granatene er i lufta, flyet er på vei)? */
export function busy(g: G, id: EvneId) {
    const o = g.ord;
    if (id === 'sperre') return !!o.sperre;
    if (id === 'rakett') return !!o.strike;
    if (id === 'snik') return !!o.snipe;
    return !squadOf(g);
}

export function ready(g: G, id: EvneId) {
    return g.phase === 'wave' && owned(g, id) && g.ord.cd[id] <= 0 && !busy(g, id);
}

/** Væpn en evne (neste klikk på kartet bruker den), eller slå den av. Kompaniet: velg det. */
export function arm(g: G, id: EvneId) {
    if (g.ord.armed === id) {
        g.ord.armed = null;
        return true;
    }
    if (!ready(g, id)) return false;
    g.ord.armed = id;
    return true;
}

// ---- Kompaniet ---------------------------------------------------------------------
export function spawnSquad(g: G) {
    if (!owned(g, 'kompani') || squadOf(g)) return;
    const [hx, hz] = slagDef(g).hq;
    const x = Math.min(MAP_W - 0.5, hx + 0.9);
    const z = hz + 0.35;
    const u: Unit = {
        id: g.nextId++,
        kind: 'inf',
        x,
        z,
        hp: KOMPANI.hp,
        maxHp: KOMPANI.hp,
        copies: 1,
        vet: false,
        linked: false,
        via: 0,
        linking: 0,
        cd: 0,
        ax: x,
        az: z,
        alt: 0,
        heading: Math.PI / 2,
        mode: 'bakke',
        tx: x,
        tz: z,
        toktCd: 0,
        dead: false,
        kick: 0,
        squad: true,
        follow: -1,
        net: false,
    };
    squadLevel(g, u);
    g.units.push(u);
}

/** Kan eleven se fienden på kartet? (Skjulte kanoner og batterier bare når nettet ser dem.) */
const visible = (g: G, e: Enemy) => alive(e) && !ENEMIES[e.kind].fly && (!e.dug || g.netSeen.has(e.id) || (e.kind === 'ebatt' && e.revealed));
/** Snikskytteren får målet over radioen: bare det nettet ser. */
const spotted = (g: G, e: Enemy) => visible(g, e) && g.netSeen.has(e.id);

/** Nærmeste fiende på bakken eleven kan se (`net`: som nettet ser), innenfor r av klikket. */
export function enemyNear(g: G, x: number, z: number, r: number, net = false) {
    let best: Enemy | undefined;
    let bd = r;
    for (const e of g.enemies) {
        if (!(net ? spotted(g, e) : visible(g, e))) continue;
        const d = Math.hypot(e.x - x, e.z - z);
        if (d < bd) {
            bd = d;
            best = e;
        }
    }
    return best;
}

const clampX = (x: number) => Math.max(0.3, Math.min(MAP_W - 0.3, x));
const clampZ = (z: number) => Math.max(0.3, Math.min(MAP_D - 0.3, z));

/** Kompaniet: gå hit, eller gå etter fienden eleven klikket på. */
export function orderSquad(g: G, x: number, z: number, io?: IO) {
    const u = squadOf(g);
    if (!u || g.phase !== 'wave') return false;
    const e = enemyNear(g, x, z, 0.9);
    if (e) u.follow = e.id;
    else {
        u.follow = -1;
        u.tx = clampX(x);
        u.tz = clampZ(z);
    }
    g.valg += 1;
    io?.sfx('marsj');
    io?.event(e ? 'angrip' : 'marsj', e ? e.x : u.tx, e ? e.z : u.tz);
    return true;
}

function stepSquad(g: G, u: Unit, dt: number) {
    u.net = unitsCanLink(g) && reachable(g, u.x, u.z, u.id);
    let tx = u.tx;
    let tz = u.tz;
    let stop = 0.05;
    if (u.follow !== undefined && u.follow >= 0) {
        const e = g.enemies.find((v) => v.id === u.follow);
        if (!e || !alive(e)) {
            u.follow = -1;
            u.tx = u.x;
            u.tz = u.z;
            return;
        }
        tx = e.x;
        tz = e.z;
        stop = KOMPANI.range * 0.8;
    }
    const dx = tx - u.x;
    const dz = tz - u.z;
    const d = Math.hypot(dx, dz);
    if (d <= stop) return;
    const step = Math.min(d - stop, KOMPANI.fart * dt);
    u.x = clampX(u.x + (dx / d) * step);
    u.z = clampZ(u.z + (dz / d) * step);
    u.ax = u.x;
    u.az = u.z;
    u.heading = Math.atan2(dx, dz);
}

// ---- Snikskytter, sperreild og rakettfly ---------------------------------------------
export function snipe(g: G, x: number, z: number, io?: IO) {
    if (!ready(g, 'snik')) return false;
    const e = enemyNear(g, x, z, 1.2, true);
    if (!e) return false;
    // Skuddet kommer fra den av dine som står nærmest (eller kommandovogna).
    let [sx, sz] = slagDef(g).hq;
    let bd = Math.hypot(sx - e.x, sz - e.z);
    for (const u of g.units) {
        if (u.dead || u.mode !== 'bakke') continue;
        const d = Math.hypot(u.x - e.x, u.z - e.z);
        if (d < bd) {
            bd = d;
            sx = u.x;
            sz = u.z;
        }
    }
    g.ord.snipe = { id: e.id, t: 0, x: sx, z: sz };
    g.ord.cd.snik = cdOf(g, 'snik');
    g.ord.armed = null;
    g.valg += 1;
    io?.sfx('sikte');
    io?.event('sikte', e.x, e.z);
    return true;
}

/** Kan ordren gå hit? Sperreild og rakettfly trenger noen i nettet som ser stedet. */
export function canCall(g: G, id: EvneId, x: number, z: number) {
    if (id === 'sperre' || id === 'rakett') return observed(g, x, z);
    if (id === 'snik') return !!enemyNear(g, x, z, 1.2, true);
    return true;
}

export function barrage(g: G, x: number, z: number, io?: IO) {
    if (!ready(g, 'sperre') || !observed(g, x, z)) return false;
    const o = ORDERS.sperreild;
    const shells: Shot[] = [];
    for (let k = 0; k < o.granater; k++) {
        const a = g.rng() * Math.PI * 2;
        const r = o.radius * Math.sqrt(g.rng()) * 0.92;
        shells.push([x + Math.cos(a) * r, z + Math.sin(a) * r, o.forsinkelse + (k / o.granater) * o.varighet + g.rng() * 0.08]);
    }
    g.ord.sperre = { x, z, t: 0, shells, next: 0 };
    g.ord.cd.sperre = cdOf(g, 'sperre');
    g.ord.armed = null;
    g.valg += 1;
    io?.sfx('ordre');
    io?.event('sperreOrdre', x, z);
    return true;
}

/** Rakettflyet flyr fra vest mot øst over punktet og skyter rakettene langs en linje. */
export function rocket(g: G, x: number, z: number, io?: IO) {
    if (!ready(g, 'rakett') || !observed(g, x, z)) return false;
    const o = ORDERS.rakett;
    const shells: Shot[] = [];
    const fire = (STRIKE_FROM - FIRE_AT) / o.fart;
    for (let i = 0; i < o.raketter; i++) {
        const k = i / (o.raketter - 1);
        shells.push([x - o.lengde / 2 + k * o.lengde, z + (i % 2 ? 0.22 : -0.22), fire + i * 0.07 + ROCKET_T]);
    }
    g.ord.strike = { x, z, t: 0, shells, next: 0 };
    g.ord.cd.rakett = cdOf(g, 'rakett');
    g.ord.armed = null;
    g.valg += 1;
    io?.sfx('ordre');
    io?.event('rakettOrdre', x, z);
    return true;
}

/** Nedslagene som har kommet fram: skade og en effekt hver. Null når alle har falt. */
function land(g: G, b: Barrage, dt: number, kind: 'sperre' | 'rakett', io: IO) {
    b.t += dt;
    const o = kind === 'sperre' ? ORDERS.sperreild : ORDERS.rakett;
    const dmg = scaled(g, kind === 'sperre' ? 'sperre' : 'rakett', o.skade);
    while (b.next < b.shells.length && b.shells[b.next][2] <= b.t) {
        const [sx, sz] = b.shells[b.next++];
        area(g, sx, sz, o.sprut, dmg, io);
        g.fx.push({ kind, x: sx, z: sz, x2: sx, z2: sz, alt: 0, t: 0, life: 0.5, fiende: false });
    }
    if (b.next < b.shells.length) return b;
    io.event(kind === 'sperre' ? 'sperreild' : 'raketter', b.x, b.z);
    return null;
}

// ---- Tidssteget ----------------------------------------------------------------------
export function stepOrders(g: G, dt: number, io: IO) {
    const o = g.ord;
    for (const id of EVNE_ORDEN) if (o.cd[id] > 0) o.cd[id] = Math.max(0, o.cd[id] - dt);
    if (o.armed && !ready(g, o.armed)) o.armed = null;
    const u = squadOf(g);
    if (u) stepSquad(g, u, dt);
    else if (owned(g, 'kompani')) {
        // Kompaniet er slått ut: et nytt kommer fram ved kommandovogna etter nedkjølingen.
        if (!o.down) {
            o.down = true;
            o.cd.kompani = cdOf(g, 'kompani');
        } else if (o.cd.kompani <= 0) {
            o.down = false;
            spawnSquad(g);
            const [hx, hz] = slagDef(g).hq;
            io.event('kompaniKlar', hx, hz);
        }
    }
    if (o.snipe) {
        const s = o.snipe;
        s.t += dt;
        if (s.t >= ORDERS.snik.sikt) {
            const e = g.enemies.find((v) => v.id === s.id);
            if (e && alive(e)) {
                g.fx.push({ kind: 'snik', x: s.x, z: s.z, x2: e.x, z2: e.z, alt: e.alt, t: 0, life: 0.3, fiende: false });
                hit(g, e, kraft(g, 'snik', ORDERS.snik.skade, ENEMIES[e.kind].armor), io);
                io.event(e.dead ? 'snikDrap' : 'snik', e.x, e.z);
            }
            o.snipe = null;
        }
    }
    if (o.sperre) o.sperre = land(g, o.sperre, dt, 'sperre', io);
    if (o.strike) o.strike = land(g, o.strike, dt, 'rakett', io);
}
