import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoAzimuthalEqualArea, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { rammePunkter } from '../../kart/grenser';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { ID, NATO_1949, NATO_FOR_2022, SOVJET, FARGE, kortBredde, brytLinjer } from './felles';

/**
 * Kart over Nord-Europa i fire moduser:
 *
 * - `soknad`: våren 2022. Finland og Sverige utenfor NATO, Russland angriper Ukraina, søknaden.
 * - `etterkrig`: hvorfor Norge ble med. Tyskland 1940, Sovjetunionen, Tsjekkoslovakia, Finland.
 * - `forbund`: planen om et nordisk forsvarsforbund som ble ingenting, og valget av NATO.
 * - `norden`: alliansefri og nøytral, Finland og Sverige blir med, hele Norden i NATO.
 *
 * Fargene og kortene byttes per beat. Kartet ligger fast, så eleven kjenner seg igjen.
 */

type Modus = 'soknad' | 'etterkrig' | 'forbund' | 'norden';

const B = 1600;
const H = 900;
const UTSNITT: Utsnitt = [
    [-30, 44],
    [52, 71],
];

/** Sted for etiketter, i lengde/bredde. */
const STED: Record<string, [number, number]> = {
    norge: [8.6, 61.6],
    sverige: [15.5, 59.4],
    finland: [26.3, 64.6],
    danmark: [9.2, 56.1],
    island: [-18.5, 65],
    russland: [42, 60.5],
    ukraina: [31.5, 49],
    tyskland: [10.4, 51.2],
    tsjekkoslovakia: [16.5, 49.4],
};

interface Etikett {
    sted: keyof typeof STED;
    tekst: string;
    farge?: string;
    dy?: number;
}

interface Bilde {
    /** Farge per land-id; land som ikke står her får grunnfargen. */
    farger: Record<string, string>;
    /** Land som får en tykk, mørk kant. */
    kant?: string[];
    etiketter: Etikett[];
    kort: { tittel: string; tekst?: string; farge?: string };
    /** Ring rundt Skandinavia (forbund). */
    ring?: 'hel' | 'brutt';
}

function natoFarger(ekstra: Record<string, string> = {}) {
    const f: Record<string, string> = {};
    for (const id of NATO_FOR_2022) f[id] = FARGE.natoLys;
    f[ID.norge] = FARGE.nato;
    return { ...f, ...ekstra };
}

function sovjet(farge: string) {
    const f: Record<string, string> = {};
    for (const id of SOVJET) f[id] = farge;
    return f;
}

