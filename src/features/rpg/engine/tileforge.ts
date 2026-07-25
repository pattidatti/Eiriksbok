// Terrengfliser og verdensobjekter, tegnet prosedyralt. Fargene kommer fra
// sonens tema, så en ny sone får sitt eget utseende ved å bytte fire farger.

import type Phaser from 'phaser';
import type { ZoneDef } from '../types';
import { createPainter, makeRng, shade } from './pixels';
import { TILE } from './spriteforge';

export type TileKey =
    | 'gress'
    | 'gress-2'
    | 'gress-3'
    | 'sti'
    | 'sand'
    | 'vann'
    | 'stein'
    | 'tregulv'
    | 'aker';

function addCanvas(scene: Phaser.Scene, key: string, painter: { canvas: HTMLCanvasElement }): void {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const texture = scene.textures.createCanvas(key, painter.canvas.width, painter.canvas.height);
    if (!texture) return;
    texture.context.drawImage(painter.canvas, 0, 0);
    texture.refresh();
}

export function forgeTiles(scene: Phaser.Scene, tema: ZoneDef['tema']): void {
    const rng = makeRng(20250725);

    const gress = (variant: number) => {
        const p = createPainter(TILE, TILE);
        p.rect(0, 0, TILE, TILE, tema.gress);
        // Lett støy så flaten ikke blir en dau farge
        for (let i = 0; i < 26; i++) {
            const x = Math.floor(rng() * TILE);
            const y = Math.floor(rng() * TILE);
            p.px(x, y, rng() > 0.5 ? shade(tema.gress, 0.08) : shade(tema.gress, -0.08));
        }
        // Gresstuster
        const tufts = variant === 0 ? 0 : variant === 1 ? 2 : 4;
        for (let i = 0; i < tufts; i++) {
            const x = 2 + Math.floor(rng() * (TILE - 4));
            const y = 3 + Math.floor(rng() * (TILE - 6));
            const c = shade(tema.gress, 0.22);
            p.px(x, y, c);
            p.px(x, y - 1, c);
            p.px(x + 1, y, shade(tema.gress, 0.1));
        }
        return p;
    };

    addCanvas(scene, 'flis-gress', gress(0));
    addCanvas(scene, 'flis-gress-2', gress(1));
    addCanvas(scene, 'flis-gress-3', gress(2));

    // Sti - tråkket jord
    const sti = createPainter(TILE, TILE);
    const jord = '#8a7355';
    sti.rect(0, 0, TILE, TILE, jord);
    for (let i = 0; i < 34; i++) {
        sti.px(
            Math.floor(rng() * TILE),
            Math.floor(rng() * TILE),
            rng() > 0.5 ? shade(jord, 0.1) : shade(jord, -0.12)
        );
    }
    addCanvas(scene, 'flis-sti', sti);

    // Sand i fjæra
    const sand = createPainter(TILE, TILE);
    const sandC = '#d8c89a';
    sand.rect(0, 0, TILE, TILE, sandC);
    for (let i = 0; i < 22; i++) {
        sand.px(Math.floor(rng() * TILE), Math.floor(rng() * TILE), shade(sandC, -0.1));
    }
    addCanvas(scene, 'flis-sand', sand);

    // Vann - to rammer så det kan animeres rolig
    for (let frame = 0; frame < 2; frame++) {
        const p = createPainter(TILE, TILE);
        p.rect(0, 0, TILE, TILE, tema.vann);
        for (let y = 0; y < TILE; y += 4) {
            const off = frame === 0 ? 0 : 2;
            p.hline(((y * 3) % TILE) + off - 4, y + 1, 5, shade(tema.vann, 0.18));
            p.hline(((y * 5) % TILE) + off, y + 3, 3, shade(tema.vann, -0.12));
        }
        addCanvas(scene, `flis-vann-${frame}`, p);
    }

    // Stein/fjell
    const stein = createPainter(TILE, TILE);
    stein.rect(0, 0, TILE, TILE, tema.stein);
    for (let i = 0; i < 18; i++) {
        stein.px(
            Math.floor(rng() * TILE),
            Math.floor(rng() * TILE),
            rng() > 0.5 ? shade(tema.stein, 0.14) : shade(tema.stein, -0.16)
        );
    }
    stein.hline(0, 5, TILE, shade(tema.stein, -0.2));
    stein.hline(0, 11, TILE, shade(tema.stein, -0.2));
    addCanvas(scene, 'flis-stein', stein);

    // Tregulv inne i husene
    const gulv = createPainter(TILE, TILE);
    const tre = '#6b4a2f';
    gulv.rect(0, 0, TILE, TILE, tre);
    gulv.hline(0, 4, TILE, shade(tre, -0.2));
    gulv.hline(0, 10, TILE, shade(tre, -0.2));
    for (let i = 0; i < 14; i++) {
        gulv.px(Math.floor(rng() * TILE), Math.floor(rng() * TILE), shade(tre, 0.1));
    }
    addCanvas(scene, 'flis-tregulv', gulv);

    // Åker
    const aker = createPainter(TILE, TILE);
    aker.rect(0, 0, TILE, TILE, '#7a6236');
    for (let x = 1; x < TILE; x += 4) {
        aker.vline(x, 0, TILE, '#8e7a45');
        aker.vline(x + 1, 0, TILE, shade('#8e7a45', 0.15));
    }
    addCanvas(scene, 'flis-aker', aker);
}

