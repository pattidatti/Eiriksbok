// Framskrivningsgrafen: her blir rentes rente noe som skjer, ikke en formel.
//
// To linjer over de samme årene:
//   nominelt     - heltrukket. Tallet som faktisk kommer til å stå på kontoen.
//   dagensKroner - stiplet. Hva de samme pengene er verdt i dagens penger.
//
// I tillegg deles det nominelle beløpet i to felt: det eleven selv har lagt
// inn (innskutt) og det renta har lagt på (avkastning). Avstanden mellom
// linjene og høyden på det øvre feltet er hele poenget med modulen.

import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from 'chart.js';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { Info } from 'lucide-react';
import type { FramskrivningPunkt } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const KRONER = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });

/** Kort tallformat til aksen: 84 000 og 1,2 mill i stedet for lange rader. */
function kortTall(verdi: number): string {
    if (Math.abs(verdi) >= 1000000) {
        return `${(verdi / 1000000).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} mill`;
    }
    return KRONER.format(Math.round(verdi));
}

function kroner(verdi: number): string {
    return `${KRONER.format(Math.round(verdi))} kr`;
}

function reduserteBevegelser(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const FORKLARING_NOKKEL = 'pengeliv-graf-forklaring-lest';

function harLestForklaring(): boolean {
    try {
        return window.localStorage.getItem(FORKLARING_NOKKEL) === 'ja';
    } catch {
        return false;
    }
}

function husk(): void {
    try {
        window.localStorage.setItem(FORKLARING_NOKKEL, 'ja');
    } catch {
        // Lagring er en bonus, ikke et krav.
    }
}

interface FramskrivningsGrafProps {
    /** Ett punkt per år, eldst først. */
    punkter: FramskrivningPunkt[];
    /** Høyden på selve lerretet i piksler. */
    hoyde?: number;
    /** Kompakt modus: bare grafen og en liten tegnforklaring. */
    kompakt?: boolean;
    /** Vis forklaringsboksen over grafen. Skjules automatisk i kompakt modus. */
    visForklaring?: boolean;
    /** Overskrift over grafen. */
    tittel?: string;
}

export function FramskrivningsGraf({
    punkter,
    hoyde = 260,
    kompakt = false,
    visForklaring = true,
    tittel,
}: FramskrivningsGrafProps) {
    const antall = punkter.length;
    const rolig = useMemo(() => reduserteBevegelser(), []);
    const [tegnet, setTegnet] = useState(0);
    // Med redusert bevegelse hopper vi rett til ferdig kurve.
    const synlige = rolig ? antall : Math.min(tegnet, antall);
    const [forklaringApen, setForklaringApen] = useState(() => !harLestForklaring());

    // Forklaringsboksen koster rundt 70 piksler. Chromebook-baselinjen er 768
    // piksler høy, og uten dette havner x-aksen under skjermkanten nettopp den
    // ene gangen eleven ser grafen for aller første gang. Grafen låner høyden
    // ut mens forklaringen står, og får den tilbake når den lukkes.
    const visForklaringNaa = !kompakt && visForklaring && forklaringApen;
    const effektivHoyde = visForklaringNaa ? Math.max(120, hoyde - 70) : hoyde;

    // Grafen tegner seg inn fra venstre første gang den vises, og på nytt hvis
    // eleven bytter hvor langt fram vi ser.
    useEffect(() => {
        if (antall === 0 || rolig) return;
        const varighet = 850;
        const start = performance.now();
        let ramme = 0;
        const steg = (naa: number) => {
            const andel = Math.min(1, (naa - start) / varighet);
            setTegnet(Math.max(2, Math.round(andel * antall)));
            if (andel < 1) ramme = requestAnimationFrame(steg);
        };
        ramme = requestAnimationFrame(steg);
        return () => cancelAnimationFrame(ramme);
    }, [antall, rolig]);

    const data: ChartData<'line', (number | null)[], string> = useMemo(() => {
        const til = (hent: (p: FramskrivningPunkt) => number) =>
            punkter.map((p, i) => (i < synlige ? Math.round(hent(p)) : null));
        return {
            labels: punkter.map((p) => `${p.alder}`),
            datasets: [
                {
                    label: 'Lagt inn av deg',
                    data: til((p) => p.innskutt),
                    borderColor: 'rgba(99, 102, 241, 0.55)',
                    backgroundColor: 'rgba(165, 180, 252, 0.45)',
                    borderWidth: 1.5,
                    fill: 'origin',
                    tension: 0.25,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
                {
                    label: 'Til sammen på kontoen',
                    data: til((p) => p.nominelt),
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(16, 185, 129, 0.28)',
                    borderWidth: 3,
                    fill: '-1',
                    tension: 0.25,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                },
                {
                    label: 'Verdt i dagens penger',
                    data: til((p) => p.dagensKroner),
                    borderColor: 'rgb(100, 116, 139)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [6, 5],
                    fill: false,
                    tension: 0.25,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
            ],
        };
    }, [punkter, synlige]);

    const maks = useMemo(() => {
        let hoyest = 0;
        for (const p of punkter) hoyest = Math.max(hoyest, p.nominelt);
        return hoyest * 1.08;
    }, [punkter]);

    const options: ChartOptions<'line'> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            // Inntegningen over eier bevegelsen. Chart.js sin egen animasjon
            // er av, så et tall som endrer seg mens eleven drar i en
            // skyveknapp treffer med en gang.
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.93)',
                    padding: 10,
                    titleFont: { size: 13 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        title: (poster: TooltipItem<'line'>[]) => {
                            const punkt = punkter[poster[0]?.dataIndex ?? 0];
                            if (!punkt) return '';
                            return `Når du er ${punkt.alder} år (${punkt.aar})`;
                        },
                        label: (post: TooltipItem<'line'>) => {
                            const y = post.parsed.y;
                            if (y === null || y === undefined) return '';
                            return `${post.dataset.label}: ${kroner(y)}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: maks > 0 ? maks : undefined,
                    border: { display: false },
                    grid: { color: 'rgba(148, 163, 184, 0.22)' },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 },
                        maxTicksLimit: 6,
                        callback: (verdi: string | number) =>
                            kortTall(typeof verdi === 'number' ? verdi : Number(verdi)),
                    },
                },
                x: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 },
                        maxTicksLimit: kompakt ? 5 : 10,
                        callback: (_verdi: string | number, indeks: number) => {
                            const punkt = punkter[indeks];
                            return punkt ? `${punkt.alder} år` : '';
                        },
                    },
                },
            },
        }),
        [kompakt, maks, punkter]
    );

    if (antall === 0) {
        return (
            <div
                className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 text-sm text-slate-500"
                style={{ height: hoyde }}
            >
                Ingen framskrivning ennå. Sett en lønn og et budsjett først.
            </div>
        );
    }

    const siste = punkter[antall - 1];

    return (
        <div className="flex flex-col gap-3">
            {tittel ? <h3 className="text-base font-semibold text-slate-800">{tittel}</h3> : null}

            {visForklaringNaa ? (
                <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2.5 text-[13px] leading-snug text-slate-700">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    <div className="grid flex-1 gap-x-5 gap-y-1.5 sm:grid-cols-2">
                        <p>
                            Den heltrukne linja er tallet som faktisk kommer til å stå på kontoen
                            din. Den stiplete viser hva de samme pengene er verdt i dagens penger,
                            for prisene stiger litt hvert år.
                        </p>
                        <p>
                            Det lyse feltet nederst er det du har lagt inn selv. Feltet over er
                            renta, og det vokser fortere og fortere fordi du også får rente av renta
                            du fikk i fjor.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            husk();
                            setForklaringApen(false);
                        }}
                        className="shrink-0 self-center rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Skjønner
                    </button>
                </div>
            ) : null}

            <div style={{ height: effektivHoyde }}>
                <Line data={data} options={options} />
            </div>

            <div
                className={`flex flex-wrap items-center gap-y-1.5 text-slate-600 ${
                    kompakt ? 'gap-x-3 text-[11px]' : 'gap-x-5 text-xs'
                }`}
            >
                <Tegn
                    farge="bg-indigo-200 border border-indigo-300"
                    tekst={kompakt ? 'Lagt inn' : 'Lagt inn av deg'}
                />
                <Tegn
                    farge="bg-emerald-200 border border-emerald-300"
                    tekst={kompakt ? 'Renta' : 'Lagt på av renta'}
                />
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-5 rounded bg-indigo-600" aria-hidden="true" />
                    {kompakt ? 'Til sammen' : 'Til sammen på kontoen'}
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        className="h-0.5 w-5 rounded"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(90deg, rgb(100,116,139) 0 5px, transparent 5px 9px)',
                        }}
                        aria-hidden="true"
                    />
                    {kompakt ? 'I dagens penger' : 'Verdt i dagens penger'}
                </span>
            </div>

            {!kompakt && siste ? (
                <p className="text-sm text-slate-600">
                    Når du er {siste.alder} år har du lagt inn{' '}
                    <span className="font-semibold text-slate-800">{kroner(siste.innskutt)}</span>{' '}
                    selv. Renta har lagt på{' '}
                    <span className="font-semibold text-emerald-700">
                        {kroner(siste.avkastning)}
                    </span>
                    . Til sammen{' '}
                    <span className="font-semibold text-indigo-700">{kroner(siste.nominelt)}</span>,
                    som er verdt {kroner(siste.dagensKroner)} i dagens penger.
                </p>
            ) : null}
        </div>
    );
}

function Tegn({ farge, tekst }: { farge: string; tekst: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm ${farge}`} aria-hidden="true" />
            {tekst}
        </span>
    );
}
