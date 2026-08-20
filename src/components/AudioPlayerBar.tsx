import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { useAudioBarStore } from '../stores/useAudioBarStore';

const RATES = [0.8, 1.0, 1.2, 1.5];

interface AudioPlayerBarProps {
    isPlaying: boolean;
    isPaused: boolean;
    onToggle: () => void;
    onStop: () => void;
    rate?: number;
    setRate?: (rate: number) => void;
    /** Hvilket avsnitt som leses nå (1-basert). Vises bare sammen med `total`. */
    current?: number;
    total?: number;
    /** Sett til false når det ikke finnes noen sidebar-spiller på store skjermer. */
    hideOnDesktop?: boolean;
}

/**
 * Flytende opplesnings-linje nederst på skjermen.
 *
 * På mobil ligger sidebaren (med spilleren) langt under artikkelen, så en elev som
 * har startet opplesning ved å trykke på et avsnitt har ingen synlig måte å stoppe
 * på. Denne linja følger med uansett hvor i artikkelen eleven er, og gir pause,
 * stopp og hastighet med tommelvennlige trykkflater.
 */
export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
    isPlaying,
    isPaused,
    onToggle,
    onStop,
    rate,
    setRate,
    current,
    total,
    hideOnDesktop = true,
}) => {
    const setVisible = useAudioBarStore((s) => s.setVisible);

    useEffect(() => {
        setVisible(isPlaying);
        return () => setVisible(false);
    }, [isPlaying, setVisible]);

    const showProgress = current !== undefined && total !== undefined && total > 0;

    return (
        <>
            {/* Holder plass nederst så linja aldri dekker siste avsnitt. */}
            {isPlaying && (
                <div aria-hidden className={`h-24 ${hideOnDesktop ? 'lg:hidden' : ''}`} />
            )}
            <AnimatePresence>
                {isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        role="region"
                        aria-label="Opplesning"
                        className={`fixed inset-x-0 bottom-0 z-[120] px-3 pointer-events-none ${hideOnDesktop ? 'lg:hidden' : ''}`}
                        style={{
                            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
                        }}
                    >
                        <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-md">
                            <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
                                <motion.span
                                    animate={isPaused ? { scale: 1 } : { scale: [1, 1.15, 1] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                    className="shrink-0"
                                >
                                    <Volume2
                                        className={`h-5 w-5 ${isPaused ? 'text-slate-400' : 'text-indigo-500'}`}
                                    />
                                </motion.span>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-bold text-slate-700">
                                        {isPaused ? 'Pauset' : 'Leser opp'}
                                    </div>
                                    {showProgress && (
                                        <div className="text-[11px] font-medium text-slate-400">
                                            Avsnitt {current} av {total}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {rate !== undefined && setRate && (
                                <button
                                    onClick={() =>
                                        setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])
                                    }
                                    className="h-11 shrink-0 rounded-xl px-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                                    title="Endre hastighet"
                                    aria-label={`Hastighet ${rate}x. Trykk for å endre.`}
                                >
                                    {rate}x
                                </button>
                            )}

                            <button
                                onClick={onToggle}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700"
                                aria-label={isPaused ? 'Fortsett opplesning' : 'Pause opplesning'}
                            >
                                {isPaused ? (
                                    <Play className="ml-0.5 h-5 w-5" />
                                ) : (
                                    <Pause className="h-5 w-5" />
                                )}
                            </button>

                            <button
                                onClick={onStop}
                                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 font-bold text-red-600 transition-colors hover:bg-red-100"
                                aria-label="Stopp opplesning"
                            >
                                <Square className="h-3.5 w-3.5 fill-current" />
                                <span className="text-sm">Stopp</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
