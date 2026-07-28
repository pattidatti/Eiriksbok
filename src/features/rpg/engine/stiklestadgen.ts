// Bygger kartet for Stiklestad i Verdalen, 29. juli 1030.
//
// Én ting bærer stedet, og den er formen: **det er flatt, og det er åpent.**
// Nordvik er en fjord med fjell rundt og skog å gå seg bort i; her er det
// dyrket mark fra elva i sør til lia i nord, og ingenting å gjemme seg bak.
// Det er ikke pynt - et slag mellom to skjoldborger krevde nettopp en slik
// slette, og der terrenget er kupert står ingen rekke.
//
// Retningene er valgt for skjermen, ikke for kartet: kongens hær kommer ned
// veien i nord og går sørover mot rekka. Da ligger «mannen til venstre for
// deg» faktisk til venstre i bildet, og regelen som hele kapittelet står på
// lar seg lese med øynene.

import { makeRng } from './pixels';
import type { TileKey } from './tileforge';
import type { PropPlacement, WorldMap } from './worldgen';

export const STIKLESTAD_SIZE = { bredde: 46, hoyde: 34 };

/** Der bøndene kommer opp fra elva. Sør for rekka, med ryggen mot vannet. */
export const STIKLESTAD_SPAWN: [number, number] = [21, 27];

/** Veien tilbake til gården. Vest, der båtene ligger. */
export const STIKLESTAD_PORTAL: [number, number] = [4, 27];

/**
 * Raden rekka står på, og hvor langt den strekker seg.
 *
 * Ligger her og ikke i `skjoldborg.ts` av samme grunn som huden i 995: både
 * landemerket på sletta og motoren må kjenne den, og en motor som importerer
 * et sted som importerer motoren tilbake er en ring modullasteren ikke kommer
 * ut av.
 */
export const REKKA_Y = 21;
export const REKKA_X = { fra: 12, til: 32 };

const { bredde: W, hoyde: H } = STIKLESTAD_SIZE;

