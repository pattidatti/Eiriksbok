import React, { useRef, useState, useEffect } from 'react';
import type { PanInfo } from 'framer-motion';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface PerspectiveSide {
    id: string;
    title: string;
    color: string;
    icon?: string;
    content: string;
    image?: string;
    sourceCredit?: string;
}

interface PerspectivePrismProps {
    title?: string;
    instruction?: string;
    sides: PerspectiveSide[];
}

const SPRING = { type: 'spring', stiffness: 250, damping: 28 } as const;
const GAP = 16;

const SideBody: React.FC<{ side: PerspectiveSide }> = ({ side }) => {
    const paragraphs = side.content.split('\n').filter((p) => p.trim() !== '');

    return (
        <div className="p-5 md:p-6 max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
            {side.image && (
                <div className="mb-4 rounded-lg overflow-hidden aspect-video w-full border border-slate-200">
                    <img src={side.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
            )}

            <div className="text-[15px] leading-relaxed text-slate-700">
                {paragraphs.map((p, i) => {
                    if (p.startsWith('**') && p.endsWith('**')) {
                        return (
                            <p
                                key={i}
                                className="font-bold text-lg text-slate-900 mb-3 border-l-4 pl-3"
                                style={{ borderColor: side.color }}
                            >
                                {p.replace(/\*\*/g, '')}
                            </p>
                        );
                    }
                    if (p.startsWith('*') && p.endsWith('*')) {
                        return (
                            <blockquote
                                key={i}
                                className="border-l-4 pl-3 italic text-slate-600 my-3 bg-slate-50 py-2 pr-3 rounded-r-lg"
                                style={{ borderColor: side.color }}
                            >
                                "{p.replace(/\*/g, '').replace(/"/g, '')}"
                            </blockquote>
                        );
                    }
                    return (
                        <p key={i} className="mb-3 last:mb-0">
                            {p.replace(/\*\*/g, '')}
                        </p>
                    );
                })}
            </div>

            {side.sourceCredit && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">
                        - {side.sourceCredit}
                    </span>
                </div>
            )}
        </div>
    );
};

export const PerspectivePrism: React.FC<PerspectivePrismProps> = ({
    title = 'Perspektivprisme',
    instruction = 'Dra for å se saken fra flere sider.',
    sides,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [viewportWidth, setViewportWidth] = useState(0);

    const sideCount = sides.length;

    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const update = () => setViewportWidth(el.offsetWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Peek-gutter: nabokortene titter frem i kantene
    const gutter = viewportWidth < 640 ? 16 : 44;
    const cardWidth = Math.max(viewportWidth - gutter * 2, 0);
    const targetX = gutter - activeIndex * (cardWidth + GAP);

    const goTo = (index: number) => {
        setActiveIndex(((index % sideCount) + sideCount) % sideCount);
    };

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const { offset, velocity } = info;
        if (offset.x < -80 || velocity.x < -400) goTo(activeIndex + 1);
        else if (offset.x > 80 || velocity.x > 400) goTo(activeIndex - 1);
        else setActiveIndex(activeIndex); // snapp tilbake
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            goTo(activeIndex + 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goTo(activeIndex - 1);
        }
    };

    return (
        <div
            className="my-6 rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {/* Toppfelt */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <h3 className="font-display font-bold text-slate-900 tracking-tight">{title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MoveHorizontal size={14} />
                    <span>{instruction}</span>
                </div>
            </div>

            {/* Kort-spor */}
            <div ref={viewportRef} className="overflow-hidden py-4 bg-slate-50/40">
                <motion.div
                    className="flex items-stretch cursor-grab active:cursor-grabbing"
                    style={{ gap: GAP }}
                    animate={{ x: targetX }}
                    transition={SPRING}
                    drag="x"
                    dragConstraints={{ left: targetX, right: targetX }}
                    dragElastic={0.15}
                    onDragEnd={handleDragEnd}
                >
                    {sides.map((side, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <motion.div
                                key={side.id}
                                className="flex-shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col"
                                style={{ width: cardWidth }}
                                animate={{ scale: isActive ? 1 : 0.94, opacity: isActive ? 1 : 0.55 }}
                                transition={SPRING}
                                onClick={() => {
                                    if (!isActive) goTo(index);
                                }}
                            >
                                {/* Farget headerstripe */}
                                <div
                                    className="h-14 flex items-center px-5 gap-3 text-white flex-shrink-0"
                                    style={{
                                        background: `linear-gradient(to right, ${side.color}, ${side.color}dd)`,
                                    }}
                                >
                                    <div className="p-1.5 bg-white/20 rounded-lg text-xl leading-none">
                                        {side.icon || '📜'}
                                    </div>
                                    <h4 className="font-bold text-lg tracking-tight truncate">{side.title}</h4>
                                </div>

                                <SideBody side={side} />
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Bunnavigasjon */}
            <div className="flex items-center justify-center gap-4 px-5 py-2.5 border-t border-slate-100">
                <button
                    onClick={() => goTo(activeIndex - 1)}
                    className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition shadow-sm"
                    aria-label="Forrige perspektiv"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>

                <div className="flex gap-2">
                    {sides.map((side, i) => (
                        <button
                            key={side.id}
                            onClick={() => goTo(i)}
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                                i === activeIndex ? 'w-8' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                            }`}
                            style={i === activeIndex ? { backgroundColor: side.color } : undefined}
                            aria-label={`Gå til ${side.title}`}
                        />
                    ))}
                </div>

                <button
                    onClick={() => goTo(activeIndex + 1)}
                    className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition shadow-sm"
                    aria-label="Neste perspektiv"
                >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                <span className="text-xs text-slate-400 font-mono tabular-nums">
                    {activeIndex + 1} / {sideCount}
                </span>
            </div>
        </div>
    );
};
