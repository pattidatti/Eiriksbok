import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Nansens liv fram til Folkeforbundet, som en tidslinje. Hver beat legger til ett kort:
 * Kristiania, Grønland og Fram, krigen (utforskningen stopper), Washington og
 * Folkeforbundet. Linja er brutt mellom 1890 og 1912, så krigsårene får plass.
 */

const B = 1600;
const H = 900;
const AKSE_Y = 640;

/** År til x. Linja er brutt: 1860-1890 til venstre, 1912-1922 til høyre. */
function xFor(ar: number) {
    if (ar <= 1890) return 120 + (ar - 1860) * 18.67;
    return 820 + (ar - 1912) * 64;
}

const OVERSKRIFTER = [
    'Født 1861',
    '1888: på ski over Grønland',
    '1914: krig i Europa',
    'Washington 1917-1918',
    'Folkeforbundet',
];

/** Hvor Nansen-merket står på linja for hver beat. */
const MERKE_AR = [1861, 1888, 1914, 1917.5, 1920];

export function NansenLivslinje({ beat }: VisualProps) {
    const overskrift = OVERSKRIFTER[Math.min(beat, OVERSKRIFTER.length - 1)];
    const merkeX = xFor(MERKE_AR[Math.min(beat, MERKE_AR.length - 1)]);
    const utforskningStopper = beat >= 2;
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#f3ecdc]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Krigsårene */}
                {beat >= 2 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <rect
                            x={xFor(1914)}
                            y={AKSE_Y - 22}
                            width={xFor(1918) - xFor(1914)}
                            height={44}
                            rx={8}
                            fill="#dc2626"
                            opacity={0.85}
                        />
                        <text
                            x={(xFor(1914) + xFor(1918)) / 2}
                            y={AKSE_Y + 120}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#991b1b"
                        >
                            Første verdenskrig
                        </text>
                    </motion.g>
                )}

                {/* Selve linja, brutt på midten */}
                <line
                    x1={90}
                    y1={AKSE_Y}
                    x2={700}
                    y2={AKSE_Y}
                    stroke="#475569"
                    strokeWidth={8}
                    strokeLinecap="round"
                />
                <path
                    d={`M 712 ${AKSE_Y + 18} L 728 ${AKSE_Y - 18} M 742 ${AKSE_Y + 18} L 758 ${AKSE_Y - 18}`}
                    stroke="#475569"
                    strokeWidth={6}
                    strokeLinecap="round"
                />
                <line
                    x1={770}
                    y1={AKSE_Y}
                    x2={1500}
                    y2={AKSE_Y}
                    stroke="#475569"
                    strokeWidth={8}
                    strokeLinecap="round"
                />

                {/* Årstall under linja */}
                <Ar x={xFor(1861)} tekst="1861" vis />
                <Ar x={xFor(1888)} tekst="1888" vis={beat >= 1} />
                <Ar x={xFor(1914)} tekst="1914" vis={beat >= 2} />
                <Ar x={(xFor(1917) + xFor(1918)) / 2} tekst="1917-1918" vis={beat >= 3} />
                <Ar x={xFor(1920)} tekst="1920" vis={beat >= 4} />

                {/* Kortene */}
                <Kort
                    cx={215}
                    arX={xFor(1861)}
                    tittel="Kristiania"
                    undertittel="i dag Oslo"
                    vis
                    dempet={beat >= 1}
                >
                    <Hus />
                </Kort>
                <Kort
                    cx={640}
                    arX={xFor(1888)}
                    tittel="Grønland på ski"
                    undertittel="senere: skuta Fram"
                    vis={beat >= 1}
                    dempet={utforskningStopper}
                >
                    <Skilöper />
                    <Fram />
                </Kort>
                {utforskningStopper && (
                    <motion.g
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring' }}
                        style={{ originX: '640px', originY: '180px' }}
                    >
                        <rect x={460} y={150} width={400} height={64} rx={32} fill="#991b1b" />
                        <rect x={482} y={166} width={10} height={32} rx={3} fill="#fff" />
                        <rect x={500} y={166} width={10} height={32} rx={3} fill="#fff" />
                        <text
                            x={524}
                            y={194}
                            textAnchor="start"
                            fontSize={30}
                            fontWeight={800}
                            fill="#fff"
                        >
                            Utforskning stopper
                        </text>
                    </motion.g>
                )}
                <Kort
                    cx={1060}
                    arX={(xFor(1917) + xFor(1918)) / 2}
                    tittel="Washington"
                    undertittel="avtale om mat"
                    vis={beat >= 3}
                    dempet={beat >= 4}
                >
                    <Sekk />
                </Kort>
                <Kort
                    cx={1410}
                    arX={xFor(1920)}
                    tittel="Folkeforbundet"
                    undertittel="Norges utsending"
                    vis={beat >= 4}
                >
                    <Bygning />
                </Kort>

                {/* Nansen-merket som går langs linja */}
                <motion.g
                    initial={false}
                    animate={{ x: merkeX }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                >
                    <circle
                        cx={0}
                        cy={AKSE_Y}
                        r={20}
                        fill="#1d4ed8"
                        stroke="#fff"
                        strokeWidth={6}
                    />
                </motion.g>
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] inset-x-0 flex justify-center"
                >
                    <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Ar({ x, tekst, vis }: { x: number; tekst: string; vis: boolean }) {
    if (!vis) return null;
    return (
        <motion.text
            x={x}
            y={AKSE_Y + 64}
            textAnchor="middle"
            fontSize={32}
            fontWeight={800}
            fill="#1e293b"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {tekst}
        </motion.text>
    );
}

