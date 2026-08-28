// Lån og gjeld: kredittkort, forbrukslån, delbetaling, studielån og boliglån.
//
// Kredittkortet er stjerna. Sparemodulen viser rentes rente som noe som jobber
// for deg; her skal eleven se det samme tallet snu og jobbe mot seg. Derfor er
// minsteinnbetalings-fella det største kortet på skjermen, og den er ikke
// nevnt - den er regnet ut, tegnet opp og satt ved siden av alternativet.
//
// Modulen moraliserer ikke. Den viser mekanikken og lar eleven trekke
// slutningen selv: her er tiden, her er kronene, velg selv.

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePengelivStore } from '../store/pengelivStore';
import {
    effektivRente,
    nedbetalingsplan,
    renterNeste12,
    sumGjeld,
    sumTerminbelop,
    terminbelop,
} from '../engine/laan';
import type { Nedbetalingsplan } from '../engine/laan';
import {
    LAANPRODUKTER,
    MINSTE_KREDITTBETALING,
    lagLaan,
    stipendomgjoring,
} from '../data/laanprodukter';
import type { Laanprodukt } from '../data/laanprodukter';
import {
    Forklaring,
    Knapp,
    Kort,
    Kroner,
    formaterProsent,
    formaterTall,
} from '../components/primitives';
import type { Laan, Nedbetaling } from '../types';

/** Kortet fella regnes på når eleven ikke har noe kredittkort ennå. */
const EKSEMPELKORT: Laan = {
    id: 'eksempel-kredittkort',
    type: 'kredittkort',
    navn: 'Kredittkort',
    restgjeld: 30000,
    arligRente: 0.199,
    terminerIgjen: 0,
    nedbetaling: 'minste',
    minsteinnbetalingSats: 0.03,
    gebyr: 0,
};

const EKSTRA_MAKS = 2000;
const EKSTRA_STEG: number[] = [500, 1000, 2000];

/** Hvor eleven er i studieløpet. Styrer både stipendandel og rentefritak. */
type StudieValg = 'studerer' | 'grad' | 'emner';

const STUDIEVALG: { id: StudieValg; navn: string }[] = [
    { id: 'studerer', navn: 'Studerer nå' },
    { id: 'grad', navn: 'Fullført grad' },
    { id: 'emner', navn: 'Enkeltemner' },
];

/** «Minstebeløpet er 3 % av det du skylder, aldri under 200 kr.» */
function minstetekst(kort: Laan): string {
    const sats = formaterProsent(kort.minsteinnbetalingSats ?? 0.03, 0);
    return `Minstebeløpet er ${sats} av det du skylder, aldri under ${MINSTE_KREDITTBETALING} kr.`;
}

/** «13 år 5 mnd». Tid er det sterkeste tallet i denne modulen. */
function tid(maaneder: number): string {
    const aar = Math.floor(maaneder / 12);
    const mnd = maaneder % 12;
    if (aar === 0) return `${mnd} mnd`;
    if (mnd === 0) return `${aar} år`;
    return `${aar} år ${mnd} mnd`;
}

