import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Etikett, Inn, Kryss, Overskrift, Person } from './felles';
import { B, H } from './mal';

/**
 * Livet utenfor leiligheten, tegnet i SVG. «latrine»: vann fra fontenen og de offentlige
 * toalettene. «korn»: fattigmannskost, kornutdeling og gatekjøkken. «garum»: fiskesausen i
 * nesten all mat. «gjestebud»: de rike ligger til bords, og forskjellen mellom få og mange.
 */

type Modus = 'latrine' | 'korn' | 'garum' | 'gjestebud';

const OVERSKRIFT: Record<Modus, string[]> = {
    latrine: [
        'Ikke vann i springen, ikke do',
        'Vann fra fontenen',
        'Latrinen: do for mange',
        'Side om side',
        'Svamp på en pinne',
    ],
    korn: [
        'Rik eller fattig?',
        'Korn: brød eller grøt',
        'Korn fra staten, gaver fra de rike',
        'Kjøtt var luksus',
        'Lunsj på gata',
    ],
    garum: ['Garum', 'Gjæret fisk', 'I nesten all mat', 'Romas ketsjup og soyasaus'],
    gjestebud: [
        'Gjestebud hos de rike',
        'De lå til bords',
        'I mange timer, med vin',
        'Mange fattige, noen få rike',
    ],
};

const STEIN = '#d8ccb2';
const GATE = '#9a9081';

/* ---------- Latrine ---------- */

function Leilighet() {
    return (
        <g>
            <rect width={B} height={H} fill="#e9dcc3" />
            <rect y={720} width={B} height={180} fill="#a98c6a" />
            {/* Et lite rom: seng, krakk, vindu */}
            <rect
                x={160}
                y={260}
                width={240}
                height={200}
                fill="#cfe3f0"
                stroke="#7c5a3a"
                strokeWidth={10}
            />
            <line x1={280} y1={260} x2={280} y2={460} stroke="#7c5a3a" strokeWidth={8} />
            <rect x={140} y={600} width={420} height={70} rx={10} fill="#8b5a2b" />
            <rect x={150} y={570} width={160} height={40} rx={14} fill="#e7dcc4" />
            <Person x={760} y={720} kropp="#a16207" />
            <Inn forsinkelse={0.4}>
                <g transform="translate(1060 420)">
                    {/* Kran */}
                    <path
                        d="M-60,-30 L40,-30 L40,10"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth={22}
                        strokeLinecap="round"
                    />
                    <rect x={-80} y={-60} width={40} height={60} rx={6} fill="#64748b" />
                    <Kryss x={0} y={-10} r={95} />
                    <Etikett x={0} y={140} tekst="Vann i springen" str={38} />
                </g>
                <g transform="translate(1380 420)">
                    {/* Toalett */}
                    <path
                        d="M-50,-60 L50,-60 L40,30 L-40,30 Z"
                        fill="#f8fafc"
                        stroke="#64748b"
                        strokeWidth={6}
                    />
                    <rect
                        x={-56}
                        y={-90}
                        width={112}
                        height={30}
                        rx={8}
                        fill="#e2e8f0"
                        stroke="#64748b"
                        strokeWidth={6}
                    />
                    <Kryss x={0} y={-20} r={95} />
                    <Etikett x={0} y={140} tekst="Eget toalett" str={38} />
                </g>
            </Inn>
        </g>
    );
}

function Fontene({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-40} y={-260} width={80} height={200} fill="#b8ab8f" />
            <circle cx={0} cy={-220} r={30} fill="#9c8f74" />
            <motion.path
                d="M0,-210 C30,-200 50,-150 60,-80"
                fill="none"
                stroke="#38bdf8"
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ opacity: 0.6 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
            />
            <rect
                x={-150}
                y={-80}
                width={300}
                height={80}
                rx={10}
                fill={STEIN}
                stroke="#8b7f66"
                strokeWidth={5}
            />
            <rect x={-130} y={-74} width={260} height={20} rx={6} fill="#7dd3fc" />
        </g>
    );
}

