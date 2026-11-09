import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Lapp } from './Lapp';
import { frø } from './felles3d';

/**
 * Samfunnet i 2D.
 * «lege»: forfatteren som lege for samfunnet: sykdommene og medisinen.
 * «byen»: fra bygd til by, fabrikkene, arbeiderne og borgerskapet.
 * «folkefiende»: Doktor Stockmann og kurbadet, alene mot hele byen.
 * «arv»: naturalismen: arv og miljø mot viljen til å forandre livet.
 */

type Modus = 'lege' | 'byen' | 'folkefiende' | 'arv';

const B = 1600;
const H = 900;

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <motion.text
            key={tekst}
            x={B / 2}
            y={105}
            textAnchor="middle"
            fontSize={62}
            fontWeight={900}
            fill="#0f172a"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Et lite menneske i SVG, med føttene i (x, y). */
function Figur({
    x,
    y,
    s = 1,
    farge = '#334155',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -22 0 L 22 0 L 14 -70 L -14 -70 Z" fill={farge} />
            <circle cx={0} cy={-88} r={18} fill="#f1c9a5" />
        </g>
    );
}

/** Rødt kryss, satt ved siden av det som ikke lenger gjelder. */
function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <g stroke="#dc2626" strokeWidth={12} strokeLinecap="round">
            <line x1={x - 26} y1={y - 26} x2={x + 26} y2={y + 26} />
            <line x1={x + 26} y1={y - 26} x2={x - 26} y2={y + 26} />
        </g>
    );
}

/* ------------------------------------------------------------------ legen */

const SYKDOMMER = [
    { tekst: 'Fattigdom', x: 650, y: 330 },
    { tekst: 'Kvinner holdes nede', x: 1000, y: 470 },
    { tekst: 'Løgn', x: 690, y: 600 },
];

function Lege({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift
                tekst={
                    beat === 0
                        ? 'Ikke bare underholdning'
                        : beat === 3
                          ? 'Medisinen: sannheten'
                          : 'Forfatteren som lege'
                }
            />
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    {['Underholde', 'Trøste'].map((t, i) => (
                        <g key={t}>
                            <Lapp
                                x={720}
                                y={380 + i * 170}
                                tekst={t}
                                fs={56}
                                fyll="#e2e8f0"
                                farge="#475569"
                                forsinkelse={0.3 + i * 0.4}
                            />
                            <Kryss x={1030} y={380 + i * 170} />
                        </g>
                    ))}
                </motion.g>
            )}
            {beat >= 1 && (
                <>
                    {/* Samfunnskroppen: en stor kropp full av små hus */}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <circle
                            cx={800}
                            cy={250}
                            r={70}
                            fill="#e2e8f0"
                            stroke="#64748b"
                            strokeWidth={5}
                        />
                        <rect
                            x={650}
                            y={330}
                            width={300}
                            height={430}
                            rx={110}
                            fill="#e2e8f0"
                            stroke="#64748b"
                            strokeWidth={5}
                        />
                        {Array.from({ length: 18 }, (_, i) => (
                            <g
                                key={i}
                                transform={`translate(${690 + (i % 4) * 60} ${400 + Math.floor(i / 4) * 70})`}
                            >
                                <rect x={0} y={12} width={34} height={28} fill="#94a3b8" />
                                <path d="M -4 14 L 17 -4 L 38 14 Z" fill="#64748b" />
                            </g>
                        ))}
                        <text
                            x={800}
                            y={820}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill="#475569"
                        >
                            Samfunnet
                        </text>
                    </motion.g>
                    {/* Forfatteren med forstørrelsesglass */}
                    <motion.g
                        initial={{ x: 0, y: 0 }}
                        animate={
                            beat === 1
                                ? { x: [0, 120, -60, 0], y: [0, 160, 260, 0] }
                                : { x: 0, y: 0 }
                        }
                        transition={{ duration: 6, repeat: beat === 1 ? Infinity : 0 }}
                    >
                        <circle
                            cx={470}
                            cy={380}
                            r={70}
                            fill="#dbeafe"
                            fillOpacity={0.6}
                            stroke="#1e3a8a"
                            strokeWidth={12}
                        />
                        <line
                            x1={420}
                            y1={430}
                            x2={350}
                            y2={510}
                            stroke="#1e3a8a"
                            strokeWidth={22}
                            strokeLinecap="round"
                        />
                    </motion.g>
                </>
            )}
            {beat >= 2 &&
                SYKDOMMER.map((s, i) => (
                    <motion.g
                        key={s.tekst}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 1.0, duration: 0.5 }}
                    >
                        <circle cx={s.x} cy={s.y} r={26} fill="#dc2626" />
                        <line
                            x1={s.x}
                            y1={s.y}
                            x2={s.x > 800 ? 1130 : 470}
                            y2={s.y}
                            stroke="#dc2626"
                            strokeWidth={5}
                        />
                        <Lapp
                            x={
                                s.x > 800
                                    ? 1130 + (s.tekst.length * 40 * 0.58 + 52) / 2
                                    : 470 - (s.tekst.length * 40 * 0.58 + 52) / 2
                            }
                            y={s.y}
                            tekst={s.tekst}
                            fs={40}
                            fyll="#fee2e2"
                            farge="#7f1d1d"
                        />
                    </motion.g>
                ))}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    {/* Medisinflaska */}
                    <g transform="translate(1200 690)">
                        <rect x={-14} y={-150} width={28} height={30} fill="#78350f" />
                        <rect x={-60} y={-120} width={120} height={200} rx={24} fill="#0f766e" />
                        <rect x={-56} y={-60} width={112} height={70} fill="#ffffff" />
                        <text
                            x={0}
                            y={-16}
                            textAnchor="middle"
                            fontSize={20}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            SANNHET
                        </text>
                    </g>
                    <Lapp
                        x={1200}
                        y={850}
                        tekst="uten å pynte på den"
                        fs={34}
                        fyll="#ccfbf1"
                        farge="#134e4a"
                    />
                </motion.g>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ byen */

