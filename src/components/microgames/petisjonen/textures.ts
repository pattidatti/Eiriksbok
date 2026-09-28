import * as THREE from 'three';
import { crispCanvas } from '../kit/crispText';
import { PLACES, ROADS, HALF_W, HALF_D, SLOTTET, rng, type XZ } from './geo';
import { INK, PAPER, RED } from './hatch';

// Alt papir i Petisjonen tegnes på canvas ved oppstart: kartarket rullen ruller
// på (som et kart i en avis fra 1849), papiret i rullen med håndskrevne navn,
// navnelappene og stedsnavnene. Ingen bilder lastes ned.

/** Bakken er større enn spillområdet, så tåka aldri viser kanten. */
export const GROUND_W = HALF_W * 2 + 30;
export const GROUND_D = HALF_D * 2 + 26;
const SERIF = 'Georgia, "Times New Roman", serif';

/** Lukket form for vann, i kartkoordinater. */
const MJOSA: XZ[] = [
    [14.5, -44], [17.5, -40], [17, -33], [18, -27], [16.5, -20], [14.5, -16.5], [13.5, -19],
    [14.2, -26], [13.4, -33], [13, -40],
];
const TYRI: XZ[] = [
    [-28, -6], [-25.5, -6.5], [-24.5, -3.5], [-25.5, 0], [-27.5, 0.5], [-28.5, -2.5],
];
const OSLOFJORD: XZ[] = [
    [-3, 28], [2, 26.6], [7, 27.4], [11, 30], [12, 36], [14, 46], [-2, 46], [-1, 38], [-4, 33],
];
const DRAMMENSFJORD: XZ[] = [
    [-23, 19], [-20.8, 20], [-20.4, 24], [-19.6, 30], [-18, 46], [-23, 46], [-23.8, 32],
    [-24.2, 24],
];
export const WATERS = [MJOSA, TYRI, OSLOFJORD, DRAMMENSFJORD];

const RIVERS: XZ[][] = [
    // Drammenselva fra Tyrifjorden til Drammen
    [[-26.5, 0], [-28, 4], [-27, 8], [-25, 13], [-23, 19]],
    // Glomma
    [[40, -34], [37, -20], [39, -12], [33, -2], [34, 8], [27, 16], [26, 30], [24, 46]],
    // Vorma fra Mjøsa
    [[14.5, -16.5], [16, -12], [19, -5], [23, 0], [30, 2], [33, -2]],
];

export function pointInPoly(p: XZ, poly: XZ[]) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, zi] = poly[i];
        const [xj, zj] = poly[j];
        if (zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
}

export function inWater(p: XZ) {
    return WATERS.some((w) => pointInPoly(p, w));
}

