// Utstyret, slik WoW gjør det: figuren til venstre med ti plasser rundt seg,
// sekken nede til høyre, og hos en kremmer bytter boden plass med figuren.
//
// Alt kan dras: fra sekken til en plass på figuren, fra figuren tilbake, mellom
// ruter, til hurtigbaren og til kremmeren. Høyreklikk gjør det vanlige - tar på,
// spiser, eller selger når boden er åpen. Et vanlig klikk låser verktøytipset
// og gir knapper, for den som spiller på nettbrett eller ikke vet om
// høyreklikket.
//
// Verden står synlig bak. Vinduene har ingen slør over spillet: det er figuren
// hennes der ute som får på seg det hun velger her.

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { motion, useReducedMotion } from 'framer-motion';
import {
    HURTIG_PLASSER,
    ITEM_BY_ID,
    RARITY_COLOR,
    RARITY_LABEL,
    SLOT_LABEL,
    equipmentBonus,
    erOdelagt,
    holdbarhetIgjen,
    kanTasPa,
    maksHoldbarhet,
    salgspris,
    utseendeFra,
} from '../data/items';
import { figurLook, rustningTier } from '../data/eleven';
import { finnNpc } from '../data/steder';
import { KAPITTEL_BY_NR } from '../data/kapitler';
import { prisFor, trinnFor } from '../engine/aere';
import { renderHeroPortrait, type Dir } from '../engine/spriteforge';
import { maksVerdier, reparasjonsprisAlt, useRpgStore, utrustetVaapen } from '../store/useRpgStore';
import type { Gjenstand, ItemDef, ItemSlot } from '../types';
import { GjenstandIkon, TomPlassIkon } from './GjenstandIkon';

type Kilde =
    | { art: 'sekk'; rute: number }
    | { art: 'slot'; slot: ItemSlot }
    | { art: 'hurtig'; plass: number };

const nokkel = (k: Kilde) =>
    k.art === 'sekk' ? `sekk:${k.rute}` : k.art === 'slot' ? `slot:${k.slot}` : `hurtig:${k.plass}`;

function lesNokkel(id: string): Kilde | null {
    const [art, verdi] = id.split(':');
    if (art === 'sekk') return { art, rute: Number(verdi) };
    if (art === 'slot') return { art, slot: verdi as ItemSlot };
    if (art === 'hurtig') return { art, plass: Number(verdi) };
    return null;
}

const VENSTRE: ItemSlot[] = ['hode', 'amulett', 'kappe', 'rustning'];
const HOYRE: ItemSlot[] = ['hender', 'belte', 'bein', 'fotter'];
const NEDE: ItemSlot[] = ['vapen', 'skjold'];

/**
 * Slippet treffer ruta under musepekeren, som i WoW. Er pekeren mellom to
 * ruter, faller vi tilbake på den ruta ikonet dekker mest av.
 */
const underPekeren: CollisionDetection = (args) => {
    const treff = pointerWithin(args);
    return treff.length > 0 ? treff : rectIntersection(args);
};

const STAT_NAVN: Record<string, string> = { hp: 'liv', styrke: 'styrke', vern: 'vern' };

// ─── Vinduet ────────────────────────────────────────────────────────────────

