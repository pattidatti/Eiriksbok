import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Et hus i snitt, som et dukkehus uten forvegg. Leseren ser alle rommene samtidig.
 * «ironi»: hun gråter på soverommet, han smiler i stuen, og ingen av dem vet om den andre.
 * «kjeller»: den upålitelige fortelleren. Vi ser bare en låst kjellerdør, og må selv
 * avgjøre hva den betyr.
 */

type Modus = 'ironi' | 'kjeller';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const inn = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

const VEGG_V = 470;
const VEGG_H = 1130;
const MIDT = 800;
const GULV = 600;
const TAK = 300;
const KJELLER = 820;

function Lapp({
    x,
    y,
    b,
    linjer,
    fyll,
    tekst = '#ffffff',
    str = 40,
}: {
    x: number;
    y: number;
    b: number;
    linjer: string[];
    fyll: string;
    tekst?: string;
    str?: number;
}) {
    const h = linjer.length * str * 1.25 + 40;
    return (
        <g>
            <rect x={x} y={y} width={b} height={h} rx={24} fill={fyll} />
            {linjer.map((l, i) => (
                <text key={l} x={x + b / 2} y={y + 20 + str + i * str * 1.25 - 6} textAnchor="middle" fontSize={str} fontWeight={900} fill={tekst} style={FONT}>
                    {l}
                </text>
            ))}
        </g>
    );
}

/** Kvinnen på senga, med tårer som faller. */
function Hun({ beat }: { beat: number }) {
    return (
        <g>
            <rect x={500} y={520} width={240} height={70} rx={12} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={4} />
            <rect x={500} y={480} width={60} height={50} rx={12} fill="#f8fafc" />
            <rect x={590} y={430} width={80} height={110} rx={30} fill="#be185d" />
            <circle cx={630} cy={400} r={36} fill="#e8b996" />
            <path d="M 592 392 Q 630 340 668 392 L 668 430 Q 650 400 630 396 Q 610 400 592 430 Z" fill="#5b3416" />
            {beat >= 1 &&
                [0, 1].map((i) => (
                    <motion.circle
                        key={i}
                        cx={618 + i * 24}
                        r={6}
                        fill="#38bdf8"
                        initial={{ cy: 410, opacity: 1 }}
                        animate={{ cy: [410, 470], opacity: [1, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.7 }}
                    />
                ))}
        </g>
    );
}

/** Mannen i stolen, smilende. */
function Han() {
    return (
        <g>
            <rect x={940} y={470} width={140} height={120} rx={18} fill="#7c4a26" />
            <rect x={960} y={420} width={90} height={120} rx={30} fill="#0f766e" />
            <circle cx={1005} cy={390} r={36} fill="#e8b996" />
            <path d="M 970 380 Q 1005 340 1040 380 Q 1005 368 970 380" fill="#3f2a1d" />
            <path d="M 988 400 Q 1005 418 1022 400" stroke="#7c2d12" strokeWidth={5} fill="none" strokeLinecap="round" />
            <rect x={860} y={540} width={50} height={50} fill="#94a3b8" />
        </g>
    );
}

function Hus({ kjellerLys, veggRod }: { kjellerLys: boolean; veggRod: boolean }) {
    return (
        <g>
            <rect width={1600} height={GULV} fill="#1e293b" />
            <rect y={GULV} width={1600} height={900 - GULV} fill="#57411f" />
            {/* Taket */}
            <path d={`M ${VEGG_V - 40} ${TAK} L ${MIDT} 130 L ${VEGG_H + 40} ${TAK} Z`} fill="#8b3a2f" />
            {/* Rommene */}
            <rect x={VEGG_V} y={TAK} width={MIDT - VEGG_V} height={GULV - TAK} fill="#fde68a" />
            <rect x={MIDT} y={TAK} width={VEGG_H - MIDT} height={GULV - TAK} fill="#fef3c7" />
            <motion.rect
                x={VEGG_V}
                y={GULV}
                width={VEGG_H - VEGG_V}
                height={KJELLER - GULV}
                initial={{ fill: '#3f3f46' }}
                animate={{ fill: kjellerLys ? '#78716c' : '#3f3f46' }}
                transition={{ duration: 0.8 }}
            />
            <motion.rect
                x={MIDT - 8}
                y={TAK}
                width={16}
                height={GULV - TAK}
                initial={{ fill: '#57534e' }}
                animate={{ fill: veggRod ? '#dc2626' : '#57534e' }}
                transition={{ duration: 0.6 }}
            />
            <rect x={VEGG_V - 10} y={TAK} width={10} height={KJELLER - TAK} fill="#57534e" />
            <rect x={VEGG_H} y={TAK} width={10} height={KJELLER - TAK} fill="#57534e" />
            <rect x={VEGG_V - 10} y={GULV - 6} width={VEGG_H - VEGG_V + 20} height={12} fill="#57534e" />
            <rect x={VEGG_V - 10} y={KJELLER} width={VEGG_H - VEGG_V + 20} height={12} fill="#57534e" />
        </g>
    );
}

function Oye({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -70 0 Q 0 -60 70 0 Q 0 60 -70 0 Z" fill="#ffffff" stroke="#0f172a" strokeWidth={8} />
            <circle r={24} fill="#0f172a" />
            <circle cx={8} cy={-8} r={7} fill="#ffffff" />
        </g>
    );
}

function Ironi({ beat }: { beat: number }) {
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <Hus kjellerLys={false} veggRod={beat === 2} />
            <Hun beat={beat} />
            <Han />
            <text x={(VEGG_V + MIDT) / 2} y={TAK + 36} textAnchor="middle" fontSize={30} fontWeight={800} fill="#78350f" style={FONT}>
                Soverommet
            </text>
            <text x={(MIDT + VEGG_H) / 2} y={TAK + 36} textAnchor="middle" fontSize={30} fontWeight={800} fill="#78350f" style={FONT}>
                Stuen
            </text>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g key="b0" {...inn} transition={{ duration: 0.5 }}>
                        <Lapp x={40} y={60} b={560} linjer={['Ironi:', 'du vet mer enn', 'personene']} fyll="#f59e0b" tekst="#0f172a" />
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g key="b1" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        <Lapp x={40} y={60} b={340} linjer={['Hun gråter']} fyll="#be185d" />
                        <Lapp x={1220} y={60} b={340} linjer={['Han smiler']} fyll="#0f766e" />
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g key="b2" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        <Lapp x={40} y={60} b={360} linjer={['Vet ikke', 'at han smiler']} fyll="#be185d" />
                        <Lapp x={1200} y={60} b={360} linjer={['Vet ikke', 'at hun gråter']} fyll="#0f766e" />
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g key="b3" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        <Oye x={1360} y={300} s={1.2} />
                        <Lapp x={1190} y={400} b={370} linjer={['Du ser', 'begge rommene']} fyll="#fcd34d" tekst="#0f172a" />
                    </motion.g>
                )}
            </AnimatePresence>
        </svg>
    );
}

