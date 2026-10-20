import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kartet til «Verden er én maskin», i fire moduser.
 *
 * «reise»: en vare reiser fra land til land og ender i en butikk i Norge. Landene er ikke
 * navngitt, for artikkelen sier bare «ett land, et annet, et tredje».
 * «flaskehalser»: skipsleder over verdenskartet, og de fire flaskehalsene én etter én.
 * «norge»: Europa med Norge uthevet, naturgass, 57 % av gassreservene, sjømaten, og til
 * slutt verdenskartet med piler ut til mange land.
 * «sarbar»: Norge og to søyler (selger / kjøper) som viser underskudd uten olje og gass,
 * og en oljepris som svinger (bare en illustrasjon, uten tall).
 */

type Modus = 'reise' | 'flaskehalser' | 'norge' | 'sarbar';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const NORGE_ID = '578';
const NORGE: LngLat = [9, 61];

function verden(): GeoProjection {
    return geoNaturalEarth1().fitExtent(
        [
            [30, 120],
            [B - 30, H - 20],
        ],
        {
            type: 'MultiPoint',
            coordinates: [
                [-165, -50],
                [178, 74],
            ],
        } as never
    );
}

function europa(): GeoProjection {
    return geoMercator().fitExtent(
        [
            [40, 130],
            [B * 0.62, H - 30],
        ],
        {
            type: 'MultiPoint',
            coordinates: [
                [-14, 36],
                [38, 71],
            ],
        } as never
    );
}

function skandinavia(): GeoProjection {
    return geoMercator().fitExtent(
        [
            [40, 140],
            [760, H - 40],
        ],
        {
            type: 'MultiPoint',
            coordinates: [
                [-2, 54],
                [32, 71.5],
            ],
        } as never
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    farge,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    farge: (id: string) => string;
}) {
    return (
        <g>
            {geographies.map((g, i) => (
                <path
                    key={`${g.id ?? 'x'}-${i}`}
                    d={sti(g as never) ?? ''}
                    fill={farge(String(g.id ?? ''))}
                    stroke="#ffffff"
                    strokeWidth={0.8}
                />
            ))}
        </g>
    );
});

/** Tekst med hvit kant, så den leses over både land og hav. */
function Etikett({
    x,
    y,
    tekst,
    farge = '#0f172a',
    str = 34,
    anker = 'middle',
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    str?: number;
    anker?: 'start' | 'middle' | 'end';
    forsinkelse?: number;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={800}
            fill={farge}
            style={{
                paintOrder: 'stroke',
                stroke: '#ffffff',
                strokeWidth: 9,
                strokeLinejoin: 'round',
            }}
        >
            {tekst}
        </motion.text>
    );
}

function Overskrift({ tekst, rod }: { tekst: string; rod?: boolean }) {
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={tekst}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <rect
                    x={B / 2 - tekst.length * 13 - 30}
                    y={28}
                    width={tekst.length * 26 + 60}
                    height={76}
                    rx={22}
                    fill={rod ? '#dc2626' : '#ffffff'}
                    opacity={0.95}
                />
                <text
                    x={B / 2}
                    y={80}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill={rod ? '#ffffff' : '#0f172a'}
                >
                    {tekst}
                </text>
            </motion.g>
        </AnimatePresence>
    );
}

function Bue({
    fra,
    til,
    farge,
    bredde = 6,
    stiplet,
    forsinkelse = 0,
    varighet = 1.4,
    hoyde = 0.25,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    bredde?: number;
    stiplet?: boolean;
    forsinkelse?: number;
    varighet?: number;
    hoyde?: number;
}) {
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2 - Math.hypot(til[0] - fra[0], til[1] - fra[1]) * hoyde;
    return (
        <motion.path
            d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            strokeDasharray={stiplet ? '2 14' : undefined}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: varighet, delay: forsinkelse, ease: 'easeInOut' }}
        />
    );
}

