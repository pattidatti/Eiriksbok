import * as THREE from 'three';
import { mergeParts, type Part } from '../kit/mergeParts';

// Looken i Tre dager i porten: gresk polykromi (malt marmor, bronse, hoplitt-rødt) mot
// persisk glasert murstein (turkis, blått og gult). Alt her er rene three-objekter som lages
// én gang på modulnivå - ingen React. Figurene er slått sammen med mergeParts, så én perser
// er fem draw calls for HELE hæren (instanser), ikke fem per mann.

export const PAL = {
    sea: '#1fb3c4',
    seaDeep: '#0f7f9c',
    seaShallow: '#63dcd6',
    sand: '#e2a560',
    sandDark: '#c98b4e',
    cliff: '#c1693a',
    cliffLight: '#e0a062',
    cliffDark: '#8f4a2a',
    red: '#c8321f',
    redDark: '#8e1f14',
    bronze: '#d9a441',
    bronzeHi: '#ffd27a',
    glazeBlue: '#2c5fb3',
    glazeTurq: '#1fa6b8',
    glazeYellow: '#f2c230',
    blood: '#a3121c',
    marble: '#f4ecdc',
    marbleShade: '#dccbb0',
    ink: '#1d1712',
    skin: '#b9794c',
    skinGreek: '#c98a5a',
    wicker: '#e0b56a',
    wickerDark: '#b98a48',
    olive: '#6f7d3c',
    terracotta: '#d8743a',
};

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r: number, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
const cone = (r: number, h: number, s = 8) => new THREE.ConeGeometry(r, h, s);

// ---------------------------------------------------------------------------
// Teksturer (canvas, lokalt)
// ---------------------------------------------------------------------------

let _glow: THREE.CanvasTexture | null = null;
/** Myk rund glød: hvit i midten, gjennomsiktig i kanten. */
export function glowTexture() {
    if (_glow) return _glow;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    _glow = new THREE.CanvasTexture(c);
    return _glow;
}

let _puff: THREE.CanvasTexture | null = null;
/** Røyk- og støvdott: myk, litt ujevn kant. */
export function puffTexture() {
    if (_puff) return _puff;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    for (let i = 0; i < 6; i++) {
        const x = 32 + Math.cos(i * 1.7) * 8;
        const y = 32 + Math.sin(i * 2.3) * 8;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 22);
        g.addColorStop(0, 'rgba(255,255,255,0.45)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
    }
    _puff = new THREE.CanvasTexture(c);
    return _puff;
}

let _trail: THREE.CanvasTexture | null = null;
/** Våpensporet: lyst i tuppen, blekner bakover og ut mot kantene. */
export function trailTexture() {
    if (_trail) return _trail;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 32;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, 'rgba(255,220,140,0)');
    g.addColorStop(0.7, 'rgba(255,236,190,0.55)');
    g.addColorStop(1, 'rgba(255,255,240,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 32);
    const v = ctx.createLinearGradient(0, 0, 0, 32);
    v.addColorStop(0, 'rgba(0,0,0,1)');
    v.addColorStop(0.5, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 128, 32);
    _trail = new THREE.CanvasTexture(c);
    return _trail;
}

/** Meanderbord (gresk nøkkelmønster) i to farger, til frisen på muren. */
export function meanderTexture(fg: string, bg: string, band?: string) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 64);
    if (band) {
        ctx.fillStyle = band;
        ctx.fillRect(0, 0, 256, 8);
        ctx.fillRect(0, 56, 256, 8);
    }
    ctx.strokeStyle = fg;
    ctx.lineWidth = 6;
    ctx.lineCap = 'square';
    for (let i = 0; i < 4; i++) {
        const x = i * 64 + 6;
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, 14);
        ctx.lineTo(x + 44, 14);
        ctx.lineTo(x + 44, 42);
        ctx.lineTo(x + 18, 42);
        ctx.lineTo(x + 18, 26);
        ctx.lineTo(x + 30, 26);
        ctx.moveTo(x, 50);
        ctx.lineTo(x + 58, 50);
        ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
}

