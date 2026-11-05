import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Fruktbarheten i Kina som kurve: hvor mange barn en kvinne får i snitt.
 * - «fall»: slagordet «senere, lengre, færre» og fallet fra nesten seks til 2,7-2,8 på 1970-tallet.
 * - «virket»: påstanden om 400 millioner, og forskernes svar: det meste av fallet kom før regelen.
 * - «tre»: regelen løsnes (2013, 2016, 2021), men tallet går ned til 1,3 i 2020.
 * Bare punktene med tall er ekte. Linja mellom dem er en skisse, og det står i bildet.
 */

type Modus = 'fall' | 'virket' | 'tre';

const B = 1600;
const H = 900;
const X0 = 170;
const X1 = 1500;
const Y0 = 770;
const Y1 = 190;
const AAR0 = 1965;
const AAR1 = 2025;
const MAKS = 6.5;

const xFor = (aar: number) => X0 + ((aar - AAR0) / (AAR1 - AAR0)) * (X1 - X0);
const yFor = (barn: number) => Y0 - (barn / MAKS) * (Y0 - Y1);

/** Skissen. Bare 1970, 1979, 1995 og 2020 har tall i artikkelen. */
const FOR_REGELEN: [number, number][] = [
    [1970, 5.85],
    [1972, 5.4],
    [1974, 4.5],
    [1976, 3.5],
    [1979, 2.75],
];
const ETTER_REGELEN: [number, number][] = [
    [1979, 2.75],
    [1980, 2.75],
    [1982, 2.95],
    [1985, 2.7],
    [1990, 2.3],
    [1995, 1.7],
];
const SENERE: [number, number][] = [
    [1995, 1.7],
    [2005, 1.68],
    [2016, 1.7],
    [2018, 1.5],
    [2020, 1.3],
];

const sti = (pkt: [number, number][]) =>
    pkt
        .map(([a, b], i) => `${i === 0 ? 'M' : 'L'} ${xFor(a).toFixed(1)} ${yFor(b).toFixed(1)}`)
        .join(' ');

const OVERSKRIFT: Record<Modus, string[]> = {
    fall: [
        'Barn per kvinne i Kina, før regelen',
        'Slagordet fra rundt 1970',
        'Senere, lengre, færre',
        'Rundt 1970: nesten seks barn',
        'Slutten av 1970-tallet: 2,7 til 2,8',
    ],
    virket: [
        'Myndighetene: 400 millioner færre fødsler',
        'Forskerne: tallet er helt feil',
        'Minst 70 prosent av nedgangen kom før regelen',
        'Etter 1980: litt opp igjen i noen år',
        'Kina ble rikere. Etter 1995: rundt 1,7',
        'Uenige om regelen, enige om fallet',
    ],
    tre: [
        'Landet blir eldre for fort',
        '2013: to barn, hvis en forelder er enebarn',
        '2016: ettbarnspolitikken oppheves',
        '2020: 1,3 barn per kvinne',
        'Mai 2021: tre barn for alle par',
    ],
};

function Punkt({
    aar,
    barn,
    tekst,
    side = 'hoyre',
    farge = '#b91c1c',
}: {
    aar: number;
    barn: number;
    tekst: string;
    side?: 'hoyre' | 'over' | 'venstre';
    farge?: string;
}) {
    const x = xFor(aar);
    const y = yFor(barn);
    const tx = side === 'hoyre' ? x + 28 : side === 'venstre' ? x - 28 : x;
    const ty = side === 'over' ? y - 34 : y + 12;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <circle cx={x} cy={y} r={14} fill={farge} stroke="#fff" strokeWidth={5} />
            <text
                x={tx}
                y={ty}
                fontSize={40}
                fontWeight={800}
                fill="#0f172a"
                textAnchor={side === 'hoyre' ? 'start' : side === 'venstre' ? 'end' : 'middle'}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Linje({
    d,
    farge,
    bredde = 9,
    forsinkelse = 0,
}: {
    d: string;
    farge: string;
    bredde?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: forsinkelse, ease: 'easeInOut' }}
        />
    );
}