const FLYTTERE = Array.from({ length: 140 }, (_, i) => ({
    y: 560 + frø(i) * 180,
    start: frø(i + 300) * 4,
    fart: 3 + frø(i + 600) * 2,
}));

function Byen({ beat }: { beat: number }) {
    const overskrifter = [
        'Norge forandrer seg',
        'På vei mot industrisamfunn',
        'Fra bygd til by',
        'Arbeiderne: trangt og fattig',
        'Borgerskapet får makt',
    ];
    return (
        <>
            <Overskrift tekst={overskrifter[Math.min(beat, 4)]} />
            {/* Bakken */}
            <rect x={0} y={740} width={B} height={160} fill="#a3a38a" />
            {/* Bygda til venstre */}
            <rect x={0} y={520} width={560} height={220} fill="#86a85b" />
            {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${70 + i * 170} ${560 + (i % 2) * 50})`}>
                    <rect x={0} y={40} width={110} height={70} fill="#9a3412" />
                    <path d="M -10 44 L 55 0 L 120 44 Z" fill="#451a03" />
                </g>
            ))}
            <text x={280} y={830} textAnchor="middle" fontSize={42} fontWeight={900} fill="#1a2e05">
                Bygda
            </text>
            {/* Byen til høyre */}
            <rect x={1040} y={520} width={560} height={220} fill="#cbd5e1" />
            <text
                x={1320}
                y={830}
                textAnchor="middle"
                fontSize={42}
                fontWeight={900}
                fill="#0f172a"
            >
                Byen
            </text>
            {/* Fabrikkene */}
            {beat >= 1 &&
                [0, 1].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.6, duration: 0.8 }}
                    >
                        <rect x={1080 + i * 260} y={470} width={200} height={140} fill="#7c2d12" />
                        <path
                            d={`M ${1080 + i * 260} 470 l 50 -40 l 0 40 l 50 -40 l 0 40 l 50 -40 l 0 40 l 50 -40 l 0 40 Z`}
                            fill="#7c2d12"
                        />
                        <rect x={1240 + i * 260} y={330} width={30} height={140} fill="#451a03" />
                        <motion.circle
                            cx={1255 + i * 260}
                            cy={300}
                            r={34}
                            fill="#94a3b8"
                            animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -30, 0] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i }}
                        />
                    </motion.g>
                ))}
            {/* Folk som flytter: en tett, utellbar strøm */}
            {beat === 2 &&
                FLYTTERE.map((f, i) => (
                    <motion.circle
                        key={i}
                        cx={560}
                        cy={f.y}
                        r={7}
                        fill="#1e3a8a"
                        initial={{ x: 0, opacity: 0 }}
                        animate={{ x: [0, 480], opacity: [0, 1, 1, 0] }}
                        transition={{
                            duration: f.fart,
                            delay: f.start,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}
            {beat === 2 && (
                <Lapp
                    x={800}
                    y={250}
                    tekst="Tusenvis flytter for å få jobb"
                    fs={44}
                    fyll="#1e3a8a"
                    farge="#ffffff"
                    forsinkelse={0.5}
                />
            )}
            {/* Arbeiderboligene: tett i tett */}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat === 3 ? 1 : 0.5 }}
                    transition={{ duration: 0.8 }}
                >
                    {Array.from({ length: 10 }, (_, i) => (
                        <rect
                            key={i}
                            x={1050 + i * 52}
                            y={640}
                            width={48}
                            height={100}
                            fill={i % 2 ? '#64748b' : '#475569'}
                        />
                    ))}
                    {beat === 3 && (
                        <Lapp
                            x={800}
                            y={300}
                            tekst="Trange boliger, lite penger"
                            fs={44}
                            fyll="#ffffff"
                            farge="#334155"
                            forsinkelse={0.5}
                        />
                    )}
                </motion.g>
            )}
            {/* Villaen til borgerskapet */}
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <g transform="translate(1150 290)">
                        <rect
                            x={0}
                            y={90}
                            width={320}
                            height={260}
                            fill="#fef3c7"
                            stroke="#b45309"
                            strokeWidth={6}
                        />
                        <path d="M -24 96 L 160 0 L 344 96 Z" fill="#b45309" />
                        {[0, 1, 2].map((i) => (
                            <rect
                                key={i}
                                x={30 + i * 100}
                                y={140}
                                width={60}
                                height={70}
                                fill="#fde68a"
                                stroke="#b45309"
                                strokeWidth={4}
                            />
                        ))}
                        <rect x={130} y={260} width={60} height={90} fill="#78350f" />
                    </g>
                    <Lapp
                        x={800}
                        y={250}
                        tekst="Fabrikkeiere, kjøpmenn, direktører"
                        fs={40}
                        fyll="#b45309"
                        farge="#ffffff"
                        forsinkelse={0.8}
                    />
                </motion.g>
            )}
            {beat === 0 && (
                <Lapp x={800} y={300} tekst="Raskere enn noensinne" fs={48} forsinkelse={0.6} />
            )}
        </>
    );
}

/* ------------------------------------------------------------------ folkefienden */

const MENGDEN = Array.from({ length: 70 }, (_, i) => ({
    x: 1000 + frø(i) * 480,
    y: 620 + frø(i + 70) * 160,
}));

function Folkefiende({ beat }: { beat: number }) {
    const gift = beat >= 1;
    const mengde = beat >= 2;
    const sitat = beat >= 4;
    const overskrifter = [
        'En folkefiende, 1882',
        'Vannet gjør folk syke',
        'Hele byen blir rasende',
        'Alene mot alle',
        'Han nekter å gi seg',
    ];
    return (
        <>
            <Overskrift tekst={overskrifter[Math.min(beat, 4)]} />
            {!sitat && (
                <>
                    {/* Kurbadet */}
                    <g transform="translate(120 330)">
                        <rect
                            x={0}
                            y={60}
                            width={460}
                            height={220}
                            fill="#f8fafc"
                            stroke="#475569"
                            strokeWidth={5}
                        />
                        <path d="M -20 64 L 230 -10 L 480 64 Z" fill="#475569" />
                        {[0, 1, 2, 3].map((i) => (
                            <rect
                                key={i}
                                x={30 + i * 110}
                                y={100}
                                width={14}
                                height={160}
                                fill="#cbd5e1"
                            />
                        ))}
                        <text
                            x={230}
                            y={-30}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            Kurbadet
                        </text>
                    </g>
                    {/* Bassenget */}
                    <rect
                        x={100}
                        y={640}
                        width={500}
                        height={110}
                        rx={20}
                        fill={gift ? '#65a30d' : '#38bdf8'}
                        style={{ transition: 'fill 1.5s' }}
                    />
                    {gift &&
                        [0, 1, 2, 3, 4].map((i) => (
                            <motion.circle
                                key={i}
                                cx={160 + i * 95}
                                cy={690}
                                r={12}
                                fill="#3f6212"
                                animate={{ y: [0, -24, 0], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                            />
                        ))}
                    {beat === 1 && (
                        <Lapp
                            x={350}
                            y={830}
                            tekst="Forgiftet vann"
                            fs={40}
                            fyll="#3f6212"
                            farge="#ffffff"
                            forsinkelse={0.6}
                        />
                    )}
                    {/* Stockmann */}
                    <motion.g animate={{ x: beat >= 3 ? 70 : 0 }} transition={{ duration: 1.2 }}>
                        {beat >= 3 && <ellipse cx={760} cy={780} rx={120} ry={26} fill="#fde68a" />}
                        <Figur x={760} y={780} s={2} farge="#f8fafc" />
                        <path d="M 717 641 L 803 641 L 799 672 L 721 672 Z" fill="#0f172a" />
                        <Lapp
                            x={760}
                            y={510}
                            tekst="Doktor Stockmann"
                            fs={34}
                            fyll="#1e3a8a"
                            farge="#ffffff"
                        />
                    </motion.g>
                    {beat === 1 && (
                        <Lapp
                            x={1200}
                            y={330}
                            tekst="Vil fortelle sannheten"
                            fs={40}
                            fyll="#ffffff"
                            forsinkelse={1.2}
                        />
                    )}
                    {beat === 1 && (
                        <Lapp
                            x={1200}
                            y={430}
                            tekst="Tror han blir feiret som helt"
                            fs={36}
                            fyll="#fef3c7"
                            farge="#78350f"
                            forsinkelse={2.0}
                        />
                    )}
                    {/* Byen: en tett mengde */}
                    {mengde && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                        >
                            {MENGDEN.map((m, i) => (
                                <Figur
                                    key={i}
                                    x={m.x}
                                    y={m.y}
                                    s={0.55}
                                    farge={i % 3 ? '#b91c1c' : '#7f1d1d'}
                                />
                            ))}
                        </motion.g>
                    )}
                    {beat === 2 && (
                        <>
                            <Lapp x={1240} y={280} tekst="Avisene" fs={38} forsinkelse={0.8} />
                            <Lapp
                                x={1240}
                                y={370}
                                tekst="De små næringsdrivende"
                                fs={38}
                                forsinkelse={1.4}
                            />
                            <Lapp
                                x={1240}
                                y={460}
                                tekst="tjener på å holde det skjult"
                                fs={34}
                                fyll="#fee2e2"
                                farge="#7f1d1d"
                                forsinkelse={2.0}
                            />
                        </>
                    )}
                </>
            )}
            {sitat && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <ellipse cx={800} cy={760} rx={150} ry={30} fill="#fde68a" />
                    <Figur x={800} y={760} s={1.7} farge="#f8fafc" />
                    <rect x={180} y={180} width={1240} height={300} rx={32} fill="#0f172a" />
                    <text
                        x={800}
                        y={290}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        «Den sterkeste mann i verden,
                    </text>
                    <text
                        x={800}
                        y={390}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#fbbf24"
                    >
                        det er han som står mest alene.»
                    </text>
                </motion.g>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ arv og miljø */

function Arv({ beat }: { beat: number }) {
    const overskrifter = [
        'Amalie Skram',
        'Enda tøffere',
        'Realistene',
        'Naturalistene',
        'Hellemyrsfolket',
    ];
    return (
        <>
            <Overskrift tekst={overskrifter[Math.min(beat, 4)]} />
            {beat <= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <circle cx={800} cy={320} r={110} fill="#9f1239" />
                    <text
                        x={800}
                        y={360}
                        textAnchor="middle"
                        fontSize={110}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        S
                    </text>
                    <Lapp
                        x={800}
                        y={500}
                        tekst="Naturalismen"
                        fs={48}
                        fyll="#0f172a"
                        farge="#ffffff"
                    />
                    <Lapp
                        x={800}
                        y={590}
                        tekst="1880-tallet"
                        fs={34}
                        fyll="#e2e8f0"
                        farge="#334155"
                    />
                </motion.g>
            )}
            {beat === 1 &&
                ['Ekstrem fattigdom', 'Alkoholisme', 'Psykisk sykdom'].map((t, i) => (
                    <Lapp
                        key={t}
                        x={330 + i * 470}
                        y={740}
                        tekst={t}
                        fs={40}
                        fyll="#1e293b"
                        farge="#ffffff"
                        forsinkelse={0.4 + i * 0.6}
                    />
                ))}
            {beat >= 2 && beat <= 3 && (
                <>
                    {/* Realistene: veien kan velges */}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 2 ? 1 : 0.35 }}
                        transition={{ duration: 0.6 }}
                    >
                        <rect x={100} y={170} width={660} height={640} rx={30} fill="#ecfdf5" />
                        <path
                            d="M 300 720 C 330 560 420 520 560 330"
                            fill="none"
                            stroke="#0f766e"
                            strokeWidth={14}
                            strokeLinecap="round"
                        />
                        <path
                            d="M 520 340 L 565 322 L 572 370"
                            fill="none"
                            stroke="#0f766e"
                            strokeWidth={14}
                            strokeLinecap="round"
                        />
                        <circle cx={650} cy={340} r={46} fill="#fbbf24" />
                        <Figur x={300} y={760} s={1.2} farge="#0f766e" />
                        <Lapp
                            x={430}
                            y={230}
                            tekst="Du kan forandre livet"
                            fs={34}
                            fyll="#0f766e"
                            farge="#ffffff"
                        />
                    </motion.g>
                    {/* Naturalistene: arv og miljø holder deg fast */}
                    {beat === 3 && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <rect x={840} y={170} width={660} height={640} rx={30} fill="#f1f5f9" />
                            <circle
                                cx={1170}
                                cy={560}
                                r={170}
                                fill="none"
                                stroke="#475569"
                                strokeWidth={18}
                            />
                            <Figur x={1170} y={640} s={1.2} farge="#475569" />
                            <Lapp
                                x={1170}
                                y={300}
                                tekst="Arv og miljø"
                                fs={44}
                                fyll="#334155"
                                farge="#ffffff"
                                forsinkelse={0.3}
                            />
                            <Lapp
                                x={1170}
                                y={770}
                                tekst="Født fattig: nesten umulig"
                                fs={30}
                                fyll="#e2e8f0"
                                farge="#334155"
                                forsinkelse={1.2}
                            />
                        </motion.g>
                    )}
                </>
            )}
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <rect x={0} y={700} width={B} height={200} fill="#cbd5e1" />
                    {Array.from({ length: 9 }, (_, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: Math.max(0.12, 1 - i * 0.12) }}
                            transition={{ delay: 0.3 + i * 0.35, duration: 0.6 }}
                        >
                            <Figur
                                x={260 + i * 140}
                                y={720 - i * 18}
                                s={1.3 - i * 0.1}
                                farge="#475569"
                            />
                        </motion.g>
                    ))}
                    <Lapp
                        x={800}
                        y={260}
                        tekst="En familie, generasjon etter generasjon"
                        fs={42}
                        forsinkelse={0.5}
                    />
                    <Lapp
                        x={800}
                        y={360}
                        tekst="Romanserie av Amalie Skram"
                        fs={34}
                        fyll="#9f1239"
                        farge="#ffffff"
                        forsinkelse={1.2}
                    />
                </motion.g>
            )}
        </>
    );
}

export function RealismenSamfunn({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'lege';
    return (
        <div
            className="absolute inset-0"
            style={{ background: modus === 'byen' ? '#dbe7f3' : '#f5efe3' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                {modus === 'lege' && <Lege beat={beat} />}
                {modus === 'byen' && <Byen beat={beat} />}
                {modus === 'folkefiende' && <Folkefiende beat={beat} />}
                {modus === 'arv' && <Arv beat={beat} />}
            </svg>
        </div>
    );
}
