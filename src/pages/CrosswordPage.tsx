// Kryssord (/oving/kryssord): bygger et kryssord av begrepene og personene i
// boka. Siden eier valgene og brettet; spillogikken bor i features/crossword.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CrosswordGame } from '../features/crossword/CrosswordGame';
import { CrosswordSetup } from '../features/crossword/CrosswordSetup';
import { generatePuzzle } from '../features/crossword/generator';
import { filterBank, loadWordBank } from '../features/crossword/wordBank';
import type { WordBank } from '../features/crossword/wordBank';
import type { Difficulty, Puzzle, PuzzleFilters } from '../features/crossword/types';
import { DIFFICULTIES } from '../features/crossword/types';

type Phase = 'setup' | 'building' | 'play';

const randomSeed = () => Math.floor(Math.random() * 1_000_000_000);

// Et kryssord er helt bestemt av frøet og valgene. Derfor legger vi dem i
// adressen: da kan en lærer sende nøyaktig samme kryssord til hele klassen.
const readUrlSetup = (): {
    seed: number;
    difficulty: Difficulty;
    filters: PuzzleFilters;
} | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
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
        },
    };
};

const writeUrlSetup = (seed: number, difficulty: Difficulty, filters: PuzzleFilters) => {
    const params = new URLSearchParams();
    params.set('seed', String(seed));
    params.set('grad', difficulty);
    params.set('innhold', filters.content);
    if (filters.subject) params.set('fag', filters.subject);
    if (filters.era) params.set('epoke', filters.era);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
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
        () => readUrlSetup()?.filters ?? { subject: null, content: 'blandet', era: null }
    );
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [buildError, setBuildError] = useState<string | null>(null);
    const pendingSeed = useRef<number>(randomSeed());

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

    const preset = useMemo(
        () => DIFFICULTIES.find((item) => item.id === difficulty) || DIFFICULTIES[0],
        [difficulty]
    );

    const build = useCallback(
        (seed: number) => {
            if (!bank) return;
            pendingSeed.current = seed;
            writeUrlSetup(seed, difficulty, filters);
            setBuildError(null);
            setPhase('building');
            // Ett bilde med byggeanimasjonen før vi låser hovedtråden i ~40 ms
            requestAnimationFrame(() => {
                window.setTimeout(() => {
                    const entries = filterBank(bank.entries, filters);
                    const next = generatePuzzle({ entries, preset, seed });
                    if (!next) {
                        setBuildError('Det ble for få ord til et kryssord. Prøv et bredere valg.');
                        setPhase('setup');
                        return;
                    }
                    setPuzzle(next);
                    setPhase('play');
                }, 260);
            });
        },
        [bank, filters, preset, difficulty]
    );

    // Delt lenke: bygg kryssordet med en gang, uten å gå via valgskjermen
    const autoStarted = useRef(false);
    useEffect(() => {
        if (!bank || autoStarted.current) return;
        const fromUrl = readUrlSetup();
        if (!fromUrl) return;
        autoStarted.current = true;
        // Neste tikk, ikke midt i effekten: byggeskjermen skal rekke å tegnes
        const timer = window.setTimeout(() => build(fromUrl.seed), 0);
        return () => window.clearTimeout(timer);
    }, [bank, build]);

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

    if (phase === 'play' && puzzle) {
        return (
            <CrosswordGame
                key={puzzle.seed}
                puzzle={puzzle}
                preset={preset}
                subjectId={filters.subject}
                onNewPuzzle={() => build(randomSeed())}
                onBackToSetup={() => setPhase('setup')}
            />
        );
    }

    return (
        <>
            {buildError && (
                <p className="mx-auto mt-4 w-fit rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                    {buildError}
                </p>
            )}
            <CrosswordSetup
                entries={bank.entries}
                eras={bank.eras}
                difficulty={difficulty}
                filters={filters}
                onDifficulty={setDifficulty}
                onFilters={setFilters}
                onStart={() => build(randomSeed())}
            />
        </>
    );
};

export default CrosswordPage;
