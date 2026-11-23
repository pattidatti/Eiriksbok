import { AnimatePresence, motion } from 'framer-motion';
import { TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Tall og tidslinjer i 2D (SVG 1600x900). Fire moduser som ser ulike ut:
 * - varsel: perspektivmeldingen som en langtids værmelding fra 2024 til 2060.
 * - baerere: voksne i arbeidsfør alder per pensjonist (4,8 / 4,0 / rundt 2), og til slutt
 *   figurer som bærer én pensjonist.
 * - hender: penger er ikke nok. Tre yrker, 180 000 flere ansatte, og en tom stilling.
 * - mal: andelen voksne 20-64 år i jobb, 80,5 prosent i 2023 og målene for 2030 og 2035.
 */

type Modus = 'varsel' | 'baerere' | 'hender' | 'mal';

const B = 1600;
const H = 900;

const TITLER: Record<Modus, string[]> = {
    varsel: [
        'Perspektivmeldingen',
        'Fra 2024 helt fram mot 2060',
        'En langtids værmelding for økonomien',
        'Hvis ingen gjør noe',
    ],
    baerere: [
        'Hvor mange jobber for hver pensjonist?',
        'Voksne i arbeidsfør alder per pensjonist',
        'Voksne i arbeidsfør alder per pensjonist',
        'Voksne i arbeidsfør alder per pensjonist',
        'Hvem bærer én pensjonist?',
    ],
    hender: [
        'Ikke bare penger',
        'Flere eldre trenger flere hender',
        'Helse og omsorg fram mot 2060',
        'Nok penger, men nok folk?',
    ],
    mal: [
        'Mange mener: jobb er viktigst',
        'Regjeringens mål fra 2024',
        'Voksne 20 til 64 år i jobb',
        'Voksne 20 til 64 år i jobb',
        'Én til i jobb',
    ],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[4%] left-[3%] px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
            >
                {tekst}
            </motion.div>
        </AnimatePresence>
    );
}

/** Enkel person: hode og kropp. Klippes til `del` (0-1) fra venstre. */
function Person({
    x,
    y,
    s = 1,
    farge,
    del = 1,
    id,
}: {
    x: number;
    y: number;
    s?: number;
    farge: string;
    del?: number;
    id?: string;
}) {
    const klipp = del < 1 && id;
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            {klipp && (
                <defs>
                    <clipPath id={id}>
                        <rect x={-40} y={-140} width={80 * del} height={200} />
                    </clipPath>
                </defs>
            )}
            <g clipPath={klipp ? `url(#${id})` : undefined}>
                <circle cx={0} cy={-100} r={24} fill={farge} />
                <rect x={-34} y={-70} width={68} height={92} rx={30} fill={farge} />
            </g>
            {klipp && (
                <g opacity={0.25}>
                    <circle
                        cx={0}
                        cy={-100}
                        r={24}
                        fill="none"
                        stroke={farge}
                        strokeWidth={3}
                        strokeDasharray="6 6"
                    />
                    <rect
                        x={-34}
                        y={-70}
                        width={68}
                        height={92}
                        rx={30}
                        fill="none"
                        stroke={farge}
                        strokeWidth={3}
                        strokeDasharray="6 6"
                    />
                </g>
            )}
        </g>
    );
}

/* ---------------- varsel ---------------- */

function Sol({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                return (
                    <line
                        key={i}
                        x1={Math.cos(a) * 48}
                        y1={Math.sin(a) * 48}
                        x2={Math.cos(a) * 66}
                        y2={Math.sin(a) * 66}
                        stroke="#f59e0b"
                        strokeWidth={8}
                        strokeLinecap="round"
                    />
                );
            })}
            <circle r={38} fill="#fbbf24" />
        </g>
    );
}

function Sky({ x, y, mork, regn }: { x: number; y: number; mork: boolean; regn?: boolean }) {
    const f = mork ? '#64748b' : '#e2e8f0';
    return (
        <g transform={`translate(${x} ${y})`}>
            {regn &&
                [-30, 0, 30].map((dx) => (
                    <line
                        key={dx}
                        x1={dx}
                        y1={30}
                        x2={dx - 12}
                        y2={70}
                        stroke="#3b82f6"
                        strokeWidth={7}
                        strokeLinecap="round"
                    />
                ))}
            <circle cx={-34} cy={6} r={30} fill={f} />
            <circle cx={6} cy={-14} r={40} fill={f} />
            <circle cx={42} cy={8} r={28} fill={f} />
            <rect x={-64} y={6} width={134} height={30} rx={15} fill={f} />
        </g>
    );
}

