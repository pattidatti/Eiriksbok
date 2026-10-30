import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * En vektskål for byttehandelen, i SVG. Varene kommer i skålene beat for beat, og bjelken
 * vipper mot den tyngste siden. Endepunktene regnes ut direkte (ingen rotasjon på <g>).
 *
 * «india»: Beat 0-1: Indias varer i venstre skål. Beat 2: Romas betaling i høyre skål, og
 * vekten kommer i balanse. Beat 3: myntskatten og handelsstasjonen ved Arikamedu.
 * «rav»: Beat 0: vin og glass fra sør. Beat 1: rav og pelsverk fra nord, balanse.
 * Beat 2: en tidslinje viser at ravet var en vare allerede i steinalderen.
 */

type Modus = 'india' | 'rav';
type Ikon =
    | 'pepper'
    | 'stein'
    | 'perle'
    | 'skall'
    | 'elfenben'
    | 'glass'
    | 'metall'
    | 'vin'
    | 'mynt'
    | 'rav'
    | 'pels';

interface Vare {
    navn: string;
    ikon: Ikon;
    farge: string;
    fraBeat: number;
}

const B = 1600;
const H = 900;
const MIDT = 800;
const BJELKE_Y = 270;
const ARM = 420;
const SNOR = 300;

const VARER: Record<Modus, { venstre: Vare[]; hoyre: Vare[]; vNavn: string; hNavn: string }> = {
    india: {
        vNavn: 'Fra India',
        hNavn: 'Fra Romerriket',
        venstre: [
            { navn: 'pepper', ikon: 'pepper', farge: '#166534', fraBeat: 0 },
            { navn: 'edelstener', ikon: 'stein', farge: '#be123c', fraBeat: 0 },
            { navn: 'perler', ikon: 'perle', farge: '#94a3b8', fraBeat: 0 },
            { navn: 'skilpaddeskall', ikon: 'skall', farge: '#92400e', fraBeat: 1 },
            { navn: 'elfenben', ikon: 'elfenben', farge: '#a8a29e', fraBeat: 1 },
        ],
        hoyre: [
            { navn: 'glass', ikon: 'glass', farge: '#0891b2', fraBeat: 2 },
            { navn: 'kobber', ikon: 'metall', farge: '#c2410c', fraBeat: 2 },
            { navn: 'tinn og bly', ikon: 'metall', farge: '#64748b', fraBeat: 2 },
            { navn: 'vin', ikon: 'vin', farge: '#7f1d1d', fraBeat: 2 },
            { navn: 'gullmynter', ikon: 'mynt', farge: '#ca8a04', fraBeat: 2 },
        ],
    },
    rav: {
        vNavn: 'Fra nord',
        hNavn: 'Fra sør',
        venstre: [
            { navn: 'rav', ikon: 'rav', farge: '#d97706', fraBeat: 1 },
            { navn: 'pelsverk', ikon: 'pels', farge: '#78350f', fraBeat: 1 },
        ],
        hoyre: [
            { navn: 'vin', ikon: 'vin', farge: '#7f1d1d', fraBeat: 0 },
            { navn: 'glass', ikon: 'glass', farge: '#0891b2', fraBeat: 0 },
        ],
    },
};

const TEKSTER: Record<Modus, string[]> = {
    india: [
        'India sender pepper, edelstener og perler',
        'Og skilpaddeskall og elfenben',
        'Romerne betaler med varer og gull',
        'Romerske mynter funnet i India',
    ],
    rav: [
        'Sørfra: vin og glass',
        'Nordfra: rav og pelsverk',
        'Rav: en vare helt siden steinalderen',
    ],
};

export function HandelBytte({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus === 'rav' ? 'rav' : 'india';
    const v = VARER[modus];
    const tekster = TEKSTER[modus];
    const tekst = tekster[Math.min(beat, tekster.length - 1)];
    const vV = v.venstre.filter((x) => x.fraBeat <= beat).length;
    const vH = v.hoyre.filter((x) => x.fraBeat <= beat).length;
    // Vipping: positiv = venstre side ned. I balanse når begge skålene har varer.
    const vinkel = vV > 0 && vH > 0 ? 0 : vV > 0 ? 0.16 + vV * 0.01 : vH > 0 ? -0.18 : 0;
    const dx = Math.cos(vinkel) * ARM;
    const dy = Math.sin(vinkel) * ARM;
    const venstre = { x: MIDT - dx, y: BJELKE_Y + dy };
    const hoyre = { x: MIDT + dx, y: BJELKE_Y - dy };
    const ekstra = (modus === 'india' && beat >= 3) || (modus === 'rav' && beat >= 2);
    const fjern = ekstra ? 0.25 : 1;
    const fjaer = { type: 'spring' as const, stiffness: 70, damping: 14 };

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f8f1e3' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <motion.g
                    initial={false}
                    animate={{ opacity: fjern }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Stativet */}
                    <rect x={MIDT - 12} y={BJELKE_Y} width={24} height={560} fill="#78350f" />
                    <rect x={MIDT - 140} y={820} width={280} height={30} rx={10} fill="#78350f" />
                    <motion.line
                        initial={false}
                        animate={{ x1: venstre.x, y1: venstre.y, x2: hoyre.x, y2: hoyre.y }}
                        transition={fjaer}
                        stroke="#92400e"
                        strokeWidth={18}
                        strokeLinecap="round"
                    />
                    <circle cx={MIDT} cy={BJELKE_Y} r={20} fill="#ca8a04" />
                    <Skal
                        x={venstre.x}
                        y={venstre.y}
                        varer={v.venstre}
                        beat={beat}
                        navn={v.vNavn}
                        fjaer={fjaer}
                    />
                    <Skal
                        x={hoyre.x}
                        y={hoyre.y}
                        varer={v.hoyre}
                        beat={beat}
                        navn={v.hNavn}
                        fjaer={fjaer}
                    />
                </motion.g>
                {modus === 'india' && beat >= 3 && <Myntskatt />}
                {modus === 'rav' && beat >= 2 && <Steinalder />}
            </svg>
            <motion.div
                key={`${modus}-${beat}`}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap bg-white/90 text-slate-900"
            >
                {tekst}
            </motion.div>
        </div>
    );
}

