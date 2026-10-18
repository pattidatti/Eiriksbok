import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartet over oljen, i seks modus:
 * «funn»: oljefunnene i Persia (1908), Irak (1927) og Saudi-Arabia (1938).
 * «opec»: fem land møtes i Bagdad i 1960 og starter OPEC.
 * «egen»: landene tar oljen tilbake (Libya, Irak, Saudi-Arabia).
 * «krig»: oktober 1973, Vesten støtter Israel, og oljelandene bruker oljen som pressmiddel.
 * «nordsjoen»: Ekofisk, produksjonen og den nye skatten.
 * «kontrast»: rikdommen i Gulf-statene, Dubai, og Qatar mot Jemen.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'funn' | 'opec' | 'egen' | 'krig' | 'nordsjoen' | 'kontrast';

const IRAN = 364;
const IRAK = 368;
const KUWAIT = 414;
const SAUDI = 682;
const VENEZUELA = 862;
const LIBYA = 434;
const EGYPT = 818;
const SYRIA = 760;
const ISRAEL = 376;
const NORGE = 578;
const EMIRATENE = 784;
const QATAR = 634;
const JEMEN = 887;

const STED = {
    masjed: [49.3, 32.0] as LngLat,
    bagdad: [44.4, 33.3] as LngLat,
    ekofisk: [3.2, 56.5] as LngLat,
    oslo: [10.75, 59.9] as LngLat,
    dubai: [55.3, 25.2] as LngLat,
    qatar: [51.2, 25.3] as LngLat,
    jemen: [47.5, 15.6] as LngLat,
};

const FARGE = {
    hav: '#9cc3e0',
    land: '#efe6d2',
    kant: '#a8a29e',
    olje: '#c2410c',
    oljeLys: '#fdba74',
    utenlandsk: '#64748b',
    egen: '#15803d',
    angrep: '#dc2626',
    vesten: '#2563eb',
    gull: '#eab308',
    fattig: '#7f1d1d',
    norge: '#be123c',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat) =>
        geoMercator().fitExtent(
            [
                [80, 130],
                [B - 80, H - 50],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    switch (modus) {
        case 'funn':
            return utsnitt([30, 18], [62, 40]);
        case 'opec':
            return utsnitt([-78, -4], [64, 42]);
        case 'egen':
            return utsnitt([8, 15], [58, 38]);
        case 'krig':
            return utsnitt([22, 14], [58, 40]);
        case 'nordsjoen':
            return utsnitt([-9, 51], [17, 63]);
        default:
            return utsnitt([33, 11], [60, 32]);
    }
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'funn': {
            if (id === IRAN) return FARGE.olje;
            if (id === IRAK && beat >= 2) return FARGE.olje;
            if (id === SAUDI && beat >= 3) return FARGE.olje;
            if (beat >= 4 && id === KUWAIT) return FARGE.oljeLys;
            return FARGE.land;
        }
        case 'opec': {
            const lander = [IRAN, IRAK, KUWAIT, SAUDI, VENEZUELA];
            if (beat >= 1 && lander.includes(id)) return FARGE.olje;
            if (beat === 0 && id === IRAK) return FARGE.oljeLys;
            return FARGE.land;
        }
        case 'egen': {
            if (id === LIBYA) return beat >= 1 ? FARGE.egen : FARGE.utenlandsk;
            if (id === IRAK) return beat >= 2 ? FARGE.egen : FARGE.utenlandsk;
            if (id === SAUDI) return beat >= 3 ? FARGE.egen : FARGE.utenlandsk;
            if (id === KUWAIT || id === IRAN) return FARGE.utenlandsk;
            return FARGE.land;
        }
        case 'krig': {
            if (id === EGYPT || id === SYRIA) return FARGE.angrep;
            if (id === ISRAEL) return beat >= 1 ? FARGE.vesten : '#fca5a5';
            if (beat >= 2 && [SAUDI, KUWAIT, IRAK, LIBYA].includes(id)) return FARGE.olje;
            return FARGE.land;
        }
        case 'nordsjoen':
            return id === NORGE ? FARGE.norge : FARGE.land;
        default: {
            if (beat >= 4 && id === JEMEN) return FARGE.fattig;
            if (beat >= 3 && id === QATAR) return FARGE.gull;
            if ([SAUDI, KUWAIT, EMIRATENE].includes(id)) return beat >= 3 ? '#fde68a' : FARGE.gull;
            return FARGE.land;
        }
    }
}

const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
    }) {
        return (
            <>
                {geographies.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge(Number(g.id))}
                        stroke={FARGE.kant}
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                ))}
            </>
        );
    },
    (a, b) => a.nokkel === b.nokkel && a.geographies === b.geographies && a.sti === b.sti
);

