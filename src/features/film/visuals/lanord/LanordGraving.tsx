import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { LAG, LAG_REKKE, type LagId } from './felles';

/**
 * Språkarkeologen: en utgraving i 3D der veggen viser fire jordlag, ett for hver bølge av
 * lånord. Det eldste laget ligger nederst.
 *
 *  - oversikt:    hele veggen, med nyest øverst og eldst nederst
 *  - kirke:       det nederste laget (kristendommen) med bok og kors
 *  - dansk:       laget med tysk gjennom dansk, med brev og fjærpenn
 *  - historiebok: lagene lyser opp ett etter ett, og hva hvert lag forteller
 *
 * All tekst ligger som DOM over lerretet.
 */

type Modus = 'oversikt' | 'kirke' | 'dansk' | 'historiebok';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Veggen står med forsiden mot +z og er flyttet til venstre for å gi plass til kortene. */
const VX = -2.4;
const BREDDE = 9;
const DYBDE = 4;
const FRONT = DYBDE / 2;
const HOYDER: Record<LagId, [number, number]> = {
    kirke: [0, 1.3],
    hansa: [1.3, 2.6],
    dansk: [2.6, 3.9],
    engelsk: [3.9, 5.0],
};
const TOPP = 5.0;

function midt(id: LagId) {
    const [a, b] = HOYDER[id];
    return (a + b) / 2;
}

/** Hvilke lag som lyser på denne beaten. */
function aktive(modus: Modus, beat: number): LagId[] {
    if (modus === 'kirke') return ['kirke'];
    if (modus === 'dansk') return ['dansk'];
    if (modus === 'historiebok') {
        if (beat === 0) return [];
        if (beat === 1) return ['kirke', 'hansa'];
        if (beat === 2) return ['dansk'];
        if (beat === 3) return ['engelsk'];
        return LAG_REKKE;
    }
    return beat >= 2 ? LAG_REKKE : [];
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'kirke') {
        return beat === 0
            ? { pos: v(-0.6, 2.8, 12.5), se: v(-1.2, 1.2, 0) }
            : { pos: v(-0.9, 1.5, 10 - Math.min(t, 6) * 0.04), se: v(-1.3, 0.9, 0) };
    }
    if (modus === 'dansk') {
        return beat === 0
            ? { pos: v(-0.6, 4.6, 12.5), se: v(-1.2, 3.0, 0) }
            : { pos: v(-0.9, 3.6, 10 - Math.min(t, 6) * 0.04), se: v(-1.3, 3.2, 0) };
    }
    if (modus === 'historiebok') {
        return beat >= 4
            ? { pos: v(0.5, 6.5, 16), se: v(-1.8, 2.0, 0) }
            : { pos: v(-1.2, 3.4, 13), se: v(-1.6, 2.5, 0) };
    }
    // oversikt
    if (beat === 0) {
        const a = 0.55 - Math.min(t, 10) * 0.03;
        return { pos: v(Math.sin(a) * 15, 7.5, Math.cos(a) * 15), se: v(0, 2.3, 0) };
    }
    return { pos: v(1.4, 3.2, 13), se: v(0.8, 2.5, 0) };
}

/* ---------------- Utgravingen ---------------- */

function Lag({ id, matRef }: { id: LagId; matRef: (m: THREE.MeshToonMaterial | null) => void }) {
    const [a, b] = HOYDER[id];
    return (
        <mesh position={[VX, (a + b) / 2, 0]}>
            <boxGeometry args={[BREDDE, b - a - 0.02, DYBDE]} />
            <meshToonMaterial ref={matRef} color={LAG[id].jord} />
        </mesh>
    );
}

/** Små steiner i veggen, så lagene ser ut som jord. Faste plasser fra et enkelt frø. */
const STEINER = (() => {
    const ut: { p: [number, number, number]; r: number; c: string }[] = [];
    let s = 7;
    const tilf = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
    for (let i = 0; i < 34; i++) {
        const y = 0.15 + tilf() * 4.7;
        ut.push({
            p: [VX - BREDDE / 2 + 0.3 + tilf() * (BREDDE - 0.6), y, FRONT + 0.02],
            r: 0.05 + tilf() * 0.09,
            c: y < 1.3 ? '#3a2e25' : y < 2.6 ? '#5e3d25' : y < 3.9 ? '#7d5530' : '#a8895e',
        });
    }
    return ut;
})();

