import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift, Tekst, Vis } from './budsjettFelles';
import { kortBredde, useGlidTall } from './budsjettHjelp';

/**
 * Budsjettet som tavle. Fire moduser:
 * - hvem: budsjettarket (penger inn, planlagt brukt), perioden, staten, kommunen, bedriften og
 *   Jonas, og til slutt budsjettet som et kart.
 * - vekt: en skålvekt med inntekter på den ene siden og utgifter på den andre. Overskudd og
 *   underskudd.
 * - valg: underskuddet og de fire valgene, ett per beat. Hvert valg retter opp vekta på sin måte.
 * - kontoer: ukesbudsjett, tre kontoer og feriepenger i et årsbudsjett.
 */

type Modus = 'hvem' | 'vekt' | 'valg' | 'kontoer';

const BAKGRUNN = '#f8fafc';
const INN = '#0d9488';
const UT = '#e11d48';

const OVERSKRIFT: Record<Modus, string[]> = {
    hvem: [
        'Et budsjett er en oversikt',
        'For en bestemt tid',
        'Staten, kommunen, bedrifter',
        'Ditt eget: husholdningsbudsjett',
        'Et kart over pengene',
    ],
    vekt: ['Side 1: inntekter', 'Side 2: utgifter', 'Mer inn enn ut', 'Mer ut enn inn'],
    valg: [
        'Underskudd: fire valg',
        'Valg 1: bruke mindre',
        'Valg 2: tjene mer',
        'Valg 3: ta av sparepengene',
        'Valg 4: låne, det dyreste',
        'Regelen',
    ],
    kontoer: ['Ukesbudsjett', 'Flere kontoer', 'Årsbudsjett'],
};

// ---------- hvem ----------

function Ark({ x, y, b, h, tittel }: { x: number; y: number; b: number; h: number; tittel: string }) {
    return (
        <g>
            <rect x={x} y={y} width={b} height={h} rx={18} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
            <rect x={x} y={y} width={b} height={56} rx={18} fill="#e2e8f0" />
            <text x={x + b / 2} y={y + 40} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                {tittel}
            </text>
            {[0, 1, 2].map((i) => (
                <g key={i}>
                    <rect x={x + 22} y={y + 84 + i * 36} width={b / 2 - 40} height={14} rx={7} fill="#99f6e4" />
                    <rect x={x + b / 2 + 18} y={y + 84 + i * 36} width={b / 2 - 40} height={14} rx={7} fill="#fecdd3" />
                </g>
            ))}
        </g>
    );
}

const AKTORER = [
    { navn: 'Staten', x: 260, b: 300, h: 230, fra: 2 },
    { navn: 'Kommunen', x: 620, b: 260, h: 200, fra: 2 },
    { navn: 'Bedriften', x: 950, b: 240, h: 185, fra: 2 },
    { navn: 'Jonas', x: 1250, b: 220, h: 175, fra: 3 },
];

const KARTSTOPP = [
    { x: 260, y: 640, navn: 'Lønningsdag' },
    { x: 620, y: 520, navn: 'Husleie' },
    { x: 980, y: 650, navn: 'Mat' },
    { x: 1340, y: 520, navn: 'Neste lønningsdag' },
];

