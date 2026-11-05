import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * «gudene»: Tor, Odin og Frøy med hvert sitt område. «aaret»: årshjulet med de tre store
 * blotene, festmåltidet og blodet. «motet»: kristendommen og åsatru side om side.
 */

type Modus = 'gudene' | 'aaret' | 'motet';

const B = 1600;
const H = 900;

function Tittel({ tekst, y = 110 }: { tekst: string; y?: number }) {
    return (
        <text x={B / 2} y={y} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a">
            {tekst}
        </text>
    );
}

function Lyn() {
    return <path d="M 20 -70 L -30 10 L 0 10 L -20 70 L 35 -15 L 5 -15 Z" fill="#facc15" stroke="#a16207" strokeWidth={4} />;
}
function Skjold() {
    return (
        <g>
            <circle r={62} fill="#b91c1c" stroke="#7f1d1d" strokeWidth={6} />
            <circle r={18} fill="#d4d4d8" stroke="#52525b" strokeWidth={4} />
            <path d="M -62 0 L 62 0 M 0 -62 L 0 62" stroke="#7f1d1d" strokeWidth={5} opacity={0.5} />
        </g>
    );
}
function Korn() {
    return (
        <g stroke="#a16207" strokeWidth={4}>
            <line x1={0} y1={70} x2={0} y2={-60} />
            {[-45, -22, 1, 24].map((y) => (
                <g key={y}>
                    <ellipse cx={-14} cy={y} rx={11} ry={20} fill="#facc15" transform={`rotate(-25 -14 ${y})`} />
                    <ellipse cx={14} cy={y} rx={11} ry={20} fill="#facc15" transform={`rotate(25 14 ${y})`} />
                </g>
            ))}
        </g>
    );
}

const GUDER = [
    { navn: 'Tor', omrade: ['torden', 'og vær'], ikon: <Lyn />, farge: '#dbeafe', fra: 1 },
    { navn: 'Odin', omrade: ['mot', 'i kamp'], ikon: <Skjold />, farge: '#fee2e2', fra: 2 },
    { navn: 'Frøy', omrade: ['fred', 'og grøde'], ikon: <Korn />, farge: '#dcfce7', fra: 3 },
];

function Gudene({ beat, d }: { beat: number; d: (s: number) => number }) {
    const nede = beat >= 4;
    return (
        <g>
            <Tittel tekst={beat >= 5 ? 'Hvorfor tilba de dem?' : 'Hver sin jobb'} />
            {GUDER.map((g, i) => {
                const x = 330 + i * 470;
                const vis = beat >= g.fra;
                return (
                    <g key={g.navn} opacity={beat >= 5 ? 0.35 : 1}>
                        <rect
                            x={x - 190}
                            y={170}
                            width={380}
                            height={nede ? 420 : 520}
                            rx={30}
                            fill={vis ? g.farge : '#f1f5f9'}
                            stroke={vis ? '#334155' : '#cbd5e1'}
                            strokeWidth={4}
                        />
                        <text x={x} y={260} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a">
                            {g.navn}
                        </text>
                        {vis && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: beat === g.fra ? d(0.4) : 0 }}
                            >
                                <g transform={`translate(${x} 380)`}>{g.ikon}</g>
                                {g.omrade.map((t, k) => (
                                    <text
                                        key={t}
                                        x={x}
                                        y={510 + k * 48}
                                        textAnchor="middle"
                                        fontSize={42}
                                        fontWeight={800}
                                        fill="#1e293b"
                                    >
                                        {t}
                                    </text>
                                ))}
                            </motion.g>
                        )}
                    </g>
                );
            })}
            {beat === 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.4) }}>
                    <rect x={300} y={640} width={1000} height={150} rx={30} fill="#1e293b" />
                    <text x={B / 2} y={706} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fff">
                        mektige, men ikke allmektige
                    </text>
                    <text x={B / 2} y={760} textAnchor="middle" fontSize={34} fontWeight={700} fill="#cbd5e1">
                        de kunne ikke gjøre hva som helst
                    </text>
                </motion.g>
            )}
            {beat >= 5 && (
                <g>
                    {[
                        { t: 'kjærlighet', x: 420, nei: true },
                        { t: 'respekt', x: 860, nei: false },
                        { t: 'litt frykt', x: 1230, nei: false },
                    ].map((k, i) => (
                        <motion.g
                            key={k.t}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: d(0.4 + i * 0.9) }}
                        >
                            <rect
                                x={k.x - 170}
                                y={640}
                                width={340}
                                height={110}
                                rx={26}
                                fill={k.nei ? '#f1f5f9' : '#fde68a'}
                                stroke="#94a3b8"
                                strokeWidth={3}
                            />
                            <text
                                x={k.x}
                                y={710}
                                textAnchor="middle"
                                fontSize={46}
                                fontWeight={900}
                                fill={k.nei ? '#64748b' : '#0f172a'}
                            >
                                {k.t}
                            </text>
                            {k.nei && (
                                <g transform={`translate(${k.x + 210} 695)`}>
                                    <circle r={32} fill="#dc2626" />
                                    <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
                                </g>
                            )}
                        </motion.g>
                    ))}
                </g>
            )}
        </g>
    );
}

