import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartet over den iranske revolusjonen, i seks modus:
 * «flukt»: sjahen flyr ut av Teheran, et annet fly lander, og folkemengden fyller gatene.
 * «eksil»: Khomeini i eksil, først i Irak og så utenfor Paris.
 * «opprør»: 1978. Byene tennes én etter én, oljefeltene streiker og basarene stenger.
 * «hjemkomst»: flyet fra Paris til Teheran, og fem millioner i gatene.
 * «krig»: Irak invaderer Iran, og nabolandene velger side.
 * «splittelse»: sunni-dominerte land mot sjia-Iran, og konfliktene i dag.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'flukt' | 'eksil' | 'opprør' | 'hjemkomst' | 'krig' | 'splittelse';

const IRAN = 364;
const IRAK = 368;
const SAUDI = 682;
const FRANKRIKE = 250;
const STØTTER_IRAK = [SAUDI, 414, 400, 784, 634, 818];

const STED = {
    teheran: [51.4, 35.7] as LngLat,
    paris: [2.35, 48.85] as LngLat,
    najaf: [44.3, 32.0] as LngLat,
    bagdad: [44.4, 33.3] as LngLat,
    jemen: [47.5, 15.5] as LngLat,
    syria: [38.5, 35.0] as LngLat,
    libanon: [35.9, 33.9] as LngLat,
};

/** Omtrentlige byer i Iran. Bare prikker, ingen navn utenom Teheran. */
const BYER: LngLat[] = [
    [50.9, 34.6],
    [51.4, 35.7],
    [51.7, 32.7],
    [46.3, 38.1],
    [59.6, 36.3],
    [52.5, 29.6],
    [48.7, 31.3],
    [47.1, 34.3],
    [49.6, 37.3],
    [57.1, 30.3],
    [54.4, 31.9],
    [48.5, 34.8],
    [60.9, 29.5],
    [45.1, 37.5],
    [56.3, 27.2],
];
const OLJEFELT: LngLat[] = [
    [47.4, 32.6],
    [49.8, 30.4],
    [52.6, 28.0],
];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    iran: '#16a34a',
    iranLys: '#bbf7d0',
    irak: '#b91c1c',
    stotte: '#fca5a5',
    sunni: '#2563eb',
    sjia: '#16a34a',
    frankrike: '#a5b4fc',
    gull: '#ca8a04',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat) =>
        geoMercator().fitExtent(
            [
                [60, 60],
                [B - 60, H - 60],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    if (modus === 'flukt' || modus === 'opprør') return utsnitt([36, 23], [66, 41]);
    if (modus === 'eksil' || modus === 'hjemkomst') return utsnitt([-6, 26], [62, 54]);
    return utsnitt([29, 9], [66, 44]);
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'flukt':
        case 'opprør':
            return id === IRAN ? FARGE.iranLys : FARGE.land;
        case 'eksil':
            if (id === IRAN) return FARGE.iran;
            if (beat >= 2 && id === IRAK) return '#fde68a';
            if (beat >= 2 && id === FRANKRIKE) return FARGE.frankrike;
            return FARGE.land;
        case 'hjemkomst':
            if (id === IRAN) return FARGE.iran;
            if (id === FRANKRIKE) return FARGE.frankrike;
            return FARGE.land;
        case 'krig':
            if (id === IRAN) return FARGE.iran;
            if (id === IRAK) return FARGE.irak;
            if (beat >= 2 && STØTTER_IRAK.includes(id)) return FARGE.stotte;
            return FARGE.land;
        case 'splittelse':
            if (beat >= 1 && (id === IRAK || id === SAUDI)) return FARGE.sunni;
            if (beat >= 2 && id === IRAN) return FARGE.sjia;
            return FARGE.land;
    }
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    flukt: [
        { tekst: 'Teheran, januar 1979' },
        { tekst: 'Sjahen flykter', rod: true },
        { tekst: 'Et annet fly lander' },
        { tekst: 'Millioner i gatene' },
    ],
    eksil: [
        { tekst: 'Ayatollah Khomeini' },
        { tekst: 'Eksil: utenfor hjemlandet' },
        { tekst: 'Først Irak, så Frankrike' },
        { tekst: 'Ufarlig så langt unna?' },
    ],
    opprør: [
        { tekst: '1978: uroen starter' },
        { tekst: 'Fra by til by', rod: true },
        { tekst: 'Oljearbeiderne streiker', rod: true },
        { tekst: 'Basarene stenger', rod: true },
    ],
    hjemkomst: [
        { tekst: '1. februar 1979' },
        { tekst: 'Over fem millioner i gatene' },
        { tekst: '14 år i eksil. Hva føler du?' },
        { tekst: '«Ingenting.»', rod: true },
    ],
    krig: [
        { tekst: 'September 1980: Irak invaderer', rod: true },
        { tekst: 'Iraks frykt: revolusjonen sprer seg' },
        { tekst: 'Hvem støtter Irak?' },
        { tekst: 'Åtte år med krig', rod: true },
    ],
    splittelse: [
        { tekst: 'To retninger i islam' },
        { tekst: 'Sunni-styrte land' },
        { tekst: 'Sjia: Iran' },
        { tekst: 'Striden lever i dag', rod: true },
    ],
};

