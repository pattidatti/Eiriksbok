// Slutt-skjermen i Elleve år: seier eller tap, ett regnskap for stengene, rang og «Dette skjedde».

import { ArcadeScreen, ArcadeTag, ArcadeBigButton, ArcadeSmallButton, ArcadeStats } from '../arcade/ArcadeShell';
import { ArcadeLessons } from '../arcade/ArcadeLayers';
import { YearBar } from './YearBar';

export interface Result {
    won: boolean;
    score: number;
    alene: number;
    tatt: number;
    /** Gitt til parlamentet før 1640 (eller før tapet), og stenger du hadde igjen da runden sluttet (i 1649 for den som nådde 1640). */
    gitt: number;
    igjen: number;
    aar: number;
    /** Stenger igjen i 1640 (null = nådde ikke 1640). */
    beholdt: number | null;
    linje: string;
    forklaring: string;
    rank: string;
    titler: number;
    rekord: boolean;
    lessons: string[];
}

export function SluttSkjerm({
    result,
    bestAar,
    serif,
    onAgain,
    onMenu,
}: {
    result: Result;
    bestAar: number;
    serif: string;
    onAgain: () => void;
    onMenu: () => void;
}) {
    return (
        <ArcadeScreen>
            <ArcadeTag color={result.won ? '#6b4a14' : '#8e2230'}>
                {result.won ? '1649 · Borgerkrigen er over' : `Teppet falt i ${result.aar}`}
            </ArcadeTag>
            <h2 style={{ fontFamily: serif, fontSize: 25, lineHeight: 1.15, margin: '6px auto 2px', maxWidth: 520, textAlign: 'center' }}>
                {result.linje}
            </h2>
            <YearBar aar={result.aar} best={bestAar} />
            <ArcadeStats
                items={[
                    { value: String(result.igjen), label: result.won ? 'stenger holdt til 1649' : 'stenger igjen' },
                    { value: String(result.gitt), label: 'gitt til parlamentet' },
                    { value: result.score.toLocaleString('nb-NO'), label: result.rekord ? 'poeng - ny rekord!' : 'poeng' },
                    { value: String(result.titler), label: 'titler solgt (Karl solgte 266)' },
                ]}
            />
            <p style={{ fontSize: 14, margin: '0 auto' }}>
                {result.won && result.beholdt !== null
                    ? `I 1640 hadde du ${result.beholdt}. Soldatene veltet ${result.beholdt - result.igjen} i krigen, og du holdt ${result.igjen} til 1649.`
                    : `Du hadde ${result.gitt + result.igjen} stenger: ${result.gitt} gitt bort + ${result.igjen} igjen.`}
            </p>
            <p style={{ fontWeight: 700, fontFamily: serif, fontSize: 18, margin: '2px 0' }}>{result.rank}</p>
            <p style={{ maxWidth: 520, textAlign: 'center', fontSize: 14, margin: '2px auto' }}>{result.forklaring}</p>
            <ArcadeLessons items={result.lessons} />
            <ArcadeBigButton onClick={onAgain}>Én runde til</ArcadeBigButton>
            <ArcadeSmallButton onClick={onMenu}>Meny</ArcadeSmallButton>
        </ArcadeScreen>
    );
}
