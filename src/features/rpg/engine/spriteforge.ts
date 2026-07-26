// Sprite-smia. Her tegnes alle figurer, fiender, våpen og effekter som
// piksel-grafikk rett inn i Phaser-teksturer. Ingen bildefiler.
//
// Menneskefigurene bygges lagvis som en påkledningsdukke: kropp → hår →
// kjortel → rustning → belte. Derfor koster det ingenting å la eleven velge
// hudtone og frisyre, og derfor synes rustningen hun tar på seg med én gang.
//
// Alle rammene til én figur ligger i ÉN tekstur (et rutenett av celler). Det
// gjør at hele figuren tegnes i samme batch, og at det å bytte ramme bare er
// `setFrame(n)` i stedet for et teksturoppslag.

import type Phaser from 'phaser';
import type { AppearanceChoice, EnemyDef, WeaponArt } from '../types';
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from '../data/classes';
import { createPainter, makeRng, numToHex, ramp, type Painter } from './pixels';

export const TILE = 16;

/** Cellen en figurramme tegnes i. 1px luft hele veien rundt til konturen. */
export const CELL_W = 18;
export const CELL_H = 24;
/** Selve figuren er 16x22 og tegnes med 1px forskyvning inn i cellen. */
const FIG_H = 22;
/**
 * Føttene skal stå på samme sted som før cellen ble utvidet, ellers flytter
 * alle figurene seg i forhold til bakken.
 */
export const FIG_ORIGIN_Y = (0.85 * FIG_H + 1) / CELL_H;

export type Dir = 'ned' | 'venstre' | 'hoyre' | 'opp';
export type Positur = 'idle' | 'gang' | 'slag' | 'rull' | 'gard';

/**
 * Rammer per retning. Endres denne, må `START` og `POSITUR_LENGDE` og lista i
 * `forgeHumanoid` endres i samme åndedrag - ellers finnes rammene i typen, men
 * blir aldri tegnet, og garden vises som idle.
 */
const KOLONNER = 14;
const RAD: Record<Dir, number> = { ned: 0, opp: 1, venstre: 2, hoyre: 3 };
const START: Record<Positur, number> = { idle: 0, gang: 2, slag: 6, rull: 9, gard: 12 };
export const POSITUR_LENGDE: Record<Positur, number> = {
    idle: 2,
    gang: 4,
    slag: 3,
    rull: 3,
    gard: 2,
};

/** Rammenummeret for en gitt retning, positur og fase. */
export function heltFrame(dir: Dir, positur: Positur, fase: number): number {
    const n = POSITUR_LENGDE[positur];
    return RAD[dir] * KOLONNER + START[positur] + (((fase % n) + n) % n);
}

export interface HeroLook {
    appearance: AppearanceChoice;
    tunic: string;
    trim: string;
    /** 0 = ingen rustning, 1-3 = stadig tyngre. Styrer plater og hjelm. */
    armorTier: number;
}

/**
 * Én kroppsstilling. Alle tallene er piksler, og alle er små - på 22 piksler
 * høyde er 2 piksler en tydelig bevegelse.
 */
interface Stilling {
    /** Overkroppen opp/ned. Gir pust i ro og vippet i gange. */
    torso: number;
    /** Venstre og høyre ben: 1 = fram, -1 = bak. */
    benV: number;
    benH: number;
    /** Armene svinger motsatt av beina. */
    armV: number;
    armH: number;
    /** Lener seg i den retningen figuren ser. Brukt i slaget. */
    lut: number;
    /** Krøller seg sammen. Brukt i rullen. */
    krup: number;
    /** Den ledende armen strekkes ut i slaget. */
    strekk: number;
}

const RO: Stilling = { torso: 0, benV: 0, benH: 0, armV: 0, armH: 0, lut: 0, krup: 0, strekk: 0 };
const S = (o: Partial<Stilling>): Stilling => ({ ...RO, ...o });

const STILLINGER: Record<Positur, Stilling[]> = {
    // Pust. To rammer, ett piksel - nok til at figuren ikke er en statue.
    idle: [S({}), S({ torso: -1 })],
    // Fire rammer: kontakt, passering, kontakt andre vei, passering.
    gang: [
        S({ benV: 1, benH: -1, armV: -1, armH: 1 }),
        S({ torso: -1, armV: -1, armH: 1 }),
        S({ benV: -1, benH: 1, armV: 1, armH: -1 }),
        S({ torso: -1, armV: 1, armH: -1 }),
    ],
    // Tre rammer: ta sats, treff, hent deg inn.
    slag: [
        S({ lut: -2, armV: -1, armH: -1, torso: 1 }),
        S({ lut: 3, armV: 1, armH: 1, strekk: 2, torso: -1 }),
        S({ lut: 1, armV: 0, armH: 0, torso: 0 }),
    ],
    // Tre rammer der figuren krøller seg mer og mer sammen.
    rull: [S({ krup: 2, torso: 2 }), S({ krup: 4, torso: 4 }), S({ krup: 2, torso: 2 })],
    // Gard: skjoldarmen opp og inn, kroppen bak den, vekten litt tilbake. Andre
    // ramma er den presset - den vises i det øyeblikket noe treffer skjoldet.
    gard: [
        S({ lut: -1, armV: 2, armH: -1, torso: -1, krup: 1 }),
        S({ lut: -2, armV: 3, armH: -1, torso: -1, krup: 2 }),
    ],
};

