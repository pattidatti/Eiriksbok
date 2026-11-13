import { useEffect, useRef } from 'react';
import { animate, AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Gisselkrisen i Teheran, i tre beats:
 * 0: USAs ambassade i Teheran. Studentene står ved gjerdet, porten går opp.
 * 1: 52 figurer, én per gissel, og en teller som går fra 0 til 444 dager.
 * 2: Ambassaden dempes. Iran og USA står hver for seg, og båndet mellom dem ryker.
 * Hver beat tegnes ferdig fra start, så det tåler at eleven hopper rett inn.
 */

const GISLER = 52;
const DAGER = 444;
const GULV = 760;

const TEKST = [
    { tekst: 'USAs ambassade i Teheran' },
    { tekst: '52 gisler i 444 dager', rod: true },
    { tekst: 'Iran og USA: fra venner til fiender', rod: true },
];

export function AjaxAmbassaden({ beat }: VisualProps) {
    const b = Math.min(beat, TEKST.length - 1);
    const t = TEKST[b];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#1e293b' }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id="ajax-amb-himmel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#9a3412" />
                    </linearGradient>
                </defs>
                <rect x={0} y={0} width={1600} height={GULV} fill="url(#ajax-amb-himmel)" />
                <rect x={0} y={GULV} width={1600} height={140} fill="#57534e" />
                {/* Fjellene nord for Teheran */}
                <path
                    d="M 0 520 L 180 380 L 330 470 L 520 330 L 700 450 L 880 360 L 1060 470 L 1260 340 L 1440 450 L 1600 390 L 1600 760 L 0 760 Z"
                    fill="#334155"
                    opacity={0.7}
                />

                <motion.g animate={{ opacity: b === 2 ? 0.2 : 1 }} transition={{ duration: 1 }}>
                    <Bygning modus={b} />
                </motion.g>

                {b === 0 && <Porten />}
                {b === 1 && <Gisler />}
                {b === 2 && <Fiender />}
            </svg>
            {b === 1 && <Dagteller />}
            <AnimatePresence mode="wait">
                <motion.div
                    key={b}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Ambassaden: en lav, hvit murbygning med flaggstang. Står til venstre når gislene vises. */
function Bygning({ modus }: { modus: number }) {
    const x = modus === 1 ? 0 : 420;
    return (
        <motion.g initial={false} animate={{ x: x - 420 }} transition={{ duration: 0.9 }}>
            <rect
                x={420}
                y={420}
                width={760}
                height={340}
                fill="#e7e5e4"
                stroke="#78716c"
                strokeWidth={5}
            />
            <rect
                x={400}
                y={400}
                width={800}
                height={30}
                fill="#d6d3d1"
                stroke="#78716c"
                strokeWidth={5}
            />
            {Array.from({ length: 2 }, (_, r) =>
                Array.from({ length: 7 }, (_, c) => (
                    <rect
                        key={`${r}-${c}`}
                        x={460 + c * 100}
                        y={460 + r * 120}
                        width={56}
                        height={80}
                        fill={modus === 1 ? '#fbbf24' : '#475569'}
                        opacity={0.9}
                    />
                ))
            )}
            <rect x={760} y={680} width={80} height={80} fill="#44403c" />
            {/* Flaggstang med det amerikanske flagget, forenklet */}
            <rect x={1220} y={250} width={10} height={510} fill="#a8a29e" />
            <rect x={1230} y={258} width={150} height={92} fill="#f8fafc" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <rect key={i} x={1230} y={258 + i * 13.2} width={150} height={6.6} fill="#b91c1c" />
            ))}
            <rect x={1230} y={258} width={64} height={46} fill="#1e3a8a" />
        </motion.g>
    );
}

