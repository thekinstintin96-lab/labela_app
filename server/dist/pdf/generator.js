import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { parsePrice } from '../csv/parse.js';
import { computeUnitPrice, computeVatFromGross, formatCurrencyAT, sizeFromSkuOrOption } from './units.js';
import { nanoid } from 'nanoid';
const OUT_DIR = path.resolve(process.cwd(), 'public/out');
const A4 = { widthPt: 595.275590551, heightPt: 841.88976378 }; // 210x297 mm
const MM_TO_PT = 72 / 25.4;
function mm(value) { return value * MM_TO_PT; }
function buildUrl(domain, handle) {
    const d = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${d}/products/${handle}`;
}
function computeGrid(settings) {
    const contentWidth = A4.widthPt - mm(settings.pageMarginMm.left + settings.pageMarginMm.right);
    const contentHeight = A4.heightPt - mm(settings.pageMarginMm.top + settings.pageMarginMm.bottom);
    const labelWidth = mm(settings.labelWidthMm);
    const labelHeight = mm(settings.labelHeightMm);
    const gapX = mm(settings.gutterMm.x);
    const gapY = mm(settings.gutterMm.y);
    const cols = Math.max(1, Math.floor((contentWidth + gapX) / (labelWidth + gapX)));
    const rows = Math.max(1, Math.floor((contentHeight + gapY) / (labelHeight + gapY)));
    const qrPx = mm(settings.qrSizeMm);
    return {
        pageContent: { width: contentWidth, height: contentHeight },
        label: { width: labelWidth, height: labelHeight, padding: mm(4) },
        grid: { cols, rows, gapX, gapY },
        qrPx,
        qrGap: mm(4),
    };
}
function wrapText(doc, text, maxWidth, maxLines) {
    const words = text.split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
        const test = current ? current + ' ' + word : word;
        const width = doc.widthOfString(test);
        if (width <= maxWidth) {
            current = test;
        }
        else {
            if (current) {
                lines.push(current);
            }
            current = word;
            if (lines.length >= maxLines)
                break;
        }
    }
    if (current && lines.length < maxLines)
        lines.push(current);
    let truncated = false;
    if (lines.length > maxLines) {
        lines.length = maxLines;
        truncated = true;
    }
    // apply ellipsis if last line exceeds width
    if (lines.length > 0) {
        let last = lines[lines.length - 1];
        if (doc.widthOfString(last) > maxWidth) {
            truncated = true;
            while (last.length > 0 && doc.widthOfString(last + '…') > maxWidth) {
                last = last.slice(0, -1);
            }
            lines[lines.length - 1] = last + '…';
        }
    }
    return { lines, truncated };
}
async function renderQrPngData(url, targetSizePt) {
    // We render at 300 DPI minimum. Convert points to inches: pt / 72. Then px = inches * 300
    const inches = targetSizePt / 72;
    const px = Math.max(300, Math.round(inches * 300));
    return QRCode.toBuffer(url, { type: 'png', margin: 4, width: px, errorCorrectionLevel: 'M' });
}
function ensureOutDir() {
    return fsp.mkdir(OUT_DIR, { recursive: true }).then(() => { });
}
export async function generatePdf(settings, rows) {
    await ensureOutDir();
    const env = computeGrid(settings);
    const id = nanoid(8);
    const pdfPath = path.join(OUT_DIR, `labels_${id}.pdf`);
    const overflowPath = path.join(OUT_DIR, `overflow_${id}.csv`);
    const doc = new PDFDocument({ size: [A4.widthPt, A4.heightPt], margins: {
            top: mm(settings.pageMarginMm.top), bottom: mm(settings.pageMarginMm.bottom), left: mm(settings.pageMarginMm.left), right: mm(settings.pageMarginMm.right)
        } });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);
    // Fonts: use built-in Helvetica
    const titleFont = 'Helvetica-Bold';
    const textFont = 'Helvetica';
    const items = [];
    for (const r of rows) {
        const price = parsePrice(r['Variant Price']);
        if (price === undefined)
            continue;
        const compare = parsePrice(r['Variant Compare At Price'] || undefined);
        const url = buildUrl(settings.storeDomain, r.Handle);
        const size = sizeFromSkuOrOption(r['Option1 Value'], r['Variant SKU'], r['Variant Grams']);
        const unit = computeUnitPrice(price, size);
        const vat = computeVatFromGross(price, settings.vatRate);
        items.push({
            handle: r.Handle,
            title: r.Title,
            brand: r.Vendor,
            price,
            compareAtPrice: compare && compare > price ? compare : undefined,
            url,
            sizeText: size?.display,
            unitPriceText: unit?.text,
            vatAmountText: formatCurrencyAT(vat),
        });
    }
    const perPage = env.grid.cols * env.grid.rows;
    let pageIndex = 0;
    const overflowRows = [];
    overflowRows.push('Title,Brand,URL,Reason');
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const idxOnPage = pageIndex % perPage;
        if (idxOnPage === 0 && pageIndex > 0)
            doc.addPage();
        const row = Math.floor(idxOnPage / env.grid.cols);
        const col = idxOnPage % env.grid.cols;
        const x0 = doc.page.margins.left + col * (env.label.width + env.grid.gapX);
        const y0 = doc.page.margins.top + row * (env.label.height + env.grid.gapY);
        // Determine style based on condition (discount => compareAt > price)
        const hasDiscount = !!(item.compareAtPrice && item.compareAtPrice > item.price);
        const style = hasDiscount && settings.styles?.condition === 'discount' ? settings.styles?.alternative : settings.styles?.default;
        const bgColor = style?.backgroundColor || '#FFFFFF';
        const textColor = style?.textColor || '#000000';
        const strokeColor = style?.strokeColor || textColor;
        // Background
        doc.save();
        doc.rect(x0, y0, env.label.width, env.label.height).fill(bgColor);
        doc.restore();
        const padding = env.label.padding;
        const innerX = x0 + padding;
        const innerY = y0 + padding;
        const innerW = env.label.width - 2 * padding;
        const innerH = env.label.height - 2 * padding;
        // Layout: compute left column width given QR fixed width and gap
        const leftColW = innerW - env.qrPx - env.qrGap;
        let cursorY = innerY;
        // Title: up to 2 lines, bold
        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10);
        const titleWrapped = wrapText(doc, item.title, leftColW, 2);
        for (const line of titleWrapped.lines) {
            doc.text(line, innerX, cursorY, { width: leftColW, lineBreak: false });
            cursorY += doc.currentLineHeight();
        }
        // Brand line with caption
        doc.fillColor(textColor).font('Helvetica').fontSize(8);
        const brandText = `${settings.captions.brand}: ${item.brand}`;
        const brandEllipsis = wrapText(doc, brandText, leftColW, 1);
        // QR image aligned top with brand line
        const qrBuffer = await renderQrPngData(item.url, env.qrPx);
        const qrY = cursorY; // top aligned with brand line
        const qrX = innerX + leftColW + env.qrGap;
        // Draw brand line
        doc.text(brandEllipsis.lines[0], innerX, cursorY, { width: leftColW, lineBreak: false });
        // Draw QR
        doc.image(qrBuffer, qrX, qrY, { width: env.qrPx, height: env.qrPx });
        cursorY += doc.currentLineHeight();
        // Price bold
        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(14);
        let priceText = `${settings.captions.price}: ${formatCurrencyAT(item.price)}`;
        if (doc.widthOfString(priceText) > leftColW) {
            // ellipsize if needed
            while (priceText.length > 0 && doc.widthOfString(priceText + '…') > leftColW) {
                priceText = priceText.slice(0, -1);
            }
            priceText += '…';
        }
        doc.text(priceText, innerX, cursorY, { width: leftColW, lineBreak: false });
        cursorY += doc.currentLineHeight();
        // Old price (strikethrough numeric part)
        if (item.compareAtPrice && item.compareAtPrice > item.price) {
            doc.fillColor(textColor).font('Helvetica').fontSize(9);
            const oldPriceLabel = `${settings.captions.oldPrice}: `;
            const oldPriceValue = formatCurrencyAT(item.compareAtPrice);
            const startX = innerX;
            const y = cursorY + doc.currentLineHeight() * 0.2;
            doc.text(oldPriceLabel + oldPriceValue, innerX, cursorY, { width: leftColW, lineBreak: false });
            const labelWidth = doc.widthOfString(oldPriceLabel);
            const valueWidth = doc.widthOfString(oldPriceValue);
            const valueX = startX + labelWidth;
            // draw strike-through over numeric part
            doc.save();
            doc.moveTo(valueX, y).lineTo(valueX + valueWidth, y).strokeColor(strokeColor).stroke();
            doc.restore();
            cursorY += doc.currentLineHeight();
        }
        // Unit price
        if (item.unitPriceText) {
            doc.fillColor(textColor).font('Helvetica').fontSize(8);
            let upText = `${settings.captions.unitPrice}: ${item.unitPriceText}`;
            if (doc.widthOfString(upText) > leftColW) {
                while (upText.length > 0 && doc.widthOfString(upText + '…') > leftColW) {
                    upText = upText.slice(0, -1);
                }
                upText += '…';
            }
            doc.text(upText, innerX, cursorY, { width: leftColW, lineBreak: false });
            cursorY += doc.currentLineHeight();
        }
        // VAT
        doc.fillColor(textColor).font('Helvetica').fontSize(8);
        let vatText = `${settings.captions.vat}: ${item.vatAmountText}`;
        if (doc.widthOfString(vatText) > leftColW) {
            while (vatText.length > 0 && doc.widthOfString(vatText + '…') > leftColW) {
                vatText = vatText.slice(0, -1);
            }
            vatText += '…';
        }
        doc.text(vatText, innerX, cursorY, { width: leftColW, lineBreak: false });
        cursorY += doc.currentLineHeight();
        // Overflow detection
        let overflowReason;
        const exceededHeight = cursorY > innerY + innerH;
        if (exceededHeight)
            overflowReason = 'Vertical overflow';
        if (titleWrapped.truncated)
            overflowReason = overflowReason ? `${overflowReason}; Title truncated` : 'Title truncated';
        if (brandEllipsis.truncated)
            overflowReason = overflowReason ? `${overflowReason}; Brand truncated` : 'Brand truncated';
        if (overflowReason) {
            overflowRows.push(`"${item.title.replaceAll('"', '""')}","${item.brand.replaceAll('"', '""')}","${item.url}","${overflowReason}"`);
        }
        pageIndex++;
    }
    doc.end();
    await new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
    });
    let overflowPathOut = null;
    if (overflowRows.length > 1) {
        await fsp.writeFile(overflowPath, overflowRows.join('\n'), 'utf-8');
        overflowPathOut = overflowPath;
    }
    return { pdfPath, overflowPath: overflowPathOut };
}
//# sourceMappingURL=generator.js.map