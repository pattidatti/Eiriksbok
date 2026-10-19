import { motion } from 'framer-motion';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Elv, Etikett, Fakta, Land, LandKlipp, Overskrift, Pil, Sted } from './kartFelles';
import { useZoom, type LngLat, type Ramme } from './kartVerktoy';

/**
 * Vidt kart over det sørlige Afrika. «mfecane»: flukten og de nye rikene. «arsaker»: det
 * Cobbing pekte på, og tingene historikerne peker på i dag. «krig»: koloniene, kravet fra
 * 1878 og britene inn i Zululand. «idag»: KwaZulu, KwaZulu-Natal og zuluene i dag.
 * Grensene er tegnet grovt for å vise hvor, ikke nøyaktig hvor langt.
 */

type Modus = 'mfecane' | 'arsaker' | 'krig' | 'idag';

const GRUNN: Ramme = [
    [12, -36],
    [42, -14],
];

const ZULU: LngLat = [31.3, -28.3];
const BULAWAYO: LngLat = [28.6, -20.15];
const THABA_BOSIU: LngLat = [27.68, -29.36];
const GAZA: LngLat = [33.0, -23.6];
const DELAGOA: LngLat = [32.75, -25.95];
const KAPPBYEN: LngLat = [18.42, -33.92];
const ISANDLWANA: LngLat = [30.65, -28.36];

const TUGELA: LngLat[] = [
    [29.4, -28.75],
    [30.0, -28.95],
    [30.6, -28.75],
    [31.0, -28.95],
    [31.25, -29.1],
    [31.43, -29.22],
];

const KAPP: LngLat[] = [
    [15, -28.6],
    [20, -28.6],
    [22, -28.4],
    [24.5, -28.6],
    [25.6, -29.8],
    [27.4, -30.6],
    [28.5, -31.4],
    [30.0, -31.2],
    [31.5, -33],
    [25, -36],
    [15, -36],
];
const NATAL: LngLat[] = [
    ...TUGELA,
    [32.5, -29.5],
    [30.5, -31.3],
    [30.0, -31.2],
    [29.2, -30.3],
    [28.9, -29.4],
];
const ZULULAND: LngLat[] = [
    ...TUGELA,
    [33, -29],
    [33, -26.9],
    [31.9, -27.3],
    [30.8, -27.4],
    [30.2, -27.6],
    [29.8, -28.1],
];
const TRANSVAAL: LngLat[] = [
    [25.6, -22.6],
    [31.3, -22.4],
    [31.95, -24.5],
    [31.95, -25.9],
    [31.0, -27.3],
    [29.8, -27.5],
    [28.0, -27.0],
    [26.0, -26.8],
    [25.0, -25.7],
];
const ORANJE: LngLat[] = [
    [24.5, -28.7],
    [26.0, -26.8],
    [28.0, -27.0],
    [29.4, -27.5],
    [29.4, -28.7],
    [28.9, -29.4],
    [27.4, -30.6],
    [25.6, -29.8],
];
const KZN: LngLat[] = [
    [33.5, -26.86],
    [32.1, -26.85],
    [31.95, -27.3],
    [31.1, -27.3],
    [30.2, -27.4],
    [29.6, -27.2],
    [29.4, -27.5],
    [29.0, -28.1],
    [29.4, -28.7],
    [29.1, -29.4],
    [29.3, -30.0],
    [29.9, -30.6],
    [30.1, -31.1],
    [31, -31.3],
    [33.5, -29],
];

/** Flukt og krig over hele området, ikke bare fra zuluene. Alle pilene går over land. */
const FLUKT: { fra: LngLat; til: LngLat }[] = [
    { fra: [31.0, -28.0], til: [29.2, -26.6] },
    { fra: [30.6, -28.6], til: [28.6, -29.6] },
    { fra: [31.2, -27.6], til: [30.6, -25.6] },
    { fra: [32.4, -26.3], til: [31.0, -24.6] },
    { fra: [32.2, -26.6], til: [30.2, -27.0] },
    { fra: [28.8, -27.4], til: [26.8, -26.2] },
    { fra: [28.4, -28.4], til: [26.6, -29.6] },
    { fra: [29.6, -30.4], til: [28.2, -31.6] },
    { fra: [27.6, -31.2], til: [26.4, -30.0] },
    { fra: [27.0, -27.6], til: [25.2, -27.0] },
    { fra: [30.2, -26.2], til: [28.6, -24.8] },
];

