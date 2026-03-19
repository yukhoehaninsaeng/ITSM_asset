import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { dashboardAPI } from '../utils/api';

const SC = { 'In Use':'#2e9e6b','In Stock':'#3b7dd8','Maintenance':'#e8972c','Retired':'#8c96a3','Lost':'#d94f3d' };
const SL = { 'In Use':'사용 중','In Stock':'재고','Maintenance':'유지보수','Retired':'폐기','Lost':'분실' };

const Stat = ({ label, value, color }) => (
  <div className="card" style={{ padding: '18px 22px' }}>
    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 700, color: color || 'var(--text-1)', lineHeight: 1 }}>{value ?? '—'}</div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardAPI.stats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-3)' }}>불러오는 중...</div>
  );

  const pieData = [
    { name: '사용 중', value: +stats.in_use },
    { name: '재고', value: +stats.in_stock },
    { name: '유지보수', value: +stats.maintenance },
    { name: '폐기', value: +stats.retired },
    { name: '분실', value: +stats.lost },
  ].filter(d => d.value > 0);

  const catData = Object.entries(stats.category_breakdown || {}).map(([name, value]) => ({ name, value: +value }));

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 21, fontWeight: 700 }}>대시보드</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 2 }}>자산 현황 요약</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14, marginBottom: 20 }}>
        <Stat label="전체 자산" value={stats.total} />
        <Stat label="사용 중" value={stats.in_use} color="var(--success)" />
        <Stat label="재고" value={stats.in_stock} color="var(--info)" />
        <Stat label="유지보수" value={stats.maintenance} color="var(--warning)" />
        <Stat label="폐기" value={stats.retired} color="var(--text-3)" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }} className="chart-row">
        <div className="card">
          <div className="card-header"><span className="card-title">상태별 분포</span></div>
          <div className="card-body" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={52} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={Object.values(SC)[i]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}개`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center', marginTop: -6 }}>
              {pieData.map((d, i) => (
                <span key={d.name} style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: Object.values(SC)[i], display: 'inline-block' }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">카테고리별</span></div>
          <div className="card-body" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="자산 수" fill="var(--accent)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent scans */}
      <div className="card">
        <div className="card-header"><span className="card-title">최근 스캔 기록</span></div>
        <div className="tbl-wrap">
          {!stats.recent_scans?.length ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>스캔 기록이 없습니다</div>
          ) : (
            <table>
              <thead><tr><th>자산번호</th><th>자산명</th><th>동작</th><th>담당자</th><th>시간</th></tr></thead>
              <tbody>
                {stats.recent_scans.map(s => (
                  <tr key={s.id}>
                    <td><span className="mono">{s.asset_number}</span></td>
                    <td>{s.asset_name}</td>
                    <td><span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 500 }}>{s.action}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{s.user_name || '—'}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>
                      {formatDistanceToNow(new Date(s.scan_time), { addSuffix: true, locale: ko })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`@media(max-width:768px){.chart-row{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
