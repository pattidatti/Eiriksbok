import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over handelen i Romerriket, i fire moduser. Kartet står til venstre, og et nytt kort
 * kommer til i høyre kolonne for hver beat.
 *
 * «korn»: Roma med kanskje én million mennesker, Egypt lyser, kornskipene går til Italia.
 * «monsun»: sjøveien fra Rødehavet til India. Vindpilene snur med årstiden, og skipet
 * seiler ut og hjem med vinden. Til slutt videre over land til Middelhavet.
 * «rav»: kysten mellom Gdańsk og Klaipeda, og Rav-veien ned til Middelhavet.
 * «slaver»: hvor fangene kom fra. Bare steder og navn, ingen mennesker i bildet.
 */

type Modus = 'korn' | 'monsun' | 'rav' | 'slaver';
type LngLat = [number, number];
type Pkt = [number, number];

const B = 1600;
const H = 900;
const GULL = '#b45309';
const LILLA = '#7e22ce';
const BLAA = '#0369a1';
const ROD = '#991b1b';
const RAV = '#d97706';

const ROMA: LngLat = [12.5, 41.9];
const OSTIA: LngLat = [12.29, 41.75];
const ALEKSANDRIA: LngLat = [29.9, 31.3];
const NORD_AFRIKA: LngLat = [10.2, 37];
const RODEHAVET_HAVN: LngLat = [35.6, 24];
const INDIA_HAVN: LngLat = [75.2, 12.5];
const GDANSK: LngLat = [18.65, 54.35];
const KLAIPEDA: LngLat = [21.13, 55.7];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    korn: [
        [-6, 24],
        [36, 47],
    ],
    monsun: [
        [24, 2],
        [82, 36],
    ],
    rav: [
        [3, 39],
        [30, 58],
    ],
    slaver: [
        [-8, 6],
        [48, 48],
    ],
};

interface Kort {
    tittel: string;
    tekst: string;
    farge: string;
}

const KORT: Record<Modus, Kort[]> = {
    korn: [
        { tittel: 'Korn', tekst: 'Den viktigste varen av alle', farge: GULL },
        { tittel: 'Roma, rundt år 150', tekst: 'Kanskje én million mennesker', farge: LILLA },
        { tittel: 'Egypt', tekst: 'Best organiserte jordbruk i riket', farge: GULL },
        { tittel: 'Kornskipene', tekst: 'Fra Egypt og Nord-Afrika til Italia', farge: BLAA },
    ],
    monsun: [
        { tittel: 'Sjøveien', tekst: 'Fra Rødehavet til India', farge: BLAA },
        { tittel: 'Første århundre e.Kr.', tekst: 'Romerne når Rødehavet', farge: LILLA },
        { tittel: 'Monsunen', tekst: 'Halve året blåser den mot India', farge: BLAA },
        { tittel: 'Det andre halvåret', tekst: 'Vinden snur og blåser tilbake', farge: BLAA },
        { tittel: 'Over land', tekst: 'Videre til det østlige Middelhavet', farge: GULL },
    ],
    rav: [
        { tittel: 'Nordover', tekst: 'Handel helt opp til Østersjøen', farge: RAV },
        { tittel: 'Rav', tekst: 'Størknet kvae fra bartrær, 20-40 mill. år', farge: RAV },
        { tittel: 'Funnstedene', tekst: 'Kysten mellom Gdańsk og Klaipeda', farge: RAV },
        { tittel: 'Rav-veien', tekst: 'Til byene ved Middelhavet', farge: GULL },
    ],
    slaver: [
        { tittel: 'Mennesker', tekst: 'Også de ble solgt som en vare', farge: ROD },
        {
            tittel: 'Krigsfanger',
            tekst: 'Slaver kom først og fremst fra erobringskriger',
            farge: ROD,
        },
        { tittel: 'Fra mange områder', tekst: 'Og fra folk romerne kalte barbarer', farge: ROD },
        { tittel: 'Auksjon', tekst: 'Solgt videre til private kjøpere', farge: ROD },
    ],
};