export function LaanModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const taOppLaan = usePengelivStore((s) => s.taOppLaan);
    const betalEkstra = usePengelivStore((s) => s.betalEkstra);

    const [produktId, setProduktId] = useState<string>('kredittkort');
    const [belop, setBelop] = useState<number>(LAANPRODUKTER[0].standardBelop);
    const [maate, setMaate] = useState<Nedbetaling>('annuitet');
    const [studieValg, setStudieValg] = useState<StudieValg>('studerer');
    const [ekstra, setEkstra] = useState(500);
    const [valgtLaanId, setValgtLaanId] = useState<string | null>(null);

    const laan = useMemo(() => tilstand?.laan ?? [], [tilstand]);
    const produkt = LAANPRODUKTER.find((p) => p.id === produktId) ?? LAANPRODUKTER[0];

    // Kortet fella regnes på: elevens eget hvis hen har et, ellers eksempelet.
    const kort = laan.find((l) => l.type === 'kredittkort') ?? EKSEMPELKORT;
    const eiEget = kort !== EKSEMPELKORT;

    const bareMinste = useMemo(() => nedbetalingsplan(kort), [kort]);
    const medEkstra = useMemo(() => nedbetalingsplan(kort, ekstra), [kort, ekstra]);

    // Lånet nedbetalingsplanen tegnes for. Har eleven ingen lån, tegner vi det
    // hen holder på å velge, slik at kortet aldri står tomt.
    const forhandsvisning = useMemo(
        () => lagNyttLaan(produkt, belop, maate, studieValg, 'forhandsvisning'),
        [produkt, belop, maate, studieValg]
    );
    const planLaan = laan.find((l) => l.id === valgtLaanId) ?? laan[0] ?? forhandsvisning;

    const plan = useMemo(() => nedbetalingsplan(planLaan), [planLaan]);
    const planSerie = useMemo(
        () => nedbetalingsplan({ ...planLaan, nedbetaling: 'serie' }),
        [planLaan]
    );
    const planAnnuitet = useMemo(
        () => nedbetalingsplan({ ...planLaan, nedbetaling: 'annuitet' }),
        [planLaan]
    );
    const visBeggeMaater = planLaan.nedbetaling !== 'minste';

    const nyEffektiv = useMemo(() => effektivRente(forhandsvisning), [forhandsvisning]);
    const nyPlan = useMemo(() => nedbetalingsplan(forhandsvisning), [forhandsvisning]);

    if (!tilstand || !satser) {
        return (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                Henter lånene dine...
            </div>
        );
    }

    const gjeld = sumGjeld(laan);
    const terminSum = sumTerminbelop(laan);
    const renterIAr = renterNeste12(laan);
    const skattespart = renterIAr * satser.skatt.alminneligInntekt;
    const bruks = tilstand.profil.kontoer.find((k) => k.type === 'bruks');
    const paaKonto = bruks ? bruks.saldo : 0;

    const spartTid = bareMinste.antallTerminer - medEkstra.antallTerminer;
    const spartKroner = bareMinste.sumBetalt - medEkstra.sumBetalt;

    const stipend = stipendomgjoring(belop, studieValg !== 'emner');

    function taOpp() {
        const brukte = new Set(laan.map((l) => l.id));
        let id = produkt.id;
        let n = 2;
        while (brukte.has(id)) {
            id = `${produkt.id}-${n}`;
            n += 1;
        }
        taOppLaan(lagNyttLaan(produkt, belop, maate, studieValg, id));
        setValgtLaanId(id);
    }

    return (
        <div className="flex flex-col gap-2">
            <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                    <h1 className="text-xl font-bold text-slate-900">Lån og gjeld</h1>
                    <p className="text-sm text-slate-600">
                        {gjeld > 0 ? (
                            <>
                                Du skylder <Kroner verdi={gjeld} /> og betaler{' '}
                                <Kroner verdi={terminSum} /> i måneden på det.
                            </>
                        ) : (
                            'Du skylder ingenting. Se hva et lån koster før du tar det opp.'
                        )}
                    </p>
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                    Renta legges til gjelda, og neste måned regnes renta av et større beløp
                    <Forklaring begrep="Rentes rente, motsatt vei">
                        På sparekontoen jobber rentes rente for deg. På et lån jobber den mot deg:
                        renta du ikke betaler, blir en del av gjelda, og neste måned må du betale
                        rente av renta også. Betaler du bare litt hver måned, vinner renta
                        kappløpet.
                    </Forklaring>
                </p>
            </header>

            <div className="grid gap-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-2">
                    {/* Modulens hjerte. */}
                    <Kort
                        tittel="Minstebeløpet på kredittkortet"
                        undertittel={
                            eiEget
                                ? `Ditt kort: ${heltall(kort.restgjeld)} kr til ${formaterProsent(kort.arligRente)} rente. ${minstetekst(kort)}`
                                : `Eksempel: ${heltall(EKSEMPELKORT.restgjeld)} kr til ${formaterProsent(EKSEMPELKORT.arligRente)} rente. ${minstetekst(EKSEMPELKORT)}`
                        }
                        handling={
                            <Forklaring begrep="Minsteinnbetaling">
                                Minstebeløpet er det minste du har lov til å betale den måneden. Det
                                regnes som en andel av gjelda, så når gjelda synker, synker
                                innbetalingen like fort. Renta synker langt saktere, og derfor går
                                nesten hele beløpet til renter i mange år.
                            </Forklaring>
                        }
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <Rute
                                etikett="Bare minstebeløpet"
                                tid={tid(bareMinste.antallTerminer)}
                                total={bareMinste.sumBetalt}
                                renter={bareMinste.sumRenter}
                                farge="rose"
                            />
                            <Rute
                                etikett={`Minstebeløpet + ${ekstra} kr`}
                                tid={tid(medEkstra.antallTerminer)}
                                total={medEkstra.sumBetalt}
                                renter={medEkstra.sumRenter}
                                farge="emerald"
                            />
                        </div>

                        <Gjeldkurve
                            serier={[
                                { plan: bareMinste, farge: '#e11d48' },
                                { plan: medEkstra, farge: '#059669' },
                            ]}
                            hoyde={40}
                        />

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">
                                Betal ekstra i måneden
                            </span>
                            <input
                                type="range"
                                min={0}
                                max={EKSTRA_MAKS}
                                step={100}
                                value={ekstra}
                                onChange={(e) => setEkstra(Number(e.target.value))}
                                className="h-4 min-w-24 flex-1 accent-emerald-600"
                                aria-label="Ekstra innbetaling per måned"
                            />
                            {EKSTRA_STEG.map((v) => (
                                <Knapp
                                    key={v}
                                    liten
                                    variant="sekundar"
                                    aktiv={ekstra === v}
                                    onClick={() => setEkstra(v)}
                                >
                                    {v}
                                </Knapp>
                            ))}
                        </div>

                        <motion.p
                            key={ekstra}
                            initial={{ opacity: 0, y: -3 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[11px] leading-snug text-slate-700"
                        >
                            {ekstra > 0 ? (
                                <>
                                    {ekstra} kr mer i måneden gjør deg ferdig {tid(spartTid)}{' '}
                                    tidligere, og du betaler <Kroner verdi={spartKroner} /> mindre
                                    til sammen.
                                </>
                            ) : (
                                <>
                                    Dra i knappen. Med bare minstebeløpet betaler du{' '}
                                    <Kroner verdi={bareMinste.sumRenter} /> i renter på et lån på{' '}
                                    <Kroner verdi={kort.restgjeld} />.
                                </>
                            )}
                        </motion.p>
                    </Kort>

                    <Kort
                        tittel={`Nedbetalingsplan: ${planLaan.navn}`}
                        undertittel={
                            laan.length > 1
                                ? 'Trykk på et annet lån i lista til høyre for å se planen for det.'
                                : undefined
                        }
                    >
                        {visBeggeMaater ? (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <Maate
                                        navn="Annuitet"
                                        farge="text-indigo-700"
                                        forste={planAnnuitet.punkter[0]?.betalt ?? 0}
                                        renter={planAnnuitet.sumRenter}
                                        tekst="Like stor regning hele veien."
                                    />
                                    <Maate
                                        navn="Serielån"
                                        farge="text-cyan-700"
                                        forste={planSerie.punkter[0]?.betalt ?? 0}
                                        renter={planSerie.sumRenter}
                                        tekst="Tyngst i starten, lettest til slutt."
                                    />
                                </div>
                                <Gjeldkurve
                                    serier={[
                                        { plan: planAnnuitet, farge: '#4f46e5' },
                                        { plan: planSerie, farge: '#0891b2' },
                                    ]}
                                    hoyde={36}
                                />
                                <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] leading-snug text-slate-500">
                                    Serielån koster{' '}
                                    <Kroner verdi={planAnnuitet.sumRenter - planSerie.sumRenter} />{' '}
                                    mindre i renter over {tid(planSerie.antallTerminer)}.
                                    <Forklaring begrep="Annuitet, serielån og termin">
                                        En termin er én regning, og den kommer hver måned. I et
                                        annuitetslån er hele regningen like stor hele veien: mest
                                        renter i starten, mest avdrag til slutt. I et serielån
                                        betaler du like mye avdrag hver gang, så regningen er størst
                                        i starten og krymper. Serielån gir lavere renter til sammen,
                                        fordi gjelda synker raskere.
                                    </Forklaring>
                                </p>
                            </>
                        ) : (
                            <>
                                <Gjeldkurve serier={[{ plan, farge: '#e11d48' }]} hoyde={36} />
                                <p className="mt-1 text-[11px] leading-snug text-slate-600">
                                    Kredittkortet har ingen avtalt slutt. Kurven viser hvor lenge
                                    gjelda blir liggende når du bare betaler minstebeløpet:{' '}
                                    {tid(plan.antallTerminer)}, og <Kroner verdi={plan.sumRenter} />{' '}
                                    av det du betaler er renter.
                                </p>
                            </>
                        )}
                    </Kort>
                </div>

                <div className="flex flex-col gap-2">
                    <Kort tittel="Gjelda di">
                        {laan.length === 0 ? (
                            <p className="text-xs text-slate-500">
                                Du har ingen lån. Velg et under for å se hva det ville kostet deg.
                            </p>
                        ) : (
                            <>
                                <div className="flex max-h-24 flex-col gap-1.5 overflow-y-auto pr-0.5">
                                    {laan.map((l) => (
                                        <LaanRad
                                            key={l.id}
                                            laan={l}
                                            valgt={l.id === planLaan.id}
                                            harPenger={paaKonto > 0}
                                            onVelg={() => setValgtLaanId(l.id)}
                                            onEkstra={(b) => betalEkstra(l.id, b)}
                                        />
                                    ))}
                                </div>
                                <p className="mt-1 flex flex-wrap items-center gap-x-1 text-[11px] leading-snug text-slate-500">
                                    <Kroner verdi={renterIAr} /> i renter i året gir{' '}
                                    <Kroner verdi={skattespart} /> lavere skatt.
                                    <Forklaring begrep="Rentefradrag">
                                        Renter du betaler på lån får du trekke fra inntekten før
                                        skatten regnes ut. Da blir skatten{' '}
                                        {formaterProsent(satser.skatt.alminneligInntekt, 0)} av
                                        rentene lavere. Staten tar altså en del av renteregningen
                                        din - men bare en del: resten betaler du selv.
                                    </Forklaring>
                                </p>
                            </>
                        )}

                        <div className="mt-2 mb-1.5 border-t border-slate-100 pt-2 text-xs font-bold text-slate-900">
                            Ta opp lån
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {LAANPRODUKTER.map((p) => (
                                <Knapp
                                    key={p.id}
                                    liten
                                    variant="sekundar"
                                    aktiv={p.id === produkt.id}
                                    onClick={() => {
                                        setProduktId(p.id);
                                        setBelop(p.standardBelop);
                                        setMaate(p.nedbetaling === 'serie' ? 'serie' : 'annuitet');
                                    }}
                                >
                                    {p.navn}
                                </Knapp>
                            ))}
                        </div>

                        <p className="mt-1.5 text-[11px] leading-snug text-slate-600">
                            {produkt.type === 'studielan'
                                ? studieTekst(studieValg, stipend.stipend, stipend.gjeld)
                                : produkt.beskrivelse}
                        </p>

                        <div className="mt-1.5 flex items-baseline justify-between">
                            <span className="text-lg font-bold text-slate-900">
                                <Kroner verdi={belop} />
                            </span>
                            <span className="text-[11px] text-slate-500">
                                {produkt.terminer > 0
                                    ? `${formaterProsent(produkt.arligRente)} rente, ${produkt.terminer} terminer`
                                    : `${formaterProsent(produkt.arligRente)} rente, ingen sluttdato`}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={produkt.minBelop}
                            max={produkt.maksBelop}
                            step={Math.max(500, Math.round(produkt.maksBelop / 200))}
                            value={belop}
                            onChange={(e) => setBelop(Number(e.target.value))}
                            className="h-4 w-full accent-indigo-600"
                            aria-label="Hvor mye du låner"
                        />

                        {produkt.type === 'boliglan' && (
                            <div className="flex items-center gap-1">
                                <span className="text-[11px] text-slate-500">Nedbetaling</span>
                                <Knapp
                                    liten
                                    variant="sekundar"
                                    aktiv={maate === 'annuitet'}
                                    onClick={() => setMaate('annuitet')}
                                >
                                    Annuitet
                                </Knapp>
                                <Knapp
                                    liten
                                    variant="sekundar"
                                    aktiv={maate === 'serie'}
                                    onClick={() => setMaate('serie')}
                                >
                                    Serielån
                                </Knapp>
                            </div>
                        )}

                        {produkt.type === 'studielan' && (
                            <div className="flex flex-wrap items-center gap-1">
                                {STUDIEVALG.map((valg) => (
                                    <Knapp
                                        key={valg.id}
                                        liten
                                        variant="sekundar"
                                        aktiv={studieValg === valg.id}
                                        onClick={() => setStudieValg(valg.id)}
                                    >
                                        {valg.navn}
                                    </Knapp>
                                ))}
                                <Forklaring begrep="Stipendomgjøring og rentefritak">
                                    Alt du får fra Lånekassen er lån til å begynne med. Bor du borte
                                    fra foreldrene og fullfører en hel grad, blir 40 % av det om til
                                    stipend, altså penger du slipper å betale tilbake. Tar du bare
                                    enkeltemner og består dem, blir 15 % om til stipend. Så lenge du
                                    er student står lånet rentefritt: det vokser ikke, og du betaler
                                    ingenting på det.
                                </Forklaring>
                            </div>
                        )}

                        <div className="mt-1.5 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-3 py-1 text-center">
                            <Nokkel
                                etikett="Per måned"
                                verdi={`${heltall(terminbelop(forhandsvisning))} kr`}
                            />
                            <Nokkel
                                etikett="Effektiv rente"
                                verdi={formaterProsent(nyEffektiv)}
                                forklaring={
                                    <Forklaring begrep="Effektiv rente">
                                        Nominell rente er tallet banken skilter med. Effektiv rente
                                        er hva lånet faktisk koster når gebyrene er lagt til og
                                        renta har fått løpe måned etter måned. Det er effektiv rente
                                        du skal sammenligne lån med, og den er alltid høyere enn den
                                        nominelle.
                                    </Forklaring>
                                }
                            />
                            <Nokkel
                                etikett="Renter og gebyr"
                                verdi={`${heltall(nyPlan.sumRenter + nyPlan.sumGebyr)} kr`}
                            />
                        </div>

                        <Knapp className="mt-1 w-full" onClick={taOpp}>
                            Ta opp dette lånet
                        </Knapp>
                    </Kort>
                </div>
            </div>
        </div>
    );
}

