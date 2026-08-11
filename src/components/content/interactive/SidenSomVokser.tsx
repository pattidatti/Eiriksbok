import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers, MousePointerClick, RotateCcw, Sparkles } from 'lucide-react';

interface SidenSomVokserProps {
    title?: string;
}

type ZoneId = 'margA' | 'midten' | 'margB';
type Slot = 'midten' | 'marg';

interface Voice {
    id: string;
    name: string;
    when: string;
    slot: Slot;
    blurb: string;
}

interface Zone {
    id: ZoneId;
    label: string;
    hint: string;
}

const VOICES: Voice[] = [
    {
        id: 'mishna',
        name: 'Mishna',
        when: 'ca. år 200',
        slot: 'midten',
        blurb: 'Det rabbinerne så på som kjernen i den muntlige læren, redigert i Galilea og skrevet på hebraisk. Teksten er kort og knapp og gjengir hva ulike rabbinere mente. Rundt 150 navn er nevnt.',
    },
    {
        id: 'gemara',
        name: 'Gemara',
        when: 'ca. år 400 til 500-tallet',
        slot: 'midten',
        blurb: 'Rabbinernes lange diskusjon om Mishna, på hebraisk og arameisk. Den ene utgaven ble ferdig i Galilea rundt år 400, den andre i Babylonia mot slutten av 500-tallet. Mishna og gemara utgjør til sammen Talmud.',
    },
    {
        id: 'rashi',
        name: 'Rashi',
        when: '1040-1105',
        slot: 'marg',
        blurb: 'Rabbi Shlomo ben Jitzhak fra Troyes i Frankrike. Kjent for klare og presise tolkninger. Kommentaren hans er trykt i en egen skrifttype som kalles rashiskrift.',
    },
    {
        id: 'tosafot',
        name: 'Tosafot',
        when: 'etter Rashi',
        slot: 'marg',
        blurb: 'Tilleggene. Etterkommerne og elevene til Rashi førte tolkningen videre. I den første trykte utgaven, Venezia 1520-1523, fikk de margen på motsatt side av Rashi.',
    },
];

const ZONES: Zone[] = [
    { id: 'margA', label: 'Den ene margen', hint: 'Rundt teksten i midten' },
    { id: 'midten', label: 'Midt på siden', hint: 'Grunnteksten. Plass til to.' },
    { id: 'margB', label: 'Den andre margen', hint: 'Rett overfor den første' },
];

const SLOT_HINT: Record<Slot, string> = {
    midten: 'Den hører hjemme i den store teksten midt på arket.',
    marg: 'Den hører hjemme i en av margene rundt midtteksten.',
};

type Tone = 'neutral' | 'ok' | 'error';

const TONE_STYLES: Record<Tone, string> = {
    neutral: 'bg-slate-50 border-slate-200 text-slate-600',
    ok: 'bg-blue-50 border-blue-200 text-blue-800',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
};

const START_MESSAGE = 'Velg en stemme nederst, og klikk der på siden den hører hjemme.';

