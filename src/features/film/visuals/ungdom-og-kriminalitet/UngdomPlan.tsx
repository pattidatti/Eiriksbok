import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Kort, Kryss, Overskrift, Person } from './felles';
import { FARGE, bredde, kortHoyde } from './maal';

/**
 * Ungdomsstraffen fra innsiden.
 * «stormote»: et rundt bord sett ovenfra der plassene fylles.
 * «plan»: ungdomsplanen fylles ut, og til slutt hvor lenge straffen varer.
 * «fengsel»: fengselsstraffen som ligger klar bak planen.
 * «faktorer»: risikofaktorer og beskyttende faktorer rundt én ungdom.
 */

type Modus = 'stormote' | 'plan' | 'fengsel' | 'faktorer';

const OVERSKRIFT: Record<Modus, string[]> = {
    stormote: [
        'Ungdomsstraff',
        'Konfliktrådet har ansvaret',
        'Ungdomsstormøtet',
        'Flere rundt bordet',
        'Den som ble rammet',
    ],
    plan: [
        'Ungdomsplanen',
        'Ungdomsplanen',
        'Ungdomsplanen',
        'Ungdomsplanen',
        'Hvor lenge varer straffen?',
    ],
    fengsel: [
        'Ingen gratis billett',
        'Bak planen: en fengselsstraff',
        'Når planen brytes',
        'Fengselsstraffen likevel',
    ],
    faktorer: [
        'Hvorfor havner noen i kriminalitet?',
        'To slags faktorer',
        'Risiko: helse og hjemme',
        'Risiko: venner og skole',
        'Det som beskytter',
        'Men husk',
    ],
};

/* ---------------- stormote ---------------- */

const MIDT = { x: 800, y: 520 };
const RADIUS = 255;

interface Plass {
    vinkel: number;
    linjer: string[];
    farge: string;
    fraBeat: number;
    ofte?: string;
}

const PLASSER: Plass[] = [
    {
        vinkel: 270,
        linjer: ['Ungdomskoordinator fra konfliktrådet'],
        farge: FARGE.gronn,
        fraBeat: 1,
    },
    { vinkel: 90, linjer: ['Den unge'], farge: FARGE.lilla, fraBeat: 2 },
    { vinkel: 135, linjer: ['Foreldrene'], farge: '#a16207', fraBeat: 2 },
    { vinkel: 180, linjer: ['Politiet'], farge: '#1e3a8a', fraBeat: 3 },
    {
        vinkel: 0,
        linjer: ['Kriminalomsorgen', 'fengsler og straff i frihet'],
        farge: '#475569',
        fraBeat: 3,
    },
    { vinkel: 225, linjer: ['Skolen'], farge: FARGE.bla, fraBeat: 3, ofte: 'ofte' },
    {
        vinkel: 315,
        linjer: ['Barnevernet eller', 'helsetjenesten'],
        farge: FARGE.bla,
        fraBeat: 3,
        ofte: 'ofte',
    },
    {
        vinkel: 45,
        linjer: ['Den som ble rammet', 'hvis han eller hun vil'],
        farge: FARGE.rod,
        fraBeat: 4,
        ofte: 'kanskje',
    },
];

