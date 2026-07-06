import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, CalendarCheck, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { SkyWorld } from '../../types/sky';

// HUD-en nederst: fagfilter, «redd stjernene»-teller og snarvei til Dagens økt.
// Når ingenting blafrer tilbys «oppdag en ny stjerne» - himmelen har alltid
// en neste handling. Lys glass oppå den mørke himmelen, projektor-vennlig.

interface SkyHudProps {
    world: SkyWorld;
    focusSubjectId: string | null;
    onFocusSubject: (subjectId: string | null) => void;
    onJumpToDue: () => void;
    onDiscover: () => void;
    hasDiscoverable: boolean;
    reviewDueCount: number;
    muted: boolean;
    onToggleMute: () => void;
}

export const SkyHud: React.FC<SkyHudProps> = ({
    world,
    focusSubjectId,
    onFocusSubject,
    onJumpToDue,
    onDiscover,
    hasDiscoverable,
    reviewDueCount,
    muted,
    onToggleMute,
}) => {
    // Teller kun stjerner i fokusert fag når filteret er på
    const dueCount = focusSubjectId
        ? world.stars.reduce(
              (count, star) =>
                  count +
                  (star.subjectId === focusSubjectId &&
                  (star.status === 'flickering' || star.status === 'fading')
                      ? 1
                      : 0),
              0
          )
        : world.dueCount;

    return (
        <div className="absolute bottom-0 inset-x-0 z-20 p-3 sm:p-4 pointer-events-none">
            <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 bg-white/85 backdrop-blur rounded-2xl px-2 py-1.5 shadow-lg border border-white/40">
                    <button
                        onClick={() => onFocusSubject(null)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-colors ${
                            focusSubjectId === null
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Alle fag
                    </button>
                    {world.regions.map((region) => (
                        <button
                            key={region.subjectId}
                            onClick={() =>
                                onFocusSubject(
                                    focusSubjectId === region.subjectId ? null : region.subjectId
                                )
                            }
                            className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-colors ${
                                focusSubjectId === region.subjectId
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {region.title}
                            <span className="ml-1.5 text-xs font-semibold opacity-60">
                                {region.litCount}/{region.starCount}
                            </span>
                        </button>
                    ))}
                    <button
                        onClick={onToggleMute}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        aria-label={muted ? 'Slå på lyd' : 'Slå av lyd'}
                    >
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                </div>

                {dueCount > 0 ? (
                    <button
                        onClick={onJumpToDue}
                        className="pointer-events-auto flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        {dueCount === 1 ? '1 stjerne blafrer' : `${dueCount} stjerner blafrer`}
                    </button>
                ) : (
                    hasDiscoverable && (
                        <button
                            onClick={onDiscover}
                            className="pointer-events-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                        >
                            <Sparkles className="w-4 h-4" />
                            {world.litCount === 0
                                ? 'Tenn din første stjerne'
                                : 'Oppdag en ny stjerne'}
                        </button>
                    )
                )}

                {reviewDueCount > 0 && (
                    <Link
                        to="/oving/dagens-okt"
                        className="pointer-events-auto flex items-center gap-2 bg-white/85 backdrop-blur hover:bg-white text-slate-700 font-bold text-sm px-4 py-2.5 rounded-2xl shadow-lg border border-white/40 transition-all hover:scale-105"
                    >
                        <CalendarCheck className="w-4 h-4" />
                        Ta hele dagens økt
                    </Link>
                )}
            </div>
        </div>
    );
};
