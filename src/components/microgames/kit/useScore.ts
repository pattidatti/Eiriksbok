import { useCallback, useState } from 'react';

// Liten poeng-/combo-motor for spillfølelse. Combo bygger seg opp ved riktige
// trekk på rad og gir bonus; en bom nullstiller comboen. Gir den lille
// progresjons-/belønningssløyfen som gjør et mikrospill vanedannende.
//   const score = useScore();
//   onCorrect={() => score.hit()}  onWrong={() => score.miss()}
//   <ScoreHUD combo={score.combo} stars={score.stars} />
export function useScore(maxStars = 3) {
    const [points, setPoints] = useState(0);
    const [combo, setCombo] = useState(0);
    const [best, setBest] = useState(0);

    const hit = useCallback((base = 1) => {
        setCombo((c) => {
            const next = c + 1;
            setBest((b) => Math.max(b, next));
            setPoints((p) => p + Math.round(base * (1 + (next - 1) * 0.25)));
            return next;
        });
    }, []);

    const miss = useCallback(() => setCombo(0), []);

    const reset = useCallback(() => {
        setPoints(0);
        setCombo(0);
        setBest(0);
    }, []);

    // Stjerner basert på beste combo (enkelt, justerbart per spill).
    const stars = Math.min(maxStars, Math.ceil((best / Math.max(1, maxStars)) * 1));

    return { points, combo, best, stars, hit, miss, reset };
}
