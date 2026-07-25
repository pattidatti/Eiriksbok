// Setter sammen questene for en sone. Massen kommer fra spørsmålsbanken som
// genereres fra artiklenes egne quizer, og de viktigste øyeblikkene er
// håndskrevet (se data/nordvik.ts).
//
// Hver quest får en `hint` som sier hvor svaret finnes. Det er hele
// spillmekanikken: eleven skal lete i verden, ikke gjette.

import { NORDVIK_AUTHORED, NORDVIK_NPCS } from '../data/nordvik';
import type { BankQuestion, QuestBank, QuestDef } from '../types';
import { makeRng } from './pixels';

let bank: QuestBank | null = null;

export async function lastQuestBank(): Promise<QuestBank> {
    if (bank) return bank;
    const res = await fetch(`${import.meta.env.BASE_URL}data/rpg/quest-bank.json`);
    if (!res.ok) throw new Error(`Fant ikke spørsmålsbanken (${res.status})`);
    bank = (await res.json()) as QuestBank;
    return bank;
}

/** Hvor svaret på et spørsmål fra banken kan finnes. */
function hintFor(q: BankQuestion, giverId: string): string {
    const npc = NORDVIK_NPCS.find((n) => n.id === giverId);
    const hvem = npc ? npc.name : 'noen i bygda';
    return `Svaret står i «${q.lessonTitle}». Spør ${hvem}, les runesteinene — eller slå opp i boka.`;
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
        'Tåka tok ordet for det jeg gjør. Jeg legger bordene slik — men hva heter det?',
        'Jeg skriver ned alt. Men jeg har mistet navnet på tida før vår. Hjelp meg.',
    ];
    const authoredHint = [
        'Spør Gudrun selv — hun vet det, hun har bare mistet ordet.',
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
            belonning: {
                xp: 45,
                solv: 20,
                itemId: i === 0 ? 'vadmelskjortel' : i === 1 ? 'kvernstein' : undefined,
            },
        });
    });

    // Resten fra banken, fordelt rundt på alle NPC-ene.
    const stokket = [...bankSporsmal].sort(() => rng() - 0.5);
    stokket.forEach((q, i) => {
        const giver = NORDVIK_NPCS[(i + 1) % NORDVIK_NPCS.length];
        const belonning = BELONNINGER[i % BELONNINGER.length];
        quester.push({
            id: `nordvik-b${i}`,
            title: q.lessonTitle,
            intro: 'Tåka har spist noe jeg pleide å kunne. Kan du hente det tilbake?',
            hint: hintFor(q, giver.id),
            question: q,
            source: 'bank',
            giverId: giver.id,
            belonning: {
                ...belonning,
                itemId: i === 2 ? 'lerbrynje' : i === 5 ? 'sagasverd' : i === 9 ? 'skaldering' : undefined,
            },
        });
    });

    return quester;
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
