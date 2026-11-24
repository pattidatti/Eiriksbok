import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvor mange en avgjørelse gjelder. Arealet av hver sirkel følger tallet.
 * Beat 0: de tre nyere bevegelsene, forstørret så de kan sammenlignes med hverandre.
 * Beat 1: Den katolske kirke kommer inn i samme målestokk, og de tre krymper til prikker.
 * Beat 2: kortet om kvinnelige prester i Den katolske kirke.
 * Beat 3: de små lyser opp igjen - like viktig for dem det gjelder.
 */

const B = 1600;
const H = 900;
const MORK = '#0f172a';
const GRA = '#64748b';

/** Millioner. */
const KATOLSK = 1360;
const SMA = [
    { navn: "Bahá'í", tall: 6, linjer: ['ca. 6 millioner', 'anslag, 2026'], farge: '#0d9488' },
    { navn: 'Jehovas vitner', tall: 8.6, linjer: ['ca. 8,6 millioner', 'forkynnere, 2019'], farge: '#7c3aed' },
    { navn: 'Mormonkirken', tall: 15.5, linjer: ['ca. 15,5 millioner', 'egne tall, 2015'], farge: '#2563eb' },
];

/** Radius i felles målestokk: Den katolske kirke får 300. */
const r = (mill: number) => 300 * Math.sqrt(mill / KATOLSK);

export function KjonnStorrelse({ beat }: VisualProps) {
    const zoom = beat === 0 ? 5 : 1;
    const katolskInne = beat >= 1;
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <text x={B / 2} y={88} textAnchor="middle" fontSize={52} fontWeight={900} fill={MORK}>
                    {beat === 0 ? 'Tre nyere bevegelser, forstørret' : 'Hvor mange gjelder det?'}
                </text>

                {SMA.map((s, i) => {
                    const x = beat === 0 ? 330 + i * 470 : 150 + i * 260;
                    const y = beat === 0 ? 400 : 560;
                    const rad = r(s.tall) * zoom;
                    const lys = beat === 3;
                    return (
                        <motion.g key={s.navn} initial={false} animate={{ x, y }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
                            {lys && (
                                <circle cx={0} cy={0} r={rad + 14} fill="none" stroke="#f59e0b" strokeWidth={6}>
                                    <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
                                </circle>
                            )}
                            <motion.circle
                                cx={0}
                                cy={0}
                                r={r(s.tall)}
                                fill={s.farge}
                                initial={false}
                                animate={{ scale: zoom }}
                                transition={{ duration: 1.2, ease: 'easeInOut' }}
                            />
                            <text x={0} y={beat === 0 ? rad + 60 : 70} textAnchor="middle" fontSize={beat === 0 ? 38 : 32} fontWeight={900} fill={s.farge}>
                                {s.navn}
                            </text>
                            {s.linjer.map((l, k) => (
                                <text
                                    key={l}
                                    x={0}
                                    y={(beat === 0 ? rad + 60 : 70) + (k + 1) * (beat === 0 ? 40 : 34)}
                                    textAnchor="middle"
                                    fontSize={beat === 0 ? 32 : 27}
                                    fontWeight={k === 0 ? 800 : 600}
                                    fill={k === 0 ? MORK : GRA}
                                >
                                    {l}
                                </text>
                            ))}
                        </motion.g>
                    );
                })}

                {katolskInne && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}>
                        <motion.circle
                            cx={1130}
                            cy={470}
                            r={r(KATOLSK)}
                            fill="#b45309"
                            initial={{ scale: 0.2 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.4, delay: 0.6, ease: 'easeOut' }}
                            style={{ transformOrigin: '1130px 470px' }}
                        />
                        <text x={1130} y={410} textAnchor="middle" fontSize={44} fontWeight={900} fill="#ffffff">
                            Den katolske kirke
                        </text>
                        <text x={1130} y={466} textAnchor="middle" fontSize={36} fontWeight={800} fill="#ffffff">
                            ca. 1,36 milliarder
                        </text>
                        <text x={1130} y={512} textAnchor="middle" fontSize={30} fontWeight={600} fill="#fde68a">
                            døpte, 2020
                        </text>
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                        <rect x={890} y={570} width={480} height={110} rx={24} fill="#ffffff" stroke="#dc2626" strokeWidth={5} />
                        <text x={1130} y={615} textAnchor="middle" fontSize={34} fontWeight={900} fill="#dc2626">
                            Kvinnelige prester:
                        </text>
                        <text x={1130} y={658} textAnchor="middle" fontSize={34} fontWeight={900} fill="#dc2626">
                            fortsatt ikke tillatt
                        </text>
                    </motion.g>
                )}
                {beat === 3 && (
                    <motion.text
                        x={390}
                        y={400}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#b45309"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Færre, men like viktig for dem
                    </motion.text>
                )}
                <text x={40} y={872} fontSize={24} fontWeight={600} fill={GRA}>
                    {beat === 0
                        ? 'Forstørret, så de kan sammenlignes. Ulike år og ulike måter å telle på.'
                        : 'Arealet følger tallet. Ulike år og ulike måter å telle på.'}
                </text>
            </svg>
        </div>
    );
}
