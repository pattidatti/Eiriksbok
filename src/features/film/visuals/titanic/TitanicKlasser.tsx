import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Forenklet snitt av skipet: hvor de tre klassene bodde. Første klasse midt i skipet
 * og høyt oppe, andre klasse akterut, tredje klasse langt nede i baugen og akterenden.
 */

const SKROG =
    'M 150 300 L 1470 282 Q 1452 470 1420 600 L 215 600 Q 140 570 118 470 Q 110 360 150 300 Z';

interface Sone {
    klasse: 1 | 2 | 3;
    x: number;
    y: number;
    b: number;
    h: number;
}

const SONER: Sone[] = [
    { klasse: 1, x: 420, y: 200, b: 640, h: 100 },
    { klasse: 1, x: 520, y: 300, b: 560, h: 110 },
    { klasse: 2, x: 230, y: 300, b: 280, h: 160 },
    { klasse: 2, x: 360, y: 200, b: 60, h: 100 },
    { klasse: 3, x: 1130, y: 380, b: 300, h: 160 },
    { klasse: 3, x: 180, y: 470, b: 300, h: 110 },
];

const FARGE = { 1: '#ca8a04', 2: '#2563eb', 3: '#b45309' } as const;
const NAVN = { 1: '1. klasse', 2: '2. klasse', 3: '3. klasse' } as const;
const BESKRIVELSE = {
    1: 'De rikeste. Store lugarer, høyt oppe.',
    2: 'Vanlige, gode inntekter.',
    3: 'Minst penger. Mange utvandrere.',
} as const;

export function TitanicKlasser({ beat }: VisualProps) {
    const aktiv = (k: 1 | 2 | 3) => beat === 0 || beat >= k;
    const fokus = (k: 1 | 2 | 3) => beat === k;
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-slate-100">
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <clipPath id="klasser-skrog">
                        <path d={SKROG} />
                        <rect x={360} y={200} width={800} height={100} />
                    </clipPath>
                </defs>
                <text
                    x={800}
                    y={90}
                    textAnchor="middle"
                    fontSize={54}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Tre klasser, tre etasjer
                </text>
                {[1010, 860, 710, 560].map((x) => (
                    <g key={x} transform={`translate(${x} 200) skewX(-8)`}>
                        <rect x={-26} y={-90} width={52} height={90} fill="#c98a3b" />
                        <rect x={-26} y={-90} width={52} height={20} fill="#111" />
                    </g>
                ))}
                <rect
                    x={360}
                    y={200}
                    width={800}
                    height={100}
                    fill="#f1f5f9"
                    stroke="#64748b"
                    strokeWidth={3}
                />
                <path d={SKROG} fill="#e2e8f0" stroke="#334155" strokeWidth={4} />
                <g clipPath="url(#klasser-skrog)">
                    {SONER.map((s, i) => (
                        <motion.rect
                            key={i}
                            x={s.x}
                            y={s.y}
                            width={s.b}
                            height={s.h}
                            fill={FARGE[s.klasse]}
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: aktiv(s.klasse)
                                    ? fokus(s.klasse) || beat === 0
                                        ? 0.9
                                        : 0.35
                                    : 0.06,
                            }}
                            transition={{ duration: 0.7 }}
                        />
                    ))}
                    {/* Dekk */}
                    {[250, 300, 360, 410, 470, 530].map((y) => (
                        <line
                            key={y}
                            x1={100}
                            x2={1500}
                            y1={y}
                            y2={y}
                            stroke="#475569"
                            strokeWidth={1.5}
                            opacity={0.5}
                        />
                    ))}
                </g>
                <line
                    x1={60}
                    x2={1540}
                    y1={520}
                    y2={520}
                    stroke="#0b3557"
                    strokeWidth={3}
                    strokeDasharray="12 8"
                    opacity={0.6}
                />
                <text
                    x={1530}
                    y={548}
                    textAnchor="end"
                    fontSize={22}
                    fill="#0b3557"
                    fontWeight={700}
                >
                    vannlinja
                </text>
                {/* Pil opp/ned for «etasjer i samfunnet» */}
                <g opacity={0.8}>
                    <line x1={70} x2={70} y1={580} y2={235} stroke="#0f172a" strokeWidth={4} />
                    <polygon points="70,218 58,240 82,240" fill="#0f172a" />
                    <text
                        x={60}
                        y={200}
                        fontSize={22}
                        fontWeight={800}
                        fill="#0f172a"
                        textAnchor="start"
                    >
                        rik
                    </text>
                    <text
                        x={56}
                        y={615}
                        fontSize={22}
                        fontWeight={800}
                        fill="#0f172a"
                        textAnchor="start"
                    >
                        fattig
                    </text>
                </g>
            </svg>
            <div className="absolute bottom-[6%] inset-x-0 flex justify-center gap-4 px-6">
                {([1, 2, 3] as const).map((k) => (
                    <motion.div
                        key={k}
                        animate={{
                            opacity: aktiv(k) ? 1 : 0.25,
                            scale: fokus(k) ? 1.06 : 1,
                            y: fokus(k) ? -6 : 0,
                        }}
                        className="flex-1 max-w-[340px] rounded-2xl bg-white shadow-lg p-3 border-t-8"
                        style={{ borderColor: FARGE[k] }}
                    >
                        <div className="text-xl md:text-2xl font-black text-slate-900">
                            {NAVN[k]}
                        </div>
                        <div className="text-base md:text-lg text-slate-600 font-semibold leading-snug">
                            {BESKRIVELSE[k]}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