function Pin({
    x,
    y,
    farge = '#0f172a',
    r = 12,
    puls,
}: {
    x: number;
    y: number;
    farge?: string;
    r?: number;
    puls?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {puls && (
                <motion.circle
                    r={r}
                    fill="none"
                    stroke={farge}
                    strokeWidth={4}
                    initial={{ scale: 1, opacity: 0.9 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                />
            )}
            <motion.circle
                r={r}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={4}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            />
        </g>
    );
}

// ---------- reise ----------

const STOPP: { ll: LngLat; tekst: string; fraBeat: number }[] = [
    { ll: [-98, 40], tekst: 'Ett land: tegnet', fraBeat: 2 },
    { ll: [118, 33], tekst: 'Et annet: deler', fraBeat: 2 },
    { ll: [80, 22], tekst: 'Et tredje: sydd', fraBeat: 3 },
];

function Tskjorte({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M -30 -34 L -12 -40 Q 0 -30 12 -40 L 30 -34 L 46 -14 L 30 -4 L 26 -10 L 26 40 L -26 40 L -26 -10 L -30 -4 L -46 -14 Z"
                fill="#2563eb"
                stroke="#0f172a"
                strokeWidth={4}
                strokeLinejoin="round"
            />
        </g>
    );
}

function Reise({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const n = p(NORGE);
    const [a, b, c] = STOPP.map((s) => p(s.ll));
    const overskrift = [
        'Hos deg',
        'En lang reise',
        'Tegnet ett sted, deler fra et annet',
        'Sydd et tredje sted, solgt i Norge',
        'Over flere verdensdeler',
    ][Math.min(beat, 4)];
    return (
        <>
            {beat === 1 && (
                <Bue fra={n} til={a} farge="#64748b" stiplet hoyde={0.18} varighet={2.4} />
            )}
            {beat >= 2 && <Bue fra={a} til={b} farge="#2563eb" hoyde={0.15} />}
            {beat >= 3 && <Bue fra={b} til={c} farge="#2563eb" hoyde={0.2} />}
            {beat >= 3 && <Bue fra={c} til={n} farge="#2563eb" hoyde={0.25} forsinkelse={1} />}
            {STOPP.map((s, i) =>
                beat >= s.fraBeat ? (
                    <g key={s.tekst}>
                        <Pin
                            x={[a, b, c][i][0]}
                            y={[a, b, c][i][1]}
                            farge="#2563eb"
                            puls={beat === s.fraBeat}
                        />
                        <Etikett
                            x={[a, b, c][i][0]}
                            y={[a, b, c][i][1] + (i === 2 ? 56 : -28)}
                            tekst={s.tekst}
                        />
                    </g>
                ) : null
            )}
            <Pin x={n[0]} y={n[1]} farge="#dc2626" r={14} puls={beat === 0} />
            <Etikett
                x={n[0] - 24}
                y={n[1] - 40}
                tekst="Butikk i Norge"
                anker="end"
                farge="#b91c1c"
            />
            <motion.g animate={{ opacity: beat === 0 ? 1 : 0.9 }}>
                <Tskjorte x={n[0] + 70} y={n[1] + 10} s={beat === 0 ? 1.3 : 0.9} />
            </motion.g>
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {[a, b, c, n].map((pt, i) => (
                        <circle
                            key={i}
                            cx={pt[0]}
                            cy={pt[1]}
                            r={70}
                            fill="#2563eb"
                            opacity={0.15}
                        />
                    ))}
                </motion.g>
            )}
            <Overskrift tekst={overskrift} />
        </>
    );
}

// ---------- flaskehalser ----------

const PUNKT = {
    suez: [32.5, 30.3] as LngLat,
    hormuz: [56.4, 26.5] as LngLat,
    malakka: [100.8, 2.8] as LngLat,
    panama: [-79.7, 9.1] as LngLat,
};

const LEDER: LngLat[][] = [
    [
        [4, 51],
        [-9, 44],
        [-6, 36],
        [15, 35],
        PUNKT.suez,
        [43, 12.5],
        [75, 6],
        [92, 6],
        PUNKT.malakka,
        [110, 12],
        [122, 30],
    ],
    [[50, 27], PUNKT.hormuz, [62, 21], [75, 6]],
    [[-74, 39], [-75, 25], PUNKT.panama, [-110, 14], [-160, 20], [-178, 30]],
    [
        [-6, 36],
        [-40, 38],
        [-74, 39],
    ],
];

const FLASKEHALSER: {
    id: keyof typeof PUNKT;
    navn: string;
    under: string;
    fraBeat: number;
    land: string[];
    dx: number;
    dy: number;
}[] = [
    {
        id: 'suez',
        navn: 'Suezkanalen',
        under: 'Egypt',
        fraBeat: 2,
        land: ['818'],
        dx: -24,
        dy: -24,
    },
    {
        id: 'hormuz',
        navn: 'Hormuzstredet',
        under: 'Iran og Oman',
        fraBeat: 3,
        land: ['364', '512'],
        dx: 24,
        dy: -24,
    },
    {
        id: 'malakka',
        navn: 'Malakkastredet',
        under: 'Malaysia og Indonesia',
        fraBeat: 4,
        land: ['458', '360'],
        dx: 0,
        dy: 70,
    },
    { id: 'panama', navn: 'Panamakanalen', under: '', fraBeat: 4, land: ['591'], dx: 0, dy: 70 },
];

function anker(dx: number) {
    return dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle';
}

function Flaske() {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ originX: '1400px', originY: '560px' }}
        >
            <rect x={1250} y={380} width={300} height={360} rx={24} fill="#ffffff" opacity={0.95} />
            <path
                d="M 1370 420 L 1430 420 L 1430 500 Q 1480 530 1480 580 L 1480 700 L 1320 700 L 1320 580 Q 1320 530 1370 500 Z"
                fill="#bae6fd"
                stroke="#0f172a"
                strokeWidth={5}
            />
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.circle
                    key={i}
                    r={12}
                    fill="#2563eb"
                    initial={{ cx: 1340 + i * 30, cy: 670 }}
                    animate={{ cx: [1340 + i * 30, 1400, 1400], cy: [670, 500, 410] }}
                    transition={{
                        duration: 2.2,
                        delay: i * 0.45,
                        repeat: Infinity,
                        ease: 'easeIn',
                    }}
                />
            ))}
            <text
                x={1400}
                y={725}
                textAnchor="middle"
                fontSize={26}
                fontWeight={800}
                fill="#0f172a"
            >
                Alt må gjennom halsen
            </text>
        </motion.g>
    );
}

