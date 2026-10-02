// Veien til Holmen og borggården på Bergenhus: der kaia slutter, fortsetter den forbi de siste
// lagerhusene til porten i ringmuren. Innenfor porten ligger borggården foran Håkonshallen.
//
// Det vi vet [V Byleksikon, se holmen.ts]: Holmen var kongsgården og bispesetet, med ringmur etter
// 1248, Håkonshallen (1247-1261) og kastellet ved sjøen. Høvedsmannen på Bergenhus var kongens
// fremste mann i byen [V blueprint §3]. Det vi ikke vet [K]: hvor porten sto og hvordan den så ut,
// hvordan borggården var lagt, og hva som lå mellom Bryggen og Holmen i 1420-årene. Avstanden er
// komprimert [S], porten, vaktene, skriverboden og lagerhusene ved veien er valgt for spillet [S].
//
// Holmens statiske kulisse (holmen.ts) står fortsatt for steinbyggene. Her er det man går på og
// kolliderer med: bakken, ringmuren og porttårnet, de to trehusene i borggården (bygget av
// modulsettet i stedet for de flate kulissehusene), og en usynlig grense rundt borggården.
import * as THREE from 'three';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellContent, CellDef } from '../motor/streaming';
import { DARK, FRONT_Z, T, WARM, COLD, kai, kaiJog, toGroup, tonne } from './gard';
import { hus, husLod, type HouseSpec } from './moduler';
import { BAKKE, BORG_HUS, HALL, HUS, PORT } from './holmen';
import { lagFolk, type Plass } from './folk';
import type { Rute } from './vandrer';
import { STEIN } from './stein';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Holmen begynner så langt forbi kaienden (Holmens x = 0). Strekningen imellom er veien. */
export const HOLMEN_D = 24;
/** Veien: kaifronten, og grensa innover der lagerhusene står. */
const VEI = { front: 0.3, grense: 31.3 };
/** Borggården i Holmens rom: fra innsida av ringmuren til grensa mot hallen. */
const BORG = { x0: PORT.x + 0.8, x1: 36, z0: -2, z1: 44 };

/** Et lagerhus eller naust ved veien, gavlen mot sjøen [S]. */
function lager(w: number, l: number, floors: number[], roof: 'torv' | 'bordtak', tone: number, hue: [number, number, number]): HouseSpec {
    return {
        w, l, floors, roof, pitch: 0.85, tint: T(tone, hue), cornersFront: true, cornersBack: true, hodeSeg: 5,
        glugger: [{ side: 0, at: 0, floor: floors.length }, { side: 1, at: l / 2, floor: 0 }],
        doors: [{ side: -1, z: 1.4 }],
    };
}

