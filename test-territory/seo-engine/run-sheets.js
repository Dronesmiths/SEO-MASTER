const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Universal Factory Runner
 * Runs all SEO engines in sequence to ensure the Google Sheet is fully updated.
 */

const BASE_DIR = __dirname;
const ENGINES = [
    { name: 'Blog Engine', path: 'blog-engine/generate-blog.js' },
    { name: 'Newsletter Engine', path: 'newsletter-engine/generate-newsletter.js' },
    { name: 'Local & Service Engine', path: 'local-engine/generate-local.js' }
];

console.log('==========================================');
console.log('       MASTER SEO FACTORY RUNNER          ');
console.log('==========================================');
console.log(`Started at: ${new Date().toLocaleString()}`);

let successCount = 0;
let failCount = 0;

ENGINES.forEach(engine => {
    const fullPath = path.join(BASE_DIR, engine.path);
    if (!fs.existsSync(fullPath)) {
        console.error(`[SKIP] ${engine.name} not found at ${fullPath}`);
        return;
    }

    console.log(`\n--- Running ${engine.name} ---`);
    try {
        // Execute the engine script
        const output = execSync(`node "${fullPath}"`, { stdio: 'inherit' });
        successCount++;
    } catch (err) {
        console.error(`[ERROR] ${engine.name} failed!`);
        console.error(err.message);
        failCount++;
    }
});

console.log('\n==========================================');
console.log('           RUN SUMMARY                   ');
console.log('==========================================');
console.log(`Total Engines: ${ENGINES.length}`);
console.log(`Success:       ${successCount}`);
console.log(`Failed:        ${failCount}`);
console.log(`Finished at:   ${new Date().toLocaleString()}`);
console.log('==========================================\n');

if (failCount === 0) {
    console.log('✅ All internal sheets and inventories are now fully reported.');
} else {
    console.warn('⚠️ Some engines encountered issues. Check logs above.');
}
