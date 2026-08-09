import React, { useState, useEffect, useRef } from 'react';
import { ChronoCard, type TimelineEvent } from './ChronoCard';
import { motion, AnimatePresence, useAnimationControls, type PanInfo } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Flame, Zap, RotateCcw, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { useChronoSound } from '../../../hooks/useChronoSound';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { JuiceEffects } from './JuiceEffects';
import { eraForYear, ALL_ERAS, ERA_DEFS, type EraKey } from './chronoEras';
import { recordMissed, recordPlaced, recordGameEnd, weightedShuffle } from '../../../utils/chronoStats';

function vibrate(pattern: number | number[], reduced: boolean) {
    if (reduced) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(pattern); } catch { /* ignore */ }
    }
}

interface ChronoBoardProps {
    events: TimelineEvent[];
    onGameOver: (score: number) => void;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export const ChronoBoard: React.FC<ChronoBoardProps> = ({ events, onGameOver, difficulty = 'medium' }) => {
    // ... (state vars same)
    const [deck, setDeck] = useState<TimelineEvent[]>([]);
    const [hand, setHand] = useState<TimelineEvent | null>(null);
    const [placedCards, setPlacedCards] = useState<TimelineEvent[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
    const [highlightSlots, setHighlightSlots] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [highscore, setHighscore] = useState(0);
    const [hints, setHints] = useState(2);
    const [undos, setUndos] = useState(1);
    const [isHintActive, setIsHintActive] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [lastWrongHand, setLastWrongHand] = useState<TimelineEvent | null>(null);
    const [missedCards, setMissedCards] = useState<TimelineEvent[]>([]);

    // Juice / FX state
    const sound = useChronoSound();
    const reducedMotion = useReducedMotion();
    const [muted, setMutedState] = useState(sound.isMuted());
    const [isTouchDevice] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    });
    const [isCompact, setIsCompact] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.innerHeight < 820 || window.innerWidth < 1280;
    });
    useEffect(() => {
        const onResize = () => setIsCompact(window.innerHeight < 820 || window.innerWidth < 1280);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const [juiced, setJuiced] = useState<{ cardId: string; points: number; streakActive: boolean; color: EraKey } | null>(null);
    const shakeControls = useAnimationControls();
    const triggerShake = () => {
        if (reducedMotion) return;
        shakeControls.start({ x: [0, -10, 10, -7, 7, -4, 4, 0], transition: { duration: 0.45, ease: 'easeInOut' } });
    };

    // Load Highscore
    useEffect(() => {
        const saved = localStorage.getItem('chrono_highscore');
        if (saved) setHighscore(parseInt(saved, 10));
    }, []);

    const updateHighscore = (newScore: number) => {
        if (newScore > highscore) {
            setHighscore(newScore);
            localStorage.setItem('chrono_highscore', newScore.toString());
        }
    };

    // Drag and Drop State
    const [activeDropZone, setActiveDropZone] = useState<number | null>(null);
    const dropZoneRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
    const pendingTimeouts = useRef<Set<number>>(new Set());
    const queueTimeout = (cb: () => void, ms: number) => {
        const id = window.setTimeout(() => {
            pendingTimeouts.current.delete(id);
            cb();
        }, ms);
        pendingTimeouts.current.add(id);
        return id;
    };
    const clearPendingTimeouts = () => {
        pendingTimeouts.current.forEach((id) => window.clearTimeout(id));
        pendingTimeouts.current.clear();
    };
    useEffect(() => () => clearPendingTimeouts(), []);

    // Auto-scroll State
    const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!scrollDirection) return;
        const scrollAmount = 15;
        const interval = setInterval(() => {
            if (scrollContainerRef.current) {
                if (scrollDirection === 'left') {
                    scrollContainerRef.current.scrollLeft -= scrollAmount;
                } else {
                    scrollContainerRef.current.scrollLeft += scrollAmount;
                }
            }
        }, 16);
        return () => clearInterval(interval);
    }, [scrollDirection]);

    useEffect(() => {
        if (events.length > 0) initGame();
        // Spillet skal deles ut på nytt når kortstokken endres - ikke hver gang
        // initGame får ny identitet. initGame lages på nytt ved hver render (den
        // rører et titalls setters), så en dep på den ville startet et nytt spill
        // midt i det eleven holder på med.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    useEffect(() => {
        // Auto-highlight logic for tutorial
        if (hand && gameState === 'playing') {
            const timer = setTimeout(() => setHighlightSlots(true), 2500);
            return () => clearTimeout(timer);
        } else {
            setHighlightSlots(false);
        }
    }, [hand, gameState]);

    const initGame = () => {
        clearPendingTimeouts();
        setFeedback(null);
        const shuffled = weightedShuffle(events);
        const firstCard = shuffled.pop();
        if (firstCard) {
            setPlacedCards([firstCard]);
            const nextHand = shuffled.pop() || null;
            setHand(nextHand);
            setDeck(shuffled);
            setScore(0);
            setLives(3);
            setStreak(0);
            setHints(2);
            setUndos(1);
            setIsHintActive(false);
            setCanUndo(false);
            setLastWrongHand(null);
            setMissedCards([]);
            setGameState('playing');
            setHighlightSlots(false);
            setJuiced(null);
            if (nextHand) sound.play('pickup');
        }
    };

    const handleDrag = (info: PanInfo) => {
        // Simple collision detection
        const point = { x: info.point.x, y: info.point.y };
        let foundZone: number | null = null;

        dropZoneRefs.current.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (
                point.x >= rect.left &&
                point.x <= rect.right &&
                point.y >= rect.top &&
                point.y <= rect.bottom
            ) {
                foundZone = index;
            }
        });

        setActiveDropZone(foundZone);

        // Auto-scroll trigger based on container bounds
        if (scrollContainerRef.current) {
            const rect = scrollContainerRef.current.getBoundingClientRect();
            const margin = 120; // Distance from edge to start scrolling

            if (point.x < rect.left + margin && rect.left > 0) {
                setScrollDirection('left');
            } else if (point.x > rect.right - margin && rect.right < window.innerWidth) {
                setScrollDirection('right');
            } else if (point.x < 100) { // Screen edge fallbacks
                setScrollDirection('left');
            } else if (point.x > window.innerWidth - 100) {
                setScrollDirection('right');
            } else {
                setScrollDirection(null);
            }
        }
    };

    // Removed unused 'info' parameter
    const handleDragEnd = () => {
        if (activeDropZone !== null) {
            handlePlaceCard(activeDropZone);
        }
        setActiveDropZone(null);
        setScrollDirection(null);
    };

    const handlePlaceCard = (index: number) => {
        if (!hand || gameState !== 'playing' || feedback) return;

        let isValid = true;
        const prevCard = index > 0 ? placedCards[index - 1] : null;
        const nextCard = index < placedCards.length ? placedCards[index] : null;

        if (prevCard && hand.startDate < prevCard.startDate) isValid = false;
        if (nextCard && hand.startDate > nextCard.startDate) isValid = false;

        if (isValid) {
            // Success
            const newPlaced = [...placedCards];
            newPlaced.splice(index, 0, hand);
            const placedHand = hand;
            setPlacedCards(newPlaced);
            setHand(null); // Clear hand immediately to prevent snapback

            // Scoring with streak bonus (compute now so juice has correct values)
            const streakBonus = Math.floor(streak / 3);
            const pointsEarned = 1 + streakBonus;
            const newStreak = streak + 1;
            const isMilestone = newStreak >= 5 && newStreak % 5 === 0;

            recordPlaced(placedHand.id);
            sound.play('place');
            vibrate(10, reducedMotion);
            setJuiced({
                cardId: placedHand.id,
                points: pointsEarned,
                streakActive: streakBonus > 0,
                color: eraForYear(placedHand.startDate),
            });
            // Slight delay before chime so place-sound is distinguishable
            queueTimeout(() => {
                if (isMilestone) sound.play('streak');
                else sound.play('correct', newStreak);
            }, 80);

            setFeedback('correct');
            queueTimeout(() => {
                setFeedback(null);

                setScore(prev => prev + pointsEarned);
                setStreak(newStreak);
                if (newStreak > maxStreak) setMaxStreak(newStreak);

                if (isMilestone && !reducedMotion) {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#4f46e5', '#818cf8', '#ffffff']
                    });
                }

                setIsHintActive(false);
                setHighlightSlots(false);

                const nextCardFromDeck = deck.length > 0 ? deck[deck.length - 1] : null;
                if (nextCardFromDeck) {
                    setDeck(prev => prev.slice(0, -1));
                    setHand(nextCardFromDeck);
                    sound.play('pickup');
                } else {
                    setHand(null);
                    setGameState('gameover');
                    updateHighscore(score + pointsEarned);
                    recordGameEnd(Math.max(maxStreak, newStreak));
                    sound.play('streak'); // victory chime when deck is cleared
                    onGameOver(score + pointsEarned);
                }
            }, 600); // Wait for animation
            // Clear juice after animation completes
            queueTimeout(() => setJuiced(null), 1300);
            setCanUndo(false); // Can't undo a success
        } else {
            // Fail
            setFeedback('incorrect');
            setLastWrongHand(hand);
            setCanUndo(undos > 0);
            recordMissed(hand.id);
            sound.play('wrong');
            vibrate(60, reducedMotion);
            triggerShake();
            queueTimeout(() => {
                setFeedback(null);
                setStreak(0); // Reset streak on mistake
                setIsHintActive(false);

                // Add to missed cards if not already there
                setMissedCards(prev => {
                    if (prev.find(c => c.id === hand.id)) return prev;
                    return [...prev, hand];
                });

                setLives(prev => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setGameState('gameover');
                        updateHighscore(score);
                        recordGameEnd(maxStreak);
                        sound.play('gameOver');
                        onGameOver(score);
                    }
                    return newLives;
                });

                // Discard incorrectly placed card and draw new one
                const nextCardFromDeck = deck.length > 0 ? deck[deck.length - 1] : null;
                if (nextCardFromDeck) {
                    setDeck(prev => prev.slice(0, -1));
                    setHand(nextCardFromDeck);
                    sound.play('pickup');
                } else {
                    setHand(null);
                }
            }, 800);
        }
    };

    const handleUndo = () => {
        if (undos > 0 && canUndo && lastWrongHand) {
            setUndos(prev => prev - 1);
            setLives(prev => prev + 1); // Reclaim life
            setHand(lastWrongHand); // Get same card back
            setCanUndo(false);
            sound.play('pickup');
        }
    };

    const toggleMute = () => {
        const next = !muted;
        sound.setMuted(next);
        setMutedState(next);
    };

    const useHint = () => {
        if (hints > 0 && !isHintActive && hand) {
            setHints(prev => prev - 1);
            setIsHintActive(true);
            setHighlightSlots(true);
        }
    };

    // Helper to get era color
    const getEraColor = () => {
        if (!hand) return 'indigo';
        const year = hand.startDate;
        if (year < 500) return 'amber'; // Ancient
        if (year < 1500) return 'emerald'; // Medieval
        if (year < 1900) return 'rose'; // Modern
        return 'indigo'; // Contemporary
    };

    const eraColor = getEraColor();

    return (
        <motion.div
            animate={shakeControls}
            className={`w-full flex flex-col ${isCompact ? 'gap-4 pb-24 p-4' : 'gap-8 pb-32 p-6'} relative transition-colors duration-1000 bg-white/40 backdrop-blur-sm rounded-[2rem] shadow-xl border border-slate-200/50`}
        >

            {/* Feedback Overlay */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className={`p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 ${feedback === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}
                        >
                            <span className="text-6xl font-black">
                                {feedback === 'correct' ? 'Riktig!' : 'Feil!'}
                            </span>
                            {feedback === 'correct' && streak >= 3 && (
                                <span className="bg-white/20 px-4 py-1 rounded-full font-bold text-sm">
                                    Combo Bonus! +{Math.floor(streak / 3) + 1}
                                </span>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Bar */}
            <div className={`flex justify-between items-center bg-white/90 backdrop-blur-md ${isCompact ? 'p-2 px-3' : 'p-4'} rounded-2xl shadow-md border border-slate-100 sticky top-[64px] z-20 transition-all duration-500`}>
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Poeng</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-black text-${eraColor}-600 leading-none`}>{score}</span>
                            {highscore > 0 && (
                                <span className="text-[10px] font-bold text-slate-400">Best: {highscore}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase">Liv</span>
                        <motion.div
                            key={lives}
                            className="flex gap-1 text-2xl"
                        >
                            {[...Array(3)].map((_, i) => (
                                <span key={i} className={i < lives ? "text-red-500 drop-shadow-sm" : "text-slate-200"}>♥</span>
                            ))}
                        </motion.div>
                    </div>

                    <div className="h-10 w-px bg-slate-100 mx-2" />

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase">Streak</span>
                            <div className="flex items-center gap-1">
                                <span className={`text-2xl font-black transition-colors ${streak > 0 ? 'text-orange-500' : 'text-slate-300'}`}>
                                    {streak}
                                </span>
                                {streak >= 3 && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase flex items-center gap-1"
                                    >
                                        <Flame className="w-3 h-3 fill-current" />
                                        {Math.floor(streak / 3) + 1}x Bonus
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={useHint}
                        disabled={hints <= 0 || isHintActive || gameState !== 'playing'}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all
                            ${hints > 0 && !isHintActive
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                                : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'}
                        `}
                    >
                        <Zap className={`w-3.5 h-3.5 ${hints > 0 ? 'fill-amber-500' : ''}`} />
                        Hint ({hints})
                    </button>
                    <button
                        onClick={handleUndo}
                        disabled={undos <= 0 || !canUndo}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all
                            ${undos > 0 && canUndo
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 animate-pulse'
                                : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'}
                        `}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Angre ({undos})
                    </button>
                    <button
                        onClick={toggleMute}
                        aria-label={muted ? 'Skru på lyd' : 'Skru av lyd'}
                        title={muted ? 'Skru på lyd' : 'Skru av lyd'}
                        className="px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors flex items-center"
                    >
                        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={initGame} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors">
                        Restart
                    </button>
                </div>
            </div>

            {/* Era Legend */}
            <div className="flex flex-wrap items-center gap-2 -mt-4 px-1 text-[11px]">
                <span className="font-bold uppercase tracking-widest text-slate-400 text-[10px]">Epoker:</span>
                {ALL_ERAS.map(era => (
                    <div key={era.key} className="flex items-center gap-1.5 bg-white/70 px-2 py-0.5 rounded-full border border-slate-100">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: era.cssVar }} />
                        <span className="font-bold text-slate-600">{era.name}</span>
                        <span className="text-slate-400">{era.range}</span>
                    </div>
                ))}
            </div>

            {/* The Board / Timeline */}
            <div ref={scrollContainerRef} className={`relative ${isCompact ? 'min-h-[240px]' : 'min-h-[280px]'} flex items-center overflow-x-auto pb-4 pt-2 px-2 gap-0 no-scrollbar touch-pan-x`}>
                <div className="absolute top-1/2 left-0 w-full h-3 bg-slate-100 -z-10 rounded-full" />

                <DropZone
                    index={0}
                    onClick={() => handlePlaceCard(0)}
                    disabled={!hand || gameState !== 'playing'}
                    highlight={highlightSlots || activeDropZone === 0}
                    cardInHand={hand}
                    tapMode={isTouchDevice}
                    onRegister={(el) => { if (el) dropZoneRefs.current.set(0, el); else dropZoneRefs.current.delete(0); }}
                />

                <AnimatePresence>
                    {placedCards.map((card, index) => {
                        const era = eraForYear(card.startDate);
                        const prevEra = index > 0 ? eraForYear(placedCards[index - 1].startDate) : null;
                        const isEraStart = era !== prevEra;
                        const eraInfo = ERA_DEFS[era];
                        return (
                            <React.Fragment key={card.id}>
                                <motion.div
                                    layout
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="relative mx-2 z-10 shrink-0"
                                >
                                    {isEraStart && (
                                        <motion.div
                                            initial={reducedMotion ? false : { opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest whitespace-nowrap z-20"
                                            style={{ backgroundColor: `${eraInfo.cssVar}22`, color: eraInfo.cssVar }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eraInfo.cssVar }} />
                                            {eraInfo.name}
                                        </motion.div>
                                    )}
                                    <div
                                        className="absolute -top-1 left-2 right-2 h-1 rounded-full opacity-80 z-0"
                                        style={{ backgroundColor: eraInfo.cssVar }}
                                    />
                                    <ChronoCard event={card} isRevealed={true} compact={isCompact} />
                                    {juiced?.cardId === card.id && (
                                        <JuiceEffects
                                            color={juiced.color}
                                            points={juiced.points}
                                            streakActive={juiced.streakActive}
                                        />
                                    )}
                                </motion.div>
                                <DropZone
                                    index={index + 1}
                                    onClick={() => handlePlaceCard(index + 1)}
                                    disabled={!hand || gameState !== 'playing'}
                                    highlight={highlightSlots || activeDropZone === (index + 1)}
                                    cardInHand={hand}
                                    tapMode={isTouchDevice}
                                    onRegister={(el) => { if (el) dropZoneRefs.current.set(index + 1, el); else dropZoneRefs.current.delete(index + 1); }}
                                />
                            </React.Fragment>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div className={isCompact ? 'h-36' : 'h-48'} /> {/* Spacer for the fixed bottom area */}

            {/* Hand / Draggable Area */}
            <div className={`fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-${eraColor}-200 ${isCompact ? 'py-2 px-3' : 'py-4 px-4'} z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]`}>
                <div className="max-w-6xl mx-auto flex flex-col items-center">
                    {gameState === 'gameover' ? (
                        <GameOverPanel
                            score={score}
                            highscore={highscore}
                            maxStreak={maxStreak}
                            placedCards={placedCards}
                            missedCards={missedCards}
                            onRestart={initGame}
                        />
                    ) : hand ? (
                        <div className={`flex flex-row items-center ${isCompact ? 'gap-4 min-h-[130px]' : 'gap-8 min-h-[160px]'}`}>
                            <div className={`${isCompact ? 'hidden lg:block' : 'hidden md:block'} text-right self-center`}>
                                <p className={`text-sm font-black text-${eraColor}-900 leading-tight`}>Din tur!</p>
                                <p className="text-slate-400 text-[10px] max-w-[140px] leading-tight mt-0.5">
                                    {isTouchDevice ? 'Trykk en sone, eller dra kortet.' : 'Dra eller klikk en sone.'}
                                </p>
                            </div>

                            <div className="relative group cursor-grab active:cursor-grabbing">
                                <motion.div
                                    drag
                                    dragSnapToOrigin
                                    onDragStart={() => sound.play('pickup')}
                                    onDrag={(_, info) => handleDrag(info)}
                                    onDragEnd={() => handleDragEnd()}
                                    whileDrag={reducedMotion
                                        ? { zIndex: 100 }
                                        : {
                                            scale: 1.12,
                                            rotate: -4,
                                            zIndex: 100,
                                            filter: 'drop-shadow(0 14px 24px rgba(15, 23, 42, 0.25))',
                                        }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                    className="touch-none select-none"
                                >
                                    <ChronoCard
                                        event={hand}
                                        isRevealed={false}
                                        className={`shadow-2xl ring-4 ring-${eraColor}-50 border-${eraColor}-200 pointer-events-none-children`}
                                        showDescriptionWhenUnrevealed={difficulty !== 'hard'}
                                        compact={isCompact}
                                    />
                                </motion.div>

                                {/* Hint arrow only if not dragging */}
                                {gameState === 'playing' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 2, repeat: Infinity, repeatType: "reverse", duration: 1 }}
                                        className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-${eraColor}-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg pointer-events-none`}
                                    >
                                        {isTouchDevice ? 'Trykk en sone ↑' : 'Dra eller trykk ↑'}
                                    </motion.div>
                                )}
                            </div>

                            <NextCardPreview deck={deck} />
                        </div>
                    ) : (
                        <p>Laster...</p>
                    )}
                </div>
            </div>
        </motion.div>
    );

    function NextCardPreview({ deck }: { deck: TimelineEvent[] }) {
        const next = deck.length > 0 ? deck[deck.length - 1] : null;
        const nextEra = next ? eraForYear(next.startDate) : null;
        const nextEraInfo = nextEra ? ERA_DEFS[nextEra] : null;
        return (
            <div className="text-left self-center flex items-center gap-2">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Neste</span>
                    {next ? (
                        <div
                            className={`${isCompact ? 'w-10 h-14' : 'w-12 h-16'} rounded-md border-2 flex flex-col items-center justify-center relative overflow-hidden`}
                            style={{ borderColor: nextEraInfo?.cssVar, backgroundColor: `${nextEraInfo?.cssVar}11` }}
                            title="Det neste kortet kommer fra denne epoken"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: nextEraInfo?.cssVar }} />
                            <span className="text-slate-400 font-bold text-lg">?</span>
                            <span className="text-[8px] font-bold text-slate-500 absolute bottom-1">{deck.length}</span>
                        </div>
                    ) : (
                        <div className={`${isCompact ? 'w-10 h-14' : 'w-12 h-16'} rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50`}>
                            <span className="text-slate-300 text-xs">∅</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
};

interface DropZoneProps {
    onClick: () => void;
    disabled: boolean;
    highlight: boolean;
    cardInHand: TimelineEvent | null;
    index: number;
    onRegister: (el: HTMLButtonElement | null) => void;
    tapMode?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onClick, disabled, highlight, cardInHand, onRegister, tapMode = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    if (disabled) {
        return <div className="w-4 shrink-0" />;
    }

    const isActive = isHovered || highlight;
    // When a card is in hand, make zones large enough to tap. On touch devices, even larger.
    const idleWidth = tapMode ? '5rem' : '3rem';
    const activeWidth = '12rem';

    return (
        <motion.button
            ref={onRegister}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={false}
            animate={{
                width: isActive ? activeWidth : idleWidth,
                opacity: 1,
                scale: isActive ? 1.02 : 1,
                backgroundColor: highlight ? 'rgba(238, 242, 255, 0.85)' : (cardInHand ? 'rgba(248, 250, 252, 0.6)' : 'rgba(255, 255, 255, 0)'),
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`
                relative h-56 rounded-xl border-2 mx-1 shrink-0 flex items-center justify-center overflow-hidden
                transition-colors duration-200 snap-center z-0
                ${highlight ? 'border-indigo-500 animate-pulse border-dashed' : 'border-slate-300 border-dashed'}
                ${isHovered ? 'border-indigo-500 bg-indigo-100/50' : 'hover:border-indigo-300'}
                ${cardInHand && !disabled ? 'cursor-pointer' : ''}
            `}
            aria-label={cardInHand ? `Plasser kort her` : 'Drop-sone'}
        >
            <div className="relative z-10 flex flex-col items-center gap-1.5 pointer-events-none px-1">
                <span className={`
                    font-black transition-all duration-300
                    ${isActive ? 'text-indigo-500 text-3xl' : (cardInHand ? 'text-indigo-300 text-2xl' : 'text-slate-200 text-xl')}
                `}>
                    +
                </span>
                {isActive ? (
                    <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-bold text-indigo-600 uppercase tracking-wider text-center px-2 bg-white/80 rounded-full py-1"
                    >
                        {tapMode ? 'Trykk her' : 'Klikk eller slipp'}
                    </motion.span>
                ) : cardInHand && tapMode ? (
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider text-center">
                        Trykk
                    </span>
                ) : null}
            </div>

            {/* Ghost Card Effect when highlighting/hovering */}
            {isActive && cardInHand && (
                <div className="absolute inset-0 p-2 opacity-30 grayscale pointer-events-none scale-90 origin-center top-2">
                    <ChronoCard
                        event={cardInHand}
                        isRevealed={false}
                        className="h-full w-full"
                        showDescriptionWhenUnrevealed={true}
                    />
                </div>
            )}
        </motion.button>
    );
};

interface GameOverPanelProps {
    score: number;
    highscore: number;
    maxStreak: number;
    placedCards: TimelineEvent[];
    missedCards: TimelineEvent[];
    onRestart: () => void;
}

const GameOverPanel: React.FC<GameOverPanelProps> = ({ score, highscore, maxStreak, placedCards, missedCards, onRestart }) => {
    const total = placedCards.length + missedCards.length;
    const accuracy = total > 0 ? Math.round((placedCards.length / total) * 100) : 0;
    const isNewHighscore = score > 0 && score >= highscore;

    type StatusCard = { card: TimelineEvent; status: 'correct' | 'missed' };
    const combined: StatusCard[] = [
        ...placedCards.map((card): StatusCard => ({ card, status: 'correct' })),
        ...missedCards.map((card): StatusCard => ({ card, status: 'missed' })),
    ].sort((a, b) => a.card.startDate - b.card.startDate);

    let headline = 'Spillet er slutt';
    if (accuracy >= 90) headline = 'Mesterlig!';
    else if (accuracy >= 70) headline = 'Sterkt spilt!';
    else if (accuracy >= 50) headline = 'Godt forsøk!';

    return (
        <div className="w-full animate-in slide-in-from-bottom-5 fade-in duration-500 flex flex-col items-center max-h-[80vh] overflow-y-auto">
            {/* Headline + stats */}
            <div className="text-center mb-4">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-1">{headline}</h2>
                {isNewHighscore && score > 0 && (
                    <span className="inline-block text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md uppercase tracking-widest mb-2">
                        Ny personlig rekord!
                    </span>
                )}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-sm">
                    <Stat label="Poeng" value={score} accent="indigo" />
                    <Stat label="Treff" value={`${placedCards.length}/${total}`} accent="emerald" />
                    <Stat label="Beste streak" value={maxStreak} accent="orange" />
                    <Stat label="Treffrate" value={`${accuracy}%`} accent="rose" />
                </div>
            </div>

            {/* Combined chronological strip */}
            {combined.length > 0 && (
                <div className="w-full bg-slate-50/70 border border-slate-200 rounded-[2rem] p-4 md:p-6 mb-4">
                    <h3 className="text-xs md:text-sm font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Din tidslinje
                        <span className="text-slate-400 normal-case tracking-normal font-medium">(slik hendelsene skulle stå)</span>
                    </h3>
                    <div className="relative overflow-x-auto pb-3 no-scrollbar touch-pan-x">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full" />
                        <div className="flex gap-2 items-stretch min-h-[170px]">
                            {combined.map(({ card, status }, idx) => {
                                const era = eraForYear(card.startDate);
                                const eraInfo = ERA_DEFS[era];
                                return (
                                    <ReviewCard
                                        key={`${card.id}-${idx}`}
                                        card={card}
                                        status={status}
                                        eraColor={eraInfo.cssVar}
                                        eraName={eraInfo.name}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <button onClick={onRestart} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-3 mb-2">
                <RotateCcw className="w-5 h-5" />
                Prøv igjen
            </button>
        </div>
    );
};

const Stat: React.FC<{ label: string; value: React.ReactNode; accent: 'indigo' | 'emerald' | 'orange' | 'rose' }> = ({ label, value, accent }) => {
    const accentClass: Record<string, string> = {
        indigo: 'text-indigo-600',
        emerald: 'text-emerald-600',
        orange: 'text-orange-500',
        rose: 'text-rose-600',
    };
    return (
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</span>
            <span className={`text-2xl font-black leading-tight ${accentClass[accent]}`}>{value}</span>
        </div>
    );
};

interface ReviewCardProps {
    card: TimelineEvent;
    status: 'correct' | 'missed';
    eraColor: string;
    eraName: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ card, status, eraColor, eraName }) => {
    const isCorrect = status === 'correct';
    const Content = (
        <div
            className={`relative shrink-0 w-44 md:w-48 h-[160px] rounded-xl border-2 flex flex-col p-3 bg-white transition-all overflow-hidden ${
                isCorrect ? 'border-emerald-300 shadow-sm' : 'border-rose-300 shadow-[0_0_0_3px_rgba(244,63,94,0.12)]'
            }`}
        >
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: eraColor }} />
            <div className="flex items-center justify-between mt-1 mb-1.5">
                <span
                    className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                        isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                >
                    {isCorrect ? '✓ Riktig' : '✗ Bommet'}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{eraName}</span>
            </div>
            <span
                className="text-xs font-black font-mono text-slate-800 mb-1"
                style={{ color: isCorrect ? '#0f172a' : eraColor }}
            >
                {card.displayDate}
            </span>
            <h4 className="font-bold text-slate-800 text-xs leading-tight line-clamp-3 flex-1">{card.title}</h4>
            {card.sourceUrl && (
                <span className="mt-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                    Les mer →
                </span>
            )}
        </div>
    );
    return card.sourceUrl ? (
        <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-[1.03] transition-transform">
            {Content}
        </a>
    ) : Content;
};
