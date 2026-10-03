// Stranden: den andre siden av Vågen, sett fra Bryggen som lave hus i tåka.
//
// Det vi vet: Bylova av 1276 satte av Strandsiden til å sette opp skip og til å selge varer som
// tar plass, som tømmer og kvernstein, og kongen regnet stranda som sin [V Wikipedia
// «Strandsiden», Byleksikon]. Etter 1300 ble det så trangt på Bryggen og i Vågsbunnen at husene
// spredte seg dit [V]. Det var de norske borgernes side [V grovt, §5.2]. Senere sto gårdene på
// bolverk et stykke ut i sjøen med båter fortøyd imellom [V], men det gjelder for det meste
// 1500-tallet. Hvordan stranda så ut i 1420-årene, er ikke funnet [K].
//
// Derfor er den glissen her [S]: grupper av lave laftehus i én eller to etasjer med torvtak, naust
// med gavlen mot sjøen, stabler av tømmer og et skip som bygges på stokker, med tomme strender
// imellom. Lavere og enklere enn Bryggen. Alt er trukket fra et frø, så rekka er lik hver gang.
//
// Den står som én celle langs hele motsatt side av Vågen, bak grensa båten ikke kommer forbi.
// Cella lastes fra Vågen og er borte fra kaia, der den vanlige tåka skjuler den uansett. Nær
// (innen 70 m): laft, torv og råtre, tre tegnekall. Ellers middels nivå i flat farge, ett tegnekall.
// Ingen kollidere.
import * as THREE from 'three';
import { MeshKit, type MatKey, type Tint } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellDef } from '../motor/streaming';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Strandkanten (z): rett bak grensa ved z = -120 som stopper båten [S]. */
export const STRAND_Z = -122;
const BAKKE = 0.3;
const DYBDE = 40;

type Del = 'vegg' | 'tak' | 'tre';
const KEY: Record<Del, MatKey> = { vegg: 'laft', tak: 'torv', tre: 'raatre' };

interface Pensel {
    k: MeshKit;
    fjern: boolean;
    farge: Record<Del, THREE.Color>;
    /** Den gåbare biten (strandliv.ts): ingenting bygges der. */
    hull?: [number, number];
}

/** Står noe fra `a` til `b` langs x i den gåbare biten? */
const iHull = (p: Pensel, a: number, b: number) => !!p.hull && b > p.hull[0] - 1 && a < p.hull[1] + 1;

function mal(p: Pensel, del: Del, t: Tint, fn: (key: MatKey) => void): void {
    if (!p.fjern) {
        p.k.withTint(t, () => fn(KEY[del]));
        return;
    }
    const c = p.farge[del];
    const h = t.hue ?? [1, 1, 1];
    p.k.withTint({ top: t.top, bottom: t.bottom, hue: [c.r * h[0], c.g * h[1], c.b * h[2]] }, () => fn('mork'));
}

