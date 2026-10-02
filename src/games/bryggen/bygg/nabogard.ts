// Nabogårdene: det samme modulsettet som den første gården, satt sammen av parametre.
//
// Hver gård trekkes fra et frø: enkelt- eller dobbeltgård, husbredde, bredde på gårdsrommet,
// hvor mange hus som står etter hverandre, hvor høye de er, torv eller bordtak, hvor langt
// svalgangene går, og en egen fargetone. Naboene trekkes slik at to gårder ved siden av
// hverandre aldri får samme tone eller samme gavl mot sjøen, så bryggefronten ikke ser kopiert ut.
//
// Blueprint §5.2: enkelt- og dobbeltgårder, smale og lange, 2-3 etasjer [V]. Målene og
// fordelingen mellom dem er valgt for spillet [S]; de ekte gårdsbreddene venter på
// utgravningsplanene [K].
//
// Hele gården (hus, svalganger, kai og småting) er én MeshKit: ett tegnekall per materiale for
// hele cella. Den første gården har én per hus, men den står der spilleren starter.
import * as THREE from 'three';
import { ColliderKit, MeshKit, slaSammen } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellContent } from '../motor/streaming';
import { eaveY, hus, husLod, riseOf, rng, trekkGlugger, type HouseSpec } from './moduler';
import { lagFolk, type FigurNavn } from './folk';
import type { Rute } from './vandrer';
import {
    COLD, DARK, FRONT_Z, GARD_DEPTH, SV_W, WARM, DECK_Y,
    brannkar, kai, kaiJog, svalgang, toGroup, tonne, trapp,
    type Placed, type Sides,
} from './gard';

type Hue = [number, number, number];
const HUES: Hue[] = [WARM, COLD, DARK];

export interface GardParams {
    seed: number;
    /** To husrekker med gårdsrommet imellom, eller én rekke med gårdsrommet langs siden. */
    dobbel: boolean;
    /** Enkeltgård: siden husrekka står på (-1 = mot -x). */
    husSide: -1 | 1;
    houseW: number;
    yardW: number;
    /** Hus per rekke før schøtstua. */
    husPerRekke: number;
    /** Etasjer i forhuset mot sjøen. Innover blir husene lavere. */
    forhusEtasjer: 2 | 3;
    /** Sjansen for torvtak per hus; resten får bordtak. */
    torv: number;
    /** Hvor mange hus svalgangen går over, per rekke (0 = ingen svalgang). */
    svalgang: number[];
    /** Fargefaktor for hele gården og skjæret i treverket. */
    tone: number;
    hue: number;
    /** Bordkledd gavl mot sjøen (med vinsj) eller bar laft med laftehoder. */
    facade: boolean;
    schotstue: boolean;
    /** Kaifronten: meter fram (-) eller tilbake (+) fra 1332-linja. */
    front: number;
    /** Hvor mye etasjene i forhuset krager ut over gavlen, per etasje (0 = rett gavl). */
    krag: number;
}

