import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { rammePunkter } from '../../kart/grenser';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { B, FARGE, H, Kort, Overskrift, Pil, Tekst, Vis } from './felles';

/**
 * Kartet over Middelhavet og landene rundt, med hver sin modus:
 * - `eleusis`: Eleusis og Athen, Demeter og de ni dagene.
 * - `mithras`: India og Iran der Mithras kom fra, og veien til Roma.
 * - `gudinner`: Isis fra Egypt til Pireus og Roma, og templer over hele riket (uskarp sky).
 * - `slutt`: 392 i Roma og tempelet i Eleusis som ble ødelagt.
 */

type Modus = 'eleusis' | 'mithras' | 'gudinner' | 'slutt';
type LngLat = [number, number];

const HAV = '#c9dff0';
const LAND = '#efe6d2';
const KANT = '#bfae8c';

const ROMA: LngLat = [12.5, 41.9];
const ATHEN: LngLat = [23.73, 37.98];
const ELEUSIS: LngLat = [23.54, 38.04];
const PIREUS: LngLat = [23.65, 37.94];
const EGYPT: LngLat = [30.5, 27];
const IRAN: LngLat = [53, 32.5];

const EGYPT_ID = '818';
const INDIA_ID = '356';
const IRAN_ID = '364';
const HELLAS_ID = '300';

const UTSNITT: Record<Modus, Utsnitt | undefined> = {
    eleusis: [
        [18.5, 35.5],
        [28.5, 41.5],
    ],
    mithras: undefined,
    gudinner: undefined,
    slutt: undefined,
};

const RAMME: Record<Modus, [LngLat, LngLat]> = {
    eleusis: [
        [18.5, 35.5],
        [28.5, 41.5],
    ],
    mithras: [
        [-8, 12],
        [92, 52],
    ],
    gudinner: [
        [-4, 22],
        [40, 48],
    ],
    slutt: [
        [-4, 22],
        [40, 48],
    ],
};

const OVERSKRIFT: Record<Modus, string[]> = {
    eleusis: ['Eleusis, utenfor Athen', 'Gudinnen Demeter', 'Festen varte i ni dager'],
    mithras: [
        'Mithras: opprinnelig ikke romersk',
        'For over 3000 år siden',
        'Sannhet, lov og løfter',
        'Hemmelig kult i Romerriket',
    ],
    gudinner: [
        'Isis: en gudinne fra Egypt',
        'Rundt Middelhavet, 300-tallet fvt.',
        'Augustus og Tiberius prøvde å stoppe henne',
        'Isis-templer over hele riket',
        'Kanskje kristendommens viktigste konkurrent',
    ],
    slutt: [
        '300-tallet: kristendommen blir rikets religion',
        '392: forbud mot nattlige mysteriefester',
        'Tre år senere: tempelet i Eleusis ødelagt',
        'Etter nesten 2000 år: slutt i Eleusis',
    ],
};

function idFor(g: unknown) {
    return String((g as { id?: string | number }).id ?? '').padStart(3, '0');
}

function Prikk({
    p,
    synlig,
    farge = FARGE.blekk,
    r = 14,
}: {
    p: [number, number];
    synlig: boolean;
    farge?: string;
    r?: number;
}) {
    return (
        <Vis synlig={synlig}>
            <circle cx={p[0]} cy={p[1]} r={r} fill={farge} stroke="#fff" strokeWidth={5} />
        </Vis>
    );
}

function Kryss({ p, synlig }: { p: [number, number]; synlig: boolean }) {
    return (
        <Vis synlig={synlig}>
            <circle cx={p[0]} cy={p[1]} r={38} fill="#fff" stroke={FARGE.rod} strokeWidth={6} />
            <path
                d={`M ${p[0] - 18} ${p[1] - 18} L ${p[0] + 18} ${p[1] + 18} M ${p[0] + 18} ${p[1] - 18} L ${p[0] - 18} ${p[1] + 18}`}
                stroke={FARGE.rod}
                strokeWidth={9}
                strokeLinecap="round"
            />
        </Vis>
    );
}

