import { motion } from 'framer-motion';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';
import {
    Etikett,
    Fakta,
    Land,
    LandKlipp,
    Overskrift,
    Pil,
    Sted,
} from './kartdeler';
import { useZoom, type LngLat, type Ramme } from './kartZoom';

/**
 * Kart over det sørlige Afrika rundt 1900. «republikker»: boernes to republikker og de
 * britiske koloniene rundt. «gull»: gullet i Transvaal, innflytterne og Jameson-raidet.
 * «beleiring»: boerne går inn i Kapp og Natal, de tre beleirede byene og den svarte uka.
 * «motangrep»: britenes overmakt, byene som befris, og hovedstedene som faller.
 *
 * Grensene til republikkene er tegnet grovt etter elvene Vaal, Oranje og Limpopo.
 */

type Modus = 'republikker' | 'gull' | 'beleiring' | 'motangrep';

const GRUNN: Ramme = [
    [15.5, -35.5],
    [34, -21],
];
const VID: Ramme = [
    [16, -35],
    [33.5, -21.5],
];
const NORD: Ramme = [
    [23.2, -29],
    [32.8, -22.6],
];
const MIDT: Ramme = [
    [19.8, -32.9],
    [33.2, -22.9],
];

const TRANSVAAL: LngLat[] = [
    [26.0, -25.5],
    [26.3, -24.4],
    [27.0, -23.6],
    [28.3, -22.6],
    [29.4, -22.1],
    [31.3, -22.4],
    [31.9, -24.3],
    [31.95, -25.7],
    [31.0, -25.95],
    [30.8, -27.2],
    [30.0, -27.5],
    [29.4, -27.05],
    [28.4, -26.8],
    [27.3, -26.9],
    [26.4, -27.3],
    [26.0, -26.9],
    [26.0, -26.2],
];
const ORANJE: LngLat[] = [
    [24.4, -29.0],
    [24.9, -28.2],
    [25.5, -27.4],
    [26.4, -27.3],
    [27.3, -26.9],
    [28.4, -26.8],
    [29.4, -27.05],
    [29.3, -28.0],
    [28.9, -28.75],
    [27.9, -29.3],
    [27.2, -30.0],
    [26.7, -30.6],
    [25.7, -30.6],
    [25.0, -29.9],
];

const GULL: LngLat = [28.05, -26.2];
const PRETORIA: LngLat = [28.19, -25.75];
const BLOEMFONTEIN: LngLat = [26.21, -29.12];
const KIMBERLEY: LngLat = [24.76, -28.74];
const LADYSMITH: LngLat = [29.78, -28.56];
const MAFEKING: LngLat = [25.64, -25.86];
const STORMBERG: LngLat = [26.5, -31.3];
const MAGERSFONTEIN: LngLat = [24.6, -29.05];
const COLENSO: LngLat = [29.82, -28.74];

/** Innflyttere på vei mot gullet, fra kysten i sør. */
const INNFLYTTERE: LngLat[] = Array.from({ length: 22 }, (_, i) => {
    const t = (i % 11) / 10;
    const fraKapp = i < 11;
    const start: LngLat = fraKapp ? [24.5, -28.6] : [30.6, -28.6];
    const lng = start[0] + (GULL[0] - start[0]) * t + Math.sin(i * 1.7) * 0.25;
    const lat = start[1] + (GULL[1] - start[1]) * t + Math.cos(i * 2.3) * 0.15;
    return [lng, lat];
});

const BOER = '#c2410c';
const ORANJEFARGE = '#a16207';
const BRITISK = '#be123c';
const GULLFARGE = '#eab308';
const GRONN = '#15803d';

function utsnittFor(modus: Modus, beat: number): Ramme {
    if (modus === 'republikker') return VID;
    if (modus === 'gull') return beat >= 5 ? VID : NORD;
    return MIDT;
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    republikker: [
        'Boerne: nybyggere fra Europa',
        'To boerrepublikker',
        'Britiske kolonier rundt',
        'Verdens største imperium',
    ],
    gull: [
        '1886: gull i Transvaal',
        'Uitlanders: utlendinger',
        'Hvem skal eie gullet?',
        '1896: Jameson-raidet',
        'Kruger sier nei',
        'Ultimatum',
    ],
    beleiring: [
        'Oktober 1899: boerne angriper',
        'Tre byer beleiret',
        'Mafeking: 217 dager',
        'Desember 1899: tre tap på rad',
        'Den svarte uka',
    ],
    motangrep: [
        'Britene sender flere soldater',
        '1900: byene befris',
        '13. mars 1900: Bloemfontein',
        'Sommeren 1900: Pretoria',
        'Britisk, men ikke over',
    ],
};

