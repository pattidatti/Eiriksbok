// Tresnitt på papir: alle figurene tegnes én gang i canvas ved oppstart (konturer i sverte,
// skravering med parallelle streker, rødt og blått lagt litt utenfor strekene som håndkolorering).

import * as THREE from 'three';
import { FARGE } from './farger';
import type { Figur } from './levels';

export const SVERTE = FARGE.hatt;
export const PAPIR = '#ece0c4';
export const FALMET = FARGE.gate;

export type Ctx = CanvasRenderingContext2D;

export function lerret(w: number, h: number): [HTMLCanvasElement, Ctx] {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')!];
}

export function tekstur(c: HTMLCanvasElement, gjenta = false): THREE.CanvasTexture {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (gjenta) t.wrapS = THREE.RepeatWrapping;
    return t;
}

/** Liten frøet tilfeldighet, så tresnittet ser likt ut hver gang. */
export function frø(s: number) {
    let x = s >>> 0 || 1;
    return () => {
        x = (x * 1664525 + 1013904223) >>> 0;
        return x / 4294967296;
    };
}

/** Skraver det som er klippet ut nå: parallelle streker i en vinkel (grader). */
export function skraver(ctx: Ctx, vinkel: number, avstand: number, bredde = 1.2, farge = SVERTE) {
    const { width: w, height: h } = ctx.canvas;
    const d = Math.hypot(w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((vinkel * Math.PI) / 180);
    ctx.strokeStyle = farge;
    ctx.lineWidth = bredde;
    ctx.beginPath();
    for (let y = -d; y < d; y += avstand) {
        ctx.moveTo(-d, y);
        ctx.lineTo(d, y);
    }
    ctx.stroke();
    ctx.restore();
}

/** Fyll en sti med farge (forskjøvet som håndkolorering), skraver skyggesiden og trekk konturen. */
export function form(
    ctx: Ctx,
    sti: (c: Ctx) => void,
    o: { farge?: string; skygge?: number; kryss?: boolean; strek?: number; forskyv?: number } = {}
) {
    const f = o.forskyv ?? 3;
    if (o.farge) {
        ctx.save();
        ctx.translate(f, f * 0.6);
        ctx.beginPath();
        sti(ctx);
        ctx.fillStyle = o.farge;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.restore();
    }
    if (o.skygge) {
        ctx.save();
        ctx.beginPath();
        sti(ctx);
        ctx.clip();
        skraver(ctx, 35, o.skygge, 1.3);
        if (o.kryss) skraver(ctx, -40, o.skygge * 1.3, 1.1);
        ctx.restore();
    }
    ctx.beginPath();
    sti(ctx);
    ctx.lineWidth = o.strek ?? 4;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = SVERTE;
    ctx.stroke();
}

/** Skygge på én side: skraver bare høyre del (lyset kommer fra venstre). */
function sideskygge(ctx: Ctx, sti: (c: Ctx) => void, fraX: number, avstand = 6) {
    ctx.save();
    ctx.beginPath();
    sti(ctx);
    ctx.clip();
    ctx.beginPath();
    ctx.rect(fraX, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.clip();
    skraver(ctx, 30, avstand, 1.2);
    ctx.restore();
}

// ---------- Hendene ----------

/** Åpen hånd med ermekant. Hvit fyll blir farget av instansfargen; streken blir sverte. */
export function tegnHånd(): HTMLCanvasElement {
    const [c, ctx] = lerret(96, 128);
    const hånd = (k: Ctx) => {
        k.moveTo(30, 120);
        k.lineTo(28, 70);
        // tommel
        k.quadraticCurveTo(14, 64, 10, 48);
        k.quadraticCurveTo(14, 40, 24, 50);
        k.lineTo(30, 58);
        // fingrene
        const fingre = [
            [30, 20],
            [44, 8],
            [58, 12],
            [70, 26],
        ];
        for (const [x, y] of fingre) {
            k.lineTo(x, y + 14);
            k.quadraticCurveTo(x + 5, y - 4, x + 10, y + 14);
        }
        k.lineTo(80, 64);
        k.lineTo(70, 120);
        k.closePath();
    };
    ctx.save();
    ctx.translate(3, 2);
    ctx.beginPath();
    hånd(ctx);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    hånd(ctx);
    ctx.clip();
    ctx.beginPath();
    ctx.rect(56, 0, 96, 128);
    ctx.clip();
    skraver(ctx, 25, 5, 1.4);
    ctx.restore();
    ctx.beginPath();
    hånd(ctx);
    ctx.lineWidth = 4;
    ctx.strokeStyle = SVERTE;
    ctx.stroke();
    // mansjett
    ctx.fillStyle = PAPIR;
    ctx.fillRect(26, 100, 48, 14);
    ctx.strokeRect(26, 100, 48, 14);
    return c;
}

/** Ermet: loddrette skraverte streker som tåler å strekkes. */
export function tegnErme(): HTMLCanvasElement {
    const [c, ctx] = lerret(32, 64);
    ctx.fillStyle = '#fff';
    ctx.fillRect(5, 0, 22, 64);
    ctx.fillStyle = SVERTE;
    ctx.fillRect(3, 0, 4, 64);
    ctx.fillRect(25, 0, 4, 64);
    ctx.fillRect(17, 0, 2, 64);
    ctx.fillRect(21, 0, 2, 64);
    return c;
}

/** En rad med hoder og skuldre i mengden (gjentas langs gata). */
export function tegnMengde(seed: number): HTMLCanvasElement {
    const [c, ctx] = lerret(1024, 160);
    const r = frø(seed);
    ctx.fillStyle = SVERTE;
    ctx.fillRect(0, 118, 1024, 42);
    for (let x = -20; x < 1044; x += 34 + r() * 16) {
        const y = 70 + r() * 18;
        // skuldre
        ctx.beginPath();
        ctx.ellipse(x, y + 52, 26, 22, 0, Math.PI, 0);
        ctx.lineTo(x + 26, 160);
        ctx.lineTo(x - 26, 160);
        ctx.closePath();
        ctx.fillStyle = r() < 0.5 ? SVERTE : '#4a4038';
        ctx.fill();
        // hode
        ctx.beginPath();
        ctx.arc(x, y + 14, 15, 0, Math.PI * 2);
        ctx.fillStyle = PAPIR;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = SVERTE;
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y + 14, 15, 0, Math.PI * 2);
        ctx.clip();
        skraver(ctx, 30, 5, 1.1);
        ctx.restore();
        // hatt: flosshatt, skyggelue eller bløt hatt
        ctx.fillStyle = SVERTE;
        const h = r();
        if (h < 0.35) {
            ctx.fillRect(x - 11, y - 22, 22, 28);
            ctx.fillRect(x - 17, y + 2, 34, 5);
        } else if (h < 0.7) {
            ctx.beginPath();
            ctx.ellipse(x, y + 2, 17, 9, 0, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(x - 4, y + 2, 24, 4);
        } else {
            ctx.beginPath();
            ctx.ellipse(x, y + 3, 20, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x, y - 3, 12, 10, 0, Math.PI, 0);
            ctx.fill();
        }
    }
    return c;
}

// ---------- Stolen og statsrådene ----------

/** Taburetten: tykke dreide ben og et polstret sete. */
export function tegnStol(): HTMLCanvasElement {
    const [c, ctx] = lerret(256, 192);
    const tre = '#b07a3a';
    // ben
    for (const x of [44, 92, 164, 206]) {
        const bak = x === 92 || x === 164;
        form(
            ctx,
            (k) => {
                k.moveTo(x - 9, 84);
                k.lineTo(x + 9, 84);
                k.quadraticCurveTo(x + 14, 120, x + 6, 150);
                k.lineTo(x + 8, 184);
                k.lineTo(x - 8, 184);
                k.lineTo(x - 6, 150);
                k.quadraticCurveTo(x - 14, 120, x - 9, 84);
                k.closePath();
            },
            { farge: bak ? '#8a5a2a' : tre, skygge: bak ? 4 : 7, strek: 4 }
        );
    }
    // tverrslå
    form(ctx, (k) => k.rect(40, 140, 176, 10), { farge: tre, skygge: 6, strek: 3 });
    // sete (polstret, med knapper)
    form(
        ctx,
        (k) => {
            k.moveTo(18, 88);
            k.quadraticCurveTo(20, 40, 128, 36);
            k.quadraticCurveTo(236, 40, 238, 88);
            k.closePath();
        },
        { farge: '#9e2f24', skygge: 7, strek: 5 }
    );
    form(ctx, (k) => k.rect(14, 82, 228, 16), { farge: tre, skygge: 5, kryss: true, strek: 4 });
    ctx.fillStyle = FARGE.gull;
    for (const x of [70, 128, 186]) {
        ctx.beginPath();
        ctx.arc(x, 62, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    return c;
}

interface Trekk {
    frakk: string;
    skjegg: 'kinn' | 'hel' | 'bart' | 'stort';
    briller: boolean;
    hår: string;
}

const TREKK: Record<Figur, Trekk> = {
    selmer: { frakk: FARGE.blå, skjegg: 'kinn', briller: false, hår: '#bbb3a0' },
    schweigaard: { frakk: FARGE.blå, skjegg: 'bart', briller: true, hår: '#6b5a48' },
    sverdrup: { frakk: FARGE.rød, skjegg: 'stort', briller: true, hår: '#f4ecd8' },
    venstre: { frakk: FARGE.rød, skjegg: 'hel', briller: false, hår: '#6b4a2b' },
    høyre: { frakk: FARGE.blå, skjegg: 'kinn', briller: false, hår: '#8a7d6b' },
};

/** Karikatur av en statsråd som sitter, i profil mot høyre: stort hode, liten kropp. */
export function tegnStatsråd(f: Figur): HTMLCanvasElement {
    const [c, ctx] = lerret(256, 320);
    const t = TREKK[f];
    // bein (sitter: lår fram, legg ned)
    form(
        ctx,
        (k) => {
            k.moveTo(96, 236);
            k.lineTo(196, 230);
            k.lineTo(204, 300);
            k.lineTo(180, 302);
            k.lineTo(176, 262);
            k.lineTo(100, 270);
            k.closePath();
        },
        { farge: '#3a3430', skygge: 5, kryss: true }
    );
    form(ctx, (k) => k.ellipse(200, 304, 22, 9, 0, 0, Math.PI * 2), { farge: SVERTE });
    // frakken med flagrende skjøt bak
    const frakk = (k: Ctx) => {
        k.moveTo(86, 150);
        k.quadraticCurveTo(128, 138, 160, 152);
        k.lineTo(170, 236);
        k.lineTo(120, 246);
        k.quadraticCurveTo(80, 268, 52, 262);
        k.quadraticCurveTo(70, 236, 80, 220);
        k.closePath();
    };
    form(ctx, frakk, { farge: t.frakk, strek: 5 });
    sideskygge(ctx, frakk, 128, 6);
    form(ctx, frakk, { strek: 5 });
    // skjortebryst og ordensbånd
    form(
        ctx,
        (k) => {
            k.moveTo(140, 152);
            k.lineTo(160, 154);
            k.lineTo(156, 200);
            k.closePath();
        },
        { farge: '#fffaf0', strek: 3 }
    );
    if (f !== 'sverdrup' && f !== 'venstre') {
        ctx.strokeStyle = FARGE.gull;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(96, 154);
        ctx.lineTo(160, 214);
        ctx.stroke();
    }
    // arm som holder seg fast i setet
    form(
        ctx,
        (k) => {
            k.moveTo(116, 168);
            k.quadraticCurveTo(150, 200, 170, 226);
            k.lineTo(160, 236);
            k.quadraticCurveTo(130, 210, 104, 186);
            k.closePath();
        },
        { farge: t.frakk, skygge: 5 }
    );
    form(ctx, (k) => k.arc(170, 234, 10, 0, Math.PI * 2), { farge: '#f1c9a5', strek: 3 });
    // hodet: stort, i profil
    const hode = (k: Ctx) => {
        k.moveTo(92, 92);
        k.quadraticCurveTo(96, 34, 146, 36);
        k.quadraticCurveTo(186, 40, 188, 84);
        // nese
        k.lineTo(212, 104);
        k.lineTo(188, 112);
        k.quadraticCurveTo(190, 140, 158, 148);
        k.quadraticCurveTo(104, 150, 92, 92);
        k.closePath();
    };
    form(ctx, hode, { farge: '#f1c9a5', strek: 5, forskyv: 2 });
    sideskygge(ctx, hode, 102, 7);
    ctx.save();
    ctx.beginPath();
    hode(ctx);
    ctx.clip();
    ctx.beginPath();
    ctx.rect(110, 0, 256, 320);
    ctx.fillStyle = 'rgba(236,224,196,0.55)';
    ctx.fill();
    ctx.restore();
    form(ctx, hode, { strek: 5 });
    // hår bak
    form(
        ctx,
        (k) => {
            k.moveTo(92, 92);
            k.quadraticCurveTo(84, 60, 112, 50);
            k.quadraticCurveTo(110, 80, 118, 104);
            k.quadraticCurveTo(100, 110, 92, 92);
        },
        { farge: t.hår, skygge: 4 }
    );
    // øye og øyebryn
    ctx.fillStyle = SVERTE;
    ctx.beginPath();
    ctx.arc(170, 82, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(158, 70);
    ctx.lineTo(182, 66);
    ctx.stroke();
    if (t.briller) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(172, 83, 10, 0, Math.PI * 2);
        ctx.moveTo(162, 82);
        ctx.lineTo(132, 78);
        ctx.stroke();
    }
    // skjegg
    const skjegg = (k: Ctx) => {
        if (t.skjegg === 'stort') {
            k.moveTo(118, 100);
            k.quadraticCurveTo(140, 126, 186, 114);
            k.quadraticCurveTo(206, 170, 170, 214);
            k.quadraticCurveTo(150, 236, 134, 206);
            k.quadraticCurveTo(108, 170, 118, 100);
        } else if (t.skjegg === 'hel') {
            k.moveTo(126, 104);
            k.quadraticCurveTo(150, 124, 186, 116);
            k.quadraticCurveTo(190, 160, 160, 172);
            k.quadraticCurveTo(128, 160, 126, 104);
        } else if (t.skjegg === 'kinn') {
            k.moveTo(120, 92);
            k.quadraticCurveTo(140, 104, 136, 140);
            k.quadraticCurveTo(122, 146, 116, 118);
            k.closePath();
        } else {
            k.moveTo(170, 116);
            k.quadraticCurveTo(190, 110, 202, 126);
            k.quadraticCurveTo(186, 120, 172, 126);
            k.closePath();
        }
    };
    form(ctx, skjegg, { farge: t.hår, skygge: 4, strek: 4, forskyv: 1 });
    // munn
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(176, 124);
    ctx.lineTo(188, 122);
    ctx.stroke();
    return c;
}

export type Hatt = 'floss' | 'bløt' | 'lue';

export function hattFor(f: Figur): Hatt {
    return f === 'sverdrup' ? 'bløt' : f === 'venstre' ? 'lue' : 'floss';
}

/** Hatten tegnes for seg, så den kan lette fra hodet på toppen av hoppet. */
export function tegnHatt(h: Hatt): HTMLCanvasElement {
    const [c, ctx] = lerret(160, 160);
    if (h === 'floss') {
        form(
            ctx,
            (k) => {
                k.moveTo(44, 130);
                k.lineTo(50, 20);
                k.quadraticCurveTo(80, 12, 112, 20);
                k.lineTo(116, 130);
                k.closePath();
            },
            { farge: SVERTE, skygge: 5, strek: 4 }
        );
        ctx.fillStyle = '#4a4038';
        ctx.fillRect(46, 108, 70, 12);
        form(ctx, (k) => k.ellipse(80, 134, 62, 11, 0, 0, Math.PI * 2), { farge: SVERTE });
    } else if (h === 'bløt') {
        form(
            ctx,
            (k) => {
                k.moveTo(36, 130);
                k.quadraticCurveTo(46, 60, 82, 62);
                k.quadraticCurveTo(122, 62, 126, 130);
                k.closePath();
            },
            { farge: '#4a4038', skygge: 5, kryss: true }
        );
        form(ctx, (k) => k.ellipse(80, 132, 72, 13, -0.08, 0, Math.PI * 2), { farge: SVERTE });
    } else {
        form(
            ctx,
            (k) => {
                k.moveTo(40, 130);
                k.quadraticCurveTo(50, 84, 90, 88);
                k.quadraticCurveTo(122, 92, 118, 130);
                k.closePath();
            },
            { farge: '#4a4038', skygge: 5 }
        );
        form(ctx, (k) => k.rect(96, 122, 52, 10), { farge: SVERTE });
    }
    return c;
}

/** Livgardist: liten tinnsoldat i blå uniform med gullsnorer, armene i været. */
export function tegnGardist(): HTMLCanvasElement {
    const [c, ctx] = lerret(96, 192);
    // armer opp
    form(
        ctx,
        (k) => {
            k.moveTo(28, 82);
            k.lineTo(22, 10);
            k.lineTo(34, 8);
            k.lineTo(40, 76);
            k.moveTo(56, 76);
            k.lineTo(62, 8);
            k.lineTo(74, 10);
            k.lineTo(68, 82);
        },
        { farge: FARGE.blå, strek: 3 }
    );
    // kropp
    const kropp = (k: Ctx) => {
        k.moveTo(26, 76);
        k.lineTo(70, 76);
        k.lineTo(68, 132);
        k.lineTo(28, 132);
        k.closePath();
    };
    form(ctx, kropp, { farge: FARGE.blå, skygge: 6, strek: 4 });
    ctx.strokeStyle = FARGE.gull;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const y of [90, 102, 114]) {
        ctx.moveTo(34, y);
        ctx.lineTo(62, y);
    }
    ctx.stroke();
    // bukser
    form(
        ctx,
        (k) => {
            k.moveTo(30, 132);
            k.lineTo(46, 132);
            k.lineTo(44, 186);
            k.lineTo(32, 186);
            k.closePath();
            k.moveTo(50, 132);
            k.lineTo(66, 132);
            k.lineTo(64, 186);
            k.lineTo(52, 186);
            k.closePath();
        },
        { farge: '#2b2a33', skygge: 4 }
    );
    // hode og hatt med dusk
    form(ctx, (k) => k.arc(48, 62, 13, 0, Math.PI * 2), { farge: '#f1c9a5', strek: 3 });
    form(ctx, (k) => k.rect(34, 26, 28, 30), { farge: SVERTE, strek: 3 });
    ctx.fillStyle = FARGE.gull;
    ctx.fillRect(34, 48, 28, 5);
    form(ctx, (k) => k.arc(48, 22, 7, 0, Math.PI * 2), { farge: FARGE.rød, strek: 2 });
    return c;
}

/** Tresnitt-glorie: okergule stråler bak stolen ved perfekt bytte. */
export function tegnStråler(): HTMLCanvasElement {
    const [c, ctx] = lerret(256, 256);
    ctx.translate(128, 128);
    for (let i = 0; i < 24; i++) {
        ctx.rotate((Math.PI * 2) / 24);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(126, -10);
        ctx.lineTo(126, 10);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? FARGE.gull : '#e3c26a';
        ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#f4ecd8';
    ctx.fill();
    return c;
}
