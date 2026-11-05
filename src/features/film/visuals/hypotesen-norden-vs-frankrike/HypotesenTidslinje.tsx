import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tidslinja over Karls krig mot sakserne: angrepet i 772, de 33 årene med kamper som
 * tegnes opp som en stolpe, og det som skjedde med sakserne underveis. Lindisfarne
 * står som et lite merke inni krigen, så eleven ser at angrepet kom mens krigen pågikk.
 */

const B = 1600;
const H = 900;
const FRA = 760;
const TIL = 820;
const VENSTRE = 140;
const HOYRE = B - 140;
const AKSE_Y = 470;

const x = (aar: number) => VENSTRE + ((aar - FRA) / (TIL - FRA)) * (HOYRE - VENSTRE);

const START = 772;
const LENGDE = 33;

export function HypotesenTidslinje({ beat }: VisualProps<{ modus?: string }>) {
    const slutt = START + LENGDE;
    const bredde = x(slutt) - x(START);
    const ticks = Array.from({ length: (TIL - FRA) / 10 + 1 }, (_, i) => FRA + i * 10);

    return (
        <div className="absolute inset-0 bg-[#f4efe3]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <text
                    x={B / 2}
                    y={120}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={900}
                    fill="#1c1917"
                >
                    Karl mot sakserne
                </text>

                {/* Aksen */}
                <line
                    x1={VENSTRE}
                    x2={HOYRE}
                    y1={AKSE_Y}
                    y2={AKSE_Y}
                    stroke="#57534e"
                    strokeWidth={4}
                />
                {ticks.map((t) => (
                    <g key={t}>
                        <line
                            x1={x(t)}
                            x2={x(t)}
                            y1={AKSE_Y - 10}
                            y2={AKSE_Y + 10}
                            stroke="#57534e"
                            strokeWidth={3}
                        />
                        <text
                            x={x(t)}
                            y={AKSE_Y + 52}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#78716c"
                        >
                            {t}
                        </text>
                    </g>
                ))}

                {/* Krigen som en stolpe som vokser fra 772 */}
                <motion.rect
                    x={x(START)}
                    y={AKSE_Y - 70}
                    height={60}
                    rx={10}
                    fill="#b91c1c"
                    initial={{ width: 0 }}
                    animate={{ width: beat >= 1 ? bredde : 14 }}
                    transition={{ duration: beat >= 1 ? 3.2 : 0.6, ease: 'easeInOut' }}
                />
                <motion.text
                    x={x(START) + bredde / 2}
                    y={AKSE_Y - 28}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill="#ffffff"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 ? 1 : 0 }}
                    transition={{ delay: beat >= 1 ? 2.4 : 0, duration: 0.6 }}
                >
                    {LENGDE} år med kamper
                </motion.text>

                {/* 772: angrepet */}
                <g>
                    <line
                        x1={x(START)}
                        x2={x(START)}
                        y1={AKSE_Y - 70}
                        y2={AKSE_Y - 160}
                        stroke="#7f1d1d"
                        strokeWidth={4}
                    />
                    <text
                        x={x(START)}
                        y={AKSE_Y - 220}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#7f1d1d"
                    >
                        {START}
                    </text>
                    <text
                        x={x(START)}
                        y={AKSE_Y - 176}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#44403c"
                    >
                        Karl angriper
                    </text>
                </g>

                {/* Slutten: Sachsen blir en del av riket */}
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 ? 1 : 0 }}
                    transition={{ delay: beat >= 1 ? 3 : 0, duration: 0.6 }}
                >
                    <line
                        x1={x(slutt)}
                        x2={x(slutt)}
                        y1={AKSE_Y - 70}
                        y2={AKSE_Y - 160}
                        stroke="#1e3a8a"
                        strokeWidth={4}
                    />
                    <text
                        x={x(slutt)}
                        y={AKSE_Y - 214}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#1e3a8a"
                    >
                        Sachsen blir en del
                    </text>
                    <text
                        x={x(slutt)}
                        y={AKSE_Y - 176}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#1e3a8a"
                    >
                        av Frankerriket
                    </text>
                </motion.g>

                {/* Lindisfarne som et lite merke midt i krigen */}
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 ? 0.85 : 0 }}
                    transition={{ delay: beat >= 1 ? 3.6 : 0, duration: 0.6 }}
                >
                    <polygon
                        points={`${x(793)},${AKSE_Y - 4} ${x(793) - 14},${AKSE_Y - 30} ${x(793) + 14},${AKSE_Y - 30}`}
                        fill="#0f766e"
                        transform={`translate(0 ${-76})`}
                    />
                    <text
                        x={x(793)}
                        y={AKSE_Y - 118}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill="#0f766e"
                    >
                        Lindisfarne 793
                    </text>
                </motion.g>
            </svg>

            {/* Det som skjedde med sakserne, ett kort per beat */}
            <div
                className="absolute inset-x-0 flex justify-center gap-8 pointer-events-none"
                style={{ top: '64%' }}
            >
                <Kort
                    synlig={beat >= 2}
                    fokus={beat === 2}
                    symbol="✝"
                    tittel="Tvangskristnet"
                    tekst="måtte bli kristne"
                />
                <Kort
                    synlig={beat >= 3}
                    fokus={beat === 3}
                    symbol="➜"
                    tittel="Deportert"
                    tekst="tvunget bort hjemmefra"
                />
            </div>
        </div>
    );
}

function Kort({
    synlig,
    fokus,
    symbol,
    tittel,
    tekst,
}: {
    synlig: boolean;
    fokus: boolean;
    symbol: string;
    tittel: string;
    tekst: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: synlig ? (fokus ? 1 : 0.75) : 0, y: synlig ? 0 : 24 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white shadow-xl border-b-4 border-red-700"
        >
            <div className="text-5xl font-black text-red-700" style={{ width: 56 }}>
                {symbol}
            </div>
            <div>
                <div className="text-3xl font-black text-stone-900">{tittel}</div>
                <div className="text-xl font-semibold text-stone-500">{tekst}</div>
            </div>
        </motion.div>
    );
}