function Steiner() {
    return (
        <>
            {STEINER.map((st, i) => (
                <mesh key={i} position={st.p} scale={[1, 0.7, 0.5]}>
                    <sphereGeometry args={[st.r, 8, 6]} />
                    <meshToonMaterial color={st.c} />
                </mesh>
            ))}
        </>
    );
}

function Omgivelser() {
    return (
        <group>
            {/* Gress på toppen og bakken bak */}
            <mesh position={[VX, TOPP + 0.12, 0]}>
                <boxGeometry args={[BREDDE, 0.24, DYBDE]} />
                <meshToonMaterial color="#5f8f3e" />
            </mesh>
            <mesh position={[VX, TOPP + 0.1, -12]}>
                <boxGeometry args={[40, 0.2, 20]} />
                <meshToonMaterial color="#6b9a47" />
            </mesh>
            {/* Bunnen av grøfta */}
            <mesh position={[VX + 4, -0.05, 6]}>
                <boxGeometry args={[30, 0.1, 8]} />
                <meshToonMaterial color="#8c7a62" />
            </mesh>
            {/* Snorer og pinner langs kanten */}
            {[-4.4, -1.4, 1.6, 4.4].map((x) => (
                <mesh key={x} position={[VX + x, TOPP + 0.55, FRONT - 0.15]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
                    <meshToonMaterial color="#e5d3a8" />
                </mesh>
            ))}
            <mesh position={[VX, TOPP + 0.85, FRONT - 0.15]}>
                <boxGeometry args={[8.8, 0.03, 0.03]} />
                <meshBasicMaterial color="#f8fafc" />
            </mesh>
            {/* Stige mot veggen */}
            <group position={[VX + 3.6, 0, FRONT + 0.6]} rotation={[-0.18, 0, 0]}>
                {[-0.35, 0.35].map((x) => (
                    <mesh key={x} position={[x, 2.9, 0]}>
                        <boxGeometry args={[0.1, 5.8, 0.1]} />
                        <meshToonMaterial color="#a16207" />
                    </mesh>
                ))}
                {Array.from({ length: 10 }, (_, i) => (
                    <mesh key={i} position={[0, 0.4 + i * 0.55, 0]}>
                        <boxGeometry args={[0.7, 0.07, 0.07]} />
                        <meshToonMaterial color="#ca8a04" />
                    </mesh>
                ))}
            </group>
            {/* Spade og bøtte i grøfta */}
            <group position={[VX + 5.6, 0, FRONT + 1.4]} rotation={[0, -0.4, 0.15]}>
                <mesh position={[0, 1.0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 1.8, 8]} />
                    <meshToonMaterial color="#92400e" />
                </mesh>
                <mesh position={[0, 0.1, 0]}>
                    <boxGeometry args={[0.45, 0.5, 0.05]} />
                    <meshToonMaterial color="#64748b" />
                </mesh>
            </group>
            <mesh position={[VX + 6.6, 0.3, FRONT + 2.2]}>
                <cylinderGeometry args={[0.35, 0.28, 0.6, 16]} />
                <meshToonMaterial color="#f59e0b" />
            </mesh>
        </group>
    );
}

function Bok({ apne }: { apne: React.RefObject<THREE.Group | null> }) {
    return (
        <group>
            <mesh position={[0.45, 0, 0]}>
                <boxGeometry args={[0.9, 0.12, 1.2]} />
                <meshToonMaterial color="#5b1d12" />
            </mesh>
            <mesh position={[0.45, 0.08, 0]}>
                <boxGeometry args={[0.84, 0.06, 1.14]} />
                <meshToonMaterial color="#f1e4c4" />
            </mesh>
            <group ref={apne}>
                <mesh position={[0.45, 0.14, 0]}>
                    <boxGeometry args={[0.9, 0.06, 1.2]} />
                    <meshToonMaterial color="#6b2416" />
                </mesh>
            </group>
        </group>
    );
}

function Funn({
    modus,
    beat,
    beatTid,
}: {
    modus: Modus;
    beat: number;
    beatTid: React.RefObject<number>;
}) {
    const kirke = useRef<THREE.Group>(null);
    const kors = useRef<THREE.Group>(null);
    const dansk = useRef<THREE.Group>(null);
    const omslag = useRef<THREE.Group>(null);
    const fjaer = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const t = beatTid.current;
        // Funnene i et aktivt lag trekkes ut av veggen.
        const ut = (aktiv: boolean) => (aktiv ? FRONT + 0.9 : FRONT - 0.05);
        if (kirke.current) {
            const aktiv = modus === 'kirke' && beat >= 1;
            kirke.current.position.z = damp(kirke.current.position.z, ut(aktiv), 3, dt);
            kirke.current.rotation.x = damp(kirke.current.rotation.x, aktiv ? 0.9 : 1.45, 3, dt);
        }
        if (omslag.current) {
            const apen = modus === 'kirke' && beat >= 4;
            omslag.current.rotation.z = damp(
                omslag.current.rotation.z,
                apen ? Math.PI * 0.95 : 0,
                2.5,
                dt
            );
        }
        if (kors.current) {
            const aktiv = modus === 'kirke' && beat >= 1;
            kors.current.position.z = damp(kors.current.position.z, ut(aktiv), 3, dt);
        }
        if (dansk.current) {
            const aktiv = modus === 'dansk' && beat >= 1;
            dansk.current.position.z = damp(dansk.current.position.z, ut(aktiv), 3, dt);
        }
        if (fjaer.current) {
            const skriver = modus === 'dansk' && beat >= 1;
            fjaer.current.rotation.z = skriver ? -0.5 + Math.sin(t * 3) * 0.08 : -0.5;
        }
    });

    return (
        <>
            {/* Kirken: bok og kors */}
            <group ref={kirke} position={[VX - 1.6, 0.62, FRONT - 0.05]} rotation={[1.45, 0, 0.1]}>
                <group position={[-0.45, 0, 0]}>
                    <Bok apne={omslag} />
                </group>
            </group>
            <group ref={kors} position={[VX + 1.7, 0.62, FRONT - 0.05]}>
                <mesh>
                    <boxGeometry args={[0.16, 0.9, 0.12]} />
                    <meshToonMaterial color="#d4a017" />
                </mesh>
                <mesh position={[0, 0.17, 0]}>
                    <boxGeometry args={[0.55, 0.15, 0.12]} />
                    <meshToonMaterial color="#d4a017" />
                </mesh>
            </group>
            {/* Hansaen: et lite skip */}
            <group position={[VX + 0.6, 1.9, FRONT + 0.02]} scale={0.8}>
                <mesh>
                    <boxGeometry args={[1.3, 0.35, 0.3]} />
                    <meshToonMaterial color="#3f2a1a" />
                </mesh>
                <mesh position={[0, 0.65, 0]}>
                    <boxGeometry args={[0.05, 1.0, 0.05]} />
                    <meshToonMaterial color="#3f2a1a" />
                </mesh>
                <mesh position={[0, 0.7, 0.04]}>
                    <boxGeometry args={[0.7, 0.6, 0.02]} />
                    <meshToonMaterial color="#e7dcc4" />
                </mesh>
            </group>
            {/* Tysk gjennom dansk: brev med segl og fjærpenn */}
            <group ref={dansk} position={[VX + 0.2, 3.25, FRONT - 0.05]}>
                <mesh>
                    <boxGeometry args={[1.2, 0.8, 0.06]} />
                    <meshToonMaterial color="#f5ecd6" />
                </mesh>
                <mesh position={[0, 0.05, 0.04]}>
                    <cylinderGeometry args={[0.13, 0.13, 0.04, 20]} />
                    <meshToonMaterial color="#b91c1c" />
                </mesh>
                <group ref={fjaer} position={[1.0, 0.05, 0.1]} rotation={[0, 0, -0.5]}>
                    <mesh>
                        <coneGeometry args={[0.1, 1.0, 10]} />
                        <meshToonMaterial color="#f8fafc" />
                    </mesh>
                </group>
            </group>
            {/* Engelsk: mobil og hodetelefoner */}
            <group position={[VX - 0.7, 4.45, FRONT + 0.02]} rotation={[0, 0, 0.25]}>
                <mesh>
                    <boxGeometry args={[0.45, 0.8, 0.07]} />
                    <meshToonMaterial color="#1e293b" />
                </mesh>
                <mesh position={[0, 0, 0.04]}>
                    <planeGeometry args={[0.38, 0.68]} />
                    <meshBasicMaterial color="#60a5fa" />
                </mesh>
            </group>
            <mesh position={[VX + 2.3, 4.45, FRONT + 0.02]}>
                <torusGeometry args={[0.32, 0.06, 8, 24, Math.PI]} />
                <meshToonMaterial color="#334155" />
            </mesh>
        </>
    );
}

