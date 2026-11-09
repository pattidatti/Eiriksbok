import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Nedgangen som en vekt. «nedgang»: inntektene på den ene siden, og lodd for lodd legger
 * korrupsjon, krig, utgifter og konkurranse seg på den andre, til vekta tipper.
 * «slutt»: konkurs i 1790-årene, og i 1799 tar staten over koloniene og gjelden.
 * Vekta viser retning, ikke beløp: artikkelen gir ingen tall for pengene.
 */

const B = 1600;
const H = 900;
type Modus = 'nedgang' | 'slutt';

const OVERSKRIFTER: Record<Modus, string[]> = {
    nedgang: [
        'Korrupsjon',
        'Krig mot Storbritannia, 1780-1784',
        'Dyrt å holde soldater, skip og fort',
        'Konkurranse fra britene',
        'Monopolet mister verdi',
    ],
    slutt: ['Konkurs', '1799: VOC oppløses', 'Staten arver koloniene og gjelden'],
};

/** Loddene på taps-siden, ett per beat. */
const LODD = [
    { tekst: 'Korrupsjon', farge: '#7c2d12' },
    { tekst: 'Krig', farge: '#991b1b' },
    { tekst: 'Utgifter', farge: '#9a3412' },
    { tekst: 'Konkurrenter', farge: '#7f1d1d' },
];

const MIDT = 800;
const AKSE_Y = 300;
const ARM = 470;

