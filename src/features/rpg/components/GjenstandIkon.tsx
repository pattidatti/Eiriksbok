import { memo } from 'react';
import { ramp } from '../engine/pixels';
import type { ItemDef } from '../types';

// Ikonene i sekken og på figuren. Samme grep som smia: ingen bildefiler, bare
// rutenett av tegn som blir piksler. Et nytt sverd får et ikon fordi det er et
// sverd, og fargen fordi den står på gjenstanden.
//
// Tegnene er fargeroller, ikke farger:
//   M  hovedfargen     L  lys kant     D  skygge
//   W  tre             G  gull/messing I  jern
//   S  streng/lin      .  tomt
// Konturen legges på til slutt, rundt alt som ikke er tomt, som `outline()` i
// smia. Da leser ikonene som figurene i verden.

interface Tegning {
    rader: string[];
    /** Hovedfargen når gjenstanden ikke har sin egen. */
    farge: string;
}

const METALL = '#cfd6e0';
const TRE = '#8a5a34';
const GULL = '#d8b04a';
const JERN = '#9aa3ae';

const TEGNINGER: Record<string, Tegning> = {
    sverd: {
        farge: METALL,
        rader: [
            '..........LM',
            '.........LMD',
            '........LMD.',
            '.......LMD..',
            '......LMD...',
            '.....LMD....',
            '..G.LMD.....',
            '...GMD......',
            '...WG.......',
            '..W..G......',
            '.W..........',
            'W...........',
        ],
    },
    oks: {
        farge: METALL,
        rader: [
            '.....LMMM...',
            '....LMMMMD..',
            '....LMMMMD..',
            '.....LMD.W..',
            '......D.W...',
            '.......W....',
            '......W.....',
            '.....W......',
            '....W.......',
            '...W........',
            '..W.........',
            '.W..........',
        ],
    },
    stav: {
        farge: '#8fd3ff',
        rader: [
            '.........GG.',
            '........GLMG',
            '........GMDG',
            '.........GG.',
            '........W...',
            '.......W....',
            '......W.....',
            '.....W......',
            '....W.......',
            '...W........',
            '..W.........',
            '.W..........',
        ],
    },
    spyd: {
        farge: METALL,
        rader: [
            '...........L',
            '.........LMM',
            '........LMMD',
            '.........MD.',
            '........W...',
            '.......W....',
            '......W.....',
            '.....W......',
            '....W.......',
            '...W........',
            '..W.........',
            '.W..........',
        ],
    },
    hammer: {
        farge: METALL,
        rader: [
            '.....LM.....',
            '....LMMM....',
            '...LMMMMD...',
            '....MMMMMD..',
            '.....MMMD...',
            '.....WMD....',
            '....W.D.....',
            '...W........',
            '..W.........',
            '.W..........',
        ],
    },
    bue: {
        farge: TRE,
        rader: [
            '...LM.......',
            '..LM.S......',
            '..M...S.....',
            '.LM....S....',
            '.M......S...',
            '.M......S...',
            '.M......S...',
            '.M......S...',
            '.LM....S....',
            '..M...S.....',
            '..LM.S......',
            '...LM.......',
        ],
    },
    hjelm: {
        farge: JERN,
        rader: [
            '....LLMM....',
            '..LLMMMMMD..',
            '.LMMMMMMMMD.',
            '.LMMMMMMMMD.',
            '.LMMMDMMMMD.',
            '.MMD.D..DMD.',
            '.MD..D...DD.',
            '.MD.......D.',
        ],
    },
    brillehjelm: {
        farge: JERN,
        rader: [
            '....LLMM....',
            '..LLMMMMMD..',
            '.LMMMMMMMMD.',
            '.LMMMMMMMMD.',
            '.LMDDDDDDMD.',
            '.MD..DD..DD.',
            '.MDDD.DDDDD.',
            '.MD.......D.',
        ],
    },
    hette: {
        farge: '#6b5a44',
        rader: [
            '....LMMM....',
            '...LMMMMD...',
            '..LMMDDMMD..',
            '..LMD..DMD..',
            '..LM....MD..',
            '..LM....MD..',
            '.LMMD..DMMD.',
            'LMMMMMMMMMMD',
        ],
    },
    lue: {
        farge: '#8a6440',
        rader: [
            '............',
            '.....LM.....',
            '....LMMMD...',
            '...LMMMMMD..',
            '..LMMMMMMMD.',
            '..LMMMMMMMD.',
            '.DDDDDDDDDDD',
        ],
    },
    kappe: {
        farge: '#5a6a52',
        rader: [
            '...GLMMMMD..',
            '..LMMMMMMMD.',
            '..LMMMMMMMD.',
            '.LMMMMMMMMMD',
            '.LMMMMMMMMMD',
            '.LMMMMMMMMMD',
            'LMMMMMMMMMMD',
            'LMMMMMMMMMMD',
            'DDDDDDDDDDDD',
        ],
    },
    bryst: {
        farge: '#8a6440',
        rader: [
            '.LM......MD.',
            'LMMMMLLMMMMD',
            'LMMMMMMMMMMD',
            '.LMMMMMMMMD.',
            '.LMMMMMMMMD.',
            '.LMMMMMMMMD.',
            '.LMMMMMMMMD.',
            '.DDDDDDDDDD.',
        ],
    },
    hender: {
        farge: '#6a4a2e',
        rader: [
            '...M.M.M....',
            '..LMLMLMM...',
            '..LMMMMMMD.M',
            '..LMMMMMMMMD',
            '..LMMMMMMMD.',
            '...LMMMMMD..',
            '...DDDDDD...',
        ],
    },
    belte: {
        farge: '#5a3a22',
        rader: ['............', '.....GGG....', 'LMMMMG.GMMMD', 'DDDDDGGGDDDD', '............'],
    },
    bein: {
        farge: '#5c4a36',
        rader: [
            'LMMMMMMMMMMD',
            'LMMMMMMMMMMD',
            'LMMMMDDMMMMD',
            'LMMMD..LMMMD',
            'LMMMD..LMMMD',
            'LMMMD..LMMMD',
            'LMMD....LMMD',
            'DDDD....DDDD',
        ],
    },
    fotter: {
        farge: '#5a3a22',
        rader: [
            '..LMMD......',
            '..LMMD......',
            '..LMMD......',
            '..LMMD......',
            '..LMMMMMD...',
            '..LMMMMMMMD.',
            '..DDDDDDDDD.',
        ],
    },
    amulett: {
        farge: GULL,
        rader: [
            '..S......S..',
            '...S....S...',
            '....S..S....',
            '.....SS.....',
            '....LMMD....',
            '...LMMMMD...',
            '...LMMMMD...',
            '....DMMD....',
        ],
    },
    skjold: {
        farge: '#9a6a3a',
        rader: [
            '...IIIIII...',
            '..IMMMMMMI..',
            '.IMMMLMMMMI.',
            'IMMMMLMMMMMI',
            'IMMMMIIMMMMI',
            'IMMMIGGIMMMI',
            'IMMMIGGIMMMI',
            'IMMMMIIMMMMI',
            'IMMMMLMMMMMI',
            '.IMMMLMMMMI.',
            '..IMMMMMMI..',
            '...IIIIII...',
        ],
    },
    brod: {
        farge: '#c8a064',
        rader: [
            '...LMMMMD...',
            '.LMMMDMMMMD.',
            'LMMDMMMMDMMD',
            'LMMMMMDMMMMD',
            '.DMMDMMMMMD.',
            '...DDDDDD...',
        ],
    },
    fisk: {
        farge: '#b8a88a',
        rader: ['..........D.', '.LMMMMMMD.DD', 'LMWDMMMMMMD.', 'LMMMMMMMMMDD', '.DDDDDDDDD.D'],
    },
    skaal: {
        farge: '#f2f0e6',
        rader: [
            '..LLMMMMMM..',
            '.LMMMMMMMMD.',
            'WWWWWWWWWWWW',
            '.WWWWWWWWWW.',
            '..WWWWWWWW..',
            '...DWWWWD...',
        ],
    },
    urt: {
        farge: '#f2f0e6',
        rader: [
            '..M.M..M.M..',
            '.LMMMMLMMMM.',
            '..MDM..MDM..',
            '....I..I....',
            '.....II.....',
            '.....I......',
            '.....I......',
            '....II......',
        ],
    },
};

