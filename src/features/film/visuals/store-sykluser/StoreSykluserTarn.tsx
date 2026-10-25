import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Makttårnet. «leder»: grunnmuren en sterk leder legger. «faktorer»: Dalios åtte mål
 * bygges som etasjer, med utdanning nederst. «kjede»: kjeden fra utdanning til handel,
 * og pengene som går tilbake. «topp»: tårnet på toppen, så gjeld, bobler og kopier.
 */

type Modus = 'leder' | 'faktorer' | 'kjede' | 'topp';

const B = 1600;
const H = 900;

const ETASJER = [
    { navn: 'Utdanning', farge: '#2563eb' },
    { navn: 'Ny teknologi', farge: '#0891b2' },
    { navn: 'Konkurransekraft', farge: '#0d9488' },
    { navn: 'Produksjon', farge: '#16a34a' },
    { navn: 'Handel med verden', farge: '#65a30d' },
    { navn: 'Militær styrke', farge: '#b45309' },
    { navn: 'Pengesentre', farge: '#c2410c' },
    { navn: 'Verdens valuta', farge: '#b91c1c' },
];

const BUNN = 850;
const ETASJE_H = 76;
const GLIPE = 6;
const TARN_B = 560;
const TARN_X = (B - TARN_B) / 2;

function etasjeY(i: number) {
    return BUNN - (i + 1) * (ETASJE_H + GLIPE);
}

const OVERSKRIFT: Record<Modus, string[]> = {
    leder: ['En sterk leder', 'Makten samles', 'Et land som fungerer', 'Fredelig etterfølger'],
    faktorer: ['Åtte mål på makt', 'Grunnmuren: utdanning', 'Etasje på etasje', 'Toppen av tårnet'],
    kjede: ['Kjeden starter', 'Bedre og billigere', 'Hele verden kjøper', 'Pengene går tilbake'],
    topp: ['På toppen', 'Syklusen snur', 'Lån og gjeld', 'Bobler', 'Andre land kopierer'],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
            >
                {tekst}
            </motion.div>
        </AnimatePresence>
    );
}

/** En krone tegnet med en polygon, med midten nederst i (x, y). */
function Krone({ x, y, s, farge }: { x: number; y: number; s: number; farge: string }) {
    const p = [
        [-1, 0],
        [-1, -0.9],
        [-0.5, -0.4],
        [0, -1.1],
        [0.5, -0.4],
        [1, -0.9],
        [1, 0],
    ]
        .map(([a, b]) => `${x + a * s},${y + b * s}`)
        .join(' ');
    return <polygon points={p} fill={farge} stroke="#78350f" strokeWidth={6} strokeLinejoin="round" />;
}

