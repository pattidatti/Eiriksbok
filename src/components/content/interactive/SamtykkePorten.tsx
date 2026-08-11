import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, HeartHandshake, RotateCcw, Users, X } from 'lucide-react';

interface SamtykkePortenProps {
    title?: string;
}

interface Person {
    id: string;
    name: string;
    relation: string;
    required: boolean;
    note: string;
}

interface Scenario {
    id: string;
    couple: string;
    detail: string;
    people: Person[];
}

const SCENARIOS: Scenario[] = [
    {
        id: 'amina-daniel',
        couple: 'Amina (26) og Daniel (31)',
        detail: 'De har bestemt seg for å gifte seg. Hvem må si ja?',
        people: [
            {
                id: 'a-mor',
                name: 'Rana',
                relation: 'mor til Amina, i live',
                required: true,
                note: 'Mor til bruden lever. Hun må si ja.',
            },
            {
                id: 'a-far',
                name: 'Kamal',
                relation: 'far til Amina, døde i 2021',
                required: false,
                note: 'Bare foreldre som er i live, kan gi samtykke.',
            },
            {
                id: 'a-bestemor',
                name: 'Firouzeh',
                relation: 'bestemor til Amina, 88 år',
                required: false,
                note: 'Regelen gjelder foreldre, ikke besteforeldre.',
            },
            {
                id: 'd-mor',
                name: 'Grete',
                relation: 'mor til Daniel, i live',
                required: true,
                note: 'Mor til brudgommen lever. Hun må si ja.',
            },
            {
                id: 'd-far',
                name: 'Terje',
                relation: 'far til Daniel, bor i Canada',
                required: true,
                note: 'Avstand endrer ingenting. Han lever, altså må han si ja.',
            },
            {
                id: 'd-stemor',
                name: 'Vibeke',
                relation: 'stemor til Daniel',
                required: false,
                note: 'Regelen gjelder de biologiske foreldrene.',
            },
        ],
    },
    {
        id: 'sara-behrouz',
        couple: 'Sara (58) og Behrouz (61)',
        detail: 'Begge har vært gift før. Betyr alderen noe?',
        people: [
            {
                id: 's-mor',
                name: 'Ingrid',
                relation: 'mor til Sara, 84 år',
                required: true,
                note: 'Alderen på paret betyr ingenting. Hun lever, altså må hun si ja.',
            },
            {
                id: 's-far',
                name: 'Olav',
                relation: 'far til Sara, 87 år',
                required: true,
                note: 'Sara er 58 år, men må likevel spørre faren sin.',
            },
            {
                id: 'b-mor',
                name: 'Parvin',
                relation: 'mor til Behrouz, døde i 2009',
                required: false,
                note: 'Hun er død og kan ikke gi samtykke.',
            },
            {
                id: 'b-far',
                name: 'Hushang',
                relation: 'far til Behrouz, døde i 2014',
                required: false,
                note: 'Han er død og kan ikke gi samtykke.',
            },
            {
                id: 's-datter',
                name: 'Mina',
                relation: 'voksen datter til Sara',
                required: false,
                note: 'Barn har ingen plass i denne regelen.',
            },
            {
                id: 'b-bror',
                name: 'Farid',
                relation: 'storebror til Behrouz',
                required: false,
                note: 'Søsken har ingen plass i denne regelen.',
            },
        ],
    },
    {
        id: 'leila-jonas',
        couple: 'Leila (24) og Jonas (25)',
        detail: "Leila er bahá'í. Jonas er ikke. Alle fire foreldre lever.",
        people: [
            {
                id: 'l-mor',
                name: 'Shirin',
                relation: 'mor til Leila',
                required: true,
                note: 'Hun lever. Hun må si ja.',
            },
            {
                id: 'l-far',
                name: 'Nader',
                relation: 'far til Leila',
                required: true,
                note: 'Han lever. Han må si ja.',
            },
            {
                id: 'j-mor',
                name: 'Anne',
                relation: "mor til Jonas, ikke bahá'í",
                required: true,
                note: 'Troen til foreldrene spiller ingen rolle. Hun må si ja.',
            },
            {
                id: 'j-far',
                name: 'Stig',
                relation: "far til Jonas, ikke bahá'í",
                required: true,
                note: 'Også han må si ja, selv om han ikke deler troen.',
            },
            {
                id: 'j-venn',
                name: 'Marius',
                relation: 'bestevenn til Jonas',
                required: false,
                note: 'Venner er ikke foreldre.',
            },
            {
                id: 'l-onkel',
                name: 'Bijan',
                relation: 'onkel til Leila',
                required: false,
                note: 'Onkler og tanter er ikke foreldre.',
            },
        ],
    },
];

const VOW = 'Sannelig, vi vil alle holde fast ved Guds vilje.';

type Phase = 'velger' | 'feil' | 'riktig' | 'ferdig';

