import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { FARGE } from './felles';

/**
 * Kartene i høytidsfilmen.
 * «medina»: Den arabiske halvøya. Muhammad flytter fra Mekka til Medina i 622, og under
 * kartet står månemånedene mot solåret.
 * «india»: Holi om våren i Nord-India, divali, og at feiringene er ulike fra sted til sted.
 * «sapmi»: Nordkalotten, med de åtte årstidene i reindrifta som en ring ved siden av.
 * Områder uten skarpe grenser er uskarpe skyer klippet etter landet (guiden §2).
 */

type Modus = 'medina' | 'india' | 'sapmi';

const B = 1600;
const H = 900;

const RAMME: Record<Modus, Utsnitt> = {
    medina: [
        [28, 13],
        [62, 33],
    ],
    india: [
        [62, 6],
        [100, 36],
    ],
    sapmi: [
        [2, 61],
        [44, 72],
    ],
};

/** Hvor kartet tegnes på flaten. Sápmi-kartet deler bildet med ringen. */
const FLATE: Record<Modus, [[number, number], [number, number]]> = {
    medina: [
        [60, 130],
        [B - 60, 640],
    ],
    india: [
        [60, 130],
        [B - 60, H - 30],
    ],
    sapmi: [
        [40, 150],
        [960, H - 40],
    ],
};

const MEKKA: [number, number] = [39.83, 21.42];
const MEDINA: [number, number] = [39.61, 24.47];

/** Nord-India, grovt: sletta langs Ganges og Punjab. Tegnes uskarp. */
const NORD_INDIA: [number, number][] = [
    [72, 32],
    [77, 33],
    [81, 29.5],
    [88.5, 27],
    [88, 24],
    [82, 23.5],
    [76, 24],
    [71, 26],
    [72, 32],
];

/** Ulike feiringer i ulike deler av India (bare som farger, uten navn). */
const REGIONER: { ll: [number, number]; farge: string }[] = [
    { ll: [76, 29], farge: '#db2777' },
    { ll: [86, 24], farge: '#f59e0b' },
    { ll: [73, 20], farge: '#16a34a' },
    { ll: [78.5, 13], farge: '#2563eb' },
    { ll: [88, 22.5], farge: '#7c3aed' },
    { ll: [76, 10], farge: '#ea580c' },
];

/** Samenes områder, omtrentlig: nord i Norge, Sverige og Finland, og Kolahalvøya. */
const SAPMI: [number, number][] = [
    [10.5, 63.2],
    [14, 66.5],
    [18, 69.8],
    [25, 71.2],
    [31, 70.3],
    [41, 67.8],
    [36, 66.2],
    [30, 67.5],
    [27, 66.8],
    [22, 65.4],
    [17, 63.2],
    [13, 62],
    [10.5, 63.2],
];

const LAND_ID: Record<Modus, string[]> = {
    medina: [],
    india: ['356'],
    sapmi: ['578', '752', '246', '643'],
};

const TEKST: Record<Modus, string[]> = {
    medina: ['Islam: bare månen', 'Fra Mekka til Medina, år 622', 'År 1', 'Månen mot sola'],
    india: [
        'Mange hinduer: måne og sol',
        'Datoen skifter, årstiden står',
        'Holi: våren i Nord-India',
        'Divali: lysfesten',
        'Ulikt fra sted til sted',
    ],
    sapmi: ['En fjerde måte', 'De åtte årstiders folk', 'Året som arbeid', 'Fortsatt i bruk'],
};

