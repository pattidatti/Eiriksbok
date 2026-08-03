import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EthicalDilemma, Verdict } from '../../../../data/ethics/types';
import { ethicalSystems } from '../../../../data/ethics/ethicalSystems';
import { ExternalLink, Info, CheckCircle2, XCircle, HelpCircle, Sparkles, ArrowRight, ChevronRight, ChevronDown, Brain } from 'lucide-react';

interface DilemmaEngineProps {
    dilemma: EthicalDilemma;
    onChoice: (dilemmaId: string, choiceId: string) => void;
    onNext: () => void;
    selectedChoiceId?: string;
    mode: 'explorer' | 'mastery';
    targetSystemId: string | null;
}

export const DilemmaEngine: React.FC<DilemmaEngineProps> = ({
    dilemma,
    onChoice,
    onNext,
    selectedChoiceId,
    mode,
    targetSystemId
}) => {
    const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
    const targetSystem = ethicalSystems.find(s => s.id === targetSystemId);

    // Auto-expand target system in mastery mode when a choice is made. Justeres
    // under render i stedet for i en effect, så panelet er åpent allerede i det
    // bildet svaret vises — ikke ett bilde etterpå.
    const [prevChoiceId, setPrevChoiceId] = useState(selectedChoiceId);
    if (selectedChoiceId !== prevChoiceId) {
        setPrevChoiceId(selectedChoiceId);
        if (mode === 'mastery' && targetSystemId && selectedChoiceId) {
            setExpandedSystem(targetSystemId);
        }
    }

    const getVerdictIcon = (verdict: Verdict) => {
        switch (verdict) {
            case 'accept': return <CheckCircle2 className="text-emerald-400" size={18} />;
            case 'reject': return <XCircle className="text-rose-400" size={18} />;
            case 'complex': return <HelpCircle className="text-amber-400" size={18} />;
            case 'nuanced': return <Info className="text-blue-400" size={18} />;
            default: return null;
        }
    };

    const getVerdictLabel = (verdict: string) => {
        switch (verdict) {
            case 'accept': return 'Akseptabelt';
            case 'reject': return 'Uakseptabelt';
            case 'complex': return 'Komplekst';
            case 'nuanced': return 'Nyansert';
            default: return verdict;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Dilemma Presentation */}
            <div className="lg:col-span-7 space-y-8">
                <motion.div
                    key={dilemma.id + "-image"}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 shadow-2xl"
                >
                    <img
                        src={dilemma.image}
                        alt={dilemma.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-40 hover:opacity-20 transition-opacity duration-700" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <h1 className="text-3xl font-display font-black text-white drop-shadow-xl">
                            {dilemma.title}
                        </h1>
                    </div>
                </motion.div>

                <motion.div
                    key={dilemma.id + "-scenario"}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
                >
                    <p className="text-xl text-slate-700 leading-relaxed font-medium italic">
                        "{dilemma.scenario}"
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dilemma.choices.map((choice) => (
                        <button
                            key={choice.id}
                            onClick={() => onChoice(dilemma.id, choice.id)}
                            className={`group relative p-8 rounded-3xl border-2 transition-all duration-500 text-left overflow-hidden ${selectedChoiceId === choice.id
                                ? 'bg-indigo-50 border-indigo-600 shadow-lg shadow-indigo-100'
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                }`}
                            disabled={!!selectedChoiceId}
                        >
                            {selectedChoiceId === choice.id && mode === 'mastery' && targetSystemId && (
                                <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
                                    {choice.responses.find(r => r.systemId === targetSystemId)?.verdict === 'accept' ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-tighter shadow-sm">
                                            <Sparkles size={12} />
                                            <span>Korrekt valg</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-tighter shadow-sm">
                                            <span>Feil for teorien</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedChoiceId === choice.id && (
                                <motion.div
                                    layoutId="activeChoice"
                                    className="absolute inset-0 bg-indigo-500/10 pointer-events-none"
                                />
                            )}
                            <h3 className={`text-xl font-black mb-2 transition-colors ${selectedChoiceId === choice.id ? 'text-indigo-700' : 'text-slate-900'}`}>
                                {choice.label}
                            </h3>
                            {choice.description && (
                                <p className={`text-sm tracking-tight transition-colors ${selectedChoiceId === choice.id ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-600'}`}>
                                    {choice.description}
                                </p>
                            )}
                        </button>
                    ))}
                </div>

                {/* Theory Reference Anchor (Gult felt) */}
                {mode === 'mastery' && targetSystem && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 p-6 rounded-3xl bg-indigo-50 border border-indigo-100 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-white text-indigo-600 shadow-sm border border-indigo-100">
                                <Brain size={16} />
                            </div>
                            <h5 className="font-bold text-xs uppercase tracking-widest text-indigo-700">
                                Minneregler for {targetSystem.name}
                            </h5>
                        </div>
                        <div className="space-y-4">
                            {targetSystem.keyPrinciples.map((principle, idx) => (
                                <div key={idx} className="flex gap-5 items-start bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-hover duration-300 hover:shadow-md hover:border-indigo-100">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600 shrink-0 shadow-inner">
                                        {idx + 1}
                                    </div>
                                    <p className="text-base text-slate-700 leading-relaxed font-medium">
                                        {principle}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Perspectives Panel */}
            <div className="lg:col-span-5">
                <AnimatePresence mode="wait">
                    {selectedChoiceId ? (
                        <motion.div
                            key="responses"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white border border-slate-200 shadow-xl rounded-[2.5rem] p-8 h-full min-h-[600px]"
                        >
                            {mode === 'mastery' && targetSystemId && (
                                <div className={`p-6 rounded-3xl border mb-6 mt-2 transition-all duration-500 overflow-hidden relative ${selectedChoiceId
                                    ? (dilemma.choices.find(c => c.id === selectedChoiceId)?.responses.find(r => r.systemId === targetSystemId)?.verdict === 'accept'
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : 'bg-rose-500/10 border-rose-500/30')
                                    : 'bg-indigo-600/10 border-indigo-500/20'
                                    }`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Brain size={64} className={selectedChoiceId ? 'text-white' : 'text-indigo-400'} />
                                    </div>
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${selectedChoiceId
                                        ? (dilemma.choices.find(c => c.id === selectedChoiceId)?.responses.find(r => r.systemId === targetSystemId)?.verdict === 'accept'
                                            ? 'text-emerald-400'
                                            : 'text-rose-400')
                                        : 'text-indigo-400'
                                        }`}>
                                        {selectedChoiceId ? 'Læringspoeng' : 'Ditt Moralske Kompass'}
                                    </h4>
                                    {selectedChoiceId && targetSystem ? (
                                        <div className="flex-1">
                                            <p className="text-slate-900 text-lg font-bold leading-tight mb-2">
                                                {dilemma.choices.find(c => c.id === selectedChoiceId)?.responses.find(r => r.systemId === targetSystemId)?.verdict === 'accept'
                                                    ? 'Godt jobbet!'
                                                    : 'Ikke helt.'} Dette valget {dilemma.choices.find(c => c.id === selectedChoiceId)?.responses.find(r => r.systemId === targetSystemId)?.verdict === 'accept' ? 'stemmer overens med' : 'bryter med'} {targetSystem?.name}s prinsipper.
                                            </p>
                                            <p className="text-slate-700 text-lg leading-relaxed italic font-medium">
                                                {dilemma.choices.find(c => c.id === selectedChoiceId)?.responses.find(r => r.systemId === targetSystemId)?.explanation}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-base text-slate-700 font-medium mb-3 relative z-10 leading-relaxed">
                                            Du spiller nå som en {targetSystem?.name}.
                                        </p>
                                    )}

                                    {!selectedChoiceId && (
                                        <div className="pt-3 border-t border-indigo-200">
                                            <span className="text-[9px] font-black uppercase text-indigo-700 block mb-2">Husk dine prinsipper:</span>
                                            <ul className="space-y-1.5">
                                                {ethicalSystems.find(s => s.id === targetSystemId)?.keyPrinciples.slice(0, 2).map((p, i) => (
                                                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5" />
                                                        <span>{p}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Sort ethical systems to put target system first in mastery mode */}
                                {[...ethicalSystems]
                                    .sort((a, b) => {
                                        if (mode === 'mastery' && targetSystemId) {
                                            if (a.id === targetSystemId) return -1;
                                            if (b.id === targetSystemId) return 1;
                                        }
                                        return 0;
                                    })
                                    .map(system => {
                                        const response = dilemma.choices.find(c => c.id === selectedChoiceId)?.responses.find(r => r.systemId === system.id);
                                        if (!response) return null;

                                        const isExpanded = expandedSystem === system.id;
                                        const isTarget = mode === 'mastery' && system.id === targetSystemId;

                                        return (
                                            <div
                                                key={system.id}
                                                className={`rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${isExpanded
                                                    ? (system.category === 'religious' ? 'bg-amber-50 border-amber-500/40 shadow-lg shadow-amber-500/10' : 'bg-indigo-50 border-indigo-500/40 shadow-lg shadow-indigo-500/10')
                                                    : (isTarget ? 'bg-indigo-50/30 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300')
                                                    }`}
                                                onClick={() => setExpandedSystem(isExpanded ? null : system.id)}
                                            >
                                                <div className="p-4 flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg transition-colors ${isExpanded
                                                            ? (system.category === 'religious' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white')
                                                            : (isTarget ? 'bg-indigo-500 text-white animate-pulse' : (system.category === 'religious' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'))
                                                            }`}>
                                                            {system.name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-sm tracking-tight">{system.name}</h4>
                                                                {isTarget && (
                                                                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500 text-[8px] font-black uppercase text-white">Mål</span>
                                                                )}
                                                            </div>
                                                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                                                                {system.category === 'religious' ? 'Religiøst' : 'Sekulært'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                                                            {getVerdictIcon(response.verdict)}
                                                            <span className="text-[9px] font-black uppercase text-slate-700">
                                                                {getVerdictLabel(response.verdict)}
                                                            </span>
                                                        </div>
                                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-x-1'}`}>
                                                            {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                                                        </div>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                        >
                                                            <div className="px-5 pb-5 pt-2 border-t border-slate-200">
                                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                                    {response.explanation}
                                                                </p>
                                                                <div className="mt-4 flex items-center justify-between">
                                                                    <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Kilde: {system.origin}</span>
                                                                    <a
                                                                        href={system.articleLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                                                                    >
                                                                        Lær mer <ExternalLink size={10} />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                            </div>

                            <div className="mt-8 space-y-4">
                                <p className="text-sm text-indigo-300 italic text-center">
                                    "Trykk på boksene ovenfor for å se dypere analyser."
                                </p>

                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={onNext}
                                    className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-400 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                                >
                                    <span>Neste dilemma</span>
                                    <ArrowRight size={16} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bg-white border-2 border-slate-200 border-dashed rounded-[2.5rem] p-12 h-full flex flex-col items-center justify-center text-center">
                            <Info size={48} className="text-slate-300 mb-6" />
                            <h3 className="text-xl font-bold text-slate-400 mb-2">Venter på ditt valg</h3>
                            <p className="text-sm text-slate-500">Gjør et valg for å se hvordan ulike etiske systemer vurderer situasjonen.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
