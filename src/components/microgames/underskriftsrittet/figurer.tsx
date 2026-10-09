// Det som beveger seg: hesten (med bein som galopperer, fangstringen og pila til neste bygd),
// fogdens menn med lykt og lunte, dragonene, blekkstrekene som flyr fra husene til klagebrevet,
// og lyktene som tennes én etter én i epilogen. Alt leses fra spilltilstanden i useFrame,
// og alle mesher lages på forhånd (pool), aldri under spillet.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Game } from './game';
import { brettAv, leser, utÅpen } from './game';
import { BRETT } from './levels';
import { åsHøyde, clamp, dist, galoppAndel } from './rules';
import { FARGE } from './palette';
import { TUNING } from './tuning';
import type { Scene } from './scene';
import { glødTekstur, lunteTekstur } from './textures';
import { dragonFigur, fogdMann, hestBein, hestKropp } from './models';
import { konturMat, maltMat } from './kontur';

const T = TUNING;
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];
type GRef = React.MutableRefObject<Game>;
type SRef = React.MutableRefObject<Scene>;

/** Hvor pila peker: nærmeste bygd uten segl, eller utgangen når alle har segl. */
function nesteMål(g: Game): { x: number; z: number; ut: boolean } | null {
    const h = g.hest;
    if (utÅpen(g)) {
        const b = BRETT[g.brett];
        return { x: b.ut[0], z: b.ut[1], ut: true };
    }
    let best: { x: number; z: number; ut: boolean } | null = null;
    let bd = Infinity;
    for (const t of g.tun) {
        if (t.segl) continue;
        const d = dist(h.x, h.z, t.x, t.z);
        if (d < bd) {
            bd = d;
            best = { x: t.x, z: t.z, ut: false };
        }
    }
    return best;
}

const FANG_R = 2.5;
const FANG_LAG = 6;
/** Rytteren er tegnet stor fordi han er den du styrer, og skal synes først. */
const HEST_SKALA = 2.1;
const STØV = 10;

