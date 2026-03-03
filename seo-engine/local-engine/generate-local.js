const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { runValidation } = require('./validate');

const BASE_DIR = __dirname;
const CONFIG = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'local-config.json'), 'utf8'));
const LOCATIONS = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'locations.json'), 'utf8'));
const SERVICES = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'services.json'), 'utf8'));
const BUILD_MAP_PATH = path.join(BASE_DIR, 'build-map.json');
const BUILD_LOG_PATH = path.join(BASE_DIR, 'logs', 'local-build-log.json');
const SITEMAP_PATH = path.join(BASE_DIR, 'sitemap-local.xml');
const MASTER_SITEMAP_PATH = path.join(BASE_DIR, '..', '..', 'sitemap.xml');
const SEO_KW_MAP_PATH = path.join(BASE_DIR, '..', 'KW_MAP.json');
const TEMPLATE_PATH = path.join(BASE_DIR, '..', 'TEMPLATES', 'page-template.html');
const SITE_ROOT = path.join(BASE_DIR, '..', '..');
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

function generateSitemap(urls) {
    const lastmod = new Date().toISOString().split('T')[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    urls.forEach(url => {
        xml += `  <url>\n    <loc>${CONFIG.domain}${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
}

function getChecksum(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

function verifySitemapIntegrity(newContent) {
    if (!fs.existsSync(SITEMAP_PATH)) {
        console.log('Local sitemap missing. This run will regenerate it.');
        return true;
    }
    if (!fs.existsSync(SITEMAP_HASH_PATH)) {
        console.log('Checksum missing. This run will re-baseline it.');
        return true;
    }

    const oldHash = fs.readFileSync(SITEMAP_HASH_PATH, 'utf8').trim();
    const currentHash = getChecksum(fs.readFileSync(SITEMAP_PATH, 'utf8'));

    if (oldHash !== currentHash) {
        console.error('CRITICAL: Sitemap integrity failure! Hash mismatch. Manual intervention required.');
        return false;
    }
    return true;
}

function syncWithMasterSitemap() {
    if (!CONFIG.auto_sitemap_sync || !fs.existsSync(MASTER_SITEMAP_PATH)) return;

    let masterContent = fs.readFileSync(MASTER_SITEMAP_PATH, 'utf8');
    const localSitemapUrl = `${CONFIG.domain}/sitemap-local.xml`;

    if (masterContent.includes(localSitemapUrl)) {
        console.log('Master sitemap already synced.');
        return;
    }

    // Logic to append to sitemapindex or convert urlset
    if (masterContent.includes('</sitemapindex>')) {
        const replacement = `  <sitemap>\n    <loc>${localSitemapUrl}</loc>\n  </sitemap>\n</sitemapindex>`;
        masterContent = masterContent.replace('</sitemapindex>', replacement);
    } else if (masterContent.includes('</urlset>')) {
        // Convert urlset to sitemapindex for the root index
        console.log('Converting root sitemap to sitemapindex for safe scaling...');

        // Save the old core urls to sitemap-core.xml first to prevent loss
        const coreSitemapPath = path.join(SITE_ROOT, 'sitemap-core.xml');
        if (!fs.existsSync(coreSitemapPath)) {
            writeAtomic(coreSitemapPath, masterContent);
        }

        masterContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            `  <sitemap>\n    <loc>${CONFIG.domain}/sitemap-core.xml</loc>\n  </sitemap>\n` +
            `  <sitemap>\n    <loc>${localSitemapUrl}</loc>\n  </sitemap>\n` +
            `</sitemapindex>`;
    }

    writeAtomic(MASTER_SITEMAP_PATH, masterContent);
    console.log('Synced with master sitemap.');
}

function normalizeSlug(slug) {
    return slug.toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function hasGeoIntent(keyword) {
    if (CONFIG.mode === 'manual') return true;
    const tokens = keyword.toLowerCase().split(/\s+/);
    const intentMarkers = CONFIG.geo_intent_keywords || [];
    return intentMarkers.some(marker => tokens.includes(marker));
}

function getKeywordHits(keyword, kwMap) {
    let hits = 0;
    const searchLow = keyword.toLowerCase();
    for (const key in kwMap) {
        if (key.toLowerCase().includes(searchLow)) hits++;
        if (Array.isArray(kwMap[key])) {
            kwMap[key].forEach(val => {
                if (val.toLowerCase().includes(searchLow)) hits++;
            });
        }
    }
    return hits;
}

function writePlaceholder(dir, url, title, h1) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'index.html');
    if (fs.existsSync(filePath)) return; // Safety: never overwrite

    let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    template = template.replace('{{TITLE}}', title)
        .replace('{{H1}}', h1)
        .replace('{{CANONICAL_URL}}', `${CONFIG.domain}${url}`)
        .replace('{{META_DESCRIPTION}}', `Professional ${h1} in ${title}.`)
        .replace('{{INTRO}}', `Looking for ${h1} in ${title}? We provide top-tier solutions tailored for your needs.`)
        .replace('{{BODY_SECTIONS}}', '<!-- FACTORY:BODY_START -->\n<p>Placeholder content for Factory Engine to replace.</p>\n<!-- FACTORY:BODY_END -->')
        .replace('{{FAQ_BLOCK}}', '<!-- FACTORY:FAQ_START -->\n<!-- FACTORY:FAQ_END -->')
        .replace('{{CTA_HEADING}}', `Get Started in ${title}`)
        .replace('{{CTA_TEXT}}', 'Contact our team of experts today.')
        .replace('{{CTA_LABEL}}', 'Contact Us')
        .replace('{{CTA_URL}}', '/contact/');

    writeAtomic(filePath, template);
}

function build() {
    if (DRY_RUN) console.log('*** DRY RUN MODE: No files will be written ***');

    if (!DRY_RUN && fs.existsSync(LOCK_FILE)) {
        const lockTime = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
        const ageInMinutes = (Date.now() - lockTime) / (1000 * 60);
        const ttl = CONFIG.lock_ttl_minutes || 30;

        if (ageInMinutes < ttl) {
            console.error(`Error: Build lock active (age: ${ageInMinutes.toFixed(1)}m, TTL: ${ttl}m).`);
            process.exit(1);
        } else {
            console.warn(`Stale lock detected (age: ${ageInMinutes.toFixed(1)}m). Resetting for fresh run.`);
            fs.unlinkSync(LOCK_FILE);
        }
    }

    if (!DRY_RUN) fs.writeFileSync(LOCK_FILE, Date.now().toString());

    const summary = {
        date: new Date().toISOString().split('T')[0],
        new_cities: 0,
        new_services: 0,
        skipped_duplicates: 0,
        skipped_low_intent: [],
        skipped_collisions: [],
        errors: []
    };

    try {
        runValidation();

        const buildLog = JSON.parse(fs.readFileSync(BUILD_LOG_PATH, 'utf8'));
        const existingUrls = new Set(buildLog.builds.map(b => b.url));
        const newUrls = [];
        const kwMap = fs.existsSync(SEO_KW_MAP_PATH) ? JSON.parse(fs.readFileSync(SEO_KW_MAP_PATH, 'utf8')) : {};

        let totalPagesBuiltInRun = 0;
        const maxTotalPages = CONFIG.max_total_new_pages_per_run || 25;
        let locationsInRun = 0;
        const maxLocations = CONFIG.max_new_locations_per_run || 3;

        const seenSlugs = new Set();

        for (const loc of LOCATIONS) {
            if (totalPagesBuiltInRun >= maxTotalPages) break;
            if (locationsInRun >= maxLocations) break;

            const nCitySlug = normalizeSlug(loc.slug);
            if (seenSlugs.has(nCitySlug)) {
                console.warn(`Collision detected: Slug ${nCitySlug} already processed this run. Check locations.json.`);
                summary.skipped_collisions.push(nCitySlug);
                continue;
            }
            seenSlugs.add(nCitySlug);
            if (nCitySlug !== loc.slug) {
                console.warn(`Normalized slug: ${loc.slug} -> ${nCitySlug}`);
            }

            const cityKeyword = `${loc.city}`;
            const hits = getKeywordHits(cityKeyword, kwMap);
            const minHits = CONFIG.assisted_min_keyword_hits || 0;

            if (CONFIG.mode !== 'manual' && hits < minHits) {
                console.log(`Skipping ${loc.city}: Low keyword hits (${hits}/${minHits})`);
                summary.skipped_low_intent.push(`${loc.city} (${hits}/${minHits})`);
                continue;
            }

            let newServicesCount = 0;
            const maxServices = CONFIG.max_new_services_per_location || 5;

            // 1. City main page: /city/
            const cityUrl = `/${nCitySlug}/`;
            let cityWasNew = false;
            if (existingUrls.has(cityUrl)) {
                summary.skipped_duplicates++;
            } else if (totalPagesBuiltInRun < maxTotalPages) {
                console.log(`${DRY_RUN ? '[DRY RUN] Would build' : 'Building'}: ${cityUrl}`);
                writePlaceholder(path.join(SITE_ROOT, nCitySlug), cityUrl, `${loc.city}, ${loc.state}`, `${loc.city} Local Services`);
                buildLog.builds.push({ url: cityUrl, type: 'location', timestamp: new Date().toISOString() });
                newUrls.push(cityUrl);
                totalPagesBuiltInRun++;
                locationsInRun++;
                summary.new_cities++;
                cityWasNew = true;
            }

            // 2. City + Service pages: /city/service/
            for (const svc of SERVICES) {
                if (totalPagesBuiltInRun >= maxTotalPages) break;
                if (newServicesCount >= maxServices) {
                    console.log(`Service threshold reached for ${loc.city}: ${maxServices} services max.`);
                    break;
                }

                const nSvcSlug = normalizeSlug(svc.slug);
                if (nSvcSlug !== svc.slug) {
                    console.warn(`Normalized slug: ${svc.slug} -> ${nSvcSlug}`);
                }

                const cityServiceUrl = `/${nCitySlug}/${nSvcSlug}/`;
                if (existingUrls.has(cityServiceUrl)) {
                    summary.skipped_duplicates++;
                } else {
                    console.log(`${DRY_RUN ? '[DRY RUN] Would build' : 'Building'}: ${cityServiceUrl}`);
                    writePlaceholder(path.join(SITE_ROOT, nCitySlug, nSvcSlug), cityServiceUrl, `${svc.name} in ${loc.city}, ${loc.state}`, `${svc.name} - ${loc.city}`);
                    buildLog.builds.push({ url: cityServiceUrl, type: 'city-service', timestamp: new Date().toISOString() });
                    newUrls.push(cityServiceUrl);
                    totalPagesBuiltInRun++;
                    newServicesCount++;
                    summary.new_services++;
                    if (!cityWasNew) {
                        cityWasNew = true;
                        locationsInRun++; // Count city if we add a service to it
                    }
                }
            }
        }

        if (newUrls.length > 0) {
            const sitemapContent = generateSitemap(buildLog.builds.map(b => b.url));

            if (!verifySitemapIntegrity(sitemapContent)) {
                throw new Error('Sitemap integrity mismatch.');
            }

            writeAtomic(BUILD_LOG_PATH, JSON.stringify(buildLog, null, 2));
            writeAtomic(SITEMAP_PATH, sitemapContent);
            writeAtomic(SITEMAP_HASH_PATH, getChecksum(sitemapContent));
            syncWithMasterSitemap();
        }

        const summaryPath = path.join(BASE_DIR, 'logs', `run-summary-${summary.date}.json`);
        writeAtomic(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`Run complete. Built ${newUrls.length} pages.`);

    } catch (err) {
        console.error('Build failed:', err.message);
        summary.errors.push(err.message);
    } finally {
        if (!DRY_RUN && fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
        }
    }
}

build();
