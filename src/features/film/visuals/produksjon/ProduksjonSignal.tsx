import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { B, Boks, FARGE, H, Overskrift, Pil, Tekst, Vis } from './felles';

/**
 * Hvem bestemmer hva som lages? Fire moduser i SVG:
 * - «plan»: staten på toppen, fabrikkene under, og velgerne som stemmer på løfter.
 * - «marked»: ingen sjef, bare handel mellom folk og bedrifter, og prisen i midten.
 * - «sjokolade»: kjøpet ditt blir et signal til fabrikken.
 * - «resultat»: hva varen kostet mot hva den ble solgt for. Overskudd og underskudd.
 */

type Modus = 'plan' | 'marked' | 'sjokolade' | 'resultat';

const OVERSKRIFT: Record<Modus, string[]> = {
    plan: ['Planøkonomi', 'Det offentlige har kontrollen', 'Fellesskapet bestemmer', 'Også i et demokrati', 'Betalt over skatten'],
    marked: ['Markedsøkonomi', 'Handel mellom folk og bedrifter', 'Tilbud og etterspørsel gir pris', 'Prisen styrer'],
    sjokolade: ['Du kjøper en sjokolade', 'Et signal til fabrikken', 'Forbrukersuverenitet', 'Bedriften gjetter hva du vil ha'],
    resultat: ['Traff bedriften blink?', 'Overskudd', 'Ingen vil ha varen', 'Underskudd'],
};

/** En liten person. */
function Folk({ x, y, farge = FARGE.stat, skala = 1 }: { x: number; y: number; farge?: string; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-70} r={24} fill="#e8b48c" />
            <rect x={-28} y={-42} width={56} height={84} rx={22} fill={farge} />
        </g>
    );
}

/** En fabrikk med sagtak og pipe. */
function Fabrikk({ x, y, farge = '#b45343', skala = 1 }: { x: number; y: number; farge?: string; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <rect x={60} y={-150} width={30} height={90} fill="#64748b" />
            <path d="M -100 -40 L -100 -90 L -50 -60 L -50 -90 L 0 -60 L 0 -90 L 50 -60 L 100 -60 L 100 -40 Z" fill="#475569" />
            <rect x={-100} y={-40} width={200} height={100} fill={farge} />
            {[-70, -20, 30].map((dx) => (
                <rect key={dx} x={dx} y={-15} width={36} height={30} fill="#fef9c3" />
            ))}
        </g>
    );
}

