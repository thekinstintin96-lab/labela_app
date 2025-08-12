export type LabelCaptions = {
  brand: string;
  price: string;
  oldPrice: string;
  unitPrice: string;
  vat: string;
};

export type AppSettings = {
  storeDomain: string; // e.g., mystore.myshopify.com
  vatRate: number; // 0.20
  labelWidthMm: number; // default 60
  labelHeightMm: number; // default 40
  pageMarginMm: { top: number; right: number; bottom: number; left: number };
  gutterMm: { x: number; y: number };
  qrSizeMm: number;
  captions: LabelCaptions;
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
  overflowReason?: string;
};

export type GenerateRequest = {
  settings: AppSettings;
  rows: CsvProductRow[];
};

export type GenerateResponse = {
  pdfUrl: string;
  overflowCsvUrl: string | null;
};