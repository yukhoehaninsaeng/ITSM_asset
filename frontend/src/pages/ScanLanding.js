import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const SC = { 'In Use':'#2e9e6b','In Stock':'#3b7dd8','Maintenance':'#e8972c','Retired':'#8c96a3','Lost':'#d94f3d' };
const SL = { 'In Use':'사용 중','In Stock':'재고','Maintenance':'유지보수','Retired':'폐기','Lost':'분실' };

export default function ScanLanding() {
  const { assetNumber } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/api/qr/info/${assetNumber}`)
      .then(r => setAsset(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [assetNumber]);

  const color = asset ? (SC[asset.status] || '#293e40') : '#293e40';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #111e1f 0%, #1a292b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380,
        boxShadow: '0 24px 60px rgba(0,0,0,.35)', overflow: 'hidden',
      }}>
        {/* Color bar */}
        <div style={{ height: 5, background: loading ? '#dde1e6' : color }} />

        <div style={{ padding: '24px 24px 28px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
            <div style={{ width: 30, height: 30, background: '#1a292b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>A</div>
            <span style={{ fontWeight: 700, color: '#1a292b', fontSize: 14 }}>AssetFlow</span>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#8c96a3' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>◫</div>
              자산 정보를 불러오는 중...
            </div>
          )}

          {notFound && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⊘</div>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>미등록 자산</h2>
              <p style={{ color: '#5a6472', fontSize: 13, lineHeight: 1.6 }}>
                <strong>{assetNumber}</strong>은<br />
                시스템에 등록되지 않은 자산입니다.
              </p>
              <button onClick={() => navigate('/login')} style={{
                marginTop: 20, width: '100%', padding: 13, background: '#1a292b',
                color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
              }}>로그인하여 등록하기</button>
            </div>
          )}

          {asset && (
            <>
              {/* Status */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: color + '18', color, padding: '4px 12px',
                borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 14,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {SL[asset.status] || asset.status}
              </div>

              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{asset.name}</h1>
              <span style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 12, color: '#8c96a3', background: '#f0f2f4', padding: '2px 7px', borderRadius: 4 }}>
                {asset.asset_number}
              </span>

              {/* Info list */}
              <div style={{ marginTop: 20 }}>
                {[
                  ['카테고리', asset.category],
                  ['위치', asset.location],
                  ['부서', asset.department],
                  ['담당자', asset.assigned_user_name],
                  ['제조사', asset.manufacturer],
                  ['모델', asset.model],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderBottom: '1px solid #f0f2f4',
                  }}>
                    <span style={{ fontSize: 13, color: '#8c96a3' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/login', { state: { redirect: `/assets/${asset.asset_number}` } })}
                style={{
                  marginTop: 24, width: '100%', padding: 13,
                  background: '#1a292b', color: '#fff', border: 'none',
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 14, fontWeight: 600,
                }}>
                로그인하여 상세 관리 →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
