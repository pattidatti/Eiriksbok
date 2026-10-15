import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Anchor, Building2, Factory, Landmark, TrainFront, Vote, Zap } from 'lucide-react';
import { geoNaturalEarth1, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld, type GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { TelleTall, Teller } from '../shared';

/**
 * Kart til filmen om Kina som supermakt.
 * - «verden»: Kina blir med i WTO. Varene strømmer ut, fabrikkene strømmer inn.
 * - «silkevei»: Belte og vei. Rutene over land og sjø, og pengene som følger med.
 * - «srilanka»: gjeldsfellen og havna i Hambantota.
 * - «taiwan»: øya, valgene, og striden mellom Kina, Taiwan og USA.
 */

type Modus = 'verden' | 'silkevei' | 'srilanka' | 'taiwan';
type LngLat = [number, number];
type Proj = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;
const KINA = '156';
const TAIWAN = '158';
const SRI_LANKA = '144';

const KYST: LngLat = [121.5, 31.2];
const HAMBANTOTA: LngLat = [81.12, 6.12];
const TAIPEI: LngLat = [121.0, 23.7];
const HONGKONG: LngLat = [114.17, 22.3];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    verden: [
        [-115, -38],
        [150, 62],
    ],
    silkevei: [
        [-90, -32],
        [150, 60],
    ],
    srilanka: [
        [58, -1],
        [90, 22],
    ],
    taiwan: [
        [108, 19],
        [128, 31],
    ],
};

const OVERSKRIFT: Record<Modus, string[]> = {
    verden: [
        'Desember 2001: Kina blir med i WTO',
        'Kinesiske varer ut i verden',
        'Fabrikkene flytter til Kina',
        'Verdens fabrikk',
    ],
    silkevei: [
        '2013: Belte og vei',
        'Kina bygger i andre land',
        'Over 140 land er med',
        'Lån og ingeniører, kontrakter og makt',
    ],
    srilanka: [
        'Tilhengerne: hjelp til fattige land',
        'Kritikerne: en gjeldsfelle',
        'Sri Lanka kan ikke betale',
        '2017: havna leies ut i 99 år',
        'Kina: ingen felle',
    ],
    taiwan: [
        'Taiwan',
        'Frie valg',
        'Én del av Kina, eller et eget land?',
        'USA selger våpen til Taiwan',
    ],
};

const MÅL_VERDEN: { navn: string; ll: LngLat }[] = [
    { navn: 'Europa', ll: [12, 50] },
    { navn: 'USA', ll: [-96, 39] },
    { navn: 'Afrika', ll: [20, 2] },
    { navn: 'Sør-Amerika', ll: [-58, -14] },
];

/** Rutene i Belte og vei, grovt tegnet. */
const RUTER: { navn: string; punkter: LngLat[]; type: 'land' | 'sjo' }[] = [
    {
        navn: 'land',
        type: 'land',
        punkter: [
            [108, 34],
            [87, 43],
            [68, 44],
            [45, 52],
            [24, 52],
            [10, 50],
        ],
    },
    {
        navn: 'sjø',
        type: 'sjo',
        punkter: [
            [121.5, 31],
            [114, 18],
            [104, 2],
            [82, 5],
            [62, 14],
            [44, 12],
            [36, 24],
            [32, 31],
            [18, 38],
            [12, 43],
        ],
    },
    {
        navn: 'afrika',
        type: 'sjo',
        punkter: [
            [62, 14],
            [50, 4],
            [41, -6],
            [36, -20],
        ],
    },
    {
        navn: 'latin',
        type: 'sjo',
        punkter: [
            [122, 30],
            [150, 22],
            [180, 10],
            [-150, 0],
            [-110, -8],
            [-78, -12],
        ],
    },
];

