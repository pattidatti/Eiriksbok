import React, { useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useManifest } from '../hooks/useManifest';
import { useConcepts } from '../hooks/useConcepts';
import { useGlobalTimeline } from '../hooks/useGlobalTimeline';
import { motionPresets } from '../styles/motion-presets';
import { djb2Hash, mulberry32 } from '../utils/reviewScheduler';
import { runReducer } from '../components/games/loype/runReducer';
import { generateMap } from '../components/games/loype/mapGen';
import { loadQuizQuestions } from '../components/games/loype/loadRunContent';
import {
    availableKinds,
    buildBossQueue,
    buildExercise,
    filterConcepts,
    filterEvents,
    pickKind,
    type RunContent,
} from '../components/games/loype/challengeBuilder';
import { recordRunEnd } from '../components/games/loype/loypeStats';
import type { Difficulty, SubjectChoice } from '../components/games/loype/types';
import { DIFFICULTY_CONFIG } from '../components/games/loype/types';
import { LoypeSetup } from '../components/games/loype/LoypeSetup';
import { LoypeHud } from '../components/games/loype/LoypeHud';
import { LoypeMap } from '../components/games/loype/LoypeMap';
import { LoypeEncounter } from '../components/games/loype/LoypeEncounter';
import { LoypeBoss } from '../components/games/loype/LoypeBoss';
import { LoypeReward } from '../components/games/loype/LoypeReward';
import { LoypeSummary } from '../components/games/loype/LoypeSummary';