function bildeFor(modus: Modus, beat: number): Bilde {
    if (modus === 'soknad') {
        const grunn = natoFarger({ [ID.russland]: FARGE.russlandLys });
        switch (beat) {
            case 0:
                return {
                    farger: { ...grunn, [ID.finland]: FARGE.utenfor },
                    kant: [ID.finland],
                    etiketter: [
                        { sted: 'finland', tekst: 'Finland' },
                        { sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork },
                        { sted: 'russland', tekst: 'Russland', farge: FARGE.rodMork },
                    ],
                    kort: { tittel: 'Finland', tekst: 'utenfor militære allianser i flere tiår' },
                };
            case 1:
                return {
                    farger: { ...grunn, [ID.finland]: FARGE.utenfor, [ID.sverige]: FARGE.utenfor },
                    kant: [ID.finland, ID.sverige],
                    etiketter: [
                        { sted: 'finland', tekst: 'Finland' },
                        { sted: 'sverige', tekst: 'Sverige' },
                        { sted: 'russland', tekst: 'Russland', farge: FARGE.rodMork },
                    ],
                    kort: {
                        tittel: 'Utenfor NATO',
                        tekst: 'Finland samarbeider, men vil ikke bli medlem. Sverige: nøytralt i over 200 år',
                    },
                };
            case 2:
                return {
                    farger: {
                        ...grunn,
                        [ID.finland]: FARGE.utenfor,
                        [ID.sverige]: FARGE.utenfor,
                        [ID.russland]: FARGE.rod,
                        [ID.ukraina]: FARGE.gul,
                    },
                    kant: [ID.ukraina],
                    etiketter: [
                        { sted: 'russland', tekst: 'Russland', farge: '#ffffff' },
                        { sted: 'ukraina', tekst: 'Ukraina' },
                    ],
                    kort: { tittel: 'Februar 2022', tekst: 'Russland angriper Ukraina', farge: FARGE.rodMork },
                };
            case 3:
                return {
                    farger: {
                        ...grunn,
                        [ID.finland]: FARGE.sok,
                        [ID.sverige]: FARGE.sok,
                        [ID.russland]: FARGE.rod,
                        [ID.ukraina]: FARGE.gul,
                    },
                    kant: [ID.finland, ID.sverige],
                    etiketter: [
                        { sted: 'finland', tekst: 'Finland' },
                        { sted: 'sverige', tekst: 'Sverige' },
                    ],
                    kort: { tittel: '18. mai 2022', tekst: 'Finland og Sverige søker om å bli med i NATO' },
                };
            default:
                return {
                    farger: {
                        ...grunn,
                        [ID.finland]: FARGE.sok,
                        [ID.sverige]: FARGE.sok,
                        [ID.russland]: FARGE.russlandLys,
                    },
                    kant: [ID.norge],
                    etiketter: [{ sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork }],
                    kort: { tittel: 'Norge', tekst: 'med i NATO helt fra starten. Hvorfor?', farge: FARGE.natoMork },
                };
        }
    }
    if (modus === 'etterkrig') {
        switch (beat) {
            case 0:
                return {
                    farger: { [ID.norge]: FARGE.nato, [ID.tyskland]: FARGE.tysk },
                    kant: [ID.norge],
                    etiketter: [
                        { sted: 'norge', tekst: 'Norge: nøytralt', farge: FARGE.natoMork },
                        { sted: 'tyskland', tekst: 'Tyskland', farge: '#ffffff' },
                    ],
                    kort: { tittel: '1940', tekst: 'Tyskland angriper Norge, selv om Norge er nøytralt' },
                };
            case 1:
                return {
                    farger: { [ID.norge]: FARGE.nato },
                    kant: [ID.norge],
                    etiketter: [{ sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork }],
                    kort: { tittel: 'Etter krigen', tekst: 'mange vil være sikre på å få hjelp fra andre' },
                };
            case 2:
                return {
                    farger: { [ID.norge]: FARGE.nato, ...sovjet(FARGE.rod) },
                    etiketter: [
                        { sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork },
                        { sted: 'russland', tekst: 'Sovjetunionen', farge: '#ffffff' },
                    ],
                    kort: { tittel: 'Sovjetunionen', tekst: 'mange blir redde for den store naboen i øst' },
                };
            case 3:
                return {
                    farger: {
                        [ID.norge]: FARGE.nato,
                        ...sovjet(FARGE.rod),
                        [ID.tsjekkia]: FARGE.gul,
                        [ID.slovakia]: FARGE.gul,
                    },
                    kant: [ID.tsjekkia, ID.slovakia],
                    etiketter: [
                        { sted: 'russland', tekst: 'Sovjetunionen', farge: '#ffffff' },
                        { sted: 'tsjekkoslovakia', tekst: 'Tsjekkoslovakia' },
                    ],
                    kort: { tittel: 'Kupp i Tsjekkoslovakia', tekst: 'kommunistene tar makten uten valg' },
                };
            case 4:
                return {
                    farger: {
                        [ID.norge]: FARGE.nato,
                        ...sovjet(FARGE.rod),
                        [ID.tsjekkia]: '#cbd5e1',
                        [ID.slovakia]: '#cbd5e1',
                        [ID.finland]: FARGE.gul,
                    },
                    kant: [ID.finland],
                    etiketter: [
                        { sted: 'russland', tekst: 'Sovjetunionen', farge: '#ffffff' },
                        { sted: 'finland', tekst: 'Finland' },
                    ],
                    kort: { tittel: 'Finland', tekst: 'Sovjetunionen legger press på Finland' },
                };
            default:
                return {
                    farger: {
                        [ID.norge]: FARGE.nato,
                        ...sovjet(FARGE.rod),
                        [ID.finland]: FARGE.gul,
                    },
                    kant: [ID.norge, ID.finland],
                    etiketter: [
                        { sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork },
                        { sted: 'finland', tekst: 'Finland' },
                    ],
                    kort: {
                        tittel: 'Historikeren Even Lange:',
                        tekst: 'en ekte fare for at Sovjetunionen kunne tvinge Norge inn i en avtale lik Finlands',
                    },
                };
        }
    }
    if (modus === 'forbund') {
        const nordisk = { [ID.norge]: FARGE.nato, [ID.sverige]: FARGE.nato, [ID.danmark]: FARGE.nato };
        switch (beat) {
            case 0:
                return {
                    farger: nordisk,
                    kant: [ID.norge, ID.sverige, ID.danmark],
                    etiketter: [
                        { sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork },
                        { sted: 'sverige', tekst: 'Sverige', farge: FARGE.natoMork },
                        { sted: 'danmark', tekst: 'Danmark', farge: FARGE.natoMork, dy: 40 },
                    ],
                    kort: { tittel: 'Planen', tekst: 'et forsvarsforbund mellom Norge, Sverige og Danmark' },
                    ring: 'hel',
                };
            case 1:
                return {
                    farger: { ...nordisk, [ID.sverige]: FARGE.utenfor },
                    kant: [ID.sverige],
                    etiketter: [
                        { sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork },
                        { sted: 'sverige', tekst: 'Sverige: nøytralt' },
                        { sted: 'danmark', tekst: 'Danmark', farge: FARGE.natoMork, dy: 40 },
                    ],
                    kort: { tittel: 'Vinteren 1949', tekst: 'planen blir ingenting. Sverige vil være nøytralt', farge: FARGE.rodMork },
                    ring: 'brutt',
                };
            case 2:
                return {
                    farger: { ...nordisk, [ID.sverige]: FARGE.utenfor },
                    etiketter: [
                        { sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork },
                        { sted: 'danmark', tekst: 'Danmark', farge: FARGE.natoMork, dy: 40 },
                    ],
                    kort: {
                        tittel: 'USA:',
                        tekst: 'amerikanske våpen bare til land i Atlanterhavspakten',
                    },
                };
            default:
                return {
                    farger: {
                        ...Object.fromEntries(NATO_1949.map((id) => [id, FARGE.natoLys])),
                        [ID.norge]: FARGE.nato,
                        [ID.danmark]: FARGE.nato,
                        [ID.sverige]: FARGE.utenfor,
                    },
                    kant: [ID.norge, ID.danmark],
                    etiketter: [
                        { sted: 'norge', tekst: 'Norge: NATO', farge: FARGE.natoMork },
                        { sted: 'danmark', tekst: 'Danmark: NATO', farge: FARGE.natoMork, dy: 40 },
                    ],
                    kort: { tittel: '1949', tekst: 'Norge og Danmark velger NATO', farge: FARGE.natoMork },
                };
        }
    }
    // norden
    const grunn = natoFarger({ [ID.russland]: FARGE.russlandLys });
    switch (beat) {
        case 0:
            return {
                farger: { ...grunn, [ID.finland]: FARGE.utenfor, [ID.sverige]: FARGE.utenfor },
                kant: [ID.finland],
                etiketter: [{ sted: 'finland', tekst: 'Finland' }],
                kort: { tittel: 'Alliansefri', tekst: 'utenfor militære allianser i fredstid' },
            };
        case 1:
            return {
                farger: { ...grunn, [ID.finland]: FARGE.utenfor, [ID.sverige]: FARGE.utenfor },
                kant: [ID.sverige],
                etiketter: [{ sted: 'sverige', tekst: 'Sverige: over 200 år' }],
                kort: { tittel: 'Nøytral', tekst: 'holder seg utenfor kriger som skjer i nærheten' },
            };
        case 2:
            return {
                farger: {
                    ...grunn,
                    [ID.finland]: FARGE.utenfor,
                    [ID.sverige]: FARGE.utenfor,
                    [ID.russland]: FARGE.rod,
                    [ID.ukraina]: FARGE.gul,
                },
                kant: [ID.ukraina],
                etiketter: [{ sted: 'ukraina', tekst: 'Ukraina' }],
                kort: {
                    tittel: 'NATO om angrepet:',
                    tekst: 'den største sikkerhetskrisen i Europa siden andre verdenskrig',
                    farge: FARGE.rodMork,
                },
            };
        case 3:
            return {
                farger: { ...grunn, [ID.finland]: FARGE.nato, [ID.sverige]: FARGE.nato },
                kant: [ID.finland, ID.sverige],
                etiketter: [
                    { sted: 'finland', tekst: 'Finland: 2023', farge: FARGE.natoMork },
                    { sted: 'sverige', tekst: 'Sverige: 2024', farge: FARGE.natoMork },
                ],
                kort: { tittel: 'Nye medlemmer', tekst: 'Finland i april 2023, Sverige i mars 2024' },
            };
        default:
            return {
                farger: {
                    ...grunn,
                    [ID.finland]: FARGE.nato,
                    [ID.sverige]: FARGE.nato,
                    [ID.danmark]: FARGE.nato,
                    [ID.island]: FARGE.nato,
                },
                kant: [ID.norge, ID.sverige, ID.finland, ID.danmark, ID.island],
                etiketter: [
                    { sted: 'norge', tekst: 'Norge', farge: FARGE.natoMork },
                    { sted: 'sverige', tekst: 'Sverige', farge: FARGE.natoMork },
                    { sted: 'finland', tekst: 'Finland', farge: FARGE.natoMork },
                    { sted: 'danmark', tekst: 'Danmark', farge: FARGE.natoMork, dy: 40 },
                    { sted: 'island', tekst: 'Island', farge: FARGE.natoMork },
                ],
                kort: { tittel: 'Hele Norden', tekst: 'alle de fem nordiske landene er med i NATO', farge: FARGE.natoMork },
            };
    }
}

