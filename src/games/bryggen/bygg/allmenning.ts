// Nikolaikirkeallmenningen: den brede branngata fra sjøen og opp til Nikolaikirken.
//
// Blueprint §5.2: byens midtpunkt og torg til 1470, med rådhuset (stefnustova), og 18 m bred
// nederst ved Vinkjelleren [V Byleksikon]. Byleksikonet beskriver byplanen med torget nederst ved
// Bryggen, rådhus og vinkjellere på allmenningen og kirken øverst [V]. Det første rådhuset lå ved
// kirken og var i bruk fra ca. 1300 til 1558 [V Wikipedia]. Hvordan det så ut, og nøyaktig hvor
// det sto, er ikke funnet [K].
//
// Cella har eget rom langs x: 0 er grensa mot den første gården (vest), `w` grensa mot nabogården
// i øst. Veggene mot nabogårdene står i nabocellene, så her bygges bare det som står i selve
// allmenningen. Spilleren skal kunne gå fritt: midten og plankegangen er tom, bodene står langs
// sidene, og alt som står kolliderer (tynne ting i prop-gruppen).
import * as THREE from 'three';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellContent } from '../motor/streaming';
import { hus, husLod, rng, type HouseSpec } from './moduler';
import { DECK_Y, FRONT_Z, GARD_DEPTH, SV_W, T, WARM, kai, kaiJog, svalgang, toGroup, tonne, trapp, type Sides } from './gard';
import { LIST, STEIN, apning, paFlate } from './mariakirken';
import { NIKOLAI_Y, PORTAL_Z, buildNikolaikirken } from './nikolaikirken';
import { lagFolk } from './folk';
import { bod, bronn, pytt, slede, spor } from './torg';
import { torgPlasser, torgRuter } from './torgfolk';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Rådhuset i cellas rom: x fra `x0` til `x0 + w`, z fra `z0` og `l` innover. */
const RAD = { x0: 11.6, w: 6, z0: 30, l: 12 };
/** Steintrappa opp mot kirkegården: midt på, fra `z0` til muren. */
const KTRAPP = { x: 9.4, w: 2.4, z0: 57.5, z1: 60.95 };
/** Grensa bak byen (bryggen.ts) står like bak her; muren står på den. */
const MUR_Z = 61.05;

/**
 * Rådhuset: en grunnmur av stein med et laftet rom oppå, svalgang langs allmenningen og trapp opp.
 * At rådhuset sto på allmenningen, er [V]; steinkjelleren, svalgangen og torvtaket er valgt for
 * spillet etter stuer i stein og tre fra samme tid [S]. Stefnustova betyr «møtestua»: der
 * rådet og bytinget kom sammen [V navnet; bruken i 1420-årene U].
 */