// ─── Objekter som står på bakken ────────────────────────────────────────────

export function forgeProps(scene: Phaser.Scene, tema: ZoneDef['tema']): void {
    const rng = makeRng(991);

    // Furu
    const tre = createPainter(24, 34);
    tre.ellipse(12, 32, 7, 2, 'rgba(0,0,0,0.28)');
    tre.rect(10, 22, 4, 10, '#4a3524');
    tre.rect(12, 22, 2, 10, '#33251a');
    for (let layer = 0; layer < 3; layer++) {
        const y = 8 + layer * 6;
        const w = 6 + layer * 3;
        tre.ellipse(12, y, w, 5, '#2f5c34');
        tre.ellipse(11, y - 1, w - 2, 3, '#3d7a42');
    }
    tre.ellipse(12, 6, 5, 4, '#2f5c34');
    tre.ellipse(11, 5, 3, 2, '#4a8a4a');
    addCanvas(scene, 'prop-tre', tre);

    // Busk
    const busk = createPainter(16, 14);
    busk.ellipse(8, 12, 5, 2, 'rgba(0,0,0,0.25)');
    busk.ellipse(8, 8, 6, 5, '#2f5c34');
    busk.ellipse(6, 6, 4, 3, '#3d7a42');
    for (let i = 0; i < 4; i++) {
        busk.px(4 + Math.floor(rng() * 8), 5 + Math.floor(rng() * 5), '#c94f4f');
    }
    addCanvas(scene, 'prop-busk', busk);

    // Stein
    const kampestein = createPainter(16, 14);
    kampestein.ellipse(8, 12, 5, 2, 'rgba(0,0,0,0.25)');
    kampestein.ellipse(8, 8, 6, 4, tema.stein);
    kampestein.ellipse(7, 7, 4, 2, shade(tema.stein, 0.18));
    addCanvas(scene, 'prop-stein', kampestein);

    // Runestein
    const rune = createPainter(16, 26);
    rune.ellipse(8, 24, 5, 2, 'rgba(0,0,0,0.3)');
    rune.rect(4, 4, 8, 20, '#8d9199');
    rune.rect(10, 4, 2, 20, '#6e737b');
    rune.rect(5, 2, 6, 3, '#9aa0a8');
    // Rune-riss
    const riss = '#c14b3a';
    rune.vline(6, 8, 10, riss);
    rune.vline(9, 8, 10, riss);
    rune.px(7, 10, riss);
    rune.px(8, 11, riss);
    rune.px(7, 15, riss);
    rune.px(8, 14, riss);
    addCanvas(scene, 'prop-runestein', rune);

    // Langhus - stort, med torvtak
    const hus = createPainter(72, 52);
    hus.ellipse(36, 50, 32, 3, 'rgba(0,0,0,0.25)');
    hus.rect(6, 26, 60, 22, '#6b5335');
    hus.rect(6, 26, 60, 3, '#5a4529');
    for (let x = 8; x < 66; x += 6) hus.vline(x, 29, 19, '#5a4529');
    // Torvtak
    for (let i = 0; i < 14; i++) {
        const w = 62 - i * 4;
        hus.rect(36 - w / 2, 26 - i * 2, w, 2, i < 3 ? '#4a6b3a' : '#3d5c30');
    }
    hus.rect(30, 36, 10, 12, '#3a2a1a');
    hus.rect(30, 36, 10, 2, '#251a10');
    hus.px(38, 42, '#c9a227');
    addCanvas(scene, 'prop-langhus', hus);

    // Lite hus
    const bu = createPainter(40, 36);
    bu.ellipse(20, 34, 17, 2, 'rgba(0,0,0,0.25)');
    bu.rect(4, 18, 32, 14, '#6b5335');
    for (let x = 6; x < 36; x += 6) bu.vline(x, 20, 12, '#5a4529');
    for (let i = 0; i < 9; i++) {
        const w = 34 - i * 3;
        bu.rect(20 - w / 2, 18 - i * 2, w, 2, i < 2 ? '#4a6b3a' : '#3d5c30');
    }
    bu.rect(17, 24, 7, 8, '#3a2a1a');
    addCanvas(scene, 'prop-bu', bu);

    // Naust ved vannet
    const naust = createPainter(48, 34);
    naust.ellipse(24, 32, 21, 2, 'rgba(0,0,0,0.25)');
    naust.rect(4, 16, 40, 15, '#5a4529');
    for (let i = 0; i < 8; i++) {
        const w = 42 - i * 4;
        naust.rect(24 - w / 2, 16 - i * 2, w, 2, '#4a3524');
    }
    naust.rect(18, 22, 12, 9, '#241a10');
    addCanvas(scene, 'prop-naust', naust);

    // Bål
    for (let frame = 0; frame < 3; frame++) {
        const p = createPainter(16, 18);
        p.ellipse(8, 16, 6, 2, 'rgba(0,0,0,0.25)');
        p.rect(3, 13, 10, 2, '#4a3524');
        p.rect(5, 11, 6, 2, '#3a2a1a');
        const h = 6 + frame;
        p.ellipse(8, 14 - h / 2, 3, h / 2, '#e8622a');
        p.ellipse(8, 14 - h / 2, 2, h / 2 - 1, '#ffb23f');
        p.ellipse(8, 13 - h / 2, 1, 2, '#fff0a8');
        addCanvas(scene, `prop-baal-${frame}`, p);
    }

    // Kai / brygge
    const kai = createPainter(TILE, TILE);
    kai.rect(0, 0, TILE, TILE, '#6b5335');
    kai.hline(0, 3, TILE, '#4a3524');
    kai.hline(0, 9, TILE, '#4a3524');
    kai.hline(0, 15, TILE, '#4a3524');
    addCanvas(scene, 'prop-kai', kai);

    // Langskip ved kaia
    const skip = createPainter(64, 30);
    skip.ellipse(32, 24, 28, 4, 'rgba(0,0,0,0.2)');
    skip.ellipse(32, 21, 28, 5, '#5a4529');
    skip.ellipse(32, 20, 26, 4, '#7a5f3a');
    skip.rect(4, 12, 4, 9, '#5a4529');
    skip.rect(56, 12, 4, 9, '#5a4529');
    skip.rect(31, 2, 2, 18, '#4a3524');
    // Seil
    skip.rect(18, 3, 28, 12, '#d8d0c0');
    for (let x = 20; x < 46; x += 6) skip.vline(x, 3, 12, '#b04a4a');
    // Skjold langs rekka
    for (let x = 12; x < 54; x += 8) {
        skip.ellipse(x, 19, 3, 3, x % 16 === 4 ? '#c9a227' : '#b04a4a');
        skip.px(x, 19, '#3a2a1a');
    }
    addCanvas(scene, 'prop-langskip', skip);

    // Gjerde
    const gjerde = createPainter(TILE, 14);
    gjerde.rect(2, 2, 2, 11, '#6b4a2f');
    gjerde.rect(11, 2, 2, 11, '#6b4a2f');
    gjerde.hline(0, 5, TILE, '#7a5535');
    gjerde.hline(0, 9, TILE, '#7a5535');
    addCanvas(scene, 'prop-gjerde', gjerde);

    // Skilt
    const skilt = createPainter(16, 20);
    skilt.ellipse(8, 18, 4, 2, 'rgba(0,0,0,0.25)');
    skilt.rect(7, 8, 2, 10, '#6b4a2f');
    skilt.rect(2, 3, 12, 7, '#8a6a45');
    skilt.rect(2, 3, 12, 1, '#a5825a');
    skilt.hline(4, 6, 8, '#4a3524');
    skilt.hline(4, 8, 6, '#4a3524');
    addCanvas(scene, 'prop-skilt', skilt);
}
