// Kryssordgeneratoren. Legger ord ut på et rutenett slik at hvert nytt ord
// krysser minst ett som allerede ligger der, og at ingen ord kommer utilsiktet
// side om side. Rent og deterministisk: samme frø gir samme kryssord.

import type {
    BankEntry,
    Difficulty,
    DifficultyPreset,
    PlacedWord,
    Puzzle,
    PuzzleCell,
} from './types';
import { cellKey } from './types';

// Liten, rask PRNG. Vi vil kunne gjenskape et kryssord fra frøet alene.
export const mulberry32 = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const shuffle = <T>(items: T[], rng: () => number): T[] => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

interface WorkingWord {
    entry: BankEntry;
    row: number;
    col: number;
    dir: 'across' | 'down';
}

interface Board {
    size: number;
    letters: (string | null)[][];
    // Hvilke retninger som allerede løper gjennom en rute. To ord i samme
    // retning skal aldri dele ruter.
    across: boolean[][];
    down: boolean[][];
}

const createBoard = (size: number): Board => ({
    size,
    letters: Array.from({ length: size }, () => Array<string | null>(size).fill(null)),
    across: Array.from({ length: size }, () => Array<boolean>(size).fill(false)),
    down: Array.from({ length: size }, () => Array<boolean>(size).fill(false)),
});

const inside = (board: Board, row: number, col: number): boolean =>
    row >= 0 && col >= 0 && row < board.size && col < board.size;

const letterAt = (board: Board, row: number, col: number): string | null =>
    inside(board, row, col) ? board.letters[row][col] : null;

// Returnerer antall kryssinger, eller -1 hvis plasseringen er ulovlig.
const scorePlacement = (
    board: Board,
    word: string,
    row: number,
    col: number,
    dir: 'across' | 'down'
): number => {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    const endRow = row + dr * (word.length - 1);
    const endCol = col + dc * (word.length - 1);

    if (!inside(board, row, col) || !inside(board, endRow, endCol)) return -1;
    // Ruten rett foran og rett bak må være tom, ellers klistrer ordene seg sammen
    if (letterAt(board, row - dr, col - dc) !== null) return -1;
    if (letterAt(board, endRow + dr, endCol + dc) !== null) return -1;

    let crossings = 0;
    for (let k = 0; k < word.length; k++) {
        const r = row + dr * k;
        const c = col + dc * k;
        const existing = board.letters[r][c];
        const sameDirection = dir === 'across' ? board.across[r][c] : board.down[r][c];
        if (sameDirection) return -1;

        if (existing !== null) {
            if (existing !== word[k]) return -1;
            crossings++;
        } else {
            // Tom rute: naboene på tvers må være tomme, ellers lager vi et
            // tilfeldig tobokstavsord som ingen har skrevet en ledetråd til.
            if (dir === 'across') {
                if (letterAt(board, r - 1, c) !== null || letterAt(board, r + 1, c) !== null)
                    return -1;
            } else {
                if (letterAt(board, r, c - 1) !== null || letterAt(board, r, c + 1) !== null)
                    return -1;
            }
        }
    }
    return crossings;
};

const commit = (board: Board, word: WorkingWord) => {
    const { entry, row, col, dir } = word;
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    for (let k = 0; k < entry.answer.length; k++) {
        const r = row + dr * k;
        const c = col + dc * k;
        board.letters[r][c] = entry.answer[k];
        if (dir === 'across') board.across[r][c] = true;
        else board.down[r][c] = true;
    }
};

interface Attempt {
    words: WorkingWord[];
}

