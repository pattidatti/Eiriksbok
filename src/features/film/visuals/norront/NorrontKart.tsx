import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over hvor norrønt ble snakket, og hvor det satte spor.
 *
 *  - vest:      fra Norge til Shetland, Orknøyene, Færøyene og Island
 *  - aasen:     Ivar Aasen samler dialektord på Vestlandet og i fjellbygdene, 1842-1846
 *  - stedsnavn: endelser i stedsnavn langs fjordene
 *  - england:   norrøne ord i engelsk, og Island som tidsmaskin
 *
 * Landene er tegnet med dagens grenser. Områdene for Aasens reise er omtrentlige.
 */

type Modus = 'vest' | 'aasen' | 'stedsnavn' | 'england';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt> = {
    vest: [
        [-25, 57],
        [16, 67.5],
    ],
    aasen: [
        [-2, 57.6],
        [19, 63.4],
    ],
    stedsnavn: [
        [2, 59.4],
        [11.2, 61.9],
    ],
    england: [
        [-30, 49.5],
        [30, 67],
    ],
};

const NORGE = '578';
const ISLAND = '352';
const FAEROYENE = '234';
const STORBRITANNIA = '826';
const DANMARK = '208';

const HAV = '#9ec5dc';
const LAND = '#efe7d4';

const VESTLANDET: LngLat = [5.3, 60.4];
const MAL_VEST: { navn: string; ll: LngLat; merke: LngLat; anker: 'start' | 'end' | 'middle' }[] = [
    { navn: 'Shetland', ll: [-1.3, 60.35], merke: [-1.3, 60.35], anker: 'start' },
    { navn: 'Orknøyene', ll: [-3.0, 59.0], merke: [-3.0, 59.0], anker: 'end' },
    { navn: 'Færøyene', ll: [-6.9, 62.0], merke: [-6.9, 62.0], anker: 'end' },
    { navn: 'Island', ll: [-19.0, 64.9], merke: [-19.0, 64.9], anker: 'middle' },
];

/* Omtrentlige områder for Aasens innsamling. Tegnet for hånd. */
const VESTLANDET_OMRADE: LngLat[] = [
    [5.5, 58.8],
    [4.9, 59.6],
    [4.8, 60.8],
    [5.0, 61.6],
    [5.8, 62.4],
    [7.2, 62.9],
    [8.1, 62.7],
    [7.6, 62.0],
    [7.1, 61.2],
    [6.9, 60.3],
    [6.6, 59.4],
    [6.2, 58.8],
];
const FJELLBYGDENE: LngLat[] = [
    [7.8, 61.95],
    [9.4, 62.1],
    [10.2, 61.6],
    [10.0, 60.8],
    [9.0, 60.1],
    [8.0, 59.7],
    [7.4, 60.2],
    [7.5, 61.2],
];

/* Endelser i stedsnavn, lagt langs kysten. Plassene er ikke bestemte steder. */
const ENDELSER: { tekst: string; ll: LngLat; beat: number; type: 'natur' | 'gard' }[] = [
    { tekst: '-vik', ll: [5.0, 60.05], beat: 1, type: 'natur' },
    { tekst: '-fjord', ll: [6.4, 61.15], beat: 1, type: 'natur' },
    { tekst: '-sund', ll: [4.75, 60.75], beat: 1, type: 'natur' },
    { tekst: '-nes', ll: [5.2, 61.45], beat: 1, type: 'natur' },
    { tekst: '-dal', ll: [7.5, 60.75], beat: 1, type: 'natur' },
    { tekst: '-stad', ll: [8.9, 60.4], beat: 3, type: 'gard' },
    { tekst: '-bø', ll: [6.3, 60.0], beat: 3, type: 'gard' },
];

const ORD_ENGELSK = [
    { norront: 'lagu', engelsk: 'law', beat: 2 },
    { norront: 'husbondi', engelsk: 'husband', beat: 2 },
    { norront: 'vindauga', engelsk: 'window', beat: 2 },
    { norront: 'veikr', engelsk: 'weak', beat: 3 },
    { norront: 'egg', engelsk: 'egg', beat: 3 },
];

function lagProjeksjon(u: Utsnitt): GeoProjection {
    return geoMercator().fitExtent(
        [
            [20, 20],
            [B - 20, H - 20],
        ],
        { type: 'MultiPoint', coordinates: [u[0], u[1]] } as never
    );
}

