import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TimeTravelEngine } from '../components/chronos/TimeTravelEngine';
import { TimeTravelProfileProvider } from '../components/chronos/context/TimeTravelProfileProvider';
import { useLayout } from '../context/LayoutContext';

export const TimeTravelGamePage: React.FC = () => {
    const { scenarioId } = useParams<{ scenarioId: string }>();
    const { setHideHeader } = useLayout();

    useEffect(() => {
        setHideHeader(true);
        return () => setHideHeader(false);
    }, [setHideHeader]);

    if (!scenarioId) return <div>Scenario ID missing</div>;

    return (
        <TimeTravelProfileProvider>
            <TimeTravelEngine scenarioId={scenarioId} />
        </TimeTravelProfileProvider>
    );
};
