// Verkstedbodene i Vågsbunnen: et lite laftehus med gavlen mot gata, døra på den ene siden og en
// luke på den andre som er slått opp. Under luka er disken der varene ligger, og innenfor sitter
// og står håndverkeren og arbeider.
//
// Det vi vet [V Byleksikon «Skostredet»]: langs Skostredet sto det opptil 36 skomakerboder med to
// håndverkere i hver, og de hadde brygger mot Vågen. [V Wikipedia]: de fem tyske lauene («de fif
// Amten») var skomakerne, bakerne, gullsmedene, buntmakerne (som syr pels) og barbererne, rundt 150
// mann. Hvordan en bod så ut innvendig i 1420-årene, er ikke funnet [K]. Luka som slås opp til et
// skjermtak over disken, skiltene og alt inne er valgt etter eldre bilder av boder i Nord-Europa [S].
//
// Bodens eget rom: x på tvers (0 = midt), z innover fra gavlen mot gata (z = 0, gata på -z), y opp.
// Alt havner i husets bøtter (ingen nye materialer): det glødende i ovnen og essa går i `glod`, en
// egen MeshKit som cella tegner med et selvlysende materiale.
import * as THREE from 'three';
import type { ColliderKit, MeshKit, Tint } from '../motor/meshkit';
import { sekker } from './bu';
import { DARK, WARM } from './gard';
import { STEIN } from './stein';
import type { Plass } from './folk';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export type Fag = 'skomaker' | 'baker' | 'gullsmed' | 'buntmaker' | 'barberer' | 'smed';

export interface VerkstedSpec {
    fag: Fag;
    w: number;
    l: number;
    /** Takfoten. */
    h: number;
    pitch: number;
    roof: 'torv' | 'bordtak';
    tint: Tint;
    /** Hvilken side døra står på (-1 = -x). Luka og disken er på den andre. */
    dor: -1 | 1;
}

export interface VerkstedInfo {
    /** Folkene, i bodens rom. */
    folk: Plass[];
    /** Ildstedet (ovnen eller essa), i bodens rom. */
    ild: THREE.Vector3 | null;
    /** Rommet inne, i bodens rom. */
    rom: THREE.Box3;
    /** Røykhullet i taket over ildstedet. */
    royk: THREE.Vector3 | null;
    /** Der skiltet henger i armen (tauet festes her), i bodens rom. */
    skilt: THREE.Vector3;
}

const T = 0.2; // veggtykkelse
const DISK_Y = 0.92;
const LUKE_Y = 2.0;
const SKINN: [number, number, number] = [0.95, 0.72, 0.52];
const MESSING: Tint = { top: 1.9, bottom: 1.9, hue: [1.25, 1.02, 0.45] };
const LAER: Tint = { top: 0.55, bottom: 0.55, hue: [1.0, 0.78, 0.58] };

