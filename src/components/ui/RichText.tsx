import React from 'react';
import { useGlossary } from '../../context/GlossaryContext';
import { getTermMatcher, highlightTerms } from '../glossaryTerms';

/**
 * Rendrer den enkle rich-text-strukturen som ligger i `public/data/religion/*.json`.
 *
 * Innholdet ble opprinnelig skrevet i TinaCMS, som lagret det som et lite tre av
 * noder. Editoren er tatt ut av prosjektet, men datafilene beholder formatet, så
 * denne komponenten erstatter `TinaMarkdown` uten at innholdet må skrives om.
 *
 * Datasettet bruker i praksis kun `root`, `p` og `text` (verifisert: 63 root,
 * 189 p, 189 text, ingen andre nodetyper). De øvrige typene under er billig
 * forsikring hvis noen senere limer inn rikere tekst i en av JSON-filene -
 * ukjente noder rendrer barna sine i stedet for å forsvinne stille.
 */

interface RichTextNode {
    type?: string;
    text?: string;
    children?: RichTextNode[];
    // Marks fra Slate-formatet Tina brukte
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    underline?: boolean;
    // Node-spesifikke felter
    url?: string;
    caption?: string;
    alt?: string;
}

type TermMatcher = ReturnType<typeof getTermMatcher>;

function renderNode(node: RichTextNode, key: React.Key, matcher: TermMatcher): React.ReactNode {
    if (!node || typeof node !== 'object') return null;

    // Bladnode: ren tekst, eventuelt med marks.
    if (typeof node.text === 'string') {
        if (!node.text) return null;
        // Begreper fra ordlista markeres her, slik at eleven får forklaringen ved
        // å holde musa over ordet - også på religionssidene og i sammenligningen.
        let el: React.ReactNode = highlightTerms(node.text, matcher, `t-${key}`);
        if (node.bold) el = <strong>{el}</strong>;
        if (node.italic) el = <em>{el}</em>;
        if (node.underline) el = <u>{el}</u>;
        if (node.code) el = <code>{el}</code>;
        return <React.Fragment key={key}>{el}</React.Fragment>;
    }

    const children = (node.children ?? []).map((child, i) => renderNode(child, i, matcher));

    switch (node.type) {
        case 'root':
            return <React.Fragment key={key}>{children}</React.Fragment>;
        case 'p':
            return <p key={key}>{children}</p>;
        case 'h1':
            return <h1 key={key}>{children}</h1>;
        case 'h2':
            return <h2 key={key}>{children}</h2>;
        case 'h3':
            return <h3 key={key}>{children}</h3>;
        case 'h4':
            return <h4 key={key}>{children}</h4>;
        case 'ul':
            return <ul key={key}>{children}</ul>;
        case 'ol':
            return <ol key={key}>{children}</ol>;
        case 'li':
            return <li key={key}>{children}</li>;
        // Tina pakket listeinnhold i en ekstra lp-node ("list paragraph").
        case 'lic':
        case 'lp':
            return <React.Fragment key={key}>{children}</React.Fragment>;
        case 'blockquote':
            return <blockquote key={key}>{children}</blockquote>;
        case 'a':
            return (
                <a key={key} href={node.url} target="_blank" rel="noopener noreferrer">
                    {children}
                </a>
            );
        case 'img':
            return <img key={key} src={node.url} alt={node.alt ?? node.caption ?? ''} />;
        case 'br':
            return <br key={key} />;
        case 'code_block':
            return (
                <pre key={key}>
                    <code>{children}</code>
                </pre>
            );
        default:
            // Ukjent nodetype: behold innholdet framfor å droppe det.
            return <React.Fragment key={key}>{children}</React.Fragment>;
    }
}

interface RichTextProps {
    content: unknown;
}

export const RichText: React.FC<RichTextProps> = ({ content }) => {
    const { entries } = useGlossary();
    const matcher = React.useMemo(() => getTermMatcher(entries), [entries]);

    if (!content) return null;

    // Feltet kan være et enkelt tre, en liste av noder, eller ren tekst.
    if (typeof content === 'string') {
        return <p>{highlightTerms(content, matcher, 't-0')}</p>;
    }
    if (Array.isArray(content)) {
        return <>{content.map((n, i) => renderNode(n as RichTextNode, i, matcher))}</>;
    }
    if (typeof content === 'object') {
        return <>{renderNode(content as RichTextNode, 0, matcher)}</>;
    }
    return null;
};
