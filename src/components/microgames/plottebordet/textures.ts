import * as THREE from 'three';
import {
    ENGLAND,
    CONTINENT,
    BASES,
    STATIONS,
    LONDON,
    TABLE_W,
    TABLE_D,
    HALF_W,
    HALF_D,
    overEngland,
    inPoly,
    sectorOf,
    type XZ,
} from './geo';
import { RADAR_RANGE } from './game';

// Kartet og radarsektorene tegnet på canvas lokalt - ingen bilder lastes ned.
// Stilen er det håndmalte kartet på plottebordet i Fighter Command: kremhvitt
// land, grågrønt hav med et rutenett, tynne blekkstreker og sperrede versaler.

const FONT = 'Outfit, Inter, system-ui, sans-serif';
const PX = 88; // piksler per enhet
const W = Math.round(TABLE_W * PX);
const H = Math.round(TABLE_D * PX);

const toPx = ([x, z]: XZ): [number, number] => [(x + HALF_W) * PX, (z + HALF_D) * PX];

function poly(c: CanvasRenderingContext2D, pts: XZ[]) {
    c.beginPath();
    pts.forEach((p, i) => {
        const [x, y] = toPx(p);
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
    });
    c.closePath();
}

function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

function label(c: CanvasRenderingContext2D, text: string, p: XZ, size: number, color: string, spacing = 6, align: CanvasTextAlign = 'center') {
    c.save();
    c.font = `800 ${size}px ${FONT}`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.letterSpacing = `${spacing}px`;
    const [x, y] = toPx(p);
    c.fillText(text, x, y);
    c.restore();
}

export function mapTexture(): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const c = cv.getContext('2d')!;
    const r = rng(1940);

    // Havet
    const sea = c.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#9fb8b2');
    sea.addColorStop(1, '#8eaaa6');
    c.fillStyle = sea;
    c.fillRect(0, 0, W, H);
    // Bølgestreker, svakt
    c.strokeStyle = 'rgba(255,255,255,.10)';
    c.lineWidth = 2;
    for (let k = 0; k < 260; k++) {
        const x = r() * W;
        const y = r() * H;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + 9, y - 4, x + 18, y);
        c.stroke();
    }

    // Kontinentet
    poly(c, CONTINENT);
    c.fillStyle = '#d9cfb3';
    c.fill();
    // Skravur på kontinentet (fiendeland)
    c.save();
    poly(c, CONTINENT);
    c.clip();
    c.strokeStyle = 'rgba(120,92,64,.16)';
    c.lineWidth = 3;
    for (let x = -H; x < W; x += 22) {
        c.beginPath();
        c.moveTo(x, H);
        c.lineTo(x + H, 0);
        c.stroke();
    }
    c.restore();

    // England
    poly(c, ENGLAND);
    const land = c.createLinearGradient(0, 0, W, H);
    land.addColorStop(0, '#efe8d3');
    land.addColorStop(1, '#e6dcc1');
    c.fillStyle = land;
    c.fill();
    // Litt salviegrønt i åssidene (North og South Downs)
    c.save();
    poly(c, ENGLAND);
    c.clip();
    for (let k = 0; k < 90; k++) {
        const x = r() * W;
        const y = r() * H;
        c.fillStyle = `rgba(150,170,120,${0.05 + r() * 0.07})`;
        c.beginPath();
        c.ellipse(x, y, 30 + r() * 70, 12 + r() * 26, r() * 3, 0, Math.PI * 2);
        c.fill();
    }
    c.restore();

    // Kystlinjer: dobbel strek som på et gammelt kart
    for (const pts of [ENGLAND, CONTINENT]) {
        poly(c, pts);
        c.strokeStyle = 'rgba(40,52,60,.28)';
        c.lineWidth = 12;
        c.stroke();
        poly(c, pts);
        c.strokeStyle = '#2a3238';
        c.lineWidth = 3;
        c.stroke();
    }

    // Rutenettet (RAF-kartets store ruter) over alt
    c.strokeStyle = 'rgba(40,50,56,.16)';
    c.lineWidth = 2;
    for (let x = 0; x <= W; x += PX * 2) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, H);
        c.stroke();
    }
    for (let y = 0; y <= H; y += PX * 2) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
    }
    const letters = 'ABCDEFGHJKLM';
    c.font = `800 22px ${FONT}`;
    c.fillStyle = 'rgba(40,50,56,.4)';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    for (let i = 0; i * PX * 2 < W; i++)
        for (let j = 0; j * PX * 2 < H; j++) c.fillText(`${letters[i % letters.length]}${j + 1}`, i * PX * 2 + 8, j * PX * 2 + 6);

    // London: en mørk flekk av gater
    const [lx, ly] = toPx(LONDON);
    for (let k = 0; k < 120; k++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * PX * 0.75;
        c.fillStyle = `rgba(80,70,62,${0.25 + r() * 0.35})`;
        c.fillRect(lx + Math.cos(a) * d, ly + Math.sin(a) * d * 0.8, 6 + r() * 10, 6 + r() * 10);
    }
    c.strokeStyle = '#4a5d73';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(lx - PX * 1.6, ly + PX * 0.3);
    c.bezierCurveTo(lx - PX * 0.5, ly - PX * 0.1, lx + PX * 0.6, ly + PX * 0.5, lx + PX * 1.9, ly + PX * 0.35);
    c.stroke();
    label(c, 'LONDON', [LONDON[0], LONDON[1] - 0.95], 34, '#3b3530', 10);

    // Flyplasser: grønn sirkel med rullebaner
    for (const b of BASES) {
        const [x, y] = toPx(b.pos);
        c.fillStyle = '#b9c79c';
        c.beginPath();
        c.arc(x, y, PX * 0.42, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#4d5b3c';
        c.lineWidth = 3;
        c.stroke();
        c.strokeStyle = '#6d7560';
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(x - PX * 0.3, y - PX * 0.1);
        c.lineTo(x + PX * 0.3, y + PX * 0.1);
        c.moveTo(x - PX * 0.08, y - PX * 0.3);
        c.lineTo(x + PX * 0.08, y + PX * 0.3);
        c.stroke();
        label(c, b.name.toUpperCase(), [b.pos[0], b.pos[1] + 0.72], 22, '#2e3b24', 4);
    }
    // Radarstasjonene
    for (const s of STATIONS) {
        const [x, y] = toPx(s.pos);
        c.fillStyle = '#2a3238';
        c.beginPath();
        c.moveTo(x, y - 12);
        c.lineTo(x + 11, y + 9);
        c.lineTo(x - 11, y + 9);
        c.closePath();
        c.fill();
        label(c, s.name.toUpperCase(), [s.pos[0], s.pos[1] + 0.5], 20, '#1d3a3f', 3);
    }

    label(c, 'ENGLAND', [-4.5, -4.2], 64, 'rgba(60,54,44,.55)', 26);
    label(c, 'FRANKRIKE', [-3, 7.1], 52, 'rgba(90,64,44,.55)', 22);
    label(c, 'DEN ENGELSKE KANAL', [-3.4, 4.25], 34, 'rgba(38,62,66,.55)', 14);
    label(c, 'NORDSJØEN', [10.2, -4.4], 30, 'rgba(38,62,66,.55)', 8);
    label(c, 'BELGIA', [10.2, 5.2], 30, 'rgba(90,64,44,.5)', 8);
    label(c, '↑ NORD-ENGLAND', [6.1, -7.25], 24, 'rgba(60,54,44,.65)', 4);
    label(c, 'SOLA →', [10.1, -7.3], 22, 'rgba(90,40,30,.6)', 3);

    // Kompassrose i hjørnet
    const [cx, cy] = toPx([-9.9, 5.0]);
    c.save();
    c.translate(cx, cy);
    c.strokeStyle = '#3a3a34';
    c.fillStyle = '#3a3a34';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, 52, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -64);
    c.lineTo(12, 0);
    c.lineTo(0, 64);
    c.lineTo(-12, 0);
    c.closePath();
    c.fill();
    c.font = `900 24px ${FONT}`;
    c.textAlign = 'center';
    c.fillText('N', 0, -80);
    c.restore();

    // Papirkorn
    const img = c.getImageData(0, 0, W, H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const n = (r() - 0.5) * 12;
        d[i] += n;
        d[i + 1] += n;
        d[i + 2] += n;
    }
    c.putImageData(img, 0, 0);

    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
}

