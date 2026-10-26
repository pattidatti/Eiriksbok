import { useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationFrame } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Datoer som skulle bli slutten. «regnestykker»: Newtons 800 + 1260 = 2060 på en tidslinje,
 * så William Miller, den store skuffelsen og de som var igjen. «y2k»: klokka ved
 * tusenårsskiftet, der to sifre kunne bli lest som 1900.
 */

type Modus = 'regnestykker' | 'y2k';

const B = 1600;
const H = 900;

const OVERSKRIFT: Record<Modus, string[]> = {
    regnestykker: ['Kan man regne ut slutten?', 'Newtons regnestykke', 'Ny tidsalder, ikke undergang', 'William Miller, USA', 'Den store skuffelsen', 'Noen ga ikke opp'],
    y2k: ['Tusenårsskiftet', 'Bare to sifre', 'Svikter alt?', 'Nesten ingenting skjedde', 'Hvem hadde rett?'],
};

/** Tidslinje fra `fra` til `til` over bildet. */
function lagX(fra: number, til: number) {
    return (aar: number) => 140 + ((aar - fra) / (til - fra)) * 1320;
}

const FOLK = Array.from({ length: 180 }, (_, i) => {
    const r = (n: number) => {
        const x = Math.sin(n * 57.3 + 7.7) * 43758.5453;
        return x - Math.floor(x);
    };
    return { x: 240 + (i % 30) * 38 + r(i) * 10, y: 250 + Math.floor(i / 30) * 40 + r(i + 9) * 8 };
});

