import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Snitt gjennom bygda: en liten gård til venstre, verket (gruva og smeltehytta) til høyre, og
 * veien mellom dem. «plikt»: bonden må brenne trekull og kjøre lass for verket, får betalt, men
 * kan ikke si nei. «familie»: arbeiderfamilien med gården, mannen som går til verket og
 * kvinnen som blir igjen og driver gården.
 */

type Modus = 'plikt' | 'familie';

const OVERSKRIFTER: Record<Modus, string[]> = {
    plikt: [
        'Bøndene i sirkelen',
        'Frakte varer, brenne trekull',
        'Et krav fra verket',
        'Ikke bare på Røros',
    ],
    familie: ['En liten gård med dyr', 'Mannen går til verket', 'Kvinnene driver gården'],
};

const VEI_Y = 700;
const GARD_X = 330;
const VERK_X = 1240;

export function RorosGarden({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'plikt';
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];

    // Kameraet: familien starter tett på gården.
    const zoom =
        modus === 'familie' && beat === 0
            ? { scale: 1.45, x: 330, y: -150 }
            : { scale: 1, x: 0, y: 0 };

    const mannVedVerket = modus === 'familie' && beat >= 1;
    const kvinnenJobber = modus === 'familie' && beat >= 2;

    return (
        <div className="absolute inset-0 overflow-hidden bg-[#dbe7ef]">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <motion.g
                    initial={false}
                    animate={zoom}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    style={{ originX: '800px', originY: '600px' }}
                >
                    {/* Fjellene bak og marka */}
                    <path
                        d="M -400 600 L 0 380 L 260 520 L 560 330 L 900 540 L 1180 300 L 1500 500 L 2000 360 L 2000 620 L -400 620 Z"
                        fill="#b9c6cf"
                    />
                    <rect x={-600} y={600} width={2800} height={700} fill="#c9d3a8" />
                    {/* Veien mellom gården og verket */}
                    <path
                        d={`M ${GARD_X + 150} ${VEI_Y} C 700 ${VEI_Y + 40}, 900 ${VEI_Y - 30}, ${VERK_X - 160} ${VEI_Y}`}
                        fill="none"
                        stroke="#a89878"
                        strokeWidth={34}
                        strokeLinecap="round"
                    />

                    <Gard />
                    <Dyr />
                    <Verket playing={playing} />

                    {/* Kullmila ved gården: ved som brenner sakte under torv */}
                    {modus === 'plikt' && beat >= 1 && <Kullmile playing={playing} />}

                    {/* Hest og slede med lass på vei til verket */}
                    {modus === 'plikt' && beat >= 1 && <Lass playing={playing} />}

                    {/* Betaling fra verket til gården */}
                    {modus === 'plikt' && beat === 2 && <Betaling playing={playing} />}

                    {/* Familien */}
                    <motion.g
                        initial={false}
                        animate={{ x: mannVedVerket ? VERK_X - 330 - GARD_X : 0 }}
                        transition={{ duration: playing ? 3.5 : 0.01, ease: 'easeInOut' }}
                    >
                        <Person x={GARD_X + 210} y={VEI_Y + 30} mann />
                    </motion.g>
                    <motion.g
                        initial={false}
                        animate={{ x: kvinnenJobber ? -60 : 0 }}
                        transition={{ duration: 1.5 }}
                    >
                        <Person
                            x={GARD_X + 140}
                            y={VEI_Y + 30}
                            uthevet={kvinnenJobber}
                            bøtte={kvinnenJobber}
                        />
                    </motion.g>
                    {kvinnenJobber && <Hoy />}

                    {/* Merkelapper */}
                    <Etikett
                        x={GARD_X}
                        y={440}
                        tekst={modus === 'familie' ? 'Arbeiderens gård' : 'Gården'}
                    />
                    <Etikett x={VERK_X} y={300} tekst="Verket" farge="#9a3412" />
                    {modus === 'plikt' && beat >= 1 && (
                        <Etikett x={GARD_X - 230} y={560} tekst="kullmile" liten />
                    )}
                    {modus === 'plikt' && beat >= 1 && beat <= 2 && (
                        <Etikett x={800} y={VEI_Y - 60} tekst="lass til verket" liten />
                    )}
                    {modus === 'familie' && beat >= 1 && (
                        <Etikett
                            x={VERK_X - 120}
                            y={VEI_Y + 150}
                            tekst="i gruva eller ved hytta"
                            liten
                            farge="#9a3412"
                        />
                    )}
                    {kvinnenJobber && (
                        <Etikett
                            x={GARD_X + 300}
                            y={VEI_Y + 110}
                            tekst="det meste av gårdsarbeidet"
                            liten
                            farge="#7c2d12"
                        />
                    )}
                </motion.g>

                {modus === 'plikt' && beat === 2 && <Stempel />}
                {modus === 'plikt' && beat >= 3 && <Samme />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] inset-x-0 flex justify-center"
                >
                    <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Gard() {
    return (
        <g>
            {/* Våningshuset med torvtak */}
            <rect
                x={GARD_X - 140}
                y={520}
                width={220}
                height={140}
                fill="#8a4b2a"
                stroke="#3b2a20"
                strokeWidth={6}
            />
            <path
                d={`M ${GARD_X - 165} 525 L ${GARD_X - 30} 455 L ${GARD_X + 105} 525 Z`}
                fill="#5b6b3a"
                stroke="#3b2a20"
                strokeWidth={6}
            />
            <rect x={GARD_X - 60} y={590} width={44} height={70} fill="#3b2a20" />
            <rect
                x={GARD_X - 120}
                y={560}
                width={40}
                height={34}
                fill="#fde68a"
                stroke="#3b2a20"
                strokeWidth={4}
            />
            {/* Fjøset */}
            <rect
                x={GARD_X + 110}
                y={560}
                width={150}
                height={100}
                fill="#9c6b45"
                stroke="#3b2a20"
                strokeWidth={6}
            />
            <path
                d={`M ${GARD_X + 95} 565 L ${GARD_X + 185} 515 L ${GARD_X + 275} 565 Z`}
                fill="#5b6b3a"
                stroke="#3b2a20"
                strokeWidth={6}
            />
            <rect x={GARD_X + 165} y={605} width={40} height={55} fill="#3b2a20" />
        </g>
    );
}

function Dyr() {
    // Ei ku og noen sauer på beitet foran gården.
    return (
        <g>
            <g transform={`translate(${GARD_X - 120} 760)`}>
                <ellipse
                    cx={0}
                    cy={0}
                    rx={56}
                    ry={30}
                    fill="#f5f5f4"
                    stroke="#292524"
                    strokeWidth={5}
                />
                <circle cx={-18} cy={-6} r={10} fill="#292524" />
                <circle cx={20} cy={8} r={12} fill="#292524" />
                <ellipse
                    cx={-64}
                    cy={-14}
                    rx={20}
                    ry={16}
                    fill="#f5f5f4"
                    stroke="#292524"
                    strokeWidth={5}
                />
                {[-36, -14, 18, 40].map((x) => (
                    <rect key={x} x={x} y={22} width={9} height={30} fill="#292524" />
                ))}
            </g>
            {[
                [GARD_X - 260, 820],
                [GARD_X - 10, 830],
                [GARD_X + 80, 790],
            ].map(([x, y]) => (
                <g key={x} transform={`translate(${x} ${y})`}>
                    <ellipse
                        cx={0}
                        cy={0}
                        rx={32}
                        ry={22}
                        fill="#e7e5e4"
                        stroke="#57534e"
                        strokeWidth={4}
                    />
                    <circle cx={-34} cy={-8} r={11} fill="#57534e" />
                    <rect x={-16} y={16} width={7} height={20} fill="#57534e" />
                    <rect x={10} y={16} width={7} height={20} fill="#57534e" />
                </g>
            ))}
        </g>
    );
}

function Verket({ playing }: { playing: boolean }) {
    return (
        <g>
            {/* Gruveåpningen i fjellsida */}
            <path
                d={`M ${VERK_X + 90} 620 L ${VERK_X + 200} 420 L ${VERK_X + 420} 620 Z`}
                fill="#8b8f94"
                stroke="#44403c"
                strokeWidth={6}
            />
            <path
                d={`M ${VERK_X + 190} 620 L ${VERK_X + 190} 560 Q ${VERK_X + 225} 525 ${VERK_X + 260} 560 L ${VERK_X + 260} 620 Z`}
                fill="#1c1917"
            />
            {/* Smeltehytta med skorstein og røyk */}
            <rect
                x={VERK_X - 150}
                y={480}
                width={260}
                height={180}
                fill="#efe6d8"
                stroke="#3b2a20"
                strokeWidth={6}
            />
            <path
                d={`M ${VERK_X - 170} 485 L ${VERK_X - 20} 400 L ${VERK_X + 130} 485 Z`}
                fill="#57534e"
                stroke="#3b2a20"
                strokeWidth={6}
            />
            <rect
                x={VERK_X + 30}
                y={350}
                width={50}
                height={110}
                fill="#78716c"
                stroke="#3b2a20"
                strokeWidth={5}
            />
            <rect
                x={VERK_X - 80}
                y={560}
                width={80}
                height={60}
                fill="#f59e0b"
                stroke="#3b2a20"
                strokeWidth={4}
            />
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={VERK_X + 55}
                    cy={330}
                    fill="#6b7280"
                    initial={{ opacity: 0.5, scale: 1, x: i * 30, y: -i * 50 }}
                    animate={
                        playing
                            ? { opacity: [0.6, 0], scale: [1, 2.4], x: [0, -120], y: [0, -200] }
                            : { opacity: 0.45, scale: 1 + i * 0.4, x: -i * 40, y: -i * 60 }
                    }
                    transition={{ duration: 4, repeat: playing ? Infinity : 0, delay: i * 1.3 }}
                    r={30}
                />
            ))}
        </g>
    );
}

