import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Mennesker som enkle figurer. «primsigning»: korsmerket, dåpen som venter, og den
 * kristne naboen. «konger»: de tre kongene. «likemenn»: kongen blant likemenn, og kongen
 * som Guds utvalgte. «lov»: Mostertinget og kristenretten.
 */

type Modus = 'primsigning' | 'konger' | 'likemenn' | 'lov';

const B = 1600;
const H = 900;
const BAKKE = 700;
const MORK = '#0f172a';
const GRA = '#57534e';
const GULL = '#b45309';
const ROD = '#b91c1c';
const GRONN = '#15803d';

const FARGER = ['#64748b', '#0f766e', '#a16207', '#9f1239', '#1d4ed8'];

/** En figur som står på bakken: hode, kropp, valgfri krone, kors eller bispelue. */
function Figur({
    x,
    y = BAKKE,
    skala = 1,
    farge = '#64748b',
    krone = false,
    kors = false,
    korsPaBryst = false,
    bisp = false,
    opacity = 1,
}: {
    x: number;
    y?: number;
    skala?: number;
    farge?: string;
    krone?: boolean;
    kors?: boolean;
    korsPaBryst?: boolean;
    bisp?: boolean;
    opacity?: number;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ x, y, scale: skala, opacity }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
        >
            <path d="M -60 0 Q -60 -150 0 -150 Q 60 -150 60 0 Z" fill={farge} />
            <circle cx={0} cy={-195} r={42} fill="#f1d3b3" stroke={farge} strokeWidth={4} />
            {krone && (
                <path
                    d="M -38 -232 L -38 -262 L -19 -244 L 0 -270 L 19 -244 L 38 -262 L 38 -232 Z"
                    fill="#facc15"
                    stroke={GULL}
                    strokeWidth={4}
                />
            )}
            {bisp && (
                <path d="M -30 -232 Q 0 -300 30 -232 Z" fill="#f8fafc" stroke={GULL} strokeWidth={4} />
            )}
            {korsPaBryst && (
                <path d="M 0 -120 v 60 M -20 -100 h 40" stroke="#fef3c7" strokeWidth={9} strokeLinecap="round" />
            )}
            {kors && (
                <motion.path
                    d="M 0 -228 v 42 M -17 -214 h 34"
                    stroke={GULL}
                    strokeWidth={7}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2 }}
                />
            )}
        </motion.g>
    );
}

function Tekst({
    x,
    y,
    tekst,
    farge = MORK,
    storrelse = 36,
    synlig = true,
    anker = 'middle',
    vekt = 900,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    storrelse?: number;
    synlig?: boolean;
    anker?: 'start' | 'middle' | 'end';
    vekt?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            stroke="#f3efe6"
            strokeWidth={7}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

function Bakke() {
    return <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#d9d0bd" />;
}

function Primsigning({ beat }: { beat: number }) {
    const vikingX = beat >= 3 ? 640 : 560;
    const daapX = beat >= 2 ? 1420 : 1060;
    return (
        <>
            <Tekst
                x={B / 2}
                y={110}
                tekst={beat === 0 ? 'Primsigning: en korsmerking' : beat === 1 ? 'Klar til dåpen?' : beat === 2 ? 'Dåpen kunne vente' : 'Lettere å omgås kristne'}
                storrelse={58}
            />
            <Bakke />
            <Figur x={vikingX} farge="#9a3412" kors />
            <Tekst x={vikingX} y={BAKKE + 70} tekst="viking" storrelse={32} />

            {/* Dåpen: et vannfat */}
            <g transform={`translate(0 ${BAKKE})`}>
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? (beat >= 2 ? 0.55 : 1) : 0, x: daapX }}
                transition={{ duration: 1.2 }}
            >
                <path d="M -80 -90 L 80 -90 L 55 0 L -55 0 Z" fill="#94a3b8" />
                <ellipse cx={0} cy={-90} rx={80} ry={18} fill="#38bdf8" />
                <text x={0} y={-140} textAnchor="middle" fontSize={36} fontWeight={900} fill={MORK}>
                    dåp
                </text>
            </motion.g>
            </g>
            <motion.path
                d={`M ${vikingX + 90} ${BAKKE - 130} L ${(beat >= 2 ? 1420 : 1060) - 110} ${BAKKE - 130}`}
                stroke={beat >= 2 ? GRA : GULL}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 && beat <= 2 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            />
            <Tekst
                x={1000}
                y={BAKKE - 160}
                tekst="kanskje først på dødsleiet"
                farge={GRA}
                storrelse={34}
                synlig={beat === 2}
            />

            {/* Den kristne naboen */}
            <Figur x={beat >= 3 ? 900 : 1700} farge="#1d4ed8" korsPaBryst opacity={beat >= 3 ? 1 : 0} />
            <Tekst x={900} y={BAKKE + 70} tekst="kristen" storrelse={32} synlig={beat >= 3} />
            <motion.path
                d="M 700 560 L 840 560"
                stroke={GRONN}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
            />
        </>
    );
}