// ---------------------------------------------------------------------------
// Perserne - fem deler per type, alle bygget med fronten mot -z og føttene i y = 0.
// Skulder i (±0.26, 1.42), hånd 0.55 under skulderen, spydgrepet i hånda.
// ---------------------------------------------------------------------------

export const SHOULDER_Y = 1.42;
export const SHOULDER_X = 0.27;
export const ARM_LEN = 0.55;
export const HIP_Y = 0.84;
export const HIP_X = 0.11;
export const TIP_Z = -1.62;

export type Kind = 'lev' | 'imm' | 'boss';

function face(parts: Part[], y: number, skin: string, beard: string) {
    parts.push({ geometry: sph(0.165, 10, 8), position: [0, y, 0], color: skin });
    // Store øyne: perserne glor.
    parts.push({ geometry: box(0.085, 0.075, 0.03), position: [-0.065, y + 0.025, -0.148], color: '#fbf6ea' });
    parts.push({ geometry: box(0.085, 0.075, 0.03), position: [0.065, y + 0.025, -0.148], color: '#fbf6ea' });
    parts.push({ geometry: box(0.035, 0.045, 0.02), position: [-0.062, y + 0.02, -0.166], color: PAL.ink });
    parts.push({ geometry: box(0.035, 0.045, 0.02), position: [0.062, y + 0.02, -0.166], color: PAL.ink });
    // Buskete øyenbryn - de ser alltid litt fornærmet ut.
    parts.push({ geometry: box(0.09, 0.025, 0.03), position: [-0.065, y + 0.08, -0.15], rotation: [0, 0, -0.25], color: beard });
    parts.push({ geometry: box(0.09, 0.025, 0.03), position: [0.065, y + 0.08, -0.15], rotation: [0, 0, 0.25], color: beard });
    // Krøllet skjegg rundt haka.
    parts.push({ geometry: box(0.22, 0.1, 0.08), position: [0, y - 0.13, -0.11], color: beard });
    parts.push({ geometry: box(0.14, 0.08, 0.07), position: [0, y - 0.21, -0.1], color: beard });
    parts.push({ geometry: box(0.3, 0.12, 0.26), position: [0, y - 0.02, 0.06], color: beard });
}

