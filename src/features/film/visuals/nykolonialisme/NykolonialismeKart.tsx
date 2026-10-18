import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartene i filmen om nykolonialisme.
 * «selskap»: United Fruit i Guatemala, jorda Árbenz tok, og kuppet i 1954.
 * «kupp»: fem land på ei tidslinje fra 1950 til 1975, ett per beat.
 * «kakao»: råvarer fra Ghana til Europa, ferdigvarer tilbake, og verdien som renner nordover.
 * «norge»: ressursforbannelsen, og oljen som går til oljefondet.
 * «sankara»: Burkina Faso, talen om gjelden i juli 1987 og kuppet i oktober.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'selskap' | 'kupp' | 'kakao' | 'norge' | 'sankara';

const ID = {
    guatemala: 320,
    usa: 840,
    iran: 364,
    chile: 152,
    kongo: 180,
    indonesia: 360,
    ghana: 288,
    burkina: 854,
    norge: 578,
};
const EUROPA = [276, 56, 528, 826, 756, 724, 380, 40, 208, 752];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    sor: '#16a34a',
    nord: '#2563eb',
    kupp: '#64748b',
    rod: '#b91c1c',
    kakao: '#78350f',
};

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    selskap: [
        [-122, 6],
        [-66, 46],
    ],
    kupp: [
        [-115, -42],
        [135, 52],
    ],
    kakao: [
        [-24, -2],
        [34, 60],
    ],
    norge: [
        [-14, 54],
        [34, 71],
    ],
    sankara: [
        [-22, 2],
        [26, 54],
    ],
};

