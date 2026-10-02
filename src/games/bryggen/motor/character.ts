// Figur med vekt: Rapier KinematicCharacterController + fart med akselerasjon, sving
// med begrenset vinkelfart, hopp med nådetid, og kantklatring.
//
// Hvorfor dette føles annerledes enn den gamle motoren:
//  - Gammel: farten settes rett til input * SPEED (GameEngine.ts:3461). Ingen akselerasjon,
//    så figuren starter og stopper på en tiendel og «glir».
//  - Ny: farten akselererer og bremser, og retningen dreies med begrenset vinkelfart.
//    Snur du brått, må figuren bremse før den kan løpe den andre veien.
//  - Gammel: forflytningen regnes med varierende bilde-dt, men fysikken går i faste steg
//    (PhysicsWorld.ts:437). Bilder uten fysikksteg mister bevegelsen. Her går alt i faste
//    1/60-steg, og tegningen interpoleres mellom de to siste stegene.
import * as THREE from 'three';
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import { GROUP_ACTOR, type Physics } from './physics';
import type { Animator } from './animator';

export interface MoveIntent {
    /** Ønsket retning i verden (xz), lengde 0..1. */
    dir: THREE.Vector2;
    sprint: boolean;
    jump: boolean;
}

export interface CharacterTuning {
    radius: number;
    height: number;
    runSpeed: number;
    sprintSpeed: number;
    accel: number;
    decel: number;
    airAccel: number;
    turnRate: number;
    gravity: number;
    jumpSpeed: number;
}

export const BOY_TUNING: CharacterTuning = {
    radius: 0.28,
    height: 1.58,
    runSpeed: 3.4,
    sprintSpeed: 5.6,
    accel: 11,
    decel: 15,
    airAccel: 3,
    turnRate: 11,
    gravity: 22,
    jumpSpeed: 5.6,
};

type Mode = 'ground' | 'air' | 'mantle' | 'locked' | 'seated' | 'dead';

const MANTLE_MIN = 0.45;
const MANTLE_MAX = 2.75;

const _v = new THREE.Vector3();
const _f = new THREE.Vector3();
const _down = new THREE.Vector3(0, -1, 0);

export class Character {
    readonly anim: Animator;
    readonly tune: CharacterTuning;
    readonly body: RAPIER_NS.RigidBody;
    readonly collider: RAPIER_NS.Collider;
    private readonly cc: RAPIER_NS.KinematicCharacterController;
    private readonly phys: Physics;

    /** Føttenes posisjon, nå og forrige steg (for interpolering). */
    readonly pos = new THREE.Vector3();
    readonly prevPos = new THREE.Vector3();
    readonly vel = new THREE.Vector2();
    vy = 0;
    yaw = 0;
    prevYaw = 0;
    private yawRate = 0;
    private smoothLean = new THREE.Vector2();
    mode: Mode = 'ground';
    grounded = true;
    private coyote = 0;
    private jumpBuffer = 0;
    private airTime = 0;
    private grabCheck = 0;
    private lockTimer = 0;
    private lockVel = new THREE.Vector2();
    private landLock = 0;
    private mantle: { t: number; dur: number; a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; high: boolean } | null = null;
    /** Kalles ved landing med fallfart (m/s). */
    onLand?: (impact: number) => void;

    constructor(phys: Physics, anim: Animator, tune: CharacterTuning, start: THREE.Vector3) {
        this.phys = phys;
        this.anim = anim;
        this.tune = tune;
        const R = phys.R;
        const half = tune.height / 2 - tune.radius;
        this.body = phys.world.createRigidBody(
            R.RigidBodyDesc.kinematicPositionBased().setTranslation(start.x, start.y + tune.height / 2, start.z)
        );
        this.collider = phys.world.createCollider(
            R.ColliderDesc.capsule(half, tune.radius).setCollisionGroups(GROUP_ACTOR),
            this.body
        );
        this.cc = phys.world.createCharacterController(0.02);
        this.cc.setUp({ x: 0, y: 1, z: 0 });
        // Trapper bygges som ramper (glatt), men små kanter (dørstokker, planker) tas av autostep.
        this.cc.enableAutostep(0.32, 0.18, false);
        this.cc.enableSnapToGround(0.35);
        this.cc.setMaxSlopeClimbAngle((52 * Math.PI) / 180);
        this.cc.setMinSlopeSlideAngle((40 * Math.PI) / 180);
        this.cc.setSlideEnabled(true);
        this.pos.copy(start);
        this.prevPos.copy(start);
    }

