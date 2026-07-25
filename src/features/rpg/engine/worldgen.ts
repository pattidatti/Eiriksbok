// Bygger kartet for Nordvik. Grunnformen er håndlagt (fjorden i vest, bygda i
// midten, tingplassen i øst, gravhaugen lengst ute), mens gress, skog og
// steiner strøs ut med en seedet generator - så kartet ser levende ut, men er
// helt likt hver gang eleven kommer tilbake.

import { NORDVIK_SIZE } from '../data/nordvik';
import { makeRng } from './pixels';
import type { TileKey } from './tileforge';

export interface PropPlacement {
    kind: 'tre' | 'busk' | 'stein' | 'langhus' | 'bu' | 'naust' | 'gjerde' | 'langskip' | 'kai';
    /** Piksler, ikke ruter. */
    x: number;
    y: number;
    solid: boolean;
    /** Kollisjonsboks i piksler, sentrert på foten av objektet. */
    treff?: { w: number; h: number; dy: number };
}

export interface WorldMap {
    bredde: number;
    hoyde: number;
    terreng: TileKey[][];
    /** true = kan ikke gås gjennom. */
    blokkert: boolean[][];
    props: PropPlacement[];
    /** Der fiender får lov å dukke opp. */
    spawnRuter: [number, number][];
    /** Bossens arena. */
    bossArena: { x: number; y: number; r: number };
}

const { bredde: W, hoyde: H } = NORDVIK_SIZE;

const VANN_GRENSE = 6;
const SAND_GRENSE = 8;

