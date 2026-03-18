import React from 'react';
import { useData } from '../DataContext';
import { useLang } from '../LangContext';

// ── Language Switcher ────────────────────────────────────
export function LangSwitcher() {
  const { lang, switchLang } = useLang();
  return (
    <div style={langWrap}>
      {['ru','kz', 'en'].map(l => (
        <button key={l} onClick={() => switchLang(l)}
          style={{ ...langBtn, ...(lang === l ? langBtnActive : {}) }}>
          {l === 'ru' ? 'РУС' : l === 'kz' ? 'ҚАЗ' : 'ENG'}
        </button>
      ))}
    </div>
  );
}

// ── Navigation ────────────────────────────────────────────
export function Nav({ activePage, setPage, onSettings }) {
  const { isAdmin, logout, syncStatus, config } = useData();
  const { t } = useLang();
  const pages = ['home','energy','emissions','water','waste','environment', 'map'];
  const labelKeys = ['nav_home','nav_energy','nav_emissions','nav_water','nav_waste','nav_environment', 'nav_map'];

  return (
    <nav style={navStyle}>
      <span style={brandStyle}>@KBTUINST</span>
      <ul style={navLinks}>
        {pages.map((p, i) => (
          <li key={p}>
            <button onClick={() => setPage(p)}
              style={{ ...navBtn, ...(activePage === p ? navBtnActive : {}) }}>
              {t(labelKeys[i])}
            </button>
          </li>
        ))}
      </ul>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {config.dataSource === 'sheets' && (
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10,
            background: syncStatus.state === 'ok' ? '#e8f5e8' : syncStatus.state === 'loading' ? '#fff8e8' : syncStatus.state === 'error' ? '#fde8e8' : '#eee',
            color: syncStatus.state === 'ok' ? '#2d5a3d' : syncStatus.state === 'loading' ? '#8a6a00' : syncStatus.state === 'error' ? '#c44' : '#888',
            fontWeight: 600 }}>
            {syncStatus.state === 'loading' ? '⏳ Syncing…' : syncStatus.state === 'ok' ? `✅ Sheets ${syncStatus.ts}` : syncStatus.state === 'error' ? '❌ Sync error' : '📋 Sheets'}
          </span>
        )}
        {isAdmin && <span style={{ fontSize:11, background:'#2d5a3d', color:'#fff', borderRadius:20, padding:'3px 10px', fontWeight:700 }}>✏️ ADMIN</span>}
        <LangSwitcher />
        <button onClick={onSettings} style={{ background:'none', border:'1px solid #ddd', borderRadius:8, padding:'5px 10px', fontSize:12, cursor:'pointer', color:'#555' }}>⚙️</button>
        <span style={brandStyle}>@ESGINST</span>
      </div>
    </nav>
  );
}

