import * as THREE from 'three';

// Prosedyrale teksturer for Løp med lønna: brostein, skilt, plakatsøylen og
// sedlene. Alt tegnes på canvas lokalt - ingen bilder lastes ned.

function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

const FONT = 'Outfit, Inter, system-ui, sans-serif';

/** Brostein i buede rader, som på en Berlin-plass. */
export function cobbleTexture(): THREE.CanvasTexture {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const x = c.getContext('2d')!;
    const r = rng(23);
    x.fillStyle = '#4a4a52';
    x.fillRect(0, 0, S, S);
    const rows = 16;
    const h = S / rows;
    for (let row = 0; row < rows; row++) {
        let px = row % 2 ? -h * 0.5 : 0;
        while (px < S) {
            const w = h * (0.8 + r() * 0.5);
            const shade = 92 + Math.floor(r() * 46);
            const tint = Math.floor(r() * 10);
            x.fillStyle = `rgb(${shade + tint},${shade + tint},${shade + 12})`;
            const rad = h * 0.3;
            const x0 = px + 2;
            const y0 = row * h + 2;
            const ww = w - 4;
            const hh = h - 4;
            x.beginPath();
            x.moveTo(x0 + rad, y0);
            x.arcTo(x0 + ww, y0, x0 + ww, y0 + hh, rad);
            x.arcTo(x0 + ww, y0 + hh, x0, y0 + hh, rad);
            x.arcTo(x0, y0 + hh, x0, y0, rad);
            x.arcTo(x0, y0, x0 + ww, y0, rad);
            x.fill();
            // lys kant oppe, mørk nede - gir steinene volum
            x.fillStyle = 'rgba(255,255,255,.08)';
            x.fillRect(x0 + rad * 0.6, y0 + 1, ww - rad * 1.2, 3);
            x.fillStyle = 'rgba(0,0,0,.18)';
            x.fillRect(x0 + rad * 0.6, y0 + hh - 4, ww - rad * 1.2, 3);
            px += w;
        }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

/** Pussvegg med flekker og riss - gjør de flate fasadene levende. */
export function plasterTexture(): THREE.CanvasTexture {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const x = c.getContext('2d')!;
    const r = rng(5);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, S, S);
    for (let i = 0; i < 140; i++) {
        const a = 0.03 + r() * 0.07;
        x.fillStyle = `rgba(40,30,20,${a})`;
        x.beginPath();
        x.ellipse(r() * S, r() * S, 4 + r() * 22, 3 + r() * 14, r() * 3, 0, Math.PI * 2);
        x.fill();
    }
    x.strokeStyle = 'rgba(40,30,20,.12)';
    for (let i = 0; i < 10; i++) {
        x.beginPath();
        let px = r() * S;
        let py = r() * S;
        x.moveTo(px, py);
        for (let k = 0; k < 5; k++) {
            px += (r() - 0.5) * 30;
            py += r() * 20;
            x.lineTo(px, py);
        }
        x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export interface Board {
    tex: THREE.CanvasTexture;
    draw: (lines: string[]) => void;
}

/**
 * Skilt med plakatbokstaver. `draw` tegner på nytt (brukes for pristavler som
 * endrer seg hvert kvarter sekund), og tegner seg også på nytt når fonten er lastet.
 */
export function makeBoard(
    w: number,
    h: number,
    style: { bg: string; fg: string; accent?: string; border?: string; sizes?: number[] }
): Board {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d')!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    let last: string[] = [];
    const draw = (lines: string[]) => {
        last = lines;
        x.fillStyle = style.bg;
        x.fillRect(0, 0, w, h);
        if (style.border) {
            x.strokeStyle = style.border;
            x.lineWidth = Math.max(4, h * 0.05);
            x.strokeRect(x.lineWidth, x.lineWidth, w - x.lineWidth * 2, h - x.lineWidth * 2);
        }
        const sizes = style.sizes ?? [0.42, 0.22, 0.22];
        const total = lines.reduce((s, _, i) => s + (sizes[i] ?? 0.2) * h * 1.12, 0);
        let y = (h - total) / 2;
        lines.forEach((line, i) => {
            const size = (sizes[i] ?? 0.2) * h;
            x.font = `900 ${size}px ${FONT}`;
            x.fillStyle = i === 0 ? style.fg : (style.accent ?? style.fg);
            x.textAlign = 'center';
            x.textBaseline = 'top';
            // Krymp teksten til den får plass.
            let s = size;
            while (x.measureText(line).width > w * 0.9 && s > 8) {
                s -= 2;
                x.font = `900 ${s}px ${FONT}`;
            }
            x.fillText(line, w / 2, y + (size - s) / 2);
            y += size * 1.12;
        });
        tex.needsUpdate = true;
    };
    if (typeof document !== 'undefined' && document.fonts?.ready)
        void document.fonts.ready.then(() => {
            if (last.length) draw(last);
        });
    return { tex, draw };
}

/** En seddel: grønn/lilla med ramme og tall. Brukes både på sedlene som flyr og på samlesedlene. */
export function noteTexture(
    label: string,
    hue: 'gronn' | 'lilla' | 'brun' = 'gronn'
): THREE.CanvasTexture {
    const W = 256;
    const H = 128;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d')!;
    const col =
        hue === 'gronn'
            ? ['#cfe0b8', '#4f7a3c']
            : hue === 'lilla'
              ? ['#ddd0ea', '#6a4c8c']
              : ['#eadcc0', '#7a5a33'];
    x.fillStyle = col[0];
    x.fillRect(0, 0, W, H);
    x.strokeStyle = col[1];
    x.lineWidth = 6;
    x.strokeRect(7, 7, W - 14, H - 14);
    x.lineWidth = 1.5;
    for (let i = 0; i < 22; i++) {
        x.beginPath();
        x.arc(W * 0.78, H * 0.5, 6 + i * 2.2, 0, Math.PI * 2);
        x.stroke();
    }
    x.fillStyle = col[1];
    x.font = `900 30px ${FONT}`;
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    x.fillText(label, 22, H * 0.42);
    x.font = `700 15px ${FONT}`;
    x.fillText('REICHSBANKNOTE', 22, H * 0.72);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Plakatene rundt Litfaß-søylen: grafiske flater i Weimar-stil. */
export function posterTexture(): {
    tex: THREE.CanvasTexture;
    drawRate: (rate: string, news: string) => void;
} {
    const W = 1024;
    const H = 256;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d')!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    let rate = '';
    let news = '';
    const paint = () => {
        x.fillStyle = '#e9dfc7';
        x.fillRect(0, 0, W, H);
        // Plakat 1: rød sirkel og svart diagonal
        x.fillStyle = '#c8322b';
        x.beginPath();
        x.arc(120, 120, 80, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = '#1d1c22';
        x.save();
        x.translate(120, 128);
        x.rotate(-0.5);
        x.fillRect(-110, -14, 220, 28);
        x.restore();
        // Nyhetsplakaten skifter med månedene: Ruhr, pengepressa, brødkø, kuppet.
        x.textAlign = 'center';
        x.fillStyle = '#e9dfc7';
        x.fillRect(14, 150, 218, 96);
        x.fillStyle = '#1d1c22';
        const words = news.split(' ');
        const half = Math.ceil(words.length / 2);
        [words.slice(0, half).join(' '), words.slice(half).join(' ')].forEach((line, i) => {
            let fs = 34;
            x.font = `900 ${fs}px ${FONT}`;
            while (x.measureText(line).width > 206 && fs > 14) {
                fs -= 2;
                x.font = `900 ${fs}px ${FONT}`;
            }
            x.fillText(line, 123, 190 + i * 40);
        });
        // Plakat 2: dollarkursen (det alle leste)
        x.fillStyle = '#1d1c22';
        x.fillRect(262, 14, 500, 228);
        x.fillStyle = '#f2b441';
        x.font = `900 40px ${FONT}`;
        x.fillText('1 DOLLAR =', 512, 76);
        x.fillStyle = '#e9dfc7';
        let s = 58;
        x.font = `900 ${s}px ${FONT}`;
        while (x.measureText(rate).width > 470 && s > 20) {
            s -= 2;
            x.font = `900 ${s}px ${FONT}`;
        }
        x.fillText(rate, 512, 152);
        x.fillStyle = '#f2b441';
        x.font = `900 40px ${FONT}`;
        x.fillText('MARK', 512, 214);
        // Plakat 3: grønn og gul blokk
        x.fillStyle = '#6f8f5a';
        x.fillRect(786, 14, 224, 228);
        x.fillStyle = '#f2b441';
        x.fillRect(820, 40, 70, 150);
        x.fillStyle = '#e9dfc7';
        x.font = `900 26px ${FONT}`;
        x.fillText('BERLIN', 900, 222);
        tex.needsUpdate = true;
    };
    const drawRate = (r: string, n: string) => {
        if (r === rate && n === news) return;
        rate = r;
        news = n;
        paint();
    };
    if (typeof document !== 'undefined' && document.fonts?.ready)
        void document.fonts.ready.then(paint);
    return { tex, drawRate };
}

/** Liten tekst som svever over kjerra («≈ 3 BRØD») - tegnes i 3D, så den dekker aldri spillet som DOM-tekst. */
export function makeTag(): {
    tex: THREE.CanvasTexture;
    draw: (text: string, color: string) => void;
} {
    const W = 256;
    const H = 72;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d')!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const draw = (text: string, color: string) => {
        x.clearRect(0, 0, W, H);
        x.font = `900 40px ${FONT}`;
        const tw = Math.min(W - 8, x.measureText(text).width + 30);
        x.fillStyle = '#1d1c22';
        x.fillRect((W - tw) / 2, 6, tw, H - 12);
        x.fillStyle = color;
        x.fillRect((W - tw) / 2, H - 12, tw, 6);
        x.fillStyle = '#f4efe4';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(text, W / 2, H / 2 - 2);
        tex.needsUpdate = true;
    };
    return { tex, draw };
}