const tryBuild = (pool: BankEntry[], preset: DifficultyPreset, rng: () => number): Attempt => {
    const board = createBoard(preset.maxSize);
    const placed: WorkingWord[] = [];
    const usedAnswers = new Set<string>();

    // Startordet legges vannrett midt på brettet, og bør være langt nok til at
    // mange andre ord kan hekte seg på. Blant dem som er lange nok trekker vi
    // fritt: tar vi alltid det aller lengste, åpner hvert eneste brett i faget
    // med det samme ordet.
    const seedCandidates = pool.filter(
        (entry) =>
            entry.answer.length >= Math.min(6, preset.maxLength) &&
            entry.answer.length <= preset.maxSize
    );
    const bag = seedCandidates.length ? seedCandidates : pool;
    const first = bag[Math.floor(rng() * bag.length)];
    if (!first) return { words: [] };

    const firstRow = Math.floor(board.size / 2);
    const firstCol = Math.floor((board.size - first.answer.length) / 2);
    const seedWord: WorkingWord = { entry: first, row: firstRow, col: firstCol, dir: 'across' };
    commit(board, seedWord);
    placed.push(seedWord);
    usedAnswers.add(first.answer);

    const center = (board.size - 1) / 2;

    // Flere runder gjennom banken: et ord som ikke fant plass i første runde
    // kan hekte seg på et ord som kom til senere.
    for (let pass = 0; pass < 3 && placed.length < preset.targetWords; pass++) {
        for (const entry of pool) {
            if (placed.length >= preset.targetWords) break;
            if (usedAnswers.has(entry.answer)) continue;

            let best: WorkingWord | null = null;
            let bestScore = -Infinity;

            for (const anchor of placed) {
                const anchorWord = anchor.entry.answer;
                for (let i = 0; i < anchorWord.length; i++) {
                    for (let j = 0; j < entry.answer.length; j++) {
                        if (anchorWord[i] !== entry.answer[j]) continue;

                        const dir = anchor.dir === 'across' ? 'down' : 'across';
                        const row = anchor.dir === 'across' ? anchor.row - j : anchor.row + i;
                        const col = anchor.dir === 'across' ? anchor.col + i : anchor.col - j;

                        const crossings = scorePlacement(board, entry.answer, row, col, dir);
                        if (crossings < 1) continue;

                        const midRow = row + (dir === 'down' ? entry.answer.length / 2 : 0);
                        const midCol = col + (dir === 'across' ? entry.answer.length / 2 : 0);
                        const drift = Math.abs(midRow - center) + Math.abs(midCol - center);
                        const score = crossings * 12 - drift * 0.8 + rng() * 2.5;

                        if (score > bestScore) {
                            bestScore = score;
                            best = { entry, row, col, dir };
                        }
                    }
                }
            }

            if (best) {
                commit(board, best);
                placed.push(best);
                usedAnswers.add(entry.answer);
            }
        }
    }

    return { words: placed };
};

// Klipper bort tomme kanter så brettet ikke flyter i luft, og nummererer
// rutene der et ord starter (klassisk kryssordnummerering, radvis).
const finalize = (words: WorkingWord[], seed: number): Puzzle => {
    let minRow = Infinity;
    let minCol = Infinity;
    let maxRow = -Infinity;
    let maxCol = -Infinity;

    for (const word of words) {
        const len = word.entry.answer.length;
        const endRow = word.row + (word.dir === 'down' ? len - 1 : 0);
        const endCol = word.col + (word.dir === 'across' ? len - 1 : 0);
        minRow = Math.min(minRow, word.row);
        minCol = Math.min(minCol, word.col);
        maxRow = Math.max(maxRow, endRow);
        maxCol = Math.max(maxCol, endCol);
    }

    const rows = maxRow - minRow + 1;
    const cols = maxCol - minCol + 1;
    const cells: Record<string, PuzzleCell> = {};
    const shifted = words.map((word) => ({
        ...word,
        row: word.row - minRow,
        col: word.col - minCol,
    }));

    for (const word of shifted) {
        const dr = word.dir === 'down' ? 1 : 0;
        const dc = word.dir === 'across' ? 1 : 0;
        for (let k = 0; k < word.entry.answer.length; k++) {
            const r = word.row + dr * k;
            const c = word.col + dc * k;
            const key = cellKey(r, c);
            if (!cells[key]) {
                cells[key] = { row: r, col: c, solution: word.entry.answer[k] };
            }
        }
    }

    // Nummerering: radvis, og en rute får nummer hvis et ord starter der.
    const starts = new Map<string, WorkingWord[]>();
    for (const word of shifted) {
        const key = cellKey(word.row, word.col);
        const list = starts.get(key) || [];
        list.push(word);
        starts.set(key, list);
    }

    const placedWords: PlacedWord[] = [];
    let counter = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const key = cellKey(r, c);
            const startingHere = starts.get(key);
            if (!startingHere) continue;
            counter++;
            cells[key].number = counter;
            for (const word of startingHere) {
                const id = `${counter}-${word.dir}`;
                placedWords.push({
                    id,
                    number: counter,
                    row: word.row,
                    col: word.col,
                    dir: word.dir,
                    answer: word.entry.answer,
                    clue: word.entry.clue,
                    kind: word.entry.kind,
                    display: word.entry.display,
                    subject: word.entry.subject,
                    link: word.entry.link,
                });
            }
        }
    }

    // Koble hver rute til ordene som løper gjennom den
    for (const word of placedWords) {
        const dr = word.dir === 'down' ? 1 : 0;
        const dc = word.dir === 'across' ? 1 : 0;
        for (let k = 0; k < word.answer.length; k++) {
            const cell = cells[cellKey(word.row + dr * k, word.col + dc * k)];
            if (word.dir === 'across') cell.acrossId = word.id;
            else cell.downId = word.id;
        }
    }

    return { rows, cols, cells, words: placedWords, seed };
};

