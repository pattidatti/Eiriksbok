// Holmen: kongsgården og bispesetet ytterst i nordenden av Bryggen, som kulisse over Vågen.
//
// Det vi vet [V]:
// - Håkonshallen: steinhall reist av Håkon Håkonsson, trolig 1247-1261, i bruk til bryllupet og
//   kroningen i 1261 [V Byleksikon, SNL]. Gråstein i kistemur med hjørnekvadrer og detaljer av
//   kleberstein, tre høyder (lager nederst, bolig i midten, gildehallen øverst), vinduer med
//   spissbue [V Byleksikon]. Grunnflaten er ca. 37 x 16,4 m [V Wikipedia]. Trappegavlene i dag er
//   satt tilbake etter Scholeus-stikket fra ca. 1580 [V Wikipedia]; om gavlene var slik i
//   1420-årene, vet vi ikke [U]. Vitaliebrødrene brant hallen i 1429, og den ble satt i stand
//   igjen [V Wikipedia].
// - Kastellet (Magnus Lagabøtes tårn): reist i 1270-årene som «ringmurstårn med vollgrav og
//   vindebro», med et kapell med krysshvelv og gotiske vindusåpninger [V Byleksikon]. Omtrent
//   kvadratisk, tre etasjer og kjeller [V Lokalhistoriewiki]. Det er den ytre halvdelen av
//   Rosenkrantztårnet i dag, den som vender mot Vågen [V]. Høyden og taket er ikke funnet [K]:
//   her er det 19 m til gesimsen med et pyramidetak av bord [S].
// - Ringmuren: Håkon Håkonsson lot bygge en ringmur rundt Holmen etter brannen i 1248 [V
//   Byleksikon]. Hvor den gikk og hvordan murkronen så ut, er ikke funnet [K]; tinnene er [S].
// - Kristkirken (Store Kristkirke): domkirken, Olav Kyrres steinkirke, «treskipet, 40 m lang og
//   ca. 20 m bred», nordvest for Håkonshallen, revet 1531 [V Byleksikon]. Ingen bilder finnes, så
//   tårnet, koret og takene er [S] (bygd som Mariakirken, en basilika fra samme tid).
// - Apostelkirken: kongens kapell, gotisk, ferdig tidlig på 1300-tallet, revet 1529 [V UiB
//   Landslovjubileet]. Utseendet er [U]; her er den smal og høy med bratt tak og takrytter [S].
// - Kongsgården og bispegården brant under vitaliebrødrenes overfall i 1429 [V Byleksikon]. Hvilke
//   trehus som sto der, er ikke funnet [K]: husene her er laftehus trukket for spillet [S].
//   Bispegården lå «i nærheten av et naust» [V Byleksikon], så den står ute ved sjøen.
//
// Avstander og vinkler er komprimert for spillet [S]: i virkeligheten er det et par hundre meter
// fra Mariakirken til tårnet. Holmen stikker ut i Vågen forbi bryggefronten (Vågen er −z), og
// husene vender omtrent slik de gjør i dag.
//
// Hele Holmen er statisk og to nivåer i en `THREE.LOD`, ikke en celle: den skal synes fra hele
// Vågen, også der cellene ikke ville vært lastet, og den koster lite. Nær (innen HOLMEN_LOD m):
// steinbyggene i to tegnekall (stein og bordtak, med tynnere tåke) og trehusene og bakken i ett
// (flat farge, vanlig tåke). Langt unna: steinbyggene i flat farge i ett tegnekall. Trehusene er
// borte i den vanlige tåka der uansett. Ingen kollidere: grensa stopper spilleren ved kaienden.
import * as THREE from 'three';
import { MeshKit, type MatKey, type Tint } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import { LIST, STEIN, TAK, paFlate } from './mariakirken';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Bak denne avstanden (fra kaienden) tegnes steinbyggene i flat farge. */
const HOLMEN_LOD = 100;
/** Bakken på Holmen over kaidekket, og strandlinja: Holmen stikker så langt ut i Vågen [S]. */
const BAKKE = 0.6;
const STRAND_Z = -20;

