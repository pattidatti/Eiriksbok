import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowLeft, Star as StarIcon } from 'lucide-react';
import { useConcepts } from '../hooks/useConcepts';
import { useManifest } from '../hooks/useManifest';
import { useReviewStore } from '../stores/useReviewStore';
import { useStepSounds } from '../hooks/useStepSounds';
import { todayLocal } from '../utils/reviewScheduler';
import {
    buildSkyWorld,
    nextDueStarIndex,
    nextUnlitStarIndex,
    type SkyTitles,
} from '../utils/skyModel';
import { SkyCanvas, type SkyCanvasHandle } from '../components/sky/SkyCanvas';
import { SkyHud } from '../components/sky/SkyHud';
import { StarRecallModal } from '../components/sky/StarRecallModal';

// Stjernehimmelen: et levende kunnskapskart oppå repetisjonskøen.
// Hvert begrep er en stjerne som tennes av læring og blafrer når
// glemselskurven sier det haster. Alt går gjennom review-store-v1 -
// ingen egen lagring. Se docs/Design documents/stjernehimmelen-blueprint.md

const INTRO_KEY = 'himmel-intro-v1';

export const SkyPage: React.FC = () => {
    const concepts = useConcepts();
    const { data: manifest } = useManifest();
    const items = useReviewStore((s) => s.items);
    const today = useMemo(() => todayLocal(), []);
    const reviewDueCount = useReviewStore((s) => s.dueCount(today));
    const reducedMotion = useReducedMotion();
    const { play, setMuted, isMuted } = useStepSounds();

    const canvasRef = useRef<SkyCanvasHandle>(null);
    const jumpTimer = useRef<number | null>(null);
    const discoverCount = useRef(0);
    const [focusSubjectId, setFocusSubjectId] = useState<string | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [flare, setFlare] = useState<{ index: number; token: number } | null>(null);
    const [celebrate, setCelebrate] = useState<{ constellationId: string; token: number } | null>(
        null
    );
    const [muted, setMutedState] = useState(() => isMuted());
    const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(INTRO_KEY));

    const titles = useMemo<SkyTitles>(() => {
        const subjects: Record<string, string> = {};
        const topics: Record<string, string> = {};
        manifest?.subjects.forEach((subject) => {
            subjects[subject.id] = subject.title;
            subject.topics.forEach((topic) => {
                topics[`${subject.id}/${topic.id}`] = topic.title;
            });
        });
        return { subjects, topics };
    }, [manifest]);

    const world = useMemo(
        () => buildSkyWorld(concepts, items, today, titles),
        [concepts, items, today, titles]
    );

    useEffect(() => {
        return () => {
            if (jumpTimer.current !== null) window.clearTimeout(jumpTimer.current);
        };
    }, []);

    const dismissIntro = () => {
        localStorage.setItem(INTRO_KEY, '1');
        setShowIntro(false);
    };

    const toggleMute = () => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
    };

    const handleFocusSubject = (subjectId: string | null) => {
        setFocusSubjectId(subjectId);
        if (subjectId) canvasRef.current?.focusRegion(subjectId);
        else canvasRef.current?.resetView();
    };

    const handleStarClick = (index: number) => {
        play('select');
        setSelected(index);
    };

    // Kameraet glir til stjernen, så åpner recall-kortet seg
    const flyToAndOpen = (index: number, delayMs: number) => {
        canvasRef.current?.focusStar(index);
        if (jumpTimer.current !== null) window.clearTimeout(jumpTimer.current);
        jumpTimer.current = window.setTimeout(() => setSelected(index), delayMs);
    };

    const handleJumpToDue = () => {
        const index = nextDueStarIndex(world.stars, focusSubjectId);
        if (index === null) return;
        flyToAndOpen(index, 550);
    };

    const handleDiscover = () => {
        discoverCount.current += 1;
        const index = nextUnlitStarIndex(world, focusSubjectId, `${today}:${discoverCount.current}`);
        if (index === null) return;
        flyToAndOpen(index, 550);
    };

    const igniteStar = (index: number) => {
        setFlare((prev) => ({ index, token: (prev?.token ?? 0) + 1 }));
    };

    const handleGrade = (correct: boolean): { completedTitle: string | null } => {
        if (selected === null) return { completedTitle: null };
        const star = world.stars[selected];
        // Fullfører dette stjernebildet? (alle andre lyser, denne var siste som manglet)
        const constellation = world.constellations.find((c) => c.starIndices.includes(selected));
        const completes =
            correct &&
            !!constellation &&
            constellation.starIndices.length >= 3 &&
            constellation.starIndices.every(
                (i) => i === selected || world.stars[i].status === 'lit'
            ) &&
            star.status !== 'lit';

        const store = useReviewStore.getState();
        // addItem er no-op hvis stjernen alt er i køen
        store.addItem({ id: star.reviewId, type: 'concept', term: star.term }, today);
        store.gradeItem(star.reviewId, correct, today);

        if (correct) {
            igniteStar(selected);
            play(completes ? 'complete' : 'correct');
        } else {
            play('incorrect');
        }
        if (completes && constellation) {
            setCelebrate((prev) => ({
                constellationId: constellation.id,
                token: (prev?.token ?? 0) + 1,
            }));
            if (!reducedMotion) {
                confetti({
                    particleCount: 70,
                    spread: 75,
                    origin: { y: 0.7 },
                    colors: ['#fbbf24', '#fde68a', '#818cf8', '#ffffff'],
                });
            }
        }
        return { completedTitle: completes && constellation ? constellation.title : null };
    };

    const handleAdd = () => {
        if (selected === null) return;
        const star = world.stars[selected];
        useReviewStore
            .getState()
            .addItem({ id: star.reviewId, type: 'concept', term: star.term }, today);
        igniteStar(selected);
        play('correct');
    };

    const handleNextDue = () => {
        const index = nextDueStarIndex(world.stars, focusSubjectId);
        if (index === null) {
            setSelected(null);
            return;
        }
        play('advance');
        setSelected(null);
        flyToAndOpen(index, 450);
    };

    const handleNextNew = () => {
        discoverCount.current += 1;
        const index = nextUnlitStarIndex(world, focusSubjectId, `${today}:${discoverCount.current}`);
        if (index === null) {
            setSelected(null);
            return;
        }
        play('advance');
        setSelected(null);
        flyToAndOpen(index, 450);
    };

    const selectedStar = selected !== null ? world.stars[selected] : null;
    const loading = concepts.length === 0;

    const selectedLink = useMemo(() => {
        if (!selectedStar) return null;
        const title = titles.topics[`${selectedStar.subjectId}/${selectedStar.topicId}`];
        if (!title) return null;
        return { href: `/${selectedStar.subjectId}/${selectedStar.topicId}`, label: title };
    }, [selectedStar, titles]);

    const hasNextDue = useMemo(
        () => nextDueStarIndex(world.stars, focusSubjectId) !== null,
        [world, focusSubjectId]
    );
    const hasNextNew = useMemo(
        () => nextUnlitStarIndex(world, focusSubjectId, 'probe') !== null,
        [world, focusSubjectId]
    );

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] bg-[#04060f] overflow-hidden">
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-slate-400 text-lg animate-pulse">Teller stjerner …</p>
                </div>
            ) : (
                <SkyCanvas
                    ref={canvasRef}
                    world={world}
                    focusSubjectId={focusSubjectId}
                    reducedMotion={!!reducedMotion}
                    onStarClick={handleStarClick}
                    flare={flare}
                    celebrate={celebrate}
                />
            )}

            {/* Tittelpanel - lys glass oppå himmelen */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3 bg-white/85 backdrop-blur rounded-2xl px-4 py-2.5 shadow-lg border border-white/40">
                    <Link
                        to="/oving"
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Tilbake til Øving"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-display font-bold text-lg leading-none text-slate-900">
                            Stjernehimmelen
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <StarIcon className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <motion.span
                                key={world.litCount}
                                initial={{ scale: 1.5, color: '#d97706' }}
                                animate={{ scale: 1, color: '#64748b' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                className="font-bold"
                            >
                                {world.litCount}
                            </motion.span>
                            av {world.stars.length} stjerner tent
                        </p>
                    </div>
                </div>
            </div>

            {/* Tegnforklaring - projektor-vennlig */}
            {!loading && !showIntro && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-none hidden md:flex items-center gap-4 bg-white/75 backdrop-blur rounded-2xl px-4 py-2 shadow-lg border border-white/40 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_6px_2px_rgba(251,191,36,0.7)]" />
                        Tent
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                        Blafrer
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400/60" />
                        Utent
                    </span>
                </div>
            )}

            {!loading && (
                <SkyHud
                    world={world}
                    focusSubjectId={focusSubjectId}
                    onFocusSubject={handleFocusSubject}
                    onJumpToDue={handleJumpToDue}
                    onDiscover={handleDiscover}
                    hasDiscoverable={hasNextNew}
                    reviewDueCount={reviewDueCount}
                    muted={muted}
                    onToggleMute={toggleMute}
                />
            )}

            {/* Engangs-intro: lær metaforen på fem sekunder */}
            <AnimatePresence>
                {showIntro && !loading && (
                    <motion.div
                        className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-md bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-7 sm:p-8"
                            initial={{ scale: 0.92, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                        >
                            <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">
                                Dette er kunnskapen din
                            </h2>
                            <p className="text-slate-500 mb-5">
                                Hvert fagbegrep er en stjerne på himmelen din.
                            </p>
                            <ul className="space-y-3.5 mb-7">
                                <li className="flex items-center gap-3">
                                    <span className="w-4 h-4 shrink-0 rounded-full bg-amber-300 shadow-[0_0_10px_3px_rgba(251,191,36,0.7)]" />
                                    <span className="text-slate-700">
                                        <strong>Tent stjerne</strong> - et begrep du husker.
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="w-4 h-4 shrink-0 rounded-full bg-amber-400 animate-pulse" />
                                    <span className="text-slate-700">
                                        <strong>Blafrende stjerne</strong> - i ferd med å bli
                                        glemt. Klikk for å redde den.
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="w-4 h-4 shrink-0 rounded-full bg-slate-300" />
                                    <span className="text-slate-700">
                                        <strong>Grå prikk</strong> - et begrep du ikke har lært
                                        ennå.
                                    </span>
                                </li>
                            </ul>
                            <button
                                onClick={dismissIntro}
                                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Utforsk himmelen min
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedStar && (
                    <StarRecallModal
                        key={selectedStar.reviewId}
                        star={selectedStar}
                        linkTo={selectedLink}
                        hasNextDue={hasNextDue}
                        hasNextNew={hasNextNew}
                        onClose={() => setSelected(null)}
                        onGrade={handleGrade}
                        onAdd={handleAdd}
                        onNextDue={handleNextDue}
                        onNextNew={handleNextNew}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
