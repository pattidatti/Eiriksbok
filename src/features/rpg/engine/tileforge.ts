// Terrengfliser og verdensobjekter, tegnet prosedyralt. Fargene kommer fra
// sonens tema, så en ny sone får sitt eget utseende ved å bytte palett.
//
// To ting her er viktigere enn resten:
//
// 1. **Overgangsfliser.** Uten dem møtes gress, sand og vann i harde
//    16-pikslers trapper over hele kartet. Det er det tydeligste amatørsignalet
//    en topp-ned-verden kan ha, og det dekker hver eneste rute. Hver flis har
//    derfor et sett kanter og hjørner som legges oppå naboen.
// 2. **Ekte varianter.** Én flis med tilfeldig støy bakt inn gjentar nøyaktig
//    samme støymønster i hver rute, og leser som et rutenett. Her lages flere
//    ulike fliser med samlede gresstuster, og de speiles i tillegg.

import type Phaser from 'phaser';
import type { Tema } from '../types';
import { createPainter, makeRng, ramp, type Painter } from './pixels';
import { TILE } from './spriteforge';

export type TileKey = 'gress' | 'sti' | 'sand' | 'vann' | 'stein' | 'tregulv' | 'aker';

/**
 * Hvem som legger kanten sin oppå hvem. Høyere tall vinner, så gress kryper inn
 * på stien og sanden kryper ut i vannet - aldri motsatt.
 */
export const FLIS_PRIORITET: Record<TileKey, number> = {
    vann: 0,
    sti: 1,
    aker: 2,
    tregulv: 2,
    sand: 3,
    gress: 4,
    stein: 5,
};

export const KANT_RETNINGER = ['n', 's', 'v', 'h'] as const;
export const KANT_HJORNER = ['nv', 'nh', 'sv', 'sh'] as const;
export type KantRetning = (typeof KANT_RETNINGER)[number];
export type KantHjorne = (typeof KANT_HJORNER)[number];

/** Hvor mange varianter hver flistype har. Flere = mindre synlig gjentakelse. */
export const FLIS_VARIANTER: Record<TileKey, number> = {
    gress: 8,
    sti: 4,
    sand: 4,
    vann: 1,
    stein: 4,
    tregulv: 2,
    aker: 2,
};

function addCanvas(scene: Phaser.Scene, key: string, painter: { canvas: HTMLCanvasElement }): void {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const texture = scene.textures.createCanvas(key, painter.canvas.width, painter.canvas.height);
    if (!texture) return;
    texture.context.drawImage(painter.canvas, 0, 0);
    texture.refresh();
}

/** Samlede flekker i stedet for salt-og-pepper. Støy leser som TV-snø. */
function flekker(p: Painter, rng: () => number, antall: number, farge: string, storrelse = 2) {
    for (let i = 0; i < antall; i++) {
        const x = Math.floor(rng() * TILE);
        const y = Math.floor(rng() * TILE);
        const n = 1 + Math.floor(rng() * storrelse);
        for (let j = 0; j < n; j++) {
            p.px(x + Math.floor(rng() * 2), y + Math.floor(rng() * 2), farge);
        }
    }
}

/** Fargene en flistype bruker. Alt hentes fra temaet, så nye soner ser nye ut. */
function flisFarge(tema: Tema, flis: TileKey): string {
    switch (flis) {
        case 'gress':
            return tema.gress;
        case 'stein':
            return tema.stein;
        case 'vann':
            return tema.vann;
        case 'sand':
            return tema.sand;
        case 'sti':
            return tema.jord;
        case 'aker':
            return tema.aker;
        case 'tregulv':
            return tema.tommer;
    }
}

// ─── Grunnfliser ────────────────────────────────────────────────────────────