export function VocRegnskap({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'nedgang';
    const tekst = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#ece4d4' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'nedgang' ? <Nedgang beat={beat} /> : <Slutt beat={beat} />}
            </svg>
            <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

/** Endepunktene til vektarmen ved en gitt helning (grader, positiv = høyre side ned). */
function arm(vinkel: number) {
    const r = (vinkel * Math.PI) / 180;
    return {
        vx: MIDT - Math.cos(r) * ARM,
        vy: AKSE_Y - Math.sin(r) * ARM,
        hx: MIDT + Math.cos(r) * ARM,
        hy: AKSE_Y + Math.sin(r) * ARM,
    };
}

function Mynter({ antall, x, y }: { antall: number; x: number; y: number }) {
    return (
        <>
            {Array.from({ length: antall }, (_, i) => {
                const rad = Math.floor(i / 5);
                const kol = i % 5;
                return (
                    <motion.ellipse
                        key={i}
                        cx={x - 120 + kol * 60 + (rad % 2) * 30}
                        cy={y - 26 - rad * 30}
                        rx={30}
                        ry={13}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                );
            })}
        </>
    );
}

function Vekt({
    vinkel,
    venstre,
    hoyre,
    venstreTekst,
    hoyreTekst,
}: {
    vinkel: number;
    venstre: React.ReactNode;
    hoyre: React.ReactNode;
    venstreTekst: string;
    hoyreTekst: string;
}) {
    const { vx, vy, hx, hy } = arm(vinkel);
    const skal = (x: number, y: number, innhold: React.ReactNode, navn: string) => (
        <motion.g
            animate={{ x, y }}
            initial={false}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
        >
            <line x1={-150} y1={190} x2={0} y2={0} stroke="#57534e" strokeWidth={4} />
            <line x1={150} y1={190} x2={0} y2={0} stroke="#57534e" strokeWidth={4} />
            <path d="M -190 190 L 190 190 L 160 222 L -160 222 Z" fill="#78716c" />
            <g transform="translate(0 190)">{innhold}</g>
            <text x={0} y={272} textAnchor="middle" fontSize={38} fontWeight={900} fill="#0f172a">
                {navn}
            </text>
        </motion.g>
    );
    return (
        <>
            {/* Foten */}
            <path
                d={`M ${MIDT - 140} 860 L ${MIDT + 140} 860 L ${MIDT + 30} 820 L ${MIDT - 30} 820 Z`}
                fill="#44403c"
            />
            <rect x={MIDT - 14} y={AKSE_Y} width={28} height={530} fill="#57534e" />
            <motion.line
                initial={false}
                animate={{ x1: vx, y1: vy, x2: hx, y2: hy }}
                transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                stroke="#292524"
                strokeWidth={18}
                strokeLinecap="round"
            />
            <circle cx={MIDT} cy={AKSE_Y} r={24} fill="#292524" />
            {skal(vx, vy, venstre, venstreTekst)}
            {skal(hx, hy, hoyre, hoyreTekst)}
        </>
    );
}

function Lodd({ i, tekst, farge }: { i: number; tekst: string; farge: string }) {
    const y = -50 - i * 62;
    const bredde = tekst.length * 22 + 50;
    return (
        <motion.g
            initial={{ opacity: 0, y: y - 260 }}
            animate={{ opacity: 1, y }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
        >
            <rect x={-bredde / 2} y={-28} width={bredde} height={58} rx={10} fill={farge} />
            <text x={0} y={14} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff">
                {tekst}
            </text>
        </motion.g>
    );
}

function Nedgang({ beat }: { beat: number }) {
    const antallLodd = Math.min(beat + 1, LODD.length);
    // Siste beat: billigere tekstiler og stillestående krydderhandel tar pengene ut av vekta.
    const mynter = beat >= 4 ? 4 : 15;
    const vinkel = [4, 9, 13, 17, 24][Math.min(beat, 4)];
    return (
        <>
            <Vekt
                vinkel={vinkel}
                venstreTekst="Inntekter"
                hoyreTekst="Tap og utgifter"
                venstre={
                    <AnimatePresence>
                        <Mynter key={mynter} antall={mynter} x={0} y={0} />
                    </AnimatePresence>
                }
                hoyre={
                    <>
                        {LODD.slice(0, antallLodd).map((l, i) => (
                            <Lodd key={l.tekst} i={i} tekst={l.tekst} farge={l.farge} />
                        ))}
                    </>
                }
            />
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <rect x={30} y={690} width={600} height={150} rx={18} fill="#fff" />
                    <text
                        x={330}
                        y={750}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Egne tekstiler i Storbritannia
                    </text>
                    <text
                        x={330}
                        y={802}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Krydderhandelen vokser ikke
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Slutt({ beat }: { beat: number }) {
    return (
        <>
            {/* VOC-merket med gjeld */}
            <motion.g
                animate={{ opacity: beat >= 1 ? 0.25 : 1, x: beat >= 1 ? -330 : 0 }}
                transition={{ duration: 1.2 }}
            >
                <circle cx={800} cy={470} r={190} fill="#ea580c" stroke="#fff" strokeWidth={10} />
                {beat >= 1 && (
                    <text
                        x={800}
                        y={512}
                        textAnchor="middle"
                        fontSize={118}
                        fontWeight={900}
                        fill="#fff"
                    >
                        VOC
                    </text>
                )}
            </motion.g>
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0, scale: 1.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring', stiffness: 160, damping: 14 }}
                    style={{ originX: '800px', originY: '470px' }}
                >
                    <g transform="rotate(-10 800 470)">
                        <rect
                            x={530}
                            y={420}
                            width={540}
                            height={110}
                            rx={14}
                            fill="#fff"
                            stroke="#dc2626"
                            strokeWidth={10}
                        />
                        <text
                            x={800}
                            y={500}
                            textAnchor="middle"
                            fontSize={78}
                            fontWeight={900}
                            fill="#dc2626"
                        >
                            KONKURS
                        </text>
                    </g>
                </motion.g>
            )}
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <rect x={620} y={710} width={360} height={90} rx={16} fill="#7f1d1d" />
                    <text
                        x={800}
                        y={770}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Enorm gjeld
                    </text>
                </motion.g>
            )}

            {/* Staten Nederland */}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                >
                    <rect x={900} y={230} width={520} height={480} rx={24} fill="#1d4ed8" />
                    <path d="M 960 330 L 1160 260 L 1360 330 Z" fill="#fff" opacity={0.9} />
                    {[1000, 1080, 1160, 1240, 1320].map((x) => (
                        <rect
                            key={x}
                            x={x - 16}
                            y={345}
                            width={32}
                            height={150}
                            fill="#fff"
                            opacity={0.9}
                        />
                    ))}
                    <text
                        x={1160}
                        y={580}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Staten
                    </text>
                    <text
                        x={1160}
                        y={640}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Nederland
                    </text>
                    <path
                        d="M 660 470 L 870 470 M 840 446 L 872 470 L 840 494"
                        stroke="#0f172a"
                        strokeWidth={10}
                        fill="none"
                        strokeLinecap="round"
                    />
                </motion.g>
            )}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <text
                        x={470}
                        y={730}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Oppløst 1799
                    </text>
                </motion.g>
            )}

            {/* Det staten arver */}
            {beat >= 2 &&
                [
                    { tekst: 'Koloniene', farge: '#0d9488', y: 760 },
                    { tekst: 'Gjelden', farge: '#b91c1c', y: 840 },
                ].map((a, i) => (
                    <motion.g
                        key={a.tekst}
                        initial={{ opacity: 0, x: -300 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: i * 0.6 }}
                    >
                        <rect x={980} y={a.y - 50} width={360} height={66} rx={14} fill={a.farge} />
                        <text
                            x={1160}
                            y={a.y - 4}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#fff"
                        >
                            + {a.tekst}
                        </text>
                    </motion.g>
                ))}
        </>
    );
}
