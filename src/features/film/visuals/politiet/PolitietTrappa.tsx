import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Hakk, SvgKort, SvgOverskrift } from './felles';

/**
 * Trappa med tre trinn: jo mer politiet griper inn, jo strengere krav.
 * «trinn1», «trinn2», «trinn3»: ett trinn lyser, med eksempler og krav i panelet til venstre.
 * «frist»: en tidslinje over hvor lenge politiet kan holde en pågrepet, og til slutt mønsteret.
 */

type Modus = 'trinn1' | 'trinn2' | 'trinn3' | 'frist';

const TRINN = [
    { nr: 1, navn: 'Ingen mistanke', farge: '#0d9488' },
    { nr: 2, navn: 'Mistanke', farge: '#d97706' },
    { nr: 3, navn: 'Dommer sier ja', farge: '#be123c' },
];

const BAKKE = 820;
const BREDDE = 380;
const HOYDE = 150;
const X0 = 420;

function trinnTopp(i: number) {
    return BAKKE - (i + 1) * HOYDE;
}

function Trapp({ aktiv, visNavn, synlig = 3 }: { aktiv: number; visNavn: boolean; synlig?: number }) {
    return (
        <>
            {TRINN.map((t, i) => {
                const x = X0 + i * BREDDE;
                const y = trinnTopp(i);
                const lys = aktiv === i;
                const vis = i < synlig;
                return (
                    <motion.g
                        key={t.nr}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: vis ? (aktiv < 0 || lys ? 1 : 0.45) : 0 }}
                        transition={{ duration: 0.6, delay: aktiv < 0 ? i * 0.3 : 0 }}
                    >
                        <rect x={x} y={y} width={BREDDE} height={BAKKE - y} fill={lys ? t.farge : '#cbd5e1'} />
                        <rect x={x} y={y} width={BREDDE} height={16} fill={lys ? '#0f172a' : '#94a3b8'} opacity={0.25} />
                        <text x={x + 40} y={y + 90} fontSize={72} fontWeight={900} fill={lys ? '#ffffff' : '#475569'}>
                            {t.nr}
                        </text>
                        {visNavn && (
                            <text x={x + 110} y={y + 82} fontSize={28} fontWeight={800} fill={lys ? '#ffffff' : '#334155'}>
                                {t.navn}
                            </text>
                        )}
                    </motion.g>
                );
            })}
        </>
    );
}

/** En liten figur som står på trinnet. */
function Figur({ trinn }: { trinn: number }) {
    const x = X0 + trinn * BREDDE + BREDDE - 70;
    const y = trinnTopp(trinn);
    return (
        <motion.g initial={false} animate={{ x, y }} transition={{ type: 'spring', stiffness: 90, damping: 16 }}>
            <circle cx={0} cy={-96} r={22} fill="#f1c9a5" />
            <rect x={-24} y={-72} width={48} height={72} rx={18} fill="#334155" />
        </motion.g>
    );
}

interface Rad {
    tittel: string;
    tekst?: string;
    fraBeat: number;
}

const PANEL: Record<Exclude<Modus, 'frist'>, Rad[]> = {
    trinn1: [
        { tittel: 'Be folk gå hjem', tekst: 'for å stanse uro', fraBeat: 2 },
        { tittel: 'Ta med folk i fare', tekst: 'så fulle at de er en fare', fraBeat: 3 },
        { tittel: 'Hjelpe syke', tekst: 'som ikke klarer seg selv', fraBeat: 3 },
    ],
    trinn2: [
        { tittel: 'Skjellig grunn til mistanke', tekst: 'en klar og god grunn', fraBeat: 1 },
        { tittel: 'Kan gi over seks måneder', tekst: 'i fengsel', fraBeat: 2 },
        { tittel: 'En særlig grunn', tekst: 'kan rømme eller ødelegge bevis', fraBeat: 2 },
    ],
    trinn3: [
        { tittel: 'Grunnloven § 102', tekst: 'hjemmet er godt beskyttet', fraBeat: 1 },
        { tittel: 'Du sier nei?', tekst: 'Da bestemmer retten', fraBeat: 2 },
        { tittel: 'Haster det veldig?', tekst: 'Da kan påtalemyndigheten', fraBeat: 3 },
    ],
};