function Varsel({ beat }: { beat: number }) {
    const x0 = 330;
    const x1 = 1380;
    const ay = 560;
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            {/* Rapporten */}
            <motion.g initial={false} animate={{ opacity: 1 }}>
                <g transform={`translate(${beat === 0 ? 650 : 150} ${beat === 0 ? 300 : 330})`}>
                    <rect
                        width={beat === 0 ? 300 : 150}
                        height={beat === 0 ? 390 : 195}
                        rx={14}
                        fill="#fff"
                        stroke="#1e3a8a"
                        strokeWidth={6}
                    />
                    {Array.from({ length: 6 }, (_, i) => (
                        <rect
                            key={i}
                            x={beat === 0 ? 36 : 18}
                            y={(beat === 0 ? 70 : 35) + i * (beat === 0 ? 48 : 24)}
                            width={(beat === 0 ? 228 : 114) * (i % 3 === 2 ? 0.6 : 1)}
                            height={beat === 0 ? 14 : 7}
                            rx={4}
                            fill="#94a3b8"
                        />
                    ))}
                </g>
            </motion.g>
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <text
                        x={800}
                        y={760}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Finansdepartementet
                    </text>
                    <text
                        x={800}
                        y={820}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={600}
                        fill="#475569"
                    >
                        omtrent hvert fjerde år
                    </text>
                </motion.g>
            )}
            {beat >= 1 && (
                <g>
                    <motion.line
                        x1={x0}
                        y1={ay}
                        x2={x1}
                        y2={ay}
                        stroke="#1e3a8a"
                        strokeWidth={10}
                        strokeLinecap="round"
                        initial={{ pathLength: beat === 1 ? 0 : 1 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4 }}
                    />
                    <polygon
                        points={`${x1 + 40},${ay} ${x1},${ay - 26} ${x1},${ay + 26}`}
                        fill="#1e3a8a"
                    />
                    <circle cx={x0} cy={ay} r={14} fill="#1e3a8a" />
                    <text
                        x={x0}
                        y={ay + 80}
                        textAnchor="middle"
                        fontSize={52}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        2024
                    </text>
                    <text
                        x={x1}
                        y={ay + 80}
                        textAnchor="middle"
                        fontSize={52}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        2060
                    </text>
                </g>
            )}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <Sol x={x0 + 90} y={ay - 170} />
                    <Sky x={x0 + 350} y={ay - 170} mork={false} />
                    <Sky x={x0 + 680} y={ay - 170} mork={beat >= 3} />
                    <Sky x={x1 - 40} y={ay - 180} mork={beat >= 3} regn={beat >= 3} />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <rect
                        x={330}
                        y={720}
                        width={500}
                        height={90}
                        rx={20}
                        fill="#fff"
                        stroke="#94a3b8"
                        strokeWidth={4}
                    />
                    <text
                        x={580}
                        y={778}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#475569"
                    >
                        Sier ikke hva de skal gjøre
                    </text>
                    <rect
                        x={870}
                        y={720}
                        width={540}
                        height={90}
                        rx={20}
                        fill="#fff"
                        stroke="#dc2626"
                        strokeWidth={5}
                    />
                    <text
                        x={1140}
                        y={778}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#b91c1c"
                    >
                        Viser hvor det bærer
                    </text>
                </motion.g>
            )}
        </svg>
    );
}

/* ---------------- baerere ---------------- */

const STOLPER = [
    { ar: '2004', verdi: 4.8, tekst: '4,8', fraBeat: 1 },
    { ar: '2021', verdi: 4.0, tekst: '4,0', fraBeat: 2 },
    { ar: '2060', verdi: 2, tekst: 'rundt 2', fraBeat: 3 },
];

