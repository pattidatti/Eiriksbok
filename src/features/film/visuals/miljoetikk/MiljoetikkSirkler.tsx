import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';
import {
    BarnIkon,
    DyrIkon,
    FiskIkon,
    FuglIkon,
    Hake,
    HusIkon,
    Kryss,
    PersonIkon,
    TreIkon,
} from './ikoner';

/**
 * 2D (SVG 1600x900): hvem som rammes og hvem som teller.
 * - avstand: tre slags avstand mellom den som bestemmer og den som betaler.
 * - verdi: bussbilletten (nytteverdi) og vennen (egenverdi), så naturen.
 * - sirkler: tre ringer som vokser: antroposentrisk, biosentrisk, økosentrisk.
 */

type Modus = 'avstand' | 'verdi' | 'sirkler';

function Vis({
    nar,
    children,
    forsinkelse = 0,
}: {
    nar: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    if (!nar) return null;
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

/** Kort med tekst. Bredden regnes ut fra teksten, så den aldri flyter ut. */
function Etikett({
    x,
    y,
    tekst,
    under,
    farge = '#0f172a',
    str = 44,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    under?: string;
    farge?: string;
    str?: number;
    anker?: 'start' | 'middle';
}) {
    const ustr = Math.round(str * 0.8);
    const b = Math.max(tekst.length * str * 0.58, (under?.length ?? 0) * ustr * 0.56) + 48;
    const h = under ? str + ustr + 40 : str + 30;
    const venstre = anker === 'middle' ? x - b / 2 : x;
    const tx = anker === 'middle' ? x : x + 24;
    return (
        <g>
            <rect x={venstre} y={y} width={b} height={h} rx={18} fill="#ffffff" opacity={0.96} />
            <text
                x={tx}
                y={y + str + 6}
                textAnchor={anker}
                fontSize={str}
                fontWeight={900}
                fill={farge}
            >
                {tekst}
            </text>
            {under && (
                <text
                    x={tx}
                    y={y + str + ustr + 18}
                    textAnchor={anker}
                    fontSize={ustr}
                    fontWeight={600}
                    fill="#475569"
                >
                    {under}
                </text>
            )}
        </g>
    );
}

/* ---------------------------------------------------------------- avstand */

const RADER = [
    { y: 330, navn: 'Avstand i rom', fra: 1, mal: 'bor langt unna', stum: 'er ikke her' },
    { y: 530, navn: 'Avstand i tid', fra: 2, mal: 'om femti år', stum: 'er ikke født ennå' },
    { y: 730, navn: 'Avstand i art', fra: 3, mal: 'fugl, elv, skog', stum: 'kan ikke si fra' },
];

function Avstand({ beat }: { beat: number }) {
    return (
        <>
            <rect width={1600} height={900} fill="#eef2f7" />
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <PersonIkon x={420} y={520} s={2.2} />
                    <rect x={330} y={590} width={180} height={18} rx={6} fill="#94a3b8" />
                    <TreIkon x={1120} y={500} s={2.4} />
                    <path
                        d="M 1190 600 Q 1260 560 1330 600 Q 1400 640 1470 600"
                        stroke="#38bdf8"
                        strokeWidth={14}
                        fill="none"
                    />
                    <text
                        x={800}
                        y={530}
                        textAnchor="middle"
                        fontSize={120}
                        fontWeight={900}
                        fill="#7c3aed"
                    >
                        ?
                    </text>
                    <Etikett x={420} y={660} tekst="Den som velger" />
                    <Etikett x={1200} y={660} tekst="Naturen" farge="#15803d" />
                </motion.g>
            )}
            {beat >= 1 && (
                <g>
                    <PersonIkon x={150} y={450} s={2} />
                    <Etikett x={150} y={530} tekst="Den som velger" str={30} />
                </g>
            )}
            {RADER.map((r) => (
                <Vis key={r.navn} nar={beat >= r.fra}>
                    <Etikett x={330} y={r.y - 44} tekst={r.navn} anker="start" str={40} />
                    <line x1={680} y1={r.y} x2={1180} y2={r.y} stroke="#64748b" strokeWidth={6} />
                    <path
                        d={`M 1180 ${r.y - 14} L 1204 ${r.y} L 1180 ${r.y + 14} Z`}
                        fill="#64748b"
                    />
                    {r.fra === 1 && <HusIkon x={1290} y={r.y} s={1.4} />}
                    {r.fra === 2 && (
                        <g>
                            <text
                                x={1290}
                                y={r.y + 16}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={900}
                                fill="#b45309"
                            >
                                50 år
                            </text>
                        </g>
                    )}
                    {r.fra === 3 && (
                        <g>
                            <FuglIkon x={1250} y={r.y - 10} s={0.9} />
                            <TreIkon x={1340} y={r.y + 4} s={0.8} />
                        </g>
                    )}
                    <text
                        x={930}
                        y={r.y - 18}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        {r.mal}
                    </text>
                    <Vis nar={beat >= 4} forsinkelse={0.3 * r.fra}>
                        <Kryss x={1410} y={r.y} s={1.1} />
                        <text
                            x={1410}
                            y={r.y + 62}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#b91c1c"
                        >
                            {r.stum}
                        </text>
                    </Vis>
                </Vis>
            ))}
        </>
    );
}

