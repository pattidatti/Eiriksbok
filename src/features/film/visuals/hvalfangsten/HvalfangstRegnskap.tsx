import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvalregnskapet: til venstre en flokk hval (bestanden), til høyre en kurve over
 * sesongene. Stor kvote: kurven stuper og flokken tømmes. Liten kvote: den holder seg.
 * Tallene er bare et bilde på regnestykket, så aksene har ingen tall.
 */

const B = 1600;
const H = 900;
const ANTALL = 40;
const SESONGER = 20;

/** Bestanden sesong for sesong, som andel av start (0-1). */
function kurve(fangst: number, fodsel: number) {
    const ut = [1];
    for (let i = 1; i <= SESONGER; i++) {
        const n = ut[i - 1];
        ut.push(Math.max(0, Math.min(1, n + n * fodsel * (1 - n / 1.05) - fangst)));
    }
    return ut;
}
const STOR = kurve(0.11, 0.12);
const LITEN = kurve(0.02, 0.12);

const GX = 860;
const GY = 220;
const GB = 640;
const GH = 480;

function linje(data: number[], andel: number) {
    const n = Math.max(1, Math.round(andel * SESONGER));
    return data
        .slice(0, n + 1)
        .map((y, i) => `${i === 0 ? 'M' : 'L'} ${GX + (i / SESONGER) * GB} ${GY + GH - y * GH}`)
        .join(' ');
}

function HvalIkon({ farge }: { farge: string }) {
    return (
        <path
            d="M 0 10 C 6 2 28 0 46 3 L 56 -4 C 58 2 58 6 56 9 C 58 12 58 16 56 22 L 46 15 C 30 20 8 20 0 10 Z"
            fill={farge}
        />
    );
}

export function HvalfangstRegnskap({ beat, playing }: VisualProps) {
    const [stor, setStor] = useState(0);
    const [liten, setLiten] = useState(0);
    useEffect(() => {
        const målStor = beat >= 2 ? 1 : 0;
        const målLiten = beat >= 4 ? 1 : 0;
        // På pause hopper kurven rett til målet.
        const a = animate(0, målStor, {
            duration: playing && beat === 2 ? 5 : 0.01,
            onUpdate: setStor,
        });
        const b = animate(0, målLiten, {
            duration: playing && beat === 4 ? 4 : 0.01,
            onUpdate: setLiten,
        });
        return () => {
            a.stop();
            b.stop();
        };
    }, [beat, playing]);

    // Flokken følger den kurven som tegnes nå.
    const aktiv =
        beat >= 4 ? LITEN[Math.round(liten * SESONGER)] : STOR[Math.round(stor * SESONGER)];
    const igjen = Math.round(aktiv * ANTALL);

    const tekst = [
        'Nye hval blir født hvert år',
        'Blåhval: én unge hvert 2. eller 3. år',
        'Bestand = antall hval i havet',
        'Mer ut enn inn: tomt til slutt',
        'Kvote = grense for fangst',
    ][beat];

    return (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-slate-100">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Flokken */}
                <text
                    x={360}
                    y={190}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#334155"
                >
                    Hval i havet
                </text>
                {Array.from({ length: ANTALL }, (_, i) => {
                    const kol = i % 5;
                    const rad = Math.floor(i / 5);
                    const lever = i < igjen;
                    const ny = beat <= 1 && i >= ANTALL - (beat === 0 ? 4 : 1);
                    return (
                        <g
                            key={i}
                            transform={`translate(${150 + kol * 90} ${230 + rad * 72}) scale(1.3)`}
                        >
                            <motion.g
                                animate={{ opacity: lever ? 1 : 0.12 }}
                                transition={{ duration: 0.4 }}
                            >
                                <HvalIkon
                                    farge={ny ? '#0d9488' : beat >= 4 ? '#0f766e' : '#334155'}
                                />
                            </motion.g>
                        </g>
                    );
                })}
                {beat === 3 && (
                    <motion.g
                        initial={{ opacity: 0, scale: 1.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ originX: '360px', originY: '520px' }}
                    >
                        <g transform="rotate(-8 360 520)">
                            <rect
                                x={180}
                                y={460}
                                width={360}
                                height={120}
                                rx={16}
                                fill="#ffffff"
                                fillOpacity={0.85}
                                stroke="#dc2626"
                                strokeWidth={10}
                            />
                            <text
                                x={360}
                                y={548}
                                textAnchor="middle"
                                fontSize={80}
                                fontWeight={900}
                                fill="#dc2626"
                            >
                                TOMT
                            </text>
                        </g>
                    </motion.g>
                )}
                {beat <= 1 && (
                    <motion.text
                        key={beat}
                        x={360}
                        y={850}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#0d9488"
                        initial={{ opacity: 0, y: 870 }}
                        animate={{ opacity: 1, y: 850 }}
                    >
                        {beat === 0 ? '+ nye unger' : '+ bare én unge'}
                    </motion.text>
                )}

                {/* Kurven */}
                <line x1={GX} y1={GY} x2={GX} y2={GY + GH} stroke="#94a3b8" strokeWidth={4} />
                <line
                    x1={GX}
                    y1={GY + GH}
                    x2={GX + GB}
                    y2={GY + GH}
                    stroke="#94a3b8"
                    strokeWidth={4}
                />
                <text
                    x={GX + GB / 2}
                    y={GY + GH + 50}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#64748b"
                >
                    sesonger →
                </text>
                <text x={GX - 20} y={GY - 20} fontSize={28} fontWeight={700} fill="#64748b">
                    bestanden
                </text>
                {beat < 2 && (
                    <line
                        x1={GX}
                        y1={GY}
                        x2={GX + GB}
                        y2={GY}
                        stroke="#334155"
                        strokeWidth={6}
                        strokeDasharray="4 12"
                    />
                )}
                {beat >= 2 && (
                    <>
                        <path
                            d={linje(STOR, stor)}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={8}
                            strokeLinejoin="round"
                        />
                        <text
                            x={GX + GB - 10}
                            y={GY + GH - 20}
                            textAnchor="end"
                            fontSize={30}
                            fontWeight={900}
                            fill="#dc2626"
                            opacity={stor > 0.9 ? 1 : 0}
                        >
                            stor kvote
                        </text>
                    </>
                )}
                {beat >= 4 && (
                    <>
                        <path
                            d={linje(LITEN, liten)}
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth={8}
                            strokeLinejoin="round"
                        />
                        <text
                            x={GX + GB - 10}
                            y={GY + GH - LITEN[SESONGER] * GH - 24}
                            textAnchor="end"
                            fontSize={30}
                            fontWeight={900}
                            fill="#0d9488"
                            opacity={liten > 0.9 ? 1 : 0}
                        >
                            liten kvote
                        </text>
                    </>
                )}
            </svg>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
