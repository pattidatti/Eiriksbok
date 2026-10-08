// Foreleseren: en tegnet toon-figur med et lite skjelett og et canvas-ansikt.
//
// Hun leser alt fra `anim` (useForelesning) hvert bilde og bestemmer selv hvordan
// det skal se ut:
//  - Munnen åpner og lukker seg én gang per stavelse i ordet som sies nå.
//  - Gestene fra manuset spilles som korte nøkkelposer oppå en levende hvilestilling.
//  - Mellom gestene kommer små «beat»-bevegelser på ordene (idé fra TalkingHead).
//  - Blikket vandrer over salen og treffer deg av og til.
//  - Ved `peke-lerret` går hun bort til lerretet først, og tilbake etter en stund.
//
// En tegnet figur tåler en leppesynk som ikke er perfekt. En realistisk figur gjør ikke det.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { toonGradientMap } from '../../../components/microgames/kit';
import type { ForelesningAnim } from '../useForelesning';
import type { Gest, Humor } from '../types';
import type { Utseende } from '../saler';
import { FORELESER_HJEM, FORELESER_PEKEPLASS, FORELESER_SKALA, SCENE_HOYDE } from './salGeometri';

const SKO = '#1f2937';
const SKJORTE = '#f8fafc';

// ── Ansiktet ──────────────────────────────────────────────────────────────────
// Teksturen legges rundt hele hodekula (ekvirektangulært). Forsiden av kula (+z)
// ligger ved u = 0.25, altså x = 256 på en 1024 bred canvas. 1 grad = 2.84 px.

const ANSIKT_B = 1024;
const ANSIKT_H = 512;
const GRAD = ANSIKT_B / 360;
const CX = ANSIKT_B * 0.25;
const CY = ANSIKT_H / 2;

interface AnsiktTilstand {
    munn: number; // 0-1
    blink: number; // 0 = åpne, 1 = lukket
    humor: Humor;
}

interface AnsiktTrekk {
    hud: string;
    har: string;
    briller: boolean;
    skjegg: boolean;
}

const HUMOR_ANSIKT: Record<Humor, { bryn: number; smil: number; oye: number }> = {
    noytral: { bryn: 0, smil: 0.25, oye: 1 },
    glad: { bryn: 0.25, smil: 0.9, oye: 0.9 },
    nysgjerrig: { bryn: 0.6, smil: 0.35, oye: 1.1 },
    alvorlig: { bryn: -0.5, smil: -0.15, oye: 0.95 },
    overrasket: { bryn: 1, smil: 0.1, oye: 1.3 },
};