// ── Admin Bar ─────────────────────────────────────────────
export function AdminBar() {
  const { isAdmin, login, logout, fetchFromSheets, config } = useData();
  const { t } = useLang();
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [showLogin, setShowLogin] = React.useState(false);

  const handleLogin = () => {
    if (login(pw)) { setErr(''); setShowLogin(false); setPw(''); }
    else setErr(t('wrong_password'));
  };

  return (
    <div style={adminBarStyle}>
      {!isAdmin ? (
        <>
          {showLogin ? (
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input type="password" placeholder={t('password_placeholder')} value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={inputStyle} />
              <button style={abBtn} onClick={handleLogin}>Login</button>
              <button style={{ ...abBtn, background:'#888' }} onClick={() => setShowLogin(false)}>{t('cancel')}</button>
              {err && <span style={{ color:'#faa', fontSize:12 }}>{err}</span>}
            </div>
          ) : (
            <button style={abBtn} onClick={() => setShowLogin(true)}>{t('admin_login')}</button>
          )}
        </>
      ) : (
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ color:'#8ef08e', fontSize:12 }}>{t('admin_logged')}</span>
          {config.dataSource === 'sheets' && (
            <button style={{ ...abBtn, background:'#1a5c3a' }} onClick={fetchFromSheets}>{t('refresh_sheets')}</button>
          )}
          <button style={{ ...abBtn, background:'#555' }} onClick={logout}>{t('logout')}</button>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────
export function KPICard({ label, value, unit, delta, deltaLabel }) {
  const isPositive = delta > 0;
  const goodDown = label.toLowerCase().includes('energy') || label.toLowerCase().includes('water') ||
    label.toLowerCase().includes('энерг') || label.toLowerCase().includes('вод') ||
    label.toLowerCase().includes('энергия') || label.toLowerCase().includes('су');
  const isGood = goodDown ? delta <= 0 : isPositive;
  return (
    <div style={kpiCard}>
      <div style={kpiLabel}>{label}</div>
      <div style={kpiValue}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={kpiUnit}>{unit}</div>
      <div style={{ ...kpiDelta, background: isGood ? 'rgba(80,200,80,.2)' : 'rgba(255,100,100,.2)', color: isGood ? '#8ef08e' : '#ffa0a0' }}>
        {isPositive ? '▲' : '▼'} {Math.abs(delta)}{deltaLabel}
      </div>
    </div>
  );
}

// ── Chart Card ────────────────────────────────────────────
export function ChartCard({ title, section, children, style = {} }) {
  const { isAdmin, setEditingTable } = useData();
  const { t } = useLang();
  return (
    <div style={{ ...chartCard, ...style }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={cardTitle}>{title}</div>
        {isAdmin && section && (
          <button onClick={() => setEditingTable(section)} style={editBtn}>{t('edit_data')}</button>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#2d5a3d', label, targetLabel }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ background:'rgba(255,255,255,.5)', borderRadius:99, height:10, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', borderRadius:99, background:color, transition:'width 1s ease' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#3d4f3d', marginTop:4 }}>
        <span>{label}</span><span>{targetLabel}</span>
      </div>
    </div>
  );
}

// ── Page Footer ───────────────────────────────────────────
export function PageFooter({ onNext, nextLabel }) {
  const { t } = useLang();
  return (
    <div style={footerStyle}>
      <div style={{ fontSize:11, color:'#999' }}>{t('our_website')}<br/><strong style={{ fontSize:12, color:'#444' }}>WWW.KBTU.KZ</strong></div>
      <button style={nextBtn} onClick={onNext}>{nextLabel || t('next_btn')}</button>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────
export function MetricCard({ label, bigValue, unit, note, children }) {
  return (
    <div style={metricCard}>
      <div style={metricLabel}>{label}</div>
      <div style={metricBig}>{typeof bigValue === 'number' ? bigValue.toLocaleString() : bigValue}</div>
      <div style={metricUnit}>{unit}</div>
      {note && <div style={metricNote}>{note}</div>}
      {children}
    </div>
  );
}

// ── Export Bar ────────────────────────────────────────────
export function ExportBar({ onCSV, onPNG }) {
  const { t } = useLang();
  return (
    <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginBottom:20 }}>
      <button style={exportBtn} onClick={onCSV}>{t('export_csv')}</button>
      <button style={exportBtn} onClick={onPNG}>{t('export_png')}</button>
      <button style={exportBtn} onClick={() => window.print()}>{t('export_pdf')}</button>
    </div>
  );
}

const navStyle = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 48px', background:'#fff', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(0,0,0,.08)' };
const brandStyle = { fontFamily:"'Space Mono',monospace", fontSize:13, color:'#4a5c4a', fontWeight:700, letterSpacing:'.05em' };
const navLinks = { display:'flex', gap:30, listStyle:'none', margin:0, padding:0 };
const navBtn = { background:'none', border:'none', fontSize:14, fontWeight:500, color:'#555', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", letterSpacing:'.02em', padding:'4px 2px', borderBottom:'2px solid transparent', transition:'all .2s' };
const navBtnActive = { color:'#2d5a3d', fontWeight:700, borderBottom:'2px solid #2d5a3d' };
const langWrap = { display:'flex', background:'#f0f4f0', borderRadius:20, padding:3, gap:2 };
const langBtn = { background:'transparent', border:'none', borderRadius:16, padding:'4px 12px', fontSize:11, fontFamily:"'Space Mono',monospace", fontWeight:700, color:'#888', cursor:'pointer', transition:'all .2s', letterSpacing:'.05em' };
const langBtnActive = { background:'#2d5a3d', color:'#fff', boxShadow:'0 2px 6px rgba(45,90,61,.35)' };
const adminBarStyle = { background:'#1a2a1a', padding:'10px 48px', display:'flex', alignItems:'center', gap:12 };
const abBtn = { background:'#2d5a3d', color:'#fff', border:'none', borderRadius:8, padding:'6px 16px', fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:'pointer' };
const inputStyle = { background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', borderRadius:7, padding:'6px 12px', color:'#fff', fontSize:13, fontFamily:"'DM Sans',sans-serif" };
const kpiCard = { padding:'28px 32px', borderRight:'1px solid rgba(255,255,255,.12)', cursor:'default' };
const kpiLabel = { fontSize:11, letterSpacing:'.15em', textTransform:'uppercase', opacity:.7, marginBottom:8, color:'#fff' };
const kpiValue = { fontFamily:"'Bebas Neue',sans-serif", fontSize:48, lineHeight:1, color:'#fff' };
const kpiUnit  = { fontSize:13, opacity:.6, marginTop:4, color:'#fff' };
const kpiDelta = { display:'inline-flex', alignItems:'center', gap:4, fontSize:12, marginTop:6, padding:'2px 8px', borderRadius:20, fontWeight:600 };
const chartCard = { background:'#c8d0c8', borderRadius:16, padding:28, color:'#1a2a1a', transition:'transform .2s, box-shadow .2s' };
const cardTitle = { fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'.15em', textTransform:'uppercase', color:'#3d4f3d', fontWeight:700 };
const editBtn   = { background:'rgba(45,90,61,.15)', border:'1px solid rgba(45,90,61,.3)', borderRadius:7, padding:'4px 10px', fontSize:11, color:'#2d5a3d', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 };
const footerStyle = { background:'#fff', padding:'24px 48px', display:'flex', alignItems:'center', justifyContent:'space-between' };
const nextBtn = { background:'#2d5a3d', color:'#fff', border:'none', padding:'14px 38px', fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:'.12em', borderRadius:50, cursor:'pointer' };
const metricCard = { background:'#c8d0c8', borderRadius:16, padding:'28px 32px', color:'#1a2a1a' };
const metricLabel = { fontSize:12, letterSpacing:'.12em', textTransform:'uppercase', color:'#fff', background:'#2d5a3d', display:'inline-block', padding:'4px 12px', borderRadius:20, marginBottom:16 };
const metricBig = { fontFamily:"'Bebas Neue',sans-serif", fontSize:56, color:'#2d5a3d', lineHeight:1 };
const metricUnit = { fontSize:13, color:'#3d4f3d', marginTop:6 };
const metricNote = { fontSize:11, color:'#3d4f3d', marginTop:8, opacity:.7 };
const exportBtn  = { background:'rgba(255,255,255,.2)', color:'#fff', border:'1px solid rgba(255,255,255,.3)', borderRadius:8, padding:'7px 16px', fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:'pointer' };
