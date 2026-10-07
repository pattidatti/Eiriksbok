// HUD-en er selve litografibladet: papirmarg med trykkekant, bildeteksten i nedre marg
// (år og sted i kursiv), «Spart» oppe til høyre, tidslinja 1815-1884 (målet) og bondestripa
// oppe til venstre (Ueland, budsjettet, sjansene). Alt står på solide papirkort, så teksten er skarp.

import { P } from './art';
import type { Fx } from './fx';
import { BRETT } from './levels';
import { grenseNå, grenseVises, iBåndet, sparing } from './rules';
import { FONT } from './scene';
import type { Game } from './state';
import { TUNING } from './tuning';

const T = TUNING;
// Papirmargen er lys tonestein (kunstbriefen), ikke gulnet papir.
const PAPIR = '#e4e6db';
export const MARG = { side: 10, topp: 10, bunn: 500 };

const spd = (n: number) => Math.floor(n).toLocaleString('nb-NO');

export interface HudValg {
    meny: boolean;
    rekord: number;
    øving: boolean;
}

export function tegnRamme(ctx: CanvasRenderingContext2D, g: Game, meny: boolean) {
    // Papirmargen rundt bildet og trykkekanten.
    ctx.fillStyle = PAPIR;
    ctx.fillRect(0, 0, 960, MARG.topp);
    ctx.fillRect(0, 0, MARG.side, 540);
    ctx.fillRect(960 - MARG.side, 0, MARG.side, 540);
    ctx.fillRect(0, MARG.bunn, 960, 40);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(MARG.side, MARG.topp, 960 - 2 * MARG.side, MARG.bunn - MARG.topp);
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(4, 4, 952, 532);
    ctx.globalAlpha = 1;
    // Bildeteksten i fin kursiv under bildet, som på bladene fra 1840-tallet.
    ctx.fillStyle = P.kritt;
    ctx.textAlign = 'center';
    ctx.font = `italic 21px ${FONT}`;
    const sted = meny
        ? 'Pengeballongen - Parti af Norge, 1815-1884'
        : BRETT[g.brett].sted.replace(/^\d{4}/, String(Math.floor(g.år)));
    ctx.fillText(sted, 480, 527);
}

/** Et solid papirkort med mørk kant og skygge: alt i HUD-en står på slike, så teksten er skarp. */
function kort(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = 'rgba(31,35,38,0.28)';
    ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = P.hvit;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
}

export function tegnHud(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, v: HudValg) {
    if (v.meny) return;
    const tid = fx.klokke;

    // Nede til venstre i margen: tastene, så eleven alltid ser grepet.
    ctx.textAlign = 'left';
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = P.kritt;
    const tx = 16 + tast(ctx, 16, 506, 'MELLOMROM');
    ctx.textAlign = 'left';
    if (!g.harRor) ctx.fillText('= penger i brenneren', tx + 8, 522);
    else {
        // Etter riksretten: to taster, kort tekst, så bildeteksten i midten får plass.
        ctx.fillText('= opp', tx + 8, 522);
        const rx = tx + 58;
        const puls = g.ror ? 0 : 0.5 + 0.5 * Math.sin(tid * 6);
        ctx.globalAlpha = 0.75 + 0.25 * puls;
        const rw = tast(ctx, rx, 506, 'PIL NED');
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
        ctx.font = `bold 14px ${FONT}`;
        ctx.fillStyle = P.silkeMørk;
        ctx.fillText('= roret', rx + rw + 8, 522);
    }

    // Oppe til høyre: Spart, stor og rolig på et kort. Spretter når mynter lander.
    kort(ctx, 776, 16, 168, 76);
    ctx.textAlign = 'right';
    ctx.fillStyle = P.kritt;
    ctx.font = `italic 15px ${FONT}`;
    ctx.fillText(v.øving ? 'Spart (øving)' : 'Spart for bøndene', 934, 36);
    const sk = 1 + fx.sprett * 0.18;
    ctx.save();
    ctx.translate(934, 66);
    ctx.scale(sk, sk);
    ctx.font = `bold 30px ${FONT}`;
    // Mens du fyrer, sparer du ingenting: tallet blir grått og står stille.
    const fyrer = g.hold && !g.bæres && g.mode === 'play';
    ctx.fillStyle = fx.sprett > 0.3 ? P.silkeMørk : fyrer ? P.halv : P.kritt;
    ctx.fillText(`${spd(g.spart)} Spd.`, 0, 0);
    ctx.restore();
    // Linja under sier hva som skjer nå: slipp = sparer (+n i sekundet), hold = sparer ingenting.
    ctx.font = `bold 14px ${FONT}`;
    if (g.t < 6) {
        ctx.font = `14px ${FONT}`;
        ctx.fillStyle = P.kritt;
        ctx.fillText('Spd. = speciedaler', 934, 85);
    } else if (g.bæres) {
        ctx.fillStyle = P.karmin;
        ctx.fillText('Staten bærer deg', 934, 85);
    } else if (fyrer) {
        ctx.fillStyle = P.karmin;
        ctx.fillText('Fyrer: sparer ingenting', 934, 85);
    } else if (g.mode === 'play') {
        ctx.fillStyle = P.silkeMørk;
        ctx.fillText(`Slipper: +${Math.round(sparing(g))} i sekundet`, 934, 85);
    }

    tidslinje(ctx, g);
    stripe(ctx, g, fx, tid);

    if (fx.blink > 0) {
        ctx.globalAlpha = fx.blink * 0.5;
        ctx.fillStyle = fx.blinkFarge;
        ctx.fillRect(0, 0, 960, 540);
        ctx.globalAlpha = 1;
    }
}

