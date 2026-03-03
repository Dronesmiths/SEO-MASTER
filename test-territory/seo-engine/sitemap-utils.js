const fs = require('fs');
const path = require('path');

function writeAtomic(filePath, content) {
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, content);
    fs.renameSync(tmpPath, filePath);
}

function syncWithMasterIndex(siteRoot, domain, sitemapName) {
    const masterPath = path.join(siteRoot, 'sitemap.xml');
    if (!fs.existsSync(masterPath)) return;

    let content = fs.readFileSync(masterPath, 'utf8');
    const loc = `${domain}/${sitemapName}`;

    if (content.includes(loc)) {
        console.log(`Master index already contains ${sitemapName}`);
        return;
    }

    if (content.includes('</sitemapindex>')) {
        const replacement = `  <sitemap>\n    <loc>${loc}</loc>\n  </sitemap>\n</sitemapindex>`;
        content = content.replace('</sitemapindex>', replacement);
        writeAtomic(masterPath, content);
        console.log(`Synced ${sitemapName} to master index.`);
    }
}

module.exports = { syncWithMasterIndex };
