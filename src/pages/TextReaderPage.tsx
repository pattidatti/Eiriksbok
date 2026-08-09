import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, User, Tag, Volume2, Pause, Play, Square, Columns, Scan } from 'lucide-react';
import { textLibraryData, type TextEntry } from '../data/textLibraryData';
import { usePageTitle } from '../hooks/usePageTitle';
import { Tooltip } from '../components/Tooltip';
import { useTTS } from '../hooks/useTTS';
import { usePreGeneratedAudio } from '../hooks/usePreGeneratedAudio';
import { cleanMarkdown } from '../utils/speechUtils';


const genreToAnalysisMap: Record<string, string> = {
    'novelle': 'analyse-novelle',
    'dikt': 'analyse-dikt',
    'romanutdrag': 'analyse-roman',
    'eventyr': 'analyse-eventyr',
    'fagartikkel': 'analyse-fagartikkel',
    'debattinnlegg': 'analyse-debattinnlegg',
    'kommentar': 'analyse-kommentar'
};

export const TextReaderPage: React.FC = () => {
    const { textId } = useParams<{ textId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const textEntry = useMemo(() =>
        textLibraryData.find((t: TextEntry) => t.id === textId),
        [textId]);

    const [currentLanguage, setCurrentLanguage] = useState<string>(textEntry?.language || 'bm.');
    const [isSplitView, setIsSplitView] = useState(
        () => !!textEntry?.translations && textEntry.translations.length > 0
    );

    // Bytter eleven tekst, skal språk og delt visning følge den nye teksten.
    // Justeres under render i stedet for i en effect, så den nye teksten aldri
    // vises et øyeblikk med forrige teksts innstillinger.
    const [prevTextEntry, setPrevTextEntry] = useState(textEntry);
    if (textEntry !== prevTextEntry) {
        setPrevTextEntry(textEntry);
        if (textEntry) {
            setCurrentLanguage(textEntry.language || 'bm.');
            // Default to split view if translations are available
            if (textEntry.translations && textEntry.translations.length > 0) {
                setIsSplitView(true);
            }
        }
    }



    const displayContent = useMemo(() => {
        if (!textEntry) return [];
        if (currentLanguage === (textEntry.language || 'bm.')) return textEntry.content;
        const translation = textEntry.translations?.find((t) => t.language === currentLanguage);
        return translation ? translation.content : textEntry.content;
    }, [textEntry, currentLanguage]);

    const compareContent = useMemo(() => {
        if (!textEntry || !isSplitView) return null;

        // If current is base language, try to find a translation (prefer the first one)
        if (currentLanguage === (textEntry.language || 'bm.')) {
            return textEntry.translations?.[0]?.content || null;
        }

        // If current is a translation, show the base language
        return textEntry.content;
    }, [textEntry, currentLanguage, isSplitView]);

    const displayTitle = useMemo(() => {
        if (!textEntry) return '';
        if (currentLanguage === (textEntry.language || 'bm.')) return textEntry.title;
        const translation = textEntry.translations?.find((t) => t.language === currentLanguage);
        return translation ? translation.title : textEntry.title;
    }, [textEntry, currentLanguage]);

    // Handle hash scrolling
    // NB: her sto det tidligere `location.hash` uten useLocation, altså den
    // globale window.location. Den er et mutabelt objekt React ikke ser
    // endringer i, så effekten kjørte ikke når man klikket seg til et nytt
    // anker på samme side. useLocation gir en ny verdi per navigasjon.
    useEffect(() => {
        if (location.hash && displayContent) {
            const id = location.hash.replace('#', '');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500); // Small delay to ensure rendering
        }
    }, [location.hash, displayContent]);

    usePageTitle(displayTitle || 'Les tekst');

    const preGen = usePreGeneratedAudio(textId ?? '');
    const fallbackTTS = useTTS();
    const { speak, pause, resume, cancel, playBlock, isPlaying, isPaused, hasVoice, activeBlockIndex, rate, setRate } =
        preGen.isAvailable ? preGen : fallbackTTS;

    // Calculate speech blocks and mapping
    const speechData = useMemo(() => {
        if (!displayContent) return { blocks: [], mapSpeechToContent: [], mapContentToSpeech: {} };

        const blocks: string[] = [];
        const mapSpeechToContent: number[] = [];
        const mapContentToSpeech: Record<number, number> = {};

        // Add title as first block
        blocks.push(displayTitle);
        mapSpeechToContent.push(-1); // -1 indicates title

        displayContent.forEach((paragraph: string, index: number) => {
            const cleanText = cleanMarkdown(paragraph);
            if (cleanText) {
                blocks.push(cleanText);
                const speechIndex = blocks.length - 1;
                mapSpeechToContent.push(index);
                mapContentToSpeech[index] = speechIndex;
            }
        });

        return { blocks, mapSpeechToContent, mapContentToSpeech };
    }, [displayContent, displayTitle]);

    // Stop speaking when leaving the page
    useEffect(() => {
        return () => {
            cancel();
        };
    }, [cancel]);

    const handleListenClick = () => {
        if (isPlaying) {
            if (isPaused) {
                resume();
            } else {
                pause();
            }
        } else {
            if (speechData.blocks.length > 0) {
                speak(speechData.blocks);
            }
        }
    };

    const renderDefinitions = (text: string) => {
        if (!textEntry?.definitions) return text;

        let parts: (string | React.ReactNode)[] = [text];

        textEntry.definitions.forEach((def, index) => {
            const newParts: (string | React.ReactNode)[] = [];
            parts.forEach(part => {
                if (typeof part === 'string') {
                    const escapedTerm = def.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');
                    const split = part.split(regex);

                    for (let i = 0; i < split.length; i++) {
                        if (i % 2 === 1) {
                            newParts.push(
                                <Tooltip key={`${index}-${i}`} text={def.definition}>
                                    {split[i]}
                                </Tooltip>
                            );
                        } else {
                            newParts.push(split[i]);
                        }
                    }
                } else {
                    newParts.push(part);
                }
            });
            parts = newParts;
        });

        return parts;
    };

    const parseInlines = (text: string, isComparison: boolean = false) => {
        const parts = text.split(/(\[.*?\]\(.*?\)|<b>.*?<\/b>|<i>.*?<\/i>)/g);
        return parts.map((part, i) => {
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                    return (
                        <a
                            key={i}
                            href={match[2]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                            {renderDefinitions(match[1])}
                        </a>
                    );
                }
            }
            if (part.startsWith('<b>') && part.endsWith('</b>')) {
                const inner = part.slice(3, -4);
                return <strong key={i} className="font-bold">{isComparison ? inner : renderDefinitions(inner)}</strong>;
            }
            if (part.startsWith('<i>') && part.endsWith('</i>')) {
                const inner = part.slice(3, -4);
                return <em key={i} className="italic">{isComparison ? inner : renderDefinitions(inner)}</em>;
            }
            return isComparison ? part : renderDefinitions(part);
        });
    };

    const renderParagraph = (text: string, isComparison: boolean = false) => {
        return parseInlines(text, isComparison);
    };

    if (!textEntry) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-12 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Teksten ble ikke funnet</h2>
                <button
                    onClick={() => navigate('/norsk/bibliotek')}
                    className="text-indigo-600 hover:underline"
                >
                    Tilbake til biblioteket
                </button>
            </div>
        );
    }

    return (
        <div className={`mx-auto px-6 py-12 ${isSplitView ? 'max-w-7xl' : 'max-w-4xl'}`}>
            <button
                onClick={() => navigate('/norsk/bibliotek')}
                className="flex items-center text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
            >
                <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Tilbake til biblioteket
            </button>

            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100"
            >
                <header className="mb-12 text-center border-b border-slate-100 pb-12">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider mb-4">
                        {textEntry.genre}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
                        {displayTitle}
                    </h1>

                    <div className="flex flex-col items-center gap-6">
                        {/* Audio & Split View Controls */}
                        <div className="flex flex-wrap justify-center gap-4">
                            {hasVoice && (
                                <div className="flex items-center gap-2">
                                    {isPlaying ? (
                                        /* Active player controls */
                                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                                            <Volume2 className="w-4 h-4 text-indigo-500 animate-pulse" />
                                            <span className="text-xs text-slate-500 font-medium">
                                                {isPaused ? 'Pauset' : 'Leser...'}
                                            </span>
                                            <button
                                                onClick={handleListenClick}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                                title={isPaused ? 'Fortsett' : 'Pause'}
                                            >
                                                {isPaused
                                                    ? <Play className="w-3.5 h-3.5 ml-0.5" />
                                                    : <Pause className="w-3.5 h-3.5" />
                                                }
                                            </button>
                                            <button
                                                onClick={cancel}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                title="Stopp"
                                            >
                                                <Square className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        /* Idle - start button */
                                        <button
                                            onClick={handleListenClick}
                                            className="flex items-center px-4 py-2 rounded-full font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all shadow-sm"
                                        >
                                            <Volume2 className="w-5 h-5 mr-2" /> Lytt til tekst
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            const rates = [0.8, 1.0, 1.2, 1.5];
                                            const idx = rates.indexOf(rate);
                                            setRate(rates[(idx + 1) % rates.length]);
                                        }}
                                        className="px-3 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all"
                                        title="Endre hastighet"
                                    >
                                        {rate}x
                                    </button>
                                </div>
                            )}

                            {/* Split View Toggle */}
                            {textEntry.translations && textEntry.translations.length > 0 && (
                                <button
                                    onClick={() => setIsSplitView(!isSplitView)}
                                    className={`flex items-center px-4 py-2 rounded-full font-bold transition-all shadow-sm ${isSplitView
                                        ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <Columns className="w-5 h-5 mr-2" />
                                    {isSplitView ? 'Side ved side' : 'Vis parallelltekst'}
                                </button>
                            )}
                        </div>

                        {/* Metadata & Language Selection */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600">
                            <button
                                onClick={() => navigate(`/norsk/bibliotek?search=${textEntry.author}`)}
                                className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                            >
                                <User size={18} />
                                <span className="font-medium">{textEntry.author}</span>
                            </button>
                            {textEntry.publishedYear && (
                                <button
                                    onClick={() => {
                                        let periodLabel = '';
                                        if (textEntry.publishedYear! < 1900) periodLabel = 'Før 1900';
                                        else if (textEntry.publishedYear! <= 1950) periodLabel = '1900 - 1950';
                                        else if (textEntry.publishedYear! <= 2000) periodLabel = '1950 - 2000';
                                        else periodLabel = 'Etter 2000';

                                        navigate(`/norsk/bibliotek?period=${periodLabel}`);
                                    }}
                                    className="text-sm font-mono bg-slate-100 px-2 py-1 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                >
                                    {textEntry.publishedYear}
                                </button>
                            )}
                            {textEntry.language && (
                                <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                                    {textEntry.language}
                                </span>
                            )}

                            {/* Language Switcher */}
                            {textEntry.translations && textEntry.translations.length > 0 && (
                                <div className="flex items-center bg-slate-100 rounded-lg p-1 ml-4">
                                    <button
                                        onClick={() => setCurrentLanguage(textEntry.language || 'bm.')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentLanguage === (textEntry.language || 'bm.')
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        {textEntry.language === 'bm.' ? 'Bokmål' : textEntry.language === 'nn.' ? 'Nynorsk' : textEntry.language}
                                    </button>
                                    {textEntry.translations.map((t) => (
                                        <button
                                            key={t.language}
                                            onClick={() => setCurrentLanguage(t.language)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentLanguage === t.language
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            {t.language}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Genre Links Section */}
                {!isSplitView && (
                    <div className="mb-12 flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={() => navigate(`/norsk/tekstsjangre/${textEntry.genre.toLowerCase().replace(/\s+/g, '-')}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                        >
                            <BookOpen size={18} />
                            Kjennetegn på {textEntry.genre.toLowerCase()}
                        </button>
                        <button
                            onClick={() => navigate(`/norsk/skrivehjelp/hvordan-skrive-${textEntry.genre.toLowerCase().replace(/\s+/g, '-')}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                        >
                            <User size={18} />
                            Hvordan skrive {textEntry.genre.toLowerCase()}
                        </button>
                    </div>
                )}

                {/* Analysis Link - New Section */}
                {!isSplitView && genreToAnalysisMap[textEntry.genre.toLowerCase()] && (
                    <div className="mb-12 flex justify-center -mt-8">
                        <button
                            onClick={() => navigate(`/norsk/analyse/${genreToAnalysisMap[textEntry.genre.toLowerCase()]}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium border border-purple-100"
                        >
                            <Scan size={18} />
                            Slik analyserer du {textEntry.genre.toLowerCase()}
                        </button>
                    </div>
                )}

                <div className={`prose prose-lg prose-slate mx-auto font-serif ${isSplitView ? 'max-w-none' : ''}`}>
                    {displayContent ? (
                        displayContent.map((paragraph: string, index: number) => {
                            const isActive = activeBlockIndex !== -1 && speechData.mapSpeechToContent[activeBlockIndex] === index;

                            // Base classes for the main content paragraph
                            const activeClass = isActive
                                ? "bg-yellow-50 rounded-lg border-l-4 border-yellow-400 transition-all duration-300 ease-in-out shadow-sm"
                                : "transition-all duration-300 ease-in-out border-l-4 border-transparent";

                            const contentWrapperClass = isSplitView
                                ? "grid grid-cols-2 gap-8 mb-6 border-b border-slate-50 pb-6 last:border-0"
                                : `mb-6 leading-relaxed relative ${activeClass} ${!isActive ? '-mx-4 px-4' : '-mx-4 px-4'} cursor-pointer group`;

                            const compareParagraph = compareContent ? compareContent[index] : null;

                            return (
                                <div
                                    key={index}
                                    className={contentWrapperClass}
                                    onClick={() => {
                                        if (!isSplitView) {
                                            const speechIndex = speechData.mapContentToSpeech[index];
                                            if (speechIndex !== undefined) playBlock(speechIndex);
                                        }
                                    }}
                                >
                                    {/* Left Column / Main Content */}
                                    <div className={`relative ${isSplitView ? (isActive ? 'bg-yellow-50 p-4 rounded-lg' : '') : ''}`}>

                                        {/* Verse Number */}
                                        {textEntry.genre === 'Dikt' && (
                                            <span className={`absolute ${isSplitView ? '-left-8' : '-left-8 md:-left-12'} top-0 text-slate-400 font-sans text-sm font-medium select-none w-6 text-right`}>
                                                {index + 1}
                                            </span>
                                        )}

                                        {isActive && !isSplitView && (
                                            <div
                                                className="absolute -left-16 top-1 hidden md:flex flex-col items-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{
                                                        duration: 1.5,
                                                        repeat: Infinity,
                                                        ease: 'easeInOut',
                                                    }}
                                                >
                                                    <Volume2 className="w-5 h-5 text-yellow-600" />
                                                </motion.div>
                                                <button
                                                    onClick={handleListenClick}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                                                    title={isPaused ? 'Fortsett' : 'Pause'}
                                                >
                                                    {isPaused
                                                        ? <Play className="w-3.5 h-3.5 ml-0.5" />
                                                        : <Pause className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={cancel}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                                                    title="Stopp"
                                                >
                                                    <Square className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                        <div className={`text-slate-800 ${textEntry.genre === 'Dikt' ? 'whitespace-pre-line' : ''}`}>
                                            {paragraph.startsWith('### ') ? (
                                                <h3
                                                    id={paragraph.replace('### ', '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                                                    className="text-xl font-bold mt-8 mb-4 text-slate-900 border-l-2 border-indigo-200 pl-4"
                                                >
                                                    {renderParagraph(paragraph.replace('### ', ''))}
                                                </h3>
                                            ) : paragraph.startsWith('## ') ? (
                                                <h2
                                                    id={paragraph.replace('## ', '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                                                    className="text-2xl font-bold mt-10 mb-6 text-slate-900 border-b border-slate-100 pb-2"
                                                >
                                                    {renderParagraph(paragraph.replace('## ', ''))}
                                                </h2>
                                            ) : (
                                                <p>{renderParagraph(paragraph)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column / Comparison Content */}
                                    {isSplitView && compareParagraph && (
                                        <div className={`relative text-slate-600 font-serif border-l border-slate-100 pl-8 ${textEntry.genre === 'Dikt' ? 'whitespace-pre-line' : ''} ${isActive ? 'bg-yellow-50/50 py-4 pr-4 pl-10 rounded-r-lg -ml-8 border-l-0 border-r border-yellow-200' : ''}`}>

                                            {/* Verse Number for Comparison */}
                                            {textEntry.genre === 'Dikt' && (
                                                <span className="absolute left-1 top-0 text-slate-400 font-sans text-sm font-medium select-none w-6 text-right">
                                                    {index + 1}
                                                </span>
                                            )}

                                            <p>{renderParagraph(compareParagraph, true)}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                            <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">Teksten er ikke tilgjengelig digitalt enda.</p>
                            {textEntry.url && (
                                <a
                                    href={textEntry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Les teksten eksternt
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {textEntry.reflectionTasks && (
                    <div className="max-w-3xl mx-auto mt-12 mb-4">
                        <details className="group bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden">
                            <summary className="flex items-center justify-between p-6 cursor-pointer list-none text-indigo-900 font-semibold hover:bg-indigo-50 transition-colors">
                                <span className="flex items-center gap-2">
                                    <BookOpen size={20} className="text-indigo-600" />
                                    Refleksjonsoppgaver
                                </span>
                                <span className="transform group-open:rotate-180 transition-transform duration-200">
                                    ▼
                                </span>
                            </summary>
                            <div className="px-6 pb-6 pt-2 text-slate-700">
                                {(() => {
                                    // Group tasks by headers (lines starting with <b>)
                                    const groups: { header: string | null; tasks: string[] }[] = [];
                                    let currentGroup: { header: string | null; tasks: string[] } = { header: null, tasks: [] };

                                    textEntry.reflectionTasks.forEach((task) => {
                                        if (task.startsWith('<b>')) {
                                            if (currentGroup.tasks.length > 0 || currentGroup.header) {
                                                groups.push(currentGroup);
                                            }
                                            currentGroup = { header: task, tasks: [] };
                                        } else {
                                            currentGroup.tasks.push(task);
                                        }
                                    });
                                    if (currentGroup.tasks.length > 0 || currentGroup.header) {
                                        groups.push(currentGroup);
                                    }

                                    return (
                                        <div className="space-y-6">
                                            {groups.map((group, groupIndex) => (
                                                <div key={groupIndex}>
                                                    {group.header && (
                                                        <div className="font-bold text-indigo-900 mb-3">
                                                            {parseInlines(group.header)}
                                                        </div>
                                                    )}
                                                    {group.tasks.length > 0 && (
                                                        <ol className="list-decimal list-outside ml-5 space-y-2">
                                                            {group.tasks.map((task, taskIndex) => (
                                                                <li key={taskIndex} className="pl-2">
                                                                    {parseInlines(task)}
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </details>
                    </div>
                )}

                {textEntry.lessonPlan && (
                    <div className="max-w-3xl mx-auto mb-8">
                        <details className="group bg-emerald-50/50 rounded-xl border border-emerald-100 overflow-hidden">
                            <summary className="flex items-center justify-between p-6 cursor-pointer list-none text-emerald-900 font-semibold hover:bg-emerald-50 transition-colors">
                                <span className="flex items-center gap-2">
                                    <BookOpen size={20} className="text-emerald-600" />
                                    Oppgaver
                                </span>
                                <span className="transform group-open:rotate-180 transition-transform duration-200">
                                    ▼
                                </span>
                            </summary>
                            <div className="px-6 pb-6 pt-2 text-slate-700 space-y-6">
                                <div>
                                    <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Læringsmål
                                    </h4>
                                    <ul className="list-disc list-outside ml-5 space-y-1 text-sm italic">
                                        {textEntry.lessonPlan.learningObjectives.map((obj: string, i: number) => (
                                            <li key={i}>{parseInlines(obj)}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">Før lesing</h4>
                                        <ul className="list-disc list-outside ml-5 space-y-2 text-sm">
                                            {textEntry.lessonPlan.preReading.map((task: string, i: number) => (
                                                <li key={i}>{parseInlines(task)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">Under lesing</h4>
                                        <ul className="list-disc list-outside ml-5 space-y-2 text-sm">
                                            {textEntry.lessonPlan.whileReading.map((task: string, i: number) => (
                                                <li key={i}>{parseInlines(task)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Etter lesing</h4>
                                    <ul className="list-disc list-outside ml-5 space-y-2 text-sm">
                                        {textEntry.lessonPlan.postReading.map((task: string, i: number) => (
                                            <li key={i}>{parseInlines(task)}</li>
                                        ))}
                                    </ul>
                                </div>

                                {textEntry.lessonPlan.writingTask && (
                                    <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
                                        <h4 className="font-bold text-emerald-900 mb-2 uppercase tracking-tight text-xs">Skriveoppgave</h4>
                                        <p className="text-sm leading-relaxed">{textEntry.lessonPlan.writingTask}</p>
                                    </div>
                                )}
                            </div>
                        </details>
                    </div>
                )}

                {textEntry.theme && (
                    <footer className="mt-16 pt-8 border-t border-slate-100">
                        <div className="flex flex-wrap gap-2 text-slate-500 text-sm">
                            <Tag size={16} />
                            <span className="font-medium">Tema:</span>
                            {textEntry.theme.map((t: string) => (
                                <button
                                    key={t}
                                    onClick={() => navigate(`/norsk/bibliotek?theme=${t}`)}
                                    className="bg-slate-100 px-2 py-1 rounded text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </footer>
                )}
            </motion.article>
        </div >
    );
};
