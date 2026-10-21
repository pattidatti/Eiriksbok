import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tidslinja: årene fra kongemakt til republikk og tilbake. En lang akse med årstall,
 * der hver beat setter et nytt merke (en hendelse) eller et bånd (en periode). Det nyeste
 * merket lyser, de eldre dempes. Kortet til hvert merke står på en av tre høyder (`niva`),
 * så merker som ligger tett, ikke dekker hverandre.
 */

interface Steg {
    fraBeat: number;
    /** Et senere steg med samme id erstatter kortet i stedet for å legge til et nytt. */
    id?: string;
    /** Årstall. Desimaler gir måned (1653.3 = april 1653). */
    ar: number;
    /** Er den satt, blir merket et bånd fra `ar` til `tilAr`. */
    tilAr?: number;
    /** Årstallet slik det står på kortet, f.eks. «April 1653». */
    dato: string;
    tittel: string;
    tekst?: string;
    farge?: string;
    /** Høyden på kortet over aksen: 0 (lavest) til 2. */
    niva?: number;
    /** Kortet peker på perioden, ikke på et bestemt år: ingen prikk på aksen. */
    utenPunkt?: boolean;
    /** Stiplet bånd og spørsmålstegn: noe som ennå ikke har skjedd. */
    usikker?: boolean;
}

interface Props {
    fra: number;
    til: number;
    /** Avstand mellom årstallene under aksen. */
    hvert?: number;
    steg: Steg[];
}

const B = 1600;
const VENSTRE = 110;
const HOYRE = 1490;
const AKSE_Y = 700;
const NIVA_Y = [560, 400, 240];

/** Kortbredde ut fra den lengste linja (grovt anslag av tegnbredden). */
function kortBredde(s: Steg) {
    return (
        Math.max(280, s.dato.length * 20, s.tittel.length * 25, (s.tekst ?? '').length * 17) + 56
    );
}

export function BorgerkrigenTidslinje({ beat, props }: VisualProps<Props>) {
    const { fra, til, steg } = props;
    const hvert = props.hvert ?? 5;
    const x = (ar: number) => VENSTRE + ((ar - fra) / (til - fra)) * (HOYRE - VENSTRE);
    const synlige: Steg[] = [];
    for (const s of steg.filter((s) => s.fraBeat <= beat)) {
        const i = s.id ? synlige.findIndex((t) => t.id === s.id) : -1;
        if (i >= 0) synlige.splice(i, 1);
        synlige.push(s);
    }
    const nyeste = synlige.length ? synlige[synlige.length - 1] : null;

    const ar: number[] = [];
    for (let a = Math.ceil(fra / hvert) * hvert; a <= til; a += hvert) ar.push(a);

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-amber-50 to-stone-200 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} 900`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Aksen */}
                <line
                    x1={VENSTRE - 40}
                    y1={AKSE_Y}
                    x2={HOYRE + 40}
                    y2={AKSE_Y}
                    stroke="#44403c"
                    strokeWidth={8}
                    strokeLinecap="round"
                />
                {ar.map((a) => (
                    <g key={a}>
                        <line
                            x1={x(a)}
                            y1={AKSE_Y - 14}
                            x2={x(a)}
                            y2={AKSE_Y + 14}
                            stroke="#44403c"
                            strokeWidth={5}
                        />
                        <text
                            x={x(a)}
                            y={AKSE_Y + 64}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={800}
                            fill="#57534e"
                        >
                            {a}
                        </text>
                    </g>
                ))}

                {/* Bånd og merker */}
                {synlige.map((s) => {
                    const aktiv = s === nyeste;
                    const farge = s.farge ?? '#7e22ce';
                    const x0 = x(s.ar);
                    const kortY = NIVA_Y[s.niva ?? 0];
                    const kortB = kortBredde(s);
                    const kortX = Math.min(Math.max(x0 - 30, 20), B - kortB - 20);
                    return (
                        <motion.g
                            key={s.id ?? `${s.ar}-${s.tittel}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: aktiv ? 1 : 0.62 }}
                            transition={{ duration: 0.7 }}
                        >
                            {s.tilAr !== undefined && (
                                <motion.rect
                                    x={x0}
                                    y={AKSE_Y - 22}
                                    height={44}
                                    rx={22}
                                    fill={farge}
                                    fillOpacity={s.usikker ? 0.25 : 0.85}
                                    stroke={farge}
                                    strokeWidth={4}
                                    strokeDasharray={s.usikker ? '16 12' : undefined}
                                    initial={{ width: 0 }}
                                    animate={{ width: x(s.tilAr) - x0 }}
                                    transition={{ duration: 1.6, ease: 'easeOut' }}
                                />
                            )}
                            {!s.utenPunkt && (
                                <line
                                    x1={x0}
                                    y1={kortY + 70}
                                    x2={x0}
                                    y2={AKSE_Y}
                                    stroke={farge}
                                    strokeWidth={4}
                                    strokeDasharray="6 8"
                                />
                            )}
                            {!s.utenPunkt && (
                                <circle
                                    cx={x0}
                                    cy={AKSE_Y}
                                    r={aktiv ? 20 : 15}
                                    fill={farge}
                                    stroke="#fff"
                                    strokeWidth={5}
                                />
                            )}
                            <rect
                                x={kortX}
                                y={kortY - 70}
                                width={kortB}
                                height={s.tekst ? 150 : 112}
                                rx={18}
                                fill="#fff"
                                fillOpacity={0.95}
                                stroke={farge}
                                strokeWidth={aktiv ? 6 : 3}
                            />
                            <text
                                x={kortX + 24}
                                y={kortY - 26}
                                fontSize={34}
                                fontWeight={800}
                                fill={farge}
                            >
                                {s.dato}
                            </text>
                            <text
                                x={kortX + 24}
                                y={kortY + 18}
                                fontSize={42}
                                fontWeight={900}
                                fill="#1c1917"
                            >
                                {s.tittel}
                            </text>
                            {s.tekst && (
                                <text
                                    x={kortX + 24}
                                    y={kortY + 60}
                                    fontSize={30}
                                    fontWeight={600}
                                    fill="#292524"
                                >
                                    {s.tekst}
                                </text>
                            )}
                        </motion.g>
                    );
                })}
            </svg>

            <AnimatePresence>
                {nyeste?.usikker && (
                    <motion.div
                        key="sporsmal"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="absolute font-black text-stone-700"
                        style={{ right: '7%', top: '12%', fontSize: '7rem', lineHeight: 1 }}
                    >
                        ?
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
