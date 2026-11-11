import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Ord, krav og mønstre, tegnet i SVG. Fire moduser:
 * «krav»: de tre kravene før noe kalles en etnolekt, og morsmålet som farger norsken.
 * «baand»: samer og kvener, språket som svekkes, og talemålet som et bånd til historien.
 * «ordbok»: seks ordkort som snus ett språk om gangen.
 * «monster»: rytmen (stakkato) og ordrekkefølgen der verbet flytter seg.
 */

type Modus = 'krav' | 'baand' | 'ordbok' | 'monster';

const B = 1600;
const H = 900;

const LILLA = '#7c3aed';
const ORANSJE = '#ea580c';
const BLA = '#2563eb';
const TEAL = '#0f766e';
const GRA = '#94a3b8';
const MORK = '#0f172a';

const TITLER: Record<Modus, string[]> = {
    krav: [
        'Tre krav for en etnolekt',
        '1. Felles for gruppen',
        '2. Går videre til barna',
        '3. Viser at du hører til',
        'Ofte: norsk som andrespråk',
    ],
    baand: ['Etnolekter i Norge', 'Samer og kvener', 'Fornorskingen', 'Et bånd til historien'],
    ordbok: ['Avkod ordene', 'Fra urdu og punjabi', 'Fra arabisk', 'Fra engelsk'],
    monster: ['Egen rytme', 'Stakkato', 'Standard norsk', 'Multietnolekt', 'Faste mønstre'],
};

export function EtnolektOrd({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'krav';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f4f1ea' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <motion.text
                    key={tittel}
                    x={B / 2}
                    y={105}
                    textAnchor="middle"
                    fontSize={60}
                    fontWeight={900}
                    fill={MORK}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {tittel}
                </motion.text>
                {modus === 'krav' && <Krav beat={beat} />}
                {modus === 'baand' && <Baand beat={beat} />}
                {modus === 'ordbok' && <Ordbok beat={beat} />}
                {modus === 'monster' && <Monster beat={beat} />}
            </svg>
        </div>
    );
}

/* ---------- felles ---------- */

function Person({ x, y, s = 1, farge }: { x: number; y: number; s?: number; farge: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <motion.circle
                cx={0}
                cy={-20}
                r={9}
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 0.6 }}
            />
            <motion.path
                d="M -12 14 L -12 -2 Q -12 -9 -5 -9 L 5 -9 Q 12 -9 12 -2 L 12 14 Z"
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 0.6 }}
            />
        </g>
    );
}

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

/** Pille med tekst. Bredden regnes ut fra teksten. */
function Lapp({
    x,
    y,
    tekst,
    farge,
    str = 34,
    fylt = false,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    str?: number;
    fylt?: boolean;
}) {
    const b = tekst.length * str * 0.56 + str * 1.3;
    const h = str * 1.6;
    return (
        <g>
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={h / 2}
                fill={fylt ? farge : '#ffffff'}
                stroke={farge}
                strokeWidth={4}
            />
            <text
                x={x}
                y={y + str * 0.36}
                textAnchor="middle"
                fontSize={str}
                fontWeight={800}
                fill={fylt ? '#ffffff' : farge}
            >
                {tekst}
            </text>
        </g>
    );
}

/* ---------- krav ---------- */

const KORT_X = [320, 800, 1280];

