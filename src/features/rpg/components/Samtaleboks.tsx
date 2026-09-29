import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Samtaleboksen: en lav stripe nederst i bildet, slik RPG-er har gjort det
 * siden åttitallet.
 *
 * Før lå samtalen i `Ramme` - et kort midt på skjermen med mørk slør over
 * resten. Kameraet følger helten, så kortet la seg rett over henne og den hun
 * snakket med. Man snakket med et navn, ikke med en person i verden.
 *
 * Her står verden fri over stripa. Ingen slør, og boksen tar aldri mer enn
 * rundt en tredjedel av høyden - det som ikke får plass, ruller inne i den.
 *
 * Valgene er knapper med tall. Tallene er tastene: 1, 2, 3 velger uten mus.
 * Boksen finner knappene selv (`data-valg`), så den som bruker den trenger
 * ikke å føre noen liste.
 */
export function Samtaleboks({
    navn,
    undertittel,
    merke,
    children,
    valg,
    onLukk,
}: {
    navn: string;
    undertittel?: string;
    /** Liten lapp oppe til høyre, f.eks. oppdraget samtalen handler om. */
    merke?: React.ReactNode;
    children: React.ReactNode;
    valg?: React.ReactNode;
    onLukk: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const rolig = useReducedMotion();

    useEffect(() => {
        const lytt = (e: KeyboardEvent) => {
            if (e.repeat || !/^[1-9]$/.test(e.key)) return;
            const knapper = ref.current?.querySelectorAll<HTMLButtonElement>('[data-valg]');
            const knapp = knapper?.[Number(e.key) - 1];
            if (!knapp || knapp.disabled) return;
            e.preventDefault();
            knapp.click();
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    }, []);

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:pb-5">
            <motion.div
                ref={ref}
                initial={rolig ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="pointer-events-auto relative w-full max-w-3xl pt-4"
            >
                {/* Navnelappen sitter på kanten, så teksten under får hele høyden. */}
                <div className="absolute left-4 top-0 z-10 flex items-baseline gap-2 rounded-lg border border-amber-200/40 bg-slate-950 px-3 py-1 shadow-lg">
                    <h2 className="font-display text-base font-bold leading-tight text-amber-200">
                        {navn}
                    </h2>
                    {undertittel && (
                        <p className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:block">
                            {undertittel}
                        </p>
                    )}
                </div>

                <div className="rounded-2xl border border-amber-200/20 bg-slate-950/90 shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-sm">
                    <div className="max-h-[34vh] overflow-y-auto px-5 pb-3 pt-6">
                        {merke && <div className="mb-1.5">{merke}</div>}
                        {children}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-2.5">
                        {valg}
                        <button
                            type="button"
                            onClick={onLukk}
                            className="ml-auto rounded-md px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                        >
                            Lukk (Esc)
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * Ett valg i samtaleboksen. Nummeret er posisjonen blant valgene, og står på
 * knappen fordi det er tasten som velger den.
 */
export function Valg({
    nr,
    onClick,
    hoved = false,
    children,
}: {
    nr: number;
    onClick: () => void;
    /** Det valget samtalen peker mot. Ett per boks, ellers peker den ingen steder. */
    hoved?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            data-valg
            onClick={onClick}
            className={`group flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-semibold transition active:scale-[0.97] ${
                hoved
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                    : 'border border-white/15 bg-white/5 text-slate-100 hover:border-amber-200/40 hover:bg-white/10'
            }`}
        >
            <kbd
                className={`grid h-5 min-w-5 place-items-center rounded px-1 font-mono text-[11px] ${
                    hoved ? 'bg-slate-950/15 text-slate-900' : 'bg-white/10 text-amber-200'
                }`}
            >
                {nr}
            </kbd>
            <span>{children}</span>
        </button>
    );
}

/**
 * Tekst som skrives fram, tegn for tegn.
 *
 * Hele teksten står i DOM-en fra første bilde; det som ikke er skrevet ennå er
 * bare gjennomsiktig. Da hopper ikke boksen i høyde mens den fylles, og
 * skjermlesere og prøveskriptene leser hele replikken med én gang.
 *
 * Klikk, mellomrom eller Enter skriver resten med en gang. Fort nok til at
 * ingen venter på den: en runestein på 250 tegn er ferdig på under tre sekunder.
 */
export function Skrift({ tekst, className }: { tekst: string; className?: string }) {
    const rolig = useReducedMotion();
    // Framdriften hører til én bestemt tekst. Bytter teksten (spør ut, så
    // tilbake), begynner den på null uten at en effekt må nullstille den.
    const [fram, setFram] = useState({ tekst: '', n: 0 });
    const vist = rolig ? tekst.length : fram.tekst === tekst ? fram.n : 0;
    const hoppet = useRef(false);
    const hoppOver = () => {
        hoppet.current = true;
        setFram({ tekst, n: tekst.length });
    };

    useEffect(() => {
        if (rolig) return;
        hoppet.current = false;
        const start = performance.now();
        let ramme = 0;
        const steg = (na: number) => {
            if (hoppet.current) return;
            const n = Math.min(tekst.length, Math.floor(((na - start) / 1000) * 95));
            setFram({ tekst, n });
            if (n < tekst.length) ramme = requestAnimationFrame(steg);
        };
        ramme = requestAnimationFrame(steg);

        const hopp = (e: KeyboardEvent) => {
            if (e.key !== ' ' && e.key !== 'Enter') return;
            hoppet.current = true;
            setFram({ tekst, n: tekst.length });
        };
        window.addEventListener('keydown', hopp);
        return () => {
            cancelAnimationFrame(ramme);
            window.removeEventListener('keydown', hopp);
        };
    }, [tekst, rolig]);

    return (
        <p className={className} onClick={hoppOver}>
            {tekst.slice(0, vist)}
            <span className="text-transparent">{tekst.slice(vist)}</span>
        </p>
    );
}
