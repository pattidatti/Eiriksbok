import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Papirene i historien, tegnet i SVG. Ingen mennesker og ingen vold vises.
 * «avis»: kuppforsøket i oktober 1965, og stempelet som gir hele PKI skylden.
 * «liste»: vestlige rapporter, navnelistene fra USA, og Suharto som alliert.
 * «naboer»: en gate der vinduene slukner etter hvert som frykten sprer seg.
 * «stille»: et hus med stemplet dør og et lys bak gardinen. Sorgen må skjules.
 * «arkiv»: hemmelige mapper som åpnes, stemmer som forteller, og samme mønster i Iran og Chile.
 */

const B = 1600;
const H = 900;
type Modus = 'avis' | 'liste' | 'naboer' | 'stille' | 'arkiv';

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    avis: [
        { tekst: 'Oktober 1965' },
        { tekst: 'Suharto: hele PKI har skylden', rod: true },
        { tekst: 'Startskuddet', rod: true },
    ],
    liste: [
        { tekst: 'Vesten visste' },
        { tekst: 'Lister med navn fra USA', rod: true },
        { tekst: 'Suharto: en alliert for Vesten' },
    ],
    naboer: [
        { tekst: 'Ikke bare soldater' },
        { tekst: 'Naboer angir naboer', rod: true },
        { tekst: 'Frykt og propaganda', rod: true },
        { tekst: 'Det kan gå fort', rod: true },
    ],
    stille: [
        { tekst: 'Ikke fjern historie' },
        { tekst: 'Stemplet som forrædere', rod: true },
        { tekst: 'Sorg i det skjulte' },
        { tekst: 'Å fortelle er å vise respekt' },
    ],
    arkiv: [
        { tekst: 'Hemmelige dokumenter blir kjent' },
        { tekst: 'De overlevende forteller' },
        { tekst: 'Hvem får fortelle historien?' },
        { tekst: 'Iran. Chile. Indonesia.' },
    ],
};

const BAKGRUNN: Record<Modus, string> = {
    avis: 'linear-gradient(#e7e5e4, #d6d3d1)',
    liste: 'linear-gradient(#e2e8f0, #cbd5e1)',
    naboer: 'linear-gradient(#1e1b4b, #1e293b)',
    stille: 'linear-gradient(#0f172a, #1e1b4b)',
    arkiv: 'linear-gradient(#e7e5e4, #fef3c7)',
};

export function IndonesiaPapir({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'avis';
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: BAKGRUNN[modus] }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'avis' && <Avis beat={beat} />}
                {modus === 'liste' && <Liste beat={beat} />}
                {modus === 'naboer' && <Naboer beat={beat} />}
                {modus === 'stille' && <Stille beat={beat} />}
                {modus === 'arkiv' && <Arkiv beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-800 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Grå tekstlinjer som står for tekst eleven ikke trenger å lese. */
function Linjer({
    x,
    y,
    b,
    antall,
    avstand = 26,
    farge = '#a8a29e',
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    b: number;
    antall: number;
    avstand?: number;
    farge?: string;
    forsinkelse?: number;
}) {
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => (
                <motion.rect
                    key={i}
                    x={x}
                    y={y + i * avstand}
                    height={10}
                    rx={5}
                    fill={farge}
                    initial={{ width: 0 }}
                    animate={{ width: b * (0.6 + (((i * 37) % 10) / 10) * 0.4) }}
                    transition={{ delay: forsinkelse + i * 0.05, duration: 0.5 }}
                />
            ))}
        </g>
    );
}

function Stempel({
    x,
    y,
    tekst,
    farge = '#b91c1c',
    forsinkelse = 0,
    rotasjon = -10,
    str = 64,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    forsinkelse?: number;
    rotasjon?: number;
    str?: number;
}) {
    const b = tekst.length * str * 0.66 + 60;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 2.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 260, damping: 16 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <g transform={`rotate(${rotasjon} ${x} ${y})`}>
                <rect
                    x={x - b / 2}
                    y={y - str * 0.8}
                    width={b}
                    height={str * 1.6}
                    rx={12}
                    fill="rgba(255,255,255,0.85)"
                    stroke={farge}
                    strokeWidth={9}
                />
                <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={str}
                    fontWeight={900}
                    fill={farge}
                    letterSpacing={3}
                >
                    {tekst}
                </text>
            </g>
        </motion.g>
    );
}