function bodyParts(kind: Kind): Part[] {
    const p: Part[] = [];
    if (kind === 'lev') {
        // Meder: gul kjortel med blå bord, blå bukser (bena), myk filthatt.
        p.push({ geometry: cyl(0.2, 0.3, 0.64, 10), position: [0, 1.12, 0], color: PAL.glazeYellow });
        p.push({ geometry: cyl(0.302, 0.302, 0.09, 10), position: [0, 0.84, 0], color: PAL.glazeBlue });
        p.push({ geometry: cyl(0.215, 0.215, 0.07, 10), position: [0, 1.18, 0], color: PAL.glazeBlue });
        p.push({ geometry: box(0.06, 0.5, 0.02), position: [0, 1.12, -0.23], color: PAL.glazeBlue });
        face(p, 1.62, PAL.skin, '#3a2416');
        // Myk filtlue med tuppen bøyd framover, og kinnklaffer.
        p.push({ geometry: new THREE.SphereGeometry(0.185, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), position: [0, 1.7, 0.01], color: PAL.glazeTurq });
        p.push({ geometry: cone(0.1, 0.22, 8), position: [0, 1.93, -0.04], rotation: [-0.7, 0, 0], color: PAL.glazeTurq });
        p.push({ geometry: box(0.06, 0.2, 0.14), position: [-0.17, 1.6, 0.02], color: PAL.glazeTurq });
        p.push({ geometry: box(0.06, 0.2, 0.14), position: [0.17, 1.6, 0.02], color: PAL.glazeTurq });
        p.push({ geometry: cyl(0.19, 0.19, 0.04, 12), position: [0, 1.71, 0.01], color: PAL.red });
    } else if (kind === 'imm') {
        // De udødelige: lang blå kappe med gule bord og hvite rosetter, som på teglet fra Susa.
        p.push({ geometry: cyl(0.21, 0.34, 1.08, 12), position: [0, 0.92, 0], color: PAL.glazeBlue });
        p.push({ geometry: cyl(0.342, 0.342, 0.1, 12), position: [0, 0.42, 0], color: PAL.glazeYellow });
        p.push({ geometry: cyl(0.222, 0.222, 0.08, 12), position: [0, 1.2, 0], color: PAL.glazeYellow });
        p.push({ geometry: box(0.08, 0.9, 0.02), position: [0, 0.9, -0.29], rotation: [-0.1, 0, 0], color: PAL.glazeYellow });
        for (let i = 0; i < 6; i++)
            p.push({
                geometry: box(0.07, 0.07, 0.02),
                position: [(i % 2 ? 1 : -1) * 0.15, 0.6 + Math.floor(i / 2) * 0.22, -0.29 + i * 0.012],
                rotation: [-0.1, 0, Math.PI / 4],
                color: '#fbf6ea',
            });
        face(p, 1.62, '#a86a40', '#24160e');
        // Den riflede kronen.
        p.push({ geometry: cyl(0.175, 0.16, 0.2, 12), position: [0, 1.84, 0], color: PAL.glazeYellow });
        p.push({ geometry: cyl(0.18, 0.18, 0.04, 12), position: [0, 1.95, 0], color: '#fbf6ea' });
        // Kogger på ryggen.
        p.push({ geometry: box(0.14, 0.62, 0.12), position: [0.12, 1.25, 0.24], rotation: [0.25, 0, -0.3], color: '#7a4a24' });
        p.push({ geometry: box(0.16, 0.08, 0.14), position: [0.2, 1.56, 0.32], rotation: [0.25, 0, -0.3], color: PAL.glazeYellow });
    } else {
        // Hydarnes: gull og turkis, gyllen skjellbrynje og en fjærbusk av en annen verden.
        p.push({ geometry: cyl(0.23, 0.36, 1.12, 12), position: [0, 0.92, 0], color: PAL.glazeYellow });
        p.push({ geometry: cyl(0.25, 0.28, 0.5, 12), position: [0, 1.22, 0], color: '#e8b53a' });
        p.push({ geometry: cyl(0.362, 0.362, 0.1, 12), position: [0, 0.4, 0], color: PAL.glazeTurq });
        p.push({ geometry: cyl(0.26, 0.26, 0.08, 12), position: [0, 1.0, 0], color: PAL.glazeTurq });
        p.push({ geometry: box(0.7, 1.2, 0.05), position: [0, 1.0, 0.3], rotation: [0.12, 0, 0], color: '#6a1f7a' });
        face(p, 1.64, '#a86a40', '#1c110a');
        p.push({ geometry: cyl(0.18, 0.17, 0.26, 12), position: [0, 1.88, 0], color: PAL.glazeYellow });
        const plume = ['#c8321f', '#fbf6ea', PAL.glazeBlue, '#fbf6ea', '#c8321f'];
        plume.forEach((c, i) =>
            p.push({
                geometry: cone(0.07, 0.9, 6),
                position: [(i - 2) * 0.09, 2.35, 0.05],
                rotation: [0.2, 0, (i - 2) * -0.22],
                color: c,
            }),
        );
    }
    return p;
}

function legParts(kind: Kind): Part[] {
    const trousers = kind === 'lev' ? PAL.glazeBlue : kind === 'imm' ? '#e8dcc0' : PAL.glazeTurq;
    return [
        { geometry: box(0.17, 0.72, 0.18), position: [0, -0.38, 0], color: trousers },
        { geometry: box(0.19, 0.12, 0.3), position: [0, -0.79, -0.05], color: '#5a3a22' },
    ];
}

