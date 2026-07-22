import type { QuizQuestion } from '../types';

// Innholds-JSON bruker tre varianter for å peke ut riktig svar:
// correctAnswer (indeks), correctIndex (indeks) og answer (streng).
// Alle quiz-konsumenter skal gå gjennom denne, ellers markeres alt som feil
// i artikler som bruker en annen variant enn komponenten forventer.
export const getQuizCorrectAnswer = (q: QuizQuestion): string => {
    const index = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.correctIndex;
    if (typeof index === 'number' && q.options[index] !== undefined) {
        return q.options[index];
    }
    return q.answer || '';
};
