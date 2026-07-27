// Bygger kartet for Minnevokterens hall.
//
// Én vei, øst-vest, som er tiden selv. En sidesti sørover til lunden der de
// tidløse epokene står. Ingen fiender, ingen boss, ingen vann - hubben er et
// pusterom, og alt som kan slå eller drukne hører hjemme inne i en epoke.
//
// Skogen rammer inn i stedet for fjell. Fjell leser som en grense man ikke
// kommer forbi; trær leser som et sted som fortsetter. Det er riktigere her:
// epokene som ikke er bygget ennå, ligger et sted der ute.

import {
    HUB_LANDEMERKER,
    HUB_PORTALER,
    HUB_SIZE,
    LUND,
    LUND_AVKJORING,
    SITTEPLASSER,
    VARDE_RUTE,
    veiY,
} from '../data/hub';
import { makeRng } from './pixels';
import type { TileKey } from './tileforge';
import type { PropPlacement, WorldMap } from './worldgen';

const { bredde: W, hoyde: H } = HUB_SIZE;

/**
 * Halve bredden på veien. Fem ruter.
 *
 * Første forsøk var tre, og den forsvant: gress har høyere flisprioritet enn
 * sti (`FLIS_PRIORITET`), så kantene spiser en rute på hver side, og det som
 * var igjen leste som brune flekker og ikke som en vei. Veien her er dessuten
 * tiden selv - den tåler å være bred.
 */
const VEI_HALV = 2;

