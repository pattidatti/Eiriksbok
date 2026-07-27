// Transporten under Minnevokterens hall: hvem andre er inne, og hvor står de.
//
// Regelen som styrer alt her: **hubben er sammen, epokene er alene**
// (blueprint §4.1). Modulen lastes bare av `useHubRom`, som bare kobler seg til
// når stedet eleven står på har `flerspiller: true` - og det har bare hallen.
// Ingen epoke kommer noen gang til å ha nettverkskode i seg.
//
// Mønsteret er kopiert fra `features/music/.../useRealtimeComposition.ts`, ikke
// fra quiz battle: en presence-node ryddet av `onDisconnect()`, og granulære
// oppdateringer på undernoder i stedet for å skrive hele dokumentet.
//
// Budsjett: posisjon ti ganger i sekundet per elev, og maks seksten i rommet.
// RTDB tåler det med god margin. Den tåler *ikke* kampsynk på seksti bilder i
// sekundet, og det er en av grunnene til at det ikke finnes kamp her inne.

import {
    get,
    onDisconnect,
    onValue,
    ref,
    remove,
    set,
    update,
    type DatabaseReference,
} from 'firebase/database';
import { db } from '../../../lib/firebase';
import { trygtIkon } from '../data/folelser';
import type { AppearanceChoice, ClassId, Gjest, Retning, Stilling } from '../types';
import { gjestenavn } from './navnevakt';

const ROT = 'rpg-hub/rom';

/**
 * Hvor mange som får plass i ett rom.
 *
 * Taket er ikke en nettverksgrense, det er en tegnegrense (fallgruve 10): uten
 * det får du seksti figurer med navneskilt på en Chromebook og en bildefrekvens
 * på ti. Seksten er valgt fordi det er omtrent en halv klasse - stort nok til
 * at hallen føles befolket, lite nok til at den går rundt.
 */
export const MAKS_I_ROM = 16;

/** Ti ganger i sekundet. Se budsjettet over. */
const TAKT_MS = 100;

/**
 * Hvor ofte vi sier fra at vi lever selv om vi står helt stille.
 *
 * Uten pulsen ville en elev som legger fra seg maskinen se ut som et spøkelse
 * for alle andre etter `SPOKELSE_MS`, og bli ryddet bort mens hun faktisk er
 * der.
 */
const PULS_MS = 12000;

/**
 * Eldre enn dette, og vi regner henne som borte.
 *
 * `onDisconnect()` tar de aller fleste. Denne tar resten: en fane som ble
 * drept, et nett som forsvant midt i en skriving, en maskin som gikk i dvale.
 */
const SPOKELSE_MS = 45000;

export interface HubIdentitet {
    navn: string;
    classId: ClassId;
    appearance: AppearanceChoice;
    /** Rustningstrinn 0-3. Tall, ikke gjenstands-id: de andre skal se henne, ikke inventaret. */
    rustning: number;
}

/** Det som endrer seg ti ganger i sekundet. Formen bor i `types.ts`. */
export type HubStilling = Stilling;

export interface HubRom {
    romId: string;
    klientId: string;
    /** Meld egen stilling. Kalles gjerne hvert bilde - takten holdes her inne. */
    meld: (stilling: HubStilling) => void;
    /** Send en følelse, eller null for å ta den bort. */
    settFolelse: (emoji: string | null) => void;
    /** Endret utseende (ny rustning) mens hun står i hallen. */
    settIdentitet: (identitet: HubIdentitet) => void;
    forlat: () => void;
}

/**
 * Hvilken tilkobling som eier noden akkurat nå.
 *
 * React kjører hver effekt to ganger under StrictMode: den kobler til, river
 * ned, og kobler til igjen. Begge tilkoblingene peker på **samme** node, for
 * klient-id-en er den samme personen i den samme fanen - og da river den
 * førstes opprydding beina under den andre.
 *
 * Telleren settes med én gang `blimMed` begynner, ikke når den er ferdig, så
 * den som *startet* sist eier noden uansett hvilken rekkefølge svarene kommer
 * i. En tilkobling som ikke lenger er eier melder seg av sin egen lytter og
 * lar noden være i fred.
 */
