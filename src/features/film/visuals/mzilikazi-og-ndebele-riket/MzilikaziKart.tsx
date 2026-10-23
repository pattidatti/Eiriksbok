import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Kart over vandringen til Mzilikazi og Ndebele-folket, fra Zululand til Bulawayo.
 * «fodt»: Mkuze, Khumalo-folket mellom Zwide og Dingiswayo, og veien til Shaka.
 * «nord»: Middelburg, pedi-folket, Magaliesberg og riket fra Vaal til Limpopo.
 * «mosega»: Moffat fra Kuruman, Dingane slått ved Sand-elva, Mosega, rolong og griqua.
 * «bulawayo»: hele vandringen, Bulawayo, Matabeleland, Rozvi og Stor-Zimbabwe.
 *
 * Grunnkartet ligger fast og zoomes ved å skalere hele kartet, så linjer og flater følger med.
 */

type Modus = 'fodt' | 'nord' | 'mosega' | 'bulawayo';
type LngLat = [number, number];
type Ramme = [LngLat, LngLat];

const B = 1600;
const H = 900;

const GRUNN: Ramme = [
    [14, -36],
    [42, -12],
];
const VID: Ramme = [
    [16, -35],
    [37, -17],
];
const ZULU_NAER: Ramme = [
    [29.4, -29.6],
    [33.8, -26.3],
];
const NORD: Ramme = [
    [24.2, -29.4],
    [33.2, -22.3],
];
const VEST: Ramme = [
    [21.6, -30.2],
    [31.4, -23.4],
];
const HELE: Ramme = [
    [19.5, -31],
    [36.5, -17],
];
const ZIM: Ramme = [
    [24.6, -23.4],
    [34, -15.6],
];

const ZULULAND: LngLat = [31.3, -28.35];
const MKUZE: LngLat = [31.95, -27.6];
const ZWIDE: LngLat = [31.6, -26.95];
const MTHETHWA: LngLat = [32.1, -28.75];
const MIDDELBURG: LngLat = [29.47, -25.77];
const PEDI: LngLat = [29.95, -24.75];
const MAGALIESBERG: LngLat = [27.6, -25.75];
const FESTNINGER: LngLat[] = [
    [27.25, -25.8],
    [27.7, -25.6],
    [28.05, -25.85],
];
const MOSEGA: LngLat = [26.1, -25.45];
const KURUMAN: LngLat = [23.43, -27.45];
const ROLONG: LngLat = [25.2, -26.5];
const GRIQUA: LngLat = [23.6, -28.85];
const MOTET: LngLat = [26.9, -24.2];
const OVERGANG: LngLat = [27.9, -22.55];
const BULAWAYO: LngLat = [28.58, -20.15];
const MATOPO: LngLat = [28.5, -20.6];
const STOR_ZIMBABWE: LngLat = [30.93, -20.27];

const VAAL: LngLat[] = [
    [29.9, -26.55],
    [28.9, -26.85],
    [27.9, -26.75],
    [27.0, -26.95],
    [26.3, -27.4],
    [25.4, -27.95],
    [24.6, -28.6],
    [23.9, -29.0],
];
const LIMPOPO: LngLat[] = [
    MOTET,
    [27.3, -23.6],
    [27.9, -22.9],
    [28.6, -22.4],
    [29.5, -22.2],
    [30.5, -22.3],
    [31.3, -22.4],
    [32.2, -23.2],
    [32.9, -24.2],
    [33.6, -25.1],
];
const KROKODILLE: LngLat[] = [
    [28.0, -25.75],
    [27.65, -25.3],
    [27.25, -24.75],
    MOTET,
];
const MARICO: LngLat[] = [
    [26.15, -25.7],
    [26.35, -25.1],
    [26.65, -24.6],
    MOTET,
];

/** Riket ved Magaliesberg, grovt: fra Vaal-elva opp til der elvene møtes. */
const RIKET_1827: LngLat[] = [
    [26.4, -27.3],
    [27.9, -26.85],
    [29.0, -26.9],
    [29.2, -25.9],
    [28.6, -24.9],
    [27.6, -24.2],
    MOTET,
    [26.2, -24.9],
    [25.9, -26.2],
];

