const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const CONFIG_PATH = path.join(BASE_DIR, 'local-config.json');
const LOCATIONS_PATH = path.join(BASE_DIR, 'locations.json');
const SERVICES_PATH = path.join(BASE_DIR, 'services.json');
const BUILD_MAP_PATH = path.join(BASE_DIR, 'build-map.json');

function validateJson(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        return true;
    } catch (e) {
        console.error(`Error: Malformed JSON in ${filePath}: ${e.message}`);
        return false;
    }
}

function runValidation() {
    console.log('--- Starting Local SEO Engine Validation ---');

    const files = [CONFIG_PATH, LOCATIONS_PATH, SERVICES_PATH, BUILD_MAP_PATH];
    let allValid = true;

    files.forEach(file => {
        if (!fs.existsSync(file)) {
            console.error(`Error: Missing required file: ${file}`);
            allValid = false;
        } else if (!validateJson(file)) {
            allValid = false;
        } else {
            console.log(`OK: ${path.basename(file)} is valid.`);
        }
    });

    if (!allValid) {
        console.error('Validation FAILED.');
        process.exit(1);
    }

    // Check for duplicate/colliding slugs in locations
    const locations = JSON.parse(fs.readFileSync(LOCATIONS_PATH, 'utf8'));
    const locationSlugs = new Set();
    const normalizedLocSlugs = new Set();

    locations.forEach(loc => {
        const nSlug = loc.slug.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (locationSlugs.has(loc.slug)) {
            console.error(`Error: Duplicate raw location slug: ${loc.slug}`);
            allValid = false;
        }
        if (normalizedLocSlugs.has(nSlug)) {
            console.error(`Error: Normalized location slug collision: ${nSlug}`);
            allValid = false;
        }
        locationSlugs.add(loc.slug);
        normalizedLocSlugs.add(nSlug);
    });

    // Check for duplicate/colliding slugs in services
    const services = JSON.parse(fs.readFileSync(SERVICES_PATH, 'utf8'));
    const serviceSlugs = new Set();
    const normalizedSvcSlugs = new Set();

    services.forEach(svc => {
        const nSlug = svc.slug.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (serviceSlugs.has(svc.slug)) {
            console.error(`Error: Duplicate raw service slug: ${svc.slug}`);
            allValid = false;
        }
        if (normalizedSvcSlugs.has(nSlug)) {
            console.error(`Error: Normalized service slug collision: ${nSlug}`);
            allValid = false;
        }
        serviceSlugs.add(svc.slug);
        normalizedSvcSlugs.add(nSlug);
    });

    if (allValid) {
        console.log('--- Validation PASSED ---');
    } else {
        console.error('--- Validation FAILED ---');
        process.exit(1);
    }
}

if (require.main === module) {
    runValidation();
}

module.exports = { runValidation };
