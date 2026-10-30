import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Monte Testaccio i snitt, i SVG: en ås av knuste krukker. Åsen står til venstre,
 * forklaringen til høyre skifter per beat.
 *
 * Beat 0: åsen og høyden. Beat 1: snittet viser skårene, og en hel amfora forklares.
 * Beat 2: olivenoljen fra Baetica til Roma. Beat 3: åsen vokser lag for lag gjennom tre
 * hundreår. Beat 4: hele åsen, et monument over forbruket.
 */

const B = 1600;
const H = 900;
const BAKKE = 760;
const TOPP = 250;
const LEIRE = '#c2703d';

const ASEN = `M 80 ${BAKKE} C 220 ${BAKKE - 120} 330 ${TOPP + 20} 520 ${TOPP} C 700 ${TOPP + 20} 820 ${
    BAKKE - 120
} 960 ${BAKKE} Z`;

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Skår av krukker spredt i åsen, faste plasser så bildet blir likt hver gang. */
const SKAR = Array.from({ length: 170 }, (_, i) => ({
    x: 90 + frø(i) * 860,
    y: TOPP + frø(i + 500) * (BAKKE - TOPP),
    r: frø(i + 900) * 180,
    s: 0.6 + frø(i + 1300) * 0.6,
}));

const TEKSTER = [
    'Monte Testaccio: en ås laget av mennesker',
    'For det meste knuste krukker: amforaer',
    'Olivenolje fra Baetica til Roma',
    'Krukke på krukke i tre hundreår',
    'Et monument over forbruket i Roma',
];

export function HandelTestaccio({ beat }: VisualProps) {
    const tekst = TEKSTER[Math.min(beat, TEKSTER.length - 1)];
    const snitt = beat >= 1;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#e0f2fe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <clipPath id="testaccio-as">
                        <path d={ASEN} />
                    </clipPath>
                    <clipPath id="testaccio-vekst">
                        <motion.rect
                            x={0}
                            width={1000}
                            initial={{ y: beat === 3 ? BAKKE - 60 : TOPP - 10, height: 900 }}
                            animate={{ y: TOPP - 10, height: 900 }}
                            transition={{ duration: beat === 3 ? 6 : 1.4, ease: 'easeInOut' }}
                        />
                    </clipPath>
                </defs>
                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#a3a380" />
                <g clipPath="url(#testaccio-vekst)">
                    <path d={ASEN} fill={snitt ? '#e7c9a9' : '#7c8c4f'} />
                    {snitt && (
                        <g clipPath="url(#testaccio-as)">
                            {SKAR.map((s, i) => (
                                <motion.path
                                    key={i}
                                    d="M -22 -6 Q 0 -16 22 -6 L 18 6 Q 0 -2 -18 6 Z"
                                    fill={i % 3 ? LEIRE : '#a8552a'}
                                    transform={`translate(${s.x} ${s.y}) rotate(${s.r}) scale(${s.s})`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: (i % 20) * 0.03 }}
                                />
                            ))}
                        </g>
                    )}
                    {!snitt && <path d={ASEN} fill="none" stroke="#4d5c2b" strokeWidth={4} />}
                </g>

                {/* Lagene og hundreårene i beat 3 */}
                {beat === 3 &&
                    ['krukke', 'på krukke', 'år 1-300 e.Kr.'].map((t, i) => (
                        <motion.text
                            key={t}
                            x={520}
                            y={BAKKE - 70 - i * 150}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#7c2d12"
                            stroke="#fff7ed"
                            strokeWidth={8}
                            paintOrder="stroke"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + i * 1.8 }}
                        >
                            {t}
                        </motion.text>
                    ))}

                {/* Høydelinjal */}
                <g>
                    <line
                        x1={1010}
                        y1={TOPP}
                        x2={1010}
                        y2={BAKKE}
                        stroke="#334155"
                        strokeWidth={5}
                    />
                    <line x1={990} y1={TOPP} x2={1030} y2={TOPP} stroke="#334155" strokeWidth={5} />
                    <line
                        x1={990}
                        y1={BAKKE}
                        x2={1030}
                        y2={BAKKE}
                        stroke="#334155"
                        strokeWidth={5}
                    />
                    <line
                        x1={540}
                        y1={TOPP}
                        x2={990}
                        y2={TOPP}
                        stroke="#334155"
                        strokeWidth={2}
                        strokeDasharray="8 8"
                    />
                    <text
                        x={1010}
                        y={(TOPP + BAKKE) / 2}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#0f172a"
                        stroke="#e0f2fe"
                        strokeWidth={10}
                        paintOrder="stroke"
                    >
                        ca. 50 m
                    </text>
                </g>

                {/* Høyre kolonne */}
                {beat === 1 && <Amfora />}
                {beat === 2 && <Reisen />}
                {beat === 4 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect x={1110} y={330} width={460} height={250} rx={24} fill="#ffffff" />
                        <text
                            x={1340}
                            y={420}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#7c2d12"
                        >
                            Ca. 50 meter
                        </text>
                        <text
                            x={1340}
                            y={475}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#334155"
                        >
                            av krukker fra
                        </text>
                        <text
                            x={1340}
                            y={525}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#334155"
                        >
                            Romas olje
                        </text>
                    </motion.g>
                )}
            </svg>
            <motion.div
                key={beat}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap bg-white/90 text-slate-900"
            >
                {tekst}
            </motion.div>
        </div>
    );
}

