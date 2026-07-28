// Skjoldborgen (blueprint §5.4). Stiklestad, 29. juli 1030.
//
// Dette er det motsatte av alt spillet har lært eleven til nå, og det er hele
// poenget: vikingkrig var formasjon og disiplin, ikke berserkerkaos. Fire
// regler, og hver av dem snur en vane hun har brukt tre kapitler på å bygge:
//
//   1. **Du kan ikke rulle, og du kan ikke løpe fram.** Rekka er stedet ditt.
//   2. **Skjoldet ditt dekker deg og halve mannen til venstre.** Han dekker
//      deg tilbake. Står du i rekka, tar du mindre; går du fram, står du bar.
//   3. **Går du fram, åpner du et hull.** Da har mannen til venstre ingenting
//      foran seg. Han såres, og faller han, brister rekka utover fra der du
//      sto.
//   4. **Seier er å stå i halvannet minutt.** Ikke å drepe noe.
//
// Og våpenet: `VaapenKamp.iRekke` har ligget i dataene siden kampsystemet ble
// bygget uten at noe leste den. Her leses den. Spydet når over skjoldene og
// krever ingen plass å svinge på; øksa krever albuerom, og albuerom er
// nøyaktig det ingen har der inne.
//
// **Eleven kan ikke dø her.** Hun står i øvingsmodus, og går hun i bakken,
// brister rekka rundt henne i stedet. Det er ikke en snillhet: utfallet av
// slaget står fast uansett hva hun gjør - bondehæren vant, og kongen falt.
// Det hun avgjør, er hvem som kom hjem fra hennes del av rekka.

import type Phaser from 'phaser';
import { ENEMY_BY_ID } from '../data/enemies';
import { K4, K4_FLAGG } from '../data/kapitler';
import { REKKA_X, REKKA_Y } from './stiklestadgen';
import { maksVerdier, useRpgStore } from '../store/useRpgStore';
import { sfx, startEnTone, startMusikk } from './audio';
import { fraSpill } from './bridge';
import { TILE } from './spriteforge';
import type { Fiende, Sprite } from './systems/entiteter';

export type SkjoldborgFase = 'ingen' | 'stilt' | 'staar' | 'over';

export type SkjoldborgUtfall = 'holdt' | 'brast';

/** Halvannet minutt. Blueprintens tall, og det er lenger enn det høres ut. */
const HOLDE_MS = 90_000;

/**
 * Hvor langt fram hun får gå før hullet åpner seg, i piksler.
 *
 * En halv rute. Rekka er ikke en strek man balanserer på - hun skal kunne
 * strekke seg etter en mann uten å bli straffet for det. Men to skritt fram er
 * to skritt for mye, og det er den avstanden dette tallet er.
 */
const FRAMME = 10;

/**
 * Hvor langt til hver side hun får flytte seg, i piksler.
 *
 * Halvannen rute: nok til å vike unna et stikk og til å nå en mann som står
 * litt på skrå, og ikke nok til å gå fra plassen sin. Naboene står to ruter
 * unna på hver side, så hun kommer aldri utenfor dem.
 */
const PLASSEN = 22;

/** Nåden i det rekka stiller seg opp. Ingen skal tape på å komme i gang. */
const NAADE = 2000;

/** Hvor lenge hun kan stå framme før naboen begynner å ta imot for henne. */
const HULL_VARSEL = 900;
const HULL_SAAR = 1500;

/** Ett sår per dette, så lenge hullet står åpent. */
const SAAR_TAKT = 1300;

/** Naboen tåler tre. Den fjerde finnes ikke. */
const NABO_LIV = 3;

/** Under dette gikk hun i bakken, og rekka brast rundt henne. */
const UTE_AV_KAMP = 0.28;

/** Hvor mye mindre hun tar mens rekka står rundt henne. */
const DEKNING_I_REKKA = 0.6;

