import { parsePrice } from '../csv/parse.js';
const unitPatterns = [
    // Volume
    { regex: /([0-9]+(?:[\.,][0-9]+)?)\s*(ml|мл)/i, toBase: (n) => n / 1000, unit: 'L' },
    { regex: /([0-9]+(?:[\.,][0-9]+)?)\s*(l|л)/i, toBase: (n) => n, unit: 'L' },
    // Mass
    { regex: /([0-9]+(?:[\.,][0-9]+)?)\s*(g|гр|г)/i, toBase: (n) => n / 1000, unit: 'kg' },
    { regex: /([0-9]+(?:[\.,][0-9]+)?)\s*(kg|кг)/i, toBase: (n) => n, unit: 'kg' },
];
export function extractSizeFromText(text) {
    if (!text)
        return undefined;
    const t = String(text).trim();
    for (const p of unitPatterns) {
        const m = t.match(p.regex);
        if (m) {
            const num = parsePrice(m[1]);
            if (num !== undefined) {
                return { amount: p.toBase(num), unit: p.unit, display: `${m[1]} ${m[2]}` };
            }
        }
    }
    return undefined;
}
export function sizeFromSkuOrOption(option1, sku, grams) {
    const fromOption = extractSizeFromText(option1);
    if (fromOption)
        return fromOption;
    const fromSku = extractSizeFromText(sku);
    if (fromSku)
        return fromSku;
    if (grams) {
        const g = parsePrice(grams);
        if (g && g > 0) {
            return { amount: g / 1000, unit: 'kg', display: `${g} g` };
        }
    }
    return undefined;
}
export function computeUnitPrice(price, size) {
    if (!size || size.amount <= 0)
        return undefined;
    const perBase = price / size.amount; // per L or per kg
    const formatted = formatCurrencyAT(perBase) + ` / ${size.unit}`;
    return { text: formatted };
}
export function formatCurrencyAT(value) {
    // Austrian: thousands dot, decimal comma, Euro after value
    const parts = value.toFixed(2).split('.');
    const intPart = parts[0];
    const decPart = parts[1];
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withThousands},${decPart} €`;
}
export function computeVatFromGross(price, rate) {
    return (price * rate) / (1 + rate);
}
//# sourceMappingURL=units.js.map