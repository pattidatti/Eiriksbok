// Året på Nordvik i 872: gården, årstidene og oppgjøret.
//
// Kapittel 2 har ingen boss og nesten ingen kamp. Motoren er dette: fire
// årstider som kommer i rekkefølge, et forråd som bare kan brukes én gang, og
// tre som kommer over fjorden i sommer og vil ha korn.
//
// **Ingenting her er tilfeldig.** Avlingen henger på når hun sådde og hvor mye
// hun turte å legge i jorda; vinteren henger på avlingen og på hvem hun ga til.
// Går det galt, skal eleven kunne peke på valget som gjorde det - ikke på en
// terning.
//
// **Det som skjer, skjer i årstidsskiftene.** Det er derfor de ligger samlet i
// `inngang()`: kornet kommer inn når høsten begynner, vinteren gjør opp når
// vinteren begynner. Legges slikt spredt utover, får man to steder som begge
// tror de høster den samme åkeren.
//
// Klassen eier ikke tilstand utover den som ligger i storen. Den leser og
// skriver, og alt den avgjør kan leses av et lagret spill.

import {
    AARSVALG_BY_ID,
    DAGSVERK,
    HARALD_KREVER,
    K2_FLAGG,
    MOTSTANDERNE_BER_OM,
    SAAKORN,
    SAEBO_BER_OM,
    SAEBO_TAKK,
    SLAKT,
    VAARONN_SISTE_DAG,
    avling,
    vinterregnskap,
} from '../data/aaret';
import { K2 } from '../data/kapitler';
import { useRpgStore } from '../store/useRpgStore';
import { AARSTID, AARSTIDER, aarstidFor, dagIAarstid, forsteDagI } from './klokke';
import { fraSpill } from './bridge';
import type { Aarstid } from '../types';

/** De som kommer over fjorden i sommer, og hvem de er. */
export const SOMMERGJESTENE = ['torolv', 'eystein'] as const;

export interface GaardKroker {
    /** Skjuler og viser folk som bare er her i én årstid. */
    settSynlig: (npcId: string, synlig: boolean) => void;
    /**
     * Båten kommer inn vika.
     *
     * Gården eier ikke angrepet - den sier bare fra at kornet er inne. At det
     * er nettopp da noen kommer for å ta det, er hele grunnen til at angrepet
     * ligger der det ligger.
     */
    varsleAngrep: () => void;
}

export class Gaarden {
    private kroker: GaardKroker;

    constructor(kroker: GaardKroker) {
        this.kroker = kroker;
    }

    private get aarstid(): Aarstid {
        return aarstidFor(useRpgStore.getState().klokke.dag);
    }

    /**
     * Setter verden i takt med årstiden.
     *
     * Kalles når eleven kommer til gården, og etter hvert valg som kan ha
     * flyttet tiden. Ikke hvert bilde: ingenting her endrer seg av seg selv,
     * og en oppgavetekst som skrives seksti ganger i sekundet er seksti
     * gjentegninger av HUD-en for ingenting.
     */
    oppdater(): void {
        const s = useRpgStore.getState();
        const aarstid = this.aarstid;
        // Kongsmennene står på tunet bare i sommer, og bare til hun har svart
        // dem. Etterpå er de borte - de har fått svaret sitt.
        const sommer = aarstid === 'sommer' && !s.steg.includes(K2.kornet);
        for (const id of SOMMERGJESTENE) this.kroker.settSynlig(id, sommer);
        this.meldOppgave();
    }

    private meldOppgave(): void {
        const s = useRpgStore.getState();
        const aarstid = this.aarstid;
        const a = AARSTID[aarstid];
        // Står båten i vika, eier angrepet oppgavekortet. Årstiden skal ikke
        // skrive «bestem slakten» oppå fem menn som ror inn.
        if (aarstid === 'host' && s.steg.includes(K2.hosten) && !s.steg.includes(K2.angrepet)) {
            return;
        }
        const mal =
            aarstid === 'vaar'
                ? s.steg.includes(K2.vaaronn)
                    ? 'Kornet er i jorda. Nå vokser det uten deg.'
                    : 'Lås opp bua og bestem såkornet. Våronna varer til dag 15.'
                : aarstid === 'sommer'
                  ? s.steg.includes(K2.kornet)
                      ? 'Du har svart dem begge. Sommeren går.'
                      : 'To menn står på tunet og vil ha korn. Naboen over vika spør også.'
                  : aarstid === 'host'
                    ? s.steg.includes(K2.hosten)
                        ? 'Kornet er inne. Bestem slakten i bua.'
                        : 'Innhøstingen står for tur.'
                    : 'Vinteren gjør opp.';
        fraSpill.emit('oppgave', {
            tittel: `${a.navn} · ${s.klokke.aar}`,
            mal,
            teller: `Dag ${dagIAarstid(s.klokke.dag)}/30`,
        });
    }

