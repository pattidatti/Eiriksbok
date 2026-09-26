import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Loader2, Play } from 'lucide-react';

// Lukket mikrospill i en artikkel. Skal se ut som noe man trykker på for å
// spille - ikke som en sammenslått faktaboks. Derfor: spillnavnet stort,
// en tydelig «Spill»-knapp, og glød + bevegelse når musa kommer nær.
//
// Med `cover` (skjermbilde fra spillet) blir kortet en spillplakat: bildet
// selger spillet, og `hook` (én setning i du-form) sier hvem eleven er og hva
// som står på spill. Et navn som «Plottebordet» sier ingenting før man har
// spilt - bildet og kroken gjør det. Uten cover: det kompakte kortet.
//
// Tegnes uten at spillmodulen er lastet (se MicroGameBlock), så alt her må
// komme fra registeret: tittel, krok, cover og ev. estimert spilletid.

interface MicroGameLauncherProps {
    title: string;
    estimatedSeconds?: number;
    hook?: string;
    cover?: string;
    loading?: boolean;
    // Kortet er kommet inn i bildet: lysstripen sveiper over én gang.
    inView?: boolean;
    /** Får kortets plass på skjermen, så innflygingen kan starte der (MicroGameIntro). */
    onStart: (from?: DOMRect) => void;
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
    hook,
    cover,
    loading = false,
    inView = false,
    onStart,
    onIntent,
    fullscreen = false,
}: MicroGameLauncherProps) {
    const playTime = formatPlayTime(estimatedSeconds);
    // Et cover som ikke finnes (ennå), gir det kompakte kortet - aldri et hull.
    const [coverOk, setCoverOk] = useState(true);
    const poster = !!cover && coverOk;

    const meta = (
        <>
            Mikrospill{playTime && <span className="opacity-75"> · {playTime}</span>}
            {fullscreen && <span className="opacity-75"> · fullskjerm</span>}
        </>
    );

    const playButton = (big: boolean) => (
        <motion.span
            variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
            className={`mg-launcher-play relative inline-flex items-center gap-1.5 rounded-full bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-900/40 transition-colors group-hover:bg-indigo-500 flex-shrink-0 ${
                big ? 'px-5 py-3 text-base' : 'px-3.5 py-2 text-sm'
            } ${inView && !loading ? 'mg-launcher-play--breathe' : ''}`}
        >
            {loading ? (
                <Loader2 className={big ? 'w-5 h-5 animate-spin' : 'w-4 h-4 animate-spin'} />
            ) : (
                <Play className={big ? 'w-5 h-5 fill-current' : 'w-4 h-4 fill-current'} />
            )}
            <span className={big ? '' : 'hidden sm:inline'}>{loading ? 'Laster' : 'Spill'}</span>
        </motion.span>
    );

    return (
        <motion.button
            type="button"
            onClick={(e) => onStart(e.currentTarget.getBoundingClientRect())}
            onPointerEnter={onIntent}
            onFocus={onIntent}
            onPointerDown={onIntent}
            disabled={loading}
            aria-label={`Spill ${title}${hook ? `. ${hook}` : ''}`}
            aria-busy={loading}
            initial="rest"
            animate={loading ? 'hover' : 'rest'}
            whileHover="hover"
            whileFocus="hover"
            whileTap={{ scale: 0.985 }}
            variants={{ rest: { y: 0 }, hover: { y: -2 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="mg-launcher group relative block w-full overflow-hidden rounded-2xl border border-indigo-200/80 bg-white/80 backdrop-blur-sm text-left shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-indigo-400 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.12),0_12px_32px_-12px_rgba(99,102,241,0.55)] focus-visible:outline-none focus-visible:border-indigo-500 focus-visible:shadow-[0_0_0_4px_rgba(99,102,241,0.25)] disabled:cursor-wait"
        >
            {poster ? (
                // Spillplakaten: skjermbilde fra spillet med tittel og krok. På brede
                // skjermer står teksten oppå bildet; på mobil under, så den får plass.
                <>
                    <span className="relative block aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-slate-800">
                        <img
                            src={cover}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onError={() => setCoverOk(false)}
                            data-mg-cover
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
                        />
                        <span
                            aria-hidden
                            className="absolute inset-0 hidden sm:block bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent"
                        />
                        <span
                            aria-hidden
                            className={`mg-launcher-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 ${
                                inView ? 'mg-launcher-sheen--intro' : ''
                            }`}
                        />
                        {/* Mobil: bare knappen oppå bildet. */}
                        <span className="absolute right-3 bottom-3 sm:hidden">
                            {playButton(true)}
                        </span>
                        <span className="absolute inset-x-0 bottom-0 hidden sm:flex items-end gap-4 p-5">
                            <span className="min-w-0 flex-1">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white/95 backdrop-blur-sm">
                                    <Gamepad2 className="w-3.5 h-3.5" />
                                    {meta}
                                </span>
                                <span className="mt-1.5 block text-3xl font-extrabold leading-tight text-white [text-wrap:balance] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                                    {title}
                                </span>
                                {hook && (
                                    <span className="mt-1 block max-w-xl text-base font-semibold leading-snug text-white/90 line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                                        {hook}
                                    </span>
                                )}
                            </span>
                            {playButton(true)}
                        </span>
                    </span>
                    <span className="block px-4 pt-2.5 pb-3 sm:hidden">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                            <Gamepad2 className="w-3.5 h-3.5" />
                            {meta}
                        </span>
                        <span className="mt-0.5 block text-xl font-extrabold leading-tight text-slate-900 [text-wrap:balance]">
                            {title}
                        </span>
                        {hook && (
                            <span className="mt-0.5 block text-sm leading-snug text-slate-600">
                                {hook}
                            </span>
                        )}
                    </span>
                </>
            ) : (
                <>
                    {/* Myk farge-glød bak innholdet som tennes ved hover. */}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-50 via-violet-50/60 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    {/* Lysstripe som sveiper over kortet - én gang når det kommer inn
                        i bildet, og igjen ved hover. Se .mg-launcher i index.css. */}
                    <span
                        aria-hidden
                        className={`mg-launcher-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 ${
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
                                {meta}
                            </span>
                            <span className="block text-base sm:text-lg font-extrabold leading-tight text-slate-900 [text-wrap:balance] line-clamp-2">
                                {title}
                            </span>
                            {hook && (
                                <span className="block text-sm leading-snug text-slate-600 line-clamp-2">
                                    {hook}
                                </span>
                            )}
                        </span>
                        {playButton(false)}
                    </span>
                </>
            )}
        </motion.button>
    );
}