export function byggNordvik(): WorldMap {
    const rng = makeRng(1793);
    const terreng: TileKey[][] = [];
    const blokkert: boolean[][] = [];

    for (let y = 0; y < H; y++) {
        terreng[y] = [];
        blokkert[y] = [];
        for (let x = 0; x < W; x++) {
            let flis: TileKey = 'gress';
            // Fjorden bukter seg litt, så kystlinjen ikke blir en strek.
            const bukt = Math.sin(y * 0.28) * 1.8 + Math.sin(y * 0.11) * 1.2;
            const vannKant = VANN_GRENSE + bukt;
            const sandKant = SAND_GRENSE + bukt;

            if (x < vannKant) {
                flis = 'vann';
            } else if (x < sandKant) {
                flis = 'sand';
            } else {
                const r = rng();
                flis = r > 0.82 ? 'gress-3' : r > 0.55 ? 'gress-2' : 'gress';
            }
            terreng[y][x] = flis;
            blokkert[y][x] = flis === 'vann';
        }
    }

    // ── Fjellene i nord og øst rammer inn sonen ─────────────────────────────
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const nordFjell = y < 3 + Math.sin(x * 0.3) * 1.5;
            const sorFjell = y > H - 4 + Math.sin(x * 0.24) * 1.5;
            const ostFjell = x > W - 4 + Math.sin(y * 0.3) * 1.5;
            if (nordFjell || sorFjell || ostFjell) {
                terreng[y][x] = 'stein';
                blokkert[y][x] = true;
            }
        }
    }

    // ── Stien gjennom bygda, videre til tinget og gravhaugen ────────────────
    const sti: [number, number][] = [];
    const leggSti = (x0: number, y0: number, x1: number, y1: number) => {
        let x = x0;
        let y = y0;
        while (x !== x1 || y !== y1) {
            sti.push([x, y]);
            if (x !== x1 && (y === y1 || rng() > 0.4)) x += Math.sign(x1 - x);
            else y += Math.sign(y1 - y);
        }
        sti.push([x1, y1]);
    };
    leggSti(10, 32, 20, 30);
    leggSti(20, 30, 30, 26);
    leggSti(30, 26, 38, 24);
    leggSti(38, 24, 46, 20);
    leggSti(46, 20, 54, 18);
    leggSti(20, 30, 22, 38);

    for (const [x, y] of sti) {
        for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
        ]) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) continue;
            if (terreng[ty][tx] === 'vann' || terreng[ty][tx] === 'stein') continue;
            terreng[ty][tx] = 'sti';
        }
    }

    // ── Tingplassen: en åpen steinring ──────────────────────────────────────
    const tingX = 38;
    const tingY = 24;
    for (let y = tingY - 5; y <= tingY + 5; y++) {
        for (let x = tingX - 6; x <= tingX + 6; x++) {
            if (x < 0 || y < 0 || x >= W || y >= H) continue;
            const d = Math.hypot((x - tingX) / 6, (y - tingY) / 5);
            if (d < 1) terreng[y][x] = 'sti';
        }
    }

    // ── Åkerlapper sør for bygda ────────────────────────────────────────────
    for (let y = 36; y < 42; y++) {
        for (let x = 24; x < 34; x++) {
            if (terreng[y][x] === 'gress' || terreng[y][x] === 'gress-2' || terreng[y][x] === 'gress-3') {
                terreng[y][x] = 'aker';
            }
        }
    }

    // ── Gravhaugen: bossens arena ───────────────────────────────────────────
    const bossX = 54;
    const bossY = 16;
    for (let y = bossY - 7; y <= bossY + 7; y++) {
        for (let x = bossX - 7; x <= bossX + 7; x++) {
            if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
            const d = Math.hypot(x - bossX, y - bossY);
            if (d < 7) {
                terreng[y][x] = d > 5.5 ? 'stein' : 'sti';
                blokkert[y][x] = false;
            }
        }
    }

    const props: PropPlacement[] = [];
    const opptatt = new Set<string>();
    const merk = (x: number, y: number, w = 1, h = 1) => {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) opptatt.add(`${x + dx},${y + dy}`);
        }
    };
    const erLedig = (x: number, y: number, w = 1, h = 1) => {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) return false;
                if (opptatt.has(`${tx},${ty}`)) return false;
                const t = terreng[ty][tx];
                if (t === 'vann' || t === 'stein' || t === 'sti') return false;
            }
        }
        return true;
    };

    // ── Bygninger ───────────────────────────────────────────────────────────
    const bygg = (
        kind: PropPlacement['kind'],
        tx: number,
        ty: number,
        w: number,
        h: number,
        treff: { w: number; h: number; dy: number }
    ) => {
        props.push({ kind, x: tx * 16 + 8, y: ty * 16 + 8, solid: true, treff });
        merk(tx - Math.floor(w / 2), ty - Math.floor(h / 2), w, h);
        for (let dy = -Math.floor(h / 2); dy <= Math.floor(h / 2); dy++) {
            for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) {
                const bx = tx + dx;
                const by = ty + dy;
                if (bx > 0 && by > 0 && bx < W && by < H) blokkert[by][bx] = true;
            }
        }
    };

    bygg('langhus', 18, 27, 5, 4, { w: 62, h: 26, dy: 10 });
    bygg('bu', 25, 33, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('bu', 13, 22, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('naust', 8, 39, 4, 3, { w: 42, h: 16, dy: 6 });

    // Kai og skip i fjorden - ren pynt, men det gir stedet en grunn til å hete Nordvik.
    for (let x = 4; x < 9; x++) {
        if (terreng[41] && terreng[41][x]) {
            props.push({ kind: 'kai', x: x * 16 + 8, y: 41 * 16 + 8, solid: false });
            blokkert[41][x] = false;
        }
    }
    props.push({ kind: 'langskip', x: 3 * 16, y: 44 * 16, solid: false });

    // Gjerde rundt åkrene
    for (let x = 24; x < 34; x += 1) {
        props.push({ kind: 'gjerde', x: x * 16 + 8, y: 35 * 16 + 12, solid: false });
    }

    // ── Skog, busker og steiner ─────────────────────────────────────────────
    const strø = (
        kind: PropPlacement['kind'],
        antall: number,
        treff: { w: number; h: number; dy: number } | undefined,
        omrade?: (x: number, y: number) => boolean
    ) => {
        let plassert = 0;
        let forsok = 0;
        while (plassert < antall && forsok < antall * 40) {
            forsok += 1;
            const x = 2 + Math.floor(rng() * (W - 4));
            const y = 2 + Math.floor(rng() * (H - 4));
            if (omrade && !omrade(x, y)) continue;
            if (!erLedig(x, y)) continue;
            // Ikke rett inntil stien - eleven skal kunne gå.
            if (terreng[y][x + 1] === 'sti' || terreng[y][x - 1] === 'sti') continue;
            props.push({
                kind,
                x: x * 16 + 8,
                y: y * 16 + 8,
                solid: treff !== undefined,
                treff,
            });
            // Bevisst ikke `blokkert` her: et tre stopper deg med sin egen
            // lille stamme-boks. Merket vi hele ruta som sperret, ville en skog
            // blitt en vegg det er umulig å gå gjennom.
            merk(x, y);
            plassert += 1;
        }
    };

    strø('tre', 130, { w: 10, h: 8, dy: 12 }, (x, y) => y < 18 || y > 38 || x > 44);
    strø('busk', 60, undefined);
    strø('stein', 34, { w: 12, h: 8, dy: 4 });

    // ── Hvor fiender får dukke opp ──────────────────────────────────────────
    const spawnRuter: [number, number][] = [];
    for (let y = 4; y < H - 4; y++) {
        for (let x = SAND_GRENSE + 2; x < W - 4; x++) {
            if (blokkert[y][x]) continue;
            if (opptatt.has(`${x},${y}`)) continue;
            // Hold bygda rimelig trygg, så eleven får puste mellom slagene.
            const iBygda = x > 10 && x < 28 && y > 22 && y < 38;
            if (iBygda) continue;
            // Bossarenaen har sin egen fiende.
            if (Math.hypot(x - bossX, y - bossY) < 9) continue;
            spawnRuter.push([x, y]);
        }
    }

    return {
        bredde: W,
        hoyde: H,
        terreng,
        blokkert,
        props,
        spawnRuter,
        bossArena: { x: bossX * 16 + 8, y: bossY * 16 + 8, r: 6 * 16 },
    };
}