function Flaskehalser({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const overskrift = [
        'Skipsledene',
        'Flaskehalser: trange steder',
        'Suezkanalen',
        'Hormuzstredet',
        'Malakkastredet og Panamakanalen',
        'Én hendelse kan ramme hele planeten',
    ][Math.min(beat, 5)];
    return (
        <>
            {LEDER.map((led, i) => (
                <motion.path
                    key={i}
                    d={'M ' + led.map((ll) => p(ll).join(' ')).join(' L ')}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={5}
                    strokeDasharray="3 12"
                    strokeLinecap="round"
                    opacity={0.7}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.4, delay: i * 0.3 }}
                />
            ))}
            {beat === 1 && <Flaske />}
            {FLASKEHALSER.map((f) => {
                if (beat < f.fraBeat) return null;
                const [x, y] = p(PUNKT[f.id]);
                const ny = beat === f.fraBeat;
                return (
                    <g key={f.id}>
                        <Pin x={x} y={y} farge="#dc2626" r={13} puls={ny || beat >= 5} />
                        <Etikett
                            x={x + f.dx}
                            y={y + f.dy}
                            tekst={f.navn}
                            farge="#b91c1c"
                            str={32}
                            anker={anker(f.dx)}
                        />
                        {f.under && ny && (
                            <Etikett
                                x={x + f.dx}
                                y={y + f.dy + (f.dy > 0 ? 36 : -36)}
                                anker={anker(f.dx)}
                                tekst={f.under}
                                str={26}
                                farge="#334155"
                            />
                        )}
                    </g>
                );
            })}
            <Overskrift tekst={overskrift} rod={beat >= 5} />
        </>
    );
}