/**
 * Bondestripa oppe til venstre: ett kort med alt som er bøndenes. Ueland og gangeren til
 * venstre, budsjettet til valget til høyre (en varm bar som tømmes når du fyrer), og sjansene
 * som små ballonger - men bare etter at du har brukt den første.
 */
/** Ankeret til lærings-øyeblikket om valget (1833): baren før Ueland står i stripa. */
export const BUDSJETT = { x: 28, y: 34 };
const STRIPE = { x: 16, y: 14, h: 64 };

function stripe(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, tid: number) {
    const medUeland = fx.uelandSett || g.ganger > 1;
    if (g.ganger > 1) fx.uelandSett = true;
    const medBudsjett = grenseVises(g) && g.mode === 'play' && !!g.ter.valg[g.nesteValg];
    const brukt = g.sjanser < T.sjekk.sjanser;
    if (!medUeland && !medBudsjett && !brukt) return;
    const venstre = medUeland ? 114 : 0;
    const w = venstre + (medBudsjett || brukt ? 160 : 6);
    const { x, y, h } = STRIPE;
    kort(ctx, x, y, w, h);
    // Full fart (over ×5): gullkant som blinker.
    if (medUeland && g.ganger > 5) {
        ctx.strokeStyle = P.silke;
        ctx.lineWidth = 3 + 2 * Math.sin(tid * 9) ** 2;
        ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    }
    if (medUeland) portrett(ctx, g, fx, tid, x + 32, y + h / 2);
    const bx = x + venstre + 12;
    if (medBudsjett) budsjett(ctx, g, fx, tid, bx, y);
    if (brukt) sjanser(ctx, g, fx, x + w - 12, y + 18);
}

