import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Action-laget for 2D-siden: sikte, skjermglimt, fare-vignett, nedtelling,
// ressursmåler og tap-skjerm. Sammen med pressure.ts/PovCamera/Mover er dette
// det som gjør at et mikrospill kan ha puls - press, konsekvens og innlevelse.
// (useCrosshair-hooken bor i useCrosshair.ts - hold denne fila ren for
// komponent-eksporter av hensyn til fast refresh.)

// ---- Sikte ----

// Sikte-overlegg. 'mil' = militært ringsikte, 'dot' = enkel prikk (peke/styring).
// Posisjoneres ref-basert via useCrosshair (ingen re-render per frame).
export function Crosshair({
    show,
    crosshairRef,
    variant = 'mil',
}: {
    show: boolean;
    crosshairRef: React.RefObject<HTMLDivElement | null>;
    variant?: 'mil' | 'dot';
}) {
    if (!show) return null;
    return (
        <div
            ref={crosshairRef}
            className="absolute pointer-events-none"
            style={{ left: '50%', top: '45%', transform: 'translate(-50%, -50%)' }}
        >
            {variant === 'mil' ? (
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-white/50" />
                    <div className="absolute top-1/2 left-0 w-3.5 h-px bg-white/65 -translate-y-1/2" />
                    <div className="absolute top-1/2 right-0 w-3.5 h-px bg-white/65 -translate-y-1/2" />
                    <div className="absolute left-1/2 top-0 h-3.5 w-px bg-white/65 -translate-x-1/2" />
                    <div className="absolute left-1/2 bottom-0 h-3.5 w-px bg-white/65 -translate-x-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-white/55 -translate-x-1/2 -translate-y-1/2" />
                </div>
            ) : (
                <div className="w-3 h-3 rounded-full border-2 border-white/70 bg-white/25" />
            )}
        </div>
    );
}

// ---- Skjermglimt ----

const FLASH_PRESETS = {
    // Munningsglimt nederst (skudd).
    muzzle: 'radial-gradient(ellipse at 50% 108%, rgba(255,210,80,0.7) 0%, rgba(255,120,30,0.25) 35%, transparent 65%)',
    // Rødt skade-/fare-glimt fra kantene.
    damage: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(220,38,38,0.45) 100%)',
    // Hvitt lysglimt (lyskaster, lyn, blitz).
    flare: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,240,0.75) 0%, rgba(255,255,220,0.3) 45%, transparent 75%)',
} as const;