/** Hesten og rytteren, fangstringen rundt dem og pila til neste bygd. */
export function Hest({ gRef, sRef }: { gRef: GRef; sRef: SRef }) {
    const kropp = useMemo(() => hestKropp(), []);
    const bein = useMemo(() => hestBein(), []);
    const mat = useMemo(() => maltMat(), []);
    const kant = useMemo(() => konturMat(FARGE.blekk, 0.04), []);
    // Lys ytterkant rundt rytteren, så han skiller seg ut fra alt annet på kartet.
    const lysKant = useMemo(() => konturMat(FARGE.kalk, 0.085), []);
    useEffect(
        () => () => {
            kropp.dispose();
            bein.dispose();
        },
        [kropp, bein]
    );
    const rot = useRef<THREE.Group>(null);
    const lean = useRef<THREE.Group>(null);
    const beina = useRef<(THREE.Mesh | null)[]>([]);
    const fang = useRef<THREE.Group>(null);
    const fangMat = useMemo(
        () => new THREE.MeshBasicMaterial({ color: FARGE.kalk, toneMapped: false }),
        []
    );
    const pil = useRef<THREE.Group>(null);
    // Stemmen: hvor langt fogdens menn hører deg mens du leser høyt (fast ring), og
    // bølger som går ut fra rytteren.
    const hør = useRef<THREE.Group>(null);
    const hørMat = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: FARGE.fare,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                toneMapped: false,
            }),
        []
    );
    const bølgeMat = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: FARGE.fareLys,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                toneMapped: false,
            }),
        []
    );
    const bølge = useRef<THREE.Mesh>(null);
    const støv = useRef<(THREE.Mesh | null)[]>([]);
    const støvData = useRef(Array.from({ length: STØV }, () => ({ x: 0, z: 0, t: -9 })));
    const fase = useRef(0);
    const forrige = useRef({ r: 0, sving: 0, støv: 0, n: 0 });
    const pilForm = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(1.5, 0);
        s.lineTo(-0.5, 1.0);
        s.lineTo(-0.1, 0.32);
        s.lineTo(-1.1, 0.32);
        s.lineTo(-1.1, -0.32);
        s.lineTo(-0.1, -0.32);
        s.lineTo(-0.5, -1.0);
        s.closePath();
        return s;
    }, []);

    useFrame((_, rawDt) => {
        const g = gRef.current;
        const s = sRef.current;
        const dt = Math.min(0.05, rawDt);
        const h = g.hest;
        const ga = galoppAndel(h.fart);
        const spiller = g.mode === 'play';
        if (spiller) fase.current += dt * h.fart * 1.9;
        const p = fase.current;
        if (rot.current) {
            const åsY = åsHøyde(brettAv(g), h.x, h.z);
            rot.current.position.set(h.x, åsY + Math.abs(Math.sin(p)) * (0.05 + 0.12 * ga), h.z);
            rot.current.rotation.y = -h.retning;
        }
        // Hesten lener seg inn i svingen.
        const f = forrige.current;
        const svingFart = dt > 0 ? (h.retning - f.r) / dt : 0;
        f.r = h.retning;
        f.sving += (clamp(svingFart, -4, 4) - f.sving) * Math.min(1, dt * 6);
        if (lean.current) {
            lean.current.rotation.x = -f.sving * 0.06 * (0.4 + ga);
            // Tatt: hesten steiler.
            const tatt = s.fase === 'fanget';
            lean.current.rotation.z = tatt
                ? Math.min(0.7, (s.tid - s.faseFra) * 2.5)
                : Math.sin(p * 2) * 0.03 * ga;
        }
        const sving = 0.25 + 0.55 * ga;
        beina.current.forEach((m, k) => {
            if (!m) return;
            const forut = k < 2 ? 0 : Math.PI;
            const side = k % 2 ? 0.5 : 0;
            m.rotation.z = Math.sin(p + forut + side) * sving;
        });
        // Støv bak hesten i galopp.
        f.støv -= dt;
        if (spiller && ga > 0.45 && f.støv <= 0) {
            f.støv = 0.09;
            const d = støvData.current[f.n++ % STØV];
            d.x = h.x - Math.cos(h.retning) * 0.9;
            d.z = h.z - Math.sin(h.retning) * 0.9;
            d.t = s.tid;
        }
        støvData.current.forEach((d, k) => {
            const m = støv.current[k];
            if (!m) return;
            const a = (s.tid - d.t) / 0.7;
            m.visible = a >= 0 && a < 1;
            if (!m.visible) return;
            m.position.set(d.x, 0.2 + a * 0.6, d.z);
            m.scale.setScalar(0.25 + a * 0.6);
            (m.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - a);
        });
        if (fang.current) {
            // Lyset fyller ringen fra kanten og innover. Full ring = tatt.
            fang.current.position.set(h.x, 0.09, h.z);
            const lag = fang.current.children;
            for (let k = 0; k < FANG_LAG; k++) lag[2 + k].visible = g.fangst > k / FANG_LAG + 0.001;
            const fare = g.fangst > 0.01;
            settFarge(fangMat, fare && Math.sin(s.tid * 18) > 0 ? FARGE.fareLys : FARGE.kalk);
        }
        if (hør.current) settStemme(hør.current, bølge.current, hørMat, bølgeMat, g, s.tid);
        if (pil.current) {
            const m = nesteMål(g);
            const d = m ? dist(h.x, h.z, m.x, m.z) : 0;
            const inne = m && !m.ut ? d < T.tun.radius - 0.5 : d < 2.6;
            pil.current.visible = !!m && !inne && spiller;
            if (m && pil.current.visible) {
                const a = Math.atan2(m.z - h.z, m.x - h.x);
                pil.current.position.set(h.x + Math.cos(a) * 4.4, 0.12, h.z + Math.sin(a) * 4.4);
                pil.current.rotation.y = -a;
            }
        }
    });

    const BEIN: [number, number][] = [
        [0.55, 0.2],
        [0.55, -0.2],
        [-0.55, 0.2],
        [-0.55, -0.2],
    ];
    return (
        <>
            <group ref={rot} scale={HEST_SKALA}>
                <group ref={lean}>
                    <mesh geometry={kropp} material={mat} />
                    <mesh geometry={kropp} material={kant} />
                    <mesh geometry={kropp} material={lysKant} />
                    {BEIN.map(([x, z], k) => (
                        <mesh
                            key={k}
                            geometry={bein}
                            material={mat}
                            position={[x, 0.68, z]}
                            ref={(m) => {
                                beina.current[k] = m;
                            }}
                        />
                    ))}
                </group>
            </group>
            <group ref={fang}>
                <mesh rotation={FLAT} position={[0, -0.01, 0]}>
                    <ringGeometry args={[FANG_R - 0.08, FANG_R + 0.3, 48]} />
                    <meshBasicMaterial
                        color={FARGE.blekk}
                        transparent
                        opacity={0.7}
                        depthWrite={false}
                    />
                </mesh>
                <mesh rotation={FLAT} material={fangMat}>
                    <ringGeometry args={[FANG_R, FANG_R + 0.2, 48]} />
                </mesh>
                {Array.from({ length: FANG_LAG }, (_, k) => {
                    const ytre = FANG_R * (1 - k / FANG_LAG);
                    const indre = FANG_R * (1 - (k + 1) / FANG_LAG);
                    return (
                        <mesh key={k} rotation={FLAT} position={[0, 0.004 * k, 0]} visible={false}>
                            <ringGeometry args={[indre, ytre, 40]} />
                            <meshBasicMaterial
                                color={FARGE.fare}
                                transparent
                                opacity={0.85}
                                depthWrite={false}
                                toneMapped={false}
                            />
                        </mesh>
                    );
                })}
            </group>
            <group ref={hør} visible={false}>
                <mesh rotation={FLAT} material={hørMat}>
                    <ringGeometry args={[T.rop.hør - 0.12, T.rop.hør + 0.12, 72]} />
                </mesh>
                <mesh ref={bølge} rotation={FLAT} material={bølgeMat}>
                    <ringGeometry args={[0.92, 1, 56]} />
                </mesh>
            </group>
            <group ref={pil} visible={false}>
                <mesh rotation={FLAT} scale={1.18} position={[-0.05, -0.01, 0]}>
                    <shapeGeometry args={[pilForm]} />
                    <meshBasicMaterial color={FARGE.blekk} />
                </mesh>
                <mesh rotation={FLAT}>
                    <shapeGeometry args={[pilForm]} />
                    <meshBasicMaterial color={FARGE.navnLys} toneMapped={false} />
                </mesh>
            </group>
            {Array.from({ length: STØV }, (_, k) => (
                <mesh
                    key={k}
                    visible={false}
                    ref={(m) => {
                        støv.current[k] = m;
                    }}
                >
                    <sphereGeometry args={[0.5, 8, 6]} />
                    <meshBasicMaterial color="#b9c4a8" transparent depthWrite={false} />
                </mesh>
            ))}
        </>
    );
}

