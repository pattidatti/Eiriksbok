import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';

/**
 * Tidene for bønn.
 * «tider»: faste bønner i døgnet som rader med prikker: islam, jødedommen, kristendommen uten
 * felles tider, de åtte katolske tidebønnene, og sjiamuslimene som samler bønnene sine.
 * «sikh»: døgnet som et hjul med dag over og natt under, de tre faste bønnene, og så
 * gurdwaraen der tekstene blir sunget.
 */

type Modus = 'tider' | 'sikh';

const B = 1600;
const H = 900;

const TEKST: Record<Modus, string[]> = {
    tider: [
        'Faste bønner i døgnet',
        'Fadervår: den ene bønnen alle kirker har felles',
        'Den katolske kirken: åtte tidebønner',
        'Prester, munker og nonner: hver dag',
        'Sjiamuslimer: like mange bønner, færre tidspunkter',
    ],
    sikh: [
        'Sikhismen: nam simran',
        'Tre faste bønner',
        'I gurdwaraen blir tekstene sunget',
        'Guru Granth Sahib: ordnet etter melodier',
    ],
};

function Prikker({
    n,
    x0,
    y,
    farge,
    steg = 70,
    forsinkelse = 0,
}: {
    n: number;
    x0: number;
    y: number;
    farge: string;
    steg?: number;
    forsinkelse?: number;
}) {
    return (
        <>
            {Array.from({ length: n }, (_, i) => (
                <motion.circle
                    key={i}
                    cx={x0 + i * steg}
                    cy={y}
                    r={24}
                    fill={farge}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: forsinkelse + i * 0.15, duration: 0.35 }}
                    style={{
                        transformOrigin: `${x0 + i * steg}px ${y}px`,
                        transformBox: 'view-box',
                    }}
                />
            ))}
        </>
    );
}

function Rad({
    y,
    navn,
    farge,
    lys,
    children,
}: {
    y: number;
    navn: string;
    farge: string;
    lys: boolean;
    children?: React.ReactNode;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: lys ? 1 : 0.4, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <rect x={90} y={y - 14} width={12} height={28} rx={6} fill={farge} />
            <text x={120} y={y + 14} fontSize={40} fontWeight={900} fill="#0f172a">
                {navn}
            </text>
            {children}
        </motion.g>
    );
}

function Tider({ beat }: { beat: number }) {
    const x0 = 640;
    return (
        <>
            <Rad y={250} navn="Islam" farge="#10b981" lys={beat === 0 || beat === 4}>
                <Prikker n={5} x0={x0} y={250} farge="#10b981" />
                <text x={x0 + 4 * 70 + 60} y={262} fontSize={34} fontWeight={700} fill="#475569">
                    fem, etter sola
                </text>
            </Rad>
            <Rad y={375} navn="Jødedom" farge="#3b82f6" lys={beat === 0}>
                <Prikker n={3} x0={x0} y={375} farge="#3b82f6" forsinkelse={0.5} />
                <text x={x0 + 2 * 70 + 60} y={387} fontSize={34} fontWeight={700} fill="#475569">
                    morgen, ettermiddag, kveld
                </text>
            </Rad>
            <Rad y={500} navn="Kristendom" farge="#6366f1" lys={beat <= 1}>
                <text x={x0 - 24} y={512} fontSize={34} fontWeight={700} fill="#475569">
                    ingen tider som gjelder alle
                </text>
                {beat >= 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect x={1190} y={466} width={370} height={68} rx={34} fill="#6366f1" />
                        <text
                            x={1375}
                            y={512}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#ffffff"
                        >
                            Fadervår: felles
                        </text>
                    </motion.g>
                )}
            </Rad>
            {beat >= 2 && (
                <Rad
                    y={625}
                    navn="Katolske tidebønner"
                    farge="#6366f1"
                    lys={beat === 2 || beat === 3}
                >
                    <Prikker n={8} x0={x0 + 40} y={625} farge="#4f46e5" steg={64} />
                    {beat >= 3 && (
                        <motion.text
                            x={x0 + 16}
                            y={692}
                            fontSize={32}
                            fontWeight={700}
                            fill="#4338ca"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            prester, munker og nonner må be dem hver dag
                        </motion.text>
                    )}
                </Rad>
            )}
            {beat >= 4 && (
                <Rad y={790} navn="Sjiamuslimer" farge="#10b981" lys>
                    <Prikker n={5} x0={x0} y={790} farge="#10b981" />
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <path d="M 960 790 L 1030 790" stroke="#0f172a" strokeWidth={6} />
                        <path d="M 1030 772 L 1056 790 L 1030 808 Z" fill="#0f172a" />
                        {[0, 1, 2].map((i) => (
                            <g key={i}>
                                <circle
                                    cx={1100 + i * 70}
                                    cy={790}
                                    r={26}
                                    fill="#ffffff"
                                    stroke="#0f172a"
                                    strokeWidth={5}
                                />
                                <path
                                    d={`M ${1100 + i * 70} 790 L ${1100 + i * 70} 774 M ${1100 + i * 70} 790 L ${1112 + i * 70} 796`}
                                    stroke="#0f172a"
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                />
                            </g>
                        ))}
                        <text x={1320} y={802} fontSize={34} fontWeight={800} fill="#0f172a">
                            tre tidspunkter
                        </text>
                    </motion.g>
                </Rad>
            )}
        </>
    );
}