export function MysterieKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'eleusis';
    const { geographies } = useFilmVerden(UTSNITT[modus]);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [30, 110],
                    [B - 30, H - 20],
                ],
                rammePunkter(RAMME[modus][0], RAMME[modus][1]) as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = useCallback((ll: LngLat) => projeksjon(ll) as [number, number], [projeksjon]);

    const farge = (id: string) => {
        if (modus === 'eleusis' && id === HELLAS_ID) return '#f7e7b8';
        if (modus === 'mithras' && (id === INDIA_ID || id === IRAN_ID) && beat >= 1)
            return '#e9d5ff';
        if (modus === 'gudinner' && id === EGYPT_ID) return '#fde68a';
        return LAND;
    };

    const roma = p(ROMA);
    const athen = p(ATHEN);
    const eleusis = p(ELEUSIS);
    const pireus = p(PIREUS);
    const egypt = p(EGYPT);
    const iran = p(IRAN);
    const tekster = OVERSKRIFT[modus];

    return (
        <Flate bakgrunn={HAV}>
            <svg width={1000} height={562} viewBox={`0 0 ${B} ${H}`} className="absolute inset-0">
                <defs>
                    <filter id="mysterie-sky" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={40} />
                    </filter>
                </defs>
                {geographies.map((g, i) => (
                    <motion.path
                        key={i}
                        d={sti(g as never) ?? ''}
                        initial={false}
                        animate={{ fill: farge(idFor(g)) }}
                        transition={{ duration: 0.9 }}
                        stroke={KANT}
                        strokeWidth={1.5}
                    />
                ))}

                {modus === 'eleusis' && (
                    <>
                        <Prikk p={athen} synlig farge={FARGE.gra} />
                        <Tekst
                            x={athen[0] + 30}
                            y={athen[1] + 60}
                            storrelse={40}
                            anker="start"
                            farge={FARGE.gra}
                        >
                            Athen
                        </Tekst>
                        <Prikk p={eleusis} synlig farge={FARGE.mysterie} r={18} />
                        <Tekst
                            x={eleusis[0] - 30}
                            y={eleusis[1] - 34}
                            storrelse={48}
                            anker="end"
                            farge={FARGE.mysterie}
                        >
                            Eleusis
                        </Tekst>
                        <Tekst
                            x={p([22, 39.6])[0]}
                            y={p([22, 39.6])[1]}
                            storrelse={46}
                            farge="#a16207"
                        >
                            Hellas
                        </Tekst>
                        {/* Ni dager: ni ruter som fylles */}
                        <Vis synlig={beat >= 2}>
                            {Array.from({ length: 9 }, (_, i) => (
                                <motion.rect
                                    key={i}
                                    x={980 + (i % 3) * 110}
                                    y={560 + Math.floor(i / 3) * 90}
                                    width={96}
                                    height={76}
                                    rx={12}
                                    fill={FARGE.gull}
                                    stroke="#fff"
                                    strokeWidth={4}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: beat >= 2 ? 1 : 0 }}
                                    transition={{ delay: 0.3 + i * 0.25 }}
                                />
                            ))}
                        </Vis>
                    </>
                )}

                {modus === 'mithras' && (
                    <>
                        <Prikk p={roma} synlig r={16} />
                        <Tekst x={roma[0]} y={roma[1] - 34} storrelse={44}>
                            Roma
                        </Tekst>
                        <Tekst
                            x={p([79, 21])[0]}
                            y={p([79, 21])[1]}
                            storrelse={44}
                            farge={FARGE.mysterie}
                            synlig={beat >= 1}
                        >
                            India
                        </Tekst>
                        <Tekst
                            x={iran[0]}
                            y={iran[1]}
                            storrelse={44}
                            farge={FARGE.mysterie}
                            synlig={beat >= 1}
                        >
                            Iran
                        </Tekst>
                    </>
                )}

                {modus === 'gudinner' && (
                    <>
                        <Vis synlig={beat >= 3}>
                            <ellipse
                                cx={(roma[0] + egypt[0]) / 2}
                                cy={(roma[1] + egypt[1]) / 2}
                                rx={620}
                                ry={210}
                                fill="#f59e0b"
                                opacity={0.45}
                                filter="url(#mysterie-sky)"
                            />
                        </Vis>
                        <Tekst x={egypt[0]} y={egypt[1]} storrelse={48} farge="#a16207">
                            Egypt
                        </Tekst>
                        <Prikk p={pireus} synlig={beat >= 1} farge="#a16207" />
                        <Tekst
                            x={pireus[0] + 30}
                            y={pireus[1] + 14}
                            storrelse={38}
                            anker="start"
                            synlig={beat >= 1}
                        >
                            Pireus
                        </Tekst>
                        <Pil
                            fra={[egypt[0] - 10, egypt[1] - 50]}
                            til={[pireus[0] + 6, pireus[1] + 30]}
                            farge="#a16207"
                            synlig={beat >= 1}
                            bue={-0.2}
                        />
                        <Prikk p={roma} synlig r={16} />
                        <Tekst x={roma[0]} y={roma[1] - 34} storrelse={44}>
                            Roma
                        </Tekst>
                        <Kryss p={[roma[0] - 90, roma[1] + 40]} synlig={beat === 2} />
                    </>
                )}

                {modus === 'slutt' && (
                    <>
                        <Prikk p={roma} synlig r={16} />
                        <Tekst x={roma[0]} y={roma[1] - 34} storrelse={44}>
                            Roma
                        </Tekst>
                        <Vis synlig={beat >= 0}>
                            {/* Et kors ved Roma: kristendommen blir rikets religion */}
                            <path
                                d={`M ${roma[0] + 80} ${roma[1] - 50} L ${roma[0] + 80} ${roma[1] + 40} M ${roma[0] + 55} ${roma[1] - 22} L ${roma[0] + 105} ${roma[1] - 22}`}
                                stroke={FARGE.stat}
                                strokeWidth={12}
                                strokeLinecap="round"
                            />
                        </Vis>
                        <Prikk p={eleusis} synlig farge={FARGE.mysterie} />
                        <Tekst
                            x={eleusis[0] + 20}
                            y={eleusis[1] - 34}
                            storrelse={40}
                            anker="start"
                            farge={FARGE.mysterie}
                        >
                            Eleusis
                        </Tekst>
                        <Kryss p={eleusis} synlig={beat >= 2} />
                    </>
                )}
            </svg>

            {modus === 'eleusis' && (
                <Kort synlig={beat >= 1} venstre={60} topp={150} bredde={300} farge="#a16207">
                    Demeter: gudinnen for korn og vekst
                </Kort>
            )}
            {modus === 'eleusis' && (
                <Kort
                    synlig={beat >= 2}
                    venstre={600}
                    topp={270}
                    bredde={240}
                    farge={FARGE.gull}
                    storrelse={20}
                >
                    9 dager, i august eller september
                </Kort>
            )}
            {modus === 'mithras' && (
                <Kort
                    synlig={beat >= 2}
                    venstre={700}
                    topp={110}
                    bredde={250}
                    farge={FARGE.mysterie}
                >
                    Sannheten holder. Loven gjelder. Løfter holdes.
                </Kort>
            )}
            {modus === 'mithras' && (
                <Kort
                    synlig={beat >= 3}
                    venstre={40}
                    topp={420}
                    bredde={360}
                    farge={FARGE.mysterie}
                >
                    I Romerriket: rundt år 100 til 400
                </Kort>
            )}
            {modus === 'gudinner' && (
                <Kort synlig={beat === 2} venstre={40} topp={420} bredde={340} farge={FARGE.rod}>
                    De mente det som foregikk, var upassende
                </Kort>
            )}
            {modus === 'gudinner' && (
                <Kort synlig={beat >= 4} venstre={40} topp={420} bredde={340} farge={FARGE.stat}>
                    En konkurrent til kristendommen, kanskje den viktigste
                </Kort>
            )}
            {modus === 'slutt' && (
                <Kort synlig={beat === 1} venstre={40} topp={420} bredde={340} farge={FARGE.rod}>
                    Keiser Theodosius I forbød alle nattlige mysteriefester
                </Kort>
            )}
            {modus === 'slutt' && (
                <Kort synlig={beat >= 2} venstre={640} topp={420} bredde={330} farge={FARGE.rod}>
                    Tempelet i Eleusis ødelagt av gotere
                </Kort>
            )}
            <Overskrift tekst={tekster[Math.min(beat, tekster.length - 1)]} />
        </Flate>
    );
}
