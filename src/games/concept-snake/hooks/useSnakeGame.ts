import { useState, useEffect, useCallback, useRef } from 'react';
import type {
    Direction,
    GameStatus,
    SnakeSegment,
    FoodItem,
    ConceptLevel,
    EatenWord,
    EatEvent,
} from '../types';
import { levels } from '../data/conceptData';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 12;
const INITIAL_SNAKE = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
];
const INITIAL_SPEED = 220; // ms per steg
const SPEED_INCREMENT = 6; // raskere for hvert riktige ord
const MIN_SPEED = 90;
const MAX_FOOD = 3;

const bestScoreKey = (levelId: string) => `konsept-snake-best-${levelId}`;

const readBestScore = (levelId: string) => {
    try {
        return Number(localStorage.getItem(bestScoreKey(levelId))) || 0;
    } catch {
        return 0;
    }
};

export const useSnakeGame = () => {
    const [level, setLevel] = useState<ConceptLevel>(levels[0]);
    const [snake, setSnake] = useState<SnakeSegment[]>(INITIAL_SNAKE);
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [status, setStatus] = useState<GameStatus>('MENU');
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(() => readBestScore(levels[0].id));
    const [isNewBest, setIsNewBest] = useState(false);
    const [wallsEnabled, setWallsEnabled] = useState(true);
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [eatenWords, setEatenWords] = useState<EatenWord[]>([]);
    const [lastEat, setLastEat] = useState<EatEvent | null>(null);

    // Refs slik at spill-løkka alltid ser fersk state uten å restarte
    const snakeRef = useRef(snake);
    const directionRef = useRef(direction);
    const lastMovedDirRef = useRef<Direction>('RIGHT');
    const speedRef = useRef(INITIAL_SPEED);
    const scoreRef = useRef(0);
    const tickTimerRef = useRef<number | null>(null);
    const foodItemsRef = useRef(foodItems);
    const levelRef = useRef(level);
    const wallsEnabledRef = useRef(wallsEnabled);
    const eatCounterRef = useRef(0);

    useEffect(() => {
        snakeRef.current = snake;
    }, [snake]);
    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);
    useEffect(() => {
        foodItemsRef.current = foodItems;
    }, [foodItems]);
    useEffect(() => {
        levelRef.current = level;
    }, [level]);
    useEffect(() => {
        wallsEnabledRef.current = wallsEnabled;
    }, [wallsEnabled]);
    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    const spawnFood = useCallback(() => {
        const currentSnake = snakeRef.current;
        const currentFood = foodItemsRef.current;
        const currentLevel = levelRef.current;

        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * GRID_WIDTH);
            const y = Math.floor(Math.random() * GRID_HEIGHT);

            if (currentSnake.some((s) => s.x === x && s.y === y)) continue;
            if (currentFood.some((f) => f.position.x === x && f.position.y === y)) continue;

            // Sørg for at det alltid finnes minst ett riktig ord på brettet
            const hasCorrect = currentFood.some((f) => f.type === 'CORRECT');
            const isCorrect = hasCorrect ? Math.random() > 0.4 : true;

            const sourceList = isCorrect
                ? currentLevel.correctExamples
                : currentLevel.wrongExamples;
            // Unngå at samme ord ligger på brettet to ganger
            const onBoard = new Set(currentFood.map((f) => f.text));
            const available = sourceList.filter((t) => !onBoard.has(t));
            const textList = available.length > 0 ? available : sourceList;
            const text = textList[Math.floor(Math.random() * textList.length)];

            const newFood: FoodItem = {
                id: Math.random().toString(36).slice(2, 11),
                position: { x, y },
                text,
                type: isCorrect ? 'CORRECT' : 'WRONG',
            };

            setFoodItems((prev) => [...prev, newFood]);
            foodItemsRef.current = [...foodItemsRef.current, newFood];
            return;
        }
    }, []);

    const startGame = useCallback(() => {
        setSnake(INITIAL_SNAKE);
        snakeRef.current = INITIAL_SNAKE;
        setDirection('RIGHT');
        directionRef.current = 'RIGHT';
        lastMovedDirRef.current = 'RIGHT';
        setScore(0);
        scoreRef.current = 0;
        setEatenWords([]);
        setLastEat(null);
        setIsNewBest(false);
        setFoodItems([]);
        foodItemsRef.current = [];
        speedRef.current = INITIAL_SPEED;
        spawnFood();
        spawnFood();
        setStatus('PLAYING');
    }, [spawnFood]);

    const stopGame = useCallback(() => {
        setStatus('GAME_OVER');
        const finalScore = scoreRef.current;
        const currentLevel = levelRef.current;
        const best = readBestScore(currentLevel.id);
        if (finalScore > best) {
            try {
                localStorage.setItem(bestScoreKey(currentLevel.id), String(finalScore));
            } catch {
                // localStorage kan være utilgjengelig - highscore er best-effort
            }
            setBestScore(finalScore);
            setIsNewBest(finalScore > 0);
        } else {
            setBestScore(best);
        }
    }, []);

    const moveSnake = useCallback(() => {
        const currentHead = snakeRef.current[0];
        const currentDir = directionRef.current;
        lastMovedDirRef.current = currentDir;

        const newHead = { ...currentHead };
        switch (currentDir) {
            case 'UP':
                newHead.y -= 1;
                break;
            case 'DOWN':
                newHead.y += 1;
                break;
            case 'LEFT':
                newHead.x -= 1;
                break;
            case 'RIGHT':
                newHead.x += 1;
                break;
        }

        // Vegg: kollisjon eller wrap
        if (
            newHead.x < 0 ||
            newHead.x >= GRID_WIDTH ||
            newHead.y < 0 ||
            newHead.y >= GRID_HEIGHT
        ) {
            if (wallsEnabledRef.current) {
                stopGame();
                return;
            }
            if (newHead.x < 0) newHead.x = GRID_WIDTH - 1;
            if (newHead.x >= GRID_WIDTH) newHead.x = 0;
            if (newHead.y < 0) newHead.y = GRID_HEIGHT - 1;
            if (newHead.y >= GRID_HEIGHT) newHead.y = 0;
        }

        // Selvkollisjon (halen flytter seg, så siste segment er trygt)
        const body = snakeRef.current.slice(0, -1);
        if (body.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
            stopGame();
            return;
        }

        // Mat
        const eatenFood = foodItemsRef.current.find(
            (f) => f.position.x === newHead.x && f.position.y === newHead.y
        );
        let grew = false;

        if (eatenFood) {
            const points = eatenFood.type === 'CORRECT' ? 100 : -50;
            if (eatenFood.type === 'CORRECT') {
                setScore((s) => s + points);
                speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);
                grew = true;
            } else {
                setScore((s) => Math.max(0, s + points));
            }
            eatCounterRef.current += 1;
            setLastEat({
                id: eatCounterRef.current,
                text: eatenFood.text,
                type: eatenFood.type,
                points,
            });
            setEatenWords((prev) => [...prev, { text: eatenFood.text, type: eatenFood.type }]);
            const remaining = foodItemsRef.current.filter((f) => f.id !== eatenFood.id);
            setFoodItems(remaining);
            foodItemsRef.current = remaining;
            spawnFood();
        }

        const newSnake = [newHead, ...snakeRef.current];
        if (!grew) newSnake.pop();
        setSnake(newSnake);
        snakeRef.current = newSnake;

        // Hold brettet fylt
        if (foodItemsRef.current.length < MAX_FOOD) {
            spawnFood();
        }
    }, [stopGame, spawnFood]);

    // Tastatur: piltaster + WASD styrer, mellomrom/P pauser
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key.toLowerCase() === 'p') {
                if (status === 'PLAYING') setStatus('PAUSED');
                else if (status === 'PAUSED') setStatus('PLAYING');
                return;
            }
            if (status !== 'PLAYING') return;

            // Sammenlign med retningen slangen faktisk beveget seg sist,
            // ellers kan to raske tastetrykk snu slangen inn i seg selv.
            const moved = lastMovedDirRef.current;
            const key = e.key.toLowerCase();
            if ((e.key === 'ArrowUp' || key === 'w') && moved !== 'DOWN') setDirection('UP');
            else if ((e.key === 'ArrowDown' || key === 's') && moved !== 'UP')
                setDirection('DOWN');
            else if ((e.key === 'ArrowLeft' || key === 'a') && moved !== 'RIGHT')
                setDirection('LEFT');
            else if ((e.key === 'ArrowRight' || key === 'd') && moved !== 'LEFT')
                setDirection('RIGHT');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status]);

    // Spill-løkke med setTimeout slik at farten faktisk øker underveis
    useEffect(() => {
        if (status !== 'PLAYING') return;
        let cancelled = false;
        const tick = () => {
            if (cancelled) return;
            moveSnake();
            tickTimerRef.current = window.setTimeout(tick, speedRef.current);
        };
        tickTimerRef.current = window.setTimeout(tick, speedRef.current);
        return () => {
            cancelled = true;
            if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
        };
    }, [status, moveSnake]);

    const setCategory = useCallback((levelId: string) => {
        const found = levels.find((l) => l.id === levelId);
        if (found) {
            setLevel(found);
            setBestScore(readBestScore(found.id));
        }
    }, []);

    const goToMenu = useCallback(() => {
        setStatus('MENU');
        setSnake(INITIAL_SNAKE);
        snakeRef.current = INITIAL_SNAKE;
        setScore(0);
        setFoodItems([]);
        foodItemsRef.current = [];
    }, []);

    const togglePause = useCallback(() => {
        setStatus((s) => (s === 'PLAYING' ? 'PAUSED' : s === 'PAUSED' ? 'PLAYING' : s));
    }, []);

    return {
        snake,
        status,
        score,
        bestScore,
        isNewBest,
        foodItems,
        eatenWords,
        lastEat,
        level,
        gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
        startGame,
        goToMenu,
        togglePause,
        setCategory,
        wallsEnabled,
        setWallsEnabled,
    };
};
