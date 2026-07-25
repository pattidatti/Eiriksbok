// Sprite-smia. Her tegnes alle figurer, fiender, våpen og effekter som
// piksel-grafikk rett inn i Phaser-teksturer. Ingen bildefiler.
//
// Menneskefigurene bygges lagvis som en påkledningsdukke: kropp → hår →
// kjortel → rustning → belte. Derfor koster det ingenting å la eleven velge
// hudtone og frisyre, og derfor synes rustningen hun tar på seg med én gang.

import type Phaser from 'phaser';
import type { AppearanceChoice, EnemyDef, WeaponArt } from '../types';
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from '../data/classes';
import { createPainter, numToHex, shade, type Painter } from './pixels';

export const TILE = 16;
/** Figurene er 16 brede og 22 høye. Føttene står nederst. */
const FW = 16;
const FH = 22;

export type Dir = 'ned' | 'venstre' | 'hoyre' | 'opp';

export interface HeroLook {
    appearance: AppearanceChoice;
    tunic: string;
    trim: string;
    /** 0 = ingen rustning, 1-3 = stadig tyngre. Styrer plater og hjelm. */
    armorTier: number;
}

function addCanvas(scene: Phaser.Scene, key: string, painter: { canvas: HTMLCanvasElement }): void {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const texture = scene.textures.createCanvas(key, painter.canvas.width, painter.canvas.height);
    if (!texture) return;
    texture.context.drawImage(painter.canvas, 0, 0);
    texture.refresh();
}

// ─── Menneskefigur ──────────────────────────────────────────────────────────

/**
 * Tegner én ramme av en menneskefigur.
 * `step` er gangfasen: 0 = stå, 1 og 2 = de to skrittene.
 */
function drawHumanoid(
    p: Painter,
    dir: Dir,
    step: number,
    look: HeroLook,
    hairColor: string,
    skin: string
): void {
    const tunic = look.tunic;
    const trim = look.trim;
    const skinDark = shade(skin, -0.22);
    const tunicDark = shade(tunic, -0.25);
    const bukse = '#4a3b2c';
    const buskeDark = shade(bukse, -0.25);
    const sko = '#2e2419';

    const bakFra = dir === 'opp';
    const side = dir === 'venstre' || dir === 'hoyre';

    // Skygge under føttene - gjør at figuren står på bakken i stedet for å sveve.
    p.ellipse(8, 21, 5, 2, 'rgba(0,0,0,0.28)');

    // Bein. Skrittene bytter på hvilket bein som er fremme.
    const legOffset = step === 0 ? 0 : step === 1 ? 1 : -1;
    p.rect(5, 16 + Math.max(0, -legOffset), 3, 4 - Math.abs(legOffset) * 0, bukse);
    p.rect(8, 16 + Math.max(0, legOffset), 3, 4, buskeDark);
    p.rect(5, 20 - Math.max(0, -legOffset) + Math.max(0, -legOffset), 3, 1, sko);
    p.rect(8, 20, 3, 1, sko);

    // Kjortel
    p.rect(4, 9, 8, 8, tunic);
    p.rect(4, 16, 8, 1, tunicDark);
    // Skyggeside gir figuren volum
    p.rect(10, 9, 2, 8, tunicDark);
    // Belte
    p.rect(4, 14, 8, 1, shade(trim, -0.3));
    p.px(7, 14, trim);

    // Armer. I gange svinger de motsatt av beina.
    const armSwing = step === 1 ? -1 : step === 2 ? 1 : 0;
    p.rect(3, 10 + armSwing, 2, 5, tunic);
    p.rect(11, 10 - armSwing, 2, 5, tunicDark);
    p.rect(3, 15 + armSwing, 2, 2, skin);
    p.rect(11, 15 - armSwing, 2, 2, skinDark);

    // Rustning oppå kjortelen
    if (look.armorTier >= 1) {
        const plate = look.armorTier >= 3 ? '#c8cdd6' : look.armorTier === 2 ? '#9aa3ae' : '#7a6a52';
        const plateDark = shade(plate, -0.3);
        p.rect(4, 9, 8, 4, plate);
        p.rect(10, 9, 2, 4, plateDark);
        p.hline(4, 12, 8, plateDark);
        if (look.armorTier >= 2) {
            p.rect(3, 9, 2, 2, plate);
            p.rect(11, 9, 2, 2, plateDark);
        }
    }

    // Hode
    p.rect(5, 3, 6, 6, skin);
    p.rect(9, 3, 2, 6, skinDark);
    p.rect(5, 9, 6, 1, skinDark);

    // Ansikt - bare synlig forfra og fra siden
    if (!bakFra) {
        const eye = '#241a12';
        if (side) {
            p.px(9, 6, eye);
        } else {
            p.px(6, 6, eye);
            p.px(9, 6, eye);
            const face = look.appearance.face;
            if (face === 1) p.hline(7, 8, 2, shade(skin, -0.35));
            if (face === 2) {
                p.px(6, 8, shade(skin, -0.35));
                p.px(9, 8, shade(skin, -0.35));
                p.hline(7, 8, 2, shade(skin, -0.35));
            }
            if (face === 3) p.px(6, 5, shade(skin, -0.4));
        }
    }

    // Hår
    drawHair(p, HAIR_STYLES[look.appearance.hair % HAIR_STYLES.length], hairColor, dir);

    // Hjelm på toppen av alt når rustningen er tung nok
    if (look.armorTier >= 3) {
        const helm = '#c8cdd6';
        p.rect(4, 2, 8, 3, helm);
        p.rect(10, 2, 2, 3, shade(helm, -0.3));
        if (!bakFra) p.vline(8, 4, 3, shade(helm, -0.2));
    }
}

