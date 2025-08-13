import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadSettings, saveSettings, defaultSettings } from './settings/store.js';
import { parseCsv } from './csv/parse.js';
import { AppSettings, GenerateRequest, GenerateResponse, CsvProductRow } from './types/index.js';
import { generatePdf } from './pdf/generator.js';
import { promises as fsp } from 'fs';
import { nanoid } from 'nanoid';
import { postprocessRows } from './csv/postprocess.js';
import { parsePrice } from './csv/parse.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/public', express.static(path.join(__dirname, '../public')));

app.post('/api/upload-logo', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const mime = req.file.mimetype || '';
    if (!/^image\/(png|jpe?g|webp)$/i.test(mime)) {
      return res.status(400).json({ error: 'Unsupported image type. Use PNG, JPG, or WebP.' });
    }
    const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : '.jpg';
    const uploadsDir = path.resolve(__dirname, '../public/uploads');
    await fsp.mkdir(uploadsDir, { recursive: true });
    const filename = `logo_${nanoid(8)}${ext}`;
    const absPath = path.join(uploadsDir, filename);
    await fsp.writeFile(absPath, req.file.buffer);
    const publicUrl = `/public/uploads/${filename}`;
    const publicPath = `public/uploads/${filename}`;
    res.json({ url: publicUrl, path: publicPath });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed', details: String(err?.message || err) });
  }
});

app.get('/api/settings', async (_req, res) => {
  const settings = await loadSettings();
  res.json(settings);
});

app.post('/api/settings', async (req, res) => {
  const incoming = req.body as Partial<AppSettings>;
  const current = await loadSettings();
  const merged: AppSettings = {
    ...current,
    ...incoming,
    pageMarginMm: { ...current.pageMarginMm, ...(incoming.pageMarginMm || {}) },
    gutterMm: { ...current.gutterMm, ...(incoming.gutterMm || {}) },
    captions: { ...current.captions, ...(incoming.captions || {}) },
    styles: {
      default: { ...(current.styles?.default || {}), ...(incoming.styles?.default || {}) },
      alternative: { ...(current.styles?.alternative || {}), ...(incoming.styles?.alternative || {}) },
      condition: incoming.styles?.condition || current.styles?.condition || 'discount',
    },
    fonts: { ...(current.fonts || {}), ...(incoming.fonts || {}) },
    fieldWidthsPct: { ...(current.fieldWidthsPct || {}), ...(incoming.fieldWidthsPct || {}) },
    brandLogo: {
      original: { ...(current.brandLogo?.original || {}), ...(incoming.brandLogo?.original || {}) },
      alternative: { ...(current.brandLogo?.alternative || {}), ...(incoming.brandLogo?.alternative || {}) },
    },
    diagonalStrikeForCompare: incoming.diagonalStrikeForCompare ?? current.diagonalStrikeForCompare ?? true,
  } as AppSettings;
  await saveSettings(merged);
  res.json(merged);
});

app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const { rows, count, sample } = parseCsv(req.file.buffer);
    res.json({ count, sample });
  } catch (err: any) {
    res.status(400).json({ error: 'CSV parse error', details: String(err?.message || err) });
  }
});

app.post('/api/preview', async (req, res) => {
  try {
    const incoming = req.body as Partial<AppSettings>;
    const base = await loadSettings();
    const settings: AppSettings = {
      ...base,
      ...incoming,
      pageMarginMm: { ...base.pageMarginMm, ...(incoming.pageMarginMm || {}) },
      gutterMm: { ...base.gutterMm, ...(incoming.gutterMm || {}) },
      captions: { ...base.captions, ...(incoming.captions || {}) },
      styles: {
        default: { ...(base.styles?.default || {}), ...(incoming.styles?.default || {}) },
        alternative: { ...(base.styles?.alternative || {}), ...(incoming.styles?.alternative || {}) },
        condition: incoming.styles?.condition || base.styles?.condition || 'discount',
      },
      fonts: { ...(base.fonts || {}), ...(incoming.fonts || {}) },
      fieldWidthsPct: { ...(base.fieldWidthsPct || {}), ...(incoming.fieldWidthsPct || {}) },
      brandLogo: {
        original: { ...(base.brandLogo?.original || {}), ...(incoming.brandLogo?.original || {}) },
        alternative: { ...(base.brandLogo?.alternative || {}), ...(incoming.brandLogo?.alternative || {}) },
      },
      diagonalStrikeForCompare: incoming.diagonalStrikeForCompare ?? base.diagonalStrikeForCompare ?? true,
    } as AppSettings;

    const baseRow = {
      Handle: 'sample-product',
      Title: 'Sample Product Very Long Title To Test Wrapping',
      Vendor: 'BrandCo',
      'Variant SKU': 'SKU-TEST-500ML',
      'Variant Price': '3.49',
      'Variant Grams': '500',
      'Option1 Value': '500 ml',
      'Image Src': '',
      short_description_product: 'Short description for preview (optional)'
    } as any;

    // Original style (no discount)
    const rowOriginal = { ...baseRow, 'Variant Compare At Price': '3.49' };
    const r1 = await generatePdf(settings, [rowOriginal]);
    const url1 = r1.pdfPath.replace(path.resolve(process.cwd(), 'public'), '/public');

    // Alternative style (discount)
    const rowAlt = { ...baseRow, 'Variant Compare At Price': '4.19' };
    const r2 = await generatePdf(settings, [rowAlt]);
    const url2 = r2.pdfPath.replace(path.resolve(process.cwd(), 'public'), '/public');

    res.json({ previewOriginalUrl: url1, previewAlternativeUrl: url2 });
  } catch (err: any) {
    res.status(500).json({ error: 'Preview failed', details: String(err?.message || err) });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const body = req.body as GenerateRequest;
    const settings = body.settings || (await loadSettings());
    const inbound = (body.rows || []) as CsvProductRow[];
    // Run server-side postprocessing to fill missing Title/Vendor
    const processed = postprocessRows(inbound).filter((r) => {
      const p = parsePrice(r['Variant Price']);
      return p !== undefined && p > 0;
    });
    const result = await generatePdf(settings, processed);
    const pdfUrl = result.pdfPath.replace(path.resolve(process.cwd(), 'public'), '/public');
    const overflowCsvUrl = result.overflowPath ? result.overflowPath.replace(path.resolve(process.cwd(), 'public'), '/public') : null;
    const incompleteCsvUrl = (result as any).incompletePath ? (result as any).incompletePath.replace(path.resolve(process.cwd(), 'public'), '/public') : null;
    const response: GenerateResponse = { pdfUrl, overflowCsvUrl, incompleteCsvUrl };
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: 'Generation failed', details: String(err?.message || err) });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});