/** Hele boden. `k` får huset, `ki` innredningen og `glod` det som gløder. */
export function verksted(k: MeshKit, ki: MeshKit, glod: MeshKit, c: ColliderKit, s: VerkstedSpec, r: () => number): VerkstedInfo {
    const { w, l, h } = s;
    const hw = w / 2;
    const rise = hw * s.pitch;
    const aapen = s.fag === 'smed'; // smia har ingen frontvegg under luka: varmen og røyken må ut
    // Døra og luka langs fronten.
    const d0 = s.dor < 0 ? -hw + T + 0.15 : hw - T - 1.1;
    const d1 = d0 + 0.95;
    const l0 = s.dor < 0 ? d1 + 0.35 : -hw + T + 0.25;
    const l1 = s.dor < 0 ? hw - T - 0.25 : d0 - 0.35;

    k.withTint(s.tint, () => {
        // Svill og golv (nesten i flukt med gata, så man går rett inn).
        k.withTint({ ...s.tint, top: s.tint.top * 0.7 }, () => k.box('raatre', 0, 0.06, l / 2, w + 0.06, 0.12, l + 0.06, { skip: ['bottom', 'top'] }));
        k.withTint({ top: 0.8, bottom: 0.8, hue: WARM }, () => k.box('gardsrom', 0, 0.04, l / 2, w - 2 * T, 0.08, l - 2 * T, { skip: ['bottom'], grain: 'x' }));
        // Bakveggen og sideveggene.
        const vegg = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => {
            if (sx < 0.01 || sy < 0.01 || sz < 0.01) return;
            k.box('laft', cx, cy, cz, sx, sy, sz, { skip: ['bottom'], shadeFoot: cy - sy / 2 < 0.1 });
            c.box(cx, cy, cz, sx, sy, sz);
        };
        vegg(0, h / 2, l - T / 2, w, h, T);
        for (const sx of [-1, 1]) vegg(sx * (hw - T / 2), h / 2, l / 2, T, h, l - 2 * T + 0.002);
        // Fronten: stolper, døra, disken under luka, og vegg over dem.
        const fz = T / 2;
        const seg = (a: number, b: number, y0: number, y1: number) => vegg((a + b) / 2, (y0 + y1) / 2, fz, b - a, y1 - y0, T);
        const kant = [[-hw, Math.min(d0, l0)], [Math.min(d1, l1), Math.max(d0, l0)], [Math.max(d1, l1), hw]].map(([a, b]) => [a, b] as const);
        for (const [a, b] of kant) seg(a, b, 0, h);
        seg(d0, d1, 1.95, h);
        seg(l0, l1, LUKE_Y, h);
        if (!aapen) seg(l0, l1, 0, DISK_Y - 0.03);
        // Stolper i hjørnene og ved åpningene: gir fronten ramme.
        k.withTint({ top: 0.62, bottom: 0.62 }, () => {
            for (const x of [-hw + 0.08, hw - 0.08]) for (const z of [0.08, l - 0.08]) k.log('raatre', V(x, 0, z), V(x, h + 0.05, z), 0.11, 6);
            for (const x of [d0, d1, l0, l1]) k.box('raatre', x, h / 2, -0.03, 0.12, h, 0.08);
            k.box('raatre', (d0 + d1) / 2, 1.97, -0.03, d1 - d0 + 0.12, 0.1, 0.08);
            k.box('raatre', (l0 + l1) / 2, LUKE_Y, -0.03, l1 - l0 + 0.12, 0.1, 0.08);
        });
        // Gavlene, utenfra og innenfra (innsida synes fra rommet under taket).
        const tri = (z: number, ut: -1 | 1) => {
            const a = V(ut < 0 ? hw : -hw, h, z);
            const b = V(ut < 0 ? -hw : hw, h, z);
            const top = V(0, h + rise, z);
            k.tri('laft', a, b, top, [a.x, h], [b.x, h], [0, h + rise]);
        };
        tri(0, -1);
        tri(T, 1);
        tri(l, 1);
        tri(l - T, -1);
        // Taket: torv eller bord, over en tett bordkledning man ser innenfra. Stikker ut foran.
        const a = Math.atan(s.pitch);
        const over = 0.4;
        const foran = 0.55;
        const tl = l + over + foran;
        const tz = (l + over - foran) / 2;
        const th = s.roof === 'torv' ? 0.3 : 0.06;
        for (const side of [-1, 1]) {
            const m = new THREE.Matrix4().makeRotationZ(-side * a).setPosition((side * (hw + over)) / 2, h + rise / 2 - (over * s.pitch) / 2 + th / 2, tz);
            k.withTint({ top: 0.85, bottom: 0.85 }, () => k.slab(s.roof, m, (hw + over) / Math.cos(a), th, tl, { grain: 'x' }));
            if (s.roof === 'torv') {
                const mi = new THREE.Matrix4().makeRotationZ(-side * a).setPosition((side * (hw + over)) / 2, h + rise / 2 - (over * s.pitch) / 2 - 0.03, tz);
                k.withTint({ top: 0.7, bottom: 0.7, hue: DARK }, () => k.slab('bordtak', mi, (hw + over) / Math.cos(a), 0.05, tl - 0.02, { grain: 'x' }));
            }
            // Takskjegget langs sidene drypper (drypp.ts).
            k.takskjegg(V(side * (hw + over), h - over * s.pitch, -foran), V(side * (hw + over), h - over * s.pitch, l + over));
        }
        k.withTint({ top: 0.7, bottom: 0.7 }, () => k.log('raatre', V(0, h + rise + 0.05, -foran), V(0, h + rise + 0.05, l + over), 0.1, 6));
        c.box(0, h + rise / 2, l / 2, w + 0.8, rise, l + 0.8);
    });

    // Disken med luka over, slått opp og holdt av to stenger: et lite tak over varene [S].
    const lm = (l0 + l1) / 2;
    const lw = l1 - l0;
    k.withTint({ top: 0.8, bottom: 0.8, hue: [1.05, 0.98, 0.9] }, () => k.box('raatre', lm, DISK_Y, -0.08, lw + 0.1, 0.07, 0.62, { grain: 'x' }));
    c.box(lm, DISK_Y / 2 + 0.02, -0.06, lw + 0.1, DISK_Y + 0.04, 0.62, true);
    const lukeH = LUKE_Y - DISK_Y - 0.08;
    const vinkel = 1.15;
    const ml = new THREE.Matrix4().makeTranslation(lm, LUKE_Y, -0.02).multiply(new THREE.Matrix4().makeRotationX(vinkel)).multiply(new THREE.Matrix4().makeTranslation(0, -lukeH / 2, -0.03));
    k.withTint({ ...s.tint, top: s.tint.top * 0.85 }, () => k.slab('bordvegg', ml, lw, lukeH, 0.05));
    const lukeEnde = V(0, -lukeH, 0).applyAxisAngle(V(1, 0, 0), vinkel);
    k.withTint({ top: 0.6, bottom: 0.6 }, () => {
        for (const x of [l0 + 0.1, l1 - 0.1]) k.log('raatre', V(x, DISK_Y + 0.04, -0.3), V(x, LUKE_Y + lukeEnde.y + 0.02, lukeEnde.z - 0.02), 0.025, 5);
    });
    if (aapen) {
        // Smia: bare en lav bom foran, og ingen disk-forkle.
        k.withTint({ top: 0.6, bottom: 0.6 }, () => k.box('raatre', lm, 0.5, 0.1, lw, 0.1, 0.12));
    }

    // Skiltet: en arm ut fra gavlen over døra, med fagets tegn hengende i den [S].
    const sx = (d0 + d1) / 2;
    k.withTint({ top: 0.6, bottom: 0.6 }, () => {
        k.log('raatre', V(sx, 2.75, 0), V(sx, 2.75, -1.0), 0.04, 5);
        k.log('raatre', V(sx, 2.35, 0), V(sx, 2.75, -0.6), 0.025, 4);
    });
    // Selve tegnet henger i et tau og svinger i vinden: cella lager det med `skiltHeng` (uro.ts).

    // Innredningen.
    const inne = innredning(ki, glod, c, s, { l0, l1, d0, d1 }, r);
    return { ...inne, rom: new THREE.Box3(V(-hw + T, 0, T), V(hw - T, h + rise * 0.6, l - T)), skilt: V(sx, 2.73, -0.9) };
}

