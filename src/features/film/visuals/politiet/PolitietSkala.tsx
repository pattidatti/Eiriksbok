import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Hakk, Kryss, Skjold, SvgKort, SvgOverskrift } from './felles';
import { tekstBredde } from './maal';

/**
 * Politiets makt og grensene for den.
 * «makt»: tre ting politiet kan gjøre som vanlige folk ikke kan, og loven som en ramme rundt dem.
 * «mildest»: politiloven § 6 som en skala fra det mildeste (råd) til det sterkeste (arresten).
 */

type Modus = 'makt' | 'mildest';

const MAKT = [
    { tittel: 'Gi ordre', ikon: 'ordre' },
    { tittel: 'Holde fast', ikon: 'hand' },
    { tittel: 'Ta med til arresten', ikon: 'dor' },
] as const;

function MaktIkon({ ikon, x, y }: { ikon: string; x: number; y: number }) {
    if (ikon === 'ordre') {
        return (
            <g transform={`translate(${x} ${y})`}>
                <path d="M -50 -30 L 30 -60 L 30 60 L -50 30 Z" fill="#1e3a8a" />
                <rect x={-70} y={-30} width={22} height={60} rx={6} fill="#1e3a8a" />
                <path d="M 50 -30 Q 70 0 50 30" fill="none" stroke="#1e3a8a" strokeWidth={8} strokeLinecap="round" />
            </g>
        );
    }
    if (ikon === 'hand') {
        return (
            <g transform={`translate(${x} ${y})`}>
                <rect x={-40} y={-20} width={80} height={70} rx={24} fill="#1e3a8a" />
                {[-30, -10, 10, 30].map((fx) => (
                    <rect key={fx} x={fx - 8} y={-62} width={16} height={56} rx={8} fill="#1e3a8a" />
                ))}
                <rect x={-66} y={-6} width={36} height={18} rx={9} fill="#1e3a8a" transform="rotate(-30 -48 3)" />
            </g>
        );
    }
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-50} y={-62} width={100} height={124} rx={8} fill="#334155" />
            {[-30, -10, 10, 30].map((sx) => (
                <rect key={sx} x={sx - 4} y={-62} width={8} height={124} fill="#cbd5e1" />
            ))}
        </g>
    );
}

function Makt({ beat }: { beat: number }) {
    const overskrift =
        beat === 0
            ? 'Politiet kan mer enn vanlige folk'
            : beat === 1
              ? 'Mye makt'
              : beat === 2
                ? 'I en rettsstat gjelder loven også politiet'
                : 'Politiloven: klare regler for makten';
    const ramme = beat >= 2;
    return (
        <>
            {/* En vanlig person og en politibetjent, side om side */}
            <motion.g animate={{ opacity: beat === 0 ? 1 : 0 }} transition={{ duration: 0.5 }}>
                <Person x={560} y={560} farge="#94a3b8" />
                <text x={560} y={760} textAnchor="middle" fontSize={34} fontWeight={700} fill="#334155">
                    Vanlig person
                </text>
                <Person x={1040} y={560} farge="#1e3a8a" politi />
                <text x={1040} y={760} textAnchor="middle" fontSize={34} fontWeight={700} fill="#1e3a8a">
                    Politiet
                </text>
            </motion.g>
            {beat >= 1 &&
                MAKT.map((m, i) => {
                    const x = 380 + i * 420;
                    return (
                        <motion.g
                            key={m.tittel}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.35, duration: 0.5 }}
                        >
                            <rect x={x - 185} y={330} width={370} height={330} rx={26} fill="#ffffff" stroke="#1e3a8a" strokeWidth={5} />
                            <MaktIkon ikon={m.ikon} x={x} y={455} />
                            <text x={x} y={610} textAnchor="middle" fontSize={i === 2 ? 30 : 36} fontWeight={800} fill="#0f172a">
                                {m.tittel}
                            </text>
                        </motion.g>
                    );
                })}
            {ramme && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
                    <rect x={150} y={250} width={1300} height={500} rx={36} fill="none" stroke="#0f766e" strokeWidth={14} />
                    <rect x={560} y={698} width={480} height={86} rx={20} fill="#0f766e" />
                    <text x={800} y={755} textAnchor="middle" fontSize={40} fontWeight={800} fill="#ffffff">
                        {beat >= 3 ? 'Politiloven' : 'Loven'}
                    </text>
                </motion.g>
            )}
            {beat >= 3 &&
                [0, 1, 2, 3].map((i) => (
                    <motion.text
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.2 }}
                        x={i < 2 ? 100 : 1500}
                        y={i % 2 === 0 ? 380 : 620}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill="#0f766e"
                    >
                        §
                    </motion.text>
                ))}
            <SvgOverskrift tekst={overskrift} />
        </>
    );
}

