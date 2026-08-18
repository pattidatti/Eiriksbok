import React, { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReligion } from '../hooks/useReligion';
import { useManifest } from '../hooks/useManifest';
import { usePageTitle } from '../hooks/usePageTitle';
import { ReligionProfile } from '../components/religion/ReligionProfile';
import { ReligionShellHeader } from '../components/religion/ReligionShellHeader';
import { ReligionSwitcher, type SwitcherReligion } from '../components/religion/ReligionSwitcher';
import { LessonCard } from '../components/LessonCard';
import { PageSkeleton } from '../components/Skeleton';
import { toolIcon } from '../utils/toolIcon';
import { useComparisonManifest } from '../features/comparison/manifest';
import { resolveLens, storeLens, type ProfileView } from '../features/religion-nav/links';
import { List, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReligionPage: React.FC = () => {
    const { religionId } = useParams<{ religionId: string }>();
    const { data: religion, isLoading: religionLoading } = useReligion(religionId || '');
    const { data: manifest, isLoading: manifestLoading } = useManifest();
    const { data: comparisonManifest } = useComparisonManifest();
    const [searchParams, setSearchParams] = useSearchParams();

    // KRLE -> religion -> [religionId]
    const krleSubject = manifest?.subjects.find((s) => s.id === 'krle');
    const religionTopic = krleSubject?.topics.find((t) => t.id === 'religion');
    const religionSubTopic = religionTopic?.subTopics?.find((st) => st.id === religionId);
    const lessons = religionSubTopic?.lessons || [];

    // Samisk religion og de historiske religionene står i manifestet, men har
    // ingen fil i public/data/religion/. De skal vise leksjonene sine, ikke en
    // feilmelding - profilfanen finnes bare der det er en profil å vise.
    const hasProfile = Boolean(religion);

    // ?visning=profil|leksjoner styrer fanen, slik at et bytte av religion
    // beholder visningen og en delt lenke åpner det den skal.
    // Standarden er leksjonslista. Alle lenkene som *mener* profilen - fra
    // huben, sammenligningen og krysslenkebåndet - sender `visning=profil`
    // eksplisitt, så profilen er fortsatt ett klikk unna der den hører hjemme.
    // ?dim=<nøkkel> alene er også en dyplenke til profilen: en lenke som peker
    // på én dimensjon mener hjulet, ikke leksjonsrutenettet.
    const visningParam = searchParams.get('visning');
    const viewMode: ProfileView = !hasProfile
        ? 'leksjoner'
        : visningParam === 'profil' || visningParam === 'leksjoner'
          ? visningParam
          : searchParams.get('dim')
            ? 'profil'
            : 'leksjoner';

    const lens = resolveLens(searchParams.get('dim'));

    const setViewMode = (next: ProfileView) => {
        setSearchParams(
            (params) => {
                params.set('visning', next);
                return params;
            },
            { replace: true }
        );
    };

    // Bytterailen: alle religionene i manifestet, men bare de med
    // sju-dimensjonsdata får profil-lenke og fremdriftsring.
    const switcherReligions = useMemo((): SwitcherReligion[] => {
        const profiles = new Map(
            (comparisonManifest?.religions ?? []).map((r) => [r.id, r] as const)
        );
        const subTopics =
            manifest?.subjects
                .find((s) => s.id === 'krle')
                ?.topics.find((t) => t.id === 'religion')?.subTopics ?? [];
        const all = subTopics.map((st) => ({
            id: st.id,
            // Manifestet skriver navnet slik eleven skal lese det («Bahá'í»),
            // generatoren slik filnavnet ser ut. Manifestet vinner.
            name: st.title || profiles.get(st.id)?.name || st.id,
            color: profiles.get(st.id)?.color ?? null,
            hasProfile: profiles.has(st.id),
        }));
        // De med profil først, ellers uendret rekkefølge fra manifestet
        return [...all.filter((r) => r.hasProfile), ...all.filter((r) => !r.hasProfile)];
    }, [manifest, comparisonManifest]);

    // Linsen eleven står i huskes for resten av økta, så neste side arver den
    useEffect(() => {
        storeLens(lens);
    }, [lens]);

    const title = religionSubTopic?.title || religion?.name || 'Religion';
    usePageTitle(title);

    if (religionLoading || manifestLoading) return <PageSkeleton />;

    if (!hasProfile && !religionSubTopic) {
        return <div className="p-12 text-center text-xl">Fant ikke religionen.</div>;
    }

    const accent = religion?.color || '#6366f1';
    const heroImage = religionSubTopic?.image;
    const tools = religionSubTopic?.tools ?? [];

    return (
        <div className="max-w-7xl mx-auto px-6 py-6">
            <ReligionShellHeader
                // Tittelen legges oppå bildet i stedet for under det. Hero og
                // overskrift som to blokker skjøv dimensjonshjulet under folden
                // på en 1366x768-skjerm.
                backdrop={heroImage}
                eyebrow="Verdensreligioner"
                title={title}
                subtitle={religionSubTopic?.description}
                surface="profil"
                accent={accent}
                // Profilen har dimensjonshjulet, og leksjonslista sorteres ikke
                // etter dimensjon - en linse-rail her ville vært en knapp uten
                // synlig virkning. Linsen lever videre i økta uansett.
                showLens={false}
                right={
                    hasProfile ? (
                        <div className="flex gap-1 bg-white/90 backdrop-blur-md p-1 rounded-full shadow-sm border border-white/60">
                            <button
                                onClick={() => setViewMode('leksjoner')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    viewMode === 'leksjoner'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                                }`}
                            >
                                <List size={14} />
                                Leksjoner
                            </button>
                            <button
                                onClick={() => setViewMode('profil')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    viewMode === 'profil'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                                }`}
                            >
                                <Compass size={14} />
                                Religionsprofilen
                            </button>
                        </div>
                    ) : undefined
                }
            />

            {switcherReligions.length > 1 && (
                <div className="mb-6">
                    <ReligionSwitcher
                        religions={switcherReligions}
                        activeId={religionId || ''}
                        dim={lens}
                        visning={viewMode}
                        // I leksjonsvisning måler fremdriftsringene noe annet enn
                        // det eleven ser på. Da er én knapp både penere og ærligere.
                        variant={viewMode === 'profil' ? 'rail' : 'compact'}
                    />
                </div>
            )}

            {/* Subtopikkens egne verktøy - de historiske religionene lenker
                herfra til Romerriket og Åsatru i Historie. */}
            {tools.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
                    {tools.map((tool) => {
                        const Icon = toolIcon(tool.icon);
                        return (
                            <Link
                                key={tool.id}
                                to={tool.link}
                                title={tool.description}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 whitespace-nowrap hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all shrink-0"
                            >
                                <Icon className="w-4 h-4 text-indigo-600" />
                                {tool.title}
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Content */}
            <motion.div
                key={viewMode}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
            >
                {viewMode === 'leksjoner' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lessons.map((lesson, index) => (
                            <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="h-full"
                            >
                                <LessonCard
                                    lesson={lesson}
                                    path={`/krle/religion/${religionId}/${lesson.id}`}
                                    topicTitle={title}
                                />
                            </motion.div>
                        ))}
                        {lessons.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-slate-500 italic">Ingen leksjoner funnet.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'profil' && religion && <ReligionProfile religion={religion} />}
            </motion.div>
        </div>
    );
};
