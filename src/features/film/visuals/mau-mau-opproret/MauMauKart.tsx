import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden, type Utsnitt as KartUtsnitt } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';

/**
 * Kart over Kenya i Mau Mau-tiden. «afrika»: Berlin-konferansen, Kenya blir britisk, og
 * nybyggerne tar høylandet. «skogen»: kjemperne i skogene rundt Mount Kenya og Nyandarua,
 * og borgerkrigen blant kikuyuene (Lari). «leirer»: Nairobi stengt, fangeleirene vokser.
 * «hola»: Kimathi tas, drapene i Hola, og nyheten som når parlamentet i London.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'afrika' | 'skogen' | 'leirer' | 'hola';

const KENYA_ID = '404';
const MOUNT_KENYA: LngLat = [37.31, -0.15];
const NYANDARUA: LngLat = [36.7, -0.4];
const NAIROBI: LngLat = [36.82, -1.29];
const LARI: LngLat = [36.66, -1.02];
const HOLA: LngLat = [40.03, -1.5];
const MOMBASA: LngLat = [39.66, -4.04];
const BERLIN: LngLat = [13.4, 52.52];
const LONDON: LngLat = [-0.13, 51.5];

/** Høylandet nybyggerne tok, grovt tegnet. */
const HOYLANDET: LngLat[] = [
    [35.0, 0.7],
    [35.6, 1.15],
    [36.5, 0.75],
    [37.1, 0.35],
    [37.25, -0.6],
    [37.05, -1.25],
    [36.5, -1.4],
    [35.85, -1.0],
    [35.25, -0.55],
    [34.95, 0.0],
];

/** Skogene, som ellipser: Mount Kenya er rund, Nyandarua er lang fra nord til sør. */
function ellipse([x, y]: LngLat, rx: number, ry: number): LngLat[] {
    return Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2;
        const r = 1 + Math.sin(a * 3 + x) * 0.08;
        return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
    });
}
const SKOG_MK = ellipse(MOUNT_KENYA, 0.36, 0.34);
const SKOG_NY = ellipse(NYANDARUA, 0.17, 0.42);

/** Tilfeldig tall med frø, så kartet ser likt ut hver gang. */
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Punkter spredt inne i en ellipse. */
function spredt(midt: LngLat, rx: number, ry: number, n: number, s: number): LngLat[] {
    return Array.from({ length: n }, (_, i) => {
        const r = Math.sqrt(frø(i + s)) * 0.85;
        const a = frø(i + s + 500) * Math.PI * 2;
        return [midt[0] + Math.cos(a) * rx * r, midt[1] + Math.sin(a) * ry * r];
    });
}
const KJEMPERE = [...spredt(MOUNT_KENYA, 0.34, 0.32, 34, 10), ...spredt(NYANDARUA, 0.15, 0.4, 26, 90)];
const LOJALE = spredt([36.95, -0.85], 0.45, 0.35, 22, 300);
const NYBYGGERE = spredt([36.1, -0.2], 0.9, 0.8, 30, 700);

/** Fangeleirer, tegnet som symboler. Plasseringen er en illustrasjon, ikke et leirkart. */
const LEIRER: LngLat[] = [
    [37.6, -1.6],
    [36.2, -0.9],
    [37.9, 0.3],
    [35.4, -0.2],
    [35.6, 1.0],
    [36.9, 0.9],
    [34.8, 0.6],
    [37.9, 2.2],
    [37.2, -2.6],
    [36.0, 1.6],
    HOLA,
    [38.8, -0.5],
];

interface Utsnitt {
    sv: LngLat;
    no: LngLat;
}
const VERDEN: Utsnitt = { sv: [-22, -16], no: [56, 64] };
const AFRIKA: Utsnitt = { sv: [-18, -36], no: [52, 38] };
const KENYA: Utsnitt = { sv: [33.4, -5.0], no: [42.2, 5.2] };
const SENTRAL: Utsnitt = { sv: [35.2, -1.9], no: [38.4, 0.6] };

