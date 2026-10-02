// Animasjon for figurer i Bryggen-motoren.
//
// To lag:
//  1. Bevegelse (stå, gå, jogge, sprinte). Klippene blandes etter faktisk fart, og alle
//     tre deler én fase. Hver figur sier hvilken fart den går, jogger og sprinter i
//     (setGait), og ved akkurat de fartene spilles klippet i sin egen takt.
//
//     Hvorfor ikke måle farten fra fotsporet: UAL-klippene er stiliserte. Jogg-foten glir
//     4,5 m/s bakover mens den står i bakken, og sprint-foten «saktere» enn jogg-foten.
//     Med målt fart spilte gråboksen sprint-klippet i firedobbel takt. Takten er det øyet
//     leser som fart, så den skal stemme; en liten fotglid i en kort jogg-stans synes ikke.
//  2. Helkropp (hopp, slag, rulling, treff, sitte, klatre). Tones inn over bevegelseslaget
//     og ut igjen, med egne vekter - ingen brå bytter.
//
// Den gamle motoren svingte bokser med en fast sinus (GameEngine.ts:2784). Her er alt
// ekte skjelettanimasjon fra glTF med AnimationMixer.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

const LOCO = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop'] as const;

/** Bein og hofter. Alt annet regnes som overkropp når vi syr sammen klipp. */
const LOWER_BONE = /(thigh|shin|foot|toe|hips|root)/i;

export interface RigTemplate {
    scene: THREE.Group;
    clips: Map<string, THREE.AnimationClip>;
    /** Høyden på figuren i modellens egne enheter. */
    height: number;
}

const cache = new Map<string, Promise<RigTemplate>>();

export function loadRig(url: string): Promise<RigTemplate> {
    let p = cache.get(url);
    if (!p) {
        p = new GLTFLoader().loadAsync(url).then((gltf) => buildTemplate(gltf.scene, gltf.animations));
        cache.set(url, p);
    }
    return p;
}

function buildTemplate(scene: THREE.Group, animations: THREE.AnimationClip[]): RigTemplate {
    const clips = new Map(animations.map((c) => [c.name, c]));

    // Sydde klipp: underkropp fra ett klipp, overkropp fra et annet.
    stitch(clips, 'Row', 'Sitting_Idle_Loop', 'Driving_Loop');

    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const height = box.max.y - box.min.y;
    return { scene, clips, height };
}

function stitch(clips: Map<string, THREE.AnimationClip>, name: string, lower: string, upper: string) {
    const lo = clips.get(lower);
    const up = clips.get(upper);
    if (!lo || !up) return;
    const tracks = [
        ...lo.tracks.filter((t) => LOWER_BONE.test(t.name)),
        ...up.tracks.filter((t) => !LOWER_BONE.test(t.name)),
    ].map((t) => t.clone());
    clips.set(name, new THREE.AnimationClip(name, up.duration, tracks));
}

/**
 * Finn et bein med navnet fra riggen. GLTFLoader fjerner punktum fra nodenavn
 * («DEF-spine.001» blir «DEF-spine001»), så navnet må vaskes på samme måte før oppslaget.
 */
function findBone(root: THREE.Object3D, name: string): THREE.Object3D | undefined {
    return root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
}

export interface PlayOptions {
    fade?: number;
    loop?: boolean;
    timeScale?: number;
    startAt?: number;
}

interface Layered {
    action: THREE.AnimationAction;
    weight: number;
    target: number;
    fadeRate: number;
}

export class Animator {
    readonly root = new THREE.Group();
    /** Mellomledd for lening (fart og sving) uten å røre posisjon eller retning. */
    readonly lean = new THREE.Group();
    readonly model: THREE.Object3D;
    readonly mixer: THREE.AnimationMixer;
    private readonly template: RigTemplate;
    /** Farten (m/s) der hvert bevegelsesklipp spilles i sin egen takt. */
    private gait = new Map<string, number>([
        ['Walk_Loop', 1.1],
        ['Jog_Fwd_Loop', 3.4],
        ['Sprint_Loop', 5.6],
    ]);
    private loco = new Map<string, Layered>();
    private full = new Map<string, Layered>();
    private locoPhase = 0;
    private locoMaster = 1;
    private locoMasterTarget = 1;
    private locoFadeRate = 8;
    current: string | null = null;
    /** Settes høyere enn 0 for treffpause (hitstop). */
    freeze = 0;
    private materials: THREE.MeshStandardMaterial[] = [];
    /** Ekstra bein-rotasjon lagt oppå animasjonen etter mixeren (f.eks. ryggen i åretaket). */
    private boneOffsets = new Map<THREE.Object3D, THREE.Euler>();

