// Slutt-skjermen: tittel, rang, fagteksten, et konkret tips ved tap, lærdommen og knappene.

import {
    ArcadeBigButton,
    ArcadeLogo,
    ArcadeScreen,
    ArcadeSmallButton,
    ArcadeStats,
    ArcadeTag,
} from '../arcade/ArcadeShell';
import { ArcadeLessons } from '../arcade/ArcadeLayers';
import { P } from './art';
import { fmt } from './draw';
import { rang, tiendeler } from './rules';
import type { Resultat } from './tips';
import type { Game } from './state';
import { slagordFor } from './texts';

export function Sluttplakat({
    res,
    rekord,
    årsak,
    neste,
    igjen,
    tilMeny,
}: {
    res: Resultat;
    rekord: number;
    årsak: Game['årsak'];
    neste: readonly [number, string] | null | undefined;
    igjen: () => void;
    tilMeny: () => void;
}) {
    return (
        <div className="gs-inn">
            <ArcadeScreen>
                <ArcadeLogo>
                    <span style={{ fontSize: '0.6em', whiteSpace: 'nowrap' }}>{res.tittel}</span>
                </ArcadeLogo>
                <ArcadeTag color={res.vant ? P.rød : årsak === 'bølgen' ? P.blå : P.svart}>
                    {fmt(res.m)} millioner - {rang(res.m)}
                    {res.nyRekord ? ' - ny rekord!' : ''}
                </ArcadeTag>
                <p style={{ fontSize: 13, margin: '6px 0', lineHeight: 1.35 }}>{res.tekst}</p>
                {res.tips && (
                    <p
                        style={{
                            fontSize: 14,
                            margin: '4px 0 6px',
                            lineHeight: 1.35,
                            fontWeight: 800,
                            padding: '6px 8px',
                            border: `2px solid ${P.rød}`,
                            color: P.svart,
                            background: P.papir,
                        }}
                    >
                        {res.tips}
                    </p>
                )}
                <ArcadeLessons items={res.lærdom} />
                <ArcadeStats
                    items={[
                        { value: res.fabrikker, label: 'fabrikker' },
                        { value: res.krasj, label: 'krasj' },
                        { value: `${res.brett}/3`, label: 'brett' },
                        { value: fmt(Math.max(rekord, 0)), label: 'rekord' },
                    ]}
                />
                {res.nyePlakater.length > 0 ? (
                    <p style={{ fontSize: 13, margin: '4px 0', fontWeight: 700 }}>
                        Ny plakat: {res.nyePlakater[0]} - «{slagordFor(res.nyePlakater[0])[0]}»
                    </p>
                ) : neste ? (
                    <p style={{ fontSize: 13, margin: '4px 0', fontWeight: 700 }}>
                        {fmt(Math.max(0.1, tiendeler(neste[0] - rekord)))} millioner til neste rang:{' '}
                        {neste[1]}
                    </p>
                ) : null}
                <ArcadeBigButton onClick={igjen}>Én gang til (mellomrom)</ArcadeBigButton>
                <ArcadeSmallButton onClick={tilMeny}>Meny</ArcadeSmallButton>
            </ArcadeScreen>
        </div>
    );
}
