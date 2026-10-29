import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import { rammePunkter } from '../../kart/grenser';
import type { VisualProps } from '../../types';
import { B, BLA, Etikett, H, HAV, LAND, Land, type LngLat, Overskrift, ROD, Ring } from './felles';
import { id as landId, OSTBLOKK, SOVJET, VESTEUROPA } from './data';

/**
 * Europakartet i filmen om den kalde krigen. Fire moduser:
 * - «jernteppet»: Jalta og Potsdam, landene Stalin tok, og linja fra Stettin til Trieste.
 * - «tyskland»: de fire sonene, som blir Vest- og Øst-Tyskland, og Berlin delt i to.
 * - «luftbro»: veiene til Vest-Berlin stenges, og flyene kommer i stedet.
 * - «oppror»: Ungarn 1956, Praha-våren 1968 og Bresjnev-doktrinen.
 */

type Modus = 'jernteppet' | 'tyskland' | 'luftbro' | 'oppror';

const UTSNITT: Record<Modus, Utsnitt> = {
    jernteppet: [
        [-10, 36],
        [42, 61],
    ],
    tyskland: [
        [3.5, 47],
        [17.5, 55.2],
    ],
    luftbro: [
        [6, 50.2],
        [15.5, 54.4],
    ],
    oppror: [
        [4, 41.5],
        [44, 58],
    ],
};

const TYSKLAND = '276';
const POLEN = '616';
const UNGARN = '348';
const TSJEKKIA = '203';
const SLOVAKIA = '703';

const NOYTRAL = LAND;
const LYSBLA = '#bfdbfe';

/** Jernteppet slik Churchill beskrev det: fra Stettin til Trieste. */
const JERNTEPPET: LngLat[] = [
    [14.55, 53.43],
    [14.0, 51.6],
    [12.4, 50.3],
    [13.8, 48.7],
    [16.9, 48.1],
    [16.3, 46.7],
    [13.77, 45.65],
];

// Sonene i Tyskland etter 1945, grovt tegnet og klippet etter landegrensa.
const INDRE_GRENSE: LngLat[] = [
    [10.9, 54.0],
    [10.75, 53.6],
    [11.0, 53.2],
    [11.6, 53.0],
    [11.25, 52.85],
    [10.95, 52.6],
    [10.6, 52.0],
    [10.6, 51.6],
    [10.2, 51.35],
    [9.95, 51.2],
    [10.1, 50.9],
    [10.05, 50.6],
    [10.5, 50.4],
    [11.25, 50.35],
    [11.6, 50.4],
    [12.1, 50.25],
];
const SONER: { navn: string; farge: string; punkter: LngLat[]; merke: LngLat }[] = [
    {
        navn: 'Storbritannia',
        farge: '#0891b2',
        merke: [8.6, 52.6],
        punkter: [
            [5.5, 50.3],
            [6.4, 50.3],
            [7.2, 50.6],
            [7.8, 50.9],
            [8.6, 51.4],
            [9.6, 51.6],
            [9.95, 51.2],
            ...INDRE_GRENSE.slice(0, 9).reverse(),
            [10.9, 56],
            [5.5, 56],
        ],
    },
    {
        navn: 'USA',
        farge: '#1d4ed8',
        merke: [11.3, 48.9],
        punkter: [
            [7.8, 50.9],
            [8.6, 51.4],
            [9.6, 51.6],
            ...INDRE_GRENSE.slice(9),
            [12.6, 50.3],
            [13.6, 50.55],
            [15, 50.8],
            [15, 47],
            [10.2, 47.3],
            [10.0, 48.45],
            [9.0, 48.8],
            [8.3, 48.9],
            [8.4, 49.5],
            [8.1, 50.0],
        ],
    },
    {
        navn: 'Frankrike',
        farge: '#7c3aed',
        merke: [7.3, 49.1],
        punkter: [
            [5.5, 50.3],
            [6.4, 50.3],
            [7.2, 50.6],
            [7.8, 50.9],
            [8.1, 50.0],
            [8.4, 49.5],
            [8.3, 48.9],
            [9.0, 48.8],
            [10.0, 48.45],
            [10.2, 47.3],
            [10, 46],
            [5.5, 46],
        ],
    },
    {
        navn: 'Sovjetunionen',
        farge: ROD,
        merke: [12.9, 51.4],
        punkter: [
            [10.9, 56],
            ...INDRE_GRENSE,
            [12.6, 50.3],
            [13.6, 50.55],
            [15, 50.8],
            [20, 50.8],
            [20, 56],
        ],
    },
];

