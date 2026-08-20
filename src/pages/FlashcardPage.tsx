import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useConcepts } from '../hooks/useConcepts';
import { useManifest } from '../hooks/useManifest';
import type { ConceptItem } from '../hooks/useConcepts';
import { Link } from 'react-router-dom';
import { Filter, Search, RotateCw, ArrowRight, Brain, ThumbsUp } from 'lucide-react';
import { captureFlashcardGrade, conceptItemId } from '../utils/reviewCapture';
import { getSubjectLabel } from '../utils/subjectColors';
import { useReviewStore } from '../stores/useReviewStore';
import { useProgressStore } from '../features/progress/useProgressStore';
import { BOX_INTERVALS, todayLocal } from '../utils/reviewScheduler';
import type { ReviewItem } from '../types/review';

// Antall selvvurderte kort som utgjør én bunke. Bunken - ikke det enkelte
// kortet - er det som gir XP, slik at 660 kort ikke kan bli til 660 belønninger.
const GRADES_PER_BUNKE = 10;
// Bare de tre første bunkene per dag gir uttelling. Resten er fortsatt nyttig
// øving og teller i Leitner-køen, men XP-en er tak-satt så banken ikke kan
// grindes for nivåer.
const MAX_REWARDED_BUNKER = 3;

type StatusFilter = 'all' | 'started' | 'due' | 'learned';

