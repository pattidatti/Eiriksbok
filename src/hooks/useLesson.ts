import { useQuery } from '@tanstack/react-query';
import { fetchLesson, LessonNotFoundError } from '../utils/contentLoader';
import type { Lesson } from '../types';

export const useLesson = (subjectId: string, topicId: string, lessonId: string, subTopicId?: string) => {
    return useQuery<Lesson>({
        queryKey: ['lesson', subjectId, topicId, subTopicId, lessonId],
        queryFn: () => fetchLesson(subjectId, topicId, lessonId, subTopicId),
        enabled: !!subjectId && !!topicId && !!lessonId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        // Ikke retry når leksjonen beviselig ikke finnes - kun ved nettverksfeil
        retry: (failureCount, error) =>
            !(error instanceof LessonNotFoundError) && failureCount < 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });
};