/**
 * Bygger lånet slik eleven har stilt det inn.
 *
 * Studielånet er det eneste som ikke blir gjeld krone for krone: fullfører du
 * graden, er 40 prosent stipend, og mens du fortsatt studerer står hele lånet
 * rentefritt. Boliglånet er det eneste der eleven velger mellom annuitet og
 * serie.
 */
function lagNyttLaan(
    produkt: Laanprodukt,
    belop: number,
    maate: Nedbetaling,
    studieValg: StudieValg,
    id: string
): Laan {
    if (produkt.type === 'studielan') {
        const omgjort = stipendomgjoring(belop, studieValg !== 'emner');
        return lagLaan(produkt, studieValg === 'studerer' ? belop : omgjort.gjeld, id, {
            rentefritak: studieValg === 'studerer',
        });
    }
    return lagLaan(produkt, belop, id, {
        nedbetaling: produkt.type === 'boliglan' ? maate : undefined,
    });
}

/** Én setning om hva studievalget betyr for gjelda. */
function studieTekst(valg: StudieValg, stipend: number, gjeld: number): string {
    if (valg === 'studerer') {
        return `Du studerer fortsatt, så lånet står rentefritt: det vokser ikke, og du betaler ingenting. Fullfører du graden, blir ${heltall(stipend)} kr av det om til stipend.`;
    }
    if (valg === 'grad') {
        return `Du fullførte graden, så 40 % ble stipend. ${heltall(gjeld)} kr står igjen som gjeld, og nedbetalingen over tjue år starter nå.`;
    }
    return `Du tok bare enkeltemner, så 15 % ble stipend. ${heltall(gjeld)} kr står igjen som gjeld, og nedbetalingen starter nå.`;
}

