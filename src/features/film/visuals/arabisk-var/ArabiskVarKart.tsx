import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kartet over den arabiske våren. Hver modus er et eget utsnitt med egne lag:
 * spredning (opprøret hopper fra land til land), libya, syria og flukt. Land fargelegges per beat, og piler tegnes ut.
 */

type Modus = 'spredning' | 'libya' | 'syria' | 'flukt';
type LL = [number, number];

const B = 1600;
const H = 900;

/** Tilfeldig tall med frø, så kartet ser likt ut hver gang. */
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const ID = {
    tunisia: 788,
    egypt: 818,
    libya: 434,
    jemen: 887,
    syria: 760,
    saudi: 682,
    iran: 364,
    irak: 368,
    tyrkia: 792,
    libanon: 422,
    jordan: 400,
    russland: 643,
};

const BY: Record<string, LL> = {
    sidiBouzid: [9.48, 35.04],
    tunis: [10.18, 36.8],
    kairo: [31.24, 30.04],
    tripoli: [13.19, 32.89],
    benghazi: [20.07, 32.12],
    sanaa: [44.2, 15.35],
    manama: [50.58, 26.22],
    damaskus: [36.29, 33.51],
    daraa: [36.1, 32.62],
    moskva: [37.62, 55.75],
    tyrkia: [35.2, 38.9],
    libanon: [35.86, 33.95],
    jordan: [36.3, 31.2],
    hellas: [22.5, 39.5],
    tyskland: [10.4, 51.2],
    italia: [12.6, 42.5],
};

const UTSNITT: Record<Modus, [LL, LL]> = {
    spredning: [
        [-6, 10],
        [58, 40],
    ],
    libya: [
        [6, 18],
        [30, 39],
    ],
    syria: [
        [32.5, 29.5],
        [49, 38.5],
    ],
    flukt: [
        [-4, 26],
        [56, 58],
    ],
};

const ORANSJE = '#f97316';
const ROD = '#dc2626';
const LAND = '#ece4d6';
const HAV = '#cfe3f2';

/** Fyllfarge per land for modus og beat. Land som ikke står her, får grunnfargen. */
function farger(modus: Modus, beat: number): Partial<Record<number, string>> {
    switch (modus) {
        case 'spredning': {
            const f: Partial<Record<number, string>> = { [ID.tunisia]: ORANSJE };
            if (beat >= 1) Object.assign(f, { [ID.libya]: ORANSJE, [ID.egypt]: ORANSJE });
            if (beat >= 2) Object.assign(f, { [ID.jemen]: ORANSJE, [ID.syria]: ORANSJE });
            if (beat >= 3)
                for (const id of [ID.tunisia, ID.egypt, ID.libya, ID.jemen]) f[id] = ROD;
            return f;
        }
        case 'libya':
            if (beat >= 3) return { [ID.libya]: '#d6d3d1' };
            return { [ID.libya]: beat >= 1 ? '#fb923c' : '#fcd34d' };
        case 'syria': {
            const f: Partial<Record<number, string>> = { [ID.syria]: '#fde68a' };
            if (beat >= 1) f[ID.syria] = '#fca5a5';
            if (beat >= 2) f[ID.syria] = '#f87171';
            return f;
        }
        case 'flukt': {
            const f: Partial<Record<number, string>> = { [ID.syria]: '#f87171' };
            if (beat >= 1)
                for (const id of [ID.tyrkia, ID.libanon, ID.jordan]) f[id] = '#93c5fd';
            if (beat >= 3) f[ID.russland] = '#e2e8f0';
            return f;
        }
    }
}

