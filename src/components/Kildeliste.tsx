import React, { useState } from 'react';
import { ChevronDown, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderInlineMarkdown } from './markdownUtils';

interface KildelisteProps {
    title?: string;
    sources: string[];
}

// Diskré fotnote-stil: kildene er metadata, ikke innhold, og skal ikke
// konkurrere visuelt med Oppgaver- og Quiz-kortene i sluttsonen.
export const Kildeliste: React.FC<KildelisteProps> = ({ title = 'Kilder', sources }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!sources || sources.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-8"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="focus-ring group flex items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
                aria-expanded={isOpen}
            >
                <BookMarked size={15} />
                <span>
                    {title} ({sources.length})
                </span>
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        animate={{
                            height: 'auto',
                            opacity: 1,
                            transitionEnd: { overflow: 'visible' },
                        }}
                        exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <ol className="mt-3 space-y-2 pl-1 text-sm leading-relaxed text-slate-500">
                            {sources.map((source, index) => (
                                <li key={index} className="pl-4 -indent-4">
                                    {renderInlineMarkdown(source)}
                                </li>
                            ))}
                        </ol>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
