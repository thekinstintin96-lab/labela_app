import { useState } from 'react';
import { BlockStack, Button, Card, DataTable, DropZone, Link, Text } from '@shopify/polaris';
import axios from 'axios';

export function GeneratePage() {
  const [csvInfo, setCsvInfo] = useState<{ count: number; sample: any[] } | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ pdfUrl: string; overflowCsvUrl?: string | null } | null>(null);

  const onFileUpload = async (files: File[]) => {
    const file = files[0];
    const form = new FormData();
    form.append('file', file);
    const r = await axios.post('/api/upload-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setCsvInfo(r.data);
    const text = await file.text();
    const Papa = await import('papaparse');
    const parsed: any = Papa.parse(text, { header: true, skipEmptyLines: true });
    const allRows = parsed.data as any[];
    setRows(allRows);
  };

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const settings = (await axios.get('/api/settings')).data;
      const r = await axios.post('/api/generate', { settings, rows });
      setResult(r.data);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="300">
          <Text as="h3" variant="headingMd">Upload CSV</Text>
          <DropZone onDrop={onFileUpload} allowMultiple={false} accept=".csv">
            <DropZone.FileUpload actionTitle="Upload Shopify Products CSV" actionHint="CSV export from Products" />
          </DropZone>
        </BlockStack>
      </Card>

      {csvInfo && (
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">CSV preview</Text>
            <Text as="p">Rows: {csvInfo.count}</Text>
            {csvInfo.sample.length > 0 && (
              <DataTable
                columnContentTypes={Object.keys(csvInfo.sample[0]).map(() => 'text')}
                headings={Object.keys(csvInfo.sample[0])}
                rows={csvInfo.sample.map((row) => Object.values(row))}
              />
            )}
          </BlockStack>
        </Card>
      )}

      <Button primary onClick={onGenerate} loading={generating} disabled={!rows.length}>
        Generate PDF
      </Button>

      {result && (
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">Results</Text>
            <BlockStack gap="200">
              <Text as="p">
                PDF: <Link url={result.pdfUrl} target="_blank">Open</Link>
              </Text>
              {result.overflowCsvUrl && (
                <Text as="p">
                  Overflow report: <Link url={result.overflowCsvUrl} target="_blank">Open</Link>
                </Text>
              )}
            </BlockStack>
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}