/** Et punkt på døgnhjulet. Vinkel i grader: 180 = morgen, 90 = midt på dagen, 0 = kveld. */
function punkt(cx: number, cy: number, r: number, grader: number) {
    const a = (grader * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy - Math.sin(a) * r] as const;
}

function Sikh({ beat }: { beat: number }) {
    const cx = 640;
    const cy = 520;
    const r = 290;
    const hjul = beat <= 1;
    const bonner = [
        { g: 196, navn: 'Før daggry', side: 'v' as const },
        { g: 0, navn: 'Ved solnedgang', side: 'h' as const },
        { g: -42, navn: 'Rett før leggetid', side: 'h' as const },
    ];
    return (
        <>
            {hjul && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <path
                        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`}
                        fill="#fde68a"
                    />
                    <path
                        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy} Z`}
                        fill="#1e293b"
                    />
                    <line
                        x1={cx - r - 30}
                        y1={cy}
                        x2={cx + r + 30}
                        y2={cy}
                        stroke="#78716c"
                        strokeWidth={4}
                    />
                    <text
                        x={cx}
                        y={cy - r + 70}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#92400e"
                    >
                        dag
                    </text>
                    <text
                        x={cx}
                        y={cy + r - 44}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#e2e8f0"
                    >
                        natt
                    </text>
                    {/* Guds navn som gjentas: ringer som går ut fra midten */}
                    {beat === 0 && (
                        <g>
                            {[0, 1, 2].map((i) => (
                                <circle
                                    key={i}
                                    cx={cx}
                                    cy={cy - 90}
                                    r={60}
                                    fill="none"
                                    stroke="#ea580c"
                                    strokeWidth={5}
                                >
                                    <animate
                                        attributeName="r"
                                        values="50;150"
                                        dur="3s"
                                        begin={`${i}s`}
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0.9;0"
                                        dur="3s"
                                        begin={`${i}s`}
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            ))}
                            <rect
                                x={cx - 140}
                                y={cy - 130}
                                width={280}
                                height={74}
                                rx={37}
                                fill="#ea580c"
                            />
                            <text
                                x={cx}
                                y={cy - 80}
                                textAnchor="middle"
                                fontSize={38}
                                fontWeight={900}
                                fill="#ffffff"
                            >
                                Guds navn
                            </text>
                        </g>
                    )}
                    {beat === 0 && (
                        <text x={1100} y={420} fontSize={40} fontWeight={900} fill="#0f172a">
                            <tspan x={1060} dy={0}>
                                Nam simran:
                            </tspan>
                            <tspan x={1060} dy={56} fontWeight={700} fill="#475569">
                                å gjenta og huske
                            </tspan>
                            <tspan x={1060} dy={52} fontWeight={700} fill="#475569">
                                Guds navn
                            </tspan>
                        </text>
                    )}
                    {beat >= 1 &&
                        bonner.map((b, i) => {
                            const [x, y] = punkt(cx, cy, r, b.g);
                            return (
                                <motion.g
                                    key={b.navn}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.6, duration: 0.5 }}
                                >
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={34}
                                        fill="#ea580c"
                                        stroke="#ffffff"
                                        strokeWidth={6}
                                    />
                                    <text
                                        x={x}
                                        y={y + 14}
                                        textAnchor="middle"
                                        fontSize={38}
                                        fontWeight={900}
                                        fill="#ffffff"
                                    >
                                        {i + 1}
                                    </text>
                                    <text
                                        x={b.side === 'v' ? x - 50 : x + 50}
                                        y={y + 14}
                                        textAnchor={b.side === 'v' ? 'end' : 'start'}
                                        fontSize={38}
                                        fontWeight={900}
                                        fill="#0f172a"
                                        stroke="#f8fafc"
                                        strokeWidth={8}
                                        paintOrder="stroke"
                                    >
                                        {b.navn}
                                    </text>
                                </motion.g>
                            );
                        })}
                </motion.g>
            )}
            {!hjul && <Gurdwara beat={beat} />}
        </>
    );
}

