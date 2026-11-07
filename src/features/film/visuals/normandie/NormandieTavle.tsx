import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tegnede tavler til Normandie-filmen (SVG, 1600x900).
 *
 *  - avtale: hva Rollo fikk og hva han ga
 *  - sprak:  navnet, språket som smelter inn, troen
 *  - ridder: viking + kavaleri = den normanniske ridderen
 *  - arv:    statsbyggere, sporene i England, engelsk og de franske lånordene
 */

type Modus = 'avtale' | 'sprak' | 'ridder' | 'arv';

const B = 1600;
const H = 900;
const ROD = '#b91c1c';
const BLA = '#1d4ed8';
const MORK = '#0f172a';
const GRA = '#64748b';

function Tekst({
    x,
    y,
    children,
    storrelse = 40,
    farge = MORK,
    vekt = 800,
    anker = 'middle',
    synlig = true,
}: {
    x: number;
    y: number;
    children: ReactNode;
    storrelse?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
    synlig?: boolean;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            dominantBaseline="middle"
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.text>
    );
}

function Vis({
    synlig,
    children,
    forsinkelse = 0,
}: {
    synlig: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.7, delay: synlig ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

export function NormandieTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'avtale';
    return (
        <div className="absolute inset-0 bg-[#f6f1e4] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'avtale' && <Avtale beat={beat} />}
                {modus === 'sprak' && <Sprak beat={beat} />}
                {modus === 'ridder' && <Ridder beat={beat} />}
                {modus === 'arv' && <Arv beat={beat} />}
            </svg>
        </div>
    );
}

/* ---------- avtale ---------- */

function Kort({
    x,
    y,
    b,
    tekst,
    under,
    farge,
    aktiv,
    synlig,
}: {
    x: number;
    y: number;
    b: number;
    tekst: string;
    under?: string;
    farge: string;
    aktiv: boolean;
    synlig: boolean;
}) {
    return (
        <Vis synlig={synlig}>
            <g>
                <rect
                    x={x}
                    y={y}
                    width={b}
                    height={130}
                    rx={22}
                    fill="#ffffff"
                    stroke={aktiv ? farge : '#cbd5e1'}
                    strokeWidth={aktiv ? 8 : 3}
                />
                <text
                    x={x + 36}
                    y={y + (under ? 50 : 65)}
                    dominantBaseline="middle"
                    fontSize={42}
                    fontWeight={800}
                    fill={MORK}
                >
                    {tekst}
                </text>
                {under && (
                    <text
                        x={x + 36}
                        y={y + 98}
                        dominantBaseline="middle"
                        fontSize={30}
                        fontWeight={600}
                        fill={GRA}
                    >
                        {under}
                    </text>
                )}
            </g>
        </Vis>
    );
}

function Avtale({ beat }: { beat: number }) {
    const venstre = 90;
    const hoyre = 850;
    const bredde = 660;
    return (
        <>
            <Tekst x={B / 2} y={80} storrelse={56} vekt={900}>
                Avtalen mellom kongen og Rollo
            </Tekst>
            <Tekst x={venstre + bredde / 2} y={180} storrelse={46} farge={ROD} vekt={900}>
                Rollo får
            </Tekst>
            <Tekst x={hoyre + bredde / 2} y={180} storrelse={46} farge={BLA} vekt={900}>
                Rollo gir
            </Tekst>
            <Kort
                x={venstre}
                y={240}
                b={bredde}
                tekst="Land ved Seinen"
                under="rundt utløpet av elva"
                farge={ROD}
                aktiv={false}
                synlig
            />
            <Kort
                x={venstre}
                y={400}
                b={bredde}
                tekst="Løfte om en kongsdatter"
                under="en av kongens døtre"
                farge={ROD}
                aktiv={beat === 0}
                synlig
            />
            <Kort
                x={hoyre}
                y={240}
                b={bredde}
                tekst="Forsvar mot vikinger"
                under="holder andre vikinger borte"
                farge={BLA}
                aktiv={false}
                synlig
            />
            <Kort
                x={hoyre}
                y={400}
                b={bredde}
                tekst="Lar seg døpe"
                under="blir kristen"
                farge={BLA}
                aktiv={beat === 1}
                synlig={beat >= 1}
            />
            <Kort
                x={hoyre}
                y={560}
                b={bredde}
                tekst="Blir kongens vasall"
                under="lover å være tro mot kongen"
                farge={BLA}
                aktiv={beat === 2}
                synlig={beat >= 2}
            />
        </>
    );
}

/* ---------- sprak ---------- */

function Panel({
    x,
    tittel,
    aktiv,
    children,
}: {
    x: number;
    tittel: string;
    aktiv: boolean;
    children: ReactNode;
}) {
    return (
        <g>
            <rect
                x={x}
                y={150}
                width={480}
                height={680}
                rx={30}
                fill="#ffffff"
                stroke={aktiv ? ROD : '#cbd5e1'}
                strokeWidth={aktiv ? 8 : 3}
            />
            <text
                x={x + 240}
                y={215}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={44}
                fontWeight={900}
                fill={MORK}
            >
                {tittel}
            </text>
            {children}
        </g>
    );
}

function Sprak({ beat }: { beat: number }) {
    const andel = beat === 1 ? 0.35 : beat >= 2 ? 0 : 1;
    return (
        <>
            <Tekst x={B / 2} y={80} storrelse={56} vekt={900}>
                Vikingene blir franske
            </Tekst>

            <Panel x={60} tittel="Navnet" aktiv={beat === 0}>
                <Tekst x={300} y={360} storrelse={64} vekt={900} farge={ROD}>
                    Normandie
                </Tekst>
                <Tekst x={300} y={440} storrelse={40} farge={GRA}>
                    landet til
                </Tekst>
                <Tekst x={300} y={520} storrelse={52} vekt={900}>
                    normannerne
                </Tekst>
                <Tekst x={300} y={600} storrelse={40} farge={GRA}>
                    altså
                </Tekst>
                <Tekst x={300} y={680} storrelse={52} vekt={900}>
                    nordmennene
                </Tekst>
            </Panel>

            <Panel x={560} tittel="Språket" aktiv={beat >= 1 && beat <= 3}>
                <Tekst x={800} y={300} storrelse={30} farge={GRA} vekt={700} synlig={beat >= 1}>
                    noen generasjoner senere
                </Tekst>
                <motion.rect
                    x={610}
                    y={340}
                    height={90}
                    rx={20}
                    fill={ROD}
                    initial={{ width: 380 }}
                    animate={{ width: 380 * andel }}
                    transition={{ duration: 2.4 }}
                />
                <motion.rect
                    x={610}
                    y={340}
                    width={380}
                    height={90}
                    rx={20}
                    fill={BLA}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 ? 1 - andel : 0 }}
                    transition={{ duration: 2.4 }}
                />
                <Tekst
                    x={800}
                    y={386}
                    storrelse={40}
                    vekt={900}
                    farge="#ffffff"
                    synlig={beat === 0}
                >
                    norrønt
                </Tekst>
                <Tekst x={800} y={386} storrelse={36} vekt={900} farge="#ffffff" synlig={beat >= 2}>
                    fransk dialekt
                </Tekst>
                <Tekst x={800} y={480} storrelse={32} farge={GRA} vekt={700} synlig={beat === 1}>
                    norrønt smelter inn
                </Tekst>
                <Tekst x={800} y={480} storrelse={32} farge={GRA} vekt={700} synlig={beat >= 2}>
                    det norrøne er borte
                </Tekst>
                <Vis synlig={beat >= 3}>
                    <g transform="translate(0 40)">
                        <path
                            d="M 600 760 C 660 700 700 720 750 660 C 800 610 860 640 920 590 L 1000 560 L 1000 800 L 600 800 Z"
                            fill="#bcd9ea"
                        />
                        <path
                            d="M 600 760 C 660 700 700 720 750 660 C 800 610 860 640 920 590 L 1000 560"
                            fill="none"
                            stroke="#7c9a5a"
                            strokeWidth={8}
                        />
                        {[
                            [640, 726],
                            [700, 702],
                            [760, 650],
                            [830, 628],
                            [900, 600],
                            [960, 574],
                        ].map(([x, y], i) => (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.2 }}
                            >
                                <circle cx={x} cy={y - 26} r={14} fill={ROD} />
                                <line
                                    x1={x}
                                    y1={y - 12}
                                    x2={x}
                                    y2={y}
                                    stroke={ROD}
                                    strokeWidth={5}
                                />
                            </motion.g>
                        ))}
                    </g>
                    <Tekst x={800} y={540} storrelse={34} vekt={800} farge={ROD}>
                        stedsnavn langs kysten
                    </Tekst>
                </Vis>
            </Panel>

            <Panel x={1060} tittel="Troen" aktiv={beat >= 4}>
                <Vis synlig={beat >= 4}>
                    <g transform="translate(1300 520)">
                        <rect
                            x={-120}
                            y={-60}
                            width={240}
                            height={180}
                            fill="#e7dcc4"
                            stroke={MORK}
                            strokeWidth={5}
                        />
                        <path
                            d="M -150 -55 L 0 -170 L 150 -55 Z"
                            fill="#9a3412"
                            stroke={MORK}
                            strokeWidth={5}
                        />
                        <rect x={-25} y={40} width={50} height={80} rx={25} fill={MORK} />
                        <path
                            d="M 0 -250 L 0 -170 M -28 -222 L 28 -222"
                            stroke={MORK}
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                    </g>
                    <Tekst x={1300} y={700} storrelse={44} vekt={900}>
                        kristne
                    </Tekst>
                    <Tekst x={1300} y={760} storrelse={34} farge={GRA} vekt={700}>
                        flere nye klostre
                    </Tekst>
                </Vis>
                <Tekst x={1300} y={480} storrelse={34} farge="#94a3b8" vekt={700} synlig={beat < 4}>
                    ?
                </Tekst>
            </Panel>
        </>
    );
}

