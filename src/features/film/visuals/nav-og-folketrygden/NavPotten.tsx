import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate, TelleTall } from '../shared';
import { NavMerke, NavOverskrift } from './NavFelles';

/**
 * Folketrygden som en stor pott.
 * - forsikring: eldre trygder samles i én pott (1967), alle som bor i Norge betaler litt,
 *   og potten betaler ut når livet går skeis.
 * - inn: pengene kommer fra tre steder. Folketrygden i statsbudsjettet 2018, og fordelingen
 *   mellom dem som jobber og staten.
 * - ut: Nav styrer over en tredel av statsbudsjettet og betalte ut 640 milliarder i 2023.
 */

type Modus = 'forsikring' | 'inn' | 'ut';

const OVERSKRIFT: Record<Modus, string[]> = {
    forsikring: [
        '1967: mange trygder blir én',
        'Alle som bor i Norge er med',
        'Mange betaler litt hver',
        'Hjelp når livet endrer seg',
        'Også lege og sykehus',
    ],
    inn: [
        'Hvor kommer pengene fra?',
        'Fra deg og fra arbeidsgiveren',
        'Resten: staten',
        'Folketrygden i 2018',
        'Hvem betaler mest?',
    ],
    ut: ['Nav og statsbudsjettet', 'Utbetalt fra Nav i 2023', 'Hvor gikk pengene?'],
};

const BLA = '#2563eb';
const TEAL = '#0d9488';
const ORANSJE = '#ea580c';

/** Potten: en bred krukke med munning øverst. Sentrum i (cx, topp). */
function Potte({
    cx,
    topp,
    fyll,
    fyllFarger,
}: {
    cx: number;
    topp: number;
    fyll: number;
    fyllFarger?: { andel: number; farge: string }[];
}) {
    const b = 260;
    const h = 170;
    const venstre = cx - b / 2;
    const sti = `M ${venstre + 10} ${topp} L ${venstre + b - 10} ${topp} Q ${venstre + b + 20} ${topp + h * 0.55} ${venstre + b - 30} ${topp + h} L ${venstre + 30} ${topp + h} Q ${venstre - 20} ${topp + h * 0.55} ${venstre + 10} ${topp} Z`;
    const lag = fyllFarger ?? [{ andel: 1, farge: '#60a5fa' }];
    const bunner = lag.map((_, i) =>
        lag.slice(0, i + 1).reduce((sum, l) => sum - h * fyll * l.andel, topp + h)
    );
    return (
        <g>
            <defs>
                <clipPath id="nav-potte">
                    <path d={sti} />
                </clipPath>
            </defs>
            <path d={sti} fill="#e2e8f0" />
            <g clipPath="url(#nav-potte)">
                {lag.map((l, i) => {
                    const hoyde = h * fyll * l.andel;
                    const y = bunner[i];
                    return (
                        <motion.rect
                            key={i}
                            x={venstre - 30}
                            width={b + 60}
                            initial={false}
                            animate={{ y, height: hoyde }}
                            transition={{ duration: 1.2 }}
                            fill={l.farge}
                        />
                    );
                })}
            </g>
            <path d={sti} fill="none" stroke="#334155" strokeWidth={5} />
            <rect x={venstre} y={topp - 12} width={b} height={16} rx={8} fill="#334155" />
        </g>
    );
}

/** Mange små figurer i et bånd: alle som bor i Norge. Tett, så de ikke kan telles. */
function Folkemengde({ synlig, dempet }: { synlig: boolean; dempet: boolean }) {
    const prikker = useMemo(() => {
        const p: { x: number; y: number }[] = [];
        for (let i = 0; i < 420; i++) {
            const a = Math.sin(i * 12.9898) * 43758.5453;
            const b = Math.sin(i * 78.233) * 12345.6789;
            p.push({ x: 80 + (a - Math.floor(a)) * 840, y: 92 + (b - Math.floor(b)) * 62 });
        }
        return p;
    }, []);
    if (!synlig) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: dempet ? 0.35 : 1 }}
            transition={{ duration: 0.8 }}
        >
            {prikker.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4.2} fill={BLA} />
            ))}
        </motion.g>
    );
}