/** Tauet og fagets tegn under, med festet i origo: henges i en `Uro.pendel`. */
export function skiltHeng(k: MeshKit, fag: Fag): void {
    k.withTint({ top: 0.55, bottom: 0.55, hue: [1.1, 1.0, 0.8] }, () => k.log('mork', V(0, 0, 0), V(0, -0.28, 0), 0.008, 3, false));
    skilt(k, fag, 0, -0.33, 0);
}

/** Fagets tegn i skiltarmen. */
function skilt(k: MeshKit, fag: Fag, x: number, y: number, z: number): void {
    k.at(x, y, z, 0, () => {
        if (fag === 'skomaker') {
            // En sko: såle, overlær og hæl.
            k.withTint(LAER, () => {
                k.box('raatre', 0, -0.2, 0, 0.12, 0.05, 0.36);
                k.box('raatre', 0, -0.12, 0.05, 0.11, 0.13, 0.22);
                k.box('raatre', 0, -0.06, 0.1, 0.1, 0.12, 0.1);
            });
        } else if (fag === 'baker') {
            // Et brød.
            k.withTint({ top: 0.95, bottom: 0.95, hue: [1.2, 0.82, 0.5] }, () => k.withUv(0.05, () => k.log('raatre', V(0, -0.13, -0.13), V(0, -0.13, 0.13), 0.08, 8, true, 0.08)));
        } else if (fag === 'gullsmed') {
            // Et beger.
            k.withTint(MESSING, () => {
                k.log('raatre', V(0, -0.3, 0), V(0, -0.26, 0), 0.08, 8, true);
                k.log('raatre', V(0, -0.26, 0), V(0, -0.16, 0), 0.025, 6, false);
                k.log('raatre', V(0, -0.16, 0), V(0, -0.02, 0), 0.06, 8, true, 0.1);
            });
        } else if (fag === 'buntmaker') {
            // Et skinn: en flate med pels som henger.
            k.withTint({ top: 0.7, bottom: 0.7, hue: [1.1, 0.85, 0.6] }, () => k.box('raatre', 0, -0.25, 0, 0.04, 0.42, 0.3));
            k.withTint({ top: 0.7, bottom: 0.7, hue: [1.1, 0.85, 0.6] }, () => k.box('raatre', 0, -0.5, 0, 0.04, 0.12, 0.06));
        } else if (fag === 'barberer') {
            // Bekkenet: et grunt fat av messing. Skiltet er kjent fra senere tid [U].
            k.withTint(MESSING, () => k.log('raatre', V(0, -0.15, -0.02), V(0, -0.15, 0.02), 0.2, 12, true, 0.2));
        } else {
            // Smeden: en hestesko.
            k.withTint({ top: 0.35, bottom: 0.35 }, () => {
                for (let i = 0; i < 6; i++) {
                    const a0 = Math.PI * 0.15 + (i / 6) * Math.PI * 1.7;
                    const a1 = Math.PI * 0.15 + ((i + 1) / 6) * Math.PI * 1.7;
                    k.log('mork', V(0, -0.18 + Math.cos(a0) * 0.12, Math.sin(a0) * 0.12), V(0, -0.18 + Math.cos(a1) * 0.12, Math.sin(a1) * 0.12), 0.02, 4);
                }
            });
        }
    });
}

