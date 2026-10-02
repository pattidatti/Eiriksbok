// Gråboks-spillet: kobler motordelene sammen i én løkke.
//
// Løkka: simuleringen går i faste 1/60-steg (fysikk, figurer, båt, kamp). Tegningen
// skjer så ofte nettleseren vil, og interpolerer mellom de to siste stegene. Da blir
// bevegelsen like jevn på 30 og 144 bilder i sekundet.
import * as THREE from 'three';
import { loadRapier, Physics } from '../motor/physics';
import { Input } from '../motor/input';
import { Animator, loadRig } from '../motor/animator';
import { BOY_TUNING, Character, type CharacterTuning } from '../motor/character';
import { RIG_BOAT, RIG_COMBAT, RIG_WALK, SpringArmCamera } from '../motor/camera';
import { Faering, WATER_Y } from '../motor/boat';
import { EnemyAI, PlayerCombat, type CombatSink, type DamageEvent } from '../motor/combat';
import { Gore } from '../motor/gore';
import { buildGraybox, type GrayboxLayout } from './scene';
import type { BryggenWorld } from '../bygg/bryggen';

/** Hvilken verden løkka kjører: grå prøvescene eller Bryggen bygget av modulsettet. */
export type WorldId = 'graboks' | 'gard';

const STEP = 1 / 60;
const RIG_URL = '/games/bryggen/models/mannequin.glb';

const ADULT_TUNING: CharacterTuning = { ...BOY_TUNING, height: 1.8, radius: 0.32, walkSpeed: 1.2, runSpeed: 3.0, sprintSpeed: 5.0 };

export interface HudState {
    loading: boolean;
    fps: number;
    frameMs: number;
    simMs: number;
    drawCalls: number;
    triangles: number;
    prompt: string | null;
    mode: 'foot' | 'boat';
    playerHp: number;
    enemyHp: number;
    enemyMax: number;
    enemyActive: boolean;
    telegraph: boolean;
    finisherReady: boolean;
    playerDead: boolean;
    enemyDead: boolean;
    message: string | null;
    pointerLocked: boolean;
    /** Spilleren startet med mus (da skal musa være låst mens det spilles). */
    mouseMode: boolean;
    boatSpeed: number;
    /** Lastede celler (bare i Bryggen-scenen). */
    cells: number;
    /** Grafikknivået som brukes nå. */
    quality: Quality;
}

/** Full: normal- og AO-kart, miljølys og skygger. Lav: bare fargetekstur og ruhet. */
export type Quality = 'full' | 'lav';

interface Floater {
    el: HTMLDivElement;
    pos: THREE.Vector3;
    age: number;
    life: number;
    drift: number;
}

export class GrayboxGame {
    private readonly renderer: THREE.WebGLRenderer;
    private readonly scene = new THREE.Scene();
    private readonly cam: SpringArmCamera;
    private readonly input: Input;
    private readonly container: HTMLElement;
    private readonly floatLayer: HTMLElement;
    private readonly onHud: (s: HudState) => void;
    private phys!: Physics;
    private layout!: GrayboxLayout;
    private player!: Character;
    private enemy!: Character;
    private pc!: PlayerCombat;
    private ai!: EnemyAI;
    private boat!: Faering;
    private gore = new Gore();
    private sun!: THREE.DirectionalLight;
    private readonly worldId: WorldId;
    private world: BryggenWorld | null = null;
    private streamTimer = 0;
    private clock = 0;
    /** Hvor langt inne i et rom kameraet er, glattet (0 ute, 1 inne). */
    private inne = 0;
    private raf = 0;
    private last = 0;
    private acc = 0;
    private timeScale = 1;
    private slowmo = 0;
    private hitstop = 0;
    private mode: 'foot' | 'boat' = 'foot';
    private disposed = false;
    private ready = false;
    private floaters: Floater[] = [];
    private telegraph = false;
    private message: string | null = null;
    private messageTimer = 0;
    private prompt: string | null = null;
    private promptTimer = 0;
    private landCandidate: THREE.Vector3 | null = null;
    private drowning = 0;
    private rowLean = new THREE.Euler();
    // Måling
    private frameTimes: number[] = [];
    private simTimes: number[] = [];
    private hudTimer = 0;