const KORT_B = 330;
const KORT_TOPP = 225;
const KORT_H = 350;

function Kort({
    cx,
    arX,
    tittel,
    undertittel,
    vis,
    dempet = false,
    children,
}: {
    cx: number;
    arX: number;
    tittel: string;
    undertittel: string;
    vis: boolean;
    dempet?: boolean;
    children: ReactNode;
}) {
    if (!vis) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: dempet ? 0.5 : 1 }}
            transition={{ duration: 0.8 }}
        >
            <line
                x1={cx}
                y1={KORT_TOPP + KORT_H}
                x2={arX}
                y2={AKSE_Y - 24}
                stroke="#64748b"
                strokeWidth={4}
                strokeDasharray="6 8"
            />
            <rect
                x={cx - KORT_B / 2}
                y={KORT_TOPP}
                width={KORT_B}
                height={KORT_H}
                rx={18}
                fill="#fffdf7"
                stroke={dempet ? '#94a3b8' : '#1e3a8a'}
                strokeWidth={5}
            />
            <g transform={`translate(${cx} ${KORT_TOPP + 110}) scale(1.2)`}>{children}</g>
            <text
                x={cx}
                y={KORT_TOPP + 262}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#0f172a"
            >
                {tittel}
            </text>
            <text
                x={cx}
                y={KORT_TOPP + 306}
                textAnchor="middle"
                fontSize={28}
                fontWeight={700}
                fill="#475569"
            >
                {undertittel}
            </text>
        </motion.g>
    );
}

/* Små tegninger, sentrert rundt (0, 0), omtrent 200 x 140. */

function Hus() {
    return (
        <g>
            <rect x={-60} y={-20} width={120} height={80} fill="#b45309" />
            <path d="M -80 -16 L 0 -76 L 80 -16 Z" fill="#7c2d12" />
            <rect x={-14} y={20} width={28} height={40} fill="#451a03" />
            <rect x={-46} y={0} width={24} height={22} fill="#fde68a" />
            <rect x={22} y={0} width={24} height={22} fill="#fde68a" />
        </g>
    );
}

function Skilöper() {
    return (
        <g transform="translate(-50 0)">
            <path d="M -60 60 Q 0 20 60 60 Z" fill="#e0f2fe" stroke="#93c5fd" strokeWidth={3} />
            <circle cx={0} cy={-38} r={11} fill="#1e293b" />
            <line
                x1={0}
                y1={-26}
                x2={-4}
                y2={8}
                stroke="#1e293b"
                strokeWidth={8}
                strokeLinecap="round"
            />
            <line
                x1={-4}
                y1={8}
                x2={-18}
                y2={34}
                stroke="#1e293b"
                strokeWidth={7}
                strokeLinecap="round"
            />
            <line
                x1={-4}
                y1={8}
                x2={14}
                y2={34}
                stroke="#1e293b"
                strokeWidth={7}
                strokeLinecap="round"
            />
            <line
                x1={-36}
                y1={38}
                x2={16}
                y2={34}
                stroke="#b45309"
                strokeWidth={5}
                strokeLinecap="round"
            />
            <line
                x1={-6}
                y1={40}
                x2={40}
                y2={36}
                stroke="#b45309"
                strokeWidth={5}
                strokeLinecap="round"
            />
            <line x1={-2} y1={-16} x2={-30} y2={30} stroke="#475569" strokeWidth={3} />
        </g>
    );
}

function Fram() {
    return (
        <g transform="translate(60 6)">
            <path d="M -50 20 L 50 20 L 38 46 L -40 46 Z" fill="#1f2937" />
            <line x1={-24} y1={20} x2={-24} y2={-46} stroke="#78350f" strokeWidth={5} />
            <line x1={4} y1={20} x2={4} y2={-58} stroke="#78350f" strokeWidth={5} />
            <line x1={30} y1={20} x2={30} y2={-40} stroke="#78350f" strokeWidth={5} />
            <rect x={-56} y={46} width={112} height={10} rx={4} fill="#bae6fd" />
        </g>
    );
}

function Sekk() {
    return (
        <g>
            <path
                d="M -50 -40 Q -64 50 -40 60 L 40 60 Q 64 50 50 -40 Z"
                fill="#d6b588"
                stroke="#92400e"
                strokeWidth={4}
            />
            <path
                d="M -50 -40 L -30 -62 L 30 -62 L 50 -40"
                fill="#c4a374"
                stroke="#92400e"
                strokeWidth={4}
            />
            <text y={20} textAnchor="middle" fontSize={34} fontWeight={900} fill="#78350f">
                MAT
            </text>
        </g>
    );
}

function Bygning() {
    return (
        <g>
            <path d="M -86 -30 L 0 -74 L 86 -30 Z" fill="#1e3a8a" />
            <rect x={-80} y={-30} width={160} height={14} fill="#1e40af" />
            {[-60, -30, 0, 30, 60].map((x) => (
                <rect
                    key={x}
                    x={x - 7}
                    y={-16}
                    width={14}
                    height={62}
                    fill="#dbeafe"
                    stroke="#1e3a8a"
                    strokeWidth={2}
                />
            ))}
            <rect x={-90} y={46} width={180} height={14} fill="#1e3a8a" />
        </g>
    );
}
