// Musikken i «Hunden spiste leksa». Én låt per område, pluss sjefskamp, siste sjef og slutt.
//
// Låtene er skrevet som akkorder og mønstre, og melodien lages av en fast frø-verdi, så
// hvert område har sin egen gjenkjennelige låt. Låta er bygget i lag som skrus av og på
// etter hva som skjer i spillet:
//   0  rolig: bare akkorder og bass (eleven har ikke klikket på en stund)
//   1  + hi-hat og perkusjon
//   2  + tromme og melodi (vanlig spill)
//   3  + arpeggio og ekstra trøkk (gullstjerne, full flyt)
// Hver åttende takt kommer et trommebrekk, og hver fjerde runde et «break» der trommene
// og melodien hviler. Alle endringer skjer på taktstart, så musikken aldri hakker.
// Når læreren kommer, lukker et filter seg og en klokke tikker. Menyer demper musikken.
//
// Tone.js lastes først når eleven skrur på musikk, så den koster ingenting ellers.

type ToneLib = typeof import('tone');

export type SongId = string; // 'era0'...'era8', 'boss', 'final', 'end'

export interface MusicWant {
    song: SongId;
    intensity: number; // 0-3
    tension: boolean;
    duck: boolean;
    hevn: boolean; // Hundens hevn: alt i moll og litt saktere
}

/* ================= Låtene ================= */
interface Part {
    inst: string;
    pat: string; // 16 tegn per takt. Se play() for hva tegnene betyr
    min?: number; // laveste intensitet der delen spiller
    send?: number; // romklang i dB (lavere = tørrere)
    oct?: number; // oktav-forskyvning
}
interface Song {
    bpm: number;
    swing?: number;
    key: number; // grunntone (midi)
    mode: 'major' | 'minor' | 'dorian' | 'mixo';
    chords: string[]; // én akkord per takt
    lead: string; // instrument for melodien
    leadSend?: number;
    center: number; // midi-tone melodien holder seg rundt
    rhythms: string[]; // rytmemaler for melodien
    maxLen?: number; // lengste tone i melodien (sekstendeler)
    seed: number;
    bass?: Part;
    comp?: Part;
    pad?: Part;
    arp?: Part;
    drums: Record<string, string>; // k s h o t p c ... per instrument
    drumKit?: Record<string, string>; // hvilket trommeinstrument hver bokstav bruker
    leadDelay?: boolean;
}

