import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Renten som en loddrett skala til venstre (høy rente øverst, lav nederst, uten tall), med
 * en merkelapp for den naturlige renten og en for styringsrenten. Til høyre vises det som
 * skjer. Fire moduser:
 * - naturlig: sparing avgjør renten. Mye sparing = lav rente, lite sparing = høy rente.
 * - styring: Norges Bank, bankene, komiteen med fem medlemmer, åtte møter i året.
 * - lav: styringsrenten under den naturlige: mer lån, mindre sparing, priser opp, boble.
 * - hoy: styringsrenten over den naturlige: dyrt å låne, bremser, arbeidsledighet.
 */

type Modus = 'naturlig' | 'styring' | 'lav' | 'hoy';

const TOPP = 210;
const BUNN = 800;
const MIDT = 500;

const OVERSKRIFT: Record<Modus, string[]> = {
    naturlig: [
        'Hvem bestemmer renten?',
        'Mye sparing: lav rente',
        'Lite sparing: høy rente',
        'Den naturlige renten',
    ],
    styring: [
        'Styringsrenten',
        'Påvirker rentene i hele økonomien',
        'Fem medlemmer, åtte ganger i året',
        'Mål: lav og stabil prisvekst',
    ],
    lav: [
        'Styringsrenten under den naturlige',
        'Kunstig billig å låne',
        'Mindre sparing, priser opp',
        'Inflasjon og bobler',
    ],
    hoy: ['Styringsrenten over den naturlige', 'Økonomien bremser', 'Arbeidsledighet'],
};

function naturligY(modus: Modus, beat: number) {
    if (modus === 'naturlig') return beat === 1 ? 690 : beat === 2 ? 310 : MIDT;
    return MIDT;
}

function styringY(modus: Modus): number | null {
    if (modus === 'naturlig') return null;
    if (modus === 'styring') return 580;
    if (modus === 'lav') return 690;
    return 310;
}

