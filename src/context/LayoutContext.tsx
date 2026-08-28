import { createContext, useContext } from 'react';

export interface LayoutContextType {
    isFullWidth: boolean;
    setFullWidth: (value: boolean) => void;
    hideHeader: boolean;
    setHideHeader: (value: boolean) => void;
    hideBreadcrumbs: boolean;
    setHideBreadcrumbs: (value: boolean) => void;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const FULL_WIDTH_PATHS = [
    '/oving/detektiv',
    '/colonization',
    '/tidslinje',
    '/atlas',
    '/oving/tidsreise',
    '/oving/etikk',
    '/oving/simulering',
    '/infrastruktur-atlas',
    '/samfunnskunnskap/okonomi/verden',
    '/oving/spill/',
    '/oving/rpg',
    '/musikk/gitarstudio',
    '/himmel',
    '/oving/kjedereaksjonen',
    '/oving/kryssord',
    '/oving/pengeliv',
];

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
