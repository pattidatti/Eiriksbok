import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, RotateCcw } from 'lucide-react';

// Den hellige kalenderen: et årshjul der eleven ser hvorfor noen høytider står
// stille og andre vandrer.
//
// Lyspære-øyeblikket: dra i årvelgeren. En ren månekalender skyver høytidene
// bakover elleve dager i året, og prikkene glir hele veien rundt hjulet. En
// solkalender rører seg ikke. En blandet kalender sklir også bakover, men får
// en skuddmåned som kaster den fram igjen, slik at høytiden aldri forlater
// årstiden sin.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface Maaned {
    navn: string;
    kort: string;
    dager: number;
}

interface Gruppe {
    id: string;
    label: string;
}

interface Hoytid {
    navn: string;
    dag: number;
    spenn?: number;
    tekst?: string;
}

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
    kalender?: string;
    forklaring?: string;
    drift?: number;
    skuddDager?: number;
    skuddGrense?: number;
    hoytider?: Hoytid[];
}

interface HelligKalenderProps {
    title?: string;
    intro?: string;
    maaneder?: Maaned[];
    groups?: Gruppe[];
    traditions?: Tradisjon[];
    defaultSelection?: string[];
    maxVisible?: number;
    aarAntall?: number;
    aarLabel?: string;
    note?: string;
}

const SENTER = 130;
const MAANED_RADIUS = 112;
const ETIKETT_RADIUS = 122;
const YTRE_RING = 92;
const RING_SPENN = 36;

function punkt(radius: number, grad: number) {
    const rad = ((grad - 90) * Math.PI) / 180;
    return { x: SENTER + radius * Math.cos(rad), y: SENTER + radius * Math.sin(rad) };
}