export function IranKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'flukt';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    const teh = p(STED.teheran);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />

                {modus === 'flukt' && (
                    <>
                        <Etikett pos={p([55, 31.5])} tekst="Iran" farge="#14532d" stor />
                        <By pos={teh} navn="Teheran" />
                        {beat === 0 && <Koffert pos={[teh[0] + 70, teh[1] + 70]} />}
                        {beat === 1 && (
                            <Fly fra={teh} til={p([33, 39])} farge="#7f1d1d" bue={-0.12} />
                        )}
                        {beat === 1 && (
                            <Etikett
                                pos={p([44, 31])}
                                tekst="Han kommer aldri tilbake"
                                farge="#7f1d1d"
                                forsinkelse={1.6}
                            />
                        )}
                        {beat === 2 && (
                            <Fly fra={p([33, 40])} til={teh} farge="#14532d" bue={0.12} />
                        )}
                        {beat >= 3 && (
                            <Folkemengde
                                pos={[teh[0] + 20, teh[1] + 120]}
                                antall={140}
                                radius={150}
                            />
                        )}
                    </>
                )}

                {modus === 'eksil' && (
                    <>
                        <Etikett pos={p([55, 31])} tekst="Iran" farge="#14532d" stor />
                        <By pos={teh} navn="Teheran" />
                        {beat === 1 && (
                            <Etikett
                                pos={p([42, 28.5])}
                                tekst="Kritiker siden 1960-tallet"
                                farge="#14532d"
                                forsinkelse={0.4}
                            />
                        )}
                        {beat >= 2 && (
                            <>
                                <Pil fra={teh} til={p(STED.najaf)} farge="#92400e" bue={0.2} />
                                <Etikett
                                    pos={p([42, 29])}
                                    tekst="Irak"
                                    farge="#92400e"
                                    forsinkelse={1.2}
                                />
                                <Pil
                                    fra={p(STED.najaf)}
                                    til={p(STED.paris)}
                                    farge="#3730a3"
                                    bue={-0.15}
                                    forsinkelse={1.8}
                                />
                                <By pos={p(STED.paris)} navn="Paris" forsinkelse={3.2} />
                            </>
                        )}
                        {beat >= 3 && <Avstand fra={p(STED.paris)} til={teh} />}
                    </>
                )}

                {modus === 'opprør' && (
                    <>
                        <Etikett pos={p([55.5, 33.5])} tekst="Iran" farge="#14532d" stor />
                        {BYER.map((b, i) => (
                            <Uro
                                key={i}
                                pos={p(b)}
                                aktiv={beat >= 1 || i === 0}
                                forsinkelse={beat === 1 ? i * 0.18 : 0}
                            />
                        ))}
                        <By pos={teh} navn="Teheran" />
                        {beat >= 2 &&
                            OLJEFELT.map((o, i) => (
                                <Oljetårn key={i} pos={p(o)} forsinkelse={0.3 + i * 0.25} />
                            ))}
                        {beat >= 3 &&
                            [BYER[2], BYER[4], BYER[3], BYER[9]].map((b, i) => (
                                <Basar key={i} pos={p(b)} forsinkelse={0.3 + i * 0.3} />
                            ))}
                    </>
                )}

                {modus === 'hjemkomst' && (
                    <>
                        <Etikett pos={p([58.5, 34])} tekst="Iran" farge="#14532d" stor />
                        <By pos={p(STED.paris)} navn="Paris" />
                        <By pos={teh} navn="Teheran" />
                        <Fly
                            fra={p(STED.paris)}
                            til={teh}
                            farge="#14532d"
                            bue={-0.12}
                            varighet={beat === 0 ? 3.2 : 0.01}
                        />
                        {beat >= 1 && (
                            <Folkemengde
                                pos={[teh[0] + 10, teh[1] + 150]}
                                antall={160}
                                radius={95}
                            />
                        )}
                        {beat >= 2 && <Tidslinje fra={p([5, 40])} />}
                    </>
                )}

                {modus === 'krig' && (
                    <>
                        <Etikett pos={p([55, 32])} tekst="Iran" farge="#14532d" stor />
                        <Etikett pos={p([43.5, 33.5])} tekst="Irak" farge="#7f1d1d" stor />
                        {beat === 0 && (
                            <Etikett
                                pos={p([42.5, 31])}
                                tekst="Saddam Hussein"
                                farge="#7f1d1d"
                                dy={30}
                                forsinkelse={1.6}
                            />
                        )}
                        {beat !== 1 && (
                            <Pil
                                fra={p([44, 32.5])}
                                til={p([50, 33.5])}
                                farge="#7f1d1d"
                                bue={0.1}
                            />
                        )}
                        {beat === 1 && (
                            <Pil
                                fra={p([51, 34.5])}
                                til={p([44.5, 32])}
                                farge="#15803d"
                                bue={-0.15}
                            />
                        )}
                        {beat === 2 && (
                            <Merke
                                pos={p([37, 38])}
                                tekst="Irak bruker giftgass"
                                farge="#7f1d1d"
                                forsinkelse={2}
                            />
                        )}
                        {beat === 1 && <Bølge pos={teh} til={p(STED.bagdad)} />}
                        {beat >= 2 && (
                            <Etikett
                                pos={p([44.5, 23.5])}
                                tekst="Saudi-Arabia"
                                farge="#7f1d1d"
                                forsinkelse={0.4}
                            />
                        )}
                        {beat >= 2 && (
                            <Merke
                                pos={p([36, 15])}
                                tekst="USA støtter også Irak"
                                forsinkelse={1.2}
                            />
                        )}
                        {beat >= 3 && <Krigsår pos={p([63.5, 21])} />}
                    </>
                )}

                {modus === 'splittelse' && (
                    <>
                        <Etikett pos={p([55, 32])} tekst="Iran" farge="#14532d" stor />
                        <Etikett pos={p([43.5, 33.5])} tekst="Irak" farge="#1e3a8a" />
                        <Etikett pos={p([45, 23.5])} tekst="Saudi-Arabia" farge="#1e3a8a" />
                        {beat === 0 && (
                            <>
                                <Merke
                                    pos={p([38, 15])}
                                    tekst="Sunni"
                                    farge={FARGE.sunni}
                                    forsinkelse={0.4}
                                />
                                <Merke
                                    pos={p([60, 15])}
                                    tekst="Sjia"
                                    farge={FARGE.sjia}
                                    forsinkelse={0.9}
                                />
                            </>
                        )}
                        {beat >= 1 && (
                            <Merke pos={p([38, 15])} tekst="Sunni-styrt" farge={FARGE.sunni} />
                        )}
                        {beat >= 2 && (
                            <Merke pos={p([63, 29])} tekst="Største sjia-land" farge={FARGE.sjia} />
                        )}
                        {beat >= 3 &&
                            (
                                [
                                    [STED.jemen, 'Jemen', -46],
                                    [STED.syria, 'Syria', -46],
                                    [STED.libanon, 'Libanon', 50],
                                ] as [LngLat, string, number][]
                            ).map(([s, n, dy], i) => (
                                <Konflikt
                                    key={n}
                                    pos={p(s)}
                                    navn={n}
                                    dy={dy}
                                    forsinkelse={i * 0.5}
                                />
                            ))}
                    </>
                )}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
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
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    dy?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
            x={pos[0]}
            y={pos[1] + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 60 : 40}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function By({
    pos,
    navn,
    forsinkelse = 0,
}: {
    pos: [number, number];
    navn: string;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
        >
            <circle
                cx={pos[0]}
                cy={pos[1]}
                r={13}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={5}
            />
            <text
                x={pos[0]}
                y={pos[1] - 32}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </motion.g>
    );
}

