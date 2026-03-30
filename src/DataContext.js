import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DEFAULT_DATA } from './data/defaultData';

const DataContext = createContext(null);
const STORAGE_KEY  = 'kbtu_dashboard_data';
const CONFIG_KEY   = 'kbtu_dashboard_config';

const BUILDING_FACULTY_MAP = {
  'Main Building': 'Engineering',
  'Research Hub': 'IT & Data Science',
  'Sports Complex': 'Student Life',
  'Library': 'Business & Economics',
  'Dormitories': 'Student Life',
};

const DEFAULT_CONFIG = {
  sheetsApiUrl: '',
  autoRefreshMin: 30,
  dataSource: 'local',
};

export function DataProvider({ children }) {
  const [data, setData]     = useState(() => loadLocal());
  const [config, setConfig] = useState(() => {
    try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') }; }
    catch { return DEFAULT_CONFIG; }
  });
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ state: 'idle', msg: '', ts: null });
  const [dashboardFilters, setDashboardFilters] = useState({ year: 'all', building: 'all', faculty: 'all' });
  const refreshTimer = useRef(null);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }, [data]);
  useEffect(() => { try { localStorage.setItem(CONFIG_KEY,  JSON.stringify(config)); } catch {} }, [config]);

  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (config.dataSource === 'sheets' && config.sheetsApiUrl && config.autoRefreshMin > 0) {
      refreshTimer.current = setInterval(() => fetchFromSheets(), config.autoRefreshMin * 60 * 1000);
    }
    return () => clearInterval(refreshTimer.current);
  // eslint-disable-next-line
  }, [config.dataSource, config.sheetsApiUrl, config.autoRefreshMin]);

  const fetchFromSheets = useCallback(async () => {
    if (!config.sheetsApiUrl) return;
    setSyncStatus({ state: 'loading', msg: 'Fetching from Google Sheets…', ts: null });
    try {
      const url = `${config.sheetsApiUrl}?action=getData&t=${Date.now()}`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(prev => deepMerge(prev, json));
      setSyncStatus({ state: 'ok', msg: 'Synced from Google Sheets', ts: new Date().toLocaleTimeString() });
    } catch (err) {
      setSyncStatus({ state: 'error', msg: `Sync failed: ${err.message}`, ts: null });
    }
  }, [config.sheetsApiUrl]);

  const pushToSheets = useCallback(async (sheetName, rowsArray) => {
    if (!config.sheetsApiUrl) return { error: 'No API URL configured' };
    try {
      const res = await fetch(config.sheetsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'replaceSheet', password: config.adminPassword, sheet: sheetName, data: rowsArray })
      });
      return await res.json();
    } catch (err) { return { error: err.message }; }
  }, [config.sheetsApiUrl, config.adminPassword]);

  const login  = useCallback((pw) => { if (pw === config.adminPassword) { setIsAdmin(true); return true; } return false; }, [config.adminPassword]);
  const logout = useCallback(() => setIsAdmin(false), []);

  const updateSection   = useCallback((section, val) => setData(prev => ({ ...prev, [section]: val })), []);
  const importTable     = useCallback((section, rows) => setData(prev => ({ ...prev, [section]: rows })), []);
  const resetToDefaults = useCallback(() => { setData(DEFAULT_DATA); localStorage.removeItem(STORAGE_KEY); }, []);
  const updateConfig    = useCallback((patch) => setConfig(prev => ({ ...prev, ...patch })), []);
  const setDashboardFilter = useCallback((key, value) => {
    setDashboardFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const getFacultyForBuilding = useCallback((buildingName) => {
    return BUILDING_FACULTY_MAP[buildingName] || 'General';
  }, []);

  const filterOptions = useMemo(() => {
    const years = [
      ...(data.energyTrend || []).map(r => Number(r.year)),
      ...(data.emissionsTrend || []).map(r => Number(r.year)),
      ...(data.waterTrend || []).map(r => Number(r.year)),
      ...(data.wasteTrend || []).map(r => Number(r.year)),
      ...(data.esgTrend || []).map(r => Number(r.year)),
    ]
      .filter(Number.isFinite)
      .map(String);

    const buildings = [
      ...(data.buildingsEnergy || []).map(r => r.name),
      ...(data.buildingsWater || []).map(r => r.name),
      ...(data.mapPoints || []).map(r => r.building),
    ]
      .filter(Boolean);

    const uniqueYears = Array.from(new Set(years)).sort((a, b) => Number(a) - Number(b));
    const uniqueBuildings = Array.from(new Set(buildings)).sort((a, b) => a.localeCompare(b));
    const uniqueFaculties = Array.from(new Set(uniqueBuildings.map(getFacultyForBuilding))).sort((a, b) => a.localeCompare(b));

    return {
      years: uniqueYears,
      buildings: uniqueBuildings,
      faculties: uniqueFaculties,
    };
  }, [data, getFacultyForBuilding]);

  return (
    <DataContext.Provider value={{
      data, config, isAdmin, editingTable, syncStatus,
      setEditingTable, login, logout,
      updateSection, importTable, resetToDefaults,
      fetchFromSheets, pushToSheets, updateConfig,
      dashboardFilters, setDashboardFilter, filterOptions, getFacultyForBuilding,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);

function loadLocal() {
  try { const s = localStorage.getItem('kbtu_dashboard_data'); return s ? JSON.parse(s) : DEFAULT_DATA; }
  catch { return DEFAULT_DATA; }
}

function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return base;
  const result = { ...base };
  Object.keys(override).forEach(k => {
    if (override[k] === null || override[k] === undefined) return;
    if (Array.isArray(override[k])) { if (override[k].length > 0) result[k] = override[k]; }
    else if (typeof override[k] === 'object' && !Array.isArray(base[k])) { result[k] = deepMerge(base[k] || {}, override[k]); }
    else { result[k] = override[k]; }
  });
  return result;
}
