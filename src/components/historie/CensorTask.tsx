import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Ikonene under var material-icons-ligaturer («verified_user», «approval»,
// «arrow_forward»), men Material Icons-fonten lastes ingen steder i prosjektet.
// Uten fonten rendrer nettleseren ligaturnavnet som ren tekst, så eleven så
// ordet «arrow_forward» stå i knappen. Byttet til lucide-react, som resten av
// kodebasen bruker og som er SVG uten fontavhengighet.
import { X, ShieldCheck, Stamp, ArrowRight } from 'lucide-react';

const LEVEL_CONFIG = [
    {
        id: 0,
        difficulty: 'REKRUTT',
        sender: 'Menig Peder',
        vibe: 'bg-[#f0e6d2]',
        instructions: [
            "Ingen detaljer om tap eller død.",
            "Ingen stedsnavn eller posisjoner.",
            "Ingen klaging (defaitisme)."
        ],
        segments: [
            { id: 1, text: "Kjære Mor og Far,", type: "safe" },
            { id: 2, text: "Livet i skyttergravene er hardt, men vi holder motet oppe.", type: "safe" },
            { id: 3, text: "Rasjonene kommer frem, og vi har godt med ammunisjon.", type: "safe" },
            { id: 4, text: "I går stormet vi tyskernes linjer. Det var et blodbad.", type: "danger" },
            { id: 5, text: "Jeg så Jakob bli revet i to av granatsplinter rett foran meg.", type: "danger" },
            { id: 6, text: "Løytnanten sier vi vinner, men jeg tror han lyver.", type: "suspicious" },
            { id: 7, text: "Send flere ullsokker. Vinteren kommer til å bli kald.", type: "safe" },
            { id: 8, text: "Din sønn, Peder.", type: "safe" },
        ]
    },
    {
        id: 1,
        difficulty: 'POETEN',
        sender: 'Korporal Eirik',
        vibe: 'bg-[#e8e4d9]', // Lighter, finer paper
        instructions: [
            "Ingen melankoli eller håpløshet.",
            "Sensurer metaforer for død.",
            "Hold moralen kunstig høy."
        ],
        segments: [
            { id: 1, text: "Min kjære,", type: "safe" },
            { id: 2, text: "Regnet faller som tårer over ingenmannsland.", type: "safe" }, // Borderline safe
            { id: 3, text: "Stjernene faller over Somme i natt.", type: "danger" }, // Artillery metaphor
            { id: 4, text: "Jorden drikker seg utørst på rødt.", type: "danger" }, // Blood metaphor
            { id: 5, text: "Vi er bare spøkelser som venter på daggry.", type: "suspicious" }, // Defeatism
            { id: 6, text: "Men fuglene synger fortsatt.", type: "safe" },
            { id: 7, text: "Jeg tenker på deg når kanonene stilner.", type: "safe" },
            { id: 8, text: "Din, E.", type: "safe" }
        ]
    },
    {
        id: 2,
        difficulty: 'SPIONEN',
        sender: 'Ukjent Avsender',
        vibe: 'bg-[#fcfcfc]', // Stark white, official
        instructions: [
            "TOTAL INFORMASJONSKONTROLL.",
            "Sensurer ALLE tall og logistikk.",
            "Sensurer posisjoner.",
            "Ingenting som kan hjelpe fienden."
        ],
        segments: [
            { id: 1, text: "Rapport til HQ:", type: "safe" },
            { id: 2, text: "Forsyningene er mottatt.", type: "safe" },
            { id: 3, text: "Vi flytter oss til Sektor 4 ved daggry.", type: "danger" }, // Position
            { id: 4, text: "Send 500 kasser ammunisjon.", type: "danger" }, // Numbers/Logistics
            { id: 5, text: "Jernbanelinjen ved Amiens er operativ.", type: "danger" }, // Critical infra
            { id: 6, text: "Moralen blant troppene er høy.", type: "safe" },
            { id: 7, text: "Venter på videre ordre.", type: "safe" },
            { id: 8, text: "X", type: "safe" }
        ]
    }
];

const FEEDBACK = {
    lenient: {
        title: "For mild sensur!",
        message: "Brevet ble sendt med sjokkerende detaljer. Foreldrene er i opprør og deler historiene med naboene. Krigsmoralen synker.",
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200"
    },
    strict: {
        title: "For streng sensur!",
        message: "Du sladdet nesten alt. Foreldrene mottar bare svarte streker og blir livredde. Rykter om mytteri begynner å gå.",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200"
    },
    perfect: {
        title: "Perfekt sensur",
        message: "Godt jobbet! Brevet er trygt. Familien blir beroliget av at sønnen er i live, men skjermes for krigens grusomme virkelighet.",
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200"
    }
};

export const CensorTask: React.FC = () => {
    const [currentLevel, setCurrentLevel] = useState(0);
    const [redactedIds, setRedactedIds] = useState<Set<string>>(new Set()); // Composite key: "levelId-segmentId"
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<'lenient' | 'strict' | 'perfect' | null>(null);
    const [gameComplete, setGameComplete] = useState(false);

    const level = LEVEL_CONFIG[currentLevel];

    const toggleRedaction = (segId: number) => {
        if (submitted) return;
        const key = `${currentLevel}-${segId}`;
        const newRedacted = new Set(redactedIds);
        if (newRedacted.has(key)) {
            newRedacted.delete(key);
        } else {
            newRedacted.add(key);
        }
        setRedactedIds(newRedacted);
    };

    const isRedacted = (segId: number) => redactedIds.has(`${currentLevel}-${segId}`);

    const checkResult = () => {
        const dangerousVisible = level.segments.filter(s => (s.type === 'danger' || s.type === 'suspicious') && !isRedacted(s.id));
        const safeRedacted = level.segments.filter(s => s.type === 'safe' && isRedacted(s.id));

        if (dangerousVisible.length > 0) {
            setResult('lenient');
        } else if (safeRedacted.length > 2) {
            setResult('strict');
        } else {
            setResult('perfect');
        }
        setSubmitted(true);
    };

    const handleNext = () => {
        if (currentLevel < LEVEL_CONFIG.length - 1) {
            setCurrentLevel(prev => prev + 1);
            setSubmitted(false);
            setResult(null);
        } else {
            setGameComplete(true);
        }
    };

    const handleRetry = () => {
        setSubmitted(false);
        setResult(null);
    };

    if (gameComplete) {
        return (
            <div className="my-16 font-sans relative max-w-2xl mx-auto text-center">
                <div className="bg-stone-800 text-stone-100 p-12 rounded shadow-2xl border-4 border-yellow-600/50">
                    <div className="mb-6 inline-block p-4 rounded-full bg-yellow-600/20 border-2 border-yellow-500 text-yellow-500">
                        <ShieldCheck className="w-9 h-9" />
                    </div>
                    <h2 className="text-3xl font-bold font-serif mb-4 text-yellow-500 tracking-widest uppercase">
                        Klarert for Tjeneste
                    </h2>
                    <p className="text-stone-300 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
                        Du har utvist eksepsjonell dømmekraft i tjeneste for nasjonen.
                        Sensurkontoret takker for din innsats.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-stone-500 hover:text-white underline uppercase tracking-widest"
                    >
                        Start på nytt
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="my-16 font-sans relative max-w-4xl mx-auto">

            {/* Level Tab */}
            <div className="absolute -top-10 left-0 bg-stone-800 text-white px-4 py-2 rounded-t-lg font-bold text-xs uppercase tracking-widest border-t border-x border-stone-600 shadow-sm flex items-center gap-2">
                <span>Sak {currentLevel + 1} / {LEVEL_CONFIG.length}</span>
                <span className="text-stone-500">|</span>
                <span className="text-yellow-500">{level.difficulty}</span>
            </div>

            {/* Instruction Sticky Note */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentLevel}
                    initial={{ opacity: 0, rotate: 10, x: 20 }}
                    animate={{ opacity: 1, rotate: 2, x: 0 }}
                    exit={{ opacity: 0, rotate: -5, x: 10 }}
                    className="absolute -top-6 -right-2 md:-right-8 z-30 transform w-48 md:w-56 filter drop-shadow-xl"
                >
                    <div className="bg-yellow-100 p-4 rounded-sm border md:border-l-4 border-yellow-300/50 shadow-sm text-sm font-handwriting leading-snug text-yellow-900/80">
                        <div className="w-8 h-8 rounded-full bg-red-800/10 absolute -top-3 left-1/2 -translate-x-1/2 blur-sm"></div>
                        <h4 className="font-bold border-b border-yellow-900/20 pb-1 mb-2 uppercase tracking-wider text-xs">
                            Instruks: {level.difficulty}
                        </h4>
                        <ul className="space-y-1.5 list-none">
                            {level.instructions.map((inst, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <X size={14} className="mt-0.5 text-red-700 shrink-0" />
                                    <span>{inst}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="bg-stone-100 p-1 rounded-sm shadow-2xl border border-stone-300 min-h-[500px]">
                <div className={`p-8 md:p-12 shadow-inner relative overflow-hidden transition-colors duration-700 min-h-[500px] flex flex-col ${level.vibe}`}>
                    {/* Papirtekstur lå her, men aged-paper.png på
                        transparenttextures.com svarer 404. Laget var tomt. */}

                    {/* Header */}
                    <div className="mb-8 border-b-2 border-stone-800/10 pb-4 flex justify-between items-end relative z-10">
                        <div className="font-serif text-stone-800/60 text-sm">
                            Avsender: {level.sender}<br />
                            Dato: 12. Okt 1916
                        </div>
                        <div className="uppercase tracking-[0.2em] font-bold text-stone-800/40 text-xs">
                            Sensurgrad: {level.difficulty}
                        </div>
                    </div>

                    {/* The Letter Content - Animated Transition */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentLevel}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className={`font-mono text-stone-900 text-lg md:text-xl leading-loose relative z-10 cursor-text flex-grow
                                ${!submitted ? 'selection:bg-yellow-200 selection:text-stone-900' : ''}
                            `}
                            style={{ fontFamily: '"Courier Prime", Courier, monospace' }}
                        >
                            <div className="border-l-2 border-red-900/0 pl-0 transition-colors duration-300">
                                {level.segments.map((segment) => (
                                    <span
                                        key={segment.id}
                                        onClick={() => toggleRedaction(segment.id)}
                                        className={`
                                            relative box-decoration-clone px-1 py-0.5 rounded mx-0.5 transition-all duration-200 select-none
                                            ${!submitted ? 'cursor-[url(https://cdn.custom-cursor.com/db/9869/32/arrow2774.png),_text] hover:bg-stone-800/10 active:scale-[0.98]' : 'cursor-default'}
                                            ${isRedacted(segment.id) ? 'bg-stone-900 text-transparent shadow-sm' : ''}
                                        `}
                                    >
                                        {segment.text}
                                        {/* Scribble Effect */}
                                        {isRedacted(segment.id) && (
                                            <span className="absolute inset-0 bg-stone-900 skew-x-[-1deg] scale-[1.02] -z-10 rounded-sm pointer-events-none"></span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Stamp Feedback */}
                    <AnimatePresence>
                        {submitted && (
                            <motion.div
                                key="stamp"
                                initial={{ opacity: 0, scale: 3, rotate: -30 }}
                                animate={{ opacity: 1, scale: 1, rotate: -15 }}
                                exit={{ opacity: 0 }}
                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                    border-4 md:border-8 font-black p-4 md:p-8 uppercase tracking-widest z-50 pointer-events-none mix-blend-multiply text-center backdrop-blur-sm shadow-xl
                                    ${result === 'perfect' ? 'border-green-800 text-green-800 bg-green-100/80 rotate-[-15deg]' : 'border-red-800 text-red-800 bg-red-100/80 rotate-[15deg]'}
                                `}
                            >
                                <div className="text-4xl md:text-6xl">{result === 'perfect' ? 'GODKJENT' : 'AVVIST'}</div>
                                <div className="text-sm md:text-lg font-bold mt-2">Sensurkontoret</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Controls Area */}
                <div className="bg-stone-200 p-4 border-t border-stone-300 flex justify-center items-center gap-4 relative z-20">
                    {!submitted ? (
                        <button
                            onClick={checkResult}
                            className="bg-stone-800 hover:bg-stone-900 text-[#f4e4bc] font-bold py-3 px-8 md:px-12 rounded-sm shadow-lg transform transition-all active:translate-y-0.5 uppercase tracking-wider flex items-center gap-3 active:scale-95"
                        >
                            <Stamp className="w-5 h-5" />
                            POSTLEGG BREV
                        </button>
                    ) : (
                        <div className="flex flex-col items-center animate-fade-in w-full">
                            <div className={`text-center mb-4 font-medium px-4 py-2 rounded ${FEEDBACK[result!].bg} ${FEEDBACK[result!].color} border ${FEEDBACK[result!].border} shadow-sm w-full max-w-lg`}>
                                {FEEDBACK[result!].message}
                            </div>

                            {result === 'perfect' ? (
                                <button
                                    onClick={handleNext}
                                    className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-8 rounded shadow-md uppercase tracking-widest flex items-center gap-2 animate-bounce-subtle"
                                >
                                    Neste Brev <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleRetry}
                                    className="text-stone-600 underline font-bold hover:text-stone-900 text-sm uppercase tracking-wide"
                                >
                                    Prøv på nytt
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
