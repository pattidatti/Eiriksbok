import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Momsen. To moduser:
 * - satser: hodetelefonene (400 + 100 = 500 kroner) og de fire momssatsene.
 * - kjede: fabrikk -> butikk -> deg. Hver bedrift sender forskjellen til staten, og du
 *   betaler hele momsen. Til slutt: en student og en millionær betaler like mye moms på melka.
 */

type Modus = 'satser' | 'kjede';

const SATSER = [
    { sats: '25 %', navn: 'Det meste', farge: '#ca8a04', fraBeat: 0 },
    { sats: '15 %', navn: 'Matvarer', farge: '#16a34a', fraBeat: 2 },
    { sats: '12 %', navn: 'Kino og buss', farge: '#2563eb', fraBeat: 3 },
    { sats: '0 %', navn: 'Bøker og aviser', farge: '#64748b', fraBeat: 4 },
];

function Satser({ beat }: { beat: number }) {
    const X0 = 300;
    const B = 800;
    const moms = beat >= 1;
    return (
        <>
            <text x={800} y={90} textAnchor="middle" fontSize={56} fontWeight={800} fill="#0f172a">
                {beat === 0 ? 'Moms: 25 prosent av prisen før moms' : beat === 1 ? 'Hodetelefonene' : 'Ulik moms på ulike ting'}
            </text>
            {/* Prisstolpen */}
            <motion.g animate={{ opacity: beat >= 2 ? 0.45 : 1 }}>
                <rect x={X0} y={170} width={B} height={110} rx={18} fill="#1d4ed8" />
                <text x={X0 + B / 2} y={240} textAnchor="middle" fontSize={44} fontWeight={800} fill="#fff">
                    400 kr før moms
                </text>
                <motion.rect
                    x={X0 + B + 8}
                    y={170}
                    height={110}
                    rx={18}
                    fill="#ca8a04"
                    initial={{ width: 0 }}
                    animate={{ width: moms ? B / 4 : 0 }}
                    transition={{ duration: 1 }}
                />
                <motion.text
                    x={X0 + B + 8 + B / 8}
                    y={240}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#fff"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: moms ? 1 : 0 }}
                    transition={{ delay: 0.8 }}
                >
                    100 kr
                </motion.text>
                <motion.text
                    x={X0 + B + 8 + B / 8}
                    y={330}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={700}
                    fill="#a16207"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: moms ? 1 : 0 }}
                    transition={{ delay: 0.8 }}
                >
                    moms
                </motion.text>
                <motion.text
                    x={X0 + (B + 8 + B / 4) / 2}
                    y={390}
                    textAnchor="middle"
                    fontSize={48}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: moms ? 1 : 0 }}
                    transition={{ delay: 1.4 }}
                >
                    = 500 kr i butikken
                </motion.text>
            </motion.g>
            {/* Satsene */}
            {SATSER.map((s, i) => {
                const vis = beat >= s.fraBeat;
                const x = 140 + i * 340;
                return (
                    <motion.g
                        key={s.sats}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: vis ? 1 : 0, y: vis ? 0 : 20 }}
                        transition={{ duration: 0.6 }}
                    >
                        <rect
                            x={x}
                            y={480}
                            width={300}
                            height={300}
                            rx={28}
                            fill="#ffffff"
                            stroke={s.farge}
                            strokeWidth={beat === s.fraBeat ? 10 : 5}
                        />
                        <text x={x + 150} y={640} textAnchor="middle" fontSize={96} fontWeight={900} fill={s.farge}>
                            {s.sats}
                        </text>
                        <text x={x + 150} y={720} textAnchor="middle" fontSize={34} fontWeight={700} fill="#1e293b">
                            {s.navn}
                        </text>
                    </motion.g>
                );
            })}
        </>
    );
}

const LEDD = [
    { x: 250, navn: 'Fabrikken', farge: '#64748b' },
    { x: 800, navn: 'Butikken', farge: '#0d9488' },
    { x: 1350, navn: 'Deg', farge: '#2563eb' },
];

function Melk({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-30} y={-70} width={60} height={90} fill="#f8fafc" stroke="#2563eb" strokeWidth={4} />
            <path d="M -30 -70 L 0 -100 L 30 -70 Z" fill="#dbeafe" stroke="#2563eb" strokeWidth={4} />
            <rect x={-30} y={-40} width={60} height={22} fill="#2563eb" />
        </g>
    );
}

