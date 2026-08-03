import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchLesson } from '../utils/contentLoader';
import { routeFactories } from '../routes';

/**
 * Varmer opp en leksjon før eleven rekker å klikke.
 *
 * PrefetchLink henter bare rute-chunken (JS-modulen for LessonPage). Den er som
 * regel allerede lastet når eleven står i et leksjonsgrid - det som faktisk
 * gjenstår, og som gir spinneren, er artikkel-JSON-en. Her hentes begge deler:
 * modulen og selve innholdet, lagt rett i React Query-cachen under nøyaktig
 * samme nøkkel som useLesson bruker. Klikket treffer da varm cache og
 * artikkelen vises umiddelbart.
 */

/** '/historie/vikingtiden/rikssamlingen' -> nøkkeldelene useLesson bruker. */
const parseLessonPath = (path: string) => {
    const segments = path.split('?')[0].split('#')[0].split('/').filter(Boolean);

    // Kun /fag/emne/leksjon og /fag/emne/underemne/leksjon er leksjonsruter.
    // Verktøy- og spill-lenker (/oving/..., /norsk/bibliotek/...) skal ikke
    // treffe leksjonslasteren - de ville bare gitt en bom-fetch.
    if (segments.length < 3 || segments.length > 4) return null;
    if (segments.some((segment) => segment === 'present')) return null;

    const [subjectId, topicId, ...rest] = segments;
    return {
        subjectId,
        topicId,
        subTopicId: rest.length === 2 ? rest[0] : undefined,
        lessonId: rest[rest.length - 1],
    };
};

/** Hvor lenge eleven må hvile på kortet før vi bruker nett på det. */
const HOVER_DELAY_MS = 120;

export const usePrefetchLesson = (path: string) => {
    const queryClient = useQueryClient();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const prefetch = useCallback(() => {
        const parts = parseLessonPath(path);
        if (!parts) return;

        // Rute-chunken kan mangle hvis eleven kom rett inn på en emneside.
        routeFactories.LessonPage();

        const { subjectId, topicId, subTopicId, lessonId } = parts;
        void queryClient.prefetchQuery({
            queryKey: ['lesson', subjectId, topicId, subTopicId, lessonId],
            queryFn: () => fetchLesson(subjectId, topicId, lessonId, subTopicId),
            // useLesson kjører med staleTime 0 for å alltid revalidere. Uten en
            // egen staleTime her ville hver eneste hover regnes som «utdatert»
            // og utløse et nytt kall - også når eleven nettopp har svevd over
            // samme kort. Ett minutt er rikelig for en forhåndshenting.
            staleTime: 1000 * 60,
        });
    }, [path, queryClient]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    useEffect(() => cancel, [cancel]);

    return {
        onPointerEnter: () => {
            cancel();
            timeoutRef.current = setTimeout(prefetch, HOVER_DELAY_MS);
        },
        onPointerLeave: cancel,
        // Touch har ingen hover. pointerdown kommer ~100 ms før click, og de
        // millisekundene er gratis.
        onPointerDown: () => {
            cancel();
            prefetch();
        },
    };
};
