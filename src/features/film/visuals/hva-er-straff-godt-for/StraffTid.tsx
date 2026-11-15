import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE } from './farger';
import { Figur, Kort, Overskrift, Pil, Svg } from './felles';

/**
 * Straff langs en tidslinje, i 2D.
 * «retning»: lovbruddet midt på linja. Ett svar ser bakover (betale), det andre framover
 * (færre lovbrudd). Til slutt de fire formålene på hver sin side.
 * «skremme»: en mengde folk (alle oss andre), og to målere: hvor streng straffen er, og hvor
 * stor sjansen er for å bli tatt.
 * «lengde»: muren mellom den dømte og folk utenfor, så en linjal fra 14 dager til 30 år og
 * forvaring som strekker seg videre.
 * «historie»: Norges svar fra slutten av 1800-tallet til den nye straffeloven i 2005.
 */

type Modus = 'retning' | 'skremme' | 'lengde' | 'historie';

const OVERSKRIFT: Record<Modus, string[]> = {
    retning: [
        'Staten tar noe fra deg',
        'Det krever en god grunn',
        'Gruppe 1: ser bakover',
        'Gruppe 2: ser framover',
        'Fire formål med straff',
    ],
    skremme: [
        'Formål 2: alle oss andre',
        'Allmennprevensjon',
        'Allmenn + prevensjon',
        'Sjansen for å bli tatt',
        'Streng straff, liten sjanse',
        'Rett og galt over tid',
    ],
    lengde: ['Formål 3: beskytte andre', 'Bak muren', 'Fra 14 dager til 30 år', 'Forvaring'],
    historie: [
        'Norge har prøvd ulike svar',
        'Slutten av 1800-tallet',
        'Midten av 1960-tallet',
        'Det snudde igjen',
        '2005: ny straffelov',
    ],
};

const LINJE_Y = 500;

function Mynter({ x, y }: { x: number; y: number }) {
    return (
        <g>
            {[0, 1, 2, 3].map((i) => (
                <ellipse
                    key={i}
                    cx={x}
                    cy={y - i * 20}
                    rx={58}
                    ry={18}
                    fill="#eab308"
                    stroke="#a16207"
                    strokeWidth={4}
                />
            ))}
        </g>
    );
}

function Klokke({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <circle cx={x} cy={y - 30} r={62} fill="#ffffff" stroke={FARGE.mork} strokeWidth={8} />
            <line
                x1={x}
                y1={y - 30}
                x2={x}
                y2={y - 78}
                stroke={FARGE.mork}
                strokeWidth={8}
                strokeLinecap="round"
            />
            <line
                x1={x}
                y1={y - 30}
                x2={x + 34}
                y2={y - 30}
                stroke={FARGE.mork}
                strokeWidth={8}
                strokeLinecap="round"
            />
        </g>
    );
}

function Gitter({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect
                x={x - 64}
                y={y - 100}
                width={128}
                height={130}
                rx={10}
                fill="#e2e8f0"
                stroke="#475569"
                strokeWidth={6}
            />
            {[-40, -13, 13, 40].map((d) => (
                <rect key={d} x={x + d - 5} y={y - 100} width={10} height={130} fill="#475569" />
            ))}
        </g>
    );
}