function lagProjeksjon(modus: Modus): GeoProjection {
    return geoNaturalEarth1().fitExtent(
        [
            [80, 150],
            [B - 80, modus === 'kupp' ? H - 150 : H - 60],
        ],
        { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
    );
}

const KUPP = [
    {
        id: ID.iran,
        ll: [53, 32.5] as LngLat,
        land: 'Iran',
        ar: 1953,
        beat: 1,
        tekst: 'Mossadeq styrtet',
        grunn: 'Han hadde nasjonalisert oljen',
    },
    {
        id: ID.chile,
        ll: [-71, -30] as LngLat,
        land: 'Chile',
        ar: 1973,
        beat: 2,
        tekst: 'Allende styrtet',
        grunn: 'Han hadde nasjonalisert kobberet',
    },
    {
        id: ID.kongo,
        ll: [23.6, -2.9] as LngLat,
        land: 'Kongo',
        ar: 1961,
        beat: 3,
        tekst: 'Lumumba drept',
        grunn: 'Belgia, og trolig USA, var med',
    },
    {
        id: ID.indonesia,
        ll: [113, -1.5] as LngLat,
        land: 'Indonesia',
        ar: 1965,
        beat: 4,
        tekst: 'Kuppforsøk, så massedrap',
        grunn: '500 000 til 1 200 000 drepte',
    },
    {
        id: ID.guatemala,
        ll: [-90.4, 15.5] as LngLat,
        land: 'Guatemala',
        ar: 1954,
        beat: 5,
        tekst: '',
        grunn: '',
    },
];

function fargeFor(modus: Modus, beat: number, id: number): string {
    if (modus === 'selskap') {
        if (id === ID.guatemala) return beat >= 3 ? FARGE.kupp : FARGE.sor;
        if (id === ID.usa) return FARGE.nord;
        return FARGE.land;
    }
    if (modus === 'kupp') {
        const k = KUPP.find((x) => x.id === id);
        if (k && (beat >= k.beat || (beat === 0 && k.beat < 5)))
            return beat === 0 ? '#d6d3c4' : FARGE.kupp;
        return FARGE.land;
    }
    if (modus === 'kakao') {
        if (id === ID.ghana) return FARGE.sor;
        if (EUROPA.includes(id)) return FARGE.nord;
        return FARGE.land;
    }
    if (modus === 'norge') {
        if (id === ID.norge) return FARGE.sor;
        return FARGE.land;
    }
    if (id === ID.burkina) return beat >= 3 ? FARGE.kupp : FARGE.sor;
    if (beat === 2 && EUROPA.includes(id)) return FARGE.nord;
    return FARGE.land;
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    selskap: [
        { tekst: 'Verktøy 2: Selskaper' },
        { tekst: 'United Fruit i Guatemala' },
        { tekst: 'Jorda tas fra selskapet' },
        { tekst: 'Kupp i 1954', rod: true },
    ],
    kupp: [
        { tekst: 'Verktøy 3: Kupp' },
        { tekst: 'Iran, 1953' },
        { tekst: 'Chile, 1973' },
        { tekst: 'Kongo, 1961' },
        { tekst: 'Indonesia, 1965', rod: true },
        { tekst: 'Som regel i det skjulte' },
    ],
    kakao: [
        { tekst: 'Verktøy 4: Ulik handel' },
        { tekst: 'Billige råvarer' },
        { tekst: 'Dyre ferdigvarer tilbake' },
        { tekst: 'Bonden får noen få kroner' },
        { tekst: 'Verdien renner nordover', rod: true },
        { tekst: 'Arvet fra kolonitiden' },
    ],
    norge: [
        { tekst: 'Kan et land slippe unna?' },
        { tekst: 'Ressursforbannelsen', rod: true },
        { tekst: 'Norge: staten beholdt kontrollen' },
        { tekst: 'Oljefondet' },
        { tekst: 'Det motsatte av en bananrepublikk' },
    ],
    sankara: [
        { tekst: 'Burkina Faso' },
        { tekst: 'Juli 1987: en tale om gjeld' },
        { tekst: 'Gjeld fra kolonitiden?' },
        { tekst: 'Oktober 1987', rod: true },
        { tekst: 'Frihet kommer sjelden gratis' },
    ],
};

export function NykolonialismeKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kupp';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />

                {modus === 'selskap' && <Selskap beat={beat} p={p} />}
                {modus === 'kupp' && <Kupp beat={beat} p={p} />}
                {modus === 'kakao' && <Kakao beat={beat} p={p} playing={playing} />}
                {modus === 'norge' && <Norge beat={beat} p={p} />}
                {modus === 'sankara' && <Sankara beat={beat} p={p} />}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {modus === 'selskap' && beat === 2 && (
                    <Kort
                        key="arbenz"
                        navn="Jacobo Árbenz"
                        linje="President i Guatemala"
                        ekstra="Tok nesten 90 000 hektar plantasjejord"
                        side="hoyre"
                    />
                )}
                {modus === 'kupp' && beat >= 1 && beat <= 4 && (
                    <Kort
                        key={`kupp-${beat}`}
                        navn={KUPP[beat - 1].tekst}
                        linje={KUPP[beat - 1].grunn}
                        side={beat === 2 ? 'hoyre' : 'venstre'}
                        rod={beat === 4}
                    />
                )}
                {modus === 'norge' && beat === 1 && (
                    <Kort
                        key="forbannelse"
                        navn="Mye olje og mineraler"
                        linje="gir ofte dårlig styring og lite utvikling"
                        side="hoyre"
                        rod
                    />
                )}
                {modus === 'norge' && beat >= 3 && (
                    <Kort
                        key="fond"
                        navn="Statens pensjonsfond utland"
                        linje="Verdens største statlige fond siden 2012"
                        ekstra={
                            beat >= 4
                                ? 'Pengene styres av staten, ikke av et fremmed selskap'
                                : undefined
                        }
                        side="hoyre"
                    />
                )}
                {modus === 'sankara' && beat <= 3 && (
                    <Kort
                        key="sankara"
                        navn="Thomas Sankara"
                        linje="President i Burkina Faso fra 1983"
                        ekstra={beat >= 3 ? 'Drept i et militærkupp, oktober 1987' : undefined}
                        side="venstre"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- Modusene ---------------- */

function Selskap({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const gua = p([-90.4, 15.5]);
    const usa = p([-98, 39]);
    return (
        <>
            <Etikett pos={p([-88, 11])} tekst="Guatemala" farge="#14532d" dy={40} />
            <Etikett pos={usa} tekst="USA" farge={FARGE.nord} stor />
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <rect
                        x={usa[0] - 190}
                        y={usa[1] + 40}
                        width={380}
                        height={78}
                        rx={18}
                        fill="#facc15"
                        stroke="#854d0e"
                        strokeWidth={5}
                    />
                    <text
                        x={usa[0]}
                        y={usa[1] + 92}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#713f12"
                    >
                        United Fruit
                    </text>
                </motion.g>
            )}
            {beat >= 1 && <Plantasjer pos={gua} tatt={beat >= 2} />}
            {beat === 1 && (
                <Pil
                    fra={[gua[0] + 30, gua[1] - 50]}
                    til={[usa[0] + 10, usa[1] + 130]}
                    farge="#a16207"
                    bue={-0.2}
                    tekst="frukt og fortjeneste"
                />
            )}
            {beat >= 3 && (
                <Pil
                    fra={[usa[0] - 40, usa[1] + 130]}
                    til={[gua[0] - 10, gua[1] - 60]}
                    farge={FARGE.nord}
                    bue={0.2}
                    tekst="politikere"
                />
            )}
            {beat >= 3 && (
                <Stempel pos={[gua[0] + 260, gua[1] + 40]} tekst="KUPP 1954" farge={FARGE.rod} />
            )}
        </>
    );
}

function Plantasjer({ pos, tatt }: { pos: [number, number]; tatt: boolean }) {
    const ruter: [number, number][] = [
        [-60, -30],
        [-20, -30],
        [20, -30],
        [-40, 4],
        [0, 4],
        [40, 4],
    ];
    return (
        <g>
            {ruter.map(([dx, dy], i) => (
                <motion.rect
                    key={i}
                    x={pos[0] + dx - 17}
                    y={pos[1] + dy - 14}
                    width={34}
                    height={28}
                    rx={4}
                    stroke="#713f12"
                    strokeWidth={3}
                    initial={{ opacity: 0, fill: '#facc15' }}
                    animate={{ opacity: 1, fill: tatt ? '#16a34a' : '#facc15' }}
                    transition={{ delay: 0.5 + i * 0.12 + (tatt ? 0.6 : 0) }}
                />
            ))}
        </g>
    );
}

function Kupp({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const x0 = 260;
    const x1 = 1340;
    const yLinje = 840;
    const xAr = (ar: number) => x0 + ((ar - 1950) / 25) * (x1 - x0);
    return (
        <>
            {/* Tidslinje fra 1950 til 1975 */}
            <rect
                x={x0 - 60}
                y={yLinje - 40}
                width={x1 - x0 + 120}
                height={80}
                rx={20}
                fill="#ffffff"
                fillOpacity={0.85}
            />
            <line x1={x0} y1={yLinje} x2={x1} y2={yLinje} stroke="#334155" strokeWidth={6} />
            {[1950, 1975].map((ar) => (
                <text
                    key={ar}
                    x={xAr(ar)}
                    y={yLinje + 8}
                    textAnchor={ar === 1950 ? 'end' : 'start'}
                    dx={ar === 1950 ? -14 : 14}
                    fontSize={30}
                    fontWeight={800}
                    fill="#334155"
                >
                    {ar}
                </text>
            ))}
            {KUPP.map((k) => {
                const vis = beat >= k.beat;
                const naa = beat === k.beat;
                const [x, y] = p(k.ll);
                return (
                    <g key={k.land}>
                        {beat === 0 && k.beat < 5 && (
                            <motion.circle
                                cx={x}
                                cy={y}
                                r={26}
                                fill="none"
                                stroke="#334155"
                                strokeWidth={4}
                                strokeDasharray="8 8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + k.beat * 0.3 }}
                            />
                        )}
                        {vis && (
                            <motion.g
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    delay: naa ? 0.4 : 0,
                                    type: 'spring',
                                    stiffness: 220,
                                    damping: 14,
                                }}
                                style={{ transformOrigin: `${x}px ${y}px` }}
                            >
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={naa ? 20 : 14}
                                    fill={FARGE.rod}
                                    stroke="#fff"
                                    strokeWidth={5}
                                />
                                <text
                                    x={x}
                                    y={y - 34}
                                    textAnchor={k.land === 'Indonesia' ? 'end' : 'middle'}
                                    fontSize={naa ? 44 : 34}
                                    fontWeight={900}
                                    fill="#0f172a"
                                    stroke="#fff"
                                    strokeWidth={8}
                                    paintOrder="stroke"
                                >
                                    {k.land} {k.ar}
                                </text>
                            </motion.g>
                        )}
                        {vis && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: naa ? 0.8 : 0 }}
                            >
                                <circle
                                    cx={xAr(k.ar)}
                                    cy={yLinje}
                                    r={naa ? 18 : 13}
                                    fill={FARGE.rod}
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <text
                                    x={xAr(k.ar)}
                                    y={k.ar === 1954 ? yLinje + 44 : yLinje - 24}
                                    textAnchor="middle"
                                    fontSize={26}
                                    fontWeight={900}
                                    fill="#0f172a"
                                >
                                    {k.ar}
                                </text>
                            </motion.g>
                        )}
                    </g>
                );
            })}
        </>
    );
}

