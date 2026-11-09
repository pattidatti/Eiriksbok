import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Lapp } from './Lapp';

/**
 * Perioder og forfattere i 2D.
 * «glansbilde»: nasjonalromantikkens vakre bilde av Norge, som sprekker rundt 1870.
 * «fire»: de fire store, og Ibsen som avslører løgner.
 * «bjornson-lie»: Bjørnson og En hanske, Lie og kvinnesaken.
 * «slutten»: realismen tar slutt rundt 1890, og litteraturen som våpen.
 */

type Modus = 'glansbilde' | 'fire' | 'bjornson-lie' | 'slutten';

const B = 1600;
const H = 900;

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <motion.text
            key={tekst}
            x={B / 2}
            y={110}
            textAnchor="middle"
            fontSize={66}
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

/* ------------------------------------------------------------------ glansbildet */

function Glansbilde({ beat }: { beat: number }) {
    const sprukket = beat >= 3;
    const byen = beat >= 4;
    const overskrifter = [
        'Nasjonalromantikken',
        'Naturen, bøndene, historien',
        'Et glansbilde',
        'Rundt 1870: stopp!',
        'Virkeligheten bak bildet',
    ];
    // Bildet: x 400-1200, y 190-760
    return (
        <>
            <Overskrift tekst={overskrifter[Math.min(beat, 4)]} />
            {/* Byen bak bildet: grå og trang */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: byen ? 1 : 0 }}
                transition={{ duration: 1 }}
            >
                <rect x={400} y={190} width={800} height={570} fill="#475569" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <rect
                        key={i}
                        x={430 + i * 128}
                        y={420 - (i % 3) * 50}
                        width={110}
                        height={340 + (i % 3) * 50}
                        fill={i % 2 ? '#334155' : '#3f4b5e'}
                    />
                ))}
                {[0, 1].map((i) => (
                    <g key={i}>
                        <rect x={520 + i * 420} y={250} width={40} height={180} fill="#1e293b" />
                        <motion.circle
                            cx={540 + i * 420}
                            cy={225}
                            r={36}
                            fill="#94a3b8"
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                    </g>
                ))}
                <Lapp
                    x={800}
                    y={600}
                    tekst="Urettferdighet ingen snakket om"
                    fs={44}
                    fyll="#fef2f2"
                    farge="#991b1b"
                    vis={byen}
                    forsinkelse={0.8}
                />
            </motion.g>
            {/* Glansbildet: to halvdeler som sprekker fra hverandre */}
            {[0, 1].map((side) => (
                <motion.g
                    key={side}
                    animate={{
                        x: byen ? (side === 0 ? -360 : 360) : 0,
                        opacity: byen ? 0.25 : 1,
                    }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                >
                    <clipPath id={`halv-${side}`}>
                        {side === 0 ? (
                            <path d="M 380 170 L 830 170 L 770 330 L 850 480 L 760 640 L 810 780 L 380 780 Z" />
                        ) : (
                            <path d="M 830 170 L 1220 170 L 1220 780 L 810 780 L 760 640 L 850 480 L 770 330 Z" />
                        )}
                    </clipPath>
                    <g clipPath={`url(#halv-${side})`}>
                        <Landskap beat={beat} />
                    </g>
                </motion.g>
            ))}
            {/* Sprekken */}
            <motion.path
                d="M 830 190 L 770 330 L 850 480 L 760 640 L 810 760"
                fill="none"
                stroke="#0f172a"
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{
                    pathLength: sprukket && !byen ? 1 : 0,
                    opacity: sprukket && !byen ? 1 : 0,
                }}
                transition={{ duration: 1.2, delay: 0.4 }}
            />
        </>
    );
}

