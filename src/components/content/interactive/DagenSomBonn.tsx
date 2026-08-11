import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sunrise, Music4, HandHeart, Clock4, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: Etter denne interaksjonen skal eleven forstå at bønn i
// sikhismen ikke er én avsatt time, men en ramme rundt hele døgnet - alene før
// soloppgang, sammen i sang, og med hendene i kjøkkenet.

type Spor = 'huske' | 'synge' | 'dele';

interface Moment {
    id: string;
    hour: number;
    clock: string;
    title: string;
    body: string;
    spor: Spor;
}

interface SporInfo {
    label: string;
    short: string;
    dot: string;
    chip: string;
    ring: string;
    icon: typeof Sunrise;
}

const SPOR: Record<Spor, SporInfo> = {
    huske: {
        label: 'Å huske navnet',
        short: 'Alene',
        dot: '#6366f1',
        chip: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        ring: 'stroke-indigo-500',
        icon: Sunrise,
    },
    synge: {
        label: 'Å synge sammen',
        short: 'Sammen',
        dot: '#f59e0b',
        chip: 'bg-amber-50 border-amber-200 text-amber-700',
        ring: 'stroke-amber-500',
        icon: Music4,
    },
    dele: {
        label: 'Å dele med hendene',
        short: 'Med hendene',
        dot: '#10b981',
        chip: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        ring: 'stroke-emerald-500',
        icon: HandHeart,
    },
};

const STANDARD_MOMENTER: Moment[] = [
    {
        id: 'amritvela',
        hour: 4,
        clock: 'kl. 04',
        title: 'Amritvela',
        body: 'Sikhen står opp i timene før daggry, vasker seg og gjentar Guds navn i stillhet. Dagen begynner med å huske.',
        spor: 'huske',
    },
    {
        id: 'japji',
        hour: 5.5,
        clock: 'kl. 05',
        title: 'Japji Sahib',
        body: 'Morgenbønnen står helt først i den hellige boka. Den blir lest opp uten musikk, mens resten av boka blir sunget.',
        spor: 'huske',
    },
    {
        id: 'boka-fram',
        hour: 7,
        clock: 'kl. 07',
        title: 'Boka bæres fram',
        body: 'I gurdwaraen tas Guru Granth Sahib fram hver morgen og legges til ro hver kveld. Sikhene behandler boka som en levende lærer.',
        spor: 'synge',
    },
    {
        id: 'kirtan',
        hour: 9,
        clock: 'kl. 09',
        title: 'Kirtan',
        body: 'Musikere som kalles ragi synger salmer fra boka. Sang sammen med andre er selve hjertet i sikhenes gudstjeneste.',
        spor: 'synge',
    },
    {
        id: 'ardas',
        hour: 11,
        clock: 'kl. 11',
        title: 'Ardas',
        body: 'Fellesbønnen ardas nevner blant annet dem som døde for troen. Etterpå deles søt karah prasad ut til alle som er der, sikh eller ikke.',
        spor: 'synge',
    },
    {
        id: 'langar',
        hour: 13,
        clock: 'kl. 13',
        title: 'Langar',
        body: 'Alle setter seg på gulvet i lange rekker og spiser det samme gratis måltidet. Å sitte på samme gulv viser at ingen er finere enn andre.',
        spor: 'dele',
    },
    {
        id: 'seva',
        hour: 15,
        clock: 'kl. 15',
        title: 'Seva på kjøkkenet',
        body: 'Både råvarene og matlagingen er seva: frivillig arbeid som noen gir bort uten å få betalt for det.',
        spor: 'dele',
    },
    {
        id: 'rehras',
        hour: 18,
        clock: 'kl. 18',
        title: 'Rehras',
        body: 'Kveldsbønnen kommer rundt solnedgang, når arbeidsdagen er over. Den takker for dagen som er gått.',
        spor: 'huske',
    },
    {
        id: 'sohila',
        hour: 22,
        clock: 'kl. 22',
        title: 'Kirtan Sohila',
        body: 'Den siste bønnen leses rett før sikhen legger seg. Dermed er hele dagen rammet inn av å huske Guds navn.',
        spor: 'huske',
    },
];

const CX = 130;
const CY = 130;
const R = 96;

function pointAt(hour: number, radius: number) {
    const a = (hour / 24) * Math.PI * 2 - Math.PI / 2;
    return { x: CX + Math.cos(a) * radius, y: CY + Math.sin(a) * radius };
}

// Bue for dagslys (kl. 06 til kl. 18). Natt tegnes som hel sirkel under.
function dayArcPath() {
    const start = pointAt(6, R);
    const end = pointAt(18, R);
    return `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`;
}

interface DagenSomBonnProps {
    title?: string;
    intro?: string;
    moments?: Moment[];
}

