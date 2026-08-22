import React, { type ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { FactBox } from '../FactBox';
import { Comparison } from '../Comparison';
import { TimelineComponent } from '../TimelineComponent';
import { GlossaryText } from '../GlossaryText';
import { ArticleImage } from '../ArticleImage';
import { QuoteBlock } from '../QuoteBlock';
import { GrammarRuleCard } from './interactive/GrammarRuleCard';
import { WritingFix } from '../WritingFix';
import { getComponent } from '../ComponentRegistry';
import type { TopicContentBlock } from '../../types';

/**
 * Props fra hånd-skrevet JSON på vei inn i en komponent.
 *
 * Blokkene forfattes for hånd, så formen kan ikke vites her - og komponenten
 * validerer sine egne props (samme konvensjon som ComponentRegistry bruker).
 * Overgangen skjer derfor ett sted, her, og hvert kallsted sier hvilken
 * komponent det er props til.
 */
const asProps = <P,>(props: Record<string, unknown> | undefined): P => (props ?? {}) as P;

interface TopicContentRendererProps {
    content: TopicContentBlock[];
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const TopicContentRenderer: React.FC<TopicContentRendererProps> = ({ content }) => {
    if (!content) return null;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {content.map((block, index: number) => {
                switch (block.type) {
                    case 'header': {
                        // ... (header logic)
                        const HeaderTag = `h${Math.min(Math.max(block.level || 2, 1), 6)}`;
                        const headerClasses = {
                            1: "text-4xl font-display font-bold text-slate-800 mt-12 mb-6",
                            2: "text-3xl font-display font-bold text-slate-800 mt-10 mb-4 border-b border-slate-200 pb-2",
                            3: "text-2xl font-display font-bold text-slate-700 mt-8 mb-3",
                            4: "text-xl font-display font-bold text-slate-700 mt-6 mb-2",
                            5: "text-lg font-bold text-slate-700 mt-4 mb-2",
                            6: "text-base font-bold text-slate-700 mt-4 mb-2"
                        };

                        return (
                            <motion.div key={index} variants={item}>
                                {React.createElement(
                                    HeaderTag,
                                    { className: headerClasses[block.level as keyof typeof headerClasses] || headerClasses[2] },
                                    block.text
                                )}
                            </motion.div>
                        );
                    }

                    case 'paragraph':
                        // ... (paragraph logic)
                        return (
                            <motion.div key={index} variants={item}>
                                <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {block.text}
                                </p>
                            </motion.div>
                        );

                    case 'list':
                        // ... (list logic)
                        return (
                            <motion.div key={index} variants={item}>
                                <ul className="space-y-3 my-4">
                                    {block.items?.map((listItem: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-700">
                                            <span className="mt-2 w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                                            <span><GlossaryText content={listItem} /></span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        );

                    case 'image':
                        // ArticleImage returnerer null når bildet ikke finnes ennå, så
                        // hverken ramme eller bildetekst blir stående igjen.
                        return (
                            <ArticleImage
                                key={index}
                                variant="framed"
                                motionVariants={item}
                                src={block.url || block.src}
                                alt={block.alt || block.caption || 'Article image'}
                                caption={block.caption}
                            />
                        );

                    case 'component': {
                        // ... (keep existing component logic)
                        if (block.component === 'FactBox') {
                            const { items, content, ...restProps } = block.props ?? {};
                            const boxContent =
                                (typeof content === 'string' ? content : undefined) ||
                                (Array.isArray(items) ? items.join('\n') : '');
                            return (
                                <motion.div key={index} variants={item} className="my-8">
                                    <FactBox
                                        {...asProps<ComponentProps<typeof FactBox>>({
                                            ...restProps,
                                            content: boxContent,
                                        })}
                                    />
                                </motion.div>
                            );
                        }

                        if (block.component === 'QuoteBlock') {
                            return (
                                <motion.div key={index} variants={item} className="my-8">
                                    <QuoteBlock {...asProps<ComponentProps<typeof QuoteBlock>>(block.props)} />
                                </motion.div>
                            );
                        }

                        if (block.component === 'Comparison') {
                            const { leftItems, rightItems, ...restProps } = block.props ?? {};
                            let comparedItems = block.props?.items;

                            if (!comparedItems && Array.isArray(leftItems) && Array.isArray(rightItems)) {
                                comparedItems = leftItems.map((left: string, i: number) => ({
                                    left,
                                    right: rightItems[i] || ''
                                }));
                            }

                            return (
                                <motion.div key={index} variants={item} className="my-8">
                                    <Comparison
                                        {...asProps<ComponentProps<typeof Comparison>>({
                                            ...restProps,
                                            items: comparedItems,
                                        })}
                                    />
                                </motion.div>
                            );
                        }

                        if (block.component === 'TimelineComponent') {
                            const rawEvents = (block.props?.events ?? []) as {
                                title?: string;
                                year: string | number;
                            }[];
                            const events = rawEvents.map((e) => ({
                                ...e,
                                title: e.title || e.year.toString(),
                                year: e.year.toString()
                            }));

                            return (
                                <motion.div key={index} variants={item} className="my-6">
                                    <TimelineComponent
                                        {...asProps<ComponentProps<typeof TimelineComponent>>({
                                            ...block.props,
                                            events,
                                        })}
                                    />
                                </motion.div>
                            );
                        }

                        if (block.component === 'GrammarRuleCard') {
                            return (
                                <motion.div key={index} variants={item} className="my-8">
                                    <GrammarRuleCard
                                        {...asProps<ComponentProps<typeof GrammarRuleCard>>(block.props)}
                                    />
                                </motion.div>
                            );
                        }

                        if (block.component === 'WritingFix') {
                            return (
                                <motion.div key={index} variants={item} className="my-8">
                                    <WritingFix {...asProps<ComponentProps<typeof WritingFix>>(block.props)} />
                                </motion.div>
                            );
                        }

                        // Dynamic Component Lookup (Refactor)
                        const RegistryComponent = getComponent(block.component || '');
                        if (RegistryComponent) {
                            return (
                                <motion.div key={index} variants={item} className="my-8">
                                    <RegistryComponent {...(block.props ?? {})} />
                                </motion.div>
                            );
                        }
                        return null;
                    }

                    default:
                        return null;
                }
            })}
        </motion.div>
    );
};
