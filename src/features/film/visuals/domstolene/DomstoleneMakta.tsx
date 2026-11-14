import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Domhus, Figur, Kort, Kryss, Overskrift } from './felles';

/**
 * Makta og sakene, i 2D.
 * «makt»: Stortinget, regjeringen og domstolene som tre bygninger. Pilene fra de to første
 * stopper ved et skjold rundt domstolene.
 * «saker»: straffesak (staten mener noen har gjort noe straffbart) mot sivil sak (to parter er uenige).
 * «forlik»: forliksrådet med tre vanlige folk ved et bord, og to parter som prøver å bli enige.
 */

type Modus = 'makt' | 'saker' | 'forlik';

const OVERSKRIFT: Record<Modus, string[]> = {
    makt: ['Makta er delt i tre', 'Stortinget og regjeringen', 'Den tredje statsmakta', 'Domstolene skal være uavhengige', 'Grunnloven verner dommeren'],
    saker: ['To slags saker', 'Straffesak', 'Påtalemyndigheten', 'Sivil sak', 'Uenige om noe'],
    forlik: ['Forliksrådet', 'Tre vanlige folk', 'Kan partene bli enige?', 'Dom i enkle saker'],
};

const BUNN = 560;

function Stortinget({ x, farge }: { x: number; farge: string }) {
    return (
        <g>
            <rect x={x - 140} y={BUNN - 150} width={280} height={150} fill={farge} />
            <path d={`M ${x - 80} ${BUNN - 150} A 80 80 0 0 1 ${x + 80} ${BUNN - 150} Z`} fill={farge} />
            {[-90, -30, 30, 90].map((d) => (
                <rect key={d} x={x + d - 14} y={BUNN - 120} width={28} height={70} rx={14} fill="#ffffff" opacity={0.55} />
            ))}
        </g>
    );
}

function Regjeringen({ x, farge }: { x: number; farge: string }) {
    return (
        <g>
            <rect x={x - 110} y={BUNN - 250} width={220} height={250} fill={farge} />
            {[0, 1, 2, 3].map((r) =>
                [0, 1, 2].map((k) => (
                    <rect key={`${r}${k}`} x={x - 80 + k * 60} y={BUNN - 225 + r * 55} width={40} height={32} fill="#ffffff" opacity={0.55} />
                ))
            )}
        </g>
    );
}

function Makt({ beat }: { beat: number }) {
    const grå = '#cbd5e1';
    const xs = [330, 800, 1270];
    return (
        <>
            {beat < 3 && [0, 1, 2].map((i) => (
                <text key={i} x={xs[i]} y={BUNN - 300} textAnchor="middle" fontSize={64} fontWeight={900} fill="#94a3b8">
                    {i + 1}
                </text>
            ))}
            <motion.g animate={{ opacity: beat >= 1 ? 1 : 0.6 }}>
                <Stortinget x={xs[0]} farge={beat >= 1 ? '#2563eb' : grå} />
                <Regjeringen x={xs[1]} farge={beat >= 1 ? '#0d9488' : grå} />
            </motion.g>
            <Domhus x={xs[2]} y={BUNN} b={300} farge={beat >= 2 ? '#fde68a' : '#e2e8f0'} tak={beat >= 2 ? '#b45309' : grå} />
            <Kort x={xs[0]} y={BUNN + 30} tittel="Stortinget" tekst={beat >= 1 ? 'lager lovene' : undefined} farge="#2563eb" />
            <Kort x={xs[1]} y={BUNN + 30} tittel="Regjeringen" tekst={beat >= 1 ? 'styrer landet' : undefined} farge="#0d9488" />
            <Kort x={xs[2]} y={BUNN + 30} tittel="Domstolene" tekst={beat >= 2 ? 'avgjør saker' : undefined} farge="#b45309" />
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    {/* Skjoldet rundt domstolene */}
                    <rect x={xs[2] - 200} y={BUNN - 270} width={400} height={290} rx={40} fill="none" stroke="#b45309" strokeWidth={10} />
                    {[
                        { fra: xs[0], y: BUNN - 330 },
                        { fra: xs[1], y: BUNN - 290 },
                    ].map((p) => (
                        <motion.path
                            key={p.fra}
                            d={`M ${p.fra + 60} ${p.y} Q ${(p.fra + 1060) / 2} ${p.y - 60} ${1040} ${p.y + 30}`}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth={10}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1 }}
                        />
                    ))}
                    <Kryss x={1030} y={BUNN - 210} r={30} />
                </motion.g>
            )}
            {beat >= 4 && (
                <Kort
                    x={800}
                    y={730}
                    tittel="En dommer under 70 år kan bare fjernes gjennom en dom"
                    tekst="og kan ikke flyttes mot sin vilje"
                    farge="#b45309"
                />
            )}
        </>
    );
}

function Pil({ x1, y1, x2, y2, farge = '#475569' }: { x1: number; y1: number; x2: number; y2: number; farge?: string }) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const s = 22;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * s} y2={y2 - Math.sin(a) * s} stroke={farge} strokeWidth={10} strokeLinecap="round" />
            <path
                d={`M ${x2} ${y2} L ${x2 - Math.cos(a - 0.5) * s * 1.6} ${y2 - Math.sin(a - 0.5) * s * 1.6} L ${x2 - Math.cos(a + 0.5) * s * 1.6} ${y2 - Math.sin(a + 0.5) * s * 1.6} Z`}
                fill={farge}
            />
        </motion.g>
    );
}

