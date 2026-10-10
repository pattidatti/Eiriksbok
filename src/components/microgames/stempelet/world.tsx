// Verden: kameraet fra saksbehandlerens stol (55 grader ned), skrivebordet, vinduslyset som
// glir over bordet i løpet av året og skifter farge med årstiden, køen utenfor luka, avisa
// med årets overskrift oppå bunken av gamle aviser, og rommet som mørkner år for år. Passene, stempelet og tingene på bordet bor i egne filer. Leser spillet fra gRef
// hver frame - ingen React-state per frame.

import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Particles, crispCanvas, useQuality } from '../kit';
import { BRETT, PLASSER, VANLIGE } from './levels';
import { nå, type Fx } from './fx';
import { sikt, trykk } from './game';
import { husleie, type Game } from './state';
import { Kart } from './kart';
import { TUNING } from './tuning';
import { tegnAvis, tegnBord, tegnKø, tegnVindu } from './tegning';
import { AVIS, TELEGRAM } from './texts';
import { PassPlass } from './pass';
import { Stempel } from './stempel';
import { Ark, Flygende, Hylle, Kasse, Regning } from './bordting';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const blikk = new THREE.Vector3(0, 0, 0.45);
const vinter = new THREE.Color('#cfe0ff');
const sommer = new THREE.Color('#fff0cf');
const grått = new THREE.Color('#8e9090');
const desember = new THREE.Color('#ffb46a');
const tmp = new THREE.Color();
const lampefarge = new THREE.Color('#ffcf96');

function Kamera({ fxRef }: { fxRef: FxRef }) {
    useFrame(({ camera, size }) => {
        const fx = fxRef.current;
        // Et kort rykk i 0,1 s når stempelet treffer (ekte tid, svinner av seg selv).
        const s = Math.max(0, 1 - (nå() - fx.slag) / 0.1) * (fx.slagFullt ? 1 : 0.5);
        camera.position.set(Math.sin(nå() * 90) * 0.022 * s, 7.3 - s * 0.05, 5.0);
        camera.lookAt(blikk);
        fx.kamera = camera;
        fx.w = size.width;
        fx.h = size.height;
    });
    return null;
}

function Bord({ gRef }: { gRef: GRef }) {
    const [tex] = useState(() => {
        const c = crispCanvas(1024, 520);
        c.draw((ctx, w, h) => tegnBord(ctx, w, h));
        return c.tex;
    });
    const flytt = (e: ThreeEvent<PointerEvent>) => sikt(gRef.current, e.point.x, e.point.z);
    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0.35]}
            userData={{ sceneAuditIgnore: true }}
            onPointerMove={flytt}
            onPointerDown={(e) => {
                flytt(e);
                trykk(gRef.current);
            }}
        >
            <planeGeometry args={[15.6, 7.9]} />
            <meshLambertMaterial map={tex} />
        </mesh>
    );
}

/**
 * Vinduslyset: tolv ruter med sprosser som glir over bordet i løpet av året. Blåhvitt om
 * vinteren, varmere om sommeren. Grått når kontoret stenger, lavt desemberlys ved seier.
 */
function Vindu({ gRef }: { gRef: GRef }) {
    const [tex] = useState(() => {
        const c = crispCanvas(240, 300);
        c.draw((ctx, w, h) => tegnVindu(ctx, w, h));
        return c.tex;
    });
    const lys = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    const sol = useRef<THREE.DirectionalLight>(null);
    useFrame(() => {
        const g = gRef.current;
        const år = g.iÅr / TUNING.år.sekunder;
        const m = mat.current;
        if (!m || !lys.current) return;
        const sommerAndel = Math.sin(Math.min(1, Math.max(0, år)) * Math.PI);
        if (g.mode === 'lost') tmp.copy(grått);
        else if (g.mode === 'won') tmp.copy(desember);
        else tmp.copy(vinter).lerp(sommer, sommerAndel);
        m.color.lerp(tmp, 0.05);
        m.opacity = g.mode === 'lost' ? 0.05 : 0.1 + sommerAndel * 0.05;
        lys.current.position.x = -4.2 + år * 7.5;
        lys.current.position.z = 0.4 - sommerAndel * 0.5;
        sol.current?.color.lerp(tmp, 0.05);
    });
    return (
        <>
            <directionalLight ref={sol} position={[-7, 9, 1]} intensity={1.5} color="#e6eeff" />
            <mesh ref={lys} rotation={[-Math.PI / 2, 0, -0.5]} position={[-3, 0.03, 0.2]} userData={{ sceneAuditIgnore: true }}>
                <planeGeometry args={[3.6, 4.6]} />
                <meshBasicMaterial
                    ref={mat}
                    map={tex}
                    color="#cfe0ff"
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </>
    );
}

