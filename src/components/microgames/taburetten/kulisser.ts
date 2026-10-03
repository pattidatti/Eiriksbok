// Kulissene og tingene i gata som tresnitt: hindringer, avisark, husfasader på Karl Johan,
// Stortinget, Slottet, brosteinen og avisplakatene (valgbannerne).

import { FARGE } from './farger';
import type { HType } from './levels';
import { form, frø, lerret, PAPIR, skraver, SVERTE, type Ctx } from './tegning';

/** Lys papirkant rundt en hindring, så den skiller seg fra mengden. */
function kant(ctx: Ctx, sti: (k: Ctx) => void) {
    ctx.beginPath();
    sti(ctx);
    ctx.lineWidth = 16;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fffaf0';
    ctx.stroke();
}

/** Hindringene, tegnet så bunnen er bunnen av lerretet. Mål i piksler: 128 px = 1 m. */
export function tegnHindring(type: HType): HTMLCanvasElement {
    if (type === 'kjerre') {
        const [c, ctx] = lerret(256, 96);
        // melkekjerre med spann
        const kasse = (k: Ctx) => k.rect(26, 22, 204, 40);
        const spann = (k: Ctx) => {
            for (const x of [50, 104, 158]) k.rect(x, 2, 38, 28);
        };
        kant(ctx, kasse);
        kant(ctx, spann);
        form(ctx, spann, { farge: '#d9d2c0', skygge: 5, strek: 3 });
        form(ctx, kasse, { farge: FARGE.gull, skygge: 6, kryss: true, strek: 5 });
        for (const x of [62, 196]) {
            form(ctx, (k) => k.arc(x, 72, 22, 0, Math.PI * 2), { farge: '#8a5a2a', strek: 5 });
            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
                ctx.moveTo(x, 72);
                ctx.lineTo(x + 20 * Math.cos(a), 72 + 20 * Math.sin(a));
            }
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        return c;
    }
    if (type === 'lav') {
        // hestesporvogn (sett fra siden, smal i spillet)
        const [c, ctx] = lerret(224, 192);
        const vogn = (k: Ctx) => {
            k.moveTo(10, 40);
            k.lineTo(214, 40);
            k.lineTo(214, 156);
            k.lineTo(10, 156);
            k.closePath();
        };
        kant(ctx, vogn);
        form(ctx, vogn, { farge: '#b7c25a', skygge: 7, strek: 6 });
        form(ctx, (k) => k.rect(4, 26, 216, 16), { farge: SVERTE, strek: 4 });
        for (const x of [24, 84, 144]) {
            form(ctx, (k) => k.rect(x, 54, 50, 46), { farge: PAPIR, skygge: 4, strek: 4 });
        }
        ctx.font = 'bold 22px Georgia, serif';
        ctx.fillStyle = SVERTE;
        ctx.textAlign = 'center';
        ctx.fillText('SPORVOGN', 112, 132);
        for (const x of [46, 178]) {
            form(ctx, (k) => k.arc(x, 168, 22, 0, Math.PI * 2), { farge: SVERTE, strek: 4 });
        }
        return c;
    }
    if (type === 'middels') {
        // gasslykt
        const [c, ctx] = lerret(160, 352);
        const stolpe = (k: Ctx) => {
            k.moveTo(70, 80);
            k.lineTo(90, 80);
            k.lineTo(96, 330);
            k.lineTo(64, 330);
            k.closePath();
        };
        const lykt = (k: Ctx) => {
            k.moveTo(36, 20);
            k.lineTo(124, 20);
            k.lineTo(110, 86);
            k.lineTo(50, 86);
            k.closePath();
        };
        kant(ctx, stolpe);
        kant(ctx, lykt);
        form(ctx, stolpe, { farge: '#3a3430', skygge: 4, kryss: true, strek: 5 });
        form(ctx, lykt, { farge: '#f3d77a', strek: 6 });
        form(ctx, (k) => k.rect(26, 6, 108, 16), { farge: SVERTE, strek: 4 });
        form(ctx, (k) => k.rect(40, 322, 80, 26), { farge: '#3a3430', skygge: 4, strek: 5 });
        return c;
    }
    // tråd: et hengende gateskilt under telegraftråden
    const [c, ctx] = lerret(256, 160);
    ctx.strokeStyle = SVERTE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.quadraticCurveTo(128, 30, 256, 12);
    ctx.moveTo(80, 22);
    ctx.lineTo(80, 70);
    ctx.moveTo(176, 22);
    ctx.lineTo(176, 70);
    ctx.stroke();
    const skilt = (k: Ctx) => k.rect(52, 66, 152, 88);
    kant(ctx, skilt);
    form(ctx, skilt, { farge: FARGE.gull, skygge: 7, strek: 6 });
    ctx.fillStyle = SVERTE;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('DUKK!', 128, 122);
    return c;
}

