// Bygger kartet for leiren ved Riccall, 25. september 1066.
//
// Formen sier hele kapittelet: **skipene ligger i vest, og veien går østover.**
// Alt eleven eier - maten, kista, brynja, og den eneste veien hjem til Nordvik -
// ligger langs elva bak henne. Det hun skal gjøre i dag, ligger fem timers
// gange den andre veien. Avstanden mellom de to er ikke pynt. Det er grunnen
// til at slaget ved Stanford bru gikk som det gikk.
//
// Landskapet er flatt. Vale of York er myrlendt slette, og Ouse er en tidevanns-
// elv som er seilbar helt hit opp - det er derfor over to hundre skip kunne
// ligge her, femten kilometer sør for York, uten at noen så dem fra byen.
//
// Rammen rundt er vann i vest og sør, og kratt i nord og øst. Ingen fjell, for
// det finnes ingen. Der Stiklestad ble rammet inn av berg, blir dette rammet
// inn av myr - og myr sier noe berg ikke sier: at det ikke er noe å klatre opp
// på og se seg om fra.

import { makeRng } from './pixels';
import type { TileKey } from './tileforge';
import type { PropPlacement, WorldMap } from './worldgen';

export const RICCALL_SIZE = { bredde: 46, hoyde: 34 };

/** Der eleven står når kapittelet begynner: mellom kistene og teltene. */
export const RICCALL_SPAWN: [number, number] = [16, 20];

/** Porten til hallen. Nede ved skipene, der veien hjem faktisk ligger. */
export const RICCALL_PORTAL: [number, number] = [13, 27];

/**
 * Raden veien østover går i, og hvor den forlater kartet.
 *
 * Ligger her og ikke i `riccall.ts` av samme grunn som rekka på Stiklestad:
 * både kartet og landemerket ved veikanten må kjenne den, og et sted som
 * importerer generatoren som importerer stedet tilbake er en ring
 * modullasteren ikke kommer ut av.
 */
export const VEIEN_OST: [number, number] = [41, 11];

const { bredde: W, hoyde: H } = RICCALL_SIZE;