/** Mørke åpninger i muren: steinteksturen nesten svart (ingen egen bøtte). */
const HULL: Tint = { top: 0.05, bottom: 0.05 };
const KVADER: Tint = { top: 1.12, bottom: 1.05, hue: [0.95, 1.0, 0.97] };

/**
 * Penselen: samme byggekode tegner begge nivåene. Nær bruker stein og bordtak med tekstur, langt
 * unna går alt i én bøtte i flat farge (`mork` med farge per hjørne).
 */
interface Pensel {
    k: MeshKit;
    fjern: boolean;
    stein: THREE.Color;
    tak: THREE.Color;
}

function farget(t: Tint, c: THREE.Color): Tint {
    const h = t.hue ?? [1, 1, 1];
    return { top: t.top, bottom: t.bottom, hue: [c.r * h[0], c.g * h[1], c.b * h[2]] };
}

function stein(p: Pensel, t: Tint, fn: (key: MatKey) => void): void {
    p.k.withTint(p.fjern ? farget(t, p.stein) : t, () => fn(p.fjern ? 'mork' : 'stein'));
}

function tre(p: Pensel, t: Tint, fn: (key: MatKey) => void): void {
    p.k.withTint(p.fjern ? farget(t, p.tak) : t, () => fn(p.fjern ? 'mork' : 'bordtak'));
}

/** Kropp av stein: en boks som står på `y0` og er `h` høy. */
function kropp(p: Pensel, cx: number, cz: number, sx: number, sz: number, y0: number, h: number, skip: ('pz' | 'nz')[] = []): void {
    stein(p, STEIN, (key) => p.k.box(key, cx, y0 + h / 2, cz, sx, h, sz, { skip: ['bottom', ...skip], shadeFoot: true }));
}

/** List rundt toppen av en boks (bare nær). */
function list(p: Pensel, cx: number, cz: number, sx: number, sz: number, y: number, ut = 0.18): void {
    if (p.fjern) return;
    p.k.withTint(LIST, () => p.k.box('stein', cx, y, cz, sx + ut * 2, 0.3, sz + ut * 2));
}

/** Vindu eller glugg i veggflaten (z = 0, +z ut). Bare nær: i tåka synes de ikke. */
function glugg(p: Pensel, u: number, y0: number, w: number, h: number, form: 'spiss' | 'rund' | 'flat' = 'rund'): void {
    if (p.fjern) return;
    const k = p.k;
    const r = w / 2;
    const z = 0.04;
    // `quad` og `tri` leser ikke `tint.top`: mørket går inn som skygge per hjørne.
    const d = HULL.top;
    const dd: [number, number, number] = [d, d, d];
    k.withTint(HULL, () => {
        k.quad('stein', V(u - r, y0, z), V(w, 0, 0), V(0, h, 0), [0, 0], [d, d]);
        if (form === 'spiss') k.tri('stein', V(u - r, y0 + h, z), V(u + r, y0 + h, z), V(u, y0 + h + w * 0.85, z), [0, 0], [w, 0], [r, w], dd);
        if (form === 'rund') {
            for (let i = 0; i < 5; i++) {
                const a0 = (i / 5) * Math.PI;
                const a1 = ((i + 1) / 5) * Math.PI;
                k.tri('stein', V(u, y0 + h, z), V(u + Math.cos(a0) * r, y0 + h + Math.sin(a0) * r, z), V(u + Math.cos(a1) * r, y0 + h + Math.sin(a1) * r, z), [0, 0], [0, 0], [0, 0], dd);
            }
        }
    });
    // Kleberstein rundt åpningen: en lys list under og en over.
    k.withTint(KVADER, () => {
        k.box('stein', u, y0 - 0.08, z + 0.06, w + 0.3, 0.16, 0.14);
        if (form === 'flat') k.box('stein', u, y0 + h + 0.1, z + 0.06, w + 0.3, 0.2, 0.14);
    });
}

