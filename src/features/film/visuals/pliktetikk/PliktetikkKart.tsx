import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Kort } from './felles';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

/**
 * Sartres elev i Frankrike under krigen. «valg»: angrepet i 1940, hjemmet der moren er, og
 * veien til de frie franske styrkene i England. «kompass»: ingen regel viser veien, eleven må
 * velge selv, og pliktetikken blir et kompass over et kart som blekner.
 */

type Modus = 'valg' | 'kompass';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const SV: LngLat = [-9, 41.5];
const NO: LngLat = [14, 56];

const FRANKRIKE = '250';
const ENGLAND = '826';
const TYSKLAND = '276';

/** Hjemmet er ikke stedfestet i artikkelen: et punkt midt i landet. */
const HJEM: LngLat = [2.4, 46.6];
const LONDON: LngLat = [-0.12, 51.5];
const ANGREP_FRA: LngLat = [9.5, 50.6];
const ANGREP_TIL: LngLat = [4.6, 49.2];

const Land = memo(function Land({
    geographies,
    sti,
    okkupert,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    okkupert: boolean;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String(g.id);
                const fill =
                    id === FRANKRIKE
                        ? okkupert
                            ? '#e7c9c0'
                            : '#f3ead6'
                        : id === ENGLAND
                          ? '#e3ecd8'
                          : id === TYSKLAND
                            ? '#d6d3d1'
                            : '#ece6d6';
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={fill}
                        stroke="#a8a08a"
                        strokeWidth={1.5}
                    />
                );
            })}
        </>
    );
});

function Kompass({ vis }: { vis: boolean }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: vis ? 1 : 0, scale: vis ? 1 : 0.6 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            style={{ transformOrigin: '1180px 470px', transformBox: 'view-box' }}
        >
            <circle cx={1180} cy={470} r={200} fill="#fffbeb" stroke="#78350f" strokeWidth={12} />
            <circle cx={1180} cy={470} r={170} fill="none" stroke="#d6b98a" strokeWidth={3} />
            {['N', 'Ø', 'S', 'V'].map((l, i) => {
                const a = (i * Math.PI) / 2 - Math.PI / 2;
                return (
                    <text key={l} x={1180 + Math.cos(a) * 140} y={470 + Math.sin(a) * 140 + 14} textAnchor="middle" fontSize={40} fontWeight={900} fill="#78350f" style={FONT}>
                        {l}
                    </text>
                );
            })}
            <path d="M 1180 360 L 1205 470 L 1180 580 L 1155 470 Z" fill="#b91c1c" />
            <path d="M 1180 470 L 1205 470 L 1180 580 L 1155 470 Z" fill="#475569" />
            <circle cx={1180} cy={470} r={12} fill="#78350f" />
        </motion.g>
    );
}