/**
 * Bølgene fra kongens hær.
 *
 * De kommer nordfra, i takt, og de blir hardere. Ikke flere og flere: en
 * skjoldborg som møter tolv mann samtidig er ikke en formasjon, den er en
 * knipe. To til tre om gangen er nok til at trykket aldri tar slutt.
 */
const BOLGER: { ved: number; defer: string[] }[] = [
    { ved: 0, defer: ['spydmann', 'spydmann'] },
    { ved: 12_000, defer: ['oksekar', 'spydmann'] },
    { ved: 26_000, defer: ['huskarl', 'spydmann'] },
    { ved: 40_000, defer: ['oksekar', 'oksekar'] },
    { ved: 54_000, defer: ['huskarl', 'berserk'] },
    { ved: 68_000, defer: ['spydmann', 'oksekar'] },
    { ved: 80_000, defer: ['berserk'] },
];

/** Hvor mye våpenet er verdt i en rekke. `iRekke` får endelig en leser. */
export const REKKE_FAKTOR: Record<string, number> = {
    god: 1.35,
    brukbar: 0.85,
    ubrukelig: 0.4,
};

export interface SkjoldborgKroker {
    settUt: (defId: string, x: number, y: number, valg: Partial<Fiende>) => Fiende | null;
    hentInn: (f: Fiende) => void;
    spiller: () => Sprite;
    /** Stiller henne opp i rekka. Man går ikke inn i en skjoldborg på skrå. */
    settSpiller: (x: number, y: number) => void;
    /** Eleven kan ikke dø i rekka. Rekka brister i stedet. */
    ovingsmodus: (pa: boolean) => void;
    /** Sperrer rullen: i en skjoldborg finnes det ingen vei til siden. */
    settIRekke: (pa: boolean) => void;
    /** Hvor mye mindre hun tar mens mannen til høyre dekker halve henne. */
    settDekning: (faktor: number) => void;
    /** Blod og støv der en mann tar imot for henne. */
    saarEffekt: (x: number, y: number) => void;
    /** Streken i gresset der rekka står. */
    leggUtLinje: (fraX: number, tilX: number, y: number) => void;
    taOppLinje: () => void;
    musikkRot: number;
}

/** Én mann i rekka: hvem han er, hvor han står, og hvor mye han tåler. */
interface Nabo {
    fiende: Fiende;
    navn: string;
    liv: number;
    falt: boolean;
}

export class Skjoldborg {
    private kroker: SkjoldborgKroker;
    private fase: SkjoldborgFase = 'ingen';
    private rekka: Nabo[] = [];
    /** Mannen til venstre. Ham dekker skjoldet hennes. */
    private venstre: Nabo | null = null;
    private fiender: Fiende[] = [];
    private gaatt = 0;
    private naade = 0;
    private framme = 0;
    private varslet = false;
    private saarTimer = 0;
    private nesteBolge = 0;
    /** Ruta hun har fått i rekka. Klemma måles fra den, ikke fra endene. */
    private minX = 0;
    /** Kortet oppdateres én gang i sekundet, ikke seksti. */
    private tellerTimer = 0;
    private etterpa = 0;
    private utfall: SkjoldborgUtfall = 'brast';

    constructor(kroker: SkjoldborgKroker) {
        this.kroker = kroker;
    }

    get naa(): SkjoldborgFase {
        return this.fase;
    }

    /**
     * Setter slaget i den tilstanden lagringen sier.
     *
     * Samme regel som for båten i vika og huden på vollen: scenen bygges på
     * nytt hver gang eleven reiser, og et felt i minnet er ikke sant.
     */
    gjenopprett(): void {
        const store = useRpgStore.getState();
        if (store.steg.includes(K4.slaget)) {
            this.fase = 'over';
            return;
        }
        if (!store.steg.includes(K4.linja)) return;
        fraSpill.emit('oppgave', {
            tittel: 'Rekka',
            mal: 'Skofte har vist deg hvor du skal stå. Still deg i rekka når du er klar.',
        });
    }

