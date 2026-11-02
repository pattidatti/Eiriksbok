import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './Overskrift';

/**
 * Hvor kommer keiserens makt fra? Keiseren står i midten, og det som gir ham rett til å
 * styre, står over ham med piler ned.
 * - princeps: toga, Senatet og folket. Så tar hæren over, og keiserne byttes fort ut.
 * - dominus: purpur, diadem, knefall, Jupiter og Hercules, vakter rundt.
 * - gud: én Gud over keiseren. Opprør mot keiseren blir opprør mot Gud.
 * - bot: keiseren på kne foran biskopen. Kirken står over keiseren.
 */

type Modus = 'princeps' | 'dominus' | 'gud' | 'bot';

const B = 1600;
const H = 900;
const ROD = '#9f1239';
const GULL = '#b45309';
const LILLA = '#6d28d9';
const GULV = 760;

export function LegitimitetKilde({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'princeps';

    const kappe =
        modus === 'princeps' ? '#f8fafc' : modus === 'dominus' && beat === 0 ? '#f8fafc' : '#6b21a8';
    const diadem = modus === 'dominus' ? beat >= 1 : modus === 'gud';
    const bakgrunn = modus === 'bot' ? '#e7e0d3' : modus === 'gud' ? '#f5efe0' : '#efe7d8';

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: bakgrunn }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Gulv og søyler bak */}
                <rect x={0} y={GULV} width={B} height={H - GULV} fill="#d6c7aa" />
                {[160, 360, 1240, 1440].map((x) => (
                    <g key={x} opacity={0.5}>
                        <rect x={x - 26} y={280} width={52} height={GULV - 280} fill="#e9dfcb" stroke="#c2b28f" strokeWidth={3} />
                        <rect x={x - 40} y={262} width={80} height={22} fill="#e9dfcb" stroke="#c2b28f" strokeWidth={3} />
                    </g>
                ))}

                {modus === 'princeps' && <Princeps beat={beat} kappe={kappe} />}
                {modus === 'dominus' && <Dominus beat={beat} kappe={kappe} diadem={diadem} />}
                {modus === 'gud' && <Gud beat={beat} />}
                {modus === 'bot' && <Bot beat={beat} />}
            </svg>
            <Overskrift tekst={overskrift(modus, beat)} />
        </div>
    );
}

function overskrift(modus: Modus, beat: number) {
    if (modus === 'princeps') {
        return [
            'Princeps: den første borger',
            'Prinsipatet',
            'Makt fra Senatet og folket?',
            'Hæren bestemmer',
            'Keisere kommer og går',
        ][Math.min(beat, 4)];
    }
    if (modus === 'dominus') {
        return ['Mer enn en general', 'Skikker fra østen: diadem og knefall', 'Dominus: herre', 'Knyttet til gudene', 'Purpur, gull og vakter'][
            Math.min(beat, 4)
        ];
    }
    if (modus === 'gud') {
        return ['Et genialt trekk', 'Én Gud, full lojalitet', 'Opprør mot keiseren?', 'Opprør mot Gud'][Math.min(beat, 3)];
    }
    return ['Offentlig bot, år 390', 'Keiseren ber om tilgivelse', 'Maktbalansen skifter'][Math.min(beat, 2)];
}

/* ---------- Figurer ---------- */

function Keiser({
    x,
    kappe,
    diadem = false,
    kne = false,
    skala = 1,
    synlig = true,
}: {
    x: number;
    kappe: string;
    diadem?: boolean;
    kne?: boolean;
    skala?: number;
    synlig?: boolean;
}) {
    const s = skala * 1.4;
    const h = (kne ? 190 : 300) * s;
    const top = GULV - h;
    const hode = 46 * s;
    return (
        <motion.g initial={false} animate={{ opacity: synlig ? 1 : 0 }} transition={{ duration: 0.6 }}>
            <motion.path
                initial={false}
                animate={{
                    d: `M ${x - 90 * s} ${GULV} L ${x - 60 * s} ${top + hode * 2} Q ${x} ${top + hode * 1.5} ${x + 60 * s} ${top + hode * 2} L ${x + 90 * s} ${GULV} Z`,
                    fill: kappe,
                }}
                transition={{ duration: 0.8 }}
                stroke="#57534e"
                strokeWidth={4}
            />
            {/* Kappe over skulderen */}
            <motion.path
                initial={false}
                animate={{
                    d: `M ${x - 58 * s} ${top + hode * 2.1} L ${x + 30 * s} ${GULV - 40 * s} L ${x + 70 * s} ${GULV - 40 * s} L ${x + 58 * s} ${top + hode * 2.1} Z`,
                    fill: kappe === '#f8fafc' ? '#e2e8f0' : '#a16207',
                }}
                transition={{ duration: 0.8 }}
                opacity={0.8}
            />
            <motion.circle initial={false} animate={{ cy: top + hode }} cx={x} r={hode} fill="#f2c9a0" stroke="#57534e" strokeWidth={4} />
            {diadem && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <rect x={x - hode} y={top + hode * 0.35} width={hode * 2} height={hode * 0.32} rx={6} fill="#facc15" stroke={GULL} strokeWidth={3} />
                    <circle cx={x} cy={top + hode * 0.5} r={hode * 0.18} fill={ROD} />
                </motion.g>
            )}
        </motion.g>
    );
}