/** Matabeleland, grovt: det vestlige Zimbabwe. Klippes mot land. */
const MATABELELAND: LngLat[] = [
    [26.6, -18.4],
    [28.6, -17.9],
    [29.9, -19.0],
    [30.1, -20.6],
    [29.6, -22.3],
    [27.9, -22.1],
    [26.2, -20.2],
];

const RUTE: LngLat[] = [ZULULAND, MIDDELBURG, MAGALIESBERG, MOSEGA, OVERGANG, MATOPO, BULAWAYO];

const ROD = '#b91c1c';
const NDEBELE = '#9a3412';
const ELV = '#2563eb';
const GRA = '#475569';

interface Vindu {
    x: number;
    y: number;
    w: number;
}

/** Projeksjon for grunnkartet og zoom mot et utsnitt. Glir mellom utsnitt når filmen spiller. */
function useZoom(utsnitt: Ramme, playing: boolean) {
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [B, H],
                ],
                { type: 'MultiPoint', coordinates: GRUNN } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const a = p(utsnitt[0]);
    const b = p(utsnitt[1]);
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const mw = Math.max(Math.abs(b[0] - a[0]), (Math.abs(b[1] - a[1]) * B) / H);
    const [vindu, setVindu] = useState<Vindu>({ x: mx, y: my, w: mw });
    const naa = useRef(vindu);
    useEffect(() => {
        const fra = naa.current;
        if (fra.x === mx && fra.y === my && fra.w === mw) return;
        const c = animate(0, 1, {
            duration: playing ? 2.4 : 0.01,
            ease: 'easeInOut',
            onUpdate: (k) => {
                const w = Math.exp(Math.log(fra.w) + (Math.log(mw) - Math.log(fra.w)) * k);
                const ny = { x: fra.x + (mx - fra.x) * k, y: fra.y + (my - fra.y) * k, w };
                naa.current = ny;
                setVindu(ny);
            },
        });
        return () => c.stop();
    }, [mx, my, mw, playing]);

    const kk = B / vindu.w;
    const kartTransform = `translate(${B / 2} ${H / 2}) scale(${kk}) translate(${-vindu.x} ${-vindu.y})`;
    const skjerm = (ll: LngLat): [number, number] => {
        const [x, y] = p(ll);
        return [B / 2 + (x - vindu.x) * kk, H / 2 + (y - vindu.y) * kk];
    };
    const linje = (pts: LngLat[]) => `M ${pts.map((ll) => p(ll).join(' ')).join(' L ')}`;
    return { sti, kk, kartTransform, skjerm, linje };
}

function Etikett({
    tekst,
    pkt,
    farge = '#0f172a',
    anker = 'middle',
    str = 34,
    dx = 0,
    dy = 0,
}: {
    tekst: string;
    pkt: [number, number];
    farge?: string;
    anker?: 'middle' | 'end' | 'start';
    str?: number;
    dx?: number;
    dy?: number;
}) {
    return (
        <motion.text
            x={pkt[0] + dx}
            y={pkt[1] + dy}
            textAnchor={anker}
            fontSize={str}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {tekst}
        </motion.text>
    );
}

function Sted({ pkt, farge = '#0f172a', r = 12 }: { pkt: [number, number]; farge?: string; r?: number }) {
    return (
        <motion.circle
            cx={pkt[0]}
            cy={pkt[1]}
            r={r}
            fill={farge}
            stroke="#fff"
            strokeWidth={4}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ transformOrigin: `${pkt[0]}px ${pkt[1]}px` }}
        />
    );
}

/** En liten festning: firkant med tårn. */
function Festning({ pkt }: { pkt: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: `${pkt[0]}px ${pkt[1]}px` }}
        >
            <rect x={pkt[0] - 14} y={pkt[1] - 14} width={28} height={28} fill={NDEBELE} stroke="#fff" strokeWidth={4} />
            <rect x={pkt[0] - 5} y={pkt[1] - 24} width={10} height={12} fill={NDEBELE} stroke="#fff" strokeWidth={3} />
        </motion.g>
    );
}

