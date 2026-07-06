import { useEffect, useRef, useState, useCallback } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { GameEngine } from '../GameEngine';
import type { GameConfig, GameUIState } from '../types';
import { TitleScreen } from './TitleScreen';
import { EndScreen } from './EndScreen';
import { GameHUD } from './GameHUD';
import { DialogBox } from './DialogBox';
import { PuzzleUI } from './PuzzleUI';
import { MonologBox } from './MonologBox';
import { IntroOverlay } from './IntroRunner';
import { ZoneTitleOverlay } from './ZoneTitleOverlay';
import { SettingsMenu } from './SettingsMenu';
import { DebugHud } from './DebugHud';
import type { DebugStats } from '../systems/DebugHudSystem';
import { PhotoModeUI } from './PhotoModeUI';
import { QuestLog } from './QuestLog';
import { InventoryUI } from './InventoryUI';
import { ActivityOverlay } from './ActivityOverlay';

interface GameCanvasProps {
    config: GameConfig;
}

const defaultUIState: GameUIState = {
    started: false,
    questObjective: '',
    questParts: [],
    showInteractPrompt: false,
    dialog: null,
    puzzle: null,
    activity: null,
    monolog: null,
    ended: false,
    endText: '',
};

export function GameCanvas({ config }: GameCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [uiState, setUIState] = useState<GameUIState>(defaultUIState);
    const [toast, setToast] = useState('');
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [fadeState, setFadeState] = useState({ opacity: 0, durationMs: 400 });
    const [debugVisible, setDebugVisible] = useState(false);
    const [photoMode, setPhotoMode] = useState(false);
    const [questLogVisible, setQuestLogVisible] = useState(false);
    const [inventoryVisible, setInventoryVisible] = useState(false);
    const { setFullWidth } = useLayout();

    // Globale hurtigtaster: F3 debug, P fotomodus, J quest-log, I inventar.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            // Ikke overstyr taster når brukeren skriver i input/textarea
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }
            if (e.code === 'F3') {
                e.preventDefault();
                setDebugVisible((v) => !v);
            } else if (e.code === 'KeyP' && !e.repeat) {
                const engine = engineRef.current;
                if (engine) {
                    const active = engine.togglePhotoMode();
                    setPhotoMode(active);
                }
            } else if (e.code === 'KeyJ' && !e.repeat) {
                setQuestLogVisible((v) => !v);
            } else if (e.code === 'KeyI' && !e.repeat) {
                setInventoryVisible((v) => !v);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const handlePhotoScreenshot = useCallback(() => {
        engineRef.current?.captureScreenshot();
    }, []);

    const handlePhotoExposure = useCallback((exposure: number) => {
        engineRef.current?.setPhotoExposure(exposure);
    }, []);

    const handlePhotoLut = useCallback((name: string | null) => {
        engineRef.current?.setPhotoLut(name);
    }, []);

    const handlePhotoExit = useCallback(() => {
        const engine = engineRef.current;
        if (engine) {
            engine.togglePhotoMode();
            setPhotoMode(false);
        }
    }, []);

    const getQuestSnapshot = useCallback(() => {
        return engineRef.current?.getQuestSnapshot() ?? null;
    }, []);

    const getInventorySnapshot = useCallback(() => {
        return engineRef.current?.getInventorySnapshot() ?? null;
    }, []);

    const getDebugStats = useCallback((): DebugStats => {
        const stats = engineRef.current?.getDebugStats();
        if (stats) return stats;
        return {
            fps: 0,
            frameMs: 0,
            drawCalls: 0,
            triangles: 0,
            geometries: 0,
            textures: 0,
            programs: 0,
            materials: 0,
            physicsBodies: 0,
            phase: '-',
            qualityTier: 'medium',
            flags: {},
        };
    }, []);

    // Expand layout
    useEffect(() => {
        setFullWidth(true);
        return () => setFullWidth(false);
    }, [setFullWidth]);

    // Initialize engine
    useEffect(() => {
        if (!containerRef.current) return;

        const engine = new GameEngine({
            container: containerRef.current,
            config,
            onUIUpdate: (state) => setUIState((prev) => ({ ...prev, ...state })),
            onStart: () => {},
            onEnd: (text) => {
                setUIState((prev) => ({ ...prev, ended: true, endText: text }));
                // «Min læring»: 3D-spillet er fullført
                import('../../../features/progress/useProgressStore').then(
                    ({ useProgressStore }) => {
                        useProgressStore.getState().recordActivity({
                            kind: 'minigame-played',
                            activityId: `spill/${config.id}`,
                            subjectId: config.subject,
                            title: config.title,
                        });
                    }
                );
            },
            onCollect: (name) => {
                setToast(name);
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                toastTimerRef.current = setTimeout(() => setToast(''), 2000);
            },
            onFade: (visible, durationMs) => {
                return new Promise<void>((resolve) => {
                    setFadeState({ opacity: visible ? 1 : 0, durationMs });
                    setTimeout(resolve, durationMs);
                });
            },
        });

        engineRef.current = engine;
        engine.start();

        return () => {
            engine.dispose();
            engineRef.current = null;
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [config]);

    const handleStart = useCallback(() => {
        engineRef.current?.startGame();
        setUIState((prev) => ({ ...prev, started: true }));
    }, []);

    const handleDialogChoice = useCallback((index: number) => {
        engineRef.current?.handleDialogChoice(index);
    }, []);

    // Lyd-bro for dialog-UI (åpne-lyd, typewriter-tikk). Valg-lyden spilles i
    // motoren slik at den dekker både muse-klikk og talltastene 1-5.
    const playUiSound = useCallback((url: string, opts?: { volume?: number }) => {
        void engineRef.current?.audio.playOneShot(url, opts);
    }, []);

    const handlePuzzleAnswer = useCallback((index: number) => {
        engineRef.current?.handlePuzzleAnswer(index);
    }, []);

    const handleStationSubmit = useCallback((selectedItemIds: string[]) => {
        engineRef.current?.handleStationSubmit(selectedItemIds);
    }, []);

    const handleRestart = useCallback(() => {
        window.location.reload();
    }, []);

    const handleSkipIntro = useCallback(() => {
        engineRef.current?.skipIntro();
    }, []);

    const handleResumeFromMenu = useCallback(() => {
        const canvas = containerRef.current?.querySelector('canvas');
        canvas?.requestPointerLock();
    }, []);

    // Fase 5.2: save/load-handlers. getHasSave leses av SettingsMenu ved åpning
    // slik at GameCanvas selv ikke trenger å touche refs under render.
    const getHasSave = useCallback(() => engineRef.current?.hasSave() ?? false, []);
    const handleSave = useCallback(() => {
        engineRef.current?.save();
    }, []);
    const handleLoad = useCallback(() => {
        engineRef.current?.loadSave();
    }, []);
    const handleClearSave = useCallback(() => {
        engineRef.current?.clearSave();
    }, []);

    return (
        <div
            className="relative w-full overflow-hidden bg-stone-900"
            style={{ height: 'calc(100dvh - 4rem)' }}
        >
            {/* Three.js canvas — cinematic effects handled by shader (all devices) */}
            <div ref={containerRef} className="absolute inset-0" />

            {/* Title screen */}
            {!uiState.started && !uiState.ended && (
                <TitleScreen config={config} onStart={handleStart} />
            )}

            {/* Game HUD */}
            {uiState.started && !uiState.ended && (
                <GameHUD
                    questObjective={uiState.questObjective}
                    questParts={uiState.questParts}
                    showInteractPrompt={uiState.showInteractPrompt}
                    showFlash={!!uiState.showFlash}
                    toast={toast}
                    debug={uiState.debug}
                    qualityTier={uiState.qualityTier}
                    throwCharge={uiState.throwCharge}
                    launcherAmmo={uiState.launcherAmmo}
                    notice={uiState.notice}
                    hitMarker={uiState.hitMarker}
                />
            )}

            {/* Intro overlay (Fase 5) */}
            {uiState.started && !uiState.ended && uiState.intro?.active && (
                <IntroOverlay
                    title={uiState.intro.title}
                    subtitle={uiState.intro.subtitle}
                    skippable={uiState.intro.skippable}
                    onSkip={handleSkipIntro}
                />
            )}

            {/* Sonetittel-overlay (Fase 8) - keyet så fade restarter per ny tittel */}
            {uiState.started && !uiState.ended && uiState.zoneTitle && (
                <ZoneTitleOverlay
                    key={uiState.zoneTitle.key}
                    title={uiState.zoneTitle.title}
                    subtitle={uiState.zoneTitle.subtitle}
                    durationMs={uiState.zoneTitle.durationMs}
                />
            )}

            {/* Settings menu (erstatter pause-overlay) */}
            {uiState.started && !uiState.ended && uiState.paused && (
                <SettingsMenu
                    onResume={handleResumeFromMenu}
                    onSave={handleSave}
                    onLoad={handleLoad}
                    onClearSave={handleClearSave}
                    getHasSave={getHasSave}
                />
            )}

            {/* Dialog box */}
            {uiState.started && !uiState.ended && uiState.dialog && (
                <DialogBox dialog={uiState.dialog} onChoice={handleDialogChoice} playSound={playUiSound} />
            )}

            {/* Puzzle UI */}
            {uiState.started && !uiState.ended && uiState.puzzle && (
                <PuzzleUI
                    puzzle={uiState.puzzle}
                    onAnswer={handlePuzzleAnswer}
                    onStationSubmit={handleStationSubmit}
                />
            )}

            {/* Timed Activity */}
            {uiState.started && !uiState.ended && uiState.activity && (
                <ActivityOverlay activity={uiState.activity} />
            )}

            {/* Deteksjonsmaler */}
            {uiState.started && !uiState.ended && !!uiState.detectionLevel && uiState.detectionLevel > 0.01 && (
                <div
                    style={{
                        position: 'absolute',
                        top: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        pointerEvents: 'none',
                        zIndex: 12,
                    }}
                >
                    <div style={{ color: uiState.detectionLevel > 0.75 ? '#ff4444' : '#f5c842', fontSize: 11, fontFamily: 'Inter, sans-serif', letterSpacing: 1, textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                        Oppdaget
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${uiState.detectionLevel * 100}%`,
                                background: uiState.detectionLevel > 0.75 ? '#ff4444' : '#f5c842',
                                borderRadius: 3,
                                transition: 'width 0.1s, background 0.3s',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Indre monolog (ikke-blokkerende). Skjules mens en blokkerende bunn-overlay
                er oppe (dialog/puzzle/aktivitet) så den ikke legger seg oppå dialogboksen.
                Motoren pauser samtidig monolog-progresjonen, så den gjenopptas her etterpå. */}
            {uiState.started && !uiState.ended && !uiState.dialog && !uiState.puzzle && !uiState.activity && (
                <MonologBox monolog={uiState.monolog} />
            )}

            {/* Crosshair */}
            {uiState.started && !uiState.ended && !uiState.paused && !uiState.dialog && !uiState.puzzle && !uiState.intro?.active && (
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                />
            )}

            {/* Debug-HUD (F3) */}
            {debugVisible && <DebugHud getStats={getDebugStats} />}

            {/* Fotomodus-UI (P) */}
            {photoMode && (
                <PhotoModeUI
                    onScreenshot={handlePhotoScreenshot}
                    onExposureChange={handlePhotoExposure}
                    onLutChange={handlePhotoLut}
                    onExit={handlePhotoExit}
                />
            )}

            {/* Quest-log (J) */}
            {questLogVisible && uiState.started && !uiState.ended && (
                <QuestLog getSnapshot={getQuestSnapshot} onClose={() => setQuestLogVisible(false)} />
            )}

            {/* Inventar (I) */}
            {inventoryVisible && uiState.started && !uiState.ended && (
                <InventoryUI getSnapshot={getInventorySnapshot} onClose={() => setInventoryVisible(false)} />
            )}

            {/* End screen */}
            {uiState.ended && (
                <EndScreen text={uiState.endText} onRestart={handleRestart} />
            )}

            {/* Fade-overlay (CameraDirector) */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#000',
                    opacity: fadeState.opacity,
                    transition: `opacity ${fadeState.durationMs}ms ease-in-out`,
                    pointerEvents: fadeState.opacity > 0.5 ? 'auto' : 'none',
                    zIndex: 100,
                }}
            />
        </div>
    );
}
