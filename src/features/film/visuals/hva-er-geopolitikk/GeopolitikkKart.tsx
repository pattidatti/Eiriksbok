import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Overskrift } from './Brikker';
import { FARGE } from './felles';

/**
 * Kartet til filmen om geopolitikk, i fire moduser.
 *
 * «murmansk»: Nord-Europa og Russland. Havnene som fryser, Golfstrømmen, Murmansk og
 * Nordflåten, og til slutt nærbilde av grensen mot Norge (ca. 200 km).
 * «hormuz»: Persiabukta og Asia. Stredet, Saudi-Arabia, de fire kjøperne (69 %), og
 * linjer som viser at de følger med.
 * «makter»: verdenskartet. Stormaktene i dag, stormakter før, supermakt, den kalde krigen
 * og 1991.
 * «sfaere»: interessesfærer som uskarpe skyer: Latin-Amerika, Øst-Europa, de tidligere
 * sovjetlandene. Til slutt blekner skyene: de står ikke i noen lov.
 */

type Modus = 'murmansk' | 'hormuz' | 'makter' | 'sfaere';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const ID = {
    norge: '578',
    sverige: '752',
    finland: '246',
    russland: '643',
    usa: '840',
    kina: '156',
    india: '356',
    japan: '392',
    korea: '410',
    saudi: '682',
};

/** Dagens land som var en del av Sovjetunionen (omtrentlig, bare til kartet). */
const SOVJET = [
    '643',
    '804',
    '112',
    '233',
    '428',
    '440',
    '498',
    '268',
    '051',
    '031',
    '398',
    '860',
    '795',
    '417',
    '762',
];
const TIDLIGERE_SOVJET = SOVJET.filter((id) => id !== '643');
/** Øst-Europa under Sovjetunionen (omtrentlig, med dagens grenser). */
const OST_EUROPA = ['616', '203', '703', '348', '642', '100'];
/** Latin-Amerika: Mexico og landene sør for det. */
const LATIN = [
    '484',
    '320',
    '084',
    '222',
    '340',
    '558',
    '188',
    '591',
    '192',
    '332',
    '214',
    '170',
    '862',
    '328',
    '740',
    '218',
    '604',
    '076',
    '068',
    '600',
    '858',
    '032',
    '152',
];

function tilpass(
    projeksjon: GeoProjection,
    sv: LngLat,
    no: LngLat,
    ramme = [40, 150, B - 40, H - 30]
) {
    return projeksjon.fitExtent(
        [
            [ramme[0], ramme[1]],
            [ramme[2], ramme[3]],
        ],
        {
            type: 'MultiPoint',
            coordinates: [sv, [no[0], sv[1]], no, [sv[0], no[1]]],
        } as never
    );
}

const UTSNITT_NORD: Utsnitt = [
    [-12, 50],
    [80, 76],
];
const UTSNITT_GRENSE: Utsnitt = [
    [18, 66],
    [42, 72],
];

const Land = memo(function Land({
    geographies,
    sti,
    farge,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    farge: (id: string) => string;
}) {
    return (
        <g>
            {geographies.map((g, i) => (
                <path
                    key={`${g.id ?? 'x'}-${i}`}
                    d={sti(g as never) ?? ''}
                    fill={farge(String(g.id ?? ''))}
                    stroke={FARGE.kant}
                    strokeWidth={0.8}
                    style={{ transition: 'fill 0.8s' }}
                />
            ))}
        </g>
    );
});

/** Tekst med hvit kant, så den leses over både land og hav. */
function Etikett({
    x,
    y,
    tekst,
    farge = FARGE.mork,
    str = 36,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    str?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={800}
            fill={farge}
            style={{
                paintOrder: 'stroke',
                stroke: '#ffffff',
                strokeWidth: 9,
                strokeLinejoin: 'round',
            }}
        >
            {tekst}
        </motion.text>
    );
}

function Pin({
    x,
    y,
    farge = FARGE.mork,
    puls,
}: {
    x: number;
    y: number;
    farge?: string;
    puls?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {puls && (
                <circle r={14} fill="none" stroke={farge} strokeWidth={4}>
                    <animate
                        attributeName="r"
                        from="14"
                        to="44"
                        dur="1.6s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        from="0.9"
                        to="0"
                        dur="1.6s"
                        repeatCount="indefinite"
                    />
                </circle>
            )}
            <circle r={14} fill={farge} stroke="#ffffff" strokeWidth={4} />
        </g>
    );
}