interface Front {
    l0: number;
    l1: number;
    d0: number;
    d1: number;
}

/** Hylle på veggen innerst: to konsoller og en planke. */
function hylle(k: MeshKit, x0: number, x1: number, y: number, z: number): void {
    k.withTint({ top: 0.75, bottom: 0.75, hue: WARM }, () => k.box('raatre', (x0 + x1) / 2, y, z, x1 - x0, 0.04, 0.3, { grain: 'x' }));
}

/** Krakk eller benk: sete på fire bein. */
function krakk(k: MeshKit, c: ColliderKit, x: number, z: number, w: number, d: number, y = 0.45): void {
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
        k.box('raatre', x, y - 0.03, z, w, 0.06, d);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('raatre', x + sx * (w / 2 - 0.06), (y - 0.06) / 2, z + sz * (d / 2 - 0.05), 0.05, y - 0.06, 0.05);
    });
    c.box(x, y / 2, z, w, y, d, true);
}

/** Bord med plate i høyden `y`. */
function bord(k: MeshKit, c: ColliderKit, x: number, z: number, w: number, d: number, y = 0.8): void {
    k.withTint({ top: 0.78, bottom: 0.78, hue: WARM }, () => {
        k.box('raatre', x, y - 0.03, z, w, 0.06, d, { grain: 'x' });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('raatre', x + sx * (w / 2 - 0.07), (y - 0.06) / 2, z + sz * (d / 2 - 0.07), 0.07, y - 0.06, 0.07);
    });
    c.box(x, y / 2, z, w, y, d, true);
}

/** Et par sko: tynn såle og et avrundet overlær som smalner mot tåa (snabelsko var mote [U]). */
function sko(k: MeshKit, x: number, y: number, z: number, rot: number, t: Tint = LAER): void {
    k.at(x, y, z, rot, () => {
        k.withTint(t, () => {
            for (const dx of [-0.055, 0.055]) {
                k.box('raatre', dx, 0.008, 0.01, 0.07, 0.016, 0.24);
                k.log('raatre', V(dx, 0.04, -0.1), V(dx, 0.035, 0.12), 0.038, 7, true, 0.018);
                k.log('raatre', V(dx, 0.02, -0.09), V(dx, 0.085, -0.075), 0.036, 7, true, 0.034);
            }
        });
    });
}