/** Sjansene igjen: små ballonger, høyrejustert. En brukt sjanse er et tomt omriss. */
function sjanser(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, høyre: number, y: number) {
    const n = T.sjekk.sjanser;
    for (let i = 0; i < n; i++) {
        const har = i < g.sjanser;
        const cx = høyre - (n - 1 - i) * 16;
        const puls = !har && i === g.sjanser ? Math.max(0, fx.blink) : 0;
        ctx.beginPath();
        ctx.ellipse(cx, y - puls * 3, 5, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = P.silke;
        if (har) ctx.fill();
        ctx.strokeStyle = har ? P.kritt : P.halv;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = har ? P.kritt : P.halv;
        ctx.fillRect(cx - 2, y + 7, 4, 2.5);
    }
}

/**
 * Budsjettet til neste valg: et valgflagg, året og en liggende bar. Full bar = alt bøndene
 * tillater denne perioden. Den tømmes når du fyrer, og fylles igjen ved hvert valg.
 * Bondetinget 1833: stripa gløder i gull de første årene.
 */
function budsjett(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, tid: number, x: number, y: number) {
    const grense = grenseNå(g);
    const igjen = Math.max(0, 1 - g.periode / grense);
    const fare = igjen < 0.25;
    const inn = Math.min(1, (g.år - (T.penger.førsteEkteValg - 1.2)) / 0.4);
    const bonde = g.år >= T.penger.førsteEkteValg ? Math.max(0, 1 - (g.år - T.penger.førsteEkteValg) / 5.5) : 0;
    const neste = g.ter.valg[g.nesteValg];
    const bw = 136;
    const bh = 18;

    ctx.save();
    ctx.globalAlpha = inn;
    const rist = fare ? Math.sin(tid * 30) * 1.2 : 0;
    ctx.translate(rist, 0);
    // Valgflagget (samme som flaggene i landskapet) og året.
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 8);
    ctx.lineTo(x + 2, y + 26);
    ctx.stroke();
    // Gjenvalgt: flagget rykker opp og vaier (fx.flagg), i stedet for en lapp.
    const rykk = fx.flagg;
    const løft = -7 * Math.sin(rykk * Math.PI);
    const vai = Math.sin(tid * 22) * 4 * rykk;
    const fl = 1 + 0.5 * rykk;
    ctx.fillStyle = rykk > 0.2 ? P.silke : P.karmin;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 8 + løft);
    ctx.lineTo(x + 3 + 12 * fl, y + 12 + løft + vai);
    ctx.lineTo(x + 3, y + 16 + løft + 2 * rykk);
    ctx.fill();
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = fare ? P.karmin : P.kritt;
    ctx.fillText(g.bæres ? 'Staten betaler' : neste ? `Valg ${neste.år}` : 'Budsjett', x + 20, y + 22);
    // Baren: varm bondefarge, karmin og blinkende når det nesten er tomt.
    const by = y + 32;
    ctx.fillStyle = PAPIR;
    ctx.fillRect(x, by, bw, bh);
    ctx.fillStyle = fare ? P.karmin : g.bæres ? P.silkeLys : P.silke;
    if (fare) ctx.globalAlpha = inn * (0.6 + 0.4 * Math.sin(tid * 12));
    ctx.fillRect(x, by, bw * igjen, bh);
    ctx.globalAlpha = inn;
    // Gjenvalgt: et lyst glimt som feier over den fulle baren.
    if (fx.flagg > 0) {
        const gx = x + bw * (1 - fx.flagg);
        ctx.fillStyle = 'rgba(255,240,200,0.7)';
        ctx.fillRect(Math.max(x, gx - 10), by, Math.min(20, x + bw - gx + 10), bh);
    }
    // Bevilget: kongens embetsmenn river en karmin bit av baren, og den faller ut av kortet.
    if (fx.tapp > 0) {
        const u = 1 - fx.tapp;
        ctx.save();
        ctx.globalAlpha = inn * Math.min(1, fx.tapp * 1.6);
        ctx.translate(x + bw * igjen + (bw * fx.tappAndel) / 2, by + bh / 2 + u * u * 60);
        ctx.rotate(u * 0.6);
        ctx.fillStyle = P.karmin;
        ctx.fillRect((-bw * fx.tappAndel) / 2, -bh / 2, bw * fx.tappAndel, bh);
        ctx.strokeStyle = P.kritt;
        ctx.strokeRect((-bw * fx.tappAndel) / 2, -bh / 2, bw * fx.tappAndel, bh);
        ctx.restore();
    }
    ctx.strokeStyle = 'rgba(46,50,54,0.35)';
    ctx.lineWidth = 1;
    for (let k = 5; k < grense; k += 5) {
        const lx = x + bw * (1 - k / grense);
        ctx.beginPath();
        ctx.moveTo(lx, by);
        ctx.lineTo(lx, by + bh);
        ctx.stroke();
    }
    ctx.strokeStyle = fare ? P.karmin : P.kritt;
    ctx.lineWidth = fare ? 2.5 : 1.3;
    ctx.strokeRect(x, by, bw, bh);
    // Bondetinget: baren gløder i gull de første årene etter 1833.
    if (bonde > 0) {
        ctx.strokeStyle = P.silke;
        ctx.globalAlpha = inn * bonde;
        ctx.lineWidth = 2 + 3 * Math.sin(tid * 10) ** 2;
        ctx.strokeRect(x - 3, by - 3, bw + 6, bh + 6);
        ctx.globalAlpha = inn;
    }
    if (fx.stabelBlink > 0) {
        ctx.strokeStyle = P.karmin;
        ctx.globalAlpha = fx.stabelBlink;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 3, by - 3, bw + 6, bh + 6);
    }
    ctx.restore();
}

