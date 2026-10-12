import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kartet over den nye verdensordenen, i åtte modus:
 * «start»: USA alene på toppen i 2000, så makten i bevegelse og flere poler i 2026.
 * «brics»: de fem BRICS-landene, egen bank, nye medlemmer i 2024 og 2025.
 * «belte»: Belte og vei - ruter ut fra Kina til havner og jernbaner.
 * «ressurser»: olje, sjeldne jordarter i Kina, kobolt i Kongo, databrikker på Taiwan.
 * «pandemi»: forsyningskjedene fra Kina ryker, og produksjonen flytter hjem.
 * «blokker»: Russland mot Vesten, landene som ikke velger side, og vendingen østover.
 * «gass»: gassen til Europa, der Norge og Russland bytter plass i 2022.
 * «mobil»: mobilen som verdenspolitikk - linjer fra landene delene kommer fra.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'start' | 'brics' | 'belte' | 'ressurser' | 'pandemi' | 'blokker' | 'gass' | 'mobil';

const ID = {
    usa: 840,
    kina: 156,
    india: 356,
    brasil: 76,
    russland: 643,
    sorafrika: 710,
    egypt: 818,
    etiopia: 231,
    iran: 364,
    emiratene: 784,
    indonesia: 360,
    srilanka: 144,
    kongo: 180,
    taiwan: 158,
    ukraina: 804,
    norge: 578,
};
const BRICS_FEM = [ID.brasil, ID.russland, ID.india, ID.kina, ID.sorafrika];
const BRICS_2024 = [ID.egypt, ID.etiopia, ID.iran, ID.emiratene];
/** Vesten: landene som sto bak sanksjonene (Nord-Amerika, Europa, Japan, Sør-Korea, Australia, New Zealand). */
const VESTEN = [
    840, 124, 826, 250, 276, 380, 724, 620, 528, 56, 442, 208, 578, 752, 246, 352, 372, 40, 756, 616, 203,
    703, 348, 642, 100, 300, 233, 428, 440, 705, 191, 70, 8, 807, 688, 499, 392, 410, 36, 554,
];
/** Europa (uten Russland, Ukraina og Belarus), for gass-kartet og pandemien. */
const EUROPA = [
    826, 250, 276, 380, 724, 620, 528, 56, 442, 208, 578, 752, 246, 352, 372, 40, 756, 616, 203, 703, 348,
    642, 100, 300, 233, 428, 440, 705, 191, 70, 8, 807, 688, 499, 498,
];

const STED = {
    usa: [-98, 39] as LngLat,
    kina: [104, 34] as LngLat,
    india: [79, 22] as LngLat,
    brasil: [-52, -10] as LngLat,
    russland: [60, 60] as LngLat,
    sorafrika: [24, -29] as LngLat,
    shanghai: [121.5, 31] as LngLat,
    srilanka: [81, 7.5] as LngLat,
    kongo: [23, -3] as LngLat,
    taiwan: [121, 23.7] as LngLat,
    midtosten: [47, 27] as LngLat,
    europa: [8, 50] as LngLat,
    norge: [8, 61] as LngLat,
    nordsjoen: [3, 57] as LngLat,
    tyskland: [10.5, 51.5] as LngLat,
    russlandVest: [42, 56] as LngLat,
    ukraina: [31, 49] as LngLat,
};

/** Belte og vei: én rute over land og én sjøvei, pluss greiner ut til mange land. */
const BELTE_LAND: LngLat[] = [STED.kina, [75, 43], [55, 47], [30, 52], [8, 51]];
const BELTE_SJO: LngLat[] = [STED.shanghai, [104, 1.5], [81, 6], [56, 15], [43, 12], [33, 30], [23.7, 37.9]];
const BELTE_GREINER: [LngLat, LngLat][] = [
    [[81, 6], [39.7, -4]],
    [[43, 12], [38.7, 9]],
    [[104, 1.5], [110, -7]],
    [[75, 43], [67, 30]],
    [[56, 15], [58, 23]],
    [[43, 12], [3.4, 6.4]],
    [[104, 1.5], [-77, -12]],
    [[104, 34], [100, 18]],
];