const ROD = '#b91c1c';
const GULL = '#b45309';
const ORANSJE = '#c2410c';
const TEAL = '#0f766e';

const BRED: Ramme = [
    [15, -35.5],
    [37, -21.5],
];

function utsnittFor(modus: Modus, beat: number): Ramme {
    if (modus === 'mfecane')
        return beat <= 1
            ? [
                  [24.5, -32],
                  [35.5, -24.5],
              ]
            : [
                  [20, -31.5],
                  [38, -16],
              ];
    if (modus === 'krig' && beat >= 4)
        return [
            [28.4, -30.4],
            [33.2, -26.8],
        ];
    if (modus === 'idag')
        return [
            [25, -32.5],
            [35, -25],
        ];
    return BRED;
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    mfecane: ['Krig og flukt', 'Mfecane: ca. 1815 til 1840', 'Mzilikazi: Ndebele-riket', 'Moshoeshoe: Lesotho', 'Soshangane: Gaza-riket'],
    arsaker: ['Delagoa-bukta', 'Kappkolonien', 'Gikk Cobbing for langt?', 'Tørke og mais', 'Elfenben, beite og slaver', 'Hva veide tyngst?'],
    krig: ['Britene vil ha én stat', 'Zulu-riket står i veien', 'Falske rapporter', '11. desember 1878', '11. januar 1879'],
    idag: ['Folket ble værende', 'Apartheid: KwaZulu', '1994: KwaZulu-Natal', 'Zuluene i dag'],
};