/** Hvilken tegning en gjenstand får. Formen først, så plassen. */
function tegningFor(item: ItemDef): Tegning {
    if (item.weapon) return TEGNINGER[item.weapon.art] ?? TEGNINGER.sverd;
    if (item.forbruk) {
        if (item.id === 'torrfisk') return TEGNINGER.fisk;
        if (item.id === 'skyr') return TEGNINGER.skaal;
        if (item.id === 'ryllik') return TEGNINGER.urt;
        return TEGNINGER.brod;
    }
    const form = item.utseende?.form;
    switch (item.slot) {
        case 'hode':
            if (form === 'hette') return TEGNINGER.hette;
            if (form === 'lue') return TEGNINGER.lue;
            if (form === 'brillehjelm') return TEGNINGER.brillehjelm;
            return TEGNINGER.hjelm;
        case 'kappe':
            return TEGNINGER.kappe;
        case 'rustning':
            return TEGNINGER.bryst;
        case 'hender':
            return TEGNINGER.hender;
        case 'belte':
            return TEGNINGER.belte;
        case 'bein':
            return TEGNINGER.bein;
        case 'fotter':
            return TEGNINGER.fotter;
        case 'skjold':
            return TEGNINGER.skjold;
        default:
            return TEGNINGER.amulett;
    }
}

