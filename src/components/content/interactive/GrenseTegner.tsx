import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Users, Lock, RotateCcw } from 'lucide-react';

interface Folkegruppe {
    navn: string;
    start: number; // 0-100, hvor gruppen begynner langs kartet
    end: number; // 0-100, hvor gruppen slutter
    row: number; // 0, 1 eller 2 - hvilken rad pillen tegnes i
}

interface GrenseTegnerProps {
    title?: string;
    grupper?: Folkegruppe[];
}

type Phase = 'idle' | 'active' | 'complete';

// Standard-data: seks folkegrupper som overlapper slik at nesten enhver rett
// strek gjennom landet deler minst en av dem i to. Poenget eleven skal kjenne:
// grensene i Afrika ble tegnet med linjal, tvers gjennom folk som horte sammen.
const DEFAULT_GRUPPER: Folkegruppe[] = [
    { navn: 'Bakongo', start: 8, end: 34, row: 0 },
    { navn: 'Yoruba', start: 26, end: 52, row: 1 },
    { navn: 'Hausa', start: 45, end: 70, row: 0 },
    { navn: 'Maasai', start: 62, end: 88, row: 1 },
    { navn: 'Ashanti', start: 20, end: 46, row: 2 },
    { navn: 'Somali', start: 54, end: 82, row: 2 },
];

const ROW_COLORS = ['#6366f1', '#0ea5e9', '#14b8a6'];

export function GrenseTegner({
    title = 'Berlin, 1884: Du tegner grensen',
    grupper = DEFAULT_GRUPPER,
}: GrenseTegnerProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [border, setBorder] = useState(50); // grensens posisjon 5-95

    const splitGroups = useMemo(
        () => grupper.filter((g) => g.start < border && border < g.end),
        [grupper, border]
    );
    const splitCount = splitGroups.length;

    const handleMove = (v: number) => {
        setBorder(v);
        if (phase === 'idle') setPhase('active');
        if (phase === 'complete') setPhase('active');
    };

    const handleLock = () => setPhase('complete');

    const handleReset = () => {
        setPhase('idle');
        setBorder(50);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Ruler className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra streken og se hvor mange folkegrupper den deler i to.
                    </p>
                </div>
            </div>

            {/* Kart-flate */}
            <div className="p-6">
                <div className="relative h-64 rounded-lg overflow-hidden border border-slate-200 select-none">
                    {/* to sider = to europeiske stormakter */}
                    <div
                        className="absolute inset-y-0 left-0 bg-amber-50"
                        style={{ width: `${border}%` }}
                    />
                    <div
                        className="absolute inset-y-0 right-0 bg-rose-50"
                        style={{ width: `${100 - border}%` }}
                    />

                    {/* side-etiketter */}
                    <span className="absolute top-2 left-3 text-[11px] font-semibold text-amber-700/80">
                        Stormakt A
                    </span>
                    <span className="absolute top-2 right-3 text-[11px] font-semibold text-rose-700/80">
                        Stormakt B
                    </span>

                    {/* folkegruppe-piller */}
                    {grupper.map((g) => {
                        const isSplit = g.start < border && border < g.end;
                        const top = 44 + g.row * 62;
                        return (
                            <motion.div
                                key={g.navn}
                                className="absolute flex items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm"
                                style={{
                                    left: `${g.start}%`,
                                    width: `${g.end - g.start}%`,
                                    top,
                                    height: 40,
                                    backgroundColor: ROW_COLORS[g.row],
                                }}
                                animate={
                                    isSplit
                                        ? { x: [0, -3, 3, -2, 0], opacity: 0.95 }
                                        : { x: 0, opacity: 0.9 }
                                }
                                transition={{ duration: 0.35 }}
                            >
                                <span className="truncate px-2">{g.navn}</span>
                                <AnimatePresence>
                                    {isSplit && (
                                        <motion.span
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-2 -right-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow"
                                        >
                                            delt
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}

                    {/* selve grenselinjen */}
                    <motion.div
                        className="absolute inset-y-0 w-0.5 bg-slate-800"
                        style={{ left: `${border}%` }}
                        animate={{ left: `${border}%` }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-800" />
                    </motion.div>
                </div>

                {/* kontroll-slider */}
                <div className="mt-5">
                    <label className="flex items-center justify-between text-sm text-slate-600 mb-1">
                        <span>Flytt grensen</span>
                        <span className="text-slate-400">Berlinkonferansen 1884-1885</span>
                    </label>
                    <input
                        type="range"
                        min={5}
                        max={95}
                        step={1}
                        value={border}
                        onChange={(e) => handleMove(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                        aria-label="Grensens posisjon"
                    />
                </div>
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <div className="flex items-center gap-2 font-semibold">
                                <Lock className="w-4 h-4" />
                                Grensen er trukket
                            </div>
                            <p className="mt-1 leading-snug">
                                Streken din delte{' '}
                                <span className="font-bold">{splitCount}</span>{' '}
                                {splitCount === 1 ? 'folkegruppe' : 'folkegrupper'} i to. Slik ble
                                Afrikas grenser til: rette streker tegnet i Europa, tvers gjennom folk
                                som hørte sammen. De fleste av disse grensene finnes fortsatt i dag.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex items-center gap-2 ${
                                splitCount > 0
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            <Users className="w-4 h-4 shrink-0" />
                            <span>
                                {splitCount > 0 ? (
                                    <>
                                        Grensen deler nå{' '}
                                        <span className="font-bold">{splitCount}</span>{' '}
                                        {splitCount === 1 ? 'folkegruppe' : 'folkegrupper'}:{' '}
                                        {splitGroups.map((g) => g.navn).join(', ')}.
                                    </>
                                ) : (
                                    <>
                                        Akkurat her deler streken ingen - men da får den ene siden
                                        nesten ingenting. Prøv å flytte den innover.
                                    </>
                                )}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={handleLock}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Lås grensen
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
