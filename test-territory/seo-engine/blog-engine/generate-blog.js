const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { syncToGoogleSheets } = require('../google-sheets-sync');
const { syncWithMasterIndex } = require('../sitemap-utils');

const BASE_DIR = __dirname;
const CONFIG = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'blog-config.json'), 'utf8'));
const PILLARS_PATH = path.join(BASE_DIR, '..', 'PILLARS.json');
const REGISTRY_PATH = path.join(BASE_DIR, '..', 'REGISTRY.json');
const TEMPLATE_PATH = path.join(BASE_DIR, '..', 'TEMPLATES', 'blog-base.html');
const SITE_ROOT = path.join(BASE_DIR, '..', '..');
const SITEMAP_PATH = path.join(SITE_ROOT, 'sitemap-blog.xml');
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

function writePlaceholder(dir, url, title, pillar, isCornerstone) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'index.html');
    if (fs.existsSync(filePath)) return;

    let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    let footerGuidance = '';
    if (isCornerstone) {
        const guidanceUrl = `/newsletter/${normalizeSlug(title)}-guidance/`;
        footerGuidance = `\n<div class="guidance-box">\n  <p>Need more practical guidance on this? <a href="${guidanceUrl}">Read our Client Newsletter for ${title}</a>.</p>\n</div>`;
    }

    template = template.replace('{{TITLE}}', title)
        .replace('{{PILLAR}}', pillar)
        .replace('{{CANONICAL_URL}}', `${CONFIG.domain}${url}`)
        .replace('{{META_DESCRIPTION}}', `Read our latest guide on ${title} within the ${pillar} pillar.`)
        .replace('{{BODY_CONTENT}}', `<!-- FACTORY:BODY_START -->\n<p>Drafting content for this blog post...</p>${footerGuidance}\n<!-- FACTORY:BODY_END -->`);

    writeAtomic(filePath, template);
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

async function build() {
    if (DRY_RUN) console.log('*** DRY RUN MODE: No files will be written ***');

    if (!DRY_RUN && fs.existsSync(LOCK_FILE)) {
        const lockTime = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
        const ageInMinutes = (Date.now() - lockTime) / (1000 * 60);
        if (ageInMinutes < (CONFIG.lock_ttl_minutes || 30)) {
            console.error('Error: Build lock active.');
            process.exit(1);
        }
    }
    if (!DRY_RUN) fs.writeFileSync(LOCK_FILE, Date.now().toString());

    try {
        const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
        const pillars = JSON.parse(fs.readFileSync(PILLARS_PATH, 'utf8'));

        let newPostsCount = 0;
        const maxNew = CONFIG.max_new_posts_per_run || 5;

        // Simplified logic for template: Ensure all registry entries exist
        registry.pages.forEach(page => {
            const nSlug = normalizeSlug(page.slug);
            const url = `${CONFIG.base_path}/${nSlug}/`;
            const dir = path.join(SITE_ROOT, 'blog', nSlug);

            if (!fs.existsSync(path.join(dir, 'index.html'))) {
                if (newPostsCount < maxNew) {
                    console.log(`${DRY_RUN ? '[DRY RUN] Would build' : 'Building'}: ${url}`);
                    const isCornerstone = page.type === 'cornerstone';
                    writePlaceholder(dir, url, page.title, page.pillar, isCornerstone);
                    newPostsCount++;
                }
            }
        });

        // Generate Blog Sitemap
        const allUrls = registry.pages.map(p => `${CONFIG.base_path}/${normalizeSlug(p.slug)}/`);
        const sitemapContent = generateSitemap(allUrls);
        writeAtomic(SITEMAP_PATH, sitemapContent);
        writeAtomic(SITEMAP_HASH_PATH, getChecksum(sitemapContent));

        // Sync with Master Sitemap Index
        syncWithMasterIndex(SITE_ROOT, CONFIG.domain, 'sitemap-blog.xml');

        // Sync with Google Sheets
        const newId = await syncToGoogleSheets(CONFIG, SITE_ROOT, "SEO");
        if (newId && newId !== CONFIG.google_sheet_id) {
            CONFIG.google_sheet_id = newId;
            fs.writeFileSync(path.join(BASE_DIR, 'blog-config.json'), JSON.stringify(CONFIG, null, 4));
            console.log(`[Blog] Updated blog-config.json with new Sheet ID: ${newId}`);
        }

        console.log(`Run complete. Processed ${newPostsCount} new posts.`);

    } catch (err) {
        console.error('Blog Build failed:', err.message);
    } finally {
        if (!DRY_RUN && fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    }
}

(async () => {
    await build();
})();