const OVERSKRIFT: Record<Modus, string[]> = {
    trinn1: ['En trapp med tre trinn', 'Høyere opp: strengere krav', 'Trinn 1: ingen mistanke', 'Trinn 1: ingen mistanke'],
    trinn2: ['Trinn 2: mistanke', 'For å pågripe noen', 'For å pågripe noen', 'Tatt på fersk gjerning'],
    trinn3: ['Trinn 3: en dommer må si ja', 'Hjemmet ditt', 'Hjemmet ditt', 'Hjemmet ditt'],
    frist: ['Innesperret over tid', 'Fristen i dag', 'Fristen før 2022', 'Mønsteret'],
};

function Panel({ rader, beat, farge }: { rader: Rad[]; beat: number; farge: string }) {
    return (
        <>
            {rader
                .filter((r) => beat >= r.fraBeat)
                .map((r, i) => (
                    <g key={r.tittel}>
                        <SvgKort x={60} y={150 + i * 132} tittel={r.tittel} tekst={r.tekst} farge={farge} bredde={600} fokus={beat === r.fraBeat} />
                        <Hakk x={700} y={150 + i * 132 + 56} r={20} />
                    </g>
                ))}
        </>
    );
}

function Hus({ x, y, nei }: { x: number; y: number; nei: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <path d={`M ${x - 90} ${y} L ${x - 90} ${y - 110} L ${x} ${y - 180} L ${x + 90} ${y - 110} L ${x + 90} ${y} Z`} fill="#fef3c7" stroke="#92400e" strokeWidth={6} />
            <rect x={x - 26} y={y - 80} width={52} height={80} fill="#92400e" />
            {nei && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={x + 60} y={y - 250} width={130} height={76} rx={20} fill="#ffffff" stroke="#be123c" strokeWidth={5} />
                    <text x={x + 125} y={y - 198} textAnchor="middle" fontSize={40} fontWeight={900} fill="#be123c">
                        Nei
                    </text>
                </motion.g>
            )}
        </motion.g>
    );
}

function Klubbe({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <rect x={x - 70} y={y - 20} width={140} height={20} rx={6} fill="#78350f" />
            <rect x={x - 12} y={y - 150} width={24} height={110} rx={8} fill="#92400e" transform={`rotate(-35 ${x} ${y - 60})`} />
            <rect x={x - 60} y={y - 180} width={70} height={46} rx={10} fill="#78350f" transform={`rotate(-35 ${x} ${y - 60})`} />
        </motion.g>
    );
}