function drawHair(p: Painter, style: string, color: string, dir: Dir): void {
    const dark = shade(color, -0.3);
    const bak = dir === 'opp';
    switch (style) {
        case 'kort':
            p.rect(5, 2, 6, 2, color);
            p.px(4, 3, color);
            p.px(11, 3, dark);
            break;
        case 'flette':
            p.rect(5, 2, 6, 2, color);
            p.rect(4, 3, 1, 4, color);
            p.rect(11, 3, 1, 4, dark);
            p.rect(11, 7, 1, 3, dark);
            break;
        case 'topplue':
            p.rect(5, 1, 6, 3, color);
            p.rect(4, 3, 8, 1, dark);
            p.px(8, 0, color);
            break;
        case 'langt':
            p.rect(5, 2, 6, 2, color);
            p.rect(4, 3, 1, 8, color);
            p.rect(11, 3, 1, 8, dark);
            if (bak) p.rect(5, 3, 6, 7, color);
            break;
        case 'skallet':
            p.rect(5, 2, 6, 1, shade(color, 0.1));
            break;
        case 'hestehale':
            p.rect(5, 2, 6, 2, color);
            p.rect(11, 3, 1, 2, dark);
            p.rect(12, 4, 1, 5, dark);
            break;
    }
}

/**
 * Lager alle rammene en figur trenger og registrerer dem som teksturer.
 * Nøkkelmønster: `${prefix}-${retning}-${steg}`.
 */
export function forgeHumanoid(scene: Phaser.Scene, prefix: string, look: HeroLook): void {
    const skin = SKIN_TONES[look.appearance.skin % SKIN_TONES.length];
    const hairColor = HAIR_COLORS[look.appearance.hairColor % HAIR_COLORS.length];

    for (const dir of ['ned', 'venstre', 'opp'] as Dir[]) {
        for (let step = 0; step < 3; step++) {
            const p = createPainter(FW, FH);
            drawHumanoid(p, dir, step, look, hairColor, skin);
            addCanvas(scene, `${prefix}-${dir}-${step}`, p);
        }
    }
    // Høyre er venstre speilvendt - halvparten så mye tegning.
    for (let step = 0; step < 3; step++) {
        const p = createPainter(FW, FH);
        drawHumanoid(p, 'venstre', step, look, hairColor, skin);
        p.mirror();
        addCanvas(scene, `${prefix}-hoyre-${step}`, p);
    }
}

