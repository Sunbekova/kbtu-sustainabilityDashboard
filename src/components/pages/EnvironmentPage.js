import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useData } from '../../DataContext';
import { ChartCard, PageFooter } from '../UI';
import { useLang } from '../../LangContext';
import { Tooltip } from '../Tooltip';
import CardEditModal from '../CardEditModal';

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

export default function EnvironmentPage({ setPage }) {
  const { data, isAdmin, importTable, pushToSheets, config } = useData();
  const { t } = useLang();
  const barRef = useRef(), transportRef = useRef();
  const barChart = useRef(), transportChart = useRef();
  const { environment } = data;

  const [editModal, setEditModal] = useState(null);

  const sdgLabelMap = {
    6: t('sdg_label_6'), 7: t('sdg_label_7'), 11: t('sdg_label_11'),
    12: t('sdg_label_12'), 13: t('sdg_label_13'), 15: t('sdg_label_15'),
  };

  const openEnvEdit = (cardKey) => {
    const defs = {
      green_projects: {
        title: t('green_projects'),
        fields: [
          { key: 'greenProjects',    label: t('green_projects'),  type: 'number' },
          { key: 'greenAreaM2',      label: t('green_area'),      type: 'number' },
          { key: 'communityEngaged', label: t('community'),       type: 'number' },
          { key: 'greenRoofM2',      label: t('green_roof'),      type: 'number' },
        ],
        initialData: {
          greenProjects:    environment.greenProjects,
          greenAreaM2:      environment.greenAreaM2,
          communityEngaged: environment.communityEngaged,
          greenRoofM2:      environment.greenRoofM2,
        },
        onSave: async (updated) => {
          const next = { ...environment, ...updated };
          importTable('environment', next);
          if (config.dataSource === 'sheets') await pushToSheets('EnvironmentMeta', next);
        }
      },
    };
    setEditModal(defs[cardKey]);
  };

  useEffect(() => {
    barChart.current?.destroy(); transportChart.current?.destroy();
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: environment.initiatives.map(r => r.category),
        datasets: [{ label: t('initiatives_chart'), data: environment.initiatives.map(r => r.count), backgroundColor:['#2d5a3d','#5a8a6a','#8ab890','#b8d4bc','#2d5a3d','#5a8a6a','#8ab890','#b8d4bc'], borderRadius:6 }]
      },
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

        {/* Edit all 4 env cards together via one button above the grid */}
        {isAdmin && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
            <button style={topEditBtn} onClick={() => openEnvEdit('green_projects')}>{t('edit_data')}</button>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          <Tooltip text={t('tooltip_green_projects')}>
            <SmallCard title={t('green_projects')} value={environment.greenProjects} unit={t('initiatives_per_year')} sub={t('green_projects_sub')} isAdmin={false} />
          </Tooltip>
          <Tooltip text={t('tooltip_green_area')}>
            <SmallCard title={t('green_area')} value={environment.greenAreaM2.toLocaleString()} unit={t('m2_maintained')} sub={t('green_area_sub')} isAdmin={false} />
          </Tooltip>
          <Tooltip text={t('tooltip_community')}>
            <SmallCard title={t('community')} value={environment.communityEngaged.toLocaleString()} unit={t('students_staff')} sub={t('community_sub')} isAdmin={false} />
          </Tooltip>
          <Tooltip text={t('tooltip_green_roof_area')}>
            <SmallCard title={t('green_roof')} value={environment.greenRoofM2.toLocaleString()} unit={t('m2_rooftops')} sub={t('green_roof_sub')} isAdmin={false} />
          </Tooltip>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          <ChartCard title={t('sdg_progress')} section="environment">
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:8 }}>
              {environment.sdgProgress.map(s => (
                <Tooltip key={s.sdg} text={t('tooltip_sdg')}>
                  <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 50px', gap:12, alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ background:s.color, color:'#fff', borderRadius:4, padding:'2px 6px', fontSize:10, fontWeight:700 }}>SDG {s.sdg}</span>
                      <span style={{ fontSize:12, color:'#3d4f3d', fontWeight:600 }}>{sdgLabelMap[s.sdg] || s.label}</span>
                    </div>
                    <div style={{ background:'rgba(255,255,255,.5)', borderRadius:99, height:10, overflow:'hidden' }}>
                      <div style={{ width:`${s.pct}%`, height:'100%', borderRadius:99, background:s.color, transition:'width 1s' }} />
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:s.color, textAlign:'right' }}>{s.pct}%</div>
                  </div>
                </Tooltip>
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
      {editModal && <CardEditModal {...editModal} onClose={() => setEditModal(null)} />}
    </div>
  );
}

const section      = { padding:48, background:'#7d8f7d', position:'relative', zIndex:2 };
const pageTitle    = { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:'.05em', color:'#fff', marginBottom:6 };
const pageSub      = { fontSize:13, opacity:.65, marginBottom:32, color:'#fff' };
const editBtnStyle = { position:'absolute', top:10, right:10, background:'rgba(45,90,61,.15)', border:'1px solid rgba(45,90,61,.3)', borderRadius:6, padding:'2px 8px', fontSize:11, color:'#2d5a3d', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 };
const topEditBtn   = { background:'rgba(255,255,255,.2)', color:'#fff', border:'1px solid rgba(255,255,255,.35)', borderRadius:8, padding:'6px 14px', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 };