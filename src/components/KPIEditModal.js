import React, { useState } from 'react';
import { useData } from '../DataContext';
import { useLang } from '../LangContext';

export default function KPIEditModal({ onClose }) {
  const { data, importTable, config, pushToSheets } = useData();
  const { t } = useLang();
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(data.kpi)));
  const [saving, setSaving] = useState(false);

  const set = (key, field, val) =>
    setForm(prev => ({ ...prev, [key]: { ...prev[key], [field]: field === 'delta' || field === 'value' ? Number(val) : val } }));

  const save = async () => {
    setSaving(true);
    importTable('kpi', form);
    if (config.dataSource === 'sheets') await pushToSheets('KPI', form);
    setSaving(false);
    onClose();
  };

  const kpiDefs = [
    { key: 'esgScore',  label: t('esgScore') },
    { key: 'energy',    label: t('energyConsumption') },
    { key: 'water',     label: t('waterUsage') },
    { key: 'wasteDiv',  label: t('wasteDiverted') },
  ];

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <span style={title}>{t('edit_kpi_title')}</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {kpiDefs.map(({ key, label }) => (
          <div key={key} style={cardBlock}>
            <div style={cardLabel}>{label}</div>
            <div style={row}>
              <div style={fieldGroup}>
                <label style={fieldLabel}>{t('kpi_value')}</label>
                <input style={inp} type="number"
                  value={form[key].value}
                  onChange={e => set(key, 'value', e.target.value)} />
              </div>
              <div style={fieldGroup}>
                <label style={fieldLabel}>{t('kpi_unit')}</label>
                <input style={inp}
                  value={form[key].unit}
                  onChange={e => set(key, 'unit', e.target.value)} />
              </div>
              <div style={fieldGroup}>
                <label style={fieldLabel}>{t('kpi_delta')}</label>
                <input style={inp} type="number"
                  value={form[key].delta}
                  onChange={e => set(key, 'delta', e.target.value)} />
              </div>
              <div style={fieldGroup}>
                <label style={fieldLabel}>{t('kpi_delta_label')}</label>
                <input style={inp}
                  value={form[key].deltaLabel}
                  onChange={e => set(key, 'deltaLabel', e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:16 }}>
          <button style={btnSecondary} onClick={onClose}>{t('cancel')}</button>
          <button style={btnPrimary} onClick={save} disabled={saving}>
            {saving ? t('saving') : t('save_changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay     = { position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
const modal       = { background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.25)' };
const header      = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 };
const title       = { fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:'.06em', color:'#1a2a1a' };
const closeBtn    = { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888', padding:'4px 8px' };
const cardBlock   = { background:'#f5f8f5', borderRadius:10, padding:16, marginBottom:14 };
const cardLabel   = { fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#4a5c4a', marginBottom:10 };
const row         = { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 };
const fieldGroup  = { display:'flex', flexDirection:'column', gap:5 };
const fieldLabel  = { fontSize:12, fontWeight:600, color:'#3d4f3d' };
const inp         = { border:'1px solid #c8d0c8', borderRadius:8, padding:'7px 10px', fontSize:13, fontFamily:"'DM Sans',sans-serif" };
const btnPrimary  = { background:'#2d5a3d', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' };
const btnSecondary= { background:'#f0f4f0', color:'#2d5a3d', border:'1px solid #c8d0c8', borderRadius:8, padding:'9px 18px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' };