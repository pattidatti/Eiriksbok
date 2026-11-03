import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoConicConformal, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { rammePunkter, type LngLat } from '../../kart/grenser';
import type { VisualProps } from '../../types';

/**
 * Middelhavet rundt Augustus: Cæsar og Rubicon, de to herskerne i Roma og Alexandria,
 * Octavius alene på toppen, og Pax Romana med handel på havet. Mørkt hav, sandfarget land,
 * forklaringen i et kort nede til venstre.
 */

type Modus = 'caesar' | 'to' | 'alene' | 'pax';

const B = 1600;
const H = 900;
const ROD = '#b91c1c';
const BLA = '#1d4ed8';
const LILLA = '#7e22ce';
const GULL = '#ca8a04';

const ROMA: LngLat = [12.5, 41.9];
const RUBICON: LngLat = [12.4, 44.1];
const GALLIA: LngLat = [2.4, 47];
const ACTIUM: LngLat = [20.75, 38.95];
const ALEXANDRIA: LngLat = [29.9, 31.2];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    caesar: [
        [-5, 37],
        [22, 52],
    ],
    to: [
        [4, 29],
        [35, 46],
    ],
    alene: [
        [-8, 29],
        [37, 47],
    ],
    pax: [
        [-8, 29],
        [37, 47],
    ],
};

/** Landene rundt Middelhavet (ISO-numre). Dagens grenser, så det er omtrentlig. */
const MIDDELHAVET = [
    '724',
    '620',
    '250',
    '380',
    '705',
    '191',
    '070',
    '499',
    '008',
    '300',
    '792',
    '196',
    '760',
    '422',
    '376',
    '275',
    '400',
    '818',
    '434',
    '788',
    '012',
    '504',
    '470',
    '807',
];

/** Sjøruter med mellompunkter, så skipene seiler på havet og ikke over land. */
const RUTER: LngLat[][] = [
    [
        [12.2, 41.6],
        [11.6, 40],
        [12.6, 38.6],
        [15.6, 38.1],
        [18.5, 36.4],
        [24, 34],
        [29.8, 31.6],
    ],
    [
        [12.2, 41.6],
        [11, 39.8],
        [9, 38.4],
        [4, 38.2],
        [0.2, 37.6],
        [-2.2, 36.6],
    ],
    [
        [29.8, 31.6],
        [27.6, 34],
        [25.6, 36.2],
        [23.8, 37.6],
    ],
    [
        [-2.2, 36.6],
        [-5.4, 36.0],
    ],
];

interface Kort {
    tittel: string;
    tekst: string;
    farge: string;
}

const KORT: Record<Modus, Kort[]> = {
    caesar: [
        { tittel: 'Roma', tekst: 'En republikk: ingen konge', farge: '#0f172a' },
        { tittel: 'Kamp om makten', tekst: 'Generaler med egne hærer', farge: ROD },
        { tittel: '58-50 fvt.', tekst: 'Cæsar erobrer Gallia', farge: ROD },
        { tittel: '49 fvt.', tekst: 'Over Rubicon med hæren', farge: ROD },
        { tittel: 'Cæsar', tekst: 'Diktator på livstid', farge: GULL },
    ],
    to: [
        { tittel: 'Etter mordet', tekst: 'En ny borgerkrig', farge: ROD },
        {
            tittel: 'Antonius og Octavius',
            tekst: 'knuser morderne Brutus og Cassius',
            farge: '#0f172a',
        },
        { tittel: 'To herskere', tekst: 'Verden var ikke stor nok for to', farge: '#0f172a' },
        {
            tittel: 'Antonius og Kleopatra',
            tekst: 'Et rike i øst, styrt fra Alexandria',
            farge: LILLA,
        },
        { tittel: 'Octavius sin propaganda', tekst: 'Antonius som forræder', farge: ROD },
    ],
    alene: [
        { tittel: '30 fvt.', tekst: 'Antonius og Kleopatra dør i Egypt', farge: LILLA },
        { tittel: 'Octavius', tekst: 'Enehersker over middelhavsområdet', farge: ROD },
        { tittel: 'Octavius', tekst: 'Verdens mektigste mann', farge: GULL },
    ],
    pax: [
        { tittel: 'Etter hundre år med borgerkrig', tekst: 'Endelig ro', farge: '#0f766e' },
        { tittel: 'Handel blomstrer', tekst: 'Ingen pirater, sikre grenser', farge: '#0f766e' },
        { tittel: 'Pax Romana', tekst: 'Den romerske freden: rundt 200 år', farge: GULL },
        { tittel: 'Europa', tekst: 'Europas lengste fredstid før moderne tid', farge: GULL },
    ],
};

