// Pengeliv - utfordringene som bygger oppover.
//
// Her bor selve sjekkene: ett predikat per utfordring som leser tilstanden og
// svarer ja eller nei. Alt er rent og sidefritt, akkurat som resten av engine/.
// Funksjonen kalles hver gang tilstanden endrer seg - altså hver måned klokka
// tikker, fire ganger i sekundet på full fart - så hvert predikat skal koste
// nesten ingenting.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 8)

import type { Beholdning, Konto, Maalepunkt, Tilstand } from '../types';
import { UTFORDRINGER } from '../data/utfordringer';
import { FOND } from '../data/fond';
import { SKATTESATS_AKSJEINNTEKT } from './bors';

/**
 * Årstaket for BSU, i kroner.
 *
 * Taket bor egentlig i satsfila, men predikatene får bare `Tilstand` inn -
 * satsene er ikke en del av elevens økonomi. Derfor står tallet her som en
 * konstant. Endres taket i `public/data/okonomi/satser-<år>.json`, skal det
 * endres her også, ellers spretter utfordringen litt før eller litt etter at
 * BSU-en faktisk er full for året.
 */
const BSU_AARSTAK = 27500;

/** Grensa for hva som regnes som et billig fond. 0,5 prosent i året. */
const BILLIG_HONORAR = 0.005;

/** Hvor mange ulike papirer som skal til for at pengene er spredt. */
const SPREDNING_KRAV = 3;

/** Sparemålet i «De første 10 000», målt fra formuen eleven startet med. */
const FORSTE_SPAREMAAL = 10000;

/**
 * Hvor mye skatt eleven skal ha utsatt før ASK-poenget er tydelig i kroner.
 *
 * Skyggeregnskapet deler beløpet i to: `utsattSkatt` er det som er solgt med
 * gevinst uten at skatten er betalt, og `urealisertGevinst` er gevinsten som
 * fortsatt ligger urørt. Begge deler er skatt eleven ikke har betalt ennå, så
 * utfordringen legger dem sammen. 5 000 kr svarer til rundt 13 400 kr i
 * gevinst.
 */
const UTSATT_SKATT_MAAL = 5000;

/** Summen skatt eleven har utsatt på aksjesparekontoen, i kroner. */
function utsattSkattTotalt(tilstand: Tilstand): number {
    const { utsattSkatt, urealisertGevinst } = tilstand.skyggeregnskap;
    return utsattSkatt + urealisertGevinst * SKATTESATS_AKSJEINNTEKT;
}

/** Hvor mye høyere nettolønna må være enn ved start. 1,1 = 10 prosent opp. */
const LONNSVEKST_KRAV = 1.1;

/** Nettoformuen som gjør eleven til millionær. */
const MILLIONEN = 1000000;

/** Lovens minstekrav til innskuddspensjon. Utfordringen krever mer enn dette. */
const INNSKUDD_MINSTEKRAV = 0.02;

/** Siste målepunkt: nøkkeltallene slik de står nå. Null før første tikk. */
function naa(tilstand: Tilstand): Maalepunkt | null {
    return tilstand.historikk.length > 0 ? tilstand.historikk[tilstand.historikk.length - 1] : null;
}

/** Første målepunkt: utgangspunktet eleven startet fra. */
function start(tilstand: Tilstand): Maalepunkt | null {
    return tilstand.historikk.length > 0 ? tilstand.historikk[0] : null;
}

function konto(tilstand: Tilstand, type: Konto['type']): Konto | undefined {
    return tilstand.profil.kontoer.find((k) => k.type === type);
}

/** Papirene eleven faktisk eier akkurat nå. Solgte poster har 0 andeler. */
function eide(tilstand: Tilstand): Beholdning[] {
    return tilstand.profil.beholdninger.filter((b) => b.andeler > 0);
}

/**
 * Predikatene. Nøkkelen er utfordringens id, og hver funksjon svarer på ett
 * spørsmål: er dette oppfylt akkurat nå? Ingen av dem ser på hva som allerede
 * er krysset av - den jobben gjør `nyeOppfylteUtfordringer`.
 */
