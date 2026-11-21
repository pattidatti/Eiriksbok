import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { frø } from './felles';
import { TrommenOverskrift } from './TrommenOverskrift';

/**
 * Kart over Nord-Europa. «misjon»: misjonærene kommer til de samiske områdene, og trommene
 * forsvinner. «brann»: trommene samles inn, rundt hundre brenner i København i 1728, og rundt
 * hundre er igjen. «reise»: vår tromme blir tatt i Namdalen i 1723 og havner i Meiningen i
 * 1837. «hjem»: brevet fra Snåsa i 2021, ja i 2023, og trommen som reiser hjem.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'misjon' | 'brann' | 'reise' | 'hjem';

const KOBENHAVN: LngLat = [12.57, 55.68];
const NAMDALEN: LngLat = [12.3, 64.75];
const SNASA: LngLat = [12.38, 64.25];
const MEININGEN: LngLat = [10.42, 50.57];
const TYSKLAND_ID = '276';

/** De samiske områdene, grovt tegnet: fra fjellene i sør til Kolahalvøya i øst. */
const SAPMI: LngLat[] = [
    [11.6, 62.0],
    [10.9, 64.2],
    [12.6, 66.0],
    [14.4, 67.8],
    [16.2, 69.1],
    [19.1, 70.0],
    [23.0, 70.7],
    [27.6, 70.8],
    [31.0, 70.1],
    [35.5, 69.1],
    [40.0, 67.6],
    [37.8, 66.2],
    [34.4, 66.6],
    [30.4, 67.1],
    [28.3, 66.2],
    [25.8, 65.5],
    [22.8, 65.8],
    [19.8, 64.7],
    [16.8, 63.5],
    [14.3, 62.0],
];

function inni(pt: LngLat) {
    let inne = false;
    for (let i = 0, j = SAPMI.length - 1; i < SAPMI.length; j = i++) {
        const [xi, yi] = SAPMI[i];
        const [xj, yj] = SAPMI[j];
        if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi)
            inne = !inne;
    }
    return inne;
}

/** Mange små trommer, tett i tett: en mengde som ikke skal telles («flere hundre»). */
const MENGDE: LngLat[] = (() => {
    const ut: LngLat[] = [];
    for (let i = 0; ut.length < 240 && i < 6000; i++) {
        const p: LngLat = [11 + frø(i) * 29, 62 + frø(i + 999) * 9];
        if (inni(p)) ut.push(p);
    }
    return ut;
})();

/** Noen få, store trommer til misjonsscenen. */
const STORE: LngLat[] = [
    [13.6, 65.2],
    [15.8, 67.4],
    [19.5, 68.6],
    [24.2, 69.4],
    [27.5, 68.3],
    [33.5, 67.9],
    [21.5, 66.5],
    [17.2, 65.2],
];

const Land = memo(function Land({
    geographies,
    sti,
    tyskland,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    tyskland: boolean;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const tysk = tyskland && String(g.id) === TYSKLAND_ID;
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={tysk ? '#fde68a' : '#ece6d6'}
                        stroke={tysk ? '#b45309' : '#a8a08a'}
                        strokeWidth={tysk ? 3 : 1.5}
                    />
                );
            })}
        </>
    );
});

function Tromme({
    x,
    y,
    s = 1,
    farge = '#e9cf9f',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse rx={16} ry={12} fill={farge} stroke="#7c4a1e" strokeWidth={3} />
            <circle r={3.5} fill="#8b2a1a" />
            <path d="M -11 -2 L 11 -2" stroke="#8b2a1a" strokeWidth={2} />
        </g>
    );
}

function Flamme({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M 0 -34 C 14 -18 18 -6 12 6 C 6 14 -6 14 -12 6 C -18 -6 -8 -16 0 -34 Z"
                fill="#f97316"
            />
            <path
                d="M 0 -18 C 7 -10 8 -2 4 4 C 1 7 -3 7 -5 4 C -8 -2 -4 -8 0 -18 Z"
                fill="#fde047"
            />
        </g>
    );
}

function Kors({ x, y }: { x: number; y: number }) {
    return (
        <path
            transform={`translate(${x} ${y})`}
            d="M -4 -18 h 8 v 8 h 8 v 8 h -8 v 16 h -8 v -16 h -8 v -8 h 8 Z"
            fill="#1e3a8a"
            stroke="#fff"
            strokeWidth={2}
        />
    );
}