function Tre({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x={x - 10} y={y - 70} width={20} height={70} fill="#78350f" />
            <circle cx={x} cy={y - 110} r={55} fill="#16a34a" />
        </motion.g>
    );
}

function Saker({ beat }: { beat: number }) {
    return (
        <>
            <line x1={800} y1={170} x2={800} y2={860} stroke="#cbd5e1" strokeWidth={6} strokeDasharray="20 16" />
            <motion.g animate={{ opacity: beat === 0 || beat <= 2 ? 1 : 0.45 }}>
                <Kort x={420} y={150} tittel="Straffesak" farge="#be123c" />
            </motion.g>
            <motion.g animate={{ opacity: beat === 0 || beat >= 3 ? 1 : 0.45 }}>
                <Kort x={1180} y={150} tittel="Sivil sak" farge="#2563eb" />
            </motion.g>
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat <= 2 ? 1 : 0.55 }}>
                    <Domhus x={200} y={440} b={150} farge="#cbd5e1" tak="#475569" />
                    <text x={200} y={490} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                        Staten
                    </text>
                    <Pil x1={300} y1={380} x2={540} y2={380} farge="#be123c" />
                    <Figur x={630} y={440} farge="#2563eb" />
                    <text x={630} y={490} textAnchor="middle" fontSize={32} fontWeight={800} fill="#1e40af">
                        Jonas
                    </text>
                    <Kort x={420} y={530} tittel="Staten mener: noe straffbart" farge="#be123c" />
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat <= 2 ? 1 : 0.55 }} transition={{ duration: 0.6 }}>
                    <Kort x={420} y={630} tittel="Påtalemyndigheten" tekst="leder etterforskningen" farge="#475569" />
                    <Pil x1={630} y1={680} x2={690} y2={765} />
                    <Domhus x={720} y={860} b={120} farge="#fde68a" tak="#b45309" />
                    <text x={540} y={845} textAnchor="end" fontSize={30} fontWeight={800} fill="#92400e">
                        Retten
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Figur x={990} y={440} farge="#0d9488" />
                    <Figur x={1370} y={440} farge="#b45309" />
                    <path d="M 1110 330 L 1150 300 L 1180 340 L 1215 305 L 1250 335" fill="none" stroke="#dc2626" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
                    <Kort x={1180} y={530} tittel="Ikke straff, men uenighet" farge="#2563eb" />
                </motion.g>
            )}
            {beat >= 4 && (
                <>
                    <Tre x={1180} y={460} />
                    <Kort x={1180} y={640} tittel="Naboer krangler om trær" farge="#16a34a" />
                    <Kort x={1180} y={740} tittel="Foreldre: hvor skal barna bo?" farge="#7c3aed" forsinkelse={0.6} />
                </>
            )}
        </>
    );
}

function Forlik({ beat }: { beat: number }) {
    const naer = beat >= 2;
    return (
        <>
            {beat >= 1 &&
                [680, 800, 920].map((x, i) => (
                    <motion.g key={x} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}>
                        <Figur x={x} y={470} farge={['#0d9488', '#ca8a04', '#7c3aed'][i]} skala={0.95} hud={i === 1 ? '#a8724a' : '#e8b48c'} />
                    </motion.g>
                ))}
            <rect x={580} y={400} width={440} height={90} rx={12} fill="#a0703f" />
            <text x={800} y={460} textAnchor="middle" fontSize={34} fontWeight={800} fill="#ffffff">
                Forliksrådet
            </text>
            {beat >= 1 && beat < 3 && <Kort x={800} y={520} tittel="Tre vanlige folk" tekst="valgt av kommunestyret for fire år" farge="#ca8a04" />}
            {beat >= 3 && <Kort x={800} y={520} tittel="I enkle saker kan rådet avsi dom" tekst="altså bestemme hvem som har rett" farge="#b45309" />}
            <motion.g initial={false} animate={{ x: naer ? 200 : 0 }} transition={{ type: 'spring', stiffness: 60, damping: 16 }}>
                <Figur x={230} y={850} farge="#0d9488" />
                <text x={230} y={680} textAnchor="middle" fontSize={30} fontWeight={800} fill="#334155">
                    Part 1
                </text>
            </motion.g>
            <motion.g initial={false} animate={{ x: naer ? -200 : 0 }} transition={{ type: 'spring', stiffness: 60, damping: 16 }}>
                <Figur x={1370} y={850} farge="#b45309" />
                <text x={1370} y={680} textAnchor="middle" fontSize={30} fontWeight={800} fill="#334155">
                    Part 2
                </text>
            </motion.g>
            {beat >= 2 && <Kort x={800} y={740} tittel="Enige?" farge="#16a34a" forsinkelse={0.8} />}
        </>
    );
}

export function DomstoleneMakta({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'makt';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#f8fafc, #e2e8f0)' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'makt' && <Makt beat={beat} />}
                {modus === 'saker' && <Saker beat={beat} />}
                {modus === 'forlik' && <Forlik beat={beat} />}
                <Overskrift tekst={tekst} />
            </svg>
        </div>
    );
}