function Stormote({ beat }: { beat: number }) {
    return (
        <>
            <circle
                cx={MIDT.x}
                cy={MIDT.y}
                r={150}
                fill="#d6b88a"
                stroke="#92400e"
                strokeWidth={6}
            />
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <text
                        x={MIDT.x}
                        y={MIDT.y - 20}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#422006"
                    >
                        15 til 18 år
                    </text>
                    <text
                        x={MIDT.x}
                        y={MIDT.y + 40}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#422006"
                    >
                        siden 2014
                    </text>
                    <Kort
                        x={60}
                        y={300}
                        tittel="Alvorlig eller gjentatt"
                        tekst="for eksempel vold eller ran"
                        farge={FARGE.rod}
                        fs={34}
                    />
                    <Kort
                        x={1520}
                        y={300}
                        hoyre
                        tittel="Et ekte alternativ"
                        tekst="til fengsel"
                        farge={FARGE.gronn}
                        fs={34}
                    />
                </motion.g>
            )}
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Ungdomsplanen ligger midt på bordet */}
                    <rect
                        x={MIDT.x - 70}
                        y={MIDT.y - 90}
                        width={140}
                        height={180}
                        rx={8}
                        fill="#ffffff"
                        stroke="#94a3b8"
                        strokeWidth={3}
                    />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <rect
                            key={i}
                            x={MIDT.x - 48}
                            y={MIDT.y - 58 + i * 30}
                            width={96 - (i % 2) * 24}
                            height={10}
                            rx={4}
                            fill="#cbd5e1"
                        />
                    ))}
                </motion.g>
            )}
            {PLASSER.map((p) => {
                if (beat < p.fraBeat) return null;
                const a = (p.vinkel * Math.PI) / 180;
                const x = MIDT.x + RADIUS * Math.cos(a);
                const y = MIDT.y + RADIUS * Math.sin(a);
                const ny = beat === p.fraBeat;
                const cos = Math.cos(a);
                // Plassene øverst og nederst får merkelappen til høyre, de andre ut fra bordet.
                const anker = Math.abs(cos) < 0.3 || cos > 0 ? 'start' : 'end';
                const lx = Math.abs(cos) < 0.3 || cos > 0 ? x + 74 : x - 74;
                const ly = p.linjer.length > 1 || p.ofte ? y - 6 : y + 11;
                return (
                    <motion.g
                        key={p.linjer[0]}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ transformOrigin: `${x}px ${y}px` }}
                    >
                        <circle
                            cx={x}
                            cy={y}
                            r={50}
                            fill={p.ofte ? '#ffffff' : p.farge}
                            stroke={p.farge}
                            strokeWidth={ny ? 9 : 5}
                            strokeDasharray={p.ofte ? '12 8' : undefined}
                        />
                        <circle cx={x} cy={y - 14} r={16} fill={p.ofte ? p.farge : '#ffffff'} />
                        <path
                            d={`M ${x - 26} ${y + 30} Q ${x} ${y - 4} ${x + 26} ${y + 30} Z`}
                            fill={p.ofte ? p.farge : '#ffffff'}
                        />
                        {p.linjer.map((l, i) => (
                            <text
                                key={l}
                                x={lx}
                                y={ly + i * 34}
                                textAnchor={anker}
                                fontSize={i === 0 ? 32 : 24}
                                fontWeight={i === 0 ? 800 : 600}
                                fill={i === 0 ? FARGE.blekk : FARGE.gra}
                            >
                                {l}
                            </text>
                        ))}
                        {p.ofte && (
                            <text
                                x={lx}
                                y={ly + p.linjer.length * 34}
                                textAnchor={anker}
                                fontSize={24}
                                fontWeight={800}
                                fill={p.farge}
                            >
                                {p.ofte}
                            </text>
                        )}
                    </motion.g>
                );
            })}
        </>
    );
}

/* ---------------- plan ---------------- */

const PUNKTER = [
    { tekst: 'Gå på skolen hver dag', fraBeat: 1 },
    { tekst: 'Ha en jobb', fraBeat: 1 },
    { tekst: 'Bo et bestemt sted', fraBeat: 2 },
    { tekst: 'Hjemme innen en fast tid', fraBeat: 2 },
    { tekst: 'Nyttig arbeid for andre', fraBeat: 3 },
];

