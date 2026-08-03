import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Landmark, Briefcase, Scale, RotateCcw, ShieldCheck, ShieldAlert, Skull, AlertTriangle } from 'lucide-react';

interface MakttredelingenProps {
    title?: string;
    intro?: string;
}

type StepId = 0 | 1 | 2 | 3;

interface StepConfig {
    id: StepId;
    label: string;
    regime: string;
    example: string;
    period: string;
    freedom: number;
    explanation: string;
    icon: typeof ShieldCheck;
    accent: string;
    border: string;
    bar: string;
    pillBg: string;
    pillText: string;
}

const STEPS: StepConfig[] = [
    {
        id: 0,
        label: 'Alle uavhengige',
        regime: 'Demokrati',
        example: 'Norge',
        period: '1814 — i dag',
        freedom: 100,
        explanation:
            'Stortinget lager lovene, regjeringen håndhever dem, og domstolene avgjør om noen brøt dem. Ingen kan misbruke makten alene. Dette er Montesquieus ideal — slik Eidsvollsmennene bygde Grunnloven.',
        icon: ShieldCheck,
        accent: 'text-emerald-700',
        border: 'border-emerald-200 bg-emerald-50',
        bar: 'bg-emerald-500',
        pillBg: 'bg-emerald-100',
        pillText: 'text-emerald-800',
    },
    {
        id: 1,
        label: 'Én gren faller',
        regime: 'Autoritær tendens',
        example: 'Ungarn',
        period: 'fra 2010',
        freedom: 60,
        explanation:
            'Regjeringen overtar kontrollen over domstolene. Lovene gjelder fortsatt — men ingen uavhengig dommer kan stoppe statsministeren. Pressefriheten svekkes, opposisjonen mister beskyttelse.',
        icon: ShieldAlert,
        accent: 'text-amber-700',
        border: 'border-amber-200 bg-amber-50',
        bar: 'bg-amber-500',
        pillBg: 'bg-amber-100',
        pillText: 'text-amber-800',
    },
    {
        id: 2,
        label: 'To grener samlet',
        regime: 'Autokrati',
        example: 'Russland',
        period: 'fra 2000',
        freedom: 25,
        explanation:
            'Presidenten kontrollerer både regjering og domstoler. Parlamentet finnes, men stemmer som lederen vil. Valg holdes, men resultatet er gitt. Kritikere fengsles av lojale dommere.',
        icon: AlertTriangle,
        accent: 'text-orange-700',
        border: 'border-orange-200 bg-orange-50',
        bar: 'bg-orange-500',
        pillBg: 'bg-orange-100',
        pillText: 'text-orange-800',
    },
    {
        id: 3,
        label: 'Helt samlet i én hånd',
        regime: 'Enevelde / diktatur',
        example: 'Frankrike under Ludvig 14.',
        period: '1643–1715',
        freedom: 0,
        explanation:
            '«L\'État, c\'est moi» — Staten, det er meg. Kongen lager lovene, håndhever dem og dømmer i dem. Det var dette samfunnet Montesquieu reiste vekk fra. Ingen rettssikkerhet, ingen ytringsfrihet, ingen vei til å klage.',
        icon: Skull,
        accent: 'text-rose-700',
        border: 'border-rose-200 bg-rose-50',
        bar: 'bg-rose-500',
        pillBg: 'bg-rose-100',
        pillText: 'text-rose-800',
    },
];

