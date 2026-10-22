import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Kart over landet til basotho, i det som i dag er Lesotho.
 * «fodt»: fra det sørlige Afrika ned til fjellandet, navnene og Butha-Buthe.
 * «naboer»: nybyggerne fra Kappkolonien, misjonærene, boerne og grensa fra 1848.
 * «fristat»: Oranjefristaten, de tre krigene og landet som krymper til ett fjell.
 * «avtale»: Basutoland blir britisk i 1868, jorda vest for Caledon-elva går tapt.
 *
 * Grunnkartet ligger fast og zoomes ved å skalere hele kartet, så linjer og flater følger med.
 */

type Modus = 'fodt' | 'naboer' | 'fristat' | 'avtale';
type LngLat = [number, number];
type Ramme = [LngLat, LngLat];

const B = 1600;
const H = 900;

const GRUNN: Ramme = [
    [15, -35.5],
    [36, -21],
];
const VID: Ramme = [
    [15.5, -35],
    [35.5, -21.5],
];
const NAER: Ramme = [
    [25.2, -31.2],
    [30.6, -27.8],
];
const MIDT: Ramme = [
    [20.5, -34.4],
    [31.5, -26.4],
];

const THABA_BOSIU: LngLat = [27.88, -29.36];
const BUTHA_BUTHE: LngLat = [28.25, -28.77];
const BEREA: LngLat = [27.62, -29.15];
/** Der pila med misjonærene starter, i skjermkoordinater: øverst til høyre, mot Europa i nord. */
const PARIS_PIL: [number, number] = [1540, 150];

/** Caledon-elva, grovt, fra nordøst mot sørvest. */
const CALEDON: LngLat[] = [
    [28.95, -28.72],
    [28.65, -28.6],
    [28.3, -28.68],
    [28.0, -28.83],
    [27.75, -29.0],
    [27.55, -29.2],
    [27.47, -29.32],
    [27.35, -29.48],
    [27.12, -29.72],
    [26.95, -29.98],
    [26.75, -30.3],
    [26.5, -30.55],
]

/** Jorda vest for Caledon-elva som basotho mistet: mellom elva og en linje lenger vest. */
const VESTLINJE: LngLat[] = [
    [26.05, -30.3],
    [26.3, -29.6],
    [26.75, -29.05],
    [27.35, -28.55],
    [28.2, -28.3],
    [28.95, -28.45],
]
const JORDA: LngLat[] = [...CALEDON, ...VESTLINJE];

/** Oranjefristaten, grovt: sletta vest for jorda. */
const FRISTATEN: LngLat[] = [
    [24.4, -26.9],
    [27.4, -26.75],
    [29.05, -27.6],
    [28.95, -28.45],
    ...[...VESTLINJE].reverse(),
    [25.8, -30.6],
    [24.6, -30.2],
];

/** Kappkolonien, grovt: kysten i sør. Klippes mot land. */
const KAPP: LngLat[] = [
    [16.5, -28.6],
    [21.5, -29.2],
    [24.6, -30.2],
    [26.0, -30.6],
    [27.5, -31.4],
    [28.6, -32.4],
    [28.6, -35.5],
    [16, -35.5],
];

/** Plassene der boerne slo seg ned, vest for fjellene. */
const BOERGARDER: LngLat[] = [
    [26.2, -28.6],
    [26.6, -29.1],
    [25.9, -29.4],
    [26.9, -28.3],
    [27.3, -28.75],
    [26.3, -29.9],
    [26.0, -30.0],
    [27.9, -28.4],
];

const ROD = '#b91c1c';
const GULL = '#b45309';
const BOER = '#64748b';
const BASOTHO = '#a16207';

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
function Fakta({ x, y, linjer, bredde = 460, kant = '#0f172a' }: { x: number; y: number; linjer: string[]; bredde?: number; kant?: string }) {
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
    if (modus === 'fodt') return beat === 0 ? VID : NAER;
    if (modus === 'naboer') return beat === 0 || beat === 1 ? MIDT : NAER;
    return NAER;
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    fodt: ['Rundt 1786: Lesotho', 'Lepoqo', 'Et raid etter kveg', 'Moshoeshoe', '1820: høvding'],
    naboer: ['Nybyggere fra sør', '1833: misjonærer', 'Sesotho på skrift', 'Basotho til hest', '1836: boerne kommer', '1848: en britisk grense'],
    fristat: ['Berea-sletta', 'Oranjefristaten', '1858: tre kriger', '1866: fred som koster land', '1867: nesten alt er tatt'],
    avtale: ['1868: Basutoland', 'Krigen stanser', '1869: nye grenser', 'Jorda går tapt', '1870: Moshoeshoe dør'],
};

