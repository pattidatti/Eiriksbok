import { useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';

/** Verktøy for kartene i Zulu-filmen: frø, og zoom mot et utsnitt. */

export const B = 1600;
export const H = 900;
export type LngLat = [number, number];
export type Ramme = [LngLat, LngLat];

/** Tilfeldig tall med frø, så kartet ser likt ut hver gang. */
export function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

interface Vindu {
    x: number;
    y: number;
    w: number;
}

/** Projeksjon for grunnkartet og zoom mot et utsnitt. Glir mellom utsnitt når filmen spiller. */
export function useZoom(grunn: Ramme, utsnitt: Ramme, playing: boolean) {
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [B, H],
                ],
                { type: 'MultiPoint', coordinates: grunn } as never
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [grunn.flat().join(',')]
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const a = p(utsnitt[0]);
    const b = p(utsnitt[1]);
    const mål: Vindu = {
        x: (a[0] + b[0]) / 2,
        y: (a[1] + b[1]) / 2,
        w: Math.max(Math.abs(b[0] - a[0]), (Math.abs(b[1] - a[1]) * B) / H),
    };
    const [vindu, setVindu] = useState<Vindu>(mål);
    const naa = useRef(vindu);
    const { x: mx, y: my, w: mw } = mål;
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
    return { proj, sti, p, kk, kartTransform, skjerm, linje };
}

