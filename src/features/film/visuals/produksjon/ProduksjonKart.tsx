import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { rammePunkter } from '../../kart/grenser';
import type { VisualProps } from '../../types';
import { B, H, Overskrift, Tekst } from './felles';

/**
 * Verdenskartet over planøkonomiene artikkelen nevner: Sovjetunionen, Cuba og Nord-Korea.
 * Sovjetunionen tegnes som dagens land det besto av, og er merket «omtrentlig».
 */

type LngLat = [number, number];

/** Dagens land som var en del av Sovjetunionen (ISO 3166 numerisk). */
const SOVJET = ['643', '804', '112', '398', '860', '795', '417', '762', '031', '051', '268', '498', '440', '428', '233'];
const CUBA = '192';
const NORD_KOREA = '408';

const HAV = '#cfe2ef';
const LAND = '#f1ece0';
const ROD = '#dc2626';

const OVERSKRIFT = ['Kommunistiske land med planøkonomi', 'Sovjetunionen', 'Cuba og Nord-Korea'];

function idFor(g: unknown) {
    return String((g as { id?: string | number }).id ?? '').padStart(3, '0');
}

export function ProduksjonKart({ beat }: VisualProps) {
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoNaturalEarth1().fitExtent(
                [
                    [30, 90],
                    [B - 30, H - 30],
                ],
                rammePunkter([-100, 5], [150, 72]) as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = useCallback((ll: LngLat) => projeksjon(ll) as [number, number], [projeksjon]);
    const farge = (id: string) => {
        if (SOVJET.includes(id)) return beat >= 1 ? ROD : LAND;
        if (id === CUBA || id === NORD_KOREA) return beat >= 2 ? ROD : LAND;
        return LAND;
    };
    const su = p([80, 60]);
    const cu = p([-79, 21.5]);
    const nk = p([127, 40]);
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                {geographies.map((g, i) => (
                    <motion.path
                        key={i}
                        d={sti(g as never) ?? ''}
                        initial={false}
                        animate={{ fill: farge(idFor(g)) }}
                        transition={{ duration: 0.9 }}
                        stroke="#b9ad92"
                        strokeWidth={1}
                    />
                ))}
                <Tekst x={su[0]} y={su[1]} synlig={beat >= 1} storrelse={44}>
                    Sovjetunionen
                </Tekst>
                <Tekst x={su[0]} y={su[1] + 50} synlig={beat >= 1} storrelse={32} vekt={700}>
                    omtrentlig, tegnet med dagens grenser
                </Tekst>
                {/* Små land får en ring, så de ikke blir borte */}
                <motion.circle
                    cx={cu[0]}
                    cy={cu[1]}
                    r={34}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={6}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 2 ? 1 : 0 }}
                />
                <Tekst x={cu[0]} y={cu[1] + 80} synlig={beat >= 2} storrelse={40}>
                    Cuba
                </Tekst>
                <motion.circle
                    cx={nk[0]}
                    cy={nk[1]}
                    r={34}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={6}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 2 ? 1 : 0 }}
                />
                <Tekst x={nk[0] - 50} y={nk[1] + 80} synlig={beat >= 2} storrelse={40}>
                    Nord-Korea
                </Tekst>
            </svg>
            <Overskrift tekst={OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)]} />
        </div>
    );
}