/** Gurdwaraen: boka på et lite alter, musikere som synger, alle på samme gulv. */
function Gurdwara({ beat }: { beat: number }) {
    const gulv = 720;
    const sittende = [200, 330, 460, 1140, 1270, 1400];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect x={0} y={gulv} width={B} height={H - gulv} fill="#e7e5e4" />
            <rect x={0} y={gulv - 6} width={B} height={8} fill="#a8a29e" />
            {/* Alteret med boka */}
            <rect x={690} y={520} width={220} height={200} rx={10} fill="#f59e0b" />
            <rect x={670} y={500} width={260} height={30} rx={8} fill="#b45309" />
            <path
                d="M 710 500 L 800 470 L 890 500 Z"
                fill="#fef3c7"
                stroke="#92400e"
                strokeWidth={4}
            />
            <line x1={800} y1={470} x2={800} y2={500} stroke="#92400e" strokeWidth={4} />
            {/* Musikere og noter */}
            {[600, 1000].map((x, i) => (
                <g key={x}>
                    <circle cx={x} cy={600} r={30} fill="#c2410c" />
                    <path d={`M ${x - 32} 594 Q ${x} 556 ${x + 32} 594 Z`} fill="#1e3a8a" />
                    <rect
                        x={x - 40}
                        y={630}
                        width={80}
                        height={90}
                        rx={30}
                        fill="#f8fafc"
                        stroke="#94a3b8"
                        strokeWidth={3}
                    />
                    {[0, 1, 2].map((k) => (
                        <text
                            key={k}
                            x={x + (i ? 30 : -90) + k * 44}
                            y={540 - (k % 2) * 22}
                            fontSize={52}
                            fill="#ea580c"
                        >
                            ♪
                            <animate
                                attributeName="opacity"
                                values="0;1;0"
                                dur="2.4s"
                                begin={`${k * 0.8}s`}
                                repeatCount="indefinite"
                            />
                        </text>
                    ))}
                </g>
            ))}
            {/* Folk som sitter på samme gulv, med noe på hodet */}
            {sittende.map((x) => (
                <g key={x} opacity={beat >= 3 ? 1 : 0.35}>
                    <circle cx={x} cy={650} r={26} fill="#a16207" />
                    <path d={`M ${x - 28} 646 Q ${x} 610 ${x + 28} 646 Z`} fill="#ea580c" />
                    <rect x={x - 38} y={676} width={76} height={44} rx={20} fill="#64748b" />
                </g>
            ))}
            {beat === 2 && (
                <text
                    x={800}
                    y={330}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Musikere synger tekstene
                </text>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect
                        x={430}
                        y={230}
                        width={740}
                        height={160}
                        rx={24}
                        fill="#ffffff"
                        stroke="#ea580c"
                        strokeWidth={5}
                    />
                    <text
                        x={800}
                        y={292}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Ordnet etter melodier
                    </text>
                    <text
                        x={800}
                        y={350}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#64748b"
                    >
                        ikke etter tema
                    </text>
                    <text
                        x={800}
                        y={800}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#44403c"
                    >
                        Alle sitter på det samme gulvet
                    </text>
                </motion.g>
            )}
        </motion.g>
    );
}

export function BonnKlokke({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'tider';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f8fafc' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'tider' ? <Tider beat={beat} /> : <Sikh beat={beat} />}
            </svg>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
