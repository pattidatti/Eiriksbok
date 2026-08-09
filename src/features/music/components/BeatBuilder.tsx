import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw } from 'lucide-react';
import * as Tone from 'tone';

const STEPS = 16;
const INSTRUMENTS = [
    { id: 'kick', name: 'Stortromme', color: 'bg-indigo-500' },
    { id: 'snare', name: 'Skarp', color: 'bg-pink-500' },
    { id: 'hihat', name: 'Hi-Hat', color: 'bg-yellow-500' },
];

interface BeatBuilderProps {
    initialPattern?: Record<string, boolean[]>;
}

export const BeatBuilder: React.FC<BeatBuilderProps> = ({ initialPattern }) => {
    const [grid, setGrid] = useState<Record<string, boolean[]>>(() => {
        if (initialPattern) return initialPattern;
        const initialGrid: Record<string, boolean[]> = {};
        INSTRUMENTS.forEach(inst => {
            initialGrid[inst.id] = Array(STEPS).fill(false);
        });
        return initialGrid;
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [bpm, setBpm] = useState(120);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const kickSynth = useRef<Tone.MembraneSynth | null>(null);
    const snareSynth = useRef<Tone.NoiseSynth | null>(null);
    const hihatSynth = useRef<Tone.MetalSynth | null>(null);

    useEffect(() => {
        // Initialize instruments
        kickSynth.current = new Tone.MembraneSynth().toDestination();
        snareSynth.current = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
        }).toDestination();
        hihatSynth.current = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).toDestination();

        return () => {
            kickSynth.current?.dispose();
            snareSynth.current?.dispose();
            hihatSynth.current?.dispose();
        };
    }, []);

    useEffect(() => {
        if (isPlaying) {
            const playStep = async (step: number) => {
                if (Tone.context.state !== 'running') {
                    await Tone.start();
                }

                // Play sounds for current step
                if (grid['kick'][step]) kickSynth.current?.triggerAttackRelease('C1', '8n');
                if (grid['snare'][step]) snareSynth.current?.triggerAttackRelease('8n');
                if (grid['hihat'][step]) hihatSynth.current?.triggerAttackRelease(200, '8n');
            };

            const interval = 60000 / bpm / 4; // 16th notes
            timerRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    const next = (prev + 1) % STEPS;
                    playStep(next);
                    return next;
                });
            }, interval);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, bpm, grid]);

    const toggleStep = (instrumentId: string, stepIndex: number) => {
        setGrid(prev => ({
            ...prev,
            [instrumentId]: prev[instrumentId].map((val, i) => i === stepIndex ? !val : val)
        }));
    };

    const clearGrid = () => {
        const newGrid: Record<string, boolean[]> = {};
        INSTRUMENTS.forEach(inst => {
            newGrid[inst.id] = Array(STEPS).fill(false);
        });
        setGrid(newGrid);
        setIsPlaying(false);
        setCurrentStep(0);
    };

    return (
        <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl my-8 text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white">Beat Builder</h3>
                    <p className="text-slate-400 text-sm">Bygg din egen rytme</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                        <span className="text-xs text-slate-400">BPM</span>
                        <input
                            type="number"
                            value={bpm}
                            onChange={(e) => setBpm(Number(e.target.value))}
                            className="w-12 bg-transparent text-white text-sm font-bold text-center focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={clearGrid}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        title="Nullstill"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={async () => {
                            if (!isPlaying && Tone.context.state !== 'running') {
                                await Tone.start();
                            }
                            // Spillhodet nullstilles her, der eleven trykker
                            // stopp — ikke i effecten som styrer selve timeren.
                            if (isPlaying) setCurrentStep(0);
                            setIsPlaying(!isPlaying);
                        }}
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                            }`}
                    >
                        {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {INSTRUMENTS.map((inst) => (
                    <div key={inst.id} className="flex items-center gap-4">
                        <div className="w-24 font-bold text-sm text-slate-300">{inst.name}</div>
                        <div className="flex-1 grid grid-cols-16 gap-1">
                            {grid[inst.id].map((active, index) => {
                                const isCurrent = currentStep === index;
                                const isBeat = index % 4 === 0;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => toggleStep(inst.id, index)}
                                        className={`
                                            aspect-square rounded-sm cursor-pointer transition-all duration-75
                                            ${active ? inst.color : 'bg-slate-800'}
                                            ${!active && isBeat ? 'bg-slate-700' : ''}
                                            ${isCurrent ? 'brightness-150 ring-2 ring-white z-10' : 'hover:brightness-110'}
                                        `}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex justify-end">
                <div className="flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-700 rounded-sm" /> 1/4 dels slag
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-800 rounded-sm" /> 1/16 dels slag
                    </span>
                </div>
            </div>
        </div>
    );
};
