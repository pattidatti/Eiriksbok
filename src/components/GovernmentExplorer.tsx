import * as React from 'react';
import { useState, useCallback, useMemo, memo } from 'react';
import { Quiz } from './Quiz';
import type { Lesson } from '../types';
import {
    SparklesIcon,
    ScaleIcon,
    AcademicCapIcon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

// Internal Imports
import { definitionsMap } from '../data/governmentData';
import { ExplorerControls as ExplorerControlsBase } from './government/ExplorerControls';
import { ExplorerResult as ExplorerResultBase } from './government/ExplorerResult';
import { Maktbalanse as MaktbalanseBase } from './government/Maktbalanse';
import { GlossarySection as GlossarySectionBase } from './government/GlossarySection';

// Memoized sub-components
const ExplorerControls = memo(ExplorerControlsBase);
const ExplorerResult = memo(ExplorerResultBase);
const Maktbalanse = memo(MaktbalanseBase);
const GlossarySection = memo(GlossarySectionBase);

interface GovernmentExplorerProps {
    lesson?: Lesson;
}

export const GovernmentExplorer: React.FC<GovernmentExplorerProps> = ({ lesson }) => {
    const [activeTab, setActiveTab] = useState<'utforsk' | 'quiz' | 'fagbegreper' | 'maktbalanse'>('utforsk');
    const [searchQuery, setSearchQuery] = useState('');

    // --- Explorer State ---
    const [whoRules, setWhoRules] = useState<'ingen' | 'en' | 'få' | 'alle' | null>(null);
    const [anarchyType, setAnarchyType] = useState<'kapital' | 'felles' | null>(null);
    const [oneRulerSource, setOneRulerSource] = useState<'arv' | 'makt' | null>(null);
    const [monarchyType, setMonarchyType] = useState<'absolutt' | 'konstitusjonelt' | null>(null);
    const [dictatorType, setDictatorType] = useState<'person' | 'militær' | 'parti' | null>(null);
    const [dictatorScope, setDictatorScope] = useState<'politikk' | 'alt' | null>(null);
    const [fewRulerType, setFewRulerType] = useState<'rike' | 'penger' | 'adel' | 'tyv' | 'eksperter' | 'religion' | null>(null);
    const [demoMethod, setDemoMethod] = useState<'direkte' | 'representanter' | null>(null);
    const [headOfState, setHeadOfState] = useState<'konge' | 'president' | null>(null);
    const [powerRelation, setPowerRelation] = useState<'parlamentarisk' | 'separat' | null>(null);

    // --- Maktbalanse State ---
    const [balanceSystem, setBalanceSystem] = useState<'parlamentarisk' | 'maktfordeling'>('parlamentarisk');
    const [govStatus, setGovStatus] = useState<'sitter' | 'felt'>('sitter');
    const [triggerAction, setTriggerAction] = useState(false);

    // Resultat-utregning Explorer (Optimized with useMemo and Map)
    const result = useMemo(() => {
        if (!whoRules) return null;
        if (whoRules === 'ingen') {
            if (anarchyType === 'kapital') return definitionsMap.get('anarko_kap') || null;
            if (anarchyType === 'felles') return definitionsMap.get('anarko_kom') || null;
            return definitionsMap.get('anarki') || null;
        }
        if (whoRules === 'en') {
            if (oneRulerSource === 'arv') {
                if (monarchyType === 'absolutt') return definitionsMap.get('monarki_abs') || null;
                return definitionsMap.get('monarki') || null;
            }
            if (oneRulerSource === 'makt') {
                if (dictatorType === 'militær') return definitionsMap.get('junta') || null;
                if (dictatorType === 'parti') return definitionsMap.get('ettpartistat') || null;
                if (dictatorScope === 'alt') return definitionsMap.get('diktatur_tot') || null;
                if (dictatorScope === 'politikk') return definitionsMap.get('diktatur_aut') || null;
                return definitionsMap.get('diktatur') || null;
            }
        }
        if (whoRules === 'få') {
            if (fewRulerType === 'religion') return definitionsMap.get('teokrati') || null;
            if (fewRulerType === 'eksperter') return definitionsMap.get('meritokrati') || null;
            if (fewRulerType === 'penger') return definitionsMap.get('plutokrati') || null;
            if (fewRulerType === 'adel') return definitionsMap.get('aristokrati') || null;
            if (fewRulerType === 'tyv') return definitionsMap.get('kleptokrati') || null;
            return definitionsMap.get('oligarki') || null;
        }
        if (whoRules === 'alle') {
            if (demoMethod === 'direkte') return definitionsMap.get('demokrati_dir') || null;
            if (demoMethod === 'representanter') {
                if (headOfState === 'konge') return definitionsMap.get('monarki') || null;
                if (headOfState === 'president') {
                    if (powerRelation === 'separat') return definitionsMap.get('pres_republikk') || null;
                    if (powerRelation === 'parlamentarisk') return definitionsMap.get('parl_republikk') || null;
                    return definitionsMap.get('republikk') || null;
                }
                return definitionsMap.get('demokrati_rep') || null;
            }
        }
        return null;
    }, [
        whoRules, anarchyType, oneRulerSource, monarchyType,
        dictatorType, dictatorScope, fewRulerType, demoMethod,
        headOfState, powerRelation
    ]);

    const resetBranch = useCallback(() => {
        setAnarchyType(null);
        setOneRulerSource(null);
        setMonarchyType(null);
        setDictatorType(null);
        setDictatorScope(null);
        setFewRulerType(null);
        setDemoMethod(null);
        setHeadOfState(null);
        setPowerRelation(null);
    }, []);

    // Reset maktbalanse når man bytter tab. Justeres under render i stedet for i
    // en effect, så fanen aldri vises ett bilde med forrige tilstand.
    const [prevTab, setPrevTab] = useState(activeTab);
    if (activeTab !== prevTab) {
        setPrevTab(activeTab);
        if (activeTab === 'maktbalanse') {
            setGovStatus('sitter');
            setTriggerAction(false);
        }
    }

    // --- Maktbalanse Actions ---
    const handleMistillit = useCallback(() => {
        setTriggerAction(true);
        if (balanceSystem === 'parlamentarisk') {
            setTimeout(() => setGovStatus('felt'), 600);
        } else {
            setTimeout(() => setTriggerAction(false), 2000);
        }
    }, [balanceSystem]);

    const resetMistillit = useCallback(() => {
        setGovStatus('sitter');
        setTriggerAction(false);
    }, []);

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8">

            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Samfunnsbyggeren</h1>
                    <p className="text-slate-500">Utforsk styringsformer, makt og økonomi</p>
                </div>
                <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    {([
                        { id: 'utforsk', label: 'Utforsker', icon: SparklesIcon },
                        { id: 'maktbalanse', label: 'Maktbalanse', icon: ScaleIcon },
                        { id: 'quiz', label: 'Quiz', icon: AcademicCapIcon },
                        { id: 'fagbegreper', label: 'Fagbegreper', icon: BuildingLibraryIcon }
                    ] as const).filter(tab => tab.id !== 'quiz' || !!lesson).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">

                {/* === MODUS: UTFORSK === */}
                {activeTab === 'utforsk' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <ExplorerControls
                            whoRules={whoRules} setWhoRules={setWhoRules}
                            anarchyType={anarchyType} setAnarchyType={setAnarchyType}
                            oneRulerSource={oneRulerSource} setOneRulerSource={setOneRulerSource}
                            monarchyType={monarchyType} setMonarchyType={setMonarchyType}
                            dictatorType={dictatorType} setDictatorType={setDictatorType}
                            dictatorScope={dictatorScope} setDictatorScope={setDictatorScope}
                            fewRulerType={fewRulerType} setFewRulerType={setFewRulerType}
                            demoMethod={demoMethod} setDemoMethod={setDemoMethod}
                            headOfState={headOfState} setHeadOfState={setHeadOfState}
                            powerRelation={powerRelation} setPowerRelation={setPowerRelation}
                            resetBranch={resetBranch}
                        />
                        <ExplorerResult result={result} />
                    </div>
                )}

                {/* === MODUS: MAKTBALANSE === */}
                {activeTab === 'maktbalanse' && (
                    <Maktbalanse
                        balanceSystem={balanceSystem} setBalanceSystem={setBalanceSystem}
                        govStatus={govStatus} setGovStatus={setGovStatus}
                        triggerAction={triggerAction} setTriggerAction={setTriggerAction}
                        handleMistillit={handleMistillit} resetMistillit={resetMistillit}
                    />
                )}

                {/* === MODUS: QUIZ === */}
                {activeTab === 'quiz' && (
                    <div className="max-w-3xl mx-auto w-full">
                        <Quiz questions={lesson?.quiz || []} />
                    </div>
                )}

                {/* === MODUS: FAGBEGREPER === */}
                {activeTab === 'fagbegreper' && (
                    <GlossarySection
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                )}

            </div>
        </div>
    );
};

export default GovernmentExplorer;

// Tailwind-safelista for de dynamiske gradientklassene ligger i
// ./governmentExplorerSafelist.ts (en komponentfil skal bare eksportere
// komponenter — ellers mister Vite fast refresh for hele fila).
