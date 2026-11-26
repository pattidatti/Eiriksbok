import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Ear, Landmark, Languages, MessageCircle, PenLine, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { HtBrikke } from './HtBrikke';

/**
 * Sider, bøker og hyller: hvordan tekstene ser ut og hvem som har skrevet dem.
 *
 * «talmud»: Tanakh av tre deler, skrevet og muntlig Tora, Mishna, og talmudsiden med
 *           kommentarer rundt teksten i midten.
 * «koran»: den arabiske Koranen mot en oversettelse, og sunniislam uten hovedkontor.
 * «hylla»: hinduismens to hyller, shruti (hørt) og smriti (husket).
 * «jhvh»: de fire bokstavene, Herren eller Jehova, og Det styrende råd.
 *
 * Linjene på sidene er grå streker, ikke ekte skrift.
 */

type Modus = 'talmud' | 'koran' | 'hylla' | 'jhvh';

const B = 1600;
const H = 900;

const TEKST: Record<Modus, string[]> = {
    talmud: [
        'Tanakh: Toraen, Neviim, Ketuvim',
        'Skrevet Tora og muntlig Tora',
        'Ca. år 200: Mishna',
        'Talmud: tekst i midten, kommentarer rundt',
        'Uenigheten blir stående',
    ],
    koran: [
        'For muslimer: ordene er budskapet',
        '800-tallet: en oversettelse er en forståelse',
        'En norsk koran er ikke Koranen',
        'Hvem avgjør hva teksten betyr?',
    ],
    hylla: [
        'Hinduismen: ingen sjef på toppen',
        'Shruti: det som er hørt',
        'Vedaene: lyden holder dem like',
        'Smriti: det som er husket',
        'Den mest oversatte hinduistiske teksten',
    ],
    jhvh: [
        'Jehovas vitner: Bibelen',
        'Guds navn: fire bokstaver',
        'Herren eller Jehova?',
        'Hvem avgjør?',
    ],
};

function Inn({ children, delay = 0, k }: { children: ReactNode; delay?: number; k?: string }) {
    return (
        <motion.g
            key={k}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay, duration: 0.5 }}
        >
            {children}
        </motion.g>
    );
}

/** Grå streker som står for tekst. */
function Linjer({
    x,
    y,
    b,
    n,
    avstand = 26,
    farge = '#cbd5e1',
    tykk = 10,
}: {
    x: number;
    y: number;
    b: number;
    n: number;
    avstand?: number;
    farge?: string;
    tykk?: number;
}) {
    return (
        <g>
            {Array.from({ length: n }, (_, i) => (
                <rect
                    key={i}
                    x={x}
                    y={y + i * avstand}
                    width={b * (i % 3 === 2 ? 0.7 : i % 4 === 1 ? 0.9 : 1)}
                    height={tykk}
                    rx={tykk / 2}
                    fill={farge}
                />
            ))}
        </g>
    );
}

/** En lukket bok sett forfra, med tittel på omslaget. */
function Bok({
    x,
    y,
    b,
    h,
    farge,
    tittel,
    under,
}: {
    x: number;
    y: number;
    b: number;
    h: number;
    farge: string;
    tittel: string;
    under?: string;
}) {
    return (
        <g>
            <rect
                x={x + 10}
                y={y + 10}
                width={b}
                height={h}
                rx={14}
                fill="#0f172a"
                opacity={0.15}
            />
            <rect x={x} y={y} width={b} height={h} rx={14} fill={farge} />
            <rect x={x} y={y} width={28} height={h} rx={10} fill="#000" opacity={0.18} />
            <rect
                x={x + 50}
                y={y + 40}
                width={b - 80}
                height={h - 80}
                rx={10}
                fill="none"
                stroke="#fde68a"
                strokeWidth={4}
            />
            <text
                x={x + b / 2 + 12}
                y={y + h / 2 + 14}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#fef3c7"
            >
                {tittel}
            </text>
            {under && (
                <text
                    x={x + b / 2}
                    y={y + h + 56}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    {under}
                </text>
            )}
        </g>
    );
}

