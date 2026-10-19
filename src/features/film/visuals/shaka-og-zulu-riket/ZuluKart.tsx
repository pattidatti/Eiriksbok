import { motion } from 'framer-motion';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';
import {
    Elv,
    Etikett,
    Fakta,
    Land,
    LandKlipp,
    Overskrift,
    Pil,
    Sted,
} from './kartFelles';
import { frø, useZoom, type LngLat, type Ramme } from './kartVerktoy';

/**
 * Nærkart over landet rundt zuluene (dagens KwaZulu-Natal). «klan»: én liten klan blant
 * mange, og veien til Shaka som barn. «makt»: fra soldat hos Dingiswayo til høvding, og
 * slaget ved Mhlathuze. «riket»: høvdingdømmene som legges under riket, og riket i 1824.
 */

type Modus = 'klan' | 'makt' | 'riket';

const GRUNN: Ramme = [
    [26, -32.5],
    [35, -24.5],
];
const NAER: Ramme = [
    [29.7, -29.75],
    [33.1, -26.55],
];
const VID: Ramme = [
    [25.5, -33],
    [35.5, -24],
];

const ZULU: LngLat = [31.25, -28.3];
const SLEKTA: LngLat = [30.75, -28.85];
const MTHETHWA: LngLat = [31.85, -28.55];
const NDWANDWE: LngLat = [31.55, -27.7];
const MHLATHUZE: LngLat = [31.45, -28.72];
const DUKUZA: LngLat = [31.29, -29.33];

const TUGELA: LngLat[] = [
    [29.4, -28.75],
    [30.0, -28.95],
    [30.6, -28.75],
    [31.0, -28.95],
    [31.25, -29.1],
    [31.43, -29.22],
];
const PONGOLA: LngLat[] = [
    [30.4, -27.4],
    [31.2, -27.45],
    [31.9, -27.35],
    [32.1, -27.0],
    [32.35, -26.8],
];
const MHLATHUZE_ELV: LngLat[] = [
    [30.9, -28.5],
    [31.4, -28.7],
    [31.8, -28.8],
    [32.05, -28.82],
];
const MFOLOZI: LngLat[] = [
    [30.7, -28.15],
    [31.2, -28.3],
    [31.7, -28.3],
    [32.3, -28.4],
];

/** Kystlinja, grovt: lengdegraden der havet begynner, per breddegrad. */
const KYST: [number, number][] = [
    [-26.8, 32.85],
    [-27.5, 32.6],
    [-28.4, 32.4],
    [-28.8, 32.05],
    [-29.25, 31.45],
    [-29.8, 31.05],
    [-30.3, 30.6],
];
function kystVed(lat: number) {
    for (let i = 0; i < KYST.length - 1; i++) {
        const [a, la] = KYST[i];
        const [b, lb] = KYST[i + 1];
        if (lat <= a && lat >= b) return la + ((lat - a) / (b - a)) * (lb - la);
    }
    return 30.3;
}

/** Klanene rundt: faste plasser på land. */
const KLANER: LngLat[] = (() => {
    const ut: LngLat[] = [];
    let i = 0;
    while (ut.length < 26 && i < 400) {
        const lng = 29.95 + frø(i + 3) * 2.7;
        const lat = -27.15 - frø(i + 51) * 2.35;
        i++;
        if (lng > kystVed(lat) - 0.2) continue;
        if (Math.hypot(lng - ZULU[0], lat - ZULU[1]) < 0.22) continue;
        if (ut.some(([a, b]) => Math.hypot(a - lng, b - lat) < 0.3)) continue;
        ut.push([lng, lat]);
    }
    return ut;
})();

/** Over hundre små høvdingdømmer innenfor riket. */
const HOVDINGDOMMER: LngLat[] = (() => {
    const ut: LngLat[] = [];
    let i = 0;
    while (ut.length < 104 && i < 4000) {
        const lng = 30.35 + frø(i + 700) * 2.5;
        const lat = -27.35 - frø(i + 900) * 2.2;
        i++;
        if (lng > kystVed(lat) - 0.08) continue;
        if (ut.some(([a, b]) => Math.hypot(a - lng, b - lat) < 0.13)) continue;
        ut.push([lng, lat]);
    }
    return ut;
})();

/** Riket i 1824, grovt: fra Pongola til forbi Tugela. Klippes mot land. */
const RIKET: LngLat[] = [
    [30.5, -27.4],
    [31.9, -27.3],
    [32.3, -26.85],
    [33.3, -26.9],
    [33.3, -29.4],
    [31.6, -29.75],
    [31.0, -29.6],
    [30.4, -29.1],
    [30.2, -28.3],
];

