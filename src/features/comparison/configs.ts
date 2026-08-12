import { fetchReligion, fetchPhilosopher } from '../../utils/contentLoader';
import { dimensionBody, normalizeDimension } from '../../utils/religionDimensions';
import { getDimension } from '../../components/religion/dimensionMeta';
import type { ReligionDimensionEntry } from '../../types';
import type {
    ComparisonContent,
    ComparisonDimension,
    ComparisonDomainConfig,
    ComparisonEntity,
} from './types';

// Religionsdimensjonene er de samme sju som i religionsprofilen. Spørsmålet,
// fargen og ikonet hentes derfra, slik at eleven møter «Hva gjør de?» både på
// /krle/religion/:id og her.
function religionDimension(key: string, reflection: string): ComparisonDimension {
    const meta = getDimension(key);
    return {
        key,
        label: meta?.label ?? key,
        short: meta?.short,
        question: meta?.question,
        color: meta?.color,
        icon: meta?.icon,
        reflection,
    };
}

function wrapDimensions(
    dimensions: Record<string, unknown> | undefined,
    format: 'rich' | 'plain'
): Record<string, ComparisonContent | undefined> {
    const wrapped: Record<string, ComparisonContent | undefined> = {};
    for (const [key, value] of Object.entries(dimensions ?? {})) {
        if (value == null || value === '') continue;
        // Løftede datafiler pakker teksten i et dimensjonskort; sammenligningen
        // viser bare brødteksten.
        const body = dimensionBody(value);
        if (body == null || body === '') continue;
        wrapped[key] =
            format === 'plain' ? { format: 'plain', value: String(body) } : { format: 'rich', value: body };
    }
    return wrapped;
}

export const religionConfig: ComparisonDomainConfig = {
    domain: 'religion',
    title: 'Sammenlign religioner',
    intro: 'Velg to til fire religioner, og se hvor de ligner og hvor de skiller lag.',
    manifestKey: 'religions',
    dimensions: [
        religionDimension(
            'ritual',
            'Velg to av religionene du sammenligner. Hva tror du ritualene betyr for en som utøver dem i hverdagen?'
        ),
        religionDimension(
            'narrative',
            'Hvilke likheter finner du mellom fortellingene? Hvorfor tror du fortellinger er så viktige i religioner?'
        ),
        religionDimension(
            'experiential',
            'Hvordan tror du det oppleves å delta i en av disse religionenes viktigste seremonier?'
        ),
        religionDimension(
            'social',
            'Hvordan er fellesskapene organisert ulikt? Hva kan det ha å si for medlemmene?'
        ),
        religionDimension(
            'ethical',
            'Finn en leveregel som ligner på tvers av religionene. Hvorfor tror du så mange religioner deler den?'
        ),
        religionDimension(
            'doctrinal',
            'Hva er den største forskjellen i lære mellom religionene du har valgt?'
        ),
        religionDimension(
            'material',
            'Hvorfor tror du bygninger og gjenstander betyr så mye i religioner?'
        ),
    ],
    fetchEntity: async (id) => {
        const religion = await fetchReligion(id);
        if (!religion) return null;
        const cards: Record<string, ReligionDimensionEntry | undefined> = {};
        for (const [key, value] of Object.entries(religion.dimensions ?? {})) {
            const entry = normalizeDimension(value);
            if (entry?.summary) cards[key] = entry;
        }
        const entity: ComparisonEntity = {
            id: religion.id,
            name: religion.name,
            color: religion.color,
            dimensions: wrapDimensions(religion.dimensions, 'rich'),
            cards,
        };
        return entity;
    },
    detailLink: (id) => `/krle/religion/${id}`,
    minSelected: 2,
    maxSelected: 4,
    defaultSelected: ['kristendom', 'islam', 'buddhisme'],
    activityIdPrefix: 'krle/sammenlign',
    subjectId: 'krle',
    topicId: 'religion',
    tasksUrl: 'data/comparison/religion-tasks.json',
    matrixUrl: 'data/comparison/religion-matrix.json',
    articleLinks: (manifest, entityId, dimensionKey) =>
        manifest.religionArticles
            .filter((a) => a.religion === entityId && a.dimension === dimensionKey)
            .slice(0, 3)
            .map((a) => ({ title: a.title, link: a.link })),
};

export const philosophyConfig: ComparisonDomainConfig = {
    domain: 'filosofi',
    title: 'Sammenlign filosofer',
    intro: 'Velg to til fire tenkere, og se hvor ulikt de svarer på de samme store spørsmålene.',
    manifestKey: 'philosophers',
    dimensions: [
        {
            key: 'metafysikk',
            label: 'Metafysikk',
            reflection:
                'Hvilken av tenkerne er du mest enig med om hva som er virkelig? Hvorfor?',
        },
        {
            key: 'epistemologi',
            label: 'Epistemologi',
            reflection:
                'Hvordan mener tenkerne du har valgt at vi kan vite noe sikkert? Hvem overbeviser deg mest?',
        },
        {
            key: 'etikk',
            label: 'Etikk',
            reflection:
                'Velg to av tenkerne. Hva ville de vært uenige om i en diskusjon om hva et godt liv er?',
        },
        {
            key: 'menneskesyn',
            label: 'Menneskesyn',
            reflection:
                'Hva skiller tenkernes syn på hva et menneske er? Hvem ligner mest på ditt eget syn?',
        },
        {
            key: 'samfunnssyn',
            label: 'Samfunnssyn',
            reflection:
                'Hva slags samfunn ville tenkerne du har valgt bygget? Hvem ville du helst bodd hos?',
        },
    ],
    fetchEntity: async (id) => {
        const philosopher = await fetchPhilosopher(id);
        if (!philosopher) return null;
        const entity: ComparisonEntity = {
            id: philosopher.id,
            name: philosopher.name,
            color: philosopher.color,
            group: (philosopher as { group?: string }).group,
            dimensions: wrapDimensions(philosopher.dimensions, 'plain'),
        };
        return entity;
    },
    detailLink: (id) => `/krle/filosofi/${id}`,
    minSelected: 2,
    maxSelected: 4,
    defaultSelected: ['sokrates', 'platon', 'aristoteles'],
    activityIdPrefix: 'krle/filosofi/sammenlign',
    subjectId: 'krle',
    topicId: 'filosofi',
    tasksUrl: 'data/comparison/philosophy-tasks.json',
};