function addSheet(
    scene: Phaser.Scene,
    key: string,
    canvas: HTMLCanvasElement,
    cellW: number,
    cellH: number,
    kolonner: number,
    rader: number
): void {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const texture = scene.textures.createCanvas(key, canvas.width, canvas.height);
    if (!texture) return;
    texture.context.drawImage(canvas, 0, 0);
    texture.refresh();
    for (let r = 0; r < rader; r++) {
        for (let c = 0; c < kolonner; c++) {
            texture.add(r * kolonner + c, 0, c * cellW, r * cellH, cellW, cellH);
        }
    }
}

function addCanvas(scene: Phaser.Scene, key: string, painter: { canvas: HTMLCanvasElement }): void {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const texture = scene.textures.createCanvas(key, painter.canvas.width, painter.canvas.height);
    if (!texture) return;
    texture.context.drawImage(painter.canvas, 0, 0);
    texture.refresh();
}

// ─── Menneskefigur ──────────────────────────────────────────────────────────

function drawHumanoid(p: Painter, dir: Dir, st: Stilling, look: HeroLook, hair: string, skin: string): void {
    const tunic = look.tunic;
    const trim = look.trim;
    const bukse = '#4a3b2c';
    const sko = '#2e2419';

    const bakFra = dir === 'opp';
    const side = dir === 'venstre' || dir === 'hoyre';
    // Sidevendte figurer lener seg vannrett, front/bak lener seg loddrett.
    const lutX = side ? -st.lut : 0;
    const lutY = side ? 0 : st.lut * 0.5;
    const ty = st.torso + lutY;

    // ── Bein ────────────────────────────────────────────────────────────────
    // Fremre ben står fullt ut, bakre ben er kortere og litt høyere. Det er
    // hele skrittet: to piksler forskjell, men det leser som gange.
    const ben = (x: number, fase: number, farge: string) => {
        const bak = fase < 0;
        const y = 16 + st.krup + (bak ? 1 : 0);
        const h = Math.max(1, 4 - st.krup - (bak ? 1 : 0));
        const dx = side ? fase : 0;
        p.rect(x + dx, y, 3, h, farge);
        p.rect(x + dx, y + h - 1, 3, 1, sko);
    };
    ben(5, st.benV, bukse);
    ben(8, st.benH, ramp(bukse, -1));

    // ── Kjortel ─────────────────────────────────────────────────────────────
    const kroppY = 9 + ty + st.krup;
    const kroppH = Math.max(4, 8 - st.krup);
    p.rect(4 + lutX, kroppY, 8, kroppH, tunic);
    // Lyskilden står til venstre: lys kant, kjerne, skyggeside.
    p.vline(4 + lutX, kroppY, kroppH, ramp(tunic, 1));
    p.rect(10 + lutX, kroppY, 2, kroppH, ramp(tunic, -1));
    p.rect(11 + lutX, kroppY, 1, kroppH, ramp(tunic, -2));
    p.hline(4 + lutX, kroppY + kroppH - 1, 8, ramp(tunic, -2));

    // Belte
    const belteY = kroppY + kroppH - 3;
    p.rect(4 + lutX, belteY, 8, 1, ramp(trim, -2));
    p.px(7 + lutX, belteY, trim);

    // ── Armer ───────────────────────────────────────────────────────────────
    const arm = (x: number, fase: number, farge: string, hud: string, leder: boolean) => {
        const dx = (side ? fase : 0) + lutX + (leder ? st.strekk * (dir === 'venstre' ? -1 : 1) : 0);
        const y = 10 + ty + fase + st.krup;
        const h = Math.max(2, 5 - st.krup);
        p.rect(x + dx, y, 2, h, farge);
        // Mansjett, så hånden ikke ser ut som en løs klump ved beltet.
        p.hline(x + dx, y + h - 1, 2, ramp(farge, -2));
        p.rect(x + dx, y + h, 2, 2, hud);
        p.px(x + dx + 1, y + h + 1, ramp(hud, -1));
    };
    arm(3, st.armV, tunic, skin, dir === 'venstre');
    arm(11, st.armH, ramp(tunic, -1), ramp(skin, -1), dir === 'hoyre' || dir === 'ned');

    // ── Rustning oppå kjortelen ─────────────────────────────────────────────
    if (look.armorTier >= 1) {
        const plate = look.armorTier >= 3 ? '#c8cdd6' : look.armorTier === 2 ? '#9aa3ae' : '#7a6a52';
        p.rect(4 + lutX, kroppY, 8, Math.min(4, kroppH), plate);
        p.vline(4 + lutX, kroppY, Math.min(4, kroppH), ramp(plate, 1));
        p.rect(10 + lutX, kroppY, 2, Math.min(4, kroppH), ramp(plate, -1));
        p.hline(4 + lutX, kroppY + Math.min(4, kroppH) - 1, 8, ramp(plate, -2));
        if (look.armorTier >= 2) {
            p.rect(3 + lutX, kroppY, 2, 2, ramp(plate, 1));
            p.rect(11 + lutX, kroppY, 2, 2, ramp(plate, -1));
        }
    }

    // ── Hode ────────────────────────────────────────────────────────────────
    const hodeY = 3 + ty + Math.min(2, st.krup);
    const hx = lutX;
    // Hodet er en kule, ikke en boks: øverste og nederste rad er smalere, så
    // hjørnene forsvinner. Det er det som gjør at et 6px hode leser som rundt.
    p.rect(6 + hx, hodeY, 4, 1, skin);
    p.rect(5 + hx, hodeY + 1, 6, 4, skin);
    p.rect(6 + hx, hodeY + 5, 4, 1, skin);
    p.vline(5 + hx, hodeY + 1, 4, ramp(skin, 1));
    p.px(6 + hx, hodeY, ramp(skin, 1));
    p.rect(9 + hx, hodeY + 1, 2, 4, ramp(skin, -1));
    p.px(9 + hx, hodeY + 5, ramp(skin, -2));
    // Nakkeskygge, så hodet sitter på kroppen i stedet for å sveve.
    p.rect(5 + hx, hodeY + 6, 6, 1, ramp(skin, -2));

    // ── Ansikt ──────────────────────────────────────────────────────────────
    if (!bakFra) {
        const eye = '#241a12';
        const munn = ramp(skin, -2);
        if (side) {
            p.px(9 + hx, hodeY + 3, eye);
            p.px(9 + hx, hodeY + 5, munn);
        } else {
            p.px(6 + hx, hodeY + 3, eye);
            p.px(9 + hx, hodeY + 3, eye);
            const face = look.appearance.face;
            // Alle uttrykk har munn. Uten munn ser figuren tom ut.
            if (face === 0) p.hline(7 + hx, hodeY + 5, 2, munn);
            if (face === 1) {
                p.hline(7 + hx, hodeY + 5, 2, munn);
                p.px(6 + hx, hodeY + 2, munn);
                p.px(9 + hx, hodeY + 2, munn);
            }
            if (face === 2) {
                p.px(6 + hx, hodeY + 5, munn);
                p.px(9 + hx, hodeY + 5, munn);
                p.hline(7 + hx, hodeY + 6, 2, munn);
            }
            if (face === 3) {
                p.hline(7 + hx, hodeY + 5, 2, munn);
                p.px(6 + hx, hodeY + 2, munn);
            }
        }
    }

    // ── Hår ─────────────────────────────────────────────────────────────────
    drawHair(p, HAIR_STYLES[look.appearance.hair % HAIR_STYLES.length], hair, dir, hodeY, hx);

    // ── Hjelm ───────────────────────────────────────────────────────────────
    if (look.armorTier >= 3) {
        const helm = '#c8cdd6';
        p.rect(4 + hx, hodeY - 1, 8, 3, helm);
        p.hline(4 + hx, hodeY - 1, 8, ramp(helm, 1));
        p.rect(10 + hx, hodeY - 1, 2, 3, ramp(helm, -1));
        if (!bakFra) p.vline(8 + hx, hodeY + 1, 3, ramp(helm, -2));
    }
}

