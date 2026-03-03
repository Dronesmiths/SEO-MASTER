const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { syncToGoogleSheets } = require('../google-sheets-sync');
const { syncWithMasterIndex } = require('../sitemap-utils');

const BASE_DIR = __dirname;
const CONFIG = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'newsletter-config.json'), 'utf8'));
const REGISTRY_PATH = path.join(BASE_DIR, '..', 'REGISTRY.json');
const TEMPLATE_PATH = path.join(BASE_DIR, '..', 'TEMPLATES', 'newsletter-base.html');
const SITE_ROOT = path.join(BASE_DIR, '..', '..');
const SITEMAP_PATH = path.join(SITE_ROOT, 'sitemap-newsletter.xml');
const LOCK_FILE = path.join(BASE_DIR, '.build-lock');
const SITEMAP_HASH_PATH = path.join(BASE_DIR, 'logs', 'sitemap-hash.txt');

const DRY_RUN = process.argv.includes('--dry-run');

// --- UTILS ---

function writeAtomic(filePath, content) {
    if (DRY_RUN) {
        console.log(`[DRY RUN] Would write to: ${filePath}`);
        return;
    }
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, content);
    fs.renameSync(tmpPath, filePath);
}

function getChecksum(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

function normalizeSlug(slug) {
    return slug.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function generateSitemap(urls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    urls.forEach(url => {
        xml += `  <url>\n    <loc>${CONFIG.domain}${url}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n  </url>\n`;
    });
    xml += '</urlset>';
    return xml;
}

function writePlaceholder(dir, url, title, topic) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'index.html');
    if (fs.existsSync(filePath)) return;

    // Use newsletter template if exists, else fallback to blog-base
    let templatePath = TEMPLATE_PATH;
    if (!fs.existsSync(templatePath)) {
        templatePath = path.join(BASE_DIR, '..', 'TEMPLATES', 'blog-base.html');
    }

    let template = fs.readFileSync(templatePath, 'utf8');
    template = template.replace('{{TITLE}}', `Guidance: ${title}`)
        .replace('{{H1}}', `Newsletter: ${title}`)
        .replace('{{CANONICAL_URL}}', `${CONFIG.domain}${url}`)
        .replace('{{BODY_CONTENT}}', `<!-- FACTORY:BODY_START -->\n<p>This is a guidance newsletter for <strong>${topic}</strong>. We cover the latest questions and practical how-to steps for our clients.</p>\n<!-- FACTORY:BODY_END -->`);

    writeAtomic(filePath, template);
}

async function build() {
    if (DRY_RUN) console.log('*** DRY RUN MODE: No files will be written ***');

    if (!DRY_RUN && fs.existsSync(LOCK_FILE)) {
        const lockTime = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
        if ((Date.now() - lockTime) / (1000 * 60) < (CONFIG.lock_ttl_minutes || 30)) {
            console.error('Error: Build lock active.');
            process.exit(1);
        }
    }
    if (!DRY_RUN) fs.writeFileSync(LOCK_FILE, Date.now().toString());

    try {
        const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

        let count = 0;
        const generatedUrls = [];

        // For now, generate newsletters for "cornerstone" or high-priority blog topics
        registry.pages.forEach(page => {
            if (page.type === 'cornerstone' || page.newsletter === true) {
                const nSlug = normalizeSlug(page.slug) + '-guidance';
                const url = `${CONFIG.base_path}/${nSlug}/`;
                const dir = path.join(SITE_ROOT, 'newsletter', nSlug);

                generatedUrls.push(url);
                if (!fs.existsSync(path.join(dir, 'index.html'))) {
                    console.log(`${DRY_RUN ? '[DRY RUN] Would build' : 'Building Newsletter'}: ${url}`);
                    writePlaceholder(dir, url, page.title, page.pillar);
                    count++;
                }
            }
        });

        // Sitemap
        const sitemapContent = generateSitemap(generatedUrls);
        writeAtomic(SITEMAP_PATH, sitemapContent);
        writeAtomic(SITEMAP_HASH_PATH, getChecksum(sitemapContent));

        // Sync with Master Index
        syncWithMasterIndex(SITE_ROOT, CONFIG.domain, 'sitemap-newsletter.xml');

        // Sync Sheets
        const newId = await syncToGoogleSheets(CONFIG, SITE_ROOT, "Newsletter");
        if (newId && newId !== CONFIG.google_sheet_id) {
            CONFIG.google_sheet_id = newId;
            fs.writeFileSync(path.join(BASE_DIR, 'newsletter-config.json'), JSON.stringify(CONFIG, null, 4));
            console.log(`[Newsletter] Updated newsletter-config.json with new Sheet ID: ${newId}`);
        }

        console.log(`Run complete. Processed ${count} newsletter pages.`);

    } catch (err) {
        console.error('Newsletter Build failed:', err.message);
    } finally {
        if (!DRY_RUN && fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    }
}

(async () => {
    await build();
})();