export function Utstyrsvindu({
    onLukk,
    kremmerId,
}: {
    onLukk: () => void;
    /** Står hun i en bod, er dette kremmeren. Da vises boden i stedet for figuren. */
    kremmerId?: string;
}) {
    const store = useRpgStore();
    const [drar, setDrar] = useState<Kilde | null>(null);
    const [pekt, setPekt] = useState<{ kilde: Kilde; rect: DOMRect } | null>(null);
    const [valgt, setValgt] = useState<{ kilde: Kilde; rect: DOMRect } | null>(null);
    const sensorer = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );
    const iBod = Boolean(kremmerId);

    // I og C lukker, som de åpner. Esc tar RpgPage seg av.
    useEffect(() => {
        const lytt = (e: KeyboardEvent) => {
            if (e.key === 'i' || e.key === 'I' || e.key === 'c' || e.key === 'C') onLukk();
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    }, [onLukk]);

    const gjenstandI = (k: Kilde): Gjenstand | null => {
        if (k.art === 'sekk') return store.sekk[k.rute] ?? null;
        if (k.art === 'slot') return store.utstyr[k.slot];
        const id = store.hurtigbar[k.plass];
        return id ? { id } : null;
    };

    /** Det høyreklikket gjør. I boden selger det; ellers tar det på eller spiser. */
    const hovedHandling = (k: Kilde) => {
        setValgt(null);
        setPekt(null);
        if (k.art === 'sekk') {
            if (iBod) store.selg(k.rute);
            else store.brukRute(k.rute);
        } else if (k.art === 'slot') {
            store.taAv(k.slot);
        } else {
            const id = store.hurtigbar[k.plass];
            if (id) store.brukVare(id);
        }
    };

    const slipp = (e: DragEndEvent) => {
        setDrar(null);
        const fra = lesNokkel(String(e.active.id));
        const til = e.over ? String(e.over.id) : null;
        if (!fra) return;
        const g = gjenstandI(fra);
        const item = g ? ITEM_BY_ID[g.id] : undefined;

        // Dras noe av hurtigbaren og slippes utenfor, blir plassen tom - som
        // i WoW. Varen ligger fortsatt i sekken.
        if (fra.art === 'hurtig') {
            const mal = til ? lesNokkel(til) : null;
            if (!mal) return store.settHurtig(fra.plass, null);
            if (mal.art === 'hurtig') {
                const annen = store.hurtigbar[mal.plass];
                store.settHurtig(mal.plass, store.hurtigbar[fra.plass]);
                if (annen) useRpgStore.getState().settHurtig(fra.plass, annen);
            }
            return;
        }
        if (!til || !g || !item) return;

        if (til === 'kremmer') {
            if (fra.art === 'sekk') store.selg(fra.rute);
            return;
        }
        const mal = lesNokkel(til);
        if (!mal) return;

        if (fra.art === 'sekk') {
            if (mal.art === 'sekk') store.flyttISekk(fra.rute, mal.rute);
            else if (mal.art === 'slot' && kanTasPa(item) && item.slot === mal.slot)
                store.utrust(fra.rute);
            else if (mal.art === 'hurtig' && item.forbruk) store.settHurtig(mal.plass, item.id);
        } else if (fra.art === 'slot' && mal.art === 'sekk') {
            // Ligger det en del for samme plass i ruta, byttes de. Ellers går
            // delen ned i ruta, eller i første ledige om ruta er opptatt.
            const der = store.sekk[mal.rute];
            const derItem = der ? ITEM_BY_ID[der.id] : undefined;
            if (der && kanTasPa(derItem) && derItem.slot === fra.slot) store.utrust(mal.rute);
            else store.taAv(fra.slot, mal.rute);
        }
    };

    const start = (e: DragStartEvent) => {
        setDrar(lesNokkel(String(e.active.id)));
        setPekt(null);
        setValgt(null);
    };

    const dratt = drar ? gjenstandI(drar) : null;
    const draItem = dratt ? ITEM_BY_ID[dratt.id] : undefined;
    // Når noe fra sekken dras, lyser plassen det hører hjemme på.
    const lyserPlass = draItem && kanTasPa(draItem) ? draItem.slot : null;

    const vist = valgt ?? pekt;
    const vistG = vist ? gjenstandI(vist.kilde) : null;

    const ruteProps = {
        onPek: (kilde: Kilde, rect: DOMRect | null) => setPekt(rect ? { kilde, rect } : null),
        onVelg: (kilde: Kilde, rect: DOMRect) =>
            setValgt((v) => (v && nokkel(v.kilde) === nokkel(kilde) ? null : { kilde, rect })),
        onHoyreklikk: hovedHandling,
        valgtNokkel: valgt ? nokkel(valgt.kilde) : null,
    };

    return (
        <DndContext
            sensors={sensorer}
            collisionDetection={underPekeren}
            onDragStart={start}
            onDragEnd={slipp}
            onDragCancel={() => setDrar(null)}
        >
            <div
                className="absolute inset-0 z-40 overflow-y-auto p-3 lg:overflow-hidden"
                onClick={(e) => {
                    if (e.target === e.currentTarget) setValgt(null);
                }}
            >
                <div className="pointer-events-none flex min-h-full flex-col items-center gap-3 lg:block">
                    {iBod ? (
                        <Kremmerpanel npcId={kremmerId!} onLukk={onLukk} />
                    ) : (
                        <Figurpanel lyserPlass={lyserPlass} {...ruteProps} onLukk={onLukk} />
                    )}
                    <Sekkpanel iBod={iBod} {...ruteProps} onLukk={onLukk} />
                </div>
            </div>

            {vist && vistG && !drar && (
                <Verktoytips
                    gjenstand={vistG}
                    kilde={vist.kilde}
                    rect={vist.rect}
                    laast={Boolean(valgt)}
                    iBod={iBod}
                    onHandling={() => hovedHandling(vist.kilde)}
                    onKast={
                        vist.kilde.art === 'sekk'
                            ? () => {
                                  store.kast((vist.kilde as { rute: number }).rute);
                                  setValgt(null);
                              }
                            : undefined
                    }
                />
            )}

            <DragOverlay dropAnimation={null}>
                {draItem ? (
                    <div
                        className="h-12 w-12 rotate-[-6deg] rounded-lg border-2 bg-slate-900/90 p-1.5 shadow-2xl"
                        style={{ borderColor: RARITY_COLOR[draItem.rarity] }}
                    >
                        <GjenstandIkon item={draItem} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// ─── Felles for rutene ──────────────────────────────────────────────────────

interface RuteProps {
    onPek: (kilde: Kilde, rect: DOMRect | null) => void;
    onVelg: (kilde: Kilde, rect: DOMRect) => void;
    onHoyreklikk: (kilde: Kilde) => void;
    valgtNokkel: string | null;
}

/**
 * Én rute: kan dras fra når den har noe i seg, og tar alltid imot.
 *
 * Størrelsen er valgt for Chromebooken: 48 piksler er stort nok til å treffe
 * med styreplaten, og fem i bredden får plass ved siden av figuren på 1366.
 */
function Rute({
    kilde,
    gjenstand,
    tom,
    lyser = false,
    nummer,
    onPek,
    onVelg,
    onHoyreklikk,
    valgtNokkel,
}: RuteProps & {
    kilde: Kilde;
    gjenstand: Gjenstand | null;
    /** Det som vises i en tom rute. */
    tom?: React.ReactNode;
    lyser?: boolean;
    /** Tasten, på hurtigbaren. */
    nummer?: number;
}) {
    const id = nokkel(kilde);
    const item = gjenstand ? ITEM_BY_ID[gjenstand.id] : undefined;
    const drag = useDraggable({ id, disabled: !item });
    const drop = useDroppable({ id });
    const rolig = useReducedMotion();
    const odelagt = erOdelagt(gjenstand);
    const igjen = gjenstand ? holdbarhetIgjen(gjenstand) : null;
    const maks = item ? maksHoldbarhet(item) : null;
    const slitt = igjen !== null && maks !== null && igjen > 0 && igjen <= maks * 0.2;
    // Hurtigbaren viser hvor mange som er igjen i hele sekken, ikke i én stabel.
    const sekk = useRpgStore((s) => s.sekk);
    const antall =
        kilde.art === 'hurtig' && item
            ? sekk.reduce((n, g) => n + (g?.id === item.id ? (g.antall ?? 1) : 0), 0)
            : (gjenstand?.antall ?? 1);
    const tomHurtig = kilde.art === 'hurtig' && antall === 0;

    return (
        <motion.button
            type="button"
            ref={(el: HTMLButtonElement | null) => {
                drag.setNodeRef(el);
                drop.setNodeRef(el);
            }}
            {...drag.attributes}
            {...drag.listeners}
            data-rute={id}
            aria-label={
                item
                    ? item.name
                    : kilde.art === 'slot'
                      ? `${SLOT_LABEL[kilde.slot]}, tom`
                      : 'Tom rute'
            }
            whileHover={rolig || !item ? undefined : { scale: 1.06 }}
            whileTap={rolig || !item ? undefined : { scale: 0.94 }}
            onMouseEnter={(e) => item && onPek(kilde, e.currentTarget.getBoundingClientRect())}
            onMouseLeave={() => onPek(kilde, null)}
            onClick={(e) => item && onVelg(kilde, e.currentTarget.getBoundingClientRect())}
            onContextMenu={(e) => {
                e.preventDefault();
                if (item) onHoyreklikk(kilde);
            }}
            className={`relative h-12 w-12 shrink-0 touch-none rounded-lg border-2 p-1.5 transition-colors ${
                drop.isOver
                    ? 'border-amber-300 bg-amber-300/20'
                    : lyser
                      ? 'border-amber-300/70 bg-amber-300/10 shadow-[0_0_14px_rgba(252,211,77,0.35)]'
                      : 'bg-slate-900/80'
            } ${drag.isDragging ? 'opacity-30' : ''} ${valgtNokkel === id ? 'ring-2 ring-white/70' : ''}`}
            style={{
                borderColor:
                    drop.isOver || lyser
                        ? undefined
                        : item
                          ? odelagt
                              ? '#ef4444'
                              : `${RARITY_COLOR[item.rarity]}aa`
                          : 'rgba(255,255,255,0.08)',
            }}
        >
            {item ? (
                <span
                    className={`block h-full w-full ${odelagt || tomHurtig ? 'opacity-40 grayscale' : ''}`}
                >
                    <GjenstandIkon item={item} />
                </span>
            ) : (
                tom
            )}
            {odelagt && <span className="absolute inset-0 rounded-md bg-red-600/25" aria-hidden />}
            {slitt && (
                <span
                    className="absolute left-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-orange-400"
                    aria-hidden
                />
            )}
            {item && antall > 1 && (
                <span className="absolute bottom-0 right-1 font-mono text-[11px] font-bold text-white [text-shadow:0_1px_2px_#000,0_0_2px_#000]">
                    {antall}
                </span>
            )}
            {nummer !== undefined && (
                <span className="absolute left-1 top-0 font-mono text-[10px] font-bold text-amber-200/90 [text-shadow:0_1px_2px_#000]">
                    {nummer}
                </span>
            )}
        </motion.button>
    );
}

/** Rammen rundt et vindu. Egen lukkeknapp, ingen slør. */
function Vindu({
    tittel,
    undertittel,
    onLukk,
    className,
    children,
    innRetning,
}: {
    tittel: React.ReactNode;
    undertittel?: React.ReactNode;
    onLukk: () => void;
    className?: string;
    children: React.ReactNode;
    innRetning: -1 | 1;
}) {
    const rolig = useReducedMotion();
    return (
        <motion.section
            initial={rolig ? false : { opacity: 0, x: 24 * innRetning, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={`pointer-events-auto rounded-2xl border border-amber-200/20 bg-slate-950/92 shadow-[0_12px_48px_rgba(0,0,0,0.6)] backdrop-blur-sm ${className ?? ''}`}
        >
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-2.5">
                <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-bold text-amber-200">
                        {tittel}
                    </h2>
                    {undertittel && (
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            {undertittel}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onLukk}
                    aria-label="Lukk"
                    className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                    ✕
                </button>
            </header>
            {children}
        </motion.section>
    );
}

// ─── Figuren ────────────────────────────────────────────────────────────────

function Figurpanel({
    lyserPlass,
    onLukk,
    ...rute
}: RuteProps & { lyserPlass: ItemSlot | null; onLukk: () => void }) {
    const store = useRpgStore();
    const [retning, setRetning] = useState<Dir>('ned');
    const maks = maksVerdier(store);
    const vapen = utrustetVaapen(store);
    const REKKE: Dir[] = ['ned', 'venstre', 'opp', 'hoyre'];
    const snu = (steg: number) =>
        setRetning((r) => REKKE[(REKKE.indexOf(r) + steg + REKKE.length) % REKKE.length]);

    // Figuren tegnes av den samme smia som verden. Det hun ser her, er det
    // hun er der ute - ikke et bilde av det.
    const portrett = useMemo(
        () =>
            renderHeroPortrait(
                figurLook(
                    store.character?.kjortel,
                    store.character?.appearance,
                    rustningTier(store.utstyr.rustning),
                    utseendeFra(store.utstyr)
                ),
                8,
                retning
            ),
        [store.character, store.utstyr, retning]
    );
    const aere = KAPITTEL_BY_NR[store.kapittel]?.systemer?.aere;

    const plass = (slot: ItemSlot) => (
        <div key={slot} className="flex flex-col items-center gap-0.5">
            <Rute
                {...rute}
                kilde={{ art: 'slot', slot }}
                gjenstand={store.utstyr[slot]}
                tom={<TomPlassIkon slot={slot} />}
                lyser={lyserPlass === slot}
            />
        </div>
    );

    return (
        <Vindu
            tittel={store.character?.name ?? 'Figuren'}
            undertittel={`Nivå ${maks.niva}`}
            onLukk={onLukk}
            innRetning={-1}
            className="w-full max-w-[26rem] lg:absolute lg:left-4 lg:top-4"
        >
            <div className="flex items-stretch justify-between gap-2 px-4 pt-3">
                <div className="flex flex-col gap-2">{VENSTRE.map(plass)}</div>
                <div className="relative flex flex-1 flex-col items-center justify-end overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_50%_70%,rgba(252,211,77,0.14),transparent_65%)]">
                    <img
                        src={portrett}
                        alt=""
                        draggable={false}
                        className="h-[13.5rem] w-auto select-none [image-rendering:pixelated]"
                    />
                    <div className="mb-1 flex gap-1">
                        <button
                            type="button"
                            onClick={() => snu(-1)}
                            aria-label="Snu figuren mot venstre"
                            className="grid h-6 w-7 place-items-center rounded-md text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                        >
                            ◀
                        </button>
                        <button
                            type="button"
                            onClick={() => snu(1)}
                            aria-label="Snu figuren mot høyre"
                            className="grid h-6 w-7 place-items-center rounded-md text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                        >
                            ▶
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-2">{HOYRE.map(plass)}</div>
            </div>
            <div className="flex justify-center gap-2 px-4 pb-3 pt-2">{NEDE.map(plass)}</div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 border-t border-white/10 px-4 py-3 text-sm">
                <Stat navn="Liv" verdi={`${Math.min(store.hp, maks.hp)} / ${maks.hp}`} />
                <Stat navn="Skade" verdi={vapen.skade} />
                <Stat navn="Styrke" verdi={maks.styrke} />
                <Stat navn="Vern" verdi={maks.vern} />
                {/*
                    Æren står her bare i kapitler som lar henne flytte den. Et
                    tall hun ikke kan gjøre noe med, er et tall hun lærer å se
                    forbi - og da ser hun forbi det den dagen det gjelder.
                */}
                {aere && <Stat navn="Ære" verdi={store.aere} />}
            </dl>
            {aere && (
                <p className="-mt-2 px-4 pb-3 text-xs text-slate-400">
                    {trinnFor(store.aere).navn}. {trinnFor(store.aere).folk}
                </p>
            )}
            {/*
                Det hun *kan*, ligger i minnetreet. Å legge en kopi av det her
                ville gjort kunnskapen til en ting i sekken, og det er nettopp
                det den ikke er (blueprint §15).
            */}
            <p className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
                Det du kan, ligger ikke i sekken. Trykk M for minnetreet.
            </p>
        </Vindu>
    );
}

function Stat({ navn, verdi }: { navn: string; verdi: React.ReactNode }) {
    return (
        <div className="flex justify-between">
            <dt className="text-slate-400">{navn}</dt>
            <dd className="font-semibold tabular-nums text-slate-100">{verdi}</dd>
        </div>
    );
}

// ─── Sekken ─────────────────────────────────────────────────────────────────

function Sekkpanel({ iBod, onLukk, ...rute }: RuteProps & { iBod: boolean; onLukk: () => void }) {
    const sekk = useRpgStore((s) => s.sekk);
    const hurtigbar = useRpgStore((s) => s.hurtigbar);
    const solv = useRpgStore((s) => s.solv);
    const brukt = sekk.filter(Boolean).length;

    return (
        <Vindu
            tittel="Sekken"
            undertittel={`${brukt} av ${sekk.length} ruter`}
            onLukk={onLukk}
            innRetning={1}
            className="w-fit lg:absolute lg:bottom-4 lg:right-4"
        >
            <div className="grid grid-cols-5 gap-1.5 px-4 pt-3">
                {sekk.map((g, i) => (
                    <Rute key={i} {...rute} kilde={{ art: 'sekk', rute: i }} gjenstand={g} />
                ))}
            </div>

            <div className="mt-3 border-t border-white/10 px-4 pt-2.5">
                <p className="mb-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    Hurtigbar · tast 1-{HURTIG_PLASSER}
                </p>
                <div className="flex gap-1.5">
                    {hurtigbar.map((id, i) => (
                        <Rute
                            key={i}
                            {...rute}
                            kilde={{ art: 'hurtig', plass: i }}
                            gjenstand={id ? { id } : null}
                            nummer={i + 1}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 px-4 py-2.5 text-sm">
                <span className="text-[11px] text-slate-400">
                    {iBod
                        ? 'Høyreklikk eller dra til boden for å selge'
                        : 'Høyreklikk for å ta på eller spise'}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-amber-200">
                    {solv} sølv
                </span>
            </div>
        </Vindu>
    );
}

// ─── Kremmeren ──────────────────────────────────────────────────────────────

/** Boden. Grunnen til at sølvet i sekken betyr noe. */
function Kremmerpanel({ npcId, onLukk }: { npcId: string; onLukk: () => void }) {
    const npc = finnNpc(npcId);
    const store = useRpgStore();
    const { setNodeRef: bodRef, isOver: overBod } = useDroppable({ id: 'kremmer' });
    const [pekt, setPekt] = useState<{ item: ItemDef; rect: DOMRect } | null>(null);
    if (!npc?.handler) return null;

    const reparasjon = reparasjonsprisAlt(store);

    return (
        <Vindu
            tittel={npc.name}
            undertittel={npc.role}
            onLukk={onLukk}
            innRetning={-1}
            className="w-full max-w-[26rem] lg:absolute lg:left-4 lg:top-4"
        >
            <div ref={bodRef} className={`transition-colors ${overBod ? 'bg-amber-300/10' : ''}`}>
                <p className="px-4 pt-3 text-[15px] leading-relaxed text-slate-100">
                    «{npc.handler.velkomst}»
                </p>
                <ul className="mt-2 grid max-h-[50vh] gap-1 overflow-y-auto px-3 pb-2 lg:max-h-[calc(100vh-15rem)]">
                    {npc.handler.varer.map((id) => {
                        const item = ITEM_BY_ID[id];
                        if (!item?.pris) return null;
                        // Prisen kommer fra samme funksjon som `kjop` bruker. To
                        // steder som regner den hver for seg, blir uenige den
                        // dagen noen justerer kurven.
                        const pris = prisFor(item.pris, store.aere);
                        const harRaad = store.solv >= pris;
                        return (
                            <li key={id} className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={!harRaad}
                                    onClick={() => store.kjop(id)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        store.kjop(id);
                                    }}
                                    onMouseEnter={(e) =>
                                        setPekt({
                                            item,
                                            rect: e.currentTarget.getBoundingClientRect(),
                                        })
                                    }
                                    onMouseLeave={() => setPekt(null)}
                                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1 text-left transition enabled:hover:bg-white/5 disabled:opacity-45"
                                >
                                    <span
                                        className="h-10 w-10 shrink-0 rounded-md border-2 bg-slate-900 p-1"
                                        style={{ borderColor: `${RARITY_COLOR[item.rarity]}aa` }}
                                    >
                                        <GjenstandIkon item={item} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className="block truncate text-sm font-semibold"
                                            style={{ color: RARITY_COLOR[item.rarity] }}
                                        >
                                            {item.name}
                                        </span>
                                        <span className="block truncate text-[11px] text-slate-400">
                                            {item.slot
                                                ? SLOT_LABEL[item.slot]
                                                : item.forbruk?.verb === 'Spis'
                                                  ? 'Mat'
                                                  : 'Urt'}
                                        </span>
                                    </span>
                                    <span
                                        className={`shrink-0 text-xs font-bold tabular-nums ${harRaad ? 'text-amber-200' : 'text-red-300'}`}
                                    >
                                        {pris} sølv
                                    </span>
                                </button>
                                {item.forbruk && (
                                    <button
                                        type="button"
                                        disabled={store.solv < pris * 5}
                                        onClick={() => store.kjop(id, 5)}
                                        className="shrink-0 rounded-md border border-white/15 px-1.5 py-1 text-[11px] font-semibold text-slate-200 transition enabled:hover:bg-white/10 disabled:opacity-40"
                                        aria-label={`Kjøp fem ${item.name}`}
                                    >
                                        ×5
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2.5">
                <button
                    type="button"
                    disabled={reparasjon === 0 || store.solv < reparasjon}
                    onClick={() => store.reparerAlt()}
                    className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-bold text-slate-950 transition enabled:hover:bg-amber-300 disabled:bg-white/10 disabled:text-slate-400"
                >
                    {reparasjon === 0 ? 'Alt er helt' : `Reparer alt · ${reparasjon}`}
                </button>
                <span className="text-[11px] text-slate-400">Dra hit for å selge</span>
            </div>
            {pekt && (
                <Verktoytips
                    gjenstand={{ id: pekt.item.id }}
                    rect={pekt.rect}
                    laast={false}
                    iBod={false}
                    fraBod
                />
            )}
        </Vindu>
    );
}

// ─── Verktøytipset ──────────────────────────────────────────────────────────

/**
 * Det WoW-spillere leser før de gjør noe: navnet i sjeldenhetsfargen, hva den
 * gir, og hva som endrer seg om du tar den på.
 */
function Verktoytips({
    gjenstand,
    kilde,
    rect,
    laast,
    iBod,
    fraBod = false,
    onHandling,
    onKast,
}: {
    gjenstand: Gjenstand;
    kilde?: Kilde;
    rect: DOMRect;
    laast: boolean;
    iBod: boolean;
    fraBod?: boolean;
    onHandling?: () => void;
    onKast?: () => void;
}) {
    const store = useRpgStore();
    const item = ITEM_BY_ID[gjenstand.id];
    if (!item) return null;

    const maks = maksHoldbarhet(item);
    const igjen = holdbarhetIgjen(gjenstand);
    const odelagt = erOdelagt(gjenstand);

    // Sammenligningen: bonusene som de er, mot bonusene med denne på.
    // Står den allerede på, er det ingenting å sammenligne med.
    const paKroppen = kilde?.art === 'slot';
    let diff: { navn: string; delta: number }[] = [];
    if (kanTasPa(item) && !paKroppen) {
        const na = equipmentBonus(store.utstyr);
        const med = equipmentBonus({ ...store.utstyr, [item.slot]: gjenstand });
        diff = (['hp', 'styrke', 'vern'] as const)
            .map((k) => ({ navn: STAT_NAVN[k], delta: med[k] - na[k] }))
            .filter((d) => d.delta !== 0);
        if (item.weapon) {
            const naVapen = utrustetVaapen(store).skade;
            const nyVapen = odelagt ? Math.round(item.weapon.skade / 2) : item.weapon.skade;
            if (nyVapen !== naVapen) diff.unshift({ navn: 'skade', delta: nyVapen - naVapen });
        }
    }
    const handlingTekst =
        kilde?.art === 'slot'
            ? 'Ta av'
            : kilde?.art === 'hurtig'
              ? item.forbruk?.verb
              : iBod
                ? `Selg · ${salgspris(item) * (gjenstand.antall ?? 1)} sølv`
                : item.forbruk
                  ? item.forbruk.verb
                  : 'Ta på';

    // Til høyre for ruta, eller til venstre om det ikke er plass.
    const bredde = 256;
    const venstre =
        rect.right + 10 + bredde > window.innerWidth ? rect.left - 10 - bredde : rect.right + 10;
    const topp = Math.max(8, Math.min(rect.top, window.innerHeight - 280));

    // Portal: vinduene flyttes med en transform når de glir inn, og inne i en
    // transform er `fixed` ikke lenger festet til skjermen.
    return createPortal(
        <div
            role="tooltip"
            className={`fixed z-50 rounded-xl border border-white/15 bg-slate-950/97 p-3 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.7)] ${laast ? '' : 'pointer-events-none'}`}
            style={{ left: Math.max(8, venstre), top: topp, width: bredde }}
        >
            <p
                className="font-display text-base font-bold leading-tight"
                style={{ color: RARITY_COLOR[item.rarity] }}
            >
                {item.name}
            </p>
            <p className="mb-1.5 text-[11px] uppercase tracking-[0.15em] text-slate-400">
                {RARITY_LABEL[item.rarity]}
                {item.slot && ` · ${SLOT_LABEL[item.slot]}`}
                {item.forbruk && ' · Forbruksvare'}
            </p>

            {item.weapon && (
                <p className={odelagt ? 'text-red-300 line-through' : 'text-slate-100'}>
                    {item.weapon.skade} skade · {item.weapon.rekkevidde} rekkevidde
                </p>
            )}
            {Object.entries(item.stats).map(([k, v]) => (
                <p key={k} className={odelagt ? 'text-red-300 line-through' : 'text-slate-100'}>
                    +{v} {STAT_NAVN[k]}
                </p>
            ))}
            {item.forbruk?.hp && (
                <p className="text-emerald-300">Gir {item.forbruk.hp} liv tilbake.</p>
            )}

            {maks !== null && igjen !== null && (
                <p
                    className={`mt-1 text-xs ${odelagt ? 'font-semibold text-red-400' : igjen <= maks * 0.2 ? 'text-orange-300' : 'text-slate-400'}`}
                >
                    {odelagt
                        ? 'Ødelagt - gir ingenting før den er reparert'
                        : `Holdbarhet ${igjen} / ${maks}`}
                </p>
            )}

            <p className="mt-2 text-[13px] italic leading-snug text-amber-100/80">
                «{item.flavor}»
            </p>

            {diff.length > 0 && (
                <div className="mt-2 border-t border-white/10 pt-2">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">
                        Hvis du tar den på
                    </p>
                    {diff.map((d) => (
                        <p
                            key={d.navn}
                            className={d.delta > 0 ? 'text-emerald-300' : 'text-red-300'}
                        >
                            {d.delta > 0 ? '+' : ''}
                            {d.delta} {d.navn}
                        </p>
                    ))}
                </div>
            )}

            {fraBod ? (
                <p className="mt-2 text-xs text-slate-400">Klikk for å kjøpe.</p>
            ) : (
                !laast &&
                !iBod && (
                    <p className="mt-2 text-xs text-slate-500">
                        Høyreklikk: {handlingTekst?.toLowerCase()}. Klikk for flere valg.
                    </p>
                )
            )}
            {!fraBod && !laast && iBod && kilde?.art === 'sekk' && (
                <p className="mt-2 text-xs text-amber-200/90">
                    Selges for {salgspris(item) * (gjenstand.antall ?? 1)} sølv
                </p>
            )}

            {laast && onHandling && handlingTekst && (
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={onHandling}
                        className="flex-1 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
                    >
                        {handlingTekst}
                    </button>
                    {onKast && (
                        <button
                            type="button"
                            onClick={onKast}
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 transition hover:border-red-400/60 hover:text-red-300"
                        >
                            Kast
                        </button>
                    )}
                </div>
            )}
        </div>,
        document.body
    );
}