function Landskap({ beat }: { beat: number }) {
    const glans = beat >= 2;
    return (
        <>
            {/* Ramme */}
            <rect x={400} y={190} width={800} height={570} fill={glans ? '#e9b949' : '#d6c7a1'} />
            <rect x={424} y={214} width={752} height={522} fill="#bfe3f5" />
            {/* Sol */}
            <circle cx={1040} cy={300} r={54} fill="#fde68a" />
            {/* Fjell */}
            <path
                d="M 424 600 L 560 340 L 650 470 L 760 300 L 900 520 L 1010 380 L 1176 600 Z"
                fill="#6b8fb3"
            />
            <path
                d="M 560 340 L 600 418 L 525 408 Z M 760 300 L 812 380 L 715 386 Z M 1010 380 L 1050 440 L 975 440 Z"
                fill="#ffffff"
            />
            {/* Fjorden */}
            <rect x={424} y={600} width={752} height={136} fill="#3b82c4" />
            {/* Vikingskipet: den gamle historien */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
            >
                <path
                    d="M 860 650 Q 940 700 1040 650 L 1060 628 L 1040 640 Q 940 680 870 640 L 848 626 Z"
                    fill="#7c2d12"
                />
                <rect x={948} y={560} width={6} height={86} fill="#451a03" />
                <path d="M 912 566 L 990 566 L 984 628 L 918 628 Z" fill="#dc2626" />
            </motion.g>
            {/* Bonden på enga */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
            >
                <rect x={424} y={560} width={300} height={50} fill="#65a30d" />
                <path d="M 560 600 L 600 600 L 590 520 L 570 520 Z" fill="#1e3a8a" />
                <circle cx={580} cy={505} r={20} fill="#f1c9a5" />
                <rect x={556} y={480} width={48} height={10} fill="#111827" />
                <rect x={566} y={462} width={28} height={22} fill="#111827" />
            </motion.g>
            {/* Glansen */}
            {glans && (
                <motion.rect
                    x={424}
                    y={214}
                    width={160}
                    height={522}
                    fill="#ffffff"
                    initial={{ opacity: 0, x: -200 }}
                    animate={{ opacity: [0, 0.45, 0], x: [-200, 700, 900] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2 }}
                />
            )}
        </>
    );
}

function GlansLapper({ beat }: { beat: number }) {
    if (beat !== 1) return null;
    return (
        <>
            <Lapp
                x={250}
                y={420}
                tekst="Naturen"
                fs={40}
                fyll="#ecfdf5"
                farge="#065f46"
                forsinkelse={0.2}
            />
            <Lapp
                x={250}
                y={540}
                tekst="Bøndene"
                fs={40}
                fyll="#eff6ff"
                farge="#1e3a8a"
                forsinkelse={0.6}
            />
            <Lapp
                x={1370}
                y={540}
                tekst="Historien"
                fs={40}
                fyll="#fef2f2"
                farge="#7c2d12"
                forsinkelse={1.2}
            />
        </>
    );
}

/* ------------------------------------------------------------------ de fire store */

const FIRE = [
    { navn: 'Henrik Ibsen', farge: '#1e3a8a', bokstav: 'I' },
    { navn: 'Bjørnstjerne Bjørnson', farge: '#b45309', bokstav: 'B' },
    { navn: 'Alexander Kielland', farge: '#0f766e', bokstav: 'K' },
    { navn: 'Jonas Lie', farge: '#7e22ce', bokstav: 'L' },
];

function Portrett({
    x,
    y,
    farge,
    bokstav,
    r = 70,
}: {
    x: number;
    y: number;
    farge: string;
    bokstav: string;
    r?: number;
}) {
    return (
        <g>
            <circle cx={x} cy={y} r={r} fill={farge} />
            <text
                x={x}
                y={y + r * 0.36}
                textAnchor="middle"
                fontSize={r}
                fontWeight={900}
                fill="#ffffff"
            >
                {bokstav}
            </text>
        </g>
    );
}

function FireStore({ beat }: { beat: number }) {
    const ibsen = beat >= 2;
    return (
        <>
            <Overskrift
                tekst={beat === 0 ? 'Fra 1860-årene til århundreskiftet' : 'De fire store'}
            />
            {/* Tidslinja */}
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.rect
                        x={260}
                        y={430}
                        height={36}
                        rx={18}
                        fill="#1e3a8a"
                        initial={{ width: 0 }}
                        animate={{ width: 1080 }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                    />
                    <text x={260} y={540} fontSize={40} fontWeight={800} fill="#0f172a">
                        1860-årene
                    </text>
                    <text
                        x={1340}
                        y={540}
                        fontSize={40}
                        fontWeight={800}
                        fill="#0f172a"
                        textAnchor="end"
                    >
                        århundreskiftet
                    </text>
                    <text
                        x={800}
                        y={370}
                        fontSize={46}
                        fontWeight={800}
                        fill="#334155"
                        textAnchor="middle"
                    >
                        Fire forfattere satte tonen
                    </text>
                </motion.g>
            )}
            {beat >= 1 &&
                FIRE.map((f, i) => {
                    const cx = 260 + i * 360;
                    const erIbsen = i === 0;
                    const dim = ibsen && !erIbsen;
                    return (
                        <motion.g
                            key={f.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= 1 ? (dim ? 0.3 : 1) : 0 }}
                            transition={{ duration: 0.6, delay: beat === 1 ? 0.4 + i * 0.9 : 0 }}
                        >
                            <rect
                                x={cx - 160}
                                y={230}
                                width={320}
                                height={380}
                                rx={28}
                                fill="#ffffff"
                                stroke={f.farge}
                                strokeWidth={erIbsen && ibsen ? 10 : 4}
                            />
                            <Portrett x={cx} y={350} farge={f.farge} bokstav={f.bokstav} />
                            {f.navn.split(' ').map((del, j) => (
                                <text
                                    key={del}
                                    x={cx}
                                    y={490 + j * 50}
                                    textAnchor="middle"
                                    fontSize={40}
                                    fontWeight={800}
                                    fill="#0f172a"
                                >
                                    {del}
                                </text>
                            ))}
                        </motion.g>
                    );
                })}
            <Lapp
                x={800}
                y={730}
                tekst="Spilles fortsatt over hele verden"
                fs={44}
                fyll="#1e3a8a"
                farge="#ffffff"
                vis={beat === 2}
                forsinkelse={0.6}
            />
            <Lapp
                x={800}
                y={700}
                tekst="En folkefiende, 1882"
                fs={48}
                fyll="#0f172a"
                farge="#ffffff"
                vis={beat >= 3}
                forsinkelse={0.3}
            />
            <Lapp
                x={800}
                y={800}
                tekst="En mester i å avsløre løgner"
                fs={40}
                fyll="#fef3c7"
                farge="#78350f"
                vis={beat >= 3}
                forsinkelse={1.2}
            />
        </>
    );
}

