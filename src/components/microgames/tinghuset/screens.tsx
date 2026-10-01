// Skjermene utenfor selve spillet: slutt-skjermen («Dette skjedde», rang, det skjeveste
// paret) og saksmappa med protokollbladene. Tinghuset.tsx bestemmer når de vises.

import {
    ArcadeScreen,
    ArcadeBigButton,
    ArcadeSmallButton,
    ArcadeStats,
} from '../arcade/ArcadeShell';
import { ArcadeLessons } from '../arcade/ArcadeLayers';
import { BLUE, INK, MONO, RED, VIOLET } from './art';
import { monthName } from './levels';
import type { Cause, Verdict } from './state';
import { FINDS, LOSS, SAKLIG, SEIER, type FindId } from './texts';

export interface Result {
    won: boolean;
    score: number;
    jevne: number;
    avgjort: number;
    ulike: number;
    cause: Cause | null;
    skjevest: { a: Verdict; b: Verdict } | null;
    rank: string;
    next: [number, string] | null;
    lessons: string[];
    record: boolean;
    newFinds: FindId[];
}

const lapp = (v: Verdict) => `${monthName(v.mnd)}: ${v.dom}`;

const P = { margin: '4px 0', fontSize: 13, lineHeight: 1.35, fontWeight: 600 } as const;

export function OverScreen({
    result,
    foundCount,
    onAgain,
    onMenu,
}: {
    result: Result;
    foundCount: number;
    onAgain: () => void;
    onMenu: () => void;
}) {
    const loss = LOSS[result.cause ?? 'vent'];
    return (
        <div className="th-over">
            <style>{OVER_CSS}</style>
            <ArcadeScreen>
                <div className="th-cols">
                    <div>
                        <div
                            className="arc-display"
                            style={{
                                fontSize: 21,
                                color: result.won ? VIOLET : RED,
                                lineHeight: 1.15,
                            }}
                        >
                            {result.won ? SEIER.tittel : loss.msg}
                        </div>
                        <div style={{ ...P, fontWeight: 700, marginTop: 6 }}>
                            Din rang: <b style={{ color: VIOLET }}>{result.rank}</b>
                            {result.record && ' - ny rekord!'}
                            {result.next && (
                                <div style={{ fontWeight: 600 }}>
                                    Neste: {result.next[1]} ved {result.next[0]} jevne dommer
                                </div>
                            )}
                        </div>
                        <ArcadeStats
                            items={[
                                { value: result.avgjort, label: 'saker avgjort' },
                                { value: result.jevne, label: 'jevne par' },
                                { value: result.score.toLocaleString('nb-NO'), label: 'poeng' },
                            ]}
                        />
                        {result.skjevest && (
                            <>
                                <div style={{ ...P, marginTop: 8 }}>Ditt skjeveste par:</div>
                                <div className="th-pair">
                                    {[result.skjevest.a, result.skjevest.b].map((v, i) => (
                                        <div
                                            key={i}
                                            style={{ transform: `rotate(${i ? 1.5 : -1.5}deg)` }}
                                        >
                                            <b style={{ color: RED }}>Sak {v.sak}</b>
                                            <br />
                                            {lapp(v)}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <ArcadeBigButton onClick={onAgain}>Én runde til</ArcadeBigButton>
                        <ArcadeSmallButton onClick={onMenu}>Meny</ArcadeSmallButton>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={P}>{result.won ? SEIER.ekte : loss.tip}</p>
                        <ArcadeLessons items={result.lessons} />
                        <p style={{ ...P, fontWeight: 500 }}>{result.won ? SEIER.slutt : SAKLIG}</p>
                        {result.newFinds.length > 0 && (
                            <p style={{ ...P, fontWeight: 700, color: BLUE }}>
                                Nye protokollblad: {result.newFinds.length} ({foundCount}/
                                {FINDS.length} i saksmappa på startskjermen)
                            </p>
                        )}
                    </div>
                </div>
            </ArcadeScreen>
        </div>
    );
}

const OVER_CSS = `.th-over .arc-card{max-width:860px}
.th-cols{display:grid;grid-template-columns:1fr;gap:14px;align-items:start}
@media (min-width:720px){.th-cols{grid-template-columns:1fr 1fr}}
.th-pair{display:flex;gap:8px;justify-content:center;margin:4px 0 8px;font-family:${MONO};font-size:13px}
.th-pair>div{background:#f6f5ee;border:1.5px solid ${INK};padding:4px 8px}`;

export function FindsScreen({ found, onClose }: { found: Set<FindId>; onClose: () => void }) {
    return (
        <ArcadeScreen>
            <div className="arc-display" style={{ fontSize: 22 }}>
                Saksmappa
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: 6,
                    margin: '10px 0',
                    textAlign: 'left',
                    maxHeight: '52vh',
                    overflowY: 'auto',
                }}
            >
                {FINDS.map((f) => (
                    <div
                        key={f.id}
                        style={{
                            background: found.has(f.id) ? '#f6f5ee' : '#d6d5cc',
                            border: `1.5px solid ${INK}`,
                            padding: '6px 8px',
                            fontSize: 13,
                            lineHeight: 1.35,
                            fontFamily: MONO,
                        }}
                    >
                        <b style={{ color: VIOLET }}>
                            {found.has(f.id) ? f.tittel : 'Ikke funnet'}
                        </b>
                        <div style={{ fontWeight: 600 }}>
                            {found.has(f.id) ? f.tekst : 'Spill videre for å finne bladet.'}
                        </div>
                    </div>
                ))}
            </div>
            <ArcadeSmallButton onClick={onClose}>Lukk</ArcadeSmallButton>
        </ArcadeScreen>
    );
}