function drawHair(p: Painter, style: string, color: string, dir: Dir, hodeY: number, hx: number): void {
    const lys = ramp(color, 1);
    const mork = ramp(color, -1);
    const bak = dir === 'opp';
    const y = hodeY - 1;
    switch (style) {
        case 'kort':
            p.rect(5 + hx, y, 6, 2, color);
            p.hline(5 + hx, y, 6, lys);
            p.px(4 + hx, y + 1, color);
            p.px(11 + hx, y + 1, mork);
            break;
        case 'flette':
            p.rect(5 + hx, y, 6, 2, color);
            p.hline(5 + hx, y, 5, lys);
            p.rect(4 + hx, y + 1, 1, 4, color);
            p.rect(11 + hx, y + 1, 1, 4, mork);
            p.rect(11 + hx, y + 5, 1, 3, mork);
            break;
        case 'topplue':
            p.rect(5 + hx, y - 1, 6, 3, color);
            p.hline(5 + hx, y - 1, 5, lys);
            p.rect(4 + hx, y + 1, 8, 1, mork);
            p.px(8 + hx, y - 2, lys);
            break;
        case 'langt':
            p.rect(5 + hx, y, 6, 2, color);
            p.hline(5 + hx, y, 5, lys);
            p.rect(4 + hx, y + 1, 1, 8, color);
            p.rect(11 + hx, y + 1, 1, 8, mork);
            if (bak) {
                p.rect(5 + hx, y + 1, 6, 7, color);
                p.vline(5 + hx, y + 1, 7, lys);
            }
            break;
        case 'skallet':
            p.rect(5 + hx, y, 6, 1, ramp(color, 1));
            break;
        case 'hestehale':
            p.rect(5 + hx, y, 6, 2, color);
            p.hline(5 + hx, y, 5, lys);
            p.rect(11 + hx, y + 1, 1, 2, mork);
            p.rect(12 + hx, y + 2, 1, 5, mork);
            break;
    }
}

