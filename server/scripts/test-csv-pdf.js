// Basic test runner to validate CSV parsing and PDF generation
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCsv } from '../dist/csv/parse.js';
import { generatePdf } from '../dist/pdf/generator.js';
import { defaultSettings } from '../dist/settings/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const csvPath = path.resolve(__dirname, '../../samples/products.csv');
  const buf = await readFile(csvPath);
  const { rows, count, sample } = parseCsv(buf);
  console.log('Parsed rows:', count, 'Sample:', sample);
  const result = await generatePdf(defaultSettings, rows);
  console.log('Generated:', result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});