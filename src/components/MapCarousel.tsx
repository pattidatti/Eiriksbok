import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { Image } from './Image';
import { isPendingImage } from '../utils/imageAvailability';

interface MapItem {
    image: string;
    caption?: string;
    alt?: string;
}

interface MapCarouselProps {
    title?: string;
    items: MapItem[];
}

export const MapCarousel: React.FC<MapCarouselProps> = ({ title, items: allItems }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Kart som ikke er tegnet ennå skal ikke telle med: de ville gitt karusellen
    // en tom slide og en prikk som fører til ingenting.
    const items = React.useMemo(
        () => (allItems || []).filter((mapItem) => !isPendingImage(mapItem.image)),
        [allItems]
    );

    if (items.length === 0) return null;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    return (
        <div className="my-6 w-full max-w-4xl mx-auto px-2">
            {title && (
                <motion.h3
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-xl font-bold text-slate-900 mb-6 tracking-tight text-center relative inline-block left-1/2 -translate-x-1/2"
                >
                    {title}
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-amber-500 rounded-full" />
                </motion.h3>
            )}

            <div className="relative group overflow-hidden rounded-xl shadow-xl border border-slate-200 bg-slate-100/50 backdrop-blur-sm min-h-[300px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full relative cursor-zoom-in flex items-center justify-center"
                        onClick={() => setIsLightboxOpen(true)}
                    >
                        <Image
                            src={items[currentIndex].image}
                            alt={items[currentIndex].alt || items[currentIndex].caption || 'Historisk kart'}
                            className="max-w-full max-h-[600px] object-contain"
                            priority={true}
                        />

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-8">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentIndex}
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-white text-xs font-medium text-center drop-shadow-md"
                                >
                                    {items[currentIndex].caption}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md rounded-full p-1.5 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={14} />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {items.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg text-slate-800 hover:bg-white hover:scale-110 active:scale-95 transition-all z-10 opacity-0 group-hover:opacity-100 hidden sm:block"
                            aria-label="Previous map"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg text-slate-800 hover:bg-white hover:scale-110 active:scale-95 transition-all z-10 opacity-0 group-hover:opacity-100 hidden sm:block"
                            aria-label="Next map"
                        >
                            <ChevronRight size={20} />
                        </button>

                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {items.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-amber-500 w-4' : 'bg-white/50 hover:bg-white'
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Mobile Navigation fallback */}
            {items.length > 1 && (
                <div className="flex justify-between items-center mt-2 sm:hidden px-2">
                    <button onClick={prevSlide} className="p-2 text-slate-600"><ChevronLeft size={20} /></button>
                    <span className="text-[10px] font-mono text-slate-400">{currentIndex + 1} / {items.length}</span>
                    <button onClick={nextSlide} className="p-2 text-slate-600"><ChevronRight size={20} /></button>
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100000] bg-black flex flex-col items-center justify-between cursor-zoom-out p-4 sm:p-8"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        {/* Header Area */}
                        <div className="w-full flex justify-end shrink-0">
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-3 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all shadow-xl pointer-events-auto"
                                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                            >
                                <X size={28} />
                            </motion.button>
                        </div>

                        {/* Main Stage: The Map */}
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            className="flex-1 w-full flex items-center justify-center min-h-0 relative overflow-hidden my-4"
                        >
                            {/* Explicitly constrained container */}
                            <div className="w-full h-full p-2 flex items-center justify-center">
                                <Image
                                    src={items[currentIndex].image}
                                    alt={items[currentIndex].alt || items[currentIndex].caption || 'Fullskjerms kart'}
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                    priority={true}
                                />
                            </div>
                        </motion.div>

                        {/* Caption Area */}
                        {items[currentIndex].caption && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full shrink-0 flex justify-center pb-2 sm:pb-4"
                            >
                                <p className="text-white/80 text-sm sm:text-base md:text-lg text-center max-w-4xl font-light leading-relaxed drop-shadow-md">
                                    {items[currentIndex].caption}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
