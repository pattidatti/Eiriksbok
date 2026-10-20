import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tre lag oppå hverandre: motivet nederst (det du ser), temaet i midten (det det betyr) og
 * budskapet øverst (det forfatteren vil si). Laget stemmen snakker om lyser opp, og
 * eksemplene legger seg inn i laget sitt som brikker.
 */

type Lag = 'motiv' | 'tema' | 'budskap';
type Modus = 'oversikt' | 'krig' | 'obstfelder';

interface Steg {
    aktiv: Lag | null;
    motiv: string[];
    tema: string[];
    budskap: string[];
    /** Spørsmålet laget svarer på, under lagene. */
    sporsmal?: string;
}

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

const LAG: { id: Lag; navn: string; hint: string; y: number; farge: string; lys: string }[] = [
    {
        id: 'budskap',
        navn: 'Budskap',
        hint: 'hva forfatteren vil si',
        y: 110,
        farge: '#b45309',
        lys: '#fef3c7',
    },
    { id: 'tema', navn: 'Tema', hint: 'hva det betyr', y: 330, farge: '#7c3aed', lys: '#ede9fe' },
    { id: 'motiv', navn: 'Motiv', hint: 'det som skjer', y: 550, farge: '#0f766e', lys: '#ccfbf1' },
];
const HOYDE = 196;

const STEG: Record<Modus, Steg[]> = {
    oversikt: [
        { aktiv: null, motiv: [], tema: [], budskap: [] },
        {
            aktiv: 'motiv',
            motiv: ['Det du kan se og ta på'],
            tema: [],
            budskap: [],
            sporsmal: 'Hva skjer?',
        },
        {
            aktiv: 'tema',
            motiv: ['Det du kan se og ta på'],
            tema: ['Det teksten handler om, på et dypere plan'],
            budskap: [],
            sporsmal: 'Hva handler det om?',
        },
        {
            aktiv: 'budskap',
            motiv: ['Det du kan se og ta på'],
            tema: ['Det teksten handler om, på et dypere plan'],
            budskap: ['Det forfatteren vil fortelle deg'],
            sporsmal: 'Hva vil forfatteren si?',
        },
    ],
    krig: [
        { aktiv: null, motiv: [], tema: ['?'], budskap: ['?'] },
        {
            aktiv: 'tema',
            motiv: [],
            tema: ['?'],
            budskap: ['?'],
            sporsmal: 'Hva handler teksten om?',
        },
        {
            aktiv: 'budskap',
            motiv: [],
            tema: ['?'],
            budskap: ['?'],
            sporsmal: 'Hva vil forfatteren fortelle oss om det?',
        },
        { aktiv: 'budskap', motiv: [], tema: ['Krig'], budskap: ['Krig er meningsløst'] },
        {
            aktiv: 'budskap',
            motiv: [],
            tema: ['Krig'],
            budskap: ['Krig er meningsløst', 'Vi må kjempe for fred'],
            sporsmal: 'Samme tema, to budskap',
        },
    ],
    obstfelder: [
        {
            aktiv: 'motiv',
            motiv: ['En mann ser på byen'],
            tema: [],
            budskap: [],
            sporsmal: 'Jeg ser, jeg ser: han er ikke med',
        },
        {
            aktiv: 'tema',
            motiv: ['En mann ser på byen'],
            tema: ['Utenforskap', 'Fremmedgjøring'],
            budskap: [],
        },
        {
            aktiv: 'tema',
            motiv: ['En mann ser på byen'],
            tema: ['Utenforskap', 'Fremmedgjøring', 'Alene blant tusenvis'],
            budskap: [],
        },
        {
            aktiv: 'budskap',
            motiv: ['En mann ser på byen'],
            tema: ['Utenforskap', 'Fremmedgjøring', 'Alene blant tusenvis'],
            budskap: ['Mennesket har mistet sin plass'],
            sporsmal: 'Én tolkning',
        },
        {
            aktiv: 'budskap',
            motiv: ['En mann ser på byen'],
            tema: ['Utenforskap', 'Fremmedgjøring', 'Alene blant tusenvis'],
            budskap: ['Mennesket har mistet sin plass', 'Hvor er vi hjemme?'],
            sporsmal: 'Én tolkning',
        },
    ],
};

