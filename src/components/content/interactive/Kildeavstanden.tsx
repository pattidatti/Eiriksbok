import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, PenLine, Shovel, CheckCircle2, RotateCcw } from 'lucide-react';

// Lyspære: alt vi "vet" om et folk som ikke skrev selv, kommer fra andre.
// Eleven klikker en påstand og ser to ting på én gang: hvor mange år det gikk
// før noen skrev den ned, og hva den som skrev hadde å tjene på å si det.

interface Kildeavstandkrav {
    id: string;
    // Kort etikett på knappen.
    label: string;
    // Selve påstanden, vist i panelet.
    text: string;
    // 'tekst' = noen skrev det ned. 'funn' = arkeologene gravde det fram.
    kind: 'tekst' | 'funn';
    // Årstall kilden ble til. Negativt tall = før vår tidsregning.
    sourceYear: number;
    // Hvordan årstallet skal leses av eleven.
    sourceYearLabel: string;
    // Hvem kilden er.
    author: string;
    // Hva den som laget kilden hadde å tjene på det.
    interest: string;
    // 1 = svak, 2 = middels, 3 = sterk.
    trust: 1 | 2 | 3;
    trustNote: string;
}

interface KildeavstandenProps {
    title?: string;
    // Perioden folket levde i (negative tall = fvt).
    periodFrom?: number;
    periodTo?: number;
    periodLabel?: string;
    // Tidsaksens ytterpunkter.
    axisFrom?: number;
    axisTo?: number;
    claims?: Kildeavstandkrav[];
}

const STANDARD_KRAV: Kildeavstandkrav[] = [
    {
        id: 'ville',
        label: 'Ville krigere',
        text: 'Kelterne var modige helt til det ufornuftige.',
        kind: 'tekst',
        sourceYear: -50,
        sourceYearLabel: 'ca. 50 fvt',
        author: 'Greske og romerske forfattere',
        interest:
            'De skrev om et folk de selv hadde kjempet mot. En farlig og vill fiende gjorde seieren større.',
        trust: 1,
        trustNote: 'Ingen keltere fikk svare.',
    },
    {
        id: 'druider',
        label: 'Druidene',
        text: 'Druidene ledet ofringene, dømte i rettssaker og var lærere.',
        kind: 'tekst',
        sourceYear: -52,
        sourceYearLabel: '52 fvt',
        author: 'Julius Caesar, romersk hærfører',
        interest:
            'Caesar var i krig med gallerne mens han skrev. Boka ble også lest hjemme i Roma, der han trengte støtte.',
        trust: 2,
        trustNote: 'Caesar hadde snakket med en gallisk druide selv.',
    },
    {
        id: 'muren',
        label: 'Muren',
        text: 'Steinen vernet muren mot ild, og treverket vernet den mot rambukken.',
        kind: 'tekst',
        sourceYear: -52,
        sourceYearLabel: '52 fvt',
        author: 'Julius Caesar, romersk hærfører',
        interest:
            'Her beskriver Caesar noe han selv måtte bryte gjennom. Han hadde ingen grunn til å gjøre fiendens mur bedre enn den var.',
        trust: 3,
        trustNote: 'Detaljene er praktiske og lette å kontrollere.',
    },
    {
        id: 'sagn',
        label: 'Sagnene',
        text: 'De keltiske sagnene forteller om helter, konger og en verden full av ånder.',
        kind: 'tekst',
        sourceYear: 550,
        sourceYearLabel: 'fra 500-tallet evt',
        author: 'Kristne munker på Irland og i Wales',
        interest:
            'Munkene var kristne og skrev ned fortellinger fra en tid da folk trodde på andre guder. De valgte hva som fikk bli med.',
        trust: 2,
        trustNote: 'Nedskrevet flere hundre år etter at kelterne var borte.',
    },
    {
        id: 'kjelen',
        label: 'Sølvkjelen',
        text: 'Kelterne hadde sølvsmeder som laget store kar med gudebilder på.',
        kind: 'funn',
        sourceYear: -50,
        sourceYearLabel: 'siste århundre fvt',
        author: 'Gundestrupkjelen, gravd opp av en myr i Danmark i 1891',
        interest:
            'Kjelen ble ikke laget for å overbevise noen. Den er en rest fra kelternes egen hverdag.',
        trust: 3,
        trustNote: 'Kilden er fra tiden selv. Ingen har skrevet den om.',
    },
];

type Phase = 'idle' | 'active' | 'complete';

// Negative årstall er før vår tidsregning.
function aarLabel(aar: number): string {
    if (aar === 0) return 'år 0';
    return aar < 0 ? `${Math.abs(aar)} fvt` : `${aar} evt`;
}

