import { promises as fs } from 'fs';
import path from 'path';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const defaultCaptions = {
    brand: 'Brand',
    price: 'Price',
    oldPrice: 'Old price',
    unitPrice: 'Unit price',
    vat: 'VAT',
};
export const defaultSettings = {
    storeDomain: 'example.myshopify.com',
    vatRate: 0.20,
    labelWidthMm: 60,
    labelHeightMm: 40,
    pageMarginMm: { top: 10, right: 10, bottom: 10, left: 10 },
    gutterMm: { x: 3, y: 3 },
    qrSizeMm: 20,
    captions: defaultCaptions,
    styles: {
        default: { backgroundColor: '#FFFFFF', textColor: '#000000', strokeColor: '#000000' },
        alternative: { backgroundColor: '#FFF3CD', textColor: '#000000', strokeColor: '#000000' },
        condition: 'discount',
    },
};
export async function ensureDataDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}
export async function loadSettings() {
    await ensureDataDir();
    try {
        const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed;
    }
    catch (err) {
        await saveSettings(defaultSettings);
        return defaultSettings;
    }
}
export async function saveSettings(settings) {
    await ensureDataDir();
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}
//# sourceMappingURL=store.js.map