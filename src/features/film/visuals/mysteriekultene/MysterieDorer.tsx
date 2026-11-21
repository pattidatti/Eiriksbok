import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { B, FARGE, H, Kort, Overskrift, Person, Pil, Tekst, Vis } from './felles';

/**
 * To dører i Roma: tempelet på torget (statens religion) og den lille døra ned til
 * mysteriet. Fire moduser med hvert sitt bilde:
 * - `staten`: tempelet, gaven til gudene og gaven tilbake (do ut des), og spørsmålet om døden.
 * - `mysteriet`: den lille døra. Myein, innvielsen og håpet.
 * - `eleusis`: hvem som slapp inn i Eleusis, de to kravene, taushetsplikten og Cicero.
 * - `kilder`: døra er lukket. Kildene står utenfor og snakker om det de ikke så.
 */

type Modus = 'staten' | 'mysteriet' | 'eleusis' | 'kilder';

const OVERSKRIFT: Record<Modus, string[]> = {
    staten: [
        'Statens religion: byen og riket',
        'Godt forhold til gudene',
        'Do ut des: jeg gir for at du skal gi',
        'Seier: ofring til Jupiter',
        'Hva skjer med deg når du dør?',
    ],
    mysteriet: [
        'Tålt, så lenge de ikke truet staten',
        'En mysteriekult: en hemmelig gruppe',
        'Myein: å lukke',
        'Innvielsen: seremonien som slipper deg inn',
        'Håp om noe bedre etter døden',
    ],
    eleusis: [
        'Hvem slapp inn i Eleusis?',
        'Krav 1: snakke gresk',
        'Krav 2: ikke blod på hendene',
        'Kvinner og slaver slapp inn',
        'Taushetsplikt',
        'Cicero om innvielsen',
    ],
    kilder: [
        'Hemmeligholdet virket',
        'Hva skjedde der inne?',
        'Hvem skrev om kultene?',
        'Tertullian, en kristen forfatter',
        'Ikke et nøytralt vitne',
        'Moderne forskere',
    ],
};

/** Tempelet med søyler og gavl. (x, y) er midt på bunnen av trappa. */
function Tempel({
    x,
    y,
    skala = 1,
    dempet = false,
}: {
    x: number;
    y: number;
    skala?: number;
    dempet?: boolean;
}) {
    const s = skala;
    const b = 420 * s;
    const farge = dempet ? '#d6cfc2' : '#f5efe2';
    const kant = dempet ? '#b7ae9e' : '#8b7f6a';
    return (
        <motion.g
            initial={false}
            animate={{ opacity: dempet ? 0.55 : 1 }}
            transition={{ duration: 0.8 }}
        >
            <rect
                x={x - b / 2 - 20 * s}
                y={y - 30 * s}
                width={b + 40 * s}
                height={30 * s}
                fill={farge}
                stroke={kant}
                strokeWidth={3}
            />
            <rect
                x={x - b / 2}
                y={y - 50 * s}
                width={b}
                height={20 * s}
                fill={farge}
                stroke={kant}
                strokeWidth={3}
            />
            {Array.from({ length: 6 }, (_, i) => (
                <rect
                    key={i}
                    x={x - b / 2 + 20 * s + i * ((b - 70 * s) / 5)}
                    y={y - 250 * s}
                    width={30 * s}
                    height={200 * s}
                    fill={farge}
                    stroke={kant}
                    strokeWidth={3}
                />
            ))}
            <rect
                x={x - b / 2 - 10 * s}
                y={y - 280 * s}
                width={b + 20 * s}
                height={30 * s}
                fill={farge}
                stroke={kant}
                strokeWidth={3}
            />
            <path
                d={`M ${x - b / 2 - 20 * s} ${y - 280 * s} L ${x} ${y - 370 * s} L ${x + b / 2 + 20 * s} ${y - 280 * s} Z`}
                fill={farge}
                stroke={kant}
                strokeWidth={3}
            />
        </motion.g>
    );
}

