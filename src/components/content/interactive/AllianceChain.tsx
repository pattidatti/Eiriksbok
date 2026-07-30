import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface CountryNode {
    id: string;
    name: string;
    alliance: 'entente' | 'central' | 'neutral';
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
}

const NODES: CountryNode[] = [
    { id: 'britain', name: 'Storbritannia', alliance: 'entente', x: 15, y: 25 },
    { id: 'france', name: 'Frankrike', alliance: 'entente', x: 20, y: 55 },
    { id: 'germany', name: 'Tyskland', alliance: 'central', x: 50, y: 35 },
    { id: 'austria', name: 'Øst-Ungarn', alliance: 'central', x: 55, y: 65 },
    { id: 'russia', name: 'Russland', alliance: 'entente', x: 80, y: 30 },
    { id: 'serbia', name: 'Serbia', alliance: 'entente', x: 65, y: 85 },
];

const STEPS = [
    {
        id: 'step1',
        description: 'Skuddene i Sarajevo',
        detail: 'Gavrilo Princip skyter erkehertug Franz Ferdinand.',
        activeNodes: ['serbia'],
        activeEdges: [],
    },
    {
        id: 'step2',
        description: 'Ultimatumet',
        detail: 'Østerrike-Ungarn skylder på Serbia og truer med krig.',
        activeNodes: ['serbia', 'austria'],
        activeEdges: [{ from: 'austria', to: 'serbia', label: '⚔️' }],
    },
    {
        id: 'step3',
        description: 'Blankofullmakten',
        detail: 'Tyskland lover å støtte Østerrike-Ungarn uansett hva som skjer.',
        activeNodes: ['serbia', 'austria', 'germany'],
        activeEdges: [{ from: 'germany', to: 'austria', label: '🤝' }],
    },
    {
        id: 'step4',
        description: 'Russisk Mobilisering',
        detail: 'Russland er Serbias beskytter og gjør klar hæren.',
        activeNodes: ['serbia', 'austria', 'germany', 'russia'],
        activeEdges: [{ from: 'russia', to: 'serbia', label: '🛡️' }],
    },
    {
        id: 'step5',
        description: 'Schlieffenplanen',
        detail: 'Tyskland erklærer krig mot Russland og angriper Frankrike.',
        activeNodes: ['serbia', 'austria', 'germany', 'russia', 'france'],
        activeEdges: [
            { from: 'germany', to: 'russia', label: '⚔️' },
            { from: 'russia', to: 'france', label: '🤝' }
        ],
    },
    {
        id: 'step6',
        description: 'Britisk Inntreden',
        detail: 'Tyskland invaderer nøytrale Belgia, noe som drar britene inn.',
        activeNodes: ['serbia', 'austria', 'germany', 'russia', 'france', 'britain'],
        activeEdges: [{ from: 'britain', to: 'france', label: '🤝' }],
    },
];

