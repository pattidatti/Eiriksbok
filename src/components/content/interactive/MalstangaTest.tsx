import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoveHorizontal, Flag, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal kjenne igjen forskjellen på en som endrer
// påstanden sin når beviset kommer, og en som bare bytter ut kravet sitt.
// Eleven legger fram beviset, leser svaret, og avgjør hva som skjedde med
// kravet. Først etterpå får hen vite hvem debattanten var.

interface MalstangaCase {
    id: string;
    tema: string;
    claim: string;
    evidence: string;
    response: string;
    verdict: 'justerer' | 'flytter';
    reveal: string;
    explanation: string;
}

interface MalstangaTestProps {
    title?: string;
    intro?: string;
    cases?: MalstangaCase[];
}

type Phase = 'les' | 'svar' | 'fasit' | 'ferdig';

const DEFAULT_CASES: MalstangaCase[] = [
    {
        id: 'sars',
        tema: 'En strid om norsk historieskriving',
        claim: 'Norsk historie er én lang utvikling fram mot selvstendighet.',
        evidence: 'Nye studier viser at økonomi og klasseskiller forklarer mye av det samme.',
        response: 'Da må jeg justere. Framstillingen min forklarer mindre enn jeg trodde, og de materielle forholdene må inn.',
        verdict: 'justerer',
        reveal: 'Dette var en faghistoriker.',
        explanation:
            'Kravet ble stående der det var. Det var påstanden som flyttet seg. Ernst Sars leste norsk historie som en vei mot selvstendighet, mens senere historikere som Edvard Bull og Halvdan Koht la vekt på materielle forhold.',
    },
    {
        id: 'ordren',
        tema: 'En strid om andre verdenskrig',
        claim: 'Det finnes ingen skriftlig ordre fra Hitler, altså fantes det ingen plan.',
        evidence: 'Hundretusener av dokumenter, ordrer, regnskaper og taler viser at drapene var organisert.',
        response: 'De dokumentene er forfalsket av seierherrene.',
        verdict: 'flytter',
        reveal: 'Dette var en holocaustbenekter.',
        explanation:
            'Først var kravet: vis meg ordren. Da bevisene kom, ble kravet byttet ut med et nytt: alt er forfalsket. Ingen bevis kan noen gang oppfylle et krav som flytter seg hver gang du nærmer deg.',
    },
    {
        id: 'objektivitet',
        tema: 'En strid om hva historikere kan vite',
        claim: 'Historikere kan gjengi fortiden helt objektivt, slik den faktisk var.',
        evidence: 'Studier viser at historikere i hver epoke skriver ut fra sin egen samtid.',
        response: 'Det stemmer. Jeg holder fast på at kildene må etterprøves, men jeg gir opp kravet om full objektivitet.',
        verdict: 'justerer',
        reveal: 'Dette var en faghistoriker.',
        explanation:
            'Hen ga opp en del av påstanden sin, men beholdt kravet om etterprøvbare kilder. Nettopp dette skiftet skjedde i faget på 1900-tallet: historikere ble mer skeptiske til at full objektivitet var mulig.',
    },
    {
        id: 'vitnene',
        tema: 'En strid om andre verdenskrig',
        claim: 'Gasskamrene ble aldri brukt til å drepe mennesker.',
        evidence: 'Leirene står der ennå, og både overlevende og tidligere SS-vakter har forklart hva som skjedde.',
        response: 'Kamrene ble bare brukt til avlusing av klær, og vitnene lyver.',
        verdict: 'flytter',
        reveal: 'Dette var en holocaustbenekter.',
        explanation:
            'Legg merke til hva som skjer med vitnene. Så lenge de kan brukes, teller de. Når de motsier påstanden, blir de kalt løgnere. Det er ikke kildekritikk, det er å velge bevis etter hva de gir deg.',
    },
];

