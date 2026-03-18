import React, { useState } from 'react';
import { useData } from '../DataContext';
import { useLang } from '../LangContext';

export default function CardEditModal({ title, fields, initialData, onSave, onClose }) {
  const { t } = useLang();
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(initialData)));
  const [saving, setSaving] = useState(false);

  const set = (key, val, type) =>
    setForm(prev => ({ ...prev, [key]: type === 'number' ? (val === '' ? '' : Number(val)) : val }));

  const save = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <span style={titleStyle}>{title}</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={fieldsGrid}>
          {fields.map(({ key, label, type = 'text' }) => (
            <div key={key} style={fieldGroup}>
              <label style={fieldLabel}>{label}</label>
              <input
                type={type === 'number' ? 'number' : 'text'}
                style={inp}
                value={form[key] ?? ''}
                onChange={e => set(key, e.target.value, type)}
              />
            </div>
          ))}
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:20 }}>
          <button style={btnSecondary} onClick={onClose}>{t('cancel')}</button>
          <button style={btnPrimary} onClick={save} disabled={saving}>
            {saving ? t('saving') : t('save_changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay    = { position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
const modal      = { background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.25)' };
const header     = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 };
const titleStyle = { fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:'.06em', color:'#1a2a1a' };
const closeBtn   = { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888', padding:'4px 8px' };
const fieldsGrid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 };
const fieldGroup = { display:'flex', flexDirection:'column', gap:5 };
const fieldLabel = { fontSize:12, fontWeight:600, color:'#3d4f3d' };
const inp        = { border:'1px solid #c8d0c8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:"'DM Sans',sans-serif", color:'#1a2a1a' };
const btnPrimary = { background:'#2d5a3d', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' };
const btnSecondary={ background:'#f0f4f0', color:'#2d5a3d', border:'1px solid #c8d0c8', borderRadius:8, padding:'9px 18px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' };