/** En skål som henger i snorer fra bjelkeenden, med varene stablet over seg. */
function Skal({
    x,
    y,
    varer,
    beat,
    navn,
    fjaer,
}: {
    x: number;
    y: number;
    varer: Vare[];
    beat: number;
    navn: string;
    fjaer: { type: 'spring'; stiffness: number; damping: number };
}) {
    const synlige = varer.filter((v) => v.fraBeat <= beat);
    const kol = 3;
    return (
        <motion.g initial={false} animate={{ x, y }} transition={fjaer}>
            <line x1={0} y1={0} x2={-230} y2={SNOR} stroke="#a16207" strokeWidth={4} />
            <line x1={0} y1={0} x2={230} y2={SNOR} stroke="#a16207" strokeWidth={4} />
            <path d={`M -260 ${SNOR} Q 0 ${SNOR + 80} 260 ${SNOR} Z`} fill="#b45309" />
            <text
                x={0}
                y={SNOR + 120}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#78350f"
            >
                {navn}
            </text>
            {synlige.map((v, i) => {
                const rad = Math.floor(i / kol);
                const iRad = Math.min(kol, synlige.length - rad * kol);
                const k = i % kol;
                const vx = (k - (iRad - 1) / 2) * 180;
                const vy = SNOR - 80 - rad * 150;
                return (
                    <motion.g
                        key={v.navn}
                        initial={{ opacity: 0, y: vy - 60 }}
                        animate={{ opacity: 1, y: vy }}
                        transition={{
                            delay: 0.2 + (i % 3) * 0.25,
                            type: 'spring',
                            stiffness: 160,
                            damping: 16,
                        }}
                    >
                        <g transform={`translate(${vx} 0)`}>
                            <g transform="scale(1.7)">
                                <VareIkon ikon={v.ikon} farge={v.farge} />
                            </g>
                            <text
                                y={66}
                                textAnchor="middle"
                                fontSize={28}
                                fontWeight={800}
                                fill="#292524"
                                stroke="#f8f1e3"
                                strokeWidth={6}
                                paintOrder="stroke"
                            >
                                {v.navn}
                            </text>
                        </g>
                    </motion.g>
                );
            })}
        </motion.g>
    );
}

