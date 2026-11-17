import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Veggen og skolen under kulturrevolusjonen. Ingen mennesker vises, bare plakater og rom.
 * «angrep»: veggaviser med gruppene som ble anklaget, så én stor veggavis, så et tomt klasserom.
 * «skole»: skolen stenger, den tapte generasjonen, rødegardistene stoppes, og tiårskatastrofen.
 * «gamle»: de fire gamle kommer opp én etter én og stemples. Til slutt velter statuen og bøkene brenner.
 */

type Modus = 'angrep' | 'skole' | 'gamle';

const B = 1600;
const H = 900;

/** Strektegn som ligner skrift på en plakat, uten å være ekte tegn. */
function Skrift({
    x,
    y,
    linjer,
    bredde,
}: {
    x: number;
    y: number;
    linjer: number;
    bredde: number;
}) {
    return (
        <g>
            {Array.from({ length: linjer }, (_, r) =>
                Array.from({ length: Math.floor(bredde / 34) }, (_, k) => (
                    <g key={`${r}-${k}`} transform={`translate(${x + k * 34} ${y + r * 40})`}>
                        <path
                            d={`M 2 4 L 22 4 M 12 0 L 12 26 M 4 ${12 + ((r + k) % 3) * 4} L 20 ${16 + ((r * k) % 3) * 3}`}
                            stroke="#1c1917"
                            strokeWidth={4}
                            strokeLinecap="round"
                        />
                    </g>
                ))
            )}
        </g>
    );
}

function Plakat({
    x,
    y,
    tekst,
    forsinkelse,
    rot,
}: {
    x: number;
    y: number;
    tekst: string;
    forsinkelse: number;
    rot: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 150, damping: 16 }}
        >
            <g transform={`rotate(${rot} ${x + 140} ${y + 170})`}>
                <rect
                    x={x}
                    y={y}
                    width={280}
                    height={340}
                    fill="#fef9c3"
                    stroke="#a16207"
                    strokeWidth={3}
                />
                <rect x={x} y={y} width={280} height={70} fill="#dc2626" />
                <text
                    x={x + 140}
                    y={y + 48}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#fff"
                >
                    {tekst}
                </text>
                <Skrift x={x + 30} y={y + 100} linjer={5} bredde={230} />
            </g>
        </motion.g>
    );
}

function Vegg() {
    return (
        <g>
            <rect x={0} y={0} width={B} height={H} fill="#d6cbb8" />
            {Array.from({ length: 12 }, (_, r) => (
                <line
                    key={r}
                    x1={0}
                    x2={B}
                    y1={r * 80 + 40}
                    y2={r * 80 + 40}
                    stroke="#c4b79f"
                    strokeWidth={2}
                />
            ))}
            <rect x={0} y={820} width={B} height={80} fill="#a8a29e" />
        </g>
    );
}

const GRUPPER = ['Godseiere', 'Rike bønder', 'Fabrikkeiere', 'Intellektuelle'];

