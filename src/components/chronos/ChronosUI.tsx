import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Heart, Zap, Scroll, Skull, Crown, Star, ArrowRight, Backpack,
    BookOpen, X, Map as MapIcon, Users, Hammer, Scale, Activity, Brain, Lightbulb,
    ExternalLink, Mail, Feather, PenLine, GitBranch, ArrowLeft, RotateCcw, Flag,
    Play, Pause, TrendingUp, TrendingDown, Compass, Lock, CheckCircle, type LucideIcon } from 'lucide-react';
import type {
    ChronosNode, ChronosChoice, ChronosStat, ChronosConfig, ChronosEnvironment,
    ChronosEntry, ChronosMapPoint, ChronosRecipe, ChronosDiscoveryEvent,
    ChronosEpilogue, ChronosEthicsLens, ChronosItem, ChoiceHistoryEntry,
    ChronosCondition, ChronosPerspective, ChronosGameOverCondition,
} from '../../data/chronos/types';
import { DiceGame } from './minigames/DiceGame';
import { BattleGame } from './minigames/BattleGame';
import { JusticeGame } from './minigames/JusticeGame';
import { TelegramGame } from './minigames/TelegramGame';
import { AllocationGame } from './minigames/AllocationGame';
import { CrowdPressureGame } from './minigames/CrowdPressureGame';
import { SpeechGame } from './minigames/SpeechGame';
import { IntrigueGame } from './minigames/IntrigueGame';
import { TriageGame } from './minigames/TriageGame';
import { CensorGame } from './minigames/CensorGame';
import { GasMaskGame } from './minigames/GasMaskGame';
import { RationingGame } from './minigames/RationingGame';
import { SignalGame } from './minigames/SignalGame';
import { PropagandaGame } from './minigames/PropagandaGame';
import { DominoGame } from './minigames/DominoGame';
import { EndComparisonScreen } from './EndComparisonScreen';
import { CraftingModal } from './CraftingModal';
import { ChronosMap } from './ChronosMap';
import { ItemInspectModal } from './ItemInspectModal';

interface ChronosUIProps {
    node: ChronosNode;
    stats: ChronosStat[];
    inventory?: string[];
    environment?: Partial<ChronosEnvironment>;
    choiceHistory?: ChoiceHistoryEntry[];
    journal?: ChronosEntry[];
    onAddJournalEntry?: (text: string) => void;
    config: ChronosConfig;
    flags?: string[];
    onChoice: (choice: ChronosChoice) => void;
    onRestart?: () => void;
    onCraft?: (recipe: ChronosRecipe) => void;
    scenarioTitle?: string;
    scenarioMeta?: string;
    scenarioId?: string;
    perspectives?: Record<string, ChronosPerspective>;
    onExit?: () => void;
    onRequestReset?: () => void;
    allHubs?: Array<{ nodeId: string; label: string; speaker?: string }>;
    visitedHubs?: string[];
    onHubJump?: (hubNodeId: string) => void;
    gameOverConditions?: ChronosGameOverCondition[];
}

const IconMap: Record<string, LucideIcon> = {
    shield: Shield, heart: Heart, zap: Zap, scroll: Scroll, skull: Skull,
    crown: Crown, star: Star, backpack: Backpack, sword: Zap, book: BookOpen,
    'book-open': BookOpen, flag: Flag,
    map: MapIcon, users: Users, hammer: Hammer, scale: Scale, activity: Activity, eye: Shield,
    mail: Mail, feather: Feather, pen: PenLine,
};

// ── Weather Overlay ──────────────────────────────────────────────────────────

const WEATHER_CSS = `
@keyframes chron-rain-fall {
    0%   { transform: translateY(-5dvh) rotate(-15deg); opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 0.75; }
    100% { transform: translateY(110dvh) translateX(-3dvh) rotate(-15deg); opacity: 0; }
}
@keyframes chron-fog-drift {
    0%   { transform: translateX(-8%); opacity: 0; }
    20%  { opacity: 1; }
    50%  { transform: translateX(8%); opacity: 0.85; }
    80%  { opacity: 1; }
    100% { transform: translateX(-8%); opacity: 0; }
}
@keyframes chron-star-twinkle {
    0%   { opacity: var(--smin, 0.15); }
    50%  { opacity: var(--smax, 0.85); }
    100% { opacity: var(--smin, 0.15); }
}
@keyframes chron-lightning-flash {
    0%   { opacity: 0; }
    93%  { opacity: 0; }
    94%  { opacity: 0.35; }
    95%  { opacity: 0; }
    100% { opacity: 0; }
}
@keyframes chron-snow-fall {
    0%   { transform: translateY(-5dvh) translateX(0px); opacity: 0; }
    10%  { opacity: 0.9; }
    50%  { transform: translateY(55dvh) translateX(12px); }
    90%  { opacity: 0.8; }
    100% { transform: translateY(115dvh) translateX(-8px); opacity: 0; }
}
`;

function seededRand(seed: number) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

interface RainDrop { left: number; duration: number; delay: number; height: number; opacity: number; }
interface StarDot  { left: number; top: number; size: number; duration: number; delay: number; smin: number; smax: number; }

