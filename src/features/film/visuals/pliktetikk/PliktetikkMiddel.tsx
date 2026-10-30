import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Kort, Pil, Tekst, Vis } from './felles';

/**
 * Menneskeverdsformelen. «taxi»: ordet «bare», taxisjåføren som er et middel og samtidig et
 * menneske, og grensen der han blir en ting. «vekt»: utilitaristens vekt med fem mot én,
 * broen i sporvognsproblemet, pliktetikerens nei og verdien over enhver pris.
 */

type Modus = 'taxi' | 'vekt';

function Taxi({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -260 0 L -250 -90 L -150 -100 L -90 -180 L 120 -180 L 190 -100 L 260 -90 L 270 0 Z" fill="#facc15" stroke="#a16207" strokeWidth={5} />
            <path d="M -70 -165 L 10 -165 L 10 -105 L -125 -105 Z" fill="#bae6fd" />
            <path d="M 30 -165 L 110 -165 L 165 -105 L 30 -105 Z" fill="#bae6fd" />
            <rect x={-30} y={-215} width={80} height={36} rx={6} fill="#1f2937" />
            <text x={10} y={-189} textAnchor="middle" fontSize={24} fontWeight={900} fill="#facc15" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                TAXI
            </text>
            <circle cx={-160} cy={0} r={48} fill="#1f2937" />
            <circle cx={170} cy={0} r={48} fill="#1f2937" />
            <circle cx={-160} cy={0} r={18} fill="#9ca3af" />
            <circle cx={170} cy={0} r={18} fill="#9ca3af" />
        </g>
    );
}

function TaxiScene({ beat }: { beat: number }) {
    const ting = beat >= 4;
    return (
        <Flate bakgrunn="#f1f5f9">
            <Tekst x={800} y={95} str={52} farge="#0f172a">
                {beat <= 1 ? 'Aldri bare et middel' : ting ? 'Bare en ting: ikke lov' : 'Et middel, og et menneske'}
            </Tekst>

            {/* Beat 0-1: setningen */}
            <Vis vis={beat <= 1}>
                <rect x={170} y={260} width={1260} height={200} rx={30} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
                <text x={800} y={385} textAnchor="middle" fontSize={64} fontWeight={800} fill="#0f172a" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    Aldri{' '}
                    <tspan fill={beat >= 1 ? '#dc2626' : '#0f172a'} fontWeight={900}>
                        bare
                    </tspan>{' '}
                    som et middel
                </text>
                <Kort x={540} y={620} tekst="middel = et redskap" str={38} farge="#e0f2fe" kant="#38bdf8" tekstFarge="#075985" />
                <Kort x={1080} y={620} tekst="mål = et menneske" str={38} farge="#dcfce7" kant="#4ade80" tekstFarge="#166534" />
                <Tekst x={800} y={780} str={38} farge="#b91c1c" vis={beat >= 1}>
                    Vi bruker hverandre ofte
                </Tekst>
            </Vis>

            {/* Beat 2-4: taxien */}
            <Vis vis={beat >= 2}>
                <rect x={0} y={760} width={1600} height={140} fill="#cbd5e1" />
                <motion.g initial={{ x: -300 }} animate={{ x: beat >= 2 ? 0 : -300 }} transition={{ duration: 1.6, ease: 'easeOut' }}>
                    <Taxi x={560} y={760} />
                </motion.g>
                {/* Sjåføren ved siden av bilen */}
                <motion.g initial={false} animate={{ opacity: 1 }}>
                    <g opacity={ting ? 0.45 : 1}>
                        <Figur x={980} y={760} farge={ting ? '#9ca3af' : '#0f766e'} skala={1.3} hud={ting ? '#d1d5db' : '#e0b98a'} />
                    </g>
                </motion.g>
                <Figur x={1240} y={760} farge="#7c3aed" skala={1.3} />
                <Tekst x={980} y={540} str={30} farge="#0f766e" vis={!ting}>
                    sjåføren
                </Tekst>
                <Tekst x={1240} y={540} str={30} farge="#6d28d9">
                    deg
                </Tekst>
                <Kort x={800} y={240} tekst="Kjøre deg hjem: helt i orden" str={36} farge="#ecfeff" kant="#22d3ee" tekstFarge="#155e75" vis={beat === 2} />
            </Vis>
            <Vis vis={beat === 3}>
                <Kort x={560} y={240} tekst="Du betaler" str={38} farge="#fef9c3" kant="#eab308" tekstFarge="#713f12" />
                <Kort x={1040} y={240} tekst="Du er høflig" str={38} farge="#dcfce7" kant="#22c55e" tekstFarge="#166534" />
                <circle cx={1110} cy={430} r={34} fill="#facc15" stroke="#a16207" strokeWidth={5} />
                <Pil x1={1190} y1={450} x2={1150} y2={440} farge="#a16207" tykk={5} />
                <circle cx={980} cy={607} r={56} fill="none" stroke="#22c55e" strokeWidth={6} />
            </Vis>
            <Vis vis={ting}>
                <Kort x={560} y={240} tekst="lure ham" str={38} farge="#fee2e2" kant="#ef4444" tekstFarge="#991b1b" />
                <Kort x={1040} y={240} tekst="gjøre ham til slave" str={38} farge="#fee2e2" kant="#ef4444" tekstFarge="#991b1b" />
                <line x1={440} y1={240} x2={680} y2={240} stroke="#dc2626" strokeWidth={8} />
                <line x1={830} y1={240} x2={1250} y2={240} stroke="#dc2626" strokeWidth={8} />
                <path d="M 920 440 L 1040 600 M 1040 440 L 920 600" stroke="#dc2626" strokeWidth={14} strokeLinecap="round" />
            </Vis>
        </Flate>
    );
}

