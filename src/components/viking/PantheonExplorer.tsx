import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudLightning, Hammer, Heart, Skull } from 'lucide-react';

const gods = [
    {
        id: 'odin',
        name: 'Odin',
        title: 'Allfaderen',
        icon: <CloudLightning size={48} />,
        color: 'from-blue-700 to-indigo-900',
        desc: 'Sjefen over alle guder. Gud for visdom, krig og død. Ga bort det ene øyet sitt for å få drikke av visdommens brønn.'
    },
    {
        id: 'tor',
        name: 'Tor',
        title: 'Torden-guden',
        icon: <Hammer size={48} />,
        color: 'from-red-600 to-orange-800',
        desc: 'Menneskenes beskytter mot jotnene. Hissigpropp med hammeren Mjølner. Gud for styrke og torden.'
    },
    {
        id: 'froya',
        name: 'Frøya',
        title: 'Kjærlighets-gudinnen',
        icon: <Heart size={48} />,
        color: 'from-pink-500 to-rose-700',
        desc: 'Gudinne for fruktbarhet, kjærlighet, men også krig. Hun velger halvparten av de som dør i slag (den andre halvparten får Odin).'
    },
    {
        id: 'loke',
        name: 'Loke',
        title: 'Luringen',
        icon: <Skull size={48} />,
        color: 'from-green-600 to-emerald-800',
        desc: 'Egentlig halvt jotun. Skaper alltid trøbbel, men løser det også (ofte). Far til Midgardsormen, Fenrisulven og Hel.'
    }
];

export const PantheonExplorer: React.FC = () => {
    const [activeGod, setActiveGod] = useState(gods[0]);

    return (
        <div className="w-full max-w-4xl mx-auto my-12">
            <h3 className="text-2xl font-bold text-center mb-8 text-slate-800">Møt Gudene</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {gods.map((god) => (
                    <button
                        key={god.id}
                        onClick={() => setActiveGod(god)}
                        className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${activeGod.id === god.id
                                ? 'bg-slate-800 text-white shadow-xl scale-105'
                                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                            }`}
                    >
                        <div className={`text-${activeGod.id === god.id ? 'white' : 'slate-400'}`}>
                            {React.cloneElement(god.icon as React.ReactElement<{ size?: number }>, { size: 32 })}
                        </div>
                        <span className="font-bold">{god.name}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode='wait'>
                <motion.div
                    key={activeGod.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-2xl p-8 bg-gradient-to-br ${activeGod.color} text-white shadow-2xl relative overflow-hidden`}
                >
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="p-6 bg-white/10 rounded-full backdrop-blur-sm">
                            {activeGod.icon}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-4xl font-bold mb-2">{activeGod.name}</h2>
                            <h3 className="text-xl opacity-75 mb-4 font-serif">{activeGod.title}</h3>
                            <p className="text-lg leading-relaxed opacity-90">
                                {activeGod.desc}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
