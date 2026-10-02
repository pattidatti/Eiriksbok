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
import { lagVann, type Vann } from '../motor/vann';
import { Maaker } from '../motor/maaker';
import { Regn } from '../motor/regn';
import { Rotter, type RotteSone } from '../motor/rotter';
import { Katter } from '../motor/katter';
import type { GrayboxLayout } from '../graboks/scene';
import { FRONT_Z, GARD_DEPTH, GARD_W, YARD_W, type Sides } from './gard';
import type { GardParams } from './nabogard';

export interface BryggenWorld {
    layout: GrayboxLayout;
    streamer: CellStreamer;
    materials: Materials;
    vann: Vann;
    maaker: Maaker;
    rotter: Rotter;
    /** Kaikanten (bolverket) langs hele bryggefronten: der bølgene klukker. */
    kaiKant: { x0: number; x1: number; y: number; z: number };
    /** Hva gutten går på her: planker ute, golv inne eller gjørme (fottrinnene). */
    underlag: (p: THREE.Vector3) => 'tre-ute' | 'tre-inne' | 'gjorme';
    /** Hvor mye det regner (0 tørt, 1 øsregn). Kan endres mens spillet går. */
    regn: number;
    /** Miljølyset fra himmelen. Bare full kvalitet bruker det. */
    environment: THREE.Texture;
    /**
     * Kalles hvert bilde: flammene lever, ildlyset flyttes til nærmeste ildsted, og svaret sier
     * hvor langt inne i et rom `focus` er (0 ute, 1 godt inne). `focus` er kameraet; `spiller`
     * er gutten (måkene letter når han kommer for nær).
     */
    update: (t: number, dt: number, focus: THREE.Vector3, spiller?: { pos: THREE.Vector3; fart: number }) => number;
}

/** Hvor nær et ildsted man må være for at ildlyset skal stå der. */
const ILD_R = 24;

const ALLM_W = 18; // Nikolaikirkeallmenningen nederst [V]
const CELL_Z = FRONT_Z + GARD_DEPTH / 2;

/** Hopp i kailinja per nabogård (meter fram/tilbake). */
const FRONT_JOG = [-0.9, 0.4, -0.5, 0.7, -1.2, 0.2, -0.4, 0.9];

