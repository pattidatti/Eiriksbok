import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    title?: string;
    description?: string;
}

interface Node {
    id: string;
    name: string;
    type: 'energy' | 'transport' | 'digital' | 'finance';
    x: number;
    y: number;
    dependsOn: string[];
    failMessage: string;
}

const NODES: Node[] = [
    {
        id: 'power',
        name: 'Strømnett',
        type: 'energy',
        x: 50,
        y: 50,
        dependsOn: [],
        failMessage: 'Strømnettverket kollapser. Alt annet avhenger av strøm.',
    },
    {
        id: 'internet',
        name: 'Internett',
        type: 'digital',
        x: 200,
        y: 50,
        dependsOn: ['power'],
        failMessage: 'Internett går ned. Kommunikasjon, betaling og finans svikter.',
    },
    {
        id: 'bank',
        name: 'Banksystem',
        type: 'finance',
        x: 350,
        y: 50,
        dependsOn: ['power', 'internet'],
        failMessage: 'Betalingssystemer stopper. Folk kan ikke bruke kort eller Vipps.',
    },
    {
        id: 'fuel',
        name: 'Drivstofftilgang',
        type: 'energy',
        x: 50,
        y: 180,
        dependsOn: ['power'],
        failMessage: 'Bensinstasjoner uten strøm kan ikke pumpe. Nødetater rammes.',
    },
    {
        id: 'transport',
        name: 'Godstransport',
        type: 'transport',
        x: 200,
        y: 180,
        dependsOn: ['fuel', 'internet'],
        failMessage: 'Logistikk og GPS-styring stanser. Varelager tømmes på 2-3 dager.',
    },
    {
        id: 'food',
        name: 'Matforsyning',
        type: 'transport',
        x: 350,
        y: 180,
        dependsOn: ['transport', 'bank'],
        failMessage: 'Dagligvarebutikker får ikke varer. Folk begynner å hamstre.',
    },
    {
        id: 'hospital',
        name: 'Sykehus',
        type: 'digital',
        x: 125,
        y: 310,
        dependsOn: ['power', 'internet', 'fuel'],
        failMessage: 'Nødgeneratorer holder noen timer. Kritiske pasienter i fare.',
    },
    {
        id: 'water',
        name: 'Vannforsyning',
        type: 'energy',
        x: 275,
        y: 310,
        dependsOn: ['power', 'internet'],
        failMessage: 'Pumper og renseanlegg stopper. Tappekranene tørker inn.',
    },
];

const TYPE_COLORS: Record<string, string> = {
    energy: '#f97316',
    transport: '#38bdf8',
    digital: '#a78bfa',
    finance: '#4ade80',
};

const TYPE_LABELS: Record<string, string> = {
    energy: 'Energi',
    transport: 'Transport',
    digital: 'Digital',
    finance: 'Finans',
};

// Rekursiv statusberegning som ren funksjon på modulnivå: en useCallback kan ikke
// referere seg selv inne i sin egen initialisering.
function nodeStatus(node: Node, failed: Set<string>): 'ok' | 'failed' | 'cascade' {
    if (failed.has(node.id)) return 'failed';
    const dependencyFailed = node.dependsOn.some(
        (dep) => failed.has(dep) || nodeStatus(NODES.find((n) => n.id === dep)!, failed) !== 'ok'
    );
    return dependencyFailed ? 'cascade' : 'ok';
}