function Scene({
    modus,
    beat,
    playing,
    plasser,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    plasser: (id: LagId, x: number, y: number) => void;
}) {
    const { camera, size } = useThree();
    const mats = useRef<Partial<Record<LagId, THREE.MeshToonMaterial | null>>>({});
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const beatTid = useRef(0);
    const forrige = useRef(beat);
    const tmp = useMemo(() => new THREE.Vector3(), []);
    const lys = aktive(modus, beat);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        for (const id of LAG_REKKE) {
            const m = mats.current[id];
            if (!m) continue;
            const paa = lys.includes(id);
            const dempet = lys.length > 0 && !paa;
            const mal = new THREE.Color(LAG[id].jord);
            if (paa) mal.lerp(new THREE.Color(LAG[id].farge), 0.35);
            if (dempet) mal.lerp(new THREE.Color('#2a2420'), 0.35);
            m.color.lerp(mal, forste.current ? 1 : 1 - Math.exp(-4 * Math.max(dt, 0.016)));
            m.emissive.set(LAG[id].farge);
            m.emissiveIntensity = paa ? 0.18 : 0;
        }

        const mal = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
        camera.updateMatrixWorld();

        // Merkelappene følger lagene på veggen.
        for (const id of LAG_REKKE) {
            tmp.set(VX - BREDDE / 2 + 0.45, midt(id), FRONT + 0.05).project(camera);
            const x = ((tmp.x + 1) / 2) * size.width;
            const y = ((1 - tmp.y) / 2) * size.height;
            plasser(id, x, y);
        }
    });

    return (
        <>
            <color attach="background" args={['#cfe0ea']} />
            <fog attach="fog" args={['#cfe0ea', 22, 60]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[5, 10, 9]} intensity={1.4} color="#fff3dc" />
            <hemisphereLight args={['#e0ecf5', '#6b5a45', 0.45]} />
            {LAG_REKKE.map((id) => (
                <Lag
                    key={id}
                    id={id}
                    matRef={(m) => {
                        mats.current[id] = m;
                    }}
                />
            ))}
            <Steiner />
            <Omgivelser />
            <Funn modus={modus} beat={beat} beatTid={beatTid} />
        </>
    );
}