/* ---------------------------------------------------------------- verdi */

function Billett({ x, y, gra }: { x: number; y: number; gra: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`} opacity={gra ? 0.45 : 1}>
            <rect
                x={-150}
                y={-70}
                width={300}
                height={140}
                rx={14}
                fill={gra ? '#cbd5e1' : '#fde68a'}
                stroke="#92400e"
                strokeWidth={4}
            />
            <line
                x1={70}
                y1={-70}
                x2={70}
                y2={70}
                stroke="#92400e"
                strokeWidth={4}
                strokeDasharray="10 8"
            />
            <text x={-40} y={14} textAnchor="middle" fontSize={44} fontWeight={900} fill="#78350f">
                BUSS
            </text>
        </g>
    );
}

function Buss({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-120} y={-60} width={240} height={110} rx={18} fill="#dc2626" />
            {[-90, -40, 10, 60].map((wx) => (
                <rect key={wx} x={wx} y={-44} width={36} height={34} rx={4} fill="#e0f2fe" />
            ))}
            <circle cx={-70} cy={52} r={18} fill="#1f2937" />
            <circle cx={70} cy={52} r={18} fill="#1f2937" />
        </g>
    );
}

function Verdi({ beat }: { beat: number }) {
    const natur = beat >= 3;
    return (
        <>
            <rect width={1600} height={900} fill="#f5f3ef" />
            {!natur && (
                <g>
                    <rect x={120} y={190} width={620} height={560} rx={30} fill="#ffffff" />
                    <text
                        x={430}
                        y={260}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Bussbilletten
                    </text>
                    <Billett x={430} y={420} gra={beat >= 1} />
                    {beat === 0 && <Buss x={430} y={600} />}
                    {beat >= 1 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <g opacity={0.35}>
                                <Buss x={400} y={600} />
                            </g>
                            <Kryss x={590} y={590} s={1.3} />
                            <text
                                x={430}
                                y={712}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={700}
                                fill="#b91c1c"
                            >
                                bussen går ikke
                            </text>
                        </motion.g>
                    )}
                    <Vis nar={beat >= 1} forsinkelse={0.6}>
                        <Etikett
                            x={430}
                            y={770}
                            tekst="Nytteverdi"
                            under="verdi fordi den er nyttig"
                            farge="#0f766e"
                        />
                    </Vis>

                    <Vis nar={beat >= 2}>
                        <rect x={860} y={190} width={620} height={560} rx={30} fill="#ffffff" />
                        <text
                            x={1170}
                            y={260}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            En venn
                        </text>
                        <PersonIkon x={1090} y={480} s={2.2} farge="#2563eb" />
                        <PersonIkon x={1250} y={480} s={2.2} farge="#db2777" />
                        <path
                            d="M 1170 380 C 1150 350 1110 360 1120 395 C 1130 420 1170 440 1170 440 C 1170 440 1210 420 1220 395 C 1230 360 1190 350 1170 380 Z"
                            fill="#e11d48"
                        />
                        <Etikett
                            x={1170}
                            y={770}
                            tekst="Egenverdi"
                            under="verdifull i seg selv"
                            farge="#7c3aed"
                        />
                    </Vis>
                </g>
            )}
            {natur && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={120} y={190} width={760} height={560} rx={30} fill="#ffffff" />
                    <text
                        x={500}
                        y={260}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Naturen er nyttig
                    </text>
                    {[
                        { t: 'rent vann', x: 300, y: 380 },
                        { t: 'ren luft', x: 700, y: 380 },
                        { t: 'mat', x: 300, y: 560 },
                        { t: 'medisiner', x: 700, y: 560 },
                    ].map((n, i) => (
                        <motion.g
                            key={n.t}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.4 }}
                        >
                            <Hake x={n.x - 110} y={n.y - 14} />
                            <text
                                x={n.x - 74}
                                y={n.y}
                                fontSize={44}
                                fontWeight={800}
                                fill="#0f766e"
                            >
                                {n.t}
                            </text>
                        </motion.g>
                    ))}
                    <text
                        x={500}
                        y={700}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        Nesten alle er enige
                    </text>
                    <Vis nar={beat >= 4}>
                        <rect x={960} y={190} width={520} height={560} rx={30} fill="#ede9fe" />
                        <TreIkon x={1220} y={420} s={2.6} />
                        <text
                            x={1220}
                            y={640}
                            textAnchor="middle"
                            fontSize={60}
                            fontWeight={900}
                            fill="#6d28d9"
                        >
                            Egenverdi?
                        </text>
                        <text
                            x={1220}
                            y={700}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={700}
                            fill="#475569"
                        >
                            Her begynner uenigheten
                        </text>
                    </Vis>
                </motion.g>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- sirkler */

const CX = 800;
const CY = 520;
const RINGER = [
    { r: 130, fyll: '#fde68a', kant: '#b45309', fra: 1 },
    { r: 240, fyll: '#bbf7d0', kant: '#15803d', fra: 3 },
    { r: 345, fyll: '#bae6fd', kant: '#0369a1', fra: 4 },
];

function Sirkler({ beat }: { beat: number }) {
    return (
        <>
            <rect width={1600} height={900} fill="#f8fafc" />
            {[...RINGER].reverse().map((r) => (
                <g key={r.r}>
                    <circle
                        cx={CX}
                        cy={CY}
                        r={r.r}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth={4}
                        strokeDasharray="14 12"
                    />
                    {beat >= r.fra && (
                        <motion.circle
                            cx={CX}
                            cy={CY}
                            r={r.r}
                            fill={r.fyll}
                            stroke={r.kant}
                            strokeWidth={6}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        />
                    )}
                </g>
            ))}
            {beat === 0 && (
                <text
                    x={CX}
                    y={CY + 40}
                    textAnchor="middle"
                    fontSize={130}
                    fontWeight={900}
                    fill="#7c3aed"
                >
                    ?
                </text>
            )}

            {/* Indre ring: mennesker */}
            <Vis nar={beat >= 1}>
                <PersonIkon x={CX - 55} y={CY + 10} s={1.3} farge="#92400e" />
                <PersonIkon x={CX + 55} y={CY + 10} s={1.3} farge="#b45309" />
                <BarnIkon x={CX} y={CY + 40} s={1.2} farge="#78350f" />
            </Vis>
            {/* Midtre ring: dyr og trær */}
            <Vis nar={beat >= 3}>
                <TreIkon x={CX - 180} y={CY - 40} s={1.1} />
                <DyrIkon x={CX + 180} y={CY + 10} s={1.2} />
                <FuglIkon x={CX} y={CY - 180} s={1} />
                <TreIkon x={CX + 70} y={CY + 205} s={0.9} />
            </Vis>
            {/* Ytre ring: elv, skog, art */}
            <Vis nar={beat >= 4}>
                <path
                    d={`M ${CX - 330} ${CY + 60} Q ${CX - 300} ${CY + 160} ${CX - 230} ${CY + 230} Q ${CX - 160} ${CY + 290} ${CX - 60} ${CY + 320}`}
                    stroke="#0284c7"
                    strokeWidth={22}
                    fill="none"
                    strokeLinecap="round"
                />
                {[0, 1, 2].map((i) => (
                    <TreIkon
                        key={i}
                        x={CX + 230 + i * 34}
                        y={CY - 190 + i * 30}
                        s={0.7}
                        farge="#166534"
                    />
                ))}
                {[0, 1, 2, 3].map((i) => (
                    <TreIkon
                        key={`b${i}`}
                        x={CX + 280 + (i % 2) * 30}
                        y={CY - 90 + i * 30}
                        s={0.6}
                        farge="#166534"
                    />
                ))}
            </Vis>
            <Vis nar={beat >= 5}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <FiskIkon key={i} x={CX - 300 + i * 46} y={CY + 140 + i * 30} s={0.8} />
                ))}
            </Vis>

            {/* Navnene på sidene */}
            <Vis nar={beat >= 1}>
                <Etikett
                    x={40}
                    y={200}
                    tekst="Antroposentrisk"
                    under="bare mennesker"
                    farge="#b45309"
                    anker="start"
                    str={40}
                />
            </Vis>
            <Vis nar={beat === 2}>
                <Etikett
                    x={40}
                    y={680}
                    tekst="Naturen tas vare på"
                    under="fordi vi trenger den"
                    farge="#475569"
                    anker="start"
                    str={36}
                />
            </Vis>
            <Vis nar={beat >= 3}>
                <Etikett
                    x={40}
                    y={360}
                    tekst="Biosentrisk"
                    under="også hvert dyr og tre"
                    farge="#15803d"
                    anker="start"
                    str={40}
                />
            </Vis>
            <Vis nar={beat >= 4}>
                <Etikett
                    x={1165}
                    y={200}
                    tekst="Økosentrisk"
                    under="arter, skoger, elver"
                    farge="#0369a1"
                    anker="start"
                    str={40}
                />
            </Vis>
            <Vis nar={beat >= 5}>
                <Etikett
                    x={1165}
                    y={640}
                    tekst="Ikke hver fisk"
                    under="men at elva har laks"
                    farge="#0e7490"
                    anker="start"
                    str={40}
                />
            </Vis>
            {beat === 0 && (
                <Etikett
                    x={CX}
                    y={790}
                    tekst="Uenige om hvem som teller"
                    under="ikke om fakta"
                    farge="#6d28d9"
                    str={40}
                />
            )}
        </>
    );
}

const BAKGRUNN: Record<Modus, string> = {
    avstand: '#eef2f7',
    verdi: '#f5f3ef',
    sirkler: '#f8fafc',
};

const OVERSKRIFT: Record<Modus, string[]> = {
    avstand: [
        'Hva er rett når naturen står på spill?',
        'Tre slags avstand',
        'Tre slags avstand',
        'Tre slags avstand',
        'Den som betaler, kan ikke si fra',
    ],
    verdi: [
        'To slags verdi',
        'Nytteverdi',
        'Egenverdi',
        'Naturen: nytteverdi',
        'Naturen: egenverdi?',
    ],
    sirkler: [
        'Hvem har egenverdi?',
        'Antroposentrisk',
        'Antroposentrisk',
        'Biosentrisk',
        'Økosentrisk',
        'Økosentrisk',
    ],
};

export function MiljoetikkSirkler({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'sirkler';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0" style={{ background: BAKGRUNN[modus] }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'avstand' && <Avstand beat={beat} />}
                {modus === 'verdi' && <Verdi beat={beat} />}
                {modus === 'sirkler' && <Sirkler beat={beat} />}
            </svg>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