    // ── Bua ─────────────────────────────────────────────────────────────────

    /** Valgene som står åpne i bua nå, og om året kan skyves videre herfra. */
    bua(): { apne: string[]; kanGaaVidere: boolean } {
        const s = useRpgStore.getState();
        const aarstid = this.aarstid;
        const apne: string[] = [];
        if (aarstid === 'vaar' && !s.steg.includes(K2.vaaronn)) apne.push('saaingen');
        if (aarstid === 'host' && s.steg.includes(K2.hosten) && !s.flagg[SLAKTET]) {
            apne.push('slakten');
        }
        // Vinteren er ikke en årstid hun kan skyve videre fra: den er slutten
        // på kapittelet, og oppgjøret er alt gjort i det hun kom hit.
        //
        // Og høsten kan ikke skyves før båten i vika er gjort opp. Å låse bua
        // og la vinteren komme mens fem menn står i fjæra, er ikke et valg -
        // det er en vei rundt kapittelets eneste kamp.
        const angrepStaar = aarstid === 'host' && !s.steg.includes(K2.angrepet);
        return { apne, kanGaaVidere: aarstid !== 'vinter' && !angrepStaar };
    }

    /** Åsa bestemte seg i bua. */
    velg(beslutning: string, alternativ: string): void {
        const def = AARSVALG_BY_ID[beslutning];
        if (!def) return;
        const store = useRpgStore.getState();

        if (beslutning === 'saaingen') {
            const saakorn = SAAKORN[alternativ] ?? 0;
            if (saakorn <= 0) return;
            // Har hun ikke kornet, kan hun ikke så det. Uten denne kunne
            // bingen gå i null og åkeren likevel bli full.
            if (store.forrad.korn < saakorn) {
                store.varsle('Det er ikke så mye korn i bingen.', 'darlig');
                return;
            }
            const tidlig = dagIAarstid(store.klokke.dag) <= VAARONN_SISTE_DAG;
            const paaRot = avling(saakorn, tidlig);
            store.endreForrad({ korn: -saakorn, aaker: paaRot });
            store.fullforSteg(K2.vaaronn);
            store.settFlagg(K2_FLAGG.saadeTidlig, tidlig);
            store.gaaDager(DAGSVERK.saaingen, 'Våronna');
            store.varsle(
                tidlig
                    ? `Sådd i tide. ${paaRot} sekker står på rot til høsten.`
                    : `Sent sådd. ${paaRot} sekker rekker å modne.`,
                tidlig ? 'bra' : 'darlig'
            );
            store.fullforPuzzle('saakornet', 'Du sådde åkeren selv');
            store.larBegrep('aarshjulet', 'forstatt');
            this.oppdater();
            return;
        }

        if (beslutning === 'slakten') {
            const dyr = SLAKT[alternativ] ?? 0;
            const faktisk = Math.min(dyr, store.forrad.dyr);
            store.endreForrad({ dyr: -faktisk, kjott: faktisk });
            store.settFlagg(SLAKTET);
            store.gaaDager(DAGSVERK.slakten, 'Slakten');
            store.varsle(
                faktisk === 0
                    ? 'Ingen dyr slaktet. De skal alle ha fôr i vinter.'
                    : `${faktisk} dyr slaktet. ${faktisk} mål kjøtt i bua.`,
                'info'
            );
            this.oppdater();
        }
    }

