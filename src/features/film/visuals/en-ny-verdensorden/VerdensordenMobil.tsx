import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { B, DELFARGE, H, type Del } from './data';
import { Overskrift, Telefon } from './figurer';

/**
 * Kampen om ressursene, vist i en mobil.
 * Beat 0 oljefatet (1900-tallet) mot mobilen (i dag), beat 1 magnetene lyser (sjeldne jordarter,
 * Kina), beat 2 batteriet (kobolt, DR Kongo), beat 3 databrikken (Taiwan), beat 4 olje og gass
 * kommer tilbake ved siden av mobilen.
 */

interface Kort {
    tittel: string;
    under: string;
    farge: string;
    andel?: { verdi: number; tekst: string };
    land?: string;
}

const KORT: (Kort | null)[] = [
    null,
    {
        tittel: 'Sjeldne jordarter',
        under: 'metaller i mobiler og vindmøller',
        farge: DELFARGE.jordarter,
        andel: { verdi: 0.7, tekst: 'Kina: ca. 70 % av produksjonen (2022)' },
    },
    {
        tittel: 'Kobolt',
        under: 'i batterier til elbiler',
        farge: DELFARGE.kobolt,
        andel: { verdi: 0.75, tekst: 'DR Kongo: ca. 3 av 4 (2023)' },
    },
    {
        tittel: 'Databrikker',
        under: 'hjernen i all moderne teknologi',
        farge: DELFARGE.brikke,
        land: 'De mest avanserte: Taiwan',
    },
    {
        tittel: 'Olje og gass',
        under: 'fortsatt et maktmiddel',
        farge: '#1f2937',
    },
];

const LYS: Del[][] = [[], ['jordarter'], ['jordarter', 'kobolt'], ['jordarter', 'kobolt', 'brikke'], ['jordarter', 'kobolt', 'brikke']];
const OVERSKRIFT = ['Hva er makt laget av?', 'Sjeldne jordarter', 'Kobolt', 'Databrikker', 'Olje og gass: fortsatt makt'];

function Oljefat({ x, y, skala = 1 }: { x: number; y: number; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <rect x={-90} y={-130} width={180} height={260} rx={18} fill="#1f2937" />
            {[-80, 0, 80].map((dy) => (
                <rect key={dy} x={-96} y={dy - 8} width={192} height={16} rx={6} fill="#374151" />
            ))}
            <path d="M0 -40 C 28 0, 28 30, 0 40 C -28 30, -28 0, 0 -40 Z" fill="#facc15" />
        </g>
    );
}

function Gassflamme({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-70} y={40} width={140} height={60} rx={10} fill="#475569" />
            <rect x={-14} y={-10} width={28} height={60} fill="#64748b" />
            <path d="M0 -110 C 50 -60, 40 -20, 0 -10 C -40 -20, -50 -60, 0 -110 Z" fill="#f97316" />
            <path d="M0 -70 C 22 -45, 18 -25, 0 -18 C -18 -25, -22 -45, 0 -70 Z" fill="#60a5fa" />
        </g>
    );
}

export function VerdensordenMobil({ beat }: VisualProps) {
    const b = Math.min(beat, 4);
    const kort = KORT[b];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Oljefatet: stort i beat 0, lite ved siden av mobilen i beat 4 */}
                <motion.g
                    initial={false}
                    animate={{ opacity: b === 0 || b === 4 ? 1 : 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {b === 4 ? <Oljefat x={150} y={640} skala={0.6} /> : <Oljefat x={420} y={510} />}
                </motion.g>
                {b === 4 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <Gassflamme x={150} y={330} />
                    </motion.g>
                )}
                {b === 0 && (
                    <>
                        <text x={420} y={720} textAnchor="middle" fontSize={40} fontWeight={900} fill="#1f2937">
                            1900-tallet: olje
                        </text>
                        <motion.path
                            d="M600 500 L 900 500"
                            stroke="#475569"
                            strokeWidth={10}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                        />
                        <motion.path
                            d="M870 470 L 905 500 L 870 530"
                            fill="none"
                            stroke="#475569"
                            strokeWidth={10}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3 }}
                        />
                        <motion.text
                            x={1140}
                            y={760}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#1f2937"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            I dag: nye ressurser
                        </motion.text>
                    </>
                )}
                <motion.g
                    initial={false}
                    animate={{ x: b === 0 ? 1140 : 420, y: b === 0 ? 470 : 500 }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                >
                    <Telefon x={0} y={0} skala={b === 0 ? 0.7 : 0.8} lys={LYS[b]} />
                </motion.g>
            </svg>

            <Overskrift tekst={OVERSKRIFT[b]} rod={b === 4} />

            <AnimatePresence mode="wait">
                {kort && (
                    <motion.div
                        key={b}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="absolute left-[46%] right-[5%] top-[24%] px-7 py-6 rounded-3xl bg-white/95 shadow-2xl"
                        style={{ borderLeft: `14px solid ${kort.farge}` }}
                    >
                        <div className="text-5xl font-black" style={{ color: kort.farge }}>
                            {kort.tittel}
                        </div>
                        <div className="text-2xl font-semibold text-slate-600 mt-1">{kort.under}</div>
                        {kort.andel && <Andel {...kort.andel} farge={kort.farge} />}
                        {kort.land && (
                            <div className="mt-6 text-3xl font-black text-slate-900">{kort.land}</div>
                        )}
                        {b === 4 && (
                            <div className="mt-5 flex flex-wrap gap-2">
                                {[
                                    ['jordarter: Kina', DELFARGE.jordarter],
                                    ['kobolt: DR Kongo', DELFARGE.kobolt],
                                    ['brikker: Taiwan', DELFARGE.brikke],
                                ].map(([t, f]) => (
                                    <span key={t} className="px-3 py-1 rounded-lg text-white text-xl font-bold" style={{ background: f }}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Andel({ verdi, tekst, farge }: { verdi: number; tekst: string; farge: string }) {
    return (
        <div className="mt-6">
            <div className="h-12 rounded-xl bg-slate-200 overflow-hidden">
                <motion.div
                    className="h-full rounded-xl"
                    style={{ background: farge }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${verdi * 100}%` }}
                    transition={{ delay: 0.9, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-800">{tekst}</div>
        </div>
    );
}
