import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Crown, Landmark, RotateCcw, Sparkles, Trophy, Users } from 'lucide-react';

interface MediciValgProps {
    title?: string;
}

type Meter = 'floriner' | 'venner' | 'ry';

interface Option {
    label: string;
    effect: Record<Meter, number>;
    medici: boolean;
    feedback: string;
}

interface Round {
    year: string;
    who: string;
    situation: string;
    options: Option[];
}

const ROUNDS: Round[] = [
    {
        year: '1434',
        who: 'Cosimo',
        situation:
            'Du er tilbake i Firenze etter å ha vært kastet ut av byen. Vennene dine har vunnet valget. Hvordan vil du styre?',
        options: [
            {
                label: 'Gjør meg selv til konge av Firenze',
                effect: { floriner: -1, venner: -3, ry: -2 },
                medici: false,
                feedback:
                    'Firenze var stolt av å være en republikk, en stat uten konge. En kongetittel ville gjort deg til en tyrann i folks øyne, og fiendene dine ville samlet seg mot deg.',
            },
            {
                label: 'La republikken stå, men sørg for at vennene mine får de viktige vervene',
                effect: { floriner: 0, venner: 3, ry: 1 },
                medici: true,
                feedback:
                    'Dette gjorde Cosimo. Byen hadde fortsatt råd og valg, men han passet på at bare navn han kunne stole på, ble trukket ut. Han styrte som en privatperson - uten tittel.',
            },
            {
                label: 'Hold meg unna politikken og pass bare på banken',
                effect: { floriner: 2, venner: -2, ry: 0 },
                medici: false,
                feedback:
                    'Da får rivalene fritt spillerom. Det var de samme rivalene som fikk deg arrestert og kastet ut av byen. De kan gjøre det igjen.',
            },
        ],
    },
    {
        year: '1440-årene',
        who: 'Cosimo',
        situation:
            'Banken tjener enorme summer, blant annet fordi du passer på pavens penger. Hva gjør du med overskuddet?',
        options: [
            {
                label: 'Sparer alt i kisten',
                effect: { floriner: 3, venner: -1, ry: -1 },
                medici: false,
                feedback:
                    'Du blir rikere, men folk ser en gjerrig pengemann. En rik mann som ingen har glede av, får misunnelse, ikke venner.',
            },
            {
                label: 'Betaler kunstnere, bygger kirker og kjøper bøker til et bibliotek',
                effect: { floriner: -2, venner: 2, ry: 3 },
                medici: true,
                feedback:
                    'Dette gjorde Cosimo. Han betalte kunstnere som Donatello og Fra Angelico og samlet håndskrevne bøker. Hele byen kunne se hvem som ga dem skjønnheten. Pengene ble til ære.',
            },
            {
                label: 'Leier inn soldater som kan beskytte meg',
                effect: { floriner: -2, venner: -2, ry: -1 },
                medici: false,
                feedback:
                    'En privat hær i en republikk ser ut som starten på et diktatur. Du blir mer fryktet, men mindre likt.',
            },
        ],
    },
    {
        year: '1478',
        who: 'Lorenzo',
        situation:
            'Pazzi-familien har prøvd å drepe deg under messen i domkirken. Broren din Giuliano er død. Paven støttet planen, og Firenze har fått mektige fiender i Italia. Hva gjør du?',
        options: [
            {
                label: 'Flykter fra byen med familien',
                effect: { floriner: -1, venner: -3, ry: -2 },
                medici: false,
                feedback:
                    'Da vinner Pazzi-familien. En leder som stikker av når det brenner, får sjelden komme tilbake.',
            },
            {
                label: 'Reiser helt alene til kongen av Napoli for å løse krisen med samtaler',
                effect: { floriner: -1, venner: 3, ry: 3 },
                medici: true,
                feedback:
                    'Dette gjorde Lorenzo. Det var et farlig veddemål, men besøket løste krisen. Etterpå var Medici-familien ubestridte herrer i Firenze.',
            },
            {
                label: 'Bruker hele bankens formue på en krig mot paven',
                effect: { floriner: -3, venner: -1, ry: 0 },
                medici: false,
                feedback:
                    'En krig mot paven kunne tømt både banken og byen. Lorenzo valgte samtaler i stedet for våpen.',
            },
        ],
    },
    {
        year: 'Før 1492',
        who: 'Lorenzo',
        situation:
            'Du vil sikre familiens makt også etter at du er død. Hvor vil du plassere sønnen din Giovanni?',
        options: [
            {
                label: 'Setter ham til å drive banken',
                effect: { floriner: 1, venner: 0, ry: 0 },
                medici: false,
                feedback:
                    'Banken gikk allerede dårlig, fordi mye av pengene gikk til fester, gaver og politikk. En ny sjef alene redder ikke familiens makt.',
            },
            {
                label: 'Skaffer ham plass som kardinal i kirken, bare 14 år gammel',
                effect: { floriner: -1, venner: 2, ry: 3 },
                medici: true,
                feedback:
                    'Dette gjorde Lorenzo. Giovanni ble kardinal som 14-åring, og i 1513 ble han pave Leo 10. Nå hadde Medici makt også i kirken, langt utenfor Firenze.',
            },
            {
                label: 'Gifter ham bort til en bondejente fra landsbygda',
                effect: { floriner: 0, venner: -1, ry: -1 },
                medici: false,
                feedback:
                    'Et ekteskap var en måte å skaffe mektige allierte på. Et slikt giftermål ville ikke gitt familien noen ny makt.',
            },
        ],
    },
];