/** Bredden langs sjøen. */
export const gardWidth = (p: GardParams): number => (p.dobbel ? p.houseW * 2 + p.yardW : p.houseW + p.yardW);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Trekker en gård. `prev` er naboen rett før langs fronten, så de to ikke blir like. */
export function naboParams(seed: number, front: number, prev?: GardParams): GardParams {
    const r = rng(seed);
    const dobbel = prev && !prev.dobbel ? r() < 0.8 : r() < 0.55;
    const houseW = lerp(6.2, 7.6, r());
    const yardW = dobbel ? lerp(3.4, 4.6, r()) : lerp(3.0, 3.8, r());
    // Tone og skjær: alltid et hørbart sprang fra naboen.
    let tone = lerp(0.86, 1.06, r());
    if (prev && Math.abs(tone - prev.tone) < 0.07) tone = prev.tone > 0.96 ? prev.tone - 0.1 : prev.tone + 0.09;
    let hue = Math.floor(r() * HUES.length);
    if (prev && hue === prev.hue) hue = (hue + 1) % HUES.length;
    // Gavlen mot sjøen: bordkledd eller laftet, som oftest ulik naboens.
    let facade = r() < 0.55;
    if (prev && prev.facade === facade && r() < 0.6) facade = !facade;
    const sv = (): number => (r() < 0.25 ? 0 : 1 + Math.floor(r() * 3));
    // To svalganger over et smalt gårdsrom gjør det for trangt: da får bare den ene rekka svalgang.
    const svalganger = dobbel ? [sv(), yardW < 3.9 ? 0 : sv()] : [Math.max(1, sv())];
    return {
        seed,
        dobbel,
        husSide: r() < 0.5 ? -1 : 1,
        houseW,
        yardW,
        husPerRekke: 4 + Math.floor(r() * 3),
        forhusEtasjer: r() < 0.7 ? 3 : 2,
        torv: lerp(0.45, 0.9, r()),
        svalgang: svalganger,
        tone,
        hue,
        facade,
        schotstue: r() < 0.7,
        front,
        // Egen trekning, så gårdene ellers blir som før utkragingen kom inn.
        krag: kragFor(seed),
    };
}

function kragFor(seed: number): number {
    const r = rng(seed * 31 + 1);
    return r() < 0.2 ? 0 : lerp(0.22, 0.45, r());
}

interface Rekke {
    /** Husmidten på tvers. */
    x: number;
    /** Siden mot gårdsrommet. */
    yardSide: -1 | 1;
    houses: Placed[];
    end: number;
    sv?: { z0: number; z1: number };
}

/** Husene i én rekke, fra sjøen og innover til `zEnd`. */
function rekke(p: GardParams, r: () => number, x: number, yardSide: -1 | 1, svCount: number, zEnd: number): Rekke {
    const z0 = FRONT_Z + p.front;
    const n = Math.max(3, p.husPerRekke + (r() < 0.3 ? -1 : 0));
    const gaps = Array.from({ length: n }, (_, i): number => (i < n - 1 && r() < 0.45 ? 0.9 : 0));
    // Forhuset er størst: det er bua der handelen foregikk.
    const weights = Array.from({ length: n }, (_, i) => (i === 0 ? 1.25 : lerp(0.8, 1.2, r())));
    const avail = zEnd - z0 - gaps.reduce((a, b) => a + b, 0);
    const sum = weights.reduce((a, b) => a + b, 0);
    const hues = HUES[p.hue];

    const houses: Placed[] = [];
    let z = z0;
    for (let i = 0; i < n; i++) {
        const l = (avail * weights[i]) / sum;
        let floors: number[];
        if (i === 0) floors = p.forhusEtasjer === 3 ? [2.6, lerp(2.3, 2.5, r()), lerp(2.15, 2.35, r())] : [2.6, lerp(2.45, 2.7, r())];
        else if (i === n - 1) floors = r() < 0.5 ? [lerp(2.9, 3.3, r())] : [2.6, lerp(2.3, 2.5, r())];
        else floors = r() < 0.55 - i * 0.08 ? [2.6, lerp(2.3, 2.5, r()), lerp(2.1, 2.3, r())] : [2.6, lerp(2.3, 2.6, r())];
        const facade = i === 0 && p.facade;
        // Hvert hus litt ulikt innenfor gårdens tone; av og til et hus med et annet skjær.
        const hue = r() < 0.3 ? HUES[Math.floor(r() * HUES.length)] : hues;
        houses.push({
            x,
            z,
            spec: {
                w: p.houseW,
                l,
                floors,
                roof: r() < p.torv ? 'torv' : 'bordtak',
                pitch: lerp(0.78, 0.98, r()),
                tint: { top: p.tone * lerp(0.93, 1.07, r()), bottom: p.tone, hue },
                cornersFront: i === 0 ? !facade : gaps[i - 1] > 0.3,
                cornersBack: gaps[i] > 0.3 || i === n - 1,
                facade,
                vinsj: facade,
                krag: i === 0 ? p.krag : 0,
                hodeSeg: 5,
            },
        });
        z += l + gaps[i];
    }
    const end = z - gaps[n - 1];

    // Svalgangen går over de første husene; trappa kommer ned langs veggen til huset etter.
    let sv: Rekke['sv'];
    let k = Math.min(svCount, n - 1);
    while (k > 0) {
        const last = houses[k - 1];
        const z1 = last.z + last.spec.l - 0.4;
        if (z1 + 4.8 < end) {
            sv = { z0: z0 + lerp(1.0, 4.0, r()), z1 };
            break;
        }
        k--;
    }

    // Dører mot gårdsrommet, men ikke der trappa og brannkaret står.
    const blocked = (zz: number) => !!sv && zz > sv.z1 - 2.2 && zz < sv.z1 + 4.8;
    for (const h of houses) {
        const s: HouseSpec = h.spec;
        const doors: NonNullable<HouseSpec['doors']> = [];
        const cand = s.l > 8 ? [0.28, 0.72] : [0.5];
        for (const f of cand) {
            const zz = s.l * f + lerp(-0.4, 0.4, r());
            if (!blocked(h.z + zz)) doors.push({ side: yardSide, z: zz, open: r() < 0.25 });
        }
        s.doors = doors;
        if (sv && h.z < sv.z1 && h.z + s.l > sv.z0 && s.floors.length > 1) {
            const a = Math.max(h.z, sv.z0) + 0.8;
            const b = Math.min(h.z + s.l, sv.z1) - 0.8;
            if (b > a) s.upperDoors = [{ side: yardSide, z: (a + b) / 2 - h.z }];
        }
    }
    // Gluggene trekkes for seg (eget frø per hus), så resten av gården ikke flytter seg.
    houses.forEach((h, i) => {
        h.spec.glugger = trekkGlugger(h.spec, yardSide, i === 0, rng(p.seed * 13 + i * 101 + (x > 0 ? 7 : 0)));
    });
    return { x, yardSide, houses, end, sv };
}