export function BoerKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'republikker';
    const { geographies } = useFilmVerden(GRUNN);
    const utsnitt = utsnittFor(modus, beat);
    const { sti, kk, kartTransform, skjerm, linje } = useZoom(GRUNN, utsnitt, playing);
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];

    const visRepublikker = modus !== 'republikker' || beat >= 1;
    const visKolonier = modus !== 'republikker' || beat >= 2;
    const britiskeRepublikker = modus === 'motangrep' && beat >= 4;
    const imperiet = modus === 'republikker' && beat === 3;

    const fargeSorAfrika = visKolonier ? '#f1c9cf' : '#ece3cf';
    const tr = skjerm(modus === 'republikker' ? [28.6, -24.4] : [30.4, -25.0]);
    const of = skjerm(modus === 'republikker' ? [26.6, -28.9] : [27.6, -28.0]);
    const kapp = skjerm([21.8, -31.4]);
    const natal = skjerm([30.4, -29.35]);
    const g = skjerm(GULL);
    const pr = skjerm(PRETORIA);
    const bl = skjerm(BLOEMFONTEIN);
    const ki = skjerm(KIMBERLEY);
    const la = skjerm(LADYSMITH);
    const ma = skjerm(MAFEKING);

    const beleiret = modus === 'beleiring' && beat >= 1;
    const befridd = modus === 'motangrep' && beat >= 1;
    const slag = modus === 'beleiring' && beat >= 3;

    return (
        <div className="absolute inset-0 bg-[#a9cbe0] overflow-hidden">
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <LandKlipp id="boerkart-land" geographies={geographies} sti={sti} />
                    <pattern
                        id="boerkart-skravur"
                        width="18"
                        height="18"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <rect width="18" height="18" fill={BRITISK} fillOpacity={0.18} />
                        <rect width="7" height="18" fill={BRITISK} fillOpacity={0.45} />
                    </pattern>
                </defs>
                <g transform={kartTransform}>
                    <Land
                        geographies={geographies}
                        sti={sti}
                        farge={{ '710': fargeSorAfrika, '426': '#e7dccb', '748': '#e7dccb' }}
                    />
                    {visRepublikker && (
                        <g clipPath="url(#boerkart-land)">
                            {[
                                { pts: TRANSVAAL, farge: BOER },
                                { pts: ORANJE, farge: ORANJEFARGE },
                            ].map((r, i) => (
                                <motion.path
                                    key={i}
                                    d={`${linje(r.pts)} Z`}
                                    fill={britiskeRepublikker ? 'url(#boerkart-skravur)' : r.farge}
                                    stroke={britiskeRepublikker ? BRITISK : r.farge}
                                    strokeWidth={4 / kk}
                                    strokeDasharray={britiskeRepublikker ? `${14 / kk} ${10 / kk}` : undefined}
                                    initial={{ fillOpacity: 0 }}
                                    animate={{ fillOpacity: britiskeRepublikker ? 1 : 0.42 }}
                                    transition={{ duration: playing ? 1.4 : 0, delay: playing ? i * 0.6 : 0 }}
                                />
                            ))}
                        </g>
                    )}
                    {imperiet && (
                        <g clipPath="url(#boerkart-land)">
                            <motion.rect
                                x={-2000}
                                y={-2000}
                                width={6000}
                                height={6000}
                                fill={BRITISK}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.18, 0.08, 0.18] }}
                                transition={{ duration: 3, repeat: playing ? Infinity : 0 }}
                            />
                        </g>
                    )}
                </g>

                {/* Navn på republikkene og koloniene */}
                {visRepublikker && modus !== 'gull' && (
                    <>
                        <Etikett tekst="Transvaal" x={tr[0]} y={tr[1]} farge={britiskeRepublikker ? BRITISK : BOER} str={40} />
                        <Etikett tekst="Oranjefristaten" x={of[0]} y={of[1] + 10} farge={britiskeRepublikker ? BRITISK : '#713f12'} str={modus === 'republikker' ? 34 : 30} />
                    </>
                )}
                {modus === 'gull' && beat < 5 && (
                    <Etikett tekst="Transvaal" x={skjerm([30.3, -24.9])[0]} y={skjerm([30.3, -24.9])[1]} farge={BOER} str={44} />
                )}
                {visKolonier && (modus === 'republikker' || (modus === 'gull' && beat >= 5)) && (
                    <>
                        <Etikett tekst="Kappkolonien" x={kapp[0]} y={kapp[1]} farge={BRITISK} str={40} />
                        <Etikett tekst="Natal" x={natal[0] + 30} y={natal[1]} farge={BRITISK} anker="start" />
                    </>
                )}
                {modus === 'beleiring' && beat === 0 && (
                    <>
                        <Etikett tekst="Kappkolonien" x={skjerm([22.6, -31.6])[0]} y={skjerm([22.6, -31.6])[1]} farge={BRITISK} str={40} />
                        <Etikett tekst="Natal" x={natal[0] + 40} y={natal[1] + 20} farge={BRITISK} anker="start" />
                    </>
                )}

                {/* Republikker: nybyggere og imperiet */}
                {modus === 'republikker' && beat === 0 && (
                    <>
                        <Pil
                            fra={skjerm([14.5, -36.6])}
                            til={skjerm([18.9, -33.6])}
                            farge="#334155"
                            bue={-0.2}
                            playing={playing}
                        />
                        <Fakta x={140} y={150} linjer={['Boerne', 'hvite etterkommere', 'av nybyggere fra Europa']} bredde={520} kant={BOER} />
                    </>
                )}
                {imperiet && (
                    <Fakta x={1060} y={640} linjer={['Storbritannia vil ha', 'hele det sørlige Afrika']} bredde={480} kant={BRITISK} />
                )}

                {/* Gullet */}
                {modus === 'gull' && (
                    <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: `${g[0]}px ${g[1]}px` }}>
                        <motion.circle
                            cx={g[0]}
                            cy={g[1]}
                            r={beat >= 5 ? 20 : 46}
                            fill={GULLFARGE}
                            fillOpacity={0.35}
                            animate={{ r: beat >= 5 ? [18, 26, 18] : [40, 56, 40] }}
                            transition={{ duration: 2.4, repeat: playing ? Infinity : 0 }}
                        />
                        <circle cx={g[0]} cy={g[1]} r={beat >= 5 ? 10 : 18} fill={GULLFARGE} stroke="#fff" strokeWidth={4} />
                    </motion.g>
                )}
                {modus === 'gull' && beat < 4 && (
                    <Etikett tekst="Gull" x={g[0] - 50} y={g[1] - 40} farge="#854d0e" anker="end" str={40} />
                )}
                {modus === 'gull' &&
                    beat >= 1 &&
                    beat < 5 &&
                    INNFLYTTERE.map((ll, i) => {
                        const [x, y] = skjerm(ll);
                        return (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={9}
                                fill="#1e3a8a"
                                stroke="#fff"
                                strokeWidth={3}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ transformOrigin: `${x}px ${y}px` }}
                                transition={{ delay: beat === 1 && playing ? 0.3 + (i % 11) * 0.12 : 0 }}
                            />
                        );
                    })}
                {modus === 'gull' && beat === 1 && (
                    <Fakta x={120} y={600} linjer={['Uitlanders', 'engelsktalende innflyttere']} bredde={540} kant="#1e3a8a" />
                )}
                {modus === 'gull' && beat === 2 && (
                    <>
                        <motion.circle
                            cx={g[0]}
                            cy={g[1]}
                            r={110}
                            fill="none"
                            stroke={BRITISK}
                            strokeWidth={6}
                            strokeDasharray="16 12"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                        <Fakta x={120} y={600} linjer={['Britiske selskaper', 'mange eid av Cecil Rhodes']} bredde={560} kant={BRITISK} />
                    </>
                )}
                {modus === 'gull' && beat === 3 && (
                    <>
                        <Pil
                            fra={skjerm([24.3, -25.2])}
                            til={[g[0] - 120, g[1] - 10]}
                            farge={BRITISK}
                            bue={-0.15}
                            bredde={10}
                            playing={playing}
                        />
                        <motion.g
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: playing ? 1.9 : 0 }}
                            style={{ transformOrigin: `${g[0] - 110}px ${g[1] - 10}px` }}
                        >
                            <path
                                d={`M ${g[0] - 140} ${g[1] - 40} l 60 60 M ${g[0] - 80} ${g[1] - 40} l -60 60`}
                                stroke="#0f172a"
                                strokeWidth={14}
                                strokeLinecap="round"
                            />
                        </motion.g>
                        <Fakta x={120} y={600} linjer={['Jameson-raidet', 'et væpnet angrep som mislyktes']} bredde={600} kant={BRITISK} />
                    </>
                )}
                {modus === 'gull' && beat === 4 && (
                    <>
                        <Sted pkt={pr} navn="Pretoria" farge={BOER} dx={26} dy={-14} anker="start" />
                        <Fakta x={120} y={560} linjer={['Britene krever', 'stemmerett for uitlanders', 'Paul Kruger: nei']} bredde={560} kant={BOER} />
                    </>
                )}
                {modus === 'gull' && beat >= 5 && (
                    <Fakta x={1040} y={600} linjer={['Siste krav fra boerne', 'frist: 11. oktober 1899']} bredde={500} kant={BOER} />
                )}

                {/* Beleiringen */}
                {modus === 'beleiring' && beat === 0 && (
                    <>
                        <Pil fra={skjerm([28.6, -27.3])} til={skjerm([29.9, -28.4])} farge={BOER} bue={0.15} bredde={11} playing={playing} />
                        <Pil fra={skjerm([25.6, -29.4])} til={skjerm([24.4, -30.6])} farge={BOER} bue={-0.15} bredde={11} forsinkelse={0.5} playing={playing} />
                        <Pil fra={skjerm([26.3, -26.2])} til={skjerm([25.2, -25.75])} farge={BOER} bue={0.2} bredde={11} forsinkelse={1} playing={playing} />
                    </>
                )}
                {(beleiret || befridd) &&
                    [
                        { pkt: ki, navn: 'Kimberley', dx: -36, dy: -34, anker: 'end' as const },
                        { pkt: la, navn: 'Ladysmith', dx: 40, dy: -20, anker: 'start' as const },
                        { pkt: ma, navn: 'Mafeking', dx: -40, dy: 12, anker: 'end' as const },
                    ].map((b, i) => {
                        const uthevet = modus === 'beleiring' && beat === 2 && b.navn === 'Mafeking';
                        const ring = befridd ? GRONN : BOER;
                        return (
                            <g key={b.navn}>
                                <motion.circle
                                    cx={b.pkt[0]}
                                    cy={b.pkt[1]}
                                    r={uthevet ? 58 : 38}
                                    fill={ring}
                                    fillOpacity={befridd ? 0.12 : 0.2}
                                    stroke={ring}
                                    strokeWidth={6}
                                    strokeDasharray={befridd ? '6 14' : '14 8'}
                                    initial={{ opacity: 0, scale: 1.6 }}
                                    animate={{ opacity: slag && !uthevet ? 0.5 : 1, scale: 1 }}
                                    style={{ transformOrigin: `${b.pkt[0]}px ${b.pkt[1]}px` }}
                                    transition={{ delay: beat === 1 && playing ? i * 0.6 : 0 }}
                                />
                                <circle cx={b.pkt[0]} cy={b.pkt[1]} r={11} fill={BRITISK} stroke="#fff" strokeWidth={4} />
                                {!slag && (
                                    <Etikett tekst={b.navn} x={b.pkt[0] + b.dx} y={b.pkt[1] + b.dy} anker={b.anker} farge="#0f172a" />
                                )}
                            </g>
                        );
                    })}
                {modus === 'beleiring' && beat === 1 && (
                    <Fakta x={1040} y={640} linjer={['Beleire', 'omringe en by']} bredde={440} kant={BOER} />
                )}
                {modus === 'beleiring' && beat === 2 && (
                    <Fakta x={1040} y={600} linjer={['Mafeking', 'omringet i 217 dager', 'over 500 svarte forsvarte byen']} bredde={530} kant={BOER} />
                )}
                {slag &&
                    [
                        { ll: STORMBERG, navn: 'Stormberg', dx: 0, dy: 70, anker: 'middle' as const },
                        { ll: MAGERSFONTEIN, navn: 'Magersfontein', dx: -40, dy: 50, anker: 'end' as const },
                        { ll: COLENSO, navn: 'Colenso', dx: 44, dy: 42, anker: 'start' as const },
                    ].map((s, i) => {
                        const [x, y] = skjerm(s.ll);
                        return (
                            <motion.g
                                key={s.navn}
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: beat === 3 && playing ? 0.4 + i * 0.8 : 0 }}
                                style={{ transformOrigin: `${x}px ${y}px` }}
                            >
                                <circle cx={x} cy={y} r={30} fill="#0f172a" stroke="#fff" strokeWidth={4} />
                                <path
                                    d={`M ${x - 13} ${y - 13} l 26 26 M ${x + 13} ${y - 13} l -26 26`}
                                    stroke="#fff"
                                    strokeWidth={6}
                                    strokeLinecap="round"
                                />
                                <Etikett tekst={s.navn} x={x + s.dx} y={y + s.dy} anker={s.anker} farge="#0f172a" />
                            </motion.g>
                        );
                    })}
                {modus === 'beleiring' && beat === 4 && (
                    <Fakta x={1040} y={640} linjer={['Den svarte uka', 'tre britiske tap på rad']} bredde={480} kant="#0f172a" />
                )}

                {/* Motangrepet */}
                {modus === 'motangrep' && beat === 0 && <Styrker />}
                {modus === 'motangrep' && beat === 1 && (
                    <Fakta x={1040} y={640} linjer={['Lord Roberts', 'ny britisk sjef']} bredde={440} kant={BRITISK} />
                )}
                {modus === 'motangrep' && beat >= 2 && (
                    <>
                        {beat === 2 && (
                            <Pil fra={[ki[0] + 30, ki[1] + 10]} til={[bl[0] - 20, bl[1] - 6]} farge={BRITISK} bue={0.2} bredde={11} playing={playing} />
                        )}
                        <Sted pkt={bl} navn="Bloemfontein" farge={BRITISK} dx={0} dy={62} anker="middle" r={16} />
                    </>
                )}
                {modus === 'motangrep' && beat >= 3 && (
                    <>
                        {beat === 3 && (
                            <Pil fra={[bl[0] + 30, bl[1] - 30]} til={[pr[0] - 10, pr[1] + 30]} farge={BRITISK} bue={-0.15} bredde={11} playing={playing} />
                        )}
                        <Sted pkt={pr} navn="Pretoria" farge={BRITISK} dx={0} dy={56} anker="middle" r={16} />
                    </>
                )}
                {modus === 'motangrep' && beat === 2 && (
                    <Fakta x={1040} y={640} linjer={['Bloemfontein', 'hovedstad i Oranjefristaten']} bredde={530} kant={BRITISK} />
                )}
                {modus === 'motangrep' && beat === 3 && (
                    <Fakta x={1040} y={640} linjer={['Pretoria', 'hovedstad i Transvaal']} bredde={480} kant={BRITISK} />
                )}
                {modus === 'motangrep' && beat >= 4 && (
                    <Fakta x={1040} y={620} linjer={['Erklært britisk', 'men krigen er ikke over']} bredde={500} kant={BRITISK} />
                )}
            </svg>
            <Overskrift tekst={overskrift} />
            <Oversiktskart
                utsnitt={utsnitt}
                omrade={[
                    [-20, -37],
                    [55, 38],
                ]}
                plassering="oppe-venstre"
                synlig={modus !== 'republikker' || beat !== 0}
                etikett="Afrika"
            />
        </div>
    );
}

