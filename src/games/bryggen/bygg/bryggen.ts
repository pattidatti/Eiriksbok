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
import { CellStreamer, INNE_R, INNE_R_FULL, iRom, type CellContent, type CellCtx, type CellDef, type Rom } from '../motor/streaming';
import { Materials, Himmellys } from '../motor/materials';
import { flakk } from '../motor/ild';
import { lagVann, type SkrogFot, type Vann } from '../motor/vann';
import { Maaker } from '../motor/maaker';
import { Regn } from '../motor/regn';
import { Drypp } from '../motor/drypp';
import { Rotter, type RotteSone } from '../motor/rotter';
import { Katter } from '../motor/katter';
import { Himmel } from '../motor/himmel';
import { Royk, Stov } from '../motor/luft';
import type { Lyssetting } from '../motor/stemning';
import { lagSkipene, type Skipene } from './skip';
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
    /** Hvor mye det regner (0 tørt, 1 øsregn). Kommer fra været (`lys.vaer`, dogn.ts). */
    regn: number;
    /** Får replikkene folkene sier (vises som undertekst). Settes av spillet. */
    si: ((hvem: string, tekst: string, fra?: THREE.Vector3) => void) | null;
    /** Miljølyset fra himmelen. Bare full kvalitet bruker det. Byttes ut mens døgnet går. */
    readonly environment: THREE.Texture;
    /** Etterbehandlingen er på: da legger den gløden rundt sola på himmelen (himmel.ts). */
    post: boolean;
    /** Sola kaster skygger. Uten dem ville støvet lyst i hele rommet, ikke bare i strålen. */
    skygger: boolean;
    /** Hvor vått det er nå (0-1). Henger etter regnet: det tørker sakte. */
    vaat: number;
    /** Hvor mye av sola kameraet står i skyggen for (0-1), ute. Øyet venner seg til det (stemning.ts). */
    skygge: number;
    /** Færingen gutten ror (settes av spillet): vannet holdes ute av den også. */
    faering: THREE.Object3D | null;
    /** Vestenden av byen: x der Vågen slutter (bommen over Skostredet står like øst for den). */
    xw: number;
    /** Kattene i rottesonene (katter.ts): lydkoblingen lytter på dem. */
    katter: Katter;
    /** Skipene som ligger fast i Vågen (koggen og jektene, skip.ts). */
    skip: Skipene;
    /** Andre skrog vannet skal holdes ute av (koggen i en filmscene, sekvens.ts). */
    ekstraSkrog: SkrogFot[];
    /**
     * Kalles hvert bilde: flammene lever, ildlyset flyttes til nærmeste ildsted, og svaret sier
     * hvor langt inne i et rom `focus` er (0 ute, 1 godt inne). `focus` er kameraet; `spiller`
     * er gutten (måkene letter når han kommer for nær).
     */
    update: (t: number, dt: number, focus: THREE.Vector3, spiller?: { pos: THREE.Vector3; fart: number }) => number;
    dispose: () => void;
}

/**
 * Hvor nær et ildsted kameraet må være for at et ildlys skal stå der: lav og full kvalitet. Lyset
 * toner inn over den ytterste tredjedelen, så det aldri slår seg på i ett bilde.
 */
const ILD_R = { lav: 24, full: 48 };
/** Ildlys på hvert nivå: på full kvalitet lyser de tre nærmeste ildstedene, ikke bare ett. */
const ILD_ANTALL = { lav: 1, full: 3 };

const ALLM_W = 18; // Nikolaikirkeallmenningen nederst [V]
const CELL_Z = FRONT_Z + GARD_DEPTH / 2;

/** Hopp i kailinja per nabogård (meter fram/tilbake). */
const FRONT_JOG = [-0.9, 0.4, -0.5, 0.7, -1.2, 0.2, -0.4, 0.9];

