import React, { useState, useRef } from 'react';
import { useData } from '../DataContext';
import { parseFile, exportToCSV } from '../importUtils';

// Sheet name mapping: DataContext section → Google Sheets tab name
const SHEET_MAP = {
  energyTrend: 'EnergyTrend', buildingsEnergy: 'BuildingsEnergy',
  emissionsTrend: 'EmissionsTrend', waterTrend: 'WaterTrend',
  buildingsWater: 'BuildingsWater', wasteTrend: 'WasteTrend', esgTrend: 'EsgTrend',
};

// Map section name → column definitions
const SCHEMA = {
  energyTrend: ['year','naturalGas','thermal','electricity'],
  buildingsEnergy: ['name','mwh','kwh_m2','delta'],
  emissionsTrend: ['year','actual','target'],
  waterTrend: ['year','total','recycled'],
  buildingsWater: ['name','drinking','technical','irrigation'],
  wasteTrend: ['year','actual','target'],
  esgTrend: ['year','score'],
};

export default function TableEditor({ section, title, onClose }) {
  const { data, importTable, pushToSheets, config } = useData();
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState(() => JSON.parse(JSON.stringify(data[section] || [])));
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef();

  const cols = SCHEMA[section] || (rows[0] ? Object.keys(rows[0]) : []);

  const updateCell = (ri, col, val) => {
    const updated = rows.map((r, i) => i === ri ? { ...r, [col]: isNaN(val) || val === '' ? val : Number(val) } : r);
    setRows(updated);
  };

  const addRow = () => {
    const blank = {};
    cols.forEach(c => blank[c] = '');
    setRows([...rows, blank]);
  };

  const deleteRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    importTable(section, rows);
    if (config.dataSource === "sheets" && SHEET_MAP[section]) {
      const result = await pushToSheets(SHEET_MAP[section], rows);
      if (result?.error) setImportMsg(`⚠️ Saved locally, Sheets sync failed: ${result.error}`);
      else setImportMsg(`✅ Saved locally + synced to Google Sheets!`);
      setSaving(false);
      setTimeout(onClose, 1200);
    } else {
      setSaving(false);
      onClose();
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true); setImportMsg('');
    try {
      const { rows: parsed } = await parseFile(file);
      setRows(parsed);
      setImportMsg(`✅ Imported ${parsed.length} rows from ${file.name}`);
    } catch(err) {
      setImportMsg(`❌ Error: ${err.message}`);
    }
    setImporting(false);
    e.target.value = '';
  };

  const handleExport = () => exportToCSV(cols, rows, `${section}.csv`);

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, letterSpacing: '.06em' }}>{title}</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Import / Export bar */}
        <div style={toolBar}>
          <button style={btnSecondary} onClick={() => fileRef.current.click()} disabled={importing}>
            📂 Import Excel / CSV
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={handleFileImport} />
          <button style={btnSecondary} onClick={handleExport}>⬇ Export CSV</button>
          <button style={btnPrimary} onClick={addRow}>+ Add Row</button>
          {importMsg && <span style={{ fontSize: 12, color: importMsg.startsWith('✅') ? '#2d5a3d' : '#c44' }}>{importMsg}</span>}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {cols.map(c => <th key={c} style={th}>{c}</th>)}
                <th style={th}>Del</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? '#f5f8f5' : '#fff' }}>
                  {cols.map(c => (
                    <td key={c} style={td}>
                      <input
                        value={row[c] ?? ''}
                        onChange={e => updateCell(ri, c, e.target.value)}
                        style={cellInput}
                      />
                    </td>
                  ))}
                  <td style={td}>
                    <button onClick={() => deleteRow(ri)} style={delBtn}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap: 12, marginTop: 20 }}>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={save} disabled={saving}>{saving ? "⏳ Saving…" : config.dataSource === "sheets" ? "💾 Save + Sync to Sheets" : "💾 Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 };
const modal = { background:'#fff',borderRadius:16,padding:28,width:'100%',maxWidth:900,boxShadow:'0 24px 64px rgba(0,0,0,.25)',display:'flex',flexDirection:'column',gap:0 };
const modalHeader = { display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 };
const closeBtn = { background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888',padding:'4px 8px' };
const toolBar = { display:'flex',gap:10,alignItems:'center',marginBottom:14,flexWrap:'wrap' };
const btnPrimary = { background:'#2d5a3d',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer' };
const btnSecondary = { background:'#f0f4f0',color:'#2d5a3d',border:'1px solid #c8d0c8',borderRadius:8,padding:'8px 16px',fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer' };
const tbl = { width:'100%',borderCollapse:'collapse',fontSize:13 };
const th = { background:'#4a5c4a',color:'#fff',padding:'9px 12px',textAlign:'left',fontFamily:'Space Mono,monospace',fontSize:11,letterSpacing:'.1em',whiteSpace:'nowrap' };
const td = { padding:'4px 8px',borderBottom:'1px solid #e8ece8' };
const cellInput = { border:'1px solid #dde8dd',borderRadius:5,padding:'5px 8px',fontSize:12,width:'100%',fontFamily:'DM Sans,sans-serif',minWidth:60 };
const delBtn = { background:'#fee',border:'none',borderRadius:5,color:'#c44',cursor:'pointer',padding:'4px 8px',fontSize:12 };
