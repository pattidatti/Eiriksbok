import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Home, Sparkles, RotateCcw } from 'lucide-react';

interface Round {
    year: string;
    situation: string;
    keepLabel: string;
    letgoLabel: string;
    keepOutcome: string;
    letgoOutcome: string;
    washingtonDid: 'keep' | 'letgo';
}

interface MaktensFristelseProps {
    title?: string;
    rounds?: Round[];
    finale?: string;
}

const DEFAULT_ROUNDS: Round[] = [
    {
        year: '1783',
        situation:
            'Krigen er vunnet. Hæren elsker deg, og flere offiserer vil gjøre deg til konge over det nye landet. Kongressen er svak og har nesten ingen makt til å stoppe deg. Hva gjør du?',
        keepLabel: 'Ta makten',
        letgoLabel: 'Gi fra deg kommandoen',
        keepOutcome:
            'Da hadde USA fått en ny konge, akkurat det landet nettopp hadde kjempet mot. Revolusjonen ville endt som så mange andre: med en ny enehersker på toppen.',
        letgoOutcome:
            'Washington la sverdet foran Kongressen og red hjem til gården sin. Kong George III skal ha sagt: «Gjør han det, blir han den største mannen i verden.»',
        washingtonDid: 'letgo',
    },
    {
        year: '1797',
        situation:
            'Du har vært president i åtte år. Folk elsker deg og vil velge deg på nytt så mange ganger du vil, kanskje på livstid. Ingen lov stopper deg. Hva gjør du?',
        keepLabel: 'Bli sittende',
        letgoLabel: 'Gå av',
        keepOutcome:
            'Da ville presidenten lignet mer og mer på en konge. Ingen kunne vite om makten noen gang ville skifte hender uten vold.',
        letgoOutcome:
            'Washington gikk hjem etter to perioder. Dermed ble det en uskreven regel: makt i USA skal skifte hender fredelig, uten en hersker på livstid.',
        washingtonDid: 'letgo',
    },
];

type Phase = 'choosing' | 'revealed' | 'complete';

export function MaktensFristelse({
    title = 'Maktens fristelse',
    rounds = DEFAULT_ROUNDS,
    finale = 'Washington ble stor ikke ved å gripe makt, men ved å gi slipp på den. Et demokrati overlever bare når de mektige velger å gå av.',
}: MaktensFristelseProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('choosing');
    const [chosen, setChosen] = useState<'keep' | 'letgo' | null>(null);

    const round = rounds[index];
    const matched = chosen === round?.washingtonDid;

    const handleChoice = (choice: 'keep' | 'letgo') => {
        setChosen(choice);
        setPhase('revealed');
    };

    const handleNext = () => {
        if (index + 1 < rounds.length) {
            setIndex(index + 1);
            setChosen(null);
            setPhase('choosing');
        } else {
            setPhase('complete');
        }
    };

    const handleReset = () => {
        setIndex(0);
        setChosen(null);
        setPhase('choosing');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Crown className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Sett deg i Washingtons sko. Velg, og se hva valget betyr.
                    </p>
                </div>
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {phase !== 'complete' && round && (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1">
                                    Valg {index + 1} av {rounds.length}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1">
                                    {round.year}
                                </span>
                            </div>

                            <p className="text-slate-700 leading-relaxed mb-5">{round.situation}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={phase === 'revealed'}
                                    onClick={() => handleChoice('keep')}
                                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                                        chosen === 'keep'
                                            ? 'bg-amber-50 border-amber-300'
                                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                    } ${phase === 'revealed' ? 'cursor-default' : ''}`}
                                >
                                    <Crown className="w-6 h-6 text-amber-500 shrink-0" />
                                    <span className="font-medium text-slate-800">
                                        {round.keepLabel}
                                    </span>
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={phase === 'revealed'}
                                    onClick={() => handleChoice('letgo')}
                                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                                        chosen === 'letgo'
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                    } ${phase === 'revealed' ? 'cursor-default' : ''}`}
                                >
                                    <Home className="w-6 h-6 text-emerald-500 shrink-0" />
                                    <span className="font-medium text-slate-800">
                                        {round.letgoLabel}
                                    </span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {phase === 'complete' && (
                        <motion.div
                            key="finale"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                            className="rounded-xl bg-indigo-50 border border-indigo-200 p-6 text-center"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-3"
                            >
                                <Sparkles className="w-7 h-7 text-indigo-600" />
                            </motion.div>
                            <p className="text-indigo-800 font-medium leading-relaxed">{finale}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'revealed' && round && chosen && (
                        <motion.div
                            key={`fb-${index}-${chosen}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                                matched
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                        >
                            <p className="font-semibold mb-1">
                                {matched
                                    ? 'Samme valg som Washington tok.'
                                    : 'Washington valgte det motsatte.'}
                            </p>
                            <p>{chosen === 'keep' ? round.keepOutcome : round.letgoOutcome}</p>
                            {!matched && (
                                <p className="mt-2 text-slate-600">
                                    {round.washingtonDid === 'letgo'
                                        ? round.letgoOutcome
                                        : round.keepOutcome}
                                </p>
                            )}
                        </motion.div>
                    )}
                    {phase === 'choosing' && (
                        <motion.p
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-400 px-1 py-3"
                        >
                            Trykk på et valg for å se hva som skjer.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'revealed' ? (
                    <button
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {index + 1 < rounds.length ? 'Neste valg' : 'Se innsikten'}
                    </button>
                ) : (
                    <span className="text-sm text-slate-400">
                        {phase === 'complete' ? 'Du er ferdig.' : ''}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
