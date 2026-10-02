// Øvregaten: gata bak gårdene, oppe i bakken, med norske hus på nordsida og ølstua i «sentrum».
//
// Det vi vet [V §5.2]: Øvregaten gikk bak Bryggen, og gårdene gikk opp mot den. Martinskirken lå på
// oversiden av gata, og Nikolaikirken på langs av den. Det vi ikke vet [K]: hvor høyt gata lå over
// Bryggen i 1420-årene, hvordan den var lagt, hvilke hus som sto langs den, og hvem som bodde der.
// At husene her er norske bergenseres, er et valg [S]. Her ligger gata 2 m over gårdene på en støttemur av stein
// med brystning, med plankeveit i midten og gjørme langs kantene [S]. Husene er laftehus med
// gavlen mot gata, trukket fra et frø, med smale smug imellom stengt av plankegjerder bak [S].
// Ølstua er et valg for spillet [S]: et sted der bergenserne samles, med ildsted og benker.
//
// Verden som ellers: x langs sjøen (mot Holmen = +x), z innover. Gata er delt i celler langs x.
import * as THREE from 'three';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellContent, CellDef, Rom } from '../motor/streaming';
import { Ild } from '../motor/ild';
import { COLD, DARK, T, WARM, toGroup, tonne } from './gard';
import { eaveY, hus, husLod, riseOf, rng, trekkGlugger, type HouseSpec } from './moduler';
import { schotstue } from './schotstue';
import { lagFolk, type FigurNavn, type Plass } from './folk';
import type { Rute } from './vandrer';
import { LIST, STEIN } from './stein';
import { MUR_Z } from './allmenning';
import { NIKOLAI_Y } from './nikolaikirken';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Gata: støttemuren foran (z), plankeveiten, og linja husgavlene står på. */
export const GATE = {
    y: NIKOLAI_Y,
    mur0: MUR_Z,
    mur1: MUR_Z + 0.7,
    veit: 64.6,
    veitW: 3.2,
    /** Husene på nordsida står med gavlen her. */
    hus: 68.9,
    /** Gjerdene i smugene mellom husene står så langt inn. */
    gjerde: 68.9 + 2.4,
    /** Bakkanten av det man ser bak husene. */
    bak: 82,
};

export interface GateOppsett {
    xw: number;
    xe: number;
    /** Nikolaikirkeallmenningen: der står allmenningens egen støttemur med trappa. */
    allm: [number, number];
    /** Flere åpninger i støttemuren der en trapp kommer opp (Auta allmenning, vaagsbunnen.ts). */
    trapper?: [number, number][];
    /** Nikolaikirkegården og Mariakirkegården: muren mot gata, og hvor langt gata går før den. */
    nikolai: { x: [number, number]; z: number };
    maria: { x: [number, number]; z: number };
}

interface GateHus {
    x: number;
    z: number;
    rot: number;
    spec: HouseSpec;
    olstue?: boolean;
}

/** Ølstua: langveggen med døra mot gata, ildsted og ljore midt i rommet [S]. */
const OLSTUE: HouseSpec = {
    w: 6.5, l: 10, floors: [3.2], roof: 'torv', pitch: 0.85, tint: T(0.92, WARM),
    cornersFront: true, cornersBack: true, hodeSeg: 5,
    doors: [{ side: 1, z: 2.0, open: true }],
    glugger: [{ side: 1, at: 6.2, floor: 0, open: true }, { side: 1, at: 8.4, floor: 0 }, { side: 0, at: 0, floor: 1 }],
    inne: { ljore: { z: 5.6, len: 1.4, down: 0.9 } },
};

/**
 * Husene langs nordsida: i hvert avsnitt (mellom kirkegårdene) etter hverandre med smug imellom.
 * Ølstua står først i avsnittet som starter ved Nikolaikirkegården. Gir også hvor gjerdene står.
 */
