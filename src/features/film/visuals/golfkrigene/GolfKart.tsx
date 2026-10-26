import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartet over golfkrigene, i sju modus:
 * «venn»: 1980-tallet. Irak mot Iran, og Vesten sender våpen og hemmelig informasjon til Saddam.
 * «koalisjon»: FN krever at Irak går ut, 35 land svarer, og soldatene samles i Saudi-Arabia.
 * «luft»: Ørkenstorm. Fly inn over Irak, og Scud-raketter mot Israel og Saudi-Arabia.
 * «valg»: Kuwait er fritt. Veien til Bagdad er åpen, men FN-mandatet stopper ved grensen.
 * «sanksjoner»: opprørene slås ned, Irak stenges inne, sykehusene tømmes, palasset står.
 * «invasjon»: 2003. USA og Storbritannia rykker fra Kuwait mot Bagdad uten FN.
 * «kaos»: landet sprekker opp i grupper som slåss om makta.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'venn' | 'koalisjon' | 'luft' | 'valg' | 'sanksjoner' | 'invasjon' | 'kaos';

const IRAK = 368;
const IRAN = 364;
const KUWAIT = 414;
const SAUDI = 682;
const ISRAEL = 376;
const ARABISKE = [SAUDI, 818, 760, 634, 784];

const STED = {
    bagdad: [44.4, 33.3] as LngLat,
    kuwait: [47.98, 29.37] as LngLat,
    basra: [47.8, 30.5] as LngLat,
    teheran: [51.4, 35.7] as LngLat,
    riyadh: [46.7, 24.7] as LngLat,
    telAviv: [34.8, 32.1] as LngLat,
    kurdistan: [44.0, 36.3] as LngLat,
    vestIrak: [41.0, 33.0] as LngLat,
};

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    irak: '#b91c1c',
    irakLys: '#fecaca',
    venn: '#f59e0b',
    iran: '#16a34a',
    kuwait: '#0d9488',
    saudi: '#86efac',
    koalisjon: '#1d4ed8',
    gull: '#ca8a04',
    gra: '#a8a29e',
};

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    venn: [
        [-14, 24],
        [64, 52],
    ],
    koalisjon: [
        [24, 14],
        [62, 40],
    ],
    luft: [
        [30, 19],
        [56, 38],
    ],
    valg: [
        [37, 26.5],
        [53, 36.5],
    ],
    sanksjoner: [
        [36, 27.5],
        [52, 38.5],
    ],
    invasjon: [
        [37, 26.5],
        [53, 36.5],
    ],
    kaos: [
        [37, 28.5],
        [51, 38],
    ],
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const [a, b] = UTSNITT[modus];
    return geoMercator().fitExtent(
        [
            [60, 60],
            [B - 60, H - 60],
        ],
        { type: 'MultiPoint', coordinates: [a, b] } as never
    );
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'venn':
            if (id === IRAK) return FARGE.venn;
            if (id === IRAN && beat >= 1) return beat >= 2 ? '#fca5a5' : FARGE.iran;
            return FARGE.land;
        case 'koalisjon':
            if (id === IRAK || id === KUWAIT) return FARGE.irak;
            if (id === SAUDI && beat >= 3) return FARGE.saudi;
            return FARGE.land;
        case 'luft':
            if (id === IRAK || id === KUWAIT) return FARGE.irak;
            if (id === SAUDI) return FARGE.saudi;
            if (id === ISRAEL && beat >= 2) return '#fde68a';
            return FARGE.land;
        case 'valg':
            if (id === KUWAIT) return FARGE.kuwait;
            if (id === IRAK) return FARGE.irakLys;
            if (beat >= 2 && ARABISKE.includes(id)) return FARGE.saudi;
            return FARGE.land;
        case 'sanksjoner':
            if (id === IRAK) return beat >= 3 ? '#d6d3d1' : FARGE.irakLys;
            return FARGE.land;
        case 'invasjon':
            if (id === IRAK) return beat >= 2 ? '#bfdbfe' : FARGE.irakLys;
            if (id === KUWAIT) return '#93c5fd';
            return FARGE.land;
        case 'kaos':
            if (id === IRAK) return '#e7e5e4';
            return FARGE.land;
    }
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    venn: [
        { tekst: '1980-tallet: Vestens venn' },
        { tekst: 'Irak mot Iran, åtte år', rod: true },
        { tekst: 'USA: Iran er fienden' },
        { tekst: 'Hjelp fra Vesten' },
    ],
    koalisjon: [
        { tekst: 'FN: Irak må ut av Kuwait' },
        { tekst: 'FN: lov til å bruke makt' },
        { tekst: '35 land i koalisjonen' },
        { tekst: 'Saudi-Arabia blir base' },
    ],
    luft: [
        { tekst: '17. januar 1991' },
        { tekst: '38 dager med bomber fra lufta', rod: true },
        { tekst: 'Scud-raketter', rod: true },
        { tekst: 'Koalisjonen holder sammen' },
    ],
    valg: [
        { tekst: 'Videre til Bagdad?' },
        { tekst: 'FN: bare frigjør Kuwait' },
        { tekst: 'Allierte sier nei' },
        { tekst: 'Koalisjonen stopper' },
    ],
    sanksjoner: [
        { tekst: 'Opprørene slås ned', rod: true },
        { tekst: 'Sanksjoner: Irak stenges inne' },
        { tekst: 'Sykehusene mangler medisin', rod: true },
        { tekst: 'Saddam sitter trygt' },
    ],
    invasjon: [
        { tekst: 'Mars 2003: uten FN', rod: true },
        { tekst: 'Sjokk og ærefrykt' },
        { tekst: 'Bagdad faller på tre uker' },
        { tekst: 'Desember 2003: Saddam tatt' },
    ],
    kaos: [
        { tekst: 'Ingen stat som virker', rod: true },
        { tekst: 'Fra glede til sinne' },
        { tekst: 'Grupper slåss om makta', rod: true },
        { tekst: '2011: soldatene drar' },
    ],
};

