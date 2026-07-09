// Minimal lydsyntese for Chrono Glider (Web Audio, ingen filer).
// Respekterer mute-valg lagret i localStorage.

const MUTE_KEY = 'chrono-glider-muted';

let ctx: AudioContext | null = null;

const getCtx = () => {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        try {
            ctx = new AudioContext();
        } catch {
            return null;
        }
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
};

export const isMuted = () => {
    try {
        return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
        return false;
    }
};

export const setMuted = (muted: boolean) => {
    try {
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
        // best-effort
    }
};

const tone = (
    freq: number,
    start: number,
    duration: number,
    type: OscillatorType,
    volume: number
) => {
    const audio = getCtx();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audio.currentTime + start);
    gain.gain.linearRampToValueAtTime(volume, audio.currentTime + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(audio.currentTime + start);
    osc.stop(audio.currentTime + start + duration + 0.05);
};

export const playCorrect = () => {
    if (isMuted()) return;
    tone(660, 0, 0.12, 'sine', 0.18);
    tone(880, 0.09, 0.18, 'sine', 0.18);
};

export const playWrong = () => {
    if (isMuted()) return;
    tone(200, 0, 0.2, 'sawtooth', 0.12);
    tone(140, 0.1, 0.25, 'sawtooth', 0.1);
};

export const playWhoosh = () => {
    if (isMuted()) return;
    tone(320, 0, 0.08, 'triangle', 0.06);
};

export const playFanfare = () => {
    if (isMuted()) return;
    tone(523, 0, 0.15, 'sine', 0.16);
    tone(659, 0.12, 0.15, 'sine', 0.16);
    tone(784, 0.24, 0.3, 'sine', 0.18);
};
