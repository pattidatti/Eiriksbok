import * as Tone from 'tone';

// Delt, app-global lyd-singleton for mikrospill-event-lyder. ÉN Tone-kjede for
// hele appen (ikke én per komponent), lazy-initiert ved første avspilling inne i
// en brukerhandling (klikk/drag), så nettleserens autoplay-policy respekteres.
//
// Hvorfor singleton og ikke en hook/context: interaksjons-primitivene
// (Interactive/Hotspot/Draggable) lever INNI R3F-Canvas-reconcileren, der vanlig
// React-context fra utsiden ikke når inn. En modul-singleton sidesteg hele det
// problemet og hindrer at hvert hotspot lager sitt eget synth-sett.
//
// useStepSounds() (src/hooks) delegerer nå hit, så manuelle kall og den
// default-wirede primitiv-lyden deler samme kjede, samme mute og samme debounce.

export type StepSoundEvent =
    'select' | 'correct' | 'incorrect' | 'advance' | 'complete' | 'pick' | 'drop' | 'sceneChange';

// Samme nøkkel som læringsstiene har brukt, så eksisterende mute-UI fortsatt virker.
const MUTE_KEY = 'learning_path_sound_muted';

// To like event innenfor dette vinduet (ms) regnes som dobbel-fyring (f.eks. et
// spill som BÅDE wirer auto-lyd og kaller play() manuelt på samme klikk) og slås
// sammen til én lyd.
const DEBOUNCE_MS = 50;

interface Synths {
    pluck: Tone.PluckSynth;
    noise: Tone.NoiseSynth;
    pad: Tone.PolySynth;
    bass: Tone.MembraneSynth;
    master: Tone.Gain;
}

let muted = false;
let initPromise: Promise<void> | null = null;
let synths: Synths | null = null;
const lastFired: Partial<Record<StepSoundEvent, number>> = {};

if (typeof window !== 'undefined') {
    try {
        if (localStorage.getItem(MUTE_KEY) === 'true') muted = true;
    } catch {
        // localStorage utilgjengelig (privatmodus e.l.) - bare ignorer.
    }
}

function ensureInit(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        try {
            await Tone.start();
        } catch {
            initPromise = null;
            return;
        }
        const master = new Tone.Gain(0.22).toDestination();
        const pluck = new Tone.PluckSynth({
            attackNoise: 0.4,
            dampening: 4200,
            resonance: 0.72,
        }).connect(master);
        const noise = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
        }).connect(master);
        const pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.008, decay: 0.18, sustain: 0.05, release: 0.35 },
        }).connect(master);
        const bass = new Tone.MembraneSynth({
            pitchDecay: 0.06,
            octaves: 3,
            envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.2 },
        }).connect(master);
        bass.volume.value = -6;
        synths = { pluck, noise, pad, bass, master };
    })();
    return initPromise;
}

function trigger(s: Synths, event: StepSoundEvent, now: number): void {
    switch (event) {
        case 'select':
            s.pluck.triggerAttack('E5', now);
            break;
        case 'correct':
            s.pad.triggerAttackRelease('E5', '16n', now);
            s.pad.triggerAttackRelease('B5', '16n', now + 0.07);
            break;
        case 'incorrect':
            s.bass.triggerAttackRelease('A2', '16n', now);
            s.bass.triggerAttackRelease('F2', '8n', now + 0.1);
            break;
        case 'advance':
            s.pluck.triggerAttack('G5', now);
            s.pluck.triggerAttack('C6', now + 0.06);
            break;
        case 'complete':
            s.pad.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
            s.pad.triggerAttackRelease(['E5', 'G5', 'C6'], '4n', now + 0.18);
            break;
        case 'pick':
            s.pluck.triggerAttack('A4', now);
            break;
        case 'drop':
            s.noise.triggerAttackRelease('32n', now);
            break;
        case 'sceneChange':
            s.pad.triggerAttackRelease('C5', '8n', now);
            s.pad.triggerAttackRelease('G4', '4n', now + 0.12);
            break;
    }
}

export const microSfx = {
    play(event: StepSoundEvent): void {
        if (muted) return;
        const t = typeof performance !== 'undefined' ? performance.now() : 0;
        if (t && lastFired[event] && t - (lastFired[event] as number) < DEBOUNCE_MS) return;
        lastFired[event] = t;
        void ensureInit().then(() => {
            if (!synths) return;
            try {
                trigger(synths, event, Tone.now());
            } catch {
                // Tone enda ikke helt klar - bare hopp over denne lyden.
            }
        });
    },
    setMuted(m: boolean): void {
        muted = m;
        try {
            localStorage.setItem(MUTE_KEY, m ? 'true' : 'false');
        } catch {
            // ignorer
        }
    },
    isMuted(): boolean {
        return muted;
    },
};
