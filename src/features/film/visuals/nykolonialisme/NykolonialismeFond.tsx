import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Kan et land slippe unna? To land med samme olje i bakken, side om side.
 * Venstre: olje og mineraler ser ut til å ofte gi dårlig styring (ressursforbannelsen, ifølge
 *   forskerne). På siste beat står et eget motbilde der i stedet: en bananrepublikk,
 *   og til slutt bananrepublikken, der et fremmed selskap har makten.
 * Høyre: Norge, der staten beholdt kontrollen og la pengene i oljefondet.
 */

const B = 1600;
const H = 900;
const VX = 420;
const HX = 1060;
const FX = 1410;
const BAKKE = 640;
const ROD = '#b91c1c';
const GRONN = '#15803d';

const BRIKKER: { tekst: string; rod?: boolean }[] = [
    { tekst: 'Kan et land slippe unna?' },
    { tekst: 'Ressursforbannelsen?', rod: true },
    { tekst: 'Norge: staten beholdt kontrollen' },
    { tekst: 'Oljefondet' },
    { tekst: 'Nesten det motsatte av en bananrepublikk' },
];

export function NykolonialismeFond({ beat }: VisualProps) {
    const brikke = BRIKKER[Math.min(beat, BRIKKER.length - 1)];
    const bananrepublikk = beat >= 4;
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#eef2f6]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Bakken med olje, lik på begge sider */}
                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#a78b6d" />
                <rect x={0} y={BAKKE} width={B} height={18} fill="#7c6247" />
                <line
                    x1={B / 2}
                    y1={150}
                    x2={B / 2}
                    y2={H}
                    stroke="#94a3b8"
                    strokeWidth={4}
                    strokeDasharray="14 14"
                />
                {/* På siste beat er venstre side en bananrepublikk, ikke et oljeland. */}
                {(bananrepublikk ? [HX] : [VX, HX]).map((x) => (
                    <g key={x}>
                        <ellipse cx={x} cy={790} rx={170} ry={52} fill="#111827" />
                        <text
                            x={x}
                            y={800}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#f8fafc"
                        >
                            olje
                        </text>
                        <Boretarn x={x} />
                    </g>
                ))}

                {/* Titlene over hver side */}
                <Overskrift
                    x={VX}
                    tekst={bananrepublikk ? 'En bananrepublikk' : 'Land med olje og mineraler'}
                    farge={bananrepublikk ? '#a16207' : '#334155'}
                />
                <Overskrift x={1180} tekst="Norge" farge={GRONN} />

                {/* Venstre side */}
                <motion.g animate={{ opacity: beat === 2 || beat === 3 ? 0.35 : 1 }}>
                    {beat >= 1 && beat <= 3 && (
                        <>
                            <Ror x={VX} tilY={460} farge={ROD} />
                            <Kort
                                key="forbannelse"
                                x={VX}
                                y={330}
                                bredde={600}
                                linjer={['Forskere: det ser ut til', 'å gi dårlig styring']}
                                farge={ROD}
                            />
                        </>
                    )}
                    {bananrepublikk && (
                        <>
                            <Ror x={VX} tilY={460} farge="#a16207" />
                            <Selskap x={VX} />
                            <Plantasje x={VX} />
                        </>
                    )}
                </motion.g>

                {/* Høyre side: Norge */}
                <motion.g animate={{ opacity: beat === 1 ? 0.35 : 1 }}>
                    {beat >= 2 && (
                        <>
                            <Ror x={HX} tilY={460} farge={GRONN} />
                            <Staten />
                        </>
                    )}
                    {beat >= 3 && <Fond />}
                    {beat >= 3 && (
                        <Kort
                            key="storst"
                            x={FX}
                            y={545}
                            bredde={330}
                            storrelse={34}
                            linjer={['verdens største', 'statlige fond', 'siden 2012']}
                            farge={GRONN}
                        />
                    )}
                </motion.g>
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute inset-x-0 top-[3%] flex justify-center pointer-events-none"
                >
                    <div
                        className={`px-6 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap ${
                            brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                        }`}
                    >
                        {brikke.tekst}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Overskrift({ x, tekst, farge }: { x: number; tekst: string; farge: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                x={x}
                y={205}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={farge}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

/** Et enkelt boretårn som står på bakken. */
function Boretarn({ x }: { x: number }) {
    return (
        <g>
            <path
                d={`M ${x - 50} ${BAKKE} L ${x - 12} ${BAKKE - 100} L ${x + 12} ${BAKKE - 100} L ${x + 50} ${BAKKE} Z`}
                fill="none"
                stroke="#334155"
                strokeWidth={8}
                strokeLinejoin="round"
            />
            <line
                x1={x - 32}
                y1={BAKKE - 45}
                x2={x + 32}
                y2={BAKKE - 45}
                stroke="#334155"
                strokeWidth={6}
            />
            <line x1={x} y1={BAKKE} x2={x} y2={760} stroke="#334155" strokeWidth={6} />
        </g>
    );
}

/** Røret der olja og pengene går opp. */
function Ror({ x, tilY, farge }: { x: number; tilY: number; farge: string }) {
    return (
        <g>
            <motion.path
                d={`M ${x} ${BAKKE - 110} L ${x} ${tilY + 20}`}
                stroke={farge}
                strokeWidth={14}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
            />
            <motion.path
                d={`M ${x - 26} ${tilY + 34} L ${x} ${tilY} L ${x + 26} ${tilY + 34} Z`}
                fill={farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
            />
        </g>
    );
}

function Kort({
    x,
    y,
    bredde,
    linjer,
    farge,
    storrelse = 38,
}: {
    x: number;
    y: number;
    bredde: number;
    linjer: string[];
    farge: string;
    storrelse?: number;
}) {
    const hoyde = 30 + linjer.length * 52;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
        >
            <rect
                x={x - bredde / 2}
                y={y}
                width={bredde}
                height={hoyde}
                rx={22}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={6}
            />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x}
                    y={y + 62 + i * 52}
                    textAnchor="middle"
                    fontSize={storrelse}
                    fontWeight={900}
                    fill={farge}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

/** Staten: et hus med søyler, med pil bort til oljefondet når det kommer. */
function Staten() {
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
        >
            <path d={`M ${HX - 130} 310 L ${HX} 250 L ${HX + 130} 310 Z`} fill={GRONN} />
            {[-95, -48, 0, 48, 95].map((dx) => (
                <rect key={dx} x={HX + dx - 11} y={318} width={22} height={78} fill={GRONN} />
            ))}
            <rect x={HX - 140} y={398} width={280} height={52} rx={6} fill={GRONN} />
            <text x={HX} y={437} textAnchor="middle" fontSize={38} fontWeight={900} fill="#ffffff">
                staten
            </text>
        </motion.g>
    );
}

/** Oljefondet: en myntstabel som vokser, med pil fra staten. */
function Fond() {
    const bunn = 430;
    return (
        <g>
            <motion.path
                d={`M ${HX + 150} 350 L ${FX - 110} 350`}
                stroke={GRONN}
                strokeWidth={12}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
            />
            <path d={`M ${FX - 118} 326 L ${FX - 90} 350 L ${FX - 118} 374 Z`} fill={GRONN} />
            {Array.from({ length: 7 }, (_, i) => (
                <motion.ellipse
                    key={i}
                    cx={FX}
                    cy={bunn - i * 22}
                    rx={78}
                    ry={20}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.18 }}
                />
            ))}
            <text
                x={FX}
                y={bunn + 70}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#713f12"
                stroke="#eef2f6"
                strokeWidth={8}
                paintOrder="stroke"
            >
                oljefondet
            </text>
        </g>
    );
}

/** Et fremmed selskap som tar inntektene. */
function Selskap({ x }: { x: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 180, damping: 15 }}
            style={{ transformOrigin: `${x}px 380px` }}
        >
            <rect
                x={x - 260}
                y={250}
                width={520}
                height={200}
                rx={24}
                fill="#facc15"
                stroke="#854d0e"
                strokeWidth={6}
            />
            <text x={x} y={330} textAnchor="middle" fontSize={44} fontWeight={900} fill="#713f12">
                Fremmed selskap
            </text>
            <text x={x} y={398} textAnchor="middle" fontSize={38} fontWeight={800} fill="#713f12">
                har makten
            </text>
        </motion.g>
    );
}

/** Plantasjen i bananrepublikken: frukt i stedet for olje i bakken. */
function Plantasje({ x }: { x: number }) {
    return (
        <g>
            {[-120, -60, 0, 60, 120].map((dx, i) => (
                <motion.g
                    key={dx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                >
                    <rect x={x + dx - 6} y={560} width={12} height={80} fill="#78350f" />
                    <ellipse cx={x + dx} cy={555} rx={34} ry={20} fill="#15803d" />
                </motion.g>
            ))}
            <text x={x} y={790} textAnchor="middle" fontSize={34} fontWeight={900} fill="#f8fafc">
                plantasjer
            </text>
        </g>
    );
}
