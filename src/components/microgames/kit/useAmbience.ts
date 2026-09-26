import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';

// Ambient lydbed for immersjon - vind, bølger, smie, folkemengde, skog. Bygd
// programmatisk av filtrert støy med en treg LFO (ingen lydfiler), så det er
// lett og laster umiddelbart. Den største immersjons-spaken vi har.
//
//   const amb = useAmbience('waves');
//   // start fra en brukerhandling (autoplay-regler krever det):
//   onFirstInteraction={() => amb.start()}
//
// Lyd skal aldri stjele fokus - hold volumet lavt (default -26 dB).

export type AmbiencePreset = 'waves' | 'wind' | 'forge' | 'crowd' | 'forest';

interface PresetSpec {
    noise: 'white' | 'pink' | 'brown';
    base: number; // filter-senterfrekvens
    lfoRate: number; // hvor sakte beden "puster"
    lfoDepth: number; // hvor mye frekvensen svinger
    q: number;
}

const PRESETS: Record<AmbiencePreset, PresetSpec> = {
    waves: { noise: 'pink', base: 380, lfoRate: 0.12, lfoDepth: 260, q: 0.6 },
    wind: { noise: 'pink', base: 600, lfoRate: 0.2, lfoDepth: 420, q: 0.8 },
    forge: { noise: 'brown', base: 180, lfoRate: 0.5, lfoDepth: 90, q: 1.2 },
    crowd: { noise: 'pink', base: 900, lfoRate: 0.3, lfoDepth: 320, q: 0.5 },
    forest: { noise: 'pink', base: 1200, lfoRate: 0.15, lfoDepth: 520, q: 0.7 },
};

interface AmbienceNodes {
    noise: Tone.Noise;
    filter: Tone.Filter;
    lfo: Tone.LFO;
    vol: Tone.Volume;
}

export function useAmbience(preset: AmbiencePreset, volumeDb = -26) {
    const nodes = useRef<AmbienceNodes | null>(null);

    const stop = useCallback(() => {
        const n = nodes.current;
        if (!n) return;
        try {
            n.lfo.stop();
            n.noise.stop();
            n.lfo.dispose();
            n.noise.dispose();
            n.filter.dispose();
            n.vol.dispose();
        } catch {
            /* ignorer oppryddingsfeil */
        }
        nodes.current = null;
    }, []);

    // Kall fra en brukerhandling (klikk) - nettlesere blokkerer autostart av lyd.
    const start = useCallback(async () => {
        if (nodes.current) return;
        try {
            await Tone.start();
        } catch {
            return;
        }
        const spec = PRESETS[preset];
        const vol = new Tone.Volume(volumeDb).toDestination();
        const filter = new Tone.Filter(spec.base, 'lowpass');
        filter.Q.value = spec.q;
        const noise = new Tone.Noise(spec.noise);
        const lfo = new Tone.LFO(
            spec.lfoRate,
            spec.base - spec.lfoDepth,
            spec.base + spec.lfoDepth
        );
        noise.connect(filter);
        filter.connect(vol);
        lfo.connect(filter.frequency);
        lfo.start();
        noise.start();
        nodes.current = { noise, filter, lfo, vol };
    }, [preset, volumeDb]);

    // Rydd opp ved unmount.
    useEffect(() => stop, [stop]);

    return { start, stop };
}
