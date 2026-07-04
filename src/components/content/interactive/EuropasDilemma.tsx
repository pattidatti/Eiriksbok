import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    Castle,
    MessageSquare,
    Ban,
    PowerOff,
    RotateCcw,
    Coins,
    HeartHandshake,
    Repeat,
    ShieldAlert,
    Lightbulb,
} from 'lucide-react';

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå hvorfor Vesten
// ikke stoppet Russland tidligere. Hvert milde svar gjorde Kremls neste steg
// billigere - men å kutte gassen gjorde vondt i Europa med en gang, mens faren
// var abstrakt og lå i fremtiden. Eleven skal kjenne det valget på kroppen:
// vinduene slukner i dag, krigen er bare en mulighet i morgen.

interface EuropasDilemmaProps {
    title?: string;
}

type ChoiceId = 'ord' | 'milde' | 'kutt';

interface Choice {
    id: ChoiceId;
    label: string;
    shortLabel: string;
    cost: string;
    icon: typeof MessageSquare;
}

const CHOICES: Choice[] = [
    {
        id: 'ord',
        label: 'Protester med ord',
        shortLabel: 'Ord',
        cost: 'Koster ingenting i dag',
        icon: MessageSquare,
    },
    {
        id: 'milde',
        label: 'Milde sanksjoner',
        shortLabel: 'Milde sanksjoner',
        cost: 'Svir litt for industrien',
        icon: Ban,
    },
    {
        id: 'kutt',
        label: 'Kutt gassen nå',
        shortLabel: 'Kuttet gassen',
        cost: 'Mørke vinduer i kveld',
        icon: PowerOff,
    },
];

const EFFECTS: Record<ChoiceId, { flame: number; kreml: number }> = {
    ord: { flame: 0, kreml: 25 },
    milde: { flame: -10, kreml: 15 },
    kutt: { flame: -45, kreml: -10 },
};

interface Round {
    year: string;
    name: string;
    event: string;
    consequences: Record<ChoiceId, string>;
}

const ROUNDS: Round[] = [
    {
        year: '2008',
        name: 'Georgia',
        event: 'Russland går til krig mot nabolandet Georgia. Krigen varer i fem dager. Nå ser hele Europa mot deg: hva blir svaret?',
        consequences: {
            ord: 'Sterke ord, ingen handling. Gassen strømmet videre. I Kreml noterte de seg svaret: Vesten biter ikke.',
            milde: 'Noen generaler fikk reiseforbud. Gassen strømmet videre, og etter noen måneder var alt som før.',
            kutt: 'Strømprisene eksploderte og fabrikker stanset over hele Europa - for en femdagers krig langt borte. Men i Kreml stoppet regnestykket opp.',
        },
    },
    {
        year: '2014',
        name: 'Krim',
        event: 'Russland annekterer Krim-halvøya fra Ukraina. Det er første gang siden 1945 at et europeisk land tar land fra et annet med makt.',
        consequences: {
            ord: 'FN fordømte anneksjonen, men Krim forble russisk. Gassen strømmet videre. I Kreml ble prisen for neste steg notert: null.',
            milde: 'Noen banker og politikere ble rammet, men Russland beholdt Krim. Gassen strømmet videre, og Kreml tålte stikket.',
            kutt: 'Tysk industri stanset, og folk skrudde ned varmen i egne hjem. Regningen kom med en gang - for en halvøy langt borte.',
        },
    },
    {
        year: '2021',
        name: 'Styrkeoppbygging',
        event: 'Hundretusener av russiske soldater samles ved Ukrainas grense. Kreml kaller det en øvelse. Hva gjør du?',
        consequences: {
            ord: 'Advarsler og bekymrede taler. Soldatene ble stående ved grensen. I Kreml så de det de trengte å se: veien lå åpen.',
            milde: 'Trusler om sanksjoner «hvis noe skjer». Soldatene ble stående, og gassen strømmet videre inn i vinteren.',
            kutt: 'Europa gikk inn i vinteren uten russisk gass. Kaldt, dyrt og upopulært - men i Kreml ble neste steg plutselig mye dyrere.',
        },
    },
];

const HISTORY_PICKS: ChoiceId[] = ['ord', 'milde', 'ord'];

const REASONS = [
    {
        icon: Coins,
        label: 'Pengene',
        text: 'Industrien tjente på billig gass',
    },
    {
        icon: HeartHandshake,
        label: 'Ønsketenkningen',
        text: 'Handel skulle gi fred av seg selv',
    },
    {
        icon: Repeat,
        label: 'Vanen',
        text: 'Etter hver krise ble det hverdag igjen',
    },
    {
        icon: ShieldAlert,
        label: 'Frykten',
        text: 'Ingen ville utfordre et atomvåpenland',
    },
];

const clamp = (v: number) => Math.max(5, Math.min(100, v));

function simulate(picks: ChoiceId[]): { flame: number; kreml: number } {
    let flame = 100;
    let kreml = 20;
    for (const p of picks) {
        flame = clamp(flame + EFFECTS[p].flame);
        kreml = clamp(kreml + EFFECTS[p].kreml);
    }
    return { flame, kreml };
}