    constructor(template: RigTemplate, heightMeters: number, tint?: number) {
        this.template = template;
        this.model = cloneSkinned(template.scene);
        this.model.scale.setScalar(heightMeters / template.height);
        this.model.traverse((o) => {
            const mesh = o as THREE.SkinnedMesh;
            if (!mesh.isMesh) return;
            mesh.castShadow = true;
            mesh.frustumCulled = false;
            const src = mesh.material as THREE.MeshStandardMaterial;
            const mat = src.clone();
            if (tint !== undefined && src.name === 'M_Main') mat.color.setHex(tint);
            mesh.material = mat;
            this.materials.push(mat);
        });
        this.lean.add(this.model);
        this.root.add(this.lean);
        this.mixer = new THREE.AnimationMixer(this.model);

        for (const name of LOCO) {
            const clip = template.clips.get(name);
            if (!clip) continue;
            const action = this.mixer.clipAction(clip);
            action.play();
            action.setEffectiveWeight(name === 'Idle_Loop' ? 1 : 0);
            // Fasen styres manuelt (se update), så mixeren skal ikke flytte tiden selv.
            if (name !== 'Idle_Loop') action.timeScale = 0;
            this.loco.set(name, { action, weight: name === 'Idle_Loop' ? 1 : 0, target: 0, fadeRate: 8 });
        }
    }

    /** Farten (m/s) et bevegelsesklipp hører til for denne figuren. */
    speedOf(name: string): number {
        return this.gait.get(name) ?? 1;
    }

    /** Sett farten figuren går, jogger og sprinter i. */
    setGait(walk: number, jog: number, sprint: number): void {
        this.gait.set('Walk_Loop', walk);
        this.gait.set('Jog_Fwd_Loop', jog);
        this.gait.set('Sprint_Loop', sprint);
    }

