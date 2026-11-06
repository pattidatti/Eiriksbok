import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift, Tekst, Vis } from './budsjettFelles';

/**
 * Jonas sine 10 000 kroner som én lang stolpe, i riktig målestokk (1300 px = 10 000 kr).
 * Fire moduser:
 * - faste: inntekten, nettolønn, og de faste utgiftene fra artikkelens tenkte eksempel
 *   (husleie 5000, mobil 300, busskort 500, fra HybelBudsjett) som låses.
 * - variable: de 4200 kronene som er igjen, delt på mat, klær og fritid (skisse uten beløp).
 * - buffer: to til tre månedslønner, regningen som velter, og noen hundrelapper i måneden.
 * - plan: de fem stegene, ett per beat, mens stolpen bygges opp i den rekkefølgen.
 */

type Modus = 'faste' | 'variable' | 'buffer' | 'plan';

const X0 = 150;
const BREDDE = 1300;
const KR = BREDDE / 10000;
const Y = 360;
const H = 140;

const INN = '#0d9488';
const FAST = '#64748b';
const BUFFER = '#0891b2';
const MAT = '#16a34a';
const KLAER = '#7c3aed';
const FRITID = '#f59e0b';

const HUSLEIE = 5000 * KR;
const MOBIL = 300 * KR;
const BUSS = 500 * KR;
const FASTE = HUSLEIE + MOBIL + BUSS;

const OVERSKRIFT: Record<Modus, string[]> = {
    faste: [
        'Inntekt: 10 000 kr',
        'Nettolønn: etter skatt',
        'Først: de faste utgiftene',
        'Tenk deg: husleie, mobil, buss',
        'Vanskelige å endre',
    ],
    variable: [
        'Tenkt eksempel: 4200 kr igjen',
        'Her velger du selv',
        'Variable utgifter',
        'Anslå ut fra før',
        'Her er det lettest å kutte',
    ],
    buffer: [
        'Buffer: to til tre månedslønner',
        'Uten buffer',
        'Mye for en 17-åring',
        'Noen hundrelapper i måneden',
        'Litt hver måned',
    ],
    plan: [
        'Start med én måned',
        'Steg 1: inntekten',
        'Steg 2: faste utgifter',
        'Steg 3: buffer',
        'Steg 4: fordel resten',
        'Steg 5: følg med',
    ],
};

/** Hengelås tegnet i SVG. */
function Laas({ x, y, vis }: { x: number; y: number; vis: boolean }) {
    return (
        <Vis vis={vis}>
            <path
                d={`M ${x - 14} ${y} L ${x - 14} ${y - 14} A 14 14 0 0 1 ${x + 14} ${y - 14} L ${x + 14} ${y}`}
                fill="none"
                stroke="#0f172a"
                strokeWidth={7}
            />
            <rect x={x - 24} y={y} width={48} height={38} rx={7} fill="#0f172a" />
            <circle cx={x} cy={y + 18} r={6} fill="#f8fafc" />
        </Vis>
    );
}

/** Én bit av stolpen, som vokser fram fra venstre. */
function Bit({
    x,
    b,
    farge,
    vis = true,
    forsinkelse = 0,
    stiplet = false,
    y = Y,
    h = H,
}: {
    x: number;
    b: number;
    farge: string;
    vis?: boolean;
    forsinkelse?: number;
    stiplet?: boolean;
    y?: number;
    h?: number;
}) {
    return (
        <motion.rect
            x={x}
            y={y}
            height={h}
            rx={10}
            fill={stiplet ? '#ffffff' : farge}
            stroke={stiplet ? farge : '#ffffff'}
            strokeWidth={stiplet ? 5 : 3}
            strokeDasharray={stiplet ? '16 10' : undefined}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: vis ? b : 0, opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.9, delay: vis ? forsinkelse : 0, ease: [0.22, 1, 0.36, 1] }}
        />
    );
}