function armParts(kind: Kind): Part[] {
    const sleeve = kind === 'lev' ? PAL.glazeYellow : kind === 'imm' ? PAL.glazeTurq : '#e8b53a';
    return [
        { geometry: box(0.13, 0.36, 0.13), position: [0, -0.16, 0], color: sleeve },
        { geometry: box(0.1, 0.24, 0.1), position: [0, -0.43, 0], color: kind === 'lev' ? PAL.skin : '#a86a40' },
    ];
}

function shieldParts(kind: Kind): Part[] {
    const p: Part[] = [];
    if (kind === 'lev') {
        // Vidjeskjoldet (gerron): flettet vidje. Det er ikke mye å stille opp med.
        for (let i = 0; i < 6; i++)
            p.push({
                geometry: box(0.5, 0.12, 0.04),
                position: [0, 0.3 - i * 0.12, 0],
                color: i % 2 ? PAL.wickerDark : PAL.wicker,
            });
        p.push({ geometry: box(0.035, 0.76, 0.06), position: [-0.23, 0, 0.01], color: PAL.wickerDark });
        p.push({ geometry: box(0.035, 0.76, 0.06), position: [0.23, 0, 0.01], color: PAL.wickerDark });
    } else if (kind === 'imm') {
        // Fiolinformet vidjeskjold med lærkant.
        const g = cyl(0.26, 0.26, 0.05, 14);
        p.push({ geometry: g, position: [0, 0.2, 0], rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 1.15], color: PAL.wicker });
        p.push({ geometry: g, position: [0, -0.3, 0], rotation: [Math.PI / 2, 0, 0], scale: [1.1, 1, 1.15], color: PAL.wickerDark });
        p.push({ geometry: box(0.08, 0.9, 0.07), position: [0, -0.05, -0.02], color: PAL.glazeYellow });
    } else {
        p.push({ geometry: cyl(0.42, 0.42, 0.06, 20), rotation: [Math.PI / 2, 0, 0], color: PAL.bronze });
        p.push({ geometry: cyl(0.3, 0.3, 0.07, 20), rotation: [Math.PI / 2, 0, 0], color: PAL.glazeTurq });
        p.push({ geometry: cyl(0.1, 0.1, 0.1, 12), rotation: [Math.PI / 2, 0, 0], color: PAL.bronzeHi });
    }
    return p;
}

function spearParts(kind: Kind): Part[] {
    const len = kind === 'boss' ? 2.4 : 2.1;
    const p: Part[] = [
        { geometry: cyl(0.022, 0.026, len, 6), position: [0, 0, -0.33], rotation: [Math.PI / 2, 0, 0], color: '#6b4527' },
        { geometry: cone(0.05, 0.26, 6), position: [0, 0, TIP_Z + 0.13], rotation: [-Math.PI / 2, 0, 0], color: '#d9dcd6' },
    ];
    // De udødeliges spyd har et granateple av gull i enden.
    if (kind !== 'lev') p.push({ geometry: sph(0.065, 8, 6), position: [0, 0, 0.76], color: PAL.glazeYellow });
    return p;
}

export interface KindGeo {
    body: THREE.BufferGeometry;
    leg: THREE.BufferGeometry;
    arm: THREE.BufferGeometry;
    shield: THREE.BufferGeometry;
    spear: THREE.BufferGeometry;
}

const _geo: Partial<Record<Kind, KindGeo>> = {};
export function kindGeo(kind: Kind): KindGeo {
    const hit = _geo[kind];
    if (hit) return hit;
    const g: KindGeo = {
        body: mergeParts(bodyParts(kind)),
        leg: mergeParts(legParts(kind)),
        arm: mergeParts(armParts(kind)),
        shield: mergeParts(shieldParts(kind)),
        spear: mergeParts(spearParts(kind)),
    };
    _geo[kind] = g;
    return g;
}

// ---------------------------------------------------------------------------
// Hoplittens eget utstyr (førsteperson)
// ---------------------------------------------------------------------------

