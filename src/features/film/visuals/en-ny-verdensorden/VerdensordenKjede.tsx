import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { B, H } from './data';
import { GlideStil, Overskrift, Varer } from './figurer';

/**
 * Pandemien og forsyningskjedene.
 * Beat 0 fabrikken i Kina stenger og varene stopper, beat 1 tomme hyller i Europa og USA,
 * beat 2 bilen som mangler én liten del, beat 3 den lange kjeden der hvert ledd kan svikte,
 * beat 4 produksjonen flytter nærmere hjem.
 */

interface Ledd {
    navn: string;
    x: number;
    farge: string;
    stengt?: boolean;
}

const Y = 400;

function leddFor(beat: number): { nokkel: string; ledd: Ledd[] } {
    if (beat <= 2)
        return {
            nokkel: 'fire',
            ledd: [
                { navn: 'Råvarer', x: 200, farge: '#a16207' },
                { navn: 'Fabrikk i Kina', x: 600, farge: '#dc2626', stengt: true },
                { navn: 'Skip', x: 1000, farge: '#0369a1' },
                { navn: 'Europa og USA', x: 1400, farge: '#2563eb' },
            ],
        };
    if (beat === 3)
        return {
            nokkel: 'seks',
            ledd: [
                { navn: 'Gruve', x: 140, farge: '#a16207' },
                { navn: 'Del', x: 404, farge: '#7c3aed' },
                { navn: 'Del', x: 668, farge: '#7c3aed' },
                { navn: 'Fabrikk', x: 932, farge: '#dc2626' },
                { navn: 'Skip', x: 1196, farge: '#0369a1' },
                { navn: 'Butikk', x: 1460, farge: '#2563eb' },
            ],
        };
    return {
        nokkel: 'hjem',
        ledd: [
            { navn: 'Råvarer', x: 560, farge: '#a16207' },
            { navn: 'Fabrikk nær hjemme', x: 960, farge: '#0f766e' },
            { navn: 'Europa og USA', x: 1360, farge: '#2563eb' },
        ],
    };
}

const OVERSKRIFT = [
    '2020: fabrikkene i Kina stopper',
    'Tomme hyller i Europa og USA',
    'Bilfabrikkene står',
    'Lange forsyningskjeder',
    'Globaliseringen i revers',
];

function Boks({ ledd, liten, stengt }: { ledd: Ledd; liten: boolean; stengt: boolean }) {
    const w = liten ? 150 : 210;
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <motion.rect
                x={ledd.x - w / 2}
                y={Y - 75}
                width={w}
                height={150}
                rx={22}
                initial={false}
                animate={{ fill: stengt ? '#9ca3af' : ledd.farge }}
                transition={{ duration: 0.8 }}
                stroke="#fff"
                strokeWidth={6}
            />
            <text x={ledd.x} y={Y + 115} textAnchor="middle" fontSize={liten ? 30 : 34} fontWeight={800} fill="#0f172a">
                {ledd.navn}
            </text>
            {stengt && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <rect x={ledd.x - 95} y={Y - 30} width={190} height={60} rx={8} fill="none" stroke="#b91c1c" strokeWidth={7}
                        transform={`rotate(-12 ${ledd.x} ${Y})`} />
                    <text x={ledd.x} y={Y + 15} textAnchor="middle" fontSize={40} fontWeight={900} fill="#b91c1c"
                        transform={`rotate(-12 ${ledd.x} ${Y})`}>
                        STENGT
                    </text>
                </motion.g>
            )}
        </motion.g>
    );
}

function Varsel({ x, forsinkelse }: { x: number; forsinkelse: number }) {
    return (
        <motion.g initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: forsinkelse }}>
            <path d={`M${x} ${Y - 150} l 34 58 h -68 Z`} fill="#facc15" stroke="#92400e" strokeWidth={4} strokeLinejoin="round" />
            <text x={x} y={Y - 102} textAnchor="middle" fontSize={36} fontWeight={900} fill="#92400e">
                !
            </text>
        </motion.g>
    );
}