function Kjede({ beat }: { beat: number }) {
    const flat = beat >= 3;
    const overskrift = [
        'Moms i hvert ledd',
        'Bedriftene sender forskjellen til staten',
        'Du betaler hele momsen',
        'Flat skatt: samme prosent for alle',
        'Samme moms på melka',
    ][Math.min(beat, 4)];
    return (
        <>
            <motion.text
                key={overskrift}
                x={800}
                y={90}
                textAnchor="middle"
                fontSize={56}
                fontWeight={800}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {overskrift}
            </motion.text>
            <motion.g animate={{ opacity: flat ? 0 : 1 }} transition={{ duration: 0.6 }}>
                {/* Staten */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 1 ? 1 : 0 }}>
                    <rect x={600} y={150} width={400} height={110} rx={20} fill="#fef3c7" stroke="#ca8a04" strokeWidth={5} />
                    <text x={800} y={220} textAnchor="middle" fontSize={44} fontWeight={800} fill="#a16207">
                        Staten
                    </text>
                    {[250, 800].map((x) => (
                        <motion.path
                            key={x}
                            d={`M ${x} 470 Q ${(x + 800) / 2} 330 ${x === 800 ? 800 : 640} 265`}
                            fill="none"
                            stroke="#ca8a04"
                            strokeWidth={8}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: beat >= 1 ? 1 : 0 }}
                            transition={{ duration: 1, delay: x === 800 ? 0.8 : 0 }}
                        />
                    ))}
                    {['Hver bedrift sender:', 'moms på salget', 'minus moms på innkjøpet'].map((t, i) => (
                        <text key={t} x={1060} y={320 + i * 40} textAnchor="start" fontSize={30} fontWeight={i ? 700 : 800} fill="#a16207">
                            {t}
                        </text>
                    ))}
                </motion.g>
                {/* Leddene */}
                {LEDD.map((l, i) => {
                    const lys = beat === 2 ? i === 2 : beat === 1 ? i < 2 : true;
                    return (
                        <motion.g key={l.navn} animate={{ opacity: lys ? 1 : 0.35 }}>
                            <rect x={l.x - 170} y={480} width={340} height={150} rx={26} fill={l.farge} />
                            <text x={l.x} y={572} textAnchor="middle" fontSize={50} fontWeight={800} fill="#fff">
                                {l.navn}
                            </text>
                        </motion.g>
                    );
                })}
                {[0, 1].map((i) => (
                    <g key={i}>
                        <line x1={LEDD[i].x + 180} x2={LEDD[i + 1].x - 190} y1={555} y2={555} stroke="#94a3b8" strokeWidth={8} />
                        <path d={`M ${LEDD[i + 1].x - 190} 535 L ${LEDD[i + 1].x - 175} 555 L ${LEDD[i + 1].x - 190} 575 Z`} fill="#94a3b8" />
                        <motion.circle
                            cy={555}
                            r={18}
                            fill="#1d4ed8"
                            initial={{ cx: LEDD[i].x + 180 }}
                            animate={{ cx: [LEDD[i].x + 180, LEDD[i + 1].x - 200] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i }}
                        />
                    </g>
                ))}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat === 2 ? 1 : 0 }} transition={{ delay: 0.4 }}>
                    <rect x={1130} y={680} width={440} height={110} rx={20} fill="#ffffff" stroke="#ca8a04" strokeWidth={5} />
                    <text x={1350} y={748} textAnchor="middle" fontSize={36} fontWeight={800} fill="#a16207">
                        Hele momsen i prisen
                    </text>
                </motion.g>
            </motion.g>

            {/* Flat: student og millionær */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: flat ? 1 : 0 }} transition={{ duration: 0.6, delay: flat ? 0.4 : 0 }}>
                {[
                    { x: 450, navn: 'Student', farge: '#0d9488', hatt: false },
                    { x: 1150, navn: 'Millionær', farge: '#7c3aed', hatt: true },
                ].map((p) => (
                    <g key={p.navn}>
                        <rect x={p.x - 60} y={400} width={120} height={230} rx={56} fill={p.farge} />
                        <circle cx={p.x} cy={340} r={56} fill="#e8b48c" />
                        {p.hatt && <rect x={p.x - 50} y={262} width={100} height={36} rx={8} fill="#1e293b" />}
                        <text x={p.x} y={690} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e293b">
                            {p.navn}
                        </text>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 4 ? 1 : 0 }} transition={{ delay: 0.3 }}>
                            <Melk x={p.x + 150} y={560} />
                            <rect x={p.x - 140} y={740} width={280} height={84} rx={20} fill="#fef3c7" stroke="#ca8a04" strokeWidth={4} />
                            <text x={p.x} y={796} textAnchor="middle" fontSize={36} fontWeight={800} fill="#a16207">
                                Samme moms
                            </text>
                        </motion.g>
                    </g>
                ))}
                <text x={800} y={540} textAnchor="middle" fontSize={90} fontWeight={900} fill="#ca8a04">
                    =
                </text>
            </motion.g>
        </>
    );
}

export function SkattMoms({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'satser';
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            {modus === 'satser' ? <Satser beat={beat} /> : <Kjede beat={beat} />}
        </svg>
    );
}
