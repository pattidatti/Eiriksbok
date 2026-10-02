// Nikolaikirken: steinkirka øverst på Nikolaikirkeallmenningen.
//
// Det vi vet: kirken var av stein, romansk, reist i 1120- og 1130-årene og nevnt første gang 1160
// [V Byleksikon]. Den sto i bakken over Bryggen, mellom allmenningen og Lindebergsmuget, på langs
// av Øvregaten [V Wikipedia]. Grunnplanen var trolig rektangulær med ett skip og et stort vesttårn
// like bredt som skipet [V Wikipedia, «trolig»]. Tårnet hadde byklokka og brannvakta etter bylova
// av 1276 [V Wikipedia]. Kirken ble trolig skadet i brannene 1198 og 1248, og «sannsynligvis
// skadet eller ødelagt ved bybrannen 1413 og igjen 1476» [V Byleksikon]. Rundt 1580 var den en
// ruin med et dominerende steintårn [V Byleksikon; stikket er Scholeus' fra ca. 1580, Wikipedia].
//
// Om den var i bruk i 1420-årene, vet vi ikke [U]. At den kunne ødelegges «igjen» i 1476, tyder på
// at noe sto eller var satt i stand etter 1413, så her er den under reparasjon [S]: tårnet står
// med nytt tak (byklokka og brannvakta trengtes), den vestre delen av skipet har fått nytt tak, og
// over den østre står bare sperrene, med sot på murkronene og stillas langs sørveggen. Målene er
// valgt for spillet [S]; de er ikke funnet [K].
//
// Kirkens eget rom, som Mariakirken: x på tvers (-x er sørsida, mot allmenningen), z fra
// vestfronten av tårnet (z = 0) mot øst, y opp fra kirkegården. Kirken lå på langs av Øvregaten,
// og vest er mot Holmen, så tårnet står mot +x i verden [S: utledet, ikke målt].
import * as THREE from 'three';
import { ColliderKit, MeshKit, type Tint } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import { LIST, STEIN, TAK, apning, gesims, paFlate } from './stein';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Kirkegården ligger så høyt over allmenningen: bakken stiger mot Øvregaten [S]. */
export const NIKOLAI_Y = 2.0;
// Mål i kirkens rom (meter) [S].
const TARN = { hw: 4, z1: 8, h: 21, tak: 6 };
const SKIP = { z0: 8, z1: 26, hw: 4, h: 9.5, pitch: 0.95, mur: 0.9 };
/** Nytt tak fra tårnet og hit. Østover står bare sperrene. */
const NYTT_TIL = 16;
/** Sørportalen, midt mot allmenningen (z i kirkens rom). */
export const PORTAL_Z = 12.5;
const SOT_H = 2.6;
const SOTET: Tint = { top: 0.4, bottom: 0.62, hue: [0.9, 0.9, 0.93] };
const NYTT: Tint = { top: 1.12, bottom: 1.12, hue: [1.08, 1.0, 0.9] };
const BRENT: Tint = { top: 0.28, bottom: 0.28 };

/** Takplate på én side av et saltak langs z, fra `z0` til `z1`. */
function takside(k: MeshKit, side: -1 | 1, hw: number, eave: number, pitch: number, z0: number, z1: number, th = 0.16): void {
    const over = 0.45;
    const a = Math.atan(pitch);
    const rise = hw * pitch;
    const len = (hw + over) / Math.cos(a);
    const m = new THREE.Matrix4()
        .makeRotationZ(-side * a)
        .setPosition((side * (hw + over)) / 2, (eave + rise + eave - over * pitch) / 2 + th / 2, (z0 + z1) / 2);
    k.slab('bordtak', m, len, th, z1 - z0, { grain: 'x' });
}

