import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useLesson } from '../hooks/useLesson';
import { mapContentToPresentation } from '../utils/presentationUtils';
import { filmerISteg, filmerIStasjon, leggInnFilmLysbilder } from '../features/film/stiFilmer';
import { PresentationController } from '../components/presentation/PresentationController';
import { ProjectorView } from '../components/presentation/ProjectorView';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../context/LayoutContext';

export const PresentationPage: React.FC = () => {
    const { subjectId, topicId, subTopicId, lessonId } = useParams<{
        subjectId: string;
        topicId: string;
        subTopicId?: string;
        lessonId: string
    }>();

    const location = useLocation();
    const navigate = useNavigate();
    const layout = useLayout();
    const isProjector = location.pathname.endsWith('/projector');

    // Fetch the lesson data
    const { data: lesson, isLoading } = useLesson(
        subjectId || '',
        topicId || '',
        lessonId || '',
        subTopicId
    );

    // Presentation Mode: Full screen focus
    React.useLayoutEffect(() => {
        if (layout) {
            layout.setHideHeader(true);
            layout.setFullWidth(true);
        }

        return () => {
            if (layout) {
                layout.setHideHeader(false);
                layout.setFullWidth(false);
            }
        };
    }, [layout]);

    // Level 1: Auto-generate or Use Curated
    const presentationData = React.useMemo(() => {
        if (!lesson) return null;
        // Filmer til artiklene i stien får et eget lysbilde i steget de hører til.
        const filmer = new Map<string, string[]>();
        for (const steg of lesson.learningPathData?.steps || []) {
            const f = filmerISteg(steg);
            if (f.length) filmer.set(steg.id, f);
        }
        for (const fase of lesson.learningPathV3Data?.phases || []) {
            for (const stasjon of fase.stations) {
                const f = filmerIStasjon(stasjon);
                if (f.length) filmer.set(stasjon.id, f);
            }
        }
        return leggInnFilmLysbilder(
            mapContentToPresentation(lesson, lesson.id || lessonId || 'unknown'),
            filmer
        );
    }, [lesson, lessonId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="font-bold tracking-widest text-sm uppercase">Klargjør lysbilder...</p>
                </div>
            </div>
        );
    }

    if (!lesson || !presentationData) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Ups! Fant ikke innholdet.</h1>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-indigo-600 px-6 py-2 rounded-lg font-bold"
                    >
                        Gå tilbake
                    </button>
                </div>
            </div>
        );
    }

    if (isProjector) {
        return <ProjectorView data={presentationData} />;
    }

    return (
        <PresentationController
            data={presentationData}
            steps={lesson.learningPathData?.steps}
            onClose={() => navigate(-1)}
        />
    );
};
