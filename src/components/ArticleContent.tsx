import React from 'react';
import { Link } from 'react-router-dom';
import { Volume2, ChevronDown, Info, CheckCircle2, XCircle, Pause, Play, Square, PenLine } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { getComponent } from './ComponentRegistry';
import { useGlossary } from '../context/GlossaryContext';
import type { Concept, ContentBlock, RawContentBlock } from '../types';
import { CONTENT_BLOCK_TYPES } from '../types';
import { renderInlineMarkdown } from './markdownUtils';

// Eldre innhold fra GraphQL-laget hadde blokk-typen i __typename.
const LEGACY_TYPENAMES: Record<string, ContentBlock['type']> = {
    ArticleContentText: 'text',
    ArticleContentImage: 'image',
    ArticleContentHeader: 'header',
    ArticleContentList: 'list',
    ArticleContentComponent: 'component',
};

// Innholdet forfattes som JSON, så blokk-typen kan ligge tre steder: `type`
// (standard), `name` (eldre TinaCMS-format) eller `__typename` (eldre GraphQL).
// Dette er det ene stedet forskjellen håndteres.
const resolveBlockType = (block: ContentBlock): string | undefined => {
    const raw = block as RawContentBlock;
    if (raw.type) return raw.type;
    if (raw.name) return raw.name;
    if (raw.__typename) return LEGACY_TYPENAMES[raw.__typename];
    return undefined;
};

const KNOWN_BLOCK_TYPES = new Set<string>(CONTENT_BLOCK_TYPES);

const isKnownBlockType = (type: string | undefined): type is ContentBlock['type'] =>
    type !== undefined && KNOWN_BLOCK_TYPES.has(type);

// Normaliser alternative/legacy prop-navn til komponentens forventede props.
// Brukes både for legacy-format (props spredt på toppnivå) og standardformatet
// ({ type: "component", name, props }), slik at en QuoteBlock med "quote"/"source"
// aldri rendrer tomt selv om JSON bruker eldre navn.
const normalizeProps = (props: Record<string, unknown>, type?: string) => {
    if (props.facts && !props.items) props.items = props.facts;
    if (props.quote && !props.text) props.text = props.quote;
    if (props.quote && !props.content) props.content = props.quote;
    if (props.source && !props.author) props.author = props.source;
    if (props.rows && !props.items) props.items = props.rows;
    if (props.leftLabel && !props.leftTitle) props.leftTitle = props.leftLabel;
    if (props.rightLabel && !props.rightTitle) props.rightTitle = props.rightLabel;
    if (props.items && !props.events && type === 'TimelineComponent') props.events = props.items;
    return props;
};

