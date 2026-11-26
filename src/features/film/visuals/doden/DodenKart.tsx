import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartene i dødsfilmen, i tre modus:
 * - iran: linja. Abraham som stamfar, og tanken om en dom som vi møter først i Iran.
 * - india: ringen. De indiske tradisjonene, og Tibet med bardo, en mellomstopp på 49 dager.
 * - sapmi: samisk religion. Flere verdener, noaiden og de dødes rike i det samme landskapet.
 */

type Modus = 'iran' | 'india' | 'sapmi';
type LL = [number, number];

const B = 1600;
const H = 900;

const IRAN = 364;
const INDIA = 356;

const SAPMI_UTSNITT: Utsnitt = [
    [3, 61],
    [45, 72],
];

/** Sápmi, grovt tegnet. Uskarp kant: det finnes ingen skarp grense. */
const SAPMI: LL[] = [
    [9.8, 63.4],
    [12, 62.3],
    [14.5, 62.6],
    [17, 64.3],
    [20.5, 65.4],
    [24.5, 65.9],
    [28, 66.2],
    [33, 66.5],
    [36.5, 66.2],
    [41, 67],
    [41.4, 68.3],
    [38, 69.3],
    [33, 69.8],
    [30, 70.3],
    [28, 71.1],
    [24, 71],
    [20, 70.2],
    [17, 69.4],
    [14.5, 68.2],
    [12.5, 66.5],
    [11, 65],
];

const OVERSKRIFT: Record<Modus, string[]> = {
    iran: [
        'Linja: tre religioner',
        'Ett liv, så et oppgjør',
        'Iran: zoroastrismen',
        'Samme tanke i tre religioner',
    ],
    india: ['Ringen: uenige om detaljene', 'Hinduer: to syn', 'Tibet: bardo', 'Buddhister: to syn'],
    sapmi: [
        'Sápmi: flere verdener',
        'Verdenene',
        'Noaiden reiser',
        'I det samme landskapet',
        'Samisk religion i dag',
    ],
};

function projeksjonFor(modus: Modus): GeoProjection {
    const [sv, no]: [LL, LL] =
        modus === 'iran'
            ? [
                  [12, 12],
                  [72, 44],
              ]
            : modus === 'india'
              ? [
                    [64, 6],
                    [100, 37],
                ]
              : SAPMI_UTSNITT;
    const mal: [[number, number], [number, number]] =
        modus === 'sapmi'
            ? [
                  [40, 130],
                  [1560, 880],
              ]
            : [
                  [30, 110],
                  [1060, H - 30],
              ];
    return geoNaturalEarth1().fitExtent(mal, {
        type: 'MultiPoint',
        coordinates: [sv, no],
    } as never);
}

function landFarge(modus: Modus, beat: number, id: number): string {
    if (modus === 'iran' && beat >= 2 && id === IRAN) return '#d97706';
    if (modus === 'india' && id === INDIA) return beat === 0 || beat === 1 ? '#f472b6' : '#fbcfe8';
    return '#efe9dc';
}

function Kort({ children, plass = 'hoyre' }: { children: ReactNode; plass?: 'hoyre' | 'venstre' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
            style={
                plass === 'hoyre'
                    ? { right: '3%', top: '20%', width: '31%' }
                    : { left: '3%', bottom: '5%', width: '36%' }
            }
        >
            {children}
        </motion.div>
    );
}

const RELIGIONER = ['Jødedom', 'Kristendom', 'Islam'];

function Dager({ beat }: { beat: number }) {
    return (
        <div className="mt-1">
            <div className="text-2xl font-black text-slate-900">Tiden mellom to liv</div>
            <div className="mt-4">
                <div className="text-xl font-bold text-pink-800">Tibet: bardo</div>
                <div className="relative h-8 rounded-full bg-slate-200 overflow-hidden mt-1">
                    <motion.div
                        className="absolute left-0 top-0 bottom-0 bg-pink-600"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.2, delay: 0.5 }}
                    />
                </div>
                <div className="text-2xl font-black text-pink-800 mt-1">49 dager</div>
            </div>
            {beat >= 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                    <div className="text-xl font-bold text-amber-800">Theravada</div>
                    <div className="relative h-8 rounded-full bg-slate-200 overflow-hidden mt-1">
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-amber-600"
                            style={{ width: 8 }}
                        />
                    </div>
                    <div className="text-2xl font-black text-amber-800 mt-1">med en gang</div>
                </motion.div>
            )}
        </div>
    );
}