function planHus(o: GateOppsett): { hus: GateHus[]; gjerder: [number, number][]; ender: number[] } {
    const hus: GateHus[] = [];
    const gjerder: [number, number][] = [];
    const avsnitt: [number, number, boolean][] = [
        [o.xw, o.nikolai.x[0], false],
        [o.nikolai.x[1], o.maria.x[0], true],
    ];
    const toner = [WARM, COLD, DARK];
    for (const [a, b, sentrum] of avsnitt) {
        const r = rng(Math.round(a * 13) + 1429);
        let x = a;
        if (sentrum) {
            const gap = 1.2;
            gjerder.push([x, x + gap]);
            hus.push({ x: x + gap, z: GATE.hus + OLSTUE.w / 2, rot: Math.PI / 2, spec: OLSTUE, olstue: true });
            x += gap + OLSTUE.l;
        }
        for (let i = 0; ; i++) {
            const gap = 1.0 + r() * 2.2;
            const w = 5.4 + r() * 2.2;
            if (x + gap + w > b - 0.8) {
                gjerder.push([x, b]);
                break;
            }
            gjerder.push([x, x + gap]);
            const dor = (r() < 0.5 ? -1 : 1) as -1 | 1;
            const spec: HouseSpec = {
                w, l: 7 + r() * 3.5, floors: r() < 0.45 ? [2.5, 2.3] : [2.7], roof: r() < 0.75 ? 'torv' : 'bordtak',
                pitch: 0.8 + r() * 0.15, tint: T(0.86 + r() * 0.18, toner[Math.floor(r() * 3)]),
                cornersFront: true, cornersBack: true, hodeSeg: 5,
                doors: [{ side: dor, z: 1.3 }],
            };
            spec.glugger = trekkGlugger(spec, dor, true, rng(i * 31 + Math.round(a)));
            hus.push({ x: x + gap + w / 2, z: GATE.hus, rot: 0, spec });
            x += gap + w;
        }
    }
    return { hus, gjerder, ender: [o.nikolai.x[0], o.nikolai.x[1]] };
}

/** Plankegjerde langs x i smuget bak, med stolper. Kolliderer som prop. */
function gjerde(k: MeshKit, c: ColliderKit, x0: number, x1: number, z: number): void {
    if (x1 - x0 < 0.05) return;
    const y = GATE.y;
    k.withTint({ top: 0.85, bottom: 0.6, hue: DARK }, () => k.box('bordvegg', (x0 + x1) / 2, y + 0.8, z, x1 - x0, 1.6, 0.05, { shadeFoot: true }));
    k.withTint({ top: 0.7, bottom: 0.7 }, () => {
        for (let x = x0 + 0.1; x < x1; x += 1.6) k.box('raatre', x, y + 0.85, z + 0.05, 0.1, 1.7, 0.1);
    });
    c.box((x0 + x1) / 2, y + 0.9, z, x1 - x0, 1.8, 0.12, true);
}

/** Gjerde på tvers (langs z), der smugene møter en kirkegårdsmur. */
function gjerdeZ(k: MeshKit, c: ColliderKit, x: number, z0: number, z1: number): void {
    const y = GATE.y;
    k.withTint({ top: 0.85, bottom: 0.6, hue: DARK }, () => k.box('bordvegg', x, y + 0.8, (z0 + z1) / 2, 0.05, 1.6, z1 - z0, { shadeFoot: true }));
    c.box(x, y + 0.9, (z0 + z1) / 2, 0.12, 1.8, z1 - z0, true);
}