// Simple markdown renderer fallback.
// Tar imot undefined fordi blokkene henter teksten fra alternative felter
// (content/text/value) som alle er valgfrie — funksjonen håndterer tomt selv.
const renderWithMarkdown = (text: string | undefined, concepts?: Concept[]) => {
    if (!text) return null;

    // Split by double newlines for blocks
    const blocks = text.split(/\n\n+/);

    return (
        <>
            {blocks.map((block, index) => {
                // Check for headers
                if (block.startsWith('#')) {
                    const level = block.match(/^#+/)?.[0].length || 0;
                    const content = block.replace(/^#+\s*/, '');
                    // Blokka starter med minst én '#', så nivået er alltid 1-6.
                    const HeaderTag = `h${Math.min(level + 1, 6)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
                    return (
                        <HeaderTag key={index} className={`font-bold text-slate-900 mb-4 mt-8 tracking-tight ${level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg'}`}>
                            {renderInlineMarkdown(content, concepts)}
                        </HeaderTag>
                    );
                }

                // Check for blockquotes
                if (block.startsWith('>')) {
                    const content = block.replace(/^>\s*/gm, '');
                    return (
                        <blockquote key={index} className="my-10 pl-8 border-l-2 border-slate-900 font-serif text-2xl italic text-slate-800 leading-relaxed">
                            {renderInlineMarkdown(content, concepts)}
                        </blockquote>
                    );
                }

                // Check for Ordered Lists (starts with number dot)
                if (block.match(/^\d+\.\s/)) {
                    const items = block.split(/\n/).filter(line => line.trim().match(/^\d+\.\s/));
                    return (
                        <ol key={index} className="list-decimal list-outside ml-6 space-y-2 mb-6 text-slate-700">
                            {items.map((item, i) => {
                                const content = item.replace(/^\d+\.\s+/, '');
                                return (
                                    <li key={i} className="leading-relaxed pl-2">
                                        {renderInlineMarkdown(content, concepts)}
                                    </li>
                                );
                            })}
                        </ol>
                    );
                }

                // Check for Unordered Lists (starts with * or -)
                if (block.match(/^(\*|-)\s/)) {
                    const items = block.split(/\n/).filter(line => line.trim().match(/^(\*|-)\s/));
                    return (
                        <ul key={index} className="list-disc list-outside ml-6 space-y-2 mb-6 text-slate-700">
                            {items.map((item, i) => {
                                const content = item.replace(/^(\*|-)\s+/, '');
                                return (
                                    <li key={i} className="leading-relaxed pl-2">
                                        {renderInlineMarkdown(content, concepts)}
                                    </li>
                                );
                            })}
                        </ul>
                    );
                }

                // Standard paragraph
                return (
                    <p key={index} className="mb-3 leading-relaxed last:mb-0">
                        {renderInlineMarkdown(block, concepts)}
                    </p>
                );
            })}
        </>
    );
};

// Blokk-vis scroll-inn-animasjon (samme mønster som FactBox). Bilder får kun
// opacity - y-forskyvning på bilder føles som layout-hopp. once: true gjør at
// blokken aldri animeres om igjen, viktig for ro ved scrolling opp/ned.
const RevealBlock: React.FC<{ imageOnly?: boolean; children: React.ReactNode }> = ({
    imageOnly = false,
    children,
}) => {
    const reduceMotion = useReducedMotion();
    if (reduceMotion) return <>{children}</>;
    return (
        <motion.div
            initial={imageOnly ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={imageOnly ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        >
            {children}
        </motion.div>
    );
};

// Sluttsonen «Jobb med stoffet»: den sammenhengende halen av etterarbeid-blokker
// (Oppgaver, Quiz, Kildeliste) får en felles seksjonsskillelinje, slik at
// overgangen fra brødtekst til etterarbeid blir tydelig i stedet for at kortene
// flyter rett ut av artikkelen.
const ETTERARBEID_NAVN = new Set(['Oppgaver', 'Quiz', 'Kildeliste']);
const isEtterarbeidBlock = (block: ContentBlock): boolean => {
    const b = block as { type?: string; name?: string; component?: string };
    const type = b.type || b.name;
    if (type === 'quiz') return true;
    const name = type === 'component' ? b.name || b.component : type;
    return name !== undefined && ETTERARBEID_NAVN.has(name);
};

interface ArticleContentProps {
    content: ContentBlock[];
    concepts?: Concept[];
    activeBlockIndex?: number;
    onBlockClick?: (index: number) => void;
    isTool?: boolean;
    audioControls?: {
        isPlaying: boolean;
        isPaused: boolean;
        onToggle: () => void;
        onStop: () => void;
    };
}

export const ArticleContent: React.FC<ArticleContentProps> = React.memo(({ content, concepts: explicitConcepts, activeBlockIndex, onBlockClick, isTool = false, audioControls }) => {
    const { entries: globalEntries } = useGlossary();

    // OPTIMIZATION: Memoize concept merging to avoid O(N*M) loop on every render.
    // Use a Set for O(1) lookups instead of .some().
    const mergedConcepts = React.useMemo(() => {
        const baseConcepts = explicitConcepts || [];
        const uniqueTerms = new Set(baseConcepts.map(c => c.term.toLowerCase()));

        const merged = [...baseConcepts];

        // Only loop through global entries once
        for (const entry of globalEntries) {
            const termLower = entry.term.toLowerCase();
            if (!uniqueTerms.has(termLower)) {
                uniqueTerms.add(termLower);
                merged.push(entry as unknown as Concept);
            }
        }

        return merged;
    }, [explicitConcepts, globalEntries]);

    // Vaktsjekken må stå etter alle hooks — React krever lik hook-rekkefølge hver render.
    if (!content || !Array.isArray(content)) return null;

    const displayContent = content;

    // Første indeks i den sammenhengende etterarbeid-halen, eller -1 om den
    // mangler. Billig O(hale)-løkke, trenger ikke memoisering.
    let etterarbeidStart = displayContent.length;
    while (etterarbeidStart > 0 && isEtterarbeidBlock(displayContent[etterarbeidStart - 1])) {
        etterarbeidStart--;
    }
    if (etterarbeidStart === 0 || etterarbeidStart === displayContent.length) {
        etterarbeidStart = -1;
    }

    return (
        <div className={`article-content min-w-0 ${isTool ? 'w-full max-w-none' : 'max-w-5xl mx-auto'}`}>
            {displayContent.map((block, index) => {
                const rendered = ((): React.ReactNode => {
                // ... (rest of the mapping using mergedConcepts instead of concepts)
                // Handle 'type' (standard), 'name' (legacy), and '__typename' (GraphQL)
                const type = resolveBlockType(block);

                // Check for active state if interactive
                const isActive = activeBlockIndex === index;
                const interactiveClass = onBlockClick ? "cursor-pointer transition-all duration-300 hover:bg-slate-50/80 hover:shadow-sm rounded-xl px-4 py-2 -mx-4" : "";
                const activeClass = isActive ? "bg-amber-50/40 relative shadow-sm border border-amber-100/50" : "";

                // Check if the type is a registered component
                const DirectComponent = type ? getComponent(type) : undefined;
                if (DirectComponent && type) {
                    // Prop mapping/aliases for easier JSON authoring
                    const props = normalizeProps({ ...block }, type);

                    return (
                        <div key={index} className="my-4 min-w-0 max-w-full" data-interactive-component>
                            <React.Suspense fallback={<div className="h-20 w-full animate-pulse bg-slate-50 rounded-xl" />}>
                                <DirectComponent {...props} />
                            </React.Suspense>
                        </div>
                    );
                }

                // Ukjent blokk-type: fall tilbake til å vise `content` som tekst.
                // Dette skjer før innsnevringen under, slik at switchen bare
                // trenger å håndtere typer vi faktisk kjenner.
                if (!isKnownBlockType(type)) {
                    const fallback = (block as RawContentBlock).content;
                    if (typeof fallback === 'string' && fallback) {
                        return (
                            <div key={index} className="mb-4 text-slate-700">
                                {renderWithMarkdown(fallback, mergedConcepts)}
                            </div>
                        );
                    }
                    return null;
                }

                // Den ene bevisste innsnevringen i denne fila. Typen er avgjort
                // over — inkludert legacy-feltene — og hver gren under leser
                // bare feltene som hører til sin egen variant.
                const b = (block.type === type ? block : { ...block, type }) as ContentBlock;

                switch (b.type) {
                    case 'paragraph':
                    case 'text':
                        return (
                            <div
                                key={index}
                                className={`mb-4 text-lg text-slate-700 leading-relaxed group ${interactiveClass} ${activeClass}`}
                                onClick={() => onBlockClick?.(index)}
                            >
                                {b.title && (
                                    <h3 className="text-2xl font-bold text-slate-800 mb-4 block">
                                        {b.title}
                                    </h3>
                                )}
                                {isActive && (
                                    <div className="absolute -left-14 top-1 hidden md:flex flex-col items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <Volume2 className="w-5 h-5 text-amber-600" />
                                        </motion.div>
                                        {audioControls && (
                                            <>
                                                <button
                                                    onClick={audioControls.onToggle}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                                                    title={audioControls.isPaused ? 'Fortsett' : 'Pause'}
                                                >
                                                    {audioControls.isPaused
                                                        ? <Play className="w-3.5 h-3.5 ml-0.5" />
                                                        : <Pause className="w-3.5 h-3.5" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={audioControls.onStop}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                                                    title="Stopp"
                                                >
                                                    <Square className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                                {renderWithMarkdown(b.content || b.text || b.value, mergedConcepts)}
                            </div>
                        );



                    case 'poem':
                        return (
                            <div key={index} className="my-10 max-w-lg mx-auto">
                                <div className="bg-[#fcfbf7] border border-[#e8e6dc] p-8 rounded-sm shadow-sm relative overflow-hidden">
                                    {/* Decorative top border */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />

                                    {b.title && (
                                        <h4 className="font-serif italic text-lg text-slate-500 text-center mb-6">
                                            {b.title}
                                        </h4>
                                    )}

                                    <div className="font-serif text-lg leading-loose text-slate-800 text-center whitespace-pre-line">
                                        {b.content}
                                    </div>

                                    {b.author && (
                                        <div className="mt-6 text-center text-sm font-sans font-bold text-slate-400 uppercase tracking-widest">
                                            — {b.author}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );

                    case 'header':
                        return (
                            <h2 key={index} className="text-2xl font-bold text-slate-900 mb-4 mt-8 tracking-tight">
                                {b.content || b.text || b.value}
                            </h2>
                        );

                    case 'subheader':
                        return (
                            <h3 key={index} className="text-xl font-bold text-slate-900 mb-3 mt-6 tracking-tight">
                                {b.content || b.text || b.value}
                            </h3>
                        );

                    case 'comparison':
                        return (
                            <div key={index} className="my-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 'Before' / Negative Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <span className="font-bold text-slate-700 uppercase tracking-wide text-sm">
                                            {b.before?.label || 'Før'}
                                        </span>
                                    </div>
                                    <div className="p-6 text-slate-600 italic leading-relaxed bg-slate-50/30">
                                        {renderInlineMarkdown(b.before?.content || '', mergedConcepts)}
                                    </div>
                                </div>

                                {/* 'After' / Positive Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden group hover:shadow-md transition-shadow relative">
                                    <div className="bg-green-50 border-b border-green-100 p-4 flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="font-bold text-green-800 uppercase tracking-wide text-sm">
                                            {b.after?.label || 'Etter'}
                                        </span>
                                    </div>
                                    <div className="p-6 text-slate-800 font-medium leading-relaxed bg-green-50/10">
                                        {renderInlineMarkdown(b.after?.content || '', mergedConcepts)}
                                    </div>
                                </div>
                            </div>
                        );

                    case 'section':
                        return (
                            <div key={index} className="my-12">
                                {b.title && (
                                    <h2 className="text-3xl font-display font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">{b.title}</h2>
                                )}
                                {b.content && <ArticleContent content={b.content} concepts={mergedConcepts} />}
                            </div>
                        );

                    case 'list': {
                        const ListTag = b.ordered ? 'ol' : 'ul';

                        // Check if this is a "Definition List" (items start with **Bold**:)
                        const isDefinitionList = b.items?.every((item: string) =>
                            item.trim().startsWith('**') && item.includes('**:')
                        );

                        if (isDefinitionList) {
                            return (
                                <div key={index} className="my-10 space-y-6">
                                    {b.items?.map((item: string, i: number) => {
                                        // Parse "**Title**: Content"
                                        const match = item.match(/^\*\*(.*?)\*\*:\s*(.*)/);
                                        if (!match) return null;

                                        const [, title, content] = match;

                                        return (
                                            <div key={i} className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-indigo-100 transition-colors">
                                                <div className="font-bold text-indigo-900 text-lg mb-2">{title}</div>
                                                <div className="text-slate-700 leading-relaxed">
                                                    {renderInlineMarkdown(content, mergedConcepts)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        }

                        const listStyle = b.ordered ? "list-decimal" : "list-disc";

                        return (
                            <ListTag key={index} className={`${listStyle} list-outside ml-6 space-y-3 mb-8 text-slate-700`}>
                                {b.items?.map((item: string, i: number) => (
                                    <li key={i} className="leading-relaxed pl-2">
                                        {renderInlineMarkdown(item, mergedConcepts)}
                                    </li>
                                ))}
                            </ListTag>
                        );
                    }

                    case 'image': {
                        const imgStyle = b.width ? { width: b.width } : {};
                        // Use inline style to override w-full if width is provided.
                        // We keep w-full as base class for responsiveness if no width is set,
                        // but inline width will take precedence.

                        return (
                            <figure key={index} className={`my-8 ${b.width ? 'flex flex-col items-center' : ''}`}>
                                <img
                                    src={b.src}
                                    alt={b.alt || ''}
                                    loading="lazy"
                                    className="w-full rounded-xl shadow-lg"
                                    // 'auto 16 / 9' reserverer 16:9-plass FØR lasting (unngår
                                    // layout-hopp); etter lasting gjelder bildets egne proporsjoner.
                                    style={{ aspectRatio: 'auto 16 / 9', ...imgStyle }}
                                />
                                {b.caption && (
                                    <figcaption className="mt-2 text-center text-sm text-gray-400 italic">
                                        {b.caption}
                                    </figcaption>
                                )}
                            </figure>
                        );
                    }

                    case 'component': {
                        // `name` er hovedfeltet, `component` er et eldre alias.
                        const ComponentName = b.name || b.component || '';
                        const RegisteredComponent = getComponent(ComponentName);

                        if (!RegisteredComponent) {
                            return (
                                <div key={index} className="p-4 border border-red-500 rounded text-red-500 my-4">
                                    Unknown component: {ComponentName}
                                </div>
                            );
                        }

                        return (
                            <div key={index} className="min-w-0 max-w-full" data-interactive-component>
                                <React.Suspense fallback={<div className="h-40 w-full animate-pulse bg-slate-100 rounded-xl my-4 flex items-center justify-center text-slate-400">Laster modul...</div>}>
                                    <RegisteredComponent {...normalizeProps({ ...(b.props || {}) }, ComponentName)} />
                                </React.Suspense>
                            </div>
                        );
                    }

                    case 'task': {
                        const taskContent = b.content || b.text;
                        return (
                            <div key={index} className="my-12 relative">
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm z-10 transform -rotate-12">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div className="bg-gradient-to-br from-amber-50/50 to-white border-2 border-amber-100 rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <CheckCircle2 size={120} />
                                    </div>
                                    <div className="relative">
                                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            {b.title || 'Oppgave'}
                                        </h3>
                                        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-lg">
                                            {renderWithMarkdown(taskContent, mergedConcepts)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    case 'quiz': {
                        const QuizComp = getComponent('Quiz');
                        if (!QuizComp) return null;
                        return (
                            <div key={index} className="my-12">
                                <QuizComp
                                    questions={b.questions || []}
                                />
                            </div>
                        );
                    }

                    case 'quote':
                        return (
                            <blockquote key={index} className="my-12 pl-6 border-l-2 border-slate-900">
                                <p className="font-serif text-2xl text-slate-800 leading-relaxed">
                                    "{renderInlineMarkdown(b.content, mergedConcepts)}"
                                </p>
                                {(b.author || b.source) && (
                                    <footer className="mt-6 text-sm not-italic flex flex-col font-medium tracking-wide">
                                        {b.author && <cite className="not-italic text-slate-900 font-bold uppercase text-xs mb-1">— {b.author}</cite>}
                                        {b.source && <span className="text-slate-500">{b.source}</span>}
                                    </footer>
                                )}
                            </blockquote>
                        );

                    case 'link': {
                        const isExternal = b.url?.startsWith('http');
                        const className = "flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors my-2 w-fit";

                        if (isExternal) {
                            return (
                                <a key={index} href={b.url} className={className} target="_blank" rel="noopener noreferrer">
                                    {b.text}
                                </a>
                            );
                        }

                        return (
                            <Link key={index} to={b.url} className={className}>
                                {b.text}
                            </Link>
                        );
                    }

                    case 'video': {
                        // `url` er hovedfeltet, `value` er et eldre alias. Mangler
                        // begge har vi ingenting å vise.
                        const videoUrl = b.url || b.value;
                        if (!videoUrl) return null;
                        const videoTitle = b.title || "YouTube video";
                        // Extract video ID from URL if it's a full link
                        let embedUrl = videoUrl;

                        // YouTube parameters for Norwegian subtitles
                        const ytParams = "cc_load_policy=1&hl=nb&cc_lang_pref=nb";

                        if (videoUrl.includes('youtube.com/watch?v=')) {
                            const videoId = videoUrl.split('v=')[1]?.split('&')[0];
                            embedUrl = `https://www.youtube.com/embed/${videoId}?${ytParams}`;
                        } else if (videoUrl.includes('youtu.be/')) {
                            const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
                            embedUrl = `https://www.youtube.com/embed/${videoId}?${ytParams}`;
                        } else if (embedUrl.includes('youtube.com/embed/')) {
                            // If it's already an embed URL, append params
                            const separator = embedUrl.includes('?') ? '&' : '?';
                            embedUrl = `${embedUrl}${separator}${ytParams}`;
                        }

                        return (
                            <div key={index} className="my-10 aspect-video w-full overflow-hidden rounded-xl shadow-lg border border-slate-200">
                                <iframe
                                    src={embedUrl}
                                    title={videoTitle}
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        );
                    }

                    case 'expandable':
                        return (
                            <details key={index} className="group my-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm open:shadow-md transition-shadow">
                                <summary className="flex items-center justify-between p-6 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors list-none select-none">
                                    <h3 className="text-xl font-bold text-slate-800">{b.title}</h3>
                                    <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="p-6 pt-2 text-slate-700 leading-relaxed border-t border-slate-100">
                                    {Array.isArray(b.content) ? (
                                        <ArticleContent content={b.content} concepts={mergedConcepts} />
                                    ) : (
                                        renderWithMarkdown(b.content, mergedConcepts)
                                    )}
                                </div>
                            </details>
                        );

                    case 'info':
                    case 'info_box':
                        return (
                            <div key={index} className="my-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm group hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1 group-hover:text-slate-600 transition-colors" />
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wide">{b.title}</h3>
                                        <div className="text-slate-600 leading-relaxed">
                                            {renderWithMarkdown(b.content || b.text, mergedConcepts)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );

                    case 'comparison_card':
                        return (
                            <div key={index} className="my-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {b.items?.map((item: { title: string; content: string; color: string }, i: number) => {
                                        // Map string color names to tailwind classes
                                        const colorMap: Record<string, string> = {
                                            blue: 'bg-blue-50 border-blue-100 text-blue-900',
                                            purple: 'bg-purple-50 border-purple-100 text-purple-900',
                                            orange: 'bg-orange-50 border-orange-100 text-orange-900',
                                            green: 'bg-green-50 border-green-100 text-green-900',
                                            red: 'bg-red-50 border-red-100 text-red-900',
                                        };
                                        const colorClass = colorMap[item.color] || 'bg-slate-50 border-slate-100 text-slate-900';

                                        return (
                                            <div key={i} className={`p-6 rounded-xl border ${colorClass} shadow-sm`}>
                                                <h4 className="text-lg font-bold mb-3">{item.title}</h4>
                                                <p className="text-sm leading-relaxed opacity-90">{item.content}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );

                    default:
                        // Ukjente blokk-typer er allerede håndtert før switchen.
                        // Kommer vi hit har vi lagt til en variant i ContentBlock
                        // uten å gi den en gren — TypeScript fanger det her.
                        return null;
                }
                })();

                if (!rendered) return null;

                const blockKind = block as { type?: string; name?: string };
                const isImageBlock = (blockKind.type || blockKind.name) === 'image';
                return (
                    <React.Fragment key={index}>
                        {index === etterarbeidStart && (
                            <div className="mt-16 mb-2 flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-300" />
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    <PenLine size={14} />
                                    Jobb med stoffet
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-300" />
                            </div>
                        )}
                        <RevealBlock imageOnly={isImageBlock}>
                            {rendered}
                        </RevealBlock>
                    </React.Fragment>
                );
            })}
        </div >
    );
});
