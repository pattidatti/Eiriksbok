import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To sider av samme sak.
 * - `kolonitid`: en skålvekt med makt på den ene siden og hjelp på den andre. Vekta vipper
 *   litt for hver ting som legges på, og ender i balanse med et spørsmålstegn.
 * - `kvinner`: hva kvinnene i foreningene fikk gjøre, og hva de ikke fikk.
 */

type Modus = 'kolonitid' | 'kvinner';

const B = 1600;
const H = 900;
const MAKT = '#b91c1c';
const HJELP = '#0f766e';
const LILLA = '#7c3aed';
const MORK = '#1e293b';

interface Ting {
    tekst: string;
    fraBeat: number;
}

const MAKT_TING: Ting[] = [
    { tekst: 'Del av kolonimaktenes styre', fraBeat: 1 },
    { tekst: 'Legg bort den gamle religionen', fraBeat: 2 },
];
const HJELP_TING: Ting[] = [
    { tekst: 'Noen gikk imot kolonimaktene', fraBeat: 1 },
    { tekst: 'Holdt liv i språket gassisk', fraBeat: 3 },
    { tekst: 'Afrikanske studenter i Stavanger', fraBeat: 4 },
    { tekst: '1950: egen kirke på Madagaskar', fraBeat: 4 },
];

export function MisjonVekt({ beat, props }: VisualProps<{ modus: Modus }>) {
    return props.modus === 'kvinner' ? <Kvinner beat={beat} /> : <Vekt beat={beat} />;
}

function Vekt({ beat }: { beat: number }) {
    const makt = MAKT_TING.filter((t) => beat >= t.fraBeat);
    const hjelp = HJELP_TING.filter((t) => beat >= t.fraBeat);
    // Positiv vinkel: høyre side (hjelp) går ned. På siste beat står vekta i balanse.
    const sisteBeat = beat >= 5;
    // Vekta skal ikke felle en dom, så den står i balanse.
    const vinkel = 0;
    const L = 430;
    const cx = 800;
    const cy = 250;
    const rad = (vinkel * Math.PI) / 180;
    const dyV = -L * Math.sin(rad);
    const dyH = L * Math.sin(rad);
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <text x={cx} y={70} textAnchor="middle" fontSize={44} fontWeight={900} fill={MORK} letterSpacing={2}>
                    MISJON I KOLONITIDEN
                </text>
                {/* Stativ */}
                <path d={`M ${cx - 120} 860 L ${cx + 120} 860 L ${cx + 18} ${cy} L ${cx - 18} ${cy} Z`} fill="#94a3b8" />
                {/* Bjelken */}
                <motion.g animate={{ rotate: vinkel }} transition={{ type: 'spring', stiffness: 40, damping: sisteBeat ? 4 : 10 }} style={{ transformOrigin: `${cx}px ${cy}px` }}>
                    <rect x={cx - L - 10} y={cy - 10} width={2 * L + 20} height={20} rx={10} fill="#475569" />
                </motion.g>
                <circle cx={cx} cy={cy} r={22} fill="#334155" />
                <Skaal x={cx - L} y={cy} dy={dyV} farge={MAKT} tittel="MAKT" ting={makt} sisteBeat={sisteBeat} />
                <Skaal x={cx + L} y={cy} dy={dyH} farge={HJELP} tittel="HJELP" ting={hjelp} sisteBeat={sisteBeat} />
                <AnimatePresence>
                    {sisteBeat && (
                        <motion.g key="sp" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} style={{ transformOrigin: `${cx}px 120px` }}>
                            <circle cx={cx} cy={150} r={70} fill="#ffffff" stroke={LILLA} strokeWidth={8} />
                            <text x={cx} y={184} textAnchor="middle" fontSize={100} fontWeight={900} fill={LILLA}>
                                ?
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>
                {beat === 0 && (
                    <motion.text x={cx} y={560} textAnchor="middle" fontSize={44} fontWeight={800} fill={MORK} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                        Europa tar makten over store deler av verden
                    </motion.text>
                )}
            </svg>
        </div>
    );
}