function utsnittFor(modus: Modus, beat: number): Utsnitt {
    if (modus === 'afrika') return beat === 0 ? VERDEN : beat === 1 ? AFRIKA : KENYA;
    if (modus === 'skogen') return SENTRAL;
    if (modus === 'leirer') return beat === 1 ? SENTRAL : KENYA;
    return beat === 0 ? SENTRAL : beat === 1 ? KENYA : VERDEN;
}

/** Det fine kartet når vi er inne i Kenya, det grove når vi ser hele kontinentet. */
const FINT: KartUtsnitt = [
    [30, -8],
    [45, 7],
];

const OVERSKRIFTER: Record<Modus, string[]> = {
    afrika: ['Berlin-konferansen, 1884-1885', 'Kenya blir britisk', 'Fra 1903: nybyggerne kommer', 'Det fruktbare høylandet'],
    skogen: ['Skogene', 'Midten av 1954', 'Dedan Kimathi', 'En borgerkrig blant kikuyuene', 'Lari, mars 1953'],
    leirer: ['Britene slår tilbake', 'Nairobi, 1954', 'Fangeleirene', 'Gjennom 1950-tallet'],
    hola: ['Slutten av 1956: Kimathi tatt til fange', 'Hola, 3. mars 1959', 'Nyheten når London', 'Parlamentet, oktober 1959'],
};

interface Vindu {
    x: number;
    y: number;
    w: number;
}

const Land = memo(function Land({
    geographies,
    sti,
    kenya,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    kenya: string;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={String(g.id) === KENYA_ID ? kenya : '#ece3cf'}
                    stroke="#a8a08a"
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </>
    );
});

/** Merkelapp i skjermkoordinater, med lys kant så den leses over kartet. */
function Etikett({
    x,
    y,
    tekst,
    anker = 'start',
    farge = '#0f172a',
    str = 34,
}: {
    x: number;
    y: number;
    tekst: string;
    anker?: 'start' | 'middle' | 'end';
    farge?: string;
    str?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={800}
            fill={farge}
            stroke="#fffaf0"
            strokeWidth={8}
            paintOrder="stroke"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
        >
            {tekst}
        </motion.text>
    );
}

/** Faktaboks i et hjørne. */
function Fakta({ linjer, side = 'hoyre' }: { linjer: ReactNode[]; side?: 'hoyre' | 'venstre' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`absolute bottom-[8%] ${side === 'hoyre' ? 'right-[4%]' : 'left-[4%]'} px-6 py-4 rounded-2xl bg-white/95 shadow-xl`}
        >
            {linjer.map((l, i) => (
                <div key={i} className={i === 0 ? 'text-3xl font-black text-slate-900' : 'text-xl font-semibold text-slate-600 mt-1'}>
                    {l}
                </div>
            ))}
        </motion.div>
    );
}

/** Fangeleir: firkant med piggtråd-kryss. */
function Leir({ x, y, forsinkelse }: { x: number; y: number; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 16 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <rect x={x - 16} y={y - 16} width={32} height={32} fill="#44403c" stroke="#fff" strokeWidth={3} />
            <path d={`M ${x - 11} ${y - 11} L ${x + 11} ${y + 11} M ${x + 11} ${y - 11} L ${x - 11} ${y + 11}`} stroke="#e7e5e4" strokeWidth={3} />
        </motion.g>
    );
}

