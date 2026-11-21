import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { B, FARGE, H, Kort, Overskrift, Person, Pil, Tekst, Vis } from './felles';

/**
 * Trapper i to moduser:
 * - `grader`: hvem som var med i Mithras-kulten, og de sju gradene fra Corax til Pater.
 * - `roma`: Kybele i Roma. En tidslinje (204 fvt., 191 fvt., Claudius) og trappa Roma
 *   pleide å gå: kjempet mot, lot være, gjorde til sitt eget.
 */

type Modus = 'grader' | 'roma';

const OVERSKRIFT: Record<Modus, string[]> = {
    grader: [
        'Mithras-kulten: bare for menn',
        'Soldater, slaver og frigitte',
        'Etter hvert også rike romere',
        'Sju grader: nederst Corax, ravnen',
        'Øverst Pater, faren',
    ],
    roma: [
        'Kybele kommer til Roma',
        'Spådomsbøkene: byen mangler Moren',
        'Et tempel i Roma',
        'Motarbeidet lenge',
        'Godkjent under keiser Claudius',
        'Slik gjorde Roma ofte',
    ],
};

/** Trappetrinn fra venstre og opp mot høyre. */
function trinnBoks(i: number, antall: number, x0: number, y0: number, b: number, h: number) {
    const tb = b / antall;
    const th = h / antall;
    return { x: x0 + i * tb, y: y0 - (i + 1) * th, b: tb, h: (i + 1) * th };
}

function Grader({ beat }: { beat: number }) {
    const folk = [
        { navn: 'Soldat', farge: '#991b1b', fra: 1 },
        { navn: 'Slave', farge: '#92400e', fra: 1 },
        { navn: 'Frigitt', farge: '#0f766e', fra: 1 },
        { navn: 'Rik romer', farge: '#7c3aed', fra: 2 },
    ];
    const trapp = beat >= 3;
    return (
        <>
            <svg width={1000} height={562} viewBox={`0 0 ${B} ${H}`} className="absolute inset-0">
                <rect x={0} y={820} width={B} height={80} fill="#4a3826" />
                {/* Mennene, før trappa kommer */}
                {beat === 0 &&
                    [0, 1, 2, 3].map((i) => (
                        <Person key={i} x={260 + i * 210} y={800} farge="#57534e" skala={1.3} />
                    ))}
                {beat === 0 && (
                    <g>
                        <g opacity={0.35}>
                            <Person x={1250} y={800} farge="#be185d" skala={1.3} />
                        </g>
                        <circle
                            cx={1380}
                            cy={640}
                            r={40}
                            fill="#fff"
                            stroke={FARGE.rod}
                            strokeWidth={7}
                        />
                        <path
                            d="M 1360 620 L 1400 660 M 1400 620 L 1360 660"
                            stroke={FARGE.rod}
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                        <Tekst x={1250} y={580} storrelse={40}>
                            Kvinne
                        </Tekst>
                    </g>
                )}
                {beat >= 1 &&
                    !trapp &&
                    folk.map((f, i) => (
                        <Vis key={f.navn} synlig={beat >= f.fra}>
                            <Person x={320 + i * 300} y={800} farge={f.farge} skala={1.3} />
                            <Tekst x={320 + i * 300} y={580} storrelse={40}>
                                {f.navn}
                            </Tekst>
                        </Vis>
                    ))}
                {/* Sju trinn */}
                {trapp &&
                    Array.from({ length: 7 }, (_, i) => {
                        const t = trinnBoks(i, 7, 180, 820, 1240, 560);
                        const topp = i >= 5;
                        const fyll =
                            beat >= 4 && topp ? FARGE.gull : i === 0 ? FARGE.mysterie : '#a8a29e';
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.25 }}
                            >
                                <rect
                                    x={t.x}
                                    y={t.y}
                                    width={t.b}
                                    height={t.h}
                                    fill={fyll}
                                    stroke="#f3ecdf"
                                    strokeWidth={4}
                                />
                                <text
                                    x={t.x + t.b / 2}
                                    y={t.y + 56}
                                    textAnchor="middle"
                                    fontSize={44}
                                    fontWeight={900}
                                    fill="#ffffff"
                                >
                                    {i + 1}
                                </text>
                            </motion.g>
                        );
                    })}
                {trapp && (
                    <motion.g
                        initial={false}
                        animate={{ x: beat >= 4 ? 6 * (1240 / 7) : 0, y: beat >= 4 ? -6 * 80 : 0 }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                    >
                        <Person x={180 + 1240 / 14} y={820 - 80} farge="#b45309" skala={0.9} />
                    </motion.g>
                )}
            </svg>
            <Kort synlig={beat >= 3} venstre={40} topp={110} bredde={300} farge={FARGE.mysterie}>
                Grad 1: Corax, ravnen
            </Kort>
            <Kort synlig={beat >= 4} venstre={420} topp={115} bredde={220} farge={FARGE.gull}>
                Grad 7: Pater, faren
            </Kort>
            <Kort
                synlig={beat >= 4}
                venstre={40}
                topp={210}
                bredde={360}
                farge={FARGE.gull}
                storrelse={20}
            >
                Mange forskere mener: de øverste gradene var for lederne
            </Kort>
        </>
    );
}