function Krav({ beat }: { beat: number }) {
    if (beat >= 4) return <Andresprak />;
    const titler = ['Felles for gruppen', 'Går videre til barna', 'Viser at du hører til'];
    return (
        <g>
            {KORT_X.map((x, i) => {
                const aktiv = beat >= i + 1;
                const fokus = beat === i + 1;
                return (
                    <g key={x}>
                        <motion.rect
                            x={x - 210}
                            y={190}
                            width={420}
                            height={600}
                            rx={28}
                            initial={false}
                            animate={{
                                fill: aktiv ? '#ffffff' : '#ece7dc',
                                stroke: fokus ? LILLA : aktiv ? '#cbd5e1' : '#b8b0a0',
                            }}
                            strokeWidth={fokus ? 7 : 4}
                            strokeDasharray={aktiv ? undefined : '18 12'}
                            transition={{ duration: 0.5 }}
                        />
                        <circle cx={x} cy={270} r={50} fill={aktiv ? LILLA : '#b8b0a0'} />
                        <text
                            x={x}
                            y={290}
                            textAnchor="middle"
                            fontSize={56}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            {i + 1}
                        </text>
                        {aktiv && (
                            <Inn>
                                {i === 0 && <FellesTegning x={x} />}
                                {i === 1 && <BarnTegning x={x} />}
                                {i === 2 && <TilhorTegning x={x} />}
                                <text
                                    x={x}
                                    y={745}
                                    textAnchor="middle"
                                    fontSize={36}
                                    fontWeight={800}
                                    fill={MORK}
                                >
                                    {titler[i]}
                                </text>
                            </Inn>
                        )}
                        {!aktiv && (
                            <text
                                x={x}
                                y={540}
                                textAnchor="middle"
                                fontSize={110}
                                fontWeight={900}
                                fill="#b8b0a0"
                            >
                                ?
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );
}

function FellesTegning({ x }: { x: number }) {
    const pos: [number, number][] = [];
    for (let r = 0; r < 3; r++)
        for (let k = 0; k < 4; k++) pos.push([x - 120 + k * 80, 420 + r * 90]);
    return (
        <g>
            {pos.map(([px, py], i) => (
                <Person key={i} x={px} y={py} s={1.7} farge={LILLA} />
            ))}
        </g>
    );
}

function BarnTegning({ x }: { x: number }) {
    return (
        <g>
            <Person x={x - 70} y={440} s={2.6} farge={LILLA} />
            <Person x={x + 70} y={440} s={2.6} farge={LILLA} />
            <path d={`M ${x} 500 L ${x} 560`} stroke={MORK} strokeWidth={8} strokeLinecap="round" />
            <path
                d={`M ${x - 22} 545 L ${x} 575 L ${x + 22} 545`}
                fill="none"
                stroke={MORK}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Person x={x - 60} y={650} s={1.7} farge={LILLA} />
            <Person x={x} y={650} s={1.7} farge={LILLA} />
            <Person x={x + 60} y={650} s={1.7} farge={LILLA} />
        </g>
    );
}

function TilhorTegning({ x }: { x: number }) {
    return (
        <g>
            <circle cx={x} cy={520} r={150} fill={ORANSJE} opacity={0.14} />
            <circle cx={x} cy={520} r={150} fill="none" stroke={ORANSJE} strokeWidth={5} />
            {[-90, 0, 90].map((dx) => (
                <Person key={dx} x={x + dx} y={dx === 0 ? 500 : 560} s={2} farge={ORANSJE} />
            ))}
            <circle cx={x + 120} cy={400} r={36} fill={TEAL} />
            <path
                d={`M ${x + 102} ${400} l 12 13 l 24 -26`}
                fill="none"
                stroke="#ffffff"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
    );
}

function Andresprak() {
    const trekk = ['uttale', 'tonefall', 'ordvalg'];
    return (
        <Inn>
            <circle cx={380} cy={430} r={200} fill={ORANSJE} opacity={0.18} />
            <circle cx={380} cy={430} r={200} fill="none" stroke={ORANSJE} strokeWidth={6} />
            <text x={380} y={445} textAnchor="middle" fontSize={50} fontWeight={900} fill={ORANSJE}>
                Morsmålet
            </text>
            <motion.path
                d="M 610 430 L 980 430"
                stroke={MORK}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
            />
            <path
                d="M 960 405 L 995 430 L 960 455"
                fill="none"
                stroke={MORK}
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <text x={800} y={395} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                lærer norsk etterpå
            </text>
            <circle cx={1220} cy={430} r={200} fill={BLA} opacity={0.12} />
            <motion.circle
                cx={1220}
                cy={430}
                r={200}
                fill={ORANSJE}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.16 }}
                transition={{ duration: 1, delay: 1 }}
            />
            <circle cx={1220} cy={430} r={200} fill="none" stroke={BLA} strokeWidth={6} />
            <text x={1220} y={445} textAnchor="middle" fontSize={50} fontWeight={900} fill={BLA}>
                Norsk
            </text>
            {trekk.map((t, i) => (
                <motion.g
                    key={t}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 + i * 0.4 }}
                >
                    <Lapp x={1220 + (i - 1) * 210} y={700} tekst={t} farge={ORANSJE} />
                </motion.g>
            ))}
            <text x={800} y={830} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                farget av morsmålet. Noen trekk lever videre.
            </text>
        </Inn>
    );
}

/* ---------- baand ---------- */

const GRUPPER = [
    { x: 470, navn: 'Samer', farge: TEAL, sprak: 'Samisk språk' },
    { x: 1130, navn: 'Kvener', farge: BLA, sprak: 'Kvensk språk' },
];

function Baand({ beat }: { beat: number }) {
    return (
        <g>
            {beat >= 3 && (
                <Inn>
                    <Lapp x={B / 2} y={200} tekst="Bakgrunn og historie" farge="#b45309" fylt />
                    {GRUPPER.map((g) => (
                        <motion.path
                            key={g.x}
                            d={`M ${B / 2} 230 C ${B / 2} 380, ${g.x} 330, ${g.x} 520`}
                            fill="none"
                            stroke="#d97706"
                            strokeWidth={12}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 0.3 }}
                        />
                    ))}
                </Inn>
            )}
            {GRUPPER.map((g) => {
                const farge = beat >= 1 ? g.farge : GRA;
                return (
                    <g key={g.x}>
                        {[-120, -40, 40, 120].map((dx, i) => (
                            <Person
                                key={dx}
                                x={g.x + dx}
                                y={i % 2 ? 690 : 710}
                                s={2.4}
                                farge={farge}
                            />
                        ))}
                        {beat >= 1 && (
                            <Inn>
                                <text
                                    x={g.x}
                                    y={810}
                                    textAnchor="middle"
                                    fontSize={44}
                                    fontWeight={900}
                                    fill={g.farge}
                                >
                                    {g.navn}
                                </text>
                            </Inn>
                        )}
                        {beat >= 1 && beat !== 2 && (
                            <Inn forsinkelse={0.3}>
                                <rect
                                    x={g.x - 240}
                                    y={520}
                                    width={480}
                                    height={84}
                                    rx={24}
                                    fill="#ffffff"
                                    stroke={g.farge}
                                    strokeWidth={4}
                                />
                                <path
                                    d={`M ${g.x - 20} 603 l 0 26 l 26 -26 z`}
                                    fill="#ffffff"
                                    stroke={g.farge}
                                    strokeWidth={4}
                                    strokeLinejoin="round"
                                />
                                <rect x={g.x - 18} y={598} width={40} height={10} fill="#ffffff" />
                                <text
                                    x={g.x}
                                    y={574}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill={MORK}
                                >
                                    norsk, på sin egen måte
                                </text>
                            </Inn>
                        )}
                        {beat === 2 && (
                            <Inn>
                                <text
                                    x={g.x}
                                    y={300}
                                    textAnchor="middle"
                                    fontSize={38}
                                    fontWeight={800}
                                    fill={MORK}
                                >
                                    {g.sprak}
                                </text>
                                <rect
                                    x={g.x - 230}
                                    y={330}
                                    width={460}
                                    height={70}
                                    rx={14}
                                    fill="#e2e8f0"
                                />
                                <motion.rect
                                    x={g.x - 230}
                                    y={330}
                                    height={70}
                                    rx={14}
                                    fill={g.farge}
                                    initial={{ width: 460 }}
                                    animate={{ width: 150 }}
                                    transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
                                />
                                <text
                                    x={g.x}
                                    y={460}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={700}
                                    fill="#475569"
                                >
                                    kan ha blitt svekket
                                </text>
                            </Inn>
                        )}
                    </g>
                );
            })}
            {beat === 0 && (
                <Inn>
                    <text
                        x={B / 2}
                        y={400}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={800}
                        fill="#475569"
                    >
                        Ikke bare i de nye bydelene
                    </text>
                </Inn>
            )}
            {beat === 2 && (
                <text
                    x={1560}
                    y={880}
                    textAnchor="end"
                    fontSize={34}
                    fontWeight={700}
                    fill="#334155"
                >
                    Tenkt bilde, ikke målt
                </text>
            )}
            {beat === 2 && (
                <Inn forsinkelse={1}>
                    <Lapp x={B / 2} y={210} tekst="Presset til å bruke norsk" farge="#b91c1c" />
                </Inn>
            )}
            {beat >= 3 && (
                <Inn forsinkelse={1.2}>
                    <Lapp x={B / 2} y={440} tekst="Talemålet: et bånd" farge="#b45309" />
                </Inn>
            )}
        </g>
    );
}

