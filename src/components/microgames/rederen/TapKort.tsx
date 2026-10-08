// Slutt-kortet ved tap: lite, og på motsatt side av stempelet, så tapet synes på kartet.

import { ArcadeBigButton, ArcadeSmallButton, ArcadeTag } from '../arcade/ArcadeShell';
import { ArcadeLessons } from '../arcade/ArcadeLayers';
import { P, SERIF } from './ark';

interface TapKortProps {
    tittel: string;
    /** Rang eller ny rekord. */
    merke: string;
    /** Hvorfor runden ble tapt, i én setning. */
    hvorfor: string | null;
    /** År drevet, poeng og neste rang på én linje. */
    tall: string;
    /** «Dette skjedde»: bare det viktigste punktet, så kortet holder seg lite. */
    lærdom: string[];
    /** Kortet ligger til venstre (stempelet er til høyre). */
    venstre: boolean;
    onOmstart: () => void;
    onMeny: () => void;
}

export function TapKort({
    tittel,
    merke,
    hvorfor,
    tall,
    lærdom,
    venstre,
    onOmstart,
    onMeny,
}: TapKortProps) {
    return (
        <div
            role="dialog"
            aria-label={tittel}
            style={{
                position: 'absolute',
                bottom: '11%',
                [venstre ? 'left' : 'right']: '3%',
                width: 'min(340px, 44%)',
                background: P.papir,
                border: `2px solid ${P.blekk}`,
                borderRadius: 6,
                boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                padding: '10px 14px 12px',
                color: P.blekk,
                textAlign: 'center',
                fontFamily: SERIF,
                zIndex: 20,
            }}
        >
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{tittel}</div>
            <ArcadeTag color={P.rød}>{merke}</ArcadeTag>
            {hvorfor && (
                <p style={{ fontSize: 16, fontWeight: 700, color: P.rød, margin: '6px 0 4px' }}>
                    {hvorfor}
                </p>
            )}
            <p style={{ fontSize: 14, margin: '0 0 6px' }}>{tall}</p>
            <ArcadeLessons items={lærdom.slice(0, 1)} />
            <ArcadeBigButton onClick={onOmstart}>Ny runde (mellomrom)</ArcadeBigButton>
            <ArcadeSmallButton onClick={onMeny}>Meny</ArcadeSmallButton>
        </div>
    );
}