function Latrinebenk({ beat }: { beat: number }) {
    const hull = [0, 1, 2, 3, 4, 5, 6];
    const x0 = 760;
    return (
        <g>
            <rect
                x={700}
                y={330}
                width={840}
                height={390}
                fill="#efe6d2"
                stroke="#b8a888"
                strokeWidth={4}
            />
            {/* Benken med hull */}
            <rect
                x={720}
                y={560}
                width={800}
                height={40}
                fill={STEIN}
                stroke="#8b7f66"
                strokeWidth={4}
            />
            <rect x={720} y={600} width={800} height={110} fill="#c9bb9c" />
            {hull.map((i) => (
                <ellipse key={i} cx={x0 + 40 + i * 110} cy={580} rx={30} ry={10} fill="#3b2f28" />
            ))}
            {/* Renna med vann foran */}
            <rect x={720} y={700} width={800} height={20} fill="#7dd3fc" />
            {beat >= 3 &&
                [0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: beat === 3 ? i * 0.2 : 0 }}
                    >
                        <Person
                            x={x0 + 40 + i * 110}
                            y={560}
                            s={0.72}
                            pose="sitt"
                            kropp={
                                [
                                    '#a16207',
                                    '#78716c',
                                    '#92400e',
                                    '#57534e',
                                    '#b45309',
                                    '#6b7280',
                                    '#854d0e',
                                ][i]
                            }
                            hår={i % 3 === 0 ? '#1c1917' : '#57402c'}
                        />
                    </motion.g>
                ))}
            {beat === 3 && (
                <Inn forsinkelse={1.2}>
                    {[1, 3, 5].map((i) => (
                        <g key={i} transform={`translate(${x0 + 95 + i * 110} 400)`}>
                            <ellipse
                                cx={0}
                                cy={0}
                                rx={48}
                                ry={30}
                                fill="#fff"
                                stroke="#475569"
                                strokeWidth={4}
                            />
                            <circle cx={-18} cy={0} r={5} fill="#475569" />
                            <circle cx={0} cy={0} r={5} fill="#475569" />
                            <circle cx={18} cy={0} r={5} fill="#475569" />
                        </g>
                    ))}
                </Inn>
            )}
            {beat >= 3 && <Etikett x={1120} y={300} tekst="Ingen vegger mellom" str={40} />}
        </g>
    );
}

function Tersorium() {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: '800px 500px' }}
        >
            <rect
                x={300}
                y={220}
                width={1000}
                height={560}
                rx={30}
                fill="#fffaf0"
                stroke="#b8a888"
                strokeWidth={6}
            />
            {/* Pinnen og svampen */}
            <line
                x1={430}
                y1={640}
                x2={980}
                y2={380}
                stroke="#8b5a2b"
                strokeWidth={22}
                strokeLinecap="round"
            />
            <ellipse
                cx={1030}
                cy={355}
                rx={80}
                ry={56}
                fill="#facc15"
                stroke="#a16207"
                strokeWidth={6}
            />
            {[0, 1, 2, 3, 4].map((i) => (
                <circle
                    key={i}
                    cx={1000 + (i % 3) * 30}
                    cy={335 + Math.floor(i / 3) * 34}
                    r={9}
                    fill="#ca8a04"
                />
            ))}
            <Etikett x={700} y={330} tekst="Svamp på en pinne" str={44} />
            {/* Bollen med eddikvann */}
            <path
                d="M960,600 L1240,600 C1230,720 970,720 960,600 Z"
                fill="#b45f30"
                stroke="#7c2d12"
                strokeWidth={5}
            />
            <ellipse cx={1100} cy={600} rx={140} ry={20} fill="#d9f99d" />
            <Etikett x={1100} y={760} tekst="Eddikvann" str={40} />
            <Etikett x={560} y={720} tekst="Delt med naboen" str={40} farge="#b91c1c" />
        </motion.g>
    );
}

function Latrine({ beat }: { beat: number }) {
    if (beat === 0) return <Leilighet />;
    if (beat >= 4) {
        return (
            <g>
                <rect width={B} height={H} fill="#e7dcc4" />
                <Tersorium />
            </g>
        );
    }
    return (
        <g>
            <rect width={B} height={H} fill="#dbe7ee" />
            <rect y={720} width={B} height={180} fill={GATE} />
            <Fontene x={330} y={720} />
            <Person x={530} y={760} kropp="#92400e" />
            {/* Krukke i hånda */}
            <path d="M560,620 C540,560 620,560 600,620 Z" fill="#b45f30" />
            <Etikett x={330} y={860} tekst="Offentlig fontene" str={38} />
            {beat >= 2 && (
                <Inn>
                    <Latrinebenk beat={beat} />
                    <Etikett x={1120} y={860} tekst="Latrine" str={38} />
                </Inn>
            )}
        </g>
    );
}