/** Buet linje med pilspiss som tegnes fram. */
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
                strokeWidth={9}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -24 -16 L 8 0 L -24 16 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
            />
        </g>
    );
}

/** Et fly som følger en stiplet bue. Posisjonen regnes ut i JS, ikke som transform på <g>. */
function Fly({
    fra,
    til,
    farge,
    bue = 0.15,
    varighet = 3,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    bue?: number;
    varighet?: number;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const [u, setU] = useState(0);
    useEffect(() => {
        const c = animate(0, 1, { duration: varighet, ease: 'easeInOut', onUpdate: setU });
        return () => c.stop();
    }, [varighet]);
    const punkt = (t: number) => [
        (1 - t) * (1 - t) * fra[0] + 2 * (1 - t) * t * mx + t * t * til[0],
        (1 - t) * (1 - t) * fra[1] + 2 * (1 - t) * t * my + t * t * til[1],
    ];
    const [x, y] = punkt(u);
    const [x2, y2] = punkt(Math.min(1, u + 0.01));
    const [x0, y0] = punkt(Math.max(0, u - 0.01));
    const vinkel = (Math.atan2(y2 - y0, x2 - x0) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={6}
                strokeDasharray="16 14"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: varighet, ease: 'easeInOut' }}
            />
            <g transform={`translate(${x} ${y}) rotate(${vinkel}) scale(1.4)`}>
                <path
                    d="M 34 0 L 10 -6 L -4 -30 L -14 -30 L -4 -6 L -22 -5 L -30 -16 L -36 -16 L -32 0 L -36 16 L -30 16 L -22 5 L -4 6 L -14 30 L -4 30 L 10 6 Z"
                    fill={farge}
                    stroke="#ffffff"
                    strokeWidth={4}
                />
            </g>
        </g>
    );
}

