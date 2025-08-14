import { parse } from 'csv-parse/sync';
import { CsvProductRow } from '../types/index.js';
import { postprocessRows } from './postprocess.js';

function sniffDelimiter(sample: string): string {
	const candidates = [',', ';', '\t'];
	const counts = candidates.map((c) => ({ c, n: (sample.match(new RegExp(`\\${c}`, 'g')) || []).length }));
	counts.sort((a, b) => b.n - a.n);
	return counts[0]?.c || ',';
}

export function normalizeDecimal(input?: string): string | undefined {
	if (!input) return undefined;
	const trimmed = input.trim();
	// Prefer dot as decimal separator. Treat commas as thousands separators.
	// 1. Remove spaces
	let s = trimmed.replace(/\s+/g, '');
	// 2. If there are both comma and dot, drop commas
	if (s.includes(',') && s.includes('.')) {
		s = s.replace(/,/g, '');
	}
	// 3. If only comma present, replace comma with dot
	else if (s.includes(',') && !s.includes('.')) {
		s = s.replace(/,/g, '.');
	}
	// 4. Remove any thousands dots (e.g., 1.234.567,89 -> 1234567.89)
	const parts = s.split('.');
	if (parts.length > 2) {
		const last = parts.pop();
		s = parts.join('') + '.' + last;
	}
	return s;
}

export function parsePrice(input?: string): number | undefined {
	const norm = normalizeDecimal(input);
	if (!norm) return undefined;
	const value = Number(norm);
	if (Number.isNaN(value)) return undefined;
	return value;
}

export function parseCsv(buffer: Buffer): { rows: CsvProductRow[]; count: number; sample: CsvProductRow[] } {
	const text = buffer.toString('utf-8');
	const delimiter = sniffDelimiter(text.slice(0, 2000));
	const records = parse(text, {
		columns: true,
		delimiter,
		relax_quotes: true,
		relax_column_count: true,
		skip_empty_lines: true,
		bom: true,
		quote: '"',
	}) as CsvProductRow[];

	// filter out rows without price
	const filtered = records.filter((r) => {
		const p = parsePrice(r['Variant Price']);
		return p !== undefined && p > 0;
	});
	const post = postprocessRows(filtered);
	return { rows: post, count: post.length, sample: post.slice(0, 5) };
}