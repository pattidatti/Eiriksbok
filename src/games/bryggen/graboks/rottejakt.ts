// «Rottejakt på lagerloftet» (blueprint §7.2): mens oppdraget er aktivt, kan gutten sette ut tre
// feller med agn på lagerloftet over bua (E). En rotte som rusler innen noen meter fra en fell med
// agn, går rolig bort til agnet, og fella slår (`Rotter.fang`). Katta (katter.ts) tar også rotter;
// de teller med. Rottene som er framme på loftet, gnager på fisken: måleren synker. Går gutten
// rundt, gjemmer rottene seg (rotter.ts), så han må sette fellene og stå stille et stykke unna.
//
// Fellene er små og bare på loftet (tre ting med tre tegnekall hver, bare mens oppdraget pågår).
// Hvordan rottefeller så ut i 1420-årene, vet vi ikke [K]; fella her er en enkel slagfelle [S].
import * as THREE from 'three';
import type { Rotte, RotteHendelse } from '../motor/rotter';
import { SIDE } from '../bygg/sideoppdrag';
import type { SpillKontekst, Spillsystem } from './system';

/** Et punkt inne på lagerloftet over bua i den første gården (bu.ts). */
const LOFT_PUNKT = new THREE.Vector3(-5.5, 3.6, 9.5);
const FELLER = 3;
/** Så nær må en rotte være agnet før den går bort til det. */
const LOKK_R = 4.5;
/** Så nær fella må den være når den slår. */
const SLAG_R = 0.3;
/** Hvor fort én rotte som er framme, gnager på fisken (prosent per sekund). */
const GNAG = 0.35;
const MAAL = 5;
const NED = new THREE.Vector3(0, -1, 0);

export interface RottejaktHud {
    fisk: number;
    fanget: number;
    maal: number;
    /** Feller gutten ikke har satt ut ennå. */
    igjen: number;
    /** Feller som har slått og må settes på nytt. */
    slaatt: number;
    hint: string;
}

interface Felle {
    pos: THREE.Vector3;
    yaw: number;
    klar: boolean;
    group: THREE.Group;
    boyle: THREE.Object3D;
    agn: THREE.Object3D;
    /** Tid siden den slo (animasjonen). */
    slag: number;
}