    /**
     * Rekka stiller seg opp.
     *
     * Navnet på mannen til venstre er kapittelets ene valg gjort synlig: er
     * det sønnen din, står han der fordi du sa ja. Er det Halvor på Sæbø,
     * står han der uansett - og han er femten han også. Valget flyttet ikke et
     * barn ut av rekka. Det avgjorde hvem sitt barn det er.
     */
    still(): void {
        if (this.fase === 'staar' || this.fase === 'over') return;
        const store = useRpgStore.getState();
        this.fase = 'staar';
        this.gaatt = 0;
        this.naade = NAADE;
        this.framme = 0;
        this.varslet = false;
        this.saarTimer = 0;
        this.nesteBolge = 0;
        this.tellerTimer = 0;

        const y = REKKA_Y * TILE + 8;
        this.kroker.leggUtLinje(REKKA_X.fra * TILE, REKKA_X.til * TILE + 16, y);

        // Hennes plass er midt i rekka. Ikke i enden: en flanke er en annen
        // kamp, og den er ikke den kapittelet handler om.
        const min = Math.round((REKKA_X.fra + REKKA_X.til) / 2);
        this.minX = min * TILE + 8;
        this.kroker.settSpiller(this.minX, y);
        this.kroker.ovingsmodus(true);
        this.kroker.settIRekke(true);
        this.kroker.settDekning(DEKNING_I_REKKA);

        const sonnenMed = Boolean(store.flagg[K4_FLAGG.sonnenMed]);
        // Bare de to naboene har navn over hodet, og det er ikke sparsomhet.
        // Sju navneskilt på sju mann som står skulder ved skulder blir én
        // grøt av pikselfont - det er den samme fella som tre menn på samme
        // rute i vika i 872. Og de to som har navn, er nøyaktig de to regelen
        // handler om: han du dekker, og han som dekker deg.
        const menn: { x: number; navn: string; skilt: boolean }[] = [
            { x: min - 6, navn: 'Bård på Sæbø', skilt: false },
            { x: min - 4, navn: 'Torfinn', skilt: false },
            { x: min - 2, navn: sonnenMed ? 'Åsmund' : 'Halvor på Sæbø', skilt: true },
            { x: min + 2, navn: 'Skofte', skilt: true },
            { x: min + 4, navn: 'Grim Enøyde', skilt: false },
            { x: min + 6, navn: 'Ivar på Berg', skilt: false },
        ];
        for (const m of menn) {
            // Bøndene settes ut som fredelige og udødelige. De slåss ikke for
            // eleven - de *står* der, og det er alt en rekke er. Det som kan
            // skje med dem, eier denne modulen, ikke fiendesystemet.
            const f = this.kroker.settUt('bonde-i-rekka', m.x * TILE + 8, y, {
                tilstand: 'sover',
                fredelig: true,
                udodelig: true,
                navn: m.skilt ? m.navn : undefined,
            });
            if (!f) continue;
            const nabo: Nabo = { fiende: f, navn: m.navn, liv: NABO_LIV, falt: false };
            this.rekka.push(nabo);
            if (m.x === min - 2) this.venstre = nabo;
        }

        startMusikk(this.kroker.musikkRot, 1);
        fraSpill.emit('replikk', {
            hvem: 'Skofte',
            tekst: 'Skjold mot skjold. Du dekker Åsmund, jeg dekker deg. Går du fram, står han bar - og da er det du som drepte ham.',
        });
        this.oppdaterKort();
    }

    /** Ett bilde: klokka, bølgene, hullet og rekka. */
    oppdater(delta: number): void {
        if (this.fase === 'over' && this.etterpa > 0) {
            this.etterpa -= delta;
            if (this.etterpa <= 0) this.gjorOpp();
            return;
        }
        if (this.fase !== 'staar') return;

        this.gaatt += delta;
        this.sendBolger();
        this.holdPlassen();
        this.holdDemUte();
        this.sjekkHullet(delta);
        if (this.fase !== 'staar') return;
        this.sjekkHenne();
        if (this.fase !== 'staar') return;

        this.tellerTimer -= delta;
        if (this.tellerTimer <= 0) {
            this.tellerTimer = 1000;
            this.oppdaterKort();
        }
        if (this.gaatt >= HOLDE_MS) this.avgjor('holdt');
    }

