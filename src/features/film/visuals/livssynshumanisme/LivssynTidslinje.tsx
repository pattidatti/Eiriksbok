import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { LivssynOverskrift, Person, Vis } from './felles';

/**
 * 2D: tidslinjer.
 * «ideer»: mennesket i sentrum, og tankene livssynshumanismen bygger på (Protagoras,
 *   renessansehumanismen som er noe annet, opplysningstiden, naturvitenskapen).
 * «amsterdam»: Amsterdam-erklæringen 1952, 2002, 2022 og sitatet om moralen.
 * «forbund»: Human-Etisk Forbund fra rundt 400 i 1956 til rundt 180 000 i 2026 (sirkler med
 *   areal etter antall), seremoniene og likebehandling.
 */

type Modus = 'ideer' | 'amsterdam' | 'forbund';

const OVERSKRIFT: Record<Modus, string[]> = {
    ideer: [
        'Mennesket i sentrum',
        'Protagoras, for over 2400 år siden',
        'Renessansehumanismen: noe annet',
        'Opplysningstiden, 1700-tallet',
        'Naturvitenskapen, 1800-tallet',
    ],
    amsterdam: [
        'Amsterdam-erklæringen',
        'Vedtatt i 1952',
        'Skrevet om i 2002 og 2022',
        'Amsterdam-erklæringen om moralen',
    ],
    forbund: [
        'Stiftet i 1956',
        'Human-Etisk Forbund blir til',
        'Medlemmer i 2026',
        'Fire seremonier over hele landet',
        'Alle livssyn skal behandles likt',
    ],
};

/* --------------------------------------------------------------- Ideer */

const PUNKT = [
    {
        x: 230,
        aar: 'over 2400 år siden',
        linjer: ['Protagoras:', 'mennesket er alle', 'tings målestokk'],
        opp: true,
        gra: false,
    },
    {
        x: 620,
        aar: '1300- og 1400-tallet',
        linjer: ['Renessanse-', 'humanisme: lærde,', 'de fleste kristne'],
        opp: false,
        gra: true,
    },
    {
        x: 1000,
        aar: '1700-tallet',
        linjer: ['Opplysnings-', 'tiden: mye', 'hentes herfra'],
        opp: true,
        gra: false,
    },
    {
        x: 1360,
        aar: '1800-tallet',
        linjer: ['Naturvitenskap:', 'verden forklart', 'uten overnaturlig'],
        opp: false,
        gra: false,
    },
];