// ---------- norge ----------

function Smultring({ andel, x, y }: { andel: number; x: number; y: number }) {
    const r = 120;
    const omkrets = 2 * Math.PI * r;
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={r} fill="none" stroke="#e2e8f0" strokeWidth={46} />
            <motion.circle
                r={r}
                fill="none"
                stroke="#ea580c"
                strokeWidth={46}
                transform="rotate(-90)"
                strokeDasharray={omkrets}
                initial={{ strokeDashoffset: omkrets }}
                animate={{ strokeDashoffset: omkrets * (1 - andel) }}
                transition={{ duration: 1.6, delay: 0.3, ease: 'easeOut' }}
            />
            <text y={20} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a">
                57 %
            </text>
        </g>
    );
}

function Panel({ children }: { children: React.ReactNode }) {
    return (
        <motion.g
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
        >
            <rect x={1040} y={170} width={520} height={620} rx={28} fill="#ffffff" opacity={0.96} />
            {children}
        </motion.g>
    );
}

function Fisk({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M -50 0 Q -10 -34 34 0 Q -10 34 -50 0 Z"
                fill="#0891b2"
                stroke="#0f172a"
                strokeWidth={4}
            />
            <path d="M 30 0 L 60 -22 L 60 22 Z" fill="#0891b2" stroke="#0f172a" strokeWidth={4} />
            <circle cx={-28} cy={-6} r={5} fill="#0f172a" />
        </g>
    );
}

/** Mål for pilene ut fra Norge i beat 4: spredt over verden, uten navn. */
const MAL: LngLat[] = [
    [-100, 45],
    [-60, -15],
    [-75, 5],
    [-45, -25],
    [20, 5],
    [30, -25],
    [10, 15],
    [40, 10],
    [80, 25],
    [105, 35],
    [135, 37],
    [115, 0],
    [145, -30],
    [100, 15],
    [55, 25],
    [70, 50],
    [-5, 40],
    [15, 48],
    [25, 40],
    [-120, 37],
    [175, -40],
    [-90, 20],
    [125, 12],
    [60, 40],
];

