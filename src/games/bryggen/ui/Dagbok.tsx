// Dagboka i pausemenyen: oppdragene (aktive, klare til å levere og levert, med «om» og «hvor»)
// og «Dette vet vi»-tekstene eleven har lest. «Begynn på nytt» ligger nederst, bak en bekreftelse.
import { useState } from 'react';
import type { Oppdrag } from '../graboks/oppdrag';
import { Knapp, Overskrift } from './menydeler';

export type Bok = ReturnType<Oppdrag['bok']>;

const GRUPPER: { status: Bok[number]['status']; tittel: string; farge: string }[] = [
    { status: 'klar', tittel: 'Klar til å levere', farge: 'border-emerald-500' },
    { status: 'aktiv', tittel: 'Holder på med', farge: 'border-amber-500' },
    { status: 'levert', tittel: 'Levert', farge: 'border-slate-300' },
];

export function Dagbok({ bok, vet, onNullstill }: { bok: Bok | null; vet: string[]; onNullstill: (() => void) | null }) {
    const [sporr, setSporr] = useState(false);
    if (!bok) return <p className="px-3 text-[16px] text-slate-700">Denne scenen har ingen oppdrag.</p>;
    return (
        <div>
            {bok.length === 0 && (
                <p className="px-3 text-[16px] leading-snug text-slate-700">
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
                                <div className={`text-[16px] font-bold ${status === 'levert' ? 'text-slate-600' : 'text-slate-900'}`}>{o.tittel}</div>
                                {status !== 'levert' && (
                                    <>
                                        <p className="text-[15px] leading-snug text-slate-700">{o.om}</p>
                                        <p className="text-[14px] text-slate-600">
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
                <p className="px-3 text-[15px] text-slate-600">Når noen forteller deg noe om hvordan det virkelig var, havner det her.</p>
            ) : (
                vet.map((t) => (
                    <p key={t} className="mx-3 mb-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[15px] leading-snug text-slate-900">
                        {t}
                    </p>
                ))
            )}

            {onNullstill && (
                <div className="mt-5 border-t border-slate-200 px-3 pt-3">
                    {sporr ? (
                        <div>
                            <p className="text-[16px] font-semibold text-slate-900">Alle oppdragene og alt i «Dette vet vi» blir glemt, og du starter på nytt. Er du sikker?</p>
                            <div className="mt-2 flex gap-2">
                                <Knapp farge="rod" onClick={onNullstill}>
                                    Ja, begynn på nytt
                                </Knapp>
                                <Knapp autoFocus onClick={() => setSporr(false)}>
                                    Nei
                                </Knapp>
                            </div>
                        </div>
                    ) : (
                        <Knapp onClick={() => setSporr(true)}>Begynn på nytt</Knapp>
                    )}
                </div>
            )}
        </div>
    );
}