const Grunnkart = memo(function Grunnkart({
    geographies,
    sti,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
}) {
    return (
        <g>
            {geographies.map((g, i) => (
                <path key={`${g.id}-${i}`} d={sti(g as never) ?? ''} fill={FARGE.land} stroke="#ffffff" strokeWidth={1} />
            ))}
        </g>
    );
});

function Kort({ tittel, tekst, farge }: Bilde['kort']) {
    const linjer = brytLinjer(tekst);
    const bredde = Math.max(kortBredde(tittel, 46), ...linjer.map((l) => kortBredde(l, 34))) + 60;
    const hoyde = 96 + linjer.length * 46;
    const x = 40;
    const y = H - 40 - hoyde;
    return (
        <g>
            <rect x={x} y={y} width={bredde} height={hoyde} rx={22} fill="#ffffff" opacity={0.96} stroke="#cbd5e1" strokeWidth={2} />
            <text x={x + 30} y={y + 64} fontSize={46} fontWeight={900} fill={farge ?? FARGE.mork}>
                {tittel}
            </text>
            {linjer.map((l, i) => (
                <text key={i} x={x + 30} y={y + 116 + i * 46} fontSize={34} fontWeight={600} fill="#334155">
                    {l}
                </text>
            ))}
        </g>
    );
}