/* ---------- ordbok ---------- */

const ORD = [
    { ord: 'baja', betyr: 'kompis', fra: 'urdu og punjabi', farge: LILLA, beat: 1 },
    { ord: 'tært', betyr: 'kul, fin', fra: 'urdu og punjabi', farge: LILLA, beat: 1 },
    { ord: 'jalla', betyr: 'kom igjen!', fra: 'arabisk', farge: '#b45309', beat: 2 },
    { ord: 'wallah', betyr: 'jeg sverger', fra: 'arabisk', farge: '#b45309', beat: 2 },
    { ord: 'flus', betyr: 'penger', fra: 'arabisk', farge: '#b45309', beat: 2 },
    { ord: 'digge', betyr: 'å like noe', fra: 'engelsk', farge: '#0369a1', beat: 3 },
];

function Ordbok({ beat }: { beat: number }) {
    return (
        <g>
            {ORD.map((o, i) => {
                const x = 330 + (i % 3) * 470;
                const y = 200 + Math.floor(i / 3) * 290;
                const snudd = beat >= o.beat;
                const fokus = beat === o.beat;
                return (
                    <g key={o.ord}>
                        <motion.rect
                            x={x - 205}
                            y={y}
                            width={410}
                            height={250}
                            rx={26}
                            initial={false}
                            animate={{
                                fill: snudd ? '#ffffff' : '#334155',
                                stroke: fokus ? o.farge : snudd ? '#cbd5e1' : '#334155',
                            }}
                            strokeWidth={fokus ? 8 : 4}
                            transition={{ duration: 0.5 }}
                        />
                        <text
                            x={x}
                            y={y + 90}
                            textAnchor="middle"
                            fontSize={60}
                            fontWeight={900}
                            fill={snudd ? MORK : '#ffffff'}
                        >
                            «{o.ord}»
                        </text>
                        {snudd ? (
                            <Inn>
                                <text
                                    x={x}
                                    y={y + 155}
                                    textAnchor="middle"
                                    fontSize={38}
                                    fontWeight={700}
                                    fill="#334155"
                                >
                                    {o.betyr}
                                </text>
                                <rect
                                    x={x - (o.fra.length * 30 * 0.56 + 40) / 2}
                                    y={y + 180}
                                    width={o.fra.length * 30 * 0.56 + 40}
                                    height={46}
                                    rx={23}
                                    fill={o.farge}
                                />
                                <text
                                    x={x}
                                    y={y + 213}
                                    textAnchor="middle"
                                    fontSize={30}
                                    fontWeight={800}
                                    fill="#ffffff"
                                >
                                    {o.fra}
                                </text>
                            </Inn>
                        ) : (
                            <text
                                x={x}
                                y={y + 180}
                                textAnchor="middle"
                                fontSize={54}
                                fontWeight={900}
                                fill="#94a3b8"
                            >
                                ?
                            </text>
                        )}
                    </g>
                );
            })}
            {beat >= 3 && (
                <Inn forsinkelse={0.8}>
                    <Lapp
                        x={B / 2}
                        y={835}
                        tekst="Ingen gruppe eier ordboka alene"
                        farge={MORK}
                        fylt
                    />
                </Inn>
            )}
        </g>
    );
}