/** «61 959». Brukes der beløpet ikke skal telle seg fram som en `Kroner`. */
function heltall(verdi: number): string {
    return formaterTall(Math.round(verdi));
}

function Nokkel({
    etikett,
    verdi,
    forklaring,
}: {
    etikett: string;
    verdi: string;
    forklaring?: ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center justify-center text-[10px] uppercase tracking-wide text-slate-400">
                {etikett}
                {forklaring}
            </div>
            <div className="text-sm font-bold tabular-nums text-slate-900">{verdi}</div>
        </div>
    );
}

function Rute({
    etikett,
    tid: tidTekst,
    total,
    renter,
    farge,
}: {
    etikett: string;
    tid: string;
    total: number;
    renter: number;
    farge: 'rose' | 'emerald';
}) {
    const ramme =
        farge === 'rose' ? 'border-rose-200 bg-rose-50/70' : 'border-emerald-200 bg-emerald-50/70';
    const tekst = farge === 'rose' ? 'text-rose-700' : 'text-emerald-700';
    return (
        <div className={`rounded-xl border px-2.5 py-1.5 ${ramme}`}>
            <div className="text-[11px] font-semibold text-slate-600">{etikett}</div>
            <div className={`text-xl font-bold ${tekst}`}>{tidTekst}</div>
            <div className="text-[11px] leading-snug text-slate-600">
                {heltall(total)} kr, derav {heltall(renter)} kr renter.
            </div>
        </div>
    );
}

