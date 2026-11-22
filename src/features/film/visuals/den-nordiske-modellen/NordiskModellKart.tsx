import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { rammePunkter } from '../../kart/grenser';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';
import { FARGE, Overskrift, Vis } from './felles';
import { overskriftFor } from './hjelp';

/**
 * Kart. To moduser:
 * - norden: de fem nordiske landene lyser opp, blir «én modell», og handler med verden.
 * - modeller: tre typer velferdsstater (Norden, Tyskland og Frankrike, USA), så USA nærmere.
 */

type Modus = 'norden' | 'modeller';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const HAV = '#d6e6f0';
const LAND = '#efe9dc';

const NORDEN = ['578', '752', '208', '246', '352'];
const TYSKLAND_FRANKRIKE = ['276', '250'];
const USA = '840';

const OVERSKRIFT: Record<Modus, string[]> = {
    norden: [
        'Norden: fem land',
        'Én modell',
        'To ting samtidig',
        'Små land som handler mye',
        'Vekst og små forskjeller',
    ],
    modeller: [
        'Tre typer velferdsstater',
        'Norden',
        'Tyskland og Frankrike',
        'USA',
        'USA: helseforsikring',
        'USA: helseforsikring',
    ],
};

const FRA: LngLat[] = [
    [4, 60.5],
    [8, 56.5],
    [13, 55.6],
    [23, 60],
];

const NORDEN_UTSNITT: Utsnitt = [
    [-26, 53],
    [34, 72],
];

function idFor(g: unknown) {
    return String((g as { id?: string | number }).id ?? '').padStart(3, '0');
}

/** Tekst i SVG med hvit kant. Animerer bare opacity. */
function Tekst({
    x,
    y,
    tekst,
    synlig = true,
    storrelse = 40,
    farge = FARGE.blekk,
}: {
    x: number;
    y: number;
    tekst: string;
    synlig?: boolean;
    storrelse?: number;
    farge?: string;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={storrelse / 5}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

function Kort({
    tekst,
    farge,
    forsinkelse = 0,
}: {
    tekst: string;
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
            className="rounded-2xl bg-white shadow-xl px-4 py-2 font-black text-slate-900"
            style={{ fontSize: 21, borderLeft: `8px solid ${farge}` }}
        >
            {tekst}
        </motion.div>
    );
}

function Norden({ beat }: { beat: number }) {
    const { geographies } = useFilmVerden(NORDEN_UTSNITT);
    const projeksjon = useMemo(
        () =>
            geoNaturalEarth1()
                .rotate([-8, 0])
                .fitExtent(
                    [
                        [40, 110],
                        [B - 40, H - 40],
                    ],
                    rammePunkter(NORDEN_UTSNITT[0], NORDEN_UTSNITT[1]) as never
                ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = useCallback((ll: LngLat) => projeksjon(ll) as [number, number], [projeksjon]);
    const navn: { id: string; tekst: string; ll: LngLat }[] = [
        { id: '578', tekst: 'Norge', ll: [8.5, 61.3] },
        { id: '752', tekst: 'Sverige', ll: [15.5, 63.2] },
        { id: '246', tekst: 'Finland', ll: [26.5, 63] },
        { id: '208', tekst: 'Danmark', ll: [9.3, 56.2] },
        { id: '352', tekst: 'Island', ll: [-18.5, 64.9] },
    ];
    // Handel ut av Norden: fra kysten og ut mot resten av verden.
    const ut: LngLat[] = [
        [-12, 58],
        [2, 54.5],
        [14, 53.8],
        [31, 56],
    ];
    const midt = p([12, 62]);
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {geographies.map((g, i) => {
                    const id = idFor(g);
                    const nr = NORDEN.indexOf(id);
                    const nordisk = nr >= 0;
                    return (
                        <motion.path
                            key={i}
                            d={sti(g as never) ?? ''}
                            initial={{ fill: LAND }}
                            animate={{ fill: nordisk ? FARGE.norge : LAND }}
                            transition={{ duration: 0.7, delay: nordisk ? 0.45 * nr : 0 }}
                            stroke="#ffffff"
                            strokeWidth={1.2}
                        />
                    );
                })}
                {beat >= 1 && (
                    <motion.ellipse
                        cx={midt[0]}
                        cy={midt[1] + 20}
                        rx={620}
                        ry={360}
                        fill="none"
                        stroke={FARGE.gull}
                        strokeWidth={8}
                        strokeDasharray="22 14"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                )}
                {beat >= 3 &&
                    ut.map((ll, i) => {
                        const [x, y] = p(ll);
                        const [mx, my] = p(FRA[i]);
                        const vinkel = (Math.atan2(y - my, x - mx) * 180) / Math.PI;
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.25 * i }}
                            >
                                <line
                                    x1={mx}
                                    y1={my}
                                    x2={x}
                                    y2={y}
                                    stroke={FARGE.gull}
                                    strokeWidth={10}
                                    strokeLinecap="round"
                                />
                                <polygon
                                    points="0,-22 34,0 0,22"
                                    fill={FARGE.gull}
                                    transform={`translate(${x} ${y}) rotate(${vinkel})`}
                                />
                            </motion.g>
                        );
                    })}
                {navn.map((n, i) => {
                    const [x, y] = p(n.ll);
                    return (
                        <Tekst
                            key={n.id}
                            x={x}
                            y={y}
                            tekst={n.tekst}
                            storrelse={44}
                            synlig={beat >= 0}
                            farge={i < 5 ? FARGE.blekk : FARGE.gra}
                        />
                    );
                })}
            </svg>
            <Flate>
                <Vis nar={beat === 1} className="absolute" style={{ right: 24, bottom: 24 }}>
                    <Kort tekst="Ikke like i alt, men én modell" farge={FARGE.gull} />
                </Vis>
                <Vis
                    nar={beat === 2}
                    className="absolute flex flex-col gap-2"
                    style={{ right: 24, bottom: 24 }}
                >
                    <Kort tekst="Trygghet for folk flest" farge={FARGE.norge} />
                    <Kort tekst="+ et fritt marked" farge={FARGE.bla} forsinkelse={0.5} />
                    <div
                        className="self-end rounded-xl bg-slate-900 px-3 py-1 font-black text-white"
                        style={{ fontSize: 20 }}
                    >
                        de siste 70 årene
                    </div>
                </Vis>
                <Vis nar={beat === 3} className="absolute" style={{ right: 24, bottom: 24 }}>
                    <Kort tekst="Små land som handler mye med andre land" farge={FARGE.gull} />
                </Vis>
                <Vis
                    nar={beat >= 4}
                    className="absolute flex flex-col gap-2"
                    style={{ right: 24, bottom: 24 }}
                >
                    <Kort tekst="Vekst like god som i andre rike land" farge={FARGE.bla} />
                    <Kort
                        tekst="+ små forskjeller mellom folk"
                        farge={FARGE.norge}
                        forsinkelse={0.5}
                    />
                </Vis>
                <Overskrift tekst={overskriftFor(OVERSKRIFT.norden, beat)} />
            </Flate>
        </div>
    );
}