// Kunnskapsløypa - roguelike-øving: velg sti gjennom nodekartet, møt
// mikro-utfordringer fra quiz-, begreps- og tidslinjebankene, plukk
// relikvier og slå Glemselens vokter på toppen. Ingen mid-run-lagring:
// refresh gir ny løype (bevisst v1-kutt).
const KunnskapsloypaPage: React.FC = () => {
    const { data: manifest } = useManifest();
    const concepts = useConcepts();
    const { events } = useGlobalTimeline();
    const reducedMotion = useReducedMotion();

    const [state, dispatch] = useReducer(runReducer, null);
    const [isBuilding, setIsBuilding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const contentRef = useRef<RunContent | null>(null);
    const usedRef = useRef<Set<string>>(new Set());
    const endedRef = useRef(false);

    const start = async (subject: SubjectChoice, difficulty: Difficulty) => {
        if (!manifest || isBuilding) return;
        setError(null);
        setIsBuilding(true);
        try {
            const seed = Date.now() & 0x7fffffff;
            const quiz = await loadQuizQuestions(manifest, subject, seed);
            const content: RunContent = {
                quiz,
                concepts: filterConcepts(concepts, subject),
                events: filterEvents(events, subject),
            };
            if (quiz.length < 8 && content.concepts.length < 8) {
                setError(
                    'Fant ikke nok innhold for dette faget ennå. Prøv et annet fag eller Blandet.'
                );
                return;
            }
            contentRef.current = content;
            usedRef.current = new Set();
            endedRef.current = false;
            dispatch({
                type: 'START_RUN',
                config: { subjectId: subject, difficulty, seed },
                map: generateMap(difficulty, seed),
            });
        } catch {
            setError('Noe gikk galt da løypa ble bygget. Prøv igjen.');
        } finally {
            setIsBuilding(false);
        }
    };

    const selectNode = (nodeId: string) => {
        if (!state || state.phase !== 'map') return;
        const node = state.map.find((n) => n.id === nodeId);
        const content = contentRef.current;
        if (!node || !content) return;
        const rng = mulberry32(djb2Hash(`${state.config.seed}:${nodeId}`));
        const chronoCount = DIFFICULTY_CONFIG[state.config.difficulty].chronoCount;

        if (node.type === 'boss') {
            dispatch({
                type: 'ENTER_NODE',
                nodeId,
                exercises: buildBossQueue(content, rng, usedRef.current, state.bossMaxHp + 6),
            });
            return;
        }
        if (node.type === 'challenge' || node.type === 'elite') {
            const kinds = availableKinds(content);
            const count = node.type === 'elite' ? 2 : 1;
            const exercises = [];
            for (let i = 0; i < count; i++) {
                const exercise = buildExercise(
                    pickKind(kinds, rng),
                    content,
                    rng,
                    usedRef.current,
                    chronoCount
                );
                if (exercise) exercises.push(exercise);
            }
            dispatch({ type: 'ENTER_NODE', nodeId, exercises });
            return;
        }
        dispatch({ type: 'ENTER_NODE', nodeId });
    };

    const comboConfetti = (prevCombo: number) => {
        const next = prevCombo + 1;
        if ((next === 3 || next === 5) && !reducedMotion) {
            confetti({
                particleCount: 30,
                spread: 55,
                origin: { y: 0.75 },
                colors: ['#6366f1', '#f59e0b', '#10b981'],
            });
        }
    };

    const handleAnswer = (correct: boolean) => {
        if (!state) return;
        if (correct) comboConfetti(state.combo);
        dispatch({ type: 'ANSWER', correct });
    };

    const handleBossAnswer = (correct: boolean) => {
        if (!state) return;
        if (correct) comboConfetti(state.combo);
        dispatch({ type: 'BOSS_ANSWER', correct });
    };

    const abandon = () => {
        if (window.confirm('Avslutte løypa? Fremgangen i dette forsøket går tapt.')) {
            dispatch({ type: 'ABANDON' });
        }
    };

    // Registrer run-slutt (statistikk + «Min læring») nøyaktig én gang
    useEffect(() => {
        if (!state) return;
        if ((state.phase === 'summary' || state.phase === 'dead') && !endedRef.current) {
            endedRef.current = true;
            recordRunEnd({
                won: state.won,
                correct: state.correct,
                answered: state.answered,
                xp: state.xp,
                subjectId: state.config.subjectId,
                difficulty: state.config.difficulty,
            });
        }
    }, [state]);

    const currentNode = state ? state.map.find((n) => n.id === state.currentNodeId) : undefined;
    const totalRows = state ? DIFFICULTY_CONFIG[state.config.difficulty].rows : 0;
    const showHud =
        state && ['map', 'encounter', 'rest', 'reward', 'boss'].includes(state.phase);

    return (
        <div className="min-h-screen pt-20 pb-12 bg-slate-50">
            <div className="mx-auto px-4 sm:px-6 max-w-3xl">
                {showHud && state && (
                    <LoypeHud
                        hearts={state.hearts}
                        maxHearts={state.maxHearts}
                        relics={state.relics}
                        fiftyCharges={state.fiftyCharges}
                        etappe={(currentNode?.row ?? -1) + 1}
                        totalEtapper={totalRows}
                        xp={state.xp}
                        onAbandon={abandon}
                    />
                )}

                <AnimatePresence mode="wait">
                    {!state && (
                        <motion.div key="setup" {...motionPresets.fadeIn}>
                            <LoypeSetup isBuilding={isBuilding} error={error} onStart={start} />
                        </motion.div>
                    )}

                    {state?.phase === 'map' && (
                        <motion.div key="map" {...motionPresets.fadeIn}>
                            <LoypeMap
                                map={state.map}
                                currentNodeId={state.currentNodeId}
                                visited={state.visited}
                                onSelect={selectNode}
                            />
                        </motion.div>
                    )}

                    {state?.phase === 'encounter' && state.exercises[state.exerciseIndex] && (
                        <motion.div
                            key={`encounter-${state.currentNodeId}-${state.exerciseIndex}`}
                            {...motionPresets.slideUp}
                        >
                            <LoypeEncounter
                                exercise={state.exercises[state.exerciseIndex]}
                                isElite={currentNode?.type === 'elite'}
                                queueIndex={state.exerciseIndex}
                                queueTotal={state.exercises.length}
                                fiftyCharges={state.fiftyCharges}
                                shieldFlash={state.shieldFlash}
                                onUseFifty={() => dispatch({ type: 'USE_FIFTY' })}
                                onAnswer={handleAnswer}
                                onNext={() => dispatch({ type: 'NEXT' })}
                            />
                        </motion.div>
                    )}

                    {(state?.phase === 'rest' || state?.phase === 'reward') && (
                        <motion.div key={`reward-${state.currentNodeId}`} {...motionPresets.slideUp}>
                            <LoypeReward
                                mode={state.phase === 'rest' ? 'rest' : 'reward'}
                                offered={state.offeredRelics}
                                onPick={(relic) => dispatch({ type: 'PICK_RELIC', relic })}
                                onContinue={() => dispatch({ type: 'CONTINUE' })}
                            />
                        </motion.div>
                    )}

                    {state?.phase === 'boss' && state.exercises[state.bossIndex] && (
                        <motion.div key={`boss-${state.bossIndex}`} {...motionPresets.slideUp}>
                            <LoypeBoss
                                exercise={state.exercises[state.bossIndex]}
                                bossHp={state.bossHp}
                                bossMaxHp={state.bossMaxHp}
                                questionNumber={state.bossIndex + 1}
                                fiftyCharges={state.fiftyCharges}
                                shieldFlash={state.shieldFlash}
                                onUseFifty={() => dispatch({ type: 'USE_FIFTY' })}
                                onAnswer={handleBossAnswer}
                                onNext={() => dispatch({ type: 'BOSS_NEXT' })}
                            />
                        </motion.div>
                    )}

                    {(state?.phase === 'summary' || state?.phase === 'dead') && (
                        <motion.div key="summary" {...motionPresets.fadeIn}>
                            <LoypeSummary
                                won={state.won}
                                correct={state.correct}
                                answered={state.answered}
                                bestCombo={state.bestCombo}
                                xp={state.xp}
                                relics={state.relics}
                                misses={state.misses}
                                onRetry={() =>
                                    start(state.config.subjectId, state.config.difficulty)
                                }
                                onNewRun={() => dispatch({ type: 'ABANDON' })}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default KunnskapsloypaPage;
