import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    Footprints,
    Lightbulb,
    Lock,
    Mail,
    MapPin,
    RotateCcw,
    Users,
} from 'lucide-react';
import { useAtlasWorld } from '../../atlas/useAtlasWorld';

// Vennenettet: eleven sender Hauge rundt i Norge og ser vennesamfunnene vokse fram,
// bundet sammen av brev og reiser. Så blir Hauge arrestert i 1804.
//
// Lyspære-øyeblikket: bevegelsen døde ikke da lederen satt i fengsel i ti år, fordi
// vennene var bundet til hverandre - ikke bare til Hauge.
//
// Stedstekstene bygger på SNL (Aarflot & Elstad, Dørum) og Norgeshistorie.no (Seland).

interface VennenettetProps {
    title?: string;
}

type Phase = 'reise' | 'arrestert' | 'fasit';

interface Sted {
    id: string;
    navn: string;
    lat: number;
    lng: number;
    tekst: string;
    labelDx?: number;
    labelDy?: number;
    anchor?: 'start' | 'end';
}

const STEDER: Sted[] = [
    {
        id: 'tune',
        navn: 'Tune',
        lat: 59.27,
        lng: 11.05,
        tekst: 'Her vokste Hauge opp. Våren 1796 arbeidet han på åkeren da han fikk opplevelsen som fikk ham til å begynne å preke.',
        labelDx: 8,
        labelDy: 10,
    },
    {
        id: 'eiker',
        navn: 'Eiker',
        lat: 59.75,
        lng: 9.9,
        tekst: 'Haugianerne bygde en papirfabrikk på Eiker. På 1830-tallet var Eiker og Drammen blant de viktigste sentrene i bevegelsen.',
        labelDx: -8,
        labelDy: 4,
        anchor: 'end',
    },
    {
        id: 'kristiansand',
        navn: 'Kristiansand',
        lat: 58.15,
        lng: 8.0,
        tekst: 'Venner av Hauge drev et boktrykkeri i Kristiansand og et teglverk på Eg, der de laget murstein.',
        labelDx: 8,
        labelDy: 4,
    },
    {
        id: 'stavanger',
        navn: 'Stavanger',
        lat: 58.97,
        lng: 5.73,
        tekst: 'Stavanger ble et av de store sentrene for haugianerne. Mange av haugianerne som senere satt på Stortinget, kom fra Vestlandet.',
        labelDx: 8,
        labelDy: 4,
    },
    {
        id: 'bergen',
        navn: 'Bergen',
        lat: 60.39,
        lng: 5.32,
        tekst: 'Våren 1801 ble Hauge kjøpmann i Bergen. Han fikk borgerbrev, altså lov fra myndighetene til å drive handel i byen.',
        labelDx: 8,
        labelDy: 4,
    },
    {
        id: 'vingelen',
        navn: 'Vingelen',
        lat: 62.4,
        lng: 10.7,
        tekst: 'Oppe i fjellbygda Vingelen drev haugianere en gruve der de tok ut kobber.',
        labelDx: 8,
        labelDy: 4,
    },
    {
        id: 'tromso',
        navn: 'Tromsø',
        lat: 69.65,
        lng: 18.96,
        tekst: 'Så langt nord kom Hauge på reisene sine mellom 1797 og 1804.',
        labelDx: -8,
        labelDy: 4,
        anchor: 'end',
    },
];

const CHRISTIANIA = { lat: 59.91, lng: 10.75 };

// Kartutsnittet er Norge fra Lindesnes til Tromsø. Finnmark er skåret bort for å gi
// Sør-Norge mer plass, der de fleste stedene ligger tett.
const VB_W = 230;
const VB_H = 412;
const BBOX = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
        type: 'MultiPoint' as const,
        coordinates: [
            [4.3, 57.8],
            [20.5, 70.2],
        ],
    },
};

const OCEAN = '#eaf2fb';
const LAND = '#dde5ee';
const NORGE = '#cfe0d4';
const LAND_STROKE = '#c2cedd';

// Hvert nytt vennesamfunn knyttes til de to nærmeste som allerede finnes.
function nyeBand(besokt: string[]): [string, string][] {
    const band: [string, string][] = [];
    besokt.forEach((id, i) => {
        if (i === 0) return;
        const a = STEDER.find((s) => s.id === id)!;
        const tidligere = besokt
            .slice(0, i)
            .map((bid) => STEDER.find((s) => s.id === bid)!)
            .sort(
                (x, y) =>
                    Math.hypot(x.lat - a.lat, x.lng - a.lng) -
                    Math.hypot(y.lat - a.lat, y.lng - a.lng)
            )
            .slice(0, 2);
        tidligere.forEach((b) => band.push([a.id, b.id]));
    });
    return band;
}