export function SupermaktKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'verden';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(
        () =>
            geoNaturalEarth1().fitExtent(
                [
                    [50, 110],
                    [B - 50, H - 40],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        UTSNITT[modus][0],
                        [UTSNITT[modus][1][0], UTSNITT[modus][0][1]],
                        UTSNITT[modus][1],
                        [UTSNITT[modus][0][0], UTSNITT[modus][1][1]],
                    ],
                } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p: Proj = (ll) => projeksjon(ll) as [number, number];
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    const uthev =
        modus === 'taiwan'
            ? beat >= 2
                ? [KINA, TAIWAN]
                : [TAIWAN]
            : modus === 'srilanka'
              ? beat >= 2
                  ? [SRI_LANKA]
                  : []
              : [KINA];

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    {['rod', 'bla', 'gull'].map((f) => (
                        <marker
                            key={f}
                            id={`sm-pil-${f}`}
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="4"
                            markerHeight="4"
                            orient="auto-start-reverse"
                        >
                            <path
                                d="M 0 0 L 10 5 L 0 10 z"
                                fill={f === 'bla' ? '#1d4ed8' : f === 'rod' ? '#b91c1c' : '#b45309'}
                            />
                        </marker>
                    ))}
                    <radialGradient id="sm-glod">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </radialGradient>
                </defs>
                <Land geographies={geographies} sti={sti} uthev={uthev} />

                {modus === 'verden' && <Verden beat={beat} p={p} />}
                {modus === 'silkevei' && <Silkevei beat={beat} p={p} />}
                {modus === 'srilanka' && <SriLanka beat={beat} p={p} />}
                {modus === 'taiwan' && <Taiwan beat={beat} p={p} />}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-900 whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {modus === 'silkevei' && beat === 1 && (
                    <Kort key="bygg" side="venstre">
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                [Anchor, 'havner'],
                                [TrainFront, 'jernbaner'],
                                [Building2, 'veier og broer'],
                                [Zap, 'kraftverk'],
                            ].map(([Ikon, t], i) => {
                                const I = Ikon as typeof Anchor;
                                return (
                                    <motion.div
                                        key={t as string}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + i * 0.5 }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 shadow-lg text-2xl font-bold text-slate-800"
                                    >
                                        <I className="w-7 h-7 text-red-700" /> {t as string}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </Kort>
                )}
                {modus === 'silkevei' && beat === 2 && (
                    <Kort key="land" side="venstre">
                        <Teller verdi={140} etikett="land er med" prefiks="over " />
                    </Kort>
                )}
                {modus === 'silkevei' && beat >= 3 && (
                    <Kort key="bytte" side="venstre">
                        <Bytte />
                    </Kort>
                )}
                {modus === 'srilanka' && beat === 0 && (
                    <Kort key="for" side="venstre">
                        <Stemme farge="teal" tittel="Tilhengerne" tekst="Veier og havner som fattige land ikke har råd til selv" />
                    </Kort>
                )}
                {modus === 'srilanka' && beat === 1 && (
                    <Kort key="mot" side="venstre">
                        <Stemme farge="rod" tittel="Kritikerne" tekst="Klarer du ikke å betale tilbake, kan du miste havna" />
                    </Kort>
                )}
                {modus === 'srilanka' && beat === 2 && (
                    <Kort key="lan" side="venstre">
                        <div className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl">
                            <div className="font-display font-black text-4xl text-red-700">
                                Et milliardlån
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-slate-600">
                                Sri Lanka greier ikke å betale tilbake
                            </div>
                        </div>
                    </Kort>
                )}
                {modus === 'srilanka' && beat === 3 && (
                    <Kort key="aar" side="venstre">
                        <div className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center">
                            <div className="font-display font-black text-6xl text-red-700">
                                <TelleTall verdi={99} />
                            </div>
                            <div className="text-2xl font-bold text-slate-700">
                                år leies havna ut til Kina
                            </div>
                        </div>
                    </Kort>
                )}
                {modus === 'srilanka' && beat >= 4 && (
                    <Kort key="kina" side="venstre">
                        <Stemme farge="noytral" tittel="Kina svarer" tekst="Ingen felle. Vi har slettet gjeld for fattige land." />
                    </Kort>
                )}
                {modus === 'taiwan' && beat === 0 && (
                    <Kort key="folk" side="venstre">
                        <div className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center">
                            <div className="font-display font-black text-5xl text-slate-900">
                                23,4 millioner
                            </div>
                            <div className="text-2xl font-semibold text-slate-500">
                                innbyggere (2023)
                            </div>
                        </div>
                    </Kort>
                )}
                {modus === 'taiwan' && beat === 1 && (
                    <Kort key="valg" side="venstre">
                        <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/95 shadow-xl">
                            <Vote className="w-16 h-16 text-teal-600" />
                            <div>
                                <div className="font-display font-black text-3xl text-slate-900">
                                    Presidenten velges
                                </div>
                                <div className="text-2xl font-semibold text-slate-600">
                                    for fire år, høyst to ganger
                                </div>
                            </div>
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    uthev,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    uthev: string[];
}) {
    return (
        <g>
            {geographies.map((g, i) => {
                const id = String(g.id);
                const på = uthev.includes(id);
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={på ? (id === TAIWAN ? '#5eead4' : id === SRI_LANKA ? '#fde68a' : '#fca5a5') : '#f1ede4'}
                        stroke="#94a3b8"
                        strokeWidth={0.8}
                        style={{ transition: 'fill 0.8s' }}
                    />
                );
            })}
        </g>
    );
});