export const FlashcardPage: React.FC = () => {
    const concepts = useConcepts();
    const { data: manifest } = useManifest();
    const reviewItems = useReviewStore((s) => s.items);
    const today = useMemo(() => todayLocal(), []);

    // Emne-chipene viste rå slugger med brutte norske tegn («Midtoesten»,
    // «Forste-verdenskrig», «Okonomi»). Manifestet har de ekte titlene.
    const topicTitles = useMemo(() => {
        const map = new Map<string, string>([['bibliotek', 'Tekstbiblioteket']]);
        for (const subject of manifest?.subjects ?? []) {
            for (const topic of subject.topics) {
                if (!map.has(topic.id)) map.set(topic.id, topic.title);
            }
        }
        return map;
    }, [manifest]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
    const [selectedTopic, setSelectedTopic] = useState<string | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // 151 av 656 begreper mangler `subject`. De var tidligere umulige å isolere
    // - de fantes kun i «Alle»-sekken. «Uten fag» er derfor en egen verdi.
    const subjects = useMemo(() => {
        const unique = new Set(concepts.map(c => c.subjectId).filter(Boolean));
        const list = Array.from(unique) as string[];
        if (concepts.some(c => !c.subjectId)) list.push('uten');
        return list;
    }, [concepts]);

    const matchesSubjectFilter = (concept: ConceptItem, subject: string) =>
        subject === 'all' ||
        (subject === 'uten' ? !concept.subjectId : concept.subjectId === subject);

    // Get unique topics for selected subject
    const topics = useMemo(() => {
        const filteredBySubject = concepts.filter(c => matchesSubjectFilter(c, selectedSubject));
        const unique = new Set(filteredBySubject.map(c => c.topicId).filter(Boolean));
        return Array.from(unique);
    }, [concepts, selectedSubject]);

    // Reset topic when subject changes. Justeres under render i stedet for i en
    // effect, så listen aldri vises ett bilde med forrige fags emne valgt.
    const [prevSubject, setPrevSubject] = useState(selectedSubject);
    if (selectedSubject !== prevSubject) {
        setPrevSubject(selectedSubject);
        setSelectedTopic('all');
    }

    // Leitner-tilstanden for hvert begrep. Uten dette oppslaget var siden
    // skrivebeføyet: den fylte repetisjonskøen uten å kunne vise den.
    const itemFor = useCallback(
        (concept: ConceptItem): ReviewItem | undefined => reviewItems[conceptItemId(concept.term)],
        [reviewItems]
    );

    // Tellerne regnes over hele banken, ikke det aktive filteret, slik at
    // tallene i chipene står stille mens eleven søker og bytter fag.
    const { startedCount, dueCount, learnedCount, nextDueDate } = useMemo(() => {
        let started = 0;
        let due = 0;
        let learned = 0;
        let next: string | null = null;
        for (const concept of concepts) {
            const item = reviewItems[conceptItemId(concept.term)];
            if (!item) continue;
            started++;
            if (item.dueDate <= today) due++;
            else if (next === null || item.dueDate < next) next = item.dueDate;
            if (item.box >= 4) learned++;
        }
        return { startedCount: started, dueCount: due, learnedCount: learned, nextDueDate: next };
    }, [concepts, reviewItems, today]);

    // Status-filteret leser fra et fastfryst øyeblikksbilde av køen, ikke fra
    // den levende store-verdien. Ellers ville et kort forsvunnet fra rutenettet
    // i samme øyeblikk eleven graderte det - midt i vende-animasjonen - fordi
    // det ikke lenger er «due». Bildet fornyes først når eleven selv endrer
    // søk, fag, emne eller status (samme justering-under-render som over).
    const filterSignature = `${searchTerm}|${selectedSubject}|${selectedTopic}|${statusFilter}`;
    const [prevSignature, setPrevSignature] = useState(filterSignature);
    const [queueSnapshot, setQueueSnapshot] = useState(reviewItems);
    if (filterSignature !== prevSignature) {
        setPrevSignature(filterSignature);
        setQueueSnapshot(reviewItems);
    }

    const filteredConcepts = useMemo(() => {
        const items = queueSnapshot;
        return concepts.filter(concept => {
            const matchesSearch = concept.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                concept.definition.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTopic = selectedTopic === 'all' || concept.topicId === selectedTopic;
            if (!matchesSearch || !matchesTopic) return false;
            if (!matchesSubjectFilter(concept, selectedSubject)) return false;
            if (statusFilter === 'all') return true;
            const item = items[conceptItemId(concept.term)];
            if (!item) return false;
            if (statusFilter === 'started') return true;
            return statusFilter === 'due' ? item.dueDate <= today : item.box >= 4;
        });
    }, [concepts, searchTerm, selectedSubject, selectedTopic, statusFilter, queueSnapshot, today]);

    // Bunke-teller: samler resultatene til de er GRADES_PER_BUNKE, og melder
    // da fra til «Min læring». Ref-en holder resultatene, state-en driver pilla.
    const bunkeResults = useRef<boolean[]>([]);
    const [bunkeCount, setBunkeCount] = useState(0);

    const handleGrade = useCallback((concept: ConceptItem, correct: boolean) => {
        captureFlashcardGrade(concept, correct);
        bunkeResults.current.push(correct);
        if (bunkeResults.current.length < GRADES_PER_BUNKE) {
            setBunkeCount(bunkeResults.current.length);
            return;
        }
        const results = bunkeResults.current;
        const correctCount = results.filter(Boolean).length;
        bunkeResults.current = [];
        setBunkeCount(0);

        // Bunkenummeret leses ut av hendelsesloggen, ikke av lokal state, slik
        // at en refresh midt i økta verken nullstiller eller åpner for grinding.
        const progress = useProgressStore.getState();
        const doneToday = progress.events.filter(
            (e) => e.day === today && e.kind === 'flashcard-session'
        ).length;
        if (doneToday >= MAX_REWARDED_BUNKER) return;
        progress.recordActivity({
            kind: 'flashcard-session',
            // Ingen skråstrek i id-en: subjectFromInput() leser første segment
            // foran en skråstrek som fag-id, og dagen ville blitt tagget som fag.
            activityId: `bunke-${doneToday + 1}-${today}`,
            score: correctCount / results.length,
            title: `Begrepsbunke (${correctCount}/${results.length})`,
        });
    }, [today]);

    return (
        <div className="min-h-screen pt-6 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Toppen holdes lav så første kortrad er synlig på 1366x768. */}
                <div className="mb-4">
                    <Link to="/oving" className="mb-2 inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                        <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                        Tilbake til oversikt
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        Fagbegreper
                    </h1>
                    <p className="text-sm text-slate-500">
                        Snu kortet, si om du kunne det - så husker systemet når du bør se det igjen.
                    </p>
                </div>

                {/* Controls */}
                <div className="mb-4 flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    {/* Search */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Søk i begreper..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Filters. Fag og emne står under hverandre og brytes over
                        flere linjer - side om side med overflow-x ble fag-radene
                        klippet slik at bare de to første fagene var synlige. */}
                    <div className="flex flex-col gap-3">
                        {/* Status: elevens egen repetisjonskø, ikke innholdets
                            inndeling. Står øverst fordi «hva bør jeg øve på nå»
                            er det viktigste spørsmålet siden kan svare på. */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Brain className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-500 font-medium mr-2">Status:</span>
                            <StatusChip
                                active={statusFilter === 'all'}
                                onClick={() => setStatusFilter('all')}
                                label="Alle"
                            />
                            <StatusChip
                                active={statusFilter === 'started'}
                                onClick={() => setStatusFilter('started')}
                                label={`Øvd på (${startedCount})`}
                                disabled={startedCount === 0}
                            />
                            <StatusChip
                                active={statusFilter === 'due'}
                                onClick={() => setStatusFilter('due')}
                                label={`Klar til repetisjon (${dueCount})`}
                                tone="amber"
                                disabled={dueCount === 0}
                            />
                            <StatusChip
                                active={statusFilter === 'learned'}
                                onClick={() => setStatusFilter('learned')}
                                label={`Kan dem (${learnedCount})`}
                                tone="emerald"
                                disabled={learnedCount === 0}
                            />
                        </div>

                        {/* Subject Filter */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                            <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-500 font-medium mr-2">Fag:</span>
                            <button
                                onClick={() => setSelectedSubject('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedSubject === 'all'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Alle
                            </button>
                            {subjects.map(subject => (
                                <button
                                    key={subject}
                                    onClick={() => setSelectedSubject(subject as string)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedSubject === subject
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {subject === 'uten' ? 'Uten fag' : getSubjectLabel(subject as string)}
                                </button>
                            ))}
                        </div>

                        {/* Emne-raden vises først når et fag er valgt. Med «Alle»
                            ble det 24 chips på fem linjer, og kortene ble presset
                            under skjermkanten. */}
                        {selectedSubject !== 'all' && topics.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                                <span className="text-sm text-slate-500 font-medium mr-2">Emne:</span>
                                <button
                                    onClick={() => setSelectedTopic('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedTopic === 'all'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Alle
                                </button>
                                {topics.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => setSelectedTopic(topic as string)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedTopic === topic
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {topicTitles.get(topic as string) ?? topic}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <p className="mb-4 text-sm text-slate-500" aria-live="polite">
                    Viser <span className="font-bold text-slate-900">{filteredConcepts.length}</span>{' '}
                    av {concepts.length} begreper
                </p>

                {/* Grid */}
                {filteredConcepts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredConcepts.map((concept) => (
                            <Flashcard
                                key={concept.id}
                                concept={concept}
                                topicTitles={topicTitles}
                                item={itemFor(concept)}
                                today={today}
                                onGrade={handleGrade}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-500">
                        {statusFilter === 'started'
                            ? 'Du har ikke øvd på noen kort ennå. Snu et kort og si om du kunne det.'
                            : statusFilter === 'due'
                            ? nextDueDate
                                ? `Ingen kort er klare akkurat nå. Neste kort er klart ${duePhrase(nextDueDate, today)}.`
                                : 'Ingen kort er klare akkurat nå. Snu noen kort og si om du kunne dem.'
                            : statusFilter === 'learned'
                              ? 'Ingen kort er lært ennå. Et kort havner her når du har klart det tre ganger på rad.'
                              : 'Ingen begreper funnet. Prøv å endre søket eller filteret.'}
                    </div>
                )}
            </div>

            <BunkePill count={bunkeCount} />
        </div>
    );
};

const StatusChip: React.FC<{
    label: string;
    active: boolean;
    onClick: () => void;
    tone?: 'indigo' | 'amber' | 'emerald';
    disabled?: boolean;
}> = ({ label, active, onClick, tone = 'indigo', disabled }) => {
    const activeTone = {
        indigo: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20',
        amber: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
        emerald: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
    }[tone];
    return (
        <button
            onClick={onClick}
            disabled={disabled && !active}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                active
                    ? activeTone
                    : disabled
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
            {label}
        </button>
    );
};

// Leitner-boksen som fem prikker. Gir eleven et synlig spor av arbeidet -
// uten dette var det umulig å se at systemet i det hele tatt husket noe.
const BoxPips: React.FC<{ box: number }> = ({ box }) => (
    <div className="flex items-center gap-1" title={`Boks ${box} av 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
            <span
                key={n}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    n <= box ? 'bg-indigo-500' : 'bg-slate-200'
                }`}
            />
        ))}
    </div>
);

// Flytende teller for bunken som er i gang. Ligger nederst til høyre så den
// ikke spiser vertikal plass på 1366x768.
const BunkePill: React.FC<{ count: number }> = ({ count }) => {
    if (count === 0) return null;
    const pct = Math.round((count / GRADES_PER_BUNKE) * 100);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full border border-indigo-100 bg-white/90 backdrop-blur px-4 py-2.5 shadow-lg shadow-indigo-500/10"
        >
            <div
                className="h-8 w-8 rounded-full grid place-items-center text-[10px] font-bold text-indigo-700"
                style={{
                    background: `conic-gradient(#6366f1 ${pct}%, #e2e8f0 ${pct}%)`,
                }}
            >
                <span className="h-6 w-6 rounded-full bg-white grid place-items-center">
                    {count}
                </span>
            </div>
            <span className="text-xs font-semibold text-slate-600">
                {GRADES_PER_BUNKE - count} kort til i bunken
            </span>
        </motion.div>
    );
};

const Flashcard: React.FC<{
    concept: ConceptItem;
    topicTitles: Map<string, string>;
    item?: ReviewItem;
    today: string;
    onGrade: (concept: ConceptItem, correct: boolean) => void;
}> = ({ concept, topicTitles, item, today, onGrade }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [justGraded, setJustGraded] = useState<boolean | null>(null);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const isDue = !!item && item.dueDate <= today;

    const grade = (e: React.MouseEvent, correct: boolean) => {
        e.stopPropagation();
        if (justGraded !== null) return;
        setJustGraded(correct);
        onGrade(concept, correct);
        // Kortet snur seg tilbake av seg selv: eleven skal videre til neste
        // kort, ikke måtte klikke seg ut av det de nettopp svarte på.
        timers.current.push(setTimeout(() => setIsFlipped(false), 800));
        timers.current.push(setTimeout(() => setJustGraded(null), 1200));
    };

    return (
        <div
            // perspective-1000 finnes ikke i Tailwind v4 - flippen har derfor
            // vært helt uten dybde. content-auto lar nettleseren hoppe over
            // kort utenfor viewport, som teller nå som banken er på 660 begreper.
            className="h-64 perspective-[1000px] content-auto cursor-pointer group"
            onClick={() => {
                if (justGraded !== null) return;
                setIsFlipped(!isFlipped);
            }}
        >
            <motion.div
                className="relative w-full h-full [transform-style:preserve-3d]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
            >
                {/* Front */}
                <div className="absolute inset-0 [backface-visibility:hidden]">
                    <div
                        className={`h-full w-full bg-white border-2 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 ${
                            justGraded === true
                                ? 'border-emerald-300 shadow-emerald-200/60'
                                : justGraded === false
                                  ? 'border-amber-300 shadow-amber-200/60'
                                  : isDue
                                    ? 'border-amber-200 hover:border-amber-300'
                                    : 'border-slate-100 hover:border-indigo-200'
                        }`}
                    >
                        <div className="absolute top-4 left-0 right-0 flex justify-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-semibold tracking-wide uppercase border border-slate-100">
                                {[
                                    concept.subjectId && getSubjectLabel(concept.subjectId),
                                    concept.topicId && (topicTitles.get(concept.topicId) ?? concept.topicId),
                                ]
                                    .filter(Boolean)
                                    .join(' • ') || 'Begrep'}
                            </span>
                        </div>

                        <div className="flex-1 flex items-center justify-center w-full px-2">
                            <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 leading-tight break-words hyphens-auto w-full">
                                {concept.term}
                            </h3>
                        </div>

                        {/* Bunnlinjen: Leitner-status i ro, snu-hintet ved hover */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4">
                            <div className="flex items-center gap-2 transition-opacity group-hover:opacity-0">
                                {item ? (
                                    <>
                                        <BoxPips box={item.box} />
                                        {isDue && (
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                                                Klar
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                                        Ikke øvd
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center gap-2 text-indigo-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>Klikk for å snu</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                >
                    <div className="h-full w-full bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-100/50 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-100/50 rounded-full blur-2xl"></div>

                        <div className="relative z-10 flex flex-col h-full w-full">
                            <div className="flex-1 flex items-center justify-center overflow-y-auto px-1">
                                <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium font-display">
                                    {concept.definition}
                                </p>
                            </div>

                            {justGraded !== null ? (
                                <div
                                    className={`mt-3 shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${
                                        justGraded
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                    {intervalText(item, justGraded)}
                                </div>
                            ) : (
                                <div className="mt-3 shrink-0 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={(e) => grade(e, false)}
                                        className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-amber-200 bg-white px-1.5 py-2 text-[11px] font-bold text-amber-700 transition-all hover:border-amber-300 hover:bg-amber-50 active:scale-95"
                                    >
                                        <Brain className="w-3.5 h-3.5 shrink-0" />
                                        Måtte tenke
                                    </button>
                                    <button
                                        onClick={(e) => grade(e, true)}
                                        className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-emerald-200 bg-white px-1.5 py-2 text-[11px] font-bold text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-95"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                                        Kunne den
                                    </button>
                                </div>
                            )}

                            {concept.lessonId && (
                                <Link
                                    to={`/${concept.subjectId}/${concept.topicId}/${concept.lessonId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-2 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors shrink-0"
                                >
                                    <span>Les mer</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// «i morgen» / «om 4 dager» ut fra to dag-strenger ('YYYY-MM-DD').
const duePhrase = (dueDate: string, today: string): string => {
    const parse = (d: string) => {
        const [y, m, day] = d.split('-').map(Number);
        return new Date(y, m - 1, day, 12).getTime();
    };
    const days = Math.round((parse(dueDate) - parse(today)) / 86400000);
    if (days <= 1) return 'i morgen';
    return `om ${days} dager`;
};

// Kvittering etter selvvurdering. Graderingen har allerede oppdatert item-prop-en
// når denne rendres, så boksen vi leser er den kortet faktisk landet i.
const intervalText = (item: ReviewItem | undefined, correct: boolean): string => {
    const days = BOX_INTERVALS[item?.box ?? 1];
    const naar = days === 1 ? 'i morgen' : `om ${days} dager`;
    return correct ? `Bra! Du ser den igjen ${naar}` : `Du ser den igjen ${naar}`;
};
