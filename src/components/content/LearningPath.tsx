import React from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    BookOpen,
    MessageCircle,
    Zap,
    Users,
    ExternalLink,
    Gamepad2,
    ArrowRight,
    Brain,
    Monitor,
} from 'lucide-react';
import type { LearningPathData, LearningPathStep } from '../../types';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getComponent } from '../ComponentRegistry';
import { CopyTasksButton } from './CopyTasksButton';
import { LazyComponentSlot } from './LazyComponentSlot';

interface LearningPathProps {
    data: LearningPathData;
}

const getStepIcon = (type: LearningPathStep['type']) => {
    switch (type) {
        case 'fakta': return <CheckCircle2 className="w-5 h-5" />;
        case 'refleksjon': return <MessageCircle className="w-5 h-5" />;
        case 'utfordring': return <Zap className="w-5 h-5" />;
        case 'gruppe': return <Users className="w-5 h-5" />;
        case 'ressurs': return <BookOpen className="w-5 h-5" />;
        case 'oving': return <Gamepad2 className="w-5 h-5" />;
        case 'oppgave': return <Zap className="w-5 h-5" />;
        default: return <Circle className="w-5 h-5" />;
    }
};

const getStepColor = (type: LearningPathStep['type']) => {
    switch (type) {
        case 'fakta': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'refleksjon': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'utfordring': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'gruppe': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'ressurs': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        case 'oving': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        case 'oppgave': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
        default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
};

import { renderInlineMarkdown } from '../markdownUtils';
import { useGlossary } from '../../context/GlossaryContext';

export const LearningPath: React.FC<LearningPathProps> = ({ data }) => {
    const { entries } = useGlossary();
    const navigate = useNavigate();
    const params = useParams<{
        subjectId: string;
        topicId: string;
        subTopicId?: string;
        lessonId: string;
    }>();

    const hasPresentation = !!data.presentation && Array.isArray(data.presentation.slides) && data.presentation.slides.length > 0;
    const presentationTarget = React.useMemo(() => {
        const { subjectId, topicId, subTopicId, lessonId } = params;
        if (!subjectId || !topicId || !lessonId) return null;
        const stiId = data.id || lessonId;
        return subTopicId
            ? `/${subjectId}/${topicId}/${subTopicId}/present/${stiId}`
            : `/${subjectId}/${topicId}/present/${stiId}`;
    }, [params, data.id]);

    return (
        <div className="max-w-4xl mx-auto py-8 px-6">
            <header className="mb-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
                        {data.title}
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                        {renderInlineMarkdown(data.description, entries)}
                    </p>
                    {hasPresentation && presentationTarget && (
                        <motion.button
                            onClick={() => navigate(presentationTarget)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                            title="Start lærer-presentasjon for denne læringsstien"
                        >
                            <Monitor className="w-4 h-4" />
                            Start lysbilder for denne stien
                        </motion.button>
                    )}
                </motion.div>
            </header>

            <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200" />

                <div className="space-y-4">
                    {data.steps.map((step, index) => {
                        const previousStep = index > 0 ? data.steps[index - 1] : null;
                        const showPhase = step.phase && step.phase !== previousStep?.phase;

                        return (
                            <React.Fragment key={step.id}>
                                {showPhase && (
                                    <div className="relative pl-14 py-4 flex items-center">
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center z-10">
                                            <div className="w-3 h-3 rounded-full bg-slate-300 border-2 border-white" />
                                        </div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                            Fase: {step.phase}
                                        </h2>
                                    </div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative pl-14"
                                >
                                    {/* Icon Marker */}
                                    <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center border-2 z-10 bg-white transition-transform hover:scale-110 ${getStepColor(step.type)}`}>
                                        {getStepIcon(step.type)}
                                    </div>

                                    <div className={`bg-white rounded-xl p-5 shadow-sm border transition-shadow hover:shadow-md ${step.type === 'oppgave' ? 'border-orange-200 bg-orange-50/10' : 'border-slate-100'}`}>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${getStepColor(step.type)}`}>
                                                    {step.type}
                                                </span>
                                            </div>
                                            <span className="text-slate-400 font-mono text-xs">
                                                Steg {index + 1}
                                            </span>
                                        </div>

                                        <h3 className={`text-xl font-bold mb-2 ${step.type === 'oppgave' ? 'text-orange-900' : 'text-slate-800'}`}>
                                            {step.title}
                                        </h3>
                                        {step.content && (
                                            <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed mb-3">
                                                {step.content.split('\n\n').map((paragraph, i) => (
                                                    <p key={i} className="mb-4 last:mb-0">
                                                        {renderInlineMarkdown(paragraph, entries)}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {step.component && (() => {
                                            const name = step.component.name;
                                            const Component = getComponent(name);
                                            if (!Component) return null;
                                            return (
                                                <LazyComponentSlot name={name}>
                                                    <Component {...step.component.props} />
                                                </LazyComponentSlot>
                                            );
                                        })()}

                                        {step.links && step.links.length > 0 && (
                                            <div className="flex flex-wrap gap-3 mb-6">
                                                {step.links.map((link, i) => {
                                                    const isExternal = link.external || link.url.startsWith('http');

                                                    if (isExternal) {
                                                        return (
                                                            <a
                                                                key={i}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                                            >
                                                                {link.title}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        );
                                                    }

                                                    return (
                                                        <Link
                                                            key={i}
                                                            to={link.url}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                                                        >
                                                            {link.title}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {step.tasks && step.tasks.length > 0 && (
                                            <div className={`rounded-lg p-4 mb-4 ${step.type === 'oppgave' ? 'bg-orange-100/30' : 'bg-slate-50'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold text-slate-700 flex items-center text-sm">
                                                        <ArrowRight className="w-4 h-4 mr-2 text-slate-400" />
                                                        Oppgaver
                                                    </h4>
                                                    <CopyTasksButton tasks={step.tasks} stepNumber={index + 1} />
                                                </div>
                                                <ul className="space-y-3">
                                                    {step.tasks.map((task, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-slate-600">
                                                            <span className="font-mono text-xs font-bold text-slate-400 mt-1 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">
                                                                {index + 1}.{i + 1}
                                                            </span>
                                                            <span className="text-sm">
                                                                {renderInlineMarkdown(typeof task === 'string' ? task : task.text, entries)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <footer className="mt-20 pt-12 border-t border-slate-100 text-center">
                <div className="inline-flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Du er ferdig med stien!</h3>
                    <p className="text-slate-500 mb-8">Gå videre til neste emne for å fortsette læringen.</p>

                    {data.targetTopicId && (
                        <Link
                            to={`/oving/quiz?topic=${data.targetTopicId}${data.targetSubjectId ? `&subject=${data.targetSubjectId}` : ''}`}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transform hover:-translate-y-0.5 transition-all"
                        >
                            <Brain className="w-5 h-5" />
                            Test dine kunnskaper med en quiz
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    )}
                </div>
            </footer>
        </div >
    );
};
