// Setter sammen questene for et sted. Massen kommer fra spørsmålsbanken som
// genereres fra artiklenes egne quizer, og de viktigste øyeblikkene er
// håndskrevet (se data/nordvik.ts).
//
// Hele spillmekanikken hviler på én regel: hvert spørsmål har et svar som
// finnes et sted på kartet, og hintet peker på det stedet. Det krever to ting,
// og begge har vært feil før:
//
//  1. Kilden må slås opp, ikke gjettes. Med ren runde-fordeling skrev hintet
//     «spør <tilfeldig NPC>» uten at den NPC-en visste noe som helst, og for
//     17 av 20 oppdrag var «let i verden» ikke sant.
//  2. Giveren må være en annen enn kilden. Da oppdraget ble lagt hos den som
//     kunne svaret, var «let i verden» oppfylt av å bli stående i samme
//     samtaleboks - 15 av 17 bankoppdrag krevde ikke ett skritt.

import { bankSoneFor } from '../data/epoker';
import type { BankQuestion, Kilde, NpcDef, QuestBank, QuestDef, Sted } from '../types';
import { makeRng } from './pixels';

let bank: QuestBank | null = null;

export async function lastQuestBank(): Promise<QuestBank> {
    if (bank) return bank;
    const res = await fetch(`${import.meta.env.BASE_URL}data/rpg/quest-bank.json`);
    if (!res.ok) throw new Error(`Fant ikke spørsmålsbanken (${res.status})`);
    bank = (await res.json()) as QuestBank;
    return bank;
}

/** Teksten et stikkord skal lete i: spørsmålet, fasiten og forklaringen. */
function sokefelt(q: BankQuestion): string {
    return `${q.question} ${q.options[q.correct] ?? ''} ${q.explanation ?? ''}`.toLowerCase();
}

/**
 * Hvor står svaret på dette spørsmålet? Leter gjennom alt folk i bygda vet og
 * alt som står skrevet på steinene. Returnerer null hvis ingen i verden vet
 * det - da må hintet si det rett ut i stedet for å lyve.
 */
export function finnKilde(q: BankQuestion, sted: Sted): Kilde | null {
    const felt = sokefelt(q);
    for (const npc of sted.npcer) {
        for (const bit of npc.kunnskap ?? []) {
            if (bit.stikkord.some((ord) => felt.includes(ord.toLowerCase()))) {
                return { type: 'npc', id: npc.id, navn: npc.name };
            }
        }
    }
    for (const lm of sted.landemerker) {
        if ((lm.stikkord ?? []).some((ord) => felt.includes(ord.toLowerCase()))) {
            return { type: 'landemerke', id: lm.id, navn: lm.title };
        }
    }
    return null;
}

/** Hintet. Det sier hvor svaret er, og det skal alltid stemme. */
function hintFor(q: BankQuestion, kilde: Kilde | null): string {
    if (kilde?.type === 'npc') {
        return `${kilde.navn} vet dette. Gå og spør.`;
    }
    if (kilde?.type === 'landemerke') {
        return `Det står skrevet. Finn «${kilde.navn}» og les.`;
    }
    return `Ingen i bygda husker dette lenger. Svaret står i artikkelen «${q.lessonTitle}» - åpne den og les.`;
}

const BELONNINGER = [
    { xp: 30, solv: 12 },
    { xp: 40, solv: 16 },
    { xp: 55, solv: 22 },
];

/**
 * Bygger questlisten for et sted: de håndskrevne oppdragene først (de lærer
 * eleven hvordan spillet fungerer), deretter så mange som banken rekker til.
 *
 * Alt som er Nordvik-spesifikt kommer inn med `sted`. Tidligere lå giverne,
 * replikkene og belønningene som tre parallelle lister her inne, indeksert mot
 * spørsmålene - da kunne funksjonen bare bygge Nordvik.
 */
