// Europakartet midt nederst på bordet: det passet GA. Når en person reiser videre med gyldig
// pass, flyr et lite grønt pass fra plassen ut til landet på kartet, og landet tennes i gull
// med året det første passet kom dit. Kartet vokser av elevens arbeid, år for år.
// Leser spillet fra gRef hver frame - ingen React-state per frame.

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas } from '../kit';
import { FARGE } from './farger';
import { nå } from './fx';
import { BRETT, GENEVE, KART_LERRET, KART_PLASS, LAND, PLASSER } from './levels';
import type { Game } from './state';
import { SKRIFT_DECO, SKRIFT_SERIF } from './tegning';
import { REISEMÅL } from './texts';

type GRef = React.MutableRefObject<Game>;

/** Sekunder passet bruker i lufta fra bordet til landet. */
const FLY = 0.9;
const FLIS = { b: 92, h: 38 };
const FLYVERE = 3;

/** Midten av en flis i verdenskoordinater. */
function påBordet(x: number, y: number) {
    return {
        x: KART_PLASS.x + (x / KART_LERRET.w - 0.5) * KART_PLASS.b,
        z: KART_PLASS.z + (y / KART_LERRET.h - 0.5) * KART_PLASS.d,
    };
}

function rundRekt(ctx: CanvasRenderingContext2D, x: number, y: number, b: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + b, y, x + b, y + h, r);
    ctx.arcTo(x + b, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + b, y, r);
    ctx.closePath();
}

/** Kartet: havet, flisene (grå = ikke nådd, gull = nådd, med året), og reiselinjer fra Genève. */
function tegnKart(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tent: Map<number, number>,
    år: number
) {
    // Havet: gammelt kartpapir i grønnblått, med lengde- og breddegrader.
    ctx.fillStyle = '#9fb3ad';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 20, h);
        ctx.stroke();
    }
    for (let y = 20; y < h; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y - 8);
        ctx.stroke();
    }
    // Reiselinjer fra Genève til hvert land som er nådd.
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(122,74,16,0.85)';
    for (const land of tent.keys()) {
        const l = LAND[land];
        ctx.beginPath();
        ctx.moveTo(GENEVE.x, GENEVE.y);
        ctx.quadraticCurveTo((GENEVE.x + l.x) / 2, Math.min(GENEVE.y, l.y) - 30, l.x, l.y);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    // Flisene.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    LAND.forEach((l, i) => {
        const nådd = tent.get(i);
        const x = l.x - FLIS.b / 2;
        const y = l.y - FLIS.h / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        rundRekt(ctx, x + 3, y + 4, FLIS.b, FLIS.h, 7);
        ctx.fill();
        ctx.fillStyle = nådd !== undefined ? FARGE.gull : '#d8d0b8';
        rundRekt(ctx, x, y, FLIS.b, FLIS.h, 7);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = nådd !== undefined ? '#fff6d8' : '#a69d84';
        ctx.stroke();
        const navn = REISEMÅL[i];
        ctx.fillStyle = nådd !== undefined ? FARGE.tekst : '#7d7562';
        ctx.font = `700 ${navn.length > 10 ? 10 : 13}px ${SKRIFT_DECO}`;
        ctx.fillText(navn.toUpperCase(), l.x, l.y - (nådd !== undefined ? 6 : 0));
        if (nådd !== undefined) {
            ctx.font = `700 12px ${SKRIFT_SERIF}`;
            ctx.fillText(String(nådd), l.x, l.y + 10);
        }
    });
    // Genève: kontoret, en rød stjerne.
    ctx.fillStyle = FARGE.rød;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 5 : 12;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx.lineTo(GENEVE.x + Math.cos(a) * r, GENEVE.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Tittel og år øverst til venstre.
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(21,23,26,0.8)';
    ctx.font = `800 22px ${SKRIFT_DECO}`;
    ctx.fillText('EUROPA', 14, 24);
    ctx.font = `700 16px ${SKRIFT_SERIF}`;
    ctx.fillText(String(år), 14, 46);
}

interface Flyver {
    land: number;
    fra: { x: number; z: number };
    start: number;
}

