// Fire-and-forget-innsamling til «Dagens økt»-køen. Kalles fra Quiz,
// FlashcardPage og LearningPathV2 med én linje hver. Alle funksjoner er
// pakket i try/catch - innsamling skal aldri kunne krasje en vertsfunksjon.

import { useReviewStore } from '../stores/useReviewStore';
import type { ConceptItem } from '../hooks/useConcepts';
import type { QuizQuestion } from '../types';
import { djb2Hash, normalizeText, slugifyTerm, todayLocal } from './reviewScheduler';
import { getQuizCorrectAnswer } from './quizUtils';

export const conceptItemId = (term: string) => `concept:${slugifyTerm(term)}`;
const conceptId = conceptItemId;
export const quizItemId = (question: string) => `quiz:${djb2Hash(normalizeText(question))}`;

// Begreper eleven møter i et læringssti-steg
export const captureConceptEncounters = (terms: string[]) => {
    try {
        const store = useReviewStore.getState();
        const today = todayLocal();
        for (const term of terms) {
            if (!term || !term.trim()) continue;
            store.addItem({ id: conceptId(term), type: 'concept', term }, today);
        }
    } catch {
        // Innsamling er best-effort
    }
};

// Selvvurdering av et flashcard i /oving/flashcards: kortet entrer køen og
// graderes i samme bevegelse. Merk at selve flippen ikke skriver noe - å bla
// gjennom banken skal ikke fylle repetisjonskøen med hundrevis av kort eleven
// aldri tok stilling til. Køen skal speile arbeid, ikke nysgjerrighet.
export const captureFlashcardGrade = (
    concept: Pick<ConceptItem, 'term'>,
    correct: boolean
) => {
    try {
        if (!concept.term) return;
        const store = useReviewStore.getState();
        const today = todayLocal();
        const id = conceptId(concept.term);
        // addItem er no-op hvis kortet allerede ligger i køen
        store.addItem({ id, type: 'concept', term: concept.term }, today);
        store.gradeItem(id, correct, today);
    } catch {
        // Innsamling er best-effort
    }
};

// Quiz-svar: kun feilsvar entrer køen; riktige svar graderer eksisterende items
export const captureQuizAnswer = (question: QuizQuestion, wasCorrect: boolean) => {
    try {
        const store = useReviewStore.getState();
        const today = todayLocal();
        const id = quizItemId(question.question);
        const exists = !!store.items[id];

        if (wasCorrect) {
            if (exists) store.gradeItem(id, true, today);
            return;
        }
        if (exists) {
            store.demoteItem(id, today);
            return;
        }
        // Frys en kopi av spørsmålet slik at øvelsen kan gjenskapes senere
        const answer = getQuizCorrectAnswer(question);
        if (!answer) return;
        store.addItem(
            {
                id,
                type: 'quiz',
                quiz: {
                    question: question.question,
                    options: [...question.options],
                    answer,
                    sourceUrl: question.sourceUrl,
                    sourceTitle: question.sourceTitle,
                },
            },
            today
        );
    } catch {
        // Innsamling er best-effort
    }
};

// Kryssord: ordene eleven nettopp løste. Kalles to ganger av spillet - én gang
// med ordene som satt løst (correct = true), og én gang med ordene eleven
// trengte hint eller avsløring på (correct = false).
//
// Bare begreper er nyttige her. «Dagens økt» slår opp begreper mot
// concepts.json på småbokstavert term, og personer finnes ikke der - de ville
// bare blitt filtrert bort igjen og fylt køen med støy underveis.
export const captureCrosswordWords = (
    words: { display: string; kind: 'begrep' | 'person' }[],
    correct: boolean
) => {
    try {
        const store = useReviewStore.getState();
        const today = todayLocal();
        for (const word of words) {
            if (word.kind !== 'begrep') continue;
            const term = word.display?.trim();
            if (!term) continue;
            const id = conceptId(term);
            const exists = !!store.items[id];

            if (correct) {
                // Et ord eleven klarte selv skal ikke dra nye kort inn i køen -
                // det graderer bare det som allerede ligger der.
                if (exists) store.gradeItem(id, true, today);
                continue;
            }
            // Trengte eleven hjelp: ligger kortet der fra før, skal det ned
            // igjen i køen, ikke bare bekreftes.
            if (exists) store.demoteItem(id, today);
            else store.addItem({ id, type: 'concept', term }, today);
        }
    } catch {
        // Innsamling er best-effort
    }
};
