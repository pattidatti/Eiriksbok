import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, RotateCcw, Sparkles, Check, X } from 'lucide-react';

interface VektskaalenPaaDommensDagProps {
    title?: string;
}

type Fase = 'veier' | 'valg' | 'ferdig';

interface Gjerning {
    id: string;
    tekst: string;
    side: 'godt' | 'vondt';
    vekt: number;
}

const GJERNINGER: Gjerning[] = [
    { id: 'mat', tekst: 'Ga bort mat til en som ikke hadde noe', side: 'godt', vekt: 4 },
    {
        id: 'stein',
        tekst: 'Flyttet en stein ut av veien så ingen skulle snuble',
        side: 'godt',
        vekt: 1,
    },
    { id: 'lofte', tekst: 'Holdt et løfte selv om det kostet noe', side: 'godt', vekt: 2 },
    { id: 'logn', tekst: 'Løy for å slippe unna en oppgave', side: 'vondt', vekt: 2 },
    { id: 'rykte', tekst: 'Spredte et rykte om noen du kjenner', side: 'vondt', vekt: 3 },
    {
        id: 'hjelp',
        tekst: 'Lot være å hjelpe da du så at noen trengte det',
        side: 'vondt',
        vekt: 2,
    },
];

const PIVOT_X = 210;
const PIVOT_Y = 52;
const ARM = 108;
const HENG = 46;
const MAKS_VINKEL = 16;

interface Paastand {
    id: number;
    tekst: string;
    riktig: boolean;
    svar: string;
}

const PAASTANDER: Paastand[] = [
    {
        id: 0,
        tekst: 'Vekten avgjør helt alene. Gud er bundet av regnskapet.',
        riktig: false,
        svar: 'Ikke helt. Vekten står for rettferdighet, men islamsk lære sier at Gud ikke er en maskin som bare leser av et tall. Gud kalles Den barmhjertige og Den tilgivende.',
    },
    {
        id: 1,
        tekst: 'Gjerningene veies, men Gud kan tilgi. Alt unntatt shirk.',
        riktig: true,
        svar: 'Riktig. Koranen sier at Gud ikke tilgir at noen setter noe ved hans side (shirk), men at han tilgir det som er mindre enn dette, overfor den han vil (sure 4:48).',
    },
];