const FARGE = {
    land: '#efe7d6',
    blek: '#f5f1e8',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    usa: '#2563eb',
    kina: '#dc2626',
    india: '#ea580c',
    brics: '#ca8a04',
    bricsNy: '#facc15',
    russland: '#7f1d1d',
    ukraina: '#facc15',
    vesten: '#60a5fa',
    noytral: '#c4b5fd',
    norge: '#0f766e',
    kongo: '#0d9488',
    taiwan: '#7c3aed',
    olje: '#1f2937',
    stengt: '#9ca3af',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat, p: GeoProjection) =>
        p.fitExtent(
            [
                [40, 40],
                [B - 40, H - 40],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    if (modus === 'gass') return utsnitt([-14, 40], [62, 70], geoMercator());
    return utsnitt([-150, -45], [170, 72], geoNaturalEarth1());
}

/** Hvor kameraet ser (midtpunkt og zoom) per modus og beat. */
function visningFor(modus: Modus, beat: number): { midt: LngLat | null; zoom: number } {
    if (modus === 'belte' && beat >= 1 && beat <= 2) return { midt: [70, 25], zoom: 1.9 };
    if (modus === 'ressurser' && beat === 1) return { midt: [104, 32], zoom: 2.2 };
    if (modus === 'ressurser' && beat === 2) return { midt: [22, -3], zoom: 2.4 };
    if (modus === 'ressurser' && beat === 3) return { midt: [118, 25], zoom: 2.6 };
    if (modus === 'blokker' && beat <= 1) return { midt: [32, 52], zoom: 2.2 };
    return { midt: null, zoom: 1 };
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'start':
            if (beat === 0) return FARGE.land;
            if (beat <= 2) return id === ID.usa ? FARGE.usa : FARGE.blek;
            if (id === ID.usa) return FARGE.usa;
            if (id === ID.kina) return FARGE.kina;
            if (id === ID.india) return FARGE.india;
            return FARGE.land;
        case 'brics':
            if (beat === 0) return [ID.kina, ID.india, ID.brasil].includes(id) ? FARGE.brics : FARGE.land;
            if (BRICS_FEM.includes(id)) return FARGE.brics;
            if (beat >= 3 && BRICS_2024.includes(id)) return FARGE.bricsNy;
            if (beat >= 4 && id === ID.indonesia) return FARGE.bricsNy;
            return FARGE.land;
        case 'belte':
            if (id === ID.kina) return FARGE.kina;
            if (beat >= 3 && id === ID.srilanka) return '#fca5a5';
            return FARGE.land;
        case 'ressurser':
            if (beat === 0 || beat === 4) {
                if ([682, 368, 364, 414, 784, 634, 512].includes(id)) return '#57534e';
                if (beat === 4 && (id === ID.russland || id === ID.norge)) return '#57534e';
            }
            if (beat >= 1 && id === ID.kina) return FARGE.kina;
            if (beat >= 2 && id === ID.kongo) return FARGE.kongo;
            if (beat >= 3 && id === ID.taiwan) return FARGE.taiwan;
            return FARGE.land;
        case 'pandemi':
            if (id === ID.kina) return beat === 0 ? FARGE.stengt : beat === 4 ? '#fca5a5' : FARGE.stengt;
            if (beat >= 1 && beat <= 3 && (id === ID.usa || EUROPA.includes(id))) return '#fecaca';
            if (beat === 4 && (id === ID.usa || EUROPA.includes(id))) return '#bfdbfe';
            return FARGE.land;
        case 'blokker':
            if (id === ID.russland) return FARGE.russland;
            if (id === ID.ukraina) return FARGE.ukraina;
            if (beat >= 1 && VESTEN.includes(id)) return FARGE.vesten;
            if (beat >= 4 && (id === ID.kina || id === ID.india)) return '#fca5a5';
            if (beat >= 3 && id !== 304 && id !== 10) return FARGE.noytral;
            return FARGE.land;
        case 'gass':
            if (id === ID.norge) return FARGE.norge;
            if (id === ID.russland) return beat >= 2 ? '#d6b4b4' : FARGE.russland;
            if (EUROPA.includes(id)) return '#dbeafe';
            return FARGE.land;
        case 'mobil':
            if (beat <= 1) {
                if (id === ID.usa) return FARGE.usa;
                if (id === ID.kina) return FARGE.kina;
                if (id === ID.india) return FARGE.india;
                if (beat === 1 && BRICS_FEM.includes(id)) return FARGE.brics;
                return FARGE.land;
            }
            if (id === ID.kina) return FARGE.kina;
            if (beat >= 3 && id === ID.kongo) return FARGE.kongo;
            if (beat >= 3 && id === ID.taiwan) return FARGE.taiwan;
            if (beat >= 3 && id === ID.usa) return FARGE.usa;
            return FARGE.blek;
    }
}

