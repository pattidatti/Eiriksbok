import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Tromsø som en sluse: de evakuerte strømmer inn til byen, og derfra videre til Nordland og
 * Troms eller helt til Sør-Norge. Nederst fylles en stripe med måneder borte fra hjemmet.
 */

const BLEKK = '#0f172a';
const RAV = '#f59e0b';
const BLA = '#38bdf8';
const GRONN = '#34d399';

const TROMSO = { x: 400, y: 360 };

/** Prikker som glir inn mot Tromsø fra venstre (fra Finnmark). Står stille på pause. */
function Strom({ playing }: { playing: boolean }) {
    return (
        <g>
            {Array.from({ length: 10 }, (_, i) => {
                const y = TROMSO.y - 90 + (i % 5) * 45;
                const start = 20 + (i % 3) * 20;
                return (
                    <motion.circle
                        key={i}
                        cy={y}
                        r={10}
                        fill={RAV}
                        initial={{ cx: start, opacity: 0 }}
                        animate={
                            playing
                                ? { cx: [start, TROMSO.x - 190], opacity: [0, 1, 0] }
                                : { cx: start + 30 + (i % 4) * 30, opacity: 0.9 }
                        }
                        transition={
                            playing
                                ? { duration: 2.4, delay: i * 0.25, repeat: Infinity, ease: 'linear' }
                                : { duration: 0.3 }
                        }
                    />
                );
            })}
        </g>
    );
}

function Gren({ d, farge }: { d: string; farge: string }) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={26}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
    );
}

function Mal({
    y,
    farge,
    navn,
    tall,
    under,
}: {
    y: number;
    farge: string;
    navn: string;
    tall: ReactNode;
    under?: string;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 160, damping: 20 }}
        >
            <rect x={960} y={y} width={560} height={220} rx={24} fill="#ffffff" />
            <rect x={960} y={y} width={18} height={220} rx={6} fill={farge} />
            <text x={1010} y={y + 62} fontSize={40} fontWeight={900} fill={BLEKK}>
                {navn}
            </text>
            <text x={1010} y={y + 140} fontSize={64} fontWeight={900} fill={BLEKK}>
                {tall}
            </text>
            {under && (
                <text x={1010} y={y + 192} fontSize={30} fontWeight={700} fill="#475569">
                    {under}
                </text>
            )}
        </motion.g>
    );
}

export function FinnmarkFordeling({ beat, playing }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {beat === 0 && <Strom playing={playing} />}
                {beat >= 1 && (
                    <Gren d={`M ${TROMSO.x + 150} ${TROMSO.y - 40} C 700 200, 820 170, 960 170`} farge={GRONN} />
                )}
                {beat >= 2 && (
                    <Gren d={`M ${TROMSO.x + 150} ${TROMSO.y + 40} C 700 420, 820 450, 960 450`} farge={BLA} />
                )}

                <circle cx={TROMSO.x} cy={TROMSO.y} r={170} fill="#ffffff" />
                <circle cx={TROMSO.x} cy={TROMSO.y} r={170} fill="none" stroke={RAV} strokeWidth={10} />
                <text x={TROMSO.x} y={TROMSO.y + 24} textAnchor="middle" fontSize={70} fontWeight={900} fill={BLEKK}>
                    Tromsø
                </text>
                {beat === 0 ? (
                    <>
                        <text x={TROMSO.x} y={TROMSO.y + 290} textAnchor="middle" fontSize={68} fontWeight={900} fill="#ffffff">
                            over <TelleTall verdi={30000} />
                        </text>
                        <text x={TROMSO.x} y={TROMSO.y + 336} textAnchor="middle" fontSize={30} fontWeight={700} fill="#cbd5e1">
                            evakuerte, bare i november 1944
                        </text>
                    </>
                ) : (
                    <motion.text
                        x={TROMSO.x}
                        y={TROMSO.y + 290}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={900}
                        fill="#ffffff"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Hvor havnet de evakuerte?
                    </motion.text>
                )}

                {beat >= 1 && <Mal y={60} farge={GRONN} navn="Nordland og Troms" tall="litt over 70 %" />}
                {beat >= 2 && (
                    <Mal
                        y={340}
                        farge={BLA}
                        navn="Helt til Sør-Norge"
                        tall={
                            <>
                                ca. <TelleTall verdi={18000} />
                            </>
                        }
                        under="de fleste til Østlandet"
                    />
                )}

                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        <text x={960} y={650} fontSize={40} fontWeight={900} fill="#ffffff">
                            Borte fra hjemmet:
                        </text>
                        {Array.from({ length: 7 }, (_, i) => (
                            <motion.rect
                                key={i}
                                x={960 + i * 80}
                                y={680}
                                width={i === 6 ? 34 : 70}
                                height={70}
                                rx={10}
                                fill={RAV}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.35 }}
                                style={{ transformOrigin: `${995 + i * 80}px 715px` }}
                            />
                        ))}
                        <motion.text
                            x={960}
                            y={810}
                            fontSize={46}
                            fontWeight={900}
                            fill={RAV}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.8 }}
                        >
                            over et halvt år
                        </motion.text>
                        <text x={960} y={856} fontSize={26} fontWeight={700} fill="#94a3b8">
                            én rute per måned
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
