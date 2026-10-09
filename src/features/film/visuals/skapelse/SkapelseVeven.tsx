import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Skapelsesveven: ni tradisjoner og fire faser. Rutene fylles gruppe for gruppe.
 * De tomme rutene er poenget: hinduismen har ingen «før begynnelsen», og
 * buddhismen fyller bare den siste. Teksten i rutene er hentet fra artikkelen.
 */

const B = 1600;
const H = 900;

const FASER = ['Før begynnelsen', 'Verden blir til', 'Mennesket kommer', 'Hva skal vi her?'];

interface Rad {
    navn: string;
    farge: string;
    fraBeat: number;
    ruter: (string | null)[];
}

const RADER: Rad[] = [
    {
        navn: 'Jødedom',
        farge: '#3b82f6',
        fraBeat: 1,
        ruter: ['mørke over dypet', 'Gud sa', 'to fortellinger', 'budene, hviledag'],
    },
    {
        navn: 'Kristendom',
        farge: '#6366f1',
        fraBeat: 1,
        ruter: ['mørke over dypet', 'seks dager', 'Guds bilde', 'ta vare på jorda'],
    },
    {
        navn: 'Islam',
        farge: '#10b981',
        fraBeat: 1,
        ruter: ['Gud før alt', 'ingen hviledag', 'Adam av leire', 'forvalter'],
    },
    {
        navn: "Bahá'í",
        farge: '#a855f7',
        fraBeat: 1,
        ruter: [null, 'alltid skapt', 'vært til før', 'utvikle sjelen'],
    },
    {
        navn: 'Mormonisme',
        farge: '#0ea5e9',
        fraBeat: 1,
        ruter: ['evig materie', 'Gud organiserer', 'åndebarn', 'bli lik Gud'],
    },
    {
        navn: 'Jehovas vitner',
        farge: '#14b8a6',
        fraBeat: 1,
        ruter: ['jorda fantes før', 'lange perioder', 'skapt av Jehova', 'paradis på jorda'],
    },
    {
        navn: 'Sikhisme',
        farge: '#f97316',
        fraBeat: 2,
        ruter: ['bare mørke', 'Gud ville det', null, 'huske Guds navn'],
    },
    {
        navn: 'Hinduisme',
        farge: '#f59e0b',
        fraBeat: 3,
        ruter: [null, 'blir til, går under', 'urvesenet', 'ut av kretsløpet'],
    },
    {
        navn: 'Buddhisme',
        farge: '#eab308',
        fraBeat: 4,
        ruter: [null, null, null, 'slutt på lidelsen'],
    },
];

const X0 = 330;
const KB = 300;
const Y0 = 175;
const RH = 72;

export function SkapelseVeven({ beat }: VisualProps) {
    const tekst = [
        'Ni tradisjoner, fire faser',
        'Nesten hver rute fylt',
        'Sikhismen: India, men likt de abrahamittiske',
        'Hinduismen: ingen begynnelse',
        'Buddhismen: den tomme ruta er svaret',
    ][Math.min(beat, 4)];
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {FASER.map((f, k) => (
                    <text
                        key={f}
                        x={X0 + k * KB + KB / 2}
                        y={Y0 - 18}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill="#334155"
                    >
                        {f}
                    </text>
                ))}
                {RADER.map((r, i) => {
                    const y = Y0 + i * RH;
                    const vist = beat >= r.fraBeat;
                    const nyss = beat === r.fraBeat && beat >= 2;
                    const dempet = beat >= 2 && !nyss && vist;
                    return (
                        <g key={r.navn} opacity={dempet ? 0.8 : 1}>
                            <text
                                x={X0 - 20}
                                y={y + RH / 2 + 10}
                                textAnchor="end"
                                fontSize={32}
                                fontWeight={800}
                                fill={vist ? r.farge : '#94a3b8'}
                            >
                                {r.navn}
                            </text>
                            {r.ruter.map((c, k) => {
                                const x = X0 + k * KB;
                                const fylt = vist && c !== null;
                                const tom = vist && c === null;
                                return (
                                    <g key={k}>
                                        <motion.rect
                                            x={x + 4}
                                            y={y + 4}
                                            width={KB - 8}
                                            height={RH - 8}
                                            rx={12}
                                            initial={false}
                                            animate={{
                                                fill: fylt ? r.farge : '#ffffff',
                                                stroke: tom && nyss ? '#dc2626' : '#cbd5e1',
                                            }}
                                            strokeWidth={tom && nyss ? 6 : 2}
                                            strokeDasharray={tom ? '10 8' : undefined}
                                            transition={{
                                                delay: vist ? k * 0.15 : 0,
                                                duration: 0.4,
                                            }}
                                        />
                                        {fylt && (
                                            <motion.text
                                                x={x + KB / 2}
                                                y={y + RH / 2 + 9}
                                                textAnchor="middle"
                                                fontSize={29}
                                                fontWeight={700}
                                                fill="#ffffff"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: k * 0.15 + 0.2 }}
                                            >
                                                {c}
                                            </motion.text>
                                        )}
                                        {tom && nyss && (
                                            <motion.text
                                                x={x + KB / 2}
                                                y={y + RH / 2 + 9}
                                                textAnchor="middle"
                                                fontSize={29}
                                                fontWeight={800}
                                                fill="#dc2626"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                tom
                                            </motion.text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-[3%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
            >
                {tekst}
            </motion.div>
        </div>
    );
}
