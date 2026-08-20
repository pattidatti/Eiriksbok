import React, { useState } from 'react';
import { Link, useLocation, useOutlet } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { ProgressBoot } from '../features/progress/ProgressBoot';
import { ProgressChip } from '../features/progress/components/ProgressChip';
import { ProgressToaster } from '../features/progress/components/ProgressToaster';
import { CelebrationOverlay } from '../features/progress/components/CelebrationOverlay';

/* Toppmenyen. `short` brukes på mellomstore skjermer (nettbrett, Chromebook i
   delt vindu, Galaxy Fold utbrettet ~950px) der de fulle navnene ikke får plass.
   Fra xl (1280px) vises full tekst. */
const navLinks = [
    { to: '/norsk', label: 'Norsk', short: 'Norsk', prefetch: 'SubjectPage' },
    { to: '/samfunnskunnskap', label: 'Samfunnskunnskap', short: 'Samfunn', prefetch: 'SubjectPage' },
    { to: '/historie', label: 'Historie', short: 'Historie', prefetch: 'SubjectPage' },
    { to: '/krle', label: 'KRLE', short: 'KRLE', prefetch: 'SubjectPage' },
    { to: '/musikk', label: 'Musikk', short: 'Musikk', prefetch: 'SubjectPage' },
    { to: '/laeringsstier', label: 'Læringsstier', short: 'Stier', prefetch: 'Unknown' },
    { to: '/oving', label: 'Øving', short: 'Øving', prefetch: 'PracticePage' },
];

export const Layout: React.FC = () => {
    const location = useLocation();
    const outlet = useOutlet();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { settings, toggleDyslexicMode } = useSettings();
    const { isFullWidth, hideHeader: contextHideHeader } = useLayout();

    // Første maling skal ikke fade inn: en opacity-animasjon på det første
    // innholdet utsetter LCP med hele animasjonens lengde. React Router gir den
    // første oppføringen i historikken nøkkelen 'default'; alt eleven navigerer
    // til etterpå får en generert nøkkel - og animeres.
    const isInitialLoad = location.key === 'default';

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
        // overflow-x-clip, ikke overflow-hidden: «hidden» gjør elementet til en
        // scroll-container, og da slutter position: sticky å virke for alt
        // under - inkludert hele RichSidebar (innholdsfortegnelse, tidslinje,
        // nøkkelpunkter), som fulgte scrollen bort etter første skjerm. «clip»
        // klipper det som stikker ut sidelengs uten å lage en scroll-container.
        // Gløden under klippes uansett av sin egen fixed inset-0-boks.
        <div className="min-h-screen bg-bg-main text-text-main font-sans relative overflow-x-clip">
            {/* Ambient Background Glow.
                Statisk, ikke pulserende: to lag på 60%x60% med blur-[120px] som
                animerer må komposittes på nytt hvert bilde, hele tiden, på hver
                eneste rute. Gjennom 120 piksler uskarphet er selve pulsen så
                vidt synlig - men den kostet GPU-budsjett også bak 3D-spillene og
                atlaset. Der (fullbredde-rutene) tegnes gløden ikke i det hele
                tatt, siden innholdet dekker den uansett. */}
            {!forceFullWidth && (
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-400/20 rounded-full blur-[120px]"></div>
                </div>
            )}

            {/* Navbar */}
            {!hideHeader && (
                <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* Feedback Widget - Top Left */}
                            <FeedbackWidget />

                            {/* Mobile Menu Trigger */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="pressable focus-ring md:hidden p-2 text-text-muted hover:text-text-main transition-colors"
                                aria-label="Åpne meny"
                            >
                                <Menu size={28} />
                            </button>

                            <Link to="/" className="flex items-center gap-2 sm:gap-3 text-xl font-display font-bold text-text-main no-underline tracking-tight group">

                                <img src="/logo.webp" alt="Logo" className="w-8 h-8 object-contain transition-transform group-hover:scale-110" />
                                {/* Merkenavnet står bare der det faktisk er plass: på telefon (< sm)
                                    ville det sprengt topbaren (Fold lukket ~344px), og mellom md og xl
                                    trenger menylenkene plassen (Fold utbrettet ~950px). */}
                                <span className="hidden sm:inline md:hidden xl:inline">BOK.HAALAND.DE</span>
                            </Link>
                        </div>

                        <nav className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-8 min-w-0">
                            {navLinks.map((link) => (
                                <PrefetchLink
                                    key={link.to}
                                    to={link.to}
                                    prefetchTarget={link.prefetch}
                                    className={`text-sm whitespace-nowrap transition-colors ${isActive(link.to)}`}
                                >
                                    <span className="xl:hidden">{link.short}</span>
                                    <span className="hidden xl:inline">{link.label}</span>
                                </PrefetchLink>
                            ))}
                        </nav>

                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <ProgressChip />
                            <button
                                onClick={toggleDyslexicMode}
                                className={`pressable focus-ring p-2 transition-colors rounded-full hover:bg-black/5 ${settings.dyslexicMode ? 'text-blue-600 bg-blue-50' : 'text-text-muted hover:text-text-main'}`}
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
                                className="pressable focus-ring group relative p-2 text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-black/5 flex items-center gap-2"
                                aria-label="Søk (Ctrl+K)"
                            >
                                <Search size={20} className="w-5 h-5" />
                                <span className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 ml-1 text-[10px] font-medium text-slate-400 border border-slate-200 rounded bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                    {/* Sideovergang: ren opacity, ingen AnimatePresence.
                        Den gamle varianten manglet mode="wait", så inn- og
                        ut-siden var montert samtidig og overlappet hverandre -
                        og 20px-forskyvningen ga et synlig hopp. Nå byttes siden
                        umiddelbart ut og tones inn på 150 ms: ingen overlapp,
                        ingen layout-forskyvning, halve ventetiden. */}
                    <motion.div
                        key={location.pathname}
                        initial={isInitialLoad ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        {outlet}
                    </motion.div>
                </div>
            </main>

            <ScrollToTop />
            <ProgressBoot />
            <ProgressToaster />
            <CelebrationOverlay />
        </div>
    );
};