/** Saltak langs z med mønet over x = 0. `over` er hvor langt taket går ut over gavlene. */
function saltak(p: Pensel, hw: number, eave: number, pitch: number, z0: number, z1: number, over: number, gavl: boolean, t: Tint = TAK): void {
    const raft = 0.45;
    const a = Math.atan(pitch);
    const rise = hw * pitch;
    const len = (hw + raft) / Math.cos(a);
    const th = 0.18;
    tre(p, t, (key) => {
        for (const side of [-1, 1]) {
            const m = new THREE.Matrix4()
                .makeRotationZ(-side * a)
                .setPosition((side * (hw + raft)) / 2, (eave + rise + eave - raft * pitch) / 2 + th / 2, (z0 + z1) / 2);
            p.k.slab(key, m, len, th, z1 - z0 + over * 2, { grain: 'x' });
        }
    });
    if (!gavl) return;
    stein(p, STEIN, (key) => {
        // Rekkefølgen gir normalen ut fra bygget: −z ved z0, +z ved z1.
        p.k.tri(key, V(hw, eave, z0), V(-hw, eave, z0), V(0, eave + rise, z0), [hw, eave], [-hw, eave], [0, eave + rise]);
        p.k.tri(key, V(-hw, eave, z1), V(hw, eave, z1), V(0, eave + rise, z1), [-hw, eave], [hw, eave], [0, eave + rise]);
    });
}

/** Pulttak over et sideskip, fra ytterveggen (`xo`) opp til midtskipets vegg (`xi`). */
function pulttak(p: Pensel, xo: number, xi: number, yo: number, yi: number, z0: number, z1: number): void {
    const over = 0.4;
    const dir = Math.sign(xo - xi);
    const dx = Math.abs(xo - xi);
    const a = Math.atan((yi - yo) / dx);
    const m = new THREE.Matrix4().makeRotationZ(-dir * a).setPosition((xo + xi) / 2 + (dir * over) / 2, (yo + yi) / 2 + 0.09, (z0 + z1) / 2);
    tre(p, TAK, (key) => p.k.slab(key, m, dx / Math.cos(a) + over, 0.18, z1 - z0, { grain: 'x' }));
    stein(p, STEIN, (key) => {
        for (const [z, flip] of [[z0, dir > 0], [z1, dir < 0]] as const) {
            const A = V(xi, yo, z), B = V(xo, yo, z), C = V(xi, yi, z);
            if (flip) p.k.tri(key, A, C, B, [xi, yo], [xi, yi], [xo, yo]);
            else p.k.tri(key, A, B, C, [xi, yo], [xo, yo], [xi, yi]);
        }
    });
}

/** Pyramidetak (eller spir) fra takfoten `y` opp `h`. */
function pyramide(p: Pensel, cx: number, cz: number, half: number, y: number, h: number): void {
    const top = V(cx, y + h, cz);
    const c = [V(cx - half, y, cz - half), V(cx + half, y, cz - half), V(cx + half, y, cz + half), V(cx - half, y, cz + half)];
    const slant = Math.hypot(half, h);
    tre(p, TAK, (key) => {
        for (let i = 0; i < 4; i++) p.k.tri(key, c[(i + 1) % 4], c[i], top, [half * 2, 0], [0, 0], [half, slant]);
    });
}

/** Murkrone med tinner langs x fra `x0` til `x1` på toppen `y` (bare nær). */
function tinner(p: Pensel, x0: number, x1: number, y: number, tykk: number): void {
    if (p.fjern) return;
    p.k.withTint(STEIN, () => {
        for (let x = x0 + 0.5; x < x1 - 0.4; x += 1.7) p.k.box('stein', x + 0.45, y + 0.5, 0, 0.9, 1.0, tykk);
    });
}

