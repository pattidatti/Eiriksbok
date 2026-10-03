// Livet langs veien rundt bunnen av Vågen (strandgaten.ts): folk som går hele veien mellom Vågsbunnen og
// Stranden med det de skal ha fram (en bunt fisk, et par sko, ei bøtte vann, en kjerre med tønner),
// og folk som arbeider der veien går forbi: en fiskekone som renser fisk på kaia, en gammel kone på en
// benk, ei som vasker klær i et kar, en fisker som bøter garn, en mann som tjærer en færing som ligger
// opp ned, og barn som leker. Klesvask blafrer på snorene bak gjerdet, og fisken henger på hjellen.
//
// Det vi vet: at byen gikk rundt den innerste enden av Vågen [V Byleksikon «Vågsbunnen», «Strandsiden»],
// at tørrfisk ble hengt på hjeller og at færinger ble tjæret [V, allment kjent fra kysten]. Hvordan livet
// langs veien var i 1420-årene, er ikke funnet [K]. Folkene, arbeidet og hvor ting står, er valgt for
// spillet [S].
import * as THREE from 'three';
import type { ColliderKit, MeshKit } from '../motor/meshkit';
import type { DyreSone } from '../motor/dyr';
import { DARK, WARM, tonne } from './gard';
import type { Dagsfigur, FasePlass, Vei } from './dagsplan';
import type { Stopp } from './vandrer';
import { klesvask } from './uro';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Strekningene (strandgatenMaal i strandgaten.ts). */
export interface VeiMaal {
    gate: { x0: number; x1: number; z0: number; z1: number };
    kaiVaag: { x0: number; x1: number; z0: number; z1: number };
    strand: { x0: number; x1: number; z0: number; z1: number };
}

const OST = Math.PI / 2;
const VEST = -Math.PI / 2;
const SOR = Math.PI;

export interface VeiLiv {
    plasser: FasePlass[];
    figurer: Dagsfigur[];
    vei: Vei;
    soner: DyreSone[];
    /** Færingen som ligger opp ned (midten, retning langs x). */
    baat: THREE.Vector3;
}

/**
 * Hovedlinja veien følger: fra gata bak bommen, ned kaia langs bunnen av Vågen og østover på
 * Strandgaten. Folk som bytter sted (dagsplan.ts) går langs den.
 */
function linje(M: VeiMaal): THREE.Vector3[] {
    const xk = (M.kaiVaag.x0 + M.kaiVaag.x1) / 2;
    const zg = (M.gate.z0 + M.gate.z1) / 2;
    const zs = M.strand.z1 - 1.6;
    return [V(M.gate.x0 + 2.5, 0, zg), V(xk, 0, zg), V(xk, 0, zs), V(M.strand.x1 - 4, 0, zs)];
}

/** Nærmeste punkt på linja, og hvilket stykke det ligger på. */
function paaLinja(L: THREE.Vector3[], p: THREE.Vector3): { q: THREE.Vector3; i: number } {
    let best = { q: L[0].clone(), i: 0, d: Infinity };
    for (let i = 0; i < L.length - 1; i++) {
        const a = L[i];
        const ab = L[i + 1].clone().sub(a).setY(0);
        const t = THREE.MathUtils.clamp(p.clone().sub(a).setY(0).dot(ab) / ab.lengthSq(), 0, 1);
        const q = a.clone().addScaledVector(ab, t);
        const d = q.distanceToSquared(V(p.x, 0, p.z));
        if (d < best.d) best = { q, i, d };
    }
    return best;
}