function linje(p: GeoProjection, pts: LngLat[], lukk = false) {
    const d = pts
        .map((ll, i) => {
            const [x, y] = p(ll) as [number, number];
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');
    return lukk ? `${d} Z` : d;
}

/** Bue mellom to punkter, bøyd mot nord. */
function bue(a: [number, number], b: [number, number], boy = 0.22) {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const cx = mx + dy * boy;
    const cy = my - Math.abs(dx) * boy;
    return `M ${a[0]} ${a[1]} Q ${cx} ${cy} ${b[0]} ${b[1]}`;
}

function fyll(modus: Modus, beat: number, id: string) {
    if (modus === 'vest') {
        if (id === NORGE) return beat >= 3 ? '#fcd34d' : '#fbbf24';
        if (id === ISLAND && beat >= 3) return '#fdba74';
        if (id === FAEROYENE && beat >= 2) return '#fde68a';
    }
    if (modus === 'aasen' && id === NORGE) return '#f8f1de';
    if (modus === 'stedsnavn' && id === NORGE) return '#e9efd8';
    if (modus === 'england') {
        if (id === STORBRITANNIA && beat >= 1 && beat <= 3) return '#fde68a';
        if ((id === NORGE || id === DANMARK) && beat <= 1) return '#fbbf24';
        if (id === ISLAND && beat >= 4) return '#fdba74';
    }
    return LAND;
}

const Land = memo(function Land({
    geographies,
    sti,
    modus,
    beat,
}: {
    geographies: unknown[];
    sti: GeoPath;
    modus: Modus;
    beat: number;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String((g as { id?: string | number }).id ?? '');
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={fyll(modus, beat, id)}
                        stroke="#a39a82"
                        strokeWidth={1.2}
                        style={{ transition: 'fill 1s' }}
                    />
                );
            })}
        </>
    );
});

function Etikett({
    xy,
    tekst,
    storrelse = 40,
    farge = '#1c1917',
    anker = 'middle',
    dx = 0,
    dy = 0,
    synlig = true,
    vekt = 800,
}: {
    xy: [number, number];
    tekst: string;
    storrelse?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    dx?: number;
    dy?: number;
    synlig?: boolean;
    vekt?: number;
}) {
    return (
        <motion.text
            x={xy[0] + dx}
            y={xy[1] + dy}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            stroke="white"
            strokeWidth={storrelse / 5}
            strokeLinejoin="round"
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

/* ---------------- vest ---------------- */

function VestLag({ beat, pt }: { beat: number; pt: (ll: LngLat) => [number, number] }) {
    const fra = pt(VESTLANDET);
    return (
        <>
            {MAL_VEST.map((m, i) => {
                const til = pt(m.ll);
                return (
                    <g key={m.navn}>
                        <motion.path
                            d={bue(fra, til, 0.18)}
                            fill="none"
                            stroke="#b45309"
                            strokeWidth={7}
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: beat >= 1 ? 1 : 0, opacity: beat >= 1 ? 0.9 : 0 }}
                            transition={{ duration: 1.4, delay: beat === 1 ? i * 0.35 : 0 }}
                        />
                        <motion.circle
                            cx={til[0]}
                            cy={til[1]}
                            r={13}
                            fill="#b45309"
                            stroke="white"
                            strokeWidth={4}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= 1 ? 1 : 0 }}
                            transition={{ delay: beat === 1 ? 1 + i * 0.35 : 0 }}
                        />
                    </g>
                );
            })}
            <Etikett xy={pt([9.5, 61.6])} tekst="Norge" storrelse={48} synlig={beat <= 2} />
            {MAL_VEST.map((m) => (
                <Etikett
                    key={m.navn}
                    xy={pt(m.merke)}
                    tekst={m.navn}
                    storrelse={38}
                    anker={m.anker}
                    dx={m.anker === 'start' ? 24 : m.anker === 'end' ? -24 : 0}
                    dy={m.anker === 'middle' ? -50 : 12}
                    synlig={beat === 2}
                />
            ))}
            <Etikett xy={pt([9.0, 61.9])} tekst="gammalnorsk" storrelse={46} farge="#92400e" synlig={beat >= 3} />
            <Etikett xy={pt([-18.8, 64.9])} tekst="gammalislandsk" storrelse={42} farge="#9a3412" dy={-50} synlig={beat >= 3} />
        </>
    );
}

/* ---------------- aasen ---------------- */

function AasenLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: (ll: LngLat) => [number, number] }) {
    const ark = [0, 1, 2, 3, 4, 5];
    const vest = pt([6.0, 60.9]);
    const fjell = pt([8.8, 61.0]);
    const bok: [number, number] = [1240, 300];
    return (
        <>
            <motion.path
                d={linje(p, VESTLANDET_OMRADE, true)}
                fill="#0d9488"
                stroke="white"
                strokeWidth={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 0.25 : 0.55 }}
                transition={{ duration: 1 }}
            />
            <motion.path
                d={linje(p, FJELLBYGDENE, true)}
                fill="#7c3aed"
                stroke="white"
                strokeWidth={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 0.2 : 0.45 }}
                transition={{ duration: 1, delay: 0.4 }}
            />
            <Etikett xy={pt([5.1, 62.25])} tekst="Vestlandet" storrelse={36} farge="#115e59" anker="end" synlig={beat <= 1} />
            <Etikett xy={pt([9.0, 62.35])} tekst="fjellbygdene" storrelse={36} farge="#5b21b6" synlig={beat <= 1} />
            {/* Dialektord som flyr til boka */}
            {beat >= 1 &&
                ark.map((i) => {
                    const fra = i % 2 ? fjell : vest;
                    return (
                        <motion.g
                            key={i}
                            initial={{ x: fra[0] - 40, y: fra[1] + (i - 3) * 22, opacity: 0 }}
                            animate={{
                                x: [fra[0] - 40, bok[0] - 40],
                                y: [fra[1] + (i - 3) * 22, bok[1] - 10],
                                opacity: [0, 1, 1, 0],
                            }}
                            transition={{ duration: 2.2, delay: i * 0.35, repeat: beat === 1 ? Infinity : 0, repeatDelay: 1 }}
                        >
                            <rect width={56} height={40} rx={6} fill="#fef3c7" stroke="#b45309" strokeWidth={2} />
                            <line x1={10} x2={46} y1={14} y2={14} stroke="#b45309" strokeWidth={3} />
                            <line x1={10} x2={40} y1={26} y2={26} stroke="#b45309" strokeWidth={3} />
                        </motion.g>
                    );
                })}
        </>
    );
}

