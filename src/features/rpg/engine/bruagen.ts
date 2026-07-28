// Bygger kartet for Stanford bru, 25. september 1066.
//
// Én ting bærer stedet, og det er at alt må over de samme plankene.
// Elva ligger tvers over kartet, og det finnes nøyaktig ett sted å krysse den.
// Det er ikke pynt: hele slaget hviler på at en hær som står på feil side av ei
// bru, ikke kan komme seg over den fortere enn to mann om gangen.
//
// Retningene er valgt for skjermen, ikke for kartet - samme regel som på
// Stiklestad. Der ute renner Derwent nord-sør og engelskmennene kom vestfra;
// her ligger elva vannrett i bildet, hæren kommer inn oppe til venstre, og
// rekka stiller seg opp nede på høyden. Da ligger «over brua» faktisk nedover
// på skjermen, og eleven ser retretten med øynene i stedet for å regne den ut.
// Ingen kompassretning står skrevet på dette kartet, og det er med vilje.
//
// Landskapet er lavt og åpent. Vale of York har ingen fjell, og det er nettopp
// derfor det ikke finnes noe sted å se en hær komme fra på lang avstand - de
// så ikke støvet før det var en halv times gange unna.

import { makeRng } from './pixels';
import type { TileKey } from './tileforge';
import type { PropPlacement, WorldMap } from './worldgen';

export const BRUA_SIZE = { bredde: 46, hoyde: 34 };

/** Der eleven kommer inn: på veien fra leiren, på den siden hun skal forlate. */
export const BRUA_SPAWN: [number, number] = [7, 7];

/** Veien tilbake til Riccall. Fem timers gange, og hun rekker den aldri. */
export const BRUA_PORTAL: [number, number] = [3, 6];

/**
 * Plankene. To ruter brede, og hele slaget går gjennom dem.
 *
 * Ligger her og ikke i `brua.ts` av samme grunn som rekka på Stiklestad: både
 * kartet, landemerket ved brukaret og mannen som blir stående på dem må kjenne
 * de samme rutene, og et sted som importerer generatoren som importerer stedet
 * tilbake er en ring modullasteren ikke kommer ut av.
 */
export const BRUA_X = { fra: 21, til: 22 };
/** Fra nordsiden, over vannet, til sørsiden. */
export const BRUA_Y = { fra: 10, til: 18 };

/** Midt på plankene, der mannen med øksa blir stående. */
export const BRUA_MIDT: [number, number] = [BRUA_X.til, 14];

/** Der plankene ender på rekkas side. Herfra kommer hver eneste bølge. */
export const BRU_MUNN: [number, number] = [BRUA_X.fra, BRUA_Y.til + 1];

/**
 * Raden rekka stiller seg opp på, og hvor langt den strekker seg.
 *
 * Samme form som på Stiklestad, og det er ikke gjenbruk for gjenbrukens skyld:
 * eleven skal kjenne igjen sin egen plass i en skjoldborg med det samme. Det er
 * det som gjør at hun merker hva som er annerledes her.
 */
export const RINGEN_Y = 23;
export const RINGEN_X = { fra: 12, til: 32 };

/** Der veien fra York kommer inn i bildet. Landemerket står ved veikanten. */
export const VEIEN_VEST: [number, number] = [6, 4];

const { bredde: W, hoyde: H } = BRUA_SIZE;

