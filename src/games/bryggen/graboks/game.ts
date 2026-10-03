// Gråboks-spillet: kobler motordelene sammen i én løkke.
//
// Løkka: simuleringen går i faste 1/60-steg (fysikk, figurer, båt, kamp). Tegningen
// skjer så ofte nettleseren vil, og interpolerer mellom de to siste stegene. Da blir
// bevegelsen like jevn på 30 og 144 bilder i sekundet.
import * as THREE from 'three';
import { loadRapier, Physics } from '../motor/physics';
import { Input } from '../motor/input';
import { Animator, loadRig } from '../motor/animator';
import { kleFigur, RIG_URL } from '../motor/figur';
import { BOY_TUNING, Character, type CharacterTuning } from '../motor/character';
import { RIG_BOAT, RIG_COMBAT, RIG_WALK, SpringArmCamera } from '../motor/camera';
import { Faering, WATER_Y } from '../motor/boat';
import { EnemyAI, PlayerCombat, type CombatSink, type DamageEvent } from '../motor/combat';
import { Gore } from '../motor/gore';
import { buildGraybox, type GrayboxLayout } from './scene';
import type { BryggenWorld } from '../bygg/bryggen';
import { Etterbehandling } from '../motor/post';
import { Lyssetting, stemningFraUrl } from '../motor/stemning';
import type { LydKobling } from '../motor/lydkobling';
import type { BussVolum } from '../motor/lyd';
import type { FolkStyring } from './folkstyring';
import { MeldingKo } from './meldingko';
import type { Tyv } from './tyv';
import { Flytere } from './flytere';
import { devOppdrag, devStart, devVerktoy } from './dev';
import { finnLanding } from './baat';
import type { Baering } from './baering';
import type { Spillsystem } from './system';

/** Hvilken verden løkka kjører: grå prøvescene eller Bryggen bygget av modulsettet. */
export type WorldId = 'graboks' | 'gard';

const STEP = 1 / 60;

const ADULT_TUNING: CharacterTuning = { ...BOY_TUNING, height: 1.8, radius: 0.32, walkSpeed: 1.2, runSpeed: 3.0, sprintSpeed: 5.0 };

export type { HudState, Quality } from './hudstate';
import type { HudState, Quality } from './hudstate';

export class GrayboxGame {
    private readonly renderer: THREE.WebGLRenderer;
    private readonly scene = new THREE.Scene();
    private readonly cam: SpringArmCamera;
    readonly input: Input;
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
    private lys!: Lyssetting;
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
    private flytere: Flytere;
    private telegraph = false;
    private telegraphSving = false;
    /** Oppdragsmeldingene venter på tur og til samtalen er over (meldingko.ts). */
    private meldinger = new MeldingKo();
    /** Tyven i gården (bare Bryggen-scenen): ute bare mens oppdraget hans er aktivt. */
    private tyv: Tyv | null = null;
    private message: string | null = null;
    private messageTimer = 0;
    private prompt: string | null = null;
    private oppdragPrompt: string | null = null;
    /** Hvilken skulder kameraet står over i en samtale, og hvor lenge det har vært for trangt der. */
    private samtaleSide = 1;
    private trang = 0;
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
    /** Etterbehandlingen (kantutjevning, fargetone, vignett). Bare Bryggen-scenen på full kvalitet. */
    private post: Etterbehandling | null = null;
    /** Lyden (bare Bryggen-scenen). Startes av første tastetrykk eller klikk (`startLyd`). */
    private lyd: LydKobling | null = null;
    private lydValg = { onsket: false, paa: true, volum: 0.8, busser: { ute: 1, inne: 1, hendelse: 1 } as BussVolum };
    /** Pausemenyen (ui/Pausemeny.tsx) og valgene fra innstillingene (ui/innstillinger.ts). */
    private pauset = false;
    private pauseBilde = 0;
    private skyggerPaa = true;
    postPaa = true;
    /** Folkene: hvem gutten kan snakke med, og samtalen (bare Bryggen-scenen). */
    folk: FolkStyring | null = null;
    /** Bære tørrfisk fra kaia til bua (bare Bryggen-scenen). */
    private baering: Baering | null = null;
    /** Systemene som er hektet på løkka (systemer.ts), og det som eier E-teksten nå. */
    private systemer: Spillsystem[] = [];
    private systemPrompt: Spillsystem | null = null;
    /** Et system (en filmscene) plasserte kameraet i forrige bilde. */
    private systemKamera = false;
    /** Et system holdt gutten i forrige steg (en aktivitet pågår): da vises ingen «E: …». */
    private systemHolder = false;