    /** Spill et helkroppsklipp over bevegelseslaget. */
    play(name: string, opts: PlayOptions = {}): void {
        const clip = this.template.clips.get(name);
        if (!clip) return;
        const fade = Math.max(0.01, opts.fade ?? 0.15);
        let layered = this.full.get(name);
        if (!layered) {
            const action = this.mixer.clipAction(clip);
            layered = { action, weight: 0, target: 0, fadeRate: 1 / fade };
            this.full.set(name, layered);
        }
        const a = layered.action;
        a.reset();
        a.setLoop(opts.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        a.clampWhenFinished = !opts.loop;
        a.timeScale = opts.timeScale ?? 1;
        a.time = opts.startAt ?? 0;
        a.play();
        for (const [n, l] of this.full) {
            l.target = n === name ? 1 : 0;
            l.fadeRate = 1 / fade;
        }
        this.locoMasterTarget = 0;
        this.locoFadeRate = 1 / fade;
        this.current = name;
    }

    /** Tilbake til bevegelseslaget. */
    release(fade = 0.2): void {
        for (const l of this.full.values()) {
            l.target = 0;
            l.fadeRate = 1 / Math.max(0.01, fade);
        }
        this.locoMasterTarget = 1;
        this.locoFadeRate = 1 / Math.max(0.01, fade);
        this.current = null;
    }

    /** Hvor langt (0..1) det gjeldende helkroppsklippet har kommet. */
    progress(): number {
        if (!this.current) return 1;
        const l = this.full.get(this.current);
        if (!l) return 1;
        return l.action.time / l.action.getClip().duration;
    }

    /** Styr tiden i det gjeldende klippet direkte (0..1), f.eks. åretak i takt med båten. */
    setPhase(p: number): void {
        if (!this.current) return;
        const l = this.full.get(this.current);
        if (!l) return;
        l.action.timeScale = 0;
        l.action.time = p * l.action.getClip().duration;
    }

    /** Legg en rotasjon oppå et bein (navn fra riggen). Nullstill med `null`. */
    setBoneOffset(bone: string, rot: THREE.Euler | null): void {
        const b = findBone(this.model, bone);
        if (!b) return;
        if (rot) this.boneOffsets.set(b, rot);
        else this.boneOffsets.delete(b);
    }

    setTimeScale(ts: number): void {
        if (!this.current) return;
        const l = this.full.get(this.current);
        if (l) l.action.timeScale = ts;
    }

    setTint(hex: number, emissive = 0): void {
        for (const m of this.materials) {
            if (m.name !== 'M_Main') continue;
            m.color.setHex(hex);
            m.emissive.setHex(emissive);
        }
    }

    setOpacity(o: number): void {
        for (const m of this.materials) {
            m.transparent = o < 1;
            m.opacity = o;
            m.depthWrite = o >= 1;
        }
    }

    /**
     * @param speed faktisk horisontal fart i m/s
     */
    update(dt: number, speed: number): void {
        const realDt = dt;
        if (this.freeze > 0) {
            this.freeze -= dt;
            dt = 0;
        }

        // ── Bevegelseslag: vekter etter fart, felles fase ──
        const vWalk = this.speedOf('Walk_Loop');
        const vJog = this.speedOf('Jog_Fwd_Loop');
        const vSprint = this.speedOf('Sprint_Loop');
        const w = { Idle_Loop: 0, Walk_Loop: 0, Jog_Fwd_Loop: 0, Sprint_Loop: 0 } as Record<string, number>;
        if (speed < 0.08) w.Idle_Loop = 1;
        else if (speed < vWalk) {
            const t = speed / vWalk;
            w.Idle_Loop = 1 - t;
            w.Walk_Loop = t;
        } else if (speed < vJog) {
            const t = (speed - vWalk) / (vJog - vWalk);
            w.Walk_Loop = 1 - t;
            w.Jog_Fwd_Loop = t;
        } else if (speed < vSprint) {
            const t = (speed - vJog) / (vSprint - vJog);
            w.Jog_Fwd_Loop = 1 - t;
            w.Sprint_Loop = t;
        } else w.Sprint_Loop = 1;

        // Felles fase: syklus-lengden i meter er en vektet blanding av klippene, så takten
        // glir jevnt mellom klippene og er klippets egen ved hver gangart.
        let cycleMeters = 0;
        let moveWeight = 0;
        for (const n of ['Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop']) {
            const clip = this.template.clips.get(n);
            if (!clip || w[n] === 0) continue;
            cycleMeters += w[n] * this.speedOf(n) * clip.duration;
            moveWeight += w[n];
        }
        if (moveWeight > 0) {
            cycleMeters /= moveWeight;
            this.locoPhase = (this.locoPhase + (dt * speed) / Math.max(0.2, cycleMeters)) % 1;
        }

        const masterStep = this.locoFadeRate * realDt;
        this.locoMaster += Math.sign(this.locoMasterTarget - this.locoMaster) *
            Math.min(Math.abs(this.locoMasterTarget - this.locoMaster), masterStep);

        for (const [n, l] of this.loco) {
            l.target = w[n];
            l.weight += (l.target - l.weight) * Math.min(1, realDt * 14);
            l.action.setEffectiveWeight(l.weight * this.locoMaster);
            if (n !== 'Idle_Loop') l.action.time = this.locoPhase * l.action.getClip().duration;
        }

        // ── Helkroppslag ──
        for (const l of this.full.values()) {
            const step = l.fadeRate * realDt;
            l.weight += Math.sign(l.target - l.weight) * Math.min(Math.abs(l.target - l.weight), step);
            l.action.setEffectiveWeight(l.weight);
            if (l.weight <= 0.001 && l.target === 0 && l.action.isRunning()) l.action.stop();
        }

        this.mixer.update(dt);
        for (const [bone, rot] of this.boneOffsets) {
            bone.rotateX(rot.x);
            bone.rotateY(rot.y);
            bone.rotateZ(rot.z);
        }
    }
}
