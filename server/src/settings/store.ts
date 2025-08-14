import { promises as fs } from 'fs';
import path from 'path';
import { AppSettings, LabelCaptions } from '../types/index.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const defaultCaptions: LabelCaptions = {
	brand: 'Brand',
	price: 'Price',
	oldPrice: 'Old price',
	unitPrice: 'Unit price',
	vat: 'VAT',
};

export const defaultSettings: AppSettings = {
	storeDomain: 'example.myshopify.com',
	vatRate: 0.20,
	labelWidthMm: 60,
	labelHeightMm: 40,
	pageMarginMm: { top: 5, right: 5, bottom: 10, left: 5 },
	gutterMm: { x: 1, y: 1 },
	qrSizeMm: 18,
	lineGapPt: 3,
	qrOffsetMm: { x: 0, y: 5 },
	captions: defaultCaptions,
	styles: {
		default: { backgroundColor: '#FFFFFF', textColor: '#000000', strokeColor: '#000000', borderWidthPt: 0, borderColor: '#000000', borderEnabled: false },
		alternative: { backgroundColor: '#a881d6', textColor: '#ffffff', strokeColor: '#ffffff', borderWidthPt: 0, borderColor: '#ffffff', borderEnabled: false },
		condition: 'discount',
	},
	fonts: {
		titlePt: 11,
		brandPt: 8,
		pricePt: 11,
		oldPricePt: 9,
		unitPricePt: 7,
		vatPt: 7,
		shortDescPt: 8,
	},
	fieldWidthsPct: {
		title: 135,
		brand: 100,
		price: 100,
		oldPrice: 100,
		unitPrice: 100,
		vat: 100,
		shortDescription: 115,
	},
	fieldOffsetsMm: {
		title: { xMm: 0, yMm: 0 },
		brand: { xMm: 0, yMm: 0 },
		price: { xMm: 0, yMm: 0 },
		oldPrice: { xMm: 0, yMm: 0 },
		unitPrice: { xMm: 0, yMm: 0 },
		vat: { xMm: 0, yMm: 0 },
		shortDescription: { xMm: 0, yMm: 0 },
	},
	brandLogo: {
		original: { path: 'public/uploads/logo_EowK1JZm.png', widthMm: 13, xMm: 44, yMm: 3, opacity: 1 },
		alternative: { path: 'public/uploads/logo_QOVxFAze.png', widthMm: 8, xMm: 48, yMm: 3, opacity: 1 },
	},
	diagonalStrikeForCompare: true,
	shortDescMaxLines: 3,
	qrBorderWidthPt: 0,
	qrBorderEnabled: false,
	compareStrikeEnabled: true,
};

export async function ensureDataDir(): Promise<void> {
	await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function loadSettings(): Promise<AppSettings> {
	await ensureDataDir();
	try {
		const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
		const parsed = JSON.parse(raw) as AppSettings;
		return parsed;
	} catch (err) {
		await saveSettings(defaultSettings);
		return defaultSettings;
	}
}

export async function saveSettings(settings: AppSettings): Promise<void> {
	await ensureDataDir();
	await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}