/**
 * Tegner alle 56 rammene til en figur inn i én tekstur.
 * Rader = retning (ned, opp, venstre, høyre), kolonner = positur.
 */
export function forgeHumanoid(scene: Phaser.Scene, key: string, look: HeroLook): void {
    const skin = SKIN_TONES[look.appearance.skin % SKIN_TONES.length];
    const hair = HAIR_COLORS[look.appearance.hairColor % HAIR_COLORS.length];
    const rader = 4;

    const ark = createPainter(CELL_W * KOLONNER, CELL_H * rader);
    const retninger: Dir[] = ['ned', 'opp', 'venstre', 'hoyre'];

    retninger.forEach((dir, r) => {
        // Høyre er venstre speilvendt, så den tegnes i en egen celle og snus.
        const tegnDir: Dir = dir === 'hoyre' ? 'venstre' : dir;
        let kol = 0;
        (['idle', 'gang', 'slag', 'rull', 'gard'] as Positur[]).forEach((positur) => {
            for (const st of STILLINGER[positur]) {
                const celle = createPainter(CELL_W, CELL_H, 1, 1);
                drawHumanoid(celle, tegnDir, st, look, hair, skin);
                celle.outline();
                // Bakkeskyggen legges under alt annet, utenfor konturen.
                celle.behind(() => celle.ellipse(8, 20 + st.krup, 5, 2, 'rgba(0,0,0,0.3)'));
                if (dir === 'hoyre') celle.mirror();
                ark.ctx.drawImage(celle.canvas, kol * CELL_W, r * CELL_H);
                kol++;
            }
        });
    });

    addSheet(scene, key, ark.canvas, CELL_W, CELL_H, KOLONNER, rader);
}

/** Ett stillbilde av figuren, til bruk i karakterskaperen. */
export function renderHeroPortrait(look: HeroLook, scale = 6): string {
    const skin = SKIN_TONES[look.appearance.skin % SKIN_TONES.length];
    const hair = HAIR_COLORS[look.appearance.hairColor % HAIR_COLORS.length];
    const p = createPainter(CELL_W, CELL_H, 1, 1);
    drawHumanoid(p, 'ned', RO, look, hair, skin);
    p.outline();
    p.behind(() => p.ellipse(8, 20, 5, 2, 'rgba(0,0,0,0.3)'));

    const out = document.createElement('canvas');
    out.width = CELL_W * scale;
    out.height = CELL_H * scale;
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(p.canvas, 0, 0, out.width, out.height);
    return out.toDataURL();
}

// ─── Fiender ────────────────────────────────────────────────────────────────

/** Fiendene har fire ekte rammer. Tidligere var to av tre identiske. */
export const FIENDE_RAMMER = 4;