/** Et kort i SVG med bredde målt etter teksten. */
function Kort({
    x,
    y,
    linjer,
    farge = '#ffffff',
    tekstfarge = FARGE.mork,
    str = 32,
}: {
    x: number;
    y: number;
    linjer: string[];
    farge?: string;
    tekstfarge?: string;
    str?: number;
}) {
    const bredde = Math.max(...linjer.map((l) => l.length)) * str * 0.56 + 48;
    const hoyde = linjer.length * str * 1.3 + 30;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <rect x={x} y={y} width={bredde} height={hoyde} rx={20} fill={farge} opacity={0.95} />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={x + 24}
                    y={y + 24 + str + i * str * 1.3 - 6}
                    fontSize={str}
                    fontWeight={i === 0 ? 800 : 600}
                    fill={tekstfarge}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

// ---------- murmansk ----------

const MURMANSK: LngLat = [33.08, 68.97];
const NORDFLATEN: LngLat = [33.42, 69.07];
const GRENSEPUNKT: LngLat = [30.0, 69.65];
const GOLFSTROM: LngLat[] = [
    [-10, 55],
    [-2, 60],
    [6, 64],
    [13, 68.5],
    [20, 71],
    [28, 71.6],
    [33, 70.2],
];
/** Kysten der havnene fryser: Kvitsjøen og videre østover (en grov linje, uskarp). */
const ISKYST: LngLat[] = [
    [36, 66.3],
    [40.5, 64.6],
    [44, 66.2],
    [48, 67.6],
    [54, 68.4],
    [60, 69.2],
    [68, 69.8],
    [74, 71.5],
];

function Murmansk({ beat, geographies }: { beat: number; geographies: GeoFeature[] }) {
    const nær = beat >= 3;
    const projeksjon = useMemo(
        () =>
            nær
                ? tilpass(geoMercator(), UTSNITT_GRENSE[0], UTSNITT_GRENSE[1])
                : tilpass(geoMercator(), [-8, 52], [78, 74]),
        [nær]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const farge = (id: string) =>
        id === ID.russland ? FARGE.rodLys : id === ID.norge ? FARGE.blaLys : FARGE.land;
    const linje = (pts: LngLat[]) =>
        pts.map((pt, i) => `${i ? 'L' : 'M'} ${p(pt).join(' ')}`).join(' ');
    const m = p(MURMANSK);
    const nf = p(NORDFLATEN);
    const g = p(GRENSEPUNKT);
    const ru = p(nær ? [37, 67.4] : [52, 61]);
    const no = p(nær ? [21, 68.6] : [10, 62]);
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={nær ? 'nær' : 'vid'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <Land geographies={geographies} sti={sti} farge={farge} />
                <Etikett x={ru[0]} y={ru[1]} tekst="Russland" farge="#991b1b" str={nær ? 40 : 46} />
                <Etikett x={no[0]} y={no[1]} tekst="Norge" farge="#1e40af" str={40} />
                {!nær && beat >= 0 && (
                    <g>
                        <defs>
                            <filter id="geo-is-blur" x="-20%" y="-50%" width="140%" height="200%">
                                <feGaussianBlur stdDeviation="10" />
                            </filter>
                        </defs>
                        <path
                            d={linje(ISKYST)}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={46}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#geo-is-blur)"
                            opacity={beat === 0 ? 1 : 0.75}
                        />
                        <path
                            d={linje(ISKYST)}
                            fill="none"
                            stroke="#7dd3fc"
                            strokeWidth={6}
                            strokeDasharray="4 14"
                            strokeLinecap="round"
                        />
                        <Etikett
                            x={p([56, 66.2])[0]}
                            y={p([56, 66.2])[1]}
                            tekst="Mange havner fryser om vinteren"
                            str={32}
                            farge="#0369a1"
                        />
                    </g>
                )}
                {!nær && beat >= 1 && (
                    <g>
                        <motion.path
                            d={linje(GOLFSTROM)}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth={12}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                        />
                        <Etikett
                            x={p([1, 69.5])[0]}
                            y={p([1, 69.5])[1]}
                            tekst="Golfstrømmen: varmt vann"
                            farge="#c2410c"
                            str={34}
                        />
                    </g>
                )}
                {!nær && beat >= 1 && (
                    <g>
                        <Pin x={m[0]} y={m[1]} farge="#16a34a" puls={beat === 1} />
                        <Etikett
                            x={m[0] + 26}
                            y={m[1] + 52}
                            tekst={
                                beat >= 2
                                    ? 'Murmansk: største isfrie havn'
                                    : 'Murmansk: åpen hele året'
                            }
                            anker="start"
                            farge="#15803d"
                            str={32}
                        />
                    </g>
                )}
                {!nær && beat === 2 && (
                    <g>
                        <text x={nf[0] + 6} y={nf[1] - 30} fontSize={46} textAnchor="middle">
                            ⚓
                        </text>
                        <Etikett
                            x={nf[0] + 56}
                            y={nf[1] - 36}
                            tekst="Nordflåten"
                            anker="start"
                            str={32}
                        />
                    </g>
                )}
                {nær && (
                    <g>
                        <Pin x={m[0]} y={m[1]} farge="#16a34a" />
                        <Etikett
                            x={m[0] + 30}
                            y={m[1] + 54}
                            tekst="Murmansk"
                            anker="start"
                            farge="#15803d"
                        />
                        <text x={nf[0] + 10} y={nf[1] - 26} fontSize={46} textAnchor="middle">
                            ⚓
                        </text>
                        <Etikett
                            x={nf[0] + 64}
                            y={nf[1] - 34}
                            tekst="Nordflåten"
                            anker="start"
                            str={32}
                        />
                        <motion.path
                            d={`M ${m[0]} ${m[1]} L ${g[0]} ${g[1]}`}
                            stroke={FARGE.rod}
                            strokeWidth={6}
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.4, delay: 0.4 }}
                        />
                        <Pin x={g[0]} y={g[1]} farge={FARGE.rod} puls />
                        <Etikett
                            x={m[0] + 30}
                            y={m[1] + 110}
                            tekst="ca. 200 km til grensen"
                            anker="start"
                            farge="#b91c1c"
                            str={38}
                        />
                    </g>
                )}
            </motion.g>
        </AnimatePresence>
    );
}