const VERDENER = [
    { navn: 'de dødes rike', egen: 'Jábmiid áibmu' },
    { navn: 'et paradis', egen: 'Sáivu' },
    { navn: 'et dyrerike', egen: '' },
    { navn: 'et himmelrike', egen: '' },
    { navn: 'en underverden', egen: '' },
];

function KortInnhold({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'iran') {
        if (beat === 0 || beat === 3)
            return (
                <Kort key={`i${beat}`}>
                    {RELIGIONER.map((r, i) => (
                        <motion.div
                            key={r}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.3 }}
                            className="text-3xl font-black text-slate-900"
                        >
                            {beat === 3 ? '✓ ' : ''}
                            {r}
                        </motion.div>
                    ))}
                    <div className="text-2xl font-bold text-amber-800 mt-3">
                        {beat === 0 ? 'stamfar: Abraham' : 'tar tanken om en dom videre'}
                    </div>
                </Kort>
            );
        if (beat === 1)
            return (
                <Kort key="i1">
                    <div className="text-3xl font-black text-slate-900">ett liv</div>
                    <div className="text-3xl font-black text-slate-400">↓</div>
                    <div className="text-3xl font-black text-amber-800">et oppgjør</div>
                </Kort>
            );
        return (
            <Kort key="i2">
                <div className="text-3xl font-black text-amber-800">Zoroastrismen</div>
                <div className="text-2xl font-bold text-slate-700 mt-2">
                    Her møter vi først tanken om at Gud skal dømme mellom gode og onde.
                </div>
            </Kort>
        );
    }
    if (modus === 'india') {
        if (beat === 0)
            return (
                <Kort key="n0">
                    <div className="text-2xl font-bold text-slate-700">hinduismen</div>
                    <div className="text-2xl font-bold text-slate-700">buddhismen</div>
                    <div className="text-2xl font-bold text-slate-700">sikhismen</div>
                    <div className="text-2xl font-black text-pink-800 mt-2">
                        samme ring, ulike detaljer
                    </div>
                </Kort>
            );
        if (beat === 1)
            return (
                <Kort key="n1">
                    <div className="text-2xl font-black text-slate-900">Mange hinduer:</div>
                    <div className="text-2xl font-bold text-pink-800">
                        først en ånd på vei mot forfedrenes verden
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-3">Andre hinduer:</div>
                    <div className="text-2xl font-bold text-pink-800">rett til en ny fødsel</div>
                </Kort>
            );
        return (
            <Kort key="n2">
                <Dager beat={beat} />
            </Kort>
        );
    }
    if (beat === 0)
        return (
            <Kort key="s0" plass="venstre">
                <div className="text-3xl font-black text-slate-900">Samisk religion</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">
                    flere verdener ved siden av vår egen
                </div>
            </Kort>
        );
    if (beat === 1)
        return (
            <Kort key="s1" plass="venstre">
                {VERDENER.map((w, i) => (
                    <motion.div
                        key={w.navn}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.35 }}
                        className="text-2xl font-bold text-slate-800"
                    >
                        {w.navn}
                        {w.egen && (
                            <span className="font-black text-indigo-800">{`: ${w.egen}`}</span>
                        )}
                    </motion.div>
                ))}
            </Kort>
        );
    if (beat === 2)
        return (
            <Kort key="s2" plass="venstre">
                <div className="text-3xl font-black text-indigo-900">Noaiden, sjamanen</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">reiser dit med sjelen</div>
                <div className="text-2xl font-bold text-slate-500 mt-1">
                    kroppen blir liggende igjen
                </div>
            </Kort>
        );
    if (beat === 3)
        return (
            <Kort key="s3" plass="venstre">
                <div className="text-2xl font-black text-indigo-900">
                    De dødes rike: ikke langt borte
                </div>
                <div className="text-2xl font-bold text-slate-700 mt-1">
                    Troen: fjell, steiner og sjøer har en egen åndelig kraft
                </div>
            </Kort>
        );
    return (
        <Kort key="s4" plass="venstre">
            <div className="text-2xl font-bold text-slate-800">
                I dag: kristendommen er mest utbredt i Sápmi
            </div>
            <div className="text-2xl font-black text-indigo-900 mt-2">
                Siden 1970-tallet: flere er interessert i den gamle religionen igjen
            </div>
        </Kort>
    );
}

