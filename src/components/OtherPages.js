import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../DataContext';
import { useLang } from '../LangContext';
import { ChartCard, PageFooter, MetricCard, ProgressBar } from './UI';

Chart.register(...registerables);

// ─────────────────── EMISSIONS ───────────────────────────
export function EmissionsPage({ setPage }) {
  const { data } = useData();
  const { t } = useLang();
  const barRef = useRef(), pathRef = useRef();
  const barChart = useRef(), pathChart = useRef();
  const { emissions, emissionsTrend } = data;

  useEffect(() => {
    barChart.current?.destroy();
    pathChart.current?.destroy();

    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: { labels: emissions.bySource.map(r => r.source), datasets: [{ label: 'tCO₂e', data: emissions.bySource.map(r => r.tco2e), backgroundColor:['#2d5a3d','#5a8a6a','#8ab890','#b8d4bc','#7d8f7d','#a8b8a8'], borderRadius:6 }] },
      options: { plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'rgba(0,0,0,.07)' }, ticks:{ callback:v=>v.toLocaleString() } } } }
    });
    pathChart.current = new Chart(pathRef.current, {
      type: 'line',
      data: { labels: emissionsTrend.map(r => r.year), datasets: [
        { label: t('actual'), data: emissionsTrend.map(r => r.actual), borderColor:'#2d5a3d', backgroundColor:'rgba(45,90,61,.1)', fill:true, tension:.4, pointRadius:5, spanGaps:false },
        { label: 'Target', data: emissionsTrend.map(r => r.target), borderColor:'#8ab890', borderDash:[6,4], tension:.4, pointRadius:3, fill:false }
      ]},
      options: { plugins:{ legend:{ labels:{ font:{ family:'DM Sans' } } } }, scales:{ x:{ grid:{ color:'rgba(0,0,0,.06)' } }, y:{ grid:{ color:'rgba(0,0,0,.06)' }, ticks:{ callback:v=>v?.toLocaleString() } } } }
    });
    return () => { barChart.current?.destroy(); pathChart.current?.destroy(); };
  }, [emissions, emissionsTrend, t]);

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_emissions_title')}</div>
        <div style={pageSub}>{t('page_emissions_sub')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          <SmallCard title={t('scope1')} value={emissions.scope1} unit="tCO₂e / year" sub={t('scope1_sub')} />
          <SmallCard title={t('scope2')} value={emissions.scope2} unit="tCO₂e / year" sub={t('scope2_sub')} />
          <SmallCard title={t('total_ghg')} value={emissions.total} unit="tCO₂e / year" sub="↓ 14% vs 2020" />
          <SmallCard title={t('per_student')} value={emissions.perStudent} unit="tCO₂e / student" sub="↓ 18% vs 2020" />
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
    </div>
  );
}

// ─────────────────── WATER ───────────────────────────────
export function WaterPage({ setPage }) {
  const { data } = useData();
  const { t } = useLang();
  const pieRef = useRef(), trendRef = useRef();
  const pieChart = useRef(), trendChart = useRef();
  const { water, waterTrend, buildingsWater } = data;

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
          { label: 'Total (m³)', data: waterTrend.map(r => r.total), borderColor:'#2d5a3d', backgroundColor:'rgba(45,90,61,.1)', fill:true, tension:.4, pointRadius:5 },
          { label: 'Recycled/Rain (m³)', data: waterTrend.map(r => r.recycled), borderColor:'#8ab890', fill:false, tension:.4, pointRadius:4 }
        ]
      },
      options: { plugins:{ legend:{ labels:{ font:{ family:'DM Sans' } } } }, scales:{ x:{ grid:{ color:'rgba(0,0,0,.06)' } }, y:{ grid:{ color:'rgba(0,0,0,.06)' }, ticks:{ callback:v => v.toLocaleString() } } } }
    });
    return () => { pieChart.current?.destroy(); trendChart.current?.destroy(); };
  }, [water, waterTrend]);

  const maxVal = Math.max(...buildingsWater.map(b => b.drinking + b.technical + b.irrigation));

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_water_title')}</div>
        <div style={pageSub}>{t('page_water_sub')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:20 }}>
          <MetricCard label={t('total_consumption_w')} bigValue={water.total} unit="m³ / year" note={`↓ 12% vs 2020 | ${water.perStudent} ${t('m3_per_student')}`} />
          <MetricCard label={t('recycled_rain')} bigValue={`${water.recycledPct}%`} unit={t('of_total')}>
            <ProgressBar value={water.recycledPct} max={water.recycledTarget * 1.4} label={`${water.recycledPct}%`} targetLabel={`${water.recycledTarget}% by 2030`} color="#5a8a6a" />
          </MetricCard>
          <MetricCard label={t('water_intensity')} bigValue={water.intensity} unit="m³/m²" note="↓ 15% vs 2020" />
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
              <thead><tr>{['', t('col_drinking'), t('col_technical'), t('col_irrigation'), t('col_total')].map(h => <th key={h} style={{ background:'#4a5c4a', color:'#fff', padding:'9px 14px', textAlign:'left', fontFamily:"'Space Mono',monospace", fontSize:11 }}>{h}</th>)}</tr></thead>
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
    </div>
  );
}

