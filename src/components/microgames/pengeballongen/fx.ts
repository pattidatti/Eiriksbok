// Juice: partikler (mynter, gnister, røyk, flosshatter), mynter som fyker til telleren,
// skjermrystelse og blink. Alt i flatekoordinater (960 x 540). Rystelsen svinner i ekte tid.

import { P } from './art';

export type Slag = 'mynt' | 'gnist' | 'røyk' | 'hatt' | 'glo' | 'papir' | 'lue';

interface Partikkel {
    slag: Slag;
    x: number;
    y: number;
    vx: number;
    vy: number;
    liv: number;
    maks: number;
    rot: number;
    vr: number;
    str: number;
    /** Følger fjellet (glir bakover når ballongen flytter seg). */
    verden: boolean;
    /** Flyr i en bue til et mål (telleren i HUD-en). */
    fra?: { x: number; y: number };
    mål?: { x: number; y: number };
}

/** En solid papirlapp med mørk tekst som spretter inn, stiger litt og blekner. */
interface Lapp {
    tekst: string;
    farge: string;
    stor: boolean;
    liv: number;
    maks: number;
    /** Kort tilbakemelding (Ueland ×n, Hårfint): byttes ut eller droppes, står aldri i kø. */
    lav: boolean;
}

/** Det faste lappefeltet: under tidslinja, mellom Ueland-kortet og Spart - aldri ved ballongen. */
export const LAPPEFELT = { x: 560, y: 64, maksBredde: 400 };

export interface Fx {
    p: Partikkel[];
    lapper: Lapp[];
    rist: number;
    blink: number;
    blinkFarge: string;
    /** Telleren «Spart» spretter når mynter lander (0-1). */
    sprett: number;
    /** Ueland-ovalen spretter når gangeren øker (0-1). */
    gangerSprett: number;
    /** Valgstabelen blinker når den nærmer seg streken. */
    stabelBlink: number;
    /** Tid siden start (ekte sekunder) - til animasjon. */
    klokke: number;
    /** Hit-stop: spillet fryser så mange ekte sekunder ved et treff (funn, stemme, port). */
    stopp: number;
    /** Ueland vises i HUD-en fra første gang gangeren går over ×1, og blir stående runden ut. */
    uelandSett: boolean;
    /** Gjenvalgt: valgflagget i stripa rykker og vaier (0-1). */
    flagg: number;
    /** Bevilget: en karmin bit av budsjettbaren rives av og faller (0-1), så stor del av grensen. */
    tapp: number;
    tappAndel: number;
}

export const nyFx = (): Fx => ({
    p: [],
    lapper: [],
    rist: 0,
    blink: 0,
    blinkFarge: P.hvit,
    sprett: 0,
    gangerSprett: 0,
    stabelBlink: 0,
    klokke: 0,
    stopp: 0,
    uelandSett: false,
    flagg: 0,
    tapp: 0,
    tappAndel: 0,
});

const MAKS = 260;

/** Ny runde: tøm partiklene og rystelsen. */
export function nullstillFx(fx: Fx) {
    fx.p.length = 0;
    fx.uelandSett = false;
    fx.lapper.length = 0;
    fx.rist = 0;
    fx.blink = 0;
    fx.stopp = 0;
}

/** Et kort frys ved treff (hit-stop): treffet kjennes i stedet for å gli forbi. */
export function stopp(fx: Fx, sek: number) {
    fx.stopp = Math.max(fx.stopp, sek);
}

export function slipp(
    fx: Fx,
    slag: Slag,
    x: number,
    y: number,
    o: Partial<Pick<Partikkel, 'vx' | 'vy' | 'maks' | 'str' | 'verden' | 'vr'>> & {
        mål?: { x: number; y: number };
    } = {}
) {
    if (fx.p.length >= MAKS) fx.p.shift();
    const maks = o.maks ?? 0.8;
    fx.p.push({
        slag,
        x,
        y,
        vx: o.vx ?? 0,
        vy: o.vy ?? 0,
        liv: maks,
        maks,
        rot: Math.random() * 6.28,
        vr: o.vr ?? (Math.random() - 0.5) * 8,
        str: o.str ?? 1,
        verden: o.verden ?? false,
        fra: o.mål ? { x, y } : undefined,
        mål: o.mål,
    });
}

