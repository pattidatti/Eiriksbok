import { memo, useEffect, useMemo, useState } from 'react';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
} from 'framer-motion';
import { geoContains, geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over Kypros. Fire modus:
 * «linje»: øya, den grønne linjen fra kyst til kyst, nord og sør, FN.
 * «folk»: to folk blandet over hele øya (prikker), britisk styre og selvstendighet.
 * «1974»: Hellas, kuppet på Kypros, Tyrkia som invaderer nordkysten, våpenhvilen.
 * «flukt»: prikkene flytter seg, gresk-kyprioter sørover og tyrkisk-kyprioter nordover.
 */

type Modus = 'linje' | 'folk' | '1974' | 'flukt';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const OY: Utsnitt = [
    [32.2, 34.5],
    [34.65, 35.75],
];
const VID: Utsnitt = [
    [19.5, 33],
    [37.5, 42],
];

const NICOSIA: LngLat = [33.36, 35.17];
const ATHEN: LngLat = [23.73, 37.98];
const KYRENIA: LngLat = [33.32, 35.36];
const TYRKIA_FRA: LngLat = [33.9, 36.9];

const GRESK = '#2563eb';
const TYRKISK = '#ea580c';
const SOR = '#c9dcf2';
const NORD = '#f2c9a8';
const OYFARGE = '#efe6cf';
const BRITISK = '#b9c3d6';
const LINJE = '#16a34a';

const TITLER: Record<Modus, string[]> = {
    linje: [
        'Kypros',
        'Den grønne linjen',
        'Nord og sør',
        'Buffersone: ingen hær',
        'FN på øya siden 1964',
    ],
    folk: [
        'To folk på én øy',
        'Gresk-kyprioter og tyrkisk-kyprioter',
        'Side om side i årtusener',
        '1878: Storbritannia tar over',
        '1960: Kypros blir selvstendig',
    ],
    '1974': [
        '1974: militærjunta i Hellas',
        '15. juli 1974: kupp på Kypros',
        'Enosis: Kypros og Hellas sammen',
        'Fem dager seinere: Tyrkia invaderer',
        'August 1974: våpenhvile',
    ],
    flukt: [
        'Den store flukten',
        'Over 160 000 flyktet sørover',
        'Over 45 000 flyktet nordover',
        'Naboer ble skilt',
        '1983: Nord-Kypros',
    ],
};

/** Hvor kartet står for hver beat: midtpunkt og zoom (bare «1974» flytter seg). */
function utsikt(modus: Modus, beat: number): { senter: LngLat; zoom: number } {
    if (modus === '1974') {
        if (beat >= 4) return { senter: [33.4, 35.15], zoom: 4.6 };
        if (beat === 3) return { senter: [31.5, 36.4], zoom: 1.9 };
        return { senter: [28.5, 37.2], zoom: 1 };
    }
    return { senter: [33.42, 35.1], zoom: 1 };
}

/** Enkel, fast tilfeldighet, så prikkene ligger likt hver gang. */
function lagTilfeldig(frø: number) {
    let s = frø;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

interface Prikk {
    fra: [number, number];
    til: [number, number];
    gresk: boolean;
}

/** Den delte grensen: punktene i Nord-Kypros som også finnes i Kypros. */
function grenselinje(nord: GeoFeature | undefined, sor: GeoFeature | undefined): LngLat[][] {
    if (!nord || !sor) return [];
    const ringer = (f: GeoFeature): LngLat[][] => {
        const g = f.geometry as { type: string; coordinates: unknown };
        if (g.type === 'Polygon') return g.coordinates as LngLat[][];
        if (g.type === 'MultiPolygon') return (g.coordinates as LngLat[][][]).flat();
        return [];
    };
    const sett = new Set<string>();
    for (const r of ringer(sor)) for (const p of r) sett.add(`${p[0]},${p[1]}`);
    const biter: LngLat[][] = [];
    for (const r of ringer(nord)) {
        let bit: LngLat[] = [];
        for (const p of r) {
            if (sett.has(`${p[0]},${p[1]}`)) bit.push(p);
            else {
                if (bit.length > 1) biter.push(bit);
                bit = [];
            }
        }
        if (bit.length > 1) biter.push(bit);
    }
    return biter;
}

export function KyprosKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'linje';
    const vid = modus === '1974';
    const utsnitt = vid ? VID : OY;
    const { geographies } = useFilmVerden(utsnitt);

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                vid
                    ? [
                          [40, 40],
                          [B - 40, H - 40],
                      ]
                    : [
                          [110, 140],
                          [B - 110, H - 150],
                      ],
                { type: 'MultiPoint', coordinates: utsnitt } as never
            ),
        [vid, utsnitt]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const land = useMemo(() => {
        let nord: GeoFeature | undefined;
        let sor: GeoFeature | undefined;
        let hellas: GeoFeature | undefined;
        let tyrkia: GeoFeature | undefined;
        const andre: GeoFeature[] = [];
        for (const g of geographies) {
            const id = String(g.id);
            if (g.properties?.name === 'N. Cyprus') nord = g;
            else if (id === '196') sor = g;
            else if (id === '300') hellas = g;
            else if (id === '792') tyrkia = g;
            else andre.push(g);
        }
        return { nord, sor, hellas, tyrkia, andre, linje: grenselinje(nord, sor) };
    }, [geographies]);

    // Prikkene: ett merke per gruppe mennesker, spredt over hele øya.
    const prikker = useMemo<Prikk[]>(() => {
        const { nord, sor } = land;
        if (!nord || !sor) return [];
        const r = lagTilfeldig(7);
        const inne: { ll: LngLat; iNord: boolean }[] = [];
        let forsok = 0;
        while (inne.length < 150 && forsok < 6000) {
            forsok++;
            const ll: LngLat = [32.27 + r() * 2.3, 34.56 + r() * 1.1];
            const iNord = geoContains(nord as never, ll);
            if (iNord || geoContains(sor as never, ll)) inne.push({ ll, iNord });
        }
        const nordPunkter = inne.filter((x) => x.iNord);
        const sorPunkter = inne.filter((x) => !x.iNord);
        const r2 = lagTilfeldig(3);
        const nær = (liste: typeof inne) => {
            const q = liste[Math.floor(r2() * liste.length)].ll;
            return [q[0] + (r2() - 0.5) * 0.06, q[1] + (r2() - 0.5) * 0.04] as LngLat;
        };
        return inne.map((x, i) => {
            // Om lag 18 av 96: tyrkisk-kyprioter, resten gresk-kyprioter.
            const gresk = i % 16 >= 3;
            const fra = projeksjon(x.ll) as [number, number];
            let til = fra;
            if (gresk && x.iNord && sorPunkter.length) til = projeksjon(nær(sorPunkter)) as never;
            if (!gresk && !x.iNord && nordPunkter.length)
                til = projeksjon(nær(nordPunkter)) as never;
            return { fra, til, gresk };
        });
    }, [land, projeksjon]);

    // Kameraet glir mellom utsiktene.
    const start = utsikt(modus, beat);
    const lng = useMotionValue(start.senter[0]);
    const lat = useMotionValue(start.senter[1]);
    const zoom = useMotionValue(start.zoom);
    useEffect(() => {
        const m = utsikt(modus, beat);
        const o = { duration: 2.4, ease: 'easeInOut' as const };
        const a = animate(lng, m.senter[0], o);
        const b = animate(lat, m.senter[1], o);
        const c = animate(zoom, m.zoom, o);
        return () => {
            a.stop();
            b.stop();
            c.stop();
        };
    }, [modus, beat, lng, lat, zoom]);
    const [vis, setVis] = useState({
        lng: start.senter[0],
        lat: start.senter[1],
        zoom: start.zoom,
    });
    useMotionValueEvent(lng, 'change', (x) => setVis((s) => ({ ...s, lng: x })));
    useMotionValueEvent(lat, 'change', (x) => setVis((s) => ({ ...s, lat: x })));
    useMotionValueEvent(zoom, 'change', (x) => setVis((s) => ({ ...s, zoom: x })));

    // Øya-kartene står stille; bare 1974-kartet zoomer.
    const senter = vid ? p([vis.lng, vis.lat]) : [B / 2, H / 2];
    const k = vid ? vis.zoom : 1;
    const kartTransform = `translate(${B / 2 - senter[0] * k} ${H / 2 - senter[1] * k}) scale(${k})`;
    const skjerm = (ll: LngLat): [number, number] => {
        const q = p(ll);
        return [B / 2 + (q[0] - senter[0]) * k, H / 2 + (q[1] - senter[1]) * k];
    };

    // Farger på de to delene av øya.
    let nordFarge = OYFARGE;
    let sorFarge = OYFARGE;
    if (modus === 'linje' && beat >= 2) {
        nordFarge = NORD;
        sorFarge = SOR;
    }
    if (modus === 'folk' && beat === 3) {
        nordFarge = BRITISK;
        sorFarge = BRITISK;
    }
    if (modus === '1974' && beat >= 3) nordFarge = NORD;
    if (modus === 'flukt') {
        nordFarge = NORD;
        sorFarge = SOR;
    }
    const hellasFarge = modus === '1974' ? '#bcd0ea' : '#ece6d6';
    const tyrkiaFarge = modus === '1974' && beat >= 3 ? '#f0c4a4' : '#ece6d6';

    // Før 1974 var øya ikke delt: ingen grense mellom nord og sør.
    const samlet =
        modus === 'folk' || (modus === 'linje' && beat === 0) || (modus === '1974' && beat < 4);
    const visLinje =
        (modus === 'linje' && beat >= 1) || modus === 'flukt' || (modus === '1974' && beat >= 4);
    const tittel = TITLER[modus][Math.min(beat, TITLER[modus].length - 1)];

    const merker: { ll: LngLat; tekst: string; farge?: string; stor?: boolean; dy?: number }[] = [];
    if (modus === 'linje') {
        merker.push({ ll: NICOSIA, tekst: 'Nicosia', dy: beat >= 4 ? 64 : 46 });
        if (beat >= 2) {
            merker.push({ ll: [33.75, 35.38], tekst: 'Nord-Kypros', farge: '#9a3412', stor: true });
            merker.push({ ll: [32.95, 34.82], tekst: 'Kypros', farge: '#1e3a8a', stor: true });
        }
    }
    if (modus === 'folk') {
        if (beat === 3)
            merker.push({
                ll: [33.2, 34.75],
                tekst: 'Britisk styre',
                farge: '#334155',
                stor: true,
            });
        if (beat === 4)
            merker.push({
                ll: [33.2, 34.75],
                tekst: 'Selvstendig stat',
                farge: '#0f172a',
                stor: true,
            });
    }
    if (modus === '1974') {
        if (beat <= 3) {
            merker.push({ ll: [22.2, 39.4], tekst: 'Hellas', farge: '#1e3a8a', stor: true });
            merker.push({
                ll: beat === 3 ? [33.4, 37.7] : [32.5, 39.2],
                tekst: 'Tyrkia',
                farge: '#9a3412',
                stor: true,
            });
            merker.push({ ll: [33.2, 34.2], tekst: 'Kypros', farge: '#0f172a', stor: true });
        }
        if (beat <= 2) merker.push({ ll: ATHEN, tekst: 'Athen', dy: -22 });
        if (beat === 2)
            merker.push({
                ll: [28.2, 35.0],
                tekst: 'Kypros + Hellas?',
                farge: '#1e3a8a',
                stor: true,
            });
        if (beat >= 4) {
            merker.push({ ll: [33.75, 35.42], tekst: 'ca. 37 %', farge: '#9a3412', stor: true });
            merker.push({
                ll: [33.0, 34.82],
                tekst: 'Resten av øya',
                farge: '#1e3a8a',
                stor: true,
            });
        }
    }
    if (modus === 'flukt') {
        if (beat === 4) {
            merker.push({ ll: [33.75, 35.42], tekst: 'Nord-Kypros', farge: '#9a3412', stor: true });
            merker.push({ ll: [32.95, 34.82], tekst: 'Kypros', farge: '#1e3a8a', stor: true });
        }
    }

    const ath = skjerm(ATHEN);
    const nic = skjerm(NICOSIA);
    const tfra = skjerm(TYRKIA_FRA);
    const kyr = skjerm(KYRENIA);

    const visPrikker = modus === 'folk' || modus === 'flukt';
    const flytt = modus === 'flukt' ? (beat >= 2 ? 2 : beat >= 1 ? 1 : 0) : 0;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#cfe3f1' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <g transform={kartTransform}>
                    <Land geographies={land.andre} sti={sti} farge="#ece6d6" k={k} />
                    <Land
                        geographies={land.hellas ? [land.hellas] : []}
                        sti={sti}
                        farge={hellasFarge}
                        k={k}
                    />
                    <Land
                        geographies={land.tyrkia ? [land.tyrkia] : []}
                        sti={sti}
                        farge={tyrkiaFarge}
                        k={k}
                    />
                    <Land
                        geographies={land.sor ? [land.sor] : []}
                        sti={sti}
                        farge={sorFarge}
                        k={k}
                        strek={samlet ? sorFarge : undefined}
                    />
                    <Land
                        geographies={land.nord ? [land.nord] : []}
                        sti={sti}
                        farge={nordFarge}
                        k={k}
                        strek={samlet ? nordFarge : undefined}
                    />
                    {visLinje && (
                        <Grense
                            biter={land.linje}
                            sti={sti}
                            k={k}
                            bred={modus === 'linje' && beat >= 3}
                        />
                    )}
                </g>

                {/* Prikkene: to folk, først blandet, så skilt */}
                {visPrikker &&
                    prikker.map((pr, i) => {
                        const flyttes = (pr.gresk && flytt >= 1) || (!pr.gresk && flytt >= 2);
                        const [x, y] = flyttes ? pr.til : pr.fra;
                        const dempet = modus === 'folk' && (beat === 0 || beat >= 3);
                        return (
                            <motion.circle
                                key={i}
                                r={9}
                                fill={pr.gresk ? GRESK : TYRKISK}
                                stroke="#ffffff"
                                strokeWidth={1.5}
                                initial={{ cx: pr.fra[0], cy: pr.fra[1], opacity: 0 }}
                                animate={{
                                    cx: x,
                                    cy: y,
                                    opacity:
                                        modus === 'folk' && beat === 0 ? 0.35 : dempet ? 0.45 : 1,
                                }}
                                transition={{
                                    duration: 2.2,
                                    delay: flyttes ? (i % 20) * 0.06 : (i % 30) * 0.02,
                                    ease: 'easeInOut',
                                }}
                            />
                        );
                    })}

                {/* FN: et blått merke ved Nicosia */}
                {modus === 'linje' && beat >= 4 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transform={`translate(${nic[0]} ${nic[1]})`}
                    >
                        <circle r={32} fill="#0284c7" stroke="#ffffff" strokeWidth={4} />
                        <text
                            y={11}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            FN
                        </text>
                    </motion.g>
                )}

                {/* 1974: kuppet fra Athen, så Tyrkia mot nordkysten */}
                {modus === '1974' && beat >= 1 && beat <= 2 && (
                    <Pil fra={ath} til={[nic[0] - 20, nic[1] - 10]} farge="#1e3a8a" />
                )}
                {modus === '1974' && beat === 3 && (
                    <Pil fra={tfra} til={[kyr[0], kyr[1] - 14]} farge="#c2410c" />
                )}
                {modus === '1974' && (beat === 1 || beat === 2 || beat === 3) && (
                    <circle
                        cx={beat === 3 ? kyr[0] : nic[0]}
                        cy={beat === 3 ? kyr[1] : nic[1]}
                        r={9}
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth={3}
                    />
                )}

                {merker.map((m) => {
                    const [x, y] = skjerm(m.ll);
                    return (
                        <g key={m.tekst} transform={`translate(${x} ${y})`}>
                            {!m.stor && (
                                <circle
                                    r={11}
                                    fill={m.farge ?? '#0f172a'}
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                />
                            )}
                            <Etikett
                                tekst={m.tekst}
                                farge={m.farge ?? '#0f172a'}
                                dy={m.stor ? 14 : (m.dy ?? -22)}
                                str={m.stor ? 46 : 36}
                            />
                        </g>
                    );
                })}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>

            {/* Forklaring til prikkene */}
            {modus === 'folk' && beat >= 1 && beat <= 2 && (
                <div className="absolute bottom-[5%] inset-x-0 flex justify-center gap-6">
                    <Brikke farge={GRESK} tekst="ca. 78 % gresk-kyprioter" />
                    <Brikke farge={TYRKISK} tekst="ca. 18 % tyrkisk-kyprioter" forsinkelse={0.5} />
                </div>
            )}
            {modus === 'flukt' && beat >= 1 && beat <= 3 && (
                <div className="absolute bottom-[5%] inset-x-0 flex justify-center gap-6">
                    <Brikke farge={GRESK} tekst="over 160 000 sørover" />
                    {beat >= 2 && <Brikke farge={TYRKISK} tekst="over 45 000 nordover" />}
                </div>
            )}
            {modus === 'folk' && beat === 4 && (
                <div className="absolute bottom-[5%] inset-x-0 flex justify-center gap-6">
                    <Brikke farge={GRESK} tekst="gresk-kyprioter" />
                    <Brikke farge={TYRKISK} tekst="tyrkisk-kyprioter" forsinkelse={0.4} />
                    <Brikke farge="#0f172a" tekst="i samme regjering" forsinkelse={0.8} />
                </div>
            )}
            {modus === 'flukt' && beat === 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-[5%] left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl font-black text-slate-800 whitespace-nowrap"
                >
                    Bare Tyrkia godtar Nord-Kypros som stat
                </motion.div>
            )}

            {!vid && (
                <Oversiktskart
                    utsnitt={OY}
                    omrade={[
                        [12, 28],
                        [46, 47],
                    ]}
                    plassering="nede-venstre"
                    synlig={modus === 'linje' && beat <= 1}
                />
            )}
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    farge,
    k,
    strek = '#6b7a8f',
}: {
    geographies: unknown[];
    sti: GeoPath;
    farge: string;
    k: number;
    strek?: string;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={farge}
                    stroke={strek}
                    strokeWidth={1.2 / k}
                    style={{ transition: 'fill 1.2s ease' }}
                />
            ))}
        </>
    );
});