function drawEnemy(p: Painter, def: EnemyDef, frame: number): void {
    const base = numToHex(def.farge);
    const lys = ramp(base, 1);
    const lysere = ramp(base, 2);
    const mork = ramp(base, -1);
    const morkere = ramp(base, -2);
    // Fire rammer som alle er forskjellige - en rolig pust opp og ned.
    const bob = [0, -1, 0, 1][frame];
    const cx = p.w / 2;
    const cy = p.h / 2;

    switch (def.kind) {
        case 'glemsel': {
            // En tåkeklump med hull i. Formen «eter» seg selv.
            p.ellipse(cx, cy + bob, p.w * 0.38, p.h * 0.3, base);
            p.ellipse(cx - 2, cy - 2 + bob, p.w * 0.24, p.h * 0.18, lys);
            p.ellipse(cx - 3, cy - 3 + bob, p.w * 0.12, p.h * 0.08, lysere);
            p.ellipse(cx + 3 - frame * 0.5, cy + 2 + bob, 2, 2, morkere);
            p.px(cx - 3, cy + bob, '#ffffff');
            p.px(cx + 2, cy - 1 + bob, '#ffffff');
            break;
        }
        case 'paastand': {
            // Skarp, kantete skikkelse - en påstand som stikker.
            p.rect(cx - 5, cy - 4 + bob, 10, 9, base);
            p.vline(cx - 5, cy - 4 + bob, 9, lys);
            p.rect(cx + 1, cy - 4 + bob, 4, 9, mork);
            p.vline(cx + 4, cy - 4 + bob, 9, morkere);
            p.rect(cx - 6, cy - 6 + bob - (frame % 2), 3, 4, lys);
            p.rect(cx + 3, cy - 6 + bob + (frame % 2), 3, 4, lys);
            p.px(cx - 3, cy - 1 + bob, '#ffe9a8');
            p.px(cx + 2, cy - 1 + bob, '#ffe9a8');
            p.hline(cx - 3, cy + 3 + bob, 6, morkere);
            break;
        }
        case 'anakronisme': {
            // Firkantet og «feil» - med visere som går hver sin vei.
            p.rect(cx - 5, cy - 5 + bob, 10, 10, base);
            p.vline(cx - 5, cy - 5 + bob, 10, lys);
            p.rect(cx + 1, cy - 5 + bob, 4, 10, mork);
            p.rect(cx - 3, cy - 3 + bob, 6, 6, lys);
            p.rect(cx - 3, cy - 3 + bob, 6, 1, lysere);
            p.vline(cx, cy - 3 + bob, 3 - (frame % 3), '#241a12');
            p.hline(cx, cy + bob, 1 + (frame % 3), '#241a12');
            break;
        }
        case 'rykte': {
            // Et spøkelse med altfor stor munn.
            p.ellipse(cx, cy - 1 + bob, p.w * 0.3, p.h * 0.26, base);
            p.ellipse(cx - 2, cy - 3 + bob, p.w * 0.14, p.h * 0.1, lys);
            p.rect(cx - 4, cy + bob, 8, 5, base);
            p.vline(cx + 3, cy + bob, 5, mork);
            for (let i = 0; i < 4; i++) {
                p.px(cx - 4 + i * 2 + (frame % 2), cy + 5 + bob, base);
                p.px(cx - 4 + i * 2 + (frame % 2), cy + 6 + bob, mork);
            }
            p.px(cx - 2, cy - 2 + bob, '#ffffff');
            p.px(cx + 1, cy - 2 + bob, '#ffffff');
            p.ellipse(cx, cy + 2 + bob, 2, 1 + (frame % 2), '#1a1420');
            break;
        }
        case 'vrangbilde': {
            // En vridd speilbilde-skikkelse.
            const vri = [0, 1, 0, -1][frame];
            p.rect(cx - 5 + vri, cy - 6 + bob, 10, 12, base);
            p.vline(cx - 5 + vri, cy - 6 + bob, 12, lys);
            p.rect(cx + 1 + vri, cy - 6 + bob, 4, 12, mork);
            p.rect(cx - 6, cy - 8 + bob, 12, 3, lys);
            p.hline(cx - 6, cy - 8 + bob, 12, lysere);
            p.px(cx - 3 + vri, cy - 3 + bob, '#ff6b6b');
            p.px(cx + 2 + vri, cy - 3 + bob, '#ff6b6b');
            p.hline(cx - 4, cy + 2 + bob, 8, morkere);
            break;
        }
        case 'boss': {
            // Stor tåkemasse med mange øyne. Øynene blunker i utakt.
            p.ellipse(cx, cy + bob, p.w * 0.42, p.h * 0.36, morkere);
            p.ellipse(cx, cy - 2 + bob, p.w * 0.36, p.h * 0.28, base);
            p.ellipse(cx - 4, cy - 4 + bob, p.w * 0.18, p.h * 0.12, lys);
            p.ellipse(cx - 5, cy - 5 + bob, p.w * 0.08, p.h * 0.05, lysere);
            const eyes: [number, number][] = [
                [-6, -3],
                [-1, -5],
                [4, -2],
                [-3, 2],
                [5, 3],
            ];
            eyes.forEach(([ex, ey], i) => {
                if ((i + frame) % 4 === 3) return;
                p.px(cx + ex, cy + ey + bob, '#fff3c4');
                p.px(cx + ex, cy + ey + 1 + bob, '#c9a227');
            });
            break;
        }
    }
}

export function forgeEnemy(scene: Phaser.Scene, def: EnemyDef): void {
    const scale = def.storrelse ?? 1;
    const w = Math.round(20 * scale);
    const h = Math.round(20 * scale);
    const ark = createPainter(w * FIENDE_RAMMER, h);
    for (let frame = 0; frame < FIENDE_RAMMER; frame++) {
        const celle = createPainter(w, h);
        drawEnemy(celle, def, frame);
        celle.outline();
        celle.behind(() => celle.ellipse(w / 2, h - 3, w * 0.28, 2, 'rgba(0,0,0,0.32)'));
        ark.ctx.drawImage(celle.canvas, frame * w, 0);
    }
    addSheet(scene, `fiende-${def.id}`, ark.canvas, w, h, FIENDE_RAMMER, 1);
    forgeLosdeler(scene, def);
    forgeLik(scene, def);
}

// ─── Løsdeler og lik ────────────────────────────────────────────────────────
// Lemlestelse og avslutninger trenger biter som kan spinne av og bli liggende.
// De tegnes i fiendens egen farge, så en ny fiende får sine egne rester uten at
// noen må tegne noe: samme prinsipp som at rustningen synes med én gang.

/** Antall former i løsdel-arket. Hver bit er sin egen ramme. */
export const LOSDEL_RAMMER = 6;

function forgeLosdeler(scene: Phaser.Scene, def: EnemyDef): void {
    const base = numToHex(def.farge);
    const lys = ramp(base, 1);
    const mork = ramp(base, -2);
    const S = 8;
    const ark = createPainter(S * LOSDEL_RAMMER, S);
    // Seedet på id-en, så samme fiende alltid faller i samme biter. En fiende som
    // sprekker ulikt hver gang leser som støy.
    const rng = makeRng([...def.id].reduce((a, c) => a + c.charCodeAt(0), 7));

    for (let i = 0; i < LOSDEL_RAMMER; i++) {
        const c = createPainter(S, S, 1, 1);
        // De to første er store flak, resten er småbiter. Da kan en avslutning
        // velge tyngde: øksa river av flak, hammeren lager grus.
        const r = i < 2 ? 3 : i < 4 ? 2 : 1.4;
        const kjerne = i % 2 === 0 ? base : mork;
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const d = Math.hypot(x - 3.5, y - 3.5);
                if (d > r + rng() * 0.9) continue;
                c.px(x, y, d < r * 0.5 ? lys : kjerne);
            }
        }
        // Bare de store flakene får kontur. Med kontur på småbitene leser de som
        // fasetterte krystaller i stedet for som noe som ble revet av.
        if (i < 2) c.outline();
        ark.ctx.drawImage(c.canvas, i * S, 0);
    }
    addSheet(scene, `losdel-${def.id}`, ark.canvas, S, S, LOSDEL_RAMMER, 1);
}