/* ------------------------------------------------------------------ Bjørnson og Lie */

function BjornsonLie({ beat }: { beat: number }) {
    const lie = beat >= 2;
    return (
        <>
            <Overskrift tekst={lie ? 'Jonas Lie' : 'Bjørnstjerne Bjørnson'} />
            {/* Bjørnson til venstre */}
            <motion.g animate={{ opacity: lie ? 0.3 : 1 }} transition={{ duration: 0.6 }}>
                <rect
                    x={120}
                    y={180}
                    width={640}
                    height={640}
                    rx={32}
                    fill="#ffffff"
                    stroke="#b45309"
                    strokeWidth={lie ? 4 : 10}
                />
                <Portrett x={440} y={300} farge="#b45309" bokstav="B" r={80} />
                <Lapp
                    x={440}
                    y={450}
                    tekst="Politikk, skole, moral"
                    fs={38}
                    fyll="#fef3c7"
                    farge="#78350f"
                    vis={beat === 0}
                    forsinkelse={0.5}
                />
                {beat >= 1 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: beat === 1 ? 0.3 : 0 }}
                    >
                        <text
                            x={440}
                            y={460}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            En hanske, 1883
                        </text>
                        <Vekt />
                        <text
                            x={440}
                            y={790}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={700}
                            fill="#334155"
                        >
                            Samme krav til begge
                        </text>
                    </motion.g>
                )}
            </motion.g>
            {/* Lie til høyre */}
            <motion.g animate={{ opacity: lie ? 1 : 0.3 }} transition={{ duration: 0.6 }}>
                <rect
                    x={840}
                    y={180}
                    width={640}
                    height={640}
                    rx={32}
                    fill="#ffffff"
                    stroke="#7e22ce"
                    strokeWidth={lie ? 10 : 4}
                />
                <Portrett x={1160} y={300} farge="#7e22ce" bokstav="L" r={80} />
                {lie && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <text
                            x={1160}
                            y={460}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            Familieromaner
                        </text>
                        {/* Hjemmet med et hjerte */}
                        <path
                            d="M 1060 640 L 1060 560 L 1160 490 L 1260 560 L 1260 640 Z"
                            fill="#ede9fe"
                            stroke="#7e22ce"
                            strokeWidth={5}
                        />
                        <path
                            d="M 1160 625 C 1110 590 1120 552 1145 556 C 1155 557 1160 566 1160 572 C 1160 566 1165 557 1175 556 C 1200 552 1210 590 1160 625 Z"
                            fill="#db2777"
                        />
                        <text
                            x={1160}
                            y={700}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#334155"
                        >
                            Hjem, samliv, tanker og følelser
                        </text>
                    </motion.g>
                )}
                <Lapp
                    x={1160}
                    y={775}
                    tekst="1884: Norsk Kvinnesaksforening"
                    fs={32}
                    fyll="#7e22ce"
                    farge="#ffffff"
                    vis={beat >= 3}
                    forsinkelse={0.4}
                />
            </motion.g>
        </>
    );
}

