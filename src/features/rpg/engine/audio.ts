// All lyd i spillet lages med Web Audio - ingen lydfiler. Samme prinsipp som
// mini-spillmotoren bruker (src/games/engine/systems/ProceduralAudio.ts), men
// her trenger vi korte, responsive kamplyder, så vi syntetiserer dem live i
// stedet for å rendre buffere på forhånd.

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let musikk: GainNode | null = null;
let stoppMusikk: (() => void) | null = null;

function ensure(): Ctx | null {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        const Impl =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Impl) return null;
        ctx = new Impl();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
        musikk = ctx.createGain();
        musikk.gain.value = 0.28;
        musikk.connect(master);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
}

export function setVolume(value: number): void {
    ensure();
    if (master) master.gain.value = Math.max(0, Math.min(1, value));
}

export function resumeAudio(): void {
    ensure();
}

function tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    sweepTo?: number,
    delay = 0
): void {
    const c = ensure();
    if (!c || !master) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo !== undefined)
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, gain: number, cutoff: number, delay = 0, sweepTo?: number): void {
    const c = ensure();
    if (!c || !master) return;
    const t0 = c.currentTime + delay;
    const length = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, Math.max(1, length), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t0);
    if (sweepTo !== undefined)
        filter.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
}

// ─── Lydkatalog ─────────────────────────────────────────────────────────────

export const sfx = {
    sving() {
        noise(0.12, 0.16, 2600, 0, 700);
    },
    treff() {
        noise(0.09, 0.32, 1800, 0, 300);
        tone(180, 0.09, 'square', 0.14, 90);
    },
    kritisk() {
        noise(0.13, 0.38, 3200, 0, 400);
        tone(880, 0.16, 'square', 0.16, 220);
        tone(1320, 0.12, 'triangle', 0.1, 440, 0.02);
    },
    skade() {
        tone(220, 0.22, 'sawtooth', 0.2, 70);
        noise(0.16, 0.2, 900, 0, 200);
    },
    dod() {
        tone(300, 0.5, 'sawtooth', 0.22, 60);
        noise(0.4, 0.18, 1400, 0.05, 120);
    },
    rull() {
        noise(0.22, 0.14, 1200, 0, 400);
    },
    besvergelse(farge: number) {
        // Lysere farge → lysere lyd. Gir hver besvergelse sin egen stemme.
        const base = 320 + (farge % 512);
        tone(base, 0.28, 'triangle', 0.16, base * 2.2);
        tone(base * 1.5, 0.2, 'sine', 0.1, base * 3, 0.03);
    },
    plukk() {
        tone(660, 0.09, 'square', 0.12);
        tone(990, 0.1, 'square', 0.1, undefined, 0.06);
    },
    solv() {
        tone(1200, 0.07, 'square', 0.09);
        tone(1600, 0.08, 'square', 0.07, undefined, 0.05);
    },
    riktig() {
        [523, 659, 784, 1047].forEach((f, i) =>
            tone(f, 0.24, 'triangle', 0.16, undefined, i * 0.075)
        );
    },
    galt() {
        tone(220, 0.3, 'sawtooth', 0.16, 120);
        tone(160, 0.34, 'square', 0.1, 90, 0.06);
    },
    nivaOpp() {
        [523, 659, 784, 1047, 1319].forEach((f, i) =>
            tone(f, 0.4, 'triangle', 0.18, undefined, i * 0.09)
        );
        noise(0.5, 0.1, 4000, 0.1, 500);
    },
    dialog() {
        tone(440, 0.05, 'square', 0.06);
    },
    apne() {
        tone(330, 0.12, 'triangle', 0.1, 550);
    },
    skjold() {
        tone(140, 0.5, 'sine', 0.18, 420);
        noise(0.3, 0.08, 900, 0.05);
    },

    // ── Kampen ──────────────────────────────────────────────────────────────
    // Treffet er tre lag: sus før, anslag ved, materiale etter. Ett lag alene
    // høres ut som en knapp; tre lag høres ut som noe som møter noe.

    /** Suset foran et tungt slag. Spilles like før anslaget lander. */
    sus() {
        noise(0.16, 0.2, 3400, 0, 520);
    },
    /** Lindetre som tar imot. Tørt smell, ingen metallklang. */
    treSprak() {
        noise(0.07, 0.34, 1500, 0, 420);
        tone(260, 0.1, 'square', 0.12, 120);
        tone(150, 0.14, 'triangle', 0.08, 80, 0.02);
    },
    /** Skjoldet går i to. Et smell, og så noe som knekker. */
    skjoldBrudd() {
        noise(0.1, 0.42, 2200, 0, 300);
        tone(190, 0.3, 'sawtooth', 0.2, 60);
        noise(0.34, 0.16, 800, 0.08, 140);
        tone(90, 0.4, 'triangle', 0.12, 45, 0.06);
    },
    /** Perfekt parade: jern mot jern, høyt og kort. */
    paradeKlang() {
        tone(1760, 0.14, 'square', 0.16, 880);
        tone(2640, 0.1, 'triangle', 0.1, 1320, 0.01);
        noise(0.12, 0.24, 5200, 0, 900);
    },
    /** Hjerteslag når livet er lavt. To slag, som et ekte. */
    hjerteslag() {
        tone(58, 0.16, 'sine', 0.3, 40);
        tone(52, 0.2, 'sine', 0.22, 34, 0.19);
    },
    /** Hornstøt ved nytt nivå. */
    horn() {
        tone(196, 0.7, 'sawtooth', 0.18, 294);
        tone(294, 0.6, 'triangle', 0.12, 392, 0.08);
        noise(0.5, 0.06, 1200, 0.02, 300);
    },
    // ── Avslutninger ────────────────────────────────────────────────────────
    // Én lyd per våpenart. Det er ikke pynt: eleven skal høre hvilket våpen som
    // gjorde det, også når hun ser bort på helsestolpen sin.

    /** Sverdet: et kutt. Kort, høyt, og så en våt hale. */
    kutt() {
        noise(0.08, 0.4, 6000, 0, 1800);
        tone(1400, 0.07, 'sawtooth', 0.1, 500);
        noise(0.26, 0.24, 700, 0.06, 160);
    },
    /** Øksa: et flekk. Tungt anslag ned i noe som gir etter. */
    flekk() {
        noise(0.13, 0.46, 1300, 0, 220);
        tone(120, 0.26, 'square', 0.24, 48);
        noise(0.3, 0.2, 520, 0.09, 110);
    },
    /** Spydet: gjennomboring. En glidende, trang lyd. */
    gjennombor() {
        noise(0.2, 0.3, 2400, 0, 380);
        tone(320, 0.24, 'triangle', 0.14, 120);
        noise(0.22, 0.16, 600, 0.12, 140);
    },
    /** Hammeren: knusing. Alt på én gang, og lavt. */
    knus() {
        noise(0.17, 0.52, 900, 0, 130);
        tone(78, 0.36, 'sawtooth', 0.3, 38);
        tone(150, 0.2, 'square', 0.16, 60, 0.02);
        noise(0.36, 0.22, 420, 0.1, 90);
    },
    /** Buestrengen som slippes. Et kort smell, og en tynn susing etter pila. */
    pil() {
        tone(230, 0.07, 'triangle', 0.16, 90);
        noise(0.2, 0.1, 3200, 0.02, 900);
    },
    /** Staven og alt annet: noe blir slengt av gårde. */
    slengt() {
        noise(0.16, 0.3, 2000, 0, 500);
        tone(240, 0.22, 'triangle', 0.14, 90);
    },
    /** Når en bit blir slått av en fiende som slåss videre. */
    lemlestelse() {
        noise(0.1, 0.34, 1600, 0, 260);
        tone(200, 0.16, 'square', 0.12, 80);
    },

    /** Én klingende lyd per gjenstand som spretter ut. */
    lootPling(i = 0) {
        tone(880 + i * 110, 0.09, 'square', 0.08, undefined, i * 0.045);
        tone(1320 + i * 110, 0.07, 'triangle', 0.05, undefined, i * 0.045 + 0.03);
    },
    bossBrol() {
        tone(90, 1.1, 'sawtooth', 0.3, 42);
        noise(1.0, 0.24, 700, 0.05, 120);
        tone(130, 0.9, 'square', 0.14, 60, 0.1);
    },
};

