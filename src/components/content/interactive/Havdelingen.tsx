import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Anchor, Fish, RotateCcw, Shield, Ship, Sparkles, Waves } from 'lucide-react';

// Havdelingen: eleven deler Lofothavet mellom tre slags redskaper, sender ut
// oppsynet når noen bryter reglene, og møter til slutt dampskipet som stenger
// Trollfjorden i 1890.
//
// Lyspære-øyeblikket: et hav som er felles for alle, trenger felles regler.
// Fritt fiske fungerte fordi redskapene fikk hvert sitt felt og noen passet på.
// Da nye redskaper kom, måtte reglene endres igjen.
//
// Bygger på SNL (Bjørge mfl.: Lofotfisket, Dørum og Mardal: Trollfjordslaget,
// Wasberg og Mardal: Ketil Motzfeldt) og SSB (2000): Lofotfisket 1856-2000.

interface HavdelingenProps {
    title?: string;
}

type Phase = 'kaos' | 'deling' | 'oppsyn' | 'not' | 'ferdig';
type Redskap = 'garn' | 'line' | 'juksa';
type Felt = 0 | 1 | 2;

interface Brikke {
    id: number;
    type: Redskap;
    slot: number;
    kaosX: number;
    kaosY: number;
}

const REDSKAP: Record<Redskap, { navn: string; farge: string; chip: string; forklaring: string }> = {
    garn: {
        navn: 'Garn',
        farge: '#f97316',
        chip: 'bg-orange-50 border-orange-200 text-orange-700',
        forklaring: 'Et nett som står i sjøen, og fisken setter seg fast i maskene.',
    },
    line: {
        navn: 'Line',
        farge: '#2563eb',
        chip: 'bg-blue-50 border-blue-200 text-blue-700',
        forklaring: 'Et langt tau med mange kroker og agn.',
    },
    juksa: {
        navn: 'Juksa',
        farge: '#059669',
        chip: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        forklaring: 'Et håndsnøre som fiskeren holder i fra båten.',
    },
};

const FELTNAVN = ['Indre felt', 'Midtre felt', 'Ytre felt'];
const FELT_Y = [72, 132, 192];
const SLOT_X = [70, 175, 280, 385, 490];

// Startplassering: alle setter redskapene der de vil, og mye havner oppå hverandre.
const KAOS: [Redskap, number, number][] = [
    ['garn', 80, 80],
    ['line', 100, 95],
    ['juksa', 210, 130],
    ['garn', 230, 120],
    ['line', 360, 70],
    ['garn', 380, 80],
    ['juksa', 470, 180],
    ['line', 490, 195],
    ['garn', 160, 190],
    ['juksa', 185, 200],
    ['line', 300, 175],
    ['juksa', 520, 90],
    ['garn', 430, 140],
    ['line', 60, 160],
    ['juksa', 300, 120],
];

const BRIKKER: Brikke[] = (() => {
    const teller: Record<Redskap, number> = { garn: 0, line: 0, juksa: 0 };
    return KAOS.map(([type, x, y], id) => ({
        id,
        type,
        slot: teller[type]++,
        kaosX: x,
        kaosY: y,
    }));
})();

const VILLFARER = BRIKKER.find((b) => b.type === 'line' && b.slot === 2)!.id;
const TYPE_FORSKYVNING: Record<Redskap, number> = { garn: 0, line: 22, juksa: 44 };

function finnFloker(pos: { type: Redskap; x: number; y: number }[]) {
    const floker: { x: number; y: number }[] = [];
    for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
            const a = pos[i];
            const b = pos[j];
            if (a.type === b.type) continue;
            if (Math.abs(a.x - b.x) < 48 && Math.abs(a.y - b.y) < 22) {
                floker.push({ x: (a.x + b.x) / 2 + 20, y: (a.y + b.y) / 2 });
            }
        }
    }
    return floker;
}