// ─────────────────── WASTE ───────────────────────────────
export function WastePage({ setPage }) {
  const { data } = useData();
  const { t } = useLang();
  const trendRef = useRef(); const trendChart = useRef();
  const { waste, wasteTrend } = data;

  useEffect(() => {
    trendChart.current?.destroy();
    trendChart.current = new Chart(trendRef.current, {
      type: 'line',
      data: { labels: wasteTrend.map(r => r.year), datasets: [
        { label: t('diversion_rate_lbl'), data: wasteTrend.map(r => r.actual), borderColor:'#2d5a3d', backgroundColor:'rgba(45,90,61,.1)', fill:true, tension:.4, pointRadius:5 },
        { label: 'Target', data: wasteTrend.map(r => r.target), borderColor:'#8ab890', borderDash:[6,4], fill:false, tension:.4, pointRadius:3 }
      ]},
      options: { plugins:{ legend:{ labels:{ font:{ family:'DM Sans' } } } }, scales:{ y:{ min:30, max:100, grid:{ color:'rgba(0,0,0,.06)' }, ticks:{ callback:v=>v+'%' } }, x:{ grid:{ color:'rgba(0,0,0,.06)' } } } }
    });
    return () => trendChart.current?.destroy();
  }, [wasteTrend, t]);

  const maxWaste = Math.max(...waste.byType.map(w => w.tonnes));

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_waste_title')}</div>
        <div style={pageSub}>{t('page_waste_sub')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          <SmallCard title={t('total_waste')} value={waste.total} unit={t('t_per_year')} sub="↓ 7% vs 2022" />
          <SmallCard title={t('recycling_rate')} value={`${waste.diversionRate}%`} unit={t('diversion_rate_lbl')} sub={t('target_2028')} />
          <SmallCard title={t('composted')} value={`${waste.composted}%`} unit={t('pct_of_total')} sub={`${waste.byType.find(w=>w.type.includes('Organic'))?.tonnes||0} t`} />
          <SmallCard title={t('hazardous')} value={waste.hazardous} unit={t('t_per_year')} sub={t('hazardous_disposed')} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ChartCard title={t('waste_by_type')} section="waste">
            {waste.byType.map(w => (
              <div key={w.type} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#3d4f3d', marginBottom:4, fontWeight:500 }}>
                  <span>{w.type}</span><span>{w.tonnes} t</span>
                </div>
                <div style={{ background:'rgba(255,255,255,.5)', borderRadius:99, height:10, overflow:'hidden' }}>
                  <div style={{ width:`${(w.tonnes/maxWaste)*100}%`, height:'100%', borderRadius:99, background:w.color || '#2d5a3d', transition:'width 1s' }} />
                </div>
              </div>
            ))}
          </ChartCard>
          <ChartCard title={t('waste_trend')} section="wasteTrend">
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
    </div>
  );
}

