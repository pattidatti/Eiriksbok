import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Skåler og kort. «ingen»: det religion ofte har i dag, det åsatrua ikke hadde, og det den
 * handlet om. «avtale»: vekta der du gir et blot og håper å få noe igjen. «havamal»: diktet
 * Håvamål, rådene, og vekta der vennskap og ettermæle veier mer enn rikdom.
 */

type Modus = 'ingen' | 'avtale' | 'havamal';

const B = 1600;
const H = 900;
const BAKGRUNN = '#f6f1e7';

function Tittel({ tekst, y = 120 }: { tekst: string; y?: number }) {
    return (
        <text x={B / 2} y={y} textAnchor="middle" fontSize={68} fontWeight={900} fill="#0f172a">
            {tekst}
        </text>
    );
}

/** Rødt kryss i en sirkel (ved siden av teksten, aldri over den). */
function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={34} fill="#dc2626" />
            <path d="M -14 -14 L 14 14 M 14 -14 L -14 14" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
        </g>
    );
}

function Hake({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={34} fill="#0d9488" />
            <path d="M -15 2 L -4 13 L 16 -11" stroke="#fff" strokeWidth={8} strokeLinecap="round" fill="none" />
        </g>
    );
}

/** Kort med tekst. Bredden følger teksten. */
function Kort({
    x,
    y,
    tekst,
    fyll = '#fff',
    farge = '#0f172a',
    str = 50,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tekst: string;
    fyll?: string;
    farge?: string;
    str?: number;
    forsinkelse?: number;
}) {
    const w = Math.max(220, tekst.length * str * 0.6 + 80);
    const h = str * 2;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse }}>
            <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={22} fill={fyll} stroke="#cbd5e1" strokeWidth={3} />
            <text x={x} y={y + str * 0.35} textAnchor="middle" fontSize={str} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Ingen({ beat, d }: { beat: number; d: (s: number) => number }) {
    if (beat === 0)
        return (
            <g>
                <Tittel tekst="Religion i dag?" />
                {['hellige bøker', 'prester', 'regler'].map((t, i) => (
                    <Kort key={t} x={340 + i * 460} y={440} tekst={t} forsinkelse={d(0.6 + i * 0.6)} />
                ))}
            </g>
        );
    if (beat === 1)
        return (
            <g>
                <Tittel tekst="Åsatrua hadde ingen" />
                {['bibel', 'pave', 'ti bud'].map((t, i) => (
                    <motion.g
                        key={t}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: d(0.6 + i * 0.7) }}
                    >
                        <Kort x={700} y={290 + i * 190} tekst={t} fyll="#f1f5f9" farge="#475569" />
                        <Kryss x={940} y={290 + i * 190} />
                    </motion.g>
                ))}
            </g>
        );
    return (
        <g>
            <Tittel tekst="Det handlet om" />
            <Kort x={520} y={420} tekst="skikker" fyll="#fde68a" str={72} forsinkelse={d(0.5)} />
            <Kort x={1080} y={420} tekst="handlinger" fyll="#fde68a" str={72} forsinkelse={d(1.2)} />
            <motion.text
                x={B / 2}
                y={690}
                textAnchor="middle"
                fontSize={46}
                fontWeight={700}
                fill="#475569"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d(2.2) }}
            >
                mer enn hva du trodde inni deg
            </motion.text>
        </g>
    );
}

const FJÆR = { type: 'spring', stiffness: 60, damping: 14 } as const;

/** Én skål som henger fra enden av armen (x, y), med innholdet stablet i skålen. */
function Skaal({
    x,
    y,
    innhold,
    tittel,
}: {
    x: number;
    y: number;
    innhold: { tekst: string; fyll: string }[];
    tittel: string;
}) {
    return (
        <motion.g initial={false} animate={{ y }} transition={FJÆR}>
                <line x1={x - 150} y1={250} x2={x} y2={0} stroke="#78716c" strokeWidth={4} />
                <line x1={x + 150} y1={250} x2={x} y2={0} stroke="#78716c" strokeWidth={4} />
                <path d={`M ${x - 190} 250 Q ${x} 330 ${x + 190} 250 Z`} fill="#a16207" />
                {innhold.map((t, i) => (
                    <motion.g
                        key={t.tekst}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.6 }}
                    >
                        <rect
                            x={x - 160}
                            y={186 - i * 64}
                            width={320}
                            height={58}
                            rx={14}
                            fill={t.fyll}
                            stroke="#78350f"
                            strokeWidth={2}
                        />
                        <text x={x} y={226 - i * 64} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a">
                            {t.tekst}
                        </text>
                    </motion.g>
                ))}
                <text x={x} y={380} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                    {tittel}
                </text>
            </motion.g>
    );
}