/** Folk som går langs gata og står ved ølstua. `d` er døra inn til ølstua. */
function gatefolk(a: number, b: number, d: THREE.Vector3 | null): { plasser: Plass[]; ruter: Rute[] } {
    const y = GATE.y;
    const P = (x: number, z: number) => V(x, y, z);
    const plasser: Plass[] = [];
    const ruter: Rute[] = [];
    const SJO = Math.PI;
    if (d) {
        // Ved ølstua: en bødker med tønner, og tjenestejenta som henter øl i bøtte til huset sitt.
        plasser.push({ figur: 'bodker', rolle: 'staa', pos: P(d.x + 2.1, GATE.hus - 1.05), yaw: SJO - 0.4 });
        ruter.push({
            figur: 'tjenestejente', fart: 0.95, start: 1, baer: 'botte',
            stopp: [
                { p: P(d.x, GATE.hus - 1.1), vent: 4, se: 0, gjor: true },
                { p: P(d.x + 4, 63.3) },
                { p: P(Math.min(b - 2, d.x + 26), 63.3), vent: 3, se: 0 },
                { p: P(d.x + 4, 63.3) },
            ],
        });
        ruter.push({
            figur: 'borger', fart: 1.0, start: 0,
            stopp: [
                { p: P(a + 3, 64.2), vent: 5, se: 0 },
                { p: P(b - 3, 64.2), vent: 6, se: SJO },
            ],
        });
    } else if (b - a > 30) {
        // Ellers: en kone på vei mellom husene, og en som står og prater ved en dør.
        const mx = (a + b) / 2;
        ruter.push({
            figur: 'kjopekone', fart: 0.9, start: 0,
            stopp: [
                { p: P(a + 4, 65.1), vent: 4, se: 0 },
                { p: P(b - 4, 65.1), vent: 4, se: 0 },
            ],
        });
        const f: FigurNavn = a < -70 ? 'fiskekone' : 'bondekone';
        plasser.push({ figur: f, rolle: 'staa', pos: P(mx, GATE.hus - 1.2), yaw: SJO });
    }
    return { plasser, ruter };
}