const KONGER = [
    { navn: 'Håkon den Gode', farge: '#0f766e' },
    { navn: 'Olav Tryggvason', farge: '#9a3412' },
    { navn: 'Olav Haraldsson', farge: '#7c3aed', under: '(Olav den Hellige)' },
];

function Konger({ beat }: { beat: number }) {
    return (
        <>
            <Tekst x={B / 2} y={110} tekst={beat === 0 ? 'Den store endringen' : 'Tre konger, tre forsøk'} storrelse={58} />
            <Bakke />
            {KONGER.map((k, i) => {
                const x = 400 + i * 400;
                const synlig = beat >= 1;
                const navn = beat >= 2;
                return (
                    <g key={k.navn}>
                        <Figur
                            x={x}
                            farge={navn ? k.farge : beat === 0 ? '#b45309' : '#cbd5e1'}
                            krone
                            opacity={synlig ? 1 : beat === 0 && i === 1 ? 1 : 0}
                            skala={beat === 0 ? 1.25 : 1}
                        />
                        <Tekst x={x} y={BAKKE + 70} tekst={k.navn} storrelse={36} synlig={navn} />
                        {k.under && (
                            <Tekst x={x} y={BAKKE + 112} tekst={k.under} farge={GRA} storrelse={28} vekt={700} synlig={navn} />
                        )}
                    </g>
                );
            })}
            <Tekst x={B / 2} y={300} tekst="Hvorfor?" farge={GULL} storrelse={96} synlig={beat >= 3} />
        </>
    );
}

function Likemenn({ beat }: { beat: number }) {
    const utvalgt = beat >= 2;
    return (
        <>
            <Tekst
                x={B / 2}
                y={110}
                tekst={utvalgt ? 'I kristendommen: Guds utvalgte' : 'Den gamle skikken: første blant likemenn'}
                storrelse={52}
            />
            <Bakke />
            {/* Lys ovenfra */}
            <motion.path
                d="M 740 150 L 860 150 L 960 470 L 640 470 Z"
                fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: utvalgt ? 0.55 : 0 }}
                transition={{ duration: 1.2 }}
            />
            <motion.rect
                x={700}
                width={200}
                fill="#a8a29e"
                initial={false}
                animate={{ y: utvalgt ? BAKKE - 220 : BAKKE, height: utvalgt ? 220 : 0 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
            {[0, 1, 2, 3, 4].map((i) => {
                const x = 240 + i * 280;
                const konge = i === 2;
                return (
                    <Figur
                        key={i}
                        x={x}
                        y={konge && utvalgt ? BAKKE - 220 : BAKKE}
                        farge={konge ? '#9a3412' : FARGER[i]}
                        krone={konge}
                        skala={!konge && utvalgt ? 0.85 : 1}
                        opacity={!konge && utvalgt ? 0.6 : 1}
                    />
                );
            })}
            {[0, 1, 2, 3].map((i) => (
                <Tekst
                    key={i}
                    x={380 + i * 280}
                    y={BAKKE - 70}
                    tekst="="
                    farge={GULL}
                    storrelse={90}
                    synlig={beat === 1}
                />
            ))}
            <Tekst x={B / 2} y={BAKKE + 80} tekst="kongen sto fremst" storrelse={34} synlig={beat <= 1} />
            <Tekst x={B / 2} y={BAKKE + 80} tekst="kongen over alle de andre" farge={ROD} storrelse={34} synlig={beat >= 3} />
        </>
    );
}