/** De tomme plassene på figuren viser en blek skygge av det som hører hjemme der. */
const SLOT_TEGNING: Record<string, string> = {
    hode: 'hjelm',
    amulett: 'amulett',
    kappe: 'kappe',
    rustning: 'bryst',
    hender: 'hender',
    belte: 'belte',
    bein: 'bein',
    fotter: 'fotter',
    vapen: 'sverd',
    skjold: 'skjold',
};

const KONTUR = '#0b0f19';

function Piksler({
    tegning,
    farge,
    spokelse,
}: {
    tegning: Tegning;
    farge: string;
    spokelse?: boolean;
}) {
    const rader = tegning.rader;
    const h = rader.length;
    const w = Math.max(...rader.map((r) => r.length));
    // Midtstilles i en 14x14-flate, så lave tegninger (belte, fisk) ikke
    // henger i taket av ruta.
    const ox = Math.floor((14 - w) / 2);
    const oy = Math.floor((14 - h) / 2);
    const palett: Record<string, string> = {
        M: farge,
        L: ramp(farge, 1),
        D: ramp(farge, -1),
        W: TRE,
        G: GULL,
        I: JERN,
        S: '#e8dfc4',
    };
    const fylt = (x: number, y: number) => {
        const t = rader[y]?.[x];
        return t !== undefined && t !== '.';
    };
    const ruter: React.ReactNode[] = [];
    if (!spokelse) {
        for (let y = -1; y <= h; y++) {
            for (let x = -1; x <= w; x++) {
                if (fylt(x, y)) continue;
                if (fylt(x - 1, y) || fylt(x + 1, y) || fylt(x, y - 1) || fylt(x, y + 1)) {
                    ruter.push(
                        <rect
                            key={`k${x},${y}`}
                            x={x + ox}
                            y={y + oy}
                            width={1}
                            height={1}
                            fill={KONTUR}
                        />
                    );
                }
            }
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const t = rader[y][x];
            if (!t || t === '.') continue;
            ruter.push(
                <rect
                    key={`${x},${y}`}
                    x={x + ox}
                    y={y + oy}
                    width={1}
                    height={1}
                    fill={spokelse ? 'currentColor' : palett[t]}
                />
            );
        }
    }
    return (
        <svg viewBox="0 0 14 14" shapeRendering="crispEdges" className="h-full w-full" aria-hidden>
            {ruter}
        </svg>
    );
}

export const GjenstandIkon = memo(function GjenstandIkon({ item }: { item: ItemDef }) {
    const tegning = tegningFor(item);
    return <Piksler tegning={tegning} farge={item.utseende?.farge ?? tegning.farge} />;
});

/** Den bleke skyggen i en tom plass. */
export const TomPlassIkon = memo(function TomPlassIkon({ slot }: { slot: string }) {
    return (
        <span className="block h-full w-full text-white/10">
            <Piksler
                tegning={TEGNINGER[SLOT_TEGNING[slot]] ?? TEGNINGER.amulett}
                farge="#fff"
                spokelse
            />
        </span>
    );
});