/** Buet pil fra a til b. */
function Pil({
    fra,
    til,
    farge,
    p,
    bue = 0.25,
    forsinkelse = 0,
    stiplet = false,
    bredde = 8,
}: {
    fra: LL;
    til: LL;
    farge: string;
    p: GeoProjection;
    bue?: number;
    forsinkelse?: number;
    stiplet?: boolean;
    bredde?: number;
}) {
    const [x1, y1] = p(fra) as [number, number];
    const [x2, y2] = p(til) as [number, number];
    const mx = (x1 + x2) / 2 - (y2 - y1) * bue;
    const my = (y1 + y2) / 2 + (x2 - x1) * bue;
    const vinkel = Math.atan2(y2 - my, x2 - mx);
    const s = 22;
    const spiss = `M ${x2} ${y2} L ${x2 - s * Math.cos(vinkel - 0.45)} ${y2 - s * Math.sin(vinkel - 0.45)} L ${
        x2 - s * Math.cos(vinkel + 0.45)
    } ${y2 - s * Math.sin(vinkel + 0.45)} Z`;
    return (
        <g>
            <motion.path
                d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                strokeDasharray={stiplet ? '16 12' : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d={spiss}
                fill={farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.1 }}
            />
        </g>
    );
}

/** Tekst med hvit kant, så den leses oppå kartet. */
function Navn({
    xy,
    children,
    str = 34,
    farge = '#0f172a',
    forsinkelse = 0,
    anker = 'middle',
}: {
    xy: [number, number];
    children: ReactNode;
    str?: number;
    farge?: string;
    forsinkelse?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={xy[0]}
            y={xy[1]}
            textAnchor={anker}
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={str / 5}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            {children}
        </motion.text>
    );
}

