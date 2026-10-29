import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { rammePunkter } from '../../kart/grenser';
import type { VisualProps } from '../../types';
import { B, BLA, Etikett, H, HAV, LAND, Land, type LngLat, Overskrift, ROD, Ring } from './felles';
import { OSTBLOKK, SOVJET, VESTEUROPA } from './data';

/**
 * Verdenskartet i filmen om den kalde krigen. Fire moduser:
 * - «1945»: de tre allierte mot Tyskland, og så splittelsen.
 * - «oppdemming»: kommunismen med en demning rundt, og hjelpen til Hellas og Tyrkia.
 * - «marshall»: pengene som går fra USA til Vest-Europa, men ikke til øst.
 * - «proksy»: krigene i skyggen, i Kina, Korea, Vietnam og Afghanistan.
 */

type Modus = '1945' | 'oppdemming' | 'marshall' | 'proksy';

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    '1945': [
        [-128, 0],
        [150, 72],
    ],
    oppdemming: [
        [-12, 28],
        [100, 68],
    ],
    marshall: [
        [-98, 26],
        [42, 66],
    ],
    proksy: [
        [28, 2],
        [148, 66],
    ],
};

const USA = '840';
const UK = '826';
const TYSKLAND = '276';
const KINA = '156';
const NORD_KOREA = '408';
const SOR_KOREA = '410';
const VIETNAM = '704';
const AFGHANISTAN = '004';
const HELLAS = '300';
const TYRKIA = '792';

const NOYTRAL = LAND;
const GRONN = '#16a34a';
const GRA = '#64748b';
const LYSBLA = '#93c5fd';
const LYSROD = '#fca5a5';

function fargeFor(modus: Modus, beat: number, id: string): string {
    const sovjet = SOVJET.includes(id);
    if (modus === '1945') {
        if (id === TYSKLAND) return beat >= 3 ? '#cbd5e1' : GRA;
        if (id === USA || id === UK || sovjet) {
            if (beat === 0) return NOYTRAL;
            if (beat <= 2) return GRONN;
            return sovjet ? ROD : BLA;
        }
        return NOYTRAL;
    }
    if (modus === 'oppdemming') {
        if (sovjet || OSTBLOKK.includes(id)) return ROD;
        if (beat >= 3 && (id === HELLAS || id === TYRKIA)) return BLA;
        return NOYTRAL;
    }
    if (modus === 'marshall') {
        if (id === USA) return BLA;
        if (VESTEUROPA.includes(id) || id === HELLAS || id === TYRKIA)
            return beat >= 1 ? '#22c55e' : LYSBLA;
        if (sovjet || OSTBLOKK.includes(id)) return beat >= 3 ? ROD : LYSROD;
        return NOYTRAL;
    }
    // proksy
    if (sovjet) return ROD;
    if (id === KINA) return beat >= 1 ? ROD : NOYTRAL;
    if (id === NORD_KOREA) return beat >= 2 ? ROD : NOYTRAL;
    if (id === SOR_KOREA) return beat >= 2 ? BLA : NOYTRAL;
    if (id === VIETNAM) return beat >= 3 ? '#f59e0b' : NOYTRAL;
    if (id === AFGHANISTAN) return beat >= 4 ? '#f59e0b' : NOYTRAL;
    return NOYTRAL;
}

const OVERSKRIFT: Record<Modus, (string | null)[]> = {
    '1945': ['Mai 1945: Tyskland har tapt', 'Tre allierte', 'En felles fiende', 'Mistillit'],
    oppdemming: [
        'Kommunismen sprer seg',
        'Oppdemming: ikke ett land til',
        'Truman-doktrinen, 1947',
        'Hjelp til Hellas og Tyrkia',
    ],
    marshall: [
        'Marshallplanen, 1948 til 1952',
        'Europa bygges opp igjen',
        'Kommunistene taper valgene',
        'Øst sier nei til pengene',
    ],
    proksy: [
        'Krigene i skyggen',
        'Kina blir kommunistisk, 1949',
        'Koreakrigen, 1950 til 1953',
        'Vietnamkrigen, 1955 til 1975',
        'Afghanistan, 1979 til 1989',
    ],
};

export function KaldkrigVerden({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? '1945';
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(() => {
        const [sv, no] = UTSNITT[modus];
        return geoNaturalEarth1().fitExtent(
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
    // Demningen: den røde sonen tegnes først med en tykk blå kant, så rødt oppå.
    const demning = useMemo(
        () =>
            geographies.filter((g) => {
                const id = String((g as { id?: string }).id ?? '');
                return SOVJET.includes(id) || OSTBLOKK.includes(id);
            }),
        [geographies]
    );

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                {modus === 'oppdemming' && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= 1 ? 1 : 0 }}
                        transition={{ duration: 0.9 }}
                    >
                        {demning.map((g, i) => (
                            <path
                                key={i}
                                d={sti(g as never) ?? ''}
                                fill={BLA}
                                stroke={BLA}
                                strokeWidth={22}
                                strokeLinejoin="round"
                            />
                        ))}
                    </motion.g>
                )}
                <Land geographies={geographies} sti={sti} farge={farge} />
                {modus === '1945' && <Scene1945 beat={beat} p={p} />}
                {modus === 'oppdemming' && <Oppdemming beat={beat} p={p} />}
                {modus === 'marshall' && <Marshall beat={beat} p={p} playing={playing} />}
                {modus === 'proksy' && <Proksy beat={beat} p={p} />}
            </svg>
            <Overskrift tekst={OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)]} />
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