/**
 * En lapp i det faste feltet øverst: mørk tekst på lys papirbunn med en fargestripe til venstre.
 * Bare én lapp vises om gangen. Viktige lapper venter i kø (maks to), korte tilbakemeldinger
 * byttes ut eller droppes. x og y er med for gamle kall, men lappen står alltid i feltet.
 */
export function lapp(fx: Fx, tekst: string, _x: number, _y: number, farge: string = P.kritt, stor = false, sek = 1.4) {
    void _x;
    void _y;
    const ny: Lapp = { tekst, farge, stor, liv: sek, maks: sek, lav: sek <= 1.1 };
    const aktiv = fx.lapper[0];
    if (!aktiv || aktiv.lav) {
        // Feltet er ledig, eller det står bare en kort tilbakemelding der.
        if (aktiv) fx.lapper[0] = ny;
        else fx.lapper.push(ny);
        return;
    }
    if (ny.lav) return;
    if (fx.lapper.some((l) => l.tekst === tekst)) return;
    fx.lapper.push(ny);
    if (fx.lapper.length > 3) fx.lapper.splice(1, 1);
}

export function rist(fx: Fx, styrke: number) {
    fx.rist = Math.max(fx.rist, styrke);
}

export function blink(fx: Fx, styrke: number, farge: string = P.hvit) {
    fx.blink = Math.max(fx.blink, styrke);
    fx.blinkFarge = farge;
}

/**
 * Ett steg. `spill` er spilltid (sakte film under lærings-øyeblikk), `ekte` er ekte tid
 * (rystelse og sprett). `scroll` er hvor langt verden flyttet seg (px) dette steget.
 * Returnerer hvor mange mynter som landet i telleren.
 */
export function oppdaterFx(fx: Fx, spill: number, ekte: number, scroll: number): number {
    fx.klokke += ekte;
    fx.rist = Math.max(0, fx.rist - ekte * 22);
    fx.blink = Math.max(0, fx.blink - ekte * 2.5);
    fx.sprett = Math.max(0, fx.sprett - ekte * 4);
    fx.gangerSprett = Math.max(0, fx.gangerSprett - ekte * 2.5);
    fx.stabelBlink = Math.max(0, fx.stabelBlink - ekte * 3);
    fx.flagg = Math.max(0, fx.flagg - ekte * 1.4);
    fx.tapp = Math.max(0, fx.tapp - ekte * 1.1);
    // Bare den første lappen går; står noen i kø, får den aktive maks 3 s før den viker.
    const l = fx.lapper[0];
    if (l) {
        l.liv -= ekte;
        if (fx.lapper.length > 1 && l.maks - l.liv > 3) l.liv = Math.min(l.liv, 0.3);
        if (l.liv <= 0) fx.lapper.shift();
    }
    let landet = 0;
    const dt = spill;
    for (let i = fx.p.length - 1; i >= 0; i--) {
        const q = fx.p[i];
        q.liv -= q.mål ? ekte : dt;
        if (q.mål && q.fra) {
            const u = 1 - Math.max(0, q.liv) / q.maks;
            const e = u * u * (3 - 2 * u);
            const cx = (q.fra.x + q.mål.x) / 2;
            const cy = Math.min(q.fra.y, q.mål.y) - 90;
            q.x = (1 - e) * (1 - e) * q.fra.x + 2 * (1 - e) * e * cx + e * e * q.mål.x;
            q.y = (1 - e) * (1 - e) * q.fra.y + 2 * (1 - e) * e * cy + e * e * q.mål.y;
            q.rot += q.vr * ekte;
            if (q.liv <= 0) {
                landet++;
                fx.p.splice(i, 1);
            }
            continue;
        }
        if (q.liv <= 0) {
            fx.p.splice(i, 1);
            continue;
        }
        const tyngde =
            q.slag === 'røyk' ? -18 : q.slag === 'glo' ? -60 : q.slag === 'papir' ? 120 : 520;
        q.vy += tyngde * dt;
        if (q.slag === 'røyk' || q.slag === 'papir') {
            q.vx *= 1 - 1.5 * dt;
            q.vy *= 1 - 1.5 * dt;
        }
        q.x += q.vx * dt - (q.verden ? scroll : 0);
        q.y += q.vy * dt;
        q.rot += q.vr * dt;
    }
    return landet;
}

