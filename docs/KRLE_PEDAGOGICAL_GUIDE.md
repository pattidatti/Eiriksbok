# KRLE Pedagogical Guide: The 7 Dimensions

KRLE (Kristendom, Religion, Livssyn og Etikk) in Eiriksbok is built on a **comparison-first** philosophy. Unlike History, which follows a linear narrative, KRLE investigates how human beings express faith and ethics across culture and time through specific systems.

## The Core Framework: Ninian Smart's 7 Dimensions

Every "Religion" in the system is defined by Ninian Smart's dimensions. When creating content for KRLE, you MUST anchor it in one or more of these:

1.  **Ritual (Ritualer og kult):** What do people *do*? (Bønn, dåp, meditasjon).
2.  **Narrative (Fortellinger og myter):** What are the sacred stories? (Skapelse, legender).
3.  **Experiential (Opplevelser):** What does the faith *feel* som? (Mystikk, omvendelse).
4.  **Social (Sosial organisering):** How is the community structured? (Kirke, sangha, hierarki).
5.  **Ethical (Etikk og moral):** What is "the good life"? (De ti bud, dygder).
6.  **Doctrinal (Lære og filosofi):** What are the core truth claims? (Treenigheten, karma).
7.  **Material (Materielle uttrykk):** What are the physical objects? (Templer, symboler, kunst).

## Comparison-Ready Writing

The goal is to allow students to compare "Bønn" in Islam with "Bønn" in Kristendom side-by-side.

### Rules for KRLE Articles:
- **Dimension Tagging:** Every article must define which `dimension` it primary focuses on.
- **Comparison Tags:** Use `#tags` for themes that cut across religions (e.g., `#døden`, `#frelse`, `#hellige-skrifter`).
- **Objectivity vs. Immersive:** Use a respectful, objective tone ("Muslimer tror...") but provide enough detail to make the experience "vivid" (The "Act" model from the Learning Path guide still applies).
- **The Dashboard Feed:** Remember that your article text will be linked from the comparison dashboard. Ensure headers are clean and lists are well-formatted.

## Technical Requirements (JSON)
- **Subject:** `krle`
- **Schema:** Uses `name` field for content blocks (matches ComponentRegistry lookup).
- **Metadata:**
  ```json
  "religion": "islam",
  "dimension": "ritual",
  "comparison_tags": ["bønn", "dagligliv"]
  ```

## Designing for Philosophy & Ethics
Philosophy articles should also follow a comparison pattern, but focus on the "Great Questions" (e.g., "Hva er virkelighet?", "Hva er et godt menneske?"). Use the `PhilosophyComparisonPage` to verify that new philosophers integrate correctly.