/** Skalaen til venstre med merkelappene. */
function Skala({ modus, beat }: { modus: Modus; beat: number }) {
    const ny = naturligY(modus, beat);
    const sy = styringY(modus);
    const stiplet = modus !== 'naturlig';
    return (
        <g>
            <defs>
                <linearGradient id="inflasjon-skala" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fecaca" />
                    <stop offset="1" stopColor="#ccfbf1" />
                </linearGradient>
            </defs>
            <rect
                x={150}
                y={TOPP}
                width={70}
                height={BUNN - TOPP}
                rx={35}
                fill="url(#inflasjon-skala)"
                stroke="#334155"
                strokeWidth={5}
            />
            <text
                x={185}
                y={TOPP - 25}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#b91c1c"
            >
                Høy rente
            </text>
            <text
                x={185}
                y={BUNN + 55}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#0f766e"
            >
                Lav rente
            </text>
            {/* Den naturlige renten */}
            <motion.g
                initial={false}
                animate={{ y: ny }}
                transition={{ type: 'spring', stiffness: 60, damping: 14 }}
            >
                <line
                    x1={130}
                    y1={0}
                    x2={240}
                    y2={0}
                    stroke="#0f766e"
                    strokeWidth={8}
                    strokeDasharray={stiplet ? '14 10' : undefined}
                />
                <polygon points="240,0 268,-16 268,16" fill="#0f766e" />
                <text x={280} y={12} fontSize={34} fontWeight={800} fill="#0f766e">
                    {modus === 'naturlig' && beat < 3 ? '?' : 'naturlig'}
                </text>
            </motion.g>
            {sy !== null && (
                <motion.g
                    initial={{ y: sy, opacity: 0 }}
                    animate={{ y: sy, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                >
                    <line x1={130} y1={0} x2={240} y2={0} stroke="#1d4ed8" strokeWidth={10} />
                    <polygon points="240,0 268,-16 268,16" fill="#1d4ed8" />
                    <text x={280} y={12} fontSize={34} fontWeight={800} fill="#1d4ed8">
                        styringsrenten
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/** En stabel med merkelapp under. Høyden glir. */
function Soyle({
    x,
    hoyde,
    farge,
    etikett,
}: {
    x: number;
    hoyde: number;
    farge: string;
    etikett: string;
}) {
    return (
        <g>
            <motion.rect
                x={x - 70}
                width={140}
                rx={12}
                fill={farge}
                initial={false}
                animate={{ y: 760 - hoyde, height: hoyde }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            />
            <line x1={x - 110} y1={760} x2={x + 110} y2={760} stroke="#334155" strokeWidth={5} />
            <text x={x} y={815} textAnchor="middle" fontSize={38} fontWeight={800} fill="#0f172a">
                {etikett}
            </text>
        </g>
    );
}

function Folk({
    x,
    y,
    antall,
    farge,
    skala = 1,
}: {
    x: number;
    y: number;
    antall: number;
    farge: string;
    skala?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            {Array.from({ length: antall }, (_, i) => (
                <g key={i} transform={`translate(${i * 62} 0)`}>
                    <circle cx={0} cy={-88} r={20} fill="#f1c7a3" />
                    <path d="M -28 0 Q -28 -62 0 -62 Q 28 -62 28 0 Z" fill={farge} />
                </g>
            ))}
        </g>
    );
}

function Kort({
    x,
    y,
    b,
    tekst,
    farge = '#0f172a',
    bakgrunn = '#ffffff',
    str = 36,
}: {
    x: number;
    y: number;
    b: number;
    tekst: string;
    farge?: string;
    bakgrunn?: string;
    str?: number;
}) {
    return (
        <g>
            <rect
                x={x - b / 2}
                y={y - str * 1.05}
                width={b}
                height={str * 1.6}
                rx={16}
                fill={bakgrunn}
                stroke="#cbd5e1"
                strokeWidth={3}
            />
            <text x={x} y={y} textAnchor="middle" fontSize={str} fontWeight={800} fill={farge}>
                {tekst}
            </text>
        </g>
    );
}

function Pil({
    d,
    farge = '#334155',
    forsinkelse = 0,
}: {
    d: string;
    farge?: string;
    forsinkelse?: number;
}) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={9}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
        />
    );
}

// ---------- Modusene ----------

function Naturlig({ beat }: { beat: number }) {
    const sparing = beat === 1 ? 420 : beat === 2 ? 90 : 240;
    return (
        <g>
            <Soyle x={700} hoyde={sparing} farge="#d4a017" etikett="Sparing" />
            <Folk x={1060} y={760} antall={5} farge="#1d4ed8" />
            <text
                x={1184}
                y={815}
                textAnchor="middle"
                fontSize={38}
                fontWeight={800}
                fill="#0f172a"
            >
                Vil låne
            </text>
            <Pil key={`p${beat}`} d="M 790 560 C 880 520 950 520 1030 600" farge="#d4a017" />
            <text x={910} y={500} textAnchor="middle" fontSize={34} fontWeight={700} fill="#92400e">
                penger å låne ut
            </text>
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Kort
                        x={1010}
                        y={290}
                        b={560}
                        tekst="Navnet: Knut Wicksell"
                        farge="#0f766e"
                        str={40}
                    />
                </motion.g>
            )}
        </g>
    );
}

function NorgesBank() {
    return (
        <g>
            <rect
                x={470}
                y={420}
                width={300}
                height={200}
                fill="#e7e5e4"
                stroke="#57534e"
                strokeWidth={4}
            />
            {[500, 560, 620, 680, 740].map((x) => (
                <rect
                    key={x}
                    x={x - 12}
                    y={440}
                    width={24}
                    height={180}
                    fill="#f5f5f4"
                    stroke="#a8a29e"
                    strokeWidth={2}
                />
            ))}
            <polygon
                points="450,420 620,340 790,420"
                fill="#a8a29e"
                stroke="#57534e"
                strokeWidth={4}
            />
            <rect x={450} y={620} width={340} height={22} fill="#78716c" />
            <text x={620} y={690} textAnchor="middle" fontSize={38} fontWeight={800} fill="#0f172a">
                Norges Bank
            </text>
        </g>
    );
}

function Styring({ beat }: { beat: number }) {
    return (
        <g>
            {beat !== 2 && (
                <g transform="translate(150 0)">
                    <NorgesBank />
                </g>
            )}
            {beat === 1 && (
                <g>
                    <Pil d="M 950 520 L 1040 520" />
                    <Kort x={1160} y={535} b={220} tekst="Bankene" />
                    <Pil d="M 1275 500 C 1300 450 1310 420 1330 400" forsinkelse={0.6} />
                    <Pil d="M 1275 560 C 1300 610 1310 640 1330 660" forsinkelse={0.6} />
                    <Kort x={1440} y={385} b={240} tekst="Lånerente" />
                    <Kort x={1440} y={695} b={260} tekst="Sparerente" />
                </g>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ellipse cx={820} cy={540} rx={250} ry={80} fill="#a16207" />
                    <Folk x={696} y={500} antall={5} farge="#1d4ed8" />
                    <text
                        x={820}
                        y={680}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Komiteen: 5 medlemmer
                    </text>
                    {Array.from({ length: 8 }, (_, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.25 }}
                        >
                            <rect
                                x={1080 + (i % 4) * 110}
                                y={360 + Math.floor(i / 4) * 130}
                                width={90}
                                height={100}
                                rx={10}
                                fill="#ffffff"
                                stroke="#334155"
                                strokeWidth={4}
                            />
                            <rect
                                x={1080 + (i % 4) * 110}
                                y={360 + Math.floor(i / 4) * 130}
                                width={90}
                                height={26}
                                rx={8}
                                fill="#dc2626"
                            />
                            <text
                                x={1125 + (i % 4) * 110}
                                y={440 + Math.floor(i / 4) * 130}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={800}
                                fill="#0f172a"
                            >
                                {i + 1}
                            </text>
                        </motion.g>
                    ))}
                    <text
                        x={1290}
                        y={680}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        8 møter i året
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Kort
                        x={1260}
                        y={430}
                        b={520}
                        tekst="Følger ikke nødvendigvis"
                        farge="#b91c1c"
                        str={34}
                    />
                    <Kort
                        x={1260}
                        y={510}
                        b={520}
                        tekst="hvor mye folk sparer"
                        farge="#b91c1c"
                        str={34}
                    />
                </motion.g>
            )}
        </g>
    );
}

function Lav({ beat }: { beat: number }) {
    const laan = beat >= 1 ? 440 : 220;
    const sparing = beat >= 2 ? 110 : 240;
    return (
        <g>
            <Soyle x={700} hoyde={laan} farge="#1d4ed8" etikett="Lån" />
            <Soyle x={920} hoyde={sparing} farge="#d4a017" etikett="Sparing" />
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Kort x={700} y={230} b={260} tekst="Billig!" farge="#1d4ed8" str={40} />
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <polygon
                        points="1060,700 1060,420 1010,420 1100,300 1190,420 1140,420 1140,700"
                        fill="#dc2626"
                    />
                    <text
                        x={1100}
                        y={790}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#b91c1c"
                    >
                        Prisene
                    </text>
                </motion.g>
            )}
            {beat >= 3 && <Boble />}
        </g>
    );
}