/** Grensa mellom øst og vest slik den ble stående: Tyskland, Tsjekkoslovakia og Ungarn. */
const GRENSA: LngLat[] = [
    ...INDRE_GRENSE,
    [12.5, 49.8],
    [13.0, 49.3],
    [13.8, 48.75],
    [14.7, 48.6],
    [15.0, 49.0],
    [16.0, 48.75],
    [16.9, 48.6],
    [17.1, 48.0],
    [16.5, 47.5],
    [16.1, 46.85],
];

const BERLIN: LngLat = [13.4, 52.52];
/** Veier, jernbaner og kanaler fra vest inn til Berlin, grovt tegnet. */
const VEIER: { fra: LngLat; navn?: string }[] = [
    { fra: [10.0, 53.55], navn: 'Hamburg' },
    { fra: [9.73, 52.37], navn: 'Hannover' },
    { fra: [8.68, 50.11], navn: 'Frankfurt' },
];

function fargeFor(modus: Modus, beat: number, id: string): string {
    const sovjet = SOVJET.includes(id);
    const ost = OSTBLOKK.includes(id);
    if (modus === 'jernteppet') {
        if (sovjet) return beat >= 1 ? ROD : NOYTRAL;
        if (id === POLEN || id === UNGARN || id === TSJEKKIA || id === SLOVAKIA)
            return beat >= 2 ? ROD : NOYTRAL;
        if (ost) return beat >= 4 ? ROD : NOYTRAL;
        if (VESTEUROPA.includes(id) && id !== '756' && id !== '752' && id !== '040')
            return beat >= 1 ? BLA : NOYTRAL;
        return NOYTRAL;
    }
    if (modus === 'oppror') {
        if (sovjet) return '#991b1b';
        if (id === UNGARN) return beat >= 1 ? '#f59e0b' : ROD;
        if (id === TSJEKKIA || id === SLOVAKIA) return beat >= 2 ? '#f59e0b' : ROD;
        if (ost) return ROD;
        if (VESTEUROPA.includes(id)) return LYSBLA;
        return NOYTRAL;
    }
    // Tyskland og luftbro: Tyskland tegnes for seg med sonene oppå.
    return id === TYSKLAND ? '#e2e8f0' : NOYTRAL;
}

const OVERSKRIFT: Record<Modus, (string | null)[]> = {
    jernteppet: [
        'Jalta og Potsdam, 1945',
        'Frie valg, eller en sone?',
        'Stalin tar kontroll',
        'Churchill, 1946: jernteppet',
        'Europa delt i to',
    ],
    tyskland: ['Fire soner', 'Vest-Tyskland', 'Øst-Tyskland', 'Berlin, delt i to'],
    luftbro: [
        'Nye penger i vest: D-mark',
        'Stalin stenger veiene',
        'En by uten forsyninger',
        'Luftbroen: et fly hvert minutt',
        'Mai 1949: veiene åpnes',
    ],
    oppror: [
        'Østblokken',
        'Ungarn, 1956',
        'Praha-våren, 1968',
        'Bresjnev-doktrinen',
        'Holdt oppe med makt',
    ],
};