function Etasje({ i, fylt, glod, forsinkelse = 0 }: { i: number; fylt: boolean; glod?: boolean; forsinkelse?: number }) {
    const e = ETASJER[i];
    const y = etasjeY(i);
    return (
        <g>
            <rect x={TARN_X} y={y} width={TARN_B} height={ETASJE_H} rx={10} fill="none" stroke="#94a3b8" strokeWidth={3} strokeDasharray="10 10" />
            {fylt && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.6 }}>
                    <rect x={TARN_X} y={y} width={TARN_B} height={ETASJE_H} rx={10} fill={e.farge} stroke={glod ? '#facc15' : '#fff'} strokeWidth={glod ? 6 : 3} />
                    <text x={B / 2} y={y + ETASJE_H / 2 + 13} textAnchor="middle" fontSize={38} fontWeight={800} fill="#fff">
                        {e.navn}
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Leder({ beat }: { beat: number }) {
    const steiner = ['Lav skatt', 'Frihet', 'Eiendomsrett', 'God skole'];
    return (
        <>
            <line x1={120} y1={BUNN + 10} x2={B - 120} y2={BUNN + 10} stroke="#64748b" strokeWidth={6} />
            {/* Lederen: en krone over en sokkel */}
            <motion.g initial={false} animate={{ opacity: 1 }}>
                <rect x={B / 2 - 70} y={beat >= 2 ? 420 : 470} width={140} height={beat >= 2 ? 100 : 160} rx={14} fill="#1e293b" />
                <Krone x={B / 2} y={beat >= 2 ? 410 : 460} s={beat >= 1 ? 110 : 80} farge="#facc15" />
            </motion.g>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    {[-1, 1].map((side) => (
                        <g key={side}>
                            {[0, 1, 2].map((k) => (
                                <circle key={k} cx={B / 2 + side * (300 + k * 90)} cy={600 + (k % 2) * 40} r={30} fill="#16a34a" />
                            ))}
                        </g>
                    ))}
                    <text x={B / 2} y={760} textAnchor="middle" fontSize={44} fontWeight={800} fill="#166534">
                        populær hos folket
                    </text>
                </motion.g>
            )}
            {beat === 1 && (
                <>
                    {[-1, 1].map((side) => (
                        <g key={side}>
                            <motion.circle
                                cx={B / 2 + side * 420}
                                cy={560}
                                initial={{ r: 60, opacity: 1 }}
                                animate={{ r: 22, opacity: 0.4 }}
                                transition={{ duration: 2.5, delay: 0.5 }}
                                fill="#94a3b8"
                            />
                            <motion.line
                                x1={B / 2 + side * 340}
                                y1={560}
                                x2={B / 2 + side * 120}
                                y2={480}
                                stroke="#b45309"
                                strokeWidth={10}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2 }}
                            />
                        </g>
                    ))}
                    <motion.text x={B / 2} y={700} textAnchor="middle" fontSize={44} fontWeight={800} fill="#334155" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                        motstanderne blir svakere
                    </motion.text>
                </>
            )}
            {beat >= 2 &&
                steiner.map((s, i) => {
                    const bredde = 300;
                    const x = 160 + i * (bredde + 26);
                    return (
                        <motion.g key={s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: beat === 2 ? 0.6 + i * 0.9 : 0 }}>
                            <rect x={x} y={BUNN - 210} width={bredde} height={200} rx={14} fill="#e2e8f0" stroke="#64748b" strokeWidth={5} />
                            <text x={x + bredde / 2} y={BUNN - 95} textAnchor="middle" fontSize={40} fontWeight={800} fill="#1e293b">
                                {s}
                            </text>
                        </motion.g>
                    );
                })}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <path d={`M ${B / 2 + 130} 360 Q ${B / 2 + 300} 230 ${B / 2 + 460} 340`} fill="none" stroke="#0d9488" strokeWidth={10} strokeLinecap="round" />
                    <polygon points={`${B / 2 + 470},${350} ${B / 2 + 430},${310} ${B / 2 + 480},${300}`} fill="#0d9488" />
                    <Krone x={B / 2 + 560} y={410} s={80} farge="#fde68a" />
                    <text x={B / 2 + 560} y={470} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f766e">
                        neste leder
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Faktorer({ beat }: { beat: number }) {
    const fylt = (i: number) => (i === 0 ? beat >= 1 : i <= 4 ? beat >= 2 : beat >= 3);
    const forsinkelse = (i: number) => (beat === 2 && i >= 1 && i <= 4 ? (i - 1) * 0.9 : beat === 3 && i >= 5 ? (i - 5) * 1.1 : 0.3);
    return (
        <>
            {ETASJER.map((_, i) => (
                <Etasje key={i} i={i} fylt={fylt(i)} forsinkelse={forsinkelse(i)} />
            ))}
            <AnimatePresence>
                {beat === 0 && (
                    <motion.text key="8" x={TARN_X + TARN_B + 200} y={600} textAnchor="middle" fontSize={260} fontWeight={900} fill="#0f172a" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        8
                    </motion.text>
                )}
            </AnimatePresence>
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    <text x={TARN_X + TARN_B + 40} y={etasjeY(0) + 50} fontSize={36} fontWeight={800} fill="#1d4ed8">
                        ← stiger først
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.6 }}>
                    <text x={TARN_X - 40} y={etasjeY(6) + 50} textAnchor="end" fontSize={34} fontWeight={800} fill="#c2410c">
                        London, New York →
                    </text>
                </motion.g>
            )}
        </>
    );
}