function Norge({ beat, geographies }: { beat: number; geographies: GeoFeature[] }) {
    const vid = beat >= 4;
    const projeksjon = useMemo(() => (vid ? verden() : europa()), [vid]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const n = p(NORGE);
    const gass = p([3.5, 58.5]);
    const overskrift = [
        'Norge: lite, men viktig',
        'Naturgass',
        '57 % av gassreservene i Europa',
        'Sjømat i 2025',
        'Til over 150 land',
    ][Math.min(beat, 4)];
    const farge = (id: string) => {
        if (id === NORGE_ID) return '#1d4ed8';
        return '#cbd5e1';
    };
    return (
        <>
            <AnimatePresence mode="wait">
                <motion.g
                    key={vid ? 'v' : 'e'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Land geographies={geographies} sti={sti} farge={farge} />
                </motion.g>
            </AnimatePresence>
            {!vid && beat === 0 && (
                <Etikett
                    x={n[0] + 90}
                    y={n[1] + 10}
                    tekst="Norge"
                    farge="#1d4ed8"
                    str={44}
                    anker="start"
                />
            )}
            {!vid && beat >= 1 && beat <= 2 && (
                <g transform={`translate(${gass[0]} ${gass[1]})`}>
                    <motion.path
                        d="M 0 30 Q -28 0 0 -40 Q 28 0 0 30 Z"
                        fill="#ea580c"
                        stroke="#7c2d12"
                        strokeWidth={4}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <Etikett
                        x={-50}
                        y={10}
                        tekst="Naturgass"
                        farge="#c2410c"
                        str={40}
                        anker="end"
                    />
                </g>
            )}
            <AnimatePresence>
                {beat === 2 && (
                    <Panel key="gass">
                        <Smultring andel={0.57} x={1300} y={440} />
                        <text
                            x={1300}
                            y={640}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            av gassreservene
                        </text>
                        <text
                            x={1300}
                            y={685}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            i Europa er norske
                        </text>
                    </Panel>
                )}
                {beat === 3 && (
                    <Panel key="fisk">
                        <Fisk x={1300} y={330} s={1.6} />
                        <text
                            x={1300}
                            y={490}
                            textAnchor="middle"
                            fontSize={70}
                            fontWeight={900}
                            fill="#0891b2"
                        >
                            181,5
                        </text>
                        <text
                            x={1300}
                            y={545}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            milliarder kroner
                        </text>
                        <text
                            x={1300}
                            y={620}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={600}
                            fill="#475569"
                        >
                            sjømat solgt i 2025
                        </text>
                    </Panel>
                )}
            </AnimatePresence>
            {!vid && beat === 3 && <Fisk x={n[0] - 120} y={n[1] + 20} />}
            {vid &&
                MAL.map((m, i) => (
                    <Bue
                        key={i}
                        fra={n}
                        til={p(m)}
                        farge="#0891b2"
                        bredde={4}
                        forsinkelse={0.4 + i * 0.08}
                        varighet={1.1}
                        hoyde={0.2}
                    />
                ))}
            {vid && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                >
                    <rect
                        x={60}
                        y={720}
                        width={420}
                        height={120}
                        rx={24}
                        fill="#ffffff"
                        opacity={0.96}
                    />
                    <text
                        x={270}
                        y={795}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#0891b2"
                    >
                        over 150 land
                    </text>
                </motion.g>
            )}
            <Overskrift tekst={overskrift} />
        </>
    );
}

// ---------- sarbar ----------

function Sarbar({ beat, geographies }: { beat: number; geographies: GeoFeature[] }) {
    const projeksjon = useMemo(() => skandinavia(), []);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const n = projeksjon([10, 62]) as [number, number];
    const faller = beat >= 3;
    const farge = (id: string) => (id === NORGE_ID ? (faller ? '#dc2626' : '#1d4ed8') : '#cbd5e1');
    const overskrift = [
        'Liten og åpen økonomi',
        'Uten olje og gass: underskudd',
        'Oljeprisen svinger',
        'Prisen faller ute, vi merker det hjemme',
    ][Math.min(beat, 3)];
    // Piler ut fra Norge: råvarer til utlandet.
    const piler: [number, number][] = [
        [n[0] + 300, n[1] - 160],
        [n[0] + 330, n[1] + 40],
        [n[0] + 260, n[1] + 220],
        [n[0] - 180, n[1] + 260],
    ];
    return (
        <>
            <Land geographies={geographies} sti={sti} farge={farge} />
            {beat === 0 &&
                piler.map((t, i) => (
                    <Bue
                        key={i}
                        fra={n}
                        til={t}
                        farge="#1d4ed8"
                        bredde={8}
                        forsinkelse={0.3 + i * 0.25}
                        hoyde={0.1}
                    />
                ))}
            {beat === 0 && (
                <Etikett
                    x={n[0] + 330}
                    y={n[1] - 190}
                    tekst="Råvarer ut"
                    farge="#1d4ed8"
                    anker="start"
                />
            )}
            <AnimatePresence mode="wait">
                {beat === 1 && <Soyler key="s" />}
                {beat >= 2 && <Oljepris key="o" faller={faller} />}
            </AnimatePresence>
            <Overskrift tekst={overskrift} rod={faller} />
        </>
    );
}

/** To søyler uten tall: det Norge selger (med olje og gass øverst) mot det Norge kjøper. */
function Soyler() {
    const bunn = 760;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <rect x={860} y={160} width={700} height={700} rx={28} fill="#ffffff" opacity={0.96} />
            <text
                x={1210}
                y={220}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#0f172a"
            >
                Varehandelen (uten tall)
            </text>
            <rect x={960} y={bunn - 260} width={180} height={260} fill="#2563eb" />
            <motion.g
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.15 }}
                transition={{ delay: 1.4, duration: 1 }}
            >
                <rect x={960} y={bunn - 480} width={180} height={220} fill="#ea580c" />
            </motion.g>
            <text
                x={1050}
                y={bunn - 500}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill="#c2410c"
            >
                olje og gass
            </text>
            <motion.line
                x1={940}
                y1={bunn - 470}
                x2={1160}
                y2={bunn - 250}
                stroke="#dc2626"
                strokeWidth={12}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
            />
            <rect x={1280} y={bunn - 380} width={180} height={380} fill="#64748b" />
            <text
                x={1050}
                y={bunn + 45}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill="#0f172a"
            >
                Vi selger
            </text>
            <text
                x={1370}
                y={bunn + 45}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill="#0f172a"
            >
                Vi kjøper
            </text>
            <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
                x={1370}
                y={bunn - 410}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#dc2626"
            >
                Underskudd
            </motion.text>
        </motion.g>
    );
}

