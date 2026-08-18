import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useProgressStore } from '../progress/useProgressStore';
import { correctPop, wrongShake, celebrateCompletion } from '../../components/ui/answerFeedback';
import { fetchJsonAsset } from './manifest';
import { extractPlainText, toQuizSentences } from './extractText';
import type {
    ComparisonClaimTask,
    ComparisonDimension,
    ComparisonDomainConfig,
    ComparisonEntity,
    MatrixRow,
} from './types';

interface ComparisonTasksProps {
    config: ComparisonDomainConfig;
    dimension: ComparisonDimension;
    entities: ComparisonEntity[];
    // Radene i sammenligningsmatrisen for aktiv dimensjon, om de finnes
    matrixRows?: MatrixRow[];
}

interface PairQuestion {
    rowLabel: string;
    anchor: ComparisonEntity;
    anchorText: string;
    answerId: string;
    answerText: string;
    options: ComparisonEntity[];
}

// «Hvem ligner?»: finn rader der nøyaktig to av de valgte religionene deler
// svar. Da har spørsmålet ett riktig svar, og eleven må lese på tvers av
// tabellen i stedet for nedover i én kolonne.
function buildPairQuestions(rows: MatrixRow[], entities: ComparisonEntity[]): PairQuestion[] {
    if (entities.length < 3) return [];
    const questions: PairQuestion[] = [];
    for (const row of rows) {
        const byBucket = new Map<string, ComparisonEntity[]>();
        for (const entity of entities) {
            const bucket = row.values[entity.id]?.bucket;
            if (!bucket) continue;
            byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), entity]);
        }
        for (const members of byBucket.values()) {
            if (members.length !== 2) continue;
            const [first, second] = members;
            questions.push({
                rowLabel: row.label,
                anchor: first,
                anchorText: row.values[first.id]?.text ?? '',
                answerId: second.id,
                answerText: row.values[second.id]?.text ?? '',
                options: entities.filter((e) => e.id !== first.id),
            });
        }
    }
    return questions;
}

const ROUND_SIZE = 3;

interface GuessQuestion {
    sentence: string;
    answerId: string;
    options: { id: string; name: string; color?: string }[];
}

function buildGuessQuestion(
    entities: ComparisonEntity[],
    dimensionKey: string
): GuessQuestion | null {
    const withContent = entities.filter(
        (e) => extractPlainText(e.dimensions[dimensionKey]).length > 0
    );
    if (withContent.length < 2) return null;

    const names = withContent.map((e) => e.name.toLowerCase());
    const pool = withContent.flatMap((entity) => {
        const sentences = toQuizSentences(extractPlainText(entity.dimensions[dimensionKey]))
            // Setninger som røper svaret ved å nevne navnet er ubrukelige
            .filter((s) => !names.some((n) => s.toLowerCase().includes(n)));
        return sentences.map((sentence) => ({ sentence, answerId: entity.id }));
    });
    if (pool.length === 0) return null;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    return {
        sentence: pick.sentence,
        answerId: pick.answerId,
        options: withContent.map((e) => ({ id: e.id, name: e.name, color: e.color })),
    };
}