export function NatoKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'soknad';
    const { geographies } = useFilmVerden(UTSNITT);
    const { sti, proj } = useMemo(() => {
        const p = geoAzimuthalEqualArea()
            .rotate([-12, -58])
            .fitExtent(
                [
                    [0, 0],
                    [B, H],
                ],
                rammePunkter(UTSNITT[0], UTSNITT[1]) as never
            );
        return { sti: geoPath(p), proj: p };
    }, []);
    const bilde = bildeFor(modus, beat);
    const etterkrig = modus === 'etterkrig';

    // Land som skal farges, tegnet over grunnkartet.
    const fargede = geographies.filter((g) => bilde.farger[String(g.id ?? '')]);
    const kanter = geographies.filter((g) => bilde.kant?.includes(String(g.id ?? '')));
    const pkt = (sted: keyof typeof STED) => proj(STED[sted]) ?? [0, 0];

    const ringSenter = proj([13, 61]) ?? [0, 0];

    return (
        <div className="absolute inset-0" style={{ background: FARGE.hav }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                <Grunnkart geographies={geographies} sti={sti} />
                {fargede.map((g, i) => (
                    <path
                        key={`f-${g.id}-${i}`}
                        d={sti(g as never) ?? ''}
                        fill={bilde.farger[String(g.id ?? '')]}
                        stroke="#ffffff"
                        strokeWidth={1}
                        style={{ transition: 'fill 0.8s' }}
                    />
                ))}
                {kanter.map((g, i) => (
                    <motion.path
                        key={`k-${modus}-${beat}-${g.id}-${i}`}
                        d={sti(g as never) ?? ''}
                        fill="none"
                        stroke={FARGE.mork}
                        strokeWidth={3.5}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    />
                ))}
                {bilde.ring && (
                    <g>
                        <ellipse
                            cx={ringSenter[0]}
                            cy={ringSenter[1]}
                            rx={270}
                            ry={330}
                            fill="none"
                            stroke={bilde.ring === 'hel' ? FARGE.nato : FARGE.rod}
                            strokeWidth={8}
                            strokeDasharray={bilde.ring === 'brutt' ? '40 30' : undefined}
                            opacity={0.85}
                        />
                        {bilde.ring === 'brutt' && (
                            <g transform={`translate(${ringSenter[0] + 150}, ${ringSenter[1] + 60})`}>
                                <circle r={40} fill={FARGE.rod} />
                                <path d="M -18 -18 L 18 18 M 18 -18 L -18 18" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
                            </g>
                        )}
                    </g>
                )}
                <AnimatePresence>
                    {bilde.etiketter.map((e) => {
                        const [x, y] = pkt(e.sted);
                        return (
                            <motion.text
                                key={`${modus}-${e.sted}-${e.tekst}`}
                                x={x}
                                y={y + (e.dy ?? 0)}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill={e.farge ?? FARGE.mork}
                                style={{
                                    paintOrder: 'stroke',
                                    stroke: e.farge === '#ffffff' ? FARGE.mork : '#ffffff',
                                    strokeWidth: 9,
                                    strokeLinejoin: 'round',
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {e.tekst}
                            </motion.text>
                        );
                    })}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                    <motion.g
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Kort {...bilde.kort} />
                    </motion.g>
                </AnimatePresence>
                {etterkrig && beat >= 2 && (
                    <text x={B - 30} y={H - 30} textAnchor="end" fontSize={32} fontWeight={600} fill="#475569">
                        Sovjetunionen: grenser omtrentlig
                    </text>
                )}
            </svg>
        </div>
    );
}