// ─────────────────── ENVIRONMENT ─────────────────────────
export function EnvironmentPage({ setPage }) {
  const { data } = useData();
  const { t } = useLang();
  const barRef = useRef(), transportRef = useRef();
  const barChart = useRef(), transportChart = useRef();
  const { environment } = data;

  useEffect(() => {
    barChart.current?.destroy(); transportChart.current?.destroy();
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: { labels: environment.initiatives.map(r => r.category), datasets: [{ label: t('initiatives_chart'), data: environment.initiatives.map(r => r.count), backgroundColor:['#2d5a3d','#5a8a6a','#8ab890','#b8d4bc','#2d5a3d','#5a8a6a','#8ab890','#b8d4bc'], borderRadius:6 }] },
      options: { indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:'rgba(0,0,0,.06)' } }, y:{ grid:{ display:false } } } }
    });
    transportChart.current = new Chart(transportRef.current, {
      type: 'doughnut',
      data: {
        labels: environment.transport.map(r => r.mode),
        datasets: [{ data: environment.transport.map(r => r.pct), backgroundColor:['#2d5a3d','#5a8a6a','#8ab890','#c44444','#b8d4bc','#a8b8a8'], borderWidth:0, hoverOffset:8 }]
      },
      options: { plugins:{ legend:{ position:'right', labels:{ font:{ family:'DM Sans', size:11 } } } }, cutout:'55%' }
    });
    return () => { barChart.current?.destroy(); transportChart.current?.destroy(); };
  }, [environment, t]);

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <div style={section}>
        <div style={pageTitle}>{t('page_env_title')}</div>
        <div style={pageSub}>{t('page_env_sub')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          <SmallCard title={t('green_projects')} value={environment.greenProjects} unit={t('initiatives_per_year')} sub={t('green_projects_sub')} />
          <SmallCard title={t('green_area')} value={environment.greenAreaM2.toLocaleString()} unit={t('m2_maintained')} sub={t('green_area_sub')} />
          <SmallCard title={t('community')} value={environment.communityEngaged.toLocaleString()} unit={t('students_staff')} sub={t('community_sub')} />
          <SmallCard title={t('green_roof')} value={environment.greenRoofM2.toLocaleString()} unit={t('m2_rooftops')} sub={t('green_roof_sub')} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          <ChartCard title={t('sdg_progress')} section="environment">
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:8 }}>
              {environment.sdgProgress.map(s => (
                <div key={s.sdg} style={{ display:'grid', gridTemplateColumns:'200px 1fr 50px', gap:12, alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ background:s.color, color:'#fff', borderRadius:4, padding:'2px 6px', fontSize:10, fontWeight:700 }}>SDG {s.sdg}</span>
                    <span style={{ fontSize:12, color:'#3d4f3d', fontWeight:600 }}>{s.label}</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.5)', borderRadius:99, height:10, overflow:'hidden' }}>
                    <div style={{ width:`${s.pct}%`, height:'100%', borderRadius:99, background:s.color, transition:'width 1s' }} />
                  </div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:s.color, textAlign:'right' }}>{s.pct}%</div>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title={t('initiatives_chart')} section="environment">
            <canvas ref={barRef} style={{ maxHeight:240 }} />
          </ChartCard>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ChartCard title={t('transport_chart')} section="environment">
            <canvas ref={transportRef} style={{ maxHeight:220 }} />
          </ChartCard>
          <ChartCard title={t('procurement_chart')}>
            <div style={{ display:'flex', flexDirection:'column', gap:18, marginTop:12 }}>
              {environment.procurement.map(p => (
                <div key={p.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13, color:'#3d4f3d', fontWeight:600 }}>{p.label}</span>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#2d5a3d' }}>{p.pct}%</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.5)', borderRadius:99, height:10, overflow:'hidden' }}>
                    <div style={{ width:`${p.pct}%`, height:'100%', borderRadius:99, background:'#2d5a3d', transition:'width 1s' }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
      <PageFooter onNext={() => setPage('home')} nextLabel={t('home_btn')} />
    </div>
  );
}

// ─── Shared small card ────────────────────────────────────
function SmallCard({ title, value, unit, sub }) {
  return (
    <div style={{ background:'#c8d0c8', borderRadius:16, padding:'24px 28px', color:'#1a2a1a', transition:'transform .2s' }}>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'.15em', textTransform:'uppercase', color:'#3d4f3d', marginBottom:12, fontWeight:700 }}>{title}</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:46, color:'#2d5a3d', lineHeight:1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize:12, color:'#3d4f3d', marginTop:4 }}>{unit}</div>
      {sub && <div style={{ fontSize:11, color:'#3d4f3d', marginTop:6, opacity:.75 }}>{sub}</div>}
    </div>
  );
}

const section = { padding:48, background:'#7d8f7d', position:'relative', zIndex:2 };
const pageTitle = { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:'.05em', color:'#fff', marginBottom:6 };
const pageSub = { fontSize:13, opacity:.65, marginBottom:32, color:'#fff' };
const leafTR = { position:'absolute', top:-8, right:-16, fontSize:200, opacity:.5, transform:'rotate(-12deg)', pointerEvents:'none', zIndex:1 };
const leafBL = { position:'absolute', bottom:80, left:20, fontSize:160, opacity:.45, transform:'rotate(6deg) scaleX(-1)', pointerEvents:'none', zIndex:1 };