/** Hvor fangene kom fra (bare omtrentlige midtpunkter for navnene). */
const OPPHAV: { navn: string; ll: LngLat; under?: boolean }[] = [
    { navn: 'Kaukasus', ll: [43.5, 42.6] },
    { navn: 'Hellas', ll: [22, 39], under: true },
    { navn: 'Balkan', ll: [21.5, 44] },
    { navn: 'Nord-Afrika', ll: [3, 33] },
    { navn: 'Etiopia', ll: [39.5, 9.5] },
];

/** Kystlinja der ravet finnes. */
const RAVKYST: LngLat[] = [
    [18.65, 54.4],
    [19.5, 54.42],
    [20.2, 54.75],
    [21.0, 55.2],
    [21.13, 55.7],
];

const RAVVEI: LngLat[] = [GDANSK, [18, 51.5], [16.4, 48.6], [14.5, 46.6], [13.4, 45.6]];

export function HandelKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = (['korn', 'monsun', 'rav', 'slaver'] as const).includes(
        props?.modus as Modus
    )
        ? (props.modus as Modus)
        : 'korn';
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [30, 40],
                    [1040, 860],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as Pkt;
    const land = (id: string) =>
        geographies.find((g) => String((g as { id?: unknown }).id) === id) as never;

    const kort = KORT[modus];
    const sisteKort = Math.min(beat, kort.length - 1);

    const roma = p(ROMA);
    const linje = (pkt: LngLat[]) =>
        pkt.map((x, i) => `${i ? 'L' : 'M'} ${p(x).join(' ')}`).join(' ');

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Land geographies={geographies} sti={sti} dempet={modus === 'slaver'} />

                {/* Italia i lilla: Romas hjem */}
                {geographies.length > 0 && (
                    <path
                        d={sti(land('380')) ?? ''}
                        fill={modus === 'slaver' ? '#a8a29e' : '#c4b5fd'}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                    />
                )}

                {modus === 'korn' && geographies.length > 0 && (
                    <motion.path
                        d={sti(land('818')) ?? ''}
                        initial={false}
                        animate={{ fill: beat >= 2 ? '#fcd34d' : '#e7e1cf' }}
                        transition={{ duration: 0.8 }}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                    />
                )}
                {modus === 'monsun' && geographies.length > 0 && (
                    <motion.path
                        d={sti(land('818')) ?? ''}
                        initial={false}
                        animate={{ fill: beat >= 1 ? '#c4b5fd' : '#e7e1cf' }}
                        transition={{ duration: 0.8 }}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                    />
                )}

                {modus === 'korn' && <Korn beat={beat} p={p} roma={roma} />}
                {modus === 'monsun' && <Monsun beat={beat} p={p} linje={linje} />}
                {modus === 'rav' && <Rav beat={beat} p={p} linje={linje} roma={roma} />}
                {modus === 'slaver' && <Slaver beat={beat} p={p} roma={roma} />}

                {modus !== 'monsun' && (
                    <Sted pos={roma} tekst="Roma" farge={modus === 'slaver' ? ROD : LILLA} stor />
                )}
            </svg>

            {/* Kortene i høyre kolonne: ett nytt per beat */}
            <div
                className="absolute flex flex-col gap-3"
                style={{ right: '3%', top: '7%', width: '31%' }}
            >
                <AnimatePresence>
                    {kort.slice(0, sisteKort + 1).map((k, i) => (
                        <motion.div
                            key={`${modus}-${i}`}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: i === sisteKort ? 1 : 0.55, x: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                            className="rounded-2xl bg-white/95 shadow-xl px-4 py-2.5"
                            style={{ borderLeft: `8px solid ${k.farge}` }}
                        >
                            <div
                                className="font-display font-black text-2xl"
                                style={{ color: k.farge }}
                            >
                                {k.tittel}
                            </div>
                            <div className="text-lg font-semibold text-slate-700 leading-snug">
                                {k.tekst}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    dempet,
}: {
    geographies: unknown[];
    sti: GeoPath;
    dempet: boolean;
}) {
    return (
        <g>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={dempet ? '#d6d3d1' : '#e7e1cf'}
                    stroke="#ffffff"
                    strokeWidth={1.2}
                />
            ))}
        </g>
    );
});

