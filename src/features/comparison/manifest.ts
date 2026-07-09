import { useQuery } from '@tanstack/react-query';
import type { ComparisonManifest } from './types';

function getBasePath(): string {
    const base = import.meta.env.BASE_URL || '/';
    return base.endsWith('/') ? base : `${base}/`;
}

export async function fetchComparisonManifest(): Promise<ComparisonManifest> {
    const response = await fetch(`${getBasePath()}data/comparison-manifest.json`);
    if (!response.ok) {
        throw new Error(`Kunne ikke laste comparison-manifest.json (${response.status})`);
    }
    return response.json();
}

export function useComparisonManifest() {
    return useQuery({
        queryKey: ['comparison-manifest'],
        queryFn: fetchComparisonManifest,
        staleTime: Infinity,
        gcTime: 24 * 60 * 60 * 1000,
    });
}

export async function fetchJsonAsset<T>(relativePath: string): Promise<T | null> {
    try {
        const response = await fetch(`${getBasePath()}${relativePath.replace(/^\//, '')}`);
        if (!response.ok) return null;
        return (await response.json()) as T;
    } catch {
        return null;
    }
}
