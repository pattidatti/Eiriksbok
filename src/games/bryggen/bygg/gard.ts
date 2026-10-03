// Én gård på Bryggen, bygget av modulsettet: en dobbeltgård med to husrekker og et gårdsrom
// imellom, svalganger i andre etasje, trapper, kai med bolverk og vinsjer i gavlene mot sjøen.
//
// Blueprint §5.2: smale, lange parseller med forretning mot bryggen og lager, bolig og verksted
// innover; enkelt- og dobbeltgårder med svalganger over gårdsrommet; laftehus med torvtak;
// 2-3 etasjers lagerhus; bygget på bolverk av kryss-stablet tømmer.
//
// Målene er valgt for spillet [S]: husene er 7 m brede og gårdsrommet 4 m. Hvilken gård som sto
// akkurat her ved Nikolaikirkeallmenningen i 1420-årene er ikke slått fast [K], så gården har
// ikke navn ennå.
import * as THREE from 'three';
import { ColliderKit, MeshKit, slaSammen, type MatKey } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellContent } from '../motor/streaming';
import { WATER_Y } from '../motor/boat';
import { eaveY, hus, husLod, riseOf, rng, trekkGlugger, type HouseSpec } from './moduler';
import { schotstue } from './schotstue';
import { bu } from './bu';
import { romIHus } from './inne';
import { bakPortaler, Portaler } from '../motor/portal';
import type { Rom } from '../motor/streaming';
import { Ild } from '../motor/ild';
import { lagFolk, type Plass } from './folk';
import type { Rute } from './vandrer';

export const HOUSE_W = 7;
export const YARD_W = 4;
export const GARD_W = HOUSE_W * 2 + YARD_W; // 18 m
/** Gavlene står så langt inn fra bolverket. Kaia ligger foran. */
export const FRONT_Z = 5;
export const GARD_DEPTH = 56;
export const DECK_Y = 2.6; // svalgangen: oppå første etasje
export const SV_W = 1.05;

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface Placed {
    spec: HouseSpec;
    x: number;
    z: number;
    /** Rotasjon om y. 0 = gavlen mot sjøen. */
    rot?: number;
}

// Tonene: tjæret, værbitt tre. Hvert hus litt ulikt, så rekka ikke blir én flate.
export const T = (top: number, hue: [number, number, number]) => ({ top, bottom: top, hue });
export const WARM: [number, number, number] = [1.06, 0.98, 0.9];
export const COLD: [number, number, number] = [0.92, 0.95, 1.0];
export const DARK: [number, number, number] = [0.9, 0.86, 0.82];

/**
 * Husene i gården. Vest-rekka har gårdsrommet på +x-siden, øst-rekka på -x-siden.
 * Forhusene mot sjøen har tre etasjer, bordkledd gavl og vinsj. Innover blir husene lavere,
 * og bakerst, på tvers av gårdsrommet, ligger schøtstua: samlingsrommet der hele gården spiste
 * og varmet seg om vinteren. Bare der og i ildhuset var det lov med ild [V].
 */