/* ---------------- DOM over lerretet ---------------- */

/** Teksten på lagmerkene. I historieboka sier merket hva laget forteller. */
function merkeTekst(modus: Modus, id: LagId) {
    if (modus !== 'historiebok') return LAG[id].navn;
    return {
        kirke: 'Kirken: kristningen',
        hansa: 'Hansaen: handel',
        dansk: 'Dansk: skriftspråket',
        engelsk: 'Engelsk: internett',
    }[id];
}

function Lagmerker({
    modus,
    beat,
    merker,
}: {
    modus: Modus;
    beat: number;
    merker: React.RefObject<Record<string, HTMLDivElement | null>>;
}) {
    const lys = aktive(modus, beat);
    return (
        <div className="absolute inset-0 pointer-events-none">
            {LAG_REKKE.map((id) => {
                const vis = lys.includes(id) || (modus === 'historiebok' && beat >= 4);
                return (
                    <div
                        key={id}
                        ref={(el) => {
                            merker.current[id] = el;
                        }}
                        className="absolute left-0 top-0"
                        style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.6s' }}
                    >
                        {vis && (
                            <div
                                className="rounded-xl font-display font-black text-white shadow-xl whitespace-nowrap"
                                style={{
                                    background: LAG[id].farge,
                                    fontSize: 24,
                                    padding: '4px 14px',
                                }}
                            >
                                {merkeTekst(modus, id)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function Overskrift({ children }: { children: ReactNode }) {
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: '4%' }}
        >
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl shadow-2xl font-display font-black text-center"
                style={{
                    background: 'rgba(255,255,255,0.94)',
                    padding: '8px 26px',
                    fontSize: 34,
                    color: '#1f2937',
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}

/** Kortene til høyre for veggen. */
function Kolonne({ children }: { children: ReactNode }) {
    return (
        <div
            className="absolute flex flex-col pointer-events-none"
            style={{ right: '3%', top: '18%', width: '34%', gap: 12 }}
        >
            {children}
        </div>
    );
}

function Kort({
    children,
    farge = '#1f2937',
    bakgrunn = 'rgba(255,255,255,0.95)',
    forsinkelse = 0,
}: {
    children: ReactNode;
    farge?: string;
    bakgrunn?: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
            className="rounded-2xl shadow-xl font-display font-bold"
            style={{ background: bakgrunn, color: farge, padding: '10px 18px', fontSize: 24 }}
        >
            {children}
        </motion.div>
    );
}

function Ordbrikke({
    ord,
    farge,
    stor = false,
    forsinkelse = 0,
}: {
    ord: string;
    farge: string;
    stor?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 260, damping: 18 }}
            className="inline-block rounded-xl font-display font-black shadow-lg"
            style={{
                background: stor ? farge : '#ffffff',
                color: stor ? '#ffffff' : farge,
                border: `3px solid ${farge}`,
                padding: '4px 14px',
                fontSize: 26,
            }}
        >
            {ord}
        </motion.span>
    );
}

function OversiktTekst({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift>Språkarkeologen graver i norsk</Overskrift>
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute flex flex-col items-center pointer-events-none"
                        style={{ right: '6%', top: '20%', bottom: '10%', width: 170 }}
                    >
                        <div
                            className="rounded-xl font-display font-black text-white"
                            style={{ background: '#2563eb', fontSize: 24, padding: '4px 14px' }}
                        >
                            nyest
                        </div>
                        <div
                            className="flex-1 my-2"
                            style={{
                                width: 10,
                                background: 'linear-gradient(#2563eb, #7c3aed)',
                                borderRadius: 6,
                            }}
                        />
                        <div
                            className="rounded-xl font-display font-black text-white"
                            style={{ background: '#7c3aed', fontSize: 24, padding: '4px 14px' }}
                        >
                            eldst
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function KirkeTekst({ beat }: { beat: number }) {
    const f = LAG.kirke.farge;
    return (
        <>
            <Overskrift>Lag 1: kristendommen kommer</Overskrift>
            <Kolonne>
                {beat === 1 && <Kort>Prester og misjonærer: bøker, gudstjenester, ny tro</Kort>}
                {beat >= 2 && beat <= 3 && (
                    <Kort forsinkelse={0.1}>
                        <div style={{ fontSize: 20, color: '#64748b' }}>Ord fra</div>
                        <div className="flex flex-wrap" style={{ gap: 8, marginTop: 4 }}>
                            <Ordbrikke ord="gammelengelsk" farge={f} />
                            <Ordbrikke ord="latin" farge={f} forsinkelse={0.2} />
                            <Ordbrikke ord="gresk" farge={f} forsinkelse={0.4} />
                        </div>
                    </Kort>
                )}
                {beat >= 3 && (
                    <Kort>
                        <div className="flex" style={{ gap: 10 }}>
                            <Ordbrikke ord="skrive" farge={f} stor={beat >= 4} />
                            <Ordbrikke ord="biskop" farge={f} forsinkelse={0.3} />
                        </div>
                        <div style={{ fontSize: 21, color: '#334155', marginTop: 6 }}>
                            inn i norrønt via latin og gresk
                        </div>
                    </Kort>
                )}
                {beat >= 4 && (
                    <Kort bakgrunn={f} farge="#ffffff">
                        Kirken gjorde det vanlig å skrive bøker i Norge
                    </Kort>
                )}
            </Kolonne>
        </>
    );
}

const DANSKE = ['herre', 'frue', 'skute', 'klok', 'bruke', 'begynne', 'betale'];

function DanskTekst({ beat }: { beat: number }) {
    const f = LAG.dansk.farge;
    return (
        <>
            <Overskrift>Lag 3: tysk gjennom dansk</Overskrift>
            <Kolonne>
                {beat === 0 && <Kort>Reformasjonen: mange tyske lånord</Kort>}
                {beat === 1 && (
                    <Kort>
                        De første hundreårene av moderne norsk: dansk var skriftspråket i Norge
                    </Kort>
                )}
                {beat >= 2 && beat <= 3 && (
                    <Kort>
                        <div style={{ fontSize: 20, color: '#334155' }}>
                            Fra tysk, gjennom dansk:
                        </div>
                        <div className="flex flex-wrap" style={{ gap: 8, marginTop: 6 }}>
                            {DANSKE.map((o, i) => (
                                <Ordbrikke
                                    key={o}
                                    ord={o}
                                    farge={f}
                                    stor={beat === 3 && (o === 'begynne' || o === 'bruke')}
                                    forsinkelse={beat === 2 ? i * 0.35 : 0}
                                />
                            ))}
                        </div>
                    </Kort>
                )}
                {beat === 3 && (
                    <Kort bakgrunn={f} farge="#ffffff">
                        Ingen tenker på dem som lånord
                    </Kort>
                )}
                {beat >= 4 && (
                    <Kort bakgrunn="#1e3a8a" farge="#ffffff">
                        Også, på 1700-tallet: mange franske ord
                        <div style={{ fontSize: 20, opacity: 0.85 }}>
                            husk: høy status gjør det fristende å låne
                        </div>
                    </Kort>
                )}
            </Kolonne>
        </>
    );
}

function HistoriebokTekst({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift>Språket er en historiebok</Overskrift>
            <AnimatePresence>
                {beat >= 4 && (
                    <div
                        className="absolute inset-x-0 flex justify-center pointer-events-none"
                        style={{ bottom: '6%' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl shadow-2xl font-display font-black"
                            style={{
                                background: 'rgba(255,255,255,0.96)',
                                padding: '12px 26px',
                                fontSize: 34,
                                color: '#1f2937',
                            }}
                        >
                            <span>Jeg må </span>
                            <span style={{ color: LAG.dansk.farge }}>begynne</span>
                            <span> på leksene før </span>
                            <span style={{ color: '#0f766e' }}>fristen</span>
                            <span>.</span>
                            <div className="font-bold" style={{ fontSize: 19, color: '#64748b' }}>
                                <span style={{ color: LAG.dansk.farge }}>begynne</span>
                                <span>: tysk gjennom dansk · </span>
                                <span style={{ color: '#0f766e' }}>frist</span>
                                <span>: norsk ord i stedet for deadline</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

export function LanordGraving({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'oversikt';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = useRef<Record<string, HTMLDivElement | null>>({});
    const plasser = useCallback((id: LagId, x: number, y: number) => {
        const el = merker.current[id];
        if (el) el.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
    }, []);
    return (
        <div className="absolute inset-0">
            <Canvas
                key={modus}
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.1, far: 200, position: [6, 7, 14] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} plasser={plasser} />
            </Canvas>
            <Lagmerker modus={modus} beat={beat} merker={merker} />
            {modus === 'oversikt' && <OversiktTekst beat={beat} />}
            {modus === 'kirke' && <KirkeTekst beat={beat} />}
            {modus === 'dansk' && <DanskTekst beat={beat} />}
            {modus === 'historiebok' && <HistoriebokTekst beat={beat} />}
        </div>
    );
}