/** Veien fra kaienden til porten: kai foran, gjørme og en plankevei bort til porten. */
async function buildVeiCell(mats: Materials, x0: number, x1: number, vest: number | undefined): Promise<CellContent> {
    const k = new MeshKit();
    const c = new ColliderKit();
    const lod = new MeshKit();
    kai(k, c, x0, x1, VEI.front, FRONT_Z - VEI.front);
    kaiJog(k, x0, VEI.front, vest, -1);
    // Gjørma innover, helt bak lagerhusene (det man ser), og kollider under.
    const z0 = FRONT_Z;
    const z1 = 75;
    k.withTint({ top: 0.7, bottom: 0.7 }, () => k.box('gjorme', (x0 + x1) / 2, -0.06, (z0 + z1) / 2, x1 - x0, 0.1, z1 - z0, { skip: ['bottom'] }));
    c.box((x0 + x1) / 2, -0.75, (z0 + z1) / 2, x1 - x0, 1.5, z1 - z0);
    // Plankeveien på skrå fra kaia bort til rampa foran porten.
    const a = new THREE.Vector2((x0 + x1) / 2 - 3, FRONT_Z);
    const b = new THREE.Vector2(x1 - 3.4, PORT.z);
    const len = a.distanceTo(b) + 1.4;
    k.at((a.x + b.x) / 2, 0, (a.y + b.y) / 2, Math.atan2(b.x - a.x, b.y - a.y), () => {
        k.withTint({ top: 0.85, bottom: 0.85 }, () => k.box('gardsrom', 0, -0.01, 0, 2.4, 0.06, len, { skip: ['bottom'] }));
        k.withTint({ top: 0.55, bottom: 0.55 }, () => {
            for (const s of [-1, 1]) k.box('raatre', s * 1.2, 0.0, 0, 0.14, 0.1, len);
        });
    });
    // Rampa opp til porten: steinheller i trinn, og en jevn kile som kollider.
    const hx = x1;
    k.withTint(STEIN, () => {
        for (let i = 0; i < 3; i++) {
            const h = (BAKKE * (i + 1)) / 3;
            k.box('stein', hx - 3.0 + i * 1.05 + 0.5, h / 2, PORT.z, 1.1, h, PORT.w + 0.6, { skip: ['bottom'] });
        }
    });
    const rampe: THREE.Vector3[] = [];
    for (const z of [PORT.z - PORT.w / 2 - 0.3, PORT.z + PORT.w / 2 + 0.3]) rampe.push(V(hx - 3.2, 0, z), V(hx + PORT.x - PORT.b / 2 + 0.1, BAKKE, z), V(hx + PORT.x - PORT.b / 2 + 0.1, 0, z));
    c.hull(rampe);
    // Lagerhusene innerst, og en usynlig grense langs gavlene.
    const husene: [number, HouseSpec][] = [
        [x0 + 4.5, lager(7, 9, [2.6, 2.3], 'torv', 0.95, WARM)],
        [x0 + 12.4, lager(6, 8, [2.7], 'bordtak', 0.88, COLD)],
        [x0 + 19.6, lager(6.5, 10, [2.6, 2.4], 'torv', 0.92, DARK)],
    ];
    for (const [x, spec] of husene) {
        const m = new THREE.Matrix4().makeTranslation(x, 0, VEI.grense + 0.25);
        k.matrix = m.clone();
        c.matrix = m.clone();
        hus(k, c, spec);
        lod.matrix = m.clone();
        husLod(lod, spec, (key) => mats.lodColor(key));
    }
    k.matrix = new THREE.Matrix4();
    c.matrix = new THREE.Matrix4();
    c.box((x0 + x1) / 2 + 0.6, 3, VEI.grense, x1 - x0 + 1.2, 6, 0.2);
    for (const [x, z, t] of [[x0 + 2.2, 4.1, 0.9], [x0 + 2.9, 4.5, 0.8], [x1 - 6.5, 4.2, 0.95]] as const) tonne(k, c, x, z, t);

    // En svenn fra Kontoret går langs kaia og ser bort mot Holmen [S].
    const ruter: Rute[] = [{
        figur: 'svenn', fart: 0.95, start: 0,
        stopp: [{ p: V(x0 + 1, 0, 2.6), vent: 3, se: Math.PI }, { p: V(x1 - 4.5, 0, 2.6), vent: 5, se: Math.PI / 2 }],
    }];
    const folk = await lagFolk([], mats, 1426, ruter);
    const near = toGroup(k, mats, 'holmenveien');
    near.add(folk.group);
    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial());
    mid.name = 'holmenveien:lod';
    return { near, mid, colliders: [...c.specs, ...folk.colliders], gaaende: folk.gaaende, snakkbare: folk.snakkbare, tick: folk.tick, dispose: folk.dispose, drypp: k.skjegg };
}

