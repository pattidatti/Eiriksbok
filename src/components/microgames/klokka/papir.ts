// Det som står stille i tegningen, tegnet én gang til offscreen-lerreter: blåkopipapiret
// (flekker, fiberkorn, blekede kanter, rammen) og skipssnittet (skrog med nagler, dekk,
// rom, trapper, davitene, målelinja). Snittet blittes med rotasjon for krengningen.

import { ARK, DAVIT, DEKK_Y, MIDT, SKROG, TRAPP } from './geom';

export const P = {
    papir: '#14284f',
    dyp: '#0a1530',
    hvit: '#dce6f0',
    gul: '#f2c25a',
    rød: '#c8463a',
    blyant: '#7f93b3',
};

export const SKRIFT = '"Courier New", ui-monospace, monospace';
export const TALL = 'Outfit, Inter, system-ui, sans-serif';

/** En liten, fast tilfeldighet (samme tegning hver gang). */
export function frø(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Strek tegnet to ganger med litt forskyvning, så det ser håndtegnet ut. */
export function strek(
    c: CanvasRenderingContext2D,
    sti: () => void,
    bredde: number,
    farge: string,
    alfa = 0.92
) {
    c.lineWidth = bredde;
    c.strokeStyle = farge;
    c.globalAlpha = alfa;
    c.beginPath();
    sti();
    c.stroke();
    c.translate(0.6, 0.45);
    c.globalAlpha = alfa * 0.38;
    c.beginPath();
    sti();
    c.stroke();
    c.translate(-0.6, -0.45);
    c.globalAlpha = 1;
}

export function etikett(
    c: CanvasRenderingContext2D,
    t: string,
    x: number,
    y: number,
    px = 10,
    farge = P.blyant,
    align: CanvasTextAlign = 'left',
    vekt = 700
) {
    c.fillStyle = farge;
    c.font = `${vekt} ${px}px ${SKRIFT}`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillText(t, x, y);
}

function lerret(w: number, h: number) {
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(w));
    cv.height = Math.max(1, Math.round(h));
    return cv;
}

