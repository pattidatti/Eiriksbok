import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tidslinjer for kristningen. «myte»: ett sverdslag i 1030 mot et par hundre år.
 * «slutt»: vikingtiden 800-1050, epilogen i 1066 og de tre ukene mellom Stamford Bridge
 * og Hastings. «trell»: trelldommen som forsvinner fram mot landsloven i 1274.
 */

type Modus = 'myte' | 'slutt' | 'trell';

const B = 1600;
const VENSTRE = 140;
const BREDDE = 1320;
const AKSE_Y = 640;

const ROD = '#b91c1c';
const GULL = '#b45309';
const BLA = '#1d4ed8';
const GRONN = '#15803d';
const MORK = '#0f172a';
const GRA = '#57534e';

const OMRADE: Record<Modus, [number, number]> = {
    myte: [900, 1150],
    slutt: [760, 1100],
    trell: [1000, 1300],
};

function Tekst({
    x,
    y,
    tekst,
    farge = MORK,
    storrelse = 34,
    anker = 'middle',
    synlig = true,
    vekt = 900,
    halo = true,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
    synlig?: boolean;
    vekt?: number;
    halo?: boolean;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            stroke={halo ? '#f6f1e4' : 'none'}
            strokeWidth={6}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

function Akse({ fra, til, steg }: { fra: number; til: number; steg: number }) {
    const x = (a: number) => VENSTRE + ((a - fra) / (til - fra)) * BREDDE;
    const merker: number[] = [];
    for (let a = Math.ceil(fra / steg) * steg; a <= til; a += steg) merker.push(a);
    return (
        <g>
            <line x1={VENSTRE} x2={VENSTRE + BREDDE} y1={AKSE_Y} y2={AKSE_Y} stroke={GRA} strokeWidth={4} />
            {merker.map((a) => (
                <g key={a}>
                    <line x1={x(a)} x2={x(a)} y1={AKSE_Y - 10} y2={AKSE_Y + 10} stroke={GRA} strokeWidth={3} />
                    <text x={x(a)} y={AKSE_Y + 50} textAnchor="middle" fontSize={30} fontWeight={700} fill={GRA}>
                        {a}
                    </text>
                </g>
            ))}
        </g>
    );
}

/** Et lite sverd, tegnet loddrett med spissen ned. */
function Sverd({ x, y, farge = MORK }: { x: number; y: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-6} y={-70} width={12} height={110} rx={3} fill="#cbd5e1" stroke={farge} strokeWidth={3} />
            <path d="M -6 40 L 0 58 L 6 40 Z" fill="#cbd5e1" stroke={farge} strokeWidth={3} />
            <rect x={-30} y={-78} width={60} height={12} rx={4} fill={farge} />
            <rect x={-6} y={-112} width={12} height={34} rx={4} fill={GULL} />
            <circle cx={0} cy={-118} r={9} fill={GULL} />
        </g>
    );
}

function Kryss({ x, y, synlig }: { x: number; y: number; synlig: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: synlig ? 1 : 0 }} transition={{ duration: 0.4 }}>
            <circle cx={x} cy={y} r={46} fill="#fff" stroke={ROD} strokeWidth={6} />
            <path
                d={`M ${x - 22} ${y - 22} L ${x + 22} ${y + 22} M ${x + 22} ${y - 22} L ${x - 22} ${y + 22}`}
                stroke={ROD}
                strokeWidth={10}
                strokeLinecap="round"
            />
        </motion.g>
    );
}

/** Markør på aksen: loddrett strek med tekst over. */
function Merke({
    x,
    tekst,
    under,
    hoyde = 120,
    farge = MORK,
    synlig,
}: {
    x: number;
    tekst: string;
    under?: string;
    hoyde?: number;
    farge?: string;
    synlig: boolean;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: synlig ? 1 : 0 }} transition={{ duration: 0.6 }}>
            <line x1={x} x2={x} y1={AKSE_Y} y2={AKSE_Y - hoyde} stroke={farge} strokeWidth={4} />
            <circle cx={x} cy={AKSE_Y} r={10} fill={farge} />
            <text
                x={x}
                y={AKSE_Y - hoyde - (under ? 56 : 16)}
                textAnchor="middle"
                fontSize={30}
                fontWeight={900}
                fill={farge}
                stroke="#f6f1e4"
                strokeWidth={6}
                paintOrder="stroke"
            >
                {tekst}
            </text>
            {under && (
                <text
                    x={x}
                    y={AKSE_Y - hoyde - 16}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill={GRA}
                    stroke="#f6f1e4"
                    strokeWidth={6}
                    paintOrder="stroke"
                >
                    {under}
                </text>
            )}
        </motion.g>
    );
}