function Plan({ beat }: { beat: number }) {
    const velgere = beat >= 3;
    return (
        <>
            {/* Staten øverst */}
            <motion.g initial={false} animate={{ y: beat === 0 ? 180 : 0 }} transition={{ duration: 1 }}>
                <path d="M 640 210 L 800 140 L 960 210 Z" fill={FARGE.stat} />
                <rect x={660} y={210} width={280} height={110} fill="#dbeafe" stroke={FARGE.stat} strokeWidth={6} />
                {[690, 750, 810, 870].map((x) => (
                    <rect key={x} x={x} y={225} width={24} height={80} fill={FARGE.stat} />
                ))}
                <Tekst x={800} y={370} storrelse={40}>
                    Staten
                </Tekst>
            </motion.g>
            <Vis synlig={beat === 1}>
                <Tekst x={800} y={422} storrelse={34} farge={FARGE.gra} vekt={700}>
                    eller kommunen
                </Tekst>
            </Vis>
            {/* Det staten har kontroll over */}
            <Vis synlig={beat >= 1 && beat <= 2}>
                <Fabrikk x={330} y={640} farge="#94a3b8" />
                <Tekst x={330} y={760}>
                    Fabrikkene
                </Tekst>
                <Boks x={800} y={640} b={300} h={140} farge={FARGE.stat} tittel="Varene" />
                <Boks x={1270} y={640} b={300} h={140} farge={FARGE.stat} tittel="Tjenestene" />
                {[330, 800, 1270].map((x) => (
                    <line key={x} x1={800} y1={430} x2={x} y2={540} stroke={FARGE.stat} strokeWidth={5} strokeDasharray="12 10" />
                ))}
            </Vis>
            <Vis synlig={beat === 2}>
                <Pil fra={[700, 420]} til={[380, 540]} farge={FARGE.stat} synlig={beat === 2} bue={0.1} />
                <Pil fra={[900, 420]} til={[1220, 540]} farge={FARGE.stat} synlig={beat === 2} bue={-0.1} />
                <rect x={600} y={820} width={400} height={64} rx={16} fill={FARGE.stat} />
                <text x={800} y={864} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                    Lag dette!
                </text>
            </Vis>
            {/* Velgerne og løftene */}
            <Vis synlig={velgere}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Folk key={i} x={500 + i * 120} y={790} farge={['#16a34a', '#f59e0b', '#db2777', '#0ea5e9', '#7c3aed', '#16a34a'][i]} />
                ))}
                <Tekst x={800} y={880} storrelse={30}>
                    Velgerne
                </Tekst>
                <Pil fra={[1010, 690]} til={[950, 440]} farge={FARGE.gronn} synlig={velgere} bue={0} />
                <Tekst x={1040} y={480} storrelse={34} farge={FARGE.gronn} anker="start" synlig={beat === 3}>
                    stemmer
                </Tekst>
            </Vis>
            <Vis synlig={beat === 3}>
                <Boks x={300} y={560} b={260} h={110} farge={FARGE.gronn} tittel="Sykehus" storrelse={36} />
                <Boks x={700} y={560} b={260} h={110} farge={FARGE.gronn} tittel="Skoler" storrelse={36} />
                <Boks x={1300} y={560} b={260} h={110} farge={FARGE.gronn} tittel="Jernbane" storrelse={36} />
                <Tekst x={700} y={655} storrelse={32} farge={FARGE.gra} vekt={700}>
                    løftene
                </Tekst>
            </Vis>
            <Vis synlig={beat >= 4} forsinkelse={0.3}>
                <rect x={1180} y={720} width={330} height={150} rx={14} fill="#ffffff" stroke={FARGE.gra} strokeWidth={4} />
                <text x={1345} y={775} textAnchor="middle" fontSize={34} fontWeight={900} fill={FARGE.blekk}>
                    Skatteseddel
                </text>
                {[800, 830].map((y) => (
                    <rect key={y} x={1220} y={y} width={250} height={12} rx={6} fill="#cbd5e1" />
                ))}
                <Pil fra={[1300, 710]} til={[1000, 330]} farge={FARGE.gra} synlig={beat >= 4} bue={-0.15} bredde={6} />
                <Tekst x={1250} y={500} storrelse={32} farge={FARGE.gra} anker="start">
                    betaler
                </Tekst>
                <Tekst x={110} y={250} storrelse={36} anker="start" farge={FARGE.gronn}>
                    Tanken: dit samfunnet trenger mest
                </Tekst>
            </Vis>
        </>
    );
}

const NODER: { x: number; y: number; type: 'folk' | 'bedrift' }[] = [
    { x: 300, y: 420, type: 'folk' },
    { x: 560, y: 720, type: 'bedrift' },
    { x: 1040, y: 720, type: 'folk' },
    { x: 1300, y: 420, type: 'bedrift' },
    { x: 800, y: 300, type: 'folk' },
];
const HANDEL: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 0],
    [0, 2],
    [1, 3],
];

