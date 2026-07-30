import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types (Reused) ---
type ToneTags = {
    formality: number;
    warmth: number;
    power: number;
};

type ToneVariation = {
    id: string;
    text: string;
    tags: ToneTags;
};

// Scenario Data (Same as before)
const SCENARIO_DATA: ToneVariation[] = [
    { id: 'l_l_l', text: "Det er over. Orker ikke mer.", tags: { formality: 0, warmth: 0, power: 0 } },
    { id: 'l_l_h', text: "Jeg dumper deg. Nå.", tags: { formality: 0, warmth: 0, power: 1 } },
    { id: 'l_h_l', text: "Pus, vi funker ikke lenger...", tags: { formality: 0, warmth: 1, power: 0 } },
    { id: 'l_h_h', text: "Vi må snakke. Dette går ikke.", tags: { formality: 0, warmth: 1, power: 1 } },
    { id: 'm_l_l', text: "Forholdet vårt har nådd slutten.", tags: { formality: 0.5, warmth: 0.2, power: 0.5 } },
    { id: 'm_h_h', text: "Jeg tror det er best for oss begge om vi går videre.", tags: { formality: 0.5, warmth: 0.8, power: 0.8 } },
    { id: 'h_l_l', text: "Det meddeles herved at relasjonen opphører.", tags: { formality: 1, warmth: 0, power: 0.2 } },
    { id: 'h_l_h', text: "Jeg avslutter herved vår overenskomst med umiddelbar virkning.", tags: { formality: 1, warmth: 0, power: 1 } },
    { id: 'h_h_l', text: "Med tungt hjerte må jeg konkludere med at våre veier bør skilles.", tags: { formality: 1, warmth: 0.8, power: 0.4 } },
    { id: 'h_h_h', text: "Jeg tar ansvar for min egen lykke og velger å avslutte dette forholdet.", tags: { formality: 1, warmth: 0.8, power: 1 } },
];

const EqualizerSlider = ({ label, value, onChange, color }: { label: string, value: number, onChange: (v: number) => void, color: string }) => (
    <div className="flex flex-col items-center gap-4 h-64 group relative">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500 [writing-mode:vertical-rl] rotate-180">
            {label}
        </div>

        {/* Track */}
        <div
            className="w-12 h-full bg-stone-900/50 rounded-full border border-white/5 relative overflow-hidden cursor-pointer shadow-inner"
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const v = 1 - (e.clientY - rect.top) / rect.height; // Invert because visual bottom is 0
                onChange(Math.max(0, Math.min(1, v)));
            }}
        >
            {/* Fill Level */}
            <motion.div
                className={`absolute bottom-0 w-full ${color.replace('text-', 'bg-')}/20 backdrop-blur-md`}
                style={{ height: `${value * 100}%` }}
                animate={{ height: `${value * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-20 pointer-events-none" />
        </div>

        {/* Knob (Visual only, follows value) */}
        <motion.div
            className={`absolute w-14 h-6 border rounded shadow-lg backdrop-blur-sm z-10 cursor-ns-resize flex items-center justify-center
                ${color.replace('text-', 'border-')}
                ${color.replace('text-', 'shadow-')}/20
            `}
            style={{
                bottom: `${value * 100}%`,
                y: '50%',
                backgroundColor: 'rgba(20,20,20, 0.9)'
            }}
        >
            <div className={`w-8 h-0.5 ${color.replace('text-', 'bg-')}`} />
        </motion.div>

        {/* Value readout */}
        <div className="font-mono text-xs text-stone-400">
            {(value * 100).toFixed(0)}%
        </div>
    </div>
);

export const ToneMixer: React.FC = () => {
    const [sliders, setSliders] = useState<ToneTags>({ formality: 0.5, warmth: 0.5, power: 0.5 });

    // Logic
    const activeVariation = useMemo(() => {
        let bestMatch = SCENARIO_DATA[0];
        let minDistance = Infinity;
        SCENARIO_DATA.forEach(variation => {
            const dist = Math.sqrt(
                Math.pow(variation.tags.formality - sliders.formality, 2) +
                Math.pow(variation.tags.warmth - sliders.warmth, 2) +
                Math.pow(variation.tags.power - sliders.power, 2)
            );
            if (dist < minDistance) {
                minDistance = dist;
                bestMatch = variation;
            }
        });
        return bestMatch;
    }, [sliders]);

    return (
        <div className="flex flex-col md:flex-row w-full h-full gap-8 max-h-[80vh]">

            {/* Left: The Equalizer (Controls) */}
            <div className="w-full md:w-1/3 bg-white/60 backdrop-blur-xl border border-stone-900/10 rounded-2xl p-8 flex flex-col justify-center shadow-xl">
                <h2 className="text-xl font-serif text-stone-800 mb-8 text-center border-b border-stone-900/5 pb-4">Tone-Mikser</h2>
                <div className="flex justify-around items-end h-[400px]">
                    <EqualizerSlider
                        label="Formalitet"
                        value={sliders.formality}
                        onChange={(v) => setSliders(p => ({ ...p, formality: v }))}
                        color="text-cyan-400"
                    />
                    <EqualizerSlider
                        label="Varme"
                        value={sliders.warmth}
                        onChange={(v) => setSliders(p => ({ ...p, warmth: v }))}
                        color="text-amber-400"
                    />
                    <EqualizerSlider
                        label="Styrke"
                        value={sliders.power}
                        onChange={(v) => setSliders(p => ({ ...p, power: v }))}
                        color="text-red-400"
                    />
                </div>
            </div>

            {/* Right: The Manuscript (Output) */}
            <div className="flex-1 relative perspective-1000">
                <div className="relative w-full h-full bg-[#fcfaf7] text-stone-900 p-12 md:p-20 shadow-2xl rounded-sm overflow-hidden flex flex-col items-center justify-center text-center transform rotate-y-2 transition-transform duration-500 hover:rotate-y-0 origin-left border-l-4 border-stone-300">

                    {/* Papirtekstur lå her, men /assets/workstation/paper-grain.png
                        har aldri eksistert - laget var tomt og ga kun en 404. */}

                    <div className="relative z-10 max-w-lg">
                        <div className="mb-12 font-mono text-xs text-stone-400 tracking-[0.3em] uppercase opacity-50">Utkast #429</div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeVariation.id}
                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(2px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="font-serif text-4xl md:text-5xl leading-tight text-stone-800"
                            >
                                "{activeVariation.text}"
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-12 w-16 h-1 bg-stone-900/10 mx-auto rounded-full" />
                    </div>

                    {/* Ink Bleed footer */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-stone-200/50 to-transparent pointer-events-none" />
                </div>
            </div>

        </div>
    );
};