export function SidenSomVokser({ title = 'Bygg en side i Talmud' }: SidenSomVokserProps) {
    const [placed, setPlaced] = useState<Record<string, ZoneId>>({});
    const [selected, setSelected] = useState<string | null>(null);
    const [tone, setTone] = useState<Tone>('neutral');
    const [message, setMessage] = useState(START_MESSAGE);
    const [shake, setShake] = useState<ZoneId | null>(null);

    const placedCount = Object.keys(placed).length;
    const done = placedCount === VOICES.length;

    const voicesInZone = (zoneId: ZoneId) => VOICES.filter((v) => placed[v.id] === zoneId);
    const tray = VOICES.filter((v) => !placed[v.id]);

    const reject = (zoneId: ZoneId, text: string) => {
        setShake(zoneId);
        window.setTimeout(() => setShake(null), 450);
        setTone('error');
        setMessage(text);
    };

    const accept = (voice: Voice, zoneId: ZoneId) => {
        setPlaced((prev) => ({ ...prev, [voice.id]: zoneId }));
        setSelected(null);
        setTone('ok');
        setMessage(`${voice.name} (${voice.when}): ${voice.blurb}`);
    };

    const handleZoneClick = (zoneId: ZoneId) => {
        if (done) return;
        if (!selected) {
            setTone('neutral');
            setMessage('Velg en stemme nederst på kortet først, så klikker du på en spalte.');
            return;
        }
        const voice = VOICES.find((v) => v.id === selected);
        if (!voice) return;

        if (voice.slot === 'marg') {
            if (zoneId !== 'margA' && zoneId !== 'margB') {
                reject(zoneId, `${voice.name} står ikke der. ${SLOT_HINT.marg}`);
                return;
            }
            if (voicesInZone(zoneId).length > 0) {
                reject(
                    zoneId,
                    'Den margen er opptatt. Rashi og tosafot står i hver sin marg, ikke i samme.'
                );
                return;
            }
            accept(voice, zoneId);
            return;
        }

        if (voice.slot === zoneId) {
            accept(voice, zoneId);
            return;
        }
        reject(zoneId, `${voice.name} står ikke der. ${SLOT_HINT[voice.slot]}`);
    };

    const handleReset = () => {
        setPlaced({});
        setSelected(null);
        setTone('neutral');
        setMessage(START_MESSAGE);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fire stemmer fra over tusen år skal stå samtidig på det samme arket.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-5">
                <div className="flex gap-1.5">
                    <div
                        className="hidden sm:block w-2 rounded-l-lg bg-slate-300"
                        aria-hidden="true"
                    />
                    <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1.8fr_1fr] sm:h-[270px]">
                        {ZONES.map((zone) => {
                            const inZone = voicesInZone(zone.id);
                            const filled = inZone.length > 0;
                            return (
                                <motion.button
                                    key={zone.id}
                                    type="button"
                                    onClick={() => handleZoneClick(zone.id)}
                                    animate={
                                        shake === zone.id ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
                                    }
                                    transition={{ duration: 0.4 }}
                                    className={`min-h-[110px] rounded-lg border-2 p-2 text-left flex flex-col gap-1.5 transition-colors ${
                                        zone.id === 'midten'
                                            ? 'col-span-2 order-last sm:order-none sm:col-span-1'
                                            : ''
                                    } ${
                                        filled
                                            ? 'border-amber-200 bg-amber-50/70'
                                            : 'border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300'
                                    }`}
                                >
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        {zone.label}
                                    </span>
                                    {!filled && (
                                        <span className="text-[11px] leading-snug text-slate-400">
                                            {zone.hint}
                                        </span>
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                        {inZone.map((voice) => (
                                            <motion.div
                                                key={voice.id}
                                                layoutId={`voice-${voice.id}`}
                                                className="rounded-md bg-white border border-amber-300 px-2 py-1.5 shadow-sm"
                                            >
                                                <span className="block text-xs font-semibold text-slate-800">
                                                    {voice.name}
                                                </span>
                                                <span className="block text-[10px] text-amber-700">
                                                    {voice.when}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                    Margene er de to spaltene som rammer inn teksten i midten, en på hver side.
                </p>
            </div>

            <div className="px-5 pt-4">
                <div className="flex items-center gap-2 mb-2">
                    <MousePointerClick className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">
                        Stemmer som mangler ({tray.length})
                    </span>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[42px]">
                    {tray.map((voice) => (
                        <motion.button
                            key={voice.id}
                            type="button"
                            layoutId={`voice-${voice.id}`}
                            onClick={() => {
                                setSelected(voice.id);
                                setTone('neutral');
                                setMessage(`${voice.name} er valgt. Klikk spalten den skal stå i.`);
                            }}
                            whileTap={{ scale: 0.95 }}
                            className={`rounded-lg border px-3 py-1.5 text-left shadow-sm ${
                                selected === voice.id
                                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                                    : 'border-slate-200 bg-white hover:border-indigo-300'
                            }`}
                        >
                            <span className="block text-xs font-semibold text-slate-800">
                                {voice.name}
                            </span>
                            <span className="block text-[10px] text-slate-500">{voice.when}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                        >
                            <div className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    initial={{ rotate: -20, scale: 0.6 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                Siden er full.
                            </div>
                            <p className="mt-1 leading-relaxed">
                                Over tusen år skiller den eldste stemmen fra den yngste, og likevel
                                står de på det samme arket. Ingen av dem er strøket ut for å gi
                                plass til de andre. Den som leser, må forholde seg til alle sammen.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`${tone}-${message}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${TONE_STYLES[tone]}`}
                        >
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                    {placedCount} av {VOICES.length} plassert
                </span>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
