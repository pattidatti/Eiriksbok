import { useMemo } from 'react';
import type { SnakeSegment, FoodItem } from '../types';
import clsx from 'clsx';

interface SnakeBoardProps {
    width: number;
    height: number;
    snake: SnakeSegment[];
    foodItems: FoodItem[];
}

export const SnakeBoard = ({ width, height, snake, foodItems }: SnakeBoardProps) => {
    const cells = useMemo(() => {
        const grid = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                grid.push({ x, y });
            }
        }
        return grid;
    }, [width, height]);

    return (
        <div
            className="grid gap-1 bg-white/70 backdrop-blur p-2 rounded-2xl shadow-sm border border-slate-200"
            style={{
                gridTemplateColumns: `repeat(${width}, 1fr)`,
                width: '100%',
                height: 'auto',
                // Bredden begrenses av tilgjengelig høyde (navbar + HUD ≈ 250px)
                // slik at hele brettet er synlig uten scrolling på 1366x768.
                maxWidth: `min(95vw, calc((100dvh - 250px) * ${width} / ${height}))`,
                aspectRatio: `${width}/${height}`,
                margin: '0 auto',
            }}
        >
            {cells.map((cell) => {
                const isSnakeHead = snake[0].x === cell.x && snake[0].y === cell.y;
                const isSnakeBody = snake.some(
                    (s, i) => i !== 0 && s.x === cell.x && s.y === cell.y
                );
                const food = foodItems.find(
                    (f) => f.position.x === cell.x && f.position.y === cell.y
                );

                return (
                    <div
                        key={`${cell.x}-${cell.y}`}
                        className={clsx(
                            'rounded-sm relative flex items-center justify-center transition-colors duration-100',
                            {
                                'bg-indigo-600 z-10 rounded-md shadow-md shadow-indigo-500/30':
                                    isSnakeHead,
                                'bg-indigo-400/90': isSnakeBody,
                                'bg-slate-100/80': !isSnakeHead && !isSnakeBody,
                            }
                        )}
                    >
                        {/* Alle ordbrikker ser like ut - fargen skal ikke røpe fasiten */}
                        {food && (
                            <div
                                className="absolute z-20 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap bg-white border-2 border-slate-300 text-slate-700 shadow-md"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    minWidth: 'max-content',
                                }}
                            >
                                {food.text}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