function Etikett({
    pos,
    tekst,
    stor,
    farge = '#0f172a',
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    stor?: boolean;
    farge?: string;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={pos[0]}
            y={pos[1]}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 54 : 36}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={stor ? 10 : 8}
            paintOrder="stroke"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: forsinkelse }}
            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
        >
            {tekst}
        </motion.text>
    );
}

/** En oljedråpe som nål på kartet, med ringer som pulserer ut. */
function Drape({ pos, forsinkelse = 0, farge = FARGE.olje }: { pos: [number, number]; forsinkelse?: number; farge?: string }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <motion.circle
                cx={pos[0]}
                cy={pos[1]}
                r={20}
                fill="none"
                stroke={farge}
                strokeWidth={5}
                animate={{ r: [20, 70], opacity: [0.8, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: forsinkelse }}
            />
            <path
                d={`M ${pos[0]} ${pos[1] - 40} C ${pos[0] + 24} ${pos[1] - 10}, ${pos[0] + 22} ${pos[1] + 18}, ${pos[0]} ${pos[1] + 18} C ${pos[0] - 22} ${pos[1] + 18}, ${pos[0] - 24} ${pos[1] - 10}, ${pos[0]} ${pos[1] - 40} Z`}
                fill="#1c1917"
                stroke="#ffffff"
                strokeWidth={4}
            />
        </motion.g>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.3, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -24 -15 L 6 0 L -24 15 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.2 }}
            />
        </g>
    );
}

