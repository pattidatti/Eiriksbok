import React, { useEffect, useState, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { territoryHistory, countryColors, colonizationEvents, majorWars } from './colonizationData';
import { Tooltip } from 'react-tooltip';
import { topologyToFeatures, type GeoFeature } from '../../types/geo';


// Verdensgeometrien lastes LOKALT (public/data/world/) - aldri fra CDN. På Chromebook
// i klasserom med ustabilt nett ville en CDN-henting gitt blank skjerm.
const GEO_URL = '/data/world/countries-110m.json';

interface MapChartProps {
    year: number;
}

const MapChart: React.FC<MapChartProps> = ({ year }) => {
    const [geographies, setGeographies] = useState<GeoFeature[]>([]);

    useEffect(() => {
        fetch(GEO_URL)
            .then(response => response.json())
            .then(worldData => {
                setGeographies(topologyToFeatures(worldData));
            })
            .catch(error => console.error("Error loading map data:", error));
    }, []);

    const projection = useMemo(() => geoMercator().scale(140).translate([400, 250]), []);
    const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

    // Mapping for common country names to ISO codes if ISO_A3 is missing
    const nameToIso: Record<string, string> = {
        "United States of America": "USA",
        "United States": "USA",
        "Brazil": "BRA",
        "Mexico": "MEX",
        "Argentina": "ARG",
        "Peru": "PER",
        "Colombia": "COL",
        "Canada": "CAN",
        "India": "IND",
        "Australia": "AUS",
        "Indonesia": "IDN",
        "South Africa": "ZAF",
        "United Kingdom": "GBR",
        "France": "FRA",
        "Spain": "ESP",
        "Portugal": "PRT",
        "Netherlands": "NLD",
        "Russia": "RUS",
        "China": "CHN",

        // Africa - North
        "Egypt": "EGY",
        "Algeria": "DZA",
        "Morocco": "MAR",
        "Libya": "LBY",
        "Tunisia": "TUN",
        "W. Sahara": "ESH",
        "Western Sahara": "ESH",
        "Sudan": "SDN",
        "S. Sudan": "SSD",
        "South Sudan": "SSD",

        // Africa - West
        "Nigeria": "NGA",
        "Ghana": "GHA",
        "Ivory Coast": "CIV",
        "Côte d'Ivoire": "CIV",
        "Senegal": "SEN",
        "Mali": "MLI",
        "Gambia": "GMB",
        "Guinea-Bissau": "GNB",
        "Guinea": "GIN",
        "Sierra Leone": "SLE",
        "Liberia": "LBR",
        "Burkina Faso": "BFA",
        "Niger": "NER",
        "Togo": "TGO",
        "Benin": "BEN",
        "Mauritania": "MRT",

        // Africa - Central
        "Dem. Rep. Congo": "COD",
        "Democratic Republic of the Congo": "COD",
        "Congo": "COG",
        "Cameroon": "CMR",
        "Central African Rep.": "CAF",
        "Central African Republic": "CAF",
        "Chad": "TCD",
        "Gabon": "GAB",
        "Eq. Guinea": "GNQ",
        "Equatorial Guinea": "GNQ",

        // Africa - East
        "Kenya": "KEN",
        "Tanzania": "TZA",
        "Uganda": "UGA",
        "Ethiopia": "ETH",
        "Somalia": "SOM",
        "Somaliland": "SOM",
        "Djibouti": "DJI",
        "Eritrea": "ERI",
        "Madagascar": "MDG",
        "Rwanda": "RWA",
        "Burundi": "BDI",

        // Africa - South
        "Zimbabwe": "ZWE",
        "Angola": "AGO",
        "Mozambique": "MOZ",
        "Namibia": "NAM",
        "Zambia": "ZMB",
        "Malawi": "MWI",
        "Botswana": "BWA",
        "Lesotho": "LSO",
        "Swaziland": "SWZ",
        "eSwatini": "SWZ"
        // South Africa is already at the top
    };

    const getCountryColor = (geo: GeoFeature) => {
        let countryCode = geo.properties?.ISO_A3;

        // Fallback to name mapping if ISO_A3 is missing
        if (!countryCode || !territoryHistory[countryCode]) {
            const name = geo.properties?.name;
            if (name && nameToIso[name]) {
                countryCode = nameToIso[name];
            } else if (name && territoryHistory[name]) {
                countryCode = name;
            }
        }

        // countryCode kan fortsatt være undefined her (kartfila mangler både
        // ISO_A3 og et navn vi kjenner igjen) - da faller vi til standardfargen,
        // som er akkurat det oppslaget gjorde før.
        const history = countryCode ? territoryHistory[countryCode] : undefined;

        if (!history) return countryColors["default"];

        const period = history.find(h => year >= h.start && year <= h.end);
        if (period) {
            return countryColors[period.owner] || countryColors["default"];
        }

        return countryColors["default"];
    };

    // Show events that happened within the last 20 years
    const currentEvents = colonizationEvents.filter(e => e.year <= year && e.year >= year - 20);

    // Show active wars
    const activeWars = majorWars.filter(w => year >= w.startYear && year <= w.endYear);

    return (
        <div className="w-full h-full bg-blue-50 rounded-lg overflow-hidden relative flex justify-center items-center">
            <svg width="100%" height="100%" viewBox="0 0 800 500" style={{ maxHeight: '100%' }}>
                <g>
                    {geographies.map((geo, i) => {
                        const d = pathGenerator(geo);
                        const fillColor = getCountryColor(geo);
                        return (
                            <path
                                key={i}
                                d={d || ""}
                                fill={fillColor}
                                stroke="#D6D6DA"
                                strokeWidth={0.5}
                                className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                                data-tooltip-id="my-tooltip"
                                data-tooltip-content={geo.properties.name}
                                style={{ transition: 'fill 0.5s ease' }}
                            />
                        );
                    })}
                </g>
                <g>
                    {currentEvents.map((event, index) => {
                        const [x, y] = projection([event.location[1], event.location[0]]) || [0, 0];
                        // Calculate opacity based on how long ago the event happened (fade out)
                        const age = year - event.year;
                        const opacity = 1 - (age / 25); // Fade out over 25 years

                        return (
                            <g key={`event-${index}`} transform={`translate(${x}, ${y})`} style={{ opacity: Math.max(0, opacity) }}>
                                <circle r={6} fill="#F00" stroke="#fff" strokeWidth={2} className="animate-pulse" />
                                <text
                                    textAnchor="middle"
                                    y={-12}
                                    style={{ fontFamily: "system-ui", fill: "#333", fontSize: "12px", fontWeight: 'bold', textShadow: '0px 1px 2px rgba(255,255,255,0.8)' }}
                                >
                                    {event.year}: {event.event}
                                </text>
                            </g>
                        );
                    })}
                </g>
                <g>
                    {activeWars.map((war, index) => {
                        const [x, y] = projection([war.location[1], war.location[0]]) || [0, 0];
                        return (
                            <g key={`war-${index}`} transform={`translate(${x}, ${y})`} className="cursor-pointer"
                                data-tooltip-id="war-tooltip"
                                data-tooltip-content={`${war.name} (${war.startYear}-${war.endYear}): ${war.description}`}
                            >
                                {/* Crossed Swords Icon approximation or simple marker */}
                                <circle r={12} fill="rgba(0,0,0,0.6)" stroke="#fff" strokeWidth={2} />
                                <text textAnchor="middle" dy=".3em" fontSize="14" fill="white">⚔️</text>
                                <text
                                    textAnchor="middle"
                                    y={-18}
                                    style={{ fontFamily: "system-ui", fill: "#D62828", fontSize: "14px", fontWeight: 'bold', textShadow: '0px 1px 2px rgba(255,255,255,0.8)' }}
                                >
                                    {war.name}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
            <Tooltip id="my-tooltip" />
            <Tooltip id="war-tooltip" style={{ maxWidth: '300px', backgroundColor: '#333', color: '#fff', borderRadius: '8px', padding: '12px', zIndex: 1000 }} />
        </div>
    );
};

export default MapChart;