export function AugustusKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'caesar';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => {
        const [sv, no] = UTSNITT[modus];
        return geoConicConformal()
            .parallels([33, 45])
            .rotate([-15, 0])
            .fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                rammePunkter(sv, no) as never
            );
    }, [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const land = (id: string) =>
        geographies.find((g) => String((g as { id?: unknown }).id).padStart(3, '0') === id);
    const fyll = (ids: string[], farge: string, key: string, forsinkelse = 0) =>
        ids.map((id, i) => {
            const g = land(id);
            if (!g) return null;
            return (
                <motion.path
                    key={`${key}-${id}`}
                    d={sti(g as never) ?? ''}
                    fill={farge}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.85 }}
                    transition={{ duration: 0.8, delay: forsinkelse + (i % 8) * 0.08 }}
                />
            );
        });

    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#1f4e6b' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} />

                {/* Italia er alltid Romas hjem */}
                {fyll(['380'], '#fde7c2', 'italia')}

                {modus === 'caesar' && (
                    <>
                        {beat >= 2 && fyll(['250', '056'], '#fca5a5', 'gallia')}
                        {beat >= 2 && <Navn ll={GALLIA} tekst="GALLIA" p={p} />}
                        {beat === 1 &&
                            [
                                [7.8, 44.4],
                                [16.4, 40.6],
                                [10.6, 46.2],
                            ].map((ll, i) => (
                                <Bane
                                    key={i}
                                    fra={p(ll as LngLat)}
                                    til={p(ROMA)}
                                    farge={ROD}
                                    forsinkelse={i * 0.5}
                                />
                            ))}
                        {beat === 2 && <Bane fra={p(RUBICON)} til={p(GALLIA)} farge={ROD} />}
                        {beat >= 3 && <Bane fra={p(GALLIA)} til={p(ROMA)} farge={ROD} />}
                        {beat >= 3 && (
                            <Merke pos={p(RUBICON)} tekst="Rubicon" farge={ROD} side="hoyre" />
                        )}
                        <Merke
                            pos={p(ROMA)}
                            tekst="Roma"
                            farge="#0f172a"
                            side="under"
                            glod={beat === 4}
                        />
                    </>
                )}

                {(modus === 'to' || modus === 'alene') && (
                    <>
                        {((modus === 'to' && beat >= 3) || modus === 'alene') &&
                            fyll(['818'], '#e9d5ff', 'egypt')}
                        {modus === 'alene' &&
                            beat >= 1 &&
                            fyll(MIDDELHAVET, '#fca5a5', 'alle', 0.2)}
                        {modus === 'to' && beat === 0 && <Puls pos={p(ROMA)} farge={ROD} />}
                        {modus === 'to' && beat <= 1 && (
                            <>
                                <Bane fra={p([14.5, 40.8])} til={p([19.6, 41.2])} farge={ROD} />
                                <Bane
                                    fra={p([24.5, 38.2])}
                                    til={p([20.6, 40.6])}
                                    farge="#0f172a"
                                    forsinkelse={0.4}
                                />
                            </>
                        )}
                        {modus === 'to' && beat === 1 && <Kryss pos={p([22.4, 40.4])} />}
                        {modus === 'to' && beat >= 2 && (
                            <Bane fra={p(ROMA)} til={p(ALEXANDRIA)} farge={BLA} />
                        )}
                        {modus === 'to' && beat === 4 && <Bolger pos={p(ROMA)} />}
                        {modus === 'alene' && beat === 0 && (
                            <Bane fra={p(ACTIUM)} til={p(ALEXANDRIA)} farge={LILLA} />
                        )}
                        {modus === 'alene' && beat === 0 && (
                            <Merke pos={p(ACTIUM)} tekst="Actium" farge="#0f172a" side="venstre" />
                        )}
                        <Merke
                            pos={p(ROMA)}
                            tekst={
                                modus === 'alene'
                                    ? 'Roma: Octavius'
                                    : beat === 1
                                      ? 'Roma'
                                      : beat >= 2
                                        ? 'Roma: Octavius'
                                        : 'Roma'
                            }
                            farge={modus === 'to' && beat <= 1 ? '#0f172a' : ROD}
                            side="under"
                            glod={modus === 'alene' && beat === 2}
                        />
                        {(modus === 'alene' || beat >= 2) && (
                            <Merke
                                pos={p(ALEXANDRIA)}
                                tekst={modus === 'to' ? 'Alexandria: Antonius' : 'Alexandria'}
                                farge={modus === 'to' ? BLA : LILLA}
                                side="under"
                            />
                        )}
                        {modus === 'alene' && beat >= 1 && (
                            <text
                                x={B - 60}
                                y={H - 50}
                                textAnchor="end"
                                fontSize={30}
                                fontWeight={800}
                                fill="#0f172a"
                                stroke="#ffffff"
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                Omtrentlig, tegnet med dagens grenser
                            </text>
                        )}
                    </>
                )}

                {modus === 'pax' && (
                    <>
                        {fyll(MIDDELHAVET, '#fca5a5', 'pax')}
                        {beat >= 1 &&
                            RUTER.map((r, i) => <Rute key={i} punkter={r.map(p)} nr={i} />)}
                        {beat >= 1 && <Pirat pos={p([5, 40.5])} />}
                        {beat >= 2 && (
                            <motion.text
                                x={p([18, 35.2])[0]}
                                y={p([18, 35.2])[1]}
                                textAnchor="middle"
                                fontSize={64}
                                fontWeight={900}
                                letterSpacing={10}
                                fill="#fde68a"
                                stroke="#1f4e6b"
                                strokeWidth={10}
                                paintOrder="stroke"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1 }}
                            >
                                PAX ROMANA
                            </motion.text>
                        )}
                        <Merke pos={p(ROMA)} tekst="Roma" farge="#0f172a" side="under" />
                    </>
                )}
            </svg>

            <div className="absolute left-[3%] bottom-[5%]" style={{ width: '36%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
                        className="rounded-2xl bg-white/95 shadow-2xl px-6 py-4 border-t-[10px]"
                        style={{ borderColor: kort.farge }}
                    >
                        <div
                            className="text-2xl md:text-3xl font-black"
                            style={{ color: kort.farge }}
                        >
                            {kort.tittel}
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-slate-800 mt-1">
                            {kort.tekst}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#e8d9b5"
                    stroke="#b9a57c"
                    strokeWidth={1.2}
                />
            ))}
        </>
    );
});

