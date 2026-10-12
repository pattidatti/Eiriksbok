import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowDownToDot,
    ArrowUpFromDot,
    Castle,
    Crown,
    RotateCcw,
    Sparkles,
    Sun,
} from 'lucide-react';

// Hoffbanen: eleven er Ludvig 14. og trekker fire mektige adelsmenn inn i bane rundt
// seg selv - fra godset, via Paris og Versailles, helt inn til kongens soverom.
//
// Lyspære-øyeblikket: jo nærmere kongen adelen kom, desto mindre makt hadde de der
// hjemme. Ludvig gjorde farlige adelsmenn til hoffolk som kjempet om gunsten hans.
//
// Ringtekstene bygger på SNL (Tønnesson om Fronden, Vold om Versailles-slottet) og
// Château de Versailles sin side om Ludvig 14.

interface HoffbanenProps {
    title?: string;
}

type Phase = 'active' | 'complete';

interface Ring {
    navn: string;
    radius: number;
    tekst: string;
}

// Indeks 0 er nærmest kongen, indeks 3 er lengst unna.
const RINGER: Ring[] = [
    {
        navn: 'Soverommet',
        radius: 52,
        tekst: 'er med når kongen står opp om morgenen. Nå kjemper han om å få stå nær kongen - ikke om å ta makt fra ham.',
    },
    {
        navn: 'Versailles',
        radius: 92,
        tekst: 'bor ved hoffet. Dagene går med ball, teater, konserter og kortspill, og han må kle seg og snakke etter strenge regler.',
    },
    {
        navn: 'Paris',
        radius: 132,
        tekst: 'er i Paris. Her møter han andre misfornøyde adelsmenn. Under Fronden bygde folk barrikader i gatene her.',
    },
    {
        navn: 'Godset',
        radius: 172,
        tekst: 'sitter på godset sitt med egne bønder, egne penger og egne væpnede menn. Slike adelsmenn gjorde opprør mot kongen under Fronden.',
    },
];

interface Adel {
    id: string;
    navn: string;
    vinkel: number;
    farge: string;
}

const ADEL: Adel[] = [
    { id: 'prins', navn: 'Prinsen', vinkel: -50, farge: '#e11d48' },
    { id: 'hertug', navn: 'Hertugen', vinkel: 40, farge: '#7c3aed' },
    { id: 'marki', navn: 'Markien', vinkel: 130, farge: '#0891b2' },
    { id: 'greve', navn: 'Greven', vinkel: 220, farge: '#059669' },
];

const START: Record<string, number> = { prins: 3, hertug: 3, marki: 3, greve: 3 };
const MAKS = ADEL.length * (RINGER.length - 1);
const C = 190;