function Merke({
    x,
    y,
    tekst,
    dy = -26,
    anker = 'middle',
    farge = '#0f172a',
}: {
    x: number;
    y: number;
    tekst: string;
    dy?: number;
    anker?: 'start' | 'middle' | 'end';
    farge?: string;
}) {
    return (
        <text
            x={x}
            y={y + dy}
            textAnchor={anker}
            fontSize={34}
            fontWeight={900}
            fill={farge}
            stroke="#fff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

function Punkt({ x, y, farge = '#0f172a' }: { x: number; y: number; farge?: string }) {
    return <circle cx={x} cy={y} r={11} fill={farge} stroke="#fff" strokeWidth={4} />;
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    misjon: [
        '1600- og 1700-tallet: misjonærer kommer',
        'Samene skal bli kristne',
        'Trommene må bort',
        'Noaidene jaktes på',
    ],
    brann: [
        'Hundrevis samlet inn eller ødelagt',
        'København, 1728: bybrann',
        'Igjen i hele verden i dag',
        'De fleste: i museer utenfor Sápmi',
    ],
    reise: [
        '1723: tatt i Namdalen',
        'En lang omvei',
        '1837: Meininger museum',
        'Nesten to hundre år i Tyskland',
    ],
    hjem: [
        'Fortsatt i Tyskland',
        '2021: Snåsa spør',
        'Juni 2023: museet sier ja',
        '3. november 2023: hjemme i Saepmie',
        'Flere ligger fortsatt i Tyskland',
    ],
};

export function TrommenKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'misjon';
    const { geographies } = useFilmVerden([
        [-6, 46],
        [44, 72],
    ]);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [380, 110],
                    [1220, 820],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [4, 49.6],
                        [33, 71.2],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const linje = (pts: LngLat[]) => `M ${pts.map((ll) => p(ll).join(' ')).join(' L ')}`;
    const sapmi = `${linje(SAPMI)} Z`;
    const kbh = p(KOBENHAVN);
    const nam = p(NAMDALEN);
    const sna = p(SNASA);
    const mei = p(MEININGEN);
    const dur = (s: number) => (playing ? s : 0);

    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    const visTyskland = modus === 'hjem' && beat >= 4;

    // Omveien: ingen vet nøyaktig hvor trommen var, så streken går i en løs bue med spørsmålstegn.
    const omvei = `M ${nam[0]} ${nam[1]} C ${nam[0] - 260} ${nam[1] + 160}, ${mei[0] + 320} ${mei[1] - 300}, ${mei[0]} ${mei[1]}`;
    const hjemvei = `M ${mei[0]} ${mei[1]} Q ${mei[0] - 260} ${(mei[1] + sna[1]) / 2} ${sna[0]} ${sna[1]}`;

    return (
        <div className="absolute inset-0 bg-[#bcd4e4] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} tyskland={visTyskland} />
                <path
                    d={sapmi}
                    fill="#f59e0b"
                    fillOpacity={modus === 'misjon' || modus === 'brann' ? 0.28 : 0.14}
                    stroke="#b45309"
                    strokeWidth={4}
                    strokeDasharray="14 8"
                />
                {(modus === 'misjon' || modus === 'brann') && (
                    <Merke x={p([38, 65.4])[0]} y={p([38, 65.4])[1]} tekst="Sápmi" dy={14} />
                )}

                {modus === 'misjon' && (
                    <>
                        {/* Misjonærene: piler inn i de samiske områdene. */}
                        {[
                            [
                                [9.5, 61.2],
                                [12.6, 64.6],
                            ],
                            [
                                [13.2, 61.5],
                                [17.5, 66.5],
                            ],
                            [
                                [20.5, 62.6],
                                [24.5, 68.6],
                            ],
                        ].map((ab, i) => (
                            <motion.path
                                key={i}
                                d={linje(ab as LngLat[])}
                                fill="none"
                                stroke="#1e3a8a"
                                strokeWidth={9}
                                strokeLinecap="round"
                                markerEnd="url(#pil-trommen)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: dur(1.6), delay: dur(0.5 + i * 0.5) }}
                            />
                        ))}
                        <defs>
                            <marker
                                id="pil-trommen"
                                viewBox="0 0 10 10"
                                refX="5"
                                refY="5"
                                markerWidth="3.2"
                                markerHeight="3.2"
                                orient="auto"
                            >
                                <path d="M 0 0 L 10 5 L 0 10 Z" fill="#1e3a8a" />
                            </marker>
                        </defs>
                        <Merke
                            x={p([13, 61.0])[0]}
                            y={p([13, 61.0])[1]}
                            tekst="misjonærer"
                            dy={46}
                        />
                        {STORE.map((pt, i) => {
                            const [x, y] = p(pt);
                            return (
                                <motion.g
                                    key={`t${i}`}
                                    initial={false}
                                    animate={{
                                        opacity: beat >= 2 ? 0.1 : 1,
                                        scale: beat >= 2 ? 0.6 : 1,
                                    }}
                                    transition={{ duration: dur(1.2), delay: dur(0.3 + i * 0.15) }}
                                >
                                    <Tromme x={x} y={y} s={1.5} />
                                </motion.g>
                            );
                        })}
                        {beat >= 1 &&
                            STORE.map((pt, i) => {
                                const [x, y] = p([pt[0] + 1.1, pt[1] - 0.55]);
                                return (
                                    <motion.g
                                        key={`k${i}`}
                                        initial={{ opacity: 0, scale: 0.4 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: dur(0.4 + i * 0.12) }}
                                    >
                                        <Kors x={x} y={y} />
                                    </motion.g>
                                );
                            })}
                    </>
                )}

                {modus === 'brann' &&
                    MENGDE.map((pt, i) => {
                        const [x, y] = p(pt);
                        // Beat 1: en del drar til København og brenner. Beat 2-3: bare et lite
                        // knippe er igjen, og det meste av knippet ligger utenfor Sápmi.
                        const tilKbh = i % 3 === 0;
                        const igjen = i % 5 === 1;
                        const ute = igjen && i % 4 !== 1;
                        let mal: [number, number] = [x, y];
                        let op = 1;
                        if (beat >= 1) {
                            if (tilKbh) {
                                mal = [
                                    kbh[0] + (frø(i) - 0.5) * 70,
                                    kbh[1] + (frø(i + 3) - 0.5) * 50,
                                ];
                                op = 0;
                            } else op = beat >= 2 && !igjen ? 0 : beat === 1 ? 0.55 : 1;
                        }
                        if (beat >= 3 && ute) {
                            mal = [
                                p([2 + frø(i) * 22, 51 + frø(i + 5) * 6])[0],
                                p([2 + frø(i) * 22, 51 + frø(i + 5) * 6])[1],
                            ];
                        }
                        return (
                            <motion.g
                                key={i}
                                initial={false}
                                animate={{ x: mal[0] - x, y: mal[1] - y, opacity: op }}
                                transition={{
                                    duration: dur(beat === 1 && tilKbh ? 2.4 : 1.6),
                                    delay: dur(0.2 + (i % 40) * 0.03),
                                    opacity: {
                                        delay: dur(beat === 1 && tilKbh ? 2.6 : 0.3),
                                        duration: dur(1),
                                    },
                                }}
                            >
                                <Tromme x={x} y={y} s={0.55} />
                            </motion.g>
                        );
                    })}
                {modus === 'brann' && (
                    <>
                        <Punkt x={kbh[0]} y={kbh[1]} />
                        <Merke x={kbh[0] - 24} y={kbh[1]} tekst="København" dy={52} anker="end" />
                        {beat === 1 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: dur(2.4), duration: dur(0.8) }}
                            >
                                <Flamme x={kbh[0]} y={kbh[1] - 6} s={2.2} />
                                <Flamme x={kbh[0] + 34} y={kbh[1] + 10} s={1.4} />
                                <Flamme x={kbh[0] - 30} y={kbh[1] + 12} s={1.5} />
                            </motion.g>
                        )}
                    </>
                )}

                {modus === 'reise' && (
                    <>
                        {beat >= 1 && (
                            <motion.path
                                d={omvei}
                                fill="none"
                                stroke="#7c4a1e"
                                strokeWidth={7}
                                strokeLinecap="round"
                                initial={{ pathLength: beat === 1 ? 0 : 1, opacity: 0.85 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: dur(3) }}
                            />
                        )}
                        {beat === 1 &&
                            [0.3, 0.62].map((f, i) => {
                                const x = nam[0] + (mei[0] - nam[0]) * f + (f < 0.5 ? -170 : 120);
                                const y = nam[1] + (mei[1] - nam[1]) * f;
                                return (
                                    <motion.text
                                        key={i}
                                        x={x}
                                        y={y}
                                        fontSize={64}
                                        fontWeight={900}
                                        fill="#7c4a1e"
                                        stroke="#fff"
                                        strokeWidth={8}
                                        paintOrder="stroke"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: dur(1 + i * 1) }}
                                    >
                                        ?
                                    </motion.text>
                                );
                            })}
                        <Punkt x={nam[0]} y={nam[1]} farge="#b45309" />
                        <Merke x={nam[0] - 22} y={nam[1]} tekst="Namdalen" dy={12} anker="end" />
                        {beat >= 2 && (
                            <>
                                <Punkt x={mei[0]} y={mei[1]} />
                                <Merke
                                    x={mei[0] - 22}
                                    y={mei[1]}
                                    tekst="Meiningen"
                                    dy={12}
                                    anker="end"
                                />
                            </>
                        )}
                        {(() => {
                            const pos = beat >= 2 ? mei : nam;
                            return (
                                <motion.g
                                    initial={false}
                                    animate={{ x: pos[0] - nam[0], y: pos[1] - nam[1] - 50 }}
                                    transition={{ duration: dur(2.6), delay: dur(0.3) }}
                                >
                                    <Tromme x={nam[0]} y={nam[1]} s={2.4} />
                                    {beat >= 2 && (
                                        <rect
                                            x={nam[0] - 52}
                                            y={nam[1] - 42}
                                            width={104}
                                            height={84}
                                            rx={8}
                                            fill="#cfe8f5"
                                            fillOpacity={0.35}
                                            stroke="#64748b"
                                            strokeWidth={4}
                                        />
                                    )}
                                </motion.g>
                            );
                        })()}
                    </>
                )}

                {modus === 'hjem' && (
                    <>
                        <Punkt x={mei[0]} y={mei[1]} />
                        <Merke x={mei[0] - 22} y={mei[1]} tekst="Meiningen" dy={12} anker="end" />
                        <Punkt x={sna[0]} y={sna[1]} farge="#0d9488" />
                        <Merke x={sna[0] + 22} y={sna[1]} tekst="Snåsa" dy={12} anker="start" />
                        {beat === 1 && (
                            <>
                                <motion.path
                                    d={`M ${sna[0]} ${sna[1]} Q ${sna[0] + 300} ${(mei[1] + sna[1]) / 2} ${mei[0]} ${mei[1]}`}
                                    fill="none"
                                    stroke="#0d9488"
                                    strokeWidth={5}
                                    strokeDasharray="4 12"
                                    strokeLinecap="round"
                                    opacity={0.8}
                                />
                                <motion.g
                                    initial={{ x: 0, y: 0 }}
                                    animate={{ x: mei[0] - sna[0] + 40, y: mei[1] - sna[1] - 70 }}
                                    transition={{ duration: dur(3), delay: dur(0.5) }}
                                >
                                    <rect
                                        x={sna[0] - 34}
                                        y={sna[1] - 24}
                                        width={68}
                                        height={48}
                                        rx={4}
                                        fill="#fff"
                                        stroke="#0d9488"
                                        strokeWidth={4}
                                    />
                                    <path
                                        d={`M ${sna[0] - 34} ${sna[1] - 24} L ${sna[0]} ${sna[1] + 4} L ${sna[0] + 34} ${sna[1] - 24}`}
                                        fill="none"
                                        stroke="#0d9488"
                                        strokeWidth={4}
                                    />
                                </motion.g>
                            </>
                        )}
                        {beat >= 2 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: dur(0.6) }}
                            >
                                <circle cx={mei[0] + 110} cy={mei[1] - 30} r={34} fill="#0d9488" />
                                <path
                                    d={`M ${mei[0] + 94} ${mei[1] - 30} l 11 12 l 22 -26`}
                                    fill="none"
                                    stroke="#fff"
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </motion.g>
                        )}
                        {beat >= 3 && (
                            <motion.path
                                d={hjemvei}
                                fill="none"
                                stroke="#0d9488"
                                strokeWidth={8}
                                strokeLinecap="round"
                                initial={{ pathLength: beat === 3 ? 0 : 1 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: dur(3), delay: dur(0.4) }}
                            />
                        )}
                        {(() => {
                            // Ved Meiningen står trommen til venstre for punktet, ved Snåsa til høyre,
                            // så den aldri dekker bynavnet.
                            const pos: [number, number] =
                                beat >= 3 ? [sna[0] - 80, sna[1] - 40] : [mei[0] - 90, mei[1] - 40];
                            return (
                                <motion.g
                                    initial={false}
                                    animate={{
                                        x: pos[0] - mei[0],
                                        y: pos[1] - mei[1],
                                        scale: beat >= 3 ? 1.2 : 1,
                                    }}
                                    transition={{ duration: dur(3), delay: dur(0.4) }}
                                >
                                    {beat >= 3 && (
                                        <circle
                                            cx={mei[0]}
                                            cy={mei[1]}
                                            r={62}
                                            fill="#99f6e4"
                                            fillOpacity={0.6}
                                        />
                                    )}
                                    <Tromme x={mei[0]} y={mei[1]} s={2.4} />
                                </motion.g>
                            );
                        })()}
                    </>
                )}
            </svg>

            <TrommenOverskrift tekst={overskrift} />

            <AnimatePresence>
                {modus === 'misjon' && beat === 3 && (
                    <motion.div
                        key="poulsen"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: dur(0.6) }}
                        className="absolute bottom-[7%] right-[3%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
                    >
                        <div className="font-black text-3xl text-slate-900">
                            1691: Anders Poulsen
                        </div>
                        <div className="font-bold text-2xl text-red-800">
                            trommen tatt, stilt for retten
                        </div>
                    </motion.div>
                )}
                {modus === 'brann' && beat === 1 && (
                    <motion.div
                        key="brant"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[7%] right-[3%]"
                    >
                        <Teller
                            verdi={100}
                            etikett="trommer brant i København"
                            prefiks="ca. "
                            tone="rod"
                            forsinkelse={dur(2.8)}
                        />
                    </motion.div>
                )}
                {modus === 'brann' && beat >= 2 && (
                    <motion.div
                        key="igjen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[7%] right-[3%]"
                    >
                        <Teller
                            verdi={100}
                            etikett="samiske trommer igjen i verden"
                            prefiks="ca. "
                            forsinkelse={dur(0.8)}
                        />
                    </motion.div>
                )}
                {modus === 'reise' && beat === 0 && (
                    <motion.div
                        key="westen"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: dur(0.8) }}
                        className="absolute bottom-[7%] right-[3%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl font-black text-3xl text-slate-900"
                    >
                        Tatt av misjonæren Thomas von Westen
                    </motion.div>
                )}
                {modus === 'reise' && beat === 3 && (
                    <motion.div
                        key="aar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[7%] right-[3%]"
                    >
                        <Teller
                            verdi={200}
                            etikett="år bak glass i Meiningen"
                            prefiks="nesten "
                            forsinkelse={dur(0.6)}
                        />
                    </motion.div>
                )}
                {modus === 'hjem' && beat === 1 && (
                    <motion.div
                        key="brev"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: dur(0.6) }}
                        className="absolute bottom-[7%] right-[3%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
                    >
                        <div className="font-black text-3xl text-teal-800">Saemien Sijte</div>
                        <div className="font-bold text-2xl text-slate-700">
                            det sørsamiske museet i Snåsa
                        </div>
                    </motion.div>
                )}
                {modus === 'hjem' && beat === 3 && (
                    <motion.div
                        key="forste"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: dur(2.6) }}
                        className="absolute bottom-[7%] right-[3%] px-5 py-3 rounded-2xl bg-teal-700 shadow-xl font-black text-3xl text-white"
                    >
                        300 år etter at den ble tatt
                    </motion.div>
                )}
                {modus === 'hjem' && beat >= 4 && (
                    <motion.div
                        key="forste-tysk"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: dur(0.6) }}
                        className="absolute top-[16%] right-[3%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
                    >
                        <div className="font-black text-3xl text-slate-900">
                            Den første fra et tysk museum
                        </div>
                        <div className="font-bold text-2xl text-amber-800">
                            flere samiske trommer er fortsatt i Tyskland
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