export function KaldkrigKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'jernteppet';
    const fint = modus === 'tyskland' || modus === 'luftbro';
    const { geographies } = useFilmVerden(fint ? UTSNITT[modus] : undefined);

    const projeksjon = useMemo(() => {
        const [sv, no] = UTSNITT[modus];
        return geoMercator().fitExtent(
            [
                [30, 30],
                [B - 30, H - 30],
            ],
            rammePunkter(sv, no) as never
        );
    }, [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = useCallback((ll: LngLat) => projeksjon(ll) as [number, number], [projeksjon]);
    const farge = useCallback((id: string) => fargeFor(modus, beat, id), [modus, beat]);
    const tyskland = useMemo(() => geographies.find((g) => landId(g) === TYSKLAND), [geographies]);
    const linje = (pts: LngLat[]) => 'M ' + pts.map((pt) => p(pt).join(' ')).join(' L ');

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    {tyskland && (
                        <clipPath id="kaldkrig-tyskland">
                            <path d={sti(tyskland as never) ?? ''} />
                        </clipPath>
                    )}
                </defs>
                <Land geographies={geographies} sti={sti} farge={farge} />
                {modus === 'jernteppet' && <Jernteppet beat={beat} p={p} linje={linje} />}
                {(modus === 'tyskland' || modus === 'luftbro') && (
                    <Soner beat={beat} modus={modus} p={p} />
                )}
                {modus === 'tyskland' && <Tyskland beat={beat} p={p} />}
                {modus === 'luftbro' && <Luftbro beat={beat} p={p} playing={playing} />}
                {modus === 'oppror' && (
                    <g clipPath="url(#kaldkrig-tyskland)">
                        <path
                            d={linje(SONER[3].punkter) + ' Z'}
                            fill={ROD}
                            stroke="#ffffff"
                            strokeWidth={1}
                        />
                    </g>
                )}
                {modus === 'oppror' && <Oppror beat={beat} p={p} linje={linje} />}
            </svg>
            <Overskrift tekst={OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)]} />
            {fint && (
                <Oversiktskart
                    utsnitt={UTSNITT[modus]}
                    omrade={[
                        [-10, 36],
                        [40, 66],
                    ]}
                    etikett="Europa"
                    plassering="oppe-venstre"
                />
            )}
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

function Jernteppet({ beat, p, linje }: { beat: number; p: P; linje: (pts: LngLat[]) => string }) {
    const jalta = p([34.16, 44.5]);
    const potsdam = p([13.06, 52.4]);
    const stettin = p(JERNTEPPET[0]);
    const trieste = p(JERNTEPPET[JERNTEPPET.length - 1]);
    const lander: { ll: LngLat; navn: string; fra: number }[] = [
        { ll: [19.4, 52.1], navn: 'Polen', fra: 2 },
        { ll: [15.4, 49.6], navn: 'Tsjekkoslovakia', fra: 2 },
        { ll: [19.4, 47.1], navn: 'Ungarn', fra: 2 },
    ];
    return (
        <>
            <Ring x={jalta[0]} y={jalta[1]} farge="#0f172a" synlig={beat === 0} />
            <Etikett x={jalta[0]} y={jalta[1] + 64} tekst="Jalta" synlig={beat === 0} />
            <Ring x={potsdam[0]} y={potsdam[1]} farge="#0f172a" synlig={beat === 0} />
            <Etikett
                x={potsdam[0] - 44}
                y={potsdam[1] + 10}
                tekst="Potsdam"
                anker="end"
                synlig={beat === 0}
            />
            <Etikett
                x={p([-3, 47])[0]}
                y={p([-3, 47])[1]}
                tekst="Frie valg"
                farge="#1e3a8a"
                storrelse={34}
                synlig={beat === 1}
            />
            <Etikett
                x={p([36, 55])[0]}
                y={p([36, 55])[1]}
                tekst="Stalin"
                farge="#7f1d1d"
                storrelse={38}
                synlig={beat >= 1 && beat <= 2}
            />
            {lander.map((l) => {
                const xy = p(l.ll);
                return (
                    <Etikett key={l.navn} x={xy[0]} y={xy[1]} tekst={l.navn} synlig={beat === 2} />
                );
            })}
            <motion.path
                d={linje(JERNTEPPET)}
                fill="none"
                stroke="#111827"
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 2.4, ease: 'easeInOut' }}
            />
            <Etikett
                x={stettin[0] + 26}
                y={stettin[1] - 22}
                tekst="Stettin"
                anker="start"
                synlig={beat >= 3}
            />
            <Etikett
                x={trieste[0] - 26}
                y={trieste[1] + 44}
                tekst="Trieste"
                anker="end"
                synlig={beat >= 3}
            />
            <Etikett
                x={p([0, 50])[0]}
                y={p([0, 50])[1]}
                tekst="VEST"
                farge={BLA}
                storrelse={56}
                synlig={beat >= 4}
            />
            <Etikett
                x={p([30, 50])[0]}
                y={p([30, 50])[1]}
                tekst="ØST"
                farge="#7f1d1d"
                storrelse={56}
                synlig={beat >= 4}
            />
        </>
    );
}

