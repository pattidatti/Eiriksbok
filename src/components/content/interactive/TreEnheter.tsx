import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react';

type UnityId = 'gud' | 'religion' | 'menneskehet';

interface Sporsmal {
    unity: UnityId;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface TreEnheterProps {
    title?: string;
}

const NODES: {
    id: UnityId;
    label: string;
    cx: number;
    cy: number;
    labelX: number;
    labelY: number;
    ring: string;
    fill: string;
    text: string;
}[] = [
    {
        id: 'gud',
        label: 'Én Gud',
        cx: 120,
        cy: 46,
        labelX: 120,
        labelY: 14,
        ring: '#c7d2fe',
        fill: '#6366f1',
        text: 'text-indigo-700',
    },
    {
        id: 'religion',
        label: 'Én religion',
        cx: 48,
        cy: 154,
        labelX: 48,
        labelY: 199,
        ring: '#ddd6fe',
        fill: '#8b5cf6',
        text: 'text-violet-700',
    },
    {
        id: 'menneskehet',
        label: 'Én menneskehet',
        cx: 192,
        cy: 154,
        labelX: 188,
        labelY: 199,
        ring: '#a7f3d0',
        fill: '#10b981',
        text: 'text-emerald-700',
    },
];

const UNITY_NAME: Record<UnityId, string> = {
    gud: 'Guds enhet',
    religion: 'religionenes enhet',
    menneskehet: 'menneskehetens enhet',
};

const SPORSMAL: Sporsmal[] = [
    {
        unity: 'gud',
        prompt: 'En bahá’í ber til Gud. En muslim ber til Gud. Er det den samme Guden?',
        options: [
            'Ja. Det finnes bare én Gud, og alle religionene retter seg mot den samme.',
            'Nei. Hver religion har sin egen gud.',
            'Bare hvis begge bruker det samme navnet på Gud.',
        ],
        correctIndex: 0,
        explanation:
            'Guds enhet er det første leddet i kjeden. Bahá’íer tror det bare finnes én Gud, som har skapt alt. Fordi Gud er én, kan religionene komme fra den samme kilden.',
    },
    {
        unity: 'religion',
        prompt: 'Var Buddha en ekte budbringer fra Gud, slik bahá’íer ser det?',
        options: [
            'Nei. Bare Bahá’u’lláh regnes som ekte budbringer.',
            'Ja. Krishna, Buddha, Moses, Jesus og Muhammed regnes alle som budbringere fra Gud.',
            'Bare for buddhister. Hver religion har sin egen sannhet.',
        ],
        correctIndex: 1,
        explanation:
            'Dette følger av religionenes enhet. Bahá’íer mener at alle de store religionene kommer fra den samme Gud, og at budbringerne hører til den samme rekka.',
    },
    {
        unity: 'menneskehet',
        prompt: 'Er likestilling mellom kvinner og menn en politisk mening i bahá’í, eller en del av læren?',
        options: [
            'En politisk mening som hver enkelt kan velge selv.',
            'En regel som bare gjelder i vestlige land.',
            'En del av læren. Den følger av at alle mennesker er likeverdige.',
        ],
        correctIndex: 2,
        explanation:
            'Bahá’í-samfunnet framhever likestilling mellom kjønnene og enhet på tvers av folkegrupper og nasjoner. Det henger direkte sammen med menneskehetens enhet.',
    },
    {
        unity: 'gud',
        prompt: 'Kan et menneske forstå Gud fullt ut, slik bahá’íer ser det?',
        options: [
            'Nei. Bahá’íer understreker at menneskers forståelse av det guddommelige er begrenset.',
            'Ja. Gud er beskrevet ferdig i de hellige tekstene.',
            'Bare prestene i bahá’í-samfunnet kan det.',
        ],
        correctIndex: 0,
        explanation:
            'I bahá’í omtales Gud som allvitende, kjærlig og nåderik, altså god mot menneskene. Men bahá’íer understreker at vår forståelse av det guddommelige er begrenset. Og bahá’í har ikke noe presteskap i det hele tatt.',
    },
    {
        unity: 'religion',
        prompt: 'Hvorfor sier religionene så ulike ting hvis de kommer fra den samme kilden?',
        options: [
            'Fordi menneskene har funnet på religionene helt selv.',
            'Fordi bare den nyeste av dem har fått budskapet riktig.',
            'Fordi det samme budskapet blir gitt til ulike tider og kulturer.',
        ],
        correctIndex: 2,
        explanation:
            'Bahá’íer kaller dette progressiv åpenbaring. Budskapet er det samme hver gang, men formen passer til tiden og kulturen det blir gitt i.',
    },
    {
        unity: 'menneskehet',
        prompt: 'Hvorfor arbeider bahá’í-samfunnet sammen med FN for et verdensparlament?',
        options: [
            'Fordi menneskeheten er én, og da bør verden også styres i fellesskap.',
            'Fordi de vil at alle mennesker skal bli bahá’íer.',
            'Fordi FN krever det av alle trossamfunn.',
        ],
        correctIndex: 0,
        explanation:
            'Bahá’í-samfunnet arbeider for et verdensparlament, en øverste domstol, et felles økonomisk system og et felles verdensspråk. Enhet er ikke bare en trossetning, men en oppgave.',
    },
];

const TOTAL_PER_UNITY = 2;

export function TreEnheter({ title = 'Tre enheter, én tanke' }: TreEnheterProps) {
    const [index, setIndex] = useState(0);
    const [solvedCount, setSolvedCount] = useState<Record<UnityId, number>>({
        gud: 0,
        religion: 0,
        menneskehet: 0,
    });
    const [wrongPicks, setWrongPicks] = useState<number[]>([]);
    const [answered, setAnswered] = useState(false);

    const complete = index >= SPORSMAL.length;
    const current = complete ? SPORSMAL[SPORSMAL.length - 1] : SPORSMAL[index];

    const edges = useMemo(
        () => [
            [NODES[0], NODES[1]],
            [NODES[1], NODES[2]],
            [NODES[2], NODES[0]],
        ],
        []
    );

    const handlePick = (i: number) => {
        if (answered || complete) return;
        if (i === current.correctIndex) {
            setAnswered(true);
            setSolvedCount((prev) => ({ ...prev, [current.unity]: prev[current.unity] + 1 }));
        } else if (!wrongPicks.includes(i)) {
            setWrongPicks((prev) => [...prev, i]);
        }
    };

    const handleNext = () => {
        setIndex((prev) => prev + 1);
        setWrongPicks([]);
        setAnswered(false);
    };

    const handleReset = () => {
        setIndex(0);
        setSolvedCount({ gud: 0, religion: 0, menneskehet: 0 });
        setWrongPicks([]);
        setAnswered(false);
    };

    const fillRadius = (count: number) => (count === 0 ? 0 : count === 1 ? 15 : 25);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Svar slik en bahá&rsquo;í ville svart. Hvert riktig svar fyller én av de tre
                        enhetene.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_250px] md:items-start">
                <div>
                    <div className="text-xs font-medium text-slate-400 mb-2">
                        {complete
                            ? 'Alle seks spørsmål er løst'
                            : `Spørsmål ${Math.min(index + 1, SPORSMAL.length)} av ${SPORSMAL.length}`}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={complete ? 'ferdig' : index}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.22 }}
                        >
                            {complete ? (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="font-semibold text-emerald-800 mb-1">
                                        Der er kjeden.
                                    </p>
                                    <p className="text-sm text-emerald-800/90">
                                        Slik bahá&rsquo;íer tenker: fordi Gud er én, kan religionene
                                        være én. Og fordi religionene er én, hører alle mennesker
                                        sammen. Tar du bort ett ledd, faller de to andre. Det er
                                        derfor enhet blir kalt kjernen i bahá&rsquo;í.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-slate-800 font-medium mb-3 leading-snug">
                                        {current.prompt}
                                    </p>
                                    <div className="space-y-2">
                                        {current.options.map((opt, i) => {
                                            const isCorrect =
                                                answered && i === current.correctIndex;
                                            const isWrong = wrongPicks.includes(i);
                                            return (
                                                <motion.button
                                                    key={opt}
                                                    onClick={() => handlePick(i)}
                                                    disabled={answered || isWrong}
                                                    whileTap={
                                                        answered || isWrong
                                                            ? undefined
                                                            : { scale: 0.98 }
                                                    }
                                                    animate={
                                                        isWrong
                                                            ? { x: [0, -6, 6, -3, 0] }
                                                            : { x: 0 }
                                                    }
                                                    transition={{ duration: 0.3 }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                                                        isCorrect
                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                            : isWrong
                                                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md'
                                                    }`}
                                                >
                                                    <span className="flex items-start gap-2">
                                                        {isCorrect && (
                                                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                                        )}
                                                        {isWrong && (
                                                            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                        )}
                                                        <span>{opt}</span>
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="justify-self-center">
                    <svg viewBox="0 0 240 210" className="w-[230px] h-[200px]" role="img">
                        <title>Tre enheter som henger sammen</title>
                        {edges.map(([a, b]) => (
                            <motion.line
                                key={`${a.id}-${b.id}`}
                                x1={a.cx}
                                y1={a.cy}
                                x2={b.cx}
                                y2={b.cy}
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeLinecap="round"
                                pathLength={1}
                                opacity={0}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: complete ? 1 : 0,
                                    opacity: complete ? 1 : 0,
                                }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                        ))}

                        {NODES.map((node) => {
                            const count = solvedCount[node.id];
                            const r = fillRadius(count);
                            return (
                                <g key={node.id}>
                                    <circle
                                        cx={node.cx}
                                        cy={node.cy}
                                        r={30}
                                        fill="#f8fafc"
                                        stroke={node.ring}
                                        strokeWidth={3}
                                    />
                                    <motion.circle
                                        cx={node.cx}
                                        cy={node.cy}
                                        r={r}
                                        fill={node.fill}
                                        initial={false}
                                        animate={{ r }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                                    />
                                    <text
                                        x={node.cx}
                                        y={node.cy + 4}
                                        textAnchor="middle"
                                        fontSize={12}
                                        fontWeight={700}
                                        fill={count === TOTAL_PER_UNITY ? '#ffffff' : '#475569'}
                                    >
                                        {count}/{TOTAL_PER_UNITY}
                                    </text>
                                    <text
                                        x={node.labelX}
                                        y={node.labelY}
                                        textAnchor="middle"
                                        fontSize={11}
                                        fontWeight={600}
                                        fill="#334155"
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            );
                        })}

                        <AnimatePresence>
                            {complete && (
                                <motion.g
                                    initial={{ opacity: 0, scale: 0.4 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.4 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                    style={{ transformOrigin: '120px 118px' }}
                                >
                                    <circle
                                        cx={120}
                                        cy={118}
                                        r={26}
                                        fill="#ffffff"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                    />
                                    <text
                                        x={120}
                                        y={122}
                                        textAnchor="middle"
                                        fontSize={12}
                                        fontWeight={700}
                                        fill="#047857"
                                    >
                                        Enhet
                                    </text>
                                </motion.g>
                            )}
                        </AnimatePresence>
                    </svg>
                </div>
            </div>

            <div className="mx-5 mb-4 min-h-[64px] px-4 py-3 rounded-lg border text-sm bg-slate-50 border-slate-200 text-slate-600">
                <AnimatePresence mode="wait">
                    {complete ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="font-semibold text-emerald-700"
                        >
                            Ferdig. De tre enhetene henger sammen som ledd i en kjede.
                        </motion.div>
                    ) : answered ? (
                        <motion.div
                            key={`ok-${index}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <span className="font-semibold text-emerald-700">
                                Riktig. Dette hører til {UNITY_NAME[current.unity]}.
                            </span>{' '}
                            <span className="text-slate-600">{current.explanation}</span>
                        </motion.div>
                    ) : wrongPicks.length > 0 ? (
                        <motion.div
                            key={`feil-${index}-${wrongPicks.length}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-rose-700"
                        >
                            Ikke helt. Tenk på hva som følger av at Gud, religionene og menneskene
                            henger sammen. Prøv et annet svar.
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`nøytral-${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            Velg det svaret du tror en bahá&rsquo;í ville gitt.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={handleNext}
                    disabled={!answered || complete}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {index >= SPORSMAL.length - 1 ? 'Se sammenhengen' : 'Neste spørsmål'}
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
