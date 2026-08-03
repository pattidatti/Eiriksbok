import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dilemmas } from '../data/ethics/dilemmas';
import { ethicalSystems } from '../data/ethics/ethicalSystems';
import { DilemmaEngine } from '../components/content/interactive/ethics/DilemmaEngine';
import { MoralCompass } from '../components/content/interactive/ethics/MoralCompass';
import { MasteryResults } from '../components/content/interactive/ethics/MasteryResults';
import { Sparkles, Brain, Compass, ArrowRight, RotateCcw, Shield } from 'lucide-react';
import { useProgressStore } from '../features/progress/useProgressStore';

export const EthicsExperimentPage: React.FC = () => {
    const [step, setStep] = useState<'intro' | 'mode-select' | 'system-select' | 'theory-briefing' | 'experiment' | 'result'>('intro');
    const [mode, setMode] = useState<'explorer' | 'mastery'>('explorer');
    const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
    const [currentDilemmaIndex, setCurrentDilemmaIndex] = useState(0);
    const [choices, setChoices] = useState<Record<string, string>>({});
    const [score, setScore] = useState(0);

    const handleChoice = (dilemmaId: string, choiceId: string) => {
        setChoices(prev => ({ ...prev, [dilemmaId]: choiceId }));

        // Mastery mode scoring
        if (mode === 'mastery' && selectedSystemId) {
            const dilemma = dilemmas.find(d => d.id === dilemmaId);
            const choice = dilemma?.choices.find(c => c.id === choiceId);
            const response = choice?.responses.find(r => r.systemId === selectedSystemId);
            if (response?.verdict === 'accept') {
                setScore(prev => prev + 1);
            }
        }
    };

    const handleNext = () => {
        if (currentDilemmaIndex < dilemmas.length - 1) {
            setCurrentDilemmaIndex(prev => prev + 1);
        } else {
            // «Min læring»: eksperimentet er fullført. Id per etisk system
            // gjør at det lønner seg å prøve alle; utforskermodus er uscoret.
            useProgressStore.getState().recordActivity({
                kind: 'philosophy-quest',
                activityId:
                    mode === 'mastery' && selectedSystemId
                        ? `etikk/${selectedSystemId}`
                        : 'etikk/utforsker',
                subjectId: 'krle',
                title: 'Etikk-eksperimentet',
                score: mode === 'mastery' ? score / dilemmas.length : undefined,
            });
            setStep('result');
        }
    };

    const startExplorer = () => {
        setMode('explorer');
        setSelectedSystemId(null);
        setStep('experiment');
    };

    const startMastery = (systemId: string) => {
        setMode('mastery');
        setSelectedSystemId(systemId);
        setStep('theory-briefing');
    };

    const reset = () => {
        setChoices({});
        setScore(0);
        setCurrentDilemmaIndex(0);
        setStep('intro');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/10">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12">
                <AnimatePresence mode="wait">
                    {step === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-3xl mx-auto text-center py-20"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest mb-8 shadow-sm">
                                <Sparkles size={14} />
                                <span>Eksperimentell Modul</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-display font-black mb-8 leading-tight tracking-tight text-slate-900">
                                Etikk- <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Eksperimentet</span>
                            </h1>

                            <p className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed">
                                Velkommen til en reise gjennom moralens vanskeligste spørsmål.
                                Dine valg vil bli analysert gjennom linsen av verdens største filosofiske og religiøse systemer.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
                                    <Brain className="text-indigo-600 mb-4" size={24} />
                                    <h3 className="font-bold mb-2 text-slate-900">Dype Dilemmaer</h3>
                                    <p className="text-sm text-slate-500">Opplev situasjoner der det ikke finnes noen enkel fasit.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
                                    <Compass className="text-purple-600 mb-4" size={24} />
                                    <h3 className="font-bold mb-2 text-slate-900">Perspektiver</h3>
                                    <p className="text-sm text-slate-500">Se hvordan Kant, Bentham, Koranen og Bibelen ville vurdert deg.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
                                    <ArrowRight className="text-emerald-600 mb-4" size={24} />
                                    <h3 className="font-bold mb-2 text-slate-900">Moralsk Kompass</h3>
                                    <p className="text-sm text-slate-500">Få en visualisering av din egen etiske profil etterpå.</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep('mode-select')}
                                className="px-12 py-5 rounded-2xl bg-indigo-500 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-400 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20"
                            >
                                Start Eksperimentet
                            </button>
                        </motion.div>
                    )}

                    {step === 'mode-select' && (
                        <motion.div
                            key="mode-select"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl mx-auto py-12"
                        >
                            <h2 className="text-3xl font-display font-black text-center mb-12">Velg din vei</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <button
                                    onClick={startExplorer}
                                    className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-lg shadow-slate-200/50 hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all text-left group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                        <Compass size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-slate-900">Utforsker-modus</h3>
                                    <p className="text-slate-600 leading-relaxed mb-6">
                                        Ta egne valg og lær hvordan ulike teorier og religioner ser på dine beslutninger. Ingen riktige eller gale svar.
                                    </p>
                                    <span className="inline-flex items-center gap-2 text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                                        Velg denne <ArrowRight size={18} />
                                    </span>
                                </button>

                                <button
                                    onClick={() => setStep('system-select')}
                                    className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-lg shadow-slate-200/50 hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all text-left group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                                        <Sparkles size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-slate-900">Mester-modus</h3>
                                    <p className="text-slate-600 leading-relaxed mb-6">
                                        Velg et etisk system og prøv å navigere dilemmaene nøyaktig slik en tilhenger av dette systemet ville gjort.
                                    </p>
                                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold group-hover:translate-x-1 transition-transform">
                                        Velg denne <ArrowRight size={18} />
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'system-select' && (
                        <motion.div
                            key="system-select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-5xl mx-auto"
                        >
                            <div className="mb-8">
                                <button
                                    onClick={() => setStep('mode-select')}
                                    className="text-slate-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2"
                                >
                                    <RotateCcw size={14} /> Tilbake til modusvalg
                                </button>
                            </div>
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-display font-black mb-4">Velg systemet du vil mestre</h2>
                                <p className="text-slate-400">Klarer du å tenke som en utilitarist eller pliktetiker?</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {ethicalSystems.map(system => (
                                    <button
                                        key={system.id}
                                        onClick={() => startMastery(system.id)}
                                        className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-500/50 hover:shadow-md transition-all group"
                                    >
                                        <div className="text-center">
                                            <h4 className="font-bold mb-1 text-slate-900 group-hover:text-indigo-600 transition-colors">{system.name}</h4>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">{system.category}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-12 text-center">
                                <button
                                    onClick={() => setStep('mode-select')}
                                    className="text-slate-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2 mx-auto"
                                >
                                    <RotateCcw size={14} /> Gå tilbake
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'theory-briefing' && selectedSystemId && (
                        <motion.div
                            key="briefing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="max-w-5xl mx-auto"
                        >
                            <div className="mb-8">
                                <button
                                    onClick={() => setStep('system-select')}
                                    className="text-slate-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2"
                                >
                                    <RotateCcw size={14} /> Velg et annet system
                                </button>
                            </div>
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
                                    <Shield size={14} />
                                    Teoretisk Briefing
                                </div>
                                <h1 className="text-4xl md:text-5xl font-display font-black mb-4 text-slate-900">
                                    Din rolle: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">{ethicalSystems.find(s => s.id === selectedSystemId)?.name}</span>
                                </h1>
                                <div className="text-slate-500 text-sm font-bold mb-6 flex items-center justify-center gap-2">
                                    <span>Opphav:</span>
                                    <span className="text-slate-700">{ethicalSystems.find(s => s.id === selectedSystemId)?.origin}</span>
                                </div>
                                <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                                    For å mestre dette systemet må du forstå dets kjerne. Her er dine prinsipper:
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch mb-12">
                                <div className="lg:col-span-3 p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Shield size={160} className="text-purple-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 relative z-10 text-slate-900">
                                        <Sparkles className="text-purple-600" size={24} />
                                        Hva du må vite
                                    </h3>
                                    <p className="text-lg text-slate-700 leading-relaxed mb-6 relative z-10 font-medium">
                                        {ethicalSystems.find(s => s.id === selectedSystemId)?.description}
                                    </p>
                                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 relative z-10">
                                        <span className="text-[10px] font-black uppercase text-purple-600 block mb-1">Motto</span>
                                        <p className="text-lg font-display font-bold italic text-slate-800">"{ethicalSystems.find(s => s.id === selectedSystemId)?.motto}"</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-4">
                                    <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 shadow-sm h-full">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-6 flex items-center gap-2">
                                            <Brain size={16} />
                                            Kjerneprinsipper
                                        </h4>
                                        <ul className="space-y-4">
                                            {ethicalSystems.find(s => s.id === selectedSystemId)?.keyPrinciples.map((principle, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                                                    <span className="text-sm text-slate-700 leading-relaxed">{principle}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-slate-100 border border-slate-200 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <ArrowRight size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Din Strategi</h4>
                                        <p className="text-sm text-slate-600">{ethicalSystems.find(s => s.id === selectedSystemId)?.strategy}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setStep('system-select')}
                                        className="px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-sm hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Gå tilbake
                                    </button>
                                    <button
                                        onClick={() => setStep('experiment')}
                                        className="px-12 py-5 rounded-2xl bg-indigo-500 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-400 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20 flex items-center gap-3 shrink-0"
                                    >
                                        Jeg er klar <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'experiment' && (
                        <motion.div
                            key="experiment"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="w-full"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">Fremdrift</h2>
                                    <div className="flex gap-2">
                                        {dilemmas.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-500 ${idx < currentDilemmaIndex ? 'w-8 bg-emerald-500' :
                                                    idx === currentDilemmaIndex ? 'w-12 bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]' :
                                                        'w-4 bg-slate-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-display font-black text-indigo-600">
                                        {currentDilemmaIndex + 1}
                                    </span>
                                    <span className="text-slate-500 font-bold ml-1">/ {dilemmas.length}</span>
                                </div>
                            </div>

                            <DilemmaEngine
                                dilemma={dilemmas[currentDilemmaIndex]}
                                onChoice={handleChoice}
                                onNext={handleNext}
                                selectedChoiceId={choices[dilemmas[currentDilemmaIndex].id]}
                                mode={mode}
                                targetSystemId={selectedSystemId}
                            />
                        </motion.div>
                    )}

                    {step === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="max-w-5xl mx-auto"
                        >
                            {mode === 'mastery' && selectedSystemId ? (
                                <MasteryResults
                                    score={score}
                                    total={dilemmas.length}
                                    systemId={selectedSystemId}
                                    onReset={reset}
                                />
                            ) : (
                                <>
                                    <div className="text-center mb-16">
                                        <h2 className="text-4xl font-display font-black mb-4 text-slate-900">Ditt Moralske Kompass</h2>
                                        <p className="text-slate-600 max-w-2xl mx-auto">
                                            Basert på dine valg i de {dilemmas.length} dilemmaene, har vi beregnet din etiske tiltrekning.
                                            Merk at dette er en forenkling for læringens skyld.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
                                        <div className="bg-white border border-slate-200 shadow-xl rounded-[3rem] p-12 aspect-square flex items-center justify-center">
                                            <MoralCompass choices={choices} />
                                        </div>
                                        <div className="space-y-8">
                                            <h3 className="text-2xl font-bold mb-6 text-slate-900">Profil-analyse</h3>
                                            <p className="text-slate-600 leading-relaxed italic">
                                                Du har nå utforsket {dilemmas.length} ulike scenarioer.
                                                Dette diagrammet viser hvilke tankesett som resonnerer mest med dine valg.
                                                Husk at du kan gå tilbake og prøve "Mester-modus" for å lære mer om de andre teoriene!
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
                                                    <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">Utforsket antall</span>
                                                    <span className="text-lg font-bold text-slate-800">{dilemmas.length} Dilemmaer</span>
                                                </div>
                                                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 shadow-sm">
                                                    <span className="text-[10px] font-black uppercase text-purple-600 block mb-1">Teorier inkludert</span>
                                                    <span className="text-lg font-bold text-slate-800">12 Systemer</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={reset}
                                                className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                                            >
                                                <RotateCcw size={18} />
                                                <span>Start på nytt</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <h3 className="text-xl font-bold mb-8 text-slate-900">Lær mer om teoriene bak</h3>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {ethicalSystems.slice(0, 6).map(system => (
                                                <a
                                                    key={system.id}
                                                    href={system.articleLink}
                                                    className="px-6 py-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all text-sm font-medium text-slate-700"
                                                >
                                                    {system.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                /* Outfit selvhostes globalt via Fontsource (src/main.tsx) - ingen
                   @import her. Playfair Display ble lastet ned av den gamle
                   @import-en uten å være brukt av en eneste regel. */
                .font-display { font-family: 'Outfit', sans-serif; }
                h1, h2, h3 { font-family: 'Outfit', sans-serif; }
            ` }} />
        </div>
    );
};