/* ---------- Korn ---------- */

function Skål({ x, y, fyll = '#e9d8a6' }: { x: number; y: number; fyll?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <ellipse cx={0} cy={0} rx={110} ry={26} fill={fyll} />
            <path
                d="M-110,0 C-100,90 100,90 110,0 Z"
                fill="#a0522d"
                stroke="#6b3418"
                strokeWidth={4}
            />
        </g>
    );
}

function Brød({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M-110,30 C-110,-70 110,-70 110,30 Z"
                fill="#c2803c"
                stroke="#7c4a1c"
                strokeWidth={5}
            />
            {[-60, -20, 20, 60].map((dx) => (
                <line
                    key={dx}
                    x1={dx}
                    y1={30}
                    x2={dx * 0.8}
                    y2={-36}
                    stroke="#7c4a1c"
                    strokeWidth={4}
                />
            ))}
        </g>
    );
}

function Aks({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {[-30, 0, 30].map((dx, i) => (
                <g key={dx} transform={`rotate(${(i - 1) * 12})`}>
                    <line x1={0} y1={120} x2={0} y2={-80} stroke="#a16207" strokeWidth={6} />
                    {[0, 1, 2, 3, 4].map((k) => (
                        <g key={k}>
                            <ellipse cx={-10} cy={-70 + k * 22} rx={9} ry={15} fill="#eab308" />
                            <ellipse cx={10} cy={-70 + k * 22} rx={9} ry={15} fill="#eab308" />
                        </g>
                    ))}
                </g>
            ))}
        </g>
    );
}

function Pil({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const s = 26;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#475569"
                strokeWidth={10}
                strokeLinecap="round"
            />
            <path
                d={`M${x2},${y2} L${x2 - s * Math.cos(a - 0.5)},${y2 - s * Math.sin(a - 0.5)} L${x2 - s * Math.cos(a + 0.5)},${y2 - s * Math.sin(a + 0.5)} Z`}
                fill="#475569"
            />
        </motion.g>
    );
}