function Liten({ x, farge, kne = false, opacity = 1 }: { x: number; farge: string; kne?: boolean; opacity?: number }) {
    const h = kne ? 115 : 185;
    const top = GULV - h;
    return (
        <g opacity={opacity}>
            <path d={`M ${x - 44} ${GULV} L ${x - 30} ${top + 50} L ${x + 30} ${top + 50} L ${x + 44} ${GULV} Z`} fill={farge} stroke="#57534e" strokeWidth={3} />
            <circle cx={x} cy={top + 25} r={25} fill="#e8b98c" stroke="#57534e" strokeWidth={3} />
        </g>
    );
}

function Boks({
    x,
    y,
    tekst,
    farge,
    forsinkelse = 0,
    bredde,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    forsinkelse?: number;
    bredde?: number;
}) {
    const b = bredde ?? tekst.length * 29 + 70;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.5 }}>
            <rect x={x - b / 2} y={y - 46} width={b} height={92} rx={22} fill="#ffffff" stroke={farge} strokeWidth={5} />
            <text x={x} y={y + 17} textAnchor="middle" fontSize={50} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Pil({ fra, til, farge, forsinkelse = 0 }: { fra: [number, number]; til: [number, number]; farge: string; forsinkelse?: number }) {
    const vinkel = Math.atan2(til[1] - fra[1], til[0] - fra[0]);
    const s = 22;
    const a1 = [til[0] - Math.cos(vinkel - 0.45) * s, til[1] - Math.sin(vinkel - 0.45) * s];
    const a2 = [til[0] - Math.cos(vinkel + 0.45) * s, til[1] - Math.sin(vinkel + 0.45) * s];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.6 }}>
            <line x1={fra[0]} y1={fra[1]} x2={til[0]} y2={til[1]} stroke={farge} strokeWidth={8} strokeLinecap="round" />
            <path d={`M ${til[0]} ${til[1]} L ${a1[0]} ${a1[1]} L ${a2[0]} ${a2[1]} Z`} fill={farge} />
        </motion.g>
    );
}

function Merkelapp({ x, y, tekst, farge = '#334155', str = 46 }: { x: number; y: number; tekst: string; farge?: string; str?: number }) {
    return (
        <motion.text
            key={tekst}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={800}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {tekst}
        </motion.text>
    );
}

function Spyd({ x, forsinkelse }: { x: number; forsinkelse: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.4 }}>
            <line x1={x} y1={GULV} x2={x + 40} y2={250} stroke="#78350f" strokeWidth={9} strokeLinecap="round" />
            <path d={`M ${x + 40} ${250} l -14 18 l 18 -46 l 10 50 Z`} fill="#64748b" />
        </motion.g>
    );
}

/* ---------- Modusene ---------- */

