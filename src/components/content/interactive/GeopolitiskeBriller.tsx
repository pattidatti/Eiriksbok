import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Anchor,
    ArrowRight,
    CheckCircle2,
    Fuel,
    Glasses,
    Lightbulb,
    MapPinned,
    RotateCcw,
    Scale,
    XCircle,
} from 'lucide-react';

// GeopolitiskeBriller: Eleven møter fire land og ett spørsmål om hvert land. For hvert land velger
// eleven hvilke «briller» som forklarer det landet gjør: naboene, havet, ressursene eller
// størrelsen. Hvert brillepar passer til ett land.
//
// Lyspære-øyeblikket: Geografien et land har (hvem det bor ved siden av, hvor havet er, hva som
// ligger i bakken og hvor stort det er) forklarer mye av det landet gjør i verden.

type BrilleId = 'naboer' | 'havet' | 'ressurser' | 'storrelse';
type Fase = 'idle' | 'active' | 'complete';

interface Brille {
    id: BrilleId;
    navn: string;
    kort: string;
}

interface Tilfelle {
    land: string;
    sporsmal: string;
    riktig: BrilleId;
    forklaring: string;
    hint: string;
}

interface GeopolitiskeBrillerProps {
    title?: string;
}

const BRILLER: Brille[] = [
    { id: 'naboer', navn: 'Naboene', kort: 'Hvem bor landet ved siden av?' },
    { id: 'havet', navn: 'Havet', kort: 'Havner, sund og veier over sjøen' },
    { id: 'ressurser', navn: 'Ressursene', kort: 'Olje, gass og annet i bakken' },
    { id: 'storrelse', navn: 'Størrelsen', kort: 'Er landet stort eller lite?' },
];

const TILFELLER: Tilfelle[] = [
    {
        land: 'Russland',
        sporsmal:
            'Hvorfor har Russland marinen sin i nord, i Murmansk, bare 200 kilometer fra grensen til Norge?',
        riktig: 'havet',
        forklaring:
            'Havna i Murmansk fryser ikke om vinteren, fordi det varme vannet fra Golfstrømmen holder den åpen. Det er Russlands største isfrie havn. Derfor har Nordflåten hovedkvarteret sitt like ved.',
        hint: 'Tenk på hva som skjer med havet i nord om vinteren. Hva har Murmansk som mange russiske havner mangler?',
    },
    {
        land: 'Saudi-Arabia',
        sporsmal:
            'Hvorfor følger Kina, India, Japan og Sør-Korea så nøye med på det som skjer i Saudi-Arabia, langt unna dem selv?',
        riktig: 'ressurser',
        forklaring:
            'Saudi-Arabia sender mer olje gjennom Hormuzstredet enn noe annet land. Kina, India, Japan og Sør-Korea kjøpte til sammen 69 prosent av oljen som gikk gjennom stredet i 2024. Landene trenger oljen.',
        hint: 'Disse landene ligger ikke ved siden av Saudi-Arabia. Hva har Saudi-Arabia som de trenger?',
    },
    {
        land: 'USA',
        sporsmal:
            'Hvorfor mente USA på 1800-tallet at de hadde rett til å bestemme ekstra mye i Latin-Amerika?',
        riktig: 'naboer',
        forklaring:
            'Latin-Amerika ligger rett sør for USA. USA så på området som sin interessesfære, et område der en stormakt mener den har rett til å bestemme mer enn andre. Dette kalles Monroe-doktrinen.',
        hint: 'Se på kartet: hvor ligger Latin-Amerika i forhold til USA?',
    },
    {
        land: 'Norge',
        sporsmal:
            'Hvorfor prøver Norge å være trygt sammen med andre land, i stedet for å klare seg alene?',
        riktig: 'storrelse',
        forklaring:
            'Norge blir ofte regnet som en småstat, et land som er lite sammenlignet med andre. Mange småstater søker trygghet gjennom allianser og felles regler, fordi de ikke kan stå imot en stormakt alene.',
        hint: 'Norge har mye hav og mange ressurser. Men hvor mange mennesker og soldater har Norge sammenlignet med de store landene?',
    },
];

function BrilleIkon({ id, className }: { id: BrilleId; className?: string }) {
    if (id === 'naboer') return <MapPinned className={className} />;
    if (id === 'havet') return <Anchor className={className} />;
    if (id === 'ressurser') return <Fuel className={className} />;
    return <Scale className={className} />;
}

function brilleNavn(id: BrilleId) {
    return BRILLER.find((b) => b.id === id)?.navn ?? '';
}

