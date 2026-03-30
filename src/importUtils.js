// importUtils.js — Parse Excel (.xlsx) and CSV files into JS objects

export async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return parseCSV(file);
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parseXLSX(file);
  throw new Error('Unsupported file type. Please use .xlsx or .csv');
}

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj = {};
          headers.forEach((h, i) => {
            const v = vals[i] ?? '';
            obj[h] = isNaN(v) || v === '' ? v : Number(v);
          });
          return obj;
        }).filter(r => Object.values(r).some(v => v !== ''));
        resolve({ headers, rows });
      } catch(err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (raw.length < 2) { reject(new Error('Empty sheet')); return; }
        const headers = raw[0].map(h => String(h).trim());
        const rows = raw.slice(1).map(r => {
          const obj = {};
          headers.forEach((h, i) => {
            const v = r[i] ?? '';
            obj[h] = (typeof v === 'number') ? v : (isNaN(v) || v === '' ? v : Number(v));
          });
          return obj;
        }).filter(r => Object.values(r).some(v => v !== '' && v !== null && v !== undefined));
        resolve({ headers, rows });
      } catch(err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function exportToCSV(headers, rows, filename = 'export.csv') {
  const lines = [headers.join(',')];
  rows.forEach(row => lines.push(headers.map(h => {
    const v = row[h] ?? '';
    return String(v).includes(',') ? `"${v}"` : v;
  }).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportAllDataCSV(data) {

  const download = (name, rows) => {
    if (!rows || !rows.length) return;

    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(','),
      ...rows.map(r =>
        headers.map(h => {
          const v = r[h] ?? '';
          return String(v).includes(',') ? `"${v}"` : v;
        }).join(',')
      )
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kbtu_${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔹 Export everything
  download('esg_trend', data.esgTrend);
  download('energy_trend', data.energyTrend);
  download('buildings_energy', data.buildingsEnergy);

  download('emissions_by_source', data.emissions.bySource);
  download('emissions_trend', data.emissionsTrend);

  download('water_trend', data.waterTrend);
  download('water_by_type', data.water.byType);
  download('buildings_water', data.buildingsWater);

  download('waste_trend', data.wasteTrend);
  download('waste_by_type', data.waste.byType);

  download('sdg_progress', data.environment.sdgProgress);
  download('initiatives', data.environment.initiatives);
  download('transport', data.environment.transport);
  download('procurement', data.environment.procurement);

  download('impact_categories', data.impactCategories);
}

export async function parseMultiSheetFile(file) {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  const result = {};
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    result[name.toLowerCase().replace(/\s+/g, '')] = rows;
  });
  return result;
}

//One sheet per data section.
export async function exportAllDataExcel(data) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const addSheet = (name, rows) => {
    if (!rows) return;
    const arr = Array.isArray(rows) ? rows : [rows];
    const ws = XLSX.utils.json_to_sheet(arr);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  // 🔹 Core meta
  addSheet('Meta', [data.meta]);

  // 🔹 KPI (flattened)
  addSheet('KPI', Object.entries(data.kpi).map(([key, v]) => ({
    metric: key,
    value: v.value,
    unit: v.unit,
    delta: v.delta,
    deltaLabel: v.deltaLabel
  })));

  // 🔹 Energy summary
  addSheet('Energy', [
    { type: 'Natural Gas', ...data.energy.naturalGas },
    { type: 'Thermal', ...data.energy.thermal },
    { type: 'Electricity', ...data.energy.electricity },
  ]);

  // 🔹 Trends & tables
  addSheet('EsgTrend', data.esgTrend);
  addSheet('EnergyTrend', data.energyTrend);
  addSheet('BuildingsEnergy', data.buildingsEnergy);

  addSheet('EmissionsSummary', [{
    scope1: data.emissions.scope1,
    scope2: data.emissions.scope2,
    total: data.emissions.total,
    perStudent: data.emissions.perStudent
  }]);
  addSheet('EmissionsBySource', data.emissions.bySource);
  addSheet('EmissionsTrend', data.emissionsTrend);

  addSheet('WaterSummary', [{
    total: data.water.total,
    perStudent: data.water.perStudent,
    intensity: data.water.intensity,
    recycledPct: data.water.recycledPct
  }]);
  addSheet('WaterByType', data.water.byType);
  addSheet('WaterTrend', data.waterTrend);
  addSheet('BuildingsWater', data.buildingsWater);

  addSheet('WasteSummary', [{
    total: data.waste.total,
    diversionRate: data.waste.diversionRate,
    composted: data.waste.composted
  }]);
  addSheet('WasteByType', data.waste.byType);
  addSheet('WasteTrend', data.wasteTrend);

  addSheet('ImpactCategories', data.impactCategories);

  addSheet('SDGProgress', data.environment.sdgProgress);
  addSheet('Initiatives', data.environment.initiatives);
  addSheet('Transport', data.environment.transport);
  addSheet('Procurement', data.environment.procurement);

  addSheet('MapPoints', data.mapPoints || []);

  XLSX.writeFile(wb, 'kbtu_full_export.xlsx');
}


// Export all visible dashboard pages as a single PDF.

export async function exportDashboardPDF(setPage) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const pages = ['home', 'energy', 'emissions', 'water', 'waste', 'environment'];
  const container = document.getElementById('root');

  // Hide nav and admin bar during capture
  const hideEls = document.querySelectorAll('nav, .admin-bar-wrap');
  hideEls.forEach(el => { el.dataset.origDisplay = el.style.display; el.style.display = 'none'; });

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 800] });

  for (let i = 0; i < pages.length; i++) {
    setPage(pages[i]);
    // Wait for React re-render + charts animation
    await new Promise(r => setTimeout(r, 900));

    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      scrollY: 0,
      windowWidth: 1280,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.88);
    if (i > 0) pdf.addPage([1280, 800], 'landscape');
    pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 800);
  }

  // Restore hidden elements
  hideEls.forEach(el => { el.style.display = el.dataset.origDisplay || ''; });

  pdf.save('kbtu_sustainability_dashboard.pdf');
}