/** Gjerdet og porten som åpnes, med en tett, utellbar mengde studenter foran. */
function Porten() {
    return (
        <g>
            {Array.from({ length: 30 }, (_, i) => (
                <rect key={i} x={220 + i * 40} y={600} width={8} height={160} fill="#1c1917" />
            ))}
            <rect x={220} y={600} width={1180} height={10} fill="#1c1917" />
            <motion.g
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.15 }}
                transition={{ delay: 1, duration: 1.2 }}
            >
                <rect x={740} y={606} width={120} height={154} fill="#292524" />
            </motion.g>
            {/* Folkemengden: silhuetter i flere rader, for tett til å telles */}
            {Array.from({ length: 3 }, (_, r) =>
                Array.from({ length: 26 }, (_, i) => {
                    const x = 200 + i * 47 + (r % 2) * 22;
                    const y = 820 + r * 26;
                    return (
                        <g key={`${r}-${i}`}>
                            <circle
                                cx={x}
                                cy={y - 70}
                                r={15}
                                fill={r === 2 ? '#0c0a09' : '#292524'}
                            />
                            <rect
                                x={x - 17}
                                y={y - 56}
                                width={34}
                                height={60}
                                rx={12}
                                fill={r === 2 ? '#0c0a09' : '#292524'}
                            />
                        </g>
                    );
                })
            )}
            <text
                x={800}
                y={370}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#ffffff"
                stroke="#1c1917"
                strokeWidth={9}
                paintOrder="stroke"
            >
                Sinte studenter
            </text>
        </g>
    );
}

/** 52 figurer i et rutenett på 13 x 4, én per gissel. */
function Gisler() {
    return (
        <g>
            <rect x={990} y={110} width={580} height={560} rx={24} fill="#0f172a" opacity={0.85} />
            {Array.from({ length: GISLER }, (_, i) => {
                const k = i % 13;
                const r = Math.floor(i / 13);
                const x = 1030 + k * 41.7;
                const y = 170 + r * 84;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.02 }}
                    >
                        <circle cx={x} cy={y} r={11} fill="#fca5a5" />
                        <rect x={x - 13} y={y + 14} width={26} height={40} rx={10} fill="#dc2626" />
                    </motion.g>
                );
            })}
        </g>
    );
}

/** Telleren skrives direkte via ref, ikke via state (se guiden §3c punkt 27). */
function Dagteller() {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const kontroll = animate(0, DAGER, {
            duration: 2.4,
            delay: 0.6,
            ease: 'easeOut',
            onUpdate: (v) => {
                if (ref.current) ref.current.textContent = String(Math.round(v));
            },
        });
        return () => kontroll.stop();
    }, []);
    return (
        <div className="absolute" style={{ left: '61.875%', top: '57%', width: '36.25%' }}>
            <div className="flex items-baseline justify-center gap-3 text-white font-display font-black">
                <span ref={ref} style={{ fontSize: '4.5rem', lineHeight: 1 }}>
                    0
                </span>
                <span className="text-3xl">dager</span>
            </div>
        </div>
    );
}

/** Iran og USA hver for seg. Båndet mellom dem ryker. */
function Fiender() {
    return (
        <g>
            <Land x={420} navn="Iran" farge="#16a34a" />
            <Land x={1180} navn="USA" farge="#2563eb" />
            <motion.line
                x1={560}
                y1={420}
                x2={790}
                y2={420}
                stroke="#e2e8f0"
                strokeWidth={14}
                strokeLinecap="round"
                initial={false}
                animate={{ x2: 770 }}
            />
            <motion.line
                x1={810}
                y1={420}
                x2={1040}
                y2={420}
                stroke="#e2e8f0"
                strokeWidth={14}
                strokeLinecap="round"
                initial={false}
                animate={{ x1: 830 }}
            />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <path
                    d="M 780 360 L 810 400 L 790 430 L 820 480"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </motion.g>
        </g>
    );
}

function Land({ x, navn, farge }: { x: number; navn: string; farge: string }) {
    return (
        <g>
            <circle cx={x} cy={420} r={140} fill={farge} stroke="#f8fafc" strokeWidth={8} />
            <text x={x} y={442} textAnchor="middle" fontSize={64} fontWeight={900} fill="#ffffff">
                {navn}
            </text>
        </g>
    );
}
