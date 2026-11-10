import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Livslinja som former idiolekten, i to moduser.
 * «barn»: fødested, familie og skole, første ord, grammatikken og samtaler mot TV.
 * «livet»: ny skole, ny landsdel og jobb legger nye farger i språket, og tre utgaver av deg.
 */

type Modus = 'barn' | 'livet';

const B = 1600;
const H = 900;
const LINJE_Y = 640;

const TEAL = '#0f766e';
const ORANSJE = '#c2410c';
const BLA = '#2563eb';
const LILLA = '#7c3aed';
const GRA = '#94a3b8';

export function IdiolektLivslinje({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'barn';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#fdf8f0' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'barn' ? <Barn beat={beat} /> : <Livet beat={beat} />}
            </svg>
        </div>
    );
}

function Tittel({ tekst }: { tekst: string }) {
    return (
        <motion.text
            key={tekst}
            x={B / 2}
            y={100}
            textAnchor="middle"
            fontSize={60}
            fontWeight={900}
            fill="#0f172a"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {tekst}
        </motion.text>
    );
}

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

function Person({ x, y, s = 1, farge }: { x: number; y: number; s?: number; farge: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`} fill={farge}>
            <circle cx={0} cy={-20} r={9} />
            <path d="M -12 14 L -12 -2 Q -12 -9 -5 -9 L 5 -9 Q 12 -9 12 -2 L 12 14 Z" />
        </g>
    );
}

/** Kort med tekst på én eller to linjer. Bredden følger den lengste linja. */
function Kort({
    x,
    y,
    linjer,
    farge,
    str = 36,
    ikon,
}: {
    x: number;
    y: number;
    linjer: string[];
    farge: string;
    str?: number;
    ikon?: ReactNode;
}) {
    const lengst = Math.max(...linjer.map((l) => l.length));
    const b = Math.max(lengst * str * 0.56 + 60, 220);
    const ikonH = ikon ? 90 : 0;
    const h = linjer.length * str * 1.25 + 40 + ikonH;
    return (
        <g>
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={22}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            {ikon && <g transform={`translate(${x} ${y - h / 2 + 62})`}>{ikon}</g>}
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x}
                    y={y - h / 2 + ikonH + 20 + str + i * str * 1.25}
                    textAnchor="middle"
                    fontSize={str}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    {l}
                </text>
            ))}
        </g>
    );
}

function Linje({ til = 1460 }: { til?: number }) {
    return (
        <g>
            <motion.line
                x1={140}
                y1={LINJE_Y}
                x2={til}
                y2={LINJE_Y}
                stroke="#334155"
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
            />
            <path
                d={`M ${til + 4} ${LINJE_Y - 18} L ${til + 34} ${LINJE_Y} L ${til + 4} ${LINJE_Y + 18} Z`}
                fill="#334155"
            />
        </g>
    );
}

function Merke({ x, tekst, farge }: { x: number; tekst: string; farge: string }) {
    return (
        <Inn>
            <circle cx={x} cy={LINJE_Y} r={20} fill={farge} stroke="#ffffff" strokeWidth={5} />
            <text
                x={x}
                y={LINJE_Y + 72}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill={farge}
            >
                {tekst}
            </text>
        </Inn>
    );
}

/* ---------- ikoner ---------- */

const IkonSted = (
    <path
        d="M 0 30 C -26 0 -26 -30 0 -30 C 26 -30 26 0 0 30 Z M 0 -18 a 9 9 0 1 0 0.1 0 Z"
        fill={TEAL}
        fillRule="evenodd"
    />
);
const IkonFamilie = (
    <g>
        <Person x={-26} y={8} s={1.6} farge={ORANSJE} />
        <Person x={22} y={14} s={1.2} farge={ORANSJE} />
    </g>
);
const IkonSkole = (
    <g fill="none" stroke={BLA} strokeWidth={5} strokeLinejoin="round">
        <path d="M -36 -22 L 0 -14 L 36 -22 L 36 24 L 0 32 L -36 24 Z" fill="#dbeafe" />
        <path d="M 0 -14 L 0 32" />
    </g>
);

/* ---------- barn ---------- */

const X_ETT = 420;
const X_FEM = 860;

function Barn({ beat }: { beat: number }) {
    const titler = [
        'Formet av livshistorien',
        'Sted, familie og skole',
        'Første ord: rundt ettårsdagen',
        'Femårsalderen: grammatikken på plass',
        'Ekte samtaler, ikke bare lyd',
    ];
    return (
        <g>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            <Linje />
            <Person x={170} y={LINJE_Y - 50} s={1.6} farge={LILLA} />
            <text
                x={170}
                y={LINJE_Y + 72}
                textAnchor="middle"
                fontSize={34}
                fontWeight={700}
                fill="#475569"
            >
                født
            </text>
            <text
                x={1440}
                y={LINJE_Y + 72}
                textAnchor="end"
                fontSize={34}
                fontWeight={700}
                fill="#475569"
            >
                i dag
            </text>
            {beat === 1 && (
                <>
                    <Inn>
                        <Kort
                            x={400}
                            y={360}
                            linjer={['Hvor du', 'ble født']}
                            farge={TEAL}
                            ikon={IkonSted}
                        />
                    </Inn>
                    <Inn forsinkelse={0.5}>
                        <Kort
                            x={800}
                            y={360}
                            linjer={['Familiens', 'bakgrunn']}
                            farge={ORANSJE}
                            ikon={IkonFamilie}
                        />
                    </Inn>
                    <Inn forsinkelse={1}>
                        <Kort
                            x={1200}
                            y={360}
                            linjer={['Hvor mye', 'skolegang']}
                            farge={BLA}
                            ikon={IkonSkole}
                        />
                    </Inn>
                </>
            )}
            {beat >= 2 && <Merke x={X_ETT} tekst="rundt 1 år" farge={TEAL} />}
            {beat >= 3 && <Merke x={X_FEM} tekst="5 år" farge={BLA} />}
            {beat === 2 && (
                <Inn forsinkelse={0.3}>
                    <Person x={X_ETT} y={LINJE_Y - 50} s={1.4} farge={TEAL} />
                    <Kort x={X_ETT} y={400} linjer={['Første ord']} farge={TEAL} />
                </Inn>
            )}
            {beat === 3 && (
                <Inn forsinkelse={0.3}>
                    <Person x={X_FEM} y={LINJE_Y - 56} s={1.9} farge={BLA} />
                    <Kort
                        x={X_FEM}
                        y={380}
                        linjer={['Grunnleggende grammatikk:', 'bøye ord og sette dem sammen']}
                        farge={BLA}
                        str={34}
                    />
                </Inn>
            )}
            {beat >= 4 && (
                <>
                    <Inn>
                        <g transform="translate(560 360)">
                            <rect
                                x={-240}
                                y={-140}
                                width={480}
                                height={280}
                                rx={26}
                                fill="#ffffff"
                                stroke={TEAL}
                                strokeWidth={5}
                            />
                            <Person x={-90} y={10} s={3} farge={ORANSJE} />
                            <Person x={90} y={30} s={2.1} farge={LILLA} />
                            <rect x={-150} y={-120} width={90} height={44} rx={18} fill={ORANSJE} />
                            <rect x={70} y={-95} width={80} height={40} rx={16} fill={LILLA} />
                            <text
                                y={118}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill="#0f172a"
                            >
                                Samtale med mennesker
                            </text>
                        </g>
                        <g transform="translate(870 260)">
                            <circle r={38} fill={TEAL} />
                            <path
                                d="M -18 0 L -5 14 L 20 -14"
                                stroke="#ffffff"
                                strokeWidth={9}
                                fill="none"
                                strokeLinecap="round"
                            />
                        </g>
                    </Inn>
                    <Inn forsinkelse={0.6}>
                        <g transform="translate(1110 360)">
                            <rect
                                x={-200}
                                y={-140}
                                width={400}
                                height={280}
                                rx={26}
                                fill="#ffffff"
                                stroke={GRA}
                                strokeWidth={5}
                            />
                            <rect
                                x={-120}
                                y={-100}
                                width={240}
                                height={150}
                                rx={12}
                                fill="#1e293b"
                            />
                            <rect
                                x={-104}
                                y={-86}
                                width={208}
                                height={122}
                                rx={6}
                                fill="#38bdf8"
                                opacity={0.5}
                            />
                            <path
                                d="M -40 50 L -60 78 M 40 50 L 60 78"
                                stroke="#1e293b"
                                strokeWidth={8}
                            />
                            <text
                                y={118}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill="#0f172a"
                            >
                                TV alene
                            </text>
                        </g>
                        <g transform="translate(1390 260)">
                            <circle r={38} fill="#dc2626" />
                            <path
                                d="M -14 -14 L 14 14 M 14 -14 L -14 14"
                                stroke="#ffffff"
                                strokeWidth={9}
                                strokeLinecap="round"
                            />
                        </g>
                    </Inn>
                </>
            )}
        </g>
    );
}

/* ---------- livet ---------- */

const STASJONER = [
    { x: 460, navn: 'Ny skole', ny: 'nye ord', farge: TEAL },
    { x: 860, navn: 'Ny landsdel', ny: 'nye målmerker', farge: ORANSJE },
    { x: 1260, navn: 'Jobb', ny: 'fagspråk', farge: BLA },
];

/** Kakediagram uten tall: en blanding av farger. */
function Blanding({
    x,
    y,
    r,
    deler,
}: {
    x: number;
    y: number;
    r: number;
    deler: { farge: string; v: number }[];
}) {
    const sum = deler.reduce((a, d) => a + d.v, 0);
    const vinkler = deler.map((_, i) => {
        const for_ = deler.slice(0, i).reduce((a, d) => a + d.v, 0);
        return [
            -Math.PI / 2 + (for_ / sum) * Math.PI * 2,
            -Math.PI / 2 + ((for_ + deler[i].v) / sum) * Math.PI * 2,
        ];
    });
    return (
        <g>
            {deler.map((d, i) => {
                const [a0, a1] = vinkler[i];
                if (deler.length === 1)
                    return <circle key={i} cx={x} cy={y} r={r} fill={d.farge} />;
                const stor = a1 - a0 > Math.PI ? 1 : 0;
                const p = `M ${x} ${y} L ${x + r * Math.cos(a0)} ${y + r * Math.sin(a0)} A ${r} ${r} 0 ${stor} 1 ${x + r * Math.cos(a1)} ${y + r * Math.sin(a1)} Z`;
                return <path key={i} d={p} fill={d.farge} stroke="#ffffff" strokeWidth={4} />;
            })}
        </g>
    );
}

function Livet({ beat }: { beat: number }) {
    const titler = [
        'Idiolekten står ikke stille',
        'Ny skole: nye ord',
        'Ny landsdel: nye målmerker',
        'Jobb: fagspråk',
        'Ikke helt den samme som før',
    ];
    if (beat >= 4) {
        const utgaver = [
            {
                tekst: 'For tre år siden',
                deler: [
                    { farge: GRA, v: 7 },
                    { farge: TEAL, v: 2 },
                ],
            },
            {
                tekst: 'I dag',
                deler: [
                    { farge: GRA, v: 6 },
                    { farge: TEAL, v: 2 },
                    { farge: ORANSJE, v: 2 },
                    { farge: BLA, v: 2 },
                ],
            },
            {
                tekst: 'Om ti år',
                deler: [
                    { farge: GRA, v: 5 },
                    { farge: TEAL, v: 2 },
                    { farge: ORANSJE, v: 2 },
                    { farge: BLA, v: 2 },
                    { farge: '#db2777', v: 3 },
                ],
            },
        ];
        return (
            <g>
                <Tittel tekst={titler[4]} />
                {utgaver.map((u, i) => (
                    <Inn key={u.tekst} forsinkelse={i * 0.5}>
                        <Blanding x={360 + i * 440} y={430} r={150} deler={u.deler} />
                        <circle cx={360 + i * 440} cy={430} r={62} fill="#fdf8f0" />
                        <Person x={360 + i * 440} y={442} s={2.2} farge={LILLA} />
                        <text
                            x={360 + i * 440}
                            y={680}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            {u.tekst}
                        </text>
                        {i < 2 && (
                            <path
                                d={`M ${540 + i * 440} 430 L ${620 + i * 440} 430 M ${600 + i * 440} 412 L ${620 + i * 440} 430 L ${600 + i * 440} 448`}
                                stroke="#334155"
                                strokeWidth={7}
                                fill="none"
                                strokeLinecap="round"
                            />
                        )}
                    </Inn>
                ))}
                <text
                    x={B / 2}
                    y={800}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={600}
                    fill="#64748b"
                >
                    Skisse: fargene er nye ord og trekk, ikke målte andeler
                </text>
            </g>
        );
    }
    const her = beat === 0 ? 220 : STASJONER[beat - 1].x;
    const deler = [
        { farge: GRA, v: 6 },
        ...STASJONER.slice(0, beat).map((s) => ({ farge: s.farge, v: 2 })),
    ];
    return (
        <g>
            <Tittel tekst={titler[beat]} />
            <Linje />
            {STASJONER.map((s, i) => (
                <g key={s.navn} opacity={beat >= i + 1 ? 1 : 0.35}>
                    <circle
                        cx={s.x}
                        cy={LINJE_Y}
                        r={18}
                        fill={s.farge}
                        stroke="#ffffff"
                        strokeWidth={5}
                    />
                    <text
                        x={s.x}
                        y={LINJE_Y + 70}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={800}
                        fill={s.farge}
                    >
                        {s.navn}
                    </text>
                </g>
            ))}
            <motion.g
                initial={false}
                animate={{ x: her }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
            >
                <Person x={0} y={LINJE_Y - 58} s={2} farge={LILLA} />
            </motion.g>
            {beat >= 1 && (
                <motion.g
                    key={beat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <rect
                        x={her - (STASJONER[beat - 1].ny.length * 22 + 70) / 2}
                        y={LINJE_Y - 220}
                        width={STASJONER[beat - 1].ny.length * 22 + 70}
                        height={76}
                        rx={36}
                        fill={STASJONER[beat - 1].farge}
                    />
                    <path
                        d={`M ${her - 10} ${LINJE_Y - 145} l -6 22 l 26 -22 z`}
                        fill={STASJONER[beat - 1].farge}
                    />
                    <text
                        x={her}
                        y={LINJE_Y - 168}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#ffffff"
                    >
                        {STASJONER[beat - 1].ny}
                    </text>
                </motion.g>
            )}
            <g>
                <Blanding x={220} y={290} r={115} deler={deler} />
                <circle cx={220} cy={290} r={50} fill="#fdf8f0" />
                <text
                    x={220}
                    y={450}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#334155"
                >
                    idiolekten din
                </text>
            </g>
        </g>
    );
}