function Skaal({
    x,
    y,
    dy,
    farge,
    tittel,
    ting,
    sisteBeat,
}: {
    x: number;
    y: number;
    dy: number;
    farge: string;
    tittel: string;
    ting: Ting[];
    sisteBeat: boolean;
}) {
    return (
        <motion.g animate={{ y: dy }} transition={{ type: 'spring', stiffness: 40, damping: sisteBeat ? 4 : 10 }}>
            <line x1={x} y1={y} x2={x - 120} y2={y + 110} stroke="#475569" strokeWidth={5} />
            <line x1={x} y1={y} x2={x + 120} y2={y + 110} stroke="#475569" strokeWidth={5} />
            <path d={`M ${x - 150} ${y + 110} L ${x + 150} ${y + 110} Q ${x + 130} ${y + 150} ${x} ${y + 150} Q ${x - 130} ${y + 150} ${x - 150} ${y + 110} Z`} fill={farge} />
            <text x={x} y={y + 100} textAnchor="middle" fontSize={40} fontWeight={900} fill={farge} letterSpacing={3}>
                {tittel}
            </text>
            {ting.map((t, i) => (
                <motion.g key={t.tekst} initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i % 2) * 0.8, type: 'spring', stiffness: 160, damping: 16 }}>
                    <rect x={x - 215} y={y + 170 + i * 92} width={430} height={78} rx={14} fill="#ffffff" stroke={farge} strokeWidth={5} />
                    <foreignObject x={x - 208} y={y + 172 + i * 92} width={416} height={74}>
                        <div className="h-full flex items-center justify-center text-center font-bold text-slate-900 leading-tight" style={{ fontSize: 31 }}>
                            {t.tekst}
                        </div>
                    </foreignObject>
                </motion.g>
            ))}
        </motion.g>
    );
}

const FIKK: Ting[] = [
    { tekst: 'Holde møter', fraBeat: 0 },
    { tekst: 'Samle inn penger', fraBeat: 0 },
    { tekst: 'Bestemme sammen', fraBeat: 0 },
    { tekst: '1904: stemmerett i selskapet', fraBeat: 4 },
    { tekst: 'Reise ut som sykepleier eller lege', fraBeat: 5 },
];
const FIKK_IKKE: Ting[] = [
    { tekst: 'Preke', fraBeat: 3 },
    { tekst: 'Bli prest', fraBeat: 4 },
];
const BANNER: Record<number, { tekst: string; farge: string }> = {
    1: { tekst: '1800-tallet: nesten ingen plass i politikken', farge: MORK },
    2: { tekst: 'En av røttene til kvinnekampen', farge: LILLA },
};

function Kvinner({ beat }: { beat: number }) {
    const banner = BANNER[beat];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-amber-50 via-white to-teal-50">
            <div className="absolute inset-x-[5%] top-[5%] h-[14%] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {banner ? (
                        <motion.div
                            key={beat}
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-6 py-3 rounded-2xl text-white font-black text-3xl shadow-xl"
                            style={{ background: banner.farge }}
                        >
                            {banner.tekst}
                        </motion.div>
                    ) : (
                        <motion.div key="tittel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate-800 font-black text-4xl tracking-wide">
                            Kvinnene i misjonsforeningene
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="absolute inset-x-[5%] top-[19%] bottom-[3%] grid grid-cols-2 gap-[4%]">
                <Kolonne tittel="Fikk" farge={HJELP} ting={FIKK} beat={beat} merke="ja" demp={beat === 3} />
                <Kolonne tittel="Fikk ikke" farge={MAKT} ting={FIKK_IKKE} beat={beat} merke="nei" demp={beat < 3} />
            </div>
        </div>
    );
}

function Kolonne({
    tittel,
    farge,
    ting,
    beat,
    merke,
    demp,
}: {
    tittel: string;
    farge: string;
    ting: Ting[];
    beat: number;
    merke: 'ja' | 'nei';
    demp: boolean;
}) {
    return (
        <motion.div animate={{ opacity: demp ? 0.45 : 1 }} className="flex flex-col gap-2">
            <div className="text-4xl font-black" style={{ color: farge }}>
                {tittel}
            </div>
            {ting
                .filter((t) => beat >= t.fraBeat)
                .map((t, i) => (
                    <motion.div
                        key={t.tekst}
                        initial={{ opacity: 0, x: merke === 'ja' ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (t.fraBeat === 0 ? i * 0.5 : 0.3), type: 'spring', stiffness: 160, damping: 18 }}
                        className={`flex items-center gap-4 px-5 py-2 rounded-2xl bg-white shadow-lg border-l-[10px] ${beat === t.fraBeat ? 'ring-4 ring-amber-300' : ''}`}
                        style={{ borderColor: farge }}
                    >
                        <span className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white text-2xl font-black" style={{ background: farge }}>
                            {merke === 'ja' ? '✓' : '✕'}
                        </span>
                        <span className="text-2xl font-bold text-slate-900">{t.tekst}</span>
                    </motion.div>
                ))}
        </motion.div>
    );
}