const BRIKKER: Record<Modus, (string | [string, 'rod'])[]> = {
    start: ['Hvem bestemmer i verden?', 'År 2000: én sjef', 'Amerikanske regler', '2026: makten flytter seg', 'En multipolar verden'],
    brics: ['Etter 2008: nye klubber', 'B R I C S', '2015: egen bank', '1. januar 2024: fire nye', '2025: Indonesia', 'Vi vil sitte ved bordet'],
    belte: ['Kina', '2013: Belte og vei', 'Havner, jernbaner, motorveier', 'Rundt 150 land', 'En gyllen sjanse?'],
    ressurser: ['Før: olje', 'Sjeldne jordarter', 'Kobolt til batterier', 'Databrikker', 'Olje og gass: fortsatt makt'],
    pandemi: [['2020: fabrikkene stopper', 'rod'], ['Munnbind og databrikker mangler', 'rod'], ['Bilfabrikker stanser', 'rod'], 'Lange, sårbare kjeder', 'Produksjonen flytter hjem'],
    blokker: [['24. februar 2022', 'rod'], 'Vesten: sanksjoner', 'Penger som våpen', 'Mange velger ingen side', 'Russland vender seg østover'],
    gass: ['Lite land, store ressurser', 'Før 2022: Russland nr. 1', 'Etter 2022: Norge nr. 1', 'Regler alle følger', 'Hvis de store slutter å bry seg?'],
    mobil: ['2026: ingen sjef alene', 'Flere maktsentre', 'Verdenspolitikk i hånda', 'Hvor mobilen kommer fra'],
};