function Kullmile({ playing }: { playing: boolean }) {
    const x = GARD_X - 230;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ originX: `${x}px`, originY: '660px' }}
        >
            <path
                d={`M ${x - 80} 660 Q ${x} 560 ${x + 80} 660 Z`}
                fill="#3f3a33"
                stroke="#1c1917"
                strokeWidth={5}
            />
            <motion.circle
                cx={x}
                cy={590}
                r={14}
                fill="#9ca3af"
                initial={{ opacity: 0.5 }}
                animate={
                    playing
                        ? { opacity: [0.6, 0], y: [0, -70], scale: [1, 2] }
                        : { opacity: 0.5, y: -20 }
                }
                transition={{ duration: 3, repeat: playing ? Infinity : 0 }}
            />
        </motion.g>
    );
}

function Lass({ playing }: { playing: boolean }) {
    const fra = GARD_X + 200;
    const til = VERK_X - 220;
    return (
        <motion.g
            initial={{ x: (fra + til) / 2, y: VEI_Y - 10 }}
            animate={
                playing ? { x: [fra, til], y: VEI_Y - 10 } : { x: (fra + til) / 2, y: VEI_Y - 10 }
            }
            transition={{ duration: 8, repeat: playing ? Infinity : 0, ease: 'linear' }}
        >
            {/* Sleden med sekker */}
            <rect x={-130} y={-20} width={110} height={18} fill="#7a4a2a" />
            <ellipse cx={-100} cy={-36} rx={26} ry={20} fill="#292524" />
            <ellipse cx={-50} cy={-36} rx={26} ry={20} fill="#57534e" />
            <path d="M -135 0 L -15 0" stroke="#3b2a20" strokeWidth={5} />
            {/* Hesten */}
            <ellipse cx={30} cy={-50} rx={46} ry={24} fill="#6b4226" />
            <path d="M 66 -60 L 92 -100 L 108 -92 L 84 -50 Z" fill="#6b4226" />
            {[0, 18, 44, 60].map((x) => (
                <rect key={x} x={x} y={-30} width={9} height={34} fill="#4a2c18" />
            ))}
            <line x1={-20} y1={-20} x2={0} y2={-44} stroke="#3b2a20" strokeWidth={4} />
        </motion.g>
    );
}