let eier = 0;

/** Id-en de andre kjenner oss på. */
const ANON_NOKKEL = 'gravity_anon_id';
const FANE_NOKKEL = 'rpg_fane_id';

/**
 * En id som er stabil for eleven, men unik per fane.
 *
 * Anon-id-en deles med `usePresence`, så hun er den samme personen på tvers av
 * økter. Fane-delen kommer i tillegg fordi to faner er to figurer: uten den
 * ville de to skrevet over hverandre i samme node, og figuren hadde stått og
 * blinket mellom to posisjoner.
 */
function klientId(): string {
    let anon = localStorage.getItem(ANON_NOKKEL);
    if (!anon) {
        anon = `a${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(ANON_NOKKEL, anon);
    }
    let fane = sessionStorage.getItem(FANE_NOKKEL);
    if (!fane) {
        fane = Math.random().toString(36).slice(2, 6);
        sessionStorage.setItem(FANE_NOKKEL, fane);
    }
    // Firebase-nøkler tåler ikke . $ # [ ] /
    return `${anon}-${fane}`.replace(/[.$#[\]/]/g, '-');
}

/**
 * Tjenerens klokke, ikke maskinens.
 *
 * En Chromebook som står tolv minutter feil ville ellers regnet alle andre som
 * spøkelser - eller seg selv som evig fersk. RTDB gir oss avviket gratis, og da
 * blir «hvor gammelt er dette» et spørsmål alle i rommet svarer likt på.
 */
async function tjenertid(): Promise<() => number> {
    try {
        const snap = await get(ref(db, '.info/serverTimeOffset'));
        const avvik = typeof snap.val() === 'number' ? (snap.val() as number) : 0;
        return () => Date.now() + avvik;
    } catch {
        return () => Date.now();
    }
}

/** Rå node slik den ligger i basen. Alt kan mangle - det kommer utenfra. */
export interface RaaGjest {
    navn?: string;
    x?: number;
    y?: number;
    dir?: string;
    positur?: string;
    sitter?: boolean;
    emoji?: string | null;
    classId?: string;
    appearance?: Partial<AppearanceChoice>;
    rustning?: number;
    sist?: number;
}

const RETNINGER: Retning[] = ['ned', 'venstre', 'hoyre', 'opp'];

/**
 * Gjør en rå node om til en gjest vi tør å tegne.
 *
 * Alt som kommer inn her er skrevet av en annen nettleser, og ingenting av det
 * kan tas for gitt. Derfor har hvert felt et fall: en gjest med rar data skal
 * bli en litt kjedelig figur, aldri et unntak midt i tegneløkka.
 */
export function tolkGjest(id: string, raa: RaaGjest | null): Gjest | null {
    if (!raa || typeof raa.x !== 'number' || typeof raa.y !== 'number') return null;
    if (!Number.isFinite(raa.x) || !Number.isFinite(raa.y)) return null;
    return {
        id,
        navn: gjestenavn(raa.navn),
        x: raa.x,
        y: raa.y,
        dir: RETNINGER.includes(raa.dir as Retning) ? (raa.dir as Retning) : 'ned',
        positur: raa.positur === 'gang' ? 'gang' : 'idle',
        sitter: raa.sitter === true,
        emoji: trygtIkon(raa.emoji),
        classId: (raa.classId ?? 'skald') as ClassId,
        appearance: {
            skin: Number(raa.appearance?.skin) || 0,
            hair: Number(raa.appearance?.hair) || 0,
            hairColor: Number(raa.appearance?.hairColor) || 0,
            face: Number(raa.appearance?.face) || 0,
        },
        rustning: Math.max(0, Math.min(3, Number(raa.rustning) || 0)),
        sist: typeof raa.sist === 'number' ? raa.sist : 0,
    };
}

/**
 * Finner et rom det er plass i, eller åpner det neste.
 *
 * Åpne rom som auto-fylles (§4.3): ingen kode, ingen lobby, ingen venting. Alle
 * som er inne havner i samme rom til det er fullt, så åpnes et nytt.
 *
 * Hele treet leses én gang. Det er en bevisst avveining: et rom med seksten
 * elever er noen få kilobyte, og alternativet - en teller ved siden av - kan
 * ikke holdes i takt, for `onDisconnect()` kan sette en verdi men ikke trekke
 * fra en. En teller ville drevet fra virkeligheten hver gang noen mistet nettet,
 * og da fylles rommene med plasser som ikke finnes.
 *
 * > **`.read` må ligge på `rpg-hub/rom`, ikke på det enkelte rommet.** Første
 * > utgave av reglene ga lesetilgang per rom, og da svarte denne lesningen 401.
 * > Feilen var usynlig: `catch`-en falt tilbake på `hall-1`, alle havnet i det
 * > samme rommet for alltid, og taket sluttet å gjelde uten at noe så galt ut
 * > før det sto tretti figurer på en Chromebook. Derfor roper vi nå.
 *
 * To som velger rom i samme sekund kan begge se det samme siste ledige rommet
 * og bli sytten. Det er greit: taket er en tegnegrense med margin, ikke en
 * kapasitet som sprekker.
 */
async function velgRom(naa: () => number): Promise<string> {
    let alle: Record<string, Record<string, RaaGjest>> = {};
    try {
        const snap = await get(ref(db, ROT));
        alle = (snap.val() as typeof alle) ?? {};
    } catch (e) {
        // Uten nettet er hallen tom, og det er en helt gyldig hall - men det er
        // ikke den eneste grunnen til at vi havner her, og den andre er verdt
        // et rop: nektes lesningen, slutter romfordelingen å virke i stillhet.
        console.warn('[rpg] fikk ikke lest romlista - alle havner i hall-1', e);
        return 'hall-1';
    }

    const grense = naa() - SPOKELSE_MS;
    for (let i = 1; i <= 64; i++) {
        const id = `hall-${i}`;
        const rom = alle[id];
        if (!rom) return id;
        const levende = Object.values(rom).filter((g) => (g?.sist ?? 0) > grense).length;
        if (levende < MAKS_I_ROM) return id;
    }
    return 'hall-1';
}

/**
 * Gå inn i hallen.
 *
 * `paaGjester` kalles hver gang bildet av rommet endrer seg - typisk ti ganger
 * i sekundet per elev som beveger seg. Den skal ikke føre til en React-render;
 * se `useHubRom`, som sender listen rett videre til scenen.
 */
export async function blimMed(
    identitet: HubIdentitet,
    paaGjester: (gjester: Gjest[]) => void
): Promise<HubRom> {
    eier += 1;
    const mitt = eier;
    const naa = await tjenertid();
    const id = klientId();
    const romId = await velgRom(naa);
    const minSti = `${ROT}/${romId}/${id}`;
    const minRef: DatabaseReference = ref(db, minSti);
    const romRef = ref(db, `${ROT}/${romId}`);

    let meg = identitet;
    let folelse: string | null = null;

    /**
     * Ryddingen settes opp **før** første skriving (fallgruve 8). Snus
     * rekkefølgen, og eleven mister nettet i mellomrommet, blir hun stående som
     * et spøkelse i rommet for alltid.
     */
    await onDisconnect(minRef).remove();

    const helePosten = (s: HubStilling) => ({
        navn: meg.navn,
        classId: meg.classId,
        appearance: meg.appearance,
        rustning: meg.rustning,
        emoji: folelse,
        x: Math.round(s.x),
        y: Math.round(s.y),
        dir: s.dir,
        positur: s.positur,
        sitter: s.sitter,
        sist: naa(),
    });

    let sisteSendte: HubStilling | null = null;
    let vil: HubStilling = { x: 0, y: 0, dir: 'ned', positur: 'idle', sitter: false };
    let harMeldt = false;
    let sistSendt = 0;
    let identitetSkitten = false;
    let folelseSkitten = false;

    const skrivFeil = (e: unknown) => {
        // Én linje, ikke en dialog. Mister eleven nettet, skal hun kunne gå
        // videre i hallen alene - det er nettopp derfor hallen må være god tom.
        console.warn('[rpg] fikk ikke meldt fra i hallen', e);
    };

    const flush = () => {
        if (!harMeldt) return;
        const tid = naa();
        const flyttet =
            !sisteSendte ||
            Math.abs(sisteSendte.x - vil.x) > 0.5 ||
            Math.abs(sisteSendte.y - vil.y) > 0.5 ||
            sisteSendte.dir !== vil.dir ||
            sisteSendte.positur !== vil.positur ||
            sisteSendte.sitter !== vil.sitter;

        if (identitetSkitten || folelseSkitten || !sisteSendte) {
            // Hele posten. Identiteten valideres av reglene, og den
            // valideringen kjører bare når feltene faktisk skrives.
            identitetSkitten = false;
            folelseSkitten = false;
            sisteSendte = { ...vil };
            sistSendt = tid;
            void set(minRef, helePosten(vil)).catch(skrivFeil);
            return;
        }

        if (!flyttet && tid - sistSendt < PULS_MS) return;
        sisteSendte = { ...vil };
        sistSendt = tid;
        // Bare det som beveger seg. Navn og utseende ligger allerede oppe, og å
        // sende dem ti ganger i sekundet ville tredoblet trafikken for
        // opplysninger som endrer seg én gang i timen.
        void update(minRef, {
            x: Math.round(vil.x),
            y: Math.round(vil.y),
            dir: vil.dir,
            positur: vil.positur,
            sitter: vil.sitter,
            sist: tid,
        }).catch(skrivFeil);
    };

    const takt = window.setInterval(flush, TAKT_MS);

    // Avmeldingen `onValue` gir tilbake, ikke `off(romRef)`. `off` på en
    // referanse river **alle** lyttere på den stien, også dem noen andre har
    // satt opp - og under StrictMode er «noen andre» tilkoblingen som nettopp
    // erstattet oss. Symptomet lignet ikke årsaken: begge elevene sto i basen,
    // begge så seg selv, og ingen så den andre.
    const meldAv = onValue(
        romRef,
        (snap) => {
            const rom = (snap.val() as Record<string, RaaGjest> | null) ?? {};
            const grense = naa() - SPOKELSE_MS;
            const ut: Gjest[] = [];
            for (const [gid, raa] of Object.entries(rom)) {
                if (gid === id) continue;
                const g = tolkGjest(gid, raa);
                if (!g) continue;
                if (g.sist < grense) {
                    // Et spøkelse: fanen døde uten at `onDisconnect` rakk å
                    // rydde. Den som ser det, rydder det - da forsvinner den for
                    // alle, ikke bare i vårt eget bilde.
                    void remove(ref(db, `${ROT}/${romId}/${gid}`)).catch(() => {});
                    continue;
                }
                ut.push(g);
            }
            paaGjester(ut);
        },
        (e) => console.warn('[rpg] mistet bildet av hallen', e)
    );

    return {
        romId,
        klientId: id,
        meld: (s) => {
            vil = s;
            harMeldt = true;
        },
        settFolelse: (emoji) => {
            folelse = trygtIkon(emoji);
            folelseSkitten = true;
        },
        settIdentitet: (ny) => {
            meg = ny;
            identitetSkitten = true;
        },
        forlat: () => {
            window.clearInterval(takt);
            meldAv();
            // Noden ryddes bare hvis vi fortsatt eier den. Gjør vi det ikke,
            // har en nyere tilkobling overtatt den samme plassen, og å slette
            // her ville tatt eleven ut av hallen mens hun står der.
            if (mitt !== eier) return;
            void onDisconnect(minRef).cancel().catch(() => {});
            void remove(minRef).catch(() => {});
        },
    };
}