/** Den lille døra ned i bakken: en mørk åpning med trapp. (x, y) er bakkenivå midt på. */
function Dora({ x, y, apen, lys = false }: { x: number; y: number; apen: boolean; lys?: boolean }) {
    return (
        <g>
            <rect x={x - 110} y={y - 230} width={220} height={230} rx={14} fill="#8a7a66" />
            <path
                d={`M ${x - 80} ${y} L ${x - 80} ${y - 150} Q ${x} ${y - 215} ${x + 80} ${y - 150} L ${x + 80} ${y} Z`}
                fill="#1c140d"
            />
            {lys && (
                <motion.path
                    d={`M ${x - 80} ${y} L ${x - 80} ${y - 150} Q ${x} ${y - 215} ${x + 80} ${y - 150} L ${x + 80} ${y} Z`}
                    fill="#ffcf7a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
            )}
            {/* Dørbladet svinger inn når døra er åpen */}
            <motion.path
                d={`M ${x - 80} ${y} L ${x - 80} ${y - 150} Q ${x} ${y - 215} ${x + 80} ${y - 150} L ${x + 80} ${y} Z`}
                fill="#5b3a24"
                stroke="#3b2414"
                strokeWidth={4}
                initial={false}
                animate={{ opacity: apen ? 0 : 1 }}
                transition={{ duration: 0.8 }}
            />
        </g>
    );
}

function Hake({ x, y, synlig }: { x: number; y: number; synlig: boolean }) {
    return (
        <Vis synlig={synlig}>
            <circle cx={x} cy={y} r={30} fill={FARGE.gronn} />
            <path
                d={`M ${x - 14} ${y} L ${x - 3} ${y + 12} L ${x + 16} ${y - 12}`}
                fill="none"
                stroke="#fff"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Vis>
    );
}

/** Lås: brukes for taushet og for den lukkede døra. */
function Laas({
    x,
    y,
    synlig,
    farge = FARGE.mysterie,
}: {
    x: number;
    y: number;
    synlig: boolean;
    farge?: string;
}) {
    return (
        <Vis synlig={synlig}>
            <path
                d={`M ${x - 26} ${y - 20} L ${x - 26} ${y - 48} Q ${x} ${y - 82} ${x + 26} ${y - 48} L ${x + 26} ${y - 20}`}
                fill="none"
                stroke={farge}
                strokeWidth={12}
            />
            <rect x={x - 44} y={y - 24} width={88} height={70} rx={12} fill={farge} />
            <circle cx={x} cy={y + 6} r={9} fill="#fff" />
        </Vis>
    );
}

function Staten({ beat }: { beat: number }) {
    const dempet = beat >= 4;
    return (
        <>
            <svg width={1000} height={562} viewBox={`0 0 ${B} ${H}`} className="absolute inset-0">
                {/* Torget */}
                <rect x={0} y={760} width={B} height={140} fill="#e4d6bd" />
                <Tempel x={560} y={760} dempet={dempet} />
                {/* Gudene over tempelet */}
                <Vis synlig={beat >= 1 && beat <= 3}>
                    <ellipse
                        cx={560}
                        cy={190}
                        rx={210}
                        ry={60}
                        fill="#fff7e0"
                        stroke={FARGE.gull}
                        strokeWidth={5}
                    />
                    <Tekst x={560} y={204} storrelse={42} farge={FARGE.gull}>
                        {beat === 3 ? 'Jupiter' : 'Gudene'}
                    </Tekst>
                </Vis>
                {/* Folket på torget */}
                <Vis synlig={beat >= 1}>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <Person
                            key={i}
                            x={1050 + i * 85}
                            y={860}
                            farge={['#b45309', '#475569', '#7c2d12', '#64748b', '#a16207'][i]}
                            skala={0.85}
                        />
                    ))}
                    <Tekst x={1220} y={640} storrelse={38}>
                        Roma
                    </Tekst>
                </Vis>
                {/* Gave opp, gave ned */}
                <Pil
                    fra={[1150, 600]}
                    til={[790, 210]}
                    farge={FARGE.stat}
                    synlig={beat >= 1 && beat <= 3}
                    bue={0.15}
                />
                <Pil
                    fra={[330, 220]}
                    til={[300, 620]}
                    farge={FARGE.gronn}
                    synlig={beat >= 2 && beat <= 3}
                    bue={0.2}
                />
                <Tekst
                    x={1110}
                    y={380}
                    storrelse={34}
                    farge={FARGE.stat}
                    anker="start"
                    synlig={beat >= 2 && beat <= 3}
                >
                    Jeg gir ...
                </Tekst>
                <Tekst
                    x={60}
                    y={420}
                    storrelse={34}
                    farge={FARGE.gronn}
                    anker="start"
                    synlig={beat >= 2 && beat <= 3}
                >
                    ... for at du
                </Tekst>
                <Tekst
                    x={60}
                    y={465}
                    storrelse={34}
                    farge={FARGE.gronn}
                    anker="start"
                    synlig={beat >= 2 && beat <= 3}
                >
                    skal gi
                </Tekst>
                {/* Hærføreren i tog mot tempelet */}
                <Vis synlig={beat === 3}>
                    {[0, 1, 2, 3].map((i) => (
                        <motion.g
                            key={i}
                            initial={{ x: 300 }}
                            animate={{ x: 0 }}
                            transition={{ duration: 2.5, ease: 'easeOut' }}
                        >
                            <Person
                                x={120 + i * 80}
                                y={860}
                                farge={i === 0 ? FARGE.rod : '#7f1d1d'}
                                skala={i === 0 ? 1 : 0.8}
                            />
                        </motion.g>
                    ))}
                </Vis>
                {/* Spørsmålet om døden */}
                <Vis synlig={beat >= 4}>
                    <text
                        x={560}
                        y={560}
                        textAnchor="middle"
                        fontSize={260}
                        fontWeight={900}
                        fill={FARGE.rod}
                        opacity={0.9}
                    >
                        ?
                    </text>
                </Vis>
            </svg>
            <Kort synlig={beat === 3} venstre={20} topp={100} bredde={230} farge={FARGE.rod}>
                Ofring til gudene og maktshow på én gang
            </Kort>
            <Kort
                synlig={beat >= 4}
                venstre={640}
                topp={150}
                bredde={320}
                farge={FARGE.rod}
                storrelse={24}
            >
                Statens religion: nesten ingenting om livet etter døden
            </Kort>
        </>
    );
}