/** Tårnet i vest, med lydglugger øverst og nytt tak. */
function tarn(k: MeshKit): void {
    const w = TARN.hw * 2;
    const cz = TARN.z1 / 2;
    k.withTint(STEIN, () => k.box('stein', 0, TARN.h / 2, cz, w, TARN.h, TARN.z1, { skip: ['bottom'], shadeFoot: true }));
    // Sotet bånd der skipets tak brant inntil tårnet.
    k.withTint(SOTET, () => k.box('stein', 0, SKIP.h + 2, TARN.z1 + 0.02, w - 0.2, 4.2, 0.04));
    for (const y of [SKIP.h, 15]) gesims(k, 0, cz, w, TARN.z1, y, 0.12);
    gesims(k, 0, cz, w, TARN.z1, TARN.h, 0.26);
    for (const f of ['nz', 'nx', 'px', 'pz'] as const) {
        paFlate(k, f, 0, cz, TARN.hw, cz, () => {
            for (const u of [-1.5, 1.5]) apning(k, u, 17.2, 0.9, 2.3);
            if (f === 'nx' || f === 'px') apning(k, 0, 11.2, 0.45, 1.3);
        });
    }
    // Vestportalen mot Holmen og et vindu over.
    paFlate(k, 'nz', 0, cz, TARN.hw, cz, () => {
        k.withTint(LIST, () => k.box('stein', 0, 2.2, 0.18, 3.2, 4.4, 0.36, { skip: ['bottom'] }));
        k.at(0, 0, 0.36, 0, () => apning(k, 0, 0, 1.6, 2.6));
        apning(k, 0, 7.4, 0.9, 1.4);
    });
    // Nytt pyramidetak av bord: lysere enn det gamle [S]. Formen på tårntaket er ikke funnet [K].
    const h = TARN.hw + 0.35;
    const y = TARN.h + 0.15;
    const top = V(0, y + TARN.tak, cz);
    const hj = [V(-h, y, cz - h), V(h, y, cz - h), V(h, y, cz + h), V(-h, y, cz + h)];
    const slant = Math.hypot(h, TARN.tak);
    k.withTint(NYTT, () => {
        for (let i = 0; i < 4; i++) k.tri('bordtak', hj[(i + 1) % 4], hj[i], top, [h * 2, 0], [0, 0], [h, slant]);
        k.log('raatre', top.clone().setY(y + TARN.tak - 0.3), top.clone().setY(y + TARN.tak + 1.2), 0.06, 5);
    });
}

/** Skipet: murene med sot øverst, nytt tak i vest og bare sperrer i øst. */
function skip(k: MeshKit): void {
    const sz = SKIP.z1 - SKIP.z0;
    const szc = (SKIP.z0 + SKIP.z1) / 2;
    const hw = SKIP.hw;
    const lav = SKIP.h - SOT_H;
    k.withTint(STEIN, () => k.box('stein', 0, lav / 2, szc, hw * 2, lav, sz, { skip: ['bottom', 'nz'], shadeFoot: true }));
    // Murkronen over: fire murer uten lokk, så det brente skipet er hult ovenfra.
    const t = SKIP.mur;
    k.withTint(SOTET, () => {
        for (const sx of [-1, 1]) k.box('stein', sx * (hw - t / 2), lav + SOT_H / 2, szc, t, SOT_H, sz, { skip: ['bottom'] });
        k.box('stein', 0, lav + SOT_H / 2, SKIP.z1 - t / 2, hw * 2 - t * 2, SOT_H, t, { skip: ['bottom'] });
    });
    // Østgavlen: sotet stein, en trekant ut og en inn.
    const rise = hw * SKIP.pitch;
    k.withTint(SOTET, () => {
        k.tri('stein', V(hw, SKIP.h, SKIP.z1), V(-hw, SKIP.h, SKIP.z1), V(0, SKIP.h + rise, SKIP.z1), [hw, 0], [-hw, 0], [0, rise]);
        k.tri('stein', V(-hw, SKIP.h, SKIP.z1 - t), V(hw, SKIP.h, SKIP.z1 - t), V(0, SKIP.h + rise, SKIP.z1 - t), [-hw, 0], [hw, 0], [0, rise]);
    });
    gesims(k, 0, szc, hw * 2, sz, SKIP.h - 0.1, 0.16);

    // Nytt tak i vest: lyse bord rett fra sagbukken.
    k.withTint(NYTT, () => {
        for (const side of [-1, 1] as const) takside(k, side, hw + 0.1, SKIP.h, SKIP.pitch, SKIP.z0 - 0.2, NYTT_TIL);
    });
    // Sperrene over den brente delen: noen nye og lyse, noen svidde som ble stående [S].
    const a = Math.atan(SKIP.pitch);
    const sl = hw / Math.cos(a) + 0.25;
    let i = 0;
    for (let z = NYTT_TIL + 0.5; z < SKIP.z1 - 0.6; z += 0.95, i++) {
        const tint = i % 3 === 2 ? BRENT : NYTT;
        // De østligste sperrene mangler: der har ikke tømmermennene kommet ennå.
        if (z > SKIP.z1 - 3.2 && i % 2 === 1) continue;
        k.withTint(tint, () => {
            for (const side of [-1, 1] as const) {
                const m = new THREE.Matrix4().makeRotationZ(-side * a).setPosition((side * hw) / 2, SKIP.h + rise / 2 + 0.1, z);
                k.slab('raatre', m, sl, 0.16, 0.12);
            }
            k.box('raatre', 0, SKIP.h + rise * 0.55, z, hw * 0.95, 0.12, 0.1);
        });
    }
    // Mønsåsen ligger allerede over hele skipet.
    k.withTint(NYTT, () => k.box('raatre', 0, SKIP.h + rise + 0.05, (NYTT_TIL + SKIP.z1) / 2, 0.16, 0.16, SKIP.z1 - NYTT_TIL));

    // Romanske vinduer høyt oppe og sørportalen mot allmenningen [S: plassering].
    paFlate(k, 'nx', 0, szc, hw, sz / 2, () => {
        for (const z of [9.7, 15.5, 19.5, 23.5]) apning(k, z - szc, 5.2, 0.8, 1.5);
        k.withTint(LIST, () => k.box('stein', PORTAL_Z - szc, 1.9, 0.18, 2.8, 3.8, 0.36, { skip: ['bottom'] }));
        k.at(0, 0, 0.36, 0, () => apning(k, PORTAL_Z - szc, 0, 1.4, 2.3));
    });
    paFlate(k, 'px', 0, szc, hw, sz / 2, () => {
        for (const z of [11, 17, 23]) apning(k, szc - z, 5.2, 0.8, 1.5);
    });
}

