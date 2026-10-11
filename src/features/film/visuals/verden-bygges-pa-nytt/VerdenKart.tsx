import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    geoCentroid,
    geoMercator,
    geoNaturalEarth1,
    geoPath,
    type GeoPath,
    type GeoProjection,
} from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over verden etter 1945, i fire modus:
 * «kjemper»: de slitne landene, de knuste, og de to kjempene USA og Sovjetunionen.
 * «bretton»: verden i krig, så zoom inn på Bretton Woods der 44 land møttes.
 * «marshall»: pengestrømmen fra USA til Vest-Europa, Norge, og landene som sa nei.
 * «jernteppe»: hæren som blir stående i øst, og linja fra Stettin til Trieste.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'kjemper' | 'bretton' | 'marshall' | 'jernteppe';

const USA = 840;
const SOVJET = [643, 804, 112, 398, 860, 795, 417, 762, 268, 51, 31, 440, 428, 233, 498];
const OST = [616, 203, 703, 348, 642, 100];
const VEST = [826, 250, 528, 56, 380, 208, 40, 300, 792, 620, 372, 276, 752, 352];
const NORGE = 578;

const STED = {
    usa: [-98, 39] as LngLat,
    moskva: [37.6, 55.75] as LngLat,
    bretton: [-71.44, 44.26] as LngLat,
    oslo: [10.75, 59.91] as LngLat,
    stettin: [14.55, 53.43] as LngLat,
    trieste: [13.77, 45.65] as LngLat,
    ostersjoen: [18, 57.6] as LngLat,
    adriater: [16.5, 42.4] as LngLat,
};

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    slitt: '#a8a29e',
    knust: '#57534e',
    usa: '#2563eb',
    sovjet: '#dc2626',
    ost: '#f87171',
    ostMork: '#b91c1c',
    vest: '#5eead4',
    norge: '#0d9488',
    krig: '#ef9a7a',
};