const BONDE_RING = [300, 500, 1100, 1300];
const BONDE_SIDE = [110, 650, 110, 650];

function Lov({ beat }: { beat: number }) {
    const ting = beat >= 1;
    const regler = [
        { tekst: 'Kristendommen: eneste tillatte tro', ok: true, fraBeat: 3 },
        { tekst: 'All annen gudsdyrking: forbudt', ok: false, fraBeat: 3 },
        { tekst: 'Påbudt: dåp og faste', ok: true, fraBeat: 4 },
        { tekst: 'Påbudt: grav i vigslet jord', ok: true, fraBeat: 4 },
    ];
    // Bøndene står rundt kongen på tinget, og trekker seg til siden når loven kommer.
    const bonder = [0, 1, 2, 3];
    return (
        <>
            <Tekst
                x={B / 2}
                y={100}
                tekst={beat === 0 ? 'Olav Haraldsson fortsetter' : beat <= 2 ? 'Mostertinget' : 'Kristenretten'}
                storrelse={58}
            />
            <Tekst
                x={B / 2}
                y={155}
                tekst="en gang i 1020-årene, kanskje i 1024"
                farge={GRA}
                storrelse={30}
                vekt={700}
                synlig={beat >= 1}
            />
            <Bakke />
            <Figur x={beat >= 2 ? 300 : 800} farge="#7c3aed" krone skala={beat === 0 ? 1.2 : 1} />
            <Figur x={beat >= 2 ? 480 : 1700} farge="#f8fafc" bisp opacity={beat >= 2 ? 1 : 0} />
            <Tekst x={300} y={BAKKE + 70} tekst="kongen" storrelse={30} synlig={beat >= 2} />
            <Tekst x={480} y={BAKKE + 110} tekst="biskop Grimkjell" storrelse={30} synlig={beat >= 2} />
            {bonder.map((i) => (
                <Figur
                    key={i}
                    x={beat >= 2 ? BONDE_SIDE[i] : BONDE_RING[i]}
                    skala={0.72}
                    farge={FARGER[i]}
                    opacity={ting && !(beat >= 2 && i >= 2) ? 1 : 0}
                />
            ))}
            <Tekst x={B / 2} y={BAKKE + 80} tekst="bøndene på tinget" farge={GRA} storrelse={30} vekt={700} synlig={beat === 1} />

            {/* Lovrullen */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0 }} transition={{ duration: 0.8 }}>
                <rect x={900} y={220} width={640} height={440} rx={20} fill="#fef3c7" stroke={GULL} strokeWidth={5} />
                <text x={1220} y={285} textAnchor="middle" fontSize={40} fontWeight={900} fill={MORK}>
                    Kristenrett for hele riket
                </text>
                {regler.map((r, i) => (
                    <motion.g
                        key={r.tekst}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= r.fraBeat ? 1 : 0 }}
                        transition={{ duration: 0.6, delay: (i % 2) * 0.5 }}
                    >
                        <circle cx={950} cy={360 + i * 80} r={22} fill={r.ok ? GRONN : ROD} />
                        <path
                            d={
                                r.ok
                                    ? `M 939 ${360 + i * 80} l 8 9 l 15 -18`
                                    : `M 941 ${351 + i * 80} l 18 18 M 959 ${351 + i * 80} l -18 18`
                            }
                            stroke="#fff"
                            strokeWidth={6}
                            strokeLinecap="round"
                            fill="none"
                        />
                        <text x={990} y={371 + i * 80} fontSize={32} fontWeight={800} fill={MORK}>
                            {r.tekst}
                        </text>
                    </motion.g>
                ))}
            </motion.g>
        </>
    );
}

export function KristningenFolk({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'primsigning';
    return (
        <div className="absolute inset-0 bg-[#f3efe6]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'primsigning' && <Primsigning beat={beat} />}
                {modus === 'konger' && <Konger beat={beat} />}
                {modus === 'likemenn' && <Likemenn beat={beat} />}
                {modus === 'lov' && <Lov beat={beat} />}
            </svg>
        </div>
    );
}
