// Færing: en liten åpen trebåt med to par årer. Én roer sitter midt i båten og ser
// AKTERUT, slik man ror i virkeligheten.
//
// Roingen er åretak, ikke en jevn motor: hvert tak gir et dytt framover mens bladene er i
// vannet, så glir båten videre og bremses av vannet. A/D ror hardere på én side og svinger.
import * as THREE from 'three';
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import { GROUP_BOAT, type Physics } from './physics';

export const WATER_Y = -1.35;

const STROKE_S = 1.25;
const DRIVE = 0.42; // andel av taket der bladene er i vannet

export interface RowIntent {
    forward: number; // -1..1
    turn: number; // -1..1 (høyre = +1)
}

export class Faering {
    readonly group = new THREE.Group();
    private readonly hull = new THREE.Group();
    private readonly oars: THREE.Group[] = [];
    readonly body: RAPIER_NS.RigidBody;
    readonly collider: RAPIER_NS.Collider;
    private readonly cc: RAPIER_NS.KinematicCharacterController;

    readonly pos = new THREE.Vector3();
    readonly prevPos = new THREE.Vector3();
    yaw = 0;
    prevYaw = 0;
    speed = 0;
    private yawVel = 0;
    /** 0..1 gjennom ett åretak. */
    strokePhase = 0;
    private rowing = 0;
    private time = 0;
    /** Kalles når et åretak setter bladene i vannet (lyd/sprut/kamerarykk). */
    onCatch?: () => void;
    onBump?: (speed: number) => void;

    constructor(phys: Physics, start: THREE.Vector3, yaw: number, material: THREE.Material) {
        const R = phys.R;
        this.pos.copy(start);
        this.prevPos.copy(start);
        this.yaw = yaw;
        this.prevYaw = yaw;
        this.body = phys.world.createRigidBody(
            R.RigidBodyDesc.kinematicPositionBased().setTranslation(start.x, WATER_Y + 0.3, start.z)
        );
        this.collider = phys.world.createCollider(
            R.ColliderDesc.cuboid(0.72, 0.3, 2.9).setCollisionGroups(GROUP_BOAT),
            this.body
        );
        this.cc = phys.world.createCharacterController(0.05);
        this.cc.setUp({ x: 0, y: 1, z: 0 });
        this.cc.setSlideEnabled(true);
        this.buildMesh(material);
        this.group.add(this.hull);
    }

    /** Sete-posisjon i verden, der roerens hofter skal være. */
    seatWorld(out: THREE.Vector3): THREE.Vector3 {
        return out.set(0, 0.22, -0.25).applyMatrix4(this.hull.matrixWorld);
    }

    step(dt: number, intent: RowIntent | null): void {
        this.prevPos.copy(this.pos);
        this.prevYaw = this.yaw;
        this.time += dt;

        const wants = intent && (Math.abs(intent.forward) > 0.1 || Math.abs(intent.turn) > 0.1);
        this.rowing += ((wants ? 1 : 0) - this.rowing) * Math.min(1, dt * 4);
        if (wants || this.strokePhase > 0.02) {
            const before = this.strokePhase;
            this.strokePhase = (this.strokePhase + dt / STROKE_S) % 1;
            if (before > this.strokePhase && !wants) this.strokePhase = 0; // fullfør taket, så stopp
            if (before < 0.02 && this.strokePhase >= 0.02) this.onCatch?.();
        }

        // Dytt bare mens bladene er i vannet, med en myk topp midt i drivet.
        const inWater = this.strokePhase < DRIVE && this.rowing > 0.2;
        if (inWater && intent) {
            const pull = Math.sin((this.strokePhase / DRIVE) * Math.PI);
            this.speed += intent.forward * (intent.forward > 0 ? 3.4 : 2.2) * pull * dt;
            // Svinger mest når båten står, men litt også i fart (ror hardere på én side).
            this.yawVel += intent.turn * (1.6 + Math.abs(intent.forward) * 0.6) * pull * dt;
            if (Math.abs(intent.forward) < 0.1) this.speed += 0.6 * Math.abs(intent.turn) * pull * dt;
        }
        // Vannet bremser: lineært + kvadratisk.
        this.speed -= (0.22 * this.speed + 0.11 * this.speed * Math.abs(this.speed)) * dt;
        this.yawVel -= this.yawVel * 1.9 * dt;
        this.yaw += this.yawVel * dt;

        const fwdX = Math.sin(this.yaw);
        const fwdZ = Math.cos(this.yaw);
        const desired = { x: fwdX * this.speed * dt, y: 0, z: fwdZ * this.speed * dt };
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        this.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
        this.collider.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
        this.cc.computeColliderMovement(this.collider, desired, undefined, GROUP_BOAT);
        const m = this.cc.computedMovement();
        const expected = Math.abs(this.speed * dt);
        const got = Math.hypot(m.x, m.z);
        if (expected > 0.002 && got < expected * 0.6) {
            this.onBump?.(Math.abs(this.speed));
            this.speed *= -0.25; // et lite tilbakeslag fra kaia
        }
        this.pos.x += m.x;
        this.pos.z += m.z;
        this.pos.y = WATER_Y;
        this.body.setNextKinematicTranslation({ x: this.pos.x, y: WATER_Y + 0.3, z: this.pos.z });
    }