export function MoshoeshoeKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'fodt';
    const utsnitt = utsnittFor(modus, beat);
    const { geographies } = useFilmVerden(utsnitt === NAER ? NAER : undefined);
    const { sti, kk, kartTransform, skjerm, linje } = useZoom(utsnitt, playing);
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    const tb = skjerm(THABA_BOSIU);
    const bb = skjerm(BUTHA_BUTHE);
    const be = skjerm(BEREA);

    // Hvem eier jorda vest for Caledon-elva, og Oranjefristaten?
    const fristatSynlig = (modus === 'fristat' && beat >= 1) || modus === 'avtale';
    const jordaFarge =
        (modus === 'naboer' && beat >= 5) || (modus === 'fristat' && beat <= 2)
            ? BASOTHO
            : (modus === 'fristat' && beat >= 3) || (modus === 'avtale' && beat >= 3)
              ? BOER
              : null;
    // Lesotho-flata: gull for basotho, grå når boerne har tatt det, rosa når det er britisk.
    const lesothoFarge =
        modus === 'fristat' && beat >= 4
            ? '#cbd5e1'
            : modus === 'avtale'
              ? '#fecaca'
              : modus === 'fodt' || modus === 'naboer' || modus === 'fristat'
                ? '#f2d38a'
                : '#ece3cf';

    return (
        <div className="absolute inset-0 bg-[#a9cbe0] overflow-hidden">
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <clipPath id="moshoeshoe-land">
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
                            fill={String(g.id) === '426' ? lesothoFarge : '#ece3cf'}
                            stroke={String(g.id) === '426' ? '#7c2d12' : '#a8a08a'}
                            strokeWidth={String(g.id) === '426' ? 2.5 : 1.2}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    {modus === 'naboer' && beat === 0 && (
                        <g clipPath="url(#moshoeshoe-land)">
                            <motion.path
                                d={`${linje(KAPP)} Z`}
                                fill={ROD}
                                initial={{ fillOpacity: 0 }}
                                animate={{ fillOpacity: 0.22 }}
                            />
                        </g>
                    )}
                    {fristatSynlig && (
                        <motion.path
                            d={`${linje(FRISTATEN)} Z`}
                            fill={BOER}
                            stroke={BOER}
                            strokeWidth={3 / kk}
                            initial={{ fillOpacity: 0 }}
                            animate={{ fillOpacity: 0.3 }}
                            transition={{ duration: playing ? 1.2 : 0 }}
                        />
                    )}
                    {jordaFarge && (
                        <motion.path
                            d={`${linje(JORDA)} Z`}
                            initial={false}
                            animate={{ fill: jordaFarge, fillOpacity: jordaFarge === BOER ? 0.45 : 0.4 }}
                            stroke={jordaFarge}
                            strokeWidth={3 / kk}
                            transition={{ duration: playing ? 1.2 : 0 }}
                        />
                    )}
                    <path
                        d={linje(CALEDON)}
                        fill="none"
                        stroke={modus === 'naboer' && beat >= 5 ? '#1d4ed8' : '#6b9cc7'}
                        strokeWidth={(modus === 'naboer' && beat >= 5 ? 7 : 4) / kk}
                        strokeLinecap="round"
                    />
                    {((modus === 'naboer' && beat >= 5) || (modus === 'avtale' && beat >= 2)) && (
                        <motion.path
                            d={linje(modus === 'avtale' ? CALEDON : VESTLINJE.map(([x, y]) => [x + 0.35, y - 0.05] as LngLat))}
                            fill="none"
                            stroke={ROD}
                            strokeWidth={6 / kk}
                            strokeDasharray={`${14 / kk} ${10 / kk}`}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 1.6 : 0 }}
                        />
                    )}
                </g>

                {/* Født i fjellandet */}
                {modus === 'fodt' && beat === 0 && (
                    <>
                        <Sted pkt={tb} farge={ROD} r={10} />
                        <Etikett tekst="Lesotho" pkt={tb} dx={30} dy={-20} anker="start" farge="#7c2d12" str={40} />
                        <Etikett tekst="Sør-Afrika" pkt={skjerm([23.5, -30.5])} farge="#475569" str={36} />
                    </>
                )}
                {modus === 'fodt' && beat >= 1 && <Etikett tekst="LESOTHO" pkt={skjerm([28.3, -29.9])} farge="#7c2d12" str={44} />}
                {modus === 'fodt' && beat === 1 && <Fakta x={1080} y={600} linjer={['Lepoqo', 'betyr «ulykker»', 'født i hungersnød']} bredde={460} />}
                {modus === 'fodt' && beat >= 2 && <Sted pkt={bb} />}
                {modus === 'fodt' && beat === 2 && (
                    <>
                        <Pil fra={[bb[0] - 20, bb[1] + 10]} til={[bb[0] - 260, bb[1] + 120]} farge={GULL} bue={-0.25} playing={playing} />
                        <Pil fra={[bb[0] - 250, bb[1] + 150]} til={[bb[0] - 30, bb[1] + 40]} farge={GULL} bue={-0.25} stiplet playing={playing} />
                        <Fakta x={1080} y={600} linjer={['Raid', 'et angrep for', 'å ta kveg']} bredde={420} kant={GULL} />
                    </>
                )}
                {modus === 'fodt' && beat === 3 && (
                    <Fakta x={1020} y={560} linjer={['Moshoeshoe', 'lyden av en kniv', 'som skjærer skjegg']} bredde={500} kant={GULL} />
                )}
                {modus === 'fodt' && beat === 3 && <Fakta x={60} y={620} linjer={['Mohlomi:', 'en leder må være god']} bredde={460} />}
                {modus === 'fodt' && beat >= 4 && (
                    <>
                        <Etikett tekst="Butha-Buthe" pkt={bb} dx={24} dy={10} anker="start" />
                        <Fakta x={1080} y={620} linjer={['1820', 'høvding etter faren']} bredde={440} kant={GULL} />
                    </>
                )}

                {/* Nye naboer */}
                {modus === 'naboer' && beat === 0 && (
                    <>
                        <Etikett tekst="Kappkolonien" pkt={skjerm([22.5, -32.6])} farge={ROD} str={40} />
                        <Pil fra={skjerm([24.2, -31.4])} til={skjerm([26.6, -29.2])} farge={ROD} bue={0.15} playing={playing} />
                        <Sted pkt={tb} farge={GULL} r={10} />
                        <Etikett tekst="Thaba Bosiu" pkt={tb} dx={24} dy={10} anker="start" farge={GULL} />
                        <Fakta x={1080} y={620} linjer={['Nybyggere', 'med gevær og hester']} bredde={460} kant={ROD} />
                    </>
                )}
                {modus === 'naboer' && beat === 1 && (
                    <>
                        <Sted pkt={tb} farge={GULL} r={10} />
                        <Etikett tekst="Thaba Bosiu" pkt={tb} dx={24} dy={10} anker="start" farge={GULL} />
                        <Etikett tekst="fra Paris" pkt={PARIS_PIL} dx={-10} dy={70} anker="end" farge="#334155" />
                        <Pil fra={[PARIS_PIL[0] - 40, PARIS_PIL[1] - 10]} til={[tb[0] + 14, tb[1] - 14]} farge="#334155" bue={0.2} stiplet playing={playing} />
                        <Fakta x={1080} y={600} linjer={['1833', 'tre misjonærer', 'fra Paris']} bredde={420} />
                    </>
                )}
                {modus === 'naboer' && beat >= 2 && <Sted pkt={tb} farge={GULL} r={10} />}
                {modus === 'naboer' && beat >= 2 && beat <= 3 && <Etikett tekst="Thaba Bosiu" pkt={tb} dx={24} dy={10} anker="start" farge={GULL} />}
                {modus === 'naboer' && beat === 2 && <Fakta x={1060} y={600} linjer={['Sesotho', 'får et skriftspråk', 'Casalis gir råd']} bredde={460} />}
                {modus === 'naboer' && beat === 3 && <Fakta x={1060} y={620} linjer={['Gevær og hester', 'tatt fra rytterne']} bredde={480} kant={GULL} />}
                {modus === 'naboer' &&
                    beat >= 4 &&
                    BOERGARDER.map((ll, i) => (
                        <motion.rect
                            key={i}
                            x={skjerm(ll)[0] - 11}
                            y={skjerm(ll)[1] - 11}
                            width={22}
                            height={22}
                            fill={BOER}
                            stroke="#fff"
                            strokeWidth={3}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: beat === 4 && playing ? 0.3 + i * 0.15 : 0 }}
                        />
                    ))}
                {modus === 'naboer' && beat === 4 && (
                    <>
                        <Etikett tekst="Thaba Bosiu" pkt={tb} dx={24} dy={10} anker="start" farge={GULL} />
                        <Etikett tekst="boerne" pkt={skjerm([26.3, -30.25])} farge="#334155" str={40} />
                        <Etikett tekst="fjellene" pkt={skjerm([28.6, -29.6])} farge="#7c2d12" />
                    </>
                )}
                {modus === 'naboer' && beat >= 5 && (
                    <>
                        <Etikett tekst="Caledon" pkt={skjerm([27.15, -29.6])} farge="#1d4ed8" anker="end" />
                        <Etikett tekst="fruktbar jord" pkt={skjerm([27.1, -28.75])} farge="#7c2d12" />
                        <Fakta x={1080} y={620} linjer={['1848', 'britisk grense']} bredde={420} kant={ROD} />
                    </>
                )}

                {/* Oranjefristaten */}
                {modus === 'fristat' && (
                    <>
                        <Sted pkt={tb} farge={GULL} r={beat >= 4 ? 16 : 10} />
                        <Etikett tekst="Thaba Bosiu" pkt={tb} dx={42} dy={10} anker="start" farge={GULL} />
                    </>
                )}
                {modus === 'fristat' && beat === 0 && (
                    <>
                        <Sted pkt={be} farge={ROD} r={9} />
                        <Etikett tekst="Berea" pkt={be} dx={-22} dy={-14} anker="end" farge={ROD} />
                        <Fakta x={1080} y={600} linjer={['Store tap', 'for britene', 'som trekker seg ut']} bredde={440} kant={ROD} />
                    </>
                )}
                {modus === 'fristat' && beat >= 1 && <Etikett tekst="ORANJEFRISTATEN" pkt={skjerm([25.95, -29.75])} farge="#334155" str={34} />}
                {modus === 'fristat' && beat === 2 && (
                    <>
                        <motion.circle
                            cx={tb[0]}
                            cy={tb[1]}
                            r={30}
                            fill="none"
                            stroke={GULL}
                            strokeWidth={6}
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ transformOrigin: `${tb[0]}px ${tb[1]}px` }}
                        />
                        <Fakta x={1080} y={600} linjer={['1858 til 1868', 'tre kriger', 'fjellet holder']} bredde={420} kant={GULL} />
                    </>
                )}
                {modus === 'fristat' && beat === 3 && <Fakta x={1080} y={600} linjer={['11. april 1866', 'fred som', 'koster land']} bredde={440} kant={BOER} />}
                {modus === 'fristat' && beat === 4 && (
                    <>
                        <Pil fra={skjerm([26.95, -30.45])} til={skjerm([28.0, -30.0])} farge={BOER} bue={0.1} playing={playing} />
                        <Pil fra={skjerm([27.9, -28.45])} til={skjerm([28.6, -29.1])} farge={BOER} bue={-0.1} playing={playing} />
                        <Fakta x={1080} y={620} linjer={['Juli 1867', 'bare fjellet står igjen']} bredde={460} kant={BOER} />
                    </>
                )}

                {/* Avtalen */}
                {modus === 'avtale' && <Sted pkt={tb} farge={GULL} r={10} />}
                {modus === 'avtale' && beat <= 1 && <Etikett tekst="BASUTOLAND" pkt={skjerm([28.35, -29.85])} farge={ROD} str={42} />}
                {modus === 'avtale' && beat === 0 && <Fakta x={1080} y={600} linjer={['12. mars 1868', 'britisk', 'beskyttelse']} bredde={420} kant={ROD} />}
                {modus === 'avtale' && beat === 1 && (
                    <>
                        <Etikett tekst="Oranjefristaten" pkt={skjerm([25.95, -29.75])} farge="#334155" />
                        <Fakta x={1080} y={620} linjer={['Krigen stanser', 'unngår trøbbel med britene']} bredde={460} kant={ROD} />
                    </>
                )}
                {modus === 'avtale' && beat === 2 && <Fakta x={1080} y={620} linjer={['1869', 'grensene trekkes på nytt']} bredde={480} kant={ROD} />}
                {modus === 'avtale' && beat === 3 && (
                    <>
                        <Etikett tekst="til boerne for godt" pkt={skjerm([26.55, -29.55])} farge="#334155" />
                        <Etikett tekst="Caledon-elva" pkt={skjerm([27.2, -29.95])} farge="#1d4ed8" anker="start" />
                    </>
                )}
                {modus === 'avtale' && beat >= 4 && (
                    <>
                        <Etikett tekst="Thaba Bosiu" pkt={tb} dx={24} dy={10} anker="start" farge={GULL} />
                        <Fakta x={1080} y={600} linjer={['11. mars 1870', 'gravlagt på', 'toppen av fjellet']} bredde={440} kant={GULL} />
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
                synlig={utsnitt === NAER}
                etikett="Det sørlige Afrika"
            />
        </div>
    );
}