function VareIkon({ ikon, farge }: { ikon: Ikon; farge: string }) {
    switch (ikon) {
        case 'pepper':
            return (
                <g fill={farge}>
                    {[-14, 0, 14, -7, 7].map((x, i) => (
                        <circle key={i} cx={x} cy={i < 3 ? 6 : -8} r={8} />
                    ))}
                </g>
            );
        case 'stein':
            return (
                <path
                    d="M -22 -6 L -10 -22 L 10 -22 L 22 -6 L 0 22 Z"
                    fill={farge}
                    stroke="#fff"
                    strokeWidth={3}
                />
            );
        case 'perle':
            return (
                <g>
                    {[-16, 0, 16].map((x) => (
                        <circle
                            key={x}
                            cx={x}
                            cy={0}
                            r={10}
                            fill="#f1f5f9"
                            stroke={farge}
                            strokeWidth={3}
                        />
                    ))}
                </g>
            );
        case 'skall':
            return (
                <g>
                    <ellipse rx={26} ry={18} fill={farge} />
                    <path
                        d="M -10 -10 L 10 -10 L 14 4 L 0 12 L -14 4 Z"
                        fill="#d97706"
                        opacity={0.7}
                    />
                </g>
            );
        case 'elfenben':
            return (
                <path
                    d="M -26 14 Q -10 -30 26 -18 Q -2 -12 -16 18 Z"
                    fill="#f5f5f4"
                    stroke={farge}
                    strokeWidth={3}
                />
            );
        case 'glass':
            return (
                <g>
                    <path
                        d="M -12 22 L -16 -8 Q 0 -28 16 -8 L 12 22 Z"
                        fill={farge}
                        opacity={0.75}
                    />
                    <rect x={-6} y={-26} width={12} height={10} fill={farge} />
                </g>
            );
        case 'metall':
            return (
                <path
                    d="M -26 14 L -16 -10 L 16 -10 L 26 14 Z"
                    fill={farge}
                    stroke="#fff"
                    strokeWidth={3}
                />
            );
        case 'vin':
            return (
                <g>
                    <path
                        d="M -14 22 Q -24 -2 -8 -14 L -6 -24 L 6 -24 L 8 -14 Q 24 -2 14 22 Z"
                        fill="#c2703d"
                    />
                    <ellipse cx={0} cy={-24} rx={9} ry={4} fill={farge} />
                </g>
            );
        case 'mynt':
            return (
                <g>
                    {[0, 1, 2].map((i) => (
                        <ellipse
                            key={i}
                            cx={0}
                            cy={14 - i * 9}
                            rx={22}
                            ry={8}
                            fill="#facc15"
                            stroke={farge}
                            strokeWidth={3}
                        />
                    ))}
                </g>
            );
        case 'rav':
            return (
                <path
                    d="M 0 -24 C 22 -24 28 -4 24 10 C 20 24 -14 26 -20 14 C -28 0 -18 -24 0 -24 Z"
                    fill={farge}
                    stroke="#92400e"
                    strokeWidth={3}
                />
            );
        case 'pels':
            return (
                <path
                    d="M -26 -14 Q -20 -22 -10 -16 Q 0 -24 10 -16 Q 20 -22 26 -14 L 20 18 Q 0 26 -20 18 Z"
                    fill={farge}
                />
            );
    }
}

/** Myntskatten i India og handelsstasjonen ved Arikamedu. */
function Myntskatt() {
    const keisere = ['Augustus', 'Tiberius', 'Nero'];
    return (
        <motion.g
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <rect
                x={260}
                y={190}
                width={1080}
                height={560}
                rx={28}
                fill="#ffffff"
                stroke="#ca8a04"
                strokeWidth={6}
            />
            <text x={800} y={262} textAnchor="middle" fontSize={40} fontWeight={900} fill="#78350f">
                Skatter av romerske mynter i India
            </text>
            {keisere.map((k, i) => (
                <motion.g
                    key={k}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        delay: 0.8 + i * 0.4,
                        type: 'spring',
                        stiffness: 160,
                        damping: 14,
                    }}
                    style={{ transformOrigin: `${520 + i * 280}px 410px` }}
                >
                    <circle
                        cx={520 + i * 280}
                        cy={410}
                        r={86}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={8}
                    />
                    <circle
                        cx={520 + i * 280}
                        cy={410}
                        r={66}
                        fill="none"
                        stroke="#a16207"
                        strokeWidth={3}
                    />
                    <text
                        x={520 + i * 280}
                        y={422}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={900}
                        fill="#713f12"
                    >
                        {k}
                    </text>
                </motion.g>
            ))}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                <rect x={420} y={570} width={760} height={120} rx={20} fill="#7e22ce" />
                <text
                    x={800}
                    y={622}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    Arikamedu, nær dagens Puducherry
                </text>
                <text
                    x={800}
                    y={668}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#ede9fe"
                >
                    En romersk handelsstasjon
                </text>
            </motion.g>
        </motion.g>
    );
}

/** Tidslinje: fra steinalderen til Romerriket, med rav hele veien. */
function Steinalder() {
    return (
        <motion.g
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <rect
                x={200}
                y={300}
                width={1200}
                height={340}
                rx={28}
                fill="#ffffff"
                stroke="#d97706"
                strokeWidth={6}
            />
            <line
                x1={400}
                y1={500}
                x2={1200}
                y2={500}
                stroke="#78350f"
                strokeWidth={10}
                strokeLinecap="round"
            />
            <motion.line
                x1={400}
                y1={500}
                x2={1200}
                y2={500}
                stroke="#d97706"
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 2 }}
            />
            <circle cx={400} cy={500} r={22} fill="#78350f" />
            <circle cx={1200} cy={500} r={22} fill="#7e22ce" />
            <text x={400} y={580} textAnchor="middle" fontSize={34} fontWeight={900} fill="#78350f">
                Steinalderen
            </text>
            <text
                x={1200}
                y={580}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#7e22ce"
            >
                Romerriket
            </text>
            <text x={800} y={400} textAnchor="middle" fontSize={38} fontWeight={900} fill="#92400e">
                Rav har vært en viktig vare hele veien
            </text>
            {[560, 720, 880, 1040].map((x, i) => (
                <motion.g
                    key={x}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + i * 0.4 }}
                >
                    <g transform={`translate(${x} 470)`}>
                        <VareIkon ikon="rav" farge="#d97706" />
                    </g>
                </motion.g>
            ))}
        </motion.g>
    );
}