function Kort({ children, side }: { children: React.ReactNode; side: 'venstre' | 'hoyre' }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: side === 'venstre' ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 20 }}
            className={`absolute bottom-[7%] ${side === 'venstre' ? 'left-[4%]' : 'right-[4%]'}`}
        >
            {children}
        </motion.div>
    );
}

function Stemme({
    farge,
    tittel,
    tekst,
}: {
    farge: 'teal' | 'rod' | 'noytral';
    tittel: string;
    tekst: string;
}) {
    return (
        <div
            className={`px-6 py-4 rounded-2xl shadow-xl max-w-[30rem] ${farge === 'teal' ? 'bg-teal-700' : farge === 'rod' ? 'bg-red-700' : 'bg-slate-700'} text-white`}
        >
            <div className="font-display font-black text-3xl">{tittel}</div>
            <div className="mt-1 text-2xl font-semibold text-white/90">{tekst}</div>
        </div>
    );
}

function Bytte() {
    return (
        <div className="flex items-stretch gap-3">
            <div className="px-5 py-3 rounded-2xl bg-red-700 text-white shadow-xl">
                <div className="text-xl font-semibold text-red-100">Kina gir</div>
                <div className="font-display font-black text-2xl">lån og ingeniører</div>
            </div>
            <div className="self-center text-4xl font-black text-slate-700">⇄</div>
            <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl">
                <div className="text-xl font-semibold text-slate-500">Kina får</div>
                <div className="font-display font-black text-2xl text-slate-900">
                    kontrakter og makt
                </div>
            </div>
        </div>
    );
}

function Etikett({
    x,
    y,
    tekst,
    farge = '#0f172a',
    str = 34,
    synlig = true,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    str?: number;
    synlig?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#fff"
            strokeWidth={8}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.8, delay: synlig ? forsinkelse : 0 }}
        >
            {tekst}
        </motion.text>
    );
}

function bue(a: [number, number], b: [number, number], løft = 0.25) {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return `M ${a[0]} ${a[1]} Q ${mx} ${my - d * løft} ${b[0]} ${b[1]}`;
}