const BRIKKE_FONT = 40;
const breddeFor = (tekst: string) => tekst.length * BRIKKE_FONT * 0.56 + 64;
/** Plassen til brikkene til høyre for navnet på laget. */
const PLASS = 1040;

function Brikker({
    tekster,
    y,
    farge,
    aktiv,
}: {
    tekster: string[];
    y: number;
    farge: string;
    aktiv: boolean;
}) {
    // Brikkene krymper sammen når de ikke får plass på én linje.
    const rå = tekster.map(breddeFor);
    const råTotal = rå.reduce((a, b) => a + b, 0) + 28 * Math.max(0, tekster.length - 1);
    const skala = Math.min(1, PLASS / råTotal);
    const gap = 28 * skala;
    const bredder = rå.map((b) => b * skala);
    const total = råTotal * skala;
    const start = 1010 - total / 2;
    const xer = bredder.map((_, i) => start + bredder.slice(0, i).reduce((a, b) => a + b + gap, 0));
    return (
        <g>
            {tekster.map((t, i) => {
                const b = bredder[i];
                const x0 = xer[i];
                return (
                    <motion.g
                        key={`${t}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.15 + i * 0.35 }}
                    >
                        <rect
                            x={x0}
                            y={y + HOYDE / 2 - 38}
                            width={b}
                            height={76}
                            rx={38}
                            fill={aktiv ? farge : '#ffffff'}
                            stroke={farge}
                            strokeWidth={3}
                        />
                        <text
                            x={x0 + b / 2}
                            y={y + HOYDE / 2 + 12}
                            textAnchor="middle"
                            fontSize={BRIKKE_FONT * skala}
                            fontWeight={700}
                            fill={aktiv ? '#ffffff' : farge}
                            style={FONT}
                        >
                            {t}
                        </text>
                    </motion.g>
                );
            })}
        </g>
    );
}

export function TemaLagene({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'oversikt';
    const steg = STEG[modus][Math.min(beat, STEG[modus].length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f5f3ee' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {/* Pil fra konkret til abstrakt */}
                <line x1={64} y1={730} x2={64} y2={140} stroke="#94a3b8" strokeWidth={6} />
                <polygon points="64,112 46,146 82,146" fill="#94a3b8" />
                {LAG.map((l) => {
                    const aktiv = steg.aktiv === l.id;
                    const brukt = steg[l.id].length > 0;
                    const dempet = !aktiv && !brukt && steg.aktiv !== null;
                    return (
                        <g key={l.id}>
                            <motion.rect
                                x={110}
                                y={l.y}
                                width={1440}
                                height={HOYDE}
                                rx={30}
                                initial={false}
                                animate={{
                                    fill: aktiv ? l.lys : '#ffffff',
                                    opacity: dempet ? 0.45 : 1,
                                }}
                                stroke={aktiv ? l.farge : '#e2ddd2'}
                                strokeWidth={aktiv ? 6 : 3}
                                transition={{ duration: 0.5 }}
                            />
                            <text
                                x={150}
                                y={l.y + 92}
                                fontSize={58}
                                fontWeight={900}
                                fill={l.farge}
                                opacity={dempet ? 0.45 : 1}
                                style={FONT}
                            >
                                {l.navn}
                            </text>
                            <text
                                x={152}
                                y={l.y + 140}
                                fontSize={34}
                                fontWeight={600}
                                fill="#64748b"
                                opacity={dempet ? 0.45 : 1}
                                style={FONT}
                            >
                                {l.hint}
                            </text>
                            <Brikker tekster={steg[l.id]} y={l.y} farge={l.farge} aktiv={aktiv} />
                        </g>
                    );
                })}
            </svg>
            <AnimatePresence mode="wait">
                {steg.sporsmal && (
                    <motion.div
                        key={steg.sporsmal}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-slate-900 text-white font-display font-bold text-2xl md:text-3xl shadow-xl whitespace-nowrap"
                        style={{ bottom: '3%' }}
                    >
                        {steg.sporsmal}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
