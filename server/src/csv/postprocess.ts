import { CsvProductRow } from '../types/index.js';
import { parsePrice } from './parse.js';

export function postprocessRows(rows: CsvProductRow[]): CsvProductRow[] {
	const fixed: CsvProductRow[] = [];
	let previousRow: CsvProductRow | null = null;
	for (const row of rows) {
		const hasPrice = (() => {
			const p = parsePrice(row['Variant Price']);
			return p !== undefined && p > 0;
		})();
		if (hasPrice && previousRow) {
			const titleEmpty = !row.Title || String(row.Title).trim() === '';
			const vendorEmpty = !row.Vendor || String(row.Vendor).trim() === '';
			if (titleEmpty && previousRow.Title) row.Title = previousRow.Title;
			if (vendorEmpty && previousRow.Vendor) row.Vendor = previousRow.Vendor;
		}
		fixed.push(row);
		previousRow = row;
	}
	return fixed;
}