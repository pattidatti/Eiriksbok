import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Tre kart.
 * «norge»: Vang kirke og Senja, der 96 medlemmer nektet å godta Ingrid Bjerkås.
 * «verden»: reformjødedommen i Tyskland, Regina Jonas i Berlin, Sally Priesand i USA.
 * «india»: hinduismen, hymnen om urmennesket, bhakti, og sati i Bengal og Rajasthan.
 * Kortene står på en fast plass ved siden av kartet, så de aldri dekker stedet de forklarer.
 */

type Modus = 'norge' | 'verden' | 'india';

const B = 1600;
const H = 900;
const MORK = '#0f172a';
const RAV = '#d97706';
const BLA = '#4f46e5';

interface Oppsett {
    /** Hjørnene som skal få plass i kartflaten. */
    ramme: [[number, number], [number, number]];
    flate: [[number, number], [number, number]];
    utsnitt?: Utsnitt;
    hav: string;
}

const OPPSETT: Record<Modus, Oppsett> = {
    norge: {
        ramme: [
            [4, 57.6],
            [31.5, 71.3],
        ],
        flate: [
            [30, 30],
            [1000, 870],
        ],
        utsnitt: [
            [3, 57],
            [32, 72],
        ],
        hav: '#dbeafe',
    },
    verden: {
        ramme: [
            [-108, 14],
            [40, 64],
        ],
        flate: [
            [20, 20],
            [1580, 880],
        ],
        hav: '#dbeafe',
    },
    india: {
        ramme: [
            [66, 6],
            [97, 36],
        ],
        flate: [
            [30, 30],
            [1000, 870],
        ],
        utsnitt: [
            [64, 4],
            [99, 37],
        ],
        hav: '#dbeafe',
    },
};

const NORGE = 578;
const TYSKLAND = 276;
const USA = 840;
const INDIA = 356;

function landFarge(modus: Modus, id: number, beat: number) {
    if (modus === 'norge' && id === NORGE) return '#fef3c7';
    if (modus === 'verden') {
        if (id === TYSKLAND && beat >= 0) return '#c7d2fe';
        if (id === USA && beat >= 2) return '#fde68a';
    }
    if (modus === 'india' && id === INDIA) return '#fed7aa';
    return '#e7e5e4';
}

function Kort({
    x,
    y,
    w,
    h,
    farge = MORK,
    children,
}: {
    x: number;
    y: number;
    w: number;
    h: number;
    farge?: string;
    children: ReactNode;
}) {
    return (
        <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <rect x={x} y={y} width={w} height={h} rx={26} fill="#ffffff" stroke={farge} strokeWidth={5} opacity={0.97} />
            {children}
        </motion.g>
    );
}

function Linjer({ x, y, linjer, fs = 34, farge = MORK, forste }: { x: number; y: number; linjer: string[]; fs?: number; farge?: string; forste?: string }) {
    return (
        <>
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={x}
                    y={y + i * fs * 1.3}
                    textAnchor="middle"
                    fontSize={i === 0 && forste ? fs + 6 : fs}
                    fontWeight={i === 0 && forste ? 900 : 700}
                    fill={i === 0 && forste ? forste : farge}
                >
                    {l}
                </text>
            ))}
        </>
    );
}

function Merke({ x, y, tekst, farge, dx = 0, dy = -34, anker = 'middle' }: { x: number; y: number; tekst: string; farge: string; dx?: number; dy?: number; anker?: 'start' | 'middle' | 'end' }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <circle cx={x} cy={y} r={30} fill="none" stroke={farge} strokeWidth={4} opacity={0.5}>
                <animate attributeName="r" values="16;38;16" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r={14} fill={farge} stroke="#fff" strokeWidth={4} />
            <text
                x={x + dx}
                y={y + dy}
                textAnchor={anker}
                fontSize={36}
                fontWeight={900}
                fill={MORK}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** 96 prikker i et rutenett på 12 x 8: én per medlem som nektet. */
function Nittiseks({ x, y }: { x: number; y: number }) {
    return (
        <g>
            {Array.from({ length: 96 }, (_, i) => (
                <motion.circle
                    key={i}
                    cx={x + (i % 12) * 34}
                    cy={y + Math.floor(i / 12) * 34}
                    r={12}
                    fill="#dc2626"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.012 }}
                />
            ))}
        </g>
    );
}

