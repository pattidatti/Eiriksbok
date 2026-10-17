import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { geoCircle, geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld, type GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { frø } from './felles3d';

/**
 * Kart over Røros kobberverk. «sirkel»: circumferensen, sirkelen med radius 45,2 km rundt
 * gruva. «bonder»: gårdene i sirkelen som måtte jobbe for verket. «femunden»: skogen som ble
 * hugget ut, og den nye smeltehytta ved Femunden. «veier»: Vinterleden til Falun og kobberet
 * til Trondheim og Amsterdam. «verdensarv»: byen i 1980, hele sirkelen i 2010.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'sirkel' | 'bonder' | 'femunden' | 'veier' | 'verdensarv';

const ROROS: LngLat = [11.385, 62.574];
const GRUVA: LngLat = [11.55, 62.63];
const FEMUNDSHYTTA: LngLat = [11.84, 62.34];
const FALUN: LngLat = [15.63, 60.607];
const TRONDHEIM: LngLat = [10.395, 63.43];
const AMSTERDAM: LngLat = [4.9, 52.37];

/** Radius i grader bue: 45,2 km og 25 km. */
const R_SIRKEL = 45.2 / 111.2;
const R_HOGST = 25 / 111.2;

/** Femunden, forenklet. */
const FEMUNDEN: LngLat[] = [
    [11.78, 62.39],
    [11.86, 62.37],
    [11.94, 62.27],
    [12.02, 62.14],
    [12.12, 62.02],
    [12.2, 61.93],
    [12.13, 61.91],
    [12.03, 62.0],
    [11.95, 62.12],
    [11.87, 62.24],
    [11.79, 62.33],
];

/** Vinterleden, grovt: langs Femunden og ned gjennom Dalarna til Falun. */
const VINTERLEDEN: LngLat[] = [
    ROROS,
    [11.85, 62.3],
    [12.15, 61.95],
    [12.7, 61.72],
    [13.3, 61.45],
    [14.0, 61.15],
    [14.6, 60.95],
    [15.1, 60.75],
    FALUN,
];

/** Kobberet ut: til Trondheim, så sjøveien til Amsterdam. */
const KOBBERVEIEN: LngLat[] = [
    ROROS,
    [10.9, 62.95],
    TRONDHEIM,
    [9.6, 63.75],
    [7.6, 63.3],
    [5.0, 62.3],
    [4.2, 60.5],
    [4.6, 57.5],
    [5.6, 54.5],
    AMSTERDAM,
];

/** Gårder spredt i sirkelen, unna selve gruva. */
const GARDER: LngLat[] = Array.from({ length: 46 }, (_, i) => {
    const r = R_SIRKEL * (0.28 + Math.sqrt(frø(i + 40)) * 0.66);
    const a = frø(i + 80) * Math.PI * 2;
    return [GRUVA[0] + (Math.cos(a) * r) / Math.cos((GRUVA[1] * Math.PI) / 180), GRUVA[1] + Math.sin(a) * r];
});

/** Skog utenfor hogstringen. */
const SKOG: LngLat[] = Array.from({ length: 90 }, (_, i) => {
    const r = R_HOGST * 1.15 + frø(i + 900) * R_SIRKEL * 1.4;
    const a = frø(i + 1200) * Math.PI * 2;
    return [ROROS[0] + (Math.cos(a) * r) / 0.46, ROROS[1] + Math.sin(a) * r];
});

interface Utsnitt {
    sv: LngLat;
    no: LngLat;
}
const NAER: Utsnitt = { sv: [10.3, 62.05], no: [12.75, 63.15] };
const REGION: Utsnitt = { sv: [9.3, 60.3], no: [16.6, 63.8] };

function utsnittFor(modus: Modus, beat: number): Utsnitt {
    if (modus === 'bonder' && beat >= 3) return { sv: [4.5, 58], no: [20, 66] };
    if (modus === 'femunden') return { sv: [10.4, 61.8], no: [12.9, 63.0] };
    if (modus === 'veier') {
        if (beat <= 1) return NAER;
        if (beat <= 3) return REGION;
        return { sv: [-1, 51.2], no: [19, 66.3] };
    }
    if (modus === 'verdensarv' && beat <= 1) return { sv: [10.6, 62.3], no: [12.2, 62.85] };
    return NAER;
}

interface Vindu {
    x: number;
    y: number;
    w: number;
}

export function RorosKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'sirkel';
    const { geographies } = useAtlasWorld();

    // Ett fast grunnkart over Nord-Europa. Utsnittet flyttes ved å skalere hele kartet.
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [B, H],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-2, 50],
                        [20, 66.5],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];

    const vinduFor = (u: Utsnitt): Vindu => {
        const a = p(u.sv);
        const b = p(u.no);
        const w = Math.max(Math.abs(b[0] - a[0]), (Math.abs(b[1] - a[1]) * B) / H);
        return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, w };
    };

    const mål = vinduFor(utsnittFor(modus, beat));
    const [vindu, setVindu] = useState<Vindu>(mål);
    const naa = useRef(vindu);
    useEffect(() => {
        const fra = naa.current;
        if (fra.x === mål.x && fra.y === mål.y && fra.w === mål.w) return;
        const c = animate(0, 1, {
            duration: playing ? 2.6 : 0.01,
            ease: 'easeInOut',
            onUpdate: (k) => {
                // Bredden interpoleres logaritmisk, så zoomen føles jevn.
                const w = Math.exp(Math.log(fra.w) + (Math.log(mål.w) - Math.log(fra.w)) * k);
                const ny = { x: fra.x + (mål.x - fra.x) * k, y: fra.y + (mål.y - fra.y) * k, w };
                naa.current = ny;
                setVindu(ny);
            },
        });
        return () => c.stop();
         
    }, [mål.x, mål.y, mål.w, playing]);

    const kk = B / vindu.w;
    const kartTransform = `translate(${B / 2} ${H / 2}) scale(${kk}) translate(${-vindu.x} ${-vindu.y})`;
    const skjerm = (ll: LngLat) => {
        const [x, y] = p(ll);
        return `translate(${B / 2 + (x - vindu.x) * kk} ${H / 2 + (y - vindu.y) * kk})`;
    };

    const sirkel = useMemo(() => sti(geoCircle().center(GRUVA).radius(R_SIRKEL)()) ?? '', [sti]);
    const hogst = useMemo(() => sti(geoCircle().center(ROROS).radius(R_HOGST)()) ?? '', [sti]);
    const linje = (pts: LngLat[]) => `M ${pts.map((ll) => p(ll).join(' ')).join(' L ')}`;
    const femunden = useMemo(() => `${linje(FEMUNDEN)} Z`, []); // eslint-disable-line react-hooks/exhaustive-deps

    const visSirkel =
        (modus === 'sirkel' && beat >= 1) ||
        modus === 'bonder' ||
        modus === 'femunden' ||
        modus === 'veier' ||
        (modus === 'verdensarv' && beat >= 2);
    const arv = modus === 'verdensarv';

    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    return (
        <div className="absolute inset-0 bg-[#bcd4e4] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <g transform={kartTransform}>
                    <Land geographies={geographies} sti={sti} />
                    <path d={femunden} fill="#8fb8d6" stroke="#5f8fb3" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                    {modus === 'femunden' && (
                        <motion.path
                            d={hogst}
                            fill="#a8a29e"
                            fillOpacity={0.55}
                            stroke="#57534e"
                            strokeWidth={3}
                            strokeDasharray="10 8"
                            vectorEffect="non-scaling-stroke"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )}
                    {visSirkel && (
                        <motion.path
                            d={sirkel}
                            fill={arv && beat >= 2 ? '#eab308' : '#b45309'}
                            fillOpacity={arv ? 0.35 : modus === 'sirkel' && beat >= 2 ? 0.22 : 0.08}
                            stroke={arv ? '#a16207' : '#9a3412'}
                            strokeWidth={5 / kk}
                            initial={{ pathLength: modus === 'sirkel' ? 0 : 1 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 2.4 : 0 }}
                        />
                    )}
                    {modus === 'veier' && beat >= 2 && (
                        <motion.path
                            d={linje(VINTERLEDEN)}
                            fill="none"
                            stroke="#1e3a8a"
                            strokeWidth={6 / kk}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: beat === 2 ? 0 : 1 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 3 : 0 }}
                        />
                    )}
                    {modus === 'verdensarv' && beat >= 2 && (
                        <path
                            d={linje(VINTERLEDEN.slice(0, 4))}
                            fill="none"
                            stroke="#a16207"
                            strokeWidth={6}
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                    {modus === 'veier' && beat >= 4 && (
                        <motion.path
                            d={linje(KOBBERVEIEN)}
                            fill="none"
                            stroke="#b45309"
                            strokeWidth={6 / kk}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 3.4 : 0, delay: playing ? 1.4 : 0 }}
                        />
                    )}
                </g>

                {/* Skog: i «femunden» står den bare utenfor hogstringen, og tetter seg rundt Femunden. */}
                {modus === 'femunden' &&
                    SKOG.map((ll, i) => (
                        <g key={i} transform={skjerm(ll)}>
                            <Gran />
                        </g>
                    ))}
                {modus === 'femunden' &&
                    beat >= 1 &&
                    Array.from({ length: 18 }, (_, i) => {
                        const ll: LngLat = [
                            12.05 + (frø(i + 77) - 0.5) * 0.5,
                            62.15 + (frø(i + 99) - 0.5) * 0.35,
                        ];
                        return (
                            <motion.g key={`f${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transform={skjerm(ll)}>
                                <Gran />
                            </motion.g>
                        );
                    })}

                {/* Gårdene i sirkelen */}
                {modus === 'bonder' &&
                    beat <= 2 &&
                    GARDER.map((ll, i) => (
                        <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                            <g transform={skjerm(ll)}>
                                {beat >= 1 && <Frakt fra={ll} til={ROROS} skjermPunkt={(x) => tilSkjerm(x, proj, vindu, kk)} i={i} playing={playing} />}
                                <Gaard />
                            </g>
                        </motion.g>
                    ))}
                {modus === 'bonder' && beat === 2 && (
                    <Stempel tekst="PLIKTARBEID" under="betalt, men ingen kunne si nei" />
                )}

                {/* Malm til skogen */}
                {modus === 'femunden' && beat >= 2 && (
                    <Pil fra={tilSkjerm(GRUVA, proj, vindu, kk)} til={tilSkjerm(FEMUNDSHYTTA, proj, vindu, kk)} farge="#9a3412" tekst="malm til skogen" />
                )}

                {/* Sleder på vidda */}
                {modus === 'veier' && beat <= 1 && <Sleder sentrum={tilSkjerm(ROROS, proj, vindu, kk)} playing={playing} />}

                {/* Merker */}
                {modus !== 'verdensarv' || beat <= 1 ? (
                    <g transform={skjerm(ROROS)}>
                        <circle r={arv ? 22 : 13} fill="#0f172a" stroke="#fff" strokeWidth={4} />
                        {arv ? <Etikett tekst="Røros" dy={180} /> : <Etikett tekst="Røros" x={-22} dy={10} anker="end" />}
                    </g>
                ) : null}
                {arv && beat <= 1 && (
                    <g transform={skjerm(ROROS)}>
                        {BYHUS.map(([x, y], i) => (
                            <g key={i} transform={`translate(${x} ${y})`}>
                                <Gaard />
                            </g>
                        ))}
                        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }}>
                            <circle r={130} fill="#eab308" fillOpacity={0.15} stroke="#a16207" strokeWidth={8} strokeDasharray="18 10" />
                            <Etikett tekst="UNESCO 1980" dy={-150} farge="#a16207" />
                        </motion.g>
                    </g>
                )}
                {(modus === 'sirkel' || (modus === 'bonder' && beat <= 2) || modus === 'femunden') && (
                    <g transform={skjerm(GRUVA)}>
                        <Gruvemerke />
                        <Etikett tekst="Storwartz" x={24} dy={-18} anker="start" />
                    </g>
                )}
                {((modus === 'femunden' && beat >= 1) || (arv && beat >= 2)) && (
                    <motion.g transform={skjerm(FEMUNDSHYTTA)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect x={-14} y={-14} width={28} height={28} fill="#3b2a20" stroke="#fff" strokeWidth={4} />
                        <Etikett tekst={modus === 'femunden' ? 'Femundshytta, 1743' : 'Femundshytta'} x={24} dy={10} anker="start" />
                    </motion.g>
                )}
                {(modus === 'femunden' || (modus === 'sirkel' && beat >= 1)) && (
                    <g transform={skjerm([12.1, 62.05])}>
                        <Etikett tekst="Femunden" x={26} dy={0} anker="start" farge="#1e40af" />
                    </g>
                )}
                {modus === 'sirkel' && beat >= 1 && (
                    <Radius
                        fra={tilSkjerm(GRUVA, proj, vindu, kk)}
                        til={tilSkjerm([GRUVA[0] + R_SIRKEL / Math.cos((GRUVA[1] * Math.PI) / 180), GRUVA[1]], proj, vindu, kk)}
                    />
                )}
                {modus === 'sirkel' && beat >= 2 && <Rettigheter />}
                {modus === 'veier' && beat >= 2 && (
                    <g transform={skjerm(FALUN)}>
                        <circle r={13} fill="#1e3a8a" stroke="#fff" strokeWidth={4} />
                        <Etikett tekst="Falun" x={22} dy={10} anker="start" />
                    </g>
                )}
                {modus === 'veier' && beat >= 2 && beat <= 3 && (
                    <g transform={skjerm([13.6, 61.55])}>
                        <Etikett tekst="Vinterleden" x={20} dy={-16} anker="start" farge="#1e3a8a" />
                    </g>
                )}
                {modus === 'veier' && beat === 3 && <Fakta x={1080} linjer={['85 mil tur-retur', 'over seks uker']} />}
                {((modus === 'veier' && beat >= 4) || (modus === 'sirkel' && beat === 0)) && (
                    <g transform={skjerm(TRONDHEIM)}>
                        <circle r={11} fill="#b45309" stroke="#fff" strokeWidth={4} />
                        <Etikett tekst="Trondheim" x={-20} dy={-16} anker="end" />
                    </g>
                )}
                {modus === 'veier' && beat >= 4 && (
                    <motion.g transform={skjerm(AMSTERDAM)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: playing ? 3.5 : 0 }}>
                        <circle r={14} fill="#b45309" stroke="#fff" strokeWidth={4} />
                        <Etikett tekst="Amsterdam" x={22} dy={10} anker="start" />
                    </motion.g>
                )}
                {arv && beat >= 2 && <Fakta x={60} linjer={['2010: hele sirkelen', 'rundt 5000 km²']} />}
                {(modus === 'bonder' && beat >= 3) || (modus === 'veier' && beat >= 2) ? (
                    <>
                        <g transform={skjerm([8.6, 61.2])}>
                            <Etikett tekst="NORGE" dy={0} farge="#78716c" />
                        </g>
                        {!(modus === 'veier' && beat >= 4) && (
                            <g transform={skjerm([15.2, 62.6])}>
                                <Etikett tekst="SVERIGE" dy={0} farge="#78716c" />
                            </g>
                        )}
                    </>
                ) : (
                    !(arv && beat <= 1) && (
                        <>
                            <g transform={skjerm([10.75, 62.95])}>
                                <Etikett tekst="NORGE" dy={0} farge="#a8a29e" />
                            </g>
                            <g transform={skjerm([12.6, 62.95])}>
                                <Etikett tekst="SVERIGE" dy={0} farge="#a8a29e" />
                            </g>
                        </>
                    )
                )}
            </svg>
            <AnimatePresence mode="wait">
                {overskrift && (
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const OVERSKRIFTER: Record<Modus, (string | null)[]> = {
    sirkel: ['1646: Irgens tar over', 'En sirkel rundt gruva', 'Verket velger først', 'Circumferensen = omkrets'],
    bonder: ['Bøndene i sirkelen', 'Frakte varer, brenne trekull', 'Pliktarbeid', 'Flere bergverk gjorde det samme'],
    femunden: ['Skogen er hugget ut', '1743: ny smeltehytte', 'Malmen flytter til skogen'],
    veier: ['Kjørekarene', 'Over frosne vann og myrer', 'Vinterleden til Falun', 'Lang vei', 'Kobberet til Amsterdam'],
    verdensarv: ['1980: verdensarv', 'Vernet for alle mennesker', 'Et helt landskap'],
};

function tilSkjerm(ll: LngLat, proj: (ll: LngLat) => [number, number] | null, vindu: Vindu, kk: number): [number, number] {
    const [x, y] = proj(ll) as [number, number];
    return [B / 2 + (x - vindu.x) * kk, H / 2 + (y - vindu.y) * kk];
}

function Radius({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    return (
        <g>
            <line x1={fra[0]} y1={fra[1]} x2={til[0]} y2={til[1]} stroke="#9a3412" strokeWidth={5} strokeDasharray="10 7" />
            <Etikett tekst="45 km" x={(fra[0] + til[0]) / 2 + 30} dy={fra[1] + 44} farge="#9a3412" />
        </g>
    );
}

/** Husene i bergstaden, rundt Røros-prikken. */
const BYHUS: [number, number][] = Array.from({ length: 14 }, (_, i) => [
    Math.cos(i * 2.4) * (40 + (i % 4) * 16),
    Math.sin(i * 2.4) * (30 + (i % 3) * 14) + 8,
]);

const Land = memo(function Land({ geographies, sti }: { geographies: GeoFeature[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={String(g.id) === '578' ? '#f3ead6' : String(g.id) === '752' ? '#e8e3d3' : '#ece6d6'}
                    stroke="#a8a08a"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </>
    );
});

function Gran() {
    return <path d="M 0 -18 L 10 6 L -10 6 Z" fill="#2f5a3a" stroke="#f3ead6" strokeWidth={1.5} />;
}

function Gaard() {
    return (
        <g>
            <rect x={-9} y={-6} width={18} height={12} fill="#7a4a2a" stroke="#fff" strokeWidth={2} />
            <path d="M -11 -6 L 0 -14 L 11 -6 Z" fill="#4d5a3a" stroke="#fff" strokeWidth={2} />
        </g>
    );
}

function Gruvemerke() {
    return (
        <g>
            <circle r={18} fill="#9a3412" stroke="#fff" strokeWidth={4} />
            <path d="M -8 8 L 8 -8 M -9 -3 L -3 -9 M 3 9 L 9 3" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        </g>
    );
}

/** Animert prikk fra en gård inn mot smeltehytta. Tegnes i gårdens lokale koordinater. */
function Frakt({
    fra,
    til,
    skjermPunkt,
    i,
    playing,
}: {
    fra: LngLat;
    til: LngLat;
    skjermPunkt: (ll: LngLat) => [number, number];
    i: number;
    playing: boolean;
}) {
    const a = skjermPunkt(fra);
    const b = skjermPunkt(til);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return (
        <>
            <line x1={0} y1={0} x2={dx} y2={dy} stroke="#9a3412" strokeOpacity={0.35} strokeWidth={2} />
            <motion.circle
                r={5}
                fill={i % 2 ? '#1c1917' : '#9a3412'}
                initial={{ cx: 0, cy: 0 }}
                animate={playing ? { cx: [0, dx], cy: [0, dy] } : { cx: dx * 0.5, cy: dy * 0.5 }}
                transition={{ duration: 3 + frø(i) * 2, repeat: playing ? Infinity : 0, delay: frø(i + 5) * 2 }}
            />
        </>
    );
}

function Pil({ fra, til, farge, tekst }: { fra: [number, number]; til: [number, number]; farge: string; tekst: string }) {
    const mx = (fra[0] + til[0]) / 2 + 60;
    const my = (fra[1] + til[1]) / 2;
    const vinkel = Math.atan2(til[1] - my, til[0] - mx);
    const spiss = [til[0] - Math.cos(vinkel) * 26, til[1] - Math.sin(vinkel) * 26];
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${spiss[0]} ${spiss[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8 }}
            />
            <polygon
                points="0,-16 30,0 0,16"
                fill={farge}
                transform={`translate(${spiss[0]} ${spiss[1]}) rotate(${(vinkel * 180) / Math.PI})`}
            />
            <Etikett tekst={tekst} x={mx + 30} dy={my} anker="start" farge={farge} />
        </g>
    );
}

function Sleder({ sentrum, playing }: { sentrum: [number, number]; playing: boolean }) {
    const ruter = [
        { fra: [sentrum[0] + 520, sentrum[1] + 300], i: 0 },
        { fra: [sentrum[0] - 480, sentrum[1] + 260], i: 1 },
        { fra: [sentrum[0] + 300, sentrum[1] - 280], i: 2 },
        { fra: [sentrum[0] + 200, sentrum[1] + 380], i: 3 },
    ];
    return (
        <>
            {ruter.map((r) => (
                <g key={r.i}>
                    <line x1={r.fra[0]} y1={r.fra[1]} x2={sentrum[0]} y2={sentrum[1]} stroke="#475569" strokeWidth={4} strokeDasharray="4 10" strokeLinecap="round" />
                    <motion.g
                        initial={{ x: r.fra[0], y: r.fra[1] }}
                        animate={
                            playing
                                ? { x: [r.fra[0], sentrum[0]], y: [r.fra[1], sentrum[1]] }
                                : { x: (r.fra[0] + sentrum[0]) / 2, y: (r.fra[1] + sentrum[1]) / 2 }
                        }
                        transition={{ duration: 7, repeat: playing ? Infinity : 0, delay: r.i * 1.3, ease: 'linear' }}
                    >
                        <circle r={16} fill="#5a3a24" stroke="#fff" strokeWidth={4} />
                    </motion.g>
                </g>
            ))}
        </>
    );
}

function Rettigheter() {
    const ting = ['Mineraler', 'Skog', 'Elver og vann'];
    return (
        <g transform="translate(1200 330)">
            {ting.map((t, i) => (
                <motion.g key={t} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}>
                    <rect x={0} y={i * 92} width={330} height={72} rx={18} fill="#ffffff" fillOpacity={0.95} stroke="#9a3412" strokeWidth={3} />
                    <text x={165} y={i * 92 + 48} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a">
                        {t}
                    </text>
                </motion.g>
            ))}
        </g>
    );
}

function Stempel({ tekst, under }: { tekst: string; under: string }) {
    return (
        <motion.g initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: '1220px', originY: '700px' }}>
            <g transform="rotate(-6 1220 700)">
                <rect x={960} y={640} width={520} height={100} rx={14} fill="#ffffff" fillOpacity={0.9} stroke="#b91c1c" strokeWidth={8} />
                <text x={1220} y={712} textAnchor="middle" fontSize={62} fontWeight={900} fill="#b91c1c">
                    {tekst}
                </text>
            </g>
            <Etikett tekst={under} x={1220} dy={800} />
        </motion.g>
    );
}

function Fakta({ linjer, x }: { linjer: string[]; x: number }) {
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <rect x={x} y={600} width={460} height={60 + linjer.length * 58} rx={22} fill="#ffffff" fillOpacity={0.95} />
            {linjer.map((l, i) => (
                <text key={l} x={x + 230} y={672 + i * 58} textAnchor="middle" fontSize={i === 0 ? 44 : 38} fontWeight={i === 0 ? 900 : 700} fill="#0f172a">
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

function Etikett({
    tekst,
    dy,
    x = 0,
    farge = '#0f172a',
    anker = 'middle',
}: {
    tekst: string;
    dy: number;
    x?: number;
    farge?: string;
    anker?: 'middle' | 'end' | 'start';
}) {
    return (
        <text
            x={x}
            y={dy}
            textAnchor={anker}
            fontSize={34}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