    render(alpha: number): void {
        const x = THREE.MathUtils.lerp(this.prevPos.x, this.pos.x, alpha);
        const z = THREE.MathUtils.lerp(this.prevPos.z, this.pos.z, alpha);
        const yaw = this.prevYaw + Math.atan2(Math.sin(this.yaw - this.prevYaw), Math.cos(this.yaw - this.prevYaw)) * alpha;
        const t = this.time;
        // Dønninger i Vågen er små, men båten skal aldri ligge helt stille.
        const bob = Math.sin(t * 1.3 + x * 0.3) * 0.04 + Math.sin(t * 0.7 + z * 0.2) * 0.03;
        const surge = this.strokePhase < DRIVE ? Math.sin((this.strokePhase / DRIVE) * Math.PI) * 0.025 * this.rowing : 0;
        this.group.position.set(x, WATER_Y + bob, z);
        this.group.rotation.set(
            Math.sin(t * 1.1) * 0.02 - surge,
            yaw,
            Math.sin(t * 0.9 + 1) * 0.03 + this.yawVel * 0.04
        );
        this.group.updateMatrixWorld(true);

        // Årene: drag (bladet i vannet, sveip akterut) og retur (bladet over vannet, fram).
        const p = this.strokePhase;
        const sweep = p < DRIVE ? THREE.MathUtils.lerp(-0.55, 0.55, easeInOut(p / DRIVE)) : THREE.MathUtils.lerp(0.55, -0.55, easeInOut((p - DRIVE) / (1 - DRIVE)));
        const lift = p < DRIVE ? -0.12 : 0.1 + Math.sin(((p - DRIVE) / (1 - DRIVE)) * Math.PI) * 0.08;
        this.oars.forEach((oar, i) => {
            const side = i === 0 ? 1 : -1;
            oar.rotation.set(0, side * sweep, side * lift * this.rowing + side * (1 - this.rowing) * 0.25);
        });
    }

    private buildMesh(material: THREE.Material): void {
        // Grått skrog: spiss i begge ender (færingen er tveendt, som vikingskipene).
        const shape = new THREE.Shape();
        const L = 2.95;
        const W = 0.72;
        shape.moveTo(0, -L);
        shape.quadraticCurveTo(W * 1.25, -L * 0.45, W, 0);
        shape.quadraticCurveTo(W * 1.25, L * 0.45, 0, L);
        shape.quadraticCurveTo(-W * 1.25, L * 0.45, -W, 0);
        shape.quadraticCurveTo(-W * 1.25, -L * 0.45, 0, -L);
        const outer = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false, curveSegments: 10 });
        outer.rotateX(-Math.PI / 2);
        const hullMesh = new THREE.Mesh(outer, material);
        hullMesh.position.y = -0.2;
        hullMesh.castShadow = true;
        const inner = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 10 }).rotateX(-Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x3d4247, roughness: 1 })
        );
        inner.scale.set(0.86, 1, 0.92);
        inner.position.y = -0.14;
        this.hull.add(hullMesh, inner);
        for (const z of [-1.4, -0.25, 1.1]) {
            const thwart = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.22), material);
            thwart.position.set(0, 0.17, z);
            this.hull.add(thwart);
        }
        // Keipar (åretoller) og årer, festet der roeren sitter.
        for (const side of [1, -1]) {
            const pivot = new THREE.Group();
            pivot.position.set(side * 0.74, 0.4, -0.25);
            const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.05), material);
            shaft.position.x = side * 0.9;
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.13), material);
            blade.position.set(side * 1.0, 0, 0);
            shaft.add(blade);
            pivot.add(shaft);
            this.hull.add(pivot);
            this.oars.push(pivot);
        }
    }
}

const easeInOut = (x: number) => x * x * (3 - 2 * x);
