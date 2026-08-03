import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, remove, push, serverTimestamp, onDisconnect, update } from 'firebase/database';
import { db } from '../../../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import type { Composition, Section, Bar, NoteDuration, SectionType, InstrumentType, RhythmNode, SongKey } from './types';
import { getCreatorId, generateShortId, MY_SONGS_KEY } from './utils';
import { calculateNewNodes } from './compositionLogic';

// --- Action Types ---
type CompositionAction =
    | { type: 'SET_TITLE', title: string }
    | { type: 'SET_KEY', key: SongKey | null }
    | { type: 'ADD_SECTION', sectionType: SectionType }
    | { type: 'REMOVE_SECTION', sectionId: string }
    | { type: 'MOVE_SECTION', sectionId: string, overId: string }
    | { type: 'UPDATE_SECTION', sectionId: string, updates: Partial<Section> }
    | { type: 'UPDATE_SECTION_BARS', sectionId: string, count: number }
    | { type: 'UPDATE_BAR_NODES', sectionId: string, barId: string, nodes: RhythmNode[] }
    | { type: 'UPDATE_BAR_LYRICS', sectionId: string, barId: string, text: string }
    | { type: 'ADD_CHORD', sectionId: string, barId: string, beat: number, chord: string }
    | { type: 'UPDATE_CHORD', sectionId: string, barId: string, chordIndex: number, chord: string }
    | { type: 'MOVE_CHORD', sectionId: string, barId: string, chordIndex: number, toBeat: number }
    | { type: 'REMOVE_CHORD', sectionId: string, barId: string, chordIndex: number }
    | { type: 'TOGGLE_INSTRUMENT', sectionId: string, instrument: InstrumentType };

// --- Helper: Find Indices ---
// Ligger på modulnivå og tar komposisjonen som argument. Som funksjon inne i
// hooken ble den laget på nytt hver render, og da stemte ikke deps-lista til
// dispatch med det React Compiler utledet — så compileren hoppet over hooken.
const getIndices = (composition: Composition, sectionId: string, barId?: string) => {
    const sIndex = composition.sections.findIndex(s => s.id === sectionId);
    if (sIndex === -1) return null;

    if (!barId) return { sIndex };

    const bIndex = composition.sections[sIndex].bars.findIndex(b => b.id === barId);
    if (bIndex === -1) return null;

    return { sIndex, bIndex };
};