export function VerdensordenKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'start';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const mål = visningFor(modus, beat);
    const målPx: [number, number] = mål.midt ? p(mål.midt) : [B / 2, H / 2];
    const [vis, setVis] = useState({ x: målPx[0], y: målPx[1], k: mål.zoom });
    const visRef = useRef(vis);
    useEffect(() => {
        if (!playing) {
            // På pause (og ved hopp) står kartet rett på målet.
            const ny = { x: målPx[0], y: målPx[1], k: mål.zoom };
            visRef.current = ny;
            setVis(ny);
            return;
        }
        let raf = 0;
        let sist = performance.now();
        const steg = (n: number) => {
            const dt = Math.min(0.05, (n - sist) / 1000);
            sist = n;
            const a = 1 - Math.exp(-1.6 * dt);
            const c = visRef.current;
            const ny = {
                x: c.x + (målPx[0] - c.x) * a,
                y: c.y + (målPx[1] - c.y) * a,
                k: c.k + (mål.zoom - c.k) * a,
            };
            visRef.current = ny;
            setVis(ny);
            if (Math.abs(ny.k - mål.zoom) > 0.002 || Math.abs(ny.x - målPx[0]) > 0.5 || Math.abs(ny.y - målPx[1]) > 0.5)
                raf = requestAnimationFrame(steg);
        };
        raf = requestAnimationFrame(steg);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [beat, playing, modus, målPx[0], målPx[1], mål.zoom]);

    const kartTransform = `translate(${B / 2 - vis.x * vis.k} ${H / 2 - vis.y * vis.k}) scale(${vis.k})`;
    const s = (ll: LngLat): [number, number] => {
        const [x, y] = p(ll);
        return [B / 2 + (x - vis.x) * vis.k, H / 2 + (y - vis.y) * vis.k];
    };
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    const [brikkeTekst, brikkeFarge] = Array.isArray(brikke) ? brikke : [brikke, undefined];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <g transform={kartTransform}>
                    <Land geographies={geographies} sti={sti} farge={(id) => fargeFor(modus, beat, id)} nokkel={`${modus}-${beat}`} />
                </g>

                {modus === 'start' && (
                    <>
                        {beat === 0 && <Spørsmål pos={s([-20, 30])} />}
                        {beat >= 1 && <Etikett pos={s(STED.usa)} tekst="USA" farge="#1e3a8a" stor />}
                        {beat === 2 &&
                            [STED.brasil, STED.europa, STED.india, STED.sorafrika, STED.kina, [139, 36] as LngLat].map((ll, i) => (
                                <Pil key={i} fra={s(STED.usa)} til={s(ll)} farge="#2563eb" forsinkelse={i * 0.25} bue={-0.12} tynn />
                            ))}
                        {beat >= 3 && <Ringer pos={s(STED.usa)} farge={FARGE.usa} />}
                        {beat >= 3 && <Ringer pos={s(STED.kina)} farge={FARGE.kina} />}
                        {beat >= 3 && <Ringer pos={s(STED.india)} farge={FARGE.india} />}
                        {beat >= 3 && <Etikett pos={s(STED.kina)} tekst="Kina" farge="#991b1b" stor />}
                        {beat >= 3 && <Etikett pos={s(STED.india)} tekst="India" farge="#9a3412" dy={50} />}
                        </>
                )}

                {modus === 'brics' && (
                    <>
                        {beat === 0 &&
                            [STED.kina, STED.india, STED.brasil].map((ll, i) => <Spørsmål key={i} pos={s(ll)} liten forsinkelse={i * 0.4} />)}
                        {beat >= 1 && (
                            <>
                                <Bokstav pos={s(STED.brasil)} tekst="B" forsinkelse={0} />
                                <Bokstav pos={s(STED.russland)} tekst="R" forsinkelse={0.4} />
                                <Bokstav pos={s(STED.india)} tekst="I" forsinkelse={0.8} />
                                <Bokstav pos={s(STED.kina)} tekst="C" forsinkelse={1.2} />
                                <Bokstav pos={s(STED.sorafrika)} tekst="S" forsinkelse={1.6} />
                            </>
                        )}
                        {beat === 2 &&
                            [
                                [STED.brasil, STED.sorafrika],
                                [STED.sorafrika, STED.india],
                                [STED.india, STED.kina],
                                [STED.kina, STED.russland],
                                [STED.russland, STED.brasil],
                            ].map(([a, b], i) => <Pil key={i} fra={s(a as LngLat)} til={s(b as LngLat)} farge="#a16207" forsinkelse={i * 0.3} bue={0.15} tynn />)}
                        {beat === 2 && <Bank pos={s([-25, 10])} />}
                        {beat >= 5 && <Etikett pos={s([-25, -50])} tekst="Landene i sør" farge="#854d0e" />}
                    </>
                )}

                {modus === 'belte' && (
                    <>
                        {beat >= 1 && <Rute punkter={BELTE_LAND.map(s)} farge={FARGE.kina} />}
                        {beat >= 1 && <Rute punkter={BELTE_SJO.map(s)} farge="#b91c1c" stiplet forsinkelse={0.6} />}
                        {beat >= 2 &&
                            [BELTE_LAND[BELTE_LAND.length - 1], ...BELTE_SJO.slice(1)].map((ll, i) => (
                                <Bygg key={i} pos={s(ll)} forsinkelse={0.3 + i * 0.2} type={i % 3} />
                            ))}
                        {beat >= 3 &&
                            BELTE_GREINER.map(([a, b], i) => <Pil key={i} fra={s(a)} til={s(b)} farge="#ef4444" forsinkelse={i * 0.2} bue={0.12} tynn />)}
                        {beat >= 3 && <Nål pos={s(STED.srilanka)} tekst="Sri Lanka" under />}
                    </>
                )}

                {modus === 'ressurser' && (
                    <>
                        {(beat === 0 || beat === 4) && <Fat pos={s(STED.midtosten)} />}
                        {beat === 4 && <Fat pos={s([90, 52])} />}
                        {beat === 4 && <Fat pos={s([5, 62])} />}
                        {beat >= 1 && beat <= 2 && <Merke pos={s(STED.kina)} tekst="70 %" undertekst="jordarter" farge={FARGE.kina} />}
                        {beat >= 2 && beat <= 3 && <Merke pos={s(STED.kongo)} tekst="3 av 4" undertekst="kobolt" farge={FARGE.kongo} />}
                        {beat === 3 && <Merke pos={s([132, 18])} tekst="Brikker" undertekst="Taiwan" farge={FARGE.taiwan} />}
                    </>
                )}

                {modus === 'pandemi' && (
                    <>
                        {beat <= 3 &&
                            [STED.europa, STED.usa].map((til, i) => (
                                <Kjede key={`${i}-${beat >= 1}`} fra={s(STED.kina)} til={s(til)} brutt={beat >= 1} forsinkelse={i * 0.4} />
                            ))}
                        {beat === 0 && <Kryss pos={s(STED.kina)} />}
                        {beat === 2 && <Bil pos={s([2, 30])} />}
                        {beat === 2 && <Bil pos={s([-90, 40])} />}
                        {beat === 3 &&
                            [
                                [STED.kina, [104, 15]],
                                [[104, 15], STED.india],
                                [STED.india, [45, 25]],
                                [[45, 25], STED.europa],
                            ].map(([a, b], i) => <Pil key={i} fra={s(a as LngLat)} til={s(b as LngLat)} farge="#7c2d12" forsinkelse={0.4 + i * 0.5} bue={0.18} tynn />)}
                        {beat === 4 && <Hjem pos={s(STED.europa)} />}
                        {beat === 4 && <Hjem pos={s([-92, 40])} />}
                    </>
                )}

                {modus === 'blokker' && (
                    <>
                        {beat === 0 && <Etikett pos={s(STED.ukraina)} tekst="Ukraina" farge="#1e3a8a" dy={10} />}
                        {beat <= 1 && <Etikett pos={s(beat === 0 ? STED.russlandVest : [52, 58])} tekst="Russland" farge="#7f1d1d" />}
                        {beat === 1 && <Etikett pos={s([12, 47])} tekst="Vesten" farge="#1e3a8a" stor />}
                        {beat === 1 && <Mur fra={s([31, 69])} til={s([32, 55])} />}
                        {beat === 1 && <Mur fra={s([34, 53])} til={s([40, 46.5])} />}
                        {beat === 2 && <Mynt pos={s([15, 30])} />}
                        {beat >= 3 && <Etikett pos={s([20, 2])} tekst="Velger ingen side" farge="#5b21b6" />}
                        {beat === 4 && (
                            <>
                                <Pil fra={s([80, 58])} til={s([108, 36])} farge="#7f1d1d" bue={-0.1} />
                                <Pil fra={s([70, 55])} til={s([78, 24])} farge="#7f1d1d" bue={0.1} forsinkelse={0.5} />
                            </>
                        )}
                    </>
                )}

                {modus === 'gass' && (
                    <>
                        <Etikett pos={s(STED.norge)} tekst="Norge" farge="#134e4a" dy={-10} />
                        <Etikett pos={s([48, 60])} tekst="Russland" farge="#7f1d1d" />
                        {beat >= 1 && beat <= 4 && (
                            <>
                                <Ror fra={s([6, 60])} til={s([8.5, 53.5])} tykk={beat >= 2 ? 30 : 16} farge={FARGE.norge} nummer={beat >= 2 ? 1 : 2} />
                                <Ror
                                    fra={s([36, 56])}
                                    til={s([14, 52.5])}
                                    tykk={beat >= 2 ? 6 : 30}
                                    farge={beat >= 2 ? '#a8a29e' : FARGE.russland}
                                    nummer={beat >= 2 ? null : 1}
                                />
                            </>
                        )}
                        {beat === 0 && (
                            <>
                                <Fat pos={s([3, 59])} />
                                <Etikett pos={s([-4, 66])} tekst="olje, gass, fisk" farge="#134e4a" />
                            </>
                        )}
                        {beat === 3 && <Etikett pos={s([2, 46])} tekst="FN og avtaler" farge="#1e3a8a" stor />}
                        {beat === 4 && <Spørsmål pos={s([20, 47])} />}
                    </>
                )}

                {modus === 'mobil' && (
                    <>
                        {beat <= 1 && <Ringer pos={s(STED.usa)} farge={FARGE.usa} />}
                        {beat <= 1 && <Ringer pos={s(STED.kina)} farge={FARGE.kina} />}
                        {beat <= 1 && <Ringer pos={s(STED.india)} farge={FARGE.india} />}
                        {beat <= 1 && <Etikett pos={s(STED.usa)} tekst="USA" farge="#1e3a8a" stor />}
                        {beat <= 1 && <Etikett pos={s(STED.kina)} tekst="Kina" farge="#991b1b" stor />}
                        {beat <= 1 && <Etikett pos={s(STED.india)} tekst="India" farge="#9a3412" dy={50} />}
                        {beat === 1 && <Etikett pos={s(STED.brasil)} tekst="BRICS" farge="#854d0e" />}
                        {beat >= 2 && <Mobil pos={[800, 500]} />}
                        {beat >= 3 && (
                            <>
                                <Kilde fra={s(STED.kina)} til={[820, 440]} tekst="jordarter" farge={FARGE.kina} forsinkelse={0} />
                                <Kilde fra={s(STED.kongo)} til={[800, 560]} tekst="kobolt" farge={FARGE.kongo} forsinkelse={0.6} />
                                <Kilde fra={s(STED.taiwan)} til={[850, 500]} tekst="brikker" farge={FARGE.taiwan} forsinkelse={1.2} />
                                <Kilde fra={s(STED.usa)} til={[760, 470]} tekst="programvare" farge={FARGE.usa} forsinkelse={1.8} />
                            </>
                        )}
                    </>
                )}
            </svg>

            <AnimatePresence>
                <Brikke key={`${modus}-${beat}`} tekst={brikkeTekst} farge={brikkeFarge} />
            </AnimatePresence>
            {modus === 'belte' && beat === 3 && (
                <div className="absolute bottom-[8%] left-[6%]">
                    <Teller verdi={150} etikett="land har skrevet under" prefiks="ca. " forsinkelse={0.4} />
                </div>
            )}
            {modus === 'brics' && beat >= 4 && (
                <div className="absolute bottom-[5%] right-[3%]">
                    <Halvparten />
                </div>
            )}
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

const TEKSTKANT = { stroke: '#ffffff', strokeWidth: 8, paintOrder: 'stroke' as const };

function Etikett({ pos, tekst, farge = '#0f172a', stor, dy = 0 }: { pos: [number, number]; tekst: string; farge?: string; stor?: boolean; dy?: number }) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            x={pos[0]}
            y={pos[1] + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 52 : 38}
            fontWeight={900}
            fill={farge}
            {...TEKSTKANT}
        >
            {tekst}
        </motion.text>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
    tynn,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
    tynn?: boolean;
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
                strokeWidth={tynn ? 4 : 7}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d={tynn ? 'M -13 -9 L 3 0 L -13 9 Z' : 'M -18 -12 L 4 0 L -18 12 Z'}
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
            />
        </g>
    );
}

