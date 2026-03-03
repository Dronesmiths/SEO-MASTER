const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

/**
 * Syncs pages from sitemaps to a dedicated Google Sheet.
 * If config.google_sheet_id is missing, it creates a new Sheet and returns the ID.
 */
async function syncToGoogleSheets(config, siteRoot, suffix = "Inventory") {
    const BASE_DIR = __dirname;
    const COMPANY_PATH = path.join(BASE_DIR, 'COMPANY.json');
    let companyName = "SEO Engine";

    if (fs.existsSync(COMPANY_PATH)) {
        try {
            const companyData = JSON.parse(fs.readFileSync(COMPANY_PATH, 'utf8'));
            companyName = companyData.company_name || "SEO Engine";
        } catch (e) {
            console.error('Error reading COMPANY.json:', e.message);
        }
    }

    try {
        const creds = JSON.parse(fs.readFileSync(path.join(BASE_DIR, '..', 'GOOGLE KEYS', 'endless-terra-488018-c4-2f632c3b19ef.json'), 'utf8'));

        const auth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file'
            ],
        });

        let sheetId = config.google_sheet_id;

        // --- AUTO-CREATE SHEET IF MISSING ---
        if (!sheetId) {
            const sheetName = `${companyName} (${suffix})`;
            console.log(`[Google Sheets] No ID found. Creating new sheet: "${sheetName}"...`);

            // We use the Drive API to create a new spreadsheet file
            const res = await auth.request({
                url: 'https://www.googleapis.com/drive/v3/files',
                method: 'POST',
                data: {
                    name: sheetName,
                    mimeType: 'application/vnd.google-apps.spreadsheet'
                }
            });

            sheetId = res.data.id;
            console.log(`[Google Sheets] Created new sheet with ID: ${sheetId}`);
            console.log(`[Google Sheets] URL: https://docs.google.com/spreadsheets/d/${sheetId}`);
            console.log(`[IMPORTANT] Ensure you share this sheet or give the service account owner permissions if manually managing.`);
        }

        const doc = new GoogleSpreadsheet(sheetId, auth);
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

        const maps = [
            { path: 'sitemap-core.xml', source: 'core' },
            { path: 'sitemap-local.xml', source: 'local' },
            { path: 'sitemap-blog.xml', source: 'blog' },
            { path: 'sitemap-newsletter.xml', source: 'newsletter' }
        ];

        for (const map of maps) {
            const fullPath = path.join(siteRoot, map.path);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const urls = content.match(/<loc>(.*?)<\/loc>/g) || [];
                urls.forEach(u => {
                    const url = u.replace(/<\/?loc>/g, '');
                    allPages.push({ url, source: map.source });
                });
            }
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
            console.log(`[${suffix}] Syncing ${newRows.length} new sitemap entries to Google Sheets...`);
            await sheet.addRows(newRows);
        } else {
            console.log(`[${suffix}] Google Sheets Inventory is up to date.`);
        }

        return sheetId; // Return ID in case it was newly created

    } catch (err) {
        console.error('Google Sheets Sync Failed:', err.message);
        return null;
    }
}

module.exports = { syncToGoogleSheets };