function plan(): { houses: Placed[]; backZ: number; west: { z0: number; z1: number }; east: { z0: number; z1: number } } {
    const xw = -(YARD_W / 2 + HOUSE_W / 2);
    const xe = YARD_W / 2 + HOUSE_W / 2;
    const houses: Placed[] = [];
    const row = (x: number, yardSide: -1 | 1, list: (Omit<HouseSpec, 'w' | 'cornersFront' | 'cornersBack'> & { gap: number })[]) => {
        let z = FRONT_Z;
        list.forEach((h, i) => {
            const prevGap = i === 0 ? 1 : list[i - 1].gap;
            const spec: HouseSpec = {
                ...h,
                w: HOUSE_W,
                cornersFront: i === 0 ? !h.facade : prevGap > 0.3,
                cornersBack: h.gap > 0.3 || i === list.length - 1,
                doors: (h.doors ?? []).map((d) => ({ ...d, side: yardSide })),
                upperDoors: (h.upperDoors ?? []).map((d) => ({ ...d, side: yardSide })),
            };
            spec.glugger = trekkGlugger(spec, yardSide, i === 0, rng(i * 17 + (x > 0 ? 3 : 0)));
            houses.push({ spec, x, z });
            z += h.l + h.gap;
        });
        return z;
    };
    const one = 1 as const;
    const wEnd = row(xw, 1, [
        // Bua og lagerloftet kan gås inn i: fra kaia gjennom bu-døra, fra gårdsrommet, og fra
        // svalgangen inn i loftet. Trappa står langs veggen mot nabogården (bu.ts).
        { l: 9.5, floors: [2.6, 2.4, 2.3], roof: 'torv', pitch: 0.9, tint: T(1.0, WARM), facade: true, vinsj: true, krag: 0.38, gap: 0.9,
            doors: [{ side: one, z: 2.2 }, { side: one, z: 6.8, open: true }], upperDoors: [{ side: one, z: 4.5, open: true }],
            inne: { etasjer: 2, trapp: { side: -1, z0: 3.0, z1: 6.2 } } },
        { l: 8, floors: [2.6, 2.5], roof: 'bordtak', pitch: 0.8, tint: T(0.92, COLD), gap: 0,
            doors: [{ side: one, z: 3 }], upperDoors: [{ side: one, z: 5.5 }] },
        { l: 9, floors: [2.6, 2.4, 2.2], roof: 'torv', pitch: 0.9, tint: T(0.96, DARK), gap: 0.9,
            doors: [{ side: one, z: 2.5 }, { side: one, z: 6.5 }], upperDoors: [{ side: one, z: 4 }] },
        { l: 7.5, floors: [2.6, 2.4], roof: 'torv', pitch: 0.85, tint: T(1.02, WARM), gap: 0.9,
            doors: [{ side: one, z: 3.5 }] },
        { l: 6, floors: [3.0], roof: 'bordtak', pitch: 0.75, tint: T(0.88, DARK), gap: 0,
            doors: [{ side: one, z: 3, open: true }] },
    ]);
    const neg = -1 as const;
    const eEnd = row(xe, -1, [
        { l: 10, floors: [2.6, 2.5, 2.3], roof: 'torv', pitch: 0.95, tint: T(0.94, DARK), facade: true, vinsj: true, krag: 0.3, gap: 0,
            doors: [{ side: neg, z: 2.5 }, { side: neg, z: 7.2 }], upperDoors: [{ side: neg, z: 5.5 }] },
        { l: 8.5, floors: [2.6, 2.4, 2.2], roof: 'torv', pitch: 0.9, tint: T(1.03, WARM), gap: 0.9,
            doors: [{ side: neg, z: 4 }], upperDoors: [{ side: neg, z: 2.5 }, { side: neg, z: 6.5 }] },
        { l: 9, floors: [2.6, 2.4], roof: 'bordtak', pitch: 0.8, tint: T(0.9, COLD), gap: 0,
            doors: [{ side: neg, z: 4.5, open: true }], upperDoors: [{ side: neg, z: 3 }] },
        { l: 8, floors: [2.6, 2.4], roof: 'torv', pitch: 0.85, tint: T(0.98, DARK), gap: 0.9,
            doors: [{ side: neg, z: 3 }] },
        { l: 6, floors: [3.0], roof: 'torv', pitch: 0.8, tint: T(0.92, WARM), gap: 0 },
    ]);
    // Schøtstua på tvers bakerst. Rotert en kvart omdreining: gavlene peker mot nabogårdene,
    // og side +1 (med døra) vender mot gårdsrommet.
    const backZ = Math.max(wEnd, eEnd) + 1.2;
    houses.push({
        x: -GARD_W / 2,
        z: backZ + HOUSE_W / 2,
        rot: Math.PI / 2,
        spec: {
            w: HOUSE_W, l: GARD_W, floors: [3.6], roof: 'torv', pitch: 0.85, tint: T(0.9, DARK),
            cornersFront: true, cornersBack: true,
            doors: [{ side: 1, z: GARD_W / 2, open: true }, { side: 1, z: GARD_W / 2 - 4.5 }],
            glugger: [{ side: 1, at: GARD_W / 2 + 3, floor: 0, open: true }, { side: 1, at: GARD_W / 2 - 7.5, floor: 0, open: true }],
            // Den man kan gå inn i: ildsted midt på golvet og ljore rett over (schotstue.ts).
            inne: { ljore: { z: GARD_W / 2, len: 1.4, down: 0.9 } },
        },
    });
    // Svalgangene går over forhusene og de neste to husene; trappa står i enden.
    return { houses, backZ, west: { z0: FRONT_Z + 1.2, z1: FRONT_Z + 29 }, east: { z0: FRONT_Z + 4.5, z1: Math.min(eEnd, wEnd) - 14 } };
}

// ── Svalgang og trapp ──