const WeatherOverlay: React.FC<{ environment?: Partial<ChronosEnvironment> }> = ({ environment }) => {
    const isNight = environment?.time === 'night';
    const isDawn  = environment?.time === 'dawn';
    const isDusk  = environment?.time === 'dusk';
    const isRain  = environment?.weather === 'rain';
    const isFog   = environment?.weather === 'fog';
    const isStorm = environment?.weather === 'storm';
    const isSnow  = environment?.weather === 'snow';

    const rainDrops = useMemo<RainDrop[]>(() => {
        const rand = seededRand(42);
        return Array.from({ length: 45 }, () => ({
            left: rand() * 110 - 5, duration: 0.6 + rand() * 0.8,
            delay: rand() * -2.5, height: 7 + rand() * 10, opacity: 0.4 + rand() * 0.5,
        }));
    }, []);

    const stormDrops = useMemo<RainDrop[]>(() => {
        const rand = seededRand(99);
        return Array.from({ length: 65 }, () => ({
            left: rand() * 115 - 7, duration: 0.35 + rand() * 0.45,
            delay: rand() * -1.5, height: 10 + rand() * 14, opacity: 0.55 + rand() * 0.4,
        }));
    }, []);

    const stars = useMemo<StarDot[]>(() => {
        const rand = seededRand(7);
        return Array.from({ length: 28 }, () => ({
            left: rand() * 98, top: rand() * 75, size: 1 + rand() * 2.5,
            duration: 2 + rand() * 4, delay: rand() * -5,
            smin: 0.1 + rand() * 0.25, smax: 0.5 + rand() * 0.5,
        }));
    }, []);

    const fogLayers = [
        { top: 5,  height: 35, duration: 28, delay: 0,   opacity: 0.55, blur: 18 },
        { top: 25, height: 40, duration: 38, delay: -10,  opacity: 0.45, blur: 28 },
        { top: 55, height: 30, duration: 22, delay: -5,   opacity: 0.50, blur: 14 },
        { top: 70, height: 45, duration: 45, delay: -20,  opacity: 0.40, blur: 22 },
    ];

    const snowFlakes = useMemo<RainDrop[]>(() => {
        const rand = seededRand(13);
        return Array.from({ length: 50 }, () => ({
            left: rand() * 105 - 2, duration: 3 + rand() * 4,
            delay: rand() * -6, height: 3 + rand() * 3, opacity: 0.6 + rand() * 0.35,
        }));
    }, []);

    return (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: WEATHER_CSS }} />
            <AnimatePresence>
                {isNight && (
                    <motion.div key="night"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 2 }} className="absolute inset-0">
                        <div className="absolute inset-0 bg-indigo-950/55 mix-blend-multiply" />
                        {stars.map((s, i) => (
                            <div key={i} className="absolute rounded-full bg-white" style={{
                                left: `${s.left}%`, top: `${s.top}%`,
                                width: `${s.size}px`, height: `${s.size}px`,
                                willChange: 'opacity',
                                animation: `chron-star-twinkle ${s.duration}s ease-in-out infinite`,
                                animationDelay: `${s.delay}s`,
                                '--smin': s.smin, '--smax': s.smax,
                            } as React.CSSProperties} />
                        ))}
                    </motion.div>
                )}
                {isDawn && (
                    <motion.div key="dawn"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 2.5 }}
                        className="absolute inset-0 bg-gradient-to-t from-amber-600/35 via-rose-400/25 via-orange-300/15 to-indigo-900/20"
                    />
                )}
                {isDusk && (
                    <motion.div key="dusk"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 2.5 }}
                        className="absolute inset-0 bg-gradient-to-b from-indigo-900/35 via-purple-700/25 via-rose-700/15 to-transparent"
                    />
                )}
                {isRain && (
                    <motion.div key="rain"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 1 }} className="absolute inset-0">
                        <div className="absolute inset-0 bg-slate-700/15 mix-blend-overlay" />
                        {rainDrops.map((d, i) => (
                            <div key={i} className="absolute bg-blue-200/70" style={{
                                left: `${d.left}%`, top: '-2%',
                                width: '1.5px', height: `${d.height}px`,
                                opacity: d.opacity, willChange: 'transform',
                                animation: `chron-rain-fall ${d.duration}s linear infinite`,
                                animationDelay: `${d.delay}s`,
                            } as React.CSSProperties} />
                        ))}
                    </motion.div>
                )}
                {isStorm && (
                    <motion.div key="storm"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }} className="absolute inset-0">
                        <div className="absolute inset-0 bg-slate-900/35 mix-blend-multiply" />
                        {stormDrops.map((d, i) => (
                            <div key={i} className="absolute bg-slate-300/60" style={{
                                left: `${d.left}%`, top: '-2%',
                                width: '1.5px', height: `${d.height}px`,
                                opacity: d.opacity, willChange: 'transform',
                                animation: `chron-rain-fall ${d.duration}s linear infinite`,
                                animationDelay: `${d.delay}s`,
                            } as React.CSSProperties} />
                        ))}
                        <div className="absolute inset-0 bg-white/25" style={{
                            willChange: 'opacity',
                            animation: 'chron-lightning-flash 16s ease-out infinite',
                        }} />
                        <div className="absolute inset-0 bg-indigo-100/20" style={{
                            willChange: 'opacity',
                            animation: 'chron-lightning-flash 16s ease-out infinite',
                            animationDelay: '7s',
                        }} />
                    </motion.div>
                )}
                {isFog && (
                    <motion.div key="fog"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 3 }} className="absolute inset-0">
                        {fogLayers.map((f, i) => (
                            <div key={i} className="absolute left-0 right-0 bg-gradient-to-r from-white/0 via-gray-100 to-white/0" style={{
                                top: `${f.top}%`, height: `${f.height}%`,
                                opacity: f.opacity, filter: `blur(${f.blur}px)`,
                                willChange: 'transform, opacity',
                                animation: `chron-fog-drift ${f.duration}s ease-in-out infinite`,
                                animationDelay: `${f.delay}s`,
                            }} />
                        ))}
                    </motion.div>
                )}
                {isSnow && (
                    <motion.div key="snow"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }} className="absolute inset-0">
                        <div className="absolute inset-0 bg-slate-200/10 mix-blend-overlay" />
                        {snowFlakes.map((d, i) => (
                            <div key={i} className="absolute bg-white rounded-full" style={{
                                left: `${d.left}%`, top: '-2%',
                                width: `${d.height}px`, height: `${d.height}px`,
                                opacity: d.opacity, willChange: 'transform',
                                animation: `chron-snow-fall ${d.duration}s ease-in-out infinite`,
                                animationDelay: `${d.delay}s`,
                            }} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Discovery Modal (Prinsipp 3) ─────────────────────────────────────────────

const DiscoveryModal: React.FC<{ event: ChronosDiscoveryEvent; onDismiss: () => void }> = ({ event, onDismiss }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-6 sm:p-8"
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#FDFBF7] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
        >
            <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                <motion.div
                    className="p-2 bg-amber-100 rounded-xl flex-shrink-0"
                    animate={{ boxShadow: ['0 0 0 0 rgba(245,158,11,0)', '0 0 0 8px rgba(245,158,11,0.3)', '0 0 0 0 rgba(245,158,11,0)'] }}
                    transition={{ duration: 2, repeat: 2, ease: 'easeInOut' }}
                >
                    <Lightbulb size={20} className="text-amber-700" />
                </motion.div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Historisk oppdagelse</p>
                    <h3 className="font-display font-black text-lg text-stone-800 leading-tight">{event.title}</h3>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-stone-700 leading-relaxed"
                >
                    {event.fact}
                </motion.p>
                {event.reflectionQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="bg-amber-50/80 border-2 border-amber-200/60 rounded-2xl p-4"
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Tenk over</p>
                        <p className="text-sm text-stone-700 italic leading-relaxed">{event.reflectionQuestion}</p>
                    </motion.div>
                )}
                {event.articleLink && (
                    <a href={event.articleLink} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <ExternalLink size={14} />
                        Les mer i boken
                    </a>
                )}
            </div>
            <div className="px-6 pb-6">
                <button onClick={onDismiss}
                    className="w-full py-3 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-[0.2em] hover:bg-stone-800 transition-all text-sm">
                    Forstått — gå videre
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ── Ethics Pause Modal (Prinsipp 6) ──────────────────────────────────────────

const EthicsModal: React.FC<{
    ethicsLens: ChronosEthicsLens;
    choiceText: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ ethicsLens, choiceText, onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-6 sm:p-8"
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#FDFBF7] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
        >
            <div className="p-5 bg-violet-50 border-b border-violet-100 flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-xl flex-shrink-0">
                    <Brain size={20} className="text-violet-700" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Etikk-pause</p>
                    <p className="font-medium text-stone-700 text-sm leading-snug">"{choiceText}"</p>
                </div>
            </div>
            <div className="p-5 space-y-3">
                <div className="bg-stone-50 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Pliktetikk (Kant)</p>
                    <p className="text-sm text-stone-700 leading-relaxed">{ethicsLens.deontological}</p>
                </div>
                <div className="bg-stone-50 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Konsekvensetikk</p>
                    <p className="text-sm text-stone-700 leading-relaxed">{ethicsLens.consequentialist}</p>
                </div>
                <div className="bg-stone-50 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Dygdsetikk</p>
                    <p className="text-sm text-stone-700 leading-relaxed">{ethicsLens.virtue}</p>
                </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-all">
                    Angre
                </button>
                <button onClick={onConfirm}
                    className="flex-1 py-3 rounded-2xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 transition-all">
                    Gå videre
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ── Epilogue Card (Prinsipp 5) ───────────────────────────────────────────────

const EpilogueCard: React.FC<{ epilogue: ChronosEpilogue; flags: string[] }> = ({ epilogue, flags }) => {
    const personalizedEntries = epilogue.entries.filter(entry => {
        if (entry.hasFlag && !flags.includes(entry.hasFlag)) return false;
        if (entry.lacksFlag && flags.includes(entry.lacksFlag)) return false;
        return true;
    });

    return (
        <div className="text-left space-y-4 max-w-lg mx-auto mt-4">
            {personalizedEntries.length > 0 && (
                <div className="space-y-2">
                    {personalizedEntries.map((entry, i) => (
                        <p key={i} className="text-sm text-stone-700 leading-relaxed">{entry.text}</p>
                    ))}
                </div>
            )}
            <div className="border-t border-stone-200/70 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Historisk ekko</p>
                <p className="text-sm text-stone-600 italic leading-relaxed">{epilogue.historicalEcho}</p>
            </div>
            <div className="bg-stone-100/80 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Til refleksjon</p>
                <p className="text-sm text-stone-700 leading-relaxed">{epilogue.reflectionQuestion}</p>
            </div>
        </div>
    );
};

// ── Main ChronosUI ───────────────────────────────────────────────────────────

export const ChronosUI: React.FC<ChronosUIProps> = ({
    node, stats, inventory = [], environment = { time: 'day', weather: 'clear' },
    journal = [], onAddJournalEntry, config, flags = [], onChoice, onRestart, onCraft,
    choiceHistory = [], scenarioTitle, scenarioMeta, scenarioId, perspectives, onExit, onRequestReset,
    allHubs, visitedHubs, onHubJump, gameOverConditions,
}) => {
    const [journalText, setJournalText] = useState('');
    const [showJournal, setShowJournal] = useState(false);
    const [showHubNav, setShowHubNav] = useState(false);
    const [showCrafting, setShowCrafting] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [showDecisionMap, setShowDecisionMap] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ChronosItem | null>(null);

    // Prinsipp 3: Discovery events
    const [showDiscovery, setShowDiscovery] = useState(false);
    const seenDiscoveries = useRef<Set<string>>(new Set());

    // Narration audio
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const popupAudioRef = useRef<HTMLAudioElement | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(isPaused);
    const defaultSpeechRate = scenarioId === 'nikolaj-ii' ? 1.1 : 1.0;
    const [speechRate, setSpeechRate] = useState(defaultSpeechRate);
    const speechRateRef = useRef(defaultSpeechRate);

    // Prinsipp 6: Ethics mode
    const [ethicsModeOn, setEthicsModeOn] = useState(false);
    const [pendingChoice, setPendingChoice] = useState<ChronosChoice | null>(null);

    // Polish: Floating stat indicators
    const [statFloats, setStatFloats] = useState<{ id: string; key: number; label: string; delta: number }[]>([]);
    const floatKeyRef = useRef(0);
    const prevInventoryRef = useRef<string[]>(inventory);
    const [inventoryPulse, setInventoryPulse] = useState(false);

    // Polish: Choice cooldown (prevent double-click)
    const [choiceCooldown, setChoiceCooldown] = useState(false);

    // Defeat interstitial overlay
    const [defeatInterstitial, setDefeatInterstitial] = useState(
        () => !!node.isEnd && node.endType === 'defeat'
    );

    // On node change: discovery check + node audio
    useEffect(() => {
        // Stop any previous audio
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        if (popupAudioRef.current) { popupAudioRef.current.pause(); popupAudioRef.current = null; }

        const willShowDiscovery = !!node.discoveryEvent && !seenDiscoveries.current.has(node.id);
        if (willShowDiscovery) {
            seenDiscoveries.current.add(node.id);
            // Denne effecten styrer lydavspillingen — et eksternt system — og
            // oppdagelses-popupen henger sammen med hvilken lyd som skal spilles.
            // Den kan derfor ikke utledes under render.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowDiscovery(true);
            // Discovery effect handles audio from here
        } else if (!isPausedRef.current && scenarioId) {
            const audio = new Audio(`/audio/tidsreise/${scenarioId}/${node.id}.mp3`);
            audioRef.current = audio;
            audio.playbackRate = speechRateRef.current;
            audio.play().catch(() => {});
        }

        // Cleanup on unmount (e.g. navigating away) to stop lingering audio
        return () => {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            if (popupAudioRef.current) { popupAudioRef.current.pause(); popupAudioRef.current = null; }
        };
    }, [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Defeat interstitial: show dramatic overlay when entering a defeat end node.
    // Justeres under render i stedet for i en effect, så overlegget ligger der
    // allerede i det bildet nederlagsnoden vises.
    const [prevNodeId, setPrevNodeId] = useState(node.id);
    if (node.id !== prevNodeId) {
        setPrevNodeId(node.id);
        setDefeatInterstitial(!!node.isEnd && node.endType === 'defeat');
    }

    // Pause node audio when discovery popup is open; resume when dismissed
    useEffect(() => {
        if (showDiscovery) {
            if (audioRef.current) audioRef.current.pause();
            if (!isPausedRef.current && scenarioId && node.discoveryEvent) {
                const audio = new Audio(`/audio/tidsreise/${scenarioId}/discovery_${node.id}.mp3`);
                popupAudioRef.current = audio;
                audio.playbackRate = speechRateRef.current;
                audio.play().catch(() => {});
            }
        } else if (popupAudioRef.current) {
            popupAudioRef.current.pause();
            popupAudioRef.current = null;
            if (!isPausedRef.current && scenarioId) {
                const audio = new Audio(`/audio/tidsreise/${scenarioId}/${node.id}.mp3`);
                audioRef.current = audio;
                audio.playbackRate = speechRateRef.current;
                audio.play().catch(() => {});
            }
        }
    }, [showDiscovery]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pause node audio when other modals are open; resume when all are closed
    useEffect(() => {
        const anyOpen = showJournal || showCrafting || showDecisionMap || showHubNav || !!selectedItem;
        if (anyOpen) {
            if (audioRef.current) audioRef.current.pause();
        } else {
            if (!isPausedRef.current && audioRef.current) audioRef.current.play().catch(() => {});
        }
    }, [showJournal, showCrafting, showDecisionMap, showHubNav, selectedItem]);

    const togglePause = () => {
        setIsPaused(prev => {
            const next = !prev;
            isPausedRef.current = next;
            if (next) {
                if (audioRef.current) audioRef.current.pause();
                if (popupAudioRef.current) popupAudioRef.current.pause();
            } else {
                // Resume whichever audio is active, or start fresh for current node
                const active = showDiscovery ? popupAudioRef.current : audioRef.current;
                if (active) {
                    active.play().catch(() => {});
                } else if (scenarioId) {
                    const audio = new Audio(`/audio/tidsreise/${scenarioId}/${node.id}.mp3`);
                    audioRef.current = audio;
                    audio.playbackRate = speechRateRef.current;
                    audio.play().catch(() => {});
                }
            }
            return next;
        });
    };

    const changeSpeechRate = (rate: number) => {
        speechRateRef.current = rate;
        setSpeechRate(rate);
        if (audioRef.current) audioRef.current.playbackRate = rate;
        if (popupAudioRef.current) popupAudioRef.current.playbackRate = rate;
    };

    // Polish: Detect inventory changes for pulse.
    // Pulsen er en tidsstyrt animasjon: den slås på, og en timer slår den av
    // igjen etter 800 ms. Timeren er et eksternt system, så dette hører hjemme
    // i en effect selv om den også setter state.
    useEffect(() => {
        if (inventory.length > prevInventoryRef.current.length) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInventoryPulse(true);
            const t = setTimeout(() => setInventoryPulse(false), 800);
            return () => clearTimeout(t);
        }
        prevInventoryRef.current = inventory;
    }, [inventory]);

    // Filter Stats
    const attributes = stats.filter(s => !s.category || s.category === 'attribute');
    const relations = stats.filter(s => s.category === 'relation');

    const getIcon = (iconName: string) => {
        const Icon = IconMap[iconName] || Star;
        return <Icon size={16} />;
    };

    const getItemDetails = (itemId: string) => config.items?.find(i => i.id === itemId);

    // Prinsipp 1: Condition check with flag support
    const isConditionFailed = (cond: ChronosCondition): boolean => {
        if (cond.hasFlag && !flags.includes(cond.hasFlag)) return true;
        if (cond.lacksFlag && flags.includes(cond.lacksFlag)) return true;
        if (cond.statId && cond.operator !== undefined && cond.value !== undefined) {
            const stat = stats.find(s => s.id === cond.statId);
            if (stat) {
                switch (cond.operator) {
                    case '>=': if (!(stat.value >= cond.value)) return true; break;
                    case '>':  if (!(stat.value > cond.value)) return true; break;
                    case '<=': if (!(stat.value <= cond.value)) return true; break;
                    case '<':  if (!(stat.value < cond.value)) return true; break;
                    case '==': if (!(stat.value === cond.value)) return true; break;
                }
            }
        }
        return false;
    };

    const isChoiceLocked = (choice: ChronosChoice): boolean => {
        if (choice.checkInventory?.hasItem && !inventory.includes(choice.checkInventory.hasItem)) return true;
        if (choice.checkInventory?.lacksItem && inventory.includes(choice.checkInventory.lacksItem)) return true;
        if (choice.condition) {
            const cond = choice.condition;
            if (cond.all) {
                if (!cond.all.every(subCond => !isConditionFailed(subCond))) return true;
            } else {
                if (isConditionFailed(cond)) return true;
            }
        }
        return false;
    };

    // Prinsipp 2: NPC tone resolver
    const getNPCTone = () => {
        if (!node.npcDialogue) return null;
        const d = node.npcDialogue;
        const stat = stats.find(s => s.id === d.statId);
        if (!stat) return d.neutral;
        const pct = (stat.value / stat.max) * 100;
        const coldBelow = d.thresholds?.coldBelow ?? 33;
        const warmAbove = d.thresholds?.warmAbove ?? 66;
        if (pct < coldBelow) return d.cold;
        if (pct >= warmAbove) return d.warm;
        return d.neutral;
    };

    // Prinsipp 6: Choice click handler with ethics intercept + polish
    const handleChoiceClick = (choice: ChronosChoice) => {
        if (choiceCooldown) return;
        setChoiceCooldown(true);
        setTimeout(() => setChoiceCooldown(false), 600);

        // Show floating stat indicators
        if (choice.effects) {
            const floats = Object.entries(choice.effects)
                .filter(([key]) => stats.some(s => s.id === key))
                .map(([key, val]) => {
                    floatKeyRef.current += 1;
                    return { id: key, key: floatKeyRef.current, label: stats.find(s => s.id === key)?.label || key, delta: val };
                });
            if (floats.length > 0) {
                setStatFloats(floats);
                setTimeout(() => setStatFloats([]), 1800);
            }
        }

        if (ethicsModeOn && choice.ethicsLens) {
            setPendingChoice(choice);
        } else {
            onChoice(choice);
        }
    };

    const handleJournalSubmit = () => {
        if (onAddJournalEntry && journalText.trim()) {
            onAddJournalEntry(journalText);
        }
        setJournalText('');
        if (node.choices.length > 0) {
            onChoice(node.choices[0]);
        }
    };

    const handleMapPointClick = (point: ChronosMapPoint) => {
        onChoice({ id: `map_click_${point.id}`, text: point.label, nextNodeId: point.nextNodeId });
    };

    const isEnd = node.isEnd;
    const npcTone = getNPCTone();

    return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-stone-950 flex flex-col">
            <WeatherOverlay environment={environment} />

            {/* Defeat Interstitial Overlay */}
            <AnimatePresence>
                {defeatInterstitial && (
                    <motion.div
                        key="defeat-interstitial"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-[60] flex flex-col items-center justify-center"
                    >
                        <motion.div
                            className="absolute inset-0 bg-red-950"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.9, 0.7] }}
                            transition={{ duration: 0.6, times: [0, 0.3, 1] }}
                        />
                        <motion.div
                            className="relative flex flex-col items-center gap-4"
                            animate={{ x: [0, -8, 6, -4, 2, 0] }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: [0, 1.5, 1.2], rotate: [-30, 10, 0] }}
                                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <Skull size={64} className="text-red-400" />
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="text-2xl sm:text-3xl font-display font-black text-red-200 uppercase tracking-[0.15em] text-center"
                            >
                                Tidslinjen brast
                            </motion.p>
                            <motion.div
                                className="h-px bg-red-500/60"
                                initial={{ width: 0 }}
                                animate={{ width: '60vw' }}
                                transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
                            />
                            <motion.div
                                className="flex gap-3 mt-8"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.8, duration: 0.5 }}
                            >
                                <button
                                    onClick={onRestart}
                                    className="px-6 py-3 rounded-xl bg-red-800/60 text-red-100 font-bold uppercase tracking-wider text-sm border border-red-600/30 hover:bg-red-700/60 transition-colors"
                                >
                                    Prøv på nytt
                                </button>
                                <button
                                    onClick={onExit}
                                    className="px-6 py-3 rounded-xl bg-white/10 text-red-200/80 font-bold uppercase tracking-wider text-sm border border-white/10 hover:bg-white/20 transition-colors"
                                >
                                    Avslutt
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Image */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={node.backgroundImage || 'default'}
                    initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 z-0"
                >
                    {node.backgroundImage ? (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent z-10" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent z-10" />
                            <img src={node.backgroundImage} alt="Setting"
                                className="w-full h-full object-cover opacity-85 filter saturate-[0.85]" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-stone-950" />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Zone 1: Nav HUD */}
            <div className="relative z-40 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 md:px-10 pt-3 pb-2">
                <div className="flex items-center gap-2">
                    {onExit && (
                        <button onClick={onExit}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/50 transition-all text-sm font-bold uppercase tracking-wider">
                            <ArrowLeft size={16} />
                            <span className="hidden sm:inline">Avslutt</span>
                        </button>
                    )}
                    {onRequestReset && (
                        <button onClick={onRequestReset} title="Nullstill"
                            className="p-2 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 text-white/50 hover:text-red-400 hover:bg-black/50 transition-all">
                            <RotateCcw size={15} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {allHubs && allHubs.length > 0 && (
                        <button
                            onClick={() => setShowHubNav(true)}
                            title="Knutepunkter"
                            className="p-2 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-black/50 transition-all relative"
                        >
                            <Compass size={16} />
                            {visitedHubs && visitedHubs.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-stone-900">
                                    {visitedHubs.length}
                                </span>
                            )}
                        </button>
                    )}
                    {scenarioTitle && (
                        <div className="text-right">
                            <p className="text-white font-display font-black text-sm sm:text-base leading-none drop-shadow-lg">{scenarioTitle}</p>
                            {scenarioMeta && <p className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">{scenarioMeta}</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Zone 2: Stats HUD */}
            <div className="relative z-20 flex-shrink-0 px-3 sm:px-5 md:px-8 pb-2 w-full flex justify-between items-start">
                <div className="flex gap-2 sm:gap-3 md:gap-4">
                    {/* Attributes */}
                    <div className="flex flex-wrap gap-2 sm:gap-4 p-2 pl-3 pr-4 sm:p-3 sm:pl-5 sm:pr-8 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-sm w-fit">
                        {attributes.map(stat => {
                            const gameOverCond = gameOverConditions?.find(c => c.statId === stat.id);
                            const dangerRatio = gameOverCond ? stat.value / gameOverCond.threshold : 0;
                            const isDanger = dangerRatio >= 0.8;
                            const isCritical = dangerRatio >= 0.95;

                            return (
                                <div key={stat.id} className="flex flex-col gap-1.5">
                                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                        isCritical ? 'text-red-300 animate-pulse' : isDanger ? 'text-red-400' : 'text-stone-300'
                                    }`}>
                                        {getIcon(stat.icon)}<span>{stat.label}</span>
                                    </div>
                                    <div className={`w-20 sm:w-28 md:w-32 h-2 rounded-full overflow-hidden shadow-inner ${
                                        isDanger ? 'bg-red-900/40 ring-1 ring-red-500/30' : 'bg-white/10'
                                    }`}>
                                        <motion.div className="h-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                                            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                                            style={{ backgroundColor: isDanger
                                                ? (isCritical ? '#ef4444' : '#f87171')
                                                : (config.theme?.primaryColor || '#6366f1')
                                            }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Relations */}
                    {relations.length > 0 && (
                        <div className="flex flex-wrap gap-2 sm:gap-4 p-2 pl-3 pr-4 sm:p-3 sm:pl-5 sm:pr-8 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-sm w-fit">
                            {relations.map(stat => (
                                <div key={stat.id} className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                        {getIcon(stat.icon)}<span>{stat.label}</span>
                                    </div>
                                    <div className="w-16 sm:w-20 md:w-24 h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                        <motion.div className="h-full bg-indigo-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                                            transition={{ type: 'spring', stiffness: 50, damping: 20 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Floating stat change indicators */}
                    <AnimatePresence>
                        {statFloats.map((f, i) => (
                            <motion.div
                                key={f.key}
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -40 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: 'easeOut', delay: i * 0.1 }}
                                className={`absolute left-4 sm:left-6 md:left-8 text-sm font-black uppercase tracking-wider ${f.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                                style={{ bottom: -4 }}
                            >
                                {f.delta > 0 ? '+' : ''}{f.delta} {f.label}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="flex gap-2 md:gap-3">
                    {/* Prinsipp 6: Ethics mode toggle */}
                    <button onClick={() => setEthicsModeOn(!ethicsModeOn)} title={ethicsModeOn ? 'Skru av etikk-modus' : 'Slå på etikk-modus'}
                        className={`p-2 sm:p-3 md:p-4 rounded-2xl border transition-colors ${ethicsModeOn ? 'bg-violet-900/60 text-violet-200 border-violet-600/40' : 'bg-black/30 backdrop-blur-xl border-white/10 text-white/60 hover:text-white'}`}>
                        <Brain size={20} />
                    </button>

                    {/* Journal */}
                    <button onClick={() => setShowJournal(true)}
                        className="p-2 sm:p-3 md:p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-sm text-white/60 hover:text-white transition-colors">
                        <BookOpen size={20} />
                    </button>

                    {/* Decision Map */}
                    {choiceHistory.length > 0 && (
                        <button
                            onClick={() => setShowDecisionMap(true)}
                            title="Beslutningskart"
                            className="p-2 sm:p-3 md:p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-sm text-white/60 hover:text-white transition-colors relative"
                        >
                            <GitBranch size={20} />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                                {choiceHistory.length}
                            </span>
                        </button>
                    )}

                    {/* Crafting */}
                    {config.recipes && config.recipes.length > 0 && onCraft && (
                        <button onClick={() => setShowCrafting(true)}
                            className="p-2 sm:p-3 md:p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-sm text-white/60 hover:text-white transition-colors">
                            <Hammer size={20} />
                        </button>
                    )}

                    {/* Inventory */}
                    <button onClick={() => setShowInventory(!showInventory)}
                        className={`p-2 sm:p-3 md:p-4 rounded-2xl border transition-colors relative ${showInventory ? 'bg-indigo-900/60 text-indigo-200 border-indigo-600/40' : 'bg-black/30 backdrop-blur-xl border-white/10 text-white/60 hover:text-white'} ${inventoryPulse ? 'animate-pulse ring-2 ring-amber-400/60' : ''}`}>
                        <Backpack size={20} />
                        {inventory.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                                {inventory.length}
                            </span>
                        )}
                    </button>

                    {/* Narration pause/play */}
                    {scenarioId && (
                        <button onClick={togglePause} title={isPaused ? 'Spill av forteller' : 'Pause forteller'}
                            className="p-2 sm:p-3 md:p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white transition-colors">
                            {isPaused ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                    )}

                    {/* Speech rate control */}
                    {scenarioId && (
                        <div className="flex items-center gap-1 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 px-2">
                            <button
                                onClick={() => changeSpeechRate(Math.max(0.8, parseFloat((speechRate - 0.05).toFixed(2))))}
                                disabled={speechRate <= 0.8}
                                className="p-1 text-white/60 hover:text-white disabled:opacity-30 transition-colors text-sm font-bold"
                                title="Tregere"
                            >
                                -
                            </button>
                            <span className="text-white/70 text-xs font-bold min-w-[2.5rem] text-center">
                                {speechRate.toFixed(2)}x
                            </span>
                            <button
                                onClick={() => changeSpeechRate(Math.min(1.4, parseFloat((speechRate + 0.05).toFixed(2))))}
                                disabled={speechRate >= 1.4}
                                className="p-1 text-white/60 hover:text-white disabled:opacity-30 transition-colors text-sm font-bold"
                                title="Raskere"
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Journal Modal */}
            <AnimatePresence>
                {showJournal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#FDFBF7] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                                <h3 className="font-display font-black text-xl text-stone-800">Dagbok</h3>
                                <button onClick={() => setShowJournal(false)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
                            </div>
                            <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6 font-serif">
                                {journal.length === 0 && <p className="text-stone-500 italic text-center">Ingen oppføringer ennå.</p>}
                                {journal.map((entry, i) => (
                                    <div key={i} className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                                        <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Dag {entry.day}</div>
                                        <p className="text-stone-700 leading-relaxed italic">"{entry.text}"</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inventory Side Panel */}
            <AnimatePresence>
                {showInventory && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex justify-end"
                        onClick={() => setShowInventory(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="bg-[#FDFBF7] w-80 h-full shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                                <h3 className="font-display font-black text-xl text-stone-800">Ryggsekk</h3>
                                <button onClick={() => setShowInventory(false)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
                            </div>
                            <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-2">
                                {inventory.length === 0
                                    ? <p className="text-sm text-stone-500 italic text-center mt-8">Sekken er tom.</p>
                                    : inventory.map((itemId, idx) => {
                                        const item = getItemDetails(itemId);
                                        return (
                                            <button key={`${itemId}-${idx}`}
                                                onClick={() => { if (item) { setSelectedItem(item); setShowInventory(false); } }}
                                                className="w-full flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-100 shadow-sm text-left hover:border-indigo-200 transition-all"
                                            >
                                                <div className="p-2 bg-stone-50 rounded-lg text-stone-400 flex-shrink-0">
                                                    {item?.icon ? getIcon(item.icon) : <Star size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-stone-800">{item?.name || itemId}</p>
                                                    <p className="text-[10px] text-stone-500 leading-relaxed mt-0.5">{item?.description}</p>
                                                    {item?.content && (
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mt-1">
                                                            Trykk for å lese
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                }
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hub Navigator Side Panel */}
            <AnimatePresence>
                {showHubNav && allHubs && allHubs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex justify-end"
                        onClick={() => setShowHubNav(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="bg-[#FDFBF7] w-80 h-full shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                                <div className="flex items-center gap-2">
                                    <Compass size={20} className="text-amber-600" />
                                    <h3 className="font-display font-black text-xl text-stone-800">Knutepunkter</h3>
                                </div>
                                <button onClick={() => setShowHubNav(false)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
                            </div>
                            <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-2">
                                {allHubs.map((hub, idx) => {
                                    const isVisited = visitedHubs?.includes(hub.nodeId);
                                    const isCurrent = node.id === hub.nodeId;
                                    return (
                                        <button
                                            key={hub.nodeId}
                                            disabled={!isVisited}
                                            onClick={() => {
                                                if (isVisited && onHubJump) {
                                                    onHubJump(hub.nodeId);
                                                    setShowHubNav(false);
                                                }
                                            }}
                                            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                                                isCurrent
                                                    ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-400/40'
                                                    : isVisited
                                                        ? 'bg-white border-stone-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50'
                                                        : 'bg-stone-50 border-stone-100 opacity-40 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                                isCurrent ? 'bg-amber-500 text-white' :
                                                isVisited ? 'bg-emerald-500 text-white' :
                                                'bg-stone-200 text-stone-400'
                                            }`}>
                                                {isVisited ? <CheckCircle size={16} /> : idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-bold leading-snug ${
                                                    isVisited ? 'text-stone-800' : 'text-stone-400'
                                                }`}>
                                                    {hub.label}
                                                </p>
                                                {hub.speaker && (
                                                    <p className="text-[10px] text-stone-400 mt-0.5">{hub.speaker}</p>
                                                )}
                                                {isCurrent && (
                                                    <p className="text-[10px] font-bold text-amber-600 mt-1">Du er her</p>
                                                )}
                                            </div>
                                            {!isVisited && (
                                                <Lock size={14} className="text-stone-300 flex-shrink-0 mt-1 ml-auto" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Decision Map Modal */}
            <AnimatePresence>
                {showDecisionMap && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-8"
                        onClick={() => setShowDecisionMap(false)}
                    >
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#FDFBF7] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                                <div className="flex items-center gap-2">
                                    <GitBranch size={18} className="text-indigo-500" />
                                    <h3 className="font-display font-black text-lg text-stone-800">Beslutningskart</h3>
                                </div>
                                <button onClick={() => setShowDecisionMap(false)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-stone-100">
                                {choiceHistory.length === 0 && (
                                    <p className="text-stone-500 italic text-center p-8">Ingen nøkkelvalg ennå.</p>
                                )}
                                {choiceHistory.map((entry, i) => (
                                    <div key={i} className="p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1 line-clamp-1">{entry.nodeText}</p>
                                        <div className="flex items-start gap-2">
                                            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${entry.isHistorical ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                                            <p className="text-sm text-stone-700 leading-snug">{entry.choiceText}</p>
                                        </div>
                                        {!entry.isHistorical && entry.historicalChoiceText && (
                                            <p className="text-xs text-stone-400 ml-4 mt-0.5 italic">
                                                Historisk: <span className="text-emerald-600">{entry.historicalChoiceText}</span>
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-stone-100 flex gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Historisk valg</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Alternativt valg</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Prinsipp 3: Discovery Modal */}
            <AnimatePresence>
                {showDiscovery && node.discoveryEvent && (
                    <DiscoveryModal event={node.discoveryEvent} onDismiss={() => setShowDiscovery(false)} />
                )}
            </AnimatePresence>

            {/* Prinsipp 6: Ethics Pause Modal */}
            <AnimatePresence>
                {pendingChoice && pendingChoice.ethicsLens && (
                    <EthicsModal
                        ethicsLens={pendingChoice.ethicsLens}
                        choiceText={pendingChoice.text}
                        onConfirm={() => { onChoice(pendingChoice); setPendingChoice(null); }}
                        onCancel={() => setPendingChoice(null)}
                    />
                )}
            </AnimatePresence>

            <CraftingModal
                isOpen={showCrafting}
                onClose={() => setShowCrafting(false)}
                recipes={config.recipes || []}
                inventory={inventory}
                items={config.items || []}
                onCraft={(recipe) => { if (onCraft) onCraft(recipe); }}
            />

            <ItemInspectModal item={selectedItem} onClose={() => setSelectedItem(null)} />

            {/* Zone 4: Dialogue Layer — fills all remaining space after the two HUDs */}
            <div className="relative z-30 flex-1 min-h-0 overflow-y-auto flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 pb-4 sm:pb-6 md:pb-8 bg-gradient-to-t from-stone-950 via-stone-950/90 to-transparent [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
                {/* Internal spacer — scene image shows through here; collapses when content is tall */}
                <div className="flex-1 min-h-0" />
                {/* Content — pinned to bottom, never compressed */}
                <div className="flex-shrink-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-4xl mx-auto w-full relative z-40"
                    >
                        {/* Speaker Tag */}
                        {node.speaker && (() => {
                            const p = perspectives?.[node.speaker];
                            const factionStyles = {
                                sovjet:        { border: 'border-l-[6px] border-red-500',      bg: 'bg-red-950/50',      text: 'text-red-200'      },
                                usa:           { border: 'border-l-[6px] border-blue-500',     bg: 'bg-blue-950/50',     text: 'text-blue-200'     },
                                sivil:         { border: 'border-l-[6px] border-stone-400',    bg: 'bg-stone-800/50',    text: 'text-stone-200'    },
                                forteller:     { border: 'border-l-[6px] border-amber-400',    bg: 'bg-amber-950/30',    text: 'text-amber-200'    },
                                fascisme:      { border: 'border-l-[6px] border-rose-600',     bg: 'bg-rose-950/50',     text: 'text-rose-200'     },
                                nazisme:       { border: 'border-l-[6px] border-slate-500',    bg: 'bg-slate-900/50',    text: 'text-slate-200'    },
                                frankrike:     { border: 'border-l-[6px] border-indigo-400',   bg: 'bg-indigo-950/50',   text: 'text-indigo-200'   },
                                etiopia:       { border: 'border-l-[6px] border-emerald-500',  bg: 'bg-emerald-950/50',  text: 'text-emerald-200'  },
                                storbritannia: { border: 'border-l-[6px] border-cyan-400',     bg: 'bg-cyan-950/50',     text: 'text-cyan-200'     },
                                vitne:         { border: 'border-l-[6px] border-violet-400',   bg: 'bg-violet-950/50',   text: 'text-violet-200'   },
                            };
                            const style = p ? factionStyles[p.faction] : null;
                            return style ? (
                                <div className={`inline-flex items-center gap-4 px-6 py-4 mb-6 rounded-r-lg ${style.border} ${style.bg}`}>
                                    {p?.flag && <span className="text-3xl leading-none">{p.flag}</span>}
                                    <div>
                                        <div className={`text-base font-black uppercase tracking-[0.2em] ${style.text}`}>{node.speaker}</div>
                                        {p?.subtitle && <div className="text-sm opacity-60 text-stone-300 mt-0.5">{p.subtitle}</div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="inline-block px-6 py-3 mb-4 rounded-lg bg-white/10 border border-white/15 text-base font-black uppercase tracking-[0.2em] text-stone-300 shadow-sm">
                                    {node.speaker}
                                </div>
                            );
                        })()}

                        {/* Prinsipp 2: NPC tone dialogue */}
                        {npcTone && (
                            <div className="mb-4 pl-4 border-l-2 border-white/20">
                                <p className="text-stone-300 italic font-serif text-base sm:text-lg leading-relaxed">{npcTone}</p>
                            </div>
                        )}

                        {/* Main Text */}
                        <div
                            className="mb-2 sm:mb-4 md:mb-6 lg:mb-8"
                            style={{ fontFamily: config.theme?.font || 'serif' }}
                        >
                            {node.text.split('\n\n').map((paragraph, i) => (
                                <p
                                    key={i}
                                    className="text-sm sm:text-lg md:text-xl font-medium text-stone-100 leading-[1.35] tracking-tight mb-3 last:mb-0"
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        {/* Content: minigame / map / journal / choices */}
                        {!showDiscovery && !pendingChoice && node.minigame ? (
                            node.minigame.type === 'dice' ? (
                                <DiceGame
                                    targetScore={node.minigame.config.targetScore}
                                    wager={node.minigame.config.wager}
                                    onComplete={(success: boolean) => {
                                        if (node.minigame?.type === 'dice') {
                                            onChoice({ id: 'minigame_complete', text: 'Dice Game Complete', nextNodeId: success ? node.minigame.config.winNodeId : node.minigame.config.lossNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'battle' ? (
                                <BattleGame
                                    config={node.minigame.config}
                                    stats={stats}
                                    onComplete={(success: boolean) => {
                                        if (node.minigame?.type === 'battle') {
                                            onChoice({ id: 'battle_complete', text: 'Battle Complete', nextNodeId: success ? node.minigame.config.winNodeId : node.minigame.config.lossNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'justice' ? (
                                <JusticeGame
                                    config={node.minigame.config}
                                    onComplete={() => {
                                        if (node.minigame?.type === 'justice') {
                                            onChoice({ id: 'justice_complete', text: 'Court Adjourned', nextNodeId: node.minigame.config.onComplete.nextNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'telegram' ? (
                                <TelegramGame
                                    config={node.minigame.config}
                                    onComplete={() => {
                                        if (node.minigame?.type === 'telegram') {
                                            onChoice({ id: 'telegram_complete', text: 'Telegrammer sortert', nextNodeId: node.minigame.config.onComplete.nextNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'allocation' ? (
                                <AllocationGame
                                    config={node.minigame.config}
                                    onComplete={() => {
                                        if (node.minigame?.type === 'allocation') {
                                            onChoice({ id: 'allocation_complete', text: 'Ressurser fordelt', nextNodeId: node.minigame.config.onComplete.nextNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'crowd' ? (
                                <CrowdPressureGame
                                    config={node.minigame.config}
                                    onComplete={(success: boolean) => {
                                        if (node.minigame?.type === 'crowd') {
                                            onChoice({ id: 'crowd_complete', text: 'Folkemengde-trykk', nextNodeId: success ? node.minigame.config.winNodeId : node.minigame.config.lossNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'speech' ? (
                                <SpeechGame
                                    config={node.minigame.config}
                                    onComplete={(result) => {
                                        if (node.minigame?.type === 'speech') {
                                            onChoice({
                                                id: 'speech_complete',
                                                text: 'Tale holdt',
                                                nextNodeId: node.minigame.config.onComplete.nextNodeId,
                                                effects: result.effects,
                                                setFlags: result.setsFlag ? [result.setsFlag] : undefined,
                                            });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'intrigue' ? (
                                <IntrigueGame
                                    config={node.minigame.config}
                                    onComplete={() => {
                                        if (node.minigame?.type === 'intrigue') {
                                            onChoice({ id: 'intrigue_complete', text: 'Intriger avslørt', nextNodeId: node.minigame.config.onComplete.nextNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'triage' ? (
                                <TriageGame
                                    config={node.minigame.config}
                                    onComplete={(results) => {
                                        if (node.minigame?.type === 'triage') {
                                            onChoice({ id: 'triage_complete', text: 'Triasje fullført', nextNodeId: node.minigame.config.onComplete.nextNodeId, effects: results.effects });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'censor' ? (
                                <CensorGame
                                    config={node.minigame.config}
                                    onComplete={() => {
                                        if (node.minigame?.type === 'censor') {
                                            onChoice({ id: 'censor_complete', text: 'Brev sensurert', nextNodeId: node.minigame.config.onComplete.nextNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'gasmask' ? (
                                <GasMaskGame
                                    config={node.minigame.config}
                                    inventory={inventory}
                                    onComplete={(result) => {
                                        onChoice({ id: 'gasmask_complete', text: 'Gassalarm', nextNodeId: result.nextNodeId, effects: result.effects });
                                    }}
                                />
                            ) : node.minigame.type === 'rationing' ? (
                                <RationingGame
                                    config={node.minigame.config}
                                    onComplete={(effects) => {
                                        if (node.minigame?.type === 'rationing') {
                                            onChoice({ id: 'rationing_complete', text: 'Rasjonering fullført', nextNodeId: node.minigame.config.onComplete.nextNodeId, effects });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'signal' ? (
                                <SignalGame
                                    config={node.minigame.config}
                                    onComplete={(success: boolean) => {
                                        if (node.minigame?.type === 'signal') {
                                            onChoice({ id: 'signal_complete', text: 'Observasjonsrapport', nextNodeId: success ? node.minigame.config.winNodeId : node.minigame.config.lossNodeId });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'propaganda' ? (
                                <PropagandaGame
                                    config={node.minigame.config}
                                    onComplete={(result) => {
                                        if (node.minigame?.type === 'propaganda') {
                                            onChoice({ id: 'propaganda_complete', text: 'Mediedekning bestemt', nextNodeId: node.minigame.config.onComplete.nextNodeId, effects: result.effects, setFlags: result.setFlags });
                                        }
                                    }}
                                />
                            ) : node.minigame.type === 'domino' ? (
                                <DominoGame
                                    config={node.minigame.config}
                                    onComplete={(success: boolean) => {
                                        if (node.minigame?.type === 'domino') {
                                            onChoice({ id: 'domino_complete', text: 'Kartintervensjon fullfort', nextNodeId: success ? node.minigame.config.winNodeId : node.minigame.config.lossNodeId });
                                        }
                                    }}
                                />
                            ) : null
                        ) : node.journalPrompt ? (
                            <div className="space-y-3 sm:space-y-4">
                                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-stone-400">{node.journalPrompt}</p>
                                <textarea
                                    value={journalText}
                                    onChange={(e) => setJournalText(e.target.value)}
                                    className="w-full p-2 sm:p-4 rounded-xl border border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-serif text-base sm:text-lg bg-white/50 backdrop-blur-sm min-h-[80px] sm:min-h-[120px] md:min-h-[150px]"
                                    placeholder="Skriv dine tanker..."
                                />
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={handleJournalSubmit} disabled={!journalText.trim()}
                                        className="px-6 sm:px-8 py-2 sm:py-3 bg-indigo-900 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                        Lagre Dagbok & Sov
                                    </button>
                                    {isEnd && onRestart && (
                                        <button onClick={onRestart}
                                            className="px-6 sm:px-8 py-2 sm:py-3 bg-stone-700 text-white font-bold rounded-xl shadow-lg hover:bg-stone-600 transition-all">
                                            Prøv på nytt
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {node.uiType === 'map' && node.mapConfig && (
                                    <ChronosMap config={node.mapConfig} onPointClick={handleMapPointClick} flags={flags} />
                                )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {!isEnd && node.choices.map((choice, choiceIdx) => {
                                    if (isChoiceLocked(choice)) return null;
                                    const hasEthics = ethicsModeOn && !!choice.ethicsLens;

                                    return (
                                        <motion.button
                                            key={choice.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: choiceIdx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                            onClick={() => handleChoiceClick(choice)}
                                            disabled={choiceCooldown}
                                            className="group relative p-3 sm:p-5 md:p-6 text-left rounded-[1.5rem] border transition-all duration-300 overflow-hidden bg-white/10 backdrop-blur-sm border-white/15 hover:border-white/30 hover:bg-white/15 active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 disabled:opacity-60 disabled:pointer-events-none"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="relative z-10 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-lg transition-colors text-stone-100 group-hover:text-white">
                                                        {choice.text}
                                                    </span>
                                                    {/* Prinsipp 6: ethics mode indicator */}
                                                    {hasEthics && (
                                                        <span className="text-[10px] font-bold text-violet-500 mt-1 flex items-center gap-1">
                                                            <Brain size={10} /> Etikk-pause aktivert
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${hasEthics
                                                    ? 'bg-violet-900/60 text-violet-300'
                                                    : 'bg-white/10 group-hover:bg-indigo-600/40 text-white/50 group-hover:text-white'
                                                    }`}>
                                                    <ArrowRight size={16} />
                                                </div>
                                            </div>

                                            {/* Effect preview with icons */}
                                            {choice.effects && (
                                                <div className="relative z-10 flex flex-wrap gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                    {Object.entries(choice.effects)
                                                        .filter(([key]) => stats.some(s => s.id === key))
                                                        .map(([key, val]) => (
                                                            <span key={key} className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${val > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {val > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                                {val > 0 ? '+' : ''}{val} {stats.find(s => s.id === key)?.label}
                                                            </span>
                                                        ))}
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}

                                {isEnd && (
                                    <div className="md:col-span-2 space-y-5 md:space-y-8">
                                        <div className={`p-6 sm:p-8 md:p-10 rounded-[2rem] border shadow-lg ${node.endType === 'victory'
                                            ? 'bg-emerald-950/50 border-emerald-800/40 backdrop-blur-sm'
                                            : node.endType === 'defeat'
                                                ? 'bg-rose-950/50 border-rose-800/40 backdrop-blur-sm'
                                                : 'bg-stone-900/60 border-stone-700/40 backdrop-blur-sm'
                                            }`}>
                                            {node.endType === 'victory' && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -20 }}
                                                    animate={{ scale: [0, 1.3, 1], rotate: [-20, 10, 0] }}
                                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                    className="flex justify-center mb-4 md:mb-6"
                                                >
                                                    <Crown className="text-emerald-600" size={32} />
                                                </motion.div>
                                            )}
                                            {node.endType === 'defeat' && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: 20 }}
                                                    animate={{ scale: [0, 1.2, 1], rotate: [20, -5, 0] }}
                                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                    className="flex justify-center mb-4 md:mb-6"
                                                >
                                                    <Skull className="text-rose-500" size={32} />
                                                </motion.div>
                                            )}

                                            <h3 className="text-2xl md:text-3xl font-black text-stone-100 mb-2 tracking-tight text-center">
                                                {node.endType === 'victory' ? 'Historisk Seier' : node.endType === 'defeat' ? 'Historien endte her...' : 'Reisen er over'}
                                            </h3>

                                            {/* Prinsipp 5: Personalized epilogue or fallback */}
                                            {node.epilogue ? (
                                                <EpilogueCard epilogue={node.epilogue} flags={flags} />
                                            ) : (
                                                <p className="text-base md:text-lg text-stone-300 font-medium leading-relaxed max-w-lg mx-auto text-center mt-4">
                                                    {node.endType === 'victory'
                                                        ? 'Du navigerte fortidens utfordringer med kløkt og visdom.'
                                                        : 'Du lærte en hard lekse om fortidens brutale virkelighet.'}
                                                </p>
                                            )}

                                            {/* EndComparisonScreen */}
                                            {node.showEndComparison && choiceHistory.length > 0 && (
                                                <EndComparisonScreen choiceHistory={choiceHistory} />
                                            )}
                                        </div>

                                        <button onClick={onRestart}
                                            className="w-full py-3 sm:py-4 md:py-6 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl hover:shadow-2xl shadow-stone-400/20">
                                            Prøv på nytt
                                        </button>
                                    </div>
                                )}
                            </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