function Ark({
    x,
    y,
    beat,
    alle = false,
    merket = false,
}: {
    x: number;
    y: number;
    beat: number;
    alle?: boolean;
    merket?: boolean;
}) {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={560}
                height={600}
                rx={20}
                fill="#ffffff"
                stroke={merket ? FARGE.rod : '#94a3b8'}
                strokeWidth={merket ? 7 : 4}
            />
            <rect x={x + 210} y={y - 22} width={140} height={44} rx={10} fill="#64748b" />
            <text x={x + 40} y={y + 80} fontSize={42} fontWeight={900} fill={FARGE.blekk}>
                Ungdomsplan
            </text>
            {PUNKTER.map((p, i) => {
                const vis = alle || beat >= p.fraBeat;
                const ry = y + 140 + i * 88;
                return (
                    <g key={p.tekst}>
                        <rect
                            x={x + 40}
                            y={ry}
                            width={44}
                            height={44}
                            rx={8}
                            fill="#ffffff"
                            stroke="#94a3b8"
                            strokeWidth={4}
                        />
                        {vis ? (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <path
                                    d={`M ${x + 50} ${ry + 22} L ${x + 60} ${ry + 34} L ${x + 76} ${ry + 10}`}
                                    stroke={FARGE.gronn}
                                    strokeWidth={7}
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <text
                                    x={x + 106}
                                    y={ry + 34}
                                    fontSize={32}
                                    fontWeight={700}
                                    fill={FARGE.blekk}
                                >
                                    {p.tekst}
                                </text>
                            </motion.g>
                        ) : (
                            <rect
                                x={x + 106}
                                y={ry + 16}
                                width={300}
                                height={12}
                                rx={6}
                                fill="#e2e8f0"
                            />
                        )}
                    </g>
                );
            })}
        </g>
    );
}

/** Bildet til høyre for planen, ett per beat. */
function PlanBilde({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <motion.g key="b0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <circle
                    cx={1200}
                    cy={470}
                    r={140}
                    fill="#d6b88a"
                    stroke="#92400e"
                    strokeWidth={6}
                />
                {[0, 72, 144, 216, 288].map((v) => {
                    const a = (v * Math.PI) / 180;
                    return (
                        <circle
                            key={v}
                            cx={1200 + 190 * Math.cos(a)}
                            cy={470 + 190 * Math.sin(a)}
                            r={36}
                            fill="#94a3b8"
                        />
                    );
                })}
                <text
                    x={1200}
                    y={740}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill={FARGE.gra}
                >
                    lages på ungdomsstormøtet
                </text>
            </motion.g>
        );
    }
    if (beat === 1) {
        return (
            <motion.g key="b1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Skole */}
                <rect
                    x={1040}
                    y={390}
                    width={300}
                    height={220}
                    fill="#fde68a"
                    stroke="#92400e"
                    strokeWidth={5}
                />
                <path d="M 1020 400 L 1190 290 L 1360 400 Z" fill="#b91c1c" />
                <rect x={1165} y={510} width={50} height={100} fill="#92400e" />
                {[1075, 1255].map((wx) => (
                    <rect
                        key={wx}
                        x={wx}
                        y={440}
                        width={50}
                        height={50}
                        fill="#bfdbfe"
                        stroke="#92400e"
                        strokeWidth={4}
                    />
                ))}
                {/* Arbeidsveske: jobben */}
                <rect x={1400} y={520} width={130} height={90} rx={12} fill="#78350f" />
                <rect
                    x={1440}
                    y={500}
                    width={50}
                    height={24}
                    rx={6}
                    fill="none"
                    stroke="#78350f"
                    strokeWidth={8}
                />
                <text
                    x={1465}
                    y={650}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={800}
                    fill="#334155"
                >
                    jobb
                </text>
                {['M', 'T', 'O', 'T', 'F'].map((d, i) => (
                    <g key={i}>
                        <rect
                            x={1020 + i * 70}
                            y={660}
                            width={58}
                            height={58}
                            rx={10}
                            fill={FARGE.gronn}
                        />
                        <text
                            x={1049 + i * 70}
                            y={700}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={800}
                            fill="#ffffff"
                        >
                            {d}
                        </text>
                    </g>
                ))}
            </motion.g>
        );
    }
    if (beat === 2) {
        return (
            <motion.g key="b2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <rect
                    x={1060}
                    y={420}
                    width={260}
                    height={200}
                    fill="#e0e7ff"
                    stroke="#3730a3"
                    strokeWidth={5}
                />
                <path d="M 1040 430 L 1190 320 L 1340 430 Z" fill="#3730a3" />
                <rect x={1100} y={470} width={70} height={60} fill="#fde68a" />
                <rect x={1210} y={520} width={60} height={100} fill="#3730a3" />
                {/* Måne: det er kveld */}
                <circle cx={1380} cy={280} r={46} fill="#fde68a" />
                <circle cx={1404} cy={266} r={42} fill="#f8fafc" />
                <text
                    x={1190}
                    y={690}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill={FARGE.gra}
                >
                    hjemme innen en fast tid
                </text>
            </motion.g>
        );
    }
    if (beat === 3) {
        return (
            <motion.g key="b3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Person x={1120} y={640} farge={FARGE.lilla} s={1.5} />
                {/* Rive og løv */}
                <line
                    x1={1180}
                    y1={640}
                    x2={1260}
                    y2={430}
                    stroke="#92400e"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <path d="M 1150 640 L 1210 640 L 1200 620 L 1160 620 Z" fill="#92400e" />
                {[1250, 1290, 1330, 1300].map((lx, i) => (
                    <ellipse
                        key={i}
                        cx={lx}
                        cy={650 - (i % 2) * 14}
                        rx={22}
                        ry={12}
                        fill={i % 2 ? '#ea580c' : '#ca8a04'}
                    />
                ))}
                <text
                    x={1190}
                    y={720}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill={FARGE.gra}
                >
                    arbeid som hjelper andre
                </text>
            </motion.g>
        );
    }
    return null;
}

