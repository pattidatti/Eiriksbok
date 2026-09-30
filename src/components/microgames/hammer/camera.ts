import * as THREE from 'three';
import type { G } from './game';
import type { Army, Moment } from './army';

// HAMMER OG AMBOLT - kamera-regissøren.
//
// Planlegging: fast kamera, skrått ovenfra fra siden, hele brettet synlig over butikken.
// Slaget: kameraet feier langs frontlinja, legger seg lavere og følger kampen, og dykker
// ned på det avgjørende øyeblikket (kilen treffer, storkongen flykter, elefanten raser,
// Fjellstien) med sakte film. Etter slaget står det og ser på dem som vant.
//
// Bare visning: regissøren leser spilltilstanden og hæren, og gir tilbake kameraets
// plassering og hvor fort visningen skal gå (sakte film).

export interface Director {
    pos: THREE.Vector3;
    look: THREE.Vector3;
    sweep: number;
    dive: (Moment & { t: number; dur: number }) | null;
    phase: string;
    focus: THREE.Vector3;
    menuT: number;
    lastDive: number;
}

export function makeDirector(): Director {
    return {
        pos: new THREE.Vector3(-9, 22, 0),
        look: new THREE.Vector3(-1.4, 0, 0),
        sweep: 0,
        dive: null,
        phase: '',
        focus: new THREE.Vector3(),
        menuT: 0,
        lastDive: -9,
    };
}

const TMP = new THREE.Vector3();
const DIR = new THREE.Vector3(-11.7, 23.5, 0).normalize();
const PA = new THREE.Vector3();
const fitCache = { key: '', pos: new THREE.Vector3(), look: new THREE.Vector3() };

/** Båndet på skjermen (piksler) der brettet skal stå: under topplinja, over benken. */
export interface Band {
    top: number;
    bottom: number;
}

/**
 * Finn planleggingskameraet som får hele brettet (begge hærer) inn i båndet mellom
 * topplinja og benken, uansett om spillet står i spalten eller i fullskjerm.
 */
function fitPlan(cam: THREE.PerspectiveCamera, w: number, h: number, band: Band, pos: THREE.Vector3, look: THREE.Vector3) {
    const key = `${w}x${h}:${band.top}:${band.bottom}:${cam.fov}`;
    if (fitCache.key === key) {
        pos.copy(fitCache.pos);
        look.copy(fitCache.look);
        return;
    }
    const save = cam.position.clone();
    const saveQ = cam.quaternion.clone();
    let dist = 26;
    let lx = -3.3;
    const want = Math.max(80, band.bottom - band.top);
    const wantMid = (band.top + band.bottom) / 2;
    const proj = (x: number, y: number, z: number) => {
        PA.set(x, y, z).project(cam);
        return { x: (PA.x * 0.5 + 0.5) * w, y: (-PA.y * 0.5 + 0.5) * h };
    };
    for (let i = 0; i < 14; i++) {
        look.set(lx, 0, 0);
        pos.copy(look).addScaledVector(DIR, dist);
        cam.position.copy(pos);
        cam.lookAt(look);
        cam.updateMatrixWorld();
        const a = proj(6.8, 1.6, 0); // fjerne flanke, med navnelapper
        const b = proj(-6.8, 0, 0); // nære flanke
        // Bredden: de nære hjørnene sprer seg mest i perspektivet.
        const l = Math.min(proj(-6.8, 0, -9.6).x, proj(6.8, 0, -9.6).x);
        const r = Math.max(proj(-6.8, 0, 9.6).x, proj(6.8, 0, 9.6).x);
        const span = b.y - a.y;
        const sc = Math.max(span / want, (r - l) / (w * 0.97));
        dist *= 0.5 + 0.5 * sc;
        lx -= ((a.y + b.y) / 2 - wantMid) / Math.max(1, span) * 13.6 * 0.8;
    }
    cam.position.copy(save);
    cam.quaternion.copy(saveQ);
    cam.updateMatrixWorld();
    fitCache.key = key;
    fitCache.pos.copy(pos);
    fitCache.look.copy(look);
}
const TMP2 = new THREE.Vector3();

/** Sakte film og dykk-kraft akkurat nå (0 = vanlig, 1 = helt nede). */
function diveWeight(d: Director['dive']) {
    if (!d) return 0;
    const u = d.t / d.dur;
    if (u < 0.18) return u / 0.18;
    if (u > 0.78) return Math.max(0, (1 - u) / 0.22);
    return 1;
}