export function forgeTiles(scene: Phaser.Scene, tema: Tema): void {
    const rng = makeRng(20250725);

    const lagVarianter = (flis: TileKey, tegn: (p: Painter, variant: number) => void) => {
        const n = FLIS_VARIANTER[flis];
        const halve = Math.max(1, Math.ceil(n / 2));
        for (let v = 0; v < n; v++) {
            const p = createPainter(TILE, TILE);
            tegn(p, v % halve);
            // Andre halvdel er speilvendte utgaver - gratis variasjon.
            if (v >= halve) p.mirror();
            addCanvas(scene, `flis-${flis}-${v}`, p);
        }
    };

    // Gress: tuster i klynger, ikke tilfeldige piksler.
    lagVarianter('gress', (p, v) => {
        const g = tema.gress;
        p.rect(0, 0, TILE, TILE, g);
        flekker(p, rng, 5, ramp(g, -1), 2);
        flekker(p, rng, 4, ramp(g, 1), 2);
        // Få og dempede tuster. For lyse eller for mange leser som TV-snø.
        const tuster = v;
        for (let i = 0; i < tuster; i++) {
            const x = 2 + Math.floor(rng() * (TILE - 4));
            const y = 3 + Math.floor(rng() * (TILE - 6));
            p.vline(x, y - 2, 3, ramp(g, 1));
            p.px(x - 1, y, ramp(g, 1));
            p.px(x, y + 1, ramp(g, -2));
        }
    });

    // Sti: tråkket jord med små steiner i.
    lagVarianter('sti', (p, v) => {
        const j = tema.jord;
        p.rect(0, 0, TILE, TILE, j);
        flekker(p, rng, 6 + v * 2, ramp(j, -1), 2);
        flekker(p, rng, 4 + v, ramp(j, 1), 2);
        for (let i = 0; i < v; i++) {
            const x = 2 + Math.floor(rng() * (TILE - 4));
            const y = 2 + Math.floor(rng() * (TILE - 4));
            p.rect(x, y, 2, 1, ramp(j, 2));
            p.px(x, y + 1, ramp(j, -2));
        }
    });

    // Sand: fin, med små skjell og rifler.
    lagVarianter('sand', (p, v) => {
        const s = tema.sand;
        p.rect(0, 0, TILE, TILE, s);
        flekker(p, rng, 5, ramp(s, -1), 2);
        for (let i = 0; i < v; i++) {
            const y = 2 + Math.floor(rng() * (TILE - 4));
            p.hline(1 + Math.floor(rng() * 4), y, 4 + Math.floor(rng() * 5), ramp(s, 1));
        }
    });

    // Vann: fire rammer så bølgen faktisk ruller i stedet for å blinke.
    for (let frame = 0; frame < 4; frame++) {
        const p = createPainter(TILE, TILE);
        const v = tema.vann;
        p.rect(0, 0, TILE, TILE, v);
        for (let y = 0; y < TILE; y += 4) {
            const skift = Math.round(Math.sin((frame / 4) * Math.PI * 2 + y) * 2);
            p.hline(((y * 3) % TILE) + skift - 4, y + 1, 5, ramp(v, 1));
            p.hline(((y * 5) % TILE) + skift, y + 3, 3, ramp(v, -1));
        }
        addCanvas(scene, `flis-vann-${frame}`, p);
    }
    // Stillestående variant til bakingen, så ikke-animerte lag har noe å tegne.
    const stille = createPainter(TILE, TILE);
    stille.rect(0, 0, TILE, TILE, tema.vann);
    addCanvas(scene, 'flis-vann-0-stille', stille);

    // Stein/fjell: brutte flater i stedet for gjennomgående striper. De gamle
    // linjene på y=5 og y=11 dannet sammenhengende bånd tvers over fjellkjeden.
    lagVarianter('stein', (p, v) => {
        const s = tema.stein;
        p.rect(0, 0, TILE, TILE, s);
        flekker(p, rng, 5, ramp(s, -1), 2);
        flekker(p, rng, 4, ramp(s, 1), 2);
        for (let i = 0; i < 2 + v; i++) {
            const x = Math.floor(rng() * (TILE - 5));
            const y = 2 + Math.floor(rng() * (TILE - 5));
            const w = 3 + Math.floor(rng() * 5);
            p.hline(x, y, w, ramp(s, -2));
            p.hline(x, y - 1, w, ramp(s, 1));
        }
    });

    // Tregulv inne i husene.
    lagVarianter('tregulv', (p, v) => {
        const t = tema.tommer;
        p.rect(0, 0, TILE, TILE, t);
        p.hline(0, 4 + v, TILE, ramp(t, -2));
        p.hline(0, 10 + v, TILE, ramp(t, -2));
        p.hline(0, 5 + v, TILE, ramp(t, 1));
        flekker(p, rng, 4, ramp(t, 1), 2);
    });

    // Åker: plogfurer.
    lagVarianter('aker', (p, v) => {
        const a = tema.aker;
        p.rect(0, 0, TILE, TILE, a);
        for (let x = 1 + v; x < TILE; x += 4) {
            p.vline(x, 0, TILE, ramp(a, 1));
            p.vline(x + 1, 0, TILE, ramp(a, -1));
        }
        flekker(p, rng, 3, ramp(a, -2), 1);
    });

    forgeKanter(scene, tema);
}

// ─── Overgangsfliser ────────────────────────────────────────────────────────

