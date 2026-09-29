import { useState } from 'react';
import { EPOKER } from '../data/epoker';
import { KAPITLER, harKapitler, kapittelNr, synligeSteg } from '../data/kapitler';
import { MELLOMSPILL_BY_ID } from '../data/mellomspill';
import { maksVerdier, useRpgStore } from '../store/useRpgStore';
import type { MellomspillDef, QuestDef } from '../types';
import { Ramme } from './DialogOverlay';

/** Oppdragsloggen. Viser hintet, ikke svaret. */
export function QuestLog({ quester, onLukk }: { quester: QuestDef[]; onLukk: () => void }) {
    const status = useRpgStore((s) => s.quester);
    const kapittelnummer = useRpgStore((s) => s.kapittel);
    const epokeId = useRpgStore((s) => s.epokeId);
    const gjort = useRpgStore((s) => s.steg);
    const aktive = quester.filter((q) => status[q.id] === 'aktiv');
    const ferdige = quester.filter((q) => status[q.id] === 'ferdig');

    // Kapittelet står øverst, før bankspørsmålene. Dette er den ene tingen
    // eleven faktisk trenger å vite når hun åpner loggen, og fram til nå sto
    // den ingen steder: `synligeSteg()` var skrevet ferdig og aldri kalt, så
    // tjuefem mål-linjer lå i `kapitler.ts` uten å nå en skjerm.
    //
    // Merk at listen ikke er en oppskrift. `synligeSteg` skjuler alt med
    // uoppfylte krav, så hun ser hva hun kan gjøre nå - ikke hele kapittelet.
    //
    // Utenfor kampanjen står det ingen kapitler. Prøvebanen har sine egne
    // oppdrag, men ikke noe kapittel 1 i 793 - og en logg som påsto det, ville
    // vært like feil der som HUD-kortet var. Se `KAPITTEL_EPOKE`.
    const iKampanjen = harKapitler(epokeId);
    const kapittel = kapittelNr(kapittelnummer);
    const steg = iKampanjen ? synligeSteg(kapittel, gjort) : [];
    const naa = steg.filter((s) => !s.ferdig);
    const tatt = steg.filter((s) => s.ferdig);

    return (
        <Ramme onLukk={onLukk}>
            <h2 className="mb-1 font-display text-2xl font-bold text-amber-200">Oppdrag</h2>
            {iKampanjen && (
                <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">
                    Kapittel {kapittel.nr} · {kapittel.tittel} · {kapittel.aar}
                </p>
            )}

            {iKampanjen && (
                <>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Nå ({naa.length})
                    </h3>
                    {naa.length === 0 ? (
                        <p className="mb-5 text-sm text-slate-500">
                            Ingenting står igjen i dette kapittelet.
                        </p>
                    ) : (
                        <ul className="mb-5 space-y-2">
                            {naa.map((s) => (
                                <li
                                    key={s.id}
                                    data-prove="kapittelsteg"
                                    className="rounded-xl border border-amber-300/40 bg-amber-300/10 p-3"
                                >
                                    <p className="font-display font-semibold text-amber-100">
                                        {s.tittel}
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-200">
                                        {s.mal}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            {tatt.length > 0 && (
                <ul className="mb-5 space-y-1">
                    {tatt.map((s) => (
                        <li
                            key={s.id}
                            className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200"
                        >
                            {s.tittel}
                        </li>
                    ))}
                </ul>
            )}

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Spørsmål fra folk ({aktive.length})
            </h3>
            {aktive.length === 0 ? (
                <p className="mb-5 text-sm text-slate-500">
                    Ingen. Snakk med folk som har et gult utropstegn over hodet.
                </p>
            ) : (
                <ul className="mb-5 space-y-2">
                    {aktive.map((q) => (
                        <li
                            key={q.id}
                            className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3"
                        >
                            <p className="font-display font-semibold text-amber-100">{q.title}</p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-300">{q.hint}</p>
                        </li>
                    ))}
                </ul>
            )}

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Fullført ({ferdige.length})
            </h3>
            {ferdige.length === 0 ? (
                <p className="text-sm text-slate-500">Ingen ennå.</p>
            ) : (
                <ul className="space-y-1">
                    {ferdige
                        .slice(-12)
                        .reverse()
                        .map((q) => (
                            <li
                                key={q.id}
                                className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200"
                            >
                                {q.title}
                            </li>
                        ))}
                </ul>
            )}
        </Ramme>
    );
}

/** Pausemeny med verdenskart over sonene som kommer. */
export function PauseMeny({
    onFortsett,
    onAvslutt,
    onNyKarakter,
    onApneBordet,
    onApneMinnetre,
}: {
    onFortsett: () => void;
    onAvslutt: () => void;
    onNyKarakter: () => void;
    /** Åpne et mellomspill hun alt har vært gjennom en gang. */
    onApneBordet: (id: string) => void;
    onApneMinnetre: () => void;
}) {
    const niva = maksVerdier(useRpgStore()).niva;
    const steg = useRpgStore((s) => s.steg);
    // Bordene hun har låst opp: de som hører til et kapittel hun har fullført.
    // Kildekritikk er det ene i dette spillet som blir bedre av å leses to
    // ganger, og et bord hun bare får se én gang, er et bord hun klikker seg
    // gjennom.
    const bord = KAPITLER.filter((k) => steg.includes(`kapittel:${k.nr}`))
        .map((k) => ({
            kapittel: k.nr,
            def: k.mellomspillEtter && MELLOMSPILL_BY_ID[k.mellomspillEtter],
        }))
        .filter((b): b is { kapittel: number; def: MellomspillDef } => Boolean(b.def));

    return (
        <div className="absolute inset-0 z-50 overflow-y-auto bg-slate-950/95 px-4 py-8">
            <div className="mx-auto max-w-3xl">
                <h2 className="mb-1 text-center font-display text-3xl font-bold text-amber-200">
                    Pause
                </h2>
                <p className="mb-6 text-center text-sm text-slate-400">
                    Spillet lagrer seg selv. Du kan trygt lukke fanen.
                </p>

                <div className="mb-6 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={onFortsett}
                        className="rounded-xl bg-amber-400 px-6 py-3 font-display font-bold text-slate-900 transition hover:bg-amber-300"
                    >
                        Fortsett
                    </button>
                    <button
                        type="button"
                        onClick={onApneMinnetre}
                        className="rounded-xl border border-emerald-300/30 px-6 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-400/10"
                    >
                        Minnetreet
                    </button>
                    <button
                        type="button"
                        onClick={onAvslutt}
                        className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-slate-200 transition hover:bg-white/5"
                    >
                        Tilbake til øving
                    </button>
                    <button
                        type="button"
                        onClick={onNyKarakter}
                        className="rounded-xl border border-rose-400/30 px-6 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
                    >
                        Ny figur (sletter alt)
                    </button>
                </div>

                {bord.length > 0 && (
                    <section className="mb-6">
                        <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                            Kildebordet
                        </h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            {bord.map((b) => (
                                <button
                                    key={b.def.id}
                                    type="button"
                                    onClick={() => onApneBordet(b.def.id)}
                                    className="rounded-xl border border-amber-300/25 bg-amber-300/5 px-4 py-2.5 text-left transition hover:border-amber-300/60 hover:bg-amber-300/10"
                                >
                                    <span className="block font-display text-sm font-bold text-amber-100">
                                        {b.def.tittel}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-400">
                                        Kildene fra kapittel {b.kapittel}. Ligger framme.
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                <VerdensKart niva={niva} />
            </div>
        </div>
    );
}

/**
 * Verdenskartet over epokene. Ti kort merket «Kommer» rett i ansiktet på eleven
 * leser som et uferdig spill. Her vises den ene ferdige epoken som det den er, og resten
 * ligger sammenrullet bak en knapp - som et løfte hun kan velge å se, ikke en
 * liste over det som mangler.
 */
function VerdensKart({ niva }: { niva: number }) {
    const [visAlle, setVisAlle] = useState(false);
    const apne = EPOKER.filter((e) => e.spillbar);
    const kommer = EPOKER.filter((e) => !e.spillbar);

    return (
        <>
            <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                Verden
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
                {apne.map((e) => (
                    <div
                        key={e.id}
                        className={`rounded-xl border p-3 ${
                            niva >= e.krevesNiva
                                ? 'border-emerald-400/40 bg-emerald-500/10'
                                : 'border-white/10 bg-white/5 opacity-70'
                        }`}
                    >
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="font-display font-semibold text-slate-100">{e.title}</p>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">
                                {e.era}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-slate-400">{e.pitch}</p>
                        <p className="mt-1.5 text-[11px] font-semibold">
                            {niva >= e.krevesNiva ? (
                                <span className="text-emerald-300">Åpen</span>
                            ) : (
                                <span className="text-amber-300">Krever nivå {e.krevesNiva}</span>
                            )}
                        </p>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={() => setVisAlle((v) => !v)}
                className="mx-auto mt-4 block rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
            >
                {visAlle
                    ? 'Skjul resten av verden'
                    : `Se hva som ligger lenger ute (${kommer.length} steder)`}
            </button>

            {visAlle && (
                <ul className="mx-auto mt-3 max-w-xl space-y-1.5">
                    {kommer.map((e) => (
                        <li key={e.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                            <span className="font-semibold text-slate-200">{e.title}</span>
                            <span className="ml-2 text-[11px] uppercase tracking-wider text-slate-500">
                                {e.era}
                            </span>
                            <p className="text-xs text-slate-400">{e.pitch}</p>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