function Modeller({ beat }: { beat: number }) {
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoNaturalEarth1()
                .rotate([45, 0])
                .fitExtent(
                    [
                        [30, 100],
                        [B - 30, H - 30],
                    ],
                    rammePunkter([-125, 22], [32, 70]) as never
                ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = useCallback((ll: LngLat) => projeksjon(ll) as [number, number], [projeksjon]);
    const farge = (id: string) => {
        if (NORDEN.includes(id) && beat >= 1) return FARGE.norge;
        if (TYSKLAND_FRANKRIKE.includes(id) && beat >= 2) return FARGE.gull;
        if (id === USA && beat >= 3) return FARGE.usa;
        return LAND;
    };
    const no = p([16, 63]);
    const tf = p([6, 48.5]);
    const us = p([-99, 39]);
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {geographies.map((g, i) => (
                    <motion.path
                        key={i}
                        d={sti(g as never) ?? ''}
                        initial={false}
                        animate={{ fill: farge(idFor(g)) }}
                        transition={{ duration: 0.8 }}
                        stroke="#ffffff"
                        strokeWidth={1}
                    />
                ))}
                <Tekst x={no[0]} y={no[1] - 40} tekst="Norden" synlig={beat >= 1} storrelse={44} />
                <Tekst
                    x={tf[0] + 10}
                    y={tf[1] + 70}
                    tekst="Tyskland og Frankrike"
                    synlig={beat >= 2 && beat <= 3}
                    storrelse={36}
                />
                <Tekst x={us[0]} y={us[1]} tekst="USA" synlig={beat >= 3} storrelse={54} />
            </svg>
            <Flate>
                <Vis
                    nar={beat === 0}
                    className="absolute flex flex-col gap-2"
                    style={{ left: 330, bottom: 20, width: 380 }}
                >
                    <Kort tekst="Type 1: ?" farge={FARGE.norge} />
                    <Kort tekst="Type 2: ?" farge={FARGE.gull} forsinkelse={0.3} />
                    <Kort tekst="Type 3: ?" farge={FARGE.usa} forsinkelse={0.6} />
                </Vis>
                <Vis
                    nar={beat >= 1 && beat <= 3}
                    className="absolute flex flex-col gap-2"
                    style={{ left: 330, bottom: 20, width: 380 }}
                >
                    {beat >= 1 && <Kort tekst="Norden: sosialdemokratisk" farge={FARGE.norge} />}
                    {beat >= 2 && (
                        <Kort tekst="Det du får, henger sammen med jobben" farge={FARGE.gull} />
                    )}
                    {beat >= 3 && (
                        <Kort tekst="USA: liberal, staten gjør mindre" farge={FARGE.usa} />
                    )}
                </Vis>
                <Vis
                    nar={beat >= 4}
                    className="absolute flex flex-col gap-2"
                    style={{ left: 330, bottom: 20, width: 420 }}
                >
                    <Kort tekst="Ingen offentlig helseforsikring for alle" farge={FARGE.usa} />
                    <Kort
                        tekst="Staten hjelper eldre, funksjonshemmede og de fattigste"
                        farge={FARGE.gull}
                    />
                    {beat >= 5 && (
                        <Kort
                            tekst="Resten ordner forsikring selv, ofte gjennom jobben"
                            farge={FARGE.gra}
                        />
                    )}
                </Vis>
                <Overskrift tekst={overskriftFor(OVERSKRIFT.modeller, beat)} />
            </Flate>
        </div>
    );
}

export function NordiskModellKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'norden';
    return modus === 'norden' ? <Norden beat={beat} /> : <Modeller beat={beat} />;
}