let _dory: THREE.BufferGeometry | null = null;
/** Spydet (dory): askeskaft, lærgrep, bladformet bronsespiss og bronsepigg bak. Spissen peker -z. */
export function doryGeo() {
    if (_dory) return _dory;
    _dory = mergeParts([
        { geometry: cyl(0.018, 0.022, 2.5, 8), position: [0, 0, -0.55], rotation: [Math.PI / 2, 0, 0], color: '#b07a44' },
        { geometry: cyl(0.026, 0.026, 0.22, 8), position: [0, 0, 0], rotation: [Math.PI / 2, 0, 0], color: '#3b2618' },
        { geometry: cyl(0.02, 0.03, 0.12, 8), position: [0, 0, -1.84], rotation: [Math.PI / 2, 0, 0], color: PAL.bronze },
        { geometry: cone(0.055, 0.42, 4), position: [0, 0, -2.1], rotation: [-Math.PI / 2, 0, 0], scale: [1, 1, 0.35], color: '#f0c25a' },
        { geometry: cone(0.024, 0.3, 6), position: [0, 0, 0.82], rotation: [Math.PI / 2, 0, 0], color: PAL.bronze },
    ]);
    return _dory;
}
export const DORY_TIP_Z = -2.3;

let _hand: THREE.BufferGeometry | null = null;
/** Underarm og hånd med rød kappeflik ved albuen. */
export function handGeo() {
    if (_hand) return _hand;
    _hand = mergeParts([
        // Knyttneve rundt skaftet, med tommel.
        { geometry: box(0.085, 0.09, 0.11), position: [0, -0.005, 0], color: '#dca073' },
        { geometry: box(0.03, 0.035, 0.06), position: [-0.05, 0.03, -0.03], color: '#dca073' },
        // Underarmen går ned og bakover ut av bildet, med bronsearmring.
        { geometry: box(0.075, 0.075, 0.4), position: [0.03, -0.08, 0.24], rotation: [0.45, 0.12, 0], color: '#d0915f' },
        { geometry: box(0.095, 0.095, 0.07), position: [0.04, -0.12, 0.34], rotation: [0.45, 0.12, 0], color: PAL.bronze },
    ]);
    return _hand;
}

let _aspis: THREE.BufferGeometry | null = null;
/**
 * Bronseskjoldet (aspis) sett innenfra: skålformet, rødt lær innvendig, bronsekant,
 * armbøylen (porpax) og snora (antilabe). Framsida (malt lambda) vender mot -z.
 */
export function aspisGeo() {
    if (_aspis) return _aspis;
    const bowl = new THREE.SphereGeometry(0.62, 28, 8, 0, Math.PI * 2, 0, 0.62);
    _aspis = mergeParts([
        // Utsida: bronse. Kula ligger med polen mot -z.
        { geometry: bowl, rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0.36], color: PAL.bronze },
        // Innsida: rødt lær (litt mindre skall rett bak).
        { geometry: new THREE.SphereGeometry(0.6, 28, 8, 0, Math.PI * 2, 0, 0.62), rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0.365], color: '#b8321f' },
        // Den brede kanten.
        { geometry: new THREE.TorusGeometry(0.37, 0.045, 6, 32), position: [0, 0, -0.14], color: PAL.bronzeHi },
        // Armbøylen og snora.
        { geometry: box(0.1, 0.34, 0.05), position: [0, 0, -0.04], color: PAL.bronze },
        { geometry: box(0.03, 0.03, 0.12), position: [0.27, 0.1, -0.08], color: '#5a3a22' },
        { geometry: box(0.03, 0.03, 0.12), position: [0.27, -0.1, -0.08], color: '#5a3a22' },
        // Den malte lambdaen på utsida (synlig i kanten når skjoldet vippes).
        { geometry: box(0.06, 0.4, 0.02), position: [-0.08, 0, -0.27], rotation: [0, 0, 0.4], color: PAL.red },
        { geometry: box(0.06, 0.4, 0.02), position: [0.08, 0, -0.27], rotation: [0, 0, -0.4], color: PAL.red },
    ]);
    return _aspis;
}

