import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Book, Quote, Info, type LucideIcon } from 'lucide-react';

type AuthorityType = 'traditional' | 'charismatic' | 'legal';

interface AuthorityData {
    title: string;
    rhetoric: string;
    source: string;
    description: string;
    example: string;
    color: string;
    icon: LucideIcon;
}

const authorityData: Record<AuthorityType, AuthorityData> = {
    traditional: {
        title: "Tradisjonell autoritet",
        rhetoric: "Jeg styrer fordi mine fedre og deres fedre styrte før meg. Det er den naturlige orden, velsignet av historien og det hellige.",
        source: "Arv og sedvane",
        description: "Makt basert på troen på at 'slik har det alltid vært'. Man adlyder personen på grunn av deres nedarvede status.",
        example: "Gamle kongedømmer, klanledere.",
        color: "bg-amber-600",
        icon: Crown
    },
    charismatic: {
        title: "Karismatisk autoritet",
        rhetoric: "Følg meg! Jeg alene ser veien ut av kaoset. Stol på min styrke og min visjon, for jeg er utvalgt til å lede oss til seier!",
        source: "Lederens personlighet",
        description: "Makt basert på hengivenhet til en spesielt hellig, heroisk eller eksepsjonell personlighet. Man adlyder lederen personlig.",
        example: "Religiøse profeter, revolusjonære ledere, populister.",
        color: "bg-red-600",
        icon: Zap
    },
    legal: {
        title: "Legalt-rasjonell autoritet",
        rhetoric: "Jeg utøver min myndighet i samsvar med paragraf 4, ledd 2 i grunnloven. Ingen står over loven, heller ikke jeg.",
        source: "Lov og byråkrati",
        description: "Makt basert på troen på at reglene og lovene er rettferdige. Man adlyder ikke personen, men kontoret eller stillingen de innehar.",
        example: "Moderne demokratier, rettsstater.",
        color: "bg-blue-600",
        icon: Book
    }
};

export const AuthorityShifter: React.FC = () => {
    const [type, setType] = useState<AuthorityType>('traditional');
    const data = authorityData[type];
    const Icon = data.icon;

    return (
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 my-10 shadow-lg">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                    <Info size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Webers autoritetstyper</h3>
                    <p className="text-slate-500 text-sm">Hvorfor adlyder vi lederen? Velg en type for å se hvordan makten endrer karakter.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {(Object.keys(authorityData) as AuthorityType[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => setType(key)}
                        className={`px-4 py-3 rounded-xl font-bold transition-all duration-300 text-sm flex items-center justify-center gap-2 ${type === key
                            ? `${authorityData[key].color} text-white shadow-md ring-4 ring-slate-200`
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm'
                            }`}
                    >
                        {React.createElement(authorityData[key].icon, { size: 18 })}
                        {authorityData[key].title.split(' ')[0]}
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-center bg-white p-8 rounded-xl border border-slate-100 shadow-inner">
                {/* Visual Character Representation */}
                <div className="w-full md:w-1/3 flex justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={type}
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            className={`w-48 h-64 rounded-t-full relative flex items-center justify-center border-4 border-b-0 ${data.color.replace('bg-', 'border-')} shadow-2xl overflow-hidden`}
                        >
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-slate-200 opacity-20" />
                            <div className="relative z-10 flex flex-col items-center">
                                <Icon size={80} className={`${data.color.replace('bg-', 'text-')} mb-4`} />
                                <div className="w-16 h-1 w-full bg-slate-800 rounded-full opacity-10" />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Info Area */}
                <div className="w-full md:w-2/3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={type}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-blue-500 relative">
                                <Quote className="absolute top-2 right-4 text-slate-200" size={40} />
                                <p className="text-xl font-medium text-slate-800 italic leading-relaxed">
                                    "{data.rhetoric}"
                                </p>
                                <p className="text-right text-sm font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                                    — Lederens retorikk
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Maktens kilde</span>
                                    <span className="text-slate-700 font-bold">{data.source}</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Typisk eksempel</span>
                                    <span className="text-slate-700 font-bold">{data.example}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Pedagogisk forklaring</span>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    {data.description}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