export async function buildBryggen(scene: THREE.Scene, phys: Physics, renderer: THREE.WebGLRenderer, opts: { low?: boolean } = {}): Promise<BryggenWorld> {
    const materials = new Materials(renderer, { low: opts.low });
    const [gardMod, naboMod, kirkeMod] = await Promise.all([import('./gard'), import('./nabogard'), import('./mariakirken'), materials.load()]);

    // Himmel og miljølys: Bergen i grått vær. Litt kaldere enn gråboksen.
    const fog = 0x95a0a8;
    scene.background = new THREE.Color(fog);
    scene.fog = new THREE.FogExp2(fog, 0.021);
    // Lav kvalitet dropper miljølyset (ett oppslag mindre per piksel) og løfter lyset litt i stedet.
    const environment = makeSkyEnvironment(renderer, 0xb9c3cb, 0x939ea6, 0x3a3833);
    scene.environment = opts.low ? null : environment;
    scene.environmentIntensity = 0.9;

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
    // ── Vågen ── (etter cellene: speilingen trenger bryggefrontens ende i begge retninger)
    const vann = lagVann({ y: WATER_Y, frontZ: FRONT_Z, frontX0: xw, frontX1: xe, horisont: 0xa3adb4, zenit: 0xc3ccd3 });
    scene.add(vann.mesh);
    // Måker over kaia, og regn rundt kameraet.
    const maaker = new Maaker({ x0: xw, x1: xe, kaiZ0: 0, kaiZ1: FRONT_Z, sjoZ: -40, vannY: WATER_Y }, phys);
    const regn = new Regn();
    scene.add(maaker.mesh, regn.mesh);

    // Rotter: i buene og på lagerloftene (rommene uten ild), langs bolverket foran hver gård, og
    // under svalgangene i den første gården. Ute er stripene smale og inntil noe, så det aldri er
    // rotter midt i gårdsrommet.
    const rotter = new Rotter(phys);
    const katter = new Katter(phys, rotter); // katter i de samme sonene, på jakt etter rottene
    scene.add(rotter.mesh, katter.mesh);
    const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const uteSoner: RotteSone[] = slots.map((s) => ({
        id: `kai:${s.id}`,
        box: new THREE.Box3(V3(s.x0 + 0.6, 0, s.front + 0.06), V3(s.x1 - 0.6, 1, s.front + 0.7)),
        antall: 1,
        ute: true,
    }));
    const y2 = YARD_W / 2;
    uteSoner.push(
        { id: 'svalgang:v', box: new THREE.Box3(V3(-y2 + 0.02, 0, FRONT_Z + 2), V3(-y2 + 0.6, 1, FRONT_Z + 28)), antall: 1, ute: true },
        { id: 'svalgang:o', box: new THREE.Box3(V3(y2 - 0.6, 0, FRONT_Z + 5), V3(y2 - 0.02, 1, FRONT_Z + 26)), antall: 1, ute: true },
    );
    const romSoner = new Map<string, RotteSone>();
    let soner: RotteSone[] = uteSoner;
    let sonerTid = 0;

    // Mariakirken i nordenden (mot Holmen, +x), oppe i bakken bak gårdene. Den står som kulisse
    // utenfor grensa, så cella har ingen kollidere.
    const back = FRONT_Z + GARD_DEPTH;
    const kirke = { x: xe - 30, z: back + 30 };
    cells.push({
        id: 'mariakirken',
        center: new THREE.Vector2(kirke.x, kirke.z + 6),
        half: new THREE.Vector2(34, 34),
        build: async () => kirkeMod.buildMariakirkeCell(materials, kirke.x, kirke.z, back + 2.5),
    });
    const streamer = new CellStreamer(phys, cells);
    scene.add(streamer.root);

    // Ildlyset: ett lys for hele byen, alltid i scenen (et lys som kommer og går tvinger Three
    // til å bygge alle shaderne på nytt). Det står på ildstedet nærmest spilleren, eller er av.
    const ildlys = new THREE.PointLight(0xff8a3c, 0, 13, 1.6);
    ildlys.name = 'ildlys';
    scene.add(ildlys);
    const _d = new THREE.Vector3();
    const update = (t: number, dt: number, focus: THREE.Vector3, spiller?: { pos: THREE.Vector3; fart: number }): number => {
        streamer.tick(t, dt);
        vann.update(t, world.regn);
        maaker.update(dt, t, spiller?.pos ?? focus, spiller?.fart ?? 0);
        sonerTid -= dt;
        if (sonerTid <= 0) {
            sonerTid = 0.5;
            soner = [...uteSoner];
            for (const { box, demp } of streamer.rom()) {
                if (demp >= 1) continue; // schøtstua: ild og folk
                const id = `rom:${box.min.x.toFixed(1)}:${box.min.y.toFixed(1)}:${box.min.z.toFixed(1)}`;
                let s = romSoner.get(id);
                if (!s) {
                    const areal = (box.max.x - box.min.x) * (box.max.z - box.min.z);
                    s = { id, box, antall: areal > 25 ? 3 : 2 };
                    romSoner.set(id, s);
                }
                soner.push(s);
            }
        }
        rotter.update(dt, soner, spiller?.pos ?? focus, spiller?.fart ?? 0);
        katter.update(dt, soner, spiller?.pos ?? focus, spiller?.fart ?? 0);
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
        for (const { box: b, demp } of streamer.rom()) {
            if (focus.y < b.min.y - 0.5 || focus.y > b.max.y) continue;
            const dx = Math.min(focus.x - b.min.x, b.max.x - focus.x);
            const dz = Math.min(focus.z - b.min.z, b.max.z - focus.z);
            inne = Math.max(inne, THREE.MathUtils.clamp(Math.min(dx, dz) / 1.0 + 0.3, 0, 1) * demp);
        }
        regn.update(t % 600, focus, world.regn, Math.min(1, inne * 2));
        return inne;
    };

    // ── Usynlige grenser ──
    const xMin = xw;
    const xMax = xe;
    const wall = (cx: number, cz: number, hx: number, hz: number) =>
        phys.addBox(new THREE.Vector3(cx, 0, cz), new THREE.Vector3(hx, 14, hz));
    wall(xMin - 0.5, back / 2, 0.5, back / 2 + 2);
    wall(xMax + 0.5, back / 2, 0.5, back / 2 + 2);
    wall((xMin + xMax) / 2, back + 0.5, (xMax - xMin) / 2 + 1, 0.5);
    wall(xMin - 0.5, -60, 0.5, 60);
    wall(xMax + 0.5, -60, 0.5, 60);
    wall((xMin + xMax) / 2, -120, (xMax - xMin) / 2 + 1, 0.5);

    // Underlaget: inne i et rom er det golv; oppe (svalganger, trapper, loft) og på kaia planker.
    // I allmenningen er det gjørme utenfor plankegangen opp midten, og bak gårdene gjørme. Ellers
    // går man på plankene i gårdsrommene.
    const allm = slots.find((s) => s.id === 'nikolaikirkeallmenningen');
    const underlag = (p: THREE.Vector3): 'tre-ute' | 'tre-inne' | 'gjorme' => {
        for (const { box } of streamer.rom()) {
            if (p.x > box.min.x && p.x < box.max.x && p.z > box.min.z && p.z < box.max.z && p.y > box.min.y - 0.3 && p.y < box.max.y) return 'tre-inne';
        }
        if (p.y > 0.6 || p.z < FRONT_Z + 0.2) return 'tre-ute';
        if (allm && p.x > allm.x0 && p.x < allm.x1) return Math.abs(p.x - (allm.x0 + allm.x1) / 2) < 1.2 ? 'tre-ute' : 'gjorme';
        if (p.z > back - 1) return 'gjorme';
        return 'tre-ute';
    };

    const world: BryggenWorld = {
        vann,
        maaker,
        rotter,
        kaiKant: { x0: xw, x1: xe, y: WATER_Y + 0.15, z: -0.6 },
        underlag,
        // ?regn=0 til 1 overstyrer (for skjermbilder og måling). Standard: jevnt Bergen-regn.
        regn: regnFraUrl() ?? 0.6,
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
    // Utviklerverktøy: testskript kan lese hvor måkene er og skru regnet (`__bryggenVerden.regn`).
    if (import.meta.env.DEV) Object.assign(window, { __bryggenMaaker: maaker, __bryggenRotter: rotter, __bryggenVerden: world });
    return world;
}

function regnFraUrl(): number | null {
    const r = new URLSearchParams(location.search).get('regn');
    const v = r === null ? NaN : Number(r);
    return Number.isFinite(v) ? THREE.MathUtils.clamp(v, 0, 1) : null;
}