interface Visning {
    /** Punkt (skjermkoordinat før zoom) som skal stå midt i bildet. */
    midt: LngLat;
    zoom: number;
}

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat, p: GeoProjection) =>
        p.fitExtent(
            [
                [50, 50],
                [B - 50, H - 50],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    if (modus === 'kjemper' || modus === 'bretton')
        return utsnitt([-150, -45], [170, 72], geoNaturalEarth1());
    if (modus === 'marshall') return utsnitt([-110, 22], [55, 70], geoMercator());
    return utsnitt([-12, 37], [48, 66], geoMercator());
}

function visningFor(modus: Modus, beat: number): Visning {
    if (modus === 'bretton' && beat >= 1) return beat >= 2 ? { midt: [-66, 45], zoom: 3.4 } : { midt: [-32, 52], zoom: 1.9 };
    if (modus === 'bretton') return { midt: [40, 38], zoom: 1.5 };
    if (modus === 'marshall' && beat === 2) return { midt: [10, 56], zoom: 1.7 };
    if (modus === 'marshall' && beat === 3) return { midt: [22, 53], zoom: 1.8 };
    if (modus === 'jernteppe' && beat >= 3) return { midt: [16, 50], zoom: 1.35 };
    if (modus === 'kjemper' && beat === 0) return { midt: [4, 50], zoom: 3.2 };
    if (modus === 'kjemper' && beat === 1) return { midt: [72, 44], zoom: 1.5 };
    if (modus === 'kjemper' && beat === 3) return { midt: [40, 52], zoom: 1.7 };
    return { midt: [NaN, NaN], zoom: 1 };
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    const sovjet = SOVJET.includes(id);
    if (modus === 'kjemper') {
        if (id === 826 || id === 250) return FARGE.slitt;
        if (beat >= 1 && (id === 276 || id === 392)) return FARGE.knust;
        if (beat >= 2 && id === USA) return FARGE.usa;
        if (beat >= 2 && sovjet) return FARGE.sovjet;
        if (beat >= 3 && OST.includes(id)) return FARGE.ost;
        return FARGE.land;
    }
    if (modus === 'bretton') {
        if (beat === 0 && (VEST.includes(id) || OST.includes(id) || sovjet || id === 392 || id === 156))
            return FARGE.krig;
        if (beat >= 1 && id === NORGE) return FARGE.norge;
        if (beat >= 1 && id === USA) return FARGE.usa;
        return FARGE.land;
    }
    if (modus === 'marshall') {
        if (id === USA) return FARGE.usa;
        if (beat >= 2 && id === NORGE) return FARGE.norge;
        if (beat >= 1 && VEST.includes(id)) return FARGE.vest;
        if (beat >= 3 && (sovjet || id === 616 || id === 203 || id === 703)) return FARGE.ostMork;
        return FARGE.land;
    }
    // jernteppe
    if (beat >= 1 && sovjet) return FARGE.sovjet;
    if (beat >= 2 && OST.includes(id)) return FARGE.ostMork;
    if (beat >= 1 && OST.includes(id)) return FARGE.ost;
    return FARGE.land;
}

export function VerdenKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kjemper';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    // Visningen glir mot målet for beaten. Første bilde hopper rett dit.
    const mål = visningFor(modus, beat);
    const målPx: [number, number] = Number.isNaN(mål.midt[0]) ? [B / 2, H / 2] : p(mål.midt);
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
        for (const g of geographies) m.set(Number(g.id), geoCentroid(g as never) as LngLat);
        return m;
    }, [geographies]);
    // Frankrike og Norge har øyer langt unna som drar sentrum ut på havet.
    const senter = (id: number): LngLat | undefined =>
        id === 250 ? [2.5, 46.6] : id === NORGE ? [9.5, 61] : id === 528 ? [5.6, 52.2] : sentre.get(id);

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
                        modus={modus}
                        beat={beat}
                    />
                </g>

                {modus === 'kjemper' && (
                    <>
                        <Etikett pos={skjerm([-12, 55])} tekst="Storbritannia: nesten konkurs" vis={beat === 0} />
                        <Etikett pos={skjerm([2, 44])} tekst="Frankrike: okkupert" dy={20} vis={beat === 0} />
                        {beat >= 1 && <Etikett pos={skjerm([10, 51])} tekst="Tyskland: knust" farge="#1c1917" dy={-40} vis={beat === 1} />}
                        {beat >= 1 && <Etikett pos={skjerm([134, 38])} tekst="Japan: knust" farge="#1c1917" dy={-50} vis={beat === 1} />}
                        {beat >= 2 && <Etikett pos={skjerm(STED.usa)} tekst="USA" farge={FARGE.usa} stor />}
                        {beat >= 2 && <Etikett pos={skjerm([90, 62])} tekst="Sovjetunionen" farge={FARGE.ostMork} stor />}
                        {beat === 3 &&
                            OST.map((id) => {
                                const s = senter(id);
                                return s ? <Pil key={id} fra={skjerm(STED.moskva)} til={skjerm(s)} farge={FARGE.ostMork} /> : null;
                            })}
                    </>
                )}

                {modus === 'bretton' && (
                    <>
                        {beat === 0 && <Etikett pos={skjerm([20, 40])} tekst="Krigen raser" farge="#9a3412" stor />}
                        {beat >= 1 && <Pil fra={skjerm(STED.oslo)} til={skjerm(STED.bretton)} farge={FARGE.norge} bue={-0.25} />}
                        {beat >= 1 && <Etikett pos={skjerm([12, 63])} tekst="Norge" farge={FARGE.norge} dy={-34} />}
                        {beat >= 1 && <Nål pos={skjerm(STED.bretton)} tekst="Bretton Woods" />}
                        {beat >= 2 && <Hotell pos={skjerm(STED.bretton)} />}
                    </>
                )}

                {modus === 'marshall' && (
                    <>
                        <Etikett pos={skjerm(STED.usa)} tekst="USA" farge={FARGE.usa} stor />
                        {beat === 1 &&
                            VEST.map((id, i) => {
                                const s = senter(id);
                                return s ? (
                                    <Pil key={id} fra={skjerm([-75, 40])} til={skjerm(s)} farge="#0f766e" forsinkelse={i * 0.12} bue={-0.18} />
                                ) : null;
                            })}
                        {beat === 2 && <Pil fra={skjerm([-75, 40])} til={skjerm(senter(NORGE)!)} farge={FARGE.norge} bue={-0.2} />}
                        {beat === 2 && <Etikett pos={skjerm([-4, 62])} tekst="Norge" farge={FARGE.norge} stor />}
                        {beat === 3 && <Etikett pos={skjerm([38, 56])} tekst="Sovjetunionen: Nei" farge={FARGE.ostMork} stor />}
                        {beat === 3 &&
                            [616, 203].map((id) => {
                                const s = senter(id);
                                return s ? <Kryss key={id} pos={skjerm(s)} /> : null;
                            })}
                    </>
                )}

                {modus === 'jernteppe' && (
                    <>
                        {beat === 0 && <Etikett pos={skjerm([12, 50])} tekst="Aldri mer" farge="#0f766e" stor />}
                        {beat >= 1 && <Etikett pos={skjerm([38, 57])} tekst="Sovjetunionen" farge={FARGE.ostMork} stor />}
                        {beat === 1 &&
                            OST.map((id, i) => {
                                const s = senter(id);
                                return s ? <Pil key={id} fra={skjerm(STED.moskva)} til={skjerm(s)} farge={FARGE.ostMork} forsinkelse={i * 0.25} /> : null;
                            })}
                        {beat >= 3 && <Teppe fra={skjerm(STED.stettin)} til={skjerm(STED.trieste)} />}
                        {beat >= 4 && (
                            <>
                                <Nål pos={skjerm(STED.stettin)} tekst="Stettin" venstre />
                                <Nål pos={skjerm(STED.trieste)} tekst="Trieste" venstre />
                                <Etikett pos={skjerm(STED.ostersjoen)} tekst="Østersjøen" farge="#1e40af" />
                                <Etikett pos={skjerm(STED.adriater)} tekst="Adriaterhavet" farge="#1e40af" />
                            </>
                        )}
                    </>
                )}
            </svg>

            <AnimatePresence>
                {modus === 'kjemper' && beat === 3 && <Brikke key="k3" tekst="Rundt 27 millioner døde i Sovjetunionen" />}
                {modus === 'kjemper' && beat === 4 && <Brikke key="k4" tekst="USA: sterkest økonomi, eneste med atombomben" />}
                {modus === 'bretton' && beat === 1 && <Brikke key="b1" tekst="Juli 1944: 44 land" />}
                {modus === 'bretton' && beat === 2 && <Brikke key="b2" tekst="Hvordan skal verdens penger virke?" />}
                {modus === 'marshall' && beat === 0 && <Brikke key="m0" tekst="1948: Marshallhjelpen" />}
                {modus === 'marshall' && beat === 1 && <Brikke key="m1" tekst="13,2 milliarder dollar, 1948-1951" />}
                {modus === 'marshall' && beat === 2 && <Brikke key="m2" tekst="Norge: over 450 millioner dollar" />}
                {modus === 'marshall' && beat === 3 && <Brikke key="m3" tekst="Polen og Tsjekkoslovakia: Nei, under press" farge="rod" />}
                {modus === 'jernteppe' && beat === 2 && <Brikke key="j2" tekst="Lydige regjeringer, land etter land" farge="rod" />}
                {modus === 'jernteppe' && beat === 3 && <Brikke key="j3" tekst="Churchill, 1946: «et jernteppe»" />}
            </AnimatePresence>
        </div>
    );
}

