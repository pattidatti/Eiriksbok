// «Messe i Mariakirken» (blueprint §7.2): bær lyset og svar presten på latin.
//
// Del 1, lyset: ved sidealteret tar gutten lyset (E). Med lyset i hånda går han saktere, og flammen
// blafrer: løper han (Shift) eller hopper, slukner den, og han må tilbake og tenne det igjen. Ved
// høyalteret settes lyset (E): hendelsen `messe:lys`.
// Del 2, svarene: ved presten (E) begynner messen. Presten sier en linje på latin, klokkeren hvisker
// hva den betyr, og gutten velger svaret (1-3). Én gang løfter presten brødet, og da skal gutten
// ringe med bjella (mellomrom), ikke før og ikke etter. Hele messen uten bom: `messe:svar`.
//
// [V] Messen var på latin, og svarene under er gamle: «Et cum spiritu tuo» (Wikipedia «Dominus
// vobiscum»), «Habemus ad Dominum» og «Dignum et iustum est» (Wikipedia «Sursum corda»), «Kyrie
// eleison» (Wikipedia «Kyrie»), «Deo gratias» (Wikipedia «Ite, missa est»). [V] Fra rundt 1200 løftet
// presten brødet høyt så alle kunne se det, og det ble vanlig å ringe med en liten bjelle da
// (Wikipedia «Elevation (liturgy)», «Sanctus bell»). [K] Hvilke deler av messen en gutt svarte på i
// Mariakirken i 1420-årene, vet vi ikke. Utvalget, rekkefølgen her og flammen er [S].
import * as THREE from 'three';
import type { InputFrame } from '../motor/input';
import type { Snakkbar, Sted } from '../motor/streaming';
import { finnPerson, maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

interface Ledd {
    prest: string;
    betyr: string;
    svar: string;
    svarBetyr: string;
}

/** `null` er bjella: presten løfter brødet. */
const LEDD: (Ledd | null)[] = [
    { prest: 'Kyrie eleison.', betyr: 'Herre, miskunn deg.', svar: 'Kyrie eleison.', svarBetyr: 'Herre, miskunn deg.' },
    { prest: 'Dominus vobiscum.', betyr: 'Herren være med dere.', svar: 'Et cum spiritu tuo.', svarBetyr: 'Og med din ånd.' },
    { prest: 'Sursum corda.', betyr: 'Løft hjertene opp.', svar: 'Habemus ad Dominum.', svarBetyr: 'Vi løfter dem til Herren.' },
    { prest: 'Gratias agamus Domino Deo nostro.', betyr: 'La oss takke Herren vår Gud.', svar: 'Dignum et iustum est.', svarBetyr: 'Det er rett og riktig.' },
    null,
    { prest: 'Ite, missa est.', betyr: 'Gå, messen er slutt.', svar: 'Deo gratias.', svarBetyr: 'Gud være takk.' },
];
const SVAR = LEDD.filter((l): l is Ledd => !!l).map((l) => l.svar);
const SVARTID = 12;

export type MesseFase = 'klar' | 'prest' | 'svar' | 'riktig' | 'feil' | 'vent' | 'loft' | 'ferdig' | 'igjen';

export interface MesseHud {
    /** Gutten bærer lyset: hvor sterk flammen er (0-1). Ellers null. */
    flamme: number | null;
    fase: MesseFase | null;
    nr: number;
    antall: number;
    prest: string;
    hvisk: string;
    valg: string[];
    riktig: number;
    valgt: number | null;
    /** Tid igjen til å svare eller ringe (0-1). */
    tid: number;
    bom: number;
    tekst: string;
}

function stokk<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function lagMesse(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    const tune = k.player.tune as { runSpeed: number };
    const fart = tune.runSpeed;
    let baerer = false;
    let flamme = 1;
    let naerSted: 'ta' | 'sett' | 'prest' | null = null;
    let fase: MesseFase | null = null;
    let fTid = 0;
    let frist = 0;
    let nr = 0;
    let bom = 0;
    let valg: string[] = [];
    let riktig = 0;
    let valgt: number | null = null;
    let tekst = '';
    let prest: Snakkbar | null = null;
    let sjekk = 0;
    let paaAlter = false;

    // Lyset: en stake av messing, et voks-lys og flammen, som lyser selv (ingen lyskilde, README).
    const lys = new THREE.Group();
    const messing = new THREE.MeshStandardMaterial({ color: 0x9a7a3a, roughness: 0.4, metalness: 0.7 });
    const voks = new THREE.MeshStandardMaterial({ color: 0xf1e7cf, roughness: 0.7 });
    const flammeMat = new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false });
    const gloedMat = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const geo = [
        new THREE.CylinderGeometry(0.06, 0.07, 0.025, 12),
        new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8),
        new THREE.CylinderGeometry(0.022, 0.022, 0.2, 10),
        new THREE.ConeGeometry(0.02, 0.075, 8),
        new THREE.SphereGeometry(0.08, 10, 8),
    ];
    const fot = new THREE.Mesh(geo[0], messing);
    const stett = new THREE.Mesh(geo[1], messing);
    stett.position.y = 0.07;
    const voksLys = new THREE.Mesh(geo[2], voks);
    voksLys.position.y = 0.23;
    const ild = new THREE.Mesh(geo[3], flammeMat);
    ild.position.y = 0.36;
    const gloed = new THREE.Mesh(geo[4], gloedMat);
    gloed.position.y = 0.36;
    lys.add(fot, stett, voksLys, ild, gloed);
    lys.visible = false;
    k.scene.add(lys);

    const status = () => oppdrag.status('messe');
    const lysTrengs = () => status() === 'aktiv' && !maalNaadd(oppdrag, 'messe', 0);
    const svarTrengs = () => status() === 'aktiv' && maalNaadd(oppdrag, 'messe', 0) && !maalNaadd(oppdrag, 'messe', 1);
    const sted = (id: string): Sted | null => {
        for (const s of k.world.streamer.steder()) if (s.id === id) return s;
        return null;
    };
    const ledd = () => LEDD[nr];

    function slukk(melding: string | null): void {
        baerer = false;
        tune.runSpeed = fart;
        if (!paaAlter) lys.visible = false;
        if (melding) {
            k.flash(melding, 5);
            k.lyd?.lyd.toner([[196, 0, 0.4]], 0.12);
        }
        k.hudSnart();
    }

    function settPaaAlter(): boolean {
        const topp = sted('hoyalter-topp');
        if (!topp) return false;
        lys.position.copy(topp.pos);
        lys.rotation.set(0, 0, 0);
        lys.visible = true;
        paaAlter = true;
        return true;
    }

    function tilFase(f: MesseFase): void {
        fase = f;
        fTid = 0;
        const l = ledd();
        if (f === 'prest' && l && prest) {
            prest.gest('snakk');
            k.world.si?.('Herr Johannes', l.prest, prest.pos);
        } else if (f === 'svar' && l) {
            valg = stokk([l.svar, ...stokk(SVAR.filter((s) => s !== l.svar)).slice(0, 2)]);
            riktig = valg.indexOf(l.svar);
            valgt = null;
            frist = SVARTID;
        } else if (f === 'vent') {
            frist = 1.6 + Math.random() * 1.8;
            prest?.gest('bukk', frist);
        } else if (f === 'loft') {
            frist = 1.5;
            prest?.gest('vinke', 1.5);
            k.lyd?.lyd.toner([[392, 0, 0.6]], 0.06);
        }
    }

    function neste(): void {
        nr++;
        if (nr < LEDD.length) {
            tilFase(LEDD[nr] ? 'prest' : 'vent');
            return;
        }
        if (bom === 0) {
            tilFase('ferdig');
            tekst = 'Du svarte i hele messen uten å bomme. Herr Johannes nikker til deg.';
            prest?.gest('nikk');
            if (prest) k.world.si?.('Herr Johannes', 'Deo gratias. Godt svart, gutt. Kom til meg etterpå.', prest.pos);
            k.lyd?.lyd.toner([[523.3, 0, 0.8], [659.3, 0.15, 0.8], [784, 0.3, 1.2]], 0.12);
            oppdrag.hendelse('messe:svar');
        } else {
            tilFase('igjen');
            tekst = `Du bommet ${bom} ${bom === 1 ? 'gang' : 'ganger'}. Herr Johannes vil ha en messe uten feil. Bertolt hvisker: «Nå kan du svarene. Én gang til.»`;
            prest?.gest('riste');
        }
    }

    function svar(rett: boolean, hva: string): void {
        if (rett) {
            tilFase('riktig');
            tekst = hva;
            k.lyd?.lyd.toner([[784, 0, 0.35], [1046.5, 0.08, 0.5]], 0.1);
        } else {
            bom++;
            tilFase('feil');
            tekst = hva;
            k.lyd?.lyd.toner([[147, 0, 0.35]], 0.16);
            k.cam.addShake(0.015);
        }
    }

    function begynnMesse(): void {
        nr = 0;
        bom = 0;
        tilFase('prest');
    }

    return {
        navn: 'messe',
        maal() {
            const s = !fase && lysTrengs() ? sted(baerer ? 'hoyalter' : 'sidealter') : null;
            return s ? [{ pos: s.pos, r: s.r ?? 1.5 }] : [];
        },
        prompt(gutt) {
            naerSted = null;
            if (fase) return null;
            if (lysTrengs()) {
                const s = sted(baerer ? 'hoyalter' : 'sidealter');
                if (s && naer(gutt, s.pos, s.r ?? 1.5)) {
                    naerSted = baerer ? 'sett' : 'ta';
                    return baerer ? 'E: Sett lyset på høyalteret' : 'E: Ta lyset fra sidealteret';
                }
                return null;
            }
            if (svarTrengs()) {
                prest = finnPerson(k.world, 'presten');
                if (prest && naer(gutt, prest.pos, 2.4)) {
                    naerSted = 'prest';
                    return 'E: Still deg ved presten og begynn messen';
                }
            }
            return null;
        },
        trykk() {
            if (naerSted === 'ta') {
                baerer = true;
                flamme = 1;
                paaAlter = false;
                lys.visible = true;
                tune.runSpeed = 1.45;
                k.hudSnart();
                return 'Du har lyset. Gå rolig opp i koret til høyalteret. Løper eller hopper du, slukner det.';
            }
            if (naerSted === 'sett') {
                tune.runSpeed = fart;
                baerer = false;
                settPaaAlter();
                k.lyd?.lyd.toner([[659.3, 0, 0.6], [880, 0.12, 0.9]], 0.1);
                oppdrag.hendelse('messe:lys');
                return 'Lyset står på høyalteret. Gå til Herr Johannes, så kan messen begynne.';
            }
            if (naerSted === 'prest') {
                prest?.vend(k.player.pos);
                tilFase('klar');
                tekst = 'Herr Johannes sier en linje på latin. Bertolt hvisker hva den betyr. Velg svaret med 1, 2 eller 3. Når presten løfter brødet, ringer du med bjella (mellomrom).';
                k.hudSnart();
            }
            return null;
        },
        steg(dt: number, inp: InputFrame) {
            if (baerer) {
                if (k.modus() === 'boat') slukk(null);
                else if (!k.player.grounded) flamme -= 4 * dt;
                else if (k.player.speed > 2.2) flamme -= 1.6 * dt;
                else flamme = Math.min(1, flamme + (k.player.speed > 0.3 ? 0.15 : 0.35) * dt);
                if (baerer && flamme <= 0) slukk('Lyset sloknet! Gå tilbake til sidealteret og tenn det igjen. Gå rolig denne gangen.');
                return false;
            }
            if (!fase) return false;
            fTid += dt;
            const videre = inp.jumpPressed || inp.interactPressed;
            if (inp.dodgePressed) {
                fase = null;
                prest?.vend(null);
                k.hudSnart();
                return true;
            }
            const l = ledd();
            if (fase === 'klar' || fase === 'igjen') {
                if (videre) begynnMesse();
            } else if (fase === 'prest') {
                if (fTid > 1.5) tilFase('svar');
            } else if (fase === 'svar' && l) {
                if (inp.valg) {
                    valgt = inp.valg - 1;
                    svar(valgt === riktig, valgt === riktig ? `Riktig: «${l.svar}» betyr «${l.svarBetyr}»` : `Feil. Bertolt hvisker det riktige: «${l.svar}»`);
                } else if (fTid > frist) svar(false, `For sent. Bertolt svarer for deg: «${l.svar}»`);
            } else if (fase === 'vent') {
                if (videre || inp.valg) svar(false, 'For tidlig! Bjella skal ringe når presten løfter brødet, ikke før.');
                else if (fTid > frist) tilFase('loft');
            } else if (fase === 'loft') {
                if (videre || inp.valg) {
                    svar(true, 'Bjella ringer mens Herr Johannes løfter brødet høyt, så alle i kirken kan se det.');
                    k.lyd?.lyd.toner([[1318.5, 0, 1.2], [1568, 0.05, 1.2], [1318.5, 0.25, 1.0], [1568, 0.3, 1.0]], 0.07);
                } else if (fTid > frist) svar(false, 'For sent! Presten har alt senket brødet.');
            } else if (fase === 'riktig') {
                if (fTid > 1.1) neste();
            } else if (fase === 'feil') {
                if (fTid > 2.8) neste();
            } else if (fase === 'ferdig') {
                if (videre || fTid > 5) {
                    fase = null;
                    prest?.vend(null);
                }
            }
            return true;
        },
        bilde(dt) {
            sjekk -= dt;
            if (sjekk <= 0) {
                sjekk = 0.5;
                const s = status();
                // Lyset blir stående på alteret til oppdraget er levert (også etter at spillet er lastet på nytt).
                if ((s === 'aktiv' || s === 'klar') && maalNaadd(oppdrag, 'messe', 0) && !baerer) {
                    if (!paaAlter || !sted('hoyalter-topp')) paaAlter = settPaaAlter();
                } else if (!baerer && paaAlter) {
                    paaAlter = false;
                    lys.visible = false;
                }
                if (baerer && s !== 'aktiv') slukk(null);
            }
            if (baerer) {
                const r = k.player.anim.root;
                const yaw = k.player.yaw;
                // I høyre hånd, litt fram og til siden, så lyset synes forbi gutten når kameraet står bak.
                lys.position.set(r.position.x + Math.sin(yaw) * 0.2 - Math.cos(yaw) * 0.27, r.position.y + 0.9, r.position.z + Math.cos(yaw) * 0.2 + Math.sin(yaw) * 0.27);
                lys.rotation.set(0, yaw, 0);
            }
            // Flammen blafrer, og krymper når den er svak.
            const t = performance.now() / 1000;
            const s = (baerer ? flamme : 1) * (0.9 + Math.sin(t * 23) * 0.06 + Math.sin(t * 37) * 0.04);
            ild.scale.set(1, Math.max(0.05, s), 1);
            ild.position.x = baerer ? (1 - flamme) * Math.sin(t * 17) * 0.012 : 0;
            gloed.scale.setScalar(Math.max(0.05, s));
        },
        rask: () => baerer || fase !== null,
        hud(): MesseHud | null {
            if (!baerer && !fase) return null;
            const l = ledd();
            const tidIgjen = fase === 'svar' || fase === 'loft' ? Math.max(0, 1 - fTid / frist) : 1;
            return {
                flamme: baerer ? flamme : null,
                fase,
                nr,
                antall: LEDD.length,
                prest: fase === 'vent' || fase === 'loft' ? '' : (l?.prest ?? ''),
                hvisk: l && (fase === 'svar' || fase === 'prest') ? `Det betyr «${l.betyr}» ${l.svar === l.prest ? 'Svar med de samme ordene.' : `Svaret ditt betyr «${l.svarBetyr}»`}` : '',
                valg: fase === 'svar' || fase === 'riktig' || fase === 'feil' ? valg : [],
                riktig,
                valgt,
                tid: tidIgjen,
                bom,
                tekst:
                    fase === 'vent' ? 'Herr Johannes bøyer seg over alteret. Vent til han løfter brødet høyt. Da ringer du.'
                    : fase === 'loft' ? 'Han løfter brødet! Ring med bjella nå!'
                    : fase === 'prest' || fase === 'svar' ? ''
                    : tekst,
            };
        },
        dispose() {
            tune.runSpeed = fart;
            k.scene.remove(lys);
            for (const x of [...geo, messing, voks, flammeMat, gloedMat]) x.dispose();
        },
    };
}