function radhus(k: MeshKit, c: ColliderKit, lod: MeshKit, mats: Materials, ox: number): void {
    const cx = RAD.x0 + RAD.w / 2;
    const cz = RAD.z0 + RAD.l / 2;
    const spec: HouseSpec = {
        w: RAD.w, l: RAD.l, floors: [2.7], roof: 'torv', pitch: 0.85, tint: T(0.97, WARM),
        cornersFront: true, cornersBack: true,
        doors: [{ side: -1, z: 8 }],
        glugger: [
            { side: -1, at: 4.6, floor: 0 }, { side: -1, at: 10.6, floor: 0, open: true },
            { side: 0, at: -1.5, floor: 0 }, { side: 0, at: 1.5, floor: 0, open: true }, { side: 0, at: 0, floor: 1 },
        ],
    };
    // Laftestua står oppå grunnmuren, med svillen på muren.
    const m = new THREE.Matrix4().makeTranslation(ox + cx, DECK_Y, RAD.z0);
    const km = k.matrix;
    const cm = c.matrix;
    k.matrix = m.clone();
    c.matrix = m.clone();
    hus(k, c, spec);
    k.matrix = km;
    c.matrix = cm;
    lod.matrix = m.clone();
    husLod(lod, spec, (key) => mats.lodColor(key));
    lod.matrix = new THREE.Matrix4().makeTranslation(ox, 0, 0);
    const st = mats.lodColor('stein');
    lod.withTint({ top: 1, bottom: 1, hue: [st.r, st.g, st.b] }, () => lod.box('mork', cx, DECK_Y / 2, cz, RAD.w + 0.2, DECK_Y, RAD.l + 0.2, { skip: ['bottom'] }));

    // Grunnmuren: litt bredere enn stua, med en list øverst.
    const gw = RAD.w + 0.2;
    const gl = RAD.l + 0.2;
    k.withTint(STEIN, () => k.box('stein', cx, DECK_Y / 2, cz, gw, DECK_Y, gl, { skip: ['bottom'], shadeFoot: true }));
    k.withTint(LIST, () => k.box('stein', cx, DECK_Y - 0.08, cz, gw + 0.12, 0.16, gl + 0.12));
    c.box(cx, DECK_Y / 2, cz, gw, DECK_Y, gl);
    // Kjellerdør med rund bue mot sjøen, og glugger.
    paFlate(k, 'nz', cx, cz, gw / 2, gl / 2, () => {
        k.withTint(LIST, () => k.box('stein', 0, 1.0, 0.12, 1.9, 2.0, 0.24, { skip: ['bottom'] }));
        k.at(0, 0, 0.24, 0, () => apning(k, 0, 0, 1.2, 1.25));
        for (const u of [-2.1, 2.1]) apning(k, u, 1.3, 0.35, 0.5);
    });
    paFlate(k, 'nx', cx, cz, gw / 2, gl / 2, () => {
        k.withTint(LIST, () => k.box('stein', 3.4, 0.95, 0.12, 1.7, 1.9, 0.24, { skip: ['bottom'] }));
        k.at(0, 0, 0.24, 0, () => apning(k, 3.4, 0, 1.05, 1.2));
        for (const u of [-1.2, 0.6]) apning(k, u, 1.2, 0.3, 0.5);
    });

    // Svalgangen langs allmenningen, trappa opp fra sjøsiden langs muren.
    const xWall = RAD.x0;
    const sz0 = RAD.z0 + 4.5;
    svalgang(k, c, { xWall, out: -1, z0: sz0, z1: RAD.z0 + RAD.l - 0.5, stairEnd: 'z0' });
    trapp(k, c, xWall - SV_W, xWall, RAD.z0 + 0.3, sz0, DECK_Y, xWall - SV_W);
}

/** Steintrappa opp mot kirkegården, med stablede vanger på sidene. */
function kirketrapp(k: MeshKit, c: ColliderKit): void {
    const { x, w, z0, z1 } = KTRAPP;
    const n = 10;
    const rise = NIKOLAI_Y / n;
    const tread = (z1 - z0) / n;
    k.withTint(STEIN, () => {
        for (let i = 0; i < n; i++) {
            const top = rise * (i + 1);
            const z = z0 + tread * (i + 0.5);
            k.box('stein', x, top / 2 - 0.05, z, w, top + 0.1, tread + 0.02, { skip: ['bottom'] });
            for (const sx of [-1, 1]) k.box('stein', x + sx * (w / 2 + 0.2), (top + 0.35) / 2 - 0.05, z, 0.4, top + 0.45, tread + 0.02, { skip: ['bottom'] });
        }
    });
    const pts: THREE.Vector3[] = [];
    for (const xx of [x - w / 2, x + w / 2]) {
        pts.push(V(xx, 0, z0), V(xx, rise / 2, z0), V(xx, NIKOLAI_Y, z1 - tread / 2), V(xx, NIKOLAI_Y, z1), V(xx, 0, z1));
    }
    c.hull(pts);
    for (const sx of [-1, 1]) {
        const xx = x + sx * (w / 2 + 0.2);
        const side: THREE.Vector3[] = [];
        for (const dx of [-0.2, 0.2]) side.push(V(xx + dx, 0, z0), V(xx + dx, rise + 0.35, z0), V(xx + dx, NIKOLAI_Y + 0.35, z1), V(xx + dx, 0, z1));
        c.hull(side, true);
    }
}

/**
 * Hele allmenningen som én celle: gjørme, plankegang, kai, torgliv, rådhuset og Nikolaikirken
 * øverst. `x0..x1` langs sjøen og kaifronten i z = `front`. Folkene på torget (torgfolk.ts) eies
 * av cella.
 */
