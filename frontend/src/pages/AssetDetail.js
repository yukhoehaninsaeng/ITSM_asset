import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { assetsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import AssetModal from '../components/common/AssetModal';
import QRModal from '../components/common/QRModal';

const SB = { 'In Use':'badge badge-in-use','In Stock':'badge badge-in-stock','Maintenance':'badge badge-maintenance','Retired':'badge badge-retired','Lost':'badge badge-lost' };
const SL = { 'In Use':'사용 중','In Stock':'재고','Maintenance':'유지보수','Retired':'폐기','Lost':'분실' };
const CL = { Hardware:'하드웨어',Software:'소프트웨어',Network:'네트워크',Peripheral:'주변기기',Furniture:'가구',Vehicle:'차량',Other:'기타' };

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ width: 150, flexShrink: 0, fontSize: 13, color: 'var(--text-2)' }}>{label}</div>
    <div style={{ fontSize: 13, color: value ? 'var(--text-1)' : 'var(--text-3)' }}>{value || '—'}</div>
  </div>
);

const fmt = d => d ? format(new Date(d), 'yyyy년 MM월 dd일', { locale: ko }) : null;

export default function AssetDetail() {
  const { assetNumber } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset]     = useState(null);
  const [scans, setScans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showQR, setShowQR]   = useState(false);

  const load = async () => {
    try {
      const [a, s] = await Promise.all([
        assetsAPI.get(assetNumber),
        assetsAPI.scans(assetNumber),
      ]);
      setAsset(a.data);
      setScans(s.data);
    } catch {
      toast.error('자산을 찾을 수 없습니다');
      navigate('/assets');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [assetNumber]); // eslint-disable-line

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-3)' }}>불러오는 중...</div>
  );
  if (!asset) return null;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, fontSize: 13, color: 'var(--text-3)' }}>
        <button onClick={() => navigate('/assets')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 13, padding: 0 }}>자산 목록</button>
        <span>›</span>
        <span>{asset.asset_number}</span>
      </div>

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="mono">{asset.asset_number}</span>
            <span className={SB[asset.status] || 'badge'}>{SL[asset.status] || asset.status}</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{asset.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowQR(true)}>◫ QR 코드</button>
          <button className="btn btn-primary" onClick={() => setShowEdit(true)}>✎ 수정</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }} className="detail-grid">
        {/* Info cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">기본 정보</span></div>
            <div className="card-body">
              <Row label="카테고리"   value={CL[asset.category] || asset.category} />
              <Row label="제조사"     value={asset.manufacturer} />
              <Row label="모델"       value={asset.model} />
              <Row label="시리얼 번호" value={asset.serial_number} />
              <Row label="구매일"     value={fmt(asset.purchase_date)} />
              <Row label="보증 만료일" value={fmt(asset.warranty_expiry)} />
              <Row label="설명"       value={asset.description} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">위치 및 배정</span></div>
            <div className="card-body">
              <Row label="위치"     value={asset.location} />
              <Row label="부서"     value={asset.department} />
              <Row label="담당자"   value={asset.assigned_user_name} />
              <Row label="담당자 이메일" value={asset.assigned_user_email} />
              <Row label="비고"     value={asset.notes} />
            </div>
          </div>
        </div>

        {/* Scan log */}
        <div className="card" style={{ position: 'sticky', top: 24 }}>
          <div className="card-header">
            <span className="card-title">스캔 이력</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{scans.length}건</span>
          </div>
          {scans.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>스캔 기록 없음</div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {scans.map((s, i) => (
                <div key={s.id} style={{ padding: '12px 16px', borderBottom: i < scans.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>◫</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{s.action}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>{s.user_name || '알 수 없음'} · {s.location || '위치 미기록'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{format(new Date(s.scan_time), 'yyyy.MM.dd HH:mm', { locale: ko })}</div>
                    {s.notes && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3, fontStyle: 'italic' }}>{s.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && <AssetModal asset={asset} onClose={() => setShowEdit(false)} onSave={() => { setShowEdit(false); load(); }} />}
      {showQR   && <QRModal asset={asset} onClose={() => setShowQR(false)} />}

      <style>{`@media(max-width:900px){.detail-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