export function Vennenettet({ title = 'Vennenettet' }: VennenettetProps) {
    const { geographies } = useAtlasWorld();
    const [phase, setPhase] = useState<Phase>('reise');
    const [besokt, setBesokt] = useState<string[]>([]);
    const [gjetning, setGjetning] = useState<'faller' | 'holder' | null>(null);

    const projection = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [10, 10],
                    [VB_W - 10, VB_H - 10],
                ],
                BBOX
            ),
        []
    );
    const pathGen = useMemo(() => geoPath().projection(projection), [projection]);
    const pos = (lng: number, lat: number) => {
        const p = projection([lng, lat]);
        return { x: p ? p[0] : 0, y: p ? p[1] : 0 };
    };

    const land = useMemo(
        () =>
            geographies
                .filter((g) => ['578', '752', '246', '208'].includes(String(g.id)))
                .map((g) => ({
                    id: String(g.id),
                    d: pathGen(g as unknown as Parameters<typeof pathGen>[0]) ?? '',
                })),
        [geographies, pathGen]
    );

    const band = useMemo(() => nyeBand(besokt), [besokt]);
    const sistId = besokt[besokt.length - 1];
    const sist = STEDER.find((s) => s.id === sistId);
    const alleBesokt = besokt.length === STEDER.length;

    const hauge =
        phase === 'reise'
            ? sist
                ? pos(sist.lng, sist.lat)
                : pos(STEDER[0].lng, STEDER[0].lat)
            : pos(CHRISTIANIA.lng, CHRISTIANIA.lat);
    const fengsel = pos(CHRISTIANIA.lng, CHRISTIANIA.lat);

    const besok = (id: string) => {
        if (phase !== 'reise' || besokt.includes(id)) return;
        setBesokt((b) => [...b, id]);
    };

    const reset = () => {
        setPhase('reise');
        setBesokt([]);
        setGjetning(null);
    };

    const svar = (valg: 'faller' | 'holder') => {
        setGjetning(valg);
        setPhase('fasit');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på stedene på kartet og send Hauge rundt i Norge.
                    </p>
                </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row gap-4">
                {/* Kartet */}
                <div className="shrink-0 mx-auto">
                    <svg
                        viewBox={`0 0 ${VB_W} ${VB_H}`}
                        className="w-[200px] h-auto rounded-lg"
                        style={{ background: OCEAN }}
                        role="img"
                        aria-label="Kart over Norge med stedene Hauge besøkte"
                    >
                        {land.map((l) => (
                            <path
                                key={l.id}
                                d={l.d}
                                fill={l.id === '578' ? NORGE : LAND}
                                stroke={LAND_STROKE}
                                strokeWidth={0.6}
                            />
                        ))}

                        {/* Bånd mellom vennesamfunnene */}
                        {band.map(([a, b]) => {
                            const sa = STEDER.find((s) => s.id === a)!;
                            const sb = STEDER.find((s) => s.id === b)!;
                            const pa = pos(sa.lng, sa.lat);
                            const pb = pos(sb.lng, sb.lat);
                            return (
                                <g key={`${a}-${b}`}>
                                    <motion.line
                                        x1={pa.x}
                                        y1={pa.y}
                                        x2={pb.x}
                                        y2={pb.y}
                                        stroke="#6366f1"
                                        strokeWidth={1.4}
                                        strokeDasharray="3 2"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.7 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                    {phase === 'fasit' && (
                                        <motion.circle
                                            r={3.2}
                                            fill="#f59e0b"
                                            initial={{ cx: pa.x, cy: pa.y }}
                                            animate={{
                                                cx: [pa.x, pb.x, pa.x],
                                                cy: [pa.y, pb.y, pa.y],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                                delay: ((a.length + b.length) % 5) * 0.3,
                                            }}
                                        />
                                    )}
                                </g>
                            );
                        })}

                        {/* Stedene */}
                        {STEDER.map((s) => {
                            const p = pos(s.lng, s.lat);
                            const er = besokt.includes(s.id);
                            return (
                                <g
                                    key={s.id}
                                    onClick={() => besok(s.id)}
                                    className={phase === 'reise' && !er ? 'cursor-pointer' : ''}
                                >
                                    <circle cx={p.x} cy={p.y} r={11} fill="transparent" />
                                    {!er && phase === 'reise' && (
                                        <motion.circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={7}
                                            fill="none"
                                            stroke="#6366f1"
                                            strokeWidth={1}
                                            animate={{ opacity: [0.8, 0], scale: [0.6, 1.4] }}
                                            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                                            transition={{ duration: 1.6, repeat: Infinity }}
                                        />
                                    )}
                                    <motion.circle
                                        cx={p.x}
                                        cy={p.y}
                                        animate={{ r: er ? 6 : 4 }}
                                        fill={er ? '#4f46e5' : '#ffffff'}
                                        stroke="#4f46e5"
                                        strokeWidth={1.5}
                                    />
                                    <text
                                        x={p.x + (s.labelDx ?? 8)}
                                        y={p.y + (s.labelDy ?? 4)}
                                        textAnchor={s.anchor ?? 'start'}
                                        fontSize={10}
                                        fontWeight={er ? 700 : 500}
                                        fill="#334155"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {s.navn}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Fengselet i Christiania */}
                        {phase !== 'reise' && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <rect
                                    x={fengsel.x - 7}
                                    y={fengsel.y - 7}
                                    width={14}
                                    height={14}
                                    rx={3}
                                    fill="#e2e8f0"
                                    stroke="#64748b"
                                />
                                <text
                                    x={fengsel.x + 10}
                                    y={fengsel.y - 8}
                                    fontSize={9}
                                    fill="#475569"
                                >
                                    Christiania
                                </text>
                            </motion.g>
                        )}

                        {/* Hauge */}
                        <motion.g
                            initial={false}
                            animate={{ x: hauge.x, y: hauge.y }}
                            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                            style={{ pointerEvents: 'none' }}
                        >
                            <circle
                                r={5}
                                fill={phase === 'reise' ? '#f59e0b' : '#94a3b8'}
                                stroke="#ffffff"
                                strokeWidth={1.5}
                            />
                        </motion.g>
                    </svg>
                </div>

                {/* Panelet */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex gap-2 text-xs">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                            Vennesamfunn: {besokt.length}/{STEDER.length}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                            Bånd: {band.length}
                        </span>
                    </div>

                    <AnimatePresence mode="wait">
                        {phase === 'reise' && (
                            <motion.div
                                key={sistId ?? 'start'}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                            >
                                {sist ? (
                                    <>
                                        <div className="flex items-center gap-2 font-semibold mb-1">
                                            <MapPin className="w-4 h-4" /> {sist.navn}
                                        </div>
                                        <p>{sist.tekst}</p>
                                    </>
                                ) : (
                                    <div className="flex gap-2">
                                        <Footprints className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p>
                                            Hauge (den gule prikken) står klar til å reise. Hvert
                                            sted han besøker, får et vennesamfunn. Vennene skriver
                                            brev til hverandre - de stiplede linjene.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {phase === 'arrestert' && (
                            <motion.div
                                key="arrestert"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
                            >
                                <div className="flex items-center gap-2 font-semibold mb-1">
                                    <Lock className="w-4 h-4" /> 1804: Hauge sitter i fengsel
                                </div>
                                <p className="mb-3">
                                    Myndighetene satte Hauge i fengsel i Christiania. Han ble
                                    sittende i nesten ti år. Hva tror du skjer med vennesamfunnene?
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => svar('faller')}
                                        className="text-left bg-white hover:bg-rose-100 border border-rose-200 rounded-lg px-3 py-2 transition-colors"
                                    >
                                        De går i oppløsning uten lederen sin.
                                    </button>
                                    <button
                                        onClick={() => svar('holder')}
                                        className="text-left bg-white hover:bg-rose-100 border border-rose-200 rounded-lg px-3 py-2 transition-colors"
                                    >
                                        De holder sammen og fortsetter.
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {phase === 'fasit' && (
                            <motion.div
                                key="fasit"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                                className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                            >
                                <div className="flex items-center gap-2 font-semibold mb-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {gjetning === 'holder'
                                        ? 'Riktig! Nettet holdt.'
                                        : 'Nei - nettet holdt.'}
                                </div>
                                <p className="mb-2">
                                    Se brevene (de gule prikkene). De går fortsatt mellom vennene,
                                    selv om Hauge sitter innelåst. Vennene hadde egne ledere, egne
                                    bedrifter og hverandre.
                                </p>
                                <p className="flex gap-2 font-medium">
                                    <Mail className="w-4 h-4 shrink-0 mt-0.5" />I 1814, samme år som
                                    Hauge fikk dommen sin, satt tre haugianere i riksforsamlingen på
                                    Eidsvoll.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feedback-sone: alltid til stede */}
                    <div className="flex gap-2 text-xs text-slate-500 min-h-[2.5rem]">
                        <Lightbulb className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>
                            {phase === 'reise' &&
                                !alleBesokt &&
                                `Besøk alle stedene. ${STEDER.length - besokt.length} igjen.`}
                            {phase === 'reise' &&
                                alleBesokt &&
                                'Nå har Hauge et nett av venner over hele landet. Men myndighetene liker det ikke.'}
                            {phase === 'arrestert' && 'Velg det svaret du tror på.'}
                            {phase === 'fasit' &&
                                'En bevegelse som bare henger på én leder, faller når lederen blir tatt. Et nett av venner gjør det ikke.'}
                        </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2">
                        {phase === 'reise' && (
                            <motion.button
                                onClick={() => setPhase('arrestert')}
                                disabled={!alleBesokt}
                                animate={alleBesokt ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                                transition={{ duration: 1.2, repeat: alleBesokt ? Infinity : 0 }}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-5 py-2 text-sm font-medium"
                            >
                                1804: Arrester Hauge
                            </motion.button>
                        )}
                        {phase !== 'reise' && <span />}
                        <button
                            onClick={reset}
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" /> Tilbakestill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
