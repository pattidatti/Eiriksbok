import { motion } from 'framer-motion';
import { Gamepad2, Loader2, Play } from 'lucide-react';

// Lukket mikrospill i en artikkel. Skal se ut som noe man trykker på for å
// spille - ikke som en sammenslått faktaboks. Derfor: spillnavnet stort,
// en tydelig «Spill»-knapp, og glød + bevegelse når musa kommer nær.
//
// Tegnes uten at spillmodulen er lastet (se MicroGameBlock), så alt her må
// komme fra registeret: tittel og ev. estimert spilletid.

interface MicroGameLauncherProps {
    title: string;
    estimatedSeconds?: number;
    loading?: boolean;
    // Kortet er kommet inn i bildet: lysstripen sveiper over én gang.
    inView?: boolean;
    onStart: () => void;
    // Eleven viser tegn til å ville spille (hover, fokus, finger ned) -
    // MicroGameBlock bruker det til å hente spillet i forkant.
    onIntent?: () => void;
    // Spillet åpnes i fullskjerm (artikkel). Kortet sier det, så ingen blir overrasket.
    fullscreen?: boolean;
}

function formatPlayTime(seconds?: number): string | null {
    if (!seconds || seconds <= 0) return null;
    if (seconds < 60) return 'under 1 min';
    return `ca. ${Math.round(seconds / 60)} min`;
}

export function MicroGameLauncher({
    title,
    estimatedSeconds,
    loading = false,
    inView = false,
    onStart,
    onIntent,
    fullscreen = false,
}: MicroGameLauncherProps) {
    const playTime = formatPlayTime(estimatedSeconds);

    return (
        <motion.button
            type="button"
            onClick={onStart}
            onPointerEnter={onIntent}
            onFocus={onIntent}
            onPointerDown={onIntent}
            disabled={loading}
            aria-label={`Spill ${title}`}
            aria-busy={loading}
            initial="rest"
            animate={loading ? 'hover' : 'rest'}
            whileHover="hover"
            whileFocus="hover"
            whileTap={{ scale: 0.985 }}
            variants={{ rest: { y: 0 }, hover: { y: -2 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="mg-launcher group relative w-full overflow-hidden rounded-2xl border border-indigo-200/80 bg-white/80 backdrop-blur-sm text-left shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-indigo-400 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.12),0_12px_32px_-12px_rgba(99,102,241,0.55)] focus-visible:outline-none focus-visible:border-indigo-500 focus-visible:shadow-[0_0_0_4px_rgba(99,102,241,0.25)] disabled:cursor-wait"
        >
            {/* Myk farge-glød bak innholdet som tennes ved hover. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-50 via-violet-50/60 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
            />
            {/* Lysstripe som sveiper over kortet - én gang når det kommer inn
                i bildet, og igjen ved hover. Se .mg-launcher i index.css. */}
            <span aria-hidden className={`mg-launcher-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 ${
                    inView ? 'mg-launcher-sheen--intro' : ''
                }`}
            />

            <span className="relative flex items-center gap-3 px-3.5 py-3 sm:px-4">
                <motion.span
                    variants={{
                        rest: { rotate: 0, scale: 1 },
                        hover: { rotate: [0, -12, 10, -6, 0], scale: 1.08 },
                    }}
                    transition={{ duration: 0.5 }}
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0"
                >
                    <Gamepad2 className="w-6 h-6" />
                </motion.span>

                <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        Mikrospill{playTime && <span className="text-indigo-400"> · {playTime}</span>}
                        {fullscreen && <span className="text-indigo-400"> · fullskjerm</span>}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold leading-tight text-slate-900 [text-wrap:balance] line-clamp-2">
                        {title}
                    </span>
                </span>

                <motion.span
                    variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition-colors group-hover:bg-indigo-500 flex-shrink-0"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Play className="w-4 h-4 fill-current" />
                    )}
                    <span className="hidden sm:inline">{loading ? 'Laster' : 'Spill'}</span>
                </motion.span>
            </span>
        </motion.button>
    );
}
