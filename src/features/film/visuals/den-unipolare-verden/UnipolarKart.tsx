import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kart over den unipolare verden, i fem modus:
 * «sko»: joggeskoens reise fra USA via Kina og Vietnam til Norge, og handelslinjene rundt kloden.
 * «gevinst»: Asia får jobbene, de gamle industribyene i USA og Europa mister dem.
 * «nato»: landene i øst går vestover, NATO i 1999 og 2004, og grensen sett fra Moskva.
 * «terror»: 11. september som steder på kartet, så krigene i Afghanistan og Irak.
 * «krise»: finanskrisen sprer seg som ringer fra New York.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'sko' | 'gevinst' | 'nato' | 'terror' | 'krise';

const USA = 840;
const RUSSLAND = 643;
const NORGE = 578;
const KINA = 156;
const VIETNAM = 704;
const AFGHANISTAN = 4;
const IRAK = 368;
const UKRAINA = 804;
/** Krim hørte til Ukraina i årene filmen handler om. Kartet tegner den som russisk, så vi tegner den over. */
const KRIM = {
    type: 'Polygon',
    coordinates: [
        [
            [33.4, 46.1],
            [34.6, 46.2],
            [35.5, 45.6],
            [36.7, 45.5],
            [36.5, 45.1],
            [35.2, 44.7],
            [33.5, 44.35],
            [32.4, 45.35],
            [33.4, 46.1],
        ],
    ],
};
const NATO_FOR = [840, 124, 826, 250, 276, 380, 528, 56, 442, 208, 578, 352, 620, 300, 792, 724];
const NATO_1999 = [616, 203, 348];
const BALTIKUM = [233, 428, 440];
const NATO_2004_ANDRE = [703, 705, 642, 100];
const OSTBLOKK = [...NATO_1999, ...BALTIKUM, ...NATO_2004_ANDRE];
const ASIA = [156, 356, 704, 360, 50, 764, 458, 608, 410, 116, 104, 418, 144, 524, 586, 496];

const STED = {
    usa: [-98, 39] as LngLat,
    kina: [108, 32] as LngLat,
    vietnam: [106, 15] as LngLat,
    norge: [10.75, 60.5] as LngLat,
    moskva: [37.6, 55.75] as LngLat,
    newyork: [-74, 40.7] as LngLat,
    pentagon: [-77.05, 38.87] as LngLat,
    pennsylvania: [-78.9, 40.05] as LngLat,
    afghanistan: [66, 34] as LngLat,
    irak: [44, 33] as LngLat,
    midtvest: [-85, 42] as LngLat,
    europa: [8, 50.5] as LngLat,
};

