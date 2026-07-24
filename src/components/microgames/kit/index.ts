// Mikrospill-interaksjons-toolkit. Gjenbrukbare R3F-byggeklosser for rike,
// direkte-interaktive 3D-mikrospill i artikler. Se .agent/workflows/build_microgame.md.

export { damp, dampV3 } from './damp';
export { useStage } from './useStage';
export { MicroCanvas, type MicroCanvasProps, type LightMood } from './MicroCanvas';
export { MicroGameScaffold } from './MicroGameScaffold';

// Direkte 3D-interaksjon
export { Interactive, type InteractiveState } from './Interactive';
export { Hotspot } from './Hotspot';
export { Draggable } from './Draggable';
// Variasjons-primitiver: bryt klikk-hotspot-ruten
export { Rotatable } from './Rotatable';
export { Connector, type ConnectorNode } from './Connector';
export { AimLauncher, type AimTarget } from './AimLauncher';

// Signaturlook: temaer + toon-materiale + kant
export { THEMES, DEFAULT_THEME, type KitTheme } from './themes';
export { ToonMaterial, KitOutline, GlowMaterial, GlowHalo, WaterMaterial } from './materials';
export { toonGradientMap } from './toonGradient';

// Prosedyrale scene-deler
export {
    GroundPlane,
    WaterPlane,
    Seascape,
    Shoreline,
    FlatRing,
    Building,
    Tree,
    Figure,
    Smoke,
    Rock,
    Fire,
    Banner,
    Gear,
} from './scene-parts';
export { useSeascape, type SeascapeBounds, type SeascapeInfo } from './seascapeContext';
// Orienterings-hjelpere (unngå "peker feil vei"-feil)
export { faceAlong, headingToRotation, rotationAlong, type XZ } from './placement';
// Utvidet del-bibliotek: uttrykksfulle figurer + flere miljøbyggesteiner
export {
    Person,
    Wall,
    Tower,
    Column,
    Arch,
    Bridge,
    Cart,
    Boat,
    Animal,
    Tent,
    Torch,
    MarketStall,
    Hill,
    type Pose,
    type HeadGear,
    type AnimalKind,
} from './scene-parts-extra';
export { InstancedField } from './InstancedField';

// Game-feel / juice
export { useShake, usePop, ease } from './juice';
export { Burst } from './Burst';
export { Particles, type AmbientParticlePreset } from './Particles';
export { Impact, type ImpactPreset } from './Impact';
export { useScore } from './useScore';
export { Explosion } from './Explosion';

// Action-laget: sanntid, press, konsekvens og innlevelse.
// Destillert fra IngenmanslandMG - se build_microgame.md §"Sanntidslaget".
export { useGameClock, useMeter, useRandomPulse } from './pressure';
export { PovCamera, AimPlane } from './PovCamera';
export { Mover, type MoverState } from './Mover';
export { useWaveFlow } from './useWaveFlow';
export { useCrosshair } from './useCrosshair';
export {
    Crosshair,
    ScreenFlash,
    DangerVignette,
    TimerPill,
    MeterBar,
    LoseScreen,
} from './action';

// Lyd & kamera (immersjon)
export { microSfx, type StepSoundEvent } from './sound';
export { useAmbience, type AmbiencePreset } from './useAmbience';
export { CameraRig } from './CameraRig';
export { useIdleMotion } from './useIdleMotion';

// 2D-overlegg (output)
export {
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    ScoreHUD,
    DataReadout,
} from './overlays';

// Pedagogisk kraft
export { useHintEscalation } from './useHintEscalation';

// Input-widgets under vinduet
export {
    ChoiceRow,
    StepTracker,
    SceneSlider,
    ToolPalette,
    SceneQuiz,
    CompareToggle,
    type ChoiceItem,
    type ChoiceStatus,
    type Tool,
} from './controls';