/** Kjellerdøra med hengelås. */
function Dor() {
    return (
        <g>
            <rect x={740} y={640} width={120} height={180} rx={6} fill="#57351b" stroke="#2b170a" strokeWidth={6} />
            <rect x={830} y={720} width={16} height={16} rx={3} fill="#facc15" />
            <path d="M 808 760 Q 808 728 830 728 Q 852 728 852 760" stroke="#cbd5e1" strokeWidth={8} fill="none" />
            <rect x={798} y={756} width={64} height={52} rx={8} fill="#94a3b8" />
            <circle cx={830} cy={778} r={7} fill="#1e293b" />
        </g>
    );
}

function Kjeller({ beat }: { beat: number }) {
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <motion.g initial={{ opacity: 1 }} animate={{ opacity: beat >= 1 ? 0.55 : 1 }} transition={{ duration: 0.8 }}>
                <Hus kjellerLys={beat >= 1} veggRod={false} />
            </motion.g>
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.g key="dor" {...inn} transition={{ duration: 0.6 }}>
                        <Dor />
                    </motion.g>
                )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g key="b0" {...inn} transition={{ duration: 0.5 }}>
                        <Lapp x={360} y={40} b={880} linjer={['Kan vi stole på jeg-personen?']} fyll="#ffffff" tekst="#0f172a" str={46} />
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g key="b1" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        <Lapp x={260} y={30} b={1080} linjer={['Jeg måtte låse henne inne i kjelleren.', 'Det var det eneste trygge stedet for henne.']} fyll="#ffffff" tekst="#0f172a" str={40} />
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g key="b2" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        <Lapp x={60} y={640} b={360} linjer={['Beskyttelse?']} fyll="#059669" />
                        <Lapp x={1180} y={640} b={360} linjer={['Fanget?']} fyll="#dc2626" />
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g key="b3" {...inn} transition={{ duration: 0.5, delay: 0.3 }}>
                        <Lapp x={330} y={30} b={940} linjer={['Upålitelig forteller', 'gir et skjevt bilde']} fyll="#fcd34d" tekst="#0f172a" str={46} />
                    </motion.g>
                )}
            </AnimatePresence>
        </svg>
    );
}

export function SynsvinkelHuset({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ironi';
    return (
        <div className="absolute inset-0 bg-slate-900">
            {modus === 'ironi' ? <Ironi beat={beat} /> : <Kjeller beat={beat} />}
        </div>
    );
}