/** Skriverboden: et skråtak på fire stolper over en pult, inntil hallen [S]. */
function skriverbu(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    const y = BAKKE;
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
        for (const [dx, dz, h] of [[-1.1, -1.3, 2.3], [-1.1, 1.3, 2.3], [1.1, -1.3, 2.7], [1.1, 1.3, 2.7]] as const) {
            k.log('raatre', V(x + dx, y, z + dz), V(x + dx, y + h, z + dz), 0.07, 6, true);
            c.box(x + dx, y + h / 2, z + dz, 0.14, h, 0.14, true);
        }
    });
    const m = new THREE.Matrix4().makeRotationZ(-0.18).setPosition(x, y + 2.55, z);
    k.withTint({ top: 0.9, bottom: 0.9, hue: DARK }, () => k.slab('bordtak', m, 2.9, 0.06, 3.2, { grain: 'x' }));
    // Pulten med papir, et blekkhorn og en kiste med brev under.
    k.withTint({ top: 0.8, bottom: 0.8, hue: WARM }, () => {
        k.box('raatre', x - 0.5, y + 0.45, z, 0.7, 0.9, 1.3, { skip: ['bottom'] });
        k.box('raatre', x + 0.6, y + 0.22, z - 0.7, 0.5, 0.44, 0.7, { skip: ['bottom'] });
    });
    k.withUv(0.04, () => k.withTint({ top: 1.7, bottom: 1.7, hue: [1.05, 1.0, 0.85] }, () => {
        k.box('raatre', x - 0.5, y + 0.915, z - 0.15, 0.32, 0.01, 0.45);
        k.box('raatre', x - 0.45, y + 0.915, z + 0.35, 0.28, 0.01, 0.36);
    }));
    k.withTint({ top: 0.25, bottom: 0.25 }, () => k.log('raatre', V(x - 0.4, y + 0.9, z + 0.6), V(x - 0.4, y + 1.0, z + 0.6), 0.03, 6, true));
    c.box(x - 0.5, y + 0.45, z, 0.7, 0.9, 1.3);
}