/** En rett mur fra (x0, z0) til (x1, z1), `h` høy over bakken, med tinner. */
function mur(p: Pensel, x0: number, z0: number, x1: number, z1: number, h: number, tykk = 1.6): void {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    p.k.at(x0, BAKKE, z0, Math.atan2(-dz, dx), () => {
        stein(p, STEIN, (key) => p.k.box(key, len / 2, (h - 3) / 2, 0, len, h + 3, tykk, { skip: ['bottom'], shadeFoot: true }));
        tinner(p, 0, len, h, tykk);
    });
}

// ── Kastellet ved sjøen ──
const KASTELL = { x: 12, z: -27, b: 13, h: 19, tak: 8, fot: -2.2 };

function kastell(p: Pensel): void {
    const { b, h, fot } = KASTELL;
    p.k.at(KASTELL.x, 0, KASTELL.z, 0, () => {
        kropp(p, 0, 0, b, b, fot, h - fot);
        // Hjørnekvadrene og etasjelistene: tre etasjer over kjelleren [V].
        for (const y of [6.5, 12.5]) list(p, 0, 0, b, b, y, 0.1);
        list(p, 0, 0, b, b, h, 0.3);
        for (const f of ['nz', 'pz', 'nx', 'px'] as const) {
            paFlate(p.k, f, 0, 0, b / 2, b / 2, () => {
                for (const u of [-2.6, 2.6]) glugg(p, u, 8.0, 1.1, 2.4, 'spiss'); // kapellet [V]
                for (const u of [-3.5, 0, 3.5]) glugg(p, u, 14.2, 0.7, 1.2, 'rund');
                glugg(p, 0, 2.6, 0.35, 1.3, 'flat');
            });
        }
        pyramide(p, 0, 0, b / 2 + 0.4, h + 0.15, KASTELL.tak);
    });
}

// ── Håkonshallen ──
// Hallens eget rom: x på tvers (±8,2), z på langs (±18,5), +x mot Vågen.
const HALL = { x: 48, z: 16, rot: Math.PI / 2 + 0.3, hw: 8.2, hl: 18.5, eave: 14, pitch: 1.0 };

/** Trappegavl: muren går opp over takflatene i trinn [V i dag, U i 1420-årene]. */
function trappegavl(p: Pensel, z: number, dir: 1 | -1): void {
    const { hw, eave, pitch } = HALL;
    const n = 5;
    const sh = (hw * pitch) / n;
    const ut = 0.7;
    const zc = z - dir * 0.42;
    stein(p, STEIN, (key) => {
        for (let i = 0; i < n; i++) {
            const y0 = i === 0 ? eave : eave + i * sh + ut;
            const y1 = eave + (i + 1) * sh + ut;
            const w = 2 * (hw - (i * sh) / pitch) + 0.3;
            p.k.box(key, 0, (y0 + y1) / 2, zc, w, y1 - y0, 0.95, { skip: ['bottom'] });
        }
    });
}