function tast(ctx: CanvasRenderingContext2D, x: number, y: number, t: string): number {
    ctx.save();
    ctx.font = `bold 13px Georgia, serif`;
    const w = Math.max(ctx.measureText(t).width, t.length * 9.5) + 12;
    ctx.fillStyle = P.hvit;
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.2;
    ctx.fillRect(x, y, w, 21);
    ctx.strokeRect(x, y, w, 21);
    ctx.fillRect(x, y + 19, w, 3);
    ctx.fillStyle = P.kritt;
    ctx.textAlign = 'left';
    ctx.fillText(t, x + 6, y + 15);
    ctx.restore();
    return w;
}

/** Målet: tidslinja 1815-1884 øverst i midten, med valgene som små streker. */
function tidslinje(ctx: CanvasRenderingContext2D, g: Game) {
    const a = 340;
    const b = 620;
    const y = 30;
    const u = (år: number) => a + ((b - a) * (år - T.år.start)) / (T.år.slutt - T.år.start);
    kort(ctx, a - 52, 14, b - a + 182, 30);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(a, y);
    ctx.lineTo(b, y);
    ctx.stroke();
    for (const v of g.ter.valg) {
        ctx.strokeStyle = v.ekte ? P.karmin : P.halv;
        ctx.beginPath();
        ctx.moveTo(u(v.år), y - 4);
        ctx.lineTo(u(v.år), y + 4);
        ctx.stroke();
    }
    ctx.fillStyle = P.silke;
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1;
    const x = u(Math.min(g.år, T.år.slutt));
    ctx.beginPath();
    ctx.ellipse(x, y - 4, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(x - 2, y + 2, 4, 3);
    ctx.fillStyle = P.kritt;
    ctx.font = `italic 15px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('1815', a - 8, y + 5);
    ctx.textAlign = 'left';
    ctx.fillText('1884 Løvebakken', b + 8, y + 5);
}

/** Ueland i et lite ovalt portrett (som i stortingskalenderne), med gangeren ved siden av. */
function portrett(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, tid: number, cx: number, cy: number) {
    const s = 0.62 * (1 + fx.gangerSprett * 0.25);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.fillStyle = PAPIR;
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Framgang mot neste trinn: en bue rundt ovalen.
    if (g.ganger < T.ganger.maks && iBåndet(g)) {
        ctx.strokeStyle = P.silke;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 46, 0, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * g.gangerTid) / T.ganger.trinn);
        ctx.stroke();
    }
    // Ueland: rundt ansikt, kragebart, lue.
    const jubel = g.ganger > 1 ? Math.sin(tid * 8) * g.ganger * 0.6 : 0;
    ctx.translate(0, jubel * 0.4);
    ctx.fillStyle = '#e8d6bf';
    ctx.beginPath();
    ctx.ellipse(0, -2, 14, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = P.halv;
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.quadraticCurveTo(-13, 20, 0, 22);
    ctx.quadraticCurveTo(13, 20, 14, -2);
    ctx.quadraticCurveTo(8, 10, 0, 10);
    ctx.quadraticCurveTo(-8, 10, -14, -2);
    ctx.fill();
    ctx.fillStyle = P.kritt;
    ctx.fillRect(-15, -22, 30, 6);
    ctx.beginPath();
    ctx.arc(-5, -4, 1.6, 0, Math.PI * 2);
    ctx.arc(5, -4, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    if (g.ganger > 1) ctx.arc(0, 4, 4, 0, Math.PI);
    else ctx.rect(-4, 4, 8, 1.4);
    ctx.fill();
    ctx.restore();
    // Gangeren ved siden av portrettet: stor, i gull når den virker.
    ctx.fillStyle = g.ganger > 1 ? P.silke : P.halv;
    ctx.textAlign = 'center';
    ctx.font = `italic bold ${28 + fx.gangerSprett * 10}px ${FONT}`;
    ctx.fillText(`×${g.ganger}`, cx + 50, cy + 10);
}