export function GolfKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'venn';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const liste = BRIKKER[modus];
    const brikke = liste[Math.min(beat, liste.length - 1)];
    const irakForm = geographies.find((g) => Number(g.id) === IRAK);
    const irakSti = irakForm ? (sti(irakForm as never) ?? '') : '';
    const bag = p(STED.bagdad);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id="golf-irak">
                        <path d={irakSti} />
                    </clipPath>
                </defs>
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />

                {modus === 'venn' && (
                    <>
                        <Etikett pos={p([43.5, 32])} tekst="Irak" farge="#78350f" stor />
                        {beat >= 1 && (
                            <Etikett pos={p([54.5, 32.5])} tekst="Iran" farge="#14532d" stor />
                        )}
                        <By pos={bag} navn="Bagdad" />
                        {beat === 0 && (
                            <Merke pos={p([43.5, 28.2])} tekst="Saddam Hussein" forsinkelse={0.8} />
                        )}
                        {beat === 1 && (
                            <>
                                <Pil fra={p([45, 33])} til={p([50, 33.5])} farge={FARGE.irak} />
                                <Merke
                                    pos={p([50, 27.6])}
                                    tekst="1980-1988"
                                    farge={FARGE.irak}
                                    forsinkelse={1.2}
                                />
                            </>
                        )}
                        {beat === 2 && (
                            <>
                                <By pos={p(STED.teheran)} navn="Teheran" />
                                <Merke
                                    pos={p([54, 29])}
                                    tekst="Revolusjon 1979"
                                    farge="#14532d"
                                    forsinkelse={0.4}
                                />
                                <Merke
                                    pos={p([10, 34])}
                                    tekst="USA hater Iran"
                                    farge={FARGE.irak}
                                    forsinkelse={1.2}
                                />
                            </>
                        )}
                        {beat >= 3 &&
                            (
                                [
                                    [[-12, 40], 'Hemmelig informasjon', [12, 30], -0.15],
                                    [[2, 49], 'Våpen', [20, 47], 0.12],
                                    [[-6, 45], 'Kjemiske stoffer', [8, 38.5], 0.02],
                                ] as [LngLat, string, LngLat, number][]
                            ).map(([fra, tekst, merke, bue], i) => (
                                <g key={tekst}>
                                    <Pil
                                        fra={p(fra)}
                                        til={bag}
                                        farge={i === 2 ? FARGE.irak : '#1e3a8a'}
                                        bue={bue}
                                        forsinkelse={i * 0.7}
                                    />
                                    <Merke
                                        pos={p(merke)}
                                        tekst={tekst}
                                        farge={i === 2 ? FARGE.irak : '#1e3a8a'}
                                        forsinkelse={0.6 + i * 0.7}
                                    />
                                </g>
                            ))}
                        {beat >= 3 && <Merke pos={p([-8, 36.5])} tekst="Vesten" />}
                    </>
                )}

                {modus === 'koalisjon' && (
                    <>
                        <Etikett pos={p([43, 33])} tekst="Irak" farge="#7f1d1d" stor />
                        <Etikett pos={p([46, 23.5])} tekst="Saudi-Arabia" farge="#14532d" />
                        <By pos={p(STED.kuwait)} navn="Kuwait" />
                        {beat <= 1 && (
                            <Merke
                                pos={p([33, 20])}
                                tekst={beat === 0 ? 'FN: Trekk dere ut!' : 'Saddam: Nei'}
                                farge={beat === 0 ? '#1e3a8a' : FARGE.irak}
                                forsinkelse={0.6}
                            />
                        )}
                        {beat === 1 && (
                            <Pil
                                fra={p([35, 21.5])}
                                til={p([47, 28.5])}
                                farge="#1e3a8a"
                                bue={-0.15}
                                forsinkelse={1.2}
                            />
                        )}
                        {beat >= 2 &&
                            (
                                [
                                    [24, 30],
                                    [24, 22],
                                    [28, 15],
                                    [36, 14],
                                    [62, 18],
                                    [62, 24],
                                    [25, 36],
                                ] as LngLat[]
                            ).map((fra, i) => (
                                <Pil
                                    key={i}
                                    fra={p(fra)}
                                    til={p([46, 26.5])}
                                    farge={FARGE.koalisjon}
                                    bue={i % 2 ? 0.12 : -0.12}
                                    forsinkelse={i * 0.25}
                                    tynn
                                />
                            ))}
                        {beat >= 3 && (
                            <Prikker
                                pos={p([46.5, 26.6])}
                                antall={120}
                                radius={120}
                                farge={FARGE.koalisjon}
                            />
                        )}
                    </>
                )}

                {modus === 'luft' && (
                    <>
                        <Etikett pos={p([39.6, 31.4])} tekst="Irak" farge="#7f1d1d" stor />
                        <Etikett pos={p([44, 23])} tekst="Saudi-Arabia" farge="#14532d" />
                        <By pos={bag} navn="Bagdad" />
                        <Prikker
                            pos={p([45.5, 26.8])}
                            antall={70}
                            radius={70}
                            farge={FARGE.koalisjon}
                        />
                        {beat >= 1 &&
                            (
                                [
                                    [44.4, 33.3],
                                    [42.5, 31.5],
                                    [46.5, 31.6],
                                    [43.5, 35.5],
                                    [47.5, 30.2],
                                    [41.2, 33.8],
                                ] as LngLat[]
                            ).map((mal, i) => (
                                <g key={i}>
                                    <Pil
                                        fra={p([45.5 + (i % 3) - 1, 27.5])}
                                        til={p(mal)}
                                        farge={FARGE.koalisjon}
                                        bue={i % 2 ? 0.1 : -0.1}
                                        forsinkelse={i * 0.35}
                                        tynn
                                    />
                                    <Mal pos={p(mal)} forsinkelse={1.2 + i * 0.35} />
                                </g>
                            ))}
                        {beat === 1 && (
                            <Merke
                                pos={p([36, 24])}
                                tekst="38 dager"
                                farge={FARGE.irak}
                                forsinkelse={0.8}
                            />
                        )}
                        {beat >= 2 && (
                            <>
                                <Etikett pos={p([34.3, 30])} tekst="Israel" farge="#78350f" />
                                <Pil
                                    fra={p(STED.vestIrak)}
                                    til={p(STED.telAviv)}
                                    farge={FARGE.irak}
                                    bue={-0.3}
                                    stiplet
                                />
                                <Pil
                                    fra={p([45, 32])}
                                    til={p(STED.riyadh)}
                                    farge={FARGE.irak}
                                    bue={0.25}
                                    forsinkelse={0.8}
                                    stiplet
                                />
                            </>
                        )}
                        {beat >= 3 && (
                            <Merke
                                pos={p([35, 25])}
                                tekst="Planen lykkes ikke"
                                farge="#14532d"
                                forsinkelse={0.5}
                            />
                        )}
                    </>
                )}

                {modus === 'valg' && (
                    <>
                        <Etikett pos={p([41.2, 31.3])} tekst="Irak" farge="#7f1d1d" stor />
                        <By pos={bag} navn="Bagdad" />
                        <Etikett pos={p([49.2, 28.6])} tekst="Kuwait: fritt" farge="#115e59" />
                        <Vei fra={p([47.6, 30.3])} til={bag} sperret={beat >= 1} />
                        {beat === 0 && <Sporsmal pos={p([46.3, 32.4])} />}
                        {beat >= 1 && (
                            <Merke
                                pos={p([50.2, 32.4])}
                                tekst="FN-mandatet: bare Kuwait"
                                farge="#1e3a8a"
                                forsinkelse={0.6}
                            />
                        )}
                        {beat >= 2 && (
                            <>
                                <Merke
                                    pos={p([42, 27.5])}
                                    tekst="Arabiske allierte: Nei"
                                    farge="#14532d"
                                    forsinkelse={0.3}
                                />
                                <Merke
                                    pos={p([40.2, 29.6])}
                                    tekst="Tomrom uten styre?"
                                    farge={FARGE.irak}
                                    forsinkelse={1.1}
                                />
                            </>
                        )}
                        {beat >= 3 && <Stopp pos={p([47.3, 30.6])} />}
                        {beat >= 3 && <Palass pos={p([39.9, 33.4])} />}
                    </>
                )}

                {modus === 'sanksjoner' && (
                    <>
                        {beat < 3 && (
                            <Etikett pos={p([41.0, 32.8])} tekst="Irak" farge="#7f1d1d" stor />
                        )}
                        <By pos={bag} navn="Bagdad" />
                        <Opprør
                            pos={p(STED.basra)}
                            navn="Sjiamuslimer"
                            slukket={beat >= 1}
                            dy={70}
                        />
                        <Opprør
                            pos={p(STED.kurdistan)}
                            navn="Kurdere"
                            slukket={beat >= 1}
                            dy={70}
                        />
                        {beat >= 1 && <Sperring sti={irakSti} />}
                        {beat >= 1 &&
                            (
                                [
                                    [38, 30],
                                    [50.5, 29],
                                    [37.5, 36.8],
                                    [49.5, 37.5],
                                ] as LngLat[]
                            ).map((ll, i) => (
                                <Sperret key={i} pos={p(ll)} forsinkelse={0.4 + i * 0.3} />
                            ))}
                        {beat >= 2 && <Sykehus pos={p([43.6, 30.2])} />}
                        {beat >= 3 && <Palass pos={p([40.4, 34.6])} />}
                    </>
                )}

                {modus === 'invasjon' && (
                    <>
                        <Etikett pos={p([41.2, 31.3])} tekst="Irak" farge="#7f1d1d" stor />
                        <By pos={bag} navn={beat < 2 ? 'Bagdad' : ''} />
                        <Etikett pos={p([48.8, 28.6])} tekst="Kuwait" farge="#1e3a8a" />
                        <Pil
                            fra={p([46.9, 29.8])}
                            til={p([44.6, 33.0])}
                            farge={FARGE.koalisjon}
                            bue={0.08}
                        />
                        <Pil
                            fra={p([47.6, 30.0])}
                            til={p([46.5, 31.6])}
                            farge="#7c3aed"
                            bue={-0.1}
                            forsinkelse={0.4}
                        />
                        <Merke
                            pos={p([49.8, 31.6])}
                            tekst="Storbritannia"
                            farge="#7c3aed"
                            forsinkelse={1.6}
                        />
                        <Merke
                            pos={p([41.6, 30])}
                            tekst="USA"
                            farge={FARGE.koalisjon}
                            forsinkelse={1.2}
                        />
                        {beat >= 1 && <Sjokk pos={bag} />}
                        {beat >= 2 && <Fanget pos={bag} tekst="Bagdad faller" />}
                        {beat >= 3 && (
                            <>
                                <Merke
                                    pos={p([49.6, 33.4])}
                                    tekst="Henrettet 2006"
                                    farge="#334155"
                                    forsinkelse={1}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'kaos' && (
                    <>
                        <g clipPath="url(#golf-irak)">
                            {beat >= 2 && (
                                <>
                                    <Sone y={0} h={p([0, 35.3])[1]} farge="#fde68a" />
                                    <Sone
                                        y={p([0, 35.3])[1]}
                                        h={p([0, 32.2])[1] - p([0, 35.3])[1]}
                                        farge="#a8a29e"
                                        forsinkelse={0.4}
                                    />
                                    <Sone
                                        y={p([0, 32.2])[1]}
                                        h={H - p([0, 32.2])[1]}
                                        farge="#86efac"
                                        forsinkelse={0.8}
                                    />
                                </>
                            )}
                            {beat < 2 && <Sprekker sti={irakSti} />}
                        </g>
                        <By pos={bag} navn="Bagdad" />
                        {beat < 2 && (
                            <Etikett pos={p([42.3, 32.3])} tekst="Irak" farge="#44403c" stor />
                        )}
                        {beat === 1 && (
                            <Prikker
                                pos={[bag[0] + 40, bag[1] + 120]}
                                antall={90}
                                radius={110}
                                farge="#ea580c"
                                glede
                            />
                        )}
                        {beat === 1 && (
                            <Merke
                                pos={p([47.6, 35.2])}
                                tekst="Glede blir sinne"
                                farge="#ea580c"
                                forsinkelse={2.4}
                            />
                        )}
                        {beat === 2 && (
                            <>
                                <Merke
                                    pos={p([44, 36.3])}
                                    tekst="Kurdere"
                                    farge="#92400e"
                                    forsinkelse={0.3}
                                />
                                <Merke
                                    pos={p([41.6, 33.6])}
                                    tekst="Sunni-islamister: senere IS"
                                    farge="#0f172a"
                                    forsinkelse={0.7}
                                />
                                <Merke
                                    pos={p([45.2, 31.4])}
                                    tekst="Sjia-militser"
                                    farge="#14532d"
                                    forsinkelse={1.1}
                                />
                            </>
                        )}
                        {beat >= 3 && (
                            <>
                                <Pil
                                    fra={p(STED.bagdad)}
                                    til={p([48.6, 29.0])}
                                    farge={FARGE.koalisjon}
                                    bue={0.1}
                                />
                                <Merke
                                    pos={p([41.4, 32.0])}
                                    tekst="Hundretusener døde"
                                    farge={FARGE.irak}
                                    forsinkelse={1.2}
                                />
                                <Merke
                                    pos={p([49.4, 30.6])}
                                    tekst="USA drar"
                                    farge={FARGE.koalisjon}
                                    forsinkelse={1.6}
                                />
                            </>
                        )}
                    </>
                )}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Landene tegnes på nytt bare når fargene endrer seg. CSS glir mellom fargene. */
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
    farge = '#0f172a',
    stor,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            x={pos[0]}
            y={pos[1]}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 64 : 42}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function By({ pos, navn }: { pos: [number, number]; navn: string }) {
    return (
        <g>
            <circle
                cx={pos[0]}
                cy={pos[1]}
                r={13}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={5}
            />
            <text
                x={pos[0]}
                y={pos[1] - 30}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </g>
    );
}

/** Hvit lapp med farget kant og tekst. */
function Merke({
    pos,
    tekst,
    farge = '#0f172a',
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    forsinkelse?: number;
}) {
    const b = tekst.length * 21 + 50;
    return (
        <motion.g
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            <rect
                x={pos[0] - b / 2}
                y={pos[1] - 32}
                width={b}
                height={64}
                rx={16}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            <text
                x={pos[0]}
                y={pos[1] + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={36}
                fontWeight={800}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Buet linje med pilspiss som tegnes fram. */
function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
    tynn,
    stiplet,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
    tynn?: boolean;
    stiplet?: boolean;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    const s = tynn ? 0.7 : 1;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={tynn ? 6 : 10}
                strokeLinecap="round"
                strokeDasharray={stiplet ? '4 18' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d={`M ${-24 * s} ${-16 * s} L ${8 * s} 0 L ${-24 * s} ${16 * s} Z`}
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
            />
        </g>
    );
}

/** Mange prikker samlet rundt et sted. */
function Prikker({
    pos,
    antall,
    radius,
    farge,
    glede,
}: {
    pos: [number, number];
    antall: number;
    radius: number;
    farge: string;
    glede?: boolean;
}) {
    const prikker = useMemo(
        () =>
            Array.from({ length: antall }, (_, i) => {
                const vk = i * 2.399963;
                const r = radius * Math.sqrt((i + 0.5) / antall);
                return [Math.cos(vk) * r, Math.sin(vk) * r * 0.7] as [number, number];
            }),
        [antall, radius]
    );
    return (
        <g>
            {prikker.map(([dx, dy], i) => (
                <motion.circle
                    key={i}
                    cx={pos[0] + dx}
                    cy={pos[1] + dy}
                    r={7}
                    initial={{ opacity: 0, scale: 0, fill: glede ? '#16a34a' : farge }}
                    animate={{ opacity: 0.9, scale: 1, fill: farge }}
                    transition={{
                        opacity: { delay: 0.2 + (i / antall) * 1.6, duration: 0.3 },
                        scale: { delay: 0.2 + (i / antall) * 1.6, duration: 0.3 },
                        fill: { delay: glede ? 2.6 + (i / antall) * 1.5 : 0, duration: 0.6 },
                    }}
                />
            ))}
        </g>
    );
}

/** Et mål som blir truffet: en firkant som lyser opp. Ingen mennesker. */
function Mal({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    return (
        <g>
            <rect x={pos[0] - 14} y={pos[1] - 14} width={28} height={28} fill="#334155" />
            <motion.circle
                cx={pos[0]}
                cy={pos[1]}
                fill="none"
                stroke="#f97316"
                strokeWidth={6}
                initial={{ r: 4, opacity: 0 }}
                animate={{ r: [4, 46], opacity: [0.9, 0] }}
                transition={{
                    delay: forsinkelse,
                    duration: 1.4,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                }}
            />
        </g>
    );
}

/** Veien til Bagdad: stiplet, og med kryss når FN-mandatet sperrer den. */
function Vei({
    fra,
    til,
    sperret,
}: {
    fra: [number, number];
    til: [number, number];
    sperret: boolean;
}) {
    return (
        <g>
            <motion.line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={sperret ? '#a8a29e' : '#1d4ed8'}
                strokeWidth={10}
                strokeDasharray="22 16"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6 }}
                style={{ transition: 'stroke 0.8s' }}
            />
        </g>
    );
}

function Sporsmal({ pos }: { pos: [number, number] }) {
    return (
        <motion.text
            x={pos[0]}
            y={pos[1]}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={150}
            fontWeight={900}
            fill="#1d4ed8"
            stroke="#ffffff"
            strokeWidth={10}
            paintOrder="stroke"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            ?
        </motion.text>
    );
}

/** Stoppskilt ved grensen. */
function Stopp({ pos }: { pos: [number, number] }) {
    const r = 70;
    const pts = Array.from({ length: 8 }, (_, i) => {
        const a = Math.PI / 8 + (i * Math.PI) / 4;
        return `${pos[0] + Math.cos(a) * r},${pos[1] + Math.sin(a) * r}`;
    }).join(' ');
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.3 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <polygon points={pts} fill="#dc2626" stroke="#ffffff" strokeWidth={8} />
            <text
                x={pos[0]}
                y={pos[1] + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={36}
                fontWeight={900}
                fill="#ffffff"
            >
                STOPP
            </text>
        </motion.g>
    );
}

/** Palasset: tre kupler i gull. */
function Palass({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
        >
            <rect
                x={x - 80}
                y={y}
                width={160}
                height={60}
                fill="#fde68a"
                stroke="#92400e"
                strokeWidth={5}
            />
            {[-50, 0, 50].map((dx) => (
                <path
                    key={dx}
                    d={`M ${x + dx - 22} ${y} A 22 ${dx === 0 ? 34 : 24} 0 0 1 ${x + dx + 22} ${y} Z`}
                    fill={FARGE.gull}
                    stroke="#92400e"
                    strokeWidth={5}
                />
            ))}
            <text
                x={x}
                y={y + 100}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#78350f"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Saddam: fortsatt ved makten
            </text>
        </motion.g>
    );
}

/** Et opprør: pulserende ring som slukner. */
function Opprør({
    pos,
    navn,
    slukket,
    dy,
}: {
    pos: [number, number];
    navn: string;
    slukket: boolean;
    dy: number;
}) {
    return (
        <g>
            <motion.circle
                cx={pos[0]}
                cy={pos[1]}
                r={26}
                animate={{ fill: slukket ? '#78716c' : '#f97316' }}
                transition={{ duration: 0.8 }}
            />
            {!slukket && (
                <motion.circle
                    cx={pos[0]}
                    cy={pos[1]}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={6}
                    initial={{ r: 26, opacity: 0.9 }}
                    animate={{ r: 90, opacity: 0 }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                />
            )}
            <text
                x={pos[0]}
                y={pos[1] + dy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={38}
                fontWeight={800}
                fill={slukket ? '#57534e' : '#9a3412'}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </g>
    );
}

/** Sanksjonene: en rød, stiplet ring tett rundt hele landet. */
function Sperring({ sti }: { sti: string }) {
    return (
        <motion.path
            d={sti}
            fill="none"
            stroke="#dc2626"
            strokeWidth={14}
            strokeDasharray="26 14"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8 }}
        />
    );
}

/** En vareeske med rødt kryss: ingenting kommer inn. */
function Sperret({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <rect
                x={x - 34}
                y={y - 28}
                width={68}
                height={56}
                rx={6}
                fill="#b45309"
                stroke="#78350f"
                strokeWidth={5}
            />
            <line x1={x - 34} y1={y - 8} x2={x + 34} y2={y - 8} stroke="#78350f" strokeWidth={4} />
            <path
                d={`M ${x - 40} ${y - 40} L ${x + 40} ${y + 40} M ${x + 40} ${y - 40} L ${x - 40} ${y + 40}`}
                stroke="#dc2626"
                strokeWidth={12}
                strokeLinecap="round"
            />
        </motion.g>
    );
}

/** Et sykehus med tomme hyller. */
function Sykehus({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <rect
                x={x - 110}
                y={y - 80}
                width={220}
                height={160}
                rx={10}
                fill="#ffffff"
                stroke="#334155"
                strokeWidth={6}
            />
            <rect x={x - 14} y={y - 66} width={28} height={70} fill="#dc2626" />
            <rect x={x - 35} y={y - 45} width={70} height={28} fill="#dc2626" />
            {[0, 1].map((r) => (
                <line
                    key={r}
                    x1={x - 90}
                    y1={y + 30 + r * 32}
                    x2={x + 90}
                    y2={y + 30 + r * 32}
                    stroke="#94a3b8"
                    strokeWidth={6}
                />
            ))}
            <text
                x={x}
                y={y + 130}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#7f1d1d"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Tomme hyller
            </text>
        </motion.g>
    );
}

/** Sjokk og ærefrykt: store ringer rundt Bagdad. Ingen mennesker. */
function Sjokk({ pos }: { pos: [number, number] }) {
    return (
        <g>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={pos[0]}
                    cy={pos[1]}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={8}
                    initial={{ r: 20, opacity: 0 }}
                    animate={{ r: [20, 180], opacity: [0.8, 0] }}
                    transition={{
                        delay: i * 0.5,
                        duration: 1.6,
                        repeat: Infinity,
                        repeatDelay: 0.2,
                    }}
                />
            ))}
        </g>
    );
}

