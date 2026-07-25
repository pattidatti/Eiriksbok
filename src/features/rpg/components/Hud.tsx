import { SPELL_BY_ID } from '../data/spells';
import { maksVerdier, nivaFremgang, useRpgStore } from '../store/useRpgStore';
import { numToHex } from '../engine/pixels';
import { tilSpill } from '../engine/bridge';

interface Props {
    hint: string | null;
    onApneSekk: () => void;
    onApneLogg: () => void;
    onPause: () => void;
}

export function Hud({ hint, onApneSekk, onApneLogg, onPause }: Props) {
    const store = useRpgStore();
    const maks = maksVerdier(store);
    const fremgang = nivaFremgang(store.xp);
    const aktive = Object.values(store.quester).filter((s) => s === 'aktiv').length;

    return (
        <div className="pointer-events-none absolute inset-0 z-20 select-none">
            {/* Øverst til venstre: liv, kraft, nivå */}
            <div className="absolute left-3 top-3 w-56 space-y-1.5">
                <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900/80 font-display text-sm font-bold text-amber-300 ring-1 ring-white/15">
                        {maks.niva}
                    </span>
                    <span className="truncate font-display text-sm font-semibold text-white drop-shadow">
                        {store.character?.name ?? 'Vandrer'}
                    </span>
                </div>
                <Stolpe verdi={store.hp} maks={maks.hp} farge="#e0483f" bak="#3a1512" merkelapp="Liv" />
                <Stolpe verdi={store.mana} maks={maks.mana} farge="#4aa3e0" bak="#122a3a" merkelapp="Kraft" />
                <Stolpe
                    verdi={fremgang.inn}
                    maks={fremgang.spenn}
                    farge="#e8c96a"
                    bak="#332a12"
                    merkelapp="Erfaring"
                    tynn
                />
            </div>

            {/* Øverst til høyre: sølv og kunnskap */}
            <div className="absolute right-3 top-3 flex items-center gap-2">
                <Merke tekst={`${store.solv} sølv`} />
                <Merke tekst={`${store.riktigeSvar} riktige`} />
            </div>

            {/* Knapperad */}
            <div className="pointer-events-auto absolute right-3 top-14 flex gap-2">
                <Knapp onClick={onApneSekk} tekst="Sekk" tast="I" />
                <Knapp onClick={onApneLogg} tekst="Oppdrag" tast="L" merke={aktive || undefined} />
                <Knapp onClick={onPause} tekst="Meny" tast="Esc" />
            </div>

            {/* Besvergelser nederst */}
            <div className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                {store.spells.slice(0, 4).map((id, i) => {
                    const spell = SPELL_BY_ID[id];
                    if (!spell) return null;
                    const harRaad = store.mana >= spell.kostnad;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => tilSpill.emit('besvergelse', { spellId: id })}
                            title={`${spell.name} — ${spell.beskrivelse}`}
                            className={`relative h-14 w-14 rounded-xl border-2 bg-slate-900/85 transition ${
                                harRaad
                                    ? 'border-white/25 hover:border-white/60'
                                    : 'border-white/10 opacity-45'
                            }`}
                        >
                            <span
                                className="absolute inset-2 rounded-lg"
                                style={{ background: numToHex(spell.farge), opacity: 0.85 }}
                            />
                            <span className="absolute left-1 top-0.5 text-[10px] font-bold text-white/70">
                                {i + 1}
                            </span>
                            <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-white/80">
                                {spell.kostnad}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Hint om hva E gjør */}
            {hint && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/85 px-4 py-1.5 text-sm font-medium text-amber-200 ring-1 ring-white/15">
                    {hint}
                </div>
            )}

            {/* Varsler */}
            <div className="absolute left-1/2 top-16 flex w-72 -translate-x-1/2 flex-col items-center gap-1.5">
                {store.varsler.map((v) => (
                    <div
                        key={v.id}
                        className={`animate-[fadeIn_150ms_ease-out] rounded-lg px-3 py-1.5 text-center text-sm font-medium shadow-lg ring-1 ${
                            v.art === 'bra'
                                ? 'bg-emerald-500/90 text-emerald-50 ring-emerald-300/40'
                                : v.art === 'darlig'
                                  ? 'bg-rose-600/90 text-rose-50 ring-rose-300/40'
                                  : v.art === 'niva'
                                    ? 'bg-amber-400/95 text-slate-900 ring-amber-200/50'
                                    : 'bg-slate-900/90 text-slate-100 ring-white/15'
                        }`}
                    >
                        {v.tekst}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Stolpe({
    verdi,
    maks,
    farge,
    bak,
    merkelapp,
    tynn,
}: {
    verdi: number;
    maks: number;
    farge: string;
    bak: string;
    merkelapp: string;
    tynn?: boolean;
}) {
    const andel = Math.max(0, Math.min(1, verdi / Math.max(1, maks)));
    return (
        <div
            className={`relative w-full overflow-hidden rounded-full ring-1 ring-black/40 ${tynn ? 'h-2' : 'h-4'}`}
            style={{ background: bak }}
            role="progressbar"
            aria-label={merkelapp}
            aria-valuenow={Math.round(verdi)}
            aria-valuemax={Math.round(maks)}
        >
            <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{ width: `${andel * 100}%`, background: farge }}
            />
            {!tynn && (
                <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-white/90 drop-shadow">
                    {Math.ceil(verdi)} / {Math.round(maks)}
                </span>
            )}
        </div>
    );
}

function Merke({ tekst }: { tekst: string }) {
    return (
        <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-white/15">
            {tekst}
        </span>
    );
}

function Knapp({
    onClick,
    tekst,
    tast,
    merke,
}: {
    onClick: () => void;
    tekst: string;
    tast: string;
    merke?: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative rounded-lg bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-white/15 transition hover:bg-slate-800"
        >
            {tekst}
            <span className="ml-1.5 rounded bg-white/10 px-1 text-[10px] text-slate-300">{tast}</span>
            {merke ? (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900">
                    {merke}
                </span>
            ) : null}
        </button>
    );
}
