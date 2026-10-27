import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Hvor pengene kommer fra: det staten regnet med å få inn i 2026, i milliarder kroner.
 * Én søyle per beat. Tallene står over søylene, navnene under.
 */

const RADER = [
    { verdi: 515, navn: ['Skatt på inntekt', 'og formue'], farge: '#0d9488', fraBeat: 1 },
    { verdi: 514, navn: ['Arbeidsgiveravgift', 'og trygdeavgift'], farge: '#2563eb', fraBeat: 2 },
    { verdi: 421, navn: ['Moms'], farge: '#ca8a04', fraBeat: 3 },
    { verdi: 557, navn: ['Olje og gass'], farge: '#475569', fraBeat: 4 },
];

const BUNN = 640;
const MAKS = 600;
const SKALA = 400 / MAKS;
const BREDDE = 240;

export function SkattInntekter({ beat }: VisualProps) {
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            <text x={800} y={92} textAnchor="middle" fontSize={56} fontWeight={800} fill="#0f172a">
                Statens inntekter i 2026
            </text>
            <text x={800} y={146} textAnchor="middle" fontSize={32} fontWeight={600} fill="#64748b">
                milliarder kroner, slik staten regnet med
            </text>
            <line x1={160} x2={1440} y1={BUNN} y2={BUNN} stroke="#94a3b8" strokeWidth={4} />
            {RADER.map((r, i) => {
                const x = 320 + i * 320;
                const vis = beat >= r.fraBeat;
                const h = r.verdi * SKALA;
                const ny = beat === r.fraBeat;
                return (
                    <g key={r.verdi}>
                        <rect
                            x={x - BREDDE / 2}
                            y={BUNN - h}
                            width={BREDDE}
                            height={h}
                            rx={14}
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth={3}
                            strokeDasharray="12 10"
                        />
                        <motion.rect
                            x={x - BREDDE / 2}
                            width={BREDDE}
                            rx={14}
                            fill={r.farge}
                            initial={{ y: BUNN, height: 0 }}
                            animate={{ y: vis ? BUNN - h : BUNN, height: vis ? h : 0 }}
                            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        />
                        {vis && (
                            <text
                                x={x}
                                y={BUNN - h - 24}
                                textAnchor="middle"
                                fontSize={ny ? 64 : 52}
                                fontWeight={900}
                                fill={r.farge}
                            >
                                <TelleTall verdi={r.verdi} />
                            </text>
                        )}
                        {r.navn.map((linje, j) => (
                            <motion.text
                                key={linje}
                                x={x}
                                y={BUNN + 56 + j * 40}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={700}
                                fill="#1e293b"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: vis ? 1 : 0.25 }}
                            >
                                {linje}
                            </motion.text>
                        ))}
                    </g>
                );
            })}
        </svg>
    );
}