export function byggStiklestad(): WorldMap {
    const rng = makeRng(1030);
    const terreng: TileKey[][] = [];
    const blokkert: boolean[][] = [];
    const farbart: boolean[][] = [];

    for (let y = 0; y < H; y++) {
        terreng[y] = [];
        blokkert[y] = [];
        farbart[y] = [];
        for (let x = 0; x < W; x++) {
            // Verdalselva i sør. Den bukter seg, som elver gjør, og den er
            // grunnen til at en brutt rekke er verre her enn den ellers ville
            // vært: det er ingen vei bakover.
            const bukt = Math.sin(x * 0.21) * 1.6 + Math.sin(x * 0.08) * 1.1;
            const elvekant = 30 + bukt;
            let flis: TileKey = 'gress';
            if (y > elvekant) flis = 'vann';
            else if (y > elvekant - 1.4) flis = 'sand';
            terreng[y][x] = flis;
            blokkert[y][x] = flis === 'vann';
            farbart[y][x] = flis === 'vann';
        }
    }

    // Lia i nord og bergene i øst og vest. De rammer sletta inn uten å gi noen
    // et sted å gå rundt: begge hærene måtte fram over den samme marka.
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const nord = y < 2 + Math.sin(x * 0.26) * 1.2;
            const vest = x < 2 + Math.sin(y * 0.3) * 1.1;
            const ost = x > W - 3 + Math.sin(y * 0.27) * 1.2;
            if (!nord && !vest && !ost) continue;
            terreng[y][x] = 'stein';
            blokkert[y][x] = true;
            farbart[y][x] = false;
        }
    }

    // Veien fra Sul, der kongen kom ned dalen. Den går inn i bildet oppe til
    // høyre og ender midt på sletta - den slutter der fordi det var der den
    // sluttet å bety noe.
    const sti: [number, number][] = [];
    const leggSti = (x0: number, y0: number, x1: number, y1: number) => {
        let x = x0;
        let y = y0;
        while (x !== x1 || y !== y1) {
            sti.push([x, y]);
            if (x !== x1 && (y === y1 || rng() > 0.45)) x += Math.sign(x1 - x);
            else y += Math.sign(y1 - y);
        }
        sti.push([x1, y1]);
    };
    leggSti(42, 3, 34, 7);
    leggSti(34, 7, 26, 10);
    leggSti(26, 10, 20, 12);
    // Og stien ned til vadestedet, der bøndene kom opp fra båtene.
    leggSti(6, 27, 14, 24);

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

    // Åkrene på Stiklestad. Kornet står i slutten av juli, og det er det de
    // kommer til å stå i.
    for (let y = 14; y < 19; y++) {
        for (let x = 30; x < 40; x++) {
            if (terreng[y][x] === 'gress') terreng[y][x] = 'aker';
        }
    }
    for (let y = 23; y < 27; y++) {
        for (let x = 6; x < 14; x++) {
            if (terreng[y][x] === 'gress') terreng[y][x] = 'aker';
        }
    }

    const props: PropPlacement[] = [];
    const opptatt = new Set<string>();
    const merk = (x: number, y: number, w = 1, h = 1) => {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) opptatt.add(`${x + dx},${y + dy}`);
        }
    };
    const fast = { variant: 0, flip: false, skala: 1, tint: 0 };

    const bygg = (
        kind: PropPlacement['kind'],
        tx: number,
        ty: number,
        w: number,
        h: number,
        treff: { w: number; h: number; dy: number }
    ) => {
        props.push({ kind, x: tx * 16 + 8, y: ty * 16 + 8, solid: true, treff, ...fast });
        merk(tx - Math.floor(w / 2), ty - Math.floor(h / 2), w, h);
        for (let dy = -Math.floor(h / 2); dy <= Math.floor(h / 2); dy++) {
            for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) {
                const bx = tx + dx;
                const by = ty + dy;
                if (bx > 0 && by > 0 && bx < W && by < H) {
                    blokkert[by][bx] = true;
                    farbart[by][bx] = false;
                }
            }
        }
    };

    // Gården som ga slaget navnet sitt. Den ligger i utkanten av det som skjer,
    // og folkene der er ikke nevnt i én eneste kilde.
    bygg('langhus', 8, 8, 5, 4, { w: 62, h: 26, dy: 10 });
    bygg('bu', 13, 6, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('bu', 6, 12, 3, 3, { w: 34, h: 16, dy: 8 });

    // Rekka skal stå på ryddet mark. Ingen stein, ingen busk, ingen stubbe -
    // en skjoldborg som brister fordi et tre står i veien, lærer bort feil
    // ting.
    for (let y = REKKA_Y - 3; y <= REKKA_Y + 3; y++) {
        for (let x = REKKA_X.fra - 2; x <= REKKA_X.til + 2; x++) {
            if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
            if (terreng[y][x] === 'vann') continue;
            blokkert[y][x] = false;
            merk(x, y);
        }
    }
    for (const [px, py] of [STIKLESTAD_SPAWN, STIKLESTAD_PORTAL]) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = px + dx;
                const ty = py + dy;
                if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) continue;
                if (terreng[ty][tx] === 'vann') continue;
                terreng[ty][tx] = 'sti';
                blokkert[ty][tx] = false;
                merk(tx, ty);
            }
        }
    }

    // Båtene bøndene kom i, trukket opp i elvekanten.
    props.push({ kind: 'langskip', x: 8 * 16, y: 29 * 16, solid: false, ...fast });

    const erLedig = (x: number, y: number) => {
        if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) return false;
        if (opptatt.has(`${x},${y}`)) return false;
        const t = terreng[y][x];
        return t !== 'vann' && t !== 'sti' && t !== 'aker' && t !== 'sand';
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
            const x = 2 + Math.floor(rng() * (W - 4));
            const y = 2 + Math.floor(rng() * (H - 4));
            if (omrade && !omrade(x, y)) continue;
            if (!erLedig(x, y)) continue;
            if (terreng[y][x + 1] === 'sti' || terreng[y][x - 1] === 'sti') continue;
            props.push({
                kind,
                x: x * 16 + 8 + Math.round((rng() - 0.5) * 6),
                y: y * 16 + 8 + Math.round((rng() - 0.5) * 4),
                solid: treff !== undefined,
                treff,
                variant: Math.floor(rng() * varianter),
                flip: rng() > 0.5,
                skala: 0.9 + rng() * 0.2,
                tint: Math.round((rng() - 0.5) * 20),
            });
            merk(x, y);
            plassert += 1;
        }
    };

    // Skogen står i lia og langs elva, aldri ute på sletta. Sletta er poenget.
    stro('tre', 34, { w: 10, h: 8, dy: 12 }, 3, (_x, y) => y < 8 || y > 27);
    stro('busk', 26, undefined, 2, (_x, y) => y < 10 || y > 26);
    stro('stein', 14, { w: 12, h: 8, dy: 4 }, 3, (_x, y) => y < 9 || y > 27);

    return {
        bredde: W,
        hoyde: H,
        terreng,
        blokkert,
        farbart,
        props,
        // Ingen driver inn hit av seg selv. Kongens hær kommer i bølger, og de
        // settes ut av skjoldborgen.
        spawnRuter: [],
        bossArena: { x: 22 * 16 + 8, y: REKKA_Y * 16 + 8, r: 6 * 16 },
    };
}
