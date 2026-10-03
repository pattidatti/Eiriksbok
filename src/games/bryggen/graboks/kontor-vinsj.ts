// «Heis fisken» (kontor-data.ts, oppdrag 5): heise bunter tørrfisk med vinsjen i gavlen, fra kaia opp
// til loftsdøra på lagerloftet.
//
// Sveiv med A og D etter tur: hvert riktig tak løfter bunten. Samme tast to ganger er en glipp: tauet
// slurer og bunten faller et stykke. Sperrehaken holder bunten når du slipper. Bunten svinger i tauet,
// mer jo fortere du sveiver og når vinden tar den; svinger den for langt, smeller den i veggen. Hold S
// for å holde igjen i tauet (da svinger den mindre, men du kan ikke sveive), og W for å slippe litt tau
// (bunten går sakte ned). Ved loftsdøra drar du den inn med E, men bare når den henger nesten stille.
// Sveiver du for høyt, slår den i bjelken.
//
// [U] vinsjer i gavlene i 1420-årene: husene på Bryggen i dag har dem, men er bygget etter 1702
// (blueprint §7.1 «Heise og bære tørrfisk»). Mekanikken og tallene er [S].
import * as THREE from 'three';
import { buntMesh } from '../bygg/folk';
import type { InputFrame } from '../motor/input';
import { KONTOR_STEDER } from './kontor-steder';
import { maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export interface VinsjHud {
    fase: 'klar' | 'heis' | 'inne' | 'slutt';
    /** Høyden til bunten (m over kaia), og loftsdøra. */
    h: number;
    dor: number;
    topp: number;
    /** Vinkelen i tauet (radianer, + mot veggen). */
    vinkel: number;
    /** Hvor mange tak sveiven har gått (sveivhåndtaket tegnes etter det). */
    tak: number;
    bunter: number;
    av: number;
    smell: number;
    /** Vind nå (-1..1) og om et vindkast er på vei. */
    vind: number;
    varsel: boolean;
    holder: boolean;
    slipper: boolean;
    /** Neste tast som er riktig. */
    neste: 'A' | 'D';
    /** Tida (ms) for siste smell, glipp og bunt inne, til animasjonen. */
    smellTid: number;
    glippTid: number;
    inneTid: number;
    tekst: string;
}

const DOR = 6.4;
const TOPP = 8.2;
const BUNN = 0.45;
const LOFT = 0.48;
const AV = 5;
const STILLE = 0.14;
const VEGG = 0.34;

// Vinsjen på vestre forhus (gard.ts/moduler.ts): trinsa under bjelkeenden, 1,15 m ut fra gavlen, og
// luka i gavlloftet ca. 7,7 m over kaia. Panelets meter skaleres til den høyden i 3D.
const TRINSE = new THREE.Vector3(-5.5, 9.45, 3.09);
const LUKE_Y = 7.7;

export function lagVinsj(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: VinsjHud['fase'] | null = null;
    let h = BUNN;
    let vh = 0;
    let th = 0;
    let om = 0;
    let tak = 0;
    let sist: 'A' | 'D' | null = null;
    let sistTid = 0;
    let bunter = 0;
    let smell = 0;
    let vind = 0;
    let vindTid = 4;
    let kast = 0;
    let holder = false;
    let slipper = false;
    let smellTid = 0;
    let glippTid = 0;
    let inneTid = 0;
    let tekst = '';
    let tid = 0;
    let fTid = 0;
    // Bunten og tauet i 3D, så man ser den gå opp gavlen (lages første gang vinsjen brukes).
    let modell: { g: THREE.Group; bunt: THREE.Object3D; tau: THREE.Mesh } | null = null;
    const kamPos = new THREE.Vector3();
    let kamKlar = false;

    function lagModell(): NonNullable<typeof modell> {
        const g = new THREE.Group();
        g.name = 'kontor-vinsj';
        const bunt = buntMesh(k.world.materials);
        const tau = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 5), new THREE.MeshStandardMaterial({ color: 0x9a7b4f, roughness: 0.9 }));
        g.add(bunt, tau);
        k.scene.add(g);
        return { g, bunt, tau };
    }

    /** Bunten i verden: høyden fra panelet skalert til luka, svingen rundt trinsa. */
    function buntPos(ut: THREE.Vector3): THREE.Vector3 {
        const y = 0.35 + ((h - BUNN) / (DOR - BUNN)) * (LUKE_Y - 0.35);
        const L = Math.max(0.6, TRINSE.y - y);
        return ut.set(TRINSE.x, TRINSE.y - Math.cos(th) * L, TRINSE.z + Math.sin(th) * L);
    }

    const trengs = () => oppdrag.status('kontor-vinsj') === 'aktiv' && !maalNaadd(oppdrag, 'kontor-vinsj', 0);
    const lyd = (gruppe: string, styrke: number, fart: number) =>
        k.lyd?.lyd.spill('aare', gruppe, { styrke, fart, pos: KONTOR_STEDER.vinsj });

    function smellet(hva: string): void {
        smell++;
        smellTid = performance.now();
        tekst = hva;
        k.cam.addShake(0.03);
        k.lyd?.lyd.spill('fottrinn', 'tre-ute', { styrke: 1, fart: 0.55, pos: KONTOR_STEDER.vinsj });
        k.lyd?.lyd.spill('kamp', 'blokk', { styrke: 0.35, fart: 0.6, pos: KONTOR_STEDER.vinsj });
    }

    function sveiv(t: 'A' | 'D'): void {
        if (holder) return;
        const raskt = tid - sistTid < 0.16;
        sistTid = tid;
        if (sist === t) {
            // Glipp: tauet slurer før sperrehaken tar.
            vh = -1.8;
            om += (Math.random() < 0.5 ? -1 : 1) * 0.35;
            glippTid = performance.now();
            tekst = 'Glipp! Tauet slurer. A og D etter tur.';
            lyd('knirk', 0.8, 0.7);
            return;
        }
        sist = t;
        tak++;
        vh = Math.max(vh, 0) + 1.9;
        om += (Math.random() - 0.5) * (raskt ? 0.5 : 0.18);
        lyd(tak % 3 === 0 ? 'knirk' : 'tak', 0.35, 1.4 + Math.random() * 0.2);
    }

    return {
        navn: 'kontor-vinsj',
        prompt(gutt) {
            if (fase || !trengs() || !naer(gutt, KONTOR_STEDER.vinsj, 1.6)) return null;
            return 'E: Heis fisk med vinsjen';
        },
        trykk() {
            h = BUNN;
            vh = 0;
            th = 0.05;
            om = 0;
            tak = 0;
            sist = null;
            smell = 0;
            bunter = 0;
            vind = 0;
            vindTid = 4;
            fase = 'klar';
            tekst = 'Sveiv med A og D etter tur. Hold S for å holde igjen i tauet, og W for å slippe litt tau. E ved loftsdøra drar bunten inn, når den henger stille.';
            k.hudSnart();
        },
        steg(dt: number, inp: InputFrame) {
            if (!fase) return false;
            tid += dt;
            fTid += dt;
            if (fase === 'klar') {
                if (inp.jumpPressed || inp.interactPressed) {
                    fase = 'heis';
                    tekst = '';
                    k.hudSnart();
                } else if (inp.dodgePressed) {
                    fase = null;
                    k.hudSnart();
                }
                return true;
            }
            if (fase === 'slutt') {
                if (fTid > 0.8 && (inp.jumpPressed || inp.interactPressed || fTid > 9)) {
                    fase = null;
                    k.hudSnart();
                }
                return true;
            }
            if (fase === 'inne') {
                // En ny bunt hektes på nede på kaia.
                if (fTid > 1.1) {
                    fase = 'heis';
                    h = BUNN;
                    vh = 0;
                    th = (Math.random() - 0.5) * 0.1;
                    om = 0;
                    sist = null;
                    tekst = '';
                }
                k.hudSnart();
                return true;
            }
            holder = inp.move.y < -0.5;
            slipper = inp.move.y > 0.5;
            // Sveiven: A og D (trykket siden forrige steg, i den rekkefølgen de kom).
            const taster = [...inp.trykt.entries()].filter(([kode]) => kode === 'KeyA' || kode === 'KeyD').sort((a, b) => a[1] - b[1]);
            for (const [kode] of taster) sveiv(kode === 'KeyA' ? 'A' : 'D');

            // Høyden: fart fra sveiven som dør ut; sperrehaken holder (bare en glipp får den ned).
            h += vh * dt;
            vh *= Math.exp(-dt * 7);
            // W: sperrehaken løftes litt, og tauet går sakte ut.
            if (slipper) h -= 0.9 * dt;
            if (vh > 0 && vh < 0.05) vh = 0;
            if (h < BUNN) {
                h = BUNN;
                vh = 0;
            }
            if (h > TOPP - 0.6) {
                h = DOR + 0.25;
                vh = 0;
                om += 0.7;
                smellet('Den slo i bjelken! Ikke sveiv så høyt.');
            }

            // Vinden: et kast varsles, kommer og går.
            vindTid -= dt;
            if (vindTid <= 0 && kast <= 0) {
                kast = 1.4;
                vind = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.4);
                k.lyd?.lyd.spill('aare', 'knirk', { styrke: 0.25, fart: 0.5, pos: KONTOR_STEDER.vinsj });
            }
            if (kast > 0) {
                kast -= dt;
                if (kast <= 0) {
                    vind = 0;
                    vindTid = 5 + Math.random() * 4;
                }
            }

            // Pendelen: lengre tau gir saktere sving. S demper mye.
            const L = Math.max(0.8, TOPP - h);
            const demp = holder ? 2.4 : 0.32;
            om += (-(4.2 / L) * Math.sin(th) - demp * om + vind * 0.9) * dt;
            th += om * dt;
            if (th > VEGG && h > 1.2) {
                th = VEGG;
                om = -Math.abs(om) * 0.45;
                smellet('Bunten smalt i veggen. Vent til den roer seg.');
            }
            th = Math.max(-0.7, th);

            const vedDor = Math.abs(h - DOR) < LOFT;
            if (inp.interactPressed) {
                if (!vedDor) tekst = h < DOR ? 'Bunten er ikke oppe ved loftsdøra ennå.' : 'Bunten er for høyt. Hold W og slipp litt tau.';
                else if (Math.abs(th) > STILLE) {
                    om = om * -0.5 + 0.25;
                    smellet('Den svinger for mye! Den slo i dørkarmen.');
                } else {
                    bunter++;
                    inneTid = performance.now();
                    fase = 'inne';
                    fTid = 0;
                    tekst = `Bunt ${bunter} er inne på loftet.`;
                    oppdrag.hendelse('kontor:heist');
                    k.lyd?.lyd.spill('fottrinn', 'tre-inne', { styrke: 1, fart: 0.6, pos: KONTOR_STEDER.vinsj });
                    k.lyd?.lyd.toner([[523.3, 0, 0.2], [659.3, 0.08, 0.35]], 0.07);
                    if (bunter >= AV) {
                        fase = 'slutt';
                        tekst = smell <= 2
                            ? `Fem bunter på loftet, og nesten uten en skramme. Gå til sekretæren i schøtstua.`
                            : `Fem bunter på loftet, men fisken har fått ${smell} smell. Gå til sekretæren i schøtstua.`;
                    }
                }
            }
            return true;
        },
        bilde() {
            if (!fase || fase === 'slutt') {
                if (modell) modell.g.visible = false;
                return;
            }
            modell ??= lagModell();
            modell.g.visible = fase !== 'inne';
            const p = buntPos(new THREE.Vector3());
            modell.bunt.position.copy(p).setY(p.y - 0.15);
            modell.bunt.rotation.set(th, 0.2, 0);
            const L = TRINSE.distanceTo(p);
            modell.tau.position.copy(TRINSE).add(p).multiplyScalar(0.5);
            modell.tau.scale.set(1, L, 1);
            modell.tau.rotation.set(th, 0, 0);
        },
        kamera(kamera, dt) {
            if (!fase || fase === 'slutt') {
                kamKlar = false;
                return false;
            }
            // Fra kaikanten, opp langs gavlen mot bunten.
            const p = buntPos(new THREE.Vector3());
            const mal = new THREE.Vector3(-2.4, 1.5 + p.y * 0.12, -1.6);
            if (!kamKlar) {
                kamPos.copy(kamera.position);
                kamKlar = true;
            }
            kamPos.lerp(mal, 1 - Math.exp(-dt * 3));
            kamera.position.copy(kamPos);
            kamera.lookAt(TRINSE.x, 1.6 + p.y * 0.62, TRINSE.z + 0.8);
            kamera.updateMatrixWorld();
            return true;
        },
        rask: () => fase !== null,
        hud(): VinsjHud | null {
            if (!fase) return null;
            return {
                fase, h, dor: DOR, topp: TOPP, vinkel: th, tak, bunter, av: AV, smell, vind,
                varsel: kast <= 0 && vindTid < 0.9, holder, slipper, neste: sist === 'A' ? 'D' : 'A',
                smellTid, glippTid, inneTid, tekst,
            };
        },
        dispose() {
            fase = null;
            if (modell) {
                k.scene.remove(modell.g);
                modell.tau.geometry.dispose();
                (modell.tau.material as THREE.Material).dispose();
            }
        },
    };
}