function posisjon(vinkel: number, ring: number) {
    const r = RINGER[ring].radius;
    const rad = (vinkel * Math.PI) / 180;
    return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

export function Hoffbanen({ title = 'Hoffbanen: Trekk adelen inn mot Solkongen' }: HoffbanenProps) {
    const [ringer, setRinger] = useState<Record<string, number>>(START);
    const [sist, setSist] = useState<{ id: string; ring: number } | null>(null);
    const [phase, setPhase] = useState<Phase>('active');

    const sum = Object.values(ringer).reduce((a, b) => a + b, 0);
    const fare = Math.round((sum / MAKS) * 100);

    const flytt = (id: string, retning: -1 | 1) => {
        const ny = Math.min(RINGER.length - 1, Math.max(0, ringer[id] + retning));
        if (ny === ringer[id]) return;
        const neste = { ...ringer, [id]: ny };
        setRinger(neste);
        setSist({ id, ring: ny });
        const nySum = Object.values(neste).reduce((a, b) => a + b, 0);
        setPhase(Object.values(neste).every((r) => r < 3) && nySum <= 4 ? 'complete' : 'active');
    };

    const reset = () => {
        setRinger(START);
        setSist(null);
        setPhase('active');
    };

    const sistAdel = sist ? ADEL.find((a) => a.id === sist.id) : null;
    const fareFarge = fare > 60 ? 'bg-rose-500' : fare > 30 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Det er 1661, og du er Ludvig 14. Klikk på en adelsmann for å trekke ham
                        nærmere deg.
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-5 grid md:grid-cols-[250px_minmax(0,1fr)] gap-5 items-center">
                <svg
                    viewBox="0 0 380 380"
                    className="w-full max-w-[250px] mx-auto"
                    role="img"
                    aria-label="Fire ringer rundt kongen: godset, Paris, Versailles og kongens soverom"
                >
                    {RINGER.map((ring, i) => (
                        <g key={ring.navn}>
                            <circle
                                cx={C}
                                cy={C}
                                r={ring.radius}
                                fill={i === 0 ? '#fef3c7' : 'none'}
                                stroke={i === 0 ? '#fbbf24' : '#cbd5e1'}
                                strokeDasharray={i === 3 ? '4 5' : undefined}
                                strokeWidth={1.5}
                            />
                            <text
                                x={C}
                                y={C - ring.radius + 15}
                                textAnchor="middle"
                                className="fill-slate-500"
                                fontSize={12}
                            >
                                {i === 0 ? '' : ring.navn}
                            </text>
                        </g>
                    ))}
                    <motion.circle
                        cx={C}
                        cy={C}
                        r={24}
                        fill="#f59e0b"
                        animate={{ r: phase === 'complete' ? [24, 30, 24] : 24 }}
                        transition={{ duration: 1.2, repeat: phase === 'complete' ? Infinity : 0 }}
                    />
                    <text
                        x={C}
                        y={C + 4}
                        textAnchor="middle"
                        fontSize={11}
                        fill="white"
                        fontWeight={700}
                    >
                        Kongen
                    </text>
                    {ADEL.map((a) => {
                        const p = posisjon(a.vinkel, ringer[a.id]);
                        return (
                            <motion.g
                                key={a.id}
                                initial={false}
                                animate={{ x: p.x, y: p.y }}
                                transition={{ type: 'spring', stiffness: 140, damping: 16 }}
                                onClick={() => flytt(a.id, -1)}
                                className="cursor-pointer"
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <circle r={15} fill={a.farge} stroke="white" strokeWidth={2.5} />
                                <text
                                    y={4}
                                    textAnchor="middle"
                                    fontSize={11}
                                    fill="white"
                                    fontWeight={700}
                                >
                                    {a.navn[0]}
                                </text>
                            </motion.g>
                        );
                    })}
                </svg>

                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700">
                                Fare for et nytt adelsopprør
                            </span>
                            <span className="text-slate-500 tabular-nums">{fare} %</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                                className={`h-full ${fareFarge}`}
                                animate={{ width: `${fare}%` }}
                                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            />
                        </div>
                    </div>

                    <ul className="space-y-1.5">
                        {ADEL.map((a) => {
                            const r = ringer[a.id];
                            return (
                                <li
                                    key={a.id}
                                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5"
                                >
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ background: a.farge }}
                                    />
                                    <span className="text-sm font-medium text-slate-700 w-[4.5rem] shrink-0">
                                        {a.navn}
                                    </span>
                                    <span
                                        className="flex items-center gap-0.5"
                                        title="Makt der hjemme"
                                    >
                                        {[0, 1, 2].map((k) => (
                                            <Castle
                                                key={k}
                                                className={`w-3.5 h-3.5 ${
                                                    k < r ? 'text-slate-600' : 'text-slate-200'
                                                }`}
                                            />
                                        ))}
                                    </span>
                                    <span className="text-xs text-slate-500 flex-1 truncate">
                                        {RINGER[r].navn}
                                    </span>
                                    <button
                                        onClick={() => flytt(a.id, -1)}
                                        disabled={r === 0}
                                        aria-label={`Trekk ${a.navn} nærmere kongen`}
                                        className="p-1 rounded-full hover:bg-indigo-100 text-indigo-600 disabled:text-slate-300 disabled:hover:bg-transparent"
                                    >
                                        <ArrowDownToDot className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => flytt(a.id, 1)}
                                        disabled={r === RINGER.length - 1}
                                        aria-label={`Send ${a.navn} lenger unna`}
                                        className="p-1 rounded-full hover:bg-slate-200 text-slate-500 disabled:text-slate-300 disabled:hover:bg-transparent"
                                    >
                                        <ArrowUpFromDot className="w-4 h-4" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Castle className="w-3 h-3" /> = makt der hjemme: bønder, penger og væpnede
                        menn. Adelsmennene er tenkte personer.
                    </p>
                </div>
            </div>

            <div className="mx-6 mb-4 min-h-[64px]">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                Adelen er ikke borte. Den er bare opptatt. Den som bruker hele dagen
                                på å stå nær kongen, har verken tid eller folk til å gjøre opprør
                                der hjemme. Jo nærmere solen, desto mindre makt. Det var
                                Versailles-trikset.
                            </span>
                        </motion.div>
                    ) : sist && sistAdel ? (
                        <motion.div
                            key={`${sist.id}-${sist.ring}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex gap-2"
                        >
                            <Crown className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                {sistAdel.navn} {RINGER[sist.ring].tekst}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm"
                        >
                            Alle fire sitter på godsene sine, slik adelen gjorde under Fronden. Få
                            alle bort fra godsene og faren for opprør under 35 prosent.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    {phase === 'complete' ? 'Ferdig!' : 'Tips: Prøv også å sende noen hjem igjen.'}
                </span>
                <button
                    onClick={reset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
