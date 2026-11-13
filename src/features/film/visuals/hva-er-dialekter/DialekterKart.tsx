import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoContains, geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Norgeskart med uskarpe «skyer» i stedet for streker, fordi dialektene glir over i hverandre.
 * «lyder»: Sør-Norge og Trøndelag. Rulle-r, skarre-r og tjukk l som skyer.
 * «omrader»: hele Norge. De fire store dialektområdene, så bygder som prikker i glidende farger,
 * og til slutt to nabobygder under lupa.
 * Alt er tegnet omtrentlig.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'lyder' | 'omrader';

const NORGE_ID = '578';

interface Sky {
    navn: string;
    farge: string;
    punkter: LngLat[];
    etikett: LngLat;
}

const SKARRE: Sky = {
    navn: 'skarre-r',
    farge: '#dc2626',
    punkter: [
        [8.0, 58.3],
        [7.0, 58.2],
        [6.0, 58.7],
        [5.7, 59.4],
        [5.5, 60.2],
        [5.4, 61.0],
        [6.0, 61.6],
        [6.6, 62.3],
    ],
    etikett: [5.2, 59.6],
};

const TJUKK_L: Sky = {
    navn: 'tjukk l',
    farge: '#16a34a',
    punkter: [
        [10.8, 59.7],
        [10.0, 59.6],
        [11.3, 60.5],
        [10.3, 60.8],
        [9.4, 61.5],
        [11.0, 61.7],
        [10.4, 63.0],
        [11.0, 63.5],
        [11.8, 64.0],
    ],
    etikett: [12.0, 61.0],
};

const OMRADER: Sky[] = [
    {
        navn: 'nordnorsk',
        farge: '#2563eb',
        punkter: [
            [13.4, 65.9],
            [14.6, 67.2],
            [16.2, 68.3],
            [18.6, 69.3],
            [21.5, 69.7],
            [24.5, 70.3],
            [27.5, 70.2],
        ],
        etikett: [19.5, 70.6],
    },
    {
        navn: 'trøndersk',
        farge: '#9333ea',
        punkter: [
            [10.4, 63.3],
            [11.4, 63.7],
            [12.2, 64.5],
            [9.6, 63.0],
        ],
        etikett: [8.0, 65.0],
    },
    {
        navn: 'vestnorsk',
        farge: '#dc2626',
        punkter: [
            [7.8, 58.4],
            [6.4, 58.6],
            [5.8, 59.4],
            [5.9, 60.4],
            [5.8, 61.3],
            [6.8, 62.2],
            [7.4, 59.2],
        ],
        etikett: [1.6, 62.4],
    },
    {
        navn: 'østnorsk',
        farge: '#0d9488',
        punkter: [
            [10.7, 59.6],
            [9.6, 59.5],
            [11.3, 60.4],
            [10.0, 60.9],
            [9.4, 61.7],
            [11.0, 61.6],
        ],
        etikett: [14.2, 60.2],
    },
];

function blandFarger(vekter: { farge: string; w: number }[]) {
    let r = 0;
    let g = 0;
    let b = 0;
    let sum = 0;
    for (const { farge, w } of vekter) {
        const n = parseInt(farge.slice(1), 16);
        r += ((n >> 16) & 255) * w;
        g += ((n >> 8) & 255) * w;
        b += (n & 255) * w;
        sum += w;
    }
    return `rgb(${Math.round(r / sum)}, ${Math.round(g / sum)}, ${Math.round(b / sum)})`;
}

const NORGE_HEL: [LngLat, LngLat] = [
    [-2, 57.6],
    [33, 71.4],
];
const SOR: [LngLat, LngLat] = [
    [1.5, 57.6],
    [17, 64.6],
];

const OVERSKRIFTER: Record<Modus, string[]> = {
    lyder: [
        'Rulle-r: fremme i munnen',
        'Skarre-r: bak i halsen',
        'Tjukk l: «sol» og «dal»',
        'Et kart av en samtale',
    ],
    omrader: [
        'Fire store dialektområder',
        'Nordnorsk og trøndersk',
        'Vestnorsk og østnorsk',
        'Ingen skarpe streker',
        'To nabobygder',
    ],
};

