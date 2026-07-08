import React from 'react';
import { Skeleton } from '../../../Skeleton';

export const DetectiveSkeleton: React.FC = () => {
    return (
        <div className="relative bg-white text-slate-700 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col h-full">
            {/* Header */}
            <header className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20 bg-indigo-100" />
                    <Skeleton className="h-5 w-48 bg-slate-100" />
                </div>
                <Skeleton className="h-8 w-40 rounded-full bg-slate-100" />
            </header>

            {/* Content */}
            <div className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    <Skeleton className="h-48 w-full rounded-xl bg-slate-100" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-slate-100" />
                        <Skeleton className="h-4 w-full bg-slate-100" />
                        <Skeleton className="h-4 w-2/3 bg-slate-100" />
                    </div>
                    <Skeleton className="h-32 w-full rounded-xl bg-slate-100" />
                </div>
            </div>

            {/* Footer */}
            <footer className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <Skeleton className="h-8 w-24 rounded-lg bg-slate-100" />
                <Skeleton className="h-8 w-28 rounded-lg bg-indigo-100" />
            </footer>
        </div>
    );
};
