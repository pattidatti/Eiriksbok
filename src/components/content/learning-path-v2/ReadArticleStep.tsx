import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, ExternalLink, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizRunner } from './QuizRunner';
import { ArticleContent } from '../../ArticleContent';
import type { StepRendererProps } from './types';
import { useStepSounds } from '../../../hooks/useStepSounds';
import type { ContentBlock } from '../../../types';

// Tre-fase steg:
//   1. Vis kort intro + knapp "Les artikkelen"
//   2. Åpne artikkel i in-page modal (ingen tap av sti-kontekst)
//   3. Når elev lukker modalen, åpnes comprehension-sjekk
export const ReadArticleStep: React.FC<StepRendererProps> = ({ step, onComplete }) => {
    const [phase, setPhase] = useState<'intro' | 'check'>('intro');
    const [modalOpen, setModalOpen] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);
    const questions = step.completion.comprehensionQuestions ?? [];
    const minScore = step.completion.minScore ?? 0.7;
    const sounds = useStepSounds();

    if (phase === 'check' && questions.length > 0) {
        return (
            <QuizRunner
                title="Kort forståelses-sjekk"
                questions={questions}
                minScore={minScore}
                onPass={(score, answers) => onComplete({ score, answers, completed: true })}
            />
        );
    }

    const openArticle = () => {
        setModalOpen(true);
        setHasOpened(true);
        sounds.play('advance');
    };

    const closeArticleAndCheck = () => {
        setModalOpen(false);
        if (questions.length > 0) {
            setPhase('check');
        } else {
            onComplete({ score: 1, completed: true });
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                        Les artikkelen
                    </span>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {step.articleTitle ?? 'Les denne artikkelen'}
                </h3>

                <p className="text-slate-600 leading-relaxed mb-6">
                    {hasOpened
                        ? 'Når du er ferdig med å lese, lukk artikkelen og ta forståelses-sjekken.'
                        : 'Artikkelen åpnes i samme vindu. Når du har lest, kommer du tilbake hit og svarer på noen raske spørsmål.'}
                </p>

                <div className="flex flex-wrap gap-3">
                    {step.articleUrl && (
                        <button
                            onClick={openArticle}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow hover:bg-indigo-700 transition"
                        >
                            {hasOpened ? 'Åpne artikkelen igjen' : 'Åpne artikkelen'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}

                    {hasOpened && questions.length > 0 && (
                        <button
                            onClick={() => setPhase('check')}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow hover:bg-slate-800 transition"
                        >
                            Ta forståelses-sjekken
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}

                    {hasOpened && questions.length === 0 && (
                        <button
                            onClick={() => onComplete({ score: 1, completed: true })}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow hover:bg-slate-800 transition"
                        >
                            Jeg har lest - gå videre
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}

                    {step.articleUrl && (
                        <Link
                            to={step.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                            title="Åpne i ny fane hvis du foretrekker det"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Ny fane
                        </Link>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {modalOpen && step.articleUrl && (
                    <ArticleModal
                        articleUrl={step.articleUrl}
                        title={step.articleTitle ?? 'Artikkel'}
                        onClose={closeArticleAndCheck}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

interface ArticleModalProps {
    articleUrl: string;
    title: string;
    onClose: () => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ articleUrl, title, onClose }) => {
    const [content, setContent] = useState<ContentBlock[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // articleUrl er på formen "/historie/romerriket/romersk-start"
        // JSON-fila ligger på "/content/historie/romerriket/romersk-start.json"
        const path = `/content${articleUrl}.json`;
        let cancelled = false;
        fetch(path)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                if (cancelled) return;
                if (Array.isArray(data?.content)) {
                    setContent(data.content);
                } else {
                    setError('Artikkelen mangler innhold.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('Kunne ikke laste artikkelen. Prøv å åpne i ny fane.');
            });
        return () => {
            cancelled = true;
        };
    }, [articleUrl]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-stretch justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                className="bg-white w-full max-w-4xl my-4 md:my-8 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between gap-4 px-5 md:px-8 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                            Artikkel
                        </span>
                        <h2 className="text-base md:text-lg font-bold text-slate-900 truncate">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition flex-shrink-0"
                    >
                        <span className="hidden md:inline">Ferdig - tilbake til stien</span>
                        <span className="md:hidden">Ferdig</span>
                        <X className="w-4 h-4" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-5 md:px-10 py-6 md:py-8">
                    {error && (
                        <div className="rounded-xl bg-rose-50 border border-rose-200 p-5 text-rose-900">
                            {error}
                        </div>
                    )}
                    {!error && !content && (
                        <div className="flex items-center justify-center py-20 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-3" />
                            Laster artikkelen...
                        </div>
                    )}
                    {!error && content && <ArticleContent content={content} />}
                </div>
            </motion.div>
        </motion.div>
    );
};