/** Årshjulet. Vinkel 0 er toppen (midtvinter), med klokka: vår, sommer, høst. */
const HJUL = { x: 470, y: 500, r: 290 };
function punkt(grader: number, r = HJUL.r) {
    const a = ((grader - 90) * Math.PI) / 180;
    return { x: HJUL.x + Math.cos(a) * r, y: HJUL.y + Math.sin(a) * r };
}
const ÅRSTIDER = [
    { navn: 'vinter', fra: -45, farge: '#dbeafe' },
    { navn: 'vår', fra: 45, farge: '#dcfce7' },
    { navn: 'sommer', fra: 135, farge: '#fef9c3' },
    { navn: 'høst', fra: 225, farge: '#fed7aa' },
];
const BLOT = [
    { navn: 'høst', grad: 250, formal: 'god årsvekst', y: 250 },
    { navn: 'midtvinter, jul', grad: 0, formal: 'grøden i året som kom', y: 430 },
    { navn: 'vår', grad: 75, formal: 'krigslykke', y: 610 },
];

function Sektor({ fra, farge }: { fra: number; farge: string }) {
    const a = punkt(fra);
    const b = punkt(fra + 90);
    return (
        <path
            d={`M ${HJUL.x} ${HJUL.y} L ${a.x} ${a.y} A ${HJUL.r} ${HJUL.r} 0 0 1 ${b.x} ${b.y} Z`}
            fill={farge}
            stroke="#fff"
            strokeWidth={6}
        />
    );
}

