// Kryssord (/oving/kryssord): bygger et kryssord av begrepene og personene i
// boka. Siden eier valgene og brettet; spillogikken bor i features/crossword.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CrosswordGame } from '../features/crossword/CrosswordGame';
import { useProgressStore } from '../features/progress/useProgressStore';
import { CrosswordSetup } from '../features/crossword/CrosswordSetup';
import { SUBJECT_LABELS } from '../features/crossword/subjects';
import { generatePuzzle } from '../features/crossword/generator';
import { filterBank, loadWordBank } from '../features/crossword/wordBank';
import type { WordBank } from '../features/crossword/wordBank';
import type { Difficulty, Puzzle, PuzzleFilters } from '../features/crossword/types';
import { DIFFICULTIES } from '../features/crossword/types';
import { djb2Hash, todayLocal } from '../utils/reviewScheduler';

type Phase = 'setup' | 'building' | 'play';

// Alt som skal til for å bygge nøyaktig ett kryssord på nytt.
interface BuildSetup {
    seed: number;
    difficulty: Difficulty;
    filters: PuzzleFilters;
    isDaily: boolean;
    // Hvilken dag dagens kryssord gjelder for. Null for vanlige kryssord.
    day: string | null;
    // Svar eleven nettopp har hatt, som generatoren skal styre unna. Lista er
    // personlig, så den følger bare brett som ikke skal være like for alle:
    // dagens kryssord og delte lenker bygges alltid uten den.
    recentAnswers?: string[];
}

const DEFAULT_FILTERS: PuzzleFilters = {
    subject: null,
    content: 'blandet',
    era: null,
    onlyRead: false,
};

// Dagens kryssord skal være likt for alle, så valgene er låst.
const DAILY_DIFFICULTY: Difficulty = 'middels';

// Nøkkelen Agent A lagrer et påbegynt brett under. Ett brett per frø.
const boardStorageKey = (seed: number): string => `kryssord-brett-${seed}`;
// Peker til det siste brettet eleven begynte på, så vi kan tilby «fortsett».
const RESUME_KEY = 'kryssord-sist-paabegynt';
// Svarene eleven nettopp har hatt. Generatoren bruker dem til å variere mer.
const RECENT_KEY = 'kryssord-siste-svar';
const RECENT_LIMIT = 60;

const randomSeed = () => Math.floor(Math.random() * 1_000_000_000) + 1;

// Samme dato gir samme tall gir samme brett. Da får hele klassen det samme
// kryssordet i dag, uten at noe må lagres på en server.
const dailySeedFor = (day: string): number => djb2Hash(`kryssord-dagens-${day}`) || 1;

const dailySetup = (): BuildSetup => {
    const day = todayLocal();
    return {
        seed: dailySeedFor(day),
        difficulty: DAILY_DIFFICULTY,
        filters: { ...DEFAULT_FILTERS },
        isDaily: true,
        day,
    };
};

// XP-id-en. Aldri skråstrek i den: progresjonssystemet leser første ledd før
// skråstrek som fag-id, og en dato ville da blitt et falskt fag.
const activityIdFor = (setup: BuildSetup): string =>
    setup.isDaily
        ? `kryssord-dagens-${setup.day ?? todayLocal()}`
        : `kryssord-${setup.difficulty}-${setup.filters.subject ?? 'alle'}`;

const dailyCompletionKey = (day: string): string => `practice-game:kryssord-dagens-${day}`;

const describeSetup = (setup: BuildSetup): string => {
    if (setup.isDaily) return 'Dagens kryssord';
    const grad = DIFFICULTIES.find((item) => item.id === setup.difficulty)?.label ?? 'Middels';
    if (setup.filters.onlyRead) return `${grad}, det du har lest`;
    const fag = setup.filters.subject
        ? (SUBJECT_LABELS[setup.filters.subject] ?? setup.filters.subject)
        : 'alle fag';
    return `${grad}, ${fag}`;
};

// --- localStorage. Alt pakkes inn: privat modus og fulle disker kaster. ---

const readJson = <T,>(key: string): T | null => {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
};

