// Fagnavnene slik de vises i Kryssord. Egen fil fordi både oppsettskjermen og
// siden trenger dem, og en komponentfil som eksporterer konstanter brekker
// hot reload (react-refresh/only-export-components).

export const SUBJECT_LABELS: Record<string, string> = {
    historie: 'Historie',
    norsk: 'Norsk',
    krle: 'KRLE',
    samfunnskunnskap: 'Samfunnskunnskap',
    musikk: 'Musikk',
};