function Betaling({ playing }: { playing: boolean }) {
    const fra = VERK_X - 120;
    const til = GARD_X + 120;
    return (
        <motion.g
            initial={{ x: (fra + til) / 2 + 150, y: 600 }}
            animate={playing ? { x: [fra, til], y: 600 } : { x: (fra + til) / 2 + 150, y: 600 }}
            transition={{ duration: 3, repeat: playing ? Infinity : 0, ease: 'easeInOut' }}
        >
            <circle r={26} fill="#eab308" stroke="#854d0e" strokeWidth={5} />
            <circle r={13} fill="none" stroke="#854d0e" strokeWidth={3} />
            <text
                x={0}
                y={-44}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#854d0e"
                stroke="#fff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                betalt
            </text>
        </motion.g>
    );
}

function Hoy() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <path
                d={`M ${GARD_X - 40} 760 Q ${GARD_X} 690 ${GARD_X + 40} 760 Z`}
                fill="#d6b456"
                stroke="#8a6d1f"
                strokeWidth={4}
            />
        </motion.g>
    );
}

function Person({
    x,
    y,
    mann = false,
    uthevet = false,
    bøtte = false,
}: {
    x: number;
    y: number;
    mann?: boolean;
    uthevet?: boolean;
    bøtte?: boolean;
}) {
    const farge = mann ? '#334155' : '#7c2d12';
    return (
        <g transform={`translate(${x} ${y})`}>
            {uthevet && <circle cx={0} cy={-70} r={88} fill="#fde68a" opacity={0.75} />}
            <circle cx={0} cy={-128} r={20} fill="#f1c9a5" stroke="#3b2a20" strokeWidth={4} />
            {mann ? (
                <>
                    <path d="M -22 -144 L 22 -144 L 16 -158 L -16 -158 Z" fill="#1f2937" />
                    <rect x={-22} y={-106} width={44} height={60} rx={8} fill={farge} />
                    <rect x={-20} y={-48} width={16} height={48} fill="#1f2937" />
                    <rect x={4} y={-48} width={16} height={48} fill="#1f2937" />
                    {/* Hakke over skulderen */}
                    <path
                        d="M 18 -100 L 50 -150 M 36 -160 Q 56 -150 64 -128"
                        stroke="#57534e"
                        strokeWidth={6}
                        fill="none"
                        strokeLinecap="round"
                    />
                </>
            ) : (
                <>
                    <path d="M -20 -150 Q 0 -168 20 -150 L 18 -138 L -18 -138 Z" fill="#f8fafc" />
                    <path d="M -18 -106 L 18 -106 L 34 -4 L -34 -4 Z" fill={farge} />
                    <rect x={-14} y={-4} width={10} height={6} fill="#1f2937" />
                    <rect x={4} y={-4} width={10} height={6} fill="#1f2937" />
                    {bøtte && (
                        <path
                            d="M 30 -60 L 56 -60 L 52 -28 L 34 -28 Z"
                            fill="#a8a29e"
                            stroke="#44403c"
                            strokeWidth={4}
                        />
                    )}
                </>
            )}
        </g>
    );
}