/** Folk og ting langs veien. Bygger tingene i `k`/`c`, og gir folkene, veien og dyrene. */
export function veiLiv(M: VeiMaal, k: MeshKit, c: ColliderKit, r: () => number): VeiLiv {
    const L = linje(M);
    const kv = M.kaiVaag;
    const st = M.strand;
    /** Banene på kaia langs bunnen av Vågen (sørover, nordover) og på Strandgaten (østover, vestover). */
    const xSor = kv.x1 - 1.55;
    const xNord = kv.x1 - 0.85;
    const zOst = st.z1 - 1.25;
    const zVest = st.z1 - 2.35;
    /** Stripa i gjørma inntil gjerdet (der folk arbeider), og gjerdet. */
    const zStripe = st.z0 + 1.2;
    const P = (x: number, z: number, s: Partial<Stopp> = {}): Stopp => ({ p: V(x, 0, z), ...s });

    const plasser: FasePlass[] = [];
    const dag: FasePlass['naar'] = ['morgen', 'dag'];
    const hele: FasePlass['naar'] = ['morgen', 'dag', 'kveld'];

    // ── Kaia langs bunnen av Vågen ──
    // Den gamle kona på benken mot husveggen ser ut over Vågen.
    const benkZ = -24;
    benk(k, c, kv.x0 + 0.42, benkZ);
    plasser.push({ figur: 'gammelkone', rolle: 'sitte', pos: V(kv.x0 + 0.42, 0.45, benkZ), yaw: OST, naar: hele });
    kurv(k, c, kv.x0 + 0.4, benkZ + 1.15, 0.9);
    // Fiskekona renser fisk på en benk mot veggen, med et kar til innvollene og måkene over (maaker.ts).
    const rensZ = -58;
    rensebenk(k, c, kv.x0 + 0.38, rensZ);
    plasser.push({ figur: 'fiskekone', rolle: 'hamre', pos: V(kv.x0 + 1.05, 0, rensZ), yaw: VEST, naar: dag });
    // Tønner, kasser og et garn mot husveggene.
    for (const z of [-8, -40, -77, -101]) {
        tonne(k, c, kv.x0 + 0.42, z, 0.75 + r() * 0.2);
        if (r() < 0.6) tonne(k, c, kv.x0 + 0.42, z - 0.68, 0.7 + r() * 0.2);
    }
    for (const z of [-31, -88, -112]) kasse(k, c, kv.x0 + 0.38, z, r);
    // Pullerter i kaikanten.
    k.withTint({ top: 0.7, bottom: 0.7 }, () => {
        for (let z = kv.z1 - 6; z > kv.z0 + 3; z -= 9) k.log('raatre', V(kv.x1 - 0.25, -0.1, z), V(kv.x1 - 0.25, 0.5, z), 0.13, 7, true, 0.11);
    });
    for (let z = kv.z1 - 6; z > kv.z0 + 3; z -= 9) c.box(kv.x1 - 0.25, 0.25, z, 0.26, 0.6, 0.26, true);

    // ── Strandgaten ──
    // Ei kone vasker klær i et kar ved gjerdet, med en kurv og vasken som henger bak gjerdet.
    const vaskX = -141;
    kar(k, c, vaskX, zStripe - 0.45);
    kurv(k, c, vaskX + 1.0, zStripe - 0.2, 1);
    plasser.push({ figur: 'husfrue', rolle: 'knele', pos: V(vaskX, 0, zStripe + 0.35), yaw: SOR, naar: dag });
    // Fiskeren bøter garn på hjellen.
    const garnX = -157;
    garnhjell(k, c, garnX - 2.2, garnX + 2.2, zStripe - 0.4);
    plasser.push({ figur: 'fisker', rolle: 'knele', pos: V(garnX + 0.4, 0, zStripe + 0.35), yaw: SOR, naar: dag });
    // Mannen som tjærer færingen: den ligger opp ned på to bukker, med en tjærepott ved siden av.
    const baat = V(-113.5, 0, zStripe - 0.35);
    bukker(k, c, baat);
    tjaerepott(k, c, baat.x + 2.6, zStripe + 0.15);
    plasser.push({ figur: 'husmann', rolle: 'hamre', pos: V(baat.x + 1.0, 0, zStripe + 0.55), yaw: SOR, naar: dag });
    // Tørrfisk på hjell, og kasser og kurver.
    fiskehjell(k, c, -79.5, -71.5, zStripe - 0.35);
    for (const x of [-131, -96, -66]) kasse(k, c, x, zStripe - 0.1, r);
    kurv(k, c, -88.6, zStripe - 0.2, 0.95);
    // Klesvask bak gjerdet (snora langs x: vinden i seilduken blåser langs z).
    for (const [x0, x1] of [[-170.5, -165], [-145, -138.5], [-121, -116.5], [-62, -56]] as const) klesvask(k, V(x0, 0, st.z0 - 1.1), V(x1, 0, st.z0 - 1.1), r, 1.75);
    // Grinder i gjerdet der folk går inn til husene sine.
    const grinder = [-149.5, -125.5, -84.5].map((x) => V(x, 0, st.z0 + 0.35));
    for (const g of grinder) grind(k, g.x, st.z0);

    // ── Folk som går ──
    const hjemGate = [V(M.gate.x0 + 3.2, 0, M.gate.z1 - 0.6), V(M.gate.x0 + 7.4, 0, M.gate.z1 - 0.6)];
    const ostEnde = st.x1 - 5;
    /** Hele veien fram og tilbake, fra gata bak bommen til Stranden. `last`: tar opp ved start, setter fra seg i Stranden. */
    const zMidt = (kv.z0 + kv.z1) / 2;
    const xMidt = (xSor + ostEnde) / 2;
    const helVei = (x0: number, bunt: boolean, ventOst = 8): Stopp[] => [
        P(x0, (M.gate.z0 + M.gate.z1) / 2 + 0.6, { vent: 5, ...(bunt ? { last: true } : {}) }),
        P(xSor, (M.gate.z0 + M.gate.z1) / 2 + 0.6),
        P(xSor, zMidt),
        P(xSor, zOst),
        P(xMidt, zOst),
        P(ostEnde, zOst, { vent: ventOst, ...(bunt ? { last: false } : {}) }),
        P(ostEnde, zVest),
        P(xMidt, zVest),
        P(xNord, zVest),
        P(xNord, zMidt),
        P(xNord, (M.gate.z0 + M.gate.z1) / 2 - 0.6),
        P(x0, (M.gate.z0 + M.gate.z1) / 2 - 0.6),
    ];
    const rot = <T,>(a: T[], n: number): T[] => [...a.slice(n % a.length), ...a.slice(0, n % a.length)];
    /** Samme vei, men bæringen motsatt vei: tar opp i Stranden og setter fra seg i Vågsbunnen. */
    const snudd = (a: Stopp[]): Stopp[] => a.map((s) => (s.last === undefined ? s : { ...s, last: !s.last }));
    // Barna leker sisten rundt kassene og fiskehjellen.
    const lek: Stopp[] = [P(-97.5, zStripe + 0.9), P(-90.5, zStripe + 0.8), P(-90.6, st.z1 - 2.9), P(-97.4, st.z1 - 2.9)];

    const figurer: Dagsfigur[] = [
        // Skomakersvennen bærer sko til kundene på Stranden.
        { figur: 'skomakersvenn', hjem: hjemGate[0], fart: 1.2, plan: { morgen: rot(helVei(M.gate.x0 + 3.2, true), 1), kveld: 'hjemme' } },
        // Bondekona med kurven: fra Stranden og inn til byen og tilbake.
        { figur: 'bondekone', hjem: grinder[2], fart: 1.0, plan: { morgen: rot(snudd(helVei(M.gate.x0 + 4.5, true, 14)), 2), kveld: 'hjemme' } },
        // Mannen med kjerra og tønnene.
        { figur: 'husmann', hjem: hjemGate[1], fart: 0.85, baer: 'kjerre', plan: { morgen: 'hjemme', dag: rot(helVei(M.gate.x0 + 6, false, 12), 2), kveld: 'hjemme' } },
        // Husfrua henter vann i Vågsbunnen og bærer det hjem til Strandgaten.
        {
            figur: 'tjenestejente', hjem: grinder[0], fart: 1.05, baer: 'botte', plan: {
                morgen: rot(helVei(M.gate.x0 + 5.2, true, 6), 1),
                kveld: 'hjemme',
            },
        },
        // En fisker på vei mellom båten og huset, og presten fra Jonskirken på vei til Vågsbunnen.
        { figur: 'fisker', hjem: grinder[1], fart: 1.15, plan: { morgen: rot(helVei(M.gate.x0 + 3.8, false, 10), 3), kveld: rot(helVei(M.gate.x0 + 3.8, false), 3), natt: 'hjemme' } },
        { figur: 'prest', hjem: V(ostEnde, 0, zOst), fart: 0.8, plan: { morgen: 'hjemme', dag: rot(helVei(M.gate.x0 + 4.2, false, 20), 3), kveld: 'hjemme' } },
        { figur: 'gutt', hjem: grinder[2], fart: 2.6, forskyv: 28, plan: { morgen: 'hjemme', dag: lek, kveld: rot(lek, 2), natt: 'hjemme' } },
        { figur: 'jente', hjem: grinder[2], fart: 2.45, forskyv: 33, plan: { morgen: 'hjemme', dag: rot(lek, 2), kveld: lek, natt: 'hjemme' } },
        // En borger på vei til Jonskirken, og ei kone som har handlet i Vågsbunnen.
        { figur: 'borger', hjem: hjemGate[1], fart: 1.0, plan: { morgen: 'hjemme', dag: helVei(M.gate.x0 + 6.6, false, 16), kveld: rot(helVei(M.gate.x0 + 6.6, false), 6), natt: 'hjemme' } },
        { figur: 'kjopekone', hjem: grinder[1], fart: 1.05, plan: { morgen: rot(snudd(helVei(M.gate.x0 + 2.6, true, 6)), 6), kveld: 'hjemme' } },
    ];
    // Hvor langs veien hver starter: dagsplanen starter figur i ved punkt 3i (dagsplan.ts), og `rot`
    // flytter det, så de står spredt (1, 5, 8, 10, 3, 6 og 0, 9 av 12 punkter) og ikke i klump.

    /** Langs linja: fra der hen står inn på veien, langs den, og ut til målet. */
    const vei: Vei = (a, b) => {
        const pa = paaLinja(L, a);
        const pb = paaLinja(L, b);
        const ut: THREE.Vector3[] = [pa.q];
        if (pa.i < pb.i) for (let i = pa.i + 1; i <= pb.i; i++) ut.push(L[i].clone());
        else if (pa.i > pb.i) for (let i = pa.i; i > pb.i; i--) ut.push(L[i].clone());
        ut.push(pb.q);
        return ut;
    };

    const soner: DyreSone[] = [
        { art: 'hund', x0: -176, x1: -60, z0: st.z1 - 3.0, z1: st.z1 - 0.6, y: 0, antall: 1 },
        { art: 'hund', x0: kv.x0 + 1.2, x1: kv.x1 - 0.6, z0: -100, z1: -20, y: 0, antall: 1 },
    ];
    return { plasser, figurer, vei, soner, baat };
}