function RedskapTegning({ type }: { type: Redskap }) {
    const f = REDSKAP[type].farge;
    if (type === 'garn') {
        return (
            <g>
                <line x1={0} y1={0} x2={44} y2={0} stroke={f} strokeWidth={3} />
                {[0, 11, 22, 33, 44].map((x) => (
                    <circle key={x} cx={x} cy={0} r={3.5} fill="white" stroke={f} strokeWidth={2} />
                ))}
            </g>
        );
    }
    if (type === 'line') {
        return (
            <g>
                <line x1={0} y1={0} x2={44} y2={0} stroke={f} strokeWidth={2.5} strokeDasharray="5 3" />
                {[6, 18, 30, 42].map((x) => (
                    <path key={x} d={`M${x} 0 v5 a2.5 2.5 0 0 1 -5 0`} fill="none" stroke={f} strokeWidth={1.5} />
                ))}
            </g>
        );
    }
    return (
        <g>
            <path d="M6 -6 h28 l-5 7 h-18 z" fill={f} />
            <line x1={30} y1={-2} x2={30} y2={10} stroke={f} strokeWidth={1.5} />
        </g>
    );
}

export function Havdelingen({ title = 'Del Lofothavet' }: HavdelingenProps) {
    const [phase, setPhase] = useState<Phase>('kaos');
    const [tildeling, setTildeling] = useState<Record<Redskap, Felt | null>>({
        garn: null,
        line: null,
        juksa: null,
    });
    const [oppsynSendt, setOppsynSendt] = useState(false);
    const [sperringBrutt, setSperringBrutt] = useState(false);

    const posisjoner = useMemo(
        () =>
            BRIKKER.map((b) => {
                const felt = phase === 'kaos' ? null : tildeling[b.type];
                if (felt === null) return { type: b.type, x: b.kaosX, y: b.kaosY };
                let x = SLOT_X[b.slot] + TYPE_FORSKYVNING[b.type];
                let y = FELT_Y[felt];
                if (phase === 'oppsyn' && !oppsynSendt && b.id === VILLFARER && tildeling.garn !== null) {
                    // En linebåt som har drevet inn på garnfeltet
                    x = SLOT_X[2] + 10;
                    y = FELT_Y[tildeling.garn];
                }
                return { type: b.type, x, y };
            }),
        [phase, tildeling, oppsynSendt]
    );

    const floker = finnFloker(posisjoner);
    const alleTildelt = Object.values(tildeling).every((v) => v !== null);
    const deltRiktig = alleTildelt && new Set(Object.values(tildeling)).size === 3;

    const velgFelt = (type: Redskap, felt: Felt) => {
        if (phase !== 'deling') return;
        setTildeling((t) => ({ ...t, [type]: felt }));
    };

    const reset = () => {
        setPhase('kaos');
        setTildeling({ garn: null, line: null, juksa: null });
        setOppsynSendt(false);
        setSperringBrutt(false);
    };

    const feedback = (() => {
        if (phase === 'kaos')
            return {
                stil: 'bg-rose-50 border-rose-200 text-rose-700',
                tekst: `Alle setter redskapene der de vil. Det blir ${floker.length} floker der garn, line og juksa havner oppå hverandre. Hvem sitt redskap er det som blir ødelagt?`,
            };
        if (phase === 'deling') {
            if (!alleTildelt)
                return {
                    stil: 'bg-slate-50 border-slate-200 text-slate-600',
                    tekst: 'Velg et felt for hvert redskap. Se hva som skjer med flokene.',
                };
            if (!deltRiktig)
                return {
                    stil: 'bg-blue-50 border-blue-200 text-blue-700',
                    tekst: `To redskaper deler fortsatt samme felt, og det blir ${floker.length} floker. Gi hvert redskap sitt eget felt.`,
                };
            return {
                stil: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                tekst: 'Null floker! Dette er havdelingen fra Lofotloven i 1857: Havet er fritt for alle, men redskaper som ikke kan brukes på samme sted, får hvert sitt felt.',
            };
        }
        if (phase === 'oppsyn')
            return oppsynSendt
                ? {
                      stil: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                      tekst: 'Oppsynet fikk linebåten tilbake til sitt felt. Regler virker bare når noen passer på dem. Oppsynet hadde egne politifolk og dommere i fiskesesongen.',
                  }
                : {
                      stil: 'bg-rose-50 border-rose-200 text-rose-700',
                      tekst: 'En linebåt har satt linene sine på garnfeltet. Nå er det floke og krangel. Hvem skal løse det?',
                  };
        if (phase === 'not')
            return sperringBrutt
                ? {
                      stil: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                      tekst: '6. mars 1890 brøt flere tusen fiskere seg gjennom sperringen. Etterpå kom en ny lofotlov som passet på fiskerne i åpne båter.',
                  }
                : {
                      stil: 'bg-amber-50 border-amber-200 text-amber-800',
                      tekst: '1890: Fjorden er full av skrei. Dampskip setter en stor not over munningen av Trollfjorden. De små båtene blir stengt ute, og rederen vil ha betalt.',
                  };
        return {
            stil: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            tekst: 'Et felles hav trenger felles regler. Og når nye redskaper kommer, må reglene endres.',
        };
    })();

    const stegNr = { kaos: 1, deling: 2, oppsyn: 3, not: 4, ferdig: 4 }[phase];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Waves className="w-5 h-5 text-indigo-500" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Tusenvis av båter, ett hav. Hvordan unngår du at redskapene ødelegger hverandre?
                    </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">Steg {stegNr} av 4</span>
            </div>

            <div className="p-4 md:p-5">
                <div className="rounded-xl border border-sky-100 overflow-hidden bg-sky-50">
                    <svg viewBox="0 0 600 220" className="w-full h-auto block">
                        <rect x={0} y={0} width={600} height={36} fill="#e2e8f0" />
                        <text x={12} y={23} fontSize={13} fill="#475569" fontWeight={600}>
                            Land: fiskeværet med rorbuene
                        </text>
                        {[0, 1, 2].map((f) => (
                            <g key={f}>
                                <rect
                                    x={0}
                                    y={42 + f * 60}
                                    width={600}
                                    height={58}
                                    fill={phase === 'kaos' ? '#e0f2fe' : f % 2 ? '#dbeafe' : '#e0f2fe'}
                                />
                                {phase !== 'kaos' && (
                                    <text x={8} y={56 + f * 60} fontSize={10} fill="#64748b">
                                        {FELTNAVN[f]}
                                    </text>
                                )}
                            </g>
                        ))}

                        {/* Trollfjorden med sperringen */}
                        <AnimatePresence>
                            {phase === 'not' && (
                                <motion.g
                                    key="fjord"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <rect x={540} y={42} width={60} height={178} fill="#bae6fd" />
                                    <text x={545} y={58} fontSize={10} fill="#0369a1" fontWeight={600}>
                                        Trollfjorden
                                    </text>
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <Fish key={i} x={552 + (i % 2) * 18} y={75 + i * 22} width={14} height={14} color="#0369a1" />
                                    ))}
                                    <motion.rect
                                        x={532}
                                        y={42}
                                        width={8}
                                        height={178}
                                        fill="#334155"
                                        animate={
                                            sperringBrutt
                                                ? { opacity: 0, scaleY: 0.2 }
                                                : { opacity: 1, scaleY: 1 }
                                        }
                                        style={{ originY: '50%' }}
                                        transition={{ duration: 0.6 }}
                                    />
                                    {!sperringBrutt && (
                                        <g>
                                            <Ship x={500} y={20} width={26} height={26} color="#334155" />
                                        </g>
                                    )}
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* Redskapene */}
                        {BRIKKER.map((b, i) => {
                            const p = posisjoner[i];
                            const iNot = phase === 'not';
                            const x = iNot ? (sperringBrutt ? 548 + (b.id % 3) * 14 : 470 + (b.id % 3) * 18) : p.x;
                            const y = iNot ? 60 + (b.id % 8) * 20 : p.y;
                            return (
                                <motion.g
                                    key={b.id}
                                    initial={false}
                                    animate={{ x, y, opacity: iNot && !sperringBrutt ? 0.6 : 1 }}
                                    transition={{ type: 'spring', stiffness: 120, damping: 16, delay: b.slot * 0.03 }}
                                >
                                    <g transform={iNot ? 'scale(0.6)' : undefined}>
                                        <RedskapTegning type={b.type} />
                                    </g>
                                </motion.g>
                            );
                        })}

                        {/* Floker */}
                        <AnimatePresence>
                            {phase !== 'not' &&
                                floker.map((f, i) => (
                                    <motion.g
                                        key={`floke-${phase}-${i}-${f.x}-${f.y}`}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: [1.4, 1], opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        style={{ originX: `${f.x}px`, originY: `${f.y}px` }}
                                    >
                                        <circle cx={f.x} cy={f.y} r={10} fill="#fecdd3" stroke="#e11d48" strokeWidth={2} />
                                        <text x={f.x} y={f.y + 4} fontSize={12} fill="#e11d48" textAnchor="middle" fontWeight={700}>
                                            !
                                        </text>
                                    </motion.g>
                                ))}
                        </AnimatePresence>

                        {/* Oppsynsbåten */}
                        <AnimatePresence>
                            {phase === 'oppsyn' && (
                                <motion.g
                                    key="oppsyn"
                                    initial={{ x: 20, y: 0 }}
                                    animate={oppsynSendt ? { x: SLOT_X[2] - 30, y: FELT_Y[tildeling.garn ?? 0] - 34 } : { x: 20, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                                >
                                    <Shield x={0} y={6} width={22} height={22} color="#4f46e5" />
                                </motion.g>
                            )}
                        </AnimatePresence>
                    </svg>
                </div>

                {phase === 'deling' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {(Object.keys(REDSKAP) as Redskap[]).map((type) => (
                            <div key={type} className={`rounded-xl border p-2.5 ${REDSKAP[type].chip}`}>
                                <p className="text-sm font-semibold">{REDSKAP[type].navn}</p>
                                <p className="text-xs opacity-80 mb-2">{REDSKAP[type].forklaring}</p>
                                <div className="flex gap-1">
                                    {([0, 1, 2] as Felt[]).map((f) => (
                                        <motion.button
                                            key={f}
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => velgFelt(type, f)}
                                            className={`flex-1 rounded-full px-2 py-1 text-[11px] font-medium border ${
                                                tildeling[type] === f
                                                    ? 'bg-white border-current shadow-sm'
                                                    : 'bg-white/50 border-transparent hover:bg-white'
                                            }`}
                                        >
                                            {['Indre', 'Midtre', 'Ytre'][f]}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {phase === 'ferdig' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800"
                    >
                        <div className="flex items-center gap-2 font-semibold mb-1">
                            <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.8, repeat: 2 }}>
                                <Sparkles className="w-5 h-5" />
                            </motion.span>
                            Du har delt Lofothavet
                        </div>
                        <p className="text-sm">
                            Fritt hav og fritt fiske betydde ikke at alt var lov. Det fungerte fordi
                            garn, line og juksa fikk hvert sitt felt, og fordi oppsynet passet på. Da
                            dampskipene kom med store nøter, holdt ikke de gamle reglene lenger, og
                            Stortinget måtte lage en ny lov.
                        </p>
                    </motion.div>
                )}
            </div>

            <div className="mx-6 mb-4 min-h-[64px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback.tekst}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${feedback.stil}`}
                    >
                        {feedback.tekst}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {phase === 'kaos' && (
                    <button
                        onClick={() => setPhase('deling')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium flex items-center gap-1.5"
                    >
                        <Anchor className="w-4 h-4" /> Del havet
                    </button>
                )}
                {phase === 'deling' && (
                    <button
                        onClick={() => setPhase('oppsyn')}
                        disabled={!deltRiktig}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Start fisket
                    </button>
                )}
                {phase === 'oppsyn' &&
                    (oppsynSendt ? (
                        <button
                            onClick={() => setPhase('not')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                        >
                            Spol fram til 1890
                        </button>
                    ) : (
                        <button
                            onClick={() => setOppsynSendt(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium flex items-center gap-1.5"
                        >
                            <Shield className="w-4 h-4" /> Send oppsynet
                        </button>
                    ))}
                {phase === 'not' &&
                    (sperringBrutt ? (
                        <button
                            onClick={() => setPhase('ferdig')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                        >
                            Se hva du lærte
                        </button>
                    ) : (
                        <button
                            onClick={() => setSperringBrutt(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                        >
                            Bryt sperringen
                        </button>
                    ))}
                {phase === 'ferdig' && <span className="text-sm text-slate-500">Ferdig!</span>}
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