export function CascadeFailureSim({ title, description }: Props) {
    const [failed, setFailed] = useState<Set<string>>(new Set());
    const [messages, setMessages] = useState<string[]>([]);

    const getNodeStatus = useCallback((node: Node) => nodeStatus(node, failed), [failed]);

    function failNode(node: Node) {
        if (failed.has(node.id)) return;
        const next = new Set(failed);
        next.add(node.id);
        setFailed(next);
        setMessages((m) => [node.failMessage, ...m].slice(0, 5));
    }

    function reset() {
        setFailed(new Set());
        setMessages([]);
    }

    const failedCount = NODES.filter((n) => getNodeStatus(n) !== 'ok').length;

    return (
        <div className="my-6 rounded-xl border border-red-200 bg-slate-900 overflow-hidden">
            <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-red-300 text-sm">{title ?? 'Kaskadefeil-simulator'}</h4>
                    {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
                </div>
                <button
                    onClick={reset}
                    className="text-xs bg-slate-700 border border-slate-600 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 transition-colors"
                >
                    Reset
                </button>
            </div>

            <div className="p-4">
                {/* Status bar */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-3 text-xs">
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[k] }} />
                                <span className="text-slate-400">{v}</span>
                            </div>
                        ))}
                    </div>
                    <span className={`text-xs font-bold ${failedCount > 4 ? 'text-red-400' : failedCount > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {NODES.length - failedCount}/{NODES.length} operativt
                    </span>
                </div>

                {/* Node grid */}
                <div className="relative bg-slate-800/50 rounded-lg overflow-hidden mb-3" style={{ height: '380px' }}>
                    {/* Connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 420 380">
                        {NODES.map((node) =>
                            node.dependsOn.map((depId) => {
                                const dep = NODES.find((n) => n.id === depId)!;
                                const nodeStatus = getNodeStatus(node);
                                return (
                                    <line
                                        key={`${node.id}-${depId}`}
                                        x1={dep.x + 40}
                                        y1={dep.y + 25}
                                        x2={node.x + 40}
                                        y2={node.y + 25}
                                        stroke={nodeStatus === 'cascade' ? '#ef4444' : nodeStatus === 'failed' ? '#ef4444' : '#475569'}
                                        strokeWidth={nodeStatus !== 'ok' ? 1.5 : 1}
                                        strokeOpacity={0.6}
                                        strokeDasharray={nodeStatus === 'cascade' ? '4,3' : undefined}
                                    />
                                );
                            })
                        )}
                    </svg>

                    {/* Nodes */}
                    {NODES.map((node) => {
                        const status = getNodeStatus(node);
                        return (
                            <button
                                key={node.id}
                                onClick={() => failNode(node)}
                                disabled={status !== 'ok'}
                                className="absolute flex flex-col items-center gap-1 w-20 disabled:cursor-default"
                                style={{ left: node.x, top: node.y }}
                                title={status === 'ok' ? 'Klikk for å fjerne denne noden' : undefined}
                            >
                                <motion.div
                                    animate={{
                                        backgroundColor:
                                            status === 'failed'
                                                ? '#991b1b'
                                                : status === 'cascade'
                                                ? '#78350f'
                                                : TYPE_COLORS[node.type] + '33',
                                        borderColor:
                                            status === 'failed'
                                                ? '#ef4444'
                                                : status === 'cascade'
                                                ? '#f59e0b'
                                                : TYPE_COLORS[node.type],
                                    }}
                                    className="w-16 h-12 rounded-lg border-2 flex items-center justify-center hover:scale-105 transition-transform"
                                >
                                    <span className="text-lg">
                                        {status === 'failed' ? '💥' : status === 'cascade' ? '⚠️' : { energy: '⚡', transport: '🚛', digital: '🌐', finance: '💰' }[node.type]}
                                    </span>
                                </motion.div>
                                <span className="text-[10px] text-slate-400 text-center leading-tight">{node.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Message log */}
                <AnimatePresence>
                    {messages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-1"
                        >
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`text-xs px-3 py-1.5 rounded-lg ${i === 0 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800/50 text-slate-400'}`}
                                >
                                    {i === 0 && '🔴 '}{msg}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-[10px] text-slate-500 mt-2">
                    Klikk en grønn node for å fjerne den og se kaskadeeffekten. Gule noder har mistet en avhengighet.
                </p>
            </div>
        </div>
    );
}