/** Handelslinjer som går kors og tvers på kloden. */
const HANDEL: [LngLat, LngLat][] = [
    [[-74, 40.7], [0, 51.5]],
    [[121, 31], [-118, 34]],
    [[121, 31], [4.5, 52]],
    [[103.8, 1.3], [55, 25]],
    [[-46.6, -23.5], [4.5, 52]],
    [[139.7, 35.7], [-122, 37.8]],
    [[72.8, 19], [4.5, 52]],
    [[28, -26], [121, 31]],
    [[-74, 40.7], [139.7, 35.7]],
    [[151, -34], [103.8, 1.3]],
];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    usa: '#2563eb',
    nato: '#60a5fa',
    natoNy: '#1d4ed8',
    ost: '#fca5a5',
    russland: '#b91c1c',
    russlandMork: '#7f1d1d',
    asia: '#4ade80',
    kina: '#ca8a04',
    vietnam: '#0d9488',
    norge: '#0f766e',
    krig: '#f97316',
    krise: '#ef4444',
    gra: '#a8a29e',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat, p: GeoProjection) =>
        p.fitExtent(
            [
                [50, 50],
                [B - 50, H - 50],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    if (modus === 'nato') return utsnitt([-12, 36], [58, 68], geoMercator());
    return utsnitt([-150, -45], [170, 72], geoNaturalEarth1());
}

function visningFor(modus: Modus, beat: number): { midt: LngLat | null; zoom: number } {
    if (modus === 'sko' && (beat === 1 || beat === 2)) return { midt: beat === 1 ? [-60, 38] : [95, 28], zoom: beat === 1 ? 1.6 : 2 };
    if (modus === 'gevinst' && beat === 1) return { midt: [100, 25], zoom: 1.7 };
    if (modus === 'gevinst' && beat === 2) return { midt: [-35, 45], zoom: 1.6 };
    if (modus === 'nato' && beat >= 5) return { midt: [33, 56], zoom: 1.6 };
    if (modus === 'terror' && beat <= 3) return { midt: [-76.5, 39.8], zoom: 7 };
    if (modus === 'terror' && beat === 4) return { midt: [-10, 38], zoom: 1.35 };
    if (modus === 'krise' && beat <= 1) return { midt: [-74, 40.7], zoom: 3.2 };
    if (modus === 'krise' && beat === 4) return { midt: [-92, 40], zoom: 2.4 };
    return { midt: null, zoom: 1 };
}

function fargeFor(modus: Modus, beat: number, id: number, krisefront: number, sentre: Map<number, LngLat>): string {
    if (modus === 'sko') {
        if (beat >= 1 && id === USA) return FARGE.usa;
        if (beat >= 2 && id === KINA) return FARGE.kina;
        if (beat >= 2 && id === VIETNAM) return FARGE.vietnam;
        if (beat >= 3 && id === NORGE) return FARGE.norge;
        return FARGE.land;
    }
    if (modus === 'gevinst') {
        if (beat !== 2 && ASIA.includes(id)) return beat === 0 ? '#bbf7d0' : FARGE.asia;
        if (beat >= 2 && (id === USA || [826, 250, 276, 380, 56].includes(id))) return FARGE.gra;
        return FARGE.land;
    }
    if (modus === 'nato') {
        if (id === RUSSLAND) return beat >= 6 ? FARGE.russlandMork : FARGE.russland;
        if (NATO_FOR.includes(id)) return beat >= 1 ? FARGE.nato : FARGE.land;
        if (beat >= 2 && NATO_1999.includes(id)) return FARGE.natoNy;
        if (beat >= 3 && (BALTIKUM.includes(id) || NATO_2004_ANDRE.includes(id))) return FARGE.natoNy;
        if (OSTBLOKK.includes(id)) return FARGE.ost;
        if (beat === 0 && [112, 804, 498].includes(id)) return FARGE.ost;
        return FARGE.land;
    }
    if (modus === 'terror') {
        if (id === USA) return beat >= 5 ? '#93c5fd' : FARGE.usa;
        if (beat >= 4 && (id === AFGHANISTAN || id === IRAK)) return FARGE.krig;
        return FARGE.land;
    }
    // krise
    if (id === USA) return FARGE.krise;
    if (beat >= 2) {
        const s = sentre.get(id);
        if (s && avstand(s, STED.newyork) < krisefront) return '#fca5a5';
    }
    return FARGE.land;
}

/** Grov avstand i grader mellom to punkter (nok til å la krisa spre seg i ringer). */
function avstand(a: LngLat, b: LngLat) {
    const dx = (a[0] - b[0]) * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
}

/** Hvor langt krisa har nådd (grader fra New York), steg for steg slik at land ikke tegnes om hvert bilde. */
function useKrisefront(aktiv: boolean, playing: boolean) {
    const [front, setFront] = useState(0);
    useEffect(() => {
        if (!aktiv || !playing) return;
        let n = 0;
        const id = setInterval(() => {
            n += 12;
            setFront(n);
            if (n > 200) clearInterval(id);
        }, 250);
        return () => {
            clearInterval(id);
            setFront(0);
        };
    }, [aktiv, playing]);
    if (!aktiv) return 999;
    return playing ? front : 200;
}

export function UnipolarKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'sko';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const mål = visningFor(modus, beat);
    const målPx: [number, number] = mål.midt ? p(mål.midt) : [B / 2, H / 2];
    const [vis, setVis] = useState({ x: målPx[0], y: målPx[1], k: mål.zoom });
    const visRef = useRef(vis);
    useEffect(() => {
        if (!playing) return;
        let raf = 0;
        let sist = performance.now();
        const steg = (n: number) => {
            const dt = Math.min(0.05, (n - sist) / 1000);
            sist = n;
            const a = 1 - Math.exp(-1.6 * dt);
            const c = visRef.current;
            const ny = {
                x: c.x + (målPx[0] - c.x) * a,
                y: c.y + (målPx[1] - c.y) * a,
                k: c.k + (mål.zoom - c.k) * a,
            };
            visRef.current = ny;
            setVis(ny);
            if (Math.abs(ny.k - mål.zoom) > 0.002 || Math.abs(ny.x - målPx[0]) > 0.5 || Math.abs(ny.y - målPx[1]) > 0.5)
                raf = requestAnimationFrame(steg);
        };
        raf = requestAnimationFrame(steg);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [beat, playing, modus, målPx[0], målPx[1], mål.zoom]);

    const kartTransform = `translate(${B / 2 - vis.x * vis.k} ${H / 2 - vis.y * vis.k}) scale(${vis.k})`;
    const skjerm = (ll: LngLat): [number, number] => {
        const [x, y] = p(ll);
        return [B / 2 + (x - vis.x) * vis.k, H / 2 + (y - vis.y) * vis.k];
    };

    const sentre = useMemo(() => {
        const m = new Map<number, LngLat>();
        for (const g of geographies) {
            const c = geoPath().centroid(g as never);
            if (Number.isFinite(c[0])) m.set(Number(g.id), c as LngLat);
        }
        return m;
    }, [geographies]);
    const krisefront = useKrisefront(modus === 'krise' && beat >= 2, playing);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <g transform={kartTransform}>
                    <Land
                        geographies={geographies}
                        sti={sti}
                        farge={(id) => fargeFor(modus, beat, id, krisefront, sentre)}
                        nokkel={`${modus}-${beat}-${krisefront}`}
                    />
                    {modus === 'nato' && (
                        <path
                            d={sti(KRIM as never) ?? ''}
                            fill={fargeFor(modus, beat, UKRAINA, krisefront, sentre)}
                            stroke={FARGE.kant}
                            strokeWidth={0.8}
                            vectorEffect="non-scaling-stroke"
                            style={{ transition: 'fill 1.1s ease' }}
                        />
                    )}
                </g>

                {modus === 'sko' && (
                    <>
                        {(beat === 0 || beat === 4) &&
                            HANDEL.map(([a, b], i) => (
                                <Pil key={`h${beat}-${i}`} fra={skjerm(a)} til={skjerm(b)} farge="#475569" forsinkelse={i * 0.25} bue={0.12} tynn />
                            ))}
                        {beat >= 1 && beat <= 3 && <Nål pos={skjerm(STED.usa)} tekst="Designet i USA" vis={beat === 1} />}
                        {beat === 2 && <Pil fra={skjerm(STED.kina)} til={skjerm(STED.vietnam)} farge={FARGE.kina} bue={0.3} />}
                        {beat === 2 && <Nål pos={skjerm(STED.kina)} tekst="Stoff fra Kina" />}
                        {beat === 2 && <Nål pos={skjerm(STED.vietnam)} tekst="Sydd i Vietnam" under />}
                        {beat === 3 && <Pil fra={skjerm(STED.usa)} til={skjerm(STED.vietnam)} farge={FARGE.usa} bue={-0.18} tynn />}
                        {beat === 3 && <Pil fra={skjerm(STED.vietnam)} til={skjerm(STED.norge)} farge={FARGE.norge} bue={-0.2} forsinkelse={0.6} />}
                        {beat === 3 && <Nål pos={skjerm(STED.norge)} tekst="Solgt i Norge" />}
                        {beat === 3 && <Nål pos={skjerm(STED.vietnam)} tekst="Vietnam" under />}
                        {beat >= 1 && beat <= 3 && (
                            <Sko pos={skjerm(beat === 1 ? STED.usa : beat === 2 ? [114, 21] : [25, 54])} />
                        )}
                    </>
                )}

                {modus === 'gevinst' && (
                    <>
                        {beat !== 2 && <Etikett pos={skjerm([100, 22])} tekst="Asia" farge="#166534" stor />}
                        {beat === 2 && <Fabrikk pos={skjerm(STED.midtvest)} />}
                        {beat === 2 && <Fabrikk pos={skjerm(STED.europa)} />}
                        {beat === 2 && <Etikett pos={skjerm([-85, 35])} tekst="Fabrikken stenger" farge="#44403c" dy={30} />}
                        {beat === 3 && (
                            <>
                                <Pil fra={skjerm(STED.midtvest)} til={skjerm([100, 28])} farge="#16a34a" bue={-0.15} />
                                <Pil fra={skjerm(STED.europa)} til={skjerm([100, 28])} farge="#16a34a" bue={-0.15} forsinkelse={0.4} />
                            </>
                        )}
                    </>
                )}

                {modus === 'nato' && (
                    <>
                        {beat === 0 && <Etikett pos={skjerm([40, 58])} tekst="Sovjetunionens makt" farge={FARGE.russland} stor />}
                        {beat >= 1 && beat <= 4 && <Etikett pos={skjerm([42, 58])} tekst="Russland" farge={FARGE.russland} stor />}
                        {beat === 1 && <Etikett pos={skjerm([2, 47])} tekst="NATO" farge="#1e3a8a" stor />}
                        {beat === 1 &&
                            [
                                [20, 52],
                                [24.5, 57],
                                [19, 47],
                            ].map((ll, i) => (
                                <Pil key={i} fra={skjerm(ll as LngLat)} til={skjerm([ll[0] - 10, ll[1]] as LngLat)} farge="#1d4ed8" forsinkelse={i * 0.3} bue={0.1} />
                            ))}
                        {beat === 2 && <Etikett pos={skjerm([19, 50.5])} tekst="1999" farge="#1e3a8a" stor />}
                        {beat === 3 && <Etikett pos={skjerm([19, 58.3])} tekst="2004" farge="#1e3a8a" stor />}
                        {beat >= 5 && <Nål pos={skjerm(STED.moskva)} tekst="Moskva" />}
                        {beat >= 5 && <Grense punkter={[[28, 59.6], [27.6, 57.5], [26.6, 55.7], [23.5, 53.9]].map((ll) => skjerm(ll as LngLat))} />}
                    </>
                )}

                {modus === 'terror' && (
                    <>
                        {beat >= 1 && beat <= 3 && <Nål pos={skjerm(STED.newyork)} tekst="New York" />}
                        {beat >= 1 && beat <= 3 && <Nål pos={skjerm(STED.pentagon)} tekst="Pentagon" under />}
                        {beat >= 1 && beat <= 3 && <Nål pos={skjerm(STED.pennsylvania)} tekst="Pennsylvania" venstre />}
                        {beat === 0 && <Etikett pos={skjerm([-76.5, 37])} tekst="USA" farge={FARGE.usa} stor />}
                        {beat === 4 && <Pil fra={skjerm([-80, 38])} til={skjerm(STED.afghanistan)} farge={FARGE.krig} bue={-0.15} />}
                        {beat === 4 && <Pil fra={skjerm([-80, 38])} til={skjerm(STED.irak)} farge={FARGE.krig} bue={-0.1} forsinkelse={1.2} />}
                        {beat >= 4 && <Etikett pos={skjerm([66, 39])} tekst="Afghanistan" farge="#9a3412" dy={-30} />}
                        {beat >= 4 && <Etikett pos={skjerm([42, 29])} tekst="Irak" farge="#9a3412" dy={30} />}
                    </>
                )}

                {modus === 'krise' && (
                    <>
                        <Nål pos={skjerm(STED.newyork)} tekst={beat <= 1 ? 'Wall Street, New York' : 'New York'} />
                        {beat >= 2 && <Ringer pos={skjerm(STED.newyork)} />}
                    </>
                )}
            </svg>

            <AnimatePresence>
                {modus === 'sko' && beat === 0 && <Brikke key="s0" tekst="1990-tallet: globalisering" />}
                {modus === 'sko' && beat === 4 && <Brikke key="s4" tekst="Containerskip og internett" />}
                {modus === 'gevinst' && beat === 0 && <Brikke key="g0" tekst="En vei ut av fattigdom" />}
                {modus === 'gevinst' && beat === 1 && <Brikke key="g1" tekst="Hundrevis av millioner fikk jobb" />}
                {modus === 'gevinst' && beat === 2 && <Brikke key="g2" tekst="Gamle industribyer: uten jobb" farge="rod" />}
                {modus === 'gevinst' && beat === 3 && <Brikke key="g3" tekst="Gevinsten ble delt ujevnt" />}
                {modus === 'nato' && beat === 1 && <Brikke key="n1" tekst="Vestover: NATO og EU" />}
                {modus === 'nato' && beat === 2 && <Brikke key="n2" tekst="1999: Polen, Tsjekkia, Ungarn" />}
                {modus === 'nato' && beat === 3 && <Brikke key="n3" tekst="2004: sju land til" />}
                {modus === 'nato' && beat === 4 && <Brikke key="n4" tekst="Sett fra Vesten: frihet" />}
                {modus === 'nato' && beat === 5 && <Brikke key="n5" tekst="Sett fra Moskva: fienden nærmer seg" farge="rod" />}
                {modus === 'nato' && beat === 6 && <Brikke key="n6" tekst="Russland: svakt og bittert" farge="rod" />}
                {modus === 'terror' && beat === 0 && <Brikke key="t0" tekst="11. september 2001" />}
                {modus === 'terror' && beat === 1 && <Brikke key="t1" tekst="Kaprede fly" />}
                {modus === 'terror' && beat === 2 && <Brikke key="t2" tekst="Nesten 3000 mennesker døde" farge="rod" />}
                {modus === 'terror' && beat === 3 && <Brikke key="t3" tekst="En fiende uten hær og uten stat" />}
                {modus === 'terror' && beat === 4 && <Brikke key="t4" tekst="Afghanistan 2001, Irak 2003" />}
                {modus === 'terror' && beat === 5 && <Brikke key="t5" tekst="Lange og dyre kriger" />}
                {modus === 'krise' && beat === 0 && <Brikke key="k0" tekst="September 2008: Lehman Brothers konkurs" farge="rod" />}
                {modus === 'krise' && beat === 1 && <Brikke key="k1" tekst="Huslån som ikke kunne betales" />}
                {modus === 'krise' && beat === 2 && <Brikke key="k2" tekst="Millioner mistet jobb og bolig" farge="rod" />}
                {modus === 'krise' && beat === 3 && <Brikke key="k3" tekst="Staten redder bankene" />}
                {modus === 'krise' && beat === 4 && <Brikke key="k4" tekst="Mistet kontrollen over egen økonomi" />}
            </AnimatePresence>
            {modus === 'krise' && beat === 3 && (
                <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2">
                    <Teller verdi={700} etikett="milliarder dollar i krisepakker" prefiks="ca. " forsinkelse={0.6} tone="rod" />
                </div>
            )}
        </div>
    );
}