export const AllianceChain: React.FC = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const currentStep = STEPS[currentStepIndex];
    const isFinished = currentStepIndex === STEPS.length - 1;

    const nextStep = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const reset = () => setCurrentStepIndex(0);

    return (
        <div className="w-full my-12 p-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden relative font-serif text-slate-800">
            {/* Background Decor - Light Mode.
                Papirteksturen som lå her pekte på /patterns/paper-texture.png,
                en mappe som ikke finnes i public/. Laget var tomt og ga en 404. */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50/50 blur-3xl rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 px-6 pt-6 pb-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 font-serif">
                        Alliansesystemet: En Kjedereaksjon
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">Hvordan avtaler mellom land dro hele verden inn i krig</p>
                </div>

                <div className="flex gap-2">
                    {!isFinished ? (
                        <button
                            onClick={nextStep}
                            className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
                        >
                            <span>{currentStepIndex === 0 ? 'Start' : 'Neste'}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded transition-all active:scale-95 text-sm"
                        >
                            Start På Nytt
                        </button>
                    )}
                </div>
            </div>

            {/* VERTICAL STACK LAYOUT */}
            <div className="flex flex-col relative z-10">

                {/* 1. Visual Stage (Top, Full Width) */}
                <div className="w-full h-[450px] md:h-[500px] relative bg-slate-50/50 border-b border-slate-200">

                    {/* Legend */}
                    <div className="absolute top-4 left-4 flex gap-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 z-20 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500"></span>
                            Ententen
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-100 border-2 border-amber-600"></span>
                            Sentralmaktene
                        </div>
                    </div>

                    <svg className="w-full h-full absolute inset-0 pointer-events-none">
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="28" // Adjusted to stop before the node
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" opacity="0.6" />
                            </marker>
                            <marker
                                id="arrowhead-active"
                                markerWidth="10"
                                markerHeight="7"
                                refX="28"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
                            </marker>
                        </defs>

                        <AnimatePresence>
                            {STEPS.slice(0, currentStepIndex + 1).map((step, stepIndex) =>
                                step.activeEdges.map((edge, i) => {
                                    const fromNode = NODES.find(n => n.id === edge.from)!;
                                    const toNode = NODES.find(n => n.id === edge.to)!;
                                    const isCurrentStep = stepIndex === currentStepIndex;

                                    return (
                                        <motion.g key={`${step.id}-${i}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: isCurrentStep ? 1 : 0.4 }} // Dim past steps
                                            transition={{ duration: 1 }}
                                        >
                                            <line
                                                x1={`${fromNode.x}%`} y1={`${fromNode.y}%`}
                                                x2={`${toNode.x}%`} y2={`${toNode.y}%`}
                                                className={clsx(
                                                    "stroke-red-600 transition-all duration-500",
                                                    isCurrentStep ? "stroke-[3px]" : "stroke-[2px]"
                                                )}
                                                strokeDasharray={isCurrentStep ? "none" : "4 4"}
                                                markerEnd={isCurrentStep ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                            />
                                            {isCurrentStep && (
                                                <motion.circle
                                                    r="4"
                                                    fill="#dc2626"
                                                    animate={{
                                                        offsetDistance: "100%",
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        ease: "linear",
                                                        repeat: Infinity,
                                                    }}
                                                    style={{
                                                        offsetPath: `path("M ${fromNode.x * 4} ${fromNode.y * 4} L ${toNode.x * 4} ${toNode.y * 4}")`
                                                    }}
                                                />
                                            )}
                                        </motion.g>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </svg>

                    {/* Nodes - Simplified Design */}
                    {NODES.map((node) => {
                        const isActive = currentStep.activeNodes.includes(node.id);
                        return (
                            <motion.div
                                key={node.id}
                                className={clsx(
                                    "absolute w-28 md:w-32 py-2 px-3 rounded-full border-2 text-center transition-all duration-500 flex flex-col items-center justify-center z-10",
                                    isActive
                                        ? node.alliance === 'entente'
                                            ? "bg-blue-50 border-blue-500 shadow-md scale-105"
                                            : "bg-amber-50 border-amber-600 shadow-md scale-105"
                                        : "bg-white border-slate-200 opacity-40 grayscale"
                                )}
                                style={{
                                    left: `${node.x}%`,
                                    top: `${node.y}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <span className="font-bold text-xs md:text-sm text-slate-900 leading-none">{node.name}</span>
                            </motion.div>
                        );
                    })}

                    {/* Edge Labels - Numbered Badges & Icons */}
                    {STEPS.slice(0, currentStepIndex + 1).map((step, stepIndex) =>
                        step.activeEdges.map((edge, i) => {
                            const fromNode = NODES.find(n => n.id === edge.from)!;
                            const toNode = NODES.find(n => n.id === edge.to)!;
                            const midX = (fromNode.x + toNode.x) / 2;
                            const midY = (fromNode.y + toNode.y) / 2;
                            const isCurrentStep = stepIndex === currentStepIndex;

                            return (
                                <motion.div
                                    key={`label-${step.id}-${i}`}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={clsx(
                                        "absolute flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 transition-all duration-500",
                                        isCurrentStep
                                            ? "bg-red-600 border-red-700 text-white scale-110 shadow-lg ring-2 ring-red-100"
                                            : "bg-white border-red-100 text-slate-400"
                                    )}
                                    style={{ left: `${midX}%`, top: `${midY}%` }}
                                >
                                    <span className={clsx("font-bold text-xs font-mono", isCurrentStep ? "text-white" : "text-red-300")}>
                                        {stepIndex + 1}
                                    </span>
                                    <span className="text-xs">{edge.label}</span>
                                </motion.div>
                            )
                        })
                    )}
                </div>

                {/* 2. Narrative Panel (Bottom, Full Width) */}
                <div className="bg-white p-6 md:p-8">

                    {/* Active Step Highlight */}
                    <div className="mb-8 min-h-[120px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="border-l-4 border-red-600 pl-4 py-1"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-700 font-bold uppercase text-sm tracking-wider">Steg {currentStepIndex + 1} av {STEPS.length}</span>
                                    <span className="h-px w-10 bg-red-200"></span>
                                </div>
                                <h4 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 font-serif">
                                    {currentStep.description}
                                </h4>
                                <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-3xl">
                                    {currentStep.detail}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* History / Steps Indicator (Horizontal Grid) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-6 border-t border-slate-100">
                        {STEPS.map((step, index) => {
                            const status = index === currentStepIndex ? 'active' : index < currentStepIndex ? 'past' : 'future';
                            return (
                                <div
                                    key={step.id}
                                    className={clsx(
                                        "p-2 rounded border text-xs transition-colors cursor-default",
                                        status === 'active' ? "bg-red-50 border-red-200 text-red-800 font-bold" :
                                            status === 'past' ? "bg-slate-50 border-slate-200 text-slate-500" :
                                                "bg-white border-slate-100 text-slate-300"
                                    )}
                                >
                                    <span className="block mb-1 uppercase text-[10px] tracking-wider opacity-70">
                                        {index + 1}. {index === 0 ? 'Start' : 'Steg ' + (index + 1)}
                                    </span>
                                    <span className="leading-tight block truncate" title={step.description}>
                                        {step.description}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                </div>

            </div>
        </div>
    );
};

// Add standard styles for custom scrollbar if needed, typically in global CSS but kept simple here
