// Slutt-skjermen i Elleve år: seier eller tap, ett regnskap for stengene, rang og «Dette skjedde».

import { ArcadeScreen, ArcadeTag, ArcadeBigButton, ArcadeSmallButton, ArcadeStats } from '../arcade/ArcadeShell';
import { ArcadeLessons } from '../arcade/ArcadeLayers';
import { YearBar } from './YearBar';

export interface Result {
    won: boolean;
    score: number;
    alene: number;
    tatt: number;
    /** Ett regnskap: gitt bort + igjen = stengene du hadde (i 1640 for den som vant). */
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
                {result.won ? 'Seier · du holdt ut til 1640' : `Teppet falt i ${result.aar}`}
            </ArcadeTag>
            <h2 style={{ fontFamily: serif, fontSize: 25, lineHeight: 1.15, margin: '6px auto 2px', maxWidth: 520, textAlign: 'center' }}>
                {result.linje}
            </h2>
            <YearBar aar={result.aar} best={bestAar} />
            <ArcadeStats
                items={[
                    { value: String(result.gitt), label: 'stenger gitt bort' },
                    { value: String(result.igjen), label: result.won ? 'stenger igjen i 1640' : 'stenger igjen' },
                    { value: result.score.toLocaleString('nb-NO'), label: result.rekord ? 'poeng - ny rekord!' : 'poeng' },
                    { value: `${result.titler} av 266`, label: 'titler solgt' },
                ]}
            />
            <p style={{ fontSize: 14, margin: '0 auto' }}>
                Du hadde {result.gitt + result.igjen} stenger: {result.gitt} gitt bort + {result.igjen} igjen.
            </p>
            <p style={{ fontWeight: 700, fontFamily: serif, fontSize: 18, margin: '2px 0' }}>{result.rank}</p>
            <p style={{ maxWidth: 520, textAlign: 'center', fontSize: 14, margin: '2px auto' }}>{result.forklaring}</p>
            <ArcadeLessons items={result.lessons} />
            <ArcadeBigButton onClick={onAgain}>Én runde til</ArcadeBigButton>
            <ArcadeSmallButton onClick={onMenu}>Meny</ArcadeSmallButton>
        </ArcadeScreen>
    );
}