/** Kuppforsøket: en avisside, så stempelet, så flere aviser som spres. */
function Avis({ beat }: { beat: number }) {
    const kopier = beat >= 2 ? 5 : 0;
    return (
        <g>
            {Array.from({ length: kopier }, (_, i) => {
                const a = -24 + i * 12;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, rotate: 0, x: 0 }}
                        animate={{ opacity: 1, rotate: a, x: (i - 2) * 160 }}
                        transition={{ delay: 0.4 + i * 0.15, duration: 0.9 }}
                        style={{ transformOrigin: '800px 900px' }}
                    >
                        <rect
                            x={620}
                            y={260}
                            width={360}
                            height={500}
                            rx={6}
                            fill="#e7e5e4"
                            stroke="#a8a29e"
                            strokeWidth={3}
                        />
                        <rect x={650} y={290} width={300} height={36} fill="#57534e" />
                        <Linjer x={650} y={350} b={300} antall={12} />
                    </motion.g>
                );
            })}
            <motion.g
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <rect
                    x={480}
                    y={170}
                    width={640}
                    height={680}
                    rx={8}
                    fill="#fafaf9"
                    stroke="#78716c"
                    strokeWidth={4}
                />
                <text
                    x={800}
                    y={230}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#57534e"
                    letterSpacing={6}
                >
                    OKTOBER 1965
                </text>
                <line x1={520} y1={256} x2={1080} y2={256} stroke="#57534e" strokeWidth={3} />
                <text
                    x={800}
                    y={330}
                    textAnchor="middle"
                    fontSize={68}
                    fontWeight={900}
                    fill="#1c1917"
                >
                    KUPPFORSØK
                </text>
                <text
                    x={800}
                    y={392}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill="#44403c"
                >
                    Offiserer drept. Kuppet mislykkes.
                </text>
                <Linjer x={530} y={440} b={250} antall={12} forsinkelse={0.4} />
                <Linjer x={820} y={440} b={250} antall={12} forsinkelse={0.6} />
            </motion.g>
            {beat >= 1 && (
                <>
                    <Stempel x={800} y={640} tekst="PKI HAR SKYLDEN" forsinkelse={0.6} str={58} />
                    <motion.g
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 }}
                    >
                        <rect x={1170} y={360} width={360} height={170} rx={20} fill="#3f4a2f" />
                        <text
                            x={1350}
                            y={430}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            General Suharto
                        </text>
                        <text
                            x={1350}
                            y={482}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={600}
                            fill="#d9f99d"
                        >
                            leder hæren
                        </text>
                    </motion.g>
                </>
            )}
        </g>
    );
}

/** Rapportene, listene med navn og forbundet mellom USA og Suharto. */
function Liste({ beat }: { beat: number }) {
    return (
        <g>
            {/* Rapporter fra vestlige ambassader */}
            {[0, 1, 2].map((i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: beat >= 1 ? 0.55 : 1, y: 0 }}
                    transition={{ delay: i * 0.3, duration: 0.7 }}
                >
                    <g transform={`rotate(${-8 + i * 7} ${300 + i * 120} 520)`}>
                        <rect
                            x={180 + i * 120}
                            y={260}
                            width={280}
                            height={380}
                            rx={6}
                            fill="#ffffff"
                            stroke="#94a3b8"
                            strokeWidth={3}
                        />
                        <text
                            x={320 + i * 120}
                            y={310}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={900}
                            fill="#334155"
                        >
                            RAPPORT
                        </text>
                        <Linjer
                            x={205 + i * 120}
                            y={340}
                            b={230}
                            antall={9}
                            forsinkelse={0.3 + i * 0.3}
                        />
                    </g>
                </motion.g>
            ))}
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    <ellipse
                        cx={1120}
                        cy={480}
                        rx={200}
                        ry={110}
                        fill="#ffffff"
                        stroke="#1e3a8a"
                        strokeWidth={10}
                    />
                    <circle cx={1120} cy={480} r={70} fill="#1e3a8a" />
                    <circle cx={1120} cy={480} r={30} fill="#0f172a" />
                    <circle cx={1140} cy={462} r={12} fill="#ffffff" />
                    <text
                        x={1120}
                        y={660}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#1e3a8a"
                    >
                        De visste
                    </text>
                </motion.g>
            )}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.9 }}
                >
                    <rect
                        x={880}
                        y={150}
                        width={420}
                        height={720}
                        rx={8}
                        fill="#fefce8"
                        stroke="#a16207"
                        strokeWidth={4}
                    />
                    <text
                        x={1090}
                        y={210}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#713f12"
                    >
                        NAVN PÅ MISTENKTE
                    </text>
                    {Array.from({ length: 18 }, (_, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.12 }}
                        >
                            <text
                                x={910}
                                y={262 + i * 33}
                                fontSize={22}
                                fontWeight={700}
                                fill="#a16207"
                            >
                                {i + 1}.
                            </text>
                            <rect
                                x={955}
                                y={250 + i * 33}
                                width={160 + ((i * 53) % 150)}
                                height={14}
                                rx={7}
                                fill="#57534e"
                                opacity={0.75}
                            />
                        </motion.g>
                    ))}
                </motion.g>
            )}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                >
                    <rect x={1340} y={330} width={200} height={90} rx={16} fill="#1e3a8a" />
                    <text
                        x={1440}
                        y={386}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        USA
                    </text>
                    <path
                        d="M 1440 430 L 1440 560 L 1320 560"
                        fill="none"
                        stroke="#1e3a8a"
                        strokeWidth={8}
                        strokeDasharray="4 14"
                        strokeLinecap="round"
                    />
                    <path d="M 1330 545 L 1300 560 L 1330 575 Z" fill="#1e3a8a" />
                    <rect x={1340} y={600} width={200} height={90} rx={16} fill="#3f4a2f" />
                    <text
                        x={1440}
                        y={656}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Hæren
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 180, damping: 16 }}
                    style={{ transformOrigin: '420px 780px' }}
                >
                    <rect
                        x={80}
                        y={700}
                        width={700}
                        height={150}
                        rx={30}
                        fill="#ffffff"
                        stroke="#1e3a8a"
                        strokeWidth={6}
                    />
                    <rect x={110} y={735} width={180} height={80} rx={14} fill="#1e3a8a" />
                    <text
                        x={200}
                        y={787}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Vesten
                    </text>
                    <text
                        x={430}
                        y={787}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        alliert
                    </text>
                    <rect x={570} y={735} width={180} height={80} rx={14} fill="#3f4a2f" />
                    <text
                        x={660}
                        y={787}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Suharto
                    </text>
                    <line x1={300} y1={810} x2={560} y2={810} stroke="#0f172a" strokeWidth={5} />
                </motion.g>
            )}
        </g>
    );
}

