# SEO Engine

This is a portable SEO engine designed to be dropped into any repository. It works for S3/CloudFront, Wrangler, or any static build.

## Directory Structure

/seo-engine/
  README.md
  COMPANY.json
  PILLARS.json
  RULES.md
  STATE.json
  REGISTRY.json
  TASK_DAILY.md
  TASK_WEEKLY.md
  PROMPTS/
    prompt_daily_generation.md
    prompt_weekly_gsc_actions.md
  TEMPLATES/
    page-template.html
    faq-template.html
    internal-links-template.html
  OUTPUT/
    (empty)

## Initialization

To initialize the SEO Engine for a new company:

1. Fill in `COMPANY.json`
2. Fill in `PILLARS.json` (3 pillars)
3. Set `STATE.json` (weekly focus + rotation)

## Daily Execution

Run the instructions in `TASK_DAILY.md`.

## Weekly Execution

Run the instructions in `TASK_WEEKLY.md`.