function AasenKort({ beat }: { beat: number }) {
    return (
        <>
            <AnimatePresence>
                {beat <= 2 && (
                    <motion.div
                        key="ar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-xl bg-white/95 text-center"
                        style={{ left: '62%', top: '70%', padding: '10px 22px' }}
                    >
                        <div className="font-display font-black text-slate-900" style={{ fontSize: 30 }}>
                            Ivar Aasen
                        </div>
                        <div className="font-bold text-slate-600" style={{ fontSize: 22 }}>
                            samler dialektord, 1842 til 1846
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 1 && beat <= 2 && (
                    <motion.div
                        key="bok"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute flex justify-center"
                        style={{ left: '64%', top: '22%', width: '26%' }}
                    >
                        <div
                            className="rounded-xl shadow-2xl text-center"
                            style={{ background: '#7c2d12', padding: '22px 18px', width: '100%', border: '4px solid #fbbf24' }}
                        >
                            <div className="font-bold" style={{ fontSize: 18, color: '#fde68a' }}>
                                Nytt skriftspråk
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={beat >= 2 ? 'ny' : 'land'}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="font-display font-black"
                                    style={{ fontSize: 40, color: 'white' }}
                                >
                                    {beat >= 2 ? 'nynorsk' : 'landsmål'}
                                </motion.div>
                            </AnimatePresence>
                            {beat >= 2 && (
                                <div className="font-semibold" style={{ fontSize: 17, color: '#fed7aa' }}>
                                    senere navn på landsmålet
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 3 && (
                    <motion.div
                        key="ord"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-2xl bg-white/95"
                        style={{ left: '60%', top: '18%', width: '34%', padding: '16px 24px' }}
                    >
                        <div className="flex font-bold text-slate-500" style={{ fontSize: 20 }}>
                            <div style={{ width: '50%' }}>nynorsk</div>
                            <div>bokmål</div>
                        </div>
                        {[
                            ['eg', 'jeg'],
                            ['ikkje', 'ikke'],
                            ['kvifor', 'hvorfor'],
                        ].map(([n, b], i) => (
                            <motion.div
                                key={n}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.5 }}
                                className="flex items-baseline font-display"
                                style={{ fontSize: 40, marginTop: 4 }}
                            >
                                <div style={{ width: '50%', fontWeight: 900, color: '#0f766e' }}>{n}</div>
                                <div style={{ fontWeight: 600, color: '#64748b' }}>{b}</div>
                            </motion.div>
                        ))}
                        <div className="font-semibold text-amber-800" style={{ fontSize: 19, marginTop: 8 }}>
                            Mange nynorske former står nærmere norrønt
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------------- stedsnavn ---------------- */

function StedsnavnLag({ beat, pt }: { beat: number; pt: (ll: LngLat) => [number, number] }) {
    return (
        <>
            {ENDELSER.map((e, i) => {
                const [x, y] = pt(e.ll);
                const vist = beat >= e.beat;
                const naturFokus = beat === 2 && (e.tekst === '-nes' || e.tekst === '-dal');
                const dempet = beat === 2 && !naturFokus;
                const bredde = e.tekst.length * 26 + 30;
                const gard = e.type === 'gard';
                return (
                    <motion.g
                        key={e.tekst}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: vist ? (dempet ? 0.35 : 1) : 0, scale: vist ? (naturFokus ? 1.25 : 1) : 0.6 }}
                        transition={{ delay: vist && beat === e.beat ? i * 0.25 : 0, type: 'spring', stiffness: 200, damping: 18 }}
                        style={{ transformOrigin: `${x}px ${y}px` }}
                    >
                        <circle cx={x} cy={y} r={9} fill={gard ? '#b45309' : '#0f766e'} stroke="white" strokeWidth={3} />
                        <rect
                            x={x - bredde / 2}
                            y={y - 70}
                            width={bredde}
                            height={52}
                            rx={14}
                            fill={gard ? '#fef3c7' : 'white'}
                            stroke={gard ? '#b45309' : '#0f766e'}
                            strokeWidth={3}
                        />
                        <text x={x} y={y - 32} textAnchor="middle" fontSize={36} fontWeight={900} fill={gard ? '#92400e' : '#115e59'}>
                            {e.tekst}
                        </text>
                    </motion.g>
                );
            })}
        </>
    );
}

function StedsnavnKort({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat <= 1 && (
                <motion.div
                    key="b0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute rounded-2xl shadow-xl bg-white/95"
                    style={{ right: '3%', top: '5%', padding: '10px 22px' }}
                >
                    <div className="font-display font-black text-slate-900" style={{ fontSize: 28 }}>
                        {beat === 0 ? 'Norrønt lever videre' : 'Endelser i stedsnavn'}
                    </div>
                </motion.div>
            )}
            {beat === 2 && (
                <motion.div
                    key="b2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute rounded-2xl shadow-xl bg-white/95"
                    style={{ right: '3%', top: '5%', padding: '12px 24px', maxWidth: '36%' }}
                >
                    <div className="font-display font-black text-teal-800" style={{ fontSize: 30 }}>
                        Nes og Dal
                    </div>
                    <div className="font-semibold text-slate-700" style={{ fontSize: 21 }}>
                        rene naturnavn. Noen er svært gamle
                    </div>
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    key="b3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute rounded-2xl shadow-xl"
                    style={{ right: '3%', top: '5%', padding: '12px 24px', maxWidth: '36%', background: '#fef3c7' }}
                >
                    <div className="font-display font-black text-amber-800" style={{ fontSize: 30 }}>
                        -stad og -bø
                    </div>
                    <div className="font-semibold text-slate-700" style={{ fontSize: 21 }}>
                        gamle ord for gård eller bosted. Navn på -stad var typiske i vikingtiden
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ---------------- england ---------------- */

function EnglandLag({ beat, pt }: { beat: number; pt: (ll: LngLat) => [number, number] }) {
    const england = pt([-1.5, 52.8]);
    const ruter: LngLat[] = [
        [6.0, 60.2],
        [9.0, 56.0],
    ];
    return (
        <>
            {ruter.map((r, i) => (
                <motion.path
                    key={i}
                    d={bue(pt(r), england, -0.15)}
                    fill="none"
                    stroke="#b45309"
                    strokeWidth={8}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: beat <= 1 ? 1 : 1, opacity: beat <= 1 ? 0.9 : 0 }}
                    transition={{ duration: 1.4, delay: i * 0.4 }}
                />
            ))}
            <Etikett xy={pt([9.5, 62.4])} tekst="Norge" storrelse={38} synlig={beat <= 1} />
            <Etikett xy={pt([10.5, 56.4])} tekst="Danmark" storrelse={34} anker="start" dx={30} synlig={beat <= 1} />
            <Etikett xy={pt([-1.4, 52.5])} tekst="England" storrelse={40} synlig={beat >= 1 && beat <= 3} />
            <Etikett xy={pt([-18.8, 64.9])} tekst="Island" storrelse={42} dy={70} synlig={beat >= 4} />
        </>
    );
}

function EnglandKort({ beat }: { beat: number }) {
    return (
        <>
            <AnimatePresence>
                {beat === 1 && (
                    <motion.div
                        key="tusen"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-2xl bg-white/95 text-center"
                        style={{ left: '4%', top: '30%', padding: '14px 26px' }}
                    >
                        <div className="font-display font-black text-amber-700" style={{ fontSize: 56 }}>
                            ca. 1 000
                        </div>
                        <div className="font-bold text-slate-700" style={{ fontSize: 22 }}>
                            engelske ord fra norrønt
                        </div>
                        <div className="font-semibold text-slate-600" style={{ fontSize: 20 }}>
                            anslag fra forskere
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 2 && beat <= 3 && (
                    <motion.div
                        key="ord"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-2xl bg-white/95"
                        style={{ left: '3%', top: '12%', width: '37%', padding: '14px 22px' }}
                    >
                        <div className="flex font-bold text-slate-500" style={{ fontSize: 19 }}>
                            <div style={{ width: '52%' }}>norrønt</div>
                            <div>engelsk i dag</div>
                        </div>
                        {ORD_ENGELSK.map((o) => (
                            <motion.div
                                key={o.norront}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat >= o.beat ? 1 : 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex items-baseline"
                                style={{ fontSize: 34, height: 52 }}
                            >
                                <div className="font-serif italic" style={{ width: '52%', color: '#78350f' }}>
                                    {o.norront}
                                </div>
                                <div className="font-display font-black" style={{ color: '#1d4ed8' }}>
                                    {o.engelsk}
                                    {o.norront === o.engelsk && (
                                        <span className="font-sans font-bold text-teal-700" style={{ fontSize: 20, marginLeft: 10 }}>
                                            uendret
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.div
                        key="island"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-2xl text-center"
                        style={{ left: '4%', top: '42%', padding: '14px 24px', background: '#fff7ed', border: '4px solid #f97316' }}
                    >
                        <div className="font-display font-black text-orange-800" style={{ fontSize: 36 }}>
                            Islandsk: en tidsmaskin
                        </div>
                        <div className="font-semibold text-slate-700" style={{ fontSize: 21 }}>
                            folk leser de gamle tekstene uten store problemer
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export function NorrontKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'vest';
    const utsnitt = UTSNITT[modus];
    const { geographies } = useFilmVerden(utsnitt);
    const p = useMemo(() => lagProjeksjon(utsnitt), [utsnitt]);
    const sti = useMemo(() => geoPath(p), [p]);
    const pt = (ll: LngLat) => p(ll) as [number, number];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Land geographies={geographies} sti={sti} modus={modus} beat={beat} />
                {modus === 'vest' && <VestLag beat={beat} pt={pt} />}
                {modus === 'aasen' && <AasenLag beat={beat} p={p} pt={pt} />}
                {modus === 'stedsnavn' && <StedsnavnLag beat={beat} pt={pt} />}
                {modus === 'england' && <EnglandLag beat={beat} pt={pt} />}
            </svg>
            {modus === 'vest' && (
                <AnimatePresence>
                    {beat === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute rounded-2xl shadow-xl bg-white/95"
                            style={{ left: '3%', top: '5%', padding: '10px 22px' }}
                        >
                            <div className="font-display font-black text-slate-900" style={{ fontSize: 28 }}>
                                Norrønt: 700 til 1350
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
            {modus === 'aasen' && <AasenKort beat={beat} />}
            {modus === 'stedsnavn' && <StedsnavnKort beat={beat} />}
            {modus === 'england' && <EnglandKort beat={beat} />}
            <div
                className="absolute rounded-lg bg-white/85 font-bold text-slate-600"
                style={{ right: '2%', bottom: '3%', padding: '3px 12px', fontSize: 16 }}
            >
                {modus === 'aasen'
                    ? 'Områdene er omtrentlige. Dagens grenser'
                    : modus === 'stedsnavn'
                      ? 'Endelsene er eksempler, ikke bestemte steder'
                      : 'Dagens grenser'}
            </div>
        </div>
    );
}
