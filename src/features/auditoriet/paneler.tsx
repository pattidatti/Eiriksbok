// Panelene i salene og gangen: programmet, notatblokka, studiebeviset og hurtigtastene.
// Alle åpnes fra knapperaden eller med en tast, og lukkes med Esc.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, Copy, GraduationCap, Headphones, NotebookPen, Trash2, X } from 'lucide-react';
import { hentProgram, klokkeslett, kommende, sendingNaa, tidIgjen, type Program, type Sending } from './kringkasting';
import { SALER, type Sal } from './saler';
import { grad, notaterSomTekst, useStudiebevis } from './studiebevis';

/** Skuff fra høyre. Klikk utenfor lukker. */
function Skuff({ tittel, ikon, onLukk, children }: { tittel: string; ikon: React.ReactNode; onLukk: () => void; children: React.ReactNode }) {
    return (
        <div className="absolute inset-0 z-20 flex justify-end bg-slate-900/20" onClick={onLukk}>
            <div
                className="flex h-full w-full max-w-sm flex-col bg-white/97 shadow-2xl backdrop-blur"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label={tittel}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        {ikon} {tittel}
                    </h2>
                    <button onClick={onLukk} aria-label="Lukk" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

const lesesal = (sti: string) => `/oving/auditoriet/lesesal?forelesning=${encodeURIComponent(sti)}`;

function useAlleSaler() {
    const [program, setProgram] = useState<Program | null>(null);
    useEffect(() => {
        hentProgram()
            .then(setProgram)
            .catch(() => {});
    }, []);
    return program;
}

/** Programmet i salen: hva som går, hva som kommer, og hva de andre salene sender. */
export function ProgramPanel({
    sal,
    sending,
    naa,
    onBytt,
    onLukk,
}: {
    sal: Sal;
    sending: Sending | null;
    naa: number;
    onBytt: (sal: Sal) => void;
    onLukk: () => void;
}) {
    const program = useAlleSaler();
    const poster = program?.saler[sal.id];
    const neste = useMemo(() => (poster ? kommende(sal.id, poster, naa, 6) : []), [poster, sal.id, naa]);
    const hort = useStudiebevis((s) => s.hort);

    return (
        <Skuff tittel={`Program i ${sal.navn}`} ikon={<Headphones size={20} className="text-indigo-600" />} onLukk={onLukk}>
            {sending && (
                <div className="rounded-2xl p-4 text-white" style={{ background: sal.farge }}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                        {sending.friminutt ? 'Friminutt nå' : `Nå · ${tidIgjen(sending.slutt - naa)}`}
                    </p>
                    <p className="mt-1 text-lg font-bold leading-snug">{sending.friminutt ? sending.neste.tittel : sending.post.tittel}</p>
                    {sending.friminutt && <p className="text-sm opacity-90">starter kl. {klokkeslett(sending.nesteStart)}</p>}
                    {!sending.friminutt && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link to={sending.post.kilde} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30">
                                <BookOpen size={15} /> Les artikkelen
                            </Link>
                            <Link to={lesesal(sending.post.sti)} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30">
                                Hør fra start
                            </Link>
                        </div>
                    )}
                </div>
            )}

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Senere i dag</h3>
            <ul className="mt-2 divide-y divide-slate-100">
                {neste.map(({ post, start }) => (
                    <li key={`${post.sti}:${start}`} className="flex items-baseline gap-3 py-2.5">
                        <span className="w-12 shrink-0 font-mono text-sm text-slate-500">{klokkeslett(start)}</span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-slate-900">{post.tittel}</span>
                            <span className="block text-xs text-slate-500">
                                {post.emneTittel} · {Math.max(1, Math.round(post.varighet / 60000))} min
                            </span>
                        </span>
                        {hort[post.sti] && <Check size={16} className="shrink-0 text-emerald-600" aria-label="Hørt" />}
                    </li>
                ))}
                {!neste.length && <li className="py-2.5 text-sm text-slate-500">Henter programmet ...</li>}
            </ul>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Andre saler nå</h3>
            <ul className="mt-2 grid gap-2">
                {SALER.filter((s) => s.id !== sal.id).map((s) => {
                    const sn = program ? sendingNaa(s.id, program.saler[s.id] ?? [], naa) : null;
                    return (
                        <li key={s.id}>
                            <button
                                onClick={() => onBytt(s)}
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 text-left hover:border-indigo-200 hover:bg-indigo-50"
                            >
                                <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: s.farge }} />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-slate-900">{s.navn}</span>
                                    <span className="block truncate text-xs text-slate-500">
                                        {!sn ? '...' : sn.friminutt ? `Friminutt · så ${sn.neste.tittel}` : sn.post.tittel}
                                    </span>
                                </span>
                                <span className="text-xs font-medium text-indigo-600">Gå dit</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </Skuff>
    );
}

/** Notatblokka for én forelesning. */
export function NotatPanel({ sti, tittel, onLukk }: { sti: string; tittel: string; onLukk: () => void }) {
    const notater = useStudiebevis((s) => s.notater[sti]);
    const slett = useStudiebevis((s) => s.slettNotat);
    const [kopiert, setKopiert] = useState(false);
    const liste = notater?.liste ?? [];

    const kopier = () => {
        navigator.clipboard
            ?.writeText(notaterSomTekst(tittel, liste))
            .then(() => {
                setKopiert(true);
                setTimeout(() => setKopiert(false), 1800);
            })
            .catch(() => {});
    };

    return (
        <Skuff tittel="Notatblokka" ikon={<NotebookPen size={20} className="text-amber-600" />} onLukk={onLukk}>
            <p className="text-sm text-slate-600">
                Trykk <Tast>N</Tast> når foreleseren sier noe du vil huske. Da havner setningen her.
            </p>
            <p className="mt-4 font-semibold text-slate-900">{tittel}</p>
            {liste.length === 0 ? (
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Ingen notater ennå.</p>
            ) : (
                <ul className="mt-2 grid gap-2">
                    {liste.map((n, i) => (
                        <li key={n.dato} className="group relative rounded-xl bg-amber-50/70 p-3 pr-9 text-sm leading-snug text-slate-800">
                            {n.lysbilde && n.lysbilde !== liste[i - 1]?.lysbilde && (
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-700">{n.lysbilde}</span>
                            )}
                            {n.tekst}
                            <button
                                onClick={() => slett(sti, n.dato)}
                                aria-label="Slett notatet"
                                className="absolute right-2 top-2 rounded p-1 text-slate-300 hover:bg-white hover:text-rose-600"
                            >
                                <Trash2 size={15} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {liste.length > 0 && (
                <button
                    onClick={kopier}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700"
                >
                    {kopiert ? <Check size={18} /> : <Copy size={18} />} {kopiert ? 'Kopiert!' : 'Kopier notatene'}
                </button>
            )}
        </Skuff>
    );
}

/** Graden og en stolpe mot neste. Brukes i introkortet og studiebeviset. */
export function Grad({ kompakt }: { kompakt?: boolean }) {
    const antall = useStudiebevis((s) => Object.keys(s.hort).length);
    const g = grad(antall);
    return (
        <div className={`flex items-center gap-3 ${kompakt ? '' : 'rounded-2xl bg-amber-50 p-4'}`}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-inner">
                <GraduationCap size={24} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-900">{g.tittel}</span>
                <span className="block text-sm text-slate-600">
                    {antall === 0
                        ? 'Hør en forelesning for å få ditt første stempel.'
                        : `${antall} ${antall === 1 ? 'forelesning' : 'forelesninger'} hørt${g.neste ? ` · ${g.igjen} til ${g.neste}` : ''}`}
                </span>
                {g.neste && (
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-amber-100">
                        <span className="block h-full rounded-full bg-amber-500" style={{ width: `${Math.max(4, g.andel * 100)}%` }} />
                    </span>
                )}
            </span>
        </div>
    );
}

/** Studiebeviset: alle forelesningene eleven har hørt, sal for sal, med notatene. */
export function StudiebevisPanel({ onLukk }: { onLukk: () => void }) {
    const hort = useStudiebevis((s) => s.hort);
    const notater = useStudiebevis((s) => s.notater);
    const [apneNotater, setApneNotater] = useState<string | null>(null);

    const perSal = SALER.map((sal) => ({
        sal,
        liste: Object.entries(hort)
            .filter(([, s]) => s.salId === sal.id)
            .sort((a, b) => b[1].dato - a[1].dato),
    }));
    const utenStempel = Object.entries(notater).filter(([sti]) => !hort[sti]);

    if (apneNotater) {
        return <NotatPanel sti={apneNotater} tittel={notater[apneNotater]?.tittel ?? ''} onLukk={() => setApneNotater(null)} />;
    }

    return (
        <Skuff tittel="Studiebeviset" ikon={<GraduationCap size={20} className="text-amber-600" />} onLukk={onLukk}>
            <Grad />
            <p className="mt-3 text-sm text-slate-600">
                Du får et stempel når du har hørt minst 40 % av en forelesning i en sal, eller hørt minst like mye i lesesalen og latt den gå til endes.
            </p>
            {perSal.map(({ sal, liste }) => (
                <div key={sal.id} className="mt-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <span className="h-3 w-3 rounded-full" style={{ background: sal.farge }} />
                        {sal.navn} <span className="font-normal normal-case">· {liste.length}</span>
                    </h3>
                    {liste.length > 0 && (
                        <ul className="mt-1.5 grid gap-1">
                            {liste.map(([sti, s]) => (
                                <Rad key={sti} sti={sti} tittel={s.tittel} kilde={s.kilde} notater={notater[sti]?.liste.length ?? 0} onNotater={() => setApneNotater(sti)} />
                            ))}
                        </ul>
                    )}
                </div>
            ))}
            {utenStempel.length > 0 && (
                <div className="mt-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Andre notater</h3>
                    <ul className="mt-1.5 grid gap-1">
                        {utenStempel.map(([sti, n]) => (
                            <Rad key={sti} sti={sti} tittel={n.tittel} notater={n.liste.length} onNotater={() => setApneNotater(sti)} />
                        ))}
                    </ul>
                </div>
            )}
        </Skuff>
    );
}

function Rad({ sti, tittel, kilde, notater, onNotater }: { sti: string; tittel: string; kilde?: string; notater: number; onNotater: () => void }) {
    return (
        <li className="rounded-xl px-2 py-1.5 hover:bg-slate-50">
            <span className="block text-sm text-slate-900">{tittel}</span>
            <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs">
                <Link to={lesesal(sti)} className="text-indigo-600 hover:underline">
                    Hør igjen
                </Link>
                {kilde && (
                    <Link to={kilde} className="text-indigo-600 hover:underline">
                        Les artikkelen
                    </Link>
                )}
                {notater > 0 && (
                    <button onClick={onNotater} className="text-amber-700 hover:underline">
                        {notater} {notater === 1 ? 'notat' : 'notater'}
                    </button>
                )}
            </span>
        </li>
    );
}

export function Tast({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="inline-flex min-w-[1.6rem] justify-center rounded-md border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-700 shadow-[0_1px_0_#cbd5e1]">
            {children}
        </kbd>
    );
}

/** Oversikt over tastene. Åpnes med H eller ?. */
export function Hurtigtaster({ taster, onLukk }: { taster: [string, string][]; onLukk: () => void }) {
    return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/30 p-4" onClick={onLukk}>
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Hurtigtaster</h2>
                    <button onClick={onLukk} aria-label="Lukk" className="text-slate-400 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>
                <ul className="mt-4 grid gap-2">
                    {taster.map(([t, hva]) => (
                        <li key={t} className="flex items-center justify-between gap-4 text-slate-700">
                            <span>{hva}</span>
                            <Tast>{t}</Tast>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/** Kort melding midt i synsfeltet, over tekstingen. */
export function Melding({ tekst }: { tekst: string | null }) {
    return (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center px-4">
            <AnimatePresence>
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -10, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                        className="rounded-2xl bg-slate-900/90 px-5 py-2.5 text-base font-semibold text-white shadow-xl"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
