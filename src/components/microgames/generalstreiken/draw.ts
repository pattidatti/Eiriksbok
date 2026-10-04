// Tegningen: plakaten på muren, kartet, fabrikkene, kjeden av streikende, den blå bølgen
// og HUD-en som plakatens egne slagord. Leser spillet og fx, endrer ingenting i reglene.
// Rødt og blått tegnes på et eget blekklag som får flekkemasken og forskyves 1-2 px fra
// det svarte (feilregistrering), slik silketrykket fra Atelier Populaire ser ut.

import type { ArcadeView } from '../arcade/useArcade';
import {
    BODY,
    deGaulleForm,
    fabrikkForm,
    folkForm,
    FONT,
    FOT_H,
    HUD_H,
    layout,
    neveForm,
    P,
    SKJEV,
    tegnBakgrunn,
    tegnFlekker,
    type Layout,
} from './art';
import type { Fx } from './fx';
import { røyk } from './fx';
import { byksVarsel, dag, erX2, fristIgjen, gangetall, nærhet, tiendeler, verdiFor } from './rules';
import type { Game } from './state';
import { TUNING } from './tuning';

export { P } from './art';

export const fmt = (m: number) => tiendeler(m).toFixed(1).replace('.', ',');

export interface Ekstra {
    /** Rekorden på brett 3 (millioner), 0 = ingen. */
    rekord: number;
    /** Rekordkjeden på brett 3 i stoppøyeblikket (spøkelset). */
    spøkelse: [number, number][];
    /** Menyen: kartet lever bak, uten HUD. */
    meny: boolean;
}

const cache: {
    bg?: HTMLCanvasElement;
    bgKey?: string;
    flekk?: HTMLCanvasElement;
    flekkKey?: string;
    ink?: HTMLCanvasElement;
    inkCtx?: CanvasRenderingContext2D;
} = {};

function lag(w: number, h: number, dpr: number, g: Game, L: Layout) {
    const k = `${w}x${h}@${dpr}#${g.brett.nr}`;
    if (cache.bgKey !== k) {
        cache.bg = tegnBakgrunn(w, h, dpr, g.brett, L);
        cache.bgKey = k;
    }
    const fk = `${w}x${h}@${dpr}`;
    if (cache.flekkKey !== fk) {
        cache.flekk = tegnFlekker(w, h, dpr);
        cache.flekkKey = fk;
        const c = document.createElement('canvas');
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        cache.ink = c;
        cache.inkCtx = c.getContext('2d')!;
    }
}

/** Plakatens skjevhet (og ristingen) på en kontekst. */
function plakatTransform(
    ctx: CanvasRenderingContext2D,
    dpr: number,
    L: Layout,
    rx: number,
    ry: number
) {
    ctx.setTransform(dpr, 0, 0, dpr, rx * dpr, ry * dpr);
    ctx.translate(L.cx, L.cy);
    ctx.rotate(SKJEV);
    ctx.translate(-L.cx, -L.cy);
}

