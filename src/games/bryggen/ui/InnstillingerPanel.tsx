// Innstillingene i pausemenyen: grafikk, lyd, styring og skjerm. Alt virker med en gang og
// huskes i nettleseren (innstillinger.ts).
import { Bryter, Glider, Knapp, Overskrift } from './menydeler';
import { STANDARD, type Innstillinger as Valg } from './innstillinger';
import type { Buss } from '../motor/lyd';

const prosent = (v: number) => `${Math.round(v * 100)} %`;

const BUSSER: [Buss, string][] = [
    ['ute', 'Omgivelser ute (regn, vind, bølger, måker)'],
    ['inne', 'Inne i husene (ild, fottrinn, rotter)'],
    ['hendelse', 'Hendelser (slagsmål, oppdrag)'],
];

export function InnstillingerPanel({ valg, onEndre, harLyd, onFullskjerm }: { valg: Valg; onEndre: (v: Valg) => void; harLyd: boolean; onFullskjerm: () => void }) {
    const sett = (d: Partial<Valg>) => onEndre({ ...valg, ...d });
    const settLyd = (d: Partial<Valg['lyd']>) => sett({ lyd: { ...valg.lyd, ...d } });
    const lav = valg.grafikk === 'lav';
    return (
        <div>
            <Overskrift>Grafikk</Overskrift>
            <Bryter
                tekst="Full grafikk (G)"
                hjelp={lav ? 'Av: raskere på en treg maskin, uten detaljkart, skygger og lysstråler.' : 'På: detaljkart på treverket, skygger og lysstråler.'}
                paa={!lav}
                onBytt={(p) => sett({ grafikk: p ? 'full' : 'lav' })}
            />
            <Bryter tekst="Skygger" hjelp={lav ? 'Bare med full grafikk.' : undefined} paa={valg.skygger} disabled={lav} onBytt={(p) => sett({ skygger: p })} />
            <Bryter
                tekst="Lys og dis"
                hjelp={lav ? 'Bare med full grafikk.' : 'Lysstråler, glød rundt sola, dis over Vågen.'}
                paa={valg.post}
                disabled={lav}
                onBytt={(p) => sett({ post: p })}
            />

            <Overskrift>Lyd</Overskrift>
            {!harLyd && <p className="px-3 pb-1 text-[14px] text-[#5c4630]">Denne scenen har ikke lyd ennå.</p>}
            <Bryter tekst="Lyd (M)" paa={valg.lyd.paa} onBytt={(p) => settLyd({ paa: p })} />
            <Glider tekst="Hovedvolum" verdi={valg.lyd.volum} vis={prosent} onEndre={(v) => settLyd({ volum: v, paa: true })} />
            {BUSSER.map(([b, tekst]) => (
                <Glider key={b} tekst={tekst} verdi={valg.lyd.busser[b]} vis={prosent} onEndre={(v) => settLyd({ busser: { ...valg.lyd.busser, [b]: v } })} />
            ))}

            <Overskrift>Styring</Overskrift>
            <Glider
                tekst="Hvor fort kameraet snur (mus og piltaster)"
                verdi={valg.folsomhet}
                min={0.3}
                max={3}
                steg={0.1}
                vis={(v) => `${v.toFixed(1).replace('.', ',')} ×`}
                onEndre={(v) => sett({ folsomhet: v })}
            />
            <Bryter tekst="Snu opp og ned" hjelp="Musa fram ser ned, og pil opp ser ned." paa={valg.inverterY} onBytt={(p) => sett({ inverterY: p })} />

            <Overskrift>Skjerm</Overskrift>
            <Bryter tekst="Vis ytelse" hjelp="Bilder i sekundet og tegnekall nede i hjørnet." paa={valg.visYtelse} onBytt={(p) => sett({ visYtelse: p })} />
            <div className="mt-3 flex flex-wrap gap-2 px-3">
                <Knapp onClick={onFullskjerm}>Fullskjerm av/på</Knapp>
                <Knapp onClick={() => onEndre(structuredClone(STANDARD))}>Tilbake til standard</Knapp>
            </div>
        </div>
    );
}
