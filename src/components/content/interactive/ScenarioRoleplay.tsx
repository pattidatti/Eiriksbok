import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, ArrowRight, Skull, Trophy, RefreshCcw } from 'lucide-react';
import { renderInlineMarkdown } from '../../markdownUtils';
import { celebrateCompletion } from '../../ui/answerFeedback';

interface Option {
    label?: string;
    text?: string; // alias: innholds-JSON/cron bruker av og til 'text'
    nextId: string;
    outcome?: 'success' | 'failure' | 'neutral';
    feedback?: string;
}

interface Scenario {
    id: string;
    text: string;
    image?: string;
    options?: Option[];
    choices?: Option[]; // alias for 'options'
}

interface ScenarioRoleplayProps {
    title: string;
    intro?: string;
    startId: string;
    scenarios?: Scenario[];
    scenario?: Scenario[]; // alias for 'scenarios'
}

export const ScenarioRoleplay: React.FC<ScenarioRoleplayProps> = ({ title, intro = '', startId, scenarios, scenario }) => {
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    // Alias-sikkerhetsnett: godta både kanoniske prop-navn og variantene
    // innholds-generering noen ganger produserer (scenario/choices/text).
    const nodes = scenarios ?? scenario ?? [];
    const currentScenario = nodes.find(s => s.id === (currentId || startId));

    const handleOptionClick = (option: Option) => {
        setHistory([...history, currentId || startId]);
        setCurrentId(option.nextId);
    };

    const reset = () => {
        setCurrentId(null);
        setHistory([]);
    };

    const options = currentScenario?.options ?? currentScenario?.choices ?? [];
    const isEnding = !!currentScenario && options.length === 0;
    const isFailureEnding =
        !!currentScenario &&
        (currentScenario.id.includes('death') || currentScenario.id.includes('fail'));

    // Konfetti når eleven når en god slutt - kun ved fullført historie
    React.useEffect(() => {
        if (isEnding && !isFailureEnding) celebrateCompletion();
    }, [isEnding, isFailureEnding, currentScenario?.id]);

    if (!currentScenario) {
        return (
            <div className="p-6 bg-slate-100 rounded-xl text-center">
                <p>Scenario not found.</p>
                <button onClick={reset} className="mt-4 text-indigo-600 underline">Start over</button>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans mx-auto max-w-2xl">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                    <Scroll className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-slate-400 text-sm">{currentId ? 'Din reise fortsetter...' : intro}</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 min-h-[300px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentScenario.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentScenario.image && (
                            <img
                                src={currentScenario.image}
                                alt="Scenario"
                                className="w-full h-48 object-cover rounded-lg mb-6 shadow-md"
                            />
                        )}

                        <div className="text-lg text-slate-700 leading-relaxed mb-8 space-y-4">
                            {currentScenario.text.split('\n\n').map((para, i) => (
                                <p key={i}>{renderInlineMarkdown(para)}</p>
                            ))}
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionClick(option)}
                                    className="pressable focus-ring w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-all group flex items-center justify-between shadow-sm hover:shadow"
                                >
                                    <span className="font-medium text-slate-800 group-hover:text-indigo-900">
                                        {option.label ?? option.text}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                                </button>
                            ))}

                            {isEnding && (
                                <div className="text-center mt-8">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4"
                                    >
                                        {isFailureEnding ? (
                                            <Skull className="w-8 h-8 text-slate-600" />
                                        ) : (
                                            <Trophy className="w-8 h-8 text-amber-500" />
                                        )}
                                    </motion.div>
                                    <h4 className="text-xl font-bold mb-2">Historien er slutt</h4>
                                    <button
                                        onClick={reset}
                                        className="pressable focus-ring inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors"
                                    >
                                        <RefreshCcw className="w-4 h-4" />
                                        Prøv igjen
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