export function PliktetikkKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'valg';
    const { geographies } = useFilmVerden();
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [B, H],
                ],
                { type: 'MultiPoint', coordinates: [SV, NO] } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const [hx, hy] = p(HJEM);
    const [lx, ly] = p(LONDON);
    const [ax, ay] = p(ANGREP_FRA);
    const [bx, by] = p(ANGREP_TIL);

    const valg = modus === 'valg';
    const visAngrep = valg && beat >= 1;
    const visHjem = !valg || beat >= 2;
    const visEngland = !valg || beat >= 3;
    const kartBlek = !valg && beat >= 2;

    const overskrift = valg
        ? ['Sartres elev, andre verdenskrig', '1940: Tyskland angriper', 'Bli hjemme hos moren?', 'Eller reise til England?', 'Han kan ikke gjøre begge'][Math.min(beat, 4)]
        : ['Ingen regel viser veien', 'Du må velge selv', 'Et kompass, ikke et kart'][Math.min(beat, 2)];

    const engelskVei = `M ${hx} ${hy} Q ${(hx + lx) / 2 - 160} ${(hy + ly) / 2} ${lx} ${ly}`;

    return (
        <div className="absolute inset-0 bg-[#bcd4e4] overflow-hidden">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <motion.g initial={false} animate={{ opacity: kartBlek ? 0.3 : 1 }} transition={{ duration: 1 }}>
                    <Land geographies={geographies} sti={sti} okkupert={visAngrep || !valg} />
                    {/* Angrepet */}
                    {visAngrep && (
                        <motion.path
                            d={`M ${ax} ${ay} L ${bx} ${by}`}
                            stroke="#b91c1c"
                            strokeWidth={16}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2 }}
                        />
                    )}
                    {visAngrep && (
                        <polygon
                            points={`${bx - 30},${by - 6} ${bx + 4},${by + 26} ${bx - 4},${by - 34}`}
                            fill="#b91c1c"
                            transform={`rotate(${(Math.atan2(by - ay, bx - ax) * 180) / Math.PI + 45} ${bx} ${by})`}
                        />
                    )}
                    {/* Veien til England */}
                    {visEngland && (
                        <motion.path
                            d={engelskVei}
                            fill="none"
                            stroke="#1d4ed8"
                            strokeWidth={10}
                            strokeLinecap="round"
                            initial={{ pathLength: valg && beat === 3 ? 0 : 1 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.6 }}
                        />
                    )}
                    {visEngland && <circle cx={lx} cy={ly} r={14} fill="#1d4ed8" stroke="#fff" strokeWidth={4} />}
                    {/* Hjemmet */}
                    {visHjem && (
                        <g transform={`translate(${hx} ${hy})`}>
                            <path d="M -34 0 L -34 -40 L 0 -70 L 34 -40 L 34 0 Z" fill="#b45309" stroke="#ffffff" strokeWidth={4} />
                            <rect x={-10} y={-26} width={20} height={26} fill="#fde68a" />
                        </g>
                    )}
                </motion.g>

                {/* Merkelapper */}
                <motion.g initial={false} animate={{ opacity: kartBlek ? 0 : 1 }}>
                    <Kort x={hx + 40} y={hy + 70} tekst={valg && beat < 2 ? 'Frankrike' : 'Hjemme: moren'} str={30} farge="#fff7ed" kant="#f59e0b" tekstFarge="#7c2d12" />
                    {valg && <Kort x={ax + 20} y={ay - 80} tekst="Tyskland" str={30} farge="#ffffff" kant="#a8a29e" tekstFarge="#44403c" />}
                    {visEngland && <Kort x={lx - 60} y={ly - 70} tekst="De frie franske styrkene" str={28} farge="#eff6ff" kant="#3b82f6" tekstFarge="#1e3a8a" />}
                </motion.g>

                {valg && beat < 3 && (
                    <Kort x={lx - 40} y={ly - 70} tekst="England" str={30} farge="#ffffff" kant="#a8a29e" tekstFarge="#44403c" />
                )}
                {valg && beat === 1 && (
                    <>
                        <Kort x={330} y={560} tekst="Storebroren drept" str={32} farge="#fee2e2" kant="#ef4444" tekstFarge="#991b1b" />
                        <Kort x={330} y={660} tekst="Faren: med okkupantene" str={32} farge="#ffffff" kant="#a8a29e" tekstFarge="#44403c" />
                    </>
                )}
                {valg && beat >= 4 && (
                    <>
                        <Kort x={hx - 20} y={hy + 160} tekst="Ta vare på moren din" str={32} farge="#b45309" kant="#b45309" tekstFarge="#ffffff" />
                        <Kort x={lx - 330} y={ly + 130} tekst="Kjemp mot et grusomt styre" str={32} farge="#1d4ed8" kant="#1d4ed8" tekstFarge="#ffffff" />
                    </>
                )}

                {!valg && beat <= 1 && (
                    <text x={hx} y={hy - 95} textAnchor="middle" fontSize={90} fontWeight={900} fill="#b91c1c" style={FONT}>
                        ?
                    </text>
                )}
                {!valg && beat === 1 && (
                    <Kort x={hx + 40} y={hy + 160} tekst="Ditt valg, ditt ansvar" str={34} farge="#7c2d12" kant="#7c2d12" tekstFarge="#ffffff" />
                )}
                <Kompass vis={!valg && beat >= 2} />

                {/* Overskrift */}
                <rect x={B / 2 - 420} y={26} width={840} height={92} rx={24} fill="#ffffff" opacity={0.92} />
                <motion.text key={overskrift} x={B / 2} y={88} textAnchor="middle" fontSize={50} fontWeight={800} fill="#0f172a" style={FONT} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {overskrift}
                </motion.text>
            </svg>
        </div>
    );
}