function Ideer({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <circle cx={800} cy={520} r={190} fill="#ccfbf1" />
                <circle cx={800} cy={520} r={190} fill="none" stroke="#0f766e" strokeWidth={6} />
                <Person x={800} y={650} h={260} farge="#0f766e" />
                <rect
                    x={90}
                    y={440}
                    width={460}
                    height={130}
                    rx={22}
                    fill="#ffffff"
                    stroke="#cbd5e1"
                    strokeWidth={3}
                />
                <text
                    x={320}
                    y={495}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#475569"
                >
                    Ikke fordi vi
                </text>
                <text
                    x={320}
                    y={540}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#475569"
                >
                    er fullkomne
                </text>
                <rect x={1050} y={440} width={460} height={130} rx={22} fill="#0f766e" />
                <text
                    x={1280}
                    y={495}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#ffffff"
                >
                    Vi må finne ut
                </text>
                <text
                    x={1280}
                    y={540}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#ffffff"
                >
                    av ting selv
                </text>
                <text
                    x={800}
                    y={800}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#334155"
                >
                    Ingen fasit å slå opp i
                </text>
            </motion.g>
        );
    }
    const Y = 560;
    return (
        <g>
            {/* Aksen, brutt mellom antikken og 1300-tallet */}
            <line x1={90} y1={Y} x2={395} y2={Y} stroke="#475569" strokeWidth={6} />
            <path
                d={`M 395 ${Y} l 12 -18 l 16 36 l 16 -36 l 12 18`}
                fill="none"
                stroke="#475569"
                strokeWidth={6}
                strokeLinejoin="round"
            />
            <line x1={451} y1={Y} x2={1510} y2={Y} stroke="#475569" strokeWidth={6} />
            <path d={`M 1510 ${Y - 16} L 1540 ${Y} L 1510 ${Y + 16} Z`} fill="#475569" />
            {PUNKT.map((p, i) => {
                const vist = beat >= i + 1;
                const na = beat === i + 1;
                const kortY = p.opp ? 230 : 640;
                const farge = p.gra ? '#64748b' : '#0f766e';
                return (
                    <g key={p.aar}>
                        <circle cx={p.x} cy={Y} r={na ? 18 : 12} fill={vist ? farge : '#cbd5e1'} />
                        <text
                            x={p.x}
                            y={p.opp ? Y + 52 : Y - 30}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill={vist ? '#334155' : '#94a3b8'}
                        >
                            {p.aar}
                        </text>
                        <Vis nar={vist}>
                            <line
                                x1={p.x}
                                y1={p.opp ? kortY + 190 : Y + 20}
                                x2={p.x}
                                y2={p.opp ? Y - 20 : kortY}
                                stroke={farge}
                                strokeWidth={4}
                            />
                            <rect
                                x={p.x - 175}
                                y={kortY}
                                width={350}
                                height={190}
                                rx={22}
                                fill={p.gra ? '#f1f5f9' : na ? '#f0fdfa' : '#ffffff'}
                                stroke={farge}
                                strokeWidth={na ? 6 : 3}
                                strokeDasharray={p.gra ? '12 8' : undefined}
                            />
                            {p.linjer.map((l, j) => (
                                <text
                                    key={j}
                                    x={p.x}
                                    y={kortY + 60 + j * 48}
                                    textAnchor="middle"
                                    fontSize={j === 0 ? 32 : 29}
                                    fontWeight={j === 0 ? 900 : 700}
                                    fill={p.gra ? '#475569' : '#0f172a'}
                                >
                                    {l}
                                </text>
                            ))}
                        </Vis>
                    </g>
                );
            })}
            <Vis nar={beat >= 2}>
                <rect x={455} y={850} width={330} height={44} rx={12} fill="#64748b" />
                <text
                    x={620}
                    y={882}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={800}
                    fill="#ffffff"
                >
                    ikke samme sak
                </text>
            </Vis>
        </g>
    );
}

/* ----------------------------------------------------------- Amsterdam */

function Ark({ x, y, aar, fremst }: { x: number; y: number; aar: string; fremst: boolean }) {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={300}
                height={380}
                rx={14}
                fill="#ffffff"
                stroke={fremst ? '#0f766e' : '#94a3b8'}
                strokeWidth={fremst ? 6 : 3}
            />
            {Array.from({ length: 6 }, (_, i) => (
                <rect
                    key={i}
                    x={x + 40}
                    y={y + 130 + i * 34}
                    width={i % 3 === 2 ? 150 : 220}
                    height={12}
                    rx={6}
                    fill="#cbd5e1"
                />
            ))}
            <text
                x={x + 150}
                y={y + 80}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={fremst ? '#0f766e' : '#64748b'}
            >
                {aar}
            </text>
        </g>
    );
}

const AKSE = (aar: number) => 300 + ((aar - 1952) / 70) * 1000;