// ---------- hormuz ----------

const STREDET: LngLat = [56.4, 26.5];
const SAUDI_PUNKT: LngLat = [45, 24.5];
const KJOPERE: { id: string; navn: string; ll: LngLat; dy: number }[] = [
    { id: ID.kina, navn: 'Kina', ll: [104, 35], dy: 0 },
    { id: ID.india, navn: 'India', ll: [79, 21], dy: 0 },
    { id: ID.japan, navn: 'Japan', ll: [138.5, 36.5], dy: 58 },
    { id: ID.korea, navn: 'Sør-Korea', ll: [127.8, 36.2], dy: -46 },
];

function Hormuz({ beat, geographies }: { beat: number; geographies: GeoFeature[] }) {
    const projeksjon = useMemo(
        () => tilpass(geoMercator(), [28, -6], [146, 48], [40, 150, B - 40, H - 20]),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const kjopere = KJOPERE.map((k) => k.id);
    const farge = (id: string) => {
        if (beat >= 1 && id === ID.saudi) return '#fdba74';
        if (beat >= 2 && kjopere.includes(id)) return FARGE.blaLys;
        return FARGE.land;
    };
    const s = p(STREDET);
    const sa = p(SAUDI_PUNKT);
    return (
        <g>
            <Land geographies={geographies} sti={sti} farge={farge} />
            {beat >= 1 && (
                <g>
                    <motion.path
                        d={`M ${sa[0]} ${sa[1]} Q ${(sa[0] + s[0]) / 2} ${sa[1] - 70} ${s[0]} ${s[1]}`}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth={10}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4 }}
                    />
                    <Etikett x={sa[0] - 10} y={sa[1] + 70} tekst="Saudi-Arabia" farge="#c2410c" />
                    {beat === 1 && (
                        <Etikett
                            x={sa[0] - 10}
                            y={sa[1] + 112}
                            tekst="sender mest olje gjennom stredet"
                            str={30}
                        />
                    )}
                </g>
            )}
            {beat >= 3 &&
                KJOPERE.map((k, i) => {
                    const q = p(k.ll);
                    return (
                        <motion.path
                            key={k.id}
                            d={`M ${q[0]} ${q[1]} L ${s[0]} ${s[1]}`}
                            stroke="#1d4ed8"
                            strokeWidth={4}
                            strokeDasharray="10 12"
                            fill="none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            transition={{ delay: 0.3 + i * 0.25 }}
                        />
                    );
                })}
            <Pin x={s[0]} y={s[1]} farge={FARGE.rod} puls={beat === 0 || beat === 3} />
            <Etikett
                x={s[0] + 26}
                y={s[1] - 34}
                tekst="Hormuzstredet"
                farge="#b91c1c"
                anker="start"
            />
            {beat >= 2 &&
                KJOPERE.map((k) => {
                    const q = p(k.ll);
                    return (
                        <g key={k.navn}>
                            {beat >= 3 && (
                                <text
                                    x={q[0]}
                                    y={q[1] + k.dy - 44}
                                    fontSize={40}
                                    textAnchor="middle"
                                >
                                    👁
                                </text>
                            )}
                            <Etikett
                                x={q[0]}
                                y={q[1] + k.dy}
                                tekst={k.navn}
                                farge="#1e3a8a"
                                str={34}
                            />
                        </g>
                    );
                })}
            {beat >= 2 && <Ring x={250} y={720} />}
            {beat >= 3 && (
                <Kort x={B - 560} y={H - 150} linjer={['De følger nøye med på stredet']} str={34} />
            )}
        </g>
    );
}