export interface SvalgangOpts {
    xWall: number;
    /** Retning fra veggen ut i gårdsrommet. */
    out: -1 | 1;
    z0: number;
    z1: number;
    /** Hvilken ende trappa kommer opp i (der står det ikke rekkverk). */
    stairEnd: 'z0' | 'z1';
}

/**
 * Svalgang: plankedekke på utkragede bjelker, stolper ned til bakken og opp til et eget lite
 * tak, og en tett brystning av stående bord. Tynne ting kolliderer i prop-gruppen, så kameraet
 * ikke stopper på dem.
 */
export function svalgang(k: MeshKit, c: ColliderKit, o: SvalgangOpts): void {
    const xo = o.xWall + o.out * SV_W;
    const xm = (o.xWall + xo) / 2;
    const len = o.z1 - o.z0;
    const zm = (o.z0 + o.z1) / 2;
    k.box('dekke', xm, DECK_Y - 0.05, zm, SV_W, 0.1, len);
    c.box(xm, DECK_Y - 0.05, zm, SV_W, 0.1, len);
    // Bjelkehoder under dekket og en langsgående bjelke ytterst.
    k.withTint({ top: 0.8, bottom: 0.8 }, () => {
        for (let z = o.z0 + 0.4; z < o.z1; z += 1.2) k.box('raatre', xm + o.out * 0.03, DECK_Y - 0.17, z, SV_W + 0.06, 0.14, 0.12);
        k.box('raatre', xo - o.out * 0.07, DECK_Y - 0.2, zm, 0.14, 0.2, len);
    });
    // Stolper: fra bakken og helt opp til svalgangstaket.
    const roofIn = DECK_Y + 2.4;
    const roofOut = DECK_Y + 2.12;
    for (let z = o.z0 + 0.15; z <= o.z1 - 0.1; z += 2.6) {
        k.box('raatre', xo - o.out * 0.08, roofOut / 2, z, 0.15, roofOut, 0.15);
        c.box(xo - o.out * 0.08, roofOut / 2, z, 0.15, roofOut, 0.15, true);
    }
    // Brystning: tette, stående bord, 1 m høy, med håndlist.
    const rail = (z0: number, z1: number) => {
        const rl = z1 - z0;
        const rz = (z0 + z1) / 2;
        k.withTint({ top: 0.95, bottom: 0.7 }, () => k.box('bordvegg', xo - o.out * 0.04, DECK_Y + 0.48, rz, 0.05, 0.96, rl, { shadeFoot: true }));
        k.box('raatre', xo - o.out * 0.04, DECK_Y + 1.0, rz, 0.1, 0.07, rl);
        c.box(xo - o.out * 0.04, DECK_Y + 0.5, rz, 0.08, 1.0, rl, true);
    };
    rail(o.z0, o.z1);
    // Endevern der trappa ikke kommer opp.
    const endZ = o.stairEnd === 'z1' ? o.z0 : o.z1;
    k.box('bordvegg', xm, DECK_Y + 0.48, endZ, SV_W, 0.96, 0.05);
    c.box(xm, DECK_Y + 0.5, endZ, SV_W, 1.0, 0.08, true);
    // Svalgangstaket: bord som heller ut fra veggen.
    const a = Math.atan2(roofIn - roofOut, SV_W);
    const run = (SV_W + 0.3) / Math.cos(a);
    const m = new THREE.Matrix4()
        .makeRotationZ(o.out * -a)
        .setPosition(o.xWall + o.out * (SV_W + 0.3) / 2, (roofIn + roofOut) / 2 - 0.02 + 0.03, zm);
    k.slab('bordtak', m, run, 0.06, len + 0.4, { grain: 'x' });
    // Det drypper fra ytterkanten (drypp.ts), og hovedtaket over drypper ned på dette taket.
    const xk = o.xWall + o.out * (SV_W + 0.3);
    k.takskjegg(V(xk, roofOut - 0.06, o.z0 - 0.2), V(xk, roofOut - 0.06, o.z1 + 0.2));
    const q = new THREE.Euler().setFromRotationMatrix(m);
    c.box(o.xWall + o.out * (SV_W + 0.3) / 2, (roofIn + roofOut) / 2, zm, run, 0.08, len + 0.4, false, q);
}

/**
 * Trapp fra bakken opp til svalgangen. Kollideren er en kile som står på bakken, med skråflaten
 * gjennom midten av trinnene (README: en skrå plate med enden i bakken stopper figuren).
 */