function tegnAnsikt(ctx: CanvasRenderingContext2D, a: AnsiktTilstand, trekk: AnsiktTrekk) {
    const h = HUMOR_ANSIKT[a.humor];
    ctx.fillStyle = trekk.hud;
    ctx.fillRect(0, 0, ANSIKT_B, ANSIKT_H);

    // Kinn
    ctx.fillStyle = 'rgba(225,120,100,0.28)';
    for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(CX + s * 24 * GRAD, CY + 10 * GRAD, 7 * GRAD, 4.5 * GRAD, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Øyne med blunk
    const oyeY = CY - 3 * GRAD;
    const oyeH = 5.2 * GRAD * h.oye * (1 - a.blink * 0.92);
    ctx.fillStyle = '#1a1008';
    for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(CX + s * 14 * GRAD, oyeY, 3.6 * GRAD, Math.max(1.5, oyeH), 0, 0, Math.PI * 2);
        ctx.fill();
    }
    if (a.blink < 0.5) {
        ctx.fillStyle = '#ffffff';
        for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(CX + s * 14 * GRAD + 1.2 * GRAD, oyeY - 1.6 * GRAD, 1.1 * GRAD, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Briller
    if (trekk.briller) {
        ctx.strokeStyle = '#3f2a1d';
        ctx.lineWidth = 1.6 * GRAD;
        for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(CX + s * 14 * GRAD, oyeY, 8.5 * GRAD, 7.5 * GRAD, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(CX - 5.5 * GRAD, oyeY - 1 * GRAD);
        ctx.quadraticCurveTo(CX, oyeY - 3.5 * GRAD, CX + 5.5 * GRAD, oyeY - 1 * GRAD);
        ctx.stroke();
    }

    // Skjegg: et tett felt rundt kjeven, munnen tegnes oppå.
    if (trekk.skjegg) {
        ctx.fillStyle = trekk.har;
        ctx.beginPath();
        ctx.ellipse(CX, CY + 19 * GRAD, 22 * GRAD, 13 * GRAD, 0, 0, Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(CX, CY + 13 * GRAD, 11 * GRAD, 3.5 * GRAD, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bryn
    const brynY = oyeY - 12.5 * GRAD - h.bryn * 2.5 * GRAD;
    ctx.strokeStyle = trekk.har;
    ctx.lineWidth = 2.2 * GRAD;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
        const indre = CX + s * 6 * GRAD;
        const ytre = CX + s * 21 * GRAD;
        // Alvorlig: indre ende ned. Nysgjerrig/overrasket: buet opp.
        ctx.beginPath();
        ctx.moveTo(indre, brynY + (h.bryn < 0 ? -h.bryn * 3 * GRAD : 0));
        ctx.quadraticCurveTo((indre + ytre) / 2, brynY - 2.5 * GRAD - Math.max(0, h.bryn) * 2 * GRAD, ytre, brynY + 1 * GRAD);
        ctx.stroke();
    }

    // Nese
    ctx.strokeStyle = 'rgba(150,90,60,0.6)';
    ctx.lineWidth = 1.2 * GRAD;
    ctx.beginPath();
    ctx.arc(CX, CY + 5 * GRAD, 2.4 * GRAD, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Munn
    const my = CY + 15 * GRAD;
    const mb = 8 * GRAD * (1 - a.munn * 0.25);
    if (a.munn > 0.08) {
        const mh = a.munn * 7 * GRAD;
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.moveTo(CX - mb, my);
        ctx.quadraticCurveTo(CX, my - mh * 0.5 - h.smil * 1.5 * GRAD, CX + mb, my);
        ctx.quadraticCurveTo(CX, my + mh * 1.4 + h.smil * 2 * GRAD, CX - mb, my);
        ctx.fill();
        if (a.munn > 0.35) {
            ctx.fillStyle = '#fff7ed';
            ctx.fillRect(CX - mb * 0.6, my - mh * 0.15, mb * 1.2, Math.min(mh * 0.35, 2.2 * GRAD));
        }
    } else {
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.8 * GRAD;
        ctx.beginPath();
        ctx.moveTo(CX - mb, my);
        ctx.quadraticCurveTo(CX, my + h.smil * 5 * GRAD, CX + mb, my);
        ctx.stroke();
    }
}

// ── Posene ────────────────────────────────────────────────────────────────────
// Vinkler i radianer. Armene henger ned (-y) i hvile. Skulder x < 0 = armen fram,
// skulder z > 0 = armen ut mot +x (venstre arm ut / høyre arm innover).

interface Pose {
    lean: number;
    torsoYaw: number;
    hodeYaw: number;
    hodePitch: number;
    hodeRoll: number;
    vSkX: number;
    vSkZ: number;
    vAlb: number;
    hSkX: number;
    hSkZ: number;
    hAlb: number;
}

const HVILE: Pose = {
    lean: 0.03,
    torsoYaw: 0,
    hodeYaw: 0,
    hodePitch: 0,
    hodeRoll: 0,
    vSkX: -0.25,
    vSkZ: 0.12,
    vAlb: -1.15,
    hSkX: -0.25,
    hSkZ: -0.12,
    hAlb: -1.15,
};

const VARIGHET: Record<Gest, number> = {
    'peke-lerret': 2.6,
    'aapne-hender': 1.7,
    'telle-fingre': 2.2,
    'lene-frem': 2.0,
    'hand-pa-bryst': 2.0,
    'riste-hode': 1.3,
    nikke: 1.1,
};

const glatt = (x: number) => x * x * (3 - 2 * x);

/** Inn de første 20 %, hold, ut de siste 25 %. */
function konvolutt(p: number) {
    if (p < 0.2) return glatt(p / 0.2);
    if (p > 0.75) return glatt(Math.max(0, (1 - p) / 0.25));
    return 1;
}

/** Hva gesten vil gjøre med posen, og hvor sterkt (0-1). */
function gestPose(navn: Gest, p: number): Partial<Pose> {
    const s = Math.sin;
    switch (navn) {
        case 'peke-lerret':
            return { vSkZ: 1.85, vSkX: 0.15, vAlb: -0.1, torsoYaw: 0.15, hodeYaw: p < 0.55 ? 0.9 : -0.2 };
        case 'aapne-hender':
            return { vSkX: -0.75, vSkZ: 0.7, vAlb: -0.45, hSkX: -0.75, hSkZ: -0.7, hAlb: -0.45, lean: -0.04, hodePitch: -0.06 };
        case 'telle-fingre': {
            const tapp = Math.max(0, s(p * Math.PI * 6)) * 0.25;
            return { hSkX: -0.55, hSkZ: 0.15, hAlb: -1.75, vSkX: -0.6 - tapp, vSkZ: -0.05, vAlb: -1.35 + tapp, hodePitch: 0.1 };
        }
        case 'lene-frem':
            return { lean: 0.24, vSkX: -0.8, vAlb: -0.55, hSkX: -0.8, hAlb: -0.55, hodePitch: -0.12 };
        case 'hand-pa-bryst':
            return { hSkX: -0.45, hSkZ: 0.5, hAlb: -2.05, hodePitch: 0.08, hodeRoll: 0.06 };
        case 'riste-hode':
            return { hodeYaw: s(p * Math.PI * 6) * 0.32 };
        case 'nikke':
            return { hodePitch: s(p * Math.PI * 4) * 0.2 };
    }
}

function blandInn(mal: Pose, tillegg: Partial<Pose>, vekt: number, additiv: (keyof Pose)[] = []) {
    for (const k of Object.keys(tillegg) as (keyof Pose)[]) {
        const v = tillegg[k] as number;
        mal[k] = additiv.includes(k) ? mal[k] + v * vekt : mal[k] + (v - mal[k]) * vekt;
    }
}

// ── Komponenten ───────────────────────────────────────────────────────────────

function Kapsel({ r, l, farge, y = 0 }: { r: number; l: number; farge: string; y?: number }) {
    const gradient = useMemo(() => toonGradientMap(), []);
    return (
        <mesh position={[0, y, 0]}>
            <capsuleGeometry args={[r, l, 4, 12]} />
            <meshToonMaterial color={farge} gradientMap={gradient} />
        </mesh>
    );
}

export function Foreleser({ anim, utseende: u }: { anim: React.MutableRefObject<ForelesningAnim>; utseende: Utseende }) {
    const camera = useThree((s) => s.camera);
    const gradient = useMemo(() => toonGradientMap(), []);

    const rot = useRef<THREE.Group>(null);
    const torso = useRef<THREE.Group>(null);
    const hode = useRef<THREE.Group>(null);
    const vSk = useRef<THREE.Group>(null);
    const vAlb = useRef<THREE.Group>(null);
    const hSk = useRef<THREE.Group>(null);
    const hAlb = useRef<THREE.Group>(null);
    const vBen = useRef<THREE.Group>(null);
    const hBen = useRef<THREE.Group>(null);

    const ansikt = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = ANSIKT_B;
        canvas.height = ANSIKT_H;
        const ctx = canvas.getContext('2d')!;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const trekk = { hud: u.hud, har: u.har, briller: u.briller, skjegg: u.skjegg };
        const tegn = (a: AnsiktTilstand) => {
            tegnAnsikt(ctx, a, trekk);
            tex.needsUpdate = true;
        };
        return { tex, tegn };
    }, [u.hud, u.har, u.briller, u.skjegg]);
    useEffect(() => () => ansikt.tex.dispose(), [ansikt]);

    // Tilstand som lever mellom bildene, uten re-render.
    const s = useRef({
        pos: new THREE.Vector2(FORELESER_HJEM[0], FORELESER_HJEM[1]),
        mal: new THREE.Vector2(FORELESER_HJEM[0], FORELESER_HJEM[1]),
        yaw: 0.35,
        pose: { ...HVILE },
        gangFase: 0,
        // peke-lerret: hvilken gest vi har tatt imot, om vi venter på å komme fram, når vi pekte sist
        sistGestStart: -1,
        pekerVenter: false,
        pekeStart: -100000,
        sistPekt: -100000,
        // småbevegelser og blikk
        sistOrdStart: -1,
        beatStart: -100000,
        blikkMal: new THREE.Vector3(0, 2, 3),
        nesteBlikk: 0,
        nesteBlink: 1500,
        blinkStart: -1000,
        ansiktNokkel: '',
    });

    useFrame((state, dt) => {
        const a = anim.current;
        const st = s.current;
        const naa = performance.now();
        const t = state.clock.getElapsedTime();
        dt = Math.min(dt, 0.05);

        // ── Gange: til lerretet når hun skal peke, tilbake når hun er ferdig ──
        if (a.gest && a.gest.start !== st.sistGestStart) {
            st.sistGestStart = a.gest.start;
            if (a.gest.navn === 'peke-lerret') {
                st.mal.set(FORELESER_PEKEPLASS[0], FORELESER_PEKEPLASS[1]);
                st.pekerVenter = true;
            }
        }
        const avstand = st.pos.distanceTo(st.mal);
        const gaar = avstand > 0.05;
        if (gaar) {
            const steg = Math.min(avstand, 1.3 * dt);
            const dir = st.mal.clone().sub(st.pos).normalize();
            st.pos.addScaledVector(dir, steg);
            st.gangFase += dt * 7.5;
        } else if (st.pekerVenter) {
            st.pekerVenter = false;
            st.pekeStart = naa;
            st.sistPekt = naa;
        }
        const vedLerret = st.pos.distanceTo(new THREE.Vector2(...FORELESER_PEKEPLASS)) < 0.2;
        if (vedLerret && !st.pekerVenter && naa - st.sistPekt > 9000) {
            st.mal.set(FORELESER_HJEM[0], FORELESER_HJEM[1]);
        }

        // ── Kroppens retning ──
        let yawMal: number;
        if (gaar) {
            const d = st.mal.clone().sub(st.pos);
            yawMal = Math.atan2(d.x, d.y);
        } else if (vedLerret) {
            yawMal = naa - st.pekeStart < VARIGHET['peke-lerret'] * 1000 ? 0.6 : 0.25;
        } else {
            yawMal = 0.35;
        }
        let dy = yawMal - st.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        st.yaw += dy * Math.min(1, dt * 4);

        // ── Målposen: hvile + humør + gest + småbevegelser ──
        const mal: Pose = { ...HVILE };
        mal.lean += Math.sin(t * 0.8) * 0.012;
        if (a.humor === 'alvorlig') blandInn(mal, { vAlb: -1.4, hAlb: -1.4, vSkZ: 0.25, hSkZ: -0.25 }, 1);
        if (a.humor === 'glad') blandInn(mal, { vSkZ: 0.25, hSkZ: -0.25, hodeRoll: -0.04 }, 1);
        if (a.humor === 'nysgjerrig') blandInn(mal, { hodeRoll: 0.08 }, 1);

        // Gest. peke-lerret bruker egen klokke, fordi hun må gå fram først.
        let gestAktiv = false;
        if (a.gest) {
            const start = a.gest.navn === 'peke-lerret' ? st.pekeStart : a.gest.start;
            const p = (naa - start) / (VARIGHET[a.gest.navn] * 1000);
            if (p >= 0 && p <= 1) {
                gestAktiv = true;
                const additiv: (keyof Pose)[] = a.gest.navn === 'riste-hode' || a.gest.navn === 'nikke' ? ['hodeYaw', 'hodePitch'] : [];
                blandInn(mal, gestPose(a.gest.navn, p), konvolutt(p), additiv);
            }
        }

        // Beat: et lite løft i hånda på noen av ordene, når ingen gest pågår.
        if (a.ord && a.ord.start !== st.sistOrdStart) {
            st.sistOrdStart = a.ord.start;
            if (!gestAktiv && (a.ord.stavelser >= 3 || Math.random() < 0.22)) st.beatStart = naa;
        }
        const bp = (naa - st.beatStart) / 420;
        if (bp >= 0 && bp <= 1 && !gestAktiv) {
            const b = Math.sin(bp * Math.PI);
            mal.hAlb -= 0.38 * b;
            mal.hSkX -= 0.12 * b;
            mal.hodePitch += 0.05 * b;
        }

        // Armer svinger når hun går (med mindre hun peker).
        if (gaar && !gestAktiv) {
            mal.vSkX = Math.sin(st.gangFase) * 0.35;
            mal.hSkX = -Math.sin(st.gangFase) * 0.35;
            mal.vAlb = mal.hAlb = -0.35;
        }

        // ── Blikket: vandrer over salen, og treffer eleven av og til ──
        if (naa > st.nesteBlikk) {
            st.nesteBlikk = naa + 2200 + Math.random() * 2800;
            if (Math.random() < 0.35) st.blikkMal.copy(camera.position);
            else st.blikkMal.set((Math.random() - 0.5) * 14, 1.5 + Math.random() * 2.5, -1 + Math.random() * 9);
        }
        const hodePos = new THREE.Vector3(st.pos.x, SCENE_HOYDE + 1.75 * FORELESER_SKALA, st.pos.y);
        const tilMal = st.blikkMal.clone().sub(hodePos);
        let blikkYaw = Math.atan2(tilMal.x, tilMal.z) - st.yaw - mal.torsoYaw;
        while (blikkYaw > Math.PI) blikkYaw -= Math.PI * 2;
        while (blikkYaw < -Math.PI) blikkYaw += Math.PI * 2;
        const blikkPitch = -Math.atan2(tilMal.y, Math.hypot(tilMal.x, tilMal.z));
        if (!gestAktiv || (a.gest && a.gest.navn !== 'peke-lerret')) {
            mal.hodeYaw += THREE.MathUtils.clamp(blikkYaw, -0.75, 0.75) * 0.8;
            mal.hodePitch += THREE.MathUtils.clamp(blikkPitch, -0.3, 0.25) * 0.7;
        }

        // Myk overgang mot målposen.
        const k = Math.min(1, dt * 9);
        for (const key of Object.keys(mal) as (keyof Pose)[]) st.pose[key] += (mal[key] - st.pose[key]) * k;
        const P = st.pose;

        // ── Skriv til skjelettet ──
        if (rot.current) {
            rot.current.position.set(st.pos.x, SCENE_HOYDE + (gaar ? Math.abs(Math.sin(st.gangFase)) * 0.03 : 0), st.pos.y);
            rot.current.rotation.y = st.yaw;
        }
        if (torso.current) {
            torso.current.rotation.set(P.lean, P.torsoYaw, 0);
            torso.current.scale.y = 1 + Math.sin(t * 1.7) * 0.008;
        }
        hode.current?.rotation.set(P.hodePitch, P.hodeYaw, P.hodeRoll);
        vSk.current?.rotation.set(P.vSkX, 0, P.vSkZ);
        vAlb.current?.rotation.set(P.vAlb, 0, 0);
        hSk.current?.rotation.set(P.hSkX, 0, P.hSkZ);
        hAlb.current?.rotation.set(P.hAlb, 0, 0);
        const ben = gaar ? Math.sin(st.gangFase) * 0.45 : 0;
        vBen.current?.rotation.set(ben, 0, 0);
        hBen.current?.rotation.set(-ben, 0, 0);

        // ── Ansiktet: munn per stavelse, blunk, humør ──
        let munn = 0;
        if (a.ord) {
            const p = (naa - a.ord.start) / a.ord.varighet;
            if (p >= 0 && p <= 1) munn = Math.abs(Math.sin(p * Math.PI * a.ord.stavelser)) * 0.85 + 0.1;
        }
        if (naa > st.nesteBlink) {
            st.blinkStart = naa;
            st.nesteBlink = naa + 2500 + Math.random() * 3500;
        }
        const blinkP = (naa - st.blinkStart) / 140;
        const blink = blinkP >= 0 && blinkP <= 1 ? Math.sin(blinkP * Math.PI) : 0;
        // Tegn bare på nytt når noe synlig har endret seg.
        const munnQ = Math.round(munn * 6) / 6;
        const blinkQ = Math.round(blink * 3) / 3;
        const nokkel = `${munnQ}|${blinkQ}|${a.humor}`;
        if (nokkel !== st.ansiktNokkel) {
            st.ansiktNokkel = nokkel;
            ansikt.tegn({ munn: munnQ, blink: blinkQ, humor: a.humor });
        }
    });

    return (
        <group ref={rot} position={[FORELESER_HJEM[0], SCENE_HOYDE, FORELESER_HJEM[1]]} scale={FORELESER_SKALA}>
            {/* Skygge under føttene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <circleGeometry args={[0.38, 24]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
            </mesh>

            {/* Bein */}
            {[
                { ref: vBen, x: 0.1 },
                { ref: hBen, x: -0.1 },
            ].map(({ ref, x }) => (
                <group key={x} ref={ref} position={[x, 0.95, 0]}>
                    <Kapsel r={0.08} l={0.72} farge={u.bukse} y={-0.46} />
                    <mesh position={[0, -0.9, 0.05]}>
                        <boxGeometry args={[0.13, 0.08, 0.27]} />
                        <meshToonMaterial color={SKO} gradientMap={gradient} />
                    </mesh>
                </group>
            ))}

            {/* Overkropp med hode og armer */}
            <group ref={torso} position={[0, 0.95, 0]}>
                <group scale={[1.15, 1, 0.8]}>
                    <Kapsel r={0.21} l={0.36} farge={u.jakke} y={0.32} />
                </group>
                {/* Skjortekrage */}
                <mesh position={[0, 0.6, 0.1]} rotation={[0.4, 0, Math.PI / 4]}>
                    <boxGeometry args={[0.13, 0.13, 0.04]} />
                    <meshToonMaterial color={SKJORTE} gradientMap={gradient} />
                </mesh>
                <Kapsel r={0.06} l={0.08} farge={u.hud} y={0.66} />

                <group ref={hode} position={[0, 0.8, 0]}>
                    <mesh>
                        <sphereGeometry args={[0.18, 32, 20]} />
                        <meshToonMaterial map={ansikt.tex} gradientMap={gradient} />
                    </mesh>
                    {/* Håret: en hette som er vippet bakover, pluss knute eller langt hår bak. */}
                    <mesh rotation={[u.harFasong === 'kort' ? -0.45 : -0.55, 0, 0]}>
                        <sphereGeometry args={[0.192, 24, 14, 0, Math.PI * 2, 0, Math.PI * (u.harFasong === 'kort' ? 0.45 : 0.52)]} />
                        <meshToonMaterial color={u.har} gradientMap={gradient} side={THREE.DoubleSide} />
                    </mesh>
                    {u.harFasong === 'knute' && (
                        <mesh position={[0, 0.06, -0.19]}>
                            <sphereGeometry args={[0.085, 16, 12]} />
                            <meshToonMaterial color={u.har} gradientMap={gradient} />
                        </mesh>
                    )}
                    {u.harFasong === 'langt' && (
                        <mesh position={[0, -0.12, -0.09]} scale={[1, 1, 0.55]}>
                            <capsuleGeometry args={[0.17, 0.22, 4, 16]} />
                            <meshToonMaterial color={u.har} gradientMap={gradient} />
                        </mesh>
                    )}
                </group>

                {[
                    { sk: vSk, alb: vAlb, x: 0.27 },
                    { sk: hSk, alb: hAlb, x: -0.27 },
                ].map(({ sk, alb, x }) => (
                    <group key={x} ref={sk} position={[x, 0.55, 0]}>
                        <Kapsel r={0.065} l={0.2} farge={u.jakke} y={-0.15} />
                        <group ref={alb} position={[0, -0.3, 0]}>
                            <Kapsel r={0.055} l={0.18} farge={u.jakke} y={-0.12} />
                            <mesh position={[0, -0.28, 0]}>
                                <sphereGeometry args={[0.065, 12, 10]} />
                                <meshToonMaterial color={u.hud} gradientMap={gradient} />
                            </mesh>
                        </group>
                    </group>
                ))}
            </group>
        </group>
    );
}