/** Avisark fra vittighetsbladene: forside med masthode og spalter. */
export function tegnAvisark(navn: string): HTMLCanvasElement {
    const [c, ctx] = lerret(128, 160);
    form(ctx, (k) => k.rect(6, 6, 116, 148), { farge: '#fffaf0', strek: 4 });
    ctx.fillStyle = SVERTE;
    ctx.font = 'bold 19px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(navn, 64, 30);
    ctx.fillRect(14, 36, 100, 3);
    // karikatur-rute
    ctx.save();
    ctx.beginPath();
    ctx.rect(14, 44, 54, 50);
    ctx.clip();
    skraver(ctx, 40, 4, 1.2);
    ctx.restore();
    ctx.strokeRect(14, 44, 54, 50);
    const r = frø(navn.length * 7);
    for (let y = 48; y < 146; y += 7) {
        const x0 = y < 96 ? 74 : 14;
        ctx.fillRect(x0, y, (114 - x0) * (0.7 + r() * 0.3), 2.5);
    }
    return c;
}

/** Husfasader langs Karl Johan, gjentas sidelengs. */
export function tegnFasader(): HTMLCanvasElement {
    const [c, ctx] = lerret(1024, 384);
    const r = frø(11);
    let x = 0;
    while (x < 1024) {
        const b = 150 + Math.floor(r() * 90);
        const h = 230 + Math.floor(r() * 120);
        const top = 384 - h;
        const hus = (k: Ctx) => k.rect(x, top, b, h);
        form(ctx, hus, { farge: r() < 0.5 ? '#ddd0b0' : '#d8c8a4', strek: 4, forskyv: 0 });
        ctx.save();
        ctx.beginPath();
        hus(ctx);
        ctx.clip();
        skraver(ctx, 0, 9, 1, 'rgba(34,28,24,0.45)');
        ctx.restore();
        // gesims og vinduer
        ctx.fillStyle = SVERTE;
        ctx.fillRect(x, top, b, 10);
        for (let wy = top + 30; wy < 340; wy += 54)
            for (let wx = x + 18; wx < x + b - 30; wx += 40) {
                ctx.fillStyle = SVERTE;
                ctx.fillRect(wx, wy, 22, 34);
                ctx.fillStyle = PAPIR;
                ctx.fillRect(wx + 3, wy + 3, 7, 12);
                ctx.fillRect(wx - 4, wy - 6, 30, 4);
            }
        x += b + 4;
    }
    return c;
}

/** Stortingsbygningen: gul murstein og den runde salen med tårn. */
export function tegnStortinget(): HTMLCanvasElement {
    const [c, ctx] = lerret(768, 384);
    const fløy = (k: Ctx) => {
        k.rect(20, 200, 260, 184);
        k.rect(488, 200, 260, 184);
    };
    form(ctx, fløy, { farge: '#d9b46a', skygge: 8, strek: 5 });
    const sal = (k: Ctx) => {
        k.moveTo(250, 384);
        k.lineTo(250, 170);
        k.quadraticCurveTo(384, 70, 518, 170);
        k.lineTo(518, 384);
        k.closePath();
    };
    form(ctx, sal, { farge: '#d9b46a', skygge: 7, kryss: true, strek: 6 });
    form(ctx, (k) => k.rect(340, 40, 88, 90), { farge: '#d9b46a', skygge: 6, strek: 5 });
    form(
        ctx,
        (k) => {
            k.moveTo(330, 42);
            k.lineTo(384, 0);
            k.lineTo(438, 42);
            k.closePath();
        },
        { farge: '#5c6b5a', strek: 5 }
    );
    ctx.fillStyle = SVERTE;
    for (let x = 280; x < 500; x += 34) {
        ctx.beginPath();
        ctx.arc(x + 10, 230, 12, Math.PI, 0);
        ctx.rect(x - 2, 230, 24, 50);
        ctx.fill();
    }
    for (const x0 of [40, 508])
        for (let x = x0; x < x0 + 230; x += 44) ctx.fillRect(x, 240, 22, 40);
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('STORTINGET', 384, 340);
    return c;
}