/** Oljeprisen som en kurve som svinger opp og ned. Bare en illustrasjon. */
function Oljepris({ faller }: { faller: boolean }) {
    const x0 = 900;
    const x1 = 1520;
    const punkter = [0.5, 0.3, 0.6, 0.2, 0.7, 0.35, 0.55, 0.25, 0.65, 0.45];
    const fall = [0.45, 0.6, 0.78, 0.92];
    const y = (v: number) => 300 + v * 420;
    const steg = (x1 - x0) / (punkter.length + fall.length - 1);
    const d = punkter.map((v, i) => `${i ? 'L' : 'M'} ${x0 + i * steg} ${y(1 - v)}`).join(' ');
    const dFall = [punkter[punkter.length - 1], ...fall]
        .map(
            (v, i) =>
                `${i ? 'L' : 'M'} ${x0 + (punkter.length - 1 + i) * steg} ${y(i === 0 ? 1 - v : v)}`
        )
        .join(' ');
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <rect x={860} y={170} width={700} height={640} rx={28} fill="#ffffff" opacity={0.96} />
            <text
                x={1210}
                y={235}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#0f172a"
            >
                Oljeprisen (illustrasjon)
            </text>
            <line x1={x0} y1={740} x2={x1} y2={740} stroke="#94a3b8" strokeWidth={3} />
            <motion.path
                d={d}
                fill="none"
                stroke="#0f172a"
                strokeWidth={8}
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.4, ease: 'linear' }}
            />
            {faller && (
                <motion.path
                    d={dFall}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={10}
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, ease: 'easeIn' }}
                />
            )}
        </motion.g>
    );
}

// ---------- felles ----------

export function GlobalHandelKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = (['reise', 'flaskehalser', 'norge', 'sarbar'] as const).includes(
        props?.modus as Modus
    )
        ? (props?.modus as Modus)
        : 'reise';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => verden(), []);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const verdenFarge = (id: string) => {
        if (modus === 'flaskehalser') {
            const aktive = FLASKEHALSER.filter((f) => beat >= f.fraBeat).flatMap((f) => f.land);
            if (aktive.includes(id)) return '#fca5a5';
        }
        if (modus === 'reise' && id === NORGE_ID) return '#fca5a5';
        return '#cbd5e1';
    };
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#dbeafe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {(modus === 'reise' || modus === 'flaskehalser') && (
                    <Land geographies={geographies} sti={sti} farge={verdenFarge} />
                )}
                {modus === 'reise' && <Reise beat={beat} p={p} />}
                {modus === 'flaskehalser' && <Flaskehalser beat={beat} p={p} />}
                {modus === 'norge' && <Norge beat={beat} geographies={geographies} />}
                {modus === 'sarbar' && <Sarbar beat={beat} geographies={geographies} />}
            </svg>
        </div>
    );
}
