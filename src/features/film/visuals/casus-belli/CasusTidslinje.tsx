import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tidslinja over påskuddene i filmen. Til venstre er over 1900 år presset sammen, til høyre
 * er 1900-tallet strukket ut, så de tre påskuddene fra 1900-tallet får plass.
 * Beat 0: Mukden og Gleiwitz. 1: Tonkin kommer til. 2: resolusjonen. 3: alle eksemplene.
 */

const B = 1600;
const H = 900;
const LINJE = 470;
const BRUDD = 640;

/** År til x: -49..1900 komprimert til 120..600, 1900..2010 strukket til 680..1500. */
function x(ar: number) {
    if (ar <= 1900) return 120 + ((ar + 49) / 1949) * 480;
    return BRUDD + 40 + ((ar - 1900) / 110) * 820;
}

interface Punkt {
    ar: number;
    vis: string;
    navn: string;
    fraBeat: number;
    paskudd?: boolean;
    opp?: boolean;
}

const PUNKTER: Punkt[] = [
    { ar: 1931, vis: '1931', navn: 'Mukden', fraBeat: 0, paskudd: true, opp: true },
    { ar: 1939, vis: '1939', navn: 'Gleiwitz', fraBeat: 0, paskudd: true },
    { ar: 1964, vis: '1964', navn: 'Tonkin', fraBeat: 1, paskudd: true, opp: true },
    { ar: -49, vis: '49 f.Kr.', navn: 'Rubicon', fraBeat: 3, opp: true },
    { ar: 793, vis: '793', navn: 'Lindisfarne', fraBeat: 3 },
    { ar: 1588, vis: '1588', navn: 'Armadaen', fraBeat: 3, opp: true },
    { ar: 1618, vis: '1618', navn: 'Praha', fraBeat: 3 },
    { ar: 1914, vis: '1914', navn: 'Sarajevo', fraBeat: 3 },
    { ar: 1990, vis: '1990', navn: 'Kuwait', fraBeat: 3 },
    { ar: 2003, vis: '2003', navn: 'Irak', fraBeat: 3, opp: true },
];

export function CasusTidslinje({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f8fafc' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Linja, med et brudd der skalaen skifter */}
                <line
                    x1={100}
                    x2={BRUDD - 14}
                    y1={LINJE}
                    y2={LINJE}
                    stroke="#94a3b8"
                    strokeWidth={8}
                />
                <line
                    x1={BRUDD + 14}
                    x2={1530}
                    y1={LINJE}
                    y2={LINJE}
                    stroke="#334155"
                    strokeWidth={10}
                />
                <path
                    d={`M ${BRUDD - 24} ${LINJE + 22} L ${BRUDD - 4} ${LINJE - 22} M ${BRUDD + 4} ${LINJE + 22} L ${BRUDD + 24} ${LINJE - 22}`}
                    stroke="#64748b"
                    strokeWidth={6}
                />
                <text
                    x={360}
                    y={LINJE + 250}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#64748b"
                >
                    Antikken til 1900
                </text>
                <text
                    x={1090}
                    y={LINJE + 250}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#64748b"
                >
                    1900-tallet, forstørret
                </text>

                {PUNKTER.filter((p) => beat >= p.fraBeat).map((p) => {
                    const px = x(p.ar);
                    const aktiv =
                        (beat <= 2 && p.paskudd && (p.navn !== 'Tonkin' || beat >= 1)) ||
                        (beat === 3 && p.paskudd);
                    const farge = p.paskudd ? '#dc2626' : '#2563eb';
                    const dy = p.opp ? -1 : 1;
                    return (
                        <motion.g
                            key={p.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                duration: 0.6,
                                delay: p.fraBeat === 3 ? (p.ar + 49) / 1500 : 0.3,
                            }}
                        >
                            <line
                                x1={px}
                                x2={px}
                                y1={LINJE}
                                y2={LINJE + dy * 70}
                                stroke={farge}
                                strokeWidth={4}
                            />
                            <circle
                                cx={px}
                                cy={LINJE}
                                r={aktiv ? 22 : 15}
                                fill={farge}
                                stroke="#ffffff"
                                strokeWidth={5}
                            />
                            <text
                                x={px}
                                y={LINJE + dy * (p.opp ? 132 : 114)}
                                textAnchor="middle"
                                fontSize={aktiv ? 46 : 38}
                                fontWeight={900}
                                fill={farge}
                            >
                                {p.navn}
                            </text>
                            <text
                                x={px}
                                y={LINJE + dy * (p.opp ? 88 : 160)}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={700}
                                fill="#475569"
                            >
                                {p.vis}
                            </text>
                        </motion.g>
                    );
                })}

                {beat === 2 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect
                            x={x(1964) - 300}
                            y={140}
                            width={600}
                            height={130}
                            rx={20}
                            fill="#ffffff"
                            stroke="#dc2626"
                            strokeWidth={6}
                        />
                        <text
                            x={x(1964)}
                            y={195}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#dc2626"
                        >
                            Tonkin-resolusjonen
                        </text>
                        <text
                            x={x(1964)}
                            y={245}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            Johnson får frie hender
                        </text>
                    </motion.g>
                )}
            </svg>

            <div
                className="absolute left-[3%] top-[4%] px-5 py-2 rounded-xl bg-white shadow-lg font-black text-slate-800"
                style={{ fontSize: '1.7rem' }}
            >
                {beat === 3 ? 'Én hendelse, så krig' : 'Påskudd for krig'}
            </div>
            <div
                className="absolute left-[3%] bottom-[5%] flex gap-6 px-5 py-3 rounded-2xl bg-white shadow-xl font-bold"
                style={{ fontSize: '1.3rem' }}
            >
                <span style={{ color: '#dc2626' }}>● Påskudd i denne delen</span>
                {beat === 3 && (
                    <span style={{ color: '#2563eb' }}>● Andre krigsgrunner i filmen</span>
                )}
            </div>
        </div>
    );
}
