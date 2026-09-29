import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Gamepad2, Trophy } from 'lucide-react';
import { MICRO_GAMES } from '../components/microgames/registry';
import { MicroGameBlock } from '../components/microgames/MicroGameBlock';
import { loadArcadeSave } from '../components/microgames/arcade/save';
import { useMicroGameMap } from '../hooks/useMicroGameMap';
import type { MicroGameEntry } from '../components/microgames/types';

// Arkaden (/oving/arkade): alle mikrospillene i den nye standarden samlet på ett
// sted. «Ny standard» = spill med `sjanger` i registeret - de er bygd på
// arkadeskallet, har rekord og ranger, og er testet av selvspillet. De eldre
// diorama-spillene ligger fortsatt i artiklene og på /mikrospill.
//
// Plakaten ER spillet: et klikk åpner det i fullskjerm, akkurat som i artikkelen
// (MicroGameBlock). Under hver plakat står sjanger, spilletid, elevens rekord og
// artikkelen spillet hører til - der står fagstoffet spillet bygger på.

// Nyeste først: registeret legger nye spill til nederst.
const GAMES: MicroGameEntry[] = Object.values(MICRO_GAMES)
    .filter((g) => !!g.sjanger)
    .reverse();

function sjangerLabel(s?: string) {
    if (!s) return '';
    const t = s.replace(/-/g, ' · ');
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function minutes(sec?: number) {
    if (!sec) return null;
    return sec < 60 ? 'under 1 min' : `ca. ${Math.round(sec / 60)} min`;
}

function readBest(id: string): number {
    return loadArcadeSave<{ best: number }>(id, { best: 0 }).best;
}

interface MetaProps {
    game: MicroGameEntry;
    best: number;
    article?: { link?: string; title?: string };
    big?: boolean;
}

function GameMeta({ game, best, article, big = false }: MetaProps) {
    const time = minutes(game.estimatedSeconds);
    return (
        <div className={big ? 'space-y-3' : 'space-y-2'}>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                {game.sjanger && (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 ring-1 ring-indigo-100">
                        {sjangerLabel(game.sjanger)}
                    </span>
                )}
                {time && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        <Clock className="h-3 w-3" />
                        {time}
                    </span>
                )}
                {best > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-amber-100">
                        <Trophy className="h-3 w-3" />
                        Din rekord {best.toLocaleString('nb-NO')}
                    </span>
                )}
            </div>
            {big && (
                <p className="text-[15px] leading-relaxed text-slate-600">{game.description}</p>
            )}
            {article?.link && (
                <Link
                    to={article.link}
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-700"
                >
                    <BookOpen className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                    <span>
                        Les artikkelen:{' '}
                        <span className="underline decoration-slate-300 underline-offset-2 group-hover:decoration-indigo-400">
                            {article.title ?? 'fagstoffet bak spillet'}
                        </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
            )}
        </div>
    );
}

export function ArkadePage() {
    const map = useMicroGameMap();
    // Rekordene leses fra nettleseren én gang ved åpning (spillene skriver dem selv).
    const [bests] = useState<Record<string, number>>(() =>
        Object.fromEntries(GAMES.map((g) => [g.id, readBest(g.id)]))
    );
    const [featured, ...rest] = GAMES;

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">

                <header className="mt-2 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                                <Gamepad2 className="h-6 w-6" />
                            </span>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                                Arkaden
                            </h1>
                        </div>
                        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
                            Ekte små dataspill fra timene. Reglene i spillet er fagstoffet: den som
                            vinner, har skjønt hvordan det henger sammen. Hvert spill hører til en
                            artikkel.
                        </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-400">
                        {GAMES.length} spill · åpnes i fullskjerm
                    </p>
                </header>

                {featured && (
                    <section aria-label="Nyeste spill" className="mb-12">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                                Nytt
                            </span>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                                Nyeste spill
                            </h2>
                        </div>
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:p-4">
                            <MicroGameBlock gameId={featured.id} blockClassName="" />
                            <div className="px-1 pt-4 pb-1 sm:px-2">
                                <GameMeta
                                    game={featured}
                                    best={bests[featured.id] ?? 0}
                                    article={map?.[featured.id]}
                                    big
                                />
                            </div>
                        </div>
                    </section>
                )}

                {rest.length > 0 && (
                    <section aria-label="Flere spill">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                            Flere spill
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {rest.map((g) => (
                                <article
                                    key={g.id}
                                    className="flex flex-col rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
                                >
                                    <MicroGameBlock gameId={g.id} blockClassName="" />
                                    <div className="px-1 pt-3 pb-1">
                                        <GameMeta
                                            game={g}
                                            best={bests[g.id] ?? 0}
                                            article={map?.[g.id]}
                                        />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                <p className="mt-12 text-center text-sm text-slate-400">
                    Nye spill kommer jevnlig. Leter du etter de store 3D-spillene?{' '}
                    <Link
                        to="/oving/spill"
                        className="font-semibold text-slate-500 underline underline-offset-2 hover:text-indigo-700"
                    >
                        Historiske spill
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ArkadePage;
