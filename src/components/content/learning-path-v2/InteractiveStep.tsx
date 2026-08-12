import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2 } from 'lucide-react';
import { getComponent } from '../../ComponentRegistry';
import { LazyComponentSlot } from '../LazyComponentSlot';
import type { StepRendererProps } from './types';

// Spawner en ComponentRegistry-komponent (PackTheBag, ScenarioRoleplay, etc).
// Komponenten må enten kalle onComplete-callback selv, eller - for komponenter
// som ikke har den krokeen - kan eleven trykke "Marker som ferdig" manuelt.
export const InteractiveStep: React.FC<StepRendererProps> = ({
    step,
    onComplete,
    isAlreadyCompleted,
}) => {
    const [completed, setCompleted] = useState(isAlreadyCompleted);
    const requireCompletion = step.completion.requireComponentComplete ?? true;

    if (!step.component) {
        return (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-900 text-sm">
                Konfigurasjonsfeil: interaktivt steg uten component-felt.
            </div>
        );
    }

    const componentName = step.component.name;
    const componentProps = step.component.props;

    const handleComponentComplete = () => {
        if (!completed) {
            setCompleted(true);
            onComplete({ completed: true });
        }
    };

    const handleManualComplete = () => {
        setCompleted(true);
        onComplete({ completed: true });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                    Interaktiv øvelse
                </span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900">{step.title}</h3>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
                {/* eslint-disable react-hooks/static-components -- registry returnerer stabil komponentreferanse pr. navn; samme mønster som LearningPath.tsx */}
                {(() => {
                    const Component = getComponent(componentName);
                    if (!Component) {
                        return (
                            <div className="text-rose-900 text-sm">
                                Fant ikke komponent: <code>{componentName}</code>
                            </div>
                        );
                    }
                    return (
                        <LazyComponentSlot name={componentName}>
                            <Component
                                {...componentProps}
                                onComplete={handleComponentComplete}
                            />
                        </LazyComponentSlot>
                    );
                })()}
                {/* eslint-enable react-hooks/static-components */}
            </div>

            {!requireCompletion || !completed ? (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-600">
                        {requireCompletion
                            ? 'Komponenten gir beskjed når den er fullført. Du kan også markere selv hvis du er ferdig.'
                            : 'Når du er ferdig med øvelsen, klikk for å gå videre.'}
                    </p>
                    <button
                        onClick={handleManualComplete}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Jeg er ferdig
                    </button>
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-900 font-semibold text-sm">
                        Øvelse fullført. Klar for neste steg.
                    </span>
                </div>
            )}
        </motion.div>
    );
};
