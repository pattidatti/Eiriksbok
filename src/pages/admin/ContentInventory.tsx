import React, { useEffect, useState, useMemo } from 'react';
import { useManifest } from '../../hooks/useManifest';
import { AlertCircle, CheckCircle, Image, Tag, Type, ArrowUpDown, Info, type LucideIcon } from 'lucide-react';

interface ArticleAudit {
    id: string;
    path: string;
    title: string;
    hasImage: boolean;
    hasTags: boolean;
    wordCount: number;
    hasQuiz: boolean;
    status: 'good' | 'warning' | 'error';
    issues: string[];
}

type SortKey = 'status' | 'title' | 'wordCount' | 'hasImage' | 'hasTags';
type SortDirection = 'asc' | 'desc';
type SortConfig = { key: SortKey; direction: SortDirection };

// Definert på modulnivå, ikke inne i ContentInventory: en komponent som lages på
// nytt hver render får ny identitet, og React river ned og bygger opp DOM-en
// hennes i stedet for å oppdatere den.
const SortHeader = ({
    label,
    sortKey,
    icon: Icon,
    sortConfig,
    onSort,
}: {
    label?: string;
    sortKey: SortKey;
    icon?: LucideIcon;
    sortConfig: SortConfig;
    onSort: (key: SortKey) => void;
}) => (
    <th
        className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
        onClick={() => onSort(sortKey)}
    >
        <div className="flex items-center gap-2 justify-center lg:justify-start">
            {Icon && <Icon className="w-4 h-4 text-slate-400" />}
            {label && <span>{label}</span>}
            <ArrowUpDown className={`w-3 h-3 text-slate-300 transition-colors ${sortConfig.key === sortKey ? 'text-indigo-600' : 'group-hover:text-slate-500'}`} />
        </div>
    </th>
);

export const ContentInventory: React.FC = () => {
    const { data: manifest, isLoading } = useManifest();
    const [auditData, setAuditData] = useState<ArticleAudit[]>([]);
    const [scanning, setScanning] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'title', direction: 'asc' });

    useEffect(() => {
        if (!manifest) return;

        const performAudit = async () => {
            setScanning(true);
            const audits: ArticleAudit[] = [];

            const processLesson = async (lesson: any, subjectId: string, topicId: string, subTopicId?: string) => {
                const path = `/content/${subjectId}/${topicId}${subTopicId ? `/${subTopicId}` : ''}/${lesson.id}/artikkel.json`;

                let wordCount = 0;
                let hasQuiz = false;
                let hasImage = !!lesson.image;

                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.content) {
                            data.content.forEach((block: any) => {
                                if (block.type === 'text' && block.content) {
                                    wordCount += block.content.split(/\s+/).length;
                                }
                            });
                        }
                        if (data.quiz && data.quiz.length > 0) hasQuiz = true;
                        if (!hasImage && data.heroImage) hasImage = true;
                    }
                } catch (e) {
                    console.error(`Failed to audit ${path}`, e);
                }

                const issues: string[] = [];
                if (!hasImage) issues.push('Mangler bilde');
                if (wordCount < 100) issues.push('Veldig kort (<100 ord)');
                if (!lesson.tags || lesson.tags.length === 0) issues.push('Mangler tags');

                let status: 'good' | 'warning' | 'error' = 'good';
                if (issues.length > 0) status = 'warning';
                if (wordCount === 0) status = 'error';

                audits.push({
                    id: lesson.id,
                    path: `/${subjectId}/${topicId}${subTopicId ? `/${subTopicId}` : ''}/${lesson.id}`,
                    title: lesson.title,
                    hasImage,
                    hasTags: !!(lesson.tags && lesson.tags.length > 0),
                    wordCount,
                    hasQuiz,
                    status,
                    issues
                });
            };

            for (const subject of manifest.subjects) {
                for (const topic of subject.topics) {
                    if (topic.lessons) {
                        for (const lesson of topic.lessons) {
                            await processLesson(lesson, subject.id, topic.id);
                        }
                    }
                    if (topic.subTopics) {
                        for (const subTopic of topic.subTopics) {
                            if (subTopic.lessons) {
                                for (const lesson of subTopic.lessons) {
                                    await processLesson(lesson, subject.id, topic.id, subTopic.id);
                                }
                            }
                        }
                    }
                }
            }

            setAuditData(audits);
            setScanning(false);
        };

        performAudit();
    }, [manifest]);

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedData = useMemo(() => {
        const sorted = [...auditData];
        sorted.sort((a, b) => {
            let aValue: any = a[sortConfig.key];
            let bValue: any = b[sortConfig.key];

            if (typeof aValue === 'boolean') {
                aValue = aValue ? 1 : 0;
                bValue = bValue ? 1 : 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [auditData, sortConfig]);

    if (isLoading || scanning) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Skanner artikkler...</p>
                </div>
            </div>
        );
    }

    const issuesCount = auditData.filter(a => a.status !== 'good').length;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Innholdsinventar</h1>
                        <p className="text-slate-500">
                            Fant {auditData.length} artikler. {issuesCount} har forbedringspotensiale.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-sm font-bold text-slate-700">{auditData.filter(a => a.status === 'good').length} Bra</span>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-sm font-bold text-slate-700">{auditData.filter(a => a.status !== 'good').length} Må sjekkes</span>
                        </div>
                    </div>
                </div>

                {/* Help / Legend */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 flex items-start gap-4 text-indigo-900 text-sm">
                    <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold mb-1">Forklaring av kolonner</h3>
                        <p className="opacity-80 leading-relaxed">
                            <span className="font-bold inline-flex items-center gap-1"><Type className="w-3 h-3" /> Ord:</span> Antall ord i artikkelen. Under 100 ord markeres som "Veldig kort".<br />
                            <span className="font-bold inline-flex items-center gap-1"><Image className="w-3 h-3" /> Bilde:</span> Grønn prikk betyr at artikkelen har et hovedbilde. Rød betyr at det mangler.<br />
                            <span className="font-bold inline-flex items-center gap-1"><Tag className="w-3 h-3" /> Tags:</span> Grønn prikk betyr at emneknagger er lagt inn (viktig for søk).<br />
                            Trykk på kolonneoverskriftene for å sortere tabellen.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-100">
                                <tr>
                                    <SortHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortHeader label="Artikkel" sortKey="title" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortHeader sortKey="wordCount" icon={Type} sortConfig={sortConfig} onSort={handleSort} />
                                    <div className="text-center"><SortHeader sortKey="hasImage" icon={Image} sortConfig={sortConfig} onSort={handleSort} /></div>
                                    <div className="text-center"><SortHeader sortKey="hasTags" icon={Tag} sortConfig={sortConfig} onSort={handleSort} /></div>
                                    <th className="px-6 py-4">Merknader</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {item.status === 'good' ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{item.title}</div>
                                            <div className="text-xs text-slate-400 font-mono truncate max-w-xs" title={item.path}>{item.path}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-center lg:text-left pl-10">
                                            {item.wordCount}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.hasImage ? (
                                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                                            ) : (
                                                <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.hasTags ? (
                                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                                            ) : (
                                                <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.issues.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.issues.map(issue => (
                                                        <span key={issue} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs border border-amber-100">
                                                            {issue}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