function hallen(p: Pensel): void {
    const { hw, hl, eave, pitch } = HALL;
    p.k.at(HALL.x, BAKKE, HALL.z, HALL.rot, () => {
        kropp(p, 0, 0, hw * 2, hl * 2, -0.6, eave + 0.6);
        // Hjørnekvadrer av kleberstein [V]: lyse pilastre på hjørnene.
        if (!p.fjern) {
            p.k.withTint(KVADER, () => {
                for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.k.box('stein', sx * (hw - 0.2), eave / 2, sz * (hl - 0.2), 0.6, eave, 0.6, { skip: ['bottom'] });
            });
        }
        // Tre høyder [V]: lister mellom dem.
        for (const y of [4.6, 8.8]) list(p, 0, 0, hw * 2, hl * 2, y, 0.08);
        list(p, 0, 0, hw * 2, hl * 2, eave - 0.1, 0.2);
        // Langsidene: spissbuevinduer i gildehallen [V], små vinduer i boligetasjen, glugger i kjelleren.
        for (const f of ['px', 'nx'] as const) {
            paFlate(p.k, f, 0, 0, hw, hl, () => {
                for (let i = -3; i <= 3; i++) {
                    glugg(p, i * 4.8, 9.9, 1.2, 2.5, 'spiss');
                    glugg(p, i * 4.8, 5.6, 0.8, 1.2, 'flat');
                    if (i % 2 === 0) glugg(p, i * 4.8, 1.4, 0.35, 0.9, 'flat');
                }
            });
        }
        // Gavlene: ett stort spissbuevindu med to mindre ved siden av, og trappegavl over.
        for (const f of ['pz', 'nz'] as const) {
            paFlate(p.k, f, 0, 0, hw, hl, () => {
                glugg(p, 0, 9.6, 2.2, 3.4, 'spiss');
                for (const u of [-3.6, 3.6]) glugg(p, u, 9.9, 1.0, 2.2, 'spiss');
                glugg(p, 0, 5.6, 0.8, 1.2, 'flat');
            });
        }
        saltak(p, hw + 0.05, eave, pitch, -hl + 0.85, hl - 0.85, 0, false);
        trappegavl(p, hl, 1);
        trappegavl(p, -hl, -1);
    });
}

// ── Kristkirken ──
// Kirkens rom som Mariakirken: x på tvers, z fra vestfronten mot koret i øst.
const KRIST = { x: 92, z: 40, rot: -Math.PI / 4 };
const KT = { hw: 4.5, z1: 9, h: 25, spir: 13 };
const KS = { z0: 9, z1: 31, hw: 5, h: 15, sidehw: 10, sideh: 8, sidetop: 10.8, pitch: 0.95 };
const KK = { z1: 40, hw: 5, h: 12, pitch: 0.95 };

function kristkirken(p: Pensel): void {
    const ox = KRIST.x - Math.sin(KRIST.rot) * 20;
    const oz = KRIST.z - Math.cos(KRIST.rot) * 20;
    p.k.at(ox, BAKKE, oz, KRIST.rot, () => {
        // Vesttårnet [S].
        const tz = KT.z1 / 2;
        kropp(p, 0, tz, KT.hw * 2, KT.z1, -0.5, KT.h + 0.5);
        for (const y of [KS.h, 20]) list(p, 0, tz, KT.hw * 2, KT.z1, y, 0.1);
        list(p, 0, tz, KT.hw * 2, KT.z1, KT.h, 0.25);
        for (const f of ['nz', 'nx', 'px'] as const) {
            paFlate(p.k, f, 0, tz, KT.hw, tz, () => {
                for (const u of [-1.5, 1.5]) glugg(p, u, 21.2, 0.9, 2.2);
                glugg(p, 0, 11, 0.5, 1.4);
            });
        }
        paFlate(p.k, 'nz', 0, tz, KT.hw, tz, () => {
            if (!p.fjern) p.k.withTint(LIST, () => p.k.box('stein', 0, 2.2, 0.18, 3.4, 4.4, 0.36, { skip: ['bottom'] }));
            p.k.at(0, 0, 0.36, 0, () => glugg(p, 0, 0, 1.8, 2.6));
        });
        pyramide(p, 0, tz, KT.hw + 0.3, KT.h + 0.15, KT.spir);

        // Treskipet [V]: høyt midtskip med vinduer øverst, lave sideskip under pulttak.
        const sz = KS.z1 - KS.z0;
        const szc = (KS.z0 + KS.z1) / 2;
        kropp(p, 0, szc, KS.hw * 2, sz, -0.5, KS.h + 0.5);
        list(p, 0, szc, KS.hw * 2, sz, KS.h - 0.1);
        saltak(p, KS.hw + 0.2, KS.h, KS.pitch, KS.z0, KS.z1, 0, true);
        const aw = KS.sidehw - KS.hw;
        for (const side of [-1, 1] as const) {
            const ax = side * (KS.hw + aw / 2);
            stein(p, STEIN, (key) => p.k.box(key, ax, KS.sideh / 2 - 0.25, szc, aw, KS.sideh + 0.5, sz, { skip: ['bottom'], shadeFoot: true }));
            pulttak(p, side * (KS.sidehw + 0.15), side * KS.hw, KS.sideh, KS.sidetop, KS.z0, KS.z1);
            const f = side < 0 ? 'nx' : 'px';
            paFlate(p.k, f, 0, szc, KS.hw, sz / 2, () => {
                for (let i = 0; i < 4; i++) glugg(p, -sz / 2 + 3 + i * 5.3, KS.sidetop + 1, 0.8, 1.5);
            });
            paFlate(p.k, f, ax, szc, aw / 2, sz / 2, () => {
                for (let i = 0; i < 4; i++) glugg(p, -sz / 2 + 3 + i * 5.3, 3.6, 0.8, 1.6);
            });
        }

        // Koret mot øst [S].
        const kz = KK.z1 - KS.z1;
        const kzc = (KS.z1 + KK.z1) / 2;
        kropp(p, 0, kzc, KK.hw * 2, kz, -0.5, KK.h + 0.5, ['nz']);
        list(p, 0, kzc, KK.hw * 2, kz, KK.h - 0.1);
        saltak(p, KK.hw + 0.2, KK.h, KK.pitch, KS.z1, KK.z1, 0.3, true);
        for (const f of ['nx', 'px', 'pz'] as const) {
            paFlate(p.k, f, 0, kzc, KK.hw, kz / 2, () => {
                for (const u of f === 'pz' ? [-2, 0, 2] : [-2.6, 2.6]) glugg(p, u, 4.5, 0.9, 3.2, 'spiss');
            });
        }
    });
}