function Stempel() {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ originX: '800px', originY: '220px' }}
        >
            <g transform="rotate(-4 800 220)">
                <rect
                    x={540}
                    y={160}
                    width={520}
                    height={100}
                    rx={14}
                    fill="#ffffff"
                    fillOpacity={0.95}
                    stroke="#b91c1c"
                    strokeWidth={8}
                />
                <text
                    x={800}
                    y={232}
                    textAnchor="middle"
                    fontSize={62}
                    fontWeight={900}
                    fill="#b91c1c"
                >
                    PLIKTARBEID
                </text>
            </g>
            <text
                x={800}
                y={320}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill="#0f172a"
                stroke="#fff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                Betalt, men ingen kunne si nei
            </text>
        </motion.g>
    );
}

function Samme() {
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
        >
            <rect
                x={330}
                y={140}
                width={940}
                height={130}
                rx={24}
                fill="#ffffff"
                fillOpacity={0.95}
                stroke="#9a3412"
                strokeWidth={4}
            />
            <text x={800} y={198} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                Flere norske bergverk
            </text>
            <text x={800} y={246} textAnchor="middle" fontSize={32} fontWeight={700} fill="#334155">
                brukte samme system
            </text>
        </motion.g>
    );
}

function Etikett({
    x,
    y,
    tekst,
    farge = '#0f172a',
    liten = false,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    liten?: boolean;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={liten ? 32 : 40}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