    private low: boolean;
    /** ?skygger=0 slår av skygger også på full kvalitet (for måling). */
    private readonly shadowsAllowed: boolean;
    private hemi!: THREE.HemisphereLight;

    constructor(container: HTMLElement, floatLayer: HTMLElement, onHud: (s: HudState) => void, opts: { shadows: boolean; world?: WorldId; low?: boolean }) {
        this.container = container;
        this.worldId = opts.world ?? 'graboks';
        this.low = !!opts.low;
        this.shadowsAllowed = opts.shadows;
        this.floatLayer = floatLayer;
        this.onHud = onHud;
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(1, window.devicePixelRatio || 1));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.renderer.shadowMap.enabled = opts.shadows && !opts.low;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.tabIndex = 0;
        this.cam = new SpringArmCamera(1);
        this.input = new Input(this.renderer.domElement);
        this.resize();
        window.addEventListener('resize', this.resize);
        document.addEventListener('pointerlockchange', this.pushHudSoon);
        document.addEventListener('fullscreenchange', this.onFullscreen);
    }

    /** Chrome slipper musa når fullskjermen slår inn. Lås den igjen når skjermen står. */
    private onFullscreen = () => {
        if (this.input.mouseMode && document.fullscreenElement && !this.input.pointerLocked) {
            this.input.requestPointerLock();
        }
    };

    async start(): Promise<void> {
        const [R, rig] = await Promise.all([loadRapier(), loadRig(RIG_URL)]);
        if (this.disposed) return;
        this.phys = new Physics(R);

        // Lys og luft: grått Bergen-vær. Tåka skjuler det som er langt unna.
        const fogColor = 0x9ba4ab;
        this.scene.background = new THREE.Color(fogColor);
        this.scene.fog = new THREE.FogExp2(fogColor, 0.024);
        const hemi = new THREE.HemisphereLight(0xc9d2da, 0x4a4843, 1.5);
        this.hemi = hemi;
        this.scene.add(hemi);
        this.sun = new THREE.DirectionalLight(0xfff4e6, 1.5);
        this.sun.position.set(-14, 22, -10);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(1024, 1024);
        const sc = this.sun.shadow.camera;
        sc.left = -16;
        sc.right = 16;
        sc.top = 16;
        sc.bottom = -16;
        sc.near = 1;
        sc.far = 70;
        this.sun.shadow.bias = -0.0006;
        this.sun.shadow.normalBias = 0.03;
        this.scene.add(this.sun, this.sun.target);

        if (this.worldId === 'gard') {
            const { buildBryggen } = await import('../bygg/bryggen');
            this.world = await buildBryggen(this.scene, this.phys, this.renderer, { low: this.low });
            if (this.disposed) return;
            this.layout = this.world.layout;
            // Cellene rundt start må stå før første fysikksteg, ellers faller gutten gjennom kaia.
            await this.world.streamer.update(this.layout.playerStart);
            if (this.disposed) return;
            // Miljølyset fra himmelen gjør en del av jobben halvkulelyset gjør i gråboksen.
            hemi.intensity = this.low ? 1.7 : 1.25;
            this.renderer.toneMappingExposure = 1.2;
        } else {
            this.layout = buildGraybox(this.scene, this.phys);
        }
        const L = this.layout;

        this.player = new Character(this.phys, new Animator(rig, BOY_TUNING.height), BOY_TUNING, L.playerStart);
        this.player.yaw = L.playerYaw;
        this.player.prevYaw = L.playerYaw;
        this.scene.add(this.player.anim.root);
        this.player.onLand = (impact) => {
            if (impact > 9) this.cam.addShake(Math.min(0.25, impact * 0.015));
        };

        this.enemy = new Character(this.phys, new Animator(rig, ADULT_TUNING.height, 0x5a4a3c), ADULT_TUNING, L.enemyStart);
        this.enemy.yaw = Math.PI;
        this.enemy.prevYaw = Math.PI;
        this.scene.add(this.enemy.anim.root);

        this.pc = new PlayerCombat(this.player, 100);
        this.ai = new EnemyAI(this.enemy, 110, 0x5a4a3c);

        // Færingen får ekte treteksturer senere (asset-tracker §10); i Bryggen-scenen er den i alle fall brun.
        const boatColor = this.world ? 0x6b5848 : 0x8a8d8f;
        this.boat = new Faering(this.phys, L.boatStart, L.boatYaw, new THREE.MeshStandardMaterial({ color: boatColor, roughness: 0.9 }));
        this.boat.onBump = (s) => this.cam.addShake(Math.min(0.2, s * 0.06));
        this.boat.onCatch = () => {
            if (this.mode === 'boat') this.cam.addShake(0.015);
        };
        this.scene.add(this.boat.group, this.gore.group);

        // Første fysikksteg så alle kolliderer står på plass før spilleren beveger seg.
        this.phys.step();
        this.ready = true;
        this.cam.yaw = L.playerYaw + Math.PI;
        this.last = performance.now();
        this.pushHud();
        this.raf = requestAnimationFrame(this.frame);
    }

    requestPointerLock(): void {
        this.input.requestPointerLock();
        this.renderer.domElement.focus();
    }

    focus(): void {
        this.renderer.domElement.focus();
    }

    get quality(): Quality {
        return this.low ? 'lav' : 'full';
    }

    /** Bytter grafikknivå mens spillet går. Første bytte til full laster detaljkartene. */
    async setQuality(q: Quality): Promise<void> {
        const low = q === 'lav';
        if (low === this.low) return;
        this.low = low;
        this.pushHud();
        if (this.world) {
            await this.world.materials.setLow(low);
            if (this.disposed || this.low !== low) return;
            this.scene.environment = low ? null : this.world.environment;
        }
        this.renderer.shadowMap.enabled = this.shadowsAllowed && !low;
        // Skyggene er bakt inn i shaderne: alle materialer må bygges på nytt.
        this.scene.traverse((o) => {
            const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(mat)) mat.forEach((m) => (m.needsUpdate = true));
            else if (mat) mat.needsUpdate = true;
        });
    }

    dispose(): void {
        this.disposed = true;
        cancelAnimationFrame(this.raf);
        window.removeEventListener('resize', this.resize);
        document.removeEventListener('pointerlockchange', this.pushHudSoon);
        document.removeEventListener('fullscreenchange', this.onFullscreen);
        this.input.dispose();
        this.world?.streamer.dispose();
        this.world?.materials.dispose();
        this.world?.environment.dispose();
        if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
        this.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (m.geometry) m.geometry.dispose();
            const mat = m.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
            else mat?.dispose();
        });
        this.renderer.dispose();
        this.renderer.domElement.remove();
        this.floaters.forEach((f) => f.el.remove());
    }

    /** Tall til ytelsesrapporten (leses av Playwright). */
    stats(): { fps: number; p95ms: number; simMs: number; frames: number } {
        const ft = [...this.frameTimes].sort((a, b) => a - b);
        const avg = ft.reduce((a, b) => a + b, 0) / Math.max(1, ft.length);
        const st = this.simTimes.reduce((a, b) => a + b, 0) / Math.max(1, this.simTimes.length);
        return { fps: 1000 / Math.max(0.001, avg), p95ms: ft[Math.floor(ft.length * 0.95)] ?? 0, simMs: st, frames: ft.length };
    }

    private resize = () => {
        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;
        this.renderer.setSize(w, h);
        this.cam.camera.aspect = w / h;
        this.cam.camera.updateProjectionMatrix();
    };

    private pushHudSoon = () => {
        this.hudTimer = 1;
    };

    private frame = (now: number) => {
        if (this.disposed) return;
        this.raf = requestAnimationFrame(this.frame);
        let dt = (now - this.last) / 1000;
        this.last = now;
        if (document.hidden || dt > 0.25) dt = 0; // fanebytte: ikke ta igjen tapt tid
        const t0 = performance.now();

        // Treffpause og sakte film skalerer spilltiden, aldri kameraet.
        if (this.hitstop > 0) {
            this.hitstop -= dt;
            this.timeScale = 0.06;
        } else if (this.slowmo > 0) {
            this.slowmo -= dt;
            this.timeScale = 0.35;
        } else this.timeScale = 1;
        const gameDt = dt * this.timeScale;

        this.acc += gameDt;
        let steps = 0;
        while (this.acc >= STEP && steps < 5) {
            this.simulate(STEP);
            this.acc -= STEP;
            steps++;
        }
        if (steps === 5) this.acc = 0;
        const alpha = this.acc / STEP;
        const simMs = performance.now() - t0;

        this.renderFrame(dt, gameDt, alpha);
        // Utviklerverktøy (bare i dev): et fast kamera for skjermbilder og måling fra Vågen.
        // Sett window.__bryggenFoto = { pos: [x, y, z], look: [x, y, z] } i konsollen.
        // window.__bryggenPos viser hvor gutten står (til testskript).
        const dev = window as { __bryggenFoto?: { pos: number[]; look: number[] }; __bryggenPos?: number[] };
        const foto = import.meta.env.DEV ? dev.__bryggenFoto : undefined;
        if (import.meta.env.DEV && this.player) dev.__bryggenPos = this.player.pos.toArray();
        if (foto) {
            this.cam.camera.position.fromArray(foto.pos);
            this.cam.camera.lookAt(foto.look[0], foto.look[1], foto.look[2]);
        }
        this.renderer.render(this.scene, this.cam.camera);

        // Måling: tid mellom bilder (inkluderer GPU-ventetid via rAF).
        if (dt > 0) {
            this.frameTimes.push(dt * 1000);
            this.simTimes.push(simMs);
            if (this.frameTimes.length > 600) {
                this.frameTimes.shift();
                this.simTimes.shift();
            }
        }
        this.hudTimer += dt;
        if (this.hudTimer > 0.25) {
            this.hudTimer = 0;
            this.pushHud();
        }
    };

    private simulate(dt: number): void {
        const inp = this.input.read(performance.now() / 1000);
        const fwd = this.cam.forward(new THREE.Vector2());
        // Kamera-rommet: fram = bort fra kameraet, høyre = fram × opp.
        const right = new THREE.Vector2(-fwd.y, fwd.x);
        const dir = new THREE.Vector2().addScaledVector(fwd, inp.move.y).addScaledVector(right, inp.move.x);

        if (inp.resetPressed) this.resetFight();

        if (this.mode === 'boat') {
            this.boat.step(dt, { forward: inp.move.y, turn: inp.move.x });
            const seat = new THREE.Vector3(0, 0.22, -0.25)
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.boat.yaw)
                .add(this.boat.pos);
            this.player.step(dt, { dir: new THREE.Vector2(), sprint: false, jump: false });
            this.player.pos.set(seat.x, seat.y - 0.5, seat.z);
            this.player.yaw = this.boat.yaw + Math.PI;
            if (inp.interactPressed && this.landCandidate) this.disembark(this.landCandidate);
        } else {
            this.boat.step(dt, null);
            const combatInput = {
                light: inp.lightPressed,
                heavy: inp.heavyPressed,
                block: inp.blockHeld,
                dodge: inp.dodgePressed,
                finisher: inp.finisherPressed,
            };
            this.pc.step(dt, combatInput, dir, [this.ai], this.sink);
            const canMove = !this.pc.busy;
            this.player.step(dt, {
                dir: canMove ? dir : new THREE.Vector2(),
                sprint: inp.sprint,
                jump: canMove && inp.jumpPressed,
            });
            if (inp.interactPressed && this.prompt?.startsWith('E: Gå om bord')) this.embark();
            this.checkWater(dt);
        }

        const enemyIntent = this.ai.step(dt, this.pc, this.sink);
        this.enemy.step(dt, { dir: enemyIntent, sprint: false, jump: false });
        this.phys.step();
        this.gore.update(dt);

        if (this.pc.f.dead && !this.message) this.flash('Du ble slått ned. Trykk R for å prøve igjen.', 99);
    }

    private renderFrame(dt: number, gameDt: number, alpha: number): void {
        this.boat.render(alpha);
        this.player.render(alpha, gameDt);
        this.enemy.render(alpha, gameDt);
        if (this.mode === 'boat') {
            // Åretaket: len fram ved innsettet, dra bakover gjennom drivet.
            const p = this.boat.strokePhase;
            const lean = p < 0.42 ? THREE.MathUtils.lerp(0.45, -0.3, smooth(p / 0.42)) : THREE.MathUtils.lerp(-0.3, 0.45, smooth((p - 0.42) / 0.58));
            this.rowLean.set(lean * 0.5, 0, 0);
            this.player.anim.setBoneOffset('DEF-spine.001', this.rowLean);
            this.player.anim.setBoneOffset('DEF-spine.002', this.rowLean);
        }

        const follow = this.mode === 'boat' ? this.boat.group.position : this.player.anim.root.position;
        const enemyNear = this.ai.aggro && !this.ai.f.dead && !this.pc.f.dead &&
            this.enemy.pos.distanceTo(this.player.pos) < 9;
        this.cam.setRig(this.mode === 'boat' ? RIG_BOAT : enemyNear ? RIG_COMBAT : RIG_WALK);
        if (this.mode === 'boat') this.cam.autoFollowYaw = this.boat.yaw + Math.PI;
        else if (!this.input.pointerLocked && this.player.speed > 1.2) this.cam.autoFollowYaw = this.player.yaw + Math.PI;
        else this.cam.autoFollowYaw = null;
        this.cam.update(dt, this.input.takeLook(), follow, this.phys);

        // Kameraet helt inntil gutten (rygg mot veggen): ton ham ut i stedet for å vise innsiden.
        const arm = this.cam.armLength;
        this.player.anim.setOpacity(this.mode === 'boat' ? 1 : THREE.MathUtils.clamp((arm - 0.45) / 0.5, 0.15, 1));

        // Strømming: sjekk cellene et par ganger i sekundet, ikke hvert bilde.
        if (this.world) {
            this.streamTimer -= dt;
            if (this.streamTimer <= 0) {
                this.streamTimer = 0.3;
                // Med fotokameraet (dev) strømmes byen rundt kameraet, ikke gutten.
                const foto = import.meta.env.DEV ? (window as { __bryggenFoto?: { pos: number[] } }).__bryggenFoto : undefined;
                void this.world.streamer.update(foto ? new THREE.Vector3().fromArray(foto.pos) : follow);
            }
            // Inne i et rom: dagslyset dempes mykt, så ildstedet tar over. Kameraet avgjør, ikke
            // gutten, ellers blir rommet mørkt mens kameraet ennå står ute i gårdsrommet.
            this.clock += dt;
            const inne = this.world.update(this.clock, dt, this.cam.camera.position);
            this.inne += (inne - this.inne) * Math.min(1, dt * 3);
            const ute = 1 - this.inne * 0.65;
            this.hemi.intensity = (this.low ? 1.7 : 1.25) * ute;
            this.sun.intensity = 1.5 * (1 - this.inne * 0.85);
            this.scene.environmentIntensity = 0.9 * ute;
        }

        // Skyggen følger spilleren.
        const p = follow;
        this.sun.position.set(p.x - 14, p.y + 22, p.z - 10);
        this.sun.target.position.set(p.x, p.y, p.z);

        this.updatePrompts(dt);
        this.updateFloaters(dt);
        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) this.message = null;
        }
    }

    private updatePrompts(dt: number): void {
        this.promptTimer -= dt;
        if (this.promptTimer > 0) return;
        this.promptTimer = 0.15;
        this.landCandidate = null;
        if (this.mode === 'foot') {
            const d = Math.hypot(this.boat.pos.x - this.player.pos.x, this.boat.pos.z - this.player.pos.z);
            this.prompt = d < 3.4 && this.player.grounded && !this.pc.busy ? 'E: Gå om bord i færingen' : null;
        } else {
            this.landCandidate = this.findLanding();
            this.prompt = this.landCandidate ? 'E: Gå i land' : null;
        }
    }

    private findLanding(): THREE.Vector3 | null {
        const b = this.boat;
        const fx = Math.sin(b.yaw);
        const fz = Math.cos(b.yaw);
        const cands: [number, number][] = [];
        for (const along of [0, 1.4, -1.4]) {
            for (const side of [1.9, -1.9]) cands.push([b.pos.x + fx * along + fz * side, b.pos.z + fz * along - fx * side]);
        }
        cands.push([b.pos.x + fx * 3.8, b.pos.z + fz * 3.8], [b.pos.x - fx * 3.8, b.pos.z - fz * 3.8]);
        for (const [x, z] of cands) {
            const hit = this.phys.rayWorld(new THREE.Vector3(x, 3, z), new THREE.Vector3(0, -1, 0), 4);
            if (!hit || hit.normal.y < 0.7 || hit.point.y < WATER_Y + 0.6) continue;
            const t = BOY_TUNING;
            if (this.phys.capsuleFits(new THREE.Vector3(x, hit.point.y + t.height / 2 + 0.05, z), t.height / 2 - t.radius, t.radius)) {
                return new THREE.Vector3(x, hit.point.y, z);
            }
        }
        return null;
    }

    private embark(): void {
        this.mode = 'boat';
        this.player.setSeated(true);
        this.player.anim.play('Row', { fade: 0.25, loop: true });
        this.prompt = null;
        this.flash('W ror framover · S bakker · A/D svinger. Du sitter med ryggen mot baugen, slik man ror.', 5);
    }

    private disembark(at: THREE.Vector3): void {
        this.mode = 'foot';
        this.player.setSeated(false);
        this.player.teleport(at, this.boat.yaw);
        this.player.anim.release(0.25);
        this.player.anim.setBoneOffset('DEF-spine.001', null);
        this.player.anim.setBoneOffset('DEF-spine.002', null);
        this.boat.speed *= 0.3;
        this.prompt = null;
    }

    private checkWater(dt: number): void {
        if (this.player.pos.y < WATER_Y - 0.3) {
            this.drowning += dt;
            if (this.drowning === dt) this.flash('Plask! De fleste på Bryggen kunne ikke svømme. Du blir dratt opp på kaia.', 4);
            if (this.drowning > 0.7) {
                this.player.teleport(this.layout.rescue, 0);
                this.drowning = 0;
            }
        }
    }

    private resetFight(): void {
        this.pc.reset();
        this.player.anim.release(0.1);
        this.player.unlock();
        if (this.player.mode === 'dead') this.player.mode = 'ground';
        this.ai.f.hp = this.ai.f.maxHp;
        this.ai.f.dead = false;
        this.ai.state = 'idle';
        this.ai.aggro = false;
        this.enemy.mode = 'ground';
        this.enemy.teleport(this.layout.enemyStart, Math.PI);
        this.enemy.anim.release(0.1);
        this.gore.clearStains();
        this.message = null;
        this.messageTimer = 0;
    }

    private flash(text: string, seconds: number): void {
        this.message = text;
        this.messageTimer = seconds;
        this.pushHud();
    }

    // ── Kampens utganger: skadetall, blod, treffpause ──
    private sink: CombatSink = {
        damage: (e: DamageEvent) => this.spawnFloater(e),
        blood: (at, dir, amount) => {
            const floor = at.y < this.player.pos.y + 3 ? Math.min(this.player.pos.y, this.enemy.pos.y) : at.y - 1.5;
            this.gore.spray(at, dir, amount, floor);
        },
        impact: (stop, shake) => {
            this.hitstop = Math.max(this.hitstop, stop);
            this.cam.addShake(shake);
            if (this.ai.f.dead && this.ai.f.hp <= 0) this.slowmo = 0.6;
        },
        whiff: () => undefined,
        telegraph: (on) => {
            this.telegraph = on;
            this.pushHud();
        },
    };

    private spawnFloater(e: DamageEvent): void {
        const el = document.createElement('div');
        const text =
            e.kind === 'counter' && e.amount === 0 ? 'MOTSLAG!' :
            e.kind === 'blocked' ? `Blokkert ${e.amount}` :
            e.kind === 'finisher' ? `${e.amount}` :
            `${e.amount}`;
        const color =
            e.kind === 'taken' ? '#fca5a5' :
            e.kind === 'blocked' ? '#cbd5e1' :
            e.kind === 'counter' ? '#fde68a' :
            e.kind === 'finisher' ? '#fecaca' : '#ffffff';
        const size = e.kind === 'finisher' ? 34 : e.kind === 'counter' ? 22 : e.amount >= 18 ? 28 : 21;
        el.textContent = text;
        el.style.cssText = `position:absolute;left:0;top:0;font:800 ${size}px Inter,system-ui,sans-serif;color:${color};` +
            'text-shadow:0 2px 0 #000,0 0 6px rgba(0,0,0,.8);pointer-events:none;white-space:nowrap;will-change:transform;';
        this.floatLayer.appendChild(el);
        this.floaters.push({ el, pos: e.at.clone(), age: 0, life: 0.9, drift: (Math.random() - 0.5) * 30 });
    }

    private updateFloaters(dt: number): void {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        const v = new THREE.Vector3();
        this.floaters = this.floaters.filter((f) => {
            f.age += dt;
            if (f.age >= f.life) {
                f.el.remove();
                return false;
            }
            v.copy(f.pos).project(this.cam.camera);
            const k = f.age / f.life;
            const pop = k < 0.12 ? 0.6 + (k / 0.12) * 0.6 : 1.2 - Math.min(0.2, (k - 0.12) * 0.5);
            const x = (v.x * 0.5 + 0.5) * w + f.drift * k;
            const y = (-v.y * 0.5 + 0.5) * h - k * 55;
            f.el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) scale(${pop})`;
            f.el.style.opacity = String(v.z > 1 ? 0 : 1 - Math.max(0, (k - 0.6) / 0.4));
            return true;
        });
    }

    private pushHud(): void {
        const s = this.stats();
        const info = this.renderer.info.render;
        this.onHud({
            loading: !this.ready,
            fps: Math.round(s.fps),
            frameMs: Math.round((1000 / Math.max(1, s.fps)) * 10) / 10,
            simMs: Math.round(s.simMs * 100) / 100,
            drawCalls: info.calls,
            triangles: info.triangles,
            prompt: this.prompt,
            mode: this.mode,
            playerHp: this.pc ? this.pc.f.hp : 100,
            enemyHp: this.ai ? this.ai.f.hp : 0,
            enemyMax: this.ai ? this.ai.f.maxHp : 1,
            enemyActive: !!this.ai && this.ai.aggro && !this.ai.f.dead,
            telegraph: this.telegraph,
            finisherReady: !!this.ai && this.ai.canBeFinished && this.enemy.pos.distanceTo(this.player.pos) < 3.5,
            playerDead: !!this.pc && this.pc.f.dead,
            enemyDead: !!this.ai && this.ai.f.dead,
            message: this.message,
            pointerLocked: this.input.pointerLocked,
            mouseMode: this.input.mouseMode,
            boatSpeed: this.boat ? Math.abs(this.boat.speed) : 0,
            cells: this.world ? this.world.streamer.liveCount : 0,
            quality: this.quality,
        });
    }
}

const smooth = (x: number) => x * x * (3 - 2 * x);