const METERS: { key: Meter; label: string; icon: typeof Coins; bar: string; text: string }[] = [
    {
        key: 'floriner',
        label: 'Floriner',
        icon: Coins,
        bar: 'bg-amber-400',
        text: 'text-amber-600',
    },
    { key: 'venner', label: 'Venner', icon: Users, bar: 'bg-sky-500', text: 'text-sky-600' },
    { key: 'ry', label: 'Ry', icon: Sparkles, bar: 'bg-violet-500', text: 'text-violet-600' },
];

const START: Record<Meter, number> = { floriner: 6, venner: 4, ry: 4 };
const clamp = (n: number) => Math.max(0, Math.min(10, n));

export function MediciValg({ title = 'Styr Firenze uten krone' }: MediciValgProps) {
    const [round, setRound] = useState(0);
    const [meters, setMeters] = useState<Record<Meter, number>>(START);
    const [picked, setPicked] = useState<number | null>(null);
    const [mediciCount, setMediciCount] = useState(0);
    const done = round >= ROUNDS.length;
    const current = ROUNDS[Math.min(round, ROUNDS.length - 1)];

    const choose = (i: number) => {
        if (picked !== null) return;
        const opt = current.options[i];
        setPicked(i);
        setMeters((m) => ({
            floriner: clamp(m.floriner + opt.effect.floriner),
            venner: clamp(m.venner + opt.effect.venner),
            ry: clamp(m.ry + opt.effect.ry),
        }));
        if (opt.medici) setMediciCount((c) => c + 1);
    };

    const next = () => {
        setPicked(null);
        setRound((r) => r + 1);
    };

    const reset = () => {
        setRound(0);
        setMeters(START);
        setPicked(null);
        setMediciCount(0);
    };

    const chosen = picked !== null ? current.options[picked] : null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Landmark className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er sjef i Medici-familien. Velg hva du gjør - og se hva pengene dine
                        kjøper.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4 grid grid-cols-3 gap-3">
                {METERS.map((m) => {
                    const Icon = m.icon;
                    return (
                        <div key={m.key}>
                            <div
                                className={`flex items-center gap-1 text-xs font-semibold ${m.text}`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {m.label}
                                <span className="ml-auto text-slate-400">{meters[m.key]}/10</span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className={`h-full ${m.bar}`}
                                    initial={false}
                                    animate={{ width: `${meters[m.key] * 10}%` }}
                                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-5">
                <AnimatePresence mode="wait">
                    {!done ? (
                        <motion.div
                            key={`round-${round}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100">
                                    {current.year}
                                </span>
                                <span>
                                    Du er {current.who} - valg {round + 1} av {ROUNDS.length}
                                </span>
                            </div>
                            <p className="text-slate-800 font-medium mb-3">{current.situation}</p>
                            <div className="grid gap-2">
                                {current.options.map((opt, i) => {
                                    const isPicked = picked === i;
                                    const reveal = picked !== null;
                                    let cls =
                                        'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md';
                                    if (reveal && opt.medici)
                                        cls = 'bg-emerald-50 border-emerald-300';
                                    else if (isPicked) cls = 'bg-rose-50 border-rose-300';
                                    else if (reveal) cls = 'bg-white border-slate-200 opacity-60';
                                    return (
                                        <motion.button
                                            key={opt.label}
                                            whileTap={picked === null ? { scale: 0.98 } : undefined}
                                            onClick={() => choose(i)}
                                            disabled={picked !== null}
                                            className={`text-left px-4 py-2.5 rounded-xl border text-sm text-slate-700 ${cls}`}
                                        >
                                            {opt.label}
                                            {reveal && opt.medici && (
                                                <span className="ml-2 text-xs font-semibold text-emerald-700">
                                                    Medici-veien
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                            className="text-center py-2"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.15, type: 'spring' }}
                                className="inline-flex w-14 h-14 rounded-full bg-amber-100 items-center justify-center mb-2"
                            >
                                {mediciCount >= 3 ? (
                                    <Trophy className="w-7 h-7 text-amber-600" />
                                ) : (
                                    <Crown className="w-7 h-7 text-amber-600" />
                                )}
                            </motion.div>
                            <p className="font-semibold text-slate-800">
                                Du valgte som Medici {mediciCount} av {ROUNDS.length} ganger.
                            </p>
                            <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                                Se på målerne: Medici-veien kostet ofte floriner, men ga venner og
                                ry. Familien ble aldri konger i Firenze. De brukte pengene på
                                venner, kunst og kirken - og fikk makt uten krone.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mx-5 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {chosen ? (
                        <motion.div
                            key={`fb-${round}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                chosen.medici
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {chosen.feedback}
                        </motion.div>
                    ) : (
                        !done && (
                            <motion.div
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-4 py-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-700 text-sm"
                            >
                                Klikk på det valget du tror gir familien mest makt.
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between">
                {!done && picked !== null ? (
                    <button
                        onClick={next}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {round + 1 < ROUNDS.length ? 'Neste valg' : 'Se resultatet'}
                    </button>
                ) : (
                    <span />
                )}
                <button
                    onClick={reset}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