function Fanget({ pos, tekst }: { pos: [number, number]; tekst: string }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <circle cx={pos[0]} cy={pos[1]} r={60} fill="none" stroke="#1d4ed8" strokeWidth={12} />
            <text
                x={pos[0]}
                y={pos[1] + 105}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#1e3a8a"
                stroke="#ffffff"
                strokeWidth={9}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** En farget stripe inni Irak (klippet til landets form). */
function Sone({
    y,
    h,
    farge,
    forsinkelse = 0,
}: {
    y: number;
    h: number;
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <motion.rect
            x={0}
            y={y}
            width={B}
            height={Math.max(0, h)}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.8 }}
        />
    );
}

/** Sprekker som tegnes fram over landet. */
function Sprekker({ sti }: { sti: string }) {
    const linjer = [
        'M 0 330 L 400 360 L 700 300 L 1000 380 L 1600 340',
        'M 300 0 L 520 260 L 640 480 L 820 900',
        'M 1100 0 L 980 300 L 1100 560 L 1050 900',
        'M 0 620 L 500 580 L 900 640 L 1600 600',
    ];
    return (
        <g>
            <path d={sti} fill="none" />
            {linjer.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#44403c"
                    strokeWidth={6}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3 + i * 0.4, duration: 1.2 }}
                />
            ))}
        </g>
    );
}