function Rute({ punkter, farge, stiplet, forsinkelse = 0 }: { punkter: [number, number][]; farge: string; stiplet?: boolean; forsinkelse?: number }) {
    const d = punkter.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
    return (
        <g>
            <motion.path d={d} fill="none" stroke="#ffffff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, delay: forsinkelse }} />
            <motion.path
                d={d}
                fill="none"
                stroke={farge}
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={stiplet ? '2 16' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, delay: forsinkelse }}
            />
        </g>
    );
}

function Nål({ pos, tekst, under }: { pos: [number, number]; tekst: string; under?: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <circle cx={pos[0]} cy={pos[1]} r={12} fill="#0f172a" stroke="#ffffff" strokeWidth={4} />
            <text x={pos[0]} y={pos[1] + (under ? 54 : -26)} textAnchor="middle" fontSize={36} fontWeight={900} fill="#0f172a" {...TEKSTKANT}>
                {tekst}
            </text>
        </motion.g>
    );
}

/** Ringer som pulserer ut fra et maktsenter. */
function Ringer({ pos, farge }: { pos: [number, number]; farge: string }) {
    return (
        <g>
            {[0, 1].map((i) => (
                <motion.circle
                    key={i}
                    cx={pos[0]}
                    cy={pos[1]}
                    fill="none"
                    stroke={farge}
                    strokeWidth={5}
                    initial={{ r: 20, opacity: 0.9 }}
                    animate={{ r: 160, opacity: 0 }}
                    transition={{ duration: 2.6, delay: i * 1.3, repeat: Infinity, ease: 'easeOut' }}
                />
            ))}
        </g>
    );
}

