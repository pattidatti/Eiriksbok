import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvalolja. «verdi»: fra spekket under huden, via gryta, til lampe og margarin, og så
 * hva det betydde for Sandefjord. «kollaps»: fatene hoper seg opp i rekordsesongen,
 * det blir for mye å selge, og landene lager regler (Genève 1931, IWC 1946).
 * Fatene er et bilde, ikke en målestokk: ingen tall står på dem.
 */

const B = 1600;
const H = 900;

const HVAL =
    'M 0 60 C 30 20 160 0 380 8 C 600 18 760 44 860 58 L 930 22 C 950 12 975 10 990 14 C 975 40 955 58 935 66 C 955 76 978 96 990 118 C 974 120 950 112 930 100 L 860 76 C 700 100 460 116 300 108 C 140 100 30 92 0 60 Z';

type Modus = 'verdi' | 'kollaps';

function Fat({ x, y, farge = '#b45309' }: { x: number; y: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-34} y={-46} width={68} height={92} rx={14} fill={farge} />
            <rect x={-34} y={-26} width={68} height={8} fill="#78350f" />
            <rect x={-34} y={18} width={68} height={8} fill="#78350f" />
        </g>
    );
}

function Merkelapp({ tekst }: { tekst: string }) {
    return (
        <motion.div
            key={tekst}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
        >
            {tekst}
        </motion.div>
    );
}