function Grense({
    biter,
    sti,
    k,
    bred,
}: {
    biter: LngLat[][];
    sti: GeoPath;
    k: number;
    bred: boolean;
}) {
    return (
        <>
            {biter.map((b, i) => {
                const d = sti({ type: 'LineString', coordinates: b } as never) ?? '';
                return (
                    <g key={i}>
                        <motion.path
                            d={d}
                            fill="none"
                            stroke={LINJE}
                            strokeOpacity={0.35}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ strokeWidth: 0 }}
                            animate={{ strokeWidth: (bred ? 34 : 0) / k }}
                            transition={{ duration: 1.2 }}
                        />
                        <motion.path
                            d={d}
                            fill="none"
                            stroke={LINJE}
                            strokeWidth={7 / k}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2.4, ease: 'easeInOut' }}
                        />
                    </g>
                );
            })}
        </>
    );
}

function Pil({ fra, til, farge }: { fra: [number, number]; til: [number, number]; farge: string }) {
    const vinkel = Math.atan2(til[1] - fra[1], til[0] - fra[0]);
    const spiss = (d: number, v: number): string =>
        `${til[0] - Math.cos(vinkel + v) * d} ${til[1] - Math.sin(vinkel + v) * d}`;
    return (
        <g>
            <motion.line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={farge}
                strokeWidth={9}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
            <motion.path
                d={`M ${spiss(32, 0.5)} L ${til[0]} ${til[1]} L ${spiss(32, -0.5)}`}
                fill="none"
                stroke={farge}
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
            />
        </g>
    );
}

function Brikke({
    farge,
    tekst,
    forsinkelse = 0,
}: {
    farge: string;
    tekst: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
        >
            <span
                className="inline-block rounded-full"
                style={{ width: 22, height: 22, background: farge }}
            />
            <span className="text-2xl font-black text-slate-800 whitespace-nowrap">{tekst}</span>
        </motion.div>
    );
}

function Etikett({
    tekst,
    farge,
    dy = 0,
    str = 30,
}: {
    tekst: string;
    farge: string;
    dy?: number;
    str?: number;
}) {
    return (
        <text
            y={dy}
            textAnchor="middle"
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