function Prikk({ xy, farge = ROD, r = 12, puls = false }: { xy: [number, number]; farge?: string; r?: number; puls?: boolean }) {
    return (
        <g>
            {puls && (
                <motion.circle
                    cx={xy[0]}
                    cy={xy[1]}
                    fill="none"
                    stroke={farge}
                    strokeWidth={4}
                    initial={{ r, opacity: 0.9 }}
                    animate={{ r: r * 4, opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                />
            )}
            <circle cx={xy[0]} cy={xy[1]} r={r} fill={farge} stroke="#fff" strokeWidth={4} />
        </g>
    );
}

function Lag({ modus, beat, p }: { modus: Modus; beat: number; p: GeoProjection }) {
    const q = (ll: LL) => p(ll) as [number, number];
    const by = (n: keyof typeof BY) => q(BY[n]);
    switch (modus) {
        case 'spredning': {
            const navn: [string, LL, number][] = [
                ['Tunisia', [9, 31], 0],
                ['Libya', [17.5, 26], 1],
                ['Egypt', [30, 26], 1],
                ['Jemen', [47.5, 15.6], 2],
                ['Bahrain', [50.6, 28.3], 2],
                ['Syria', [38.5, 36.4], 2],
            ];
            return (
                <>
                    <Prikk xy={by('sidiBouzid')} puls={beat === 0} />
                    {beat >= 1 && <Pil fra={BY.sidiBouzid} til={BY.tripoli} farge={ORANSJE} p={p} />}
                    {beat >= 1 && <Pil fra={BY.sidiBouzid} til={BY.kairo} farge={ORANSJE} p={p} forsinkelse={0.4} bue={0.15} />}
                    {beat >= 2 && <Pil fra={BY.sidiBouzid} til={BY.sanaa} farge={ORANSJE} p={p} bue={-0.2} />}
                    {beat >= 2 && <Pil fra={BY.sidiBouzid} til={BY.manama} farge={ORANSJE} p={p} forsinkelse={0.4} bue={0.15} />}
                    {beat >= 2 && <Pil fra={BY.sidiBouzid} til={BY.damaskus} farge={ORANSJE} p={p} forsinkelse={0.8} bue={0.2} />}
                    {beat >= 2 && <Prikk xy={by('manama')} farge={ORANSJE} r={10} />}
                    {navn
                        .filter(([, , fra]) => beat >= fra)
                        .map(([n, ll]) => (
                            <Navn key={n} xy={q(ll)} forsinkelse={0.6}>
                                {n}
                            </Navn>
                        ))}
                </>
            );
        }
        case 'libya': {
            const midt = q([17.5, 27]);
            return (
                <>
                    <Navn xy={midt} str={60}>
                        Libya
                    </Navn>
                    {beat === 0 && (
                        <Navn xy={[midt[0], midt[1] + 70]} str={36} farge="#92400e" forsinkelse={0.4}>
                            fra 1969
                        </Navn>
                    )}
                    {beat === 1 && (
                        <>
                            <Pil fra={[12.5, 41.5]} til={BY.tripoli} farge="#1d4ed8" p={p} forsinkelse={0.2} />
                            <Pil fra={[17, 41.5]} til={BY.benghazi} farge="#1d4ed8" p={p} forsinkelse={0.6} bue={-0.2} />
                            <Navn xy={q([15, 36.4])} farge="#1d4ed8" forsinkelse={0.9}>
                                NATO-fly
                            </Navn>
                        </>
                    )}
                    {beat >= 1 && beat <= 2 && (
                        <>
                            <Prikk xy={by('tripoli')} />
                            <Prikk xy={by('benghazi')} />
                        </>
                    )}
                    {beat === 2 && (
                        <Navn xy={[midt[0], midt[1] + 70]} str={36} farge="#7f1d1d" forsinkelse={0.4}>
                            Oktober 2011: Gaddafi er borte
                        </Navn>
                    )}
                    {beat === 3 && (
                        <Navn xy={[midt[0], midt[1] + 70]} str={36} farge="#334155" forsinkelse={0.4}>
                            42 år med én mann · ingen stat som virker
                        </Navn>
                    )}
                </>
            );
        }
        case 'syria': {
            const midt = q([38.6, 35]);
            return (
                <>
                    <Navn xy={midt} str={56}>
                        Syria
                    </Navn>
                    <Navn xy={q([43.6, 33])} str={34} farge="#475569">
                        Irak
                    </Navn>
                    <Prikk xy={by('daraa')} puls={beat === 0} />
                    <Navn xy={[by('daraa')[0] + 26, by('daraa')[1] + 12]} str={30} anker="start">
                        Daraa
                    </Navn>
                    {beat === 0 && (
                        <Navn xy={[by('daraa')[0] + 26, by('daraa')[1] + 52]} str={26} farge="#475569" anker="start" forsinkelse={0.5}>
                            graffiti på veggene
                        </Navn>
                    )}
                    {beat === 1 && (
                        <Navn xy={[midt[0], midt[1] + 64]} str={34} farge="#7f1d1d" forsinkelse={0.4}>
                            Assad svarer med å skyte
                        </Navn>
                    )}
                    {beat >= 2 &&
                        Array.from({ length: 22 }, (_, i) => {
                            const ll: LL = [36.6 + frø(i + 1) * 4.6, 33.6 + frø(i + 50) * 3];
                            const [x, y] = q(ll);
                            return (
                                <motion.circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r={9}
                                    fill={i % 3 === 0 ? '#7f1d1d' : i % 3 === 1 ? '#15803d' : '#a16207'}
                                    stroke="#fff"
                                    strokeWidth={2}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.9, scale: 1 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                />
                            );
                        })}
                    {beat === 2 && (
                        <Navn xy={[midt[0], midt[1] + 64]} str={34} farge="#7f1d1d" forsinkelse={0.4}>
                            Borgerkrig
                        </Navn>
                    )}
                    {beat === 3 && (
                        <>
                            <Pil fra={[38, 38.6]} til={BY.damaskus} farge="#b91c1c" p={p} bue={0.15} />
                            <Pil fra={[48.8, 34.5]} til={BY.damaskus} farge="#7c3aed" p={p} forsinkelse={0.4} bue={-0.1} />
                            <Navn xy={q([39.7, 38])} farge="#b91c1c" forsinkelse={0.9}>
                                Russland
                            </Navn>
                            <Navn xy={q([47.3, 35.4])} farge="#7c3aed" forsinkelse={1.2}>
                                Iran
                            </Navn>
                            <Navn xy={[by('damaskus')[0] - 30, by('damaskus')[1] - 26]} str={30} anker="end" forsinkelse={1.4}>
                                Assad
                            </Navn>
                        </>
                    )}
                    {beat >= 4 && (
                        <>
                            <motion.path
                                d={geoPath(p)({
                                    type: 'Polygon',
                                    coordinates: [
                                        [
                                            [38.2, 35.6],
                                            [39.2, 36.4],
                                            [41.5, 36.5],
                                            [43.6, 35.4],
                                            [43.8, 34],
                                            [42.6, 33.2],
                                            [40.8, 33.6],
                                            [39.2, 34.4],
                                            [38.2, 35.6],
                                        ],
                                    ],
                                } as never) ?? undefined}
                                fill="#111827"
                                fillOpacity={0.55}
                                stroke="#111827"
                                strokeWidth={4}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1 }}
                            />
                            <Navn xy={q([42.6, 34.3])} str={52} farge="#111827" forsinkelse={0.6}>
                                IS
                            </Navn>
                        </>
                    )}
                </>
            );
        }
        case 'flukt': {
            return (
                <>
                    <Navn xy={q([38.8, 35.2])} str={40}>
                        Syria
                    </Navn>
                    {beat === 0 && (
                        <Navn xy={q([38.8, 32.4])} str={34} farge="#7f1d1d" forsinkelse={0.4}>
                            nesten fjorten år med krig
                        </Navn>
                    )}
                    {beat >= 1 && (
                        <>
                            <Pil fra={BY.damaskus} til={BY.tyrkia} farge="#2563eb" p={p} bue={-0.3} />
                            <Pil fra={BY.damaskus} til={BY.libanon} farge="#2563eb" p={p} bue={0.6} forsinkelse={0.3} bredde={6} />
                            <Pil fra={BY.damaskus} til={BY.jordan} farge="#2563eb" p={p} bue={0.4} forsinkelse={0.5} bredde={6} />
                            <Navn xy={q([33.5, 39.8])} str={30} farge="#1e3a8a" forsinkelse={0.8}>
                                Tyrkia
                            </Navn>
                            <Navn xy={q([31.6, 33.6])} str={28} farge="#1e3a8a" forsinkelse={0.9} anker="end">
                                Libanon
                            </Navn>
                            <Navn xy={q([37.3, 29.8])} str={28} farge="#1e3a8a" forsinkelse={1}>
                                Jordan
                            </Navn>
                        </>
                    )}
                    {beat >= 2 && (
                        <>
                            <Pil fra={BY.tyrkia} til={BY.hellas} farge="#0f766e" p={p} bue={0.2} />
                            <Pil fra={BY.hellas} til={BY.tyskland} farge="#0f766e" p={p} bue={0.15} forsinkelse={0.8} />
                            <Pil fra={[30, 32.5]} til={BY.italia} farge="#0f766e" p={p} bue={-0.15} forsinkelse={0.5} bredde={6} />
                            <Navn xy={q([18, 35.4])} str={34} farge="#115e59" forsinkelse={1}>
                                Middelhavet · 2015
                            </Navn>
                            <Navn xy={q([10.4, 53.6])} str={32} farge="#115e59" forsinkelse={1.6}>
                                Europa
                            </Navn>
                        </>
                    )}
                    {beat >= 3 && (
                        <>
                            <Pil fra={BY.damaskus} til={BY.moskva} farge="#7f1d1d" p={p} bue={-0.35} stiplet forsinkelse={0.3} />
                            <Prikk xy={by('moskva')} farge="#7f1d1d" r={10} />
                            <Navn xy={[by('moskva')[0] + 26, by('moskva')[1] + 12]} str={32} anker="start" forsinkelse={1.2}>
                                Moskva
                            </Navn>
                            <Navn xy={q([43, 47.5])} str={28} farge="#7f1d1d" anker="start" forsinkelse={1.5}>
                                Assad flykter, desember 2024
                            </Navn>
                        </>
                    )}
                </>
            );
        }
    }
}

