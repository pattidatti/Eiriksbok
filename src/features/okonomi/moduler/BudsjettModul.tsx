// Budsjett: ni poster, ni skyveknapper, og ett tall som aldri forsvinner.
//
// Overskuddet står øverst og er alltid synlig. Ved siden av står den viktigste
// koblingen i hele appen: hver krone eleven flytter mellom mat og moro flytter
// framskrivningen, og tallet «innen du er 40» beveger seg med en gang.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { nokkeltall } from '../engine/nokkeltall';
import { framskriv } from '../engine/projeksjon';
import { FramskrivningsGraf } from '../components/FramskrivningsGraf';
import { Forklaring, Kort, Kroner } from '../components/primitives';
import type { BudsjettPostId } from '../types';

/** Hvor langt skyveknappen for hver post går. Valgt så realistiske tall ligger midt på. */
const MAKS: Record<BudsjettPostId, number> = {
    husleie: 20000,
    strom: 4000,
    mat: 12000,
    mobil: 1000,
    transport: 6000,
    forsikring: 3000,
    abonnementer: 2000,
    klar: 4000,
    moro: 8000,
};

const STEG: Record<BudsjettPostId, number> = {
    husleie: 250,
    strom: 50,
    mat: 100,
    mobil: 25,
    transport: 50,
    forsikring: 50,
    abonnementer: 25,
    klar: 50,
    moro: 100,
};

