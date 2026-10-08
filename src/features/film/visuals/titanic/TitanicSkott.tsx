import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Skroget sett fra siden med de 16 rommene. Viser hvorfor fire fulle rom gikk bra,
 * og hvorfor seks ikke gjorde det: vannet rant over toppen av veggene.
 * Lokale koordinater: dekket er y = 0, kjølen y = 230, baugen til høyre.
 */

const BAUG = 1420;
const AKTER = 210;
const ROM = 16;
const BREDDE_ROM = (BAUG - AKTER) / ROM;
const KJOL = 230;
const VEGGTOPP = 62;
const VANNLINJE = 150;
const HAV_Y = 560;

/** Venstre kant av rom nr. n (1 = fremst i baugen). */
const romX = (n: number) => BAUG - n * BREDDE_ROM;

interface Tilstand {
    vinkel: number;
    synk: number;
    /** Fyllingsgrad per rom (indeks 0 = rom 1). */
    fyll: (n: number) => number;
    /** Forsinkelse før rommet fylles, i sekunder. */
    forsinkelse: (n: number) => number;
}

function tilstand(beat: number): Tilstand {
    switch (beat) {
        case 2:
            return {
                vinkel: 1.2,
                synk: 8,
                fyll: (n) => (n <= 4 ? 0.85 : 0),
                forsinkelse: (n) => (n - 1) * 0.35,
            };
        case 4:
            return {
                vinkel: 2.8,
                synk: 22,
                fyll: (n) => (n <= 6 ? 0.9 : 0),
                forsinkelse: (n) => 0.6 + (n - 1) * 0.3,
            };
        case 5:
            return {
                vinkel: 8,
                synk: 70,
                fyll: (n) => (n <= 6 ? 1 : n <= 13 ? 1 : 0),
                forsinkelse: (n) => (n <= 6 ? 0 : 0.8 + (n - 7) * 0.9),
            };
        default:
            return { vinkel: 0, synk: 0, fyll: () => 0, forsinkelse: () => 0 };
    }
}

const SKROG = `M 150 0 L 1470 -18 Q 1452 120 1420 ${KJOL} L 215 ${KJOL} Q 140 200 118 120 Q 110 40 150 0 Z`;

