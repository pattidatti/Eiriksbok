// Bygger kartet for Lindisfarne.
//
// Én ting bærer hele stedet, og den er en fraværende ting: **klosteret har
// ingen mur.** Ingen vollgrav, ingen palisade, ingen vakt. Det er ikke
// slurv fra munkenes side - ingen hadde tenkt tanken før 793, og eleven skal
// se det før noen sier det (blueprint §9).
//
// Formen er derfor motsatt av Nordvik: der ligger bygda tett inne i en fjord
// med fjell rundt, her ligger alt åpent. Stranda i vest er der kjølen skraper,
// klosterbygningene står i en løs klynge midt på, og resten er lav, flat mark
// uten noe å gjemme seg bak. Et sted uten forsvar skal se ut som et sted uten
// forsvar.

import { makeRng } from './pixels';
import type { TileKey } from './tileforge';
import type { PropPlacement, WorldMap } from './worldgen';

export const LINDISFARNE_SIZE = { bredde: 52, hoyde: 40 };

/** Der kjølen skraper sand. Eleven kommer i land her. */
export const LINDISFARNE_SPAWN: [number, number] = [13, 24];

/** Veien hjem: knarren ligger og venter der hun kom i land. */
export const LINDISFARNE_PORTAL: [number, number] = [11, 27];

const { bredde: W, hoyde: H } = LINDISFARNE_SIZE;

export function byggLindisfarne(): WorldMap {
    const rng = makeRng(793);
    const terreng: TileKey[][] = [];
    const blokkert: boolean[][] = [];
    const farbart: boolean[][] = [];

    for (let y = 0; y < H; y++) {
        terreng[y] = [];
        blokkert[y] = [];
        farbart[y] = [];
        for (let x = 0; x < W; x++) {
            // Sjøen i vest, og en lang, slak sandstrand. Bukta er grunnere enn
            // fjorden hjemme: en knarr kan settes rett på land her, og det er
            // nettopp derfor stedet lot seg raide.
            const bukt = Math.sin(y * 0.19) * 2.4 + Math.sin(y * 0.07) * 1.6;
            const vannKant = 8 + bukt;
            const sandKant = 12.5 + bukt;
            let flis: TileKey = 'gress';
            if (x < vannKant) flis = 'vann';
            else if (x < sandKant) flis = 'sand';
            terreng[y][x] = flis;
            blokkert[y][x] = flis === 'vann';
            farbart[y][x] = flis === 'vann';
        }
    }

    // Havet i nord, sør og øst. Lindisfarne er en øy, og kanten skal si det -
    // ikke et fjell som later som det er en kartkant.
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const kant = y < 2 || y > H - 3 || x > W - 3;
            if (!kant) continue;
            terreng[y][x] = 'vann';
            blokkert[y][x] = true;
            farbart[y][x] = true;
        }
    }

    // Tråkket sti fra stranda opp til klosteret. Den er slitt av folk som har
    // gått den hver dag i hundre år, og den fører rett inn - det finnes ingen
    // port å gå gjennom.
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
    leggSti(14, 24, 24, 20);
    leggSti(24, 20, 31, 16);
    leggSti(31, 16, 38, 18);
    leggSti(31, 16, 30, 26);

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
        }
    }

    // Klosterplassen: en åpen, tråkket flate mellom bygningene. Ingen ring av
    // stein rundt, ingen grøft.
    for (let y = 12; y <= 21; y++) {
        for (let x = 26; x <= 38; x++) {
            if (terreng[y][x] !== 'vann') terreng[y][x] = 'sti';
        }
    }

    // Åkrene i sør. Klosteret var et samfunn med en stor arbeidsstokk, ikke et
    // kapell - og folk som dyrker jord er folk som forsvarer den.
    for (let y = 27; y < 34; y++) {
        for (let x = 22; x < 36; x++) {
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

    // Kirka i midten, skriptoriet nord for den, cellene i en løs rekke. Ingen
    // av dem står i en firkant rundt en gårdsplass: det er en senere
    // klosterform, og den kom av at noen begynte å trenge en mur.
    bygg('langhus', 32, 16, 5, 4, { w: 62, h: 26, dy: 10 });
    bygg('bu', 28, 13, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('bu', 36, 13, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('bu', 27, 20, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('bu', 37, 21, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('naust', 17, 30, 4, 3, { w: 42, h: 16, dy: 6 });

    // Plassen der eleven kommer i land, og der porten hjem står, holdes ryddig.
    for (const [px, py] of [LINDISFARNE_SPAWN, LINDISFARNE_PORTAL]) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = px + dx;
                const ty = py + dy;
                if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) continue;
                if (terreng[ty][tx] === 'vann') continue;
                terreng[ty][tx] = 'sand';
                blokkert[ty][tx] = false;
                merk(tx, ty);
            }
        }
    }

    // Skipet som bar dem hit, trukket opp på stranda.
    props.push({ kind: 'langskip', x: 11 * 16, y: 22 * 16, solid: false, ...fast });

    // Gjerde rundt åkrene. Det er det eneste som ligner en avgrensning på hele
    // øya, og det er til for å holde sauer inne.
    for (let x = 22; x < 36; x += 1) {
        props.push({ kind: 'gjerde', x: x * 16 + 8, y: 26 * 16 + 12, solid: false, ...fast });
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
        varianter: number
    ) => {
        let plassert = 0;
        let forsok = 0;
        while (plassert < antall && forsok < antall * 40) {
            forsok += 1;
            const x = 2 + Math.floor(rng() * (W - 4));
            const y = 2 + Math.floor(rng() * (H - 4));
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

    // Få trær, og de står i utkanten. Øya er lav og vindslitt, og et tett skogholt
    // midt på ville gitt eleven noe å gjemme seg bak som ikke fantes.
    stro('tre', 26, { w: 10, h: 8, dy: 12 }, 3);
    stro('busk', 40, undefined, 2);
    stro('stein', 22, { w: 12, h: 8, dy: 4 }, 3);

    // Ingen tilfeldig spawning her. Raidet setter ut sine egne, i to bølger, og
    // en glemseltåke som driver inn mellom dem ville vært et annet spill.
    return {
        bredde: W,
        hoyde: H,
        terreng,
        blokkert,
        farbart,
        props,
        spawnRuter: [],
        bossArena: { x: 32 * 16 + 8, y: 16 * 16 + 8, r: 6 * 16 },
    };
}