function Talmud({ beat }: { beat: number }) {
    if (beat === 0) {
        const deler = [
            { b: 'T', navn: 'Toraen', f: '#2563eb' },
            { b: 'N', navn: 'Neviim', f: '#7c3aed' },
            { b: 'K', navn: 'Ketuvim', f: '#0d9488' },
        ];
        return (
            <g>
                {deler.map((d, i) => (
                    <Inn key={d.b} delay={i * 0.4}>
                        <rect
                            x={330 + i * 340}
                            y={230}
                            width={260}
                            height={300}
                            rx={24}
                            fill={d.f}
                        />
                        <text
                            x={460 + i * 340}
                            y={420}
                            textAnchor="middle"
                            fontSize={150}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            {d.b}
                        </text>
                        <text
                            x={460 + i * 340}
                            y={590}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            {d.navn}
                        </text>
                    </Inn>
                ))}
                <Inn delay={1.4}>
                    <text
                        x={800}
                        y={740}
                        textAnchor="middle"
                        fontSize={96}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        <tspan fill="#2563eb">T</tspan>a<tspan fill="#7c3aed">N</tspan>a
                        <tspan fill="#0d9488">K</tspan>h
                    </text>
                </Inn>
            </g>
        );
    }
    if (beat <= 2) {
        return (
            <g>
                <Bok
                    x={200}
                    y={240}
                    b={420}
                    h={460}
                    farge="#1e3a8a"
                    tittel="Toraen"
                    under="skrevet"
                />
                {beat === 1 ? (
                    <Inn k="muntlig">
                        {[
                            [900, 260],
                            [1180, 330],
                            [960, 500],
                            [1240, 560],
                        ].map(([x, y], i) => (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.35 }}
                            >
                                <MessageCircle
                                    x={x}
                                    y={y}
                                    width={150}
                                    height={150}
                                    color="#b45309"
                                    strokeWidth={1.6}
                                    fill="#fef3c7"
                                />
                            </motion.g>
                        ))}
                        <text
                            x={1100}
                            y={780}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            muntlig: forklaringene
                        </text>
                    </Inn>
                ) : (
                    <Inn k="mishna">
                        <rect
                            x={880}
                            y={240}
                            width={460}
                            height={460}
                            rx={18}
                            fill="#fffbeb"
                            stroke="#b45309"
                            strokeWidth={5}
                        />
                        <Linjer
                            x={930}
                            y={300}
                            b={360}
                            n={11}
                            avstand={34}
                            farge="#d6b98c"
                            tykk={12}
                        />
                        <text
                            x={1110}
                            y={780}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            skrevet ned: Mishna
                        </text>
                    </Inn>
                )}
            </g>
        );
    }
    // Talmudsiden: kort tekst i midten, kommentarer rundt.
    const ramme = { x: 430, y: 170, b: 740, h: 680 };
    const midt = { x: 620, y: 330, b: 360, h: 260 };
    const uenig = beat === 4;
    return (
        <g>
            <rect
                x={ramme.x}
                y={ramme.y}
                width={ramme.b}
                height={ramme.h}
                rx={12}
                fill="#fffbeb"
                stroke="#d6b98c"
                strokeWidth={4}
            />
            <Inn delay={0}>
                <rect x={midt.x} y={midt.y} width={midt.b} height={midt.h} rx={10} fill="#fde68a" />
                <Linjer
                    x={midt.x + 30}
                    y={midt.y + 70}
                    b={midt.b - 60}
                    n={6}
                    avstand={30}
                    farge="#92400e"
                    tykk={11}
                />
                <text
                    x={midt.x + midt.b / 2}
                    y={midt.y + 46}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#78350f"
                >
                    Mishna
                </text>
            </Inn>
            <Inn delay={0.5}>
                <Linjer x={470} y={210} b={660} n={4} avstand={24} />
                <Linjer x={470} y={340} b={120} n={10} avstand={24} />
                <Linjer x={1010} y={340} b={120} n={10} avstand={24} />
                <Linjer x={470} y={620} b={660} n={8} avstand={24} />
            </Inn>
            {uenig && (
                <Inn k="uenig">
                    <rect
                        x={458}
                        y={326}
                        width={164}
                        height={264}
                        rx={10}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={6}
                    />
                    <rect
                        x={998}
                        y={326}
                        width={164}
                        height={264}
                        rx={10}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth={6}
                    />
                    <text
                        x={300}
                        y={430}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#dc2626"
                    >
                        ett syn
                    </text>
                    <text
                        x={1310}
                        y={430}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#2563eb"
                    >
                        et annet syn
                    </text>
                    <text
                        x={300}
                        y={480}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={700}
                        fill="#334155"
                    >
                        står igjen
                    </text>
                    <text
                        x={1310}
                        y={480}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={700}
                        fill="#334155"
                    >
                        står også igjen
                    </text>
                </Inn>
            )}
            {!uenig && (
                <Inn delay={0.9} k="kommentarer">
                    <text
                        x={260}
                        y={470}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#334155"
                    >
                        kommentarer
                    </text>
                    <text
                        x={260}
                        y={510}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#334155"
                    >
                        rundt teksten
                    </text>
                    <text
                        x={1340}
                        y={470}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#334155"
                    >
                        fra flere hundre år
                    </text>
                </Inn>
            )}
        </g>
    );
}

