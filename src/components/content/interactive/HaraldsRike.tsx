import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, RotateCcw, CheckCircle2, Ruler } from 'lucide-react';

// HaraldsRike: eleven klikker seg mellom tre kilder om Harald Hårfagre og ser
// kartet over riket hans vokse og krympe. Lyspære-øyeblikket: jo lenger fra
// Harald en kilde er skrevet, jo større blir riket hans - og det vi kan grave
// opp av bakken, er bare noen få storgårder langs kysten.

interface Kilde {
    id: string;
    label: string;
    when: string;
    // Hvor mange år etter slaget i Hafrsfjord (872) kilden ble laget.
    distance: number;
    distanceText: string;
    claim: string;
    // Hvilke landskap kilden gir Harald.
    regions: string[];
    // Vis de fem storgårdene arkeologene kjenner.
    showFarms?: boolean;
}

interface HaraldsRikeProps {
    title?: string;
    prompt?: string;
    regions?: string[];
    sources?: Kilde[];
    verdict?: string;
}

// Landskapene nordfra og sørover, med Viken og Opplandene sist i øst.
const DEFAULT_REGIONS = [
    'Finnmark',
    'Hålogaland',
    'Trøndelag',
    'Møre',
    'Sogn og Fjordane',
    'Hordaland',
    'Rogaland',
    'Agder',
    'Viken',
    'Opplandene',
];

// Gårdene arkeologene knytter til Harald, plassert i landskapet de ligger i.
const FARMS: Record<string, string[]> = {
    Rogaland: ['Utstein', 'Avaldsnes'],
    Hordaland: ['Fitjar', 'Alrekstad', 'Seim'],
};

const KJERNE = ['Sogn og Fjordane', 'Hordaland', 'Rogaland'];

const DEFAULT_SOURCES: Kilde[] = [
    {
        id: 'skald',
        label: 'Haraldskvadet',
        when: 'ca. år 900',
        distance: 30,
        distanceText: 'rundt 30 år etter slaget',
        claim: 'Et skaldedikt laget mens folk som husket Harald, fortsatt levde. Det gir ham makt på Vestlandet, og forteller at fiendene hans rømte østover etter Hafrsfjord. Kanskje styrte han deler av Agder også.',
        regions: KJERNE,
    },
    {
        id: 'snorre',
        label: 'Snorres Heimskringla',
        when: 'ca. 1230',
        distance: 358,
        distanceText: 'nesten 360 år etter slaget',
        claim: 'Snorre Sturlason skriver på Island, over 300 år etter. Hos ham styrer Harald hele Norge, fra Finnmark i nord til Viken i sør, og han kommer fra Vestfold. Ingen samtidig kilde sier dette.',
        regions: DEFAULT_REGIONS,
    },
    {
        id: 'arkeologi',
        label: 'Sporene i bakken',
        when: 'utgravinger i dag',
        distance: 30,
        distanceText: 'spor fra Haralds egen tid',
        claim: 'Arkeologene finner fem storgårder som knyttes til Harald: Utstein, Avaldsnes, Fitjar, Alrekstad og Seim. De ligger som perler på en snor langs kysten, omtrent én dagsseiling fra hverandre.',
        regions: KJERNE,
        showFarms: true,
    },
];

const DEFAULT_VERDICT =
    'Jo lenger fra Harald kilden er skrevet, jo større blir riket hans. Det vi kan ta og føle på, er fem gårder langs kystleia.';

type Phase = 'idle' | 'active' | 'complete';