export function trapp(k: MeshKit, c: ColliderKit, x0: number, x1: number, zBottom: number, zTop: number, h: number, railX: number): void {
    const dir = Math.sign(zTop - zBottom);
    const run = Math.abs(zTop - zBottom);
    const steps = Math.round(h / 0.2);
    const rise = h / steps;
    const tread = run / steps;
    const xm = (x0 + x1) / 2;
    const w = Math.abs(x1 - x0);
    for (let i = 0; i < steps; i++) {
        const z = zBottom + dir * tread * (i + 0.5);
        k.box('raatre', xm, rise * (i + 1) - 0.035, z, w - 0.16, 0.07, tread + 0.04, { grain: 'x' });
    }
    // Vanger: to skrå planker trinnene hviler på.
    const ang = Math.atan2(h, run);
    const len = Math.hypot(h, run) + 0.25;
    for (const x of [Math.min(x0, x1) + 0.04, Math.max(x0, x1) - 0.04]) {
        const m = new THREE.Matrix4().makeRotationX(-dir * ang).setPosition(x, h / 2 - 0.05, (zBottom + zTop) / 2);
        k.withTint({ top: 0.85, bottom: 0.85 }, () => k.slab('raatre', m, 0.07, 0.26, len));
    }
    const pts: THREE.Vector3[] = [];
    for (const x of [x0, x1]) {
        pts.push(V(x, 0, zBottom), V(x, rise / 2, zBottom), V(x, h, zTop - dir * tread / 2), V(x, h, zTop), V(x, 0, zTop));
    }
    c.hull(pts);
    // Håndlist på siden mot gårdsrommet: en stolpe nederst og en skrå list opp til svalgangen.
    // Kollideren er en tynn, skrå plate (prop), så gutten ikke glir av trappa sidelengs.
    const rx = railX + Math.sign((x0 + x1) / 2 - railX) * 0.05;
    k.box('raatre', rx, 0.55, zBottom - dir * 0.05, 0.12, 1.1, 0.12);
    const rm = new THREE.Matrix4().makeRotationX(-dir * ang).setPosition(rx, h / 2 + 0.95, (zBottom + zTop) / 2);
    k.slab('raatre', rm, 0.08, 0.08, Math.hypot(h, run));
    const rail: THREE.Vector3[] = [];
    for (const x of [rx - 0.04, rx + 0.04]) rail.push(V(x, 0, zBottom), V(x, 1.05, zBottom), V(x, h + 1.05, zTop), V(x, h, zTop));
    c.hull(rail, true);
}

// ── Kaia og bolverket ──

/**
 * Bolverket: tømmer stablet i kryss, langsgående stokker annenhver omfar og endene av
 * tverrstokkene imellom. Kaidekket ligger oppå. `x0..x1` langs sjøen, fronten i z = `front`.
 */
export function kai(k: MeshKit, c: ColliderKit, x0: number, x1: number, front: number, depth: number, deck: MatKey = 'dekke'): void {
    const w = x1 - x0;
    const xm = (x0 + x1) / 2;
    k.box(deck, xm, -0.09, front + depth / 2, w, 0.18, depth, { skip: ['bottom'] });
    // Fast grunn under: kaia og bakken er én kollider.
    c.box(xm, -0.75, front + depth / 2, w, 1.5, depth);
    // Kantbjelke ytterst på dekket.
    k.withTint({ top: 0.85, bottom: 0.85 }, () => k.box('raatre', xm, -0.06, front + 0.1, w, 0.2, 0.22));
    bolverk(k, x0, x1, front);
}

/** Stokkene i bolverket fra `x0` til `x1`, med fronten i z = `front` og fyllet innover (+z). */
function bolverk(k: MeshKit, x0: number, x1: number, front: number): void {
    const w = x1 - x0;
    const xm = (x0 + x1) / 2;
    // Fyll bak stokkene: ellers ser man vannet gjennom glippene mellom omfarene.
    k.withTint({ top: 0.25, bottom: 0.25 }, () => k.box('raatre', xm, (WATER_Y - 1.4) / 2 - 0.1, front + 0.28, w, -WATER_Y + 1.2, 0.2, { skip: ['pz', 'top', 'bottom'] }));
    const r = 0.15;
    const bottom = WATER_Y - 1.4;
    let layer = 0;
    for (let y = -0.32; y > bottom; y -= r * 2) {
        const wet = y < WATER_Y + 0.15; // tang og væte nederst
        const tone = wet ? 0.45 : 0.8 - layer * 0.04;
        k.withTint({ top: tone, bottom: tone, hue: wet ? [0.85, 0.95, 0.8] : [1, 1, 1] }, () => {
            if (layer % 2 === 0) {
                k.log('laft', V(x0, y, front + r), V(x1, y, front + r), r, 7, false);
            } else {
                for (let x = x0 + 0.45; x < x1; x += 0.95) {
                    const jx = Math.sin(x * 12.9898 + layer) * 0.08;
                    k.log('raatre', V(x + jx, y, front - 0.06), V(x + jx, y, front + 1.2), r * 0.95, 6);
                }
            }
        });
        layer++;
    }
}

