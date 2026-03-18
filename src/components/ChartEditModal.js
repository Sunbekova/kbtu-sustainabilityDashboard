import React, { useState } from 'react';
import { useData } from '../DataContext';
import { useLang } from '../LangContext';

export default function ChartEditModal({
  title, rows: initialRows, columns, onSave, onClose,
  addable = true, removable = true, summary = []
}) {
  const { t } = useLang();
  const [rows, setRows] = useState(() => JSON.parse(JSON.stringify(initialRows)));
  const [saving, setSaving] = useState(false);

  const setCell = (ri, key, val, type) => {
    setRows(prev => prev.map((r, i) =>
      i === ri ? { ...r, [key]: type === 'number' ? (val === '' ? '' : Number(val)) : val } : r
    ));
  };

  const addRow = () => {
    const blank = {};
    columns.filter(c => !c.readOnly && !c.computed).forEach(c => {
      blank[c.key] = c.type === 'number' ? 0 : '';
    });
    setRows(prev => [...prev, blank]);
  };

  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    await onSave(rows);
    setSaving(false);
    onClose();
  };

  const editableCols = columns.filter(c => !c.computed);
  const totalWidth = Math.min(columns.length * 160 + 60, 900);

  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: totalWidth }}>
        <div style={header}>
          <span style={titleStyle}>{title}</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ overflowX:'auto', marginBottom:16 }}>
          <table style={tbl}>
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={c.key} style={th}>
                    {c.label}
                    {c.computed && <span style={{ fontSize:9, opacity:.7, marginLeft:4 }}>auto</span>}
                  </th>
                ))}
                {removable && <th style={th}>–</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? '#f5f8f5' : '#fff' }}>
                  {columns.map(c => {
                    if (c.computed) {
                      const val = c.computed(row, rows);
                      return (
                        <td key={c.key} style={{ ...td, background:'#eef3ee', color:'#5a8a6a', fontWeight:600, textAlign:'right' }}>
                          {typeof val === 'number' ? val.toFixed(c.decimals ?? 1) : val}
                        </td>
                      );
                    }
                    if (c.readOnly) {
                      return <td key={c.key} style={{ ...td, color:'#888' }}>{row[c.key]}</td>;
                    }
                    return (
                      <td key={c.key} style={td}>
                        <input
                          type={c.type === 'number' ? 'number' : 'text'}
                          value={row[c.key] ?? ''}
                          onChange={e => setCell(ri, c.key, e.target.value, c.type)}
                          style={cellInput}
                        />
                      </td>
                    );
                  })}
                  {removable && (
                    <td style={td}>
                      <button onClick={() => removeRow(ri)} style={delBtn}>✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary row */}
        {summary.length > 0 && (
          <div style={summaryRow}>
            {summary.map(s => (
              <div key={s.label} style={summaryItem}>
                <span style={summaryLabel}>{s.label}</span>
                <span style={summaryValue}>{s.compute(rows)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16 }}>
          {addable
            ? <button style={btnSecondary} onClick={addRow}>+ {t('add_row')}</button>
            : <span />
          }
          <div style={{ display:'flex', gap:10 }}>
            <button style={btnSecondary} onClick={onClose}>{t('cancel')}</button>
            <button style={btnPrimary} onClick={save} disabled={saving}>
              {saving ? t('saving') : t('save_changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay     = { position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
const modal       = { background:'#fff', borderRadius:16, padding:28, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.25)' };
const header      = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 };
const titleStyle  = { fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:'.06em', color:'#1a2a1a' };
const closeBtn    = { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888', padding:'4px 8px' };
const tbl         = { width:'100%', borderCollapse:'collapse', fontSize:13 };
const th          = { background:'#4a5c4a', color:'#fff', padding:'9px 12px', textAlign:'left', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'.1em', whiteSpace:'nowrap' };
const td          = { padding:'5px 8px', borderBottom:'1px solid #e8ece8' };
const cellInput   = { border:'1px solid #dde8dd', borderRadius:5, padding:'5px 8px', fontSize:12, width:'100%', fontFamily:"'DM Sans',sans-serif", minWidth:80 };
const delBtn      = { background:'#fee', border:'none', borderRadius:5, color:'#c44', cursor:'pointer', padding:'3px 8px', fontSize:12 };
const summaryRow  = { display:'flex', gap:16, flexWrap:'wrap', background:'#f0f6f0', borderRadius:10, padding:'12px 16px', marginBottom:8 };
const summaryItem = { display:'flex', flexDirection:'column', gap:2 };
const summaryLabel= { fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'#5a8a6a', fontFamily:"'Space Mono',monospace" };
const summaryValue= { fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#2d5a3d', lineHeight:1 };
const btnPrimary  = { background:'#2d5a3d', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' };
const btnSecondary= { background:'#f0f4f0', color:'#2d5a3d', border:'1px solid #c8d0c8', borderRadius:8, padding:'9px 18px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' };