/** Ett stillbilde av figuren, til bruk i karakterskaperen og HUD-en. */
export function renderHeroPortrait(look: HeroLook, scale = 6): string {
    const skin = SKIN_TONES[look.appearance.skin % SKIN_TONES.length];
    const hairColor = HAIR_COLORS[look.appearance.hairColor % HAIR_COLORS.length];
    const p = createPainter(FW, FH);
    drawHumanoid(p, 'ned', 0, look, hairColor, skin);

    const out = document.createElement('canvas');
    out.width = FW * scale;
    out.height = FH * scale;
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(p.canvas, 0, 0, out.width, out.height);
    return out.toDataURL();
}

// ─── Fiender ────────────────────────────────────────────────────────────────

function drawEnemy(p: Painter, def: EnemyDef, frame: number): void {
    const base = numToHex(def.farge);
    const light = shade(base, 0.25);
    const dark = shade(base, -0.35);
    const bob = frame === 1 ? -1 : 0;
    const cx = p.w / 2;

    p.ellipse(cx, p.h - 2, p.w * 0.28, 2, 'rgba(0,0,0,0.3)');

    switch (def.kind) {
        case 'glemsel': {
            // En tåkeklump med hull i. Formen «eter» seg selv.
            p.ellipse(cx, p.h / 2 + bob, p.w * 0.38, p.h * 0.3, base);
            p.ellipse(cx - 2, p.h / 2 - 2 + bob, p.w * 0.24, p.h * 0.18, light);
            p.ellipse(cx + 3, p.h / 2 + 2 + bob, 2, 2, 'rgba(0,0,0,0.35)');
            p.px(cx - 3, p.h / 2 + bob, '#ffffff');
            p.px(cx + 2, p.h / 2 - 1 + bob, '#ffffff');
            break;
        }
        case 'paastand': {
            // Skarp, kantete skikkelse - en påstand som stikker.
            const h = p.h;
            p.rect(cx - 5, h / 2 - 4 + bob, 10, 9, base);
            p.rect(cx + 1, h / 2 - 4 + bob, 4, 9, dark);
            p.rect(cx - 6, h / 2 - 6 + bob, 3, 4, light);
            p.rect(cx + 3, h / 2 - 6 + bob, 3, 4, light);
            p.px(cx - 3, h / 2 - 1 + bob, '#ffe9a8');
            p.px(cx + 2, h / 2 - 1 + bob, '#ffe9a8');
            p.hline(cx - 3, h / 2 + 3 + bob, 6, dark);
            break;
        }
        case 'anakronisme': {
            // Firkantet og «feil» - med visere som går hver sin vei.
            p.rect(cx - 5, p.h / 2 - 5 + bob, 10, 10, base);
            p.rect(cx + 1, p.h / 2 - 5 + bob, 4, 10, dark);
            p.rect(cx - 3, p.h / 2 - 3 + bob, 6, 6, light);
            p.vline(cx, p.h / 2 - 3 + bob, 3 + (frame % 2), '#241a12');
            p.hline(cx, p.h / 2 + bob, 2 + (frame % 2), '#241a12');
            break;
        }
        case 'rykte': {
            // Et spøkelse med altfor stor munn.
            p.ellipse(cx, p.h / 2 - 1 + bob, p.w * 0.3, p.h * 0.26, base);
            p.rect(cx - 4, p.h / 2 + bob, 8, 5, base);
            for (let i = 0; i < 4; i++) {
                p.px(cx - 4 + i * 2 + (frame % 2), p.h / 2 + 5 + bob, base);
            }
            p.px(cx - 2, p.h / 2 - 2 + bob, '#ffffff');
            p.px(cx + 1, p.h / 2 - 2 + bob, '#ffffff');
            p.ellipse(cx, p.h / 2 + 2 + bob, 2, 1 + (frame % 2), '#1a1420');
            break;
        }
        case 'vrangbilde': {
            // En vridd speilbilde-skikkelse.
            p.rect(cx - 5, p.h / 2 - 6 + bob, 10, 12, base);
            p.rect(cx + 1, p.h / 2 - 6 + bob, 4, 12, dark);
            p.rect(cx - 6, p.h / 2 - 8 + bob, 12, 3, light);
            p.px(cx - 3, p.h / 2 - 3 + bob, '#ff6b6b');
            p.px(cx + 2, p.h / 2 - 3 + bob, '#ff6b6b');
            p.hline(cx - 4, p.h / 2 + 2 + bob, 8, dark);
            break;
        }
        case 'boss': {
            // Stor tåkemasse med mange øyne. Øynene blunker i utakt.
            p.ellipse(cx, p.h / 2 + bob, p.w * 0.42, p.h * 0.36, dark);
            p.ellipse(cx, p.h / 2 - 2 + bob, p.w * 0.36, p.h * 0.28, base);
            p.ellipse(cx - 4, p.h / 2 - 4 + bob, p.w * 0.18, p.h * 0.12, light);
            const eyes: [number, number][] = [
                [-6, -3],
                [-1, -5],
                [4, -2],
                [-3, 2],
                [5, 3],
            ];
            eyes.forEach(([ex, ey], i) => {
                if ((i + frame) % 4 === 3) return;
                p.px(cx + ex, p.h / 2 + ey + bob, '#fff3c4');
                p.px(cx + ex, p.h / 2 + ey + 1 + bob, '#c9a227');
            });
            break;
        }
    }
}