export const ComparisonTasks: React.FC<ComparisonTasksProps> = ({
    config,
    dimension,
    entities,
    matrixRows,
}) => {
    const selectedIds = useMemo(() => entities.map((e) => e.id), [entities]);
    const entityLabel = config.domain === 'religion' ? 'religionen' : 'tenkeren';

    // --- Rundelogikk: hver 3. besvarte oppgave gir XP via recordActivity ---
    const [answeredInRound, setAnsweredInRound] = useState(0);
    const [correctInRound, setCorrectInRound] = useState(0);
    const [roundResult, setRoundResult] = useState<number | null>(null);

    const registerAnswer = (correct: boolean) => {
        const answered = answeredInRound + 1;
        const correctCount = correctInRound + (correct ? 1 : 0);
        if (answered >= ROUND_SIZE) {
            const ratio = correctCount / ROUND_SIZE;
            useProgressStore.getState().recordActivity({
                kind: 'comparison-task',
                activityId: `${config.activityIdPrefix}/${dimension.key}`,
                subjectId: config.subjectId,
                topicId: config.topicId,
                score: ratio,
                title: `Sammenligning: ${dimension.label}`,
            });
            if (ratio === 1) celebrateCompletion();
            setRoundResult(correctCount);
            setAnsweredInRound(0);
            setCorrectInRound(0);
        } else {
            setAnsweredInRound(answered);
            setCorrectInRound(correctCount);
            setRoundResult(null);
        }
    };

    // --- Oppgave 1: «Hvem hører dette til?» ---
    // Komponenten remountes per dimensjon/utvalg, så lazy init gir riktig startspørsmål
    const [guessAnswer, setGuessAnswer] = useState<string | null>(null);
    const [question, setQuestion] = useState(() => buildGuessQuestion(entities, dimension.key));

    const answerGuess = (id: string) => {
        if (guessAnswer || !question) return;
        setGuessAnswer(id);
        registerAnswer(id === question.answerId);
    };

    const nextGuess = () => {
        setGuessAnswer(null);
        setQuestion(buildGuessQuestion(entities, dimension.key));
    };

    // --- Oppgave 2: «Likt eller ulikt?» (kuraterte påstander) ---
    const { data: allClaims } = useQuery({
        queryKey: ['comparison-tasks', config.domain],
        queryFn: () =>
            config.tasksUrl
                ? fetchJsonAsset<ComparisonClaimTask[]>(config.tasksUrl)
                : Promise.resolve(null),
        staleTime: Infinity,
    });

    const claims = useMemo(() => {
        if (!allClaims) return [];
        return allClaims.filter(
            (c) =>
                c.dimension === dimension.key &&
                c.entities.every((id) => selectedIds.includes(id))
        );
    }, [allClaims, dimension.key, selectedIds]);

    const [claimIndex, setClaimIndex] = useState(0);
    const [claimAnswer, setClaimAnswer] = useState<'likt' | 'ulikt' | null>(null);

    const activeClaim = claims[claimIndex % Math.max(claims.length, 1)];

    const answerClaim = (answer: 'likt' | 'ulikt') => {
        if (claimAnswer || !activeClaim) return;
        setClaimAnswer(answer);
        registerAnswer(answer === activeClaim.answer);
    };

    const nextClaim = () => {
        setClaimAnswer(null);
        setClaimIndex((i) => i + 1);
    };

    // --- Oppgave 3: «Hvem ligner?» (fra sammenligningsmatrisen) ---
    const pairQuestions = useMemo(
        () => buildPairQuestions(matrixRows ?? [], entities),
        [matrixRows, entities]
    );
    const [pairIndex, setPairIndex] = useState(0);
    const [pairAnswer, setPairAnswer] = useState<string | null>(null);
    const activePair = pairQuestions[pairIndex % Math.max(pairQuestions.length, 1)];

    const answerPair = (id: string) => {
        if (pairAnswer || !activePair) return;
        setPairAnswer(id);
        registerAnswer(id === activePair.answerId);
    };

    const nextPair = () => {
        setPairAnswer(null);
        setPairIndex((i) => i + 1);
    };

    // --- Oppgave 4: Refleksjon ---
    // Komponenten remountes per dimensjon (key i ComparisonPage), så lazy init holder
    const reflectionKey = `comparison-reflection:${config.domain}:${dimension.key}`;
    const [reflection, setReflection] = useState(
        () => localStorage.getItem(reflectionKey) ?? ''
    );
    const [reflectionSaved, setReflectionSaved] = useState(() => reflection.length > 0);

    const saveReflection = () => {
        if (reflection.trim().length < 30) return;
        localStorage.setItem(reflectionKey, reflection.trim());
        setReflectionSaved(true);
        useProgressStore.getState().recordActivity({
            kind: 'comparison-task',
            activityId: `${config.activityIdPrefix}/refleksjon/${dimension.key}`,
            subjectId: config.subjectId,
            topicId: config.topicId,
            title: `Refleksjon: ${dimension.label}`,
        });
        celebrateCompletion();
    };

    type TabId = 'ligner' | 'gjett' | 'pastand' | 'refleksjon';
    const [activeTab, setActiveTab] = useState<TabId>('ligner');

    const tabs = [
        pairQuestions.length > 0 && { id: 'ligner' as const, label: 'Hvem ligner?' },
        question && { id: 'gjett' as const, label: 'Hvem hører dette til?' },
        claims.length > 0 && { id: 'pastand' as const, label: 'Likt eller ulikt?' },
        dimension.reflection && { id: 'refleksjon' as const, label: 'Refleksjon' },
    ].filter(Boolean) as { id: TabId; label: string }[];

    if (tabs.length === 0) return null;

    // Endrer eleven utvalget, kan fanen som var valgt forsvinne. Da faller vi
    // tilbake til den første som finnes, aldri til et tomt panel.
    const effectiveTab: TabId = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id;

    return (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-bold text-lg text-slate-900">Test deg selv</h2>
                <div className="flex items-center gap-1.5" aria-label="Fremdrift i runden">
                    {Array.from({ length: ROUND_SIZE }).map((_, i) => (
                        <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                                i < answeredInRound ? 'bg-indigo-500' : 'bg-border-main'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {roundResult !== null && (
                    <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium text-indigo-600 mb-4"
                    >
                        Runde fullført: {roundResult} av {ROUND_SIZE} riktige. XP er lagt til i Min
                        læring!
                    </motion.p>
                )}
            </AnimatePresence>

            {tabs.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                effectiveTab === tab.id
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {effectiveTab === 'ligner' && activePair && (
                <div>
                    <p className="text-sm text-slate-500 mb-1">
                        {activePair.rowLabel}: {activePair.anchor.name} svarer «
                        {activePair.anchorText}».
                    </p>
                    <p className="text-slate-900 font-medium mb-4">
                        Hvem av de andre har samme svar?
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {activePair.options.map((option) => {
                            const isAnswer = option.id === activePair.answerId;
                            const isPicked = pairAnswer === option.id;
                            const revealed = pairAnswer !== null;
                            return (
                                <motion.button
                                    key={option.id}
                                    type="button"
                                    disabled={revealed}
                                    onClick={() => answerPair(option.id)}
                                    animate={
                                        revealed && isPicked
                                            ? isAnswer
                                                ? correctPop
                                                : wrongShake
                                            : undefined
                                    }
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                        revealed && isAnswer
                                            ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                            : revealed && isPicked
                                              ? 'bg-rose-100 border-rose-400 text-rose-800'
                                              : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-indigo-400'
                                    }`}
                                >
                                    {option.name}
                                </motion.button>
                            );
                        })}
                    </div>
                    {pairAnswer && (
                        <div>
                            <p className="text-sm text-slate-500 mb-2">
                                Svaret er {entities.find((e) => e.id === activePair.answerId)?.name}
                                : «{activePair.answerText}».
                            </p>
                            {pairQuestions.length > 1 && (
                                <button
                                    type="button"
                                    onClick={nextPair}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                    Neste spørsmål →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {effectiveTab === 'gjett' && question && (
                <div>
                    <p className="text-sm text-slate-500 mb-1">
                        Hvilken {entityLabel} hører dette utsagnet til?
                    </p>
                    <blockquote className="text-slate-900 font-medium border-l-4 border-indigo-300 pl-4 py-1 mb-4">
                        «{question.sentence}»
                    </blockquote>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {question.options.map((option) => {
                            const isAnswer = option.id === question.answerId;
                            const isPicked = guessAnswer === option.id;
                            const revealed = guessAnswer !== null;
                            return (
                                <motion.button
                                    key={option.id}
                                    type="button"
                                    disabled={revealed}
                                    onClick={() => answerGuess(option.id)}
                                    animate={
                                        revealed && isPicked
                                            ? isAnswer
                                                ? correctPop
                                                : wrongShake
                                            : undefined
                                    }
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                        revealed && isAnswer
                                            ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                            : revealed && isPicked
                                              ? 'bg-rose-100 border-rose-400 text-rose-800'
                                              : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-indigo-400'
                                    }`}
                                >
                                    {option.name}
                                </motion.button>
                            );
                        })}
                    </div>
                    {guessAnswer && (
                        <button
                            type="button"
                            onClick={nextGuess}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                        >
                            Neste utsagn →
                        </button>
                    )}
                </div>
            )}

            {effectiveTab === 'pastand' && activeClaim && (
                <div>
                    <p className="text-sm text-slate-500 mb-1">
                        Gjelder dette begge? ({activeClaim.entities.join(' og ')})
                    </p>
                    <blockquote className="text-slate-900 font-medium border-l-4 border-indigo-300 pl-4 py-1 mb-4">
                        {activeClaim.claim}
                    </blockquote>
                    <div className="flex gap-2 mb-3">
                        {(['likt', 'ulikt'] as const).map((answer) => {
                            const revealed = claimAnswer !== null;
                            const isAnswer = activeClaim.answer === answer;
                            const isPicked = claimAnswer === answer;
                            return (
                                <motion.button
                                    key={answer}
                                    type="button"
                                    disabled={revealed}
                                    onClick={() => answerClaim(answer)}
                                    animate={
                                        revealed && isPicked
                                            ? isAnswer
                                                ? correctPop
                                                : wrongShake
                                            : undefined
                                    }
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold border transition-colors capitalize ${
                                        revealed && isAnswer
                                            ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                            : revealed && isPicked
                                              ? 'bg-rose-100 border-rose-400 text-rose-800'
                                              : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-indigo-400'
                                    }`}
                                >
                                    {answer === 'likt' ? 'Likt' : 'Ulikt'}
                                </motion.button>
                            );
                        })}
                    </div>
                    {claimAnswer && (
                        <div>
                            <p className="text-sm text-slate-500 mb-2">{activeClaim.explanation}</p>
                            {claims.length > 1 && (
                                <button
                                    type="button"
                                    onClick={nextClaim}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                    Neste påstand →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {effectiveTab === 'refleksjon' && dimension.reflection && (
                <div>
                    <p className="text-sm text-slate-900 font-medium mb-3">{dimension.reflection}</p>
                    <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        rows={4}
                        placeholder="Skriv tankene dine her (minst 30 tegn)..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            type="button"
                            onClick={saveReflection}
                            disabled={reflection.trim().length < 30}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                        >
                            Lagre refleksjon
                        </button>
                        {reflectionSaved && (
                            <span className="text-xs text-emerald-600 font-medium">
                                Lagret - du kan endre og lagre på nytt.
                            </span>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
