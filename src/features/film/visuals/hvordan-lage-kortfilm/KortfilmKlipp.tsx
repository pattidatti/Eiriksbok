import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE } from './farger';
import { Bilde, Dom, Hode, Lerret, Merke, Overskrift, Profil, Vis } from './felles';

/**
 * Klipperommet: scenekort og tidslinjer.
 * - scener: scenenotatet, femten minutter mot to timer, scenene i rekkefølge, opptak mot ferdig film.
 * - scenetest: tre jobber en scene kan ha, og Erik-scenen som klippes ut og byttes.
 * - klippetyper: råopptak mot ferdig film, klipp på bevegelse, direkte, match og smash.
 * - rytme: lange og korte klipp, sorg og panikk, og reaksjonsklippet.
 */

type Modus = 'scener' | 'scenetest' | 'klippetyper' | 'rytme';

/* ---------------------------------------------------------------- scener */

const SCENER = [
    { tittel: 'Gangen', grep: 'Totalbilde', farge: FARGE.bla },
    { tittel: 'Lappen', grep: 'Ekstremt nært', farge: FARGE.gul },
    { tittel: 'Ventingen', grep: 'Nært', farge: FARGE.lilla },
    { tittel: 'Møtet', grep: 'Smash-klipp', farge: FARGE.rod },
    { tittel: 'Avsløringen', grep: 'Totalbilde', farge: FARGE.gronn },
];
/** Et eksempel på rekkefølgen scenene kan filmes i på opptaksdagen. */
const OPPTAK = [0, 1, 2, 3, 4];
const FILMES = [1, 0, 3, 4, 2];

function Scenekort({ i, x, y, visGrep }: { i: number; x: number; y: number; visGrep: boolean }) {
    const s = SCENER[i];
    return (
        <motion.g
            initial={{ opacity: 0, x, y: y + 30 }}
            animate={{ opacity: 1, x, y }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 + i * 0.12 }}
        >
            <rect
                x={0}
                y={0}
                width={260}
                height={visGrep ? 210 : 150}
                rx={18}
                fill="#fff"
                stroke={s.farge}
                strokeWidth={6}
            />
            <rect x={0} y={0} width={260} height={60} rx={18} fill={s.farge} />
            <rect x={0} y={36} width={260} height={24} fill={s.farge} />
            <text
                x={130}
                y={44}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#fff"
                className="font-display"
            >
                {i + 1}
            </text>
            <text
                x={130}
                y={112}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill={FARGE.blekk}
                className="font-display"
            >
                {s.tittel}
            </text>
            {visGrep && (
                <text
                    x={130}
                    y={172}
                    textAnchor="middle"
                    fontSize={27}
                    fontWeight={700}
                    fill={s.farge}
                >
                    {s.grep}
                </text>
            )}
        </motion.g>
    );
}

function Klokke({ x, y, tekst, farge }: { x: number; y: number; tekst: string; farge: string }) {
    return (
        <g>
            <circle cx={x} cy={y} r={90} fill="#fff" stroke={farge} strokeWidth={12} />
            <line
                x1={x}
                y1={y}
                x2={x}
                y2={y - 60}
                stroke={FARGE.blekk}
                strokeWidth={10}
                strokeLinecap="round"
            />
            <line
                x1={x}
                y1={y}
                x2={x + 45}
                y2={y}
                stroke={FARGE.blekk}
                strokeWidth={10}
                strokeLinecap="round"
            />
            <text
                x={x}
                y={y + 150}
                textAnchor="middle"
                fontSize={44}
                fontWeight={800}
                fill={farge}
                className="font-display"
            >
                {tekst}
            </text>
        </g>
    );
}