function Korn({ beat }: { beat: number }) {
    return (
        <g>
            <rect width={B} height={H} fill="#efe4cc" />
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g
                        key="b0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <rect x={140} y={250} width={600} height={520} rx={30} fill="#e2d6bc" />
                        <rect x={860} y={250} width={600} height={520} rx={30} fill="#f5e6c4" />
                        <Skål x={440} y={520} fyll="#e9d8a6" />
                        <Etikett x={440} y={720} tekst="Fattig" str={48} />
                        <ellipse
                            cx={1160}
                            cy={540}
                            rx={200}
                            ry={40}
                            fill="#d6c7a8"
                            stroke="#a16207"
                            strokeWidth={6}
                        />
                        <path d="M1060,520 C1060,440 1180,430 1200,500 Z" fill="#b45309" />
                        <circle cx={1240} cy={500} r={30} fill="#7c3aed" />
                        <circle cx={1280} cy={520} r={26} fill="#6d28d9" />
                        <circle cx={1110} cy={505} r={22} fill="#16a34a" />
                        <Etikett x={1160} y={720} tekst="Rik" str={48} />
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g
                        key="b1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Aks x={360} y={470} />
                        <Etikett x={360} y={700} tekst="Korn" str={48} />
                        <Pil x1={520} y1={430} x2={900} y2={340} />
                        <Pil x1={520} y1={520} x2={900} y2={610} />
                        <Brød x={1120} y={330} />
                        <Etikett x={1120} y={430} tekst="Brød" str={44} />
                        <Skål x={1120} y={600} />
                        <Etikett x={1120} y={740} tekst="Grøt" str={44} />
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g
                        key="b2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <rect y={720} width={B} height={180} fill={GATE} />
                        {/* Kornsekker og bordet der kornet deles ut */}
                        <rect x={180} y={520} width={420} height={40} fill="#8b5a2b" />
                        {[220, 330, 440].map((x) => (
                            <path
                                key={x}
                                d={`M${x},520 C${x - 10},420 ${x + 90},420 ${x + 80},520 Z`}
                                fill="#d6b77a"
                                stroke="#8b6b3a"
                                strokeWidth={4}
                            />
                        ))}
                        <Etikett x={390} y={660} tekst="Kornutdeling" str={42} />
                        {[0, 1, 2, 3, 4].map((i) => (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.25 }}
                            >
                                <Person
                                    x={700 + i * 120}
                                    y={740}
                                    s={0.85}
                                    kropp={
                                        ['#78716c', '#92400e', '#57534e', '#a16207', '#6b7280'][i]
                                    }
                                />
                            </motion.g>
                        ))}
                        <Inn forsinkelse={1.4}>
                            <Person x={1380} y={740} s={0.95} kropp="#f8fafc" />
                            <circle
                                cx={1300}
                                cy={580}
                                r={30}
                                fill="#facc15"
                                stroke="#a16207"
                                strokeWidth={5}
                            />
                            <Etikett x={1380} y={840} tekst="Gaver fra de rike" str={38} />
                        </Inn>
                    </motion.g>
                )}
                {beat === 3 && (
                    <motion.g
                        key="b3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Alteret og kjøttet */}
                        <rect
                            x={620}
                            y={520}
                            width={360}
                            height={220}
                            fill="#e2d6bc"
                            stroke="#8b7f66"
                            strokeWidth={6}
                        />
                        <rect x={590} y={490} width={420} height={40} fill="#cdbb9b" />
                        <motion.path
                            d="M700,470 C690,420 760,400 800,430 L900,410 C930,400 940,450 910,460 L820,480 C790,500 720,500 700,470 Z"
                            fill="#b91c1c"
                            stroke="#7f1d1d"
                            strokeWidth={5}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            style={{ transformOrigin: '800px 450px' }}
                        />
                        <motion.path
                            d="M780,380 C760,330 820,310 800,260 M840,380 C860,330 800,300 830,250"
                            stroke="#94a3b8"
                            strokeWidth={8}
                            fill="none"
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <Etikett x={800} y={810} tekst="Offerfest" str={44} />
                        <Etikett
                            x={300}
                            y={460}
                            tekst="Ikke til hverdags"
                            str={40}
                            farge="#b91c1c"
                        />
                        <Etikett x={1300} y={460} tekst="Spesielle anledninger" str={40} />
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.g
                        key="b4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <rect y={760} width={B} height={140} fill={GATE} />
                        <rect x={260} y={200} width={1080} height={200} fill="#c9b48e" />
                        <rect
                            x={340}
                            y={500}
                            width={920}
                            height={40}
                            fill="#d6cbb3"
                            stroke="#8b7355"
                            strokeWidth={4}
                        />
                        <rect
                            x={360}
                            y={540}
                            width={880}
                            height={220}
                            fill="#f3e9d2"
                            stroke="#8b7355"
                            strokeWidth={4}
                        />
                        {[0, 1, 2, 3].map((i) => {
                            const x = 470 + i * 220;
                            return (
                                <g key={i}>
                                    <ellipse cx={x} cy={504} rx={70} ry={16} fill="#5b3a22" />
                                    <path
                                        d={`M${x - 64},504 C${x - 80},420 ${x + 80},420 ${x + 64},504 Z`}
                                        fill="#a0522d"
                                        stroke="#6b3418"
                                        strokeWidth={3}
                                    />
                                </g>
                            );
                        })}
                        <Person x={160} y={780} kropp="#92400e" />
                        <Person x={1440} y={780} kropp="#78716c" />
                        <Etikett x={800} y={680} tekst="Gatekjøkken" str={48} />
                        <Etikett x={800} y={330} tekst="Få hadde kjøkken hjemme" str={42} />
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

/* ---------- Garum ---------- */

function Amfora({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M-40,-260 L40,-260 L46,-200 C150,-160 150,40 0,140 C-150,40 -150,-160 -46,-200 Z"
                fill="#b45f30"
                stroke="#7c2d12"
                strokeWidth={6}
            />
            <path
                d="M-46,-200 C-110,-210 -110,-130 -80,-120 M46,-200 C110,-210 110,-130 80,-120"
                fill="none"
                stroke="#7c2d12"
                strokeWidth={14}
            />
            <rect x={-50} y={-280} width={100} height={26} rx={8} fill="#7c2d12" />
        </g>
    );
}

function Fisk({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M-60,0 C-30,-34 40,-34 60,0 C40,34 -30,34 -60,0 Z"
                fill="#94a3b8"
                stroke="#475569"
                strokeWidth={4}
            />
            <path d="M60,0 L96,-26 L96,26 Z" fill="#94a3b8" stroke="#475569" strokeWidth={4} />
            <circle cx={-34} cy={-6} r={6} fill="#0f172a" />
        </g>
    );
}

function Garum({ beat }: { beat: number }) {
    return (
        <g>
            <rect width={B} height={H} fill="#efe4cc" />
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g
                        key="b0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Amfora x={800} y={560} s={1.1} />
                        <Etikett x={800} y={800} tekst="Garum" str={64} />
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g
                        key="b1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Kar med fisk som gjærer */}
                        <rect
                            x={180}
                            y={360}
                            width={620}
                            height={360}
                            rx={20}
                            fill="#d6c7a8"
                            stroke="#8b7f66"
                            strokeWidth={6}
                        />
                        <rect x={200} y={400} width={580} height={300} fill="#a3a36a" />
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Fisk
                                key={i}
                                x={290 + (i % 3) * 180}
                                y={480 + Math.floor(i / 3) * 120}
                                s={0.9}
                            />
                        ))}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <motion.circle
                                key={i}
                                cx={260 + i * 95}
                                r={10}
                                fill="#ecfccb"
                                initial={{ cy: 680 }}
                                animate={{ cy: [680, 410], opacity: [1, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35 }}
                            />
                        ))}
                        <Etikett x={490} y={800} tekst="Fisk som gjærer" str={44} />
                        <Pil x1={860} y1={540} x2={1060} y2={540} />
                        <Amfora x={1260} y={560} s={0.85} />
                        <Etikett x={1260} y={800} tekst="Garum" str={44} />
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g
                        key="b2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {[0, 1, 2, 3].map((i) => {
                            const x = 260 + i * 360;
                            return (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.35 }}
                                >
                                    <ellipse
                                        cx={x}
                                        cy={560}
                                        rx={150}
                                        ry={36}
                                        fill="#f8f5ec"
                                        stroke="#a8a29e"
                                        strokeWidth={5}
                                    />
                                    {i === 0 && <Brød x={x} y={530} />}
                                    {i === 1 && (
                                        <path
                                            d={`M${x - 70},540 C${x - 70},480 ${x + 60},470 ${x + 70},540 Z`}
                                            fill="#b45309"
                                        />
                                    )}
                                    {i === 2 && (
                                        <g>
                                            <circle cx={x - 40} cy={530} r={30} fill="#16a34a" />
                                            <circle cx={x + 20} cy={525} r={34} fill="#65a30d" />
                                        </g>
                                    )}
                                    {i === 3 && (
                                        <g>
                                            <circle cx={x - 30} cy={520} r={30} fill="#7c3aed" />
                                            <circle cx={x + 30} cy={525} r={28} fill="#f59e0b" />
                                        </g>
                                    )}
                                    {/* Dråper med garum */}
                                    <path
                                        d={`M${x + 80},400 C${x + 60},440 ${x + 100},450 ${x + 80},400 Z`}
                                        fill="#92400e"
                                    />
                                    <path
                                        d={`M${x + 80},420 C${x + 64},456 ${x + 96},456 ${x + 80},420 Z`}
                                        fill="#92400e"
                                    />
                                </motion.g>
                            );
                        })}
                        <Etikett x={1340} y={700} tekst="Dessert" str={44} farge="#b91c1c" />
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g
                        key="b3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Ketsjup + soyasaus = garum */}
                        <path
                            d="M260,700 L260,440 C260,400 290,380 300,340 L300,300 L340,300 L340,340 C350,380 380,400 380,440 L380,700 Z"
                            fill="#dc2626"
                        />
                        <Etikett x={320} y={780} tekst="Ketsjup" str={40} />
                        <Etikett x={480} y={560} tekst="+" str={90} />
                        <path
                            d="M580,700 L580,460 C580,420 610,400 620,360 L620,320 L660,320 L660,360 C670,400 700,420 700,460 L700,700 Z"
                            fill="#292524"
                        />
                        <Etikett x={640} y={780} tekst="Soyasaus" str={40} />
                        <Etikett x={840} y={560} tekst="=" str={90} />
                        <Amfora x={1160} y={560} s={0.9} />
                        <Etikett x={1160} y={800} tekst="Garum" str={48} />
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