/* ---------- ridder ---------- */

function Viking() {
    return (
        <g>
            <rect x={-30} y={-40} width={60} height={110} rx={10} fill={ROD} />
            <rect x={-28} y={70} width={22} height={90} fill="#3b3b46" />
            <rect x={6} y={70} width={22} height={90} fill="#3b3b46" />
            <circle cx={0} cy={-75} r={32} fill="#e7b98f" />
            <path d="M -34 -85 Q 0 -140 34 -85 Z" fill="#94a3b8" />
            <rect x={-20} y={-62} width={40} height={30} rx={8} fill="#c2410c" />
            <circle cx={-52} cy={20} r={48} fill="#facc15" stroke="#7f1d1d" strokeWidth={8} />
            <circle cx={-52} cy={20} r={10} fill="#7f1d1d" />
            <line
                x1={40}
                y1={-60}
                x2={60}
                y2={60}
                stroke="#5b3a1e"
                strokeWidth={10}
                strokeLinecap="round"
            />
            <path d="M 34 -70 Q 70 -80 66 -36 L 44 -44 Z" fill="#94a3b8" />
        </g>
    );
}

function Hest({ farge = '#8b5a2b' }: { farge?: string }) {
    return (
        <g>
            <rect x={-110} y={-20} width={220} height={80} rx={36} fill={farge} />
            {[-90, -60, 60, 90].map((x) => (
                <rect key={x} x={x - 10} y={40} width={20} height={100} rx={6} fill={farge} />
            ))}
            <path d="M -90 0 L -140 -90 L -110 -100 L -70 -20 Z" fill={farge} />
            <rect x={-185} y={-120} width={80} height={40} rx={16} fill={farge} />
            <path
                d="M 105 0 Q 150 20 140 80"
                stroke="#3f2a16"
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
            />
        </g>
    );
}

