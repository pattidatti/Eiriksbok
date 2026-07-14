import React, { useState } from 'react';
import { ChevronDown, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderInlineMarkdown } from './markdownUtils';

interface KildelisteProps {
    title?: string;
    sources: string[];
}

export const Kildeliste: React.FC<KildelisteProps> = ({ title = 'Kilder', sources }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!sources || sources.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="my-8 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm transition-colors duration-300"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-5 flex items-center justify-between text-left group bg-slate-100/40 hover:bg-slate-100/80 transition-all duration-300 ${isOpen ? 'rounded-t-2xl' : 'rounded-2xl'}`}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200/60 rounded-lg text-slate-600 group-hover:scale-110 transition-transform duration-300">
                        <BookMarked size={20} />
                    </div>
                    <span className="text-slate-800 font-display font-bold text-lg tracking-wide">
                        {title} ({sources.length})
                    </span>
                </div>
                <div className={`p-1 rounded-full text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-200' : 'group-hover:translate-y-0.5'}`}>
                    <ChevronDown size={20} />
                </div>
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
                        <ol className="p-6 pt-2 text-slate-600 text-sm leading-relaxed space-y-3 border-t border-slate-200/70 rounded-b-2xl">
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