/** Libya delt i tre: én farge per bit, klippet til landets omriss. */
function DeltLibya({ d, p }: { d: string; p: GeoProjection }) {
    const vest = (p([16, 30]) as [number, number])[0];
    const ost = (p([20.5, 30]) as [number, number])[0];
    const deler: [number, number, string][] = [
        [0, vest, '#f59e0b'],
        [vest, ost, '#16a34a'],
        [ost, B, '#2563eb'],
    ];
    return (
        <g>
            <defs>
                <clipPath id="arabisk-var-libya">
                    <path d={d} />
                </clipPath>
            </defs>
            <g clipPath="url(#arabisk-var-libya)">
                {deler.map(([x0, x1, farge], i) => (
                    <motion.rect
                        key={i}
                        x={x0}
                        y={0}
                        width={x1 - x0}
                        height={H}
                        fill={farge}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.75 }}
                        transition={{ delay: 0.3 + i * 0.4 }}
                    />
                ))}
            </g>
            {deler.slice(1).map(([x0], i) => (
                <line key={i} x1={x0} x2={x0} y1={0} y2={H} stroke="#fff" strokeWidth={6} clipPath="url(#arabisk-var-libya)" />
            ))}
        </g>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    spredning: ['Desember 2010', '2011', '2011', 'Innen et år'],
    libya: ['Gaddafi styrer', 'NATO griper inn', 'Opprørerne vinner', 'Ingen stat', 'Landet delt mellom grupper'],
    syria: ['Syria, 2011', 'Skudd mot folket', 'Borgerkrig', 'To sider', 'IS vokser fram'],
    flukt: ['Krigen i Syria', 'Flukten til nabolandene', 'Flukten til Europa', 'Assad faller'],
};