export function forgeEnemy(scene: Phaser.Scene, def: EnemyDef): void {
    const scale = def.storrelse ?? 1;
    const w = Math.round(20 * scale);
    const h = Math.round(20 * scale);
    for (let frame = 0; frame < 3; frame++) {
        const p = createPainter(w, h);
        drawEnemy(p, def, frame);
        addCanvas(scene, `fiende-${def.id}-${frame}`, p);
    }
}

// ─── Våpen ──────────────────────────────────────────────────────────────────
// Våpenet er en egen sprite som roteres i slagbuen. Det gir et mye bedre slag
// enn å bake våpenet inn i figuren.

export function forgeWeapon(scene: Phaser.Scene, art: WeaponArt, tint: string): void {
    const key = `vapen-${art}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const p = createPainter(20, 8);
    const metal = tint;
    const metalLight = shade(metal, 0.35);
    const tre = '#6b4a2f';

    switch (art) {
        case 'sverd':
            p.rect(2, 3, 4, 2, tre);
            p.rect(6, 2, 1, 4, '#c9a227');
            p.rect(7, 3, 11, 2, metal);
            p.hline(7, 3, 11, metalLight);
            p.px(18, 4, metal);
            break;
        case 'oks':
            p.rect(2, 3, 11, 2, tre);
            p.rect(12, 1, 5, 6, metal);
            p.rect(12, 1, 5, 2, metalLight);
            p.px(17, 3, metal);
            p.px(17, 4, metal);
            break;
        case 'stav':
            p.rect(1, 3, 15, 2, tre);
            p.ellipse(17, 4, 2, 3, metal);
            p.px(17, 3, metalLight);
            break;
        case 'spyd':
            p.rect(1, 3, 14, 2, tre);
            p.rect(15, 2, 3, 4, metal);
            p.rect(18, 3, 2, 2, metal);
            p.hline(15, 3, 3, metalLight);
            break;
        case 'hammer':
            p.rect(2, 3, 10, 2, tre);
            p.rect(11, 0, 7, 8, metal);
            p.rect(11, 0, 7, 3, metalLight);
            p.rect(11, 6, 7, 2, shade(metal, -0.3));
            break;
    }
    addCanvas(scene, key, p);
}

// ─── Effekter ───────────────────────────────────────────────────────────────

export function forgeEffects(scene: Phaser.Scene): void {
    // Enkelt lyspunkt til partikler.
    const dot = createPainter(4, 4);
    dot.ellipse(2, 2, 2, 2, '#ffffff');
    addCanvas(scene, 'fx-prikk', dot);

    // Firkant til «piksel-sprut» ved treff.
    const bit = createPainter(3, 3);
    bit.rect(0, 0, 3, 3, '#ffffff');
    addCanvas(scene, 'fx-bit', bit);

    // Slagbuen som blinker når du svinger.
    const slash = createPainter(28, 28);
    for (let a = -50; a <= 50; a += 2) {
        const rad = (a * Math.PI) / 180;
        for (let r = 9; r < 13; r++) {
            const alpha = 1 - (Math.abs(a) / 50) * 0.7;
            slash.px(14 + Math.cos(rad) * r, 14 + Math.sin(rad) * r, `rgba(255,255,255,${alpha})`);
        }
    }
    addCanvas(scene, 'fx-slag', slash);

    // Besvergelses-kule.
    const orb = createPainter(10, 10);
    orb.ellipse(5, 5, 4, 4, 'rgba(255,255,255,0.35)');
    orb.ellipse(5, 5, 3, 3, '#ffffff');
    addCanvas(scene, 'fx-kule', orb);

    // Ring til nova og skjold.
    const ring = createPainter(48, 48);
    for (let a = 0; a < 360; a += 1) {
        const rad = (a * Math.PI) / 180;
        for (let r = 20; r < 23; r++) {
            ring.px(24 + Math.cos(rad) * r, 24 + Math.sin(rad) * r, '#ffffff');
        }
    }
    addCanvas(scene, 'fx-ring', ring);

    // Utropstegn over hodet på en NPC med oppdrag.
    const mark = createPainter(8, 12);
    mark.rect(3, 0, 2, 7, '#ffd166');
    mark.rect(3, 9, 2, 2, '#ffd166');
    addCanvas(scene, 'fx-utrop', mark);

    // Spørsmålstegn - oppdrag du kan levere inn.
    const q = createPainter(8, 12);
    q.rect(2, 0, 4, 2, '#7fd4ff');
    q.rect(5, 2, 2, 2, '#7fd4ff');
    q.rect(3, 4, 3, 2, '#7fd4ff');
    q.rect(3, 6, 2, 1, '#7fd4ff');
    q.rect(3, 9, 2, 2, '#7fd4ff');
    addCanvas(scene, 'fx-sporsmal', q);
}

// ─── Gjenstander på bakken ──────────────────────────────────────────────────

export function forgeLootIcons(scene: Phaser.Scene): void {
    const solv = createPainter(8, 8);
    solv.ellipse(4, 4, 3, 3, '#d9d2b0');
    solv.ellipse(4, 3, 2, 2, '#f2edd0');
    addCanvas(scene, 'loot-solv', solv);

    const kiste = createPainter(14, 12);
    kiste.rect(1, 4, 12, 7, '#6b4a2f');
    kiste.rect(1, 4, 12, 2, '#8a6440');
    kiste.rect(1, 2, 12, 3, '#7a5535');
    kiste.rect(6, 4, 2, 5, '#c9a227');
    addCanvas(scene, 'loot-kiste', kiste);

    const bok = createPainter(10, 10);
    bok.rect(1, 1, 8, 8, '#8a3b3b');
    bok.rect(1, 1, 2, 8, '#5f2626');
    bok.rect(4, 3, 4, 1, '#e8dfc0');
    bok.rect(4, 5, 4, 1, '#e8dfc0');
    addCanvas(scene, 'loot-bok', bok);
}