    /** Kongens menn kommer ned fra veien i nord, i takt. */
    private sendBolger(): void {
        while (this.nesteBolge < BOLGER.length && this.gaatt >= BOLGER[this.nesteBolge].ved) {
            const bolge = BOLGER[this.nesteBolge];
            this.nesteBolge += 1;
            const midt = Math.round((REKKA_X.fra + REKKA_X.til) / 2);
            bolge.defer.forEach((defId, i) => {
                // Tre ruter mellom dem, og en rad forskjøvet annenhver. Står de
                // tettere, legger navneskiltene seg oppå hverandre, og eleven
                // ser én grøt i stedet for tre motstandere hun skal lese hver
                // for seg - samme fella som i vika i 872.
                const x = (midt - 3 + i * 3) * TILE + 8;
                const y = (REKKA_Y - 8 - (i % 2)) * TILE;
                const f = this.kroker.settUt(defId, x, y, {
                    tilstand: 'jager',
                    navn: ENEMY_BY_ID[defId]?.name,
                });
                if (f) this.fiender.push(f);
            });
            if (this.nesteBolge > 1) sfx.horn();
        }
    }

    /**
     * Hun har en plass, og hun blir i den.
     *
     * Dette er den regelen som ikke lar seg si med ord. En skjoldborg er ikke
     * et sted man står frivillig - det er et sted man ikke kommer seg vekk
     * fra: rekka står bak, naboene står på sidene, og elva er i ryggen. Uten
     * denne klemma driver eleven ut av rekka i det første tilbakestøtet, og da
     * er formasjonen bare en kulisse hun slåss foran.
     *
     * Bakover og til sidene er stengt. **Framover er åpent**, og det er med
     * vilje: den ene veien ut av rekka er den som dreper mannen til venstre,
     * og en feil eleven ikke kan gjøre, er en feil hun aldri lærer noe av.
     */
    private holdPlassen(): void {
        const s = this.kroker.spiller();
        const y = REKKA_Y * TILE + 8;
        // Plassen er hennes egen, ikke hele rekka. Klemte vi henne bare
        // innenfor endene av linja, kunne hun skyves tvers forbi Skofte og bli
        // stående alene på flanken mens skiltet over hodet hans lyste tolv
        // ruter unna - og «mannen til venstre» ville ikke lenger vært noen.
        const venstreKant = this.minX - PLASSEN;
        const hoyreKant = this.minX + PLASSEN;
        let flyttet = false;
        if (s.y > y) {
            // Rekka bak henne. Tilbakestøtet fra et slag skal kjennes, men det
            // skal ikke flytte henne ut av rekka - de bak tar imot.
            s.setPosition(s.x, y);
            flyttet = true;
        }
        if (s.x < venstreKant || s.x > hoyreKant) {
            s.setPosition(Math.min(hoyreKant, Math.max(venstreKant, s.x)), s.y);
            flyttet = true;
        }
        if (!flyttet) return;
        const kropp = s.body as Phaser.Physics.Arcade.Body | null;
        if (kropp) kropp.setVelocity(0, Math.min(0, kropp.velocity.y));
    }

