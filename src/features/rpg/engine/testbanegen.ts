// Bygger kartet til Prøvebanen.
//
// Tre soner, vest mot øst, og rekkefølgen er hele designet:
//
//   Tunet (x 4-22)      brolagt, trygt. Alt som skal testes i ro står her:
//                       porten hjem, skiltet, bålet, runesteinen, kista,
//                       oppdragsgiveren og boden.
//   Midten (x 22-46)    åpen mark, med tjernet og robåten sør for veien.
//   Feltet (x 46-68)    der fiender kommer av seg selv, og bossen står lengst øst.
//
// Avstanden mellom tunet og feltet er ikke pynt. Fiendelaget setter bare ut
// noen 200-420 piksler fra eleven, og med `SPAWN_FELT` der det står, ligger
// tunet utenfor hele det vinduet. Derfor kan en dialog testes uten at en
// øksekar kommer bakfra - og motstanden begynner i det man går østover, uten
// at noen bryter eller flagg må slås av og på.
//
// Kartet er symmetrisk og kjedelig med vilje. En sandkasse skal ikke ha
// terreng man kan skylde på: går noe galt her, er det systemet.

import {
    BOSS_RUTE,
    SPAWN_FELT,
    TESTBANE_FARKOSTER,
    TESTBANE_LANDMARKS,
    TESTBANE_NPCS,
    TESTBANE_PORTAL,
    TESTBANE_SIZE,
    TESTBANE_SPAWN,
    TJERNET,
    TUNET,
    VEI_Y,
} from '../data/testbanen';
import { makeRng } from './pixels';
import type { TileKey } from './tileforge';
import type { PropPlacement, WorldMap } from './worldgen';

const { bredde: W, hoyde: H } = TESTBANE_SIZE;

/** Halve bredden på hovedveien. Som i hallen: smalere enn to spises av kantflisene. */
const VEI_HALV = 1;

/** Radien på steinflaten rundt bossen, i ruter. */
const ARENA_R = 6;