function Angrep({ beat }: { beat: number }) {
    if (beat >= 3) return <Klasserom />;
    return (
        <g>
            <Vegg />
            <AnimatePresence>
                {beat <= 1 &&
                    GRUPPER.map((g, i) => (
                        <Plakat
                            key={g}
                            x={90 + i * 300}
                            y={200 + (i % 2) * 30}
                            tekst={g}
                            forsinkelse={0.3 + i * 0.35}
                            rot={i % 2 ? 2 : -2}
                        />
                    ))}
                {beat === 1 && (
                    <Plakat
                        key="parti"
                        x={1270}
                        y={330}
                        tekst="Partifolk"
                        forsinkelse={0.4}
                        rot={4}
                    />
                )}
                {beat === 2 && (
                    <motion.g
                        key="stor"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 120, damping: 16 }}
                        style={{ transformOrigin: '800px 430px' }}
                    >
                        <rect
                            x={330}
                            y={90}
                            width={940}
                            height={680}
                            fill="#fefce8"
                            stroke="#a16207"
                            strokeWidth={5}
                        />
                        <rect x={330} y={90} width={940} height={110} fill="#dc2626" />
                        <text
                            x={800}
                            y={168}
                            textAnchor="middle"
                            fontSize={64}
                            fontWeight={900}
                            fill="#fff"
                        >
                            VEGGAVIS
                        </text>
                        <Skrift x={400} y={250} linjer={6} bredde={800} />
                        {/* Navnet som blir angrepet, med et rødt kryss */}
                        <rect
                            x={560}
                            y={510}
                            width={480}
                            height={110}
                            fill="#fff"
                            stroke="#1c1917"
                            strokeWidth={4}
                        />
                        <Skrift x={620} y={545} linjer={1} bredde={380} />
                        <motion.path
                            d="M 540 490 L 1060 640 M 1060 490 L 540 640"
                            stroke="#dc2626"
                            strokeWidth={16}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                        />
                        <text
                            x={800}
                            y={720}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={800}
                            fill="#1c1917"
                        >
                            Kritikk av et navngitt menneske
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

/** Klasserommet etter at læreren er dratt ut: tavle, kateter og en tom stol. */
function Klasserom() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <rect x={0} y={0} width={B} height={H} fill="#e7e2d6" />
            <rect x={0} y={700} width={B} height={200} fill="#a16207" opacity={0.55} />
            {/* Tavla */}
            <rect
                x={300}
                y={110}
                width={1000}
                height={380}
                rx={8}
                fill="#1f3b2d"
                stroke="#78350f"
                strokeWidth={14}
            />
            <Skrift x={360} y={170} linjer={2} bredde={500} />
            <motion.path
                d="M 360 330 Q 700 300 1220 360"
                stroke="#e7e5e4"
                strokeWidth={6}
                fill="none"
                opacity={0.6}
            />
            {/* Kateteret */}
            <rect x={560} y={560} width={480} height={30} fill="#78350f" />
            <rect x={580} y={590} width={30} height={150} fill="#78350f" />
            <rect x={990} y={590} width={30} height={150} fill="#78350f" />
            {/* Den tomme stolen, veltet litt */}
            <motion.g
                initial={{ rotate: 0 }}
                animate={{ rotate: -14 }}
                transition={{ delay: 1, duration: 0.8 }}
                style={{ transformOrigin: '1220px 760px' }}
            >
                <rect x={1180} y={600} width={20} height={160} fill="#57534e" />
                <rect x={1180} y={660} width={120} height={18} fill="#57534e" />
                <rect x={1280} y={678} width={18} height={82} fill="#57534e" />
            </motion.g>
            <motion.g
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <rect x={500} y={20} width={600} height={70} rx={16} fill="#b91c1c" />
                <text x={800} y={68} textAnchor="middle" fontSize={38} fontWeight={800} fill="#fff">
                    Læreren dras ut av timen
                </text>
            </motion.g>
        </motion.g>
    );
}