function Inn({
    vis,
    children,
    forsinkelse = 0,
}: {
    vis: boolean;
    children: React.ReactNode;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.7, delay: vis ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

function Verdi({ beat }: { beat: number }) {
    // Kjeden spekk -> gryte -> fat -> lampe/margarin ligger i nedre halvdel.
    // Beat 3-4 skifter til byen Sandefjord.
    const by = beat >= 3;
    return (
        <>
            <Inn vis={!by}>
                {/* Hele hvalen, med en strek der snittet tas */}
                <Inn vis={beat === 0}>
                    <g transform="translate(90 250) scale(0.62)">
                        <path d={HVAL} fill="#334155" />
                        <line
                            x1={420}
                            y1={-20}
                            x2={420}
                            y2={140}
                            stroke="#dc2626"
                            strokeWidth={8}
                            strokeDasharray="16 10"
                        />
                    </g>
                    <text
                        x={350}
                        y={380}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#475569"
                    >
                        snitt gjennom hvalen
                    </text>
                </Inn>
                {/* Snittet: mørk hud, tykt gult spekk, rødt kjøtt */}
                <motion.g
                    initial={false}
                    animate={{
                        x: beat === 0 ? 1080 : 260,
                        y: beat === 0 ? 360 : 560,
                        scale: beat === 0 ? 1 : 0.45,
                    }}
                    transition={{ duration: 1 }}
                >
                    <circle r={190} fill="#334155" />
                    <circle r={172} fill="#fbbf24" />
                    <circle r={100} fill="#b91c1c" />
                </motion.g>
                <Inn vis={beat === 0} forsinkelse={0.8}>
                    <line x1={1080} y1={500} x2={1080} y2={600} stroke="#0f172a" strokeWidth={5} />
                    <text
                        x={1080}
                        y={650}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#b45309"
                    >
                        spekket
                    </text>
                    <text
                        x={1080}
                        y={700}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#475569"
                    >
                        det tykke fettlaget under huden
                    </text>
                </Inn>
                <Inn vis={beat >= 1}>
                    <text x={420} y={580} fontSize={70} fontWeight={900} fill="#94a3b8">
                        →
                    </text>
                    <text
                        x={260}
                        y={690}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#b45309"
                    >
                        spekk
                    </text>
                </Inn>
            </Inn>

            {/* Beat 1: gryte, fat og lampe */}
            <Inn vis={beat >= 1 && !by}>
                <g transform="translate(760 560)">
                    <path d="M -110 -60 L 110 -60 L 90 70 L -90 70 Z" fill="#1f2937" />
                    <rect x={-124} y={-74} width={248} height={18} rx={6} fill="#374151" />
                    {[-50, 0, 50].map((x, i) => (
                        <motion.circle
                            key={x}
                            cx={x}
                            r={18}
                            fill="#cbd5e1"
                            initial={{ cy: -90, opacity: 0.8 }}
                            animate={{ cy: -190, opacity: 0 }}
                            transition={{ duration: 2.4, delay: i * 0.6, repeat: 2 }}
                        />
                    ))}
                    <text y={130} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                        kokt
                    </text>
                </g>
                <text x={890} y={570} fontSize={70} fontWeight={900} fill="#94a3b8">
                    →
                </text>
                <Fat x={1040} y={570} />
                <text
                    x={1040}
                    y={690}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#b45309"
                >
                    hvalolje
                </text>
            </Inn>
            <Inn vis={beat === 1} forsinkelse={1.2}>
                <text x={1110} y={570} fontSize={70} fontWeight={900} fill="#94a3b8">
                    →
                </text>
                <g transform="translate(1340 600)">
                    <motion.ellipse
                        cx={0}
                        cy={-150}
                        rx={60}
                        ry={80}
                        fill="#fde68a"
                        animate={{ opacity: [0.4, 0.9, 0.6] }}
                        transition={{ duration: 1.5, delay: 1.6 }}
                    />
                    <path
                        d="M -12 -120 C -24 -150 0 -190 0 -190 C 0 -190 24 -150 12 -120 Z"
                        fill="#f59e0b"
                    />
                    <rect
                        x={-40}
                        y={-120}
                        width={80}
                        height={60}
                        rx={20}
                        fill="#e2e8f0"
                        opacity={0.8}
                    />
                    <path d="M -70 -60 L 70 -60 L 50 40 L -50 40 Z" fill="#a16207" />
                    <text y={100} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                        lampeolje
                    </text>
                </g>
            </Inn>
            <Inn vis={beat === 2} forsinkelse={0.4}>
                <text x={1110} y={570} fontSize={70} fontWeight={900} fill="#94a3b8">
                    →
                </text>
                <text x={1160} y={470} fontSize={30} fontWeight={700} fill="#475569">
                    gjort fast
                </text>
                <g transform="translate(1340 560)">
                    <rect
                        x={-110}
                        y={-70}
                        width={220}
                        height={140}
                        rx={12}
                        fill="#fef08a"
                        stroke="#ca8a04"
                        strokeWidth={6}
                    />
                    <text y={14} textAnchor="middle" fontSize={34} fontWeight={900} fill="#854d0e">
                        MARGARIN
                    </text>
                </g>
            </Inn>

            {/* Beat 3-4: Sandefjord */}
            <Inn vis={by}>
                <rect x={0} y={660} width={B} height={240} fill="#3e5b73" />
                {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                    const x = 140 + i * 190;
                    const h = 150 + ((i * 37) % 70);
                    const farger = [
                        '#b91c1c',
                        '#f8fafc',
                        '#d97706',
                        '#f8fafc',
                        '#1e3a8a',
                        '#f8fafc',
                        '#b91c1c',
                    ];
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: by ? 1 : 0, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.25 }}
                        >
                            <rect
                                x={x}
                                y={660 - h}
                                width={150}
                                height={h}
                                fill={farger[i]}
                                stroke="#475569"
                                strokeWidth={3}
                            />
                            <path
                                d={`M ${x - 10} ${660 - h} L ${x + 75} ${600 - h} L ${x + 160} ${660 - h} Z`}
                                fill="#334155"
                            />
                            <rect x={x + 30} y={700 - h} width={34} height={34} fill="#fde68a" />
                            <rect x={x + 86} y={700 - h} width={34} height={34} fill="#fde68a" />
                        </motion.g>
                    );
                })}
                {beat === 3 && (
                    <>
                        <text
                            x={B / 2}
                            y={780}
                            textAnchor="middle"
                            fontSize={52}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            Sandefjord
                        </text>
                        <text
                            x={B / 2}
                            y={840}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={700}
                            fill="#e2e8f0"
                        >
                            arbeid og rikdom
                        </text>
                    </>
                )}
            </Inn>
            <Inn vis={beat === 4} forsinkelse={0.4}>
                <rect x={0} y={130} width={B} height={530} fill="#f1f5f9" opacity={0.85} />
                <g transform="translate(800 600)">
                    <path d="M -300 -300 L 0 -400 L 300 -300 Z" fill="#475569" />
                    <rect x={-300} y={-300} width={600} height={56} fill="#64748b" />
                    {[-240, -120, 0, 120, 240].map((x) => (
                        <rect
                            key={x}
                            x={x - 20}
                            y={-244}
                            width={40}
                            height={224}
                            fill="#e2e8f0"
                            stroke="#94a3b8"
                            strokeWidth={3}
                        />
                    ))}
                    <rect x={-320} y={-20} width={640} height={30} fill="#64748b" />
                </g>
                <text
                    x={800}
                    y={340}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    HVALFANGSTMUSEET
                </text>
                <text
                    x={B / 2}
                    y={780}
                    textAnchor="middle"
                    fontSize={52}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    gitt til byen i 1917
                </text>
            </Inn>
        </>
    );
}