export function ZuluRegion({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'mfecane';
    const { geographies } = useFilmVerden(GRUNN);
    const utsnitt = utsnittFor(modus, beat);
    const { sti, kk, kartTransform, skjerm, linje } = useZoom(GRUNN, utsnitt, playing);
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    const farge: Record<string, string> = {};
    if (modus === 'mfecane' && beat >= 2) farge['716'] = '#f3d9a8';
    if (modus === 'mfecane' && beat >= 3) farge['426'] = '#f3d9a8';
    if (modus === 'mfecane' && beat >= 4) farge['508'] = '#f3e4c4';
    if (modus === 'idag' && beat >= 3) farge['710'] = '#d6ece7';

    const flate = (pts: LngLat[], f: string, op: number, stiplet = false) => (
        <motion.path
            d={`${linje(pts)} Z`}
            fill={f}
            stroke={f}
            strokeWidth={3 / kk}
            strokeDasharray={stiplet ? `${10 / kk} ${8 / kk}` : undefined}
            initial={{ fillOpacity: 0 }}
            animate={{ fillOpacity: op }}
            transition={{ duration: playing ? 1.2 : 0 }}
        />
    );

    const z = skjerm(ZULU);
    const dg = skjerm(DELAGOA);
    const kp = skjerm(KAPPBYEN);
    const p = (ll: LngLat) => skjerm(ll);

    return (
        <div className="absolute inset-0 bg-[#a9cbe0] overflow-hidden">
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <LandKlipp id="zuluregion-land" geographies={geographies} sti={sti} />
                    <pattern id="zuluregion-skravur" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <rect width={14} height={14} fill="#b45309" fillOpacity={0.12} />
                        <line x1={0} y1={0} x2={0} y2={14} stroke="#b45309" strokeWidth={5} />
                    </pattern>
                    <radialGradient id="zuluregion-torke">
                        <stop offset="0%" stopColor="#ea580c" stopOpacity={0.5} />
                        <stop offset="70%" stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </radialGradient>
                </defs>
                <g transform={kartTransform}>
                    <Land geographies={geographies} sti={sti} farge={farge} />
                    <g clipPath="url(#zuluregion-land)">
                        {modus === 'arsaker' && beat >= 1 && beat <= 4 && flate(KAPP, ROD, beat >= 2 ? 0.1 : 0.25)}
                        {modus === 'krig' && beat <= 3 && (
                            <>
                                {flate(KAPP, ROD, 0.25)}
                                {flate(NATAL, ROD, 0.25)}
                                {flate(TRANSVAAL, ORANSJE, 0.22)}
                                {flate(ORANJE, ORANSJE, 0.22)}
                            </>
                        )}
                        {modus === 'krig' && beat >= 1 && flate(ZULULAND, GULL, 0.4)}
                        {modus === 'krig' && beat >= 4 && flate(NATAL, ROD, 0.25)}
                        {modus === 'idag' && beat === 0 && flate(ZULULAND, '#78716c', 0.25, true)}
                        {modus === 'idag' && beat === 1 && (
                            <motion.path d={`${linje(ZULULAND)} Z`} fill="url(#zuluregion-skravur)" stroke={GULL} strokeWidth={3 / kk} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
                        )}
                        {modus === 'idag' && beat >= 2 && flate(KZN, TEAL, 0.35)}
                    </g>
                    {(modus === 'krig' || modus === 'idag') && <Elv d={linje(TUGELA)} kk={kk} uthevet={modus === 'krig' && beat >= 4} />}
                </g>

                {/* Tørke: varm flekk over hele området */}
                {modus === 'arsaker' && beat >= 3 && beat <= 4 && (
                    <motion.ellipse cx={z[0] - 160} cy={z[1] - 20} rx={420} ry={300} fill="url(#zuluregion-torke)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} />
                )}

                {/* Mfecane */}
                {modus === 'mfecane' &&
                    beat <= 1 &&
                    FLUKT.map((f, i) => (
                        <Pil key={i} fra={p(f.fra)} til={p(f.til)} farge="#7c2d12" bredde={6} bue={0.1} forsinkelse={i * 0.12} playing={playing} />
                    ))}
                {modus === 'mfecane' && beat <= 1 && <Sted pkt={z} navn="Zulu-riket" farge={GULL} r={16} />}
                {modus === 'mfecane' && beat === 1 && <Fakta x={1050} y={620} linjer={['mfecane =', 'knusingen, spredningen']} bredde={490} kant="#7c2d12" />}
                {modus === 'mfecane' && beat >= 2 && <Sted pkt={z} farge={GULL} r={14} />}
                {modus === 'mfecane' && beat >= 2 && (
                    <>
                        <Pil fra={[z[0] - 10, z[1] - 20]} til={p(BULAWAYO)} farge="#7c2d12" bue={-0.15} playing={playing && beat === 2} />
                        <Sted pkt={p(BULAWAYO)} navn="Ndebele-riket" farge="#7c2d12" anker="end" dx={-24} />
                    </>
                )}
                {modus === 'mfecane' && beat >= 3 && (
                    <>
                        <Pil fra={[z[0] - 20, z[1] + 6]} til={p(THABA_BOSIU)} farge="#1e3a8a" bredde={7} bue={0.1} playing={playing && beat === 3} />
                        <Sted pkt={p(THABA_BOSIU)} navn="Thaba Bosiu, 1824" farge="#1e3a8a" anker="end" dx={-24} dy={50} />
                    </>
                )}
                {modus === 'mfecane' && beat >= 4 && (
                    <>
                        <Pil fra={[z[0] + 10, z[1] - 20]} til={p(GAZA)} farge="#065f46" bue={0.15} playing={playing && beat === 4} />
                        <Sted pkt={p(GAZA)} navn="Gaza-riket" farge="#065f46" />
                    </>
                )}
                {modus === 'mfecane' && beat >= 2 && (
                    <>
                        <Etikett tekst="Zimbabwe" x={p([31.4, -20.6])[0]} y={p([31.4, -20.6])[1]} farge="#44403c" str={36} />
                        {beat >= 3 && <Etikett tekst="Lesotho" x={p([28.3, -30.0])[0]} y={p([28.3, -30.0])[1] + 40} farge="#44403c" str={36} />}
                        {beat >= 4 && <Etikett tekst="Mosambik" x={p([34.6, -21.2])[0]} y={p([34.6, -21.2])[1]} farge="#44403c" str={36} />}
                    </>
                )}

                {/* Årsakene */}
                {modus === 'arsaker' && beat <= 4 && (
                    <g opacity={beat === 2 || beat === 3 ? 0.4 : 1}>
                        <Sted pkt={dg} navn="Delagoa-bukta" farge={ROD} anker="start" dx={26} dy={-18} />
                        <Skip x={dg[0] + 70} y={dg[1] + 50} />
                    </g>
                )}
                {modus === 'arsaker' && beat === 0 && <Fakta x={1050} y={620} linjer={['Portugisiske', 'slavehandlere']} bredde={440} kant={ROD} />}
                {modus === 'arsaker' && beat >= 1 && beat <= 4 && (
                    <g opacity={beat >= 2 ? 0.35 : 1}>
                        <Etikett tekst="Kappkolonien" x={p([21.5, -31.6])[0]} y={p([21.5, -31.6])[1]} farge={ROD} />
                        <Sted pkt={kp} farge={ROD} />
                    </g>
                )}
                {modus === 'arsaker' && beat === 1 && (
                    <>
                        <Pil fra={[dg[0] - 20, dg[1] + 10]} til={p([29.5, -26.5])} farge={ROD} bredde={7} playing={playing} />
                        <Pil fra={p([26.5, -31.5])} til={p([28.5, -29.6])} farge={ROD} bredde={7} forsinkelse={0.6} playing={playing} />
                        <Fakta x={1050} y={620} linjer={['Begge jaktet', 'på arbeidsfolk']} bredde={440} kant={ROD} />
                    </>
                )}
                {modus === 'arsaker' && beat === 2 && <Fakta x={1000} y={600} linjer={['Ikke én forklaring,', 'men flere ting', 'som virket sammen']} bredde={520} />}
                {modus === 'arsaker' && beat === 3 && (
                    <>
                        <Sol x={z[0] - 180} y={z[1] - 170} />
                        {[
                            [-300, 60],
                            [-120, 120],
                            [-420, -40],
                            [40, 40],
                        ].map(([dx, dy], i) => (
                            <Mais key={i} x={z[0] + dx} y={z[1] + dy} />
                        ))}
                        <Fakta x={1050} y={580} linjer={['Tørke', 'særlig 1809 til 1823', 'mais trenger mer vann']} bredde={480} kant={ORANSJE} />
                    </>
                )}
                {modus === 'arsaker' && beat === 4 && (
                    <>
                        <Kveg x={z[0] - 260} y={z[1] + 40} />
                        <Elfenben x={z[0] - 90} y={z[1] - 150} />
                        <Fakta x={1050} y={600} linjer={['over 1000 i året', 'fra Delagoa-bukta', 'slutten av 1820-årene']} bredde={480} kant={ROD} />
                    </>
                )}
                {modus === 'arsaker' && beat === 5 && <Vekt />}

                {/* Krigen i 1879 */}
                {modus === 'krig' && beat <= 3 && (
                    <>
                        <Etikett tekst="britisk" x={p([21.5, -31.6])[0]} y={p([21.5, -31.6])[1]} farge={ROD} />
                        {beat !== 3 && <Etikett tekst="britisk" x={p([29.4, -30.4])[0]} y={p([29.4, -30.4])[1]} farge={ROD} str={28} />}
                        <Etikett tekst="boer" x={p([28.3, -24.6])[0]} y={p([28.3, -24.6])[1]} farge={ORANSJE} />
                        <Etikett tekst="boer" x={p([26.6, -28.4])[0]} y={p([26.6, -28.4])[1]} farge={ORANSJE} />
                    </>
                )}
                {modus === 'krig' && beat === 0 && <Fakta x={1050} y={620} linjer={['Én stat?', 'kolonier + boer-republikker']} bredde={500} />}
                {modus === 'krig' && beat >= 1 && beat <= 3 && <Etikett tekst="Zulu-riket" x={p([31.6, -28.0])[0] + 70} y={p([31.6, -28.0])[1]} farge="#7c2d12" anker="start" />}
                {modus === 'krig' && beat === 1 && <Fakta x={1050} y={620} linjer={['Boerne:', 'hvite nybyggere']} bredde={440} kant={ORANSJE} />}
                {modus === 'krig' && beat === 2 && (
                    <>
                        <Pil fra={[kp[0] + 10, kp[1] - 20]} til={[kp[0] - 40, 90]} farge="#0f172a" bredde={7} bue={-0.2} playing={playing} />
                        <Etikett tekst="til London" x={kp[0] + 40} y={170} anker="start" />
                        <Fakta x={1050} y={600} linjer={['Bartle Frere:', 'Cetshwayo', 'er en tyrann']} bredde={440} />
                    </>
                )}
                {modus === 'krig' && beat === 3 && <Krav />}
                {modus === 'krig' && beat >= 4 && (
                    <>
                        {[
                            [29.9, -29.6, 30.3, -28.5],
                            [30.7, -29.5, 30.8, -28.5],
                            [31.4, -29.6, 31.6, -28.6],
                        ].map(([a, b, c, d], i) => (
                            <Pil key={i} fra={p([a, b])} til={p([c, d])} farge={ROD} forsinkelse={i * 0.4} playing={playing} />
                        ))}
                        <Sted pkt={p(ISANDLWANA)} navn="Isandlwana" farge="#0f172a" anker="end" dx={-24} dy={-14} />
                        <Etikett tekst="Natal" x={p([30.3, -29.9])[0]} y={p([30.3, -29.9])[1]} farge={ROD} />
                        <Etikett tekst="Zululand" x={p([31.6, -27.9])[0]} y={p([31.6, -27.9])[1]} farge="#7c2d12" />
                        <Etikett tekst="Tugela" x={p([30.0, -29.12])[0] - 30} y={p([30.0, -29.12])[1] + 34} farge="#1d4ed8" str={28} />
                    </>
                )}

                {/* I dag */}
                {modus === 'idag' && beat === 0 && <Etikett tekst="Zulu-riket" x={p([31.4, -28.1])[0]} y={p([31.4, -28.1])[1]} farge="#57534e" />}
                {modus === 'idag' && beat === 1 && (
                    <>
                        <Etikett tekst="KwaZulu" x={p([31.4, -28.1])[0]} y={p([31.4, -28.1])[1]} farge={GULL} str={40} />
                        <Fakta x={1050} y={620} linjer={['Apartheid:', 'skilt etter hudfarge']} bredde={460} kant={GULL} />
                    </>
                )}
                {modus === 'idag' && beat >= 2 && (
                    <Etikett tekst="KwaZulu-Natal" x={p([30.6, -28.9])[0]} y={p([30.6, -28.9])[1]} farge={TEAL} str={40} />
                )}
                {modus === 'idag' && beat === 3 && (
                    <>
                        <Etikett tekst="Sør-Afrika" x={p([24.5, -29.5])[0]} y={p([24.5, -29.5])[1]} farge="#57534e" str={40} />
                        <Fakta x={1020} y={620} linjer={['over 14 millioner', 'zuluer i dag']} bredde={480} kant={TEAL} />
                    </>
                )}
            </svg>
            <Overskrift tekst={overskrift} />
        </div>
    );
}

function Skip({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -30 0 L 30 0 L 22 14 L -22 14 Z" fill="#5b3a1e" stroke="#fff" strokeWidth={3} />
            <line x1={0} y1={0} x2={0} y2={-38} stroke="#3f2a16" strokeWidth={4} />
            <path d="M 2 -36 L 24 -10 L 2 -10 Z" fill="#f3ead6" stroke="#5b3a1e" strokeWidth={2} />
        </g>
    );
}

function Sol({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            {Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <line key={i} x1={x + Math.cos(a) * 46} y1={y + Math.sin(a) * 46} x2={x + Math.cos(a) * 70} y2={y + Math.sin(a) * 70} stroke="#ea580c" strokeWidth={8} strokeLinecap="round" />;
            })}
            <circle cx={x} cy={y} r={38} fill="#f59e0b" stroke="#fff" strokeWidth={4} />
        </motion.g>
    );
}