/** Benk mot veggen (setet 0,45 m over bakken), langs z. */
function benk(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.7, bottom: 0.6, hue: WARM }, () => {
        k.box('raatre', x, 0.42, z, 0.38, 0.06, 1.6, { grain: 'z' });
        for (const s of [-0.65, 0.65]) k.box('raatre', x, 0.2, z + s, 0.3, 0.4, 0.1);
    });
    c.box(x, 0.22, z, 0.38, 0.44, 1.6, true);
}

/** En flettet kurv, full av noe (fisk, klær, kål). */
function kurv(k: MeshKit, c: ColliderKit, x: number, z: number, s: number): void {
    k.withTint({ top: 0.95 * s, bottom: 0.75 * s, hue: [1.12, 0.95, 0.7] }, () => k.log('raatre', V(x, 0, z), V(x, 0.42, z), 0.24, 10, true, 0.28));
    k.withTint({ top: 0.55, bottom: 0.55, hue: [1.1, 0.92, 0.7] }, () => k.log('raatre', V(x, 0.4, z), V(x, 0.44, z), 0.29, 10, false));
    k.withTint({ top: 1.1, bottom: 1.0, hue: [0.95, 0.95, 0.92] }, () => k.box('raatre', x, 0.45, z, 0.36, 0.08, 0.36));
    c.box(x, 0.22, z, 0.56, 0.44, 0.56, true);
}

