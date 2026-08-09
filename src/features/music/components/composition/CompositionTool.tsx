import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Share2, Menu, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeComposition } from './useRealtimeComposition';
import { getCreatorId } from './utils';
import { RhythmPalette } from './RhythmPalette';
import { ProjectManager } from './ProjectManager';
import { SectionAdder } from './SectionAdder';
import { KeySelector } from './KeySelector';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SectionItem } from './SectionItem';

export const CompositionTool: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const songId = searchParams.get('id');

    const {
        composition,
        // activeSectionId, // Unused
        // setActiveSectionId, // Unused
        // activeSection, // Unused
        selectedDuration,
        setSelectedDuration,
        isRestMode,
        setIsRestMode,
        status,
        activeUsers,

        // Actions
        renameComposition,
        setKey,
        addSection,
        removeSection,
        moveSection,
        updateSection,
        updateSectionBars,
        updateBar,
        updateBarLyrics,
        addChord,
        updateChord,
        moveChord,
        removeChord,
        toggleInstrument,

        // Lifecycle
        saveAsNew,
        deleteSong,
        resetToDefault
    } = useRealtimeComposition();

    // Map status to legacy isLoading for UI compatibility (or enhance UI)
    const isLoading = status === 'loading';

    // Update browser title
    useEffect(() => {
        document.title = composition?.title ? `${composition.title} | Komposisjon` : 'Komposisjon';
        return () => {
            document.title = 'Komposisjon';
        };
    }, [composition?.title]);

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            moveSection(String(active.id), String(over!.id));
        }
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNamingOpen, setIsNamingOpen] = useState(false);
    const [pendingName, setPendingName] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const isCreator = composition?.creatorId === getCreatorId();

    const handleSaveAsNew = async () => {
        if (!pendingName.trim() || !composition) return;

        console.log('Saving as new:', pendingName);
        const newId = await saveAsNew({
            ...composition,
            title: pendingName
        });
        console.log('Saved with ID:', newId);
        setSearchParams({ id: newId });
        setIsNamingOpen(false);
        setPendingName('');
    };

    const handleSelectSong = (id: string) => {
        setSearchParams({ id });
    };

    const handleDeleteSong = async (id: string) => {
        await deleteSong(id);
        if (id === songId) {
            setSearchParams({});
            setIsMenuOpen(false);
            resetToDefault();
        }
    };

    const handleShare = () => {
        if (songId) {
            const url = window.location.origin + window.location.pathname + `?id=${songId}`;
            navigator.clipboard.writeText(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } else {
            setPendingName(composition.title);
            setIsNamingOpen(true);
        }
    }

    const handleTitleChange = (newTitle: string) => {
        renameComposition(newTitle);
    };

    const handleTitleBlur = () => {
        if (!songId && composition.title.trim() !== 'Ny Sang') {
            // Optional: Auto-save draft logic could go here
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-[#FDFBF7] relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            {/* Header Area */}
            <div className="px-5 py-4 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 z-50 sticky top-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Editable Title */}
                    <div className="relative z-10 group/title flex items-center gap-2">
                        <input
                            ref={titleInputRef}
                            value={composition.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                            className="bg-transparent font-serif font-black text-2xl text-slate-900 outline-none border-b-2 border-transparent focus:border-slate-900 transition-colors min-w-[150px] placeholder-slate-300"
                            placeholder="Gi sangen et navn..."
                        />

                        {/* Share Button (Only visible if saved, or use it to save) */}
                        <button
                            onClick={handleShare}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all ml-2
                                ${isCopied
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md active:scale-95'
                                }
                            `}
                        >
                            {isCopied ? <Check size={14} /> : <Share2 size={14} />}
                            <span>{isCopied ? 'Kopiert!' : 'Del'}</span>
                        </button>

                        {/* Tonart-velger */}
                        <KeySelector value={composition.key} onChange={setKey} />
                    </div>

                    {/* Presence Bubble */}
                    {songId ? (
                        <div className="flex items-center gap-2 ml-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm animate-pulse">
                                <Users size={12} className="fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">{activeUsers} aktive</span>
                            </div>

                            {/* Sync Status - Avant Garde Pulse */}
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${status === 'saving' ? 'bg-amber-400 animate-pulse' :
                                    status === 'error' ? 'bg-red-500' :
                                        'bg-emerald-400'
                                    }`} />
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${status === 'saving' ? 'text-amber-500' :
                                        status === 'error' ? 'text-red-500' :
                                            'text-emerald-600'
                                    }`}>
                                    {status === 'saving' ? 'Lagrer...' :
                                        status === 'error' ? 'Feil' :
                                            'Lagret'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setPendingName(composition.title);
                                setIsNamingOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200/50 shadow-sm hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer group active:scale-95 ml-2"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Utkast — Trykk for å lagre</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">


                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-black hover:shadow-lg transition-all flex items-center gap-2"
                        title="Prosjektmeny"
                    >
                        <Menu size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Meny</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div id="composition-tool-content" className="flex-1 overflow-y-auto relative px-5 py-6 scroll-smooth pb-40">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FDFBF7] z-30">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Åpner sang...</span>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-6">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={composition.sections.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {composition.sections.map((section) => (
                                    <SectionItem
                                        key={section.id}
                                        section={section}
                                        selectedDuration={selectedDuration}
                                        isRestMode={isRestMode}
                                        songKey={composition.key}
                                        updateSection={updateSection}
                                        updateSectionBars={updateSectionBars}
                                        updateBar={updateBar}
                                        addChord={addChord}
                                        updateChord={updateChord}
                                        moveChord={moveChord}
                                        removeChord={removeChord}
                                        toggleInstrument={toggleInstrument}
                                        removeSection={removeSection}
                                        onUpdateLyrics={updateBarLyrics}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        <SectionAdder onAddSection={addSection} />

                        <div className="h-20 flex flex-col items-center justify-center pt-8 opacity-40">
                            <div className="text-slate-300 italic text-sm">— Slutt på komposisjon —</div>
                        </div>

                    </div>
                )}
            </div>

            {/* Project Manager Modal */}
            <ProjectManager
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                activeComposition={composition}
                activeSongId={songId}
                isCreator={isCreator}
                onRename={renameComposition}
                onDelete={handleDeleteSong}
                shareUrl={window.location.origin + window.location.pathname + (songId ? `?id=${songId}` : '')}
                onSelect={handleSelectSong}
                onNew={() => {
                    resetToDefault();
                    setSearchParams({});
                    setPendingName('Ny Sang');
                    setIsNamingOpen(true);
                }}
            />

            {/* Floating Palette */}
            {!isLoading && (
                <RhythmPalette
                    selectedDuration={selectedDuration}
                    isRestMode={isRestMode}
                    onSelectDuration={setSelectedDuration}
                    onToggleRestMode={() => setIsRestMode(!isRestMode)}
                />
            )}

            {/* Naming Modal */}
            <AnimatePresence>
                {isNamingOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNamingOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-slate-100"
                        >
                            <h3 className="text-2xl font-serif font-black text-slate-900 tracking-tighter mb-6">Navngi sangen din</h3>
                            <input
                                autoFocus
                                type="text"
                                value={pendingName}
                                onChange={(e) => setPendingName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveAsNew()}
                                placeholder="Min nye komposisjon..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 mb-6 font-serif text-lg"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsNamingOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-colors"
                                >
                                    Avbryt
                                </button>
                                <button
                                    onClick={handleSaveAsNew}
                                    disabled={!pendingName.trim()}
                                    className="flex-[2] py-3 px-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    Lagre sang
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-0" />
        </div>
    );
};