function Princeps({ beat, kappe }: { beat: number; kappe: string }) {
    const bytte = beat >= 4;
    return (
        <>
            {!bytte && <Keiser x={800} kappe={kappe} />}
            {bytte &&
                [0, 1, 2, 3, 4].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: i === 4 ? [0, 1, 1, 1] : [0, 1, 1, 0] }}
                        transition={{ delay: i * 1.1, duration: 1.1, times: [0, 0.15, 0.75, 1] }}
                    >
                        <Keiser x={800} kappe={['#f8fafc', '#fde68a', '#fecaca', '#bfdbfe', '#ddd6fe'][i]} />
                    </motion.g>
                ))}
            {bytte && (
                <g>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 1.1 + 0.9 }}>
                            <path
                                d={`M ${1060 + i * 100} 330 l 0 -56 l 22 25 l 22 -40 l 22 40 l 22 -25 l 0 56 Z`}
                                fill="#facc15"
                                stroke={GULL}
                                strokeWidth={3}
                            />
                            <line x1={1052 + i * 100} y1={250} x2={1156 + i * 100} y2={340} stroke={ROD} strokeWidth={7} />
                        </motion.g>
                    ))}
                </g>
            )}
            {beat <= 1 && <Merkelapp x={800} y={250} tekst={beat === 0 ? 'Augustus, fra år 27 fvt.' : 'Vanlig romersk toga'} />}
            {beat === 2 && (
                <>
                    <Boks x={420} y={250} tekst="Senatet" farge={ROD} />
                    <Boks x={1180} y={250} tekst="Folket" farge={ROD} forsinkelse={0.4} />
                    <Pil fra={[470, 300]} til={[680, 400]} farge={ROD} forsinkelse={0.8} />
                    <Pil fra={[1130, 300]} til={[920, 400]} farge={ROD} forsinkelse={1.1} />
                </>
            )}
            {beat >= 3 && (
                <>
                    {[170, 260, 350, 440].map((x, i) => (
                        <Spyd key={x} x={x} forsinkelse={beat === 3 ? i * 0.2 : 0} />
                    ))}
                    {[180, 270, 360, 450].map((x) => (
                        <Liten key={x} x={x} farge="#b91c1c" />
                    ))}
                    <Boks x={320} y={210} tekst="Hæren" farge={ROD} />
                    {beat === 3 && <Pil fra={[520, 540]} til={[660, 540]} farge={ROD} forsinkelse={0.6} />}
                    {beat === 3 && <Merkelapp x={1180} y={280} tekst="200-tallet: krise etter krise" />}
                </>
            )}
        </>
    );
}

function Dominus({ beat, kappe, diadem }: { beat: number; kappe: string; diadem: boolean }) {
    const medkeiser = beat >= 3;
    const kx = medkeiser ? 560 : 800;
    return (
        <>
            {/* Trone-plattform */}
            <motion.rect initial={false} animate={{ x: kx - 160 }} y={GULV - 10} width={320} height={30} fill="#a16207" />
            <motion.g initial={false} animate={{ x: kx - 800 }} transition={{ duration: 0.8 }}>
                <Keiser x={800} kappe={kappe} diadem={diadem} />
            </motion.g>
            {beat === 0 && <Merkelapp x={800} y={250} tekst="Diokletian, keiser 284-305" />}
            {beat >= 1 && beat <= 2 &&
                [330, 460, 1140, 1270].map((x) => <Liten key={x} x={x} farge="#94a3b8" kne />)}
            {beat === 1 && <Merkelapp x={800} y={250} tekst="Diadem: et smykke som en krone" />}
            {beat === 2 && <Boks x={800} y={240} tekst="DOMINUS = herre" farge={LILLA} />}
            {medkeiser && (
                <>
                    <Keiser x={1060} kappe="#6b21a8" diadem skala={0.85} />
                    <Boks x={560} y={210} tekst="Jupiter" farge={GULL} />
                    <Lyn x={330} />
                    <Boks x={1060} y={210} tekst="Hercules" farge={GULL} forsinkelse={0.5} />
                    <Merkelapp x={1060} y={380} tekst="Maximian" str={40} />
                    <Merkelapp x={560} y={310} tekst="Diokletian" str={40} />
                </>
            )}
            {beat >= 4 &&
                [110, 200, 1400, 1490].map((x, i) => (
                    <motion.g key={x} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}>
                        <line x1={x + 30} y1={GULV} x2={x + 30} y2={520} stroke="#78350f" strokeWidth={6} />
                        <Liten x={x} farge="#475569" />
                    </motion.g>
                ))}
        </>
    );
}

function Lyn({ x }: { x: number }) {
    return (
        <motion.path
            d={`M ${x + 70} 130 l -40 70 l 30 0 l -40 76 l 74 -96 l -32 0 l 32 -50 Z`}
            fill="#facc15"
            stroke={GULL}
            strokeWidth={3}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
        />
    );
}

function ChiRho({ x, y, s }: { x: number; y: number; s: number }) {
    return (
        <g stroke={GULL} strokeWidth={s * 0.12} strokeLinecap="round" fill="none">
            <line x1={x} y1={y - s} x2={x} y2={y + s} />
            <path d={`M ${x} ${y - s} q ${s * 0.75} ${s * 0.05} ${s * 0.6} ${s * 0.45} q -${s * 0.15} ${s * 0.35} -${s * 0.6} ${s * 0.3}`} />
            <line x1={x - s * 0.6} y1={y - s * 0.3} x2={x + s * 0.6} y2={y + s * 0.6} />
            <line x1={x + s * 0.6} y1={y - s * 0.3} x2={x - s * 0.6} y2={y + s * 0.6} />
        </g>
    );
}