export function tegn(view: ArcadeView, g: Game, fx: Fx, ex: Ekstra) {
    const { ctx, w, h, dpr } = view;
    // Selvspill med høy fart tegner mellomstegene på et 1x1-lerret: hopp over kunsten der.
    if (ctx.canvas.width < 8) return;
    const L = layout(w, h, g.brett);
    lag(w, h, dpr, g, L);
    const s = L.s;
    const rx = (Math.random() - 0.5) * fx.rist;
    const ry = (Math.random() - 0.5) * fx.rist;
    const c = (x: number) => L.ox + (x + 0.5) * s;
    const r = (y: number) => L.oy + (y + 0.5) * s;

    ctx.setTransform(dpr, 0, 0, dpr, rx * dpr, ry * dpr);
    ctx.drawImage(cache.bg!, 0, 0, w, h);

    // ---------- Det svarte laget ----------
    plakatTransform(ctx, dpr, L, rx, ry);
    const etter = g.grenelle !== null;
    // Spøkelset: rekordkjeden i blyant (bare brett 3).
    if (g.brett.nr === 3 && ex.spøkelse.length > 1 && !ex.meny) {
        ctx.strokeStyle = P.grå;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 6]);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ex.spøkelse.forEach(([x, y], i) => (i ? ctx.lineTo(c(x), r(y)) : ctx.moveTo(c(x), r(y))));
        ctx.stroke();
        ctx.setLineDash([]);
        const [hx, hy] = ex.spøkelse[0];
        ctx.beginPath();
        ctx.arc(c(hx), r(hy), s * 0.42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    // Feltene der streiken har gått: flat silketrykk-rød med harde kanter, blå der marsjen
    // tok kjeden. Tegnes én gang som én flate per farge (ikke lag oppå hverandre).
    {
        const B = g.brett.b;
        for (const [verdi, farge] of [
            [1, P.felt],
            [2, P.feltBlå],
        ] as const) {
            ctx.fillStyle = farge;
            ctx.beginPath();
            for (let i = 0; i < g.spor.length; i++) {
                if (g.spor[i] !== verdi) continue;
                const x = i % B;
                const y = (i - x) / B;
                ctx.rect(L.ox + x * s - 0.5, L.oy + y * s - 0.5, s + 1, s + 1);
            }
            ctx.fill();
        }
    }
    // Fabrikkene som venter.
    for (const f of g.fabrikker) {
        const alder = g.bt - f.født;
        const inn = Math.min(1, alder / 0.25);
        const sk = inn < 1 ? 0.4 + inn * 0.8 - (inn > 0.7 ? (inn - 0.7) * 0.6 : 0) : 1;
        const x = c(f.x);
        const y = r(f.y);
        // Fabrikkene som venter, blinker: en tynn rød flate slår av og på bak dem.
        if (Math.sin(fx.tid * 5 + f.x * 1.7 + f.y) > -0.2) {
            ctx.fillStyle = P.tynn;
            ctx.beginPath();
            ctx.arc(x, y, s * 0.98 * sk, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sk, sk);
        ctx.fillStyle = P.svart;
        fabrikkForm(ctx, s);
        ctx.fill('evenodd');
        ctx.restore();
        if (Math.random() < (fx.tier === 'lav' ? 0.04 : 0.08))
            røyk(fx, x + s * 0.48 - L.ox, y - s * 0.62 - L.oy);
        // Verdien under, med x2 og nedtelling.
        const x2 = erX2(g, f);
        const v = verdiFor(g, f);
        ctx.font = `800 ${Math.max(13, Math.round(s * 0.5))}px ${BODY}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = x2 ? P.rød : P.svart;
        ctx.strokeStyle = P.papir;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(`+${fmt(v)}`, x, y + s * 0.95 + 6);
        ctx.fillText(`+${fmt(v)}`, x, y + s * 0.95 + 6);
        // Brett 1: klokka rundt fabrikken. Går den ut, går arbeiderne tilbake på jobb.
        if (f.jobbTil < Infinity) {
            const igjen = Math.max(0, f.jobbTil - g.bt) / g.brett.tilbake;
            const haster = igjen < 0.3;
            ctx.strokeStyle = haster ? P.rød : P.svart;
            ctx.lineWidth = haster ? 4 : 3;
            ctx.beginPath();
            ctx.arc(
                x + (haster ? Math.sin(fx.tid * 40) * 1.5 : 0),
                y,
                s * 0.85,
                -Math.PI / 2,
                -Math.PI / 2 + Math.PI * 2 * igjen
            );
            ctx.stroke();
        }
        if (x2) {
            const igjen = Math.ceil(f.x2Til - g.bt);
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                x,
                y,
                s * 0.85,
                -Math.PI / 2,
                -Math.PI / 2 + (Math.PI * 2 * (f.x2Til - g.bt)) / TUNING.x2.varer
            );
            ctx.stroke();
            ctx.font = `900 ${Math.max(14, Math.round(s * 0.55))}px ${FONT}`;
            ctx.fillText(`x2 ${igjen}`, x, y - s * 0.95);
        } else if (f.navn) {
            // Navnet i små håndmalte bokstaver - bare når hodet ikke er rett ved.
            // Navnet vises heller ikke når en annen fabrikk står så tett at tekstene ville overlappe.
            const nær = Math.abs(g.hode.x - f.x) + Math.abs(g.hode.y - f.y) < 3;
            const trengt = g.fabrikker.some(
                (o) => o !== f && Math.abs(o.x - f.x) < 5 && Math.abs(o.y - f.y) < 3
            );
            if (!nær && !trengt) {
                ctx.font = `700 13px ${BODY}`;
                ctx.fillStyle = P.svart;
                ctx.fillText(f.navn.toUpperCase(), x, y - s * 0.78);
            }
        }
    }
    // Fabrikker som gikk tilbake på jobb: krymper, blir grå og forsvinner.
    for (const tb of fx.tilbake) {
        const t = Math.min(1, (fx.tid - tb.t) / 0.8);
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.translate(c(tb.x), r(tb.y) - t * s * 0.6);
        ctx.scale(1 - t * 0.6, 1 - t * 0.6);
        ctx.fillStyle = P.grå;
        fabrikkForm(ctx, s);
        ctx.fill('evenodd');
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Den stengte broen: en rød og hvit bom på tvers.
    if (g.broStengt && g.brett.elv) {
        const inn = fx.broT === null ? 1 : Math.min(1, (fx.tid - fx.broT) / 0.3);
        for (const q of g.brett.elv.bro) {
            const x = c(q.x);
            const y = r(q.y);
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(inn * (1.3 - 0.3 * inn), 1);
            ctx.fillStyle = P.papir;
            ctx.fillRect(-s * 0.75, -s * 0.22, s * 1.5, s * 0.44);
            ctx.fillStyle = P.rød;
            for (let k = 0; k < 3; k++)
                ctx.fillRect(-s * 0.75 + k * s * 0.5, -s * 0.22, s * 0.25, s * 0.44);
            ctx.strokeStyle = P.svart;
            ctx.lineWidth = 2;
            ctx.strokeRect(-s * 0.75, -s * 0.22, s * 1.5, s * 0.44);
            ctx.restore();
        }
        const ø = g.brett.elv.bro[0];
        ctx.font = `900 ${Math.max(14, Math.round(s * 0.55))}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = P.rød;
        ctx.fillText('STENGT', c(ø.x), r(ø.y) - s * 0.8);
    }
    // Ringer som vokser ut fra nye fabrikker (står stille på stedet).
    for (const rg of fx.ringer) {
        const t = (fx.tid - rg.t) / 0.9;
        ctx.strokeStyle = rg.farge;
        ctx.globalAlpha = 1 - t;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(c(rg.x), r(rg.y), s * (0.5 + t * 1.1), 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Røyk.
    for (const p of fx.part) {
        if (p.f !== 'røyk') continue;
        ctx.globalAlpha = 0.35 * (p.liv / p.maks);
        ctx.fillStyle = P.grå;
        ctx.beginPath();
        ctx.arc(L.ox + p.x, L.oy + p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ---------- Blekklaget (rødt og blått) ----------
    const ink = cache.inkCtx!;
    ink.setTransform(1, 0, 0, 1, 0, 0);
    ink.clearRect(0, 0, ink.canvas.width, ink.canvas.height);
    plakatTransform(ink, dpr, L, rx, ry);
    ink.save();
    ink.beginPath();
    ink.rect(L.ox - 2, L.oy - 2, s * g.brett.b + 4, s * g.brett.h + 4);
    ink.clip();
    // De Gaulles profil trykkes stort og svakt i hjørnet etter Grenelle.
    if (etter) {
        if (fx.grenelleT !== null) {
            const t = Math.min(1, (fx.tid - fx.grenelleT) / 0.4);
            ink.save();
            ink.globalAlpha = 0.32 * t + (1 - t) * 0.7;
            ink.translate(L.ox + s * g.brett.b - s * 2.6, L.oy + s * g.brett.h - s * 3.2);
            ink.scale(0.6 + 0.4 * t, 0.6 + 0.4 * t);
            ink.fillStyle = P.blå;
            deGaulleForm(ink, s * 2.6);
            ink.fill();
            ink.restore();
        }
    }
    // Merkene etter fabrikkene som ble med: et rødt streikeflagg (ikke en fabrikk), så de
    // ikke kan forveksles med de svarte fabrikkene du kan hekte på.
    ink.fillStyle = P.rød;
    for (const o of fx.okkupert) {
        const t = Math.min(1, (fx.tid - o.t) / 0.2);
        const vai = Math.sin(fx.tid * 4 + o.x * 2.1) * 0.12;
        ink.save();
        ink.translate(c(o.x), r(o.y));
        ink.scale(1.5 - 0.5 * t, 1.5 - 0.5 * t);
        ink.fillRect(-s * 0.26, -s * 0.42, s * 0.07, s * 0.8);
        ink.beginPath();
        ink.moveTo(-s * 0.19, -s * 0.42);
        ink.quadraticCurveTo(s * 0.05, -s * (0.5 + vai), s * 0.34, -s * 0.36);
        ink.lineTo(s * 0.34, -s * 0.06);
        ink.quadraticCurveTo(s * 0.05, -s * (0.16 - vai), -s * 0.19, -s * 0.1);
        ink.closePath();
        ink.strokeStyle = P.papir;
        ink.lineWidth = 3;
        ink.stroke();
        ink.fill();
        ink.restore();
    }
    ink.globalAlpha = 1;
    // Ledd som falt av: tynn rød, blekner.
    ink.fillStyle = P.tynn;
    for (const f of fx.falt) {
        ink.globalAlpha = Math.min(1, f.liv);
        ink.beginPath();
        ink.arc(c(f.x), r(f.y), s * 0.36, 0, Math.PI * 2);
        ink.fill();
    }
    ink.globalAlpha = 1;
    // Kjeden: et tykt rødt bånd med ru kant.
    const pts = [g.hode, ...g.body];
    const varsel = byksVarsel(g);
    if (pts.length > 1) {
        ink.lineJoin = 'round';
        ink.lineCap = 'round';
        // Papirkant rundt kjeden, så den skiller seg fra feltet bak.
        ink.strokeStyle = P.papir;
        ink.lineWidth = s * 0.8 + 6;
        ink.beginPath();
        pts.forEach((p, i) => (i ? ink.lineTo(c(p.x), r(p.y)) : ink.moveTo(c(p.x), r(p.y))));
        ink.stroke();
        ink.strokeStyle = P.rød;
        ink.lineWidth = s * 0.8;
        ink.beginPath();
        pts.forEach((p, i) => (i ? ink.lineTo(c(p.x), r(p.y)) : ink.moveTo(c(p.x), r(p.y))));
        ink.stroke();
        ink.lineWidth = s * 0.66;
        ink.beginPath();
        pts.forEach((p, i) => {
            const j = ((i * 7919) % 5) / 5 - 0.5;
            const px = c(p.x) + j * 3;
            const py = r(p.y) - j * 3;
            if (i) ink.lineTo(px, py);
            else ink.moveTo(px, py);
        });
        ink.stroke();
        // De Gaulles marsj: en hard blå front som går langs kjeden mot hodet.
        if (etter && g.body.length) {
            const hale = g.body[g.body.length - 1];
            const nest = g.body[g.body.length - 2] ?? g.hode;
            const blink = varsel ? 0.5 + 0.5 * Math.sin(fx.tid * 28) : 0;
            const del = Math.min(1, g.bølgeRest);
            const lr = Math.hypot(nest.x - hale.x, nest.y - hale.y) || 1;
            const ret = { x: (nest.x - hale.x) / lr, y: (nest.y - hale.y) / lr };
            const tv = { x: -ret.y, y: ret.x };
            // Fronten står et stykke inn i leddet bølgen er i ferd med å ta.
            const fx0 = c(hale.x + (nest.x - hale.x) * del);
            const fy0 = r(hale.y + (nest.y - hale.y) * del);
            const n = nærhet(g);
            // Avstanden på kartet: en stiplet blå linje langs kjeden fra fronten til hodet.
            ink.strokeStyle = P.blå;
            ink.lineWidth = Math.max(2, s * 0.14);
            ink.setLineDash([s * 0.32, s * 0.26]);
            ink.lineDashOffset = -fx.tid * s * 1.6;
            ink.beginPath();
            ink.moveTo(fx0, fy0);
            for (let i = g.body.length - 2; i >= 0; i--) ink.lineTo(c(g.body[i].x), r(g.body[i].y));
            ink.lineTo(c(g.hode.x), r(g.hode.y));
            ink.stroke();
            ink.setLineDash([]);
            // Massen bak fronten: en flat blå blokk, bredere jo nærmere hodet den er.
            const bred = s * (2 + n * 0.4 + blink * 0.3);
            const dyp = s * (2.4 + n * 0.6);
            ink.save();
            ink.translate(fx0, fy0);
            ink.rotate(Math.atan2(ret.y, ret.x));
            ink.fillStyle = P.blå;
            ink.fillRect(-dyp, -bred / 2, dyp, bred);
            // Den harde kanten: en svart strek på tvers av kjeden.
            ink.fillStyle = P.svart;
            ink.fillRect(-s * 0.06, -bred / 2 - s * 0.18, s * 0.16, bred + s * 0.36);
            ink.restore();
            // Flaggene: tre blå faner bak fronten.
            ink.fillStyle = P.blå;
            for (const k of [-1, 0, 1]) {
                const bx = fx0 + tv.x * k * bred * 0.32 - ret.x * dyp * 0.7;
                const by = fy0 + tv.y * k * bred * 0.32 - ret.y * dyp * 0.7;
                const hy = s * (1.3 + (k === 0 ? 0.35 : 0) + n * 0.2);
                ink.fillRect(bx - s * 0.05, by - hy, s * 0.1, hy);
                ink.beginPath();
                ink.moveTo(bx + s * 0.05, by - hy);
                ink.lineTo(bx + s * (0.7 + Math.sin(fx.tid * 6 + k) * 0.08), by - hy + s * 0.22);
                ink.lineTo(bx + s * 0.05, by - hy + s * 0.46);
                ink.fill();
            }
            // Folkene i fronten skjæres ut av massen og går i takt.
            const gå = Math.sin(fx.tid * 10) * 0.07;
            ink.globalCompositeOperation = 'destination-out';
            for (let rad = 0; rad < 2; rad++)
                for (const k of [-1, 0, 1]) {
                    const steg = (rad + k) % 2 ? gå : -gå;
                    const bak = s * (0.4 + rad * 0.75 + steg);
                    const bx = fx0 + tv.x * k * bred * 0.3 - ret.x * bak;
                    const by = fy0 + tv.y * k * bred * 0.3 - ret.y * bak;
                    ink.beginPath();
                    ink.arc(bx, by - s * 0.2, s * 0.12, 0, Math.PI * 2);
                    ink.rect(bx - s * 0.1, by - s * 0.07, s * 0.2, s * 0.34);
                    ink.fill();
                }
            ink.globalCompositeOperation = 'source-over';
            if (varsel) {
                const t = (fx.tid * 2.2) % 1;
                ink.strokeStyle = P.blå;
                ink.globalAlpha = 1 - t;
                ink.lineWidth = 3;
                ink.beginPath();
                ink.arc(fx0, fy0, s * (0.7 + t * 1.6), 0, Math.PI * 2);
                ink.stroke();
                ink.globalAlpha = 1;
            }
        }
    }
    // Folk som bølgen tok, går rolig hjem.
    ink.fillStyle = P.blå;
    for (const wk of fx.gående) {
        ink.save();
        ink.globalAlpha = Math.min(1, wk.liv);
        ink.translate(c(wk.x), r(wk.y) + Math.sin(fx.tid * 9 + wk.tx) * 1.2);
        ink.beginPath();
        ink.arc(0, -s * 0.2, s * 0.1, 0, Math.PI * 2);
        ink.rect(-s * 0.09, -s * 0.1, s * 0.18, s * 0.28);
        ink.fill();
        ink.restore();
    }
    ink.globalAlpha = 1;
    // Hodet: rund rød form som spretter når en fabrikk hektes på.
    const hs = 1 + fx.hodeSprett * 0.35;
    ink.fillStyle = P.rød;
    ink.beginPath();
    ink.arc(c(g.hode.x), r(g.hode.y), s * 0.55 * hs, 0, Math.PI * 2);
    ink.fill();
    // Blekksprut.
    for (const p of fx.part) {
        if (p.f !== 'rød' && p.f !== 'blå' && p.f !== 'tynn') continue;
        ink.fillStyle = p.f === 'rød' ? P.rød : p.f === 'blå' ? P.blå : P.tynn;
        ink.globalAlpha = Math.min(1, (p.liv / p.maks) * 1.6);
        ink.beginPath();
        ink.arc(L.ox + p.x, L.oy + p.y, p.r, 0, Math.PI * 2);
        ink.fill();
    }
    ink.globalAlpha = 1;
    // Folk skåret ut av det røde: tre streikende i hvert ledd, og neven i hodet.
    ink.globalCompositeOperation = 'destination-out';
    ink.fillStyle = '#000';
    const gang = fx.tid * 6;
    for (let i = 0; i < g.body.length; i++) {
        const p = g.body[i];
        ink.save();
        ink.translate(c(p.x), r(p.y) + (i % 2 ? 1 : -1) * Math.sin(gang + i) * s * 0.03);
        folkForm(ink, s);
        ink.fill();
        ink.restore();
    }
    ink.save();
    ink.translate(c(g.hode.x), r(g.hode.y));
    ink.rotate({ opp: 0, høyre: Math.PI / 2, ned: Math.PI, venstre: -Math.PI / 2 }[g.retning]);
    ink.scale(hs, hs);
    neveForm(ink, s * 1.25);
    ink.fill();
    ink.restore();
    ink.restore(); // klippet
    ink.globalCompositeOperation = 'source-over';
    // HUD-blekket: telleren og skalaen er røde trykk.
    if (!ex.meny) hudBlekk(ink, fx, L);
    // Flekkemasken: papiret skinner gjennom.
    ink.globalCompositeOperation = 'destination-out';
    ink.setTransform(1, 0, 0, 1, 0, 0);
    ink.drawImage(cache.flekk!, 0, 0);
    ink.globalCompositeOperation = 'source-over';
    // Feilregistrering: det røde laget ligger 1,5 px til siden for det svarte.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(ink.canvas, 1.5 * dpr, 1 * dpr);

    // ---------- Øverst: papirbiter, tekst ved hodet, svart HUD ----------
    plakatTransform(ctx, dpr, L, rx, ry);
    for (const p of fx.part) {
        if (p.f !== 'papir') continue;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (p.liv / p.maks) * 1.5);
        ctx.translate(L.ox + p.x, L.oy + p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = P.papir;
        ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Nærhet: en blå ring rundt hodet når bølgen nærmer seg, tykk og rask når den er rett bak.
    if (etter && g.mode === 'play') {
        const n = nærhet(g);
        if (n > 0) {
            const t = (fx.tid * (n === 2 ? 3 : 1.4)) % 1;
            ctx.strokeStyle = P.blå;
            ctx.globalAlpha = (n === 2 ? 0.95 : 0.55) * (1 - t * 0.6);
            ctx.lineWidth = n === 2 ? 4 : 2;
            ctx.beginPath();
            ctx.arc(c(g.hode.x), r(g.hode.y), s * (0.75 + t * 0.5), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    // Gangetallet etter Grenelle står ved hodet (litt over, så det ikke dekker det).
    if (etter && g.mode === 'play') {
        const gt = gangetall(g);
        ctx.font = `900 ${Math.max(15, Math.round(s * 0.62))}px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = P.svart;
        ctx.fillText(
            `x${gt.toFixed(2).replace(/0$/, '').replace('.', ',')}`,
            c(g.hode.x) + s * 0.7,
            r(g.hode.y) - s * 0.6
        );
    }
    if (!ex.meny) hudSvart(ctx, g, L, ex, fx);
    if (fx.sveip) tegnSveip(ctx, fx, L);
}

/** Skalaen 0-12 millioner: x-posisjon for et tall. */
function skala(L: Layout) {
    const x0 = L.px + 232;
    const x1 = L.px + L.pw - 214;
    return {
        x0,
        x1,
        y: L.py + 40,
        til: (m: number) => x0 + ((x1 - x0) * Math.min(12, Math.max(0, m))) / 12,
    };
}

function hudBlekk(ink: CanvasRenderingContext2D, fx: Fx, L: Layout) {
    const sk = skala(L);
    // Telleren: store røde blokkbokstaver, klemt sammen, spretter når den øker.
    const sp = 1 + fx.sprett * 0.22;
    ink.save();
    ink.translate(L.px + 26, L.py + 64);
    ink.scale(0.84 * sp, sp);
    ink.fillStyle = P.rød;
    ink.font = `900 64px ${FONT}`;
    ink.textAlign = 'left';
    ink.fillText(fmt(fx.visTall), 0, 0);
    ink.restore();
    // Skalaen fylles rødt.
    ink.fillStyle = P.rød;
    ink.fillRect(sk.x0, sk.y - 6, sk.til(fx.visTall) - sk.x0, 12);
}

function hudSvart(ctx: CanvasRenderingContext2D, g: Game, L: Layout, ex: Ekstra, fx: Fx) {
    const sk = skala(L);
    ctx.fillStyle = P.svart;
    ctx.font = `800 15px ${BODY}`;
    ctx.textAlign = 'left';
    ctx.fillText('MILLIONER I STREIK', L.px + 28, L.py + 82);
    // Det som er lagret fra brettene før (telleren starter på 0 på hvert brett).
    const lagret = g.resultat.slice(0, g.bi).reduce((a, m) => a + (m ?? 0), 0);
    if (g.bi > 0) {
        ctx.font = `800 13px ${BODY}`;
        ctx.fillStyle = P.grå;
        ctx.fillText(`+ ${fmt(lagret)} LAGRET FRA FØR`, L.px + 28, L.py + 99);
        ctx.fillStyle = P.svart;
        ctx.font = `800 15px ${BODY}`;
    }
    // Skalaen.
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.svart;
    ctx.strokeRect(sk.x0, sk.y - 6, sk.x1 - sk.x0, 12);
    ctx.font = `700 13px ${BODY}`;
    ctx.textAlign = 'center';
    for (let m = 0; m <= 12; m += 2) ctx.fillText(String(m), sk.til(m), sk.y + 22);
    // Målet (eller nivåene på brett 3) som svarte merker med etikett.
    const merker: [number, string][] =
        g.brett.nr === 3
            ? [
                  [TUNING.seier[0], `MÅL ${TUNING.seier[0]}`],
                  [TUNING.seier[1], `${TUNING.seier[1]} ★`],
                  [TUNING.seier[2], `${TUNING.seier[2]} ★★`],
              ]
            : [[g.brett.mål, `MÅL ${fmt(g.brett.mål)}`]];
    ctx.font = `800 13px ${BODY}`;
    for (const [m, t] of merker) {
        const x = sk.til(m);
        ctx.fillRect(x - 1.5, sk.y - 12, 3, 24);
        ctx.fillText(t, x, sk.y - 16);
    }
    // Spøkelsesstreken: rekorden i stiplet svart.
    if (g.brett.nr === 3 && ex.rekord > 0) {
        const x = sk.til(ex.rekord);
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, sk.y - 10);
        ctx.lineTo(x, sk.y + 30);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = P.grå;
        ctx.font = `800 13px ${BODY}`;
        ctx.fillText(`REKORD ${fmt(ex.rekord)}`, x, sk.y + 44);
        ctx.fillStyle = P.svart;
    }
    // Datoseddelen oppe til høyre: en løpeseddel limt skjevt på.
    ctx.save();
    ctx.translate(L.px + L.pw - 104, L.py + 46);
    ctx.rotate(0.035);
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(-82, -36, 164, 70);
    ctx.lineWidth = 2;
    ctx.strokeRect(-82, -36, 164, 70);
    ctx.fillStyle = P.svart;
    ctx.textAlign = 'left';
    if (g.grenelle !== null) {
        ctx.font = `900 30px ${FONT}`;
        ctx.fillStyle = P.blå;
        ctx.textAlign = 'center';
        ctx.font = `800 13px ${BODY}`;
        ctx.textAlign = 'left';
        ctx.fillText('BØLGEN', -70, -14);
        // Grov avstandsmåler: tre felt som fylles blått når marsjen nærmer seg (ikke et tall).
        const n = nærhet(g);
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = P.blå;
            ctx.lineWidth = 2;
            ctx.strokeRect(-70 + i * 48, -6, 42, 14);
            if (i <= n) ctx.fillRect(-70 + i * 48, -6, 42, 14);
        }
        ctx.textAlign = 'center';
        ctx.font = `900 16px ${FONT}`;
        ctx.fillStyle = n === 2 ? P.rød : P.blå;
        ctx.fillText(['LANGT UNNA', 'NÆRMER SEG', 'RETT BAK!'][n], 0, 28);
        ctx.strokeStyle = P.svart;
    } else if (g.brett.kalender) {
        ctx.font = `900 22px ${FONT}`;
        ctx.fillText('MAI', -70, -6);
        ctx.fillText('68', -70, 18);
        ctx.font = `900 46px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = dag(g) >= 27 ? P.rød : P.svart;
        ctx.fillText(String(dag(g)), 30, 12);
        ctx.font = `800 13px ${BODY}`;
        ctx.fillStyle = P.grå;
        ctx.textAlign = 'right';
        ctx.fillText('TIL 30.', 74, 26);
    } else {
        ctx.font = `900 22px ${FONT}`;
        ctx.fillText(g.brett.nr === 1 ? '13. MAI' : '14. MAI', -70, -8);
        // Tiden som er igjen før streiken mister farten.
        const t = fristIgjen(g) / g.brett.frist;
        ctx.strokeRect(-70, 6, 140, 12);
        ctx.fillStyle = t < 0.25 ? P.rød : P.svart;
        ctx.fillRect(-70, 6, 140 * t, 12);
        ctx.fillStyle = P.svart;
        ctx.font = `800 13px ${BODY}`;
        ctx.fillText('TID', -70, 32);
    }
    ctx.restore();
    if (fx.tvT !== null) tvKart(ctx, fx, L);
    // Tastene nederst, der de trengs.
    ctx.fillStyle = P.svart;
    ctx.font = `800 14px ${BODY}`;
    ctx.textAlign = 'left';
    const fy = L.py + L.ph - FOT_H / 2 + 5;
    ctx.fillText('STYR: ← ↑ → ↓ ELLER WASD', L.px + 22, fy);
    void HUD_H;
}

/**
 * Steder på det innfelte verdenskartet (relativt til midten), Paris først. Hvert sted har sin
 * egen plass for navnet og bonusen, så ingen merkelapper overlapper:
 * [navn, x, y, navn x, navn y, justering, bonus x, bonus y].
 */
const TV_STEDER: [string, number, number, number, number, CanvasTextAlign, number, number][] = [
    ['Paris', -14, 12, -14, 30, 'center', -14, 12],
    ['Berkeley', -62, 4, -82, 20, 'left', -62, -8],
    ['Oslo', 4, -22, 12, -18, 'left', -10, -18],
    ['Vest-Berlin', 12, -4, 18, 0, 'left', 2, 4],
    ['Praha', 24, 14, 31, 22, 'left', 24, 46],
];

/** TV-sendingen: et lite innfelt kart der landene tennes ett etter ett, med bonusen. */
function tvKart(ctx: CanvasRenderingContext2D, fx: Fx, L: Layout) {
    const t = fx.tid - fx.tvT!;
    const inn = Math.min(1, t / 0.3);
    ctx.save();
    ctx.translate(L.px + L.pw - 108, L.py + 150);
    ctx.rotate(-0.02);
    ctx.scale(0.6 + 0.4 * inn, 0.6 + 0.4 * inn);
    ctx.globalAlpha = inn;
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(-90, -52, 180, 104);
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.svart;
    ctx.strokeRect(-90, -52, 180, 104);
    ctx.fillStyle = P.svart;
    ctx.font = `900 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('TV-SENDING', 0, -36);
    // Atlanteren som en svak strek mellom USA og Europa.
    ctx.strokeStyle = P.grå;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(-40, -26);
    ctx.lineTo(-40, 44);
    ctx.stroke();
    ctx.setLineDash([]);
    const [, px, py] = TV_STEDER[0];
    TV_STEDER.forEach(([navn, x, y, lx, ly, jus, bx, by], i) => {
        const tent = i === 0 || t > 0.35 + i * 0.45;
        if (i > 0 && tent) {
            const k = Math.min(1, (t - 0.35 - i * 0.45) / 0.3);
            ctx.strokeStyle = P.rød;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + (x - px) * k, py + (y - py) * k);
            ctx.stroke();
        }
        ctx.fillStyle = tent ? P.rød : P.grå;
        ctx.beginPath();
        ctx.arc(x, y, tent ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = P.svart;
        ctx.font = `800 10px ${BODY}`;
        ctx.textAlign = jus;
        ctx.fillText(navn.toUpperCase(), lx, ly);
        if (i > 0 && tent && t < 0.35 + i * 0.45 + 1.6) {
            ctx.fillStyle = P.rød;
            ctx.font = `900 12px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.fillText(`+${fmt(TUNING.tv.verdi)}`, bx, by - 6);
        }
    });
    ctx.restore();
}

/** Rakel-sveipet: et rødt felt drar over plakaten og trykker en ny plakat på 0,4 s. */
function tegnSveip(ctx: CanvasRenderingContext2D, fx: Fx, L: Layout) {
    const sv = fx.sveip!;
    const t = fx.tid - sv.t0;
    const p = Math.min(1, t / 0.4);
    const x0 = L.px + 10;
    const bw = L.pw - 20;
    const y0 = L.py + L.ph * 0.3;
    const bh = L.ph * 0.36;
    const kant = x0 + bw * p;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, kant - x0, bh);
    ctx.clip();
    ctx.fillStyle = sv.farge;
    ctx.fillRect(x0, y0, bw, bh);
    ctx.fillStyle = sv.tekst;
    ctx.textAlign = 'center';
    const mid = L.px + L.pw / 2;
    ctx.save();
    ctx.translate(mid, y0 + bh * 0.5);
    ctx.rotate(-0.02);
    const st = Math.min(84, (bw / Math.max(6, sv.tittel.length)) * 1.6);
    ctx.font = `900 ${Math.round(st)}px ${FONT}`;
    ctx.scale(0.86, 1);
    ctx.fillText(sv.tittel, 0, st * 0.18);
    ctx.restore();
    ctx.font = `800 18px ${BODY}`;
    ctx.fillText(sv.under, mid, y0 + bh * 0.5 + st * 0.18 + 34);
    ctx.restore();
    // Selve rakelen: en svart list som drar over.
    if (p < 1) {
        ctx.fillStyle = P.svart;
        ctx.fillRect(kant - 6, y0 - 14, 12, bh + 28);
    }
}
