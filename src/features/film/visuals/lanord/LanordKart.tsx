import { memo, useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { LAG } from './felles';

/**
 * Kart til lånordfilmen. To moduser:
 *  - hansa:   de tyske kjøpmennene, nedertysk som handelsspråk, og et skip med ord til Norge
 *  - purisme: språkene som låner lite (islandsk, finsk, ungarsk) mot norsk
 *
 * Språkområder har ingen skarpe grenser, så de er tegnet som uskarpe skyer. Landene er dagens.
 */

type Modus = 'hansa' | 'purisme';
type LngLat = [number, number];
type XY = [number, number];

const B = 1600;
const H = 900;

const RAMME: Record<Modus, Utsnitt> = {
    hansa: [
        [-14, 47],
        [38, 66],
    ],
    purisme: [
        [-26, 40],
        [44, 71],
    ],
};

const ID = {
    norge: '578',
    tyskland: '276',
    island: '352',
    finland: '246',
    ungarn: '348',
};

const ORANSJE = LAG.hansa.farge;
const LILLA = '#7c3aed';

function lagProjeksjon(modus: Modus): GeoProjection {
    const [a, b] = RAMME[modus];
    return geoMercator().fitExtent(
        [
            [20, 20],
            [B - 20, H - 20],
        ],
        { type: 'MultiPoint', coordinates: [a, b] } as never
    );
}

function idAv(g: unknown) {
    return String((g as { id?: string | number }).id ?? '');
}

function landFarge(modus: Modus, beat: number, id: string) {
    const grunn = '#f3eee1';
    if (modus === 'hansa') {
        if (id === ID.norge && beat >= 3) return '#fecaca';
        return grunn;
    }
    if (beat >= 2 && (id === ID.island || id === ID.finland || id === ID.ungarn)) return '#ddd6fe';
    if (beat >= 3 && id === ID.norge) return '#fed7aa';
    return grunn;
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
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={landFarge(modus, beat, idAv(g))}
                    stroke="#a8a08a"
                    strokeWidth={1.2}
                    style={{ transition: 'fill 1.2s' }}
                />
            ))}
        </>
    );
});

function Merke({
    xy,
    tekst,
    farge = '#0f172a',
    storrelse = 40,
    anker = 'middle',
}: {
    xy: XY;
    tekst: string;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={xy[0]}
            y={xy[1]}
            textAnchor={anker}
            dominantBaseline="middle"
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Et lite handelsskip med ett seil, tegnet rundt (0, 0). */
function Skip({ farge = '#7c2d12', skala = 1 }: { farge?: string; skala?: number }) {
    return (
        <g transform={`scale(${skala})`}>
            <path
                d="M -34 0 L 34 0 L 24 18 L -24 18 Z"
                fill={farge}
                stroke="#fff"
                strokeWidth={3}
            />
            <line x1={0} y1={0} x2={0} y2={-52} stroke={farge} strokeWidth={4} />
            <path d="M 2 -48 L 30 -30 L 2 -8 Z" fill="#fef3c7" stroke={farge} strokeWidth={3} />
        </g>
    );
}

/* ---------- hansa ---------- */

/** Ruta fra Nordsjøkysten av Tyskland til vestkysten av Norge, langs havet. */
const RUTE: LngLat[] = [
    [8.2, 54.3],
    [7.2, 55.8],
    [6.2, 57.6],
    [4.6, 59.0],
    [4.6, 60.3],
];

const SKIP_PLASS: LngLat[] = [
    [5.5, 55.2],
    [14.5, 55.0],
    [19.5, 56.0],
];

function Hansa({ beat, pt, klipp }: { beat: number; pt: (ll: LngLat) => XY; klipp: string }) {
    const nord = pt([10.5, 53.4]);
    const stor = pt([14, 57]);
    const rute = RUTE.map(pt);
    const d = rute.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
    const mal = rute[rute.length - 1];
    return (
        <>
            <defs>
                <filter id="lk-sky" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={40} />
                </filter>
                <clipPath id="lk-tyskland">
                    <path d={klipp} />
                </clipPath>
            </defs>
            {/* Nedertysk i Nord-Tyskland */}
            <g clipPath="url(#lk-tyskland)">
                <motion.ellipse
                    cx={nord[0]}
                    cy={nord[1]}
                    rx={320}
                    ry={140}
                    fill={ORANSJE}
                    filter="url(#lk-sky)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 ? 0.75 : 0 }}
                    transition={{ duration: 1.2 }}
                />
            </g>
            {/* Handelsspråket i store deler av Nord-Europa */}
            <motion.ellipse
                cx={stor[0]}
                cy={stor[1]}
                rx={470}
                ry={250}
                fill={ORANSJE}
                filter="url(#lk-sky)"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 0.32 : 0 }}
                transition={{ duration: 1.4 }}
            />
            {/* Skip på havet */}
            {beat <= 2 &&
                SKIP_PLASS.map((ll, i) => {
                    const p = pt(ll);
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.3 }}
                        >
                            <g transform={`translate(${p[0]} ${p[1]})`}>
                                <Skip />
                            </g>
                        </motion.g>
                    );
                })}
            {beat >= 1 && (
                <Merke xy={pt([10.3, 52.0])} tekst="nedertysk" farge="#9a3412" storrelse={44} />
            )}
            {beat >= 3 && (
                <>
                    <motion.path
                        d={d}
                        fill="none"
                        stroke="#9a3412"
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2 }}
                    />
                    <motion.g
                        initial={{ x: rute[0][0], y: rute[0][1] }}
                        animate={{ x: mal[0], y: mal[1] }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                    >
                        <Skip skala={1.3} />
                    </motion.g>
                    <Merke xy={pt([10.5, 61.8])} tekst="Norge" farge="#991b1b" storrelse={42} />
                </>
            )}
        </>
    );
}

