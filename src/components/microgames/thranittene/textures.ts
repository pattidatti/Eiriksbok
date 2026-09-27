import * as THREE from 'three';
import { crispCanvas } from '../kit/crispText';

// Teksturer tegnet på canvas: havet som kobberstikk, papirkorn på landet,
// navnelapper for bygdene og myndighetenes annonse. Alt lages én gang.

export const SERIF = 'Georgia, "Times New Roman", serif';
export const INK = '#1f1b16';
export const PAPER = '#f1e8d0';
export const RED = '#b8322a';
export const SEA = '#34496b';

/** Havet: graverte bølgestreker i blekk, som på et kart fra 1850. */
export function seaTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const x = c.getContext('2d')!;
    x.fillStyle = '#3d5478';
    x.fillRect(0, 0, 256, 256);
    x.strokeStyle = 'rgba(20,30,52,.55)';
    x.lineWidth = 1.4;
    for (let y = 4; y < 256; y += 8) {
        x.beginPath();
        for (let i = 0; i <= 256; i += 4) {
            const yy = y + Math.sin((i / 256) * Math.PI * 4 + y * 0.7) * 1.6;
            if (i === 0) x.moveTo(i, yy);
            else x.lineTo(i, yy);
        }
        x.stroke();
    }
    x.strokeStyle = 'rgba(210,222,236,.18)';
    x.lineWidth = 1;
    for (let y = 8; y < 256; y += 16) {
        x.beginPath();
        x.moveTo(0, y);
        x.lineTo(256, y + 1);
        x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(9, 9);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

/** Papirkorn og skravering for landet. Ganges med fargene i hjørnene. */
export function paperTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const x = c.getContext('2d')!;
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 256, 256);
    let s = 7;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2600; i++) {
        const v = 232 + Math.floor(r() * 23);
        x.fillStyle = `rgb(${v},${v - 3},${v - 10})`;
        x.fillRect(r() * 256, r() * 256, 1 + r() * 1.5, 1 + r() * 1.5);
    }
    // Svak diagonal skravering, som et tresnitt.
    x.strokeStyle = 'rgba(60,45,25,.07)';
    x.lineWidth = 1;
    for (let i = -256; i < 256; i += 6) {
        x.beginPath();
        x.moveTo(i, 256);
        x.lineTo(i + 256, 0);
        x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(7, 7);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Alle navnelappene i ett atlas (én tekstur, ett tegnekall). Rute i = bygd i. */
export const LABEL_COLS = 5;
export function labelAtlas(names: string[]) {
    const W = 240;
    const H = 56;
    const rows = Math.ceil(names.length / LABEL_COLS);
    const cc = crispCanvas(W * LABEL_COLS, H * rows);
    cc.draw((x) => {
        names.forEach((name, i) => {
            const ox = (i % LABEL_COLS) * W;
            const oy = Math.floor(i / LABEL_COLS) * H;
            x.font = `italic 700 30px ${SERIF}`;
            const tw = Math.min(W - 8, x.measureText(name).width + 26);
            const x0 = ox + (W - tw) / 2;
            x.fillStyle = '#f7eed4';
            x.fillRect(x0, oy + 8, tw, H - 16);
            x.strokeStyle = INK;
            x.lineWidth = 2;
            x.strokeRect(x0 + 1, oy + 9, tw - 2, H - 18);
            x.fillStyle = INK;
            x.textAlign = 'center';
            x.textBaseline = 'middle';
            x.fillText(name, ox + W / 2, oy + H / 2 + 1, W - 20);
        });
    });
    return { tex: cc.tex, rows };
}

/** Myndighetenes annonse: et svart stempel over foreningen. */
export function annonseTexture() {
    const cc = crispCanvas(220, 120);
    cc.draw((x, w, h) => {
        x.fillStyle = '#16120e';
        x.beginPath();
        // Blekkflekk med ujevn kant
        const cx = w / 2;
        const cy = h / 2;
        for (let i = 0; i <= 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            const rr = 1 + Math.sin(a * 5) * 0.06 + Math.sin(a * 11 + 1) * 0.04;
            const px = cx + Math.cos(a) * (w * 0.47) * rr;
            const py = cy + Math.sin(a) * (h * 0.44) * rr;
            if (i === 0) x.moveTo(px, py);
            else x.lineTo(px, py);
        }
        x.fill();
        x.strokeStyle = '#f1e8d0';
        x.lineWidth = 2;
        x.strokeRect(24, 22, w - 48, h - 44);
        x.fillStyle = '#f1e8d0';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.font = `900 22px ${SERIF}`;
        x.fillText('MELD DEG UT', cx, cy - 11);
        x.font = `italic 700 14px ${SERIF}`;
        x.fillText('så slipper du politiet', cx, cy + 13);
    });
    return cc.tex;
}

/** Skilt på trykkeriet i Christiania. */
export function pressSign() {
    const cc = crispCanvas(260, 60);
    cc.draw((x, w, h) => {
        x.fillStyle = INK;
        x.fillRect(0, 0, w, h);
        x.strokeStyle = '#d9c9a0';
        x.lineWidth = 2;
        x.strokeRect(4, 4, w - 8, h - 8);
        x.fillStyle = '#f1e8d0';
        x.font = `900 24px ${SERIF}`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText('TRYKKERIET', w / 2, h / 2 + 1);
    });
    return cc.tex;
}

/** Stor, sperret skrift på kartet (landnavn og hav). */
export function mapLabel(text: string, light: boolean) {
    const cc = crispCanvas(440, 96);
    cc.draw((x, w, h) => {
        x.font = `italic 900 58px ${SERIF}`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = light ? 'rgba(236,228,206,.55)' : 'rgba(31,27,22,.5)';
        (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '12px';
        x.fillText(text, w / 2, h / 2, w - 10);
    });
    return cc.tex;
}