export function MauMauKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'afrika';
    const utsnittNaa = utsnittFor(modus, beat);
    const inne = utsnittNaa === KENYA || utsnittNaa === SENTRAL;
    const { geographies } = useFilmVerden(inne ? FINT : undefined);

    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [B, H],
                ],
                { type: 'MultiPoint', coordinates: [VERDEN.sv, VERDEN.no] } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];

    const vinduFor = (u: Utsnitt): Vindu => {
        const a = p(u.sv);
        const b = p(u.no);
        const w = Math.max(Math.abs(b[0] - a[0]), (Math.abs(b[1] - a[1]) * B) / H) * 1.05;
        return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, w };
    };
    const mål = vinduFor(utsnittNaa);
    const [vindu, setVindu] = useState<Vindu>(mål);
    const naa = useRef(vindu);
    useEffect(() => {
        const fra = naa.current;
        if (fra.x === mål.x && fra.y === mål.y && fra.w === mål.w) return;
        const c = animate(0, 1, {
            duration: playing ? 2.6 : 0.01,
            ease: 'easeInOut',
            onUpdate: (k) => {
                // Bredden interpoleres logaritmisk, så zoomen føles jevn.
                const w = Math.exp(Math.log(fra.w) + (Math.log(mål.w) - Math.log(fra.w)) * k);
                const ny = { x: fra.x + (mål.x - fra.x) * k, y: fra.y + (mål.y - fra.y) * k, w };
                naa.current = ny;
                setVindu(ny);
            },
        });
        return () => c.stop();
    }, [mål.x, mål.y, mål.w, playing]);

    const kk = B / vindu.w;
    const kartTransform = `translate(${B / 2} ${H / 2}) scale(${kk}) translate(${-vindu.x} ${-vindu.y})`;
    const s = (ll: LngLat): [number, number] => {
        const [x, y] = p(ll);
        return [B / 2 + (x - vindu.x) * kk, H / 2 + (y - vindu.y) * kk];
    };
    const flate = (pts: LngLat[]) => `M ${pts.map((ll) => p(ll).join(' ')).join(' L ')} Z`;

    const britisk = modus !== 'afrika' || beat >= 1;
    const kenyaFarge = britisk ? '#f4c7c3' : '#ece3cf';
    const visHoyland = modus === 'afrika' && beat >= 3;
    const visSkog = modus === 'skogen' || (modus === 'leirer' && beat === 1) || (modus === 'hola' && beat === 0);
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    const [mk, ny, nb, la, ho, lo, be, mo] = [MOUNT_KENYA, NYANDARUA, NAIROBI, LARI, HOLA, LONDON, BERLIN, MOMBASA].map(s);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#bcd4e4' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <g transform={kartTransform}>
                    <Land geographies={geographies} sti={sti} kenya={kenyaFarge} />
                    {visHoyland && (
                        <motion.path
                            d={flate(HOYLANDET)}
                            fill="#65a30d"
                            fillOpacity={0.45}
                            stroke="#3f6212"
                            strokeWidth={4 / kk}
                            strokeDasharray={`${12 / kk} ${8 / kk}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )}
                    {visSkog && (
                        <>
                            <path d={flate(SKOG_MK)} fill="#166534" fillOpacity={0.75} />
                            <path d={flate(SKOG_NY)} fill="#166534" fillOpacity={0.75} />
                        </>
                    )}
                    {modus === 'hola' && beat >= 2 && (
                        <motion.path
                            d={`M ${p(HOLA).join(' ')} Q ${p([22, 30]).join(' ')} ${p(LONDON).join(' ')}`}
                            fill="none"
                            stroke="#b91c1c"
                            strokeWidth={5 / kk}
                            strokeLinecap="round"
                            initial={{ pathLength: beat === 2 ? 0 : 1 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 2.4 : 0, delay: playing && beat === 2 ? 1.6 : 0 }}
                        />
                    )}
                    {modus === 'afrika' && beat === 0 && (
                        <motion.path
                            d={`M ${p(BERLIN).join(' ')} Q ${p([30, 30]).join(' ')} ${p([37.5, 0]).join(' ')}`}
                            fill="none"
                            stroke="#7c2d12"
                            strokeWidth={4 / kk}
                            strokeDasharray={`${14 / kk} ${10 / kk}`}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 2.4 : 0, delay: playing ? 0.8 : 0 }}
                        />
                    )}
                </g>

                {/* Nybyggere: prikker fra kysten opp i høylandet */}
                {modus === 'afrika' &&
                    beat >= 2 &&
                    NYBYGGERE.map((ll, i) => {
                        const [x, y] = s(ll);
                        return (
                            <motion.circle
                                key={i}
                                r={9}
                                fill="#1d4ed8"
                                stroke="#fff"
                                strokeWidth={2.5}
                                initial={{ cx: mo[0], cy: mo[1], opacity: 0 }}
                                animate={{ cx: x, cy: y, opacity: 1 }}
                                transition={{ duration: playing && beat === 2 ? 2.2 : 0, delay: playing && beat === 2 ? i * 0.06 : 0 }}
                            />
                        );
                    })}

                {/* Kjempere i skogene, og de lojale kikuyuene rundt */}
                {modus === 'skogen' &&
                    beat >= 1 &&
                    KJEMPERE.map((ll, i) => {
                        const [x, y] = s(ll);
                        return (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={7}
                                fill={i % 10 === 0 ? '#c026d3' : '#fef3c7'}
                                stroke="#14532d"
                                strokeWidth={2}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: playing ? i * 0.03 : 0 }}
                            />
                        );
                    })}
                {modus === 'skogen' &&
                    beat >= 3 &&
                    LOJALE.map((ll, i) => {
                        const [x, y] = s(ll);
                        return (
                            <motion.rect
                                key={i}
                                x={x - 7}
                                y={y - 7}
                                width={14}
                                height={14}
                                fill="#2563eb"
                                stroke="#fff"
                                strokeWidth={2}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: playing ? i * 0.05 : 0 }}
                            />
                        );
                    })}

                {/* Fangeleirene */}
                {modus === 'leirer' &&
                    beat >= 2 &&
                    LEIRER.slice(0, beat === 2 ? 4 : LEIRER.length).map((ll, i) => {
                        const [x, y] = s(ll);
                        return <Leir key={i} x={x} y={y} forsinkelse={playing ? (i % 4) * 0.25 + (i >= 4 ? 0.6 : 0) : 0} />;
                    })}
                {modus === 'leirer' && beat === 1 && (
                    <motion.circle
                        cx={nb[0]}
                        cy={nb[1]}
                        r={70}
                        fill="#b91c1c"
                        fillOpacity={0.15}
                        stroke="#b91c1c"
                        strokeWidth={6}
                        strokeDasharray="16 10"
                        initial={{ opacity: 0, scale: 1.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ transformOrigin: `${nb[0]}px ${nb[1]}px` }}
                    />
                )}

                {/* Steder */}
                {modus === 'afrika' && beat === 0 && (
                    <g>
                        <circle cx={be[0]} cy={be[1]} r={11} fill="#7c2d12" stroke="#fff" strokeWidth={3} />
                        <Etikett x={be[0] + 18} y={be[1] + 10} tekst="Berlin" />
                        <Etikett x={s([37, 2])[0] + 30} y={s([37, 2])[1]} tekst="Øst-Afrika" farge="#7c2d12" />
                    </g>
                )}
                {modus === 'afrika' && beat === 1 && (
                    <Etikett x={s([38, 1])[0] + 26} y={s([38, 1])[1] + 8} tekst="Kenya: britisk koloni" farge="#991b1b" />
                )}
                {modus === 'afrika' && beat >= 2 && (
                    <>
                        <Etikett x={mo[0] + 18} y={mo[1] + 12} tekst="Kysten" farge="#334155" str={30} />
                        <Etikett x={s([40.6, 2.6])[0]} y={s([40.6, 2.6])[1]} tekst="KENYA" anker="middle" farge="#991b1b" str={44} />
                    </>
                )}
                {visHoyland && (
                    <Etikett x={s([35.9, 1.4])[0]} y={s([35.9, 1.4])[1] - 20} tekst="Høylandet" anker="middle" farge="#3f6212" str={40} />
                )}
                {visSkog && (
                    <>
                        <Etikett x={mk[0] + (modus === 'skogen' ? 150 : 90)} y={mk[1] - 40} tekst="Mount Kenya" />
                        <Etikett x={ny[0] - (modus === 'skogen' ? 80 : 60)} y={ny[1] - 30} tekst="Nyandarua" anker="end" />
                    </>
                )}
                {(modus === 'skogen' || modus === 'leirer' || (modus === 'hola' && beat <= 1)) && (
                    <g>
                        <circle cx={nb[0]} cy={nb[1]} r={12} fill="#0f172a" stroke="#fff" strokeWidth={3} />
                        <Etikett x={nb[0] - 20} y={nb[1] + 12} tekst="Nairobi" anker="end" />
                    </g>
                )}
                {modus === 'skogen' && beat === 2 && (
                    <Etikett x={ny[0] - 80} y={ny[1] + 40} tekst="Dedan Kimathi" anker="end" farge="#92400e" />
                )}
                {modus === 'skogen' && beat >= 3 && (
                    <Etikett x={s([37.6, -0.9])[0] + 40} y={s([37.6, -0.9])[1]} tekst="Lojale kikuyuer" farge="#1d4ed8" />
                )}
                {modus === 'skogen' && beat === 4 && (
                    <g>
                        <motion.circle
                            cx={la[0]}
                            cy={la[1]}
                            r={30}
                            fill="none"
                            stroke="#b91c1c"
                            strokeWidth={6}
                            initial={{ opacity: 0, scale: 2 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ transformOrigin: `${la[0]}px ${la[1]}px` }}
                        />
                        <Etikett x={la[0] - 44} y={la[1] + 12} tekst="Lari" anker="end" farge="#b91c1c" />
                    </g>
                )}
                {modus === 'hola' && (
                    <g>
                        {beat >= 1 && (
                            <>
                                <rect x={ho[0] - 14} y={ho[1] - 14} width={28} height={28} fill="#44403c" stroke="#fff" strokeWidth={3} />
                                {beat === 1 && <Etikett x={ho[0] + 26} y={ho[1] + 12} tekst="Hola" />}
                            </>
                        )}
                        {beat >= 2 && (
                            <>
                                <circle cx={lo[0]} cy={lo[1]} r={12} fill="#b91c1c" stroke="#fff" strokeWidth={3} />
                                <Etikett x={lo[0] - 20} y={lo[1] - 22} tekst="London" anker="end" />
                            </>
                        )}
                    </g>
                )}
            </svg>

            {modus === 'skogen' && beat === 1 && (
                <Fakta linjer={['18 000-24 000 kjempere', 'omtrent én av ti var kvinner (lilla)']} />
            )}
            {modus === 'skogen' && beat === 4 && <Fakta linjer={['Lari: minst 97 drept', 'rundt 2000 drept av opprørerne i alt']} />}
            {modus === 'leirer' && beat === 1 && <Fakta linjer={['Stengt i fire uker', 'de afrikanske bydelene']} />}
            {modus === 'leirer' && beat === 2 && <Fakta linjer={['rundt 25 000 menn', 'sendt til fangeleirer']} />}
            {modus === 'leirer' && beat === 3 && (
                <Fakta linjer={['rundt 150 000 mennesker', 'de fleste uten rettssak']} />
            )}
            {modus === 'hola' && beat === 1 && <Fakta linjer={['Elleve fanger slått i hjel', 'tvunget til tungt arbeid']} />}
            {modus === 'hola' && beat === 2 && (
                <Fakta side="venstre" linjer={['Tragiske og sjokkerende', 'ministeren for koloniene']} />
            )}
            {modus === 'hola' && beat === 3 && (
                <Fakta side="venstre" linjer={['Enoch Powell:', 'ikke lavere standarder i Afrika enn hjemme']} />
            )}
            {modus === 'leirer' && beat >= 2 && (
                <div className="absolute bottom-[3%] left-[3%] text-base font-semibold text-slate-600">
                    Symbolene viser at leirene var mange, ikke hvor de lå
                </div>
            )}

            {utsnittNaa === SENTRAL && (
                <Oversiktskart
                    utsnitt={[SENTRAL.sv, SENTRAL.no]}
                    omrade={[
                        [31, -6],
                        [44, 6],
                    ]}
                    plassering="nede-venstre"
                    etikett="Kenya"
                />
            )}
            <AnimatePresence mode="wait">
                {overskrift && (
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