function Kakao({
    beat,
    p,
    playing,
}: {
    beat: number;
    p: (ll: LngLat) => [number, number];
    playing: boolean;
}) {
    const ghana = p([-1.2, 7.8]);
    const europa = p([7, 50]);
    return (
        <>
            <Etikett pos={[ghana[0], ghana[1] + 80]} tekst="Ghana" farge="#14532d" stor />
            <Etikett
                pos={[europa[0] + 230, europa[1] - 40]}
                tekst="Europa"
                farge={FARGE.nord}
                stor
            />
            {beat >= 1 && <Bonner pos={ghana} />}
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <rect
                        x={ghana[0] - 330}
                        y={ghana[1] - 250}
                        width={360}
                        height={130}
                        rx={18}
                        fill="#fff"
                    />
                    <text
                        x={ghana[0] - 150}
                        y={ghana[1] - 198}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill={FARGE.kakao}
                    >
                        kakao, kobber, olje
                    </text>
                    <text
                        x={ghana[0] - 150}
                        y={ghana[1] - 150}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#475569"
                    >
                        rett fra naturen
                    </text>
                </motion.g>
            )}
            {beat >= 2 && <Fabrikk pos={europa} krysset={false} />}
            {beat >= 2 && beat !== 4 && (
                <>
                    <Pil
                        fra={[ghana[0] + 40, ghana[1] - 50]}
                        til={[europa[0] + 20, europa[1] + 80]}
                        farge={FARGE.kakao}
                        bue={-0.18}
                        tekst="råvarer"
                        tekstDx={120}
                    />
                    <Pil
                        fra={[europa[0] - 60, europa[1] + 80]}
                        til={[ghana[0] - 60, ghana[1] - 60]}
                        farge={FARGE.nord}
                        bue={-0.18}
                        tekst="ferdigvarer"
                        tekstDx={-120}
                    />
                </>
            )}
            {beat === 3 && (
                <>
                    <Prislapp
                        pos={[ghana[0] + 300, ghana[1] - 40]}
                        tekst="noen få kroner"
                        mynter={1}
                    />
                    <Prislapp
                        pos={[europa[0] + 330, europa[1] + 120]}
                        tekst="mange ganger prisen"
                        mynter={6}
                    />
                </>
            )}
            {beat === 4 && <Strom fra={ghana} til={europa} playing={playing} />}
            {beat >= 5 && (
                <>
                    <Fabrikk pos={[ghana[0] + 170, ghana[1] - 30]} krysset />
                    <Stempel
                        pos={[ghana[0] - 380, ghana[1] + 20]}
                        tekst="ARVET FRA KOLONITIDEN"
                        farge={FARGE.rod}
                    />
                </>
            )}
        </>
    );
}

