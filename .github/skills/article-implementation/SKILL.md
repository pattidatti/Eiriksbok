---
name: article-implementation
description: Technical and pedagogical standards for implementing articles in Gravity. Use when asked to "build an article", "modernize content", or "audit an article".
---

# Article Implementation Standard (The "Rich Spec")

This skill governs the transformation of a Pedagogical Blueprint into a functional, aesthetic, and interactive article.

## 1. Pedagogical Identity
Every article must move beyond simple facts into deep explanation.
- **Narrative Depth**: 900-1200 ord, avhengig av kompleksitet.
- **Self-Sustaining Sektioner**: Each section should be readable in isolation, providing necessary context.
- **No Assumptions**: Fill in background info so the reader never feels "lost".
- **Tone**: Pedagogical, wondering, and explanatory.

## 2. Technical Structure (JSON)
Articles must follow the modern **Flat Content** pattern.
- **Layout**: Always use `"layout": "rich"`.
- **Flat Array**: The `content` array must NOT contain nested `section` blocks with their own `content` arrays (unless required by specific legacy components). Use `header` (level 2) and `subheader` to define structure.
- **Block Identification**: Blocks use `type` (modern) or `name` (legacy). 

## 3. Style Guidelines
- **Typography**: Absolutely NO bold text (`**bold**`) in body paragraphs.
- **Terminology**: Use the Global Glossary system. Terms are automatically highlighted or can be linked via `[Term](/subject/topic/article)`.
- **Lists**: Avoid "One sentence + list" patterns. Always provide an explanatory paragraph that elaborates on the points.
- **Spacing**: Use `header` blocks to create natural breathing room and trigger the Table of Contents.

## 4. Component Catalog & Usage
Choose components that underscore the pedagogical goal.

### Core & Layout
- `WritingFix`: Show "Bad vs Good" examples of analysis or writing.
- `Comparison`: Side-by-side analysis (e.g., Ideologies, Allianser).
- `TimelineComponent`: Use `props: { compact: true }` inside articles.
- `FactBox` / `InfoBox`: For "Did you know?" or technical details.
- `QuoteBlock`: For primary sources or key citations.
- `Gallery` / `MapCarousel`: For visual-heavy storytelling.

### Subject-Specific Tools
- **History**: `AllianceChain`, `PowderKeg`, `DreadnoughtDuel`, `TrenchCrossSection`, `TsarsDilemma`, `CensorTask`, `PropagandaDecoder`.
- **Economics/Demo**: `InflationCalculator`, `DTMSimulator`, `MalthusBoserupModel`, `PopulationPyramidBuilder`.
- **Music**: `VirtualPiano`, `BeatBuilder`, `SongwriterStudio`.
- **Philosophy**: `TrolleyProblem`, `FilterBubbleSim`, `ConformityExperiment`.

## 5. Implementation Workflow
1. **Manifest**: Add entry to `public/content/manifest.json`.
2. **Hero Image**: Generate via `image-style-guide.md` and place in `/images/lessons/`.
3. **Drafting**: Build the flat JSON array using rich components.
4. **Glossary Scan**: Run `npm run scan:concepts` to sync terms.
5. **Timeline Sync**: Ensure events are in `public/content/global-timeline.json`.