/**
 * Sideveggen der kaia stikker lenger ut enn naboens: bolverket fortsetter rundt hjørnet, fra
 * vår egen front (`front`) og inn til naboens (`nbrFront`). `x` er grensa mot naboen og `dir`
 * siden naboen ligger på (+1 = +x). Ligger naboen like langt ute eller lenger, trengs ingenting.
 */
export function kaiJog(k: MeshKit, x: number, front: number, nbrFront: number | undefined, dir: -1 | 1): void {
    if (nbrFront === undefined || nbrFront - front < 0.05) return;
    // Rotert en kvart omdreining: bolverkets x går langs z, og fronten vender mot naboen. Stokkene
    // går litt inn bak naboens front, ellers blir det en sprekk i hjørnet.
    const end = nbrFront + 0.35;
    k.at(x, 0, 0, -dir * Math.PI / 2, () => (dir > 0 ? bolverk(k, front, end, 0) : bolverk(k, -end, -front, 0)));
}

/** Pullert, tønne eller kasse: småting som gir kaia skala. Tynne ting kolliderer som prop. */
export function tonne(k: MeshKit, c: ColliderKit, x: number, z: number, tone = 1): void {
    k.withTint({ top: tone, bottom: tone, hue: WARM }, () => k.log('raatre', V(x, 0, z), V(x, 0.9, z), 0.33, 10, true, 0.31));
    k.withTint({ top: 0.35, bottom: 0.35 }, () => {
        k.log('raatre', V(x, 0.18, z), V(x, 0.24, z), 0.338, 10, false);
        k.log('raatre', V(x, 0.68, z), V(x, 0.74, z), 0.325, 10, false);
    });
    c.box(x, 0.45, z, 0.62, 0.9, 0.62, true);
}

/**
 * Brannkar: et lavt, bredt kar med vann. Ildforbudet og vannet i gårdene er kjent fra senere
 * tid [V for 1600/1700-tallet, U for 1420-årene]; her er det et designvalg [S].
 */
export function brannkar(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.8, bottom: 0.8, hue: DARK }, () => k.log('raatre', V(x, 0, z), V(x, 0.62, z), 0.42, 12, true, 0.45));
    k.withTint({ top: 0.3, bottom: 0.3 }, () => k.log('raatre', V(x, 0.4, z), V(x, 0.46, z), 0.448, 12, false));
    // Vannflaten: mørk og blank, litt under kanten.
    k.withTint({ top: 0.18, bottom: 0.18, hue: [0.8, 0.9, 1] }, () => k.log('mork', V(x, 0.5, z), V(x, 0.56, z), 0.4, 12, true));
    c.box(x, 0.31, z, 0.84, 0.62, 0.84, true);
}

// ── Cellene ──

export function toGroup(kit: MeshKit, mats: Materials, name: string, shadows = true): THREE.Group {
    const g = new THREE.Group();
    g.name = name;
    for (const [key, b] of kit.buckets) {
        if (b.vertexCount === 0) continue;
        const mesh = new THREE.Mesh(b.toGeometry(), mats.get(key));
        mesh.name = `${name}:${key}`;
        mesh.castShadow = shadows && key !== 'dekke' && key !== 'gardsrom' && key !== 'gjorme';
        mesh.receiveShadow = true;
        g.add(mesh);
    }
    return g;
}

/** Kaifronten til naboene på hver side, så bolverket kan gå rundt hjørnet der kaia hopper. */
export interface Sides {
    west?: number;
    east?: number;
}