function Boble() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Et hus med en ballong som blåses opp */}
            <rect
                x={1300}
                y={620}
                width={170}
                height={140}
                fill="#fef3c7"
                stroke="#92400e"
                strokeWidth={4}
            />
            <polygon points="1285,620 1385,540 1485,620" fill="#9a3412" />
            <line x1={1385} y1={540} x2={1385} y2={470} stroke="#334155" strokeWidth={4} />
            <motion.ellipse
                cx={1385}
                cy={370}
                fill="#f472b6"
                fillOpacity={0.8}
                stroke="#be185d"
                strokeWidth={4}
                initial={{ rx: 30, ry: 36 }}
                animate={{ rx: 110, ry: 105 }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
            />
            <text
                x={1385}
                y={385}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill="#831843"
            >
                Boble
            </text>
            <text
                x={1385}
                y={815}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill="#0f172a"
            >
                Boligpriser
            </text>
        </motion.g>
    );
}

function Fartsmaler({ beat }: { beat: number }) {
    // Nåla: fra høyt til lavt når økonomien bremser.
    const vinkel = beat >= 1 ? 200 : 320;
    const rad = (vinkel * Math.PI) / 180;
    const cx = 820;
    const cy = 600;
    return (
        <g>
            <path
                d={`M ${cx - 200} ${cy} A 200 200 0 0 1 ${cx + 200} ${cy}`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={40}
            />
            <path
                d={`M ${cx - 200} ${cy} A 200 200 0 0 1 ${cx - 141} ${cy - 141}`}
                fill="none"
                stroke="#fca5a5"
                strokeWidth={40}
            />
            <path
                d={`M ${cx + 141} ${cy - 141} A 200 200 0 0 1 ${cx + 200} ${cy}`}
                fill="none"
                stroke="#86efac"
                strokeWidth={40}
            />
            <motion.line
                x1={cx}
                y1={cy}
                initial={false}
                animate={{ x2: cx + Math.cos(rad) * 170, y2: cy + Math.sin(rad) * 170 }}
                transition={{ type: 'spring', stiffness: 30, damping: 10 }}
                stroke="#0f172a"
                strokeWidth={12}
                strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={22} fill="#0f172a" />
            <text
                x={cx}
                y={cy + 80}
                textAnchor="middle"
                fontSize={38}
                fontWeight={800}
                fill="#0f172a"
            >
                Farten i økonomien
            </text>
        </g>
    );
}

function Hoy({ beat }: { beat: number }) {
    return (
        <g>
            <Fartsmaler beat={beat} />
            <motion.g initial={false} animate={{ opacity: 1 }}>
                <Kort x={820} y={250} b={360} tekst="Dyrt å låne" farge="#b91c1c" str={42} />
            </motion.g>
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Fabrikken med stengt port */}
                    <rect
                        x={1100}
                        y={420}
                        width={380}
                        height={260}
                        fill="#cbd5e1"
                        stroke="#334155"
                        strokeWidth={4}
                    />
                    <polygon
                        points="1100,420 1180,350 1180,420 1260,350 1260,420 1340,350 1340,420 1480,420"
                        fill="#94a3b8"
                        stroke="#334155"
                        strokeWidth={4}
                    />
                    <rect x={1240} y={560} width={110} height={120} fill="#475569" />
                    <line x1={1240} y1={560} x2={1350} y2={680} stroke="#dc2626" strokeWidth={10} />
                    <line x1={1350} y1={560} x2={1240} y2={680} stroke="#dc2626" strokeWidth={10} />
                    <Folk x={1130} y={790} antall={4} farge="#64748b" skala={0.8} />
                    <text
                        x={1290}
                        y={850}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Vil jobbe, får ikke jobb
                    </text>
                </motion.g>
            )}
        </g>
    );
}

export function InflasjonRenten({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'naturlig';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-slate-100">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tekst}
                        x={900}
                        y={95}
                        textAnchor="middle"
                        fontSize={58}
                        fontWeight={800}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {tekst}
                    </motion.text>
                </AnimatePresence>
                <Skala modus={modus} beat={beat} />
                {modus === 'naturlig' && <Naturlig beat={beat} />}
                {modus === 'styring' && <Styring beat={beat} />}
                {modus === 'lav' && <Lav beat={beat} />}
                {modus === 'hoy' && <Hoy beat={beat} />}
            </svg>
        </div>
    );
}