// Kort fullskjermsglimt oppå scenen. Avfyres når `trigger`-tallet endres (samme
// mønster som Burst): øk en teller ved hvert skudd/treff/sveip. trigger=0 viser
// ingenting; hver økning remonterer glimtet (key) og spiller animasjonen på nytt.
//   const [shots, setShots] = useState(0); ... setShots((s) => s + 1);
//   <ScreenFlash trigger={shots} preset="muzzle" />
export function ScreenFlash({
    trigger,
    preset = 'muzzle',
    durationMs = 80,
}: {
    trigger: number;
    preset?: keyof typeof FLASH_PRESETS;
    durationMs?: number;
}) {
    if (trigger <= 0) return null;
    return (
        <motion.div
            key={`flash-${trigger}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: Math.max(0.06, durationMs / 1000) }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: FLASH_PRESETS[preset] }}
        />
    );
}

// ---- Fare-vignett ----

// Rød puls fra kantene som vokser med farenivået (0-1). Koble mot en useMeter:
//   <DangerVignette level={alarm.value} />
// Eleven FØLER at det holder på å gå galt uten å lese et tall.
export function DangerVignette({ level, color = '239,68,68' }: { level: number; color?: string }) {
    const clamped = Math.min(1, Math.max(0, level));
    const pulse = clamped > 0.7;
    if (clamped < 0.03) return null;
    return (
        <motion.div
            animate={pulse ? { opacity: [0.85, 1, 0.85] } : { opacity: 1 }}
            transition={pulse ? { repeat: Infinity, duration: 0.55 } : undefined}
            className="absolute inset-0 pointer-events-none"
            style={{
                boxShadow: `inset 0 0 ${40 + clamped * 90}px ${clamped * 34}px rgba(${color},${
                    clamped * 0.55
                })`,
            }}
        />
    );
}

// ---- Nedtelling ----

// Tidspille i et hjørne av scenen. Blir rød og pulserer når det haster.
//   <TimerPill seconds={clock.remaining} label="Til daggry" warnBelow={15} corner="br" />
export function TimerPill({
    seconds,
    label,
    warnBelow = 10,
    corner = 'br',
}: {
    seconds: number;
    label?: string;
    warnBelow?: number;
    corner?: 'tl' | 'tr' | 'bl' | 'br';
}) {
    const pos = {
        tl: 'top-3 left-3',
        tr: 'top-3 right-3',
        bl: 'bottom-3 left-3',
        br: 'bottom-3 right-3',
    }[corner];
    const s = Math.max(0, Math.ceil(seconds));
    const mm = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, '0');
    const urgent = seconds <= warnBelow;
    return (
        <motion.div
            animate={urgent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={urgent ? { repeat: Infinity, duration: 0.8 } : undefined}
            className={`absolute ${pos} px-3 py-1.5 rounded-full text-xs font-bold shadow pointer-events-none tabular-nums ${
                urgent ? 'bg-red-600 text-white' : 'bg-white/85 backdrop-blur-sm text-slate-700'
            }`}
        >
            {label && <span className="mr-1.5 font-semibold opacity-70">{label}</span>}
            {mm}:{ss}
        </motion.div>
    );
}

// ---- Ressursmåler (under vinduet) ----

// Måler-linje med soner: normal / advarsel / kritisk. Generaliserer løpsvarme-
// baren fra IngenmanslandMG. Legges i kontrollområdet UNDER vinduet.
//   <MeterBar value={alarm.value} label="Alarmnivå" hint="Stå stille når lyset sveiper mot deg"
//       labels={{ normal: 'Rolig', warn: 'Mistenksom', danger: 'ALARM!' }} />
export function MeterBar({
    value,
    label,
    hint,
    warnAt = 0.62,
    dangerAt = 0.88,
    labels = { normal: 'Normal', warn: 'Varm', danger: 'KRITISK!' },
}: {
    value: number;
    label: string;
    hint?: string;
    warnAt?: number;
    dangerAt?: number;
    labels?: { normal: string; warn: string; danger: string };
}) {
    const zone = value >= dangerAt ? 'danger' : value >= warnAt ? 'warn' : 'normal';
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">{label}</span>
                <span
                    className={`text-xs font-bold ${
                        zone === 'danger'
                            ? 'text-red-600'
                            : zone === 'warn'
                              ? 'text-orange-500'
                              : 'text-slate-400'
                    }`}
                >
                    {labels[zone]}
                </span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                    animate={{ width: `${Math.min(1, Math.max(0, value)) * 100}%` }}
                    transition={{ duration: 0.07 }}
                    className={`h-full rounded-full ${
                        zone === 'danger'
                            ? 'bg-red-500'
                            : zone === 'warn'
                              ? 'bg-orange-400'
                              : 'bg-amber-300'
                    }`}
                />
            </div>
            {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
        </div>
    );
}

// ---- Tap-skjerm ----

// Speilbildet av WinScreen: det gikk galt, men eleven prøver igjen. En ekte
// fail-state er halve spenningen - uten den er "faren" bare pynt. Hold teksten
// saklig og lærerik (hva gikk galt historisk sett), aldri hånlig.
//   <LoseScreen title="Lyskasteren fanget deg" onRetry={reset}>
//       Grensevaktene hadde ordre om å skyte. Prøv å fryse når lyset sveiper mot deg.
//   </LoseScreen>
export function LoseScreen({
    title,
    children,
    onRetry,
    retryLabel = 'Prøv igjen',
}: {
    title: string;
    children?: React.ReactNode;
    onRetry: () => void;
    retryLabel?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="bg-rose-50 border border-rose-300 rounded-xl p-3 sm:flex sm:items-center sm:gap-4"
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-rose-900 leading-snug">{title}</p>
                </div>
                {children && (
                    <p className="text-xs text-rose-800 mt-1.5 leading-relaxed">{children}</p>
                )}
            </div>
            <div className="mt-2.5 sm:mt-0 flex-shrink-0">
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-rose-800 rounded-lg text-xs font-bold hover:bg-rose-100 transition"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {retryLabel}
                </button>
            </div>
        </motion.div>
    );
}
