// Gangen på universitetet: en lang, lys korridor med én dør per sal.
//
// Over hver dør henger et skilt som viser hva som går der akkurat nå, hvor lenge det
// er igjen og hva som kommer etterpå. I enden av gangen står programtavla med alle
// salene. Skiltene tegnes på nytt hvert femte sekund fra kringkastingsplanen.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { MicroCanvas, ToonMaterial } from '../../../components/microgames/kit';
import { SALER, UNIVERSITET, type Sal } from '../saler';
import { klokkeslett, sendingNaa, tidIgjen, type Program } from '../kringkasting';
import { Spiller, type SpillerModus } from './Spiller';
import type { Verden } from './verden';
import type { Sete } from './salGeometri';

const BREDDE = 8;
const HOYDE = 4.6;
const START_Z = 2;
const SLUTT_Z = -36;
const FONT = '"Outfit", "Inter", system-ui, sans-serif';

/** Hvor dør nummer i står: annenhver side, med jevn avstand. */
function dorPlass(i: number) {
    const side = i % 2 === 0 ? -1 : 1;
    return { x: (side * BREDDE) / 2, z: -5 - i * 6.5, side };
}

/** Dørene er «seter» for gangen: står eleven nær en, kan hen trykke E. */
const DORER: Sete[] = SALER.map((_, i) => {
    const d = dorPlass(i);
    return { id: i, rad: 0, x: d.x * 0.85, z: d.z, gulv: 0 };
});

const GANG_VERDEN: Verden = {
    grenser: { xMin: -BREDDE / 2 + 0.5, xMax: BREDDE / 2 - 0.5, zMin: SLUTT_Z + 1.5, zMax: START_Z - 0.6 },
    gulv: () => 0,
    seter: DORER,
    opptatt: new Set(),
    start: [0, START_Z - 1],
    blikk: new THREE.Vector3(0, 2.2, SLUTT_Z),
};

function lagCanvas(w: number, h: number) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { ctx: canvas.getContext('2d')!, tex, w, h };
}

const kortTekst = (ctx: CanvasRenderingContext2D, t: string, maks: number) => {
    if (ctx.measureText(t).width <= maks) return t;
    let s = t;
    while (s.length > 3 && ctx.measureText(`${s} ...`).width > maks) s = s.slice(0, -1);
    return `${s.trimEnd()} ...`;
};

