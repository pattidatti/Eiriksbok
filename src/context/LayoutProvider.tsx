import React, { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutContext, FULL_WIDTH_PATHS } from './LayoutContext';

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [manualFullWidth, setManualFullWidth] = useState(false);
    const [hideHeader, setHideHeader] = useState(false);
    const [hideBreadcrumbs, setHideBreadcrumbs] = useState(false);

    // Derive isFullWidth from URL OR manual override
    // This runs synchronously during render, preventing CLS for known paths
    const isKnownFullWidthPath = FULL_WIDTH_PATHS.some((path) =>
        location.pathname.startsWith(path)
    );
    const isFullWidth = isKnownFullWidthPath || manualFullWidth;

    // Reset manual override on navigation (optional, but good practice)
    React.useEffect(() => {
        setManualFullWidth(false);
    }, [location.pathname]);

    const contextValue = React.useMemo(
        () => ({
            isFullWidth,
            setFullWidth: setManualFullWidth,
            hideHeader,
            setHideHeader,
            hideBreadcrumbs,
            setHideBreadcrumbs,
        }),
        [isFullWidth, hideHeader, hideBreadcrumbs]
    );

    return <LayoutContext.Provider value={contextValue}>{children}</LayoutContext.Provider>;
};
