import React, { useState } from 'react';
import { DataProvider, useData } from './DataContext';
import { LangProvider } from './LangContext';
import { Nav, AdminBar } from './components/UI';
import TableEditor from './components/TableEditor';
import SettingsPanel from './components/SettingsPanel';
import HomePage from './components/HomePage';
import EnergyPage from './components/EnergyPage';
import { EmissionsPage, WaterPage, WastePage, EnvironmentPage } from './components/OtherPages';

const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap';
document.head.appendChild(fontLink);

const styleEl = document.createElement('style');
styleEl.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; background: #7d8f7d; min-height: 100vh; overflow-x: hidden; }
  @media print { nav, .admin-bar { display: none !important; } }
`;
document.head.appendChild(styleEl);

const TABLE_TITLES = {
  energyTrend: 'Energy Trend Data',
  buildingsEnergy: 'Buildings — Energy',
  emissionsTrend: 'Emissions Trend',
  waterTrend: 'Water Trend',
  buildingsWater: 'Buildings — Water',
  wasteTrend: 'Waste Diversion Trend',
  esgTrend: 'ESG Score Trend',
};

function Dashboard() {
  const [page, setPage] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const { editingTable, setEditingTable } = useData();

  const pages = { home: HomePage, energy: EnergyPage, emissions: EmissionsPage, water: WaterPage, waste: WastePage, environment: EnvironmentPage };
  const PageComponent = pages[page] || HomePage;

  return (
    <div>
      <Nav activePage={page} setPage={setPage} onSettings={() => setShowSettings(true)} />
      <AdminBar />
      <PageComponent setPage={setPage} />
      {editingTable && <TableEditor section={editingTable} title={TABLE_TITLES[editingTable] || editingTable} onClose={() => setEditingTable(null)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <DataProvider>
        <Dashboard />
      </DataProvider>
    </LangProvider>
  );
}