/**
 * Radarsektoren til én stasjon: havet nærmest stasjonen, innenfor rekkevidde.
 * Hvit maske - fargen settes på materialet (grønn i drift, rød når den er ute).
 */
export function sectorTexture(idx: number): THREE.CanvasTexture {
    const S = 8; // piksler per enhet
    const w = Math.round(TABLE_W * S);
    const h = Math.round(TABLE_D * S);
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const c = cv.getContext('2d')!;
    const img = c.createImageData(w, h);
    const st = STATIONS[idx].pos;
    for (let py = 0; py < h; py++)
        for (let px = 0; px < w; px++) {
            const x = px / S - HALF_W;
            const z = py / S - HALF_D;
            if (overEngland(x, z) || inPoly(x, z, CONTINENT)) continue;
            if (sectorOf(x, z) !== idx) continue;
            const d = Math.hypot(x - st[0], z - st[1]);
            if (d > RADAR_RANGE) continue;
            // Buer i sektoren, som ekko-ringer.
            const ring = Math.abs(((d * 1.4) % 1) - 0.5) < 0.06 ? 0.55 : 0;
            const edge = d > RADAR_RANGE - 0.25 ? 0.5 : 0;
            const a = Math.max(0.3 * (1 - d / RADAR_RANGE) + 0.12, ring, edge);
            const o = (py * w + px) * 4;
            img.data[o] = 255;
            img.data[o + 1] = 255;
            img.data[o + 2] = 255;
            img.data[o + 3] = Math.round(a * 255);
        }
    c.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Liten etikett (tall på en brikke). */
export function labelTexture(text: string, bg: string, fg: string): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = 128;
    cv.height = 64;
    const c = cv.getContext('2d')!;
    c.fillStyle = bg;
    c.fillRect(0, 0, 128, 64);
    c.fillStyle = fg;
    c.font = `900 40px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 64, 35);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Tregulv i kontrollrommet. */
export function floorTexture(): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 512;
    const c = cv.getContext('2d')!;
    const r = rng(7);
    for (let y = 0; y < 512; y += 32)
        for (let x = (y / 32) % 2 ? -64 : 0; x < 512; x += 128) {
            const s = 70 + Math.floor(r() * 26);
            c.fillStyle = `rgb(${s + 30},${s + 12},${s - 6})`;
            c.fillRect(x + 1, y + 1, 126, 30);
        }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 6);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}