function Spørsmål({ pos, liten, forsinkelse = 0 }: { pos: [number, number]; liten?: boolean; forsinkelse?: number }) {
    const r = liten ? 42 : 80;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + forsinkelse, type: 'spring', stiffness: 180, damping: 12 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <circle cx={pos[0]} cy={pos[1]} r={r} fill="#ffffff" stroke="#0f172a" strokeWidth={6} />
            <text x={pos[0]} y={pos[1] + r * 0.38} textAnchor="middle" fontSize={r * 1.15} fontWeight={900} fill="#0f172a">
                ?
            </text>
        </motion.g>
    );
}

function Bokstav({ pos, tekst, forsinkelse }: { pos: [number, number]; tekst: string; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + forsinkelse, type: 'spring', stiffness: 220, damping: 13 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <circle cx={pos[0]} cy={pos[1]} r={38} fill="#854d0e" stroke="#ffffff" strokeWidth={5} />
            <text x={pos[0]} y={pos[1] + 17} textAnchor="middle" fontSize={50} fontWeight={900} fill="#ffffff">
                {tekst}
            </text>
        </motion.g>
    );
}

/** En bankbygning med søyler: BRICS-landenes egen bank. */
function Bank({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
            <rect x={x - 110} y={y - 120} width={220} height={190} rx={18} fill="#ffffff" stroke="#854d0e" strokeWidth={5} />
            <path d={`M ${x - 80} ${y - 50} L ${x} ${y - 95} L ${x + 80} ${y - 50} Z`} fill="#ca8a04" />
            {[-60, -20, 20, 60].map((dx) => (
                <rect key={dx} x={x + dx - 8} y={y - 45} width={16} height={60} fill="#ca8a04" />
            ))}
            <rect x={x - 85} y={y + 18} width={170} height={12} fill="#ca8a04" />
            <text x={x} y={y + 58} textAnchor="middle" fontSize={26} fontWeight={800} fill="#854d0e">
                Ny bank
            </text>
        </motion.g>
    );
}

/** Kran, jernbane eller vei, tegnet som et lite ikon der Kina bygger. */
function Bygg({ pos, forsinkelse, type }: { pos: [number, number]; forsinkelse: number; type: number }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <circle cx={x} cy={y} r={30} fill="#ffffff" stroke="#b91c1c" strokeWidth={5} />
            {type === 0 && (
                <g stroke="#b91c1c" strokeWidth={5} strokeLinecap="round" fill="none">
                    <path d={`M ${x - 6} ${y + 18} L ${x - 6} ${y - 16} L ${x + 18} ${y - 16} M ${x + 14} ${y - 16} L ${x + 14} ${y + 2}`} />
                </g>
            )}
            {type === 1 && (
                <g stroke="#b91c1c" strokeWidth={4} strokeLinecap="round">
                    <path d={`M ${x - 18} ${y - 6} L ${x + 18} ${y - 6} M ${x - 18} ${y + 8} L ${x + 18} ${y + 8}`} />
                    <path d={`M ${x - 12} ${y - 12} L ${x - 12} ${y + 14} M ${x} ${y - 12} L ${x} ${y + 14} M ${x + 12} ${y - 12} L ${x + 12} ${y + 14}`} />
                </g>
            )}
            {type === 2 && <path d={`M ${x - 16} ${y + 6} L ${x + 16} ${y + 6} L ${x + 10} ${y + 16} L ${x - 12} ${y + 16} Z M ${x - 4} ${y + 6} L ${x - 4} ${y - 16} L ${x + 12} ${y - 2} Z`} fill="#b91c1c" />}
        </motion.g>
    );
}