function Navn({
    ll,
    tekst,
    p,
}: {
    ll: LngLat;
    tekst: string;
    p: (ll: LngLat) => [number, number];
}) {
    const [x, y] = p(ll);
    return (
        <motion.text
            x={x}
            y={y}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1 }}
            textAnchor="middle"
            fontSize={48}
            fontWeight={900}
            letterSpacing={8}
            fill="#7f1d1d"
        >
            {tekst}
        </motion.text>
    );
}

function Merke({
    pos,
    tekst,
    farge,
    side,
    glod,
}: {
    pos: [number, number];
    tekst: string;
    farge: string;
    side: 'under' | 'hoyre' | 'venstre';
    glod?: boolean;
}) {
    const tx = side === 'hoyre' ? 26 : side === 'venstre' ? -26 : 0;
    const ty = side === 'under' ? 56 : 12;
    const anker = side === 'hoyre' ? 'start' : side === 'venstre' ? 'end' : 'middle';
    return (
        <g transform={`translate(${pos[0]} ${pos[1]})`}>
            {glod && (
                <motion.circle
                    r={44}
                    fill={GULL}
                    animate={{ opacity: [0.25, 0.65, 0.25], scale: [1, 1.35, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
            <circle r={13} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <text
                x={tx}
                y={ty}
                textAnchor={anker}
                fontSize={36}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={9}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </g>
    );
}

/** En bue som tegnes fram, med en prikk som glir langs den. */
function Bane({
    fra,
    til,
    farge,
    forsinkelse = 0,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
}) {
    const midt: [number, number] = [(fra[0] + til[0]) / 2, (fra[1] + til[1]) / 2 - 70];
    const d = `M ${fra.join(' ')} Q ${midt.join(' ')} ${til.join(' ')}`;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: forsinkelse, duration: 1.8, ease: 'easeInOut' }}
            />
            <motion.g
                initial={{ x: fra[0], y: fra[1], opacity: 0 }}
                animate={{ x: til[0], y: til[1], opacity: 1 }}
                transition={{ delay: forsinkelse, duration: 1.8, ease: 'easeInOut' }}
            >
                <path
                    d="M 0 -16 L 14 10 L -14 10 Z"
                    fill={farge}
                    stroke="#ffffff"
                    strokeWidth={3}
                />
            </motion.g>
        </g>
    );
}

function Puls({ pos, farge }: { pos: [number, number]; farge: string }) {
    return (
        <g transform={`translate(${pos[0]} ${pos[1]})`}>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    r={30}
                    fill="none"
                    stroke={farge}
                    strokeWidth={6}
                    initial={{ scale: 0.4, opacity: 0.9 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity }}
                />
            ))}
        </g>
    );
}

