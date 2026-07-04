import React, { useState } from 'react';
import { Link, useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PrefetchLink } from './PrefetchLink';
import { SearchOverlay } from './SearchOverlay';
import { Breadcrumbs } from './Breadcrumbs';
import { ScrollToTop } from './ScrollToTop';
import { MobileMenu } from './MobileMenu';
import { useSettings } from '../hooks/useSettings';
import { useLayout } from '../context/LayoutContext';
import { Menu, Search } from 'lucide-react';
import { useSearchHotkeys } from '../hooks/useSearchHotkeys';
import { FeedbackWidget } from './FeedbackWidget'; // Added import

export const Layout: React.FC = () => {
    const location = useLocation();
    const outlet = useOutlet();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { settings, toggleDyslexicMode } = useSettings();
    const { isFullWidth, hideHeader: contextHideHeader } = useLayout();

    // Add hotkey listener
    useSearchHotkeys(() => setIsSearchOpen(true));

    // Hard override for presentation and simulation modes
    const path = location.pathname.toLowerCase();
    const isPresentationMode = path.includes('/present');
    const isSimulationMode = path.includes('/sim/play/');
    const hideHeader = contextHideHeader || isPresentationMode || isSimulationMode;
    const forceFullWidth = isFullWidth || isPresentationMode || isSimulationMode;

    const isActive = (path: string) => {
        return location.pathname.startsWith(path) ? 'text-text-main font-semibold' : 'text-text-muted hover:text-text-main';
    };

    return (
        <div className="min-h-screen bg-bg-main text-text-main font-sans relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
            </div>

            {/* Navbar */}
            {!hideHeader && (
                <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Feedback Widget - Top Left */}
                            <FeedbackWidget />

                            {/* Mobile Menu Trigger */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2 text-text-muted hover:text-text-main transition-colors"
                                aria-label="Åpne meny"
                            >
                                <Menu size={28} />
                            </button>

                            <Link to="/" className="flex items-center gap-3 text-xl font-display font-bold text-text-main no-underline tracking-tight group">

                                <img src="/logo.webp" alt="Logo" className="w-8 h-8 object-contain transition-transform group-hover:scale-110" />
                                <span className="hidden sm:inline">BOK.HAALAND.DE</span>
                                <span className="sm:hidden">EIRIKSBOK</span>
                            </Link>
                        </div>

                        <nav className="hidden md:flex items-center space-x-8">
                            <PrefetchLink to="/norsk" prefetchTarget="SubjectPage" className={`text-sm transition-colors ${isActive('/norsk')}`}>Norsk</PrefetchLink>
                            <PrefetchLink to="/samfunnskunnskap" prefetchTarget="SubjectPage" className={`text-sm transition-colors ${isActive('/samfunnskunnskap')}`}>Samfunnskunnskap</PrefetchLink>
                            <PrefetchLink to="/historie" prefetchTarget="SubjectPage" className={`text-sm transition-colors ${isActive('/historie')}`}>Historie</PrefetchLink>
                            <PrefetchLink to="/krle" prefetchTarget="SubjectPage" className={`text-sm transition-colors ${isActive('/krle')}`}>KRLE</PrefetchLink>
                            <PrefetchLink to="/musikk" prefetchTarget="SubjectPage" className={`text-sm transition-colors ${isActive('/musikk')}`}>Musikk</PrefetchLink>
                            <PrefetchLink to="/laeringsstier" prefetchTarget="Unknown" className={`text-sm transition-colors ${isActive('/laeringsstier')}`}>Læringsstier</PrefetchLink>
                            <PrefetchLink to="/oving" prefetchTarget="PracticePage" className={`text-sm transition-colors ${isActive('/oving')}`}>Øving</PrefetchLink>
                        </nav>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleDyslexicMode}
                                className={`p-2 transition-colors rounded-full hover:bg-black/5 ${settings.dyslexicMode ? 'text-blue-600 bg-blue-50' : 'text-text-muted hover:text-text-main'}`}
                                aria-label="Dysleksivennlig modus"
                                title="Dysleksivennlig modus"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="group relative p-2 text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-black/5 flex items-center gap-2"
                                aria-label="Søk (Ctrl+K)"
                            >
                                <Search size={20} className="w-5 h-5" />
                                <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 ml-1 text-[10px] font-medium text-slate-400 border border-slate-200 rounded bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <span className="text-xs">Ctrl</span> K
                                </span>
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <main className={`relative z-10 ${forceFullWidth ? '' : 'pt-4'}`}>
                <div className={forceFullWidth ? '' : 'max-w-7xl mx-auto px-6'}>
                    {!hideHeader && !forceFullWidth && <Breadcrumbs />}
                    <AnimatePresence>
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            {outlet}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <ScrollToTop />
        </div>
    );
};