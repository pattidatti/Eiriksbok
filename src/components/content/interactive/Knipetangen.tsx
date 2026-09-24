import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Minus, Plus, RotateCcw, Play, CheckCircle2, XCircle } from 'lucide-react';

interface KnipetangenProps {
    title?: string;
    reserves?: number;
}

type Zone = 'nord' | 'byen' | 'sor';
type Phase = 'plan' | 'result';
type Outcome = 'seier' | 'byen-falt' | 'en-arm' | 'ingen-arm';

// Fiendens styrke i hver sone. Tyskerne samlet de beste styrkene sine inne i
// byen. Flankene ble holdt av rumenske armeer med dårligere utstyr.
const ENEMY: Record<Zone, number> = { nord: 3, byen: 9, sor: 3 };
// Så mange avdelinger trengs for at byen ikke skal falle.
const HOLD_CITY = 3;

const ZONE_INFO: Record<Zone, { navn: string; fiende: string }> = {
    nord: { navn: 'Nordflanken', fiende: 'Rumensk 3. armé' },
    byen: { navn: 'Byen', fiende: 'Tysk 6. armé' },
    sor: { navn: 'Sørflanken', fiende: 'Rumensk 4. armé' },
};

function evaluate(a: Record<Zone, number>): Outcome {
    if (a.byen < HOLD_CITY) return 'byen-falt';
    const nordOk = a.nord > ENEMY.nord;
    const sorOk = a.sor > ENEMY.sor;
    if (nordOk && sorOk) return 'seier';
    if (nordOk || sorOk) return 'en-arm';
    return 'ingen-arm';
}

const OUTCOME_TEXT: Record<Outcome, { tittel: string; tekst: string }> = {
    seier: {
        tittel: 'Tangen lukket seg ved Kalatsj!',
        tekst: 'Byen holdt akkurat lenge nok, og begge armene slo gjennom der fienden var svakest. Slik gikk det også i virkeligheten: 19. november 1942 angrep Den røde armé nord for byen, dagen etter sør for byen. Den 23. november møttes de to armene ved Kalatsj. Rundt en kvart million soldater satt fanget.',
    },
    'byen-falt': {
        tittel: 'Byen falt',
        tekst: 'Du sendte for få soldater inn i byen. Da kunne tyskerne erobre den og flytte 6. armé dit den trengtes andre steder på fronten. Byen måtte holdes, men bare akkurat nok.',
    },
    'en-arm': {
        tittel: 'Bare én arm kom fram',
        tekst: 'En tang trenger to armer. Med bare den ene kunne tyskerne trekke seg ut gjennom hullet på den andre siden. Se hvor fienden er svakest, og slå til der fra begge kanter.',
    },
    'ingen-arm': {
        tittel: 'Byen holdt, men ingenting ble avgjort',
        tekst: 'Du kastet reservene inn i byen, der tyskerne var sterkest. Det kostet mange liv og flyttet fronten nesten ingenting. Flankene til fienden sto urørt.',
    },
};