function Aaret({ beat, d }: { beat: number; d: (s: number) => number }) {
    return (
        <g>
            {ÅRSTIDER.map((s) => (
                <Sektor key={s.navn} fra={s.fra} farge={s.farge} />
            ))}
            {ÅRSTIDER.map((s) => {
                const p = punkt(s.fra + 45, HJUL.r * 0.55);
                return (
                    <text key={s.navn} x={p.x} y={p.y + 14} textAnchor="middle" fontSize={40} fontWeight={800} fill="#475569">
                        {s.navn}
                    </text>
                );
            })}
            <circle cx={HJUL.x} cy={HJUL.y} r={56} fill="#7c2d12" />
            <text x={HJUL.x} y={HJUL.y + 12} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                året
            </text>
            {beat >= 3 &&
                BLOT.map((b, i) => {
                    const p = punkt(b.grad, HJUL.r + 4);
                    return (
                        <motion.g
                            key={b.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: beat === 3 ? d(0.5 + i * 0.6) : 0 }}
                        >
                            <circle cx={p.x} cy={p.y} r={34} fill="#dc2626" stroke="#fff" strokeWidth={6} />
                            <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fff">
                                {i + 1}
                            </text>
                        </motion.g>
                    );
                })}
            <AnimatePresence mode="wait">
                <motion.g
                    key={beat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: d(0.3) }}
                >
                    {beat === 0 && (
                        <g>
                            <text x={1180} y={240} textAnchor="middle" fontSize={60} fontWeight={900} fill="#0f172a">
                                Blot
                            </text>
                            {['på faste tider i året', 'og når det var krise'].map((t, i) => (
                                <motion.g key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.6 + i * 1.2) }}>
                                    <rect x={900} y={330 + i * 160} width={560} height={110} rx={24} fill={i ? '#fecaca' : '#fde68a'} />
                                    <text x={1180} y={400 + i * 160} textAnchor="middle" fontSize={42} fontWeight={800} fill="#0f172a">
                                        {t}
                                    </text>
                                </motion.g>
                            ))}
                        </g>
                    )}
                    {beat === 1 && (
                        <g>
                            <text x={1180} y={220} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                                Festmåltidet
                            </text>
                            <rect x={900} y={520} width={560} height={40} rx={10} fill="#78350f" />
                            <rect x={930} y={560} width={30} height={150} fill="#78350f" />
                            <rect x={1400} y={560} width={30} height={150} fill="#78350f" />
                            {[
                                { t: 'kjøtt', x: 1000, f: '#fca5a5' },
                                { t: 'øl', x: 1180, f: '#fcd34d' },
                                { t: 'mjød', x: 1360, f: '#fde68a' },
                            ].map((m, i) => (
                                <motion.g key={m.t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.6 + i * 0.8) }}>
                                    {i === 0 ? (
                                        <ellipse cx={m.x} cy={490} rx={70} ry={32} fill={m.f} stroke="#7f1d1d" strokeWidth={4} />
                                    ) : (
                                        <path
                                            d={`M ${m.x - 40} 420 L ${m.x + 40} 420 L ${m.x + 30} 518 L ${m.x - 30} 518 Z`}
                                            fill={m.f}
                                            stroke="#78350f"
                                            strokeWidth={4}
                                        />
                                    )}
                                    <text x={m.x} y={370} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                                        {m.t}
                                    </text>
                                </motion.g>
                            ))}
                            <text x={1180} y={790} textAnchor="middle" fontSize={36} fontWeight={700} fill="#475569">
                                kjøtt fra offerdyrene
                            </text>
                        </g>
                    )}
                    {beat === 2 && (
                        <g>
                            <text x={1180} y={220} textAnchor="middle" fontSize={50} fontWeight={900} fill="#0f172a">
                                Blodet ble smurt på
                            </text>
                            {['gudefigurene', 'veggene i og utenfor hovet', 'folkene selv'].map((t, i) => (
                                <motion.g key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.6 + i * 1.1) }}>
                                    <path
                                        d={`M 880 ${318 + i * 150} Q 862 ${348 + i * 150} 880 ${364 + i * 150} Q 898 ${348 + i * 150} 880 ${318 + i * 150} Z`}
                                        fill="#b91c1c"
                                    />
                                    <text x={920} y={360 + i * 150} fontSize={42} fontWeight={800} fill="#0f172a">
                                        {t}
                                    </text>
                                </motion.g>
                            ))}
                            <text x={1180} y={790} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                                et hov: et hus der folk holdt blot
                            </text>
                        </g>
                    )}
                    {beat === 3 && (
                        <g>
                            <text x={1180} y={440} textAnchor="middle" fontSize={150} fontWeight={900} fill="#dc2626">
                                3
                            </text>
                            <text x={1180} y={530} textAnchor="middle" fontSize={50} fontWeight={900} fill="#0f172a">
                                store blot i året
                            </text>
                            <text x={1180} y={600} textAnchor="middle" fontSize={36} fontWeight={700} fill="#475569">
                                ifølge sagaene
                            </text>
                        </g>
                    )}
                    {beat >= 4 &&
                        BLOT.map((b, i) => (
                            <motion.g key={b.navn} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.4 + i * 1.4) }}>
                                <circle cx={900} cy={b.y + 20} r={34} fill="#dc2626" />
                                <text x={900} y={b.y + 33} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fff">
                                    {i + 1}
                                </text>
                                <text x={960} y={b.y + 30} fontSize={50} fontWeight={900} fill="#0f172a">
                                    {b.navn}
                                </text>
                                <text x={960} y={b.y + 90} fontSize={42} fontWeight={700} fill="#475569">
                                    for {b.formal}
                                </text>
                            </motion.g>
                        ))}
                </motion.g>
            </AnimatePresence>
        </g>
    );
}