/** Kartarket: veier, åkrer, vann med vannrette streker, elver og en ramme. */
export function mapTexture(): THREE.CanvasTexture {
    const W = 2048;
    const H = Math.round((W * GROUND_D) / GROUND_W);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d')!;
    const R = rng(77);
    const k = W / GROUND_W;
    const X = (v: number) => (v + GROUND_W / 2) * k;
    const Z = (v: number) => (v + GROUND_D / 2) * k;

    x.fillStyle = PAPER;
    x.fillRect(0, 0, W, H);
    // Papirfiber og flekker - avispapir fra 1849.
    for (let i = 0; i < 9000; i++) {
        x.strokeStyle = `rgba(90,70,40,${0.03 + R() * 0.05})`;
        x.lineWidth = 0.6;
        const px = R() * W;
        const py = R() * H;
        const a = R() * Math.PI;
        const l = 2 + R() * 5;
        x.beginPath();
        x.moveTo(px, py);
        x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
        x.stroke();
    }
    for (let i = 0; i < 60; i++) {
        x.fillStyle = `rgba(150,110,50,${0.025 + R() * 0.03})`;
        x.beginPath();
        x.ellipse(R() * W, R() * H, 20 + R() * 90, 14 + R() * 60, R() * 3, 0, Math.PI * 2);
        x.fill();
    }

    const poly = (pts: XZ[]) => {
        x.beginPath();
        pts.forEach(([a, b], i) => (i ? x.lineTo(X(a), Z(b)) : x.moveTo(X(a), Z(b))));
        x.closePath();
    };

    // Vann: vannrette streker innenfor strandlinja, som i et tresnitt.
    for (const w of WATERS) {
        x.save();
        poly(w);
        x.clip();
        x.strokeStyle = 'rgba(28,25,21,.55)';
        x.lineWidth = 1.3;
        for (let y = 0; y < H; y += 5) {
            x.beginPath();
            x.moveTo(0, y);
            x.lineTo(W, y + (R() - 0.5) * 1.5);
            x.stroke();
        }
        x.restore();
        poly(w);
        x.strokeStyle = INK;
        x.lineWidth = 2.4;
        x.stroke();
        // Strandlinje nummer to, litt ut fra land.
        x.save();
        poly(w);
        x.clip();
        x.lineWidth = 7;
        x.strokeStyle = PAPER;
        poly(w);
        x.stroke();
        x.restore();
    }

    // Elver
    x.lineCap = 'round';
    for (const r of RIVERS) {
        for (const [lw, col] of [
            [7, INK],
            [4, PAPER],
        ] as const) {
            x.strokeStyle = col;
            x.lineWidth = lw;
            x.beginPath();
            r.forEach(([a, b], i) => (i ? x.lineTo(X(a), Z(b)) : x.moveTo(X(a), Z(b))));
            x.stroke();
        }
    }

    // Åkerlapper med pløyde streker rundt hver bygd.
    for (const pl of PLACES) {
        const n = pl.by ? 5 : 8;
        for (let i = 0; i < n; i++) {
            const a = R() * Math.PI * 2;
            const d = 7 + R() * 7;
            const cx = pl.tun[0] + Math.cos(a) * d;
            const cz = pl.tun[1] + Math.sin(a) * d;
            if (inWater([cx, cz])) continue;
            const w = (2.5 + R() * 3) * k;
            const h = (2 + R() * 2.5) * k;
            x.save();
            x.translate(X(cx), Z(cz));
            x.rotate(R() * Math.PI);
            x.beginPath();
            x.rect(-w / 2, -h / 2, w, h);
            x.strokeStyle = 'rgba(28,25,21,.7)';
            x.lineWidth = 1.2;
            x.stroke();
            x.clip();
            x.strokeStyle = 'rgba(28,25,21,.28)';
            x.lineWidth = 1;
            const step = 4 + R() * 3;
            for (let t = -w; t < w; t += step) {
                x.beginPath();
                x.moveTo(t, -h);
                x.lineTo(t + (R() > 0.5 ? h * 0.3 : 0), h);
                x.stroke();
            }
            x.restore();
        }
    }

    // Bakkestreker (hachurer) spredt rundt, som høydedrag på gamle kart.
    for (let i = 0; i < 110; i++) {
        const cx = (R() - 0.5) * GROUND_W;
        const cz = (R() - 0.5) * GROUND_D;
        if (inWater([cx, cz])) continue;
        if (PLACES.some((p) => Math.hypot(p.tun[0] - cx, p.tun[1] - cz) < 9)) continue;
        const rad = (1.5 + R() * 2.5) * k;
        x.strokeStyle = 'rgba(28,25,21,.35)';
        x.lineWidth = 1;
        for (let s = 0; s < 18; s++) {
            const a = Math.PI + (s / 17) * Math.PI;
            x.beginPath();
            x.moveTo(X(cx) + Math.cos(a) * rad, Z(cz) + Math.sin(a) * rad * 0.6);
            x.lineTo(X(cx) + Math.cos(a) * rad * 1.5, Z(cz) + Math.sin(a) * rad * 0.9);
            x.stroke();
        }
    }

    // Veiene: dobbel strek med litt sving.
    const roadPath = (a: XZ, b: XZ, seed: number) => {
        const mx = (a[0] + b[0]) / 2;
        const mz = (a[1] + b[1]) / 2;
        const nx = -(b[1] - a[1]);
        const nz = b[0] - a[0];
        const nl = Math.hypot(nx, nz) || 1;
        const off = (Math.sin(seed * 12.9) * 0.12) * Math.hypot(b[0] - a[0], b[1] - a[1]);
        x.beginPath();
        x.moveTo(X(a[0]), Z(a[1]));
        x.quadraticCurveTo(X(mx + (nx / nl) * off), Z(mz + (nz / nl) * off), X(b[0]), Z(b[1]));
    };
    ROADS.forEach(([i, j], n) => {
        const a = PLACES[i].tun;
        const b = PLACES[j].tun;
        x.strokeStyle = INK;
        x.lineWidth = 9;
        roadPath(a, b, n);
        x.stroke();
        x.strokeStyle = '#e6d8b8';
        x.lineWidth = 6;
        roadPath(a, b, n);
        x.stroke();
        x.setLineDash([6, 9]);
        x.strokeStyle = 'rgba(28,25,21,.45)';
        x.lineWidth = 1.2;
        roadPath(a, b, n);
        x.stroke();
        x.setLineDash([]);
    });
    // Veien opp til Slottet.
    x.strokeStyle = INK;
    x.lineWidth = 12;
    x.beginPath();
    x.moveTo(X(PLACES[1].tun[0]), Z(PLACES[1].tun[1]));
    x.lineTo(X(SLOTTET[0]), Z(SLOTTET[1]));
    x.stroke();
    x.strokeStyle = '#e6d8b8';
    x.lineWidth = 8;
    x.stroke();

    // Tunet i hver bygd: en lys, trampet plass med kant.
    for (const pl of PLACES) {
        x.beginPath();
        x.ellipse(X(pl.tun[0]), Z(pl.tun[1]), 2.6 * k, 2.3 * k, 0, 0, Math.PI * 2);
        x.fillStyle = '#e8dbbd';
        x.fill();
        x.setLineDash([4, 5]);
        x.strokeStyle = 'rgba(28,25,21,.6)';
        x.lineWidth = 1.5;
        x.stroke();
        x.setLineDash([]);
    }

    // Kartrammen rundt spillområdet: dobbel strek og gradmerker.
    x.strokeStyle = INK;
    x.lineWidth = 5;
    x.strokeRect(X(-HALF_W), Z(-HALF_D), HALF_W * 2 * k, HALF_D * 2 * k);
    x.lineWidth = 1.5;
    const o = 0.9 * k;
    x.strokeRect(X(-HALF_W) - o, Z(-HALF_D) - o, HALF_W * 2 * k + o * 2, HALF_D * 2 * k + o * 2);
    for (let v = -HALF_W; v <= HALF_W; v += 4) {
        x.fillStyle = (v / 4) % 2 ? INK : PAPER;
        x.fillRect(X(v), Z(-HALF_D) - o, 4 * k, o);
        x.fillRect(X(v), Z(HALF_D), 4 * k, o);
    }
    for (let v = -HALF_D; v <= HALF_D; v += 4) {
        x.fillStyle = (v / 4) % 2 ? INK : PAPER;
        x.fillRect(X(-HALF_W) - o, Z(v), o, 4 * k);
        x.fillRect(X(HALF_W), Z(v), o, 4 * k);
    }
    // Utenfor rammen: tittelfeltet, som på et kart i avisen.
    x.fillStyle = INK;
    x.textAlign = 'center';
    x.font = `italic 700 ${1.3 * k}px ${SERIF}`;
    x.fillText('Det søndenfjeldske Norge', X(28), Z(HALF_D + 5));
    x.font = `${0.8 * k}px ${SERIF}`;
    x.fillText('efter Arbeider-Foreningernes Kaart, 1849', X(28), Z(HALF_D + 6.6));

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
}