export function byggBrua(): WorldMap {
    const rng = makeRng(1225);
    const terreng: TileKey[][] = [];
    const blokkert: boolean[][] = [];
    const farbart: boolean[][] = [];

    for (let y = 0; y < H; y++) {
        terreng[y] = [];
        blokkert[y] = [];
        farbart[y] = [];
        for (let x = 0; x < W; x++) {
            // Derwent. Den bukter seg, som elver gjør, og den er hverken bred
            // eller stri - den er bare umulig å gå over med skjold og spyd.
            const midt = 13.6 + Math.sin(x * 0.17) * 1.2 + Math.sin(x * 0.06) * 0.8;
            const fra = Math.abs(y - midt);
            let flis: TileKey = 'gress';
            if (fra < 2.1) flis = 'vann';
            else if (fra < 2.9) flis = 'sand';
            terreng[y][x] = flis;
            blokkert[y][x] = flis === 'vann';
            farbart[y][x] = flis === 'vann';
        }
    }

    // Kratt og lave trær rundt kanten. Ingen berg: det finnes ingen her, og det
    // er halve grunnen til at ingen så dem komme.
    const kratt: [number, number][] = [];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const nord = y < 2 + Math.sin(x * 0.23) * 1.1;
            const sor = y > H - 3 + Math.sin(x * 0.26) * 1.1;
            const vest = x < 1 + Math.sin(y * 0.31) * 0.9;
            const ost = x > W - 3 + Math.sin(y * 0.29) * 1.2;
            if (!nord && !sor && !vest && !ost) continue;
            if (terreng[y][x] === 'vann') continue;
            blokkert[y][x] = true;
            farbart[y][x] = false;
            kratt.push([x, y]);
        }
    }

    const sti: [number, number][] = [];
    const leggSti = (x0: number, y0: number, x1: number, y1: number) => {
        let x = x0;
        let y = y0;
        while (x !== x1 || y !== y1) {
            sti.push([x, y]);
            if (x !== x1 && (y === y1 || rng() > 0.42)) x += Math.sign(x1 - x);
            else y += Math.sign(y1 - y);
        }
        sti.push([x1, y1]);
    };
    // Veien fra York, inn i bildet oppe til venstre, ned til brukaret. Det er
    // den de kommer på, og det er den eleven selv kom på. Det er den samme
    // veien, og det er hele poenget: det finnes ikke to veier hit.
    leggSti(VEIEN_VEST[0] - 5, VEIEN_VEST[1], VEIEN_VEST[0], VEIEN_VEST[1]);
    leggSti(VEIEN_VEST[0], VEIEN_VEST[1], 13, 7);
    leggSti(13, 7, BRUA_X.fra, BRUA_Y.fra - 1);
    // Og veien videre på den andre siden, opp på høyden der rekka stiller seg.
    leggSti(BRUA_X.fra, BRUA_Y.til + 1, 24, 26);
    leggSti(24, 26, 34, 29);

    for (const [x, y] of sti) {
        for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
        ]) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) continue;
            if (terreng[ty][tx] === 'vann') continue;
            terreng[ty][tx] = 'sti';
            blokkert[ty][tx] = false;
            farbart[ty][tx] = false;
        }
    }

    // Plankene. To ruter brede fra bredd til bredd, og de er det eneste stedet
    // vannet ikke stenger.
    for (let y = BRUA_Y.fra; y <= BRUA_Y.til; y++) {
        for (let x = BRUA_X.fra; x <= BRUA_X.til; x++) {
            terreng[y][x] = 'tregulv';
            blokkert[y][x] = false;
            farbart[y][x] = false;
        }
    }

    // Engelske åkrer, skåret i september. De samme åkrene hæren spiste av i
    // Riccall, og eleven har alt lest hva det betyr for dem som bor her.
    for (let y = 4; y < 9; y++) {
        for (let x = 30; x < 41; x++) {
            if (terreng[y][x] === 'gress') terreng[y][x] = 'aker';
        }
    }
    for (let y = 27; y < 31; y++) {
        for (let x = 8; x < 17; x++) {
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

    // Rekkverket. Det er ikke pynt: uten det leser plankene som en sti som
    // tilfeldigvis går over vann, og da er ikke brua noe man må over - den er
    // bare et sted man går. To streker langs kanten gjør den til en flaskehals
    // med øynene.
    for (let y = BRUA_Y.fra; y <= BRUA_Y.til; y++) {
        if (terreng[y][BRUA_X.fra - 1] !== 'vann' && terreng[y][BRUA_X.til + 1] !== 'vann') continue;
        props.push({
            kind: 'gjerde',
            x: (BRUA_X.fra - 1) * 16 + 12,
            y: y * 16 + 8,
            solid: false,
            ...fast,
        });
        props.push({
            kind: 'gjerde',
            x: (BRUA_X.til + 1) * 16 + 4,
            y: y * 16 + 8,
            solid: false,
            ...fast,
        });
        merk(BRUA_X.fra - 1, y);
        merk(BRUA_X.til + 1, y);
    }

    // Bygda Stanford. Den lå her, den het noe, og folkene som bodde i den er
    // ikke nevnt i én eneste kilde om dagen. Samme grep som gården på
    // Stiklestad: husene står i utkanten av det som skjer.
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
    bygg('langhus', 33, 10, 5, 4, { w: 62, h: 26, dy: 10 });
    bygg('bu', 38, 7, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('bu', 30, 19, 3, 3, { w: 34, h: 16, dy: 8 });

    // Rekka skal stå på ryddet mark, som på Stiklestad. En skjoldborg som
    // brister fordi det står en busk i veien, lærer bort feil ting.
    for (let y = RINGEN_Y - 3; y <= RINGEN_Y + 3; y++) {
        for (let x = RINGEN_X.fra - 2; x <= RINGEN_X.til + 2; x++) {
            if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
            if (terreng[y][x] === 'vann') continue;
            blokkert[y][x] = false;
            merk(x, y);
        }
    }
    // Og veien fra brumunnen ned til rekka skal være åpen. Bølgene kommer den
    // veien, og en fiende som setter seg fast i et tre er en fiende eleven
    // aldri møter.
    for (let y = BRUA_Y.til; y <= RINGEN_Y; y++) {
        for (let x = BRUA_X.fra - 3; x <= BRUA_X.til + 3; x++) {
            if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
            if (terreng[y][x] === 'vann') continue;
            blokkert[y][x] = false;
            merk(x, y);
        }
    }
    for (const [px, py] of [BRUA_SPAWN, BRUA_PORTAL]) {
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

    const erLedig = (x: number, y: number) => {
        if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) return false;
        if (opptatt.has(`${x},${y}`)) return false;
        const t = terreng[y][x];
        return t !== 'vann' && t !== 'sti' && t !== 'aker' && t !== 'sand' && t !== 'tregulv';
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

    for (const [x, y] of kratt) {
        if (rng() > 0.5) continue;
        props.push({
            // Nesten bare kratt. Treproppen er en gran, og Vale of York har
            // ingen - en kant full av dem leser som Trøndelag, og da er ikke
            // dette et fremmed land lenger. Samme regel som i leiren ved Ouse.
            kind: rng() > 0.82 ? 'tre' : 'busk',
            x: x * 16 + 8 + Math.round((rng() - 0.5) * 8),
            y: y * 16 + 8 + Math.round((rng() - 0.5) * 6),
            solid: false,
            variant: Math.floor(rng() * 2),
            flip: rng() > 0.5,
            skala: 0.7 + rng() * 0.25,
            tint: Math.round((rng() - 0.5) * 24),
        });
        merk(x, y);
    }
    // Vier langs elvekanten, og ikke annet. Sletta skal være åpen: to hærer
    // som møttes her, møttes fordi det ikke var noe å gjemme seg bak.
    stro(
        'tre',
        6,
        { w: 10, h: 8, dy: 12 },
        3,
        (x, y) => Math.abs(y - 13.6) < 5 && Math.abs(x - 21) > 6
    );
    stro('busk', 22, undefined, 2, (_x, y) => y < 6 || y > 28 || Math.abs(y - 13.6) < 5);
    stro('stein', 8, { w: 12, h: 8, dy: 4 }, 3, (_x, y) => y > 28);

    return {
        bredde: W,
        hoyde: H,
        terreng,
        blokkert,
        farbart,
        props,
        // Ingen driver inn hit av seg selv. Det som kommer, kommer over brua,
        // og det settes ut av `bruslaget.ts`.
        spawnRuter: [],
        bossArena: { x: 22 * 16 + 8, y: RINGEN_Y * 16 + 8, r: 6 * 16 },
    };
}
