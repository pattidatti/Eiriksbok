import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { transitions } from '../styles/motion-presets';
import { useAudioBarStore } from '../stores/useAudioBarStore';

export const ScrollToTop: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    // Opplesnings-linja legger seg nederst på mobil - flytt knappen opp så de ikke overlapper.
    const audioBarVisible = useAudioBarStore((s) => s.isVisible);

    useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.pageYOffset > 300);
        };
        window.addEventListener('scroll', toggleVisibility, { passive: true });
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, y: 24, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.8 }}
                    transition={transitions.springBouncy}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    aria-label="Til toppen"
                    className={`focus-ring fixed right-8 z-[100] w-12 h-12 rounded-full bg-white/80 backdrop-blur-md border border-black/10 text-slate-700 hover:text-slate-900 hover:bg-white shadow-lg flex items-center justify-center cursor-pointer transition-[bottom] duration-300 ${audioBarVisible ? 'bottom-28 lg:bottom-8' : 'bottom-8'}`}
                >
                    <ChevronUp className="w-6 h-6" />
                </motion.button>
            )}
        </AnimatePresence>
    );
};