function Norge({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const norge = p([9, 61]);
    const nordsjoen = p([2.5, 58]);
    return (
        <>
            <Etikett pos={[norge[0] + 20, norge[1] - 20]} tekst="Norge" farge="#14532d" stor />
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Plattform pos={nordsjoen} />
                </motion.g>
            )}
            {beat >= 2 && (
                <Pil
                    fra={[nordsjoen[0] + 40, nordsjoen[1] - 40]}
                    til={[norge[0] - 20, norge[1] + 60]}
                    farge="#111827"
                    bue={-0.2}
                    tekst="staten"
                />
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 14 }}
                    style={{ transformOrigin: `${norge[0]}px ${norge[1] + 160}px` }}
                >
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <ellipse
                            key={i}
                            cx={norge[0] - 80}
                            cy={norge[1] + 230 - i * 24}
                            rx={70}
                            ry={20}
                            fill="#facc15"
                            stroke="#a16207"
                            strokeWidth={5}
                        />
                    ))}
                    <text
                        x={norge[0] - 80}
                        y={norge[1] + 300}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#713f12"
                        stroke="#fff"
                        strokeWidth={8}
                        paintOrder="stroke"
                    >
                        oljefondet
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Sankara({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const bf = p([-1.6, 12.3]);
    const eu = p([4, 47]);
    return (
        <>
            <Etikett pos={[bf[0], bf[1] + 70]} tekst="Burkina Faso" farge="#14532d" />
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 14 }}
                    style={{ transformOrigin: `${bf[0]}px ${bf[1] - 120}px` }}
                >
                    <g transform="translate(200 0)">
                        <rect
                            x={bf[0] - 300}
                            y={bf[1] - 230}
                            width={600}
                            height={140}
                            rx={30}
                            fill="#fff"
                            stroke="#14532d"
                            strokeWidth={6}
                        />
                        <path
                            d={`M ${bf[0] - 200} ${bf[1] - 92} L ${bf[0] - 200} ${bf[1] - 40} L ${bf[0] - 150} ${bf[1] - 92} Z`}
                            fill="#fff"
                            stroke="#14532d"
                            strokeWidth={6}
                        />
                        <text
                            x={bf[0]}
                            y={bf[1] - 172}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#14532d"
                        >
                            Gå sammen.
                        </text>
                        <text
                            x={bf[0]}
                            y={bf[1] - 122}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#14532d"
                        >
                            Nekt å betale gjelden!
                        </text>
                    </g>
                </motion.g>
            )}
            {beat === 2 && (
                <>
                    <Etikett
                        pos={[eu[0] + 330, eu[1] + 10]}
                        tekst="Tidligere kolonimakter"
                        farge={FARGE.nord}
                    />
                    <Pil
                        fra={[eu[0], eu[1] + 20]}
                        til={[bf[0] + 10, bf[1] - 30]}
                        farge={FARGE.nord}
                        bue={0.15}
                        tekst="kolonimakt før, långiver nå"
                    />
                </>
            )}
            {beat === 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <rect
                        x={bf[0] - 300}
                        y={bf[1] - 230}
                        width={600}
                        height={110}
                        rx={24}
                        fill="#fff"
                        fillOpacity={0.92}
                    />
                    <text
                        x={bf[0]}
                        y={bf[1] - 160}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        En helt for mange afrikanere
                    </text>
                </motion.g>
            )}
        </>
    );
}

