// Bitteliten Web Audio-synth for arkadespill. Arkadelyd er mange korte,
// spesifikke lyder som fyrer tett (plukk, kombo, treff, splash) - det tåler
// ikke den delte Tone-kjeden (den debouncer like event). Her lages hver lyd av
// en oscillator eller et støybuffer som lever i noen hundre millisekunder.
//
// Mute deler lagringsnøkkel med kit-lyden (kit/sound.ts), så lydvalget følger
// eleven mellom spill. Vi importerer bevisst ikke kit-en: den drar med seg
// three.js og Tone, og et 2D-spill skal være lett.
const MUTE_KEY = 'learning_path_sound_muted';

function readMuted(): boolean {
    try {
        return localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
        return false;
    }
}

export interface ArcadeSynth {
    /** Må kalles fra en brukerhandling (klikk/tast) før lyd kan spilles. */
    unlock: () => void;
    tone: (f1: number, f2: number, dur: number, type?: OscillatorType, vol?: number, delay?: number) => void;
    noise: (dur: number, vol?: number, freq?: number, delay?: number) => void;
    /** Stigende arpeggio i halvtoner over `base`. */
    arp: (base: number, steps: number[], gap?: number, vol?: number) => void;
    isMuted: () => boolean;
    setMuted: (m: boolean) => void;
    dispose: () => void;
}

export function createArcadeSynth(): ArcadeSynth {
    let ac: AudioContext | null = null;
    let master: GainNode | null = null;
    let noiseBuf: AudioBuffer | null = null;
    let muted = readMuted();

    const unlock = () => {
        if (ac) {
            if (ac.state === 'suspended') void ac.resume();
            return;
        }
        try {
            const Ctor =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext;
            ac = new Ctor();
            master = ac.createGain();
            master.gain.value = 0.45;
            master.connect(ac.destination);
        } catch {
            ac = null;
        }
    };

    const ready = () => ac !== null && master !== null && !muted;

    const tone: ArcadeSynth['tone'] = (f1, f2, dur, type = 'square', vol = 0.12, delay = 0) => {
        if (!ready() || !ac || !master) return;
        const t = ac.currentTime + delay;
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f1, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + dur + 0.03);
    };

    const noise: ArcadeSynth['noise'] = (dur, vol = 0.2, freq = 800, delay = 0) => {
        if (!ready() || !ac || !master) return;
        const t = ac.currentTime + delay;
        if (!noiseBuf) {
            const n = ac.sampleRate;
            noiseBuf = ac.createBuffer(1, n, n);
            const d = noiseBuf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        }
        const s = ac.createBufferSource();
        s.buffer = noiseBuf;
        const f = ac.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = freq;
        f.Q.value = 0.8;
        const g = ac.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f);
        f.connect(g);
        g.connect(master);
        s.start(t);
        s.stop(t + dur + 0.05);
    };

    const arp: ArcadeSynth['arp'] = (base, steps, gap = 0.06, vol = 0.07) => {
        steps.forEach((s, i) => {
            const f = base * 2 ** (s / 12);
            tone(f, f * 1.02, 0.12, 'square', vol, i * gap);
        });
    };

    return {
        unlock,
        tone,
        noise,
        arp,
        isMuted: () => muted,
        setMuted: (m) => {
            muted = m;
            try {
                localStorage.setItem(MUTE_KEY, String(m));
            } catch {
                // ignorer
            }
        },
        dispose: () => {
            if (ac) void ac.close().catch(() => {});
            ac = null;
            master = null;
        },
    };
}

/** Kort vibrasjon på enheter som støtter det. Stille no-op ellers. */
export function buzz(pattern: number | number[]) {
    try {
        navigator.vibrate?.(pattern);
    } catch {
        // ignorer
    }
}
