/* eslint-disable react-refresh/only-export-components -- formatererne under
   hører sammen med primitivene som bruker dem: et beløp skal se likt ut
   overalt, og da må formatering og komponent bo i samme fil. */
// Byggeklossene alle Pengeliv-modulene deler.
//
// Poenget er at et beløp ser likt ut uansett hvilken modul det står i, slik
// at eleven kjenner igjen tallet når det dukker opp igjen et annet sted.
//
// Bank i strukturen, lek i reaksjonene: layouten er nøktern som en nettbank,
// mens tallene teller seg fram når de endrer seg. Det er pedagogikk, ikke
// pynt - eleven skal rekke å se hvilken vei pengene gikk.

import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    useTransform,
} from 'framer-motion';
import { Info, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Formatering
// ---------------------------------------------------------------------------

/** Formaterer et tall norsk: mellomrom som tusenskille, komma som desimaltegn. */
export function formaterTall(verdi: number, desimaler = 0): string {
    const negativ = verdi < 0;
    const fast = Math.abs(verdi).toFixed(desimaler);
    const [heltall, desimaldel] = fast.split('.');
    // Hardt mellomrom (\u00a0), slik at «12 500 kr» aldri brekker over to linjer.
    const gruppert = heltall.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return `${negativ ? '-' : ''}${gruppert}${desimaldel ? `,${desimaldel}` : ''}`;
}

/** Formaterer et beløp med «kr» etter tallet, slik norske banker gjør. */
export function formaterKroner(verdi: number, desimaler = 0): string {
    return `${formaterTall(verdi, desimaler)}\u00a0kr`;
}

/** Formaterer et desimaltall som prosent: 0.22 blir «22 %». */
export function formaterProsent(sats: number, desimaler = 1): string {
    return `${formaterTall(sats * 100, desimaler)}\u00a0%`;
}

// ---------------------------------------------------------------------------
// Kroner
// ---------------------------------------------------------------------------

/** Hvilken vei et tall skal leses. `auto` farger etter fortegnet. */
export type Tone = 'auto' | 'noytral' | 'positiv' | 'negativ';

function toneKlasse(tone: Tone, verdi: number): string {
    if (tone === 'positiv') return 'text-emerald-600';
    if (tone === 'negativ') return 'text-rose-600';
    if (tone === 'noytral') return 'text-slate-900';
    if (verdi > 0) return 'text-emerald-600';
    if (verdi < 0) return 'text-rose-600';
    return 'text-slate-500';
}

interface KronerProps {
    verdi: number;
    /** Setter plusstegn foran positive beløp, og farger etter fortegnet. */
    visTegn?: boolean;
    /** Farger beløpet. Standard er svart uansett fortegn. */
    tone?: Tone;
    /** Stor variant til hovedtallet i en modul. */
    stor?: boolean;
    /** Antall desimaler. Standard er hele kroner. */
    desimaler?: number;
    /** Slå av opptellingen der tallet ikke skal trekke oppmerksomhet. */
    animer?: boolean;
    className?: string;
}

/**
 * Et pengebeløp. Når beløpet endrer seg, teller tallet seg fram til den nye
 * verdien i stedet for å hoppe, så eleven ser retningen pengene gikk.
 */
export function Kroner({
    verdi,
    visTegn = false,
    tone,
    stor = false,
    desimaler = 0,
    animer = true,
    className = '',
}: KronerProps) {
    const redusertBevegelse = useReducedMotion();
    const motorverdi = useMotionValue(verdi);

    useEffect(() => {
        if (!animer || redusertBevegelse) {
            motorverdi.set(verdi);
            return;
        }
        const kontroll = animate(motorverdi, verdi, {
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
        });
        return () => kontroll.stop();
    }, [verdi, animer, redusertBevegelse, motorverdi]);

    const tekst = useTransform(motorverdi, (v: number) => {
        const prefiks = visTegn && v > 0 ? '+' : '';
        return `${prefiks}${formaterKroner(v, desimaler)}`;
    });

    const valgtTone: Tone = tone ?? (visTegn ? 'auto' : 'noytral');

    // Tailwind avgjør hvilken tekststørrelse som vinner ut fra rekkefølgen i
    // det bygde CSS-et, ikke ut fra rekkefølgen i class-attributtet. Sto det
    // alltid en `text-sm` her, slo den `text-3xl` kalleren sendte inn, og
    // «store tall» rendret som småtekst. Derfor: har kalleren sagt hvor stor
    // teksten skal være, holder primitiven fingrene fra fatet.
    const kallerSetterStorrelse = /(^|\s)(text-\[|text-(xs|sm|base|lg|\d?xl))/.test(className);
    const storrelse = kallerSetterStorrelse
        ? stor
            ? 'font-bold tracking-tight'
            : 'font-semibold'
        : stor
          ? 'text-3xl font-bold tracking-tight md:text-4xl'
          : 'text-sm font-semibold';

    return (
        <motion.span
            className={`tabular-nums ${storrelse} ${toneKlasse(valgtTone, verdi)} ${className}`}
        >
            {tekst}
        </motion.span>
    );
}

// ---------------------------------------------------------------------------
// Kort
// ---------------------------------------------------------------------------

interface KortProps {
    tittel?: string;
    undertittel?: string;
    ikon?: ReactNode;
    /** Knapp eller nøkkeltall som skal stå til høyre i korttittelen. */
    handling?: ReactNode;
    children: ReactNode;
    className?: string;
}

/** Glasskortet modulene bor i. */
export function Kort({ tittel, undertittel, ikon, handling, children, className = '' }: KortProps) {
    return (
        <section
            className={`rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur ${className}`}
        >
            {(tittel || handling) && (
                <header className="flex items-start gap-3 border-b border-slate-100 px-4 py-3">
                    {ikon && (
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            {ikon}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        {tittel && (
                            <h2 className="truncate text-sm font-bold text-slate-900">{tittel}</h2>
                        )}
                        {undertittel && (
                            <p className="mt-0.5 text-xs text-slate-500">{undertittel}</p>
                        )}
                    </div>
                    {handling && <div className="shrink-0">{handling}</div>}
                </header>
            )}
            <div className="px-4 py-3">{children}</div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Tallrad
// ---------------------------------------------------------------------------

interface TallradProps {
    etikett: string;
    belop: number;
    /** Én setning som forklarer linja. Står under raden, i mindre skrift. */
    forklaring?: string;
    /** Satsen bak linja, som desimaltall. Vises som en liten prosentbrikke. */
    sats?: number;
    /** Farger beløpet. Standard er svart. */
    tone?: Tone;
    /** Sluttsummen i en tabell: tykkere strek og større tall. */
    fremhevet?: boolean;
    /** Rykker raden inn, for underposter. */
    innrykk?: boolean;
    className?: string;
}

/** Én linje i en tabell: etikett til venstre, beløp til høyre. */
export function Tallrad({
    etikett,
    belop,
    forklaring,
    sats,
    tone = 'noytral',
    fremhevet = false,
    innrykk = false,
    className = '',
}: TallradProps) {
    return (
        <div
            className={`border-b py-2 last:border-b-0 ${
                fremhevet ? 'border-slate-300' : 'border-slate-100'
            } ${innrykk ? 'pl-4' : ''} ${className}`}
        >
            <div className="flex items-baseline justify-between gap-3">
                <span
                    className={`min-w-0 flex-1 ${
                        fremhevet ? 'text-sm font-bold text-slate-900' : 'text-sm text-slate-700'
                    }`}
                >
                    {etikett}
                    {sats !== undefined && (
                        <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                            {formaterProsent(sats)}
                        </span>
                    )}
                </span>
                <Kroner
                    verdi={belop}
                    tone={tone}
                    className={fremhevet ? 'text-base font-bold' : ''}
                />
            </div>
            {forklaring && (
                <p className="mt-1 pr-20 text-xs leading-snug text-slate-500">{forklaring}</p>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Knapp
// ---------------------------------------------------------------------------

interface KnappProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primar' | 'sekundar';
    /** Valgt tilstand, for knapperader der én av flere er slått på. */
    aktiv?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit';
    /** Kompakt variant til verktøylinjer. */
    liten?: boolean;
    className?: string;
    tittel?: string;
}

/** Knappen resten av appen bruker. Primær er handlingen eleven skal gjøre. */
export function Knapp({
    children,
    onClick,
    variant = 'primar',
    aktiv = false,
    disabled = false,
    type = 'button',
    liten = false,
    className = '',
    tittel,
}: KnappProps) {
    const stil = aktiv
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-300'
        : variant === 'primar'
          ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
    const storrelse = liten ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm';

    return (
        <motion.button
            type={type}
            title={tittel}
            onClick={onClick}
            disabled={disabled}
            aria-pressed={aktiv ? true : undefined}
            whileTap={disabled ? undefined : { scale: 0.96 }}
            className={`rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${stil} ${storrelse} ${className}`}
        >
            {children}
        </motion.button>
    );
}

// ---------------------------------------------------------------------------
// Forklaring
// ---------------------------------------------------------------------------

interface ForklaringProps {
    /** Fagbegrepet som forklares, f.eks. «minstefradrag». */
    begrep: string;
    /** Forklaringen, skrevet så en 14-åring forstår den uten hjelp. */
    children: ReactNode;
    className?: string;
}

/**
 * Liten info-boble som forklarer et fagbegrep akkurat der det brukes.
 * Forklaringen skal stå der og da, ikke i en ordliste eleven ikke åpner.
 */
export function Forklaring({ begrep, children, className = '' }: ForklaringProps) {
    const [apen, setApen] = useState(false);
    const id = useId();

    return (
        <span className={`relative inline-flex ${className}`}>
            <button
                type="button"
                aria-expanded={apen}
                aria-controls={id}
                onClick={() => setApen((v) => !v)}
                title={`Hva betyr ${begrep}?`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
                <Info className="h-3.5 w-3.5" />
                <span className="sr-only">Hva betyr {begrep}?</span>
            </button>

            <AnimatePresence>
                {apen && (
                    <motion.span
                        id={id}
                        role="tooltip"
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 top-7 z-30 block w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg"
                    >
                        <span className="mb-1 flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">{begrep}</span>
                            <button
                                type="button"
                                onClick={() => setApen(false)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X className="h-3.5 w-3.5" />
                                <span className="sr-only">Lukk forklaringen</span>
                            </button>
                        </span>
                        <span className="block text-xs leading-relaxed text-slate-600">
                            {children}
                        </span>
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}