/** Slottet på haugen langt bak. */
export function tegnSlottet(): HTMLCanvasElement {
    const [c, ctx] = lerret(768, 256);
    form(
        ctx,
        (k) => {
            k.moveTo(0, 256);
            k.quadraticCurveTo(384, 150, 768, 256);
            k.closePath();
        },
        { farge: '#b9b089', skygge: 9 }
    );
    form(ctx, (k) => k.rect(190, 100, 388, 110), { farge: '#e6dcc0', skygge: 10, strek: 4 });
    form(ctx, (k) => k.rect(330, 70, 108, 140), { farge: '#e6dcc0', skygge: 8, strek: 4 });
    ctx.fillStyle = SVERTE;
    for (let x = 342; x < 430; x += 18) ctx.fillRect(x, 110, 7, 96);
    for (let x = 206; x < 570; x += 26) if (x < 326 || x > 440) ctx.fillRect(x, 130, 12, 22);
    ctx.fillRect(382, 30, 4, 42);
    ctx.fillStyle = FARGE.rød;
    ctx.fillRect(386, 30, 34, 20);
    return c;
}

/** Brosteinen og fortauet. */
export function tegnBrostein(): HTMLCanvasElement {
    const [c, ctx] = lerret(512, 256);
    ctx.fillStyle = '#d6c9a8';
    ctx.fillRect(0, 0, 512, 256);
    const r = frø(5);
    ctx.strokeStyle = SVERTE;
    ctx.lineWidth = 2.5;
    for (let y = 0; y < 256; y += 22) {
        const fors = (y / 22) % 2 ? 16 : 0;
        for (let x = -32 + fors; x < 512; x += 32) {
            ctx.beginPath();
            ctx.ellipse(x + 16, y + 11, 13 + r() * 2, 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 16);
            ctx.lineTo(x + 26, y + 13);
            ctx.stroke();
        }
    }
    return c;
}

/** Himmel-streker (tresnitt-skyer) på bart papir. */
export function tegnSky(): HTMLCanvasElement {
    const [c, ctx] = lerret(512, 128);
    const r = frø(3);
    ctx.strokeStyle = 'rgba(34,28,24,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
        const y = 20 + i * 10;
        const x0 = 60 + r() * 60 - i * 6;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + 200 + r() * 160 - Math.abs(i - 4) * 30, y);
        ctx.stroke();
    }
    return c;
}

export interface Plakat {
    overskrift: string;
    tekst: string;
    rødt: number;
    navn: string | null;
    farge: 'rød' | 'blå' | null;
}

/** Avisplakaten som ruller inn fra høyre (tegnes på en crispCanvas i logiske mål). */
export function tegnPlakat(ctx: Ctx, w: number, h: number, p: Plakat, portrett?: CanvasImageSource) {
    const ramme = p.farge ? FARGE[p.farge] : SVERTE;
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 12;
    ctx.strokeStyle = ramme;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.lineWidth = 3;
    ctx.strokeStyle = SVERTE;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.fillStyle = SVERTE;
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText(p.overskrift, w / 2, 52);
    ctx.fillRect(30, 62, w - 60, 3);
    const harPortrett = !!(p.navn && portrett);
    const tx = harPortrett ? w * 0.6 : w / 2;
    ctx.font = 'bold 40px Georgia, serif';
    const ord = p.tekst.toUpperCase().split(': ');
    ctx.fillText(ord[0], tx, 116);
    if (ord[1]) {
        ctx.fillStyle = ramme;
        ctx.fillText(ord[1], tx, 162);
    }
    ctx.fillStyle = SVERTE;
    ctx.font = 'bold 26px Georgia, serif';
    const blått = 114 - p.rødt;
    ctx.fillStyle = FARGE.rød;
    ctx.fillText(`${p.rødt} RØDT`, tx - 78, h - 40);
    ctx.fillStyle = FARGE.blå;
    ctx.fillText(`${blått} BLÅTT`, tx + 78, h - 40);
    if (harPortrett) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(110, h / 2 + 12, 80, 96, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.farge ? FARGE[p.farge] : PAPIR;
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.clip();
        ctx.drawImage(portrett!, 20, 2, 190, 238);
        ctx.restore();
        ctx.lineWidth = 6;
        ctx.strokeStyle = ramme;
        ctx.beginPath();
        ctx.ellipse(110, h / 2 + 12, 80, 96, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}
