import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextType {
    isFullWidth: boolean;
    setFullWidth: (value: boolean) => void;
    hideHeader: boolean;
    setHideHeader: (value: boolean) => void;
    hideBreadcrumbs: boolean;
    setHideBreadcrumbs: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

import { useLocation } from 'react-router-dom';

const FULL_WIDTH_PATHS = [
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
    '/musikk/gitarstudio',
    '/himmel',
];

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [manualFullWidth, setManualFullWidth] = useState(false);
    const [hideHeader, setHideHeader] = useState(false);
    const [hideBreadcrumbs, setHideBreadcrumbs] = useState(false);

    // Derive isFullWidth from URL OR manual override
    // This runs synchronously during render, preventing CLS for known paths
    const isKnownFullWidthPath = FULL_WIDTH_PATHS.some(path => location.pathname.startsWith(path));
    const isFullWidth = isKnownFullWidthPath || manualFullWidth;

    // Reset manual override on navigation (optional, but good practice)
    React.useEffect(() => {
        setManualFullWidth(false);
    }, [location.pathname]);

    const contextValue = React.useMemo(() => ({
        isFullWidth,
        setFullWidth: setManualFullWidth,
        hideHeader,
        setHideHeader,
        hideBreadcrumbs,
        setHideBreadcrumbs
    }), [isFullWidth, hideHeader, hideBreadcrumbs]);

    return (
        <LayoutContext.Provider value={contextValue}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