function Hvem({ beat }: { beat: number }) {
    const arket = beat <= 1;
    const kart = beat >= 4;
    return (
        <g>
            {/* Budsjettarket */}
            <Vis vis={arket}>
                <rect x={420} y={190} width={760} height={540} rx={26} fill="#ffffff" stroke="#94a3b8" strokeWidth={5} />
                <Tekst x={800} y={262} str={46} vekt={900}>
                    Budsjett
                </Tekst>
                <line x1={800} y1={300} x2={800} y2={700} stroke="#cbd5e1" strokeWidth={4} />
                <Tekst x={610} y={350} str={36} farge={INN}>
                    Penger inn
                </Tekst>
                <Tekst x={990} y={350} str={36} farge={UT}>
                    Planlagt brukt
                </Tekst>
                {[0, 1, 2, 3].map((i) => (
                    <g key={i}>
                        <motion.rect
                            x={470}
                            y={390 + i * 70}
                            height={22}
                            rx={11}
                            fill="#5eead4"
                            initial={{ width: 0 }}
                            animate={{ width: i < 2 ? 280 : 0 }}
                            transition={{ delay: 0.3 + i * 0.25, duration: 0.6 }}
                        />
                        <motion.rect
                            x={850}
                            y={390 + i * 70}
                            height={22}
                            rx={11}
                            fill="#fda4af"
                            initial={{ width: 0 }}
                            animate={{ width: 280 - i * 40 }}
                            transition={{ delay: 0.6 + i * 0.25, duration: 0.6 }}
                        />
                    </g>
                ))}
            </Vis>
            <Vis vis={beat === 1}>
                <rect x={1080} y={150} width={330} height={110} rx={22} fill="#1e293b" />
                <Tekst x={1245} y={196} str={28} farge="#cbd5e1" vekt={700}>
                    Periode
                </Tekst>
                <Tekst x={1245} y={240} str={40} farge="#ffffff" vekt={900}>
                    én måned
                </Tekst>
            </Vis>

            {/* Staten, kommunen, bedriften, Jonas */}
            {AKTORER.map((a) => (
                <Vis key={a.navn} vis={beat >= a.fra && !kart} forsinkelse={a.fra === 2 ? AKTORER.indexOf(a) * 0.35 : 0}>
                    <g>
                        <Ark x={a.x - a.b / 2} y={560 - a.h} b={a.b} h={a.h} tittel="Budsjett" />
                        <Tekst x={a.x} y={630} str={44} vekt={900} farge={a.navn === 'Jonas' ? INN : '#0f172a'}>
                            {a.navn}
                        </Tekst>
                    </g>
                </Vis>
            ))}
            <Vis vis={beat === 3}>
                <rect x={1250 - 160} y={268} width={320} height={60} rx={30} fill={INN} />
                <Tekst x={1250} y={309} str={30} farge="#ffffff">
                    familie eller alene
                </Tekst>
            </Vis>

            {/* Kartet */}
            <Vis vis={kart}>
                <path
                    d={`M ${KARTSTOPP.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={10}
                    strokeDasharray="4 26"
                    strokeLinecap="round"
                />
                {KARTSTOPP.map((p, i) => (
                    <g key={p.navn}>
                        <circle cx={p.x} cy={p.y} r={26} fill={i === 0 || i === 3 ? INN : '#f59e0b'} />
                        <Tekst x={p.x} y={p.y - 52} str={36}>
                            {p.navn}
                        </Tekst>
                    </g>
                ))}
                {kart && (
                    <motion.circle
                        r={18}
                        fill="#0f172a"
                        initial={{ x: KARTSTOPP[0].x, y: KARTSTOPP[0].y }}
                        animate={{ x: KARTSTOPP.map((p) => p.x), y: KARTSTOPP.map((p) => p.y) }}
                        transition={{ duration: 5, ease: 'easeInOut' }}
                    />
                )}
                <Tekst x={800} y={810} str={36} farge="#475569" vekt={700}>
                    Du vet hvor pengene skal, før de er borte
                </Tekst>
            </Vis>
        </g>
    );
}

// ---------- vekt og valg ----------

interface Kloss {
    id: string;
    tekst: string;
    farge: string;
    stiplet?: boolean;
}

const PIVOT = { x: 800, y: 290 };
const ARM = 430;
const SNOR = 250;
const KLOSS_H = 54;
const KLOSS_B = 260;

function Skaal({
    x,
    y,
    klosser,
    etikett,
    farge,
    visEtikett,
}: {
    x: number;
    y: number;
    klosser: Kloss[];
    etikett: string;
    farge: string;
    visEtikett: boolean;
}) {
    return (
        <g>
            <line x1={x - 150} y1={y} x2={x} y2={y - SNOR} stroke="#64748b" strokeWidth={4} />
            <line x1={x + 150} y1={y} x2={x} y2={y - SNOR} stroke="#64748b" strokeWidth={4} />
            <path d={`M ${x - 175} ${y} L ${x + 175} ${y} L ${x + 140} ${y + 26} L ${x - 140} ${y + 26} Z`} fill="#94a3b8" />
            {klosser.map((k, i) => (
                <motion.g
                    key={k.id}
                    initial={{ opacity: 0, y: -60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                >
                    <rect
                        x={x - KLOSS_B / 2}
                        y={y - (i + 1) * (KLOSS_H + 6)}
                        width={KLOSS_B}
                        height={KLOSS_H}
                        rx={12}
                        fill={k.stiplet ? '#ffffff' : k.farge}
                        stroke={k.farge}
                        strokeWidth={4}
                        strokeDasharray={k.stiplet ? '12 8' : undefined}
                    />
                    <text
                        x={x}
                        y={y - (i + 1) * (KLOSS_H + 6) + 38}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill={k.stiplet ? k.farge : '#ffffff'}
                    >
                        {k.tekst}
                    </text>
                </motion.g>
            ))}
            <Tekst x={x} y={y + 80} str={40} vekt={900} farge={farge} vis={visEtikett}>
                {etikett}
            </Tekst>
        </g>
    );
}

function Vekt({
    venstre,
    hoyre,
    vinkelMal,
    visHoyreEtikett = true,
}: {
    venstre: Kloss[];
    hoyre: Kloss[];
    vinkelMal: number;
    visHoyreEtikett?: boolean;
}) {
    const vinkel = useGlidTall(vinkelMal, 0, 1.4);
    const r = (vinkel * Math.PI) / 180;
    const vx = PIVOT.x - ARM * Math.cos(r);
    const vy = PIVOT.y - ARM * Math.sin(r);
    const hx = PIVOT.x + ARM * Math.cos(r);
    const hy = PIVOT.y + ARM * Math.sin(r);
    return (
        <g>
            {/* Foten */}
            <path d={`M ${PIVOT.x} ${PIVOT.y} L ${PIVOT.x - 70} 840 L ${PIVOT.x + 70} 840 Z`} fill="#cbd5e1" />
            <rect x={PIVOT.x - 160} y={830} width={320} height={26} rx={10} fill="#94a3b8" />
            <line x1={vx} y1={vy} x2={hx} y2={hy} stroke="#475569" strokeWidth={14} strokeLinecap="round" />
            <circle cx={PIVOT.x} cy={PIVOT.y} r={20} fill="#334155" />
            <Skaal x={vx} y={vy + SNOR} klosser={venstre} etikett="Inntekter" farge={INN} visEtikett />
            <Skaal
                x={hx}
                y={hy + SNOR}
                klosser={hoyre}
                etikett="Utgifter"
                farge={UT}
                visEtikett={visHoyreEtikett}
            />
        </g>
    );
}

const k = (id: string, tekst: string, farge: string, stiplet = false): Kloss => ({ id, tekst, farge, stiplet });

const FORELDRE = k('foreldre', 'Fra foreldre', INN);
const JOBB = k('jobb', 'Deltidsjobb', INN);
const HUSLEIE = k('husleie', 'Husleie', UT);
const MAT = k('mat', 'Mat', UT);
const PIZZA = k('pizza', 'Pizza', UT);
const KLAER = k('klaer', 'Klær', UT);

function Banner({ tekst, farge, vis }: { tekst: string; farge: string; vis: boolean }) {
    const b = kortBredde(tekst, 40, 70);
    return (
        <Vis vis={vis}>
            <rect x={800 - b / 2} y={150} width={b} height={76} rx={38} fill={farge} />
            <text x={800} y={202} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                {tekst}
            </text>
        </Vis>
    );
}

function VektModus({ beat }: { beat: number }) {
    const hoyre = beat === 0 ? [] : beat === 3 ? [HUSLEIE, MAT, PIZZA, KLAER] : [HUSLEIE, MAT];
    const venstre = beat === 2 ? [FORELDRE, JOBB, k('ekstra', 'Ekstravakt', INN)] : [FORELDRE, JOBB];
    const vinkel = beat === 2 ? -6 : beat === 3 ? 6 : 0;
    return (
        <g>
            <Vekt venstre={venstre} hoyre={hoyre} vinkelMal={vinkel} visHoyreEtikett={beat >= 1} />
            <Banner tekst="Overskudd: kan spares" farge={INN} vis={beat === 2} />
            <Banner tekst="Underskudd: går ikke opp" farge={UT} vis={beat === 3} />
        </g>
    );
}

const VALG = ['Bruke mindre', 'Tjene mer', 'Ta av sparing', 'Låne'];

function ValgModus({ beat }: { beat: number }) {
    let venstre = [FORELDRE, JOBB];
    let hoyre = [HUSLEIE, MAT, PIZZA];
    let vinkel = 6;
    if (beat === 1) {
        hoyre = [HUSLEIE, MAT];
        vinkel = 0;
    } else if (beat === 2) {
        venstre = [FORELDRE, JOBB, k('ekstra', 'Ekstravakt', INN)];
        vinkel = 0;
    } else if (beat === 3) {
        venstre = [FORELDRE, JOBB, k('spart', 'Fra sparing', '#0891b2')];
        vinkel = 0;
    } else if (beat === 4) {
        venstre = [FORELDRE, JOBB, k('lan', 'Lån', '#d97706')];
        vinkel = 0;
    } else if (beat === 5) {
        hoyre = [HUSLEIE, MAT];
        vinkel = 0;
    }
    return (
        <g>
            <Vekt venstre={venstre} hoyre={hoyre} vinkelMal={vinkel} />
            {/* De fire valgene som nummererte brikker øverst */}
            {beat >= 1 && beat <= 4 &&
                VALG.map((v, i) => {
                    const x = 200 + i * 400;
                    const aktiv = beat === i + 1;
                    return (
                        <Vis key={v} vis={beat >= i + 1}>
                            <rect
                                x={x - 180}
                                y={150}
                                width={360}
                                height={70}
                                rx={35}
                                fill={aktiv ? '#0f172a' : '#e2e8f0'}
                            />
                            <text
                                x={x}
                                y={198}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill={aktiv ? '#ffffff' : '#475569'}
                            >
                                {`${i + 1}. ${v}`}
                            </text>
                        </Vis>
                    );
                })}
            <Banner tekst="Underskudd" farge={UT} vis={beat === 0} />
            {/* Pizzaen som blir kuttet */}
            <Vis vis={beat === 1}>
                <text x={1440} y={330} textAnchor="middle" fontSize={34} fontWeight={800} fill={UT}>
                    Pizza kuttet
                </text>
                <path d="M 1400 360 L 1480 420 M 1480 360 L 1400 420" stroke={UT} strokeWidth={10} strokeLinecap="round" />
            </Vis>
            {/* Lånet koster mer senere */}
            <Vis vis={beat === 4} forsinkelse={1.2}>
                <rect x={1080} y={700} width={470} height={130} rx={20} fill="#fff7ed" stroke="#d97706" strokeWidth={4} strokeDasharray="14 10" />
                <text x={1315} y={752} textAnchor="middle" fontSize={32} fontWeight={800} fill="#b45309">
                    Senere: betale tilbake
                </text>
                <text x={1315} y={802} textAnchor="middle" fontSize={32} fontWeight={800} fill="#b45309">
                    lånet + renter
                </text>
            </Vis>
            <Vis vis={beat === 5}>
                <rect x={330} y={150} width={940} height={110} rx={28} fill="#0f172a" />
                <text x={800} y={202} textAnchor="middle" fontSize={34} fontWeight={700} fill="#cbd5e1">
                    Over tid:
                </text>
                <text x={800} y={244} textAnchor="middle" fontSize={38} fontWeight={900} fill="#ffffff">
                    penger til alle utgiftene du har planlagt
                </text>
            </Vis>
        </g>
    );
}

// ---------- kontoer ----------

const KONTOER = [
    { navn: 'Regninger', farge: UT, x: 400 },
    { navn: 'Buffer', farge: '#0891b2', x: 800 },
    { navn: 'Bruke fritt', farge: INN, x: 1200 },
];

const MND = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function KontoModus({ beat }: { beat: number }) {
    return (
        <g>
            {/* Ukesbudsjett: måneden delt i uker */}
            <Vis vis={beat === 0}>
                <rect x={200} y={250} width={1200} height={120} rx={20} fill="#e2e8f0" />
                <Tekst x={800} y={325} str={40} farge="#334155">
                    Pengene for hele måneden
                </Tekst>
                {[0, 1, 2, 3].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: beat === 0 ? 1 : 0, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.35 }}
                    >
                        <rect x={200 + i * 305} y={460} width={285} height={220} rx={20} fill="#ffffff" stroke={INN} strokeWidth={5} />
                        <text x={342 + i * 305} y={560} textAnchor="middle" fontSize={44} fontWeight={900} fill={INN}>
                            {`Uke ${i + 1}`}
                        </text>
                        <text x={342 + i * 305} y={620} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                            en fast del
                        </text>
                    </motion.g>
                ))}
                <Tekst x={800} y={780} str={36} farge="#475569" vekt={700}>
                    Pengene varer hele måneden
                </Tekst>
            </Vis>

            {/* Flere kontoer */}
            <Vis vis={beat === 1}>
                <rect x={600} y={170} width={400} height={100} rx={24} fill="#0f172a" />
                <Tekst x={800} y={234} str={40} farge="#ffffff">
                    Lønningsdag
                </Tekst>
                {KONTOER.map((kt, i) => (
                    <g key={kt.navn}>
                        <motion.path
                            d={`M 800 270 C 800 360, ${kt.x} 360, ${kt.x} 450`}
                            fill="none"
                            stroke={kt.farge}
                            strokeWidth={8}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: beat === 1 ? 1 : 0 }}
                            transition={{ delay: 0.5 + i * 0.4, duration: 0.8 }}
                        />
                        <rect x={kt.x - 160} y={460} width={320} height={230} rx={24} fill="#ffffff" stroke={kt.farge} strokeWidth={6} />
                        <text x={kt.x} y={540} textAnchor="middle" fontSize={30} fontWeight={700} fill="#64748b">
                            Konto
                        </text>
                        <text x={kt.x} y={600} textAnchor="middle" fontSize={44} fontWeight={900} fill={kt.farge}>
                            {kt.navn}
                        </text>
                    </g>
                ))}
            </Vis>

            {/* Årsbudsjett med feriepenger */}
            <Vis vis={beat === 2}>
                <Tekst x={460} y={240} str={44} vekt={900}>
                    I år
                </Tekst>
                <Tekst x={1220} y={240} str={44} vekt={900}>
                    Neste år
                </Tekst>
                {MND.map((m, i) => (
                    <g key={i}>
                        <text x={150 + i * 52} y={560} textAnchor="middle" fontSize={22} fontWeight={700} fill="#64748b">
                            {m}
                        </text>
                        <motion.rect
                            x={130 + i * 52}
                            width={40}
                            rx={6}
                            fill="#a78bfa"
                            initial={{ height: 0, y: 520 }}
                            animate={{ height: beat === 2 ? 30 + i * 12 : 0, y: beat === 2 ? 520 - (30 + i * 12) : 520 }}
                            transition={{ delay: 0.3 + i * 0.12 }}
                        />
                    </g>
                ))}
                <line x1={800} y1={280} x2={800} y2={590} stroke="#cbd5e1" strokeWidth={4} strokeDasharray="10 10" />
                <Tekst x={460} y={640} str={34} farge="#6d28d9">
                    Du tjener opp feriepenger
                </Tekst>
                <Vis vis={beat === 2} forsinkelse={2}>
                    <motion.path
                        d="M 700 330 C 900 230, 1060 260, 1210 410"
                        fill="none"
                        stroke="#6d28d9"
                        strokeWidth={8}
                        strokeLinecap="round"
                    />
                    <path d="M 1186 392 L 1212 424 L 1230 388" fill="none" stroke="#6d28d9" strokeWidth={8} strokeLinecap="round" />
                    <rect x={1110} y={440} width={220} height={80} rx={16} fill="#6d28d9" />
                    <text x={1220} y={492} textAnchor="middle" fontSize={30} fontWeight={900} fill="#ffffff">
                        Utbetalt
                    </text>
                    <Tekst x={1220} y={640} str={34} farge="#6d28d9">
                        Planlegg før de kommer
                    </Tekst>
                </Vis>
            </Vis>
        </g>
    );
}

export function BudsjettTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'hvem';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: BAKGRUNN }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Overskrift tekst={tekst} />
                {modus === 'hvem' && <Hvem beat={beat} />}
                {modus === 'vekt' && <VektModus beat={beat} />}
                {modus === 'valg' && <ValgModus beat={beat} />}
                {modus === 'kontoer' && <KontoModus beat={beat} />}
            </svg>
        </div>
    );
}
