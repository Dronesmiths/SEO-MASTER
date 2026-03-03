const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

async function syncToGoogleSheets(config, siteRoot) {
    if (!config.google_sheet_id) {
        console.log('Skipping Google Sheets sync: No google_sheet_id configured.');
        return;
    }

    try {
        const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'GOOGLE KEYS', 'endless-terra-488018-c4-2f632c3b19ef.json'), 'utf8'));

        const serviceAccountAuth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(config.google_sheet_id, serviceAccountAuth);
        await doc.loadInfo();

        const sheetTitle = config.google_sheet_tab_name || 'Inventory';
        let sheet = doc.sheetsByTitle[sheetTitle];
        if (!sheet) {
            console.log(`Creating sheet: ${sheetTitle}`);
            sheet = await doc.addSheet({
                title: sheetTitle,
                headerValues: ['Slug', 'URL', 'Source', 'LastUpdated']
            });
        }

        // --- COLLECT PAGES FROM ALL SITEMAPS ---
        const allPages = [];

        // 1. Check Core Sitemap
        const corePath = path.join(siteRoot, 'sitemap-core.xml');
        if (fs.existsSync(corePath)) {
            const content = fs.readFileSync(corePath, 'utf8');
            const urls = content.match(/<loc>(.*?)<\/loc>/g) || [];
            urls.forEach(u => {
                const url = u.replace(/<\/?loc>/g, '');
                allPages.push({ url, source: 'core' });
            });
        }

        // 2. Check Local Sitemap
        const localPath = path.join(siteRoot, 'sitemap-local.xml');
        if (fs.existsSync(localPath)) {
            const content = fs.readFileSync(localPath, 'utf8');
            const urls = content.match(/<loc>(.*?)<\/loc>/g) || [];
            urls.forEach(u => {
                const url = u.replace(/<\/?loc>/g, '');
                allPages.push({ url, source: 'local' });
            });
        }

        // 3. Check Blog Sitemap
        const blogPath = path.join(siteRoot, 'sitemap-blog.xml');
        if (fs.existsSync(blogPath)) {
            const content = fs.readFileSync(blogPath, 'utf8');
            const urls = content.match(/<loc>(.*?)<\/loc>/g) || [];
            urls.forEach(u => {
                const url = u.replace(/<\/?loc>/g, '');
                allPages.push({ url, source: 'blog' });
            });
        }

        // --- SYNC TO SHEET ---
        const rows = await sheet.getRows();
        const existingUrls = new Set(rows.map(r => r.get('URL')));

        const newRows = allPages
            .filter(p => !existingUrls.has(p.url))
            .map(p => ({
                Slug: p.url.split('/').filter(Boolean).pop() || '/',
                URL: p.url,
                Source: p.source,
                LastUpdated: new Date().toISOString()
            }));

        if (newRows.length > 0) {
            console.log(`Syncing ${newRows.length} new sitemap entries to Google Sheets...`);
            await sheet.addRows(newRows);
        } else {
            console.log('Google Sheets Inventory is up to date.');
        }

    } catch (err) {
        console.error('Google Sheets Sync Failed:', err.message);
    }
}

module.exports = { syncToGoogleSheets };
