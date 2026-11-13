import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Ringvann } from './Ringvann';

/**
 * Tavla for det som ikke er et sted på kartet.
 *
 * «by»: ungdom i en by. Én etter én begynner å si «kasta» i stedet for «kaste».
 * «trekk»: dialekten som en mur av små biter. Én bit løsner: uttale, ord, bøyning.
 * «to-svar»: to ruter side om side. Ringer i vann mot et hopp.
 * «overgang»: sju bygder på rad. Fargen glir litt fra bygd til bygd, og mer over fjellet.
 */

type Modus = 'by' | 'trekk' | 'to-svar' | 'overgang';

const ORANSJE = '#ea580c';
const GRA = '#a8a29e';
const BLA = '#2563eb';
const MORK = '#1c1917';

const OVERSKRIFT: Record<Modus, string[]> = {
    by: [
        '«å kaste» blir «å kasta»',
        'Noen få begynner',
        'Vennene plukker det opp',
        'Hele byen, og så?',
    ],
    trekk: ['Ikke hele dialekten', 'En ny uttale', 'Et nytt ord, en ny bøyning', 'Et målmerke'],
    'to-svar': ['To modeller, to svar', 'Bølgemodellen', 'Sprangmodellen', 'Begge har rett'],
    overgang: [
        'Fra bygd til bygd',
        'Nabobygder ligner mye',
        'Langt unna: større forskjell',
        'Fjell og fjorder styrer bølgen',
    ],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                x={800}
                y={95}
                textAnchor="middle"
                fontSize={60}
                fontWeight={900}
                fill={MORK}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

/* ---------- «by» ---------- */

const FOLK = Array.from({ length: 40 }, (_, i) => {
    const rad = Math.floor(i / 10);
    const kol = i % 10;
    return { x: 230 + kol * 118 + (rad % 2) * 50, y: 470 + rad * 105, i };
});
/** Rekkefølgen trekket når folk i: først noen få i midten, så vennene rundt. */
function naar(i: number) {
    const f = FOLK[i];
    const d = Math.hypot(f.x - 760, (f.y - 620) * 1.4);
    if (i === 14 || i === 15 || i === 25) return 1;
    if (d < 330) return 2;
    return 3;
}

function Person({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <g>
            <motion.circle
                cx={x}
                cy={y - 34}
                r={17}
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 0.6 }}
            />
            <motion.path
                d={`M${x - 26},${y + 26} Q${x - 26},${y - 12} ${x},${y - 12} Q${x + 26},${y - 12} ${x + 26},${y + 26} Z`}
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 0.6 }}
            />
        </g>
    );
}

