// Ettersøkt (blueprint §8.2): tre nivåer, og to veier ut.
//
//   1 mistenkt   en vakt har sett deg der du ikke skal være. Han kommer for å se nærmere.
//   2 etterlyst  du er sett igjen, eller tatt i tyveri. Alle vaktene på kongens vei leter.
//   3 jaget      du er sett mens du var etterlyst. Vakta løper etter deg.
//
// Nivået synker når ingen ser deg lenge nok (gjem deg). Utveiene: betal boten til en vakt (E, på
// nivå 1-2), eller bli tatt (eller gi deg) og ført til gjaldkeren på Bergenhus. Der får du dommen
// og «Dette vet vi» om tyveribolken i bylova (byen-oppdrag.ts).
//
// Hvem som ser gutten, avgjør vaktene (holmenvakt.ts): de kaller `sett` og `meld`. Witten og rykte
// går gjennom kontrakten i oppdrag-data.ts (`witten:-n`, `rykte:B:-n`), som rollespillsystemet leser.
//
// [V] Gjaldkeren, kongens mann som holdt orden i byen, og at tyven ble ført til ham (bylova 1276,
// blueprint §8.2). [V] Kontoret dømte sine egne etter egne regler (blueprint §8.2). Nivåene, tidene og
// boten i witten er laget for spillet [S]. Hunder (§8.2) er ikke med ennå.
//
// Boten hos en vakt følger ryktet hos kongens menn (likt: mindre, mistrodd: mer), og den må kunne
// betales: har gutten ikke nok witten, kan han bare gi seg. Hos gjaldkeren blir boten dobbelt så stor
// andre gang (`gjaldker-bot`), slik bylova øker straffen for hver gang [V tyveribolken, §8.2].
// Nivået lagres i `bryggen-ettersokt` (jaget lagres som etterlyst: ingen løper etter ham etter en omstart).
import * as THREE from 'three';
import { TYVERI_VET } from '../bygg/byen-oppdrag';
import { rykteNaa } from '../bygg/rpg-data';
import type { Samtale } from '../bygg/samtaler';
import type { Snakkbar } from '../motor/streaming';
import type { InputFrame } from '../motor/input';
import { aktivtRollespill } from './rpg';
import { finnPerson, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export type Niva = 0 | 1 | 2 | 3;
export type Grunn = 'snik' | 'tyveri' | 'port';

export const NIVA_NAVN = ['', 'Mistenkt', 'Etterlyst', 'Jaget'] as const;

/** Sekunder uten å bli sett før nivået synker ett trinn [S]. */
const GLEM: Record<1 | 2 | 3, number> = { 1: 14, 2: 28, 3: 10 };
/** Boten hos en vakt, i witten, med ukjent rykte [S]. */
export const BOT: Record<1 | 2, number> = { 1: 1, 2: 3 };
/** Det man mister hos gjaldkeren første gang; andre gang dobbelt [S]. */
const DOM_BOT = 4;
const LAGER = 'bryggen-ettersokt';

/** Boten hos en vakt nå: én mindre for hvert rykte-trinn over ukjent hos kongens menn, én mer under [S]. */
export function botNaa(niva: 1 | 2): number {
    return Math.max(0, BOT[niva] - rykteNaa('B'));
}

/** Witten i pungen (rollespillet), eller nok til alt i gråboksen. */
const pung = (): number => aktivtRollespill()?.witten ?? Infinity;

/** Hvor gutten blir ført: foran gjaldkeren ved skriverboden (settes av holmenvakt.ts). */
export const GJALDKER_PLASS = { pos: new THREE.Vector3(), yaw: 0 };

export interface EttersoktHud {
    niva: Niva;
    navn: string;
    /** 0-1: hvor langt unna det er at nivået synker. */
    glemmer: number;
    sekIgjen: number;
    grunn: Grunn;
    /** Hva eleven kan gjøre nå. */
    tips: string;
    /** Et nytt nivå akkurat nå (for animasjonen). */
    n: number;
    /** 0-1: svart overgang mens vakta fører gutten til gjaldkeren. */
    svart: number;
    svartTekst: string;
}

/**
 * Tilstanden alle systemene kan lese og melde til. Ett ettersøkt-nivå for hele byen.
 */
export const ETTERSOKT = {
    niva: 0 as Niva,
    grunn: 'snik' as Grunn,
    /** Der en vakt sist så gutten. */
    sist: new THREE.Vector3(),
    /** Sekunder siden noen så ham. */
    usett: 0,
    /** Sekunder siden nivået sist steg. */
    siden: 99,
    /** Vakta fører gutten til gjaldkeren nå: ingen jakter. */
    fores: false,
    /** Teller hver gang nivået endres (HUD-animasjon). */
    n: 0,
    /** Systemet lytter (settes av `lagEttersokt`). */
    onEndring: (() => undefined) as (niva: Niva, var_: Niva) => void,

    /** En vakt ser gutten der han ikke skal være (eller mens han er ettersøkt). */
    sett(p: THREE.Vector3, grunn: Grunn = 'snik'): void {
        this.sist.copy(p);
        this.usett = 0;
        if (this.fores) return;
        if (this.niva === 0) this.sett_(1, grunn);
        else if (this.niva < 3 && this.siden > 2.5) this.sett_((this.niva + 1) as Niva, grunn);
    },

    /** En vakt ser fortsatt gutten (uten at nivået stiger): han blir ikke glemt. */
    ser(p: THREE.Vector3): void {
        this.sist.copy(p);
        this.usett = 0;
    },

    /** Sett nivået direkte (tyveri gir etterlyst med en gang). Senker aldri. */
    meld(niva: Niva, grunn: Grunn, p?: THREE.Vector3): void {
        if (p) this.sist.copy(p);
        this.usett = 0;
        if (niva > this.niva && !this.fores) this.sett_(niva, grunn);
    },

    sett_(niva: Niva, grunn: Grunn): void {
        const var_ = this.niva;
        this.niva = niva;
        if (niva > 0 && (grunn === 'tyveri' || this.grunn !== 'tyveri')) this.grunn = grunn;
        this.siden = 0;
        this.n++;
        this.onEndring(niva, var_);
    },

    /** Glem alt (boten er betalt, dommen er falt). */
    nullstill(): void {
        const var_ = this.niva;
        this.niva = 0;
        this.grunn = 'snik';
        this.usett = 0;
        this.n++;
        if (var_) this.onEndring(0, var_);
    },
};

/** Vaktene som kan ta imot bot (holmenvakt.ts melder dem). */
export interface Vaktperson {
    navn: string;
    pos: THREE.Vector3;
    /** Jager gutten nå (nivå 3). */
    jager: boolean;
}
export const VAKTPERSONER: Vaktperson[] = [];

export function lagEttersokt(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let svart = 0;
    let svartTekst = '';
    let foreTid = -1;
    let venterGjaldker = false;
    let naerVakt: Vaktperson | null = null;

    // Kommandoene i samtalen hos gjaldkeren (`ettersokt:fri`). Resten går videre til oppdragene og
    // rollespillsystemet.
    const gjor = oppdrag.gjor.bind(oppdrag);
    oppdrag.gjor = (h: string) => {
        gjor(h);
        for (const del of h.split(';')) if (del.trim() === 'ettersokt:fri') ETTERSOKT.nullstill();
    };

    // Nivået fra forrige gang (ikke i et nytt spill). Jaget blir etterlyst: ingen løper etter ham nå.
    try {
        const raa = oppdrag.nyttSpill ? null : (JSON.parse(localStorage.getItem(LAGER) ?? 'null') as { niva?: unknown; grunn?: unknown } | null);
        const n = typeof raa?.niva === 'number' ? Math.min(2, Math.max(0, Math.round(raa.niva))) : 0;
        if (n > 0) {
            ETTERSOKT.niva = n as Niva;
            ETTERSOKT.grunn = raa?.grunn === 'tyveri' || raa?.grunn === 'port' ? raa.grunn : 'snik';
            ETTERSOKT.usett = 0;
            ETTERSOKT.n++;
        }
    } catch {
        // Ødelagt eller blokkert lagring: start uten.
    }
    const lagre = () => {
        try {
            if (ETTERSOKT.niva === 0) localStorage.removeItem(LAGER);
            else localStorage.setItem(LAGER, JSON.stringify({ niva: ETTERSOKT.niva, grunn: ETTERSOKT.grunn }));
        } catch {
            // Lagring blokkert: gjelder bare denne økta.
        }
    };
    // «Begynn på nytt» glemmer det også.
    oppdrag.utvidelser.push({ nullstill: () => ETTERSOKT.nullstill() });

    ETTERSOKT.onEndring = (niva, var_) => {
        lagre();
        // Panelet øverst i midten spretter fram med nivået (ui/Ettersokt.tsx), så ingen melding her.
        if (niva > var_) {
            k.cam.addShake(0.03 + niva * 0.02);
            // Tre slag på en dyp klokke, høyere for hvert nivå.
            const f = 196 * (1 + niva * 0.12);
            k.lyd?.lyd.toner([[f, 0, 0.5], [f * 1.5, 0.12, 0.4], [f * 0.75, 0.24, 0.7]], 0.12 + niva * 0.03);
        } else if (niva === 0 && var_ > 0 && !ETTERSOKT.fores) {
            k.flash('Ingen leter etter deg lenger.', 2.5);
            k.lyd?.lyd.toner([[523.3, 0, 0.3], [659.3, 0.1, 0.5]], 0.08);
        }
        k.hudSnart();
    };

    /** Samtalen hos gjaldkeren: dommen etter hva gutten gjorde, og tyveribolken. */
    function dom(): Samtale {
        const tyv = ETTERSOKT.grunn === 'tyveri';
        const andreGang = oppdrag.flagg.has('gjaldker-bot');
        const bot = andreGang ? DOM_BOT * 2 : DOM_BOT;
        // Har han ikke nok, står svaret låst med grunnen under (rpg.ts).
        const betal = { tekst: `Jeg betaler boten (${bot} witten).`, til: 'betal', krav: { witten: bot } };
        return {
            start: {
                tekst: tyv
                    ? 'Så du er gutten som tok av kongens fisk. Vaktene bandt fisken på ryggen din, slik loven sier. Vet du hva loven sier om tyver?'
                    : 'Vakta sier du lusket rundt kongens vaktbu og løp fra dem. Du stjal ingenting. Men du lot som du var en tyv.',
                gest: 'peke',
                valg: [
                    { tekst: 'Jeg har ingen penger.', til: 'ingen' },
                    ...(tyv ? [{ tekst: 'Jeg var sulten.', til: 'sulten' }] : []),
                    betal,
                ],
            },
            sulten: {
                tekst: 'Sulten? Du har mat i schøtstua hver dag, tyskergutt. Loven tilgir den som stjeler fordi han sulter og ikke kan arbeide. Det gjelder ikke deg.',
                gest: 'riste',
                valg: [{ tekst: 'Jeg har ingen penger.', til: 'ingen' }, betal],
            },
            betal: {
                tekst: andreGang
                    ? 'Andre gang, og dobbel bot. Loven er tålmodig, men ikke uten ende. Tredje gang blir det ikke penger.'
                    : 'Da er saken ute av verden denne gangen. Neste gang blir boten dobbelt så stor.',
                gest: 'nikk',
                gjor: `witten:-${bot};rykte:B:-2;ettersokt:fri;flagg:gjaldker-bot`,
                til: 'vet',
            },
            ingen: {
                tekst: 'Da skriver jeg deg i boka, og sender bud til husbonden din. Han betaler for deg, og du får nok høre det. Neste gang blir det pisken.',
                gest: 'riste',
                gjor: 'rykte:B:-3;rykte:K:-3;ettersokt:fri;flagg:gjaldker-boka',
                til: 'vet',
            },
            vet: { hvem: 'Dette vet vi', vet: true, tekst: TYVERI_VET, til: 'slutt' },
            slutt: { tekst: 'Gå. Og la meg slippe å se deg igjen.', gest: 'vift' },
        };
    }

    function fore(): void {
        if (ETTERSOKT.fores) return;
        ETTERSOKT.fores = true;
        foreTid = 0;
        svartTekst = ETTERSOKT.grunn === 'tyveri'
            ? 'Vakta binder fisken på ryggen din og fører deg til gjaldkeren.'
            : 'Vakta griper deg i armen og fører deg til gjaldkeren på Bergenhus.';
        k.cam.addShake(0.08);
        k.lyd?.lyd.spill('kamp', 'blokk', { styrke: 0.7 });
        k.hudSnart();
    }

    return {
        navn: 'ettersokt',
        prompt(gutt) {
            naerVakt = null;
            if (ETTERSOKT.fores || ETTERSOKT.niva === 0) return null;
            for (const v of VAKTPERSONER) {
                if (!naer(gutt, v.pos, 2.4)) continue;
                naerVakt = v;
                if (ETTERSOKT.niva === 3) return `E: Gi deg til ${v.navn}`;
                const bot = botNaa(ETTERSOKT.niva as 1 | 2);
                if (bot === 0) return `E: Gå fram til ${v.navn} (han kjenner deg)`;
                if (bot > pung()) return `E: Gi deg til ${v.navn} (du har ikke ${bot} witten til boten)`;
                return `E: Gå fram og betal boten til ${v.navn} (${bot} witten)`;
            }
            return null;
        },
        trykk() {
            const v = naerVakt;
            if (!v || ETTERSOKT.niva === 0) return null;
            if (ETTERSOKT.niva === 3) {
                fore();
                return null;
            }
            const bot = botNaa(ETTERSOKT.niva as 1 | 2);
            // Ikke nok i pungen: han kan bare gi seg, og blir ført til gjaldkeren.
            if (bot > pung()) {
                fore();
                return null;
            }
            if (bot === 0) {
                ETTERSOKT.nullstill();
                return `${v.navn} kjenner deg. «Gå hjem, junge. Denne gangen har jeg ikke sett deg.»`;
            }
            oppdrag.gjor(`witten:-${bot};rykte:B:-1`);
            ETTERSOKT.nullstill();
            k.lyd?.lyd.toner([[1318, 0, 0.12], [1568, 0.07, 0.12], [1175, 0.14, 0.2]], 0.07);
            const s = finnPerson(k.world, 'vakta');
            if (s && naer(k.player.pos, s.pos, 3)) k.world.si?.('Vakta', 'Hold deg unna vaktbua, gutt.', s.pos);
            return `Du gir ${v.navn} ${bot} witten. Han stikker myntene i pungen og ser bort. «Hold deg unna vaktbua.»`;
        },
        steg(dt: number, _inp: InputFrame) {
            ETTERSOKT.siden += dt;
            if (ETTERSOKT.fores) {
                foreTid += dt;
                svart = Math.min(1, foreTid / 0.9);
                if (foreTid > 1.4 && !venterGjaldker) {
                    k.folk.slutt();
                    k.player.teleport(GJALDKER_PLASS.pos, GJALDKER_PLASS.yaw);
                    venterGjaldker = true;
                }
                if (venterGjaldker) {
                    const g: Snakkbar | null = finnPerson(k.world, 'gjaldkeren');
                    if (g && foreTid > 2.6) {
                        venterGjaldker = false;
                        ETTERSOKT.fores = false;
                        foreTid = -1;
                        svart = 0;
                        k.folk.aapne(dom(), g, k.player.pos);
                        k.hudSnart();
                    }
                }
                return true;
            }
            if (ETTERSOKT.niva === 0) return false;
            ETTERSOKT.usett += dt;
            // Fanget: vakta er over gutten mens han er etterlyst eller jaget.
            if (ETTERSOKT.niva >= 2) {
                for (const v of VAKTPERSONER) {
                    if (v.jager && naer(k.player.pos, v.pos, 1.05, 1.5)) {
                        fore();
                        return true;
                    }
                }
            }
            const lvl = ETTERSOKT.niva as 1 | 2 | 3;
            if (ETTERSOKT.usett > GLEM[lvl]) {
                ETTERSOKT.usett = 0;
                ETTERSOKT.siden = 0;
                const var_ = ETTERSOKT.niva;
                ETTERSOKT.niva = (lvl - 1) as Niva;
                ETTERSOKT.n++;
                ETTERSOKT.onEndring(ETTERSOKT.niva, var_);
            }
            return false;
        },
        rask: () => ETTERSOKT.niva > 0 || ETTERSOKT.fores,
        hud(): EttersoktHud | null {
            if (ETTERSOKT.niva === 0 && !ETTERSOKT.fores) return null;
            const lvl = Math.max(1, ETTERSOKT.niva) as 1 | 2 | 3;
            const igjen = Math.max(0, GLEM[lvl] - ETTERSOKT.usett);
            const sett = ETTERSOKT.usett < 0.5;
            const tips = ETTERSOKT.niva === 3
                ? 'Løp og kom deg ut av syne, eller gi deg (E ved vakta).'
                : sett
                    ? 'Noen ser deg nå. Kom deg bak noe!'
                    : botNaa(Math.min(2, ETTERSOKT.niva) as 1 | 2) > pung()
                        ? `Hold deg skjult i ${Math.ceil(igjen)} s. Du har ikke nok witten til boten.`
                        : `Hold deg skjult i ${Math.ceil(igjen)} s, eller betal boten til en vakt (E).`;
            return {
                niva: ETTERSOKT.niva, navn: NIVA_NAVN[ETTERSOKT.niva], glemmer: Math.min(1, ETTERSOKT.usett / GLEM[lvl]),
                sekIgjen: igjen, grunn: ETTERSOKT.grunn, tips, n: ETTERSOKT.n, svart, svartTekst,
            };
        },
        dispose() {
            ETTERSOKT.onEndring = () => undefined;
            ETTERSOKT.niva = 0;
            ETTERSOKT.fores = false;
            VAKTPERSONER.length = 0;
        },
    };
}
