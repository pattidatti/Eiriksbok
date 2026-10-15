import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kartet over Midtøsten fra 1914 til i dag, i åtte modus:
 * «osmansk»: Det osmanske riket, folkene som bodde der, og landene som ikke fantes ennå.
 * «krig»: 1. verdenskrig. Osmanerne på Tysklands side, Storbritannia og Frankrike på den andre.
 * «lofte»: brevene til Mekka, løftet om arabiske stater og det arabiske opprøret.
 * «balfour»: brevet fra London om et jødisk hjemland i Palestina.
 * «mandat»: Paris og San Remo, og mandatene som deler området mellom britene og franskmennene.
 * «irak»: tre folkegrupper presset inn i én stat.
 * «europa»: det samme gjort med nordmenn, franskmenn og grekere.
 * «kurdere»: kurdernes område delt mellom fire land.
 * «arv»: konfliktene som har røtter i grensene.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus =
    | 'osmansk'
    | 'krig'
    | 'lofte'
    | 'balfour'
    | 'mandat'
    | 'irak'
    | 'europa'
    | 'kurdere'
    | 'arv';

const TYRKIA = 792;
const SYRIA = 760;
const LIBANON = 422;
const ISRAEL = 376;
const PALESTINA = 275;
const JORDAN = 400;
const IRAK = 368;
const KUWAIT = 414;
const SAUDI = 682;
const IRAN = 364;
const STORBRITANNIA = 826;
const FRANKRIKE = 250;
const NORGE = 578;
const HELLAS = 300;
const SENTRALMAKTER = [276, 40, 348, 203, 703];
const OSMANSK = [TYRKIA, SYRIA, LIBANON, ISRAEL, PALESTINA, JORDAN, IRAK, KUWAIT];
const ARABISK = [SYRIA, LIBANON, ISRAEL, PALESTINA, JORDAN, IRAK, SAUDI, KUWAIT];
const FRANSK_MANDAT = [SYRIA, LIBANON];
const BRITISK_MANDAT = [IRAK, ISRAEL, PALESTINA, JORDAN];

const STED = {
    london: [-0.1, 51.5] as LngLat,
    paris: [2.35, 48.85] as LngLat,
    sanremo: [7.8, 43.8] as LngLat,
    mekka: [39.8, 21.4] as LngLat,
    palestina: [35.1, 31.6] as LngLat,
    akko: [35.1, 32.9] as LngLat,
    kirkuk: [44.4, 35.5] as LngLat,
};

/** Kurdernes område, grovt tegnet: der Tyrkia, Irak, Syria og Iran møtes. */
const KURDISTAN: LngLat[] = [
    [37.2, 37.4],
    [38.6, 38.6],
    [40.6, 39.6],
    [43.4, 40],
    [45, 38.8],
    [46.6, 37],
    [47.4, 35.4],
    [46.2, 34.2],
    [44.6, 34.6],
    [43.4, 35.6],
    [42, 36.4],
    [40, 36.6],
    [38.2, 36.5],
];