    get speed(): number {
        return this.vel.length();
    }

    /** Låser styringen en stund og gir en tvungen fart (utfall i slag, rulling, tilbakeslag). */
    lock(seconds: number, vx = 0, vz = 0): void {
        this.mode = this.mode === 'dead' ? 'dead' : 'locked';
        this.lockTimer = seconds;
        this.lockVel.set(vx, vz);
    }

    /** Endre den tvungne farten midt i en låsing (f.eks. utfallet er ferdig, slaget står). */
    setLockVel(vx: number, vz: number): void {
        this.lockVel.set(vx, vz);
    }

    get lockRemaining(): number {
        return this.mode === 'locked' ? this.lockTimer : 0;
    }

    unlock(): void {
        if (this.mode === 'locked') this.mode = this.grounded ? 'ground' : 'air';
        this.lockTimer = 0;
    }

    get locked(): boolean {
        return this.mode === 'locked';
    }

    /** Snu figuren brått mot et punkt (brukes av kampen for å «sikte» slag). */
    faceTowards(x: number, z: number, maxStep = Math.PI): void {
        const target = Math.atan2(x - this.pos.x, z - this.pos.z);
        const d = wrapAngle(target - this.yaw);
        this.yaw += THREE.MathUtils.clamp(d, -maxStep, maxStep);
    }

    teleport(p: THREE.Vector3, yaw = this.yaw): void {
        this.pos.copy(p);
        this.prevPos.copy(p);
        this.yaw = yaw;
        this.prevYaw = yaw;
        this.vel.set(0, 0);
        this.vy = 0;
        this.body.setTranslation({ x: p.x, y: p.y + this.tune.height / 2, z: p.z }, true);
        this.body.setNextKinematicTranslation({ x: p.x, y: p.y + this.tune.height / 2, z: p.z });
    }

    setSeated(seated: boolean): void {
        this.mode = seated ? 'seated' : 'ground';
        this.collider.setEnabled(!seated);
        this.vel.set(0, 0);
        this.vy = 0;
    }

    kill(): void {
        this.mode = 'dead';
        this.vel.set(0, 0);
    }