/** Budskapet sprer seg fra Roma: ringer som brer seg ut. */
function Bolger({ pos }: { pos: [number, number] }) {
    return (
        <g transform={`translate(${pos[0]} ${pos[1]})`}>
            {[0, 1, 2, 3].map((i) => (
                <motion.circle
                    key={i}
                    r={40}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={5}
                    initial={{ scale: 0.5, opacity: 0.9 }}
                    animate={{ scale: 7, opacity: 0 }}
                    transition={{
                        duration: 3.2,
                        delay: i * 0.8,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                />
            ))}
        </g>
    );
}

/** En sjørute med et lite handelsskip som seiler fram og tilbake. */
function Rute({ punkter, nr }: { punkter: [number, number][]; nr: number }) {
    const d = punkter.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');
    const xs = punkter.map((q) => q[0]);
    const ys = punkter.map((q) => q[1]);
    return (
        <g>
            <path
                d={d}
                fill="none"
                stroke="#fde68a"
                strokeWidth={4}
                strokeDasharray="12 12"
                opacity={0.75}
            />
            {punkter.length > 2 && (
                <motion.g
                    initial={{ x: xs[0], y: ys[0] }}
                    animate={{
                        x: [...xs, ...xs.slice().reverse()],
                        y: [...ys, ...ys.slice().reverse()],
                    }}
                    transition={{ duration: 12, delay: nr * 1.3, repeat: Infinity, ease: 'linear' }}
                >
                    <path d="M -18 0 L 18 0 L 12 9 L -12 9 Z" fill="#7c4a26" />
                    <path
                        d="M 0 -2 L 0 -26 L 14 -8 Z"
                        fill="#fef3c7"
                        stroke="#7c4a26"
                        strokeWidth={2}
                    />
                </motion.g>
            )}
        </g>
    );
}

/** Piratskipet er borte: et lite skip med et rødt kryss ved siden av. */
function Pirat({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
        >
            <g transform={`translate(${pos[0]} ${pos[1]})`}>
                <path d="M -24 0 L 24 0 L 16 12 L -16 12 Z" fill="#1f2937" />
                <path d="M 0 -2 L 0 -34 L 18 -10 Z" fill="#111827" />
                <g transform="translate(46 -10)">
                    <circle r={22} fill="#ffffff" />
                    <path
                        d="M -10 -10 L 10 10 M 10 -10 L -10 10"
                        stroke={ROD}
                        strokeWidth={6}
                        strokeLinecap="round"
                    />
                </g>
                <text
                    x={0}
                    y={52}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    Pirater
                </text>
            </g>
        </motion.g>
    );
}

function Kryss({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
        >
            <g transform={`translate(${pos[0]} ${pos[1]})`}>
                <circle r={30} fill="#ffffff" />
                <path
                    d="M -14 -14 L 14 14 M 14 -14 L -14 14"
                    stroke={ROD}
                    strokeWidth={8}
                    strokeLinecap="round"
                />
            </g>
        </motion.g>
    );
}
