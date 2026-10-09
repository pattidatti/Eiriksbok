import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Check, Clapperboard, Clock, Play, Search, X } from 'lucide-react';
import { useManifest } from '../hooks/useManifest';
import { Image } from '../components/Image';
import { alleFilmer, setteFilmer } from '../features/film/filmIndex';
import { LYD_BASE } from '../features/film/useFilmNarrator';
import { getSubjectColor } from '../utils/subjectColors';
import type { Manifest } from '../types';

// Filmer (/oving/filmer): alle artikkelfilmene samlet, med filter på fag og emne, søk og
// sortering. Filmene finnes av seg selv (manus-mappa); tittel, bilde og emne hentes fra
// manifestet, og lengden fra oversikten over innspilt lyd (filmer.json i R2). Filtrene står
// i adressen, så en lærer kan dele en lenke til «alle KRLE-filmene».

interface Film {
    sti: string;
    tittel: string;
    beskrivelse?: string;
    bilde?: string;
    fag: string;
    emneId: string;
    emne: string;
    laget: number;
    varighet?: number;
}

interface LydOversikt {
    filmer: Record<string, { varighet?: number; laget?: string }>;
}

type Sortering = 'nyeste' | 'kortest' | 'alfabetisk';

const FAG_REKKEFOLGE = ['historie', 'norsk', 'krle', 'samfunnskunnskap', 'musikk'];

function useLydOversikt() {
    return useQuery<LydOversikt | null>({
        queryKey: ['film-lyd-oversikt'],
        queryFn: async () => {
            const svar = await fetch(`${LYD_BASE}/filmer.json`);
            return svar.ok ? ((await svar.json()) as LydOversikt) : null;
        },
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
}

/** Slår opp hver film i manifestet. Filmer uten artikkel i manifestet tas ikke med. */
function byggFilmer(manifest: Manifest, lyd: LydOversikt | null | undefined): Film[] {
    const finnes = new Set(alleFilmer());
    const ut: Film[] = [];
    for (const fag of manifest.subjects) {
        for (const emne of fag.topics || []) {
            const grupper = [
                { mappe: `${fag.id}/${emne.id}`, lessons: emne.lessons || [] },
                ...(emne.subTopics || []).map((u) => ({
                    mappe: `${fag.id}/${emne.id}/${u.id}`,
                    lessons: u.lessons || [],
                })),
            ];
            for (const { mappe, lessons } of grupper) {
                for (const l of lessons) {
                    const sti = `${mappe}/${l.id}`;
                    if (!finnes.has(sti)) continue;
                    const info = lyd?.filmer?.[sti];
                    ut.push({
                        sti,
                        tittel: l.title,
                        beskrivelse: l.description,
                        bilde: l.image,
                        fag: fag.id,
                        emneId: emne.id,
                        emne: emne.title,
                        // Uten innspilt lyd er filmen så ny at lyden ikke er laget ennå (den
                        // lages hver time): da står den først blant de nyeste.
                        laget: info?.laget ? Date.parse(info.laget) : Date.now(),
                        varighet: info?.varighet,
                    });
                }
            }
        }
    }
    return ut;
}

function minutter(sek?: number) {
    if (!sek) return null;
    return `${Math.max(1, Math.round(sek / 60))} min`;
}

function FagMerke({ fag, emne }: { fag: string; emne?: string }) {
    const c = getSubjectColor(fag);
    return (
        <div className="flex min-w-0 items-center gap-2 text-xs font-bold">
            <span className={`shrink-0 rounded-full px-2.5 py-1 ${c.bgSoft} ${c.text} ring-1 ${c.ring}`}>
                {c.label}
            </span>
            {emne && <span className="truncate font-semibold text-slate-500">{emne}</span>}
        </div>
    );
}

function Plakat({ film, sett, stor = false }: { film: Film; sett: boolean; stor?: boolean }) {
    const tid = minutter(film.varighet);
    return (
        <div
            className={`relative overflow-hidden bg-slate-200 ${stor ? 'aspect-video md:aspect-auto md:h-full md:min-h-80' : 'aspect-video'}`}
        >
            <Image
                src={film.bilde}
                alt=""
                seed={film.sti}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                priority={stor}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
            <span
                className={`absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white ${stor ? 'h-20 w-20' : 'h-14 w-14 opacity-90 group-hover:opacity-100'}`}
            >
                <Play className={`${stor ? 'h-9 w-9' : 'h-6 w-6'} translate-x-0.5 fill-current`} />
            </span>
            {tid && (
                <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    <Clock className="h-3.5 w-3.5" />
                    {tid}
                </span>
            )}
            {sett && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                    <Check className="h-3.5 w-3.5" />
                    Sett
                </span>
            )}
        </div>
    );
}

function LesArtikkel({ sti }: { sti: string }) {
    return (
        <Link
            to={`/${sti}`}
            className="group/les inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-700"
        >
            <BookOpen className="h-4 w-4 text-slate-400 group-hover/les:text-indigo-500" />
            Les artikkelen
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/les:translate-x-0.5" />
        </Link>
    );
}

function FilmKort({ film, sett }: { film: Film; sett: boolean }) {
    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-lg">
            <Link to={`/film/${film.sti}`} className="group block">
                <Plakat film={film} sett={sett} />
                <div className="space-y-2 px-4 pt-3">
                    <FagMerke fag={film.fag} emne={film.emne} />
                    <h3 className="text-lg leading-snug font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
                        {film.tittel}
                    </h3>
                    {film.beskrivelse && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                            {film.beskrivelse}
                        </p>
                    )}
                </div>
            </Link>
            <div className="mt-auto px-4 pt-2 pb-4">
                <LesArtikkel sti={film.sti} />
            </div>
        </article>
    );
}