export const useRealtimeComposition = () => {
    const activeId = new URLSearchParams(window.location.search).get('id');

    // Default / Draft Logic. Utkastet leses én gang ved mount i stedet for i en
    // effect — da er komposisjonen på plass allerede i første render, i stedet for
    // at verktøyet først tegnes tomt og så fylles.
    const [initial] = useState(() => {
        if (activeId) return { composition: null as Composition | null, sectionId: '' };

        const draft = localStorage.getItem('composition_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft) as Composition;
                return { composition: parsed, sectionId: parsed.sections[0]?.id ?? '' };
            } catch (e) { console.error(e); }
        }
        const defaultComp = createDefaultComposition();
        return { composition: defaultComp, sectionId: defaultComp.sections[0].id };
    });

    // --- State ---
    const [composition, setComposition] = useState<Composition | null>(initial.composition);
    const [activeSectionId, setActiveSectionId] = useState<string>(initial.sectionId);
    const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('4n');
    const [isRestMode, setIsRestMode] = useState(false);

    // Sync Status. Med en delt komposisjon starter vi i 'loading' med en gang;
    // et lokalt utkast er ferdig lastet i det samme render.
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>(
        activeId ? 'loading' : 'saved'
    );
    const [activeUsers, setActiveUsers] = useState(0);

    // Refs for internal logic
    const isRemoteUpdate = useRef(false);

    // --- Firebase Sync (Read) ---
    useEffect(() => {
        if (!activeId) return;

        const songRef = ref(db, `compositions/${activeId}`);

        const unsubscribe = onValue(songRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                isRemoteUpdate.current = true;
                setComposition(data);
                setStatus('saved');
            } else {
                // Handle song deleted or not found
                console.warn('Song not found');
                setStatus('error');
            }
        }, (err) => {
            console.error(err);
            setStatus('error');
        });

        // Presence
        const presenceRef = ref(db, `presence/${activeId}`);
        const userPresenceRef = push(presenceRef);
        onValue(presenceRef, (snap) => setActiveUsers(snap.size || 0));
        set(userPresenceRef, { active: true, joinedAt: serverTimestamp() });
        onDisconnect(userPresenceRef).remove();

        return () => {
            unsubscribe();
            onDisconnect(userPresenceRef).cancel();
            set(userPresenceRef, null);
        };
    }, [activeId]);


    // --- Action Dispatcher ---
    const dispatch = useCallback((action: CompositionAction) => {
        if (!composition) return;

        // 1. Optimistic Update (Local)
        const nextComposition = { ...composition };

        // We will construct a Firebase update object here
        // path -> value
        const fbUpdates: Record<string, any> = {};
        const basePath = `compositions/${composition.id}`;

        // If we are in draft mode (no ID), we just update local state and localStorage
        const isDraft = !activeId;

        switch (action.type) {
            case 'SET_TITLE': {
                nextComposition.title = action.title;
                if (!isDraft) fbUpdates[`${basePath}/title`] = action.title;
                break;
            }
            case 'SET_KEY': {
                if (action.key) {
                    nextComposition.key = action.key;
                    if (!isDraft) fbUpdates[`${basePath}/key`] = action.key;
                } else {
                    delete nextComposition.key;
                    if (!isDraft) fbUpdates[`${basePath}/key`] = null;
                }
                break;
            }
            case 'ADD_SECTION': {
                const newSection: Section = {
                    id: uuidv4(),
                    type: action.sectionType,
                    name: action.sectionType.charAt(0).toUpperCase() + action.sectionType.slice(1),
                    repeatCount: 1,
                    color: getSectionColor(action.sectionType),
                    instruments: [],
                    bars: createDefaultBars(4)
                };
                nextComposition.sections = [...nextComposition.sections, newSection];
                setActiveSectionId(newSection.id);

                if (!isDraft) {
                    // Start index is the *next* index
                    const idx = composition.sections.length;
                    fbUpdates[`${basePath}/sections/${idx}`] = newSection;
                }
                break;
            }
            case 'REMOVE_SECTION': {
                const idx = nextComposition.sections.findIndex(s => s.id === action.sectionId);
                if (idx === -1) return;

                nextComposition.sections = nextComposition.sections.filter(s => s.id !== action.sectionId);

                if (!isDraft) {
                    // Removing from array in Firebase is tricky because keys are indices (0, 1, 2).
                    // If we remove '1', we ideally want to shift '2' to '1'.
                    // Firebase doesn't auto-shift arrays effectively with atomic updates.
                    // STRATEGY: For sections, we might need to write the WHOLE `sections` array 
                    // to ensure integrity. It's rare enough.
                    fbUpdates[`${basePath}/sections`] = nextComposition.sections;
                }
                break;
            }
            case 'MOVE_SECTION': {
                const oldIndex = nextComposition.sections.findIndex(s => s.id === action.sectionId);
                const newIndex = nextComposition.sections.findIndex(s => s.id === action.overId);
                if (oldIndex === -1 || newIndex === -1) return;

                const [moved] = nextComposition.sections.splice(oldIndex, 1);
                nextComposition.sections.splice(newIndex, 0, moved);

                if (!isDraft) {
                    // Again, moving implies reordering the array. Write whole sections array.
                    fbUpdates[`${basePath}/sections`] = nextComposition.sections;
                }
                break;
            }
            case 'UPDATE_SECTION': {
                const { sIndex } = getIndices(composition, action.sectionId) || {};
                if (sIndex === undefined) return;

                nextComposition.sections[sIndex] = { ...nextComposition.sections[sIndex], ...action.updates };

                if (!isDraft) {
                    Object.entries(action.updates).forEach(([key, val]) => {
                        fbUpdates[`${basePath}/sections/${sIndex}/${key}`] = val;
                    });
                }
                break;
            }
            case 'UPDATE_SECTION_BARS': {
                const { sIndex } = getIndices(composition, action.sectionId) || {};
                if (sIndex === undefined) return;

                const currentBars = nextComposition.sections[sIndex].bars;
                if (action.count > currentBars.length) {
                    const toAdd = createDefaultBars(action.count - currentBars.length);
                    nextComposition.sections[sIndex].bars = [...currentBars, ...toAdd];
                } else {
                    nextComposition.sections[sIndex].bars = currentBars.slice(0, action.count);
                }

                if (!isDraft) {
                    // Modifying bar count rewrites the bars array for that section
                    fbUpdates[`${basePath}/sections/${sIndex}/bars`] = nextComposition.sections[sIndex].bars;
                }
                break;
            }
            case 'UPDATE_BAR_NODES': {
                const { sIndex, bIndex } = getIndices(composition, action.sectionId, action.barId) || {};
                if (sIndex === undefined || bIndex === undefined) return;

                nextComposition.sections[sIndex].bars[bIndex].nodes = action.nodes;

                if (!isDraft) {
                    fbUpdates[`${basePath}/sections/${sIndex}/bars/${bIndex}/nodes`] = action.nodes;
                }
                break;
            }
            case 'UPDATE_BAR_LYRICS': {
                const { sIndex, bIndex } = getIndices(composition, action.sectionId, action.barId) || {};
                if (sIndex === undefined || bIndex === undefined) return;

                nextComposition.sections[sIndex].bars[bIndex].lyrics = action.text;
                if (!isDraft) {
                    fbUpdates[`${basePath}/sections/${sIndex}/bars/${bIndex}/lyrics`] = action.text;
                }
                break;
            }
            case 'ADD_CHORD': {
                const { sIndex, bIndex } = getIndices(composition, action.sectionId, action.barId) || {};
                if (sIndex === undefined || bIndex === undefined) return;

                const chords = nextComposition.sections[sIndex].bars[bIndex].chords || [];
                const newChords = [...chords, { beatPosition: action.beat, chord: action.chord }];
                nextComposition.sections[sIndex].bars[bIndex].chords = newChords;

                if (!isDraft) {
                    fbUpdates[`${basePath}/sections/${sIndex}/bars/${bIndex}/chords`] = newChords;
                }
                break;
            }
            case 'UPDATE_CHORD': {
                const { sIndex, bIndex } = getIndices(composition, action.sectionId, action.barId) || {};
                if (sIndex === undefined || bIndex === undefined) return;

                const chords = nextComposition.sections[sIndex].bars[bIndex].chords || [];
                if (action.chordIndex < 0 || action.chordIndex >= chords.length) return;

                const newChords = [...chords];
                newChords[action.chordIndex] = { ...newChords[action.chordIndex], chord: action.chord };
                nextComposition.sections[sIndex].bars[bIndex].chords = newChords;

                if (!isDraft) {
                    fbUpdates[`${basePath}/sections/${sIndex}/bars/${bIndex}/chords`] = newChords;
                }
                break;
            }
            case 'MOVE_CHORD': {
                const { sIndex, bIndex } = getIndices(composition, action.sectionId, action.barId) || {};
                if (sIndex === undefined || bIndex === undefined) return;

                const chords = nextComposition.sections[sIndex].bars[bIndex].chords || [];
                if (action.chordIndex < 0 || action.chordIndex >= chords.length) return;
                if (Math.abs(chords[action.chordIndex].beatPosition - action.toBeat) < 0.1) return;

                const newChords = [...chords];
                const moving = { ...newChords[action.chordIndex] };
                // Hvis det allerede ligger en akkord på målslaget — bytt plass (swap)
                const occupantIndex = newChords.findIndex((c, i) =>
                    i !== action.chordIndex && Math.abs(c.beatPosition - action.toBeat) < 0.1
                );
                if (occupantIndex !== -1) {
                    const occupant = { ...newChords[occupantIndex] };
                    newChords[occupantIndex] = { ...occupant, beatPosition: moving.beatPosition };
                }
                newChords[action.chordIndex] = { ...moving, beatPosition: action.toBeat };
                nextComposition.sections[sIndex].bars[bIndex].chords = newChords;

                if (!isDraft) {
                    fbUpdates[`${basePath}/sections/${sIndex}/bars/${bIndex}/chords`] = newChords;
                }
                break;
            }
            case 'REMOVE_CHORD': {
                const { sIndex, bIndex } = getIndices(composition, action.sectionId, action.barId) || {};
                if (sIndex === undefined || bIndex === undefined) return;

                const chords = nextComposition.sections[sIndex].bars[bIndex].chords || [];
                const newChords = [...chords];
                newChords.splice(action.chordIndex, 1);
                nextComposition.sections[sIndex].bars[bIndex].chords = newChords;

                if (!isDraft) {
                    fbUpdates[`${basePath}/sections/${sIndex}/bars/${bIndex}/chords`] = newChords;
                }
                break;
            }
            case 'TOGGLE_INSTRUMENT': {
                const { sIndex } = getIndices(composition, action.sectionId) || {};
                if (sIndex === undefined) return;

                const insts = nextComposition.sections[sIndex].instruments || [];
                const newInsts = insts.includes(action.instrument)
                    ? insts.filter(i => i !== action.instrument)
                    : [...insts, action.instrument];

                nextComposition.sections[sIndex].instruments = newInsts;
                if (!isDraft) {
                    fbUpdates[`${basePath}/sections/${sIndex}/instruments`] = newInsts;
                }
                break;
            }
        }

        // Apply Local State
        setComposition(nextComposition);

        // Apply Draft Logic
        if (isDraft) {
            localStorage.setItem('composition_draft', JSON.stringify(nextComposition));
            return;
        }

        // Execute Firebase Updates
        if (Object.keys(fbUpdates).length > 0) {
            const startTime = Date.now();
            setStatus('saving');
            // We append lastModified to every update
            fbUpdates[`${basePath}/lastModified`] = serverTimestamp();

            update(ref(db), fbUpdates)
                .then(() => {
                    const elapsed = Date.now() - startTime;
                    const MIN_DURATION = 600; // ms

                    if (elapsed < MIN_DURATION) {
                        setTimeout(() => {
                            setStatus('saved');
                        }, MIN_DURATION - elapsed);
                    } else {
                        setStatus('saved');
                    }
                })
                .catch((err) => {
                    console.error("Sync failed", err);
                    setStatus('error');
                    // In a real app, we might trigger a full reload or rollback here
                });
        }

    }, [composition, activeId]);


    // --- Exposed Wrappers (to match old API where possible) ---

    // Explicit title update (usually debounced in UI, but here we just dispatch)
    // The UI component calls this onChange. We should probably debounce the DISPATCH if it's text.
    // Actually, users expect instant feedback in local UI. The *network* call should be debounced?
    // The current dispatch does immediate network call.
    // For "High Frequency" inputs like Title/Lyrics, we should throttle the network part?
    // Implementation Detail: For now, we do immediate updates. 
    // If it lags, we can add a specific debounce middleware.

    // ... wrapping functions ...

    const renameComposition = (title: string) => dispatch({ type: 'SET_TITLE', title });
    const setKey = (key: SongKey | null) => dispatch({ type: 'SET_KEY', key });
    const addSection = (type: SectionType) => dispatch({ type: 'ADD_SECTION', sectionType: type });
    const removeSection = (id: string) => dispatch({ type: 'REMOVE_SECTION', sectionId: id });
    const moveSection = (id: string, overId: string) => dispatch({ type: 'MOVE_SECTION', sectionId: id, overId });
    const updateSection = (id: string, updates: Partial<Section>) => dispatch({ type: 'UPDATE_SECTION', sectionId: id, updates });
    const updateSectionBars = (id: string, count: number) => dispatch({ type: 'UPDATE_SECTION_BARS', sectionId: id, count });

    const updateBar = (sectionId: string, barId: string, nodeIndex: number, newDuration: NoteDuration, isRest: boolean) => {
        // We need to calculate nodes here to create the action payload
        if (!composition) return;
        const { sIndex, bIndex } = getIndices(composition, sectionId, barId) || {};
        if (sIndex === undefined || bIndex === undefined) return;

        const currentNodes = composition.sections[sIndex].bars[bIndex].nodes;
        const newNodes = calculateNewNodes(currentNodes, nodeIndex, newDuration, isRest);

        if (newNodes) {
            dispatch({ type: 'UPDATE_BAR_NODES', sectionId, barId, nodes: newNodes });
        }
    };

    const updateBarLyrics = (sectionId: string, barId: string, text: string) => dispatch({ type: 'UPDATE_BAR_LYRICS', sectionId, barId, text });
    const addChord = (sectionId: string, barId: string, beat: number, chord: string) => dispatch({ type: 'ADD_CHORD', sectionId, barId, beat, chord });
    const updateChord = (sectionId: string, barId: string, chordIndex: number, chord: string) => dispatch({ type: 'UPDATE_CHORD', sectionId, barId, chordIndex, chord });
    const moveChord = (sectionId: string, barId: string, chordIndex: number, toBeat: number) => dispatch({ type: 'MOVE_CHORD', sectionId, barId, chordIndex, toBeat });
    const removeChord = (sectionId: string, barId: string, chordIndex: number) => dispatch({ type: 'REMOVE_CHORD', sectionId, barId, chordIndex });
    const toggleInstrument = (sectionId: string, instrument: InstrumentType) => dispatch({ type: 'TOGGLE_INSTRUMENT', sectionId, instrument });

    // --- Lifecycle Actions ---
    const saveAsNew = async (comp: Composition) => {
        const newId = generateShortId();
        const creatorId = getCreatorId();
        const newComp = {
            ...comp,
            id: newId,
            creatorId,
            createdAt: Date.now(),
            lastModified: Date.now()
        };

        await set(ref(db, `compositions/${newId}`), newComp);

        // Add to local library
        const mySongs = JSON.parse(localStorage.getItem(MY_SONGS_KEY) || '[]');
        if (!mySongs.includes(newId)) {
            localStorage.setItem(MY_SONGS_KEY, JSON.stringify([...mySongs, newId]));
        }
        localStorage.removeItem('composition_draft');

        return newId;
    };

    const deleteSong = async (id: string) => {
        await remove(ref(db, `compositions/${id}`));
        const mySongs = JSON.parse(localStorage.getItem(MY_SONGS_KEY) || '[]');
        const newList = mySongs.filter((s: string) => s !== id);
        localStorage.setItem(MY_SONGS_KEY, JSON.stringify(newList));
    };

    const resetToDefault = () => {
        const def = createDefaultComposition();
        setComposition(def);
        setActiveSectionId(def.sections[0].id);
        localStorage.removeItem('composition_draft');
    };

    const activeSection = composition?.sections.find(s => s.id === activeSectionId);

    return {
        composition: composition || createDefaultComposition(), // fallback
        activeSectionId,
        setActiveSectionId,
        activeSection,
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
    };
};

// --- Helpers ---
const createDefaultComposition = (): Composition => ({
    id: uuidv4(),
    title: 'Ny Sang',
    tempo: 120,
    creatorId: getCreatorId(),
    sections: [
        {
            id: uuidv4(),
            type: 'intro',
            name: 'Intro',
            repeatCount: 1,
            instruments: [],
            color: 'bg-emerald-100',
            bars: createDefaultBars(4)
        }
    ]
});

const createDefaultBars = (count: number): Bar[] => {
    return Array(count).fill(null).map(() => ({
        id: uuidv4(),
        timeSignature: [4, 4],
        nodes: Array(4).fill(null).map(() => ({ id: uuidv4(), type: 'rest', duration: '4n' })),
        chords: []
    }));
};

const getSectionColor = (type: SectionType): string => {
    switch (type) {
        case 'intro': return 'bg-emerald-100';
        case 'verse': return 'bg-blue-100';
        case 'preChorus': return 'bg-pink-100';
        case 'chorus': return 'bg-rose-100';
        case 'bridge': return 'bg-amber-100';
        case 'interlude': return 'bg-teal-100';
        case 'outro': return 'bg-purple-100';
        case 'solo': return 'bg-orange-100';
        default: return 'bg-slate-100';
    }
};
