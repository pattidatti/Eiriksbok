import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tid og navn i Vestromerrikets fall (SVG 1600x900).
 * - hundre: nesten hundre år, svakheter innenfra og angrep utenfra, så hendelsene steg for steg
 * - keiser: 476, pennestrøket, den siste keiseren og Odovakar
 * - navn: Romulus + Augustus i navnet til den siste keiseren
 * - ost: Vestromerriket slutter i 476, Østromerriket lever til 1453
 */

type Modus = 'hundre' | 'keiser' | 'navn' | 'ost';
type Pkt = [number, number];

const B = 1600;
const H = 900;
const ROD = '#b91c1c';
const BLEKK = '#3f2e12';
const GULL = '#b45309';
const OST = '#6d28d9';

const TITLER: Record<Modus, string[]> = {
    hundre: ['Rundt hundre år', 'Innenfra', 'Utenfra', 'Hvordan det skjedde, steg for steg'],
    keiser: ['Et pennestrøk', 'År 476', 'Bare et barn', 'En pensjon i Sør-Italia'],
    navn: [
        'Navnet til den siste keiseren',
        'Romulus',
        'Augustus',
        'Sirkelen er sluttet',
        'Ingen ny keiser i vest',
    ],
    ost: [
        'Falt hele Romerriket?',
        'Østromerriket levde videre',
        'År 1453',
        'Slutten av middelalderen',
    ],
};

export function VestromTid({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'hundre';
    const titler = TITLER[modus];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f6efe0' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'hundre' && <Hundre beat={beat} />}
                {modus === 'keiser' && <Keiser beat={beat} />}
                {modus === 'navn' && <Navn beat={beat} />}
                {modus === 'ost' && <Ost beat={beat} />}
            </svg>
            <Topp tekst={titler[Math.min(beat, titler.length - 1)]} />
        </div>
    );
}