/** Selve gården, med kai foran. `ox` er midten av gården langs sjøen. */
export async function buildGardCell(mats: Materials, ox: number, sides: Sides = {}): Promise<CellContent> {
    const c = new ColliderKit();
    const near = new THREE.Group();
    near.name = 'gard';
    const lod = new MeshKit();
    const p = plan();
    const ilder: Ild[] = [];
    const ildPos: THREE.Vector3[] = [];
    const roykPos: THREE.Vector3[] = [];
    const rom: Rom[] = [];
    const plasser: Plass[] = [];
    const iVerden = (list: Plass[], m: THREE.Matrix4, rot: number) =>
        list.forEach((p) => plasser.push({ ...p, pos: p.pos.clone().applyMatrix4(m), yaw: p.yaw + rot }));
    // Husene slås sammen i to halvdeler som nabogårdene (forhusene med kaia, og resten innover):
    // én tegning per materiale per halvdel. Som ett hus per MeshKit kostet gården 68 tegnekall
    // fra Vågen og 29 i skyggen. Innredningen (bua, schøtstua) får en egen MeshKit per hus uten
    // skygge: veggene skygger allerede for sola inne, og den skjules på avstand (`inne`).
    const fram = new MeshKit();
    const bak = new MeshKit();
    const split = FRONT_Z + 22;
    const inne: THREE.Object3D[] = [];
    p.houses.forEach((h, i) => {
        const k = h.z < split && !h.rot ? fram : bak;
        const m = new THREE.Matrix4().makeRotationY(h.rot ?? 0).setPosition(ox + h.x, 0, h.z);
        k.matrix = m.clone();
        c.matrix = m.clone();
        const a0 = k.aapninger.length;
        hus(k, c, h.spec);
        const husRom: THREE.Box3[] = [];
        const ki = new MeshKit();
        ki.matrix = m.clone();
        const antPlasser = plasser.length;
        if (h.spec.inne && !h.spec.inne.ljore) {
            // Bua: ingen ild. Lyset kommer inn gjennom dørene, så dagslyset dempes bare litt.
            iVerden(bu(ki, c, h.spec), m, h.rot ?? 0);
            for (const r of romIHus(h.spec, 0.55)) rom.push({ box: r.box.applyMatrix4(m), demp: r.demp });
        } else if (h.spec.inne) {
            const info = schotstue(ki, c, h.spec);
            iVerden(info.folk, m, h.rot ?? 0);
            const ild = new Ild({ smokeTop: eaveY(h.spec) + riseOf(h.spec) - 0.3 - info.ild.y, spread: 0.45 });
            ild.group.position.copy(info.ild).applyMatrix4(m);
            near.add(ild.group);
            ilder.push(ild);
            ildPos.push(ild.group.position.clone().setY(ild.group.position.y + 0.5));
            roykPos.push(ild.group.position.clone().setY(eaveY(h.spec) + riseOf(h.spec)));
            rom.push({ box: info.rom.box.clone().applyMatrix4(m), demp: info.rom.demp });
        }
        // Alle de hule etasjene, også de som ikke demper lyset: står kameraet i en av dem, tegnes alt.
        if (h.spec.inne) husRom.push(...romIHus(h.spec, 1).map((r) => r.box.applyMatrix4(m)));
        if (ki.buckets.size > 0) {
            // Innredningen tegnes bare der den kan synes gjennom dørene og gluggene (portal.ts),
            // og folkene inne følger med (`bak` på plassen, folk.ts).
            const portaler = new Portaler(k.aapninger.slice(a0), husRom);
            for (let j = antPlasser; j < plasser.length; j++) plasser[j].bak = portaler;
            const g = bakPortaler(toGroup(ki, mats, `hus${i}:inne`, false), portaler);
            near.add(g);
            inne.push(g);
        }
        lod.matrix = m.clone();
        husLod(lod, h.spec, (key) => mats.lodColor(key));
    });

    // Felles: gårdsrommet, svalgangene, trappene, kaia og småting. Går i forhalvdelen.
    const k = fram;
    k.matrix = new THREE.Matrix4().makeTranslation(ox, 0, 0);
    c.matrix = k.matrix.clone();
    const back = p.backZ;
    // Gårdsrommet: plankegang langs smuget, litt mørkere inn mot veggene.
    k.withTint({ top: 0.95, bottom: 0.95 }, () => k.box('gardsrom', 0, -0.07, (FRONT_Z + back) / 2, YARD_W, 0.14, back - FRONT_Z, { skip: ['bottom'] }));
    k.withTint({ top: 0.55, bottom: 0.55 }, () => {
        for (const x of [-YARD_W / 2 + 0.06, YARD_W / 2 - 0.06]) k.box('raatre', x, -0.02, (FRONT_Z + back) / 2, 0.14, 0.1, back - FRONT_Z);
    });
    c.box(0, -0.75, (FRONT_Z + back) / 2, GARD_W, 1.5, back - FRONT_Z);
    // Gjørme under hele gården: synes i glippene mellom husene og bak schøtstua.
    const end = FRONT_Z + GARD_DEPTH;
    k.withTint({ top: 0.7, bottom: 0.7 }, () => k.box('gjorme', 0, -0.06, (FRONT_Z + end) / 2, GARD_W, 0.1, end - FRONT_Z, { skip: ['bottom'] }));
    kai(k, c, -GARD_W / 2, GARD_W / 2, 0, FRONT_Z);
    kaiJog(k, -GARD_W / 2, 0, sides.west, -1);
    kaiJog(k, GARD_W / 2, 0, sides.east, 1);

    const xwIn = -YARD_W / 2;
    const xeIn = YARD_W / 2;
    svalgang(k, c, { xWall: xwIn, out: 1, z0: p.west.z0, z1: p.west.z1, stairEnd: 'z1' });
    trapp(k, c, xwIn, xwIn + SV_W, p.west.z1 + 4.2, p.west.z1, DECK_Y, xwIn + SV_W);
    svalgang(k, c, { xWall: xeIn, out: -1, z0: p.east.z0, z1: p.east.z1, stairEnd: 'z1' });
    trapp(k, c, xeIn - SV_W, xeIn, p.east.z1 + 4.2, p.east.z1, DECK_Y, xeIn - SV_W);

    // Tønner og en kassestabel: noe å klatre på opp mot svalgangen, og skala på kaia.
    for (const [x, z, t] of [[-7.6, 2.6, 0.95], [-6.9, 3.4, 0.8], [4.2, 3.1, 1.0], [7.5, 2.4, 0.9]] as const) tonne(k, c, x, z, t);
    // I gårdsrommet: tønner inntil veggen, og brannkar med vann under svalgangen ved trappene [S].
    // Alt står inntil veggene, så midten av gårdsrommet og trappefoten er fri.
    for (const [x, z, t] of [[-1.55, 10.2, 0.85], [1.55, 26.5, 0.95], [1.55, 27.2, 0.8], [-1.55, 30.5, 0.9]] as const) tonne(k, c, x, z, t);
    brannkar(k, c, -1.5, p.west.z1 - 1.4);
    brannkar(k, c, 1.5, p.east.z1 - 1.4);
    k.withTint({ top: 0.9, bottom: 0.9 }, () => {
        k.box('bordvegg', 1.35, 0.6, 19.5, 1.1, 1.2, 1.1);
        k.box('bordvegg', 1.45, 0.4, 22.0, 0.8, 0.8, 0.8);
    });
    c.box(1.35, 0.6, 19.5, 1.1, 1.2, 1.1);
    c.box(1.45, 0.4, 22.0, 0.8, 0.8, 0.8);
    // Pullerter langs kaikanten.
    for (const x of [-7, -1, 5]) {
        k.withTint({ top: 0.7, bottom: 0.7 }, () => k.log('raatre', V(x, -0.1, 0.45), V(x, 0.55, 0.45), 0.17, 8, true, 0.15));
        c.box(x, 0.25, 0.45, 0.32, 0.6, 0.32, true);
    }
    // Nordlandsfiskeren som kom med jekta står på kaia og venter på oppgjøret [S].
    plasser.push({ figur: 'fisker', rolle: 'staa', pos: V(ox + 6.1, 0, 1.7), yaw: -1.35, samtale: 'fisker', id: 'ottar' });
    // Buntene skutedrengen bærer inn i bua: lagt opp på kaia fra båten [S].
    buntStabel(k, c, -4.55, 1.45);
    // Halvdelene nær, og hele gården samlet lenger unna (streaming.ts, SAMLET_R).
    const delt = [toGroup(fram, mats, 'gard:fram'), toGroup(bak, mats, 'gard:bak')];
    const samlet = toGroup(slaSammen([fram, bak]), mats, 'gard:samlet', false);
    near.add(...delt, samlet);

    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial());
    mid.name = 'gard:lod';
    // Folkene i bua og schøtstua lages og kastes med cella (folk.ts).
    const folk = await lagFolk(plasser, mats, Math.abs(Math.round(ox)) + 7, ruter(ox, back));
    near.add(folk.group);
    return {
        near, mid, inne, samlet: { delt, samlet }, colliders: [...c.specs, ...folk.colliders], ild: ildPos, royk: roykPos, rom, drypp: [...fram.skjegg, ...bak.skjegg],
        gaaende: folk.gaaende, snakkbare: folk.snakkbare,
        // Gjeldsboka ligger på pulten der husbonden står og skriver (bu.ts).
        steder: plasser.filter((p) => p.id === 'husbonden').map((p) => ({ id: 'gjeldsbok', pos: p.pos.clone(), r: 1.9 })),
        // Gutten kan bære bunter fra stabelen på kaia til bismeren i bua, som skutedrengen.
        bunter: [{ hent: V(ox - 4.55, 0, 2.15), lever: V(ox - 3.75, 0.2, 10.3) }],
        tick: (t, dt, ctx) => {
            ilder.forEach((f) => f.update(t, dt));
            folk.tick(t, dt, ctx);
        },
        dispose: () => {
            ilder.forEach((f) => f.dispose());
            folk.dispose();
        },
    };
}

