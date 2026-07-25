import { useQuery } from '@tanstack/react-query';
import { fetchLesson, LessonNotFoundError } from '../utils/contentLoader';
import type { Lesson } from '../types';

export const useLesson = (subjectId: string, topicId: string, lessonId: string, subTopicId?: string) => {
    return useQuery<Lesson>({
        queryKey: ['lesson', subjectId, topicId, subTopicId, lessonId],
        queryFn: () => fetchLesson(subjectId, topicId, lessonId, subTopicId),
        enabled: !!subjectId && !!topicId && !!lessonId,
        // Innhold rettes ofte midt i en time, og eleven skal ha nyeste versjon.
        // staleTime 0 + revalidering gjør at leksjonen friskes opp når eleven
        // navigerer inn i den, bytter tilbake til fanen eller får nett igjen.
        // Cachen vises umiddelbart mens revalideringen skjer i bakgrunnen, så
        // det gir ingen blank skjerm - og ETag gjør treffet gratis (304, 0 bytes).
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Eleven som blir sittende på artikkelen uten å navigere eller bytte
        // fane får den likevel oppdatert. Revalideringen koster ~110 bytes, og
        // React Query gjenbruker objektet når innholdet er uendret, så det
        // utløser ingen re-render i normaltilfellet.
        // refetchIntervalInBackground er bevisst ikke satt: React Query pauser
        // da intervallet når fanen er skjult, og refetchOnWindowFocus tar seg
        // av oppdateringen når eleven kommer tilbake.
        refetchInterval: 1000 * 60,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        // Ikke retry når leksjonen beviselig ikke finnes - kun ved nettverksfeil
        retry: (failureCount, error) =>
            !(error instanceof LessonNotFoundError) && failureCount < 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });
};