function Amsterdam({ beat }: { beat: number }) {
    const ar = beat >= 2 ? ['1952', '2002', '2022'] : ['1952'];
    return (
        <g>
            {beat <= 2 && (
                <g>
                    {ar.map((a, i) => (
                        <motion.g
                            key={a}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.3 }}
                        >
                            <Ark
                                x={480 + i * 170}
                                y={190 + i * 20}
                                aar={a}
                                fremst={i === ar.length - 1}
                            />
                        </motion.g>
                    ))}
                    {beat === 0 && (
                        <g>
                            <rect x={880} y={330} width={600} height={130} rx={22} fill="#0f766e" />
                            <text
                                x={1180}
                                y={385}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={800}
                                fill="#ffffff"
                            >
                                Hva humanister over hele
                            </text>
                            <text
                                x={1180}
                                y={430}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={800}
                                fill="#ffffff"
                            >
                                verden står for
                            </text>
                        </g>
                    )}
                </g>
            )}
            <Vis nar={beat >= 3}>
                <rect
                    x={130}
                    y={190}
                    width={1340}
                    height={420}
                    rx={28}
                    fill="#ffffff"
                    stroke="#0f766e"
                    strokeWidth={6}
                />
                <text x={190} y={300} fontSize={120} fontWeight={900} fill="#99f6e4">
                    «
                </text>
                <text
                    x={800}
                    y={300}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    Vi mener at moralen hører mennesket til.
                </text>
                <text
                    x={800}
                    y={360}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    Den bygger på at levende vesener kan lide
                </text>
                <text
                    x={800}
                    y={420}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    og ha det godt, og den trenger ingen kilde
                </text>
                <text
                    x={800}
                    y={480}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    utenfor menneskeheten.»
                </text>
                <text
                    x={800}
                    y={570}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#0f766e"
                >
                    Amsterdam-erklæringen 2022, i norsk oversettelse
                </text>
            </Vis>
            <Vis nar={beat >= 1}>
                <line x1={250} y1={760} x2={1350} y2={760} stroke="#475569" strokeWidth={6} />
                {[
                    { a: 1952, t: 'første verdenskongress', fra: 1 },
                    { a: 2002, t: 'skrevet om', fra: 2 },
                    { a: 2022, t: 'skrevet om', fra: 2 },
                ].map((p) =>
                    beat >= p.fra ? (
                        <motion.g
                            key={p.a}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <circle cx={AKSE(p.a)} cy={760} r={16} fill="#0f766e" />
                            <text
                                x={AKSE(p.a)}
                                y={730}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                {p.a}
                            </text>
                            <text
                                x={AKSE(p.a)}
                                y={812}
                                textAnchor="middle"
                                fontSize={28}
                                fontWeight={700}
                                fill="#475569"
                            >
                                {p.t}
                            </text>
                        </motion.g>
                    ) : null
                )}
            </Vis>
        </g>
    );
}

/* ------------------------------------------------------------- Forbund */

const R_MAKS = 250;
const radius = (antall: number) => R_MAKS * Math.sqrt(antall / 180000);
const AX = 780;