/** Blåkopipapiret i full størrelse (piksler). */
export function lagPapir(w: number, h: number, lav: boolean): HTMLCanvasElement {
    const cv = lerret(w, h);
    const c = cv.getContext('2d')!;
    const r = frø(1912);
    c.fillStyle = P.papir;
    c.fillRect(0, 0, w, h);
    // Flekker: blåfargen er ujevn.
    const n = lav ? 18 : 40;
    for (let i = 0; i < n; i++) {
        const x = r() * w;
        const y = r() * h;
        const rad = (0.08 + r() * 0.25) * Math.max(w, h);
        const g = c.createRadialGradient(x, y, 0, x, y, rad);
        const lys = r() < 0.5;
        g.addColorStop(0, lys ? 'rgba(40,70,125,0.32)' : 'rgba(8,20,48,0.32)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
    }
    // Fiberkorn.
    const k = Math.round(((lav ? 0.6 : 1.4) * w * h) / 900);
    c.strokeStyle = '#dce6f0';
    c.lineWidth = 1;
    for (let i = 0; i < k; i++) {
        const x = r() * w;
        const y = r() * h;
        const a = r() * Math.PI;
        const l = 2 + r() * 6;
        c.globalAlpha = 0.02 + r() * 0.035;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        c.stroke();
    }
    c.globalAlpha = 1;
    // Blekede kanter.
    const g = c.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.35,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.75
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(150,175,210,0.16)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    return cv;
}

/** Tegningens ramme (i arkets mål). */
export function ramme(c: CanvasRenderingContext2D) {
    strek(c, () => c.rect(7, 7, ARK.w - 14, ARK.h - 14), 1.4, P.hvit, 0.55);
    strek(c, () => c.rect(11, 11, ARK.w - 22, ARK.h - 22), 0.8, P.hvit, 0.35);
    // Rutemerker langs kanten, som på en verftstegning.
    c.globalAlpha = 0.4;
    c.strokeStyle = P.hvit;
    c.lineWidth = 0.8;
    for (let x = 60; x < ARK.w - 20; x += 100) {
        c.beginPath();
        c.moveTo(x, 7);
        c.lineTo(x, 11);
        c.moveTo(x, ARK.h - 7);
        c.lineTo(x, ARK.h - 11);
        c.stroke();
    }
    c.globalAlpha = 1;
}

/** Skipssnittet i skipets ramme, tegnet til et lerret med arkets mål x skala. */
export function lagSnitt(skala: number): HTMLCanvasElement {
    const cv = lerret(ARK.w * skala, ARK.h * skala);
    const c = cv.getContext('2d')!;
    c.scale(skala, skala);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const r = frø(80);
    const { x0, x1, kjøl, rund } = SKROG;
    const topp = DEKK_Y(7);

    // Senterlinja (strek-prikk).
    c.setLineDash([14, 4, 2, 4]);
    strek(
        c,
        () => {
            c.moveTo(MIDT, 72);
            c.lineTo(MIDT, kjøl + 30);
        },
        0.8,
        P.blyant,
        0.5
    );
    c.setLineDash([]);

    // Rom: skillevegger i hvert dekk.
    for (let i = 0; i < 7; i++) {
        const y0 = DEKK_Y(i + 1);
        const y1 = DEKK_Y(i);
        let x = x0 + 8 + r() * 14;
        while (x < x1 - 20) {
            x += 22 + r() * 26;
            if (x > x1 - 12) break;
            if (Object.values(TRAPP).some((t) => Math.abs(t.x - x) < 16)) continue;
            strek(
                c,
                () => {
                    c.moveTo(x, y0 + 2);
                    c.lineTo(x, y1);
                },
                0.7,
                P.blyant,
                0.55
            );
        }
    }
    // Dobbelbunnen.
    strek(
        c,
        () => {
            c.moveTo(x0 + 8, kjøl - 12);
            c.lineTo(x1 - 8, kjøl - 12);
        },
        0.8,
        P.blyant,
        0.6
    );

    // Dekkene.
    for (let i = 0; i <= 7; i++) {
        const y = DEKK_Y(i);
        const ut = i === 7 ? 12 : 0;
        strek(
            c,
            () => {
                c.moveTo(x0 - ut, y);
                c.lineTo(x1 + ut, y);
            },
            i === 7 ? 2.4 : 1.2,
            P.hvit,
            i === 7 ? 0.95 : 0.75
        );
    }
    const navn = ['G-DEKK', 'F-DEKK', 'E-DEKK', 'D-DEKK', 'C-DEKK', 'B-DEKK', 'A-DEKK'];
    for (let i = 0; i < 7; i++) etikett(c, navn[i], x0 + 6, DEKK_Y(i + 1) + 10, 10, P.blyant);

    // Skroget med nagler.
    const skrog = () => {
        c.moveTo(x0, topp);
        c.lineTo(x0, kjøl - rund);
        c.quadraticCurveTo(x0, kjøl, x0 + rund, kjøl);
        c.lineTo(x1 - rund, kjøl);
        c.quadraticCurveTo(x1, kjøl, x1, kjøl - rund);
        c.lineTo(x1, topp);
    };
    strek(c, skrog, 2.4, P.hvit, 0.95);
    c.fillStyle = P.hvit;
    c.globalAlpha = 0.6;
    for (let y = topp + 6; y < kjøl - rund; y += 7) {
        for (const x of [x0 + 3.5, x1 - 3.5]) {
            c.beginPath();
            c.arc(x, y, 0.75, 0, Math.PI * 2);
            c.fill();
        }
    }
    for (let x = x0 + rund; x < x1 - rund; x += 7) {
        c.beginPath();
        c.arc(x, kjøl - 3.5, 0.75, 0, Math.PI * 2);
        c.fill();
    }
    for (let x = x0 - 8; x < x1 + 10; x += 9) {
        c.beginPath();
        c.arc(x, topp + 3, 0.7, 0, Math.PI * 2);
        c.fill();
    }
    c.globalAlpha = 1;

    // Trappene: en sjakt med løp som går i sikksakk.
    for (const k of [1, 2, 3] as const) {
        const t = TRAPP[k];
        const bunn = DEKK_Y(t.fra);
        strek(c, () => c.rect(t.x - 12, topp, 24, bunn - topp), 0.8, P.blyant, 0.6);
        for (let i = t.fra; i < 7; i++) {
            const a = DEKK_Y(i);
            const b = DEKK_Y(i + 1);
            const v = (i - t.fra) % 2 === 0 ? -1 : 1;
            strek(
                c,
                () => {
                    c.moveTo(t.x + v * 9, a);
                    c.lineTo(t.x - v * 9, b);
                    for (let s = 1; s < 6; s++) {
                        const yy = a + ((b - a) * s) / 6;
                        const xx = t.x + v * 9 - (v * 18 * s) / 6;
                        c.moveTo(xx, yy);
                        c.lineTo(xx + v * 3, yy);
                    }
                },
                1,
                P.hvit,
                0.7
            );
        }
    }

    // Davitene: en bue fra dekket og ut over vannet, med et tau ned.
    for (const side of ['B', 'S'] as const) {
        const tip = DAVIT[side];
        const fot = { x: side === 'B' ? x0 + 4 : x1 - 4, y: topp };
        const v = side === 'B' ? -1 : 1;
        const bue = (dx: number) => () => {
            c.moveTo(fot.x + dx, fot.y);
            c.bezierCurveTo(fot.x + dx, fot.y - 42, tip.x - v * 30, tip.y - 16, tip.x, tip.y - 2);
        };
        strek(c, bue(0), 2.2, P.hvit, 0.95);
        strek(c, bue(v * 4), 1, P.hvit, 0.6);
        c.fillStyle = P.papir;
        c.beginPath();
        c.arc(fot.x, fot.y - 4, 3.2, 0, Math.PI * 2);
        c.fill();
        strek(c, () => c.arc(fot.x, fot.y - 4, 3.2, 0, Math.PI * 2), 1, P.hvit, 0.9);
        strek(c, () => c.arc(tip.x, tip.y, 3, 0, Math.PI * 2), 1, P.hvit, 0.9);
    }

    // Målelinja under kjølen: bredden på skipet.
    const my = kjøl + 18;
    strek(
        c,
        () => {
            c.moveTo(x0, kjøl + 6);
            c.lineTo(x0, my + 6);
            c.moveTo(x1, kjøl + 6);
            c.lineTo(x1, my + 6);
            c.moveTo(x0, my);
            c.lineTo(MIDT - 34, my);
            c.moveTo(MIDT + 34, my);
            c.lineTo(x1, my);
            c.moveTo(x0 + 7, my - 3);
            c.lineTo(x0, my);
            c.lineTo(x0 + 7, my + 3);
            c.moveTo(x1 - 7, my - 3);
            c.lineTo(x1, my);
            c.lineTo(x1 - 7, my + 3);
        },
        0.9,
        P.hvit,
        0.7
    );
    etikett(c, '28,2 M', MIDT, my, 10, P.hvit, 'center');
    return cv;
}
