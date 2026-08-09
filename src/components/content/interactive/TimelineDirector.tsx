import { useState, useCallback, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Film, GripVertical, Trash2, Plus, PenLine } from 'lucide-react';

interface DraftScene {
    title: string;
    description: string;
    icon: string;
    chronologicalOrder: string;
}

const EMPTY_DRAFT: DraftScene = { title: '', description: '', icon: '', chronologicalOrder: '' };

const SCENE_DURATION = 4000;

interface TimelineDirectorProps {
    title?: string;
    scenes: {
        id: string;
        title: string;
        description: string;
        chronologicalOrder: number;
        icon: string;
    }[];
    techniques: {
        id: string;
        name: string;
        icon: string;
        effect: string;
        description: string;
    }[];
    allowCustomScenes?: boolean;
}

type SceneWithTechnique = TimelineDirectorProps['scenes'][number] & {
    techniqueId?: string;
};

type Phase = 'create' | 'edit' | 'playing' | 'result';

const EFFECT_CLASSES: Record<string, string> = {
    sepia: 'sepia brightness-90',
    shake: 'animate-[shake_0.4s_ease-in-out_2]',
    shimmer: 'brightness-125 saturate-150',
    slowmo: 'opacity-70 blur-[1px]',
};

const EFFECT_BG: Record<string, string> = {
    sepia: 'bg-amber-900/20',
    shake: 'bg-red-900/20',
    shimmer: 'bg-cyan-400/20',
    slowmo: 'bg-indigo-900/20',
};