/** En skålvekt i likevekt: mann og kvinne, samme krav. */
function Vekt() {
    return (
        <g>
            <rect x={436} y={540} width={8} height={170} fill="#475569" />
            <rect x={380} y={706} width={120} height={14} rx={6} fill="#475569" />
            <rect x={270} y={536} width={340} height={10} rx={5} fill="#475569" />
            <path
                d="M 280 546 L 250 610 L 370 610 L 340 546"
                fill="none"
                stroke="#475569"
                strokeWidth={4}
            />
            <path
                d="M 540 546 L 510 610 L 630 610 L 600 546"
                fill="none"
                stroke="#475569"
                strokeWidth={4}
            />
            <rect x={250} y={606} width={120} height={12} rx={6} fill="#b45309" />
            <rect x={510} y={606} width={120} height={12} rx={6} fill="#b45309" />
            <text x={310} y={670} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                Mann
            </text>
            <text x={570} y={670} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                Kvinne
            </text>
        </g>
    );
}

/* ------------------------------------------------------------------ slutten */

const PERIODER = [
    { navn: 'Nasjonalromantikken', x: 70, b: 480, farge: '#94a3b8' },
    { navn: 'Realismen', x: 570, b: 460, farge: '#1e3a8a' },
    { navn: 'Nyromantikken', x: 1050, b: 480, farge: '#7e22ce' },
];