function Retning({ beat }: { beat: number }) {
    const midt = 800;
    return (
        <>
            <line
                x1={140}
                y1={LINJE_Y}
                x2={1460}
                y2={LINJE_Y}
                stroke="#cbd5e1"
                strokeWidth={10}
                strokeLinecap="round"
            />
            {/* Lovbruddet */}
            <circle cx={midt} cy={LINJE_Y} r={44} fill={FARGE.rod} />
            <text
                x={midt}
                y={LINJE_Y + 18}
                textAnchor="middle"
                fontSize={56}
                fontWeight={900}
                fill="#ffffff"
            >
                !
            </text>
            <Kort x={midt} y={LINJE_Y + 70} tittel="Lovbruddet" farge={FARGE.rod} str={36} />
            {beat <= 1 && (
                <motion.g animate={{ opacity: beat === 0 ? 1 : 0.35 }}>
                    <Mynter x={460} y={330} />
                    <Klokke x={800} y={320} />
                    <Gitter x={1140} y={330} />
                    {[
                        { x: 460, t: 'penger' },
                        { x: 800, t: 'tid' },
                        { x: 1140, t: 'friheten' },
                    ].map((k) => (
                        <text
                            key={k.t}
                            x={k.x}
                            y={410}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill={FARGE.mork}
                        >
                            {k.t}
                        </text>
                    ))}
                </motion.g>
            )}
            {beat === 1 && (
                <motion.text
                    x={midt}
                    y={760}
                    textAnchor="middle"
                    fontSize={150}
                    fontWeight={900}
                    fill={FARGE.bla}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    ?
                </motion.text>
            )}
            {beat >= 2 && (
                <>
                    <Pil
                        x1={midt - 70}
                        y1={LINJE_Y}
                        x2={200}
                        y2={LINJE_Y}
                        farge={FARGE.bakover}
                        bredde={16}
                    />
                    {beat <= 3 && (
                        <Kort
                            x={440}
                            y={280}
                            tittel="Ser bakover"
                            tekst="betale for det man gjorde"
                            farge={FARGE.bakover}
                        />
                    )}
                </>
            )}
            {beat >= 3 && (
                <>
                    <Pil
                        x1={midt + 70}
                        y1={LINJE_Y}
                        x2={1400}
                        y2={LINJE_Y}
                        farge={FARGE.framover}
                        bredde={16}
                    />
                    {beat === 3 && (
                        <Kort
                            x={1160}
                            y={280}
                            tittel="Ser framover"
                            tekst="færre lovbrudd"
                            farge={FARGE.framover}
                        />
                    )}
                </>
            )}
            {beat >= 4 && (
                <>
                    <Kort x={400} y={250} tittel="1  Betale" farge={FARGE.bakover} str={44} />
                    <Kort
                        x={1160}
                        y={170}
                        tittel="2  Skremme andre"
                        farge={FARGE.framover}
                        str={40}
                        forsinkelse={0.3}
                    />
                    <Kort
                        x={1160}
                        y={265}
                        tittel="3  Beskytte samfunnet"
                        farge={FARGE.framover}
                        str={40}
                        forsinkelse={0.6}
                    />
                    <Kort
                        x={1160}
                        y={360}
                        tittel="4  Tilbake på rett spor"
                        farge={FARGE.framover}
                        str={40}
                        forsinkelse={0.9}
                    />
                </>
            )}
        </>
    );
}

/** En tett mengde folk som ikke skal telles. */
const MENGDE = Array.from({ length: 34 }, (_, i) => {
    const rad = Math.floor(i / 12);
    const k = i % 12;
    return {
        x: 130 + k * 44 + (rad % 2) * 22,
        y: 640 + rad * 70,
        f: ['#2563eb', '#0d9488', '#b45309', '#7c3aed', '#475569'][(i * 7) % 5],
    };
});

function Maaler({
    y,
    tittel,
    andel,
    farge,
}: {
    y: number;
    tittel: string;
    andel: number;
    farge: string;
}) {
    const x = 860;
    const b = 600;
    return (
        <g>
            <text x={x} y={y - 22} fontSize={38} fontWeight={800} fill={FARGE.mork}>
                {tittel}
            </text>
            <rect x={x} y={y} width={b} height={56} rx={28} fill="#e2e8f0" />
            <motion.rect
                x={x}
                y={y}
                height={56}
                rx={28}
                fill={farge}
                initial={{ width: 0 }}
                animate={{ width: Math.max(56, b * andel) }}
                transition={{ duration: 1 }}
            />
        </g>
    );
}