function Soner({ beat, modus, p }: { beat: number; modus: Modus; p: P }) {
    const vestSamlet = modus === 'luftbro' || beat >= 1;
    return (
        <g clipPath="url(#kaldkrig-tyskland)">
            {SONER.map((s) => {
                const vest = s.navn !== 'Sovjetunionen';
                const f = vest ? (vestSamlet ? BLA : s.farge) : ROD;
                return (
                    <motion.path
                        key={s.navn}
                        d={'M ' + s.punkter.map((pt) => p(pt).join(' ')).join(' L ') + ' Z'}
                        initial={false}
                        animate={{ fill: f, opacity: modus === 'luftbro' ? 0.45 : 0.85 }}
                        transition={{ duration: 0.9 }}
                        stroke="#ffffff"
                        strokeWidth={vest && vestSamlet ? 0 : 3}
                    />
                );
            })}
        </g>
    );
}

function Tyskland({ beat, p }: { beat: number; p: P }) {
    const berlin = p(BERLIN);
    return (
        <>
            {SONER.map((s) => {
                const xy = p(s.merke);
                return (
                    <Etikett
                        key={s.navn}
                        x={xy[0]}
                        y={xy[1]}
                        tekst={s.navn}
                        synlig={beat === 0}
                        storrelse={32}
                    />
                );
            })}
            <Etikett
                x={p([8.2, 50.1])[0]}
                y={p([8.2, 50.1])[1]}
                tekst="Vest-Tyskland"
                storrelse={44}
                synlig={beat >= 1}
                farge="#1e3a8a"
            />
            <Etikett
                x={p([12.6, 51.3])[0]}
                y={p([12.6, 51.3])[1]}
                tekst="Øst-Tyskland"
                storrelse={40}
                synlig={beat >= 2}
                farge="#7f1d1d"
            />
            {/* Berlin: først én prikk, så delt i to */}
            <motion.g
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: beat >= 3 ? 1 : 0.9, scale: 1 }}
                style={{ transformOrigin: `${berlin[0]}px ${berlin[1]}px` }}
            >
                {beat >= 3 ? (
                    <>
                        <path
                            d={`M ${berlin[0]} ${berlin[1] - 34} A 34 34 0 0 0 ${berlin[0]} ${berlin[1] + 34} Z`}
                            fill={BLA}
                            stroke="#ffffff"
                            strokeWidth={4}
                        />
                        <path
                            d={`M ${berlin[0]} ${berlin[1] - 34} A 34 34 0 0 1 ${berlin[0]} ${berlin[1] + 34} Z`}
                            fill={ROD}
                            stroke="#ffffff"
                            strokeWidth={4}
                        />
                    </>
                ) : (
                    <circle
                        cx={berlin[0]}
                        cy={berlin[1]}
                        r={14}
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth={4}
                    />
                )}
            </motion.g>
            <Etikett
                x={berlin[0] + 52}
                y={berlin[1] - 34}
                tekst="Berlin"
                anker="start"
                storrelse={beat >= 3 ? 40 : 30}
            />
        </>
    );
}

