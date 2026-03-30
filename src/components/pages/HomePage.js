import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../../DataContext';
import { KPICard, ChartCard, PageFooter, ExportBar } from '../UI';
import { exportPageCSV, exportPageExcel, exportDashboardPDF } from '../../importUtils';
import { useLang } from '../../LangContext';
import { Tooltip } from '../Tooltip';
import KPIEditModal from '../KPIEditModal';
import ChartEditModal from '../ChartEditModal';
import fon from '../../data/fon.png';

Chart.register(...registerables);

export default function HomePage({ setPage }) {
  const { data, isAdmin, importTable, pushToSheets, config } = useData();
  const { t } = useLang();
  const donutRef = useRef(), trendRef = useRef();
  const donutChart = useRef(), trendChart = useRef();
  const [showKPIEdit, setShowKPIEdit] = useState(false);
  const [chartModal, setChartModal] = useState(null);

  const buildCharts = () => {
    donutChart.current?.destroy();
    trendChart.current?.destroy();

    const cats = data.impactCategories || [
      { label: t('energy'),          value: 41, color: '#2d5a3d' },
      { label: t('water'),           value: 24, color: '#5a8a6a' },
      { label: t('waste'),           value: 19, color: '#8ab890' },
      { label: t('greenInitiatives'),value: 16, color: '#b8d4bc' },
    ];

    donutChart.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.label),
        datasets: [{ data: cats.map(c => c.value), backgroundColor: cats.map(c => c.color), borderWidth:0, hoverOffset:8 }]
      },
      options: { plugins:{ legend:{ display:false } }, cutout:'65%', animation:{ duration:800 } }
    });

    trendChart.current = new Chart(trendRef.current, {
      type: 'line',
      data: {
        labels: data.esgTrend.map(r => r.year),
        datasets: [{ label:'ESG', data: data.esgTrend.map(r => r.score), borderColor:'#2d5a3d', backgroundColor:'rgba(45,90,61,.15)', fill:true, tension:.4, pointRadius:5, pointBackgroundColor:'#2d5a3d' }]
      },
      options: { plugins:{ legend:{ display:false } }, scales:{ y:{ min:40, max:100, grid:{ color:'rgba(0,0,0,.08)' } }, x:{ grid:{ color:'rgba(0,0,0,.08)' } } }, animation:{ duration:800 } }
    });
  };

  useEffect(() => {
    buildCharts();
    return () => { donutChart.current?.destroy(); trendChart.current?.destroy(); };
  }, [data.esgTrend, data.impactCategories, t]);

  const openDonutEdit = () => {
    const cats = data.impactCategories || [
      { label: t('energy'),           value: 41, color: '#2d5a3d' },
      { label: t('water'),            value: 24, color: '#5a8a6a' },
      { label: t('waste'),            value: 19, color: '#8ab890' },
      { label: t('greenInitiatives'), value: 16, color: '#b8d4bc' },
    ];
    const totalNow = cats.reduce((s, c) => s + Number(c.value), 0);
    setChartModal({
      title: t('impactBreakdown'),
      rows: cats,
      columns: [
        { key:'label', label: 'Category' },
        { key:'value', label: '%', type:'number' },
        { key:'color', label: 'Color' },
        {
          key: '_pct',
          label: '% of total',
          computed: (row, rows) => {
            const total = rows.reduce((s, r) => s + Number(r.value || 0), 0);
            return total > 0 ? ((Number(row.value) / total) * 100).toFixed(1) + '%' : '0%';
          }
        },
      ],
      summary: [
        { label: 'Total', compute: rows => rows.reduce((s, r) => s + Number(r.value || 0), 0) },
        { label: 'Categories', compute: rows => rows.length },
      ],
      onSave: async (updated) => {
        importTable('impactCategories', updated);
        if (config.dataSource === 'sheets') await pushToSheets('ImpactCategories', updated);
      }
    });
  };

  const openEsgTrendEdit = () => {
    setChartModal({
      title: t('esgTrend'),
      rows: data.esgTrend,
      columns: [
        { key:'year',  label:'Year',  type:'number' },
        { key:'score', label:'Score', type:'number' },
      ],
      summary: [
        { label: 'Latest',  compute: rows => rows.length ? rows[rows.length-1].score : '-' },
        { label: 'Change',  compute: rows => {
          if (rows.length < 2) return '-';
          const diff = Number(rows[rows.length-1].score) - Number(rows[rows.length-2].score);
          return (diff > 0 ? '+' : '') + diff;
        }},
        { label: 'Years',   compute: rows => rows.length },
      ],
      onSave: async (updated) => {
        importTable('esgTrend', updated);
        if (config.dataSource === 'sheets') await pushToSheets('EsgTrend', updated);
      }
    });
  };

  const { kpi } = data;
  const cats = data.impactCategories || [
    { label: t('energy'), value: 41, color: '#2d5a3d' },
    { label: t('water'),  value: 24, color: '#5a8a6a' },
    { label: t('waste'),  value: 19, color: '#8ab890' },
    { label: t('greenInitiatives'), value: 16, color: '#b8d4bc' },
  ];

  const equivs = [
    { icon:'🌳', val:'14,200', label: t('treesLabel') },
    { icon:'🏊', val:'73',     label: t('poolsLabel') },
    { icon:'♻️', val:'420 t', label: t('wasteLabel') },
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{ position:'relative', height:400, overflow:'hidden' }}>
        <img src={fon} alt="Green campus" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(.85)' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(72px,10vw,130px)', lineHeight:.92, textAlign:'center', color:'#fff', textShadow:'0 4px 30px rgba(0,0,0,.3)' }}>
            {t('sustainable')}<br/>{t('campus')}
          </div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:18, letterSpacing:'.25em', color:'#fff', marginTop:16, fontWeight:700 }}>KBTU</div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ position:'relative' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'#4a5c4a' }}>
          <Tooltip text={t('tooltip_esg')}>
            <KPICard label={t('esgScore')} value={kpi.esgScore.value} unit={kpi.esgScore.unit} delta={kpi.esgScore.delta} deltaLabel={` ${kpi.esgScore.deltaLabel}`} />
          </Tooltip>
          <Tooltip text={t('tooltip_energy')}>
            <KPICard label={t('energyConsumption')} value={kpi.energy.value} unit={kpi.energy.unit} delta={kpi.energy.delta} deltaLabel={` ${kpi.energy.deltaLabel}`} />
          </Tooltip>
          <Tooltip text={t('tooltip_water')}>
            <KPICard label={t('waterUsage')} value={kpi.water.value} unit={kpi.water.unit} delta={kpi.water.delta} deltaLabel={` ${kpi.water.deltaLabel}`} />
          </Tooltip>
          <Tooltip text={t('tooltip_waste')}>
            <KPICard label={t('wasteDiverted')} value={`${kpi.wasteDiv.value}%`} unit={kpi.wasteDiv.unit} delta={kpi.wasteDiv.delta} deltaLabel={` ${kpi.wasteDiv.deltaLabel}`} />
          </Tooltip>
        </div>
        {isAdmin && (
          <button onClick={() => setShowKPIEdit(true)} style={kpiEditBtn}>{t('edit_data')}</button>
        )}
      </div>

      {/* Content */}
      <div style={section}>
      <ExportBar
        page="home"
        onCSV={() => exportPageCSV('home', data, t)}
        onExcel={() => exportPageExcel('home', data, t)}

        // single page PDF
        onPDF={() => window.print()}

        // ALL pages PDF
        onPDFAll={async () => {
          const btn = document.activeElement;
          btn?.blur();
          await exportDashboardPDF(setPage);
        }}
      />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

          {/* Donut chart */}
          <ChartCard title={t('impactBreakdown')} section={null}>
            {isAdmin && (
              <button style={chartEditBtn} onClick={openDonutEdit}>{t('edit_data')}</button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <div style={{ flex:1, maxWidth:200 }}><canvas ref={donutRef} /></div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                {cats.map(c => {
                  const total = cats.reduce((s, x) => s + Number(x.value), 0);
                  const pct = total > 0 ? ((Number(c.value)/total)*100).toFixed(0) : 0;
                  return (
                    <div key={c.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:14, height:14, borderRadius:3, background:c.color, display:'inline-block', flexShrink:0 }} />
                      <span style={{ fontSize:13, color:'#3d4f3d' }}>{c.label} — {pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ChartCard>

          {/* ESG Trend */}
          <ChartCard title={t('esgTrend')} section={null}>
            {isAdmin && (
              <button style={chartEditBtn} onClick={openEsgTrendEdit}>{t('edit_data')}</button>
            )}
            <canvas ref={trendRef} style={{ maxHeight:220 }} />
          </ChartCard>
        </div>

        {/* Equivalences */}
        <div style={{ color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'.15em', textTransform:'uppercase', marginBottom:10 }}>
          {t('impactEquivalences')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {equivs.map(e => (
            <div key={e.val} style={{ background:'#2d5a3d', borderRadius:14, padding:22, color:'#fff', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:32 }}>{e.icon}</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, lineHeight:1 }}>{e.val}</div>
              <div style={{ fontSize:12, opacity:.8, whiteSpace:'pre-line' }}>{e.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:'#fff', padding:'28px 48px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:11, color:'#888' }}>{t('ourWebsite')}<br/><strong style={{ color:'#1a2a1a', fontSize:13 }}>WWW.KBTU.KZ</strong></div>
        <button style={startBtn} onClick={() => setPage('energy')}>{t('start')} →</button>
      </div>

      {showKPIEdit && <KPIEditModal onClose={() => setShowKPIEdit(false)} />}
      {chartModal  && <ChartEditModal {...chartModal} onClose={() => setChartModal(null)} />}
    </div>
  );
}

const section     = { padding:48, background:'#7d8f7d' };
const startBtn    = { background:'#2d5a3d', color:'#fff', border:'3px solid #2d5a3d', padding:'16px 40px', fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:'.1em', borderRadius:50, cursor:'pointer' };
const kpiEditBtn  = { position:'absolute', top:8, right:12, background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.3)', borderRadius:8, padding:'4px 12px', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 };
const chartEditBtn= { float:'right', background:'rgba(45,90,61,.12)', border:'1px solid rgba(45,90,61,.25)', borderRadius:6, padding:'3px 10px', fontSize:11, color:'#2d5a3d', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginBottom:8 };