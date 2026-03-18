import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../../DataContext';
import { ChartCard, PageFooter, MetricCard, ProgressBar } from '../UI';
import { useLang } from '../../LangContext';
import { Tooltip } from '../Tooltip';
import CardEditModal from '../CardEditModal';

Chart.register(...registerables);

export default function WaterPage({ setPage }) {
  const { data, isAdmin, importTable, pushToSheets, config } = useData();
  const { t } = useLang();
  const pieRef = useRef(), trendRef = useRef();
  const pieChart = useRef(), trendChart = useRef();
  const { water, waterTrend, buildingsWater } = data;

  const [editModal, setEditModal] = useState(null);

  const openWaterEdit = (cardKey) => {
    const defs = {
      total: {
        title: t('total_consumption_w'),
        fields: [
          { key: 'total',      label: t('total_consumption_w'), type: 'number' },
          { key: 'perStudent', label: t('m3_per_student'),      type: 'number' },
          { key: 'intensity',  label: t('water_intensity'),     type: 'number' },
        ],
        initialData: { total: water.total, perStudent: water.perStudent, intensity: water.intensity },
      },
      recycled: {
        title: t('recycled_rain'),
        fields: [
          { key: 'recycledPct',    label: '% recycled',    type: 'number' },
          { key: 'recycledTarget', label: '% target 2030', type: 'number' },
        ],
        initialData: { recycledPct: water.recycledPct, recycledTarget: water.recycledTarget },
      },
      intensity: {
        title: t('water_intensity'),
        fields: [
          { key: 'intensity', label: `${t('water_intensity')} (m³/m²)`, type: 'number' },
        ],
        initialData: { intensity: water.intensity },
      },
    };
    const def = defs[cardKey];
    setEditModal({
      ...def,
      onSave: async (updated) => {
        const next = { ...water, ...updated };
        importTable('water', next);
        if (config.dataSource === 'sheets') await pushToSheets('WaterMeta', next);
      }
    });
  };

  useEffect(() => {
    pieChart.current?.destroy(); trendChart.current?.destroy();
    pieChart.current = new Chart(pieRef.current, {
      type: 'pie',
      data: {
        labels: water.byType.map(r => r.type),
        datasets: [{ data: water.byType.map(r => r.m3), backgroundColor:['#2d5a3d','#5a8a6a','#8ab890','#b8d4bc','#d4e8d4'], borderWidth:0, hoverOffset:8 }]
      },
      options: { plugins:{ legend:{ position:'right', labels:{ font:{ family:'DM Sans', size:11 } } } } }
    });
    trendChart.current = new Chart(trendRef.current, {
      type: 'line',
      data: {
        labels: waterTrend.map(r => r.year),
        datasets: [
          { label: `${t('total_label')} (m³)`, data: waterTrend.map(r => r.total), borderColor:'#2d5a3d', backgroundColor:'rgba(45,90,61,.1)', fill:true, tension:.4, pointRadius:5 },
          { label: `${t('recycled_rain')} (m³)`, data: waterTrend.map(r => r.recycled), borderColor:'#8ab890', fill:false, tension:.4, pointRadius:4 }
        ]
      },
      options: { plugins:{ legend:{ labels:{ font:{ family:'DM Sans' } } } }, scales:{ x:{ grid:{ color:'rgba(0,0,0,.06)' } }, y:{ grid:{ color:'rgba(0,0,0,.06)' }, ticks:{ callback:v=>v.toLocaleString() } } } }
    });
    return () => { pieChart.current?.destroy(); trendChart.current?.destroy(); };
  }, [water, waterTrend, t]);

  const maxVal = Math.max(...buildingsWater.map(b => b.drinking + b.technical + b.irrigation));

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_water_title')}</div>
        <div style={pageSub}>{t('page_water_sub')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:20 }}>
          <Tooltip text={t('tooltip_water_total')}>
            <div style={cardWrap}>
              {isAdmin && <button style={editBtn} onClick={() => openWaterEdit('total')}>✏️</button>}
              <MetricCard label={t('total_consumption_w')} bigValue={water.total} unit="m³ / year" note={`${t('water_down_2020', { v:12 })} | ${water.perStudent} ${t('m3_per_student')}`} />
            </div>
          </Tooltip>
          <Tooltip text={t('tooltip_recycled')}>
            <div style={cardWrap}>
              {isAdmin && <button style={editBtn} onClick={() => openWaterEdit('recycled')}>✏️</button>}
              <MetricCard label={t('recycled_rain')} bigValue={`${water.recycledPct}%`} unit={t('of_total')}>
                <ProgressBar value={water.recycledPct} max={water.recycledTarget * 1.4} label={`${water.recycledPct}%`} targetLabel={`${water.recycledTarget}${t('recycled_target_label')}`} color="#5a8a6a" />
              </MetricCard>
            </div>
          </Tooltip>
          <Tooltip text={t('tooltip_water_intensity')}>
            <div style={cardWrap}>
              {isAdmin && <button style={editBtn} onClick={() => openWaterEdit('intensity')}>✏️</button>}
              <MetricCard label={t('water_intensity')} bigValue={water.intensity} unit={t('water_m3_m2')} note={t('water_down_intensity')} />
            </div>
          </Tooltip>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          <ChartCard title={t('water_by_type')} section="water">
            <canvas ref={pieRef} style={{ maxHeight:220 }} />
          </ChartCard>
          <ChartCard title={t('water_trend')} section="waterTrend">
            <canvas ref={trendRef} style={{ maxHeight:220 }} />
          </ChartCard>
        </div>
        <ChartCard title={t('heatmap_title')} section="buildingsWater">
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  {['', t('col_drinking'), t('col_technical'), t('col_irrigation'), t('col_total')].map(h => (
                    <th key={h} style={{ background:'#4a5c4a', color:'#fff', padding:'9px 14px', textAlign:'left', fontFamily:"'Space Mono',monospace", fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buildingsWater.map(b => {
                  const total = b.drinking + b.technical + b.irrigation;
                  return (
                    <tr key={b.name}>
                      <td style={{ padding:'9px 14px', fontWeight:600, color:'#3d4f3d' }}>{b.name}</td>
                      {[b.drinking, b.technical, b.irrigation, total].map((v, i) => {
                        const intensity = Math.min(v / maxVal, 1);
                        const r = Math.round(255 - intensity*80), g = Math.round(255 - intensity*40), bl = Math.round(255 - intensity*100);
                        return <td key={i} style={{ padding:'9px 14px', background:`rgb(${r},${g},${bl})`, color:intensity>.6?'white':'#3d4f3d', fontWeight:600, textAlign:'center' }}>{v.toLocaleString()}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
      <PageFooter onNext={() => setPage('waste')} />
      {editModal && <CardEditModal {...editModal} onClose={() => setEditModal(null)} />}
    </div>
  );
}

const section  = { padding:48, background:'#7d8f7d', position:'relative', zIndex:2 };
const pageTitle= { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:'.05em', color:'#fff', marginBottom:6 };
const pageSub  = { fontSize:13, opacity:.65, marginBottom:32, color:'#fff' };
const cardWrap = { position:'relative' };
const editBtn  = { position:'absolute', top:10, right:10, zIndex:10, background:'rgba(45,90,61,.15)', border:'1px solid rgba(45,90,61,.3)', borderRadius:6, padding:'2px 8px', fontSize:11, color:'#2d5a3d', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 };