/** Landene tegnes på nytt bare når fargene endrer seg. CSS glir mellom fargene. */
const Land = memo(function Land({
    geographies,
    sti,
    modus,
    beat,
}: {
    geographies: { id?: string | number }[];
    sti: GeoPath;
    modus: Modus;
    beat: number;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={fargeFor(modus, beat, Number(g.id))}
                    stroke={FARGE.kant}
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: 'fill 1.1s ease' }}
                />
            ))}
        </>
    );
});

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
    dy = 0,
    vis = true,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    dy?: number;
    vis?: boolean;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
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
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
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
                strokeWidth={5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -16 -10 L 4 0 L -16 10 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.5 }}
            />
        </g>
    );
}

function Nål({ pos, tekst, venstre }: { pos: [number, number]; tekst: string; venstre?: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <circle cx={pos[0]} cy={pos[1]} r={11} fill="#0f172a" stroke="#ffffff" strokeWidth={4} />
            <text
                x={pos[0] + (venstre ? -24 : 0)}
                y={pos[1] + (venstre ? 12 : -26)}
                textAnchor={venstre ? 'end' : 'middle'}
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Kryss({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
            stroke="#ffffff"
            strokeWidth={9}
            strokeLinecap="round"
        >
            <line x1={pos[0] - 18} y1={pos[1] - 18} x2={pos[0] + 18} y2={pos[1] + 18} />
            <line x1={pos[0] + 18} y1={pos[1] - 18} x2={pos[0] - 18} y2={pos[1] + 18} />
        </motion.g>
    );
}

/** Et lite hotell ved siden av nåla. */
function Hotell({ pos }: { pos: [number, number] }) {
    const [x, y] = [pos[0] + 60, pos[1] + 30];
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <rect x={x} y={y} width={160} height={70} fill="#f8fafc" stroke="#0f172a" strokeWidth={4} />
            <path d={`M ${x - 10} ${y} L ${x + 80} ${y - 40} L ${x + 170} ${y} Z`} fill="#b91c1c" stroke="#0f172a" strokeWidth={4} />
            {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={x + 14 + i * 37} y={y + 16} width={20} height={20} fill="#fbbf24" />
            ))}
            <rect x={x + 68} y={y + 44} width={24} height={26} fill="#0f172a" />
        </motion.g>
    );
}

/** Jernteppet: en tung, mørk linje som tegnes fra Stettin til Trieste. */
function Teppe({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const d = `M ${fra[0]} ${fra[1]} C ${fra[0] + 30} ${fra[1] + 120}, ${til[0] + 60} ${til[1] - 160}, ${til[0]} ${til[1]}`;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke="#ffffff"
                strokeWidth={22}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, ease: 'easeInOut' }}
            />
            <motion.path
                d={d}
                fill="none"
                stroke="#1f2937"
                strokeWidth={13}
                strokeLinecap="round"
                strokeDasharray="2 0"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, ease: 'easeInOut' }}
            />
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