interface LyktMat {
    glød: THREE.MeshBasicMaterial;
    kant: THREE.MeshBasicMaterial;
    lunte: THREE.MeshBasicMaterial;
    lunteTex: THREE.Texture;
}

function settLyktMat(m: LyktMat, farlig: boolean, lev: number, blink: boolean) {
    m.glød.opacity = (farlig ? 0.95 : 0.45) * lev;
    m.kant.opacity = (farlig ? 1 : 0.35) * lev;
    m.kant.color.set(blink ? FARGE.kalk : FARGE.fare);
}

function settLunte(t: THREE.Texture, lengde: number, tid: number) {
    t.repeat.x = lengde / 0.9;
    t.offset.x = -tid * 0.8;
}

/** Stemmeringen: synlig mens du leser høyt, sterkere jo lenger du holder. Bølgen går ut fra
 *  rytteren til ringen og blekner (ringen selv står stille). */
function settStemme(
    gr: THREE.Group,
    bølge: THREE.Mesh | null,
    ring: THREE.MeshBasicMaterial,
    bm: THREE.MeshBasicMaterial,
    g: Game,
    tid: number
) {
    const på = g.mode === 'play' && leser(g);
    gr.visible = på;
    if (!på) return;
    gr.position.set(g.hest.x, 0.08, g.hest.z);
    const styrke = Math.min(1, g.ropT / T.rop.nærTid);
    ring.opacity = 0.25 + 0.5 * styrke;
    const a = (tid * (0.9 + styrke)) % 1;
    if (bølge) bølge.scale.setScalar(1 + a * (T.rop.hør - 1));
    bm.opacity = 0.7 * (1 - a);
}