function Marked({ beat }: { beat: number }) {
    return (
        <>
            {/* Ingen sjef */}
            <Vis synlig={beat === 0}>
                <rect x={620} y={260} width={360} height={260} rx={28} fill="#ffffff" stroke="#cbd5e1" strokeWidth={6} strokeDasharray="18 14" />
                <circle cx={800} cy={360} r={44} fill="#e2e8f0" />
                <rect x={745} y={410} width={110} height={80} rx={28} fill="#e2e8f0" />
                <g stroke={FARGE.rod} strokeWidth={18} strokeLinecap="round">
                    <line x1={1030} y1={300} x2={1150} y2={420} />
                    <line x1={1150} y1={300} x2={1030} y2={420} />
                </g>
                <Tekst x={800} y={610} storrelse={44}>
                    Ingen sentral sjef
                </Tekst>
            </Vis>
            {/* Handel mellom folk og bedrifter */}
            <Vis synlig={beat >= 1}>
                {HANDEL.map(([a, b], i) => (
                    <motion.line
                        key={i}
                        x1={NODER[a].x}
                        y1={NODER[a].y}
                        x2={NODER[b].x}
                        y2={NODER[b].y}
                        stroke={FARGE.marked}
                        strokeWidth={6}
                        initial={false}
                        animate={{ opacity: beat === 1 ? 0.9 : 0.25 }}
                        transition={{ duration: 0.6 }}
                    />
                ))}
                {NODER.map((n, i) =>
                    n.type === 'folk' ? (
                        <g key={i}>
                            <circle cx={n.x} cy={n.y} r={70} fill="#ffffff" stroke={FARGE.marked} strokeWidth={5} />
                            <Folk x={n.x} y={n.y + 38} farge={FARGE.marked} skala={0.8} />
                        </g>
                    ) : (
                        <g key={i}>
                            <circle cx={n.x} cy={n.y} r={70} fill="#ffffff" stroke={FARGE.marked} strokeWidth={5} />
                            <Fabrikk x={n.x} y={n.y + 10} skala={0.45} />
                        </g>
                    )
                )}
                <Vis synlig={beat === 1}>
                    <Tekst x={300} y={540} storrelse={28}>
                        Folk
                    </Tekst>
                    <Tekst x={1300} y={540} storrelse={28}>
                        Bedrift
                    </Tekst>
                </Vis>
            </Vis>
            {/* Prisen i midten */}
            <Vis synlig={beat >= 2}>
                <rect x={640} y={450} width={320} height={130} rx={26} fill={FARGE.marked} />
                <text x={800} y={535} textAnchor="middle" fontSize={64} fontWeight={900} fill="#ffffff">
                    Pris
                </text>
            </Vis>
            <Vis synlig={beat === 2}>
                <rect x={110} y={140} width={440} height={130} rx={20} fill="#ffffff" stroke={FARGE.gronn} strokeWidth={5} />
                <text x={330} y={195} textAnchor="middle" fontSize={36} fontWeight={900} fill={FARGE.gronn}>
                    Tilbud
                </text>
                <text x={330} y={243} textAnchor="middle" fontSize={28} fontWeight={700} fill={FARGE.blekk}>
                    det som er til salgs
                </text>
                <rect x={1050} y={140} width={440} height={130} rx={20} fill="#ffffff" stroke={FARGE.stat} strokeWidth={5} />
                <text x={1270} y={195} textAnchor="middle" fontSize={36} fontWeight={900} fill={FARGE.stat}>
                    Etterspørsel
                </text>
                <text x={1270} y={243} textAnchor="middle" fontSize={28} fontWeight={700} fill={FARGE.blekk}>
                    det folk vil kjøpe
                </text>
                <Pil fra={[420, 280]} til={[650, 460]} farge={FARGE.gronn} synlig={beat === 2} />
                <Pil fra={[1180, 280]} til={[950, 460]} farge={FARGE.stat} synlig={beat === 2} bue={-0.2} />
            </Vis>
            <Vis synlig={beat >= 3}>
                <rect x={110} y={800} width={480} height={90} rx={20} fill="#ffffff" stroke={FARGE.marked} strokeWidth={5} />
                <text x={350} y={858} textAnchor="middle" fontSize={34} fontWeight={900} fill={FARGE.blekk}>
                    Hva bedriftene lager
                </text>
                <rect x={1010} y={800} width={480} height={90} rx={20} fill="#ffffff" stroke={FARGE.marked} strokeWidth={5} />
                <text x={1250} y={858} textAnchor="middle" fontSize={34} fontWeight={900} fill={FARGE.blekk}>
                    Hva folk kjøper
                </text>
                <Pil fra={[700, 590]} til={[400, 790]} farge={FARGE.marked} synlig={beat >= 3} bue={-0.15} />
                <Pil fra={[900, 590]} til={[1200, 790]} farge={FARGE.marked} synlig={beat >= 3} bue={0.15} />
            </Vis>
        </>
    );
}

