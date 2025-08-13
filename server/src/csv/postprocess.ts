import { CsvProductRow } from '../types/index.js';
import { parsePrice } from './parse.js';

export function postprocessRows(rows: CsvProductRow[]): CsvProductRow[] {
	const fixed: CsvProductRow[] = [];
	let prevWithData: CsvProductRow | null = null;
	for (const row of rows) {
		const hasPrice = parsePrice(row['Variant Price']) !== undefined;
		const titleEmpty = !row.Title || String(row.Title).trim() === '';
		const vendorEmpty = !row.Vendor || String(row.Vendor).trim() === '';
		if (hasPrice && titleEmpty && vendorEmpty && prevWithData) {
			row.Title = prevWithData.Title;
			row.Vendor = prevWithData.Vendor;
		}
		fixed.push(row);
		// update prevWithData if this row has non-empty title/vendor
		if (row.Title && row.Vendor) {
			prevWithData = row;
		}
	}
	return fixed;
}