function Slutten({ beat }: { beat: number }) {
    const vapen = beat >= 2;
    return (
        <>
            <Overskrift
                tekst={
                    vapen
                        ? 'Litteratur som våpen'
                        : beat === 1
                          ? 'Neste periode: nyromantikken'
                          : 'Rundt 1890: slutt'
                }
            />
            {!vapen && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    {PERIODER.map((p, i) => {
                        const aktiv = (beat === 0 && i === 1) || (beat === 1 && i === 2);
                        return (
                            <g key={p.navn}>
                                <motion.rect
                                    x={p.x}
                                    y={250}
                                    width={p.b}
                                    height={130}
                                    rx={24}
                                    fill={aktiv ? p.farge : '#e2e8f0'}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6 }}
                                />
                                <text
                                    x={p.x + p.b / 2}
                                    y={330}
                                    textAnchor="middle"
                                    fontSize={i === 1 ? 46 : 34}
                                    fontWeight={900}
                                    fill={aktiv ? '#ffffff' : '#334155'}
                                >
                                    {p.navn}
                                </text>
                            </g>
                        );
                    })}
                    <text
                        x={570}
                        y={440}
                        fontSize={36}
                        fontWeight={800}
                        fill="#0f172a"
                        textAnchor="middle"
                    >
                        1870
                    </text>
                    <text
                        x={1030}
                        y={440}
                        fontSize={36}
                        fontWeight={800}
                        fill="#0f172a"
                        textAnchor="middle"
                    >
                        1890
                    </text>
                    {/* Lei av problemene */}
                    {beat === 0 && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            {['Problemer', 'Kloakk', 'Fattigdom'].map((o, i) => (
                                <Lapp
                                    key={o}
                                    x={480 + i * 320}
                                    y={580}
                                    tekst={o}
                                    fs={44}
                                    fyll="#e2e8f0"
                                    farge="#334155"
                                    vis={beat === 0}
                                    forsinkelse={0.6 + i * 0.5}
                                />
                            ))}
                            <text
                                x={800}
                                y={720}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={800}
                                fill="#475569"
                            >
                                Folk ble lei
                            </text>
                        </motion.g>
                    )}
                    {/* Mystikk og drømmer */}
                    {beat === 1 && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                <motion.circle
                                    key={i}
                                    cx={1090 + ((i * 53) % 360)}
                                    cy={470 + ((i * 37) % 120)}
                                    r={6}
                                    fill="#a855f7"
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                                />
                            ))}
                            <Lapp
                                x={800}
                                y={680}
                                tekst="Mystikk, drømmer, det uforklarlige"
                                fs={46}
                                fyll="#f3e8ff"
                                farge="#581c87"
                                forsinkelse={0.5}
                            />
                        </motion.g>
                    )}
                </motion.g>
            )}
            {/* Boka som våpen */}
            {vapen && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <g transform="translate(800 470)">
                        <path d="M -230 -150 L 0 -120 L 0 170 L -230 140 Z" fill="#1e3a8a" />
                        <path d="M 230 -150 L 0 -120 L 0 170 L 230 140 Z" fill="#1d4ed8" />
                        {[0, 1, 2, 3].map((i) => (
                            <g key={i}>
                                <rect
                                    x={-200}
                                    y={-90 + i * 50}
                                    width={170}
                                    height={10}
                                    fill="#bfdbfe"
                                />
                                <rect
                                    x={30}
                                    y={-90 + i * 50}
                                    width={170}
                                    height={10}
                                    fill="#bfdbfe"
                                />
                            </g>
                        ))}
                    </g>
                    <text
                        x={800}
                        y={740}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Skriv om det som er galt
                    </text>
                </motion.g>
            )}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <path
                    d="M 560 460 L 470 460"
                    stroke="#0f172a"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <path
                    d="M 490 430 L 460 460 L 490 490"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <path
                    d="M 1040 460 L 1110 460"
                    stroke="#0f172a"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <path
                    d="M 1090 430 L 1120 460 L 1090 490"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
            </motion.g>
            <Lapp
                x={260}
                y={340}
                tekst="Politikere"
                fs={44}
                fyll="#0f766e"
                farge="#ffffff"
                vis={beat >= 3}
                forsinkelse={0.4}
            />
            <Lapp
                x={260}
                y={460}
                tekst="endrer lover"
                fs={40}
                fyll="#ccfbf1"
                farge="#134e4a"
                vis={beat >= 3}
                forsinkelse={0.7}
            />
            <Lapp
                x={1340}
                y={340}
                tekst="Vanlige folk"
                fs={44}
                fyll="#b45309"
                farge="#ffffff"
                vis={beat >= 3}
                forsinkelse={1.2}
            />
            <Lapp
                x={1340}
                y={460}
                tekst="endrer meninger"
                fs={40}
                fyll="#fef3c7"
                farge="#78350f"
                vis={beat >= 3}
                forsinkelse={1.5}
            />
        </>
    );
}

export function RealismenTid({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'glansbilde';
    return (
        <div className="absolute inset-0" style={{ background: '#f5efe3' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                {modus === 'glansbilde' && (
                    <>
                        <Glansbilde beat={beat} />
                        <GlansLapper beat={beat} />
                    </>
                )}
                {modus === 'fire' && <FireStore beat={beat} />}
                {modus === 'bjornson-lie' && <BjornsonLie beat={beat} />}
                {modus === 'slutten' && <Slutten beat={beat} />}
            </svg>
        </div>
    );
}