    /** Ett fast simuleringssteg. */
    step(dt: number, intent: MoveIntent): void {
        this.prevPos.copy(this.pos);
        this.prevYaw = this.yaw;
        if (this.mode === 'seated') return;
        if (this.mode === 'mantle') {
            this.stepMantle(dt);
            return;
        }

        const t = this.tune;
        this.jumpBuffer = intent.jump ? 0.14 : Math.max(0, this.jumpBuffer - dt);
        this.coyote = this.grounded ? 0.12 : Math.max(0, this.coyote - dt);
        this.landLock = Math.max(0, this.landLock - dt);

        // ── Horisontal fart ──
        if (this.mode === 'locked') {
            this.lockTimer -= dt;
            this.vel.lerp(this.lockVel, Math.min(1, dt * 18));
            if (this.lockTimer <= 0) this.unlock();
        } else if (this.mode === 'dead') {
            this.vel.multiplyScalar(Math.max(0, 1 - dt * 6));
        } else {
            const want = intent.dir.length() > 0.01 ? intent.dir : null;
            const max = intent.sprint ? t.sprintSpeed : t.runSpeed;
            const target = want ? _v2.copy(want).multiplyScalar(max * (this.landLock > 0 ? 0.35 : 1)) : _v2.set(0, 0);
            const cur = this.vel.length();
            if (this.grounded && want && cur > 0.5) {
                // Svinger vi mindre enn ~100°, dreies farten (beholder fart i svingen).
                // Snur vi mer, må figuren bremse ned først: det gir vekt.
                const angCur = Math.atan2(this.vel.x, this.vel.y);
                const angWant = Math.atan2(want.x, want.y);
                const d = wrapAngle(angWant - angCur);
                if (Math.abs(d) < 1.75) {
                    const turn = THREE.MathUtils.clamp(d, -t.turnRate * dt, t.turnRate * dt) * (1 - Math.min(0.5, cur / 14));
                    const a = angCur + turn;
                    this.vel.set(Math.sin(a) * cur, Math.cos(a) * cur);
                }
            }
            const rate = this.grounded ? (target.lengthSq() > this.vel.lengthSq() ? t.accel : t.decel) : t.airAccel;
            moveTowards(this.vel, target, rate * dt);
        }

        // ── Hopp og klatring ──
        if (this.jumpBuffer > 0 && (this.mode === 'ground' || this.mode === 'air')) {
            const facing = this.vel.lengthSq() > 0.25
                ? _f.set(this.vel.x, 0, this.vel.y).normalize()
                : intent.dir.lengthSq() > 0.01
                    ? _f.set(intent.dir.x, 0, intent.dir.y).normalize()
                    : _f.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
            if (this.tryMantle(facing)) {
                this.jumpBuffer = 0;
                return;
            }
            if (this.coyote > 0) {
                this.vy = t.jumpSpeed;
                this.coyote = 0;
                this.jumpBuffer = 0;
                this.grounded = false;
                this.mode = 'air';
                this.anim.play('Jump_Start', { fade: 0.08, startAt: 0.42, timeScale: 1.5 });
            }
        }

        // ── Kantgrep i lufta: hopper du mot en kant og holder fram, griper gutten den ──
        if (this.mode === 'air' && this.vy < 3 && this.airTime > 0.08 && intent.dir.lengthSq() > 0.25) {
            this.grabCheck = (this.grabCheck + 1) % 3;
            if (this.grabCheck === 0 && this.tryMantle(_f.set(intent.dir.x, 0, intent.dir.y).normalize())) return;
        }

        // ── Loddrett ──
        if (!this.grounded || this.vy > 0) {
            const g = this.vy < 0 ? t.gravity * 1.25 : t.gravity;
            this.vy -= g * dt;
        }

        // ── Kjør karakterkontrolleren ──
        const desired = _v.set(this.vel.x * dt, this.vy * dt, this.vel.y * dt);
        if (this.grounded && this.vy <= 0) desired.y -= 0.02;
        this.cc.computeColliderMovement(this.collider, desired, this.phys.R.QueryFilterFlags.EXCLUDE_SENSORS, GROUP_ACTOR);
        const m = this.cc.computedMovement();
        const bp = this.body.translation();
        const nx = bp.x + m.x;
        const ny = bp.y + m.y;
        const nz = bp.z + m.z;
        this.body.setNextKinematicTranslation({ x: nx, y: ny, z: nz });

        // Faktisk fart etter kollisjon: går vi inn i en vegg, skal farten ned (ellers
        // «lades» farten opp mot veggen og figuren skyter av gårde når den slipper).
        if (dt > 0) {
            const ax = m.x / dt;
            const az = m.z / dt;
            if (this.mode !== 'locked') {
                const actual = Math.hypot(ax, az);
                if (actual < this.vel.length() - 0.05) this.vel.setLength(Math.max(actual, 0));
            }
        }

        const wasGrounded = this.grounded;
        this.grounded = this.cc.computedGrounded();
        if (this.grounded && !wasGrounded) {
            const impact = -this.vy;
            this.vy = 0;
            if (this.mode !== 'locked' && this.mode !== 'dead') this.mode = 'ground';
            if (this.airTime > 0.25) {
                if (impact > 9) {
                    this.landLock = 0.35;
                    this.anim.play('Jump_Land', { fade: 0.06, startAt: 0.05, timeScale: 1.6 });
                } else if (this.anim.current?.startsWith('Jump')) {
                    this.anim.play('Jump_Land', { fade: 0.06, startAt: 0.35, timeScale: 2.2 });
                }
                this.onLand?.(impact);
            } else if (this.anim.current?.startsWith('Jump')) this.anim.release(0.12);
            this.airTime = 0;
        } else if (!this.grounded) {
            this.airTime += dt;
            if (this.mode === 'ground') this.mode = 'air';
            if (this.vy > 0 && m.y < this.vy * dt * 0.5) this.vy = 0; // slo hodet i taket
            if (this.mode === 'air' && this.airTime > 0.18 && this.anim.current !== 'Jump_Loop' &&
                (this.anim.current !== 'Jump_Start' || this.anim.progress() > 0.85)) {
                this.anim.play('Jump_Loop', { fade: 0.2, loop: true });
            }
        }
        if (this.grounded && this.anim.current === 'Jump_Land' && this.anim.progress() > 0.95) this.anim.release(0.18);

        this.pos.set(nx, ny - t.height / 2, nz);

        // ── Retning: figuren ser dit den beveger seg ──
        const sp = this.vel.length();
        if (this.mode !== 'locked' && this.mode !== 'dead' && sp > 0.15) {
            const target = Math.atan2(this.vel.x, this.vel.y);
            const d = wrapAngle(target - this.yaw);
            const maxStep = t.turnRate * 1.4 * dt;
            const stepYaw = THREE.MathUtils.clamp(d, -maxStep, maxStep);
            this.yaw += stepYaw;
            this.yawRate = stepYaw / dt;
        } else this.yawRate *= 0.8;
    }

