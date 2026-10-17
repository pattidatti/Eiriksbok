import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Coins,
    Factory,
    Flame,
    Footprints,
    MousePointerClick,
    Pickaxe,
    RotateCcw,
    Snowflake,
    Sparkles,
    Trees,
    Wheat,
} from 'lucide-react';

// CircumferensenKart: eleven klikker seg rundt i sirkelen på 45 km rundt Røros
// og finner alle trådene som måtte til for å lage kobber: gruva, skogen,
// kjørekarene, gårdene, reinbeitene, Femundshytta og handelen i Trondheim.
//
// Lyspære-øyeblikket: kobberet kom ikke fra én gruve, men fra et helt landskap.
// Verket trengte skogen, bøndene, hestene og kvinnene på gårdene - og det tok
// plass fra folk som var der fra før.
//
// Innholdet bygger på SNL (Berg mfl.: Røros kobberverk), Norges verdensarv
// (Røros bergstad og Circumferensen) og Johannessen (2024) på norgeshistorie.no.

interface CircumferensenKartProps {
    title?: string;
}

type Phase = 'utforsk' | 'ferdig';

interface Trad {
    id: string;
    sted: string;
    hvem: string;
    tekst: string;
    bakside: string;
    x: number;
    y: number;
    Ikon: typeof Pickaxe;
    utenfor?: boolean;
}

const MIDT = { x: 200, y: 200 };
const RADIUS = 150;

const TRADER: Trad[] = [
    {
        id: 'gruva',
        sted: 'Gruva',
        hvem: 'Bergmennene',
        tekst: 'Bergmennene brøt malmen løs i gruvene. Ved fyrsetting tente de bål mot fjellveggen, så steinen ble lettere å bryte.',
        bakside: 'Arbeidet var tungt og farlig, og det foregikk i mørket under bakken.',
        x: 285,
        y: 135,
        Ikon: Pickaxe,
    },
    {
        id: 'skogen',
        sted: 'Skogen',
        hvem: 'Bøndene ved kullmila',
        tekst: 'Smeltingen slukte ved og trekull. Bøndene i sirkelen måtte brenne trekull og kjøre ved til verket, mot betaling.',
        bakside: 'Allerede i 1670 var skogen nærmest smeltehytta hugget ut. Snart måtte kullet hentes langt unna.',
        x: 105,
        y: 135,
        Ikon: Trees,
    },
    {
        id: 'vinterveien',
        sted: 'Vinterveien',
        hvem: 'Kjørekarene',
        tekst: 'Med hest og slede fraktet kjørekarene malm, kull, ved og tømmer. Vinteren var best, for da kunne de kjøre over frosne vann og myrer.',
        bakside: 'Uten kjørekarene og hestene hadde hele verket stoppet opp.',
        x: 110,
        y: 270,
        Ikon: Snowflake,
    },
    {
        id: 'garden',
        sted: 'Gården',
        hvem: 'Kvinnene',
        tekst: 'Arbeiderne hadde små gårder med dyr. Mennene jobbet for verket, så kvinnene drev det meste av gårdsarbeidet.',
        bakside: 'Mens mennene var i gruva eller ved hytta, ble gården kvinnenes ansvar.',
        x: 200,
        y: 255,
        Ikon: Wheat,
    },
    {
        id: 'vidda',
        sted: 'Vidda',
        hvem: 'Sørsamiske reindriftsfamilier',
        tekst: 'Samene fulgte reinflokkene her lenge før verket kom. Reinen ga kjøtt, skinn, horn og reinost.',
        bakside: 'Verket gjorde store inngrep i naturen, og det ble kamp om skogen og beitene.',
        x: 290,
        y: 285,
        Ikon: Footprints,
    },
    {
        id: 'femund',
        sted: 'Femundshytta',
        hvem: 'En ny smeltehytte i skogen',
        tekst: 'I 1743 bygde verket en ny smeltehytte ved Femunden. Det var billigere å frakte malmen til skogen enn å frakte kullet til Røros.',
        bakside: 'Når skogen tok slutt, flyttet verket seg etter den.',
        x: 255,
        y: 335,
        Ikon: Flame,
    },
    {
        id: 'handelen',
        sted: 'Trondheim',
        hvem: 'Kjøpmennene',
        tekst: 'Det rene kobberet ble kjørt til Trondheim. Kjøpmenn der eide store deler av verket og solgte kobberet videre, mest til Amsterdam.',
        bakside: 'Kongen tok en tiendedel av kobberet, i tillegg til toll og avgifter.',
        x: 165,
        y: 30,
        Ikon: Coins,
        utenfor: true,
    },
];

