import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { ID, FARGE, brytLinjer, kortBredde } from './felles';

/**
 * Norge og naboen i øst, med et panel til høyre.
 *
 * - `erklaering`: grensen, baseerklæringen (ingen fremmede baser i fredstid), avskrekking og
 *   beroligelse på en vekt i balanse, vakthunden i bånd.
 * - `avtale`: forsvarsavtalen med USA, fire områder (2021) og åtte til (2024), tre av dem
 *   navngitt på kartet, og to syn på navnet «baseavtale».
 */

type Modus = 'erklaering' | 'avtale';

const B = 1600;
const H = 900;
const UTSNITT: Utsnitt = [
    [3, 57.5],
    [34, 71.5],
];
const PANEL_X = 960;

/** Områdene artikkelen navngir. */
const OMRADER: { navn: string; lnglat: [number, number]; dx: number; anker: 'start' | 'end' }[] = [
    { navn: 'Andøya', lnglat: [16.1, 69.3], dx: -26, anker: 'end' },
    { navn: 'Bardufoss', lnglat: [18.54, 69.06], dx: 26, anker: 'start' },
    { navn: 'Ørland', lnglat: [9.6, 63.7], dx: -26, anker: 'end' },
];

const Grunnkart = memo(function Grunnkart({
    geographies,
    sti,
    naboFarge,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    naboFarge: string;
}) {
    return (
        <g>
            {geographies.map((g, i) => {
                const id = String(g.id ?? '');
                const fill = id === ID.norge ? FARGE.nato : id === ID.russland ? naboFarge : FARGE.land;
                return (
                    <path
                        key={`${id}-${i}`}
                        d={sti(g as never) ?? ''}
                        fill={fill}
                        stroke="#ffffff"
                        strokeWidth={1}
                        style={{ transition: 'fill 0.8s' }}
                    />
                );
            })}
        </g>
    );
});

function Tekstblokk({
    x,
    y,
    tittel,
    tekst,
    farge = FARGE.mork,
    maks = 28,
}: {
    x: number;
    y: number;
    tittel: string;
    tekst?: string;
    farge?: string;
    maks?: number;
}) {
    const linjer = brytLinjer(tekst, maks);
    const bredde = Math.max(kortBredde(tittel, 42), ...linjer.map((l) => kortBredde(l, 32))) + 56;
    const hoyde = 84 + linjer.length * 44;
    return (
        <g>
            <rect x={x} y={y} width={bredde} height={hoyde} rx={22} fill="#ffffff" opacity={0.96} stroke="#cbd5e1" strokeWidth={2} />
            <text x={x + 28} y={y + 58} fontSize={42} fontWeight={900} fill={farge}>
                {tittel}
            </text>
            {linjer.map((l, i) => (
                <text key={i} x={x + 28} y={y + 108 + i * 44} fontSize={32} fontWeight={600} fill="#334155">
                    {l}
                </text>
            ))}
        </g>
    );
}

/** Et lite basemerke: et telt med flagg. */
function Base({ x, y, farge, kryss }: { x: number; y: number; farge: string; kryss?: boolean }) {
    return (
        <g transform={`translate(${x}, ${y})`}>
            <path d="M -30 22 L 0 -18 L 30 22 Z" fill={farge} stroke="#0f172a" strokeWidth={3} />
            <line x1={0} y1={-18} x2={0} y2={-46} stroke="#0f172a" strokeWidth={3} />
            <path d="M 0 -46 L 22 -39 L 0 -32 Z" fill={farge} />
            {kryss && (
                <g transform="translate(46, -6)">
                    <circle r={20} fill={FARGE.rod} />
                    <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
                </g>
            )}
        </g>
    );
}