/**
 * Tingene som kommer med pengene glir inn fra høyre: kassa i 1932 (gebyret), regningen i 1933
 * (husleia). Én ny ting per år.
 */
function GlirInn({
    gRef,
    når,
    children,
}: {
    gRef: GRef;
    når: (g: Game) => boolean;
    children: React.ReactNode;
}) {
    const ref = useRef<THREE.Group>(null);
    const kom = useRef(-1);
    useFrame(() => {
        const g = gRef.current;
        const gr = ref.current;
        if (!gr) return;
        if (!når(g)) {
            kom.current = -1;
            gr.visible = false;
            return;
        }
        if (kom.current < 0) kom.current = nå();
        const u = Math.min(1, (nå() - kom.current) / 0.7);
        gr.visible = true;
        gr.position.x = (1 - (1 - Math.pow(1 - u, 3))) * 4;
    });
    return <group ref={ref}>{children}</group>;
}

const harKasse = (g: Game) => BRETT[g.brett].penger;
const harLeie = (g: Game) => husleie(g.brett) > 0;

/** Hvor mange som står i køen utenfor luka, år for år (1935: bølgen fra Saar). */
const KØ = [2, 3, 4, 5, 8, 7, 8, 9];

/** Køen utenfor luka: en rad med ansikter bakerst på bordet. Tegnes på nytt når et pass kommer. */
function Kø({ gRef }: { gRef: GRef }) {
    const [lerret] = useState(() => crispCanvas(520, 70));
    const nøkkel = useRef('');
    useFrame(() => {
        const g = gRef.current;
        const n = KØ[g.brett] ?? 4;
        const k = `${g.brett}|${g.nesteId}`;
        if (k === nøkkel.current) return;
        nøkkel.current = k;
        const opptatt = new Set([...g.pass.map((p) => p.person), ...g.skuff.map((v) => v.person)]);
        const kø: number[] = [];
        for (let i = 0; i < VANLIGE && kø.length < n; i++) {
            const p = (g.nesteId * 3 + i * 7) % VANLIGE;
            if (!opptatt.has(p) && !kø.includes(p)) kø.push(p);
        }
        lerret.draw((ctx, w, h) => tegnKø(ctx, w, h, kø));
    });
    return (
        <mesh position={[0, 0.02, -1.78]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.6, 0.62]} />
            <meshBasicMaterial map={lerret.tex} transparent />
        </mesh>
    );
}

/** De gamle avisene under årets: litt på skrå, og gulere jo eldre de er. */
const GAMLE = Array.from({ length: 7 }, (_, i) => ({
    x: Math.sin(i * 2.3) * 0.12 - 0.06,
    z: Math.cos(i * 1.7) * 0.08 + 0.04,
    r: Math.sin(i * 3.1) * 0.22,
    farge: new THREE.Color('#d9c89a').lerp(new THREE.Color('#efe9da'), i / 7),
}));

/**
 * Rommet eldes år for år: dagslyset blir svakere og varmere mot 1938, og fra 1934 står
 * bordlampa på og kaster en gul lyskjegle over hjørnet (lange kvelder på kontoret).
 */
