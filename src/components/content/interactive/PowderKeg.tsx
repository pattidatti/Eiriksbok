import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Flame, Globe, Handshake, Swords, Skull, AlertTriangle, type LucideIcon } from 'lucide-react';

// Konfetti-eksplosjonen ligger på modulnivå: den bruker Date.now() til å styre
// varigheten, og impure kall som dette hører ikke hjemme inne i en komponent.
const burstConfetti = () => {
    const end = Date.now() + 3000;
    const frame = () => {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ef4444', '#f97316', '#000000'] // Red, Orange, Black (smoke/fire)
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ef4444', '#f97316', '#000000']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };
    frame();
};

interface Ingredient {
    id: string;
    name: string;
    icon: LucideIcon;
    description: string;
    color: string;
}

const INGREDIENTS: Ingredient[] = [
    { id: 'imperialism', name: 'Imperialisme', icon: Globe, description: 'Kampen om kolonier og ressurser', color: 'bg-blue-500' },
    { id: 'nationalism', name: 'Nasjonalisme', icon: AlertTriangle, description: 'Balkan-uro og selvstendighetstrang', color: 'bg-yellow-500' },
    { id: 'alliances', name: 'Allianser', icon: Handshake, description: 'Hemmelige avtaler og forpliktelser', color: 'bg-green-500' },
    { id: 'militarism', name: 'Militarisme', icon: Swords, description: 'Opprustning og krigsplaner', color: 'bg-purple-500' },
];

const SPARK: Ingredient = {
    id: 'spark',
    name: 'Skuddene i Sarajevo',
    icon: Flame,
    description: 'Gavrilo Princip tenner lunta',
    color: 'bg-red-600'
};

export const PowderKeg: React.FC = () => {
    const [addedIngredients, setAddedIngredients] = useState<string[]>([]);
    const [pressure, setPressure] = useState(0);
    const [isExploded, setIsExploded] = useState(false);
    const barrelControls = useAnimation();

    // Calculate barrel state based on pressure
    const barrelColor = pressure < 30 ? 'bg-slate-700' :
        pressure < 60 ? 'bg-orange-900' :
            pressure < 90 ? 'bg-red-900' : 'bg-red-600';

    const pulseDuration = Math.max(0.2, 2 - (pressure / 50)); // Faster pulse as pressure rises

    useEffect(() => {
        if (!isExploded) {
            barrelControls.start({
                scale: [1, 1.02, 1],
                transition: { duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }
            });
        }
    }, [pressure, isExploded, pulseDuration, barrelControls]);

    const handleDragEnd = (ingredient: Ingredient) => {
        addIngredient(ingredient.id);
    };

    const addIngredient = (id: string) => {
        if (addedIngredients.includes(id)) return;

        if (id === 'spark') {
            triggerExplosion();
        } else {
            setAddedIngredients(prev => [...prev, id]);
            setPressure(prev => Math.min(prev + 25, 99)); // Max 99 before spark
        }
    };

    const triggerExplosion = () => {
        setIsExploded(true);
        setPressure(100);
        barrelControls.stop();
        burstConfetti();
    };

    const isReadyForSpark = addedIngredients.length === INGREDIENTS.length;

    if (isExploded) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full h-[600px] rounded-xl overflow-hidden bg-black flex flex-col items-center justify-center text-center p-8 text-white border-4 border-red-600"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="mb-8"
                >
                    <Skull className="w-32 h-32 text-red-500 animate-pulse" />
                </motion.div>

                <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase text-red-500">Krigserklæring!</h2>
                <p className="text-xl max-w-md text-gray-300 mb-8 leading-relaxed">
                    Krutthuset har eksplodert. Allianseforpliktelsene trer i kraft umiddelbart.
                    Europa står i brann.
                </p>

                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
                    <p className="font-mono text-sm text-red-300">STATUS: TOTAL MOBILISERING</p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto my-12 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 p-6 bg-slate-800/80 backdrop-blur-md border-b border-slate-700 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" />
                        Europas Kruttønne (1914)
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Dra årsakene ned i tønna for å øke spenningen.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs uppercase tracking-wider text-slate-400">Spenning</span>
                    <div className="text-3xl font-black font-mono" style={{ color: `hsl(${120 - pressure}, 100%, 50%)` }}>
                        {pressure}%
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-8 min-h-[500px] flex flex-col items-center justify-between">

                {/* Ingredients Row */}
                <div className="flex flex-wrap gap-4 justify-center mb-12 w-full">
                    <AnimatePresence>
                        {INGREDIENTS.map((ing) => (
                            !addedIngredients.includes(ing.id) && (
                                <DraggableIngredient
                                    key={ing.id}
                                    data={ing}
                                    onDrop={() => handleDragEnd(ing)}
                                />
                            )
                        ))}
                    </AnimatePresence>

                    {isReadyForSpark && (
                        <DraggableIngredient
                            key={SPARK.id}
                            data={SPARK}
                            onDrop={() => handleDragEnd(SPARK)}
                            isSpark
                        />
                    )}
                </div>

                {/* The BARREL */}
                <div className="relative mt-8">
                    {/* Barrel Body */}
                    <motion.div
                        animate={barrelControls}
                        className={`w-64 h-80 rounded-b-3xl rounded-t-lg border-x-8 border-b-8 border-slate-600 ${barrelColor} transition-colors duration-1000 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden`}
                    >
                        {/* Liquid Level */}
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent w-full"
                            initial={{ height: '0%' }}
                            animate={{ height: `${pressure}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                        />

                        {/* Barrel Pattern Lines */}
                        <div className="absolute inset-0 flex flex-col justify-evenly opacity-30 pointer-events-none">
                            <div className="h-2 bg-black w-full" />
                            <div className="h-2 bg-black w-full" />
                            <div className="h-2 bg-black w-full" />
                        </div>

                        {/* Icon Badges inside Barrel */}
                        <div className="absolute z-10 flex flex-wrap gap-2 justify-center p-4 content-end h-full w-full pb-8">
                            {addedIngredients.map(id => {
                                const ing = INGREDIENTS.find(i => i.id === id);
                                if (!ing) return null;
                                return (
                                    <motion.div
                                        key={id}
                                        initial={{ scale: 0, y: -100 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="bg-slate-900/80 p-2 rounded-full border border-white/20 text-white shadow-lg"
                                    >
                                        <ing.icon size={20} />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Force Label */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 font-black text-6xl rotate-90 pointer-events-none select-none">KRIG</div>

                    </motion.div>

                    {/* Lid / Top Area Drop Zone Target (Visual only) */}
                    <div className="absolute -top-4 left-0 right-0 h-8 bg-slate-800 rounded-full border-4 border-slate-600 shadow-inner" />

                </div>
            </div>
        </div>
    );
};

// Sub-component for Draggables
const DraggableIngredient: React.FC<{ data: Ingredient; onDrop: () => void; isSpark?: boolean }> = ({ data, onDrop, isSpark }) => {
    return (
        <motion.div
            drag
            dragSnapToOrigin
            whileDrag={{ scale: 1.1, zIndex: 100, rotate: 5 }}
            whileHover={{ scale: 1.05, cursor: 'grab' }}
            whileTap={{ cursor: 'grabbing' }}
            onDragEnd={(_event, info) => {
                // Simple drop detection logic: if dragged down by > 100px
                if (info.offset.y > 100) {
                    onDrop();
                }
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className={`
        relative w-32 h-40 ${data.color} rounded-lg shadow-xl p-3 flex flex-col items-center justify-between text-center select-none
        border-2 border-white/20
        ${isSpark ? 'ring-4 ring-offset-4 ring-red-500 animate-pulse' : ''}
      `}
        >
            <div className="bg-black/20 p-2 rounded-full">
                <data.icon size={32} className="text-white" />
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-white text-sm leading-tight">{data.name}</span>
                <span className="text-[10px] text-white/80 leading-tight">{data.description}</span>
            </div>
            <div className="w-full bg-black/20 rounded-full py-1 text-[10px] text-white font-mono uppercase">
                DRAG ↓
            </div>
        </motion.div>
    );
};
