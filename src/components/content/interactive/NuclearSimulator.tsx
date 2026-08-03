import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import confetti from 'canvas-confetti';
import { Crosshair, Skull, ShieldAlert } from 'lucide-react';

interface Warhead {
    id: string;
    name: string;
    yield: number; // in kilotons
    description: string;
    year: number;
}

interface SimulatorTarget {
    id: string;
    name: string;
    populationDensity: number; // people per km2
    mapPath: string; // SVG path data for the map outline
    scale: number; // Map scale factor
}

const WARHEADS: Warhead[] = [
    { id: 'little-boy', name: 'Little Boy', yield: 15, description: 'Hiroshima (Uranium)', year: 1945 },
    { id: 'fat-man', name: 'Fat Man', yield: 21, description: 'Nagasaki (Plutonium)', year: 1945 },
    { id: 'ivy-king', name: 'Ivy King', yield: 500, description: 'Største fisjonsbombe', year: 1952 },
    { id: 'castle-bravo', name: 'Castle Bravo', yield: 15000, description: 'USA hydrogenbombe', year: 1954 },
    { id: 'tsar-bomba', name: 'Tsar Bomba', yield: 50000, description: 'Sovjetisk monster', year: 1961 },
];

// Simplified SVG paths (abstract representations)
const MAPS: SimulatorTarget[] = [
    {
        id: 'oslo',
        name: 'Oslo',
        populationDensity: 1400,
        scale: 1,
        mapPath: "M150,50 Q160,100 150,200 T150,350 Q120,380 100,350 T150,50 M250,300 L280,350 L220,350 Z"
    },
    {
        id: 'grid',
        name: 'Taktisk Grid',
        populationDensity: 5000,
        scale: 1,
        mapPath: "M50,50 L350,50 L350,350 L50,350 Z M50,150 L350,150 M50,250 L350,250 M150,50 L150,350 M250,50 L250,350"
    },
];

