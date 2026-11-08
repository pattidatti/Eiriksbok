import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart til nasjonalromantikk-filmen. «union»: Norge under Danmark, ideene fra København og
 * unionen med Sverige. «aasen»: Ivar Aasen lytter til dialektene på Vestlandet og i
 * fjellbygdene, og bygger landsmålet. «europa»: eventyrene, Grimm i Tyskland, Brudeferden
 * i Düsseldorf og konserten i Christiania.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'union' | 'aasen' | 'europa';

const NORGE = '578';
const DANMARK = '208';
const SVERIGE = '752';
const TYSKLAND = '276';

const KOBENHAVN: LngLat = [12.57, 55.68];
const CHRISTIANIA: LngLat = [10.75, 59.91];
const BERGEN: LngLat = [5.32, 60.39];
const TRONDHEIM: LngLat = [10.39, 63.43];
const DUSSELDORF: LngLat = [6.78, 51.23];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    union: [
        [1, 54],
        [30, 71],
    ],
    aasen: [
        [3.2, 57.8],
        [15.5, 64.6],
    ],
    europa: [
        [0, 49.5],
        [24, 64.5],
    ],
};

/** Steder på Vestlandet og i fjellbygdene der Aasen lyttet. Bare omtrent, til illustrasjon. */
const VESTLANDET: LngLat[] = [
    [5.9, 59.35],
    [6.4, 60.1],
    [5.6, 60.95],
    [6.9, 61.25],
    [6.2, 62.05],
    [7.3, 62.55],
    [6.0, 60.55],
];
const FJELLBYGDENE: LngLat[] = [
    [8.4, 61.65],
    [9.0, 61.0],
    [8.1, 60.6],
    [9.5, 62.25],
    [8.0, 59.75],
];

const OVERSKRIFTER: Record<Modus, string[]> = {
    union: [
        '1814: egen grunnlov',
        'Union med Danmark: 1380 til 1814',
        'Ideene kom fra København',
        'Ny union: med Sverige',
    ],
    aasen: [
        'Ivar Aasen reiser: 1842 til 1846',
        'Han lytter til dialektene',
        'Dialektene blir et skriftspråk',
        'Et språk for folket',
    ],
    europa: [
        'Ord, bilder og toner sammen',
        'Asbjørnsen og Moe',
        'Grimm viste verdien',
        'Brudeferden i Hardanger',
        'Konserten i Christiania',
    ],
};

function fyllFor(modus: Modus, beat: number, id: string) {
    if (modus === 'union') {
        if (id === NORGE) return beat === 1 || beat === 2 ? '#e8b4a8' : '#9cc2e6';
        if (id === DANMARK) return beat === 1 || beat === 2 ? '#e8b4a8' : '#efe9dc';
        if (id === SVERIGE) return beat >= 3 ? '#f2dc8c' : '#e9e4d6';
        return '#ece6d6';
    }
    if (modus === 'aasen') return id === NORGE ? '#f3ead6' : '#e4ded0';
    if (id === NORGE) return beat === 1 || beat === 4 ? '#9cc2e6' : '#f3ead6';
    if (id === TYSKLAND) return beat === 2 || beat === 3 ? '#f2dc8c' : '#ece6d6';
    return '#ece6d6';
}

function Etikett({
    x,
    y,
    tekst,
    farge = '#0f172a',
    storrelse = 34,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

function Pil({
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
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2;
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    // Bøy pila litt til siden.
    const k: [number, number] = [mx - dy * 0.18, my + dx * 0.18];
    const vinkel = Math.atan2(til[1] - k[1], til[0] - k[0]);
    const spiss = (a: number) =>
        `${til[0] - Math.cos(vinkel + a) * 26},${til[1] - Math.sin(vinkel + a) * 26}`;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${k[0]} ${k[1]} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={7}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse }}
            />
            <motion.polygon
                points={`${til[0]},${til[1]} ${spiss(0.45)} ${spiss(-0.45)}`}
                fill={farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
            />
        </g>
    );
}

function Kort({
    x,
    y,
    linjer,
    farge = '#0f172a',
}: {
    x: number;
    y: number;
    linjer: string[];
    farge?: string;
}) {
    const bredde = Math.max(...linjer.map((l) => l.length)) * 34 * 0.56 + 60;
    const hoyde = linjer.length * 46 + 34;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <rect
                x={x}
                y={y}
                width={bredde}
                height={hoyde}
                rx={22}
                fill="#ffffff"
                fillOpacity={0.95}
                stroke={farge}
                strokeWidth={4}
            />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x + 30}
                    y={y + 58 + i * 46}
                    fontSize={34}
                    fontWeight={i === 0 ? 800 : 600}
                    fill={farge}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

export function NasjonalromantikkenKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'union';
    const { geographies } = useFilmVerden([
        [-4, 47],
        [33, 72],
    ]);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    const varighet = playing ? 0.8 : 0;

    return (
        <div className="absolute inset-0 bg-[#bcd4e4] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                {(geographies as GeoFeature[]).map((g, i) => (
                    <motion.path
                        key={i}
                        d={sti(g as never) ?? ''}
                        initial={false}
                        animate={{ fill: fyllFor(modus, beat, String(g.id)) }}
                        transition={{ duration: varighet }}
                        stroke="#a8a08a"
                        strokeWidth={1.5}
                    />
                ))}

                {modus === 'union' && <Union beat={beat} p={p} />}
                {modus === 'aasen' && <Aasen beat={beat} p={p} />}
                {modus === 'europa' && <Europa beat={beat} p={p} />}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] inset-x-0 flex justify-center pointer-events-none"
                >
                    <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