function Rom({ gRef }: { gRef: GRef }) {
    const amb = useRef<THREE.AmbientLight>(null);
    const lampe = useRef<THREE.MeshBasicMaterial>(null);
    const [tex] = useState(() => {
        const c = crispCanvas(128, 128);
        c.draw((ctx, w, h) => {
            const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
            gr.addColorStop(0, 'rgba(255,214,140,1)');
            gr.addColorStop(0.5, 'rgba(255,190,110,0.45)');
            gr.addColorStop(1, 'rgba(255,170,90,0)');
            ctx.fillStyle = gr;
            ctx.fillRect(0, 0, w, h);
        });
        return c.tex;
    });
    useFrame(() => {
        const g = gRef.current;
        const år = g.brett / (BRETT.length - 1);
        if (amb.current) {
            amb.current.intensity += (0.72 - år * 0.2 - amb.current.intensity) * 0.03;
            amb.current.color.lerp(tmp.set('#dfe7ee').lerp(lampefarge, år * 0.6), 0.03);
        }
        if (lampe.current) {
            const mål = g.brett >= 3 ? 0.18 + (g.brett - 3) * 0.06 : 0;
            lampe.current.opacity += (mål - lampe.current.opacity) * 0.03;
        }
    });
    return (
        <>
            <ambientLight ref={amb} intensity={0.72} color="#dfe7ee" />
            <mesh position={[-4.3, 0.04, -1.2]} rotation={[-Math.PI / 2, 0, 0]} userData={{ sceneAuditIgnore: true }}>
                <planeGeometry args={[3.6, 3.0]} />
                <meshBasicMaterial
                    ref={lampe}
                    map={tex}
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </>
    );
}

/** Avisa: ny overskrift hvert år. Sent i 1938 ligger telegrammet om fredsprisen der i stedet. */
function Avis({ gRef }: { gRef: GRef }) {
    const [lerret] = useState(() => crispCanvas(300, 180));
    const nøkkel = useRef('');
    useFrame(() => {
        const g = gRef.current;
        const telegram = g.brett === BRETT.length - 1 && g.iÅr >= 14;
        const k = `${g.brett}|${telegram}`;
        if (k === nøkkel.current) return;
        nøkkel.current = k;
        const år = BRETT[g.brett].år;
        lerret.draw((ctx, w, h) =>
            tegnAvis(ctx, w, h, år, telegram ? TELEGRAM : (AVIS[g.brett] ?? ''), telegram)
        );
    });
    const bunke = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(() => {
        const n = gRef.current.brett;
        bunke.current.forEach((m, i) => m && (m.visible = i < n));
    });
    return (
        <group position={[-3.35, 0.02, -1.72]} rotation={[0, 0.08, 0]}>
            {/* Bunken av gamle aviser: én til for hvert år kontoret har vært åpent. */}
            {GAMLE.map((a, i) => (
                <mesh
                    key={i}
                    ref={(m) => (bunke.current[i] = m)}
                    position={[a.x, -0.012 + i * 0.0012, a.z]}
                    rotation={[-Math.PI / 2, 0, a.r]}
                    visible={false}
                >
                    <planeGeometry args={[1.45, 0.87]} />
                    <meshLambertMaterial color={a.farge} />
                </mesh>
            ))}
            <mesh position={[0.04, -0.008, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.48, 0.9]} />
                <meshBasicMaterial color="#000" transparent opacity={0.3} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.45, 0.87]} />
                <meshLambertMaterial map={lerret.tex} />
            </mesh>
        </group>
    );
}

export function Verden({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const q = useQuality();
    return (
        <>
            <Rom gRef={gRef} />
            <hemisphereLight args={['#dfe9ff', '#1d2a24', 0.55]} />
            <Kamera fxRef={fxRef} />
            <Vindu gRef={gRef} />
            <Bord gRef={gRef} />
            {PLASSER.map((_, i) => (
                <PassPlass key={i} gRef={gRef} fxRef={fxRef} plass={i} />
            ))}
            <Kø gRef={gRef} />
            <Avis gRef={gRef} />
            <GlirInn gRef={gRef} når={harKasse}>
                <Kasse gRef={gRef} fxRef={fxRef} />
            </GlirInn>
            <GlirInn gRef={gRef} når={harLeie}>
                <Regning gRef={gRef} fxRef={fxRef} />
            </GlirInn>
            <Kart gRef={gRef} />
            <Flygende fxRef={fxRef} />
            <Hylle gRef={gRef} />
            <Ark gRef={gRef} />
            <Stempel gRef={gRef} fxRef={fxRef} />
            {q.tier !== 'lav' && (
                <group userData={{ sceneAuditIgnore: true }}>
                    <Particles preset="motes" count={40} area={[6, 4]} center={[-2.5, 1.2, 0]} height={2.5} />
                </group>
            )}
        </>
    );
}