/** To stolper: hvor mange soldater hver side hadde. */
function Styrker() {
    const rader = [
        { navn: 'Britene', tekst: 'over 400 000', verdi: 400, farge: BRITISK },
        { navn: 'Boerne', tekst: 'rundt 88 000', verdi: 88, farge: BOER },
    ];
    const maks = 400;
    const bredde = 560;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x={960} y={560} width={600} height={290} rx={22} fill="#ffffff" fillOpacity={0.95} stroke="#0f172a" strokeWidth={3} />
            <text x={1260} y={612} textAnchor="middle" fontSize={36} fontWeight={900} fill="#0f172a">
                Soldater
            </text>
            {rader.map((r, i) => (
                <g key={r.navn}>
                    <text x={980} y={672 + i * 96} fontSize={30} fontWeight={800} fill={r.farge}>
                        {r.navn}: {r.tekst}
                    </text>
                    <motion.rect
                        x={980}
                        y={690 + i * 96}
                        height={34}
                        rx={8}
                        fill={r.farge}
                        initial={{ width: 0 }}
                        animate={{ width: (bredde * r.verdi) / maks }}
                        transition={{ duration: 1.4, delay: 0.4 + i * 0.8, ease: 'easeOut' }}
                    />
                </g>
            ))}
        </motion.g>
    );
}