const HUS = Array.from({ length: 8 }, (_, i) => ({ x: 110 + i * 180, h: 210 + ((i * 47) % 90) }));

/** En gate om natta. Vinduene slukner, og plakater dukker opp på veggene. */
function Naboer({ beat }: { beat: number }) {
    const bakke = 760;
    /** Hvilke hus som fortsatt har lys. */
    const lys = (i: number) => {
        if (beat <= 1) return true;
        if (beat === 2) return ![1, 3, 4, 6].includes(i);
        return i === 5;
    };
    return (
        <g>
            <circle cx={1400} cy={170} r={50} fill="#fef9c3" opacity={0.85} />
            <rect x={0} y={bakke} width={B} height={H - bakke} fill="#1e1b4b" />
            {HUS.map((hus, i) => {
                const topp = bakke - hus.h;
                return (
                    <g key={i}>
                        <rect
                            x={hus.x}
                            y={topp}
                            width={150}
                            height={hus.h}
                            fill="#334155"
                            stroke="#1e293b"
                            strokeWidth={4}
                        />
                        <path
                            d={`M ${hus.x - 12} ${topp} L ${hus.x + 75} ${topp - 70} L ${hus.x + 162} ${topp} Z`}
                            fill="#475569"
                        />
                        {[0, 1].map((k) => (
                            <rect
                                key={k}
                                x={hus.x + 22 + k * 64}
                                y={topp + 40}
                                width={42}
                                height={54}
                                fill={lys(i) ? '#fde68a' : '#0f172a'}
                                style={{ transition: `fill 1s ease ${i * 0.25}s` }}
                            />
                        ))}
                        <rect x={hus.x + 55} y={bakke - 80} width={40} height={80} fill="#1e293b" />
                        {beat >= 2 && i % 2 === 0 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.2 }}
                                style={{ transformOrigin: `${hus.x + 120}px ${topp + 140}px` }}
                            >
                                <rect
                                    x={hus.x + 98}
                                    y={topp + 112}
                                    width={46}
                                    height={60}
                                    fill="#b91c1c"
                                />
                                <text
                                    x={hus.x + 121}
                                    y={topp + 152}
                                    textAnchor="middle"
                                    fontSize={40}
                                    fontWeight={900}
                                    fill="#ffffff"
                                >
                                    !
                                </text>
                            </motion.g>
                        )}
                    </g>
                );
            })}
            {beat === 1 &&
                [
                    [0, 1],
                    [2, 3],
                    [5, 4],
                    [7, 6],
                ].map(([fra, til], i) => {
                    const x1 = HUS[fra].x + 75;
                    const x2 = HUS[til].x + 75;
                    const y = bakke - HUS[fra].h - 110;
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + i * 0.4 }}
                        >
                            <path
                                d={`M ${x1} ${y + 30} Q ${(x1 + x2) / 2} ${y - 50} ${x2} ${y + 30}`}
                                fill="none"
                                stroke="#fca5a5"
                                strokeWidth={6}
                                strokeDasharray="4 12"
                                strokeLinecap="round"
                            />
                            <circle cx={x2} cy={y + 34} r={10} fill="#fca5a5" />
                        </motion.g>
                    );
                })}
            {beat >= 2 && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    x={800}
                    y={850}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#fecaca"
                >
                    {beat === 2 ? 'Plakater, rykter og trusler' : 'Et helt samfunn forandret'}
                </motion.text>
            )}
        </g>
    );
}