function Plan({ beat }: { beat: number }) {
    if (beat >= 4) {
        // Hvor lenge straffen varer, på en skala i måneder.
        const x0 = 200;
        const per = 50;
        const y = 520;
        return (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <rect x={x0} y={y} width={24 * per} height={70} rx={14} fill="#e2e8f0" />
                <motion.rect
                    x={x0 + 4 * per}
                    y={y}
                    height={70}
                    rx={14}
                    fill={FARGE.lilla}
                    initial={{ width: 0 }}
                    animate={{ width: 20 * per }}
                    transition={{ duration: 1.4 }}
                />
                {[0, 4, 24].map((m) => (
                    <line
                        key={m}
                        x1={x0 + m * per}
                        y1={y + 80}
                        x2={x0 + m * per}
                        y2={y + 100}
                        stroke={FARGE.blekk}
                        strokeWidth={4}
                    />
                ))}
                <text
                    x={x0}
                    y={y + 145}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#334155"
                >
                    start
                </text>
                <text
                    x={x0 + 24 * per}
                    y={y + 145}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#334155"
                >
                    to år
                </text>
                <Kort
                    x={x0 + 4 * per - 40}
                    y={300}
                    tittel="Minst 120 dager"
                    tekst="rundt fire måneder"
                    farge={FARGE.lilla}
                    fs={36}
                />
                <Kort
                    x={x0 + 24 * per + 40}
                    y={300}
                    hoyre
                    tittel="Opptil to år"
                    farge={FARGE.lilla}
                    fs={36}
                />
            </motion.g>
        );
    }
    return (
        <>
            <Ark x={180} y={190} beat={beat} />
            <PlanBilde beat={beat} />
        </>
    );
}

/* ---------------- fengsel ---------------- */