/** Hijaz, kyststripa langs Rødehavet ned mot Mekka, grovt tegnet. */
const HIJAZ: LngLat[] = [
    [35, 29.4],
    [38.6, 29.4],
    [41.6, 23],
    [42.6, 17.6],
    [41.4, 17],
    [39, 21],
    [36.4, 25.6],
];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    osmansk: '#c2410c',
    osmanskLys: '#fdba74',
    tapt: '#d6d3d1',
    britisk: '#b91c1c',
    britiskLys: '#fca5a5',
    fransk: '#1d4ed8',
    franskLys: '#93c5fd',
    arabisk: '#15803d',
    arabiskLys: '#86efac',
    jodisk: '#7c3aed',
    sjia: '#16a34a',
    sunni: '#ca8a04',
    kurdisk: '#9333ea',
    europa: '#7c3aed',
    merket: '#f59e0b',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat) =>
        geoMercator().fitExtent(
            [
                [70, 150],
                [B - 70, H - 50],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    switch (modus) {
        case 'krig':
        case 'lofte':
        case 'balfour':
            return utsnitt([-12, 14], [56, 58]);
        case 'mandat':
            return utsnitt([-6, 20], [54, 56]);
        case 'irak':
            return utsnitt([36.5, 28.8], [50, 38.2]);
        case 'europa':
            return utsnitt([-14, 35], [34, 70]);
        case 'kurdere':
            return utsnitt([30, 29], [54, 42]);
        case 'arv':
            return utsnitt([28, 25], [52, 39]);
        default:
            return utsnitt([25, 15], [57, 42]);
    }
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'osmansk':
            return OSMANSK.includes(id) ? FARGE.osmansk : FARGE.land;
        case 'krig':
            if (OSMANSK.includes(id)) return FARGE.osmansk;
            if (beat >= 1 && SENTRALMAKTER.includes(id)) return FARGE.osmanskLys;
            if (beat >= 2 && id === STORBRITANNIA) return FARGE.britisk;
            if (beat >= 2 && id === FRANKRIKE) return FARGE.fransk;
            return FARGE.land;
        case 'lofte':
            if (id === STORBRITANNIA) return FARGE.britisk;
            if (beat >= 1 && ARABISK.includes(id))
                return beat >= 4 ? FARGE.arabisk : FARGE.arabiskLys;
            if (OSMANSK.includes(id)) return FARGE.osmansk;
            return FARGE.land;
        case 'balfour':
            if (id === STORBRITANNIA) return FARGE.britisk;
            if (beat >= 2 && (id === ISRAEL || id === PALESTINA)) return FARGE.jodisk;
            return FARGE.land;
        case 'mandat':
            if (beat === 0 && OSMANSK.includes(id)) return FARGE.tapt;
            if (beat >= 4 && FRANSK_MANDAT.includes(id)) return FARGE.fransk;
            if (beat >= 4 && BRITISK_MANDAT.includes(id)) return FARGE.britisk;
            if (beat >= 1 && (id === FRANKRIKE || id === STORBRITANNIA))
                return id === FRANKRIKE ? FARGE.franskLys : FARGE.britiskLys;
            if (beat >= 1 && beat < 4 && OSMANSK.includes(id)) return FARGE.tapt;
            return FARGE.land;
        case 'irak':
            return id === IRAK ? '#f5f5f4' : FARGE.land;
        case 'europa':
            if (beat >= 1 && [NORGE, FRANKRIKE, HELLAS].includes(id)) return FARGE.europa;
            return FARGE.land;
        case 'kurdere':
            if (beat >= 2 && [TYRKIA, IRAK, SYRIA, IRAN].includes(id)) return '#e7e5e4';
            return FARGE.land;
        case 'arv': {
            const rekke = [IRAK, SYRIA, LIBANON, ISRAEL];
            const i = rekke.indexOf(id === PALESTINA ? ISRAEL : id);
            if (i < 0) return FARGE.land;
            if (beat === 0) return FARGE.tapt;
            if (i + 1 === beat) return FARGE.merket;
            if (i + 1 < beat) return '#fde68a';
            return FARGE.tapt;
        }
    }
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    osmansk: [
        { tekst: 'Det osmanske riket' },
        { tekst: 'Fra Tyrkia til Arabia' },
        { tekst: 'Mange folk side om side' },
        { tekst: 'Ingen «Irak». Ingen «Syria».' },
    ],
    krig: [
        { tekst: '1914: 1. verdenskrig' },
        { tekst: 'Osmanerne velger Tysklands side' },
        { tekst: 'Mot Storbritannia og Frankrike' },
        { tekst: 'Britene ser en sjanse', rod: true },
    ],
    lofte: [
        { tekst: 'Brev til Mekka' },
        { tekst: 'Løftet: egne arabiske stater' },
        { tekst: '1916: Det arabiske opprøret' },
        { tekst: 'Tusenvis av krigere' },
        { tekst: 'Seier etter seier' },
    ],
    balfour: [
        { tekst: '1917: Et nytt løfte' },
        { tekst: 'Brev fra Balfour til Rothschild' },
        { tekst: 'Et jødisk hjemland i Palestina' },
        { tekst: 'Men folk bodde der allerede', rod: true },
    ],
    mandat: [
        { tekst: '1918: Osmanerne har tapt' },
        { tekst: 'Paris 1919 og San Remo 1920' },
        { tekst: 'Folkeforbundet lager mandater' },
        { tekst: 'Mandat = kolonistyre med et pent navn', rod: true },
        { tekst: 'Araberne får ingenting', rod: true },
    ],
    irak: [
        { tekst: 'Hvem bodde der?' },
        { tekst: 'Sør: sjiamuslimer' },
        { tekst: 'Midten: sunnimuslimer' },
        { tekst: 'Nord: kurdere' },
        { tekst: 'Tre folk, én stat', rod: true },
    ],
    europa: [
        { tekst: 'Tenk deg det samme i Europa' },
        { tekst: 'Nordmenn, franskmenn og grekere' },
        { tekst: '«Kall det hva dere vil»', rod: true },
    ],
    kurdere: [
        { tekst: 'Kurderne' },
        { tekst: 'Et stort folk uten eget land' },
        { tekst: 'Delt mellom fire land', rod: true },
        { tekst: 'Kampen fortsetter i dag' },
    ],
    arv: [
        { tekst: 'Røtter i 1916 til 1923' },
        { tekst: 'Irak: tvunget sammen' },
        { tekst: 'Syria: grenser for Frankrike' },
        { tekst: 'Libanon: borgerkrig' },
        { tekst: 'Palestina: to løfter', rod: true },
    ],
};