/** En koffert ved Teheran: sjahen pakker. */
function Koffert({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 14 }}
        >
            <rect
                x={x - 26}
                y={y - 70}
                width={52}
                height={30}
                rx={10}
                fill="none"
                stroke="#78350f"
                strokeWidth={10}
            />
            <rect
                x={x - 70}
                y={y - 48}
                width={140}
                height={100}
                rx={14}
                fill="#b45309"
                stroke="#78350f"
                strokeWidth={6}
            />
            <line x1={x - 70} y1={y} x2={x + 70} y2={y} stroke="#78350f" strokeWidth={6} />
            <rect x={x - 12} y={y - 8} width={24} height={16} rx={3} fill="#fde68a" />
        </motion.g>
    );
}

/** Mange små prikker som myldrer rundt et sted. */
function Folkemengde({
    pos,
    antall,
    radius,
}: {
    pos: [number, number];
    antall: number;
    radius: number;
}) {
    const prikker = useMemo(
        () =>
            Array.from({ length: antall }, (_, i) => {
                const v = i * 2.399963;
                const r = radius * Math.sqrt((i + 0.5) / antall);
                return [Math.cos(v) * r, Math.sin(v) * r * 0.7] as [number, number];
            }),
        [antall, radius]
    );
    return (
        <g>
            {prikker.map(([dx, dy], i) => (
                <motion.circle
                    key={i}
                    cx={pos[0] + dx}
                    cy={pos[1] + dy}
                    r={7}
                    fill={i % 5 === 0 ? '#16a34a' : '#0f172a'}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.85, scale: 1 }}
                    transition={{ delay: 0.2 + (i / antall) * 2, duration: 0.3 }}
                />
            ))}
        </g>
    );
}