/** Et oljefat. */
function Fat({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <rect x={x - 26} y={y - 36} width={52} height={70} rx={8} fill={FARGE.olje} stroke="#ffffff" strokeWidth={4} />
            <path d={`M ${x - 26} ${y - 12} L ${x + 26} ${y - 12} M ${x - 26} ${y + 12} L ${x + 26} ${y + 12}`} stroke="#ffffff" strokeWidth={3} />
            <path d={`M ${x} ${y - 6} q 9 12 0 16 q -9 -4 0 -16 Z`} fill="#facc15" />
        </motion.g>
    );
}

/** Stort merke med et tall over et land. */
function Merke({ pos, tekst, undertekst, farge }: { pos: [number, number]; tekst: string; undertekst: string; farge: string }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <rect x={x - 115} y={y - 62} width={230} height={124} rx={22} fill="#ffffff" stroke={farge} strokeWidth={7} />
            <text x={x} y={y + 6} textAnchor="middle" fontSize={56} fontWeight={900} fill={farge}>
                {tekst}
            </text>
            <text x={x} y={y + 44} textAnchor="middle" fontSize={28} fontWeight={800} fill="#334155">
                {undertekst}
            </text>
        </motion.g>
    );
}

/** En forsyningskjede som lenker. Når den er brutt, blir den rød og stiplet med et brudd i midten. */
function Kjede({ fra, til, brutt, forsinkelse }: { fra: [number, number]; til: [number, number]; brutt: boolean; forsinkelse: number }) {
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2 - 90;
    const d = `M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`;
    const farge = brutt ? '#dc2626' : '#475569';
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeDasharray={brutt ? '22 18' : '28 6'}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse }}
            />
            {brutt && (
                <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 + forsinkelse }}
                    style={{ transformOrigin: `${mx}px ${my + 45}px` }}>
                    <circle cx={mx} cy={my + 45} r={30} fill="#ffffff" stroke="#dc2626" strokeWidth={5} />
                    <path d={`M ${mx - 13} ${my + 32} L ${mx + 13} ${my + 58} M ${mx + 13} ${my + 32} L ${mx - 13} ${my + 58}`} stroke="#dc2626" strokeWidth={7} strokeLinecap="round" />
                </motion.g>
            )}
        </g>
    );
}

function Kryss({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}
            style={{ transformOrigin: `${x}px ${y}px` }}>
            <rect x={x - 70} y={y - 46} width={140} height={92} rx={14} fill="#ffffff" stroke="#dc2626" strokeWidth={6} />
            <text x={x} y={y + 14} textAnchor="middle" fontSize={28} fontWeight={900} fill="#dc2626">
                STENGT
            </text>
        </motion.g>
    );
}

/** En bil uten én liten del: hjulet mangler. */
function Bil({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <rect x={x - 80} y={y - 70} width={160} height={120} rx={20} fill="#ffffff" stroke="#0f172a" strokeWidth={4} />
            <path d={`M ${x - 56} ${y + 8} L ${x - 56} ${y - 14} L ${x - 30} ${y - 40} L ${x + 26} ${y - 40} L ${x + 46} ${y - 14} L ${x + 60} ${y - 10} L ${x + 60} ${y + 8} Z`} fill="#2563eb" />
            <circle cx={x - 30} cy={y + 12} r={14} fill="#0f172a" />
            <motion.circle cx={x + 34} cy={y + 12} r={14} fill="none" stroke="#dc2626" strokeWidth={4} strokeDasharray="6 5"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <text x={x + 34} y={y + 19} textAnchor="middle" fontSize={22} fontWeight={900} fill="#dc2626">
                ?
            </text>
        </motion.g>
    );
}

/** En pil som går i ring og lander hjemme: produksjonen flytter hjem. */
function Hjem({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
            style={{ transformOrigin: `${x}px ${y}px` }}>
            <circle cx={x} cy={y} r={46} fill="#ffffff" stroke="#1d4ed8" strokeWidth={5} />
            <path d={`M ${x - 22} ${y + 4} L ${x} ${y - 18} L ${x + 22} ${y + 4} L ${x + 22} ${y + 24} L ${x - 22} ${y + 24} Z`} fill="#1d4ed8" />
            <rect x={x - 6} y={y + 8} width={12} height={16} fill="#ffffff" />
        </motion.g>
    );
}

/** Sanksjonene som en mur mellom Russland og Vesten. */
function Mur({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const n = 6;
    return (
        <g>
            {Array.from({ length: n }, (_, i) => {
                const t = i / (n - 1);
                const x = fra[0] + (til[0] - fra[0]) * t;
                const y = fra[1] + (til[1] - fra[1]) * t;
                return (
                    <motion.rect
                        key={i}
                        x={x - 22}
                        y={y - 22}
                        width={44}
                        height={44}
                        rx={4}
                        fill="#1e3a8a"
                        stroke="#ffffff"
                        strokeWidth={4}
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.12 }}
                        style={{ transformOrigin: `${x}px ${y}px` }}
                    />
                );
            })}
        </g>
    );
}