/**
 * For hver flistype lages fire kanter og fire hjørner. De legges oppå naboruta,
 * så grensen mellom gress og sand blir en ujevn, myk overgang i stedet for en
 * rett strek langs et rutenett.
 */
function forgeKanter(scene: Phaser.Scene, tema: Tema): void {
    // «sandskum» er sandkanten som bare brukes der sanden møter vann. Uten et
    // eget sett ville den lyse skumkanten også blitt tegnet der sanden møter
    // stien, og etterlatt et hvitt flak midt på en brun vei.
    const materialer: (TileKey | 'sandskum')[] = [
        'gress',
        'sand',
        'sandskum',
        'stein',
        'sti',
        'aker',
        'tregulv',
    ];

    for (const flis of materialer) {
        const skum = flis === 'sandskum';
        const farge = flisFarge(tema, skum ? 'sand' : flis);
        const kantfarge = skum ? ramp(farge, 2) : ramp(farge, -1);
        const rng = makeRng(4711 + flis.length * 977);

        // Dybden på kanten varierer langs flisa, ellers blir overgangen en ny strek.
        const dybder = Array.from({ length: TILE }, () => 3 + Math.floor(rng() * 3));

        for (const retning of KANT_RETNINGER) {
            const p = createPainter(TILE, TILE);
            for (let i = 0; i < TILE; i++) {
                const d = dybder[(i + KANT_RETNINGER.indexOf(retning) * 5) % TILE];
                if (retning === 'n') {
                    p.vline(i, 0, d, farge);
                    p.px(i, d - 1, kantfarge);
                } else if (retning === 's') {
                    p.vline(i, TILE - d, d, farge);
                    p.px(i, TILE - d, kantfarge);
                } else if (retning === 'v') {
                    p.hline(0, i, d, farge);
                    p.px(d - 1, i, kantfarge);
                } else {
                    p.hline(TILE - d, i, d, farge);
                    p.px(TILE - d, i, kantfarge);
                }
            }
            addCanvas(scene, `kant-${flis}-${retning}`, p);
        }

        for (const hjorne of KANT_HJORNER) {
            const p = createPainter(TILE, TILE);
            const r = 4 + Math.floor(rng() * 2);
            const cx = hjorne[1] === 'v' ? 0 : TILE;
            const cy = hjorne[0] === 'n' ? 0 : TILE;
            for (let y = 0; y < TILE; y++) {
                for (let x = 0; x < TILE; x++) {
                    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
                    if (d < r) p.px(x, y, farge);
                    else if (d < r + 1) p.px(x, y, kantfarge);
                }
            }
            addCanvas(scene, `hjorne-${flis}-${hjorne}`, p);
        }
    }
}

// ─── Objekter som står på bakken ────────────────────────────────────────────

/** Hvor mange varianter hver propp har. */
export const PROP_VARIANTER: Record<string, number> = {
    tre: 3,
    busk: 2,
    stein: 3,
};