export async function buildBryggen(scene: THREE.Scene, phys: Physics, renderer: THREE.WebGLRenderer, lys: Lyssetting, opts: { low?: boolean } = {}): Promise<BryggenWorld> {
    const materials = new Materials(renderer, { low: opts.low });
    const [gardMod, naboMod, kirkeMod, vbMod] = await Promise.all([import('./gard'), import('./nabogard'), import('./mariakirken'), import('./vaagsbunnen'), materials.load()]);

    // Himmel og miljølys fra lyssettingen (stemning.ts), som følger døgnet. Tåka og lysene har
    // `Lyssetting` satt. Lav kvalitet dropper miljølyset (ett oppslag mindre per piksel) og løfter
    // lyset litt i stedet.
    const st = lys.s;
    const miljoLys = () => ({
        topp: lys.c.zenit, horisont: lys.c.horisont, sol: lys.solRetning, solFarge: lys.c.solFarge,
        solStyrke: st.solGlod * lys.lysFade, lysniva: Math.min(1, st.fyll * (lys.c.himmel.r + lys.c.himmel.g + lys.c.himmel.b) / 1.2),
    });
    const himmellys = new Himmellys(renderer, miljoLys());
    scene.environment = opts.low ? null : himmellys.texture;
    scene.environmentIntensity = st.miljo;
    let miljoTid = 2;
    const himmel = new Himmel(lys);
    // Røyk fra ljorene og støv i rommene (luft.ts).
    const royk = new Royk(lys.solRetning, lys.c.solFarge, lys.c.himmel);
    const stov = new Stov(lys.solRetning);
    scene.add(himmel.mesh, royk.mesh, stov.mesh);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(600, 0.5, 200), new THREE.MeshStandardMaterial({ color: 0x1f2426, roughness: 1 }));
    floor.position.set(40, WATER_Y - 3, -98);
    scene.add(floor);

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
        { id: 'nikolaikirkeallmenningen', x0: ax0, x1: ax0 + ALLM_W, front: 0.3, build: async (s) => (await import('./allmenning')).buildAllmenningCell(materials, ax0, ax0 + ALLM_W, 0.3, s) },
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
    // Vågsbunnen vest for den siste gården: Auta allmenning, Skostredet og håndverkerne (vaagsbunnen.ts).
    // Fra her av er `xw` den vestre enden av byen; `xwGard` er der gårdene slutter.
    const xwGard = xw;
    slots.push(...vbMod.vaagsbunnenPlasser(materials, xwGard));
    xw = xwGard - vbMod.VB_BREDDE;
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
    const vann = lagVann({ y: WATER_Y, frontZ: FRONT_Z, frontX0: xw, frontX1: xe, lys });
    scene.add(vann.mesh);
    // Skipene i Vågen (skip.ts): koggen og jektene gynger med bølgene og har kollider mot færingen.
    const skip = lagSkipene(phys, materials, (x) => slots.find((s) => x >= s.x0 && x < s.x1)?.front ?? 0);
    scene.add(skip.group);
    // Trafikken: skip som seiler inn og ankrer, og færinger som ror (trafikk.ts).
    const jektAnker = skip.anker;
    const trafikk = await (await import('./trafikk')).lagTrafikk(phys, materials, {
        xw, xe, kaiFront: (x) => slots.find((s) => x >= s.x0 && x < s.x1)?.front ?? 0, bunnX: xw + 6, anker: jektAnker, brygger: vbMod.brygger(xwGard),
    });
    scene.add(trafikk.group);
    // Måker over kaia, og regn rundt kameraet.
    const maaker = new Maaker({ x0: xw, x1: xe, kaiZ0: 0, kaiZ1: FRONT_Z, sjoZ: -40, vannY: WATER_Y }, phys);
    const regn = new Regn();
    const drypp = new Drypp(phys);
    scene.add(maaker.mesh, regn.mesh, drypp.mesh);

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

    // Mariakirken i nordenden (mot Holmen, +x), på nordsida av Øvregaten bak gårdene. Kirkegården
    // har mur rundt og port mot gata; man går inn sørportalen (mariakirken.ts).
    const back = FRONT_Z + GARD_DEPTH;
    const kirke = { x: xe - 30, z: back + 37 };
    const kgard = { x0: kirke.x - 24, x1: xe, z0: back + 9.5, z1: back + 65 };
    cells.push({
        id: 'mariakirken',
        center: new THREE.Vector2((kgard.x0 + kgard.x1) / 2, (kgard.z0 + kgard.z1) / 2),
        half: new THREE.Vector2((kgard.x1 - kgard.x0) / 2, (kgard.z1 - kgard.z0) / 2),
        build: () => kirkeMod.buildMariakirkeCell(materials, kirke.x, kirke.z, kgard),
    });
    // Øvregaten bak gårdene, 2 m opp: kirketrappa i allmenningen er oppgangen (ovregaten.ts).
    const [gateMod, allmMod, holmenMod, bergMod, strandMod] = await Promise.all([
        import('./ovregaten'), import('./allmenning'), import('./holmen'), import('./bergenhus'), import('./stranden'),
    ]);
    cells.push(...gateMod.gateCeller(materials, {
        xw, xe,
        allm: [ax0, ax0 + ALLM_W],
        trapper: [[vbMod.autaX(xwGard) - vbMod.AUTA_HULL, vbMod.autaX(xwGard) + vbMod.AUTA_HULL]],
        nikolai: { x: [ax0 - 6, ax0 + ALLM_W + 6], z: allmMod.MUR_Z + 7 },
        maria: { x: [kgard.x0, kgard.x1], z: kgard.z0 - 0.35 },
    }));
    // Holmen i nordvest (+x) står statisk med to nivåer, et stykke forbi kaienden. Veien dit og
    // borggården innenfor porten er celler man går i (bergenhus.ts). Stranden på den andre siden
    // av Vågen er en kulisse uten kollidere.
    const hx = xe + bergMod.HOLMEN_D;
    scene.add(holmenMod.lagHolmen(materials, hx));
    // Nordnes på den andre siden av Vågen, der Stranden slutter: åsen og Munkeliv kloster (nordnes.ts).
    scene.add((await import('./nordnes')).lagNordnes(materials, xe - 12, xw - 40));
    cells.push(...bergMod.holmenCeller(materials, xe, slots[slots.length - 1].front));
    // Den gåbare biten av Stranden (strandliv.ts) står i et hull i kulissen.
    const strandLiv = await import('./strandliv');
    // Vest for den gåbare biten går Strandgaten langs sjøen: husene der står lenger inne (stranden.ts).
    cells.push(strandMod.strandCelle(materials, xw - 20, xe - 10, strandLiv.STRAND_X, strandLiv.STRAND_X[0]));
    // Veien til fots rundt bunnen av Vågen: forbi bommen, langs kaia og Strandgaten (strandgaten.ts).
    cells.push((await import('./strandgaten')).strandgatenCelle(materials, xw, strandLiv.STRAND_X[0]));
    cells.push(strandLiv.strandlivCelle(materials));
    cells.push(vbMod.endeCelle(materials, xw));
    const streamer = new CellStreamer(phys, cells);
    scene.add(streamer.root);

    // Ildlyset: ett lys for hele byen, alltid i scenen (et lys som kommer og går tvinger Three
    // til å bygge alle shaderne på nytt). Det står på ildstedet nærmest spilleren, eller er av.
    // Det faller sakte av (1,2) og rekker 17 m: schøtstua er 17,6 m lang, og oldermannen står ved
    // gavlveggen 7 m fra ilden. Med 1,6 og 13 m sto han i mørket.
    //
    // På full kvalitet er det tre slike lys, alltid i scenen (de to ekstra er skjult på lav; byttet
    // bygger shaderne på nytt uansett). Hvert lys holder på ildstedet sitt så lenge det er blant de
    // nærmeste, toner ned før det flytter seg, og toner inn etter avstanden: ingen lys som hopper
    // eller popper opp.
    const ildlys = Array.from({ length: ILD_ANTALL.full }, (_, i) => {
        const l = new THREE.PointLight(0xff8a3c, 0, 17, 1.2);
        l.name = 'ildlys';
        scene.add(l);
        return { l, sted: null as THREE.Vector3 | null, vekt: 0, fase: i * 1.7 };
    });
    const ildValgt: THREE.Vector3[] = [];
    const ildAvstand = new Map<THREE.Vector3, number>();
    const _d = new THREE.Vector3();
    const _f = new THREE.Vector3();
    // Folk som går har ingen egen kollider. De nærmeste gutten får låne en kapsel fra poolen, så
    // han ikke går gjennom dem (og de stopper selv før de går på ham, vandrer.ts).
    const pool = Array.from({ length: 5 }, () => phys.addMover(0.55, 0.26));
    const parkert = new THREE.Vector3(0, -100, 0);
    const naere: { p: THREE.Vector3; d: number }[] = [];
    // Skyggen kameraet står i: noen stråler mot sola rundt det, et par ganger i sekundet.
    const SKYGGE_PROVER = [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]];
    const _s = new THREE.Vector3();
    let skyggeTid = 0;
    let skyggeMaal = 0;
    const ctx: CellCtx = { kamera: new THREE.Vector3(), spiller: new THREE.Vector3(), si: (hvem, tekst, fra) => world.si?.(hvem, tekst, fra) };
    const skrog: SkrogFot[] = [];
    const oppdaterIldlys = (t: number, dt: number, focus: THREE.Vector3): void => {
        const niva = materials.lav ? 'lav' : 'full';
        const R = ILD_R[niva];
        const n = ILD_ANTALL[niva];
        streamer.inneR = niva === 'lav' ? INNE_R : INNE_R_FULL;
        // De n nærmeste ildstedene innen R.
        ildAvstand.clear();
        ildValgt.length = 0;
        for (const p of streamer.ildsteder()) {
            const d = _d.subVectors(p, focus).length();
            if (d < R) {
                ildAvstand.set(p, d);
                ildValgt.push(p);
            }
        }
        ildValgt.sort((a, b) => ildAvstand.get(a)! - ildAvstand.get(b)!);
        ildValgt.length = Math.min(ildValgt.length, n);
        const ledige = ildValgt.filter((p) => !ildlys.some((x, i) => i < n && x.sted === p));
        ildlys.forEach((x, i) => {
            x.l.visible = i < n;
            const beholder = i < n && !!x.sted && ildValgt.includes(x.sted);
            if (!beholder && x.vekt < 0.02 && i < n) {
                // Helt nede: flytt til et ildsted som ikke har lys ennå.
                x.sted = ledige.shift() ?? null;
                if (x.sted) x.l.position.copy(x.sted);
            }
            const d = x.sted ? ildAvstand.get(x.sted) : undefined;
            const maal = i < n && x.sted && d !== undefined && ildValgt.includes(x.sted) ? 1 - THREE.MathUtils.smoothstep(d, R * 0.66, R) : 0;
            x.vekt += (maal - x.vekt) * Math.min(1, dt * (maal > x.vekt ? 2.5 : 5));
            x.l.intensity = x.vekt < 0.005 ? 0 : 10 * flakk(t + x.fase) * x.vekt;
        });
    };

    const update = (t: number, dt: number, focus: THREE.Vector3, spiller?: { pos: THREE.Vector3; fart: number }): number => {
        // Døgnet og været først: alt under leser fargene og sola derfra.
        lys.tikk(dt, scene);
        world.regn = lys.vaer.regn;
        miljoTid -= dt;
        if (miljoTid <= 0) {
            miljoTid = 2;
            himmellys.oppdater(miljoLys());
            if (scene.environment) scene.environment = himmellys.texture;
        }
        ctx.kamera.copy(focus);
        ctx.spiller.copy(spiller?.pos ?? focus);
        streamer.tick(t, dt, ctx);
        naere.length = 0;
        for (const p of streamer.gaaende()) {
            const d = p.distanceToSquared(ctx.spiller);
            if (d < 144) naere.push({ p, d });
        }
        naere.sort((a, b) => a.d - b.d);
        pool.forEach((m, i) => m.flytt(naere[i]?.p ?? parkert));
        vann.update(t, world.regn);
        himmel.update(t, focus, world.post);
        royk.lysFade = lys.lysFade;
        royk.update(t, [...streamer.royk()], focus);
        // Vått med en gang det regner, tørt først etter flere minutter.
        const vaatMaal = Math.min(1, world.regn * 1.4);
        world.vaat += (vaatMaal - world.vaat) * Math.min(1, dt * (vaatMaal > world.vaat ? 0.5 : 0.004));
        materials.vaat.mengde = world.vaat;
        skip.update(t);
        // Vannet holdes ute av alle skrogene: de som ligger fast, og færingen.
        skrog.length = 0;
        trafikk.update(t, dt, focus, world.faering);
        skrog.push(...skip.synlige(), ...trafikk.skrog, ...world.ekstraSkrog);
        if (world.faering) {
            const f = world.faering;
            skrog.push({ x: f.position.x, z: f.position.z, yaw: f.rotation.y, L: 2.85, B: 0.72, fyldig: 2 });
        }
        vann.settSkrog(skrog);
        maaker.update(dt, t, spiller?.pos ?? focus, spiller?.fart ?? 0);
        sonerTid -= dt;
        if (sonerTid <= 0) {
            sonerTid = 0.5;
            soner = [...uteSoner];
            // Inne er det tørt: de nærmeste rommene til vætan (vaat.ts). Et skjevt rom (kirken) får
            // boksen rundt seg i verdensrom.
            materials.vaat.settRom(
                [...streamer.rom()].map(verdensboks).sort((a, b) => a.distanceToPoint(focus) - b.distanceToPoint(focus))
            );
            for (const { box, demp, yaw } of streamer.rom()) {
                if (demp >= 1 || yaw !== undefined) continue; // schøtstua og ølstua (ild og folk), og kirken
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
        oppdaterIldlys(t, dt, focus);
        // Inne: 1 når man er mer enn en meter innenfor veggen, tonet ned mot døra.
        let inne = 0;
        // Støvet står i det rommet kameraet er dypest inne i (ikke i skjeve rom: der ville det
        // drevet ut gjennom veggene).
        let innerst: THREE.Box3 | null = null;
        let dypest = 0;
        for (const r of streamer.rom()) {
            const b = r.box;
            const f = iRom(r, focus, _f);
            if (f.y < b.min.y - 0.5 || f.y > b.max.y) continue;
            const dx = Math.min(f.x - b.min.x, b.max.x - f.x);
            const dz = Math.min(f.z - b.min.z, b.max.z - f.z);
            const her = THREE.MathUtils.clamp(Math.min(dx, dz) / 1.0 + 0.3, 0, 1);
            inne = Math.max(inne, her * r.demp);
            if (her > dypest && !r.yaw) {
                dypest = her;
                innerst = b;
            }
        }
        // Regnet og dryppet lyser ikke selv: de får lyset fra himmelen.
        regn.farge.setHex(0xc8d0d6).multiplyScalar(vann.husLys());
        drypp.farge.setHex(0xdde4ea).multiplyScalar(vann.husLys());
        regn.update(t % 600, focus, world.regn, Math.min(1, inne * 2));
        // Det drypper mens det regner og et par minutter etterpå, så lenge det renner av takene.
        drypp.update(t % 600, focus, streamer.drypp(), lys.vaer.takvann, world.regn, Math.min(1, inne * 2));
        skyggeTid -= dt;
        if (skyggeTid <= 0) {
            skyggeTid = 0.25;
            let n = 0;
            for (const [dx, dz] of SKYGGE_PROVER) if (phys.rayWorld(_s.set(focus.x + dx, focus.y, focus.z + dz), lys.solRetning, 60)) n++;
            skyggeMaal = n / SKYGGE_PROVER.length;
        }
        world.skygge += (skyggeMaal - world.skygge) * Math.min(1, dt * 1.2);
        stov.update(t, world.skygger ? innerst : null, inne);
        return inne;
    };

    // ── Usynlige grenser ──
    // På land holder cellene selv grensene der de slutter: støttemuren, gjerdene og kirkegårdsmurene
    // langs Øvregaten, lagerhusene ved veien til Holmen og grensa rundt borggården. Her står bare
    // endene av byen, sikringer langt ute, og grensene i Vågen for færingen.
    const xMin = xw;
    const xMax = xe;
    const wall = (cx: number, cz: number, hx: number, hz: number) =>
        phys.addBox(new THREE.Vector3(cx, 0, cz), new THREE.Vector3(hx, 14, hz));
    // Vestenden på land: nord for gata bak bommen. Gata, kaia langs bunnen av Vågen og Strandgaten har
    // grensene sine i strandgaten.ts.
    wall(xMin - 0.5, (vbMod.GATE.land + 0.7 + 92) / 2, 0.5, (92 - vbMod.GATE.land - 0.7) / 2);
    wall((xMin + hx + 40) / 2, kgard.z1 + 4, (hx + 40 - xMin) / 2, 0.5);
    wall(hx + 40, 50, 0.5, 80);
    // Bunnen av Vågen: i vannet rett utenfor kaia, så gutten kan gå på kaia og båten ikke kommer inn på den.
    wall(xMin + 0.5, -60.5, 0.5, 60.5);
    wall(xMax + 0.5, -60, 0.5, 60);
    // Over Vågen, med en åpning der man kan legge til på Stranden (bolverket der kolliderer selv).
    const [sx0, sx1] = strandLiv.STRAND_X;
    wall((xMin - 1 + sx0) / 2, -120, (sx0 - xMin + 1) / 2, 0.5);
    wall((sx1 + xMax + 1) / 2, -120, (xMax + 1 - sx1) / 2, 0.5);

    // Underlaget: inne i et rom er det golv; oppe (svalganger, trapper, loft) og på kaia planker.
    // I allmenningen er det gjørme utenfor plankegangen opp midten, og bak gårdene gjørme. Ellers
    // går man på plankene i gårdsrommene.
    const allm = slots.find((s) => s.id === 'nikolaikirkeallmenningen');
    const _u = new THREE.Vector3();
    const underlag = (p: THREE.Vector3): 'tre-ute' | 'tre-inne' | 'gjorme' => {
        for (const r of streamer.rom()) {
            const box = r.box;
            const q = iRom(r, p, _u);
            if (q.x > box.min.x && q.x < box.max.x && q.z > box.min.z && q.z < box.max.z && q.y > box.min.y - 0.3 && q.y < box.max.y) return 'tre-inne';
        }
        // Øvregaten: plankeveit i midten, gjørme og gress ellers. Holmen og veien dit: gjørme.
        if (p.z > back && p.y > 1.5) return Math.abs(p.z - gateMod.GATE.veit) < gateMod.GATE.veitW / 2 ? 'tre-ute' : 'gjorme';
        if (p.x > xe && p.z > FRONT_Z) return 'gjorme';
        if (p.y > 0.6 || p.z < FRONT_Z + 0.2) return 'tre-ute';
        if (allm && p.x > allm.x0 && p.x < allm.x1) return Math.abs(p.x - (allm.x0 + allm.x1) / 2) < 1.2 ? 'tre-ute' : 'gjorme';
        if (p.z > back - 1) return 'gjorme';
        // Vågsbunnen: plankeveien i Skostredet og plankegangen i Auta allmenning, ellers gjørme.
        if (p.x < xwGard) {
            const ax = vbMod.autaX(xwGard);
            if (Math.abs(p.z - 15) < 1.3 || (Math.abs(p.x - ax) < 1.1 && p.x > ax - 1.1)) return 'tre-ute';
            return 'gjorme';
        }
        return 'tre-ute';
    };

    const world: BryggenWorld = {
        vann,
        maaker,
        rotter,
        kaiKant: { x0: xw, x1: xe, y: WATER_Y + 0.15, z: -0.6 },
        underlag,
        si: null,
        regn: lys.vaer.regn,
        post: false,
        skygger: true,
        vaat: lys.vaatStart,
        skygge: 0,
        faering: null,
        ekstraSkrog: [],
        skip,
        katter,
        xw,
        streamer,
        materials,
        get environment() {
            return himmellys.texture;
        },
        update,
        dispose: () => {
            himmellys.dispose();
            himmel.dispose();
            royk.dispose();
            stov.dispose();
            drypp.dispose();
            trafikk.dispose();
        },
        layout: {
            playerStart: new THREE.Vector3(0, 0, 2.4),
            playerYaw: 0,
            enemyStart: new THREE.Vector3(0, 0, 30),
            boatStart: new THREE.Vector3(-4.5, WATER_Y, -1.7),
            boatYaw: Math.PI / 2,
            rescue: new THREE.Vector3(-1.5, 0, 2.5),
        },
    };
    // ?regn=0 til 1 låser været på det regnet (for skjermbilder og måling).
    const regnUrl = regnFraUrl();
    if (regnUrl !== null) {
        lys.vaer.laas(regnUrl);
        world.regn = regnUrl;
    }
    // Utviklerverktøy: testskript kan lese hvor måkene er og skru regnet
    // (`__bryggenLys.vaer.laas(0.6)`; `null` slipper været løs igjen).
    if (import.meta.env.DEV) Object.assign(window, { __bryggenMaaker: maaker, __bryggenRotter: rotter, __bryggenVerden: world, __bryggenHimmel: himmel, __bryggenStov: stov, __bryggenRoyk: royk, __bryggenDrypp: drypp });
    return world;
}

/** Boksen rundt et rom i verdensrom (et skjevt rom dreies rundt midten av boksen sin). */
function verdensboks(r: Rom): THREE.Box3 {
    if (!r.yaw) return r.box;
    const c = r.box.getCenter(new THREE.Vector3());
    const m = new THREE.Matrix4().makeTranslation(c.x, c.y, c.z).multiply(new THREE.Matrix4().makeRotationY(r.yaw)).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
    return r.box.clone().applyMatrix4(m);
}

function regnFraUrl(): number | null {
    const r = new URLSearchParams(location.search).get('regn');
    const v = r === null ? NaN : Number(r);
    return Number.isFinite(v) ? THREE.MathUtils.clamp(v, 0, 1) : null;
}