const MX = 800;
const TOPP = 330;

function VektScene({ beat }: { beat: number }) {
    const tilt = beat === 0 ? -9 : 0;
    const rad = (tilt * Math.PI) / 180;
    const arm = 380;
    const vx = MX - Math.cos(rad) * arm;
    const vy = TOPP + Math.sin(rad) * arm * -1;
    const hx = MX + Math.cos(rad) * arm;
    const hy = TOPP - Math.sin(rad) * arm * -1;
    return (
        <Flate bakgrunn="#fff7ed">
            <Tekst x={800} y={95} str={52} farge="#7c2d12">
                {['Utilitaristen: fem veier mer enn én', 'Sporvognsproblemet', 'Pliktetikeren: Nei', 'En verdi over enhver pris'][Math.min(beat, 3)]}
            </Tekst>

            {/* Vekten */}
            <Vis vis={beat === 0}>
                <rect x={MX - 14} y={TOPP} width={28} height={460} fill="#78716c" />
                <path d={`M ${MX - 160} 820 L ${MX + 160} 820 L ${MX + 90} 780 L ${MX - 90} 780 Z`} fill="#57534e" />
                <motion.line stroke="#57534e" strokeWidth={18} strokeLinecap="round" initial={{ x1: MX - arm, y1: TOPP, x2: MX + arm, y2: TOPP }} animate={{ x1: vx, y1: vy, x2: hx, y2: hy }} transition={{ type: 'spring', stiffness: 40, damping: 10, delay: 0.5 }} />
                <motion.g initial={{ x: MX - arm, y: TOPP }} animate={{ x: vx, y: vy }} transition={{ type: 'spring', stiffness: 40, damping: 10, delay: 0.5 }}>
                    <line x1={-150} y1={190} x2={0} y2={0} stroke="#78716c" strokeWidth={4} />
                    <line x1={150} y1={190} x2={0} y2={0} stroke="#78716c" strokeWidth={4} />
                    <path d="M -170 190 Q 0 250 170 190 Z" fill="#a8a29e" />
                    {[-120, -60, 0, 60, 120].map((x) => (
                        <Figur key={x} x={x} y={190} farge="#b45309" skala={0.55} />
                    ))}
                    <text x={0} y={300} textAnchor="middle" fontSize={34} fontWeight={800} fill="#7c2d12" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                        fem
                    </text>
                </motion.g>
                <motion.g initial={{ x: MX + arm, y: TOPP }} animate={{ x: hx, y: hy }} transition={{ type: 'spring', stiffness: 40, damping: 10, delay: 0.5 }}>
                    <line x1={-150} y1={190} x2={0} y2={0} stroke="#78716c" strokeWidth={4} />
                    <line x1={150} y1={190} x2={0} y2={0} stroke="#78716c" strokeWidth={4} />
                    <path d="M -170 190 Q 0 250 170 190 Z" fill="#a8a29e" />
                    <Figur x={0} y={190} farge="#334155" skala={0.55} />
                    <text x={0} y={300} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                        én
                    </text>
                </motion.g>
                <circle cx={MX} cy={TOPP} r={22} fill="#44403c" />
            </Vis>

            {/* Broen: ingen bevegelse, bare valget */}
            <Vis vis={beat === 1 || beat === 2}>
                <rect x={0} y={790} width={1600} height={110} fill="#d6d3d1" />
                <line x1={0} y1={800} x2={1600} y2={800} stroke="#57534e" strokeWidth={8} />
                <line x1={0} y1={830} x2={1600} y2={830} stroke="#57534e" strokeWidth={8} />
                <path d="M 560 800 L 560 470 L 1040 470 L 1040 800" fill="none" stroke="#78716c" strokeWidth={30} />
                <rect x={520} y={440} width={560} height={40} fill="#a8a29e" />
                <Figur x={800} y={440} farge="#334155" skala={1} />
                {/* Toget til venstre */}
                <g transform="translate(110 790)">
                    <rect x={0} y={-150} width={300} height={140} rx={20} fill="#1d4ed8" />
                    <rect x={30} y={-125} width={70} height={55} rx={6} fill="#bfdbfe" />
                    <rect x={120} y={-125} width={70} height={55} rx={6} fill="#bfdbfe" />
                    <rect x={210} y={-125} width={70} height={55} rx={6} fill="#bfdbfe" />
                    <circle cx={60} cy={-5} r={20} fill="#1f2937" />
                    <circle cx={240} cy={-5} r={20} fill="#1f2937" />
                </g>
                {/* De fem på sporet */}
                {[1200, 1270, 1340, 1410, 1480].map((x) => (
                    <Figur key={x} x={x} y={790} farge="#b45309" skala={0.6} />
                ))}
                <Tekst x={800} y={560} str={30} farge="#334155" vis={beat === 1}>
                    mannen på brua
                </Tekst>
                <Kort x={1340} y={600} tekst="fem på sporet" str={32} farge="#ffedd5" kant="#fb923c" tekstFarge="#7c2d12" />
                <Kort x={800} y={250} tekst="Dytte én for å redde fem?" str={40} farge="#ffffff" kant="#cbd5e1" vis={beat === 1} />
            </Vis>
            <motion.g
                initial={{ opacity: 0, scale: 1.6 }}
                animate={{ opacity: beat === 2 ? 1 : 0, scale: beat === 2 ? 1 : 1.6 }}
                transition={{ type: 'spring', stiffness: 170, damping: 14 }}
                style={{ transformOrigin: '800px 250px', transformBox: 'view-box' }}
            >
                <rect x={630} y={150} width={340} height={115} rx={22} fill="#ffffff" stroke="#b91c1c" strokeWidth={10} />
                <text x={800} y={238} textAnchor="middle" fontSize={80} fontWeight={900} fill="#b91c1c" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    NEI
                </text>
            </motion.g>
            <Tekst x={800} y={640} str={34} farge="#7c2d12" vis={beat === 2}>
                Han er ikke en bremsekloss
            </Tekst>

            {/* Over enhver pris */}
            <Vis vis={beat >= 3}>
                <circle cx={800} cy={520} r={220} fill="#fde68a" opacity={0.6} />
                <Figur x={800} y={660} farge="#7c2d12" skala={1.8} />
                <g transform="translate(1180 420) rotate(12)">
                    <path d="M -150 -60 L 110 -60 L 160 0 L 110 60 L -150 60 Z" fill="#ffffff" stroke="#78716c" strokeWidth={5} />
                    <circle cx={110} cy={0} r={12} fill="#78716c" />
                    <text x={-30} y={14} textAnchor="middle" fontSize={40} fontWeight={900} fill="#78716c" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                        PRIS
                    </text>
                    <line x1={-150} y1={60} x2={130} y2={-60} stroke="#dc2626" strokeWidth={10} />
                </g>
                <Kort x={800} y={820} tekst="Ingen kan ofres for det felles beste" str={38} farge="#ffffff" kant="#fdba74" tekstFarge="#7c2d12" />
            </Vis>
        </Flate>
    );
}

export function PliktetikkMiddel({ beat, props }: VisualProps<{ modus?: Modus }>) {
    return props.modus === 'vekt' ? <VektScene beat={beat} /> : <TaxiScene beat={beat} />;
}