/** Mynter som faller fra folkemengden ned i potten. */
function Mynter({ synlig }: { synlig: boolean }) {
    if (!synlig) return null;
    const xer = [230, 330, 430, 520, 610, 700, 780];
    return (
        <g>
            {xer.map((x, i) => {
                const mal = 500 + (x - 500) * 0.25;
                return (
                    <motion.circle
                        key={i}
                        r={10}
                        fill="#f59e0b"
                        stroke="#b45309"
                        strokeWidth={3}
                        cx={0}
                        cy={0}
                        initial={{ x, y: 160, opacity: 0 }}
                        animate={{ x: [x, mal], y: [160, 250], opacity: [0, 1, 1, 0] }}
                        transition={{
                            duration: 1.6,
                            delay: i * 0.25,
                            repeat: Infinity,
                            repeatDelay: 0.4,
                        }}
                    />
                );
            })}
        </g>
    );
}

const SITUASJONER = [
    'Syk',
    'Får barn',
    'Mister jobben',
    'Blir gammel',
    'Kan ikke jobbe',
    'Noen dør',
];

function Forsikring({ beat }: { beat: number }) {
    const smaa = [150, 300, 700, 850, 500];
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                <Folkemengde synlig={beat >= 1} dempet={beat >= 3} />
                {beat >= 3 &&
                    SITUASJONER.map((_, i) => {
                        const x = 95 + i * 162;
                        return (
                            <motion.path
                                key={i}
                                d={`M ${470 + i * 12} 410 C ${470 + i * 12} 450, ${x} 430, ${x} 462`}
                                fill="none"
                                stroke={TEAL}
                                strokeWidth={6}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 + i * 0.35 }}
                            />
                        );
                    })}
                <Potte cx={500} topp={240} fyll={beat === 0 ? 0.15 : beat === 1 ? 0.3 : 0.75} />
                <Mynter synlig={beat === 2} />
                {smaa.map((x, i) => (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={
                            beat === 0
                                ? { x: [x - 500, (i - 2) * 52], y: [-100, 50], opacity: 1 }
                                : { opacity: 0 }
                        }
                        transition={{ duration: 2.2, delay: 0.6 + i * 0.25 }}
                    >
                        <rect
                            x={478}
                            y={200}
                            width={44}
                            height={46}
                            rx={8}
                            fill="#94a3b8"
                            stroke="#475569"
                            strokeWidth={4}
                        />
                    </motion.g>
                ))}
            </svg>
            <div
                className="absolute pointer-events-none flex justify-center"
                style={{ left: 370, width: 260, top: 330 }}
            >
                <div
                    className="px-3 py-1 rounded-lg bg-white/90 font-black text-slate-900"
                    style={{ fontSize: 24 }}
                >
                    Folketrygden
                </div>
            </div>
            <NavMerke synlig={beat === 0} style={{ left: 120, top: 260 }} farge="#475569">
                eldre trygder
            </NavMerke>
            <NavMerke
                synlig={beat === 0}
                style={{ right: 40, top: 230 }}
                farge={BLA}
                forsinkelse={2.4}
            >
                Fra 1. januar 1967
            </NavMerke>
            <NavMerke synlig={beat === 1 || beat === 2} style={{ left: 40, top: 175 }} farge={BLA}>
                alle som bor i Norge
            </NavMerke>
            <NavMerke
                synlig={beat === 1}
                style={{ right: 40, top: 260 }}
                farge="#475569"
                forsinkelse={0.8}
            >
                Melde seg ut? Nei.
            </NavMerke>
            {beat >= 3 && (
                <div className="absolute flex gap-3" style={{ left: 18, top: 466 }}>
                    {SITUASJONER.map((s, i) => (
                        <motion.div
                            key={s}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.35 }}
                            className="rounded-xl bg-white shadow-lg text-center font-bold text-slate-900 flex items-center justify-center"
                            style={{ width: 150, height: 56, fontSize: 21 }}
                        >
                            {s}
                        </motion.div>
                    ))}
                </div>
            )}
            <NavMerke synlig={beat === 4} style={{ right: 36, top: 250 }} farge={TEAL}>
                + en del av lege
                <br />
                og sykehus
            </NavMerke>
        </>
    );
}

const KILDER = [
    { x: 170, navn: 'Du', tekst: 'trygdeavgift, trukket av lønna', farge: BLA, fra: 1 },
    {
        x: 500,
        navn: 'Arbeidsgiveren',
        tekst: 'arbeidsgiveravgift for hver ansatt',
        farge: TEAL,
        fra: 1,
    },
    { x: 830, navn: 'Staten', tekst: 'betaler resten', farge: ORANSJE, fra: 2 },
];