export function getPageExport(page, data, t) {
  switch (page) {

    case 'energy':
      return {
        name: 'energy',
        sheets: {
          EnergyTrend: data.energyTrend,
          BuildingsEnergy: data.buildingsEnergy,
          EnergySummary: [
            { type: t('natural_gas'), ...data.energy.naturalGas },
            { type: t('thermal'), ...data.energy.thermal },
            { type: t('electricity'), ...data.energy.electricity },
          ]
        }
      };

    case 'emissions':
      return {
        name: 'emissions',
        sheets: {
          EmissionsTrend: data.emissionsTrend,
          EmissionsBySource: data.emissions.bySource
        }
      };

    case 'water':
      return {
        name: 'water',
        sheets: {
          WaterTrend: data.waterTrend,
          WaterByType: data.water.byType,
          BuildingsWater: data.buildingsWater
        }
      };

    case 'waste':
      return {
        name: 'waste',
        sheets: {
          WasteTrend: data.wasteTrend,
          WasteByType: data.waste.byType
        }
      };

    case 'environment':
      return {
        name: 'environment',
        sheets: {
          SDGProgress: data.environment.sdgProgress,
          Initiatives: data.environment.initiatives,
          Transport: data.environment.transport,
          Procurement: data.environment.procurement
        }
      };

    case 'home':
    default:
      return {
        name: 'overview',
        sheets: {
          ESGTrend: data.esgTrend,
          Impact: data.impactCategories
        }
      };
  }
}

export async function exportPageExcel(page, data, t) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const config = getPageExport(page, data, t);

  Object.entries(config.sheets).forEach(([name, rows]) => {
    if (!rows || !rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, `kbtu_${config.name}.xlsx`);
}

export function exportPageCSV(page, data, t) {
  const config = getPageExport(page, data, t);

  Object.entries(config.sheets).forEach(([name, rows]) => {
    if (!rows || !rows.length) return;

    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(','),
      ...rows.map(r =>
        headers.map(h => {
          const v = r[h] ?? '';
          return String(v).includes(',') ? `"${v}"` : v;
        }).join(',')
      )
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `kbtu_${config.name}_${name}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  });
}