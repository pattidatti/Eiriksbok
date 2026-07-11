import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface DailyReviewHeroGraphicProps {
    variant: 'banner' | 'card' | 'square';
    className?: string;
}

export const DailyReviewHeroGraphic: React.FC<DailyReviewHeroGraphicProps> = ({ variant, className = '' }) => {
    // Generer deterministiske partikler for bakgrunns-animasjon for å tilfredsstille React 19 purity-regler
    const particles = useMemo(() => {
        const count = variant === 'square' ? 5 : 12;
        let seed = 12345;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: random() * 100,
            y: random() * 100,
            size: random() * 3 + 1,
            duration: random() * 4 + 4,
            delay: random() * -5,
        }));
    }, [variant]);

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 select-none flex items-center justify-center ${className}`}>
            {/* Myke fargeklatter for dybde */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-purple-400/30 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-300/20 blur-2xl pointer-events-none" />

            {/* Animerte glitrepartikler */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                            filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9))',
                        }}
                        animate={{
                            y: [0, -15, 0],
                            opacity: [0.25, 0.9, 0.25],
                            scale: [1, 1.4, 1],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>

            {/* Sentrert glød */}
            <div className="absolute w-32 h-32 rounded-full bg-amber-300/20 blur-xl pointer-events-none" />

            {/* Sentrert symbol */}
            <div className="relative z-10 flex flex-col items-center">
                <motion.div
                    className={`${
                        variant === 'square'
                            ? 'w-10 h-10 rounded-xl bg-white/15 border border-white/25'
                            : 'w-16 h-16 rounded-2xl bg-white/15 border border-white/25 shadow-xl shadow-indigo-900/20'
                    } backdrop-blur-md flex items-center justify-center`}
                    animate={variant !== 'square' ? {
                        y: [0, -4, 0],
                    } : {}}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <Flame className={`${variant === 'square' ? 'w-5 h-5' : 'w-8 h-8'} text-amber-300`} />
                </motion.div>

                {variant === 'banner' && (
                    <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-xs font-semibold uppercase tracking-widest text-white bg-white/15 border border-white/20 rounded-full px-2.5 py-0.5 backdrop-blur-sm"
                    >
                        Dagens økt
                    </motion.p>
                )}
            </div>
        </div>
    );
};