/**
 * Stillaset langs sørveggen der skipet brant: én rad stolper, losholter ned i hull i muren og
 * plankelag i tre høyder, med en stige opp. Slik stillas er kjent fra middelalderens steinbygg,
 * men akkurat dette er et valg [S].
 */
function stillas(k: MeshKit): void {
    const x = -SKIP.hw - 1.25;
    const z0 = NYTT_TIL - 1;
    const z1 = SKIP.z1 + 0.3;
    const stolper: number[] = [];
    for (let z = z0; z <= z1 + 0.01; z += (z1 - z0) / 4) stolper.push(z);
    k.withTint({ top: 0.9, bottom: 0.9, hue: [1.04, 0.98, 0.9] }, () => {
        for (const z of stolper) k.log('raatre', V(x, -0.2, z), V(x + 0.05, 11.2, z), 0.08, 6, true, 0.06);
        for (const y of [3, 6, 9]) {
            k.log('raatre', V(x, y, z0 - 0.3), V(x, y, z1 + 0.3), 0.06, 5);
            for (const z of stolper) k.box('raatre', x + 0.7, y + 0.06, z + 0.12, 1.6, 0.1, 0.1);
        }
        // Skråstag så stillaset ikke vrir seg.
        for (let i = 0; i + 1 < stolper.length; i += 2) k.log('raatre', V(x - 0.05, 0.3, stolper[i]), V(x - 0.05, 5.8, stolper[i + 1]), 0.05, 5);
    });
    k.withTint(NYTT, () => {
        for (const y of [3, 6, 9]) k.box('raatre', x + 0.62, y + 0.14, (z0 + z1) / 2, 1.2, 0.05, z1 - z0 + 0.4, { grain: 'z' });
    });
    // Stigen: to vanger og trinn, lent mot det nederste plankelaget.
    const sz = (stolper[1] + stolper[2]) / 2;
    const bot = V(x - 1.0, 0, sz);
    const top = V(x - 0.05, 3.5, sz);
    k.withTint({ top: 0.75, bottom: 0.75 }, () => {
        for (const dz of [-0.22, 0.22]) k.log('raatre', bot.clone().setZ(sz + dz), top.clone().setZ(sz + dz), 0.04, 5);
        for (let f = 0.08; f < 0.95; f += 0.085) {
            const p = bot.clone().lerp(top, f);
            k.box('raatre', p.x, p.y, sz, 0.05, 0.05, 0.44);
        }
    });
}