function Inn({ beat }: { beat: number }) {
    const venstreForskyv = beat === 3 ? -150 : 0;
    const fyll = beat === 0 ? 0.05 : beat === 1 ? 0.55 : 0.9;
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                <motion.g
                    initial={false}
                    animate={{ x: venstreForskyv }}
                    transition={{ duration: 1 }}
                >
                    {KILDER.map((k) => {
                        const aktiv = beat >= k.fra && beat < 3;
                        const tilX = 500 + (k.x - 500) * 0.3;
                        return (
                            <g key={k.navn} opacity={beat >= 3 ? 0 : 1}>
                                <path
                                    d={`M ${k.x} 190 C ${k.x} 240, ${tilX} 220, ${tilX} 262`}
                                    fill="none"
                                    stroke={aktiv ? k.farge : '#cbd5e1'}
                                    strokeWidth={aktiv ? 16 : 8}
                                    strokeLinecap="round"
                                />
                            </g>
                        );
                    })}
                    <Potte
                        cx={500}
                        topp={275}
                        fyll={fyll}
                        fyllFarger={
                            beat >= 4
                                ? [
                                      { andel: 2 / 3, farge: '#14b8a6' },
                                      { andel: 1 / 3, farge: '#fb923c' },
                                  ]
                                : beat === 1
                                  ? [{ andel: 1, farge: '#14b8a6' }]
                                  : [
                                        { andel: 2 / 3, farge: '#14b8a6' },
                                        { andel: 1 / 3, farge: '#fb923c' },
                                    ]
                        }
                    />
                </motion.g>
                {beat === 3 && (
                    <g>
                        <rect
                            x={760}
                            y={150}
                            width={120}
                            height={360}
                            rx={10}
                            fill="#e2e8f0"
                            stroke="#334155"
                            strokeWidth={4}
                        />
                        <motion.rect
                            x={764}
                            width={112}
                            initial={{ y: 506, height: 0 }}
                            animate={{ y: 506 - 352 * 0.35, height: 352 * 0.35 }}
                            transition={{ duration: 1.4, delay: 0.4 }}
                            fill={BLA}
                        />
                    </g>
                )}
            </svg>
            {beat < 3 &&
                KILDER.map((k) => (
                    <div
                        key={k.navn}
                        className="absolute flex justify-center pointer-events-none"
                        style={{ left: k.x - 150, width: 300, top: 92 }}
                    >
                        <motion.div
                            initial={false}
                            animate={{ opacity: beat >= k.fra ? 1 : 0.45 }}
                            className="rounded-xl bg-white shadow-lg text-center px-3 py-1.5"
                            style={{ width: 250 }}
                        >
                            <div
                                className="font-black"
                                style={{ fontSize: 24, color: beat >= k.fra ? k.farge : '#64748b' }}
                            >
                                {beat >= k.fra ? k.navn : '?'}
                            </div>
                            <div
                                className="font-semibold text-slate-700"
                                style={{ fontSize: 18, minHeight: 22 }}
                            >
                                {beat >= k.fra ? k.tekst : ''}
                            </div>
                        </motion.div>
                    </div>
                ))}
            <motion.div
                className="absolute flex justify-center pointer-events-none"
                initial={false}
                animate={{ x: venstreForskyv }}
                transition={{ duration: 1 }}
                style={{ left: 370, width: 260, top: 372 }}
            >
                <div
                    className="px-3 py-1 rounded-lg bg-white/90 font-black text-slate-900"
                    style={{ fontSize: 24 }}
                >
                    Folketrygden
                </div>
            </motion.div>
            {beat === 3 && (
                <>
                    <div
                        className="absolute text-center font-bold text-slate-700"
                        style={{ left: 700, width: 240, top: 518, fontSize: 18 }}
                    >
                        hele statsbudsjettet
                    </div>
                    <NavMerke synlig style={{ left: 545, top: 345 }} farge={BLA} forsinkelse={1.2}>
                        35 prosent
                    </NavMerke>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute rounded-2xl bg-white shadow-xl text-center px-5 py-2"
                        style={{ left: 40, top: 110 }}
                    >
                        <div className="font-black text-slate-900" style={{ fontSize: 44 }}>
                            <TelleTall verdi={470} /> mrd. kr
                        </div>
                        <div className="font-semibold text-slate-600" style={{ fontSize: 18 }}>
                            brukte folketrygden i 2018
                        </div>
                    </motion.div>
                </>
            )}
            <NavMerke
                synlig={beat >= 4}
                style={{ left: 660, top: 385 }}
                farge="#0f766e"
                forsinkelse={0.8}
            >
                ca. to tredeler: medlemmer
                <br />
                og arbeidsgivere
            </NavMerke>
            <NavMerke
                synlig={beat >= 4}
                style={{ left: 660, top: 290 }}
                farge={ORANSJE}
                forsinkelse={1.2}
            >
                resten: staten
            </NavMerke>
        </>
    );
}

