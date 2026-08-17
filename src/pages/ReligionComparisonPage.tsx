import React from 'react';
import { ComparisonPage } from '../features/comparison/ComparisonPage';
import { religionConfig } from '../features/comparison/configs';
import { ReligionTopicMap } from '../components/religion/ReligionTopicMap';

// Innholdskartet ligger nederst: sammenligningen er hovedsaken, kartet er
// veien videre - til en profil, et tema eller en enkelt artikkel.
export const ReligionComparisonPage: React.FC = () => {
    return <ComparisonPage config={religionConfig} footerExtra={<ReligionTopicMap />} />;
};
