import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../../DataContext';
import { MetricCard, ChartCard, DashboardFiltersBar, PageFooter, ProgressBar, ExportBar } from '../UI';
import { exportDashboardPDF, exportPageCSV, exportPageExcel } from '../../importUtils';
import { useLang } from '../../LangContext';
import { Tooltip } from '../Tooltip';
import CardEditModal from '../CardEditModal';

Chart.register(...registerables);

export default function EnergyPage({ setPage }) {
  const { data, isAdmin, importTable, pushToSheets, config, dashboardFilters, getFacultyForBuilding } = useData();
  const { t } = useLang();
  const trendRef = useRef();
  const trendChart = useRef();
  const { energy, energyTrend, buildingsEnergy } = data;

  const [editModal, setEditModal] = useState(null);

  const yearTrend = dashboardFilters.year === 'all'
    ? energyTrend
    : energyTrend.filter(r => String(r.year) === dashboardFilters.year);

  const filteredBuildings = buildingsEnergy.filter((b) => {
    if (dashboardFilters.building !== 'all' && b.name !== dashboardFilters.building) return false;
    if (dashboardFilters.faculty !== 'all' && getFacultyForBuilding(b.name) !== dashboardFilters.faculty) return false;
    return true;
  });

  const totalBuildingsMWh = buildingsEnergy.reduce((sum, b) => sum + Number(b.mwh || 0), 0);
  const filteredBuildingsMWh = filteredBuildings.reduce((sum, b) => sum + Number(b.mwh || 0), 0);
  const hasLocationFilter = dashboardFilters.building !== 'all' || dashboardFilters.faculty !== 'all';
  const locationFactor = hasLocationFilter
    ? (totalBuildingsMWh > 0 ? filteredBuildingsMWh / totalBuildingsMWh : 0)
    : 1;

  const selectedYearRow = yearTrend.length ? yearTrend[yearTrend.length - 1] : null;
  const prevYearSource = energyTrend.find(r => selectedYearRow && r.year === selectedYearRow.year - 1);
  const calcVs = (current, previous, fallback) => {
    if (!previous || !Number.isFinite(previous) || previous === 0) return fallback;
    return Math.round(((current - previous) / previous) * 100);
  };
  const scaleVal = (v) => Math.round(Number(v || 0) * locationFactor);

  const energyView = {
    naturalGas: {
      ...energy.naturalGas,
      total: scaleVal(selectedYearRow ? selectedYearRow.naturalGas : energy.naturalGas.total),
      vsLastYear: selectedYearRow
        ? calcVs(selectedYearRow.naturalGas, prevYearSource?.naturalGas, energy.naturalGas.vsLastYear)
        : energy.naturalGas.vsLastYear,
    },
    thermal: {
      ...energy.thermal,
      total: scaleVal(selectedYearRow ? selectedYearRow.thermal : energy.thermal.total),
      vsLastYear: selectedYearRow
        ? calcVs(selectedYearRow.thermal, prevYearSource?.thermal, energy.thermal.vsLastYear)
        : energy.thermal.vsLastYear,
    },
    electricity: {
      ...energy.electricity,
      total: scaleVal(selectedYearRow ? selectedYearRow.electricity : energy.electricity.total),
      solarMWh: scaleVal(energy.electricity.solarMWh),
      vsLastYear: selectedYearRow
        ? calcVs(selectedYearRow.electricity, prevYearSource?.electricity, energy.electricity.vsLastYear)
        : energy.electricity.vsLastYear,
    },
  };

  const openEnergyEdit = (type) => {
    const src = energy[type];
    setEditModal({
      title: t(type === 'naturalGas' ? 'natural_gas' : type === 'thermal' ? 'thermal' : 'electricity'),
      fields: [
        { key: 'total',       label: t('total_consumption'), type: 'number' },
        { key: 'unit',        label: 'Unit' },
        { key: 'vsLastYear',  label: t('col_vs2022'),        type: 'number' },
        { key: 'baselinePct', label: t('baseline'),          type: 'number' },
        { key: 'target',      label: 'Target %',             type: 'number' },
        ...(type === 'electricity' ? [
          { key: 'solarMWh',     label: t('solar'),           type: 'number' },
          { key: 'renewablePct', label: t('renewables_share'),type: 'number' },
        ] : [
          { key: 'renewablePct', label: t('renewable_heat'),  type: 'number' },
        ]),
      ],
      initialData: { ...src },
      onSave: async (updated) => {
        const next = { ...energy, [type]: { ...src, ...updated } };
        importTable('energy', next);
        if (config.dataSource === 'sheets') await pushToSheets('Energy', next);
      }
    });
  };

  useEffect(() => {
    trendChart.current?.destroy();
    trendChart.current = new Chart(trendRef.current, {
      type: 'bar',
      data: {
        labels: yearTrend.map(r => r.year),
        datasets: [
          { label: t('natural_gas'), data: yearTrend.map(r => scaleVal(r.naturalGas)), backgroundColor:'#2d5a3d' },
          { label: t('thermal'),     data: yearTrend.map(r => scaleVal(r.thermal)),    backgroundColor:'#5a8a6a' },
          { label: t('electricity'), data: yearTrend.map(r => scaleVal(r.electricity)),backgroundColor:'#8ab890' }
        ]
      },
      options: { responsive:true, plugins:{ legend:{ labels:{ font:{ family:'DM Sans' } } } }, scales:{ x:{ grid:{ color:'rgba(0,0,0,.06)' } }, y:{ grid:{ color:'rgba(0,0,0,.06)' }, ticks:{ callback:v=>v.toLocaleString() } } } }
    });
    return () => trendChart.current?.destroy();
  }, [yearTrend, t, locationFactor]);

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_energy_title')}</div>
        <div style={pageSub}>{t('page_energy_sub')}</div>
        <ExportBar
          page="energy"
          onCSV={() => exportPageCSV('energy', data, t)}
          onExcel={() => exportPageExcel('energy', data, t)}
          onPDF={() => window.print()}
        />
        <DashboardFiltersBar />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:20 }}>
          <Tooltip text={t('tooltip_renewables')}>
            <div style={cardWrap}>
              {isAdmin && <button style={editBtn} onClick={() => openEnergyEdit('naturalGas')}>✏️</button>}
              <MetricCard label={t('natural_gas')} bigValue={energyView.naturalGas.total} unit={`${energyView.naturalGas.unit} ${t('total_consumption').toLowerCase()}`} note={t('vs_prior', { v: Math.abs(energyView.naturalGas.vsLastYear) })}>
                <ProgressBar value={energyView.naturalGas.baselinePct} label={`${energyView.naturalGas.baselinePct}% ${t('baseline')}`} targetLabel={t('target', { v: energyView.naturalGas.target })} color="#2d5a3d" />
              </MetricCard>
            </div>
          </Tooltip>
          <Tooltip text={t('tooltip_renewables')}>
            <div style={cardWrap}>
              {isAdmin && <button style={editBtn} onClick={() => openEnergyEdit('thermal')}>✏️</button>}
              <MetricCard label={t('thermal')} bigValue={energyView.thermal.total} unit={`${energyView.thermal.unit} ${t('total_consumption').toLowerCase()}`} note={t('vs_prior', { v: Math.abs(energyView.thermal.vsLastYear) })}>
                <ProgressBar value={energyView.thermal.renewablePct} label={`${energyView.thermal.renewablePct}% ${t('renewable_heat')}`} targetLabel={t('target', { v: energyView.thermal.target })} color="#5a8a6a" />
              </MetricCard>
            </div>
          </Tooltip>
          <Tooltip text={t('tooltip_renewables')}>
            <div style={cardWrap}>
              {isAdmin && <button style={editBtn} onClick={() => openEnergyEdit('electricity')}>✏️</button>}
              <MetricCard label={t('electricity')} bigValue={energyView.electricity.total} unit={`${energyView.electricity.unit} ${t('total_consumption').toLowerCase()}`} note={`${t('vs_prior', { v: Math.abs(energyView.electricity.vsLastYear) })} — ${t('solar')}: ${energyView.electricity.solarMWh.toLocaleString()} MWh`}>
                <ProgressBar value={energyView.electricity.renewablePct} label={`${energyView.electricity.renewablePct}% ${t('renewables_share')}`} targetLabel={t('target', { v: energyView.electricity.target })} color="#8ab890" />
              </MetricCard>
            </div>
          </Tooltip>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ChartCard title={t('energy_trend')} section="energyTrend">
            <canvas ref={trendRef} style={{ maxHeight:240 }} />
          </ChartCard>
          <ChartCard title={t('top_buildings')} section="buildingsEnergy">
            <table style={tbl}>
              <thead>
                <tr>{['#', t('col_building'), t('col_mwh'), t('col_kwh_m2'), t('col_vs2022')].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredBuildings.map((b,i) => (
                  <tr key={b.name}>
                    <td style={td}>{i+1}</td>
                    <td style={td}>{b.name}</td>
                    <td style={td}>{b.mwh.toLocaleString()}</td>
                    <td style={td}>{b.kwh_m2}</td>
                    <td style={{ ...td, color: b.delta > 0 ? '#c44' : '#4a8a4a', fontWeight:600 }}>{b.delta > 0 ? '+' : ''}{b.delta}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ChartCard>
        </div>
      </div>
      <PageFooter onNext={() => setPage('emissions')} />
      {editModal && <CardEditModal {...editModal} onClose={() => setEditModal(null)} />}
    </div>
  );
}

const section  = { padding:48, background:'#7d8f7d', position:'relative', zIndex:2 };
const pageTitle= { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:'.05em', color:'#fff', marginBottom:6 };
const pageSub  = { fontSize:13, opacity:.65, marginBottom:32, color:'#fff' };
const cardWrap = { position:'relative' };
const editBtn  = { position:'absolute', top:10, right:10, zIndex:10, background:'rgba(45,90,61,.15)', border:'1px solid rgba(45,90,61,.3)', borderRadius:6, padding:'2px 8px', fontSize:11, color:'#2d5a3d', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 };
const tbl = { width:'100%', borderCollapse:'collapse', fontSize:13 };
const th  = { background:'#4a5c4a', color:'#fff', padding:'10px 14px', textAlign:'left', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'.08em' };
const td  = { padding:'10px 14px', borderBottom:'1px solid rgba(0,0,0,.08)', color:'#1a2a1a' };