import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NORDVIK_LANDMARKS, NORDVIK_NPCS } from '../data/nordvik';
import { sfx } from '../engine/audio';
import { useRpgStore } from '../store/useRpgStore';
import type { QuestDef } from '../types';

interface DialogProps {
    npcId: string;
    quester: QuestDef[];
    onLukk: () => void;
    onTaOppdrag: (quest: QuestDef) => void;
    onSvarPa: (quest: QuestDef) => void;
}

/**
 * Samtalen med en NPC. Den har tre deler, og alle er synlige samtidig:
 * det NPC-en sier, det hun *vet* (svarene eleven leter etter), og oppdraget.
 */
export function DialogOverlay({ npcId, quester, onLukk, onTaOppdrag, onSvarPa }: DialogProps) {
    const npc = NORDVIK_NPCS.find((n) => n.id === npcId);
    const status = useRpgStore((s) => s.quester);
    const [replikk] = useState(() =>
        npc ? npc.smalltalk[Math.floor(Math.random() * npc.smalltalk.length)] : ''
    );
    const [visKunnskap, setVisKunnskap] = useState(false);

    const aktiv = quester.find((q) => q.giverId === npcId && status[q.id] === 'aktiv') ?? null;
    const ny = quester.find((q) => q.giverId === npcId && !status[q.id]) ?? null;

    useEffect(() => {
        const lytt = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onLukk();
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    }, [onLukk]);

    if (!npc) return null;

    return (
        <Ramme onLukk={onLukk}>
            <header className="mb-3">
                <h2 className="font-display text-2xl font-bold text-amber-200">{npc.name}</h2>
                <p className="text-xs uppercase tracking-widest text-slate-400">{npc.role}</p>
            </header>

            <p className="mb-4 text-[15px] leading-relaxed text-slate-100">«{replikk}»</p>

            {/*
                Kunnskapen ligger bak et klikk, ikke oppslått ved siden av
                svarknappen. Før sto fasiten i klartekst rett over «Jeg vet
                svaret», så letingen falt bort selv der svaret faktisk fantes.
            */}
            {npc.kunnskap && npc.kunnskap.length > 0 && (
                <section className="mb-4 rounded-xl border border-sky-400/25 bg-sky-400/5 p-3">
                    <button
                        type="button"
                        onClick={() => setVisKunnskap((v) => !v)}
                        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest text-sky-300"
                    >
                        <span>Spør {npc.name.split(' ')[0]} ut</span>
                        <span aria-hidden>{visKunnskap ? '−' : '+'}</span>
                    </button>
                    {visKunnskap && (
                        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-200">
                            {npc.kunnskap.map((k) => (
                                <li key={k.tekst} className="border-l-2 border-sky-400/40 pl-3">
                                    {k.tekst}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {aktiv ? (
                <section className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-3">
                    <h3 className="mb-1 font-display font-semibold text-amber-200">{aktiv.title}</h3>
                    <p className="mb-3 text-sm text-slate-300">{aktiv.hint}</p>
                    <button
                        type="button"
                        onClick={() => onSvarPa(aktiv)}
                        className="w-full rounded-lg bg-amber-400 px-4 py-2.5 font-semibold text-slate-900 transition hover:bg-amber-300"
                    >
                        Jeg vet svaret
                    </button>
                </section>
            ) : ny ? (
                <section className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <h3 className="mb-1 font-display font-semibold text-slate-100">{ny.title}</h3>
                    <p className="mb-3 text-sm leading-relaxed text-slate-300">«{ny.intro}»</p>
                    <button
                        type="button"
                        onClick={() => onTaOppdrag(ny)}
                        className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-400"
                    >
                        Ta oppdraget
                    </button>
                </section>
            ) : (
                <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                    {npc.name.split(' ')[0]} har ikke mer å be deg om nå.
                </p>
            )}
        </Ramme>
    );
}

interface LandmarkProps {
    landmarkId: string;
    onLukk: () => void;
}

export function LandmarkOverlay({ landmarkId, onLukk }: LandmarkProps) {
    const lm = NORDVIK_LANDMARKS.find((l) => l.id === landmarkId);
    const markerLest = useRpgStore((s) => s.markerLest);
    const lest = useRpgStore((s) => s.lest);
    const forste = lm ? !lest.includes(lm.id) : false;

    useEffect(() => {
        sfx.apne();
        if (lm && forste) markerLest(lm.id);
        // Skal bare kjøre når landemerket åpnes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lm?.id]);

    useEffect(() => {
        const lytt = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'e' || e.key === 'E') onLukk();
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    }, [onLukk]);

    if (!lm) return null;

    return (
        <Ramme onLukk={onLukk}>
            <p className="text-xs uppercase tracking-widest text-slate-400">
                {lm.kind === 'runestein'
                    ? 'Runestein'
                    : lm.kind === 'skilt'
                      ? 'Innskrift'
                      : lm.kind === 'baal'
                        ? 'Bål'
                        : 'Kiste'}
            </p>
            <h2 className="mb-3 font-display text-2xl font-bold text-amber-200">{lm.title}</h2>
            <p className="text-[15px] leading-relaxed text-slate-100">{lm.text}</p>
            {forste && (
                <p className="mt-4 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
                    Du husker dette nå. +5 erfaring.
                </p>
            )}
        </Ramme>
    );
}

export function Ramme({ children, onLukk }: { children: React.ReactNode; onLukk: () => void }) {
    return (
        <div className="absolute inset-0 z-40 grid place-items-end justify-items-center bg-slate-950/40 px-3 pb-6 sm:place-items-center sm:pb-3">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/95 p-5 shadow-2xl">
                {children}
                <button
                    type="button"
                    onClick={onLukk}
                    className="mt-4 w-full rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                >
                    Lukk (Esc)
                </button>
            </div>
        </div>
    );
}

/** Liten lenke tilbake til artikkelen et spørsmål kom fra. */
export function KildeLenke({ href, tittel }: { href: string; tittel: string }) {
    return (
        <Link
            to={href}
            target="_blank"
            rel="noreferrer"
            className="text-sky-300 underline decoration-sky-300/40 underline-offset-2 transition hover:text-sky-200"
        >
            {tittel}
        </Link>
    );
}
