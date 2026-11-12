import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart til rettsstat-filmen.
 * «veien»: Europa, med stedene der tanken om lover over makten vokste fram (Roma, Norge,
 * England), kongene som lenge hadde siste ord, og grunnlovene på 1800-tallet.
 * «maling»: Norden, med Danmark på førsteplass og Norge rett etter, og det som skjer i mange
 * andre land.
 */

type Modus = 'veien' | 'maling';
type LngLat = [number, number];
const B = 1600;
const H = 900;

const ITALIA = '380';
const NORGE = '578';
const STORBRITANNIA = '826';
const DANMARK = '208';

interface Oppsett {
    ramme: [LngLat, LngLat];
    land: Utsnitt;
}

const OPPSETT: Record<Modus, Oppsett> = {
    veien: { ramme: [[-11, 36], [34, 66]], land: [[-50, 26], [70, 76]] },
    maling: { ramme: [[-2, 51.5], [32, 70.5]], land: [[-30, 44], [60, 74]] },
};

const OVERSKRIFT: Record<Modus, string[]> = {
    veien: ['Romerne', 'Middelalderen i Norge', 'England: Magna Carta', 'Kongene', '1800-tallet: grunnlover'],
    maling: ['Danmark på førsteplass', 'I Europa og Nord-Amerika', 'Hvorfor svakere?', 'I mange land', 'I mange land', 'Mot diktatur?'],
};

interface Merke {
    id: string;
    ll: LngLat;
    fraBeat: number;
    tittel: string;
    tekst: string;
    /** Kortets midtpunkt i bildet. */
    kort: [number, number];
    farge: string;
}

const VEIEN: Merke[] = [
    { id: 'roma', ll: [12.5, 41.9], fraBeat: 0, tittel: 'Romerne', tekst: 'lovene skrevet ned', kort: [1210, 760], farge: '#b45309' },
    { id: 'norge', ll: [8.5, 61], fraBeat: 1, tittel: 'Landsloven', tekst: 'felles lovbok for Norge', kort: [330, 250], farge: '#1d4ed8' },
    { id: 'england', ll: [-1.2, 52.3], fraBeat: 2, tittel: 'Magna Carta', tekst: 'tidlig på 1200-tallet', kort: [300, 640], farge: '#be123c' },
];

