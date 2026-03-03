# Local SEO Engine Module

The Local SEO Engine is a modular extension for the SEO Factory. It provides the infrastructure to build and maintain high-authority geographic landing pages.

## System Architecture

```text
/seo-engine/
│
├── local-engine/
│   ├── README.md               # This file
│   ├── locations.json          # Tracks cities/states
│   ├── services.json           # Tracks service/slug mappings
│   ├── build-map.json          # Tracks city-service combos
│   ├── local-config.json       # System behavior settings
│   ├── sitemap-local.xml       # Dynamic local sitemap
│   ├── generate-local.js       # Core build logic
│   ├── validate.js             # Integrity checking layer
│   └── logs/
│       └── local-build-log.json # Historical build data
```

## Workflow Diagram

1. **Input**: Add locations to `locations.json` and services to `services.json`.
2. **Validate**: `node validate.js` ensures no duplicate slugs or malformed JSON.
3. **Generate**: `node generate-local.js` calculates required URLs.
4. **Log**: New URLs are added to `logs/local-build-log.json`.
5. **Sitemap**: `sitemap-local.xml` is updated and synced with the root `sitemap.xml`.
6. **Handoff**: Structured data is prepared for the Factory Engine.

## Safety Rules

- **Zero Overwrite**: The engine will NEVER overwrite an existing page.
- **Pre-check Integrity**: Validation must pass (checks JSON, duplicates, and physical exists) before any build.
- **Region Locking**: All generated content must respect the `<!-- START:REGION:TAG -->` markers of the host template.

## Expansion Strategy

- **Manual**: Add entries to `locations.json`.
- **Assisted**: Engine reads keyword clusters to suggest new geo-targets.
- **Auto**: Expansion to adjacent cities (configurable).

## Deployment

1. Run validation: `node local-engine/validate.js`
2. Run generation: `node local-engine/generate-local.js`
3. Commit the updated `local-build-log.json` and `sitemap-local.xml`.