export function tegnFx(ctx: CanvasRenderingContext2D, fx: Fx, lag: 'bak' | 'foran') {
    for (const q of fx.p) {
        const bak = q.slag === 'røyk';
        if ((lag === 'bak') !== bak) continue;
        const u = Math.max(0, q.liv / q.maks);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        switch (q.slag) {
            case 'mynt': {
                const sx = Math.abs(Math.cos(q.rot * 2)) * 0.8 + 0.2;
                ctx.globalAlpha = q.mål ? 1 : Math.min(1, u * 3);
                ctx.scale(sx, 1);
                ctx.fillStyle = P.hvit;
                ctx.strokeStyle = P.kritt;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.arc(0, 0, 5 * q.str, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, 2.6 * q.str, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            case 'gnist': {
                ctx.globalAlpha = u;
                ctx.strokeStyle = P.hvit;
                ctx.lineWidth = 2 * q.str;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-q.vx * 0.03, -q.vy * 0.03);
                ctx.stroke();
                break;
            }
            case 'glo': {
                ctx.globalAlpha = u;
                ctx.fillStyle = u > 0.5 ? P.silkeLys : P.silke;
                ctx.fillRect(-1.5 * q.str, -1.5 * q.str, 3 * q.str, 3 * q.str);
                break;
            }
            case 'røyk': {
                ctx.globalAlpha = u * 0.5;
                ctx.fillStyle = P.halv;
                ctx.beginPath();
                ctx.arc(0, 0, (8 + (1 - u) * 22) * q.str, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'hatt': {
                ctx.globalAlpha = Math.min(1, u * 2);
                ctx.fillStyle = P.kritt;
                ctx.fillRect(-7, -2, 14, 3);
                ctx.fillRect(-4.5, -13, 9, 12);
                ctx.fillStyle = P.karmin;
                ctx.fillRect(-4.5, -5, 9, 2);
                break;
            }
            case 'lue': {
                ctx.globalAlpha = Math.min(1, u * 2);
                ctx.fillStyle = P.karmin;
                ctx.beginPath();
                ctx.moveTo(-6, 2);
                ctx.quadraticCurveTo(0, -12, 7, -6);
                ctx.lineTo(6, 2);
                ctx.fill();
                break;
            }
            case 'papir': {
                ctx.globalAlpha = Math.min(1, u * 2);
                ctx.fillStyle = P.hvit;
                ctx.strokeStyle = P.kritt;
                ctx.lineWidth = 1;
                ctx.fillRect(-5, -6, 10, 12);
                ctx.strokeRect(-5, -6, 10, 12);
                break;
            }
        }
        ctx.restore();
    }
}

/** Lappene: tegnes øverst, over HUD-en, så de alltid er skarpe og leselige. */
export function tegnLapper(ctx: CanvasRenderingContext2D, fx: Fx, font: string) {
    const l = fx.lapper[0];
    if (l) {
        const alder = l.maks - l.liv;
        const inn = Math.min(1, alder / 0.16);
        const sk = inn < 1 ? 0.7 + 0.36 * inn : 1 + 0.06 * Math.max(0, 1 - (alder - 0.16) / 0.12);
        const a = Math.min(1, l.liv / 0.3);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(LAPPEFELT.x, LAPPEFELT.y);
        ctx.scale(sk, sk);
        // Lang tekst får mindre skrift (aldri under 14 px), så lappen holder seg i feltet.
        let px = l.stor ? 20 : 15;
        ctx.font = `bold ${px}px ${font}`;
        while (px > 14 && ctx.measureText(l.tekst).width + 22 > LAPPEFELT.maksBredde) {
            px--;
            ctx.font = `bold ${px}px ${font}`;
        }
        const w = ctx.measureText(l.tekst).width + 22;
        const h = l.stor ? 30 : 24;
        ctx.fillStyle = 'rgba(31,35,38,0.35)';
        ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
        ctx.fillStyle = P.hvit;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = l.farge;
        ctx.fillRect(-w / 2, -h / 2, 5, h);
        ctx.fillStyle = P.kritt;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.tekst, 3, 1);
        ctx.restore();
    }
    ctx.textBaseline = 'alphabetic';
}
