import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Church, Check, RotateCcw, Triangle, Grid3x3, MoveUpRight } from 'lucide-react';

interface KatedralKrefteneProps {
    title?: string;
}

type GrepId = 'spissbue' | 'ribbehvelv' | 'strebebue';

interface Grep {
    id: GrepId;
    navn: string;
    ikon: typeof Triangle;
    forklaring: string;
}

const GREP: Grep[] = [
    {
        id: 'spissbue',
        navn: 'Spissbue',
        ikon: Triangle,
        forklaring:
            'To buer som møtes i en spiss. Den leder tyngden mer rett nedover enn den runde buen, så muren kan bygges høyere.',
    },
    {
        id: 'ribbehvelv',
        navn: 'Ribbehvelv',
        ikon: Grid3x3,
        forklaring:
            'Et tak av steinribber som samler vekten i noen få punkter. Nå trykker taket ikke lenger like hardt på hele muren.',
    },
    {
        id: 'strebebue',
        navn: 'Strebebue',
        ikon: MoveUpRight,
        forklaring:
            'En bue på utsiden som fanger opp presset fra hvelvet og fører det ned i pilarer utenfor kirka. Nå kan muren bli tynn og full av glass.',
    },
];

export function KatedralKreftene({ title = 'Bygg katedralen mot himmelen' }: KatedralKrefteneProps) {
    const [aktiv, setAktiv] = useState<Record<GrepId, boolean>>({
        spissbue: false,
        ribbehvelv: false,
        strebebue: false,
    });
    const [sist, setSist] = useState<GrepId | null>(null);

    const antall = Object.values(aktiv).filter(Boolean).length;
    const ferdig = antall === 3;
    // Faresone: taket er lagt, men presset er ikke fanget opp av strebebuer ennå.
    const fare = aktiv.ribbehvelv && !aktiv.strebebue;

    const toggle = (id: GrepId) => {
        setAktiv((f) => ({ ...f, [id]: !f[id] }));
        setSist(id);
    };

    const reset = () => {
        setAktiv({ spissbue: false, ribbehvelv: false, strebebue: false });
        setSist(null);
    };

    // Utledede mål for tegningen.
    const vegghoyde = 60 + (aktiv.spissbue ? 34 : 0) + (aktiv.ribbehvelv ? 20 : 0);
    const veggtopp = 200 - vegghoyde; // y-koordinat for toppen av muren
    const veggbredde = aktiv.strebebue ? 12 : 22; // tynnere mur med strebebuer
    const lys = (aktiv.spissbue ? 0.28 : 0) + (aktiv.strebebue ? 0.5 : 0) + (aktiv.ribbehvelv ? 0.1 : 0);
    const helning = fare ? 7 : 0; // muren presses utover uten støtte

    const feedback = sist ? GREP.find((g) => g.id === sist) : null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Church className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Slå på de tre byggegrepene og se hvordan katedralen kan strekke seg høyere og
                        slippe inn mer lys.
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center">
                {/* Tegning */}
                <div className="relative">
                    <svg viewBox="0 0 240 220" className="w-full h-auto select-none" role="img"
                        aria-label="Tverrsnitt av en katedral som vokser i høyde">
                        <defs>
                            <radialGradient id="katedral-lys" cx="50%" cy="45%" r="55%">
                                <stop offset="0%" stopColor="#fde68a" />
                                <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
                            </radialGradient>
                        </defs>

                        {/* Himmel-glow som vokser med lyset */}
                        <motion.rect
                            x="0" y="0" width="240" height="200"
                            fill="url(#katedral-lys)"
                            animate={{ opacity: lys }}
                            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                        />

                        {/* Bakke */}
                        <rect x="0" y="200" width="240" height="20" fill="#cbd5e1" />

                        {/* Strebebuer (utsiden) */}
                        <AnimatePresence>
                            {aktiv.strebebue && (
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    stroke="#78716c"
                                    strokeWidth="5"
                                    fill="none"
                                    strokeLinecap="round"
                                >
                                    {/* venstre strebepilar + bue */}
                                    <line x1="30" y1="200" x2="30" y2={veggtopp + 30} />
                                    <path d={`M30 ${veggtopp + 30} Q 55 ${veggtopp + 20} 72 ${veggtopp + 34}`} />
                                    {/* høyre strebepilar + bue */}
                                    <line x1="210" y1="200" x2="210" y2={veggtopp + 30} />
                                    <path d={`M210 ${veggtopp + 30} Q 185 ${veggtopp + 20} 168 ${veggtopp + 34}`} />
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* Kirkekroppen (roterer litt ut i faresonen) */}
                        <motion.g
                            style={{ originX: '120px', originY: '200px' }}
                            animate={{ rotate: 0 }}
                        >
                            {/* venstre mur */}
                            <motion.rect
                                x="72" fill="#a8a29e"
                                initial={false}
                                animate={{ y: veggtopp, height: 200 - veggtopp, width: veggbredde, rotate: -helning }}
                                transition={{ type: 'spring', stiffness: 110, damping: 16 }}
                                style={{ originX: '72px', originY: '200px' }}
                            />
                            {/* høyre mur */}
                            <motion.rect
                                fill="#a8a29e"
                                initial={false}
                                animate={{ x: 168 - veggbredde + 22, y: veggtopp, height: 200 - veggtopp, width: veggbredde, rotate: helning }}
                                transition={{ type: 'spring', stiffness: 110, damping: 16 }}
                                style={{ originX: '190px', originY: '200px' }}
                            />

                            {/* Tak/hvelv */}
                            {aktiv.ribbehvelv ? (
                                <motion.polygon
                                    fill={fare ? '#fca5a5' : '#c084fc'}
                                    initial={false}
                                    animate={{ points: `84,${veggtopp} 120,${veggtopp - 44} 178,${veggtopp}` }}
                                    transition={{ type: 'spring', stiffness: 110, damping: 16 }}
                                />
                            ) : (
                                <motion.polygon
                                    fill="#78716c"
                                    initial={false}
                                    animate={{ points: `84,${veggtopp} 120,${veggtopp - 22} 178,${veggtopp}` }}
                                    transition={{ type: 'spring', stiffness: 110, damping: 16 }}
                                />
                            )}

                            {/* Vindu: rundt og lite (romansk) eller høyt og spisst (gotisk) */}
                            {aktiv.spissbue ? (
                                <motion.path
                                    fill="#38bdf8"
                                    initial={false}
                                    animate={{
                                        d: `M110 ${190} L110 ${veggtopp + 34} Q120 ${veggtopp + 14} 130 ${veggtopp + 34} L130 190 Z`,
                                    }}
                                    transition={{ type: 'spring', stiffness: 110, damping: 16 }}
                                />
                            ) : (
                                <circle cx="120" cy="168" r="9" fill="#7dd3fc" />
                            )}
                        </motion.g>

                        {/* Fare-piler: presset ut av murene */}
                        <AnimatePresence>
                            {fare && (
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    stroke="#dc2626"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                >
                                    <line x1="80" y1={veggtopp + 18} x2="58" y2={veggtopp + 18} />
                                    <line x1="58" y1={veggtopp + 18} x2="66" y2={veggtopp + 12} />
                                    <line x1="58" y1={veggtopp + 18} x2="66" y2={veggtopp + 24} />
                                    <line x1="182" y1={veggtopp + 18} x2="204" y2={veggtopp + 18} />
                                    <line x1="204" y1={veggtopp + 18} x2="196" y2={veggtopp + 12} />
                                    <line x1="204" y1={veggtopp + 18} x2="196" y2={veggtopp + 24} />
                                </motion.g>
                            )}
                        </AnimatePresence>
                    </svg>

                    {ferdig && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md"
                        >
                            <Check className="w-4 h-4" />
                        </motion.div>
                    )}
                </div>

                {/* Kontroll: de tre grepene */}
                <div className="flex flex-col gap-2.5">
                    {GREP.map((g) => {
                        const aktivert = aktiv[g.id];
                        const Ikon = g.ikon;
                        return (
                            <button
                                key={g.id}
                                onClick={() => toggle(g.id)}
                                className={`flex items-center gap-3 text-left rounded-xl border px-4 py-3 transition-colors ${
                                    aktivert
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                            >
                                <span
                                    className={`flex-shrink-0 rounded-lg p-2 ${
                                        aktivert ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    <Ikon className="w-4 h-4" />
                                </span>
                                <span className="font-medium text-sm">{g.navn}</span>
                                {aktivert && <Check className="w-4 h-4 ml-auto text-indigo-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="mx-6 mb-4 min-h-[3.25rem]">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            Sammen løfter de tre grepene katedralen mot himmelen. Spissbuen og
                            ribbehvelvet samler tyngden, og strebebuen fanger opp presset utenfor. Derfor
                            kunne muren bli tynn og høy, og lyset strømme inn gjennom store glassvinduer.
                        </motion.div>
                    ) : fare ? (
                        <motion.div
                            key="fare"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                        >
                            Hvelvet presser murene utover. Uten noe som fanger opp presset ville muren
                            sprekke. Slå på strebebuen for å føre kreftene trygt ned i bakken.
                        </motion.div>
                    ) : feedback ? (
                        <motion.div
                            key={feedback.id + String(aktiv[feedback.id])}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            <span className="font-semibold">{feedback.navn}:</span> {feedback.forklaring}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 text-sm text-slate-400"
                        >
                            Trykk på et byggegrep for å se hva det gjør med katedralen.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">{antall} av 3 byggegrep på</span>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
