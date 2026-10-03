// Systemet for livet på Stranden og i Vågsbunnen: klokka til dagsplanene, dyrene i gatene og
// runepinnene gutten kan plukke opp (blueprint §7.2 «Runepinnen», §8.7, §8.8).
//
// Pinnene ligger der cellene sier (`meldPinner`, runepinner.ts). Står gutten ved en han ikke har tatt,
// får han «E: Plukk opp runepinnen». Han bøyer seg, pinnen løfter seg opp til ham, og kortet med
// runene kommer opp: runene risses fram én etter én, så hva det står, hvor den er funnet og «Dette vet
// vi». E, Enter eller Mellomrom legger pinnen i pungen. Hver pinne sendes som hendelsen `rune`
// (oppdraget «Pinnene i gjørma» teller den) og huskes som flagget `rune:<id>` i lagringen, så den er
// borte neste gang og «Begynn på nytt» glemmer den. Tar gutten oppdraget etter å ha funnet noen, telles
// de med en gang.
import * as THREE from 'three';
import type { InputFrame } from '../motor/input';
import { Dyrene } from '../motor/dyr';
import { fase, koblKlokke } from '../bygg/dagsplan';
import { RUNEPINNER, pinner, type PinneSted, type Runepinne } from '../bygg/runepinner';
import { huskVet } from '../ui/vetlager';
import type { SpillKontekst, Spillsystem } from './system';

export interface RunekortHud {
    pinne: Runepinne;
    hvor: string;
    /** Hvor mange pinner gutten har funnet nå, og hvor mange det finnes. */
    funnet: number;
    totalt: number;
    /** `performance.now()` da kortet kom opp (runene risses fram etter det). */
    apnet: number;
}

const NAER = 1.5;
/** Bøye seg og ta opp pinnen, før kortet kommer. */
const PLUKK_S = 0.9;
/** Kortet kan ikke lukkes før dette (E-trykket som åpnet det, skal ikke lukke det). */
const LAAST_S = 0.6;

interface Pinne {
    sted: PinneSted;
    mesh: THREE.Group;
    glimt: THREE.Sprite;
}