/* ---------------- Byggeklosser ---------------- */

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
            fontSize={stor ? 54 : 42}
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

function Pil({
    fra,
    til,
    farge,
    bue = 0.15,
    tekst,
    tekstDx = 0,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    bue?: number;
    tekst?: string;
    tekstDx?: number;
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
                transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -26 -16 L 6 0 L -26 16 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
            />
            {tekst && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    x={(fra[0] + til[0]) / 4 + mx / 2 + tekstDx}
                    y={(fra[1] + til[1]) / 4 + my / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill={farge}
                    stroke="#ffffff"
                    strokeWidth={8}
                    paintOrder="stroke"
                >
                    {tekst}
                </motion.text>
            )}
        </g>
    );
}

function Stempel({ pos, tekst, farge }: { pos: [number, number]; tekst: string; farge: string }) {
    const bredde = tekst.length * 28 + 50;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 2.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 16 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <g transform={`rotate(-7 ${pos[0]} ${pos[1]})`}>
                <rect
                    x={pos[0] - bredde / 2}
                    y={pos[1] - 38}
                    width={bredde}
                    height={76}
                    rx={10}
                    fill="#ffffff"
                    fillOpacity={0.92}
                    stroke={farge}
                    strokeWidth={7}
                />
                <text
                    x={pos[0]}
                    y={pos[1] + 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={farge}
                    letterSpacing={2}
                >
                    {tekst}
                </text>
            </g>
        </motion.g>
    );
}

/** Kakaobønner i en haug. */
function Bonner({ pos }: { pos: [number, number] }) {
    const bonner: [number, number][] = [
        [-30, 0],
        [0, -6],
        [30, 0],
        [-15, -26],
        [15, -26],
    ];
    return (
        <g>
            {bonner.map(([dx, dy], i) => (
                <motion.ellipse
                    key={i}
                    cx={pos[0] + dx}
                    cy={pos[1] + dy}
                    rx={18}
                    ry={26}
                    fill="#92400e"
                    stroke="#451a03"
                    strokeWidth={3}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                />
            ))}
        </g>
    );
}