const LEDD = ['Utdanning', 'Nye ideer', 'Bedre og billigere', 'Mer produksjon', 'Handel med verden'];
const LINJER = [['Utdanning'], ['Nye ideer'], ['Bedre og', 'billigere'], ['Mer', 'produksjon'], ['Handel med', 'verden']];

function Kjede({ beat }: { beat: number }) {
    const lys = (i: number) => (beat === 0 ? i <= 1 : beat === 1 ? i <= 2 : true);
    const cx = (i: number) => 200 + i * 300;
    const cy = 420;
    return (
        <>
            {LEDD.map((navn, i) => (
                <g key={navn}>
                    {i > 0 && (
                        <motion.line
                            x1={cx(i - 1) + 110}
                            y1={cy}
                            x2={cx(i) - 110}
                            y2={cy}
                            stroke={lys(i) ? '#0f172a' : '#cbd5e1'}
                            strokeWidth={10}
                            initial={false}
                            animate={{ stroke: lys(i) ? '#0f172a' : '#cbd5e1' }}
                        />
                    )}
                    <motion.circle
                        cx={cx(i)}
                        cy={cy}
                        r={105}
                        initial={false}
                        animate={{ fill: lys(i) ? ETASJER[i].farge : '#e2e8f0' }}
                        transition={{ duration: 0.8, delay: lys(i) && beat === Math.max(0, i - 1) ? 0.6 + (i % 2) * 1.4 : 0 }}
                        stroke="#fff"
                        strokeWidth={6}
                    />
                    {LINJER[i].map((linje, k) => (
                        <text
                            key={k}
                            x={cx(i)}
                            y={cy + 12 + (k - (LINJER[i].length - 1) / 2) * 36}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={800}
                            fill={lys(i) ? '#fff' : '#64748b'}
                        >
                            {linje}
                        </text>
                    ))}
                </g>
            ))}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                    <text x={cx(4)} y={cy - 150} textAnchor="middle" fontSize={34} fontWeight={800} fill="#3f6212">
                        selger til hele verden
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <>
                    <motion.path
                        d={`M ${cx(4)} ${cy + 110} C ${cx(4)} ${cy + 330}, ${cx(0)} ${cy + 330}, ${cx(0)} ${cy + 120}`}
                        fill="none"
                        stroke="#ca8a04"
                        strokeWidth={12}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2 }}
                    />
                    <motion.polygon
                        points={`${cx(0)},${cy + 112} ${cx(0) - 26},${cy + 160} ${cx(0) + 26},${cy + 160}`}
                        fill="#ca8a04"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.9 }}
                    />
                    <motion.text x={B / 2} y={cy + 350} textAnchor="middle" fontSize={38} fontWeight={800} fill="#854d0e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                        pengene går til skoler, veier og havner
                    </motion.text>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }}>
                        <path
                            d={`M ${cx(3) + 150} 140 L ${cx(3) + 260} 160 L ${cx(3) + 250} 240 Q ${cx(3) + 205} 290 ${cx(3) + 205} 290 Q ${cx(3) + 160} 270 ${cx(3) + 150} 240 Z`}
                            fill="#b45309"
                            stroke="#fff"
                            strokeWidth={5}
                        />
                        <text x={cx(3) + 120} y={215} textAnchor="end" fontSize={34} fontWeight={800} fill="#92400e">
                            hær og flåte
                        </text>
                    </motion.g>
                </>
            )}
        </>
    );
}