function Fengsel({ beat }: { beat: number }) {
    const fram = beat >= 3;
    const c = fram ? { x: 560, y: 200, w: 440, h: 560 } : { x: 760, y: 230, w: 420, h: 480 };
    return (
        <>
            {/* Cellen bak planen */}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: fram ? 1 : 0.85 }}
                    transition={{ duration: 0.8 }}
                >
                    <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={18} fill="#334155" />
                    {Array.from({ length: 7 }, (_, i) => {
                        const bx = c.x + 40 + i * ((c.w - 80) / 6);
                        return (
                            <rect
                                key={i}
                                x={bx - 8}
                                y={c.y}
                                width={16}
                                height={c.h}
                                fill="#cbd5e1"
                            />
                        );
                    })}
                    <rect x={c.x} y={c.y + c.h / 2 - 8} width={c.w} height={16} fill="#cbd5e1" />
                </motion.g>
            )}
            <motion.g
                initial={false}
                animate={{ opacity: fram ? 0.15 : 1, x: fram ? -270 : 0 }}
                transition={{ duration: 0.8 }}
            >
                <Ark x={300} y={200} beat={9} alle merket={beat === 2} />
            </motion.g>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <g transform="rotate(-6 1200 470)">
                        <rect
                            x={1000}
                            y={390}
                            width={400}
                            height={170}
                            rx={16}
                            fill="#fef3c7"
                            stroke="#b45309"
                            strokeWidth={5}
                            strokeDasharray="0"
                        />
                        <circle cx={1000} cy={475} r={24} fill="#ffffff" />
                        <circle cx={1400} cy={475} r={24} fill="#ffffff" />
                        <text
                            x={1200}
                            y={460}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#92400e"
                        >
                            «Gratis billett»
                        </text>
                    </g>
                    <Kryss x={1360} y={600} r={30} />
                </motion.g>
            )}
            {beat === 1 && (
                <Kort
                    x={1250}
                    y={760}
                    hoyre
                    tittel="Fengselsstraff"
                    tekst="satt av retten, ligger klar"
                    farge="#334155"
                    fs={34}
                />
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {['Bryter planen', 'Møter ikke opp', 'Nye lovbrudd'].map((t, i) => (
                        <g key={t}>
                            <Kort x={1240} y={220 + i * 120} tittel={t} farge={FARGE.rod} fs={34} />
                            <Kryss x={1200} y={258 + i * 120} r={18} />
                        </g>
                    ))}
                    <path d="M 1400 590 L 1400 680" stroke={FARGE.rod} strokeWidth={8} />
                    <path d="M 1400 702 l -18 -30 l 36 0 Z" fill={FARGE.rod} />
                    <Kort
                        x={1560}
                        y={710}
                        hoyre
                        tittel="Tilbake til retten"
                        farge={FARGE.rod}
                        fs={34}
                        fokus
                    />
                </motion.g>
            )}
            {fram && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Kort
                        x={1570}
                        y={380}
                        hoyre
                        tittel="Må sone likevel"
                        tekst="sitte straffen av i fengsel"
                        farge={FARGE.rod}
                        fs={36}
                        fokus
                    />
                </motion.g>
            )}
        </>
    );
}

/* ---------------- faktorer ---------------- */

interface Faktor {
    tittel: string;
    tekst?: string;
    fraBeat: number;
}

const RISIKO: Faktor[] = [
    { tittel: 'Psykiske vansker', fraBeat: 2 },
    { tittel: 'Rus', fraBeat: 2 },
    { tittel: 'Vold og omsorgssvikt', tekst: 'hjemme', fraBeat: 2 },
    { tittel: 'Venner som bryter loven', fraBeat: 3 },
    { tittel: 'Trives dårlig på skolen', tekst: 'dårlige karakterer, slutter', fraBeat: 3 },
];

const VERN: Faktor[] = [
    { tittel: 'Høre til på skolen', fraBeat: 4 },
    { tittel: 'Gode forhold', tekst: 'til lærere og andre på samme alder', fraBeat: 4 },
    { tittel: 'Varme foreldre', tekst: 'som støtter', fraBeat: 4 },
];

function Kolonne({
    liste,
    x,
    hoyre,
    farge,
    beat,
}: {
    liste: Faktor[];
    x: number;
    hoyre: boolean;
    farge: string;
    beat: number;
}) {
    const ys = liste.map((_, i) =>
        liste.slice(0, i).reduce((sum, f) => sum + kortHoyde(30, !!f.tekst) + 18, 250)
    );
    return (
        <>
            {liste.map((f, i) => {
                const ky = ys[i];
                if (beat < f.fraBeat) return null;
                return (
                    <Kort
                        key={f.tittel}
                        x={x}
                        y={ky}
                        hoyre={hoyre}
                        tittel={f.tittel}
                        tekst={f.tekst}
                        farge={farge}
                        fs={30}
                        fokus={beat === f.fraBeat}
                    />
                );
            })}
        </>
    );
}