export const NuclearSimulator: React.FC = () => {
    const [selectedWarhead, setSelectedWarhead] = useState<Warhead>(WARHEADS[0]);
    const [target, setTarget] = useState<SimulatorTarget>(MAPS[0]);
    const [isDetonating, setIsDetonating] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [casualties, setCasualties] = useState(0);
    const [armed, setArmed] = useState(false);

    // Convert yield to radius (approximate scaling: R ~ Y^(1/3))
    // We'll normalize specifically for this viewport
    const blastRadius = Math.pow(selectedWarhead.yield, 0.4) * 8; // tweaked visual scaling

    // Audio refs - unused for now as we create them on demand
    // const synthRef = useRef<Tone.Synth | null>(null);
    // const noiseRef = useRef<Tone.Noise | null>(null);

    useEffect(() => {
        // Init Tone.js on user interaction (handled in handlers)
        return () => {
            // Cleanup if needed
        };
    }, []);

    const playSound = async (type: 'arm' | 'launch' | 'impact') => {
        await Tone.start();

        switch (type) {
            case 'arm': {
                const osc = new Tone.Oscillator(440, "sine").toDestination();
                osc.start().stop("+0.1");
                break;
            }
            case 'launch': {
                // const siren = new Tone.UserMedia(); // Unused
                // Deep rumble
                const noise = new Tone.Noise("brown").toDestination();
                noise.volume.value = -10;
                noise.start();
                noise.stop("+2");
                break;
            }
            case 'impact': {
                // Complex crash
                const membrane = new Tone.MembraneSynth().toDestination();
                membrane.triggerAttackRelease("C1", "2n");
                const metal = new Tone.MetalSynth().toDestination();
                metal.triggerAttackRelease("32n", 0.1);
                break;
            }
        }
    };

    const handleDetonate = async () => {
        if (!armed || isDetonating) return;

        setIsDetonating(true);
        setShowResults(false);
        playSound('launch');

        // Animation sequence
        setTimeout(() => {
            playSound('impact');

            // Camera shake effect handled by CSS/Framer

            // Confetti fallout
            confetti({
                particleCount: 200,
                spread: 120,
                startVelocity: 45,
                colors: ['#555', '#222', '#F00'],
                ticks: 300,
                zIndex: 100,
                gravity: 0.8,
                scalar: 1.2
            });

            // Calculate casualties
            // Area = pi * r^2. 
            // Real physics: 1KT airburst ~ 0.2km radius for serious damage.
            // 50MT ~ 30km radius. 
            // We use a simplified scaled math for the 'game' feel.
            const realRadiusKm = Math.pow(selectedWarhead.yield, 1 / 3) * 1.5;
            const area = Math.PI * Math.pow(realRadiusKm, 2);
            const estCasualties = Math.floor(area * target.populationDensity * 0.8);

            setCasualties(estCasualties);
            setShowResults(true);
            setIsDetonating(false);
            setArmed(false);
        }, 800);
    };

    return (
        <div className="font-mono bg-black text-green-500 p-4 md:p-8 rounded-xl border-4 border-slate-800 shadow-2xl relative overflow-hidden my-12"
            style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.9)' }}>

            {/* CRT Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-900/5 to-transparent bg-[length:100%_4px] animate-scanline"></div>

            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-green-900 pb-4 mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 animate-pulse text-red-500" />
                    <h2 className="text-xl font-bold tracking-widest uppercase">TERRORBALANSE_SIMULATOR_V1.0</h2>
                </div>
                <div className="text-xs text-green-700">STATUS: DEFCON 1</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

                {/* Visualizer (Radar Screen) */}
                <div className="lg:col-span-7 bg-green-950/20 rounded-full aspect-square border-2 border-green-800 relative flex items-center justify-center overflow-hidden">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 border border-green-900/50 rounded-full" style={{ transform: 'scale(0.75)' }}></div>
                    <div className="absolute inset-0 border border-green-900/50 rounded-full" style={{ transform: 'scale(0.5)' }}></div>
                    <div className="absolute inset-0 border border-green-900/50 rounded-full" style={{ transform: 'scale(0.25)' }}></div>
                    <div className="absolute w-full h-[1px] bg-green-900/50 top-1/2 left-0"></div>
                    <div className="absolute h-full w-[1px] bg-green-900/50 left-1/2 top-0"></div>

                    {/* Radar Sweep */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute w-full h-full rounded-full bg-gradient-to-r from-transparent via-green-900/20 to-green-500/10 origin-center"
                        style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 0 100%, 0 0, 50% 0)' }}
                    />

                    {/* Target Map */}
                    <svg viewBox="0 0 400 400" className="absolute w-full h-full opacity-40">
                        <path d={target.mapPath} fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>

                    {/* Blast Radius Layers */}
                    <AnimatePresence>
                        {showResults && (
                            <>
                                {/* Thermal Radiation (Outer) */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 0.8 }}
                                    animate={{ scale: 1, opacity: 0.2 }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="absolute rounded-full bg-red-600 mix-blend-screen"
                                    style={{ width: `${blastRadius * 2.5}px`, height: `${blastRadius * 2.5}px` }}
                                />
                                {/* Air Blast (Mid) */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 0.9 }}
                                    animate={{ scale: 1, opacity: 0.4 }}
                                    transition={{ duration: 1.2, delay: 0.1, ease: "circOut" }}
                                    className="absolute rounded-full bg-orange-500 mix-blend-screen"
                                    style={{ width: `${blastRadius * 1.5}px`, height: `${blastRadius * 1.5}px` }}
                                />
                                {/* Fireball (Inner) */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{ scale: 1, opacity: 0.8 }}
                                    transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
                                    className="absolute rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,0.8)]"
                                    style={{ width: `${blastRadius}px`, height: `${blastRadius}px` }}
                                />
                            </>
                        )}
                    </AnimatePresence>

                    {/* Ground Zero Crosshair */}
                    <Crosshair className="w-6 h-6 text-red-500 absolute z-20 opacity-70" />
                </div>

                {/* Controls (Console) */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    {/* Warhead Selector */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold bg-green-900/30 px-2 py-1 inline-block border border-green-800 rounded">
                            VELG STRIDSHODE
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {WARHEADS.map((w) => (
                                <button
                                    key={w.id}
                                    onClick={() => {
                                        setSelectedWarhead(w);
                                        setShowResults(false);
                                        playSound('arm');
                                    }}
                                    className={`p-3 border text-left transition-all relative overflow-hidden group ${selectedWarhead.id === w.id
                                        ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                        : 'border-green-900 bg-black hover:bg-green-900/20 opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className="font-bold">{w.name}</span>
                                        <span className="text-xs border border-current px-1">{w.yield < 1000 ? `${w.yield} KT` : `${w.yield / 1000} MT`}</span>
                                    </div>
                                    <div className="text-xs opacity-70 mt-1 relative z-10">{w.description} ({w.year})</div>

                                    {/* Selection Indicator */}
                                    {selectedWarhead.id === w.id && (
                                        <motion.div
                                            layoutId="active-selection"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Selector */}
                    <div className="flex gap-2">
                        {MAPS.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setTarget(m)}
                                className={`flex-1 text-xs py-2 border ${target.id === m.id ? 'bg-green-500 text-black border-green-500 font-bold' : 'border-green-800 text-green-700 hover:text-green-500'}`}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>

                    {/* Launch Control */}
                    <div className="mt-auto border-t-2 border-green-900/50 pt-6">
                        <div className="flex items-center gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${armed ? 'bg-red-900' : 'bg-green-900'}`}
                                    onClick={() => {
                                        setArmed(!armed);
                                        playSound('arm');
                                    }}
                                >
                                    <motion.div
                                        animate={{ x: armed ? 24 : 0 }}
                                        className={`w-4 h-4 rounded-full shadow-md ${armed ? 'bg-red-500' : 'bg-green-500'}`}
                                    />
                                </div>
                                <span className={`text-xs font-bold ${armed ? 'text-red-500 animate-pulse' : 'text-green-700'}`}>
                                    {armed ? 'SYSTEM ARMED' : 'SAFETY ON'}
                                </span>
                            </label>
                        </div>

                        <button
                            onClick={handleDetonate}
                            disabled={!armed || isDetonating}
                            className={`w-full py-4 text-xl font-black tracking-widest border-4 uppercase transition-all duration-100 ${!armed
                                ? 'border-green-900 text-green-900 cursor-not-allowed'
                                : isDetonating
                                    ? 'bg-red-500 text-black border-red-500'
                                    : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-black hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-95'
                                }`}
                        >
                            {isDetonating ? 'DETONATING...' : 'LAUNCH SEQUENCE'}
                        </button>
                    </div>

                    {/* Casualty Counter */}
                    <div className="bg-black border border-green-800 p-4 relative overflow-hidden h-24 flex flex-col justify-center">
                        <div className="absolute top-2 left-2 text-[10px] text-green-700 flex items-center gap-1">
                            <Skull className="w-3 h-3" /> ESTIMATED CASUALTIES
                        </div>
                        <div className="text-3xl md:text-4xl text-right font-mono text-green-500">
                            {/* Simple rolling number effect */}
                            <RollingNumber value={showResults ? casualties : 0} />
                        </div>
                    </div>

                </div>
            </div>

            <div className="mt-4 text-[10px] text-green-800 text-center font-mono">
                WARN: SIMULATION ONLY. ACTUAL BLAST EFFECTS MAY VARY BASED ON METEOROLOGY AND TOPOGRAPHY.
            </div>
        </div>
    );
};

const RollingNumber = ({ value }: { value: number }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const start = display;
        const duration = 1500;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = Math.floor(start + (value - start) * ease);
            setDisplay(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }, [value]);

    return <>{new Intl.NumberFormat('no-NO').format(display)}</>;
};