const writeJson = (key: string, value: unknown) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ingen lagring tilgjengelig. Kryssordet virker like fullt.
    }
};

const readRecentAnswers = (): string[] => {
    const stored = readJson<unknown>(RECENT_KEY);
    if (!Array.isArray(stored)) return [];
    return stored.filter((value): value is string => typeof value === 'string');
};

// Nyeste svar først. Lista holdes kort, ellers ville halve ordbanken blitt
// «nettopp brukt» og generatoren fikk ingenting å velge mellom.
const rememberAnswers = (answers: string[]) => {
    const merged = [...new Set(answers)];
    for (const old of readRecentAnswers()) {
        if (!merged.includes(old)) merged.push(old);
    }
    writeJson(RECENT_KEY, merged.slice(0, RECENT_LIMIT));
};

interface ResumePointer extends BuildSetup {
    savedAt: number;
}

// Har eleven et brett hun ikke ble ferdig med? Pekeren sier hvilke valg
// brettet ble laget med; selve rutene ligger under boardStorageKey.
const readResume = (): ResumePointer | null => {
    const stored = readJson<ResumePointer>(RESUME_KEY);
    if (!stored || typeof stored.seed !== 'number' || !stored.filters) return null;
    // Brettet må bygges med nøyaktig de samme ordene som sist, ellers ville
    // rutene eleven har fylt ut havnet på feil sted i et nytt brett.
    if (stored.recentAnswers && !Array.isArray(stored.recentAnswers)) return null;
    // Rutene ligger under boardStorageKey, og spillet sletter nøkkelen i det
    // brettet er løst. Finnes det ingen bokstaver der, er det ingenting å
    // fortsette på.
    const board = readJson<{ letters?: Record<string, string> }>(boardStorageKey(stored.seed));
    if (!board || !board.letters || Object.keys(board.letters).length === 0) return null;
    return stored;
};

// Et kryssord er helt bestemt av frøet og valgene. Derfor legger vi dem i
// adressen: da kan en lærer sende nøyaktig samme kryssord til hele klassen.
// Lenker bygges alltid uten den personlige «nettopp brukt»-lista, slik at alle
// som åpner den samme lenken får det samme brettet.
const readUrlSetup = (): BuildSetup | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    // Dagens kryssord er alltid dagens. En lenke fra i går gir dagens brett,
    // ikke gårsdagens - da er den fortsatt lik for alle som åpner den nå.
    if (params.get('dagens') === '1') return dailySetup();
    const seed = Number(params.get('seed'));
    if (!Number.isFinite(seed) || seed <= 0) return null;
    const grad = params.get('grad');
    const innhold = params.get('innhold');
    return {
        seed,
        difficulty: DIFFICULTIES.some((item) => item.id === grad)
            ? (grad as Difficulty)
            : 'middels',
        filters: {
            subject: params.get('fag'),
            content: innhold === 'begreper' || innhold === 'personer' ? innhold : 'blandet',
            era: params.get('epoke'),
            onlyRead: params.get('lest') === '1',
        },
        isDaily: false,
        day: null,
    };
};

const writeUrlSetup = (setup: BuildSetup) => {
    const params = new URLSearchParams();
    params.set('seed', String(setup.seed));
    // Bare dagens dato får «dagens»-flagget. Et gammelt brett man plukker opp
    // igjen skal ikke gi en lenke som sender andre til et helt annet kryssord.
    if (setup.isDaily && setup.day === todayLocal()) params.set('dagens', '1');
    params.set('grad', setup.difficulty);
    params.set('innhold', setup.filters.content);
    if (setup.filters.subject) params.set('fag', setup.filters.subject);
    if (setup.filters.era) params.set('epoke', setup.filters.era);
    // «Lest»-kryssord er personlige: lenken gjenskaper det for eleven selv,
    // men en annen elev har lest andre artikler og får et annet brett.
    if (setup.filters.onlyRead) params.set('lest', '1');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
};

// Rydder adressen. Brukes når et brett ikke lot seg bygge, slik at en ny
// omlasting ikke prøver den samme umulige lenken om igjen.
const clearUrl = () => {
    if (typeof window === 'undefined') return;
    window.history.replaceState(null, '', window.location.pathname);
};