/** Planen for hele gården: rekkene, gårdsrommet og schøtstua. */
function planNabo(p: GardParams) {
    const r = rng(p.seed * 7 + 3);
    const W = gardWidth(p);
    // Husrekkene slutter omtrent på samme sted uansett hvor kaia står: bakgrensa er felles.
    const zEnd = FRONT_Z + (p.schotstue ? 42.5 : 52) + lerp(0, 2.5, r());
    const rows: Rekke[] = [];
    let yardX: number;
    if (p.dobbel) {
        const hx = p.yardW / 2 + p.houseW / 2;
        rows.push(rekke(p, r, -hx, 1, p.svalgang[0], zEnd));
        rows.push(rekke(p, r, hx, -1, p.svalgang[1] ?? 0, zEnd));
        yardX = 0;
    } else {
        const s = p.husSide;
        rows.push(rekke(p, r, s * (W / 2 - p.houseW / 2), (-s) as -1 | 1, p.svalgang[0], zEnd));
        yardX = -s * (W / 2 - p.yardW / 2);
    }
    const houses = rows.flatMap((row) => row.houses);
    const back = Math.max(...rows.map((row) => row.end)) + 1.2;
    if (p.schotstue) {
        // Rotert en kvart omdreining, som i den første gården: døra vender mot gårdsrommet.
        houses.push({
            x: -W / 2,
            z: back + p.houseW / 2,
            rot: Math.PI / 2,
            spec: {
                w: p.houseW, l: W, floors: [lerp(3.3, 3.7, r())], roof: 'torv', pitch: 0.85,
                tint: { top: p.tone * 0.92, bottom: p.tone, hue: DARK },
                cornersFront: true, cornersBack: true, hodeSeg: 5,
                doors: [{ side: 1, z: W / 2 + yardX, open: true }],
            },
        });
        const st = houses[houses.length - 1].spec;
        st.glugger = trekkGlugger(st, 1, false, rng(p.seed * 17 + 5));
    }
    return { W, rows, houses, back, yardX, r };
}