function Regnestykker({ beat }: { beat: number }) {
    const y = 640;
    if (beat <= 2) {
        const x = lagX(700, 2150);
        return (
            <g>
                <line x1={120} y1={y} x2={1480} y2={y} stroke="#334155" strokeWidth={6} />
                {[1000, 1500, 2000].map((a) => (
                    <g key={a}>
                        <line x1={x(a)} y1={y - 14} x2={x(a)} y2={y + 14} stroke="#334155" strokeWidth={4} />
                        <text x={x(a)} y={y + 54} textAnchor="middle" fontSize={30} fontWeight={700} fill="#64748b">
                            {a}
                        </text>
                    </g>
                ))}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={430} y={190} width={740} height={210} rx={30} fill="#fffbeb" stroke="#b45309" strokeWidth={5} />
                    <text x={800} y={275} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a">
                        Isaac Newton
                    </text>
                    <text x={800} y={345} textAnchor="middle" fontSize={34} fontWeight={700} fill="#92400e">
                        {beat === 0 ? 'advarte selv mot å sette datoer' : beat === 1 ? '800 + 1260 år' : '800 + 1260 = 2060'}
                    </text>
                </motion.g>
                {beat >= 1 && (
                    <g>
                        <circle cx={x(800)} cy={y} r={20} fill="#0f172a" />
                        <text x={x(800)} y={y - 40} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                            800
                        </text>
                        <motion.rect
                            x={x(800)}
                            y={y - 16}
                            height={32}
                            rx={16}
                            fill="#d97706"
                            initial={{ width: beat === 1 ? 0 : x(2060) - x(800) }}
                            animate={{ width: x(2060) - x(800) }}
                            transition={{ duration: 3, delay: 0.6, ease: 'easeInOut' }}
                        />
                        <text x={(x(800) + x(2060)) / 2} y={y + 110} textAnchor="middle" fontSize={46} fontWeight={900} fill="#b45309">
                            {beat === 1 ? <TelleTall verdi={1260} varighet={3} forsinkelse={0.6} /> : '1260'} år
                        </text>
                    </g>
                )}
                {beat >= 2 && (
                    <motion.g initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                        <circle cx={x(2060)} cy={y} r={34} fill="#0f766e" stroke="#fff" strokeWidth={6} />
                        <text x={x(2060)} y={y - 60} textAnchor="middle" fontSize={72} fontWeight={900} fill="#0f766e">
                            2060
                        </text>
                    </motion.g>
                )}
            </g>
        );
    }
    const x = lagX(1830, 1875);
    return (
        <g>
            <line x1={120} y1={y + 80} x2={1480} y2={y + 80} stroke="#334155" strokeWidth={6} />
            {[1843, 1844].map((a, i) => (
                <g key={a}>
                    <circle cx={x(a)} cy={y + 80} r={18} fill="#1d4ed8" />
                    <text x={x(a) + (i ? 20 : -20)} y={y + 140} textAnchor={i ? 'start' : 'end'} fontSize={40} fontWeight={900} fill="#1d4ed8">
                        {a}
                    </text>
                </g>
            ))}
            {beat === 3 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <rect x={430} y={300} width={740} height={170} rx={30} fill="#eff6ff" stroke="#1d4ed8" strokeWidth={5} />
                    <text x={800} y={372} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                        William Miller
                    </text>
                    <text x={800} y={432} textAnchor="middle" fontSize={34} fontWeight={700} fill="#1e3a8a">
                        Jesus kommer tilbake i 1843 eller 1844
                    </text>
                </motion.g>
            )}
            {beat >= 4 &&
                FOLK.map((p, i) => {
                    const igjen = i % 9 === 0;
                    return (
                        <motion.circle
                            key={i}
                            cx={p.x}
                            r={12}
                            initial={{ opacity: 0, cy: p.y + 30 }}
                            animate={{
                                opacity: beat >= 5 && !igjen ? 0.12 : 1,
                                cy: p.y,
                                fill: beat >= 5 && igjen ? '#0f766e' : '#475569',
                            }}
                            transition={{ delay: beat === 4 ? i * 0.006 : 0, duration: 0.6 }}
                        />
                    );
                })}
            {beat === 4 && (
                <motion.g initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6, type: 'spring' }}>
                    <rect x={430} y={300} width={740} height={130} rx={18} fill="#ffffff" stroke="#b91c1c" strokeWidth={10} transform="rotate(-5 800 365)" />
                    <text x={800} y={386} textAnchor="middle" fontSize={60} fontWeight={900} fill="#b91c1c" transform="rotate(-5 800 365)">
                        DEN STORE SKUFFELSEN
                    </text>
                </motion.g>
            )}
            {beat === 4 && (
                <text x={800} y={215} textAnchor="middle" fontSize={36} fontWeight={800} fill="#334155">
                    titusener trodde på ham, så sluttet de fleste
                </text>
            )}
            {beat >= 5 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <text x={800} y={215} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f766e">
                        ca. 3500 var igjen
                    </text>
                    <circle cx={x(1863)} cy={y + 80} r={20} fill="#0f766e" />
                    <text x={x(1863)} y={y + 140} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f766e">
                        1863
                    </text>
                    <text x={x(1863)} y={y + 30} textAnchor="middle" fontSize={30} fontWeight={800} fill="#0f172a">
                        adventistene
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Skjerm({ x, y, ok, blink }: { x: number; y: number; ok: boolean; blink: boolean }) {
    return (
        <g>
            <rect x={x - 90} y={y - 60} width={180} height={120} rx={12} fill="#0f172a" />
            <rect x={x - 76} y={y - 48} width={152} height={96} rx={6} fill={ok ? '#bbf7d0' : '#fecaca'} />
            <rect x={x - 30} y={y + 60} width={60} height={22} fill="#334155" />
            <text x={x} y={y + 24} textAnchor="middle" fontSize={70} fontWeight={900} fill={ok ? '#15803d' : '#b91c1c'} opacity={blink ? 0.3 : 1}>
                {ok ? '✓' : '!'}
            </text>
        </g>
    );
}

function Y2k({ beat, playing }: { beat: number; playing: boolean }) {
    const [sek, setSek] = useState(50);
    const [blink, setBlink] = useState(false);
    const start = useRef<number | null>(null);
    useAnimationFrame((tid) => {
        if (!playing) return;
        if (start.current === null) start.current = tid;
        const s = (tid - start.current) / 1000;
        setSek(50 + (Math.floor(s / 0.8) % 10));
        setBlink(Math.floor(s * 2.5) % 2 === 0);
    });
    const etter = beat >= 3;
    const dato = etter ? '01.01.00' : '31.12.99';
    const tid = etter ? '00.00.00' : `23.59.${sek}`;
    return (
        <g>
            <rect x={300} y={170} width={1000} height={240} rx={30} fill="#0b1220" stroke="#334155" strokeWidth={6} />
            <text x={800} y={265} textAnchor="middle" fontSize={84} fontWeight={800} fill="#4ade80" fontFamily="ui-monospace, monospace">
                {beat === 1 ? '31.12.' : dato.slice(0, 6)}
                <tspan fill={beat === 1 ? '#facc15' : '#4ade80'}>{beat === 1 ? '00' : dato.slice(6)}</tspan>
            </text>
            <text x={800} y={370} textAnchor="middle" fontSize={84} fontWeight={800} fill="#4ade80" fontFamily="ui-monospace, monospace">
                {tid}
            </text>
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <rect x={888} y={190} width={124} height={96} rx={12} fill="none" stroke="#facc15" strokeWidth={6} />
                    <text x={950} y={460} textAnchor="middle" fontSize={36} fontWeight={800} fill="#a16207">
                        bare to sifre
                    </text>
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}>
                        <rect x={360} y={500} width={380} height={170} rx={28} fill="#fee2e2" stroke="#b91c1c" strokeWidth={6} />
                        <text x={550} y={610} textAnchor="middle" fontSize={84} fontWeight={900} fill="#b91c1c">
                            1900?
                        </text>
                    </motion.g>
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }}>
                        <rect x={860} y={500} width={380} height={170} rx={28} fill="#dcfce7" stroke="#15803d" strokeWidth={6} />
                        <text x={1050} y={610} textAnchor="middle" fontSize={84} fontWeight={900} fill="#15803d">
                            2000
                        </text>
                    </motion.g>
                </motion.g>
            )}
            {(beat === 2 || beat === 3) &&
                [0, 1, 2, 3, 4].map((i) => (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: beat === 2 ? 0.3 + i * 0.3 : 0 }}>
                        <Skjerm x={320 + i * 240} y={600} ok={beat === 3} blink={beat === 2 && blink} />
                    </motion.g>
                ))}
            {beat === 0 && (
                <motion.text x={800} y={600} textAnchor="middle" fontSize={44} fontWeight={800} fill="#334155" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    datamaskinene teller ned
                </motion.text>
            )}
            {beat === 4 && (
                <g>
                    <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <rect x={180} y={500} width={560} height={200} rx={28} fill="#ffffff" stroke="#0f766e" strokeWidth={6} />
                        <text x={460} y={585} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f766e">
                            Forberedelsene
                        </text>
                        <text x={460} y={640} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f766e">
                            reddet oss?
                        </text>
                    </motion.g>
                    <text x={800} y={640} textAnchor="middle" fontSize={110} fontWeight={900} fill="#334155">
                        ?
                    </text>
                    <motion.g initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>
                        <rect x={860} y={500} width={560} height={200} rx={28} fill="#ffffff" stroke="#b45309" strokeWidth={6} />
                        <text x={1140} y={585} textAnchor="middle" fontSize={40} fontWeight={900} fill="#b45309">
                            Faren var aldri
                        </text>
                        <text x={1140} y={640} textAnchor="middle" fontSize={40} fontWeight={900} fill="#b45309">
                            så stor?
                        </text>
                    </motion.g>
                </g>
            )}
        </g>
    );
}

export function EskatologiTeller({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'regnestykker';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f1f5f9' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'regnestykker' ? <Regnestykker beat={beat} /> : <Y2k beat={beat} playing={playing} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '4%' }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