function Koran({ beat }: { beat: number }) {
    const venstre = (
        <g>
            <Bok x={230} y={230} b={420} h={480} farge="#065f46" tittel="Koranen" />
            <text x={440} y={780} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                for muslimer: ordene er budskapet
            </text>
        </g>
    );
    if (beat === 0) return venstre;
    if (beat === 3)
        return (
            <g>
                {venstre}
                <Inn k="kontor">
                    <Landmark
                        x={930}
                        y={260}
                        width={260}
                        height={260}
                        color="#334155"
                        strokeWidth={1.6}
                    />
                    <X x={1190} y={300} width={180} height={180} color="#dc2626" strokeWidth={3} />
                    <text
                        x={1150}
                        y={600}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Sunniislam:
                    </text>
                    <text
                        x={1150}
                        y={648}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#334155"
                    >
                        ingen prester,
                    </text>
                    <text
                        x={1150}
                        y={694}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#334155"
                    >
                        ikke noe hovedkontor
                    </text>
                </Inn>
            </g>
        );
    return (
        <g>
            {venstre}
            <Inn k="ulik">
                <text
                    x={800}
                    y={500}
                    textAnchor="middle"
                    fontSize={140}
                    fontWeight={900}
                    fill="#dc2626"
                >
                    ≠
                </text>
            </Inn>
            <Inn k="oversatt" delay={0.3}>
                <rect
                    x={960}
                    y={290}
                    width={360}
                    height={420}
                    rx={14}
                    fill="#f1f5f9"
                    stroke="#94a3b8"
                    strokeWidth={4}
                />
                <Linjer x={1000} y={340} b={280} n={11} avstand={30} />
                <text
                    x={1140}
                    y={772}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    {beat === 1 ? 'oversatt: én persons forståelse' : 'norsk utgave, 1980'}
                </text>
                {beat === 2 && (
                    <text
                        x={1140}
                        y={820}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#dc2626"
                    >
                        ikke Koranen selv
                    </text>
                )}
            </Inn>
        </g>
    );
}

/** En vedarull: en sylinder sett fra siden. */
function Rull({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={56}
                height={150}
                rx={14}
                fill="#f5deb3"
                stroke="#b45309"
                strokeWidth={4}
            />
            <rect x={x - 6} y={y - 6} width={68} height={18} rx={8} fill="#92400e" />
            <rect x={x - 6} y={y + 138} width={68} height={18} rx={8} fill="#92400e" />
        </g>
    );
}

