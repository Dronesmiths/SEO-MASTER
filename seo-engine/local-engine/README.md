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

## 🛡️ Safety & Hardening

This engine is equipped with 4 layers of "Future Brian" protection:

1.  **Build Lock**: `.build-lock` prevents concurrent runs. TTL: 30 mins (auto-clears stale locks).
2.  **Atomic Writes**: All critical files are written to `.tmp` first, then renamed to ensure zero corruption if the process crashes.
3.  **Strict Validation**: `validate.js` performs deep checks for malformed JSON and **normalized slug collisions** before any build starts.
4.  **Dry Run Mode**: Run `node generate-local.js --dry-run` to simulate a build and verify keyword/slug logic without writing any files.

## 🚀 Usage

### 1. Validate Configuration
```bash
node validate.js
```

### 2. Simulate Growth
```bash
node generate-local.js --dry-run
```

### 3. Execute Build
```bash
node generate-local.js
```

## 📊 Monitoring

Check `logs/run-summary-YYYY-MM-DD.json` for a post-run report on:
- New cities/services created.
- Skipped duplicates.
- Skipped low-intent keywords (assisted/auto mode).
- Collision errors.