/** Merkelapp under stolpen med en strek opp til biten. */
function Pil({
    x,
    tx = x,
    tekst,
    rad,
    farge,
    vis,
}: {
    x: number;
    tx?: number;
    tekst: string;
    rad: number;
    farge: string;
    vis: boolean;
}) {
    const y = Y + H + 70 + rad * 64;
    return (
        <Vis vis={vis}>
            <line x1={x} y1={Y + H + 6} x2={tx} y2={y - 34} stroke={farge} strokeWidth={4} />
            <text x={tx} y={y} textAnchor="middle" fontSize={36} fontWeight={800} fill={farge}>
                {tekst}
            </text>
        </Vis>
    );
}

// ---------- faste ----------

function Faste({ beat }: { beat: number }) {
    return (
        <g>
            <Bit x={X0} b={BREDDE} farge={INN} />
            <Tekst x={X0 + BREDDE / 2} y={Y - 30} str={44} farge={INN} vekt={900} vis={beat <= 1}>
                10 000 kr inn hver måned
            </Tekst>
            <Vis vis={beat === 1}>
                <rect x={330} y={570} width={940} height={150} rx={26} fill="#ffffff" stroke={INN} strokeWidth={4} />
                <Tekst x={800} y={632} str={40} vekt={900}>
                    Nettolønn
                </Tekst>
                <Tekst x={800} y={688} str={32} farge="#475569" vekt={700}>
                    det som faktisk kommer inn på kontoen etter skatt
                </Tekst>
            </Vis>
            <Vis vis={beat === 2}>
                <rect x={X0} y={Y} width={FASTE} height={H} rx={10} fill="#ffffff" fillOpacity={0.35} stroke="#0f172a" strokeWidth={5} strokeDasharray="18 12" />
                <Tekst x={X0 + FASTE / 2} y={Y - 30} str={40} vekt={900}>
                    Faste utgifter: ofte samme beløp
                </Tekst>
            </Vis>
            <Bit x={X0} b={HUSLEIE} farge={FAST} vis={beat >= 3} />
            <Bit x={X0 + HUSLEIE} b={MOBIL} farge="#475569" vis={beat >= 3} forsinkelse={0.5} />
            <Bit x={X0 + HUSLEIE + MOBIL} b={BUSS} farge="#334155" vis={beat >= 3} forsinkelse={0.9} />
            <Tekst x={X0 + HUSLEIE / 2} y={Y + 86} str={42} farge="#ffffff" vis={beat >= 3}>
                Husleie 5000 kr
            </Tekst>
            <Pil x={X0 + HUSLEIE + MOBIL / 2} tx={X0 + HUSLEIE - 120} tekst="Mobil 300 kr" rad={0} farge="#475569" vis={beat >= 3} />
            <Pil x={X0 + HUSLEIE + MOBIL + BUSS / 2} tx={X0 + HUSLEIE + MOBIL + BUSS / 2 + 190} tekst="Busskort 500 kr" rad={0} farge="#334155" vis={beat >= 3} />
            <Laas x={X0 + HUSLEIE / 2} y={Y - 90} vis={beat >= 4} />
            <Laas x={X0 + HUSLEIE + MOBIL / 2} y={Y - 90} vis={beat >= 4} />
            <Laas x={X0 + HUSLEIE + MOBIL + BUSS / 2 + 40} y={Y - 90} vis={beat >= 4} />
            <Vis vis={beat >= 4}>
                <rect x={X0 + HUSLEIE / 2 - 215} y={Y - 200} width={430} height={78} rx={20} fill="#0f172a" />
                <text x={X0 + HUSLEIE / 2} y={Y - 148} textAnchor="middle" fontSize={34} fontWeight={800} fill="#ffffff">
                    Husleiekontrakt
                </text>
            </Vis>
        </g>
    );
}

// ---------- variable ----------

const REST_X = X0 + FASTE;
const REST = BREDDE - FASTE;