const SONGS: Record<SongId, Song> = {
    // Klasserom 10B: lett og glad, plystrelåt
    era0: {
        bpm: 100,
        swing: 0.12,
        key: 60,
        mode: 'major',
        chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm7', 'G7'],
        lead: 'whistle',
        center: 76,
        rhythms: ['x.x.x...x.x.x...', 'x...x.x.x.......', '..x.x.x.x...x...', 'x.x...x.x.x.x...'],
        maxLen: 4,
        seed: 11,
        bass: { inst: 'bassUp', pat: 'R.....R.F...O...' },
        comp: { inst: 'keys', pat: 'x..x..x...x..x..', send: -14 },
        arp: { inst: 'marimba', pat: 'x.xx.xx.x.xx.x.x', min: 3, send: -16 },
        drums: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', p: '..x...x...x...x.' },
        drumKit: { p: 'shaker' },
    },
    // Rektors kontor: snikete jazz med gående bass
    era1: {
        bpm: 112,
        swing: 0.38,
        key: 62,
        mode: 'dorian',
        chords: ['Dm7', 'Dm7', 'Gm7', 'A7', 'Dm7', 'Bb7', 'A7', 'Dm7'],
        lead: 'pizz',
        center: 74,
        rhythms: ['x..x......x.x...', '..x..x..x.......', 'x.x.x.x.....x...', '....x..x..x.x...'],
        maxLen: 3,
        seed: 23,
        bass: { inst: 'bassUp', pat: 'R...T...F...A...' },
        comp: { inst: 'rhodes', pat: '...x.......x....', send: -10 },
        arp: { inst: 'vibes', pat: 'x..x..x..x..x...', min: 3, send: -8 },
        drums: { k: 'x.........x.....', s: '....b.......b...', h: 'x...x.x.x...x.x.', c: '..........x.....' },
        drumKit: { h: 'ride', c: 'rim' },
    },
    // Kommunestyret: humpa-marsj
    era2: {
        bpm: 116,
        key: 65,
        mode: 'major',
        chords: ['F', 'Bb', 'C7', 'F', 'F', 'Bb', 'C7', 'F'],
        lead: 'horn',
        center: 72,
        rhythms: ['x...x...x.x.x...', 'x.......x...x...', 'x.x.x.x.x...x...', 'x...x.x.x.......'],
        maxLen: 6,
        seed: 37,
        bass: { inst: 'tuba', pat: 'R.......F.......' },
        comp: { inst: 'brass', pat: '....x.......x...', send: -14 },
        arp: { inst: 'bell', pat: 'x...x...x...x...', min: 3, send: -10, oct: 1 },
        drums: { k: 'x.......x.......', s: '....x.......x.x.', p: '..x...x...x...x.', o: 'x...............' },
        drumKit: { p: 'snareGhost', o: 'cymbal' },
    },
    // Stortinget: høytidelig, strykere og pauker
    era3: {
        bpm: 84,
        key: 58,
        mode: 'major',
        chords: ['Bb', 'Gm', 'Eb', 'F', 'Bb', 'Eb', 'F', 'Bb'],
        lead: 'horn',
        leadSend: -6,
        center: 70,
        rhythms: ['x.......x...x...', 'x...x...x.......', 'x.....x.x...x...', 'x...............'],
        maxLen: 8,
        seed: 41,
        bass: { inst: 'cello', pat: 'R.......R.......' },
        pad: { inst: 'strings', pat: 'p...............', send: -4 },
        arp: { inst: 'harp', pat: 'x.x.x.x.x.x.x.x.', min: 3, send: -6 },
        drums: { t: 'x.......x...x.x.', s: '............x.x.', o: 'x...............' },
        drumKit: { t: 'timp', o: 'cymbal', s: 'snareSoft' },
    },
    // FNs sikkerhetsråd: verdensmusikk, marimba og bongo
    era4: {
        bpm: 104,
        key: 57,
        mode: 'dorian',
        chords: ['Am7', 'D', 'Am7', 'D', 'Fmaj7', 'G', 'Em7', 'Am7'],
        lead: 'flute',
        center: 76,
        rhythms: ['x..x..x...x.x...', 'x.x...x...x.....', '..x.x..x..x.x...', 'x..x..x.x.......'],
        maxLen: 4,
        seed: 53,
        bass: { inst: 'bassPluck', pat: 'R..R..R...R..F..' },
        pad: { inst: 'pad', pat: 'p...............', send: -6 },
        arp: { inst: 'marimba', pat: 'x.xx.xx.x.xx.x.x', min: 1, send: -14 },
        drums: { k: 'x.....x...x.....', p: '..x.x..x..x.xx..', h: 'x.x.x.x.x.x.x.x.' },
        drumKit: { p: 'bongo', h: 'shaker' },
    },
    // Universet: synthwave
    era5: {
        bpm: 86,
        key: 52,
        mode: 'minor',
        chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'],
        lead: 'leadSaw',
        leadDelay: true,
        leadSend: -6,
        center: 76,
        rhythms: ['x.......x.x.x...', 'x...x...x.......', 'x.x.x...x...x.x.', 'x...........x...'],
        maxLen: 8,
        seed: 61,
        bass: { inst: 'synthBass', pat: 'R.R.R.R.R.R.R.R.' },
        pad: { inst: 'pad', pat: 'p...............', send: -3 },
        arp: { inst: 'arpSaw', pat: 'xxxxxxxxxxxxxxxx', min: 2, send: -8 },
        drums: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
        drumKit: { s: 'snareBig' },
    },
    // Multiverset: chiptune som bytter toneart
    era6: {
        bpm: 132,
        key: 60,
        mode: 'major',
        chords: ['C', 'Am', 'F', 'G', 'Eb', 'Cm', 'Ab', 'Bb'],
        lead: 'chip',
        center: 76,
        rhythms: ['x.x.x.xxx.x.x...', 'x..xx..xx.x.....', 'xxx.x.x.x.x.x.x.', 'x.x...x.x.x.xx..'],
        maxLen: 3,
        seed: 67,
        bass: { inst: 'chipBass', pat: 'R.R.O.R.R.R.O.R.' },
        comp: { inst: 'chipSoft', pat: '..x...x...x...x.', send: -20 },
        arp: { inst: 'chipSoft', pat: 'xxxxxxxxxxxxxxxx', min: 3, send: -20, oct: 1 },
        drums: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
        drumKit: { k: 'chipKick', s: 'chipSnare', h: 'chipHat' },
    },
    // Tidens ende: spilledåse og klokker
    era7: {
        bpm: 72,
        key: 62,
        mode: 'minor',
        chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'F', 'Gm', 'A7'],
        lead: 'musicbox',
        leadSend: -2,
        center: 81,
        rhythms: ['x...x...x.x.....', 'x.......x...x...', 'x.x.x...x.......', 'x...........x...'],
        maxLen: 8,
        seed: 71,
        bass: { inst: 'sub', pat: 'R...............' },
        pad: { inst: 'darkPad', pat: 'p...............', send: -2 },
        arp: { inst: 'musicbox', pat: 'x...x...x...x...', min: 1, send: -4, oct: -1 },
        drums: { p: 'x...y...x...y...', k: 'x..x............' },
        drumKit: { p: 'clock', k: 'heart' },
    },
    // Lærerværelset: bossa nova og kaffe
    era8: {
        bpm: 108,
        key: 55,
        mode: 'major',
        chords: ['Gmaj7', 'Gmaj7', 'Am7', 'D7', 'Bm7', 'E7', 'Am7', 'D7'],
        lead: 'vibes',
        center: 74,
        rhythms: ['x..x..x...x.....', '..x.x..x..x.....', 'x...x.x.x..x....', 'x..x....x.x.....'],
        maxLen: 5,
        seed: 83,
        bass: { inst: 'bassUp', pat: 'R.....F.R.....F.' },
        comp: { inst: 'nylon', pat: 'x..x..x...x..x..', send: -12 },
        arp: { inst: 'rhodes', pat: '..x...x...x...x.', min: 3, send: -10 },
        drums: { c: 'x..x..x...x..x..', h: 'xxxxxxxxxxxxxxxx', k: 'x.....x.x.....x.' },
        drumKit: { c: 'rim', h: 'shaker', k: 'kickSoft' },
    },
    // Sjefskamp: rask og truende
    boss: {
        bpm: 148,
        key: 48,
        mode: 'minor',
        chords: ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Ab', 'G7'],
        lead: 'leadSaw',
        center: 72,
        rhythms: ['x.x.x...x.x.x...', 'x..x..x.x.......', 'xxx.x.x.x.x.x...', 'x...x...x.x.x.x.'],
        maxLen: 4,
        seed: 97,
        bass: { inst: 'synthBass', pat: 'R.R.R.R.O.R.R.R.' },
        comp: { inst: 'brass', pat: 'x.....x.....x...', send: -14 },
        arp: { inst: 'arpSaw', pat: 'x.x.x.x.x.x.x.x.', min: 3, send: -12 },
        drums: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', t: '..............xx' },
        drumKit: { s: 'snareBig' },
    },
    // Den siste sjefen: orgel og pauker
    final: {
        bpm: 136,
        key: 50,
        mode: 'minor',
        chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'E7', 'A7'],
        lead: 'organ',
        leadSend: -6,
        center: 74,
        rhythms: ['x.......x.x.x...', 'x...x...x...x...', 'x.x.x.x.x.......', 'x...........x.x.'],
        maxLen: 8,
        seed: 101,
        bass: { inst: 'synthBass', pat: 'R...R...R...R.R.' },
        comp: { inst: 'organ', pat: 'x.......x.......', send: -6 },
        arp: { inst: 'arpSaw', pat: 'x.x.x.x.x.x.x.x.', min: 2, send: -10 },
        drums: { k: 'x...x...x...x...', s: '....x.......x...', t: 'x.......x...x.x.', o: 'x...............' },
        drumKit: { t: 'timp', o: 'cymbal', s: 'snareBig' },
    },
    // Slutten og rulleteksten: klasserom-låta som stor ballade
    end: {
        bpm: 80,
        key: 60,
        mode: 'major',
        chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
        lead: 'horn',
        leadSend: -4,
        center: 74,
        rhythms: ['x.x.x...x.x.x...', 'x...x.x.x.......', '..x.x.x.x...x...', 'x.x...x.x.x.x...'],
        maxLen: 8,
        seed: 11,
        bass: { inst: 'cello', pat: 'R.......F.......' },
        pad: { inst: 'strings', pat: 'p...............', send: -3 },
        arp: { inst: 'harp', pat: 'x.x.x.x.x.x.x.x.', min: 1, send: -6 },
        drums: { t: 'x...............', o: 'x...............', k: 'x.......x.......', s: '....x.......x...' },
        drumKit: { t: 'timp', o: 'cymbal', s: 'snareSoft', k: 'kickSoft' },
    },
};