function settFarge(m: THREE.MeshBasicMaterial, farge: string) {
    m.color.set(farge);
}

interface Slot {
    id: number;
    født: number;
    x: number;
    z: number;
}

/** Fogdens menn og dragonene: lyspøl, kant, figur, lykt og lunta mot bygda de går til. */
export function Lykter({ gRef, sRef }: { gRef: GRef; sRef: SRef }) {
    const pool = useRef<(THREE.Group | null)[]>([]);
    const slots = useRef<Slot[]>(
        Array.from({ length: T.lykt.maks }, () => ({ id: -1, født: 0, x: 0, z: 0 }))
    );
    const mann = useMemo(() => fogdMann(), []);
    const dragon = useMemo(() => dragonFigur(), []);
    const figurMat = useMemo(() => maltMat(), []);
    const rand = useMemo(() => konturMat(FARGE.fare, 0.07), []);
    const mats = useMemo(
        () =>
            Array.from({ length: T.lykt.maks }, () => {
                const lunte = lunteTekstur().clone();
                lunte.needsUpdate = true;
                return {
                    glød: new THREE.MeshBasicMaterial({
                        map: glødTekstur(),
                        transparent: true,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        depthTest: false,
                        toneMapped: false,
                    }),
                    kant: new THREE.MeshBasicMaterial({
                        color: FARGE.fare,
                        transparent: true,
                        depthTest: false,
                        toneMapped: false,
                    }),
                    lunte: new THREE.MeshBasicMaterial({
                        color: FARGE.fare,
                        map: lunte,
                        transparent: true,
                        depthWrite: false,
                        toneMapped: false,
                    }),
                    lunteTex: lunte,
                };
            }),
        []
    );
    useEffect(
        () => () => {
            mann.dispose();
            dragon.dispose();
            mats.forEach((m) => {
                m.glød.dispose();
                m.kant.dispose();
                m.lunte.dispose();
                m.lunteTex.dispose();
            });
        },
        [mann, dragon, mats]
    );

    useFrame(() => {
        const g = gRef.current;
        const s = sRef.current;
        const h = g.hest;
        for (let i = 0; i < T.lykt.maks; i++) {
            const o = pool.current[i];
            if (!o) continue;
            const l = g.lykter[i];
            o.visible = !!l;
            if (!l) continue;
            const sl = slots.current[i];
            if (sl.id !== l.id) {
                sl.id = l.id;
                sl.født = s.tid;
                sl.x = l.x;
                sl.z = l.z;
            }
            const går = dist(sl.x, sl.z, l.x, l.z) > 1e-3;
            sl.x = l.x;
            sl.z = l.z;
            o.position.set(l.x, 0, l.z);
            const [pøl, kant, fogd, drag, lunte, lykt] = o.children as THREE.Object3D[];
            const r = l.dragon ? T.dragon.lys : T.lykt.lys;
            // Tennes med et blaff: lyset slår ut, for stort, og legger seg.
            const a = clamp((s.tid - sl.født) / 0.45, 0, 1);
            const blaff = a < 1 ? Math.sin(a * Math.PI) * 0.45 + a : 1;
            // Slukker: går hjem (bygda er ferdig) eller tida er ute.
            const igjen = l.levetid - l.alder;
            const lev = l.hjem ? clamp(igjen / T.lykt.hjemTid, 0, 1) : clamp(igjen / 1.2, 0, 1);
            const tok = g.mode === 'lost' && g.fanger === l.id;
            const puls = tok ? 1 + 0.25 * Math.sin(s.tid * 14) : 1;
            pøl.scale.setScalar((r / 0.74) * blaff * puls);
            kant.scale.setScalar(r * blaff * puls);
            settLyktMat(mats[i], l.farlig, lev, tok && Math.sin(s.tid * 14) > 0);
            fogd.visible = !l.dragon;
            drag.visible = l.dragon;
            drag.rotation.y = -l.retning;
            const vugg = går && !l.hjem ? Math.sin(l.alder * 9) : 0;
            fogd.position.y = Math.abs(vugg) * 0.16 - (1 - lev) * 2.2;
            fogd.rotation.z = vugg * 0.08;
            lykt.position.set(
                l.dragon ? 0 : 0.62,
                (l.dragon ? 2.0 : 1.25) + Math.abs(vugg) * 0.1 - (1 - lev) * 2,
                0
            );
            lykt.scale.setScalar(lev * (tok ? 1.5 : 1));
            // Lunta: fra mannen til bygda han går mot. Den krymper når han kommer nærmere,
            // så du ser hvor lenge du kan skrive før du må ri.
            const dx = l.mx - l.x;
            const dz = l.mz - l.z;
            const lengde = Math.hypot(dx, dz);
            const vis =
                !l.dragon &&
                !l.hjem &&
                l.farlig &&
                l.modus !== 'står' &&
                lengde > T.lykt.leteRadius * 0.6 &&
                dist(l.mx, l.mz, h.x, h.z) < 18;
            lunte.visible = vis;
            if (vis) {
                lunte.rotation.y = -Math.atan2(dz, dx);
                const st = lunte.children[0];
                st.position.x = lengde / 2;
                st.scale.x = lengde;
                settLunte(mats[i].lunteTex, lengde, s.tid);
            }
        }
    });

    return (
        <>
            {Array.from({ length: T.lykt.maks }, (_, i) => (
                <group
                    key={i}
                    visible={false}
                    ref={(o) => {
                        pool.current[i] = o;
                    }}
                >
                    {/* Lyset tegnes oppå åsene, så det aldri gjemmer seg bak en kolle */}
                    <mesh
                        rotation={FLAT}
                        position={[0, 0.07, 0]}
                        renderOrder={2}
                        material={mats[i].glød}
                    >
                        <planeGeometry args={[2, 2]} />
                    </mesh>
                    <mesh
                        rotation={FLAT}
                        position={[0, 0.08, 0]}
                        renderOrder={3}
                        material={mats[i].kant}
                    >
                        <ringGeometry args={[0.93, 1, 48]} />
                    </mesh>
                    <group scale={1.3}>
                        <mesh geometry={mann} material={figurMat} />
                        <mesh geometry={mann} material={rand} />
                    </group>
                    <group visible={false}>
                        <mesh geometry={dragon} material={figurMat} />
                        <mesh geometry={dragon} material={rand} />
                    </group>
                    <group>
                        <mesh rotation={FLAT} position={[0, 0.06, 0]} material={mats[i].lunte}>
                            <planeGeometry args={[1, 0.3]} />
                        </mesh>
                    </group>
                    <mesh>
                        <sphereGeometry args={[0.24, 12, 8]} />
                        <meshBasicMaterial color={FARGE.fareLys} toneMapped={false} />
                    </mesh>
                </group>
            ))}
        </>
    );
}