function Prikk({ at, farge, r = 13 }: { at: [number, number]; farge: string; r?: number }) {
    return <circle cx={at[0]} cy={at[1]} r={r} fill={farge} stroke="#fff" strokeWidth={4} />;
}

function Union({ beat, p }: { beat: number; p: P }) {
    const kbh = p(KOBENHAVN);
    const byer: [LngLat, string, number, number, 'start' | 'middle' | 'end'][] = [
        [CHRISTIANIA, 'Christiania', 20, -14, 'start'],
        [BERGEN, 'Bergen', -22, 12, 'end'],
        [TRONDHEIM, 'Trondheim', -22, 12, 'end'],
    ];
    const n = p([9.5, 61.3]);
    const s = p([16.5, 63.5]);
    return (
        <g>
            <Etikett x={n[0]} y={n[1]} tekst="NORGE" farge="#1e3a8a" storrelse={42} />
            {beat === 0 && (
                <Kort
                    x={n[0] + 330}
                    y={n[1] + 120}
                    linjer={['Grunnloven:', 'en egen stat']}
                    farge="#1e3a8a"
                />
            )}
            {beat >= 1 && (
                <Etikett x={kbh[0] + 26} y={kbh[1] + 12} tekst="København" anker="start" />
            )}
            {beat >= 1 && <Prikk at={kbh} farge="#b91c1c" r={15} />}
            {beat === 1 && (
                <Etikett
                    x={kbh[0] - 30}
                    y={kbh[1] + 80}
                    tekst="DANMARK"
                    farge="#991b1b"
                    storrelse={38}
                    anker="end"
                />
            )}
            {beat >= 2 &&
                byer.map(([ll, navn, dx, dy, anker], i) => {
                    const b = p(ll);
                    return (
                        <g key={navn}>
                            <Pil
                                fra={kbh}
                                til={b}
                                farge={beat === 2 ? '#b91c1c' : '#d6a19a'}
                                forsinkelse={beat === 2 ? i * 0.4 : 0}
                            />
                            <Prikk at={b} farge="#0f172a" r={11} />
                            <Etikett
                                x={b[0] + dx}
                                y={b[1] + dy}
                                tekst={navn}
                                anker={anker}
                                storrelse={30}
                            />
                        </g>
                    );
                })}
            {beat === 2 && (
                <Kort
                    x={kbh[0] + 230}
                    y={kbh[1] - 330}
                    linjer={['Dansk språk,', 'danske bøker,', 'nye ideer']}
                    farge="#991b1b"
                />
            )}
            {beat >= 3 && (
                <Etikett x={s[0]} y={s[1]} tekst="SVERIGE" farge="#854d0e" storrelse={42} />
            )}
            {beat >= 3 && (
                <Kort
                    x={s[0] + 150}
                    y={s[1] + 140}
                    linjer={['Men kulturen:', 'sterkt preget av Danmark']}
                    farge="#991b1b"
                />
            )}
        </g>
    );
}

