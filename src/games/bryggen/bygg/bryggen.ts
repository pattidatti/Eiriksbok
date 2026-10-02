// Bryggen-scenen: Vågen, bryggefronten og gårdene som celler som strømmes inn og ut.
//
// Koordinater: x langs sjøen (mot Holmen = +x), z innover fra bolverket (z = 0) mot
// Øvregaten, y opp fra kaidekket. Vågen ligger på -z. Three er høyrehendt: står man i Vågen og
// ser innover mot Bryggen (+z), ligger +x til venstre, slik Holmen gjør i virkeligheten.
//
// Bryggefronten følger 1332-linja: den siste kailinja vi kjenner fra utgravninger før vår tid
// (§5.2). Hvor den lå akkurat i 1420-årene er usikkert [U]. Fronten var ikke rett: hver gård
// fylte ut foran seg selv, så kaia hopper litt fram og tilbake mellom gårdene. Hoppene her er
// valgt for spillet [S]; de eksakte målene venter på utgravningsplanene [K].
import * as THREE from 'three';
import type { Physics } from '../motor/physics';
import { WATER_Y } from '../motor/boat';
import { CellStreamer, type CellContent, type CellDef } from '../motor/streaming';
import { Materials, makeSkyEnvironment } from '../motor/materials';
import { flakk } from '../motor/ild';
import type { GrayboxLayout } from '../graboks/scene';
import { FRONT_Z, GARD_DEPTH, GARD_W, type Sides } from './gard';
import type { GardParams } from './nabogard';

export interface BryggenWorld {
    layout: GrayboxLayout;
    streamer: CellStreamer;
    materials: Materials;
    /** Miljølyset fra himmelen. Bare full kvalitet bruker det. */
    environment: THREE.Texture;
    /**
     * Kalles hvert bilde: flammene lever, ildlyset flyttes til nærmeste ildsted, og svaret sier
     * hvor langt inne i et rom `focus` er (0 ute, 1 godt inne).
     */
    update: (t: number, dt: number, focus: THREE.Vector3) => number;
}

/** Hvor nær et ildsted man må være for at ildlyset skal stå der. */
const ILD_R = 24;

const ALLM_W = 18; // Nikolaikirkeallmenningen nederst [V]
const CELL_Z = FRONT_Z + GARD_DEPTH / 2;

/** Hopp i kailinja per nabogård (meter fram/tilbake). */
const FRONT_JOG = [-0.9, 0.4, -0.5, 0.7, -1.2, 0.2, -0.4, 0.9];

