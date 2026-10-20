import { motion } from 'framer-motion';
import { BookOpen, Clapperboard, Feather, Gamepad2, type LucideIcon } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Tråden mellom tekstene, i to modus:
 * - universell: fire ulike fortellinger (bok, film, spill, dikt) med hver sin handling.
 *   Trådene fra dem samles i de samme temaene øverst.
 * - par: tema som ett ord til venstre, budskap som en hel setning til høyre.
 */

type Modus = 'universell' | 'par';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

const KILDER: { navn: string; ikon: LucideIcon; farge: string; bolge: string }[] = [
    { navn: 'Bok', ikon: BookOpen, farge: '#0f766e', bolge: 'M0 20 Q 30 0 60 20 T 120 20' },
    { navn: 'Film', ikon: Clapperboard, farge: '#b45309', bolge: 'M0 30 L 40 10 L 80 30 L 120 5' },
    {
        navn: 'Spill',
        ikon: Gamepad2,
        farge: '#1d4ed8',
        bolge: 'M0 10 L 30 30 L 60 10 L 90 30 L 120 10',
    },
    { navn: 'Dikt', ikon: Feather, farge: '#be185d', bolge: 'M0 25 Q 60 -10 120 25' },
];
const KX = [260, 620, 980, 1340];
const KY = 640;

const TEMAER = [
    { tekst: 'Svik', x: 400 },
    { tekst: 'Identitet', x: 800 },
    { tekst: 'Døden', x: 1200 },
];
const TY = 250;

function Universell({ beat }: { beat: number }) {
    return (
        <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            {/* Trådene fra hver fortelling til hvert tema */}
            {beat >= 2 &&
                KX.map((kx, ki) =>
                    TEMAER.map((t, ti) => (
                        <motion.path
                            key={`${ki}-${ti}`}
                            d={`M ${kx} ${KY - 100} C ${kx} ${KY - 260}, ${t.x} ${TY + 220}, ${t.x} ${TY + 56}`}
                            fill="none"
                            stroke={KILDER[ki].farge}
                            strokeWidth={beat >= 3 ? 6 : 4}
                            strokeOpacity={0.55}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 0.2 + ti * 0.5 + ki * 0.08 }}
                        />
                    ))
                )}
            {KILDER.map((k, i) => {
                const Ikon = k.ikon;
                return (
                    <motion.g
                        key={k.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: i * 0.3 }}
                    >
                        <rect
                            x={KX[i] - 150}
                            y={KY - 100}
                            width={300}
                            height={230}
                            rx={30}
                            fill="#ffffff"
                            stroke={k.farge}
                            strokeWidth={4}
                        />
                        <Ikon
                            x={KX[i] - 36}
                            y={KY - 80}
                            width={72}
                            height={72}
                            color={k.farge}
                            strokeWidth={2}
                        />
                        <text
                            x={KX[i]}
                            y={KY + 36}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#1e293b"
                            style={FONT}
                        >
                            {k.navn}
                        </text>
                        {/* Hver handling har sin egen form */}
                        <path
                            d={k.bolge}
                            transform={`translate(${KX[i] - 60} ${KY + 66})`}
                            fill="none"
                            stroke={k.farge}
                            strokeWidth={5}
                            strokeLinecap="round"
                        />
                    </motion.g>
                );
            })}
            <motion.text
                x={800}
                y={KY + 210}
                textAnchor="middle"
                fontSize={34}
                fontWeight={700}
                fill="#475569"
                style={FONT}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                Ulik handling i hver eneste fortelling
            </motion.text>
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect x={430} y={TY - 70} width={740} height={140} rx={70} fill="#7c3aed" />
                    <text
                        x={800}
                        y={TY - 8}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#ffffff"
                        style={FONT}
                    >
                        Universelle temaer
                    </text>
                    <text
                        x={800}
                        y={TY + 40}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={600}
                        fill="#ede9fe"
                        style={FONT}
                    >
                        alle kjenner dem igjen, uansett tid og sted
                    </text>
                </motion.g>
            )}
            {beat >= 2 &&
                TEMAER.map((t, i) => (
                    <motion.g
                        key={t.tekst}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 + i * 0.6 }}
                    >
                        <rect
                            x={t.x - 150}
                            y={TY - 56}
                            width={300}
                            height={112}
                            rx={56}
                            fill="#7c3aed"
                        />
                        <text
                            x={t.x}
                            y={TY + 16}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#ffffff"
                            style={FONT}
                        >
                            {t.tekst}
                        </text>
                    </motion.g>
                ))}
            {beat >= 3 && (
                <motion.text
                    x={800}
                    y={110}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill="#1e293b"
                    style={FONT}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    Skrevet om i tusenvis av år, ofte flere i samme tekst
                </motion.text>
            )}
        </svg>
    );
}

const PAR = [
    { tema: 'Kjærlighet', budskap: 'Den sanne kjærligheten krever oppofrelse.', farge: '#be185d' },
    { tema: 'Miljøvern', budskap: 'Menneskets grådighet ødelegger naturen vår.', farge: '#15803d' },
    { tema: 'Ansvar', budskap: 'Små valg kan få følger som ikke kan gjøres om.', farge: '#1d4ed8' },
];

function Par({ beat }: { beat: number }) {
    return (
        <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            <text
                x={300}
                y={130}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#7c3aed"
                style={FONT}
            >
                Tema: ett ord
            </text>
            <text
                x={1040}
                y={130}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#b45309"
                style={FONT}
            >
                Budskap: en hel setning
            </text>
            {PAR.map((p, i) => {
                const y = 250 + i * 210;
                const vist = beat >= i + 1;
                const fokus = beat === i + 1;
                return (
                    <g key={p.tema} opacity={vist ? 1 : 0.25}>
                        <motion.rect
                            x={120}
                            y={y - 60}
                            width={360}
                            height={120}
                            rx={60}
                            initial={false}
                            animate={{ fill: vist ? p.farge : '#e2e8f0' }}
                            transition={{ duration: 0.5 }}
                        />
                        <text
                            x={300}
                            y={y + 17}
                            textAnchor="middle"
                            fontSize={46}
                            fontWeight={900}
                            fill={vist ? '#ffffff' : '#94a3b8'}
                            style={FONT}
                        >
                            {vist ? p.tema : '?'}
                        </text>
                        <line x1={500} y1={y} x2={560} y2={y} stroke="#94a3b8" strokeWidth={6} />
                        <polygon
                            points={`${580},${y} ${556},${y - 16} ${556},${y + 16}`}
                            fill="#94a3b8"
                        />
                        <rect
                            x={600}
                            y={y - 70}
                            width={900}
                            height={140}
                            rx={28}
                            fill="#ffffff"
                            stroke={fokus ? p.farge : '#e2ddd2'}
                            strokeWidth={fokus ? 6 : 3}
                        />
                        {vist && (
                            <motion.text
                                x={1050}
                                y={y + 14}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={700}
                                fill="#1e293b"
                                style={FONT}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                {p.budskap}
                            </motion.text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

export function TemaTraaden({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'universell';
    return (
        <div className="absolute inset-0" style={{ background: '#f5f3ee' }}>
            {modus === 'universell' ? <Universell beat={beat} /> : <Par beat={beat} />}
        </div>
    );
}