function Myte({ beat }: { beat: number }) {
    const [fra, til] = OMRADE.myte;
    const x = (a: number) => VENSTRE + ((a - fra) / (til - fra)) * BREDDE;
    const stik = x(1030);
    return (
        <>
            <Tekst x={B / 2} y={110} tekst={beat < 2 ? 'Myten: ett slag i 1030' : 'Sannheten: lang tid'} storrelse={58} />
            <Tekst
                x={B / 2}
                y={170}
                tekst={beat < 2 ? 'Norge ble kristent med ett sverdslag?' : 'kristningen tok antakelig et par hundre år'}
                farge={GRA}
                storrelse={32}
                vekt={700}
            />
            <defs>
                <linearGradient id="kristningen-band" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor={GULL} stopOpacity={0} />
                    <stop offset="0.18" stopColor={GULL} stopOpacity={0.85} />
                    <stop offset="0.82" stopColor={GULL} stopOpacity={0.85} />
                    <stop offset="1" stopColor={GULL} stopOpacity={0} />
                </linearGradient>
            </defs>
            <Akse fra={fra} til={til} steg={50} />

            {/* Båndet: et par hundre år, uten skarpe ender */}
            <motion.rect
                x={x(925)}
                y={AKSE_Y - 70}
                height={56}
                rx={28}
                fill="url(#kristningen-band)"
                initial={{ width: 0 }}
                animate={{ width: beat >= 2 ? x(1125) - x(925) : 0 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
            <Tekst
                x={(x(925) + x(1125)) / 2}
                y={AKSE_Y - 96}
                tekst="et par hundre år"
                farge={GULL}
                storrelse={38}
                synlig={beat >= 2}
            />
            <Tekst
                x={VENSTRE + BREDDE}
                y={AKSE_Y + 110}
                tekst="Skisse: båndet viser ikke nøyaktig start og slutt"
                anker="end"
                farge={GRA}
                storrelse={24}
                vekt={700}
                synlig={beat >= 2}
            />

            {/* Sverdslaget i 1030 */}
            <motion.g
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: beat >= 2 ? -150 : 0 }}
                transition={{ duration: 0.9 }}
            >
                <Sverd x={stik} y={AKSE_Y - 150} />
                <text
                    x={stik + 50}
                    y={AKSE_Y - 200}
                    fontSize={34}
                    fontWeight={900}
                    fill={MORK}
                    stroke="#f6f1e4"
                    strokeWidth={6}
                    paintOrder="stroke"
                >
                    Stiklestad 1030
                </text>
            </motion.g>
            <Kryss x={stik + 130} y={AKSE_Y - (beat >= 2 ? 300 : 150) + 10} synlig={beat >= 1} />

            {/* Begynnelsen: handel */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <Skip x={x(945)} y={AKSE_Y - 150} />
                <text
                    x={x(945)}
                    y={AKSE_Y - 262}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill={BLA}
                    stroke="#f6f1e4"
                    strokeWidth={6}
                    paintOrder="stroke"
                >
                    Først: handel
                </text>
            </motion.g>
        </>
    );
}

/** Lite vikingskip sett fra siden. */
function Skip({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -80 0 Q 0 40 80 0 L 70 -10 Q 0 22 -70 -10 Z" fill="#92400e" />
            <path d="M -80 0 Q -96 -26 -84 -40" fill="none" stroke="#92400e" strokeWidth={8} strokeLinecap="round" />
            <path d="M 80 0 Q 96 -26 84 -40" fill="none" stroke="#92400e" strokeWidth={8} strokeLinecap="round" />
            <line x1={0} x2={0} y1={8} y2={-90} stroke="#78350f" strokeWidth={6} />
            <rect x={-40} y={-84} width={80} height={60} fill="#dc2626" stroke="#7f1d1d" strokeWidth={3} />
            <rect x={-40} y={-64} width={80} height={14} fill="#fef3c7" />
        </g>
    );
}

function Slutt({ beat }: { beat: number }) {
    const [fra, til] = OMRADE.slutt;
    const x = (a: number) => VENSTRE + ((a - fra) / (til - fra)) * BREDDE;
    // Den lille kalenderen for høsten 1066: 1. september til 31. oktober.
    const KAL_V = 400;
    const KAL_B = 800;
    const kal = (dag: number) => KAL_V + (dag / 60) * KAL_B; // dag 0 = 1. september
    const stamford = kal(24);
    const hastings = kal(43);
    const visKalender = beat >= 2;
    return (
        <>
            <Tekst x={B / 2} y={100} tekst="Når slutter vikingtiden?" storrelse={58} />
            <motion.g animate={{ y: visKalender ? -230 : 0 }} transition={{ duration: 1 }}>
                <Akse fra={fra} til={til} steg={50} />
                <motion.rect
                    x={x(800)}
                    y={AKSE_Y - 90}
                    height={70}
                    rx={14}
                    fill={ROD}
                    initial={{ width: 0 }}
                    animate={{ width: x(1050) - x(800) }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
                <Tekst x={(x(800) + x(1050)) / 2} y={AKSE_Y - 40} tekst="Vikingtiden, ca. 800 til 1050" farge="#fff" storrelse={34} halo={false} />
                <motion.rect
                    x={x(1050)}
                    y={AKSE_Y - 80}
                    height={50}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={4}
                    rx={10}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: beat >= 1 ? x(1066) - x(1050) + 8 : 0, opacity: beat >= 1 ? 1 : 0 }}
                    transition={{ duration: 0.8 }}
                />
                <Merke x={x(1066)} tekst="1066: epilog" hoyde={130} farge={ROD} synlig={beat >= 1} />
            </motion.g>

            {/* Høsten 1066 */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: visKalender ? 1 : 0 }} transition={{ duration: 0.8 }}>
                <text x={B / 2} y={520} textAnchor="middle" fontSize={36} fontWeight={900} fill={MORK}>
                    Høsten 1066
                </text>
                <line x1={KAL_V} x2={KAL_V + KAL_B} y1={700} y2={700} stroke={GRA} strokeWidth={4} />
                <text x={kal(0)} y={750} textAnchor="middle" fontSize={26} fontWeight={700} fill={GRA}>
                    september
                </text>
                <text x={kal(45)} y={750} textAnchor="middle" fontSize={26} fontWeight={700} fill={GRA}>
                    oktober
                </text>
                <line x1={kal(30)} x2={kal(30)} y1={690} y2={710} stroke={GRA} strokeWidth={3} />
                <motion.line
                    x1={stamford}
                    x2={hastings}
                    y1={785}
                    y2={785}
                    stroke={MORK}
                    strokeWidth={4}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 4 ? 1 : 0 }}
                />
                <Tekst x={(stamford + hastings) / 2} y={830} tekst="tre uker" storrelse={30} synlig={beat >= 4} />
            </motion.g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: visKalender ? 1 : 0 }} transition={{ duration: 0.8 }}>
                <circle cx={stamford} cy={700} r={12} fill={ROD} />
                <line x1={stamford} x2={stamford} y1={700} y2={600} stroke={ROD} strokeWidth={4} />
                <text x={stamford - 16} y={588} textAnchor="end" fontSize={30} fontWeight={900} fill={ROD}>
                    25. sep: Stamford Bridge
                </text>
                <text x={stamford - 16} y={624} textAnchor="end" fontSize={30} fontWeight={700} fill={GRA}>
                    Harald Hardråde faller
                </text>
            </motion.g>
            <Tekst
                x={stamford - 16}
                y={660}
                tekst="den siste store vikingkongen"
                anker="end"
                farge={ROD}
                storrelse={30}
                synlig={beat >= 3}
            />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 4 ? 1 : 0 }} transition={{ duration: 0.8 }}>
                <circle cx={hastings} cy={700} r={12} fill={BLA} />
                <line x1={hastings} x2={hastings} y1={700} y2={600} stroke={BLA} strokeWidth={4} />
                <text x={hastings + 16} y={588} fontSize={30} fontWeight={900} fill={BLA}>
                    14. okt: Hastings
                </text>
                <text x={hastings + 16} y={624} fontSize={30} fontWeight={700} fill={GRA}>
                    Vilhelm av Normandie vinner
                </text>
            </motion.g>
            <Tekst
                x={hastings + 16}
                y={660}
                tekst="fransk ridderkultur"
                anker="start"
                farge={BLA}
                storrelse={30}
                synlig={beat >= 5}
            />
        </>
    );
}