/**
 * Liket som blir liggende. Det er ikke fienden med lav alpha - det er en flat,
 * mørknet form som leser som «her lå det noe» også etter at eleven har gått
 * videre. Et slagmark uten rester føles som en skytebane.
 */
function forgeLik(scene: Phaser.Scene, def: EnemyDef): void {
    const scale = def.storrelse ?? 1;
    const w = Math.round(20 * scale);
    const h = Math.round(12 * scale);
    const p = createPainter(w, h, 1, 1);
    const base = ramp(numToHex(def.farge), -2);
    const mork = ramp(numToHex(def.farge), -3);
    const rng = makeRng([...def.id].reduce((a, c) => a + c.charCodeAt(0), 31));

    // En sammensunket haug, bredere enn høy, med ujevn kant.
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dx = (x - w / 2) / (w * 0.42);
            const dy = (y - h * 0.62) / (h * 0.34);
            if (dx * dx + dy * dy > 1 + rng() * 0.25) continue;
            p.px(x, y, y > h * 0.62 ? mork : base);
        }
    }
    p.outline();
    addCanvas(scene, `lik-${def.id}`, p);
}

// ─── Våpen ──────────────────────────────────────────────────────────────────
// Våpenet er en egen sprite som roteres i slagbuen. Det gir et mye bedre slag
// enn å bake våpenet inn i figuren.

export function forgeWeapon(scene: Phaser.Scene, art: WeaponArt, tint: string): void {
    const key = `vapen-${art}`;
    const p = createPainter(22, 10, 1, 1);
    const metal = tint;
    const metalLys = ramp(metal, 2);
    const tre = '#6b4a2f';

    switch (art) {
        case 'sverd':
            p.rect(2, 3, 4, 2, tre);
            p.rect(6, 2, 1, 4, '#c9a227');
            p.rect(7, 3, 11, 2, metal);
            p.hline(7, 3, 11, metalLys);
            p.px(18, 4, metal);
            break;
        case 'oks':
            p.rect(2, 3, 11, 2, tre);
            p.rect(12, 1, 5, 6, metal);
            p.rect(12, 1, 5, 2, metalLys);
            p.px(17, 3, metal);
            p.px(17, 4, metal);
            break;
        case 'stav':
            p.rect(1, 3, 15, 2, tre);
            p.ellipse(17, 4, 2, 3, metal);
            p.px(17, 3, metalLys);
            break;
        case 'spyd':
            p.rect(1, 3, 14, 2, tre);
            p.rect(15, 2, 3, 4, metal);
            p.rect(18, 3, 2, 2, metal);
            p.hline(15, 3, 3, metalLys);
            break;
        case 'hammer':
            p.rect(2, 3, 10, 2, tre);
            p.rect(11, 0, 7, 8, metal);
            p.rect(11, 0, 7, 3, metalLys);
            p.rect(11, 6, 7, 2, ramp(metal, -2));
            break;
    }
    p.outline();
    addCanvas(scene, key, p);
}

// ─── Skjold ─────────────────────────────────────────────────────────────────
// Skjoldet er et eget sprite-lag, ikke bakt inn i helte-arket. Grunnen er
// slitasjen: den skal synes før bruddet, og med fire slitasjetrinn i en egen
// tekstur koster det fire små celler i stedet for 56 nye figurrammer.

/** Helt, hakket, halvveis, nesten borte. */
export const SKJOLD_RAMMER = 4;