/**
 * Folk som går i den første gården [S]. Skutedrengen bærer bunter fra stabelen på kaia, opp
 * gårdsrommet og inn den åpne bu-døra, og legger dem ved bismeren. Svennen går fra schøtstua ned
 * til kaia, ser ut over Vågen en stund og går tilbake. De holder hver sin side av midten, så de
 * ikke møtes nese mot nese, og alt de går forbi står inntil veggene.
 */
function ruter(ox: number, back: number): Rute[] {
    const P = (x: number, y: number, z: number) => V(ox + x, y, z);
    const BU = 0.2; // golvet inne
    return [
        {
            figur: 'dreng', fart: 1.05, start: 3, id: 'tideke',
            stopp: [
                { p: P(-4.55, 0, 2.35), last: true, se: Math.PI, vent: 0.4 },
                { p: P(-1.3, 0, 4.0) },
                { p: P(-0.45, 0, 6.5) },
                { p: P(-0.45, 0, 11.0) },
                { p: P(-1.5, 0, 11.8) },
                { p: P(-2.95, BU, 11.7) },
                { p: P(-3.8, BU, 10.45), last: false, se: -Math.PI / 2, vent: 0.6 },
                { p: P(-2.9, BU, 11.85) },
                { p: P(-1.4, 0, 11.85) },
                { p: P(-0.5, 0, 10.6) },
                { p: P(-0.5, 0, 6.5) },
                { p: P(-1.4, 0, 3.9) },
            ],
        },
        // En svenn går opp trappa, bortover svalgangen til loftsdøra og ned igjen.
        {
            figur: 'svenn', fart: 0.9, start: 2,
            stopp: [
                { p: P(-0.4, 0, 39.6), vent: 3, se: 0 },
                { p: P(-1.47, 0, 38.3) },
                { p: P(-1.47, DECK_Y, 33.95) },
                { p: P(-1.47, DECK_Y, 10.3), vent: 4, se: -Math.PI / 2 },
                { p: P(-1.47, DECK_Y, 33.95) },
                { p: P(-1.47, 0, 38.3) },
            ],
        },
        {
            figur: 'svenn', fart: 1.0, start: 1, id: 'gerd',
            stopp: [
                { p: P(0.45, 0, back - 2.2), vent: 6, se: Math.PI },
                { p: P(0.45, 0, 33) },
                { p: P(0.45, 0, 6) },
                { p: P(1.1, 0, 1.6), vent: 8, se: Math.PI },
                { p: P(0.5, 0, 6) },
                { p: P(0.5, 0, 33) },
            ],
        },
    ];
}

/** En stabel bunter tørrfisk på kaia, surret med tau: det skutedrengen bærer inn. */
function buntStabel(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    const lag: [number, number, number][] = [[-0.27, 0, 0], [0.27, 0, 0], [0, 0.27, 0.02]];
    for (const [dx, y, dz] of lag) {
        k.withUv(0.04, () => {
            k.withTint({ top: 1.45, bottom: 1.1, hue: [1.02, 0.98, 0.86] }, () => k.box('raatre', x + dx, y + 0.13, z + dz, 0.5, 0.26, 0.3, { grain: 'x' }));
        });
        k.withTint({ top: 1.1, bottom: 0.9, hue: [1.12, 1.02, 0.8] }, () => {
            for (const t of [-0.13, 0.13]) k.box('raatre', x + dx + t, y + 0.13, z + dz, 0.035, 0.27, 0.31);
        });
    }
    c.box(x, 0.27, z, 1.1, 0.54, 0.4, true);
}