function Navn({
    x,
    y,
    tekst,
    farge = FARGE.tekst,
    anker = 'start',
    str = 38,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    str?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

/** Tolv måneder etter månen mot ett år etter sola, som to stenger under kartet. */
function Stenger({ beat }: { beat: number }) {
    const x0 = 200;
    const bred = 1200;
    const maane = (bred * 354) / 365;
    const y = 690;
    return (
        <g>
            <rect
                x={x0 - 30}
                y={y - 30}
                width={bred + 260}
                height={beat >= 3 ? 200 : 110}
                rx={24}
                fill="#ffffff"
                opacity={0.96}
            />
            {Array.from({ length: 12 }, (_, i) => {
                const w = maane / 12;
                return (
                    <g key={i}>
                        <rect
                            x={x0 + i * w + 3}
                            y={y}
                            width={w - 6}
                            height={50}
                            rx={10}
                            fill={FARGE.mane}
                            opacity={0.85}
                        />
                        <circle cx={x0 + i * w + w / 2} cy={y + 25} r={13} fill="#ede9fe" />
                        <circle cx={x0 + i * w + w / 2 + 6} cy={y + 22} r={11} fill={FARGE.mane} />
                    </g>
                );
            })}
            <text x={x0 + bred + 20} y={y + 38} fontSize={30} fontWeight={800} fill={FARGE.mane}>
                354 dager
            </text>
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect
                        x={x0}
                        y={y + 80}
                        width={bred}
                        height={50}
                        rx={10}
                        fill={FARGE.sol}
                        opacity={0.85}
                    />
                    <text
                        x={x0 + bred + 20}
                        y={y + 118}
                        fontSize={30}
                        fontWeight={800}
                        fill={FARGE.sol}
                    >
                        solåret
                    </text>
                    <rect
                        x={x0 + maane}
                        y={y - 6}
                        width={bred - maane}
                        height={62}
                        fill="none"
                        stroke={FARGE.rod}
                        strokeWidth={5}
                    />
                    <text
                        x={x0 + maane - 16}
                        y={y + 168 - 4}
                        textAnchor="end"
                        fontSize={30}
                        fontWeight={900}
                        fill={FARGE.rod}
                    >
                        11 dager mangler hvert år
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/** De åtte årstidene som perler på en ring. Bare de fire artikkelen nevner, får navn. */
function Ring({ beat }: { beat: number }) {
    const cx = 1190;
    const cy = 530;
    const r = 200;
    const navn: Record<
        number,
        { t: string; anker: 'start' | 'end' | 'middle'; dx: number; dy: number }
    > = {
        1: { t: 'kalvingen', anker: 'start', dx: 34, dy: -6 },
        3: { t: 'sommerbeitet', anker: 'start', dx: 30, dy: 30 },
        5: { t: 'paringstiden', anker: 'end', dx: -30, dy: 34 },
        7: { t: 'den mørke vinteren', anker: 'end', dx: -30, dy: -8 },
    };
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <circle cx={cx} cy={cy} r={r + 125} fill="#ffffff" opacity={0.9} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth={6} />
            {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
                const x = cx + Math.cos(a) * r;
                const y = cy + Math.sin(a) * r;
                const n = navn[i];
                const lys = beat >= 2 && n;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: beat === 1 ? i * 0.25 : 0 }}
                    >
                        <circle
                            cx={x}
                            cy={y}
                            r={lys ? 30 : 24}
                            fill={lys ? '#b45309' : '#0f766e'}
                            stroke="#ffffff"
                            strokeWidth={5}
                        />
                        {lys && (
                            <Navn
                                x={x + n.dx}
                                y={y + n.dy}
                                tekst={n.t}
                                anker={n.anker}
                                str={30}
                                farge="#b45309"
                            />
                        )}
                    </motion.g>
                );
            })}
            <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fontSize={64}
                fontWeight={900}
                fill="#0f766e"
            >
                8
            </text>
            <text
                x={cx}
                y={cy + 40}
                textAnchor="middle"
                fontSize={32}
                fontWeight={800}
                fill={FARGE.tekst}
            >
                årstider
            </text>
            {beat >= 3 && (
                <Navn
                    x={cx}
                    y={cy + r + 110}
                    tekst="Mange bruker dem fortsatt"
                    anker="middle"
                    str={34}
                    farge="#0f766e"
                />
            )}
        </motion.g>
    );
}

