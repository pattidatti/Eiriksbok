import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hinduismens samskara som perler på en snor, fra før barnet er blitt til og fram til bålet.
 * Så snorseremonien: gutten får den hellige snoren, og standssystemet viser hvem som fikk lov.
 */

const B = 1600;
const H = 900;
const SNOR_Y = 290;
const FRA = 200;
const TIL = 1330;
const PERLER = 16;
const SNOR_PERLE = 6; // perla som lyser opp ved snorseremonien
const ROSA = '#db2777';

const LAG = [
    { tekst: 'fikk lov', farge: '#db2777' },
    { tekst: 'fikk lov', farge: '#ec4899' },
    { tekst: 'fikk lov', farge: '#f472b6' },
    { tekst: 'fikk ikke lov', farge: '#e2e8f0' },
];

function perleX(i: number) {
    return FRA + 30 + (i * (TIL - FRA - 60)) / (PERLER - 1);
}

function Gutt({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-38}
                y={-150}
                width={76}
                height={150}
                rx={32}
                fill="#f8fafc"
                stroke="#94a3b8"
                strokeWidth={4}
            />
            <circle cx={0} cy={-186} r={34} fill="#a16a3c" />
            {/* Den hellige snoren over skulderen */}
            <motion.path
                d="M -26 -140 L 30 -20"
                stroke="#eab308"
                strokeWidth={9}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.6, duration: 1 }}
            />
        </g>
    );
}

export function OvergangsriterSamskara({ beat }: VisualProps) {
    const tittel =
        beat === 0
            ? 'Hinduismen: flest seremonier av alle ni'
            : beat === 1
              ? 'Samskara: fra før fødselen til bålet'
              : beat === 2
                ? 'Upanayana: den hellige snoren'
                : 'Hvem fikk lov til å bli elev?';
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #fdf2f8, #fce7f3)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <motion.text
                    key={tittel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    x={B / 2}
                    y={80}
                    textAnchor="middle"
                    fontSize={48}
                    fontWeight={900}
                    fill="#831843"
                >
                    {tittel}
                </motion.text>

                {/* Snoren med perlene */}
                <line
                    x1={FRA}
                    y1={SNOR_Y}
                    x2={TIL + 40}
                    y2={SNOR_Y}
                    stroke="#9d174d"
                    strokeWidth={6}
                />
                {Array.from({ length: PERLER }, (_, i) => {
                    const lys = beat >= 2 && i === SNOR_PERLE;
                    return (
                        <motion.circle
                            key={i}
                            cx={perleX(i)}
                            cy={SNOR_Y}
                            initial={{ r: beat === 0 ? 0 : 24 }}
                            animate={{ r: lys ? 34 : 24, opacity: beat >= 2 && !lys ? 0.45 : 1 }}
                            transition={{ delay: beat === 0 ? 0.2 + i * 0.12 : 0, duration: 0.4 }}
                            fill={lys ? '#eab308' : ROSA}
                            stroke="white"
                            strokeWidth={4}
                        />
                    );
                })}

                {beat >= 1 && (
                    <motion.g
                        initial={{ opacity: beat === 1 ? 0 : 1 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <text x={FRA} y={SNOR_Y + 75} fontSize={30} fontWeight={800} fill="#831843">
                            før barnet er blitt til
                        </text>
                        {/* Bålet i enden */}
                        <g transform={`translate(${TIL + 110} ${SNOR_Y})`}>
                            <rect x={-50} y={20} width={100} height={22} rx={6} fill="#7c2d12" />
                            <motion.path
                                d="M 0 -60 Q 34 -20 26 8 Q 20 24 0 24 Q -20 24 -26 8 Q -30 -16 -8 -34 Q -8 -14 4 -12 Q 10 -34 0 -60 Z"
                                fill="#f97316"
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 0.9, repeat: Infinity }}
                            />
                            <text
                                x={0}
                                y={85}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill="#7c2d12"
                            >
                                bålet
                            </text>
                        </g>
                    </motion.g>
                )}

                {beat >= 2 && (
                    <motion.g
                        key={`gutt-${beat === 2}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <line
                            x1={perleX(SNOR_PERLE)}
                            y1={SNOR_Y + 40}
                            x2={perleX(SNOR_PERLE)}
                            y2={470}
                            stroke="#eab308"
                            strokeWidth={5}
                            strokeDasharray="10 8"
                        />
                        <Gutt x={perleX(SNOR_PERLE) - 80} y={800} />
                        {/* Boka han nå får lese */}
                        <g transform={`translate(${perleX(SNOR_PERLE) + 90} 700)`}>
                            <path
                                d="M 0 -50 Q -50 -70 -100 -60 L -100 40 Q -50 30 0 50 Z"
                                fill="#fef3c7"
                                stroke="#0f172a"
                                strokeWidth={5}
                            />
                            <path
                                d="M 0 -50 Q 50 -70 100 -60 L 100 40 Q 50 30 0 50 Z"
                                fill="#fef3c7"
                                stroke="#0f172a"
                                strokeWidth={5}
                            />
                        </g>
                        <text
                            x={perleX(SNOR_PERLE) + 90}
                            y={858}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={800}
                            fill="#831843"
                        >
                            får lese de hellige tekstene
                        </text>
                    </motion.g>
                )}

                {beat >= 3 && (
                    <motion.g
                        key="lag"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <text
                            x={1210}
                            y={470}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={900}
                            fill="#831843"
                        >
                            Det gamle standssystemet
                        </text>
                        {LAG.map((l, i) => (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.35 }}
                            >
                                <rect
                                    x={980}
                                    y={500 + i * 82}
                                    width={460}
                                    height={66}
                                    rx={14}
                                    fill={l.farge}
                                    stroke={i === 3 ? '#94a3b8' : 'none'}
                                    strokeWidth={4}
                                    strokeDasharray={i === 3 ? '12 8' : undefined}
                                />
                                <text
                                    x={1210}
                                    y={544 + i * 82}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={900}
                                    fill={i === 3 ? '#64748b' : 'white'}
                                >
                                    {l.tekst}
                                </text>
                            </motion.g>
                        ))}
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
