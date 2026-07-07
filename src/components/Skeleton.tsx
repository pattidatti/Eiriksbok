import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div className={`skeleton-shimmer rounded-md ${className}`} />
    );
};

export const PageSkeleton: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6">
            {/* Header Skeleton */}
            <div className="mb-12 space-y-4">
                <Skeleton className="h-20 w-3/4 md:w-1/2" />
                <Skeleton className="h-6 w-1/3" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 rounded-xl bg-white border border-slate-100 overflow-hidden">
                        <Skeleton className="h-32 w-full" />
                        <div className="p-4 space-y-3">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