export function forgeProps(scene: Phaser.Scene, tema: Tema): void {
    const rng = makeRng(991);
    const lov = tema.lov;
    const tommer = tema.tommer;
    const tak = tema.tak;

    // ── Trær: tre ulike former, så en skog ikke er 130 kloner ───────────────
    for (let v = 0; v < PROP_VARIANTER.tre; v++) {
        const hoyde = [34, 30, 38][v];
        const tre = createPainter(26, hoyde + 2, 1, 1);
        const stamme = ramp(tommer, -1);
        tre.rect(10, hoyde - 12, 4, 12, stamme);
        tre.vline(10, hoyde - 12, 12, ramp(stamme, 1));
        tre.rect(12, hoyde - 12, 2, 12, ramp(stamme, -2));
        const lag = [3, 3, 4][v];
        for (let i = 0; i < lag; i++) {
            const y = 8 + i * ((hoyde - 20) / lag);
            const w = 6 + i * 3;
            tre.ellipse(12, y, w, 5, ramp(lov, -1));
            tre.ellipse(11, y - 1, w - 2, 3, lov);
            tre.ellipse(10, y - 2, Math.max(1, w - 5), 2, ramp(lov, 1));
        }
        tre.ellipse(12, 6, 5, 4, ramp(lov, -1));
        tre.ellipse(11, 5, 3, 2, ramp(lov, 2));
        tre.outline();
        tre.behind(() => tre.ellipse(12, hoyde, 7, 2, 'rgba(0,0,0,0.3)'));
        addCanvas(scene, `prop-tre-${v}`, tre);
    }

    // ── Busker ──────────────────────────────────────────────────────────────
    for (let v = 0; v < PROP_VARIANTER.busk; v++) {
        const busk = createPainter(18, 16, 1, 1);
        busk.ellipse(8, 8, 6, 5, ramp(lov, -1));
        busk.ellipse(7, 6, 4, 3, lov);
        busk.ellipse(6, 5, 2, 2, ramp(lov, 1));
        if (v === 1) {
            for (let i = 0; i < 4; i++) {
                busk.px(4 + Math.floor(rng() * 8), 5 + Math.floor(rng() * 5), '#c94f4f');
            }
        }
        busk.outline();
        busk.behind(() => busk.ellipse(8, 12, 5, 2, 'rgba(0,0,0,0.28)'));
        addCanvas(scene, `prop-busk-${v}`, busk);
    }

    // ── Kampesteiner ────────────────────────────────────────────────────────
    for (let v = 0; v < PROP_VARIANTER.stein; v++) {
        const s = createPainter(18, 16, 1, 1);
        const rx = [6, 5, 7][v];
        s.ellipse(8, 8, rx, 4, tema.stein);
        s.ellipse(7, 7, rx - 2, 2, ramp(tema.stein, 1));
        s.ellipse(6, 6, Math.max(1, rx - 4), 1, ramp(tema.stein, 2));
        s.hline(8 - rx + 1, 10, rx * 2 - 2, ramp(tema.stein, -2));
        s.outline();
        s.behind(() => s.ellipse(8, 11, rx - 1, 2, 'rgba(0,0,0,0.28)'));
        addCanvas(scene, `prop-stein-${v}`, s);
    }

    // ── Runestein ───────────────────────────────────────────────────────────
    const rune = createPainter(18, 28, 1, 1);
    rune.rect(4, 4, 8, 20, '#8d9199');
    rune.vline(4, 4, 20, ramp('#8d9199', 1));
    rune.rect(10, 4, 2, 20, ramp('#8d9199', -1));
    rune.rect(5, 2, 6, 3, '#9aa0a8');
    const riss = '#c14b3a';
    rune.vline(6, 8, 10, riss);
    rune.vline(9, 8, 10, riss);
    rune.px(7, 10, riss);
    rune.px(8, 11, riss);
    rune.px(7, 15, riss);
    rune.px(8, 14, riss);
    rune.outline();
    rune.behind(() => rune.ellipse(8, 24, 5, 2, 'rgba(0,0,0,0.32)'));
    addCanvas(scene, 'prop-runestein', rune);

    // ── Langhus med torvtak ─────────────────────────────────────────────────
    const hus = createPainter(74, 54, 1, 1);
    hus.rect(6, 26, 60, 22, tommer);
    hus.hline(6, 26, 60, ramp(tommer, -2));
    for (let x = 8; x < 66; x += 6) {
        hus.vline(x, 29, 19, ramp(tommer, -1));
        hus.vline(x + 1, 29, 19, ramp(tommer, 1));
    }
    for (let i = 0; i < 14; i++) {
        const w = 62 - i * 4;
        hus.rect(36 - w / 2, 26 - i * 2, w, 2, i < 3 ? ramp(tak, 1) : tak);
        if (i === 13) hus.rect(36 - w / 2, 26 - i * 2, w, 1, ramp(tak, 2));
    }
    hus.rect(30, 36, 10, 12, '#2a1e12');
    hus.rect(30, 36, 10, 2, '#180f08');
    hus.px(38, 42, '#c9a227');
    hus.outline();
    hus.behind(() => hus.ellipse(36, 50, 32, 3, 'rgba(0,0,0,0.28)'));
    addCanvas(scene, 'prop-langhus', hus);

    // ── Lite hus ────────────────────────────────────────────────────────────
    const bu = createPainter(42, 38, 1, 1);
    bu.rect(4, 18, 32, 14, tommer);
    for (let x = 6; x < 36; x += 6) {
        bu.vline(x, 20, 12, ramp(tommer, -1));
        bu.vline(x + 1, 20, 12, ramp(tommer, 1));
    }
    for (let i = 0; i < 9; i++) {
        const w = 34 - i * 3;
        bu.rect(20 - w / 2, 18 - i * 2, w, 2, i < 2 ? ramp(tak, 1) : tak);
    }
    bu.rect(17, 24, 7, 8, '#2a1e12');
    bu.outline();
    bu.behind(() => bu.ellipse(20, 34, 17, 2, 'rgba(0,0,0,0.28)'));
    addCanvas(scene, 'prop-bu', bu);

    // ── Naust ved vannet ────────────────────────────────────────────────────
    const naust = createPainter(50, 36, 1, 1);
    naust.rect(4, 16, 40, 15, ramp(tommer, -1));
    for (let x = 6; x < 44; x += 6) {
        naust.vline(x, 18, 13, ramp(tommer, -2));
        naust.vline(x + 1, 18, 13, tommer);
    }
    // Taket må ha lag med kontrast, ellers blir hele naustet én mørk klump.
    for (let i = 0; i < 8; i++) {
        const w = 42 - i * 4;
        naust.rect(24 - w / 2, 16 - i * 2, w, 2, i % 2 === 0 ? ramp(tak, -1) : tak);
    }
    naust.rect(24 - 42 / 2 + 21 - 3, 16 - 7 * 2, 6, 1, ramp(tak, 2));
    naust.rect(18, 22, 12, 9, '#1c1409');
    naust.hline(18, 22, 12, '#100b06');
    naust.outline();
    naust.behind(() => naust.ellipse(24, 32, 21, 2, 'rgba(0,0,0,0.28)'));
    addCanvas(scene, 'prop-naust', naust);

    // ── Bål: fire rammer ────────────────────────────────────────────────────
    for (let frame = 0; frame < 4; frame++) {
        const p = createPainter(18, 20, 1, 1);
        p.rect(3, 13, 10, 2, ramp(tommer, -1));
        p.rect(5, 11, 6, 2, ramp(tommer, -2));
        const h = 6 + (frame % 3);
        p.ellipse(8, 14 - h / 2, 3, h / 2, '#e8622a');
        p.ellipse(8, 14 - h / 2, 2, h / 2 - 1, '#ffb23f');
        p.ellipse(8, 13 - h / 2, 1, 2, '#fff0a8');
        p.outline();
        p.behind(() => p.ellipse(8, 16, 6, 2, 'rgba(0,0,0,0.28)'));
        addCanvas(scene, `prop-baal-${frame}`, p);
    }

    // ── Kai og langskip ─────────────────────────────────────────────────────
    const kai = createPainter(TILE, TILE);
    kai.rect(0, 0, TILE, TILE, tommer);
    for (const y of [3, 9, 15]) {
        kai.hline(0, y, TILE, ramp(tommer, -2));
        kai.hline(0, y - 1, TILE, ramp(tommer, 1));
    }
    addCanvas(scene, 'prop-kai', kai);

    const skip = createPainter(66, 32, 1, 1);
    skip.ellipse(32, 21, 28, 5, ramp(tommer, -1));
    skip.ellipse(32, 20, 26, 4, ramp(tommer, 1));
    skip.rect(4, 12, 4, 9, ramp(tommer, -1));
    skip.rect(56, 12, 4, 9, ramp(tommer, -1));
    skip.rect(31, 2, 2, 18, ramp(tommer, -2));
    skip.rect(18, 3, 28, 12, '#d8d0c0');
    for (let x = 20; x < 46; x += 6) skip.vline(x, 3, 12, '#b04a4a');
    for (let x = 12; x < 54; x += 8) {
        skip.ellipse(x, 19, 3, 3, x % 16 === 4 ? '#c9a227' : '#b04a4a');
        skip.px(x, 19, '#3a2a1a');
    }
    skip.outline();
    skip.behind(() => skip.ellipse(32, 25, 28, 4, 'rgba(0,0,0,0.22)'));
    addCanvas(scene, 'prop-langskip', skip);

    // ── Gjerde ──────────────────────────────────────────────────────────────
    const gjerde = createPainter(TILE + 2, 16, 1, 1);
    gjerde.rect(2, 2, 2, 11, ramp(tommer, -1));
    gjerde.rect(11, 2, 2, 11, ramp(tommer, -1));
    gjerde.hline(0, 5, TILE, tommer);
    gjerde.hline(0, 9, TILE, tommer);
    gjerde.outline();
    addCanvas(scene, 'prop-gjerde', gjerde);

    // ── Skilt ───────────────────────────────────────────────────────────────
    const skilt = createPainter(18, 22, 1, 1);
    skilt.rect(7, 8, 2, 10, ramp(tommer, -1));
    skilt.rect(2, 3, 12, 7, tommer);
    skilt.hline(2, 3, 12, ramp(tommer, 1));
    skilt.hline(4, 6, 8, ramp(tommer, -2));
    skilt.hline(4, 8, 6, ramp(tommer, -2));
    skilt.outline();
    skilt.behind(() => skilt.ellipse(8, 18, 4, 2, 'rgba(0,0,0,0.28)'));
    addCanvas(scene, 'prop-skilt', skilt);
}
