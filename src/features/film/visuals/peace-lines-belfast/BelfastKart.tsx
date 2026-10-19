import { memo, useEffect, useMemo, useState } from 'react';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
} from 'framer-motion';
import { geoCentroid, geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Irland og Storbritannia. Fire modus:
 * «deling»: hele øya under britisk styre, Dublin 1916, delingen i 1920 og Nord-Irland.
 * «protest»: Nord-Irland 1968-1969, protestene og soldatene som kommer fra Storbritannia.
 * «derry»: Derry, 30. januar 1972.
 * «fred»: USA som hjelper til, Dublin og London som samarbeider, og Belfast-avtalen.
 */

type Modus = 'deling' | 'protest' | 'derry' | 'fred';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const UTSNITT: Utsnitt = [
    [-11, 51],
    [0.5, 56],
];

const BELFAST: LngLat = [-5.93, 54.6];
const DERRY: LngLat = [-7.31, 55.0];
const DUBLIN: LngLat = [-6.26, 53.35];
const LONDON: LngLat = [-0.13, 51.5];
const SKOTTLAND: LngLat = [-4.6, 54.85];
const USA_FRA: LngLat = [-14.5, 53.0];

const BRITISK = '#9fb0cf';
const IRSK = '#5fae74';
const NORD = '#7189bd';

/** Hvor kartet står for hver beat: midtpunkt og zoom. */
function utsikt(modus: Modus, beat: number): { senter: LngLat; zoom: number } {
    if (modus === 'deling')
        return beat >= 3 ? { senter: [-6.8, 54.2], zoom: 1.7 } : { senter: [-5.3, 53.6], zoom: 1 };
    if (modus === 'protest') return { senter: [-6.4, 54.72], zoom: 3 };
    if (modus === 'derry')
        return beat === 0
            ? { senter: [-6.6, 54.72], zoom: 3 }
            : { senter: [-7.0, 54.8], zoom: 3.4 };
    return { senter: [-5.3, 53.6], zoom: 1 };
}

const TITLER: Record<Modus, string[]> = {
    deling: [
        'Irland under britisk styre',
        'Dublin 1916: Påskeopprøret',
        '1920: øya deles',
        'Nord-Irland blir britisk',
        'To grupper, to ønsker',
    ],
    protest: [
        '1968: krav om like rettigheter',
        'Møtt med vold',
        '1969: britiske soldater kommer',
        'Jubel, men ikke lenge',
    ],
    derry: [
        'Derry, 30. januar 1972',
        'Mot fengsel uten dom',
        'Demonstrantene hadde ingen våpen',
        'Soldatene åpnet ild',
    ],
    fred: [
        'USA hjelper til',
        '1994: IRA erklærer våpenhvile',
        'Irland og Storbritannia samarbeider',
        '10. april 1998: Belfast-avtalen',
    ],
};

export function BelfastKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'deling';
    const { geographies } = useFilmVerden(UTSNITT);

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 60],
                    [B - 60, H - 60],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    // Del Storbritannia i Nord-Irland og resten, så Nord-Irland kan løftes fram.
    const land = useMemo(() => {
        const irland: unknown[] = [];
        const britisk: unknown[] = [];
        const nord: unknown[] = [];
        const andre: unknown[] = [];
        for (const g of geographies as {
            id?: string | number;
            geometry?: { type: string; coordinates: unknown[] };
        }[]) {
            const id = String(g.id);
            if (id === '372') irland.push(g);
            else if (id === '826' && g.geometry?.type === 'MultiPolygon') {
                for (const poly of g.geometry.coordinates) {
                    const f = {
                        type: 'Feature',
                        properties: {},
                        geometry: { type: 'Polygon', coordinates: poly },
                    };
                    const [lng, lat] = geoCentroid(f as never);
                    (lng < -5.4 && lat > 54 && lat < 55.5 ? nord : britisk).push(f);
                }
            } else if (id === '826') britisk.push(g);
            else andre.push(g);
        }
        return { irland, britisk, nord, andre };
    }, [geographies]);

    // Kameraet glir mellom utsiktene.
    const start = utsikt(modus, beat);
    const lng = useMotionValue(start.senter[0]);
    const lat = useMotionValue(start.senter[1]);
    const zoom = useMotionValue(start.zoom);
    useEffect(() => {
        const m = utsikt(modus, beat);
        const o = { duration: 2.4, ease: 'easeInOut' as const };
        const a = animate(lng, m.senter[0], o);
        const b = animate(lat, m.senter[1], o);
        const c = animate(zoom, m.zoom, o);
        return () => {
            a.stop();
            b.stop();
            c.stop();
        };
    }, [modus, beat, lng, lat, zoom]);
    const [vis, setVis] = useState({
        lng: start.senter[0],
        lat: start.senter[1],
        zoom: start.zoom,
    });
    useMotionValueEvent(lng, 'change', (x) => setVis((s) => ({ ...s, lng: x })));
    useMotionValueEvent(lat, 'change', (x) => setVis((s) => ({ ...s, lat: x })));
    useMotionValueEvent(zoom, 'change', (x) => setVis((s) => ({ ...s, zoom: x })));

    const senter = p([vis.lng, vis.lat]);
    const k = vis.zoom;
    const kartTransform = `translate(${B / 2 - senter[0] * k} ${H / 2 - senter[1] * k}) scale(${k})`;
    const skjerm = (ll: LngLat): [number, number] => {
        const q = p(ll);
        return [B / 2 + (q[0] - senter[0]) * k, H / 2 + (q[1] - senter[1]) * k];
    };

    const irskFarge = modus === 'deling' && beat < 2 ? BRITISK : IRSK;
    const nordFarge = modus === 'deling' && beat < 3 ? BRITISK : NORD;
    const tittel = TITLER[modus][Math.min(beat, TITLER[modus].length - 1)];

    const merker: { ll: LngLat; tekst: string; farge?: string; under?: boolean; stor?: boolean }[] =
        [];
    if (modus === 'deling') {
        if (beat >= 1 && beat <= 2) merker.push({ ll: DUBLIN, tekst: 'Dublin', farge: '#14532d' });
        if (beat === 2)
            merker.push({ ll: [-8.2, 52.6], tekst: 'Irland', farge: '#14532d', stor: true });
        if (beat >= 3)
            merker.push({ ll: [-6.7, 54.65], tekst: 'Nord-Irland', farge: '#1e3a8a', stor: true });
        if (beat === 2)
            merker.push({ ll: [-2.0, 53.0], tekst: 'Storbritannia', farge: '#1e3a8a', stor: true });
    }
    if (modus === 'protest') {
        merker.push({ ll: BELFAST, tekst: 'Belfast', under: true });
        if (beat === 0)
            merker.push({
                ll: [-7.3, 54.3],
                tekst: 'Krav: like rettigheter',
                farge: '#14532d',
                stor: true,
            });
        if (beat === 1)
            merker.push({
                ll: [-7.3, 54.3],
                tekst: 'Politi og lojalister slår ned',
                farge: '#b91c1c',
                stor: true,
            });
        if (beat >= 2) merker.push({ ll: SKOTTLAND, tekst: 'Fra Storbritannia', farge: '#1e3a8a' });
    }
    if (modus === 'derry') {
        merker.push({ ll: DERRY, tekst: 'Derry', farge: beat >= 3 ? '#b91c1c' : '#0f172a' });
        if (beat === 0) merker.push({ ll: BELFAST, tekst: 'Belfast', under: true });
    }
    if (modus === 'fred') {
        if (beat === 1)
            merker.push({ ll: [-8.6, 54.1], tekst: 'Våpenhvile', farge: '#064e3b', stor: true });
        merker.push({ ll: BELFAST, tekst: 'Belfast', farge: beat >= 3 ? '#b45309' : '#0f172a' });
        if (beat >= 2) {
            merker.push({ ll: DUBLIN, tekst: 'Dublin', under: true });
            merker.push({ ll: LONDON, tekst: 'London', under: true });
        }
    }

    const a = skjerm(SKOTTLAND);
    const bf = skjerm(BELFAST);
    const usa = skjerm(USA_FRA);
    const dub = skjerm(DUBLIN);
    const lon = skjerm(LONDON);
    const derry = skjerm(DERRY);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#cfe3f1' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <g transform={kartTransform}>
                    <Land geographies={land.andre} sti={sti} farge="#ece6d6" k={k} />
                    <Land geographies={land.britisk} sti={sti} farge={BRITISK} k={k} />
                    <Land geographies={land.irland} sti={sti} farge={irskFarge} k={k} />
                    <Land geographies={land.nord} sti={sti} farge={nordFarge} k={k} />
                    {modus === 'deling' && beat >= 3 && (
                        <Omriss geographies={land.nord} sti={sti} k={k} />
                    )}
                </g>

                {/* Soldatene kommer over havet fra Storbritannia */}
                {modus === 'protest' && beat >= 2 && (
                    <Pil fra={a} til={[bf[0] + 30, bf[1]]} farge="#1e3a8a" />
                )}

                {/* Derry: ringer som markerer stedet */}
                {modus === 'derry' && (
                    <g transform={`translate(${derry[0]} ${derry[1]})`}>
                        {beat >= 1 && (
                            <motion.circle
                                r={70}
                                fill="none"
                                stroke={beat >= 3 ? '#dc2626' : '#0f172a'}
                                strokeWidth={4}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.8 }}
                            />
                        )}
                        {beat >= 2 && (
                            <motion.circle
                                r={110}
                                fill="none"
                                stroke={beat >= 3 ? '#dc2626' : '#0f172a'}
                                strokeWidth={3}
                                strokeDasharray="10 10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                            />
                        )}
                    </g>
                )}

                {/* Fred: USA, Dublin og London */}
                {modus === 'fred' && (
                    <>
                        <Pil fra={usa} til={[bf[0] - 24, bf[1] + 6]} farge="#1d4ed8" />
                        <g
                            transform={`translate(170 ${usa[1] + ((170 - usa[0]) / (bf[0] - usa[0])) * (bf[1] - usa[1]) + 52})`}
                        >
                            <Etikett tekst="USA" farge="#1d4ed8" />
                        </g>
                        {beat >= 2 && (
                            <motion.line
                                x1={dub[0]}
                                y1={dub[1]}
                                x2={lon[0]}
                                y2={lon[1]}
                                stroke="#0f172a"
                                strokeWidth={5}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.6 }}
                            />
                        )}
                        {beat >= 3 && (
                            <motion.circle
                                cx={bf[0]}
                                cy={bf[1]}
                                r={40}
                                fill="none"
                                stroke="#b45309"
                                strokeWidth={5}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            />
                        )}
                    </>
                )}

                {merker.map((m) => {
                    const [x, y] = skjerm(m.ll);
                    return (
                        <g key={m.tekst} transform={`translate(${x} ${y})`}>
                            {!m.stor && (
                                <circle
                                    r={12}
                                    fill={m.farge ?? '#0f172a'}
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                />
                            )}
                            <Etikett
                                tekst={m.tekst}
                                farge={m.farge ?? '#0f172a'}
                                dy={m.stor ? 0 : m.under ? 46 : -22}
                                str={m.stor ? 44 : 38}
                            />
                        </g>
                    );
                })}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>

            {modus === 'deling' && beat >= 4 && (
                <div className="absolute bottom-[6%] inset-x-0 flex justify-center gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl border-l-8 border-green-600"
                    >
                        <div className="text-2xl font-black text-green-800">Katolikker</div>
                        <div className="text-xl font-semibold text-slate-600">
                            ett samlet Irland
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl border-l-8 border-blue-700"
                    >
                        <div className="text-2xl font-black text-blue-900">Protestanter</div>
                        <div className="text-xl font-semibold text-slate-600">være britiske</div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    farge,
    k,
}: {
    geographies: unknown[];
    sti: GeoPath;
    farge: string;
    k: number;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={farge}
                    stroke="#6b7a8f"
                    strokeWidth={1.2 / k}
                    style={{ transition: 'fill 1.2s ease' }}
                />
            ))}
        </>
    );
});

function Omriss({ geographies, sti, k }: { geographies: unknown[]; sti: GeoPath; k: number }) {
    return (
        <>
            {geographies.map((g, i) => (
                <motion.path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth={4 / k}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />
            ))}
        </>
    );
}

function Pil({ fra, til, farge }: { fra: [number, number]; til: [number, number]; farge: string }) {
    const vinkel = Math.atan2(til[1] - fra[1], til[0] - fra[0]);
    const spiss = (d: number, v: number): string =>
        `${til[0] - Math.cos(vinkel + v) * d} ${til[1] - Math.sin(vinkel + v) * d}`;
    return (
        <g>
            <motion.line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
            <motion.path
                d={`M ${spiss(30, 0.5)} L ${til[0]} ${til[1]} L ${spiss(30, -0.5)}`}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
            />
        </g>
    );
}

function Etikett({
    tekst,
    farge,
    dy = 0,
    str = 30,
}: {
    tekst: string;
    farge: string;
    dy?: number;
    str?: number;
}) {
    return (
        <text
            y={dy}
            textAnchor="middle"
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
