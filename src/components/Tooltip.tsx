import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    type?: 'concept' | 'person';
    link?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, type = 'concept', link }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const Icon = type === 'person' ? User : Book;

    // Simplified trigger style: no bold, subtle underline
    const triggerStyles = `
        inline-block
        transition-all
        duration-300
        cursor-help
        border-b
        border-slate-300
        hover:border-slate-500
        decoration-dotted
    `.trim();

    // Calculate position
    useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            // Default: Centered above
            const top = rect.top + scrollY - 10; // 10px gap
            const left = rect.left + scrollX + rect.width / 2;

            setCoords({ top, left });
        }
    }, [isOpen]);

    // Close on scroll/resize
    React.useEffect(() => {
        const handleScroll = () => setIsOpen(false);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        if (isTouch) return;
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        if (isTouch) return;
        closeTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 150);
    };

    const handleClick = () => {
        if (!isTouch) {
            setIsTouch(true);
            setIsOpen(true);
        } else {
            setIsOpen(!isOpen);
        }
    };

    const tooltipContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.9 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: 0, scale: 0.9 }}
                    transition={{
                        y: { type: "spring", stiffness: 600, damping: 35 },
                        scale: { type: "spring", stiffness: 600, damping: 35 },
                        opacity: { duration: 0.1, ease: "easeOut" }
                    }}
                    style={{
                        position: 'absolute',
                        top: coords.top,
                        left: coords.left,
                        transform: 'translate(-50%, -100%)', // Centered above
                        zIndex: 9999, // Above everything
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="w-72 pointer-events-auto"
                >
                    <div className="bg-white/80 backdrop-blur-xl text-slate-800 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 ring-1 ring-white/50 relative overflow-hidden">
                        {/* Decorative gradient top bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${type === 'person' ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`} />

                        <div className="flex items-start gap-3">
                            <div className={`mt-1 p-1.5 rounded-lg ${type === 'person' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                <Icon size={16} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm leading-relaxed font-medium text-slate-700">
                                    {text}
                                </p>

                                {link && (
                                    <Link
                                        to={link}
                                        className={`inline-flex items-center gap-1 mt-3 text-xs font-bold uppercase tracking-wider ${type === 'person' ? 'text-orange-600' : 'text-indigo-600'} hover:underline pointer-events-auto`}
                                    >
                                        Les mer <ArrowRight size={12} />
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                            <svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 8L0 0H16L8 8Z" className="fill-white/80 backdrop-blur-xl" />
                            </svg>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <span
                ref={triggerRef}
                className={triggerStyles}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                {children}
            </span>
            {createPortal(tooltipContent, document.body)}
        </>
    );
};
