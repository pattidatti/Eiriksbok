// Tredjepersonskamera med «fjærarm» (spring arm) som aldri går gjennom vegger.
//
// Hvorfor den gamle gikk gjennom vegger (GameEngine.ts:3248-3296):
//  1. Den kastet en tynn stråle. En stråle smetter gjennom glipen mellom to vegger og
//     ser ikke at selve kameralinsen (nærplanet) stikker inn i veggen ved siden av.
//  2. Den glattet posisjonen ETTER sammenstøtet (camPos.lerp(clamped, dt*10)). Når armen
//     ble kortere, lå kameraet igjen inne i veggen i flere bilder før det tok seg inn.
//  3. Ble armen nesten null (trangt smug), ga den opp og brukte idealposisjonen bak veggen.
//
// Her: vi kaster en kule som er større enn nærplanet, armen trekkes inn med en gang
// (aldri glattet innover), og bare utover igjen glattes. Skulderforskyvningen kastes også,
// så den krymper i trange smug i stedet for å stikke inn i veggen.
import * as THREE from 'three';
import type { Physics } from './physics';
import type { LookInput } from './input';

// Større enn nærplanet (diagonal ≈ 0,13 m ved 62° FOV og 16:9), med margin.
const PROBE_RADIUS = 0.18;
const _pivot = new THREE.Vector3();
const _back = new THREE.Vector3();
const _right = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _look = new THREE.Vector3();

export interface CameraRig {
    /** Hvor langt bak pivot kameraet vil være. */
    distance: number;
    /** Høyde på pivot over føttene. */
    height: number;
    /** Sideforskyvning (skulder). */
    shoulder: number;
    fov: number;
}

export const RIG_WALK: CameraRig = { distance: 3.4, height: 1.42, shoulder: 0.45, fov: 62 };
export const RIG_COMBAT: CameraRig = { distance: 4.3, height: 1.35, shoulder: 0.2, fov: 64 };
export const RIG_BOAT: CameraRig = { distance: 6.8, height: 1.6, shoulder: 0, fov: 64 };

export class SpringArmCamera {
    readonly camera: THREE.PerspectiveCamera;
    yaw = Math.PI;
    pitch = -0.18;
    private arm = 3;
    private shoulderNow = 0;
    private readonly pivot = new THREE.Vector3();
    private pivotInit = false;
    private rig: CameraRig = { ...RIG_WALK };
    private target: CameraRig = RIG_WALK;
    private idleLook = 0;
    private keyYawVel = 0;
    private shake = 0;
    /** Satt når spilleren beveger seg: kameraet glir rolig bak etter en stund uten muselook. */
    autoFollowYaw: number | null = null;

    constructor(aspect: number) {
        this.camera = new THREE.PerspectiveCamera(RIG_WALK.fov, aspect, 0.1, 160);
    }

    setRig(rig: CameraRig): void {
        this.target = rig;
    }

    addShake(amount: number): void {
        this.shake = Math.min(0.35, this.shake + amount);
    }

    /** Horisontal fram-vektor for kameraet (bevegelse er relativ til denne). */
    forward(out: THREE.Vector2): THREE.Vector2 {
        return out.set(-Math.sin(this.yaw), -Math.cos(this.yaw));
    }

    update(dt: number, look: LookInput, followPos: THREE.Vector3, phys: Physics): void {
        // ── Rotasjon: mus direkte, piltaster med litt akselerasjon ──
        this.yaw += look.mouse.yaw;
        this.pitch += look.mouse.pitch;
        const keyTarget = look.keys.x * -2.4;
        this.keyYawVel += (keyTarget - this.keyYawVel) * Math.min(1, dt * 10);
        this.yaw += this.keyYawVel * dt;
        this.pitch += look.keys.y * 1.4 * dt;
        this.pitch = THREE.MathUtils.clamp(this.pitch, -1.1, 0.55);

        const manual = look.mouse.yaw !== 0 || look.mouse.pitch !== 0 || look.keys.x !== 0 || look.keys.y !== 0;
        this.idleLook = manual ? 0 : this.idleLook + dt;
        if (this.autoFollowYaw !== null && this.idleLook > 1.2) {
            // Bare for den som spiller uten mus: rolig, aldri brått.
            const d = Math.atan2(Math.sin(this.autoFollowYaw - this.yaw), Math.cos(this.autoFollowYaw - this.yaw));
            this.yaw += d * Math.min(1, dt * 0.9);
        }

        // ── Rigg-overgang (gå/kamp/båt) ──
        const k = Math.min(1, dt * 3);
        this.rig.distance += (this.target.distance - this.rig.distance) * k;
        this.rig.height += (this.target.height - this.rig.height) * k;
        this.rig.shoulder += (this.target.shoulder - this.rig.shoulder) * k;
        this.rig.fov += (this.target.fov - this.rig.fov) * k;

        // ── Pivot: følger føttene. Horisontalt nesten stivt, loddrett mykere (hopp og
        // trapper skal ikke riste bildet). ──
        _pivot.set(followPos.x, followPos.y + this.rig.height, followPos.z);
        if (!this.pivotInit) {
            this.pivot.copy(_pivot);
            this.pivotInit = true;
        }
        this.pivot.x += (_pivot.x - this.pivot.x) * Math.min(1, dt * 25);
        this.pivot.z += (_pivot.z - this.pivot.z) * Math.min(1, dt * 25);
        this.pivot.y += (_pivot.y - this.pivot.y) * Math.min(1, dt * 9);

        const cp = Math.cos(this.pitch);
        _back.set(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp).normalize();
        _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        // ── Skulder: kast sideveis fra hodet først ──
        const wantShoulder = this.rig.shoulder;
        const sideFree = phys.sphereCastWorld(this.pivot, _right, PROBE_RADIUS, Math.max(0.001, wantShoulder));
        const shoulder = Math.min(wantShoulder, sideFree);
        this.shoulderNow = shoulder < this.shoulderNow ? shoulder : this.shoulderNow + (shoulder - this.shoulderNow) * Math.min(1, dt * 4);
        const armStart = _tmp.copy(this.pivot).addScaledVector(_right, this.shoulderNow);

        // ── Armen: kast bakover, trekk inn med en gang, slipp ut igjen sakte ──
        const free = phys.sphereCastWorld(armStart, _back, PROBE_RADIUS, this.rig.distance);
        const want = Math.max(0, free - 0.04);
        if (want < this.arm) this.arm = want;
        else this.arm += (want - this.arm) * Math.min(1, dt * 2.5);

        const cam = this.camera;
        cam.position.copy(armStart).addScaledVector(_back, this.arm);
        _look.copy(armStart).addScaledVector(_back, -4);
        if (this.shake > 0.001) {
            cam.position.x += (Math.random() - 0.5) * this.shake * 0.3;
            cam.position.y += (Math.random() - 0.5) * this.shake * 0.3;
            this.shake *= Math.max(0, 1 - dt * 9);
        }
        cam.lookAt(_look);
        if (Math.abs(cam.fov - this.rig.fov) > 0.05) {
            cam.fov = this.rig.fov;
            cam.updateProjectionMatrix();
        }
    }

    /** Hvor nær kameraet er pivot. Spillet toner ut spilleren når kameraet er helt inntil. */
    get armLength(): number {
        return this.arm;
    }
}