/** En by med uro: en rød prikk med en ring som pulserer. */
function Uro({
    pos,
    aktiv,
    forsinkelse,
}: {
    pos: [number, number];
    aktiv: boolean;
    forsinkelse: number;
}) {
    if (!aktiv) return <circle cx={pos[0]} cy={pos[1]} r={9} fill="#64748b" opacity={0.6} />;
    return (
        <g>
            <motion.circle
                cx={pos[0]}
                cy={pos[1]}
                fill="none"
                stroke="#dc2626"
                strokeWidth={6}
                initial={{ r: 14, opacity: 0 }}
                animate={{ r: [14, 70], opacity: [0.9, 0] }}
                transition={{ duration: 2, delay: forsinkelse, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.circle
                cx={pos[0]}
                cy={pos[1]}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={4}
                initial={{ r: 0 }}
                animate={{ r: 15 }}
                transition={{ delay: forsinkelse, type: 'spring', stiffness: 260, damping: 14 }}
            />
        </g>
    );
}

/** Et oljetårn som står stille, med skiltet STREIK. */
function Oljetårn({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
        >
            <path
                d={`M ${x - 26} ${y + 30} L ${x} ${y - 50} L ${x + 26} ${y + 30} Z`}
                fill="none"
                stroke="#1f2937"
                strokeWidth={7}
            />
            <line x1={x - 16} y1={y} x2={x + 16} y2={y} stroke="#1f2937" strokeWidth={6} />
            <rect x={x - 56} y={y + 36} width={112} height={38} rx={8} fill="#b91c1c" />
            <text
                x={x}
                y={y + 64}
                textAnchor="middle"
                fontSize={26}
                fontWeight={900}
                fill="#ffffff"
            >
                STREIK
            </text>
        </motion.g>
    );
}

/** En basar: en markise med en stengt dør. */
function Basar({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 16 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <path
                d={`M ${x - 46} ${y - 30} L ${x + 46} ${y - 30} L ${x + 56} ${y - 6} L ${x - 56} ${y - 6} Z`}
                fill="#f59e0b"
                stroke="#78350f"
                strokeWidth={4}
            />
            <rect
                x={x - 42}
                y={y - 6}
                width={84}
                height={50}
                fill="#fef3c7"
                stroke="#78350f"
                strokeWidth={4}
            />
            <rect x={x - 34} y={y} width={68} height={38} fill="#57534e" />
            {[8, 18, 28].map((d) => (
                <line
                    key={d}
                    x1={x - 34}
                    y1={y + d}
                    x2={x + 34}
                    y2={y + d}
                    stroke="#a8a29e"
                    strokeWidth={3}
                />
            ))}
            <text
                x={x}
                y={y + 72}
                textAnchor="middle"
                fontSize={24}
                fontWeight={900}
                fill="#7f1d1d"
                stroke="#ffffff"
                strokeWidth={6}
                paintOrder="stroke"
            >
                STENGT
            </text>
        </motion.g>
    );
}

/** Stiplet linje mellom Paris og Teheran med teksten «Langt borte». */
function Avstand({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2;
    return (
        <g>
            <motion.line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke="#334155"
                strokeWidth={5}
                strokeDasharray="10 12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
            />
            <Etikett pos={[mx, my]} tekst="Langt borte" farge="#334155" dy={-40} forsinkelse={1} />
        </g>
    );
}

/** Tidslinje: 14 år i eksil, som en stolpe som fylles. */
function Tidslinje({ fra }: { fra: [number, number] }) {
    const [x, y] = fra;
    const bredde = 520;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <rect
                x={x - 20}
                y={y - 70}
                width={bredde + 40}
                height={140}
                rx={18}
                fill="#ffffff"
                opacity={0.95}
            />
            <text x={x} y={y - 26} fontSize={32} fontWeight={800} fill="#334155">
                År i eksil
            </text>
            <rect x={x} y={y} width={bredde} height={34} rx={10} fill="#e2e8f0" />
            <motion.rect
                x={x}
                y={y}
                height={34}
                rx={10}
                fill="#16a34a"
                initial={{ width: 0 }}
                animate={{ width: bredde }}
                transition={{ duration: 2, delay: 0.6, ease: 'easeOut' }}
            />
            <motion.text
                x={x + bredde}
                y={y - 26}
                textAnchor="end"
                fontSize={40}
                fontWeight={900}
                fill="#14532d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4 }}
            >
                14 år
            </motion.text>
        </motion.g>
    );
}

/** Ringer som sprer seg fra Iran mot Irak: frykten for at revolusjonen smitter. */
function Bølge({ pos, til }: { pos: [number, number]; til: [number, number] }) {
    return (
        <g>
            {[0, 0.7, 1.4].map((d) => (
                <motion.circle
                    key={d}
                    cx={pos[0]}
                    cy={pos[1]}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth={7}
                    initial={{ r: 30, opacity: 0 }}
                    animate={{
                        r: [30, Math.hypot(til[0] - pos[0], til[1] - pos[1]) + 60],
                        opacity: [0.9, 0],
                    }}
                    transition={{ duration: 2.4, delay: d, repeat: Infinity, ease: 'easeOut' }}
                />
            ))}
            <Etikett
                pos={[til[0] - 60, til[1] + 150]}
                tekst="Sjia-muslimer i Irak"
                farge="#14532d"
                forsinkelse={0.8}
            />
        </g>
    );
}

function Merke({
    pos,
    tekst,
    farge = '#1e3a8a',
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    forsinkelse?: number;
}) {
    const bredde = tekst.length * 21 + 50;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 16 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <rect
                x={pos[0] - bredde / 2}
                y={pos[1] - 34}
                width={bredde}
                height={68}
                rx={20}
                fill={farge}
            />
            <text
                x={pos[0]}
                y={pos[1] + 12}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#ffffff"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Åtte år og opp mot en million liv, på et kort. */
function Krigsår({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <rect
                x={x - 220}
                y={y - 80}
                width={440}
                height={170}
                rx={24}
                fill="#ffffff"
                opacity={0.96}
            />
            <text x={x} y={y - 8} textAnchor="middle" fontSize={64} fontWeight={900} fill="#7f1d1d">
                8 år
            </text>
            <text
                x={x}
                y={y + 52}
                textAnchor="middle"
                fontSize={32}
                fontWeight={800}
                fill="#334155"
            >
                opp mot en million liv
            </text>
        </motion.g>
    );
}

/** Et land med konflikt i dag: navn og en pulserende ring. */
function Konflikt({
    pos,
    navn,
    dy,
    forsinkelse,
}: {
    pos: [number, number];
    navn: string;
    dy: number;
    forsinkelse: number;
}) {
    return (
        <g>
            <motion.circle
                cx={pos[0]}
                cy={pos[1]}
                fill="none"
                stroke="#dc2626"
                strokeWidth={6}
                initial={{ r: 20, opacity: 0 }}
                animate={{ r: [20, 80], opacity: [0.9, 0] }}
                transition={{ duration: 2, delay: forsinkelse, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.circle
                cx={pos[0]}
                cy={pos[1]}
                r={16}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse }}
            />
            <Etikett pos={pos} tekst={navn} farge="#7f1d1d" dy={dy} forsinkelse={forsinkelse} />
        </g>
    );
}