export async function buildAllmenningCell(mats: Materials, x0: number, x1: number, front: number, sides: Sides = {}): Promise<CellContent> {
    const k = new MeshKit();
    const c = new ColliderKit();
    const lod = new MeshKit();
    const w = x1 - x0;
    const xm = w / 2;
    const depth = FRONT_Z + GARD_DEPTH - front;
    const zm = front + depth / 2;
    const r = rng(1429);
    k.matrix = new THREE.Matrix4().makeTranslation(x0, 0, 0);
    lod.matrix = k.matrix.clone();
    c.matrix = k.matrix.clone();

    // Bakken: gjørme over det hele, plankegang opp midten til kirketrappa, og en kort kai ytterst.
    k.box('gjorme', xm, -0.1, zm + 0.6, w, 0.2, depth - 1.2, { skip: ['bottom'] });
    c.box(xm, -0.75, zm, w, 1.5, depth);
    const pz0 = front + 2.7;
    const pz1 = KTRAPP.z0 + 0.05;
    k.withTint({ top: 0.85, bottom: 0.85 }, () => k.box('gardsrom', xm, -0.02, (pz0 + pz1) / 2, 2.2, 0.12, pz1 - pz0, { skip: ['bottom'] }));
    k.withTint({ top: 0.55, bottom: 0.55 }, () => {
        for (const sx of [-1, 1]) k.box('raatre', xm + sx * 1.04, 0.0, (pz0 + pz1) / 2, 0.12, 0.1, pz1 - pz0);
    });
    kai(k, c, 0, w, front, 1.2);
    kaiJog(k, 0, front, sides.west, -1);
    kaiJog(k, w, front, sides.east, 1);
    // Pullerter langs kaikanten og noen tønner som venter på å bli dratt opp.
    for (const x of [2.5, 13.5]) {
        k.withTint({ top: 0.7, bottom: 0.7 }, () => k.log('raatre', V(x, -0.1, front + 0.45), V(x, 0.55, front + 0.45), 0.17, 8, true, 0.15));
        c.box(x, 0.25, front + 0.45, 0.32, 0.6, 0.32, true);
    }
    for (const [x, z, t] of [[3.4, 2.6, 0.9], [4.1, 3.2, 0.8], [15.2, 2.4, 0.95]] as const) tonne(k, c, x, z, t);

    // Sporene etter sleder og kjerrer, og pytter der regnet blir stående [S].
    spor(k, 6.1, front + 1.6, 56, 0.8, 1);
    spor(k, RAD.x0 + RAD.w / 2, front + 1.6, RAD.z0 - 0.4, 0.8, 4);
    for (const [x, z, rr] of [[5.2, 9.5, 0.7], [13.0, 17.0, 0.55], [6.6, 31.5, 0.8], [11.4, 47.5, 0.6], [4.4, 54.5, 0.5]] as const) pytt(k, x, z, rr);

    // Bodene: langs vestsida, og to øverst der torget trolig var [V Wikipedia, «trolig»].
    const motOst = -Math.PI / 2;
    const motVest = Math.PI / 2;
    bod(k, c, 1.9, 12.5, motOst, 'fisk', r);
    bod(k, c, 1.9, 19.5, motOst, 'korn', r);
    bod(k, c, 1.9, 48.5, motOst, 'kurver', r);
    bod(k, c, 15.6, 50.5, motVest, 'tonner', r);
    bronn(k, c, 4.2, 37);
    slede(k, c, 6.1, 24, 0.06);

    // Rådhuset går i allmenningens egne bøtter, som nabogårdene: få tegnekall for hele cella.
    radhus(k, c, lod, mats, x0);
    kirketrapp(k, c);

    const near = toGroup(k, mats, 'allmenning');
    // Nikolaikirken: tårnet mot Holmen, sørportalen rett over kirketrappa.
    const kirke = buildNikolaikirken(mats, {
        ox: x0 + KTRAPP.x + PORTAL_Z,
        oz: MUR_Z + 8,
        murZ: MUR_Z,
        x0: x0 - 14,
        x1: x1 + 14,
        gap: [x0 + KTRAPP.x - KTRAPP.w / 2 - 0.4, x0 + KTRAPP.x + KTRAPP.w / 2 + 0.4],
    });
    near.add(kirke.near);
    const mid = new THREE.Group();
    const lodMesh = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial());
    lodMesh.name = 'allmenning:lod';
    mid.add(lodMesh, kirke.mid);
    const folk = await lagFolk(torgPlasser(x0), mats, 1470, torgRuter(x0));
    near.add(folk.group);
    return {
        near, mid, colliders: [...c.specs, ...kirke.colliders, ...folk.colliders],
        gaaende: folk.gaaende, snakkbare: folk.snakkbare, tick: folk.tick, dispose: folk.dispose,
    };
}