// Hvor mye et ord eleven nettopp har hatt skyves bakover i køen. Straffen er
// stor nok til å legge ordet bak nesten alle andre, men den stenger det ikke
// ute: i et tynt fag som norsk er hele banken rundt tretti ord, og da må de
// samme ordene få komme igjen.
const RECENT_PENALTY = 15;

// Hvor tilfeldig rekkefølgen i banken er. Lengden teller fortsatt litt, for
// lange ord gir tettere brett, men den skal ikke bestemme alene.
const ORDER_NOISE = 20;

export interface GenerateOptions {
    entries: BankEntry[];
    preset: DifficultyPreset;
    seed: number;
    attempts?: number;
    // Svar eleven nettopp har hatt. De blir nedprioritert, ikke utelatt.
    recentAnswers?: string[];
}

export const generatePuzzle = ({
    entries,
    preset,
    seed,
    attempts = 10,
    recentAnswers,
}: GenerateOptions): Puzzle | null => {
    const usable = entries.filter(
        (entry) =>
            entry.answer.length >= preset.minLength &&
            entry.answer.length <= Math.min(preset.maxLength, preset.maxSize)
    );
    if (usable.length < 4) return null;

    const recent = new Set((recentAnswers || []).map((answer) => answer.toUpperCase()));
    let bestAttempt: WorkingWord[] = [];

    for (let attempt = 0; attempt < attempts; attempt++) {
        const rng = mulberry32(seed + attempt * 7919);
        // Rekkefølgen i banken er stort sett tilfeldig, med et lite dytt til de
        // lange ordene. Før veide lengden så tungt at de femten lengste alltid
        // lå øverst og alltid ble valgt - PERESTROJKA kom i ti av tjue brett.
        // Ord eleven nettopp har hatt skyves bakerst i køen.
        // Vekten regnes ut én gang per ord, ikke inne i sammenlikneren: en
        // komparator som trekker nye tilfeldige tall gir ustabil rekkefølge, og
        // da blir ikke samme frø samme kryssord.
        const pool = shuffle(usable, rng)
            .slice(0, 320)
            .map((entry) => ({
                entry,
                weight:
                    entry.answer.length +
                    rng() * ORDER_NOISE -
                    (recent.has(entry.answer) ? RECENT_PENALTY : 0),
            }))
            .sort((a, b) => b.weight - a.weight)
            .map((item) => item.entry);

        const result = tryBuild(pool, preset, rng);
        if (result.words.length > bestAttempt.length) bestAttempt = result.words;
        if (bestAttempt.length >= preset.targetWords) break;
    }

    // Under fire ord er det ikke et kryssord, det er en gjettelek.
    if (bestAttempt.length < Math.min(4, preset.targetWords)) return null;
    return finalize(bestAttempt, seed);
};

export const difficultyOf = (id: Difficulty, presets: DifficultyPreset[]): DifficultyPreset =>
    presets.find((preset) => preset.id === id) || presets[0];