function Hylla({ beat }: { beat: number }) {
    if (beat === 0)
        return (
            <g>
                <Crown x={590} y={260} width={300} height={300} color="#b45309" strokeWidth={1.4} />
                <X x={880} y={320} width={180} height={180} color="#dc2626" strokeWidth={3} />
                <text
                    x={800}
                    y={660}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Ingen sjef på toppen
                </text>
                <text
                    x={800}
                    y={720}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill="#334155"
                >
                    Ulike retninger bruker ulike tekster
                </text>
            </g>
        );
    const smriti = beat >= 3;
    return (
        <g>
            {/* Øverste hylle: shruti */}
            <rect x={240} y={450} width={1120} height={20} rx={6} fill="#78350f" />
            <text x={260} y={210} fontSize={40} fontWeight={900} fill="#9a3412">
                Shruti: det som er hørt
            </text>
            <text x={260} y={256} fontSize={30} fontWeight={700} fill="#334155">
                ifølge tradisjonen: ingen mennesker skrev dem
            </text>
            {[0, 1, 2, 3].map((i) => (
                <Rull key={i} x={300 + i * 100} y={292} />
            ))}
            <Ear x={760} y={316} width={110} height={110} color="#9a3412" strokeWidth={1.8} />
            {beat === 2 && (
                <Inn k="lyd">
                    {[0, 1, 2].map((i) => (
                        <path
                            key={i}
                            d={`M ${910 + i * 46} 300 Q ${960 + i * 46} 370 ${910 + i * 46} 440`}
                            fill="none"
                            stroke="#ea580c"
                            strokeWidth={8}
                            strokeLinecap="round"
                        >
                            <animate
                                attributeName="opacity"
                                values="0.2;1;0.2"
                                dur="1.6s"
                                begin={`${i * 0.25}s`}
                                repeatCount="indefinite"
                            />
                        </path>
                    ))}
                    <text x={1080} y={360} fontSize={32} fontWeight={800} fill="#9a3412">
                        lyden holder
                    </text>
                    <text x={1080} y={400} fontSize={32} fontWeight={800} fill="#9a3412">
                        teksten lik
                    </text>
                </Inn>
            )}
            {/* Nederste hylle: smriti */}
            {smriti && (
                <Inn k="smriti">
                    <rect x={240} y={810} width={1120} height={20} rx={6} fill="#78350f" />
                    <text x={260} y={545} fontSize={40} fontWeight={900} fill="#1d4ed8">
                        Smriti: det som er husket
                    </text>
                    <text x={260} y={590} fontSize={30} fontWeight={700} fill="#334155">
                        man vet hvem som skrev
                    </text>
                    {['#1d4ed8', '#0f766e', '#7c3aed', '#be185d'].map((f, i) => (
                        <rect
                            key={f}
                            x={300 + i * 74}
                            y={630}
                            width={58}
                            height={180}
                            rx={6}
                            fill={f}
                        />
                    ))}
                    <PenLine
                        x={640}
                        y={670}
                        width={100}
                        height={100}
                        color="#1d4ed8"
                        strokeWidth={1.8}
                    />
                </Inn>
            )}
            {beat === 4 && (
                <Inn k="gita">
                    <rect x={800} y={610} width={380} height={200} rx={14} fill="#be185d" />
                    <text
                        x={990}
                        y={706}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Bhagavadgita
                    </text>
                    <Languages
                        x={1200}
                        y={640}
                        width={110}
                        height={110}
                        color="#be185d"
                        strokeWidth={1.8}
                    />
                    <text
                        x={990}
                        y={764}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#fce7f3"
                    >
                        oversatt flest ganger
                    </text>
                </Inn>
            )}
        </g>
    );
}

