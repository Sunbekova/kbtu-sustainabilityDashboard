import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../DataContext';
import { KPICard, ChartCard, PageFooter, ExportBar } from './UI';
import { exportAllDataCSV } from '../importUtils';
import { useLang } from '../LangContext';

import fon from '../data/fon.png';

Chart.register(...registerables);

export default function HomePage({ setPage }) {
  const { data } = useData();
  const { t } = useLang();
  const donutRef = useRef(), trendRef = useRef();
  const donutChart = useRef(), trendChart = useRef();

  useEffect(() => {
    if (donutChart.current) donutChart.current.destroy();
    if (trendChart.current) trendChart.current.destroy();

    donutChart.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: [
          t('energy'),
          t('water'),
          t('waste'),
          t('greenInitiatives')
        ],
        datasets: [{ data: [41,24,19,16], backgroundColor: ['#2d5a3d','#5a8a6a','#8ab890','#b8d4bc'], borderWidth: 0, hoverOffset: 8 }]
      },
      options: { plugins: { legend: { display: false } }, cutout: '65%', animation: { duration: 800 } }
    });

    const years = data.esgTrend.map(r => r.year);
    const scores = data.esgTrend.map(r => r.score);
    trendChart.current = new Chart(trendRef.current, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{ label: 'ESG Score', data: scores, borderColor: '#2d5a3d', backgroundColor: 'rgba(45,90,61,.15)', fill: true, tension: .4, pointRadius: 5, pointBackgroundColor: '#2d5a3d' }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { min: 40, max: 100, grid: { color: 'rgba(0,0,0,.08)' } }, x: { grid: { color: 'rgba(0,0,0,.08)' } } }, animation: { duration: 800 } }
    });
    return () => { donutChart.current?.destroy(); trendChart.current?.destroy(); };
  }, [data.esgTrend]);

  const { kpi } = data;

  return (
    <div>
      {/* Hero */}
      <div style={{ position:'relative', height:400, overflow:'hidden' }}>
        <img src={fon}
          alt="Green campus" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(.85)' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(72px,10vw,130px)', lineHeight:.92, textAlign:'center', color:'#fff', textShadow:'0 4px 30px rgba(0,0,0,.3)' }}>
          {t('sustainable')}<br/>{t('campus')}
          </div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:18, letterSpacing:'.25em', color:'#fff', marginTop:16, fontWeight:700 }}>KBTU</div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'#4a5c4a' }}>
        <KPICard
          label={t('esgScore')}
          value={kpi.esgScore.value}
          unit={kpi.esgScore.unit}
          delta={kpi.esgScore.delta}
          deltaLabel={` ${kpi.esgScore.deltaLabel}`}
        />
        <KPICard
          label={t('energyConsumption')}
          value={kpi.energy.value}
          unit={kpi.energy.unit}
          delta={kpi.energy.delta}
          deltaLabel={`% ${kpi.energy.deltaLabel}`}
        />
        <KPICard
          label={t('waterUsage')}
          value={kpi.water.value}
          unit={kpi.water.unit}
          delta={kpi.water.delta}
          deltaLabel={`% ${kpi.water.deltaLabel}`}
        />

        <KPICard
          label={t('wasteDiverted')}
          value={`${kpi.wasteDiv.value}%`}
          unit={kpi.wasteDiv.unit}
          delta={kpi.wasteDiv.delta}
          deltaLabel={`pp ${kpi.wasteDiv.deltaLabel}`}
        />
      </div>

      {/* Content */}
      <div style={section}>
        <ExportBar onCSV={() => exportAllDataCSV(data)} onPNG={() => alert('Use browser screenshot or Print → Save as PDF')} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          <ChartCard title={t('impactBreakdown')} section="kpi">
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <div style={{ flex:1, maxWidth:200 }}><canvas ref={donutRef} /></div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                {[
                    [t('energy'),'#2d5a3d','41%'],
                    [t('water'),'#5a8a6a','24%'],
                    [t('waste'),'#8ab890','19%'],
                    [t('greenInitiatives'),'#b8d4bc','16%']
                  ].map(([l,c,v]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:14, height:14, borderRadius:3, background:c, display:'inline-block' }} />
                    <span style={{ fontSize:13, color:'#3d4f3d' }}>{l} — {v}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title={t('esgTrend')} section="esgTrend">
            <canvas ref={trendRef} style={{ maxHeight:220 }} />
          </ChartCard>
        </div>

        {/* Equivalences */}
        <div style={{ color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'.15em', textTransform:'uppercase', marginBottom:10 }}>Impact Equivalences</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            { icon:'🌳', val:'14,200', label:'Trees planted equivalent\nfrom energy savings in 2023' },
            { icon:'🏊', val:'73', label:'Olympic pools of water saved\nvs 2020 baseline' },
            { icon:'♻️', val:'420 t', label:'Waste diverted from landfill\nthrough recycling programs' }
          ].map(e => (
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
        <div style={{ fontSize:11, color:'#888' }}>OUR WEBSITE<br/><strong style={{ color:'#1a2a1a', fontSize:13 }}>WWW.KBTU.KZ</strong></div>
        <button style={startBtn} onClick={() => setPage('energy')}>{t('start')} → &nbsp;</button>
      </div>
    </div>
  );
}

const section = { padding:48, background:'#7d8f7d' };
const startBtn = { background:'#2d5a3d', color:'#fff', border:'3px solid #2d5a3d', padding:'16px 40px', fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:'.1em', borderRadius:50, cursor:'pointer', display:'flex', alignItems:'center', gap:12 };