export function Kildeavstanden({
    title = 'Kildeavstanden',
    periodFrom = -800,
    periodTo = -50,
    periodLabel = 'Kelternes tid',
    axisFrom = -900,
    axisTo = 900,
    claims = STANDARD_KRAV,
}: KildeavstandenProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [opened, setOpened] = useState<string[]>([]);

    const active = claims.find((c) => c.id === activeId) ?? null;
    const phase: Phase =
        opened.length === 0 ? 'idle' : opened.length >= claims.length ? 'complete' : 'active';

    const ticks = useMemo(() => {
        const marks = [-800, -400, 0, 400, 800];
        return marks
            .filter((y) => y >= axisFrom && y <= axisTo)
            .map((y) => ({ year: y, label: aarLabel(y) }));
    }, [axisFrom, axisTo]);

    const pct = (year: number) =>
        Math.min(100, Math.max(0, ((year - axisFrom) / (axisTo - axisFrom)) * 100));

    const gap = active ? Math.max(0, active.sourceYear - periodTo) : 0;

    const velg = (id: string) => {
        setActiveId(id);
        setOpened((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const handleReset = () => {
        setActiveId(null);
        setOpened([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk en påstand om kelterne og se hvem som skrev den ned, og hvor lenge
                        etterpå.
                    </p>
                </div>
            </div>

            {/* Påstandene */}
            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {claims.map((c) => {
                    const er = c.id === activeId;
                    const lest = opened.includes(c.id);
                    return (
                        <motion.button
                            key={c.id}
                            onClick={() => velg(c.id)}
                            whileTap={{ scale: 0.95 }}
                            className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                                er
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : lest
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {c.label}
                        </motion.button>
                    );
                })}
            </div>

            {/* Påstanden i klartekst */}
            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={active ? active.id : 'tom'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`text-base leading-snug ${
                            active ? 'text-slate-800 font-medium' : 'text-slate-400 italic'
                        }`}
                    >
                        {active
                            ? `«${active.text}»`
                            : 'Velg en påstand over for å se hvor den kommer fra.'}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Tidsaksen */}
            <div className="px-5 pt-6 pb-2">
                <div className="relative h-24">
                    {/* Kelternes tid som skyggelagt felt */}
                    <div
                        className="absolute top-9 h-4 rounded bg-emerald-200/70 border border-emerald-300"
                        style={{
                            left: `${pct(periodFrom)}%`,
                            width: `${pct(periodTo) - pct(periodFrom)}%`,
                        }}
                    />
                    {/* Selve aksen */}
                    <div className="absolute top-[2.85rem] left-0 right-0 h-px bg-slate-300" />

                    {/* Årstall-merker */}
                    {ticks.map((t) => (
                        <div
                            key={t.year}
                            className="absolute top-[2.6rem]"
                            style={{ left: `${pct(t.year)}%` }}
                        >
                            <div className="w-px h-2 bg-slate-300" />
                            <div className="text-[10px] text-slate-400 -translate-x-1/2 mt-4 whitespace-nowrap">
                                {t.label}
                            </div>
                        </div>
                    ))}

                    {/* Avstanden mellom kelternes tid og kilden */}
                    {active && gap > 0 && (
                        <motion.div
                            key={`gap-${active.id}`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            style={{
                                left: `${pct(periodTo)}%`,
                                width: `${pct(active.sourceYear) - pct(periodTo)}%`,
                                transformOrigin: 'left',
                            }}
                            className="absolute top-[2.7rem] h-1.5 rounded bg-amber-400"
                        />
                    )}

                    {/* Nålen glir bort til året kilden ble til */}
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: active ? 1 : 0,
                            left: `${pct(active ? active.sourceYear : periodTo)}%`,
                        }}
                        transition={{ type: 'spring', stiffness: 190, damping: 22 }}
                        className="absolute top-2 pointer-events-none"
                    >
                        <div className="-translate-x-1/2 flex flex-col items-center">
                            <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                                    active?.kind === 'funn'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-indigo-600 text-white'
                                }`}
                            >
                                {active ? active.sourceYearLabel : ''}
                            </span>
                            <div
                                className={`w-px h-6 ${
                                    active?.kind === 'funn' ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Forklaring til det grønne feltet */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-4 h-3 rounded-sm bg-emerald-200 border border-emerald-300" />
                    <span className="text-xs text-slate-500">
                        {periodLabel}: {aarLabel(periodFrom)} til {aarLabel(periodTo)}
                    </span>
                </div>

                {/* Hvor stor avstanden er, i klartekst */}
                <AnimatePresence mode="wait">
                    {active && (
                        <motion.p
                            key={`gaptekst-${active.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-slate-600"
                        >
                            {gap > 0
                                ? `Kilden ble laget rundt ${gap} år etter at kelterne mistet makten.`
                                : 'Kilden er fra kelternes egen tid. Avstanden er null.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sonen: hvem kilden er og hva den hadde å tjene på det */}
            <div className="mx-5 mb-4 mt-3">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active ? `kort-${active.id}` : 'kort-tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border px-4 py-3 ${
                            active
                                ? active.kind === 'funn'
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-blue-50 border-blue-200'
                                : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                        {active ? (
                            <div className="flex gap-3">
                                {active.kind === 'funn' ? (
                                    <Shovel className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <PenLine className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0">
                                    <p
                                        className={`text-sm font-semibold ${
                                            active.kind === 'funn'
                                                ? 'text-emerald-800'
                                                : 'text-blue-800'
                                        }`}
                                    >
                                        {active.author}
                                    </p>
                                    <p className="text-sm text-slate-700 mt-1 leading-snug">
                                        {active.interest}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-slate-500">
                                            Hvor mye kan vi stole på den?
                                        </span>
                                        <span className="flex gap-1" aria-hidden="true">
                                            {[1, 2, 3].map((n) => (
                                                <motion.span
                                                    key={n}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.1 * n }}
                                                    className={`w-2.5 h-2.5 rounded-full ${
                                                        n <= active.trust
                                                            ? 'bg-amber-500'
                                                            : 'bg-slate-200'
                                                    }`}
                                                />
                                            ))}
                                        </span>
                                        <span className="text-xs text-slate-600">
                                            {active.trustNote}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                Her dukker det opp hvem som står bak påstanden, og hva
                                vedkommende hadde å tjene på å fortelle det.
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Fullført */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                        className="mx-5 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 flex gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-emerald-800 leading-snug">
                            Fire av fem kilder er laget av folk som ikke var keltere. Kelterne
                            skrev ikke ned sin egen historie, og derfor er det fiendene deres og
                            spaden som forteller den.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    {opened.length} av {claims.length} kilder åpnet
                </span>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