function Jhvh({ beat }: { beat: number }) {
    if (beat === 0)
        return (
            <g>
                <Bok x={590} y={220} b={420} h={480} farge="#1e3a8a" tittel="Bibelen" />
                <text
                    x={800}
                    y={780}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    ingen egen hellig bok ved siden av
                </text>
            </g>
        );
    const bokstaver = ['J', 'H', 'V', 'H'];
    return (
        <g>
            {bokstaver.map((b, i) => (
                <Inn key={i} delay={beat === 1 ? i * 0.3 : 0}>
                    <rect
                        x={530 + i * 140}
                        y={200}
                        width={120}
                        height={140}
                        rx={16}
                        fill="#0f172a"
                    />
                    <text
                        x={590 + i * 140}
                        y={300}
                        textAnchor="middle"
                        fontSize={92}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        {b}
                    </text>
                </Inn>
            ))}
            {beat === 1 && (
                <text
                    x={800}
                    y={420}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={800}
                    fill="#334155"
                >
                    Guds navn i den gamle hebraiske teksten
                </text>
            )}
            {beat === 2 && (
                <Inn k="to">
                    <path d="M 700 360 L 500 450" stroke="#64748b" strokeWidth={6} />
                    <path d="M 900 360 L 1100 450" stroke="#64748b" strokeWidth={6} />
                    <rect
                        x={260}
                        y={460}
                        width={480}
                        height={300}
                        rx={18}
                        fill="#f1f5f9"
                        stroke="#94a3b8"
                        strokeWidth={4}
                    />
                    <text
                        x={500}
                        y={540}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#334155"
                    >
                        De fleste norske bibler
                    </text>
                    <text
                        x={500}
                        y={660}
                        textAnchor="middle"
                        fontSize={72}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Herren
                    </text>
                    <rect
                        x={860}
                        y={460}
                        width={480}
                        height={300}
                        rx={18}
                        fill="#e0f2fe"
                        stroke="#0284c7"
                        strokeWidth={4}
                    />
                    <text
                        x={1100}
                        y={540}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#075985"
                    >
                        Ny verden-oversettelsen
                    </text>
                    <text
                        x={1100}
                        y={660}
                        textAnchor="middle"
                        fontSize={72}
                        fontWeight={900}
                        fill="#0284c7"
                    >
                        Jehova
                    </text>
                </Inn>
            )}
            {beat === 3 && (
                <Inn k="raad">
                    <rect
                        x={220}
                        y={430}
                        width={560}
                        height={300}
                        rx={18}
                        fill="#fef3c7"
                        stroke="#b45309"
                        strokeWidth={4}
                    />
                    <text
                        x={500}
                        y={510}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#78350f"
                    >
                        Kritikere mener:
                    </text>
                    <text
                        x={500}
                        y={570}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#78350f"
                    >
                        noen steder farget av
                    </text>
                    <text
                        x={500}
                        y={616}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#78350f"
                    >
                        det bevegelsen selv tror
                    </text>
                    <Landmark
                        x={940}
                        y={420}
                        width={220}
                        height={220}
                        color="#0284c7"
                        strokeWidth={1.6}
                    />
                    <text
                        x={1050}
                        y={700}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Det styrende råd
                    </text>
                    <text
                        x={1050}
                        y={746}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#334155"
                    >
                        eneste sted som avgjør
                    </text>
                </Inn>
            )}
        </g>
    );
}

export function HelligeTeksterSide({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'talmud';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f8f5ee' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.g
                        key={`${modus}-${beat <= 0 ? 0 : modus === 'talmud' && beat >= 3 ? 3 : beat}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {modus === 'talmud' && <Talmud beat={beat} />}
                        {modus === 'koran' && <Koran beat={beat} />}
                        {modus === 'hylla' && <Hylla beat={beat} />}
                        {modus === 'jhvh' && <Jhvh beat={beat} />}
                    </motion.g>
                </AnimatePresence>
            </svg>
            <HtBrikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