// ── Apostelkirken ──
const APOSTEL = { x: 62, z: 68, rot: -Math.PI / 4, hw: 4.5, l: 24, eave: 11, pitch: 1.5 };

function apostelkirken(p: Pensel): void {
    const { hw, l, eave, pitch } = APOSTEL;
    p.k.at(APOSTEL.x, BAKKE, APOSTEL.z, APOSTEL.rot, () => {
        kropp(p, 0, 0, hw * 2, l, -0.5, eave + 0.5);
        list(p, 0, 0, hw * 2, l, eave - 0.1, 0.15);
        saltak(p, hw + 0.1, eave, pitch, -l / 2, l / 2, 0.3, true);
        // Strebepilarer og høye, spisse vinduer: gotikk [V]; antall og mål [S].
        for (const f of ['nx', 'px'] as const) {
            paFlate(p.k, f, 0, 0, hw, l / 2, () => {
                for (let i = -2; i <= 2; i++) glugg(p, i * 4.6, 3.2, 1.1, 5.0, 'spiss');
            });
            if (p.fjern) continue;
            const s = f === 'nx' ? -1 : 1;
            p.k.withTint(STEIN, () => {
                for (let i = -2; i <= 3; i++) p.k.box('stein', s * (hw + 0.4), 3.8, i * 4.6 - 2.3, 0.8, 7.6, 0.8, { skip: ['bottom'], shadeFoot: true });
            });
        }
        paFlate(p.k, 'pz', 0, 0, hw, l / 2, () => glugg(p, 0, 3.4, 2.2, 5.6, 'spiss'));
        // Takrytteren med et lite spir [S].
        const ry = eave + hw * pitch - 0.6;
        stein(p, LIST, (key) => p.k.box(key, 0, ry + 1.2, 2, 1.4, 2.4, 1.4, { skip: ['bottom'] }));
        pyramide(p, 0, 2, 0.95, ry + 2.4, 4.2);
    });
}

// ── Trehus, bakke og naust (flat farge, vanlig tåke) ──
interface Farger {
    laft: THREE.Color;
    torv: THREE.Color;
    bord: THREE.Color;
    jord: THREE.Color;
}