const BRANCHES = [
    { id: 'lov', label: 'Stortinget', sublabel: 'Lovgivende', icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'utov', label: 'Regjeringen', sublabel: 'Utøvende', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'dom', label: 'Domstolene', sublabel: 'Dømmende', icon: Scale, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

function getCrownTarget(step: StepId, branchIndex: number) {
    if (step === 0) return branchIndex;
    if (step === 1) return branchIndex >= 1 ? 1 : branchIndex;
    if (step === 2) return branchIndex >= 1 ? 1 : 0;
    return 1;
}

export function Makttredelingen({
    title = 'Makttredelingen',
    intro = 'Skyv kontrollen — hva skjer når makten samles på én hånd?',
}: MakttredelingenProps) {
    const [step, setStep] = useState<StepId>(0);
    const [explored, setExplored] = useState<Set<StepId>>(new Set([0]));

    // Å bytte steg og å registrere at steget er utforsket hører sammen. Før lå
    // registreringen i en effect og skjedde én render senere enn selve byttet.
    const goToStep = (id: StepId) => {
        setStep(id);
        setExplored((prev) => new Set(prev).add(id));
    };

    const current = STEPS[step];
    const Icon = current.icon;
    const allExplored = explored.size === STEPS.length;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
                <Crown className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            <div className="px-6 pt-5 pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STEPS.map((s) => {
                        const active = s.id === step;
                        return (
                            <button
                                key={s.id}
                                onClick={() => goToStep(s.id)}
                                className={`relative text-left px-3 py-2 rounded-lg border transition-all ${
                                    active
                                        ? `${s.border} ring-2 ring-offset-1 ring-slate-300 shadow-sm`
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                                    Steg {s.id + 1}
                                </div>
                                <div className={`text-sm font-semibold ${active ? s.accent : 'text-slate-700'}`}>
                                    {s.label}
                                </div>
                                {explored.has(s.id) && !active && (
                                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="px-6 py-4">
                <div className="relative h-44 flex items-end justify-center gap-3 sm:gap-6">
                    {BRANCHES.map((b, idx) => {
                        const B = b.icon;
                        return (
                            <motion.div
                                key={b.id}
                                animate={{
                                    x: step === 0 ? 0 : step === 3 ? (idx - 1) * -60 + 0 : (getCrownTarget(step, idx) - idx) * 80,
                                    scale: step === 3 ? 0.92 : 1,
                                }}
                                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                                className={`relative flex flex-col items-center w-24 sm:w-28 rounded-xl border-2 ${b.border} ${b.bg} px-2 py-3`}
                            >
                                <B className={`w-7 h-7 ${b.color}`} />
                                <div className={`text-xs font-semibold mt-1 ${b.color}`}>{b.label}</div>
                                <div className="text-[10px] text-slate-500">{b.sublabel}</div>
                            </motion.div>
                        );
                    })}

                    <AnimatePresence>
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute top-0 left-1/2 -translate-x-1/2"
                        >
                            <div className="flex gap-2">
                                {step === 0 && (
                                    <>
                                        <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center text-xs font-bold text-indigo-700">A</div></div>
                                        <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-xs font-bold text-amber-700">B</div></div>
                                        <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-xs font-bold text-emerald-700">C</div></div>
                                    </>
                                )}
                                {step === 1 && (
                                    <>
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center text-xs font-bold text-indigo-700">A</div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-amber-400 flex items-center justify-center"><Crown className="w-4 h-4 text-amber-700" /></div>
                                        </div>
                                    </>
                                )}
                                {step === 2 && (
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-orange-200 border-2 border-orange-400 flex items-center justify-center"><Crown className="w-5 h-5 text-orange-700" /></div>
                                        <div className="text-[10px] text-orange-700 mt-0.5">Lederen</div>
                                    </div>
                                )}
                                {step === 3 && (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full bg-rose-200 border-2 border-rose-400 flex items-center justify-center"><Crown className="w-6 h-6 text-rose-700" /></div>
                                        <div className="text-[10px] text-rose-700 mt-0.5">Eneveldig</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`info-${step}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className={`mx-6 mb-4 rounded-xl border ${current.border} px-5 py-4`}
                >
                    <div className="flex items-start gap-3">
                        <Icon className={`w-6 h-6 ${current.accent} mt-0.5 shrink-0`} />
                        <div className="flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
                                <span className={`text-base font-semibold ${current.accent}`}>{current.regime}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${current.pillBg} ${current.pillText} font-medium`}>
                                    {current.example} · {current.period}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{current.explanation}</p>

                            <div className="mt-3">
                                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                                    <span>Frihet i samfunnet</span>
                                    <span className={current.accent}>{current.freedom}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                    <motion.div
                                        className={`h-full ${current.bar}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${current.freedom}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {allExplored && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mx-6 mb-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-5 py-4"
                >
                    <p className="text-sm text-slate-700 italic">
                        «Når makten ikke er delt, er friheten ikke trygg.» — fritt etter Montesquieu. Du har sett alle fire stegene: jo mer makt samles, jo mindre frihet finnes.
                    </p>
                </motion.div>
            )}

            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    {allExplored ? 'Du har sett alle stegene.' : `${explored.size} av ${STEPS.length} steg utforsket.`}
                </span>
                <button
                    onClick={() => {
                        setStep(0);
                        setExplored(new Set([0]));
                    }}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
