import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../../DataContext';
import { ChartCard, DashboardFiltersBar, PageFooter } from '../UI';
import { useLang } from '../../LangContext';
import { Tooltip } from '../Tooltip';
import CardEditModal from '../CardEditModal';

Chart.register(...registerables);

function SmallCard({ title, value, unit, sub, onEdit, isAdmin }) {
  return (
    <div style={{ background:'#c8d0c8', borderRadius:16, padding:'24px 28px', color:'#1a2a1a', cursor:'default', position:'relative' }}>
      {isAdmin && (
        <button onClick={onEdit} style={editBtnStyle}>✏️</button>
      )}
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'.15em', textTransform:'uppercase', color:'#3d4f3d', marginBottom:12, fontWeight:700 }}>{title}</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:46, color:'#2d5a3d', lineHeight:1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize:12, color:'#3d4f3d', marginTop:4 }}>{unit}</div>
      {sub && <div style={{ fontSize:11, color:'#3d4f3d', marginTop:6, opacity:.75 }}>{sub}</div>}
    </div>
  );
}

export default function EmissionsPage({ setPage }) {
  const { data, isAdmin, importTable, pushToSheets, config, dashboardFilters, getFacultyForBuilding } = useData();
  const { t } = useLang();
  const barRef = useRef(), pathRef = useRef();
  const barChart = useRef(), pathChart = useRef();
  const { emissions, emissionsTrend, buildingsEnergy, buildingsWater } = data;

  const [editModal, setEditModal] = useState(null); // { title, fields, initialData, onSave }

  const filteredTrend = dashboardFilters.year === 'all'
    ? emissionsTrend
    : emissionsTrend.filter(r => String(r.year) === dashboardFilters.year);

  const locationRows = (buildingsEnergy || []).length ? buildingsEnergy : (buildingsWater || []).map((r) => ({ name: r.name, mwh: Number(r.drinking || 0) + Number(r.technical || 0) + Number(r.irrigation || 0) }));
  const filteredLocationRows = locationRows.filter((r) => {
    if (dashboardFilters.building !== 'all' && r.name !== dashboardFilters.building) return false;
    if (dashboardFilters.faculty !== 'all' && getFacultyForBuilding(r.name) !== dashboardFilters.faculty) return false;
    return true;
  });

  const totalLocation = locationRows.reduce((sum, r) => sum + Number(r.mwh || 0), 0);
  const filteredLocation = filteredLocationRows.reduce((sum, r) => sum + Number(r.mwh || 0), 0);
  const hasLocationFilter = dashboardFilters.building !== 'all' || dashboardFilters.faculty !== 'all';
  const locationFactor = hasLocationFilter
    ? (totalLocation > 0 ? filteredLocation / totalLocation : 0)
    : 1;

  const selectedPoint = filteredTrend.length ? filteredTrend[filteredTrend.length - 1] : null;
  const totalFromYear = Number(selectedPoint?.actual);
  const baseTotal = Number(emissions.total || 0);
  const scope1Share = baseTotal > 0 ? Number(emissions.scope1 || 0) / baseTotal : 0;
  const scope2Share = baseTotal > 0 ? Number(emissions.scope2 || 0) / baseTotal : 0;

  const totalEmissions = Math.round((Number.isFinite(totalFromYear) ? totalFromYear : baseTotal) * locationFactor);
  const emissionsView = {
    scope1: Math.round(totalEmissions * scope1Share),
    scope2: Math.round(totalEmissions * scope2Share),
    total: totalEmissions,
    perStudent: Number((Number(emissions.perStudent || 0) * locationFactor).toFixed(2)),
    bySource: (emissions.bySource || []).map((r) => ({ ...r, tco2e: Math.round(Number(r.tco2e || 0) * locationFactor) })),
  };

  const openEdit = (cardKey) => {
    const cardDefs = {
      scope1: {
        title: t('scope1'),
        fields: [
          { key: 'scope1', label: t('scope1'), type: 'number' },
        ],
        initialData: { scope1: emissions.scope1 },
        onSave: async (updated) => {
          const next = { ...emissions, ...updated };
          importTable('emissions', next);
          if (config.dataSource === 'sheets') await pushToSheets('Emissions', next);
        }
      },
      scope2: {
        title: t('scope2'),
        fields: [
          { key: 'scope2', label: t('scope2'), type: 'number' },
        ],
        initialData: { scope2: emissions.scope2 },
        onSave: async (updated) => {
          const next = { ...emissions, ...updated };
          importTable('emissions', next);
          if (config.dataSource === 'sheets') await pushToSheets('Emissions', next);
        }
      },
      total: {
        title: t('total_ghg'),
        fields: [
          { key: 'total',      label: t('total_ghg'),   type: 'number' },
          { key: 'perStudent', label: t('per_student'), type: 'number' },
        ],
        initialData: { total: emissions.total, perStudent: emissions.perStudent },
        onSave: async (updated) => {
          const next = { ...emissions, ...updated };
          importTable('emissions', next);
          if (config.dataSource === 'sheets') await pushToSheets('Emissions', next);
        }
      },
    };
    setEditModal(cardDefs[cardKey]);
  };

  useEffect(() => {
    barChart.current?.destroy();
    pathChart.current?.destroy();
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: emissionsView.bySource.map(r => r.source),
        datasets: [{ label: 'tCO₂e', data: emissionsView.bySource.map(r => r.tco2e), backgroundColor:['#2d5a3d','#5a8a6a','#8ab890','#b8d4bc','#7d8f7d','#a8b8a8'], borderRadius:6 }]
      },
      options: { plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'rgba(0,0,0,.07)' }, ticks:{ callback:v=>v.toLocaleString() } } } }
    });
    pathChart.current = new Chart(pathRef.current, {
      type: 'line',
      data: { labels: filteredTrend.map(r => r.year), datasets: [
        { label: t('actual'), data: filteredTrend.map(r => Number.isFinite(r.actual) ? Math.round(r.actual * locationFactor) : null), borderColor:'#2d5a3d', backgroundColor:'rgba(45,90,61,.1)', fill:true, tension:.4, pointRadius:5, spanGaps:false },
        { label: t('target_label'), data: filteredTrend.map(r => Number.isFinite(r.target) ? Math.round(r.target * locationFactor) : null), borderColor:'#8ab890', borderDash:[6,4], tension:.4, pointRadius:3, fill:false }
      ]},
      options: { plugins:{ legend:{ labels:{ font:{ family:'DM Sans' } } } }, scales:{ x:{ grid:{ color:'rgba(0,0,0,.06)' } }, y:{ grid:{ color:'rgba(0,0,0,.06)' }, ticks:{ callback:v=>v?.toLocaleString() } } } }
    });
    return () => { barChart.current?.destroy(); pathChart.current?.destroy(); };
  }, [emissionsView, filteredTrend, t, locationFactor]);

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_emissions_title')}</div>
        <div style={pageSub}>{t('page_emissions_sub')}</div>
        <DashboardFiltersBar />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          <Tooltip text={t('tooltip_scope1')}>
            <SmallCard title={t('scope1')} value={emissionsView.scope1} unit={t('tco2e_year')} sub={t('scope1_sub')} isAdmin={isAdmin} onEdit={() => openEdit('scope1')} />
          </Tooltip>
          <Tooltip text={t('tooltip_scope2')}>
            <SmallCard title={t('scope2')} value={emissionsView.scope2} unit={t('tco2e_year')} sub={t('scope2_sub')} isAdmin={isAdmin} onEdit={() => openEdit('scope2')} />
          </Tooltip>
          <Tooltip text={t('tooltip_total_ghg')}>
            <SmallCard title={t('total_ghg')} value={emissionsView.total} unit={t('tco2e_year')} sub={t('ghg_down_2020')} isAdmin={isAdmin} onEdit={() => openEdit('total')} />
          </Tooltip>
          <Tooltip text={t('tooltip_per_student')}>
            <SmallCard title={t('per_student')} value={emissionsView.perStudent} unit={t('tco2e_student')} sub={t('per_student_down')} isAdmin={isAdmin} onEdit={() => openEdit('total')} />
          </Tooltip>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ChartCard title={t('ghg_by_source')} section="emissions">
            <canvas ref={barRef} style={{ maxHeight:220 }} />
          </ChartCard>
          <ChartCard title={t('emissions_pathway')} section="emissionsTrend">
            <canvas ref={pathRef} style={{ maxHeight:220 }} />
            <div style={{ marginTop:12, fontSize:12, color:'#3d4f3d', opacity:.8 }}>{t('carbon_neutral_target')}</div>
          </ChartCard>
        </div>
      </div>
      <PageFooter onNext={() => setPage('water')} />
      {editModal && <CardEditModal {...editModal} onClose={() => setEditModal(null)} />}
    </div>
  );
}

const section   = { padding:48, background:'#7d8f7d', position:'relative', zIndex:2 };
const pageTitle = { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:'.05em', color:'#fff', marginBottom:6 };
const pageSub   = { fontSize:13, opacity:.65, marginBottom:32, color:'#fff' };
const editBtnStyle = { position:'absolute', top:10, right:10, background:'rgba(45,90,61,.15)', border:'1px solid rgba(45,90,61,.3)', borderRadius:6, padding:'2px 8px', fontSize:11, color:'#2d5a3d', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 };