    /**
     * Og de kommer ikke gjennom.
     *
     * Motparten stanses en rute nord for streken, og det er den viktigste
     * enkeltregelen på hele sletta. Uten den går kongens menn tvers gjennom
     * rekka - fiende-AI-en går rett mot eleven, og skjoldene til seks bønder
     * er ingen vegg for den - og da står hun omringet av folk som er kommet
     * inn bakfra mens rekka «står». En skjoldborg fienden spaserer gjennom, er
     * en kulisse.
     *
     * Følgen er det som gjør kampen lesbar: alt kommer forfra. Garden dekker
     * 120 grader, og her peker de 120 gradene nøyaktig dit alt kommer fra.
     * Spydmannen når over kanten; øksekaren må helt inntil for å nå. Det er
     * ikke balansering, det er rekkevidde.
     */
    private holdDemUte(): void {
        const grense = REKKA_Y * TILE + 8 - TILE;
        for (const f of this.fiender) {
            if (f.dodd || f.sprite.y <= grense) continue;
            f.sprite.setPosition(f.sprite.x, grense);
            const kropp = f.sprite.body as Phaser.Physics.Arcade.Body | null;
            if (kropp) kropp.setVelocity(kropp.velocity.x, Math.min(0, kropp.velocity.y));
        }
    }

    /**
     * Hullet.
     *
     * Regelen har tre trinn med vilje. Først et rop - eleven skal få vite at
     * hun står feil før noe skjer. Så begynner naboen å ta imot slagene som
     * skulle vært hennes. Og til slutt faller han, og da brister rekka.
     *
     * Straffen kommer aldri uten varsel, og den kommer alltid hvis hun blir
     * stående. Det er den kombinasjonen som gjør regelen til noe hun lærer i
     * stedet for noe hun blir sur på.
     */
    private sjekkHullet(delta: number): void {
        if (this.naade > 0) {
            this.naade -= delta;
            return;
        }
        const s = this.kroker.spiller();
        const framme = s.y < REKKA_Y * TILE + 8 - FRAMME;

        if (!framme) {
            if (this.framme > 0) this.kroker.settDekning(DEKNING_I_REKKA);
            this.framme = 0;
            this.saarTimer = 0;
            return;
        }

        // Ute av rekka er ute av dekningen. Mannen til høyre kan ikke holde
        // skjoldet over en som har gått fra ham.
        if (this.framme === 0) this.kroker.settDekning(1);
        this.framme += delta;

        if (this.framme > HULL_VARSEL && !this.varslet) {
            this.varslet = true;
            sfx.galt();
            fraSpill.emit('replikk', {
                hvem: 'Skofte',
                tekst: 'TILBAKE I REKKA!',
            });
        }
        if (this.framme < HULL_SAAR) return;

        this.saarTimer -= delta;
        if (this.saarTimer > 0) return;
        this.saarTimer = SAAR_TAKT;
        this.saar(this.venstre);
    }

    /** Naboen tar imot et slag som skulle vært hennes. */
    private saar(nabo: Nabo | null): void {
        if (!nabo || nabo.falt) return;
        nabo.liv -= 1;
        const { x, y } = nabo.fiende.sprite;
        this.kroker.saarEffekt(x, y);
        sfx.skade();
        if (nabo.liv > 0) {
            fraSpill.emit('replikk', {
                hvem: nabo.navn,
                tekst: nabo.liv === 2 ? 'Far! Hvor er du?' : 'Jeg greier ikke... jeg ser ingenting.',
            });
            return;
        }
        nabo.falt = true;
        this.kroker.hentInn(nabo.fiende);
        this.avgjor('brast');
    }

    /** Går hun selv i bakken, brister rekka rundt henne. */
    private sjekkHenne(): void {
        const store = useRpgStore.getState();
        if (store.hp / Math.max(1, maksVerdier(store).hp) <= UTE_AV_KAMP) this.avgjor('brast');
    }

    private oppdaterKort(): void {
        const igjen = Math.max(0, Math.ceil((HOLDE_MS - this.gaatt) / 1000));
        fraSpill.emit('oppgave', {
            tittel: 'Hold rekka',
            mal: 'Stå. Ikke gå fram. Skjoldet ditt dekker halve mannen til venstre.',
            teller: `${igjen} s`,
        });
    }