function Ring({ x, y }: { x: number; y: number }) {
    const r = 92;
    const omkrets = 2 * Math.PI * r;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect
                x={x - 200}
                y={y - 135}
                width={400}
                height={290}
                rx={24}
                fill="#ffffff"
                opacity={0.95}
            />
            <circle cx={x - 82} cy={y + 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={34} />
            <motion.circle
                cx={x - 82}
                cy={y + 2}
                r={r}
                fill="none"
                stroke="#2563eb"
                strokeWidth={34}
                strokeDasharray={`${omkrets} ${omkrets}`}
                transform={`rotate(-90 ${x - 82} ${y + 2})`}
                initial={{ strokeDashoffset: omkrets }}
                animate={{ strokeDashoffset: omkrets * (1 - 0.69) }}
                transition={{ duration: 1.6, delay: 0.3 }}
            />
            <text
                x={x - 82}
                y={y + 16}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={FARGE.mork}
            >
                69 %
            </text>
            <text x={x + 30} y={y - 30} fontSize={28} fontWeight={700} fill={FARGE.mork}>
                kjøpt av
            </text>
            <text x={x + 30} y={y + 6} fontSize={28} fontWeight={700} fill={FARGE.mork}>
                de fire
            </text>
            <text x={x + 30} y={y + 42} fontSize={28} fontWeight={700} fill={FARGE.mork}>
                landene
            </text>
            <text x={x + 30} y={y + 78} fontSize={24} fontWeight={600} fill="#475569">
                (2024)
            </text>
        </motion.g>
    );
}

// ---------- makter ----------

const FOR: { navn: string; ll: LngLat }[] = [
    { navn: 'Romerriket', ll: [12.5, 41.9] },
    { navn: 'Det osmanske riket', ll: [29, 41] },
    { navn: 'Storbritannia (1800-tallet)', ll: [-1.5, 52.5] },
];

function verden() {
    return tilpass(geoNaturalEarth1(), [-165, -50], [178, 76], [30, 140, B - 30, H - 10]);
}