export function SamtykkePorten({ title = 'Samtykkeporten' }: SamtykkePortenProps) {
    const [round, setRound] = useState(0);
    const [picked, setPicked] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>('velger');

    const scenario = SCENARIOS[round];
    const locked = phase === 'riktig' || phase === 'ferdig';

    const togglePerson = (id: string) => {
        if (locked) return;
        setPhase('velger');
        setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const check = () => {
        const needed = scenario.people.filter((p) => p.required).map((p) => p.id);
        const allPicked = needed.every((id) => picked.includes(id));
        const noExtras = picked.every((id) => needed.includes(id));
        setPhase(allPicked && noExtras ? 'riktig' : 'feil');
    };

    const next = () => {
        if (round === SCENARIOS.length - 1) {
            setPhase('ferdig');
            return;
        }
        setRound((r) => r + 1);
        setPicked([]);
        setPhase('velger');
    };

    const reset = () => {
        setRound(0);
        setPicked([]);
        setPhase('velger');
    };

    const chipClasses = (person: Person) => {
        const isPicked = picked.includes(person.id);
        if (phase === 'feil') {
            if (isPicked && !person.required) return 'bg-rose-50 border-rose-300 text-rose-800';
            if (!isPicked && person.required) return 'bg-amber-50 border-amber-300 text-amber-800';
            if (isPicked && person.required)
                return 'bg-emerald-50 border-emerald-300 text-emerald-800';
        }
        if (isPicked) return 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-md';
        return 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md';
    };

    const noteFor = (person: Person) => {
        if (phase !== 'feil') return null;
        const isPicked = picked.includes(person.id);
        if (isPicked !== person.required) return person.note;
        return null;
    };

    const feedback = () => {
        if (phase === 'riktig') {
            return 'Alle som lever, har sagt ja. Da kan setningen sies, og da er de gift.';
        }
        if (phase === 'feil') {
            return 'Ikke helt. Rødt er valgt uten grunn. Gult er glemt. Prøv igjen.';
        }
        if (phase === 'ferdig') {
            return 'Regelen er den samme hver gang: alle foreldre som lever, må si ja. Alder, avstand og tro endrer ingenting.';
        }
        return `Trykk på dem som må si ja. Du har valgt ${picked.length} av ${scenario.people.length}.`;
    };

    const feedbackTone =
        phase === 'riktig' || phase === 'ferdig'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : phase === 'feil'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <HeartHandshake className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg alle som må si ja før paret kan gifte seg.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-800">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold">{scenario.couple}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {SCENARIOS.map((s, i) => (
                        <motion.span
                            key={s.id}
                            animate={{
                                backgroundColor:
                                    i < round || phase === 'ferdig'
                                        ? '#10b981'
                                        : i === round
                                          ? '#6366f1'
                                          : '#e2e8f0',
                            }}
                            className="block w-6 h-1.5 rounded-full bg-slate-200"
                        />
                    ))}
                </div>
            </div>
            <p className="px-6 pt-1 text-sm text-slate-500">{scenario.detail}</p>

            <div className="p-6 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'ferdig' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500"
                            >
                                <Check className="h-7 w-7 text-white" />
                            </motion.div>
                            <p className="font-semibold text-emerald-900">
                                Tre par, tre ganger den samme regelen.
                            </p>
                            <p className="mt-2 text-sm text-emerald-800">
                                Ingen prest gjorde bryllupene gyldige. Det gjorde foreldrene som
                                lever, og én setning begge sa høyt.
                            </p>
                        </motion.div>
                    ) : phase === 'riktig' ? (
                        <motion.div
                            key={`vow-${scenario.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6"
                        >
                            <p className="mb-4 text-center text-sm font-medium text-emerald-800">
                                Porten er åpen. Nå sier begge den samme setningen.
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <motion.div
                                    initial={{ opacity: 0, x: -32 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    className="rounded-xl border border-emerald-300 bg-white px-4 py-3"
                                >
                                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                                        Bruden
                                    </p>
                                    <p className="mt-1 text-slate-800">{VOW}</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 32 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: 0.12,
                                        type: 'spring',
                                        stiffness: 200,
                                        damping: 20,
                                    }}
                                    className="rounded-xl border border-emerald-300 bg-white px-4 py-3"
                                >
                                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                                        Brudgommen
                                    </p>
                                    <p className="mt-1 text-slate-800">{VOW}</p>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`grid-${scenario.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                        >
                            {scenario.people.map((person) => {
                                const note = noteFor(person);
                                const isPicked = picked.includes(person.id);
                                return (
                                    <motion.button
                                        key={person.id}
                                        type="button"
                                        onClick={() => togglePerson(person.id)}
                                        whileTap={{ scale: 0.96 }}
                                        animate={
                                            phase === 'feil' && isPicked && !person.required
                                                ? { x: [0, -5, 5, -3, 0] }
                                                : { x: 0 }
                                        }
                                        className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${chipClasses(person)}`}
                                    >
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold">
                                                {person.name}
                                            </span>
                                            {isPicked && phase !== 'feil' && (
                                                <Check className="h-4 w-4 shrink-0" />
                                            )}
                                            {phase === 'feil' && isPicked && !person.required && (
                                                <X className="h-4 w-4 shrink-0" />
                                            )}
                                        </span>
                                        <span className="mt-0.5 block text-xs opacity-80">
                                            {person.relation}
                                        </span>
                                        {note && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="mt-1.5 block text-xs font-medium"
                                            >
                                                {note}
                                            </motion.span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mx-6 mb-4">
                <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg border px-4 py-3 text-sm ${feedbackTone}`}
                >
                    {feedback()}
                </motion.div>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 pb-5">
                {phase === 'riktig' ? (
                    <button
                        onClick={next}
                        className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        {round === SCENARIOS.length - 1 ? 'Se mønsteret' : 'Neste par'}
                    </button>
                ) : phase === 'ferdig' ? (
                    <span className="text-sm text-slate-500">Du er ferdig.</span>
                ) : (
                    <button
                        onClick={check}
                        disabled={picked.length === 0}
                        className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
                    >
                        Be om samtykke
                    </button>
                )}
                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