export function lagStrandliv(k: SpillKontekst): Spillsystem {
    koblKlokke(() => k.lys.klokke);
    const oppdrag = k.folk.oppdrag;
    const dyr = new Dyrene();
    dyr.natt = () => fase() === 'natt';
    k.scene.add(dyr.group);

    // ── Pinnene ──
    const gruppe = new THREE.Group();
    gruppe.name = 'runepinner';
    k.scene.add(gruppe);
    const stokkGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.26, 6);
    stokkGeo.rotateZ(Math.PI / 2);
    const hakkGeo = new THREE.BoxGeometry(0.006, 0.03, 0.03);
    const stokkMat = new THREE.MeshStandardMaterial({ color: 0xcdb48a, roughness: 0.85, emissive: 0xffd890, emissiveIntensity: 0 });
    const hakkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 1 });
    const glimtMat = new THREE.SpriteMaterial({ map: glimtTekstur(), color: 0xfff1c8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const aktive = new Map<string, Pinne>();
    let versjon = -1;
    const funnet = () => RUNEPINNER.filter((p) => oppdrag.flagg.has(`rune:${p.id}`)).length;

    const lagPinne = (sted: PinneSted): Pinne => {
        const mesh = new THREE.Group();
        const stokk = new THREE.Mesh(stokkGeo, stokkMat);
        stokk.castShadow = true;
        mesh.add(stokk);
        // Hakkene: runene sett på avstand, mørke streker langs pinnen.
        for (let i = 0; i < 7; i++) {
            const h = new THREE.Mesh(hakkGeo, hakkMat);
            h.position.set(-0.09 + i * 0.03, 0.012, 0.012);
            h.rotation.z = (i % 3) * 0.4 - 0.4;
            mesh.add(h);
        }
        // Halvveis i gjørma, på skrå.
        mesh.position.copy(sted.pos).setY(sted.pos.y + 0.03);
        mesh.rotation.set(0.25, (sted.pos.x * 7.3) % Math.PI, 0.18);
        const glimt = new THREE.Sprite(glimtMat);
        glimt.scale.setScalar(0.35);
        glimt.position.copy(sted.pos).setY(sted.pos.y + 0.14);
        gruppe.add(mesh, glimt);
        return { sted, mesh, glimt };
    };
    const fjern = (p: Pinne) => gruppe.remove(p.mesh, p.glimt);

    let naer: Pinne | null = null;
    let plukker: { p: Pinne; t: number; fra: THREE.Vector3 } | null = null;
    let kort: RunekortHud | null = null;
    let kortTid = 0;

    // Tar gutten oppdraget etter å ha funnet pinner, teller de med en gang.
    oppdrag.lyttere.push((hva, id) => {
        if (hva !== 'ta' || id !== 'runer') return;
        const n = Math.min(3, funnet());
        for (let i = 0; i < n; i++) oppdrag.hendelse('rune');
    });

    const apneKort = (p: Pinne) => {
        const def = RUNEPINNER.find((r) => r.id === p.sted.id);
        if (!def) return;
        oppdrag.settFlagg(`rune:${def.id}`);
        oppdrag.hendelse('rune');
        huskVet(`${def.slag}: «${def.norsk}» ${def.vet}`);
        k.lyd?.oppdrag('maal');
        kort = { pinne: def, hvor: p.sted.hvor, funnet: funnet(), totalt: RUNEPINNER.length, apnet: performance.now() };
        kortTid = 0;
        k.hudSnart();
    };

    return {
        navn: 'runer',
        steg: (dt: number, inp: InputFrame) => {
            if (plukker) {
                plukker.t += dt;
                // Pinnen løfter seg opp mot hendene, snurrer litt og blir borte i pungen.
                const u = Math.min(1, plukker.t / PLUKK_S);
                const e = u * u * (3 - 2 * u);
                const maal = k.player.pos.clone().setY(k.player.pos.y + 1.05);
                plukker.p.mesh.position.lerpVectors(plukker.fra, maal, e);
                plukker.p.mesh.rotation.y += dt * 6;
                plukker.p.mesh.scale.setScalar(1 + Math.sin(u * Math.PI) * 0.6);
                if (u >= 1) {
                    const p = plukker.p;
                    plukker = null;
                    fjern(p);
                    aktive.delete(p.sted.id);
                    apneKort(p);
                }
                return true;
            }
            if (kort) {
                kortTid += dt;
                if (kortTid > LAAST_S && (inp.interactPressed || inp.jumpPressed || inp.trykt.has('Enter') || inp.trykt.has('NumpadEnter'))) {
                    kort = null;
                    k.player.anim.release(0.3);
                    k.hudSnart();
                }
                return true;
            }
            return false;
        },
        bilde: (dt: number, kamera: THREE.PerspectiveCamera) => {
            dyr.update(dt, k.player.pos, kamera.position);
            // Pinnene som ligger i cellene som er lastet, og som gutten ikke har tatt.
            const { versjon: v, liste } = pinner();
            if (v !== versjon) {
                versjon = v;
                const ider = new Set(liste.map((p) => p.id));
                for (const [id, p] of aktive) if (!ider.has(id) && plukker?.p !== p) {
                    fjern(p);
                    aktive.delete(id);
                }
                for (const s of liste) if (!aktive.has(s.id) && !oppdrag.flagg.has(`rune:${s.id}`)) aktive.set(s.id, lagPinne(s));
            }
            // Glimtet: et lite blink når gutten er i nærheten, så pinnen kan finnes.
            const t = performance.now() / 1000;
            let best = 99;
            for (const p of aktive.values()) {
                if (plukker?.p === p) continue;
                const d = p.sted.pos.distanceTo(k.player.pos);
                best = Math.min(best, d);
                p.glimt.visible = d < 12;
                const blink = Math.max(0, Math.sin(t * 2.1 + p.sted.pos.x) * 1.4 - 0.4);
                p.glimt.scale.setScalar(0.22 + blink * 0.25);
            }
            glimtMat.opacity = THREE.MathUtils.clamp((12 - best) / 6, 0, 1) * 0.9;
            stokkMat.emissiveIntensity = THREE.MathUtils.clamp((5 - best) / 4, 0, 1) * (0.25 + 0.15 * Math.sin(t * 4));
        },
        prompt: (gutt: THREE.Vector3) => {
            naer = null;
            if (plukker || kort || k.modus() !== 'foot') return null;
            for (const p of aktive.values()) {
                if (Math.hypot(p.sted.pos.x - gutt.x, p.sted.pos.z - gutt.z) < NAER && Math.abs(p.sted.pos.y - gutt.y) < 1.2) {
                    naer = p;
                    return 'E: Plukk opp runepinnen';
                }
            }
            return null;
        },
        trykk: () => {
            if (!naer) return null;
            plukker = { p: naer, t: 0, fra: naer.mesh.position.clone() };
            naer.glimt.visible = false;
            naer = null;
            k.player.anim.play('Interact', { fade: 0.2, timeScale: 1.1 });
            return null;
        },
        rask: () => kort !== null && kortTid < 3,
        hud: () => kort,
        dispose: () => {
            k.scene.remove(dyr.group, gruppe);
            dyr.dispose();
            stokkGeo.dispose();
            hakkGeo.dispose();
            stokkMat.dispose();
            hakkMat.dispose();
            glimtMat.map?.dispose();
            glimtMat.dispose();
        },
    };
}

/** Et lite stjerneblink tegnet på et lerret (ingen fil å laste). */
function glimtTekstur(): THREE.Texture {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    if (g) {
        const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        r.addColorStop(0, 'rgba(255,255,255,1)');
        r.addColorStop(0.2, 'rgba(255,240,200,0.7)');
        r.addColorStop(1, 'rgba(255,230,180,0)');
        g.fillStyle = r;
        g.fillRect(0, 0, 64, 64);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.fillRect(30, 4, 4, 56);
        g.fillRect(4, 30, 56, 4);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}
