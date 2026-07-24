import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Trophy, RotateCcw, Star, Flame } from 'lucide-react';

// Presentasjons-overlegg for mikrospill: transient banner, hjørne-etikett,
// dra-hint, fakta-kort og vinn-skjerm. Disse er "output" - input-widgetene
// (knapper, slidere, verktøy) bor i controls.tsx.

type Corner = 'tl' | 'tr' | 'bl' | 'br';
const CORNER: Record<Corner, string> = {
    tl: 'top-3 left-3',
    tr: 'top-3 right-3',
    bl: 'bottom-3 left-3',
    br: 'bottom-3 right-3',
};

// Transient melding øverst i scenen (f.eks. "Toget kommer!"). Vis/skjul ved å
// sende inn message=null. Plasseres absolutt - krever en relativ scene-container.
//
// Default: smalt (max-w-xs) og sentrert. De fleste spill har en DataReadout/
// SceneBadge i et topphjørne; et smalt sentrert banner klarerer begge hjørnene
// av seg selv ved realistiske bredder, uten å dytte banneret ned i scenen.
//
// wide=true: banneret bruker hele toppbredden (én linje for lengre meldinger).
// Bruk KUN når spillet holder begge topphjørnene fri - dvs. har flyttet teller/
// etikett til bunnen (corner="bl"/"br"). Ellers overlapper det hjørne-pillene.
export function SceneBanner({
    message,
    wide = false,
}: {
    message?: string | null;
    wide?: boolean;
}) {
    const box = wide
        ? 'top-3 left-3 right-3 mx-auto max-w-2xl'
        : 'top-3 left-1/2 -translate-x-1/2 w-[calc(100%-15rem)] max-w-xs';
    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    key={message}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute ${box} rounded-xl bg-amber-900/85 text-amber-50 px-4 py-2.5 text-sm font-semibold shadow-lg text-center pointer-events-none`}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Liten etikett i et hjørne (f.eks. tidsperiode/era).
export function SceneBadge({
    children,
    corner = 'br',
}: {
    children: React.ReactNode;
    corner?: Corner;
}) {
    return (
        <div
            className={`absolute ${CORNER[corner]} px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow pointer-events-none`}
        >
            {children}
        </div>
    );
}

// "Dra for å se / klikk her"-hint nede i scenen. Vis bare i idle-tilstand.
// corner: 'bl' (default) eller 'bc' (bunn-senter). Bruk 'bc' når spillet har en
// DataReadout i bunn-venstre, så hint og teller ikke overlapper.
export function DragHint({
    show,
    children,
    corner = 'bl',
}: {
    show: boolean;
    children: React.ReactNode;
    corner?: 'bl' | 'bc';
}) {
    const pos = corner === 'bc' ? 'bottom-3 left-1/2 -translate-x-1/2' : 'bottom-3 left-3';
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`absolute ${pos} inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-800 shadow pointer-events-none`}
                >
                    <Hand className="w-3.5 h-3.5" />
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Live data-avlesning: viser tall som endrer seg i sanntid mens eleven drar/
// justerer. Gjør sammenhengen mellom handling og effekt synlig (pedagogisk kjerne).
//   <DataReadout items={[{ label: 'Fart', value: speed.toFixed(1), unit: 'knop' }]} />
export function DataReadout({
    items,
    corner = 'tr',
}: {
    items: { label: string; value: string | number; unit?: string }[];
    corner?: Corner;
}) {
    return (
        <div
            className={`absolute ${CORNER[corner]} flex flex-col gap-1 px-3 py-2 bg-white/85 backdrop-blur-sm rounded-xl shadow pointer-events-none`}
        >
            {items.map((it) => (
                <div key={it.label} className="flex items-baseline justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {it.label}
                    </span>
                    <span className="text-sm font-bold text-slate-800 tabular-nums">
                        {it.value}
                        {it.unit && (
                            <span className="text-[10px] text-slate-400 ml-0.5">{it.unit}</span>
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
}

// Fakta-/forklaringskort under vinduet etter et valg.
export function SceneFact({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-amber-200 rounded-xl p-3"
        >
            <p className="text-xs text-slate-600 leading-relaxed">{children}</p>
        </motion.div>
    );
}

// Score-HUD: stjerner + combo-teller i et hjørne av scenen. Gir synlig progresjon
// og belønning - den lille sløyfen som gjør spillet vanedannende.
export function ScoreHUD({
    combo = 0,
    stars = 0,
    maxStars = 3,
    corner = 'tl',
}: {
    combo?: number;
    stars?: number;
    maxStars?: number;
    corner?: Corner;
}) {
    return (
        <div className={`absolute ${CORNER[corner]} flex items-center gap-2 pointer-events-none`}>
            <div className="flex items-center gap-0.5 px-2 py-1 bg-white/85 backdrop-blur-sm rounded-full shadow">
                {Array.from({ length: maxStars }).map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                            i < stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                    />
                ))}
            </div>
            <AnimatePresence>
                {combo >= 2 && (
                    <motion.div
                        key="combo"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow"
                    >
                        <Flame className="w-3.5 h-3.5" />
                        {combo}x
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Vinn-skjerm med trofé, tittel, brødtekst og reset (+ valgfri "gå videre").
// Skal ligge i scaffoldens `children` (kontrollfeltet under vinduet) - IKKE i
// `overlays`: der er den en flow-div inne i overflow-hidden-canvasen og klippes
// usynlig bort (Argumentbroen-fellen). DEV-vakthunden under sier ifra.
export function WinScreen({
    title,
    children,
    onReplay,
    onNext,
}: {
    title: string;
    children?: React.ReactNode;
    onReplay?: () => void;
    onNext?: () => void;
}) {
    const guard = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (import.meta.env.DEV && guard.current?.closest('[data-mg-overlays]')) {
            console.warn(
                '[kit/WinScreen] er montert i `overlays` og klippes bort av canvasen - flytt den til scaffoldens children.'
            );
        }
    }, []);
    return (
        <motion.div
            ref={guard}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 sm:flex sm:items-center sm:gap-4"
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                    <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-emerald-900 leading-snug">{title}</p>
                </div>
                {children && (
                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">{children}</p>
                )}
            </div>
            <div className="mt-2.5 sm:mt-0 flex gap-2 flex-shrink-0">
                {onReplay && (
                    <button
                        onClick={onReplay}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Spill igjen
                    </button>
                )}
                {onNext && (
                    <button
                        onClick={onNext}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition"
                    >
                        Gå videre
                    </button>
                )}
            </div>
        </motion.div>
    );
}