function Mysteriet({ beat }: { beat: number }) {
    return (
        <>
            <svg width={1000} height={562} viewBox={`0 0 ${B} ${H}`} className="absolute inset-0">
                <rect x={0} y={760} width={B} height={140} fill="#e4d6bd" />
                <Tempel x={300} y={760} skala={0.7} dempet />
                <Dora x={1100} y={760} apen={beat === 0 || beat >= 3} lys={beat >= 4} />
                {/* Gruppa inne bak døra */}
                <Vis synlig={beat >= 1 && beat !== 2}>
                    {[0, 1, 2].map((i) => (
                        <Person
                            key={i}
                            x={1340 + i * 80}
                            y={880}
                            farge={FARGE.mysterie}
                            skala={0.7}
                        />
                    ))}
                </Vis>
                {/* Myein: lås over døra og et stort ord */}
                <Laas x={1100} y={440} synlig={beat === 2} />
                <Vis synlig={beat === 2}>
                    <text
                        x={620}
                        y={300}
                        textAnchor="middle"
                        fontSize={130}
                        fontWeight={900}
                        fill={FARGE.mysterie}
                    >
                        myein
                    </text>
                    <Tekst x={620} y={380} storrelse={48}>
                        gresk: å lukke
                    </Tekst>
                </Vis>
                {/* Den nye går inn */}
                <Vis synlig={beat === 3}>
                    <motion.g
                        initial={{ x: -260, opacity: 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 3, ease: 'easeInOut' }}
                    >
                        <Person x={1100} y={760} farge="#b45309" skala={0.9} />
                    </motion.g>
                </Vis>
            </svg>
            <Kort synlig={beat === 0} venstre={500} topp={140} bredde={330} farge={FARGE.stat}>
                Det åpnet døra for noe annet
            </Kort>
            <Kort synlig={beat === 1} venstre={380} topp={140} bredde={340} farge={FARGE.mysterie}>
                En religiøs opplevelse for hver enkelt
            </Kort>
            <Kort synlig={beat === 3} venstre={330} topp={140} bredde={330} farge={FARGE.mysterie}>
                Etterpå visste du ting de andre ikke visste
            </Kort>
        </>
    );
}