/** Byggeplassen nedenfor: hogd stein, et mørtelkar og svidde bjelker som er tatt ned. */
function byggeplass(k: MeshKit): void {
    const x = -SKIP.hw - 2.4;
    k.withTint({ top: 1.15, bottom: 0.95, hue: [0.95, 0.98, 0.96] }, () => {
        for (let i = 0; i < 7; i++) {
            const row = i < 4 ? 0 : 1;
            const along = row === 0 ? i * 0.62 : (i - 4) * 0.62 + 0.3;
            k.box('stein', x - 0.1 * row, 0.2 + row * 0.4, SKIP.z0 + 1.2 + along, 0.5, 0.4, 0.58);
        }
    });
    // Mørtelkaret: en lav kasse av bord med grå kalkmørtel i.
    k.withTint({ top: 0.7, bottom: 0.7 }, () => k.box('raatre', x + 0.1, 0.2, SKIP.z0 + 5.4, 0.8, 0.4, 1.4));
    k.withTint({ top: 1.4, bottom: 1.4, hue: [0.95, 0.95, 0.93] }, () => k.box('stein', x + 0.1, 0.37, SKIP.z0 + 5.4, 0.66, 0.04, 1.26));
    k.withTint(BRENT, () => {
        for (let i = 0; i < 4; i++) k.log('raatre', V(x - 0.3 + (i % 2) * 0.3, 0.14 + Math.floor(i / 2) * 0.26, SKIP.z1 - 6.5), V(x - 0.2 + (i % 2) * 0.3, 0.14 + Math.floor(i / 2) * 0.26, SKIP.z1 - 0.8), 0.13, 6);
    });
}

/** Middels nivå: tårn og skip som bokser, tårntaket og det nye taket. */
function kirkeLod(k: MeshKit, lod: (key: 'stein' | 'bordtak') => THREE.Color): void {
    const f = (c: THREE.Color, s = 1): Tint => ({ top: 1, bottom: 1, hue: [c.r * s, c.g * s, c.b * s] });
    k.withTint(f(lod('stein')), () => {
        k.box('mork', 0, TARN.h / 2, TARN.z1 / 2, TARN.hw * 2, TARN.h, TARN.z1, { skip: ['bottom'] });
        k.box('mork', 0, SKIP.h / 2, (SKIP.z0 + SKIP.z1) / 2, SKIP.hw * 2, SKIP.h, SKIP.z1 - SKIP.z0, { skip: ['bottom'] });
    });
    k.withTint(f(lod('bordtak'), TAK.top * 1.4), () => {
        const hw = SKIP.hw;
        const r = hw * SKIP.pitch;
        k.quad('mork', V(hw, SKIP.h, SKIP.z0), V(-hw, r, 0), V(0, 0, NYTT_TIL - SKIP.z0));
        k.quad('mork', V(-hw, SKIP.h, NYTT_TIL), V(hw, r, 0), V(0, 0, SKIP.z0 - NYTT_TIL));
        const top = V(0, TARN.h + TARN.tak, TARN.z1 / 2);
        const h = TARN.hw;
        const c = [V(-h, TARN.h, 0), V(h, TARN.h, 0), V(h, TARN.h, TARN.z1), V(-h, TARN.h, TARN.z1)];
        for (let i = 0; i < 4; i++) k.tri('mork', c[(i + 1) % 4], c[i], top, [0, 0], [0, 0], [0, 0]);
    });
}

export interface KirkeOpts {
    /** Vestfronten av tårnet (x) og midtlinja av skipet (z) i verden. */
    ox: number;
    oz: number;
    /** Forkanten av kirkegårdsmuren mot Øvregaten, og åpningen med grinda (rett over kirketrappa). */
    murZ: number;
    x0: number;
    x1: number;
    gap: [number, number];
}

/**
 * Kirken på kirkegården, muren mot Øvregaten og en stengt grind. Kirkegården ligger bak grensa for
 * det spilleren kan gå på, så bare muren og grinda kolliderer. Én MeshKit for alt, med materialene
 * med tynnere tåke: tårnet er et landemerke.
 */