export const TimelineDirector = ({
    title = 'Regissørens klipperom',
    scenes,
    techniques,
    allowCustomScenes,
}: TimelineDirectorProps) => {
    const storageKey = `klipperommet_${(title ?? 'td').toLowerCase().replace(/\s+/g, '_')}`;

    const [customScenes, setCustomScenes] = useState<SceneWithTechnique[]>(() => {
        if (!allowCustomScenes) return [];
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [draft, setDraft] = useState<DraftScene>(EMPTY_DRAFT);
    const [draftError, setDraftError] = useState('');

    const [exampleMode, setExampleMode] = useState<boolean>(() => {
        if (!allowCustomScenes) return false;
        try {
            const saved = localStorage.getItem(storageKey);
            const savedScenes = saved ? JSON.parse(saved) : [];
            return savedScenes.length < 3;
        } catch {
            return true;
        }
    });

    const [phase, setPhase] = useState<Phase>(() => {
        if (!allowCustomScenes) return 'edit';
        try {
            const saved = localStorage.getItem(storageKey);
            const savedScenes = saved ? JSON.parse(saved) : [];
            return savedScenes.length >= 3 ? 'edit' : 'edit';
        } catch {
            return 'edit';
        }
    });

    const [items, setItems] = useState<SceneWithTechnique[]>(() => {
        if (allowCustomScenes) {
            try {
                const saved = localStorage.getItem(storageKey);
                const savedScenes: SceneWithTechnique[] = saved ? JSON.parse(saved) : [];
                if (savedScenes.length >= 3) {
                    return [...savedScenes]
                        .sort(() => Math.random() - 0.5)
                        .map((s) => ({ ...s, techniqueId: undefined }));
                }
            } catch {
                // fall through
            }
            // No saved custom scenes — show the example (Lena's scenes)
            return [...scenes].sort(() => Math.random() - 0.5);
        }
        return [...scenes].sort(() => Math.random() - 0.5);
    });

    const [activeScene, setActiveScene] = useState(-1);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (allowCustomScenes) {
            localStorage.setItem(storageKey, JSON.stringify(customScenes));
        }
    }, [customScenes, storageKey, allowCustomScenes]);

    const assignTechnique = (sceneId: string, techniqueId: string) => {
        setItems((prev) =>
            prev.map((s) =>
                s.id === sceneId
                    ? { ...s, techniqueId: s.techniqueId === techniqueId ? undefined : techniqueId }
                    : s
            )
        );
    };

    const getTechnique = (id?: string) => techniques.find((t) => t.id === id);

    const addScene = () => {
        setDraftError('');
        if (!draft.title.trim()) {
            setDraftError('Tittel er påkrevd.');
            return;
        }
        if (!draft.description.trim()) {
            setDraftError('Beskrivelse er påkrevd.');
            return;
        }
        if ([...draft.icon].length !== 1) {
            setDraftError('Ikon må være én emoji.');
            return;
        }
        const order = parseInt(draft.chronologicalOrder, 10);
        if (!draft.chronologicalOrder || isNaN(order) || order < 1 || order > 99) {
            setDraftError('Kronologisk rekkefølge må være et tall mellom 1 og 99.');
            return;
        }
        if (customScenes.length >= 6) {
            setDraftError('Maks 6 scener.');
            return;
        }
        const newScene: SceneWithTechnique = {
            id: `custom-${Date.now()}`,
            title: draft.title.trim(),
            description: draft.description.trim(),
            icon: draft.icon,
            chronologicalOrder: order,
        };
        setCustomScenes((prev) => [...prev, newScene]);
        setDraft(EMPTY_DRAFT);
    };

    const deleteScene = (id: string) => {
        setCustomScenes((prev) => prev.filter((s) => s.id !== id));
    };

    const enterEditPhase = () => {
        if (customScenes.length < 3) return;
        const shuffled = [...customScenes]
            .sort(() => Math.random() - 0.5)
            .map((s) => ({ ...s, techniqueId: undefined }));
        setItems(shuffled);
        setPhase('edit');
    };

    const calculateScore = useCallback(() => {
        let s = 0;
        const first = items[0];
        if (first.chronologicalOrder >= 3) s += 25;
        const hasAnyTechnique = items.some((i) => i.techniqueId);
        if (hasAnyTechnique) s += 15;
        const uniqueTechniques = new Set(items.filter((i) => i.techniqueId).map((i) => i.techniqueId));
        s += Math.min(uniqueTechniques.size * 10, 30);
        const isNotChronological = !items.every(
            (item, idx) => idx === 0 || item.chronologicalOrder >= items[idx - 1].chronologicalOrder
        );
        if (isNotChronological) s += 20;
        const last = items[items.length - 1];
        if (last.chronologicalOrder === Math.max(...items.map((i) => i.chronologicalOrder))) s += 10;
        return Math.min(s, 100);
    }, [items]);

    const playSequence = async () => {
        setPhase('playing');
        for (let i = 0; i < items.length; i++) {
            setActiveScene(i);
            await new Promise((r) => setTimeout(r, SCENE_DURATION));
        }
        setActiveScene(-1);
        const finalScore = calculateScore();
        setScore(finalScore);
        setPhase('result');
        if (finalScore >= 70) {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
        }
    };

    const reset = (goToCreate = false) => {
        setActiveScene(-1);
        setScore(0);
        if (goToCreate) {
            setExampleMode(false);
            setCustomScenes([]);
            localStorage.removeItem(storageKey);
            setDraft(EMPTY_DRAFT);
            setDraftError('');
            setItems([]);
            setPhase('create');
        } else if (exampleMode) {
            setItems(
                [...scenes].sort(() => Math.random() - 0.5).map((s) => ({ ...s, techniqueId: undefined }))
            );
            setPhase('edit');
        } else if (allowCustomScenes) {
            setItems(
                [...customScenes]
                    .sort(() => Math.random() - 0.5)
                    .map((s) => ({ ...s, techniqueId: undefined }))
            );
            setPhase('edit');
        } else {
            setItems(
                [...scenes].sort(() => Math.random() - 0.5).map((s) => ({ ...s, techniqueId: undefined }))
            );
            setPhase('edit');
        }
    };

    const meterColor = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
    const meterLabel = score >= 70 ? 'Mesterlig!' : score >= 40 ? 'Lovende klipp' : 'Trenger mer dramatikk';
    const labelColor =
        score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-rose-600';

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-2xl mx-auto my-6">
            {/* Header bar */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center gap-3">
                <div className="bg-amber-500 rounded-lg p-2">
                    <Film className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-slate-400 text-sm">
                        {phase === 'create'
                            ? 'Skriv inn scenene fra din egen fortelling'
                            : exampleMode
                              ? 'Se eksempelet — dra scenene i din foretrukne rekkefølge'
                              : 'Dra scenene i den rekkefølgen du vil fortelle'}
                    </p>
                </div>
            </div>

            <div className="p-5">
                {phase === 'create' && (
                    <div>
                        <p className="text-slate-600 text-sm mb-4">
                            Skriv inn minst 3 scener fra fortellingen din. Du angir selv hvilken
                            kronologisk rekkefølge de hører hjemme i — det er kjernen i øvelsen!
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: form */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">
                                        Tittel
                                    </label>
                                    <input
                                        type="text"
                                        value={draft.title}
                                        onChange={(e) =>
                                            setDraft((d) => ({ ...d, title: e.target.value }))
                                        }
                                        placeholder="Kort tittel på scenen"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">
                                        Beskrivelse
                                    </label>
                                    <textarea
                                        value={draft.description}
                                        onChange={(e) =>
                                            setDraft((d) => ({ ...d, description: e.target.value }))
                                        }
                                        placeholder="Hva skjer i denne scenen?"
                                        rows={3}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-slate-600 block mb-1">
                                            Ikon (én emoji)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={draft.icon}
                                                onChange={(e) =>
                                                    setDraft((d) => ({ ...d, icon: e.target.value }))
                                                }
                                                placeholder="🎭"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                            />
                                            {draft.icon && (
                                                <span className="text-2xl">{draft.icon}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-slate-600 block mb-1">
                                            Kronologisk nr. (1–99)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={99}
                                            value={draft.chronologicalOrder}
                                            onChange={(e) =>
                                                setDraft((d) => ({
                                                    ...d,
                                                    chronologicalOrder: e.target.value,
                                                }))
                                            }
                                            placeholder="1"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                    </div>
                                </div>
                                {draftError && (
                                    <p className="text-rose-600 text-xs">{draftError}</p>
                                )}
                                <button
                                    onClick={addScene}
                                    disabled={customScenes.length >= 6}
                                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors w-full justify-center"
                                >
                                    <Plus className="w-4 h-4" /> Legg til scene
                                </button>
                            </div>

                            {/* Right: scene list */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-500">
                                        {customScenes.length}/6 scener · min 3
                                    </span>
                                    {customScenes.length >= 1 && (
                                        <button
                                            onClick={() => {
                                                setCustomScenes([]);
                                                localStorage.removeItem(storageKey);
                                                setDraft(EMPTY_DRAFT);
                                                setDraftError('');
                                            }}
                                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Nullstill
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {customScenes.map((s, idx) => (
                                        <div
                                            key={s.id}
                                            className="flex items-start gap-2 bg-slate-50 rounded-lg border border-slate-200 p-3"
                                        >
                                            <span className="text-lg mt-0.5">{s.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-slate-800 truncate">
                                                    {idx + 1}. {s.title}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {s.description}
                                                </p>
                                                <p className="text-xs text-amber-600 mt-0.5">
                                                    Kronologisk: {s.chronologicalOrder}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => deleteScene(s.id)}
                                                className="text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0 mt-0.5"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {Array.from({
                                        length: Math.max(0, 3 - customScenes.length),
                                    }).map((_, i) => (
                                        <div
                                            key={`empty-${i}`}
                                            className="border-2 border-dashed border-slate-200 rounded-lg p-3 flex items-center justify-center"
                                        >
                                            <span className="text-xs text-slate-300">
                                                Scene {customScenes.length + i + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-center">
                            <button
                                onClick={enterEditPhase}
                                disabled={customScenes.length < 3}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-lg transition-colors"
                            >
                                <Film className="w-4 h-4" /> Klar til klipperommet!
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'edit' && (
                    <>
                        {exampleMode && allowCustomScenes && (
                            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                                📽️ Dette er et eksempel — se hvordan scenene kan settes sammen!
                            </div>
                        )}
                        <Reorder.Group
                            axis="y"
                            values={items}
                            onReorder={setItems}
                            className="space-y-3"
                        >
                            {items.map((scene, idx) => {
                                return (
                                    <Reorder.Item
                                        key={scene.id}
                                        value={scene}
                                        className="bg-white rounded-xl border-2 border-slate-200 hover:border-amber-300
                                            cursor-grab active:cursor-grabbing select-none transition-colors"
                                        whileDrag={{
                                            scale: 1.02,
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                        }}
                                    >
                                        <div className="flex items-start gap-3 p-4">
                                            {/* Left: number + grip */}
                                            <div className="flex flex-col items-center gap-1 pt-0.5">
                                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                                                    {idx + 1}
                                                </div>
                                                <GripVertical className="w-4 h-4 text-slate-300" />
                                            </div>

                                            {/* Center: content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{scene.icon}</span>
                                                    <p className="font-bold text-slate-800">
                                                        {scene.title}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {scene.description}
                                                </p>

                                                {/* Technique pills */}
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {techniques.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                assignTechnique(scene.id, t.id);
                                                            }}
                                                            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                                                                scene.techniqueId === t.id
                                                                    ? 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold'
                                                                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            {t.icon} {t.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                        <div className="flex justify-center gap-3 mt-5 flex-wrap">
                            <button
                                onClick={playSequence}
                                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white
                                    font-bold px-6 py-2.5 rounded-lg transition-colors"
                            >
                                <Play className="w-4 h-4" /> Spill av!
                            </button>
                            {exampleMode && allowCustomScenes && (
                                <button
                                    onClick={() => {
                                        setExampleMode(false);
                                        setCustomScenes([]);
                                        setItems([]);
                                        setDraft(EMPTY_DRAFT);
                                        setDraftError('');
                                        setPhase('create');
                                    }}
                                    className="flex items-center gap-2 bg-white border border-amber-300 text-amber-700
                                        hover:bg-amber-50 font-semibold px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    <PenLine className="w-4 h-4" /> Lag din egen fortelling
                                </button>
                            )}
                        </div>
                    </>
                )}

                {phase === 'playing' && (
                    <div className="flex flex-col items-center py-6">
                        <p className="text-slate-500 text-sm mb-4">Avspilling...</p>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                            <AnimatePresence mode="wait">
                                {items.map((scene, idx) => {
                                    if (idx !== activeScene) return null;
                                    const tech = getTechnique(scene.techniqueId);
                                    const effectCls = tech ? EFFECT_CLASSES[tech.effect] || '' : '';
                                    const bgCls = tech ? EFFECT_BG[tech.effect] || '' : '';
                                    return (
                                        <motion.div
                                            key={scene.id}
                                            initial={{ opacity: 0, x: 60 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -60 }}
                                            transition={{ duration: 0.5 }}
                                            className={`absolute inset-0 flex flex-col items-center justify-center
                                                p-8 text-center ${bgCls} ${effectCls}`}
                                        >
                                            <span className="text-5xl mb-3">{scene.icon}</span>
                                            <p className="text-white font-bold text-xl">
                                                {scene.title}
                                            </p>
                                            <p className="text-slate-300 text-sm mt-1">
                                                {scene.description}
                                            </p>
                                            {tech && (
                                                <span className="mt-3 text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full">
                                                    {tech.icon} {tech.name}
                                                </span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <motion.div
                                key={`progress-${activeScene}`}
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: SCENE_DURATION / 1000, ease: 'linear' }}
                                className="absolute bottom-0 left-0 h-1 bg-amber-400 rounded-full"
                            />
                        </div>
                        <div className="flex gap-1.5 mt-4">
                            {items.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                        i === activeScene
                                            ? 'bg-amber-400'
                                            : i < activeScene
                                              ? 'bg-amber-200'
                                              : 'bg-slate-200'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {phase === 'result' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-6 space-y-5"
                    >
                        {/* Score card */}
                        <div className="bg-gradient-to-br from-amber-50 to-indigo-50 rounded-xl border border-amber-200/60 p-6 text-center">
                            <p className="text-slate-500 text-sm mb-3">Drama-meter</p>
                            <div className="w-full max-w-xs mx-auto bg-slate-100 rounded-full h-5 overflow-hidden mb-3">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${meterColor}`}
                                />
                            </div>
                            <p className="text-4xl font-bold text-slate-800">{score} / 100</p>
                            <p className={`font-semibold mt-1 ${labelColor}`}>{meterLabel}</p>
                        </div>

                        {/* Tip card */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
                            <p className="text-slate-600 text-sm">
                                Tips: Start med en scene fra midten for spenning, bruk ulike
                                teknikker, og bryt kronologien!
                            </p>
                        </div>

                        <div className="flex justify-center gap-3 flex-wrap">
                            <button
                                onClick={() => reset()}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500
                                    text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Prøv igjen
                            </button>
                            {exampleMode && allowCustomScenes && (
                                <button
                                    onClick={() => {
                                        setExampleMode(false);
                                        setCustomScenes([]);
                                        setItems([]);
                                        setDraft(EMPTY_DRAFT);
                                        setDraftError('');
                                        setPhase('create');
                                    }}
                                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400
                                        text-white font-bold px-6 py-2.5 rounded-full transition-colors"
                                >
                                    <PenLine className="w-4 h-4" /> Lag din egen fortelling
                                </button>
                            )}
                            {!exampleMode && allowCustomScenes && (
                                <button
                                    onClick={() => reset(true)}
                                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600
                                        text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
                                >
                                    <PenLine className="w-4 h-4" /> Lag ny fortelling
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