function Gud({ beat }: { beat: number }) {
    const kx = beat >= 2 ? 960 : 800;
    return (
        <>
            {/* Lys ovenfra */}
            <motion.path
                d={`M ${kx - 60} 120 L ${kx + 60} 120 L ${kx + 200} ${GULV} L ${kx - 200} ${GULV} Z`}
                fill="#fde68a"
                initial={false}
                animate={{ opacity: beat >= 1 ? 0.6 : 0.25, d: `M ${kx - 60} 120 L ${kx + 60} 120 L ${kx + 200} ${GULV} L ${kx - 200} ${GULV} Z` }}
                transition={{ duration: 0.8 }}
            />
            <motion.g initial={false} animate={{ x: kx - 800 }} transition={{ duration: 0.8 }}>
                <Keiser x={800} kappe="#6b21a8" diadem />
                <circle cx={800} cy={240} r={66} fill="#ffffff" stroke={GULL} strokeWidth={5} />
                <ChiRho x={800} y={240} s={42} />
            </motion.g>
            {beat === 0 && <Merkelapp x={1250} y={330} tekst="Konstantin" farge={LILLA} str={50} />}
            {beat === 1 && (
                <Merkelapp x={1250} y={330} tekst="Én Gud som kunne alt" farge={GULL} str={48} />
            )}
            {beat >= 2 && (
                <>
                    {[200, 300, 400].map((x) => (
                        <Liten key={x} x={x} farge="#64748b" />
                    ))}
                    <Pil fra={[470, 620]} til={[820, 620]} farge={ROD} />
                    <Merkelapp x={300} y={500} tekst="Opprør" farge={ROD} str={50} />
                </>
            )}
            {beat >= 3 && (
                <>
                    <Pil fra={[470, 560]} til={[880, 280]} farge={ROD} forsinkelse={0.3} />
                    <Boks x={1330} y={280} tekst="Mot Gud selv" farge={ROD} forsinkelse={0.6} />
                    <Boks x={1320} y={420} tekst="Kirkens beskytter" farge={GULL} forsinkelse={1.6} bredde={540} />
                    <Boks x={1320} y={530} tekst="og leder" farge={GULL} forsinkelse={1.9} bredde={300} />
                </>
            )}
        </>
    );
}

function Bot({ beat }: { beat: number }) {
    return (
        <>
            {/* Trinn der biskopen står */}
            <rect x={880} y={GULV - 80} width={360} height={80} fill="#b8a585" />
            <Biskop x={1060} />
            <Keiser x={600} kappe="#6b21a8" kne />
            {beat < 2 && <Merkelapp x={600} y={440} tekst="Theodosius" />}
            <Merkelapp x={1060} y={330} tekst="Ambrosius" />
            {beat >= 1 &&
                [90, 190, 290, 1340, 1440, 1530].map((x, i) => (
                    <motion.g key={x} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}>
                        <Liten x={x} farge={['#94a3b8', '#a8a29e', '#9ca3af'][i % 3]} />
                    </motion.g>
                ))}
            {beat >= 2 && (
                <>
                    <Boks x={1060} y={230} tekst="Kirken" farge={GULL} />
                    <Boks x={600} y={420} tekst="Keiseren" farge={LILLA} forsinkelse={0.3} />
                    <Pil fra={[960, 260]} til={[720, 370]} farge={GULL} forsinkelse={0.6} />
                </>
            )}
        </>
    );
}

function Biskop({ x }: { x: number }) {
    const fot = GULV - 80;
    const top = fot - 290;
    return (
        <g>
            <path d={`M ${x - 80} ${fot} L ${x - 55} ${top + 100} L ${x + 55} ${top + 100} L ${x + 80} ${fot} Z`} fill="#f8fafc" stroke="#57534e" strokeWidth={4} />
            <rect x={x - 14} y={top + 110} width={28} height={fot - top - 120} fill={GULL} opacity={0.8} />
            <circle cx={x} cy={top + 70} r={42} fill="#f2c9a0" stroke="#57534e" strokeWidth={4} />
            {/* Bispelue */}
            <path d={`M ${x - 36} ${top + 48} L ${x} ${top - 20} L ${x + 36} ${top + 48} Z`} fill="#f8fafc" stroke={GULL} strokeWidth={4} />
            {/* Stav */}
            <line x1={x + 110} y1={fot} x2={x + 110} y2={top - 10} stroke={GULL} strokeWidth={9} />
            <path d={`M ${x + 110} ${top - 10} q 0 -40 -36 -36`} fill="none" stroke={GULL} strokeWidth={9} />
        </g>
    );
}