// ---------------------------------------------------------------------------
// Kulisser
// ---------------------------------------------------------------------------

/** Et gresk rundskjold til stabelen i leiren: rød front, bronsekant, malt tegn. */
export function campShieldGeo(sign: number) {
    const parts: Part[] = [
        { geometry: cyl(0.46, 0.46, 0.06, 20), rotation: [Math.PI / 2, 0, 0], color: PAL.red },
        { geometry: new THREE.TorusGeometry(0.46, 0.04, 6, 24), color: PAL.bronze },
    ];
    if (sign === 0) {
        parts.push({ geometry: box(0.06, 0.46, 0.02), position: [-0.09, 0, -0.04], rotation: [0, 0, 0.4], color: PAL.marble });
        parts.push({ geometry: box(0.06, 0.46, 0.02), position: [0.09, 0, -0.04], rotation: [0, 0, -0.4], color: PAL.marble });
    } else if (sign === 1) {
        for (let i = 0; i < 4; i++)
            parts.push({ geometry: box(0.1, 0.1, 0.02), position: [Math.cos(i * 1.57) * 0.2, Math.sin(i * 1.57) * 0.2, -0.04], color: PAL.ink });
        parts.push({ geometry: cyl(0.1, 0.1, 0.02, 12), position: [0, 0, -0.04], rotation: [Math.PI / 2, 0, 0], color: PAL.bronzeHi });
    } else {
        parts.push({ geometry: box(0.36, 0.08, 0.02), position: [0, 0.05, -0.04], color: PAL.ink });
        parts.push({ geometry: box(0.08, 0.26, 0.02), position: [-0.12, -0.08, -0.04], color: PAL.ink });
        parts.push({ geometry: box(0.08, 0.26, 0.02), position: [0.12, -0.08, -0.04], color: PAL.ink });
    }
    return mergeParts(parts);
}

/** Et lite menneske i den fjerne hæren: kropp, hode, spyd. Farget per instans. */
export function farManGeo() {
    return mergeParts([
        { geometry: cyl(0.2, 0.3, 1.3, 5), position: [0, 0.65, 0], color: '#ffffff' },
        { geometry: sph(0.16, 5, 4), position: [0, 1.45, 0], color: '#e0c0a0' },
        { geometry: box(0.04, 2.4, 0.04), position: [0.28, 1.3, 0], color: '#6b4527' },
    ]);
}

/** Telt i leiren: hvitt lerret, rød topp, mørk åpning. */
export function tentGeo() {
    return mergeParts([
        { geometry: cone(1.35, 1.7, 4), position: [0, 0.85, 0], rotation: [0, Math.PI / 4, 0], color: '#efe3c8' },
        { geometry: cone(0.52, 0.66, 4), position: [0, 1.4, 0], rotation: [0, Math.PI / 4, 0], color: PAL.red },
        { geometry: box(0.5, 0.8, 0.05), position: [0, 0.42, -0.72], rotation: [-0.2, 0, 0], color: '#3b2618' },
        { geometry: cyl(0.03, 0.03, 0.5, 5), position: [0, 1.95, 0], color: '#6b4527' },
    ]);
}

/** Leirbål: steiner og vedkubber. */
export function fireGeo() {
    const parts: Part[] = [];
    for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        parts.push({ geometry: new THREE.DodecahedronGeometry(0.14), position: [Math.cos(a) * 0.45, 0.08, Math.sin(a) * 0.45], color: '#8d8274' });
    }
    parts.push({ geometry: cyl(0.06, 0.06, 0.7, 6), position: [0, 0.12, 0], rotation: [0, 0.4, Math.PI / 2], color: '#4a2e1a' });
    parts.push({ geometry: cyl(0.06, 0.06, 0.7, 6), position: [0, 0.16, 0], rotation: [0, -0.9, Math.PI / 2], color: '#3b2618' });
    return mergeParts(parts);
}
