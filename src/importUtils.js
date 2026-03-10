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
        // Dynamically import xlsx library
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
  // Export a summary sheet
  const rows = [
    ['Metric', 'Value', 'Unit', 'Year'],
    ['ESG Score', data.kpi.esgScore.value, '/100', 2023],
    ['Energy Total', data.kpi.energy.value, 'MWh', 2023],
    ['Natural Gas', data.energy.naturalGas.total, 'MWh', 2023],
    ['Thermal Energy', data.energy.thermal.total, 'Gcal', 2023],
    ['Electricity', data.energy.electricity.total, 'MWh', 2023],
    ['Renewable Share', data.energy.electricity.renewablePct, '%', 2023],
    ['Total GHG', data.emissions.total, 'tCO2e', 2023],
    ['Scope 1', data.emissions.scope1, 'tCO2e', 2023],
    ['Scope 2', data.emissions.scope2, 'tCO2e', 2023],
    ['Water Total', data.water.total, 'm3', 2023],
    ['Water Recycled', data.water.recycledPct, '%', 2023],
    ['Waste Total', data.waste.total, 'tonnes', 2023],
    ['Diversion Rate', data.waste.diversionRate, '%', 2023],
    ['Green Projects', data.environment.greenProjects, 'count', 2023],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'KBTU_Sustainability_Summary.csv'; a.click();
  URL.revokeObjectURL(url);
}
