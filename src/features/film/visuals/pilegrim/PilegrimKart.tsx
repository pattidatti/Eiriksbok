import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { FARGE } from './felles';

/**
 * Pilegrimsmålene på kartet.
 * «alle»: fra Atlanterhavskysten til Ganges. Europa, Midtøsten og India tennes etter tur.
 * «europa»: middelalderens kristne mål, nordboernes egne, og Maria-stedene til slutt.
 * «india»: Buddhas fire steder, Varanasi ved Ganges, og Amritsar med dammen.
 */

type Modus = 'alle' | 'europa' | 'india';

const B = 1600;
const H = 900;

interface Mal {
    navn: string;
    ll: [number, number];
    farge: string;
    fraBeat: number;
    /** Hvor etiketten står i forhold til punktet. */
    side?: 'h' | 'v' | 'o' | 'n';
    aar?: string;
}

const MAL: Record<Modus, Mal[]> = {
    alle: [
        { navn: 'Santiago', ll: [-8.55, 42.88], farge: FARGE.kristen, fraBeat: 1, side: 'n' },
        { navn: 'Roma', ll: [12.5, 41.9], farge: FARGE.kristen, fraBeat: 1, side: 'n' },
        { navn: 'Nidaros', ll: [10.4, 63.43], farge: FARGE.kristen, fraBeat: 1, side: 'v' },
        { navn: 'Mekka', ll: [39.83, 21.42], farge: FARGE.abraham, fraBeat: 2, side: 'h' },
        { navn: 'Jerusalem', ll: [35.23, 31.78], farge: FARGE.abraham, fraBeat: 2, side: 'h' },
        { navn: 'Haifa', ll: [34.99, 32.82], farge: FARGE.abraham, fraBeat: 2, side: 'v' },
        { navn: 'Amritsar', ll: [74.87, 31.63], farge: FARGE.india, fraBeat: 3, side: 'o' },
        { navn: 'Varanasi', ll: [83.01, 25.32], farge: FARGE.india, fraBeat: 3, side: 'v' },
        { navn: 'Bodh Gaya', ll: [84.99, 24.7], farge: FARGE.india, fraBeat: 3, side: 'n' },
    ],
    europa: [
        { navn: 'Jerusalem og Betlehem', ll: [35.23, 31.75], farge: FARGE.kristen, fraBeat: 1, side: 'n' },
        { navn: 'Roma', ll: [12.5, 41.9], farge: FARGE.kristen, fraBeat: 1, side: 'n' },
        { navn: 'Santiago', ll: [-8.55, 42.88], farge: FARGE.kristen, fraBeat: 2, side: 'v' },
        { navn: 'Canterbury', ll: [1.08, 51.28], farge: FARGE.kristen, fraBeat: 2, side: 'v' },
        { navn: 'Nidaros', ll: [10.4, 63.43], farge: FARGE.kristen, fraBeat: 3, side: 'h' },
        { navn: 'Røldal', ll: [6.82, 59.83], farge: FARGE.kristen, fraBeat: 3, side: 'v' },
        { navn: 'Odense', ll: [10.39, 55.4], farge: FARGE.kristen, fraBeat: 3, side: 'h' },
        { navn: 'Lourdes', ll: [-0.05, 43.09], farge: FARGE.maria, fraBeat: 4, side: 'o', aar: '1858' },
        { navn: 'Fátima', ll: [-8.67, 39.63], farge: FARGE.maria, fraBeat: 4, side: 'n', aar: '1917' },
        { navn: 'Medjugorje', ll: [17.68, 43.19], farge: FARGE.maria, fraBeat: 4, side: 'h', aar: '1981' },
    ],
    india: [
        { navn: 'Lumbini', ll: [83.28, 27.48], farge: FARGE.india, fraBeat: 0, side: 'o', aar: 'født' },
        { navn: 'Bodh Gaya', ll: [84.99, 24.7], farge: FARGE.india, fraBeat: 1, side: 'n', aar: 'klar innsikt' },
        { navn: 'Sarnath', ll: [83.02, 25.38], farge: FARGE.india, fraBeat: 2, side: 'v', aar: 'første tale' },
        { navn: 'Kushinagar', ll: [83.89, 26.74], farge: FARGE.india, fraBeat: 2, side: 'h', aar: 'døde' },
        { navn: 'Amritsar', ll: [74.87, 31.63], farge: '#ca8a04', fraBeat: 3, side: 'h', aar: 'nektardammen' },
    ],
};