export function BudsjettModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const settBudsjettPost = usePengelivStore((s) => s.settBudsjettPost);

    const profil = tilstand?.profil ?? null;

    // Samme kilde som motoren og som Oversikt. Regnet vi utgiftene her, ville
    // vi fått samboerandelen og terminbeløpene feil - som vi gjorde.
    const tall = useMemo(() => {
        if (!tilstand || !satser) return null;
        return nokkeltall(tilstand, satser);
    }, [tilstand, satser]);

    const maalAlder = profil ? (profil.alder < 40 ? 40 : profil.alder + 25) : 40;
    const antallAar = profil ? Math.max(1, maalAlder - profil.alder) : 1;

    const punkter = useMemo(() => {
        if (!tilstand || !satser) return [];
        return framskriv(tilstand, satser, antallAar);
    }, [tilstand, satser, antallAar]);

    const sluttverdi = punkter.length > 0 ? punkter[punkter.length - 1].nominelt : 0;

    // Utgangspunktet alt måles mot, så en flyttet hundrelapp får et synlig svar
    // med en gang.
    //
    // Det settes på nytt for hver måned klokka går. Fanget vi det bare én gang
    // da modulen ble åpnet, ville tallet blandet to helt ulike ting: hva eleven
    // valgte, og hva tida gjorde. En elev som lot klokka gå i et minutt fikk
    // «+84 000 kr siden du åpnet budsjettet» uten å ha rørt en eneste knapp.
    const maaned = tilstand?.maaned ?? 0;
    const [grunnlinje, settGrunnlinje] = useState({ maaned, verdi: sluttverdi });
    if (grunnlinje.maaned !== maaned) {
        // React sitt mønster for tilstand som må justeres når noe utenfra
        // endrer seg: sett den under render, så tegnes komponenten på nytt med
        // en gang og eleven ser aldri det gamle tallet blinke.
        settGrunnlinje({ maaned, verdi: sluttverdi });
    }
    const startverdi = grunnlinje.verdi;
    const endring = startverdi > 0 ? sluttverdi - startverdi : 0;

    if (!profil || !satser || !tall) {
        return <Laster />;
    }

    const { inntekt, utgifter, overskudd } = tall;
    const sumUtgifter = utgifter.sum;
    const sumFaste = profil.budsjett
        .filter((p) => p.fast)
        .reduce((sum, post) => sum + post.belop, 0);
    // Terminbeløp på lån er alltid faste: de kan ikke kuttes, bare betales ned.
    const fastTotalt = sumFaste + utgifter.gjeld;
    const fasteAndel = sumUtgifter > 0 ? Math.round((fastTotalt / sumUtgifter) * 100) : 0;
    const deler = profil.husholdning.harSamboer;
    // Hva postene ville kostet uten samboer, så vi kan vise hva delingen sparer.
    const sumBudsjettFullt = profil.budsjett.reduce((sum, post) => sum + post.belop, 0);

    const faste = profil.budsjett.filter((p) => p.fast);
    const variable = profil.budsjett.filter((p) => !p.fast);

    return (
        <div className="flex flex-col gap-3">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Budsjett</h1>
                    <p className="text-sm text-slate-600">
                        Et budsjett er ikke tall. Det er valg, og du tar dem her.
                    </p>
                </div>
                <p className="text-xs text-slate-500">
                    {fasteAndel} % av utgiftene dine er faste. Det er den delen du ikke kan kutte
                    uten å endre livet ditt.
                </p>
            </header>

            {/* Overskuddet. Aldri utenfor skjermen, aldri under en scroll. */}
            <motion.div
                layout
                className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm"
            >
                <Nokkeltall
                    etikett="Inn hver måned"
                    verdi={inntekt}
                    hjelp="Lønna di etter skatt."
                />
                <Nokkeltall
                    etikett="Ut hver måned"
                    verdi={sumUtgifter}
                    hjelp={
                        utgifter.gjeld > 0
                            ? 'Postene under, pluss regningene på lånene dine.'
                            : 'Alt du bruker på de ni postene under.'
                    }
                />
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white px-3 py-2 ring-1 ring-emerald-200">
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-800">
                        Til overs
                        <Forklaring begrep="Overskudd">
                            Overskudd er det som er igjen når alle regningene er betalt. Det er
                            disse kronene du kan spare. Er tallet rødt, bruker du mer enn du tjener,
                            og da må noe kuttes.
                        </Forklaring>
                    </div>
                    <motion.div
                        key={Math.round(overskudd)}
                        initial={{ scale: 0.94, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                        className={`text-xl font-bold leading-tight ${
                            overskudd < 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                    >
                        <Kroner verdi={overskudd} visTegn />
                    </motion.div>
                    <div className="text-[11px] text-slate-500">i måneden</div>
                </div>
            </motion.div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
                <Kort tittel="Postene dine">
                    <div className="grid gap-x-6 gap-y-1 md:grid-cols-2">
                        <div>
                            <GruppeTittel
                                tittel="Faste utgifter"
                                farge="text-slate-700"
                                hjelp="Disse må du betale hver måned uansett. Skal de ned, må du flytte, bytte forsikring eller endre noe stort."
                            />
                            {faste.map((post) => (
                                <PostRad
                                    key={post.id}
                                    id={post.id}
                                    navn={post.navn}
                                    belop={post.belop}
                                    onEndre={(v) => settBudsjettPost(post.id, v)}
                                />
                            ))}
                        </div>
                        <div>
                            <GruppeTittel
                                tittel="Variable utgifter"
                                farge="text-indigo-700"
                                hjelp="Disse bestemmer du over fra måned til måned. Det er her du faktisk har et valg."
                            />
                            {variable.map((post) => (
                                <PostRad
                                    key={post.id}
                                    id={post.id}
                                    navn={post.navn}
                                    belop={post.belop}
                                    onEndre={(v) => settBudsjettPost(post.id, v)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* De to postene som ikke har en skyveknapp, men som likevel
                        forlater kontoen din hver måned. De sto ikke her før, og
                        da bommet «til overs» med over 40 000 kr i året på en elev
                        med forbrukslån. */}
                    {(utgifter.gjeld > 0 || deler) && (
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                            {utgifter.gjeld > 0 && (
                                <div className="flex items-baseline justify-between gap-2 text-sm">
                                    <span className="flex items-center gap-1 text-slate-700">
                                        Regninger på lån
                                        <Forklaring begrep="Regninger på lån">
                                            Renter, avdrag og gebyrer på alt du skylder. Denne
                                            posten har ingen skyveknapp: den bestemmes av lånene
                                            dine, ikke av deg. Vil du ha den ned, må du betale ned
                                            gjeld i Lån og gjeld.
                                        </Forklaring>
                                    </span>
                                    <Kroner verdi={utgifter.gjeld} className="text-rose-700" />
                                </div>
                            )}
                            {deler && (
                                <div className="flex items-baseline justify-between gap-2 text-sm">
                                    <span className="flex items-center gap-1 text-slate-700">
                                        Samboeren din betaler
                                        <Forklaring begrep="Utgiftsdeling">
                                            Husleie, strøm, mat, forsikring og abonnementer deler
                                            dere på. Mobil, transport, klær og moro er dine egne, og
                                            de blir ikke billigere av at noen flytter inn.
                                        </Forklaring>
                                    </span>
                                    <Kroner
                                        verdi={-(sumBudsjettFullt - utgifter.budsjett)}
                                        className="text-emerald-700"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </Kort>

                <div className="flex flex-col gap-3">
                    <Kort tittel={`Innen du er ${maalAlder}`}>
                        <div className="flex items-baseline gap-2">
                            <PiggyBank className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                            <motion.span
                                key={Math.round(sluttverdi / 1000)}
                                initial={{ y: 4, opacity: 0.5 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                                className="text-2xl font-bold text-slate-900"
                            >
                                <Kroner verdi={sluttverdi} />
                            </motion.span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            står på konto hvis du holder dette budsjettet
                        </p>

                        <div
                            className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                                endring > 0
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : endring < 0
                                      ? 'bg-rose-50 text-rose-800'
                                      : 'bg-slate-50 text-slate-500'
                            }`}
                        >
                            {endring >= 0 ? (
                                <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                            ) : (
                                <TrendingDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                            )}
                            <span>
                                {endring === 0 ? (
                                    'Flytt en skyveknapp og se hva det gjør her.'
                                ) : (
                                    <>
                                        <Kroner verdi={endring} visTegn /> siden du åpnet budsjettet
                                    </>
                                )}
                            </span>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                            300 kr mindre på moro i måneden blir til mye mer over mange år, fordi
                            pengene får rente, og renta får rente.
                        </p>
                        <div className="mt-2 border-t border-slate-100 pt-2">
                            <FramskrivningsGraf punkter={punkter} hoyde={88} kompakt />
                        </div>
                    </Kort>
                </div>
            </div>
        </div>
    );
}

function GruppeTittel({ tittel, farge, hjelp }: { tittel: string; farge: string; hjelp: string }) {
    return (
        <div
            className={`mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${farge}`}
        >
            {tittel}
            <Forklaring begrep={tittel}>{hjelp}</Forklaring>
        </div>
    );
}

function PostRad({
    id,
    navn,
    belop,
    onEndre,
}: {
    id: BudsjettPostId;
    navn: string;
    belop: number;
    onEndre: (belop: number) => void;
}) {
    return (
        <div className="py-0.5">
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-slate-700">{navn}</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                    <Kroner verdi={belop} />
                </span>
            </div>
            <input
                type="range"
                min={0}
                max={MAKS[id]}
                step={STEG[id]}
                value={Math.round(belop)}
                onChange={(e) => onEndre(Number(e.target.value))}
                className="w-full accent-indigo-600"
                aria-label={`${navn}, kroner per måned`}
            />
        </div>
    );
}

function Nokkeltall({ etikett, verdi, hjelp }: { etikett: string; verdi: number; hjelp: string }) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs font-medium text-slate-600">{etikett}</div>
            <div className="text-xl font-bold leading-tight text-slate-900">
                <Kroner verdi={verdi} />
            </div>
            <div className="text-[11px] text-slate-500">{hjelp}</div>
        </div>
    );
}

function Laster() {
    return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Setter opp budsjettet ditt...
        </div>
    );
}
