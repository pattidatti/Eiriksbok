import { useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Flag, Footprints, MapPin, Users } from 'lucide-react';
import { useAtlasWorld } from '../../atlas/useAtlasWorld';

// Pilegrimskartet: verdenskart med pilegrimsmål og noen av rutene dit.
//
// Lyspære-øyeblikket eleven skal få: målene ligger spredt fra Atlanterhavskysten
// til Ganges, og reglene rundt dem er helt ulike - noen steder er reisen en plikt,
// andre steder finnes den ikke i det hele tatt. Men bevegelsen er den samme:
// mennesker som forlater hverdagen for å komme nær noe.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface PilegrimsRute {
    fromLat: number;
    fromLng: number;
    fromLabel?: string;
    text?: string;
}

interface PilegrimsMaal {
    id: string;
    name: string;
    /** Kortnavn brukt som etikett på kartet. Faller tilbake til name. */
    short?: string;
    tradition?: string;
    color: string;
    lat: number;
    lng: number;
    /** Flytt selve prikken litt (i viewBox-piksler) når to mål ligger for tett.
     *  Da tegnes en tynn hjelpestrek tilbake til det virkelige punktet. */
    offsetX?: number;
    offsetY?: number;
    labelDx?: number;
    labelDy?: number;
    labelAnchor?: 'start' | 'middle' | 'end';
    who?: string;
    count?: string;
    duty?: string;
    dutyKind?: 'plikt' | 'frivillig' | 'ingen';
    arrival?: string;
    route?: PilegrimsRute;
}

interface PilegrimsKartetProps {
    title?: string;
    intro?: string;
    note?: string;
    whoLabel?: string;
    countLabel?: string;
    arrivalLabel?: string;
    destinations?: PilegrimsMaal[];
    defaultDestination?: string;
}

// Kartet er bevisst lavt. Artikkelspalta er ca. 712 px bred på en Chromebook
// (1366x768), så svg-en tegnes ned til rundt 650 px. Da blir 660x286 i viewBox
// til ca. 282 px på skjermen, og hele figuren holder seg under 700 px.
// Detaljene om hvert mål står KUN i panelet under kartet, aldri som merkelapper
// på pinnene også - det er den vanligste grunnen til at slike figurer sprenger
// høydebudsjettet.
const VB_W = 660;
const VB_H = 286;
const SCALE = 150;
const ROTATE_LNG = -30;
const CENTER_X = 330;
const CENTER_Y = 196;

const OCEAN = '#eaf2fb';
const LAND = '#dde5ee';
const LAND_STROKE = '#c2cedd';

const DUTY_STYLE: Record<string, { bg: string; text: string }> = {
    plikt: { bg: '#fef3c7', text: '#92400e' },
    frivillig: { bg: '#dcfce7', text: '#166534' },
    ingen: { bg: '#e2e8f0', text: '#334155' },
};

