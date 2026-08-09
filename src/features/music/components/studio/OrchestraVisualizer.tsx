import React from 'react';
import { motion } from 'framer-motion';
import { type InstrumentTrack } from './types';

interface OrchestraVisualizerProps {
    tracks: InstrumentTrack[];
    activeTracks: string[];
    intensity: number;
}

export const OrchestraVisualizer: React.FC<OrchestraVisualizerProps> = ({ tracks, activeTracks, intensity }) => {
    return (
        <div className="relative h-48 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 border-b border-slate-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">

            {/* Stage Floor */}
            <div className="absolute bottom-0 w-full h-full bg-[linear-gradient(to_top,rgba(0,0,0,0.5),transparent)] pointer-events-none" />

            {/* Instruments Layout */}
            <div className="relative grid grid-cols-3 gap-12 w-full max-w-2xl px-12 perspective-1000">
                {tracks.map((track, i) => {
                    const isActive = activeTracks.includes(track.id);
                    const isBackRow = i < 3;

                    return (
                        <div key={track.id} className={`flex flex-col items-center justify-center transition-all duration-300 ${isBackRow ? 'scale-75 opacity-80' : 'scale-100'}`}>
                            <motion.div
                                animate={isActive ? {
                                    scale: [1, 1.1 + (intensity * 0.1), 1],
                                    boxShadow: `0 0 ${20 + (intensity * 30)}px ${track.color.replace('text-', '')}`
                                } : { scale: 1, boxShadow: '0 0 0px transparent' }}
                                transition={{ duration: 0.2 }}
                                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 
                                    ${isActive
                                        ? `${track.color.replace('text-', 'bg-')} border-white text-white z-10`
                                        : 'bg-slate-800/50 border-slate-700 text-slate-500 blur-[1px]'
                                    }
                                    transition-colors duration-200
                                `}
                            >
                                {React.cloneElement(track.icon as React.ReactElement<{ size?: number }>, { size: 32 })}
                            </motion.div>
                            <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white text-shadow-lg' : 'text-slate-600'}`}>
                                {track.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Ambient Particles */}
            {activeTracks.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/10 blur-3xl animate-pulse" />
                </div>
            )}
        </div>
    );
};
