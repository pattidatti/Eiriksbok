import React from 'react';
import { NotebookPen } from 'lucide-react';
import { usePhilosophyProfile } from '../../../../hooks/usePhilosophyProfile';
import { findQuestConfig } from '../../../../data/philosophy/questRegistry';

// Tenkedagboken: elevens egne svar på refleksjonsspørsmålene, samlet per
// dialog. Rendres ikke i det hele tatt før det finnes minst ett svar.
export const ReflectionJournal: React.FC = () => {
    const { reflections } = usePhilosophyProfile();

    const entries = Object.entries(reflections)
        .map(([questId, answers]) => ({
            questId,
            title: findQuestConfig(questId)?.title ?? questId,
            answers: (answers ?? []).filter((r) => r && r.a.trim()),
        }))
        .filter((e) => e.answers.length > 0);

    if (entries.length === 0) return null;

    return (
        <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
                <NotebookPen size={14} className="text-indigo-500" />
                <h3 className="font-bold text-sm">Tenkedagbok</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Dine egne tanker fra dialogene.</p>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {entries.map((entry) => (
                    <div key={entry.questId}>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
                            {entry.title}
                        </p>
                        <div className="space-y-2">
                            {entry.answers.map((r, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[11px] text-slate-400 font-serif italic leading-snug mb-1">
                                        {r.q}
                                    </p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{r.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