/** Ei kasse med lokk. */
function kasse(k: MeshKit, c: ColliderKit, x: number, z: number, r: () => number): void {
    const w = 0.55 + r() * 0.2;
    const h = 0.4 + r() * 0.15;
    k.withTint({ top: 0.7, bottom: 0.55, hue: DARK }, () => k.box('raatre', x, h / 2, z, w, h, 0.5, { grain: 'x' }));
    k.withTint({ top: 0.45, bottom: 0.45 }, () => k.box('raatre', x, h / 2, z, w + 0.02, 0.05, 0.52));
    c.box(x, h / 2, z, w, h, 0.5, true);
}

/** Rensebenken: en planke på bukker med fisk, kniv og et kar under [S]. */
function rensebenk(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.85, bottom: 0.7, hue: WARM }, () => {
        k.box('raatre', x, 0.82, z, 0.55, 0.06, 1.7, { grain: 'z' });
        for (const s of [-0.7, 0.7]) k.box('raatre', x, 0.4, z + s, 0.45, 0.8, 0.08);
    });
    // Fisken: lyse, flate skrog, noen åpnet.
    k.withTint({ top: 1.5, bottom: 1.2, hue: [0.92, 0.97, 1.02] }, () => {
        for (let i = 0; i < 5; i++) k.box('raatre', x + 0.03 * (i % 2), 0.88, z - 0.55 + i * 0.26, 0.12, 0.05, 0.45, { grain: 'z' });
    });
    k.withTint({ top: 0.7, bottom: 0.6, hue: DARK }, () => k.log('raatre', V(x + 0.05, 0, z + 1.2), V(x + 0.05, 0.35, z + 1.2), 0.28, 10, true, 0.3));
    k.withTint({ top: 0.35, bottom: 0.35, hue: [1.2, 0.7, 0.6] }, () => k.log('mork', V(x + 0.05, 0.28, z + 1.2), V(x + 0.05, 0.3, z + 1.2), 0.26, 10, true));
    c.box(x, 0.45, z + 0.2, 0.6, 0.9, 2.3, true);
}