const RAMME: Record<Modus, Utsnitt> = {
    alle: [
        [-12, 6],
        [92, 66],
    ],
    europa: [
        [-18, 27],
        [44, 66],
    ],
    india: [
        [71, 21],
        [91, 33.5],
    ],
};

/** Ganges, forenklet, fra fjellene til havet. */
const GANGES: [number, number][] = [
    [78.17, 29.95],
    [79.4, 27.6],
    [80.35, 26.47],
    [81.85, 25.43],
    [83.01, 25.32],
    [85.1, 25.6],
    [87.2, 25.2],
    [88.1, 24.0],
    [88.3, 22.2],
];

const TEKST: Record<Modus, string[]> = {
    alle: [
        'Fra Atlanterhavet til Ganges',
        'Europa',
        'Midtøsten',
        'India',
        'Steder der det hellige regnes som nærmere',
    ],
    europa: [
        'Kristendommen: ingen plikt',
        'Middelalderen: Jerusalem, Betlehem og Roma',
        'Jakobs grav og Thomas Beckets grav',
        'Nordboernes egne mål',
        'Steder knyttet til jomfru Maria',
    ],
    india: [
        'Buddhismen: der Buddha levde',
        'Bodh Gaya: det viktigste stedet',
        'Første tale og død',
        'Sikhismen: Amritsar',
        'Gratis mat til over 100 000 hver dag',
    ],
};

function Etikett({
    x,
    y,
    mal,
    lys,
}: {
    x: number;
    y: number;
    mal: Mal;
    lys: boolean;
}) {
    const side = mal.side ?? 'h';
    const dx = side === 'h' ? 26 : side === 'v' ? -26 : 0;
    const dy = side === 'o' ? (mal.aar ? -62 : -30) : side === 'n' ? 52 : 12;
    const anker = side === 'h' ? 'start' : side === 'v' ? 'end' : 'middle';
    return (
        <g opacity={lys ? 1 : 0.55}>
            <text
                x={x + dx}
                y={y + dy}
                textAnchor={anker}
                fontSize={36}
                fontWeight={900}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {mal.navn}
            </text>
            {mal.aar && (
                <text
                    x={x + dx}
                    y={y + dy + 36}
                    textAnchor={anker}
                    fontSize={30}
                    fontWeight={800}
                    fill={mal.farge}
                    stroke="#ffffff"
                    strokeWidth={7}
                    paintOrder="stroke"
                >
                    {mal.aar}
                </text>
            )}
        </g>
    );
}