/* ---------- purisme ---------- */

function Purisme({ beat, pt }: { beat: number; pt: (ll: LngLat) => XY }) {
    return (
        <>
            {beat >= 2 && (
                <>
                    <Merke xy={pt([-18.5, 66.6])} tekst="islandsk" farge={LILLA} storrelse={40} />
                    <Merke xy={pt([26.5, 63.2])} tekst="finsk" farge={LILLA} storrelse={40} />
                    <Merke xy={pt([19.3, 46.0])} tekst="ungarsk" farge={LILLA} storrelse={40} />
                </>
            )}
            {beat >= 3 && (
                <Merke xy={pt([8.0, 61.2])} tekst="norsk" farge="#c2410c" storrelse={44} />
            )}
        </>
    );
}

/* ---------- kort ---------- */

function Kort({ children }: { children: ReactNode }) {
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: '4%' }}
        >
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl shadow-2xl text-center"
                style={{ background: 'rgba(255,255,255,0.95)', padding: '8px 26px' }}
            >
                {children}
            </motion.div>
        </div>
    );
}

function Tittel({ children, farge }: { children: ReactNode; farge: string }) {
    return (
        <div className="font-display font-black" style={{ fontSize: 32, color: farge }}>
            {children}
        </div>
    );
}

function Under({ children }: { children: ReactNode }) {
    return (
        <div className="font-semibold" style={{ fontSize: 20, color: '#475569' }}>
            {children}
        </div>
    );
}

function HansaKort({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <Kort key="0">
                    <Tittel farge="#9a3412">Hanseatene</Tittel>
                    <Under>
                        tyske kjøpmenn i Hansaforbundet, med mye av handelen i Nord-Europa
                    </Under>
                </Kort>
            )}
            {beat === 1 && (
                <Kort key="1">
                    <Tittel farge="#9a3412">Middelnedertysk</Tittel>
                    <Under>nedertysk: språket i Nord-Tyskland, også kalt plattysk</Under>
                </Kort>
            )}
            {beat === 2 && (
                <Kort key="2">
                    <Tittel farge="#9a3412">Et slags fellesspråk for handel</Tittel>
                    <Under>særlig stor framgang etter 1350</Under>
                </Kort>
            )}
            {beat >= 3 && (
                <Kort key="3">
                    <Tittel farge="#991b1b">Nye ord til norsk</Tittel>
                    <div className="flex justify-center" style={{ gap: 10, marginTop: 4 }}>
                        {['snekker', 'trøye'].map((o) => (
                            <span
                                key={o}
                                className="rounded-xl font-display font-black text-white"
                                style={{ background: ORANSJE, fontSize: 28, padding: '2px 14px' }}
                            >
                                {o}
                            </span>
                        ))}
                    </div>
                </Kort>
            )}
        </AnimatePresence>
    );
}

function PurismeKort({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <Kort key="0">
                    <Tittel farge="#1f2937">Låne, eller lage egne ord?</Tittel>
                    <Under>noen land vil heller lage nye ord av sine egne ord</Under>
                </Kort>
            )}
            {beat === 1 && (
                <Kort key="1">
                    <Tittel farge={LILLA}>Purisme = språkrensing</Tittel>
                    <Under>lage egne ord i stedet for å låne</Under>
                </Kort>
            )}
            {beat === 2 && (
                <Kort key="2">
                    <Tittel farge={LILLA}>Ganske få lånord</Tittel>
                    <Under>men mange oversettelseslån</Under>
                </Kort>
            )}
            {beat >= 3 && (
                <Kort key="3">
                    <Tittel farge="#c2410c">Norsk: lånt mye og ofte</Tittel>
                    <Under>og har blitt rikt på ord</Under>
                </Kort>
            )}
        </AnimatePresence>
    );
}

export function LanordKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'hansa';
    const { geographies } = useFilmVerden(RAMME[modus]);
    const p = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(p), [p]);
    const pt = (ll: LngLat) => p(ll) as XY;
    const tyskland = geographies
        .filter((g) => idAv(g) === ID.tyskland)
        .map((g) => sti(g as never) ?? '')
        .join(' ');

    return (
        <div className="absolute inset-0 bg-[#bcd9ea] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Land geographies={geographies} sti={sti} modus={modus} beat={beat} />
                {modus === 'hansa' && <Hansa beat={beat} pt={pt} klipp={tyskland} />}
                {modus === 'purisme' && <Purisme beat={beat} pt={pt} />}
            </svg>
            {modus === 'hansa' ? <HansaKort beat={beat} /> : <PurismeKort beat={beat} />}
            <div className="absolute right-[2.5%] bottom-[3%] px-3 py-1 rounded-lg bg-white/85 text-lg font-bold text-slate-600">
                {modus === 'hansa'
                    ? 'Omtrentlige språkområder. Landene er dagens'
                    : 'Landene er dagens'}
            </div>
        </div>
    );
}
