import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DELFARGE, type Del } from './data';

/** Felles biter for 2D-scenene i filmen: overskriften øverst, mobilen og glidende varer. */

/** Overskrift øverst i midten. Bytter med en kort inntoning når teksten endrer seg. */
export function Overskrift({ tekst, rod }: { tekst: string; rod?: boolean }) {
    return (
        <AnimatePresence mode="wait">
            {tekst && (
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {tekst}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Mobilen sett som en sprengskisse: høyttaler og vibrator (magneter av sjeldne jordarter),
 * batteriet (kobolt), databrikken og skjermen (programvaren). Delene i `lys` får farge.
 */
export function Telefon({ x, y, skala = 1, lys }: { x: number; y: number; skala?: number; lys: Del[] }) {
    const på = (d: Del) => lys.includes(d);
    const farge = (d: Del) => (på(d) ? DELFARGE[d] : '#94a3b8');
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <rect x={-130} y={-250} width={260} height={500} rx={38} fill="#1e293b" />
            <rect x={-114} y={-226} width={228} height={452} rx={24} fill="#f8fafc" />
            {/* Høyttaler øverst og vibrator nederst: magneter */}
            <motion.circle cx={-50} cy={-150} r={26} animate={{ fill: farge('jordarter') }} transition={{ duration: 0.6 }} />
            <motion.circle cx={50} cy={-150} r={26} animate={{ fill: farge('jordarter') }} transition={{ duration: 0.6 }} />
            <circle cx={-50} cy={-150} r={10} fill="#f8fafc" />
            <circle cx={50} cy={-150} r={10} fill="#f8fafc" />
            {/* Databrikken */}
            <motion.rect x={-34} y={-104} width={68} height={68} rx={8} animate={{ fill: farge('brikke') }} transition={{ duration: 0.6 }} />
            {[-22, -6, 10].map((dx) => (
                <g key={dx}>
                    <rect x={dx} y={-114} width={6} height={10} fill="#475569" />
                    <rect x={dx} y={-36} width={6} height={10} fill="#475569" />
                </g>
            ))}
            {/* Batteriet */}
            <motion.rect x={-80} y={-18} width={160} height={110} rx={12} animate={{ fill: farge('kobolt') }} transition={{ duration: 0.6 }} />
            <rect x={-20} y={-28} width={40} height={10} rx={3} fill="#475569" />
            <text x={0} y={52} textAnchor="middle" fontSize={34} fontWeight={900} fill="#f8fafc">
                +
            </text>
            {/* Skjermen med apper: programvaren */}
            {[-60, -20, 20, 60].map((dx) =>
                [130, 170].map((dy) => (
                    <motion.rect
                        key={`${dx}-${dy}`}
                        x={dx - 15}
                        y={dy - 15}
                        width={30}
                        height={30}
                        rx={8}
                        animate={{ fill: farge('programvare') }}
                        transition={{ duration: 0.6 }}
                    />
                ))
            )}
        </g>
    );
}

/** CSS-nøkkelbilder for varer som glir langs en linje. Pause fryser dem. */
export function GlideStil() {
    return (
        <style>{`
@keyframes vo-glid { from { transform: translateX(0px); opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } to { transform: translateX(var(--vo-lengde)); opacity: 0; } }
`}</style>
    );
}

/** Varer (containere) som glir fra x0 til x1 langs y. */
export function Varer({
    x0,
    x1,
    y,
    farge,
    antall = 6,
    tid = 6,
    playing,
    stopp,
    bredde = 46,
}: {
    x0: number;
    x1: number;
    y: number;
    farge: string;
    antall?: number;
    tid?: number;
    playing: boolean;
    stopp?: boolean;
    bredde?: number;
}) {
    if (stopp) return null;
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => (
                <rect
                    key={i}
                    x={x0 - bredde / 2}
                    y={y - 18}
                    width={bredde}
                    height={36}
                    rx={5}
                    fill={farge}
                    stroke="#0f172a"
                    strokeOpacity={0.25}
                    strokeWidth={2}
                    style={
                        {
                            '--vo-lengde': `${x1 - x0}px`,
                            animation: `vo-glid ${tid}s linear ${(-i * tid) / antall}s infinite`,
                            animationPlayState: playing ? 'running' : 'paused',
                        } as CSSProperties
                    }
                />
            ))}
        </g>
    );
}
