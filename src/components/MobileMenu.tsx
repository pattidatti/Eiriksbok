import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X, BookOpen, GraduationCap, History, Globe, Music, Dumbbell, Map } from 'lucide-react';
import { PrefetchLink } from './PrefetchLink';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuVariants: Variants = {
    closed: {
        x: "100%",
        opacity: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    open: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    closed: { x: 50, opacity: 0 },
    open: { x: 0, opacity: 1 }
};

interface MenuItem {
    label: string;
    path: string;
    icon: any;
    prefetchTarget?: string;
}

const menuItems: MenuItem[] = [
    { label: 'Norsk', path: '/norsk', icon: BookOpen, prefetchTarget: 'SubjectPage' },
    { label: 'Samfunnsfag', path: '/samfunnskunnskap', icon: Globe, prefetchTarget: 'SubjectPage' },
    { label: 'Historie', path: '/historie', icon: History, prefetchTarget: 'SubjectPage' },
    { label: 'KRLE', path: '/krle', icon: GraduationCap, prefetchTarget: 'SubjectPage' },
    { label: 'Musikk', path: '/musikk', icon: Music, prefetchTarget: 'SubjectPage' },
    { label: 'Læringsstier', path: '/laeringsstier', icon: Map, prefetchTarget: 'LearningPathsHub' },
    { label: 'Øving', path: '/oving', icon: Dumbbell, prefetchTarget: 'PracticePage' },
];

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    // Prevent scrolling when menu is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                    />

                    {/* Menu Sheet */}
                    <motion.div
                        variants={menuVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-white/95 backdrop-blur-xl border-l border-slate-200 z-50 md:hidden shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <span className="text-xl font-display font-bold text-slate-900 tracking-widest">MENY</span>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                                aria-label="Lukk meny"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        {/* Links */}
                        <div className="flex-1 overflow-y-auto py-8 px-6 flex flex-col gap-6">
                            {menuItems.map((item) => (
                                <motion.div key={item.path} variants={itemVariants}>
                                    <PrefetchLink
                                        to={item.path}
                                        prefetchTarget={item.prefetchTarget}
                                        onClick={onClose}
                                        className="group flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all active:scale-95 border border-transparent hover:border-slate-100"
                                    >
                                        <div className="p-3 bg-indigo-50 text-indigo-600 group-hover:text-indigo-700 group-hover:bg-indigo-100 rounded-lg transition-colors">
                                            <item.icon size={24} />
                                        </div>
                                        <span className="text-xl font-medium text-slate-700 group-hover:text-slate-900">
                                            {item.label}
                                        </span>
                                    </PrefetchLink>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer / Meta */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <p className="text-center text-sm text-slate-400">
                                © Eiriksbok 2026
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