function ByModus({ beat }: { beat: number }) {
    return (
        <g>
            {/* Byen i bakgrunnen */}
            {[140, 300, 420, 560, 700, 860, 990, 1120, 1260, 1380].map((x, i) => (
                <rect
                    key={i}
                    x={x}
                    y={300 - (i % 3) * 50}
                    width={110}
                    height={130 + (i % 3) * 50}
                    fill="#e2e8f0"
                />
            ))}
            {FOLK.map((f) => {
                const har = beat >= naar(f.i);
                return <Person key={f.i} x={f.x} y={f.y} farge={har ? ORANSJE : GRA} />;
            })}
            <g>
                <rect
                    x={110}
                    y={150}
                    width={420}
                    height={96}
                    rx={22}
                    fill="#ffffff"
                    stroke={GRA}
                    strokeWidth={4}
                />
                <text
                    x={320}
                    y={213}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={800}
                    fill="#57534e"
                >
                    før: «kaste»
                </text>
            </g>
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <rect
                        x={1070}
                        y={150}
                        width={420}
                        height={96}
                        rx={22}
                        fill="#fff7ed"
                        stroke={ORANSJE}
                        strokeWidth={5}
                    />
                    <text
                        x={1280}
                        y={213}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill={ORANSJE}
                    >
                        nå: «kasta»
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <rect x={680} y={150} width={240} height={96} rx={22} fill={ORANSJE} />
                    <text
                        x={800}
                        y={215}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        → ?
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/* ---------- «trekk» ---------- */

const BITER = Array.from({ length: 24 }, (_, i) => ({
    x: 140 + (i % 6) * 92,
    y: 230 + Math.floor(i / 6) * 92,
    i,
}));
const LOS = 9;
const KORT: { tittel: string; tekst: string; fraBeat: number }[] = [
    { tittel: 'Uttale', tekst: 'hvordan du sier ordet', fraBeat: 1 },
    { tittel: 'Ord', tekst: 'et helt nytt ord', fraBeat: 2 },
    { tittel: 'Bøyning', tekst: 'kaste → kasta', fraBeat: 2 },
];

function TrekkModus({ beat }: { beat: number }) {
    const los = BITER[LOS];
    return (
        <g>
            <text x={415} y={200} textAnchor="middle" fontSize={40} fontWeight={800} fill="#57534e">
                En dialekt
            </text>
            {BITER.map((b) =>
                b.i === LOS ? null : (
                    <motion.rect
                        key={b.i}
                        x={b.x}
                        y={b.y}
                        width={84}
                        height={84}
                        rx={10}
                        initial={false}
                        animate={{ fill: beat >= 3 && b.i % 5 === 0 ? '#fdba74' : '#93c5fd' }}
                        transition={{ duration: 0.8 }}
                    />
                )
            )}
            {/* Biten som løsner */}
            <motion.g
                initial={false}
                animate={{ x: beat >= 1 ? 760 - los.x : 0, y: beat >= 1 ? 380 - los.y : 0 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
            >
                <rect
                    x={los.x}
                    y={los.y}
                    width={84}
                    height={84}
                    rx={10}
                    fill={ORANSJE}
                    stroke="#ffffff"
                    strokeWidth={4}
                />
            </motion.g>
            {beat >= 3 && (
                <motion.text
                    x={802}
                    y={530}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={ORANSJE}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    = målmerke
                </motion.text>
            )}
            {KORT.filter((k) => beat >= k.fraBeat).map((k, i) => (
                <motion.g
                    key={k.tittel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: i === 2 ? 0.8 : 0.2 }}
                >
                    <rect
                        x={940}
                        y={210 + i * 150}
                        width={560}
                        height={126}
                        rx={20}
                        fill="#ffffff"
                        stroke={ORANSJE}
                        strokeWidth={4}
                    />
                    <text x={975} y={262 + i * 150} fontSize={44} fontWeight={900} fill={ORANSJE}>
                        {k.tittel}
                    </text>
                    <text x={975} y={312 + i * 150} fontSize={36} fontWeight={600} fill="#44403c">
                        {k.tekst}
                    </text>
                </motion.g>
            ))}
            {beat === 0 && (
                <motion.text
                    x={1200}
                    y={470}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={800}
                    fill="#57534e"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    Bare små biter flytter seg
                </motion.text>
            )}
            {beat >= 3 && (
                <motion.text
                    x={415}
                    y={660}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={700}
                    fill="#9a3412"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <tspan x={415}>Mange tar det opp:</tspan>
                    <tspan x={415} dy={46}>
                        dialekten endrer seg litt
                    </tspan>
                </motion.text>
            )}
        </g>
    );
}

/* ---------- «to-svar» ---------- */

function ToSvarModus({ beat }: { beat: number }) {
    return (
        <g>
            {[0, 1].map((s) => {
                const x0 = s === 0 ? 110 : 830;
                const aktiv = beat === 0 || beat === 3 || beat === s + 1;
                return (
                    <motion.g
                        key={s}
                        initial={false}
                        animate={{ opacity: aktiv ? 1 : 0.35 }}
                        transition={{ duration: 0.5 }}
                    >
                        <rect
                            x={x0}
                            y={150}
                            width={660}
                            height={640}
                            rx={30}
                            fill="#ffffff"
                            stroke={s === 0 ? BLA : ORANSJE}
                            strokeWidth={6}
                        />
                        <text
                            x={x0 + 330}
                            y={225}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill={s === 0 ? BLA : ORANSJE}
                        >
                            {s === 0 ? 'Bølgemodellen' : 'Sprangmodellen'}
                        </text>
                        <text
                            x={x0 + 330}
                            y={745}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={700}
                            fill="#44403c"
                        >
                            {s === 0 ? 'sildrer jevnt utover' : 'lange hopp, lander langt unna'}
                        </text>
                    </motion.g>
                );
            })}
            {/* Ringer i vann */}
            <circle cx={440} cy={480} r={14} fill={BLA} />
            {(beat === 1 || beat === 3) &&
                [0, 1, 2].map((n) => (
                    <Ringvann
                        key={`r-${n}-${beat}`}
                        x={440}
                        y={480}
                        r={210}
                        farge={BLA}
                        varighet={2.4}
                        forsinkelse={n * 0.8}
                        strek={5}
                    />
                ))}
            {/* Hoppet */}
            <circle cx={930} cy={600} r={22} fill={ORANSJE} />
            <motion.circle
                cx={1380}
                cy={420}
                r={22}
                initial={false}
                animate={{ fill: beat >= 2 ? ORANSJE : '#e7e5e4' }}
                transition={{ duration: 0.5, delay: beat === 2 ? 1.2 : 0 }}
            />
            {[1010, 1090, 1170, 1250].map((x, i) => (
                <circle key={i} cx={x} cy={600 - i * 10 + (i % 2) * 30} r={13} fill="#d6d3d1" />
            ))}
            {beat >= 2 && (
                <motion.path
                    d="M930,580 Q1150,240 1380,400"
                    fill="none"
                    stroke={ORANSJE}
                    strokeWidth={8}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2 }}
                />
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ originX: '800px', originY: '470px' }}
                >
                    <circle cx={800} cy={470} r={62} fill="#16a34a" />
                    <text
                        x={800}
                        y={492}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        +
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/* ---------- «overgang» ---------- */

/** Sju bygder fra vest til øst. Fargen glir litt for hvert steg, og mer over fjellet (mellom 4 og 5). */
const RAD = [0, 0.12, 0.24, 0.36, 0.48, 0.8, 0.92];
function bland(t: number) {
    const a = [37, 99, 235];
    const b = [234, 88, 12];
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function OvergangModus({ beat }: { beat: number }) {
    const xs = RAD.map((_, i) => 170 + i * 210);
    const fjellX = (xs[4] + xs[5]) / 2;
    return (
        <g>
            <rect x={0} y={560} width={1600} height={340} fill="#c7dbb3" />
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <path
                        d={`M${fjellX - 150},562 L${fjellX - 40},330 L${fjellX},380 L${fjellX + 60},300 L${fjellX + 150},562 Z`}
                        fill="#8b8f86"
                    />
                    <path
                        d={`M${fjellX + 20},350 L${fjellX + 60},300 L${fjellX + 92},360 Z`}
                        fill="#ffffff"
                    />
                    <text
                        x={fjellX}
                        y={270}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={800}
                        fill="#44403c"
                    >
                        fjell
                    </text>
                </motion.g>
            )}
            {RAD.map((t, i) => {
                const x = xs[i];
                const merk =
                    (beat === 1 && (i === 1 || i === 2)) ||
                    (beat === 2 && (i === 0 || i === 6)) ||
                    (beat >= 3 && (i === 4 || i === 5));
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= 1 && !merk ? 0.45 : 1 }}
                        transition={{ duration: 0.6, delay: beat === 0 ? i * 0.25 : 0 }}
                    >
                        <rect
                            x={x - 50}
                            y={560}
                            width={60}
                            height={50}
                            fill="#f5efe3"
                            stroke="#57534e"
                            strokeWidth={3}
                            transform="translate(0,-50)"
                        />
                        <path
                            d={`M${x - 58},512 L${x - 20},470 L${x + 18},512 Z`}
                            fill={bland(t)}
                        />
                        <rect
                            x={x + 8}
                            y={530}
                            width={44}
                            height={40}
                            fill="#f5efe3"
                            stroke="#57534e"
                            strokeWidth={3}
                        />
                        <path d={`M${x + 2},532 L${x + 30},500 L${x + 58},532 Z`} fill={bland(t)} />
                        <rect x={x - 70} y={650} width={140} height={56} rx={14} fill={bland(t)} />
                    </motion.g>
                );
            })}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {beat === 1 && (
                        <text
                            x={(xs[1] + xs[2]) / 2}
                            y={790}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={BLA}
                        >
                            nesten lik farge
                        </text>
                    )}
                    {beat === 2 && (
                        <>
                            <path d={`M${xs[0]},760 L${xs[6]},760`} stroke={MORK} strokeWidth={5} />
                            <path
                                d={`M${xs[6] - 24},744 L${xs[6]},760 L${xs[6] - 24},776`}
                                stroke={MORK}
                                strokeWidth={5}
                                fill="none"
                            />
                            <text
                                x={800}
                                y={830}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={900}
                                fill={MORK}
                            >
                                lenger unna, større forskjell
                            </text>
                        </>
                    )}
                    {beat >= 3 && (
                        <text
                            x={fjellX}
                            y={790}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#9a3412"
                        >
                            større forskjell over fjellet
                        </text>
                    )}
                </motion.g>
            )}
            <text x={800} y={180} textAnchor="middle" fontSize={34} fontWeight={600} fill="#57534e">
                Fargen viser dialekten. Lik farge = lik dialekt.
            </text>
        </g>
    );
}

export function SpredningTale({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'by';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#f8f5ef]">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'by' && <ByModus beat={beat} />}
                {modus === 'trekk' && <TrekkModus beat={beat} />}
                {modus === 'to-svar' && <ToSvarModus beat={beat} />}
                {modus === 'overgang' && <OvergangModus beat={beat} />}
                <Overskrift tekst={tekst} />
            </svg>
        </div>
    );
}