function innredning(k: MeshKit, glod: MeshKit, c: ColliderKit, s: VerkstedSpec, f: Front, r: () => number): { folk: Plass[]; ild: THREE.Vector3 | null; royk: THREE.Vector3 | null } {
    const hw = s.w / 2;
    const l = s.l;
    const xi0 = -hw + T;
    const xi1 = hw - T;
    const lm = (f.l0 + f.l1) / 2;
    const folk: Plass[] = [];
    let ild: THREE.Vector3 | null = null;
    let royk: THREE.Vector3 | null = null;
    const INN = 0; // figurene ser mot gata (-z) når yaw = π
    const GATA = Math.PI;
    const disk = (fn: () => void) => k.at(lm, DISK_Y + 0.035, -0.15, 0, fn);
    // Det samme i begge fag med disk: varene ligger der, og en hylle innerst.
    hylle(k, xi0 + 0.3, xi1 - 0.3, 1.5, l - T - 0.16);

    if (s.fag === 'skomaker') {
        // To skomakere [V]: den ene sitter ved disken og syr, den andre ved benken innerst.
        disk(() => {
            for (let i = 0; i < 4; i++) sko(k, -0.5 + i * 0.34, 0, -0.05 + (i % 2) * 0.12, (r() - 0.5) * 0.6);
        });
        for (let i = 0; i < 5; i++) sko(k, xi0 + 0.5 + i * 0.4, 1.52, l - T - 0.16, 0.1, i % 2 ? LAER : { top: 0.38, bottom: 0.38, hue: [1, 0.85, 0.7] });
        // Lester (tremodeller av foten) på den øvre hylla.
        hylle(k, xi0 + 0.3, xi1 - 0.3, 1.95, l - T - 0.16);
        k.withTint({ top: 0.9, bottom: 0.9, hue: [1.1, 0.98, 0.82] }, () => {
            for (let i = 0; i < 7; i++) k.box('raatre', xi0 + 0.45 + i * 0.3, 2.03, l - T - 0.16, 0.08, 0.1, 0.22);
        });
        // Skinn i en stabel, og lærstykker på arbeidsbenken.
        k.withTint({ top: 0.6, bottom: 0.6, hue: SKINN }, () => {
            for (let i = 0; i < 5; i++) k.box('raatre', xi1 - 0.55 + (r() - 0.5) * 0.06, 0.05 + i * 0.04, l - 1.0, 0.8, 0.035, 0.6);
        });
        krakk(k, c, lm, 0.75, 0.4, 0.35, 0.42);
        bord(k, c, lm - 0.6, l - 1.0, 0.9, 0.55, 0.6);
        krakk(k, c, lm - 0.6, l - 1.7, 0.4, 0.35, 0.42);
        k.withTint(LAER, () => k.box('raatre', lm - 0.6, 0.62, l - 1.0, 0.4, 0.02, 0.3));
        folk.push({ figur: 'skomaker', rolle: 'spise', pos: V(lm, 0.42, 0.75), yaw: GATA });
        folk.push({ figur: 'skomakersvenn', rolle: 'spise', pos: V(lm - 0.6, 0.42, l - 1.7), yaw: INN });
    } else if (s.fag === 'baker') {
        // Bakerovnen innerst: en kuppel av stein med et munnhull som gløder, og en ljore over.
        const oz = l - T - 0.9;
        const ox = s.dor < 0 ? xi1 - 0.85 : xi0 + 0.85;
        k.withTint(STEIN, () => {
            k.box('stein', ox, 0.45, oz, 1.5, 0.9, 1.6);
            for (let i = 0; i < 4; i++) {
                const rr = 0.72 - i * 0.16;
                k.log('stein', V(ox, 0.9 + i * 0.16, oz - rr), V(ox, 0.9 + i * 0.16, oz + rr), rr, 10, true, rr);
            }
            k.box('stein', ox, 1.6, oz + 0.5, 0.35, 1.2, 0.35); // pipa
        });
        c.box(ox, 0.75, oz, 1.5, 1.5, 1.6);
        // Munnhullet mot rommet gløder.
        glod.at(ox, 0, oz, 0, () => glod.withTint({ top: 1, bottom: 1, hue: [1, 0.45, 0.12] }, () => glod.box('mork', 0, 1.0, -0.79, 0.45, 0.32, 0.02)));
        ild = V(ox, 1.0, oz - 1.2);
        royk = V(ox, s.h + 0.6, oz + 0.5);
        // Brød på disken og i kurver, melsekker og deigtrauet.
        disk(() => {
            for (let i = 0; i < 7; i++) {
                const x = -0.7 + i * 0.22;
                k.withTint({ top: 1.1 + r() * 0.15, bottom: 1.1, hue: [1.15, 0.88, 0.58] }, () => k.log('raatre', V(x, 0.07, -0.18), V(x, 0.07, 0.12), 0.07, 7, true, 0.07));
            }
        });
        sekker(k, c, { x0: xi0 + 0.2, x1: xi0 + 0.8, z0: 1.2, z1: 2.4 }, 0, r);
        const tx = s.dor < 0 ? xi0 + 0.7 : xi1 - 0.7;
        k.withTint({ top: 0.75, bottom: 0.75, hue: WARM }, () => {
            k.box('raatre', tx, 0.75, l - 2.0, 0.6, 0.3, 1.4);
            for (const dz of [-0.55, 0.55]) k.box('raatre', tx, 0.3, l - 2.0 + dz, 0.5, 0.6, 0.08);
        });
        k.withTint({ top: 1.35, bottom: 1.35, hue: [1.1, 1.0, 0.85] }, () => k.withUv(0.04, () => k.box('raatre', tx, 0.9, l - 2.0, 0.5, 0.02, 1.3)));
        c.box(tx, 0.45, l - 2.0, 0.6, 0.9, 1.4, true);
        // Bakeren elter deigen; dregnen bærer brød ut til disken.
        folk.push({ figur: 'baker', rolle: 'rore', pos: V(tx + (s.dor < 0 ? 0.55 : -0.55), 0, l - 2.0), yaw: s.dor < 0 ? -Math.PI / 2 : Math.PI / 2 });
        folk.push({ figur: 'bakerdreng', rolle: 'staa', pos: V(lm, 0, 0.8), yaw: GATA });
    } else if (s.fag === 'gullsmed') {
        // En liten esse av stein med glør, ambolt på en stubbe og arbeidsbordet med verktøy.
        const ex = s.dor < 0 ? xi1 - 0.5 : xi0 + 0.5;
        const ez = l - T - 0.55;
        k.withTint(STEIN, () => k.box('stein', ex, 0.45, ez, 0.8, 0.9, 0.8));
        c.box(ex, 0.45, ez, 0.8, 0.9, 0.8);
        glod.withTint({ top: 1, bottom: 1, hue: [1, 0.4, 0.1] }, () => glod.box('mork', ex, 0.91, ez, 0.4, 0.02, 0.4));
        ild = V(ex, 1.2, ez - 0.5);
        royk = V(ex, s.h + 0.5, ez);
        k.withTint({ top: 0.6, bottom: 0.6 }, () => k.log('raatre', V(ex - 0.9 * Math.sign(ex), 0, ez - 0.2), V(ex - 0.9 * Math.sign(ex), 0.55, ez - 0.2), 0.18, 8));
        k.withTint({ top: 0.3, bottom: 0.3, hue: [0.9, 0.95, 1] }, () => k.box('mork', ex - 0.9 * Math.sign(ex), 0.62, ez - 0.2, 0.12, 0.12, 0.25));
        c.box(ex - 0.9 * Math.sign(ex), 0.3, ez - 0.2, 0.4, 0.6, 0.4, true);
        bord(k, c, lm, 1.0, Math.min(1.4, f.l1 - f.l0 - 0.2), 0.6, 0.8);
        k.withTint(MESSING, () => {
            for (let i = 0; i < 4; i++) k.log('raatre', V(lm - 0.45 + i * 0.3, 0.8, 1.0), V(lm - 0.45 + i * 0.3, 0.86, 1.0), 0.04, 6, true, 0.05);
        });
        // På disken: begre og spenner som skinner.
        disk(() => {
            k.withTint(MESSING, () => {
                for (let i = 0; i < 4; i++) {
                    const x = -0.5 + i * 0.33;
                    k.log('raatre', V(x, 0, 0), V(x, 0.03, 0), 0.05, 8, true);
                    k.log('raatre', V(x, 0.03, 0), V(x, 0.13, 0), 0.04, 8, true, 0.06);
                }
            });
        });
        folk.push({ figur: 'gullsmed', rolle: 'skrive', pos: V(lm, 0, 1.55), yaw: GATA });
    } else if (s.fag === 'buntmaker') {
        // Pelser som henger fra en stang under taket, og en stabel på disken.
        const pels = (x: number, y: number, z: number, t: [number, number, number], len: number) =>
            k.withTint({ top: 0.75 + r() * 0.3, bottom: 0.6, hue: t }, () => k.withUv(0.06, () => k.box('raatre', x, y - len / 2, z, 0.05, len, 0.38 + r() * 0.12)));
        const farger: [number, number, number][] = [[1.1, 0.85, 0.6], [0.8, 0.72, 0.62], [1.2, 1.15, 1.05], [0.6, 0.5, 0.45], [1.05, 0.7, 0.45]];
        k.withTint({ top: 0.6, bottom: 0.6 }, () => k.log('raatre', V(xi0, 2.2, l / 2 + 0.3), V(xi1, 2.2, l / 2 + 0.3), 0.04, 5));
        for (let x = xi0 + 0.3; x < xi1 - 0.2; x += 0.32) pels(x, 2.15, l / 2 + 0.3, farger[Math.floor(r() * farger.length)], 0.7 + r() * 0.4);
        disk(() => {
            for (let i = 0; i < 4; i++) {
                k.withTint({ top: 0.8, bottom: 0.8, hue: farger[i % farger.length] }, () => k.withUv(0.06, () => k.box('raatre', -0.25 + (r() - 0.5) * 0.1, 0.03 + i * 0.05, 0, 0.9, 0.05, 0.42)));
            }
        });
        // Et skinn spent ut i en ramme ved veggen.
        const rx = s.dor < 0 ? xi1 - 0.1 : xi0 + 0.1;
        k.withTint({ top: 0.6, bottom: 0.6 }, () => {
            for (const z of [l - 2.2, l - 1.0]) k.log('raatre', V(rx, 0.4, z), V(rx, 1.8, z), 0.03, 5);
            for (const y of [0.45, 1.75]) k.log('raatre', V(rx, y, l - 2.2), V(rx, y, l - 1.0), 0.03, 5);
        });
        k.withTint({ top: 0.9, bottom: 0.9, hue: [1.25, 1.05, 0.8] }, () => k.box('raatre', rx, 1.1, l - 1.6, 0.02, 1.2, 1.0));
        krakk(k, c, lm + 0.3, 1.2, 0.4, 0.35, 0.42);
        folk.push({ figur: 'buntmaker', rolle: 'spise', pos: V(lm + 0.3, 0.42, 1.2), yaw: GATA });
    } else if (s.fag === 'barberer') {
        // Stolen med en kunde, et kar med vann og bekkenet på en krakk. Barbereren står bak.
        const sx = lm;
        const sz = 1.5;
        k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
            k.box('raatre', sx, 0.42, sz, 0.55, 0.06, 0.5);
            k.box('raatre', sx, 0.85, sz + 0.24, 0.55, 0.85, 0.06);
            for (const dx of [-0.25, 0.25]) for (const dz of [-0.2, 0.2]) k.box('raatre', sx + dx, 0.2, sz + dz, 0.05, 0.4, 0.05);
        });
        c.box(sx, 0.45, sz, 0.6, 0.9, 0.6, true);
        folk.push({ figur: 'borger', rolle: 'sitte', pos: V(sx, 0.45, sz - 0.05), yaw: GATA });
        folk.push({ figur: 'barberer', rolle: 'rore', pos: V(sx, 0, sz + 0.7), yaw: GATA });
        const kx = s.dor < 0 ? xi1 - 0.5 : xi0 + 0.5;
        k.withTint({ top: 0.75, bottom: 0.75, hue: WARM }, () => k.log('raatre', V(kx, 0, l - 1.3), V(kx, 0.55, l - 1.3), 0.35, 12, true, 0.38));
        k.withTint({ top: 0.18, bottom: 0.18, hue: [0.8, 0.9, 1] }, () => k.log('mork', V(kx, 0.45, l - 1.3), V(kx, 0.5, l - 1.3), 0.33, 12, true));
        c.box(kx, 0.28, l - 1.3, 0.75, 0.55, 0.75, true);
        krakk(k, c, lm + (s.dor < 0 ? -0.9 : 0.9), 2.4, 0.4, 0.4, 0.6);
        k.withTint(MESSING, () => k.log('raatre', V(lm + (s.dor < 0 ? -0.9 : 0.9), 0.6, 2.4), V(lm + (s.dor < 0 ? -0.9 : 0.9), 0.66, 2.4), 0.17, 10, true, 0.2));
        // Linkluter på en snor.
        k.withTint({ top: 1.4, bottom: 1.4, hue: [1.05, 1.02, 0.95] }, () => k.withUv(0.04, () => {
            for (let i = 0; i < 3; i++) k.box('raatre', xi0 + 0.6 + i * 0.5, 1.85, l - T - 0.3, 0.3, 0.35, 0.01);
        }));
    } else {
        // Smia (norsk smed): essa med åpen ild, belgen, ambolten og slokkekaret [S].
        const ex = s.dor < 0 ? xi1 - 0.75 : xi0 + 0.75;
        const ez = l - T - 1.0;
        k.withTint(STEIN, () => {
            k.box('stein', ex, 0.4, ez, 1.2, 0.8, 1.4);
            k.box('stein', ex, 1.9, ez + 0.4, 0.9, 2.2, 0.6); // avtrekket opp mot taket
        });
        c.box(ex, 0.4, ez, 1.2, 0.8, 1.4);
        glod.withTint({ top: 1, bottom: 1, hue: [1, 0.42, 0.1] }, () => glod.box('mork', ex, 0.81, ez - 0.15, 0.6, 0.02, 0.6));
        ild = V(ex, 0.85, ez - 0.15);
        royk = V(ex, s.h + 0.8, ez + 0.4);
        // Belgen: to plater av tre med lær imellom.
        const bx = ex - 0.95 * Math.sign(ex);
        k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
            k.box('raatre', bx, 0.55, ez + 0.2, 0.5, 0.05, 0.9);
            k.box('raatre', bx, 0.85, ez + 0.2, 0.5, 0.05, 0.9);
        });
        k.withTint(LAER, () => k.box('raatre', bx, 0.7, ez + 0.2, 0.46, 0.27, 0.84));
        c.box(bx, 0.45, ez + 0.2, 0.55, 0.9, 0.95, true);
        // Ambolten på en stubbe midt i rommet, og slokkekaret.
        const ax = lm;
        const az = l / 2 + 0.3;
        k.withTint({ top: 0.6, bottom: 0.6 }, () => k.log('raatre', V(ax, 0, az), V(ax, 0.5, az), 0.25, 9));
        k.withTint({ top: 0.28, bottom: 0.28, hue: [0.9, 0.95, 1] }, () => {
            k.box('mork', ax, 0.62, az, 0.18, 0.22, 0.5);
            k.box('mork', ax, 0.76, az - 0.1, 0.22, 0.08, 0.6);
        });
        c.box(ax, 0.4, az, 0.55, 0.8, 0.65, true);
        k.withTint({ top: 0.75, bottom: 0.75, hue: DARK }, () => k.log('raatre', V(ax + 1.0 * -Math.sign(ex || 1), 0, az + 0.6), V(ax + 1.0 * -Math.sign(ex || 1), 0.5, az + 0.6), 0.3, 10, true, 0.33));
        c.box(ax + 1.0 * -Math.sign(ex || 1), 0.25, az + 0.6, 0.65, 0.5, 0.65, true);
        // Ferdig smidd: hestesko og spiker på bommen foran.
        k.withTint({ top: 0.35, bottom: 0.35 }, () => {
            for (let i = 0; i < 5; i++) k.box('mork', lm - 0.6 + i * 0.3, 0.58, 0.1, 0.12, 0.02, 0.12);
        });
        folk.push({ figur: 'smed', rolle: 'hamre', pos: V(ax, 0, az - 0.75), yaw: INN, id: 'asbjorn' });
    }
    return { folk, ild, royk };
}