function Topp({ beat }: { beat: number }) {
    const vipp = beat >= 1 ? 1.5 : 0;
    return (
        <>
            <g style={{ transform: `rotate(${vipp}deg)`, transformOrigin: `${B / 2}px ${BUNN}px`, transformBox: 'view-box', transition: 'transform 3s ease-in-out' }}>
                {ETASJER.map((_, i) => (
                    <Etasje key={i} i={i} fylt glod={beat === 0} />
                ))}
                {beat >= 1 && (
                    <motion.path
                        d={`M ${TARN_X + 500} ${etasjeY(7)} l -20 26 l 26 18 l -18 32`}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={6}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 1 }}
                    />
                )}
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <path d={`M ${TARN_X + 120} ${etasjeY(1)} l 30 30 l -20 20 l 40 26`} fill="none" stroke="#0f172a" strokeWidth={6} />
                        <path d={`M ${TARN_X + 420} ${etasjeY(1)} l -24 34 l 30 16 l -16 26`} fill="none" stroke="#0f172a" strokeWidth={6} />
                    </motion.g>
                )}
            </g>
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                    <text x={TARN_X + TARN_B + 50} y={etasjeY(7) + 30} fontSize={44} fontWeight={900} fill="#b91c1c">
                        ↓ snur stille
                    </text>
                    <text x={TARN_X + TARN_B + 50} y={etasjeY(7) + 80} fontSize={32} fontWeight={700} fill="#475569">
                        nesten ingen merker det
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <text x={TARN_X - 130} y={BUNN + 40} textAnchor="middle" fontSize={36} fontWeight={800} fill="#b91c1c">
                        Gjeld
                    </text>
                    <motion.rect
                        x={TARN_X - 190}
                        width={120}
                        rx={10}
                        fill="#dc2626"
                        initial={{ y: BUNN, height: 0 }}
                        animate={{ y: BUNN - (beat >= 3 ? 520 : 300), height: beat >= 3 ? 520 : 300 }}
                        transition={{ duration: 3 }}
                    />
                </motion.g>
            )}
            {beat >= 3 &&
                [
                    { x: TARN_X + TARN_B + 150, y: 330, r: beat >= 4 ? 80 : 120, tekst: 'Aksjer' },
                    { x: TARN_X + TARN_B + 340, y: 420, r: beat >= 4 ? 75 : 105, tekst: 'Boliger' },
                ].map((b) => (
                    <g key={b.tekst}>
                        <motion.circle cx={b.x} cy={b.y} fill="#f9a8d4" fillOpacity={0.8} stroke="#db2777" strokeWidth={5} initial={{ r: 10 }} animate={{ r: b.r }} transition={{ duration: 3 }} />
                        <text x={b.x} y={b.y + 13} textAnchor="middle" fontSize={36} fontWeight={800} fill="#831843">
                            {b.tekst}
                        </text>
                    </g>
                ))}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                    {[0, 1, 2, 3].map((i) => (
                        <rect key={i} x={1360} y={BUNN - (i + 1) * 46} width={170} height={40} rx={6} fill={ETASJER[i].farge} opacity={0.75} />
                    ))}
                    <text x={1445} y={BUNN - 210} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                        andre land
                    </text>
                    <path d={`M ${TARN_X + TARN_B + 20} ${etasjeY(1) + 40} Q 1250 ${etasjeY(1) - 40} 1350 ${BUNN - 120}`} fill="none" stroke="#64748b" strokeWidth={6} strokeDasharray="14 10" />
                </motion.g>
            )}
        </>
    );
}

export function StoreSykluserTarn({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'faktorer';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#f1f5f9, #e2e8f0)' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'leder' && <Leder beat={beat} />}
                {modus === 'faktorer' && <Faktorer beat={beat} />}
                {modus === 'kjede' && <Kjede beat={beat} />}
                {modus === 'topp' && <Topp beat={beat} />}
            </svg>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