export function buildNikolaikirken(mats: Materials, o: KirkeOpts): { near: THREE.Group; mid: THREE.Mesh; colliders: ColliderKit['specs'] } {
    const k = new MeshKit();
    const c = new ColliderKit();
    const lod = new MeshKit();
    const ROT = -Math.PI / 2; // kirkens +z (østover) peker mot -x i verden, sørsida mot -z
    k.at(o.ox, NIKOLAI_Y, o.oz, ROT, () => {
        tarn(k);
        skip(k);
        stillas(k);
        byggeplass(k);
    });
    lod.at(o.ox, NIKOLAI_Y, o.oz, ROT, () => kirkeLod(lod, (key) => mats.lodColor(key)));

    // Kirkegården: torv på samme høyde som gata, gjørme langs sørveggen der det bygges.
    const z1 = o.oz + 14;
    const xm = (o.x0 + o.x1) / 2;
    const w = o.x1 - o.x0;
    k.withTint({ top: 0.8, bottom: 0.8, hue: [0.95, 1, 0.9] }, () =>
        k.box('torv', xm, NIKOLAI_Y / 2 - 0.5, (o.murZ + z1) / 2, w, NIKOLAI_Y + 1, z1 - o.murZ, { skip: ['bottom', 'nz'] })
    );
    const sor = o.oz - SKIP.hw;
    k.withTint({ top: 0.75, bottom: 0.75 }, () =>
        k.box('gjorme', o.ox - (SKIP.z0 + SKIP.z1) / 2, NIKOLAI_Y + 0.01, sor - 1.6, SKIP.z1 - SKIP.z0 + 6, 0.04, 3.4, { skip: ['bottom'] })
    );
    // Den lave muren langs gata, i to deler rundt grinda, og en terskel under grinda.
    const murY0 = NIKOLAI_Y - 0.4;
    const murTop = NIKOLAI_Y + 0.9;
    const mur = (a: number, b: number, top: number) =>
        k.withTint(STEIN, () => k.box('stein', (a + b) / 2, (murY0 + top) / 2, o.murZ + 0.35, b - a, top - murY0, 0.7, { skip: ['bottom'], shadeFoot: true }));
    mur(o.x0, o.gap[0], murTop);
    mur(o.gap[1], o.x1, murTop);
    mur(o.gap[0], o.gap[1], NIKOLAI_Y + 0.05);
    k.withTint(LIST, () => {
        for (const [a, b] of [[o.x0, o.gap[0]], [o.gap[1], o.x1]]) k.box('stein', (a + b) / 2, murTop + 0.05, o.murZ + 0.35, b - a + 0.1, 0.1, 0.8);
        for (const x of o.gap) k.box('stein', x, (murY0 + murTop + 0.5) / 2, o.murZ + 0.35, 0.6, murTop + 0.5 - murY0, 0.8, { skip: ['bottom'] });
    });
    c.box(xm, (murY0 + murTop + 0.6) / 2, o.murZ + 0.35, w, murTop + 0.6 - murY0, 0.7);
    // Grinda: stengt mens kirken repareres [S].
    const gw = o.gap[1] - o.gap[0] - 0.6;
    const gx = (o.gap[0] + o.gap[1]) / 2;
    k.withTint({ top: 0.8, bottom: 0.8, hue: [1.04, 0.98, 0.9] }, () => {
        for (let x = gx - gw / 2 + 0.08; x < gx + gw / 2; x += 0.2) k.box('raatre', x, NIKOLAI_Y + 0.75, o.murZ + 0.4, 0.12, 1.5, 0.05);
        for (const y of [0.35, 1.2]) k.box('raatre', gx, NIKOLAI_Y + y, o.murZ + 0.45, gw, 0.12, 0.06);
    });

    const near = new THREE.Group();
    near.name = 'nikolaikirken';
    for (const [key, b] of k.buckets) {
        const mesh = new THREE.Mesh(b.toGeometry(), mats.tynnTake(key));
        mesh.name = `nikolaikirken:${key}`;
        mesh.castShadow = key !== 'torv' && key !== 'gjorme';
        mesh.receiveShadow = true;
        near.add(mesh);
    }
    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.tynnTake('lod'));
    mid.name = 'nikolaikirken:lod';
    return { near, mid, colliders: c.specs };
}