/** Loddrett strek for et år, med kort over. */
function Aarsmerke({
    aar,
    tekst,
    hoyde,
    farge = '#1e3a8a',
}: {
    aar: number;
    tekst: string;
    hoyde: number;
    farge?: string;
}) {
    const x = xFor(aar);
    const bredde = tekst.length * 19 + 40;
    const kx = Math.min(Math.max(x - bredde / 2, X0), X1 - bredde + 60);
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <line
                x1={x}
                y1={Y0}
                x2={x}
                y2={Y1 - 20}
                stroke={farge}
                strokeWidth={4}
                strokeDasharray="10 8"
            />
            <rect x={kx} y={hoyde - 30} width={bredde} height={70} rx={16} fill={farge} />
            <text
                x={kx + bredde / 2}
                y={hoyde + 16}
                fontSize={36}
                fontWeight={800}
                fill="#fff"
                textAnchor="middle"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Akser() {
    return (
        <g>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <g key={n}>
                    <line
                        x1={X0}
                        x2={X1}
                        y1={yFor(n)}
                        y2={yFor(n)}
                        stroke="#e2e8f0"
                        strokeWidth={2}
                    />
                    <text
                        x={X0 - 24}
                        y={yFor(n) + 12}
                        fontSize={32}
                        fill="#64748b"
                        textAnchor="end"
                        fontWeight={600}
                    >
                        {n}
                    </text>
                </g>
            ))}
            {[1970, 1980, 1990, 2000, 2010, 2020].map((a) => (
                <text
                    key={a}
                    x={xFor(a)}
                    y={Y0 + 50}
                    fontSize={32}
                    fill="#64748b"
                    textAnchor="middle"
                    fontWeight={600}
                >
                    {a}
                </text>
            ))}
            <text x={X0 - 110} y={Y1 - 40} fontSize={32} fill="#475569" fontWeight={700}>
                barn per kvinne
            </text>
            <text
                x={X1}
                y={Y0 + 100}
                fontSize={34}
                fill="#475569"
                textAnchor="end"
                fontWeight={600}
            >
                Skisse: bare tallene som er skrevet, er ekte
            </text>
        </g>
    );
}

function Fall({ beat }: { beat: number }) {
    const ord = [
        { tittel: 'senere', tekst: 'gifte seg senere' },
        { tittel: 'lengre', tekst: 'vente lenger mellom barna' },
        { tittel: 'færre', tekst: 'få færre barn' },
    ];
    return (
        <>
            <Aarsmerke aar={1980} tekst="1980: regelen" hoyde={690} farge="#7f1d1d" />
            {beat >= 1 && beat <= 2 && (
                <g>
                    {ord.map((o, i) => (
                        <motion.g
                            key={o.tittel}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.4 }}
                        >
                            <rect
                                x={1000}
                                y={330 + i * 130}
                                width={480}
                                height={110}
                                rx={20}
                                fill="#fff"
                                stroke="#b91c1c"
                                strokeWidth={4}
                            />
                            <text
                                x={1030}
                                y={beat === 2 ? 378 + i * 130 : 400 + i * 130}
                                fontSize={beat === 2 ? 40 : 52}
                                fontWeight={900}
                                fill="#b91c1c"
                            >
                                {o.tittel}
                            </text>
                            {beat === 2 && (
                                <text
                                    x={1030}
                                    y={420 + i * 130}
                                    fontSize={30}
                                    fontWeight={600}
                                    fill="#334155"
                                >
                                    {o.tekst}
                                </text>
                            )}
                        </motion.g>
                    ))}
                </g>
            )}
            {beat >= 3 && <Punkt aar={1970} barn={5.85} tekst="nesten 6" />}
            {beat >= 4 && (
                <>
                    <Linje d={sti(FOR_REGELEN)} farge="#b91c1c" />
                    <Punkt aar={1979} barn={2.75} tekst="2,7-2,8" side="venstre" />
                </>
            )}
        </>
    );
}

