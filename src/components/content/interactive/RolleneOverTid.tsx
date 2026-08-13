import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookMarked, Footprints, History } from 'lucide-react';

// Rollene over tid: én tidslinje i to spor.
//
// Lyspære-øyeblikket: øvre spor er hva læren SIER, nedre spor er hva som faktisk
// SKJEDDE. Når eleven ser den stiplede streken skrå nedover og til høyre - 23 år
// i Den norske kirke, over hundre år i reformjødedommen - oppdager hun at et gap
// mellom ord og praksis ikke betyr at noen lyver. Det betyr at historien beveger
// seg saktere enn teksten. Og noen tradisjoner har ikke noe gap i det hele tatt,
// fordi de aldri hadde rollen det står strid om.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

type Spor = 'prinsipp' | 'praksis';

interface RolleHendelse {
    id: string;
    year: number;
    displayYear: string;
    track: Spor;
    short: string;
    text: string;
    source?: string;
    linkTo?: string;
    linkLabel?: string;
}

interface RolleTradisjon {
    id: string;
    name: string;
    color: string;
    summary?: string;
    events: RolleHendelse[];
}

interface RolleneOverTidProps {
    title?: string;
    intro?: string;
    note?: string;
    principleLabel?: string;
    practiceLabel?: string;
    traditions?: RolleTradisjon[];
    defaultTradition?: string;
}

// Figuren er bevisst lav: den skal få plass i én skjermhøyde i artikkelspalta på
// en Chromebook (1366x768), der spalta er ca. 712 px bred. Svg-en skalerer med
// bredden, så høyere viewBox = høyere figur.
const VB_W = 640;
const VB_H = 200;
const PAD_X = 40;
const Y_PRINSIPP = 64;
const Y_PRAKSIS = 156;