const STROMMER = [
    { x: 150, bredde: 34, navn: 'Alderspensjon' },
    { x: 360, bredde: 26, navn: 'Uføretrygd' },
    { x: 560, bredde: 8, navn: '' },
    { x: 690, bredde: 8, navn: '' },
    { x: 820, bredde: 8, navn: '' },
];

function Ut({ beat }: { beat: number }) {
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                <rect
                    x={100}
                    y={100}
                    width={800}
                    height={46}
                    rx={10}
                    fill="#e2e8f0"
                    stroke="#334155"
                    strokeWidth={4}
                />
                <motion.rect
                    x={104}
                    y={104}
                    height={38}
                    initial={{ width: 0 }}
                    animate={{ width: 792 / 3 }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                    fill={BLA}
                />
                {[1, 2].map((d) => (
                    <line
                        key={d}
                        x1={100 + (800 * d) / 3}
                        x2={100 + (800 * d) / 3}
                        y1={92}
                        y2={154}
                        stroke="#334155"
                        strokeWidth={3}
                        strokeDasharray="6 5"
                    />
                ))}
                {beat >= 2 &&
                    STROMMER.map((s, i) => (
                        <motion.path
                            key={i}
                            d={`M ${470 + i * 15} 395 C ${470 + i * 15} 440, ${s.x} 420, ${s.x} 470`}
                            fill="none"
                            stroke={s.navn ? TEAL : '#94a3b8'}
                            strokeWidth={s.bredde}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.9, delay: 0.2 + i * 0.2 }}
                        />
                    ))}
                <Potte cx={500} topp={225} fyll={beat >= 1 ? 0.85 : 0.5} />
            </svg>
            <div
                className="absolute font-bold text-slate-700"
                style={{ left: 100, top: 156, fontSize: 18 }}
            >
                statsbudsjettet
            </div>
            <NavMerke synlig style={{ left: 400, top: 160 }} farge={BLA} forsinkelse={1.2}>
                Nav: en tredel
            </NavMerke>
            <div
                className="absolute flex justify-center pointer-events-none"
                style={{ left: 370, width: 260, top: 320 }}
            >
                <div
                    className="px-3 py-1 rounded-lg bg-white/90 font-black text-slate-900"
                    style={{ fontSize: 24 }}
                >
                    Nav
                </div>
            </div>
            {beat >= 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute rounded-2xl bg-white shadow-xl text-center px-5 py-2"
                    style={{ left: 690, top: 250 }}
                >
                    <div className="font-black text-slate-900" style={{ fontSize: 44 }}>
                        <TelleTall verdi={640} /> mrd. kr
                    </div>
                    <div className="font-semibold text-slate-600" style={{ fontSize: 18 }}>
                        betalt ut i 2023
                    </div>
                </motion.div>
            )}
            {beat >= 2 && (
                <>
                    {STROMMER.filter((s) => s.navn).map((s, i) => (
                        <motion.div
                            key={s.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 + i * 0.3 }}
                            className="absolute flex justify-center"
                            style={{ left: s.x - 110, width: 220, top: 486 }}
                        >
                            <div
                                className="rounded-xl bg-teal-700 text-white font-black px-4 py-2 shadow-lg"
                                style={{ fontSize: 22 }}
                            >
                                {s.navn}
                            </div>
                        </motion.div>
                    ))}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                        className="absolute flex justify-center"
                        style={{ left: 580, width: 260, top: 490 }}
                    >
                        <div
                            className="rounded-xl bg-white text-slate-700 font-bold px-4 py-1.5 shadow"
                            style={{ fontSize: 19 }}
                        >
                            andre ordninger
                        </div>
                    </motion.div>
                </>
            )}
        </>
    );
}

export function NavPotten({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'forsikring';
    const liste = OVERSKRIFT[modus];
    return (
        <Flate bakgrunn="#f1f5f9">
            {modus === 'forsikring' && <Forsikring beat={beat} />}
            {modus === 'inn' && <Inn beat={beat} />}
            {modus === 'ut' && <Ut beat={beat} />}
            <NavOverskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </Flate>
    );
}
