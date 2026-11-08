import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Cantillon-effekten som en vei pengene går. Fire stasjoner fra venstre til høyre: staten som
 * trykker penger, firmaet som bygger veien, resten av økonomien og matbutikken din. Gule
 * mynter flyter så langt pengene har kommet. Prisskiltet ved hver stasjon er grønt (gamle
 * priser) til pengene har gått forbi, så blir det rødt.
 * Beat: 0 veien, 1 firmaet får først, 2 firmaet handler billig og blir rikere, 3 pengene sprer
 * seg og prisene stiger, 4 matbutikken: prisene er opp, lønna står, 5 de som får sist, taper.
 */

const Y = 470;
const STASJONER = [
    { x: 200, navn: 'Staten', under: 'trykker nye penger' },
    { x: 600, navn: 'Firmaet', under: 'bygger veien' },
    { x: 1000, navn: 'Videre', under: 'pengene blir brukt' },
    { x: 1400, navn: 'Matbutikken din', under: 'og lønna di' },
];

const OVERSKRIFT = [
    'Hvem får pengene først?',
    'Firmaet får pengene først',
    'Handler mens prisene er lave',
    'Pengene sprer seg, prisene stiger',
    'Prisene er opp. Lønna har ikke tatt igjen.',
    'Sist i køen taper',
];

/** Hvor langt pengene har kommet (indeks i STASJONER). */
function naadd(beat: number) {
    if (beat <= 0) return 0;
    if (beat <= 2) return 1;
    if (beat === 3) return 2;
    return 3;
}

function Ikon({ i }: { i: number }) {
    switch (i) {
        case 0:
            // Trykkpresse
            return (
                <g>
                    <rect x={-80} y={-60} width={160} height={110} rx={10} fill="#475569" />
                    <rect x={-60} y={-100} width={120} height={40} rx={8} fill="#334155" />
                    <rect x={-50} y={10} width={100} height={22} fill="#16a34a" />
                </g>
            );
        case 1:
            // Gravemaskin forenklet: kropp, arm og skuff
            return (
                <g>
                    <rect x={-80} y={-20} width={120} height={60} rx={8} fill="#f59e0b" />
                    <rect x={-60} y={-60} width={60} height={40} rx={6} fill="#fbbf24" />
                    <line x1={40} y1={-10} x2={90} y2={-60} stroke="#b45309" strokeWidth={12} />
                    <polygon points="80,-70 110,-40 70,-30" fill="#78350f" />
                    <rect x={-90} y={40} width={140} height={18} rx={9} fill="#1f2937" />
                </g>
            );
        case 2:
            // Noen butikker
            return (
                <g>
                    {[-60, 0, 60].map((x, k) => (
                        <g key={x}>
                            <rect
                                x={x - 26}
                                y={-50}
                                width={52}
                                height={100}
                                fill={['#bfdbfe', '#fde68a', '#fecaca'][k]}
                                stroke="#334155"
                                strokeWidth={3}
                            />
                            <rect x={x - 30} y={-62} width={60} height={16} fill="#334155" />
                        </g>
                    ))}
                </g>
            );
        default:
            // Matbutikk med handlevogn
            return (
                <g>
                    <rect
                        x={-90}
                        y={-60}
                        width={180}
                        height={110}
                        fill="#ecfccb"
                        stroke="#365314"
                        strokeWidth={4}
                    />
                    <rect x={-100} y={-80} width={200} height={26} fill="#16a34a" />
                    <rect x={-25} y={-10} width={50} height={60} fill="#365314" />
                </g>
            );
    }
}

function Prisskilt({ x, opp }: { x: number; opp: boolean }) {
    return (
        <g transform={`translate(${x} ${Y - 190})`}>
            <motion.rect
                x={-120}
                y={-40}
                width={240}
                height={64}
                rx={14}
                initial={false}
                animate={{ fill: opp ? '#dc2626' : '#16a34a' }}
                transition={{ duration: 0.6 }}
            />
            <text x={0} y={5} textAnchor="middle" fontSize={34} fontWeight={800} fill="#ffffff">
                {opp ? 'Priser ↑' : 'Gamle priser'}
            </text>
        </g>
    );
}