export function byggTestbane(): WorldMap {
    const rng = makeRng(1337);
    const terreng: TileKey[][] = [];
    const blokkert: boolean[][] = [];
    const farbart: boolean[][] = [];

    for (let y = 0; y < H; y++) {
        terreng[y] = [];
        blokkert[y] = [];
        farbart[y] = [];
        for (let x = 0; x < W; x++) {
            terreng[y][x] = 'gress';
            blokkert[y][x] = false;
            farbart[y][x] = false;
        }
    }

    // ── Kanten ──────────────────────────────────────────────────────────────
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) {
                terreng[y][x] = 'stein';
                blokkert[y][x] = true;
            }
        }
    }

    // ── Tunet ───────────────────────────────────────────────────────────────
    for (let y = TUNET.y0; y <= TUNET.y1; y++) {
        for (let x = TUNET.x0; x <= TUNET.x1; x++) {
            terreng[y][x] = 'sti';
        }
    }

    // ── Hovedveien østover ──────────────────────────────────────────────────
    for (let x = TUNET.x0; x <= W - 5; x++) {
        for (let dy = -VEI_HALV; dy <= VEI_HALV; dy++) terreng[VEI_Y + dy][x] = 'sti';
    }

    // ── Tjernet ─────────────────────────────────────────────────────────────
    // Vann er stengt for beina og åpent for båten. Det er ikke det motsatte av
    // `blokkert` overalt - se `WorldMap.farbart` - men her er det nettopp det.
    for (let y = 2; y < H - 2; y++) {
        for (let x = 2; x < W - 2; x++) {
            const d = Math.hypot((x - TJERNET.x) / TJERNET.rx, (y - TJERNET.y) / TJERNET.ry);
            if (d < 1) {
                terreng[y][x] = 'vann';
                blokkert[y][x] = true;
                farbart[y][x] = true;
            } else if (d < 1.18) {
                terreng[y][x] = 'sand';
            }
        }
    }
    // Stien ned til stranda, så båten er noe man går til og ikke snubler over.
    for (let y = VEI_Y + VEI_HALV; y <= TJERNET.y - TJERNET.ry - 1; y++) {
        for (const x of [TJERNET.x, TJERNET.x + 1]) {
            if (terreng[y][x] === 'vann') continue;
            terreng[y][x] = 'sti';
            blokkert[y][x] = false;
        }
    }

    // ── Bossflaten ──────────────────────────────────────────────────────────
    // Stein som gulv, ikke som vegg: flisen sier «her skjer det noe», men den
    // stenger ingenting. En arena med kanter ville gjemt feil i kollisjonen.
    const [bx, by] = BOSS_RUTE;
    for (let y = by - ARENA_R; y <= by + ARENA_R; y++) {
        for (let x = bx - ARENA_R; x <= bx + ARENA_R; x++) {
            if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) continue;
            if (Math.hypot(x - bx, y - by) > ARENA_R) continue;
            terreng[y][x] = 'stein';
            blokkert[y][x] = false;
        }
    }

    // ── Objekter ────────────────────────────────────────────────────────────
    const props: PropPlacement[] = [];
    const opptatt = new Set<string>();
    const merk = (x: number, y: number) => opptatt.add(`${x},${y}`);
    const reserver = (tile: [number, number], r: number) => {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) merk(tile[0] + dx, tile[1] + dy);
        }
    };

    // Ingenting skal kunne stå oppå en stasjon. Porten får to ruters klaring
    // fordi portallaget tegner et lys over steinen; resten holder én.
    reserver(TESTBANE_PORTAL, 2);
    reserver(TESTBANE_SPAWN, 2);
    reserver(BOSS_RUTE, ARENA_R);
    for (const lm of TESTBANE_LANDMARKS) reserver(lm.tile, 1);
    for (const npc of TESTBANE_NPCS) reserver(npc.tile, 1);
    for (const f of TESTBANE_FARKOSTER) reserver(f.tile, 2);

    const erLedig = (x: number, y: number) => {
        if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) return false;
        if (opptatt.has(`${x},${y}`)) return false;
        if (terreng[y][x] !== 'gress') return false;
        for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ]) {
            const t = terreng[y + dy]?.[x + dx];
            if (t === 'sti' || t === 'vann') return false;
        }
        return true;
    };

    const stro = (
        kind: PropPlacement['kind'],
        antall: number,
        treff: { w: number; h: number; dy: number } | undefined,
        varianter: number,
        omrade?: (x: number, y: number) => boolean
    ) => {
        let plassert = 0;
        let forsok = 0;
        while (plassert < antall && forsok < antall * 40) {
            forsok += 1;
            const x = 3 + Math.floor(rng() * (W - 6));
            const y = 3 + Math.floor(rng() * (H - 6));
            if (omrade && !omrade(x, y)) continue;
            if (!erLedig(x, y)) continue;
            props.push({
                kind,
                x: x * 16 + 8 + Math.round((rng() - 0.5) * 6),
                y: y * 16 + 8 + Math.round((rng() - 0.5) * 4),
                solid: treff !== undefined,
                treff,
                variant: Math.floor(rng() * varianter),
                flip: rng() > 0.5,
                skala: 0.9 + rng() * 0.22,
                tint: Math.round((rng() - 0.5) * 22),
            });
            merk(x, y);
            plassert += 1;
        }
    };

    // Skog langs kanten, så verden har en ramme. Ikke inne i feltet: en fiende
    // som kommer gående skal være synlig hele veien, ellers vet vi ikke om det
    // er AI-en eller en furu som gjorde at hun forsvant.
    const langsKanten = (x: number, y: number) => x < 6 || y < 6 || x > W - 7 || y > H - 7;
    stro('tre', 90, { w: 10, h: 8, dy: 12 }, 3, langsKanten);
    stro('busk', 40, undefined, 2);
    stro('stein', 20, { w: 12, h: 8, dy: 4 }, 3, (x, y) => !langsKanten(x, y));

    // ── Der fiender får komme opp ───────────────────────────────────────────
    // Regnes til slutt, så en furu aldri står i en spawnrute. Annenhver rute:
    // tettere gir ingen flere fiender (taket er 14 levende), bare en lengre
    // liste å filtrere hvert fjerde sekund.
    const spawnRuter: [number, number][] = [];
    for (let y = SPAWN_FELT.y0; y <= SPAWN_FELT.y1; y += 2) {
        for (let x = SPAWN_FELT.x0; x <= SPAWN_FELT.x1; x += 2) {
            if (terreng[y]?.[x] !== 'gress') continue;
            if (blokkert[y][x] || opptatt.has(`${x},${y}`)) continue;
            spawnRuter.push([x, y]);
        }
    }

    return {
        bredde: W,
        hoyde: H,
        terreng,
        blokkert,
        farbart,
        props,
        spawnRuter,
        bossArena: { x: bx * 16 + 8, y: by * 16 + 8, r: ARENA_R * 16 },
    };
}