    constructor(container: HTMLElement, floatLayer: HTMLElement, onHud: (s: HudState) => void, opts: { shadows: boolean; world?: WorldId; low?: boolean }) {
        this.container = container;
        this.worldId = opts.world ?? 'graboks';
        this.low = !!opts.low;
        this.shadowsAllowed = opts.shadows;
        this.floatLayer = floatLayer;
        this.flytere = new Flytere(floatLayer);
        this.onHud = onHud;
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(1, window.devicePixelRatio || 1));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.renderer.shadowMap.enabled = opts.shadows && !opts.low;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        // Etterbehandlingen tegner to ganger per bilde: tell hele bildet, ikke bare siste tegning.
        this.renderer.info.autoReset = false;
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
        if (this.input.mouseMode && !this.pauset && document.fullscreenElement && !this.input.pointerLocked) {
            this.input.requestPointerLock();
        }
    };

    async start(): Promise<void> {
        const [R, rig] = await Promise.all([loadRapier(), loadRig(RIG_URL)]);
        if (this.disposed) return;
        this.phys = new Physics(R);

        // Lys, tåke og himmel fra døgnet (?lys=kveld|morgen|dag|graatt|natt, stemning.ts og dogn.ts).
        this.lys = new Lyssetting(this.scene, stemningFraUrl(), { bryggen: this.worldId === 'gard' });

        if (this.worldId === 'gard') {
            const { buildBryggen } = await import('../bygg/bryggen');
            this.world = await buildBryggen(this.scene, this.phys, this.renderer, this.lys, { low: this.low });
            if (this.disposed) return;
            this.layout = this.world.layout;
            if (import.meta.env.DEV) devStart(this.layout);
            // Cellene rundt start må stå før første fysikksteg, ellers faller gutten gjennom kaia.
            await this.world.streamer.update(this.layout.playerStart);
            if (this.disposed) return;
            // ?post=0 slår av etterbehandlingen (for å sammenligne og måle).
            if (new URLSearchParams(location.search).get('post') !== '0') this.post = new Etterbehandling(this.lys);
        } else {
            this.layout = buildGraybox(this.scene, this.phys);
        }
        const L = this.layout;

        // I Bryggen har figurene klær (folk.ts). Gråboksen beholder den nakne mannequinen.
        let playerRig = rig;
        let enemyRig = rig;
        let enemyTint = 0x5a4a3c;
        if (this.world) {
            const { DRAKTER } = await import('../bygg/folk');
            playerRig = kleFigur(rig, DRAKTER.junge);
            enemyRig = kleFigur(rig, DRAKTER.tyv);
            enemyTint = 0xffffff;
        }
        this.player = new Character(this.phys, new Animator(playerRig, BOY_TUNING.height), BOY_TUNING, L.playerStart);
        this.player.yaw = L.playerYaw;
        this.player.prevYaw = L.playerYaw;
        this.scene.add(this.player.anim.root);
        this.player.onLand = (impact) => {
            if (impact > 9) this.cam.addShake(Math.min(0.25, impact * 0.015));
            this.lyd?.landet(impact);
        };

        this.enemy = new Character(this.phys, new Animator(enemyRig, ADULT_TUNING.height, enemyTint), ADULT_TUNING, L.enemyStart);
        this.enemy.yaw = Math.PI;
        this.enemy.prevYaw = Math.PI;
        this.scene.add(this.enemy.anim.root);

        this.pc = new PlayerCombat(this.player, 100);
        this.ai = new EnemyAI(this.enemy, 110, enemyTint);

        // Færingen: i Bryggen-scenen med samme råtre-tekstur som byen (bare fargekartet, så den
        // ikke trenger å følge kvalitetsbyttet), i gråboksen grå.
        const boatMat = this.world
            ? new THREE.MeshStandardMaterial({ map: this.world.materials.get('raatre').map, color: 0xb59a80, roughness: 0.8 })
            : new THREE.MeshStandardMaterial({ color: 0x8a8d8f, roughness: 0.9 });
        this.boat = new Faering(this.phys, L.boatStart, L.boatYaw, boatMat);
        this.boat.onBump = (s) => this.cam.addShake(Math.min(0.2, s * 0.06));
        this.boat.onCatch = () => {
            if (this.mode === 'boat') this.cam.addShake(0.015);
            this.lyd?.aaretak();
        };
        this.scene.add(this.boat.group, this.gore.group);
        if (this.world) this.world.faering = this.boat.group;

        if (this.world) {
            const { LydKobling } = await import('../motor/lydkobling');
            if (this.disposed) return;
            this.lyd = new LydKobling(this.world, this.cam.camera, this.player, this.boat);
            this.lyd.lyd.dempet = this.pauset;
            const { FolkStyring } = await import('./folkstyring');
            if (this.disposed) return;
            const gutt = this.player;
            this.folk = new FolkStyring(this.world, this.phys, this.floatLayer, {
                hode: (ut) => (gutt.anim.bein('DEF-head')?.getWorldPosition(ut).setY(ut.y + 0.2) ?? ut.copy(gutt.pos).setY(gutt.pos.y + 1.8)),
                synlig: () => this.mode === 'foot',
            });
            this.folk.onEndring = this.pushHudSoon;
            const oppdrag = this.folk.oppdrag;
            oppdrag.onMelding = (m) => this.meldinger.legg(m);
            this.meldinger.onVis = (m) => this.lyd?.oppdrag(m.type);
            const { Baering } = await import('./baering');
            const { Tyv } = await import('./tyv');
            if (this.disposed) return;
            this.baering = new Baering(this.world, this.player);
            this.baering.onMelding = (m) => this.flash(m, 6);
            this.baering.onVeid = () => oppdrag.hendelse('veid');
            oppdrag.onTing = (t) => this.baering?.visTing(t);
            this.baering.visTing(oppdrag.ting);
            this.tyv = new Tyv(this.enemy, this.ai, this.folk, L.enemyStart);
            this.settLyd(this.lydValg.paa, this.lydValg.volum);
            if (this.lydValg.onsket) void this.lyd.start();
            const { lagSystemer } = await import('./systemer');
            const w = this.world;
            this.systemer = await lagSystemer({
                scene: this.scene, renderer: this.renderer, phys: this.phys, world: w, player: this.player, enemy: this.enemy,
                ai: this.ai, pc: this.pc, boat: this.boat, tyv: this.tyv!, cam: this.cam, folk: this.folk!, baering: this.baering!, lys: this.lys, lyd: this.lyd,
                floatLayer: this.floatLayer, flash: (t, s) => this.flash(t, s), hudSnart: this.pushHudSoon, modus: () => this.mode,
            });
            if (this.disposed) return;
            if (import.meta.env.DEV) devOppdrag(oppdrag);
        }

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

    /** Slår på lyden. Må kalles fra et tastetrykk eller klikk (ellers holder nettleseren den stille). */
    startLyd(): void {
        this.lydValg.onsket = true;
        void this.lyd?.start();
    }

    /** Start på startskjermen: spillet har stått bak den (`pause(true)`), og prologen begynner nå. */
    begynn(): void {
        this.pause(false);
        for (const s of this.systemer) s.vedSpillstart?.();
    }

    /** Pause: simuleringen, døgnet og været står, tastene går til menyen, lyden dempes, bildet tegnes sjelden. */
    pause(p: boolean): void {
        this.pauset = p;
        this.input.aktiv = !p;
        if (this.lyd) this.lyd.lyd.dempet = p;
    }

    settLyd(paa: boolean, volum: number, busser = this.lydValg.busser): void {
        Object.assign(this.lydValg, { paa, volum, busser });
        if (!this.lyd) return;
        this.lyd.lyd.busser = busser;
        this.lyd.lyd.paa = paa;
        this.lyd.lyd.volum = volum;
    }

    get quality(): Quality {
        return this.low ? 'lav' : 'full';
    }

    /** Bytter grafikknivå mens spillet går. Første bytte til full laster detaljkartene. */
    async setQuality(q: Quality, skygger = this.skyggerPaa): Promise<void> {
        const low = q === 'lav';
        this.skyggerPaa = skygger;
        if (low !== this.low) {
            this.low = low;
            this.pushHud();
            if (this.world) {
                await this.world.materials.setLow(low);
                if (this.disposed || this.low !== low) return;
                this.scene.environment = low ? null : this.world.environment;
            }
        } else if (this.renderer.shadowMap.enabled === (this.shadowsAllowed && skygger && !low)) return;
        this.renderer.shadowMap.enabled = this.shadowsAllowed && this.skyggerPaa && !low;
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
        this.world?.dispose();
        this.post?.dispose();
        this.lyd?.dispose();
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
        this.flytere.dispose();
        this.folk?.dispose();
        for (const s of this.systemer) s.dispose?.();
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

    /** En samtale eller en boble midt i bildet: oppdragsmeldingen venter litt (meldingko.ts). */
    private meldingVenter = (): boolean => !!this.folk?.samtale || !!this.folk?.hoder.bobleMidt;
    private filmGaar = (): boolean => this.systemer.some((s) => s.navn === 'film' && s.hud?.() != null);

    private pushHudSoon = () => {
        this.hudTimer = 1;
    };

    private frame = (now: number) => {
        if (this.disposed) return;
        this.raf = requestAnimationFrame(this.frame);
        let dt = (now - this.last) / 1000;
        this.last = now;
        if (document.hidden || dt > 0.25) dt = 0; // fanebytte: ikke ta igjen tapt tid
        if (this.pauset) { dt = 0; if (++this.pauseBilde % 12) return; } // pause: tegn hvert 12. bilde
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
        // Utviklerverktøy (bare i dev): fotokamera, hvor gutten og folkene står (dev.ts).
        this.systemKamera = false;
        for (const s of this.systemer) {
            if (s.kamera?.(this.cam.camera, dt)) {
                this.systemKamera = true;
                break;
            }
        }
        const foto = import.meta.env.DEV ? devVerktoy(this.scene, this.player) : undefined;
        if (foto) {
            this.cam.camera.position.fromArray(foto.pos);
            this.cam.camera.lookAt(foto.look[0], foto.look[1], foto.look[2]);
        }
        this.renderer.info.reset();
        if (this.post && !this.low && this.postPaa) this.post.render(this.renderer, this.scene, this.cam.camera, this.clock, this.inne);
        else this.renderer.render(this.scene, this.cam.camera);

        // Måling: tid mellom bilder (inkluderer GPU-ventetid via rAF).
        if (dt > 0) {
            this.frameTimes.push(dt * 1000);
            this.simTimes.push(simMs);
            if (this.frameTimes.length > 600) {
                this.frameTimes.shift();
                this.simTimes.shift();
            }
        }
        if (this.meldinger.tick(dt, this.meldingVenter, this.filmGaar)) this.pushHudSoon();
        this.hudTimer += dt;
        if (this.hudTimer > (this.baering?.veier || this.systemer.some((s) => s.rask?.()) ? 0.03 : 0.25)) {
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

        if (inp.resetPressed && (!this.tyv || this.tyv.aktiv)) {
            this.resetFight();
            this.tyv?.nyRunde();
        }
        // Et system som bruker inputen selv (filmscene, aktivitet): gutten står stille.
        let holdt = false;
        for (const s of this.systemer) if (s.steg?.(dt, inp)) holdt = true;
        this.systemHolder = holdt;
        if (holdt) {
            dir.set(0, 0);
            inp.jumpPressed = inp.interactPressed = inp.lightPressed = inp.heavyPressed = false;
            inp.dodgePressed = inp.finisherPressed = inp.blockHeld = inp.sprint = false;
        }
        // Samtale eller veiing: gutten står stille, E og mellomrom går videre, 1-3 svarer.
        const veier = !!this.baering?.veier;
        if (veier) this.baering!.styr(dt, inp.move.x, inp.interactPressed || inp.jumpPressed, inp.valg === 2);
        const prat = (this.folk?.laast ?? false) || veier;
        if (prat) {
            if (!veier) this.folk!.input(inp.interactPressed || inp.jumpPressed, inp.valg);
            dir.set(0, 0);
            // Gutten snur seg mot den han snakker med.
            const f = this.folk!.fokus;
            if (f) {
                const want = Math.atan2(f.x - this.player.pos.x, f.z - this.player.pos.z);
                this.player.yaw += Math.atan2(Math.sin(want - this.player.yaw), Math.cos(want - this.player.yaw)) * Math.min(1, dt * 6);
            }
            inp.jumpPressed = inp.interactPressed = inp.lightPressed = inp.heavyPressed = false;
            inp.dodgePressed = inp.finisherPressed = inp.blockHeld = inp.sprint = false;
        }
        // Med en bunt i armene: saktere, og ingen sprint, hopp eller slag.
        if (this.baering?.baerer) {
            dir.multiplyScalar(this.baering.fart);
            inp.sprint = inp.jumpPressed = inp.lightPressed = inp.heavyPressed = inp.dodgePressed = false;
        }

        if (this.mode === 'boat') {
            this.boat.step(dt, { forward: inp.move.y, turn: inp.move.x });
            const seat = new THREE.Vector3(0, 0.22, -0.25)
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.boat.yaw)
                .add(this.boat.pos);
            this.player.step(dt, { dir: new THREE.Vector2(), sprint: false, jump: false });
            this.player.pos.set(seat.x, seat.y - 0.5, seat.z);
            this.player.yaw = this.boat.yaw + Math.PI;
            if (inp.interactPressed && this.prompt && this.systemPrompt) {
                const m = this.systemPrompt.trykk?.();
                if (m) this.flash(m, 6);
                this.promptTimer = 0;
            } else if (inp.interactPressed && this.landCandidate) this.disembark(this.landCandidate);
        } else {
            this.boat.step(dt, null);
            const combatInput = {
                light: inp.lightPressed,
                heavy: inp.heavyPressed,
                block: inp.blockHeld,
                dodge: inp.dodgePressed,
                finisher: inp.finisherPressed,
            };
            this.pc.step(dt, combatInput, dir, !this.tyv || this.tyv.aktiv ? [this.ai] : [], this.sink);
            const canMove = !this.pc.busy;
            this.player.step(dt, {
                dir: canMove ? dir : new THREE.Vector2(),
                sprint: inp.sprint,
                jump: canMove && inp.jumpPressed,
            });
            if (inp.interactPressed && this.prompt?.startsWith('E: Gå om bord')) this.embark();
            else if (inp.interactPressed && this.prompt?.startsWith('E: Snakk')) this.folk?.snakk(this.player.pos);
            else if (inp.interactPressed && this.prompt && this.prompt === this.oppdragPrompt) {
                const m = this.folk?.oppdrag.trykk();
                if (m) this.flash(m, 7);
                this.promptTimer = 0;
            }
            else if (inp.interactPressed && this.prompt && this.systemPrompt) {
                const m = this.systemPrompt.trykk?.();
                if (m) this.flash(m, 6);
                this.promptTimer = 0;
            }
            else if (inp.interactPressed && this.prompt && this.prompt === this.baering?.prompt) {
                const m = this.baering.trykk();
                if (m) this.flash(m, 5);
                this.promptTimer = 0;
            }
            this.checkWater(dt);
        }

        if (!this.tyv || this.tyv.aktiv) {
            const enemyIntent = this.ai.step(dt, this.pc, this.sink);
            this.enemy.step(dt, { dir: enemyIntent, sprint: false, jump: false });
        }
        this.tyv?.update(dt);
        this.phys.step();
        this.gore.update(dt);

        if (this.pc.f.dead && !this.message) this.flash('Du ble slått ned. Trykk R for å prøve igjen.', 99);
    }

    /** Fotokameraet (bare i dev): da strømmes byen, og lyset, støvet og regnet regnes, rundt det. */
    private fotoPos(): THREE.Vector3 | null {
        const foto = import.meta.env.DEV ? (window as { __bryggenFoto?: { pos: number[] } }).__bryggenFoto : undefined;
        return foto ? new THREE.Vector3().fromArray(foto.pos) : null;
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
        // Samtale: kameraet glir rundt til bak gutten, så den han snakker med ses forfra.
        const fokus = this.folk?.fokus;
        if (fokus) {
            // For trangt bak den ene skulderen (vegg)? Prøv den andre.
            this.trang = this.cam.armLength < 1.0 ? this.trang + dt : 0;
            if (this.trang > 0.5) {
                this.samtaleSide = -this.samtaleSide;
                this.trang = -1;
            }
            const want = Math.atan2(fokus.x - this.player.pos.x, fokus.z - this.player.pos.z) + Math.PI + 0.35 * this.samtaleSide;
            this.cam.yaw += Math.atan2(Math.sin(want - this.cam.yaw), Math.cos(want - this.cam.yaw)) * Math.min(1, dt * 2.5);
        }
        this.cam.update(dt, this.input.takeLook(), follow, this.phys);
        for (const s of this.systemer) s.bilde?.(dt, this.cam.camera);

        // Kameraet helt inntil gutten (rygg mot veggen): ton ham ut i stedet for å vise innsiden.
        const arm = this.cam.armLength;
        // Ikke når en filmscene har kameraet: da er fjærarmen ikke det som ser.
        this.player.anim.setOpacity(this.mode === 'boat' || this.systemKamera ? 1 : THREE.MathUtils.clamp((arm - 0.45) / 0.5, 0.15, 1));

        // Strømming: sjekk cellene et par ganger i sekundet, ikke hvert bilde.
        if (this.world) {
            this.streamTimer -= dt;
            if (this.streamTimer <= 0) {
                this.streamTimer = 0.3;
                // Med fotokameraet (dev) strømmes byen rundt kameraet, ikke gutten.
                void this.world.streamer.update(this.fotoPos() ?? follow, follow);
            }
            // Inne i et rom: dagslyset dempes mykt, så ildstedet tar over. Kameraet avgjør, ikke
            // gutten, ellers blir rommet mørkt mens kameraet ennå står ute i gårdsrommet.
            this.clock += dt;
            const inne = this.world.update(this.clock, dt, this.fotoPos() ?? this.cam.camera.position, { pos: this.player.anim.root.position, fart: this.player.speed });
            this.inne += (inne - this.inne) * Math.min(1, dt * 3);
            this.lyd?.update(dt, this.inne, this.mode);
            this.world.post = !!this.post && !this.low && this.postPaa;
            this.world.skygger = this.renderer.shadowMap.enabled;
        }
        // Dagslyset dempes inne, og skyggen følger spilleren.
        this.lys.oppdater(follow, this.inne, this.low, this.scene, this.world?.skygge ?? 0);
        // Øyet venner seg til mørket inne: opptil 60 % mer eksponering (schøtstua er 1, bua 0,55).
        if (this.world) this.renderer.toneMappingExposure = this.lys.s.eksponering * (1 + 0.6 * this.inne);

        this.updatePrompts(dt);
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.flytere.update(dt, this.cam.camera, w, h);
        this.folk?.tegn(dt, this.cam.camera, w, h);
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
        this.systemPrompt = null;
        if (this.baering?.veier || this.systemHolder) {
            this.prompt = null;
            return;
        }
        if (this.mode === 'foot') {
            const d = Math.hypot(this.boat.pos.x - this.player.pos.x, this.boat.pos.z - this.player.pos.z);
            // Med noe i armene som et system eier (kornsekken, buntene i kapittel 3), går han ikke om bord:
            // systemet som ga tingen, sier hva E gjør ved færingen.
            const ombord = d < 3.4 && this.player.grounded && !this.pc.busy && !this.baering?.baererTing;
            this.prompt = ombord ? 'E: Gå om bord i færingen' : null;
            for (const s of this.systemer) {
                if (this.prompt) break;
                const p = s.prompt?.(this.player.pos) ?? null;
                if (p) [this.prompt, this.systemPrompt] = [p, s];
            }
            this.prompt ??= this.baering?.oppdater() ?? null;
            this.oppdragPrompt = this.world && this.folk ? this.folk.oppdrag.prompt(this.player.pos, this.world.streamer.steder()) : null;
            this.prompt ??= this.oppdragPrompt;
            if (this.folk) {
                this.folk.update(0.15, this.player.pos, this.player.yaw, !this.prompt && !this.pc.busy && !this.ai.aggro);
                this.prompt ??= this.folk.prompt;
            }
        } else {
            // I båten spørres systemene først (dra en mann opp av sjøen, kapittel 3), så å gå i land.
            this.prompt = null;
            for (const s of this.systemer) {
                const p = s.baatPrompt?.(this.boat.pos) ?? null;
                if (p) {
                    [this.prompt, this.systemPrompt] = [p, s];
                    break;
                }
            }
            if (!this.prompt) {
                this.landCandidate = finnLanding(this.boat, this.phys);
                this.prompt = this.landCandidate ? 'E: Gå i land' : null;
            }
            this.folk?.update(0.15, this.player.pos, this.player.yaw, false);
        }
    }

    private embark(): void {
        this.folk?.slutt();
        this.baering?.slipp();
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
        damage: (e: DamageEvent) => this.flytere.spawn(e),
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
        telegraph: (on, sving) => {
            this.telegraph = on;
            this.telegraphSving = on && !!sving;
            this.pushHud();
        },
        lyd: (hva, pos, hvem, om) => this.lyd?.kamp(hva, pos, hvem, om),
    };

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
            enemyNavn: this.tyv?.laan?.navn ?? 'Tyven',
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
            samtale: this.folk?.samtale ?? null,
            replikk: this.folk?.replikk ?? null,
            bunter: this.baering?.antall ?? 0,
            bismer: this.baering?.veier?.hud ?? null,
            telegraphSving: this.telegraphSving,
            oppdrag: this.folk?.oppdrag.hud() ?? [],
            oppdragMelding: this.meldinger.naa,
            ting: [...(this.folk?.oppdrag.ting ?? [])],
            system: Object.fromEntries(this.systemer.map((s) => [s.navn, s.hud?.()])),
        });
    }
}

const smooth = (x: number) => x * x * (3 - 2 * x);