/**
 * En skålvekt. `vinkel` i grader: positiv senker venstre skål. Skålene henger rett ned
 * fra endene av armen, og innholdet ligger i skålene.
 */
function Vekt({
    vinkel,
    venstre,
    hoyre,
    venstreTittel,
    hoyreTittel,
}: {
    vinkel: number;
    venstre: { tekst: string; fyll: string }[];
    hoyre: { tekst: string; fyll: string }[];
    venstreTittel: string;
    hoyreTittel: string;
}) {
    const cx = 800;
    const cy = 300;
    const L = 440;
    const r = (vinkel * Math.PI) / 180;
    const dy = Math.sin(r) * L;
    const dx = Math.cos(r) * L;
    return (
        <g>
            <path d={`M ${cx - 90} 860 L ${cx + 90} 860 L ${cx + 20} ${cy} L ${cx - 20} ${cy} Z`} fill="#57534e" />
            <motion.line
                initial={false}
                animate={{ x1: cx - dx, y1: cy + dy, x2: cx + dx, y2: cy - dy }}
                transition={FJÆR}
                stroke="#44403c"
                strokeWidth={16}
                strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={18} fill="#facc15" />
            <Skaal x={cx - dx} y={cy + dy} innhold={venstre} tittel={venstreTittel} />
            <Skaal x={cx + dx} y={cy - dy} innhold={hoyre} tittel={hoyreTittel} />
        </g>
    );
}

const GIR = [
    { tekst: 'en gjenstand', fyll: '#e7e5e4' },
    { tekst: 'et dyr', fyll: '#fecaca' },
    { tekst: 'mat og drikke', fyll: '#fde68a' },
];
const FAAR = [
    { tekst: 'god avling', fyll: '#bbf7d0' },
    { tekst: 'krigslykke', fyll: '#bfdbfe' },
];

function Avtale({ beat }: { beat: number }) {
    const vinkel = beat === 1 ? 9 : 0;
    return (
        <g>
            <Tittel tekst={beat === 3 ? 'Gi for å få igjen' : beat >= 1 ? 'Blot: et offer' : 'En avtale med maktene'} y={110} />
            <Vekt
                vinkel={vinkel}
                venstre={beat >= 1 ? GIR : []}
                hoyre={beat >= 2 ? FAAR : []}
                venstreTittel={beat >= 1 ? 'du gir' : 'menneskene'}
                hoyreTittel={beat >= 2 ? 'du håper å få' : 'gudene og maktene'}
            />
        </g>
    );
}