    private avgjor(utfall: SkjoldborgUtfall): void {
        if (this.fase !== 'staar') return;
        this.fase = 'over';
        this.utfall = utfall;
        this.etterpa = 1200;
        this.kroker.ovingsmodus(false);
        this.kroker.settIRekke(false);
        this.kroker.settDekning(1);
        for (const f of this.fiender) this.kroker.hentInn(f);
        this.fiender = [];
        for (const n of this.rekka) if (!n.falt) this.kroker.hentInn(n.fiende);
        this.rekka = [];
        this.venstre = null;
        this.kroker.taOppLinje();
        startEnTone(147);
        fraSpill.emit('motstander', null);
        fraSpill.emit('oppgave', null);
    }

    /**
     * Regnskapet.
     *
     * Begge utgangene gir begrepet og fører kapittelet videre. Slaget er
     * avgjort av noe annet enn henne - kongen faller på Stiklestad uansett - og
     * det ville vært en løgn å la spillet si noe annet. Det hun avgjorde, står
     * i hvem som står igjen når det er stille.
     */
    private gjorOpp(): void {
        const store = useRpgStore.getState();
        store.fullforSteg(K4.slaget);
        store.larBegrep('skjoldborg', 'forstatt');
        store.fullforPuzzle('skjoldborgen', 'Du sto i en skjoldborg');
        startMusikk(this.kroker.musikkRot, 0);

        const sonnenMed = Boolean(store.flagg[K4_FLAGG.sonnenMed]);
        const gutten = sonnenMed ? 'Åsmund' : 'Halvor på Sæbø';

        if (this.utfall === 'holdt') {
            store.settFlagg(K4_FLAGG.holdtLinja);
            store.giAere(20, 'Du sto der rekka sto. Hele fylket vet hvem som holdt.');
            fraSpill.emit('beskjed', {
                tittel: 'Rekka holdt',
                tekst: [
                    'Det tar slutt uten at noen blåser i noe. De foran deg slutter å komme, og så står det bare folk og puster.',
                    `${gutten} står ved siden av deg med skjoldet i to hender. Han har ikke flyttet seg. Ingen av dere har flyttet seg, og det er derfor dere står.`,
                    'Lenger nord roper de at kongen er falt. Tore Hund gikk inn under merket hans med spydet, og Kalv Arnesson tok ham i halsen. Det sier de. Du så ingenting av det - du så bare skjoldet foran deg i halvannen time.',
                ].join('\n\n'),
                knapp: 'Se deg om',
            });
            return;
        }

        store.settFlagg(K4_FLAGG.brast);
        store.giAere(-10, 'Rekka brast der du sto. Alle vet hvor hullet var.');
        fraSpill.emit('beskjed', {
            tittel: 'Rekka brast',
            tekst: [
                'Det gikk fort. Ett hull, og så var de inne bak, og en rekke som er kommet inn bakfra er ikke en rekke lenger - den er folk som løper hver for seg mot elva.',
                `${gutten} ligger der du sto. Han er femten vintrer, og skjoldet ditt skulle dekket halve ham.`,
                'Slaget vant dere likevel. Kongen falt lenger nord, og ingen der oppe vet at det var et hull her nede. Det gjør du.',
            ].join('\n\n'),
            knapp: 'Reis deg',
        });
    }

    /** Hvor mye våpenet hennes duger her. `VaapenKamp.iRekke`, endelig lest. */
    skadefaktor(rekkeVerdi: string | undefined): number {
        if (this.fase !== 'staar') return 1;
        return REKKE_FAKTOR[rekkeVerdi ?? 'brukbar'] ?? 1;
    }

    /** Eleven forlot sletta midt i det. Kortene skal ikke bli hengende. */
    avslutt(): void {
        if (this.fase === 'staar') {
            this.kroker.ovingsmodus(false);
            this.kroker.settIRekke(false);
            this.kroker.settDekning(1);
            this.kroker.taOppLinje();
        }
        this.fiender = [];
        this.rekka = [];
        this.venstre = null;
        fraSpill.emit('motstander', null);
    }
}