export function GeopolitiskeBriller({
    title = 'Ta på deg geopolitiske briller',
}: GeopolitiskeBrillerProps) {
    const [fase, setFase] = useState<Fase>('idle');
    const [indeks, setIndeks] = useState(0);
    const [valgt, setValgt] = useState<BrilleId | null>(null);
    const [losteLand, setLosteLand] = useState<number[]>([]);

    const tilfelle = TILFELLER[indeks];
    const erRiktig = valgt === tilfelle.riktig;
    const erLost = losteLand.includes(indeks);

    const velg = (id: BrilleId) => {
        if (erLost || fase === 'complete') return;
        setFase('active');
        setValgt(id);
        if (id === tilfelle.riktig) {
            setLosteLand((forrige) => [...forrige, indeks]);
        }
    };

    const neste = () => {
        if (indeks + 1 >= TILFELLER.length) {
            setFase('complete');
            return;
        }
        setIndeks(indeks + 1);
        setValgt(null);
    };

    const tilbakestill = () => {
        setFase('idle');
        setIndeks(0);
        setValgt(null);
        setLosteLand([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Glasses className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg brillene som best forklarer hva landet gjør.
                    </p>
                </div>
            </div>

            {/* Fremdrift */}
            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {TILFELLER.map((t, i) => {
                    const lost = losteLand.includes(i);
                    const aktiv = i === indeks && fase !== 'complete';
                    return (
                        <motion.span
                            key={t.land}
                            animate={{ scale: aktiv ? 1.05 : 1 }}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${
                                lost
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : aktiv
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                        >
                            {lost && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {t.land}
                        </motion.span>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {fase !== 'complete' ? (
                    <motion.div
                        key={`sak-${indeks}`}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        className="p-5"
                    >
                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 mb-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                {tilfelle.land}
                            </div>
                            <p className="text-slate-800 font-medium mt-1">{tilfelle.sporsmal}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {BRILLER.map((b) => {
                                const denneValgt = valgt === b.id;
                                const riktigValgt = denneValgt && b.id === tilfelle.riktig;
                                const feilValgt = denneValgt && b.id !== tilfelle.riktig;
                                return (
                                    <motion.button
                                        key={b.id}
                                        type="button"
                                        onClick={() => velg(b.id)}
                                        disabled={erLost}
                                        whileHover={erLost ? undefined : { y: -2 }}
                                        whileTap={erLost ? undefined : { scale: 0.97 }}
                                        animate={
                                            feilValgt
                                                ? { x: [0, -6, 6, -4, 4, 0] }
                                                : riktigValgt
                                                  ? { scale: [1, 1.05, 1] }
                                                  : { x: 0, scale: 1 }
                                        }
                                        transition={{ duration: 0.35 }}
                                        className={`flex items-center gap-3 text-left rounded-xl border px-3 py-2.5 shadow-sm ${
                                            riktigValgt
                                                ? 'bg-emerald-50 border-emerald-300'
                                                : feilValgt
                                                  ? 'bg-rose-50 border-rose-200'
                                                  : erLost
                                                    ? 'bg-white border-slate-100 opacity-50'
                                                    : 'bg-white border-slate-200 hover:shadow-md'
                                        }`}
                                    >
                                        <span
                                            className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${
                                                riktigValgt
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : feilValgt
                                                      ? 'bg-rose-100 text-rose-600'
                                                      : 'bg-indigo-50 text-indigo-600'
                                            }`}
                                        >
                                            <BrilleIkon id={b.id} className="w-4 h-4" />
                                        </span>
                                        <span>
                                            <span className="block text-sm font-semibold text-slate-800">
                                                {b.navn}
                                            </span>
                                            <span className="block text-xs text-slate-500">
                                                {b.kort}
                                            </span>
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="ferdig"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="p-5"
                    >
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                                <motion.span
                                    initial={{ rotate: -30, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                                >
                                    <Glasses className="w-5 h-5" />
                                </motion.span>
                                Fire land, fire par briller
                            </div>
                            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {TILFELLER.map((t, i) => (
                                    <motion.li
                                        key={t.land}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.1 }}
                                        className="flex items-center gap-2 rounded-lg bg-white border border-emerald-100 px-3 py-2 text-sm text-slate-700"
                                    >
                                        <BrilleIkon
                                            id={t.riktig}
                                            className="w-4 h-4 text-emerald-600 shrink-0"
                                        />
                                        <span>
                                            <span className="font-semibold">{t.land}:</span>{' '}
                                            {brilleNavn(t.riktig).toLowerCase()}
                                        </span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback-sone (alltid synlig) */}
            <div className="mx-5 mb-4 min-h-[72px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${fase}-${indeks}-${valgt ?? 'ingen'}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex gap-2 px-4 py-3 rounded-lg border text-sm ${
                            fase === 'complete'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : valgt === null
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : erRiktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                    >
                        {fase === 'complete' ? (
                            <>
                                <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                    Hvert land ble forklart med ulike briller. Geografien bestemmer
                                    ikke alt, men den forklarer mye av hva land gjør. Det er dette
                                    geopolitikk handler om.
                                </span>
                            </>
                        ) : valgt === null ? (
                            <>
                                <Glasses className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                    Land {indeks + 1} av {TILFELLER.length}. Hvilke briller gir det
                                    beste svaret?
                                </span>
                            </>
                        ) : erRiktig ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{tilfelle.forklaring}</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                    {brilleNavn(valgt)} spiller kanskje inn, men det er ikke den
                                    viktigste grunnen her. {tilfelle.hint}
                                </span>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                {fase !== 'complete' ? (
                    <button
                        type="button"
                        onClick={neste}
                        disabled={!erLost}
                        className={`inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium ${
                            erLost
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {indeks + 1 >= TILFELLER.length ? 'Se alle brillene' : 'Neste land'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <span className="text-sm font-medium text-emerald-700">Ferdig!</span>
                )}
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