function Mais({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} transform={`translate(${x} ${y})`}>
            <path d="M 0 30 L 0 -6" stroke="#4d7c0f" strokeWidth={5} />
            <path d="M 0 18 Q -18 6 -22 -6 Q -6 4 0 10" fill="#65a30d" />
            <ellipse cx={4} cy={-14} rx={8} ry={18} fill="#eab308" stroke="#a16207" strokeWidth={2} />
        </motion.g>
    );
}

function Kveg({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transform={`translate(${x} ${y})`}>
            <rect x={-30} y={-14} width={56} height={26} rx={10} fill="#7c4a24" stroke="#fff" strokeWidth={3} />
            <rect x={22} y={-24} width={20} height={18} rx={5} fill="#7c4a24" stroke="#fff" strokeWidth={3} />
            <path d="M 24 -24 L 18 -34 M 40 -24 L 46 -34" stroke="#f3ead6" strokeWidth={4} strokeLinecap="round" />
            {[-22, -8, 6, 18].map((lx) => (
                <line key={lx} x1={lx} y1={12} x2={lx} y2={28} stroke="#7c4a24" strokeWidth={5} />
            ))}
            <text x={0} y={64} textAnchor="middle" fontSize={28} fontWeight={800} fill="#0f172a" stroke="#fff" strokeWidth={6} paintOrder="stroke">
                beite
            </text>
        </motion.g>
    );
}