/** Borggården innenfor porten: bakke, ringmur og porttårn, trehusene, hallen og folkene. */
async function buildBorgCell(mats: Materials, hx: number): Promise<CellContent> {
    const k = new MeshKit();
    const c = new ColliderKit();
    const lod = new MeshKit();
    const M = new THREE.Matrix4().makeTranslation(hx, 0, 0);
    k.matrix = M.clone();
    c.matrix = M.clone();
    lod.matrix = M.clone();
    const { x1, z0, z1 } = BORG;
    // Bakken: tråkket gjørme i borggården, og en sti av heller fra porten bort til hallen.
    // Bakken går helt ut til kanten mot veien, så det ikke blir en glipe under porten.
    k.withTint({ top: 0.75, bottom: 0.75, hue: [0.95, 0.95, 0.92] }, () => k.box('gjorme', x1 / 2, BAKKE + 0.02, (z0 + z1) / 2, x1, 0.06, z1 - z0, { skip: ['bottom'] }));
    c.box(18, BAKKE - 0.75, (z0 - 20 + z1) / 2, 36, 1.5, z1 - z0 + 20);
    const sk = V(27.6, 0, 23.0);
    const a = new THREE.Vector2(PORT.x + PORT.b / 2, PORT.z);
    const b = new THREE.Vector2(sk.x - 2.2, sk.z);
    const len = a.distanceTo(b);
    k.at((a.x + b.x) / 2, BAKKE, (a.y + b.y) / 2, Math.atan2(b.x - a.x, b.y - a.y), () => {
        k.withTint({ top: 0.85, bottom: 0.85, hue: [0.97, 0.98, 0.96] }, () => {
            for (let z = -len / 2 + 0.35; z < len / 2; z += 0.72) {
                for (const x of [-0.42, 0.42]) k.box('stein', x + Math.sin(z * 5.1) * 0.05, 0.05, z, 0.78, 0.04, 0.66, { skip: ['bottom'] });
            }
        });
    });
    // Ringmuren og porttårnet: kolliderne (geometrien står i den statiske kulissen).
    const mx = PORT.x;
    const half = PORT.b / 2;
    const p0 = PORT.z - PORT.l / 2;
    const p1 = PORT.z + PORT.l / 2;
    for (const [za, zb] of [[-21, p0], [p1, 70]] as const) c.box(mx, 4, (za + zb) / 2, 1.6, 8, zb - za);
    for (const [za, zb] of [[p0, PORT.z - PORT.w / 2], [PORT.z + PORT.w / 2, p1]] as const) c.box(mx, 4.5, (za + zb) / 2, PORT.b, 9, zb - za);
    c.box(mx, BAKKE + PORT.h + 3, PORT.z, PORT.b, 6, PORT.w);
    // Hallen: en dreid boks.
    c.matrix = M.clone().multiply(new THREE.Matrix4().makeRotationY(HALL.rot).setPosition(HALL.x, 0, HALL.z));
    c.box(0, HALL.eave / 2, 0, HALL.hw * 2, HALL.eave + 1, HALL.hl * 2);
    c.matrix = M.clone();
    // Grensene rundt borggården.
    c.box(x1 + 0.25, 4, (z0 + z1) / 2, 0.5, 8, z1 - z0);
    for (const z of [z0 - 0.25, z1 + 0.25]) c.box((mx + x1) / 2, 4, z, x1 - mx, 8, 0.5);

    // De to trehusene i borggården, bygget av modulsettet (kulissen tegner dem ikke lenger).
    for (const i of BORG_HUS) {
        const [x, z, rot, w, l, eave, torv] = HUS[i];
        const floors = eave > 6 ? [2.8, 2.5, eave - 5.3] : [2.8, eave - 2.8];
        const spec: HouseSpec = {
            w, l, floors, roof: torv ? 'torv' : 'bordtak', pitch: torv ? 0.6 : 0.9, tint: T(0.9, i === 0 ? DARK : WARM),
            cornersFront: true, cornersBack: true, hodeSeg: 5,
            doors: [{ side: 1, z: l / 2 }], glugger: [{ side: 1, at: 2, floor: 1 }, { side: 1, at: l - 2, floor: 1, open: true }, { side: 0, at: 0, floor: floors.length }],
        };
        const m = M.clone().multiply(new THREE.Matrix4().makeRotationY(rot).setPosition(x, BAKKE, z));
        k.matrix = m.clone();
        c.matrix = m.clone();
        hus(k, c, spec);
        lod.matrix = m.clone();
        husLod(lod, spec, (key) => mats.lodColor(key));
    }
    k.matrix = M.clone();
    c.matrix = M.clone();
    skriverbu(k, c, sk.x, sk.z);

    // Folkene: vakta ved porten (utenfor, på bysida), en vakt til innenfor, skriveren ved pulten,
    // og en av kongens menn som går over borggården.
    const P = (x: number, y: number, z: number) => V(hx + x, y, z);
    const VEST = -Math.PI / 2;
    const plasser: Plass[] = [
        { figur: 'vakt', rolle: 'staa', pos: P(mx - half - 0.9, 0, PORT.z - PORT.w / 2 - 0.9), yaw: VEST, id: 'vakta' },
        { figur: 'vakt', rolle: 'staa', pos: P(mx + half + 0.8, BAKKE, PORT.z + PORT.w / 2 + 0.9), yaw: Math.PI },
        { figur: 'skriver', rolle: 'skrive', pos: P(sk.x + 0.25, BAKKE, sk.z), yaw: VEST, id: 'skriveren' },
    ];
    const ruter: Rute[] = [{
        figur: 'vakt', fart: 0.85, start: 0,
        stopp: [{ p: P(8, BAKKE, 28.5), vent: 4, se: Math.PI }, { p: P(24, BAKKE, 29.5), vent: 4, se: Math.PI / 2 }],
    }];
    const folk = await lagFolk(plasser, mats, 1429, ruter);
    const near = toGroup(k, mats, 'bergenhus');
    near.add(folk.group);
    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial());
    mid.name = 'bergenhus:lod';
    return { near, mid, colliders: [...c.specs, ...folk.colliders], gaaende: folk.gaaende, snakkbare: folk.snakkbare, tick: folk.tick, dispose: folk.dispose, drypp: k.skjegg };
}

/**
 * Cellene: veien fra kaienden (`xe`) til Holmen, og borggården. `vest` er kaifronten til den siste
 * gården, så bolverket går rundt hjørnet der kaia hopper.
 */
export function holmenCeller(mats: Materials, xe: number, vest: number | undefined): CellDef[] {
    const hx = xe + HOLMEN_D;
    return [
        {
            id: 'holmenveien',
            center: new THREE.Vector2(xe + HOLMEN_D / 2, 37),
            half: new THREE.Vector2(HOLMEN_D / 2, 38),
            build: () => buildVeiCell(mats, xe, hx, vest),
        },
        {
            id: 'bergenhus',
            center: new THREE.Vector2(hx + (BORG.x0 + BORG.x1) / 2, (BORG.z0 + BORG.z1) / 2),
            half: new THREE.Vector2((BORG.x1 - BORG.x0) / 2 + 3, (BORG.z1 - BORG.z0) / 2),
            build: () => buildBorgCell(mats, hx),
        },
    ];
}