function Havamal({ beat, d }: { beat: number; d: (s: number) => number }) {
    if (beat === 0)
        return (
            <g>
                <Tittel tekst="Alt dør" y={150} />
                {['buskapen', 'slektningene', 'du selv'].map((t, i) => (
                    <Kort key={t} x={360 + i * 440} y={330} tekst={t} fyll="#e2e8f0" farge="#334155" forsinkelse={d(0.4 + i * 0.5)} />
                ))}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(2.6) }}>
                    <rect x={260} y={490} width={1080} height={130} rx={30} fill="#facc15" />
                    <text x={B / 2} y={575} textAnchor="middle" fontSize={62} fontWeight={900} fill="#0f172a">
                        Men et godt ettermæle dør aldri
                    </text>
                </motion.g>
                <motion.text
                    x={B / 2}
                    y={720}
                    textAnchor="middle"
                    fontSize={34}
                    fontStyle="italic"
                    fill="#57534e"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: d(3.4) }}
                >
                    «Døyr fe; døyr frendar; døyr sjølv det same.»
                </motion.text>
                <motion.text
                    x={B / 2}
                    y={780}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#78716c"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: d(3.4) }}
                >
                    Håvamål 76, omsatt i 1905
                </motion.text>
            </g>
        );
    if (beat === 1)
        return (
            <g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.3) }}>
                    <rect x={220} y={150} width={560} height={620} rx={20} fill="#fef3c7" stroke="#a16207" strokeWidth={6} />
                    <rect x={190} y={130} width={620} height={46} rx={23} fill="#a16207" />
                    <rect x={190} y={744} width={620} height={46} rx={23} fill="#a16207" />
                    {Array.from({ length: 9 }, (_, i) => (
                        <rect key={i} x={290} y={230 + i * 55} width={i % 3 === 2 ? 260 : 420} height={14} rx={7} fill="#d6b77a" />
                    ))}
                </motion.g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(0.8) }}>
                    <text x={1150} y={250} textAnchor="middle" fontSize={84} fontWeight={900} fill="#0f172a">
                        Håvamål
                    </text>
                    <text x={1150} y={320} textAnchor="middle" fontSize={44} fontWeight={700} fill="#475569">
                        Den høyes tale
                    </text>
                </motion.g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(1.8) }}>
                    <text x={1150} y={490} textAnchor="middle" fontSize={120} fontWeight={900} fill="#a16207">
                        164
                    </text>
                    <text x={1150} y={550} textAnchor="middle" fontSize={44} fontWeight={800} fill="#0f172a">
                        strofer
                    </text>
                </motion.g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(3.2) }}>
                    <rect x={900} y={630} width={500} height={100} rx={24} fill="#1e293b" />
                    <text x={1150} y={696} textAnchor="middle" fontSize={46} fontWeight={900} fill="#fff">
                        Håve = Odin
                    </text>
                </motion.g>
            </g>
        );
    if (beat === 2)
        return (
            <g>
                <Tittel tekst="Håvamål gir" />
                <Kort x={680} y={340} tekst="bud" fyll="#f1f5f9" farge="#475569" str={64} forsinkelse={d(0.5)} />
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(1)}}>
                    <Kryss x={900} y={340} />
                </motion.g>
                <Kort x={680} y={560} tekst="råd" fyll="#fde68a" str={64} forsinkelse={d(1.8)} />
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(2.3) }}>
                    <Hake x={900} y={560} />
                </motion.g>
                <motion.text
                    x={B / 2}
                    y={760}
                    textAnchor="middle"
                    fontSize={42}
                    fontWeight={700}
                    fill="#475569"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: d(3)}}
                >
                    om å klare seg blant folk, og å overleve
                </motion.text>
            </g>
        );
    if (beat === 3)
        return (
            <g>
                <Tittel tekst="Rådene" />
                {['vær gjestfri', 'vær lojal', 'hold måte'].map((t, i) => (
                    <Kort key={t} x={B / 2} y={300 + i * 180} tekst={t} fyll="#bbf7d0" str={60} forsinkelse={d(0.5 + i * 1.1)} />
                ))}
            </g>
        );
    if (beat === 4)
        return (
            <g>
                <Tittel tekst="Pass deg for" />
                {['dumskap', 'å stole for mye på folk'].map((t, i) => (
                    <Kort key={t} x={B / 2} y={290 + i * 170} tekst={t} fyll="#fecaca" str={56} forsinkelse={d(0.5 + i * 1)} />
                ))}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d(2.6) }}>
                    <text x={B / 2} y={680} textAnchor="middle" fontSize={36} fontStyle="italic" fill="#57534e">
                        «Betre byrdi du ber 'kje i bakken enn mannavit mykje.»
                    </text>
                    <text x={B / 2} y={740} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                        Ingen bedre oppakning enn mye vett
                    </text>
                    <text x={B / 2} y={795} textAnchor="middle" fontSize={28} fontWeight={700} fill="#78716c">
                        Håvamål 10
                    </text>
                </motion.g>
            </g>
        );
    return (
        <g>
            <Tittel tekst="Hva veier mest?" y={110} />
            <Vekt
                vinkel={11}
                venstre={[
                    { tekst: 'vennskap', fyll: '#bbf7d0' },
                    { tekst: 'godt ettermæle', fyll: '#fde68a' },
                ]}
                hoyre={[{ tekst: 'rikdom', fyll: '#fef9c3' }]}
                venstreTittel="veier mest"
                hoyreTittel="veier mindre"
            />
        </g>
    );
}

export function AsatroVekt({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'ingen';
    const d = (s: number) => (playing ? s : 0);
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: BAKGRUNN }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'avtale' ? (
                    <Avtale beat={beat} />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.g
                            key={`${modus}-${beat}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: d(0.35) }}
                        >
                            {modus === 'ingen' ? <Ingen beat={beat} d={d} /> : <Havamal beat={beat} d={d} />}
                        </motion.g>
                    </AnimatePresence>
                )}
            </svg>
        </div>
    );
}