    /**
     * Ser etter en kant foran figuren som er mellom 0,45 og 2,75 m over føttene.
     * Lav kant = hvelv over (rask). Høy kant = dra seg opp (tregere, med vekt).
     */
    private tryMantle(f: THREE.Vector3): boolean {
        const feet = this.pos;
        let wall: { distance: number; point: THREE.Vector3 } | null = null;
        for (const h of [0.35, 0.95, 1.55]) {
            const hit = this.phys.rayWorld(_o.set(feet.x, feet.y + h, feet.z), f, this.tune.radius + 0.85, true);
            if (hit && Math.abs(hit.normal.y) < 0.3) {
                wall = hit;
                break;
            }
        }
        if (!wall) return false;
        // Toppen av hindringen rett bak veggflaten, og stedet vi skal lande litt lenger inn.
        const top = (dist: number) => {
            const o = _o.copy(wall!.point).addScaledVector(f, dist);
            o.y = feet.y + MANTLE_MAX + 0.4;
            const hit = this.phys.rayWorld(o, _down, MANTLE_MAX + 0.6, true);
            return hit && hit.normal.y > 0.7 ? hit.point.y : null;
        };
        const obstacleTop = top(0.06);
        const landY = top(0.55) ?? obstacleTop;
        if (obstacleTop === null || landY === null) return false;
        const rise = landY - feet.y;
        if (rise < MANTLE_MIN || rise > MANTLE_MAX) return false;
        const end = _e.copy(wall.point).addScaledVector(f, 0.55);
        end.y = landY;
        if (!this.phys.capsuleFits(_c.copy(end).setY(landY + this.tune.height / 2 + 0.05), this.tune.height / 2 - this.tune.radius, this.tune.radius - 0.02)) {
            return false;
        }
        const apexY = Math.max(obstacleTop, landY) + 0.12;
        const high = rise > 1.25;
        const start = this.pos.clone();
        const atWall = wall.point.clone().addScaledVector(f, -this.tune.radius - 0.05);
        this.mantle = {
            t: 0,
            dur: high ? 0.95 + (rise - 1.25) * 0.25 : 0.42,
            a: start,
            b: new THREE.Vector3(atWall.x, apexY, atWall.z),
            c: end.clone(),
            high,
        };
        this.yaw = Math.atan2(f.x, f.z);
        this.mode = 'mantle';
        this.vel.set(0, 0);
        this.vy = 0;
        this.collider.setEnabled(false);
        // Høy kant: hendene mot kanten og beina som skyver (Push_Loop), så knærne opp.
        if (high) this.anim.play('Push_Loop', { fade: 0.1, loop: true, startAt: 0.4, timeScale: 1.3 });
        else this.anim.play('Jump_Start', { fade: 0.06, startAt: 0.5, timeScale: 1.8 });
        return true;
    }

