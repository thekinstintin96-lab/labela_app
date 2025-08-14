export type LabelCaptions = {
  brand: string;
  price: string;
  oldPrice: string;
  unitPrice: string;
  vat: string;
};

export type LabelStyle = {
  backgroundColor: string; // e.g., #FFFFFF
  textColor: string; // e.g., #000000
  strokeColor?: string; // optional line color
  borderWidthPt?: number;
  borderColor?: string;
  borderEnabled?: boolean;
};

export type LabelFonts = {
  titlePt: number;
  brandPt: number;
  pricePt: number;
  oldPricePt: number;
  unitPricePt: number;
  vatPt: number;
  shortDescPt?: number;
};

export type AppSettings = {
  storeDomain: string; // e.g., mystore.myshopify.com
  vatRate: number; // 0.20
  labelWidthMm: number; // default 60
  labelHeightMm: number; // default 40
  pageMarginMm: { top: number; right: number; bottom: number; left: number };
  gutterMm: { x: number; y: number };
  qrSizeMm: number;
  qrBorderWidthPt?: number;
  qrBorderEnabled?: boolean;
  // Additional layout controls
  lineGapPt?: number; // extra gap between lines in points
  qrOffsetMm?: { x: number; y: number }; // manual QR position adjuster
  brandLogo?: {
    original?: { path: string; widthMm: number; xMm: number; yMm: number; opacity?: number };
    alternative?: { path: string; widthMm: number; xMm: number; yMm: number; opacity?: number };
  };
  captions: LabelCaptions;
  styles?: {
    default: LabelStyle;
    alternative: LabelStyle;
    condition: 'discount';
  };
  fonts?: LabelFonts;
  fieldWidthsPct?: { title: number; brand: number; price: number; oldPrice: number; unitPrice: number; vat: number; shortDescription?: number };
  fieldOffsetsMm?: {
    title?: { xMm: number; yMm: number };
    brand?: { xMm: number; yMm: number };
    price?: { xMm: number; yMm: number };
    oldPrice?: { xMm: number; yMm: number };
    unitPrice?: { xMm: number; yMm: number };
    vat?: { xMm: number; yMm: number };
    shortDescription?: { xMm: number; yMm: number };
  };
  fieldEnabled?: {
    title?: boolean;
    brand?: boolean;
    price?: boolean;
    oldPrice?: boolean;
    unitPrice?: boolean;
    vat?: boolean;
    shortDescription?: boolean;
  };
  compareStrikeEnabled?: boolean;
  diagonalStrikeForCompare?: boolean;
  shortDescMaxLines?: number;
};

export type CsvProductRow = {
  Handle: string;
  Title: string;
  Vendor: string;
  "Variant SKU"?: string;
  "Variant Price"?: string;
  "Variant Compare At Price"?: string;
  "Variant Grams"?: string;
  "Option1 Value"?: string;
  "Image Src"?: string;
  short_description_product?: string;
  // Other columns may exist
};

export type ParsedItem = {
  handle: string;
  title: string;
  brand: string;
  price: number; // normalized EUR gross
  compareAtPrice?: number;
  url: string;
  sizeText?: string; // e.g., 500 ml, 0.5 L, 200 g, 0.2 kg
  unitPriceText?: string; // e.g., 3,20 € / L
  vatAmountText: string; // formatted amount per unit
  shortDescription?: string;
  overflowReason?: string;
};

export type GenerateRequest = {
  settings: AppSettings;
  rows: CsvProductRow[];
};

export type GenerateResponse = {
  pdfUrl: string;
  overflowCsvUrl: string | null;
  incompleteCsvUrl?: string | null;
};