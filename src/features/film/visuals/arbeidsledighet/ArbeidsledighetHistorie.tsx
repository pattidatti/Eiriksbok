import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Et blikk bakover: 1933, da én av tre i fagforeningene var uten arbeid, de rolige årene
 * 1965-1976, og september 2026. Stolpene står i samme målestokk, så forskjellen synes.
 */

const MORK = '#0f172a';
const GRA = '#64748b';
const ROD = '#dc2626';

const X0 = 220;
const X1 = 1380;
const Y0 = 760;
const ax = (aar: number) => X0 + ((aar - 1925) / (2030 - 1925)) * (X1 - X0);
const ay = (pst: number) => Y0 - (pst / 40) * 520;

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: forsinkelse }}>
            {children}
        </motion.g>
    );
}

function Stolpe({ x, b, pst, farge }: { x: number; b: number; pst: number; farge: string }) {
    return (
        <motion.rect
            x={x - b / 2}
            width={b}
            fill={farge}
            initial={{ y: Y0, height: 0 }}
            animate={{ y: ay(pst), height: Y0 - ay(pst) }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
        />
    );
}

const OVERSKRIFT = ['Arbeidsledighet før og nå', '1933: den store krisen', 'Én av tre', '1965-1976: svært lav ledighet', 'I dag: målt på en annen måte'];

export function ArbeidsledighetHistorie({ beat }: VisualProps) {
    const tittel = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    const x33 = ax(1933);
    const x65 = ax(1965);
    const x76 = ax(1976);
    const x26 = ax(2026);
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            <AnimatePresence mode="wait">
                <motion.text
                    key={tittel}
                    x={800}
                    y={100}
                    textAnchor="middle"
                    fontSize={60}
                    fontWeight={800}
                    fill={MORK}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {tittel}
                </motion.text>
            </AnimatePresence>

            <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={GRA} strokeWidth={4} />
            {[1930, 1950, 1970, 1990, 2010].map((a) => (
                <g key={a}>
                    <line x1={ax(a)} y1={Y0} x2={ax(a)} y2={Y0 + 12} stroke={GRA} strokeWidth={3} />
                    <text x={ax(a)} y={Y0 + 48} textAnchor="middle" fontSize={28} fontWeight={700} fill={GRA}>
                        {a}
                    </text>
                </g>
            ))}

            {beat >= 1 && (
                <g>
                    <Stolpe x={x33} b={110} pst={33.4} farge={ROD} />
                    <Inn forsinkelse={1.2}>
                        <text x={x33} y={ay(33.4) - 20} textAnchor="middle" fontSize={50} fontWeight={900} fill={ROD}>
                            33,4 %
                        </text>
                        <text x={x33 + 80} y={ay(24)} fontSize={28} fontWeight={700} fill={MORK}>
                            av medlemmene i
                        </text>
                        <text x={x33 + 80} y={ay(24) + 36} fontSize={28} fontWeight={700} fill={MORK}>
                            fagforeningene
                        </text>
                        <text x={x33 + 80} y={ay(24) + 72} fontSize={28} fontWeight={700} fill={MORK}>
                            var uten arbeid
                        </text>
                    </Inn>
                </g>
            )}
            {beat >= 2 && (
                <Inn forsinkelse={0.2}>
                    {[0, 1, 2].map((i) => (
                        <g key={i} transform={`translate(${x33 + 100 + i * 80} ${ay(8)})`}>
                            <circle cx={0} cy={-78} r={22} fill="#e8b48c" />
                            <rect x={-26} y={-54} width={52} height={80} rx={20} fill={i === 0 ? ROD : '#94a3b8'} />
                        </g>
                    ))}
                </Inn>
            )}
            {beat >= 3 && (
                <g>
                    <motion.rect
                        x={x65}
                        width={x76 - x65}
                        y={ay(1.4)}
                        height={ay(0.6) - ay(1.4)}
                        fill="#0d9488"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                    <rect x={x65} y={ay(0.6)} width={x76 - x65} height={Y0 - ay(0.6)} fill="#0d9488" fillOpacity={0.3} />
                    <Inn forsinkelse={0.6}>
                        <text x={(x65 + x76) / 2} y={ay(1.4) - 70} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f766e">
                            0,6-1,4 %
                        </text>
                        <text x={(x65 + x76) / 2} y={ay(1.4) - 30} textAnchor="middle" fontSize={26} fontWeight={700} fill={MORK}>
                            i året
                        </text>
                    </Inn>
                </g>
            )}
            {beat >= 4 && (
                <g>
                    <Stolpe x={x26} b={70} pst={4.6} farge="#1d4ed8" />
                    <Inn forsinkelse={1}>
                        <text x={x26} y={ay(4.6) - 70} textAnchor="middle" fontSize={44} fontWeight={900} fill="#1d4ed8">
                            4,6 %
                        </text>
                        <text x={x26} y={ay(4.6) - 32} textAnchor="middle" fontSize={26} fontWeight={700} fill={MORK}>
                            SSB, sept. 2026, annen måling
                        </text>
                    </Inn>
                </g>
            )}
            {beat === 0 && (
                <text x={800} y={480} textAnchor="middle" fontSize={140} fontWeight={900} fill="#cbd5e1">
                    ?
                </text>
            )}
        </svg>
    );
}