export function PilegrimKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'alle';
    const { geographies } = useFilmVerden(modus === 'india' ? RAMME.india : undefined);
    const ramme = RAMME[modus];
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 120],
                    [B - 60, H - 30],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [ramme[0], ramme[1]],
                } as never
            ),
        [ramme]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    const alleLyser = modus === 'alle' && beat >= 4;
    const ganges = sti({ type: 'LineString', coordinates: GANGES } as never) ?? '';
    const sistBeat = Math.max(...MAL[modus].map((m) => m.fraBeat));
    const amritsar = p([74.87, 31.63]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#bfdbfe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill="#f5f0e6"
                        stroke="#a8a29e"
                        strokeWidth={1}
                    />
                ))}
                {(modus === 'india' || (modus === 'alle' && beat >= 3)) && (
                    <path d={ganges} fill="none" stroke="#2563eb" strokeWidth={modus === 'india' ? 7 : 4} strokeLinecap="round" />
                )}
                {modus === 'india' && (
                    <text
                        x={p([87.6, 23.4])[0] + 14}
                        y={p([87.6, 23.4])[1]}
                        fontSize={34}
                        fontWeight={800}
                        fontStyle="italic"
                        fill="#1d4ed8"
                        stroke="#ffffff"
                        strokeWidth={6}
                        paintOrder="stroke"
                    >
                        Ganges
                    </text>
                )}
                {modus === 'alle' && beat === 0 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <line
                            strokeDasharray="4 16"
                            x1={p([-9.5, 40])[0]}
                            y1={p([-9.5, 40])[1]}
                            x2={p([88, 24])[0]}
                            y2={p([88, 24])[1]}
                            stroke="#0f172a"
                            strokeWidth={6}
                            strokeLinecap="round"
                        />
                        <circle cx={p([-9.5, 40])[0]} cy={p([-9.5, 40])[1]} r={14} fill="#0f172a" />
                        <circle cx={p([88, 24])[0]} cy={p([88, 24])[1]} r={14} fill="#0f172a" />
                        <text
                            x={p([-9.5, 40])[0] - 10}
                            y={p([-9.5, 40])[1] - 34}
                            fontSize={36}
                            fontWeight={900}
                            fill="#0f172a"
                            stroke="#ffffff"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            Atlanterhavskysten
                        </text>
                        <text
                            x={p([88, 24])[0] - 10}
                            y={p([88, 24])[1] + 62}
                            textAnchor="end"
                            fontSize={36}
                            fontWeight={900}
                            fill="#0f172a"
                            stroke="#ffffff"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            Ganges
                        </text>
                    </motion.g>
                )}
                {MAL[modus]
                    .filter((m) => m.fraBeat <= beat)
                    .map((m) => {
                        const [x, y] = p(m.ll);
                        const ny = m.fraBeat === beat || alleLyser;
                        return (
                            <motion.g
                                key={m.navn}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                                style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
                            >
                                {ny && (
                                    <circle cx={x} cy={y} r={30} fill={m.farge} opacity={0.25}>
                                        <animate
                                            attributeName="r"
                                            values="18;38;18"
                                            dur="2.4s"
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                )}
                                <circle cx={x} cy={y} r={14} fill={m.farge} stroke="#fff" strokeWidth={4} />
                                <Etikett x={x} y={y} mal={m} lys={ny || beat >= sistBeat} />
                            </motion.g>
                        );
                    })}
                {modus === 'india' && beat >= 3 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {/* Dammen med Det gylne tempel i midten */}
                        <rect x={amritsar[0] - 60} y={amritsar[1] + 70} width={340} height={beat >= 4 ? 300 : 220} rx={24} fill="#ffffff" opacity={0.95} />
                        <rect x={amritsar[0] - 30} y={amritsar[1] + 95} width={280} height={150} rx={10} fill="#60a5fa" />
                        <rect x={amritsar[0] + 85} y={amritsar[1] + 140} width={50} height={60} fill="#eab308" />
                        <path
                            d={`M ${amritsar[0] + 80} ${amritsar[1] + 142} Q ${amritsar[0] + 110} ${amritsar[1] + 100} ${amritsar[0] + 140} ${amritsar[1] + 142} Z`}
                            fill="#ca8a04"
                        />
                        {beat >= 4 && (
                            <>
                                <text x={amritsar[0] + 110} y={amritsar[1] + 300} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a">
                                    Langar: kjøkkenet
                                </text>
                                <text x={amritsar[0] + 110} y={amritsar[1] + 340} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                                    i Det gylne tempel
                                </text>
                            </>
                        )}
                    </motion.g>
                )}
            </svg>
            <AnimatePresence>
                {modus === 'india' && (
                    <Oversiktskart
                        utsnitt={RAMME.india}
                        omrade={[
                            [40, 5],
                            [110, 45],
                        ]}
                        plassering="nede-venstre"
                        etikett="Sør-Asia"
                    />
                )}
            </AnimatePresence>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
