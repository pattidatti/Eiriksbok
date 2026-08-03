import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeskStore } from '../../stores/useDeskStore';
import { BookOpen, Glasses, Type, Layers, X } from 'lucide-react';

// Placeholder components for tools (will be replaced by actual implementations)
import { ToneTypewriter } from './ToneTypewriter';
import { TextAnalysisGame } from '../games/text-analysis/TextAnalysisGame';
import { InkParticles } from '../ui/InkParticles';
import type { TextAnalysisGameData, TextAnalysisSpan } from '../../types';

const DEMO_GAME_DATA: TextAnalysisGameData = {
    id: 'virkemidler-intro',
    title: 'Jakten på Skatten',
    text: "Solen hang som en blodappelsin over horisonten. Havet hvisket hemmeligheter til svaberget, mens vinden strøk det over kinnet. Han følte seg som en maur i universets store maskineri.",
    categories: [
        { id: 'metafor', label: 'Metafor', color: 'text-blue-500', description: 'Sammenligning uten "som"' },
        { id: 'besjeling', label: 'Besjeling', color: 'text-green-500', description: 'Ting får menneskelige egenskaper' },
        { id: 'simile', label: 'Sammenligning', color: 'text-purple-500', description: 'Sammenligning med "som"' }
    ],
    solutions: [
        { id: 'sol-appelsin', start: 0, end: 41, categoryId: 'simile', explanation: '"Solen hang som en blodappelsin" er en sammenligning.' },
        { id: 'havet-hvisket', start: 42, end: 104, categoryId: 'besjeling', explanation: 'Havet og vinden får menneskelige egenskaper (hvisket, strøk).' },
        { id: 'maur-maskineri', start: 105, end: 165, categoryId: 'metafor', explanation: '"Maur i universets store maskineri" er en metafor for å føle seg liten.' }
    ]
};

const CloseButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-50 group"
        title="Lukk"
    >
        <X size={24} className="text-stone-500 group-hover:text-stone-800" />
    </button>
);

const TypewriterView = ({ onClose }: { onClose: () => void }) => (
    <div className="relative w-full max-w-5xl bg-stone-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <CloseButton onClick={onClose} />
        <div className="p-8 pt-12">
            <ToneTypewriter />
        </div>
    </div>
);

const PrismView = ({ onClose }: { onClose: () => void }) => (
    <div className="bg-indigo-900 p-8 rounded-lg shadow-2xl max-w-4xl mx-auto mt-10 relative text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-indigo-300 hover:text-white">Lukk</button>
        <h2 className="text-3xl font-serif mb-4">Perspektiv-Prismet</h2>
        <p>Her kommer prismet...</p>
    </div>
);

const XRayView = ({ onClose, onFound }: { onClose: () => void, onFound: (item: TextAnalysisSpan) => void }) => (
    <div className="bg-slate-50 p-8 rounded-lg shadow-2xl max-w-4xl mx-auto mt-10 relative overflow-y-auto max-h-[80vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 z-10">Lukk</button>
        <TextAnalysisGame
            data={DEMO_GAME_DATA}
            onFound={onFound}
            onComplete={() => console.log("Level Complete!")}
        />
    </div>
);

const ScrapbookView = ({ onClose }: { onClose: () => void }) => (
    <div className="relative w-full max-w-4xl bg-amber-50 text-amber-900 rounded-xl shadow-2xl overflow-hidden p-8 border-4 border-amber-900/10 animate-in fade-in zoom-in-95 duration-300">
        <CloseButton onClick={onClose} />
        <h2 className="text-3xl font-serif mb-4 text-amber-900/80 tracking-widest uppercase border-b border-amber-900/10 pb-4">Min Samling</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="italic text-amber-800/60">Samlingen din er tom foreløpig...</p>
        </div>
    </div>
);