function Vekt({ hund }: { hund: boolean }) {
    // Vekten står i balanse: begge sider like tunge, bommen vannrett.
    const cx = 1265;
    return (
        <g>
            <line x1={cx} y1={420} x2={cx} y2={640} stroke="#0f172a" strokeWidth={10} />
            <path d={`M ${cx - 70} 650 L ${cx + 70} 650 L ${cx} 610 Z`} fill="#0f172a" />
            <line x1={cx - 170} y1={420} x2={cx + 170} y2={420} stroke="#0f172a" strokeWidth={10} strokeLinecap="round" />
            <circle cx={cx} cy={420} r={14} fill={FARGE.gul} />
            {[-1, 1].map((s) => (
                <g key={s}>
                    <line x1={cx + s * 170} y1={420} x2={cx + s * 170} y2={470} stroke="#0f172a" strokeWidth={4} />
                    <rect
                        x={cx + s * 170 - 145}
                        y={470}
                        width={290}
                        height={120}
                        rx={18}
                        fill={s < 0 ? '#dbeafe' : '#dcfce7'}
                        stroke={s < 0 ? FARGE.nato : '#16a34a'}
                        strokeWidth={4}
                    />
                    <text x={cx + s * 170} y={518} textAnchor="middle" fontSize={34} fontWeight={900} fill={FARGE.mork}>
                        {s < 0 ? 'Avskrekking' : 'Beroligelse'}
                    </text>
                    <text x={cx + s * 170} y={566} textAnchor="middle" fontSize={30} fontWeight={600} fill="#334155">
                        {s < 0 ? 'vise styrke' : 'ingen angrepsplan'}
                    </text>
                </g>
            ))}
            {hund && (
                <g>
                    <text x={cx} y={730} textAnchor="middle" fontSize={34} fontWeight={800} fill={FARGE.mork}>
                        En sterk vakthund, men i bånd
                    </text>
                </g>
            )}
        </g>
    );
}

export function NatoNorge({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'erklaering';
    const { geographies } = useFilmVerden(UTSNITT);
    const { sti, proj } = useMemo(() => {
        const p = geoMercator().fitExtent(
            [
                [20, 20],
                [PANEL_X - 30, H - 20],
            ],
            {
                type: 'MultiPoint',
                coordinates: [UTSNITT[0], UTSNITT[1], [UTSNITT[0][0], UTSNITT[1][1]], [UTSNITT[1][0], UTSNITT[0][1]]],
            } as never
        );
        return { sti: geoPath(p), proj: p };
    }, []);
    const pkt = (ll: [number, number]) => proj(ll) ?? [0, 0];
    const russland = pkt([31.5, 66]);
    const norgeMidt = pkt([12.5, 65.8]);

    const naboFarge = modus === 'erklaering' && beat === 0 ? FARGE.rod : FARGE.russlandLys;

    // Basemerker i erklæringen: tre symbolske telt i Nord-Norge, ikke ekte steder.
    const teltPlass = [pkt([16, 69.6]), pkt([14, 66.8]), pkt([10.5, 63.5])];

    return (
        <div className="absolute inset-0" style={{ background: FARGE.hav }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Grunnkart geographies={geographies} sti={sti} naboFarge={naboFarge} />
                <text
                    x={russland[0]}
                    y={russland[1]}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill={FARGE.rodMork}
                    style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 8, strokeLinejoin: 'round' }}
                >
                    {modus === 'erklaering' && beat === 0 ? 'Sovjetunionen' : 'Russland'}
                </text>
                <text
                    x={norgeMidt[0]}
                    y={norgeMidt[1]}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#ffffff"
                    style={{ paintOrder: 'stroke', stroke: FARGE.natoMork, strokeWidth: 8, strokeLinejoin: 'round' }}
                >
                    Norge
                </text>

                {modus === 'erklaering' && beat >= 1 && beat <= 2 &&
                    teltPlass.map(([x, y], i) => <Base key={i} x={x} y={y} farge="#e2e8f0" kryss />)}

                {modus === 'avtale' && beat >= 2 &&
                    OMRADER.map((o) => {
                        const [x, y] = pkt(o.lnglat);
                        return (
                            <motion.g key={o.navn} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                                <circle cx={x} cy={y} r={14} fill={FARGE.gul} stroke="#0f172a" strokeWidth={4} />
                                <text
                                    x={x + o.dx}
                                    y={y + 12}
                                    textAnchor={o.anker}
                                    fontSize={34}
                                    fontWeight={900}
                                    fill={FARGE.mork}
                                    style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 8, strokeLinejoin: 'round' }}
                                >
                                    {o.navn}
                                </text>
                            </motion.g>
                        );
                    })}

                <AnimatePresence mode="wait">
                    <motion.g
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {modus === 'erklaering' ? <PanelErklaering beat={beat} /> : <PanelAvtale beat={beat} />}
                    </motion.g>
                </AnimatePresence>
            </svg>
        </div>
    );
}