export function DialekterKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'omrader';
    const { geographies } = useFilmVerden([
        [3, 57.5],
        [32, 71.5],
    ]);
    const norge = useMemo(() => geographies.find((g) => String(g.id) === NORGE_ID), [geographies]);

    const ramme = modus === 'lyder' ? SOR : NORGE_HEL;
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [30, 120],
                    [B - 30, H - 50],
                ],
                { type: 'MultiPoint', coordinates: ramme } as never
            ),
        [ramme]
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const skala = modus === 'lyder' ? 1.8 : 1;

    // Bygdene: et rutenett av punkter innenfor Norge, med farge blandet etter avstand til områdene.
    const bygder = useMemo(() => {
        if (!norge || modus !== 'omrader') return [];
        const ut: { x: number; y: number; farge: string }[] = [];
        let i = 0;
        for (let lat = 58.1; lat < 71; lat += 0.3) {
            for (let lng = 4.8; lng < 31; lng += 0.55) {
                i++;
                if (!geoContains(norge as never, [lng, lat])) continue;
                const vekter = OMRADER.map((o) => {
                    const d = Math.min(
                        ...o.punkter.map(([a, b]) =>
                            Math.hypot((a - lng) * Math.cos((lat * Math.PI) / 180), b - lat)
                        )
                    );
                    return { farge: o.farge, w: 1 / Math.pow(d + 0.15, 3) };
                });
                // Litt tilfeldig skjevhet, så nabobygder ikke er helt like.
                const skjev = Math.sin(i * 91.7) * 0.5 + 0.5;
                vekter[i % 4].w *= 1 + skjev * 0.8;
                const [x, y] = p([lng, lat]);
                ut.push({ x, y, farge: blandFarger(vekter) });
            }
        }
        return ut;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [norge, modus, proj]);

    const skyer: { sky: Sky; vis: boolean }[] =
        modus === 'lyder'
            ? [
                  { sky: SKARRE, vis: beat >= 1 },
                  { sky: TJUKK_L, vis: beat >= 2 },
              ]
            : OMRADER.map((o, i) => ({ sky: o, vis: beat >= 1 + Math.floor(i / 2) && beat <= 2 }));

    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    const nordPrikk = bygder.length ? bygder[Math.floor(bygder.length * 0.18)] : null;
    const nabo = nordPrikk
        ? bygder.reduce(
              (best, b) => {
                  if (b === nordPrikk) return best;
                  const d = Math.hypot(b.x - nordPrikk.x, b.y - nordPrikk.y);
                  return d < best.d ? { b, d } : best;
              },
              { b: nordPrikk, d: Infinity }
          ).b
        : null;

    return (
        <div className="absolute inset-0 bg-[#bcd4e4] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <filter id="dialekter-sky" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={modus === 'lyder' ? 26 : 18} />
                    </filter>
                    {norge && (
                        <clipPath id="dialekter-norge">
                            <path d={sti(norge as never) ?? ''} />
                        </clipPath>
                    )}
                </defs>
                <Land geographies={geographies} sti={sti} />
                {modus === 'lyder' && beat === 0 && norge && (
                    <motion.path
                        d={sti(norge as never) ?? ''}
                        fill="#2563eb"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.35 }}
                        transition={{ duration: 1 }}
                    />
                )}
                {modus === 'lyder' && beat === 0 && (
                    <g clipPath="url(#dialekter-norge)" filter="url(#dialekter-sky)">
                        {SKARRE.punkter.map((pt, i) => {
                            const [x, y] = p(pt);
                            return <circle key={i} cx={x} cy={y} r={42 * skala} fill="#f3ead6" />;
                        })}
                    </g>
                )}
                <g clipPath="url(#dialekter-norge)" filter="url(#dialekter-sky)">
                    {skyer.map(({ sky, vis }) => (
                        <motion.g
                            key={sky.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: vis ? 0.75 : 0 }}
                            transition={{ duration: 1.2 }}
                        >
                            {sky.punkter.map((pt, i) => {
                                const [x, y] = p(pt);
                                return (
                                    <circle key={i} cx={x} cy={y} r={42 * skala} fill={sky.farge} />
                                );
                            })}
                        </motion.g>
                    ))}
                </g>
                {modus === 'omrader' && beat >= 3 && (
                    <g>
                        {bygder.map((b, i) => (
                            <motion.circle
                                key={i}
                                cx={b.x}
                                cy={b.y}
                                r={6}
                                fill={b.farge}
                                stroke="#ffffff"
                                strokeWidth={1.5}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat === 4 ? 0.35 : 1 }}
                                transition={{ delay: beat === 3 ? (i % 40) * 0.03 : 0 }}
                            />
                        ))}
                    </g>
                )}
                {modus === 'omrader' && beat === 4 && nordPrikk && nabo && (
                    <Lupe a={nordPrikk} b={nabo} />
                )}
                {modus === 'lyder' && (
                    <>
                        <Navn ll={[11.0, 59.2]} tekst="Oslo" p={p} />
                        <Navn ll={[5.32, 60.39]} tekst="Bergen" p={p} venstre />
                        <Navn ll={[10.4, 63.43]} tekst="Trondheim" p={p} />
                    </>
                )}
            </svg>
            {/* Etiketter for skyene */}
            {skyer.map(({ sky, vis }) => {
                const [x, y] = p(sky.etikett);
                return (
                    <AnimatePresence key={sky.navn}>
                        {vis && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.5 }}
                                className="absolute flex justify-center"
                                style={{
                                    left: `${((x - 140) / B) * 100}%`,
                                    width: `${(280 / B) * 100}%`,
                                    top: `${(y / H) * 100}%`,
                                }}
                            >
                                <div
                                    className="px-3 py-1 rounded-xl bg-white font-black text-3xl shadow-lg whitespace-nowrap"
                                    style={{ color: sky.farge, border: `4px solid ${sky.farge}` }}
                                >
                                    {sky.navn}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                );
            })}
            {modus === 'lyder' && beat === 0 && (
                <div className="absolute flex justify-center" style={{ left: '52%', top: '40%' }}>
                    <div className="px-3 py-1 rounded-xl bg-white font-black text-3xl shadow-lg text-blue-700 border-4 border-blue-600">
                        rulle-r
                    </div>
                </div>
            )}
            {modus === 'lyder' && beat === 3 && (
                <div className="absolute right-[2%] bottom-[4%] px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-xl font-black text-slate-900">
                    Med målmerkene kan du nesten
                    <br />
                    lage et kart av en samtale
                </div>
            )}
            {modus === 'omrader' && beat === 3 && (
                <div className="absolute left-[3%] top-[22%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl font-black text-slate-900">
                    Hver prikk: en bygd.
                    <br />
                    Fargene glir over i hverandre.
                </div>
            )}
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none"
                >
                    <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
            <div className="absolute left-[2.5%] top-[4%] px-3 py-1.5 rounded-xl bg-white/85 text-slate-600 font-semibold text-lg">
                Tegnet omtrentlig
            </div>
        </div>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: GeoFeature[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={String(g.id) === NORGE_ID ? '#f3ead6' : '#e2ddd0'}
                    stroke="#a8a08a"
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});