function Elfenben({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} transform={`translate(${x} ${y})`}>
            <path d="M -34 10 Q -10 -30 34 -26 Q 0 -14 -26 18 Z" fill="#fef3c7" stroke="#a16207" strokeWidth={3} />
            <text x={0} y={56} textAnchor="middle" fontSize={28} fontWeight={800} fill="#0f172a" stroke="#fff" strokeWidth={6} paintOrder="stroke">
                elfenben
            </text>
        </motion.g>
    );
}

/** Kravet fra desember 1878, ett punkt om gangen. */
function Krav() {
    const punkter = ['Legg ned hæren', '500 kveg i bot', 'Slipp inn misjonærer', 'Svar innen 30 dager'];
    return (
        <motion.g initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <rect x={1020} y={300} width={520} height={90 + punkter.length * 70} rx={22} fill="#fffbeb" stroke={ROD} strokeWidth={5} />
            <text x={1280} y={362} textAnchor="middle" fontSize={40} fontWeight={900} fill={ROD}>
                Britenes krav
            </text>
            {punkter.map((t, i) => (
                <motion.text
                    key={t}
                    x={1060}
                    y={440 + i * 70}
                    fontSize={36}
                    fontWeight={800}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.5 }}
                >
                    {i + 1}. {t}
                </motion.text>
            ))}
        </motion.g>
    );
}

/** Alle årsakene, og spørsmålet om hva som veide tyngst. */
function Vekt() {
    const ting = ['Slavehandel', 'Tørke', 'Mais', 'Elfenben', 'Beite'];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x={1000} y={170} width={540} height={80 + ting.length * 94} rx={26} fill="#ffffff" fillOpacity={0.95} stroke="#0f172a" strokeWidth={3} />
            {ting.map((t, i) => (
                <motion.g key={t} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25 }}>
                    <rect x={1040} y={210 + i * 94} width={460} height={72} rx={16} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
                    <text x={1270} y={258 + i * 94} textAnchor="middle" fontSize={32} fontWeight={800} fill="#0f172a">
                        {t}
                    </text>
                    <text x={1470} y={258 + i * 94} textAnchor="middle" fontSize={36} fontWeight={900} fill="#64748b">
                        ?
                    </text>
                </motion.g>
            ))}
        </motion.g>
    );
}
