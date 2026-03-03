# 🚀 Master SEO Engine Template

This unified engine handles both **Local Geo-Targeting** and **Authority Blog/Cornerstone** content. It is designed to be dropped into any static project and run with minimal configuration.

## 🏗 System Structure

```text
/seo-engine/
│
├── package.json            # Unified dependencies and run scripts
├── google-sheets-sync.js   # Shared inventory sync logic
├── sitemap-utils.js        # Shared sitemap index management
│
├── local-engine/           # Focus: Cities, Services, Geo-intent
│   ├── generate-local.js
│   ├── locations.json
│   └── local-config.json
│
└── blog-engine/            # Focus: Pillars, Posts, Cornerstone
    ├── generate-blog.js
    ├── blog-config.json
    └── sitemap-blog.xml
```

## 🚀 Usage

### 1. Installation
Drop the `seo-engine` folder into your project root and run:
```bash
npm install
```

### 2. Configure (Optional)
The template comes with a **Master SEO Sheet** pre-configured for instant testing. 
To use your own client sheet, update `local-config.json`, `blog-config.json`, and `newsletter-config.json` with your:
- `domain`
- `google_sheet_id` (Share sheet with the service account below)

**Service Account Email:**
`seo-engine-access@endless-terra-488018.iam.gserviceaccount.com`

### 3. Run Commands

**Generate Local Geo-Pages:**
```bash
npm run run:local
```

**Generate Blog/Cornerstone Pages:**
```bash
npm run run:blog
```

**Validate Data Integrity:**
```bash
npm run validate
```

## 🛡️ Hardening Features
- **Atomic Writes**: Zero file corruption on crash.
- **Build Locking**: Prevents concurrent execution.
- **Master Sitemap Index**: Automatically manages `sitemap-core`, `sitemap-local`, and `sitemap-blog`.
- **GSC Strengthening**: Analyzes Search Console data to suggest new high-potential pages.
- **Inventory Sync**: Real-time updates to a single shared Google Sheet.
