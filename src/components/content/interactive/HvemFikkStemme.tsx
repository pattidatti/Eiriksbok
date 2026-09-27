import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, Check, X, RotateCcw, Users } from 'lucide-react';

// Lyspære-øyeblikket:
// Etter denne interaksjonen skal eleven forstå at nesten alle som slet mest i
// Norge i 1850 - husmenn, arbeidere, tjenestefolk - sto utenfor valget. Derfor
// var det så mektig at Thranebevegelsen fikk omtrent like mange medlemmer som
// det fantes velgere: en hel hær av folk uten stemme.
//
// Eleven gjetter først på hver person. Så kommer fasiten, og til slutt
// sammenligningen mellom medlemmer og velgere.

interface Person {
    /** Kort navn på kortet, f.eks. «Husmann Ola». */
    name: string;
    /** Én linje om hvem personen er. */
    description: string;
    /** Hadde personen stemmerett i 1850? */
    canVote: boolean;
    /** Forklaring som vises etter at eleven har sjekket. */
    why: string;
}

interface HvemFikkStemmeProps {
    title?: string;
    instruction?: string;
    people?: Person[];
    membersLabel?: string;
    votersLabel?: string;
    conclusion?: string;
}

type Guess = 'ja' | 'nei' | null;
type Phase = 'guessing' | 'checked' | 'complete';

const DEFAULT_PEOPLE: Person[] = [
    {
        name: 'Presten',
        description: 'Sogneprest i bygda, 45 år.',
        canVote: true,
        why: 'Prester var embetsmenn, altså statens egne tjenestemenn. De fikk stemme.',
    },
    {
        name: 'Bonden som eier gården',
        description: 'Eier sin egen gård, 50 år.',
        canVote: true,
        why: 'Bønder som eide sin egen gård, fikk stemme.',
    },
    {
        name: 'Husmannen',
        description: 'Leier en liten plass på bondens grunn og jobber for bonden, 40 år.',
        canVote: false,
        why: 'Husmenn eide ikke jord og hadde ikke stemmerett, selv om de var mange.',
    },
    {
        name: 'Kjøpmannen',
        description: 'Driver handel i byen og har borgerbrev, 38 år.',
        canVote: true,
        why: 'Handelsborgere i byene fikk stemme.',
    },
    {
        name: 'Fabrikkarbeideren',
        description: 'Jobber ved en fabrikk langs Akerselva, 30 år.',
        canVote: false,
        why: 'En arbeider uten eiendom hadde ikke stemmerett.',
    },
    {
        name: 'Tjenestejenta',
        description: 'Jobber og bor på en storgård, 28 år.',
        canVote: false,
        why: 'Ingen kvinner fikk stemme. Kvinner fikk full stemmerett først i 1913.',
    },
    {
        name: 'Leilendingen',
        description: 'Leier en hel gård som står i skattelistene, 35 år.',
        canVote: true,
        why: 'Den som leide en hel, registrert gård, fikk stemme. Det gjaldt ikke husmenn.',
    },
    {
        name: 'Bondesønnen',
        description: 'Skal arve gården en dag, men er bare 22 år.',
        canVote: false,
        why: 'Du måtte være minst 25 år for å stemme.',
    },
];