/** Urmennesket fra hymnen: prestene fra munnen, tjenerne fra føttene. */
function Urmennesket({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={0} r={42} fill="#fdba74" />
            <rect x={-40} y={50} width={80} height={150} rx={30} fill="#fb923c" />
            <rect x={-34} y={196} width={24} height={110} rx={10} fill="#f97316" />
            <rect x={10} y={196} width={24} height={110} rx={10} fill="#f97316" />
            <path d="M -14 16 Q 0 26 14 16" stroke="#7c2d12" strokeWidth={5} fill="none" />
            <line x1={30} y1={18} x2={130} y2={0} stroke={BLA} strokeWidth={6} />
            <text x={140} y={12} fontSize={34} fontWeight={900} fill={BLA}>
                prester
            </text>
            <line x1={36} y1={300} x2={130} y2={300} stroke={RAV} strokeWidth={6} />
            <text x={140} y={312} fontSize={34} fontWeight={900} fill={RAV}>
                tjenere
            </text>
        </g>
    );
}

export function KjonnKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'norge';
    const o = OPPSETT[modus];
    const { geographies } = useFilmVerden(o.utsnitt);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(o.flate, {
                type: 'MultiPoint',
                coordinates: o.ramme,
            } as never),
        [o]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];

    const vang = p([11.1, 60.8]);
    const senja = p([17.3, 69.35]);
    const berlin = p([13.4, 52.5]);
    const usa = p([-97, 39]);
    const tysk = p([10, 50.5]);
    const bengal = p([88.4, 23.2]);
    const rajasthan = p([73.6, 26.6]);

    // Kortplass til høyre for kartet (Norge og India).
    const KX = 1050;
    const KW = 520;
    const KM = KX + KW / 2;

    return (
        <div className="absolute inset-0" style={{ background: o.hav }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {geographies.map((g, i) => {
                    const id = Number(g.id);
                    return (
                        <motion.path
                            key={`${g.id ?? 'x'}-${i}`}
                            d={sti(g as never) ?? undefined}
                            initial={false}
                            animate={{ fill: landFarge(modus, id, beat) }}
                            transition={{ duration: 0.8 }}
                            stroke="#a8a29e"
                            strokeWidth={1.2}
                        />
                    );
                })}

                {modus === 'norge' && (
                    <>
                        <Merke x={vang[0]} y={vang[1]} tekst="Vang kirke" farge={RAV} dx={-26} dy={10} anker="end" />
                        {beat >= 1 && <Merke x={senja[0]} y={senja[1]} tekst="Senja" farge="#dc2626" dx={-30} dy={10} anker="end" />}
                        {beat === 0 && (
                            <Kort x={KX} y={300} w={KW} h={200} farge={RAV}>
                                <Linjer x={KM} y={375} forste={RAV} linjer={['Vang kirke, 1961', 'Ingrid Bjerkås', 'blir ordinert']} />
                            </Kort>
                        )}
                        {beat === 1 && (
                            <Kort x={KX} y={190} w={KW} h={510} farge="#dc2626">
                                <Linjer x={KM} y={270} forste="#dc2626" linjer={['Senja', '96 medlemmer nektet', 'å godta henne']} />
                                <Nittiseks x={KX + 74} y={420} />
                            </Kort>
                        )}
                        {beat >= 2 && (
                            <Kort x={KX} y={260} w={KW} h={300}>
                                <Linjer x={KM} y={335} forste={MORK} linjer={['1963: presteforeningen', 'Hun vil bli medlem.', 'Motstandere truer', 'med å melde seg ut.']} />
                            </Kort>
                        )}
                    </>
                )}

                {modus === 'verden' && (
                    <>
                        <Merke x={tysk[0]} y={tysk[1] + 40} tekst="Tyskland" farge={BLA} dy={60} />
                        {beat >= 1 && <Merke x={berlin[0]} y={berlin[1]} tekst="Berlin" farge={BLA} dx={30} dy={-24} anker="start" />}
                        {beat >= 2 && <Merke x={usa[0]} y={usa[1]} tekst="USA" farge={RAV} dy={-36} />}
                        {beat === 0 && (
                            <Kort x={560} y={560} w={560} h={210} farge={BLA}>
                                <Linjer x={840} y={630} forste={BLA} linjer={['Tidlig på 1800-tallet', 'Reformjødedommen:', 'familier sitter sammen']} />
                            </Kort>
                        )}
                        {beat === 1 && (
                            <Kort x={560} y={560} w={560} h={210} farge={BLA}>
                                <Linjer x={840} y={630} forste={BLA} linjer={['Berlin, 1935', 'Regina Jonas: første', 'kvinnelige rabbiner']} />
                            </Kort>
                        )}
                        {beat === 2 && (
                            <Kort x={560} y={560} w={560} h={210} farge={RAV}>
                                <Linjer x={840} y={630} forste={RAV} linjer={['USA, 1972', 'Sally Priesand: første', 'kvinnelige reformrabbiner']} />
                            </Kort>
                        )}
                        {beat >= 3 && (
                            <Kort x={460} y={520} w={760} h={330}>
                                <Linjer x={840} y={590} forste={MORK} linjer={['I dag: to spor i samme religion']} fs={36} />
                                <Linjer x={840} y={660} farge={RAV} linjer={['Ikke-ortodokse retninger:', 'kvinner som rabbinere og kantorer']} fs={32} />
                                <Linjer x={840} y={775} farge={BLA} linjer={['Ortodokse: minst ti voksne', 'jødiske menn til gudstjenesten']} fs={32} />
                            </Kort>
                        )}
                    </>
                )}

                {modus === 'india' && (
                    <>
                        {beat >= 3 && (
                            <>
                                <Merke x={rajasthan[0]} y={rajasthan[1]} tekst="Rajasthan" farge="#7c2d12" dy={-36} />
                                <Merke x={bengal[0]} y={bengal[1]} tekst="Bengal" farge="#7c2d12" dx={0} dy={60} />
                            </>
                        )}
                        {beat === 0 && (
                            <Kort x={KX} y={280} w={KW} h={250} farge={RAV}>
                                <Linjer x={KM} y={355} forste={RAV} linjer={['Hinduismen', 'ingen felles ledelse', 'ingen felles bok']} />
                            </Kort>
                        )}
                        {beat === 1 && (
                            <Kort x={KX} y={110} w={KW} h={680} farge={RAV}>
                                <Linjer x={KM} y={180} forste={RAV} linjer={['En gammel hymne', 'Urmennesket']} />
                                <Urmennesket x={KX + 170} y={340} />
                            </Kort>
                        )}
                        {beat === 2 && (
                            <Kort x={KX} y={200} w={KW} h={460} farge={RAV}>
                                <Linjer x={KM} y={275} forste={BLA} linjer={['Brahminer', 'den øverste kasten:', 'tempeltjenesten']} />
                                <Linjer x={KM} y={480} forste={RAV} linjer={['Bhakti', 'henvender seg til alle,', 'menn og kvinner']} />
                            </Kort>
                        )}
                        {beat >= 3 && (
                            <Kort x={KX} y={280} w={KW} h={340} farge="#7c2d12">
                                <Linjer x={KM} y={350} forste="#7c2d12" linjer={['Sati, enkebrenning', 'særlig blant høykaster', 'ble aldri vanlig', 'forbudt i Bengal 1829,', 'senere i hele India']} />
                            </Kort>
                        )}
                    </>
                )}
            </svg>
        </div>
    );
}