const BuildingScreen = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }).map((_, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0.2, scale: 0.8 }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1, 0.85] }}
                    transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        delay: ((index % 4) + Math.floor(index / 4)) * 0.09,
                    }}
                    className="h-8 w-8 rounded-lg border-2 border-indigo-200 bg-white"
                />
            ))}
        </div>
        <p className="text-lg font-bold text-slate-500">Legger ordene i rutene ...</p>
    </div>
);

export const CrosswordPage = () => {
    const [bank, setBank] = useState<WordBank | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [phase, setPhase] = useState<Phase>('setup');
    const [difficulty, setDifficulty] = useState<Difficulty>(
        () => readUrlSetup()?.difficulty ?? 'middels'
    );
    const [filters, setFilters] = useState<PuzzleFilters>(
        () => readUrlSetup()?.filters ?? { ...DEFAULT_FILTERS }
    );
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    // Valgene brettet på skjermen faktisk ble bygd med. Skilles fra valgene
    // over, som eleven kan rote videre med uten at brettet endrer seg.
    const [active, setActive] = useState<BuildSetup | null>(null);
    const [buildError, setBuildError] = useState<string | null>(null);
    // Leses ved oppstart og hver gang eleven kommer tilbake til oppsettskjermen
    const [resume, setResume] = useState<ResumePointer | null>(() => readResume());

    // Hva eleven har lest ligger i progresjonssystemet som
    // 'article-read:<fag>/<emne>/<leksjon>'. Vi trenger bare stiene.
    const firstCompletions = useProgressStore((store) => store.firstCompletions);
    const readArticles = useMemo(() => {
        const paths = new Set<string>();
        for (const key of Object.keys(firstCompletions)) {
            if (key.startsWith('article-read:')) paths.add(key.slice('article-read:'.length));
        }
        return paths;
    }, [firstCompletions]);

    // Samme sted forteller oss om dagens kryssord alt er løst.
    const dailySolved = Boolean(firstCompletions[dailyCompletionKey(todayLocal())]);

    // Er dagens kryssord løst, er det ingenting å «fortsette» på der.
    const showResume =
        resume && resume.isDaily && resume.day === todayLocal() && dailySolved ? null : resume;

    useEffect(() => {
        let cancelled = false;
        loadWordBank()
            .then((data) => {
                if (!cancelled) setBank(data);
            })
            .catch(() => {
                if (!cancelled) setLoadError(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Tilbake til oppsettskjermen: se etter et påbegynt brett på nytt. Dette
    // hører hjemme i overgangen, ikke i en effekt som våkner etter render.
    const goToSetup = useCallback(() => {
        setResume(readResume());
        setPhase('setup');
    }, []);

    const build = useCallback(
        (setup: BuildSetup) => {
            if (!bank) return;
            writeUrlSetup(setup);
            setBuildError(null);
            setPhase('building');
            // Ett bilde med byggeanimasjonen før vi låser hovedtråden i ~40 ms
            requestAnimationFrame(() => {
                window.setTimeout(() => {
                    const setupPreset =
                        DIFFICULTIES.find((item) => item.id === setup.difficulty) ||
                        DIFFICULTIES[0];
                    const entries = filterBank(bank.entries, setup.filters, readArticles);
                    const next = generatePuzzle({
                        entries,
                        preset: setupPreset,
                        seed: setup.seed,
                        recentAnswers: setup.recentAnswers,
                    });
                    if (!next) {
                        setBuildError(
                            setup.isDaily
                                ? 'Dagens kryssord ville ikke bygge seg. Lag ditt eget kryssord under, så får du spilt likevel.'
                                : setup.filters.onlyRead
                                  ? 'Det ble for få ord fra det du har lest. Les en artikkel til, eller skru av lest-modus.'
                                  : 'Det ble for få ord til et kryssord. Prøv et bredere valg.'
                        );
                        // Lenken førte ingen vei. Rydd den, ellers møter eleven
                        // den samme veggen ved neste omlasting.
                        clearUrl();
                        goToSetup();
                        return;
                    }
                    rememberAnswers(next.words.map((word) => word.answer));
                    writeJson(RESUME_KEY, { ...setup, savedAt: Date.now() });
                    setActive(setup);
                    setPuzzle(next);
                    setPhase('play');
                }, 260);
            });
        },
        [bank, readArticles, goToSetup]
    );

    // Delt lenke: bygg kryssordet med en gang, uten å gå via valgskjermen.
    // Dette skal skje nøyaktig én gang, i det ordbanken er klar.
    const autoStarted = useRef(false);
    // Effekten leser byggefunksjonen gjennom en ref. Uten det måtte den ha
    // `build` blant avhengighetene sine, og `build` får ny identitet hver gang
    // progresjonsstoren skriver (den gjør `readArticles` på nytt). Da kjørte
    // effekten om igjen i det eleven fikk XP for et fullført brett - og bygde
    // opp igjen brettet hun nettopp løste, fra adressen appen selv hadde
    // skrevet. Seiersskjermen rakk aldri å komme.
    const buildRef = useRef(build);
    useEffect(() => {
        buildRef.current = build;
    });
    useEffect(() => {
        if (!bank || autoStarted.current) return;
        autoStarted.current = true;
        const fromUrl = readUrlSetup();
        if (!fromUrl) return;
        // Neste tikk, ikke midt i effekten: byggeskjermen skal rekke å tegnes
        const timer = window.setTimeout(() => buildRef.current(fromUrl), 0);
        return () => window.clearTimeout(timer);
    }, [bank]);

    const startDaily = useCallback(() => build(dailySetup()), [build]);
    const startResume = useCallback(() => {
        if (showResume) build(showResume);
    }, [build, showResume]);
    const startOwn = useCallback(
        () =>
            build({
                seed: randomSeed(),
                difficulty,
                filters,
                isDaily: false,
                day: null,
                recentAnswers: readRecentAnswers(),
            }),
        [build, difficulty, filters]
    );

    if (loadError) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
                <p className="text-lg font-bold text-slate-700">Fikk ikke tak i ordbanken.</p>
                <p className="text-slate-500">Sjekk nettforbindelsen og last siden på nytt.</p>
            </div>
        );
    }

    if (!bank) return <BuildingScreen />;

    if (phase === 'building') return <BuildingScreen />;

    if (phase === 'play' && puzzle && active) {
        const activePreset =
            DIFFICULTIES.find((item) => item.id === active.difficulty) || DIFFICULTIES[0];
        return (
            <CrosswordGame
                key={puzzle.seed}
                puzzle={puzzle}
                preset={activePreset}
                subjectId={active.filters.subject}
                modeLabel={
                    active.isDaily
                        ? 'Dagens kryssord'
                        : active.filters.onlyRead
                          ? 'Det du har lest'
                          : undefined
                }
                activityId={activityIdFor(active)}
                isDaily={active.isDaily}
                storageKey={boardStorageKey(puzzle.seed)}
                onNewPuzzle={() =>
                    build({
                        seed: randomSeed(),
                        difficulty: active.difficulty,
                        filters: active.filters,
                        isDaily: false,
                        day: null,
                        recentAnswers: readRecentAnswers(),
                    })
                }
                onBackToSetup={() => {
                    clearUrl();
                    goToSetup();
                }}
            />
        );
    }

    return (
        <>
            {buildError && (
                <p className="mx-auto mt-4 w-fit max-w-2xl rounded-xl bg-rose-50 px-4 py-2 text-center text-sm font-semibold text-rose-700">
                    {buildError}
                </p>
            )}
            <CrosswordSetup
                entries={bank.entries}
                eras={bank.eras}
                readArticles={readArticles}
                difficulty={difficulty}
                filters={filters}
                dailySolved={dailySolved}
                resumeLabel={showResume ? describeSetup(showResume) : null}
                onDaily={startDaily}
                onResume={startResume}
                onDifficulty={setDifficulty}
                onFilters={setFilters}
                onStart={startOwn}
            />
        </>
    );
};

export default CrosswordPage;