export function byggRiccall(): WorldMap {
    const rng = makeRng(1066);
    const terreng: TileKey[][] = [];
    const blokkert: boolean[][] = [];
    const farbart: boolean[][] = [];

    for (let y = 0; y < H; y++) {
        terreng[y] = [];
        blokkert[y] = [];
        farbart[y] = [];
        for (let x = 0; x < W; x++) {
            // Ouse i vest. Den bukter seg nordover, og bredden er slak - det
            // var derfor skipene kunne dras opp på land her i stedet for å
            // ligge for anker.
            const bukt = Math.sin(y * 0.19) * 1.7 + Math.sin(y * 0.07) * 1.3;
            const bredd = 8 + bukt;
            // Og myra i sør, der elva flater ut. Ingen vei den veien.
            const myr = 30 + Math.sin(x * 0.22) * 1.3;
            let flis: TileKey = 'gress';
            if (x < bredd - 1.5 || y > myr) flis = 'vann';
            else if (x < bredd || y > myr - 1.2) flis = 'sand';
            terreng[y][x] = flis;
            blokkert[y][x] = flis === 'vann';
            farbart[y][x] = flis === 'vann';
        }
    }

    // Krattet i nord og øst. Hagtorn og vier, ikke skog: det er ingenting å gå
    // seg bort i her, og det er heller ingenting å se over.
    const kratt: [number, number][] = [];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const nord = y < 2 + Math.sin(x * 0.24) * 1.1;
            const ost = x > W - 4 + Math.sin(y * 0.28) * 1.2;
            if (!nord && !ost) continue;
            if (terreng[y][x] === 'vann') continue;
            blokkert[y][x] = true;
            farbart[y][x] = false;
            kratt.push([x, y]);
        }
    }

    // Veien østover. Den går fra stranda, gjennom leiren, og ut gjennom
    // krattet - og den er det eneste stedet krattet åpner seg.
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
    leggSti(10, 22, 18, 18);
    leggSti(18, 18, 28, 14);
    leggSti(28, 14, VEIEN_OST[0], VEIEN_OST[1]);
    leggSti(VEIEN_OST[0], VEIEN_OST[1], W - 1, VEIEN_OST[1]);
    // Og stien nordover langs stranda, forbi skipene.
    leggSti(11, 22, 11, 8);

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

    // Engelske åkrer, skåret i slutten av september. De er tomme, og det er
    // ikke tilfeldig: en hær på flere tusen mann som ligger i et fremmed land
    // om høsten, spiser det landet nettopp har høstet.
    for (let y = 5; y < 10; y++) {
        for (let x = 30; x < 40; x++) {
            if (terreng[y][x] === 'gress') terreng[y][x] = 'aker';
        }
    }
    for (let y = 22; y < 27; y++) {
        for (let x = 30; x < 41; x++) {
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

    // Flåten. Fjorten skrog på skjermen for over to hundre i virkeligheten -
    // en rad som forsvinner ut av bildet i begge ender leser som «flere enn du
    // kan telle», og det er nøyaktig det tallet kildene har.
    for (let y = 4; y < 30; y += 2) {
        const bukt = Math.sin(y * 0.19) * 1.7 + Math.sin(y * 0.07) * 1.3;
        const x = 8 + bukt - 0.6;
        props.push({
            kind: 'langskip',
            x: x * 16,
            y: y * 16 + 8,
            solid: false,
            ...fast,
            flip: y % 4 === 0,
        });
    }
    props.push({ kind: 'kai', x: 9 * 16, y: 21 * 16 + 8, solid: false, ...fast });
    props.push({ kind: 'kai', x: 9 * 16, y: 22 * 16 + 8, solid: false, ...fast });

    // Teltene. De ligger i klynger med luft imellom, slik en hær ligger når den
    // ligger etter skipslag: mannskapet fra ett skip slår leir sammen.
    const teltruter: [number, number][] = [
        [15, 12],
        [19, 10],
        [23, 12],
        [17, 15],
        [22, 17],
        [26, 16],
        [15, 24],
        [19, 26],
        [24, 24],
        [28, 21],
        [30, 26],
        [27, 8],
        [31, 12],
        [34, 17],
        [35, 22],
        [21, 7],
    ];
    for (const [tx, ty] of teltruter) {
        props.push({
            kind: 'telt',
            x: tx * 16 + 8,
            y: ty * 16 + 8,
            solid: true,
            treff: { w: 34, h: 14, dy: 6 },
            ...fast,
            flip: (tx + ty) % 2 === 0,
        });
        merk(tx - 1, ty - 1, 3, 2);
        for (let dy = -1; dy <= 0; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const bx = tx + dx;
                const by = ty + dy;
                if (bx > 0 && by > 0 && bx < W && by < H) {
                    blokkert[by][bx] = true;
                    farbart[by][bx] = false;
                }
            }
        }
    }

    // Ruta eleven står på, og ruta porten står på, ryddes til slutt. Et telt
    // som lander oppå spawnpunktet setter henne fast i en duk.
    for (const [px, py] of [RICCALL_SPAWN, RICCALL_PORTAL]) {
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

    // Krattet får busker og lave trær oppå seg, så den blokkerte kanten ser ut
    // som noe og ikke som en usynlig vegg.
    for (const [x, y] of kratt) {
        if (rng() > 0.55) continue;
        props.push({
            kind: rng() > 0.45 ? 'busk' : 'tre',
            x: x * 16 + 8 + Math.round((rng() - 0.5) * 8),
            y: y * 16 + 8 + Math.round((rng() - 0.5) * 6),
            solid: false,
            variant: Math.floor(rng() * 2),
            flip: rng() > 0.5,
            skala: 0.75 + rng() * 0.25,
            tint: Math.round((rng() - 0.5) * 24),
        });
        merk(x, y);
    }
    // Og noen få trær langs elvekanten. Få, med vilje: treproppen er en gran,
    // og Vale of York har ingen. Fire stykker leser som en klynge ved vannet,
    // ni leser som at leiren ligger i Trøndelag. Resten er vierkratt.
    stro('tre', 4, { w: 10, h: 8, dy: 12 }, 3, (x, y) => x < 13 && y > 6 && y < 27);
    stro('busk', 26, undefined, 2, (x, y) => x < 15 || y > 27);

    return {
        bredde: W,
        hoyde: H,
        terreng,
        blokkert,
        farbart,
        props,
        // Ingen driver inn hit av seg selv. Det som kommer mot denne leiren,
        // kommer ikke hit i det hele tatt - det kommer til brua.
        spawnRuter: [],
        bossArena: { x: 22 * 16 + 8, y: 18 * 16 + 8, r: 6 * 16 },
    };
}
