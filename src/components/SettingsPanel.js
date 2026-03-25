import React, { useState } from 'react';
import { useData } from '../DataContext';

export default function SettingsPanel({ onClose }) {
  const { isAdmin } = useData();
  const { config, updateConfig, fetchFromSheets, syncStatus, resetToDefaults } = useData();
  const [form, setForm] = useState({ ...config });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    updateConfig(form);
    onClose();
  };

  const testConnection = async () => {
    if (!form.sheetsApiUrl) { setTestResult('❌ Enter the Apps Script URL first'); return; }
    setTesting(true); setTestResult('');
    try {
      const res = await fetch(`${form.sheetsApiUrl}?action=getData&t=${Date.now()}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const keys = Object.keys(json).filter(k => k !== '_timestamp');
      setTestResult(`✅ Connected! Found sections: ${keys.join(', ')}`);
    } catch(err) {
      setTestResult(`❌ Failed: ${err.message}`);
    }
    setTesting(false);
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <span style={title}>⚙️ Dashboard Settings</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Data Source */}
        <section style={section}>
          <div style={sectionTitle}>📊 Data Source</div>
          <div style={{ display:'flex', gap:12 }}>
            {['local','sheets'].map(src => (
              <label key={src} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, color:'#3d4f3d' }}>
                <input type="radio" name="dataSource" value={src}
                  checked={form.dataSource === src}
                  onChange={() => set('dataSource', src)} />
                {src === 'local' ? '💾 Local Storage (offline)' : '📋 Google Sheets (live)'}
              </label>
            ))}
          </div>
        </section>

        {/* Google Sheets Config */}
        <section style={section}>
          <div style={sectionTitle}>🔗 Google Sheets Integration</div>
          <div style={fieldGroup}>
            <label style={label}>Apps Script Web App URL</label>
            <input
              style={input}
              value={form.sheetsApiUrl}
              onChange={e => set('sheetsApiUrl', e.target.value)}
              placeholder="https://script.google.com/macros/s/YOUR_ID/exec"
            />
            <div style={hint}>
              Get this URL from: Google Sheet → Extensions → Apps Script → Deploy → New deployment → Web App
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <button style={btnPrimary} onClick={testConnection} disabled={testing}>
              {testing ? '⏳ Testing…' : '🔌 Test Connection'}
            </button>
            {form.dataSource === 'sheets' && (
              <button style={btnSecondary} onClick={() => { updateConfig(form); fetchFromSheets(); }}>
                🔄 Sync Now
              </button>
            )}
            {syncStatus.ts && (
              <span style={{ fontSize:12, color:'#5a8a6a' }}>Last sync: {syncStatus.ts}</span>
            )}
          </div>
          {testResult && (
            <div style={{ marginTop:10, fontSize:13, padding:'8px 12px', borderRadius:8,
              background: testResult.startsWith('✅') ? '#e8f5e8' : '#fde8e8',
              color: testResult.startsWith('✅') ? '#2d5a3d' : '#c44' }}>
              {testResult}
            </div>
          )}
          {syncStatus.state === 'error' && (
            <div style={{ marginTop:8, fontSize:12, color:'#c44', padding:'6px 10px', background:'#fde8e8', borderRadius:6 }}>
              {syncStatus.msg}
            </div>
          )}
        </section>

        {/* Auto-refresh */}
        <section style={section}>
          <div style={sectionTitle}>⏱ Auto-Refresh</div>
          <div style={fieldGroup}>
            <label style={label}>Refresh interval (minutes, 0 = disabled)</label>
            <input type="number" min={0} max={1440} style={{ ...input, width:120 }}
              value={form.autoRefreshMin}
              onChange={e => set('autoRefreshMin', Number(e.target.value))} />
          </div>
        </section>

        {/* Security */}
        {isAdmin && (
          <section style={section}>
            <div style={sectionTitle}>🔒 Security</div>
            <div style={fieldGroup}>
              <label style={label}>Admin Password</label>
              <input type="password" style={input} value={form.adminPassword}
                onChange={e => set('adminPassword', e.target.value)} />
              <div style={hint}>Used for admin login in the dashboard AND in the Apps Script (must match).</div>
            </div>
          </section>
        )}
        {/* Setup Guide */}
        <section style={{ ...section, background:'#f0f6f0', borderRadius:10, padding:16 }}>
          <div style={{ ...sectionTitle, marginBottom:8 }}>📖 Quick Setup Guide</div>
          <ol style={{ paddingLeft:20, fontSize:13, color:'#3d4f3d', lineHeight:1.8 }}>
            <li>Open your Google Sheet → <strong>Extensions → Apps Script</strong></li>
            <li>Paste the contents of <code style={code}>google-apps-script/Code.gs</code></li>
            <li>Click the menu <strong>🌿 KBTU Dashboard → Setup all sheets</strong> to create all tabs with sample data</li>
            <li><strong>Deploy → New deployment → Web App</strong><br/>
                Execute as: <em>Me</em> | Access: <em>Anyone</em></li>
            <li>Copy the Web App URL and paste it above</li>
            <li>Click <strong>Test Connection</strong>, then <strong>Sync Now</strong></li>
          </ol>
        </section>

        {/* Danger zone */}
        {isAdmin && (
          <section style={{ ...section, borderTop:'2px solid #fde8e8', paddingTop:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#c44', marginBottom:10, textTransform:'uppercase', letterSpacing:'.1em' }}>⚠️ Danger Zone</div>
            <button style={{ ...btnSecondary, borderColor:'#c44', color:'#c44' }}
              onClick={() => { if (window.confirm('Reset all data to factory defaults?')) { resetToDefaults(); onClose(); } }}>
              🔄 Reset all data to defaults
            </button>
          </section>
        )}

        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={save}>💾 Save Settings</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
const modal   = { background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.25)', display:'flex', flexDirection:'column', gap:0 };
const header  = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 };
const title   = { fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:'.06em', color:'#1a2a1a' };
const closeBtn = { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888', padding:'4px 8px' };
const section  = { marginBottom:22, paddingBottom:22, borderBottom:'1px solid #eee' };
const sectionTitle = { fontFamily:"'Space Mono',monospace", fontSize:12, fontWeight:700, letterSpacing:'.1em', color:'#4a5c4a', textTransform:'uppercase', marginBottom:12 };
const fieldGroup = { display:'flex', flexDirection:'column', gap:6, marginBottom:12 };
const label  = { fontSize:13, fontWeight:600, color:'#3d4f3d' };
const input  = { border:'1px solid #c8d0c8', borderRadius:8, padding:'8px 12px', fontSize:13, fontFamily:"'DM Sans',sans-serif", color:'#1a2a1a', width:'100%' };
const hint   = { fontSize:11, color:'#888', lineHeight:1.4 };
const code   = { background:'#f0f4f0', padding:'1px 5px', borderRadius:4, fontSize:11 };
const btnPrimary   = { background:'#2d5a3d', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' };
const btnSecondary = { background:'#f0f4f0', color:'#2d5a3d', border:'1px solid #c8d0c8', borderRadius:8, padding:'9px 18px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' };