export function CircumferensenKart({
    title = 'Hva skal til for å lage kobber?',
}: CircumferensenKartProps) {
    const [funnet, setFunnet] = useState<string[]>([]);
    const [valgt, setValgt] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>('utforsk');

    const aktiv = TRADER.find((t) => t.id === valgt) ?? null;

    const velg = (id: string) => {
        setValgt(id);
        if (funnet.includes(id)) return;
        const neste = [...funnet, id];
        setFunnet(neste);
        if (neste.length === TRADER.length) setPhase('ferdig');
    };

    const handleReset = () => {
        setFunnet([]);
        setValgt(null);
        setPhase('utforsk');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Factory className="w-5 h-5 text-amber-600" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på stedene i sirkelen og finn alt smeltehytta på Røros trengte.
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-6 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
                {/* Kartet */}
                <div className="relative">
                    <svg
                        viewBox="0 0 400 380"
                        className="w-full max-h-[340px]"
                        role="img"
                        aria-label="Skisse av sirkelen på 45 km rundt Røros"
                    >
                        <motion.circle
                            cx={MIDT.x}
                            cy={MIDT.y}
                            r={RADIUS}
                            initial={false}
                            animate={{
                                fill: phase === 'ferdig' ? '#fef3c7' : '#f8fafc',
                                stroke: phase === 'ferdig' ? '#d97706' : '#cbd5e1',
                            }}
                            transition={{ duration: 0.8 }}
                            strokeWidth={2}
                            strokeDasharray="6 6"
                        />
                        <text x={MIDT.x + 6} y={MIDT.y - RADIUS + 16} className="fill-slate-400 text-[11px]">
                            45 km
                        </text>
                        <line
                            x1={MIDT.x}
                            y1={MIDT.y}
                            x2={MIDT.x}
                            y2={MIDT.y - RADIUS}
                            stroke="#cbd5e1"
                            strokeWidth={1}
                        />

                        {TRADER.filter((t) => funnet.includes(t.id)).map((t) => (
                            <motion.line
                                key={`linje-${t.id}`}
                                x1={t.x}
                                y1={t.y}
                                x2={MIDT.x}
                                y2={MIDT.y}
                                stroke="#d97706"
                                strokeWidth={3}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            />
                        ))}

                        {/* Smeltehytta i midten */}
                        <motion.circle
                            cx={MIDT.x}
                            cy={MIDT.y}
                            r={22}
                            fill="#ffffff"
                            stroke="#d97706"
                            strokeWidth={3}
                            animate={{ scale: phase === 'ferdig' ? [1, 1.25, 1] : 1 }}
                            transition={{ duration: 0.6 }}
                            style={{ transformOrigin: `${MIDT.x}px ${MIDT.y}px` }}
                        />
                        <foreignObject x={MIDT.x - 11} y={MIDT.y - 11} width={22} height={22}>
                            <Factory className="w-[22px] h-[22px] text-amber-600" />
                        </foreignObject>
                        <text
                            x={MIDT.x}
                            y={MIDT.y + 38}
                            textAnchor="middle"
                            className="fill-slate-700 text-[12px] font-semibold"
                        >
                            Smeltehytta, Røros
                        </text>

                        {TRADER.map((t) => {
                            const er = funnet.includes(t.id);
                            const erValgt = valgt === t.id;
                            return (
                                <g
                                    key={t.id}
                                    onClick={() => velg(t.id)}
                                    className="cursor-pointer"
                                    role="button"
                                    aria-label={t.sted}
                                >
                                    <motion.circle
                                        cx={t.x}
                                        cy={t.y}
                                        r={20}
                                        initial={false}
                                        animate={{
                                            fill: er ? '#fffbeb' : '#ffffff',
                                            stroke: erValgt ? '#4f46e5' : er ? '#d97706' : '#94a3b8',
                                            scale: erValgt ? 1.12 : 1,
                                        }}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.92 }}
                                        strokeWidth={2.5}
                                        style={{ transformOrigin: `${t.x}px ${t.y}px` }}
                                    />
                                    <foreignObject
                                        x={t.x - 9}
                                        y={t.y - 9}
                                        width={18}
                                        height={18}
                                        className="pointer-events-none"
                                    >
                                        <t.Ikon
                                            className={`w-[18px] h-[18px] ${er ? 'text-amber-600' : 'text-slate-500'}`}
                                        />
                                    </foreignObject>
                                    <text
                                        x={t.x}
                                        y={t.y + 34}
                                        textAnchor="middle"
                                        className="fill-slate-600 text-[11px] font-medium pointer-events-none"
                                    >
                                        {t.sted}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                    <p className="text-[11px] text-slate-400 text-center -mt-1">
                        Skisse, ikke målestokk. Trondheim ligger langt utenfor sirkelen.
                    </p>
                </div>

                {/* Feedback-sone */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Tråder funnet</span>
                        <span className="font-semibold text-slate-800">
                            {funnet.length} av {TRADER.length}
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className="h-full bg-amber-500"
                            initial={false}
                            animate={{ width: `${(funnet.length / TRADER.length) * 100}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>

                    <div className="min-h-[190px]">
                        <AnimatePresence mode="wait">
                            {aktiv ? (
                                <motion.div
                                    key={aktiv.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <aktiv.Ikon className="w-4 h-4 text-amber-700" />
                                        <span className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
                                            {aktiv.sted}
                                            {aktiv.utenfor ? ' (utenfor sirkelen)' : ''}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-slate-800">{aktiv.hvem}</p>
                                    <p className="text-sm text-slate-700 mt-1">{aktiv.tekst}</p>
                                    <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-3">
                                        Baksiden: {aktiv.bakside}
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="tom"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 flex items-start gap-2"
                                >
                                    <MousePointerClick className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>
                                        I midten står smeltehytta. Klikk på et sted for å se hva
                                        hytta trengte derfra, og hvem som gjorde jobben.
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {phase === 'ferdig' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 text-sm flex items-start gap-2"
                            >
                                <Sparkles className="w-5 h-5 shrink-0" />
                                <span>
                                    Alle trådene er funnet! Kobberet kom ikke fra én gruve, men fra
                                    et helt landskap: skogen, gårdene, hestene, vinterveiene og
                                    folkene i hele sirkelen.
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    {phase === 'ferdig'
                        ? 'Ferdig - klikk gjerne på stedene igjen.'
                        : 'Finn alle sju trådene.'}
                </span>
                <button
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