function Maate({
    navn,
    farge,
    forste,
    renter,
    tekst,
}: {
    navn: string;
    farge: string;
    forste: number;
    renter: number;
    tekst: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-1">
            <div className="flex items-baseline justify-between gap-2">
                <span className={`text-[11px] font-bold ${farge}`}>{navn}</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {heltall(forste)} kr
                </span>
            </div>
            <div className="text-[10px] leading-snug text-slate-500">
                {heltall(renter)} kr i renter. {tekst}
            </div>
        </div>
    );
}

function LaanRad({
    laan,
    valgt,
    harPenger,
    onVelg,
    onEkstra,
}: {
    laan: Laan;
    valgt: boolean;
    harPenger: boolean;
    onVelg: () => void;
    onEkstra: (belop: number) => void;
}) {
    return (
        <div
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-1 transition ${
                valgt ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-white'
            }`}
        >
            <button
                type="button"
                onClick={onVelg}
                className="min-w-0 flex-1 text-left"
                title="Vis nedbetalingsplanen for dette lånet"
            >
                <span className="block truncate text-sm font-medium text-slate-800">
                    {laan.navn}
                    <span className="ml-1 text-[11px] font-normal text-slate-500">
                        {formaterProsent(laan.arligRente)}
                        {laan.rentefritak ? ', rentefritt mens du studerer' : ''}
                    </span>
                </span>
                <span className="block text-[11px] text-slate-500">
                    {heltall(terminbelop(laan))} kr i måneden
                </span>
            </button>
            <span className="text-sm font-semibold text-slate-900">
                <Kroner verdi={laan.restgjeld} />
            </span>
            <span className="flex shrink-0 gap-1">
                <Knapp
                    liten
                    variant="sekundar"
                    disabled={!harPenger}
                    onClick={() => onEkstra(1000)}
                    tittel="Betal 1 000 kr ekstra rett på gjelda"
                >
                    +1 000
                </Knapp>
                <Knapp
                    liten
                    variant="sekundar"
                    disabled={!harPenger}
                    onClick={() => onEkstra(10000)}
                    tittel="Betal 10 000 kr ekstra rett på gjelda"
                >
                    +10 000
                </Knapp>
            </span>
        </div>
    );
}

/**
 * Restgjelda tegnet som kurve, én linje per plan. Kurvene deler akser, slik at
 * den korteste faktisk ser kortest ut.
 */
function Gjeldkurve({
    serier,
    hoyde,
}: {
    serier: { plan: Nedbetalingsplan; farge: string }[];
    hoyde: number;
}) {
    const maksTid = Math.max(1, ...serier.map((s) => s.plan.antallTerminer));
    const maksGjeld = Math.max(1, ...serier.flatMap((s) => s.plan.punkter.map((p) => p.restgjeld)));

    return (
        <svg
            viewBox="0 0 300 100"
            preserveAspectRatio="none"
            style={{ height: hoyde }}
            className="mt-1.5 w-full rounded-lg bg-slate-50"
            role="img"
            aria-label="Restgjelda måned for måned"
        >
            {serier.map((serie, indeks) => {
                const punkter = [
                    '0,0',
                    ...serie.plan.punkter.map((p) => {
                        const x = (p.termin / maksTid) * 300;
                        const y = 100 - (p.restgjeld / maksGjeld) * 100;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                    }),
                ].join(' ');
                return (
                    <polyline
                        key={indeks}
                        points={punkter}
                        fill="none"
                        stroke={serie.farge}
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                    />
                );
            })}
        </svg>
    );
}