function Faktorer({ beat }: { beat: number }) {
    const vx = 800;
    return (
        <>
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <text x={60} y={200} fontSize={34} fontWeight={900} fill={FARGE.rod}>
                        Øker risikoen
                    </text>
                    <text
                        x={1540}
                        y={200}
                        textAnchor="end"
                        fontSize={34}
                        fontWeight={900}
                        fill={FARGE.gronn}
                    >
                        Beskytter
                    </text>
                    {beat === 1 && (
                        <>
                            <text x={60} y={240} fontSize={28} fontWeight={700} fill="#334155">
                                gjør det mer sannsynlig
                            </text>
                            <text
                                x={1540}
                                y={240}
                                textAnchor="end"
                                fontSize={28}
                                fontWeight={700}
                                fill="#334155"
                            >
                                gjør det mindre sannsynlig
                            </text>
                        </>
                    )}
                    <path
                        d="M 610 520 L 690 520"
                        stroke={FARGE.rod}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <path d="M 712 520 l -30 -18 l 0 36 Z" fill={FARGE.rod} />
                    <path
                        d="M 990 520 L 910 520"
                        stroke={FARGE.gronn}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <path d="M 888 520 l 30 -18 l 0 36 Z" fill={FARGE.gronn} />
                </motion.g>
            )}
            <Kolonne liste={RISIKO} x={60} hoyre={false} farge={FARGE.rod} beat={beat} />
            <Kolonne liste={VERN} x={1540} hoyre farge={FARGE.gronn} beat={beat} />
            <Person x={vx} y={640} farge={FARGE.lilla} s={1.7} />
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <text
                        x={vx}
                        y={330}
                        textAnchor="middle"
                        fontSize={120}
                        fontWeight={900}
                        fill="#94a3b8"
                    >
                        ?
                    </text>
                    <Kort
                        x={vx - (bredde('Ikke én forklaring', 36) + 56) / 2}
                        y={700}
                        tittel="Ikke én forklaring"
                        farge={FARGE.gra}
                        fs={36}
                    />
                </motion.g>
            )}
            {beat >= 2 && beat <= 4 && (
                <text
                    x={vx}
                    y={880}
                    textAnchor="middle"
                    fontSize={24}
                    fontWeight={700}
                    fill={FARGE.gra}
                >
                    Folkehelseinstituttet, 2026
                </text>
            )}
            {beat >= 5 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect
                        x={vx - 230}
                        y={700}
                        width={720}
                        height={170}
                        rx={20}
                        fill="#ffffff"
                        stroke={FARGE.blekk}
                        strokeWidth={5}
                    />
                    <text
                        x={vx + 130}
                        y={760}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill={FARGE.blekk}
                    >
                        Kunnskapen er usikker
                    </text>
                    <text
                        x={vx + 130}
                        y={812}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={700}
                        fill={FARGE.gra}
                    >
                        Sier noe om en hel gruppe,
                    </text>
                    <text
                        x={vx + 130}
                        y={847}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={700}
                        fill={FARGE.gra}
                    >
                        ikke om akkurat deg
                    </text>
                </motion.g>
            )}
        </>
    );
}

export function UngdomPlan({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'stormote';
    const linjer = OVERSKRIFT[modus];
    const overskrift = linjer[Math.min(beat, linjer.length - 1)];
    const bakgrunn =
        modus === 'stormote'
            ? 'radial-gradient(circle at 50% 55%, #fefce8 0%, #e7e5e4 100%)'
            : 'linear-gradient(180deg,#f8fafc 0%,#ffffff 85%)';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: bakgrunn }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'stormote' && <Stormote beat={beat} />}
                {modus === 'plan' && <Plan beat={beat} />}
                {modus === 'fengsel' && <Fengsel beat={beat} />}
                {modus === 'faktorer' && <Faktorer beat={beat} />}
                <Overskrift tekst={overskrift} />
            </svg>
        </div>
    );
}