function Rytter({ ridder }: { ridder?: boolean }) {
    return (
        <g>
            <Hest farge={ridder ? '#5b3a1e' : '#8b5a2b'} />
            <rect
                x={-25}
                y={-110}
                width={50}
                height={90}
                rx={10}
                fill={ridder ? '#475569' : '#0f766e'}
            />
            <circle cx={0} cy={-140} r={28} fill="#e7b98f" />
            {ridder ? (
                <>
                    <path d="M -30 -145 Q 0 -200 30 -145 Z" fill="#94a3b8" />
                    <rect x={-4} y={-150} width={8} height={30} fill="#94a3b8" />
                    <path
                        d="M 20 -100 L 70 -100 L 45 -10 Z"
                        fill={ROD}
                        stroke="#facc15"
                        strokeWidth={6}
                    />
                    <line
                        x1={-200}
                        y1={-140}
                        x2={40}
                        y2={-70}
                        stroke="#5b3a1e"
                        strokeWidth={9}
                        strokeLinecap="round"
                    />
                </>
            ) : (
                <>
                    <path d="M -28 -150 Q 0 -185 28 -150 Z" fill="#0f766e" />
                    <line
                        x1={-120}
                        y1={-130}
                        x2={30}
                        y2={-70}
                        stroke="#5b3a1e"
                        strokeWidth={8}
                        strokeLinecap="round"
                    />
                </>
            )}
        </g>
    );
}