/** Rekordfatene: fire stabler som vokser, så en strek for hvor mye som kan selges. */
const STABLER = [0, 1, 2, 3, 4, 5];
const HOYDE = 6;

function Kollaps({ beat }: { beat: number }) {
    const fullt = beat >= 0;
    const forMye = beat >= 1;
    const regler = beat >= 2;
    return (
        <>
            <Inn vis={!regler}>
                {/* Rekordstabelen til venstre */}
                {STABLER.map((s) =>
                    Array.from({ length: HOYDE }, (_, r) => {
                        const over = r >= 3;
                        return (
                            <motion.g
                                key={`${s}-${r}`}
                                initial={{ opacity: 0, y: -60 }}
                                animate={{ opacity: fullt ? 1 : 0, y: 0 }}
                                transition={{ delay: 0.3 + (r * STABLER.length + s) * 0.08 }}
                            >
                                <Fat
                                    x={180 + s * 80}
                                    y={760 - r * 96}
                                    farge={forMye && over ? '#dc2626' : '#b45309'}
                                />
                            </motion.g>
                        );
                    })
                )}
                <text
                    x={380}
                    y={870}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#334155"
                >
                    1930-1931: rekord
                </text>
            </Inn>
            <Inn vis={forMye && !regler}>
                <line
                    x1={110}
                    y1={470}
                    x2={700}
                    y2={470}
                    stroke="#0f172a"
                    strokeWidth={6}
                    strokeDasharray="18 12"
                />
                <text x={720} y={450} fontSize={34} fontWeight={800} fill="#0f172a">
                    det som kan selges
                </text>
                <text x={720} y={500} fontSize={34} fontWeight={800} fill="#dc2626">
                    resten: for mye
                </text>
                {/* Året etter: en liten stabel */}
                <g transform="translate(1180 0)">
                    <Fat x={0} y={760} farge="#94a3b8" />
                    <text
                        x={0}
                        y={870}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#334155"
                    >
                        året etter
                    </text>
                    <motion.g
                        initial={{ opacity: 0, scale: 1.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.6 }}
                        style={{ originX: '0px', originY: '640px' }}
                    >
                        <g transform="rotate(-8 0 640)">
                            <rect
                                x={-200}
                                y={590}
                                width={400}
                                height={96}
                                rx={14}
                                fill="#ffffff"
                                stroke="#dc2626"
                                strokeWidth={8}
                            />
                            <text
                                x={0}
                                y={656}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={900}
                                fill="#dc2626"
                            >
                                BRØT SAMMEN
                            </text>
                        </g>
                    </motion.g>
                </g>
            </Inn>

            {/* Beat 2: avtalen i Genève */}
            <Inn vis={beat === 2} forsinkelse={0.3}>
                <g transform="translate(800 520)">
                    <rect
                        x={-260}
                        y={-300}
                        width={520}
                        height={600}
                        rx={10}
                        fill="#ffffff"
                        stroke="#cbd5e1"
                        strokeWidth={4}
                    />
                    <text
                        y={-210}
                        textAnchor="middle"
                        fontSize={48}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        AVTALE
                    </text>
                    {[-140, -90, -40, 10, 60].map((y) => (
                        <rect
                            key={y}
                            x={-200}
                            y={y}
                            width={400}
                            height={14}
                            rx={7}
                            fill="#e2e8f0"
                        />
                    ))}
                    <motion.g
                        initial={{ opacity: 0, scale: 1.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 16 }}
                        style={{ originX: '0px', originY: '190px' }}
                    >
                        <circle
                            cx={0}
                            cy={190}
                            r={86}
                            fill="none"
                            stroke="#1e3a8a"
                            strokeWidth={8}
                        />
                        <text
                            y={180}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#1e3a8a"
                        >
                            Genève
                        </text>
                        <text
                            y={222}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#1e3a8a"
                        >
                            1931
                        </text>
                    </motion.g>
                </g>
                {/* Den norske loven som mønster */}
                <motion.g
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.6 }}
                >
                    <g transform="translate(130 420)">
                        <rect
                            width={240}
                            height={300}
                            rx={10}
                            fill="#ffffff"
                            stroke="#cbd5e1"
                            strokeWidth={4}
                        />
                        <rect x={20} y={20} width={90} height={64} fill="#ba0c2f" />
                        <rect x={20} y={46} width={90} height={12} fill="#ffffff" />
                        <rect x={46} y={20} width={12} height={64} fill="#ffffff" />
                        <rect x={20} y={49} width={90} height={6} fill="#00205b" />
                        <rect x={49} y={20} width={6} height={64} fill="#00205b" />
                        <text
                            x={120}
                            y={150}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            norsk lov
                        </text>
                    </g>
                    <text x={410} y={590} fontSize={70} fontWeight={900} fill="#94a3b8">
                        →
                    </text>
                </motion.g>
            </Inn>

            {/* Beat 3: 17 land rundt bordet */}
            <Inn vis={beat >= 3} forsinkelse={0.3}>
                <ellipse
                    cx={800}
                    cy={520}
                    rx={330}
                    ry={200}
                    fill="#e2e8f0"
                    stroke="#94a3b8"
                    strokeWidth={6}
                />
                <text
                    x={800}
                    y={510}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill="#1e3a8a"
                >
                    IWC
                </text>
                <text
                    x={800}
                    y={570}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#475569"
                >
                    1946
                </text>
                {Array.from({ length: 17 }, (_, i) => {
                    const v = (i / 17) * Math.PI * 2 - Math.PI / 2;
                    return (
                        <motion.circle
                            key={i}
                            cx={800 + Math.cos(v) * 420}
                            cy={520 + Math.sin(v) * 270}
                            r={30}
                            fill="#1e3a8a"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.12 }}
                        />
                    );
                })}
            </Inn>
        </>
    );
}

export function HvalfangstOlje({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'verdi';
    const tekst =
        modus === 'verdi'
            ? [
                  'Hvorfor ville alle ha hval?',
                  'Spekk blir til lampeolje',
                  'Olje blir til margarin',
                  'Arbeid og rikdom',
                  'Hvalfangstmuseet, 1917',
              ][beat]
            : [
                  'Rekordsesongen',
                  'For mye olje å selge',
                  'Den første avtalen mellom land',
                  '17 land i en hvalfangstkommisjon',
              ][beat];

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-white to-slate-100 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'verdi' ? <Verdi beat={beat} /> : <Kollaps beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">{tekst && <Merkelapp tekst={tekst} />}</AnimatePresence>
        </div>
    );
}