function Luftbro({ beat, p, playing }: { beat: number; p: P; playing: boolean }) {
    const berlin = p(BERLIN);
    const stengt = beat >= 1 && beat <= 3;
    return (
        <>
            {VEIER.map((v, i) => {
                const fra = p(v.fra);
                const midt: [number, number] = [
                    fra[0] + (berlin[0] - fra[0]) * 0.55,
                    fra[1] + (berlin[1] - fra[1]) * 0.55,
                ];
                return (
                    <g key={i}>
                        <motion.line
                            x1={fra[0]}
                            y1={fra[1]}
                            x2={berlin[0]}
                            y2={berlin[1]}
                            strokeWidth={9}
                            strokeLinecap="round"
                            initial={false}
                            animate={{
                                stroke: stengt ? '#94a3b8' : beat >= 4 ? '#16a34a' : '#475569',
                            }}
                            transition={{ duration: 0.8 }}
                        />
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: stengt ? 1 : 0 }}
                            transition={{ duration: 0.4, delay: stengt ? i * 0.25 : 0 }}
                            transform={`translate(${midt[0]} ${midt[1]})`}
                            stroke={ROD}
                            strokeWidth={10}
                            strokeLinecap="round"
                        >
                            <line x1={-20} y1={-20} x2={20} y2={20} />
                            <line x1={20} y1={-20} x2={-20} y2={20} />
                        </motion.g>
                        <circle cx={fra[0]} cy={fra[1]} r={9} fill="#0f172a" />
                        {v.navn && (
                            <Etikett
                                x={fra[0] - 18}
                                y={fra[1] + 10}
                                tekst={v.navn}
                                anker="end"
                                storrelse={28}
                            />
                        )}
                    </g>
                );
            })}
            {/* D-mark i vest */}
            {[
                [8.2, 52.9],
                [8.3, 51.5],
                [9.6, 50.6],
            ].map((ll, i) => {
                const xy = p(ll as LngLat);
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 0 ? 1 : 0 }}
                        transition={{ duration: 0.5, delay: beat === 0 ? 0.5 + i * 0.4 : 0 }}
                    >
                        <rect
                            x={xy[0] - 72}
                            y={xy[1] - 26}
                            width={144}
                            height={52}
                            rx={8}
                            fill="#fef9c3"
                            stroke="#a16207"
                            strokeWidth={3}
                        />
                        <text
                            x={xy[0]}
                            y={xy[1] + 10}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={900}
                            fill="#713f12"
                        >
                            D-mark
                        </text>
                    </motion.g>
                );
            })}
            {beat >= 3 &&
                beat <= 3 &&
                [0, 1, 2].map((rute) =>
                    [0, 1, 2, 3].map((n) => (
                        <Fly
                            key={`${rute}-${n}`}
                            fra={p(VEIER[rute].fra)}
                            til={berlin}
                            forsinkelse={n * 0.8 + rute * 0.27}
                            playing={playing}
                            start={n / 4}
                        />
                    ))
                )}
            <motion.circle
                cx={berlin[0]}
                cy={berlin[1]}
                r={34}
                initial={false}
                animate={{ fill: beat === 2 ? '#64748b' : BLA }}
                stroke="#ffffff"
                strokeWidth={5}
            />
            <Etikett
                x={berlin[0] + 50}
                y={berlin[1] + 12}
                tekst="Vest-Berlin"
                anker="start"
                storrelse={36}
            />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                {['Ingen mat', 'Ingen kull', 'Ingen medisiner'].map((t, i) => (
                    <Etikett
                        key={t}
                        x={berlin[0] + 50}
                        y={berlin[1] + 70 + i * 46}
                        tekst={t}
                        anker="start"
                        farge="#7f1d1d"
                        storrelse={32}
                    />
                ))}
            </motion.g>
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 3 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                {['Mat', 'Kull', 'Medisiner'].map((t, i) => (
                    <Etikett
                        key={t}
                        x={berlin[0] + 50}
                        y={berlin[1] + 70 + i * 46}
                        tekst={t}
                        anker="start"
                        farge="#14532d"
                        storrelse={32}
                    />
                ))}
            </motion.g>
        </>
    );
}