function Person({ x, y, farge, politi = false }: { x: number; y: number; farge: string; politi?: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={-170} r={52} fill="#f1c9a5" />
            {politi && <rect x={-58} y={-232} width={116} height={34} rx={10} fill="#1e3a8a" />}
            <path d="M -90 120 L -90 -40 Q -90 -100 -30 -104 L 30 -104 Q 90 -100 90 -40 L 90 120 Z" fill={farge} />
            {politi && <Skjold x={-40} y={-40} s={0.7} farge="#0f172a" />}
        </g>
    );
}

const TRINN = [
    { tekst: 'Råd', mild: true },
    { tekst: 'Forklaring', mild: true },
    { tekst: 'Advarsel', mild: true },
    { tekst: 'Holde fast', mild: false },
    { tekst: 'Håndjern', mild: false },
    { tekst: 'Arresten', mild: false },
];

function Mildest({ beat }: { beat: number }) {
    const x0 = 200;
    const steg = 240;
    const yLinje = 560;
    const overskrift =
        beat === 0
            ? 'Politiloven § 6: begynn med det mildeste'
            : beat === 1
              ? 'Først: det milde'
              : beat === 2
                ? 'Det sterke bare når det milde ikke er nok'
                : beat === 3
                  ? 'En gjeng bråker'
                  : 'Fysisk makt: nødvendig og forsvarlig?';
    return (
        <>
            <defs>
                <linearGradient id="politiet-skala" x1="0" x2="1">
                    <stop offset="0" stopColor="#14b8a6" />
                    <stop offset="0.5" stopColor="#facc15" />
                    <stop offset="1" stopColor="#dc2626" />
                </linearGradient>
            </defs>
            <rect x={x0 - 40} y={yLinje - 16} width={steg * 5 + 80} height={32} rx={16} fill="url(#politiet-skala)" />
            <text x={x0 - 55} y={yLinje + 12} textAnchor="end" fontSize={32} fontWeight={800} fill="#0f766e">
                Mildest
            </text>
            <text x={x0 + steg * 5 + 55} y={yLinje + 12} fontSize={32} fontWeight={800} fill="#b91c1c">
                Sterkest
            </text>
            {TRINN.map((t, i) => {
                const x = x0 + i * steg;
                const lys = t.mild ? beat >= 1 : beat === 4 && i === 3;
                const dempet = !t.mild && beat >= 2 && !(beat === 4 && i === 3);
                const farge = t.mild ? '#0d9488' : '#dc2626';
                const b = tekstBredde(t.tekst, 34) + 40;
                return (
                    <g key={t.tekst}>
                        <motion.circle
                            cx={x}
                            cy={yLinje}
                            r={30}
                            animate={{ opacity: dempet ? 0.35 : 1 }}
                            fill={lys ? farge : '#ffffff'}
                            stroke={farge}
                            strokeWidth={7}
                        />
                        <motion.g animate={{ opacity: dempet ? 0.4 : 1 }}>
                            <rect x={x - b / 2} y={yLinje - 132} width={b} height={64} rx={16} fill={lys ? farge : '#ffffff'} stroke={farge} strokeWidth={4} />
                            <text x={x} y={yLinje - 88} textAnchor="middle" fontSize={34} fontWeight={800} fill={lys ? '#ffffff' : '#0f172a'}>
                                {t.tekst}
                            </text>
                        </motion.g>
                    </g>
                );
            })}
            {/* Merket som viser hvor politiet starter */}
            <motion.g animate={{ opacity: beat === 0 ? 1 : 0 }}>
                <path d={`M ${x0} ${yLinje + 40} l -22 40 l 44 0 Z`} fill="#0f172a" />
                <text x={x0 + 40} y={yLinje + 150} fontSize={32} fontWeight={700} fill="#0f172a">
                    Start alltid her
                </text>
            </motion.g>
            {beat >= 1 && beat <= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={x0 - 60} y={yLinje + 120} width={steg * 2 + 120} height={80} rx={20} fill="#ccfbf1" />
                    <text x={x0 + steg} y={yLinje + 172} textAnchor="middle" fontSize={34} fontWeight={800} fill="#115e59">
                        {beat === 1 ? 'Først dette' : 'Prøv dette først'}
                    </text>
                </motion.g>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <line x1={x0 + steg * 2.5} y1={yLinje - 200} x2={x0 + steg * 2.5} y2={yLinje + 60} stroke="#0f172a" strokeWidth={8} strokeDasharray="18 12" />
                    <SvgKort x={x0 + steg * 2.5 + 40} y={yLinje + 120} tittel="Bare hvis det milde" tekst="ikke er nok" farge="#dc2626" />
                </motion.g>
            )}
            {beat === 3 && (
                <>
                    <Gjeng x={x0 + steg * 0.5} y={250} />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <rect x={x0 + steg * 1.3} y={206} width={540} height={84} rx={24} fill="#ffffff" stroke="#0d9488" strokeWidth={5} />
                        <text x={x0 + steg * 1.3 + 270} y={262} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                            Kan dere dempe dere?
                        </text>
                    </motion.g>
                    <Kryss x={x0 + steg * 4} y={yLinje + 150} />
                    <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={x0 + steg * 4 + 54} y={yLinje + 162} fontSize={32} fontWeight={800} fill="#b91c1c">
                        ikke håndjern
                    </motion.text>
                </>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <path d={`M ${x0 + steg * 3} ${yLinje + 40} l -22 40 l 44 0 Z`} fill="#b45309" />
                    <rect x={x0 + steg * 3 - 330} y={yLinje + 100} width={660} height={190} rx={22} fill="#ffffff" stroke="#b45309" strokeWidth={5} />
                    <Hakk x={x0 + steg * 3 - 270} y={yLinje + 152} />
                    <text x={x0 + steg * 3 - 230} y={yLinje + 164} fontSize={34} fontWeight={800} fill="#0f172a">
                        Nødvendig
                    </text>
                    <Hakk x={x0 + steg * 3 - 270} y={yLinje + 232} />
                    <text x={x0 + steg * 3 - 230} y={yLinje + 244} fontSize={34} fontWeight={800} fill="#0f172a">
                        Forsvarlig: ikke for mye
                    </text>
                </motion.g>
            )}
            <SvgOverskrift tekst={overskrift} />
        </>
    );
}

function Gjeng({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${x + (i - 1) * 64} ${y + (i === 1 ? -8 : 0)})`}>
                    <circle cx={0} cy={-34} r={20} fill="#f1c9a5" />
                    <rect x={-26} y={-12} width={52} height={70} rx={20} fill={['#7c3aed', '#ea580c', '#0891b2'][i]} />
                </g>
            ))}
            {[0, 1, 2].map((i) => (
                <path key={`l${i}`} d={`M ${x + 110 + i * 16} ${y - 60 + i * 26} l 30 -8`} stroke="#f59e0b" strokeWidth={7} strokeLinecap="round" />
            ))}
        </motion.g>
    );
}

export function PolitietSkala({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'makt';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#e0f2fe 0%,#f8fafc 70%)' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'makt' ? <Makt beat={beat} /> : <Mildest beat={beat} />}
            </svg>
        </div>
    );
}