function flat(k: MeshKit, c: THREE.Color, s: number, fn: () => void): void {
    k.withTint({ top: s, bottom: s * 0.75, hue: [c.r, c.g, c.b] }, fn);
}

/** Et laftehus med saltak, gavlen mot −z i husets rom. `torv` avgjør taket. */
function trehus(k: MeshKit, f: Farger, x: number, z: number, rot: number, b: number, l: number, eave: number, pitch: number, torv: boolean, tone: number): void {
    k.at(x, BAKKE, z, rot, () => {
        flat(k, f.laft, tone, () => k.box('mork', 0, eave / 2 - 0.3, l / 2, b, eave + 0.6, l, { skip: ['bottom'], shadeFoot: true }));
        const hw = b / 2;
        const rise = hw * pitch;
        flat(k, f.laft, tone, () => {
            k.tri('mork', V(hw, eave, 0), V(-hw, eave, 0), V(0, eave + rise, 0), [0, 0], [0, 0], [0, 0], [tone, tone, tone]);
            k.tri('mork', V(-hw, eave, l), V(hw, eave, l), V(0, eave + rise, l), [0, 0], [0, 0], [0, 0], [tone, tone, tone]);
        });
        const a = Math.atan(pitch);
        const raft = 0.4;
        flat(k, torv ? f.torv : f.bord, torv ? 1 : 1.25, () => {
            for (const side of [-1, 1]) {
                const m = new THREE.Matrix4().makeRotationZ(-side * a).setPosition((side * (hw + raft)) / 2, (eave + rise + eave - raft * pitch) / 2 + 0.15, l / 2);
                k.slab('mork', m, (hw + raft) / Math.cos(a), torv ? 0.3 : 0.12, l + 0.6);
            }
        });
    });
}

/** Kongsgården og bispegården: husene trukket for spillet [S]. x, z, vinkel, bredde, lengde, takfot, torv. */
const HUS: [number, number, number, number, number, number, boolean][] = [
    [22, 6, 0.2, 7, 12, 5.5, true],
    [20, 30, -0.1, 8, 14, 6.5, false],
    [38, 44, 0.3, 7, 10, 4.5, true],
    [56, 40, 0.15, 9, 12, 6, false],
    [78, 4, -0.25, 8, 13, 5, true],
    [88, 20, 0.2, 6, 9, 4, true],
    [30, 62, 0, 10, 16, 5, true],
    // Bispegården ved naustet, utenfor ringmuren [S].
    [124, -6, 0.1, 8, 12, 6, false],
    [138, 2, -0.1, 7, 10, 4.5, true],
    [150, -10, 0.25, 6, 9, 4.5, true],
];

function bakkeOgHus(k: MeshKit, f: Farger): void {
    // Bakken: jord og tråkk innenfor muren (kanten mot sjøen er stein, i `kaikant`).
    flat(k, f.jord, 0.8, () => k.quad('mork', V(0.5, BAKKE, 110), V(174, 0, 0), V(0, 0, STRAND_Z - 110), [0, 0], [0.8, 0.8]));
    // Vollgrava på landsida av tårnet [V], som en mørk stripe med vann.
    flat(k, new THREE.Color(0x1d2628), 1, () => k.quad('mork', V(KASTELL.x - 9.5, BAKKE + 0.02, STRAND_Z + 4.5), V(18, 0, 0), V(0, 0, -3.6)));
    for (const [x, z, rot, b, l, eave, torv] of HUS) {
        const tone = 0.85 + (((x * 7 + z * 13) % 10) / 10) * 0.35;
        trehus(k, f, x, z, rot, b, l, eave, torv ? 0.6 : 0.9, torv, tone);
    }
    // Naustet ved bispegården: lavt, bredt, med gavlen ut mot sjøen [V at det sto et naust der].
    trehus(k, f, 132, STRAND_Z + 0.4, 0, 7, 11, 2.4, 0.9, false, 0.8);
}

