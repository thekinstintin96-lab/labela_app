import { useEffect, useState, useRef } from 'react';
import { Card, InlineGrid, Text, TextField, Button, BlockStack, DropZone, Link } from '@shopify/polaris';
import axios from 'axios';

export type Settings = {
  storeDomain: string;
  vatRate: number;
  labelWidthMm: number;
  labelHeightMm: number;
  pageMarginMm: { top: number; right: number; bottom: number; left: number };
  gutterMm: { x: number; y: number };
  qrSizeMm: number;
  captions: { brand: string; price: string; oldPrice: string; unitPrice: string; vat: string };
  styles?: {
    default: { backgroundColor: string; textColor: string; strokeColor?: string; borderWidthPt?: number; borderColor?: string; borderEnabled?: boolean };
    alternative: { backgroundColor: string; textColor: string; strokeColor?: string; borderWidthPt?: number; borderColor?: string; borderEnabled?: boolean };
    condition: 'discount';
  };
  fonts?: {
    titlePt: number;
    brandPt: number;
    pricePt: number;
    oldPricePt: number;
    unitPricePt: number;
    vatPt: number;
  };
  lineGapPt?: number;
  qrOffsetMm?: { x: number; y: number };
  fieldWidthsPct?: {
    title: number;
    brand: number;
    price: number;
    oldPrice: number;
    unitPrice: number;
    vat: number;
    shortDescription: number;
  };
  brandLogo?: {
    original?: {
      path: string;
      widthMm: number;
      xMm: number;
      yMm: number;
      opacity: number;
    };
    alternative?: {
      path: string;
      widthMm: number;
      xMm: number;
      yMm: number;
      opacity: number;
    };
  };
  diagonalStrikeForCompare?: boolean;
  shortDescMaxLines?: number;
  fieldEnabled?: {
    title: boolean;
    brand: boolean;
    price: boolean;
    oldPrice: boolean;
    unitPrice: boolean;
    vat: boolean;
    shortDescription: boolean;
  };
  fieldOffsetsMm?: {
    title?: { xMm: number; yMm: number };
    brand?: { xMm: number; yMm: number };
    price?: { xMm: number; yMm: number };
    oldPrice?: { xMm: number; yMm: number };
    unitPrice?: { xMm: number; yMm: number };
    vat?: { xMm: number; yMm: number };
    shortDescription?: { xMm: number; yMm: number };
  };
  qrBorderWidthPt?: number;
  qrBorderEnabled?: boolean;
};

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAltUrl, setPreviewAltUrl] = useState<string | null>(null);
  const [livePreview, setLivePreview] = useState<boolean>(true);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    axios.get('/api/settings').then((r) => setSettings(r.data));
  }, []);

  const set = (path: string, value: any) => {
    setSettings((s) => {
      if (!s) return s;
      const copy: any = JSON.parse(JSON.stringify(s));
      const parts = path.split('.');
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (obj[key] === undefined || obj[key] === null) obj[key] = {};
        obj = obj[key];
      }
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const r = await axios.post('/api/settings', settings);
      setSettings(r.data);
    } finally {
      setSaving(false);
    }
  };

  const onPreview = async () => {
    if (!settings) return;
    const r = await axios.post('/api/preview', settings);
    setPreviewUrl(r.data.previewOriginalUrl);
    setPreviewAltUrl(r.data.previewAlternativeUrl);
  };

  // Live preview (debounced)
  useEffect(() => {
    if (!settings || !livePreview) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setPreviewLoading(true);
        await onPreview();
      } catch {
        // ignore
      } finally {
        setPreviewLoading(false);
      }
    }, 800);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [settings, livePreview]);

  return (
    <BlockStack gap="400">
      {!settings && <Text as="p">Loading…</Text>}
      {settings && (
        <>
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">General</Text>
              <BlockStack gap="200">
                <TextField label="Store domain" value={settings.storeDomain} onChange={(v) => set('storeDomain', v)} helpText="e.g., mystore.myshopify.com" />
                <TextField label="VAT rate" type="number" value={String(settings.vatRate)} onChange={(v) => set('vatRate', Number(v))} helpText="e.g., 0.20 for 20%" />
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Label layout (mm)</Text>
              <InlineGrid columns={2} gap="400">
                <TextField label="Label width" type="number" value={String(settings.labelWidthMm)} onChange={(v) => set('labelWidthMm', Number(v))} />
                <TextField label="Label height" type="number" value={String(settings.labelHeightMm)} onChange={(v) => set('labelHeightMm', Number(v))} />
                <TextField label="Margin top" type="number" value={String(settings.pageMarginMm.top)} onChange={(v) => set('pageMarginMm.top', Number(v))} />
                <TextField label="Margin right" type="number" value={String(settings.pageMarginMm.right)} onChange={(v) => set('pageMarginMm.right', Number(v))} />
                <TextField label="Margin bottom" type="number" value={String(settings.pageMarginMm.bottom)} onChange={(v) => set('pageMarginMm.bottom', Number(v))} />
                <TextField label="Margin left" type="number" value={String(settings.pageMarginMm.left)} onChange={(v) => set('pageMarginMm.left', Number(v))} />
                <TextField label="Gutter X" type="number" value={String(settings.gutterMm.x)} onChange={(v) => set('gutterMm.x', Number(v))} />
                <TextField label="Gutter Y" type="number" value={String(settings.gutterMm.y)} onChange={(v) => set('gutterMm.y', Number(v))} />
                <TextField label="Line gap (pt)" type="number" value={String(settings.lineGapPt ?? 0)} onChange={(v) => set('lineGapPt', Number(v))} />
                <div />
                <TextField label="QR offset X (mm)" type="number" value={String(settings.qrOffsetMm?.x ?? 0)} onChange={(v) => set('qrOffsetMm.x', Number(v))} />
                <TextField label="QR offset Y (mm)" type="number" value={String(settings.qrOffsetMm?.y ?? 0)} onChange={(v) => set('qrOffsetMm.y', Number(v))} />
                <TextField label="QR size" type="number" value={String(settings.qrSizeMm)} onChange={(v) => set('qrSizeMm', Number(v))} />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Label captions</Text>
              <InlineGrid columns={2} gap="400">
                <TextField label="Brand caption" value={settings.captions.brand} onChange={(v) => set('captions.brand', v)} />
                <TextField label="Price caption" value={settings.captions.price} onChange={(v) => set('captions.price', v)} />
                <TextField label="Old price caption" value={settings.captions.oldPrice} onChange={(v) => set('captions.oldPrice', v)} />
                <TextField label="Unit price caption" value={settings.captions.unitPrice} onChange={(v) => set('captions.unitPrice', v)} />
                <TextField label="VAT caption" value={settings.captions.vat} onChange={(v) => set('captions.vat', v)} />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Styles</Text>
              <InlineGrid columns={2} gap="400">
                <Text as="h4" variant="headingSm">Default style</Text>
                <div />
                <TextField label="Background color" value={settings.styles?.default.backgroundColor || ''} onChange={(v) => set('styles.default.backgroundColor', v)} placeholder="#FFFFFF" />
                <TextField label="Text color" value={settings.styles?.default.textColor || ''} onChange={(v) => set('styles.default.textColor', v)} placeholder="#000000" />
                <TextField label="Stroke color" value={settings.styles?.default.strokeColor || ''} onChange={(v) => set('styles.default.strokeColor', v)} placeholder="#000000" />

                <Text as="h4" variant="headingSm">Alternative style (applies on discount)</Text>
                <div />
                <TextField label="Background color" value={settings.styles?.alternative.backgroundColor || ''} onChange={(v) => set('styles.alternative.backgroundColor', v)} placeholder="#FFF3CD" />
                <TextField label="Text color" value={settings.styles?.alternative.textColor || ''} onChange={(v) => set('styles.alternative.textColor', v)} placeholder="#000000" />
                <TextField label="Stroke color" value={settings.styles?.alternative.strokeColor || ''} onChange={(v) => set('styles.alternative.strokeColor', v)} placeholder="#000000" />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Field widths (%)</Text>
              <InlineGrid columns={3} gap="400">
                <TextField label="Title width %" type="number" value={String(settings.fieldWidthsPct?.title ?? 100)} onChange={(v) => set('fieldWidthsPct.title', Number(v))} />
                <TextField label="Brand width %" type="number" value={String(settings.fieldWidthsPct?.brand ?? 100)} onChange={(v) => set('fieldWidthsPct.brand', Number(v))} />
                <TextField label="Price width %" type="number" value={String(settings.fieldWidthsPct?.price ?? 100)} onChange={(v) => set('fieldWidthsPct.price', Number(v))} />
                <TextField label="Old price width %" type="number" value={String(settings.fieldWidthsPct?.oldPrice ?? 100)} onChange={(v) => set('fieldWidthsPct.oldPrice', Number(v))} />
                <TextField label="Unit price width %" type="number" value={String(settings.fieldWidthsPct?.unitPrice ?? 100)} onChange={(v) => set('fieldWidthsPct.unitPrice', Number(v))} />
                <TextField label="VAT width %" type="number" value={String(settings.fieldWidthsPct?.vat ?? 100)} onChange={(v) => set('fieldWidthsPct.vat', Number(v))} />
                <TextField label="Short description width %" type="number" value={String(settings.fieldWidthsPct?.shortDescription ?? 100)} onChange={(v) => set('fieldWidthsPct.shortDescription', Number(v))} />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Typography & QR</Text>
              <InlineGrid columns={2} gap="400">
                <TextField label="QR size (mm)" type="number" value={String(settings.qrSizeMm)} onChange={(v) => set('qrSizeMm', Number(v))} />
                <div />
                <TextField label="Title font (pt)" type="number" value={String(settings.fonts?.titlePt ?? 10)} onChange={(v) => set('fonts.titlePt', Number(v))} />
                <TextField label="Brand font (pt)" type="number" value={String(settings.fonts?.brandPt ?? 8)} onChange={(v) => set('fonts.brandPt', Number(v))} />
                <TextField label="Price font (pt)" type="number" value={String(settings.fonts?.pricePt ?? 14)} onChange={(v) => set('fonts.pricePt', Number(v))} />
                <TextField label="Old price font (pt)" type="number" value={String(settings.fonts?.oldPricePt ?? 9)} onChange={(v) => set('fonts.oldPricePt', Number(v))} />
                <TextField label="Unit price font (pt)" type="number" value={String(settings.fonts?.unitPricePt ?? 8)} onChange={(v) => set('fonts.unitPricePt', Number(v))} />
                <TextField label="VAT font (pt)" type="number" value={String(settings.fonts?.vatPt ?? 8)} onChange={(v) => set('fonts.vatPt', Number(v))} />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Brand logo (background)</Text>
              <Text as="p">Upload your logo to the server and provide an absolute or server-relative path. Size preserves aspect ratio based on width.</Text>
              <InlineGrid columns={2} gap="400">
                <Text as="h4" variant="headingSm">Original style logo</Text>
                <div />
                <DropZone allowMultiple={false} accept="image/*" onDrop={async (_e, files) => {
                  const f = files[0];
                  if (!f) return;
                  const form = new FormData();
                  form.append('file', f);
                  const r = await axios.post('/api/upload-logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
                  set('brandLogo.original.path', r.data.path);
                }}>
                  <DropZone.FileUpload actionTitle="Upload original logo" actionHint="PNG/JPG/WebP" />
                </DropZone>
                <TextField label="Logo path" value={settings.brandLogo?.original?.path || ''} onChange={(v) => set('brandLogo.original.path', v)} placeholder="public/brand_logo.png" />
                <TextField label="Width (mm)" type="number" value={String(settings.brandLogo?.original?.widthMm ?? 0)} onChange={(v) => set('brandLogo.original.widthMm', Number(v))} />
                <TextField label="X (mm)" type="number" value={String(settings.brandLogo?.original?.xMm ?? 0)} onChange={(v) => set('brandLogo.original.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.brandLogo?.original?.yMm ?? 0)} onChange={(v) => set('brandLogo.original.yMm', Number(v))} />
                <TextField label="Opacity (0-1)" type="number" value={String(settings.brandLogo?.original?.opacity ?? 0.2)} onChange={(v) => set('brandLogo.original.opacity', Number(v))} />

                <Text as="h4" variant="headingSm">Alternative style logo</Text>
                <div />
                <DropZone allowMultiple={false} accept="image/*" onDrop={async (_e, files) => {
                  const f = files[0];
                  if (!f) return;
                  const form = new FormData();
                  form.append('file', f);
                  const r = await axios.post('/api/upload-logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
                  set('brandLogo.alternative.path', r.data.path);
                }}>
                  <DropZone.FileUpload actionTitle="Upload alternative logo" actionHint="PNG/JPG/WebP" />
                </DropZone>
                <TextField label="Logo path" value={settings.brandLogo?.alternative?.path || ''} onChange={(v) => set('brandLogo.alternative.path', v)} placeholder="public/brand_logo_alt.png" />
                <TextField label="Width (mm)" type="number" value={String(settings.brandLogo?.alternative?.widthMm ?? 0)} onChange={(v) => set('brandLogo.alternative.widthMm', Number(v))} />
                <TextField label="X (mm)" type="number" value={String(settings.brandLogo?.alternative?.xMm ?? 0)} onChange={(v) => set('brandLogo.alternative.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.brandLogo?.alternative?.yMm ?? 0)} onChange={(v) => set('brandLogo.alternative.yMm', Number(v))} />
                <TextField label="Opacity (0-1)" type="number" value={String(settings.brandLogo?.alternative?.opacity ?? 0.2)} onChange={(v) => set('brandLogo.alternative.opacity', Number(v))} />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Compare price strike style</Text>
              <InlineGrid columns={2} gap="400">
                <TextField label="Diagonal strike for compare price (1=true, 0=false)" type="number" value={String(settings.diagonalStrikeForCompare ? 1 : 0)} onChange={(v) => set('diagonalStrikeForCompare', Number(v) === 1)} helpText="Set to 1 to draw a diagonal line through the compare-at price" />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Short description</Text>
              <InlineGrid columns={3} gap="400">
                <TextField label="Max lines" type="number" value={String(settings.shortDescMaxLines ?? 1)} onChange={(v) => set('shortDescMaxLines', Number(v))} />
                <TextField label="Width %" type="number" value={String(settings.fieldWidthsPct?.shortDescription ?? 100)} onChange={(v) => set('fieldWidthsPct.shortDescription', Number(v))} />
                <TextField label="Font size (pt)" type="number" value={String(settings.fonts?.shortDescPt ?? settings.fonts?.brandPt ?? 8)} onChange={(v) => set('fonts.shortDescPt', Number(v))} />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Label border</Text>
              <InlineGrid columns={3} gap="400">
                <TextField label="Default border width (pt)" type="number" value={String(settings.styles?.default.borderWidthPt ?? 0)} onChange={(v) => set('styles.default.borderWidthPt', Number(v))} />
                <TextField label="Default border color" value={settings.styles?.default.borderColor ?? ''} onChange={(v) => set('styles.default.borderColor', v)} />
                <TextField label="Default border enabled (1/0)" type="number" value={String(settings.styles?.default.borderEnabled ? 1 : 0)} onChange={(v) => set('styles.default.borderEnabled', Number(v) === 1)} />

                <Text as="h4" variant="headingSm">Alternative border</Text>
                <div />
                <div />
                <TextField label="Alternative border width (pt)" type="number" value={String(settings.styles?.alternative.borderWidthPt ?? 0)} onChange={(v) => set('styles.alternative.borderWidthPt', Number(v))} />
                <TextField label="Alternative border color" value={settings.styles?.alternative.borderColor ?? ''} onChange={(v) => set('styles.alternative.borderColor', v)} />
                <TextField label="Alternative border enabled (1/0)" type="number" value={String(settings.styles?.alternative.borderEnabled ? 1 : 0)} onChange={(v) => set('styles.alternative.borderEnabled', Number(v) === 1)} />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">QR Border</Text>
              <InlineGrid columns={3} gap="400">
                <TextField label="Border width (pt)" type="number" value={String(settings.qrBorderWidthPt ?? 0)} onChange={(v) => set('qrBorderWidthPt', Number(v))} />
                <TextField label="Border enabled (1/0)" type="number" value={String(settings.qrBorderEnabled ? 1 : 0)} onChange={(v) => set('qrBorderEnabled', Number(v) === 1)} />
                <div />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Field visibility (1=on/0=off) and offsets (mm)</Text>
              <InlineGrid columns={4} gap="400">
                <Text as="h4" variant="headingSm">Title</Text>
                <TextField label="Enabled" type="number" value={String(settings.fieldEnabled?.title ? 1 : 0)} onChange={(v) => set('fieldEnabled.title', Number(v) === 1)} />
                <TextField label="X (mm)" type="number" value={String(settings.fieldOffsetsMm?.title?.xMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.title.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.fieldOffsetsMm?.title?.yMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.title.yMm', Number(v))} />

                <Text as="h4" variant="headingSm">Brand</Text>
                <TextField label="Enabled" type="number" value={String(settings.fieldEnabled?.brand ? 1 : 0)} onChange={(v) => set('fieldEnabled.brand', Number(v) === 1)} />
                <TextField label="X (mm)" type="number" value={String(settings.fieldOffsetsMm?.brand?.xMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.brand.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.fieldOffsetsMm?.brand?.yMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.brand.yMm', Number(v))} />

                <Text as="h4" variant="headingSm">Price</Text>
                <TextField label="Enabled" type="number" value={String(settings.fieldEnabled?.price ? 1 : 0)} onChange={(v) => set('fieldEnabled.price', Number(v) === 1)} />
                <TextField label="X (mm)" type="number" value={String(settings.fieldOffsetsMm?.price?.xMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.price.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.fieldOffsetsMm?.price?.yMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.price.yMm', Number(v))} />

                <Text as="h4" variant="headingSm">Old price</Text>
                <TextField label="Enabled" type="number" value={String(settings.fieldEnabled?.oldPrice ? 1 : 0)} onChange={(v) => set('fieldEnabled.oldPrice', Number(v) === 1)} />
                <TextField label="X (mm)" type="number" value={String(settings.fieldOffsetsMm?.oldPrice?.xMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.oldPrice.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.fieldOffsetsMm?.oldPrice?.yMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.oldPrice.yMm', Number(v))} />

                <Text as="h4" variant="headingSm">Unit price</Text>
                <TextField label="Enabled" type="number" value={String(settings.fieldEnabled?.unitPrice ? 1 : 0)} onChange={(v) => set('fieldEnabled.unitPrice', Number(v) === 1)} />
                <TextField label="X (mm)" type="number" value={String(settings.fieldOffsetsMm?.unitPrice?.xMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.unitPrice.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.fieldOffsetsMm?.unitPrice?.yMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.unitPrice.yMm', Number(v))} />

                <Text as="h4" variant="headingSm">VAT</Text>
                <TextField label="Enabled" type="number" value={String(settings.fieldEnabled?.vat ? 1 : 0)} onChange={(v) => set('fieldEnabled.vat', Number(v) === 1)} />
                <TextField label="X (mm)" type="number" value={String(settings.fieldOffsetsMm?.vat?.xMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.vat.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.fieldOffsetsMm?.vat?.yMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.vat.yMm', Number(v))} />

                <Text as="h4" variant="headingSm">Short description</Text>
                <TextField label="Enabled" type="number" value={String(settings.fieldEnabled?.shortDescription ? 1 : 0)} onChange={(v) => set('fieldEnabled.shortDescription', Number(v) === 1)} />
                <TextField label="X (mm)" type="number" value={String(settings.fieldOffsetsMm?.shortDescription?.xMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.shortDescription.xMm', Number(v))} />
                <TextField label="Y (mm)" type="number" value={String(settings.fieldOffsetsMm?.shortDescription?.yMm ?? 0)} onChange={(v) => set('fieldOffsetsMm.shortDescription.yMm', Number(v))} />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Button primary onClick={onSave} loading={saving}>
            Save settings
          </Button>
          <Button onClick={onPreview}>
            Generate preview
          </Button>
          <BlockStack gap="200">
            {previewUrl && (
              <Text as="p">
                Original preview: <Link url={previewUrl} target="_blank">Open</Link>
              </Text>
            )}
            {previewAltUrl && (
              <Text as="p">
                Alternative preview: <Link url={previewAltUrl} target="_blank">Open</Link>
              </Text>
            )}
          </BlockStack>

          <Card>
            <BlockStack gap="200">
              <InlineGrid columns={2} gap="400">
                <Text as="h3" variant="headingMd">Live Preview</Text>
                <div style={{ textAlign: 'right' }}>
                  <Button onClick={() => setLivePreview((v) => !v)}>
                    {livePreview ? 'Live preview: ON' : 'Live preview: OFF'}
                  </Button>
                </div>
              </InlineGrid>
              <InlineGrid columns={2} gap="400">
                <div style={{ border: '1px solid #e5e5e5', height: 480 }}>
                  {previewLoading && <Text as="p">Loading original…</Text>}
                  {previewUrl ? (
                    <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Original preview" />
                  ) : (
                    <Text as="p">Original preview will appear here</Text>
                  )}
                </div>
                <div style={{ border: '1px solid #e5e5e5', height: 480 }}>
                  {previewLoading && <Text as="p">Loading alternative…</Text>}
                  {previewAltUrl ? (
                    <iframe src={previewAltUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Alternative preview" />
                  ) : (
                    <Text as="p">Alternative preview will appear here</Text>
                  )}
                </div>
              </InlineGrid>
            </BlockStack>
          </Card>
        </>
      )}
    </BlockStack>
  );
}