function Skremme({ beat }: { beat: number }) {
    return (
        <>
            {/* Butikken med varene */}
            <motion.g animate={{ opacity: beat <= 2 ? 1 : 0.25 }}>
                <rect
                    x={150}
                    y={250}
                    width={480}
                    height={260}
                    rx={16}
                    fill="#fef3c7"
                    stroke="#a16207"
                    strokeWidth={6}
                />
                <rect x={150} y={220} width={480} height={50} rx={12} fill="#b45309" />
                {[0, 1, 2].map((r) =>
                    [0, 1, 2, 3, 4].map((k) => (
                        <rect
                            key={`${r}${k}`}
                            x={185 + k * 88}
                            y={300 + r * 66}
                            width={60}
                            height={44}
                            rx={6}
                            fill={
                                ['#f97316', '#22c55e', '#3b82f6', '#e11d48', '#a855f7'][(r + k) % 5]
                            }
                        />
                    ))
                )}
            </motion.g>
            {MENGDE.map((p, i) => (
                <motion.g key={i} animate={{ opacity: beat <= 2 || beat === 5 ? 1 : 0.35 }}>
                    <Figur x={p.x} y={p.y + 110} farge={p.f} s={0.5} />
                </motion.g>
            ))}
            {beat === 0 && (
                <Kort
                    x={1150}
                    y={330}
                    tittel="Ikke den som straffes"
                    tekst="men alle oss andre"
                    farge={FARGE.framover}
                />
            )}
            {beat === 1 && (
                <Kort
                    x={1150}
                    y={330}
                    tittel="Tyveri kan gi straff"
                    tekst="så mange lar være å stjele"
                    farge={FARGE.framover}
                />
            )}
            {beat === 2 && (
                <>
                    <Kort
                        x={1150}
                        y={250}
                        tittel="Allmenn"
                        tekst="det gjelder alle"
                        farge={FARGE.bla}
                    />
                    <Kort
                        x={1150}
                        y={430}
                        tittel="Prevensjon"
                        tekst="å hindre at noe skjer"
                        farge={FARGE.framover}
                        forsinkelse={0.3}
                    />
                </>
            )}
            {(beat === 3 || beat === 4) && (
                <>
                    <Maaler
                        y={300}
                        tittel="Hvor streng er straffen?"
                        andel={beat === 3 ? 0.55 : 1}
                        farge={FARGE.rod}
                    />
                    <Maaler
                        y={470}
                        tittel="Sjanse for å bli tatt?"
                        andel={beat === 3 ? 0.55 : 0.04}
                        farge={FARGE.bla}
                    />
                </>
            )}
            {beat === 4 && (
                <Kort
                    x={1160}
                    y={600}
                    tittel="Skremmer lite"
                    tekst="hvis ingen tror de blir oppdaget"
                    farge={FARGE.rod}
                    forsinkelse={0.8}
                />
            )}
            {beat === 5 && (
                <>
                    <Pil x1={760} y1={420} x2={1460} y2={420} farge={FARGE.gra} bredde={10} />
                    <text
                        x={1110}
                        y={480}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#64748b"
                    >
                        tiden går
                    </text>
                    <Kort
                        x={1110}
                        y={250}
                        tittel="Straff former"
                        tekst="hva folk synes er rett og galt"
                        farge={FARGE.lilla}
                    />
                </>
            )}
        </>
    );
}

function Mur({ x }: { x: number }) {
    return (
        <g>
            <rect x={x - 50} y={250} width={100} height={460} fill="#94a3b8" />
            {Array.from({ length: 11 }, (_, r) => (
                <line
                    key={r}
                    x1={x - 50}
                    y1={290 + r * 40}
                    x2={x + 50}
                    y2={290 + r * 40}
                    stroke="#64748b"
                    strokeWidth={3}
                />
            ))}
        </g>
    );
}