/* ---------- Gjestebud ---------- */

function Divan({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-180} y={0} width={360} height={50} rx={14} fill="#7c2d12" />
            <rect x={-180} y={-24} width={360} height={30} rx={12} fill="#b91c1c" />
            <rect x={-170} y={50} width={24} height={60} fill="#5b3a22" />
            <rect x={146} y={50} width={24} height={60} fill="#5b3a22" />
        </g>
    );
}

function Gjestebud({ beat }: { beat: number }) {
    if (beat >= 3) {
        // En tett folkemengde uten figurer man kan telle: artikkelen sier bare «de aller fleste».
        const mange = Array.from({ length: 260 }, (_, i) => i);
        return (
            <g>
                <rect width={B} height={H} fill="#efe4cc" />
                <rect x={80} y={200} width={940} height={620} rx={30} fill="#e2d6bc" />
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    {mange.map((i) => {
                        const x = 130 + ((i * 397) % 840) + Math.sin(i * 1.7) * 14;
                        const y = 250 + ((i * 131) % 440) + Math.cos(i * 2.3) * 12;
                        return (
                            <g key={i}>
                                <path
                                    d={`M${x - 16},${y + 60} L${x - 12},${y + 14} L${x + 12},${y + 14} L${x + 16},${y + 60} Z`}
                                    fill={i % 3 ? '#8a7f72' : '#78716c'}
                                />
                                <circle cx={x} cy={y} r={12} fill={i % 4 ? '#e7c4a0' : '#d6b08a'} />
                            </g>
                        );
                    })}
                </motion.g>
                <Etikett x={550} y={800} tekst="De aller fleste: fattige" str={42} />
                <Inn forsinkelse={0.8}>
                    <rect x={1080} y={200} width={440} height={620} rx={30} fill="#fde68a" />
                    {[0, 1, 2].map((i) => (
                        <Person key={i} x={1180 + i * 120} y={560} s={0.8} kropp="#f8fafc" />
                    ))}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <circle
                            key={i}
                            cx={1170 + i * 60}
                            cy={650 - (i % 2) * 20}
                            r={24}
                            fill="#facc15"
                            stroke="#a16207"
                            strokeWidth={5}
                        />
                    ))}
                    <Etikett x={1300} y={760} tekst="Noen få:" str={40} />
                    <Etikett x={1300} y={805} tekst="penger og makt" str={40} />
                </Inn>
            </g>
        );
    }
    return (
        <g>
            {/* En sal med malte vegger */}
            <rect width={B} height={H} fill="#9b1c1c" />
            <rect y={0} width={B} height={110} fill="#3b1d14" />
            <rect y={700} width={B} height={200} fill="#d6c7a8" />
            {[200, 800, 1400].map((x) => (
                <rect key={x} x={x - 30} y={110} width={60} height={590} fill="#f3e9d2" />
            ))}
            <Divan x={360} y={600} />
            <Divan x={800} y={560} />
            <Divan x={1240} y={600} />
            {/* Bordet i midten */}
            <ellipse cx={800} cy={700} rx={180} ry={30} fill="#8b5a2b" />
            <rect x={790} y={700} width={20} height={80} fill="#5b3a22" />
            {beat >= 1 && (
                <Inn>
                    <Person x={340} y={576} s={0.9} pose="ligg" kropp="#f8fafc" />
                    <Person x={780} y={536} s={0.9} pose="ligg" kropp="#fde68a" />
                    <Person x={1220} y={576} s={0.9} pose="ligg" kropp="#f8fafc" />
                    {beat === 1 && (
                        <Etikett x={800} y={850} tekst="Divaner, ikke stoler" str={44} />
                    )}
                </Inn>
            )}
            {beat >= 2 && (
                <Inn>
                    {/* Fat, frukt og vin */}
                    <ellipse cx={720} cy={680} rx={60} ry={14} fill="#e5e7eb" />
                    <circle cx={700} cy={668} r={18} fill="#7c3aed" />
                    <circle cx={735} cy={664} r={16} fill="#16a34a" />
                    <path
                        d="M860,690 L840,600 C840,580 900,580 900,600 L880,690 Z"
                        fill="#b45f30"
                    />
                    <path d="M920,690 L930,650 L960,650 L970,690 Z" fill="#facc15" />
                    <rect x={928} y={644} width={34} height={10} fill="#7f1d1d" />
                    <Etikett x={800} y={850} tekst="Vin og mat i timevis" str={44} />
                </Inn>
            )}
        </g>
    );
}

export function HverdagslivByen({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'latrine';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 bg-[#efe4cc]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'latrine' && <Latrine beat={beat} />}
                {modus === 'korn' && <Korn beat={beat} />}
                {modus === 'garum' && <Garum beat={beat} />}
                {modus === 'gjestebud' && <Gjestebud beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
