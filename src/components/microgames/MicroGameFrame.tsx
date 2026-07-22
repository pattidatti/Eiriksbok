import React, { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Gamepad2, RotateCcw } from 'lucide-react';

// Kontekst som lar en embed-kontekst (f.eks. en artikkel) be om at spillet
// starter sammenslått. Uten provider (standalone /mikrospill-side, preview,
// audit) er spillet alltid åpent, akkurat som før.
interface MicroGameEmbedCfg {
    collapsible: boolean;
    defaultOpen: boolean;
}
const MicroGameEmbedContext = createContext<MicroGameEmbedCfg | null>(null);
export const MicroGameEmbedProvider = MicroGameEmbedContext.Provider;

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
    subtitle,
    onRetry,
    children,
    bleed = false,
}) => {
    const embed = useContext(MicroGameEmbedContext);
    const collapsible = embed?.collapsible ?? false;
    const [open, setOpen] = useState(embed?.defaultOpen ?? true);

    // Sammenslått: bare tittellinjen vises, og 3D-scenen (children) mountes
    // aldri - ingen WebGL-kontekst før eleven faktisk åpner spillet.
    const showBody = !collapsible || open;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
            <header
                className={`flex items-center justify-between gap-3 px-3.5 py-2 bg-white/60 ${
                    showBody ? 'border-b border-slate-200' : ''
                }`}
            >
                {collapsible ? (
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        aria-expanded={open}
                        className="group flex items-center gap-2 min-w-0 flex-1 text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-slate-100/70 transition"
                    >
                        <span className="w-6 h-6 rounded-md bg-slate-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <Gamepad2 className="w-3.5 h-3.5" />
                        </span>
                        {/* Når spillet er lukket får undertittelen plass som en
                            liten teaser under tittelen; ved åpning forsvinner den
                            så scenen får all oppmerksomheten. */}
                        <span className="min-w-0">
                            <h3 className="text-sm font-bold leading-snug text-slate-900 [text-wrap:balance] line-clamp-2">
                                {title}
                            </h3>
                            {!open && subtitle && (
                                <span className="block text-xs text-slate-500 leading-snug line-clamp-1">
                                    {subtitle}
                                </span>
                            )}
                        </span>
                        <span className="ml-auto pl-2 flex items-center gap-1 flex-shrink-0 text-slate-400 group-hover:text-slate-600">
                            {!open && (
                                <span className="hidden sm:inline text-xs font-semibold">
                                    Spill
                                </span>
                            )}
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                            />
                        </span>
                    </button>
                ) : (
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
                )}
                {showBody && onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition flex-shrink-0"
                        aria-label="Start mikro-spillet på nytt"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Start på nytt</span>
                    </button>
                )}
            </header>

            <AnimatePresence initial={false}>
                {showBody && (
                    <motion.div
                        key="body"
                        initial={collapsible ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={bleed ? '' : 'p-4 md:p-6'}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
