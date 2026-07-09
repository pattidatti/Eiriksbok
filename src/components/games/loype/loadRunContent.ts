// Laster quiz-spørsmål til Kunnskapsløypa. Følger QuizPage-mønsteret
// (manifest-iterasjon + fetchLesson), men sampler leksjoner seedet for å
// begrense fetch-fan-out, og normaliserer de to svarformatene som finnes
// i innholdet (answer-streng vs correctAnswer-indeks - se Quiz.tsx).

import type { Manifest, QuizQuestion } from '../../../types';
import { fetchLesson } from '../../../utils/contentLoader';
import { djb2Hash, mulberry32, shuffleWith } from '../../../utils/reviewScheduler';
import type { LoypeQuizQuestion } from './challengeBuilder';
import type { SubjectChoice } from './types';

const MAX_LESSONS = 40;

interface LessonRef {
    subjectId: string;
    topicId: string;
    subTopicId?: string;
    lessonId: string;
}

const normalizeQuestion = (
    q: QuizQuestion,
    subjectId: string,
    topicId: string,
    sourceUrl: string
): LoypeQuizQuestion | null => {
    if (!q.question || !Array.isArray(q.options) || q.options.length < 3) return null;
    if (q.type === 'sorting') return null;
    const answer =
        typeof q.correctAnswer === 'number' ? q.options[q.correctAnswer] : (q.answer ?? '');
    if (!answer || !q.options.includes(answer)) return null;
    const options = Array.from(new Set(q.options));
    if (options.length < 3) return null;
    return {
        id: `quiz:${djb2Hash(q.question)}`,
        question: q.question,
        options,
        answer,
        sourceUrl,
        subjectId,
        topicId,
    };
};

export const loadQuizQuestions = async (
    manifest: Manifest,
    subject: SubjectChoice,
    seed: number
): Promise<LoypeQuizQuestion[]> => {
    const refs: LessonRef[] = [];
    for (const s of manifest.subjects) {
        if (subject !== 'blandet' && s.id !== subject) continue;
        for (const topic of s.topics) {
            for (const lesson of topic.lessons ?? []) {
                refs.push({ subjectId: s.id, topicId: topic.id, lessonId: lesson.id });
            }
            for (const subTopic of topic.subTopics ?? []) {
                for (const lesson of subTopic.lessons ?? []) {
                    if (!lesson.id) continue;
                    refs.push({
                        subjectId: s.id,
                        topicId: topic.id,
                        subTopicId: subTopic.id,
                        lessonId: lesson.id,
                    });
                }
            }
        }
    }

    const rng = mulberry32(seed ^ 0x9e3779b9);
    const sampled = shuffleWith(refs, rng).slice(0, MAX_LESSONS);

    const results = await Promise.all(
        sampled.map(async (ref) => {
            try {
                const lesson = await fetchLesson(
                    ref.subjectId,
                    ref.topicId,
                    ref.lessonId,
                    ref.subTopicId
                );
                if (!lesson || !Array.isArray(lesson.quiz)) return [];
                const url = ref.subTopicId
                    ? `/${ref.subjectId}/${ref.topicId}/${ref.subTopicId}/${ref.lessonId}`
                    : `/${ref.subjectId}/${ref.topicId}/${ref.lessonId}`;
                return lesson.quiz
                    .map((q) => normalizeQuestion(q, ref.subjectId, ref.topicId, url))
                    .filter((q): q is LoypeQuizQuestion => q !== null);
            } catch {
                return []; // Leksjonsfil mangler eller er ødelagt - hopp over
            }
        })
    );

    const seen = new Set<string>();
    const questions: LoypeQuizQuestion[] = [];
    for (const q of results.flat()) {
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        questions.push(q);
    }
    return questions;
};