function Ridder({ beat }: { beat: number }) {
    return (
        <>
            <Tekst x={B / 2} y={80} storrelse={56} vekt={900}>
                Slik ble ridderen til
            </Tekst>
            <g transform="translate(250 470)">
                <Viking />
            </g>
            <Tekst x={250} y={720} storrelse={44} vekt={900} farge={ROD}>
                vikingen
            </Tekst>
            <Tekst x={250} y={780} storrelse={32} vekt={700} farge={GRA}>
                krigerånd og eventyrlyst
            </Tekst>

            <Tekst x={480} y={470} storrelse={110} vekt={900} farge={GRA} synlig={beat >= 2}>
                +
            </Tekst>

            <Vis synlig={beat >= 1}>
                <g transform="translate(750 520)">
                    <Rytter />
                </g>
                <Tekst x={740} y={720} storrelse={44} vekt={900} farge="#0f766e">
                    frankisk kavaleri
                </Tekst>
                <Tekst x={740} y={780} storrelse={32} vekt={700} farge={GRA}>
                    soldater til hest
                </Tekst>
            </Vis>

            <Tekst x={1015} y={470} storrelse={110} vekt={900} farge={GRA} synlig={beat >= 2}>
                =
            </Tekst>

            <Vis synlig={beat >= 2}>
                <motion.circle
                    cx={1300}
                    cy={450}
                    r={250}
                    fill="#facc15"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 3 ? 0.35 : 0.12 }}
                    transition={{ duration: 1 }}
                />
                <g transform="translate(1310 520)">
                    <Rytter ridder />
                </g>
                <Tekst x={1300} y={720} storrelse={44} vekt={900}>
                    normannisk ridder
                </Tekst>
                <Tekst x={1300} y={780} storrelse={32} vekt={700} farge={GRA} synlig={beat === 2}>
                    ridderkultur fra frankerriket
                </Tekst>
                <Tekst x={1300} y={780} storrelse={34} vekt={900} farge={ROD} synlig={beat >= 3}>
                    fryktet i hele Europa
                </Tekst>
            </Vis>
        </>
    );
}

/* ---------- arv ---------- */

function Ikon({
    x,
    y,
    tekst,
    children,
    synlig,
    forsinkelse,
}: {
    x: number;
    y: number;
    tekst: string;
    children: ReactNode;
    synlig: boolean;
    forsinkelse: number;
}) {
    return (
        <Vis synlig={synlig} forsinkelse={forsinkelse}>
            <g transform={`translate(${x} ${y}) scale(1.4)`}>
                <circle r={95} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
                {children}
            </g>
            <Tekst x={x} y={y + 175} storrelse={40} vekt={800}>
                {tekst}
            </Tekst>
        </Vis>
    );
}