function Virket({ beat }: { beat: number }) {
    const xA = xFor(1970);
    const xB = xFor(1980);
    return (
        <>
            <Aarsmerke aar={1980} tekst="1980: regelen" hoyde={690} farge="#7f1d1d" />
            {/* Fallet før regelen, skravert. */}
            {beat >= 2 && (
                <motion.rect
                    x={xA}
                    y={yFor(5.85)}
                    width={xB - xA}
                    height={yFor(2.75) - yFor(5.85)}
                    fill="#fecaca"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 0.6 }}
                />
            )}
            <path
                d={sti(FOR_REGELEN)}
                fill="none"
                stroke="#b91c1c"
                strokeWidth={9}
                strokeLinecap="round"
            />
            {beat >= 3 && <Linje d={sti(ETTER_REGELEN.slice(0, 4))} farge="#ea580c" bredde={11} />}
            {beat >= 4 && (
                <Linje
                    d={sti(ETTER_REGELEN.slice(3))}
                    farge={beat === 4 ? '#15803d' : '#b91c1c'}
                    bredde={beat === 4 ? 11 : 9}
                />
            )}
            <Punkt aar={1970} barn={5.85} tekst="nesten 6" />
            <Punkt aar={1979} barn={2.75} tekst="2,7-2,8" side="venstre" />
            {beat >= 4 && (
                <Linje d={sti(SENERE.slice(0, 3))} farge="#15803d" bredde={8} forsinkelse={1.2} />
            )}
            {beat >= 4 && (
                <Punkt aar={1995} barn={1.7} tekst="ca. 1,7" side="over" farge="#15803d" />
            )}
            {beat <= 1 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ transformOrigin: '1180px 420px' }}
                >
                    <rect
                        x={900}
                        y={330}
                        width={560}
                        height={180}
                        rx={24}
                        fill="#fff"
                        stroke="#1e3a8a"
                        strokeWidth={5}
                    />
                    <text
                        x={1180}
                        y={400}
                        fontSize={34}
                        fontWeight={700}
                        fill="#1e3a8a"
                        textAnchor="middle"
                    >
                        Myndighetene:
                    </text>
                    <text
                        x={1180}
                        y={465}
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                        textAnchor="middle"
                    >
                        400 millioner færre fødsler
                    </text>
                </motion.g>
            )}
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <rect x={960} y={540} width={440} height={90} rx={20} fill="#b91c1c" />
                    <text
                        x={1180}
                        y={600}
                        fontSize={42}
                        fontWeight={900}
                        fill="#fff"
                        textAnchor="middle"
                    >
                        Forskerne: feil
                    </text>
                </motion.g>
            )}
            {beat === 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <rect
                        x={760}
                        y={420}
                        width={640}
                        height={120}
                        rx={22}
                        fill="#fff"
                        stroke="#b91c1c"
                        strokeWidth={4}
                    />
                    <text
                        x={1080}
                        y={475}
                        fontSize={46}
                        fontWeight={900}
                        fill="#b91c1c"
                        textAnchor="middle"
                    >
                        minst 70 prosent
                    </text>
                    <text
                        x={1080}
                        y={520}
                        fontSize={30}
                        fontWeight={600}
                        fill="#334155"
                        textAnchor="middle"
                    >
                        av nedgangen kom før regelen
                    </text>
                </motion.g>
            )}
            {beat === 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <text
                        x={xFor(1983)}
                        y={yFor(2.95) - 50}
                        fontSize={38}
                        fontWeight={800}
                        fill="#ea580c"
                        textAnchor="start"
                    >
                        litt opp igjen
                    </text>
                </motion.g>
            )}
            {beat === 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <rect
                        x={1000}
                        y={330}
                        width={460}
                        height={110}
                        rx={20}
                        fill="#fff"
                        stroke="#15803d"
                        strokeWidth={4}
                    />
                    <text
                        x={1230}
                        y={398}
                        fontSize={44}
                        fontWeight={900}
                        fill="#15803d"
                        textAnchor="middle"
                    >
                        Kina blir rikere
                    </text>
                </motion.g>
            )}
            {beat >= 5 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <rect x={900} y={330} width={560} height={110} rx={20} fill="#b91c1c" />
                    <text
                        x={1180}
                        y={400}
                        fontSize={44}
                        fontWeight={900}
                        fill="#fff"
                        textAnchor="middle"
                    >
                        færre barn, veldig raskt
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Tre({ beat }: { beat: number }) {
    return (
        <>
            <path
                d={sti([...FOR_REGELEN, ...ETTER_REGELEN.slice(1)])}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d={sti(SENERE.slice(0, 3))}
                fill="none"
                stroke="#b91c1c"
                strokeWidth={9}
                strokeLinecap="round"
            />
            {beat >= 3 && <Linje d={sti(SENERE.slice(2))} farge="#b91c1c" bredde={10} />}
            <Punkt aar={1995} barn={1.7} tekst="ca. 1,7" side="over" farge="#64748b" />
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <rect
                        x={940}
                        y={300}
                        width={540}
                        height={110}
                        rx={20}
                        fill="#fff"
                        stroke="#7f1d1d"
                        strokeWidth={4}
                    />
                    <text
                        x={1210}
                        y={368}
                        fontSize={42}
                        fontWeight={900}
                        fill="#7f1d1d"
                        textAnchor="middle"
                    >
                        få barn, landet eldes
                    </text>
                </motion.g>
            )}
            {beat >= 1 && <Aarsmerke aar={2013} tekst="2013: to barn hvis enebarn" hoyde={250} />}
            {beat >= 2 && <Aarsmerke aar={2016} tekst="2016: to barn for alle" hoyde={360} />}
            {beat >= 4 && (
                <Aarsmerke aar={2021} tekst="2021: tre barn" hoyde={470} farge="#7f1d1d" />
            )}
            {beat >= 3 && (
                <>
                    <Punkt aar={2020} barn={1.3} tekst="1,3" side="over" />
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <rect
                            x={760}
                            y={665}
                            width={580}
                            height={95}
                            rx={20}
                            fill="#fff"
                            stroke="#b91c1c"
                            strokeWidth={4}
                        />
                        <text
                            x={1050}
                            y={705}
                            fontSize={36}
                            fontWeight={900}
                            fill="#b91c1c"
                            textAnchor="middle"
                        >
                            2020: 12 millioner barn født
                        </text>
                        <text
                            x={1050}
                            y={745}
                            fontSize={28}
                            fontWeight={600}
                            fill="#334155"
                            textAnchor="middle"
                        >
                            antall fødte, det laveste som var målt
                        </text>
                    </motion.g>
                </>
            )}
        </>
    );
}

export function EttbarnKurve({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'fall';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#fffaf3' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Akser />
                {modus === 'fall' && <Fall beat={beat} />}
                {modus === 'virket' && <Virket beat={beat} />}
                {modus === 'tre' && <Tre beat={beat} />}
            </svg>
            <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl text-center"
                        style={{ maxWidth: '86%' }}
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
