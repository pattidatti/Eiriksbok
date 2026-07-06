import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, Check } from 'lucide-react';
import type { LearningPathTask } from '../../types';

interface CopyTasksButtonProps {
    tasks: (string | LearningPathTask)[];
    /** Læringssti-steg: gir nummerering som "3.1, 3.2". Utelates for flat "1. 2. 3."-liste. */
    stepNumber?: number;
}

export const CopyTasksButton: React.FC<CopyTasksButtonProps> = ({ tasks, stepNumber }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        const formattedTasks = tasks
            .map((t, i) => {
                const prefix = stepNumber != null ? `${stepNumber}.${i + 1}` : `${i + 1}.`;
                return `${prefix} ${typeof t === 'string' ? t : t.text}`;
            })
            .join('\n');
        try {
            await navigator.clipboard.writeText(formattedTasks);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy tasks:', err);
        }
    };

    return (
        <motion.button
            onClick={handleCopy}
            className="flex items-center gap-2 group relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Kopier oppgaver til utklippstavlen"
        >
            <div
                className={`p-1.5 rounded-md transition-colors ${
                    copied
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'
                }`}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                        <motion.div
                            key="check"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Check className="w-4 h-4" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="copy"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Clipboard className="w-4 h-4" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {copied && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="text-xs font-bold text-emerald-600 absolute left-full ml-2 whitespace-nowrap"
                    >
                        Kopiert!
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};
