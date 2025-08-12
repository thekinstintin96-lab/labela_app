import { useCallback, useEffect, useState } from 'react';
import { AppProvider, Frame, Navigation, Page, Tabs } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { GeneratePage } from './pages/GeneratePage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  const [selected, setSelected] = useState(0);
  const tabs = [
    { id: 'settings', content: 'Settings' },
    { id: 'generate', content: 'Generate' },
  ];
  const handleTabChange = useCallback((index: number) => setSelected(index), []);

  return (
    <AppProvider i18n={{}}>
      <Frame>
        <Page title="Shelf Label Generator">
          <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} fitted>
            <Tabs.Panel id="settings" title="Settings">
              <SettingsPage />
            </Tabs.Panel>
            <Tabs.Panel id="generate" title="Generate">
              <GeneratePage />
            </Tabs.Panel>
          </Tabs>
        </Page>
      </Frame>
    </AppProvider>
  );
}

export default App;