export function lagRottejakt(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    const rotter = k.world.rotter;
    const feller: Felle[] = [];
    const lokket = new WeakSet<Rotte>();
    let loft: THREE.Box3 | null = null;
    let loftTid = 0;
    let egenFangst = false;
    let naerFelle: Felle | null = null;
    let hint = 'Sett ut fellene med E, gå unna og stå stille.';

    const tre = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.9 });
    const jern = new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 0.6, metalness: 0.4 });
    const fisk = new THREE.MeshStandardMaterial({ color: 0xcdb98a, roughness: 0.8 });
    const gPlanke = new THREE.BoxGeometry(0.16, 0.025, 0.3);
    const gBoyle = new THREE.BoxGeometry(0.15, 0.012, 0.13);
    const gAgn = new THREE.BoxGeometry(0.05, 0.03, 0.09);
    gBoyle.translate(0, 0, 0.065);

    const aktiv = () => oppdrag.status('rotter') === 'aktiv';

    // Katta tar rotter: lytt på rottene i tillegg til lyden (lydkobling.ts setter `onHendelse` først).
    const lyd = rotter.onHendelse;
    rotter.onHendelse = (h: RotteHendelse) => {
        lyd?.(h);
        if (h.type !== 'fanget' || !aktiv() || !loft || egenFangst) return;
        if (!loft.clone().expandByScalar(0.3).containsPoint(h.pos)) return;
        oppdrag.hendelse('rotte');
        k.flash('Katta tok en rotte!', 3);
    };

    function finnLoft(): void {
        loft = null;
        for (const r of k.world.streamer.rom()) if (r.box.containsPoint(LOFT_PUNKT)) loft = r.box;
    }

    function fanget(): number {
        const l = oppdrag.hud().find((o) => o.id === 'rotter')?.linjer[0]?.antall;
        return l ? Number(l.split('/')[0]) : 0;
    }

    function settUt(): string {
        const p = k.player.pos;
        const yaw = k.player.yaw;
        const pos = new THREE.Vector3(p.x + Math.sin(yaw) * 0.75, p.y + 0.6, p.z + Math.cos(yaw) * 0.75);
        const hit = k.phys.rayWorld(pos, NED, 1.4, true);
        if (!hit || hit.normal.y < 0.7 || Math.abs(hit.point.y - (loft?.min.y ?? p.y)) > 0.35) return 'Det er ikke plass til fella der. Snu deg mot golvet.';
        const group = new THREE.Group();
        const planke = new THREE.Mesh(gPlanke, tre);
        planke.position.y = 0.0125;
        const boyle = new THREE.Mesh(gBoyle, jern);
        boyle.position.set(0, 0.03, -0.0);
        const agn = new THREE.Mesh(gAgn, fisk);
        agn.position.set(0, 0.04, 0.06);
        group.add(planke, boyle, agn);
        group.position.copy(hit.point);
        group.rotation.y = yaw;
        k.scene.add(group);
        const f: Felle = { pos: hit.point.clone(), yaw, klar: true, group, boyle, agn, slag: 9 };
        stillBoyle(f);
        feller.push(f);
        const igjen = FELLER - feller.length;
        return igjen > 0 ? `Fella står med agn. ${igjen} igjen.` : 'Alle tre fellene står. Gå unna og stå stille.';
    }

    /** Bøylen ligger bakover når fella er spent, og smeller fram over agnet når den slår. */
    function stillBoyle(f: Felle): void {
        const t = Math.min(1, f.slag / 0.08);
        f.boyle.rotation.x = f.klar ? Math.PI * 0.92 : Math.PI * 0.92 * (1 - t);
        f.agn.visible = f.klar;
    }

    function fjernAlle(): void {
        for (const f of feller) k.scene.remove(f.group);
        feller.length = 0;
    }

    return {
        navn: 'rottejakt',
        prompt(gutt) {
            naerFelle = null;
            if (!aktiv() || !loft || !loft.containsPoint(gutt.clone().setY(gutt.y + 0.5))) return null;
            for (const f of feller) {
                if (!f.klar && Math.hypot(f.pos.x - gutt.x, f.pos.z - gutt.z) < 1.1) {
                    naerFelle = f;
                    return 'E: Spenn fella og legg i nytt agn';
                }
            }
            if (feller.length < FELLER) return `E: Sett ut en felle med agn (${FELLER - feller.length} igjen)`;
            return null;
        },
        trykk() {
            if (naerFelle) {
                naerFelle.klar = true;
                naerFelle.slag = 9;
                stillBoyle(naerFelle);
                naerFelle = null;
                return 'Fella er spent igjen.';
            }
            return settUt();
        },
        bilde(dt) {
            loftTid -= dt;
            if (loftTid <= 0) {
                loftTid = 0.5;
                finnLoft();
                if (!aktiv() && feller.length) fjernAlle();
            }
            if (!aktiv() || !loft) return;
            const iLoft = (p: THREE.Vector3) => p.x > loft!.min.x && p.x < loft!.max.x && p.z > loft!.min.z && p.z < loft!.max.z && Math.abs(p.y - loft!.min.y) < 0.6;
            let framme = 0;
            for (const r of rotter.rotter) {
                if (r.tilstand === 'gjemt') lokket.delete(r);
                if (r.tilstand === 'gjemt' || r.tilstand === 'fanget' || !iLoft(r.pos)) continue;
                if (r.tilstand !== 'flykter' || r.rolig) framme++;
                for (const f of feller) {
                    if (!f.klar) continue;
                    const d = Math.hypot(r.pos.x - f.pos.x, r.pos.z - f.pos.z);
                    if (d < SLAG_R) {
                        // Klakk: fella tar rotta, og smellet skremmer de andre.
                        f.klar = false;
                        f.slag = 0;
                        egenFangst = true;
                        rotter.fang(r);
                        egenFangst = false;
                        rotter.skrem(f.pos, 3);
                        oppdrag.hendelse('rotte');
                        k.flash('Klakk! Fella tok en rotte.', 3);
                        break;
                    }
                    // Agnet lokker: en rotte som rusler i nærheten, går rolig bort til det.
                    if (d < LOKK_R && !lokket.has(r) && (r.tilstand === 'rusler' || r.tilstand === 'snuser')) {
                        lokket.add(r);
                        r.tilstand = 'flykter';
                        r.rolig = true;
                        r.mal = f.pos.clone();
                        r.tid = 0;
                        r.varighet = 14;
                        r.fastTid = 0;
                    }
                }
            }
            for (const f of feller) {
                if (f.slag < 1) {
                    f.slag += dt;
                    stillBoyle(f);
                }
            }
            if (framme > 0) SIDE.fisk = Math.max(0, SIDE.fisk - framme * GNAG * dt);
            const n = fanget();
            hint = feller.length < FELLER
                ? 'Sett ut fellene med E der rottene springer, inntil veggene.'
                : feller.some((f) => !f.klar)
                    ? 'En felle har slått. Gå bort og spenn den igjen med E.'
                    : framme > 0 ? 'Rottene er framme. Stå helt stille.' : 'Gå unna fellene og stå stille. Rottene kommer når det er rolig.';
            if (n >= MAAL) hint = 'Ferdig! Gå ned til Tideke i bua.';
        },
        hud(): RottejaktHud | null {
            if (!aktiv() || !loft || !loft.containsPoint(k.player.pos.clone().setY(k.player.pos.y + 0.5))) return null;
            return {
                fisk: Math.round(SIDE.fisk),
                fanget: fanget(),
                maal: MAAL,
                igjen: FELLER - feller.length,
                slaatt: feller.filter((f) => !f.klar).length,
                hint,
            };
        },
        dispose() {
            fjernAlle();
            rotter.onHendelse = lyd;
            for (const x of [tre, jern, fisk, gPlanke, gBoyle, gAgn]) x.dispose();
        },
    };
}