function Scener({ beat }: { beat: number }) {
    const overskrift = [
        'Forberedelse slår kamera',
        'Scenenotat sparer tid',
        'Scenene i rekkefølge',
        'Opptak og ferdig film: ulik rekkefølge',
    ][Math.min(beat, 3)];
    return (
        <>
            <Overskrift tekst={overskrift} />
            {/* Notatboka */}
            <Vis nar={beat <= 1}>
                <motion.g animate={{ x: beat === 0 ? 0 : -380 }} transition={{ duration: 0.8 }}>
                    <rect
                        x={620}
                        y={210}
                        width={360}
                        height={470}
                        rx={20}
                        fill="#fffdf4"
                        stroke="#cbd5e1"
                        strokeWidth={6}
                    />
                    <rect x={620} y={210} width={360} height={80} rx={20} fill={FARGE.gul} />
                    <text
                        x={800}
                        y={265}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#fff"
                        className="font-display"
                    >
                        Scenenotat
                    </text>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i}>
                            <text
                                x={655}
                                y={355 + i * 65}
                                fontSize={32}
                                fontWeight={800}
                                fill={FARGE.gra}
                            >
                                {i + 1}.
                            </text>
                            <line
                                x1={700}
                                y1={348 + i * 65}
                                x2={940}
                                y2={348 + i * 65}
                                stroke="#bfdbfe"
                                strokeWidth={6}
                                strokeLinecap="round"
                            />
                        </g>
                    ))}
                </motion.g>
            </Vis>
            <Vis nar={beat === 1} forsinkelse={0.4}>
                <Klokke x={800} y={430} tekst="15 minutter" farge={FARGE.gronn} />
                <text
                    x={800}
                    y={260}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={800}
                    fill={FARGE.gra}
                >
                    mot
                </text>
                {/* Opptak som ikke kan brukes */}
                {[0, 1, 2, 3].map((i) => (
                    <g
                        key={i}
                        transform={`translate(${1090 + (i % 2) * 120} ${300 + Math.floor(i / 2) * 120}) rotate(${i * 9 - 12})`}
                    >
                        <rect x={-50} y={-40} width={100} height={80} rx={10} fill="#334155" />
                        {[-30, 0, 30].map((dx) => (
                            <rect
                                key={dx}
                                x={dx - 8}
                                y={-34}
                                width={16}
                                height={10}
                                rx={2}
                                fill="#94a3b8"
                            />
                        ))}
                    </g>
                ))}
                <Dom x={1330} y={290} ok={false} r={40} />
                <text
                    x={1210}
                    y={580}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill={FARGE.rod}
                    className="font-display"
                >
                    2 timer
                </text>
                <text
                    x={1210}
                    y={630}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill={FARGE.gra}
                >
                    opptak dere ikke kan bruke
                </text>
            </Vis>
            {beat === 2 &&
                OPPTAK.map((i) => (
                    <Scenekort key={`a${i}`} i={i} x={110 + i * 285} y={320} visGrep />
                ))}
            {beat >= 3 && (
                <>
                    <text
                        x={110}
                        y={210}
                        fontSize={36}
                        fontWeight={800}
                        fill={FARGE.gra}
                        className="font-display"
                    >
                        Opptaksdagen
                    </text>
                    {FILMES.map((i, k) => (
                        <Scenekort key={`f${i}`} i={i} x={110 + k * 285} y={235} visGrep={false} />
                    ))}
                    <text
                        x={110}
                        y={520}
                        fontSize={36}
                        fontWeight={800}
                        fill={FARGE.gronn}
                        className="font-display"
                    >
                        Ferdig film
                    </text>
                    <line
                        x1={110}
                        y1={705}
                        x2={1490}
                        y2={705}
                        stroke={FARGE.gronn}
                        strokeWidth={8}
                    />
                    {OPPTAK.map((i) => (
                        <Scenekort key={`s${i}`} i={i} x={110 + i * 285} y={545} visGrep={false} />
                    ))}
                </>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- scenetest */

const JOBBER = [
    { tekst: 'Driver handlingen', farge: FARGE.bla },
    { tekst: 'Viser karakteren', farge: FARGE.lilla },
    { tekst: 'Skaper stemning', farge: FARGE.gul },
];

function Scenetest({ beat }: { beat: number }) {
    const overskrift = [
        'En scene gjør én jobb',
        'Scenetesten',
        'Ingen jobb? Klipp den',
        'En scene som gjør jobben',
    ][Math.min(beat, 3)];
    return (
        <>
            <Overskrift tekst={overskrift} />
            {/* De tre jobbene */}
            <motion.g
                animate={{ y: beat <= 1 ? 120 : -150, opacity: beat === 1 ? 0.35 : 1 }}
                transition={{ duration: 0.7 }}
            >
                {JOBBER.map((j, i) => {
                    const lyser = beat === 3 && i === 1;
                    const slukket = beat === 2 || (beat === 3 && !lyser);
                    return (
                        <motion.g
                            key={j.tekst}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: slukket ? 0.3 : 1 }}
                            transition={{ delay: beat === 0 ? 0.3 + i * 0.5 : 0 }}
                        >
                            <Merke
                                x={340 + i * 460}
                                y={330}
                                tekst={j.tekst}
                                farge={j.farge}
                                str={40}
                            />
                        </motion.g>
                    );
                })}
            </motion.g>
            <Vis nar={beat === 1}>
                <text
                    x={800}
                    y={620}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={800}
                    fill={FARGE.blekk}
                    className="font-display"
                >
                    Hva ville skjedd hvis
                </text>
                <text
                    x={800}
                    y={700}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={800}
                    fill={FARGE.blekk}
                    className="font-display"
                >
                    scenen ikke var der?
                </text>
            </Vis>
            {beat >= 2 && (
                <>
                    {/* Tidslinja med nabo-scener */}
                    <line x1={80} y1={540} x2={1520} y2={540} stroke="#cbd5e1" strokeWidth={10} />
                    {[110, 1250].map((x) => (
                        <rect
                            key={x}
                            x={x}
                            y={410}
                            width={240}
                            height={260}
                            rx={18}
                            fill="#e2e8f0"
                        />
                    ))}
                    {beat === 2 && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Bilde x={420} y={390} b={760} h={300} bakgrunn="#94a3b8">
                                {/* Buss-vindu og Erik som stirrer ut */}
                                <rect
                                    x={460}
                                    y={420}
                                    width={420}
                                    height={200}
                                    rx={14}
                                    fill="#bae6fd"
                                />
                                <rect
                                    x={900}
                                    y={420}
                                    width={250}
                                    height={200}
                                    rx={14}
                                    fill="#bae6fd"
                                />
                                <Profil x={1000} y={560} r={58} farge="#475569" retning={-1} />
                            </Bilde>
                            <text
                                x={800}
                                y={745}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={700}
                                fill={FARGE.blekk}
                            >
                                Erik tar bussen og stirrer ut av vinduet
                            </text>
                            <Dom x={1180} y={390} ok={false} r={42} />
                            <Merke
                                x={800}
                                y={810}
                                tekst="Ingenting skjer: KLIPP"
                                farge={FARGE.rod}
                                str={36}
                            />
                        </motion.g>
                    )}
                    {beat === 3 && (
                        <motion.g
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Bilde x={420} y={390} b={760} h={300} bakgrunn="#fde68a">
                                {/* Oppslagstavla */}
                                <rect
                                    x={470}
                                    y={420}
                                    width={400}
                                    height={240}
                                    rx={10}
                                    fill="#b45309"
                                />
                                {[0, 1, 2].map((i) => (
                                    <rect
                                        key={i}
                                        x={495 + i * 125}
                                        y={445}
                                        width={105}
                                        height={80}
                                        fill={i === 1 ? '#fff' : '#fef3c7'}
                                        transform={`rotate(${i * 4 - 4} ${545 + i * 125} 485)`}
                                    />
                                ))}
                                <rect x={560} y={550} width={110} height={80} fill="#fef3c7" />
                                <Profil x={1000} y={560} r={58} farge="#475569" retning={-1} />
                                {/* Lappen i hånda */}
                                <rect
                                    x={880}
                                    y={600}
                                    width={60}
                                    height={46}
                                    fill="#fff"
                                    transform="rotate(-18 910 623)"
                                />
                            </Bilde>
                            <text
                                x={800}
                                y={745}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={700}
                                fill={FARGE.blekk}
                            >
                                Erik river ned lappen om fotballkampen
                            </text>
                            <Dom x={1180} y={390} ok r={42} />
                            <Merke
                                x={800}
                                y={810}
                                tekst="Han skjuler noe"
                                farge={FARGE.lilla}
                                str={36}
                            />
                        </motion.g>
                    )}
                </>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- klippetyper */

/** En arm som svinger: skulder i (x, y), vinkel i grader. */
function Arm({ x, y, vinkel, farge }: { x: number; y: number; vinkel: number; farge: string }) {
    const r = (vinkel * Math.PI) / 180;
    const ex = x + Math.cos(r) * 130;
    const ey = y + Math.sin(r) * 130;
    return (
        <g>
            <line
                x1={x}
                y1={y}
                x2={ex}
                y2={ey}
                stroke={farge}
                strokeWidth={34}
                strokeLinecap="round"
            />
            <circle cx={ex} cy={ey} r={24} fill="#e8b996" />
        </g>
    );
}

function Bue({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <path
            d={`M ${x + 40} ${y + 150} A 160 160 0 0 0 ${x + 150} ${y - 60}`}
            stroke={farge}
            strokeWidth={8}
            strokeDasharray="18 14"
            fill="none"
        />
    );
}

const RAA = Array.from({ length: 24 }, (_, i) => i);
const BEHOLD = new Set([2, 5, 9, 14, 18, 21]);

function Klippetyper({ beat }: { beat: number }) {
    const overskrift = [
        'Du filmer mye mer enn du bruker',
        'Klipp mens noe beveger seg',
        'Direkte klipp',
        'Match-klipp',
        'Smash-klipp',
    ][Math.min(beat, 4)];
    const A = { x: 170, y: 250, b: 560, h: 330 };
    const B = { x: 870, y: 250, b: 560, h: 330 };
    return (
        <>
            <Overskrift tekst={overskrift} />
            {beat === 0 && (
                <>
                    <text
                        x={110}
                        y={300}
                        fontSize={36}
                        fontWeight={800}
                        fill={FARGE.gra}
                        className="font-display"
                    >
                        Alt dere filmet
                    </text>
                    {RAA.map((i) => (
                        <motion.rect
                            key={i}
                            x={110 + i * 57}
                            y={330}
                            width={50}
                            height={90}
                            rx={8}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: BEHOLD.has(i) ? 1 : 0.45 }}
                            transition={{ delay: i * 0.04 }}
                            fill={BEHOLD.has(i) ? FARGE.bla : '#94a3b8'}
                        />
                    ))}
                    <text
                        x={110}
                        y={580}
                        fontSize={36}
                        fontWeight={800}
                        fill={FARGE.gronn}
                        className="font-display"
                    >
                        Ferdig film
                    </text>
                    {[...BEHOLD].map((i, k) => (
                        <motion.rect
                            key={i}
                            initial={{ opacity: 0, x: 110 + i * 57, y: 330 }}
                            animate={{ opacity: 1, x: 110 + k * 57, y: 610 }}
                            transition={{ delay: 1 + k * 0.25, duration: 0.8 }}
                            width={50}
                            height={90}
                            rx={8}
                            fill={FARGE.bla}
                        />
                    ))}
                    <text x={500} y={670} fontSize={34} fontWeight={700} fill={FARGE.blekk}>
                        ny rekkefølge, ny rytme
                    </text>
                </>
            )}
            {beat >= 1 && (
                <>
                    <Bilde
                        x={A.x}
                        y={A.y}
                        b={A.b}
                        h={A.h}
                        bakgrunn={beat === 4 ? '#1e3a8a' : '#334155'}
                    >
                        {beat <= 3 && <Hode x={420} y={400} r={60} farge="#0f766e" munn="rett" />}
                        {(beat === 1 || beat === 3) && (
                            <>
                                <Bue x={470} y={470} farge="#fde68a" />
                                <Arm x={500} y={500} vinkel={-40} farge="#0f766e" />
                            </>
                        )}
                        {beat === 2 && (
                            <text
                                x={450}
                                y={330}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill="#e2e8f0"
                            >
                                Gangen
                            </text>
                        )}
                        {beat === 4 && (
                            <>
                                <circle cx={450} cy={420} r={70} fill="#fef3c7" />
                                <circle cx={480} cy={400} r={62} fill="#1e3a8a" />
                                <text
                                    x={450}
                                    y={330}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#e2e8f0"
                                >
                                    Stille natt
                                </text>
                            </>
                        )}
                    </Bilde>
                    <Bilde
                        x={B.x}
                        y={B.y}
                        b={B.b}
                        h={B.h}
                        bakgrunn={beat === 4 ? '#dc2626' : beat === 2 ? '#a16207' : '#334155'}
                    >
                        {beat === 1 && (
                            <>
                                <Hode x={1080} y={400} r={60} farge="#0f766e" munn="rett" />
                                <Arm x={1160} y={500} vinkel={-75} farge="#0f766e" />
                            </>
                        )}
                        {beat === 2 && (
                            <>
                                <rect
                                    x={900}
                                    y={290}
                                    width={500}
                                    height={120}
                                    fill="#fde68a"
                                    opacity={0.5}
                                />
                                <text
                                    x={1150}
                                    y={330}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#fff"
                                >
                                    Gymsalen
                                </text>
                                <Hode x={1150} y={440} r={60} farge="#7c3aed" munn="smil" />
                            </>
                        )}
                        {beat === 3 && (
                            <>
                                <Hode
                                    x={1080}
                                    y={400}
                                    r={60}
                                    farge="#b45309"
                                    munn="smil"
                                    har="#facc15"
                                />
                                <Bue x={1130} y={470} farge="#fde68a" />
                                <Arm x={1160} y={500} vinkel={-40} farge="#b45309" />
                            </>
                        )}
                        {beat === 4 && (
                            <>
                                <path
                                    d="M 1050 330 L 1120 420 L 1080 430 L 1170 540 L 1140 450 L 1190 440 L 1120 330 Z"
                                    fill="#fef08a"
                                />
                                <text
                                    x={1300}
                                    y={460}
                                    textAnchor="middle"
                                    fontSize={140}
                                    fontWeight={900}
                                    fill="#fff"
                                >
                                    !
                                </text>
                            </>
                        )}
                    </Bilde>
                    {/* Klippet mellom bildene */}
                    <line
                        x1={800}
                        y1={230}
                        x2={800}
                        y2={600}
                        stroke={beat === 4 ? FARGE.rod : FARGE.blekk}
                        strokeWidth={beat === 4 ? 14 : 8}
                    />
                    <Merke
                        x={800}
                        y={640}
                        tekst="KLIPP"
                        farge={beat === 4 ? FARGE.rod : FARGE.blekk}
                        str={30}
                    />
                    {beat === 1 && (
                        <text
                            x={800}
                            y={720}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={700}
                            fill={FARGE.blekk}
                        >
                            Armen svinger videre: seeren merker ikke klippet
                        </text>
                    )}
                    {beat === 3 && (
                        <text
                            x={800}
                            y={720}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={700}
                            fill={FARGE.blekk}
                        >
                            Lik bevegelse binder to scener
                        </text>
                    )}
                    {beat === 4 && (
                        <text
                            x={800}
                            y={720}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={700}
                            fill={FARGE.blekk}
                        >
                            Sjokk, vits eller hopp i tid
                        </text>
                    )}
                    {beat === 2 && (
                        <text
                            x={800}
                            y={720}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={700}
                            fill={FARGE.blekk}
                        >
                            Brå overgang til neste scene
                        </text>
                    )}
                    {/* De tre klippetypene */}
                    <Vis nar={beat >= 2}>
                        {['Direkte', 'Match', 'Smash'].map((t, i) => (
                            <g key={t} opacity={beat - 2 === i ? 1 : 0.3}>
                                <Merke
                                    x={480 + i * 320}
                                    y={820}
                                    tekst={`${i + 1}  ${t}`}
                                    farge={[FARGE.bla, FARGE.gul, FARGE.rod][i]}
                                    str={34}
                                />
                            </g>
                        ))}
                    </Vis>
                </>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- rytme */

function Stol({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-40} y={-120} width={14} height={160} fill="#92400e" />
            <rect x={-40} y={-10} width={90} height={14} fill="#92400e" />
            <rect x={36} y={0} width={14} height={60} fill="#92400e" />
            <rect x={-40} y={0} width={14} height={60} fill="#92400e" />
        </g>
    );
}

const PANIKK = ['Tom stol', 'Tallerken', 'Dør', 'Vindu', 'Gata'];

function Rytme({ beat }: { beat: number }) {
    const overskrift = [
        'Lengden på klippet styrer følelsen',
        'Sorg: ett langt klipp',
        'Panikk: mange korte klipp',
        'Reaksjonsklipp',
        'Ansiktet forteller hva vi skal føle',
    ][Math.min(beat, 4)];
    return (
        <>
            <Overskrift tekst={overskrift} />
            {beat === 0 && (
                <>
                    <text
                        x={140}
                        y={300}
                        fontSize={38}
                        fontWeight={800}
                        fill={FARGE.bla}
                        className="font-display"
                    >
                        Lange klipp: pusterom
                    </text>
                    {[0, 1].map((i) => (
                        <motion.rect
                            key={i}
                            x={140 + i * 670}
                            y={330}
                            height={110}
                            rx={12}
                            fill={FARGE.bla}
                            initial={{ width: 0 }}
                            animate={{ width: 650 }}
                            transition={{ duration: 1.4, delay: i * 0.4 }}
                        />
                    ))}
                    <text
                        x={140}
                        y={560}
                        fontSize={38}
                        fontWeight={800}
                        fill={FARGE.rod}
                        className="font-display"
                    >
                        Korte klipp: fart
                    </text>
                    {Array.from({ length: 16 }, (_, i) => (
                        <motion.rect
                            key={i}
                            x={140 + i * 83}
                            y={590}
                            width={74}
                            height={110}
                            rx={10}
                            fill={FARGE.rod}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.07 }}
                        />
                    ))}
                </>
            )}
            {beat === 1 && (
                <>
                    <Bilde x={420} y={170} b={760} h={430} bakgrunn="#334155">
                        <rect x={420} y={470} width={760} height={130} fill="#78350f" />
                        <ellipse cx={680} cy={470} rx={70} ry={16} fill="#f1f5f9" />
                        <ellipse cx={920} cy={470} rx={70} ry={16} fill="#f1f5f9" />
                        <Stol x={800} y={540} s={1.5} />
                    </Bilde>
                    <rect x={200} y={680} width={1200} height={70} rx={12} fill="#e2e8f0" />
                    <motion.rect
                        x={200}
                        y={680}
                        height={70}
                        rx={12}
                        fill={FARGE.bla}
                        initial={{ width: 0 }}
                        animate={{ width: 1200 }}
                        transition={{ duration: 3, ease: 'linear' }}
                    />
                    <text
                        x={800}
                        y={728}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#fff"
                        className="font-display"
                    >
                        8 sekunder
                    </text>
                    <text
                        x={800}
                        y={810}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill={FARGE.gra}
                    >
                        Kameraet hviler på den tomme stolen
                    </text>
                </>
            )}
            {beat === 2 && (
                <>
                    {PANIKK.map((t, i) => (
                        <motion.g
                            key={t}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.25, duration: 0.15 }}
                        >
                            <Bilde x={110 + i * 284} y={300} b={250} h={190} bakgrunn="#334155">
                                <text
                                    x={235 + i * 284}
                                    y={410}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#f8fafc"
                                >
                                    {t}
                                </text>
                            </Bilde>
                        </motion.g>
                    ))}
                    {[0, 1, 2, 3].map((i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 + i * 0.25 }}
                        >
                            <line
                                x1={377 + i * 284}
                                y1={280}
                                x2={377 + i * 284}
                                y2={510}
                                stroke={FARGE.rod}
                                strokeWidth={10}
                            />
                            <text
                                x={377 + i * 284}
                                y={560}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={800}
                                fill={FARGE.rod}
                            >
                                {i + 1}
                            </text>
                        </motion.g>
                    ))}
                    <rect x={110} y={640} width={1384} height={70} rx={12} fill={FARGE.rod} />
                    <text
                        x={800}
                        y={688}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#fff"
                        className="font-display"
                    >
                        Fem bilder, fire klipp, to sekunder
                    </text>
                </>
            )}
            {beat >= 3 && (
                <>
                    <Bilde x={170} y={220} b={560} h={380} bakgrunn="#334155">
                        <Hode x={450} y={380} r={70} farge="#0f766e" ser={0.6} />
                        <rect x={520} y={470} width={70} height={120} rx={10} fill="#0f172a" />
                        <rect
                            x={528}
                            y={480}
                            width={54}
                            height={96}
                            rx={6}
                            fill={beat === 4 ? '#475569' : '#7dd3fc'}
                        />
                        {beat === 4 && (
                            <text
                                x={555}
                                y={540}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#fff"
                            >
                                ?
                            </text>
                        )}
                    </Bilde>
                    <line
                        x1={800}
                        y1={200}
                        x2={800}
                        y2={620}
                        stroke={FARGE.blekk}
                        strokeWidth={8}
                    />
                    <Merke x={800} y={660} tekst="KLIPP" str={30} />
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Bilde x={870} y={220} b={560} h={380} bakgrunn="#475569">
                            <Hode x={1150} y={420} r={130} farge="#0f766e" munn="blank" />
                        </Bilde>
                    </motion.g>
                    <text
                        x={450}
                        y={680}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill={FARGE.blekk}
                    >
                        Jonas tar opp telefonen
                    </text>
                    <text
                        x={1150}
                        y={680}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill={FARGE.blekk}
                    >
                        Ansiktet blir blankt
                    </text>
                    <Vis nar={beat === 4}>
                        <Merke
                            x={800}
                            y={790}
                            tekst="Meldingen ser vi aldri"
                            farge={FARGE.lilla}
                            str={38}
                        />
                    </Vis>
                </>
            )}
        </>
    );
}

export function KortfilmKlipp({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'scener';
    return (
        <Lerret>
            {modus === 'scener' && <Scener beat={beat} />}
            {modus === 'scenetest' && <Scenetest beat={beat} />}
            {modus === 'klippetyper' && <Klippetyper beat={beat} />}
            {modus === 'rytme' && <Rytme beat={beat} />}
        </Lerret>
    );
}
