import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../DataContext';
import { MetricCard, ChartCard, PageFooter, ProgressBar } from './UI';
import { useLang } from '../LangContext';

Chart.register(...registerables);

export default function EnergyPage({ setPage }) {
  const { data } = useData();
  const { t } = useLang();
  const trendRef = useRef(); const trendChart = useRef();
  const { energy, energyTrend, buildingsEnergy } = data;

  useEffect(() => {
    trendChart.current?.destroy();
    trendChart.current = new Chart(trendRef.current, {
      type: 'bar',
      data: {
        labels: energyTrend.map(r => r.year),
        datasets: [
          { label: t('natural_gas'), data: energyTrend.map(r => r.naturalGas), backgroundColor:'#2d5a3d' },
          { label: t('thermal'),     data: energyTrend.map(r => r.thermal),    backgroundColor:'#5a8a6a' },
          { label: t('electricity'), data: energyTrend.map(r => r.electricity), backgroundColor:'#8ab890' }
        ]
      },
      options: { responsive:true, plugins:{ legend:{ labels:{ font:{ family:'DM Sans' } } } }, scales:{ x:{ grid:{ color:'rgba(0,0,0,.06)' } }, y:{ grid:{ color:'rgba(0,0,0,.06)' }, ticks:{ callback:v=>v.toLocaleString() } } } }
    });
    return () => trendChart.current?.destroy();
  }, [energyTrend, t]);

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_energy_title')}</div>
        <div style={pageSub}>{t('page_energy_sub')}</div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:20 }}>
          <MetricCard label={t('natural_gas')} bigValue={energy.naturalGas.total} unit={`${energy.naturalGas.unit} ${t('total_consumption').toLowerCase()}`} note={t('vs_prior', { v: Math.abs(energy.naturalGas.vsLastYear) })}>
            <ProgressBar value={energy.naturalGas.baselinePct} label={`${energy.naturalGas.baselinePct}% ${t('baseline')}`} targetLabel={t('target', { v: energy.naturalGas.target })} color="#2d5a3d" />
          </MetricCard>
          <MetricCard label={t('thermal')} bigValue={energy.thermal.total} unit={`${energy.thermal.unit} ${t('total_consumption').toLowerCase()}`} note={t('vs_prior', { v: Math.abs(energy.thermal.vsLastYear) })}>
            <ProgressBar value={energy.thermal.renewablePct} label={`${energy.thermal.renewablePct}% ${t('renewable_heat')}`} targetLabel={t('target', { v: energy.thermal.target })} color="#5a8a6a" />
          </MetricCard>
          <MetricCard label={t('electricity')} bigValue={energy.electricity.total} unit={`${energy.electricity.unit} ${t('total_consumption').toLowerCase()}`} note={`${t('vs_prior', { v: Math.abs(energy.electricity.vsLastYear) })} — ${t('solar')}: ${energy.electricity.solarMWh.toLocaleString()} MWh`}>
            <ProgressBar value={energy.electricity.renewablePct} label={`${energy.electricity.renewablePct}% ${t('renewables_share')}`} targetLabel={t('target', { v: energy.electricity.target })} color="#8ab890" />
          </MetricCard>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ChartCard title={t('energy_trend')} section="energyTrend">
            <canvas ref={trendRef} style={{ maxHeight:240 }} />
          </ChartCard>
          <ChartCard title={t('top_buildings')} section="buildingsEnergy">
            <table style={tbl}>
              <thead><tr>{['#', t('col_building'), t('col_mwh'), t('col_kwh_m2'), t('col_vs2022')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {buildingsEnergy.map((b,i) => (
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
    </div>
  );
}

const section = { padding:48, background:'#7d8f7d', position:'relative', zIndex:2 };
const pageTitle = { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:'.05em', color:'#fff', marginBottom:6 };
const pageSub = { fontSize:13, opacity:.65, marginBottom:32, color:'#fff' };
const leafTR = { position:'absolute', top:-8, right:-16, fontSize:200, opacity:.5, transform:'rotate(-12deg)', pointerEvents:'none', zIndex:1 };
const leafBL = { position:'absolute', bottom:80, left:20, fontSize:160, opacity:.45, transform:'rotate(6deg) scaleX(-1)', pointerEvents:'none', zIndex:1 };
const tbl = { width:'100%', borderCollapse:'collapse', fontSize:13 };
const th = { background:'#4a5c4a', color:'#fff', padding:'10px 14px', textAlign:'left', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'.08em' };
const td = { padding:'10px 14px', borderBottom:'1px solid rgba(0,0,0,.08)', color:'#1a2a1a' };
