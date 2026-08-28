// Lønn og skatt: brutto til netto, linje for linje, som et ekte skatteoppgjør.
//
// Eleven drar i årslønna og hele slippen regner seg om mens de drar. Hver
// linje har sin egen forklaring rett ved siden av seg, ikke gjemt i en
// ordliste ingen åpner.

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { beregnLonnsslipp } from '../engine/skatt';
import { Forklaring, Knapp, Kort, Kroner, Tallrad } from '../components/primitives';

/** Hvor mye pendlerfradraget utgjør i året når eleven skrur det på. */
const PENDLING_KR = 18000;
/** Hvor mye fagforeningskontingenten utgjør i året når eleven skrur den på. */
const FAGFORENING_KR = 8000;

const LONN_MIN = 0;
const LONN_MAKS = 900000;
const LONN_STEG = 5000;

const PROSENT = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

export function LonnOgSkattModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const settLonn = usePengelivStore((s) => s.settLonn);
    const settFradrag = usePengelivStore((s) => s.settFradrag);

    const profil = tilstand?.profil ?? null;

    const slipp = useMemo(() => {
        if (!profil || !satser) return null;
        return beregnLonnsslipp(profil, satser);
    }, [profil, satser]);

    if (!profil || !satser || !slipp) {
        return <Laster />;
    }

    const brutto = profil.bruttoArslonn;
    const pendlingPa = profil.fradrag.pendling > 0;
    const fagforeningPa = profil.fradrag.fagforening > 0;

    return (
        <div className="flex flex-col gap-3">
            <header className="flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="text-2xl font-bold text-slate-900">Lønn og skatt</h1>
                <p className="text-sm text-slate-600">
                    Dra i lønna og se hva som skjer med hver eneste linje.
                </p>
            </header>

            {/* Setningen som er hele poenget. Den står øverst og endrer seg live. */}
            <motion.div
                layout
                className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white px-4 py-3 shadow-sm"
            >
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <p className="max-w-xl text-base leading-relaxed text-slate-700">
                        Du tjener <Kroner verdi={brutto} /> i året før skatt. Av det går{' '}
                        <span className="font-semibold text-rose-700">
                            <Kroner verdi={slipp.sumSkatt} />
                        </span>{' '}
                        til skatt. Da sitter du igjen med{' '}
                        <span className="font-semibold text-emerald-700">
                            <Kroner verdi={slipp.nettoArlig} />
                        </span>
                        , altså <Kroner verdi={slipp.nettoManedlig} /> i måneden.
                    </p>
                    <div className="text-right">
                        <div className="text-3xl font-bold leading-none text-rose-700">
                            {PROSENT.format(slipp.effektivSats * 100)} %
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-600">
                            av lønna går til skatt
                            <Forklaring begrep="Effektiv skatteprosent">
                                Effektiv skatteprosent er hvor stor del av hele lønna di som faktisk
                                går til skatt. Den er lavere enn den høyeste satsen du hører om,
                                fordi de øverste satsene bare gjelder de siste kronene du tjener.
                            </Forklaring>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Kort tittel="Fra brutto til netto">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            Brutto og netto
                            <Forklaring begrep="Brutto og netto">
                                Brutto er lønna før skatt, altså det som står i arbeidsavtalen din.
                                Netto er det som faktisk kommer inn på kontoen etter at skatten er
                                trukket fra.
                            </Forklaring>
                        </span>
                        <span className="flex items-center gap-1">
                            Trinnskatt
                            <Forklaring begrep="Trinnskatt">
                                Trinnskatt er en trapp. De første kronene du tjener slipper unna
                                denne skatten. Jo mer du tjener, jo høyere blir satsen, men den
                                høyere satsen gjelder bare kronene over hvert trinn. Får du 1000 kr
                                mer i lønn, er det bare de 1000 kronene som treffer det øverste
                                trinnet.
                            </Forklaring>
                        </span>
                    </div>

                    <div className="max-h-[250px] overflow-y-auto pr-1">
                        <div className="flex flex-col divide-y divide-slate-100">
                            {slipp.linjer.map((linje, i) => (
                                <Tallrad
                                    key={`${linje.navn}-${i}`}
                                    etikett={linje.navn}
                                    belop={linje.belop}
                                    forklaring={linje.forklaring}
                                    sats={linje.sats}
                                    tone={linje.belop < 0 ? 'negativ' : 'positiv'}
                                />
                            ))}
                            <Tallrad
                                etikett="Igjen til deg i året"
                                belop={slipp.nettoArlig}
                                forklaring="Dette er nettolønna: det som faktisk blir dine penger."
                                tone="positiv"
                                fremhevet
                            />
                            <Tallrad
                                etikett="Igjen til deg i måneden"
                                belop={slipp.nettoManedlig}
                                forklaring="Nettolønna delt på tolv. Det er dette budsjettet ditt har å gå på."
                                tone="positiv"
                                fremhevet
                            />
                        </div>
                    </div>

                    <p className="mt-2 text-[11px] leading-snug text-slate-500">
                        Grunnlaget for trinnskatt er <Kroner verdi={slipp.personinntekt} />, og
                        grunnlaget for den vanlige inntektsskatten er{' '}
                        <Kroner verdi={slipp.alminneligInntekt} /> etter at fradragene er trukket
                        fra.
                    </p>
                </Kort>

                <div className="flex flex-col gap-3">
                    <Kort tittel="Årslønna di">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={Math.round(brutto)}
                                min={LONN_MIN}
                                max={LONN_MAKS}
                                step={1000}
                                onChange={(e) => settLonn(clamp(Number(e.target.value)))}
                                className="w-32 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-lg font-semibold text-slate-900 focus:border-indigo-400 focus:outline-none"
                                aria-label="Årslønn før skatt"
                            />
                            <span className="text-sm text-slate-500">kr i året</span>
                        </div>
                        <input
                            type="range"
                            value={Math.round(brutto)}
                            min={LONN_MIN}
                            max={LONN_MAKS}
                            step={LONN_STEG}
                            onChange={(e) => settLonn(Number(e.target.value))}
                            className="mt-2 w-full accent-indigo-600"
                            aria-label="Dra for å endre årslønn"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <Knapp variant="sekundar" liten onClick={() => settLonn(220000)}>
                                Deltid
                            </Knapp>
                            <Knapp variant="sekundar" liten onClick={() => settLonn(450000)}>
                                Full jobb
                            </Knapp>
                            <Knapp variant="sekundar" liten onClick={() => settLonn(700000)}>
                                Godt betalt
                            </Knapp>
                        </div>
                    </Kort>

                    <Kort tittel="Fradrag du kan skru på">
                        <p className="mb-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                            Et fradrag trekkes fra før skatten regnes ut
                            <Forklaring begrep="Fradrag">
                                Et fradrag er ikke penger du får utbetalt. Det gjør bare at en
                                mindre del av lønna blir skattlagt, så skatteregninga blir mindre.
                                Skrur du på et fradrag på 10 000 kr, sparer du rundt 2 200 kr i
                                skatt.
                            </Forklaring>
                        </p>
                        <div className="flex flex-col gap-2">
                            <Bryter
                                tittel="Reisefradrag"
                                belop={PENDLING_KR}
                                pa={pendlingPa}
                                onEndre={() =>
                                    settFradrag({ pendling: pendlingPa ? 0 : PENDLING_KR })
                                }
                            >
                                Har du lang vei til jobb, kan du trekke fra en del av det reisen
                                koster deg. Her er fradraget satt til 18 000 kr i året.
                            </Bryter>
                            <Bryter
                                tittel="Fagforening"
                                belop={FAGFORENING_KR}
                                pa={fagforeningPa}
                                onEndre={() =>
                                    settFradrag({
                                        fagforening: fagforeningPa ? 0 : FAGFORENING_KR,
                                    })
                                }
                            >
                                Er du med i en fagforening, kan du trekke fra det du betaler i
                                kontingent. Her er fradraget satt til 8 000 kr i året.
                            </Bryter>
                            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-2.5 py-1.5">
                                <span className="ml-11 flex-1 text-sm text-slate-500">
                                    Rentefradrag
                                </span>
                                <span className="text-xs tabular-nums text-slate-500">
                                    <Kroner verdi={profil.fradrag.renterBetalt} />
                                </span>
                                <Forklaring begrep="Rentefradrag">
                                    Renter du betaler på lån gir også fradrag. Det skrur du ikke på
                                    selv: det regnes ut av seg selv når du får lån.
                                </Forklaring>
                            </div>
                        </div>
                    </Kort>
                </div>
            </div>

            <p className="text-[11px] text-slate-400">
                Satsene er fra skatteåret {satser.aar}, sist kontrollert {satser.sistKontrollert}.
            </p>
        </div>
    );
}