function Variable({ beat }: { beat: number }) {
    const delt = beat >= 2;
    // Skisse: hvor stor hver bit er, er ikke et tall fra artikkelen.
    const vugg = beat === 3;
    const matB = beat >= 4 ? REST * 0.56 : REST * 0.46;
    const klaerB = REST * 0.22;
    const fritidB = REST - matB - klaerB;
    return (
        <g>
            <rect x={X0} y={Y} width={FASTE} height={H} rx={10} fill="#cbd5e1" />
            <Tekst x={X0 + FASTE / 2} y={Y + 86} str={40} farge="#475569">
                Faste: låst
            </Tekst>
            <Bit x={REST_X} b={REST} farge={INN} vis={!delt} />
            <Tekst x={REST_X + REST / 2} y={Y - 30} str={46} farge={INN} vekt={900} vis={!delt}>
                4200 kr igjen
            </Tekst>
            <Tekst x={REST_X + REST / 2} y={Y + 88} str={40} farge="#ffffff" vis={beat === 1}>
                Du velger
            </Tekst>
            {delt && (
                <g>
                    <motion.rect
                        x={REST_X}
                        y={Y}
                        height={H}
                        rx={10}
                        fill={MAT}
                        stroke="#ffffff"
                        strokeWidth={3}
                        initial={{ width: 0 }}
                        animate={{ width: vugg ? [matB, matB * 0.85, matB * 1.1, matB] : matB }}
                        transition={vugg ? { duration: 2.4, repeat: Infinity } : { duration: 0.9 }}
                    />
                    <motion.rect
                        y={Y}
                        height={H}
                        rx={10}
                        fill={KLAER}
                        stroke="#ffffff"
                        strokeWidth={3}
                        initial={{ x: REST_X, width: 0 }}
                        animate={{ x: REST_X + matB, width: klaerB }}
                        transition={{ duration: 0.9, delay: 0.3 }}
                    />
                    <motion.rect
                        y={Y}
                        height={H}
                        rx={10}
                        fill={FRITID}
                        stroke="#ffffff"
                        strokeWidth={3}
                        initial={{ x: REST_X, width: 0 }}
                        animate={{ x: REST_X + matB + klaerB, width: fritidB }}
                        transition={{ duration: 0.9, delay: 0.6 }}
                    />
                </g>
            )}
            <Tekst x={REST_X + matB / 2} y={Y - 30} str={38} farge={MAT} vis={delt}>
                Mat
            </Tekst>
            <Tekst x={REST_X + matB + klaerB / 2} y={Y - 30} str={38} farge={KLAER} vis={delt}>
                Klær
            </Tekst>
            <Tekst x={REST_X + matB + klaerB + fritidB / 2} y={Y - 30} str={38} farge="#b45309" vis={delt}>
                Fritid
            </Tekst>
            <Tekst x={800} y={Y + H + 70} str={34} farge="#475569" vekt={700} vis={beat === 2}>
                Endrer seg fra måned til måned: mat, klær, gaver, ferie, fritid
            </Tekst>
            <Vis vis={beat === 3}>
                <rect x={430} y={Y + H + 40} width={740} height={150} rx={24} fill="#ffffff" stroke="#94a3b8" strokeWidth={4} />
                <Tekst x={800} y={Y + H + 100} str={36} vekt={800}>
                    Hva brukte jeg forrige måned?
                </Tekst>
                <Tekst x={800} y={Y + H + 156} str={32} farge="#475569" vekt={700}>
                    Bruk det som anslag
                </Tekst>
            </Vis>
            <Vis vis={beat >= 4}>
                <rect x={260} y={Y + H + 40} width={480} height={150} rx={24} fill="#ffffff" stroke={FAST} strokeWidth={4} />
                <Tekst x={500} y={Y + H + 102} str={36} vekt={800} farge="#475569">
                    Husleia i morgen
                </Tekst>
                <Tekst x={500} y={Y + H + 156} str={34} vekt={900} farge="#e11d48">
                    kan ikke endres
                </Tekst>
                <rect x={860} y={Y + H + 40} width={480} height={150} rx={24} fill="#ffffff" stroke={MAT} strokeWidth={4} />
                <Tekst x={1100} y={Y + H + 102} str={36} vekt={800} farge="#475569">
                    Middag hjemme
                </Tekst>
                <Tekst x={1100} y={Y + H + 156} str={34} vekt={900} farge={MAT}>
                    i stedet for pizza
                </Tekst>
            </Vis>
            <Tekst x={1445} y={Y + H + 40} str={30} farge="#94a3b8" vekt={700} anker="end" vis={delt && beat < 4}>
                Skisse
            </Tekst>
        </g>
    );
}