export function ArabiskVarKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus && props.modus in UTSNITT ? props.modus : 'spredning';
    const { geographies } = useAtlasWorld();
    const p = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [30, 30],
                    [B - 30, H - 30],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(p), [p]);
    const fyll = farger(modus, beat);
    const libya = geographies.find((g) => Number(g.id) === ID.libya);
    const libyaD = libya ? (sti(libya as never) ?? '') : '';
    const linjer = OVERSKRIFT[modus];
    const tittel = linjer[Math.min(beat, linjer.length - 1)];

    return (
        <div className="absolute inset-0" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {geographies.map((g, i) => {
                    const id = Number(g.id);
                    return (
                        <motion.path
                            key={`${g.id ?? 'x'}-${i}`}
                            d={sti(g as never) ?? undefined}
                            initial={false}
                            animate={{ fill: fyll[id] ?? LAND }}
                            transition={{ duration: 0.9 }}
                            stroke="#a8a29e"
                            strokeWidth={1.2}
                        />
                    );
                })}
                {modus === 'libya' && beat >= 4 && libyaD && <DeltLibya d={libyaD} p={p} />}
                <g key={`${modus}-${beat}`}>
                    <Lag modus={modus} beat={beat} p={p} />
                </g>
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${tittel}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`absolute ${modus === 'spredning' ? 'bottom-[6%]' : 'top-[5%]'} right-[4%] px-5 py-2 rounded-2xl bg-white/95 shadow-xl font-display font-black text-3xl text-slate-900`}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
            {modus === 'spredning' && beat >= 3 && (
                <div className="absolute bottom-[6%] left-[4%] flex gap-3 text-xl font-bold">
                    <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 shadow">
                        <span className="w-5 h-5 rounded-full" style={{ background: ROD }} /> regjeringen veltet
                    </span>
                    <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 shadow">
                        <span className="w-5 h-5 rounded-full" style={{ background: ORANSJE }} /> opprør
                    </span>
                </div>
            )}
            {modus === 'libya' && beat >= 4 && (
                <div className="absolute bottom-[6%] left-[4%] flex gap-3 text-lg font-bold">
                    {['væpnede grupper', 'stammer', 'regjeringer som kjemper mot hverandre (grensene er omtrentlige)'].map((t, i) => (
                        <span key={t} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 shadow">
                            <span className="w-5 h-5 rounded-full" style={{ background: ['#f59e0b', '#16a34a', '#2563eb'][i] }} /> {t}
                        </span>
                    ))}
                </div>
            )}
            {modus === 'syria' && beat === 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="absolute bottom-[6%] right-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-xl font-bold text-slate-700"
                >
                    Mot Assad: <span className="text-slate-900">hundrevis av opprørsgrupper</span>
                </motion.div>
            )}
            {modus === 'flukt' && beat >= 1 && beat <= 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-[6%] left-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl font-black text-slate-900"
                >
                    {beat === 1 ? 'Millioner på flukt' : 'Hundretusener til Europa'}
                </motion.div>
            )}
            {modus === 'flukt' && beat === 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="absolute top-[5%] left-[4%] px-5 py-3 rounded-2xl bg-red-700 text-white shadow-xl text-2xl font-black"
                >
                    Desember 2024: styret faller på elleve dager
                </motion.div>
            )}
        </div>
    );
}
