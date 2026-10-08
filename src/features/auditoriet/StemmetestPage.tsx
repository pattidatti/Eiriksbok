// Stemmetesten for Auditoriet (fase 0 i docs/Design documents/auditoriet-blueprint.md).
//
// Auditoriet skal bruke maskinens egen stemme (Web Speech). Før vi bygger salen må vi
// vite tre ting om stemmene elevene faktisk har:
//   1. Finnes det en norsk stemme, og hvordan låter den i et minutt forelesning?
//   2. Hvor fort snakker den? Kringkastingsplanen anslår varighet fra antall ord.
//   3. Sender den ordgrenser (`onboundary`)? Det er det leppesynken skal drives av.
// Siden måler alle tre per segment og lager en rapport som kan limes inn i chatten.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCopy, Play, Square } from 'lucide-react';
import { pickBestNorwegianVoice } from '../../hooks/useTextToSpeech';

/** Anslaget kringkastingsplanen bruker inntil testen sier noe annet. */
const ANSLATT_ORD_PER_MINUTT = 150;

/** Pause mellom segmentene. Chrome kutter `speak()` som kalles direkte fra `onend`. */
const PAUSE_MELLOM_MS = 300;

const SEGMENTER = [
    'Hei, og velkommen til forelesning. I dag skal vi reise tilbake til Norge for over tusen år siden.',
    'Tenk deg landet rundt år 870. Det finnes ikke ett Norge. Det finnes mange små riker, og hvert rike har sin egen konge eller høvding.',
    'Høvdingene krangler om makt, om jord og om hvem som skal få skatt fra bøndene.',
    'En av dem heter Harald. Han kommer fra Østlandet, og han vil mer enn de andre.',
    'Sagaene forteller at Harald lovet å ikke klippe håret før han var konge over hele landet. Derfor fikk han navnet Harald Hårfagre.',
    'Rundt år 872 møter han de andre høvdingene i et stort sjøslag i Hafrsfjord, ved Stavanger.',
    'Harald vinner. Ifølge sagaene flykter mange av motstanderne hans over havet til Island.',
    'Men vent litt. Ble Norge virkelig ett land den dagen?',
    'Nei, ikke helt. Harald styrte mest langs kysten i sør og vest. Det tok flere hundre år før Norge ble ett rike slik vi tenker på det i dag.',
    'Det er dette vi kaller rikssamlingen. Det var en lang og langsom prosess, ikke én enkelt dag.',
    'Neste gang skal vi se på hvordan kongene fikk folk til å betale skatt. Takk for nå!',
];

interface Maling {
    segment: number;
    ord: number;
    anslattSek: number;
    faktiskSek: number | null;
    ordgrenser: number;
    oppstartMs: number | null;
    feil?: string;
}

const tellOrd = (tekst: string) => tekst.split(/\s+/).filter(Boolean).length;

const erNorsk = (v: SpeechSynthesisVoice) => /^(nb|no|nn)\b/i.test(v.lang.replace('_', '-'));

function useStemmer() {
    const [stemmer, setStemmer] = useState<SpeechSynthesisVoice[]>([]);
    useEffect(() => {
        const synth = window.speechSynthesis;
        if (!synth) return;
        const les = () => setStemmer(synth.getVoices());
        les();
        synth.addEventListener('voiceschanged', les);
        return () => synth.removeEventListener('voiceschanged', les);
    }, []);
    return stemmer;
}