function Frist({ beat }: { beat: number }) {
    const x0 = 160;
    const x1 = 1440;
    const per = (x1 - x0) / 72;
    const y = 470;
    if (beat >= 3) {
        return (
            <>
                <Trapp aktiv={-1} visNavn />
                <SvgKort x={60} y={180} tittel="Be folk gå hjem" tekst="krever nesten ingenting" farge="#0d9488" bredde={520} />
                <line x1={320} y1={292} x2={X0 + 180} y2={trinnTopp(0) - 10} stroke="#0d9488" strokeWidth={5} />
                <SvgKort x={720} y={150} tittel="Ransake hjemmet ditt" tekst="en uavhengig dommer har vurdert" farge="#be123c" bredde={560} />
                <line x1={1240} y1={262} x2={X0 + BREDDE * 2 + 190} y2={trinnTopp(2) - 10} stroke="#be123c" strokeWidth={5} />
            </>
        );
    }
    return (
        <>
            <rect x={x0} y={y - 40} width={x1 - x0} height={80} rx={18} fill="#e2e8f0" />
            {beat >= 2 && (
                <motion.rect
                    x={x0}
                    y={y - 40}
                    height={80}
                    rx={18}
                    initial={{ width: 0 }}
                    animate={{ width: 72 * per }}
                    transition={{ duration: 1.2 }}
                    fill="#94a3b8"
                />
            )}
            {beat >= 1 && (
                <motion.rect
                    x={x0}
                    y={y - 40}
                    height={80}
                    rx={18}
                    initial={{ width: 0 }}
                    animate={{ width: 48 * per }}
                    transition={{ duration: 1.4 }}
                    fill="#be123c"
                />
            )}
            <text x={x0} y={y + 100} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                0 timer
            </text>
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    <line x1={x0 + 48 * per} y1={y - 70} x2={x0 + 48 * per} y2={y + 70} stroke="#0f172a" strokeWidth={6} />
                    <text x={x0 + 48 * per} y={y + 120} textAnchor="middle" fontSize={44} fontWeight={900} fill="#be123c">
                        48 timer
                    </text>
                    <text x={x0 + 48 * per} y={y + 170} textAnchor="middle" fontSize={30} fontWeight={700} fill="#334155">
                        fri, eller fram for tingretten
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <line x1={x1} y1={y - 70} x2={x1} y2={y + 70} stroke="#64748b" strokeWidth={6} />
                    <text x={x1} y={y - 90} textAnchor="end" fontSize={40} fontWeight={900} fill="#475569">
                        72 timer før 2022
                    </text>
                </motion.g>
            )}
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={700} y={170} width={200} height={200} rx={16} fill="#334155" />
                    {[740, 780, 820, 860].map((sx) => (
                        <rect key={sx} x={sx - 5} y={170} width={10} height={200} fill="#cbd5e1" />
                    ))}
                    <text x={800} y={640} textAnchor="middle" fontSize={38} fontWeight={800} fill="#be123c">
                        Også her må retten si ja
                    </text>
                </motion.g>
            )}
        </>
    );
}

export function PolitietTrappa({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'trinn1';
    const linjer = OVERSKRIFT[modus];
    const overskrift = linjer[Math.min(beat, linjer.length - 1)];

    let innhold;
    if (modus === 'frist') {
        innhold = <Frist beat={beat} />;
    } else {
        const nr = modus === 'trinn1' ? 0 : modus === 'trinn2' ? 1 : 2;
        const aktiv = modus === 'trinn1' && beat < 2 ? -1 : nr;
        innhold = (
            <>
                <Trapp aktiv={aktiv} visNavn={!(modus === 'trinn1' && beat < 2)} />
                {modus === 'trinn1' && beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <line x1={X0 + 60} y1={trinnTopp(0) - 60} x2={X0 + BREDDE * 2 + 300} y2={trinnTopp(2) - 120} stroke="#0f172a" strokeWidth={10} strokeLinecap="round" />
                        <path d={`M ${X0 + BREDDE * 2 + 300} ${trinnTopp(2) - 120} l -46 -4 l 22 40 Z`} fill="#0f172a" />
                        <SvgKort x={X0 - 20} y={200} tittel="Mer inngrep" tekst="strengere krav fra loven" farge="#0f172a" />
                    </motion.g>
                )}
                {(modus !== 'trinn1' || beat >= 2) && <Figur trinn={nr} />}
                <Panel rader={PANEL[modus]} beat={beat} farge={TRINN[nr].farge} />
                {modus === 'trinn2' && beat >= 3 && (
                    <SvgKort x={X0 + BREDDE + 20} y={130} tittel="På fersk gjerning" tekst="ransake med en gang" farge="#d97706" fokus />
                )}
                {modus === 'trinn3' && beat === 0 && <Klubbe x={X0 + BREDDE * 2 + 190} y={trinnTopp(2) - 20} />}
                {modus === 'trinn3' && beat >= 1 && <Hus x={X0 + BREDDE * 2 + 150} y={trinnTopp(2)} nei={beat >= 2} />}
            </>
        );
    }

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#f1f5f9 0%,#ffffff 80%)' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {innhold}
                <SvgOverskrift tekst={overskrift} />
            </svg>
        </div>
    );
}
