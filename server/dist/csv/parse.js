import { parse } from 'csv-parse/sync';
function sniffDelimiter(sample) {
    const candidates = [',', ';', '\t'];
    const counts = candidates.map((c) => ({ c, n: (sample.match(new RegExp(`\\${c}`, 'g')) || []).length }));
    counts.sort((a, b) => b.n - a.n);
    return counts[0]?.c || ',';
}
export function normalizeDecimal(input) {
    if (!input)
        return undefined;
    // remove spaces, normalize decimal comma/dot, keep digits
    const trimmed = input.trim();
    // If both comma and dot appear, assume comma is thousand separator if dot after comma? Simplify: replace comma with dot if there is only comma.
    if (/^[0-9]+,[0-9]+$/.test(trimmed)) {
        return trimmed.replace(',', '.');
    }
    // Remove thousand separators: '.' or ',' when appropriate
    // Strategy: remove all dots and spaces, then replace comma with dot
    const removedThousands = trimmed.replace(/[\.\s]/g, '').replace(',', '.');
    return removedThousands;
}
export function parsePrice(input) {
    const norm = normalizeDecimal(input);
    if (!norm)
        return undefined;
    const value = Number(norm);
    if (Number.isNaN(value))
        return undefined;
    return value;
}
export function parseCsv(buffer) {
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
    });
    // filter out rows without price
    const filtered = records.filter((r) => parsePrice(r['Variant Price']) !== undefined);
    return { rows: filtered, count: filtered.length, sample: filtered.slice(0, 5) };
}
//# sourceMappingURL=parse.js.map