/** Én celle av gata fra `a` til `b` langs x. */
async function buildGateCell(mats: Materials, o: GateOppsett, plan: ReturnType<typeof planHus>, a: number, b: number): Promise<CellContent> {
    const k = new MeshKit();
    const c = new ColliderKit();
    const lod = new MeshKit();
    const y = GATE.y;
    const near = new THREE.Group();
    near.name = 'ovregaten';
    const inne: THREE.Object3D[] = [];
    const rom: Rom[] = [];
    const ild: THREE.Vector3[] = [];
    const ilder: Ild[] = [];
    const plasser: Plass[] = [];

    // Bakken: gjørme oppå, helt fram til kirkegårdsmurene og inn under husene.
    const bit = (x0: number, x1: number, z1: number) => {
        if (x1 - x0 < 0.01) return;
        const zm = (GATE.mur1 + z1) / 2;
        k.withTint({ top: 0.72, bottom: 0.72 }, () => k.box('gjorme', (x0 + x1) / 2, y - 0.05, zm, x1 - x0, 0.1, z1 - GATE.mur1, { skip: ['bottom'] }));
        c.box((x0 + x1) / 2, y - 0.75, zm, x1 - x0, 1.5, z1 - GATE.mur1);
        lod.withTint({ top: 1, bottom: 1, hue: [0.29, 0.23, 0.17] }, () => lod.box('mork', (x0 + x1) / 2, y - 0.05, zm, x1 - x0, 0.1, z1 - GATE.mur1, { skip: ['bottom'] }));
    };
    const kutt = [a, b, ...o.nikolai.x, ...o.maria.x].filter((x) => x >= a && x <= b).sort((p, q) => p - q);
    for (let i = 0; i + 1 < kutt.length; i++) {
        const m = (kutt[i] + kutt[i + 1]) / 2;
        const z1 = m > o.nikolai.x[0] && m < o.nikolai.x[1] ? o.nikolai.z : m > o.maria.x[0] && m < o.maria.x[1] ? o.maria.z : GATE.bak;
        bit(kutt[i], kutt[i + 1], z1);
    }
    // Plankeveiten midt i gata, med en stokk langs hver kant.
    k.withTint({ top: 0.85, bottom: 0.85 }, () => k.box('gardsrom', (a + b) / 2, y + 0.01, GATE.veit, b - a, 0.06, GATE.veitW, { skip: ['bottom'], grain: 'x' }));
    k.withTint({ top: 0.55, bottom: 0.55 }, () => {
        for (const s of [-1, 1]) k.box('raatre', (a + b) / 2, y + 0.03, GATE.veit + (s * GATE.veitW) / 2, b - a, 0.1, 0.14);
    });

    // Støttemuren mot gårdene, med brystning (ikke der allmenningen har sin egen).
    const mur = (x0: number, x1: number) => {
        if (x1 - x0 < 0.01) return;
        const zc = (GATE.mur0 + GATE.mur1) / 2;
        const top = y + 0.9;
        k.withTint(STEIN, () => k.box('stein', (x0 + x1) / 2, (top - 0.3) / 2, zc, x1 - x0, top + 0.3, 0.7, { skip: ['bottom'], shadeFoot: true }));
        k.withTint(LIST, () => k.box('stein', (x0 + x1) / 2, top + 0.05, zc, x1 - x0, 0.1, 0.8));
        c.box((x0 + x1) / 2, (top + 0.3) / 2, zc, x1 - x0, top + 0.9, 0.7);
        const st = mats.lodColor('stein');
        lod.withTint({ top: 1, bottom: 1, hue: [st.r, st.g, st.b] }, () => lod.box('mork', (x0 + x1) / 2, (top - 0.3) / 2, zc, x1 - x0, top + 0.3, 0.7, { skip: ['bottom'] }));
    };
    // Muren går mellom åpningene: allmenningen og trappene.
    const hull = [o.allm, ...(o.trapper ?? [])].sort((p, q) => p[0] - q[0]);
    let fra = a;
    for (const [h0, h1] of hull) {
        mur(fra, Math.min(b, h0));
        fra = Math.max(fra, h1);
    }
    mur(fra, b);
    // Endene av gata: en mur med brystning mot det som ligger lavere.
    for (const [x, s] of [[o.xw, 1], [o.xe, -1]] as const) {
        if (x < a - 0.01 || x > b + 0.01) continue;
        const z1 = s < 0 ? o.maria.z : GATE.gjerde;
        k.withTint(STEIN, () => k.box('stein', x + s * 0.35, (y + 0.6) / 2, (GATE.mur0 + z1) / 2, 0.7, y + 1.2, z1 - GATE.mur0, { skip: ['bottom'], shadeFoot: true }));
        c.box(x + s * 0.35, (y + 1.6) / 2, (GATE.mur0 + z1) / 2, 0.7, y + 2.2, z1 - GATE.mur0);
    }

    // Husene på nordsida, og gjerdene i smugene.
    let dor: THREE.Vector3 | null = null;
    for (const h of plan.hus) {
        if (h.x < a || h.x >= b) continue;
        const m = new THREE.Matrix4().makeRotationY(h.rot).setPosition(h.x, y, h.z);
        k.matrix = m.clone();
        c.matrix = m.clone();
        hus(k, c, h.spec);
        lod.matrix = m.clone();
        husLod(lod, h.spec, (key) => mats.lodColor(key));
        if (h.olstue) {
            const ki = new MeshKit();
            ki.matrix = m.clone();
            const info = schotstue(ki, c, h.spec);
            // Ølstua er bergensernes: de samme plassene som i schøtstua, men andre folk [S].
            const bytt: Partial<Record<FigurNavn, FigurNavn>> = { svenn: 'fisker', dreng: 'kornselger', stuedreng: 'olkone', husbonde: 'borger' };
            for (const p of info.folk) {
                const figur = bytt[p.figur] ?? p.figur;
                plasser.push({ ...p, figur, id: figur === 'olkone' ? 'gunhild' : undefined, pos: p.pos.clone().applyMatrix4(m), yaw: p.yaw + h.rot });
            }
            const f = new Ild({ smokeTop: eaveY(h.spec) + riseOf(h.spec) - 0.3 - info.ild.y, spread: 0.45 });
            f.group.position.copy(info.ild).applyMatrix4(m);
            ilder.push(f);
            ild.push(f.group.position.clone().setY(f.group.position.y + 0.5));
            rom.push({ box: info.rom.box.clone().applyMatrix4(m), demp: info.rom.demp });
            // Ilden synes bare gjennom døra: den skjules på avstand sammen med innredningen.
            const g = toGroup(ki, mats, 'olstue:inne', false);
            g.add(f.group);
            near.add(g);
            inne.push(g);
            dor = V(h.x + (h.spec.doors?.[0].z ?? 2), y, GATE.hus);
            // Øltønner ved døra [S].
            k.matrix = new THREE.Matrix4().makeTranslation(0, y, 0);
            c.matrix = k.matrix.clone();
            for (const [dx, dz, t] of [[-1.3, -0.55, 0.85], [-2.0, -0.6, 0.75], [3.2, -0.6, 0.9]] as const) tonne(k, c, dor.x + dx, GATE.hus + dz, t);
        }
    }
    // Vestenden: et hus på tvers med gavlen mot gata, så gata ikke ender i lufta. Bare kulisse, bak grensa.
    if (a <= o.xw + 0.01) {
        const spec: HouseSpec = {
            w: 8.5, l: 7, floors: [2.6, 2.3], roof: 'torv', pitch: 0.85, tint: T(0.9, DARK),
            cornersFront: true, cornersBack: true, hodeSeg: 5,
            glugger: [{ side: 0, at: -1.6, floor: 1 }, { side: 0, at: 1.8, floor: 0, open: true }, { side: 0, at: 0, floor: 2 }],
        };
        const m = new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(o.xw - 0.8, y, GATE.mur0 + 4.4);
        k.matrix = m.clone();
        c.matrix = m.clone();
        hus(k, c, spec);
        lod.matrix = m.clone();
        husLod(lod, spec, (key) => mats.lodColor(key));
    }
    k.matrix = new THREE.Matrix4();
    c.matrix = new THREE.Matrix4();
    lod.matrix = new THREE.Matrix4();
    for (const [x0, x1] of plan.gjerder) {
        const g0 = Math.max(a, x0);
        const g1 = Math.min(b, x1);
        if (g1 > g0) gjerde(k, c, g0, g1, GATE.gjerde);
    }
    // Der smugene møter muren foran Nikolaikirkegården: et gjerde på tvers fram til muren, ellers
    // kommer man inn på kirkegården bak husene. (Mariakirkegården har mur hele veien rundt.)
    for (const x of plan.ender) {
        if (x < a - 0.01 || x > b + 0.01) continue;
        gjerdeZ(k, c, x, o.nikolai.z, GATE.gjerde);
    }

    const folk = gatefolk(a, b, dor);
    const f = await lagFolk([...plasser, ...folk.plasser], mats, Math.round(a) + 77, folk.ruter);
    // Lenger unna enn SAMLET_R kaster gata ikke skygge (som gårdene): samme geometri, en kopi uten
    // skygge. Fra gårdsrommene ligger gata bak, og skyggene kostet ett tegnekall til per materiale.
    const naer = toGroup(k, mats, 'ovregaten');
    const uten = naer.clone();
    uten.traverse((x) => (x.castShadow = false));
    near.add(naer, uten, f.group);
    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial());
    mid.name = 'ovregaten:lod';
    return {
        near, mid, inne, rom, ild, colliders: [...c.specs, ...f.colliders], samlet: { delt: [naer], samlet: uten },
        gaaende: f.gaaende, snakkbare: f.snakkbare, drypp: k.skjegg,
        tick: (t, dt, ctx) => {
            ilder.forEach((x) => x.update(t, dt));
            f.tick(t, dt, ctx);
        },
        dispose: () => {
            ilder.forEach((x) => x.dispose());
            f.dispose();
        },
    };
}

/** Gata som celler langs x: kuttet ved kirkegårdene og ellers omtrent hver 40. meter. */
export function gateCeller(mats: Materials, o: GateOppsett): CellDef[] {
    const plan = planHus(o);
    const kutt = [o.xw, o.nikolai.x[0], o.nikolai.x[1], o.maria.x[0], o.xe];
    // Lange avsnitt deles i biter på rundt 40 m.
    const grenser: number[] = [];
    for (let i = 0; i + 1 < kutt.length; i++) {
        const n = Math.max(1, Math.round((kutt[i + 1] - kutt[i]) / 40));
        for (let j = 0; j < n; j++) grenser.push(kutt[i] + ((kutt[i + 1] - kutt[i]) * j) / n);
    }
    grenser.push(o.xe);
    const zMid = (GATE.mur0 + GATE.bak) / 2;
    return grenser.slice(0, -1).map((a, i) => {
        const b = grenser[i + 1];
        return {
            id: `ovregaten-${i}`,
            center: new THREE.Vector2((a + b) / 2, zMid),
            half: new THREE.Vector2((b - a) / 2, (GATE.bak - GATE.mur0) / 2),
            build: () => buildGateCell(mats, o, plan, a, b),
            naerR: 45,
        };
    });
}