function Fjell({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 34} ${y + 22} L ${x} ${y - 30} L ${x + 34} ${y + 22} Z`}
            fill="#57534e"
            stroke="#fff"
            strokeWidth={4}
        />
    );
}

export function DodenKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'iran';
    const { geographies } = useFilmVerden(modus === 'sapmi' ? SAPMI_UTSNITT : undefined);
    const projeksjon = useMemo(() => projeksjonFor(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const xy = (ll: LL) => projeksjon(ll) as [number, number];
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const sapmiSti =
        modus === 'sapmi'
            ? (sti({ type: 'Polygon', coordinates: [[...SAPMI, SAPMI[0]].reverse()] } as never) ??
              '')
            : '';

    return (
        <div className="absolute inset-0" style={{ background: '#cfe3f0' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <clipPath id="doden-land">
                        {geographies.map((g, i) => (
                            <path key={i} d={sti(g as never) ?? undefined} />
                        ))}
                    </clipPath>
                    <filter id="doden-uskarp" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="18" />
                    </filter>
                </defs>
                {geographies.map((g, i) => (
                    <motion.path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        initial={false}
                        animate={{ fill: landFarge(modus, beat, Number(g.id)) }}
                        transition={{ duration: 0.9 }}
                        stroke="#a8a29e"
                        strokeWidth={1.2}
                    />
                ))}

                {modus === 'iran' &&
                    beat >= 2 &&
                    (() => {
                        const [x, y] = xy([54, 32.5]);
                        return (
                            <motion.text
                                key="iran"
                                x={x}
                                y={y + 14}
                                textAnchor="middle"
                                fontSize={54}
                                fontWeight={900}
                                fill="#7c2d12"
                                stroke="#fff"
                                strokeWidth={9}
                                paintOrder="stroke"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                IRAN
                            </motion.text>
                        );
                    })()}

                {modus === 'india' &&
                    (beat === 0 || beat === 1) &&
                    (() => {
                        const [x, y] = xy([79, 21]);
                        return (
                            <motion.text
                                key="india"
                                x={x}
                                y={y}
                                textAnchor="middle"
                                fontSize={54}
                                fontWeight={900}
                                fill="#831843"
                                stroke="#fff"
                                strokeWidth={9}
                                paintOrder="stroke"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                INDIA
                            </motion.text>
                        );
                    })()}
                {modus === 'india' &&
                    beat >= 2 &&
                    (() => {
                        const [x, y] = xy([88, 31]);
                        return (
                            <motion.g
                                key="tibet"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                            >
                                <ellipse
                                    cx={x}
                                    cy={y}
                                    rx={170}
                                    ry={80}
                                    fill="#db2777"
                                    fillOpacity={0.18}
                                    stroke="#db2777"
                                    strokeWidth={5}
                                    strokeDasharray="14 10"
                                />
                                <text
                                    x={x}
                                    y={y + 16}
                                    textAnchor="middle"
                                    fontSize={50}
                                    fontWeight={900}
                                    fill="#831843"
                                    stroke="#fff"
                                    strokeWidth={9}
                                    paintOrder="stroke"
                                >
                                    TIBET
                                </text>
                            </motion.g>
                        );
                    })()}

                {modus === 'sapmi' && (
                    <g clipPath="url(#doden-land)">
                        <motion.path
                            d={sapmiSti}
                            fill="#6366f1"
                            filter="url(#doden-uskarp)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat === 3 ? 0.65 : 0.45 }}
                            transition={{ duration: 1.2 }}
                        />
                    </g>
                )}
                {modus === 'sapmi' &&
                    (beat === 0 || beat === 4) &&
                    (() => {
                        const [x, y] = xy([25, 68.6]);
                        return (
                            <motion.g
                                key="sapmi-navn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <text
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    fontSize={56}
                                    fontWeight={900}
                                    fill="#312e81"
                                    stroke="#fff"
                                    strokeWidth={9}
                                    paintOrder="stroke"
                                >
                                    SÁPMI
                                </text>
                                <text
                                    x={x}
                                    y={y + 44}
                                    textAnchor="middle"
                                    fontSize={30}
                                    fontWeight={700}
                                    fill="#312e81"
                                    stroke="#fff"
                                    strokeWidth={7}
                                    paintOrder="stroke"
                                >
                                    omtrentlig område
                                </text>
                            </motion.g>
                        );
                    })()}
                {modus === 'sapmi' &&
                    beat === 2 &&
                    (() => {
                        const [x, y] = xy([23, 68.4]);
                        return (
                            <motion.g
                                key="noaide"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <circle
                                    cx={x}
                                    cy={y - 26}
                                    r={18}
                                    fill="#78350f"
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <path
                                    d={`M ${x - 26} ${y + 40} Q ${x} ${y - 20} ${x + 26} ${y + 40} Z`}
                                    fill="#78350f"
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <motion.path
                                    d={`M ${x + 40} ${y - 30} C ${x + 160} ${y - 240}, ${x + 340} ${y - 220}, ${x + 400} ${y - 40} C ${x + 340} ${y + 120}, ${x + 160} ${y + 140}, ${x + 46} ${y + 20}`}
                                    fill="none"
                                    stroke="#4338ca"
                                    strokeWidth={7}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2.6, delay: 0.5 }}
                                />
                                <text
                                    x={x + 420}
                                    y={y - 40}
                                    fontSize={36}
                                    fontWeight={800}
                                    fill="#312e81"
                                    stroke="#fff"
                                    strokeWidth={7}
                                    paintOrder="stroke"
                                >
                                    en annen verden
                                </text>
                                <text
                                    x={x}
                                    y={y + 90}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#78350f"
                                    stroke="#fff"
                                    strokeWidth={7}
                                    paintOrder="stroke"
                                >
                                    noaiden
                                </text>
                            </motion.g>
                        );
                    })()}
                {modus === 'sapmi' &&
                    beat === 3 &&
                    (() => {
                        const f1 = xy([17, 67.4]);
                        const f2 = xy([20.5, 68.6]);
                        const s1 = xy([26, 69.4]);
                        const vann = xy([28.2, 68.9]);
                        return (
                            <motion.g
                                key="landskap"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Fjell x={f1[0]} y={f1[1]} />
                                <Fjell x={f2[0]} y={f2[1]} />
                                <text
                                    x={f2[0]}
                                    y={f2[1] - 46}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={800}
                                    fill="#292524"
                                    stroke="#fff"
                                    strokeWidth={7}
                                    paintOrder="stroke"
                                >
                                    fjell
                                </text>
                                <ellipse
                                    cx={s1[0]}
                                    cy={s1[1]}
                                    rx={26}
                                    ry={18}
                                    fill="#78716c"
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <text
                                    x={s1[0]}
                                    y={s1[1] - 32}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={800}
                                    fill="#292524"
                                    stroke="#fff"
                                    strokeWidth={7}
                                    paintOrder="stroke"
                                >
                                    stein
                                </text>
                                <ellipse
                                    cx={vann[0] + 40}
                                    cy={vann[1] + 70}
                                    rx={46}
                                    ry={20}
                                    fill="#2563eb"
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <text
                                    x={vann[0] + 40}
                                    y={vann[1] + 130}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={800}
                                    fill="#1e3a8a"
                                    stroke="#fff"
                                    strokeWidth={7}
                                    paintOrder="stroke"
                                >
                                    sjø
                                </text>
                            </motion.g>
                        );
                    })()}
            </svg>
            <AnimatePresence mode="wait">
                <KortInnhold key={`${modus}-${beat}`} modus={modus} beat={beat} />
            </AnimatePresence>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '4%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
