// Verden: kameraet fra saksbehandlerens stol (55 grader ned), skrivebordet, vinduslyset som
// glir over bordet i løpet av året og skifter farge med årstiden, pynten (blekkpute, penn),
// køen utenfor luka og avisa med årets overskrift. Passene, stempelet og tingene på bordet bor i egne filer. Leser spillet fra gRef
// hver frame - ingen React-state per frame.

import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Particles, crispCanvas, useQuality } from '../kit';
import { BRETT, PLASSER, VANLIGE } from './levels';
import { nå, type Fx } from './fx';
import { sikt, trykk } from './game';
import type { Game } from './state';
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

/** Pynt på bordet: blekkputa, en fyllepenn og en stabel mapper i hjørnene. */
function Pynt() {
    return (
        <group>
            {/* Blekkputa der stempelet hviler */}
            <mesh position={[0, 0.03, 2.35]}>
                <cylinderGeometry args={[0.4, 0.42, 0.06, 32]} />
                <meshStandardMaterial color="#8d918e" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.062, 2.35]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.33, 32]} />
                <meshLambertMaterial color="#6e3414" />
            </mesh>
            {/* Fyllepennen */}
            <mesh position={[1.2, 0.05, 2.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.045, 0.045, 1.1, 12]} />
                <meshStandardMaterial color="#141716" metalness={0.3} roughness={0.35} />
            </mesh>
            <mesh position={[0.58, 0.05, 2.5]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.045, 0.16, 12]} />
                <meshStandardMaterial color="#c8a24e" metalness={0.8} roughness={0.3} />
            </mesh>
        </group>
    );
}

/** Kassa og regningen kommer først i 1932, sammen med pengene: de glir inn fra høyre. */
function Pengeting({ gRef, children }: { gRef: GRef; children: React.ReactNode }) {
    const ref = useRef<THREE.Group>(null);
    const kom = useRef(-1);
    useFrame(() => {
        const g = gRef.current;
        const gr = ref.current;
        if (!gr) return;
        const på = BRETT[g.brett].penger;
        if (!på) {
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
    return (
        <group position={[-3.35, 0.02, -1.72]} rotation={[0, 0.08, 0]}>
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
            <ambientLight intensity={0.7} color="#dfe7ee" />
            <hemisphereLight args={['#dfe9ff', '#1d2a24', 0.55]} />
            <Kamera fxRef={fxRef} />
            <Vindu gRef={gRef} />
            <Bord gRef={gRef} />
            <Pynt />
            {PLASSER.map((_, i) => (
                <PassPlass key={i} gRef={gRef} fxRef={fxRef} plass={i} />
            ))}
            <Kø gRef={gRef} />
            <Avis gRef={gRef} />
            <Pengeting gRef={gRef}>
                <Kasse gRef={gRef} fxRef={fxRef} />
                <Regning gRef={gRef} fxRef={fxRef} />
            </Pengeting>
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