/** Kanten av Holmen mot sjøen og berget kastellet står på: stein, så den tåler å ses fra kaienden. */
function kaikant(p: Pensel): void {
    stein(p, { top: 0.8, bottom: 0.5, hue: [0.95, 0.97, 0.95] }, (key) => {
        p.k.box(key, 87, (BAKKE - 4) / 2, 45, 174, BAKKE + 4, 130, { skip: ['bottom', 'top', 'pz'], shadeFoot: true });
        p.k.box(key, KASTELL.x, -2, KASTELL.z + 0.5, KASTELL.b + 4, 4.6, KASTELL.b + 3, { skip: ['bottom'], shadeFoot: true });
    });
}

function murene(p: Pensel): void {
    const h = 7;
    // Langs sjøen fra tårnet og vestover mot Kristkirken, og opp mot Mariakirken på Bryggen-sida.
    mur(p, KASTELL.x + KASTELL.b / 2 - 0.2, STRAND_Z - 0.6, 112, STRAND_Z - 0.6, h);
    mur(p, 112, STRAND_Z - 0.6, 112, 70, h);
    mur(p, 2, STRAND_Z - 0.6, KASTELL.x - KASTELL.b / 2 + 0.2, STRAND_Z - 0.6, h);
    mur(p, 2, STRAND_Z - 1.4, 2, 12, h);
    mur(p, 2, 20, 2, 70, h);
    // Porten mot byen: et lavt porttårn over åpningen, med saltak [S].
    p.k.at(2, BAKKE, 16, 0, () => {
        kropp(p, 0, 0, 3.6, 9, -0.3, 9);
        saltak(p, 1.8, 8.7, 1.0, -4.5, 4.5, 0.25, true);
        paFlate(p.k, 'nx', 0, 0, 1.8, 4.5, () => glugg(p, 0, 0, 2.4, 3.0));
    });
}

/**
 * Holmen som kulisse. `x0` er der bryggefronten slutter (kaienden i +x); alt bygges i et rom med
 * origo der, og LOD-avstanden måles derfra.
 */
export function lagHolmen(mats: Materials, x0: number): THREE.LOD {
    const naer = new MeshKit();
    const langt = new MeshKit();
    const flate = new MeshKit();
    const steinC = mats.lodColor('stein');
    const takC = mats.lodColor('bordtak').multiplyScalar(TAK.top * 1.3);
    for (const p of [{ k: naer, fjern: false }, { k: langt, fjern: true }]) {
        const pensel: Pensel = { ...p, stein: steinC, tak: takC };
        kastell(pensel);
        kaikant(pensel);
        murene(pensel);
        hallen(pensel);
        kristkirken(pensel);
        apostelkirken(pensel);
    }
    bakkeOgHus(flate, { laft: mats.lodColor('laft'), torv: mats.lodColor('torv'), bord: mats.lodColor('bordtak'), jord: mats.lodColor('gjorme') });

    const mesh = (g: THREE.BufferGeometry, m: THREE.Material, navn: string) => {
        const o = new THREE.Mesh(g, m);
        o.name = navn;
        o.castShadow = false;
        o.receiveShadow = false;
        return o;
    };
    const nivaaNaer = new THREE.Group();
    nivaaNaer.name = 'holmen:naer';
    for (const [key, b] of naer.buckets) nivaaNaer.add(mesh(b.toGeometry(), mats.tynnTake(key), `holmen:${key}`));
    nivaaNaer.add(mesh(flate.bucket('mork').toGeometry(), mats.lodMaterial(), 'holmen:trehus'));
    const nivaaLangt = mesh(langt.bucket('mork').toGeometry(), mats.tynnTake('lod'), 'holmen:lod');

    const lod = new THREE.LOD();
    lod.name = 'holmen';
    lod.position.set(x0, 0, 0);
    lod.addLevel(nivaaNaer, 0);
    lod.addLevel(nivaaLangt, HOLMEN_LOD);
    return lod;
}