function Baerere({ beat }: { beat: number }) {
    const bunn = 760;
    const skala = 110;
    const figurer = beat >= 4;
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            <motion.g animate={{ opacity: figurer ? 0 : 1 }} transition={{ duration: 0.5 }}>
                <line x1={260} y1={bunn} x2={1340} y2={bunn} stroke="#334155" strokeWidth={5} />
                {STOLPER.map((s, i) => {
                    const x = 360 + i * 340;
                    const h = s.verdi * skala;
                    const vis = beat >= s.fraBeat;
                    return (
                        <g key={s.ar}>
                            <motion.rect
                                x={x}
                                width={200}
                                initial={{ y: bunn, height: 0 }}
                                animate={{ y: vis ? bunn - h : bunn, height: vis ? h : 0 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                rx={10}
                                fill={i === 2 ? '#dc2626' : '#2563eb'}
                            />
                            <text
                                x={x + 100}
                                y={bunn + 66}
                                textAnchor="middle"
                                fontSize={50}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                {s.ar}
                            </text>
                            {vis && (
                                <motion.text
                                    x={x + 100}
                                    y={bunn - h - 28}
                                    textAnchor="middle"
                                    fontSize={64}
                                    fontWeight={900}
                                    fill={i === 2 ? '#b91c1c' : '#1e3a8a'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    {s.tekst}
                                </motion.text>
                            )}
                        </g>
                    );
                })}
                {beat === 0 && (
                    <g>
                        <Person x={800} y={560} s={2} farge="#94a3b8" />
                        <text
                            x={800}
                            y={680}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={800}
                            fill="#334155"
                        >
                            én pensjonist
                        </text>
                        <text x={940} y={420} fontSize={150} fontWeight={900} fill="#2563eb">
                            ?
                        </text>
                    </g>
                )}
            </motion.g>
            {figurer && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    {[
                        { cx: 470, antall: 4.8, ar: 'Før: nesten fem', farge: '#2563eb' },
                        { cx: 1180, antall: 2, ar: '2060: to', farge: '#dc2626' },
                    ].map((g, gi) => {
                        const hele = Math.ceil(g.antall);
                        const bredde = hele * 110;
                        const start = g.cx - bredde / 2 + 55;
                        return (
                            <g key={g.ar}>
                                {/* Planken og pensjonisten */}
                                <rect
                                    x={g.cx - bredde / 2 - 10}
                                    y={470}
                                    width={bredde + 20}
                                    height={18}
                                    rx={8}
                                    fill="#78350f"
                                />
                                <Person x={g.cx} y={460} s={1.05} farge="#94a3b8" />
                                {Array.from({ length: hele }, (_, i) => (
                                    <Person
                                        key={i}
                                        x={start + i * 110}
                                        y={640}
                                        s={1.05}
                                        farge={g.farge}
                                        del={i === hele - 1 ? g.antall - (hele - 1) : 1}
                                        id={`baerer-${gi}-${i}`}
                                    />
                                ))}
                                <text
                                    x={g.cx}
                                    y={760}
                                    textAnchor="middle"
                                    fontSize={50}
                                    fontWeight={900}
                                    fill="#0f172a"
                                >
                                    {g.ar}
                                </text>
                            </g>
                        );
                    })}
                    <text
                        x={800}
                        y={850}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={700}
                        fill="#475569"
                    >
                        som deler på å betale for én pensjonist
                    </text>
                </motion.g>
            )}
        </svg>
    );
}

/* ---------------- hender ---------------- */

const YRKER = ['Sykepleiere', 'Helsefagarbeidere', 'Leger'];

function Hender({ beat }: { beat: number }) {
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            {/* Penger og folk: to ting som trengs */}
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {Array.from({ length: 6 }, (_, i) => (
                        <ellipse
                            key={i}
                            cx={520}
                            cy={640 - i * 34}
                            rx={110}
                            ry={30}
                            fill="#fbbf24"
                            stroke="#b45309"
                            strokeWidth={4}
                        />
                    ))}
                    <text
                        x={520}
                        y={760}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Penger
                    </text>
                    <text
                        x={800}
                        y={560}
                        textAnchor="middle"
                        fontSize={110}
                        fontWeight={900}
                        fill="#64748b"
                    >
                        +
                    </text>
                    <Person x={1040} y={640} s={2} farge="#0d9488" />
                    <text
                        x={1040}
                        y={760}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Folk
                    </text>
                </motion.g>
            )}
            {beat >= 1 && (
                <g>
                    {YRKER.map((y, i) => {
                        const x = 300 + i * 500;
                        return (
                            <motion.g
                                key={y}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat >= 2 ? 0.35 : 1 }}
                                transition={{ delay: beat === 1 ? 0.2 + i * 0.4 : 0 }}
                            >
                                <Person
                                    x={x}
                                    y={beat >= 2 ? 330 : 520}
                                    s={beat >= 2 ? 1 : 1.6}
                                    farge={['#0d9488', '#0891b2', '#2563eb'][i]}
                                />
                                <text
                                    x={x}
                                    y={beat >= 2 ? 400 : 640}
                                    textAnchor="middle"
                                    fontSize={44}
                                    fontWeight={900}
                                    fill="#0f172a"
                                >
                                    {y}
                                </text>
                            </motion.g>
                        );
                    })}
                </g>
            )}
            {beat === 2 && (
                <foreignObject x={400} y={460} width={800} height={340}>
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="text-8xl font-black text-teal-700 tabular-nums">
                            ca. <TelleTall verdi={180000} varighet={1.8} />
                        </div>
                        <div className="text-4xl font-bold text-slate-700 mt-3">
                            flere ansatte kan trengs
                        </div>
                    </div>
                </foreignObject>
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    {Array.from({ length: 6 }, (_, i) => (
                        <ellipse
                            key={i}
                            cx={500}
                            cy={760 - i * 30}
                            rx={100}
                            ry={26}
                            fill="#fbbf24"
                            stroke="#b45309"
                            strokeWidth={4}
                        />
                    ))}
                    <text
                        x={500}
                        y={850}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Nok penger
                    </text>
                    {/* Den tomme stillingen: en stiplet figur */}
                    <g opacity={0.9}>
                        <circle
                            cx={1100}
                            cy={560}
                            r={36}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={6}
                            strokeDasharray="12 10"
                        />
                        <rect
                            x={1050}
                            y={610}
                            width={100}
                            height={140}
                            rx={40}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={6}
                            strokeDasharray="12 10"
                        />
                    </g>
                    <text x={1220} y={640} fontSize={130} fontWeight={900} fill="#dc2626">
                        ?
                    </text>
                    <text
                        x={1100}
                        y={850}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#b91c1c"
                    >
                        Nok folk?
                    </text>
                </motion.g>
            )}
        </svg>
    );
}