export function SykesPicotKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'osmansk';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    const irak = useMemo(() => geographies.find((g) => Number(g.id) === IRAK), [geographies]);

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

                {modus === 'osmansk' && (
                    <>
                        <path
                            d={
                                sti({
                                    type: 'Polygon',
                                    coordinates: [[...HIJAZ, HIJAZ[0]]],
                                } as never) ?? ''
                            }
                            fill={FARGE.osmansk}
                            stroke={FARGE.osmansk}
                            strokeWidth={2}
                        />
                        {beat >= 1 && (
                            <>
                                <Pil
                                    fra={p([37.6, 30.5])}
                                    til={p([39.4, 23])}
                                    farge="#7c2d12"
                                    bue={0.1}
                                />
                                <Etikett pos={p([41.5, 22.5])} tekst="Arabia" farge="#44403c" />
                            </>
                        )}
                        {beat === 2 && (
                            <>
                                <Etikett
                                    pos={p([41.5, 32])}
                                    tekst="Arabere"
                                    farge="#ffffff"
                                    mork
                                    forsinkelse={0.2}
                                />
                                <Etikett
                                    pos={p([44.2, 37.4])}
                                    tekst="Kurdere"
                                    farge="#ffffff"
                                    mork
                                    forsinkelse={0.6}
                                />
                                <Etikett
                                    pos={p([40.6, 40.4])}
                                    tekst="Armenere"
                                    farge="#ffffff"
                                    mork
                                    forsinkelse={1}
                                />
                                <Etikett
                                    pos={p([31.2, 31.2])}
                                    tekst="Jøder"
                                    farge="#ffffff"
                                    mork
                                    forsinkelse={1.4}
                                    linjeTil={p([35, 31.8])}
                                />
                            </>
                        )}
                        {beat >= 3 && (
                            <>
                                <Etikett pos={p([43.5, 33])} tekst="Irak?" farge="#ffffff" mork />
                                <Etikett
                                    pos={p([38.3, 35.4])}
                                    tekst="Syria?"
                                    farge="#ffffff"
                                    mork
                                    forsinkelse={0.5}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'krig' && (
                    <>
                        <Etikett pos={p([42, 30])} tekst="Osmanerne" farge="#7c2d12" />
                        {beat >= 1 && (
                            <Etikett
                                pos={p([22, 45.5])}
                                tekst="Tyskland og Østerrike-Ungarn"
                                farge="#9a3412"
                            />
                        )}
                        {beat >= 2 && (
                            <>
                                <Etikett
                                    pos={p([-11, 49.5])}
                                    tekst="Storbritannia"
                                    farge={FARGE.britisk}
                                />
                                <Etikett
                                    pos={p([-6, 44.5])}
                                    tekst="Frankrike"
                                    farge={FARGE.fransk}
                                />
                            </>
                        )}
                        {beat >= 3 && (
                            <>
                                <Pil
                                    fra={p(STED.london)}
                                    til={p([41, 25])}
                                    farge={FARGE.britisk}
                                    bue={0.18}
                                />
                                <Etikett
                                    pos={p([45, 22])}
                                    tekst="Araberne?"
                                    farge={FARGE.arabisk}
                                    stor
                                    forsinkelse={1.6}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'lofte' && (
                    <>
                        <Punkt pos={p(STED.mekka)} farge="#111827" />
                        <Etikett pos={p([34, 18.4])} tekst="Mekka" farge="#111827" />
                        <Etikett pos={p([-11, 49.5])} tekst="Storbritannia" farge={FARGE.britisk} />
                        {beat === 0 && <Brev fra={p(STED.london)} til={p(STED.mekka)} />}
                        {beat >= 1 && beat < 3 && (
                            <Etikett
                                pos={p([46, 25])}
                                tekst="Egne arabiske stater?"
                                farge={FARGE.arabisk}
                                forsinkelse={0.4}
                            />
                        )}
                        {beat === 2 && <Puls pos={p(STED.mekka)} farge={FARGE.arabisk} />}
                        {beat >= 3 && (
                            <>
                                <Pil
                                    fra={p([39.2, 23])}
                                    til={p([36.6, 31])}
                                    farge={FARGE.arabisk}
                                    bue={0.08}
                                />
                                <Pil
                                    fra={p([41, 23.5])}
                                    til={p([42.5, 31.5])}
                                    farge={FARGE.arabisk}
                                    bue={-0.08}
                                    forsinkelse={0.5}
                                />
                                <Etikett pos={p([37.5, 38.8])} tekst="Osmanerne" farge="#7c2d12" />
                                {beat === 3 && (
                                    <Etikett
                                        pos={p([24, 27])}
                                        tekst="Lawrence av Arabia"
                                        farge="#14532d"
                                        forsinkelse={1}
                                        linjeTil={p([37.6, 27])}
                                    />
                                )}
                            </>
                        )}
                        {beat >= 4 && (
                            <Etikett
                                pos={p([45, 28])}
                                tekst="For egen framtid"
                                farge="#ffffff"
                                mork
                            />
                        )}
                    </>
                )}

                {modus === 'balfour' && (
                    <>
                        <Etikett pos={p([-8, 49.5])} tekst="London" farge={FARGE.britisk} />
                        <Punkt pos={p(STED.palestina)} farge={FARGE.jodisk} />
                        {beat === 1 && <Brev fra={p(STED.london)} til={p(STED.palestina)} />}
                        {beat >= 2 && (
                            <Etikett
                                pos={p([29, 29])}
                                tekst="Palestina"
                                farge={FARGE.jodisk}
                                stor
                                linjeTil={p(STED.palestina)}
                            />
                        )}
                        {beat >= 3 && (
                            <>
                                <Etikett
                                    pos={p([44, 35])}
                                    tekst="Arabere"
                                    farge="#14532d"
                                    forsinkelse={0.2}
                                />
                                <Etikett
                                    pos={p([44, 32])}
                                    tekst="Jøder"
                                    farge={FARGE.jodisk}
                                    forsinkelse={0.7}
                                />
                                <Etikett
                                    pos={p([44, 29])}
                                    tekst="Kristne"
                                    farge="#1e3a8a"
                                    forsinkelse={1.2}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'mandat' && (
                    <>
                        {beat === 0 && (
                            <Etikett
                                pos={p([38, 35])}
                                tekst="Riket er borte"
                                farge="#44403c"
                                stor
                            />
                        )}
                        {beat >= 1 && beat < 4 && (
                            <>
                                <Punkt pos={p(STED.paris)} farge="#111827" />
                                <Etikett pos={p([-7, 48.85])} tekst="Paris 1919" farge="#111827" />
                                <Punkt pos={p(STED.sanremo)} farge="#111827" />
                                <Etikett
                                    pos={p([9, 40.6])}
                                    tekst="San Remo 1920"
                                    farge="#111827"
                                    forsinkelse={0.6}
                                />
                            </>
                        )}
                        {(beat === 2 || beat === 3) && (
                            <Etikett pos={p([40, 33])} tekst="Mandater" farge="#44403c" stor />
                        )}
                        {beat >= 4 && (
                            <>
                                <Linje fra={p(STED.akko)} til={p(STED.kirkuk)} />
                                <Etikett
                                    pos={p([27, 40.5])}
                                    tekst="Frankrike: Syria og Libanon"
                                    farge={FARGE.fransk}
                                    linjeTil={p([37.5, 35])}
                                />
                                <Etikett
                                    pos={p([44, 25])}
                                    tekst="Storbritannia: Irak og Palestina"
                                    farge={FARGE.britisk}
                                    forsinkelse={0.6}
                                    linjeTil={p([43.5, 32])}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'irak' && irak && <IrakBand irak={irak} sti={sti} p={p} beat={beat} />}

                {modus === 'europa' && (
                    <>
                        {beat >= 1 && (
                            <>
                                <Etikett pos={p([9, 62.5])} tekst="Nordmenn" farge="#ffffff" mork />
                                <Etikett
                                    pos={p([2.5, 46.6])}
                                    tekst="Franskmenn"
                                    farge="#ffffff"
                                    mork
                                    forsinkelse={0.5}
                                />
                                <Etikett
                                    pos={p([22, 39.6])}
                                    tekst="Grekere"
                                    farge="#ffffff"
                                    mork
                                    forsinkelse={1}
                                />
                            </>
                        )}
                        {beat >= 2 && (
                            <>
                                <Lenke
                                    punkter={[p([9, 61]), p([2.5, 47]), p([22, 39.5]), p([9, 61])]}
                                />
                                <Etikett
                                    pos={p([16, 52])}
                                    tekst="Ett land?"
                                    farge={FARGE.europa}
                                    stor
                                    forsinkelse={1.2}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'kurdere' && (
                    <>
                        <Omrade sti={sti} ring={KURDISTAN} farge={FARGE.kurdisk} />
                        <Etikett pos={p([42.3, 37.6])} tekst="Kurdere" farge="#ffffff" mork stor />
                        {beat >= 2 && (
                            <>
                                <Etikett
                                    pos={p([33, 39.5])}
                                    tekst="Tyrkia"
                                    farge="#44403c"
                                    forsinkelse={0.2}
                                />
                                <Etikett
                                    pos={p([43, 31.5])}
                                    tekst="Irak"
                                    farge="#44403c"
                                    forsinkelse={0.7}
                                />
                                <Etikett
                                    pos={p([37.4, 33.6])}
                                    tekst="Syria"
                                    farge="#44403c"
                                    forsinkelse={1.2}
                                />
                                <Etikett
                                    pos={p([52.5, 33])}
                                    tekst="Iran"
                                    farge="#44403c"
                                    forsinkelse={1.7}
                                />
                            </>
                        )}
                        {beat >= 3 && <Puls pos={p([42.3, 37.6])} farge={FARGE.kurdisk} />}
                    </>
                )}

                {modus === 'arv' && (
                    <>
                        {beat >= 1 && (
                            <Etikett
                                pos={p([47.5, 29.5])}
                                tekst="Irak"
                                farge={beat === 1 ? '#78350f' : '#a16207'}
                                stor={beat === 1}
                                linjeTil={p([43.5, 33])}
                            />
                        )}
                        {beat >= 2 && (
                            <Etikett
                                pos={p([43.5, 37.8])}
                                tekst="Syria"
                                farge={beat === 2 ? '#78350f' : '#a16207'}
                                stor={beat === 2}
                                linjeTil={p([38.6, 35.2])}
                            />
                        )}
                        {beat >= 3 && (
                            <Etikett
                                pos={p([31, 35.5])}
                                tekst="Libanon"
                                farge={beat === 3 ? '#78350f' : '#a16207'}
                                stor={beat === 3}
                                linjeTil={p([35.8, 33.9])}
                            />
                        )}
                        {beat >= 4 && (
                            <Etikett
                                pos={p([31, 30])}
                                tekst="Palestina"
                                farge="#78350f"
                                stor
                                linjeTil={p([35, 31.5])}
                            />
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
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Irak med tre belter: sjia i sør, sunni i midten, kurdere i nord. Grovt tegnet etter breddegrad. */
function IrakBand({
    irak,
    sti,
    p,
    beat,
}: {
    irak: unknown;
    sti: GeoPath;
    p: (ll: LngLat) => [number, number];
    beat: number;
}) {
    const d = sti(irak as never) ?? '';
    const yNord = p([44, 35.5])[1];
    const ySor = p([44, 33])[1];
    const band = [
        { fra: ySor, til: H, farge: FARGE.sjia, tekst: 'Sjia', pos: p([46, 31]), vis: beat >= 1 },
        {
            fra: yNord,
            til: ySor,
            farge: FARGE.sunni,
            tekst: 'Sunni',
            pos: p([42.5, 34.2]),
            vis: beat >= 2,
        },
        {
            fra: 0,
            til: yNord,
            farge: FARGE.kurdisk,
            tekst: 'Kurdere',
            pos: p([44, 36.6]),
            vis: beat >= 3,
        },
    ];
    return (
        <g>
            <defs>
                <clipPath id="sykes-picot-irak">
                    <path d={d} />
                </clipPath>
            </defs>
            <g clipPath="url(#sykes-picot-irak)">
                {band.map((b) => (
                    <motion.rect
                        key={b.tekst}
                        x={0}
                        width={B}
                        y={b.fra}
                        height={b.til - b.fra}
                        fill={b.farge}
                        initial={false}
                        animate={{ opacity: b.vis ? 0.85 : 0 }}
                        transition={{ duration: 0.9 }}
                    />
                ))}
            </g>
            <motion.path
                d={d}
                fill="none"
                stroke="#111827"
                strokeLinejoin="round"
                animate={{ strokeWidth: beat >= 4 ? [6, 12, 6] : 6 }}
                transition={beat >= 4 ? { duration: 1.6, repeat: Infinity } : { duration: 0.4 }}
            />
            {beat === 0 && <Etikett pos={p([43.8, 33.4])} tekst="Irak" farge="#111827" stor />}
            {band.map((b) =>
                b.vis ? (
                    <Etikett key={b.tekst} pos={b.pos} tekst={b.tekst} farge="#ffffff" mork stor />
                ) : null
            )}
        </g>
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
    mork,
    forsinkelse = 0,
    linjeTil,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    /** Hvit tekst med mørk kant, til bruk oppå fargede land. */
    mork?: boolean;
    forsinkelse?: number;
    /** Tegner en tynn strek fra etiketten til et punkt, for små land. */
    linjeTil?: [number, number];
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
        >
            {linjeTil && (
                <>
                    <line
                        x1={pos[0]}
                        y1={pos[1]}
                        x2={linjeTil[0]}
                        y2={linjeTil[1]}
                        stroke="#1f2937"
                        strokeWidth={4}
                    />
                    <circle cx={linjeTil[0]} cy={linjeTil[1]} r={8} fill="#1f2937" />
                </>
            )}
            <text
                x={pos[0]}
                y={pos[1]}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={stor ? 56 : 40}
                fontWeight={900}
                fill={farge}
                stroke={mork ? '#1f2937' : '#ffffff'}
                strokeWidth={9}
                paintOrder="stroke"
            >
                {tekst}
            </text>
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
                transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -22 -14 L 6 0 L -22 14 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
            />
        </g>
    );
}

/** En stiplet rute med en konvolutt som reiser langs den. */
function Brev({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const mx = (fra[0] + til[0]) / 2 + (til[1] - fra[1]) * 0.2;
    const my = (fra[1] + til[1]) / 2 - (til[0] - fra[0]) * 0.2;
    const d = `M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke="#334155"
                strokeWidth={5}
                strokeDasharray="14 12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            />
            <g
                style={
                    {
                        offsetPath: `path('${d}')`,
                        animation: 'sykes-picot-brev 2.2s ease-in-out forwards',
                    } as never
                }
            >
                <rect
                    x={-34}
                    y={-22}
                    width={68}
                    height={44}
                    rx={4}
                    fill="#fffbeb"
                    stroke="#78350f"
                    strokeWidth={4}
                />
                <path d="M -34 -22 L 0 6 L 34 -22" fill="none" stroke="#78350f" strokeWidth={4} />
            </g>
            <style>{`@keyframes sykes-picot-brev { from { offset-distance: 0%; } to { offset-distance: 100%; } }`}</style>
        </g>
    );
}

function Punkt({ pos, farge }: { pos: [number, number]; farge: string }) {
    return <circle cx={pos[0]} cy={pos[1]} r={13} fill={farge} stroke="#ffffff" strokeWidth={5} />;
}

/** Sykes-Picot-linja: en rett strek, trukket med linjal. */
function Linje({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    return (
        <motion.line
            x1={fra[0]}
            y1={fra[1]}
            x2={til[0]}
            y2={til[1]}
            stroke="#111827"
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray="1 0"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.4 }}
        />
    );
}

function Lenke({ punkter }: { punkter: [number, number][] }) {
    const d = punkter.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={FARGE.europa}
            strokeWidth={7}
            strokeDasharray="20 14"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6 }}
        />
    );
}

function Omrade({ sti, ring, farge }: { sti: GeoPath; ring: LngLat[]; farge: string }) {
    const d = sti({ type: 'Polygon', coordinates: [[...ring, ring[0]]] } as never) ?? '';
    return (
        <motion.path
            d={d}
            fill={farge}
            fillOpacity={0.55}
            stroke={farge}
            strokeWidth={5}
            strokeDasharray="12 8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        />
    );
}

function Puls({ pos, farge }: { pos: [number, number]; farge: string }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ r: 40, opacity: 0.9 }}
            animate={{ r: 220, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}