export function PilegrimsKartet({
    title = 'Pilegrimskartet',
    intro = 'Trykk på et mål og se hvem som reiser dit, og hva som skjer når de kommer fram.',
    note,
    whoLabel = 'Hvem reiser dit',
    countLabel = 'Hvor mange i året',
    arrivalLabel = 'Når du kommer fram',
    destinations = [],
    defaultDestination,
}: PilegrimsKartetProps) {
    const [aktivId, setAktivId] = useState<string>(
        defaultDestination ?? destinations[0]?.id ?? ''
    );
    const { geographies, error } = useAtlasWorld();

    const projection = useMemo(
        () =>
            geoNaturalEarth1()
                .rotate([ROTATE_LNG, 0])
                .scale(SCALE)
                .translate([CENTER_X, CENTER_Y]),
        []
    );
    const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

    const landPaths = useMemo(
        () =>
            geographies
                .map((geo, i) => ({ key: `land-${i}`, d: pathGenerator(geo as never) }))
                .filter((p): p is { key: string; d: string } => Boolean(p.d)),
        [geographies, pathGenerator]
    );

    const aktiv = useMemo(
        () => destinations.find((d) => d.id === aktivId) ?? destinations[0],
        [destinations, aktivId]
    );

    if (!destinations.length || !aktiv) return null;

    const punkt = (lng: number, lat: number) => projection([lng, lat]) ?? [0, 0];

    const ruter = destinations
        .filter((d) => d.route)
        .map((d) => {
            const linje = {
                type: 'LineString',
                coordinates: [
                    [d.route!.fromLng, d.route!.fromLat],
                    [d.lng, d.lat],
                ],
            };
            return { id: d.id, color: d.color, d: pathGenerator(linje as never) ?? '' };
        })
        .filter((r) => r.d);

    const duty = DUTY_STYLE[aktiv.dutyKind ?? 'frivillig'] ?? DUTY_STYLE.frivillig;

    return (
        <figure className="my-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <figcaption className="mb-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                    <Footprints className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-snug text-slate-600">{intro}</p>
            </figcaption>

            <div className="mb-2 flex flex-wrap gap-1.5">
                {destinations.map((d) => {
                    const valgt = d.id === aktiv.id;
                    return (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => setAktivId(d.id)}
                            aria-pressed={valgt}
                            className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
                            style={
                                valgt
                                    ? { backgroundColor: d.color, borderColor: d.color, color: '#fff' }
                                    : { borderColor: '#cbd5e1', color: '#334155' }
                            }
                        >
                            {d.name}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-lg bg-slate-50 p-1.5">
                <svg
                    viewBox={`0 0 ${VB_W} ${VB_H}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label={`Verdenskart med pilegrimsmål. Valgt mål: ${aktiv.name}.`}
                >
                    <rect x={0} y={0} width={VB_W} height={VB_H} fill={OCEAN} rx={6} />

                    {landPaths.map((p) => (
                        <path
                            key={p.key}
                            d={p.d}
                            fill={LAND}
                            stroke={LAND_STROKE}
                            strokeWidth={0.4}
                        />
                    ))}

                    {!landPaths.length && (
                        <text
                            x={VB_W / 2}
                            y={20}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#64748b"
                        >
                            {error ? 'Kartgrunnlaget kunne ikke lastes.' : 'Laster kart …'}
                        </text>
                    )}

                    {ruter.map((r) => (
                        <motion.path
                            key={`rute-${r.id}`}
                            d={r.d}
                            fill="none"
                            stroke={r.color}
                            strokeWidth={r.id === aktiv.id ? 2.4 : 1.2}
                            strokeLinecap="round"
                            opacity={0}
                            pathLength={1}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: r.id === aktiv.id ? 0.95 : 0.35 }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                        />
                    ))}

                    {destinations.map((d, i) => {
                        const [tx, ty] = punkt(d.lng, d.lat);
                        const cx = tx + (d.offsetX ?? 0);
                        const cy = ty + (d.offsetY ?? 0);
                        const flyttet = cx !== tx || cy !== ty;
                        const valgt = d.id === aktiv.id;
                        return (
                            <motion.g
                                key={d.id}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
                                style={{ originX: `${cx}px`, originY: `${cy}px` }}
                                onClick={() => setAktivId(d.id)}
                                className="cursor-pointer"
                            >
                                {flyttet && (
                                    <line
                                        x1={tx}
                                        y1={ty}
                                        x2={cx}
                                        y2={cy}
                                        stroke={d.color}
                                        strokeWidth={0.9}
                                        strokeDasharray="2 2"
                                        opacity={0.7}
                                    />
                                )}
                                {valgt && (
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={9.5}
                                        fill={d.color}
                                        fillOpacity={0.22}
                                    />
                                )}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={valgt ? 5.2 : 3.4}
                                    fill={d.color}
                                    stroke="#ffffff"
                                    strokeWidth={1.2}
                                />
                                <text
                                    x={cx + (d.labelDx ?? 8)}
                                    y={cy + (d.labelDy ?? 3)}
                                    textAnchor={d.labelAnchor ?? 'start'}
                                    fontSize="11"
                                    fontWeight={valgt ? 700 : 500}
                                    fill={valgt ? '#0f172a' : '#475569'}
                                    stroke="#ffffff"
                                    strokeWidth={2.6}
                                    paintOrder="stroke"
                                >
                                    {d.short ?? d.name}
                                </text>
                            </motion.g>
                        );
                    })}
                </svg>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={aktiv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="mt-3 rounded-xl border border-slate-200 bg-white p-3"
                    style={{ borderLeftColor: aktiv.color, borderLeftWidth: 4 }}
                >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <MapPin className="h-4 w-4" style={{ color: aktiv.color }} aria-hidden="true" />
                        <span className="text-sm font-bold text-slate-900">{aktiv.name}</span>
                        {aktiv.tradition && (
                            <span className="text-xs text-slate-500">{aktiv.tradition}</span>
                        )}
                        {aktiv.duty && (
                            <span
                                className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                style={{ backgroundColor: duty.bg, color: duty.text }}
                            >
                                {aktiv.duty}
                            </span>
                        )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        {aktiv.who && (
                            <p className="text-sm leading-snug text-slate-700">
                                <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                    {whoLabel}:
                                </span>
                                {aktiv.who}
                            </p>
                        )}
                        {aktiv.count && (
                            <p className="text-sm leading-snug text-slate-700">
                                <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                                    {countLabel}:
                                </span>
                                {aktiv.count}
                            </p>
                        )}
                    </div>

                    {aktiv.arrival && (
                        <p className="mt-2 text-sm leading-snug text-slate-700">
                            <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                                {arrivalLabel}:
                            </span>
                            {aktiv.arrival}
                        </p>
                    )}

                    {aktiv.route?.text && (
                        <p className="mt-2 text-xs italic text-slate-500">{aktiv.route.text}</p>
                    )}
                </motion.div>
            </AnimatePresence>

            {note && <p className="mt-3 text-xs italic text-slate-500">{note}</p>}
        </figure>
    );
}