export function forgeSkjold(scene: Phaser.Scene, maling = '#8b2f4a'): void {
    const W = 15;
    const H = 15;
    const R = 6.4;
    const ark = createPainter(W * SKJOLD_RAMMER, H);
    const tre = '#c9a86a';
    const treMork = ramp(tre, -2);
    const jern = '#9aa3ad';
    const jernLys = ramp(jern, 2);

    // Hakkene sitter på faste vinkler. De skal *ikke* være tilfeldige per
    // spillomgang: eleven skal kjenne igjen et halvt oppbrukt skjold.
    const hakkVinkler = [-38, 142, 74, -108, 20, -160, 108, 250];

    for (let f = 0; f < SKJOLD_RAMMER; f++) {
        const c = createPainter(W, H, 1, 1);

        for (let y = 0; y < 14; y++) {
            for (let x = 0; x < 14; x++) {
                const dx = x - 6.5;
                const dy = y - 6.5;
                const d = Math.hypot(dx, dy);
                if (d > R) continue;
                let farge: string;
                if (d > R - 1.1) farge = jern; // jernkanten
                else if (d < 2.1) farge = d < 1.2 ? jernLys : jern; // skjoldbulen
                else if (dy < -0.5 && dx > -0.5) farge = maling; // malt felt
                else farge = x % 3 === 0 ? treMork : tre; // bordene
                c.px(x, y, farge);
            }
        }

        // Slitasjen: hvert trinn biter to hakk av kanten, og fra trinn to går det
        // en sprekk innover. Fjernes pikslene før konturen legges, får hakket
        // sin egen mørke kant og leser som skade i stedet for som støy.
        const hakk = f * 2;
        for (let i = 0; i < hakk; i++) {
            const rad = (hakkVinkler[i % hakkVinkler.length] * Math.PI) / 180;
            for (let r = R - 2.2; r <= R; r += 0.6) {
                for (let s = -0.5; s <= 0.5; s += 0.5) {
                    c.ctx.clearRect(
                        Math.round(6.5 + Math.cos(rad + s * 0.16) * r),
                        Math.round(6.5 + Math.sin(rad + s * 0.16) * r),
                        1,
                        1
                    );
                }
            }
        }
        if (f >= 2) {
            const rad = (hakkVinkler[0] * Math.PI) / 180;
            for (let r = 2.2; r <= R; r += 0.5) {
                c.px(6.5 + Math.cos(rad) * r, 6.5 + Math.sin(rad) * r, '#3a2a18');
            }
        }

        c.outline();
        ark.ctx.drawImage(c.canvas, f * W, 0);
    }

    addSheet(scene, 'skjold', ark.canvas, W, H, SKJOLD_RAMMER, 1);

    // Treflisen som spretter av kanten når skjoldet tar imot.
    const flis = createPainter(3, 2);
    flis.rect(0, 0, 3, 2, tre);
    addCanvas(scene, 'fx-flis', flis);
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

    // Blodflekker. Fire ujevne små former i stedet for én firkant: skalerte
    // firkanter leser som spredte murstein, ikke som blod.
    const FW = 5;
    const flekkRng = makeRng(1066);
    const flekkArk = createPainter(FW * 4, 4);
    for (let f = 0; f < 4; f++) {
        const c = createPainter(FW, 4, 1, 1);
        // Én kjerne og noen få sprut rundt, alltid asymmetrisk.
        c.rect(1, 1, 2, 2, '#ffffff');
        for (let i = 0; i < 4; i++) {
            c.px(Math.floor(flekkRng() * FW), Math.floor(flekkRng() * 4), '#ffffff');
        }
        flekkArk.ctx.drawImage(c.canvas, f * FW, 0);
    }
    addSheet(scene, 'fx-flekk', flekkArk.canvas, FW, 4, 4, 1);

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
    const mark = createPainter(10, 14, 1, 1);
    mark.rect(3, 0, 2, 7, '#ffd166');
    mark.rect(3, 9, 2, 2, '#ffd166');
    mark.outline();
    addCanvas(scene, 'fx-utrop', mark);

    // Spørsmålstegn - oppdrag du kan levere inn.
    const q = createPainter(10, 14, 1, 1);
    q.rect(2, 0, 4, 2, '#7fd4ff');
    q.rect(5, 2, 2, 2, '#7fd4ff');
    q.rect(3, 4, 3, 2, '#7fd4ff');
    q.rect(3, 6, 2, 1, '#7fd4ff');
    q.rect(3, 9, 2, 2, '#7fd4ff');
    q.outline();
    addCanvas(scene, 'fx-sporsmal', q);

    // Myk tåkeflekk. Brukes både til drivende tåke og til bosskampen.
    const taake = createPainter(64, 64);
    const tctx = taake.ctx;
    const grad = tctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.22)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    tctx.fillStyle = grad;
    tctx.fillRect(0, 0, 64, 64);
    addCanvas(scene, 'fx-taake', taake);

    // Mykt lys - bål, besvergelser og alt annet som skal gløde.
    const glo = createPainter(64, 64);
    const gctx = glo.ctx;
    const g2 = gctx.createRadialGradient(32, 32, 1, 32, 32, 31);
    g2.addColorStop(0, 'rgba(255,255,255,0.95)');
    g2.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    g2.addColorStop(1, 'rgba(255,255,255,0)');
    gctx.fillStyle = g2;
    gctx.fillRect(0, 0, 64, 64);
    addCanvas(scene, 'fx-glo', glo);
}

// ─── Tall til flytende skadetekst ───────────────────────────────────────────
// Skadetallene ble før tegnet med vektorfont og skalert 3x av kameraet. Det ga
// uskarp tekst i en pikselartscene, og en ny GL-teksturopplasting per tall.
// Her lages sifrene én gang som ett lite pikselfont-ark.