export function RettsstatKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'veien';
    const oppsett = OPPSETT[modus];
    const { geographies } = useFilmVerden(oppsett.land);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 110],
                    [B - 40, H - 30],
                ],
                { type: 'MultiPoint', coordinates: oppsett.ramme } as never
            ),
        [oppsett]
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];

    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];

    const fyll = (id: string): string | null => {
        if (modus === 'veien') {
            if (id === ITALIA && beat >= 0) return '#f59e0b';
            if (id === NORGE && beat >= 1) return beat >= 4 ? '#0d9488' : '#60a5fa';
            if (id === STORBRITANNIA && beat >= 2) return '#fb7185';
            return null;
        }
        if (id === DANMARK) return '#eab308';
        if (id === NORGE && beat >= 1) return '#14b8a6';
        return null;
    };

    const dempet = modus === 'veien' ? beat === 3 : beat >= 2;
    const maleSlutt = modus === 'maling' && beat >= 2;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#bcd4e4' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Land geographies={geographies} sti={sti} fyll={fyll} />
                {modus === 'veien' &&
                    VEIEN.filter((m) => beat >= m.fraBeat).map((m) => {
                        const [x, y] = p(m.ll);
                        const [kx, ky] = m.kort;
                        const naa = beat === m.fraBeat;
                        return (
                            <motion.g key={m.id} initial={{ opacity: 0 }} animate={{ opacity: dempet ? 0.35 : 1 }} transition={{ duration: 0.6 }}>
                                <line x1={x} y1={y} x2={kx} y2={ky} stroke={m.farge} strokeWidth={4} />
                                <circle cx={x} cy={y} r={14} fill={m.farge} stroke="#fff" strokeWidth={4} />
                                <rect x={kx - 190} y={ky - 62} width={380} height={124} rx={18} fill="#fff" stroke={m.farge} strokeWidth={naa ? 8 : 4} />
                                <text x={kx} y={ky - 8} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                                    {m.tittel}
                                </text>
                                <text x={kx} y={ky + 38} textAnchor="middle" fontSize={30} fontWeight={600} fill="#334155">
                                    {m.tekst}
                                </text>
                            </motion.g>
                        );
                    })}
                {modus === 'veien' && beat >= 4 && (
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <rect x={960} y={150} width={600} height={170} rx={20} fill="#0f766e" />
                        <text x={1260} y={222} textAnchor="middle" fontSize={44} fontWeight={800} fill="#fff">
                            1800-tallet
                        </text>
                        <text x={1260} y={278} textAnchor="middle" fontSize={30} fontWeight={600} fill="#ccfbf1">
                            flere land får grunnlov, Norge i 1814
                        </text>
                    </motion.g>
                )}
                {modus === 'maling' && !maleSlutt && (
                    <>
                        <Merkelapp ll={[10, 56]} p={p} tekst="Danmark: nr. 1 i verden" farge="#a16207" dx={-330} dy={60} />
                        {beat >= 1 && <Merkelapp ll={[9.5, 61.5]} p={p} tekst="Norge: rett etter Danmark" farge="#0f766e" dx={-230} dy={-120} />}
                    </>
                )}
            </svg>
            {modus === 'veien' && beat === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-3xl bg-slate-900/90 text-white px-10 py-6 text-center shadow-2xl" style={{ width: 560 }}>
                        <Krone />
                        <div className="font-display font-bold text-3xl mt-2">I mange land hadde kongen lenge siste ord</div>
                        <div className="text-xl text-slate-300 mt-2">og brukte makten tilfeldig</div>
                    </div>
                </motion.div>
            )}
            {maleSlutt && (
                <div className="absolute inset-0 bg-slate-900/45 flex items-center justify-center">
                    <div className="flex flex-col gap-4" style={{ width: 520 }}>
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/95 shadow-xl px-6 py-4">
                            <div className="font-display font-black text-3xl text-slate-900 mb-2">I mange land</div>
                            {beat <= 3 ? (
                                <>
                                    <div className="text-2xl font-bold text-slate-800">Mange ledere samler mer makt hos seg selv</div>
                                    {beat === 3 && <div className="text-2xl font-bold text-red-700 mt-2">og tåler mindre kontroll</div>}
                                </>
                            ) : (
                                <>
                                    <Pilrad tekst="Domstolene" opp={false} />
                                    <Pilrad tekst="Regjeringene" opp />
                                </>
                            )}
                        </motion.div>
                        {beat >= 5 && (
                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-red-700 text-white shadow-xl px-6 py-4 font-display font-bold text-3xl">
                                Lettere å gå mot diktatur
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[3%] inset-x-0 flex justify-center pointer-events-none"
                >
                    <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                        {tekst}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Pilrad({ tekst, opp }: { tekst: string; opp: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-2xl font-bold text-slate-900">{tekst}</span>
            <span className={`text-2xl font-bold ${opp ? 'text-amber-700' : 'text-red-700'}`}>
                {opp ? 'mer makt ▲' : 'mindre makt ▼'}
            </span>
        </div>
    );
}

function Krone() {
    return (
        <svg viewBox="0 0 120 80" width={110} height={74} className="mx-auto">
            <path d="M 10 70 L 10 20 L 35 45 L 60 10 L 85 45 L 110 20 L 110 70 Z" fill="#facc15" />
            <rect x={10} y={62} width={100} height={12} fill="#ca8a04" />
        </svg>
    );
}

function Merkelapp({ ll, p, tekst, farge, dx, dy }: { ll: LngLat; p: (ll: LngLat) => [number, number]; tekst: string; farge: string; dx: number; dy: number }) {
    const [x, y] = p(ll);
    const b = tekst.length * 21 + 50;
    const kx = x + dx;
    const ky = y + dy;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <line x1={x} y1={y} x2={kx} y2={ky} stroke={farge} strokeWidth={4} />
            <circle cx={x} cy={y} r={12} fill={farge} stroke="#fff" strokeWidth={4} />
            <rect x={kx - b / 2} y={ky - 38} width={b} height={76} rx={18} fill="#fff" stroke={farge} strokeWidth={6} />
            <text x={kx} y={ky + 13} textAnchor="middle" fontSize={38} fontWeight={800} fill="#0f172a">
                {tekst}
            </text>
        </motion.g>
    );
}

const Land = memo(function Land({ geographies, sti, fyll }: { geographies: GeoFeature[]; sti: GeoPath; fyll: (id: string) => string | null }) {
    return (
        <>
            {geographies.map((g, i) => {
                const f = fyll(String(g.id));
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={f ?? '#ece6d6'}
                        stroke="#a8a08a"
                        strokeWidth={1.2}
                        style={{ transition: 'fill 0.8s' }}
                    />
                );
            })}
        </>
    );
});