/** Et lite fly som flyr fra vest inn til Berlin, om og om igjen. */
function Fly({
    fra,
    til,
    forsinkelse,
    playing,
    start,
}: {
    fra: [number, number];
    til: [number, number];
    forsinkelse: number;
    playing: boolean;
    start: number;
}) {
    const vinkel = (Math.atan2(til[1] - fra[1], til[0] - fra[0]) * 180) / Math.PI;
    const at = (t: number) => [fra[0] + (til[0] - fra[0]) * t, fra[1] + (til[1] - fra[1]) * t];
    const s = at(start);
    return (
        <motion.g
            initial={{ x: s[0], y: s[1] }}
            animate={
                playing
                    ? { x: [fra[0], til[0]], y: [fra[1], til[1]], opacity: [0, 1, 1, 0] }
                    : { x: s[0], y: s[1], opacity: 1 }
            }
            transition={{
                duration: 3.2,
                delay: forsinkelse,
                repeat: playing ? Infinity : 0,
                ease: 'linear',
            }}
        >
            <g transform={`rotate(${vinkel})`}>
                <path
                    d="M 22 0 L 6 -4 L -2 -22 L -9 -22 L -4 -4 L -16 -3 L -21 -11 L -26 -11 L -22 0 L -26 11 L -21 11 L -16 3 L -4 4 L -9 22 L -2 22 L 6 4 Z"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                />
            </g>
        </motion.g>
    );
}

function Oppror({ beat, p, linje }: { beat: number; p: P; linje: (pts: LngLat[]) => string }) {
    const ungarn = p([19.2, 47.1]);
    const praha = p([14.42, 50.08]);
    const moskva = p([37.6, 55.75]);
    const mal: LngLat[] = [
        [19.4, 52.1],
        [19.2, 47.1],
        [15.4, 49.7],
        [25, 45.9],
        [25.3, 42.7],
        [12.5, 51.8],
    ];
    return (
        <>
            <Etikett
                x={p([24, 52])[0]}
                y={p([24, 52])[1]}
                tekst="Østblokken"
                storrelse={40}
                synlig={beat === 0}
            />
            <Ring x={ungarn[0]} y={ungarn[1]} farge="#0f172a" synlig={beat >= 1} />
            <Etikett
                x={ungarn[0] + 40}
                y={ungarn[1] + 64}
                tekst="Ungarn"
                anker="start"
                synlig={beat >= 1}
            />
            <Ring x={praha[0]} y={praha[1]} farge="#0f172a" synlig={beat >= 2} />
            <Etikett
                x={praha[0]}
                y={praha[1] - 46}
                tekst="Praha"
                anker="middle"
                synlig={beat >= 2}
            />
            <Ring x={moskva[0]} y={moskva[1]} farge="#ffffff" synlig={beat >= 3} />
            <Etikett
                x={moskva[0] - 40}
                y={moskva[1] - 36}
                tekst="Moskva"
                anker="end"
                synlig={beat >= 3}
            />
            {mal.map((m, i) => {
                const til = p(m);
                const fra = moskva;
                return (
                    <motion.line
                        key={i}
                        x1={fra[0]}
                        y1={fra[1]}
                        x2={fra[0] + (til[0] - fra[0]) * 0.92}
                        y2={fra[1] + (til[1] - fra[1]) * 0.92}
                        stroke="#111827"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: beat >= 3 ? 1 : 0, opacity: beat === 3 ? 1 : 0 }}
                        transition={{ duration: 1.2, delay: beat === 3 ? i * 0.15 : 0 }}
                    />
                );
            })}
            <motion.path
                d={linje(GRENSA)}
                fill="none"
                stroke="#111827"
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: beat >= 4 ? 1 : 0 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
            />
            <Etikett
                x={p([8, 49])[0]}
                y={p([8, 49])[1]}
                tekst="Jernteppet"
                storrelse={36}
                synlig={beat >= 4}
                anker="end"
            />
        </>
    );
}