/** Et kar med vaskevann og et vaskebrett [S]. */
function kar(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.75, bottom: 0.7, hue: DARK }, () => k.log('raatre', V(x, 0, z), V(x, 0.42, z), 0.42, 12, true, 0.47));
    k.withTint({ top: 0.3, bottom: 0.3 }, () => k.log('raatre', V(x, 0.28, z), V(x, 0.33, z), 0.455, 12, false));
    k.withTint({ top: 0.3, bottom: 0.3, hue: [0.85, 0.92, 1] }, () => k.log('mork', V(x, 0.35, z), V(x, 0.38, z), 0.43, 12, true));
    // Et plagg på vei opp av vannet, og vaskebrettet på skrå.
    k.withTint({ top: 1.0, bottom: 0.9, hue: [0.96, 0.94, 0.88] }, () => {
        const m = new THREE.Matrix4().makeRotationX(-0.7).setPosition(x + 0.1, 0.45, z + 0.25);
        k.slab('raatre', m, 0.4, 0.02, 0.35);
    });
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
        const m = new THREE.Matrix4().makeRotationX(0.45).setPosition(x - 0.15, 0.48, z + 0.05);
        k.slab('raatre', m, 0.32, 0.6, 0.03);
    });
    c.box(x, 0.24, z, 0.95, 0.48, 0.95, true);
}

/** Garnhjell langs x: stolper og en stang med garn som henger [S]. */
function garnhjell(k: MeshKit, c: ColliderKit, x0: number, x1: number, z: number): void {
    k.withTint({ top: 0.6, bottom: 0.6 }, () => {
        for (const x of [x0, (x0 + x1) / 2, x1]) {
            k.log('raatre', V(x, 0, z), V(x, 1.9, z), 0.06, 5);
            c.box(x, 0.95, z, 0.15, 1.9, 0.15, true);
        }
        k.log('raatre', V(x0 - 0.2, 1.85, z), V(x1 + 0.2, 1.85, z), 0.04, 5);
    });
    k.withTint({ top: 0.75, bottom: 0.55, hue: [0.88, 0.92, 0.86] }, () => {
        for (let i = 0; i < 12; i++) {
            const a = x0 + 0.15 + i * ((x1 - x0 - 0.3) / 12);
            const len = 1.0 + Math.sin(i * 2.3) * 0.3;
            k.box('raatre', a + 0.17, 1.84 - len / 2, z, 0.16, len, 0.01);
        }
    });
    // Korkflottørene på overtelna, og steinsøkkene nederst.
    k.withTint({ top: 1.2, bottom: 1.0, hue: [1.15, 0.95, 0.7] }, () => {
        for (let x = x0 + 0.3; x < x1 - 0.1; x += 0.45) k.box('raatre', x, 1.78, z + 0.015, 0.07, 0.05, 0.04);
    });
}