export function DagenSomBonn({
    title = 'Dagen som bønn',
    intro = 'Klikk deg gjennom døgnet til en sikh. Hvert punkt viser hva som skjer.',
    moments = STANDARD_MOMENTER,
}: DagenSomBonnProps) {
    const [valgt, setValgt] = useState<string | null>(null);
    const [besokt, setBesokt] = useState<string[]>([]);

    const aktiv = moments.find((m) => m.id === valgt) ?? null;
    const ferdig = besokt.length === moments.length;

    const velg = (m: Moment) => {
        setValgt(m.id);
        setBesokt((b) => (b.includes(m.id) ? b : [...b, m.id]));
    };

    const tilbakestill = () => {
        setValgt(null);
        setBesokt([]);
    };

    const tell = (s: Spor) =>
        moments.filter((m) => m.spor === s && besokt.includes(m.id)).length;
    const totalt = (s: Spor) => moments.filter((m) => m.spor === s).length;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Clock4 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-5 sm:p-6 grid gap-6 md:grid-cols-[260px_1fr] items-start">
                {/* Døgnhjulet */}
                <div className="mx-auto">
                    <svg viewBox="0 0 260 260" className="w-[240px] h-[240px] sm:w-[260px] sm:h-[260px]">
                        <circle
                            cx={CX}
                            cy={CY}
                            r={R}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth={14}
                            strokeLinecap="round"
                        />
                        <path
                            d={dayArcPath()}
                            fill="none"
                            stroke="#fef3c7"
                            strokeWidth={14}
                            strokeLinecap="round"
                        />
                        <text
                            x={CX}
                            y={CY - 8}
                            textAnchor="middle"
                            className="fill-slate-400 text-[10px] font-semibold uppercase tracking-widest"
                        >
                            Døgnet
                        </text>
                        <text
                            x={CX}
                            y={CY + 14}
                            textAnchor="middle"
                            className="fill-slate-700 text-[19px] font-bold"
                        >
                            {besokt.length} / {moments.length}
                        </text>

                        {moments.map((m) => {
                            const p = pointAt(m.hour, R);
                            const erBesokt = besokt.includes(m.id);
                            const erValgt = valgt === m.id;
                            return (
                                <g
                                    key={m.id}
                                    onClick={() => velg(m)}
                                    className="cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${m.clock}: ${m.title}`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            velg(m);
                                        }
                                    }}
                                >
                                    {/* Romslig usynlig klikkflate - trygg på trackpad */}
                                    <circle cx={p.x} cy={p.y} r={20} fill="transparent" />
                                    {erValgt && (
                                        <motion.circle
                                            layoutId="valgt-ring"
                                            cx={p.x}
                                            cy={p.y}
                                            r={16}
                                            fill="none"
                                            stroke={SPOR[m.spor].dot}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                    <motion.circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={9}
                                        initial={{ r: 9 }}
                                        animate={{ r: erValgt ? 11 : 9 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                        fill={erBesokt ? SPOR[m.spor].dot : '#ffffff'}
                                        stroke={erBesokt ? SPOR[m.spor].dot : '#94a3b8'}
                                        strokeWidth={2.5}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Detaljpanel - alltid til stede, ingen scrolling */}
                <div className="min-h-[196px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {aktiv ? (
                            <motion.div
                                key={aktiv.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.22 }}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                        {aktiv.clock}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${SPOR[aktiv.spor].chip}`}
                                    >
                                        {(() => {
                                            const Ikon = SPOR[aktiv.spor].icon;
                                            return <Ikon className="w-3.5 h-3.5" />;
                                        })()}
                                        {SPOR[aktiv.spor].label}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-slate-800 mb-1">{aktiv.title}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{aktiv.body}</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="tom"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500"
                            >
                                Klikk en prikk på hjulet. Prikkene i den lyse delen er dagtid, de i
                                den grå delen er natt og tidlig morgen.
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sporene, alltid synlige */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {(Object.keys(SPOR) as Spor[]).map((s) => {
                            const Ikon = SPOR[s].icon;
                            const funnet = tell(s);
                            return (
                                <div
                                    key={s}
                                    className={`rounded-xl border px-3 py-2 ${
                                        funnet > 0
                                            ? SPOR[s].chip
                                            : 'bg-white border-slate-200 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                        <Ikon className="w-3.5 h-3.5 flex-shrink-0" />
                                        {SPOR[s].short}
                                    </div>
                                    <div className="text-sm font-bold tabular-nums">
                                        {funnet} av {totalt(s)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="mx-5 sm:mx-6 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-800 leading-relaxed">
                                Du har vært gjennom hele døgnet. Legg merke til at bønnen ikke er én
                                avsatt time. Den rammer inn hele dagen: alene i mørket før sola står
                                opp, sammen med andre i sang, og med hendene i kjøkkenet. I sikhismen
                                er alle tre måter å huske Gud på.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                    {ferdig
                        ? 'Alle punktene er utforsket.'
                        : `${moments.length - besokt.length} punkter igjen på hjulet.`}
                </p>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
