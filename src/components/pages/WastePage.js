import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../../DataContext';
import { ChartCard, PageFooter } from '../UI';
import { useLang } from '../../LangContext';
import { Tooltip } from '../Tooltip';
import CardEditModal from '../CardEditModal';
import ChartEditModal from '../ChartEditModal';

Chart.register(...registerables);

function SmallCard({ title, value, unit, sub, onEdit, isAdmin }) {
  return (
    <div style={{ background:'#c8d0c8', borderRadius:16, padding:'24px 28px', color:'#1a2a1a', cursor:'default', position:'relative' }}>
      {isAdmin && <button onClick={onEdit} style={editBtnStyle}>✏️</button>}
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'.15em', textTransform:'uppercase', color:'#3d4f3d', marginBottom:12, fontWeight:700 }}>{title}</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:46, color:'#2d5a3d', lineHeight:1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize:12, color:'#3d4f3d', marginTop:4 }}>{unit}</div>
      {sub && <div style={{ fontSize:11, color:'#3d4f3d', marginTop:6, opacity:.75 }}>{sub}</div>}
    </div>
  );
}

export default function WastePage({ setPage }) {
  const { data, isAdmin, importTable, pushToSheets, config } = useData();
  const { t } = useLang();
  const trendRef = useRef();
  const trendChart = useRef();
  const { waste, wasteTrend } = data;

  const [editModal, setEditModal] = useState(null);
  const [chartModal, setChartModal] = useState(null);

  const openWasteEdit = (cardKey) => {
    const defs = {
      total: {
        title: t('total_waste'),
        fields: [
          { key: 'total',        label: t('total_waste'),    type: 'number' },
          { key: 'diversionRate',label: t('recycling_rate'), type: 'number' },
        ],
        initialData: { total: waste.total, diversionRate: waste.diversionRate },
      },
      composted: {
        title: t('composted'),
        fields: [
          { key: 'composted', label: `${t('composted')} %`, type: 'number' },
        ],
        initialData: { composted: waste.composted },
      },
      hazardous: {
        title: t('hazardous'),
        fields: [
          { key: 'hazardous', label: `${t('hazardous')} (t)`, type: 'number' },
        ],
        initialData: { hazardous: waste.hazardous },
      },
    };
    const def = defs[cardKey];
    setEditModal({
      ...def,
      onSave: async (updated) => {
        const next = { ...waste, ...updated };
        importTable('waste', next);
        if (config.dataSource === 'sheets') await pushToSheets('WasteMeta', next);
      }
    });
  };

  const openWasteTypeEdit = () => {
    setChartModal({
      title: t('waste_by_type'),
      rows: waste.byType,
      columns: [
        { key: 'type',   label: 'Type' },
        { key: 'tonnes', label: 'Tonnes', type: 'number' },
        { key: 'color',  label: 'Color (hex)' },
        {
          key: '_pct',
          label: '% of total',
          computed: (row, rows) => {
            const total = rows.reduce((s, r) => s + Number(r.tonnes || 0), 0);
            return total > 0 ? ((Number(row.tonnes) / total) * 100).toFixed(1) + '%' : '0%';
          }
        },
      ],
      summary: [
        { label: 'Total tonnes', compute: rows => rows.reduce((s,r) => s + Number(r.tonnes||0), 0).toLocaleString() },
        { label: 'Types',        compute: rows => rows.length },
      ],
      onSave: async (updated) => {
        // auto-recalculate waste.total
        const totalTonnes = updated.reduce((s, r) => s + Number(r.tonnes || 0), 0);
        const nextWaste = { ...waste, byType: updated, total: totalTonnes };
        importTable('waste', nextWaste);
        if (config.dataSource === 'sheets') await pushToSheets('WasteByType', updated);
      }
    });
  };
  
  const openWasteTrendEdit = () => {
    setChartModal({
      title: t('waste_trend'),
      rows: wasteTrend,
      columns: [
        { key: 'year',   label: 'Year',          type: 'number' },
        { key: 'actual', label: 'Actual %',       type: 'number' },
        { key: 'target', label: 'Target %',       type: 'number' },
        {
          key: '_gap',
          label: 'Gap to target',
          computed: (row) => {
            const gap = Number(row.target || 0) - Number(row.actual || 0);
            return (gap > 0 ? '+' : '') + gap.toFixed(1) + '%';
          }
        },
      ],
      summary: [
        { label: 'Latest actual',  compute: rows => rows.length ? rows[rows.length-1].actual + '%' : '-' },
        { label: 'Latest target',  compute: rows => rows.length ? rows[rows.length-1].target + '%' : '-' },
        { label: 'Gap',            compute: rows => {
          if (!rows.length) return '-';
          const last = rows[rows.length-1];
          const gap = Number(last.target) - Number(last.actual);
          return (gap > 0 ? '+' : '') + gap.toFixed(1) + '%';
        }},
      ],
      onSave: async (updated) => {
        importTable('wasteTrend', updated);
        if (config.dataSource === 'sheets') await pushToSheets('WasteTrend', updated);
      }
    });
  };

  useEffect(() => {
    trendChart.current?.destroy();
    trendChart.current = new Chart(trendRef.current, {
      type: 'line',
      data: { labels: wasteTrend.map(r => r.year), datasets: [
        { label: t('diversion_rate_lbl'), data: wasteTrend.map(r => r.actual), borderColor:'#2d5a3d', backgroundColor:'rgba(45,90,61,.1)', fill:true, tension:.4, pointRadius:5 },
        { label: t('target_2028'), data: wasteTrend.map(r => r.target), borderColor:'#8ab890', borderDash:[6,4], fill:false, tension:.4, pointRadius:3 }
      ]},
      options: { plugins:{ legend:{ labels:{ font:{ family:'DM Sans' } } } }, scales:{ y:{ min:30, max:100, grid:{ color:'rgba(0,0,0,.06)' }, ticks:{ callback:v=>v+'%' } }, x:{ grid:{ color:'rgba(0,0,0,.06)' } } } }
    });
    return () => trendChart.current?.destroy();
  }, [wasteTrend, t]);

  const maxWaste = Math.max(...waste.byType.map(w => w.tonnes));
  const organicTonnes = waste.byType.find(w => w.type.toLowerCase().includes('organic'))?.tonnes || 0;

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_waste_title')}</div>
        <div style={pageSub}>{t('page_waste_sub')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          <Tooltip text={t('tooltip_total_waste')}>
            <SmallCard title={t('total_waste')} value={waste.total} unit={t('t_per_year')} sub={t('waste_down')} isAdmin={isAdmin} onEdit={() => openWasteEdit('total')} />
          </Tooltip>
          <Tooltip text={t('tooltip_diversion')}>
            <SmallCard title={t('recycling_rate')} value={`${waste.diversionRate}%`} unit={t('diversion_rate_lbl')} sub={t('target_2028')} isAdmin={isAdmin} onEdit={() => openWasteEdit('total')} />
          </Tooltip>
          <Tooltip text={t('tooltip_composted')}>
            <SmallCard title={t('composted')} value={`${waste.composted}%`} unit={t('pct_of_total')} sub={t('organic_tonnes', { v: organicTonnes })} isAdmin={isAdmin} onEdit={() => openWasteEdit('composted')} />
          </Tooltip>
          <Tooltip text={t('tooltip_hazardous')}>
            <SmallCard title={t('hazardous')} value={waste.hazardous} unit={t('t_per_year')} sub={t('hazardous_disposed')} isAdmin={isAdmin} onEdit={() => openWasteEdit('hazardous')} />
          </Tooltip>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ChartCard title={t('waste_by_type')} section={null}>
          {isAdmin && <button style={chartEditBtn} onClick={openWasteTypeEdit}>{t('edit_data')}</button>}
            {waste.byType.map(w => (
              <div key={w.type} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#3d4f3d', marginBottom:4, fontWeight:500 }}>
                  <span>{w.type}</span><span>{w.tonnes} t</span>
                </div>
                <div style={{ background:'rgba(255,255,255,.5)', borderRadius:99, height:10, overflow:'hidden' }}>
                  <div style={{ width:`${(w.tonnes/maxWaste)*100}%`, height:'100%', borderRadius:99, background:w.color||'#2d5a3d', transition:'width 1s' }} />
                </div>
              </div>
            ))}
          </ChartCard>
          <ChartCard title={t('waste_trend')} section={null}>
            {isAdmin && <button style={chartEditBtn} onClick={openWasteTrendEdit}>{t('edit_data')}</button>}
            <canvas ref={trendRef} style={{ maxHeight:220 }} />
            <div style={{ marginTop:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13, color:'#3d4f3d', fontWeight:600 }}>
                <span>{t('zero_waste_goal')}</span>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#2d5a3d' }}>{waste.diversionRate}%</span>
              </div>
              <div style={{ background:'rgba(255,255,255,.5)', borderRadius:99, height:10, overflow:'hidden' }}>
                <div style={{ width:`${waste.diversionRate}%`, height:'100%', borderRadius:99, background:'#2d5a3d', transition:'width 1s' }} />
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
      <PageFooter onNext={() => setPage('environment')} />
      {editModal && <CardEditModal {...editModal} onClose={() => setEditModal(null)} />}
      {chartModal && <ChartEditModal {...chartModal} onClose={() => setChartModal(null)} />}
    </div>
  );
}

const section      = { padding:48, background:'#7d8f7d', position:'relative', zIndex:2 };
const pageTitle    = { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:'.05em', color:'#fff', marginBottom:6 };
const pageSub      = { fontSize:13, opacity:.65, marginBottom:32, color:'#fff' };
const editBtnStyle = { position:'absolute', top:10, right:10, background:'rgba(45,90,61,.15)', border:'1px solid rgba(45,90,61,.3)', borderRadius:6, padding:'2px 8px', fontSize:11, color:'#2d5a3d', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 };
const chartEditBtn = { float:'right', background:'rgba(45,90,61,.12)', border:'1px solid rgba(45,90,61,.25)', borderRadius:6, padding:'3px 10px', fontSize:11, color:'#2d5a3d', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginBottom:8 };