function clamp(verdi: number): number {
    if (!Number.isFinite(verdi)) return LONN_MIN;
    return Math.min(LONN_MAKS, Math.max(LONN_MIN, verdi));
}

function Bryter({
    tittel,
    belop,
    pa,
    onEndre,
    children,
}: {
    tittel: string;
    belop: number;
    pa: boolean;
    onEndre: () => void;
    children: ReactNode;
}) {
    return (
        <div
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition ${
                pa ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'
            }`}
        >
            <button
                type="button"
                onClick={onEndre}
                aria-pressed={pa}
                className="flex flex-1 items-center gap-2 text-left"
            >
                <span
                    className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                        pa ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                >
                    <motion.span
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                        className={`h-4 w-4 rounded-full bg-white shadow ${pa ? 'ml-4' : 'ml-0'}`}
                    />
                </span>
                <span className="text-sm font-medium text-slate-800">{tittel}</span>
            </button>
            <span className="text-xs tabular-nums text-slate-500">
                <Kroner verdi={belop} />
            </span>
            <Forklaring begrep={tittel}>{children}</Forklaring>
        </div>
    );
}

function Laster() {
    return (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
            <Wallet className="h-6 w-6" aria-hidden="true" />
            <p className="text-sm">Henter lønnsslippen din...</p>
        </div>
    );
}