function Sted({
    pos,
    tekst,
    farge,
    stor = false,
    under = false,
    forsinkelse = 0,
}: {
    pos: Pkt;
    tekst: string;
    farge: string;
    stor?: boolean;
    under?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.6 }}
        >
            <circle
                cx={pos[0]}
                cy={pos[1]}
                r={stor ? 15 : 11}
                fill={farge}
                stroke="#fff"
                strokeWidth={4}
            />
            <text
                x={pos[0]}
                y={pos[1] + (under ? 52 : -28)}
                textAnchor="middle"
                fontSize={stor ? 42 : 34}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** En linje som tegnes opp, med strekbredde i bildets enheter. */
function Rute({
    d,
    farge,
    bredde = 7,
    forsinkelse = 0,
}: {
    d: string;
    farge: string;
    bredde?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 1.6, ease: 'easeInOut' }}
        />
    );
}

/** Små skip eller varer som går langs en bue igjen og igjen. */
function Strom({
    fra,
    til,
    farge,
    antall = 4,
    bue = -60,
    varighet = 3.5,
    via,
}: {
    fra: Pkt;
    til: Pkt;
    farge: string;
    antall?: number;
    bue?: number;
    varighet?: number;
    /** Punkt ruta skal gå gjennom, i stedet for en bue. */
    via?: Pkt;
}) {
    const m: Pkt = via ?? [(fra[0] + til[0]) / 2, (fra[1] + til[1]) / 2 + bue];
    const xs = [fra[0], m[0], til[0]];
    const ys = [fra[1], m[1], til[1]];
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => (
                <motion.g
                    key={i}
                    initial={{ x: fra[0], y: fra[1], opacity: 0 }}
                    animate={{ x: xs, y: ys, opacity: [0, 1, 0] }}
                    transition={{
                        duration: varighet,
                        delay: i * (varighet / antall),
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    <path
                        d="M -16 -2 L 16 -2 L 10 9 L -10 9 Z"
                        fill={farge}
                        stroke="#fff"
                        strokeWidth={2}
                    />
                    <path
                        d="M 0 -2 L 0 -22 L 12 -6 Z"
                        fill="#fff7ed"
                        stroke={farge}
                        strokeWidth={2}
                    />
                </motion.g>
            ))}
        </g>
    );
}

function bueSti(fra: Pkt, til: Pkt, bue: number) {
    const m: Pkt = [(fra[0] + til[0]) / 2, (fra[1] + til[1]) / 2 + bue * 2];
    return `M ${fra.join(' ')} Q ${m.join(' ')} ${til.join(' ')}`;
}

