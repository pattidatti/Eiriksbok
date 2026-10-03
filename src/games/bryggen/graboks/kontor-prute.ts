// «Sølve fra Vesterålen» (kontor-data.ts, oppdrag 3): prute med en fisker om bytteforholdet fisk mot
// rug, i kilo rug for én kilo tørrfisk.
//
// Sølve ber om 10. Han har en grense han ikke går under av fri vilje (6,5-8, trukket), men den står
// ikke noe sted: den må leses av det han gjør. Gutten flytter budet med A/D (eller 1/2) og byr med
// mellomrom. Over grensen gir Sølve seg litt og byr tilbake; under den mister han tålmodigheten, og jo
// lenger under, jo fortere. Går tålmodigheten tom, vil han gå, men blir stående: ingen andre på
// Bryggen kjøper fisken hans. Da tar han husbondens seks. Det er makta til Kontoret, ikke en seier.
//
// [V] Bytteforholdet rundt 1500: 8 kg rug for 1 kg tørrfisk i Bergen, halvparten 50 år senere (Holm mfl.
// 2019, etter Nedkvitne 1988; blueprint §4.3). [V] Kontoret styrte kornimporten. [U] tallene i
// 1420-årene. Sølve, grensen og tålmodigheten er [S].
import type { InputFrame } from '../motor/input';
import type { Snakkbar } from '../motor/streaming';
import { finnPerson, maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export type PruteFase = 'klar' | 'by' | 'svar' | 'enig' | 'tvunget';

export interface PruteHud {
    fase: PruteFase;
    /** Gutten sitt bud nå og det Sølve ber om (kilo rug per kilo fisk). */
    bud: number;
    ber: number;
    /** Bud som er gitt, og svarene (til historikken på brettet). */
    logg: { bud: number; svar: string; stemning: Stemning }[];
    taalmodighet: number;
    maks: number;
    husbonden: number;
    sier: string;
    tegn: string;
    stemning: Stemning;
    /** Den ferdige prisen, og grensen hans (vises etterpå). */
    pris: number;
    grense: number;
    n: number;
}

export type Stemning = 'rolig' | 'noler' | 'sur' | 'sint';

const START_BER = 10;
const HUSBONDEN = 6;
const MAKS = 5;
const MIN_BUD = 4;
const MAKS_BUD = 10;

const avrund = (x: number) => Math.round(x * 2) / 2;

export function lagPrute(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: PruteFase | null = null;
    let bud = 5;
    let ber = START_BER;
    let grense = 7;
    let taal = MAKS;
    let logg: PruteHud['logg'] = [];
    let sier = '';
    let tegn = '';
    let stemning: Stemning = 'rolig';
    let pris = 0;
    let fTid = 0;
    let n = 0;
    let solve: Snakkbar | null = null;

    const trengs = () => oppdrag.status('kontor-prute') === 'aktiv' && !maalNaadd(oppdrag, 'kontor-prute', 0);

    function si(t: string): void {
        sier = t;
        if (solve) k.world.si?.('Sølve', t, solve.pos);
    }

    function ferdig(p: number, tvunget: boolean): void {
        pris = p;
        fase = tvunget ? 'tvunget' : 'enig';
        fTid = 0;
        const navn = tvunget ? 'tvunget' : p <= 7 ? 'hard' : p <= 8 ? 'rett' : 'raus';
        oppdrag.settFlagg(`kontor-pris=${p}`);
        oppdrag.settFlagg(`kontor-pris-${navn}`);
        oppdrag.hendelse('kontor:prutet');
        if (tvunget) {
            si('Ingen andre kjøper. Det vet dere. Gi meg seksen, da.');
            tegn = 'Han ser ikke på deg mens han sier det.';
            solve?.gest('skuldre', 3);
            k.lyd?.lyd.toner([[174.6, 0, 0.6], [146.8, 0.2, 0.9]], 0.1);
        } else {
            si(p >= grense + 1 ? 'Det er et ærlig bytte. Takk, gutt.' : 'Ja vel. Det får holde.');
            tegn = p <= grense ? 'Han spytter i handa og tar deg i hånda. Grepet er hardt.' : 'Han nikker og tar deg i hånda.';
            solve?.gest('nikk', 2);
            k.lyd?.lyd.toner([[392, 0, 0.3], [523.3, 0.12, 0.5]], 0.1);
        }
        k.hudSnart();
    }

    function by(): void {
        n++;
        fTid = 0;
        if (bud >= ber) {
            logg.push({ bud, svar: 'Enig', stemning: 'rolig' });
            ferdig(bud, false);
            return;
        }
        const under = grense - bud;
        let svar: string;
        if (under <= 0 && (taal <= 2 || ber - bud <= 0.5)) {
            // Over grensen, og han er lei eller nesten enig: han tar budet.
            logg.push({ bud, svar: 'Enig', stemning: 'noler' });
            ferdig(bud, false);
            return;
        }
        if (under <= 0) {
            // Over grensen: han gir seg et stykke (minst en halv kilo), men ikke under grensen.
            taal -= 1;
            ber = Math.max(grense, Math.min(ber - 0.5, avrund((ber + bud) / 2)));
            stemning = 'noler';
            svar = `Jeg kan gå ned til ${fmt(ber)}.`;
            tegn = ['Han klør seg i skjegget og ser på sekkene.', 'Han teller på fingrene.', 'Han nøler. Det er ikke langt unna.'][n % 3];
            solve?.gest('skuldre', 1.6);
        } else if (under <= 1) {
            taal -= 1;
            ber = Math.max(grense, avrund(ber - 0.5));
            stemning = 'sur';
            svar = `Nei. ${fmt(ber)}, ikke mindre.`;
            tegn = ['Han rister på hodet, men blir stående.', 'Han biter tennene sammen.'][n % 2];
            solve?.gest('riste', 1.6);
        } else {
            taal -= 2;
            stemning = 'sint';
            svar = 'Det er å stjele, det. Da seiler jeg heller hjem.';
            tegn = 'Han snur seg halvt og ser bort mot jekta.';
            solve?.gest('vift', 2);
            k.cam.addShake(0.015);
        }
        logg.push({ bud, svar, stemning });
        si(svar);
        k.lyd?.lyd.spill('fottrinn', 'tre-ute', { styrke: 0.4, fart: 0.8, pos: solve?.pos });
        if (taal <= 0) ferdig(HUSBONDEN, true);
        else fase = 'svar';
        k.hudSnart();
    }

    return {
        navn: 'kontor-prute',
        prompt(gutt) {
            if (fase || !trengs()) return null;
            solve = finnPerson(k.world, 'solve');
            if (!solve || !naer(gutt, solve.pos, 2.4)) return null;
            return 'E: Prut med Sølve om fisken';
        },
        trykk() {
            grense = [6.5, 7, 7, 7.5, 7.5, 8][Math.floor(Math.random() * 6)];
            ber = START_BER;
            bud = 5;
            taal = MAKS;
            logg = [];
            n = 0;
            stemning = 'rolig';
            fase = 'klar';
            fTid = 0;
            solve?.vend(k.player.pos);
            si('Ti kilo rug for en kilo fisk. Barna mine skal ha brød hele vinteren.');
            tegn = 'Sølve står med armene i kors ved fiskebuntene sine.';
            k.hudSnart();
        },
        steg(dt: number, inp: InputFrame) {
            if (!fase) return false;
            fTid += dt;
            const videre = inp.jumpPressed || inp.interactPressed;
            if (fase === 'enig' || fase === 'tvunget') {
                if (fTid > 1 && (videre || fTid > 10)) {
                    fase = null;
                    solve?.vend(null);
                    k.hudSnart();
                }
                return true;
            }
            if (fase === 'klar') {
                if (videre) {
                    fase = 'by';
                    k.hudSnart();
                }
                return true;
            }
            // Flytt budet: A/D, piltastene til siden er kameraet.
            const ned = inp.trykt.has('KeyA') || inp.valg === 1;
            const opp = inp.trykt.has('KeyD') || inp.valg === 2;
            if (ned || opp) {
                bud = Math.min(MAKS_BUD, Math.max(MIN_BUD, bud + (opp ? 0.5 : -0.5)));
                k.lyd?.lyd.toner([[440 + bud * 30, 0, 0.06]], 0.04);
                if (fase === 'svar') fase = 'by';
                k.hudSnart();
            }
            if (inp.jumpPressed && fTid > 0.35) by();
            else if (inp.dodgePressed || inp.valg === 3) {
                fase = null;
                solve?.vend(null);
                si('Kom tilbake når du vil handle, da.');
                k.hudSnart();
            }
            return true;
        },
        rask: () => fase !== null,
        hud(): PruteHud | null {
            if (!fase) return null;
            return { fase, bud, ber, logg: logg.slice(-4), taalmodighet: taal, maks: MAKS, husbonden: HUSBONDEN, sier, tegn, stemning, pris, grense, n };
        },
        dispose() {
            fase = null;
        },
    };
}

export function fmt(x: number): string {
    return Number.isInteger(x) ? String(x) : `${Math.floor(x)},5`;
}
