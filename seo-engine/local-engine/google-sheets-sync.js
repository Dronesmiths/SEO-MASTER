const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');

async function syncToGoogleSheets(config, buildLogPath) {
    if (!config.google_sheet_id) {
        console.log('Skipping Google Sheets sync: No google_sheet_id configured.');
        return;
    }

    try {
        const buildLog = JSON.parse(fs.readFileSync(buildLogPath, 'utf8'));
        const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'GOOGLE KEYS', 'endless-terra-488018-c4-2f632c3b19ef.json'), 'utf8'));

        const doc = new GoogleSpreadsheet(config.google_sheet_id);

        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();

        let sheet = doc.sheetsByTitle[config.google_sheet_tab_name || 'Inventory'];
        if (!sheet) {
            console.log(`Creating sheet: ${config.google_sheet_tab_name || 'Inventory'}`);
            sheet = await doc.addSheet({ title: config.google_sheet_tab_name || 'Inventory', headerValues: ['Slug', 'URL', 'Title', 'Type', 'Timestamp'] });
        }

        const rows = await sheet.getRows();
        const existingUrls = new Set(rows.map(r => r.URL));

        const newRows = buildLog.builds
            .filter(build => !existingUrls.has(build.url))
            .map(build => ({
                Slug: build.url.split('/').filter(Boolean).pop() || '/',
                URL: build.url,
                Title: `Build: ${build.url}`, // Simple title for now as buildLog doesn't store titles
                Type: build.type,
                Timestamp: build.timestamp
            }));

        if (newRows.length > 0) {
            console.log(`Syncing ${newRows.length} new rows to Google Sheets...`);
            await sheet.addRows(newRows);
        } else {
            console.log('Google Sheets is already up to date.');
        }

    } catch (err) {
        console.error('Google Sheets Sync Failed:', err.message);
    }
}

module.exports = { syncToGoogleSheets };