/** Ett hus om natta. Døra blir stemplet, gardinen trekkes for, til slutt åpnes døra. */
function Stille({ beat }: { beat: number }) {
    const x = 560;
    const y = 300;
    return (
        <g>
            {Array.from({ length: 30 }, (_, i) => (
                <circle
                    key={i}
                    cx={(i * 263) % B}
                    cy={40 + ((i * 97) % 240)}
                    r={2.5}
                    fill="#e0e7ff"
                    opacity={0.7}
                />
            ))}
            <rect x={0} y={760} width={B} height={140} fill="#0f172a" />
            {/* Huset */}
            <rect
                x={x}
                y={y}
                width={480}
                height={460}
                fill="#334155"
                stroke="#1e293b"
                strokeWidth={6}
            />
            <path
                d={`M ${x - 30} ${y} L ${x + 240} ${y - 150} L ${x + 510} ${y} Z`}
                fill="#475569"
            />
            {/* Vinduet med lys bak gardinen */}
            <rect x={x + 50} y={y + 70} width={160} height={170} fill="#fde68a" />
            <motion.rect
                x={x + 50}
                y={y + 70}
                height={170}
                fill="#7c2d12"
                initial={false}
                animate={{ width: beat >= 2 ? 160 : 30 }}
                transition={{ duration: 1.2 }}
            />
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <circle cx={x + 130} cy={y + 150} r={60} fill="#fbbf24" opacity={0.35} />
                    <rect x={x + 122} y={y + 160} width={16} height={60} fill="#fef3c7" />
                    <path
                        d={`M ${x + 130} ${y + 128} Q ${x + 142} ${y + 146} ${x + 130} ${y + 158} Q ${x + 118} ${y + 146} ${x + 130} ${y + 128} Z`}
                        fill="#f59e0b"
                    />
                </motion.g>
            )}
            {/* Døra */}
            <motion.rect
                x={x + 290}
                y={y + 220}
                width={130}
                height={240}
                fill={beat >= 3 ? '#fde68a' : '#1e293b'}
                style={{ transition: 'fill 1.2s ease' }}
            />
            {beat >= 3 && (
                <motion.path
                    d={`M ${x + 290} ${y + 460} L ${x + 420} ${y + 460} L ${x + 560} ${y + 560} L ${x + 150} ${y + 560} Z`}
                    fill="#fde68a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.45 }}
                    transition={{ delay: 0.6, duration: 1.2 }}
                />
            )}
            {beat >= 1 && beat < 3 && (
                <Stempel
                    x={x + 355}
                    y={y + 330}
                    tekst="FORRÆDER"
                    str={40}
                    forsinkelse={0.5}
                    rotasjon={-14}
                />
            )}
            {beat === 0 && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    x={1300}
                    y={500}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill="#e0e7ff"
                >
                    De overlevende
                </motion.text>
            )}
            {beat === 1 && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    x={1300}
                    y={500}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#fecaca"
                >
                    i flere tiår
                </motion.text>
            )}
        </g>
    );
}

const MAPPER = [
    { x: 160, navn: 'Indonesia' },
    { x: 620, navn: 'Iran' },
    { x: 1080, navn: 'Chile' },
];