/** To bukker som færingen ligger opp ned på. */
function bukker(k: MeshKit, c: ColliderKit, p: THREE.Vector3): void {
    k.withTint({ top: 0.65, bottom: 0.6, hue: WARM }, () => {
        for (const dx of [-1.5, 1.5]) {
            k.box('raatre', p.x + dx, 0.48, p.z, 0.1, 0.07, 1.25);
            for (const s of [-0.5, 0.5]) k.log('raatre', V(p.x + dx - 0.18, 0, p.z + s), V(p.x + dx, 0.48, p.z + s), 0.035, 4);
            for (const s of [-0.5, 0.5]) k.log('raatre', V(p.x + dx + 0.18, 0, p.z + s), V(p.x + dx, 0.48, p.z + s), 0.035, 4);
        }
    });
    c.box(p.x, 0.6, p.z, 5.9, 1.2, 1.5, true);
}

/** Tjærepotta: et lite kar på tre steiner, svart av tjære, med en kost [S]. */
function tjaerepott(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.7, bottom: 0.6 }, () => {
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            k.box('stein', x + Math.cos(a) * 0.17, 0.07, z + Math.sin(a) * 0.17, 0.14, 0.14, 0.14);
        }
    });
    k.withTint({ top: 0.12, bottom: 0.12, hue: [1, 0.9, 0.8] }, () => k.log('mork', V(x, 0.14, z), V(x, 0.42, z), 0.18, 9, true, 0.2));
    k.withTint({ top: 0.6, bottom: 0.6, hue: WARM }, () => k.log('raatre', V(x + 0.05, 0.38, z), V(x + 0.35, 0.85, z - 0.15), 0.018, 4));
    c.box(x, 0.25, z, 0.5, 0.5, 0.5, true);
}

/** Fiskehjell: et skråstativ med tørrfisk hengende i par over stengene [V tørrfisk på hjell; S formen]. */
function fiskehjell(k: MeshKit, c: ColliderKit, x0: number, x1: number, z: number): void {
    k.withTint({ top: 0.6, bottom: 0.55 }, () => {
        for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 3) {
            k.log('raatre', V(x, 0, z - 0.55), V(x, 2.1, z), 0.05, 5);
            k.log('raatre', V(x, 0, z + 0.55), V(x, 2.1, z), 0.05, 5);
        }
        for (const y of [1.25, 2.05]) k.log('raatre', V(x0 - 0.2, y, z), V(x1 + 0.2, y, z), 0.035, 5);
    });
    k.withUv(0.04, () => {
        k.withTint({ top: 1.4, bottom: 1.0, hue: [1.04, 0.96, 0.82] }, () => {
            for (const y of [1.25, 2.05]) {
                for (let x = x0 + 0.2; x < x1 - 0.1; x += 0.24) {
                    const len = 0.55 + Math.sin(x * 7.1) * 0.1;
                    for (const s of [-1, 1]) {
                        const m = new THREE.Matrix4().makeRotationX(s * 0.12).setPosition(x, y - len / 2, z + s * 0.06);
                        k.slab('raatre', m, 0.11, len, 0.03);
                    }
                }
            }
        });
    });
    c.box((x0 + x1) / 2, 1.05, z, x1 - x0 + 0.4, 2.1, 1.2, true);
}

/** Ei grind i gjerdet: to tykkere stolper og et lukket grindblad. Gjerdets kollider står uendret. */
function grind(k: MeshKit, x: number, z: number): void {
    k.withTint({ top: 0.75, bottom: 0.55, hue: [1, 0.95, 0.88] }, () => {
        for (const s of [-0.55, 0.55]) k.log('raatre', V(x + s, -0.05, z), V(x + s, 1.45, z), 0.075, 6, true);
        for (const y of [0.3, 0.75, 1.15]) k.box('raatre', x, y, z + 0.06, 1.0, 0.07, 0.04);
        k.box('raatre', x, 0.72, z + 0.06, 0.06, 0.95, 0.04);
    });
}