export function RolleneOverTid({
    title = 'Rollene over tid',
    intro = 'Øvre spor er hva læren sier. Nedre spor er hva som faktisk skjedde. Velg en tradisjon og se avstanden.',
    note,
    principleLabel = 'Prinsippet',
    practiceLabel = 'Praksis',
    traditions = [],
    defaultTradition,
}: RolleneOverTidProps) {
    const [aktivId, setAktivId] = useState<string>(
        defaultTradition ?? traditions[0]?.id ?? ''
    );

    const aktiv = useMemo(
        () => traditions.find((t) => t.id === aktivId) ?? traditions[0],
        [traditions, aktivId]
    );

    const sortert = useMemo(
        () => (aktiv ? [...aktiv.events].sort((a, b) => a.year - b.year) : []),
        [aktiv]
    );

    const [valgtId, setValgtId] = useState<string>('');

    const valgt = useMemo(
        () => sortert.find((e) => e.id === valgtId) ?? sortert[0],
        [sortert, valgtId]
    );

    if (!traditions.length || !aktiv || !sortert.length || !valgt) return null;

    const bredde = VB_W - 2 * PAD_X;
    const xAt = (i: number) =>
        sortert.length === 1 ? PAD_X + bredde / 2 : PAD_X + (i / (sortert.length - 1)) * bredde;
    const yAt = (spor: Spor) => (spor === 'prinsipp' ? Y_PRINSIPP : Y_PRAKSIS);
    const indeks = new Map(sortert.map((e, i) => [e.id, i]));

    const koblinger = sortert
        .filter((e) => e.linkTo && indeks.has(e.linkTo))
        .map((e) => {
            const til = sortert[indeks.get(e.linkTo as string) as number];
            return {
                id: `${e.id}-${til.id}`,
                x1: xAt(indeks.get(e.id) as number),
                y1: yAt(e.track),
                x2: xAt(indeks.get(til.id) as number),
                y2: yAt(til.track),
                label: e.linkLabel ?? '',
            };
        });

    const velg = (id: string) => setValgtId(id);

    return (
        <figure className="my-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <figcaption className="mb-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                    <History className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{intro}</p>
            </figcaption>

            <div className="mb-2 flex flex-wrap gap-2">
                {traditions.map((t) => {
                    const valgtTradisjon = t.id === aktiv.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                                setAktivId(t.id);
                                setValgtId('');
                            }}
                            aria-pressed={valgtTradisjon}
                            className="rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
                            style={
                                valgtTradisjon
                                    ? {
                                          backgroundColor: t.color,
                                          borderColor: t.color,
                                          color: '#fff',
                                      }
                                    : { borderColor: '#cbd5e1', color: '#334155' }
                            }
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>

            {aktiv.summary && (
                <p className="mb-2 text-sm font-semibold text-slate-700">{aktiv.summary}</p>
            )}

            <div className="rounded-lg bg-slate-50 p-2">
                <svg
                    viewBox={`0 0 ${VB_W} ${VB_H}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label={`Tidslinje i to spor for ${aktiv.name}`}
                >
                    <text x={PAD_X} y={28} fontSize="12" fontWeight="700" fill="#94a3b8">
                        {principleLabel.toUpperCase()}
                    </text>
                    <text x={PAD_X} y={128} fontSize="12" fontWeight="700" fill="#94a3b8">
                        {practiceLabel.toUpperCase()}
                    </text>

                    <line
                        x1={PAD_X - 12}
                        y1={Y_PRINSIPP}
                        x2={VB_W - PAD_X + 12}
                        y2={Y_PRINSIPP}
                        stroke="#e2e8f0"
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                    <line
                        x1={PAD_X - 12}
                        y1={Y_PRAKSIS}
                        x2={VB_W - PAD_X + 12}
                        y2={Y_PRAKSIS}
                        stroke="#e2e8f0"
                        strokeWidth={3}
                        strokeLinecap="round"
                    />

                    <AnimatePresence mode="wait">
                        <motion.g
                            key={aktiv.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            {koblinger.map((k) => (
                                <g key={k.id}>
                                    {/* opacity settes også som attributt, ellers tegnes streken
                                        i full styrke i første bilde før framer motion overtar. */}
                                    <motion.line
                                        x1={k.x1}
                                        y1={k.y1}
                                        x2={k.x2}
                                        y2={k.y2}
                                        stroke={aktiv.color}
                                        strokeWidth={2}
                                        strokeDasharray="6 5"
                                        opacity={0}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.7 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    />
                                    {k.label && (
                                        <motion.g
                                            opacity={0}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3, delay: 0.55 }}
                                        >
                                            <rect
                                                x={(k.x1 + k.x2) / 2 - 34}
                                                y={(k.y1 + k.y2) / 2 - 12}
                                                width={68}
                                                height={22}
                                                rx={11}
                                                fill="#ffffff"
                                                stroke={aktiv.color}
                                                strokeWidth={1.5}
                                            />
                                            <text
                                                x={(k.x1 + k.x2) / 2}
                                                y={(k.y1 + k.y2) / 2 + 3}
                                                textAnchor="middle"
                                                fontSize="12"
                                                fontWeight="700"
                                                fill={aktiv.color}
                                            >
                                                {k.label}
                                            </text>
                                        </motion.g>
                                    )}
                                </g>
                            ))}

                            {sortert.map((e, i) => {
                                const cx = xAt(i);
                                const cy = yAt(e.track);
                                const erValgt = e.id === valgt.id;
                                return (
                                    <motion.g
                                        key={e.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`${e.displayYear}: ${e.short}`}
                                        onClick={() => velg(e.id)}
                                        onKeyDown={(ev) => {
                                            if (ev.key === 'Enter' || ev.key === ' ') {
                                                ev.preventDefault();
                                                velg(e.id);
                                            }
                                        }}
                                        className="cursor-pointer focus:outline-none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                                        opacity={0}
                                    >
                                        {erValgt && (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={13}
                                                fill={aktiv.color}
                                                fillOpacity={0.22}
                                            />
                                        )}
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={erValgt ? 8 : 6}
                                            fill={erValgt ? aktiv.color : '#ffffff'}
                                            stroke={aktiv.color}
                                            strokeWidth={2.5}
                                        />
                                        <text
                                            x={cx}
                                            y={cy + 26}
                                            textAnchor="middle"
                                            fontSize="12"
                                            fontWeight={erValgt ? 700 : 500}
                                            fill={erValgt ? '#0f172a' : '#64748b'}
                                        >
                                            {e.displayYear}
                                        </text>
                                    </motion.g>
                                );
                            })}
                        </motion.g>
                    </AnimatePresence>
                </svg>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${aktiv.id}-${valgt.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="mt-3 min-h-[104px] rounded-xl border border-slate-200 bg-white p-3"
                    style={{ borderLeftColor: aktiv.color, borderLeftWidth: 4 }}
                >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        {valgt.track === 'prinsipp' ? (
                            <BookMarked className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        ) : (
                            <Footprints className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        )}
                        <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
                            style={{ backgroundColor: aktiv.color }}
                        >
                            {valgt.track === 'prinsipp' ? principleLabel : practiceLabel}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                            {valgt.displayYear}: {valgt.short}
                        </span>
                    </div>
                    <p className="text-sm leading-snug text-slate-700">{valgt.text}</p>
                    {valgt.source && (
                        <p className="mt-1 text-xs text-slate-500">Kilde: {valgt.source}</p>
                    )}
                </motion.div>
            </AnimatePresence>

            {note && <p className="mt-3 text-xs italic text-slate-500">{note}</p>}
        </figure>
    );
}