function Kolonne({
    x,
    tittel,
    farge,
    ikon,
    linjer,
    verdi,
}: {
    x: number;
    tittel: string;
    farge: string;
    ikon: 'kors' | 'tre';
    linjer: { t: string; vis: boolean; liten?: boolean }[];
    verdi: { t: string; vis: boolean };
}) {
    return (
        <g>
            <rect x={x - 330} y={140} width={660} height={700} rx={34} fill={farge} />
            {ikon === 'kors' ? (
                <path d={`M ${x - 12} 175 h 24 v 30 h 30 v 24 h -30 v 56 h -24 v -56 h -30 v -24 h 30 Z`} fill="#1e293b" />
            ) : (
                <g fill="#166534">
                    <rect x={x - 8} y={225} width={16} height={60} fill="#78350f" />
                    <circle cx={x} cy={210} r={36} />
                </g>
            )}
            <text x={x} y={345} textAnchor="middle" fontSize={54} fontWeight={900} fill="#0f172a">
                {tittel}
            </text>
            {linjer.map((l, i) =>
                l.vis ? (
                    <motion.text
                        key={l.t}
                        x={x}
                        y={400 + i * 46}
                        textAnchor="middle"
                        fontSize={l.liten ? 36 : 42}
                        fontWeight={l.liten ? 700 : 800}
                        fill={l.liten ? '#450a0a' : '#0f172a'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {l.t}
                    </motion.text>
                ) : null
            )}
            {verdi.vis && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <rect x={x - 290} y={720} width={580} height={96} rx={24} fill="#1e293b" />
                    <text x={x} y={782} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fff">
                        {verdi.t}
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Motet({ beat }: { beat: number }) {
    return (
        <g>
            <Kolonne
                x={430}
                tittel="Kristendommen"
                farge="#e0e7ff"
                ikon="kors"
                linjer={[
                    { t: 'kirker og prester', vis: true },
                    { t: 'en ny kristenrett', vis: true },
                    { t: 'loven om kirken.', vis: beat >= 1, liten: true },
                    { t: 'Straff for å', vis: beat >= 1, liten: true },
                    { t: 'arbeide på en helligdag', vis: beat >= 1, liten: true },
                    { t: 'nekte å døpe barna', vis: beat >= 2, liten: true },
                    { t: 'gifte seg med mer enn én', vis: beat >= 2, liten: true },
                ]}
                verdi={{ t: 'underkastelse og ydmykhet', vis: beat >= 3 }}
            />
            <Kolonne
                x={1170}
                tittel="Åsatru"
                farge="#fef3c7"
                ikon="tre"
                linjer={[
                    { t: 'ingen bok, ingen bud', vis: true },
                    { t: 'skikker og blot', vis: true },
                ]}
                verdi={{ t: 'mot og handling', vis: beat >= 4 }}
            />
        </g>
    );
}

export function AsatroAaret({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'gudene';
    const d = (s: number) => (playing ? s : 0);
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f6f1e7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'gudene' && <Gudene beat={beat} d={d} />}
                {modus === 'aaret' && <Aaret beat={beat} d={d} />}
                {modus === 'motet' && <Motet beat={beat} />}
            </svg>
        </div>
    );
}