    /**
     * Året går videre til neste årstid.
     *
     * Eleven bestemmer selv når. Det er ikke slurv: en klokke som går av seg
     * selv gjør et rolig kapittel til et tidspress, og hele poenget med
     * årshjulet er at hun skal kunne se hva som venter og velge i fred. Dagene
     * hun ikke brukte, går uansett - de kommer ikke tilbake.
     */
    gaaVidere(): void {
        const store = useRpgStore.getState();
        const na = this.aarstid;
        if (na === 'vinter') return;
        const neste = AARSTIDER[AARSTIDER.indexOf(na) + 1];
        const dagerIgjen = forsteDagI(neste) - store.klokke.dag;
        if (dagerIgjen > 0) store.gaaDager(dagerIgjen);
        this.inngang(neste);
        this.oppdater();
    }

    /** Det som skjer i det en årstid begynner. Ett sted, én gang. */
    private inngang(aarstid: Aarstid): void {
        const store = useRpgStore.getState();
        if (aarstid === 'sommer') {
            store.varsle('Sommeren. Nå er det folk på fjorden.', 'info');
            return;
        }

        if (aarstid === 'host') {
            // Sommeren er over, og de som kom for å be, har fått sitt svar -
            // også den som ikke svarte. Å la spørsmålet stå åpent er et svar.
            if (!store.steg.includes(K2.kornet)) {
                store.fullforSteg(K2.kornet);
                store.settFlagg(K2_FLAGG.matetIngen);
                store.endreAett('hovda', { velvilje: -10 });
                store.varsle('Ingen fikk noe av deg i sommer. Det snakkes om det.', 'darlig');
            }
            const paaRot = store.forrad.aaker;
            store.endreForrad({ korn: paaRot, aaker: -paaRot });
            store.fullforSteg(K2.hosten);
            store.gaaDager(DAGSVERK.innhostingen, 'Innhøstingen');
            store.varsle(
                paaRot > 0
                    ? `Innhøstingen: ${paaRot} sekker inn i bingen.`
                    : 'Det står ingenting på åkeren. Ingenting å høste.',
                paaRot > 0 ? 'bra' : 'darlig'
            );
            // Og i samme uke kommer båten. Full bu, ingen menn hjemme.
            this.kroker.varsleAngrep();
            return;
        }

        if (aarstid === 'vinter') this.gjorOppVinteren();
    }

    /**
     * Oppgjøret.
     *
     * Her møtes alt: såkornet, gavene, slakten. Regnestykket er det samme som
     * sto framme i bua hele året - `vinterregnskap` - og det er med vilje:
     * eleven skal dømmes etter tallet hun fikk se, ikke etter et annet.
     */
    private gjorOppVinteren(): void {
        const store = useRpgStore.getState();
        let regnskap = vinterregnskap(store.forrad);

        // Gaven som kommer tilbake. Ga hun korn til Sæbø i sommer da de ikke
        // hadde noe, kommer de nå - med mer enn de fikk. Det er ikke
        // snillhet, det er hvordan et samfunn uten stat forsikrer seg, og
        // eleven ser hele mekanikken i én vinter.
        let gjengave = 0;
        if (regnskap.margin < 0 && (store.aetter.saebo?.velvilje ?? 0) >= SAEBO_TAKK) {
            gjengave = SAEBO_BER_OM * 2;
            store.endreForrad({ korn: gjengave });
            store.settFlagg(K2_FLAGG.saeboBetalteTilbake);
            store.larBegrep('gjengave', 'forstatt');
            regnskap = vinterregnskap(useRpgStore.getState().forrad);
        }

        const berget = regnskap.margin >= 0;
        store.settFlagg(berget ? K2_FLAGG.stodVinteren : K2_FLAGG.sultevinter);
        store.fullforSteg(K2.vinteren);
        if (berget) {
            store.giAere(10, 'Gården sto vinteren av. Alle spiste.');
        } else {
            store.giAere(-8, 'Det var ikke nok. Dine egne sultet.');
        }
        store.larBegrep('husfrue', 'forstatt');
        store.fullforKapittel(2, 'Kapittel 2: Nøklene');

        const tekst = [
            berget
                ? 'Snøen kom i november, og den ble liggende til april. Dere spiste hver dag. Det er ikke en selvfølge, og alle på gården vet hvem som styrte bingen.'
                : `Kornet tok slutt i februar. Dere kokte suppe på det som var igjen, og Torgeir ble liggende. Ingen døde. Men våren kom sent, og alle husker hvorfor.`,
            gjengave > 0
                ? `Vigdis kom over isen med ${gjengave} sekker korn. «Du ga da vi ikke hadde. Nå har vi.» Hun ga tilbake mer enn hun fikk - det er slik det gjøres, og det er derfor du ga.`
                : '',
            'Mennene kom hjem fra Hafrsfjord i mai. Harald hadde vunnet.',
        ]
            .filter(Boolean)
            .join('\n\n');

        fraSpill.emit('beskjed', {
            tittel: berget ? 'Gården sto' : 'Sultevinteren',
            tekst,
            knapp: 'Videre',
        });
        fraSpill.emit('oppgave', null);
    }