function Makter({ beat, geographies }: { beat: number; geographies: GeoFeature[] }) {
    const projeksjon = useMemo(() => verden(), []);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const stor = [ID.usa, ID.kina, ID.russland];
    const farge = (id: string) => {
        if (beat === 1) return stor.includes(id) ? FARGE.rodLys : FARGE.land;
        if (beat === 3) return stor.includes(id) ? '#fee2e2' : FARGE.land;
        if (beat === 4)
            return id === ID.usa ? '#60a5fa' : SOVJET.includes(id) ? '#f87171' : FARGE.land;
        if (beat >= 5) {
            if (id === ID.usa) return '#2563eb';
            if (SOVJET.includes(id))
                return ['#fecaca', '#fed7aa', '#fde68a', '#e9d5ff'][SOVJET.indexOf(id) % 4];
        }
        return FARGE.land;
    };
    const usa = p([-100, 40]);
    const kina = p([103, 34]);
    const ru = p([95, 62]);
    return (
        <g>
            <Land geographies={geographies} sti={sti} farge={farge} />
            {beat === 0 && (
                <Kort
                    x={70}
                    y={H - 210}
                    linjer={[
                        'Stormakt:',
                        'så mye makt at landet spiller',
                        'en stor rolle i verden',
                    ]}
                    str={32}
                />
            )}
            {beat === 1 && (
                <g>
                    <Etikett x={usa[0]} y={usa[1]} tekst="USA" farge="#991b1b" str={44} />
                    <Etikett x={kina[0]} y={kina[1] + 20} tekst="Kina" farge="#991b1b" str={44} />
                    <Etikett x={ru[0]} y={ru[1]} tekst="Russland" farge="#991b1b" str={44} />
                    <Kort x={70} y={H - 160} linjer={['USA, Kina og Russland']} str={32} />
                </g>
            )}
            {beat === 2 && (
                <g>
                    {FOR.map((f, i) => {
                        const q = p(f.ll);
                        return (
                            <g key={f.navn}>
                                <circle
                                    cx={q[0]}
                                    cy={q[1]}
                                    r={24}
                                    fill="#7c3aed"
                                    stroke="#ffffff"
                                    strokeWidth={5}
                                />
                                <text
                                    x={q[0]}
                                    y={q[1] + 11}
                                    textAnchor="middle"
                                    fontSize={30}
                                    fontWeight={900}
                                    fill="#ffffff"
                                >
                                    {i + 1}
                                </text>
                            </g>
                        );
                    })}
                    <Kort
                        x={70}
                        y={H - 290}
                        linjer={[
                            'Stormakter før i tiden:',
                            '1  Romerriket',
                            '2  Det osmanske riket',
                            '3  Storbritannia (1800-tallet)',
                        ]}
                        str={30}
                    />
                </g>
            )}
            {beat === 3 && (
                <Kort
                    x={70}
                    y={H - 250}
                    linjer={[
                        'Supermakt: enda større',
                        'En stormakt med så mange',
                        'atomvåpen at den kan dominere',
                        'hele verdenspolitikken',
                    ]}
                    farge="#0f172a"
                    tekstfarge="#ffffff"
                    str={32}
                />
            )}
            {beat >= 4 && (
                <g>
                    <Etikett x={usa[0]} y={usa[1]} tekst="USA" farge="#1e3a8a" str={46} />
                    <Etikett
                        x={ru[0]}
                        y={ru[1]}
                        tekst={beat === 4 ? 'Sovjetunionen' : 'Sovjetunionen går i oppløsning'}
                        farge="#991b1b"
                        str={beat === 4 ? 46 : 38}
                    />
                    <Kort
                        x={70}
                        y={H - 200}
                        linjer={
                            beat === 4
                                ? ['Den kalde krigen, 1945 til 1991:', 'to supermakter']
                                : ['1991: USA en kort tid', 'den eneste supermakten']
                        }
                        str={32}
                    />
                    <text
                        x={B - 40}
                        y={H - 24}
                        textAnchor="end"
                        fontSize={24}
                        fontWeight={600}
                        fill="#475569"
                    >
                        Dagens grenser, omtrentlig
                    </text>
                </g>
            )}
        </g>
    );
}

// ---------- sfære ----------

function Sky({
    geographies,
    sti,
    ider,
    farge,
    opacity,
    id,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    ider: string[];
    farge: string;
    opacity: number;
    id: string;
}) {
    const land = geographies.filter((g) => ider.includes(String(g.id ?? '')));
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity }} transition={{ duration: 1.2 }}>
            <defs>
                <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="16" />
                </filter>
            </defs>
            <g filter={`url(#${id})`}>
                {land.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge}
                        stroke={farge}
                        strokeWidth={24}
                    />
                ))}
            </g>
        </motion.g>
    );
}