function Trell({ beat }: { beat: number }) {
    const [fra, til] = OMRADE.trell;
    const x = (a: number) => VENSTRE + ((a - fra) / (til - fra)) * BREDDE;
    const topp = 260;
    const bunn = AKSE_Y - 20;
    const midt = (topp + bunn) / 2;
    // Treller: tykt bånd som smalner av og er borte ved 1274. Leilendinger vokser fram.
    const trellBand = `M ${x(1000)} ${topp} L ${x(1080)} ${topp} C ${x(1150)} ${topp} ${x(1190)} ${midt - 40} ${x(1200)} ${midt - 20} C ${x(1230)} ${midt} ${x(1260)} ${midt - 4} ${x(1274)} ${midt} L ${x(1000)} ${midt} Z`;
    const leilendingBand = `M ${x(1000)} ${midt + 10} L ${x(1000)} ${bunn - 70} C ${x(1100)} ${bunn - 70} ${x(1150)} ${bunn - 170} ${x(1200)} ${midt + 40} C ${x(1240)} ${midt + 10} ${x(1270)} ${midt + 10} ${x(1300)} ${midt + 10} Z`;
    return (
        <>
            <Tekst x={B / 2} y={100} tekst="Trelldommen forsvinner" storrelse={58} />
            <Tekst x={B / 2} y={160} tekst="en trell var en slave" farge={GRA} storrelse={32} vekt={700} />
            <Akse fra={fra} til={til} steg={50} />
            <motion.path
                d={trellBand}
                fill={ROD}
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 0 ? 0.85 : 0 }}
                transition={{ duration: 0.8 }}
            />
            <Tekst x={x(1010)} y={midt - 20} tekst="treller" farge="#fff" storrelse={40} anker="start" halo={false} />
            <motion.path
                d={leilendingBand}
                fill={GRONN}
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 0.85 : 0 }}
                transition={{ duration: 1 }}
            />
            <Tekst
                x={x(1010)}
                y={midt + 75}
                tekst="leilendinger: leide jorda"
                farge="#fff"
                storrelse={32}
                anker="start"
                halo={false}
                synlig={beat >= 3}
            />

            {/* Grunnene */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 1 ? 1 : 0 }} transition={{ duration: 0.6 }}>
                <rect x={x(1100) - 210} y={210} width={420} height={70} rx={16} fill="#fff" stroke={GULL} strokeWidth={4} />
                <path d={`M ${x(1100) - 175} 225 v 40 M ${x(1100) - 190} 238 h 30`} stroke={GULL} strokeWidth={7} strokeLinecap="round" />
                <text x={x(1100) - 140} y={256} fontSize={28} fontWeight={900} fill={MORK}>
                    Kirken: sett dem fri
                </text>
            </motion.g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0 }} transition={{ duration: 0.6 }}>
                <rect x={x(1100) - 210} y={292} width={420} height={70} rx={16} fill="#fff" stroke={GULL} strokeWidth={4} />
                <circle cx={x(1100) - 175} cy={327} r={16} fill="#facc15" stroke={GULL} strokeWidth={3} />
                <text x={x(1100) - 140} y={338} fontSize={28} fontWeight={900} fill={MORK}>
                    Dyrt å holde treller
                </text>
            </motion.g>

            <Merke x={x(1185)} tekst="slutten av 1100-tallet" under="på vei ut" hoyde={70} farge={MORK} synlig={beat >= 4} />
            <Merke x={x(1274)} tekst="1274: landsloven" under="ikke lenger en egen gruppe" hoyde={260} farge={ROD} synlig={beat >= 4} />
            <Tekst
                x={VENSTRE}
                y={AKSE_Y + 110}
                tekst="Skisse: bare årstallene er ekte"
                anker="start"
                farge={GRA}
                storrelse={24}
                vekt={700}
            />
        </>
    );
}

export function KristningenTidslinje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'myte';
    return (
        <div className="absolute inset-0 bg-[#f6f1e4]">
            <svg
                viewBox={`0 0 ${B} 900`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'myte' && <Myte beat={beat} />}
                {modus === 'slutt' && <Slutt beat={beat} />}
                {modus === 'trell' && <Trell beat={beat} />}
            </svg>
        </div>
    );
}