const HISTORY_END = simulate(HISTORY_PICKS);

// Liten byhorisont: hvert vindu har en fast "slukkeprioritet" slik at de
// slukner i en naturlig, spredt rekkefølge når flammen synker.
const SKYLINE = [
    { rows: 3, cols: 2 },
    { rows: 4, cols: 2 },
    { rows: 3, cols: 2 },
    { rows: 5, cols: 2 },
];
const WINDOW_PRIORITY = [
    12, 3, 21, 7, 27, 0, 16, 9, 24, 5, 19, 1, 14, 29, 8, 22, 4, 17, 11, 26, 2, 20, 6, 25, 13, 28,
    10, 23, 15, 18,
];
const TOTAL_WINDOWS = WINDOW_PRIORITY.length;

function Skyline({ flame }: { flame: number }) {
    const litCount = Math.round((flame / 100) * TOTAL_WINDOWS);
    let windowIndex = 0;
    return (
        <div className="flex items-end gap-1" aria-hidden="true">
            {SKYLINE.map((b, bi) => (
                <div
                    key={bi}
                    className="rounded-t-sm bg-slate-700 p-1 grid gap-0.5"
                    style={{ gridTemplateColumns: `repeat(${b.cols}, 1fr)` }}
                >
                    {Array.from({ length: b.rows * b.cols }).map((_, wi) => {
                        const lit = WINDOW_PRIORITY[windowIndex++] < litCount;
                        return (
                            <motion.span
                                key={wi}
                                className="block h-1.5 w-1.5 rounded-[1px]"
                                animate={{
                                    backgroundColor: lit ? '#fbbf24' : '#475569',
                                    opacity: lit ? 1 : 0.5,
                                }}
                                transition={{ duration: 0.6 }}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function Meter({
    value,
    color,
    trackColor,
}: {
    value: number;
    color: string;
    trackColor: string;
}) {
    return (
        <div className={`h-2.5 w-full overflow-hidden rounded-full ${trackColor}`}>
            <motion.div
                className={`h-full rounded-full ${color}`}
                animate={{ width: `${value}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
        </div>
    );
}

type Phase = 'playing' | 'complete';

export function EuropasDilemma({ title = 'Du bestemmer Europas svar' }: EuropasDilemmaProps) {
    const [step, setStep] = useState(0);
    const [phase, setPhase] = useState<Phase>('playing');
    const [chosen, setChosen] = useState<ChoiceId | null>(null);
    const [picks, setPicks] = useState<ChoiceId[]>([]);
    const [flame, setFlame] = useState(100);
    const [kreml, setKreml] = useState(20);

    const round = ROUNDS[step];
    const cutEarly = picks.includes('kutt');

    const handleChoice = (id: ChoiceId) => {
        if (chosen) return;
        setChosen(id);
        setPicks((p) => [...p, id]);
        setFlame((f) => clamp(f + EFFECTS[id].flame));
        setKreml((k) => clamp(k + EFFECTS[id].kreml));
    };

    const handleNext = () => {
        if (step + 1 >= ROUNDS.length) {
            setPhase('complete');
            return;
        }
        setStep((s) => s + 1);
        setChosen(null);
    };

    const handleReset = () => {
        setStep(0);
        setPhase('playing');
        setChosen(null);
        setPicks([]);
        setFlame(100);
        setKreml(20);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Flame className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Tre advarsler, tre valg. Du sitter med Europas svar.
                    </p>
                </div>
                <div className="ml-auto flex gap-1.5">
                    {ROUNDS.map((_, i) => (
                        <span
                            key={i}
                            className={`h-2 w-2 rounded-full transition-colors ${
                                i < step || (i === step && chosen) || phase === 'complete'
                                    ? 'bg-blue-500'
                                    : i === step
                                      ? 'bg-amber-400'
                                      : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Målere - alltid synlige mens du spiller */}
            {phase === 'playing' && (
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                                <Flame className="w-3.5 h-3.5 text-blue-500" />
                                Varme og industri i Europa
                            </div>
                            <Meter value={flame} color="bg-blue-500" trackColor="bg-blue-100" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                                <Castle className="w-3.5 h-3.5 text-rose-500" />
                                Kremls selvtillit
                            </div>
                            <Meter value={kreml} color="bg-rose-500" trackColor="bg-rose-100" />
                        </div>
                    </div>
                    <Skyline flame={flame} />
                </div>
            )}

            <AnimatePresence mode="wait">
                {phase === 'playing' ? (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-6"
                    >
                        {/* Hendelseskort */}
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-5 flex gap-3">
                            <span className="mt-0.5 shrink-0 text-amber-500 font-bold">
                                {round.year}:
                            </span>
                            <p className="text-sm text-amber-900 leading-snug">{round.event}</p>
                        </div>

                        {/* Tre valg */}
                        <div className="grid grid-cols-3 gap-3">
                            {CHOICES.map((c) => {
                                const Icon = c.icon;
                                const isPicked = chosen === c.id;
                                const isLocked = chosen !== null && !isPicked;
                                return (
                                    <motion.button
                                        key={c.id}
                                        onClick={() => handleChoice(c.id)}
                                        disabled={chosen !== null}
                                        whileTap={!chosen ? { scale: 0.96 } : undefined}
                                        animate={isPicked ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                                        transition={{ duration: 0.35 }}
                                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-center transition-colors ${
                                            isPicked
                                                ? 'bg-blue-50 border-blue-300'
                                                : isLocked
                                                  ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                                  : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                    >
                                        <Icon
                                            className={`w-6 h-6 ${
                                                isPicked ? 'text-blue-600' : 'text-slate-500'
                                            }`}
                                        />
                                        <span className="text-sm font-semibold text-slate-800">
                                            {c.label}
                                        </span>
                                        <span className="text-[11px] text-slate-500 leading-tight">
                                            {c.cost}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Konsekvens */}
                        <div className="mt-5 min-h-[3.5rem]">
                            <AnimatePresence mode="wait">
                                {chosen ? (
                                    <motion.div
                                        key="konsekvens"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-snug"
                                    >
                                        {round.consequences[chosen]}
                                    </motion.div>
                                ) : (
                                    <p className="px-1 text-sm text-slate-400">
                                        Se på målerne før du velger. Hva koster valget i dag - og
                                        hva koster det senere?
                                    </p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Kontrollrad */}
                        <div className="mt-2 flex items-center justify-between">
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Start på nytt
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!chosen}
                                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                                    chosen
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {step + 1 >= ROUNDS.length ? 'Se fasit' : 'Neste'}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6"
                    >
                        <h4 className="text-lg font-bold text-slate-800 text-center">
                            Din vei og historiens vei
                        </h4>

                        {/* Sammenligning */}
                        <div className="mt-4 space-y-3">
                            {[
                                { label: 'Du valgte', seq: picks, end: simulate(picks) },
                                {
                                    label: 'Historien valgte',
                                    seq: HISTORY_PICKS,
                                    end: HISTORY_END,
                                },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="w-28 shrink-0 text-xs font-semibold text-slate-500">
                                            {row.label}
                                        </span>
                                        {row.seq.map((p, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs text-slate-700"
                                            >
                                                {CHOICES.find((c) => c.id === p)?.shortLabel}
                                            </span>
                                        ))}
                                        {row.label === 'Historien valgte' && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    delay: 0.5,
                                                    type: 'spring',
                                                    stiffness: 260,
                                                    damping: 18,
                                                }}
                                                className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-semibold text-white"
                                            >
                                                24. februar 2022
                                            </motion.span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Flame className="w-3 h-3 text-blue-500" />
                                            Varme igjen: {row.end.flame} %
                                        </span>
                                        <span className="flex flex-1 items-center gap-1">
                                            <Castle className="w-3 h-3 text-rose-500" />
                                            <span className="shrink-0">Kremls selvtillit:</span>
                                            <Meter
                                                value={row.end.kreml}
                                                color="bg-rose-500"
                                                trackColor="bg-rose-100"
                                            />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Resultat */}
                        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                            {cutEarly
                                ? 'Du kuttet gassen tidlig. Kremls selvtillit stanset - men se hva det kostet: fabrikker sto stille og vinduer var mørke lenge før noen kunne vite om det ville virke. Den regningen måtte betales med en gang, mens faren bare var en mulighet i fremtiden. Det er akkurat derfor ingen gjorde det.'
                                : 'Din vei lignet historiens. Hvert milde svar holdt varmen oppe i dag - og gjorde Kremls neste steg litt billigere. Den 24. februar 2022 kom fullskalainvasjonen av Ukraina, og da måtte Europa betale regningen likevel, bare mye større.'}
                        </p>

                        {/* Innsikt */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="mt-4 flex gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 leading-snug"
                        >
                            <Lightbulb className="w-5 h-5 shrink-0 text-emerald-500" />
                            <span>
                                Det harde valget koster med en gang, det milde valget koster
                                senere. Derfor valgte Vesten ord, og derfor sank prisen på Kremls
                                neste steg for hver gang. Fire ting holdt hånden tilbake:
                            </span>
                        </motion.div>

                        {/* De fire grunnene fra artikkelen */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {REASONS.map((r, i) => {
                                const Icon = r.icon;
                                return (
                                    <motion.div
                                        key={r.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 1 + i * 0.12,
                                            type: 'spring',
                                            stiffness: 260,
                                            damping: 20,
                                        }}
                                        className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-3 text-center"
                                    >
                                        <Icon className="w-5 h-5 text-slate-500" />
                                        <span className="text-xs font-semibold text-slate-700">
                                            {r.label}
                                        </span>
                                        <span className="text-[11px] text-slate-500 leading-tight">
                                            {r.text}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-5 text-center">
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm text-slate-700 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Prøv en annen vei
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
