# Daily SEO Task

0. **Lock Environment**: Run `python3 seo-engine/SCRIPTS/lock_manager.py acquire`.
1. Load:
   - COMPANY.json
   - PILLARS.json
   - STATE.json
   - REGISTRY.json
   - RULES.md

2. Determine weekly focus pillar.

3. Generate up to daily_limit support pages.

4. Create pages in:
   /blog/{slug}/index.html

   (Do NOT leave pages inside /seo-engine/OUTPUT)

5. Follow internal linking rules.

6. Update:
   - sitemap.xml
   - REGISTRY.json
   - STATE.json (increment support counts + update last_run)

7. Commit directly to main.

8. Post-Run Validation:
   - Confirm all new files physically exist.
   - Confirm sitemap.xml contains new URLs.
   - Confirm REGISTRY.json matches actual created pages.
   - Confirm no duplicate slugs exist.