function bue(radius: number, fra: number, til: number) {
    const p1 = punkt(radius, fra);
    const p2 = punkt(radius, til);
    // Buen tegnes alltid med klokka (sweep 1). Når den krysser årsskiftet blir
    // til-graden mindre enn fra-graden, så lengden må måles på den veien buen
    // faktisk går - ellers slår store-buen inn og streken går hele hjulet rundt.
    const spenn = (((til - fra) % 360) + 360) % 360;
    const stor = spenn > 180 ? 1 : 0;
    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${radius} ${radius} 0 ${stor} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

// Enkel modell: hvert år skyves høytidene like mange dager. Har tradisjonen en
// skuddmåned, legges den inn så snart forskyvningen har passert grensen.
function forskyvning(t: Tradisjon, aar: number): number {
    const drift = t.drift ?? 0;
    if (!drift) return 0;
    let sum = 0;
    for (let i = 0; i < aar; i++) {
        sum += drift;
        if (t.skuddDager && t.skuddGrense !== undefined && sum <= t.skuddGrense) {
            sum += t.skuddDager;
        }
    }
    return sum;
}

// En kalender uten drift står stille uansett år. En kalender med drift står
// bare på utgangspunktet i det første året, og det må sies med andre ord - ellers
// ser det ut som om månekalenderen aldri flytter seg.
function statusTekst(t: Tradisjon, aar: number): string {
    const skift = forskyvning(t, aar);
    if (!(t.drift ?? 0)) return `${t.name}: står stille i hjulet.`;
    if (skift === 0)
        return aar === 0
            ? `${t.name}: utgangspunktet. Dra i velgeren.`
            : `${t.name}: tilbake på utgangspunktet.`;
    return `${t.name}: forskjøvet ${Math.abs(skift)} dager ${skift < 0 ? 'bakover' : 'framover'}.`;
}

export function HelligKalender({
    title = 'Årshjulet',
    intro = 'Velg tradisjon, og dra i årvelgeren. Se hvilke høytider som står stille, og hvilke som vandrer.',
    maaneder = [],
    groups = [],
    traditions = [],
    defaultSelection = [],
    maxVisible = 3,
    aarAntall = 9,
    aarLabel = 'År',
    note,
}: HelligKalenderProps) {
    const start = defaultSelection.length
        ? defaultSelection.slice(0, maxVisible)
        : traditions.slice(0, maxVisible).map((t) => t.id);

    const [valgte, setValgte] = useState<string[]>(start);
    const [aktivId, setAktivId] = useState<string>(start[0] ?? '');
    const [aar, setAar] = useState<number>(0);

    const aarshjul = useMemo(
        () => maaneder.reduce((sum, m) => sum + m.dager, 0) || 365,
        [maaneder]
    );

    const maanedStart = useMemo(() => {
        const liste: number[] = [];
        let sum = 0;
        maaneder.forEach((m) => {
            liste.push(sum);
            sum += m.dager;
        });
        return liste;
    }, [maaneder]);

    const aktiv = useMemo(
        () => traditions.find((t) => t.id === aktivId) ?? traditions[0],
        [traditions, aktivId]
    );

    const synlige = useMemo(
        () =>
            valgte.map((id) => traditions.find((t) => t.id === id)).filter(Boolean) as Tradisjon[],
        [valgte, traditions]
    );

    const grupper = useMemo<Gruppe[]>(() => {
        if (groups.length) return groups;
        const sett: string[] = [];
        traditions.forEach((t) => {
            if (t.group && !sett.includes(t.group)) sett.push(t.group);
        });
        return sett.map((id) => ({ id, label: id }));
    }, [groups, traditions]);

    if (!maaneder.length || !traditions.length || !aktiv) return null;

    const velg = (id: string) => {
        setAktivId(id);
        setValgte((v) => {
            if (v.includes(id)) return v;
            return v.length >= maxVisible ? [...v.slice(1), id] : [...v, id];
        });
    };

    const tilbakestill = () => {
        setValgte(start);
        setAktivId(start[0] ?? '');
        setAar(0);
    };

    const grad = (dag: number) => ((((dag % aarshjul) + aarshjul) % aarshjul) / aarshjul) * 360;

    const maanedFor = (dag: number) => {
        const d = (((dag % aarshjul) + aarshjul) % aarshjul) + 1;
        let treff = maaneder[0];
        maaneder.forEach((m, i) => {
            if (d > maanedStart[i]) treff = m;
        });
        return treff.navn;
    };

    const radiusFor = (i: number) =>
        YTRE_RING - i * (synlige.length > 1 ? RING_SPENN / (synlige.length - 1) : 0);

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
                <span className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {/* Velger, gruppert slik at ulike størrelser ikke blir ni like kolonner */}
            <div className="space-y-1.5 border-b border-slate-200 px-5 py-2.5">
                {grupper.map((g) => (
                    <div key={g.id} className="flex flex-wrap items-center gap-2">
                        <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:w-36">
                            {g.label}
                        </span>
                        {traditions
                            .filter((t) => t.group === g.id)
                            .map((t) => {
                                const erAktiv = t.id === aktiv.id;
                                const med = valgte.includes(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => velg(t.id)}
                                        aria-pressed={erAktiv}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                            erAktiv
                                                ? 'border-transparent text-white'
                                                : med
                                                  ? 'bg-white text-slate-700'
                                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                        }`}
                                        style={
                                            erAktiv
                                                ? { backgroundColor: t.color }
                                                : med
                                                  ? { borderColor: t.color }
                                                  : undefined
                                        }
                                    >
                                        {t.name}
                                    </button>
                                );
                            })}
                    </div>
                ))}
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-[230px_1fr]">
                {/* Årshjulet */}
                <div>
                    <svg viewBox="0 0 260 260" role="img" className="w-full max-w-[230px]">
                        <title>
                            {`Årshjul med ${maaneder.length} måneder og høytidene til ${synlige
                                .map((t) => t.name)
                                .join(', ')}`}
                        </title>

                        <circle
                            cx={SENTER}
                            cy={SENTER}
                            r={MAANED_RADIUS}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth={18}
                        />

                        {maaneder.map((m, i) => {
                            const startGrad = grad(maanedStart[i]);
                            const midt = grad(maanedStart[i] + m.dager / 2);
                            const skille = punkt(MAANED_RADIUS + 9, startGrad);
                            const skilleInn = punkt(MAANED_RADIUS - 9, startGrad);
                            const tekst = punkt(ETIKETT_RADIUS, midt);
                            return (
                                <g key={m.navn}>
                                    <line
                                        x1={skilleInn.x}
                                        y1={skilleInn.y}
                                        x2={skille.x}
                                        y2={skille.y}
                                        stroke="#ffffff"
                                        strokeWidth={1.5}
                                    />
                                    <text
                                        x={tekst.x}
                                        y={tekst.y + 3}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fontWeight={600}
                                        fill="#64748b"
                                    >
                                        {m.kort}
                                    </text>
                                </g>
                            );
                        })}

                        {synlige.map((t, i) => {
                            const radius = radiusFor(i);
                            const erAktiv = t.id === aktiv.id;
                            const skift = forskyvning(t, aar);
                            return (
                                <g key={t.id}>
                                    <circle
                                        cx={SENTER}
                                        cy={SENTER}
                                        r={radius}
                                        fill="none"
                                        stroke={t.color}
                                        strokeWidth={erAktiv ? 2 : 1}
                                        opacity={erAktiv ? 0.35 : 0.18}
                                    />
                                    {(t.hoytider ?? []).map((h, hi) => {
                                        const naa = h.dag + skift;
                                        const p = punkt(radius, grad(naa));
                                        const startP = punkt(radius, grad(h.dag));
                                        return (
                                            <g key={`${t.id}-${hi}-${h.navn}`}>
                                                {h.spenn ? (
                                                    <path
                                                        d={bue(
                                                            radius,
                                                            grad(naa),
                                                            grad(naa + h.spenn)
                                                        )}
                                                        fill="none"
                                                        stroke={t.color}
                                                        strokeWidth={erAktiv ? 7 : 4}
                                                        strokeLinecap="round"
                                                        opacity={erAktiv ? 0.35 : 0.2}
                                                    />
                                                ) : null}
                                                {aar > 0 && skift !== 0 && (
                                                    <circle
                                                        cx={startP.x}
                                                        cy={startP.y}
                                                        r={3}
                                                        fill="none"
                                                        stroke={t.color}
                                                        strokeWidth={1.5}
                                                        opacity={0.35}
                                                    />
                                                )}
                                                <motion.circle
                                                    // Startverdiene settes direkte i tillegg til
                                                    // animate, slik at prikken ligger riktig
                                                    // allerede før første animasjon.
                                                    cx={p.x}
                                                    cy={p.y}
                                                    r={erAktiv ? 6 : 4}
                                                    fill={t.color}
                                                    opacity={erAktiv ? 1 : 0.55}
                                                    initial={false}
                                                    animate={{ cx: p.x, cy: p.y }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 120,
                                                        damping: 18,
                                                    }}
                                                />
                                            </g>
                                        );
                                    })}
                                </g>
                            );
                        })}

                        <circle cx={SENTER} cy={SENTER} r={4} fill="#94a3b8" />
                    </svg>

                    <label
                        className="mt-3 block text-xs font-semibold text-slate-600"
                        htmlFor="hellig-kalender-aar"
                    >
                        {`${aarLabel} ${aar + 1} av ${aarAntall}`}
                    </label>
                    <input
                        id="hellig-kalender-aar"
                        type="range"
                        min={0}
                        max={Math.max(aarAntall - 1, 0)}
                        step={1}
                        value={aar}
                        onChange={(e) => setAar(Number(e.target.value))}
                        className="mt-1 w-full accent-amber-600"
                    />
                    <p className="mt-1 text-xs text-slate-500">{statusTekst(aktiv, aar)}</p>
                </div>

                {/* Kortene - lesbare uten at noen klikker */}
                <div className="space-y-1.5">
                    {synlige.map((t) => {
                        const erAktiv = t.id === aktiv.id;
                        const skift = forskyvning(t, aar);
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setAktivId(t.id)}
                                aria-pressed={erAktiv}
                                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                    erAktiv
                                        ? 'border-slate-300 bg-slate-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                                style={{ borderTopWidth: '3px', borderTopColor: t.color }}
                            >
                                <span className="flex flex-wrap items-baseline gap-x-2">
                                    <span
                                        className="text-sm font-semibold"
                                        style={{ color: t.color }}
                                    >
                                        {t.name}
                                    </span>
                                    {t.kalender && (
                                        <span
                                            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                            style={{
                                                backgroundColor: `${t.color}1a`,
                                                color: t.color,
                                            }}
                                        >
                                            {t.kalender}
                                        </span>
                                    )}
                                </span>
                                {t.forklaring && (
                                    <span className="mt-1 block text-sm text-slate-700">
                                        {t.forklaring}
                                    </span>
                                )}
                                <span className="mt-2 block space-y-1">
                                    {(t.hoytider ?? []).map((h, hi) => (
                                        <span
                                            key={`${t.id}-rad-${hi}-${h.navn}`}
                                            className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-600"
                                        >
                                            <span
                                                className="inline-block h-2 w-2 shrink-0 rounded-full"
                                                style={{ backgroundColor: t.color }}
                                                aria-hidden="true"
                                            />
                                            <span className="font-medium text-slate-800">
                                                {h.navn}
                                            </span>
                                            <AnimatePresence mode="wait">
                                                <motion.span
                                                    key={maanedFor(h.dag + skift)}
                                                    initial={{ opacity: 0, y: 3 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.16 }}
                                                    className="text-slate-500"
                                                >
                                                    {maanedFor(h.dag + skift)}
                                                </motion.span>
                                            </AnimatePresence>
                                            {h.tekst && erAktiv && (
                                                <span className="w-full text-slate-500">
                                                    {h.tekst}
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    {note ?? `Velg inntil ${maxVisible} tradisjoner om gangen.`}
                </span>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