const GULL = '#b45309';
const ROD = '#b91c1c';

function utsnittFor(modus: Modus, beat: number): Ramme {
    if (modus === 'riket' && beat === 3) return VID;
    return NAER;
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    klan: ['Én klan blant mange', '1709: Zulu-klanen', 'Ca. 1787: Shaka blir født', 'Jaget bort', 'Ca. 1802: hungersnød'],
    makt: ['Soldat hos Dingiswayo', '1816: Shaka tar makta', 'Shaka tar over hæren', '1818: elva Mhlathuze', 'Seier'],
    riket: ['1816 til 1828: Shaka styrer', 'Over hundre høvdingdømmer', '1824: fra Pongola til Tugela', 'Sterkest i det sørlige Afrika', '1828: Shaka blir drept'],
};

export function ZuluKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'klan';
    const { geographies } = useFilmVerden(GRUNN);
    const utsnitt = utsnittFor(modus, beat);
    const { sti, kk, kartTransform, skjerm, linje } = useZoom(GRUNN, utsnitt, playing);
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    const z = skjerm(ZULU);
    const mt = skjerm(MTHETHWA);
    const nd = skjerm(NDWANDWE);
    const sl = skjerm(SLEKTA);
    const mh = skjerm(MHLATHUZE);
    const elver = (
        <>
            <Elv d={linje(TUGELA)} kk={kk} uthevet={modus === 'riket' && beat === 2} />
            <Elv d={linje(PONGOLA)} kk={kk} uthevet={modus === 'riket' && beat === 2} />
            <Elv d={linje(MHLATHUZE_ELV)} kk={kk} uthevet={modus === 'makt' && beat >= 3} />
            <Elv d={linje(MFOLOZI)} kk={kk} />
        </>
    );

    // Hvor store naboene og zuluene er (radius i skjermpiksler).
    const naboer = modus === 'klan' ? beat >= 1 : modus === 'makt';
    const zuluGull = (modus === 'makt' && beat >= 1) || modus === 'riket';
    const mthethwaBorte = modus === 'makt' && beat >= 2;

    return (
        <div className="absolute inset-0 bg-[#a9cbe0] overflow-hidden">
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <LandKlipp id="zulukart-land" geographies={geographies} sti={sti} />
                </defs>
                <g transform={kartTransform}>
                    <Land
                        geographies={geographies}
                        sti={sti}
                        farge={{ '426': '#e4dcc6', '748': '#e4dcc6', '508': '#e7dfca' }}
                    />
                    {modus === 'riket' && beat >= 2 && (
                        <g clipPath="url(#zulukart-land)">
                            <motion.path
                                d={`${linje(RIKET)} Z`}
                                fill={GULL}
                                stroke={GULL}
                                strokeWidth={4 / kk}
                                initial={{ fillOpacity: 0 }}
                                animate={{ fillOpacity: 0.32 }}
                                transition={{ duration: playing ? 1.4 : 0 }}
                            />
                        </g>
                    )}
                    {elver}
                </g>

                {/* Klanene */}
                {modus === 'klan' &&
                    KLANER.map((ll, i) => {
                        const [x, y] = skjerm(ll);
                        return (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={11}
                                fill="#78716c"
                                stroke="#fff"
                                strokeWidth={3}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat >= 2 ? 0.45 : 1 }}
                                transition={{ delay: beat === 0 && playing ? i * 0.05 : 0 }}
                            />
                        );
                    })}
                {modus === 'klan' && beat === 0 && (
                    <Fakta x={1060} y={620} linjer={['Mange klaner', 'som snakket nguni']} bredde={440} />
                )}

                {/* Naboene: Mthethwa og Ndwandwe */}
                {naboer && !mthethwaBorte && (
                    <g>
                        <motion.circle
                            cx={mt[0]}
                            cy={mt[1]}
                            r={modus === 'makt' && beat === 0 ? 120 : 95}
                            fill="#475569"
                            fillOpacity={0.22}
                            stroke="#475569"
                            strokeWidth={4}
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ transformOrigin: `${mt[0]}px ${mt[1]}px` }}
                        />
                        <Etikett tekst="Mthethwa" x={mt[0] + 30} y={mt[1] + 150} farge="#334155" />
                    </g>
                )}
                {naboer && (
                    <g>
                        <motion.circle
                            cx={nd[0]}
                            cy={nd[1]}
                            r={110}
                            fill={ROD}
                            fillOpacity={0.14}
                            stroke={ROD}
                            strokeWidth={4}
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: modus === 'makt' && beat >= 4 ? 0.4 : 1 }}
                            style={{ transformOrigin: `${nd[0]}px ${nd[1]}px` }}
                        />
                        <Etikett tekst="Ndwandwe" x={nd[0] - 125} y={nd[1] + 12} farge={ROD} anker="end" />
                    </g>
                )}

                {/* Mthethwa går inn under Shaka */}
                {mthethwaBorte && (
                    <motion.circle
                        cx={mt[0]}
                        cy={mt[1]}
                        r={95}
                        fill={GULL}
                        fillOpacity={0.18}
                        stroke={GULL}
                        strokeWidth={4}
                        strokeDasharray="12 10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                )}
                {modus === 'makt' && beat === 2 && (
                    <>
                        <Pil fra={[nd[0] + 20, nd[1] + 60]} til={[mt[0] + 10, mt[1] - 70]} farge={ROD} bue={-0.25} playing={playing} />
                        <Pil fra={[mt[0] - 70, mt[1] - 10]} til={[z[0] + 40, z[1] + 20]} farge={GULL} bue={0.25} forsinkelse={1.6} playing={playing} />
                        <Fakta x={1080} y={600} linjer={['Zwide dreper', 'Dingiswayo', 'Shaka får hæren']} bredde={470} kant={GULL} />
                    </>
                )}

                {/* Zulu-klanen */}
                {(modus !== 'riket' || beat <= 1) && (
                    <g>
                        <motion.circle
                            cx={z[0]}
                            cy={z[1]}
                            animate={{ r: zuluGull ? 62 : modus === 'klan' && beat >= 1 ? 30 : 13 }}
                            initial={false}
                            fill={zuluGull ? GULL : '#0f172a'}
                            fillOpacity={zuluGull ? 0.3 : 0.9}
                            stroke={zuluGull ? GULL : '#fff'}
                            strokeWidth={4}
                        />
                        <Etikett tekst={zuluGull ? 'Zuluene under Shaka' : 'Zulu'} x={z[0] - (zuluGull ? 80 : 40)} y={z[1] - (zuluGull ? 78 : 44)} anker="end" />
                    </g>
                )}

                {/* Barndommen */}
                {modus === 'klan' && beat === 2 && (
                    <Fakta x={1040} y={560} linjer={['Far: Senzangakhona', 'høvding for zuluene', 'Mor: Nandi']} bredde={480} />
                )}
                {modus === 'klan' && beat >= 3 && (
                    <>
                        <Pil fra={[z[0] - 10, z[1] + 20]} til={[sl[0] + 14, sl[1] - 14]} farge="#7c2d12" stiplet bredde={7} playing={playing} />
                        <Sted pkt={sl} navn="slekta til Nandi" farge="#7c2d12" anker="end" dx={-24} dy={48} />
                    </>
                )}
                {modus === 'klan' && beat === 3 && <Fakta x={1040} y={600} linjer={['Mobbet:', 'en gutt uten far']} bredde={440} kant="#7c2d12" />}
                {modus === 'klan' && beat >= 4 && (
                    <>
                        <Pil fra={[sl[0] + 20, sl[1]]} til={[mt[0] - 30, mt[1] + 20]} farge="#7c2d12" stiplet bredde={7} bue={0.3} playing={playing} />
                        <Etikett tekst="Dingiswayo" x={mt[0] + 30} y={mt[1] + 40} farge="#334155" anker="start" />
                    </>
                )}
                {modus === 'klan' && beat >= 3 && (
                    <MorOgSonn pkt={beat >= 4 ? [mt[0] - 20, mt[1] + 10] : sl} />
                )}

                {/* Shaka som soldat og høvding */}
                {modus === 'makt' && beat === 0 && (
                    <>
                        <Shaka pkt={[mt[0] - 10, mt[1]]} />
                        <Etikett tekst="Dingiswayo" x={mt[0] + 30} y={mt[1] - 135} farge="#334155" anker="start" />
                    </>
                )}
                {modus === 'makt' && beat === 1 && (
                    <>
                        <Pil fra={[mt[0] - 60, mt[1] - 10]} til={[z[0] + 30, z[1] + 10]} farge={GULL} bue={0.2} playing={playing} />
                        <Fakta x={1060} y={600} linjer={['1816', 'Sigujana drept', 'Shaka blir høvding']} bredde={440} kant={GULL} />
                    </>
                )}
                {modus === 'makt' && beat >= 1 && <Shaka pkt={beat >= 3 ? [mh[0] - (beat === 3 ? 150 : 30), mh[1] + (beat === 3 ? 60 : 0)] : z} />}
                {modus === 'makt' && beat >= 3 && (
                    <>
                        <Etikett tekst="Mhlathuze" x={skjerm([32.0, -28.95])[0]} y={skjerm([32.0, -28.95])[1]} farge="#1d4ed8" />
                        <Pil
                            fra={[nd[0], nd[1] + 90]}
                            til={beat === 3 ? [mh[0] - 110, mh[1] + 40] : [mh[0] + 20, mh[1] - 50]}
                            farge={ROD}
                            bue={0.15}
                            bredde={beat >= 4 ? 6 : 9}
                            playing={playing}
                        />
                    </>
                )}
                {modus === 'makt' && beat === 3 && (
                    <Pil fra={[mh[0] + 10, mh[1] - 20]} til={[mh[0] - 150, mh[1] + 50]} farge={GULL} stiplet bredde={7} playing={playing} />
                )}
                {modus === 'makt' && beat === 3 && <Fakta x={1060} y={620} linjer={['Shaka later som', 'han trekker seg']} bredde={460} kant={GULL} />}
                {modus === 'makt' && beat >= 4 && (
                    <>
                        <Pil fra={[mh[0] - 120, mh[1] + 50]} til={[mh[0] + 30, mh[1] - 40]} farge={GULL} bredde={12} bue={-0.2} playing={playing} />
                        <Fakta x={1060} y={620} linjer={['1818', 'Ndwandwe slått']} bredde={420} kant={GULL} />
                    </>
                )}

                {/* Riket */}
                {modus === 'riket' && beat === 0 && <Fakta x={1060} y={620} linjer={['Shaka styrer', '1816 til 1828']} bredde={440} kant={GULL} />}
                {modus === 'riket' &&
                    beat >= 1 &&
                    beat !== 3 &&
                    HOVDINGDOMMER.map((ll, i) => {
                        const [x, y] = skjerm(ll);
                        return (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={7}
                                stroke="#fff"
                                strokeWidth={2}
                                initial={{ fill: '#78716c' }}
                                animate={{ fill: GULL }}
                                transition={{ delay: beat === 1 && playing ? 0.5 + i * 0.035 : 0, duration: 0.3 }}
                            />
                        );
                    })}
                {modus === 'riket' && beat === 2 && (
                    <>
                        <Etikett tekst="Pongola" x={skjerm([31.5, -27.15])[0]} y={skjerm([31.5, -27.15])[1]} farge="#1d4ed8" />
                        <Etikett tekst="Tugela" x={skjerm([30.0, -29.12])[0]} y={skjerm([30.0, -29.12])[1]} farge="#1d4ed8" />
                    </>
                )}
                {modus === 'riket' && beat === 3 && (
                    <>
                        <Etikett tekst="ZULU-RIKET" x={skjerm([31.0, -28.35])[0]} y={skjerm([31.0, -28.35])[1]} farge="#7c2d12" str={42} />
                    </>
                )}
                {modus === 'riket' && beat === 4 && (
                    <>
                        <Sted pkt={skjerm(DUKUZA)} navn="Dukuza" farge="#0f172a" anker="end" dx={-24} dy={12} />
                        <Fakta x={1060} y={620} linjer={['1828', 'riket overlever']} bredde={420} kant={GULL} />
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

/** Nandi og Shaka: to prikker, en stor og en liten. */
function MorOgSonn({ pkt }: { pkt: [number, number] }) {
    return (
        <motion.g initial={false} animate={{ x: pkt[0], y: pkt[1] }} transition={{ duration: 1.6, ease: 'easeInOut' }}>
            <circle cx={-10} cy={0} r={12} fill="#7c2d12" stroke="#fff" strokeWidth={3} />
            <circle cx={10} cy={4} r={8} fill="#f59e0b" stroke="#fff" strokeWidth={3} />
        </motion.g>
    );
}

/** Shaka: gull prikk med navn. */
function Shaka({ pkt }: { pkt: [number, number] }) {
    return (
        <motion.g initial={false} animate={{ x: pkt[0], y: pkt[1] }} transition={{ duration: 1.6, ease: 'easeInOut' }}>
            <circle r={16} fill="#f59e0b" stroke="#fff" strokeWidth={4} />
            <text
                x={0}
                y={52}
                textAnchor="middle"
                fontSize={32}
                fontWeight={900}
                fill="#7c2d12"
                stroke="#fff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                Shaka
            </text>
        </motion.g>
    );
}