/* ================= Musikkteori ================= */
const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixo: [0, 2, 4, 5, 7, 9, 10],
};
const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const QUAL: Record<string, number[]> = {
    '': [0, 4, 7],
    m: [0, 3, 7],
    '7': [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    dim: [0, 3, 6],
    sus: [0, 5, 7],
    m7b5: [0, 3, 6, 10],
    '6': [0, 4, 7, 9],
    m6: [0, 3, 7, 9],
};
// Hundens hevn: alt blir moll
const MINOR_OF: Record<string, string> = { '': 'm', '7': 'm7', maj7: 'm7', '6': 'm6', sus: 'm' };

interface Chord {
    root: number; // 0-11
    tones: number[]; // intervaller
}
function parseChord(s: string, hevn: boolean): Chord {
    let root = NOTE[s[0]];
    let i = 1;
    if (s[1] === 'b') {
        root--;
        i++;
    } else if (s[1] === '#') {
        root++;
        i++;
    }
    let q = s.slice(i);
    if (hevn && q in MINOR_OF) q = MINOR_OF[q];
    return { root: (root + 12) % 12, tones: QUAL[q] ?? QUAL[''] };
}

function rng(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Den nærmeste tonen i `pcs` (tonetrinn 0-11) til midi-tonen m. */
function snap(m: number, pcs: number[]): number {
    let best = m;
    let bd = 99;
    for (let d = 0; d <= 6; d++) {
        for (const c of [m - d, m + d]) {
            if (pcs.includes(((c % 12) + 12) % 12) && d < bd) {
                bd = d;
                best = c;
            }
        }
        if (bd < 99) break;
    }
    return best;
}

interface MNote {
    s: number; // steg i takten
    m: number; // midi
    d: number; // lengde i steg
}

/**
 * Melodien: 8 takter i formen A A' B A''. A' er samme rytme og kontur som A, flyttet til
 * de nye akkordene (en «sekvens»). Tunge slag treffer alltid en akkordtone, lette slag
 * går trinnvis i skalaen. Siste takt lander på grunntonen.
 */
function makeMelody(song: Song, scale: number[], chords: Chord[], variant: number): MNote[][] {
    const r = rng(song.seed * 7919 + variant * 104729);
    const key = song.key % 12;
    const scalePcs = scale.map((x) => (key + x) % 12);
    const deg2midi = (d: number) => {
        const o = Math.floor(d / 7);
        const k = ((d % 7) + 7) % 7;
        return song.key + 12 + o * 12 + scale[k];
    };
    // Skalatrinnet nærmest midi-tonen
    const midi2deg = (m: number) => {
        let best = 0;
        let bd = 99;
        for (let d = -14; d < 28; d++) {
            const x = Math.abs(deg2midi(d) - m);
            if (x < bd) {
                bd = x;
                best = d;
            }
        }
        return best;
    };
    const center = midi2deg(song.center);
    const rhythm = (k: number) => song.rhythms[k % song.rhythms.length];
    const onsets = (pat: string) => [...pat].map((c, i) => (c === 'x' ? i : -1)).filter((i) => i >= 0);
    const chordPcs = (c: Chord) => c.tones.map((t) => (c.root + t) % 12);
    const len = (on: number[], i: number) => Math.min((on[i + 1] ?? 16) - on[i], song.maxLen ?? 4);

    // Kontur: trinn relativt til forrige tone
    const contour = (n: number) => {
        const out: number[] = [];
        for (let i = 0; i < n; i++) {
            const x = r();
            out.push(x < 0.3 ? 1 : x < 0.55 ? -1 : x < 0.68 ? 2 : x < 0.8 ? -2 : x < 0.88 ? 0 : x < 0.94 ? 3 : -3);
        }
        return out;
    };
    function realize(pat: string, steps: number[], start: number, chord: Chord, last?: boolean): [MNote[], number] {
        const on = onsets(pat);
        const notes: MNote[] = [];
        let d = start;
        on.forEach((s, i) => {
            d += steps[i % steps.length] ?? 0;
            // Hold melodien i et fornuftig toneleie
            if (d > center + 5) d -= 2;
            if (d < center - 5) d += 2;
            let m = deg2midi(d);
            if (s % 4 === 0) m = snap(m, chordPcs(chord));
            else m = snap(m, scalePcs);
            notes.push({ s, m, d: len(on, i) });
        });
        if (last) {
            // Kadens: siste tone er grunntonen i akkorden, lang
            const rootM = snap(deg2midi(center), [chord.root]);
            const s0 = on.length > 2 ? on[Math.floor(on.length / 2)] : 0;
            const keep = notes.filter((n) => n.s < s0);
            keep.push({ s: s0, m: rootM, d: 16 - s0 });
            return [keep, midi2deg(rootM)];
        }
        return [notes, midi2deg(notes[notes.length - 1]?.m ?? deg2midi(d))];
    }

    const cA = [contour(8), contour(8)];
    const cB = [contour(8), contour(8)];
    const bars: MNote[][] = [];
    let at = center;
    for (let b = 0; b < 8; b++) {
        const chord = chords[b % chords.length];
        const isA = b < 4 || b === 6;
        const k = b % 2;
        const pat = isA ? rhythm(k) : rhythm(2 + k);
        const c = isA ? cA[k] : cB[k];
        // A' starter fra akkordens grunntone, så motivet flyttes med harmonien
        if (b === 2 || b === 6) at = midi2deg(snap(deg2midi(center), [chord.root]));
        const [notes, end] = realize(pat, c, at, chord, b === 7);
        bars.push(notes);
        at = end;
    }
    return bars;
}

/* ================= Motoren ================= */
interface Inst {
    play: (m: number | number[], dur: number, time: number, vel: number) => void;
    nodes: { dispose: () => void }[];
}

export interface Music {
    enable: () => Promise<void>;
    disable: () => void;
    setVolume: (v: number) => void;
    set: (w: Partial<MusicWant>) => void;
    destroy: () => void;
}

export interface MusicDebug {
    /** Kalles for hver tone som spilles: del, midi-toner, akkord (grunntone 0-11), steg */
    onNote?: (part: string, m: number[], chordRoot: number, chordTones: number[], step: number, bar: number) => void;
    /** Måler lydnivået per del (dB) */
    meters?: boolean;
}

export function createMusic(debug: MusicDebug = {}): Music & { levels: () => Record<string, number> } {
    let T: ToneLib | null = null;
    let loading: Promise<void> | null = null;
    let on = false;
    let dead = false;
    let volume = 0.6;
    const want: MusicWant = { song: 'era0', intensity: 2, tension: false, duck: false, hevn: false };

    // Lydkjeden: låtbuss -> filter (spenning) -> demping (menyer) -> kompressor -> volum
    let master: import('tone').Volume | null = null;
    let duckG: import('tone').Gain | null = null;
    let filt: import('tone').Filter | null = null;
    let comp: import('tone').Compressor | null = null;
    let rev: import('tone').Reverb | null = null;
    let revIn: import('tone').Channel | null = null;
    let repeatId = -1;

    interface Playing {
        id: SongId;
        hevn: boolean;
        song: Song;
        chords: Chord[];
        scale: number[];
        bus: import('tone').Gain;
        insts: Record<string, Inst>;
        mel: MNote[][];
        variant: number;
    }
    let cur: Playing | null = null;
    let bar = 0; // takt i låta
    let step = 0; // sekstendel i takten
    let level = 2; // intensiteten som faktisk spiller
    let prevVoicing: number[] = [];
    let arpI = 0;
    let rr = 0;

    const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
    const meterOf: Record<string, import('tone').Meter> = {};
    const peakOf: Record<string, number> = {};

    /* ---------- Instrumenter ---------- */
    function inst(name: string, bus: import('tone').Gain, send: number): Inst {
        const t = T as ToneLib;
        const ch = new t.Channel({ volume: 0 }).connect(bus);
        ch.send('hsl-rev', send);
        const nodes: { dispose: () => void }[] = [ch];
        if (debug.meters) {
            const mt = new t.Meter({ smoothing: 0.3 });
            ch.connect(mt);
            nodes.push(mt);
            meterOf[name] = mt;
        }
        const out = <N extends { connect: (d: import('tone').InputNode) => unknown; dispose: () => void }>(n: N, ...fx: import('tone').ToneAudioNode[]) => {
            let last: { connect: (d: import('tone').InputNode) => unknown } = n;
            for (const f of fx) {
                last.connect(f);
                last = f;
                nodes.push(f);
            }
            last.connect(ch);
            nodes.push(n);
            return n;
        };
        const poly = <O extends object>(voice: unknown, opts: O, vol: number, ...fx: import('tone').ToneAudioNode[]) => {
            const p = new t.PolySynth(voice as typeof t.Synth, opts as never);
            p.maxPolyphony = 10;
            p.volume.value = vol;
            out(p, ...fx);
            return (m: number | number[], dur: number, time: number, vel: number) =>
                p.triggerAttackRelease(Array.isArray(m) ? m.map(hz) : hz(m), dur, time, vel);
        };
        const mono = (s: import('tone').MonoSynth | import('tone').Synth | import('tone').FMSynth, vol: number, ...fx: import('tone').ToneAudioNode[]) => {
            s.volume.value = vol;
            out(s, ...fx);
            return (m: number | number[], dur: number, time: number, vel: number) =>
                (s as import('tone').Synth).triggerAttackRelease(hz(Array.isArray(m) ? m[0] : m), dur, time, vel);
        };
        const lp = (f: number, q = 1) => new t.Filter({ frequency: f, type: 'lowpass', Q: q });
        const hp = (f: number) => new t.Filter({ frequency: f, type: 'highpass' });
        const bp = (f: number, q = 1) => new t.Filter({ frequency: f, type: 'bandpass', Q: q });
        const noise = (type: 'white' | 'pink' | 'brown', decay: number, vol: number, ...fx: import('tone').ToneAudioNode[]) => {
            const n = new t.NoiseSynth({ noise: { type }, envelope: { attack: 0.001, decay, sustain: 0, release: decay } });
            n.volume.value = vol;
            out(n, ...fx);
            return (_m: number | number[], dur: number, time: number, vel: number) => n.triggerAttackRelease(Math.min(dur, decay), time, vel);
        };
        const membrane = (note: number, o: { pitchDecay: number; octaves: number; decay: number }, vol: number, ...fx: import('tone').ToneAudioNode[]) => {
            const n = new t.MembraneSynth({ pitchDecay: o.pitchDecay, octaves: o.octaves, envelope: { attack: 0.001, decay: o.decay, sustain: 0, release: o.decay } });
            n.volume.value = vol;
            out(n, ...fx);
            return (m: number | number[], _dur: number, time: number, vel: number) =>
                n.triggerAttackRelease(hz(typeof m === 'number' && m > 0 ? m : note), o.decay, time, vel);
        };
        let play: Inst['play'];
        switch (name) {
            /* ----- tangenter og melodi ----- */
            case 'keys':
                play = poly(t.FMSynth, { harmonicity: 3, modulationIndex: 1.4, envelope: { attack: 0.004, decay: 0.7, sustain: 0.08, release: 0.6 }, modulationEnvelope: { attack: 0.004, decay: 0.25, sustain: 0, release: 0.2 } }, -10);
                break;
            case 'rhodes':
                play = poly(t.FMSynth, { harmonicity: 1, modulationIndex: 5, envelope: { attack: 0.004, decay: 1.4, sustain: 0.25, release: 1 }, modulationEnvelope: { attack: 0.002, decay: 0.5, sustain: 0.05, release: 0.4 } }, -11, new t.Chorus(3, 2.5, 0.4).start());
                break;
            case 'marimba':
                play = poly(t.FMSynth, { harmonicity: 4, modulationIndex: 1.8, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.3 }, modulationEnvelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 } }, -7);
                break;
            case 'vibes':
                play = poly(t.FMSynth, { harmonicity: 4, modulationIndex: 1.2, envelope: { attack: 0.002, decay: 1.3, sustain: 0, release: 1.2 }, modulationEnvelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 } }, 0, new t.Tremolo(5, 0.35).start());
                break;
            case 'bell':
            case 'musicbox':
                play = poly(t.FMSynth, { harmonicity: name === 'bell' ? 3.5 : 5.07, modulationIndex: name === 'bell' ? 6 : 9, envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 1.6 }, modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.4 } }, name === 'bell' ? -8 : 0);
                break;
            case 'harp':
                play = poly(t.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.002, decay: 1.1, sustain: 0, release: 1 } }, -15);
                break;
            case 'pizz':
                play = poly(t.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0, release: 0.12 } }, -9, lp(2600));
                break;
            case 'whistle':
            case 'flute': {
                const s = new t.Synth({ oscillator: { type: 'sine' }, envelope: { attack: name === 'flute' ? 0.05 : 0.02, decay: 0.1, sustain: 0.8, release: 0.12 } });
                s.portamento = name === 'whistle' ? 0.025 : 0.01;
                play = mono(s, name === 'flute' ? -11 : -11, new t.Vibrato(5.5, 0.12));
                break;
            }
            case 'horn':
                play = poly(t.Synth, { oscillator: { type: 'fatsawtooth', count: 2, spread: 12 }, envelope: { attack: 0.06, decay: 0.3, sustain: 0.7, release: 0.35 } }, -6, lp(1300, 0.7));
                break;
            case 'brass':
                play = poly(t.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 18 }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.2 } }, -11, lp(1900, 1));
                break;
            case 'leadSaw': {
                const s = new t.MonoSynth({ oscillator: { type: 'fatsawtooth', count: 2, spread: 14 } as never, envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 }, filter: { Q: 1, type: 'lowpass' }, filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3, baseFrequency: 700, octaves: 2.5 } });
                s.portamento = 0.02;
                play = mono(s, -6, new t.Vibrato(5, 0.06));
                break;
            }
            case 'organ':
                play = poly(t.Synth, { oscillator: { type: 'custom', partials: [1, 0.7, 0.45, 0, 0.3, 0, 0.18, 0.12] } as never, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.25 } }, -10, new t.Tremolo(6, 0.25).start());
                break;
            case 'chip':
                play = poly(t.Synth, { oscillator: { type: 'pulse', width: 0.25 } as never, envelope: { attack: 0.001, decay: 0.12, sustain: 0.5, release: 0.05 } }, -14);
                break;
            case 'chipSoft':
                play = poly(t.Synth, { oscillator: { type: 'pulse', width: 0.125 } as never, envelope: { attack: 0.001, decay: 0.08, sustain: 0.2, release: 0.04 } }, -17);
                break;
            case 'nylon': {
                const vs = [0, 1, 2, 3, 4].map(() => {
                    const p = new t.PluckSynth({ attackNoise: 0.8, dampening: 2800, resonance: 0.93 });
                    p.volume.value = -13;
                    out(p);
                    return p;
                });
                play = (m, dur, time) => {
                    const ms = Array.isArray(m) ? m : [m];
                    // Gitar: strengene slås an litt etter hverandre
                    ms.forEach((x, k) => vs[(rr + k) % vs.length].triggerAttackRelease(hz(x), dur, time + k * 0.012));
                    rr = (rr + ms.length) % vs.length;
                };
                break;
            }
            /* ----- flater ----- */
            case 'pad':
            case 'darkPad':
                play = poly(t.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 28 }, envelope: { attack: 0.9, decay: 0.5, sustain: 0.8, release: 2.2 } }, name === 'pad' ? -18 : -17, lp(name === 'pad' ? 1300 : 650, 0.6), new t.Chorus(0.6, 4, 0.5).start());
                break;
            case 'strings':
                play = poly(t.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 22 }, envelope: { attack: 0.35, decay: 0.4, sustain: 0.85, release: 1.4 } }, -17, lp(2200, 0.5));
                break;
            case 'arpSaw':
                play = poly(t.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.002, decay: 0.12, sustain: 0.1, release: 0.1 } }, -13, lp(2400, 2));
                break;
            /* ----- bass ----- */
            case 'bassUp':
                play = mono(new t.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.004, decay: 0.35, sustain: 0.25, release: 0.12 } }), -6, lp(900));
                break;
            case 'cello':
                play = mono(new t.Synth({ oscillator: { type: 'fatsawtooth', count: 2, spread: 10 } as never, envelope: { attack: 0.08, decay: 0.3, sustain: 0.8, release: 0.6 } }), -5, lp(700, 0.6));
                break;
            case 'tuba':
                play = mono(new t.MonoSynth({ oscillator: { type: 'square' }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.1 }, filter: { Q: 1, type: 'lowpass' }, filterEnvelope: { attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.1, baseFrequency: 160, octaves: 1.6 } }), -10);
                break;
            case 'bassPluck':
                play = mono(new t.MonoSynth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.004, decay: 0.25, sustain: 0.3, release: 0.12 }, filter: { Q: 2, type: 'lowpass' }, filterEnvelope: { attack: 0.002, decay: 0.12, sustain: 0.15, release: 0.1, baseFrequency: 140, octaves: 2.6 } }), -5);
                break;
            case 'synthBass':
                play = mono(new t.MonoSynth({ oscillator: { type: 'fatsawtooth', count: 2, spread: 10 } as never, envelope: { attack: 0.004, decay: 0.2, sustain: 0.5, release: 0.1 }, filter: { Q: 3, type: 'lowpass' }, filterEnvelope: { attack: 0.003, decay: 0.18, sustain: 0.2, release: 0.1, baseFrequency: 110, octaves: 2.8 } }), -3);
                break;
            case 'sub':
                play = mono(new t.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.2 } }), -8);
                break;
            case 'chipBass':
                play = mono(new t.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0.6, release: 0.03 } }), -7);
                break;
            /* ----- trommer ----- */
            case 'kick':
                play = membrane(33, { pitchDecay: 0.045, octaves: 6, decay: 0.32 }, -7);
                break;
            case 'kickSoft':
                play = membrane(36, { pitchDecay: 0.03, octaves: 4, decay: 0.25 }, -14);
                break;
            case 'heart':
                play = membrane(31, { pitchDecay: 0.02, octaves: 3, decay: 0.3 }, -10, lp(300));
                break;
            case 'chipKick':
                play = membrane(36, { pitchDecay: 0.02, octaves: 5, decay: 0.12 }, -9);
                break;
            case 'snare':
            case 'snareBig':
            case 'snareSoft':
                play = noise('white', name === 'snareBig' ? 0.2 : 0.13, name === 'snareSoft' ? -10 : name === 'snareBig' ? -3 : -4, bp(1800, 0.7));
                break;
            case 'snareGhost':
                play = noise('white', 0.05, -13, bp(2500, 1));
                break;
            case 'chipSnare':
                play = noise('white', 0.08, -8, hp(1500));
                break;
            case 'brush':
                play = noise('pink', 0.22, -16, lp(5000));
                break;
            case 'hat':
                play = noise('white', 0.035, -15, hp(8000));
                break;
            case 'chipHat':
                play = noise('white', 0.02, -16, hp(9000));
                break;
            case 'ride':
                play = noise('white', 0.18, -20, hp(6500), bp(9000, 0.5));
                break;
            case 'openHat':
            case 'cymbal':
                play = noise('white', name === 'cymbal' ? 1.4 : 0.25, name === 'cymbal' ? -20 : -18, hp(6000));
                break;
            case 'shaker':
                play = noise('white', 0.05, -21, hp(5500));
                break;
            case 'rim':
                play = membrane(84, { pitchDecay: 0.002, octaves: 0.6, decay: 0.03 }, -20, hp(900));
                break;
            case 'clock':
                play = membrane(96, { pitchDecay: 0.001, octaves: 0.4, decay: 0.025 }, -12, hp(1500));
                break;
            case 'bongo':
                play = membrane(67, { pitchDecay: 0.008, octaves: 1.6, decay: 0.14 }, -15);
                break;
            case 'tom':
                play = membrane(45, { pitchDecay: 0.03, octaves: 2, decay: 0.28 }, -12);
                break;
            case 'timp':
                play = membrane(38, { pitchDecay: 0.09, octaves: 1.3, decay: 1.1 }, -9, lp(900));
                break;
            default:
                play = poly(t.Synth, {}, -24);
        }
        return { play, nodes };
    }

    const DRUM_DEFAULT: Record<string, string> = { k: 'kick', s: 'snare', h: 'hat', o: 'openHat', t: 'tom', p: 'shaker', c: 'rim' };

    function build(id: SongId, hevn: boolean): Playing {
        const t = T as ToneLib;
        const song = SONGS[id] ?? SONGS.era0;
        const scale = hevn ? SCALES.minor : SCALES[song.mode];
        const chords = song.chords.map((c) => parseChord(c, hevn));
        const bus = new t.Gain(0).connect(filt as import('tone').Filter);
        const insts: Record<string, Inst> = {};
        insts.lead = inst(song.lead, bus, song.leadSend ?? -12);
        if (song.leadDelay) {
            // Ekko på synthwave-melodien
            const d = new t.FeedbackDelay('8n.', 0.3);
            d.wet.value = 0.25;
            const ch = insts.lead.nodes[0] as import('tone').Channel;
            ch.disconnect();
            ch.chain(d, bus);
            insts.lead.nodes.push(d);
        }
        for (const k of ['bass', 'comp', 'pad', 'arp'] as const) {
            const p = song[k];
            if (p) insts[k] = inst(p.inst, bus, p.send ?? (k === 'bass' ? -30 : -14));
        }
        const kit = { ...DRUM_DEFAULT, ...(song.drumKit ?? {}) };
        for (const d of Object.keys(song.drums)) insts['d_' + d] = inst(kit[d], bus, d === 's' || d === 't' || d === 'o' ? -14 : -24);
        // Trommebrekket trenger skarptromme og tam selv om låta ikke har dem
        if (!insts.d_s) insts.d_s = inst('snareSoft', bus, -18);
        if (!insts.d_y && song.drums.p?.includes('y')) insts.d_y = inst('clock', bus, -20);
        insts.tick = inst('clock', bus, -22);
        if (debug.onNote) {
            for (const [k, v] of Object.entries(insts)) {
                const orig = v.play;
                v.play = (m, d, tm, vl) => {
                    const c = (cur ?? { chords })!.chords[bar % song.chords.length];
                    debug.onNote?.(k, Array.isArray(m) ? m : [m], c.root, c.tones, step, bar);
                    orig(m, d, tm, vl);
                };
            }
        }
        return { id, hevn, song, chords, scale, bus, insts, mel: makeMelody(song, scale, chords, 0), variant: 0 };
    }

    function retire(p: Playing) {
        const t = T as ToneLib;
        p.bus.gain.rampTo(0, 1.2);
        window.setTimeout(() => {
            for (const i of Object.values(p.insts)) for (const n of i.nodes) n.dispose();
            p.bus.dispose();
        }, 2600);
        void t;
    }

    function switchTo(id: SongId, hevn: boolean, time: number) {
        const t = T as ToneLib;
        if (cur) retire(cur);
        cur = build(id, hevn);
        const bpm = cur.song.bpm * (hevn ? 0.92 : 1);
        const tr = t.getTransport();
        tr.bpm.rampTo(bpm, 0.5);
        tr.swing = cur.song.swing ?? 0;
        tr.swingSubdivision = '16n';
        cur.bus.gain.setValueAtTime(0, time);
        cur.bus.gain.linearRampToValueAtTime(1, time + 1.2);
        bar = 0;
        prevVoicing = [];
    }

    /* ---------- Akkordvoicing: nærmeste omvending til forrige akkord ---------- */
    function voicing(c: Chord, center: number): number[] {
        const base = c.tones.map((x) => c.root + x);
        let best: number[] = [];
        let bd = Infinity;
        for (let o = -1; o <= 1; o++) {
            for (let inv = 0; inv < base.length; inv++) {
                const v = base.map((x, i) => center - 12 + o * 12 + x + (i < inv ? 12 : 0)).sort((a, b) => a - b);
                const target = prevVoicing.length ? prevVoicing : [center - 5, center - 1, center + 3];
                const d = v.reduce((s, x, i) => s + Math.abs(x - (target[i] ?? target[target.length - 1])), 0) + Math.abs(v[0] - (center - 7)) * 0.5;
                if (d < bd) {
                    bd = d;
                    best = v;
                }
            }
        }
        prevVoicing = best;
        return best;
    }

    /* ---------- Hvert sekstendels slag ---------- */
    function tick(time: number) {
        if (!T || !cur) return;
        const t = T;
        const sixteenth = t.Time('16n').toSeconds();
        // Endringer skjer bare på taktstart
        if (step === 0) {
            if (cur.id !== want.song || cur.hevn !== want.hevn) switchTo(want.song, want.hevn, time);
            const boss = want.song === 'boss' || want.song === 'final';
            const target = boss ? 3 : Math.max(0, Math.min(3, want.intensity));
            level = target;
            const cycle = Math.floor(bar / 8);
            // Ny variant av B-delen annenhver runde, så låta ikke blir slitsom
            if (bar % 8 === 0 && cycle > 0 && cycle % 2 === 0 && cur.variant !== cycle) {
                cur.variant = cycle;
                cur.mel = makeMelody(cur.song, cur.scale, cur.chords, cycle / 2);
            }
        }
        const s = cur.song;
        const nb = s.chords.length;
        const chord = cur.chords[bar % nb];
        const nextChord = cur.chords[(bar + 1) % nb];
        const cycle = Math.floor(bar / 8);
        const inBar = bar % 8;
        const boss = want.song === 'boss' || want.song === 'final';
        // Hver fjerde runde hviler trommene og melodien (ikke i sjefskamp)
        const brk = !boss && cycle % 4 === 3 && level >= 2;
        const lvl = want.tension && !boss ? Math.min(level, 1) : level;
        const vel = (base: number) => Math.max(0.05, Math.min(1, base * (step % 4 === 0 ? 1 : 0.78) + (Math.random() - 0.5) * 0.12));
        const key = s.key;
        const rootLow = key - 12 + ((chord.root - (key % 12) + 12) % 12);
        const bassNote = (c: string): number | null => {
            switch (c) {
                case 'R':
                    return rootLow;
                case 'F':
                    return rootLow + 7;
                case 'O':
                    return rootLow + 12;
                case 'T':
                    return rootLow + chord.tones[1];
                case 'A': {
                    // Tone en halvtone under neste akkord (gående bass)
                    const nr = key - 12 + ((nextChord.root - (key % 12) + 12) % 12);
                    return nr - 1;
                }
                default:
                    return null;
            }
        };
        const until = (pat: string, i: number) => {
            let k = i + 1;
            while (k < 16 && pat[k] === '.') k++;
            return k - i;
        };
        // Bass
        if (s.bass && lvl >= (s.bass.min ?? 0)) {
            const n = bassNote(s.bass.pat[step]);
            if (n !== null) cur.insts.bass.play(n + 12 * (s.bass.oct ?? 0), until(s.bass.pat, step) * sixteenth * 0.92, time, vel(0.9));
        }
        // Akkorder
        if (s.comp && lvl >= (s.comp.min ?? 0) && !(want.tension && !boss)) {
            const c = s.comp.pat[step];
            if (c === 'x' || c === 'X') {
                const v = voicing(chord, 64 + 12 * (s.comp.oct ?? 0));
                cur.insts.comp.play(v, (c === 'X' ? until(s.comp.pat, step) : 1.6) * sixteenth, time, vel(0.65));
            }
        }
        if (s.pad && step === 0 && lvl >= (s.pad.min ?? 0)) {
            const v = voicing(chord, 62 + 12 * (s.pad.oct ?? 0));
            cur.insts.pad.play(v, 16 * sixteenth * 0.98, time, 0.55);
        }
        // Arpeggio
        if (s.arp && lvl >= (s.arp.min ?? 0) && s.arp.pat[step] === 'x') {
            const tones = chord.tones.map((x) => key + 12 + ((chord.root - (key % 12) + 12) % 12) + x + 12 * (s.arp?.oct ?? 0));
            const seq = [...tones, ...tones.map((x) => x + 12)];
            const n = seq[arpI % seq.length];
            arpI++;
            cur.insts.arp.play(n, sixteenth * 1.5, time, vel(0.5));
        }
        // Melodi
        if (lvl >= 2 && !brk && !(want.tension && !boss)) {
            for (const n of cur.mel[inBar] ?? []) {
                if (n.s === step) cur.insts.lead.play(n.m, n.d * sixteenth * 0.9, time, vel(0.8));
            }
        }
        // Trommer
        const fill = lvl >= 2 && inBar === 7 && step >= 12 && !brk;
        for (const d of Object.keys(s.drums)) {
            const ch = s.drums[d][step];
            if (ch === '.' || ch === undefined) continue;
            const need = d === 'k' || d === 's' || d === 't' ? 2 : 1;
            if (lvl < need) continue;
            if (brk && (d === 'k' || d === 's')) continue;
            if (fill && (d === 's' || d === 'k')) continue;
            // Cymbal bare etter et brekk, på første slag i en ny runde
            if (d === 'o' && !(inBar === 0 && step === 0 && cycle > 0)) continue;
            const instId = ch === 'y' ? 'd_y' : 'd_' + d;
            const pitch = ch === 'y' ? 91 : d === 't' ? rootLow + 12 - (step % 3) * 3 : 0;
            cur.insts[instId]?.play(pitch, sixteenth, time, vel(ch === 'b' ? 0.5 : 0.85));
        }
        if (fill) cur.insts.d_s.play(0, sixteenth, time, 0.35 + (step - 12) * 0.17);
        // Spenning: en klokke tikker på hvert slag
        if (want.tension && !boss && step % 4 === 0) cur.insts.tick.play(step % 8 === 0 ? 96 : 89, sixteenth, time, 0.6);

        step++;
        if (step >= 16) {
            step = 0;
            bar++;
        }
    }

    async function load() {
        if (T || loading) return loading ?? undefined;
        loading = (async () => {
            const t = await import('tone');
            if (dead) return;
            T = t;
            await t.start();
            master = new t.Volume(volDb()).toDestination();
            const lim = new t.Limiter(-1).connect(master);
            comp = new t.Compressor({ threshold: -18, ratio: 3, attack: 0.01, release: 0.2 }).connect(lim);
            duckG = new t.Gain(1).connect(comp);
            if (debug.meters) {
                const mm = new t.Meter({ smoothing: 0.3 });
                duckG.connect(mm);
                meterOf._mix = mm;
            }
            filt = new t.Filter({ frequency: 18000, type: 'lowpass', rolloff: -24, Q: 0.7 }).connect(duckG);
            rev = new t.Reverb({ decay: 2.6, preDelay: 0.02, wet: 1 });
            await rev.generate();
            rev.connect(filt);
            revIn = new t.Channel({ volume: -4 });
            revIn.receive('hsl-rev');
            revIn.connect(rev);
            const tr = t.getTransport();
            tr.cancel();
            step = 0;
            bar = 0;
            repeatId = tr.scheduleRepeat(tick, '16n');
            cur = build(want.song, want.hevn);
            cur.bus.gain.value = 1;
            tr.bpm.value = cur.song.bpm * (want.hevn ? 0.92 : 1);
            tr.swing = cur.song.swing ?? 0;
            tr.swingSubdivision = '16n';
            tr.start('+0.1');
            applyMix();
        })();
        return loading;
    }

    const volDb = () => (volume <= 0.001 ? -80 : 20 * Math.log10(volume) - 4);
    let lastTension = false;
    let lastDuck = false;
    function applyMix() {
        if (!filt || !duckG) return;
        const boss = want.song === 'boss' || want.song === 'final';
        const ten = want.tension && !boss;
        if (ten !== lastTension) {
            lastTension = ten;
            filt.frequency.rampTo(ten ? 750 : 18000, ten ? 0.5 : 1.2);
        }
        if (want.duck !== lastDuck) {
            lastDuck = want.duck;
            duckG.gain.rampTo(want.duck ? 0.32 : 1, 0.4);
        }
    }

    return {
        levels() {
            for (const [k, m] of Object.entries(meterOf)) {
                const v = m.getValue() as number;
                if (Number.isFinite(v)) peakOf[k] = Math.max(peakOf[k] ?? -120, v);
            }
            const master = Object.fromEntries(Object.entries(peakOf));
            return master;
        },
        async enable() {
            on = true;
            await load();
            if (!T || dead || !on) return;
            const tr = T.getTransport();
            if (tr.state !== 'started') tr.start('+0.05');
            master?.volume.rampTo(volDb(), 0.6);
        },
        disable() {
            on = false;
            if (!T) return;
            master?.volume.rampTo(-80, 0.4);
            const t = T;
            window.setTimeout(() => {
                if (!on && !dead) t.getTransport().pause();
            }, 450);
        },
        setVolume(v) {
            volume = Math.max(0, Math.min(1, v));
            if (on) master?.volume.rampTo(volDb(), 0.2);
        },
        set(w) {
            Object.assign(want, w);
            applyMix();
        },
        destroy() {
            dead = true;
            on = false;
            if (!T) return;
            const tr = T.getTransport();
            if (repeatId >= 0) tr.clear(repeatId);
            tr.stop();
            tr.cancel();
            if (cur) for (const i of Object.values(cur.insts)) for (const n of i.nodes) n.dispose();
            cur?.bus.dispose();
            for (const n of [revIn, rev, filt, duckG, comp, master]) n?.dispose();
        },
    };
}
