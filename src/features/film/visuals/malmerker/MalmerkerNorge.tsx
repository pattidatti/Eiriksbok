import { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import {
    NORGE_ID,
    NORGE_UTSNITT,
    REGIONER,
    lagProjeksjon,
    regionSti,
    type Region,
} from './regioner';

/**
 * Norgeskartet med de fire dialektområdene, delt av MalmerkerKart (stort kart) og
 * MalmerkerOrd (lite kart i detektiv-modusen). Grensene er en grov skisse: de tegnes som
 * mangekanter i lengde/bredde og klippes etter Norges omriss, så havet og nabolandene aldri
 * blir farget.
 */

/**
 * Landene som SVG-grupper: nabolandene grå, Norge delt i regioner med fargene i `farger`.
 * Tegnes inne i en <svg>. `strek` er strektykkelsen i SVG-enheter.
 */
export function NorgeLand({
    proj,
    farger,
    strek = 1.2,
    nabo = '#e7e2d6',
}: {
    proj: GeoProjection;
    farger: Record<Region, string>;
    strek?: number;
    nabo?: string;
}) {
    const { geographies } = useFilmVerden(NORGE_UTSNITT);
    const sti = useMemo(() => geoPath(proj), [proj]);
    const klipp = useId().replace(/:/g, '');
    const norge = geographies.find((g) => Number(g.id) === NORGE_ID);
    const norgeD = norge ? (sti(norge as never) ?? '') : '';
    return (
        <g>
            {geographies
                .filter((g) => Number(g.id) !== NORGE_ID)
                .map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={nabo}
                        stroke="#c9c2b2"
                        strokeWidth={strek}
                    />
                ))}
            <defs>
                <clipPath id={`norge-${klipp}`}>
                    <path d={norgeD} />
                </clipPath>
            </defs>
            <path d={norgeD} fill="#f4f1ea" />
            <g clipPath={`url(#norge-${klipp})`}>
                {REGIONER.map((r) => (
                    <motion.path
                        key={r}
                        d={regionSti(proj, r)}
                        initial={false}
                        animate={{ fill: farger[r] }}
                        transition={{ duration: 0.9 }}
                        stroke="#ffffff"
                        strokeWidth={strek * 1.6}
                    />
                ))}
            </g>
            <path d={norgeD} fill="none" stroke="#57534e" strokeWidth={strek} />
        </g>
    );
}

/** Lite, frittstående kart med regionfarger (brukes i detektiv-modusen). */
export function MalmerkerNorge({
    farger,
    bredde,
    hoyde,
}: {
    farger: Record<Region, string>;
    bredde: number;
    hoyde: number;
}) {
    const proj = useMemo(
        () =>
            lagProjeksjon([
                [6, 6],
                [bredde - 6, hoyde - 6],
            ]),
        [bredde, hoyde]
    );
    return (
        <svg
            viewBox={`0 0 ${bredde} ${hoyde}`}
            width={bredde}
            height={hoyde}
            style={{ display: 'block' }}
        >
            <NorgeLand proj={proj} farger={farger} strek={0.8} nabo="#ece8de" />
        </svg>
    );
}