export function VerdensordenKjede({ beat, playing }: VisualProps) {
    const b = Math.min(beat, 4);
    const { nokkel, ledd } = leddFor(b);
    const liten = ledd.length > 4;
    const w = liten ? 150 : 210;
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <GlideStil />
                {/* Den gamle, lange kjeden som et spøkelse når produksjonen flytter hjem */}
                {b === 4 && (
                    <g opacity={0.25}>
                        <line x1={80} y1={Y + 210} x2={1520} y2={Y + 210} stroke="#64748b" strokeWidth={8} strokeDasharray="20 14" />
                        <text x={1300} y={Y + 260} textAnchor="middle" fontSize={28} fontWeight={700} fill="#334155">
                            den lange veien
                        </text>
                    </g>
                )}
                <AnimatePresence mode="wait">
                    <motion.g key={nokkel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                        {ledd.slice(0, -1).map((l, i) => {
                            const neste = ledd[i + 1];
                            const brutt = nokkel === 'fire' && i >= 1;
                            return (
                                <g key={`k${i}`}>
                                    <line
                                        x1={l.x + w / 2}
                                        y1={Y}
                                        x2={neste.x - w / 2}
                                        y2={Y}
                                        stroke={brutt ? '#cbd5e1' : '#94a3b8'}
                                        strokeWidth={14}
                                        strokeDasharray={brutt ? '18 14' : undefined}
                                        strokeLinecap="round"
                                    />
                                    <Varer
                                        x0={l.x + w / 2 + 20}
                                        x1={neste.x - w / 2 - 20}
                                        y={Y}
                                        farge="#f59e0b"
                                        antall={3}
                                        tid={3}
                                        playing={playing}
                                        stopp={brutt}
                                        bredde={36}
                                    />
                                    {nokkel === 'seks' && <Varsel x={(l.x + neste.x) / 2} forsinkelse={0.5 + i * 0.35} />}
                                </g>
                            );
                        })}
                        {ledd.map((l, i) => (
                            <Boks key={`${l.navn}-${i}`} ledd={l} liten={liten} stengt={!!l.stengt} />
                        ))}
                    </motion.g>
                </AnimatePresence>
            </svg>

            <Overskrift tekst={OVERSKRIFT[b]} rod={b === 0} />

            <AnimatePresence mode="wait">
                {b === 1 && (
                    <motion.div
                        key="hyller"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute right-[4%] bottom-[6%] flex gap-4"
                    >
                        {['munnbind', 'databrikker'].map((t) => (
                            <div key={t} className="relative px-6 py-4 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-800">
                                {t}
                                <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-600 text-white text-2xl flex items-center justify-center">
                                    ✕
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}
                {b === 2 && (
                    <motion.div
                        key="bil"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute right-[4%] bottom-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex items-center gap-4"
                    >
                        <svg width="230" height="110" viewBox="0 0 230 110">
                            <path d="M15 75 L 30 45 L 80 30 L 150 30 L 190 55 L 215 60 L 215 80 L 15 80 Z" fill="#64748b" />
                            <circle cx="60" cy="82" r="18" fill="#1e293b" />
                            <circle cx="175" cy="82" r="18" fill="#1e293b" />
                            <rect x="100" y="40" width="34" height="26" rx="4" fill="#fff" stroke="#dc2626" strokeWidth="4" strokeDasharray="6 4" />
                            <text x="117" y="60" textAnchor="middle" fontSize="20" fontWeight="900" fill="#dc2626">?</text>
                        </svg>
                        <div className="text-2xl font-black text-red-700 leading-tight">
                            Mangler
                            <br />
                            én liten del
                        </div>
                    </motion.div>
                )}
                {b === 3 && (
                    <motion.div
                        key="forklaring"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.6 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-[6%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    >
                        <div className="text-2xl font-black text-slate-900">Forsyningskjede</div>
                        <div className="text-xl font-semibold text-slate-600">varene reiser gjennom mange land, og hvert ledd kan svikte</div>
                    </motion.div>
                )}
                {b === 4 && (
                    <motion.div
                        key="hjem"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.9 }}
                        className="absolute left-[4%] bottom-[7%] px-5 py-3 rounded-2xl bg-teal-700 text-white shadow-xl max-w-[22rem]"
                    >
                        <div className="text-2xl font-black leading-tight">Hjem igjen, eller til land de stoler på</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
