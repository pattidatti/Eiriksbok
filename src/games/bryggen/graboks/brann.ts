// «Brann i lagerhuset» (byen-oppdrag.ts, blueprint §7.2 «Brannvakt og bøttekjede»).
//
// Gutten går brannvakt langs veien til Holmen. Når han kommer nær lagerhusene, ryker det fra det
// midterste. E: rop «Brann!». Folk kommer løpende og stiller seg i en kjede fra kaikanten opp til
// huset. Gutten står først, nærmest ilden: bøttene går fra hånd til hånd, og når bøtta er i hendene
// hans, kaster han (mellomrom eller E). For tidlig skvulper vannet ut, for sent mister han den.
// Gnister lander på nabohuset og på kjerra: Q går ut av kjeden, E slår gnisten ut med en våt sekk,
// og E ved plassen hans stiller ham inn igjen. Får gnisten brenne for lenge, vokser ilden.
//
// [V] Bergen brant mange ganger (Bergen byleksikon «Branner»), og bylova 1276 krevde brannvakt og
// vektere (Bergen byleksikon «Byloven av 1276»). [K] Hvordan man slokket i 1420-årene: bøttekjeden,
// den våte sekken og hvem som kom, er laget for spillet [S].
import * as THREE from 'three';
import { botteMesh, lagFigur, type FigurNavn } from '../bygg/folk';
import { HOLMEN, holmenVerden } from '../bygg/holmenvei';
import type { Animator } from '../motor/animator';
import { FigurLod } from '../motor/figurlod';
import { Ild } from '../motor/ild';
import type { InputFrame } from '../motor/input';
import type { Hode } from './hoder';
import { maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

/** Lagerhuset som brenner (det midterste ved veien, bergenhus.ts), i veiens rom: gavlen mot veien. */
const HUS = { u: 12.4, z: 31.5 };
/** Flammene på gavlen: [du, høyde]. */
const FLAMMER: [number, number][] = [[-1.6, 0.6], [0.9, 0.9], [-0.3, 2.2], [1.7, 2.9], [-1.2, 3.6]];
/** Kjeden: fra kaikanten og opp mot huset. Gutten står ytterst, nærmest ilden. */
const KJEDE: [number, number][] = [[9.4, 1.4], [9.4, 6.0], [9.4, 10.6], [9.2, 15.4], [9.2, 20.4], [10.0, 25.0]];
const GUTT = { u: 11.0, z: 29.4 };
const FOLK: FigurNavn[] = ['fisker', 'vakt', 'borger', 'svenn', 'vakt', 'bodker'];
const NAVN = ['Fiskeren', 'Ulf', 'Borgeren', 'Svennen', 'Kolbein', 'Bødkeren'];
/** Gnistene: nabohusenes gavler og sekkene på kjerra. */
const GNISTER: [number, number, number][] = [[5.0, 0.4, 30.7], [19.4, 0.4, 30.7], [12.4, 1.75, 14.8]];
const START_STYRKE = 0.5;
const VOKS = 0.012;
const BOTTE_FART = 1.9;
const VINDU = { tidlig: 0.32, sent: 0.16, perfekt: 0.12 };
const GNIST_TID = 12;

type Fase = 'av' | 'ryker' | 'varslet' | 'kjede' | 'ute' | 'slokket' | 'tapt';

export interface BrannHud {
    fase: Fase;
    styrke: number;
    /** Bøttene i kjeden: 0 ved kaia, `ledd` hos gutten. */
    botter: number[];
    ledd: number;
    tekst: string;
    /** Tilbakemelding på siste kast, med teller så den kan animeres. */
    svar: { tekst: string; god: boolean; n: number } | null;
    gnist: number;
    kast: number;
    iKjeden: boolean;
}

interface Person {
    a: Animator;
    lod: FigurLod;
    pos: THREE.Vector3;
    mal: THREE.Vector3;
    yaw: number;
    speed: number;
    hode: Hode;
    navn: string;
    handTil: number;
}

export function lagBrann(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: Fase = 'av';
    let styrke = START_STYRKE;
    let t = 0;
    let fTid = 0;
    let neste = 0;
    const botter: number[] = [];
    const botteMesher: THREE.Object3D[] = [];
    let svar: BrannHud['svar'] = null;
    let svarN = 0;
    let kast = 0;
    let gnist: { i: number; tid: number; ild: Ild } | null = null;
    let nesteGnist = 9;
    let promptHva: 'rop' | 'still' | 'gnist' | null = null;
    let laster = false;
    let kastAnim = 0;
    const folk: Person[] = [];
    const ilder: Ild[] = [];
    const gruppe = new THREE.Group();
    gruppe.name = 'brann';
    k.scene.add(gruppe);
    const ledd = KJEDE.length;
    const V = (u: number, y: number, z: number) => holmenVerden(u, y, z);

    function lagIld(): void {
        for (const [du, y] of FLAMMER) {
            const ild = new Ild({ smokeTop: 9, spread: 1.0 });
            ild.group.position.copy(V(HUS.u + du, y, HUS.z - 0.25));
            // Glørne er en flat flekk under bålet: på en vegg ville den sveve som en skive.
            ild.group.children[0].visible = false;
            gruppe.add(ild.group);
            ilder.push(ild);
        }
    }

    function fjernIld(): void {
        for (const i of ilder) {
            gruppe.remove(i.group);
            i.dispose();
        }
        ilder.length = 0;
    }

    async function lagFolk(): Promise<void> {
        laster = true;
        for (let i = 0; i < ledd; i++) {
            const a = await lagFigur(FOLK[i]);
            a.setGait(1.2, 3.0, 5.0);
            const [u, z] = KJEDE[i];
            // De kommer løpende: halvparten fra kaia, halvparten fra porten.
            const fra = i < 3 ? V(-6 + i * 2, 0, 2.5) : V(22, 0, 12 + i);
            const p: Person = {
                a, lod: new FigurLod(a.model), pos: fra.clone(), mal: V(u, 0, z), yaw: 0, speed: 0, navn: NAVN[i], handTil: 0,
                hode: { hode: (ut) => ut.copy(a.root.position).setY(a.root.position.y + 1.95), synlig: () => a.root.visible },
            };
            a.root.position.copy(p.pos);
            gruppe.add(a.root);
            folk.push(p);
            k.folk.ekstra.push({ h: p.hode, info: () => (fase !== 'av' && a.root.visible ? { navn: p.navn, tittel: 'i bøttekjeden', merke: null, giver: false } : null) });
        }
        laster = false;
    }

    function ryddFolk(): void {
        for (const p of folk) {
            p.a.mixer.stopAllAction();
            gruppe.remove(p.a.root);
        }
        folk.length = 0;
    }

    function nyFase(f: Fase): void {
        fase = f;
        fTid = 0;
        HOLMEN.brann = f === 'varslet' || f === 'kjede' || f === 'ute';
        k.hudSnart();
    }

    function bjelle(): void {
        k.lyd?.lyd.toner([[880, 0, 0.35], [698.5, 0.18, 0.35], [880, 0.36, 0.35], [698.5, 0.54, 0.5]], 0.14);
    }

    function svarMed(tekst: string, god: boolean): void {
        svar = { tekst, god, n: ++svarN };
        k.hudSnart();
    }

    /** Gutten kaster bøtta som er i hendene hans (eller prøver). */
    function kastBotte(): void {
        let best = -1;
        let bestD = 99;
        botter.forEach((s, i) => {
            const d = s - ledd;
            if (d > -0.9 && d < VINDU.sent && Math.abs(d) < Math.abs(bestD)) {
                best = i;
                bestD = d;
            }
        });
        kastAnim = 0.5;
        k.player.anim.play('Interact', { fade: 0.08, timeScale: 2.0 });
        if (best < 0) {
            svarMed('Ingen bøtte ennå. Vent til den er i hendene dine.', false);
            return;
        }
        fjernBotte(best);
        const ild = V(HUS.u, 1.8, HUS.z);
        k.lyd?.lyd.spill('aare', 'tak', { pos: ild, styrke: 1, fart: 0.7 });
        if (bestD < -VINDU.tidlig) {
            styrke -= 0.015;
            svarMed('For tidlig! Vannet skvulper ut på bakken.', false);
            return;
        }
        kast++;
        const perfekt = Math.abs(bestD) < VINDU.perfekt;
        styrke -= perfekt ? 0.075 : 0.05;
        k.cam.addShake(perfekt ? 0.03 : 0.015);
        k.lyd?.lyd.spill('aare', 'tak', { pos: ild, styrke: 0.8, fart: 0.55, om: 0.08 });
        svarMed(perfekt ? 'Midt i flammene!' : 'Truffet!', true);
    }

    function fjernBotte(i: number): void {
        botter.splice(i, 1);
        const m = botteMesher.splice(i, 1)[0];
        gruppe.remove(m);
    }

    function nyBotte(): void {
        botter.push(0);
        const m = botteMesh(k.world.materials);
        gruppe.add(m);
        botteMesher.push(m);
    }

    /** Hvor bøtta er: mellom hendene til to i kjeden, i en liten bue. */
    const _p = new THREE.Vector3();
    function botteSted(s: number, ut: THREE.Vector3): THREE.Vector3 {
        const i = Math.min(ledd - 1, Math.floor(s));
        const f = s - i;
        const a = folk[i]?.pos ?? V(KJEDE[i][0], 0, KJEDE[i][1]);
        const b = i + 1 < ledd ? folk[i + 1]?.pos ?? V(KJEDE[i + 1][0], 0, KJEDE[i + 1][1]) : k.player.pos;
        ut.copy(a).lerp(b, f);
        ut.y = THREE.MathUtils.lerp(a.y, b.y, f) + 0.85 + Math.sin(Math.PI * f) * 0.3;
        return ut;
    }

    function gnistSted(i: number): THREE.Vector3 {
        const [u, y, z] = GNISTER[i];
        return V(u, y, z);
    }

    function nyGnist(): void {
        const i = Math.floor(Math.random() * GNISTER.length);
        const ild = new Ild({ smokeTop: 3, spread: 0.35 });
        ild.group.position.copy(gnistSted(i));
        gruppe.add(ild.group);
        gnist = { i, tid: 0, ild };
        k.flash(i === 2 ? 'Gnister i kornsekkene på kjerra! Q: gå ut av kjeden, og slå den ut (E).' : 'En gnist på nabohuset! Q: gå ut av kjeden, og slå den ut (E).', 4);
        bjelle();
        k.hudSnart();
    }

    function slukkGnist(): void {
        if (!gnist) return;
        gruppe.remove(gnist.ild.group);
        gnist.ild.dispose();
        gnist = null;
        nesteGnist = 13 + Math.random() * 4;
    }

    function slutt(tapt: boolean): void {
        if (tapt) oppdrag.settFlagg('brann-tapt');
        oppdrag.hendelse('brann:slokket');
        slukkGnist();
        for (let i = botter.length - 1; i >= 0; i--) fjernBotte(i);
        nyFase(tapt ? 'tapt' : 'slokket');
        if (!tapt) {
            fjernIld();
            k.flash('Ilden er slokket! Gå til gjaldkeren Sjur på Bergenhus og fortell det.', 6);
            k.lyd?.lyd.toner([[523.3, 0, 0.4], [659.3, 0.12, 0.4], [784, 0.24, 0.8]], 0.12);
            if (folk[3]) k.folk.hoder.si(folk[3].hode, 'Den er nede! Godt gjort, gutt!', 3.5);
            if (folk[1]) k.folk.hoder.si(folk[1].hode, 'Gå og si det til Sjur.', 3.5);
        } else {
            k.flash('Lagerhuset står i full fyr. Dere holder ilden borte fra nabohusene til det brenner ned. Gå til gjaldkeren Sjur.', 7);
        }
    }

    /** Folkene løper til plassen sin, så snur de seg langs kjeden (i spillets steg). */
    function flyttFolk(dt: number): void {
        folk.forEach((p, i) => {
            const d = Math.hypot(p.mal.x - p.pos.x, p.mal.z - p.pos.z);
            if (d > 0.15) {
                const v = Math.atan2(p.mal.x - p.pos.x, p.mal.z - p.pos.z);
                p.yaw = v;
                p.speed = Math.min(3.2, d * 2 + 0.4);
                p.pos.x += Math.sin(v) * p.speed * dt;
                p.pos.z += Math.cos(v) * p.speed * dt;
            } else {
                p.speed = 0;
                const nesteP = i + 1 < ledd ? folk[i + 1]?.pos ?? k.player.pos : k.player.pos;
                const want = Math.atan2(nesteP.x - p.pos.x, nesteP.z - p.pos.z) - 0.8;
                p.yaw += Math.atan2(Math.sin(want - p.yaw), Math.cos(want - p.yaw)) * Math.min(1, dt * 5);
            }
        });
    }

    return {
        navn: 'brann',
        prompt(gutt) {
            promptHva = null;
            if (fase === 'ryker' && naer(gutt, V(HUS.u, 0, HUS.z), 16, 2)) {
                promptHva = 'rop';
                return 'E: Rop «Brann!»';
            }
            if ((fase === 'varslet' || fase === 'ute') && naer(gutt, V(GUTT.u, 0, GUTT.z), 1.8)) {
                if (fase === 'varslet' && fTid < 2) return null;
                promptHva = 'still';
                return 'E: Still deg først i bøttekjeden';
            }
            if (fase === 'ute' && gnist && naer(gutt, gnistSted(gnist.i), 2.0, 2.2)) {
                promptHva = 'gnist';
                return 'E: Slå ut gnisten med den våte sekken';
            }
            return null;
        },
        trykk() {
            const hva = promptHva;
            promptHva = null;
            if (hva === 'rop') {
                oppdrag.hendelse('brann:varslet');
                k.folk.hoder.si(k.folk.ekstra[0].h, 'BRANN! Brann i lagerhuset!', 3);
                bjelle();
                if (!folk.length && !laster) void lagFolk();
                nyFase('varslet');
                return 'Du roper så høyt du kan. Folk kommer løpende fra kaia og porten med bøtter.';
            }
            if (hva === 'still') {
                k.player.teleport(V(GUTT.u, 0, GUTT.z), 0.25);
                if (fase === 'varslet') neste = 0.6;
                nyFase('kjede');
                return null;
            }
            if (hva === 'gnist') {
                slukkGnist();
                k.lyd?.lyd.spill('kamp', 'slag-tung', { pos: k.player.pos, styrke: 0.6 });
                k.player.anim.play('Interact', { fade: 0.08, timeScale: 1.6 });
                return 'Du slår gnisten ut med en våt sekk. Tilbake til kjeden (E ved plassen din)!';
            }
            return null;
        },
        steg(dt: number, inp: InputFrame) {
            t += dt;
            fTid += dt;
            // Brannen begynner når gutten er nær lagerhusene og går brannvakt.
            if (fase === 'av') {
                if (HOLMEN.xe && oppdrag.status('brann') === 'aktiv' && !maalNaadd(oppdrag, 'brann', 1) && naer(k.player.pos, V(HUS.u, 0, HUS.z), 26, 3)) {
                    styrke = START_STYRKE * 0.75;
                    lagIld();
                    nyFase('ryker');
                    k.flash('Røyk! Det brenner i lagerhuset ved veien!', 4);
                    k.cam.addShake(0.02);
                }
                return false;
            }
            if (fase === 'ryker' || fase === 'varslet' || fase === 'kjede' || fase === 'ute') styrke += VOKS * dt * (fase === 'ryker' ? 0.6 : 1);
            if (gnist) {
                gnist.tid += dt;
                if (gnist.tid > GNIST_TID) {
                    slukkGnist();
                    styrke += 0.22;
                    k.flash('Gnisten ble til flammer! Ilden vokser.', 3.5);
                    k.cam.addShake(0.04);
                }
            }
            if (fase === 'kjede' || fase === 'ute') {
                neste -= dt;
                if (neste <= 0) {
                    nyBotte();
                    neste = Math.max(1.35, 2.3 - kast * 0.05);
                }
                for (let i = botter.length - 1; i >= 0; i--) {
                    const var_ = botter[i];
                    botter[i] += BOTTE_FART * dt;
                    // Den som får bøtta, rekker ut armene.
                    const ny = Math.floor(botter[i]);
                    if (ny !== Math.floor(var_) && ny < ledd && folk[ny]) {
                        folk[ny].a.play('Interact', { fade: 0.12, timeScale: 1.8 });
                        folk[ny].handTil = 0.55;
                    }
                    if (botter[i] > ledd + VINDU.sent) {
                        fjernBotte(i);
                        svarMed(fase === 'ute' ? 'Ingen står først i kjeden! Bøtta blir satt fra seg.' : 'For sent! Bøtta glapp.', false);
                        k.lyd?.lyd.spill('aare', 'knirk', { pos: k.player.pos, styrke: 0.5 });
                    }
                }
                nesteGnist -= dt;
                if (!gnist && nesteGnist <= 0) nyGnist();
            }
            if ((fase === 'kjede' || fase === 'ute' || fase === 'varslet' || fase === 'ryker') && styrke <= 0) slutt(false);
            else if ((fase === 'kjede' || fase === 'ute') && styrke >= 1) slutt(true);
            if (fase === 'tapt' && fTid > 25) fjernIld();
            if ((fase === 'slokket' || fase === 'tapt') && fTid > 9 && folk.length) ryddFolk();
            if ((fase === 'slokket' || fase === 'tapt') && oppdrag.status('brann') === 'levert') nyFase('av');
            styrke = THREE.MathUtils.clamp(styrke, -0.01, 1);
            flyttFolk(dt);

            if (fase === 'kjede') {
                if (inp.jumpPressed || inp.interactPressed) kastBotte();
                if (inp.dodgePressed) {
                    nyFase('ute');
                    k.flash('Du går ut av kjeden. E ved plassen din for å stille deg inn igjen.', 3);
                }
                return true;
            }
            return false;
        },
        bilde(dt: number, kamera: THREE.PerspectiveCamera) {
            const s = Math.max(0, styrke);
            ilder.forEach((ild, i) => {
                const lokal = fase === 'ryker' ? (i < 2 ? 1 : 0) : i < 2 + Math.ceil(s * 3) ? 1 : 0;
                ild.group.visible = lokal > 0 && (fase !== 'tapt' || fTid < 25);
                ild.group.scale.setScalar(1.4 + s * 2.4 + (fase === 'tapt' ? 1.2 : 0));
                if (ild.group.visible) ild.update(t, dt);
            });
            if (gnist) {
                gnist.ild.group.scale.setScalar(0.7 + gnist.tid * 0.12);
                gnist.ild.update(t, dt);
            }
            if (kastAnim > 0) {
                kastAnim -= dt;
                if (kastAnim <= 0) k.player.anim.release(0.2);
            }
            folk.forEach((p) => {
                if (p.handTil > 0) {
                    p.handTil -= dt;
                    if (p.handTil <= 0) p.a.release(0.25);
                }
                p.a.root.position.copy(p.pos);
                p.a.root.rotation.y = p.yaw;
                const avst = p.pos.distanceTo(kamera.position);
                p.a.root.visible = avst < 60;
                if (p.a.root.visible) {
                    p.lod.sett(avst);
                    p.a.update(dt, p.speed);
                }
            });
            botter.forEach((sv, i) => {
                botteSted(sv, _p);
                botteMesher[i].position.copy(_p);
            });
        },
        rask: () => fase === 'kjede' || fase === 'ute' || fase === 'varslet',
        hud(): BrannHud | null {
            if (fase === 'av' || (fase !== 'ryker' && fase !== 'varslet' && fase !== 'kjede' && fase !== 'ute' && fTid > 6)) return null;
            if (fase === 'ryker' && !naer(k.player.pos, V(HUS.u, 0, HUS.z), 30, 3)) return null;
            const tekst = fase === 'ryker'
                ? 'Det ryker fra lagerhuset! Gå nær og rop «Brann!» (E).'
                : fase === 'varslet'
                    ? 'Folk kommer med bøtter. Gå til plassen ytterst i kjeden, nærmest ilden (E).'
                    : fase === 'ute'
                        ? gnist ? 'Løp til gnisten og slå den ut (E). Så tilbake til plassen din (E).' : 'Tilbake til plassen din ytterst i kjeden (E)!'
                        : fase === 'kjede'
                            ? gnist ? 'Gnist! Q: gå ut av kjeden og slå den ut.' : 'Mellomrom eller E: kast når bøtta er i hendene dine.'
                            : fase === 'slokket' ? 'Ilden er slokket!' : 'Lagerhuset er tapt, men ilden spredte seg ikke.';
            return { fase, styrke: Math.max(0, styrke), botter: [...botter], ledd, tekst, svar, gnist: gnist ? gnist.tid / GNIST_TID : 0, kast, iKjeden: fase === 'kjede' };
        },
        dispose() {
            fjernIld();
            slukkGnist();
            ryddFolk();
            k.scene.remove(gruppe);
            HOLMEN.brann = false;
        },
    };
}