function Fabrikk({ pos, krysset }: { pos: [number, number]; krysset: boolean }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: krysset ? 0.85 : 1 }}
            transition={{ delay: 0.5 }}
        >
            <path
                d={`M ${x - 60} ${y + 30} L ${x - 60} ${y - 10} L ${x - 30} ${y + 10} L ${x - 30} ${y - 10} L ${x} ${y + 10} L ${x} ${y - 10} L ${x + 30} ${y + 10} L ${x + 30} ${y - 50} L ${x + 50} ${y - 50} L ${x + 50} ${y + 30} Z`}
                fill={krysset ? '#94a3b8' : '#1e3a8a'}
                stroke="#fff"
                strokeWidth={4}
            />
            {krysset && (
                <>
                    <line
                        x1={x - 75}
                        y1={y - 60}
                        x2={x + 65}
                        y2={y + 45}
                        stroke={FARGE.rod}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <line
                        x1={x + 65}
                        y1={y - 60}
                        x2={x - 75}
                        y2={y + 45}
                        stroke={FARGE.rod}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <text
                        x={x}
                        y={y + 85}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={900}
                        fill={FARGE.rod}
                        stroke="#fff"
                        strokeWidth={8}
                        paintOrder="stroke"
                    >
                        ingen egen industri
                    </text>
                </>
            )}
        </motion.g>
    );
}

function Prislapp({
    pos,
    tekst,
    mynter,
}: {
    pos: [number, number];
    tekst: string;
    mynter: number;
}) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mynter > 1 ? 1.2 : 0.4 }}
        >
            {Array.from({ length: mynter }, (_, i) => (
                <ellipse
                    key={i}
                    cx={x}
                    cy={y - i * 20}
                    rx={46}
                    ry={14}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={4}
                />
            ))}
            <rect x={x - 180} y={y + 26} width={360} height={60} rx={14} fill="#fff" />
            <text
                x={x}
                y={y + 68}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Mange små verdier som renner fra sør mot nord. */
function Strom({
    fra,
    til,
    playing,
}: {
    fra: [number, number];
    til: [number, number];
    playing: boolean;
}) {
    const prikker = Array.from({ length: 14 }, (_, i) => i);
    return (
        <g>
            <path
                d={`M ${fra[0]} ${fra[1]} L ${til[0]} ${til[1]}`}
                stroke="#a16207"
                strokeWidth={4}
                strokeDasharray="10 12"
                opacity={0.6}
            />
            {prikker.map((i) => (
                <motion.circle
                    key={i}
                    r={14}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={3}
                    initial={{ cx: fra[0], cy: fra[1], opacity: 0 }}
                    animate={
                        playing
                            ? { cx: [fra[0], til[0]], cy: [fra[1], til[1]], opacity: [0, 1, 1, 0] }
                            : undefined
                    }
                    transition={{
                        duration: 3.2,
                        delay: i * 0.23,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            ))}
            <text
                x={(fra[0] + til[0]) / 2 + 120}
                y={(fra[1] + til[1]) / 2}
                fontSize={38}
                fontWeight={900}
                fill="#713f12"
                stroke="#fff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                sør → nord
            </text>
        </g>
    );
}

function Plattform({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <g>
            <rect x={x - 40} y={y - 20} width={80} height={20} fill="#475569" />
            {[-30, 22].map((dx) => (
                <rect key={dx} x={x + dx} y={y} width={8} height={40} fill="#475569" />
            ))}
            <path
                d={`M ${x - 10} ${y - 20} L ${x} ${y - 75} L ${x + 10} ${y - 20} Z`}
                fill="#94a3b8"
                stroke="#334155"
                strokeWidth={3}
            />
            <path
                d={`M ${x + 46} ${y - 70} C ${x + 70} ${y - 40}, ${x + 70} ${y - 20}, ${x + 46} ${y - 20} C ${x + 22} ${y - 20}, ${x + 22} ${y - 40}, ${x + 46} ${y - 70} Z`}
                fill="#111827"
                stroke="#fff"
                strokeWidth={4}
            />
        </g>
    );
}

function Kort({
    navn,
    linje,
    ekstra,
    side,
    rod,
}: {
    navn: string;
    linje: string;
    ekstra?: string;
    side: 'venstre' | 'hoyre';
    rod?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: side === 'venstre' ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
            className={`absolute ${side === 'hoyre' ? 'right-[3%]' : 'left-[3%]'} bottom-[14%] w-[24rem] p-5 rounded-3xl shadow-2xl ${
                rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
            }`}
        >
            <div className="font-display font-black text-3xl">{navn}</div>
            <div className={`mt-1 text-2xl font-semibold ${rod ? 'text-white' : 'text-slate-600'}`}>
                {linje}
            </div>
            {ekstra && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.6 }}
                    className="mt-3 px-3 py-2 rounded-xl bg-amber-500 text-xl font-bold text-white"
                >
                    {ekstra}
                </motion.div>
            )}
        </motion.div>
    );
}