export function HoytiderKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'medina';
    const ramme = RAMME[modus];
    const { geographies } = useFilmVerden(ramme);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(FLATE[modus], {
                type: 'MultiPoint',
                coordinates: [ramme[0], ramme[1]],
            } as never),
        [modus, ramme]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const ids = LAND_ID[modus];
    const klipp = geographies.filter((g) => ids.includes(String(g.id)));
    const omrade = (pkt: [number, number][]) =>
        sti({ type: 'Polygon', coordinates: [pkt] } as never) ?? '';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    const [mx, my] = p(MEKKA);
    const [dx, dy] = p(MEDINA);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#bfdbfe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <filter id="hoytider-uskarp" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation={modus === 'sapmi' ? 22 : 26} />
                    </filter>
                    <clipPath id="hoytider-land">
                        {klipp.map((g, i) => (
                            <path key={i} d={sti(g as never) ?? undefined} />
                        ))}
                    </clipPath>
                </defs>
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={modus === 'india' && String(g.id) === '356' ? '#fff7ed' : '#f5f0e6'}
                        stroke="#a8a29e"
                        strokeWidth={1.2}
                    />
                ))}

                {modus === 'medina' && (
                    <>
                        <circle
                            cx={mx}
                            cy={my}
                            r={14}
                            fill={FARGE.islam}
                            stroke="#fff"
                            strokeWidth={4}
                        />
                        <Navn x={mx + 26} y={my + 14} tekst="Mekka" />
                        {beat >= 1 && (
                            <>
                                <motion.path
                                    d={`M ${mx} ${my} Q ${mx - 70} ${(my + dy) / 2} ${dx} ${dy}`}
                                    fill="none"
                                    stroke={FARGE.islam}
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.6 }}
                                />
                                <circle
                                    cx={dx}
                                    cy={dy}
                                    r={14}
                                    fill={FARGE.islam}
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <Navn x={dx + 26} y={dy + 4} tekst="Medina" />
                                <Navn
                                    x={mx - 60}
                                    y={(my + dy) / 2 + 12}
                                    tekst="622"
                                    anker="end"
                                    farge={FARGE.islam}
                                    str={44}
                                />
                            </>
                        )}
                        {beat === 2 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    transformOrigin: '1180px 360px',
                                    transformBox: 'view-box',
                                }}
                            >
                                <rect
                                    x={1000}
                                    y={260}
                                    width={360}
                                    height={200}
                                    rx={28}
                                    fill="#ffffff"
                                    stroke={FARGE.islam}
                                    strokeWidth={6}
                                />
                                <text
                                    x={1180}
                                    y={350}
                                    textAnchor="middle"
                                    fontSize={60}
                                    fontWeight={900}
                                    fill={FARGE.islam}
                                >
                                    År 1
                                </text>
                                <text
                                    x={1180}
                                    y={410}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={700}
                                    fill={FARGE.tekst}
                                >
                                    = år 622
                                </text>
                            </motion.g>
                        )}
                        <Stenger beat={beat} />
                    </>
                )}

                {modus === 'india' && (
                    <>
                        {beat === 2 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1 }}
                                clipPath="url(#hoytider-land)"
                            >
                                <path
                                    d={omrade(NORD_INDIA)}
                                    fill="#db2777"
                                    opacity={0.55}
                                    filter="url(#hoytider-uskarp)"
                                />
                                {beat === 2 &&
                                    Array.from({ length: 26 }, (_, i) => {
                                        const ll: [number, number] = [
                                            72 + ((i * 37) % 16),
                                            24.5 + ((i * 13) % 7),
                                        ];
                                        const [x, y] = p(ll);
                                        const farger = [
                                            '#db2777',
                                            '#f59e0b',
                                            '#16a34a',
                                            '#2563eb',
                                            '#7c3aed',
                                        ];
                                        return (
                                            <circle
                                                key={i}
                                                cx={x}
                                                cy={y}
                                                r={9}
                                                fill={farger[i % 5]}
                                                opacity={0.9}
                                            />
                                        );
                                    })}
                            </motion.g>
                        )}
                        {beat === 2 &&
                            (() => {
                                const [x, y] = p([78, 31]);
                                return (
                                    <Navn
                                        x={x + 120}
                                        y={y - 60}
                                        tekst="Holi: Nord-India, om våren"
                                        farge="#be185d"
                                    />
                                );
                            })()}
                        {beat === 3 && (
                            <g clipPath="url(#hoytider-land)">
                                {Array.from({ length: 40 }, (_, i) => {
                                    const ll: [number, number] = [
                                        70 + ((i * 53) % 20),
                                        9 + ((i * 29) % 21),
                                    ];
                                    const [x, y] = p(ll);
                                    return (
                                        <motion.g
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={16}
                                                fill="#fde68a"
                                                opacity={0.5}
                                            />
                                            <circle cx={x} cy={y} r={7} fill="#f59e0b" />
                                        </motion.g>
                                    );
                                })}
                            </g>
                        )}
                        {beat === 3 && (
                            <g>
                                <rect
                                    x={1040}
                                    y={300}
                                    width={500}
                                    height={196}
                                    rx={26}
                                    fill="#ffffff"
                                />
                                <text
                                    x={1070}
                                    y={358}
                                    fontSize={40}
                                    fontWeight={900}
                                    fill="#b45309"
                                >
                                    Divali, lysfesten
                                </text>
                                <text
                                    x={1070}
                                    y={408}
                                    fontSize={32}
                                    fontWeight={700}
                                    fill={FARGE.tekst}
                                >
                                    oktober eller november
                                </text>
                                <text
                                    x={1070}
                                    y={458}
                                    fontSize={30}
                                    fontWeight={700}
                                    fill={FARGE.sikh}
                                >
                                    Sikher: bandi chor divas
                                </text>
                            </g>
                        )}
                        {beat === 4 && (
                            <g clipPath="url(#hoytider-land)">
                                {REGIONER.map((r, i) => {
                                    const [x, y] = p(r.ll);
                                    return (
                                        <motion.circle
                                            key={i}
                                            cx={x}
                                            cy={y}
                                            r={110}
                                            fill={r.farge}
                                            opacity={0.45}
                                            filter="url(#hoytider-uskarp)"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.45 }}
                                            transition={{ delay: i * 0.2 }}
                                        />
                                    );
                                })}
                            </g>
                        )}
                        {beat <= 1 && (
                            <g>
                                <rect
                                    x={1040}
                                    y={300}
                                    width={500}
                                    height={beat === 1 ? 250 : 150}
                                    rx={26}
                                    fill="#ffffff"
                                />
                                <text
                                    x={1070}
                                    y={362}
                                    fontSize={36}
                                    fontWeight={800}
                                    fill={FARGE.mane}
                                >
                                    Månen: dagen
                                </text>
                                <text
                                    x={1070}
                                    y={420}
                                    fontSize={36}
                                    fontWeight={800}
                                    fill={FARGE.sol}
                                >
                                    Sola: årstiden
                                </text>
                                {beat === 1 && (
                                    <>
                                        <text
                                            x={1070}
                                            y={478}
                                            fontSize={30}
                                            fontWeight={700}
                                            fill={FARGE.tekst}
                                        >
                                            Datoen skifter,
                                        </text>
                                        <text
                                            x={1070}
                                            y={520}
                                            fontSize={30}
                                            fontWeight={700}
                                            fill={FARGE.tekst}
                                        >
                                            årstiden står fast
                                        </text>
                                    </>
                                )}
                            </g>
                        )}
                        {(() => {
                            const [x, y] = p([79, 21]);
                            return <Navn x={x} y={y} tekst="India" anker="middle" str={44} />;
                        })()}
                    </>
                )}

                {modus === 'sapmi' && (
                    <>
                        <g clipPath="url(#hoytider-land)">
                            <path
                                d={omrade(SAPMI)}
                                fill="#0f766e"
                                opacity={0.6}
                                filter="url(#hoytider-uskarp)"
                            />
                        </g>
                        {(() => {
                            const [x, y] = p([22, 68.2]);
                            return (
                                <>
                                    <Navn
                                        x={x}
                                        y={y}
                                        tekst="Sápmi"
                                        anker="middle"
                                        str={44}
                                        farge="#115e59"
                                    />
                                    <Navn
                                        x={x}
                                        y={y + 40}
                                        tekst="omtrentlig"
                                        anker="middle"
                                        str={26}
                                        farge={FARGE.dempet}
                                    />
                                </>
                            );
                        })()}
                        {beat === 0 && (
                            <g>
                                <rect
                                    x={1000}
                                    y={340}
                                    width={540}
                                    height={200}
                                    rx={26}
                                    fill="#ffffff"
                                />
                                <text
                                    x={1030}
                                    y={410}
                                    fontSize={36}
                                    fontWeight={800}
                                    fill={FARGE.tekst}
                                >
                                    Ikke måner,
                                </text>
                                <text
                                    x={1030}
                                    y={466}
                                    fontSize={36}
                                    fontWeight={800}
                                    fill={FARGE.tekst}
                                >
                                    ikke soldøgn
                                </text>
                            </g>
                        )}
                        {beat >= 1 && <Ring beat={beat} />}
                    </>
                )}
            </svg>
            <AnimatePresence>
                {modus !== 'india' && (
                    <Oversiktskart
                        utsnitt={ramme}
                        omrade={
                            modus === 'sapmi'
                                ? [
                                      [-25, 42],
                                      [65, 78],
                                  ]
                                : [
                                      [-20, -5],
                                      [90, 50],
                                  ]
                        }
                        plassering={modus === 'sapmi' ? 'nede-venstre' : 'oppe-hoyre'}
                        etikett={modus === 'sapmi' ? 'Nord-Europa' : 'Midtøsten'}
                    />
                )}
            </AnimatePresence>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
