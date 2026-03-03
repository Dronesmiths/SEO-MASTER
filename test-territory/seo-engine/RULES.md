# SEO Engine Rules (Universal)

## Daily limits
- Max new pages/day: 4

## Where pages go
- Create new pages at: /blog/{slug}/index.html

## Content rules
- Minimum 1200 words
- 1 H1, then H2/H3 structure
- Include a 5-question FAQ at bottom
- Avoid duplicate topics already in REGISTRY.json
- Avoid cannibalizing pillar URLs

## Internal linking rules
- Every new page must link:
  - Up to its pillar page (1 exact match anchor)
  - To 2 sibling support pages already in registry

## Internal Linking Quality
Sibling links must:
- Share topical similarity
- Contain overlapping keywords
- Be contextually relevant in paragraph form

## Slug Safety
Before creating a new page:
1. Check if /blog/{slug}/ already exists.
2. If it exists, abort and generate a new unique slug.
3. Confirm slug does not already appear in REGISTRY.json.

## Pillar Rotation
If weekly_focus_slug has:
- Exceeded 7 days since last rotation
OR
- Reached +10 new support pages

Rotate to next slug in rotation_slugs array.

## Sitemap Rules
If sitemap.xml does not exist:
- Create it with valid XML structure.

When updating sitemap:
- Preserve XML format.
- Append new URLs without breaking structure.

## Keyword Map Protection
Before generating a topic:
- Ensure primary keyword does not exist in KW_MAP.json.
- Append keyword after creation.

## Built-In Data Modules
Every page must include at least:
- 1 Stat Block (using `stat-block.html`)
- 1 Data Comparison Table (using `data-table.html`)
- 1 Internal Linking Section (using `internal-links-template.html`)

Stat blocks must demonstrate data-backed authority (e.g., "73% of...", "2x growth...").
Data tables must provide direct comparisons or structured values to avoid thin content.

## Reinforcement Rules (Weekly)
- No freestyling: Changes must be based on deterministic thresholds in `TASK_REINFORCE.md`.
- Max re-optimizations per week: 4 pages.
- Edits are additive: Do not remove existing content blocks unless explicitly replacing for CTR optimization.
- Schema Update: Every re-optimization must refresh JSON-LD schema with updated `dateModified`.

## Internal Linking Weights
- **Top Performer Boost**: Enabled. Pages in the top 5 ranking positions (from `GSC_PULL.json`) receive 3x internal link priority.
- **Upward Flow**: Support pages must link to their Pillar page + at least 1 "Top Performer" from its cluster.

## Region Boundary Enforcement (Critical)
- **Immutable Boundaries**: Content outside of `<!-- START:REGION:X -->` and `<!-- END:REGION:X -->` markers is technically immutable.
- **Rule of Extraction**: The engine may ONLY modify the string between these markers.
- **Pre-Commit Check**: Any modification that breaks or moves a `REGION` tag marker is an invalid output.
- **Manual Edit Protection**: Human comments or custom scripts placed OUTSIDE regions must remain untouched by all automated cycles.



## Site updates required

- Update sitemap.xml with new URLs
- Append new URLs to REGISTRY.json

## Commit rules

- Commit directly to main
- Commit message format:
  "SEO: add {N} support pages for {pillar_slug}"
