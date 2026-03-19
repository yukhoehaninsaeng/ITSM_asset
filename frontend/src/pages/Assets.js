import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import AssetModal from '../components/common/AssetModal';
import QRModal from '../components/common/QRModal';

const SB = { 'In Use':'badge badge-in-use','In Stock':'badge badge-in-stock','Maintenance':'badge badge-maintenance','Retired':'badge badge-retired','Lost':'badge badge-lost' };
const SL = { 'In Use':'사용 중','In Stock':'재고','Maintenance':'유지보수','Retired':'폐기','Lost':'분실' };
const CL = { Hardware:'하드웨어',Software:'소프트웨어',Network:'네트워크',Peripheral:'주변기기',Furniture:'가구',Vehicle:'차량',Other:'기타' };

export default function Assets() {
  const [data, setData]         = useState({ items: [], total: 0, total_pages: 1 });
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [fStatus, setFStatus]   = useState('');
  const [fCat, setFCat]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [qrAsset, setQrAsset]   = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = { page, page_size: 20 };
      if (search)  p.search   = search;
      if (fStatus) p.status   = fStatus;
      if (fCat)    p.category = fCat;
      const { data: res } = await api.get('/api/assets', { params: p });
      setData(res);
    } catch { toast.error('목록 불러오기 실패'); }
    finally { setLoading(false); }
  }, [page, search, fStatus, fCat]);

  useEffect(() => { load(); }, [load]);

  const del = async (num) => {
    if (!window.confirm(`${num} 자산을 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/api/assets/${num}`);
      toast.success('삭제되었습니다');
      load();
    } catch (err) { toast.error(err.response?.data?.error || '삭제 실패'); }
  };

  const Pages = () => {
    if (data.total_pages <= 1) return null;
    const start = Math.max(1, Math.min(page - 2, data.total_pages - 4));
    const nums  = Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => start + i);
    return (
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>페이지 {page} / {data.total_pages}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</button>
          {nums.map(n => (
            <button key={n} className="btn btn-sm" onClick={() => setPage(n)}
              style={{ background: n === page ? 'var(--primary)' : 'transparent', color: n === page ? '#fff' : 'var(--text-2)', border: '1px solid var(--border)' }}>{n}</button>
          ))}
          <button className="btn btn-ghost btn-sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>다음</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700 }}>자산 목록</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 2 }}>총 {data.total}개</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditAsset(null); setShowModal(true); }}>
          + 자산 등록
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-control" style={{ flex: '1 1 220px', maxWidth: 300 }}
            placeholder="자산번호, 이름, 시리얼..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="form-control" style={{ width: 140 }} value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1); }}>
            <option value="">모든 상태</option>
            {Object.entries(SL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="form-control" style={{ width: 140 }} value={fCat} onChange={e => { setFCat(e.target.value); setPage(1); }}>
            <option value="">모든 카테고리</option>
            {Object.entries(CL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(search || fStatus || fCat) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFStatus(''); setFCat(''); setPage(1); }}>초기화</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>불러오는 중...</div>
          ) : data.items.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⊡</div>
              자산이 없습니다
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>자산번호</th><th>이름</th><th>카테고리</th><th>상태</th>
                  <th className="hide-mobile">위치</th><th className="hide-mobile">부서</th>
                  <th style={{ width: 120 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(a => (
                  <tr key={a.id}>
                    <td><span className="mono">{a.asset_number}</span></td>
                    <td>
                      <button onClick={() => navigate(`/assets/${a.asset_number}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, color: 'var(--primary)', fontFamily: 'inherit', fontSize: 13, padding: 0, textAlign: 'left' }}>
                        {a.name}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{CL[a.category] || a.category}</td>
                    <td><span className={SB[a.status] || 'badge'}>{SL[a.status] || a.status}</span></td>
                    <td className="hide-mobile" style={{ color: 'var(--text-2)', fontSize: 12 }}>{a.location || '—'}</td>
                    <td className="hide-mobile" style={{ color: 'var(--text-2)', fontSize: 12 }}>{a.department || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <button className="btn btn-ghost btn-sm" title="QR" onClick={() => setQrAsset(a)}>◫</button>
                        <button className="btn btn-ghost btn-sm" title="수정" onClick={() => { setEditAsset(a); setShowModal(true); }}>✎</button>
                        <button className="btn btn-ghost btn-sm" title="삭제" style={{ color: 'var(--danger)' }} onClick={() => del(a.asset_number)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pages />
      </div>

      {showModal && <AssetModal asset={editAsset} onClose={() => { setShowModal(false); setEditAsset(null); }} onSave={() => { setShowModal(false); setEditAsset(null); load(); }} />}
      {qrAsset   && <QRModal asset={qrAsset} onClose={() => setQrAsset(null)} />}
    </div>
  );
}
