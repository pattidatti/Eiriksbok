import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { BookOpen, Mic2, Layers, Archive, HelpCircle } from 'lucide-react';
import { ToneMixer } from './tools/ToneMixer';
import { XRay } from './tools/XRay';
import { Scrapbook } from './tools/Scrapbook';
import { InkParticles } from '../ui/InkParticles';

// Assets
// Bakgrunns- og korntekstur lå her tidligere, men filene har aldri ligget i
// public/. Lagene rendret derfor alltid tomt og ga kun to 404-er per visning.
// Fjernet framfor å late som de finnes; skal papirlooken inn igjen, må
// bildene legges i public/assets/workstation/ først.

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <motion.button
        whileHover={{ scale: 1.05, x: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        aria-label={label}
        className={`relative group w-16 h-16 mb-6 rounded-2xl flex flex-col items-center justify-center transition-all duration-300
      ${active
                ? 'bg-amber-100/50 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-white/40 border border-stone-900/5 hover:bg-white/60 hover:border-stone-900/20'}`}
    >
        <Icon size={28} className={`transition-colors duration-300 ${active ? 'text-amber-700' : 'text-stone-500 group-hover:text-stone-800'}`} />

        {/* Tooltip Label */}
        <div className="absolute left-full ml-4 px-3 py-1 bg-black/80 text-amber-100 text-xs tracking-widest uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-md border border-white/10">
            {label}
        </div>

        {/* Active Indicator Line */}
        {active && (
            <motion.div
                layoutId="active-pill"
                className="absolute left-0 w-1 h-8 bg-amber-500 rounded-r-full"
            />
        )}
    </motion.button>
);

const MissionControl = ({ activeTool }: { activeTool: 'writer' | 'xray' | 'scrapbook' }) => (
    <div className="w-80 h-full bg-slate-900/80 backdrop-blur-xl border-l border-white/5 p-6 flex flex-col pointer-events-auto">
        <h3 className="text-amber-500/80 font-mono text-xs tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Mission Control
        </h3>

        <div className="space-y-6">
            <div className={`bg-black/40 border p-4 rounded-lg relative overflow-hidden group transition-all duration-300 ${activeTool === 'xray' ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/10 opacity-60 hover:opacity-100'}`}>
                <div className="absolute top-0 right-0 p-2 opacity-50"><HelpCircle size={16} className="text-stone-500" /></div>
                <h4 className="text-stone-200 font-serif text-xl mb-2">Jakten på Metaforen</h4>
                <p className="text-stone-400 text-sm leading-relaxed">
                    Teksten inneholder 3 skjulte metaforer. Bruk <span className="text-amber-400 font-mono text-xs">RØNTGENSYN</span> for å finne dem.
                </p>
                <div className="mt-4 flex gap-1">
                    <div className="h-1 flex-1 bg-amber-500/50 rounded-full" />
                    <div className="h-1 flex-1 bg-stone-800 rounded-full" />
                    <div className="h-1 flex-1 bg-stone-800 rounded-full" />
                </div>
            </div>

            <div className="p-4 rounded-lg border border-dashed border-stone-800 text-stone-600 text-xs font-mono text-center">
                Drar elementer hit for å samle...
            </div>
        </div>
    </div>
);

export const WorkstationLayout: React.FC = () => {
    const [activeTool, setActiveTool] = useState<'writer' | 'xray' | 'scrapbook'>('writer');
    const [particleSource, setParticleSource] = useState<DOMRect | null>(null);

    const handleItemFound = () => {
        // Trigger particles from center of screen for now
        const centerRect = new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0);
        setParticleSource(centerRect);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#f8f5f2] text-stone-900 selection:bg-amber-200">

            <InkParticles
                sourceRect={particleSource}
                targetSelector="button[aria-label='Samlingen']" // We need to target the collection button or icon
                onComplete={() => setParticleSource(null)}
            />

            {/* Vignette - Lighter, softer */}
            <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent via-white/10 to-stone-200/50 pointer-events-none" />

            {/* Main Grid Layout */}
            <div className="relative z-10 flex w-full h-full">

                {/* Sidebar Dock */}
                <div className="w-24 h-full flex flex-col items-center py-8 z-20 border-r border-stone-900/10 bg-white/40 backdrop-blur-xl">
                    <div className="mb-8 p-3 bg-amber-100 rounded-full border border-amber-500/20">
                        <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    </div>

                    <div className="flex-1 flex flex-col w-full items-center">
                        <SidebarItem
                            icon={Mic2}
                            label="Tone-Mikser"
                            active={activeTool === 'writer'}
                            onClick={() => setActiveTool('writer')}
                        />
                        <SidebarItem
                            icon={Layers}
                            label="Røntgensyn"
                            active={activeTool === 'xray'}
                            onClick={() => setActiveTool('xray')}
                        />
                        <SidebarItem
                            icon={BookOpen}
                            label="Samlingen"
                            active={activeTool === 'scrapbook'}
                            onClick={() => setActiveTool('scrapbook')}
                        />
                    </div>

                    <div className="mb-4">
                        <SidebarItem
                            icon={Archive}
                            label="Hjem"
                            active={false}
                            onClick={() => window.location.href = '/'}
                        />
                    </div>
                </div>

                {/* Stage (Content Area) */}
                <div className="flex-1 relative overflow-hidden flex">

                    {/* The Actual Tool View */}
                    <main className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTool}
                                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="w-full max-w-5xl h-full flex items-center justify-center"
                            >
                                {activeTool === 'writer' && (
                                    <div className="text-center">
                                        <h1 className="text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-br from-amber-100 to-amber-600 mb-4 drop-shadow-sm">Tone-Mikseren</h1>
                                        <p className="font-mono text-amber-500/60 tracking-widest text-sm uppercase">Laster Modul...</p>
                                        {/* Placeholder for Equalizer UI */}
                                        <div className="mt-8 w-full h-full flex-1">
                                            <ToneMixer />
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'xray' && (
                                    <XRay onFound={handleItemFound} />
                                )}
                                {activeTool === 'scrapbook' && (
                                    <Scrapbook />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </main>

                    {/* Mission Control Panel (Right Side) */}
                    <MissionControl activeTool={activeTool} />

                </div>

            </div>
        </div>
    );
};
