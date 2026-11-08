import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Madagaskar fra 1860 til 1900 som to spor på en tidslinje: den norske misjonen (fra 1866)
 * og Frankrike, som tar mer og mer makt over øya (protektorat 1885, okkupasjon 1895, koloni
 * 1896). Sporene står til venstre, forklaringene til høyre.
 */

const B = 1600;
const H = 900;
const MISJON = '#0f766e';
const BLA = '#1d4ed8';
const MORK = '#0f172a';

const FRA = 1860;
const TIL = 1900;
const X0 = 90;
const X1 = 960;
const xFor = (aar: number) => X0 + ((aar - FRA) / (TIL - FRA)) * (X1 - X0);

const Y_MISJON = 260;
const Y_FRANKRIKE = 520;
const Y_AKSE = 740;
const HOYDE = 90;

interface Kort {
    tekst: string;
    farge?: string;
}

const KORT: Kort[][] = [
    [{ tekst: 'Europeiske stormakter' }, { tekst: 'kjemper om øya', farge: BLA }],
    [
        { tekst: '1885' },
        { tekst: 'Fransk protektorat', farge: BLA },
        { tekst: 'Frankrike holder oppsyn og bestemmer mye' },
    ],
    [{ tekst: '1895' }, { tekst: 'Frankrike okkuperer øya', farge: BLA }],
    [{ tekst: '1896' }, { tekst: 'Fransk koloni', farge: BLA }],
];

