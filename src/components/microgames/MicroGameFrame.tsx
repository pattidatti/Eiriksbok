import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, Gamepad2, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { MicroGameLauncher } from './MicroGameLauncher';

// Kontekst som lar en embed-kontekst (f.eks. en artikkel) be om at spillet
// starter sammenslått. Uten provider (standalone /mikrospill-side, preview,
// audit) er spillet alltid åpent, akkurat som før.
interface MicroGameEmbedCfg {
    collapsible: boolean;
    defaultOpen: boolean;
    // Registerets spilletid, så det lukkede kortet viser det samme som før start.
    estimatedSeconds?: number;
    // Omslaget i artikkelen eier fullskjermen (fullskjerm-først, se MicroGameBlock).
    fullscreen?: { active: boolean; enter: () => void; exit: () => void };
}
const MicroGameEmbedContext = createContext<MicroGameEmbedCfg | null>(null);
export const MicroGameEmbedProvider = MicroGameEmbedContext.Provider;

// Tittellinjen i et åpent, sammenleggbart spill: tittel + «Lukk». Lukket
// tilstand tegnes av MicroGameLauncher.
interface MicroGameTitleButtonProps {
    title: string;
    onCollapse: () => void;
}

const MicroGameTitleButton: React.FC<MicroGameTitleButtonProps> = ({ title, onCollapse }) => (
    <button
        type="button"
        onClick={onCollapse}
        aria-expanded
        className="group flex items-center gap-2 min-w-0 flex-1 text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-slate-100/70 transition"
    >
        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Gamepad2 className="w-3.5 h-3.5" />
        </span>
        <h3 className="min-w-0 text-sm font-bold leading-snug text-slate-900 [text-wrap:balance] line-clamp-2">
            {title}
        </h3>
        <span className="ml-auto pl-2 flex items-center gap-1 flex-shrink-0 text-slate-400 group-hover:text-slate-600">
            <span className="hidden sm:inline text-xs font-semibold">Lukk</span>
            <ChevronUp className="w-4 h-4" />
        </span>
    </button>
);

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
    estimatedSeconds,
    onRetry,
    children,
    bleed = false,
}) => {
    const embed = useContext(MicroGameEmbedContext);
    const collapsible = embed?.collapsible ?? false;
    const [open, setOpen] = useState(embed?.defaultOpen ?? true);

    // Sammenslått: bare startkortet vises, og 3D-scenen (children) mountes
    // aldri - ingen WebGL-kontekst før eleven faktisk åpner spillet.
    const showBody = !collapsible || open;

    // Fullskjerm: hele rammen (tittel + spill + kontroller) går i fullskjerm, og
    // spillvinduet ([data-mg-stage]) strekker seg til skjermhøyden - se index.css.
    const rootRef = useRef<HTMLDivElement>(null);
    const [fullscreen, setFullscreen] = useState(false);
    useEffect(() => {
        const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);
    const embedFs = embed?.fullscreen;
    // I en artikkel kan omslaget alltid gi fullskjerm (ekte eller hele vinduet).
    const canFullscreen = !!embedFs || (typeof document !== 'undefined' && !!document.fullscreenEnabled);
    const isFull = embedFs ? embedFs.active : fullscreen;
    const toggleFullscreen = () => {
        if (embedFs) {
            if (embedFs.active) embedFs.exit();
            else embedFs.enter();
        } else if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
        else void rootRef.current?.requestFullscreen().catch(() => {});
    };

    // Lukket igjen etter å ha vært åpnet: samme startkort som før første start.
    if (!showBody) {
        return (
            <MicroGameLauncher
                title={title}
                estimatedSeconds={embed?.estimatedSeconds ?? estimatedSeconds}
                onStart={() => {
                    embedFs?.enter();
                    setOpen(true);
                }}
                fullscreen={!!embedFs}
            />
        );
    }

    return (
        <motion.div
            ref={rootRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mg-frame bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
            <header
                className="flex items-center justify-between gap-3 px-3.5 py-2 bg-white/60 border-b border-slate-200"
            >
                {collapsible ? (
                    <MicroGameTitleButton
                        title={title}
                        onCollapse={() => {
                            // Lukk = tilbake til artikkelen: ut av fullskjerm og ned til kortet.
                            embedFs?.exit();
                            setOpen(false);
                        }}
                    />
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
                {canFullscreen && (
                    <button
                        onClick={toggleFullscreen}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition flex-shrink-0"
                        aria-label={isFull ? 'Avslutt fullskjerm' : 'Spill i fullskjerm'}
                    >
                        {isFull ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        <span className="hidden md:inline">{isFull ? 'Lukk fullskjerm' : 'Fullskjerm'}</span>
                    </button>
                )}
                {onRetry && (
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

            <motion.div
                initial={collapsible ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={bleed ? '' : 'p-4 md:p-6'}
            >
                {children}
            </motion.div>
        </motion.div>
    );
};