/** Et frø: samme rekke hver gang. */
function lagRng(seed: number): () => number {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * Et hus med gavlen mot sjøen. Husets rom: x på tvers, z fra framgavlen (z = 0) og innover, og
 * rotasjonen π snur det så framgavlen vender mot Vågen (+z i verden).
 */
function hus(p: Pensel, x: number, z: number, rot: number, b: number, l: number, eave: number, pitch: number, tone: Tint, naust: boolean): void {
    const k = p.k;
    if (iHull(p, x - b / 2 - 0.5, x + b / 2 + 0.5)) return;
    k.at(x, BAKKE, z, Math.PI + rot, () => {
        mal(p, 'vegg', tone, (key) => k.box(key, 0, eave / 2 - 0.25, l / 2, b, eave + 0.5, l, { skip: ['bottom'], shadeFoot: true }));
        const hw = b / 2;
        const rise = hw * pitch;
        const s = [tone.top, tone.top, tone.top] as [number, number, number];
        mal(p, 'vegg', tone, (key) => {
            // Rekkefølgen gir normalen ut fra huset: −z på framgavlen, +z bak.
            k.tri(key, V(hw, eave, 0), V(-hw, eave, 0), V(0, eave + rise, 0), [hw, eave], [-hw, eave], [0, eave + rise], s);
            k.tri(key, V(-hw, eave, l), V(hw, eave, l), V(0, eave + rise, l), [-hw, eave], [hw, eave], [0, eave + rise], s);
        });
        // Torvtaket: tykt, og litt ut over veggene.
        const a = Math.atan(pitch);
        const raft = 0.35;
        const th = 0.32;
        mal(p, 'tak', { top: 0.85, bottom: 0.85 }, (key) => {
            for (const side of [-1, 1]) {
                const m = new THREE.Matrix4().makeRotationZ(-side * a).setPosition((side * (hw + raft)) / 2, (eave + rise + eave - raft * pitch) / 2 + th / 2, l / 2);
                k.slab(key, m, (hw + raft) / Math.cos(a), th, l + 0.5, { grain: 'x' });
            }
        });
        if (p.fjern) return;
        // Vindskier langs gavlen og mønsåsen ut over gavlen.
        mal(p, 'tre', { top: 0.7, bottom: 0.7 }, (key) => {
            for (const zz of [-0.25, l + 0.25]) {
                for (const side of [-1, 1]) k.log(key, V(side * (hw + raft), eave - raft * pitch, zz), V(0, eave + rise + 0.25, zz), 0.07, 4, false);
            }
        });
        // Døra (naustet: den store porten) som en mørk flate på framgavlen.
        // `quad` leser ikke `tint.top`, så mørket går inn som skygge per hjørne.
        {
            const w = naust ? b * 0.62 : 1.0;
            const h = naust ? Math.min(eave + rise * 0.4, 3.2) : 1.8;
            const u = naust ? 0 : -hw * 0.35;
            k.quad('laft', V(u + w / 2, 0, -0.03), V(-w, 0, 0), V(0, h, 0), [0, 0], [0.12, 0.12]);
        }
    });
}

/** Tømmer stablet på stranda: stokker langs x på tverrligger [V tømmerhandel, S stabelen]. */
function tommer(p: Pensel, x: number, z: number, len: number, lag: number, rng: () => number): void {
    const k = p.k;
    if (iHull(p, x - len / 2 - 0.5, x + len / 2 + 0.5)) return;
    if (p.fjern) {
        mal(p, 'tre', { top: 0.9, bottom: 0.9 }, (key) => k.box(key, x, BAKKE + lag * 0.18, z, len, lag * 0.36, 2.2, { skip: ['bottom'] }));
        return;
    }
    mal(p, 'tre', { top: 0.95, bottom: 0.95, hue: [1.05, 0.98, 0.9] }, (key) => {
        for (let j = 0; j < lag; j++) {
            const n = 6 - j;
            for (let i = 0; i < n; i++) {
                const zz = z - (n - 1) * 0.2 + i * 0.4;
                const y = BAKKE + 0.2 + j * 0.34;
                const dx = (rng() - 0.5) * 0.6;
                k.log(key, V(x - len / 2 + dx, y, zz), V(x + len / 2 + dx, y, zz), 0.18, 5, true, 0.16);
            }
        }
    });
}

/** Et skip på stokker: kjølen, stevnene og noen spant. Bylova satte av stranda til dette [V]. */
function skipPaStokker(p: Pensel, x: number, z: number): void {
    const k = p.k;
    const L = 16;
    const y = BAKKE + 0.7;
    if (iHull(p, x - L / 2 - 2, x + L / 2 + 2)) return;
    if (p.fjern) {
        mal(p, 'tre', { top: 0.8, bottom: 0.8 }, (key) => {
            k.box(key, x, y, z, L, 0.3, 0.3, { skip: ['bottom'] });
            for (let i = -3; i <= 3; i++) k.box(key, x + i * 2, y + 1.2, z, 0.25, 2.4, 4.2 - Math.abs(i) * 0.45, { skip: ['bottom'] });
        });
        return;
    }
    mal(p, 'tre', { top: 0.9, bottom: 0.9, hue: [1.06, 1.0, 0.9] }, (key) => {
        // Stokkene kjølen hviler på.
        for (let i = -3; i <= 3; i++) k.box(key, x + i * 2.3, BAKKE + 0.25, z, 0.35, 0.5, 2.0, { skip: ['bottom'] });
        k.log(key, V(x - L / 2, y, z), V(x + L / 2, y, z), 0.17, 6);
        // Stevnene: bratte stokker opp i hver ende.
        for (const s of [-1, 1]) k.log(key, V(x + s * (L / 2 - 0.3), y, z), V(x + s * (L / 2 + 1.4), y + 3.6, z), 0.14, 6);
        // Spantene: bunn og to sider, smalere mot endene.
        for (let i = -3; i <= 3; i++) {
            const sx = x + i * 2;
            const w = 2.1 - Math.abs(i) * 0.22;
            const h = 2.4 - Math.abs(i) * 0.12;
            k.log(key, V(sx, y + 0.15, z - w * 0.55), V(sx, y + 0.15, z + w * 0.55), 0.09, 4);
            for (const s of [-1, 1]) k.log(key, V(sx, y + 0.1, z + s * w * 0.5), V(sx, y + h, z + s * w), 0.09, 4);
        }
        // De nederste bordgangene er lagt på [S].
        for (const s of [-1, 1]) {
            for (const [hy, ut] of [[0.6, 0.62], [1.1, 0.78]]) {
                k.log(key, V(x - L / 2 + 1.5, y + hy * 0.6, z + s * ut * 0.9), V(x + L / 2 - 1.5, y + hy * 0.6, z + s * ut * 0.9), 0.06, 4, false);
                k.log(key, V(x - L / 2 + 1, y + hy, z + s * ut * 1.5), V(x + L / 2 - 1, y + hy, z + s * ut * 1.5), 0.08, 4, false);
            }
        }
    });
}

/** Rekka langs stranda fra `x0` til `x1`, trukket fra frøet. `hull` er den gåbare biten (strandliv.ts), som hoppes over. */
function stranda(p: Pensel, x0: number, x1: number, hull?: [number, number]): void {
    const rng = lagRng(1429);
    const k = p.k;
    p.hull = hull;
    // Bakken: jord og gress, med en kant av stein og jord ned mot sjøen.
    const bakke = (a: number, b: number) => mal(p, 'tak', { top: 0.6, bottom: 0.45, hue: [0.9, 0.85, 0.75] }, (key) =>
        k.box(key, (a + b) / 2, BAKKE / 2 - 2, STRAND_Z - DYBDE / 2, b - a, BAKKE + 4, DYBDE, { skip: ['bottom'], shadeFoot: true })
    );
    if (hull) {
        bakke(x0, hull[0]);
        bakke(hull[1], x1);
    } else bakke(x0, x1);
    let skipBygd = false;
    let x = x0 + 4;
    while (x < x1 - 8) {
        const r = rng();
        // Gråværet tre: mørkere og gråere enn bryggehusene [S].
        const tone: Tint = { top: 0.6 + rng() * 0.3, bottom: 0.5, hue: [0.88, 0.9 + rng() * 0.05, 0.8 + rng() * 0.06] };
        if (r < 0.22) {
            // Tom strand.
            x += 6 + rng() * 14;
        } else if (r < 0.45) {
            // Ett eller to naust ved vannkanten.
            const n = rng() < 0.5 ? 1 : 2;
            for (let i = 0; i < n; i++) {
                const b = 5 + rng() * 2;
                hus(p, x + b / 2, STRAND_Z + 0.6, (rng() - 0.5) * 0.12, b, 8 + rng() * 3, 1.9 + rng() * 0.5, 0.95, tone, true);
                x += b + 0.8;
            }
            x += 3 + rng() * 5;
        } else if (r < 0.82) {
            // En gård: et hus ved sjøen og ett eller to bak, lave og enkle.
            const b = 6 + rng() * 2.5;
            const l = 7 + rng() * 4;
            const to = rng() < 0.4;
            hus(p, x + b / 2, STRAND_Z - 1 - rng() * 2, (rng() - 0.5) * 0.15, b, l, to ? 4.6 : 2.6 + rng() * 0.6, 0.6, tone, false);
            const bak = 1 + Math.floor(rng() * 2);
            for (let i = 0; i < bak; i++) {
                const bb = 5 + rng() * 2;
                hus(p, x + bb / 2 + (rng() - 0.3) * 3, STRAND_Z - l - 3 - i * 9, (rng() - 0.5) * 0.2, bb, 6 + rng() * 2, 2.4 + rng() * 0.6, 0.6, tone, false);
            }
            x += b + 3 + rng() * 6;
        } else if (!skipBygd && x > x0 + 60) {
            skipPaStokker(p, x + 9, STRAND_Z - 5);
            tommer(p, x + 9, STRAND_Z - 11, 7, 3, rng);
            skipBygd = true;
            x += 22;
        } else {
            tommer(p, x + 4, STRAND_Z - 3 - rng() * 3, 5 + rng() * 3, 2 + Math.floor(rng() * 3), rng);
            x += 10;
        }
    }
}

/** Cella med Stranden fra `x0` til `x1` langs Vågen. */
export function strandCelle(mats: Materials, x0: number, x1: number, hull?: [number, number]): CellDef {
    return {
        id: 'stranden',
        center: new THREE.Vector2((x0 + x1) / 2, STRAND_Z - DYBDE / 2),
        half: new THREE.Vector2((x1 - x0) / 2, DYBDE / 2),
        build: async () => {
            const naer = new MeshKit();
            const mid = new MeshKit();
            const farge: Record<Del, THREE.Color> = { vegg: mats.lodColor('laft'), tak: mats.lodColor('torv'), tre: mats.lodColor('raatre') };
            stranda({ k: naer, fjern: false, farge }, x0, x1, hull);
            stranda({ k: mid, fjern: true, farge }, x0, x1, hull);
            const near = new THREE.Group();
            near.name = 'stranden';
            for (const [key, b] of naer.buckets) {
                const m = new THREE.Mesh(b.toGeometry(), mats.get(key));
                m.name = `stranden:${key}`;
                near.add(m);
            }
            const midMesh = new THREE.Mesh(mid.bucket('mork').toGeometry(), mats.lodMaterial());
            midMesh.name = 'stranden:lod';
            return { near, mid: midMesh, colliders: [] };
        },
    };
}