function Korn({ beat, p, roma }: { beat: number; p: (ll: LngLat) => Pkt; roma: Pkt }) {
    const egypt = p(ALEKSANDRIA);
    const afrika = p(NORD_AFRIKA);
    const ostia = p(OSTIA);
    return (
        <g>
            {/* Kornsekk ved Roma fra første beat */}
            <motion.g
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ transformOrigin: `${roma[0] - 70}px ${roma[1] + 70}px` }}
            >
                <Kornsekk x={roma[0] - 70} y={roma[1] + 70} />
            </motion.g>
            {beat >= 1 && (
                <motion.circle
                    cx={roma[0]}
                    cy={roma[1]}
                    r={40}
                    fill={LILLA}
                    initial={{ opacity: 0.4, scale: 0.5 }}
                    animate={{ opacity: [0.35, 0.1, 0.35], scale: [1, 1.5, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                    style={{ transformOrigin: `${roma[0]}px ${roma[1]}px` }}
                />
            )}
            {beat >= 2 && <Sted pos={egypt} tekst="Egypt" farge={GULL} under />}
            {beat >= 3 && (
                <>
                    <Rute d={bueSti(egypt, ostia, -40)} farge={BLAA} bredde={5} />
                    <Rute
                        d={bueSti(afrika, ostia, -20)}
                        farge={BLAA}
                        bredde={5}
                        forsinkelse={0.4}
                    />
                    <Strom fra={egypt} til={ostia} farge={BLAA} bue={-40} />
                    <Strom
                        fra={afrika}
                        til={ostia}
                        farge={BLAA}
                        bue={-20}
                        antall={3}
                        varighet={2.4}
                    />
                    <Sted pos={afrika} tekst="Nord-Afrika" farge={GULL} under forsinkelse={0.3} />
                </>
            )}
        </g>
    );
}

function Kornsekk({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -30 30 Q -38 -10 -16 -26 L 16 -26 Q 38 -10 30 30 Z"
                fill="#e9d8a6"
                stroke="#92400e"
                strokeWidth={4}
            />
            <path d="M -16 -26 Q 0 -40 16 -26" fill="none" stroke="#92400e" strokeWidth={4} />
            {[-12, 0, 12].map((dx) => (
                <ellipse key={dx} cx={dx} cy={-34} rx={4} ry={8} fill="#ca8a04" />
            ))}
        </g>
    );
}

function Monsun({
    beat,
    p,
    linje,
}: {
    beat: number;
    p: (ll: LngLat) => Pkt;
    linje: (pkt: LngLat[]) => string;
}) {
    const rod = p(RODEHAVET_HAVN);
    const india = p(INDIA_HAVN);
    const aleks = p(ALEKSANDRIA);
    const ut = beat === 2;
    const hjem = beat === 3;
    return (
        <g>
            {/* Havnavn */}
            <text
                x={p([40.5, 16.5])[0]}
                y={p([40.5, 16.5])[1]}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill={BLAA}
                opacity={0.85}
            >
                Rødehavet
            </text>
            <text
                x={p([63, 5])[0]}
                y={p([63, 5])[1]}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill={BLAA}
                opacity={0.6}
            >
                Indiahavet
            </text>
            <Sted pos={rod} tekst="Romersk havn" farge={LILLA} under />
            <Sted pos={india} tekst="India" farge={GULL} />
            {beat >= 0 && (
                <path
                    d={linje([RODEHAVET_HAVN, [39.5, 17], [43.4, 12.6], [52, 13.5], INDIA_HAVN])}
                    fill="none"
                    stroke={BLAA}
                    strokeWidth={5}
                    strokeDasharray="14 12"
                    opacity={0.7}
                />
            )}
            {(ut || hjem) && <Vindpiler retning={ut ? 1 : -1} p={p} />}
            {(ut || hjem) && (
                <Strom
                    key={ut ? 'ut' : 'hjem'}
                    fra={ut ? rod : india}
                    til={ut ? india : rod}
                    farge={BLAA}
                    bue={40}
                    via={p([45, 11.5])}
                    antall={2}
                    varighet={4}
                />
            )}
            {beat >= 4 && (
                <>
                    <Rute
                        d={linje([RODEHAVET_HAVN, [32.8, 26.2], [31.2, 30.2], ALEKSANDRIA])}
                        farge={GULL}
                        bredde={8}
                    />
                    <Sted pos={aleks} tekst="Middelhavet" farge={GULL} forsinkelse={0.8} />
                </>
            )}
        </g>
    );
}

/** Store vindpiler over havet. Retning 1 = mot India (øst), -1 = tilbake (vest). */
function Vindpiler({ retning, p }: { retning: 1 | -1; p: (ll: LngLat) => Pkt }) {
    const rader: LngLat[] = [
        [56, 17],
        [62, 9],
        [52, 6],
    ];
    return (
        <g key={retning}>
            {rader.map((ll, i) => {
                const [x, y] = p(ll);
                return (
                    <motion.g
                        key={i}
                        initial={{ x: x - retning * 60, y, opacity: 0 }}
                        animate={{
                            x: [x - retning * 60, x + retning * 60],
                            y,
                            opacity: [0, 0.9, 0],
                        }}
                        transition={{
                            duration: 2.2,
                            delay: i * 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <path
                            d={
                                retning === 1
                                    ? 'M -70 0 L 40 0 M 20 -22 L 48 0 L 20 22'
                                    : 'M 70 0 L -40 0 M -20 -22 L -48 0 L -20 22'
                            }
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={12}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d={
                                retning === 1
                                    ? 'M -70 0 L 40 0 M 20 -22 L 48 0 L 20 22'
                                    : 'M 70 0 L -40 0 M -20 -22 L -48 0 L -20 22'
                            }
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth={6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.g>
                );
            })}
        </g>
    );
}

function Rav({
    beat,
    p,
    linje,
    roma,
}: {
    beat: number;
    p: (ll: LngLat) => Pkt;
    linje: (pkt: LngLat[]) => string;
    roma: Pkt;
}) {
    const gd = p(GDANSK);
    const kl = p(KLAIPEDA);
    const slutt = p(RAVVEI[RAVVEI.length - 1]);
    return (
        <g>
            <text
                x={p([16.4, 55.3])[0]}
                y={p([16.4, 55.3])[1]}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill={BLAA}
                opacity={0.7}
            >
                Østersjøen
            </text>
            {beat === 0 && (
                <motion.path
                    d={`M ${roma[0]} ${roma[1] - 60} L ${roma[0]} ${gd[1] + 120}`}
                    stroke={RAV}
                    strokeWidth={10}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4 }}
                />
            )}
            {beat === 0 && (
                <motion.path
                    d={`M ${roma[0] - 26} ${gd[1] + 150} L ${roma[0]} ${gd[1] + 116} L ${roma[0] + 26} ${gd[1] + 150}`}
                    stroke={RAV}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                />
            )}
            {beat === 1 && <Ravklump x={gd[0] - 40} y={gd[1] + 150} />}
            {beat >= 2 && (
                <>
                    <Rute d={linje(RAVKYST)} farge={RAV} bredde={14} />
                    <Sted pos={gd} tekst="Gdańsk" farge={RAV} under />
                    <Sted pos={kl} tekst="Klaipeda" farge={RAV} />
                </>
            )}
            {beat >= 3 && (
                <>
                    <Rute d={linje(RAVVEI)} farge={GULL} bredde={8} forsinkelse={0.2} />
                    <Strom fra={gd} til={slutt} farge={RAV} bue={0} antall={4} varighet={4} />
                    <Sted pos={slutt} tekst="Middelhavet" farge={GULL} under forsinkelse={1.4} />
                </>
            )}
        </g>
    );
}

/** En stor ravklump med et lite grantre ved siden av: kvae fra bartrær. */
function Ravklump({ x, y }: { x: number; y: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <g transform={`translate(${x} ${y})`}>
                <path d="M -150 60 L -110 -60 L -70 60 Z" fill="#166534" />
                <path d="M -140 20 L -110 -90 L -80 20 Z" fill="#15803d" />
                <rect x={-116} y={60} width={12} height={24} fill="#78350f" />
                <path
                    d="M 0 -70 C 60 -70 80 -10 70 30 C 60 70 -40 80 -60 40 C -80 0 -50 -70 0 -70 Z"
                    fill={RAV}
                    stroke="#92400e"
                    strokeWidth={5}
                />
                <ellipse cx={-10} cy={-30} rx={22} ry={12} fill="#fde68a" opacity={0.8} />
            </g>
        </motion.g>
    );
}

function Slaver({ beat, p, roma }: { beat: number; p: (ll: LngLat) => Pkt; roma: Pkt }) {
    return (
        <g>
            {beat >= 1 && (
                <motion.circle
                    cx={roma[0]}
                    cy={roma[1]}
                    r={34}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
            {beat >= 2 &&
                OPPHAV.map((o, i) => {
                    const pos = p(o.ll);
                    return (
                        <g key={o.navn}>
                            <Rute
                                d={`M ${pos.join(' ')} L ${roma.join(' ')}`}
                                farge={ROD}
                                bredde={3}
                                forsinkelse={i * 0.35}
                            />
                            <Sted
                                pos={pos}
                                tekst={o.navn}
                                farge={ROD}
                                under={o.under}
                                forsinkelse={i * 0.35}
                            />
                        </g>
                    );
                })}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <rect
                        x={roma[0] - 340}
                        y={roma[1] - 130}
                        width={300}
                        height={64}
                        rx={14}
                        fill={ROD}
                    />
                    <text
                        x={roma[0] - 190}
                        y={roma[1] - 86}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Auksjon
                    </text>
                </motion.g>
            )}
        </g>
    );
}