// ---------- buffer ----------

const MND = ['Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'];

function Krukke({ x, y, fyll, etikett, farge }: { x: number; y: number; fyll: number; etikett: string; farge: string }) {
    const h = 220;
    return (
        <g>
            <motion.rect
                x={x - 85}
                width={170}
                rx={18}
                fill={farge}
                initial={{ height: 0, y: y + h }}
                animate={{ height: h * fyll, y: y + h - h * fyll }}
                transition={{ duration: 1 }}
            />
            <rect x={x - 90} y={y} width={180} height={h} rx={22} fill="none" stroke="#334155" strokeWidth={6} />
            <rect x={x - 70} y={y - 26} width={140} height={28} rx={8} fill="#334155" />
            <g>
                <text x={x} y={y + h + 52} textAnchor="middle" fontSize={36} fontWeight={900} fill={farge}>
                    {etikett}
                </text>
            </g>
        </g>
    );
}

function BufferModus({ beat }: { beat: number }) {
    return (
        <g>
            {/* To til tre månedslønner */}
            <Vis vis={beat <= 1}>
                {[0, 1, 2].map((i) => (
                    <g key={i}>
                        <Bit x={350} y={200 + i * 150} h={100} b={900} farge={BUFFER} stiplet={i === 2} forsinkelse={i * 0.4} />
                        <text x={330} y={265 + i * 150} textAnchor="end" fontSize={34} fontWeight={800} fill="#334155">
                            {`Månedslønn ${i + 1}`}
                        </text>
                    </g>
                ))}
                <Tekst x={1250} y={720} str={34} farge="#64748b" vekt={700} vis={beat === 0}>
                    Råd fra en forbrukerøkonom i Nordea
                </Tekst>
            </Vis>
            <Vis vis={beat === 1}>
                <rect x={0} y={150} width={1600} height={750} fill="#f8fafc" opacity={0.86} />
                <motion.g
                    initial={{ y: -260 }}
                    animate={{ y: beat === 1 ? 0 : -260 }}
                    transition={{ type: 'spring', stiffness: 90, damping: 12, delay: 0.4 }}
                >
                    <rect x={570} y={250} width={460} height={150} rx={18} fill="#e11d48" />
                    <text x={800} y={340} textAnchor="middle" fontSize={44} fontWeight={900} fill="#ffffff">
                        Uventet regning
                    </text>
                </motion.g>
                <rect x={350} y={460} width={900} height={110} rx={14} fill="#cbd5e1" />
                <text x={800} y={530} textAnchor="middle" fontSize={38} fontWeight={800} fill="#475569">
                    Ingen reserve
                </text>
                <Tekst x={800} y={680} str={42} farge="#e11d48" vekt={900}>
                    Kan nesten velte hele økonomien
                </Tekst>
            </Vis>

            {/* Jonas i det små */}
            <Vis vis={beat === 2 || beat === 3}>
                <Bit x={X0} b={BREDDE} y={240} h={110} farge={INN} vis={beat === 2 || beat === 3} />
                <Tekst x={X0 + BREDDE / 2} y={312} str={40} farge="#ffffff">
                    Jonas: 10 000 kr i måneden
                </Tekst>
            </Vis>
            <Vis vis={beat === 2}>
                <Tekst x={800} y={480} str={40} vekt={800}>
                    To slike som buffer? Det er mye.
                </Tekst>
                <Tekst x={800} y={560} str={40} farge={BUFFER} vekt={900}>
                    Men poenget er det samme i det små.
                </Tekst>
            </Vis>
            <Vis vis={beat === 3}>
                <Bit x={X0 + BREDDE - 110} b={110} y={240} h={110} farge={BUFFER} vis={beat === 3} forsinkelse={0.3} />
                <path d="M 1385 360 C 1300 420, 700 380, 520 440" fill="none" stroke={BUFFER} strokeWidth={6} strokeDasharray="10 10" />
                <Krukke x={400} y={430} fyll={0.55} etikett="Buffer" farge={BUFFER} />
                <Tekst x={400} y={760} str={30} farge="#475569" vekt={700}>
                    noen hundrelapper
                </Tekst>
                <rect x={760} y={460} width={330} height={120} rx={18} fill="#ffffff" stroke="#e11d48" strokeWidth={5} />
                <text x={925} y={535} textAnchor="middle" fontSize={36} fontWeight={900} fill="#e11d48">
                    Knust skjerm
                </text>
                <path d="M 590 540 L 740 520" stroke={BUFFER} strokeWidth={8} strokeLinecap="round" />
                <path d="M 720 500 L 744 520 L 722 544" fill="none" stroke={BUFFER} strokeWidth={8} strokeLinecap="round" />
                <rect x={1140} y={460} width={330} height={120} rx={18} fill={MAT} />
                <text x={1305} y={515} textAnchor="middle" fontSize={32} fontWeight={800} fill="#ffffff">
                    Middagen
                </text>
                <text x={1305} y={557} textAnchor="middle" fontSize={32} fontWeight={800} fill="#ffffff">
                    er trygg
                </text>
            </Vis>

            {/* Litt hver måned til klasseturen */}
            <Vis vis={beat >= 4}>
                {MND.map((m, i) => (
                    <g key={m}>
                        <text x={170 + i * 140} y={300} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                            {m}
                        </text>
                        <motion.circle
                            cx={170 + i * 140}
                            cy={350}
                            r={22}
                            fill="#f59e0b"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= 4 ? 1 : 0 }}
                            transition={{ delay: 0.4 + i * 0.35 }}
                        />
                    </g>
                ))}
                <path d="M 170 400 C 600 520, 900 520, 1250 560" fill="none" stroke="#cbd5e1" strokeWidth={6} strokeDasharray="12 12" />
                <Krukke x={1340} y={420} fyll={beat >= 4 ? 0.9 : 0} etikett="Klassetur" farge="#f59e0b" />
                <Tekst x={1340} y={360} str={32} farge="#475569" vekt={700}>
                    til våren
                </Tekst>
                <Tekst x={600} y={700} str={36} farge="#475569" vekt={700}>
                    Pengene er der når regningen kommer
                </Tekst>
            </Vis>
        </g>
    );
}