/** Papiret i rullen: rader med håndskrevne navn og en rød marg. */
export function rollTexture(): THREE.CanvasTexture {
    const W = 1024;
    const H = 256;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d')!;
    const R = rng(9);
    x.fillStyle = '#f5ecd6';
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1500; i++) {
        x.fillStyle = `rgba(120,90,50,${R() * 0.06})`;
        x.fillRect(R() * W, R() * H, 2, 1);
    }
    // Linjer som i en protokoll, og navn skrevet med fjærpenn.
    x.strokeStyle = 'rgba(60,70,110,.25)';
    x.lineWidth = 1;
    for (let y = 18; y < H; y += 20) {
        x.beginPath();
        x.moveTo(0, y);
        x.lineTo(W, y);
        x.stroke();
    }
    x.strokeStyle = INK;
    x.lineCap = 'round';
    for (let y = 16; y < H; y += 20) {
        let px = 6 + R() * 20;
        while (px < W - 40) {
            const len = 50 + R() * 90;
            x.lineWidth = 1.3 + R() * 0.8;
            x.beginPath();
            x.moveTo(px, y - 2);
            let cx = px;
            // Stor forbokstav, så løkker som ligner løkkeskrift.
            x.lineTo(px + 3, y - 12);
            while (cx < px + len) {
                const s = 3 + R() * 4;
                x.quadraticCurveTo(cx + s * 0.5, y - 5 - R() * 7, cx + s, y - 1);
                cx += s;
            }
            x.stroke();
            px += len + 12 + R() * 28;
        }
    }
    x.fillStyle = RED;
    x.fillRect(0, 0, W, 5);
    x.fillRect(0, H - 5, W, 5);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
}

