// Slutt-kortet: lite, og på motsatt side av stempelet, så tapet (eller havet som lever) synes
// på kartet. Én setning, «Dette skjedde» og én stor knapp. Rekorden står i menyen.

import { ArcadeBigButton } from '../arcade/ArcadeShell';
import { ArcadeLessons } from '../arcade/ArcadeLayers';
import { P, SERIF } from './ark';

interface TapKortProps {
    /** Navnet på kortet for skjermlesere. */
    tittel: string;
    /** Det som skjedde, i én setning. */
    setning: string;
    /** Rødt ved tap, grønt ved seier. */
    farge: string;
    /** «Dette skjedde»: bare det viktigste punktet, så kortet holder seg lite. */
    lærdom: string[];
    /** Kortet ligger til venstre (stempelet er til høyre). */
    venstre: boolean;
    onOmstart: () => void;
}

export function TapKort({ tittel, setning, farge, lærdom, venstre, onOmstart }: TapKortProps) {
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
                padding: '12px 14px 12px',
                color: P.blekk,
                textAlign: 'center',
                fontFamily: SERIF,
                zIndex: 20,
            }}
        >
            <p style={{ fontSize: 19, fontWeight: 700, color: farge, margin: '0 0 8px' }}>
                {setning}
            </p>
            <ArcadeLessons items={lærdom.slice(0, 1)} />
            <ArcadeBigButton onClick={onOmstart}>Ny runde (mellomrom)</ArcadeBigButton>
        </div>
    );
}