/** En nabogård som celle. `ox` er midten langs sjøen. */
export async function buildNaboCell(mats: Materials, ox: number, p: GardParams, sides: Sides = {}): Promise<CellContent> {
    const plan = planNabo(p);
    const { W, rows, houses, back, yardX, r } = plan;
    const z0 = FRONT_Z + p.front;
    const zBack = FRONT_Z + GARD_DEPTH;
    // To deler: forhusene med kaia, og resten innover. Hver del er én tegning per materiale, og
    // Three kan hoppe over den delen som er utenfor bildet eller utenfor skyggekameraet. Som én
    // klump ble hele gården tegnet (og skygget) så snart et hjørne av den var synlig.
    const fram = new MeshKit();
    const bak = new MeshKit();
    const split = z0 + 22;
    const kitAt = (z: number) => (z < split ? fram : bak);
    const c = new ColliderKit();
    const lod = new MeshKit();
    for (const h of houses) {
        const k = kitAt(h.z);
        const m = new THREE.Matrix4().makeRotationY(h.rot ?? 0).setPosition(ox + h.x, 0, h.z);
        k.matrix = m.clone();
        c.matrix = m.clone();
        hus(k, c, h.spec);
        lod.matrix = m.clone();
        husLod(lod, h.spec, (key) => mats.lodColor(key));
    }

    fram.matrix = new THREE.Matrix4().makeTranslation(ox, 0, 0);
    bak.matrix = fram.matrix.clone();
    c.matrix = fram.matrix.clone();
    let k = fram;
    // Gårdsrommet, gjørme under resten og fast grunn.
    k.withTint({ top: 0.95, bottom: 0.95 }, () => k.box('gardsrom', yardX, -0.07, (z0 + back) / 2, p.yardW, 0.14, back - z0, { skip: ['bottom'] }));
    k.withTint({ top: 0.7, bottom: 0.7 }, () => k.box('gjorme', 0, -0.06, (z0 + zBack) / 2, W, 0.1, zBack - z0, { skip: ['bottom'] }));
    c.box(0, -0.75, (z0 + zBack) / 2, W, 1.5, zBack - z0);
    kai(k, c, -W / 2, W / 2, p.front, FRONT_Z);
    kaiJog(k, -W / 2, p.front, sides.west, -1);
    kaiJog(k, W / 2, p.front, sides.east, 1);

    // Svalganger, trapper og et brannkar ved trappefoten.
    for (const row of rows) {
        if (!row.sv) continue;
        const xWall = row.x + row.yardSide * (p.houseW / 2);
        const out = row.yardSide;
        k = kitAt(row.sv.z1);
        svalgang(k, c, { xWall, out, z0: row.sv.z0, z1: row.sv.z1, stairEnd: 'z1' });
        const xs = [xWall, xWall + out * SV_W].sort((a, b) => a - b);
        trapp(k, c, xs[0], xs[1], row.sv.z1 + 4.2, row.sv.z1, DECK_Y, xWall + out * SV_W);
        brannkar(k, c, xWall + out * 0.55, row.sv.z1 - 1.4);
    }

    // Tønner langs veggene i gårdsrommet, unna trappene.
    const free = (row: Rekke, z: number) => !row.sv || z < row.sv.z1 - 2.4 || z > row.sv.z1 + 5;
    for (const row of rows) {
        const xWall = row.x + row.yardSide * (p.houseW / 2 + 0.45);
        for (let i = 0; i < 2; i++) {
            const z = lerp(z0 + 6, back - 4, r());
            if (free(row, z)) tonne(kitAt(z), c, xWall, z, lerp(0.8, 1.0, r()));
        }
    }
    // Kaia: noen tønner og pullerter langs kanten.
    k = fram;
    const nT = 1 + Math.floor(r() * 3);
    for (let i = 0; i < nT; i++) tonne(k, c, lerp(-W / 2 + 1, W / 2 - 1, r()), p.front + lerp(2.4, 3.6, r()), lerp(0.8, 1.0, r()));
    for (let x = -W / 2 + lerp(1.5, 3, r()); x < W / 2 - 1; x += lerp(5, 7, r())) {
        k.withTint({ top: 0.7, bottom: 0.7 }, () =>
            k.log('raatre', new THREE.Vector3(x, -0.1, p.front + 0.45), new THREE.Vector3(x, 0.55, p.front + 0.45), 0.17, 8, true, 0.15)
        );
        c.box(x, 0.25, p.front + 0.45, 0.32, 0.6, 0.32, true);
    }

    // Halvdelene nær, og hele gården samlet lenger unna (streaming.ts, SAMLET_R).
    const near = new THREE.Group();
    near.name = `nabo${p.seed}`;
    const delt = [toGroup(fram, mats, `nabo${p.seed}:fram`), toGroup(bak, mats, `nabo${p.seed}:bak`)];
    const samlet = toGroup(slaSammen([fram, bak]), mats, `nabo${p.seed}:samlet`, false);
    near.add(...delt, samlet);
    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial());
    mid.name = `nabo${p.seed}:lod`;
    const folk = await lagFolk([], mats, p.seed, naboRuter(ox, p, yardX, back, rng(p.seed * 31 + 9)));
    // Det ryker fra ljoren i schøtstua (luft.ts). Huset står på tvers, midt i gården [S].
    const st = p.schotstue ? houses[houses.length - 1].spec : null;
    const royk = st ? [new THREE.Vector3(ox, eaveY(st) + riseOf(st), back + p.houseW / 2)] : undefined;
    near.add(folk.group);
    return {
        near, mid, samlet: { delt, samlet }, colliders: c.specs, gaaende: folk.gaaende, snakkbare: folk.snakkbare, royk,
        tick: (t, dt, ctx) => folk.tick(t, dt, ctx),
        dispose: () => folk.dispose(),
    };
}

