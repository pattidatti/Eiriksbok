// «Bårds fisk på bismeren» (kontor-jobber.ts, blueprint §7.1): gutten veier fem bunter på bismeren ved
// jekta (samme bismer som i bua, bismer.ts), legger sammen bismerpundene og velger hvor mange våger det
// blir (3 pund i en våg). Bård har sitt eget tall fra Nordland: fisken har tørket litt på veien, så den
// veier litt mindre her. Det er ikke juks, men han vil se det selv.
//
// Godt nok: minst fire av fem bunter lest riktig, og riktig svar i våger. Etter at oppdraget er levert,
// kan jobben tas igjen for lønn én gang per døgn.
//
// [V] bismerpund og våg (blueprint §4.3, kontor-jobber.ts). [U] våg-størrelsen i 1420-årene. At fisken
// tørker og blir lettere, gjelder tørrfisk [S]; hvor mye, er laget for spillet.
import type { InputFrame } from '../motor/input';
import type { Snakkbar } from '../motor/streaming';
import { PUND_PER_VAAG } from '../bygg/kontor-jobber';
import { BismerSpill, type BismerHud } from './bismer';
import { finnPerson, maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export interface VeiingHud {
    fase: 'klar' | 'veie' | 'regn' | 'slutt';
    bismer: BismerHud | null;
    nr: number;
    av: number;
    /** Det gutten har lest av, og om det var riktig (vises etterpå). */
    lest: { verdi: number; riktig: boolean }[];
    /** Svarene i våger (tast 1-3). */
    valg: string[];
    svar: number | null;
    riktigSvar: number;
    /** Bårds tall hjemmefra, i våger. */
    bard: number;
    rett: boolean;
    tekst: string;
}

const ANTALL = 5;
const komma = (x: number) => x.toFixed(1).replace('.', ',');

export function lagVeiing(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: VeiingHud['fase'] | null = null;
    let spill: BismerSpill | null = null;
    let sanne: number[] = [];
    let lest: VeiingHud['lest'] = [];
    let valg: number[] = [];
    let riktigSvar = 0;
    let svar: number | null = null;
    let rett = false;
    let tekst = '';
    let fTid = 0;
    let arbeid = false;
    let bard: Snakkbar | null = null;
    let dag = 0;
    let forrige = k.lys.klokke;
    let sistJobb = -1;

    const trengs = () => oppdrag.status('kontor-veiing') === 'aktiv' && !maalNaadd(oppdrag, 'kontor-veiing', 0);
    const kanArbeide = () => oppdrag.status('kontor-veiing') === 'levert' && dag > sistJobb;

    function nyBunt(): void {
        spill = new BismerSpill(sanne[lest.length], false, k.baering.roligere);
    }

    function tilRegning(): void {
        fase = 'regn';
        const sum = lest.reduce((a, b) => a + b.verdi, 0);
        riktigSvar = Math.round((sum / PUND_PER_VAAG) * 10) / 10;
        // Feilene man lett gjør: glemmer å dele (svarer i pund), eller deler på 2.
        const feil = [Math.round(sum * 10) / 10, Math.round((sum / 2) * 10) / 10];
        valg = [riktigSvar, ...feil].sort(() => Math.random() - 0.5);
        tekst = `Summen er ${komma(sum)} bismerpund. Hvor mange våger er det?`;
        k.hudSnart();
    }

    function velg(i: number): void {
        svar = valg[i];
        const lesteRett = lest.filter((l) => l.riktig).length;
        const regnetRett = svar === riktigSvar;
        rett = regnetRett && lesteRett >= ANTALL - 1;
        fase = 'slutt';
        fTid = 0;
        tekst = !regnetRett
            ? svar > riktigSvar * 2
                ? 'Det er pund, ikke våger. Del på tre.'
                : 'Det er ikke riktig. Tre pund er én våg: del summen på tre.'
            : rett
                ? 'Riktig. Bård sammenligner med sitt eget tall og nikker.'
                : 'Riktig regnet, men flere bunter ble lest av før stanga lå vannrett.';
        if (arbeid) {
            sistJobb = dag;
            oppdrag.gjor(rett ? 'witten:+1;rykte:F:+1' : 'witten:+1');
        } else {
            if (rett) oppdrag.settFlagg('veiing-rett');
            oppdrag.hendelse('kontor:veid');
        }
        if (regnetRett) oppdrag.gjor('ferdighet:regning');
        k.lyd?.lyd.toner(rett ? [[392, 0, 0.3], [523.3, 0.12, 0.5]] : [[220, 0, 0.5], [174.6, 0.2, 0.8]], 0.1);
        k.hudSnart();
    }

    return {
        navn: 'kontor-veiing',
        bilde() {
            const kl = k.lys.klokke;
            if (kl < forrige - 60) dag++;
            forrige = kl;
        },
        prompt(gutt) {
            if (fase || !(trengs() || kanArbeide())) return null;
            bard = finnPerson(k.world, 'bard');
            if (!bard || !naer(gutt, bard.pos, 2.4)) return null;
            return trengs() ? 'E: Vei fisken til Bård' : 'E: Vei fisk for Bård (arbeid for lønn)';
        },
        trykk() {
            arbeid = !trengs();
            sanne = Array.from({ length: ANTALL }, () => Math.round((2.4 + Math.random() * 1.4) * 10) / 10);
            lest = [];
            svar = null;
            rett = false;
            fase = 'klar';
            tekst = '';
            bard?.vend(k.player.pos);
            k.world.si?.('Bård', 'Fem bunter. Og regn det om til våger etterpå.', bard?.pos);
            k.hudSnart();
        },
        steg(dt: number, inp: InputFrame) {
            if (!fase) return false;
            fTid += dt;
            const videre = inp.jumpPressed || inp.interactPressed;
            if (fase === 'klar') {
                if (videre) {
                    fase = 'veie';
                    nyBunt();
                    k.hudSnart();
                } else if (inp.dodgePressed) {
                    fase = null;
                    k.hudSnart();
                }
                return true;
            }
            if (fase === 'veie' && spill) {
                spill.step(dt, inp.move.x);
                if (videre) {
                    const v = spill.lesAv();
                    const riktig = Math.abs(v - spill.sann) <= k.baering.slark;
                    lest.push({ verdi: v, riktig });
                    k.lyd?.lyd.spill('fottrinn', 'tre-ute', { styrke: 0.4, fart: 1.3 });
                    tekst = `${komma(v)} bismerpund.`;
                    if (riktig) oppdrag.gjor('ferdighet:regning');
                    if (lest.length >= ANTALL) {
                        spill = null;
                        tilRegning();
                    } else nyBunt();
                    k.hudSnart();
                }
                return true;
            }
            if (fase === 'regn') {
                if (inp.valg && inp.valg >= 1 && inp.valg <= valg.length) velg(inp.valg - 1);
                return true;
            }
            if (fase === 'slutt' && fTid > 1 && (videre || fTid > 14)) {
                fase = null;
                bard?.vend(null);
                k.hudSnart();
            }
            return true;
        },
        rask: () => fase === 'veie',
        hud(): VeiingHud | null {
            if (!fase) return null;
            const sannSum = sanne.reduce((a, b) => a + b, 0);
            return {
                fase,
                bismer: spill?.hud ?? null,
                nr: lest.length,
                av: ANTALL,
                lest: [...lest],
                valg: valg.map((v) => `${komma(v)} våger`),
                svar,
                riktigSvar,
                // Bård veide før fisken tørket på turen: litt over det den veier her [S].
                bard: Math.round((sannSum / PUND_PER_VAAG) * 1.04 * 10) / 10,
                rett,
                tekst,
            };
        },
        dispose() {
            fase = null;
        },
    };
}