/** En hel amfora med to hanker og merkelapper. */
function Amfora() {
    return (
        <motion.g
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
        >
            <g transform="translate(1320 520)">
                <path
                    d="M -14 -230 L 14 -230 L 16 -170 Q 90 -140 92 -40 Q 90 60 30 150 L 10 200 L -10 200 L -30 150 Q -90 60 -92 -40 Q -90 -140 -16 -170 Z"
                    fill={LEIRE}
                    stroke="#7c2d12"
                    strokeWidth={6}
                />
                <path
                    d="M -16 -200 Q -80 -200 -66 -130"
                    fill="none"
                    stroke="#7c2d12"
                    strokeWidth={12}
                />
                <path
                    d="M 16 -200 Q 80 -200 66 -130"
                    fill="none"
                    stroke="#7c2d12"
                    strokeWidth={12}
                />
                <text
                    x={0}
                    y={270}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#7c2d12"
                >
                    amfora
                </text>
                <text
                    x={0}
                    y={316}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#334155"
                >
                    leirkrukke med to hanker
                </text>
            </g>
        </motion.g>
    );
}

/** Fra Baetica i Spania til Roma, med et lite skip. */
function Reisen() {
    const fra = { x: 1190, y: 580 };
    const til = { x: 1500, y: 400 };
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <rect x={1110} y={260} width={470} height={430} rx={24} fill="#bae6fd" />
            <path
                d={`M ${fra.x} ${fra.y} Q 1330 610 ${til.x} ${til.y}`}
                fill="none"
                stroke="#0369a1"
                strokeWidth={6}
                strokeDasharray="14 10"
            />
            <circle cx={fra.x} cy={fra.y} r={14} fill="#b45309" stroke="#fff" strokeWidth={4} />
            <circle cx={til.x} cy={til.y} r={14} fill="#7e22ce" stroke="#fff" strokeWidth={4} />
            <text
                x={fra.x + 10}
                y={fra.y + 60}
                textAnchor="middle"
                fontSize={30}
                fontWeight={900}
                fill="#b45309"
            >
                Baetica
            </text>
            <text
                x={fra.x + 10}
                y={fra.y + 96}
                textAnchor="middle"
                fontSize={24}
                fontWeight={700}
                fill="#334155"
            >
                i dagens Spania
            </text>
            <text
                x={til.x - 10}
                y={til.y + 56}
                textAnchor="middle"
                fontSize={30}
                fontWeight={900}
                fill="#7e22ce"
            >
                Roma
            </text>
            <motion.g
                initial={{ x: fra.x, y: fra.y - 20 }}
                animate={{ x: [fra.x, 1340, til.x], y: [fra.y - 20, 570, til.y - 20] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
                <path d="M -26 0 L 26 0 L 16 16 L -16 16 Z" fill="#7c4a24" />
                <path d="M 0 0 L 0 -36 L 22 -8 Z" fill="#f3e6c9" />
            </motion.g>
            <g transform="translate(1200 340)">
                <path
                    d="M -6 -40 L 6 -40 L 7 -28 Q 34 -20 34 4 Q 32 28 10 50 L -10 50 Q -32 28 -34 4 Q -34 -20 -7 -28 Z"
                    fill={LEIRE}
                />
                <text x={60} y={10} fontSize={28} fontWeight={800} fill="#365314">
                    olivenolje
                </text>
            </g>
        </motion.g>
    );
}
