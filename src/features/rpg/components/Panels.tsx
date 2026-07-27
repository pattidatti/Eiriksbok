import { useState } from 'react';
import { ITEM_BY_ID, RARITY_COLOR, RARITY_LABEL, SLOT_LABEL } from '../data/items';
import { finnNpc } from '../data/steder';
import { SPELL_BY_ID } from '../data/spells';
import { EPOKER } from '../data/epoker';
import { maksVerdier, useRpgStore } from '../store/useRpgStore';
import type { ItemSlot, QuestDef } from '../types';
import { Ramme } from './DialogOverlay';

/** Sekken: alt eleven eier, og det hun har på seg. */
export function InventoryPanel({ onLukk, onEndret }: { onLukk: () => void; onEndret: () => void }) {
    const store = useRpgStore();
    const maks = maksVerdier(store);

    const utrust = (id: string) => {
        store.utrust(id);
        onEndret();
    };
    const taAv = (slot: ItemSlot) => {
        store.taAv(slot);
        onEndret();
    };

    return (
        <Ramme onLukk={onLukk}>
            <h2 className="mb-4 font-display text-2xl font-bold text-amber-200">Sekken</h2>

            <section className="mb-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    På kroppen
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                    {(['vapen', 'rustning', 'amulett'] as ItemSlot[]).map((slot) => {
                        const id = store.utstyr[slot];
                        const item = id ? ITEM_BY_ID[id] : null;
                        return (
                            <div
                                key={slot}
                                className="rounded-xl border border-white/12 bg-white/5 p-3"
                                style={
                                    item
                                        ? { borderColor: `${RARITY_COLOR[item.rarity]}55` }
                                        : undefined
                                }
                            >
                                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                                    {SLOT_LABEL[slot]}
                                </p>
                                {item ? (
                                    <>
                                        <p
                                            className="font-semibold"
                                            style={{ color: RARITY_COLOR[item.rarity] }}
                                        >
                                            {item.name}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => taAv(slot)}
                                            className="mt-2 rounded-md border border-white/15 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/10"
                                        >
                                            Ta av
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500">Tomt</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="mb-5 grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl bg-white/5 p-3 text-sm sm:grid-cols-3">
                <Stat navn="Liv" verdi={maks.hp} />
                <Stat navn="Kraft" verdi={maks.mana} />
                <Stat navn="Styrke" verdi={maks.styrke} />
                <Stat navn="Visdom" verdi={maks.visdom} />
                <Stat navn="Vern" verdi={maks.vern} />
                <Stat navn="Sølv" verdi={store.solv} />
            </section>

            <section className="mb-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    I sekken ({store.sekk.length})
                </h3>
                {store.sekk.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Tom. Fell noen tåkeskapninger, så fyller den seg.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {store.sekk.map((id, i) => {
                            const item = ITEM_BY_ID[id];
                            if (!item) return null;
                            return (
                                <li
                                    key={`${id}-${i}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                                >
                                    <div className="min-w-0">
                                        <p
                                            className="font-semibold"
                                            style={{ color: RARITY_COLOR[item.rarity] }}
                                        >
                                            {item.name}{' '}
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                                {RARITY_LABEL[item.rarity]}
                                            </span>
                                        </p>
                                        <p className="truncate text-xs text-slate-400">
                                            {item.flavor}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-300">
                                            {item.weapon
                                                ? `${item.weapon.skade} skade · ${item.weapon.rekkevidde} rekkevidde`
                                                : Object.entries(item.stats)
                                                      .map(([k, v]) => `+${v} ${k}`)
                                                      .join(' · ')}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => utrust(id)}
                                        className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-amber-300"
                                    >
                                        Ta på
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Besvergelser
                </h3>
                <ul className="space-y-1.5">
                    {store.spells.map((id) => {
                        const spell = SPELL_BY_ID[id];
                        if (!spell) return null;
                        return (
                            <li key={id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                                <span className="font-semibold text-slate-100">{spell.name}</span>
                                <span className="ml-2 text-xs text-slate-400">
                                    {spell.kostnad} kraft
                                </span>
                                <p className="text-xs text-slate-400">{spell.beskrivelse}</p>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </Ramme>
    );
}

function Stat({ navn, verdi }: { navn: string; verdi: number }) {
    return (
        <div className="flex justify-between">
            <span className="text-slate-400">{navn}</span>
            <span className="font-semibold text-slate-100">{verdi}</span>
        </div>
    );
}

/** Oppdragsloggen. Viser hintet, ikke svaret. */
export function QuestLog({ quester, onLukk }: { quester: QuestDef[]; onLukk: () => void }) {
    const status = useRpgStore((s) => s.quester);
    const aktive = quester.filter((q) => status[q.id] === 'aktiv');
    const ferdige = quester.filter((q) => status[q.id] === 'ferdig');

    return (
        <Ramme onLukk={onLukk}>
            <h2 className="mb-4 font-display text-2xl font-bold text-amber-200">Oppdrag</h2>

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Pågår ({aktive.length})
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
}: {
    onFortsett: () => void;
    onAvslutt: () => void;
    onNyKarakter: () => void;
}) {
    const niva = maksVerdier(useRpgStore()).niva;

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

/** Bera Kremmers bod. Grunnen til at sølvet i sekken betyr noe. */
export function ButikkPanel({ npcId, onLukk }: { npcId: string; onLukk: () => void }) {
    const npc = finnNpc(npcId);
    const solv = useRpgStore((s) => s.solv);
    const sekk = useRpgStore((s) => s.sekk);
    const utstyr = useRpgStore((s) => s.utstyr);
    const kjop = useRpgStore((s) => s.kjop);
    if (!npc?.handler) return null;

    const eier = (id: string) => sekk.includes(id) || Object.values(utstyr).includes(id);

    return (
        <Ramme onLukk={onLukk}>
            <header className="mb-3 flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl font-bold text-amber-200">{npc.name}</h2>
                    <p className="text-xs uppercase tracking-widest text-slate-400">{npc.role}</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200">
                    {solv} sølv
                </span>
            </header>

            <p className="mb-4 text-[15px] leading-relaxed text-slate-100">
                «{npc.handler.velkomst}»
            </p>

            <ul className="space-y-2">
                {npc.handler.varer.map((id) => {
                    const item = ITEM_BY_ID[id];
                    if (!item?.pris) return null;
                    const harRaad = solv >= item.pris;
                    const alt = eier(id);
                    return (
                        <li
                            key={id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                            <div className="min-w-0">
                                <p
                                    className="font-semibold"
                                    style={{ color: RARITY_COLOR[item.rarity] }}
                                >
                                    {item.name}
                                </p>
                                <p className="truncate text-xs text-slate-400">{item.flavor}</p>
                                <p className="mt-0.5 text-[11px] text-slate-300">
                                    {item.weapon
                                        ? `${item.weapon.skade} skade · ${item.weapon.rekkevidde} rekkevidde`
                                        : Object.entries(item.stats)
                                              .map(([k, v]) => `+${v} ${k}`)
                                              .join(' · ')}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={!harRaad || alt}
                                onClick={() => kjop(id)}
                                className="shrink-0 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-900 transition enabled:hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
                            >
                                {alt ? 'Har den' : `${item.pris} sølv`}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </Ramme>
    );
}