/**
 * Regn ut kameraet for denne rammen. Returnerer tidsfaktoren for visningen og spillet
 * (1 = vanlig, under 1 = sakte film).
 */
export function direct(
    d: Director,
    g: G,
    army: Army,
    mode: string,
    rt: number,
    fast: number,
    outPos: THREE.Vector3,
    outLook: THREE.Vector3,
    cam: THREE.PerspectiveCamera,
    w: number,
    h: number,
    band: Band
): number {
    if (g.phase !== d.phase) {
        if (g.phase === 'slag') {
            d.sweep = 0;
            d.dive = null;
            d.lastDive = -9;
        }
        d.phase = g.phase;
    }
    let slow = 1;
    const battle = g.phase === 'slag' || army.holding() || g.phase === 'belonning';
    if (mode === 'menu' && !battle) {
        // Menyen: et langsomt sveip over hæren som står og venter.
        d.menuT += rt;
        const u = Math.sin(d.menuT * 0.12);
        outPos.set(-13, 10.5, u * 5);
        outLook.set(0, 0.6, u * 3.5);
    } else if (!battle) {
        fitPlan(cam, w, h, band, outPos, outLook);
    } else {
        army.focus(d.focus);
        const fz = Math.max(-6, Math.min(6, d.focus.z));
        const fx = Math.max(-3, Math.min(3, d.focus.x));
        // Vanlig slag-kamera: lavere enn i planleggingen, følger tyngdepunktet i kampen.
        outPos.set(fx - 12.5, 10.8, fz * 0.75 - 1);
        outLook.set(fx + 0.5, 0.2, fz * 0.85);
        // Åpningssveipet: fra bak spillerens flanke, langs linja, over til fienden.
        if (g.phase === 'slag' && d.sweep < 1) {
            d.sweep = Math.min(1, d.sweep + rt / (fast > 1 ? 1.6 : 2.8));
            const u = d.sweep;
            const e = u * u * (3 - 2 * u);
            TMP.set(-8.5 - 3 * e, 5.5 + 5 * e, -13 + 17 * e);
            TMP2.set(-1 + e, 0.8, -5 + 9 * e);
            const k = u > 0.7 ? (u - 0.7) / 0.3 : 0;
            outPos.lerpVectors(TMP, outPos, k);
            outLook.lerpVectors(TMP2, outLook, k);
        }
        // Dykket: det avgjørende øyeblikket.
        const m = army.moment;
        if (m && g.phase === 'slag') {
            army.moment = null;
            const skip = fast >= 4 && m.pri < 3;
            const cur = d.dive ? d.dive.pri : -1;
            if (!skip && m.pri > cur && (m.pri >= 2 || g.battleT - d.lastDive > 5)) {
                d.dive = { ...m, t: 0, dur: m.pri >= 3 ? 2.3 : 1.8 };
                d.lastDive = g.battleT;
            }
        } else if (m && g.phase !== 'slag') army.moment = null;
        if (d.dive) {
            d.dive.t += rt;
            const w = diveWeight(d.dive);
            const e = w * w * (3 - 2 * w);
            TMP.set(d.dive.x - 5.2, 3.6, d.dive.z - 3.4);
            TMP2.set(d.dive.x + 0.4, 0.7, d.dive.z + 0.5);
            outPos.lerp(TMP, e);
            outLook.lerp(TMP2, e);
            slow = 1 - 0.7 * e;
            if (d.dive.t >= d.dive.dur) d.dive = null;
        }
        // Seier: sakte innover mot dem som står igjen.
        if (army.holding() || g.phase === 'belonning') {
            outPos.lerp(TMP.set(d.focus.x - 9.5, 7.5, d.focus.z - 2.5), 0.45);
            outLook.lerp(TMP2.set(d.focus.x, 0.8, d.focus.z), 0.5);
        }
    }
    if (g.slowmo > 0) slow = Math.min(slow, 0.35);
    const k = d.dive ? 6 : battle ? 2.6 : 4;
    d.pos.lerp(outPos, 1 - Math.exp(-rt * k));
    d.look.lerp(outLook, 1 - Math.exp(-rt * k));
    outPos.copy(d.pos);
    outLook.copy(d.look);
    return slow;
}