// Fonten hadde bare sifre, X og P. Alt annet falt tilbake på mellomrom, så
// «Skjold!» og «Beskyttet!» har hele tiden rendret som nesten blanke bobler.
// Hele alfabetet ligger her nå - kampen sier «Parade!» og «Skjoldet brast!», og
// de ordene er halve belønningen.
const SIFFER = '0123456789+-!.,?:ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ ';
const GLYF_W = 4;
const GLYF_H = 6;
const GLYFER: Record<string, string[]> = {
    '0': ['111', '101', '101', '101', '111', '000'],
    '1': ['010', '110', '010', '010', '111', '000'],
    '2': ['111', '001', '111', '100', '111', '000'],
    '3': ['111', '001', '111', '001', '111', '000'],
    '4': ['101', '101', '111', '001', '001', '000'],
    '5': ['111', '100', '111', '001', '111', '000'],
    '6': ['111', '100', '111', '101', '111', '000'],
    '7': ['111', '001', '010', '010', '010', '000'],
    '8': ['111', '101', '111', '101', '111', '000'],
    '9': ['111', '101', '111', '001', '111', '000'],
    '+': ['000', '010', '111', '010', '000', '000'],
    '-': ['000', '000', '111', '000', '000', '000'],
    '!': ['010', '010', '010', '000', '010', '000'],
    '.': ['000', '000', '000', '000', '010', '000'],
    ',': ['000', '000', '000', '010', '010', '000'],
    '?': ['111', '001', '011', '000', '010', '000'],
    ':': ['000', '010', '000', '010', '000', '000'],
    A: ['111', '101', '111', '101', '101', '000'],
    B: ['110', '101', '110', '101', '110', '000'],
    C: ['111', '100', '100', '100', '111', '000'],
    D: ['110', '101', '101', '101', '110', '000'],
    E: ['111', '100', '111', '100', '111', '000'],
    F: ['111', '100', '111', '100', '100', '000'],
    G: ['111', '100', '101', '101', '111', '000'],
    H: ['101', '101', '111', '101', '101', '000'],
    I: ['111', '010', '010', '010', '111', '000'],
    J: ['001', '001', '001', '101', '111', '000'],
    K: ['101', '101', '110', '101', '101', '000'],
    L: ['100', '100', '100', '100', '111', '000'],
    M: ['101', '111', '111', '101', '101', '000'],
    N: ['110', '101', '101', '101', '101', '000'],
    O: ['111', '101', '101', '101', '111', '000'],
    P: ['110', '101', '110', '100', '100', '000'],
    Q: ['111', '101', '101', '111', '001', '000'],
    R: ['111', '101', '110', '101', '101', '000'],
    S: ['111', '100', '111', '001', '111', '000'],
    T: ['111', '010', '010', '010', '010', '000'],
    U: ['101', '101', '101', '101', '111', '000'],
    V: ['101', '101', '101', '101', '010', '000'],
    W: ['101', '101', '111', '111', '101', '000'],
    X: ['101', '101', '010', '101', '101', '000'],
    Y: ['101', '101', '010', '010', '010', '000'],
    Z: ['111', '001', '010', '100', '111', '000'],
    Æ: ['011', '101', '111', '101', '101', '000'],
    Ø: ['011', '101', '111', '101', '110', '000'],
    Å: ['010', '111', '101', '111', '101', '000'],
    ' ': ['000', '000', '000', '000', '000', '000'],
};

export function forgeTallfont(scene: Phaser.Scene): void {
    const p = createPainter(GLYF_W * SIFFER.length, GLYF_H);
    [...SIFFER].forEach((tegn, i) => {
        const rader = GLYFER[tegn] ?? GLYFER[' '];
        rader.forEach((rad, y) => {
            [...rad].forEach((c, x) => {
                if (c === '1') p.px(i * GLYF_W + x, y, '#ffffff');
            });
        });
    });
    addSheet(scene, 'font-tall', p.canvas, GLYF_W, GLYF_H, SIFFER.length, 1);
}

/**
 * Rammenummeret til ett tegn i pikselfonten. Fonten har bare store bokstaver, så
 * små bokstaver løftes - ellers ville «Parade!» blitt «P!».
 */
export function glyfIndex(tegn: string): number {
    const i = SIFFER.indexOf(tegn.toUpperCase());
    return i >= 0 ? i : SIFFER.length - 1;
}

export const GLYF = { w: GLYF_W, h: GLYF_H };

// ─── Gjenstander på bakken ──────────────────────────────────────────────────

export function forgeLootIcons(scene: Phaser.Scene): void {
    const solv = createPainter(10, 10, 1, 1);
    solv.ellipse(4, 4, 3, 3, '#d9d2b0');
    solv.ellipse(4, 3, 2, 2, '#f2edd0');
    solv.outline();
    addCanvas(scene, 'loot-solv', solv);

    const kiste = createPainter(16, 14, 1, 1);
    kiste.rect(1, 4, 12, 7, '#6b4a2f');
    kiste.rect(1, 4, 12, 2, '#8a6440');
    kiste.rect(1, 2, 12, 3, '#7a5535');
    kiste.hline(1, 2, 12, ramp('#7a5535', 1));
    kiste.rect(6, 4, 2, 5, '#c9a227');
    kiste.outline();
    addCanvas(scene, 'loot-kiste', kiste);

    const bok = createPainter(12, 12, 1, 1);
    bok.rect(1, 1, 8, 8, '#8a3b3b');
    bok.rect(1, 1, 2, 8, '#5f2626');
    bok.rect(4, 3, 4, 1, '#e8dfc0');
    bok.rect(4, 5, 4, 1, '#e8dfc0');
    bok.outline();
    addCanvas(scene, 'loot-bok', bok);
}