function Pil({
    fra,
    til,
    farge,
    synlig,
    bue = 0.25,
    bredde = 7,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    synlig: boolean;
    bue?: number;
    bredde?: number;
}) {
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2;
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    const k: [number, number] = [mx - dy * bue, my + dx * bue];
    const vinkel = Math.atan2(til[1] - k[1], til[0] - k[0]);
    const spiss = 22;
    const a: [number, number] = [
        til[0] - spiss * Math.cos(vinkel - 0.45),
        til[1] - spiss * Math.sin(vinkel - 0.45),
    ];
    const b: [number, number] = [
        til[0] - spiss * Math.cos(vinkel + 0.45),
        til[1] - spiss * Math.sin(vinkel + 0.45),
    ];
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            <motion.path
                d={`M ${fra.join(' ')} Q ${k.join(' ')} ${til.join(' ')}`}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: synlig ? 1 : 0 }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
            />
            <path
                d={`M ${a.join(' ')} L ${til.join(' ')} L ${b.join(' ')}`}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </motion.g>
    );
}

function Scene1945({ beat, p }: { beat: number; p: P }) {
    const ty = p([10.4, 51.2]);
    const usa = p([-99, 39]);
    const uk = p([-2.5, 54]);
    const su = p([75, 60]);
    return (
        <>
            <Pil
                fra={usa}
                til={[ty[0] - 30, ty[1] + 6]}
                farge="#0f172a"
                synlig={beat === 2}
                bue={-0.18}
            />
            <Pil
                fra={[uk[0] - 4, uk[1] - 30]}
                til={[ty[0] - 12, ty[1] - 22]}
                farge="#0f172a"
                synlig={beat === 2}
                bue={-0.5}
            />
            <Pil
                fra={su}
                til={[ty[0] + 30, ty[1] - 4]}
                farge="#0f172a"
                synlig={beat === 2}
                bue={0.18}
            />
            <Etikett x={usa[0]} y={usa[1]} tekst="USA" synlig={beat >= 1} storrelse={40} />
            <Etikett
                x={uk[0] - 70}
                y={uk[1] - 40}
                tekst="Storbritannia"
                synlig={beat >= 1}
                anker="end"
            />
            <Etikett x={su[0]} y={su[1]} tekst="Sovjetunionen" synlig={beat >= 1} storrelse={40} />
            <Etikett
                x={ty[0] + 20}
                y={ty[1] + 70}
                tekst="Tyskland"
                synlig={beat <= 2}
                farge="#334155"
            />
            {/* Mistilliten: et gap mellom øst og vest */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            >
                <line
                    x1={ty[0] + 70}
                    y1={ty[1] - 150}
                    x2={ty[0] + 70}
                    y2={ty[1] + 170}
                    stroke="#0f172a"
                    strokeWidth={8}
                    strokeDasharray="22 16"
                    strokeLinecap="round"
                />
                <Etikett
                    x={ty[0] - 30}
                    y={ty[1] + 230}
                    tekst="VEST"
                    farge={BLA}
                    storrelse={44}
                    anker="end"
                />
                <Etikett
                    x={ty[0] + 170}
                    y={ty[1] + 230}
                    tekst="ØST"
                    farge={ROD}
                    storrelse={44}
                    anker="start"
                />
            </motion.g>
        </>
    );
}

function Oppdemming({ beat, p }: { beat: number; p: P }) {
    const hellas = p([22, 39.5]);
    const tyrkia = p([34, 39]);
    const vest: [number, number] = [70, p([-10, 37])[1]];
    return (
        <>
            <Etikett
                x={p([70, 60])[0]}
                y={p([70, 60])[1]}
                tekst="Kommunistisk styre"
                farge="#7f1d1d"
                storrelse={36}
            />
            <Pil
                fra={vest}
                til={[hellas[0] - 14, hellas[1] + 6]}
                farge={BLA}
                synlig={beat >= 2}
                bue={0.12}
            />
            <Pil
                fra={vest}
                til={[tyrkia[0] - 20, tyrkia[1] + 18]}
                farge={BLA}
                synlig={beat >= 2}
                bue={0.2}
            />
            <Etikett
                x={vest[0] + 6}
                y={vest[1] - 26}
                tekst="Fra USA"
                farge={BLA}
                anker="start"
                synlig={beat >= 2}
            />
            <Etikett x={hellas[0] - 10} y={hellas[1] + 64} tekst="Hellas" synlig={beat >= 3} />
            <Etikett x={tyrkia[0] + 20} y={tyrkia[1] + 64} tekst="Tyrkia" synlig={beat >= 3} />
        </>
    );
}

function Marshall({ beat, p, playing }: { beat: number; p: P; playing: boolean }) {
    const usa = p([-77, 39]);
    const mal: LngLat[] = [
        [2.5, 46.8],
        [12.5, 42.8],
        [-2, 53],
        [5.3, 52.2],
        [16, 63],
        [9.5, 56],
    ];
    const ost = p([24, 53]);
    const fr = p([2.5, 46.8]);
    const it = p([12.5, 42.8]);
    return (
        <>
            <Etikett x={usa[0]} y={usa[1] + 70} tekst="USA" storrelse={40} />
            {mal.map((m, i) => {
                const til = p(m);
                return (
                    <g key={i}>
                        <Pil
                            fra={usa}
                            til={til}
                            farge="#15803d"
                            synlig
                            bue={-0.12 - i * 0.02}
                            bredde={5}
                        />
                        <Mynter
                            fra={usa}
                            til={til}
                            bue={-0.12 - i * 0.02}
                            forsinkelse={i * 0.4}
                            playing={playing}
                        />
                    </g>
                );
            })}
            <Etikett x={fr[0] - 10} y={fr[1] + 50} tekst="Frankrike" synlig={beat >= 2} />
            <Etikett x={it[0] + 30} y={it[1] + 56} tekst="Italia" synlig={beat >= 2} />
            {/* Pengene til øst stopper ved grensa */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <Pil
                    fra={usa}
                    til={[ost[0] - 140, ost[1]]}
                    farge="#15803d"
                    synlig={beat >= 3}
                    bue={-0.16}
                    bredde={5}
                />
                <g
                    transform={`translate(${ost[0] - 100} ${ost[1]})`}
                    stroke={ROD}
                    strokeWidth={12}
                    strokeLinecap="round"
                >
                    <line x1={-26} y1={-26} x2={26} y2={26} />
                    <line x1={26} y1={-26} x2={-26} y2={26} />
                </g>
                <Etikett x={ost[0] + 80} y={ost[1] + 10} tekst="NEI" farge={ROD} storrelse={46} />
            </motion.g>
        </>
    );
}

/** Dollarmynter som glir langs pila, om og om igjen. */
function Mynter({
    fra,
    til,
    bue,
    forsinkelse,
    playing,
}: {
    fra: [number, number];
    til: [number, number];
    bue: number;
    forsinkelse: number;
    playing: boolean;
}) {
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2;
    const k: [number, number] = [mx - (til[1] - fra[1]) * bue, my + (til[0] - fra[0]) * bue];
    const punkt = (t: number) => [
        (1 - t) * (1 - t) * fra[0] + 2 * (1 - t) * t * k[0] + t * t * til[0],
        (1 - t) * (1 - t) * fra[1] + 2 * (1 - t) * t * k[1] + t * t * til[1],
    ];
    const ts = [0.1, 0.3, 0.5, 0.7, 0.9];
    const xs = ts.map((t) => punkt(t)[0]);
    const ys = ts.map((t) => punkt(t)[1]);
    return (
        <motion.g
            initial={{ x: xs[0], y: ys[0], opacity: 0 }}
            animate={
                playing
                    ? { x: xs, y: ys, opacity: [0, 1, 1, 1, 0] }
                    : { x: xs[2], y: ys[2], opacity: 1 }
            }
            transition={{
                duration: 3.2,
                delay: forsinkelse,
                repeat: playing ? Infinity : 0,
                ease: 'linear',
            }}
        >
            <circle r={17} fill="#facc15" stroke="#a16207" strokeWidth={3} />
            <text y={8} textAnchor="middle" fontSize={22} fontWeight={900} fill="#713f12">
                $
            </text>
        </motion.g>
    );
}

function Proksy({ beat, p }: { beat: number; p: P }) {
    const kina = p([104, 34]);
    const korea = p([127.5, 38]);
    const vietnam = p([106.5, 15.5]);
    const afg = p([66, 34]);
    const su = p([72, 52]);
    return (
        <>
            <Etikett x={su[0]} y={su[1]} tekst="Sovjetunionen" storrelse={40} farge="#7f1d1d" />
            <Etikett
                x={kina[0]}
                y={kina[1]}
                tekst="Kina"
                storrelse={38}
                synlig={beat >= 1}
                farge="#7f1d1d"
            />
            <Ring x={korea[0]} y={korea[1]} farge="#0f172a" synlig={beat >= 2} />
            <Etikett
                x={korea[0] + 46}
                y={korea[1] + 10}
                tekst="Korea"
                anker="start"
                synlig={beat >= 2}
            />
            <Ring x={vietnam[0]} y={vietnam[1]} farge="#0f172a" synlig={beat >= 3} />
            <Etikett
                x={vietnam[0] + 46}
                y={vietnam[1] + 10}
                tekst="Vietnam"
                anker="start"
                synlig={beat >= 3}
            />
            <Ring x={afg[0]} y={afg[1]} farge="#0f172a" synlig={beat >= 4} />
            <Etikett
                x={afg[0] - 46}
                y={afg[1] + 10}
                tekst="Afghanistan"
                anker="end"
                synlig={beat >= 4}
            />
        </>
    );
}
