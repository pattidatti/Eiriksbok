// XP-orben som flyr fra toasten inn i «Min læring»-chipen i toppmenyen.
// Rendres i portal over alt annet, følger en svak bue og etterlater seg
// en hale av gnister. Kaller onLand i det orben treffer chipen.

import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface XpFlightProps {
    from: DOMRect;
    to: DOMRect;
    onLand: () => void;
}

const SPARK_COUNT = 5;
const FLIGHT_DURATION = 0.6;

export const XpFlight = ({ from, to, onLand }: XpFlightProps) => {
    const start = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
    const end = { x: to.left + to.width / 2, y: to.top + to.height / 2 };
    // Midtpunktet skyves ut til siden så banen blir en sving, ikke en strek
    const mid = {
        x: (start.x + end.x) / 2 - 56,
        y: (start.y + end.y) / 2 - 24,
    };

    return createPortal(
        <div className="pointer-events-none fixed inset-0 z-[60]">
            {/* Gnist-halen - små lysprikker som følger banen litt forsinket */}
            {Array.from({ length: SPARK_COUNT }, (_, i) => (
                <motion.span
                    key={i}
                    className="absolute left-0 top-0 h-2 w-2 rounded-full bg-amber-300"
                    style={{
                        marginLeft: -4,
                        marginTop: -4,
                        boxShadow: '0 0 8px 2px rgba(251, 191, 36, 0.7)',
                    }}
                    animate={{
                        x: [start.x, mid.x, end.x],
                        y: [start.y, mid.y, end.y],
                        opacity: [0.9, 0.6, 0],
                        scale: [0.9 - i * 0.12, 0.6, 0.2],
                    }}
                    transition={{
                        duration: FLIGHT_DURATION,
                        delay: 0.045 * (i + 1),
                        ease: 'easeInOut',
                    }}
                />
            ))}
            {/* Selve orben */}
            <motion.div
                className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-base"
                style={{
                    marginLeft: -18,
                    marginTop: -18,
                    boxShadow: '0 0 16px 4px rgba(251, 191, 36, 0.6)',
                }}
                animate={{
                    x: [start.x, mid.x, end.x],
                    y: [start.y, mid.y, end.y],
                    scale: [1, 0.85, 0.35],
                    opacity: [1, 1, 0.9],
                }}
                transition={{ duration: FLIGHT_DURATION, ease: 'easeInOut' }}
                onAnimationComplete={onLand}
            >
                ⭐
            </motion.div>
        </div>,
        document.body
    );
};