// ---------- plan ----------

const STEG = [
    { n: 1, tekst: 'Inntekten', x: 330 },
    { n: 2, tekst: 'Faste', x: 560 },
    { n: 3, tekst: 'Buffer', x: 800 },
    { n: 4, tekst: 'Fordel resten', x: 1060 },
    { n: 5, tekst: 'Følg med', x: 1320 },
];

const BUF_B = 90;

function Plan({ beat }: { beat: number }) {
    const restX = X0 + FASTE + BUF_B;
    const restB = BREDDE - FASTE - BUF_B;
    return (
        <g>
            <Vis vis={beat === 0}>
                {['Ark', 'Regneark', 'App i banken'].map((t, i) => (
                    <g key={t}>
                        <rect x={230 + i * 400} y={260} width={340} height={220} rx={26} fill="#ffffff" stroke="#94a3b8" strokeWidth={5} />
                        {[0, 1, 2].map((j) => (
                            <rect key={j} x={270 + i * 400} y={300 + j * 40} width={260 - j * 50} height={16} rx={8} fill="#cbd5e1" />
                        ))}
                        <text x={400 + i * 400} y={455} textAnchor="middle" fontSize={38} fontWeight={900} fill="#0f172a">
                            {t}
                        </text>
                    </g>
                ))}
                <rect x={560} y={560} width={480} height={100} rx={50} fill="#0f172a" />
                <Tekst x={800} y={624} str={40} farge="#ffffff">
                    Én måned om gangen
                </Tekst>
            </Vis>

            <Vis vis={beat >= 1}>
                <Bit x={X0} b={BREDDE} y={200} h={120} farge={INN} vis={beat >= 1} />
                <Bit x={X0} b={FASTE} y={200} h={120} farge={FAST} vis={beat >= 2} />
                <Bit x={X0 + FASTE} b={BUF_B} y={200} h={120} farge={BUFFER} vis={beat >= 3} />
                <Bit x={restX} b={restB * 0.5} y={200} h={120} farge={MAT} vis={beat >= 4} />
                <Bit x={restX + restB * 0.5} b={restB * 0.22} y={200} h={120} farge={KLAER} vis={beat >= 4} forsinkelse={0.3} />
                <Bit x={restX + restB * 0.72} b={restB * 0.28} y={200} h={120} farge={FRITID} vis={beat >= 4} forsinkelse={0.6} />
                <Tekst x={X0 + BREDDE / 2} y={276} str={40} farge="#ffffff" vis={beat === 1}>
                    Inntekt
                </Tekst>
                <Tekst x={X0 + FASTE / 2} y={276} str={40} farge="#ffffff" vis={beat >= 2}>
                    Faste
                </Tekst>
                <Tekst x={restX + restB / 2} y={176} str={32} farge="#334155" vis={beat >= 4}>
                    Mat, klær, fritid
                </Tekst>
                <Tekst x={X0 + FASTE + BUF_B / 2} y={176} str={32} farge={BUFFER} vis={beat >= 3}>
                    Buffer
                </Tekst>

                {/* Månedens gang */}
                <Vis vis={beat >= 5}>
                    <line x1={X0} y1={370} x2={X0 + BREDDE} y2={370} stroke="#94a3b8" strokeWidth={6} />
                    <motion.circle
                        cx={0}
                        cy={370}
                        r={18}
                        fill="#0f172a"
                        initial={{ x: X0 }}
                        animate={{ x: beat >= 5 ? X0 + BREDDE : X0 }}
                        transition={{ duration: 4, ease: 'linear' }}
                    />
                    <Tekst x={X0} y={420} str={28} farge="#475569" vekt={700} anker="start">
                        Lønningsdag
                    </Tekst>
                    <Tekst x={X0 + BREDDE} y={420} str={28} farge="#475569" vekt={700} anker="end">
                        Stemte planen? Juster.
                    </Tekst>
                </Vis>

                {STEG.map((s) => {
                    const aktiv = beat === s.n;
                    const ferdig = beat > s.n;
                    return (
                        <Vis key={s.n} vis={beat >= s.n}>
                            <circle cx={s.x} cy={560} r={52} fill={aktiv ? '#0f172a' : ferdig ? INN : '#e2e8f0'} />
                            <text x={s.x} y={578} textAnchor="middle" fontSize={50} fontWeight={900} fill="#ffffff">
                                {String(s.n)}
                            </text>
                            <text x={s.x} y={670} textAnchor="middle" fontSize={34} fontWeight={800} fill={aktiv ? '#0f172a' : '#64748b'}>
                                {s.tekst}
                            </text>
                        </Vis>
                    );
                })}
            </Vis>
        </g>
    );
}

export function BudsjettKroner({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'faste';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Overskrift tekst={tekst} />
                {modus === 'faste' && <Faste beat={beat} />}
                {modus === 'variable' && <Variable beat={beat} />}
                {modus === 'buffer' && <BufferModus beat={beat} />}
                {modus === 'plan' && <Plan beat={beat} />}
            </svg>
        </div>
    );
}