/** Landene tegnes på nytt bare når fargene endrer seg. CSS glir mellom fargene. */
const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
    }) {
        return (
            <>
                {geographies.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge(Number(g.id))}
                        stroke={FARGE.kant}
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                ))}
            </>
        );
    },
    (a, b) => a.nokkel === b.nokkel && a.geographies === b.geographies && a.sti === b.sti
);

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
    dy = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    dy?: number;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            x={pos[0]}
            y={pos[1] + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 52 : 38}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
    tynn,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
    tynn?: boolean;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={tynn ? 3.5 : 6}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d={tynn ? 'M -12 -8 L 3 0 L -12 8 Z' : 'M -18 -11 L 4 0 L -18 11 Z'}
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.5 }}
            />
        </g>
    );
}

function Nål({
    pos,
    tekst,
    venstre,
    under,
    vis = true,
}: {
    pos: [number, number];
    tekst: string;
    venstre?: boolean;
    under?: boolean;
    vis?: boolean;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <circle cx={pos[0]} cy={pos[1]} r={11} fill="#0f172a" stroke="#ffffff" strokeWidth={4} />
            {vis && (
                <text
                    x={pos[0] + (venstre ? -24 : 0)}
                    y={pos[1] + (venstre ? 12 : under ? 52 : -26)}
                    textAnchor={venstre ? 'end' : 'middle'}
                    fontSize={36}
                    fontWeight={900}
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth={8}
                    paintOrder="stroke"
                >
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

/** En joggesko som spretter inn ved stedet den er nå. */
function Sko({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            key={`${Math.round(pos[0])}`}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${pos[0] + 60}px ${pos[1] + 40}px` }}
        >
            <g transform={`translate(${pos[0] + 22} ${pos[1] + 14})`}>
                <path
                    d="M 0 50 L 0 18 Q 0 6 12 6 L 30 6 Q 38 22 56 26 L 92 34 Q 112 38 112 54 L 112 60 L 0 60 Z"
                    fill="#f8fafc"
                    stroke="#0f172a"
                    strokeWidth={5}
                    strokeLinejoin="round"
                />
                <rect x={-2} y={56} width={116} height={10} rx={4} fill="#0f172a" />
                <path d="M 30 26 L 66 40" stroke="#dc2626" strokeWidth={7} strokeLinecap="round" />
                <path d="M 26 16 L 36 26 M 36 14 L 46 26" stroke="#0f172a" strokeWidth={3} />
            </g>
        </motion.g>
    );
}

/** En fabrikk med et stort grått kryss: jobben er borte. */
function Fabrikk({ pos }: { pos: [number, number] }) {
    const [x, y] = [pos[0] - 50, pos[1] - 60];
    return (
        <motion.g initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <path
                d={`M ${x} ${y + 70} L ${x} ${y + 30} L ${x + 25} ${y + 15} L ${x + 25} ${y + 30} L ${x + 50} ${y + 15} L ${x + 50} ${y + 30} L ${x + 75} ${y + 15} L ${x + 75} ${y + 30} L ${x + 100} ${y + 30} L ${x + 100} ${y + 70} Z`}
                fill="#78716c"
                stroke="#ffffff"
                strokeWidth={4}
            />
            <rect x={x + 80} y={y - 10} width={12} height={40} fill="#78716c" stroke="#ffffff" strokeWidth={3} />
            <motion.g
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, type: 'spring' }}
                style={{ transformOrigin: `${x + 50}px ${y + 45}px` }}
                stroke="#b91c1c"
                strokeWidth={10}
                strokeLinecap="round"
            >
                <line x1={x + 22} y1={y + 18} x2={x + 78} y2={y + 72} />
                <line x1={x + 78} y1={y + 18} x2={x + 22} y2={y + 72} />
            </motion.g>
        </motion.g>
    );
}

/** NATOs nye grense, helt inntil Russland. */
function Grense({ punkter }: { punkter: [number, number][] }) {
    const d = punkter.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
    return (
        <g>
            <motion.path
                d={d}
                stroke="#0f172a"
                strokeWidth={22}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.2 }}
            />
            <motion.path
                d={d}
                stroke="#facc15"
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.2 }}
            />
        </g>
    );
}

/** Ringer som brer seg utover fra et punkt. */
function Ringer({ pos }: { pos: [number, number] }) {
    return (
        <g>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={pos[0]}
                    cy={pos[1]}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={5}
                    initial={{ r: 10, opacity: 0.9 }}
                    animate={{ r: 900, opacity: 0 }}
                    transition={{ duration: 4.5, delay: i * 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
            ))}
        </g>
    );
}

function Brikke({ tekst, farge }: { tekst: string; farge?: 'rod' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                farge === 'rod' ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
            }`}
        >
            {tekst}
        </motion.div>
    );
}