/** Kort med tekst i DOM, øverst i bildet. */
function Kort({ tekst, tone = 'lys' }: { tekst: string; tone?: 'lys' | 'rod' | 'gronn' | 'gull' }) {
    const klasse = {
        lys: 'bg-white/95 text-slate-900',
        rod: 'bg-red-600/95 text-white',
        gronn: 'bg-green-700/95 text-white',
        gull: 'bg-amber-400/95 text-slate-900',
    }[tone];
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute top-[10%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl font-display font-bold text-3xl shadow-xl whitespace-nowrap ${klasse}`}
        >
            {tekst}
        </motion.div>
    );
}

const KORT: Record<Modus, ({ tekst: string; tone?: 'lys' | 'rod' | 'gronn' | 'gull' } | null)[]> = {
    funn: [
        { tekst: '1908: olje i Persia' },
        { tekst: 'Persia = dagens Iran' },
        { tekst: '1927: olje i Irak' },
        { tekst: '1938: olje i Saudi-Arabia' },
        { tekst: 'Noen av verdens rikeste oljeområder', tone: 'gull' },
    ],
    opec: [
        { tekst: 'Bagdad, 16. september 1960' },
        { tekst: 'Fem land som selger olje' },
        { tekst: 'OPEC: Organisasjonen av oljeeksporterende land', tone: 'gull' },
        { tekst: 'Mål: stabile priser og jevne inntekter' },
    ],
    egen: [
        { tekst: 'Utenlandske selskaper eier oljen' },
        { tekst: 'Libya tar over oljen', tone: 'gronn' },
        { tekst: '1972: Irak tar over IPC', tone: 'gronn' },
        { tekst: 'Saudi-Arabia kjøper Aramco', tone: 'gronn' },
        { tekst: 'Oljen tilhører landet den kommer fra', tone: 'gronn' },
    ],
    krig: [
        { tekst: '6. oktober 1973: Yom Kippur-krigen', tone: 'rod' },
        { tekst: 'USA og vestlige land støtter Israel' },
        { tekst: 'Svaret: olje som pressmiddel', tone: 'rod' },
        null,
    ],
    nordsjoen: [
        { tekst: 'Vesten leter etter olje hjemme' },
        { tekst: 'Ekofisk: drivverdig lille julaften 1969' },
        { tekst: '1971: produksjonen starter' },
        { tekst: '1975: mye høyere skatt på oljen', tone: 'gull' },
    ],
    kontrast: [
        { tekst: 'Gulf-statene: enorm rikdom', tone: 'gull' },
        { tekst: 'Skoler · sykehus · jobber i staten' },
        { tekst: 'Dubai: fra liten kystby til skyskrapere' },
        { tekst: 'Qatar: blant verdens rikeste', tone: 'gull' },
        { tekst: 'Jemen: blant de fattigste', tone: 'rod' },
        { tekst: 'Hvem har oljen?' },
    ],
};

export function OljeKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'funn';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const kortListe = KORT[modus];
    const kort = kortListe[Math.min(beat, kortListe.length - 1)];
    const midt = (id: number): [number, number] => {
        const g = geographies.find((x) => Number(x.id) === id);
        return g ? (sti.centroid(g as never) as [number, number]) : [B / 2, H / 2];
    };

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />
                {geographies.length > 0 && (
                    <Innhold modus={modus} beat={beat} p={p} midt={midt} />
                )}
            </svg>
            <AnimatePresence mode="wait">
                {kort && <Kort key={`${modus}-${beat}`} tekst={kort.tekst} tone={kort.tone} />}
            </AnimatePresence>
            {modus === 'krig' && beat >= 3 && <Kutt />}
        </div>
    );
}

function Innhold({
    modus,
    beat,
    p,
    midt,
}: {
    modus: Modus;
    beat: number;
    p: (ll: LngLat) => [number, number];
    midt: (id: number) => [number, number];
}) {
    const flytt = (a: [number, number], dx: number, dy: number): [number, number] => [a[0] + dx, a[1] + dy];
    if (modus === 'funn') {
        return (
            <>
                <Drape pos={p(STED.masjed)} />
                <Etikett pos={flytt(p(STED.masjed), 0, 60)} tekst="1908" />
                {beat >= 1 && <Etikett pos={flytt(midt(IRAN), 40, -60)} tekst="PERSIA = IRAN" stor farge="#7c2d12" />}
                {beat >= 2 && (
                    <>
                        <Drape pos={flytt(midt(IRAK), 0, -20)} />
                        <Etikett pos={flytt(midt(IRAK), 0, 40)} tekst="Irak 1927" />
                    </>
                )}
                {beat >= 3 && (
                    <>
                        <Drape pos={flytt(midt(SAUDI), 60, -40)} />
                        <Etikett pos={flytt(midt(SAUDI), 60, 20)} tekst="Saudi-Arabia 1938" />
                    </>
                )}
            </>
        );
    }
    if (modus === 'opec') {
        const bagdad = p(STED.bagdad);
        const lander: [number, string][] = [
            [IRAN, 'Iran'],
            [IRAK, 'Irak'],
            [KUWAIT, 'Kuwait'],
            [SAUDI, 'Saudi-Arabia'],
            [VENEZUELA, 'Venezuela'],
        ];
        return (
            <>
                <circle cx={bagdad[0]} cy={bagdad[1]} r={12} fill="#0f172a" stroke="#fff" strokeWidth={4} />
                {beat === 0 && <Etikett pos={flytt(bagdad, 0, -40)} tekst="Bagdad" />}
                {beat >= 1 &&
                    lander.map(([id, navn], i) => {
                        const m = id === KUWAIT ? flytt(midt(id), 30, 30) : id === IRAK ? flytt(midt(id), -40, -30) : midt(id);
                        return (
                            <g key={id}>
                                {beat >= 2 && id !== IRAK && (
                                    <Pil fra={bagdad} til={m} farge="#7c2d12" bue={id === VENEZUELA ? 0.25 : 0.1} forsinkelse={i * 0.2} />
                                )}
                                <Etikett pos={flytt(m, 0, id === VENEZUELA ? 0 : 50)} tekst={navn} forsinkelse={beat === 1 ? i * 0.5 : 0} />
                            </g>
                        );
                    })}
                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect x={560} y={560} width={420} height={150} rx={24} fill="#ffffff" opacity={0.92} />
                        <text x={770} y={620} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                            Priser: stabile
                        </text>
                        <text x={770} y={672} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                            Inntekter: jevne
                        </text>
                    </motion.g>
                )}
            </>
        );
    }
    if (modus === 'egen') {
        const saudi = flytt(midt(SAUDI), 40, -10);
        return (
            <>
                {beat === 0 && (
                    <>
                        <Etikett pos={midt(LIBYA)} tekst="Libya" />
                        <Etikett pos={flytt(midt(IRAK), 0, 20)} tekst="Irak" />
                        <Etikett pos={saudi} tekst="Saudi-Arabia" />
                    </>
                )}
                {beat >= 1 && <Etikett pos={midt(LIBYA)} tekst="Libya 1969" farge={FARGE.egen} />}
                {beat >= 2 && <Etikett pos={flytt(midt(IRAK), 0, 20)} tekst="Irak 1972" farge={FARGE.egen} />}
                {beat >= 1 && beat < 3 && <Etikett pos={saudi} tekst="Saudi-Arabia" />}
                {beat >= 3 && <AramcoStolpe pos={saudi} hopp={beat === 3} />}
            </>
        );
    }
    if (modus === 'krig') {
        const israel = p([35, 31.5]);
        return (
            <>
                <Pil fra={flytt(midt(EGYPT), 40, -40)} til={flytt(israel, -22, 28)} farge="#7f1d1d" bue={-0.15} />
                <Pil fra={flytt(midt(SYRIA), 10, 0)} til={flytt(israel, 16, -26)} farge="#7f1d1d" bue={0.15} forsinkelse={0.4} />
                <Etikett pos={flytt(midt(EGYPT), 0, 40)} tekst="Egypt" />
                <Etikett pos={flytt(midt(SYRIA), 30, -36)} tekst="Syria" />
                <Etikett pos={flytt(israel, -120, -40)} tekst="Israel" farge={beat >= 1 ? FARGE.vesten : '#0f172a'} />
                {beat >= 1 && <Pil fra={[40, 230]} til={flytt(israel, -26, -8)} farge={FARGE.vesten} bue={0.12} />}
                {beat >= 1 && <Etikett pos={[180, 190]} tekst="← fra USA" farge={FARGE.vesten} />}
                {beat >= 2 && (
                    <>
                        <Drape pos={flytt(midt(SAUDI), 40, -30)} />
                        <Drape pos={flytt(midt(IRAK), 0, -10)} forsinkelse={0.3} />
                        <Drape pos={flytt(midt(KUWAIT), 10, 0)} forsinkelse={0.6} />
                        <Etikett pos={flytt(midt(SAUDI), 40, 40)} tekst="Oljelandene" farge="#7c2d12" />
                    </>
                )}
            </>
        );
    }
    if (modus === 'nordsjoen') {
        const ek = p(STED.ekofisk);
        return (
            <>
                <Etikett pos={flytt(p([9, 61]), 0, 0)} tekst="Norge" farge="#881337" />
                <Etikett pos={p([1.5, 57.4])} tekst="Nordsjøen" farge="#1e3a8a" />
                {beat === 0 &&
                    [p([2, 55]), p([4, 58.5]), p([-1, 59])].map((pos, i) => (
                        <motion.circle
                            key={i}
                            cx={pos[0]}
                            cy={pos[1]}
                            r={20}
                            fill="none"
                            stroke="#1e3a8a"
                            strokeWidth={6}
                            animate={{ r: [10, 90], opacity: [0.9, 0] }}
                            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.6 }}
                        />
                    ))}
                {beat >= 1 && <Plattform pos={ek} />}
                {beat >= 1 && <Etikett pos={flytt(ek, 0, 90)} tekst="Ekofisk" />}
                {beat >= 2 && <Drape pos={flytt(ek, 0, -30)} />}
                {beat >= 3 && (
                    <>
                        <Pil fra={flytt(ek, 40, -20)} til={flytt(p(STED.oslo), -10, 20)} farge="#a16207" bue={-0.2} />
                        <Etikett pos={flytt(p(STED.oslo), 40, 70)} tekst="til staten" farge="#a16207" />
                    </>
                )}
            </>
        );
    }
    // kontrast
    const dubai = p(STED.dubai);
    return (
        <>
            {beat < 3 && <Etikett pos={flytt(midt(SAUDI), 0, 0)} tekst="Saudi-Arabia" />}
            {beat < 3 && <Etikett pos={flytt(p([47.8, 29.4]), -40, -20)} tekst="Kuwait" />}
            {beat < 3 && <Etikett pos={flytt(p([54.5, 23.6]), 50, 50)} tekst="Emiratene" />}
            {beat === 1 && (
                <>
                    <Ikonkort pos={flytt(midt(SAUDI), -220, -120)} tekst="Skoler" forsinkelse={0} />
                    <Ikonkort pos={flytt(midt(SAUDI), 0, -150)} tekst="Sykehus" forsinkelse={0.6} />
                    <Ikonkort pos={flytt(midt(SAUDI), 220, -120)} tekst="Jobber" forsinkelse={1.2} />
                </>
            )}
            {beat === 2 && <Skyskrapere pos={dubai} />}
            {beat >= 3 && (
                <>
                    <Etikett pos={flytt(p(STED.qatar), -60, -70)} tekst="Qatar" stor farge="#a16207" />
                    <motion.circle
                        cx={p(STED.qatar)[0]}
                        cy={p(STED.qatar)[1]}
                        r={34}
                        fill="none"
                        stroke="#a16207"
                        strokeWidth={6}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                </>
            )}
            {beat >= 4 && <Etikett pos={flytt(p(STED.jemen), 0, 110)} tekst="Jemen" stor farge="#7f1d1d" />}
            {beat >= 5 && (
                <>
                    <Drape pos={flytt(midt(SAUDI), -40, -20)} />
                    <Drape pos={flytt(p(STED.qatar), 0, -50)} forsinkelse={0.3} />
                    <Drape pos={p([47.8, 29.6])} forsinkelse={0.6} />
                    <Drape pos={p([54.3, 23.8])} forsinkelse={0.9} />
                </>
            )}
        </>
    );
}

function Ikonkort({ pos, tekst, forsinkelse }: { pos: [number, number]; tekst: string; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
        >
            <rect x={pos[0] - 100} y={pos[1] - 36} width={200} height={72} rx={18} fill="#ffffff" stroke="#a16207" strokeWidth={4} />
            <text x={pos[0]} y={pos[1] + 12} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                {tekst}
            </text>
        </motion.g>
    );
}

/** Dubai: tårn som vokser opp av kysten. */
function Skyskrapere({ pos }: { pos: [number, number] }) {
    const tarn = [60, 110, 80, 170, 130, 95, 150, 70];
    return (
        <g>
            {tarn.map((h, i) => (
                <motion.rect
                    key={i}
                    x={pos[0] - 120 + i * 30}
                    width={24}
                    fill={i === 3 ? '#0f172a' : '#334155'}
                    stroke="#ffffff"
                    strokeWidth={2}
                    initial={{ y: pos[1], height: 0 }}
                    animate={{ y: pos[1] - h * 1.4, height: h * 1.4 }}
                    transition={{ delay: 0.3 + i * 0.35, duration: 1.2, ease: 'easeOut' }}
                />
            ))}
            <Etikett pos={[pos[0], pos[1] + 50]} tekst="Dubai" />
        </g>
    );
}

/** Oljeplattform i miniatyr. */
function Plattform({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <line x1={x - 30} y1={y + 50} x2={x - 20} y2={y} stroke="#334155" strokeWidth={8} />
            <line x1={x + 30} y1={y + 50} x2={x + 20} y2={y} stroke="#334155" strokeWidth={8} />
            <rect x={x - 45} y={y - 12} width={90} height={18} fill="#f59e0b" stroke="#fff" strokeWidth={3} />
            <rect x={x + 10} y={y - 60} width={10} height={50} fill="#334155" />
        </motion.g>
    );
}

/** Saudi-Arabias eierandel i Aramco: 60 prosent i 1974, hele selskapet fra 1980. */
function AramcoStolpe({ pos, hopp }: { pos: [number, number]; hopp: boolean }) {
    const [x, y] = pos;
    const bredde = 400;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x={x - bredde / 2 - 10} y={y - 80} width={bredde + 20} height={150} rx={18} fill="#ffffff" opacity={0.95} />
            <text x={x} y={y - 42} textAnchor="middle" fontSize={30} fontWeight={800} fill="#0f172a">
                Saudi-Arabia eier Aramco
            </text>
            <rect x={x - bredde / 2} y={y - 18} width={bredde} height={40} rx={8} fill="#cbd5e1" />
            <motion.rect
                x={x - bredde / 2}
                y={y - 18}
                height={40}
                rx={8}
                fill={FARGE.egen}
                initial={{ width: hopp ? 0 : bredde }}
                animate={{ width: hopp ? [0, bredde * 0.6, bredde * 0.6, bredde] : bredde }}
                transition={{ duration: hopp ? 6 : 0.4, times: [0, 0.2, 0.6, 0.8] }}
            />
            <motion.text
                x={x}
                y={y + 56}
                textAnchor="middle"
                fontSize={28}
                fontWeight={800}
                fill="#0f172a"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
            >
                {hopp ? '1974: 60 %  →  1980: hele' : '1980: hele selskapet'}
            </motion.text>
        </motion.g>
    );
}

/** Oljekuttet: produksjonen går ned fem prosent hver måned. */
function Kutt() {
    const maneder = ['Okt.', 'Nov.', 'Des.', 'Jan.'];
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-[5%] left-[4%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl"
        >
            <div className="font-display font-bold text-2xl text-slate-900 text-center">
                Produksjonen kuttes med 5 % hver måned
            </div>
            <div className="mt-3 flex items-end justify-center gap-5 h-36">
                {maneder.map((m, i) => (
                    <div key={m} className="flex flex-col items-center">
                        <div className="text-base font-bold text-red-600 h-6">{i > 0 ? '−5 %' : ''}</div>
                        <motion.div
                            className="w-14 rounded-t-md bg-orange-700"
                            initial={{ height: 100 }}
                            animate={{ height: 100 * Math.pow(0.95, i) }}
                            transition={{ delay: 0.5 + i * 0.6, duration: 0.8 }}
                        />
                        <div className="text-base font-semibold text-slate-600 mt-1">{m}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
