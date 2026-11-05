import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Brutto og netto som en pizza. Hele pizzaen er bruttolønnen. Staten tar noen stykker
 * (trekket), og stykkene som blir igjen på tallerkenen er nettolønnen.
 */

const CX = 560;
const CY = 530;
const R = 230;
const STYKKER = 8;
/** Stykkene staten tar. Bare et bilde: hvor mange som trekkes, står på skattekortet. */
const TATT = new Set([1, 2, 3]);
const STATEN = { x: 1250, y: 470 };

function kile(i: number) {
    const a0 = (i / STYKKER) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / STYKKER) * Math.PI * 2 - Math.PI / 2;
    const p = (a: number, r: number) => `${CX + Math.cos(a) * r} ${CY + Math.sin(a) * r}`;
    return `M ${CX} ${CY} L ${p(a0, R)} A ${R} ${R} 0 0 1 ${p(a1, R)} Z`;
}

/** Midtpunktet i et stykke, brukt til pepperoni og flytting. */
function midt(i: number, r = R * 0.6) {
    const a = ((i + 0.5) / STYKKER) * Math.PI * 2 - Math.PI / 2;
    return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
}

function Tekst({
    x,
    y,
    vis,
    children,
    farge = '#0f172a',
    str = 44,
    vekt = 800,
}: {
    x: number;
    y: number;
    vis: boolean;
    children: string;
    farge?: string;
    str?: number;
    vekt?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.text>
    );
}

export function LonnsslippenPizza({ beat }: VisualProps) {
    const tatt = beat >= 2;
    return (
        <div className="absolute inset-0" style={{ background: '#fff7ed' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Tekst x={800} y={90} vis str={56} vekt={900}>
                    {beat === 0
                        ? 'Lønnen er en pizza'
                        : beat === 1
                          ? 'Brutto: hele pizzaen'
                          : beat === 2
                            ? 'Trekket: stykkene staten tar'
                            : beat === 3
                              ? 'Netto: det du får'
                              : 'Alltid samme regnestykke'}
                </Tekst>

                {/* Tallerkenen */}
                <motion.ellipse
                    cx={CX}
                    cy={CY + 10}
                    rx={R + 40}
                    ry={R + 40}
                    fill="#e2e8f0"
                    stroke="#cbd5e1"
                    strokeWidth={6}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 3 ? 1 : 0 }}
                />

                {/* Statens fat */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: tatt ? 1 : 0 }}>
                    <rect
                        x={STATEN.x - 190}
                        y={STATEN.y - 150}
                        width={380}
                        height={300}
                        rx={28}
                        fill="#e7e5e4"
                        stroke="#a8a29e"
                        strokeWidth={4}
                    />
                </motion.g>
                <Tekst x={STATEN.x} y={STATEN.y - 175} vis={tatt} farge="#57534e">
                    Staten
                </Tekst>

                {Array.from({ length: STYKKER }, (_, i) => {
                    const m = midt(i);
                    const flytt = tatt && TATT.has(i);
                    // Stykkene samles på statens fat.
                    const dx = flytt ? STATEN.x - 30 + (i - 2) * 40 - m.x : 0;
                    const dy = flytt ? STATEN.y - m.y + (i - 2) * 30 : 0;
                    return (
                        <motion.g
                            key={i}
                            initial={false}
                            animate={{ x: dx, y: dy, opacity: 1 }}
                            transition={{
                                type: 'spring',
                                stiffness: 60,
                                damping: 16,
                                delay: flytt ? (i - 1) * 0.25 : 0,
                            }}
                        >
                            <path d={kile(i)} fill="#fbbf24" stroke="#b45309" strokeWidth={5} />
                            <circle cx={m.x} cy={m.y} r={24} fill="#b91c1c" />
                            <circle
                                cx={midt(i, R * 0.32).x}
                                cy={midt(i, R * 0.32).y}
                                r={16}
                                fill="#b91c1c"
                            />
                        </motion.g>
                    );
                })}

                {/* Merkelapper */}
                <Tekst x={CX} y={CY + R + 100} vis={beat === 1} farge="#92400e">
                    Bruttolønn: 13 200 kr
                </Tekst>
                <Tekst x={STATEN.x} y={STATEN.y + 210} vis={tatt} farge="#dc2626">
                    Trekk
                </Tekst>
                <Tekst x={CX} y={CY + R + 100} vis={beat >= 3} farge="#0f766e">
                    Netto: inn på kontoen
                </Tekst>

                {/* Regnestykket */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 4 ? 1 : 0 }}>
                    <rect
                        x={330}
                        y={130}
                        width={940}
                        height={100}
                        rx={24}
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth={4}
                    />
                </motion.g>
                <Tekst x={800} y={198} vis={beat >= 4} str={52} vekt={900}>
                    brutto − trekk = netto
                </Tekst>
            </svg>
        </div>
    );
}