// ─── Bakgrunnsmusikk ────────────────────────────────────────────────────────
// En rolig, generativ slått i dorisk skala. Den gjentar seg aldri helt likt,
// men holder seg innenfor samme stemning.

const DORISK = [0, 2, 3, 5, 7, 9, 10, 12];

export function startMusikk(rot = 196, intensitet = 0): void {
    const c = ensure();
    if (!c || !musikk) return;
    stopMusikk();

    let step = 0;
    let neste = c.currentTime + 0.1;
    const stegLengde = () => (intensitet > 0.5 ? 0.28 : 0.42);

    const spillNote = (
        freq: number,
        tid: number,
        lengde: number,
        gain: number,
        type: OscillatorType
    ) => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, tid);
        g.gain.setValueAtTime(0.0001, tid);
        g.gain.exponentialRampToValueAtTime(gain, tid + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, tid + lengde);
        osc.connect(g).connect(musikk!);
        osc.start(tid);
        osc.stop(tid + lengde + 0.05);
    };

    const timer = window.setInterval(() => {
        if (!ctx) return;
        // Planlegg litt fram i tid, så fane-throttling ikke gir hakk.
        while (neste < ctx.currentTime + 0.6) {
            const len = stegLengde();
            // Bass annenhver takt
            if (step % 4 === 0) spillNote(rot / 2, neste, len * 2.4, 0.16, 'triangle');
            // Melodi
            if (step % 2 === 0 || Math.random() > 0.55) {
                const grad = DORISK[Math.floor(Math.random() * DORISK.length)];
                spillNote(rot * Math.pow(2, grad / 12), neste, len * 1.6, 0.09, 'sine');
            }
            // Lett puls når det er kamp
            if (intensitet > 0.5 && step % 2 === 1) {
                spillNote(rot * 2, neste, 0.08, 0.05, 'square');
            }
            neste += len;
            step += 1;
        }
    }, 200);

    stoppMusikk = () => window.clearInterval(timer);
}

export function stopMusikk(): void {
    stoppMusikk?.();
    stoppMusikk = null;
}

export function disposeAudio(): void {
    stopMusikk();
    if (ctx) {
        void ctx.close();
        ctx = null;
        master = null;
        musikk = null;
    }
}