function tegnSkilt(c: ReturnType<typeof lagCanvas>, sal: Sal, program: Program | null, naa: number) {
    const { ctx, w, h } = c;
    ctx.fillStyle = sal.farge;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, h - 120, w, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 92px ${FONT}`;
    ctx.fillText(sal.navn, 48, 112);

    const s = program ? sendingNaa(sal.id, program.saler[sal.id] ?? [], naa) : null;
    if (!s) return;
    ctx.font = `700 40px ${FONT}`;
    if (s.friminutt) {
        ctx.fillText('FRIMINUTT', 48, 190);
        ctx.font = `500 40px ${FONT}`;
        ctx.fillText(kortTekst(ctx, `Neste: ${s.neste.tittel}`, w - 96), 48, 250);
        ctx.fillText(`Starter kl. ${klokkeslett(s.nesteStart)}`, 48, h - 45);
    } else {
        // Rød prikk: direkte.
        ctx.fillStyle = '#fecaca';
        ctx.beginPath();
        ctx.arc(64, 177, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('NÅ', 92, 192);
        ctx.font = `700 48px ${FONT}`;
        ctx.fillText(kortTekst(ctx, s.post.tittel, w - 96), 48, 255);
        // Fremdrift
        const p = Math.min(1, (naa - s.start) / (s.slutt - s.start));
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(48, 282, w - 96, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(48, 282, (w - 96) * p, 12);
        ctx.font = `500 36px ${FONT}`;
        ctx.fillText(kortTekst(ctx, `${tidIgjen(s.slutt - naa)} · Neste: ${s.neste.tittel}`, w - 96), 48, h - 45);
    }
    c.tex.needsUpdate = true;
}

function tegnTavle(c: ReturnType<typeof lagCanvas>, program: Program | null, naa: number) {
    const { ctx, w, h } = c;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fbbf24';
    ctx.font = `800 64px ${FONT}`;
    ctx.fillText('Dagens forelesninger', 70, 110);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 34px ${FONT}`;
    ctx.fillText(`${UNIVERSITET} · klokka er ${klokkeslett(naa)}`, 70, 160);

    SALER.forEach((sal, i) => {
        const y = 250 + i * 128;
        ctx.fillStyle = sal.farge;
        ctx.beginPath();
        ctx.roundRect(70, y - 52, 300, 84, 16);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 38px ${FONT}`;
        ctx.fillText(sal.navn, 92, y + 2);
        const s = program ? sendingNaa(sal.id, program.saler[sal.id] ?? [], naa) : null;
        if (!s) return;
        ctx.fillStyle = '#f8fafc';
        ctx.font = `700 40px ${FONT}`;
        const naaTekst = s.friminutt ? 'Friminutt' : s.post.tittel;
        ctx.fillText(kortTekst(ctx, naaTekst, w - 520), 400, y - 10);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `500 30px ${FONT}`;
        const under = s.friminutt
            ? `Neste kl. ${klokkeslett(s.nesteStart)}: ${s.neste.tittel}`
            : `${tidIgjen(s.slutt - naa)} · neste: ${s.neste.tittel}`;
        ctx.fillText(kortTekst(ctx, under, w - 520), 400, y + 30);
    });
    c.tex.needsUpdate = true;
}

function Boks({ pos, str, farge }: { pos: [number, number, number]; str: [number, number, number]; farge: string }) {
    return (
        <mesh position={pos}>
            <boxGeometry args={str} />
            <ToonMaterial color={farge} />
        </mesh>
    );
}

function Dor({ sal, i, skilt, onKlikk }: { sal: Sal; i: number; skilt: THREE.Texture; onKlikk: () => void }) {
    const { x, z, side } = dorPlass(i);
    // Døra og skiltet vender inn mot gangen.
    const rot = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    return (
        <group position={[x - side * 0.02, 0, z]} rotation={[0, rot, 0]}>
            <Boks pos={[0, 1.4, -0.02]} str={[2.1, 2.9, 0.08]} farge={sal.farge} />
            <mesh
                position={[0, 1.3, 0.04]}
                onClick={(e) => {
                    e.stopPropagation();
                    onKlikk();
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = '')}
            >
                <boxGeometry args={[1.7, 2.6, 0.06]} />
                <ToonMaterial color="#a77a4f" />
            </mesh>
            <Boks pos={[0.6, 1.25, 0.1]} str={[0.08, 0.3, 0.06]} farge="#e5c07b" />
            {/* Vindu i døra */}
            <mesh position={[0, 1.95, 0.08]}>
                <planeGeometry args={[0.5, 0.7]} />
                <meshBasicMaterial color="#fde68a" toneMapped={false} />
            </mesh>
            {/* Skiltet over døra */}
            <mesh position={[0, 3.45, 0.06]}>
                <planeGeometry args={[2.6, 2.6 * (420 / 1024)]} />
                <meshBasicMaterial map={skilt} toneMapped={false} />
            </mesh>
        </group>
    );
}

function Plante({ pos }: { pos: [number, number, number] }) {
    return (
        <group position={pos}>
            <Boks pos={[0, 0.3, 0]} str={[0.5, 0.6, 0.5]} farge="#9a3412" />
            <mesh position={[0, 1.05, 0]}>
                <sphereGeometry args={[0.45, 12, 10]} />
                <ToonMaterial color="#15803d" />
            </mesh>
        </group>
    );
}

export function GangScene({
    program,
    naa,
    modus,
    onNaerDor,
    onGaInn,
}: {
    program: Program | null;
    naa: number;
    modus: SpillerModus;
    onNaerDor: (sal: Sal | null) => void;
    onGaInn: (sal: Sal) => void;
}) {
    const skilt = useMemo(() => SALER.map(() => lagCanvas(1024, 420)), []);
    const tavle = useMemo(() => lagCanvas(1600, 900), []);
    const banner = useMemo(() => {
        const c = lagCanvas(1600, 260);
        c.ctx.fillStyle = '#ffffff';
        c.ctx.fillRect(0, 0, 1600, 260);
        c.ctx.fillStyle = '#1e293b';
        c.ctx.font = `800 120px ${FONT}`;
        c.ctx.textAlign = 'center';
        c.ctx.fillText(UNIVERSITET.toUpperCase(), 800, 165);
        c.ctx.fillStyle = '#b45309';
        c.ctx.fillRect(500, 205, 600, 10);
        c.tex.needsUpdate = true;
        return c;
    }, []);

    useEffect(() => {
        SALER.forEach((sal, i) => tegnSkilt(skilt[i], sal, program, naa));
        tegnTavle(tavle, program, naa);
    }, [skilt, tavle, program, naa]);

    useEffect(
        () => () => {
            skilt.forEach((c) => c.tex.dispose());
            tavle.tex.dispose();
            banner.tex.dispose();
        },
        [skilt, tavle, banner]
    );

    const lengde = START_Z - SLUTT_Z;
    const midtZ = (START_Z + SLUTT_Z) / 2;

    return (
        <MicroCanvas controls={false} builtInLights={false} contactShadows={false} fog={null} background="#f3ece0" camera={{ position: [0, 1.6, 1], fov: 60 }}>
            <ambientLight intensity={1.1} />
            <hemisphereLight args={['#fffaf0', '#d6c7b0', 0.6]} />
            <directionalLight position={[3, 8, 4]} intensity={0.6} color="#fff3d6" />

            {/* Gulv, tak, vegger */}
            <Boks pos={[0, -0.05, midtZ]} str={[BREDDE, 0.1, lengde]} farge="#e7e1d6" />
            <Boks pos={[0, 0.003, midtZ]} str={[2.2, 0.01, lengde - 2]} farge="#9f1239" />
            <Boks pos={[0, HOYDE + 0.05, midtZ]} str={[BREDDE, 0.1, lengde]} farge="#fbf7f0" />
            <Boks pos={[-BREDDE / 2 - 0.05, HOYDE / 2, midtZ]} str={[0.1, HOYDE, lengde]} farge="#fbf6ec" />
            <Boks pos={[BREDDE / 2 + 0.05, HOYDE / 2, midtZ]} str={[0.1, HOYDE, lengde]} farge="#fbf6ec" />
            <Boks pos={[0, HOYDE / 2, START_Z + 0.05]} str={[BREDDE, HOYDE, 0.1]} farge="#fbf6ec" />
            <Boks pos={[0, HOYDE / 2, SLUTT_Z - 0.05]} str={[BREDDE, HOYDE, 0.1]} farge="#fbf6ec" />
            {/* Trepanel nederst */}
            <Boks pos={[-BREDDE / 2 + 0.03, 0.55, midtZ]} str={[0.06, 1.1, lengde]} farge="#d9b78f" />
            <Boks pos={[BREDDE / 2 - 0.03, 0.55, midtZ]} str={[0.06, 1.1, lengde]} farge="#d9b78f" />

            {/* Taklys */}
            {Array.from({ length: 9 }, (_, i) => (
                <mesh key={i} position={[0, HOYDE - 0.02, START_Z - 2 - i * 4.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1.2, 2.4]} />
                    <meshBasicMaterial color="#fffbea" toneMapped={false} />
                </mesh>
            ))}

            {/* Banneret over inngangen */}
            <mesh position={[0, 3.6, START_Z - 3]} rotation={[0, 0, 0]}>
                <planeGeometry args={[5, 5 * (260 / 1600)]} />
                <meshBasicMaterial map={banner.tex} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>

            {/* Programtavla i enden */}
            <group position={[0, 2.3, SLUTT_Z + 0.08]}>
                <Boks pos={[0, 0, -0.03]} str={[6.4, 3.8, 0.06]} farge="#475569" />
                <mesh>
                    <planeGeometry args={[6.1, 6.1 * (900 / 1600)]} />
                    <meshBasicMaterial map={tavle.tex} toneMapped={false} />
                </mesh>
            </group>

            {SALER.map((sal, i) => (
                <Dor key={sal.id} sal={sal} i={i} skilt={skilt[i].tex} onKlikk={() => onGaInn(sal)} />
            ))}

            {/* Benker og planter mellom dørene */}
            {SALER.map((_, i) => {
                const { z, side } = dorPlass(i);
                const x = (-side * BREDDE) / 2 + -side * -0.45;
                return (
                    <group key={i}>
                        <Boks pos={[x, 0.45, z - 0.5]} str={[0.5, 0.08, 2.2]} farge="#7c5a3c" />
                        <Boks pos={[x, 0.22, z - 1.4]} str={[0.45, 0.44, 0.1]} farge="#5b4130" />
                        <Boks pos={[x, 0.22, z + 0.4]} str={[0.45, 0.44, 0.1]} farge="#5b4130" />
                        <Plante pos={[x, 0, z + 1.6]} />
                    </group>
                );
            })}

            <Spiller
                verden={GANG_VERDEN}
                modus={modus}
                sete={null}
                onFremme={() => {}}
                onNaerSete={(d) => onNaerDor(d ? SALER[d.id] : null)}
            />
        </MicroCanvas>
    );
}