export function MisjonTidslinje({ beat }: VisualProps) {
    const kort = KORT[Math.min(beat, KORT.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <pattern
                        id="misjon-striper"
                        width={22}
                        height={22}
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <rect width={22} height={22} fill="#dbeafe" />
                        <rect width={10} height={22} fill={BLA} opacity={0.55} />
                    </pattern>
                </defs>

                <text x={X0} y={110} fontSize={44} fontWeight={900} fill={MORK} letterSpacing={2}>
                    MADAGASKAR
                </text>

                {/* Spor 1: misjonen */}
                <text x={X0} y={Y_MISJON - 20} fontSize={34} fontWeight={900} fill={MISJON}>
                    Den norske misjonen
                </text>
                <rect x={X0} y={Y_MISJON} width={X1 - X0} height={HOYDE} rx={16} fill="#e2e8f0" />
                <rect
                    x={xFor(1866)}
                    y={Y_MISJON}
                    width={X1 - xFor(1866)}
                    height={HOYDE}
                    rx={16}
                    fill={MISJON}
                />
                <text
                    x={xFor(1866) + 24}
                    y={Y_MISJON + 60}
                    fontSize={36}
                    fontWeight={800}
                    fill="#ffffff"
                >
                    Fra 1866: kirker, skoler, helse
                </text>

                {/* Spor 2: Frankrike */}
                <text
                    x={X0}
                    y={Y_FRANKRIKE - 20}
                    fontSize={34}
                    fontWeight={900}
                    fill={beat === 0 ? '#475569' : BLA}
                >
                    {beat === 0 ? 'Europeiske stormakter' : 'Frankrike'}
                </text>
                <rect
                    x={X0}
                    y={Y_FRANKRIKE}
                    width={X1 - X0}
                    height={HOYDE}
                    rx={16}
                    fill="#e2e8f0"
                />

                {/* Beat 0: stormakter som trekker i øya, før 1885 */}
                <motion.g
                    animate={{ opacity: beat === 0 ? 1 : 0.35 }}
                    transition={{ duration: 0.8 }}
                >
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.path
                            key={i}
                            d={`M ${xFor(1868 + i * 3.4)} ${Y_FRANKRIKE + HOYDE / 2 + (i % 2 ? 22 : -22)} l 44 0 m -14 -14 l 14 14 l -14 14`}
                            stroke="#64748b"
                            strokeWidth={7}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.35 }}
                        />
                    ))}
                </motion.g>

                {/* 1885-1895: protektorat (stripet) */}
                <motion.rect
                    x={xFor(1885)}
                    y={Y_FRANKRIKE}
                    height={HOYDE}
                    fill="url(#misjon-striper)"
                    initial={{ width: 0 }}
                    animate={{ width: beat >= 1 ? xFor(1895) - xFor(1885) : 0 }}
                    transition={{ duration: 1.4, delay: beat === 1 ? 0.6 : 0 }}
                />
                {/* 1895-1900: okkupert, så koloni (helt blått) */}
                <motion.rect
                    x={xFor(1895)}
                    y={Y_FRANKRIKE}
                    height={HOYDE}
                    rx={16}
                    fill={BLA}
                    initial={{ width: 0 }}
                    animate={{ width: beat >= 2 ? X1 - xFor(1895) : 0 }}
                    transition={{ duration: 1, delay: beat === 2 ? 0.6 : 0 }}
                />

                {/* Soldatsymbol ved 1895 */}
                <AnimatePresence>
                    {beat >= 2 && (
                        <motion.g
                            key="soldat"
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 1.2, type: 'spring' }}
                        >
                            <g transform={`translate(${xFor(1895) + 10} ${Y_FRANKRIKE - 90})`}>
                                <circle r={44} fill="#ffffff" stroke={BLA} strokeWidth={6} />
                                <path d="M -18 -8 L 0 -26 L 18 -8 V 4 H -18 Z" fill={BLA} />
                                <circle cy={14} r={10} fill={BLA} />
                                <rect x={20} y={-30} width={6} height={56} fill={BLA} />
                            </g>
                        </motion.g>
                    )}
                </AnimatePresence>

                {beat >= 3 && (
                    <motion.text
                        x={X0}
                        y={Y_FRANKRIKE + HOYDE + 70}
                        fontSize={36}
                        fontWeight={900}
                        fill={BLA}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        Fransk koloni fra 1896
                    </motion.text>
                )}

                {/* Tidsaksen */}
                <line x1={X0} y1={Y_AKSE} x2={X1} y2={Y_AKSE} stroke="#475569" strokeWidth={5} />
                {[1860, 1870, 1880, 1890, 1900].map((a) => (
                    <g key={a}>
                        <line
                            x1={xFor(a)}
                            y1={Y_AKSE - 12}
                            x2={xFor(a)}
                            y2={Y_AKSE + 12}
                            stroke="#475569"
                            strokeWidth={4}
                        />
                        <text
                            x={xFor(a)}
                            y={Y_AKSE + 52}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#64748b"
                        >
                            {a}
                        </text>
                    </g>
                ))}
                {[
                    { aar: 1885, fra: 1 },
                    { aar: 1895, fra: 2 },
                    { aar: 1896, fra: 3 },
                ].map(
                    (m) =>
                        beat >= m.fra && (
                            <motion.g
                                key={m.aar}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <line
                                    x1={xFor(m.aar)}
                                    y1={Y_FRANKRIKE + HOYDE}
                                    x2={xFor(m.aar)}
                                    y2={Y_AKSE}
                                    stroke={BLA}
                                    strokeWidth={4}
                                />
                                <circle
                                    cx={xFor(m.aar)}
                                    cy={Y_AKSE}
                                    r={13}
                                    fill={BLA}
                                    stroke="#ffffff"
                                    strokeWidth={4}
                                />
                                <text
                                    x={xFor(m.aar)}
                                    y={
                                        m.aar === 1896
                                            ? Y_AKSE + 110
                                            : Y_AKSE + 52 + (m.aar === 1885 ? 48 : 0)
                                    }
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={900}
                                    fill={BLA}
                                    stroke="#ffffff"
                                    strokeWidth={8}
                                    paintOrder="stroke"
                                >
                                    {m.aar}
                                </text>
                            </motion.g>
                        )
                )}
            </svg>

            <div className="absolute right-[3%] top-0 bottom-0 w-[36%] flex flex-col justify-center gap-4">
                <AnimatePresence mode="popLayout">
                    {kort.map((k, i) => (
                        <motion.div
                            key={`${beat}-${k.tekst}`}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{
                                delay: i * 0.5,
                                type: 'spring',
                                stiffness: 160,
                                damping: 20,
                            }}
                            className={
                                i === 0 && !k.farge
                                    ? 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-3xl md:text-4xl shadow-xl'
                                    : 'px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-2xl shadow-xl border-l-[10px]'
                            }
                            style={{ borderColor: k.farge ?? '#cbd5e1' }}
                        >
                            {k.tekst}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