/** Mynter som flyter langs veien fra staten fram til der pengene er kommet. */
function Strom({ til }: { til: number }) {
    if (til === 0) return null;
    const fra = STASJONER[0].x + 90;
    const slutt = STASJONER[til].x - 90;
    const lengde = slutt - fra;
    return (
        <g>
            {Array.from({ length: 6 }, (_, i) => (
                <motion.circle
                    key={`${til}-${i}`}
                    cx={fra}
                    cy={Y + 130}
                    r={16}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={3}
                    initial={{ x: 0, opacity: 0 }}
                    animate={{ x: [0, lengde], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: 'linear' }}
                />
            ))}
        </g>
    );
}

export function InflasjonBolgen({ beat }: VisualProps) {
    const til = naadd(beat);
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-stone-100">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tekst}
                        x={800}
                        y={100}
                        textAnchor="middle"
                        fontSize={60}
                        fontWeight={800}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {tekst}
                    </motion.text>
                </AnimatePresence>

                {/* Veien pengene går */}
                <rect
                    x={110}
                    y={Y + 105}
                    width={1380}
                    height={50}
                    rx={25}
                    fill="#e7e5e4"
                    stroke="#a8a29e"
                    strokeWidth={3}
                />
                <motion.rect
                    x={110}
                    y={Y + 105}
                    height={50}
                    rx={25}
                    fill="#fde68a"
                    initial={false}
                    animate={{ width: til === 0 ? 50 : STASJONER[til].x - 110 }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
                <Strom til={til} />

                {STASJONER.map((s, i) => {
                    const aktiv = i <= til;
                    const sist = i === 3 && beat >= 5;
                    return (
                        <g key={s.navn}>
                            <g
                                transform={`translate(${s.x} ${Y})`}
                                opacity={aktiv || beat === 0 ? 1 : 0.55}
                            >
                                <Ikon i={i} />
                            </g>
                            <text
                                x={s.x}
                                y={Y + 230}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={800}
                                fill={sist ? '#b91c1c' : '#0f172a'}
                            >
                                {s.navn}
                            </text>
                            <text
                                x={s.x}
                                y={Y + 280}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={600}
                                fill="#475569"
                            >
                                {s.under}
                            </text>
                            {i >= 1 && beat >= 1 && (
                                <Prisskilt x={s.x} opp={beat >= 3 && i <= til} />
                            )}
                        </g>
                    );
                })}

                {/* Firmaet blir rikere: en pengebunke som vokser */}
                {beat >= 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {Array.from({ length: 5 }, (_, k) => (
                            <motion.ellipse
                                key={k}
                                cx={720}
                                cy={Y + 40 - k * 16}
                                rx={42}
                                ry={11}
                                fill="#facc15"
                                stroke="#a16207"
                                strokeWidth={3}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + k * 0.25 }}
                            />
                        ))}
                        {beat === 2 && (
                            <text
                                x={600}
                                y={Y - 260}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={800}
                                fill="#15803d"
                            >
                                blir rikere
                            </text>
                        )}
                    </motion.g>
                )}

                {/* Lønna di: en strek som ikke flytter seg */}
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <rect
                            x={1220}
                            y={Y + 300}
                            width={360}
                            height={80}
                            rx={16}
                            fill="#ffffff"
                            stroke="#334155"
                            strokeWidth={4}
                        />
                        <text
                            x={1400}
                            y={Y + 353}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#334155"
                        >
                            Lønna di: ikke ennå
                        </text>
                    </motion.g>
                )}

                {beat >= 5 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <text
                            x={600}
                            y={Y + 355}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill="#15803d"
                        >
                            Først: tjener
                        </text>
                        <text
                            x={950}
                            y={Y + 355}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#b91c1c"
                        >
                            Mat og strøm kan stige raskt
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