function Chip({
    aktiv,
    onClick,
    children,
}: {
    aktiv: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={aktiv}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
                aktiv
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
            {children}
        </button>
    );
}

export function FilmerPage() {
    const { data: manifest, isLoading } = useManifest();
    const { data: lyd } = useLydOversikt();
    const [sett] = useState(setteFilmer);
    const [params, setParams] = useSearchParams();

    const fag = params.get('fag') ?? '';
    const emne = params.get('emne') ?? '';
    const sok = params.get('sok') ?? '';
    const sortering = (params.get('sorter') as Sortering) || 'nyeste';
    const ikkeSett = params.get('vis') === 'ikke-sett';

    const oppdater = (endring: Record<string, string>) => {
        const neste = new URLSearchParams(params);
        for (const [k, v] of Object.entries(endring)) {
            if (v) neste.set(k, v);
            else neste.delete(k);
        }
        setParams(neste, { replace: true });
    };

    const filmer = useMemo(() => (manifest ? byggFilmer(manifest, lyd) : []), [manifest, lyd]);

    const fagMedFilm = useMemo(() => {
        const antall = new Map<string, number>();
        for (const f of filmer) antall.set(f.fag, (antall.get(f.fag) ?? 0) + 1);
        return [...antall.entries()].sort(
            (a, b) => FAG_REKKEFOLGE.indexOf(a[0]) - FAG_REKKEFOLGE.indexOf(b[0])
        );
    }, [filmer]);

    const emner = useMemo(() => {
        const m = new Map<string, { tittel: string; antall: number }>();
        for (const f of filmer) {
            if (fag && f.fag !== fag) continue;
            const e = m.get(f.emneId) ?? { tittel: f.emne, antall: 0 };
            e.antall++;
            m.set(f.emneId, e);
        }
        return [...m.entries()].sort((a, b) => a[1].tittel.localeCompare(b[1].tittel, 'nb'));
    }, [filmer, fag]);

    const synlige = useMemo(() => {
        const q = sok.trim().toLowerCase();
        const liste = filmer.filter(
            (f) =>
                (!fag || f.fag === fag) &&
                (!emne || f.emneId === emne) &&
                (!ikkeSett || !sett.has(f.sti)) &&
                (!q ||
                    `${f.tittel} ${f.emne} ${f.beskrivelse ?? ''}`.toLowerCase().includes(q))
        );
        return liste.sort((a, b) => {
            if (sortering === 'kortest')
                return (a.varighet ?? Infinity) - (b.varighet ?? Infinity);
            if (sortering === 'alfabetisk') return a.tittel.localeCompare(b.tittel, 'nb');
            return b.laget - a.laget;
        });
    }, [filmer, fag, emne, sok, sortering, ikkeSett, sett]);

    const totalMin = Math.round(filmer.reduce((s, f) => s + (f.varighet ?? 0), 0) / 60);
    const filtrert = !!(fag || emne || sok || ikkeSett);
    const nyeste = !filtrert && sortering === 'nyeste' ? synlige[0] : undefined;
    const rutenett = nyeste ? synlige.slice(1) : synlige;

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
                <header className="mt-2 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30">
                                <Clapperboard className="h-6 w-6" />
                            </span>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                                Filmer
                            </h1>
                        </div>
                        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
                            Artiklene fortalt som film. En forteller forklarer, mens kart, tall og
                            3D viser hva som skjer. Hver film hører til en artikkel du kan lese
                            etterpå.
                        </p>
                    </div>
                    {filmer.length > 0 && (
                        <p className="text-sm font-semibold text-slate-400">
                            {filmer.length} filmer
                            {totalMin > 0 && ` · ${totalMin} minutter til sammen`}
                        </p>
                    )}
                </header>

                {nyeste && (
                    <section aria-label="Nyeste film" className="mb-10">
                        <Link
                            to={`/film/${nyeste.sti}`}
                            className="group grid overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-xl md:grid-cols-5"
                        >
                            <div className="md:col-span-3 md:h-full">
                                <Plakat film={nyeste} sett={sett.has(nyeste.sti)} stor />
                            </div>
                            <div className="flex flex-col justify-center gap-3 p-5 md:col-span-2 md:p-7">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-white uppercase shadow-sm">
                                        Ny
                                    </span>
                                    <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">
                                        Nyeste film
                                    </span>
                                </div>
                                <h2 className="text-2xl leading-tight font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700 md:text-3xl">
                                    {nyeste.tittel}
                                </h2>
                                <FagMerke fag={nyeste.fag} emne={nyeste.emne} />
                                {nyeste.beskrivelse && (
                                    <p className="line-clamp-4 text-[15px] leading-relaxed text-slate-600">
                                        {nyeste.beskrivelse}
                                    </p>
                                )}
                                <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-transform group-hover:scale-105">
                                    <Play className="h-4 w-4 fill-current" />
                                    Se filmen
                                </span>
                            </div>
                        </Link>
                    </section>
                )}

                <section
                    aria-label="Filter"
                    className="mb-6 space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <label className="relative flex-1">
                            <span className="sr-only">Søk i filmene</span>
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={sok}
                                onChange={(e) => oppdater({ sok: e.target.value })}
                                placeholder="Søk etter tittel eller emne"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                            />
                        </label>
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={emne}
                                onChange={(e) => oppdater({ emne: e.target.value })}
                                aria-label="Emne"
                                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none md:max-w-56 md:flex-none"
                            >
                                <option value="">Alle emner</option>
                                {emner.map(([id, e]) => (
                                    <option key={id} value={id}>
                                        {e.tittel} ({e.antall})
                                    </option>
                                ))}
                            </select>
                            <select
                                value={sortering}
                                onChange={(e) =>
                                    oppdater({ sorter: e.target.value === 'nyeste' ? '' : e.target.value })
                                }
                                aria-label="Sorter"
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none"
                            >
                                <option value="nyeste">Nyeste først</option>
                                <option value="kortest">Kortest først</option>
                                <option value="alfabetisk">A-Å</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Chip aktiv={!fag} onClick={() => oppdater({ fag: '', emne: '' })}>
                            Alle fag
                        </Chip>
                        {fagMedFilm.map(([id, antall]) => (
                            <Chip
                                key={id}
                                aktiv={fag === id}
                                onClick={() => oppdater({ fag: fag === id ? '' : id, emne: '' })}
                            >
                                <span
                                    className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${getSubjectColor(id).dot}`}
                                />
                                {getSubjectColor(id).label}
                                <span className="ml-1.5 opacity-60">{antall}</span>
                            </Chip>
                        ))}
                        <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
                        <Chip
                            aktiv={ikkeSett}
                            onClick={() => oppdater({ vis: ikkeSett ? '' : 'ikke-sett' })}
                        >
                            Ikke sett ennå
                        </Chip>
                        {filtrert && (
                            <button
                                type="button"
                                onClick={() => setParams({}, { replace: true })}
                                className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                                Nullstill
                            </button>
                        )}
                    </div>
                </section>

                {isLoading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, i) => (
                            <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
                        ))}
                    </div>
                ) : rutenett.length > 0 ? (
                    <>
                        {filtrert && (
                            <p className="mb-4 text-sm font-semibold text-slate-500">
                                {synlige.length} {synlige.length === 1 ? 'film' : 'filmer'}
                            </p>
                        )}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {rutenett.map((f) => (
                                <FilmKort key={f.sti} film={f} sett={sett.has(f.sti)} />
                            ))}
                        </div>
                    </>
                ) : (
                    !nyeste && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
                            <p className="text-lg font-semibold text-slate-700">
                                Ingen filmer passer med det du har valgt.
                            </p>
                            <button
                                type="button"
                                onClick={() => setParams({}, { replace: true })}
                                className="mt-3 text-sm font-bold text-indigo-600 underline underline-offset-2"
                            >
                                Vis alle filmene
                            </button>
                        </div>
                    )
                )}

                <p className="mt-12 text-center text-sm text-slate-400">
                    Det kommer nye filmer hver dag.
                </p>
            </div>
        </div>
    );
}

export default FilmerPage;
