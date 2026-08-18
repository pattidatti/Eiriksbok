import React from 'react';
import { ComparisonPage } from '../features/comparison/ComparisonPage';
import { religionConfig } from '../features/comparison/configs';
import { ReligionNextSteps } from '../components/religion/ReligionNextSteps';

// Innholdskartet lå her før, nederst på siden. Det er en orienteringsflate og
// hører hjemme på /krle/religion, der eleven begynner. Her slutter siden i
// stedet med veier videre - navngitt etter religionene som står på skjermen.
export const ReligionComparisonPage: React.FC = () => {
    return (
        <ComparisonPage
            config={religionConfig}
            footerExtra={({ selected, dim }) => (
                <ReligionNextSteps surface="sammenlign" dim={dim} selectedIds={selected} />
            )}
        />
    );
};
