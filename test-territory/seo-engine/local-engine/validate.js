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

    // Check for duplicate slugs in locations
    const locations = JSON.parse(fs.readFileSync(LOCATIONS_PATH, 'utf8'));
    const locationSlugs = new Set();
    locations.forEach(loc => {
        if (locationSlugs.has(loc.slug)) {
            console.error(`Error: Duplicate location slug found: ${loc.slug}`);
            allValid = false;
        }
        locationSlugs.add(loc.slug);
    });

    // Check for duplicate slugs in services
    const services = JSON.parse(fs.readFileSync(SERVICES_PATH, 'utf8'));
    const serviceSlugs = new Set();
    services.forEach(svc => {
        if (serviceSlugs.has(svc.slug)) {
            console.error(`Error: Duplicate service slug found: ${svc.slug}`);
            allValid = false;
        }
        serviceSlugs.add(svc.slug);
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
