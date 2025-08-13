import { useCallback, useState } from 'react';
import { AppProvider, Frame, Page, Tabs, Box } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { GeneratePage } from './pages/GeneratePage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  const [selected, setSelected] = useState(0);
  const tabs = [
    { id: 'settings', content: 'Settings', panelID: 'settings-panel' },
    { id: 'generate', content: 'Generate', panelID: 'generate-panel' },
  ];
  const handleTabChange = useCallback((index: number) => setSelected(index), []);

  return (
    <AppProvider i18n={{}}>
      <Frame>
        <Page title="Shelf Label Generator">
          <div style={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} fitted>
              <Box padding="400" id={tabs[selected].panelID}>
                {selected === 0 ? <SettingsPage /> : <GeneratePage />}
              </Box>
            </Tabs>
          </div>
        </Page>
      </Frame>
    </AppProvider>
  );
}

export default App;
