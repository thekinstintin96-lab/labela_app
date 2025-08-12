import { useEffect, useState } from 'react';
import { Card, Form, FormLayout, InlineGrid, Text, TextField, Button, BlockStack } from '@shopify/polaris';
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
};

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/settings').then((r) => setSettings(r.data));
  }, []);

  if (!settings) return <Text as="p">Loading…</Text>;

  const set = (path: string, value: any) => {
    setSettings((s) => {
      if (!s) return s;
      const copy: any = JSON.parse(JSON.stringify(s));
      const parts = path.split('.');
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
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

  return (
    <BlockStack gap="400">
      <Card>
        <Card.Header title="General" />
        <Card.Section>
          <Form>
            <FormLayout>
              <TextField label="Store domain" value={settings.storeDomain} onChange={(v) => set('storeDomain', v)} helpText="e.g., mystore.myshopify.com" />
              <TextField label="VAT rate" type="number" value={String(settings.vatRate)} onChange={(v) => set('vatRate', Number(v))} helpText="e.g., 0.20 for 20%" />
            </FormLayout>
          </Form>
        </Card.Section>
      </Card>

      <Card>
        <Card.Header title="Label layout (mm)" />
        <Card.Section>
          <InlineGrid columns={2} gap="400">
            <TextField label="Label width" type="number" value={String(settings.labelWidthMm)} onChange={(v) => set('labelWidthMm', Number(v))} />
            <TextField label="Label height" type="number" value={String(settings.labelHeightMm)} onChange={(v) => set('labelHeightMm', Number(v))} />
            <TextField label="Margin top" type="number" value={String(settings.pageMarginMm.top)} onChange={(v) => set('pageMarginMm.top', Number(v))} />
            <TextField label="Margin right" type="number" value={String(settings.pageMarginMm.right)} onChange={(v) => set('pageMarginMm.right', Number(v))} />
            <TextField label="Margin bottom" type="number" value={String(settings.pageMarginMm.bottom)} onChange={(v) => set('pageMarginMm.bottom', Number(v))} />
            <TextField label="Margin left" type="number" value={String(settings.pageMarginMm.left)} onChange={(v) => set('pageMarginMm.left', Number(v))} />
            <TextField label="Gutter X" type="number" value={String(settings.gutterMm.x)} onChange={(v) => set('gutterMm.x', Number(v))} />
            <TextField label="Gutter Y" type="number" value={String(settings.gutterMm.y)} onChange={(v) => set('gutterMm.y', Number(v))} />
            <TextField label="QR size" type="number" value={String(settings.qrSizeMm)} onChange={(v) => set('qrSizeMm', Number(v))} />
          </InlineGrid>
        </Card.Section>
      </Card>

      <Card>
        <Card.Header title="Label captions" />
        <Card.Section>
          <InlineGrid columns={2} gap="400">
            <TextField label="Brand caption" value={settings.captions.brand} onChange={(v) => set('captions.brand', v)} />
            <TextField label="Price caption" value={settings.captions.price} onChange={(v) => set('captions.price', v)} />
            <TextField label="Old price caption" value={settings.captions.oldPrice} onChange={(v) => set('captions.oldPrice', v)} />
            <TextField label="Unit price caption" value={settings.captions.unitPrice} onChange={(v) => set('captions.unitPrice', v)} />
            <TextField label="VAT caption" value={settings.captions.vat} onChange={(v) => set('captions.vat', v)} />
          </InlineGrid>
        </Card.Section>
      </Card>

      <Button primary onClick={onSave} loading={saving}>
        Save settings
      </Button>
    </BlockStack>
  );
}