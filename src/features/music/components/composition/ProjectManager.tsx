import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, Check, Copy, Music, ChevronRight, Plus, Menu } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../../lib/firebase';
import { ref, get } from 'firebase/database';
import type { Composition } from './types';
import { MY_SONGS_KEY } from './utils';

interface ProjectManagerProps {
    isOpen: boolean;
    onClose: () => void;

    // Active Composition
    activeComposition: Composition;
    activeSongId: string | null;
    isCreator: boolean;
    onRename: (newTitle: string) => void;
    onDelete: (id: string) => Promise<void>;
    shareUrl: string;

    // Library
    onSelect: (id: string) => void;
    onNew: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
    isOpen,
    onClose,
    activeComposition,
    activeSongId,
    isCreator,
    onRename,
    onDelete,
    shareUrl,
    onSelect,
    onNew
}) => {
    const [tempTitle, setTempTitle] = useState(activeComposition.title);
    const [copied, setCopied] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Library State
    const [mySongs, setMySongs] = useState<Composition[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(true);

    // Update temp title when composition changes
    useEffect(() => {
        setTempTitle(activeComposition.title);
    }, [activeComposition.title]);

    // Load Library
    useEffect(() => {
        if (!isOpen) return;

        const loadSongs = async () => {
            setLoadingLibrary(true);
            const rawStorage = localStorage.getItem(MY_SONGS_KEY);
            console.log('[ProjectManager] Loading library. Raw storage:', rawStorage);

            let savedIds: string[] = [];
            try {
                const parsed = JSON.parse(rawStorage || '[]');
                if (Array.isArray(parsed)) savedIds = parsed;
            } catch {
                // Korrupt localStorage - start med tom liste i stedet for å krasje
            }
            const fetchedSongs: Composition[] = [];
            let storageNeedsUpdate = false;
            let finalIds = [...savedIds];

            for (const id of savedIds) {
                console.log('[ProjectManager] Checking ID:', id);
                const songRef = ref(db, `compositions/${id}`);
                try {
                    const snapshot = await get(songRef);
                    const exists = snapshot.exists();
                    console.log(`[ProjectManager] ID ${id} exists in FB:`, exists);

                    if (exists) {
                        const songData = snapshot.val() as Composition;
                        if (songData.id !== id) {
                            console.warn(`[ProjectManager] FIXING MISMATCH: Key ${id} has wrong ID ${songData.id}. Updating FB...`);

                            // 1. Repair Firebase
                            // We trust the KEY (id) as the source of truth for location.
                            // We update the internal ID to match the key.
                            try {
                                const { update } = await import('firebase/database');
                                await update(ref(db, `compositions/${id}`), { id: id });
                                console.log('[ProjectManager] Firebase repaired.');
                            } catch (err) {
                                console.error('[ProjectManager] Failed to repair Firebase:', err);
                            }

                            // 2. Repair Local Object for this render
                            songData.id = id;
                        }
                        fetchedSongs.push(songData);
                    } else {
                        console.warn('[ProjectManager] GHOST DETECTED! Removing:', id);
                        finalIds = finalIds.filter((s: string) => s !== id);
                        storageNeedsUpdate = true;
                    }
                } catch (e) {
                    console.error('Failed to load song', id, e);
                }
            }

            if (storageNeedsUpdate) {
                localStorage.setItem(MY_SONGS_KEY, JSON.stringify(finalIds));
            }

            setMySongs(fetchedSongs.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0)));
            setLoadingLibrary(false);
        };

        loadSongs();
    }, [isOpen]);

    const handleDownloadPng = async () => {
        const toolElement = document.getElementById('composition-tool-content');
        if (!toolElement) return;

        const canvas = await html2canvas(toolElement, {
            scale: 2,
            backgroundColor: '#FDFBF7',
            logging: false,
            useCORS: true
        });

        const link = document.createElement('a');
        link.download = `${activeComposition.title.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!id) return;
        try {
            await onDelete(id);
            console.log('[ProjectManager] Song deleted successfully:', id);

            setDeleteConfirmId(null);

            // Refresh library locally (filter out deleted song)
            setMySongs(prev => prev.filter(s => s.id !== id));

            // If it was the active song, close the menu
            if (id === activeSongId) {
                onClose();
            }
        } catch (e) {
            console.error('[ProjectManager] Failed to delete song:', e);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.95 }}
                    className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl sm:rounded-3xl rounded-t-3xl shadow-2xl border border-white/20 overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100/50 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 text-white rounded-xl">
                                <Menu size={20} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-slate-900 tracking-tighter">Prosjektmeny</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* Active Composition Section */}
                        {activeSongId && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Aktiv Komposisjon</label>

                                <div className="flex flex-col gap-6">
                                    {/* Title Edit */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={tempTitle}
                                            onChange={(e) => setTempTitle(e.target.value)}
                                            onBlur={() => {
                                                if (tempTitle !== activeComposition.title) {
                                                    onRename(tempTitle);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            disabled={!isCreator}
                                            className="w-full bg-transparent font-serif text-3xl font-black text-slate-900 placeholder-slate-300 focus:outline-none border-b-2 border-transparent focus:border-slate-900 transition-all pb-1"
                                            placeholder="Gi sangen et navn..."
                                        />
                                        {!isCreator && <span className="text-[10px] text-slate-400 italic block mt-1">Kun eier kan endre navn</span>}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={copyToClipboard}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                            <span className="text-xs font-bold uppercase tracking-tighter">{copied ? 'Kopiert' : 'Del Link'}</span>
                                        </button>

                                        <button
                                            onClick={handleDownloadPng}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-slate-900 transition-colors"
                                        >
                                            <Download size={16} />
                                            <span className="text-xs font-bold uppercase tracking-tighter">Last ned Bilde</span>
                                        </button>

                                        {isCreator && (
                                            <div className="ml-auto">
                                                {deleteConfirmId === activeSongId ? (
                                                    <div className="flex items-center gap-2 bg-rose-50 px-2 py-1 rounded-lg">
                                                        <span className="text-[10px] font-bold text-rose-700">Sikker?</span>
                                                        <button onClick={() => handleDelete(activeSongId)} className="text-xs font-bold text-rose-600 hover:underline">Ja</button>
                                                        <button onClick={() => setDeleteConfirmId(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Nei</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirmId(activeSongId)}
                                                        className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                        <span className="text-xs font-bold uppercase tracking-tighter">Slett</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Library Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bibliotek</label>
                                <span className="text-[10px] font-bold text-slate-300">{mySongs.length} sanger</span>
                            </div>

                            <button
                                onClick={() => { onNew(); onClose(); }}
                                className="w-full flex items-center gap-3 p-4 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl text-emerald-700 hover:bg-emerald-100 transition-colors group"
                            >
                                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <span className="font-bold uppercase tracking-widest text-[10px]">Opprett ny komposisjon</span>
                            </button>

                            {loadingLibrary ? (
                                <div className="py-8 text-center">
                                    <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-2" />
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Henter sanger...</div>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    {mySongs.map((song) => (
                                        <div
                                            key={song.id}
                                            className={`relative flex items-center justify-between p-3 bg-white border rounded-2xl transition-all group ${song.id === activeSongId ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
                                                }`}
                                        >
                                            <button
                                                onClick={() => { if (song.id !== activeSongId) { onSelect(song.id); onClose(); } }}
                                                className="flex-1 flex items-center gap-3 text-left"
                                            >
                                                <div className={`p-2 rounded-xl transition-colors ${song.id === activeSongId ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-200'}`}>
                                                    <Music size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-serif font-bold text-slate-900 text-sm leading-tight">{song.title}</div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                        <span>
                                                            {song.lastModified || song.createdAt
                                                                ? new Date(
                                                                      song.lastModified ?? song.createdAt!
                                                                  ).toLocaleDateString()
                                                                : 'Ukjent dato'}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{song.sections?.length || 0} deler</span>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 pl-2 border-l border-slate-100 ml-2">
                                                {deleteConfirmId === song.id ? (
                                                    <div className="flex flex-col items-end px-2">
                                                        <span className="text-[9px] text-rose-500 font-bold mb-0.5">Slett?</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleDelete(song.id)} className="text-[10px] font-black hover:text-rose-600">JA</button>
                                                            <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] font-black text-slate-300 hover:text-slate-500">NEI</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirmId(song.id)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Slett sang"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}

                                                {song.id !== activeSongId && (
                                                    <button
                                                        onClick={() => { onSelect(song.id); onClose(); }}
                                                        className="p-2 text-slate-300 hover:text-slate-900 rounded-lg transition-colors"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {mySongs.length === 0 && (
                                        <div className="text-center py-8 text-slate-400">
                                            <p className="text-xs">Ingen lagrede sanger funnet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