function Skole({ beat }: { beat: number }) {
    return (
        <g>
            <rect x={0} y={0} width={B} height={H} fill={beat >= 2 ? '#d6d3d1' : '#dbeafe'} />
            <rect x={0} y={760} width={B} height={140} fill="#a8a29e" />
            {beat < 3 && (
                <g>
                    {/* Skolebygningen */}
                    <rect
                        x={300}
                        y={260}
                        width={1000}
                        height={500}
                        fill="#e7dccb"
                        stroke="#78350f"
                        strokeWidth={5}
                    />
                    <path d="M 260 270 L 800 120 L 1340 270 Z" fill="#7c2d12" />
                    <rect x={620} y={180} width={360} height={70} rx={8} fill="#fff" />
                    <text
                        x={800}
                        y={230}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#1c1917"
                    >
                        SKOLE
                    </text>
                    {[360, 510, 980, 1130].map((x) => (
                        <rect key={x} x={x} y={320} width={110} height={130} fill="#475569" />
                    ))}
                    {/* Porten som lukkes */}
                    <motion.rect
                        x={700}
                        y={520}
                        height={240}
                        fill="#57534e"
                        initial={{ width: 0 }}
                        animate={{ width: 100 }}
                        transition={{ delay: 0.4, duration: 1 }}
                    />
                    <motion.rect
                        x={800}
                        y={520}
                        height={240}
                        fill="#57534e"
                        initial={{ width: 0, x: 900 }}
                        animate={{ width: 100, x: 800 }}
                        transition={{ delay: 0.4, duration: 1 }}
                    />
                    <motion.g
                        initial={{ opacity: 0, rotate: -20 }}
                        animate={{ opacity: 1, rotate: -6 }}
                        transition={{ delay: 1.3, type: 'spring' }}
                        style={{ transformOrigin: '800px 560px' }}
                    >
                        <rect
                            x={640}
                            y={520}
                            width={320}
                            height={90}
                            fill="#fff"
                            stroke="#b91c1c"
                            strokeWidth={7}
                        />
                        <text
                            x={800}
                            y={584}
                            textAnchor="middle"
                            fontSize={58}
                            fontWeight={900}
                            fill="#b91c1c"
                        >
                            STENGT
                        </text>
                    </motion.g>
                </g>
            )}
            <AnimatePresence>
                {beat === 1 && (
                    <motion.g
                        key="tapt"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect x={330} y={30} width={940} height={90} rx={20} fill="#1c1917" />
                        <text
                            x={800}
                            y={92}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#fde68a"
                        >
                            Den tapte generasjonen
                        </text>
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g
                        key="hær"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect x={330} y={30} width={940} height={90} rx={20} fill="#3f4a2f" />
                        <text
                            x={800}
                            y={92}
                            textAnchor="middle"
                            fontSize={46}
                            fontWeight={900}
                            fill="#fff"
                        >
                            August 1968: rødegardistene stoppes
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g
                        key="tiar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <rect x={0} y={0} width={B} height={H} fill="#1c1917" opacity={0.88} />
                        <text
                            x={800}
                            y={260}
                            textAnchor="middle"
                            fontSize={72}
                            fontWeight={900}
                            fill="#fde68a"
                        >
                            Tiårskatastrofen
                        </text>
                        <line
                            x1={260}
                            x2={1340}
                            y1={460}
                            y2={460}
                            stroke="#78716c"
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                        <motion.line
                            x1={260}
                            x2={1340}
                            y1={460}
                            y2={460}
                            stroke="#dc2626"
                            strokeWidth={22}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.8, duration: 2.4, ease: 'linear' }}
                        />
                        {Array.from({ length: 11 }, (_, i) => (
                            <g key={i}>
                                <line
                                    x1={260 + i * 108}
                                    x2={260 + i * 108}
                                    y1={430}
                                    y2={490}
                                    stroke="#e7e5e4"
                                    strokeWidth={4}
                                />
                            </g>
                        ))}
                        <text
                            x={260}
                            y={560}
                            textAnchor="middle"
                            fontSize={48}
                            fontWeight={900}
                            fill="#fff"
                        >
                            1966
                        </text>
                        <text
                            x={1340}
                            y={560}
                            textAnchor="middle"
                            fontSize={48}
                            fontWeight={900}
                            fill="#fff"
                        >
                            1976
                        </text>
                        <text
                            x={800}
                            y={340}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={700}
                            fill="#d6d3d1"
                        >
                            navnet Kinas egne myndigheter bruker
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat === 1 && (
                    <motion.g
                        key="tall"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1 }}
                        style={{ transformOrigin: '1380px 420px' }}
                    >
                        <rect
                            x={1190}
                            y={330}
                            width={380}
                            height={190}
                            rx={22}
                            fill="#fff"
                            stroke="#b91c1c"
                            strokeWidth={5}
                        />
                        <text
                            x={1380}
                            y={410}
                            textAnchor="middle"
                            fontSize={56}
                            fontWeight={900}
                            fill="#b91c1c"
                        >
                            over 100
                        </text>
                        <text
                            x={1380}
                            y={470}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#475569"
                        >
                            millioner rammet
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

const FIRE_GAMLE = [
    { tittel: 'Gamle skikker', tekst: 'gamle tradisjoner' },
    { tittel: 'Gamle vaner', tekst: 'slik folk hadde levd' },
    { tittel: 'Gamle tenkemåter', tekst: 'alt som var gammeldags' },
    { tittel: 'Gamle ideer', tekst: 'det folk trodde på' },
];
const FELT_X0 = 80;
const FELT_STEG = 365;
const FELT_B = 350;

/** Papirlykta til høytidene. */
function Lykt({ cx }: { cx: number }) {
    return (
        <g>
            <line x1={cx} x2={cx} y1={215} y2={265} stroke="#d6d3d1" strokeWidth={4} />
            <rect x={cx - 45} y={262} width={90} height={22} rx={4} fill="#a16207" />
            <ellipse cx={cx} cy={390} rx={100} ry={110} fill="#dc2626" />
            {[-60, -20, 20, 60].map((d) => (
                <ellipse
                    key={d}
                    cx={cx + d * 0.5}
                    cy={390}
                    rx={Math.abs(d) * 0.9 + 8}
                    ry={110}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={3}
                    opacity={0.7}
                />
            ))}
            <rect x={cx - 45} y={496} width={90} height={22} rx={4} fill="#a16207" />
            <line x1={cx} x2={cx} y1={518} y2={560} stroke="#fbbf24" strokeWidth={6} />
        </g>
    );
}

/** Tekanne og kopper: slik folk alltid hadde gjort det. */
function Tekanne({ cx }: { cx: number }) {
    return (
        <g>
            <rect x={cx - 150} y={500} width={300} height={22} rx={6} fill="#78350f" />
            <ellipse
                cx={cx - 20}
                cy={420}
                rx={95}
                ry={78}
                fill="#e0f2fe"
                stroke="#1e3a8a"
                strokeWidth={5}
            />
            <path
                d={`M ${cx + 70} 430 Q ${cx + 120} 420 ${cx + 135} 370`}
                stroke="#1e3a8a"
                strokeWidth={14}
                fill="none"
                strokeLinecap="round"
            />
            <path
                d={`M ${cx - 112} 390 Q ${cx - 160} 420 ${cx - 112} 460`}
                stroke="#1e3a8a"
                strokeWidth={10}
                fill="none"
            />
            <ellipse cx={cx - 20} cy={345} rx={45} ry={14} fill="#1e3a8a" />
            <circle cx={cx - 20} cy={330} r={10} fill="#1e3a8a" />
            <path
                d={`M ${cx - 60} 420 Q ${cx - 20} 400 ${cx + 20} 420`}
                stroke="#1e3a8a"
                strokeWidth={4}
                fill="none"
            />
            {[-110, 90].map((d) => (
                <path
                    key={d}
                    d={`M ${cx + d} 460 L ${cx + d + 40} 460 L ${cx + d + 34} 498 L ${cx + d + 6} 498 Z`}
                    fill="#e0f2fe"
                    stroke="#1e3a8a"
                    strokeWidth={4}
                />
            ))}
        </g>
    );
}

/** Hengende skriftrull med gammel lærdom. */
function Rull({ cx }: { cx: number }) {
    return (
        <g>
            <line x1={cx - 40} x2={cx} y1={240} y2={215} stroke="#d6d3d1" strokeWidth={3} />
            <line x1={cx + 40} x2={cx} y1={240} y2={215} stroke="#d6d3d1" strokeWidth={3} />
            <rect x={cx - 110} y={236} width={220} height={16} rx={8} fill="#78350f" />
            <rect
                x={cx - 95}
                y={250}
                width={190}
                height={290}
                fill="#fefce8"
                stroke="#a16207"
                strokeWidth={3}
            />
            <Skrift x={cx - 75} y={280} linjer={6} bredde={170} />
            <rect x={cx - 110} y={536} width={220} height={16} rx={8} fill="#78350f" />
        </g>
    );
}

const BOK_FARGER = ['#1e3a8a', '#7c2d12', '#166534', '#a16207', '#581c87', '#9f1239'];

/** Bokhylla og statuen. På siste beat brenner bøkene og statuen velter. */
function Hylle({ cx, odelagt }: { cx: number; odelagt: boolean }) {
    const x0 = cx - 160;
    return (
        <g>
            <rect x={x0} y={330} width={180} height={220} fill="#57534e" />
            {[0, 1].map((r) =>
                BOK_FARGER.map((f, i) => (
                    <rect
                        key={`${r}-${i}`}
                        x={x0 + 12 + i * 27}
                        y={344 + r * 104 + (i % 3) * 6}
                        width={22}
                        height={88 - (i % 3) * 6}
                        fill={f}
                    />
                ))
            )}
            <rect x={x0} y={436} width={180} height={10} fill="#44403c" />
            {odelagt &&
                [0, 1, 2, 3].map((i) => (
                    <motion.path
                        key={i}
                        d={`M ${x0 + 20 + i * 42} 552 Q ${x0 + 5 + i * 42} 470 ${x0 + 32 + i * 42} ${400 - (i % 2) * 40} Q ${x0 + 60 + i * 42} 480 ${x0 + 50 + i * 42} 552 Z`}
                        fill={i % 2 ? '#f97316' : '#fbbf24'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.92 }}
                        transition={{ delay: 1 + i * 0.25, duration: 0.6 }}
                    />
                ))}
            {/* Statuen på sokkelen */}
            <rect x={cx + 50} y={500} width={110} height={52} fill="#78716c" />
            <motion.g
                initial={false}
                animate={{ rotate: odelagt ? -16 : 0 }}
                transition={{ delay: odelagt ? 0.6 : 0, duration: 0.5, ease: 'easeIn' }}
                style={{ transformOrigin: `${cx + 62}px 500px` }}
            >
                <path
                    d={`M ${cx + 62} 500 L ${cx + 75} 400 L ${cx + 135} 400 L ${cx + 148} 500 Z`}
                    fill="#a8a29e"
                />
            </motion.g>
            {/* Hodet faller av og havner på gulvet */}
            <motion.g
                initial={false}
                animate={odelagt ? { x: 10, y: 196 } : { x: 0, y: 0 }}
                transition={{ delay: odelagt ? 0.9 : 0, duration: 0.6, ease: 'easeIn' }}
            >
                <circle cx={cx + 105} cy={370} r={34} fill="#a8a29e" />
                <circle cx={cx + 105} cy={340} r={12} fill="#a8a29e" />
            </motion.g>
        </g>
    );
}