export function byggHub(): WorldMap {
    const rng = makeRng(2026);
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
            // Ingen båt kommer noen gang hit. Masken må likevel finnes, ellers
            // krasjer farkostlaget første gang noen gir hallen en robåt.
            farbart[y][x] = false;
        }
    }

    // ── Kanten ──────────────────────────────────────────────────────────────
    // Ytterst en stripe stein, så eleven ikke går ut av verden. Den ligger
    // utenfor det hun ser på veien, og leser som en fjellside i tåka.
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) {
                terreng[y][x] = 'stein';
                blokkert[y][x] = true;
            }
        }
    }

    // ── Veien: tiden ────────────────────────────────────────────────────────
    const leggVei = (x: number, y: number, halv: number) => {
        for (let dy = -halv; dy <= halv; dy++) {
            const ty = y + dy;
            if (ty < 2 || ty >= H - 2 || x < 2 || x >= W - 2) continue;
            terreng[ty][x] = 'sti';
            blokkert[ty][x] = false;
        }
    };
    for (let x = 3; x < W - 3; x++) leggVei(x, Math.round(veiY(x)), VEI_HALV);

    // ── Sidestien til lunden ────────────────────────────────────────────────
    const lundMidt = LUND.x + Math.floor(LUND.bredde / 2);
    for (let y = Math.round(veiY(LUND_AVKJORING)); y <= LUND.y; y++) {
        for (let dx = -1; dx <= 0; dx++) {
            const tx = LUND_AVKJORING + dx;
            if (tx < 2 || tx >= W - 2) continue;
            terreng[y][tx] = 'sti';
            blokkert[y][tx] = false;
        }
    }
    for (let x = Math.min(LUND_AVKJORING, lundMidt); x <= Math.max(LUND_AVKJORING, lundMidt); x++) {
        terreng[LUND.y][x] = 'sti';
    }

    // ── Lunden ──────────────────────────────────────────────────────────────
    // En åpen grasslette med en ring av gress-sti rundt. Ikke firkantet: en
    // rektangulær lysning i en skog ser ut som noe noen har ryddet med linjal.
    const lx = LUND.x + LUND.bredde / 2;
    const ly = LUND.y + LUND.hoyde / 2;
    for (let y = LUND.y - 2; y < LUND.y + LUND.hoyde + 2; y++) {
        for (let x = LUND.x - 2; x < LUND.x + LUND.bredde + 2; x++) {
            if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue;
            const d = Math.hypot((x - lx) / (LUND.bredde / 2), (y - ly) / (LUND.hoyde / 2));
            if (d < 1) {
                terreng[y][x] = d > 0.72 ? 'sti' : 'gress';
                blokkert[y][x] = false;
            }
        }
    }

    // ── Objekter ────────────────────────────────────────────────────────────
    const props: PropPlacement[] = [];
    const opptatt = new Set<string>();
    const merk = (x: number, y: number) => opptatt.add(`${x},${y}`);

    // Portalene og landemerkene tegnes av sine egne lag, men rutene deres må
    // holdes fri for skog. Uten dette kan et tre stå midt i en portal.
    for (const p of HUB_PORTALER) {
        for (let dy = -2; dy <= 1; dy++) {
            for (let dx = -2; dx <= 2; dx++) merk(p.tile[0] + dx, p.tile[1] + dy);
        }
    }
    // Det samme gjelder bålet, varden, skiltene og benkene rundt ilden. Et tre
    // midt i bålplassen er ikke bare stygt - eleven kommer ikke fram til
    // benken, og da finnes ikke stedet folk skal møtes.
    for (const l of HUB_LANDEMERKER) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) merk(l.tile[0] + dx, l.tile[1] + dy);
        }
    }
    for (const s of SITTEPLASSER) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) merk(s.tile[0] + dx, s.tile[1] + dy);
        }
    }
    // Varden hører til hallen, men står i `steder.ts` sammen med resten av
    // stedet - derfor er den ikke med i `HUB_LANDEMERKER` og må merkes for seg.
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) merk(VARDE_RUTE[0] + dx, VARDE_RUTE[1] + dy);
    }

    // ── Benkene ─────────────────────────────────────────────────────────────
    //
    // Ikke solide. Eleven settes ned *på* benken av `Samvaer`, og en
    // kollisjonsboks ville dyttet henne av i det hun reiste seg igjen.
    //
    // Fire piksler over rutas midte, så dybdesorteringen legger benken bak
    // henne. Ligger den på ruta selv, blir plankene tegnet oppå ryggen hennes.
    for (const s of SITTEPLASSER) {
        props.push({
            kind: 'benk',
            x: s.tile[0] * 16 + 8,
            y: s.tile[1] * 16 + 4,
            solid: false,
            variant: 0,
            flip: false,
            skala: 1,
            tint: 0,
        });
    }

    const erLedig = (x: number, y: number) => {
        if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) return false;
        if (opptatt.has(`${x},${y}`)) return false;
        const t = terreng[y][x];
        if (t !== 'gress') return false;
        // Ikke rett inntil stien - eleven skal kunne gå uten å skrape borti.
        for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ]) {
            if (terreng[y + dy]?.[x + dx] === 'sti') return false;
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

    // Tett skog langs kanten, glissent inne ved veien. Da føles veien som en
    // lysning man går i, og ikke som en strek over en plen.
    const naerVeien = (x: number, y: number) => Math.abs(y - veiY(x)) < 5;
    stro('tre', 150, { w: 10, h: 8, dy: 12 }, 3, (x, y) => !naerVeien(x, y));
    stro('busk', 70, undefined, 2);
    stro('stein', 26, { w: 12, h: 8, dy: 4 }, 3);

    // Noen få trær nær veien også, ellers blir kanten en mur og midten en ørken.
    stro('tre', 22, { w: 10, h: 8, dy: 12 }, 3, (x, y) => naerVeien(x, y));

    return {
        bredde: W,
        hoyde: H,
        terreng,
        blokkert,
        farbart,
        props,
        // Ingen fiender i hallen. Tom liste, ikke et flagg: fiendelaget spør
        // allerede «finnes det ruter å komme opp av», og svaret er nei.
        spawnRuter: [],
        bossArena: { x: 0, y: 0, r: 0 },
    };
}