export function MalstangaTest({
    title = 'Målstang-testen',
    intro = 'Legg fram beviset, og se hva som skjer med kravet.',
    cases = DEFAULT_CASES,
}: MalstangaTestProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('les');
    const [guess, setGuess] = useState<'justerer' | 'flytter' | null>(null);
    const [correct, setCorrect] = useState(0);

    const current = cases[index];
    const isRight = guess !== null && current && guess === current.verdict;

    const handleReset = () => {
        setIndex(0);
        setPhase('les');
        setGuess(null);
        setCorrect(0);
    };

    const handleGuess = (value: 'justerer' | 'flytter') => {
        setGuess(value);
        setPhase('fasit');
        if (value === current.verdict) setCorrect((n) => n + 1);
    };

    const handleNext = () => {
        setGuess(null);
        if (index + 1 >= cases.length) {
            setPhase('ferdig');
        } else {
            setIndex((n) => n + 1);
            setPhase('les');
        }
    };

    // Flagget står i ro til fasit. Da flytter det seg bare hvis kravet gjorde det.
    const flagPct = phase === 'fasit' && current.verdict === 'flytter' ? 72 : 26;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <MoveHorizontal className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {phase !== 'ferdig' && (
                <div className="p-5 sm:p-6">
                    {/* Framdrift */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold text-slate-500">
                            Sak {index + 1} av {cases.length}
                        </span>
                        <div className="flex gap-1.5">
                            {cases.map((c, i) => (
                                <span
                                    key={c.id}
                                    className={`h-1.5 w-6 rounded-full ${
                                        i < index
                                            ? 'bg-indigo-400'
                                            : i === index
                                              ? 'bg-indigo-600'
                                              : 'bg-slate-200'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                        {current.tema}
                    </p>

                    {/* Kravet + beviset */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Kravet</p>
                            <p className="text-sm text-slate-800 leading-snug">{current.claim}</p>
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <p className="text-xs font-semibold text-blue-600 mb-1">
                                Beviset du legger fram
                            </p>
                            <p className="text-sm text-blue-900 leading-snug">{current.evidence}</p>
                        </div>
                    </div>

                    {/* Målstang-banen */}
                    <div className="relative h-12 mt-4 rounded-lg bg-slate-100 border border-slate-200">
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 rounded bg-blue-400" />
                        <span className="absolute left-5 top-1 text-[11px] text-slate-500">
                            Beviset
                        </span>
                        <motion.div
                            animate={{ left: `${flagPct}%` }}
                            transition={{ type: 'spring', stiffness: 110, damping: 15 }}
                            className="absolute top-0 bottom-0 flex items-center gap-1"
                        >
                            <Flag
                                className={`w-4 h-4 ${
                                    phase === 'fasit' && current.verdict === 'flytter'
                                        ? 'text-rose-500'
                                        : 'text-emerald-600'
                                }`}
                            />
                            <span className="text-[11px] font-medium text-slate-600">Kravet</span>
                        </motion.div>
                    </div>

                    {/* Svaret */}
                    <AnimatePresence mode="wait">
                        {phase !== 'les' && (
                            <motion.div
                                key="svar"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 rounded-lg border border-slate-200 bg-white p-3"
                            >
                                <p className="text-xs font-semibold text-slate-500 mb-1">Svaret</p>
                                <p className="text-sm text-slate-800 leading-snug">
                                    {current.response}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Fasit */}
                    <AnimatePresence mode="wait">
                        {phase === 'fasit' && (
                            <motion.div
                                key={`fasit-${current.id}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`mt-3 rounded-lg border p-3 ${
                                    isRight
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-rose-50 border-rose-200'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    {isRight ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                        <p
                                            className={`text-sm font-semibold ${
                                                isRight ? 'text-emerald-800' : 'text-rose-800'
                                            }`}
                                        >
                                            {current.verdict === 'flytter'
                                                ? 'Kravet flyttet seg.'
                                                : 'Kravet ble stående.'}{' '}
                                            {current.reveal}
                                        </p>
                                        <p
                                            className={`text-sm mt-1 leading-snug ${
                                                isRight ? 'text-emerald-700' : 'text-rose-700'
                                            }`}
                                        >
                                            {current.explanation}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {phase === 'les' && (
                        <p className="mt-3 text-sm text-slate-500">
                            Trykk på knappen for å se hva debattanten svarer.
                        </p>
                    )}
                    {phase === 'svar' && (
                        <p className="mt-3 text-sm text-slate-500">
                            Hva skjedde med kravet? Velg ett av svarene.
                        </p>
                    )}
                </div>
            )}

            {/* Ferdig */}
            <AnimatePresence>
                {phase === 'ferdig' && (
                    <motion.div
                        key="ferdig"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                        className="m-5 sm:m-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="font-semibold text-emerald-900">
                                    Du traff {correct} av {cases.length}.
                                </p>
                                <p className="text-sm text-emerald-800 mt-1 leading-snug">
                                    Testen er den samme hver gang: legg fram beviset og se hva som
                                    skjer med kravet. En som er faglig uenig, endrer påstanden sin
                                    når beviset peker en annen vei. En som benekter, endrer kravet i
                                    stedet, og flytter det like langt unna som før.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {phase === 'les' && (
                        <button
                            onClick={() => setPhase('svar')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            Legg fram beviset
                        </button>
                    )}
                    {phase === 'svar' && (
                        <>
                            <button
                                onClick={() => handleGuess('justerer')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                            >
                                Justerte påstanden
                            </button>
                            <button
                                onClick={() => handleGuess('flytter')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                            >
                                Flyttet målstanga
                            </button>
                        </>
                    )}
                    {phase === 'fasit' && (
                        <button
                            onClick={handleNext}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            {index + 1 >= cases.length ? 'Se resultatet' : 'Neste sak'}
                        </button>
                    )}
                </div>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