function Aasen({ beat, p }: { beat: number; p: P }) {
    const alle = [...VESTLANDET, ...FJELLBYGDENE];
    const bok: [number, number] = [1180, 520];
    const vest = p([4.6, 61.7]);
    const fjell = p([9.6, 60.35]);
    return (
        <g>
            {beat >= 2 &&
                alle.map((ll, i) => (
                    <motion.line
                        key={`l${i}`}
                        x1={p(ll)[0]}
                        y1={p(ll)[1]}
                        x2={bok[0]}
                        y2={bok[1]}
                        stroke="#0f766e"
                        strokeWidth={3}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.55 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                    />
                ))}
            {alle.map((ll, i) => {
                const [x, y] = p(ll);
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.18 }}
                    >
                        <circle
                            cx={x}
                            cy={y}
                            r={12}
                            fill={i < VESTLANDET.length ? '#0f766e' : '#7c3aed'}
                            stroke="#fff"
                            strokeWidth={4}
                        />
                        {beat === 1 && i % 2 === 0 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.12 }}
                            >
                                <path
                                    d={`M ${x + 10} ${y - 18} q 0 -26 30 -26 h 26 q 30 0 30 26 q 0 26 -30 26 h -34 l -14 12 z`}
                                    fill="#ffffff"
                                    stroke="#0f172a"
                                    strokeWidth={3}
                                />
                                <circle cx={x + 40} cy={y - 18} r={4} fill="#0f172a" />
                                <circle cx={x + 54} cy={y - 18} r={4} fill="#0f172a" />
                                <circle cx={x + 68} cy={y - 18} r={4} fill="#0f172a" />
                            </motion.g>
                        )}
                    </motion.g>
                );
            })}
            <Etikett x={vest[0]} y={vest[1]} tekst="Vestlandet" farge="#0f766e" anker="end" />
            <Etikett x={fjell[0]} y={fjell[1]} tekst="fjellbygdene" farge="#6d28d9" anker="start" />
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                >
                    <rect
                        x={bok[0] - 20}
                        y={bok[1] - 90}
                        width={330}
                        height={180}
                        rx={18}
                        fill="#0f766e"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    <text
                        x={bok[0] + 145}
                        y={bok[1] + 2}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Landsmål
                    </text>
                    {beat >= 3 && (
                        <motion.text
                            x={bok[0] + 145}
                            y={bok[1] + 56}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#ccfbf1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            i dag: nynorsk
                        </motion.text>
                    )}
                </motion.g>
            )}
            {beat >= 3 && (
                <Kort
                    x={1110}
                    y={680}
                    linjer={['Bygd på folkets tale', 'verdighet til bonden']}
                    farge="#0f766e"
                />
            )}
        </g>
    );
}

function Europa({ beat, p }: { beat: number; p: P }) {
    const norge = p([8.6, 61.6]);
    const tysk = p([10.4, 51.3]);
    const dus = p(DUSSELDORF);
    const chr = p(CHRISTIANIA);
    return (
        <g>
            <Etikett x={norge[0]} y={norge[1] - 40} tekst="NORGE" farge="#1e3a8a" storrelse={40} />
            <Etikett
                x={tysk[0] + 40}
                y={tysk[1] + 20}
                tekst="TYSKLAND"
                farge="#854d0e"
                storrelse={40}
            />
            {beat === 0 && (
                <Kort
                    x={1020}
                    y={250}
                    linjer={['Diktere skriver,', 'malere maler,', 'komponister spiller']}
                />
            )}
            {beat === 1 && (
                <Kort
                    x={norge[0] + 260}
                    y={norge[1] + 60}
                    linjer={['Samlet inn og', 'gjenfortalte eventyr', 'og sagn']}
                    farge="#1e3a8a"
                />
            )}
            {beat === 2 && (
                <>
                    <Pil
                        fra={[tysk[0] + 20, tysk[1] - 50]}
                        til={[norge[0] + 20, norge[1] + 60]}
                        farge="#a16207"
                    />
                    <Kort
                        x={tysk[0] + 260}
                        y={tysk[1] - 330}
                        linjer={['Brødrene Grimm:', 'verdt å samle', 'og forske på']}
                        farge="#854d0e"
                    />
                </>
            )}
            {beat === 3 && (
                <>
                    <Prikk at={dus} farge="#a16207" r={16} />
                    <Etikett x={dus[0] - 26} y={dus[1] + 12} tekst="Düsseldorf" anker="end" />
                    <Kort
                        x={dus[0] + 60}
                        y={dus[1] - 300}
                        linjer={['Brudeferden i Hardanger', 'vinteren 1847 til 1848']}
                        farge="#854d0e"
                    />
                </>
            )}
            {beat >= 4 && (
                <>
                    <Prikk at={chr} farge="#1e3a8a" r={16} />
                    <Etikett x={chr[0] + 26} y={chr[1] + 12} tekst="Christiania" anker="start" />
                    <Kort
                        x={chr[0] + 140}
                        y={chr[1] + 50}
                        linjer={['1849: Ole Bull og Myllarguten', 'hardingfele på konsertscenen']}
                        farge="#1e3a8a"
                    />
                </>
            )}
        </g>
    );
}