function Pil({
    d,
    farge,
    synlig,
    forsinkelse = 0,
    bredde = 9,
}: {
    d: string;
    farge: 'rod' | 'bla' | 'gull';
    synlig: boolean;
    forsinkelse?: number;
    bredde?: number;
}) {
    const hex = farge === 'bla' ? '#1d4ed8' : farge === 'rod' ? '#b91c1c' : '#b45309';
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={hex}
            strokeWidth={bredde}
            strokeLinecap="round"
            markerEnd={`url(#sm-pil-${farge})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: synlig ? 1 : 0, opacity: synlig ? 1 : 0 }}
            transition={{ duration: 1.6, delay: synlig ? forsinkelse : 0, ease: 'easeInOut' }}
        />
    );
}

function Verden({ beat, p }: { beat: number; p: Proj }) {
    const kina = p([104, 34]);
    const kyst = p(KYST);
    return (
        <>
            <motion.circle
                cx={kina[0]}
                cy={kina[1]}
                fill="url(#sm-glod)"
                initial={{ r: 0 }}
                animate={{ r: beat === 0 ? 170 : 120 }}
                transition={{ duration: 1.2 }}
            />
            {MÅL_VERDEN.map((m, i) => {
                const mål = p(m.ll);
                return (
                    <g key={m.navn}>
                        <Pil d={bue(kyst, mål, 0.22)} farge="rod" synlig={beat >= 1} forsinkelse={i * 0.4} />
                        <Etikett
                            x={mål[0]}
                            y={mål[1] + 50}
                            tekst={m.navn}
                            synlig={beat >= 1}
                            forsinkelse={0.4 + i * 0.4}
                            str={30}
                        />
                    </g>
                );
            })}
            {MÅL_VERDEN.slice(0, 2).map((m, i) => {
                const fra = p(m.ll);
                return (
                    <Pil
                        key={m.navn}
                        d={bue(fra, [kina[0] - 30, kina[1] + 10], -0.18)}
                        farge="bla"
                        synlig={beat >= 2}
                        forsinkelse={i * 0.5}
                        bredde={7}
                    />
                );
            })}
            {beat >= 2 &&
                [
                    [-60, -30],
                    [10, 40],
                    [60, -10],
                ].map(([dx, dy], i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.6 + i * 0.4, type: 'spring' }}
                        style={{ transformOrigin: `${kina[0] + dx}px ${kina[1] + dy}px` }}
                    >
                        <circle cx={kina[0] + dx} cy={kina[1] + dy} r={26} fill="#fff" stroke="#b91c1c" strokeWidth={4} />
                        <Factory
                            x={kina[0] + dx - 16}
                            y={kina[1] + dy - 16}
                            width={32}
                            height={32}
                            color="#b91c1c"
                        />
                    </motion.g>
                ))}
            <Etikett x={kina[0]} y={kina[1] - 60} tekst="KINA" farge="#991b1b" str={44} />
            <motion.g
                initial={{ opacity: 0, scale: 1.6 }}
                animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 1.6 }}
                transition={{ duration: 0.7, type: 'spring' }}
                style={{ transformOrigin: `${kina[0]}px ${kina[1] + 110}px` }}
            >
                <rect
                    x={kina[0] - 210}
                    y={kina[1] + 78}
                    width={420}
                    height={68}
                    rx={12}
                    fill="#b91c1c"
                    transform={`rotate(-4 ${kina[0]} ${kina[1] + 112})`}
                />
                <text
                    x={kina[0]}
                    y={kina[1] + 126}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#fff"
                    transform={`rotate(-4 ${kina[0]} ${kina[1] + 112})`}
                >
                    VERDENS FABRIKK
                </text>
            </motion.g>
        </>
    );
}

function Silkevei({ beat, p }: { beat: number; p: Proj }) {
    const kina = p([104, 34]);
    const linjer = RUTER.map((r) => {
        // Ruten over Stillehavet krysser datolinja: tegn den som rett linje i skjermkoordinater.
        const pts = r.punkter.map((ll) => {
            const [x, y] = p(ll);
            return [x, y] as [number, number];
        });
        const delt: [number, number][][] = [[]];
        pts.forEach((pt, i) => {
            if (i > 0 && Math.abs(pt[0] - pts[i - 1][0]) > B * 0.5) delt.push([]);
            delt[delt.length - 1].push(pt);
        });
        return { ...r, deler: delt.filter((d) => d.length > 1) };
    });
    const synlig = (navn: string) =>
        navn === 'land' ? beat >= 1 : navn === 'sjø' ? beat >= 1 : beat >= 2;
    return (
        <>
            <motion.circle
                cx={kina[0]}
                cy={kina[1]}
                fill="url(#sm-glod)"
                initial={{ r: 0 }}
                animate={{ r: 150 }}
                transition={{ duration: 1.2 }}
            />
            {linjer.map((r) =>
                r.deler.map((d, j) => {
                    const sti = d.map((pt, i) => `${i ? 'L' : 'M'} ${pt[0]} ${pt[1]}`).join(' ');
                    return (
                        <g key={`${r.navn}${j}`}>
                            <motion.path
                                d={sti}
                                fill="none"
                                stroke={r.type === 'land' ? '#b91c1c' : '#b45309'}
                                strokeWidth={9}
                                strokeDasharray={r.type === 'sjo' ? '2 0' : undefined}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: synlig(r.navn) ? 1 : 0,
                                    opacity: synlig(r.navn) ? 1 : 0,
                                }}
                                transition={{ duration: 2.2, ease: 'easeInOut' }}
                            />
                            {beat >= 3 && <Mynter sti={sti} forsinkelse={j * 0.3} />}
                        </g>
                    );
                })
            )}
            {[
                { t: 'Europa', ll: [12, 57] as LngLat },
                { t: 'Afrika', ll: [22, -6] as LngLat },
                { t: 'Asia', ll: [80, 52] as LngLat },
                { t: 'Latin-Amerika', ll: [-62, -22] as LngLat },
            ].map((e, i) => {
                const [x, y] = p(e.ll);
                return (
                    <Etikett
                        key={e.t}
                        x={x}
                        y={y}
                        tekst={e.t}
                        synlig={beat >= 2}
                        forsinkelse={0.3 + i * 0.4}
                        str={36}
                    />
                );
            })}
            <Etikett x={kina[0]} y={kina[1] + 10} tekst="KINA" farge="#991b1b" str={44} />
            {beat >= 1 &&
                (
                    [
                        [Anchor, [82, 5]],
                        [Anchor, [44, 12]],
                        [TrainFront, [68, 44]],
                        [Landmark, [36, -20]],
                        [Zap, [-78, -12]],
                    ] as [typeof Anchor, LngLat][]
                ).map(([Ikon, ll], i) => {
                    const [x, y] = p(ll);
                    const vis = i < 3 || beat >= 2;
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: vis ? 1 : 0 }}
                            transition={{ delay: vis ? 1.2 + i * 0.3 : 0 }}
                        >
                            <circle cx={x} cy={y} r={24} fill="#fff" stroke="#b91c1c" strokeWidth={4} />
                            <Ikon x={x - 14} y={y - 14} width={28} height={28} color="#b91c1c" />
                        </motion.g>
                    );
                })}
        </>
    );
}

/** Gule mynter som glir langs ruten, ut fra Kina. */
function Mynter({ sti, forsinkelse }: { sti: string; forsinkelse: number }) {
    return (
        <>
            {[0, 1, 2].map((i) => (
                <circle key={i} r={11} fill="#facc15" stroke="#a16207" strokeWidth={3}>
                    <animateMotion
                        dur="5s"
                        begin={`${forsinkelse + i * 1.6}s`}
                        repeatCount="indefinite"
                        path={sti}
                    />
                </circle>
            ))}
        </>
    );
}

function SriLanka({ beat, p }: { beat: number; p: Proj }) {
    const [hx, hy] = p(HAMBANTOTA);
    const sl = p([80.7, 7.8]);
    const india = p([78, 18]);
    return (
        <>
            <Etikett x={india[0]} y={india[1]} tekst="India" farge="#475569" str={40} />
            <Etikett x={sl[0] + 150} y={sl[1] + 10} tekst="Sri Lanka" str={44} />
            {/* Vei og havn som tilhengerne peker på */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 0 ? 1 : 0 }}
                transition={{ duration: 1 }}
            >
                <path
                    d={`M ${sl[0] - 20} ${sl[1] - 60} Q ${sl[0] + 30} ${sl[1]} ${hx} ${hy}`}
                    stroke="#334155"
                    strokeWidth={8}
                    fill="none"
                    strokeDasharray="20 10"
                />
            </motion.g>
            {/* Gjeldslenka */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 && beat <= 3 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            >
                {[0, 1, 2, 3, 4].map((i) => (
                    <ellipse
                        key={i}
                        cx={hx + 60 + i * 34}
                        cy={hy + i * 12}
                        rx={20}
                        ry={12}
                        fill="none"
                        stroke="#b91c1c"
                        strokeWidth={7}
                        transform={`rotate(${i % 2 ? 70 : 15} ${hx + 60 + i * 34} ${hy + i * 12})`}
                    />
                ))}
            </motion.g>
            {/* Havna */}
            <motion.g
                initial={{ scale: 0.8 }}
                animate={{ scale: beat >= 3 ? 1.25 : 1 }}
                style={{ transformOrigin: `${hx}px ${hy}px` }}
            >
                <circle cx={hx} cy={hy} r={34} fill={beat >= 3 ? '#b91c1c' : '#fff'} stroke="#b91c1c" strokeWidth={6} />
                <Anchor x={hx - 20} y={hy - 20} width={40} height={40} color={beat >= 3 ? '#fff' : '#b91c1c'} />
            </motion.g>
            <Etikett x={hx} y={hy + 80} tekst="Hambantota" str={36} />
            <Pil
                d={bue([hx + 40, hy - 20], [B - 120, 160], 0.15)}
                farge="rod"
                synlig={beat >= 3}
                forsinkelse={0.6}
            />
            <Etikett x={B - 150} y={130} tekst="Kina" farge="#991b1b" str={44} synlig={beat >= 3} forsinkelse={1.6} />
            <Etikett
                x={hx}
                y={hy + 124}
                tekst="leid ut til Kina"
                farge="#b91c1c"
                str={32}
                synlig={beat >= 3}
            />
        </>
    );
}

function Taiwan({ beat, p }: { beat: number; p: Proj }) {
    const [tx, ty] = p(TAIPEI);
    const [hkx, hky] = p(HONGKONG);
    const fast = p([113, 28]);
    const øst = p([127.5, 22.5]);
    return (
        <>
            <Etikett x={fast[0]} y={fast[1]} tekst="KINA" farge="#991b1b" str={52} />
            <Etikett x={tx + 120} y={ty - 40} tekst="Taiwan" farge="#0f766e" str={46} />
            <circle cx={hkx} cy={hky} r={9} fill="#0f172a" />
            <Etikett x={hkx - 10} y={hky + 46} tekst="Hong Kong" str={30} farge="#334155" />
            {/* Kinas krav */}
            <Pil
                d={bue([fast[0] + 90, fast[1] + 20], [tx - 50, ty - 10], 0.2)}
                farge="rod"
                synlig={beat >= 2}
            />
            <Etikett
                x={(fast[0] + tx) / 2 + 20}
                y={fast[1] - 40}
                tekst="«en del av Kina»"
                farge="#b91c1c"
                str={32}
                synlig={beat >= 2}
                forsinkelse={0.8}
            />
            <Etikett
                x={tx + 150}
                y={ty + 40}
                tekst="«et eget land»"
                farge="#0f766e"
                str={32}
                synlig={beat >= 2}
                forsinkelse={1.6}
            />
            {/* USA */}
            <Pil d={bue([øst[0] + 140, øst[1] + 80], [tx + 50, ty + 30], -0.15)} farge="bla" synlig={beat >= 3} />
            <Etikett
                x={øst[0] + 60}
                y={øst[1] + 170}
                tekst="USA: våpen"
                farge="#1d4ed8"
                str={36}
                synlig={beat >= 3}
                forsinkelse={1}
            />
            {/* Spenning i stredet */}
            <motion.path
                d={`M ${tx - 100} ${ty - 120} l 20 30 l -20 30 l 20 30 l -20 30 l 20 30 l -20 30`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? [0.3, 1, 0.3] : 0 }}
                transition={beat >= 3 ? { duration: 1.2, repeat: Infinity } : { duration: 0.4 }}
            />
        </>
    );
}