function Topp({ tekst }: { tekst: string }) {
    return (
        <div className="absolute top-[5%] inset-x-0 flex justify-center pointer-events-none z-10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-2 rounded-2xl font-display font-bold text-4xl shadow-xl whitespace-nowrap bg-white text-slate-900"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Tekst({
    pos,
    tekst,
    farge = BLEKK,
    storrelse = 40,
    anker = 'middle',
    forsinkelse = 0,
    vekt = 900,
}: {
    pos: Pkt;
    tekst: string;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
    forsinkelse?: number;
    vekt?: number;
}) {
    return (
        <motion.text
            x={pos[0]}
            y={pos[1]}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Et kort med tekst, der bredden følger teksten. */
function Kort({
    midt,
    linjer,
    farge,
    forsinkelse = 0,
    fyll = '#ffffff',
}: {
    midt: Pkt;
    linjer: { tekst: string; storrelse: number; farge?: string }[];
    farge: string;
    forsinkelse?: number;
    fyll?: string;
}) {
    const bredde = Math.max(...linjer.map((l) => l.tekst.length * l.storrelse * 0.56)) + 70;
    const hoyde = linjer.reduce((s, l) => s + l.storrelse * 1.25, 0) + 40;
    const topp = midt[1] - hoyde / 2 + 20;
    const bunner = linjer.map(
        (_, i) => topp + linjer.slice(0, i + 1).reduce((s, l) => s + l.storrelse * 1.25, 0)
    );
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            <rect
                x={midt[0] - bredde / 2}
                y={midt[1] - hoyde / 2}
                width={bredde}
                height={hoyde}
                rx={22}
                fill={fyll}
                stroke={farge}
                strokeWidth={5}
            />
            {linjer.map((l, i) => {
                return (
                    <text
                        key={i}
                        x={midt[0]}
                        y={bunner[i] - l.storrelse * 0.3}
                        textAnchor="middle"
                        fontSize={l.storrelse}
                        fontWeight={900}
                        fill={l.farge ?? farge}
                    >
                        {l.tekst}
                    </text>
                );
            })}
        </motion.g>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bredde = 9,
}: {
    fra: Pkt;
    til: Pkt;
    farge: string;
    forsinkelse?: number;
    bredde?: number;
}) {
    const vinkel = Math.atan2(til[1] - fra[1], til[0] - fra[0]);
    const s = bredde * 2.6;
    const hode = [
        [til[0] + Math.cos(vinkel) * s * 0.5, til[1] + Math.sin(vinkel) * s * 0.5],
        [til[0] + Math.cos(vinkel + 2.4) * s, til[1] + Math.sin(vinkel + 2.4) * s],
        [til[0] + Math.cos(vinkel - 2.4) * s, til[1] + Math.sin(vinkel - 2.4) * s],
    ]
        .map((q) => q.join(','))
        .join(' ');
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} L ${til[0]} ${til[1]}`}
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: forsinkelse, duration: 0.8 }}
            />
            <motion.polygon
                points={hode}
                fill={farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 0.7, duration: 0.3 }}
            />
        </g>
    );
}

// ----- hundre -----

const aarX = (aar: number) => 160 + ((aar - 360) / 130) * 1280;

function Hundre({ beat }: { beat: number }) {
    const y = 480;
    const x0 = aarX(370);
    const x1 = aarX(476);
    const HENDELSER: { aar: number; tekst: string; over: boolean }[] = [
        { aar: 410, tekst: 'Roma plyndres', over: true },
        { aar: 451, tekst: 'Attila stanses', over: false },
        { aar: 455, tekst: 'Vandalene i Roma', over: true },
        { aar: 476, tekst: 'Siste keiser', over: false },
    ];
    const SPREKKER = [520, 760, 980, 1180];
    return (
        <g>
            <line x1={120} x2={1480} y1={y} y2={y} stroke="#a8925f" strokeWidth={4} />
            <motion.rect
                x={x0}
                y={y - 40}
                height={80}
                rx={16}
                fill={GULL}
                initial={{ width: 0 }}
                animate={{ width: x1 - x0 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
            <Tekst pos={[x0, y + 110]} tekst="ca. 370" storrelse={38} />
            {beat < 3 && <Tekst pos={[x1, y + 110]} tekst="476" storrelse={38} forsinkelse={1.4} />}
            {beat === 0 && (
                <g>
                    <motion.path
                        d={`M ${x0} ${y - 80} Q ${x0} ${y - 120} ${x0 + 40} ${y - 120} L ${(x0 + x1) / 2 - 30} ${y - 120} L ${(x0 + x1) / 2} ${y - 150} L ${(x0 + x1) / 2 + 30} ${y - 120} L ${x1 - 40} ${y - 120} Q ${x1} ${y - 120} ${x1} ${y - 80}`}
                        fill="none"
                        stroke={BLEKK}
                        strokeWidth={6}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.6, duration: 1 }}
                    />
                    <Tekst
                        pos={[(x0 + x1) / 2, y - 180]}
                        tekst="rundt hundre år"
                        storrelse={54}
                        forsinkelse={2.2}
                    />
                </g>
            )}
            {beat >= 1 &&
                beat <= 2 &&
                SPREKKER.map((x, i) => (
                    <motion.path
                        key={x}
                        d={`M ${x} ${y - 40} L ${x + 18} ${y - 14} L ${x - 10} ${y + 6} L ${x + 14} ${y + 40}`}
                        fill="none"
                        stroke="#450a0a"
                        strokeWidth={7}
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.3 + i * 0.4, duration: 0.6 }}
                    />
                ))}
            {beat >= 1 && beat <= 2 && (
                <>
                    <Kort
                        midt={[620, 300]}
                        linjer={[{ tekst: 'Dårlig økonomi', storrelse: 44 }]}
                        farge={ROD}
                        forsinkelse={0.5}
                    />
                    <Kort
                        midt={[1060, 300]}
                        linjer={[{ tekst: 'Korrupsjon', storrelse: 44 }]}
                        farge={ROD}
                        forsinkelse={1.2}
                    />
                </>
            )}
            {beat === 2 &&
                [460, 700, 940, 1180].map((x, i) => (
                    <Pil
                        key={x}
                        fra={[x - 60, 790]}
                        til={[x, y + 60]}
                        farge="#1d4ed8"
                        forsinkelse={i * 0.35}
                        bredde={12}
                    />
                ))}
            {beat === 2 && (
                <Tekst
                    pos={[300, 820]}
                    tekst="Invasjoner"
                    farge="#1d4ed8"
                    storrelse={48}
                    forsinkelse={0.4}
                />
            )}
            {beat >= 3 &&
                HENDELSER.map((h, i) => {
                    const x = aarX(h.aar);
                    const ty = h.over ? y - 150 : y + 200;
                    return (
                        <motion.g
                            key={h.aar}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.6, duration: 0.5 }}
                        >
                            <line
                                x1={x}
                                x2={x}
                                y1={y}
                                y2={h.over ? ty + 14 : ty - 52}
                                stroke={BLEKK}
                                strokeWidth={4}
                            />
                            <circle
                                cx={x}
                                cy={y}
                                r={14}
                                fill="#ffffff"
                                stroke={BLEKK}
                                strokeWidth={5}
                            />
                            <text
                                x={x}
                                y={ty - (h.over ? 44 : 0)}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill={ROD}
                            >
                                {h.aar}
                            </text>
                            <text
                                x={x}
                                y={ty + (h.over ? 0 : 46)}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill={BLEKK}
                            >
                                {h.tekst}
                            </text>
                        </motion.g>
                    );
                })}
        </g>
    );
}

// ----- keiser -----

function Krone({
    x,
    y,
    s = 1,
    farge = '#ca8a04',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    const d = `M ${x - 50 * s} ${y + 30 * s} L ${x - 50 * s} ${y - 20 * s} L ${x - 25 * s} ${y + 5 * s} L ${x} ${y - 35 * s} L ${x + 25 * s} ${y + 5 * s} L ${x + 50 * s} ${y - 20 * s} L ${x + 50 * s} ${y + 30 * s} Z`;
    return <path d={d} fill={farge} stroke="#78350f" strokeWidth={4 * s} strokeLinejoin="round" />;
}

function Keiser({ beat }: { beat: number }) {
    return (
        <g>
            {/* Pergamentet */}
            <rect
                x={380}
                y={150}
                width={840}
                height={240}
                rx={18}
                fill="#fdf6e3"
                stroke="#a8925f"
                strokeWidth={5}
            />
            <Krone x={800} y={215} s={0.8} />
            <text
                x={800}
                y={315}
                textAnchor="middle"
                fontSize={64}
                fontWeight={900}
                fill={BLEKK}
                fontFamily="Georgia, serif"
            >
                Keiser i vest
            </text>
            <motion.path
                d="M 450 365 C 600 345, 900 375, 1150 340"
                fill="none"
                stroke={ROD}
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 1.1, ease: 'easeOut' }}
            />
            {beat >= 1 && (
                <>
                    <Kort
                        midt={[470, 560]}
                        linjer={[
                            { tekst: 'Romulus Augustulus', storrelse: 44 },
                            { tekst: 'avsatt i 476', storrelse: 34, farge: ROD },
                        ]}
                        farge={BLEKK}
                    />
                    <Kort
                        midt={[1150, 560]}
                        linjer={[
                            { tekst: 'Odovakar', storrelse: 48 },
                            { tekst: 'germaner, tar makten', storrelse: 34, farge: '#1d4ed8' },
                        ]}
                        farge="#1d4ed8"
                        forsinkelse={0.8}
                    />
                    <Pil fra={[760, 560]} til={[880, 560]} farge="#1d4ed8" forsinkelse={1.2} />
                </>
            )}
            {beat >= 2 && (
                <Kort
                    midt={[470, 730]}
                    linjer={[{ tekst: 'Bare et barn. Spart.', storrelse: 40, farge: '#0f766e' }]}
                    farge="#0f766e"
                    fyll="#ecfdf5"
                />
            )}
            {beat >= 3 && (
                <>
                    <Pil fra={[700, 740]} til={[880, 740]} farge="#0f766e" />
                    <Kort
                        midt={[1150, 740]}
                        linjer={[
                            { tekst: 'Pensjon', storrelse: 44 },
                            { tekst: 'til slektninger i Campania', storrelse: 30, farge: BLEKK },
                        ]}
                        farge="#0f766e"
                        forsinkelse={0.6}
                    />
                </>
            )}
        </g>
    );
}

// ----- navn -----

function Navn({ beat }: { beat: number }) {
    const y = 520;
    const romulusFarge = beat >= 1 && beat <= 3 ? GULL : BLEKK;
    const augustFarge = beat >= 2 && beat <= 3 ? GULL : BLEKK;
    const grå = beat >= 4;
    return (
        <g>
            <motion.g
                initial={false}
                animate={{ opacity: grå ? 0.3 : 1 }}
                transition={{ duration: 0.8 }}
            >
                <text
                    x={720}
                    y={y}
                    textAnchor="end"
                    fontSize={90}
                    fontWeight={900}
                    fill={romulusFarge}
                    fontFamily="Georgia, serif"
                >
                    ROMULUS
                </text>
                <text
                    x={760}
                    y={y}
                    textAnchor="start"
                    fontSize={90}
                    fontWeight={900}
                    fontFamily="Georgia, serif"
                >
                    <tspan fill={augustFarge}>AUGUST</tspan>
                    <tspan fill={BLEKK}>ULUS</tspan>
                </text>
            </motion.g>
            {beat >= 1 && beat <= 3 && (
                <>
                    {beat < 3 && <Pil fra={[480, 430]} til={[420, 330]} farge={GULL} />}
                    <Kort
                        midt={[360, 250]}
                        linjer={[
                            { tekst: 'Romulus', storrelse: 46 },
                            { tekst: 'grunnla Roma, ifølge sagnet', storrelse: 32, farge: BLEKK },
                        ]}
                        farge={GULL}
                        forsinkelse={0.4}
                    />
                </>
            )}
            {beat >= 2 && beat <= 3 && (
                <>
                    {beat < 3 && <Pil fra={[960, 430]} til={[1100, 330]} farge={GULL} />}
                    <Kort
                        midt={[1220, 250]}
                        linjer={[
                            { tekst: 'Augustus', storrelse: 46 },
                            { tekst: 'grunnla keiserdømmet', storrelse: 32, farge: BLEKK },
                        ]}
                        farge={GULL}
                        forsinkelse={0.4}
                    />
                </>
            )}
            {beat === 3 && (
                <motion.ellipse
                    cx={790}
                    cy={y - 30}
                    rx={700}
                    ry={135}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={8}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
            )}
            {beat === 3 && (
                <Tekst
                    pos={[800, 760]}
                    tekst="Den første og den siste i ett navn"
                    storrelse={46}
                    farge={ROD}
                    forsinkelse={1.2}
                />
            )}
            {beat >= 4 && (
                <>
                    <Krone x={800} y={230} s={1.1} farge="#94a3b8" />
                    <Kort
                        midt={[800, 690]}
                        linjer={[
                            { tekst: 'Odovakar kaller seg konge', storrelse: 44, farge: '#1d4ed8' },
                            {
                                tekst: 'Vestromerriket finnes ikke lenger',
                                storrelse: 44,
                                farge: ROD,
                            },
                        ]}
                        farge={BLEKK}
                        forsinkelse={0.4}
                    />
                </>
            )}
        </g>
    );
}

// ----- ost -----

const tidX = (aar: number) => 560 + ((aar - 200) / 1300) * 920;

function Ost({ beat }: { beat: number }) {
    const yV = 360;
    const yO = 560;
    const x476 = tidX(476);
    const x1453 = tidX(1453);
    return (
        <g>
            <defs>
                <linearGradient id="vestrom-tone-v" x1="0" x2="1">
                    <stop offset="0" stopColor={GULL} stopOpacity={0} />
                    <stop offset="0.6" stopColor={GULL} stopOpacity={1} />
                </linearGradient>
                <linearGradient id="vestrom-tone-o" x1="0" x2="1">
                    <stop offset="0" stopColor={OST} stopOpacity={0} />
                    <stop offset="0.08" stopColor={OST} stopOpacity={1} />
                </linearGradient>
            </defs>
            <Tekst
                pos={[530, yV + 15]}
                tekst="Vestromerriket"
                anker="end"
                farge={GULL}
                storrelse={44}
            />
            <rect
                x={540}
                y={yV - 36}
                width={x476 - 540}
                height={72}
                rx={14}
                fill="url(#vestrom-tone-v)"
            />
            <line
                x1={x476}
                x2={x476}
                y1={yV - 60}
                y2={yO + 60}
                stroke={ROD}
                strokeWidth={6}
                strokeDasharray="12 10"
            />
            <Tekst pos={[x476, yV + 95]} tekst="476" farge={ROD} storrelse={44} />

            <Tekst
                pos={[530, yO + 2]}
                tekst="Østromerriket"
                anker="end"
                farge={OST}
                storrelse={44}
            />
            <Tekst
                pos={[530, yO + 46]}
                tekst="også kalt Bysants"
                anker="end"
                farge={OST}
                storrelse={30}
                vekt={700}
            />
            <motion.rect
                x={540}
                y={yO - 36}
                height={72}
                rx={14}
                fill="url(#vestrom-tone-o)"
                initial={{ width: x476 - 540 }}
                animate={{ width: (beat >= 1 ? x1453 : x476) - 540 }}
                transition={{ duration: 2.4, ease: 'easeInOut' }}
            />
            {beat === 0 && (
                <Tekst
                    pos={[x476 + 70, yO + 18]}
                    tekst="?"
                    farge={OST}
                    storrelse={72}
                    forsinkelse={0.6}
                />
            )}
            {beat >= 1 && (
                <g>
                    <motion.path
                        d={`M ${x476 + 20} ${yO + 70} L ${x476 + 20} ${yO + 100} L ${x1453 - 20} ${yO + 100} L ${x1453 - 20} ${yO + 70}`}
                        fill="none"
                        stroke={OST}
                        strokeWidth={6}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.6, duration: 1 }}
                    />
                    <Tekst
                        pos={[(x476 + x1453) / 2, yO + 160]}
                        tekst="nesten 1000 år til"
                        farge={OST}
                        storrelse={48}
                        forsinkelse={2.2}
                    />
                </g>
            )}
            {beat >= 2 && (
                <>
                    <circle cx={x1453} cy={yO} r={20} fill="#ffffff" stroke={ROD} strokeWidth={7} />
                    <Kort
                        midt={[x1453 - 230, yV - 10]}
                        linjer={[
                            { tekst: '1453', storrelse: 50, farge: ROD },
                            { tekst: 'tyrkerne tar Konstantinopel', storrelse: 32, farge: BLEKK },
                        ]}
                        farge={ROD}
                        forsinkelse={0.4}
                    />
                    <Pil
                        fra={[x1453 - 60, yV + 70]}
                        til={[x1453 - 8, yO - 40]}
                        farge={ROD}
                        forsinkelse={0.8}
                        bredde={7}
                    />
                </>
            )}
            {beat >= 3 && (
                <Kort
                    midt={[800, 820]}
                    linjer={[
                        {
                            tekst: 'Romerriket falt på en måte først på slutten av middelalderen',
                            storrelse: 36,
                        },
                    ]}
                    farge={BLEKK}
                    fyll="#fdf6e3"
                />
            )}
        </g>
    );
}
