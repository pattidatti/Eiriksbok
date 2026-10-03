// Dagboka i pausemenyen: oppdragene (aktive, klare til å levere og levert, med «om» og «hvor»)
// og «Dette vet vi»-tekstene eleven har lest. «Begynn på nytt» ligger nederst, bak en bekreftelse.
import { useState } from 'react';
import type { Oppdrag } from '../graboks/oppdrag';
import { Knapp, Overskrift } from './menydeler';
import { STREK, SVAK, TEKST, UTHEV } from './stil';

export type Bok = ReturnType<Oppdrag['bok']>;

const GRUPPER: { status: Bok[number]['status']; tittel: string; farge: string }[] = [
    { status: 'klar', tittel: 'Klar til å levere', farge: 'border-[#3f6b2a]' },
    { status: 'aktiv', tittel: 'Holder på med', farge: 'border-[#9a2a1c]' },
    { status: 'levert', tittel: 'Levert', farge: 'border-[#b99a68]' },
];

export function Dagbok({ bok, vet, onNullstill }: { bok: Bok | null; vet: string[]; onNullstill: (() => void) | null }) {
    const [sporr, setSporr] = useState(false);
    if (!bok) return <p className={`px-3 ${TEKST}`}>Denne scenen har ingen oppdrag.</p>;
    return (
        <div>
            {bok.length === 0 && (
                <p className={`px-3 ${TEKST}`}>
                    Du har ingen oppdrag ennå. Folk som har noe til deg, har et gult utropstegn over hodet. Gå bort og trykk E.
                </p>
            )}
            {GRUPPER.map(({ status, tittel, farge }) => {
                const liste = bok.filter((o) => o.status === status);
                if (!liste.length) return null;
                return (
                    <section key={status}>
                        <Overskrift>{tittel}</Overskrift>
                        {liste.map((o) => (
                            <div key={o.id} className={`mx-3 mb-2 border-l-4 py-1 pl-3 ${farge}`}>
                                <div className={`text-[17px] font-bold ${status === 'levert' ? 'text-[#5c4630] line-through decoration-[#9a2a1c]/60' : 'text-[#2b1d10]'}`}>{o.tittel}</div>
                                {status !== 'levert' && (
                                    <>
                                        <p className={`${TEKST} text-[15px]`}>{o.om}</p>
                                        <p className={SVAK}>
                                            <span className="font-semibold">Hvor:</span> {o.hvor}
                                        </p>
                                    </>
                                )}
                            </div>
                        ))}
                    </section>
                );
            })}

            <Overskrift>Dette vet vi</Overskrift>
            {vet.length === 0 ? (
                <p className={`px-3 ${SVAK} text-[15px]`}>Når noen forteller deg noe om hvordan det virkelig var, havner det her.</p>
            ) : (
                vet.map((t) => (
                    <p key={t} className={`mx-3 mb-2 border-l-4 border-l-[#b07d24] px-3 py-2 text-[16px] italic leading-snug ${UTHEV}`}>
                        {t}
                    </p>
                ))
            )}

            {onNullstill && (
                <div className="mt-5 px-3">
                    <div className={`${STREK} mb-3`} />
                    {sporr ? (
                        <div>
                            <p className="text-[16px] font-bold text-[#2b1d10]">Alle oppdragene og alt i «Dette vet vi» blir glemt, og du starter på nytt. Er du sikker?</p>
                            <div className="mt-2 flex gap-2">
                                <Knapp farge="farlig" onClick={onNullstill}>
                                    Ja, begynn på nytt
                                </Knapp>
                                <Knapp autoFocus onClick={() => setSporr(false)}>
                                    Nei
                                </Knapp>
                            </div>
                        </div>
                    ) : (
                        <Knapp farge="farlig" onClick={() => setSporr(true)}>Begynn på nytt</Knapp>
                    )}
                </div>
            )}
        </div>
    );
}
