// Bittesmå lyder til Kryssord. Ren WebAudio - ingen lydfiler å laste ned, og
// ingenting skjer før eleven har trykket første gang (nettleserne krever det).

type SoundName = 'move' | 'letter' | 'erase' | 'solve' | 'error' | 'hint' | 'reveal' | 'win';

const MUTE_KEY = 'kryssord-lyd-av';

let ctx: AudioContext | null = null;
let muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';

const getContext = (): AudioContext | null => {
    if (muted) return null;
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        const Ctor =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
};

interface ToneOptions {
    freq: number;
    at?: number;
    duration?: number;
    type?: OscillatorType;
    gain?: number;
    glideTo?: number;
}

const blip = (
    audio: AudioContext,
    { freq, at = 0, duration = 0.12, type = 'sine', gain = 0.12, glideTo }: ToneOptions
) => {
    const start = audio.currentTime + at;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
    // Myk inn- og utgang, ellers klikker det stygt i høyttaleren
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
};

// Durtreklang oppover: den universelle «riktig!»-lyden
const ARPEGGIO = [523.25, 659.25, 783.99, 1046.5];

export const playSound = (name: SoundName, intensity = 0) => {
    const audio = getContext();
    if (!audio) return;

    switch (name) {
        case 'move':
            blip(audio, { freq: 320, duration: 0.05, type: 'triangle', gain: 0.05 });
            break;
        case 'letter':
            blip(audio, {
                freq: 620 + Math.random() * 40,
                duration: 0.06,
                type: 'sine',
                gain: 0.09,
            });
            break;
        case 'erase':
            blip(audio, { freq: 300, glideTo: 180, duration: 0.09, type: 'triangle', gain: 0.07 });
            break;
        case 'solve': {
            // Hver ord-på-rad løfter klangen et halvt trinn - kombo skal høres
            const lift = 1 + Math.min(intensity, 4) * 0.06;
            ARPEGGIO.forEach((freq, index) => {
                blip(audio, {
                    freq: freq * lift,
                    at: index * 0.06,
                    duration: 0.24,
                    type: 'triangle',
                    gain: 0.13,
                });
            });
            break;
        }
        case 'error':
            blip(audio, { freq: 190, glideTo: 120, duration: 0.22, type: 'sawtooth', gain: 0.07 });
            break;
        case 'hint':
            blip(audio, { freq: 1180, duration: 0.1, type: 'sine', gain: 0.09 });
            blip(audio, { freq: 1560, at: 0.07, duration: 0.14, type: 'sine', gain: 0.06 });
            break;
        case 'reveal': {
            // Nøktern og litt nedadgående: ordet kom på plass, men eleven fikk
            // det servert. Det skal ikke høres ut som en seier.
            blip(audio, { freq: 440, duration: 0.16, type: 'triangle', gain: 0.09 });
            blip(audio, { freq: 330, at: 0.13, duration: 0.26, type: 'sine', gain: 0.08 });
            break;
        }
        case 'win': {
            const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];
            fanfare.forEach((freq, index) => {
                blip(audio, {
                    freq,
                    at: index * 0.11,
                    duration: 0.5,
                    type: 'triangle',
                    gain: 0.14,
                });
                blip(audio, {
                    freq: freq / 2,
                    at: index * 0.11,
                    duration: 0.5,
                    type: 'sine',
                    gain: 0.07,
                });
            });
            break;
        }
    }
};

export const isMuted = (): boolean => muted;

export const setMuted = (value: boolean) => {
    muted = value;
    try {
        localStorage.setItem(MUTE_KEY, value ? '1' : '0');
    } catch {
        // Privat modus uten localStorage - lyden gjelder da bare denne økten
    }
};