function Sfaere({ beat, geographies }: { beat: number; geographies: GeoFeature[] }) {
    const projeksjon = useMemo(() => verden(), []);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const farge = (id: string) => {
        if (id === ID.usa && beat !== 3) return '#3b82f6';
        if (beat >= 3 && id === ID.russland) return '#fecaca';
        return FARGE.land;
    };
    const svak = beat >= 4 ? 0.35 : 1;
    const usa = p([-100, 40]);
    const latin = p([-62, -12]);
    const ost = p([22, 49]);
    const tidl = p([66, 46]);
    return (
        <g>
            <Land geographies={geographies} sti={sti} farge={farge} />
            {beat <= 1 && (
                <motion.circle
                    cx={usa[0]}
                    cy={usa[1] + 30}
                    r={230}
                    fill="#60a5fa"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.25 }}
                    transition={{ duration: 1 }}
                    style={{ filter: 'blur(18px)' }}
                />
            )}
            {beat === 1 && (
                <circle
                    cx={usa[0]}
                    cy={usa[1] + 30}
                    r={235}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={6}
                    strokeDasharray="18 14"
                />
            )}
            {beat <= 1 && (
                <Etikett
                    x={usa[0]}
                    y={usa[1] + 10}
                    tekst="Et stort land"
                    farge="#1e3a8a"
                    str={40}
                />
            )}
            {(beat === 2 || beat >= 4) && (
                <Sky
                    geographies={geographies}
                    sti={sti}
                    ider={LATIN}
                    farge="#2563eb"
                    opacity={svak}
                    id="geo-sky-latin"
                />
            )}
            {beat >= 3 && (
                <>
                    <Sky
                        geographies={geographies}
                        sti={sti}
                        ider={OST_EUROPA}
                        farge="#dc2626"
                        opacity={svak}
                        id="geo-sky-ost"
                    />
                    <Sky
                        geographies={geographies}
                        sti={sti}
                        ider={TIDLIGERE_SOVJET}
                        farge="#f97316"
                        opacity={beat === 3 ? 1 : svak * 0.7}
                        id="geo-sky-tidl"
                    />
                </>
            )}
            {beat === 2 && (
                <g>
                    <Etikett x={usa[0]} y={usa[1]} tekst="USA" farge="#1e3a8a" str={44} />
                    <Etikett
                        x={latin[0]}
                        y={latin[1]}
                        tekst="Latin-Amerika"
                        farge="#1e3a8a"
                        str={40}
                    />
                    <Kort x={70} y={H - 160} linjer={['USA på 1800- og 1900-tallet']} str={32} />
                </g>
            )}
            {beat === 3 && (
                <g>
                    <Etikett
                        x={ost[0] - 70}
                        y={ost[1] + 12}
                        tekst="Øst-Europa: Sovjetunionen"
                        farge="#991b1b"
                        str={34}
                        anker="end"
                    />
                    <Etikett
                        x={tidl[0]}
                        y={tidl[1] + 90}
                        tekst="Tidligere sovjetland: Russland etter 1991"
                        farge="#9a3412"
                        str={34}
                    />
                    <text
                        x={B - 40}
                        y={H - 24}
                        textAnchor="end"
                        fontSize={24}
                        fontWeight={600}
                        fill="#475569"
                    >
                        Dagens grenser, omtrentlig
                    </text>
                </g>
            )}
            {beat <= 1 && (
                <Kort
                    x={70}
                    y={H - 200}
                    linjer={
                        beat === 0
                            ? ['Interessesfære:', 'området rundt et stort land']
                            : [
                                  'Styrer ikke området selv,',
                                  'men mener den har rett til å bestemme mer',
                              ]
                    }
                    str={32}
                />
            )}
            {beat >= 4 && (
                <Kort
                    x={70}
                    y={H - 200}
                    linjer={['Står ikke i noen lov.', 'Finnes bare så lenge andre land godtar den']}
                    farge="#0f172a"
                    tekstfarge="#ffffff"
                    str={32}
                />
            )}
        </g>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    murmansk: [
        'Russland: mange havner fryser',
        'Murmansk: et unntak',
        'Russlands største isfrie havn',
        'Nesten i bakgården vår',
    ],
    hormuz: [
        'Tilbake til Hormuzstredet',
        'Saudi-Arabia',
        'Kina, India, Japan og Sør-Korea',
        'Langt unna, men følger med',
    ],
    makter: [
        'Store og små makter',
        'Stormakter tidlig på 2000-tallet',
        'Stormakter før',
        'Supermakt',
        'Den kalde krigen',
        '1991',
    ],
    sfaere: [
        'Interessesfære',
        'Mer å si, uten å styre',
        'USA og Latin-Amerika',
        'Sovjetunionen og Russland',
        'Bare så lenge andre godtar den',
    ],
};

export function GeopolitikkKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = (['murmansk', 'hormuz', 'makter', 'sfaere'] as const).includes(
        props?.modus as Modus
    )
        ? (props?.modus as Modus)
        : 'makter';
    const utsnitt = modus === 'murmansk' ? (beat >= 3 ? UTSNITT_GRENSE : UTSNITT_NORD) : undefined;
    const { geographies } = useFilmVerden(utsnitt);
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'murmansk' && <Murmansk beat={beat} geographies={geographies} />}
                {modus === 'hormuz' && <Hormuz beat={beat} geographies={geographies} />}
                {modus === 'makter' && <Makter beat={beat} geographies={geographies} />}
                {modus === 'sfaere' && <Sfaere beat={beat} geographies={geographies} />}
            </svg>
            <AnimatePresence mode="wait">
                <Overskrift
                    key={`${modus}-${beat}`}
                    tekst={liste[Math.min(beat, liste.length - 1)]}
                />
            </AnimatePresence>
        </div>
    );
}