export function HvemFikkStemme({
    title = 'Hvem fikk stemme i 1850?',
    instruction = 'Klikk på hver person: fikk hen stemme ved valget, eller ikke?',
    people = DEFAULT_PEOPLE,
    membersLabel = 'Medlemmer i arbeiderforeningene (ca. 30 000)',
    votersLabel = 'Folk som stemte ved valget i 1850 (litt flere)',
    conclusion = 'Nesten like mange var med i Thranebevegelsen som det var velgere i hele Norge. Og de fleste medlemmene hadde ingen stemme selv.',
}: HvemFikkStemmeProps) {
    const [guesses, setGuesses] = useState<Guess[]>(() => people.map(() => null));
    const [phase, setPhase] = useState<Phase>('guessing');

    const allGuessed = guesses.every((g) => g !== null);
    const answered = guesses.filter((g) => g !== null).length;
    const correct = guesses.filter(
        (g, i) => (g === 'ja') === people[i].canVote && g !== null
    ).length;
    const voters = people.filter((p) => p.canVote).length;

    const toggle = (i: number) => {
        if (phase !== 'guessing') return;
        setGuesses((prev) => {
            const next = [...prev];
            next[i] = prev[i] === 'ja' ? 'nei' : 'ja';
            return next;
        });
    };

    const handleReset = () => {
        setGuesses(people.map(() => null));
        setPhase('guessing');
    };

    let feedback: string;
    if (phase === 'guessing') {
        feedback = allGuessed
            ? 'Alle har fått et svar. Trykk «Sjekk svarene».'
            : `Du har svart på ${answered} av ${people.length}. Klikk igjen for å bytte svar.`;
    } else if (phase === 'checked') {
        feedback = `Du hadde ${correct} av ${people.length} riktig. Bare ${voters} av ${people.length} fikk stemme. Trykk «Se tallene» for å se hvorfor det betydde noe.`;
    } else {
        feedback = conclusion;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Vote className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{instruction}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {people.map((p, i) => {
                        const g = guesses[i];
                        const revealed = phase !== 'guessing';
                        const right = revealed && (g === 'ja') === p.canVote;
                        let tone = 'bg-slate-50 border-slate-200';
                        if (!revealed && g === 'ja') tone = 'bg-indigo-50 border-indigo-300';
                        if (!revealed && g === 'nei') tone = 'bg-slate-100 border-slate-300';
                        if (revealed)
                            tone = right
                                ? 'bg-emerald-50 border-emerald-300'
                                : 'bg-rose-50 border-rose-300';
                        return (
                            <motion.button
                                key={p.name}
                                type="button"
                                onClick={() => toggle(i)}
                                whileTap={phase === 'guessing' ? { scale: 0.95 } : undefined}
                                animate={revealed ? { rotateY: [0, 90, 0] } : { rotateY: 0 }}
                                transition={{ duration: 0.45, delay: revealed ? i * 0.06 : 0 }}
                                className={`text-left rounded-xl border p-3 min-h-[8.5rem] flex flex-col gap-1 ${tone} ${
                                    phase === 'guessing'
                                        ? 'cursor-pointer hover:shadow-md'
                                        : 'cursor-default'
                                }`}
                            >
                                <span
                                    className="font-semibold text-slate-800 text-sm break-words hyphens-auto"
                                    lang="nb"
                                >
                                    {p.name}
                                </span>
                                <span className="text-xs text-slate-500 leading-snug">
                                    {revealed ? p.why : p.description}
                                </span>
                                <span className="mt-auto pt-1 text-xs font-semibold flex items-center gap-1">
                                    {!revealed && g === null && (
                                        <span className="text-slate-400">Klikk for å svare</span>
                                    )}
                                    {!revealed && g === 'ja' && (
                                        <span className="text-indigo-700 flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> Stemmer
                                        </span>
                                    )}
                                    {!revealed && g === 'nei' && (
                                        <span className="text-slate-600 flex items-center gap-1">
                                            <X className="w-3.5 h-3.5" /> Stemmer ikke
                                        </span>
                                    )}
                                    {revealed && (
                                        <span
                                            className={`flex items-center gap-1 ${
                                                p.canVote ? 'text-emerald-700' : 'text-rose-700'
                                            }`}
                                        >
                                            {p.canVote ? (
                                                <Check className="w-3.5 h-3.5" />
                                            ) : (
                                                <X className="w-3.5 h-3.5" />
                                            )}
                                            {p.canVote ? 'Fikk stemme' : 'Ingen stemme'}
                                            {!right && ' (du gjettet feil)'}
                                        </span>
                                    )}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {phase === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Users className="w-4 h-4 text-indigo-500" /> Høsten 1850
                            </div>
                            {[
                                { label: votersLabel, width: 100, color: 'bg-slate-400' },
                                { label: membersLabel, width: 93, color: 'bg-indigo-500' },
                            ].map((bar, i) => (
                                <div key={bar.label}>
                                    <div className="text-xs text-slate-600 mb-1">{bar.label}</div>
                                    <div className="h-4 rounded-full bg-white border border-slate-200 overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${bar.color}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${bar.width}%` }}
                                            transition={{ duration: 1, delay: 0.2 + i * 0.4 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-4 sm:px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${phase}-${answered}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={
                            phase === 'complete'
                                ? { opacity: 1, y: 0, scale: [1, 1.03, 1] }
                                : { opacity: 1, y: 0 }
                        }
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            phase === 'complete'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {feedback}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between gap-3">
                {phase === 'guessing' && (
                    <button
                        type="button"
                        onClick={() => setPhase('checked')}
                        disabled={!allGuessed}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Sjekk svarene
                    </button>
                )}
                {phase === 'checked' && (
                    <button
                        type="button"
                        onClick={() => setPhase('complete')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Se tallene
                    </button>
                )}
                {phase === 'complete' && <span />}
                <button
                    type="button"
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