/** Arkivet: hemmelige mapper åpnes, stemmer forteller, samme mønster flere steder. */
function Arkiv({ beat }: { beat: number }) {
    return (
        <g>
            {beat <= 1 && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2 }}
                        >
                            <rect
                                x={300 + i * 30}
                                y={300 + i * 30}
                                width={500}
                                height={360}
                                rx={10}
                                fill="#d6b77a"
                                stroke="#92400e"
                                strokeWidth={4}
                            />
                            <rect
                                x={300 + i * 30}
                                y={270 + i * 30}
                                width={180}
                                height={40}
                                rx={8}
                                fill="#d6b77a"
                                stroke="#92400e"
                                strokeWidth={4}
                            />
                        </motion.g>
                    ))}
                    <Stempel x={610} y={500} tekst="HEMMELIG" forsinkelse={0} />
                    <motion.g
                        initial={{ opacity: 0, x: -120, rotate: -10 }}
                        animate={{ opacity: 1, x: 0, rotate: 4 }}
                        transition={{ delay: 1, duration: 1 }}
                        style={{ transformOrigin: '1050px 480px' }}
                    >
                        <rect
                            x={860}
                            y={240}
                            width={380}
                            height={500}
                            rx={6}
                            fill="#ffffff"
                            stroke="#78716c"
                            strokeWidth={3}
                        />
                        <Linjer x={890} y={290} b={320} antall={13} forsinkelse={1.3} />
                        <Stempel
                            x={1050}
                            y={660}
                            tekst="KJENT"
                            farge="#15803d"
                            str={48}
                            forsinkelse={1.8}
                            rotasjon={-6}
                        />
                    </motion.g>
                </>
            )}
            {beat === 1 &&
                [
                    [1340, 300],
                    [1420, 470],
                    [1300, 620],
                ].map(([bx, by], i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            delay: 0.6 + i * 0.5,
                            type: 'spring',
                            stiffness: 220,
                            damping: 15,
                        }}
                        style={{ transformOrigin: `${bx}px ${by}px` }}
                    >
                        <ellipse
                            cx={bx}
                            cy={by}
                            rx={120}
                            ry={70}
                            fill="#ffffff"
                            stroke="#1e3a8a"
                            strokeWidth={5}
                        />
                        <path
                            d={`M ${bx - 50} ${by + 55} L ${bx - 80} ${by + 105} L ${bx - 15} ${by + 65} Z`}
                            fill="#ffffff"
                            stroke="#1e3a8a"
                            strokeWidth={5}
                            strokeLinejoin="round"
                        />
                        <Linjer
                            x={bx - 70}
                            y={by - 22}
                            b={140}
                            antall={3}
                            avstand={20}
                            farge="#93c5fd"
                            forsinkelse={0.9 + i * 0.5}
                        />
                    </motion.g>
                ))}
            {beat === 2 && (
                <motion.g
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* En stor bok: historien slik vinnerne skrev den */}
                    <path
                        d="M 500 250 Q 650 220 800 260 L 800 760 Q 650 720 500 750 Z"
                        fill="#fafaf9"
                        stroke="#78716c"
                        strokeWidth={5}
                    />
                    <path
                        d="M 1100 250 Q 950 220 800 260 L 800 760 Q 950 720 1100 750 Z"
                        fill="#fafaf9"
                        stroke="#78716c"
                        strokeWidth={5}
                    />
                    <Linjer x={540} y={320} b={220} antall={12} forsinkelse={0.4} />
                    <motion.g
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 1.4, duration: 1.4 }}
                    >
                        <Linjer x={840} y={320} b={220} antall={12} forsinkelse={0.6} />
                    </motion.g>
                    <text
                        x={610}
                        y={810}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#1c1917"
                    >
                        det vinnerne forteller
                    </text>
                    <text
                        x={1000}
                        y={810}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#57534e"
                    >
                        det som ble skjult
                    </text>
                </motion.g>
            )}
            {beat >= 3 &&
                MAPPER.map((m, i) => (
                    <motion.g
                        key={m.navn}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.3 + i * 0.5,
                            type: 'spring',
                            stiffness: 160,
                            damping: 18,
                        }}
                    >
                        <rect
                            x={m.x}
                            y={320}
                            width={360}
                            height={420}
                            rx={10}
                            fill="#d6b77a"
                            stroke="#92400e"
                            strokeWidth={4}
                        />
                        <rect
                            x={m.x}
                            y={290}
                            width={160}
                            height={40}
                            rx={8}
                            fill="#d6b77a"
                            stroke="#92400e"
                            strokeWidth={4}
                        />
                        <text
                            x={m.x + 180}
                            y={450}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#451a03"
                        >
                            {m.navn}
                        </text>
                        <Stempel
                            x={m.x + 180}
                            y={600}
                            tekst="SKJULT"
                            str={44}
                            forsinkelse={0.8 + i * 0.5}
                            rotasjon={-8}
                        />
                    </motion.g>
                ))}
        </g>
    );
}