// Små firkanter som viser styrke. Røde = dine, grå = fienden.
function Pips({ count, color, max = 12 }: { count: number; color: string; max?: number }) {
    return (
        <div className="flex flex-wrap gap-1">
            {Array.from({ length: Math.min(count, max) }).map((_, i) => (
                <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-3 h-3 rounded-sm ${color}`}
                />
            ))}
        </div>
    );
}

export function Knipetangen({ title = 'Hvor skal reservene?', reserves = 12 }: KnipetangenProps) {
    const [alloc, setAlloc] = useState<Record<Zone, number>>({ nord: 0, byen: 0, sor: 0 });
    const [phase, setPhase] = useState<Phase>('plan');
    const [pulse, setPulse] = useState<Zone | null>(null);

    const used = alloc.nord + alloc.byen + alloc.sor;
    const left = reserves - used;
    const outcome = evaluate(alloc);

    const add = (z: Zone) => {
        if (phase !== 'plan' || left <= 0) return;
        setAlloc((a) => ({ ...a, [z]: a[z] + 1 }));
        setPulse(z);
    };
    const remove = (z: Zone) => {
        if (phase !== 'plan' || alloc[z] <= 0) return;
        setAlloc((a) => ({ ...a, [z]: a[z] - 1 }));
        setPulse(z);
    };
    const reset = () => {
        setAlloc({ nord: 0, byen: 0, sor: 0 });
        setPhase('plan');
        setPulse(null);
    };

    const nordOk = alloc.nord > ENEMY.nord;
    const sorOk = alloc.sor > ENEMY.sor;
    const showResult = phase === 'result';
    const cityFell = showResult && alloc.byen < HOLD_CITY;
    const won = showResult && outcome === 'seier';

    // Klikkbare soner på kartet
    const zoneRects: Record<Zone, { x: number; y: number; w: number; h: number }> = {
        nord: { x: 120, y: 22, w: 170, h: 70 },
        byen: { x: 250, y: 98, w: 68, h: 64 },
        sor: { x: 140, y: 168, w: 170, h: 70 },
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Crosshair className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Høsten 1942. Klikk på kartet for å fordele {reserves} reserveavdelinger. Så
                        setter du i gang angrepet.
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-6 space-y-3">
                {/* Kartet */}
                <div className="relative rounded-xl border border-slate-200 bg-amber-50/60 overflow-hidden">
                    <svg
                        viewBox="0 0 400 260"
                        className="w-full h-auto block max-h-[340px]"
                        role="img"
                        aria-label="Kart over Stalingrad og flankene"
                    >
                        {/* Don-elva i vest */}
                        <path
                            d="M70 0 C 110 60, 95 120, 120 150 S 100 230, 130 260"
                            stroke="#7fb3d5"
                            strokeWidth="5"
                            fill="none"
                        />
                        <text x="72" y="248" fontSize="10" fill="#4a7fa5">
                            Don
                        </text>
                        {/* Volga i øst */}
                        <path
                            d="M322 0 C 340 70, 318 120, 335 170 S 350 230, 352 260"
                            stroke="#5b9bd5"
                            strokeWidth="12"
                            fill="none"
                        />
                        <text x="355" y="30" fontSize="10" fill="#2f6fa5">
                            Volga
                        </text>

                        {/* Den tyske frontkilen inn mot byen */}
                        <path
                            d="M0 105 L 250 108 L 250 152 L 0 158 Z"
                            fill="#94a3b8"
                            opacity={0.45}
                        />
                        <text x="132" y="150" fontSize="8" fill="#334155">
                            Tyske styrker rykker fram
                        </text>

                        {/* Klikkbare soner */}
                        {(Object.keys(zoneRects) as Zone[]).map((z) => {
                            const r = zoneRects[z];
                            const hot = pulse === z;
                            const perRow = Math.floor((r.w - 12) / 11);
                            const ok = z === 'byen' ? alloc.byen >= HOLD_CITY : alloc[z] > ENEMY[z];
                            return (
                                <g
                                    key={z}
                                    onClick={() => add(z)}
                                    className={phase === 'plan' ? 'cursor-pointer' : ''}
                                    role="button"
                                    aria-label={`Legg en avdeling i ${ZONE_INFO[z].navn}`}
                                >
                                    <motion.rect
                                        x={r.x}
                                        y={r.y}
                                        width={r.w}
                                        height={r.h}
                                        rx={10}
                                        fill={ok ? '#fecaca' : '#ffffff'}
                                        stroke={ok ? '#dc2626' : '#cbd5e1'}
                                        strokeWidth={2}
                                        strokeDasharray={z === 'byen' ? '0' : '5 4'}
                                        animate={{ opacity: hot ? [0.6, 1] : 0.92 }}
                                        transition={{ duration: 0.25 }}
                                        onAnimationComplete={() => setPulse(null)}
                                    />
                                    <text
                                        x={r.x + 8}
                                        y={r.y + 15}
                                        fontSize="10"
                                        fontWeight="600"
                                        fill="#1e293b"
                                    >
                                        {ZONE_INFO[z].navn}
                                    </text>
                                    <text x={r.x + 8} y={r.y + 27} fontSize="8.5" fill="#64748b">
                                        Fiende: {ENEMY[z]}
                                    </text>
                                    {Array.from({ length: alloc[z] }).map((_, i) => (
                                        <motion.rect
                                            key={i}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            x={r.x + 8 + (i % perRow) * 11}
                                            y={r.y + 34 + Math.floor(i / perRow) * 11}
                                            width={8}
                                            height={8}
                                            rx={2}
                                            fill="#dc2626"
                                        />
                                    ))}
                                </g>
                            );
                        })}

                        <circle cx="112" cy="132" r="4" fill="#1e293b" />
                        <text x="60" y="126" fontSize="9" fill="#1e293b">
                            Kalatsj
                        </text>

                        {/* Angrepsarmene når planen settes i verk */}
                        {showResult && !cityFell && (
                            <>
                                <motion.path
                                    d="M220 30 C 200 70, 150 90, 114 126"
                                    stroke={nordOk ? '#dc2626' : '#f87171'}
                                    strokeWidth={6}
                                    fill="none"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: nordOk ? 1 : 0.35 }}
                                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                                />
                                <motion.path
                                    d="M240 232 C 210 190, 160 170, 116 138"
                                    stroke={sorOk ? '#dc2626' : '#f87171'}
                                    strokeWidth={6}
                                    fill="none"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: sorOk ? 1 : 0.35 }}
                                    transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.3 }}
                                />
                            </>
                        )}
                        {won && (
                            <motion.ellipse
                                cx={190}
                                cy={131}
                                rx={80}
                                ry={34}
                                fill="none"
                                stroke="#dc2626"
                                strokeWidth={3}
                                strokeDasharray="6 4"
                                initial={{ opacity: 0, scale: 1.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.7, duration: 0.6 }}
                                style={{ transformOrigin: '190px 131px' }}
                            />
                        )}
                        {cityFell && (
                            <motion.text
                                x={258}
                                y={92}
                                fontSize="11"
                                fontWeight="700"
                                fill="#475569"
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 92 }}
                            >
                                Byen er tatt
                            </motion.text>
                        )}
                    </svg>
                </div>

                {/* Soneoversikt */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm px-1">
                        <span className="text-slate-600">Reserver igjen</span>
                        <motion.span
                            key={left}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            className={`font-bold text-lg ${left === 0 ? 'text-emerald-600' : 'text-slate-800'}`}
                        >
                            {left}
                        </motion.span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {(['nord', 'byen', 'sor'] as Zone[]).map((z) => (
                            <div
                                key={z}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-slate-800">
                                        {ZONE_INFO[z].navn}
                                        <span className="block text-[11px] font-normal text-slate-500">
                                            {ZONE_INFO[z].fiende}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => remove(z)}
                                            disabled={phase !== 'plan' || alloc[z] === 0}
                                            className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                            aria-label={`Fjern avdeling fra ${ZONE_INFO[z].navn}`}
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-6 text-center font-semibold text-slate-800">
                                            {alloc[z]}
                                        </span>
                                        <button
                                            onClick={() => add(z)}
                                            disabled={phase !== 'plan' || left === 0}
                                            className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                            aria-label={`Legg avdeling i ${ZONE_INFO[z].navn}`}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-1.5 grid grid-cols-[3.5rem_1fr] gap-y-1 items-center text-[11px] text-slate-500">
                                    <span>Fiende</span>
                                    <Pips count={ENEMY[z]} color="bg-slate-400" />
                                    <span>Dine</span>
                                    <Pips count={alloc[z]} color="bg-red-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-4 md:mx-6 mb-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {!showResult ? (
                        <motion.div
                            key="hint"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Byen må ha minst {HOLD_CITY} avdelinger for ikke å falle. Et angrep
                            lykkes bare der du er sterkere enn fienden.
                        </motion.div>
                    ) : (
                        <motion.div
                            key={outcome}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                delay: won ? 1.9 : 0.4,
                                type: 'spring',
                                stiffness: 260,
                                damping: 22,
                            }}
                            className={`px-4 py-3 rounded-lg border text-sm flex gap-3 ${
                                won
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            {won ? (
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <div className="font-semibold mb-0.5">
                                    {OUTCOME_TEXT[outcome].tittel}
                                </div>
                                <div className="leading-relaxed">{OUTCOME_TEXT[outcome].tekst}</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 md:px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={() => setPhase('result')}
                    disabled={phase !== 'plan' || used === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-full px-6 py-2 text-sm font-medium flex items-center gap-2"
                >
                    <Play className="w-4 h-4" /> Sett i gang angrepet
                </button>
                <button
                    onClick={reset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