function settMat(m: THREE.Mesh, mat: THREE.Material) {
    m.material = mat;
}

const BLEKK = 28;
const HUS = Array.from({ length: 3 }, (_, k) => {
    const a = (k / 3) * Math.PI * 2 + T.tun.husVinkel;
    return { x: Math.cos(a) * T.tun.husR, z: Math.sin(a) * T.tun.husR };
});
const V_A = new THREE.Vector3();
const V_B = new THREE.Vector3();
const X_AKSE = new THREE.Vector3(1, 0, 0);

/** Navnene som renner inn: blekkstreker som flyr i en bue fra husene til rytteren. */
export function Blekk({ gRef, sRef }: { gRef: GRef; sRef: SRef }) {
    const pool = useRef<(THREE.Mesh | null)[]>([]);
    const data = useRef(
        Array.from({ length: BLEKK }, () => ({ fx: 0, fz: 0, t: -9, dristig: false }))
    );
    const n = useRef(0);
    const mat = useMemo(
        () => [
            new THREE.MeshBasicMaterial({ color: FARGE.navnLys, toneMapped: false }),
            new THREE.MeshBasicMaterial({ color: FARGE.gull, toneMapped: false }),
        ],
        []
    );
    useFrame(() => {
        const g = gRef.current;
        const s = sRef.current;
        while (s.streker.length) {
            const st = s.streker.shift()!;
            const t = g.tun[st.tun];
            if (!t) continue;
            const d = data.current[n.current++ % BLEKK];
            const hus = HUS[st.hus % 3];
            d.fx = t.x + hus.x;
            d.fz = t.z + hus.z;
            d.t = s.tid;
            d.dristig = st.dristig;
        }
        const h = g.hest;
        data.current.forEach((d, k) => {
            const m = pool.current[k];
            if (!m) return;
            const a = (s.tid - d.t) / 0.5;
            m.visible = a >= 0 && a < 1;
            if (!m.visible) return;
            const e = a * a * (3 - 2 * a);
            const bue = Math.sin(a * Math.PI) * 2.2;
            V_A.set(d.fx + (h.x - d.fx) * e, 1.3 + bue, d.fz + (h.z - d.fz) * e);
            const e2 = Math.min(1, a + 0.05);
            V_B.set(
                d.fx + (h.x - d.fx) * e2,
                1.3 + Math.sin(e2 * Math.PI) * 2.2,
                d.fz + (h.z - d.fz) * e2
            );
            m.position.copy(V_A);
            V_B.sub(V_A).normalize();
            m.quaternion.setFromUnitVectors(X_AKSE, V_B);
            const sk = d.dristig ? 1.4 : 1;
            m.scale.set(sk * (0.6 + Math.sin(a * Math.PI) * 0.8), sk, sk);
            settMat(m, mat[d.dristig ? 1 : 0]);
        });
    });
    return (
        <>
            {Array.from({ length: BLEKK }, (_, k) => (
                <mesh
                    key={k}
                    visible={false}
                    material={mat[0]}
                    ref={(m) => {
                        pool.current[k] = m;
                    }}
                >
                    <boxGeometry args={[0.7, 0.11, 0.11]} />
                </mesh>
            ))}
        </>
    );
}

