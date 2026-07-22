import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, RotateCcw } from 'lucide-react';

interface MicroGameFrameProps {
    title: string;
    subtitle?: string;
    estimatedSeconds?: number;
    onRetry?: () => void;
    children: React.ReactNode;
    // Fjern den indre paddingen slik at en kinematisk fullskjerm-scene kan fylle
    // hele rammen kant-til-kant. Brukes av frie 3D-mikrospill som ikke bare er
    // et objekt å inspisere, men en levende scene som transformeres.
    bleed?: boolean;
}

// Felles ramme rundt et mikro-spill. Lys stil som matcher resten av
// læringsstien — ingen brå dark-mode-skifte mellom steg.
export const MicroGameFrame: React.FC<MicroGameFrameProps> = ({
    title,
    onRetry,
    children,
    bleed = false,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
            <header className="flex items-start justify-between gap-3 px-3.5 py-2 border-b border-slate-200 bg-white/60">
                <div className="flex items-start gap-2 min-w-0">
                    <div className="w-6 h-6 mt-0.5 rounded-md bg-slate-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                        <Gamepad2 className="w-3.5 h-3.5" />
                    </div>
                    {/* Tittelen får aldri truncate - den brytes heller til to linjer
                        slik at hele navnet alltid er lesbart. */}
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold leading-snug text-slate-900 [text-wrap:balance] line-clamp-2">
                            {title}
                        </h3>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                            aria-label="Start mikro-spillet på nytt"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Start på nytt</span>
                        </button>
                    )}
                </div>
            </header>

            <div className={bleed ? '' : 'p-4 md:p-6'}>{children}</div>
        </motion.div>
    );
};