// Modulnivå, ikke inne i AuthorDesk: en komponent som defineres på nytt hver
// render får ny identitet, og React remonterer knappene i stedet for å
// oppdatere dem — det nullstiller både hover-animasjon og fokus.
const DeskItem = ({
    icon: Icon,
    label,
    position,
    onClick,
    locked
}: {
    icon: any,
    label: string,
    position: string,
    onClick: () => void,
    locked?: boolean
}) => (
    <motion.button
        whileHover={{ scale: 1.05, rotate: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`absolute ${position} group p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer outline-none`}
        disabled={locked}
    >
        <div id={Icon === BookOpen ? "scrapbook-icon" : undefined} className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl
            ${locked ? 'bg-stone-800 opacity-50' : 'bg-stone-800/80 backdrop-blur-sm border border-stone-600 group-hover:bg-stone-700 group-hover:border-amber-500'}`}>
            <Icon size={40} className={`text-stone-300 ${locked ? '' : 'group-hover:text-amber-400'}`} />
            {locked && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-0.5 bg-stone-500 rotate-45 absolute" /><div className="w-full h-0.5 bg-stone-500 -rotate-45 absolute" /></div>}
        </div>
        <span className={`font-serif text-lg tracking-wider bg-black/50 px-3 py-1 rounded backdrop-blur-sm
             ${locked ? 'text-stone-500' : 'text-stone-300 group-hover:text-amber-200'}`}>
            {label}
        </span>
    </motion.button>
);

export const AuthorDesk: React.FC = () => {
    const { tools, collectItem } = useDeskStore();
    const [activeTool, setActiveTool] = useState<keyof typeof tools | 'scrapbook' | null>(null);
    const [particleSource, setParticleSource] = useState<DOMRect | null>(null);

    // Desk Background Texture (CSS Gradient for now, replace with image later if needed)
    const deskBackground = "radial-gradient(circle at center, #3e2723 0%, #1a100e 100%)";

    const handleFoundItem = (item: TextAnalysisSpan) => {
        collectItem(item.id);
        // Trigger particles from center of screen (simplification since we play inside a modal)
        // Ideally we'd map from the specific text span, but center is safer for now
        const centerRect = new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0);
        setParticleSource(centerRect);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden" style={{ background: deskBackground }}>

            <InkParticles
                sourceRect={particleSource}
                targetSelector="#scrapbook-icon"
                onComplete={() => setParticleSource(null)}
            />

            {/* The Desk Surface */}
            <AnimatePresence mode="wait">
                {!activeTool && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                        className="relative w-full max-w-7xl mx-auto aspect-video bg-black/20 rounded-xl shadow-2xl border border-white/5"
                    >
                        {/* Title / Header */}
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
                            <h1 className="text-4xl md:text-6xl font-serif text-amber-100/80 tracking-widest drop-shadow-lg">FORFATTERENS SKRIVEBORD</h1>
                            <p className="text-stone-400 mt-2 font-mono text-sm tracking-widest uppercase">Virkemiddel-Laboratoriet</p>
                        </div>

                        {/* Tools placement */}

                        {/* Center: The Typewriter */}
                        {/* Center: The Typewriter */}
                        <DeskItem
                            icon={Type}
                            label="Tone-Mikseren"
                            position="top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2"
                            onClick={() => setActiveTool('typewriter')}
                            locked={!tools.typewriter}
                        />

                        {/* Top Left: Scrapbook */}
                        <DeskItem
                            icon={BookOpen}
                            label="Samlingen"
                            position="top-[25%] left-[20%]"
                            onClick={() => setActiveTool('scrapbook')}
                        />

                        {/* Top Right: Prism */}
                        <DeskItem
                            icon={Glasses}
                            label="Perspektiv-Prismet"
                            position="top-[25%] right-[20%]"
                            onClick={() => setActiveTool('prism')}
                            locked={!tools.prism}
                        />

                        {/* Bottom Right: X-Ray */}
                        <DeskItem
                            icon={Layers}
                            label="Litterært Røntgensyn"
                            position="bottom-[25%] right-[25%]"
                            onClick={() => setActiveTool('xray')}
                            locked={!tools.xray}
                        />

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile FAB Integration (Quick & Dirty Media Query Logic via CSS or rendering) */}
            {/* Note: Ideally we use a useMediaQuery hook. For now, we strictly use the Desktop view but we can add the FAB override here if needed. 
               Given the "Avant-Garde" request, let's add a simple responsive override. */}
            <div className="md:hidden fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setActiveTool(activeTool ? null : 'scrapbook')} // Simple toggle to open menu/scrapbook for now
                    className="bg-amber-500 text-stone-900 p-4 rounded-full shadow-xl shadow-amber-500/20 border border-amber-400"
                >
                    <BookOpen size={24} />
                </button>
                {/* A proper Mobile Drawer implementation would go here, simplifying the visuals for small screens. 
                   For this MVP iteration, we rely on the Responsive scaling, but the FAB is a good touch for the "future". 
                */}
            </div>

            {/* Active Tool View (Overlay) */}
            <AnimatePresence>
                {activeTool && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        {activeTool === 'typewriter' && <TypewriterView onClose={() => setActiveTool(null)} />}
                        {activeTool === 'prism' && <PrismView onClose={() => setActiveTool(null)} />}
                        {activeTool === 'xray' && <XRayView onClose={() => setActiveTool(null)} onFound={handleFoundItem} />}
                        {activeTool === 'scrapbook' && <ScrapbookView onClose={() => setActiveTool(null)} />}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
