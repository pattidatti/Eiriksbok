import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface InkParticleProps {
    sourceRect: DOMRect | null;
    targetSelector: string; // e.g., "#scrapbook-icon"
    color?: string;
    onComplete?: () => void;
}

// Hver partikkel bærer sine egne tilfeldige verdier. De trekkes når partiklene
// spawnes i effecten, ikke under render — Math.random() under render gjør
// renderen uren og gir ulike verdier mellom React sine doble kall i Strict Mode.
interface Particle {
    id: number;
    scale: number;
    rotate: number;
    duration: number;
    delay: number;
}

export const InkParticles: React.FC<InkParticleProps> = ({ sourceRect, targetSelector, color = '#3e2723', onComplete }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (!sourceRect) return;

        const targetEl = document.querySelector(targetSelector);
        if (targetEl) {
            // Vi måler et element i DOM-en for å vite hvor partiklene skal fly.
            // Det er ekte synkronisering mot et eksternt system og kan bare gjøres
            // etter at React har tegnet — altså i en effect.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTargetRect(targetEl.getBoundingClientRect());
            // Spawn particles
            setParticles(
                Array.from({ length: 8 }, (_, i) => ({
                    id: i,
                    scale: Math.random() * 0.5 + 0.5,
                    rotate: Math.random() * 360,
                    duration: 0.8 + Math.random() * 0.4,
                    delay: Math.random() * 0.2,
                }))
            );
        }
    }, [sourceRect, targetSelector]);

    useEffect(() => {
        if (particles.length > 0) {
            const timer = setTimeout(() => {
                onComplete?.();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [particles, onComplete]);

    if (!sourceRect || !targetRect) return null;

    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-[100]">
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{
                            x: sourceRect.left + sourceRect.width / 2,
                            y: sourceRect.top + sourceRect.height / 2,
                            scale: p.scale,
                            opacity: 1
                        }}
                        animate={{
                            x: targetRect.left + targetRect.width / 2,
                            y: targetRect.top + targetRect.height / 2,
                            scale: 0.2,
                            opacity: 0,
                            rotate: p.rotate
                        }}
                        transition={{
                            duration: p.duration,
                            ease: "easeInOut",
                            delay: p.delay
                        }}
                        className="absolute w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
};