export function StemmetestPage() {
    const harTale = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const stemmer = useStemmer();
    const norske = useMemo(() => stemmer.filter(erNorsk), [stemmer]);
    const anbefalt = useMemo(() => pickBestNorwegianVoice(stemmer), [stemmer]);

    const [valgtNavn, setValgtNavn] = useState<string | null>(null);
    const valgt = norske.find((v) => v.name === valgtNavn) ?? anbefalt ?? norske[0];

    const [tempo, setTempo] = useState(1);
    const [aktiv, setAktiv] = useState(-1);
    const [ord, setOrd] = useState<{ start: number; slutt: number } | null>(null);
    const [munn, setMunn] = useState(0);
    const [malinger, setMalinger] = useState<Maling[]>([]);
    const [kopiert, setKopiert] = useState(false);

    const stoppetRef = useRef(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopp = useCallback(() => {
        stoppetRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
        window.speechSynthesis?.cancel();
        setAktiv(-1);
        setOrd(null);
        setMunn(0);
    }, []);

    useEffect(() => stopp, [stopp]);

    // Munnen faller igjen av seg selv; hver ordgrense åpner den på nytt.
    useEffect(() => {
        if (munn <= 0) return;
        const t = setTimeout(() => setMunn((m) => Math.max(0, m - 0.34)), 45);
        return () => clearTimeout(t);
    }, [munn]);

    // lesSegment kaller seg selv for neste segment. En useCallback kan ikke referere seg
    // selv i sin egen initialisering, så selvkallet går via denne ref-en.
    const lesSegmentRef = useRef<(i: number) => void>(() => {});

    const lesSegment = useCallback(
        (i: number) => {
            if (stoppetRef.current || i >= SEGMENTER.length) {
                stoppetRef.current = true;
                setAktiv(-1);
                setOrd(null);
                return;
            }
            const tekst = SEGMENTER[i];
            const antallOrd = tellOrd(tekst);
            const maling: Maling = {
                segment: i + 1,
                ord: antallOrd,
                anslattSek: +((antallOrd / ANSLATT_ORD_PER_MINUTT) * 60 / tempo).toFixed(2),
                faktiskSek: null,
                ordgrenser: 0,
                oppstartMs: null,
            };
            const bestilt = performance.now();
            let startet = bestilt;

            const ytring = new SpeechSynthesisUtterance(tekst);
            if (valgt) ytring.voice = valgt;
            ytring.lang = valgt?.lang ?? 'nb-NO';
            ytring.rate = tempo;

            ytring.onstart = () => {
                startet = performance.now();
                maling.oppstartMs = Math.round(startet - bestilt);
            };
            ytring.onboundary = (e) => {
                if (e.name && e.name !== 'word') return;
                maling.ordgrenser += 1;
                const lengde = e.charLength || tekst.slice(e.charIndex).search(/\s|$/);
                setOrd({ start: e.charIndex, slutt: e.charIndex + lengde });
                setMunn(1);
            };
            const ferdig = (feil?: string) => {
                maling.faktiskSek = +((performance.now() - startet) / 1000).toFixed(2);
                if (feil) maling.feil = feil;
                setMalinger((m) => [...m, maling]);
                setOrd(null);
                timerRef.current = setTimeout(() => lesSegmentRef.current(i + 1), PAUSE_MELLOM_MS);
            };
            ytring.onend = () => ferdig();
            ytring.onerror = (e) => {
                if (e.error === 'interrupted' || e.error === 'canceled') return;
                ferdig(e.error);
            };

            setAktiv(i);
            window.speechSynthesis.speak(ytring);
        },
        [tempo, valgt]
    );

    useEffect(() => {
        lesSegmentRef.current = lesSegment;
    }, [lesSegment]);

    const start = () => {
        stopp();
        stoppetRef.current = false;
        setMalinger([]);
        setKopiert(false);
        // Liten pause etter cancel(), ellers svelger ChromeOS første ytring.
        timerRef.current = setTimeout(() => lesSegment(0), 100);
    };

    const sum = useMemo(() => {
        const ferdige = malinger.filter((m) => m.faktiskSek !== null);
        const ordTotalt = ferdige.reduce((s, m) => s + m.ord, 0);
        const faktisk = ferdige.reduce((s, m) => s + (m.faktiskSek ?? 0), 0);
        const anslatt = ferdige.reduce((s, m) => s + m.anslattSek, 0);
        const grenser = ferdige.reduce((s, m) => s + m.ordgrenser, 0);
        return {
            segmenter: ferdige.length,
            faktisk: +faktisk.toFixed(1),
            anslatt: +anslatt.toFixed(1),
            ordPerMinutt: faktisk > 0 ? Math.round(((ordTotalt / faktisk) * 60) / tempo) : null,
            ordgrenserAndel: ordTotalt > 0 ? Math.round((grenser / ordTotalt) * 100) : 0,
        };
    }, [malinger, tempo]);

    const kopierRapport = async () => {
        const rapport = {
            dato: new Date().toISOString(),
            nettleser: navigator.userAgent,
            antallStemmer: stemmer.length,
            norskeStemmer: norske.map((v) => ({
                navn: v.name,
                lang: v.lang,
                lokal: v.localService,
                standard: v.default,
            })),
            anbefalt: anbefalt?.name ?? null,
            brukt: valgt?.name ?? null,
            tempo,
            sammendrag: sum,
            malinger,
        };
        try {
            await navigator.clipboard.writeText(JSON.stringify(rapport, null, 2));
            setKopiert(true);
        } catch {
            setKopiert(false);
        }
    };

    const spiller = aktiv >= 0;

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 text-slate-800">
            <Link
                to="/oving"
                className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
            >
                <ArrowLeft size={16} /> Øving
            </Link>

            <h1 className="text-3xl font-bold text-slate-900">Auditoriet: stemmetest</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
                Auditoriet skal bruke maskinens egen stemme. Her hører du hvordan et minutt
                forelesning låter på denne maskinen, og vi måler hvor fort stemmen snakker og om
                munnen til foreleseren kan følge ordene.
            </p>

            {!harTale && (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                    Denne nettleseren har ikke talesyntese. Auditoriet vil gå i tekstmodus her.
                </div>
            )}

            {harTale && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                    <section className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <button
                                onClick={spiller ? stopp : start}
                                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow transition active:scale-95 disabled:opacity-40 ${
                                    spiller ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {spiller ? <Square size={18} /> : <Play size={18} />}
                                {spiller ? 'Stopp' : 'Spill av forelesningen'}
                            </button>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                Tempo
                                <input
                                    type="range"
                                    min={0.7}
                                    max={1.4}
                                    step={0.05}
                                    value={tempo}
                                    disabled={spiller}
                                    onChange={(e) => setTempo(+e.target.value)}
                                />
                                <span className="w-10 tabular-nums">{tempo.toFixed(2)}</span>
                            </label>
                            <Munn apning={munn} snakker={spiller} />
                        </div>

                        <ol className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-lg leading-relaxed shadow-sm">
                            {SEGMENTER.map((tekst, i) => (
                                <li
                                    key={i}
                                    className={`rounded-lg px-3 py-1 transition ${
                                        i === aktiv ? 'bg-indigo-50 text-slate-900' : 'text-slate-500'
                                    }`}
                                >
                                    {i === aktiv && ord ? (
                                        <>
                                            {tekst.slice(0, ord.start)}
                                            <mark className="rounded bg-amber-200 px-0.5 text-slate-900">
                                                {tekst.slice(ord.start, ord.slutt)}
                                            </mark>
                                            {tekst.slice(ord.slutt)}
                                        </>
                                    ) : (
                                        tekst
                                    )}
                                </li>
                            ))}
                        </ol>
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="font-semibold text-slate-900">
                                Norske stemmer ({norske.length} av {stemmer.length})
                            </h2>
                            {norske.length === 0 && (
                                <p className="mt-2 text-sm text-rose-700">
                                    Ingen norsk stemme på denne maskinen. Auditoriet går i
                                    tekstmodus.
                                </p>
                            )}
                            <ul className="mt-2 space-y-1">
                                {norske.map((v) => (
                                    <li key={v.name}>
                                        <label className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-slate-50">
                                            <input
                                                type="radio"
                                                name="stemme"
                                                className="mt-1"
                                                checked={valgt?.name === v.name}
                                                disabled={spiller}
                                                onChange={() => setValgtNavn(v.name)}
                                            />
                                            <span>
                                                <span className="font-medium">{v.name}</span>
                                                <span className="block text-xs text-slate-500">
                                                    {v.lang} · {v.localService ? 'lokal' : 'nett'}
                                                    {v.name === anbefalt?.name && ' · anbefalt'}
                                                </span>
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="font-semibold text-slate-900">Målinger</h2>
                            <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                                <dt className="text-slate-500">Segmenter</dt>
                                <dd className="tabular-nums">
                                    {sum.segmenter} / {SEGMENTER.length}
                                </dd>
                                <dt className="text-slate-500">Faktisk tid</dt>
                                <dd className="tabular-nums">{sum.faktisk} s</dd>
                                <dt className="text-slate-500">Anslått tid</dt>
                                <dd className="tabular-nums">{sum.anslatt} s</dd>
                                <dt className="text-slate-500">Ord per minutt</dt>
                                <dd className="tabular-nums">{sum.ordPerMinutt ?? '-'}</dd>
                                <dt className="text-slate-500">Ordgrenser</dt>
                                <dd className="tabular-nums">{sum.ordgrenserAndel} %</dd>
                            </dl>
                            <p className="mt-2 text-xs text-slate-500">
                                Ord per minutt er regnet om til tempo 1. Ordgrenser under 80 %
                                betyr at munnen må gjette i stedet for å følge ordene.
                            </p>
                            <button
                                onClick={kopierRapport}
                                disabled={malinger.length === 0}
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ClipboardCopy size={16} />
                                {kopiert ? 'Kopiert!' : 'Kopier rapport'}
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}

/** En tegnet munn som åpner seg på hver ordgrense, slik foreleseren skal gjøre. */
function Munn({ apning, snakker }: { apning: number; snakker: boolean }) {
    return (
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
                <circle cx="28" cy="28" r="26" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="20" cy="22" r="3" fill="#334155" />
                <circle cx="36" cy="22" r="3" fill="#334155" />
                <ellipse cx="28" cy="38" rx="9" ry={1.5 + apning * 7} fill="#7f1d1d" />
            </svg>
            {snakker ? 'Munnen følger ordgrensene' : 'Munn'}
        </div>
    );
}