export function byggQuester(bankData: QuestBank, sted: Sted): QuestDef[] {
    // Hubben hører ikke til noen epoke, og har derfor ingen fagstoff-sone å
    // hente fra. Den har heller ingen å gi oppdrag - portalene er hele
    // innholdet der, og et oppdrag i hallen ville pekt på et svar som står i en
    // annen verden.
    if (!sted.epokeId) return [];

    // Fagstoffet hører til epoken, ikke til stedet: Nordvik og Lindisfarne
    // deler vikingtidens spørsmål, og et sted mer koster ingen ny bank.
    const sone = bankData.zones.find((z) => z.id === bankSoneFor(sted.epokeId));
    const bankSporsmal = sone?.questions ?? [];
    const rng = makeRng(4711);
    const quester: QuestDef[] = [];

    // Alle som kan gi oppdrag. Handelsmannen driver bod, ikke oppdrag.
    const givere = sted.npcer.filter((n) => !n.handler);

    /** Hvor mange oppdrag hver giver har fått. Holder køene omtrent like lange. */
    const kolengde = new Map<string, number>(givere.map((n) => [n.id, 0]));

    sted.authored.forEach((a, i) => {
        kolengde.set(a.giverId, (kolengde.get(a.giverId) ?? 0) + 1);
        quester.push({
            id: `${sted.id}-h${i}`,
            title: a.title,
            intro: a.intro,
            hint: a.hint,
            question: a.question,
            source: 'authored',
            giverId: a.giverId,
            kilde: { type: 'npc', id: a.giverId, navn: '' },
            belonning: a.belonning,
        });
    });

    /**
     * Giveren skal aldri være den som sitter på svaret.
     *
     * Før ble oppdraget lagt hos kilden selv. Da var «gå og finn ut av det»
     * oppfylt av å bli stående i samme samtaleboks - 15 av 17 bankoppdrag
     * krevde ikke ett skritt, og hintet sa «Aslak vet dette, gå og spør» mens
     * eleven sto foran Aslak med kunnskapsfanen hans rett over svarknappen.
     *
     * Nå velges en annen NPC, og blant dem den med kortest kø. Uten den
     * balanseringen fikk Orm sju oppdrag og Leiv to.
     */
    function velgGiver(kilde: Kilde | null): NpcDef {
        const mulige = givere.filter((n) => n.id !== kilde?.id);
        const valgbare = mulige.length > 0 ? mulige : givere;
        return valgbare.reduce((best, n) =>
            (kolengde.get(n.id) ?? 0) < (kolengde.get(best.id) ?? 0) ? n : best
        );
    }

    // Resten fra banken. Kilden er den som vet svaret; giveren er en annen som
    // savner det.
    const stokket = stokk(bankSporsmal, rng);
    stokket.forEach((q, i) => {
        const kilde = finnKilde(q, sted);
        const giver = velgGiver(kilde);
        kolengde.set(giver.id, (kolengde.get(giver.id) ?? 0) + 1);
        const belonning = BELONNINGER[i % BELONNINGER.length];
        quester.push({
            // ID-en må følge spørsmålet, ikke plassen i lista. `nordvik-b${i}`
            // flyttet på seg hver gang quest-bank.json ble regenerert - og den
            // kjøres i `scan:content`, altså ved hver eneste build. Én ny
            // vikingtid-artikkel med quiz forskjøv alle indeksene, og lagrede
            // «ferdig»-markeringer pekte plutselig på andre spørsmål.
            id: `${sted.id}-b:${q.id}`,
            // Tittelen er selve spørsmålet. Før sto leksjonstittelen her, men
            // Nordviks 17 spørsmål deler bare 7 leksjoner. Fire oppdrag på rad
            // med teksten «Merovingertiden: De stille århundrene» så ut som at
            // det samme oppdraget kunne tas om igjen med én gang.
            title: q.question,
            intro: introFor(kilde),
            hint: hintFor(q, kilde),
            question: q,
            source: 'bank',
            giverId: giver.id,
            kilde,
            belonning: {
                ...belonning,
                itemId:
                    i === 2
                        ? 'lerbrynje'
                        : i === 5
                        ? 'sagasverd'
                        : i === 9
                        ? 'skaldering'
                        : undefined,
            },
        });
    });

    return quester;
}

/** Litt variasjon i hvordan oppdraget blir gitt, i stedet for én lik replikk. */
function introFor(kilde: Kilde | null): string {
    if (kilde?.type === 'landemerke') {
        return 'Tåka tok noe jeg pleide å kunne. Men det står skrevet et sted her i bygda.';
    }
    if (kilde?.type === 'npc') {
        return 'Jeg vet det. Jeg vet at jeg vet det. Men ordet kommer ikke. Hjelp meg fram til det.';
    }
    return 'Dette husker ingen av oss lenger. Du må lete utenfor bygda - i boka.';
}

/**
 * Ekte stokking. `sort(() => rng() - 0.5)` er ikke en stokking: komparatoren er
 * ikke konsistent, og fordelingen blir skjev.
 */
function stokk<T>(liste: T[], rng: () => number): T[] {
    const ut = [...liste];
    for (let i = ut.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [ut[i], ut[j]] = [ut[j], ut[i]];
    }
    return ut;
}

/** Det neste oppdraget en NPC har å gi. */
export function nesteQuestFor(
    npcId: string,
    quester: QuestDef[],
    status: Record<string, 'aktiv' | 'ferdig'>
): QuestDef | null {
    return quester.find((q) => q.giverId === npcId && !status[q.id]) ?? null;
}

/** Et aktivt oppdrag hos denne NPC-en som eleven kan levere. */
export function aktivQuestFor(
    npcId: string,
    quester: QuestDef[],
    status: Record<string, 'aktiv' | 'ferdig'>
): QuestDef | null {
    return quester.find((q) => q.giverId === npcId && status[q.id] === 'aktiv') ?? null;
}
