// Setter sammen questene for en sone. Massen kommer fra spørsmålsbanken som
// genereres fra artiklenes egne quizer, og de viktigste øyeblikkene er
// håndskrevet (se data/nordvik.ts).
//
// Hele spillmekanikken hviler på én regel: hvert spørsmål har et svar som
// finnes et sted på kartet, og hintet peker på det stedet. Tidligere ble
// giveren delt ut med ren runde-fordeling og hintet skrev «spør <tilfeldig
// NPC>» uten at den NPC-en visste noe som helst. For 17 av 20 oppdrag var
// «let i verden» derfor ikke sant. Nå slås kilden opp for hvert spørsmål, og
// oppdraget havner hos den som faktisk vet svaret.

import { NORDVIK_AUTHORED, NORDVIK_LANDMARKS, NORDVIK_NPCS } from '../data/nordvik';
import type { BankQuestion, Kilde, QuestBank, QuestDef } from '../types';
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
export function finnKilde(q: BankQuestion): Kilde | null {
    const felt = sokefelt(q);
    for (const npc of NORDVIK_NPCS) {
        for (const bit of npc.kunnskap ?? []) {
            if (bit.stikkord.some((ord) => felt.includes(ord.toLowerCase()))) {
                return { type: 'npc', id: npc.id, navn: npc.name };
            }
        }
    }
    for (const lm of NORDVIK_LANDMARKS) {
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
 * Bygger questlisten for Nordvik: tre håndskrevne oppdrag først (de lærer
 * eleven hvordan spillet fungerer), deretter så mange som banken rekker til.
 */
export function byggNordvikQuester(bankData: QuestBank): QuestDef[] {
    const sone = bankData.zones.find((z) => z.id === 'nordvik');
    const bankSporsmal = sone?.questions ?? [];
    const rng = makeRng(4711);
    const quester: QuestDef[] = [];

    // Håndskrevne oppdrag - knyttet til en bestemt NPC som faktisk kan svaret.
    const authoredGivere = ['gudrun', 'orm', 'aslak'];
    const authoredIntro = [
        'Nøklene mine klirrer, og jeg husker ikke lenger hvorfor de betyr noe. Kan du finne det ut for meg?',
        'Tåka tok ordet for det jeg gjør. Jeg legger bordene slik - men hva heter det?',
        'Jeg skriver ned alt. Men jeg har mistet navnet på tida før vår. Hjelp meg.',
    ];
    const authoredHint = [
        'Gudrun vet det selv - hun har bare mistet ordet. Snakk med henne igjen.',
        'Orm i naustet kan vise deg hvordan bordene ligger.',
        'Aslak Munk sitter ved kirken og husker mer enn han tror.',
    ];

    NORDVIK_AUTHORED.forEach((q, i) => {
        quester.push({
            id: `nordvik-h${i}`,
            title: ['Nøklene i beltet', 'Bordene i skroget', 'De stille århundrene'][i],
            intro: authoredIntro[i],
            hint: authoredHint[i],
            question: q,
            source: 'authored',
            giverId: authoredGivere[i],
            kilde: { type: 'npc', id: authoredGivere[i], navn: '' },
            belonning: {
                xp: 45,
                solv: 20,
                itemId: i === 0 ? 'vadmelskjortel' : i === 1 ? 'kvernstein' : undefined,
            },
        });
    });

    // Alle som kan gi oppdrag. Handelsmannen driver bod, ikke oppdrag.
    const givere = NORDVIK_NPCS.filter((n) => !n.handler);

    // Resten fra banken. Hvert spørsmål havner hos den som vet svaret - og hvis
    // svaret står på en stein, hos den som står nærmest steinen.
    const stokket = stokk(bankSporsmal, rng);
    stokket.forEach((q, i) => {
        const kilde = finnKilde(q);
        const giver =
            kilde?.type === 'npc'
                ? (givere.find((n) => n.id === kilde.id) ?? givere[i % givere.length])
                : givere[i % givere.length];
        const belonning = BELONNINGER[i % BELONNINGER.length];
        quester.push({
            id: `nordvik-b${i}`,
            title: q.lessonTitle,
            intro: introFor(kilde),
            hint: hintFor(q, kilde),
            question: q,
            source: 'bank',
            giverId: giver.id,
            kilde,
            belonning: {
                ...belonning,
                itemId: i === 2 ? 'lerbrynje' : i === 5 ? 'sagasverd' : i === 9 ? 'skaldering' : undefined,
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