function Eleusis({ beat }: { beat: number }) {
    const folk = [
        { navn: 'Mann', farge: '#475569' },
        { navn: 'Kvinne', farge: '#be185d' },
        { navn: 'Slave', farge: '#92400e' },
    ];
    const uthev = beat === 3;
    return (
        <>
            <svg width={1000} height={562} viewBox={`0 0 ${B} ${H}`} className="absolute inset-0">
                <rect x={0} y={760} width={B} height={140} fill="#e9dcc0" />
                <Dora x={1260} y={760} apen={beat <= 3} lys={beat >= 5} />
                {folk.map((f, i) => (
                    <motion.g
                        key={f.navn}
                        initial={false}
                        animate={{ opacity: uthev && i === 0 ? 0.3 : 1 }}
                    >
                        <Person x={260 + i * 230} y={760} farge={f.farge} skala={1.15} />
                        <Tekst x={260 + i * 230} y={820} storrelse={38}>
                            {f.navn}
                        </Tekst>
                        <Hake x={260 + i * 230 + 70} y={560} synlig={beat >= 2 && beat <= 3} />
                    </motion.g>
                ))}
                <Tekst x={1260} y={490} storrelse={44} farge={FARGE.mysterie}>
                    Eleusis
                </Tekst>
                <Laas x={1260} y={640} synlig={beat === 4} farge={FARGE.rod} />
            </svg>
            <Kort synlig={beat === 0} venstre={100} topp={110} bredde={420} farge={FARGE.gronn}>
                Alle grekere kunne delta
            </Kort>
            <Kort
                synlig={beat >= 1 && beat <= 3}
                venstre={60}
                topp={100}
                bredde={270}
                farge={FARGE.gronn}
            >
                1. Kunne snakke gresk
            </Kort>
            <Kort
                synlig={beat >= 2 && beat <= 3}
                venstre={350}
                topp={100}
                bredde={300}
                farge={FARGE.gronn}
            >
                2. Ikke blod på hendene: ikke ha drept noen
            </Kort>
            <Kort
                synlig={beat === 4}
                venstre={110}
                topp={130}
                bredde={480}
                farge={FARGE.rod}
                storrelse={26}
            >
                Brøt du taushetsplikten, kunne straffen være døden
            </Kort>
            <Kort
                synlig={beat >= 5}
                venstre={70}
                topp={110}
                bredde={540}
                farge={FARGE.fakkel}
                storrelse={24}
            >
                Cicero, romersk forfatter: Innvielsen ga kunnskap om å leve et lykkelig liv, og om å
                møte døden med større håp.
            </Kort>
        </>
    );
}

function Kilder({ beat }: { beat: number }) {
    return (
        <>
            <svg width={1000} height={562} viewBox={`0 0 ${B} ${H}`} className="absolute inset-0">
                <rect x={0} y={760} width={B} height={140} fill="#e4d6bd" />
                <Dora x={800} y={760} apen={false} />
                <Laas x={800} y={650} synlig={beat === 0} />
                <Vis synlig={beat >= 1}>
                    <text
                        x={800}
                        y={460}
                        textAnchor="middle"
                        fontSize={200}
                        fontWeight={900}
                        fill={FARGE.mysterie}
                    >
                        ?
                    </text>
                </Vis>
                {/* To slags kilder utenfor døra */}
                <Vis synlig={beat >= 2}>
                    <Person x={260} y={760} farge="#475569" skala={1.1} />
                    <Person x={1340} y={760} farge={FARGE.rod} skala={1.1} />
                </Vis>
            </svg>
            <Kort synlig={beat >= 2} venstre={30} topp={130} bredde={290} farge="#475569">
                Forfattere fra antikken, som Platon
            </Kort>
            <Kort synlig={beat === 2} venstre={680} topp={130} bredde={290} farge={FARGE.rod}>
                Kristne forfattere som ville ta kultene ned
            </Kort>
            <Kort
                synlig={beat >= 3 && beat <= 4}
                venstre={640}
                topp={110}
                bredde={330}
                farge={FARGE.rod}
                storrelse={21}
            >
                Tertullian mente: Mithras-mysteriene var djevelske etterlikninger av kristne
                ritualer
            </Kort>
            <Kort synlig={beat === 4} venstre={640} topp={250} bredde={330} farge={FARGE.rod}>
                Sier mye om Tertullian, lite om rommet
            </Kort>
            <Kort
                synlig={beat >= 5}
                venstre={610}
                topp={120}
                bredde={360}
                farge={FARGE.gronn}
                storrelse={21}
            >
                Moderne forskere: Mithras-kulten og kristendommen må ha påvirket hverandre lite
            </Kort>
        </>
    );
}

export function MysterieDorer({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'staten';
    const tekster = OVERSKRIFT[modus];
    return (
        <Flate bakgrunn={FARGE.bakgrunn}>
            {modus === 'staten' && <Staten beat={beat} />}
            {modus === 'mysteriet' && <Mysteriet beat={beat} />}
            {modus === 'eleusis' && <Eleusis beat={beat} />}
            {modus === 'kilder' && <Kilder beat={beat} />}
            <Overskrift tekst={tekster[Math.min(beat, tekster.length - 1)]} />
        </Flate>
    );
}