export function Kart({ gRef }: { gRef: GRef }) {
    const [lerret] = useState(() => crispCanvas(KART_LERRET.w, KART_LERRET.h));
    const sett = useRef(0);
    const tent = useRef(new Map<number, number>());
    const flyvere = useRef<Flyver[]>([]);
    const nøkkel = useRef('');
    const pass = useRef<(THREE.Mesh | null)[]>([]);
    const ringer = useRef<(THREE.Mesh | null)[]>([]);
    const ringTid = useRef<{ land: number; t: number }[]>([]);
    const ringMat = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

    useFrame(() => {
        const g = gRef.current;
        const t = nå();
        // Ny runde: kartet blir tomt igjen.
        if (g.reiser.length < sett.current) {
            sett.current = 0;
            tent.current.clear();
            flyvere.current = [];
            ringTid.current = [];
        }
        while (sett.current < g.reiser.length) {
            const r = g.reiser[sett.current++];
            const pl = PLASSER[r.plass] ?? PLASSER[0];
            flyvere.current.push({ land: r.land, fra: { x: pl.x, z: pl.z }, start: t });
            if (flyvere.current.length > FLYVERE) {
                const tidlig = flyvere.current.shift();
                if (tidlig && !tent.current.has(tidlig.land))
                    tent.current.set(tidlig.land, BRETT[g.brett].år);
            }
        }
        // Passene i lufta: en bue fra plassen ut til landet. Framme = landet tennes.
        flyvere.current = flyvere.current.filter((f) => {
            const u = (t - f.start) / FLY;
            if (u < 1) return true;
            if (!tent.current.has(f.land)) tent.current.set(f.land, BRETT[g.brett].år);
            ringTid.current.push({ land: f.land, t });
            if (ringTid.current.length > FLYVERE) ringTid.current.shift();
            return false;
        });
        for (let i = 0; i < FLYVERE; i++) {
            const m = pass.current[i];
            if (!m) continue;
            const f = flyvere.current[i];
            m.visible = !!f;
            if (!f) continue;
            const u = Math.min(1, (t - f.start) / FLY);
            const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
            const mål = påBordet(LAND[f.land].x, LAND[f.land].y);
            m.position.set(
                f.fra.x + (mål.x - f.fra.x) * e,
                0.08 + Math.sin(u * Math.PI) * 1.1,
                f.fra.z + (mål.z - f.fra.z) * e
            );
            m.rotation.set(-Math.PI / 2 + Math.sin(u * Math.PI) * 0.5, 0, u * Math.PI * 2);
            m.scale.setScalar(1 - u * 0.35);
        }
        // Ringen som går ut fra landet når passet lander.
        for (let i = 0; i < FLYVERE; i++) {
            const m = ringer.current[i];
            const mat = ringMat.current[i];
            if (!m || !mat) continue;
            const r = ringTid.current[i];
            const u = r ? (t - r.t) / 0.8 : 1;
            m.visible = u < 1;
            if (!r || u >= 1) continue;
            const p = påBordet(LAND[r.land].x, LAND[r.land].y);
            m.position.set(p.x, 0.05, p.z);
            m.scale.setScalar(0.4 + u * 1.4);
            mat.opacity = (1 - u) * 0.9;
        }
        // Tegn kartet på nytt bare når et land tennes eller året skifter.
        const k = `${tent.current.size}|${g.brett}`;
        if (k !== nøkkel.current) {
            nøkkel.current = k;
            lerret.draw((ctx, w, h) => tegnKart(ctx, w, h, tent.current, BRETT[g.brett].år));
        }
    });

    return (
        <group>
            {/* Treramme og skygge under kartet */}
            <mesh position={[KART_PLASS.x + 0.05, 0.012, KART_PLASS.z + 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[KART_PLASS.b + 0.2, KART_PLASS.d + 0.2]} />
                <meshBasicMaterial color="#000" transparent opacity={0.35} />
            </mesh>
            <mesh position={[KART_PLASS.x, 0.02, KART_PLASS.z]}>
                <boxGeometry args={[KART_PLASS.b + 0.14, 0.03, KART_PLASS.d + 0.14]} />
                <meshLambertMaterial color="#4a3426" />
            </mesh>
            <mesh position={[KART_PLASS.x, 0.037, KART_PLASS.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[KART_PLASS.b, KART_PLASS.d]} />
                <meshLambertMaterial map={lerret.tex} />
            </mesh>
            {Array.from({ length: FLYVERE }, (_, i) => (
                <mesh key={`p${i}`} ref={(m) => (pass.current[i] = m)} visible={false}>
                    <planeGeometry args={[0.4, 0.28]} />
                    <meshBasicMaterial color="#cfe8d6" side={THREE.DoubleSide} />
                </mesh>
            ))}
            {Array.from({ length: FLYVERE }, (_, i) => (
                <mesh
                    key={`r${i}`}
                    ref={(m) => (ringer.current[i] = m)}
                    rotation={[-Math.PI / 2, 0, 0]}
                    visible={false}
                >
                    <ringGeometry args={[0.16, 0.22, 28]} />
                    <meshBasicMaterial
                        ref={(m) => (ringMat.current[i] = m)}
                        color="#fff3c4"
                        transparent
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}