export function HaraldsRike({
    title = 'Hvor stort var Haralds rike?',
    prompt = 'Klikk en kilde og se hvor mye av Norge den gir Harald.',
    regions = DEFAULT_REGIONS,
    sources = DEFAULT_SOURCES,
    verdict = DEFAULT_VERDICT,
}: HaraldsRikeProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [seen, setSeen] = useState<string[]>([]);

    const active = sources.find((s) => s.id === activeId) ?? null;
    const phase: Phase = !active ? 'idle' : seen.length >= sources.length ? 'complete' : 'active';

    const claimed = active ? active.regions : [];
    const maxDistance = Math.max(...sources.map((s) => s.distance), 100);

    const pick = (id: string) => {
        setActiveId(id);
        setSeen((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const handleReset = () => {
        setActiveId(null);
        setSeen([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Map className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{prompt}</p>
                </div>
            </div>

            <div className="p-5 grid gap-5 md:grid-cols-[190px_1fr]">
                {/* Kartet: landskapene nordfra og sørover */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            Nord
                        </span>
                        <motion.span
                            key={claimed.length}
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-[11px] font-bold text-amber-700"
                        >
                            {claimed.length} av {regions.length} landskap
                        </motion.span>
                    </div>

                    <div className="space-y-1">
                        {regions.map((r) => {
                            const isClaimed = claimed.includes(r);
                            const isCore = KJERNE.includes(r);
                            const farms = active?.showFarms ? (FARMS[r] ?? []) : [];
                            return (
                                <motion.div
                                    key={r}
                                    animate={{
                                        backgroundColor: isClaimed ? '#fcd34d' : '#e2e8f0',
                                        scale: isClaimed ? 1 : 0.97,
                                    }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                    className="rounded-lg px-2 py-1.5 flex items-center justify-between gap-1"
                                >
                                    <span
                                        className={`text-[11px] font-medium ${
                                            isClaimed ? 'text-amber-900' : 'text-slate-400'
                                        }`}
                                    >
                                        {r}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {farms.map((f) => (
                                            <motion.span
                                                key={f}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 400,
                                                    damping: 18,
                                                }}
                                                title={f}
                                                className="w-2 h-2 rounded-full bg-rose-600"
                                            />
                                        ))}
                                        {phase === 'complete' && isCore && (
                                            <motion.span
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 1.8 }}
                                                className="w-1.5 h-1.5 rounded-full bg-emerald-600"
                                            />
                                        )}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Sør</span>
                        {active?.showFarms && (
                            <span className="flex items-center gap-1 text-rose-600 font-medium">
                                <span className="w-2 h-2 rounded-full bg-rose-600" /> storgård
                            </span>
                        )}
                    </div>
                </div>

                {/* Kildevalg + avstandsmåler */}
                <div>
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                        {sources.map((s) => {
                            const isActive = s.id === activeId;
                            const isSeen = seen.includes(s.id);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => pick(s.id)}
                                    className={`text-left rounded-xl border px-3 py-2.5 transition-shadow ${
                                        isActive
                                            ? 'border-indigo-400 bg-indigo-50 shadow-md'
                                            : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <span className="flex items-start gap-1.5">
                                        <span
                                            className={`text-[13px] font-semibold leading-tight break-words ${
                                                isActive ? 'text-indigo-800' : 'text-slate-700'
                                            }`}
                                        >
                                            {s.label}
                                        </span>
                                        {isSeen && !isActive && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        )}
                                    </span>
                                    <span className="block text-[11px] text-slate-500 mt-0.5">
                                        {s.when}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Avstandsmåler: hvor langt fra Harald står kilden? */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                <Ruler className="w-3.5 h-3.5 text-slate-400" />
                                Avstand til Harald
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                                {active ? active.distanceText : 'velg en kilde'}
                            </span>
                        </div>
                        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                                animate={{
                                    width: `${((active?.distance ?? 0) / maxDistance) * 100}%`,
                                }}
                                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                                className={`h-full rounded-full ${
                                    (active?.distance ?? 0) > 200 ? 'bg-rose-400' : 'bg-emerald-400'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Feedback-sone: alltid til stede */}
                    <div className="mt-4 min-h-[104px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeId ?? 'tom'}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`px-4 py-3 rounded-lg border text-sm leading-relaxed ${
                                    active
                                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                            >
                                {active
                                    ? active.claim
                                    : 'Tre kilder forteller om det samme riket. Klikk den første og se hva den gir Harald.'}
                            </motion.div>
                        </AnimatePresence>

                        <AnimatePresence>
                            {phase === 'complete' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    className="mt-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{verdict}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    {seen.length} av {sources.length} kilder undersøkt
                </span>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
