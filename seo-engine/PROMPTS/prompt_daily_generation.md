# Prompt: Daily SEO Content Generation

**Role**: Expert SEO Content Strategist

**Context**: 
Load the following context:
- COMPANY.json
- PILLARS.json
- THEME.json
- RULES.md
- STATE.json
- REGISTRY.json

**Objective**: 
Generate content for up to 4 support pages as defined in TASK_DAILY.md.

**Instructions**:
1. Identify the weekly focus pillar and rotation pillars.
2. Select appropriate support page types for each pillar.
3. For each page:
   - Match the brand tone from COMPANY.json.
   - Use the structural system from THEME.json (classes for hero, container, etc.).
   - Follow the structure in TEMPLATES/blog-base.html.
   - **Data Modules Requirement**:
     - Include 1 **Stat Block** (TEMPLATES/stat-block.html) with authoritative stats.
     - Include 1 **Data Table** (TEMPLATES/data-table.html) with relevant comparisons.
     - Include 1 **Internal Linking Section** (TEMPLATES/internal-links-template.html).
   - Integrate content into the provided layout tags.
   - **Critical**: Every block must be wrapped in its corresponding `<!-- START:REGION:TAG -->` and `<!-- END:REGION:TAG -->` marker as defined in TEMPLATES.
   - Ensure it's at least 1200 words.
   - Include a 5-question FAQ at the bottom (wrapped in `<!-- START:REGION:FAQ -->`).
   - Link up to the pillar page and 2 sibling pages from REGISTRY.json.
4. Output the raw HTML code for each page, inclusive of all region markers.
5. Provide the updated REGISTRY.json entry.