/* ---------------- mal ---------------- */

const ANDELER = [
    { ar: '2023', verdi: 80.5, tekst: '80,5 %', mal: false, fraBeat: 2 },
    { ar: '2030', verdi: 82, tekst: '82 %', mal: true, fraBeat: 3 },
    { ar: '2035', verdi: 83, tekst: '83 %', mal: true, fraBeat: 3 },
];

function Mal({ beat }: { beat: number }) {
    const x0 = 250;
    const full = 900; // 100 prosent
    const lupeX0 = 1230;
    const lupeB = 300; // 80-84 prosent
    const lupe = (p: number) => lupeX0 + ((p - 80) / 4) * lupeB;
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={240} y={330} width={480} height={200} rx={28} fill="#e2e8f0" />
                    <text
                        x={480}
                        y={450}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={800}
                        fill="#64748b"
                    >
                        Skatten
                    </text>
                    <rect x={820} y={290} width={560} height={280} rx={28} fill="#0d9488" />
                    <text
                        x={1100}
                        y={410}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Hvor mange
                    </text>
                    <text
                        x={1100}
                        y={480}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#fff"
                    >
                        som er i jobb
                    </text>
                    <text
                        x={800}
                        y={680}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#475569"
                    >
                        Mange mener det siste er viktigst
                    </text>
                </motion.g>
            )}
            {beat >= 1 && beat < 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <text x={x0} y={250} fontSize={34} fontWeight={700} fill="#475569">
                        0 %
                    </text>
                    <text
                        x={x0 + full}
                        y={250}
                        textAnchor="end"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        100 %
                    </text>
                    {ANDELER.map((a, i) => {
                        const y = 290 + i * 150;
                        const vis = beat >= a.fraBeat;
                        const w = (a.verdi / 100) * full;
                        return (
                            <g key={a.ar}>
                                <text
                                    x={x0 - 24}
                                    y={y + 62}
                                    textAnchor="end"
                                    fontSize={48}
                                    fontWeight={900}
                                    fill="#0f172a"
                                >
                                    {a.ar}
                                </text>
                                <rect
                                    x={x0}
                                    y={y}
                                    width={full}
                                    height={90}
                                    rx={12}
                                    fill="#e2e8f0"
                                />
                                <motion.rect
                                    x={x0}
                                    y={y}
                                    height={90}
                                    rx={12}
                                    initial={{ width: 0 }}
                                    animate={{ width: vis ? w : 0 }}
                                    transition={{ duration: 1.1 }}
                                    fill={a.mal ? '#99f6e4' : '#0d9488'}
                                    stroke={a.mal ? '#0d9488' : 'none'}
                                    strokeWidth={a.mal ? 5 : 0}
                                />
                                {vis && (
                                    <motion.text
                                        x={x0 + 30}
                                        y={y + 62}
                                        fontSize={46}
                                        fontWeight={900}
                                        fill={a.mal ? '#134e4a' : '#fff'}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        {a.mal ? `Mål: ${a.tekst}` : `${a.tekst} i jobb`}
                                    </motion.text>
                                )}
                            </g>
                        );
                    })}
                    {/* Lupe: 80 til 84 prosent, forstørret */}
                    {beat >= 2 && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <text
                                x={lupeX0 + lupeB / 2}
                                y={250}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill="#475569"
                            >
                                Forstørret: 80 til 84 %
                            </text>
                            <rect
                                x={lupeX0 - 20}
                                y={280}
                                width={lupeB + 40}
                                height={420}
                                rx={20}
                                fill="#fff"
                                stroke="#94a3b8"
                                strokeWidth={4}
                            />
                            {[80, 81, 82, 83, 84].map((p) => (
                                <line
                                    key={p}
                                    x1={lupe(p)}
                                    y1={300}
                                    x2={lupe(p)}
                                    y2={680}
                                    stroke="#e2e8f0"
                                    strokeWidth={3}
                                />
                            ))}
                            {ANDELER.filter((a) => beat >= a.fraBeat).map((a) => {
                                const i = ANDELER.indexOf(a);
                                const y = 290 + i * 150 + 45;
                                return (
                                    <g key={a.ar}>
                                        <circle
                                            cx={lupe(a.verdi)}
                                            cy={y}
                                            r={20}
                                            fill={a.mal ? '#99f6e4' : '#0d9488'}
                                            stroke="#0d9488"
                                            strokeWidth={5}
                                        />
                                    </g>
                                );
                            })}
                        </motion.g>
                    )}
                    <text x={x0} y={780} fontSize={34} fontWeight={700} fill="#475569">
                        Andel av voksne mellom 20 og 64 år. Lys stolpe: regjeringens mål.
                    </text>
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <rect
                        x={260}
                        y={330}
                        width={420}
                        height={260}
                        rx={28}
                        fill="#fff"
                        stroke="#94a3b8"
                        strokeWidth={5}
                    />
                    <text
                        x={470}
                        y={400}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill="#64748b"
                    >
                        Trenger støtte
                    </text>
                    <rect
                        x={920}
                        y={330}
                        width={420}
                        height={260}
                        rx={28}
                        fill="#fff"
                        stroke="#0d9488"
                        strokeWidth={6}
                    />
                    <text
                        x={1130}
                        y={400}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f766e"
                    >
                        Betaler skatt
                    </text>
                    <motion.g
                        initial={{ x: 0 }}
                        animate={{ x: 660 }}
                        transition={{ duration: 1.6, delay: 0.6, ease: 'easeInOut' }}
                    >
                        <Person x={470} y={560} s={1.1} farge="#0d9488" />
                    </motion.g>
                    <line
                        x1={720}
                        y1={460}
                        x2={860}
                        y2={460}
                        stroke="#0d9488"
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <polygon points="890,460 856,438 856,482" fill="#0d9488" />
                </motion.g>
            )}
        </svg>
    );
}

export function VelferdsgapGraf({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'varsel';
    const titler = TITLER[modus];
    return (
        <div
            className="absolute inset-0"
            style={{ background: modus === 'varsel' ? '#e0f2fe' : '#f8fafc' }}
        >
            {modus === 'varsel' && <Varsel beat={beat} />}
            {modus === 'baerere' && <Baerere beat={beat} />}
            {modus === 'hender' && <Hender beat={beat} />}
            {modus === 'mal' && <Mal beat={beat} />}
            <Overskrift tekst={titler[Math.min(beat, titler.length - 1)]} />
        </div>
    );
}