export async function buildBryggen(scene: THREE.Scene, phys: Physics, renderer: THREE.WebGLRenderer, opts: { low?: boolean } = {}): Promise<BryggenWorld> {
    const materials = new Materials(renderer, { low: opts.low });
    const [gardMod, naboMod] = await Promise.all([import('./gard'), import('./nabogard'), materials.load()]);

    // Himmel og miljølys: Bergen i grått vær. Litt kaldere enn gråboksen.
    const fog = 0x95a0a8;
    scene.background = new THREE.Color(fog);
    scene.fog = new THREE.FogExp2(fog, 0.021);
    // Lav kvalitet dropper miljølyset (ett oppslag mindre per piksel) og løfter lyset litt i stedet.
    const environment = makeSkyEnvironment(renderer, 0xb9c3cb, 0x939ea6, 0x3a3833);
    scene.environment = opts.low ? null : environment;
    scene.environmentIntensity = 0.9;

    // ── Vågen ──
    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 200),
        new THREE.MeshStandardMaterial({ color: 0x2c3a3f, roughness: 0.12, metalness: 0.0, envMapIntensity: 1.4 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, WATER_Y, -98);
    water.receiveShadow = true;
    scene.add(water);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(400, 0.5, 200), new THREE.MeshStandardMaterial({ color: 0x1f2426, roughness: 1 }));
    floor.position.set(0, WATER_Y - 3, -98);
    scene.add(floor);

    // ── Silhuetter i tåka: Holmen i nordvest (+x), Stranden på den andre siden av Vågen ──
    const farMat = new THREE.MeshStandardMaterial({ color: 0x7a848c, roughness: 1 });
    const far = (x: number, z: number, w: number, h: number, d: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), farMat);
        m.position.set(x, h / 2 - 1.2, z);
        scene.add(m);
    };
    far(150, -40, 30, 16, 18); // Håkonshallen (bare formen)
    far(128, -62, 11, 24, 11); // tårnet
    for (let i = 0; i < 18; i++) far(-90 + i * 11, -95 - (i % 3) * 4, 8, 6 + (i % 4) * 1.5, 7);

    // ── Cellene ──
    // Gården vi bygde ferdig først, Nikolaikirkeallmenningen på Holmen-siden av den, og nabogårder
    // av modulsettet i begge retninger langs bryggefronten. Hver nabo trekkes slik at den ikke
    // ligner gården ved siden av (nabogard.ts), og bredden varierer, så gårdene legges etter
    // hverandre fra midten og utover.
    const span = 7;
    const ax0 = GARD_W / 2;
    interface Slot { id: string; x0: number; x1: number; front: number; build: (sides: Sides) => Promise<CellContent> }
    const slots: Slot[] = [
        { id: 'gard-1', x0: -GARD_W / 2, x1: GARD_W / 2, front: 0, build: async (s) => gardMod.buildGardCell(materials, 0, s) },
        { id: 'nikolaikirkeallmenningen', x0: ax0, x1: ax0 + ALLM_W, front: 0.3, build: async (s) => gardMod.buildAllmenningCell(materials, ax0, ax0 + ALLM_W, 0.3, s) },
    ];
    let xe = ax0 + ALLM_W;
    let xw = -GARD_W / 2;
    let prevE: GardParams | undefined;
    let prevW: GardParams | undefined;
    for (let i = 1; i <= span; i++) {
        const pe = naboMod.naboParams(1000 + i, FRONT_JOG[i % FRONT_JOG.length], prevE);
        const pw = naboMod.naboParams(2000 + i, FRONT_JOG[(i + 3) % FRONT_JOG.length], prevW);
        const we = naboMod.gardWidth(pe);
        const ww = naboMod.gardWidth(pw);
        const cxE = xe + we / 2;
        const cxW = xw - ww / 2;
        slots.push({ id: `nabo-o${i}`, x0: xe, x1: xe + we, front: pe.front, build: async (s) => naboMod.buildNaboCell(materials, cxE, pe, s) });
        slots.push({ id: `nabo-v${i}`, x0: xw - ww, x1: xw, front: pw.front, build: async (s) => naboMod.buildNaboCell(materials, cxW, pw, s) });
        xe += we;
        xw -= ww;
        prevE = pe;
        prevW = pw;
    }
    // Langs fronten fra -x til +x: hver celle får vite hvor langt ute kaia til naboene står.
    slots.sort((a, b) => a.x0 - b.x0);
    const cells: CellDef[] = slots.map((s, i) => {
        const sides: Sides = { west: slots[i - 1]?.front, east: slots[i + 1]?.front };
        return {
            id: s.id,
            center: new THREE.Vector2((s.x0 + s.x1) / 2, CELL_Z),
            half: new THREE.Vector2((s.x1 - s.x0) / 2, GARD_DEPTH / 2 + FRONT_Z / 2),
            build: () => s.build(sides),
        };
    });
    const streamer = new CellStreamer(phys, cells);
    scene.add(streamer.root);

    // Ildlyset: ett lys for hele byen, alltid i scenen (et lys som kommer og går tvinger Three
    // til å bygge alle shaderne på nytt). Det står på ildstedet nærmest spilleren, eller er av.
    const ildlys = new THREE.PointLight(0xff8a3c, 0, 13, 1.6);
    ildlys.name = 'ildlys';
    scene.add(ildlys);
    const _d = new THREE.Vector3();
    const update = (t: number, dt: number, focus: THREE.Vector3): number => {
        streamer.tick(t, dt);
        let best: THREE.Vector3 | null = null;
        let bestD = ILD_R;
        for (const p of streamer.ildsteder()) {
            const d = _d.subVectors(p, focus).length();
            if (d < bestD) {
                bestD = d;
                best = p;
            }
        }
        if (best) {
            ildlys.position.copy(best);
            ildlys.intensity = 12 * flakk(t);
        } else ildlys.intensity = 0;
        // Inne: 1 når man er mer enn en meter innenfor veggen, tonet ned mot døra.
        let inne = 0;
        for (const b of streamer.rom()) {
            if (focus.y < b.min.y - 0.5 || focus.y > b.max.y) continue;
            const dx = Math.min(focus.x - b.min.x, b.max.x - focus.x);
            const dz = Math.min(focus.z - b.min.z, b.max.z - focus.z);
            inne = Math.max(inne, THREE.MathUtils.clamp(Math.min(dx, dz) / 1.0 + 0.3, 0, 1));
        }
        return inne;
    };

    // ── Usynlige grenser ──
    const xMin = xw;
    const xMax = xe;
    const wall = (cx: number, cz: number, hx: number, hz: number) =>
        phys.addBox(new THREE.Vector3(cx, 0, cz), new THREE.Vector3(hx, 14, hz));
    const back = FRONT_Z + GARD_DEPTH;
    wall(xMin - 0.5, back / 2, 0.5, back / 2 + 2);
    wall(xMax + 0.5, back / 2, 0.5, back / 2 + 2);
    wall((xMin + xMax) / 2, back + 0.5, (xMax - xMin) / 2 + 1, 0.5);
    wall(xMin - 0.5, -60, 0.5, 60);
    wall(xMax + 0.5, -60, 0.5, 60);
    wall((xMin + xMax) / 2, -120, (xMax - xMin) / 2 + 1, 0.5);

    return {
        streamer,
        materials,
        environment,
        update,
        layout: {
            playerStart: new THREE.Vector3(0, 0, 2.4),
            playerYaw: 0,
            enemyStart: new THREE.Vector3(0, 0, 30),
            boatStart: new THREE.Vector3(-4.5, WATER_Y, -1.7),
            boatYaw: Math.PI / 2,
            rescue: new THREE.Vector3(-1.5, 0, 2.5),
        },
    };
}