function Roma({ beat }: { beat: number }) {
    const punkter = [
        { x: 260, ar: '204 fvt.', tekst: 'Kybele til Roma', fra: 0 },
        { x: 800, ar: '191 fvt.', tekst: 'Tempel i Roma', fra: 2 },
        { x: 1340, ar: 'år 41-54', tekst: 'Claudius godkjenner', fra: 4 },
    ];
    const trinn = [
        { tekst: 'Kjempet mot', fra: 3, farge: FARGE.rod },
        { tekst: 'Lot det være', fra: 4, farge: FARGE.gull },
        { tekst: 'Gjorde det til sitt eget', fra: 4, farge: FARGE.gronn },
    ];
    const kybeleTrinn = beat >= 4 ? 2 : beat >= 3 ? 0 : -1;
    return (
        <>
            <svg width={1000} height={562} viewBox={`0 0 ${B} ${H}`} className="absolute inset-0">
                {/* Tidslinje */}
                <line
                    x1={160}
                    y1={250}
                    x2={1440}
                    y2={250}
                    stroke={FARGE.gra}
                    strokeWidth={6}
                    strokeLinecap="round"
                />
                {punkter.map((pk) => (
                    <Vis key={pk.ar} synlig={beat >= pk.fra}>
                        <circle
                            cx={pk.x}
                            cy={250}
                            r={20}
                            fill={FARGE.mysterie}
                            stroke="#fff"
                            strokeWidth={5}
                        />
                        <Tekst x={pk.x} y={225 - 20} storrelse={40}>
                            {pk.ar}
                        </Tekst>
                        <Tekst x={pk.x} y={310} storrelse={34} farge={FARGE.mysterie}>
                            {pk.tekst}
                        </Tekst>
                    </Vis>
                ))}
                {/* Trappa */}
                {trinn.map((t, i) => {
                    const b = trinnBoks(i, 3, 220, 860, 1160, 420);
                    return (
                        <Vis key={t.tekst} synlig={beat >= t.fra}>
                            <rect
                                x={b.x}
                                y={b.y}
                                width={b.b}
                                height={b.h}
                                fill={t.farge}
                                stroke="#f3ecdf"
                                strokeWidth={5}
                            />
                        </Vis>
                    );
                })}
                {/* Kybele som en brikke på trappa */}
                <Vis synlig={kybeleTrinn >= 0}>
                    <motion.g
                        initial={false}
                        animate={{
                            x: Math.max(0, kybeleTrinn) * (1160 / 3),
                            y: -Math.max(0, kybeleTrinn) * 140,
                        }}
                        transition={{ duration: 1.6, ease: 'easeInOut' }}
                    >
                        <circle
                            cx={220 + 1160 / 6}
                            cy={860 - 140 - 56}
                            r={54}
                            fill={FARGE.mysterie}
                            stroke="#fff"
                            strokeWidth={6}
                        />
                        <text
                            x={220 + 1160 / 6}
                            y={860 - 140 - 47}
                            textAnchor="middle"
                            fontSize={26}
                            fontWeight={900}
                            fill="#fff"
                        >
                            Kybele
                        </text>
                    </motion.g>
                </Vis>
                <Pil
                    fra={[420, 680]}
                    til={[1100, 340]}
                    farge={FARGE.blekk}
                    synlig={beat >= 5}
                    bue={-0.12}
                    bredde={6}
                />
            </svg>
            {/* Navn på trinnene som DOM, under trinnets topp */}
            {trinn.map((t, i) => {
                const b = trinnBoks(i, 3, 220, 860, 1160, 420);
                return (
                    <Kort
                        key={t.tekst}
                        synlig={beat >= t.fra}
                        venstre={((b.x + 20) * 1000) / B}
                        topp={((b.y + 24) * 562) / H}
                        bredde={((b.b - 40) * 1000) / B}
                        farge={t.farge}
                        storrelse={20}
                    >
                        {t.tekst}
                    </Kort>
                );
            })}
            <Kort synlig={beat === 1} venstre={300} topp={220} bredde={400} farge={FARGE.mysterie}>
                Romerne søkte råd i gamle spådomsbøker. Svaret: byen manglet Moren.
            </Kort>
            <Kort synlig={beat === 2} venstre={300} topp={220} bredde={400} farge={FARGE.mysterie}>
                Prestene kom fra andre land og snakket gresk
            </Kort>
            <Kort synlig={beat === 0} venstre={300} topp={240} bredde={400} farge={FARGE.rod}>
                Midt i krigen mot Hannibal
            </Kort>
        </>
    );
}

export function MysterieTrapp({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'grader';
    const tekster = OVERSKRIFT[modus];
    return (
        <Flate bakgrunn={FARGE.bakgrunn}>
            {modus === 'grader' ? <Grader beat={beat} /> : <Roma beat={beat} />}
            <Overskrift tekst={tekster[Math.min(beat, tekster.length - 1)]} />
        </Flate>
    );
}