function PanelErklaering({ beat }: { beat: number }) {
    if (beat === 0)
        return (
            <Tekstblokk
                x={PANEL_X}
                y={140}
                tittel="Grense mot Russland"
                tekst="Under den kalde krigen var naboen i øst Sovjetunionen"
            />
        );
    if (beat === 1)
        return (
            <Tekstblokk
                x={PANEL_X}
                y={140}
                tittel="Regjeringens løfte"
                tekst="Ingen fremmede baser i fredstid (lovet før Norge ble med)"
            />
        );
    if (beat === 2)
        return (
            <Tekstblokk
                x={PANEL_X}
                y={140}
                tittel="Baseerklæringen"
                tekst="Ingen fremmede baser, så lenge Norge ikke er angrepet eller truet med angrep"
            />
        );
    return (
        <g>
            <text x={PANEL_X} y={250} fontSize={36} fontWeight={900} fill={FARGE.mork}>
                Målet: dempe spenningen i nord
            </text>
            <Vekt hund={beat >= 4} />
        </g>
    );
}

function PanelAvtale({ beat }: { beat: number }) {
    if (beat === 0)
        return <Tekstblokk x={PANEL_X} y={140} tittel="Balansen endrer seg" tekst="de siste årene" />;
    if (beat === 3)
        return (
            <g>
                <Tekstblokk
                    x={PANEL_X}
                    y={140}
                    tittel="Regjeringen mener:"
                    tekst="misvisende å kalle dette en baseavtale"
                    farge={FARGE.natoMork}
                />
                <Tekstblokk x={PANEL_X} y={420} tittel="Andre:" tekst="kaller den likevel en baseavtale" farge={FARGE.rodMork} />
            </g>
        );
    // Beat 1 og 2: områdene som ruter.
    const ruter = Array.from({ length: beat >= 2 ? 12 : 4 }, (_, i) => i);
    return (
        <g>
            <text x={PANEL_X} y={200} fontSize={44} fontWeight={900} fill={FARGE.mork}>
                Forsvarsavtalen med USA
            </text>
            <text x={PANEL_X} y={250} fontSize={30} fontWeight={600} fill="#334155">
                Områder amerikanske styrker får tilgang til
            </text>
            {ruter.map((i) => {
                const ny = i >= 4;
                const rad = Math.floor(i / 4);
                const kol = i % 4;
                return (
                    <motion.rect
                        key={i}
                        x={PANEL_X + kol * 120}
                        y={300 + rad * 120}
                        width={96}
                        height={96}
                        rx={14}
                        fill={ny ? FARGE.gul : FARGE.nato}
                        stroke="#0f172a"
                        strokeWidth={3}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: ny ? 0.2 + (i - 4) * 0.12 : i * 0.15 }}
                    />
                );
            })}
            <g>
                <rect x={PANEL_X} y={662} width={26} height={26} fill={FARGE.nato} />
                <text x={PANEL_X + 40} y={686} fontSize={30} fontWeight={800} fill={FARGE.mork}>
                    2021: fire områder
                </text>
            </g>
            {beat >= 2 && (
                <g>
                    <rect x={PANEL_X} y={712} width={26} height={26} fill={FARGE.gul} />
                    <text x={PANEL_X + 40} y={736} fontSize={30} fontWeight={800} fill={FARGE.mork}>
                        2024: åtte områder til
                    </text>
                </g>
            )}
        </g>
    );
}