/** Endene på rullen: papir rullet i spiral. */
export function spiralTexture(): THREE.CanvasTexture {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const x = c.getContext('2d')!;
    x.fillStyle = '#f5ecd6';
    x.fillRect(0, 0, S, S);
    x.strokeStyle = INK;
    x.lineWidth = 2;
    x.beginPath();
    for (let a = 0; a < Math.PI * 2 * 11; a += 0.05) {
        const r = 6 + (a / (Math.PI * 2)) * 11;
        const px = S / 2 + Math.cos(a) * r;
        const py = S / 2 + Math.sin(a) * r;
        if (a === 0) x.moveTo(px, py);
        else x.lineTo(px, py);
    }
    x.stroke();
    x.lineWidth = 5;
    x.beginPath();
    x.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2);
    x.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** En navnelapp: lite ark med tre håndskrevne linjer. */
export function slipTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 44;
    const x = c.getContext('2d')!;
    x.fillStyle = '#fbf5e6';
    x.fillRect(0, 0, 64, 44);
    x.strokeStyle = INK;
    x.lineWidth = 2;
    x.strokeRect(1, 1, 62, 42);
    x.lineWidth = 2.2;
    for (let i = 0; i < 3; i++) {
        x.beginPath();
        x.moveTo(8, 13 + i * 10);
        for (let px = 8; px < 54; px += 5) x.lineTo(px + 5, 11 + i * 10 + ((px / 5) % 2) * 4);
        x.stroke();
    }
    x.fillStyle = RED;
    x.fillRect(0, 0, 64, 4);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Stedsnavn som ligger på kartet, skarpe også i fullskjerm. */
export function placeLabel(name: string, by: boolean) {
    const w = 320;
    const h = 72;
    const cc = crispCanvas(w, h);
    cc.draw((x) => {
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = INK;
        const txt = by ? name.toUpperCase() : name;
        x.font = by ? `700 38px ${SERIF}` : `italic 600 38px ${SERIF}`;
        if (by && 'letterSpacing' in x) (x as { letterSpacing: string }).letterSpacing = '4px';
        // Papirfarget kant, så navnet kan leses over veier og åkre.
        x.lineWidth = 7;
        x.strokeStyle = PAPER;
        x.strokeText(txt, w / 2, h / 2);
        x.fillText(txt, w / 2, h / 2);
    });
    return cc.tex;
}

/** Skiltet over porten på Slottet. */
export function slottLabel() {
    const cc = crispCanvas(420, 80);
    cc.draw((x, w, h) => {
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = INK;
        x.font = `700 40px ${SERIF}`;
        x.lineWidth = 8;
        x.strokeStyle = PAPER;
        x.strokeText('SLOTTET', w / 2, h / 2);
        x.fillText('SLOTTET', w / 2, h / 2);
    });
    return cc.tex;
}