function Navn({
    ll,
    tekst,
    p,
    venstre = false,
}: {
    ll: LngLat;
    tekst: string;
    p: (ll: LngLat) => [number, number];
    venstre?: boolean;
}) {
    const [x, y] = p(ll);
    return (
        <g>
            <circle cx={x} cy={y} r={9} fill="#0f172a" />
            <text
                x={venstre ? x - 16 : x + 16}
                y={y + 10}
                textAnchor={venstre ? 'end' : 'start'}
                fontSize={34}
                fontWeight={800}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={6}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </g>
    );
}

/** Lupe over to nabobygder: to hus med hver sin snakkeboble og hver sin bøying. */
function Lupe({ a, b }: { a: { x: number; y: number }; b: { x: number; y: number } }) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const lx = 1200;
    const ly = 520;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <circle cx={mx} cy={my} r={30} fill="none" stroke="#0f172a" strokeWidth={6} />
            <line
                x1={mx + 22}
                y1={my + 22}
                x2={lx - 170}
                y2={ly - 90}
                stroke="#0f172a"
                strokeWidth={5}
            />
            <circle cx={lx} cy={ly} r={240} fill="#fefce8" stroke="#0f172a" strokeWidth={8} />
            {[
                { x: lx - 105, f: '#dc2626', ord: 'å kasta' },
                { x: lx + 105, f: '#2563eb', ord: 'å kaste' },
            ].map((h) => (
                <g key={h.x}>
                    <rect x={h.x - 45} y={ly + 20} width={90} height={70} fill="#c2410c" />
                    <polygon
                        points={`${h.x - 58},${ly + 20} ${h.x},${ly - 30} ${h.x + 58},${ly + 20}`}
                        fill="#57534e"
                    />
                    <rect
                        x={h.x - 92}
                        y={ly - 150}
                        width={184}
                        height={70}
                        rx={20}
                        fill="#ffffff"
                        stroke={h.f}
                        strokeWidth={7}
                    />
                    <polygon
                        points={`${h.x - 14},${ly - 82} ${h.x + 14},${ly - 82} ${h.x},${ly - 52}`}
                        fill={h.f}
                    />
                    <text
                        x={h.x}
                        y={ly - 103}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill={h.f}
                    >
                        {h.ord}
                    </text>
                </g>
            ))}
            <text
                x={lx}
                y={ly + 150}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#0f172a"
            >
                to nabobygder
            </text>
            <text
                x={lx}
                y={ly + 192}
                textAnchor="middle"
                fontSize={26}
                fontWeight={700}
                fill="#64748b"
            >
                tenkt eksempel
            </text>
        </motion.g>
    );
}
