import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Kontrast på en tavle. Først hvitt kritt på hvit tavle (ingenting synes), så blir tavla
 * svart og ordet trer fram. Deretter motsetningene, glede som faller til sorg, og en flat
 * strek mot en strek med spenning.
 */

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const KRITT = '#f8fafc';
const GULL = '#fbbf24';

function Vis({ synlig, children }: { synlig: boolean; children: ReactNode }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.8 }}
        >
            {children}
        </motion.g>
    );
}

function Kritt({
    x,
    y,
    tekst,
    storrelse = 44,
    farge = KRITT,
    vekt = 700,
}: {
    x: number;
    y: number;
    tekst: string;
    storrelse?: number;
    farge?: string;
    vekt?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            style={FONT}
        >
            {tekst}
        </text>
    );
}

const PAR = [
    ['Lys', 'mørke'],
    ['Liv', 'død'],
    ['Støy', 'stillhet'],
];

export function BildesprakTavle({ beat }: VisualProps) {
    const svart = beat >= 1;
    return (
        <div className="absolute inset-0" style={{ background: '#e7e1d6' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {/* Rammen og tavla */}
                <rect x={170} y={110} width={1260} height={680} rx={18} fill="#8b5a2b" />
                <motion.rect
                    x={195}
                    y={135}
                    width={1210}
                    height={630}
                    rx={8}
                    initial={{ fill: '#f8fafc' }}
                    animate={{ fill: svart ? '#1f2d26' : '#f8fafc' }}
                    transition={{ duration: 1.4 }}
                />
                <Kritt x={800} y={300} tekst="KONTRAST" storrelse={120} vekt={900} />
                <Vis synlig={beat === 0}>
                    <Kritt
                        x={800}
                        y={70}
                        tekst="Hvitt kritt på hvit tavle"
                        farge="#1e293b"
                        storrelse={46}
                        vekt={800}
                    />
                    <Kritt x={800} y={460} tekst="Ser du noe?" farge="#cbd5e1" storrelse={50} />
                </Vis>
                <Vis synlig={beat === 1}>
                    <Kritt
                        x={800}
                        y={70}
                        tekst="Svart tavle: nå synes det"
                        farge="#1e293b"
                        storrelse={46}
                        vekt={800}
                    />
                </Vis>
                <Vis synlig={beat >= 2}>
                    <Kritt
                        x={800}
                        y={380}
                        tekst="en tydelig motsetning"
                        storrelse={48}
                        farge={GULL}
                    />
                </Vis>
                {PAR.map(([a, b], i) => {
                    const x = 380 + i * 420;
                    return (
                        <Vis key={a} synlig={beat === 3}>
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat === 3 ? 1 : 0 }}
                                transition={{ duration: 0.6, delay: 0.3 + i * 0.9 }}
                            >
                                <rect x={x - 180} y={470} width={180} height={170} fill={KRITT} />
                                <rect
                                    x={x}
                                    y={470}
                                    width={180}
                                    height={170}
                                    fill="#020617"
                                    stroke={KRITT}
                                    strokeWidth={3}
                                />
                                <Kritt
                                    x={x - 90}
                                    y={572}
                                    tekst={a}
                                    farge="#0f172a"
                                    storrelse={44}
                                    vekt={900}
                                />
                                <Kritt
                                    x={x + 90}
                                    y={572}
                                    tekst={b}
                                    storrelse={a === 'Støy' ? 34 : 42}
                                    vekt={900}
                                />
                            </motion.g>
                        </Vis>
                    );
                })}
                <Vis synlig={beat === 4}>
                    <motion.path
                        d="M300,690 Q430,520 600,510 L660,515 Q760,550 840,710 L1300,720"
                        stroke={KRITT}
                        strokeWidth={8}
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat === 4 ? 1 : 0 }}
                        transition={{ duration: 2.4 }}
                    />
                    <Kritt x={560} y={485} tekst="stor glede" storrelse={40} farge={GULL} />
                    <Kritt x={1080} y={680} tekst="sorg" storrelse={44} farge="#93c5fd" />
                    <Kritt
                        x={800}
                        y={850}
                        tekst="«Sorg og glede de vandrer sammen.»"
                        farge="#1e293b"
                        storrelse={44}
                        vekt={800}
                    />
                </Vis>
                <Vis synlig={beat >= 5}>
                    <line
                        x1={260}
                        y1={600}
                        x2={720}
                        y2={600}
                        stroke="#94a3b8"
                        strokeWidth={8}
                        strokeLinecap="round"
                    />
                    <Kritt x={490} y={700} tekst="flat" storrelse={44} farge="#94a3b8" />
                    <motion.path
                        d="M880,600 L940,500 L1000,690 L1060,470 L1120,680 L1180,520 L1240,640 L1340,600"
                        stroke={GULL}
                        strokeWidth={8}
                        fill="none"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat >= 5 ? 1 : 0 }}
                        transition={{ duration: 1.6 }}
                    />
                    <Kritt
                        x={1110}
                        y={740}
                        tekst="spenning"
                        storrelse={44}
                        farge={GULL}
                        vekt={900}
                    />
                </Vis>
            </svg>
        </div>
    );
}
