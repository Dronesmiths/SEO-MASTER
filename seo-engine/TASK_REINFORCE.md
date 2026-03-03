# TASK: REINFORCE (Weekly Engine)

## Objective
Compounding SEO growth by re-optimizing existing content based on live GSC data.

## Step 1: Data Awareness
1. Load `ANALYTICS/GSC_PULL.json`.
2. Identify "Opportunities" in `OPPORTUNITIES.json`.

## Step 2: Optimization Thresholds
Apply the following deterministic logic:
- **High Impressions + Low CTR (< 2%)**: Rewrite H1 and Meta Description for better clickability.
- **Rising Queries (Position 11-30)**: Expand intro paragraph to include rising semantic keywords.
- **Declining Pages**: Add 1 new Stat Block + Update 2 FAQ questions with fresh intent.
- **Striking Distance (Position 8-15)**: Add a new Data Table + Expand body content by 300 words.

## Step 3: Link Weighting (Feed the Head)
- **Authority Flow**: New pages generated during the daily cycle MUST link to pages flagged as "Top Performers" in `GSC_PULL.json`.
- **Link Score**: Boost internal linking weight for pages in the top 5 ranking positions to protect their lead.

## Step 4: Region-Locked Execution
1. **Hash**: Calculate the "Skeleton Hash" of `/blog/{slug}/index.html` using `SCRIPTS/verify_integrity.py {slug}`.
1. **Extract**: Match existing `REGION` content using regex: `<!-- START:REGION:(.*?) -->(.*?)<!-- END:REGION:\1 -->`.
2. **Transform**: Run Re-Optimization Prompt on extracted regions only.
3. **Replace**: Re-insert the newly optimized content back into the exact same file position.
4. **Safety Check**: Run `SCRIPTS/verify_integrity.py {slug}` again.
5. **Update**: Finalize `/blog/{slug}/index.html`. If hash fails, ABORT and rollback.




## Constraints
- Max 4 page re-optimizations per cycle.
- Do NOT delete existing sections.
- Structural changes must respect `THEME.json`.