const OPPFYLT: Record<string, (tilstand: Tilstand) => boolean> = {
    'budsjett-i-pluss': (t) => {
        const punkt = naa(t);
        return punkt !== null && punkt.overskudd > 0;
    },

    // Rentefradraget regnes ut av seg selv når eleven har gjeld, så det teller
    // ikke: utfordringen handler om å ta et valg i Lønn og skatt.
    'fradrag-brukt': (t) => t.profil.fradrag.pendling > 0 || t.profil.fradrag.fagforening > 0,

    // Målt fra startformuen, ikke som et fast beløp. Ellers ville de rikeste
    // personaene fått målet gratis, og de fattigste sett det som uoppnåelig.
    'spart-10000': (t) => {
        const fra = start(t);
        const punkt = naa(t);
        return fra !== null && punkt !== null && punkt.formue >= fra.formue + FORSTE_SPAREMAAL;
    },

    'bsu-aaret-fullt': (t) => (konto(t, 'bsu')?.innskuddIAr ?? 0) >= BSU_AARSTAK,

    'forste-fond': (t) => t.profil.beholdninger.some((b) => b.slag === 'fond' && b.andeler > 0),

    'billig-fond': (t) =>
        t.profil.beholdninger.some((b) => {
            if (b.slag !== 'fond' || b.andeler <= 0) return false;
            const fond = FOND.find((f) => f.id === b.papirId);
            return fond !== undefined && fond.forvaltningshonorar < BILLIG_HONORAR;
        }),

    spredning: (t) => eide(t).length >= SPREDNING_KRAV,

    'forste-aksje': (t) => t.profil.beholdninger.some((b) => b.slag === 'aksje' && b.andeler > 0),

    'utsatt-skatt': (t) => utsattSkattTotalt(t) >= UTSATT_SKATT_MAAL,

    // Gjeldfri betyr at gjelda er borte, ikke at den aldri fantes. Historikken
    // er det eneste stedet som husker at eleven en gang skyldte penger.
    // Sjekken av lån-lista står først, så historikken bare leses de gangene
    // eleven faktisk står uten gjeld.
    gjeldfri: (t) =>
        t.laan.every((l) => l.restgjeld <= 0) && t.historikk.some((punkt) => punkt.gjeld > 0),

    'pensjon-over-minimum': (t) => t.pensjon.innskuddssats > INNSKUDD_MINSTEKRAV,

    'ips-startet': (t) => (konto(t, 'ips')?.innskuddTotalt ?? 0) > 0,

    'lonna-opp': (t) => {
        const fra = start(t);
        const punkt = naa(t);
        return (
            fra !== null &&
            punkt !== null &&
            fra.inntekt > 0 &&
            punkt.inntekt >= fra.inntekt * LONNSVEKST_KRAV
        );
    },

    // Ferdig, ikke i gang: `studererId` er satt så lenge studiet pågår.
    'utdanning-fullfort': (t) =>
        t.profil.utdanningsniva !== 'ingen' && t.profil.studererId === null,

    'deler-utgiftene': (t) => t.profil.husholdning.harSamboer,

    'familie-i-pluss': (t) => {
        const punkt = naa(t);
        return t.profil.husholdning.barn.length > 0 && punkt !== null && punkt.overskudd > 0;
    },

    'egen-bolig': (t) => t.bolig !== null,

    'boliglan-halvert': (t) => {
        const bolig = t.bolig;
        if (!bolig || bolig.verdi <= 0) return false;
        const laan = bolig.laanId ? t.laan.find((l) => l.id === bolig.laanId) : undefined;
        const restgjeld = laan ? laan.restgjeld : 0;
        return restgjeld <= bolig.verdi * 0.5;
    },

    millionaer: (t) => {
        const punkt = naa(t);
        return punkt !== null && punkt.netto >= MILLIONEN;
    },
};

/**
 * Id-ene til utfordringene som er oppfylt i denne tilstanden, men ikke står i
 * `tilstand.fullforteUtfordringer` ennå. Ren funksjon uten bivirkninger:
 * den som kaller, eier både lagringen og XP-en.
 *
 * Rekkefølgen i svaret følger `rekkefolge`, slik at flere mål som løses ut i
 * samme måned feires nedenfra og opp i den rekkefølgen de er tenkt.
 */
export function nyeOppfylteUtfordringer(tilstand: Tilstand): string[] {
    // Set, ikke includes: lista vokser til nitten id-er, og funksjonen kalles
    // hver måned. Da skal oppslaget koste én operasjon, ikke nitten.
    const alleredeTatt = new Set(tilstand.fullforteUtfordringer);
    const nye: string[] = [];

    for (const utfordring of UTFORDRINGER) {
        if (alleredeTatt.has(utfordring.id)) continue;
        const sjekk = OPPFYLT[utfordring.id];
        if (sjekk && sjekk(tilstand)) nye.push(utfordring.id);
    }

    return nye;
}