function Stempel({ x, y }: { x: number; y: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 1.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <circle cx={x} cy={y} r={36} fill="#dc2626" stroke="#fff" strokeWidth={4} />
            <path
                d={`M ${x - 15} ${y - 15} L ${x + 15} ${y + 15} M ${x + 15} ${y - 15} L ${x - 15} ${y + 15}`}
                stroke="#fff"
                strokeWidth={8}
                strokeLinecap="round"
            />
        </motion.g>
    );
}

function Gamle({ beat }: { beat: number }) {
    return (
        <g>
            <rect x={0} y={0} width={B} height={H} fill="#44403c" />
            {Array.from({ length: 11 }, (_, r) => (
                <line
                    key={r}
                    x1={0}
                    x2={B}
                    y1={r * 90 + 60}
                    y2={r * 90 + 60}
                    stroke="#3a3532"
                    strokeWidth={3}
                />
            ))}
            <rect x={250} y={36} width={1100} height={96} rx={10} fill="#dc2626" />
            <text x={800} y={100} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fef08a">
                Maos slagord: Det er riktig å gjøre opprør
            </text>
            <text x={800} y={180} textAnchor="middle" fontSize={34} fontWeight={800} fill="#e7e5e4">
                De fire gamle skulle bort
            </text>
            {FIRE_GAMLE.map((f, i) => {
                if (beat < i) return null;
                const x = FELT_X0 + i * FELT_STEG;
                const cx = x + FELT_B / 2;
                return (
                    <motion.g
                        key={f.tittel}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <rect x={x} y={205} width={FELT_B} height={600} rx={18} fill="#292524" />
                        {i === 0 && <Lykt cx={cx} />}
                        {i === 1 && <Tekanne cx={cx} />}
                        {i === 2 && <Rull cx={cx} />}
                        {i === 3 && <Hylle cx={cx} odelagt={beat >= 3} />}
                        <g>
                            <rect x={x} y={600} width={FELT_B} height={130} fill="#1c1917" />
                            <text
                                x={cx}
                                y={655}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={900}
                                fill="#fef3c7"
                            >
                                {f.tittel}
                            </text>
                            <text
                                x={cx}
                                y={700}
                                textAnchor="middle"
                                fontSize={26}
                                fontWeight={600}
                                fill="#d6d3d1"
                            >
                                {f.tekst}
                            </text>
                        </g>
                        {(beat > i || beat >= 3) && <Stempel x={x + FELT_B - 40} y={760} />}
                    </motion.g>
                );
            })}
        </g>
    );
}

export function SprangetVegg({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'angrep';
    return (
        <div className="absolute inset-0 bg-stone-200">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'angrep' && <Angrep beat={beat} />}
                {modus === 'skole' && <Skole beat={beat} />}
                {modus === 'gamle' && <Gamle beat={beat} />}
            </svg>
        </div>
    );
}