/** Buet pil i skjermkoordinater som tegnes opp. */
function Pil({
    fra,
    til,
    farge,
    bue = 0.2,
    bredde = 9,
    stiplet = false,
    playing,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    bue?: number;
    bredde?: number;
    stiplet?: boolean;
    playing: boolean;
}) {
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    const mx = (fra[0] + til[0]) / 2 - dy * bue;
    const my = (fra[1] + til[1]) / 2 + dx * bue;
    const vinkel = Math.atan2(til[1] - my, til[0] - mx);
    const spiss: [number, number] = [til[0] - Math.cos(vinkel) * 22, til[1] - Math.sin(vinkel) * 22];
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${spiss[0]} ${spiss[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                strokeDasharray={stiplet ? '4 16' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: playing ? 1.6 : 0 }}
            />
            <motion.polygon
                points={`0,-${bredde * 1.7} ${bredde * 3},0 0,${bredde * 1.7}`}
                fill={farge}
                transform={`translate(${spiss[0]} ${spiss[1]}) rotate(${(vinkel * 180) / Math.PI})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: playing ? 1.4 : 0 }}
            />
        </g>
    );
}

/** Hvit boks med to eller tre linjer, i skjermkoordinater. */
function Fakta({
    x,
    y,
    linjer,
    bredde = 460,
    kant = '#0f172a',
}: {
    x: number;
    y: number;
    linjer: string[];
    bredde?: number;
    kant?: string;
}) {
    return (
        <motion.g key={linjer.join('|')} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <rect x={x} y={y} width={bredde} height={36 + linjer.length * 54} rx={20} fill="#ffffff" fillOpacity={0.95} stroke={kant} strokeWidth={3} />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x + bredde / 2}
                    y={y + 62 + i * 54}
                    textAnchor="middle"
                    fontSize={i === 0 ? 40 : 32}
                    fontWeight={i === 0 ? 900 : 700}
                    fill="#0f172a"
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

function utsnittFor(modus: Modus, beat: number): Ramme {
    if (modus === 'fodt') return beat === 0 ? VID : ZULU_NAER;
    if (modus === 'nord') return NORD;
    if (modus === 'mosega') return VEST;
    return beat === 0 ? HELE : ZIM;
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    fodt: ['Rundt 1790: Mkuze', 'Khumalo-folket', 'Klemt mellom to naboer', 'Faren blir drept', 'Hos Shaka'],
    nord: ['En kongelig landsby', 'Pedi-folket', '1827: Magaliesberg', 'Fra Vaal til Limpopo'],
    mosega: ['1830: Robert Moffat', 'Kongen av Kuruman', '1830: Dingane angriper', '1832: Mosega', 'Rolong og griqua'],
    bulawayo: ['Hele vandringen', 'Bulawayo', 'Matabeleland', 'Rozvi-riket', 'Stor-Zimbabwe'],
};

export function MzilikaziKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'fodt';
    const utsnitt = utsnittFor(modus, beat);
    const fint = utsnitt === ZULU_NAER;
    const { geographies } = useFilmVerden(fint ? ZULU_NAER : undefined);
    const { sti, kk, kartTransform, skjerm, linje } = useZoom(utsnitt, playing);
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];

    const zu = skjerm(ZULULAND);
    const mk = skjerm(MKUZE);
    const zw = skjerm(ZWIDE);
    const mt = skjerm(MTHETHWA);
    const mb = skjerm(MIDDELBURG);
    const pe = skjerm(PEDI);
    const mg = skjerm(MAGALIESBERG);
    const mo = skjerm(MOSEGA);
    const ku = skjerm(KURUMAN);
    const ro = skjerm(ROLONG);
    const gr = skjerm(GRIQUA);
    const bu = skjerm(BULAWAYO);
    const ma = skjerm(MATOPO);
    const sz = skjerm(STOR_ZIMBABWE);

    const visRiket = modus === 'nord' && beat >= 3;
    const visElver = modus === 'nord' || modus === 'mosega' || modus === 'bulawayo';
    const visMatabele = modus === 'bulawayo' && beat >= 2;
    const ruteSynlig = modus === 'bulawayo';

    return (
        <div className="absolute inset-0 bg-[#a9cbe0] overflow-hidden">
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <clipPath id="mzilikazi-land">
                        {geographies.map((g, i) => (
                            <path key={i} d={sti(g as never) ?? ''} />
                        ))}
                    </clipPath>
                </defs>
                <g transform={kartTransform}>
                    {geographies.map((g, i) => (
                        <path
                            key={i}
                            d={sti(g as never) ?? ''}
                            fill={modus === 'bulawayo' && String(g.id) === '716' && beat >= 1 ? '#f3dfb4' : '#ece3cf'}
                            stroke="#a8a08a"
                            strokeWidth={1.2}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    {visRiket && (
                        <motion.path
                            d={`${linje(RIKET_1827)} Z`}
                            fill={NDEBELE}
                            stroke={NDEBELE}
                            strokeWidth={3 / kk}
                            initial={{ fillOpacity: 0 }}
                            animate={{ fillOpacity: 0.28 }}
                            transition={{ duration: playing ? 1.2 : 0 }}
                        />
                    )}
                    {visMatabele && (
                        <g clipPath="url(#mzilikazi-land)">
                            <motion.path
                                d={`${linje(MATABELELAND)} Z`}
                                fill={NDEBELE}
                                initial={{ fillOpacity: 0 }}
                                animate={{ fillOpacity: 0.3 }}
                                transition={{ duration: playing ? 1.2 : 0 }}
                            />
                        </g>
                    )}
                    {visElver && (
                        <>
                            {[VAAL, LIMPOPO, KROKODILLE, MARICO].map((e, i) => (
                                <path
                                    key={i}
                                    d={linje(e)}
                                    fill="none"
                                    stroke={ELV}
                                    strokeOpacity={0.8}
                                    strokeWidth={(modus === 'nord' && beat === 3 ? 6 : 4) / kk}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ))}
                        </>
                    )}
                    {ruteSynlig && (
                        <motion.path
                            d={linje(RUTE)}
                            fill="none"
                            stroke={ROD}
                            strokeWidth={8 / kk}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 4 : 0, ease: 'easeInOut' }}
                        />
                    )}
                </g>

                {/* Født ved Mkuze */}
                {modus === 'fodt' && beat === 0 && (
                    <>
                        <Sted pkt={mk} farge={ROD} r={10} />
                        <Etikett tekst="Mkuze" pkt={mk} dx={24} dy={10} anker="start" farge={ROD} />
                        <Etikett tekst="Sør-Afrika" pkt={skjerm([24, -30.5])} farge={GRA} str={38} />
                        <Fakta x={1080} y={600} linjer={['Rundt 1790', 'eller rundt 1795?', 'ingen vet sikkert']} bredde={440} />
                    </>
                )}
                {modus === 'fodt' && beat >= 1 && (
                    <>
                        <Sted pkt={mk} farge={NDEBELE} r={12} />
                        <Etikett tekst="Khumalo" pkt={mk} dx={26} dy={12} anker="start" farge={NDEBELE} str={38} />
                    </>
                )}
                {modus === 'fodt' && beat === 1 && (
                    <Fakta x={1080} y={600} linjer={['Mashobane', 'faren til Mzilikazi', 'høvding for Khumalo']} bredde={460} kant={NDEBELE} />
                )}
                {modus === 'fodt' && beat >= 2 && beat <= 3 && (
                    <>
                        <Sted pkt={zw} farge={GRA} r={12} />
                        <Etikett tekst="Zwide" pkt={zw} dx={-24} dy={-12} anker="end" farge={GRA} str={38} />
                        <Sted pkt={mt} farge={GRA} r={12} />
                        <Etikett tekst="Dingiswayo" pkt={mt} dx={-24} dy={12} anker="end" farge={GRA} str={38} />
                        <Etikett tekst="mthethwa" pkt={mt} dx={-24} dy={52} anker="end" farge={GRA} str={30} />
                    </>
                )}
                {modus === 'fodt' && beat === 2 && (
                    <>
                        <Pil fra={[zw[0] + 10, zw[1] + 18]} til={[mk[0] - 4, mk[1] - 26]} farge={GRA} bue={0.15} playing={playing} />
                        <Pil fra={[mt[0] - 6, mt[1] - 20]} til={[mk[0] - 10, mk[1] + 26]} farge={GRA} bue={-0.15} playing={playing} />
                        <Fakta x={1080} y={600} linjer={['Zwide', 'bestefaren', 'til Mzilikazi']} bredde={400} kant={GRA} />
                    </>
                )}
                {modus === 'fodt' && beat === 3 && (
                    <>
                        <Pil fra={[zw[0] + 10, zw[1] + 18]} til={[mk[0] - 4, mk[1] - 26]} farge={ROD} bue={0.15} playing={playing} />
                        <Fakta x={1080} y={620} linjer={['Zwide', 'lar faren drepe']} bredde={400} kant={ROD} />
                    </>
                )}
                {modus === 'fodt' && beat >= 4 && (
                    <>
                        <Sted pkt={zu} farge={ROD} r={14} />
                        <Etikett tekst="Shaka" pkt={zu} dx={-26} dy={12} anker="end" farge={ROD} str={40} />
                        <Etikett tekst="Zulu-riket" pkt={zu} dx={-26} dy={54} anker="end" farge={ROD} str={30} />
                        <Pil fra={[mk[0] - 14, mk[1] + 18]} til={[zu[0] + 18, zu[1] - 8]} farge={NDEBELE} bue={0.2} playing={playing} />
                        <Fakta x={1080} y={620} linjer={['Rådgiver', 'hos Shaka']} bredde={380} kant={ROD} />
                    </>
                )}

                {/* Nordover: Middelburg og Magaliesberg */}
                {modus === 'nord' && (
                    <>
                        <Sted pkt={zu} farge={ROD} r={10} />
                        <Etikett tekst="Zululand" pkt={zu} dy={48} farge={ROD} str={32} />
                        <Sted pkt={mb} farge={NDEBELE} r={beat <= 1 ? 14 : 10} />
                        <Etikett tekst="Middelburg" pkt={mb} dx={22} dy={-16} anker="start" farge={NDEBELE} str={beat <= 1 ? 36 : 30} />
                    </>
                )}
                {modus === 'nord' && beat === 0 && (
                    <>
                        <Pil fra={[zu[0] - 10, zu[1] - 18]} til={[mb[0] + 8, mb[1] + 22]} farge={NDEBELE} bue={0.12} playing={playing} />
                        <Fakta x={60} y={620} linjer={['Kongelig landsby', 'ved Middelburg']} bredde={460} kant={NDEBELE} />
                    </>
                )}
                {modus === 'nord' && beat === 1 && (
                    <>
                        <Sted pkt={pe} farge={GRA} r={11} />
                        <Etikett tekst="pedi" pkt={pe} dx={22} dy={12} anker="start" farge={GRA} str={36} />
                        <Pil fra={[mb[0] + 10, mb[1] - 16]} til={[pe[0] - 8, pe[1] + 18]} farge={NDEBELE} bue={-0.2} playing={playing} />
                        <Fakta x={60} y={620} linjer={['Pedi-folket', 'beseiret']} bredde={400} kant={NDEBELE} />
                    </>
                )}
                {modus === 'nord' && beat >= 2 && (
                    <>
                        {FESTNINGER.map((ll, i) => (
                            <Festning key={i} pkt={skjerm(ll)} />
                        ))}
                        <Etikett tekst="Magaliesberg" pkt={mg} dy={60} farge={NDEBELE} str={36} />
                    </>
                )}
                {modus === 'nord' && beat === 2 && (
                    <>
                        <Pil fra={[mb[0] - 16, mb[1]]} til={[mg[0] + 50, mg[1] - 6]} farge={NDEBELE} bue={-0.15} playing={playing} />
                        <Fakta x={60} y={620} linjer={['1827', 'tre festninger']} bredde={380} kant={NDEBELE} />
                    </>
                )}
                {modus === 'nord' && beat === 3 && (
                    <>
                        <Etikett tekst="Vaal" pkt={skjerm([26.6, -27.6])} farge={ELV} str={36} />
                        <Etikett tekst="Limpopo" pkt={skjerm(MOTET)} dx={-20} dy={-6} anker="end" farge={ELV} str={36} />
                        <Etikett tekst="Krokodille" pkt={skjerm([27.6, -24.75])} anker="start" farge={ELV} str={30} />
                        <Sted pkt={skjerm(MOTET)} farge={ELV} r={10} />
                        <Fakta x={60} y={620} linjer={['Riket', 'fra Vaal til Limpopo']} bredde={440} kant={NDEBELE} />
                    </>
                )}

                {/* Vest: Moffat, Dingane og Mosega */}
                {modus === 'mosega' && (
                    <>
                        <Sted pkt={ku} farge="#334155" r={11} />
                        <Etikett tekst="Kuruman" pkt={ku} dy={46} farge="#334155" str={34} />
                        {beat <= 2 && (
                            <>
                                <Sted pkt={mg} farge={NDEBELE} r={14} />
                                <Etikett tekst="Magaliesberg" pkt={mg} dx={22} dy={-18} anker="start" farge={NDEBELE} str={32} />
                            </>
                        )}
                    </>
                )}
                {modus === 'mosega' && beat <= 1 && (
                    <>
                        <Pil fra={[ku[0] + 18, ku[1] - 10]} til={[mg[0] - 18, mg[1] + 6]} farge="#334155" bue={-0.18} stiplet playing={playing} />
                        {beat === 0 && <Fakta x={1080} y={600} linjer={['Misjonær', 'sprer kristendommen', 'fra Skottland']} bredde={460} kant="#334155" />}
                        {beat === 1 && <Fakta x={1080} y={600} linjer={['Nære venner', 'besøk helt', 'til 1859']} bredde={420} kant="#334155" />}
                    </>
                )}
                {modus === 'mosega' && beat === 2 && (
                    <>
                        <Pil fra={skjerm([30.6, -27.9])} til={[mg[0] + 40, mg[1] + 46]} farge={ROD} bue={0.1} playing={playing} />
                        <Etikett tekst="Dingane" pkt={skjerm([30.6, -27.9])} dy={46} farge={ROD} str={36} />
                        <Fakta x={60} y={600} linjer={['Sand-elva', 'zulu-regimentene', 'blir slått']} bredde={440} kant={ROD} />
                    </>
                )}
                {modus === 'mosega' && beat >= 3 && (
                    <>
                        <Sted pkt={mo} farge={NDEBELE} r={14} />
                        <Etikett tekst="Mosega" pkt={mo} dx={-24} dy={-14} anker="end" farge={NDEBELE} str={38} />
                        <Etikett tekst="Marico" pkt={skjerm([26.55, -24.85])} anker="start" farge={ELV} str={28} dx={10} />
                    </>
                )}
                {modus === 'mosega' && beat === 3 && (
                    <>
                        <Pil fra={[mg[0] - 10, mg[1]]} til={[mo[0] + 20, mo[1]]} farge={NDEBELE} bue={0.2} playing={playing} />
                        <Fakta x={1080} y={620} linjer={['1832', 'ny hovedstad']} bredde={380} kant={NDEBELE} />
                    </>
                )}
                {modus === 'mosega' && beat === 4 && (
                    <>
                        <Sted pkt={ro} farge={GRA} r={11} />
                        <Etikett tekst="rolong" pkt={ro} dx={-22} dy={14} anker="end" farge={GRA} str={34} />
                        <Sted pkt={gr} farge={GRA} r={11} />
                        <Etikett tekst="griqua" pkt={gr} dy={50} farge={GRA} str={34} />
                        <Pil fra={[mo[0] - 6, mo[1] + 18]} til={[ro[0] + 8, ro[1] - 18]} farge={NDEBELE} bue={0.2} playing={playing} />
                        <Fakta x={1080} y={620} linjer={['Angrepet', 'det skal bli dyrt']} bredde={420} kant={ROD} />
                    </>
                )}

                {/* Til Bulawayo */}
                {modus === 'bulawayo' && beat === 0 && (
                    <>
                        {[
                            [ZULULAND, 'Zululand', 'start', 22, 14],
                            [MIDDELBURG, 'Middelburg', 'start', 22, -14],
                            [MAGALIESBERG, 'Magaliesberg', 'end', -10, 46],
                            [MOSEGA, 'Mosega', 'end', -22, 12],
                        ].map(([ll, navn, anker, dx, dy]) => (
                            <g key={navn as string}>
                                <Sted pkt={skjerm(ll as LngLat)} farge={NDEBELE} r={9} />
                                <Etikett
                                    tekst={navn as string}
                                    pkt={skjerm(ll as LngLat)}
                                    anker={anker as 'start' | 'end'}
                                    dx={dx as number}
                                    dy={dy as number}
                                    farge={NDEBELE}
                                    str={28}
                                />
                            </g>
                        ))}
                        <Etikett tekst="Limpopo" pkt={skjerm([30.5, -22.3])} dy={-16} farge={ELV} str={30} />
                        <Sted pkt={bu} farge={ROD} r={12} />
                        <Fakta x={60} y={620} linjer={['Nesten 20 år', 'på vandring']} bredde={400} kant={ROD} />
                    </>
                )}
                {modus === 'bulawayo' && beat >= 1 && (
                    <>
                        <Sted pkt={bu} farge={ROD} r={14} />
                        <Etikett tekst="Bulawayo" pkt={bu} dx={-24} dy={-12} anker="end" farge={ROD} str={38} />
                        <motion.path
                            d={`M ${ma[0] - 50} ${ma[1] + 22} l 22 -32 l 16 18 l 18 -26 l 26 40 Z`}
                            fill="#78716c"
                            stroke="#fff"
                            strokeWidth={3}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                        {beat === 1 && <Etikett tekst="Matopo-åsene" pkt={ma} dx={50} dy={22} anker="start" farge="#44403c" str={32} />}
                    </>
                )}
                {modus === 'bulawayo' && beat === 1 && <Fakta x={1080} y={620} linjer={['Bulawayo', 'den nye hovedstaden']} bredde={440} kant={ROD} />}
                {modus === 'bulawayo' && beat >= 2 && <Etikett tekst="MATABELELAND" pkt={skjerm([27.6, -19.2])} farge={NDEBELE} str={40} />}
                {modus === 'bulawayo' && beat >= 3 && (
                    <>
                        <Etikett tekst="Rozvi-riket" pkt={skjerm([31.5, -18.6])} farge={GRA} str={36} />
                        {beat === 3 && <Pil fra={skjerm([29.0, -19.6])} til={skjerm([30.6, -18.9])} farge={NDEBELE} bue={-0.2} playing={playing} />}
                    </>
                )}
                {modus === 'bulawayo' && beat === 3 && <Fakta x={1080} y={620} linjer={['Shona-riket', 'Ndebele tar makten']} bredde={440} kant={NDEBELE} />}
                {modus === 'bulawayo' && beat === 4 && (
                    <>
                        <motion.rect
                            x={sz[0] - 13}
                            y={sz[1] - 13}
                            width={26}
                            height={26}
                            fill="#57534e"
                            stroke="#fff"
                            strokeWidth={4}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{ transformOrigin: `${sz[0]}px ${sz[1]}px` }}
                        />
                        <Etikett tekst="Stor-Zimbabwe" pkt={sz} dy={56} farge="#44403c" str={36} />
                        <Fakta x={1080} y={620} linjer={['Steinby', 'flere hundre år eldre']} bredde={440} kant="#57534e" />
                    </>
                )}
            </svg>
            <Overskrift tekst={overskrift} />
            <Oversiktskart
                utsnitt={utsnitt}
                omrade={[
                    [10, -36],
                    [42, -14],
                ]}
                plassering="oppe-venstre"
                synlig={fint || utsnitt === ZIM}
                etikett="Det sørlige Afrika"
            />
        </div>
    );
}
