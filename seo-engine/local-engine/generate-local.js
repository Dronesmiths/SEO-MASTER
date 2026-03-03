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
    if (!fs.existsSync(SITEMAP_PATH)) return true;
    if (!fs.existsSync(SITEMAP_HASH_PATH)) return true;

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
        // Safety: We only do this if it looks like a standard sitemap
        console.log('Converting root sitemap to sitemapindex...');
        masterContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            `  <sitemap>\n    <loc>${CONFIG.domain}/sitemap.xml</loc>\n  </sitemap>\n` +
            `  <sitemap>\n    <loc>${localSitemapUrl}</loc>\n  </sitemap>\n` +
            `</sitemapindex>`;
    }

    fs.writeFileSync(MASTER_SITEMAP_PATH, masterContent);
    console.log('Synced with master sitemap.');
}

function hasGeoIntent(keyword) {
    if (CONFIG.mode === 'manual') return true; // Manual override
    const intentMarkers = CONFIG.geo_intent_keywords || [];
    return intentMarkers.some(marker => keyword.toLowerCase().includes(marker));
}

function getKeywords() {
    if (!fs.existsSync(SEO_KW_MAP_PATH)) return [];
    const kwMap = JSON.parse(fs.readFileSync(SEO_KW_MAP_PATH, 'utf8'));
    return Object.keys(kwMap);
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

    fs.writeFileSync(filePath, template);
}

function build() {
    if (fs.existsSync(LOCK_FILE)) {
        console.error('Error: Build lock file exists. Another process might be running.');
        process.exit(1);
    }
    fs.writeFileSync(LOCK_FILE, Date.now().toString());

    try {
        runValidation();

        const buildLog = JSON.parse(fs.readFileSync(BUILD_LOG_PATH, 'utf8'));
        const buildMap = JSON.parse(fs.readFileSync(BUILD_MAP_PATH, 'utf8'));
        const existingUrls = new Set(buildLog.builds.map(b => b.url));
        const newUrls = [];

        const keywords = getKeywords();
        const confirmedGeoKeywords = keywords.filter(hasGeoIntent);

        let newLocationsCount = 0;
        const maxLocations = CONFIG.max_new_locations_per_run || 3;

        for (const loc of LOCATIONS) {
            if (newLocationsCount >= maxLocations) {
                console.log(`Expansion threshold reached: ${maxLocations} locations max per run.`);
                break;
            }

            // Check for keyword backing if in assisted/auto mode
            const hasBacking = confirmedGeoKeywords.length > 0 || CONFIG.mode === 'manual';

            if (!hasBacking) {
                console.log(`Skipping ${loc.city}: No geo-intent keywords detected in SEO engine.`);
                continue;
            }

            let newServicesCount = 0;
            const maxServices = CONFIG.max_new_services_per_location || 5;

            // 1. City main page: /city/
            const cityUrl = `/${loc.slug}/`;
            let cityWasNew = false;
            if (!existingUrls.has(cityUrl)) {
                console.log(`Building location: ${cityUrl}`);
                const dir = path.join(SITE_ROOT, loc.slug);
                writePlaceholder(dir, cityUrl, `${loc.city}, ${loc.state}`, `${loc.city} Local Services`);
                newUrls.push(cityUrl);
                buildLog.builds.push({ url: cityUrl, type: 'location', timestamp: new Date().toISOString() });
                newLocationsCount++;
                cityWasNew = true;
            }

            // 2. City + Service pages: /city/service/
            for (const svc of SERVICES) {
                if (newServicesCount >= maxServices) {
                    console.log(`Service threshold reached for ${loc.city}: ${maxServices} services max.`);
                    break;
                }

                const cityServiceUrl = `/${loc.slug}/${svc.slug}/`;
                if (!existingUrls.has(cityServiceUrl)) {
                    console.log(`Building city-service: ${cityServiceUrl}`);
                    const dir = path.join(SITE_ROOT, loc.slug, svc.slug);
                    writePlaceholder(dir, cityServiceUrl, `${svc.name} in ${loc.city}, ${loc.state}`, `${svc.name} - ${loc.city}`);
                    newUrls.push(cityServiceUrl);
                    buildLog.builds.push({ url: cityServiceUrl, type: 'city-service', timestamp: new Date().toISOString() });
                    newServicesCount++;
                    if (!cityWasNew) {
                        cityWasNew = true;
                        newLocationsCount++; // Count city if we add a service to it
                    }
                }
            }
        }

        if (newUrls.length > 0) {
            const sitemapContent = generateSitemap(buildLog.builds.map(b => b.url));

            if (!verifySitemapIntegrity(sitemapContent)) {
                throw new Error('Aborting build due to sitemap integrity failure.');
            }

            fs.writeFileSync(BUILD_LOG_PATH, JSON.stringify(buildLog, null, 2));
            fs.writeFileSync(SITEMAP_PATH, sitemapContent);
            fs.writeFileSync(SITEMAP_HASH_PATH, getChecksum(sitemapContent));
            syncWithMasterSitemap();
            console.log(`Built ${newUrls.length} new pages.`);
        } else {
            console.log('No new pages to build.');
        }
    } finally {
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
        }
    }
}

build();