export function VektskaalenPaaDommensDag({
    title = 'Vektskålen på dommens dag',
}: VektskaalenPaaDommensDagProps) {
    const [fase, setFase] = useState<Fase>('veier');
    const [plassert, setPlassert] = useState<string[]>([]);
    const [valgt, setValgt] = useState<number | null>(null);

    const lagt = GJERNINGER.filter((g) => plassert.includes(g.id));
    const godt = lagt.filter((g) => g.side === 'godt').reduce((s, g) => s + g.vekt, 0);
    const vondt = lagt.filter((g) => g.side === 'vondt').reduce((s, g) => s + g.vekt, 0);
    const igjen = GJERNINGER.filter((g) => !plassert.includes(g.id));

    const raaVinkel = (vondt - godt) * 3;
    const vinkel =
        fase === 'ferdig' ? -MAKS_VINKEL : Math.max(-MAKS_VINKEL, Math.min(MAKS_VINKEL, raaVinkel));
    const rad = (vinkel * Math.PI) / 180;
    const forskyvX = ARM * (1 - Math.cos(rad));
    const forskyvY = ARM * Math.sin(rad);

    const leggPaa = (g: Gjerning) => {
        const nye = [...plassert, g.id];
        setPlassert(nye);
        if (nye.length === GJERNINGER.length) setFase('valg');
    };

    const velg = (p: Paastand) => {
        setValgt(p.id);
        if (p.riktig) setFase('ferdig');
    };

    const nullstill = () => {
        setFase('veier');
        setPlassert([]);
        setValgt(null);
    };

    const valgtPaastand = valgt === null ? null : PAASTANDER[valgt];

    const skaal = (side: 'godt' | 'vondt') => {
        const erGodt = side === 'godt';
        const antall = lagt.filter((g) => g.side === side).length;
        const farge = erGodt ? '#059669' : '#e11d48';
        const flate = erGodt ? '#d1fae5' : '#ffe4e6';
        return (
            <motion.g
                animate={{
                    x: erGodt ? forskyvX : -forskyvX,
                    y: erGodt ? -forskyvY : forskyvY,
                }}
                transition={{ type: 'spring', stiffness: 90, damping: 12 }}
            >
                <line
                    x1={erGodt ? PIVOT_X - ARM : PIVOT_X + ARM}
                    y1={PIVOT_Y}
                    x2={erGodt ? PIVOT_X - ARM : PIVOT_X + ARM}
                    y2={PIVOT_Y + HENG}
                    stroke="#94a3b8"
                    strokeWidth={2}
                />
                <g
                    transform={`translate(${erGodt ? PIVOT_X - ARM : PIVOT_X + ARM}, ${
                        PIVOT_Y + HENG
                    })`}
                >
                    {Array.from({ length: antall }).map((_, i) => (
                        <motion.rect
                            key={i}
                            x={-20}
                            y={-9 - i * 9}
                            width={40}
                            height={7}
                            rx={3}
                            fill={farge}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        />
                    ))}
                    <path
                        d="M -34 0 L 34 0 L 24 17 L -24 17 Z"
                        fill={flate}
                        stroke={farge}
                        strokeWidth={2}
                        strokeLinejoin="round"
                    />
                </g>
            </motion.g>
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på en handling for å legge den i skålen, og se hva armen gjør.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-5">
                <svg
                    viewBox="0 0 420 212"
                    className="w-full max-w-[520px] mx-auto"
                    role="img"
                    aria-label="En skålvekt med en skål for gode handlinger og en for vonde"
                >
                    <AnimatePresence>
                        {fase === 'ferdig' && (
                            <motion.circle
                                cx={PIVOT_X}
                                cy={PIVOT_Y}
                                r={30}
                                fill="#fbbf24"
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 0.35, scale: 2.6 }}
                                exit={{ opacity: 0, scale: 0.4 }}
                                transition={{ type: 'spring', stiffness: 70, damping: 14 }}
                            />
                        )}
                    </AnimatePresence>

                    <path
                        d={`M ${PIVOT_X - 34} 180 L ${PIVOT_X + 34} 180 L ${PIVOT_X + 20} 166 L ${
                            PIVOT_X - 20
                        } 166 Z`}
                        fill="#e2e8f0"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeLinejoin="round"
                    />
                    <line
                        x1={PIVOT_X}
                        y1={PIVOT_Y}
                        x2={PIVOT_X}
                        y2={168}
                        stroke="#94a3b8"
                        strokeWidth={4}
                        strokeLinecap="round"
                    />

                    <motion.g
                        animate={{ rotate: vinkel }}
                        transition={{ type: 'spring', stiffness: 90, damping: 12 }}
                        style={{ transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px` }}
                    >
                        <line
                            x1={PIVOT_X - ARM}
                            y1={PIVOT_Y}
                            x2={PIVOT_X + ARM}
                            y2={PIVOT_Y}
                            stroke="#475569"
                            strokeWidth={5}
                            strokeLinecap="round"
                        />
                    </motion.g>
                    <circle cx={PIVOT_X} cy={PIVOT_Y} r={7} fill="#475569" />

                    {skaal('godt')}
                    {skaal('vondt')}

                    <text
                        x={PIVOT_X - ARM}
                        y={200}
                        textAnchor="middle"
                        className="fill-emerald-700"
                        style={{ fontSize: 13, fontWeight: 600 }}
                    >
                        Godt: {godt}
                    </text>
                    <text
                        x={PIVOT_X + ARM}
                        y={200}
                        textAnchor="middle"
                        className="fill-rose-700"
                        style={{ fontSize: 13, fontWeight: 600 }}
                    >
                        Vondt: {vondt}
                    </text>
                </svg>
            </div>

            <div className="px-6 pt-4">
                <div className="flex flex-wrap gap-2">
                    {igjen.map((g) => (
                        <motion.button
                            key={g.id}
                            layout
                            onClick={() => leggPaa(g)}
                            whileTap={{ scale: 0.94 }}
                            className="text-left text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md text-slate-700 max-w-[220px]"
                        >
                            {g.tekst}
                            <span className="block text-[11px] text-slate-400">vekt {g.vekt}</span>
                        </motion.button>
                    ))}
                    {igjen.length === 0 && (
                        <p className="text-sm text-slate-400">
                            Alle handlingene er lagt på vekten.
                        </p>
                    )}
                </div>
                <p className="mt-3 text-[11px] leading-snug text-slate-400">
                    Tallene er bare et hjelpemiddel for å vise prinsippet. Islamsk lære har ingen
                    fast poengliste over gjerninger.
                </p>
            </div>

            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {fase === 'veier' && (
                        <motion.div
                            key="veier"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {plassert.length} av {GJERNINGER.length} handlinger er veid. Legg merke
                            til at også den minste handlingen flytter armen.
                        </motion.div>
                    )}

                    {fase === 'valg' && (
                        <motion.div
                            key="valg"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                                {godt === vondt
                                    ? `Vekten står likt: ${godt} mot ${vondt}.`
                                    : `Vekten står ${godt} mot ${vondt}.`}{' '}
                                Hva sier islamsk lære skjer nå?
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
                                {PAASTANDER.map((p) => (
                                    <motion.button
                                        key={p.id}
                                        onClick={() => velg(p)}
                                        whileTap={{ scale: 0.96 }}
                                        className={`text-left text-sm px-4 py-3 rounded-lg border ${
                                            valgt === p.id && !p.riktig
                                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:shadow-md'
                                        }`}
                                    >
                                        {p.tekst}
                                    </motion.button>
                                ))}
                            </div>
                            {valgtPaastand && !valgtPaastand.riktig && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2"
                                >
                                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{valgtPaastand.svar}</span>
                                </motion.p>
                            )}
                        </motion.div>
                    )}

                    {fase === 'ferdig' && (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
                        >
                            <p className="flex gap-2 font-medium">
                                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{PAASTANDER[1].svar}</span>
                            </p>
                            <p className="mt-2 flex gap-2 text-emerald-600">
                                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>
                                    Vekten viser rettferdigheten: ingen skal lide den minste urett.
                                    Barmhjertigheten er det Gud legger til.
                                </span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 py-5 flex items-center justify-end">
                <button
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