    // ── De som kommer i sommer ──────────────────────────────────────────────

    /**
     * Åsa svarer en av dem som ber om korn.
     *
     * De to kongsmennene lukker spørsmålet: har hun først gitt til Harald, kan
     * hun ikke gi til motstanderne hans også. Naboen står utenfor den
     * regningen - Sæbø er ikke en side i krigen, det er folk over vika.
     */
    gave(hvem: 'harald' | 'motstanderne' | 'saebo', gir: boolean): void {
        const store = useRpgStore.getState();
        if (hvem === 'saebo') {
            if (!gir) {
                store.fullforSteg('k2-gave-saebo');
                store.settFlagg('k2-avslo-saebo');
                store.endreAett('saebo', { velvilje: -15 });
                store.varsle('Vigdis rodde hjem med tom båt.', 'darlig');
                return;
            }
            if (store.forrad.korn < SAEBO_BER_OM) {
                store.varsle('Du har ikke seks sekker å gi.', 'darlig');
                return;
            }
            store.endreForrad({ korn: -SAEBO_BER_OM });
            // Steget er det som gjør at Vigdis ikke spør igjen. Uten det ville
            // hun stått og be om seks sekker til hver gang eleven snakker med
            // henne, og en gave man kan gjenta er ikke en gave.
            store.fullforSteg('k2-gave-saebo');
            store.settFlagg(K2_FLAGG.matetSaebo);
            store.endreAett('saebo', { velvilje: SAEBO_TAKK });
            store.endreAere('gave');
            store.larBegrep('gjengave', 'hort');
            store.varsle('Sæbø-ætta står i gjeld til deg nå. Det er meningen.', 'bra');
            return;
        }

        const krav = hvem === 'harald' ? HARALD_KREVER : MOTSTANDERNE_BER_OM;
        if (gir) {
            if (store.forrad.korn < krav) {
                store.varsle(`Du har ikke ${krav} sekker å gi.`, 'darlig');
                return;
            }
            store.endreForrad({ korn: -krav });
            store.settFlagg(
                hvem === 'harald' ? K2_FLAGG.matetHarald : K2_FLAGG.matetMotstanderne
            );
            store.endreAett(hvem === 'harald' ? 'nordvik' : 'hovda', { velvilje: 20 });
            // Å gi når man blir bedt om det, er å holde ord: gården står ved
            // den siden mannen hennes slåss for, og alle på tunet så at hun
            // gjorde det uten å nøle.
            store.endreAere('holdt-ord');
            store.varsle(
                hvem === 'harald'
                    ? 'Kornet gikk sørover, til kongen som holder på å vinne.'
                    : 'Kornet gikk til dem som slåss mot ham.',
                'info'
            );
        } else {
            store.varsle(
                hvem === 'harald'
                    ? 'Du sa nei til kongens mann. Han kom ikke hit for å be.'
                    : 'Du sa nei. De rodde videre til neste gård.',
                'info'
            );
            // Å si nei til kongens mann, foran hele husholdet, koster noe og gir
            // noe. Det er ikke trass - det er å vise at gården ikke er hans.
            if (hvem === 'harald') {
                store.endreAett('nordvik', { velvilje: -10 });
                store.endreAere('sto-imot');
            }
        }
        // Ett svar lukker begge: kornet finnes bare én gang, og valget skal
        // være hvem - ikke hvor mange ganger hun rekker å gi.
        store.fullforSteg(K2.kornet);
        store.larBegrep('leidang', 'forstatt');
        this.oppdater();
    }
}

/** Flagget som sier at slakten er unnagjort. Lokalt - ingen andre leser det. */
const SLAKTET = 'k2-slaktet';