/**
 * Folk i nabogården [S]: en som rusler langs kaia og stopper for å se ut over Vågen, og en gutt
 * som bærer bunter fra kaikanten og opp midt i gårdsrommet (alt annet står inntil veggene der).
 * Hvem og hvor langt trekkes fra frøet, så ingen to gårder ser like ut.
 */
function naboRuter(ox: number, p: GardParams, yardX: number, back: number, r: () => number): Rute[] {
    const W = gardWidth(p);
    const kz = p.front + 1.3;
    const P = (x: number, z: number) => new THREE.Vector3(ox + x, 0, z);
    const voksne: FigurNavn[] = ['svenn', 'husbonde', 'svenn', 'dreng'];
    const gutter: FigurNavn[] = ['dreng', 'stuedreng', 'dreng'];
    const a = -W / 2 + 1.4;
    const b = W / 2 - 1.4;
    const midt = lerp(a, b, 0.3 + r() * 0.4);
    const inn = lerp(FRONT_Z + p.front + 8, back - 5, r());
    return [
        {
            figur: voksne[Math.floor(r() * voksne.length)], fart: lerp(0.85, 1.1, r()), start: Math.floor(r() * 4),
            stopp: [
                { p: P(a, kz), vent: lerp(2, 5, r()), se: Math.PI },
                { p: P(midt, kz + 0.2) },
                { p: P(b, kz), vent: lerp(3, 7, r()), se: Math.PI },
                { p: P(midt, kz - 0.1) },
            ],
        },
        {
            figur: gutter[Math.floor(r() * gutter.length)], fart: lerp(0.95, 1.15, r()), start: Math.floor(r() * 5),
            stopp: [
                { p: P(yardX, p.front + 1.5), last: true, se: Math.PI, vent: 0.5 },
                { p: P(yardX + 0.15, FRONT_Z + p.front + 2) },
                { p: P(yardX, inn), last: false, vent: 0.5 },
                { p: P(yardX - 0.15, FRONT_Z + p.front + 2) },
            ],
        },
    ];
}
