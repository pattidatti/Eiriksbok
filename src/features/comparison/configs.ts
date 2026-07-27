import { fetchReligion, fetchPhilosopher } from '../../utils/contentLoader';
import type { ComparisonContent, ComparisonDomainConfig, ComparisonEntity } from './types';

function wrapDimensions(
    dimensions: Record<string, unknown> | undefined,
    format: 'rich' | 'plain'
): Record<string, ComparisonContent | undefined> {
    const wrapped: Record<string, ComparisonContent | undefined> = {};
    for (const [key, value] of Object.entries(dimensions ?? {})) {
        if (value == null || value === '') continue;
        wrapped[key] =
            format === 'plain'
                ? { format: 'plain', value: String(value) }
                : { format: 'rich', value };
    }
    return wrapped;
}

export const religionConfig: ComparisonDomainConfig = {
    domain: 'religion',
    title: 'Sammenlign religioner',
    intro: 'Velg religionene du vil sammenligne, og utforsk likheter og forskjeller gjennom Ninian Smarts sju dimensjoner.',
    manifestKey: 'religions',
    dimensions: [
        {
            key: 'ritual',
            label: 'Ritualer og kult',
            reflection:
                'Velg to av religionene du sammenligner. Hva tror du ritualene betyr for en som utøver dem i hverdagen?',
        },
        {
            key: 'narrative',
            label: 'Fortellinger og myter',
            reflection:
                'Hvilke likheter finner du mellom fortellingene? Hvorfor tror du fortellinger er så viktige i religioner?',
        },
        {
            key: 'experiential',
            label: 'Opplevelser og erfaringer',
            reflection:
                'Hvordan tror du det oppleves å delta i en av disse religionenes viktigste seremonier?',
        },
        {
            key: 'social',
            label: 'Sosial organisering',
            reflection:
                'Hvordan er fellesskapene organisert ulikt? Hva kan det ha å si for medlemmene?',
        },
        {
            key: 'ethical',
            label: 'Etikk og moral',
            reflection:
                'Finn en leveregel som ligner på tvers av religionene. Hvorfor tror du så mange religioner deler den?',
        },
        {
            key: 'doctrinal',
            label: 'Lære og filosofi',
            reflection:
                'Hva er den største forskjellen i lære mellom religionene du har valgt?',
        },
        {
            key: 'material',
            label: 'Materielle uttrykk',
            reflection:
                'Hvorfor tror du bygninger og gjenstander betyr så mye i religioner?',
        },
    ],
    fetchEntity: async (id) => {
        const religion = await fetchReligion(id);
        if (!religion) return null;
        const entity: ComparisonEntity = {
            id: religion.id,
            name: religion.name,
            color: religion.color,
            dimensions: wrapDimensions(religion.dimensions, 'rich'),
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
    articleLinks: (manifest, entityId, dimensionKey) =>
        manifest.religionArticles
            .filter((a) => a.religion === entityId && a.dimension === dimensionKey)
            .slice(0, 3)
            .map((a) => ({ title: a.title, link: a.link })),
};

export const philosophyConfig: ComparisonDomainConfig = {
    domain: 'filosofi',
    title: 'Sammenlign filosofer',
    intro: 'Velg tenkerne du vil sammenligne, og utforsk hvordan de svarer ulikt på de samme store spørsmålene.',
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
