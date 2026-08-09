import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Tent, Swords, Droplets, Shield, Scroll, Castle, Home, Eye, Wind, Flag, ChevronUp, BookOpen, Map as MapIcon, CheckCircle, type LucideIcon } from 'lucide-react';
import type { ChronosMapPoint, ChronosNode } from '../../data/chronos/types';

interface ChronosMapProps {
    config: NonNullable<ChronosNode['mapConfig']>;
    onPointClick: (point: ChronosMapPoint) => void;
    flags: string[];
}

const IconMap: Record<string, LucideIcon> = {
    marker: MapPin,
    tent: Tent,
    swords: Swords,
    water: Droplets,
    shield: Shield,
    scroll: Scroll,
    castle: Castle,
    home: Home,
    eye: Eye,
    wind: Wind,
    flag: Flag,
    'chevron-up': ChevronUp,
    book: BookOpen,
    map: MapIcon
};

export const ChronosMap: React.FC<ChronosMapProps> = ({ config, onPointClick, flags }) => {
    return (
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-inner border border-stone-200 group bg-stone-100">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={config.image}
                    alt="World Map"
                    className="w-full h-full object-cover filter sepia-[.3] contrast-[.9]"
                />
                <div className="absolute inset-0 bg-stone-900/10 pointer-events-none" />
                {/* Vignette */}
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none" />
            </div>

            {/* Map Points */}
            {config.points.map((point: ChronosMapPoint) => {
                const Icon = point.icon && IconMap[point.icon] ? IconMap[point.icon] : MapPin;
                const isVisited = point.visitedFlag ? flags.includes(point.visitedFlag) : false;

                return (
                    <motion.button
                        key={point.id}
                        className="absolute z-10 flex flex-col items-center group/point"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => onPointClick(point)}
                    >
                        <div className="relative">
                            {!isVisited && <div className="absolute -inset-2 bg-indigo-500/30 rounded-full animate-ping" />}
                            <div className={`relative p-2 text-white rounded-full shadow-lg border-2 border-white transition-colors ${
                                isVisited
                                    ? 'bg-emerald-600 group-hover/point:bg-emerald-700'
                                    : 'bg-indigo-600 group-hover/point:bg-indigo-700'
                            }`}>
                                {isVisited
                                    ? <CheckCircle size={24} className="opacity-90" />
                                    : <Icon size={24} fill="currentColor" className="opacity-90" />
                                }
                            </div>
                        </div>

                        <div className="mt-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-stone-200 transform translate-y-2 opacity-0 group-hover/point:opacity-100 group-hover/point:translate-y-0 transition-all duration-300">
                            <span className="text-xs font-black uppercase tracking-widest text-stone-800 whitespace-nowrap">
                                {point.label}
                            </span>
                        </div>
                    </motion.button>
                )
            })}

            {/* Legend / Overlay Text */}
            <div className="absolute bottom-4 left-6 pointer-events-none">
                <h4 className="text-white/80 font-display font-black text-xl tracking-widest drop-shadow-md">KART</h4>
            </div>
        </div>
    );
};
