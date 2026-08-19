import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { fetchManifest } from '../utils/contentLoader';
import type { Manifest } from '../types';

export const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const [manifest, setManifest] = useState<Manifest | null>(null);

    useEffect(() => {
        fetchManifest().then(setManifest);
    }, []);

    if (location.pathname === '/') return null;
    if (location.pathname.startsWith('/sim')) return null;

    const pathSegments = location.pathname.split('/').filter(Boolean);

    // Helper to find title for an ID
    const getTitle = (id: string, index: number): string => {
        // Manual overrides - Check these first!
        if (id === 'oving') return 'Øving';
        if (id === 'flashcards') return 'Fagbegreper';
        // KRLE-religionsrommet er ruter uten emne i manifestet
        if (id === 'religionsrommet') return 'Religionsrommet';
        if (id === 'sammenlign') return 'Sammenlign';
        if (id === 'tema') return 'Temaer';

        if (!manifest) return id;

        // Subject (Index 0)
        if (index === 0) {
            const subject = manifest.subjects.find(s => s.id === id);
            return subject ? subject.title : id;
        }

        // Topic (Index 1)
        if (index === 1) {
            const subjectId = pathSegments[0];
            const subject = manifest.subjects.find(s => s.id === subjectId);
            const topic = subject?.topics.find(t => t.id === id);
            return topic ? topic.title : id;
        }

        // Subtopic or Lesson (Index 2+)
        // This is a simplified lookup and might need recursion for deep structures
        // For now, we return the ID formatted nicely if not found easily

        return id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-2 overflow-x-auto whitespace-nowrap py-2">
            <Link
                to="/"
                className="flex items-center hover:text-slate-900 transition-colors"
            >
                <Home className="w-4 h-4" />
            </Link>

            {pathSegments.map((segment, index) => {
                const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                const title = getTitle(segment, index);

                return (
                    <React.Fragment key={path}>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        {isLast ? (
                            <span className="font-medium text-slate-900">
                                {title}
                            </span>
                        ) : (
                            <Link
                                to={path}
                                className="hover:text-slate-900 transition-colors"
                            >
                                {title}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
