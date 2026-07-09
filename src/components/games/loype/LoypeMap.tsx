import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Swords, Crown, Flame, Gift, Skull, Check } from 'lucide-react';
import type { MapNode, NodeType } from './types';

interface LoypeMapProps {
    map: MapNode[];
    currentNodeId: string | null;
    visited: string[];
    onSelect: (nodeId: string) => void;
}

const ROW_H = 96;
const COL_X = [20, 50, 80]; // prosent

const NODE_ICON: Record<NodeType, React.ComponentType<{ className?: string }>> = {
    challenge: Swords,
    elite: Crown,
    rest: Flame,
    reward: Gift,
    boss: Skull,
};

const NODE_STYLE: Record<NodeType, string> = {
    challenge: 'bg-white border-indigo-300 text-indigo-600',
    elite: 'bg-violet-50 border-violet-400 text-violet-700',
    rest: 'bg-amber-50 border-amber-400 text-amber-600',
    reward: 'bg-pink-50 border-pink-400 text-pink-600',
    boss: 'bg-rose-50 border-rose-500 text-rose-600',
};

const NODE_LABEL: Record<NodeType, string> = {
    challenge: 'Utfordring',
    elite: 'Elite',
    rest: 'Bål',
    reward: 'Skatt',
    boss: 'Boss',
};

// Nodekartet: løypa klatrer oppover, start nederst og boss på toppen.
// Tilgjengelige noder pulserer, besøkte blir grønne, resten dimmes.
export const LoypeMap: React.FC<LoypeMapProps> = ({ map, currentNodeId, visited, onSelect }) => {
    const rows = useMemo(() => Math.max(...map.map((n) => n.row)) + 1, [map]);
    const height = rows * ROW_H;
    const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const currentNode = map.find((n) => n.id === currentNodeId);
    const available = useMemo(() => {
        if (!currentNode) return new Set(map.filter((n) => n.row === 0).map((n) => n.id));
        return new Set(currentNode.edges);
    }, [map, currentNode]);
    const visitedSet = useMemo(() => new Set(visited), [visited]);

    const x = (node: MapNode) => COL_X[node.col];
    const y = (node: MapNode) => (rows - 1 - node.row) * ROW_H + ROW_H / 2;

    // Hold aktiv rad i syne når eleven klatrer
    useEffect(() => {
        const target = currentNodeId ?? map.find((n) => n.row === 0)?.id;
        if (!target) return;
        nodeRefs.current
            .get(target)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentNodeId, map]);

    const edgeStyle = (from: MapNode, toId: string) => {
        if (visitedSet.has(from.id) && visitedSet.has(toId)) {
            return { stroke: '#34d399', dash: 'none' };
        }
        if (from.id === currentNodeId && available.has(toId)) {
            return { stroke: '#818cf8', dash: '6 4' };
        }
        return { stroke: '#cbd5e1', dash: '4 5' };
    };

    return (
        <div className="max-w-md mx-auto">
            {!currentNode && (
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-slate-600 font-medium mb-2"
                >
                    Velg din første etappe nederst i løypa!
                </motion.p>
            )}
            <div className="relative" style={{ height }}>
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                >
                    {map.flatMap((from) =>
                        from.edges.map((toId) => {
                            const to = map.find((n) => n.id === toId);
                            if (!to) return null;
                            const style = edgeStyle(from, toId);
                            return (
                                <line
                                    key={`${from.id}-${toId}`}
                                    x1={x(from)}
                                    y1={y(from)}
                                    x2={x(to)}
                                    y2={y(to)}
                                    stroke={style.stroke}
                                    strokeWidth={2.5}
                                    strokeDasharray={style.dash}
                                    strokeLinecap="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        })
                    )}
                </svg>

                {map.map((node) => {
                    const isAvailable = available.has(node.id);
                    const isVisited = visitedSet.has(node.id);
                    const isBoss = node.type === 'boss';
                    const Icon = NODE_ICON[node.type];
                    const size = isBoss ? 'w-16 h-16' : 'w-12 h-12';
                    return (
                        <motion.button
                            key={node.id}
                            ref={(el) => {
                                if (el) nodeRefs.current.set(node.id, el);
                            }}
                            onClick={() => isAvailable && onSelect(node.id)}
                            disabled={!isAvailable}
                            aria-label={`${NODE_LABEL[node.type]}${isAvailable ? ' - tilgjengelig' : ''}`}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] flex items-center justify-center shadow-sm transition-colors ${size} ${
                                isVisited
                                    ? 'bg-emerald-500 border-emerald-600 text-white'
                                    : NODE_STYLE[node.type]
                            } ${
                                isAvailable
                                    ? 'ring-4 ring-indigo-200 cursor-pointer'
                                    : isVisited
                                      ? ''
                                      : 'opacity-40 saturate-50'
                            }`}
                            style={{ left: `${x(node)}%`, top: y(node) }}
                            animate={isAvailable ? { scale: [1, 1.09, 1] } : { scale: 1 }}
                            transition={
                                isAvailable
                                    ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                                    : undefined
                            }
                            whileHover={isAvailable ? { scale: 1.18 } : undefined}
                            whileTap={isAvailable ? { scale: 0.92 } : undefined}
                        >
                            {isVisited ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <Icon className={isBoss ? 'w-8 h-8' : 'w-5 h-5'} />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {(Object.keys(NODE_ICON) as NodeType[]).map((type) => {
                    const Icon = NODE_ICON[type];
                    return (
                        <span key={type} className="flex items-center gap-1">
                            <Icon className="w-3.5 h-3.5" />
                            {NODE_LABEL[type]}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