/* ---------- monster ---------- */

/** Tenkte stavelser: høyde = trykk. Ikke målt. */
const STAVELSER = [0.5, 0.9, 0.45, 1, 0.55, 0.85, 0.5, 0.95, 0.45, 0.8];

function Monster({ beat }: { beat: number }) {
    if (beat <= 1) return <Rytme stakkato={beat === 1} />;
    const standard = ['I går', 'gikk', 'jeg', 'ikke'];
    const multi = ['I går', 'eg', 'ikkje', 'gjekk'];
    const verbStd = 1;
    const verbMulti = 3;
    const plassX = (i: number) => 440 + i * 280;
    return (
        <g>
            {[0, 1, 2, 3].map((i) => (
                <text
                    key={i}
                    x={plassX(i)}
                    y={235}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={800}
                    fill="#334155"
                >
                    plass {i + 1}
                </text>
            ))}
            <Rad
                ord={standard}
                verb={verbStd}
                y={beat >= 3 ? 290 : 400}
                farge={BLA}
                etikett="Standard norsk"
                dempet={beat >= 3}
                plassX={plassX}
            />
            {beat >= 3 && (
                <Inn>
                    <Rad
                        ord={multi}
                        verb={verbMulti}
                        y={540}
                        farge={ORANSJE}
                        etikett="Multietnolekt"
                        plassX={plassX}
                    />
                    <motion.path
                        d={`M ${plassX(1)} 405 C ${plassX(1)} 480, ${plassX(3)} 440, ${plassX(3)} 520`}
                        fill="none"
                        stroke={ORANSJE}
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                    />
                </Inn>
            )}
            {beat === 3 && (
                <Inn forsinkelse={1.2}>
                    <Lapp x={plassX(3)} y={730} tekst="verbet har flyttet seg" farge={ORANSJE} />
                </Inn>
            )}
            {beat === 2 && (
                <Inn forsinkelse={0.4}>
                    <Lapp x={plassX(1)} y={560} tekst="verbet på plass 2" farge={BLA} />
                </Inn>
            )}
            {beat >= 4 && (
                <Inn>
                    <Lapp
                        x={B / 2}
                        y={740}
                        tekst="Ikke tilfeldige feil, men faste mønstre"
                        farge={MORK}
                        fylt
                        str={38}
                    />
                    <text
                        x={B / 2}
                        y={835}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        som de faste kjennetegnene i en dialekt
                    </text>
                </Inn>
            )}
        </g>
    );
}

