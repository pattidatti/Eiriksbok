// Skjermene i Underskriftsrittet: menyen (med Klageboka), pausen og slutt-skjermen med
// opptellingen, kravene som ble vunnet og «Dette skjedde».

import {
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeSmallButton,
    ArcadeStats,
} from '../arcade/ArcadeShell';
import { ArcadeLessons } from '../arcade/ArcadeLayers';
import { rang } from './rules';
import { FARGE } from './palette';
import { KLAGEBOKA, KRAV, MÅL, SEIER, TAP_TITTEL, TASTER, TIPS } from './texts';

export interface Save {
    rekord: number;
    flestNavn: number;
    runder: number;
    kommisjoner: number;
    funn: string[];
}

export interface Resultat {
    vant: boolean;
    årsak: 'lys' | 'vinter' | null;
    navn: number;
    segl: number;
    poeng: number;
    nyRekord: boolean;
    nyeFunn: string[];
    /** Hvor og av hvem du ble tatt (bare når lyset tok deg). */
    hvor?: string | null;
    lærdom: string[];
}

const funnListe = Object.keys(KLAGEBOKA);

export function Meny({
    save,
    visBok,
    setVisBok,
    begin,
}: {
    save: Save;
    visBok: boolean;
    setVisBok: (v: boolean) => void;
    begin: () => void;
}) {
    return (
        <ArcadeScreen>
            <ArcadeLogo>
                <span style={{ fontSize: '0.8em' }}>Underskriftsrittet</span>
            </ArcadeLogo>
            <ArcadeTag>Agder og Telemark, høsten 1786</ArcadeTag>
            {visBok ? (
                <div style={{ textAlign: 'left', maxWidth: 600, margin: '6px auto' }}>
                    <p style={{ fontSize: 17, fontWeight: 700, margin: '4px 0' }}>
                        Klageboka: {save.funn.length} av {funnListe.length} blader
                    </p>
                    <ul
                        style={{ fontSize: 15, paddingLeft: 18, margin: '4px 0', lineHeight: 1.35 }}
                    >
                        {funnListe.map((b) => (
                            <li key={b} style={{ opacity: save.funn.includes(b) ? 1 : 0.55 }}>
                                <b>{b}:</b>{' '}
                                {save.funn.includes(b)
                                    ? KLAGEBOKA[b]
                                    : 'Ri over det malte merket på tunet her.'}
                            </li>
                        ))}
                    </ul>
                    <ArcadeSmallButton onClick={() => setVisBok(false)}>Tilbake</ArcadeSmallButton>
                </div>
            ) : (
                <>
                    <p style={{ fontSize: 17, margin: '8px 0 4px', maxWidth: 580 }}>{MÅL}</p>
                    <p style={{ fontSize: 16, margin: '2px 0 10px', maxWidth: 580 }}>{TASTER}</p>
                    <ArcadeBigButton onClick={begin}>Ri ut (mellomrom)</ArcadeBigButton>
                    {save.runder > 0 && (
                        <p style={{ fontSize: 15, margin: '8px 0 2px' }}>
                            Rekord: <b>{save.rekord} poeng</b> ({rang(save.rekord)}) · Flest navn:{' '}
                            <b>{save.flestNavn}</b> · Kommisjoner: <b>{save.kommisjoner}</b>
                        </p>
                    )}
                    <ArcadeSmallButton onClick={() => setVisBok(true)}>
                        Klageboka ({save.funn.length} av {funnListe.length})
                    </ArcadeSmallButton>
                </>
            )}
        </ArcadeScreen>
    );
}

export function PauseSkjerm({
    resume,
    begin,
    toMenu,
}: {
    resume: () => void;
    begin: () => void;
    toMenu: () => void;
}) {
    return (
        <ArcadeScreen>
            <ArcadeLogo>Pause</ArcadeLogo>
            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <ArcadeSmallButton onClick={begin}>Start på nytt</ArcadeSmallButton>
                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
            </div>
        </ArcadeScreen>
    );
}

export function Slutt({
    res,
    begin,
    toMenu,
}: {
    res: Resultat;
    begin: () => void;
    toMenu: () => void;
}) {
    return (
        <ArcadeScreen>
            <ArcadeLogo>
                {res.vant ? 'Kommisjonen satt ned' : TAP_TITTEL[res.årsak ?? 'vinter']}
            </ArcadeLogo>
            {res.vant ? (
                <>
                    <p style={{ fontSize: 15, margin: '4px 0', maxWidth: 600, lineHeight: 1.3 }}>
                        {SEIER.join(' ')}
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            margin: '6px 0',
                        }}
                    >
                        {KRAV.map((k) => (
                            <span
                                key={k}
                                style={{
                                    border: `3px solid ${FARGE.blod}`,
                                    color: FARGE.blod,
                                    padding: '2px 10px',
                                    fontWeight: 700,
                                    fontSize: 15,
                                    transform: 'rotate(-3deg)',
                                    borderRadius: 6,
                                }}
                            >
                                VUNNET: {k}
                            </span>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {res.hvor && (
                        <p
                            style={{
                                fontSize: 17,
                                fontWeight: 700,
                                margin: '4px 0 0',
                                color: FARGE.blod,
                            }}
                        >
                            {res.hvor}.
                        </p>
                    )}
                    <p style={{ fontSize: 15, margin: '6px 0', maxWidth: 580, lineHeight: 1.3 }}>
                        {TIPS[res.årsak ?? 'vinter']}
                    </p>
                </>
            )}
            <ArcadeStats
                items={[
                    { value: `${res.navn}`, label: 'Navn i klagen' },
                    { value: `${res.segl} av 8`, label: 'Segl' },
                    {
                        value: `${res.poeng}`,
                        label: res.nyRekord ? `${rang(res.poeng)} - ny rekord!` : rang(res.poeng),
                    },
                ]}
            />
            {res.nyeFunn.length > 0 && (
                <p style={{ fontSize: 15, margin: '4px 0' }}>
                    Nytt i Klageboka:{' '}
                    <b>
                        {res.nyeFunn.length} {res.nyeFunn.length === 1 ? 'blad' : 'blader'}
                    </b>
                </p>
            )}
            <ArcadeLessons items={res.lærdom} />
            <ArcadeBigButton onClick={begin}>Ny runde (mellomrom)</ArcadeBigButton>
            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
        </ArcadeScreen>
    );
}