export function TitanicSkott({ beat }: VisualProps) {
    const t = tilstand(beat);
    const visVegger = beat >= 1;
    const etikett =
        beat === 0
            ? 'Hvordan var skipet bygd?'
            : beat === 1
              ? '16 rom med vanntette vegger'
              : beat === 2
                ? '4 fulle rom: skipet flyter'
                : beat === 3
                  ? 'Veggene gikk ikke helt opp'
                  : beat === 4
                    ? 'Hull i 6 rom'
                    : 'Vannet renner over, rom etter rom';
    const farge =
        beat === 2
            ? 'bg-teal-600'
            : beat >= 4
              ? 'bg-red-600'
              : beat === 3
                ? 'bg-amber-400 text-slate-900'
                : 'bg-slate-900';

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-sky-50 to-sky-100">
            <div className="absolute top-[7%] inset-x-0 flex justify-center z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={etikett}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-6 py-2 rounded-2xl text-white text-2xl md:text-4xl font-black shadow-lg ${farge}`}
                    >
                        {etikett}
                    </motion.div>
                </AnimatePresence>
            </div>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <clipPath id="skott-skrog">
                        <path d={SKROG} />
                    </clipPath>
                    <linearGradient id="skott-hav" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#1d6fa5" stopOpacity="0.55" />
                        <stop offset="1" stopColor="#0b3557" stopOpacity="0.85" />
                    </linearGradient>
                </defs>

                <motion.g
                    initial={false}
                    animate={{ y: HAV_Y - VANNLINJE + t.synk, rotate: t.vinkel }}
                    transition={{ duration: beat === 5 ? 9 : 2.5, ease: 'easeInOut' }}
                    style={{ originX: '300px', originY: '150px' }}
                >
                    {/* Overbygg og skorsteiner */}
                    <rect
                        x={360}
                        y={-62}
                        width={800}
                        height={62}
                        fill="#f8fafc"
                        stroke="#94a3b8"
                        strokeWidth={2}
                    />
                    {[1010, 860, 710, 560].map((x) => (
                        <g key={x} transform={`translate(${x} -62) skewX(-8)`}>
                            <rect x={-26} y={-120} width={52} height={120} fill="#c98a3b" />
                            <rect x={-26} y={-120} width={52} height={24} fill="#111" />
                        </g>
                    ))}
                    <path d={SKROG} fill="#1f2937" />
                    <g clipPath="url(#skott-skrog)">
                        <rect x={0} y={VANNLINJE} width={1600} height={200} fill="#7f1d1d" />
                        <rect x={0} y={0} width={1600} height={VANNLINJE} fill="#1f2937" />
                        {/* Innsiden av rommene blir lysere når veggene vises, så vi ser inn */}
                        <motion.rect
                            x={AKTER}
                            y={VEGGTOPP}
                            width={BAUG - AKTER}
                            height={KJOL - VEGGTOPP}
                            fill="#e2e8f0"
                            initial={false}
                            animate={{ opacity: visVegger ? 1 : 0 }}
                            transition={{ duration: 0.8 }}
                        />
                        {/* Vann i rommene */}
                        {Array.from({ length: ROM }, (_, i) => {
                            const n = i + 1;
                            const h = t.fyll(n) * (KJOL - VEGGTOPP);
                            return (
                                <motion.rect
                                    key={n}
                                    x={romX(n)}
                                    width={BREDDE_ROM}
                                    fill="#2563eb"
                                    fillOpacity={0.85}
                                    initial={false}
                                    animate={{ y: KJOL - h, height: h }}
                                    transition={{
                                        duration: h > 0 ? 1.4 : 0.6,
                                        delay: h > 0 ? t.forsinkelse(n) : 0,
                                        ease: 'easeOut',
                                    }}
                                />
                            );
                        })}
                        {/* Veggene */}
                        {Array.from({ length: ROM - 1 }, (_, i) => {
                            const x = romX(i + 1);
                            return (
                                <motion.line
                                    key={i}
                                    x1={x}
                                    x2={x}
                                    y1={KJOL}
                                    y2={VEGGTOPP}
                                    stroke="#334155"
                                    strokeWidth={5}
                                    initial={false}
                                    animate={{
                                        pathLength: visVegger ? 1 : 0,
                                        opacity: visVegger ? 1 : 0,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        delay: visVegger ? 0.1 + i * 0.08 : 0,
                                    }}
                                />
                            );
                        })}
                        <motion.line
                            x1={AKTER}
                            x2={BAUG}
                            y1={VEGGTOPP}
                            y2={VEGGTOPP}
                            stroke="#334155"
                            strokeWidth={2}
                            strokeDasharray="6 6"
                            initial={false}
                            animate={{ opacity: visVegger ? 0.5 : 0 }}
                        />
                    </g>
                    {/* Romnummer */}
                    {visVegger &&
                        Array.from({ length: ROM }, (_, i) => (
                            <motion.text
                                key={i}
                                x={romX(i + 1) + BREDDE_ROM / 2}
                                y={205}
                                textAnchor="middle"
                                fontSize={24}
                                fontWeight={800}
                                fill={t.fyll(i + 1) > 0 ? '#ffffff' : '#475569'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + i * 0.08 }}
                            >
                                {i + 1}
                            </motion.text>
                        ))}
                    {/* Glippen over veggene */}
                    {beat >= 3 &&
                        Array.from({ length: ROM - 1 }, (_, i) => (
                            <motion.circle
                                key={i}
                                cx={romX(i + 1)}
                                cy={VEGGTOPP - 30}
                                r={14}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth={5}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: beat === 3 ? [0.4, 1, 0.4] : 0.35, scale: 1 }}
                                transition={{
                                    duration: 1.4,
                                    repeat: beat === 3 ? Infinity : 0,
                                    delay: i * 0.05,
                                }}
                            />
                        ))}
                    {/* Vann som renner over veggtoppen */}
                    {beat === 5 &&
                        Array.from({ length: 7 }, (_, i) => {
                            const x = romX(i + 6);
                            return (
                                <motion.path
                                    key={i}
                                    d={`M ${x + 22} ${VEGGTOPP + 8} Q ${x + 4} ${VEGGTOPP - 30} ${x - 24} ${VEGGTOPP + 20}`}
                                    fill="none"
                                    stroke="#38bdf8"
                                    strokeWidth={7}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                                    transition={{ duration: 1.3, delay: 0.5 + i * 0.9, repeat: 1 }}
                                />
                            );
                        })}
                    {/* Hull etter isfjellet */}
                    {beat >= 4 &&
                        Array.from({ length: 6 }, (_, i) => {
                            const x = romX(i + 1) + 10;
                            return (
                                <motion.path
                                    key={i}
                                    d={`M ${x} 168 l 12 -6 l 10 8 l 12 -7 l 10 6 l 12 -5`}
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth={6}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3, delay: i * 0.12 }}
                                />
                            );
                        })}
                </motion.g>

                {/* Havet ligger over skroget, så det som er under vann ser nedsenket ut */}
                <rect x={0} y={HAV_Y} width={1600} height={900 - HAV_Y} fill="url(#skott-hav)" />
                <line x1={0} x2={1600} y1={HAV_Y} y2={HAV_Y} stroke="#0b3557" strokeWidth={3} />

                {/* Isbitform-sammenligningen */}
                {beat === 5 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <rect
                            x={1180}
                            y={720}
                            width={340}
                            height={130}
                            rx={16}
                            fill="#ffffff"
                            opacity={0.92}
                        />
                        <text
                            x={1350}
                            y={752}
                            textAnchor="middle"
                            fontSize={22}
                            fontWeight={800}
                            fill="#334155"
                        >
                            Som en isbitform du vipper
                        </text>
                        <motion.g
                            animate={{ rotate: [0, 10, 10] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.6 }}
                            style={{ originX: '1240px', originY: '810px' }}
                        >
                            {Array.from({ length: 5 }, (_, i) => (
                                <g key={i}>
                                    <rect
                                        x={1240 + i * 46}
                                        y={780}
                                        width={42}
                                        height={40}
                                        fill="none"
                                        stroke="#475569"
                                        strokeWidth={3}
                                    />
                                    <rect
                                        x={1242 + i * 46}
                                        y={800}
                                        width={38}
                                        height={18}
                                        fill="#60a5fa"
                                    />
                                </g>
                            ))}
                        </motion.g>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