function Rad({
    ord,
    verb,
    y,
    farge,
    etikett,
    dempet = false,
    plassX,
}: {
    ord: string[];
    verb: number;
    y: number;
    farge: string;
    etikett: string;
    dempet?: boolean;
    plassX: (i: number) => number;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ opacity: dempet ? 0.55 : 1 }}
            transition={{ duration: 0.5 }}
        >
            <text x={40} y={y + 50} fontSize={34} fontWeight={800} fill={farge}>
                <tspan x={40}>{etikett.split(' ')[0]}</tspan>
                <tspan x={40} dy={40}>
                    {etikett.split(' ')[1] ?? ''}
                </tspan>
            </text>
            {ord.map((o, i) => (
                <g key={i}>
                    <rect
                        x={plassX(i) - 120}
                        y={y}
                        width={240}
                        height={110}
                        rx={20}
                        fill={i === verb ? farge : '#ffffff'}
                        stroke={farge}
                        strokeWidth={5}
                    />
                    <text
                        x={plassX(i)}
                        y={y + 72}
                        textAnchor="middle"
                        fontSize={52}
                        fontWeight={900}
                        fill={i === verb ? '#ffffff' : MORK}
                    >
                        {o}
                    </text>
                </g>
            ))}
        </motion.g>
    );
}

function Rytme({ stakkato }: { stakkato: boolean }) {
    const x0 = 260;
    const bredde = 1080;
    const n = STAVELSER.length;
    const steg = bredde / n;
    // Jevn flyt: en myk bølge. Stakkato: klosser med luft imellom og tydelige topper.
    const bolge = Array.from({ length: 81 }, (_, i) => {
        const x = x0 + (i / 80) * bredde;
        const y = 520 - Math.sin((i / 80) * Math.PI * 6) * 70;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    return (
        <g>
            <line
                x1={x0 - 30}
                y1={650}
                x2={x0 + bredde + 30}
                y2={650}
                stroke="#cbd5e1"
                strokeWidth={4}
            />
            <motion.path
                d={bolge}
                fill="none"
                stroke={BLA}
                strokeWidth={10}
                strokeLinecap="round"
                initial={false}
                animate={{ opacity: stakkato ? 0.15 : 1 }}
                transition={{ duration: 0.6 }}
            />
            {STAVELSER.map((h, i) => {
                const hoyde = 60 + h * 300;
                return (
                    <motion.rect
                        key={i}
                        x={x0 + i * steg + steg * 0.2}
                        width={steg * 0.6}
                        rx={10}
                        fill={h > 0.75 ? ORANSJE : '#fdba74'}
                        initial={false}
                        animate={{
                            y: stakkato ? 650 - hoyde : 650,
                            height: stakkato ? hoyde : 0,
                        }}
                        transition={{ duration: 0.5, delay: stakkato ? i * 0.12 : 0 }}
                    />
                );
            })}
            <Lapp
                x={B / 2}
                y={760}
                tekst={
                    stakkato ? 'Stakkato: hakkete, med tydelige trykk' : 'Ikke bare ord, også rytme'
                }
                farge={stakkato ? ORANSJE : BLA}
            />
            <text x={1560} y={875} textAnchor="end" fontSize={34} fontWeight={600} fill="#334155">
                Tenkt bilde, ikke målt
            </text>
        </g>
    );
}