function Arv({ beat }: { beat: number }) {
    const ord = Array.from({ length: 40 }, (_, i) => i);
    return (
        <>
            <Tekst x={B / 2} y={80} storrelse={56} vekt={900}>
                Arven etter Normandie
            </Tekst>

            {/* Del 1: ikke bare ødeleggere */}
            <Vis synlig={beat <= 1}>
                <g>
                    <rect
                        x={160}
                        y={260}
                        width={520}
                        height={160}
                        rx={26}
                        fill="#ffffff"
                        stroke="#cbd5e1"
                        strokeWidth={4}
                    />
                    <Tekst x={420} y={315} storrelse={34} vekt={700} farge={GRA}>
                        ikke bare
                    </Tekst>
                    <Tekst x={420} y={370} storrelse={52} vekt={900} farge={GRA}>
                        ødeleggere
                    </Tekst>
                    <Tekst x={800} y={340} storrelse={90} vekt={900} farge={GRA}>
                        →
                    </Tekst>
                    <rect
                        x={920}
                        y={260}
                        width={520}
                        height={160}
                        rx={26}
                        fill="#ffffff"
                        stroke={ROD}
                        strokeWidth={8}
                    />
                    <Tekst x={1180} y={315} storrelse={34} vekt={700} farge={GRA}>
                        også
                    </Tekst>
                    <Tekst x={1180} y={370} storrelse={52} vekt={900} farge={ROD}>
                        statsbyggere
                    </Tekst>
                </g>
                <Vis synlig={beat >= 1}>
                    {[
                        ['egen arv', 300],
                        ['frankisk', 800],
                        ['kristent', 1300],
                    ].map(([t, x]) => (
                        <g key={t}>
                            <Tekst x={Number(x)} y={560} storrelse={40} vekt={800}>
                                {t}
                            </Tekst>
                            <motion.path
                                d={`M ${x} 600 Q ${(Number(x) + 800) / 2} 700 800 760`}
                                fill="none"
                                stroke={GRA}
                                strokeWidth={6}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2 }}
                            />
                        </g>
                    ))}
                    <Tekst x={800} y={810} storrelse={40} vekt={900} farge={ROD}>
                        gjort til sitt eget
                    </Tekst>
                </Vis>
            </Vis>

            {/* Del 2: sporene i England */}
            <Vis synlig={beat === 2}>
                <Ikon x={400} y={420} tekst="engelske slott" synlig={beat === 2} forsinkelse={0}>
                    <rect x={-55} y={-30} width={110} height={80} fill="#a8a29e" />
                    {[-55, -20, 15, 40].map((x) => (
                        <rect key={x} x={x} y={-50} width={15} height={22} fill="#a8a29e" />
                    ))}
                    <rect x={-14} y={10} width={28} height={40} rx={14} fill={MORK} />
                </Ikon>
                <Ikon x={800} y={420} tekst="ridderkulturen" synlig={beat === 2} forsinkelse={0.3}>
                    <path
                        d="M -45 -50 L 45 -50 L 45 0 Q 45 50 0 70 Q -45 50 -45 0 Z"
                        fill={ROD}
                        stroke="#facc15"
                        strokeWidth={6}
                    />
                </Ikon>
                <Ikon x={1200} y={420} tekst="engelsk språk" synlig={beat === 2} forsinkelse={0.6}>
                    <rect x={-60} y={-40} width={120} height={70} rx={18} fill={BLA} />
                    <path d="M -20 30 L -40 60 L 10 30 Z" fill={BLA} />
                    <text
                        x={0}
                        y={-4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        abc
                    </text>
                </Ikon>
            </Vis>

            {/* Del 3: lånordene */}
            <Vis synlig={beat >= 3}>
                <rect
                    x={200}
                    y={300}
                    width={360}
                    height={130}
                    rx={26}
                    fill="#ffffff"
                    stroke={BLA}
                    strokeWidth={5}
                />
                <Tekst x={380} y={365} storrelse={46} vekt={900} farge={BLA}>
                    fransk
                </Tekst>
                <rect
                    x={1000}
                    y={300}
                    width={400}
                    height={130}
                    rx={26}
                    fill="#ffffff"
                    stroke={ROD}
                    strokeWidth={8}
                />
                <Tekst x={1200} y={365} storrelse={46} vekt={900} farge={ROD}>
                    engelsk
                </Tekst>
                {ord.map((i) => (
                    <motion.circle
                        key={i}
                        cx={600 + ((i * 37) % 360)}
                        cy={322 + ((i * 53) % 90)}
                        r={8}
                        fill={BLA}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= 3 ? 0.85 : 0 }}
                        transition={{ delay: beat >= 3 ? 0.3 + (i % 20) * 0.08 : 0, duration: 0.4 }}
                    />
                ))}
                <path d="M 965 365 L 985 365" stroke={BLA} strokeWidth={10} strokeLinecap="round" />
                <path
                    d="M 975 345 L 995 365 L 975 385"
                    fill="none"
                    stroke={BLA}
                    strokeWidth={8}
                    strokeLinecap="round"
                />
                <Tekst x={780} y={270} storrelse={36} vekt={800} farge={BLA}>
                    svært mange lånord
                </Tekst>
                <Tekst x={780} y={470} storrelse={32} vekt={700} farge={GRA}>
                    etter 1066
                </Tekst>
            </Vis>
            <Vis synlig={beat >= 4}>
                <rect
                    x={300}
                    y={600}
                    width={1000}
                    height={210}
                    rx={28}
                    fill="#ffffff"
                    stroke="#cbd5e1"
                    strokeWidth={4}
                />
                <Tekst x={800} y={650} storrelse={34} vekt={900}>
                    germanske språk: en familie av språk i slekt
                </Tekst>
                <rect x={360} y={700} width={520} height={80} rx={18} fill="#e2e8f0" />
                <Tekst x={620} y={741} storrelse={32} vekt={800} farge={GRA}>
                    de andre germanske språkene
                </Tekst>
                <motion.g initial={{ x: 0 }} animate={{ x: 60 }} transition={{ duration: 1.5 }}>
                    <rect x={940} y={700} width={240} height={80} rx={18} fill={ROD} />
                    <Tekst x={1060} y={741} storrelse={34} vekt={900} farge="#ffffff">
                        engelsk
                    </Tekst>
                </motion.g>
            </Vis>
        </>
    );
}
