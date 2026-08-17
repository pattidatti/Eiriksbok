// Hvilke religioner det er verdt å holde opp mot hverandre, dimensjon for
// dimensjon. Et tilfeldig par gir eleven to tekster; et godt valgt par gir en
// forskjell hen kan se med en gang. Listene er kuraterte, ikke uttømmende:
// «velg selv»-lenken står alltid ved siden av.

const FALLBACK = ['kristendom', 'islam', 'buddhisme', 'jodedom', 'hinduisme'];

// religionId -> dimensjonsnøkkel -> anbefalte motparter, mest slående først
const PAIRS: Record<string, Record<string, string[]>> = {
    kristendom: {
        ritual: ['jodedom', 'islam'],
        narrative: ['jodedom', 'islam'],
        experiential: ['buddhisme', 'islam'],
        social: ['jehovas-vitner', 'mormonisme'],
        ethical: ['jodedom', 'islam'],
        doctrinal: ['jodedom', 'mormonisme'],
        material: ['islam', 'buddhisme'],
    },
    islam: {
        ritual: ['jodedom', 'kristendom'],
        narrative: ['kristendom', 'jodedom'],
        experiential: ['sikhisme', 'kristendom'],
        social: ['jodedom', 'sikhisme'],
        ethical: ['jodedom', 'kristendom'],
        doctrinal: ['jodedom', 'kristendom'],
        material: ['kristendom', 'hinduisme'],
    },
    jodedom: {
        ritual: ['islam', 'kristendom'],
        narrative: ['kristendom', 'islam'],
        experiential: ['kristendom', 'islam'],
        social: ['islam', 'sikhisme'],
        ethical: ['islam', 'kristendom'],
        doctrinal: ['kristendom', 'islam'],
        material: ['kristendom', 'islam'],
    },
    buddhisme: {
        ritual: ['hinduisme', 'kristendom'],
        narrative: ['hinduisme', 'kristendom'],
        experiential: ['hinduisme', 'sikhisme'],
        social: ['hinduisme', 'kristendom'],
        ethical: ['hinduisme', 'kristendom'],
        doctrinal: ['hinduisme', 'kristendom'],
        material: ['hinduisme', 'islam'],
    },
    hinduisme: {
        ritual: ['buddhisme', 'sikhisme'],
        narrative: ['buddhisme', 'kristendom'],
        experiential: ['buddhisme', 'sikhisme'],
        social: ['sikhisme', 'buddhisme'],
        ethical: ['buddhisme', 'sikhisme'],
        doctrinal: ['buddhisme', 'sikhisme'],
        material: ['buddhisme', 'islam'],
    },
    sikhisme: {
        ritual: ['hinduisme', 'islam'],
        narrative: ['hinduisme', 'islam'],
        experiential: ['hinduisme', 'buddhisme'],
        social: ['hinduisme', 'islam'],
        ethical: ['hinduisme', 'islam'],
        doctrinal: ['hinduisme', 'islam'],
        material: ['hinduisme', 'islam'],
    },
    mormonisme: {
        ritual: ['kristendom', 'jehovas-vitner'],
        narrative: ['kristendom', 'jehovas-vitner'],
        experiential: ['kristendom', 'jehovas-vitner'],
        social: ['jehovas-vitner', 'kristendom'],
        ethical: ['kristendom', 'jehovas-vitner'],
        doctrinal: ['kristendom', 'jehovas-vitner'],
        material: ['kristendom', 'jehovas-vitner'],
    },
    'jehovas-vitner': {
        ritual: ['kristendom', 'mormonisme'],
        narrative: ['kristendom', 'mormonisme'],
        experiential: ['kristendom', 'mormonisme'],
        social: ['mormonisme', 'kristendom'],
        ethical: ['kristendom', 'mormonisme'],
        doctrinal: ['kristendom', 'mormonisme'],
        material: ['kristendom', 'mormonisme'],
    },
    bahai: {
        ritual: ['islam', 'kristendom'],
        narrative: ['islam', 'kristendom'],
        experiential: ['islam', 'sikhisme'],
        social: ['islam', 'sikhisme'],
        ethical: ['islam', 'kristendom'],
        doctrinal: ['islam', 'kristendom'],
        material: ['islam', 'kristendom'],
    },
};

/**
 * Foreslåtte motparter for én religion i én dimensjon. Fyller opp med
 * kjente religioner hvis paret ikke er kuratert, og filtrerer mot hva som
 * faktisk finnes av data.
 */
export function suggestedPartners(
    religionId: string,
    dimension: string,
    available: string[],
    count = 3
): string[] {
    const availableSet = new Set(available);
    const curated = PAIRS[religionId]?.[dimension] ?? [];
    const result: string[] = [];
    for (const candidate of [...curated, ...FALLBACK, ...available]) {
        if (result.length >= count) break;
        if (candidate === religionId || result.includes(candidate)) continue;
        if (!availableSet.has(candidate)) continue;
        result.push(candidate);
    }
    return result;
}