    private stepMantle(dt: number): void {
        const m = this.mantle!;
        m.t += dt / m.dur;
        const u = Math.min(1, m.t);
        // Høy kant: først et tungt løft opp langs veggen (70 % av tiden), så knærne opp
        // og fram over kanten. Lav kant: én jevn bue.
        if (m.high) {
            if (u < 0.7) {
                const k = easeInOut(u / 0.7);
                this.pos.set(
                    THREE.MathUtils.lerp(m.a.x, m.b.x, Math.min(1, k * 2)),
                    THREE.MathUtils.lerp(m.a.y, m.b.y - 0.15, k),
                    THREE.MathUtils.lerp(m.a.z, m.b.z, Math.min(1, k * 2))
                );
                if (u > 0.45 && this.anim.current !== 'Crouch_Idle_Loop') {
                    this.anim.play('Crouch_Idle_Loop', { fade: 0.22, loop: true });
                }
            } else {
                const k = easeOut((u - 0.7) / 0.3);
                this.pos.set(
                    THREE.MathUtils.lerp(m.b.x, m.c.x, k),
                    THREE.MathUtils.lerp(m.b.y - 0.15, m.c.y, k) + Math.sin(k * Math.PI) * 0.15,
                    THREE.MathUtils.lerp(m.b.z, m.c.z, k)
                );
            }
        } else {
            const k = easeInOut(u);
            const inv = 1 - k;
            this.pos.set(
                inv * inv * m.a.x + 2 * inv * k * m.b.x + k * k * m.c.x,
                inv * inv * m.a.y + 2 * inv * k * (m.b.y + 0.25) + k * k * m.c.y,
                inv * inv * m.a.z + 2 * inv * k * m.b.z + k * k * m.c.z
            );
        }
        this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y + this.tune.height / 2, z: this.pos.z });
        if (u >= 1) {
            this.mantle = null;
            this.collider.setEnabled(true);
            this.mode = 'ground';
            this.grounded = true;
            this.anim.release(m.high ? 0.3 : 0.15);
            // Litt fart videre fram, så det flyter rett over i løp.
            this.vel.set(Math.sin(this.yaw) * 1.2, Math.cos(this.yaw) * 1.2);
        }
    }

    /** Tegn: interpoler mellom de to siste simuleringsstegene, og legg på lening. */
    render(alpha: number, dt: number): void {
        const r = this.anim.root;
        r.position.lerpVectors(this.prevPos, this.pos, alpha);
        r.rotation.y = this.prevYaw + wrapAngle(this.yaw - this.prevYaw) * alpha;

        // Lening: framover når farten øker, inn i svingen når vi svinger fort.
        const sp = this.vel.length();
        const fwdLean = this.mode === 'ground' ? THREE.MathUtils.clamp((sp - this.anim.speedOf('Walk_Loop')) * 0.025, 0, 0.1) : 0;
        const sideLean = this.mode === 'ground' ? THREE.MathUtils.clamp(-this.yawRate * sp * 0.012, -0.22, 0.22) : 0;
        this.smoothLean.x += (fwdLean - this.smoothLean.x) * Math.min(1, dt * 8);
        this.smoothLean.y += (sideLean - this.smoothLean.y) * Math.min(1, dt * 6);
        this.anim.lean.rotation.set(this.smoothLean.x, 0, this.smoothLean.y);

        const animSpeed = this.mode === 'ground' || this.mode === 'air' ? sp : 0;
        this.anim.update(dt, this.mode === 'air' ? 0 : animSpeed);
    }
}

const _v2 = new THREE.Vector2();
const _o = new THREE.Vector3();
const _e = new THREE.Vector3();
const _c = new THREE.Vector3();

export function wrapAngle(a: number): number {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

function moveTowards(v: THREE.Vector2, target: THREE.Vector2, maxDelta: number): void {
    const dx = target.x - v.x;
    const dy = target.y - v.y;
    const d = Math.hypot(dx, dy);
    if (d <= maxDelta || d === 0) v.copy(target);
    else {
        v.x += (dx / d) * maxDelta;
        v.y += (dy / d) * maxDelta;
    }
}

const easeInOut = (x: number) => x * x * (3 - 2 * x);
const easeOut = (x: number) => 1 - (1 - x) * (1 - x);