function Forbund({ beat }: { beat: number }) {
    const r34 = Math.max(4, radius(34));
    const r400 = radius(400);
    return (
        <g>
            {/* Aksen, brutt mellom 1956 og 2026 */}
            <line x1={100} y1={AX} x2={770} y2={AX} stroke="#475569" strokeWidth={6} />
            <path
                d={`M 770 ${AX} l 12 -18 l 16 36 l 16 -36 l 12 18`}
                fill="none"
                stroke="#475569"
                strokeWidth={6}
                strokeLinejoin="round"
            />
            <line x1={826} y1={AX} x2={1500} y2={AX} stroke="#475569" strokeWidth={6} />

            {/* 1951 */}
            <circle cx={200} cy={AX - r34} r={r34} fill="#64748b" />
            <text
                x={200}
                y={AX + 46}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#334155"
            >
                1951
            </text>
            <text
                x={200}
                y={AX + 84}
                textAnchor="middle"
                fontSize={26}
                fontWeight={700}
                fill="#64748b"
            >
                34 konfirmanter
            </text>

            {/* 1956 */}
            <circle cx={540} cy={AX - r400} r={r400} fill="#0f766e" />
            <text
                x={540}
                y={AX + 46}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
            >
                1956
            </text>
            <text
                x={540}
                y={AX + 84}
                textAnchor="middle"
                fontSize={26}
                fontWeight={700}
                fill="#475569"
            >
                ca. 400 på møtet
            </text>
            {beat <= 2 && (
                <g>
                    <line
                        x1={540}
                        y1={AX - 2 * r400 - 8}
                        x2={540}
                        y2={670}
                        stroke="#0f766e"
                        strokeWidth={4}
                    />
                    <rect
                        x={310}
                        y={580}
                        width={460}
                        height={90}
                        rx={18}
                        fill={beat >= 1 ? '#0f766e' : '#ffffff'}
                        stroke="#0f766e"
                        strokeWidth={4}
                    />
                    <text
                        x={540}
                        y={636}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={900}
                        fill={beat >= 1 ? '#ffffff' : '#0f172a'}
                    >
                        {beat >= 1 ? 'Human-Etisk Forbund' : 'Biologen Kristian Horn'}
                    </text>
                </g>
            )}

            {/* 2026 */}
            <text
                x={1200}
                y={AX + 46}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill={beat >= 2 ? '#0f172a' : '#94a3b8'}
            >
                2026
            </text>
            <Vis nar={beat >= 2}>
                <motion.circle
                    cx={1200}
                    cy={AX - R_MAKS}
                    r={R_MAKS}
                    fill="#14b8a6"
                    initial={{ scale: 0.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
                />
                <text
                    x={1200}
                    y={AX - R_MAKS + 6}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    ca. 180 000
                </text>
                <text
                    x={1200}
                    y={AX - R_MAKS + 56}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#ffffff"
                >
                    medlemmer
                </text>
                <text
                    x={1200}
                    y={AX + 84}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={700}
                    fill="#475569"
                >
                    største i Norge for livssynshumanister
                </text>
            </Vis>

            {/* Seremoniene */}
            <Vis nar={beat === 3}>
                {['Navnefest', 'Konfirmasjon', 'Vigsel', 'Gravferd'].map((s, i) => {
                    const x = 130 + (i % 2) * 320;
                    const y = 220 + Math.floor(i / 2) * 120;
                    return (
                        <g key={s}>
                            <rect
                                x={x}
                                y={y}
                                width={290}
                                height={90}
                                rx={18}
                                fill="#ffffff"
                                stroke="#0f766e"
                                strokeWidth={4}
                            />
                            <text
                                x={x + 145}
                                y={y + 58}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={900}
                                fill="#134e4a"
                            >
                                {s}
                            </text>
                        </g>
                    );
                })}
            </Vis>

            {/* Likebehandling: en vekt i balanse */}
            <Vis nar={beat >= 4}>
                <text
                    x={440}
                    y={215}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#334155"
                >
                    Forbundet arbeider for:
                </text>
                <rect x={432} y={290} width={16} height={260} fill="#475569" />
                <rect x={360} y={540} width={160} height={20} rx={8} fill="#475569" />
                <circle cx={440} cy={288} r={14} fill="#475569" />
                <rect x={150} y={282} width={580} height={12} rx={6} fill="#475569" />
                <line x1={180} y1={294} x2={180} y2={380} stroke="#64748b" strokeWidth={4} />
                <line x1={700} y1={294} x2={700} y2={380} stroke="#64748b" strokeWidth={4} />
                <rect
                    x={60}
                    y={380}
                    width={240}
                    height={110}
                    rx={16}
                    fill="#fef3c7"
                    stroke="#b45309"
                    strokeWidth={4}
                />
                <text
                    x={180}
                    y={428}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={800}
                    fill="#78350f"
                >
                    livssyn
                </text>
                <text
                    x={180}
                    y={466}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={800}
                    fill="#78350f"
                >
                    med gud
                </text>
                <rect
                    x={580}
                    y={380}
                    width={240}
                    height={110}
                    rx={16}
                    fill="#ccfbf1"
                    stroke="#0f766e"
                    strokeWidth={4}
                />
                <text
                    x={700}
                    y={428}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={800}
                    fill="#134e4a"
                >
                    livssyn
                </text>
                <text
                    x={700}
                    y={466}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={800}
                    fill="#134e4a"
                >
                    uten gud
                </text>
                <text
                    x={440}
                    y={252}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={900}
                    fill="#0f766e"
                >
                    staten skal behandle dem likt
                </text>
            </Vis>
        </g>
    );
}

export function LivssynTidslinje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ideer';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-slate-100">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'ideer' && <Ideer beat={beat} />}
                {modus === 'amsterdam' && <Amsterdam beat={beat} />}
                {modus === 'forbund' && <Forbund beat={beat} />}
            </svg>
            <LivssynOverskrift tekst={tekst} />
        </div>
    );
}