function Lengde({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <>
                <rect x={0} y={710} width={1600} height={190} fill="#cbd5e1" />
                <Mur x={760} />
                <Figur x={480} y={710} farge="#475569" s={1.3} />
                {[1060, 1210, 1360].map((x, i) => (
                    <Figur
                        key={x}
                        x={x}
                        y={710}
                        farge={['#2563eb', '#0d9488', '#b45309'][i]}
                        s={1.1}
                    />
                ))}
                <Kort x={480} y={760} tittel="Dømt" farge="#475569" str={36} />
                <Kort x={1210} y={760} tittel="Folk utenfor" farge={FARGE.framover} str={36} />
                {beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <path
                            d="M 1210 230 L 1300 265 L 1300 345 Q 1300 415 1210 450 Q 1120 415 1120 345 L 1120 265 Z"
                            fill={FARGE.framover}
                        />
                        <path
                            d="M 1165 340 L 1200 375 L 1260 300"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={16}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.g>
                )}
            </>
        );
    }
    const x0 = 200;
    const x30 = 1150;
    return (
        <>
            <rect x={x0} y={440} width={x30 - x0} height={80} rx={14} fill="#e2e8f0" />
            <motion.rect
                x={x0}
                y={440}
                height={80}
                rx={14}
                fill={FARGE.bla}
                initial={{ width: 10 }}
                animate={{ width: x30 - x0 }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            />
            <line x1={x0 + 2} y1={410} x2={x0 + 2} y2={550} stroke={FARGE.mork} strokeWidth={6} />
            <line x1={x30} y1={410} x2={x30} y2={550} stroke={FARGE.mork} strokeWidth={6} />
            <Kort x={x0 + 40} y={580} tittel="14 dager" farge={FARGE.mork} str={40} />
            <Kort x={x30} y={580} tittel="30 år" farge={FARGE.mork} str={40} />
            <Kort x={675} y={280} tittel="Fengselsstraff i Norge" farge={FARGE.bla} str={40} />
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <rect
                        x={x0}
                        y={700}
                        width={x30 - x0 - 40}
                        height={70}
                        rx={14}
                        fill={FARGE.lilla}
                    />
                    {[0, 1, 2, 3].map((i) => (
                        <rect
                            key={i}
                            x={x30 - 20 + i * 60}
                            y={710}
                            width={40}
                            height={50}
                            rx={8}
                            fill={FARGE.lilla}
                            opacity={0.8 - i * 0.18}
                        />
                    ))}
                    <Pil
                        x1={x30 + 220}
                        y1={735}
                        x2={x30 + 300}
                        y2={735}
                        farge={FARGE.lilla}
                        bredde={12}
                    />
                    <text x={x0 + 30} y={748} fontSize={40} fontWeight={800} fill="#ffffff">
                        Forvaring, i stedet
                    </text>
                    <text
                        x={x30 + 300}
                        y={830}
                        textAnchor="end"
                        fontSize={38}
                        fontWeight={800}
                        fill={FARGE.lilla}
                    >
                        så lenge faren er der
                    </text>
                </motion.g>
            )}
        </>
    );
}

/** Årene langs linja, i riktig avstand. */
const AAR_X = (aar: number) => 260 + (aar - 1890) * 9;

function Historie({ beat }: { beat: number }) {
    const punkter = [
        { aar: 1890, fra: 1, farge: FARGE.framover },
        { aar: 1965, fra: 2, farge: FARGE.bakover },
        { aar: 2005, fra: 4, farge: FARGE.bla },
    ];
    return (
        <>
            <motion.line
                x1={160}
                y1={LINJE_Y}
                x2={1480}
                y2={LINJE_Y}
                stroke="#94a3b8"
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
            />
            {punkter.map((p) => (
                <motion.circle
                    key={p.aar}
                    cx={AAR_X(p.aar)}
                    cy={LINJE_Y}
                    r={30}
                    animate={{ fill: beat >= p.fra ? p.farge : '#cbd5e1' }}
                    stroke="#ffffff"
                    strokeWidth={6}
                />
            ))}
            {beat === 0 &&
                ['1800-tallet', '1960-tallet', '2005'].map((t, i) => (
                    <text
                        key={t}
                        x={AAR_X([1890, 1965, 2005][i])}
                        y={LINJE_Y + 90}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#64748b"
                    >
                        {t}
                    </text>
                ))}
            {beat >= 1 && (
                <Kort
                    x={AAR_X(1890) + 60}
                    y={250}
                    tittel="Forbedre fangene"
                    tekst="slutten av 1800-tallet"
                    farge={FARGE.framover}
                />
            )}
            {beat >= 2 && (
                <Kort
                    x={AAR_X(1965)}
                    y={570}
                    tittel="Det snudde"
                    tekst="vanskelig å behandle lovbrytere"
                    farge={FARGE.bakover}
                />
            )}
            {beat >= 3 && (
                <Kort
                    x={AAR_X(1965) - 30}
                    y={250}
                    tittel="Skremme og stå i forhold"
                    tekst="fra midten av 1960-tallet"
                    farge={FARGE.bakover}
                />
            )}
            {beat >= 4 && (
                <Kort
                    x={AAR_X(2005) - 60}
                    y={720}
                    tittel="Ny straffelov"
                    tekst="vedtatt av Stortinget i 2005"
                    farge={FARGE.bla}
                />
            )}
        </>
    );
}

export function StraffTid({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'retning';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0">
            <Svg>
                {modus === 'retning' && <Retning beat={beat} />}
                {modus === 'skremme' && <Skremme beat={beat} />}
                {modus === 'lengde' && <Lengde beat={beat} />}
                {modus === 'historie' && <Historie beat={beat} />}
            </Svg>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