const EPILOG = 12;

/** Epilogen, mars 1787: lyktene tennes én etter én i en ring rundt rytteren, helt stille. */
export function EpilogLykter({ gRef, sRef }: { gRef: GRef; sRef: SRef }) {
    const pool = useRef<(THREE.Group | null)[]>([]);
    const mann = useMemo(() => fogdMann(), []);
    const figurMat = useMemo(() => maltMat(), []);
    const glød = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                map: glødTekstur(),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false,
            }),
        []
    );
    useEffect(() => () => mann.dispose(), [mann]);
    useFrame(() => {
        const s = sRef.current;
        const h = gRef.current.hest;
        const på = s.fase === 'epilog' && s.lys >= 2;
        const t = s.tid - s.faseFra - 3.2;
        const r = 7 - clamp(t / 6, 0, 1) * 2.4;
        pool.current.forEach((o, k) => {
            if (!o) return;
            const tent = på && t > k * 0.33;
            o.visible = tent;
            if (!tent) return;
            const a = (k / EPILOG) * Math.PI * 2 - Math.PI / 2;
            o.position.set(h.x + Math.cos(a) * r, 0, h.z + Math.sin(a) * r);
            o.rotation.y = -a + Math.PI;
            const blaff = clamp((t - k * 0.33) / 0.4, 0, 1);
            o.children[0].scale.setScalar(2.6 * blaff);
        });
    });
    return (
        <>
            {Array.from({ length: EPILOG }, (_, k) => (
                <group
                    key={k}
                    visible={false}
                    ref={(o) => {
                        pool.current[k] = o;
                    }}
                >
                    <mesh rotation={FLAT} position={[0, 0.07, 0]} material={glød}>
                        <planeGeometry args={[2, 2]} />
                    </mesh>
                    <group scale={1.3}>
                        <mesh geometry={mann} material={figurMat} />
                    </group>
                    <mesh position={[0.8, 1.6, 0]}>
                        <sphereGeometry args={[0.24, 10, 8]} />
                        <meshBasicMaterial color={FARGE.fareLys} toneMapped={false} />
                    </mesh>
                </group>
            ))}
        </>
    );
}