const SJOKOLADE = ['#7c2d12', '#be185d', '#1d4ed8'];

function Sjokolade({ beat }: { beat: number }) {
    /* Hvor mange av den valgte (rosa) sjokoladen fabrikken lager. */
    const laget = beat >= 1 ? 5 : 1;
    return (
        <>
            {/* Butikkhylla */}
            <rect x={120} y={260} width={480} height={420} rx={16} fill="#ffffff" stroke="#cbd5e1" strokeWidth={5} />
            {[400, 560].map((y) => (
                <rect key={y} x={120} y={y} width={480} height={12} fill="#cbd5e1" />
            ))}
            {SJOKOLADE.map((f, i) => (
                <motion.rect
                    key={i}
                    width={110}
                    height={60}
                    rx={8}
                    fill={f}
                    initial={false}
                    animate={{ x: 160 + i * 145, y: i === 1 && beat >= 0 ? 320 : 330, scale: i === 1 ? 1.12 : 1 }}
                    stroke={i === 1 ? '#fbbf24' : 'none'}
                    strokeWidth={6}
                />
            ))}
            <Tekst x={360} y={725}>
                Butikken
            </Tekst>
            <Folk x={360} y={840} farge={FARGE.rod} skala={1} />
            {/* Fabrikken */}
            <Fabrikk x={1240} y={520} skala={1.4} />
            <Tekst x={1240} y={660}>
                Den som lager den
            </Tekst>
            <Pil fra={[620, 350]} til={[1060, 400]} farge={FARGE.marked} synlig={beat >= 0} bue={-0.1} bredde={10} />
            <Vis synlig={beat === 1 || beat === 2}>
                <rect x={660} y={150} width={420} height={100} rx={50} fill={FARGE.marked} />
                <text x={870} y={213} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                    Lag mer av denne!
                </text>
            </Vis>
            {/* Flere av den rosa sjokoladen ut av fabrikken */}
            {Array.from({ length: 5 }, (_, i) => (
                <motion.rect
                    key={i}
                    width={90}
                    height={46}
                    rx={6}
                    fill={SJOKOLADE[1]}
                    initial={false}
                    animate={{ x: 1130 + (i % 3) * 100, y: 720 + Math.floor(i / 3) * 60, opacity: i < laget ? 1 : 0 }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                />
            ))}
            <Vis synlig={beat === 2}>
                <rect x={560} y={760} width={480} height={120} rx={22} fill="#ffffff" stroke={FARGE.marked} strokeWidth={6} />
                <text x={800} y={813} textAnchor="middle" fontSize={36} fontWeight={900} fill={FARGE.marked}>
                    Forbruker-suverenitet
                </text>
                <text x={800} y={858} textAnchor="middle" fontSize={28} fontWeight={700} fill={FARGE.blekk}>
                    kunden styrer
                </text>
            </Vis>
            <Vis synlig={beat >= 3}>
                <rect x={920} y={180} width={260} height={70} rx={14} fill="#ffffff" stroke={FARGE.gra} strokeWidth={4} />
                <text x={1050} y={228} textAnchor="middle" fontSize={30} fontWeight={800} fill={FARGE.blekk}>
                    Råvarer
                </text>
                <rect x={1300} y={180} width={260} height={70} rx={14} fill="#ffffff" stroke={FARGE.gra} strokeWidth={4} />
                <text x={1430} y={228} textAnchor="middle" fontSize={30} fontWeight={800} fill={FARGE.blekk}>
                    Arbeidskraft
                </text>
                <Pil fra={[1050, 260]} til={[1170, 380]} farge={FARGE.gra} synlig={beat >= 3} bue={0.1} bredde={6} />
                <Pil fra={[1430, 260]} til={[1320, 380]} farge={FARGE.gra} synlig={beat >= 3} bue={-0.1} bredde={6} />
                <rect x={600} y={770} width={400} height={90} rx={45} fill="#ffffff" stroke={FARGE.marked} strokeWidth={5} />
                <text x={800} y={828} textAnchor="middle" fontSize={32} fontWeight={800} fill={FARGE.marked}>
                    Hva vil kundene ha?
                </text>
            </Vis>
        </>
    );
}

/** To stolper: hva varen kostet å lage, og hva den ble solgt for. Bare en skisse. */
function Stolper({ x, salg, synlig, navn }: { x: number; salg: number; synlig: boolean; navn: string }) {
    const bunn = 760;
    const kost = 300;
    const salgH = synlig ? salg : 0;
    return (
        <Vis synlig={synlig}>
            <rect x={x} y={bunn - kost} width={170} height={kost} fill="#94a3b8" />
            <motion.rect
                x={x + 200}
                width={170}
                initial={{ height: 0, y: bunn }}
                animate={{ height: salgH, y: bunn - salgH }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                fill={salg > kost ? FARGE.gronn : FARGE.rod}
            />
            <text x={x + 85} y={bunn + 44} textAnchor="middle" fontSize={28} fontWeight={800} fill={FARGE.blekk}>
                Kostet
            </text>
            <text x={x + 285} y={bunn + 44} textAnchor="middle" fontSize={28} fontWeight={800} fill={FARGE.blekk}>
                Solgt for
            </text>
            <text x={x + 185} y={bunn + 100} textAnchor="middle" fontSize={36} fontWeight={900} fill={FARGE.blekk}>
                {navn}
            </text>
        </Vis>
    );
}

function Resultat({ beat }: { beat: number }) {
    return (
        <>
            <line x1={120} y1={760} x2={1480} y2={760} stroke={FARGE.blekk} strokeWidth={5} />
            <Stolper x={180} salg={430} synlig navn="Varen folk vil ha" />
            <Stolper x={1000} salg={90} synlig={beat >= 2} navn="Varen ingen vil ha" />
            <Vis synlig={beat >= 1}>
                <rect x={380} y={330} width={170} height={130} fill="none" stroke={FARGE.gronn} strokeWidth={6} strokeDasharray="14 10" />
                <rect x={590} y={300} width={330} height={160} rx={22} fill="#ffffff" stroke={FARGE.gronn} strokeWidth={6} />
                <text x={755} y={365} textAnchor="middle" fontSize={40} fontWeight={900} fill={FARGE.gronn}>
                    Overskudd
                </text>
                <text x={755} y={420} textAnchor="middle" fontSize={28} fontWeight={700} fill={FARGE.blekk}>
                    skapt verdi
                </text>
            </Vis>
            <Vis synlig={beat >= 3}>
                <rect x={1200} y={460} width={170} height={210} fill="none" stroke={FARGE.rod} strokeWidth={6} strokeDasharray="14 10" />
                <rect x={1050} y={170} width={430} height={180} rx={22} fill="#ffffff" stroke={FARGE.rod} strokeWidth={6} />
                <text x={1265} y={235} textAnchor="middle" fontSize={40} fontWeight={900} fill={FARGE.rod}>
                    Underskudd
                </text>
                <text x={1265} y={292} textAnchor="middle" fontSize={28} fontWeight={700} fill={FARGE.blekk}>
                    stopp: sløser med ressursene
                </text>
            </Vis>
            <Tekst x={1480} y={880} storrelse={32} farge={FARGE.gra} anker="end" vekt={700}>
                Skisse
            </Tekst>
        </>
    );
}

export function ProduksjonSignal({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'plan';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.bakgrunn }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'plan' && <Plan beat={beat} />}
                {modus === 'marked' && <Marked beat={beat} />}
                {modus === 'sjokolade' && <Sjokolade beat={beat} />}
                {modus === 'resultat' && <Resultat beat={beat} />}
            </svg>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