/** En stor mynt: penger brukt som våpen. */
function Mynt({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0, scale: 0.3, rotate: -40 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 12 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <circle cx={x} cy={y} r={95} fill="#facc15" stroke="#a16207" strokeWidth={10} />
            <circle cx={x} cy={y} r={70} fill="none" stroke="#a16207" strokeWidth={4} />
            <text x={x} y={y + 34} textAnchor="middle" fontSize={100} fontWeight={900} fill="#a16207">
                $
            </text>
        </motion.g>
    );
}

/** Et gassrør med tykkelse etter hvor mye gass som går, og en plassering (1 eller 2). */
function Ror({ fra, til, tykk, farge, nummer }: { fra: [number, number]; til: [number, number]; tykk: number; farge: string; nummer: number | null }) {
    const d = `M ${fra[0]} ${fra[1]} L ${til[0]} ${til[1]}`;
    return (
        <g>
            <motion.path d={d} stroke="#ffffff" fill="none" strokeLinecap="round" animate={{ strokeWidth: tykk + 10 }} transition={{ duration: 1.2 }}
                initial={{ strokeWidth: 0 }} />
            <motion.path d={d} stroke={farge} fill="none" strokeLinecap="round" animate={{ strokeWidth: tykk }} transition={{ duration: 1.2 }}
                initial={{ strokeWidth: 0 }} style={{ transition: 'stroke 1s ease' }} />
            {nummer !== null && (
                <motion.g key={nummer} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}
                    style={{ transformOrigin: `${(fra[0] + til[0]) / 2}px ${(fra[1] + til[1]) / 2}px` }}>
                    <circle cx={(fra[0] + til[0]) / 2} cy={(fra[1] + til[1]) / 2} r={46} fill="#ffffff" stroke={farge} strokeWidth={7} />
                    <text x={(fra[0] + til[0]) / 2} y={(fra[1] + til[1]) / 2 + 20} textAnchor="middle" fontSize={56} fontWeight={900} fill={farge}>
                        {nummer}
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/** Mobilen midt i bildet. */
function Mobil({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, type: 'spring', damping: 16 }}>
            <rect x={x - 95} y={y - 190} width={190} height={360} rx={30} fill="#0f172a" stroke="#ffffff" strokeWidth={6} />
            <rect x={x - 78} y={y - 160} width={156} height={290} rx={12} fill="#1e293b" />
            <rect x={x - 25} y={y - 178} width={50} height={8} rx={4} fill="#475569" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x={x - 62 + (i % 3) * 46} y={y - 140 + Math.floor(i / 3) * 52} width={32} height={32} rx={8}
                    fill={['#dc2626', '#0d9488', '#7c3aed', '#2563eb', '#ca8a04', '#ea580c'][i]} />
            ))}
        </motion.g>
    );
}

/** En linje fra et land inn i mobilen, med navn på delen. */
function Kilde({ fra, til, tekst, farge, forsinkelse }: { fra: [number, number]; til: [number, number]; tekst: string; farge: string; forsinkelse: number }) {
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} L ${til[0]} ${til[1]}`}
                stroke={farge}
                strokeWidth={7}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, delay: forsinkelse }}
            />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse + 0.4 }}>
                <circle cx={fra[0]} cy={fra[1]} r={14} fill={farge} stroke="#ffffff" strokeWidth={4} />
                <text x={fra[0]} y={fra[1] - 26} textAnchor="middle" fontSize={38} fontWeight={900} fill={farge} {...TEKSTKANT}>
                    {tekst}
                </text>
            </motion.g>
        </g>
    );
}

/** «Nesten halvparten av menneskene i verden» som en sirkel som fylles nesten halvt. */
function Halvparten() {
    const r = 46;
    const omkrets = 2 * Math.PI * r;
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/95 shadow-xl">
            <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={r} fill="none" stroke="#e2e8f0" strokeWidth="18" />
                <motion.circle cx="55" cy="55" r={r} fill="none" stroke="#ca8a04" strokeWidth="18" transform="rotate(-90 55 55)"
                    strokeDasharray={omkrets} initial={{ strokeDashoffset: omkrets }} animate={{ strokeDashoffset: omkrets * 0.53 }}
                    transition={{ duration: 1.6, delay: 0.8 }} />
            </svg>
            <div className="text-2xl font-black text-slate-900 leading-tight">
                Nesten halvparten
                <br />
                <span className="text-lg font-semibold text-slate-500">av menneskene i verden</span>
            </div>
        </motion.div>
    );
}

function Brikke({ tekst, farge }: { tekst: string; farge?: 'rod' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                farge === 'rod' ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
            }`}
        >
            {tekst}
        </motion.div>
    );
}
