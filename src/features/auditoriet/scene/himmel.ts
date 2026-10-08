// Himmelen i vinduene følger klokka: morgenrøde, blå dag med skyer, kveldsgull og
// natt med stjerner. Tegnes én gang per time, for alle vinduer i rommet.

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

type Fase = 'natt' | 'morgen' | 'dag' | 'kveld';

export function fase(dato = new Date()): Fase {
    const t = dato.getHours() + dato.getMinutes() / 60;
    if (t < 6 || t >= 21.5) return 'natt';
    if (t < 8.5) return 'morgen';
    if (t < 17.5) return 'dag';
    return 'kveld';
}

const FARGER: Record<Fase, [string, string, string]> = {
    natt: ['#0f1b3d', '#1e2f5c', '#33467a'],
    morgen: ['#7aa7d9', '#f6c8a8', '#fde7c2'],
    dag: ['#6fb3ea', '#a9d6f5', '#e3f2fb'],
    kveld: ['#3b4f8f', '#e58f63', '#fcd38a'],
};

function frøTall(n: number) {
    const x = Math.sin(n * 91.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Lager himmelteksturen. Kalleren eier den og må kalle dispose(). */
export function lagHimmel(dato = new Date()): THREE.CanvasTexture {
    const f = fase(dato);
    const W = 256;
    const H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const [topp, midt, bunn] = FARGER[f];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, topp);
    g.addColorStop(0.6, midt);
    g.addColorStop(1, bunn);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (f === 'natt') {
        for (let i = 0; i < 70; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.4 + frøTall(i) * 0.6})`;
            const r = frøTall(i + 300) * 1.6 + 0.6;
            ctx.beginPath();
            ctx.arc(frøTall(i + 100) * W, frøTall(i + 200) * H * 0.75, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.arc(W * 0.7, H * 0.18, 20, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Skyer: noen myke klumper.
        ctx.fillStyle = f === 'kveld' ? 'rgba(255,214,170,0.55)' : 'rgba(255,255,255,0.75)';
        for (let s = 0; s < 4; s++) {
            const cx = frøTall(s + 11) * W;
            const cy = 60 + frøTall(s + 21) * H * 0.5;
            for (let k = 0; k < 5; k++) {
                ctx.beginPath();
                ctx.ellipse(cx + (k - 2) * 22, cy + Math.sin(k * 1.7) * 6, 30, 16, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    // Trærne og takene langt borte nederst.
    ctx.fillStyle = f === 'natt' ? '#0b1530' : f === 'dag' ? '#5b8a5a' : '#4c5a6b';
    for (let x = -10; x < W + 20; x += 26) {
        ctx.beginPath();
        ctx.arc(x, H - 18 + frøTall(x) * 10, 26 + frøTall(x + 7) * 12, Math.PI, 0);
        ctx.fill();
    }
    ctx.fillRect(0, H - 18, W, 18);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/** Tegnet med tekst på en canvas, f.eks. PÅ LUFTA-lampa og salsskiltet. */
export function lagSkilt(w: number, h: number, tegn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    tegn(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

export const SKRIFT = '"Outfit", "Inter", system-ui, sans-serif';

/** Himmelteksturen, byttet hver hele time. Deles av alle vinduene i rommet. */
export function useHimmel() {
    const [time, setTime] = useState(() => new Date().getHours());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date().getHours()), 60000);
        return () => clearInterval(t);
    }, []);
    const tex = useMemo(() => {
        const d = new Date();
        d.setHours(time, 30);
        return lagHimmel(d);
    }, [time]);
    useEffect(() => () => tex.dispose(), [tex]);
    return tex;
}

